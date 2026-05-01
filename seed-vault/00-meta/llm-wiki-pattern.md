---
title: The LLM Wiki pattern, and why Brain Drain is built on it
tags: [meta, agentic-systems, knowledge-management, karpathy]
created: 2026-04-18
updated: 2026-04-30
sources: [Karpathy gist 442a6bf555914893e9891c11519de94f]
---

# The pattern in one paragraph

An LLM Wiki is a markdown corpus that an LLM continuously builds and maintains, instead of a classical RAG over raw documents that runs from scratch on every query. The wiki is **persistent and compounding** — links between concepts already exist, summaries are pre-written, contradictions have been linted out. The human supplies sources and direction; the LLM does the bookkeeping. Andrej Karpathy formalised the pattern in a 2026 gist, and Brain Drain is its first paid implementation.

## Classical RAG vs LLM Wiki

| Dimension | Classical RAG | LLM Wiki |
| :-- | :-- | :-- |
| Persistence | Ephemeral — recompute embeddings, retrieve, throw away | Persistent artefact, version-controlled |
| Cross-references | Computed at query time from token similarity | Pre-written `[[wiki-link]]`s, semantic |
| Updates | Sources change → re-index from zero | Pages mutate; the LLM rewrites in place |
| Cost per query | Full retrieval round trip every call | Snippets cached; only synthesis runs |
| Human work | None at write time, complex prompts at read time | Source curation + direction at write time, almost nothing at read time |
| Failure mode | Stale embeddings, retrieval drift | "Wiki rotting" — pages read but never updated |
| Where the value lives | In the embedding model | In the wiki structure |

Both have their place. RAG wins when the corpus is huge and changes constantly (web search, broad enterprise docs). LLM Wiki wins when the corpus is curated and semi-stable (a person's expertise, a company's playbook).

## Three layers, three operations

Karpathy's spec splits the system into three layers and three workflows.

**Layers**

1. **Raw sources** — immutable ingest dumps in `_sources/` (or in Brain Drain, the original directory the operator pointed `seed-vault.ts` at).
2. **The wiki** — categorised markdown notes, each with frontmatter, cross-links, citations.
3. **The schema** — a single file (this directory's [`wiki-schema`](./wiki-schema.md)) that tells the LLM how to operate the other two layers.

**Operations**

1. **Ingest** — take a raw source (PDF, URL, transcript, conversation), summarise into `_sources/src-<slug>.md`, then update the 10-15 wiki pages most affected by the new information. Add `[[src-<slug>]]` citations everywhere a fact came from this source.
2. **Query** — when the operator asks a question, identify the relevant categories from `index.md`, read the 3-5 most relevant pages, synthesise an answer with inline citations, and optionally file the answer back into the wiki as a new page if it has lasting value.
3. **Lint** — periodic health checks: orphan pages, broken `[[link]]`s, conflicting claims across pages, stub pages that never grew, tag inconsistencies, stale `index.md`. The lint produces a `Daily/YYYY-MM-DD-lint.md` report with action items.

## Why Brain Drain is the natural commerce layer

A maintained LLM Wiki is dense with niche, hard-won knowledge that does not exist in the open-web training set: war stories, error-message-to-fix mappings, deprecated-API workarounds, regional gotchas, undocumented behaviour. This is exactly the corpus type for which generic LLMs hallucinate or refuse.

Brain Drain takes a maintained wiki and exposes its retrieval layer as a paid x402 micro-API. An external agent that hits a knowledge boundary can pay $0.05 in USDC and get back the relevant snippet plus citations from the human's actual notes — better than a hallucinated guess, dramatically better than a dead-end "I don't have access to that".

The two systems compose: the operator runs the wiki (LLM does bookkeeping, human does sourcing); Brain Drain monetises the wiki when other agents need answers.

## Known limits

The Karpathy gist comments thread surfaces three scaling concerns the pattern still has to answer.

**Scale beyond ~100 pages.** LLMs lose coherence reading and updating wikis past a few hundred pages. The fix is lint discipline (kill stub pages, merge duplicates) plus deliberate categorisation (the `00-`, `01-` numeric prefix in this very vault). Beyond ~500 pages an automatic clustering / re-categorisation pass becomes necessary; we are nowhere near that scale yet.

**Hallucination risk inside wiki updates.** If the LLM invents a fact during an ingest pass, it ends up in the wiki forever, sourced as if it were from the ingested document. The mitigation is the citation rule (`[[src-<slug>]]` on every claim) plus periodic lint checks that flag any unsourced statement.

**Structured data fits poorly.** Wiki = prose; tabular / time-series data wants a database. Frontmatter and inline markdown tables cover ~70% of structured needs (counts, statuses, configurations). Beyond that, the LLM Wiki should reference an external system, not try to be one.

## What this implementation looks like

This vault is a small LLM Wiki applied specifically to Brain Drain's demo corpus.

- `00-meta/` is this layer-3 (schema + index + the source ingest of Karpathy's gist itself).
- `01-` through `05-` are layer-2 categorised pages.
- The `_sources/` directory is implicit — Brain Drain's "raw source" is the original Obsidian vault on the operator's disk, before this curated, public-grade subset was lifted out of it.

The operator (me) curates new pages. Claude Opus 4.7 does the writing, linting, and cross-referencing during sessions like the one that produced this very file.

## Cross-references

- [`wiki-schema`](./wiki-schema.md) — the operating rules for this vault, which the agent reads before writing.
- [`wiki-index`](./wiki-index.md) — the category catalogue.
- [`karpathy-llm-wiki-source`](./karpathy-llm-wiki-source.md) — immutable summary of the original gist.
- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — how the pattern translates into a paid API.
- [`build-in-public-hackathon-strategy`](../05-process/build-in-public-hackathon-strategy.md) — why the public commit log of this vault is itself the demo's strongest signal.
