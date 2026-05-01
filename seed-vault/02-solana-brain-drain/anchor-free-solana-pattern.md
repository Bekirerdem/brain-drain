---
title: Anchor-free Solana program patterns for hackathon timelines
tags: [solana, anchor, brain-drain, architecture, pattern]
created: 2026-04-30
updated: 2026-05-01
---

# When you don't need a custom Anchor program

For Brain Drain, I came in with deep EVM/Foundry experience but zero shipped Anchor (Rust) programs. An 11-day Frontier sprint left no margin to learn Anchor properly — I'd be either shipping a half-broken program or shipping nothing.

The realisation that unlocked the project: **a non-trivial subset of x402-style Solana flows compose entirely from existing primitives**. SPL transfers, MPC wallets, Helius RPC verification, and the Phantom Cash receive surface together cover everything Brain Drain v0 needs. No custom program required.

This page documents what I avoided writing, what I composed instead, and what I'd add an Anchor program for in v1.

## The architecture without Anchor

```
Buyer agent (MCP client)
       │
       ▼
Coinbase CDP Embedded Wallet  ◄── created on-demand via TS SDK
       │
       │ (signs SPL token transfer instruction)
       ▼
Solana mainnet
       │  USDC SPL transfer (one tx, ~400 ms confirmation)
       │
       ▼
Helius RPC verification call  ──► confirms tx exists, confirms amount, confirms recipient
       │
       ▼
Brain Drain API releases snippet
       │
       ▼
Seller (Bekir) — Phantom Cash balance ticks up automatically
```

Five components. None of them is an Anchor program. Three of them are existing TypeScript SDKs (CDP, `@solana/web3.js`, `@solana/spl-token`). Two are HTTP services (Helius RPC, Phantom — though Phantom isn't strictly a *service* we call, the wallet just receives normally).

## What I avoided writing

### 1. A custom escrow program

The naive Brain Drain v1 design had an Anchor escrow: buyer deposits USDC into the program, program holds it until snippet is delivered, then releases. This is what most x402 demos on Ethereum end up looking like.

**Replaced by:** direct USDC SPL transfer. The "escrow" is the buyer's faith that we'll deliver the snippet; we mitigate this with replay protection (returns the same chunk for the same signature) and a small TTL window. For a $0.05 transaction, the trust assumption is acceptable.

**v1 might want this back.** A 2-of-3 multisig CDP wallet (buyer + seller + LLM judge) gives us trustless escrow without writing Solana program code — see "Multisig in pure TypeScript" below.

### 2. A custom token mint or vault

The first sketch had Brain Drain mint its own "credit token" that buyers could buy in bulk and burn for queries. Layered fee model on top.

**Replaced by:** plain USDC. Buyers pay USDC directly. No mint, no vault, no token economics, no liquidity bootstrap. The `@solana/spl-token` library handles every transfer with `createTransferInstruction`.

```ts
import { createTransferInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";

const buyerAta = getAssociatedTokenAddressSync(USDC_MINT, buyerKeypair.publicKey);
const sellerAta = getAssociatedTokenAddressSync(USDC_MINT, sellerPubkey);

const ix = createTransferInstruction(
  buyerAta,
  sellerAta,
  buyerKeypair.publicKey,
  PRICE_USDC * 1_000_000  // USDC has 6 decimals
);
```

If the recipient ATA doesn't exist, prepend a `createAssociatedTokenAccountInstruction`. Phantom creates the ATA automatically on first receive, so this is mostly a buyer-side concern, not a seller-side one.

### 3. A custom payment verifier program

Some teams write an Anchor program that *itself* verifies the payment as part of an on-chain logic flow. We don't — verification happens off-chain in our Cloudflare Worker via Helius RPC. The trust boundary moves from "the chain enforces release" to "the API enforces release after observing the chain". For a hosted service serving a hosted vault, that's the right boundary anyway.

The off-chain verifier is ~30 lines of TypeScript (see [`x402-on-solana-primer`](./x402-on-solana-primer.md) for the code). An Anchor verifier would be 200+ lines of Rust plus its own deploy / verify / IDL flow. Forty hours of work to gain nothing the off-chain version doesn't already give us.

## Multisig in pure TypeScript via CDP MPC

For v1 dispute escrow flows, CDP supports programmatic multisig wallets entirely in TypeScript. No Anchor program, no on-chain state machine, no bytecode to audit.

```ts
import { CdpClient } from "@coinbase/cdp-sdk";

const cdp = new CdpClient();

// Create a 2-of-3 multisig wallet
const multisig = await cdp.solana.createMultisigAccount({
  threshold: 2,
  signers: [
    buyerWallet.address,
    sellerWallet.address,
    judgeWallet.address,  // an LLM-controlled "judge" key
  ],
});
```

The buyer deposits into the multisig. Two of three signatures are needed to release. The judge signs based on an LLM-evaluated quality check on the snippet returned. If the snippet was good, judge + seller sign and seller withdraws. If the snippet was bad, judge + buyer sign and buyer recovers funds.

This gives Brain Drain trustless dispute escrow **without a single line of Rust**. The trade-off is we depend on Coinbase's CDP infrastructure for the MPC custody — but we already depend on it for buyer wallets, so it's not a new risk.

## The case for an Anchor program in v1

Three v1 features genuinely want an on-chain program:

**Per-seller fee distribution.** When Brain Drain becomes multi-seller, each query's fee should split (say) 90% to the seller, 10% to a Brain Drain treasury. Doing this in TypeScript means we have to be the trusted intermediary; doing it in an Anchor program makes the split trustless. Two days of Rust work, well-defined scope.

**Reputation slashing.** If a seller cheats (returns deliberately wrong snippets), their accumulated reputation badge needs to be revocable on-chain. Doable in TypeScript with our database of record, but on-chain reputation is more credible to a trustless agent.

**Streaming payments.** Pay-per-token instead of pay-per-query. Streaming requires either a payment channel or a state-channel-style program. Anchor + a tiny custom program (~150 lines) handles this; off-chain doesn't.

For v0, none of these matter. For v1 / Eternal hackathon submission, the first one (fee distribution) is the natural starting Rust project.

## What I tell other builders thinking about this

If you're staring at an Anchor program and wondering "do I need this?", run through this checklist:

1. **Does the value of the on-chain logic exceed the gas cost of running it?** For a $0.05 transaction, the answer is almost always no.
2. **Is the off-chain alternative subject to a real adversarial attack?** If your trust model already includes "the API operator is honest" (it usually does), the off-chain verifier is fine.
3. **Will the Anchor program need to be upgraded?** Each upgrade is a deploy, a verify, a security review. If you can defer the contract by two months and write it once well, do that.
4. **Are you using existing primitives (SPL, multisig, MPC) at full strength?** If you're rewriting MPC custody as an Anchor program, stop.

For Brain Drain, all four answers said "no, you don't need Anchor". For ChainBounty (where bounties are escrowed across two chains via ICM), the answer was different — Anchor / Subnet-EVM contracts were the right call there.

## Cross-references

- [`brain-drain-architecture-decisions`](./brain-drain-architecture-decisions.md) — decision matrix that landed on this approach.
- [`x402-on-solana-primer`](./x402-on-solana-primer.md) — the protocol this pattern serves.
- [`cdp-embedded-wallets-vs-privy`](./cdp-embedded-wallets-vs-privy.md) — the wallet stack that makes multisig-in-TS possible.
- [`mcp-server-architecture-for-solana`](./mcp-server-architecture-for-solana.md) — how the agent surface composes with the no-program backend.
- [`koza-l1-deployment-lessons`](../01-avalanche-evm/koza-l1-deployment-lessons.md) — the contrasting case where a custom contract was the right call.
