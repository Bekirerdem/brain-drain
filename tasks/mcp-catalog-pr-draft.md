# solana.new MCP catalog PR — submission draft

> **Status:** ready for Bekir review. PR will be submitted to `sendaifun/solana-new` after manual sign-off.

## Goal

List **Brain Drain MCP** in solana.new's official ecosystem catalog
(`cli/data/solana-mcps.json`) so SendAI + Superteam users discover it as a
ready-to-install Solana MCP. Distribution before Day 9 hackathon submission.

## Pre-flight checklist (do these BEFORE PR)

- [ ] Make `Bekirerdem/brain-drain` repo **public** on GitHub (currently
      private per memory — supply-chain rules require public source review).
- [ ] Confirm `https://brain-drain-iota.vercel.app/api/mcp` resolves and
      returns `tools/list` correctly (run `bun scripts/test-mcp.ts list`
      locally to verify).
- [ ] Optional but recommended: tag a `v0.1.0` release on the repo so the
      PR can reference an immutable revision.

## Files to change in the fork

### 1. `cli/data/solana-mcps.json` — append entry to `mcps` array

Add this object at the **end** of the `mcps` array (before the closing `]`):

```json
{
  "id": "brain-drain-mcp",
  "name": "Brain Drain MCP",
  "repo": "Bekirerdem/brain-drain",
  "description": "Pay-per-query knowledge MCP — agents settle USDC on Solana for top-k snippets from expert markdown vaults",
  "category": "data",
  "setup_command": "claude mcp add brain-drain --transport http https://brain-drain-iota.vercel.app/api/mcp",
  "url": "https://github.com/Bekirerdem/brain-drain",
  "keywords": ["x402", "rag", "knowledge", "marketplace", "vault", "obsidian", "embeddings", "gemini", "agent", "micropayment", "data"]
}
```

Don't forget the leading comma after the previous entry's closing `}`.

### 2. `CLAUDE.md` — bump 36 → 37 in two places

Lines that need updating (per ripple map in CONTRIBUTING.md):

```diff
- Skills and knowledge base to ship on Solana — Idea to Launch. 31 journey skills, 106 repos, 78 ecosystem skills, 36 MCP servers.
+ Skills and knowledge base to ship on Solana — Idea to Launch. 31 journey skills, 106 repos, 78 ecosystem skills, 37 MCP servers.
```

```diff
-     solana-mcps.json        36 MCP servers
+     solana-mcps.json        37 MCP servers
```

> **Note:** the "What's Indexed" table in CLAUDE.md says `MCPs | 53` — this
> conflicts with the other two locations and is upstream's bug. Don't fix
> it in this PR; flag in the description.

### 3. `README.md` — bump 36 → 37 in two places

```diff
- The open-source platform behind [solana.new](https://solana.new) — 25 journey skills that take you from "what should I build?" to a shipped, funded product on Solana. Backed by 106 repos, 78 ecosystem skills, 36 MCP servers, 515+ curated ideas, and a comprehensive Solana knowledge base.
+ The open-source platform behind [solana.new](https://solana.new) — 25 journey skills that take you from "what should I build?" to a shipped, funded product on Solana. Backed by 106 repos, 78 ecosystem skills, 37 MCP servers, 515+ curated ideas, and a comprehensive Solana knowledge base.
```

```diff
- | **MCPs** | 36 | Helius, Jupiter, Phantom, Orca, Alchemy, Flash Trade, Solscan, DexScreener, Solana Foundation |
+ | **MCPs** | 37 | Helius, Jupiter, Phantom, Orca, Alchemy, Flash Trade, Solscan, DexScreener, Solana Foundation |
```

## PR title

```
Add Brain Drain MCP — pay-per-query knowledge MCP (x402 + RAG)
```

## PR description (copy-paste body)

```
Type: mcp
Name: Brain Drain MCP
Repo: https://github.com/Bekirerdem/brain-drain
Maintainer: @Bekirerdem
Category: data
Secrets required: none for read-only `brain_drain_payouts`; `X-Payment` header required for the paid `brain_drain_query` tool

## What it is

Brain Drain is an x402 + RAG reference implementation on Solana. AI agents
discover the tool via MCP, see price metadata in the tool's `_meta` field,
sign a USDC SPL transfer through their CDP wallet, and receive top-k
snippets from a curated markdown vault — all in one round trip with
on-chain confirmation in ~400ms.

Built for Colosseum Frontier 2026. v0 is single-seller (the maintainer's
vault) by design — proves the protocol works end-to-end. v1 opens
per-seller upload + payouts.

## Tools registered

- `brain_drain_query` — paid (0.25 USDC). Returns top-k cosine similarity
  results over Gemini 3072d embeddings. Price metadata exposed in `_meta`
  so agents confirm cost before calling.
- `brain_drain_payouts` — free, read-only. Seller's USDC inbox via Helius
  parsed-tx. Signature, payer, amount, time. Useful for live earnings
  dashboards.

## Live

- Endpoint: https://brain-drain-iota.vercel.app/api/mcp
- Verified working on devnet 2026-05-04 (tools/list, paid query, payouts)
- Mainnet cutover scheduled Day 7 (8 May 2026)

## Notes for reviewer

- HTTP transport only — stdio shim is post-hackathon work.
- Source repo is MIT-licensed.
- Spotted while preparing this PR: `CLAUDE.md`'s "What's Indexed" table
  shows `MCPs | 53` while the opening paragraph and file map say 36. Not
  fixed here — separate concern. This PR bumps 36 → 37 in the two
  consistent locations, leaves 53 alone.
```

## How to submit (Bekir manual)

1. Go to https://github.com/sendaifun/solana-new and click **Fork**.
2. In your fork, create branch `add-brain-drain-mcp`.
3. Edit the three files per diffs above. (Easiest path: GitHub web editor
   for each file — no local clone needed.)
4. Commit each file with messages like:
   - `feat(mcps): add brain-drain MCP`
   - `chore(counts): bump MCP count 36 → 37 in CLAUDE.md`
   - `chore(counts): bump MCP count 36 → 37 in README.md`
5. Open PR from `Bekirerdem/solana-new:add-brain-drain-mcp` →
   `sendaifun/solana-new:main`.
6. Use the title and description above.

> If you want me to submit the PR through GitHub MCP under your account
> after you've made the repo public, say "claude submit the mcp pr" and
> I'll fork + commit + open it. Otherwise web editor is the cleanest path.

## Why this matters

- **Distribution**: SendAI + Superteam users discover Brain Drain
  organically when they `solana.new` their next project.
- **Hackathon credibility**: "Listed in solana.new ecosystem catalog"
  becomes a sentence in the Day 9 Colosseum submission.
- **Tester pipeline**: solana.new community Discord/Telegram becomes a
  natural recruit pool for 3rd-party testers (separate task).
- **Protocol positioning**: published alongside `sendaifun/x402-mcp` (the
  generic x402 protocol MCP) — Brain Drain becomes the "first x402+RAG
  vertical built on the rails."
