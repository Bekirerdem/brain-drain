---
title: Koza-L1 — Avalanche L1 toolkit, deployment lessons
tags: [avalanche, l1, koza, foundry, hackathon-veteran, war-story]
created: 2026-04-12
updated: 2026-04-29
sources: [Koza-L1 Sprint 1+2 sessions, March-April 2026]
---

# What Koza-L1 is

A toolkit I shipped on Avalanche Fuji + Cloudflare Pages for spinning up an Avalanche L1 (Subnet-EVM) end-to-end. Five contract templates, an opinionated deployment script, and a frontend that walks the operator through the deploy in a guided flow.

- **Repo:** `github.com/Bekirerdem/Koza-L1`
- **Frontend:** `koza.bekirerdem.dev` (Cloudflare Pages, auto-deploy on `main`)
- **Verified contract on Fuji:** KGAS gas token at `0x9e7...3bC` (Sprint 1, deploy 2026-03-22)
- **Status as of 2026-04-29:** Sprint 1 live (KGAS verified), Sprint 2 ERC-721 template ready, ERC-721 frontend deploy queued

## Templates that ship

| Slot | Template | Purpose | Verified on Fuji |
| :-- | :-- | :-- | :-- |
| 1 | KGAS | Custom gas token (replaces native AVAX on the L1) | ✅ |
| 2 | ICM Relayer config | Cross-chain message routing setup | partial |
| 3 | ChainBounty App-Chain bootstrap | Reference deploy for the Build Games 2026 bounty L1 | ⏳ |
| 4 | Education-themed L1 | shavaxre's Soulbound roadmap target | ⏳ |
| 5 | DAO governance L1 | OpenZeppelin Governor + Timelock template | ⏳ |

## Why I built it

After three Subnet-EVM deploys done by hand for ChainBounty, shavaxre, and a Koza DAO test net, I realised 80% of the mistakes were in the same five places: validator stake math, KGAS bootstrap idempotency, ICM relayer config, deploy ordering, and explorer verification (see [routescan-endpoint-trick]). Koza-L1 packages the disciplined version of all five so the next deploy doesn't repeat them.

## Validator stake math — the off-by-one trap

Subnet-EVM with N validators wants the staking ratios in `chainConfig.json` to match the validator count exactly. The Avalanche docs imply the system is permissive; in practice it is not.

```json
// chainConfig.json — N=5 validators, total stake 5 AVAX (testnet)
{
  "config": {
    "chainID": 99999,
    "feeConfig": {
      "gasLimit": 8000000,
      "minBaseFee": 25000000000,
      "targetGas": 15000000,
      "baseFeeChangeDenominator": 36,
      "minBlockGasCost": 0,
      "maxBlockGasCost": 1000000,
      "targetBlockRate": 2,
      "blockGasCostStep": 200000
    }
  },
  "alloc": {
    "0xValidator1": { "balance": "0x52B7D2DCC80CD2E4000000" },
    "0xValidator2": { "balance": "0x52B7D2DCC80CD2E4000000" },
    "0xValidator3": { "balance": "0x52B7D2DCC80CD2E4000000" },
    "0xValidator4": { "balance": "0x52B7D2DCC80CD2E4000000" },
    "0xValidator5": { "balance": "0x52B7D2DCC80CD2E4000000" }
  }
}
```

What breaks if you copy this with `N=4` validators in `subnet-evm` config but `N=5` allocations: the L1 boots, validators sync, but block 1 contains a stake-quorum check that silently rejects the genesis. The chain hangs on block 0; no error logs above debug level.

What I do now:

```bash
# Compute everything from a single source of truth
N=5
STAKE_PER_VALIDATOR=1000000000000000000  # 1 AVAX in wei
TOTAL_STAKE=$((N * STAKE_PER_VALIDATOR))

# generate matching chainConfig.alloc + subnet-evm validator-config
node scripts/genesis-from-validator-count.js --n=$N --stake=$STAKE_PER_VALIDATOR
```

The `genesis-from-validator-count.js` script is in the toolkit; it emits both files from the single (`N`, `STAKE_PER_VALIDATOR`) tuple, so they cannot drift.

## KGAS bootstrap is not idempotent — the avalanche delete dance

If a deployment script half-runs (validators funded but KGAS contract deploy fails), restarting from scratch is not idempotent. The L1 has reserved the chainId on the local Avalanche CLI's metadata; redeploying with the same id throws `subnet 'koza-l1' already exists` and the partial state cannot be recovered.

The full reset I now bake into a script:

```bash
#!/bin/bash
# scripts/reset-l1.sh
set -euo pipefail

L1_NAME="koza-l1"
KEY_NAME="koza-deployer"

echo "[reset] removing local subnet-evm state..."
avalanche subnet delete "$L1_NAME" --force || true

echo "[reset] removing local avalanche keys..."
avalanche key delete "$KEY_NAME" --force || true

echo "[reset] clearing avalanche-cli config..."
rm -rf ~/.avalanche-cli/subnets/"$L1_NAME"
rm -rf ~/.avalanche-cli/keys/"$KEY_NAME".pk

echo "[reset] done. Run scripts/deploy-l1.sh next."
```

Three things you must `rm -rf` that the CLI's `delete` does not touch:

1. `~/.avalanche-cli/subnets/<L1_NAME>` — the genesis + validator metadata.
2. `~/.avalanche-cli/keys/<KEY_NAME>.pk` — the deployer key file (required because re-deploy reuses the key by name).
3. `~/.avalanche-cli/configs/<L1_NAME>.config` — only present if the user opened the network config UI; safe to nuke.

If you skip step 3 the next deploy may inherit stale config values that contradict your fresh `chainConfig.json`.

## ICM relayer trap — pin every RPC

`awm-relayer` (the Avalanche Warp Messaging relayer; ICM is the rebrand) reads its config from a JSON file with one block per source/destination chain. Each block has an `--rpc-endpoint` field. If you let it default to `localhost`, it silently drops cross-chain messages once the L1 is published, because the relayer instance is no longer on the same machine that runs the local node.

```json
// awm-relayer-config.json
{
  "p-chain-api-url": "https://api.avax-test.network",
  "info-api-url": "https://api.avax-test.network",
  "source-blockchains": [
    {
      "subnet-id": "...",
      "blockchain-id": "...",
      "vm": "evm",
      "rpc-endpoint": {
        "base-url": "https://l1-rpc.koza.bekirerdem.dev"
      },
      "ws-endpoint": {
        "base-url": "wss://l1-rpc.koza.bekirerdem.dev"
      }
    }
  ],
  "destination-blockchains": [
    {
      "subnet-id": "11111111111111111111111111111111LpoYY",
      "blockchain-id": "...C-Chain blockchain id...",
      "vm": "evm",
      "rpc-endpoint": {
        "base-url": "https://api.avax-test.network/ext/bc/C/rpc"
      }
    }
  ]
}
```

Three things to pin explicitly per chain block:

1. `rpc-endpoint.base-url` — never let it default; if the relayer can't dial out, ICM messages silently queue forever.
2. `ws-endpoint.base-url` — for sub-second confirmation pickup; HTTPS-only relayer falls back to polling.
3. `signing-subnet-id` for source blockchains where the relayer signs aggregated messages.

The trap I personally hit: I ran the local relayer fine with default localhost values, then deployed the L1 to Fuji and wondered for an hour why ChainBounty's bounty-paid messages weren't reaching the App-Chain. The relayer was happily pointing at `127.0.0.1:9650` on a server that didn't have a node.

## Foundry deploy sequence — the six-step recipe

This is what I now run end-to-end for a fresh L1:

```bash
# 1. Reset any previous state
bash scripts/reset-l1.sh

# 2. Generate genesis from validator count
node scripts/genesis-from-validator-count.js --n=5 --stake=1000000000000000000

# 3. Create + deploy L1 via avalanche-cli
avalanche subnet create koza-l1 --evm --genesis genesis.json
avalanche subnet deploy koza-l1 --fuji --custom-vm-id evm

# 4. Fund the deployer on the L1 with KGAS native gas
cast send --rpc-url $L1_RPC \
  --private-key $TREASURY_KEY \
  $DEPLOYER_ADDR --value 100ether

# 5. Deploy KGAS, ERC-721, and other Sprint contracts
forge script script/Deploy.s.sol \
  --rpc-url l1 \
  --broadcast \
  --verify   # uses Routescan v2 — see routescan-endpoint-trick

# 6. Start ICM relayer with the pinned config
awm-relayer --config-file awm-relayer-config.json
```

Each step is idempotent given step 1, so partial failures don't poison the next attempt.

## What broke during the actual KGAS deploy on 2026-03-22

The verified KGAS at `0x9e7...3bC` is the Sprint 1 milestone. Getting it verified took:

- 1h on validator stake mismatch (chainConfig had N=5, subnet-evm had N=4).
- 3h on Routescan endpoint silence (see [routescan-endpoint-trick]).
- 30 min on `forge create` constructor args mis-encoded.
- 20 min waiting for Cloudflare Pages to serve the updated frontend with the new contract address.

Total cycle for "first verified contract on a freshly deployed L1": ~5 hours. With the toolkit + scripts, the same flow is 25 minutes for repeat deploys.

## What I'd do differently for Sprint 2

- Move the validator stake math into a Foundry script so it's part of the same `forge` workflow as contract deploy. Two scripts → one script.
- Spin up a backup ICM relayer in a Cloudflare Workers cron — currently we have one Cloud Run instance, single point of failure.
- Auto-verify in `forge script --broadcast --verify` flow rather than separate `forge verify-contract` calls. Saves the constructor-args dance.
- Cloudflare Pages preview deploys per branch; right now only `main` deploys, which makes UI iteration painful when the frontend has the contract address baked in.

## Cross-references

- [routescan-endpoint-trick] — the verification gotcha that bit me on Sprint 1 day 1.
- [chainbounty-icm-pattern] — applies the same ICM relayer config pattern for cross-chain bounty payouts.
- [foundry-vs-hardhat-2026] — why the deploy script lives in Foundry rather than Hardhat.
- [shavaxre-soulbound-roadmap] — Sprint 4 of the toolkit targets the education L1 template that shavaxre would consume.

## Repo

`github.com/Bekirerdem/Koza-L1` — Sprint 2 ERC-721 ready, KGAS verified Fuji `0x9e7...3bC`, frontend at `koza.bekirerdem.dev` (Cloudflare Pages auto-deploy from `main`).
