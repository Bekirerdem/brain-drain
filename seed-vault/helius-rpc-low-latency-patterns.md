---
title: Helius RPC patterns for low-latency x402 settlement
tags: [helius, solana, rpc, brain-drain]
created: 2026-04-30
---

# Why Helius and not the public RPC

Public Solana mainnet RPC nodes cap at ~25 RPS per IP and rate-limit aggressively for non-commercial keys. For Brain Drain, every paid query triggers a `getSignatureStatuses` call to verify the buyer's USDC transfer. At demo throughput (3-5 queries per minute) the public RPC works; at production throughput (any) it doesn't.

Helius free tier ships 1M requests/month and ~50 RPS, which covers the entire Frontier sprint plus the post-demo soak.

## Verification call

```ts
const conn = new Connection(env.SOLANA_RPC_URL, "confirmed");
const status = await conn.getSignatureStatuses([signature]);
const slot = status.value[0]?.confirmationStatus;
if (slot !== "confirmed" && slot !== "finalized") {
  return new Response("unsettled", { status: 402 });
}
```

I use `confirmed` (one block) rather than `finalized` (~13 seconds). For $0.05 transfers the value-at-risk is too small to wait for finalisation; the optimistic confirmation is the right cost/latency trade.

## Webhook alternative for v1

Helius webhooks fire on transaction confirmation for any address you subscribe to. v1 will swap the polling pattern for a webhook-driven cache: when USDC lands at `SELLER_SOLANA_ADDRESS`, the webhook updates a Cloudflare KV entry, and the API serves the snippet from the cached state. That trims the verification latency from 400ms to ~50ms (KV read), at the cost of one extra moving piece (the webhook subscription).

## RPC URL shape

Devnet: `https://devnet.helius-rpc.com/?api-key=<KEY>`
Mainnet: `https://mainnet.helius-rpc.com/?api-key=<KEY>`

The same key works on both endpoints; flip `SOLANA_NETWORK` in env to switch. I keep both in `.env.local` and toggle with the `SOLANA_RPC_URL` value, not by changing the key.
