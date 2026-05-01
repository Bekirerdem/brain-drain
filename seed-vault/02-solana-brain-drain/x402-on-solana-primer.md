---
title: x402 on Solana — what I learned during Frontier prep
tags: [x402, solana, agentic-payments, brain-drain, architecture]
created: 2026-04-30
updated: 2026-05-01
sources: [Coinbase x402 docs, x402.tech, Cloudflare Agents SDK]
---

# What x402 actually is

x402 is the HTTP `402 Payment Required` status code, dormant in the spec since 1996, that Coinbase formalised in May 2025 as a payment protocol for machines. The flow is symmetric and stateless:

1. Client requests a resource.
2. Server returns `402 Payment Required` with structured price metadata in headers and body.
3. Client's wallet signs an on-chain payment for the quoted amount, sends the tx, retrieves the signature.
4. Client retries the same request with the signature in an `X-Payment-Signature` header.
5. Server verifies the signature, confirms the on-chain transaction, serves the resource.

There is no session, no key, no subscription. Each request is a self-contained transaction.

## Why Solana is the settlement layer

EVM L2s settle in 2-12 seconds; Ethereum mainnet in 12-30 seconds. Solana mainnet finalises in roughly 400 milliseconds with sub-cent fees. For micropayments that's the difference between a viable agent UX and a broken one.

| Chain | Confirmation latency | Min fee per tx | Throughput |
| :-- | --: | --: | --: |
| Solana mainnet | ~400 ms | ~$0.00025 | ~3,000 TPS sustained |
| Base | ~2 s | ~$0.05 | ~1,500 TPS |
| Ethereum L1 | ~12 s | ~$0.50 | ~15 TPS |
| Polygon zkEVM | ~3 s | ~$0.01 | ~2,000 TPS |

Brain Drain charges $0.05 per snippet. On Ethereum mainnet the gas alone would be 10x the snippet price. On Base it's still 100% of the price. Only Solana lets the seller actually keep the money.

By April 2026 Solana captured roughly half of all x402 agent-to-agent transaction volume globally — Coinbase's own numbers in the Galaxy Research piece (2026-01-07). MCPay, the Cypherpunk 2025 winner, hit 370K transactions on Solana before pivoting to multi-chain (now Frames at frames.ag).

## The header shape Brain Drain ships

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
WWW-Authenticate: x402 token=USDC, network=solana, recipient=2SUm7fDR…PAYMPb3L, amount=0.05

{
  "error": "payment_required",
  "price": {
    "token": "USDC",
    "amount": "0.05",
    "decimals": 6,
    "network": "solana-mainnet",
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "recipient": "2SUm7fDRcTDiAXK6vVMPpbpjD6JvBAudJqPBPAYMPb3L"
  },
  "facilitator": "https://api.coinbase.com/x402"
}
```

Once paid, the client retries:

```http
GET /api/query?q=How+do+I+verify+Avalanche+contracts+with+Foundry%3F HTTP/1.1
X-Payment-Signature: 5yJ4...ze6Q3aL
X-Payment-Network: solana-mainnet
X-Payment-Token: USDC
```

The signature is the Solana transaction signature (base58, 88 chars). The server verifies the transaction exists, confirms it sent ≥ 0.05 USDC to the recipient address, and that the signature is sufficiently confirmed (we use `confirmed`, not `finalized`; see [`helius-rpc-low-latency-patterns`](./helius-rpc-low-latency-patterns.md)).

## Verification logic

```ts
import { Connection } from "@solana/web3.js";
import { env } from "@/lib/env";

const conn = new Connection(env.SOLANA_RPC_URL, "confirmed");

export async function verifyPayment(
  signature: string,
  expectedRecipient: string,
  expectedAmountUsdc: number,
): Promise<boolean> {
  const status = await conn.getSignatureStatuses([signature]);
  const slotInfo = status.value[0];
  if (!slotInfo) return false;
  if (slotInfo.confirmationStatus !== "confirmed" &&
      slotInfo.confirmationStatus !== "finalized") {
    return false;
  }

  const tx = await conn.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx) return false;

  // Walk the post-token-balances vs pre-token-balances delta on the
  // recipient ATA and confirm a USDC delta of >= expectedAmountUsdc.
  const recipientUsdcDelta = computeUsdcDelta(tx, expectedRecipient);
  return recipientUsdcDelta >= expectedAmountUsdc;
}
```

The `computeUsdcDelta` walks the transaction's `meta.preTokenBalances` and `meta.postTokenBalances` arrays, finds the recipient's USDC associated token account, and computes the change in `uiTokenAmount.uiAmount`. This is the only reliable way to confirm a USDC transfer in a transaction that may contain multiple instructions; you cannot just look at the top-level transfer because the buyer's wallet may bundle the payment with a CDP wallet creation or a fee.

## Replay protection

A naive verifier accepts the same `X-Payment-Signature` repeatedly, charging the buyer once but releasing the snippet many times. Brain Drain caches every accepted signature in a Cloudflare KV with a 7-day TTL:

```ts
const cached = await env.PAYMENTS_KV.get(signature);
if (cached) {
  // Already redeemed — return the same snippet (idempotent retry)
  // OR refuse if older than the snippet expiration window
}
```

The cached value is the chunk id that was returned. A retry of the same query+signature returns the same chunk; a retry of a different query with the same signature is rejected as a replay.

## What Brain Drain does *not* do that other x402 implementations do

- **Streaming payments.** Cloudflare's Agents SDK supports streaming — pay per token. Brain Drain charges a fixed $0.05 per query because the unit of value is "one retrieval", not "N tokens". Simpler to reason about, simpler to demo.
- **Multi-token pricing.** We accept USDC only. EUROe, USDP, etc. are out of scope for v0; the env has only `USDC_MINT_DEVNET` and `USDC_MINT_MAINNET` defined.
- **Dynamic pricing.** v1 may add congestion-based pricing (charge more during high-throughput windows). v0 is a static $0.05 set in `X402_DEFAULT_PRICE_USDC`.
- **Subscription mode.** Stripe-style "pay $5/mo, unlimited queries" is the antithesis of x402. We don't.

## Coinbase's facilitator vs running our own

Coinbase publishes a hosted x402 facilitator at `api.coinbase.com/x402` that handles the verification step on behalf of the merchant. There are two models:

1. **Facilitator-mediated:** the buyer pays the facilitator, who pays the merchant, taking a small fee. Lower friction, slight overhead.
2. **Direct:** the buyer pays the merchant directly, the merchant verifies on-chain themselves. No fee, more code.

Brain Drain runs **direct**. The verification code above is ~30 lines; we save the facilitator fee, we keep full control of the verification logic, and we don't depend on a third-party uptime SLA. The trade-off is we have to implement the replay-protection cache ourselves (KV write per accepted payment) — see above.

## How the demo lands

The 3-minute Frontier submission video shows this end-to-end loop in real time:

1. **0:00** — terminal: external agent calls `brain_drain.query` via MCP.
2. **0:10** — terminal shows `402 Payment Required` + price quote.
3. **0:15** — Phantom Cash mobile screen recording: balance ticks $0.00 → -$0.05 (buyer wallet, but really we're showing the payment debit on the buyer side and the credit on Bekir's seller side simultaneously via screen splits).
4. **0:30** — terminal: `200 OK` with snippet from `koza-l1-deployment-lessons` returned.
5. **0:45** — Solana explorer: transaction signature opens, USDC transfer confirmed, both addresses visible.
6. **1:00** — Phantom Cash: seller's balance ticks $0.00 → +$0.05.
7. **1:15** — repeat 2 more times with different queries to show retrieval quality, balance keeps climbing.

That sequence is the demo. Everything else in the video frames it.

## Cross-references

- [`brain-drain-architecture-decisions`](./brain-drain-architecture-decisions.md) — why x402 was chosen over alternatives.
- [`anchor-free-solana-pattern`](./anchor-free-solana-pattern.md) — how we ship without a custom Solana program.
- [`cdp-embedded-wallets-vs-privy`](./cdp-embedded-wallets-vs-privy.md) — the buyer wallet that signs these payments.
- [`phantom-cash-seller-flow`](./phantom-cash-seller-flow.md) — what happens after the USDC lands.
- [`helius-rpc-low-latency-patterns`](./helius-rpc-low-latency-patterns.md) — RPC discipline for the verification call.
- [`mcp-server-architecture-for-solana`](./mcp-server-architecture-for-solana.md) — how the x402 dance is wrapped inside MCP for the agent client.
