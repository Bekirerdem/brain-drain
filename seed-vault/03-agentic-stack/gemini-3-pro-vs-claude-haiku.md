---
title: Gemini 3.1 Pro vs Claude Haiku 4.5 — when to use which
tags: [llm, gemini, claude, brain-drain, model-selection]
created: 2026-04-30
updated: 2026-05-01
sources: [Google AI Studio docs, Anthropic console, personal billing data]
---

# My current default

Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`) is the agent-reasoning default for Brain Drain. It replaced the original `gemini-3-pro-preview`, which was deprecated and shut down in March 2026 — calls to the old identifier now return errors. The new model adds a `thinking_level` parameter that maps cleanly onto Brain Drain's two retrieval modes: `low` for snippet extraction, `high` for cross-vault synthesis.

Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) sits beside it as the multi-model demo opt-in. Both are wired into the env; Gemini is the default, Claude is opt-in via `ANTHROPIC_API_KEY`.

## Cost shape

I run Gemini through a Google Cloud project on the **paid tier**, not AI Studio's free tier. Two reasons:

1. The Pro membership credits ($10/mo developer credit on top of the standard subscription) plus the residual $300 Google Cloud trial cover the entire Frontier sprint with a few hundred dollars of headroom. Free-tier rate limits would be a real bottleneck during heavy demo-prep iteration.
2. Paid tier latency is more predictable. Free tier sometimes adds 200-500 ms variance that breaks the agent UX feel.

For Anthropic, I have a $2.50 residual on the API account from earlier projects. That covers Haiku 4.5 for the entire 11-day window if I keep it as a multi-model showcase rather than a primary workhorse.

## Per-token pricing (April 2026)

Approximate, both providers' standard tiers:

| Model | Input ($/M tokens) | Output ($/M tokens) |
| :-- | --: | --: |
| `gemini-3.1-pro-preview` | $3.50 | $10.50 |
| `gemini-2.5-flash` | $0.10 | $0.30 |
| `gemini-embedding-001` | $0.02 | — |
| `claude-haiku-4-5` | $1.00 | $5.00 |
| `claude-sonnet-4-6` | $3.00 | $15.00 |

For Brain Drain's average query (~500 input tokens of context, ~300 output tokens of synthesis), the per-call cost on Gemini Pro is ~$0.005, on Haiku 4.5 is ~$0.002, on 2.5 Flash is ~$0.0001. We charge the agent $0.05 per query. The model cost is a tiny fraction of the price.

## Where Gemini wins

**Long-context reasoning over the vault.** Gemini Pro's context window is generous enough that the entire RAG corpus (~40K tokens for the seed vault) fits in a single prompt. We don't actually feed the whole vault — we feed the top-3 retrieved snippets — but Gemini's effective use of long context means the synthesis reads more like "read the snippets, write a coherent answer" than "stitch together fragments".

**`thinking_level` parameter.** Setting `thinking_level: "high"` on hard queries (cross-vault synthesis, "compare X across notes A and B") trades latency (an extra 1-2 seconds) for noticeably better synthesis quality. `thinking_level: "low"` on simple snippet returns keeps things fast.

**Embeddings.** `gemini-embedding-001` is the only embedding model in the Brain Drain stack. Its 3072-d output is wider than OpenAI's `text-embedding-3-small` (1536-d), and in my benchmarks (152-chunk seed-vault, 8 demo queries) it delivers consistently higher top-1 cosine scores (avg 0.79 vs 0.71 against the same corpus).

## Where Claude Haiku 4.5 still wins

**Cost on a per-token basis,** by ~3x against Gemini Pro. For the multi-model demo where the narrative is "agent pays multiple LLM providers via x402", Haiku's lower price-per-token makes it the natural cost-tier comparison. The demo can show "this agent picks Gemini Pro for the hard query and Haiku for the cheap one, paying both via x402".

**Tool-calling reliability.** In my hands, Claude Haiku 4.5 is more reliable at structured tool calls than Gemini Pro at the same tier (this might not be a public benchmark consensus, just my experience over a few hundred prompts). For the MCP-server tool surface, this matters less because the tool schema is simple, but if Brain Drain ever exposes tools with branching outputs, Haiku is the safer pick.

**Daily-driver coding sessions.** Claude Code Max is my default IDE assistant; Gemini does the reasoning, Claude codes. This split is muscle memory at this point. I do not switch models mid-task — different jobs, different tools. (Unrelated to Brain Drain runtime, but it's why Claude Code is in the credits even though Claude isn't the runtime model.)

## Where neither is in scope

**OpenAI GPT-5.** Not in the Brain Drain runtime stack. The architectural decision was to avoid a third API and a third set of credentials when Gemini and Anthropic together cover the use case (see [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) #7).

**Local Llama / Mistral.** Latency too high for the sub-second 402 verify-and-respond cycle. A locally-hosted model would add 1-2 seconds to the response, on top of the 400 ms RPC verification. The demo loses its tightness.

## The `thinking_level` discipline

For Brain Drain's RAG synthesis, the thinking-level choice is per-query:

```ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const isComplex = chunks.length > 1 || /compare|contrast|across/i.test(question);
const thinkingLevel = isComplex ? "high" : "low";

const { text } = await generateText({
  model: google(env.GEMINI_MODEL),
  providerOptions: {
    google: { thinking_level: thinkingLevel },
  },
  prompt: `Given these snippets from Bekir Erdem's expert vault:
${formatChunksForPrompt(chunks)}

Question: ${question}

Synthesise an answer with citations to source files. Do not invent facts not in the snippets.`,
});
```

The heuristic for `isComplex` is deliberately small: are we returning multiple chunks, or does the question contain comparison keywords. That covers ~95% of "this needs deeper reasoning" cases without over-firing into expensive `high`-tier calls.

## When to upgrade to Pro from Flash

The fallback chain is:

```
gemini-3.1-pro-preview  (default)
   ↓ fallback on rate-limit / 5xx
gemini-2.5-flash        (cheap, fast)
```

The fallback fires only on transient errors. The decision to use Flash *primarily* for some query types is not implemented — we use Pro for everything by default and let Flash catch the failures. This is the right starting position; if cost ever becomes an issue we revisit.

## What broke me about model identifier hygiene

The naming carousel of preview models is exhausting. The version I started Day 0 with (`gemini-3-pro-preview`) was deprecated within weeks of the original release. The current name (`gemini-3.1-pro-preview`) will likely be replaced by `gemini-3.2-pro-preview` or just `gemini-3.1-pro` (out of preview) within months.

The lesson: **always confirm the model identifier against the live API listing before committing the env**. I documented this with the explicit list of model IDs and their deprecation states in the env example file, which is the kind of niche, time-sensitive metadata that's easy to forget if the demo is two months out.

## Cross-references

- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — decision #7 (reasoning model) and #8 (embeddings).
- [`x402-on-solana-primer`](../02-solana-brain-drain/x402-on-solana-primer.md) — the demo's "agent pays multiple providers" narrative builds on this comparison.
- [`mcp-server-architecture-for-solana`](../02-solana-brain-drain/mcp-server-architecture-for-solana.md) — where the model is invoked from inside the MCP handler.
- [`n8n-claude-orchestration`](./n8n-claude-orchestration.md) — Claude as code-and-orchestration tool, separate from Brain Drain's runtime model picks.
