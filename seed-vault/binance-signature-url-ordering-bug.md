---
title: Binance API signature — URL order beats alphabetical
tags: [binance, api, gotcha, signature]
created: 2026-04-15
---

# The bug in the docs

Binance's REST API signature spec example uses **alphabetical parameter ordering** for the HMAC-SHA256 input string. Their JavaScript example, however, uses **URL-encoded order from the query string** as it appears in the request. The two produce different signatures, and only the JavaScript example actually authenticates.

## What works

Build the signature string from the query parameters in the order they appear in the URL, exactly as the request body / query string sends them. Don't sort. Don't normalise. The HMAC input must match the on-the-wire request byte-for-byte.

```js
// query string: symbol=BTCUSDT&side=BUY&type=LIMIT&timestamp=1234567890
const queryString = "symbol=BTCUSDT&side=BUY&type=LIMIT&timestamp=1234567890";
const signature = crypto
  .createHmac("sha256", apiSecret)
  .update(queryString)
  .digest("hex");
const signedUrl = `${baseUrl}?${queryString}&signature=${signature}`;
```

## What doesn't work

```js
// the docs imply this — it's wrong
const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
const queryString = sortedParams.map(([k, v]) => `${k}=${v}`).join("&");
// signs but auth fails
```

## How long this took to debug

Three hours and one Binance API key reset before I tried the JavaScript example verbatim. The English docs describe alphabetical; the JavaScript example uses request order; the JavaScript example is correct.

## Why I documented this

Anyone building a trading agent on Binance hits this exact wall. The mainstream docs imply alphabetical sorting, and following them produces signatures that the API silently rejects with `-1022 Signature for this request is not valid`. Once you trust the JavaScript example over the prose, it works first try.

## Cross-reference

This is the kind of gotcha that earns Brain Drain its core narrative — niche, expert-curated knowledge that Claude or GPT-5 cannot answer correctly because the public docs are wrong.
