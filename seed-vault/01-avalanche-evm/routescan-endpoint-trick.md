---
title: Routescan endpoint quirk on Avalanche + Foundry
tags: [avalanche, foundry, verification, gotcha, war-story]
created: 2026-03-22
updated: 2026-04-29
sources: [koza-l1 deployment session 2026-03-22]
---

# The bug

Verifying contracts on Avalanche Fuji or mainnet with Foundry fails silently if `foundry.toml`'s `etherscan` block points at the legacy `snowtrace.io` endpoint while using a Routescan-issued API key (the ones prefixed with `rs_`). The verification command exits 0, the explorer shows `Source code not verified`, and `forge` gives no actionable error.

The fix is one line in `foundry.toml`. Finding that one line cost me an entire afternoon on the Koza-L1 KGAS deployment.

## The exact failure mode

```bash
$ forge verify-contract \
    --chain fuji \
    --etherscan-api-key $ROUTESCAN_API_KEY \
    0x9e7...3bC \
    src/KGAS.sol:KGAS

Start verifying contract `0x9e7...3bC` deployed on fuji
Submitting verification of contract...
Submitted contract for verification:
        Response: `OK`
        GUID: `i...nvalid-base64-blob...==`
        URL: https://testnet.snowtrace.io/address/0x9e7...3bC
```

It says `OK`. It says `Submitted`. It returns a GUID. None of these mean anything happened. The GUID isn't a valid Routescan job id; the URL points to an explorer page that will never show verified source.

If you then `forge verify-check`:

```bash
$ forge verify-check --chain fuji $GUID
[⠊] Checking verification status of `i...invalid-base64-blob...==`
Error: Failed to verify contract: status code 404 Not Found
```

That's where the silence breaks. The GUID was always invalid; the original submission was rejected upstream of the queue and Foundry interpreted "OK with body" as success.

## What works (paste this into `foundry.toml`)

```toml
[profile.default]
src = "src"
test = "test"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"   # pin — do not let Foundry auto-detect for verify
optimizer = true
optimizer_runs = 200
evm_version = "paris"     # avoid PUSH0 unless your L1 supports it

[rpc_endpoints]
fuji = "https://api.avax-test.network/ext/bc/C/rpc"
avalanche = "https://api.avax.network/ext/bc/C/rpc"

[etherscan]
fuji = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan" }
avalanche = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan" }
```

Three things matter together:

1. The `url` is the Routescan v2 etherscan-shim URL with the chain id (`43113` Fuji, `43114` C-Chain mainnet) embedded in the path.
2. `solc_version` is pinned. Routescan's verifier accepts only a discrete list of compiler versions; if Foundry auto-detects `0.8.30+commit.abcdef.Linux.gcc` and Routescan only knows `0.8.28+commit.7893614a.Linux.g++`, verification rejects without a useful message.
3. `evm_version` is set explicitly. Subnet-EVM forks may or may not support `paris`'s PUSH0 opcode; `forge build` happily emits PUSH0 if it auto-detects, then Routescan tries to compile with the same evm_version and either fails or silently produces a different bytecode hash.

## What does not work, ranked by how much time I lost on each

| Attempted fix | Time wasted | Result |
| :-- | --: | :-- |
| Switching API key on snowtrace.io endpoint | 25 min | Same silent OK + invalid GUID |
| `forge flatten src/KGAS.sol > flat.sol` then verifying flattened | 40 min | Flattening succeeds; verify still rejects |
| `--watch` flag on `forge verify-contract` | 15 min | Watches an invalid GUID forever |
| Passing `--num-of-optimizations 200` explicitly | 10 min | Foundry already passes it; redundant |
| Manual upload through Snowtrace's web form | 30 min | Form is stale; rejects all submissions |
| Manual upload through Routescan's web form | 20 min | Worked! But not what the CLI was supposed to do |
| Switching to `--verifier sourcify` | 35 min | Sourcify works, but it's a different verifier; explorer shows "Sourcify verified" not "Source code verified" |

The total on a fresh build: ~3 hours. The diff that fixed it was changing one URL.

## Routescan v2 vs Snowtrace — what's different under the hood

| Property | Snowtrace.io (legacy) | Routescan v2 |
| :-- | :-- | :-- |
| API key shape | 32-char hex (e.g., `7c4a5b...`) | `rs_` prefix + base58 (e.g., `rs_3xL...`) |
| Endpoint base | `https://api.snowtrace.io/api` | `https://api.routescan.io/v2/network/<env>/evm/<chainId>/etherscan` |
| Verifier path | `?module=contract&action=verifysourcecode` | Same query interface (drop-in compatible) |
| Compiler list | Outdated (newest ≈ 0.8.20) | Updated regularly (`0.8.28` works, `0.8.30` works as of April 2026) |
| Status checks | Reliable | Reliable, faster turnaround (~30s vs ~2min) |
| Subnet support | C-Chain only | C-Chain + every Routescan-indexed L1 (Beam, Dexalot, custom Subnet-EVMs) |

The drop-in compatibility is the cruel part: the Etherscan-shim API spec is identical, so an old key against the new endpoint and a new key against the old endpoint both produce HTTP 200 OK responses, just with empty/error bodies that Foundry doesn't surface.

## API key prefix history (so you know which key you have)

- **Pre-2024-Q3:** snowtrace.io issued plain hex API keys. These keys still work against `api.snowtrace.io/api` but cannot be re-issued — the snowtrace.io key portal is offline.
- **2024-Q3 onward:** snowtrace.io migrated to Routescan v2 infrastructure. New keys are issued by Routescan as `rs_<base58>`. The old hex keys continue to authenticate against the old endpoint until the legacy frontends are decommissioned (no public end-of-life date as of April 2026).
- **2025+:** Snowtrace.io frontend redirects to Routescan-powered explorers for most subnets but the API endpoint hostname still resolves and returns ambiguous responses. This is the source of the silent-failure mode.

If you see `rs_` in your key, you're on Routescan and you must use the Routescan endpoint. If you see plain hex, you're on the legacy and you should rotate to Routescan.

## How I now verify in one pass

```bash
# 0. Pin compiler in foundry.toml (above)

# 1. Build (this also produces the artefact metadata Foundry will replay)
forge build --skip script test

# 2. Deploy with --verify so verification runs in the same flight
forge create \
  --rpc-url fuji \
  --private-key $DEPLOYER_KEY \
  --verify \
  src/KGAS.sol:KGAS \
  --constructor-args 0xValidatorAddress 1000000000000000000

# 3. If --verify is missed during deploy, verify explicitly:
forge verify-contract \
  --chain fuji \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address,uint256)" 0xValidator 1000000000000000000) \
  0xCONTRACT_ADDR \
  src/KGAS.sol:KGAS
```

Two extras worth knowing:

- `--watch` is safe to use *once you have the right URL*; it polls until verification completes or genuinely fails.
- Encoding constructor args via `cast abi-encode` is more reliable than letting Foundry auto-encode them — Foundry sometimes off-by-ones the encoding for structured types and verification fails on a bytecode-hash mismatch.

## The Subnet-EVM wrinkle

For custom L1s (Koza-L1's KGAS chain, ChainBounty's bounty-chain), the chainId in the Routescan URL must match the L1's published chainId, *not* the C-Chain id. If you used `--chain avalanche` against a non-C-Chain contract, verification rejects with "bytecode mismatch" because the L1 has different precompile addresses.

```toml
[etherscan]
koza-l1 = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/testnet/evm/<L1_CHAIN_ID>/etherscan" }
```

Replace `<L1_CHAIN_ID>` with whatever you set during `avalanche subnet create`. If you forgot what you set, `cast chain-id --rpc-url <L1_RPC>` returns it.

## Cross-references

- See [koza-l1-deployment-lessons] for the upstream context — KGAS is the gas token whose verification triggered this whole investigation.
- See [foundry-vs-hardhat-2026] for why I'm on Foundry in the first place; the Hardhat verify pipeline has a different but related set of gotchas.
- The same Routescan v2 endpoint format applies to other Routescan-indexed L1s: Beam, Dexalot, the Avalanche Foundation's testnet partners. Same `evm/<chainId>/etherscan` pattern.

## TL;DR

1. If you have an `rs_`-prefixed API key, your `foundry.toml` `etherscan.url` must be the Routescan v2 URL.
2. Pin `solc_version` and `evm_version` explicitly.
3. Use `cast abi-encode` for constructor args.
4. If verification "succeeds" but the explorer shows nothing, you are on the wrong endpoint.

This is the kind of niche, debugged-the-hard-way knowledge an AI agent cannot find on Stack Overflow. The Foundry book still cites snowtrace.io in its book-migration notes; the answer is in scattered Telegram messages and Discord threads. That's why it's worth $0.05 to retrieve.
