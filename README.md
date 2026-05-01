# Brain Drain

> An x402-gated personal knowledge marketplace where AI agents pay individual experts in USDC to query their private vaults.

Built for [Colosseum Frontier 2026](https://colosseum.com/frontier) on Solana.

---

## What it does

You upload your Obsidian (or any Markdown) vault. Brain Drain turns it into an x402-protected micro-API. When an external AI agent asks a question whose answer lives in your notes, it must pay USDC before getting the relevant snippet. Settlement happens on Solana mainnet in ~400ms; the agent uses a Coinbase CDP Embedded Wallet to auto-fund and auto-sign, and the seller (you) receives the USDC inside Phantom Cash.

## Why it matters

Open-web training data is exhausted. The most valuable knowledge lives in private vaults — researchers, engineers, lawyers, doctors. There has never been a frictionless rail for AI agents to compensate the humans whose curated notes they consume. Brain Drain inverts the economics: AI pays the source.

## Stack

- **Next.js 16** (App Router) on Vercel
- **TypeScript** end-to-end
- **Solana** mainnet for settlement (`@solana/web3.js`, `@solana/spl-token`)
- **Coinbase CDP Embedded Wallets** (`@coinbase/cdp-sdk`) for buyer-side MPC
- **x402** HTTP 402 standard for paywalled endpoints
- **Phantom Cash** for seller payouts (USDC SPL transfer)
- **Helius RPC** for low-latency settlement verification
- **Google Gemini 3 Pro** for reasoning, `gemini-embedding-001` for RAG, `gemini-2.5-flash` for cheap fallback; Anthropic Claude Haiku 4.5 optional for multi-model demo
- **MCP** server for Claude Desktop / Cursor integration

## Sponsor bounties targeted

- Best Multi-Protocol Agent (x402 + AgentPay)
- Best Use of Phantom CASH
- Best Usage of CDP Embedded Wallets
- Best AgentPay Demo
- Best x402 Integration

## Local development

```bash
bun install
cp .env.example .env.local   # then fill in keys
bun dev
```

## Status

🚧 Day 0 — initial scaffold, not yet functional. See [`docs/architecture.md`](docs/architecture.md) for the system design and [`docs/roadmap.md`](docs/roadmap.md) for the 11-day sprint plan.

## License

MIT — see [LICENSE](LICENSE).

## Author

Bekir Erdem ([@l3eksS](https://x.com/l3eksS) on X, [@Beks](https://arena.colosseum.org/u/Beks) on Colosseum). Solo build for Frontier 2026.
