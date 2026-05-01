---
title: Brain Drain — architecture decisions log
tags: [brain-drain, architecture, decisions, frontier-2026]
created: 2026-04-30
updated: 2026-05-01
---

# What this file is

The single page where every component-level decision in Brain Drain is enumerated, with a one-paragraph rationale and a link to the dedicated note. If a future contributor (or a buying agent retrieving from this vault) wants the *why*, this is the entry point. The dedicated notes hold the deeper context.

The frame for each decision is the same: I had two-to-four real options, I chose one, here is what I gave up, here is what I keep.

## 1. Web framework — Next.js 16 App Router on Vercel

**Picked because** App Router co-locates the agent-facing API routes (`/api/query`, `/api/upload`) with the seller-facing dashboard pages, both running React 19 server components on the same Vercel deployment. One repo, one deploy, one runtime.

**Alternatives considered:** Hono on Cloudflare Workers (lighter, would deploy to edge faster, but the dashboard would split into a separate frontend repo); SvelteKit (smaller TypeScript footprint but Bekir's hands are warmer in React); a plain Cloudflare Worker plus static site (most performant but most plumbing).

**What we give up:** Next.js's middleware on the edge is fine but the cold-start cost on Vercel hobby tier is real for the first 402 of a quiet hour. v1 may move just `/api/query` to a Cloudflare Worker for sub-50 ms cold starts; the dashboard stays on Vercel.

## 2. Settlement layer — Solana mainnet

**Picked because** sub-cent fees and ~400 ms confirmations are the only realistic substrate for $0.05/query economics. EVM L2s settle in 2–12 seconds at $0.30 minimums; both numbers kill the agent UX. Solana is not an aspiration here, it is a constraint of what x402 micropayments require.

**Alternatives considered:** Base (cheap by L2 standards but 2-second blocks plus a $0.10 floor); a Subnet-EVM L1 (wakeful idea given Bekir's Avalanche history, but the agent ecosystem is not on Avalanche); Polygon CDK chains (similar issue).

**What we give up:** the Anchor / Rust learning curve. We sidestep this with the no-custom-program approach in [`anchor-free-solana-pattern`](./anchor-free-solana-pattern.md).

## 3. Payment standard — x402 over HTTP

**Picked because** it is the protocol Coinbase formalised in May 2025 specifically for AI agents, the protocol the Frontier hackathon is heaviest on (~$135K bounty pool), and the protocol the Cypherpunk 2025 winners (MCPay → Frames, CORBITS) standardised. Proven to win, ecosystem-aligned, with a Coinbase facilitator we can call directly.

**Alternatives considered:** L402 (Lightning Network's analogue — wrong chain); custom JWT-paywall (re-inventing the wheel); Stripe ACP (wrong universe — fiat-only).

**What we give up:** very little. x402 is the right answer for this use case in 2026.

## 4. Buyer wallet — Coinbase CDP Embedded Wallets

**Picked because** the "Best Use of CDP Embedded Wallets" bounty is one of four agentic-payments prizes at Frontier 2026; the SDK is one-line wallet creation; and CDP supports programmatic 2-of-3 multisig in pure TypeScript via MPC, which lets us sketch a v1 dispute-escrow flow without writing an Anchor program.

**Alternatives considered:** Privy — what Frames runs on, smoothest human-facing UX, no equivalent named bounty. Solana Wallet Standard (manual flow, agent has to manage seed phrase). Magic.link (not Solana-first).

**What we give up:** Privy's smoother human-onboarding flow. Brain Drain's primary user is an agent, not a human, so this matters less than it would for a consumer product. See [`cdp-embedded-wallets-vs-privy`](./cdp-embedded-wallets-vs-privy.md) for the full comparison.

## 5. Seller payout — Phantom Cash via SPL transfer

**Picked because** USDC SPL transfers to a mainnet Solana address surface natively in Phantom's Cash tab as an aggregated USD balance. No bridge, no swap, no separate withdrawal. Frames runs on Privy and does not target the Phantom Cash bounty; this is Brain Drain's clean wedge.

**Alternatives considered:** Privy with off-ramp (more steps for the seller); direct USDC to a separate mainnet Solana wallet (works but loses the "Phantom Cash demo" image); on-ramp into a bank account via MoonPay (wrong narrative, slow).

**What we give up:** advanced fiat off-ramp features that the Phantom Visa card unlocks behind KYC. The seller in Turkey can use the wallet's on-chain features without KYC; the Visa card is a future v2 layer for sellers in jurisdictions where Stripe/Bridge issues it. See [`phantom-cash-seller-flow`](./phantom-cash-seller-flow.md).

## 6. Agent surface — MCP server with one tool

**Picked because** Model Context Protocol is the wire format Claude Desktop, Cursor, OpenAI Codex, OpenCode, and OpenClaw all speak in 2026. By exposing a single MCP tool `brain_drain.query`, Brain Drain becomes addressable from every major agent client without writing one SDK per client.

**Alternatives considered:** Bare REST API only (would require each client to build their own Brain Drain integration); a custom JSON-RPC variant (re-inventing MCP); LangChain / LangGraph tool spec (locks us to one orchestrator).

**What we give up:** clients that don't speak MCP yet — but the trend is universal, and Cypherpunk-winning Frames already proved the pattern works. See [`mcp-server-architecture-for-solana`](./mcp-server-architecture-for-solana.md).

## 7. Reasoning model — Gemini 3.1 Pro Preview

**Picked because** Bekir's primary LLM is Gemini, paid quota is well covered ($10/mo Pro credits + residual $300 trial), and Gemini 3.1 Pro Preview's `thinking_level` parameter maps cleanly to our two retrieval modes (low for snippet extraction, high for cross-vault synthesis).

**Alternatives considered:** Claude Sonnet 4.6 / Haiku 4.5 (good but Bekir's cheaper-per-token-on-his-stack model is Gemini); GPT-5 (we don't use OpenAI here); local Llama (latency too high for sub-second 402 verify-and-respond cycle).

**What we give up:** nothing material. Claude Haiku 4.5 stays in the env as an opt-in for the Day 7+ multi-model demo (where the demo shows an agent paying multiple LLM providers via x402). See [`gemini-3-pro-vs-claude-haiku`](../03-agentic-stack/gemini-3-pro-vs-claude-haiku.md).

## 8. Embeddings — gemini-embedding-001

**Picked because** Gemini's free embedding tier covers the entire 1500-call/day load of the seed vault build, and using one provider for both reasoning and embeddings keeps the credentials surface minimal.

**Alternatives considered:** OpenAI `text-embedding-3-small` (cheapest, 1536 dimensions, but introduces a third API and credentials); Cohere embed v4 (good but more friction); local nomic-embed-text (fine but adds inference infrastructure).

**What we give up:** the larger 3072-dimensional vectors mean a heavier index file (5.8 MB for 152 chunks) than 1536-d would produce. At our scale this is irrelevant; at v1 scale we may revisit.

## 9. Retrieval — flat cosine similarity over a JSON index

**Picked because** at fewer than ~500 chunks, a flat scan of in-memory vectors beats the round-trip latency of any external vector database. The math is unambiguous: 500 × 3072 × 8 bytes = 12 MB held in memory, 500 dot products at 3072 each is ~5 ms on modern hardware. A round trip to a vector DB is 50-200 ms even on the same region.

**Alternatives considered:** Pinecone, LanceDB, Turbopuffer, pgvector. All overkill for v0. Some — LanceDB especially — would be a clean upgrade at v1 once we federate vaults.

**What we give up:** the ability to scale to millions of chunks without rearchitecture. v2 problem, not v0.

## 10. RAG corpus location — `seed-vault/` in the repo

**Picked because** committing the corpus to the repo (a) lets judges reproduce the demo without extra setup, (b) gives the Brain Drain narrative an evidentiary base ("here is the actual content the agent is buying"), and (c) lets the public commit history demonstrate growth and curation discipline over the 11 days.

**Alternatives considered:** corpus on S3 / Cloudflare R2 (more "production-like" but harder for jury to inspect); fully private corpus with only the index committed (consistent with "private knowledge base" narrative but the demo loses fidelity).

**What we give up:** seller content privacy. v0 is single-seller (Bekir himself). v1 introduces multi-seller flow where each seller's vault stays private and only the embeddings + access-controlled retrieval are shared. The `seed-vault/private/` gitignore line is the placeholder for that boundary.

## 11. CI / deploy

**Vercel** for the Next.js app, auto-deploy on `main`. **No GitHub Actions for v0** — Vercel's preview deploys per pull request cover the deploy-cadence need; running a separate test matrix in Actions adds setup complexity that v0 does not earn.

**Alternatives considered:** Cloudflare Pages (used for koza-l1; would work, but Vercel's Next.js integration is tighter); Netlify (legacy bias).

**What we give up:** type-check / build-status checks before merge. Compensated by `bunx tsc --noEmit` in the local pre-push routine and Vercel's own build failure visibility on each push.

## 12. Documentation surface

`docs/architecture.md` — system mermaid diagram and component breakdown.
`docs/roadmap.md` — 11-day sprint plan with milestones M1-M6.
`docs/competitive-landscape.md` — Frames / MCPay / CORBITS analysis from Colosseum Copilot.
`docs/grant-application.md` — Superteam application companion document.
`README.md` — public-facing pitch, sponsor bounty mapping, quickstart.
This vault — every decision deepened.

The split: `docs/` is for the human reader (judge, grant reviewer, contributor); `seed-vault/` is for the agent reader. Some content overlaps (this file links into both), most does not.

## Cross-references

Every decision above links to its deep-dive note. The notes link back here. New decisions update this index immediately so the file remains the live entry point.

- [`anchor-free-solana-pattern`](./anchor-free-solana-pattern.md)
- [`x402-on-solana-primer`](./x402-on-solana-primer.md)
- [`cdp-embedded-wallets-vs-privy`](./cdp-embedded-wallets-vs-privy.md)
- [`phantom-cash-seller-flow`](./phantom-cash-seller-flow.md)
- [`mcp-server-architecture-for-solana`](./mcp-server-architecture-for-solana.md)
- [`helius-rpc-low-latency-patterns`](./helius-rpc-low-latency-patterns.md)
- [`gemini-3-pro-vs-claude-haiku`](../03-agentic-stack/gemini-3-pro-vs-claude-haiku.md)
- [`build-in-public-hackathon-strategy`](../05-process/build-in-public-hackathon-strategy.md)
