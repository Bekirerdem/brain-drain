---
title: Wiki index — category catalogue
tags: [meta, index]
updated: 2026-04-30
---

# Reading order for this vault

This is the live catalogue. New categories open through [`wiki-schema`](./wiki-schema.md) section 1; new pages register here before they're linked from other notes.

If you are an external agent retrieving from this corpus through Brain Drain's `/api/query` endpoint, this file is your first hop — every other page is reachable from here in at most two links.

---

## 00-meta — How this vault works

The schema, the philosophy, the source of the philosophy. Read in this order if you are new to the vault as a system.

- [`llm-wiki-pattern`](./llm-wiki-pattern.md) — what an LLM Wiki is and why Brain Drain is built on top of one.
- [`wiki-schema`](./wiki-schema.md) — the operating rules: folder layout, naming, ingest, lint, log format. Section 1 governs new categories.
- [`karpathy-llm-wiki-source`](./karpathy-llm-wiki-source.md) — immutable summary of Andrej Karpathy's original gist. Cite this when a wiki rule is derived from the gist.

---

## 01-avalanche-evm — Avalanche, Foundry, EVM stack

Operator's deepest technical lane. Every page here is grounded in a shipped artefact: Koza-L1 (live on Fuji, KGAS verified), ChainBounty (Build Games 2026), shavaxre (education crowdfunding C-Chain).

- [`routescan-endpoint-trick`](../01-avalanche-evm/routescan-endpoint-trick.md) — the silent-failure verification gotcha that costs three hours on first encounter.
- [`koza-l1-deployment-lessons`](../01-avalanche-evm/koza-l1-deployment-lessons.md) — validator stake math, idempotency reset, ICM relayer pinning, six-step deploy recipe.
- [`chainbounty-icm-pattern`](../01-avalanche-evm/chainbounty-icm-pattern.md) — cross-chain bounty payouts using Avalanche Inter-Chain Messaging.
- [`shavaxre-soulbound-roadmap`](../01-avalanche-evm/shavaxre-soulbound-roadmap.md) — education crowdfunding with non-transferable donor reputation.
- [`foundry-vs-hardhat-2026`](../01-avalanche-evm/foundry-vs-hardhat-2026.md) — when each tool wins, and the operator's `foundry.toml` skeleton.

---

## 02-solana-brain-drain — Brain Drain core architecture

The active hackathon project. Pages here are the *spec* — what gets built, why, in what order, with what trade-offs. The companion `docs/architecture.md` and `docs/competitive-landscape.md` at repo root cover material adjacent to (but not duplicated in) these pages.

- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — index of every component-level pick, with rationale.
- [`x402-on-solana-primer`](../02-solana-brain-drain/x402-on-solana-primer.md) — what x402 is, why Solana is the settlement layer, the exact header shape we ship.
- [`anchor-free-solana-pattern`](../02-solana-brain-drain/anchor-free-solana-pattern.md) — how Brain Drain ships in 11 days without writing a custom Anchor program.
- [`cdp-embedded-wallets-vs-privy`](../02-solana-brain-drain/cdp-embedded-wallets-vs-privy.md) — why we picked Coinbase CDP for buyer wallets even though Frames runs on Privy.
- [`phantom-cash-seller-flow`](../02-solana-brain-drain/phantom-cash-seller-flow.md) — the seller payout surface and why it's the bounty wedge.
- [`mcp-server-architecture-for-solana`](../02-solana-brain-drain/mcp-server-architecture-for-solana.md) — MCP wire format, transport choices, payment flow inside the protocol.
- [`helius-rpc-low-latency-patterns`](../02-solana-brain-drain/helius-rpc-low-latency-patterns.md) — verification call shape, polling vs webhook, RPC URL conventions.

---

## 03-agentic-stack — LLM, MCP, n8n, agent orchestration

Operator's working stack outside of any one project. Pages here predate Brain Drain and inform its decisions; expect them to evolve as the stack does.

- [`gemini-3-pro-vs-claude-haiku`](../03-agentic-stack/gemini-3-pro-vs-claude-haiku.md) — when to use which, with concrete cost/latency numbers.
- [`n8n-claude-orchestration`](../03-agentic-stack/n8n-claude-orchestration.md) — the split between deterministic plumbing (n8n) and reasoning (Claude).
- [`apify-lead-gen-patterns`](../03-agentic-stack/apify-lead-gen-patterns.md) — Google Maps Scraper input shape and field cleanup discipline.

---

## 04-devops-gotchas — CI, debugging, OS cross-platform

The "things that wasted half a day before they were written down" category. Every page here pays for itself the first time the same gotcha hits a future project.

- [`npm-lock-cross-platform`](../04-devops-gotchas/npm-lock-cross-platform.md) — Windows-generated `package-lock.json` failing `npm ci` on Linux runners.
- [`binance-signature-url-ordering-bug`](../04-devops-gotchas/binance-signature-url-ordering-bug.md) — when official docs and the JavaScript example disagree, the JavaScript example wins.
- [`magic-byte-file-verification`](../04-devops-gotchas/magic-byte-file-verification.md) — never trust the file extension; verify the magic bytes.

---

## 05-process — Build-in-public, commits, portfolio

Cross-cutting workflow notes. These are how the operator works on every project, not what they work on.

- [`conventional-commits-discipline`](../05-process/conventional-commits-discipline.md) — atomic commits, conventional types, co-authorship attribution.
- [`build-in-public-hackathon-strategy`](../05-process/build-in-public-hackathon-strategy.md) — why public from Day 0, what bounties to target, when to compromise.
- [`portfolio-site`](../05-process/portfolio-site.md) — bekirerdem.dev — the Astro + Cloudflare Pages stack and what shipped.

---

## How to extend

Adding a new note:

1. Pick a category by reading this file.
2. Confirm the slug doesn't already exist (`grep -ri 'title:' seed-vault/`).
3. Create with a stub frontmatter from [`wiki-schema`](./wiki-schema.md) section 3.
4. Add a one-line entry under the right category here, with the same path style.
5. Add at least three outbound links from the new page to existing ones.
6. Run `bun run scripts/seed-vault.ts` to rebuild the embedding index.
7. Append a `log.md` entry.

Adding a new category:

1. Confirm the criteria in [`wiki-schema`](./wiki-schema.md) section 1 (≥3 candidate notes, durable scope).
2. Pick the next free numeric prefix.
3. Add a `## NN-name — short description` section here *before* writing the first page.
4. Bump the schema version if the layout rule changed.

---

## Maintenance log

Drift in this index is itself a lint concern. Most recent rebase:

- 2026-04-30 — vault forked from private Obsidian beks-vault into the public seed-vault for Brain Drain's Frontier 2026 build. Added the public-vault Markdown-link rule. Re-categorised under 00–05 numeric prefixes. Translated five Turkish-language pages into English.
