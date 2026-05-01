---
title: Anchor-free Solana program patterns for hackathon timelines
tags: [solana, anchor, brain-drain, architecture]
created: 2026-04-30
---

# When you don't need a custom Anchor program

For Brain Drain, I came in with deep EVM/Foundry experience but zero shipped Anchor (Rust) programs. An 11-day Frontier sprint left no margin to learn Anchor properly. The realisation that unlocked the project: **a non-trivial subset of x402-style Solana flows compose entirely from existing primitives**.

## What I avoid writing

- A custom escrow program — replaced by **Coinbase CDP Embedded Wallets with multisig policy**, set programmatically in TypeScript via `@coinbase/cdp-sdk`. 2-of-3 with an LLM judge as the third key gives the same trust property as an on-chain escrow.
- A custom token mint or vault — USDC SPL transfers via `@solana/spl-token`'s `createTransferInstruction` are enough.
- A custom payment verifier — Helius RPC's transaction lookup with finality > 1 confirms an SPL transfer in ~400 ms; the API just polls the signature in the `X-Payment-Signature` header.

## What I still need

- The **x402 HTTP middleware** (Hono on Cloudflare Workers, or Next.js API route).
- A **CDP wallet pool** for buyer agents that the API funds out of a treasury.
- A **Phantom Cash** payout target — just a Solana mainnet address, surfaced natively in the seller's Cash tab.

## Why this matters for the bounty stack

The "Best Use of CDP Embedded Wallets" bounty rewards exactly this composition pattern. The "Best Multi-Protocol Agent" bounty rewards the chained flow (CDP wallet → x402 verify → AgentPay settle). Both are TS-only, no Rust.

## Trade-off

I lose the option to charge dynamic per-seller fees that need on-chain logic. For v0 that's fine — the price is fixed in env (`X402_DEFAULT_PRICE_USDC=0.05`). v1 may add a tiny Anchor program for fee distribution, post-Frontier.
