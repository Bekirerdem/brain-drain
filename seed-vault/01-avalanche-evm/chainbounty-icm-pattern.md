---
title: ChainBounty — cross-chain bounty payouts via Avalanche ICM
tags: [avalanche, icm, chainbounty, hackathon-veteran, cross-chain, war-story]
created: 2026-02-15
updated: 2026-03-30
sources: [Avalanche Build Games 2026 submission]
---

# What ChainBounty is

A cross-chain bounty payout protocol I shipped for Avalanche Build Games 2026. Bounty issuers post on the C-Chain (the high-liquidity main chain everyone's wallet already lives on), bounty hunters claim on a dedicated App-Chain (a custom Subnet-EVM L1 with low fees and isolation), and Avalanche Inter-Chain Messaging — ICM, the rebrand of AWM/Teleporter — bridges the bounty token between the two chains automatically when a hunter submits proof.

Stack: Foundry contracts, Next.js + Wagmi frontend, an `awm-relayer` instance running between C-Chain and the App-Chain, deployed on Fuji testnet for the hackathon submission and ready for mainnet.

- **Repo:** `github.com/Bekirerdem/ChainBounty`
- **Submission:** Avalanche Build Games 2026 Foundry track
- **Status:** Fuji-deployed, mainnet-config ready

## The problem the architecture solves

Bounty issuers and bounty hunters want different things from a chain.

- **Issuers** want low fees on every bounty post (each post is a transaction; an issuer running 50 bounties/month does not want to pay $5 per post on C-Chain mainnet) and they want isolation — the bounty escrow contract should not share the same fee market as a memecoin DEX.
- **Hunters** want their reward to land somewhere they already hold a wallet, where they can swap or off-ramp immediately. That's C-Chain, not a niche subnet.

A naive design picks one side and loses the other. ChainBounty's two-chain ICM design picks both: post cheaply on the App-Chain (or post cheaply on C-Chain, both directions are supported), claim where you already are, and the relayer moves the bounty token across atomically when proof is verified.

## The ICM message flow

```
Issuer (C-Chain)
  ├─ deploy() bounty contract on C-Chain
  ├─ fund() bounty with USDC
  └─ emit BountyPosted(bountyId, hash)

awm-relayer
  ├─ subscribe to BountyPosted on C-Chain
  └─ forward to BountyMirror on App-Chain

App-Chain
  └─ BountyMirror.register(bountyId, hash)

Hunter (App-Chain)
  ├─ submit proof → BountyMirror.claim(bountyId, proof)
  └─ emit BountyClaimed(bountyId, hunterAddr)

awm-relayer
  ├─ subscribe to BountyClaimed on App-Chain
  └─ forward to bounty contract on C-Chain

C-Chain
  └─ bountyContract.disburse(hunterAddr) → USDC transfer
```

Two relays per bounty, end to end. The hunter never touches C-Chain except to receive the final disbursement.

## What I learned about ICM, by category

### Relayer ordering is not guaranteed

Two `BountyClaimed` messages from the App-Chain to C-Chain in quick succession can arrive in either order. The receiver on C-Chain *must* use a `nonce` from the source chain and refuse out-of-order messages, or a stale claim overwrites a valid one.

```solidity
mapping(uint256 => uint256) public lastNonceProcessed;

function receiveMessage(
    uint256 sourceNonce,
    uint256 bountyId,
    address hunter
) external onlyTrustedRelayer {
    require(
        sourceNonce > lastNonceProcessed[bountyId],
        "ICM: out-of-order"
    );
    lastNonceProcessed[bountyId] = sourceNonce;
    _disburse(bountyId, hunter);
}
```

The `onlyTrustedRelayer` modifier checks that the calling address is the configured ICM messenger contract, not an arbitrary EOA. ICM provides the messenger contract address via the `getBlockchainID()` precompile; never hardcode it.

### Gas on the destination is a separate problem

The receiver chain needs the receiver contract pre-funded with native gas to execute the inbound message. ICM does not pay gas for you on the destination side — the relayer pays the source-chain submission fee, but the destination-chain execution is paid by the destination contract's gas balance.

For ChainBounty I funded the C-Chain bounty contract with 0.5 AVAX at deploy time and added a `topUp()` function that accepts AVAX and emits an event. The frontend monitors that balance and warns when it drops below 0.05 AVAX, because below that level the next claim disbursement runs out of gas mid-execution and locks the bounty in a half-paid state.

### The off-chain relayer is a single point of failure

`awm-relayer` is a process that listens on one chain's RPC and submits to another's. For v0 I ran one instance on Cloud Run; if it crashed during a demo, claims sat in limbo until I restarted it.

For the hackathon submission I papered over this with a 2-minute health check + auto-restart. For v1 I plan to run two relayers in different regions, with a dedup table in the receiver contract so that if both relayers happen to deliver the same message, the second one is a no-op.

A more elegant fix would be a fully on-chain relayer using Avalanche Warp's signature aggregation, but that requires more validator coordination than a hackathon timeline allows.

### Subnet-ID vs Blockchain-ID confusion

ICM messages reference blockchains by `bytes32 blockchainId`, not by the human-friendly subnet name. The blockchain ID is *not* the same as the subnet ID; one subnet can host multiple blockchains. For ChainBounty's App-Chain there is one subnet and one blockchain, so the two IDs are 1:1, but the config still has to specify each correctly.

```bash
# Get them right from avalanche-cli after subnet deploy
avalanche subnet describe chainbounty-l1 | grep -E "Blockchain ID|Subnet ID"
```

I lost 45 minutes once because I'd hardcoded the subnet ID where the contract expected the blockchain ID. The relayer logged "no destination found" and I assumed the relayer config was wrong, when actually the contract was looking for a blockchain ID against a subnet ID input.

## The relayer config that ships

The pinned `awm-relayer-config.json` lives in `chainbounty/scripts/awm-relayer-config.json`. The structure pins every RPC endpoint explicitly; never let it default to localhost (see [`koza-l1-deployment-lessons`](./koza-l1-deployment-lessons.md) for the same rule).

```json
{
  "p-chain-api-url": "https://api.avax-test.network",
  "info-api-url": "https://api.avax-test.network",
  "source-blockchains": [
    {
      "subnet-id": "<C-Chain-subnet-id>",
      "blockchain-id": "<C-Chain-blockchain-id>",
      "vm": "evm",
      "rpc-endpoint": { "base-url": "https://api.avax-test.network/ext/bc/C/rpc" },
      "ws-endpoint":  { "base-url": "wss://api.avax-test.network/ext/bc/C/ws" }
    },
    {
      "subnet-id": "<App-Chain-subnet-id>",
      "blockchain-id": "<App-Chain-blockchain-id>",
      "vm": "evm",
      "rpc-endpoint": { "base-url": "https://chainbounty-l1.example.dev/rpc" },
      "ws-endpoint":  { "base-url": "wss://chainbounty-l1.example.dev/ws" }
    }
  ],
  "destination-blockchains": [
    /* mirror image of the above, since traffic is bidirectional */
  ]
}
```

Bidirectional traffic means each chain appears as both a source and a destination block. The relayer listens on each source's WebSocket for the configured event signatures and submits to the corresponding destination via the destination's RPC.

## Why this informs Brain Drain

ChainBounty's "off-chain relayer + on-chain settlement" pattern is conceptually identical to what Brain Drain's x402 middleware does — except Brain Drain replaces the relayer with a Helius RPC poll and the second chain with the Solana mainnet itself.

```
ChainBounty:    Source chain → relayer → destination chain → settlement event
Brain Drain:    Buyer wallet → x402 verify → Solana RPC poll → snippet release
```

The lesson that transfers cleanly: **always design the receiver to handle out-of-order or duplicate inbound messages**. In Brain Drain that means the `/api/query` endpoint is idempotent — the same `X-Payment-Signature` retried twice produces the same snippet without double-charging.

## Cross-references

- [`koza-l1-deployment-lessons`](./koza-l1-deployment-lessons.md) — same ICM relayer config pattern, deeper validator-stake context.
- [`routescan-endpoint-trick`](./routescan-endpoint-trick.md) — the verification gotcha that hit ChainBounty deploys the same way.
- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — how the cross-chain pattern translates to Brain Drain's RPC-verified flow.
- [`shavaxre-soulbound-roadmap`](./shavaxre-soulbound-roadmap.md) — sister hackathon project sharing the off-chain-event + on-chain-settle architecture.
