---
title: "Source ingest — Karpathy: LLM Wiki"
type: source
source_url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
author: Andrej Karpathy
retrieved: 2026-04-18
immutable: true
tags: [source, llm-wiki, knowledge-management]
---

# What this file is

An immutable summary of Andrej Karpathy's *LLM Wiki: Key Concepts* gist (April 2026). The original is the canonical statement of the pattern this vault implements; this file is the citable artefact that wiki pages reference. By convention (see [`wiki-schema`](./wiki-schema.md) section 5), source ingests are not edited after the initial write; new information from the same author opens a new `<slug>-source.md` rather than mutating this one.

## Original

- **URL:** https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- **Title:** *LLM Wiki: Key Concepts*
- **Author:** Andrej Karpathy
- **Published:** April 2026
- **Format:** GitHub gist, ~3,000 words plus comment thread.

## The core proposal

Karpathy's central claim:

> "Rather than retrieving raw document fragments on each query, an LLM incrementally builds and maintains a persistent wiki — a structured, interlinked collection of markdown files."

The shift is from **ephemeral retrieval** (classical RAG) to **persistent artefact** (LLM Wiki). Cross-references, summaries, and contradictions are resolved at write time, once, instead of recomputed per query, every time. The result is a knowledge base whose value compounds rather than recurring as a fixed retrieval cost.

## Three layers

The gist defines three layers, each with a different mutation discipline.

1. **Raw sources** — immutable. URLs, PDFs, gists, transcripts. Stored verbatim or as faithful summaries; never edited.
2. **The wiki itself** — mutable. Categorised markdown notes that the LLM rewrites in place as new sources arrive.
3. **The schema / config** — meta. A single file (in this vault, [`wiki-schema`](./wiki-schema.md)) that tells the LLM how to operate the other two layers. Itself versioned and rarely changed.

## Three primary operations

### Ingesting sources

When new material arrives, the LLM:

1. Reads the source end-to-end.
2. Writes a faithful summary into the immutable layer.
3. Walks the 10-15 existing wiki pages most affected, updates each in place.
4. Adds a new wiki page only when the source introduces a genuinely new concept.
5. Logs the action.

The discipline is "spread the new information across the affected pages, do not pile it into a generic note that nobody reads".

### Querying

When the operator asks a question:

1. The LLM identifies the relevant categories from the wiki's index.
2. It reads the top 3-5 pages from those categories.
3. It synthesises an answer with **inline citations to the wiki pages it used**.
4. If the answer is reusable beyond this conversation, the LLM offers to file it as a new wiki page; the operator decides.

This is the workflow Brain Drain monetises: an external agent's query runs the same procedure, but the synthesis is gated behind an x402 payment.

### Linting

Periodic health checks. The gist enumerates:

- Contradictions (same fact stated two different ways across pages).
- Orphan pages (zero inbound links).
- Broken cross-references.
- Stub pages that never grew.
- Stale tag taxonomies.

Lint output is itself a wiki page (a daily dated lint report), and the fixes are applied as a separate commit. Lint discipline is what prevents "wiki rotting" — the slow accumulation of pages that get read but never updated.

## Navigation primitives

Two files act as navigation primitives across every implementation:

- **`index.md`** — a content-oriented catalogue. New top-level categories register here before any page is written.
- **`log.md`** — append-only chronological log. Every ingest, query, lint, refactor leaves a line.

Both exist in this vault: see [`wiki-index`](./wiki-index.md) and the implicit log embedded in this directory's git history.

## Why the pattern works

Karpathy's framing of why classical RAG falls short for personal knowledge:

> "The tedious part of maintaining a knowledge base is not the reading or the thinking — it's the bookkeeping."

People build wikis, then abandon them, because the bookkeeping load (cross-links, lint, naming consistency) is unrewarding manual labour. The LLM removes that labour. Humans become responsible only for *sourcing* and *direction*; the LLM handles the rest.

This division of labour is the same split Brain Drain assumes between the seller (curator, sourcing) and the agentic surface that retrieves on the seller's behalf for paying buyers.

## Tools the gist mentions

- **Obsidian** — for the operator to view and edit the wiki interactively.
- **Claude Code** and other LLM-agent IDEs — for the LLM to write, lint, and refactor.
- **qmd** — a local search interface, optional.
- **Marp** — slide-deck rendering of wiki pages, optional.

In Brain Drain's stack, Obsidian is the operator surface; Claude Opus 4.7 is the writing/lint LLM; the seed-vault directory is the public-grade subset of the operator's larger private Obsidian vault.

## Critiques surfaced in the comment thread

Three serious objections that the original post does not fully resolve. Each is worth knowing because Brain Drain inherits them.

1. **`@gnusupport`:** The pattern has fundamental reliability issues. LLM hallucination during ingest poisons the wiki; the same LLM cannot reliably check its own past work; scaling above ~100 pages is empirically unstable.
2. **Multiple commenters:** Genuinely structured data (numerical, time-series, relational) does not fit prose markdown well. Frontmatter and inline tables cover most needs but break down for analytic queries.
3. **Various respondents:** Variants like *MnemoVault* and *atomic-wiki* propose more rigid schemas. The trade-off is rigidity (harder for the LLM to write) vs flexibility (easier for the LLM to drift).

The seed-vault you are reading inherits all three risks. Mitigations: small page count (under 30 for now), citation rule (every claim sourced), lint cycles, and conscious avoidance of structured-data pages.

## Application to this vault

The operator forked their private Obsidian beks-vault on 2026-04-30 into a public-grade seed-vault for Brain Drain's Frontier 2026 build. The forked subset:

- Translated Turkish pages to English.
- Stripped client-confidential content (the entire `00-Trading-Agent/` private folder).
- Re-categorised under numeric prefixes per [`wiki-schema`](./wiki-schema.md).
- Added new pages specifically for the Brain Drain demo corpus.

Derived pages that cite this source:

- [`llm-wiki-pattern`](./llm-wiki-pattern.md) — the philosophy this vault operationalises.
- [`wiki-schema`](./wiki-schema.md) — the operating rules derived from the gist.

## Cross-references

- [`llm-wiki-pattern`](./llm-wiki-pattern.md)
- [`wiki-schema`](./wiki-schema.md)
- [`wiki-index`](./wiki-index.md)
