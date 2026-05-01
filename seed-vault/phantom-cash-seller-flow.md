---
title: Phantom Cash for sellers — the bounty wedge
tags: [phantom, phantom-cash, brain-drain, bounty]
created: 2026-04-30
---

# What Phantom Cash actually is

A consumer-facing tab inside Phantom mobile that surfaces USDC and other Solana stablecoins as a single "USD balance". It's not a separate token — `Cash` aggregates SPL stablecoin holdings in the wallet's primary Solana account. When USDC lands at the address, the Cash balance ticks up automatically.

## What it isn't

- Not the FINTRAC-licensed `mcpay.io` (MediaCube YouTube creator app — same name, completely unrelated).
- Not the Phantom Visa card on its own — the card needs KYC and Stripe/Bridge fiat rails. In Turkey those off-chain rails are restricted but the on-chain receive/swap features all work without KYC.
- Not Phantom-token-only. Any USDC SPL transfer to the wallet's mainnet Solana address shows up in Cash.

## Why this is Brain Drain's wedge

MCPay (now Frames) ships on Privy embedded wallets and does not target the Phantom Cash bounty. CORBITS targets merchant dashboards. The "Best Use of Phantom CASH" bounty is therefore wide open for a project where the seller's natural surface is Cash.

Brain Drain settles every paid query directly to my Phantom Cash address. Demo videos show the Cash balance ticking from $0.00 → $0.05 → $0.15 in real time as the agent fires queries. That's the single image that wins the Phantom bounty.

## Activation in Turkey

```
Settings → Developer Settings → Developer Mode + Testnet Mode (for dev)
Bottom nav → Cash tab (mainnet only) → set Phantom Tag → done
```

The Cash tab is hidden in testnet mode (consumer features show only on mainnet). New devs always trip on this.

## Address surfaced in the project

`SELLER_SOLANA_ADDRESS` in `.env.local` is just a mainnet Solana address. The Phantom Tag (`@l3eksS` in my case) is optional and only used as a friendlier display in the seller dashboard.
