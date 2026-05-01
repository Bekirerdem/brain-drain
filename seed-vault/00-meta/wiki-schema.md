---
title: Wiki schema — operating rules for this vault
tags: [meta, schema, agentic-systems]
version: 1.1
created: 2026-04-18
updated: 2026-04-30
---

# What this file is

The single configuration file that tells an LLM how to operate this vault. The pattern comes from Andrej Karpathy's [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f); Brain Drain uses it because the same rules that produce a useful private wiki also produce a useful retrieval corpus when exposed via x402.

The roles are split:

- **Operator (Bekir):** sources, direction, taste, judgement.
- **LLM (Claude Opus 4.7 in this vault):** ingestion, page writing, linking, lint, refactor — all the bookkeeping.

## 1. Folder layout

```
seed-vault/
├── 00-meta/                  schema, index, source ingests of foundational papers
├── 01-avalanche-evm/         Avalanche L1, Foundry, EVM deployment lore
├── 02-solana-brain-drain/    Brain Drain core architecture and pickings
├── 03-agentic-stack/         LLM, MCP, n8n, agent orchestration
├── 04-devops-gotchas/        CI, debugging, file handling, OS-cross-platform
└── 05-process/               commit discipline, build-in-public, portfolio
```

Numbered prefix is intentional. It enforces a stable reading order, keeps the directory listing categorically grouped, and matches the convention in the operator's private vault.

A new top-level category opens only when (a) at least three new notes would otherwise live homeless in `00-meta/` or `05-process/`, and (b) the category is durable (lasts beyond a single hackathon). New categories ship with a one-line entry in [`wiki-index`](./wiki-index.md) before the first note is written.

## 2. File naming

- **Concept / entity pages:** `kebab-case-with-noun.md`, e.g. `phantom-cash-seller-flow.md`. The kebab-case keeps URLs clean and avoids `[[Wiki Link]]` casing ambiguity in Obsidian.
- **Source ingests:** `<slug>-source.md`, e.g. `karpathy-llm-wiki-source.md`. Marks the file as immutable.
- **Daily / lint / time-series:** `YYYY-MM-DD.md` or `YYYY-MM-DD-lint.md`.
- **Language:** all wiki pages in **English**. (The operator's private vault has Turkish pages; the public seed-vault for Brain Drain is English-only because the corpus is consumed by international agents.)

Forbidden: spaces in filenames, mixed case, locale-specific characters, version suffixes (`v2`, `final`, `new`).

## 3. Frontmatter

Every file starts with this block:

```yaml
---
title: <Human-readable title>
tags: [primary-category, secondary-tag, optional-third]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [optional list of [[src-slug]] references]
---
```

Tag conventions:

- First tag is always the category prefix without the number (e.g., `avalanche` for files in `01-avalanche-evm/`).
- Add `gotcha` to anything documenting a specific bug-and-fix.
- Add `war-story` to anything where the operator narrates a debugging session.
- Add `architecture` for design-decision pages.
- Tags are lower-case, dash-separated, no synonyms (use `gotcha`, never `pitfall`).

## 4. Linking rules

- Cross-links use Obsidian's `[[double-bracket]]` syntax in operator's private vault, but in this public seed-vault they must use Markdown links with relative paths: `[helius-rpc-patterns](../02-solana-brain-drain/helius-rpc-low-latency-patterns.md)`. This makes the vault render correctly on GitHub.
- Every new page must link to at least three other pages — orphans are forbidden.
- An unknown concept that comes up mid-write earns a stub page (1-2 sentences + tag) immediately, not "later". Stubs are tracked in lint reports and either grown or merged within two weeks.
- Same concept across pages = single canonical page; everything else links to it. No duplicates.

## 5. Ingest workflow

When the operator hands the LLM a new source (paper, gist, transcript, decision log entry):

1. Read the source end-to-end. Do not skim.
2. Write `_sources/<slug>-source.md` with a faithful summary, citations to the original.
3. Identify the 10-15 existing wiki pages this source updates. Read each, decide what changes.
4. Update each affected page in place: add new sub-sections, refine claims, append `[[<slug>-source]]` citations on the touched paragraphs.
5. If the source introduces a genuinely new concept, open a new wiki page rather than stretching an existing one.
6. Append a `log.md` entry: `[ingest] src=<slug> → N pages: [[a]], [[b]], …`.
7. Update `index.md`'s anchor list if a new category page was created.

## 6. Query workflow

When the operator asks a question:

1. Identify relevant categories from `index.md`.
2. Read the top 3-5 pages from those categories.
3. Synthesise an answer with **explicit citations** in the form `(see [[page-slug]])`.
4. If the answer is reusable, ask the operator: *"Worth filing as `<category>/<slug>.md`?"* On confirm, write the new page and log it.

This is the workflow Brain Drain's `/api/query` endpoint runs at scale, except the answer is sold for $0.05 USDC instead of consumed locally.

## 7. Lint workflow

Manual or weekly:

- [ ] Orphans — pages with zero inbound links from other wiki pages.
- [ ] Broken links — `[[name]]` where `name` no longer resolves.
- [ ] Contradictions — same fact stated two ways across pages.
- [ ] Stubs — pages with body shorter than 200 chars and `created > 14 days ago`.
- [ ] Tag drift — same concept tagged differently in different files.
- [ ] Index drift — categories not reflected in `index.md`.

Output: `Daily/YYYY-MM-DD-lint.md` with a checklist of fixes. Each fix is applied and logged.

## 8. Log format

Every action appends a line to `log.md` (newest at the bottom):

```markdown
## YYYY-MM-DD
- [bootstrap] vault initialised, schema v1.0
- [ingest] src=phantom-cash-docs → 3 pages updated: phantom-cash-seller-flow, x402-on-solana-primer, brain-drain-architecture-decisions
- [query] "how does CDP differ from Privy?" → answered from cdp-embedded-wallets-vs-privy.md, no new page filed
- [lint] 2 orphans linked, 1 broken link repaired, 1 stub merged into parent
- [refactor] split mcp-server-architecture-for-solana into transport / pricing / verification subsections
- [schema-update] v1.1 — added Markdown link rule for public vault, deprecated [[wiki-link]] for this directory
```

Action types: `bootstrap`, `ingest`, `query`, `lint`, `refactor`, `archive`, `schema-update`.

## 9. Versioning

- Git provides version history — no `v2` filenames, no archive folders for old versions.
- The schema itself bumps version on changes that affect existing pages (`v1.0` → `v1.1` happened when this seed-vault forked from the private one and switched to Markdown links).
- Operator pushes manually; the LLM does not push without an explicit request.

## 10. Anti-patterns (what this vault refuses)

- Duplicate pages for the same concept under different names.
- Frontmatter-less pages.
- Isolated pages (zero outbound links).
- Statements asserted as fact without a `[[<slug>-source]]` or "verified on YYYY-MM-DD" attribution.
- "Wiki rotting" — pages read repeatedly during query but never updated. Lint catches this on the read-count drift.
- Generic public-doc duplication. If a fact is in the official docs and unchanged, link to the docs and add only the operator's lived experience around it.

## Cross-references

- [`llm-wiki-pattern`](./llm-wiki-pattern.md) — the philosophy this schema operationalises.
- [`wiki-index`](./wiki-index.md) — the live category catalogue this schema's section 1 governs.
- [`karpathy-llm-wiki-source`](./karpathy-llm-wiki-source.md) — the original gist these rules are derived from.
- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — how the schema rules become product decisions.
