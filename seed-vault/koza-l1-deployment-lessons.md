---
title: Koza-L1 — Avalanche L1 toolkit, deployment lessons
tags: [avalanche, l1, koza, foundry, hackathon-veteran]
created: 2026-04-12
updated: 2026-04-29
---

# What Koza-L1 is

A toolkit I shipped for spinning up Avalanche L1s end-to-end: 5 contract templates (ERC-20, ERC-721, KGAS gas token, Subnet-EVM bootstrap, ICM relayer), a Cloudflare Pages frontend at `koza.bekirerdem.dev`, and a Foundry-based deployment script that handles validator funding, subnet creation, and contract verification in one pass.

## Hard lessons from the Fuji deployment

**Validator stake size matters more than the docs admit.** Subnet-EVM with 5 validators at 1 AVAX each works on testnet, but mainnet requires the staking ratios in `chainConfig.json` to match the validator count exactly — off-by-one and the network bricks at block 1.

**KGAS gas token bootstrap is not idempotent.** If a deployment script half-runs (e.g., funded validators but failed to deploy the gas token), restarting from scratch needs `avalanche subnet delete` + `avalanche key delete` cycle. There is no resume.

**ICM relayer is the trap.** The `awm-relayer` config wants `--rpc-endpoint` per subnet. If you let it default to localhost, it silently drops cross-chain messages once the L1 is published. Always pin RPC URLs explicitly to the published L1 endpoints.

## Why this informs Brain Drain

Koza-L1 was where I learned to keep deployment scripts idempotent and the wallet-and-key plumbing strict. Brain Drain reuses that discipline: every CDP wallet creation goes through a deterministic seed function so a re-run never duplicates wallets, and every Solana SPL transfer is verified via Helius before the API releases the snippet.

## Repo

`github.com/Bekirerdem/Koza-L1` — Sprint 2 ERC-721 ready, KGAS verified on Fuji.
