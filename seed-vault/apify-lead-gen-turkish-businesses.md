---
title: Apify lead-gen syntax for Turkish businesses
tags: [apify, lead-gen, turkish-market, scraping]
created: 2026-03-08
updated: 2026-04-15
---

# What works for the Turkish market

Apify's Google Maps Scraper actor returns the cleanest local-business data for Turkish cities. I use it for FunnyDog Farm (vet network) and recently piloted it for a sales-agent prototype.

## Input shape that consistently works

```json
{
  "searchStringsArray": [
    "veteriner Bursa",
    "veteriner kliniği Bursa Nilüfer",
    "köpek bakımı Bursa"
  ],
  "language": "tr",
  "countryCode": "tr",
  "maxCrawledPlacesPerSearch": 50,
  "includePeopleAlsoSearch": false
}
```

`language: tr` and `countryCode: tr` together are non-negotiable — without them you get Bursa, Romania results mixed in and the geo-filter breaks silently.

## Field cleanup pattern

The actor outputs ~80 fields; I keep these and drop the rest:

- `title`, `address`, `neighborhood`, `city`
- `phone`, `phoneUnformatted`
- `website`, `instagrams[0]`, `facebooks[0]`
- `categoryName`, `permanentlyClosed`
- `totalScore`, `reviewsCount`

That cut takes a 2 MB JSON down to ~40 KB per 100 results, which is what I feed into Claude for next-step enrichment (extracting decision-makers, drafting outreach copy).

## What I avoid

- Email scraping actors — Turkish businesses publish phone, not email. The email scraper hits ~20% coverage at best and the false-positive rate is high.
- Instagram scraping at scale — Apify's Instagram actors trip rate limits within minutes for any account-aware queries. Use it only for a-known-handle metadata pull, not discovery.

## Why this is in the vault

If you ask my agent "how should I scrape Turkish vets for outreach?", this note is the right answer. The Google Maps + language/country combo is non-obvious until you've burned credits on the wrong actor twice.
