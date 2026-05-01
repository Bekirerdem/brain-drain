---
title: Binance API signature — URL order beats alphabetical
tags: [binance, api, gotcha, signature, war-story, hmac]
created: 2026-04-15
updated: 2026-04-19
sources: [Binance REST API spec, Binance JavaScript example, debug session 2026-04-15]
---

# The bug, in one paragraph

Binance's REST API requires every signed request to include a `signature` parameter that is the HMAC-SHA256 of the query string, keyed with the user's API secret. The official documentation describes this in two places: the prose spec, which implies parameters should be ordered alphabetically before signing, and a JavaScript example, which uses the parameters in the exact order they appear in the request URL. The two produce different signatures, and **only the JavaScript example actually authenticates**. The prose spec is wrong (or at least ambiguous), the JavaScript example is the truth.

Three hours and one API key reset before I tried the JavaScript example verbatim and got my first authenticated request. This page exists so future-me does not lose another afternoon.

## The signing rule that ships

Build the signature input string from the query parameters in the **exact order** they appear in the URL, exactly as the request body or query string sends them. Don't sort. Don't normalise. Don't lowercase keys. The HMAC input must match the on-the-wire request byte for byte.

```ts
import crypto from "node:crypto";

function signBinanceQuery(apiSecret: string, queryString: string): string {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");
}

// Construct the request URL in the order you want; that order IS the signing order.
const params = new URLSearchParams({
  symbol: "BTCUSDT",
  side: "BUY",
  type: "LIMIT",
  timeInForce: "GTC",
  quantity: "0.001",
  price: "100000",
  recvWindow: "5000",
  timestamp: String(Date.now()),
});

const queryString = params.toString();
const signature = signBinanceQuery(process.env.BINANCE_API_SECRET!, queryString);
const signedUrl = `${baseUrl}/api/v3/order?${queryString}&signature=${signature}`;
```

The `URLSearchParams` constructor preserves insertion order in V8. `params.toString()` returns exactly that order. The signature is computed over the result. The signed URL appends `&signature=<hex>` after.

On the server side, Binance recomputes the HMAC over the query string it received, in the order it received it, and compares to the `signature` field. If your client signs the alphabetical-sorted version but sends the URL in insertion order, the two HMACs disagree and you get:

```
{"code":-1022,"msg":"Signature for this request is not valid."}
```

That error message is correct but unhelpful — it tells you the signature didn't match without telling you *why*.

## What does not work

Three patterns I tried in good faith based on the docs, and that all silently fail:

### Pattern 1: alphabetical sort before signing

```ts
// WRONG — looks reasonable, fails authentication
function buildAndSign(params: Record<string, string>, secret: string) {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const queryString = sorted.map(([k, v]) => `${k}=${v}`).join("&");
  const signature = crypto.createHmac("sha256", secret).update(queryString).digest("hex");
  // Then the URL is constructed differently than the signing input — fail.
}
```

Why this seems right: REST APIs commonly sort parameters before signing to make the signature canonical regardless of client order. AWS Signature v4 does this. So does GCP's signed URLs. Many third-party integrations assume Binance does too. It does not.

### Pattern 2: lowercase normalisation

```ts
// WRONG — adds another deviation from on-the-wire bytes
const normalized = queryString.toLowerCase();
const signature = sign(normalized);
```

Some HMAC integrations canonicalise the URL (lowercase scheme, trim slashes, etc.). Binance does not. The signature input is the literal query string, with original casing.

### Pattern 3: signing the body separately for POST requests

```ts
// WRONG for Binance
const body = JSON.stringify({ ...params });
const signature = sign(body);
fetch(url, { method: "POST", body });
```

Binance's spot trading endpoints are urlencoded form, not JSON. The signature is computed over the urlencoded body, identical to the GET query-string treatment. POST requests use the same string-build-and-HMAC dance, just with the body as the input instead of the query string.

## How long this took to debug

I keep approximate timings on debugging sessions for exactly this kind of write-up. The Binance signature episode broke down as:

| Step | Time |
| :-- | --: |
| Following the prose spec literally (alphabetical sort) | 25 min |
| Realising the response is `-1022` not a 401, hunting that down | 20 min |
| Trying lowercase normalisation as a hypothesis | 15 min |
| Trying URL-encoded vs raw values | 30 min |
| Triple-checking the API secret was correct (it was) | 10 min |
| Resetting the API key, assuming the key was bad | 25 min (reset takes time) |
| Re-running the same broken code with the new key — same `-1022` | 5 min |
| Finally trying the literal JavaScript code from the docs | 5 min |
| Realising the prose and code disagree | instant |

Total: ~2.5 hours, maybe 3 with breaks. The fix once I tried the JS example was instant.

## Why this is in the vault

Anyone building a trading agent on Binance hits this exact wall. The Binance docs site's English prose implies alphabetical sorting; following it produces signatures the API silently rejects with `-1022`. Once you trust the JavaScript example over the prose, it works first try.

The kind of niche, debugged-the-hard-way knowledge that a generic LLM cannot produce correctly — the LLM has read the prose docs and learned the wrong rule. Brain Drain's whole pitch is exactly this gap: human-curated experience > training data when the public docs are misleading.

I cross-checked with two other Binance integration repos on GitHub before writing this. Both use the URL-order pattern, both authenticate. Three independent confirmations is enough; the prose spec is just wrong.

## Adjacent issue: timestamp drift

Even with the right signature ordering, Binance rejects requests where `timestamp` is more than `recvWindow` ms in the past or future. Default `recvWindow` is 5000 ms. If your server clock drifts (Cloudflare Workers, AWS Lambda cold starts, Docker on macOS) you get sporadic `-1021` errors:

```
{"code":-1021,"msg":"Timestamp for this request is outside of the recvWindow."}
```

Fix: NTP-sync your clock; failing that, increase `recvWindow` to 60000 (the max Binance accepts). For Brain Drain we don't talk to Binance from the runtime — the trading-agent project uses Binance, and that one syncs against `https://api.binance.com/api/v3/time` once per minute as a clock-drift sentinel.

## Cross-references

- [`magic-byte-file-verification`](./magic-byte-file-verification.md) — same family of mistakes (trusting an abstraction that doesn't match the bytes).
- [`npm-lock-cross-platform`](./npm-lock-cross-platform.md) — same family of "official guidance is misleading; the working code is the truth".
- [`gemini-3-pro-vs-claude-haiku`](../03-agentic-stack/gemini-3-pro-vs-claude-haiku.md) — even strong LLMs reproduce the alphabetical-sort bug if you ask them about Binance signing.
- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — exactly the kind of niche, error-prone knowledge that justifies Brain Drain's per-query pricing.
