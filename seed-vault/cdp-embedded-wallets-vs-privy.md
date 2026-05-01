---
title: Coinbase CDP Embedded Wallets vs Privy — buyer-side wallet pick
tags: [cdp, privy, wallet, brain-drain]
created: 2026-04-30
---

# Why CDP for Brain Drain

Frames (the production version of MCPay) runs buyer wallets on Privy. I deliberately chose Coinbase CDP for Brain Drain — for three reasons.

## 1. The bounty stacks better

"Best Usage of CDP Embedded Wallets" is one of four agentic-payments bounties at Frontier 2026. Privy is a reasonable wallet provider but doesn't have an equivalent named bounty in this hackathon. Picking CDP is a $X-bounty-stack move, not just a technical preference.

## 2. The SDK shape

CDP's TypeScript SDK exposes server-side wallet creation as a one-liner:

```ts
import { CdpClient } from "@coinbase/cdp-sdk";
const cdp = new CdpClient();
const account = await cdp.solana.createAccount();
```

Three env vars: `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET`. The Wallet Secret is generated separately in the CDP portal under Wallets → Server Wallet → Wallet Secret (Generate). API keys come from the Secret API Key flow as Ed25519, not the legacy EC PEM format.

## 3. Multisig in pure TypeScript

For dispute escrow flows (post-MVP roadmap), CDP supports programmatic 2-of-3 multisig wallets entirely in TypeScript via MPC. No Anchor program needed. This is the same trick that lets me ship Brain Drain without Rust.

## What I gave up

Privy's UX is famously the smoothest in the embedded-wallet space — the human-friendly login flow that Frames uses for non-crypto-native users. Brain Drain's primary user is an AI agent, not a human, so that UX advantage doesn't apply. If we ever add a "browse vaults as a human buyer" surface, I'd consider Privy as the second wallet provider on that path.

## The 3-secret pitfall

Newer CDP keys download as JSON with `id` and `privateKey`. The legacy SDK examples reference `name` and `privateKey`. I migrated the env names to the new shape (`CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`) on Day 0 to match `@coinbase/cdp-sdk` v1.48+.
