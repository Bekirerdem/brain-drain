---
title: n8n + Claude orchestration recipes
tags: [n8n, claude, automation, agentic-systems, pattern]
created: 2026-03-12
updated: 2026-04-19
sources: [n8n production deployments, Claude Code Max sessions]
---

# The split

Claude does the reasoning. n8n does the plumbing. I never let Claude orchestrate long-running multi-step pipelines directly — context windows fragment, retries are expensive, and observability dies.

n8n is the deterministic substrate. Claude is the brain. Each one does what it does best, neither tries to do the other's job.

This is the architectural rule I now apply to every workflow that involves an LLM and an outside-world side-effect. Brain Drain's runtime is *not* an n8n flow (it's a Cloudflare Worker — same principles, different substrate), but every research / scraping / lead-gen / reporting workflow I run in production sits on this split.

## Pattern 1: webhook in → Claude reasoning → fan-out side-effects

The most common pattern. An external trigger fires; Claude reasons; n8n distributes the result to N downstream consumers.

```
[External trigger]
       ↓
n8n Webhook node receives JSON payload
       ↓
n8n HTTP Request node → Anthropic API (Claude Sonnet 4.6 or Haiku 4.5)
   - prompt template baked into the node
   - response_format: { type: "json_schema", schema: { ... } }
       ↓
n8n Code node validates Claude's structured output against zod
   - rejects non-conforming responses; returns to caller with 400
       ↓
n8n Switch node splits by output schema field
   ↓                ↓                  ↓
Postgres write   Slack post       Email send
```

Critical: **validate Claude's structured output before downstream steps.** I learned this when Sonnet 4.6 silently dropped a required field on a structured response and a downstream invoice writer wrote $0 invoices for two days before anyone noticed. Now every Claude response feeds a Code node that runs a zod-equivalent check and routes invalid responses to a "needs review" queue.

The Code node import — n8n's Code node supports importing a small bundled zod build:

```javascript
const { z } = require('/data/node_modules/zod');

const InvoiceSchema = z.object({
  client: z.string().min(1),
  amount_cents: z.number().int().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  line_items: z.array(z.object({
    description: z.string(),
    cents: z.number().int(),
  })).min(1),
});

const result = InvoiceSchema.safeParse($json);
if (!result.success) {
  return { route: 'review', reason: result.error.issues };
}
return { route: 'commit', data: result.data };
```

Investing 20 minutes once to set this up saves days of silent-corruption debugging.

## Pattern 2: scheduled poll → Claude → wiki

For research workflows, the inverse direction: n8n cron polls a source, Claude summarises into a structured note, n8n appends to my Obsidian vault.

```
[n8n cron: every 6 hours]
       ↓
n8n RSS Feed Read   (or HTTP Request to Twitter list / Substack / arxiv)
       ↓
n8n Filter: only items newer than last_seen_at
       ↓
n8n HTTP Request → Anthropic API
   - prompt: "Summarise into _sources/src-<slug>.md format with frontmatter"
       ↓
n8n GitHub node → commit to beks-vault/_sources/src-<slug>.md
       ↓
n8n Update Workflow Variable: last_seen_at = max(item.publishedAt)
```

This is exactly the LLM Wiki ingest pattern (see [`llm-wiki-pattern`](../00-meta/llm-wiki-pattern.md)) with n8n as the deterministic plumbing and Claude as the writer. The vault grows automatically; the human (me) reviews the new pages weekly during a lint pass.

## Pattern 3: Claude as a one-shot tool inside a longer flow

Sometimes the LLM is just a single transform inside a longer pipeline. For lead-gen on Apify-scraped Turkish business data:

```
Apify Google Maps Scraper (50 results)
       ↓
n8n Function: clean and dedupe
       ↓
n8n Loop (one Claude call per business, batched at 5):
  - prompt: "Given this business profile, suggest a 3-line outreach DM in Turkish"
  - response saved as { businessId, dmDraft, tone, riskLevel }
       ↓
n8n Filter: drop where riskLevel === 'high'
       ↓
n8n Output to Google Sheet for manual review
```

n8n handles the parallelism (5 Claude calls in flight at a time), the retries (failed Claude calls go to a dead-letter queue), and the eventual write to the sheet. Claude only does the natural-language transform.

## Where Claude alone fails

If you try to make Claude *be* the orchestrator, you hit these walls quickly:

**Long-running tasks (>10 min).** Claude session limits hit before the task completes. You end up with half-done work and a context window that's too full to summarise cleanly. n8n holds state across hours/days/weeks without breaking a sweat.

**Multi-source aggregation.** Claude is bad at "fetch 12 endpoints in parallel and merge results". n8n's HTTP Request node with batching does this in seconds with predictable cost. Asking Claude to "go fetch all of these" wastes context window on URLs and JSON parsing that has nothing to do with what you're paying Claude for.

**Retries.** n8n has built-in exponential backoff with retry count, max-duration, and webhook callbacks for ops. Rolling your own retry logic in a Claude tool call is fragile — every retry consumes context, and Claude's idea of "I should try this again" is statistically variable.

**Observability.** n8n's execution log shows every step, every input, every output, every error. Claude's session is a transcript. When something goes wrong in production, the n8n log is your incident-response surface; Claude's transcript is harder to grep through.

## What stays in Claude

The complementary list — what Claude alone is the right tool for:

- **Single-prompt reasoning over given context.** "Read these three documents, answer this question." This is what LLMs do.
- **Structured extraction from one document.** "Pull the invoice line items out of this PDF text into JSON." Claude is excellent at this.
- **Code generation inside an IDE session.** Claude Code Max for the actual coding work; n8n nowhere in sight.
- **Conversation-level decision support.** "I'm thinking about X, here's my reasoning, what am I missing?" Single-shot dialogue, no orchestration.

The boundary becomes clear once you've shipped two or three flows. Anything stateful or scheduled goes to n8n. Anything single-shot reasoning goes to Claude.

## Why Brain Drain doesn't run on n8n

Brain Drain's runtime is a Cloudflare Worker. The reason is not that n8n couldn't do it — n8n could absolutely host the `/api/query` endpoint as a webhook + Claude call + RPC verification chain. The reason is latency:

- n8n hosted: 200-500 ms per node hop, 4-5 nodes per request, total p50 1-2 seconds.
- Cloudflare Worker: 50-100 ms cold start, sub-100 ms warm, fits the 400 ms verification budget cleanly.

For a paid x402 endpoint where the latency promise is part of the value, Cloudflare wins. For everything else (lead-gen, scraping, scheduled research, dashboards), n8n is the right substrate and Brain Drain's *operational* tooling around it (e.g., daily reports of how many queries we served, weekly digest of vault growth) is on n8n.

## Useful n8n nodes I keep coming back to

- **Webhook** — entry point for everything; gives you a public URL with auth options.
- **HTTP Request** — for any custom API including Anthropic, Google AI, Solana RPC.
- **Code (JavaScript or Python)** — when Function/Set isn't enough; runs in a v8 sandbox.
- **Switch** — multi-branch routing, way cleaner than nested If nodes.
- **Filter** — drops items that don't match a condition (vs Switch, which routes them).
- **GitHub** — for the wiki-ingest pattern; commit + push from inside the workflow.
- **Slack / Discord / Telegram Bot API** — for ops alerting on workflow failures.
- **Postgres / Cloudflare D1** — durable state for "what did we already process".
- **Schedule Trigger** — cron-like; the entry point for every Pattern 2 flow.

## Cross-references

- [`gemini-3-pro-vs-claude-haiku`](./gemini-3-pro-vs-claude-haiku.md) — when Claude is even the right LLM for the orchestration step.
- [`apify-lead-gen-patterns`](./apify-lead-gen-patterns.md) — concrete example of n8n + Claude for outreach generation.
- [`llm-wiki-pattern`](../00-meta/llm-wiki-pattern.md) — Pattern 2 is the n8n-driven version of the LLM Wiki ingest workflow.
- [`build-in-public-hackathon-strategy`](../05-process/build-in-public-hackathon-strategy.md) — daily public reporting flows (also n8n + Claude).
