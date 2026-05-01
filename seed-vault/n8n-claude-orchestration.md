---
title: n8n + Claude orchestration recipes
tags: [n8n, claude, automation, agentic-systems]
created: 2026-03-12
updated: 2026-04-19
---

# The split

Claude does the reasoning, n8n does the plumbing. I never let Claude orchestrate long-running multi-step pipelines directly — context windows fragment, retries are expensive, and observability dies. n8n is the deterministic substrate; Claude is the brain.

## Pattern: webhook → Claude → outputs

```
Webhook IN (n8n) → HTTP Request to Anthropic API (Claude reasoning step)
                 → Conditional split (output schema validation)
                 → Multiple side-effects (DB write, Slack post, email)
```

Critical: validate Claude's structured output before downstream steps. n8n's Code node + Zod (via importing a small zod build into the Code node) catches schema drift early. I learned this when a Claude output skipped a required field on Sonnet 4.6 and silently broke a downstream invoice writer for two days.

## Pattern: scheduled poll → Claude → wiki

For research workflows: n8n cron polls a source (Twitter list, Substack, RSS), Claude summarises into a structured note, n8n appends to my Obsidian vault as a `_sources/src-<slug>.md` file (the Karpathy LLM Wiki pattern). Claude Code later runs the ingest workflow over the new sources.

## Where Claude alone fails

- Long-running tasks (>10 min) — Claude session limits hit before the task completes; n8n keeps state.
- Multi-source aggregation — Claude is bad at "fetch 12 endpoints in parallel and merge"; n8n's HTTP Request node with batching does this in seconds.
- Retries — n8n has built-in retry with backoff; rolling your own in a Claude tool call is fragile.

## What stays in Claude

- Single-prompt reasoning over given context (this is what LLMs do).
- Structured extraction from one document.
- Code generation inside an IDE session (Claude Code Max).

The boundary is clear once you've shipped two or three flows: anything stateful or scheduled goes to n8n; anything single-shot reasoning goes to Claude.
