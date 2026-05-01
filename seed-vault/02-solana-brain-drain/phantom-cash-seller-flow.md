---
title: Phantom Cash for sellers — the bounty wedge for Brain Drain
tags: [phantom, phantom-cash, brain-drain, bounty, architecture]
created: 2026-04-30
updated: 2026-05-01
sources: [Phantom docs, Phantom mobile 2026 build]
---

# What Phantom Cash actually is

Phantom Cash is the consumer-facing tab inside the Phantom mobile wallet that surfaces USDC and other Solana stablecoins as a single aggregated "USD balance". It is **not a separate token**. The "Cash" balance reflects the wallet's primary Solana account's holdings of USD-pegged SPL tokens, summed up and displayed as a single number.

When USDC lands at the wallet's mainnet Solana address — from any source — the Cash balance ticks up automatically. There is no separate "deposit to Cash" step. The act of receiving USDC *is* depositing to Cash.

This is exactly the property Brain Drain needs.

## What it isn't

Three things Phantom Cash is *not*, that new builders sometimes assume:

1. **Not the FINTRAC-licensed `mcpay.io`.** That is MediaCube's YouTube creator fintech app, completely unrelated to Phantom or to MCPay/Frames. Same name space, different product. I personally signed up for it by accident on Day 0 of Frontier prep before realising the mistake.
2. **Not the Phantom Visa card on its own.** The Visa card is a real product but it requires KYC and Stripe/Bridge fiat rails. In Turkey those off-chain rails are restricted, but **the on-chain receive/swap features all work without KYC**.
3. **Not Phantom-token-only.** Any USDC SPL transfer to the wallet's mainnet Solana address shows up in Cash. The Cash branding is Phantom's UX surface; the underlying token is plain USDC.

## Why this is Brain Drain's bounty wedge

Frames (the C4-accelerated production version of MCPay) ships on Privy embedded wallets and **does not target the Phantom Cash bounty**. CORBITS (the other Cypherpunk 2025 x402 winner) targets merchant dashboards. Both ignore the seller-side payout surface entirely; their products are buyer-facing or tool-facing.

The "Best Use of Phantom CASH" Frontier 2026 bounty is therefore wide open for a project where the seller's natural surface is Cash. Brain Drain settles every paid query directly to the seller's Phantom Cash address. The demo video shows the Cash balance ticking from $0.00 → $0.05 → $0.15 → $0.30 in real time as the agent fires queries. That single image is the Phantom-bounty differentiator.

| Project | Buyer wallet | Seller payout | Phantom Cash use |
| :-- | :-- | :-- | :-- |
| Frames (frames.ag) | Privy | Privy | None |
| CORBITS | Various (merchant) | Merchant dashboard | None |
| **Brain Drain** | **CDP Embedded** | **Phantom Cash** | **Primary surface** |

## The full flow on the seller side

```
[ External agent makes paid query ]
                ↓
       USDC transfer on Solana
                ↓
   Buyer's CDP wallet → Bekir's mainnet Solana address
                ↓
   Helius RPC confirms the transfer (~400 ms)
                ↓
   Brain Drain API releases the snippet to the agent
                ↓
   Phantom mobile detects the new SPL balance
                ↓
   Cash tab balance increases automatically
                ↓
   Bekir sees the income in real time
```

There's no second action. No "claim", no "withdraw", no "convert to fiat". The Cash tab just shows the new number.

## Activation in Turkey — the steps that ship

Setting up the operator's Cash side from scratch:

```text
1. Install / update Phantom mobile to the 2026 build (App Store / Google Play).
2. Create or import a wallet (Solana account is created by default).
3. Bottom-nav → Cash tab. (If you don't see "Cash" or "Nakit" in the bottom nav,
   you are in Testnet mode; switch to Mainnet:
   Settings ⚙️ → Developer Settings → toggle off Testnet Mode.)
4. Inside Cash, set a Phantom Tag (a username like @beks). Optional but
   useful for human-facing receives — agents will use the bare address.
5. Done. The Cash balance starts at $0.00. Any USDC SPL transfer to the
   wallet's Solana address shows up here automatically.
```

The dev-mode quirk is that the Cash tab is hidden in Testnet mode. Phantom's product reasoning: "consumer fiat features should not show during developer testing because the numbers are not real money". Practically, this means a developer who switches to Devnet to test SOL airdrops then forgets to switch back loses the Cash tab visually until they flip the toggle. New devs trip on this consistently.

## What ships in `.env.local`

```env
SELLER_SOLANA_ADDRESS=2SUm7fDRcTDiAXK6vVMPpbpjD6JvBAudJqPBPAYMPb3L
SELLER_PHANTOM_TAG=@l3eksS
```

`SELLER_SOLANA_ADDRESS` is the mainnet Solana address — a base58 string between 32 and 44 characters. This is where every paid query's USDC settles. The buyer's CDP wallet pulls from `recipient` in the x402 invoice (which the API constructs from this env var) and sends to it.

`SELLER_PHANTOM_TAG` is the human-friendly handle, optional, only used as a friendlier display in the seller dashboard ("Bekir's vault — pay @l3eksS" rather than "pay 2SUm7…PAYMPb3L"). It is not used in the on-chain transfer — Phantom Tags resolve through Phantom's own metadata service, not through any on-chain registry.

## The KYC / fiat-card boundary

Phantom Cash splits cleanly into two feature sets:

| Feature | Requires KYC | Available in Turkey |
| :-- | :-- | :-- |
| Receive USDC SPL transfers | No | Yes |
| Send USDC to other Phantom Tags | No | Yes |
| Swap USDC to other SPL tokens (Jupiter aggregator) | No | Yes |
| Earn yield (idle USDC into yield vaults) | No | Yes |
| Phantom Visa Debit Card (physical or virtual) | Yes (KYC + Stripe) | Limited / variable |
| Bank deposits / direct fiat top-up | Yes (KYC) | Limited / variable |

Brain Drain only uses the first row. The seller's USDC accumulates in the Cash balance. They can spend it (swap to SOL, send to another wallet, off-ramp through any third-party Solana off-ramp), or leave it.

## What v1 might add

Once Brain Drain is multi-seller, sellers may want to:

1. **See per-vault earnings, not just a total.** Currently the Cash balance is wallet-wide; if a seller runs three vaults from the same address, Phantom shows the sum. v1's Brain Drain dashboard breaks it out per-vault on our side.
2. **Auto-convert to fiat.** Most sellers want USD in a bank, not USDC in Phantom. v1 can integrate a third-party off-ramp (Bridge, MoonPay) to do this automatically per threshold.
3. **Export to accounting.** Tax reporting wants per-transfer records. v1 exports a CSV by date.

None of these affect the v0 demo, which lives entirely on the in-Phantom surface.

## Why this section is in the vault

If you ask my agent "How does Brain Drain pay sellers?", this is the right answer. Generic Solana docs cover USDC SPL transfers; Phantom docs cover the Cash UX; *neither* explains the deliberate choice to use Cash as the seller surface specifically because it's the open Frontier 2026 bounty wedge that Frames and CORBITS leave on the table. That argument is a Brain Drain-specific insight, and it's exactly the kind of reasoning agents pay $0.05 to retrieve.

## Cross-references

- [`brain-drain-architecture-decisions`](./brain-drain-architecture-decisions.md) — decision #5 picks Phantom Cash for the same reason this page argues for.
- [`x402-on-solana-primer`](./x402-on-solana-primer.md) — what the buyer side does that culminates in the Cash balance ticking up.
- [`cdp-embedded-wallets-vs-privy`](./cdp-embedded-wallets-vs-privy.md) — the buyer-side wallet that funds the transfer.
- [`anchor-free-solana-pattern`](./anchor-free-solana-pattern.md) — why no on-chain code is needed between buyer and seller.
- [Phantom developer docs](https://docs.phantom.com) — official source for Cash's underlying primitives.
