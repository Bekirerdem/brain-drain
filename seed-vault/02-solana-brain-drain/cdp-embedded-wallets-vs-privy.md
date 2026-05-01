---
title: Coinbase CDP Embedded Wallets vs Privy — buyer-side wallet pick
tags: [cdp, privy, wallet, brain-drain, architecture, comparison]
created: 2026-04-30
updated: 2026-05-01
sources: [Coinbase CDP TypeScript SDK README v1.48, Privy docs, Frames frames.ag landing page]
---

# Why CDP for Brain Drain (and why Frames picked Privy)

Frames — the production version of MCPay, the Cypherpunk 2025 winner — runs buyer wallets on Privy. I deliberately chose Coinbase CDP for Brain Drain. Three reasons, in order of weight.

## 1. The bounty stacks better

"Best Usage of CDP Embedded Wallets" is one of four named agentic-payments bounties at Frontier 2026. There is no equivalent bounty for Privy. From a pure prize-economics standpoint, picking CDP is a 5-figure-stack move on top of the technical preference.

This is not a small consideration when targeting four overlapping bounties (Multi-Protocol Agent + Phantom CASH + CDP Embedded + AgentPay) with a single MVP. Every primitive that gets named in the README's sponsor table needs to actually appear in the codebase.

## 2. The SDK shape

The CDP TypeScript SDK exposes server-side wallet creation as a one-liner:

```ts
import { CdpClient } from "@coinbase/cdp-sdk";

const cdp = new CdpClient();
const account = await cdp.solana.createAccount();
console.log(account.address);  // base58 Solana address
```

Three env vars set up the client:

- `CDP_API_KEY_ID` — the UUID from the JSON CDP gives you when you create a Secret API Key.
- `CDP_API_KEY_SECRET` — the Ed25519 private key (single base64 line, no PEM wrapper) from the same JSON.
- `CDP_WALLET_SECRET` — generated separately from the **Wallets → Server Wallet** page in the CDP portal, on the same page where the operator creates Solana accounts.

The Wallet Secret is the trip wire. New developers expect everything to be in the API Key JSON; in fact the Wallet Secret is a different secret with a different lifecycle, generated under a different button in the portal. Without it, every transaction signing call returns a vague auth error.

```bash
# Create CDP API Key (Secret API Key, Ed25519) → JSON downloads
# Open JSON: copy "id" → CDP_API_KEY_ID, "privateKey" → CDP_API_KEY_SECRET
# Then: CDP portal → Wallets → Server Wallet → Wallet Secret → Generate
# Copy the value that appears once → CDP_WALLET_SECRET
```

If you regenerate the API Key, the existing Wallet Secret keeps working — they are independent. If you regenerate the Wallet Secret, all existing programmatic accounts on this CDP project are orphaned (their custody is bound to the previous Wallet Secret). Don't regenerate idly.

## 3. Multisig in pure TypeScript

CDP supports programmatic 2-of-N multisig wallets via MPC, in pure TypeScript:

```ts
const multisig = await cdp.solana.createMultisigAccount({
  threshold: 2,
  signers: [
    buyerAccountAddress,
    sellerAccountAddress,
    judgeAccountAddress,  // LLM-controlled key for v1 dispute resolution
  ],
});
```

For Brain Drain v1's dispute escrow flow, this means we ship trustless escrow **without writing a single line of Rust** (see [`anchor-free-solana-pattern`](./anchor-free-solana-pattern.md) for the full argument). Privy's primitives do not extend this far; they are a frontend embedded wallet for human users, not a programmable MPC-as-a-service.

## What Privy still wins on

Privy's UX is famously the smoothest in the embedded-wallet space. The reasons it dominates the human-facing market are real:

- **Login UX.** Email magic-link, Apple/Google OAuth, Discord OAuth, all wired up by default. CDP's buyer flows are server-side; the human-facing onboarding has to be built separately.
- **Embedded React components.** Privy ships React hooks (`<PrivyProvider>`, `useWallets`, `useLogin`) that drop straight into a Next.js app. CDP's client-side surface is more minimal; you build the UI.
- **Multi-chain abstraction.** Privy supports EVM and Solana behind a unified API. CDP forces you to pick one (`cdp.solana` vs `cdp.evm`) per call. For a multi-chain app, Privy is friendlier.

Brain Drain's primary user is an AI agent, not a human. The agent's "wallet" is a programmatic CDP account created on its behalf the first time it calls `/api/query`. None of Privy's human-UX advantages matter for that user. If we ever add a "browse vaults as a human buyer" surface, I would consider Privy as the second wallet provider on that path — keeping CDP for the agent flow and Privy for the human flow, two providers cleanly separated by user type.

## Why both are MPC

Both providers handle key custody via Multi-Party Computation (MPC). The user (or agent) never holds the full private key; the key is sharded across the provider's infrastructure and the client. This is what makes both providers safer than a "user holds private key in browser" pattern (Phantom's classic flow) and what makes both providers compatible with the "agent doesn't know how to manage keys" requirement.

Specific flavours:

- **CDP** uses a server-MPC model with two shards: one held by Coinbase's TEE (trusted execution environment), one derived from your Wallet Secret. Compromising the wallet requires both.
- **Privy** uses a 2/3 threshold scheme: one share on Privy's HSM, one in the user's iframe (browser-bound), one as a recovery share. Compromising the wallet requires breaking two of three.

For agent use cases, CDP's "API Key + Wallet Secret on the server" model is closer to how an agent operator already manages credentials. For human use cases, Privy's "share in your browser" model is closer to how humans expect their wallet to behave.

## Cost comparison

Both have free tiers that cover Frontier-scale traffic.

| Provider | Free tier ceiling | Paid pricing |
| :-- | :-- | :-- |
| CDP | 1,000 wallets, 10K tx/mo | Custom enterprise pricing above that |
| Privy | 1,000 monthly active wallets, all features | $0.05 / MAW past the free tier |

Brain Drain's load over the 11-day Frontier window is well under either ceiling. Post-hackathon, both scale similarly.

## The migration that bit me on Day 0

The CDP SDK changed env-variable shapes between v1.40 and v1.48. The legacy SDK used:

```env
CDP_API_KEY_NAME=organizations/.../apiKeys/...
CDP_API_KEY_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----
```

(EC PEM-wrapped, dual fields named `name` and `privateKey`.)

The current v1.48 SDK uses:

```env
CDP_API_KEY_ID=<uuid>
CDP_API_KEY_SECRET=<ed25519-base64-no-pem>
CDP_WALLET_SECRET=<generated-separately-in-portal>
```

(Three fields, Ed25519 instead of EC.)

I scaffolded `.env.example` from the legacy docs on Day 0 morning. The CDP SDK on `npm i @coinbase/cdp-sdk@latest` fetched v1.48. The mismatch was silent: no error on import, only on the first `await cdp.solana.createAccount()` call, which returned a vague 401. Took me 25 minutes to bisect to the env shape change. Documented it then; that's why this section exists.

If you see EC PEM blocks in any tutorial mentioning `@coinbase/cdp-sdk`, the tutorial is older than v1.48. Use the new shape.

## Cross-references

- [`brain-drain-architecture-decisions`](./brain-drain-architecture-decisions.md) — decision summary including the CDP pick.
- [`anchor-free-solana-pattern`](./anchor-free-solana-pattern.md) — the multisig-in-TS pattern this enables.
- [`x402-on-solana-primer`](./x402-on-solana-primer.md) — what the CDP wallet signs.
- [`phantom-cash-seller-flow`](./phantom-cash-seller-flow.md) — the seller side that receives what CDP sends.
- [Frames live product](https://frames.ag) — the Privy-based competitor; useful to compare differences in deployed UX.
