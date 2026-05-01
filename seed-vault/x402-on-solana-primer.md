---
title: x402 on Solana — what I learned during Frontier prep
tags: [x402, solana, agentic-payments, brain-drain]
created: 2026-04-30
---

# What x402 actually is

x402 is the HTTP `402 Payment Required` status code, dormant since 1996, that Coinbase formalised in May 2025 as a payment protocol for machines. The server returns a 402 with structured price metadata; the client (an AI agent's wallet) signs an on-chain payment, retries the request with the signature in a header, and the server verifies and serves.

## Why Solana is the settlement layer

EVM L2s settle in 2-12 seconds. Above $0.50 per call that's tolerable; below that, the latency kills the UX. Solana mainnet finalises in ~400 ms with sub-cent fees, which is the only realistic substrate for sub-cent micropayments at agent throughput.

By April 2026 Solana captured roughly half of all x402 agent-to-agent transaction volume globally. MCPay (now Frames at frames.ag) hit 370K transactions on Solana before pivoting to a multi-chain wallet product.

## The header shape that ships

```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: x402 token=USDC, network=solana, recipient=<base58>, amount=0.05
```

```http
GET /query?q=...
X-Payment-Signature: <solana-tx-signature>
```

## Where Brain Drain fits

Most x402 projects monetise APIs, tools, or models — supply side is a company. Brain Drain inverts it: the supply side is an individual human's curated knowledge vault, and the payout lands in the seller's Phantom Cash balance. Same protocol, different economics.

## Coinbase facilitator

The Coinbase facilitator at `facilitator.mcpay.tech` (legacy) and `coinbase` CDP-native facilitator are interchangeable for verification. I use the CDP one because the same SDK creates the buyer wallets, so authentication is shared.
