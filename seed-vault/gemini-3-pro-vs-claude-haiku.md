---
title: Gemini 3.1 Pro vs Claude Haiku 4.5 — when to use which
tags: [llm, gemini, claude, brain-drain]
created: 2026-04-30
---

# My current default

Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`) is the agent-reasoning default for Brain Drain. It replaced `gemini-3-pro-preview`, which was deprecated and shut down in March 2026. The new model adds a `thinking_level` parameter that maps cleanly onto our use case — `low` for snippet extraction, `high` for cross-vault synthesis.

## Cost shape

I run Gemini through a Google Cloud project on the paid tier, not AI Studio free tier. The Pro membership credits ($10/mo) plus the residual $300 trial cover the entire 11-day Frontier sprint comfortably, with hundreds of dollars of headroom.

## Where Claude Haiku 4.5 still wins

When I want to demo "agent pays multiple LLM providers via x402", Haiku 4.5 is the second model. It's $1/M input vs Gemini Pro's higher per-token price, so it's the natural cost-tier fallback in the demo narrative. I keep `ANTHROPIC_API_KEY` in `.env.local` commented out and toggle it on for the Day 7+ multi-model showcase.

## Embeddings

`gemini-embedding-001` (3072 dimensions) is the only embedding model I've enabled for Brain Drain. Anthropic doesn't ship embeddings; OpenAI does but I have no reason to introduce a third API and three sets of credentials when Gemini's free embedding tier covers a 1500-call/day load.

## What Claude is better at, in my hands

Claude Code Max is my daily driver for coding sessions; Gemini is for reasoning-heavy generation (longer-form synthesis, structured extraction). I do not switch them mid-task — Claude codes, Gemini reasons over the result. Different jobs, different muscle memory.
