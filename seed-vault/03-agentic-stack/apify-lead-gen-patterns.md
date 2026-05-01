---
title: Apify lead-gen patterns — Google Maps scraping for emerging-market data
tags: [apify, lead-gen, scraping, agentic-systems, war-story]
created: 2026-03-08
updated: 2026-04-15
sources: [Apify console, FunnyDog Farm vet network pilot, sales-agent prototype]
---

# What Apify gives me that direct scraping doesn't

Apify is a hosted scraping platform — you call an "actor" (their term for a pre-built scraper) over their API, give it inputs, get back structured data. Their Google Maps Scraper actor returns the cleanest local-business data for emerging-market cities I have used. I've now run it for FunnyDog Farm's vet network research (Bursa, Turkey), a sales-agent prototype (Istanbul + Izmir), and as a building block in the n8n + Claude lead-gen pipeline (see [`n8n-claude-orchestration`](./n8n-claude-orchestration.md) Pattern 3).

The thing it solves: Google Maps' own scraping defenses. Every direct headless-browser approach I tried burned through proxies in hours and got CAPTCHA-blocked. Apify maintains the proxy rotation, headless tooling, and parser updates. I pay for the credits; they handle the cat-and-mouse with Google.

## The input shape that consistently works

For a Turkish-vet search:

```json
{
  "searchStringsArray": [
    "veteriner Bursa",
    "veteriner kliniği Bursa Nilüfer",
    "köpek bakımı Bursa",
    "kedi veteriner Bursa Osmangazi"
  ],
  "language": "tr",
  "countryCode": "tr",
  "maxCrawledPlacesPerSearch": 50,
  "includePeopleAlsoSearch": false,
  "skipClosedPlaces": true
}
```

Three config items that are non-negotiable:

1. **`language: "tr"`** — without this, Apify mixes English-language results in. The actor's category extraction expects local-language category names; English-language results return `categoryName: null` half the time.
2. **`countryCode: "tr"`** — without this, you get Bursa, Romania results mixed in with Bursa, Turkey. The geo-filter Apify applies internally is a tcLD + tld combination; both halves matter.
3. **`maxCrawledPlacesPerSearch: 50`** — going higher rarely helps. Google Maps' result quality drops past ~50 per search, and you start paying for noise. Better to add more search strings than to extend any one search's depth.

Items I've tried disabling and confirmed I want enabled:

- `skipClosedPlaces: true` — removes permanently-closed businesses. Saves ~15% of credit on most searches.
- `includePeopleAlsoSearch: false` — the "people also search for" suggestions inflate results with adjacent-but-irrelevant businesses (e.g., pet supply stores when searching for vets). Disable.

## Field cleanup pattern

The Apify actor outputs a verbose ~80-field JSON per place. I keep these and drop the rest:

```javascript
function leanBusiness(rawApifyRow) {
  return {
    title: rawApifyRow.title,
    address: rawApifyRow.address,
    neighborhood: rawApifyRow.neighborhood,
    city: rawApifyRow.city,
    phone: rawApifyRow.phone,
    phoneUnformatted: rawApifyRow.phoneUnformatted,
    website: rawApifyRow.website,
    instagram: rawApifyRow.instagrams?.[0] ?? null,
    facebook: rawApifyRow.facebooks?.[0] ?? null,
    categoryName: rawApifyRow.categoryName,
    permanentlyClosed: rawApifyRow.permanentlyClosed === true,
    totalScore: rawApifyRow.totalScore,
    reviewsCount: rawApifyRow.reviewsCount,
    googleMapsUrl: rawApifyRow.url,
  };
}
```

That cut takes a 2 MB raw JSON dump (100 results) down to ~40 KB of clean records, which is the size that fits comfortably into a Claude prompt for next-step enrichment (decision-maker extraction, outreach copy drafting, prioritisation by reviews + recency).

## What I avoid

Three things I no longer try, with the reasoning so future-me doesn't try them again.

### Email scraping actors

Apify has actors that promise to extract email addresses from business websites. For Turkish businesses, this is a waste of credits. Turkish businesses publish phone numbers, not emails. The actor hits ~20% coverage on Turkish data and ~15% of those emails are info@-style mailboxes that nobody reads. The signal-to-noise ratio is bad enough that I now scrape phone-only and treat email as a bonus to be discovered through other means (the business's website's contact page, manual search).

### Instagram scraping at scale

The Apify Instagram actors trip rate limits within minutes for any account-aware queries (looking up a list of handles, scraping followers, etc.). Use them only for a-known-handle metadata pull (one-off, "what's the bio of @somehandle"), not for discovery. For discovery, Google Maps' Instagram-link extraction (which the Maps actor returns natively in `instagrams[]`) is reliable enough.

### Manual proxy rotation

Apify's bundled proxies handle this. Trying to bring my own proxy pool, set custom rotation rules, and feed it to a custom scraper takes a week and is worse than out-of-the-box Apify performance. The platform tax is real but the engineering tax of doing it yourself is bigger.

## Cost shape

Apify charges per credit, where credits are roughly proportional to compute time + data transfer.

For my typical Turkish-business search (4 search strings, 50 places per string, 50% of which have detailed pages crawled):

- Cost per run: ~$0.30
- Records returned: ~150-200 unique businesses (after dedupe across search strings)
- Per-record cost: ~$0.0015

That's well below the value of a single converted lead in any B2B outreach, even at low conversion rates. The economics work.

## n8n integration

The lead-gen pipeline (see [`n8n-claude-orchestration`](./n8n-claude-orchestration.md) Pattern 3) wraps this Apify call as the first node in a longer flow:

```
[n8n Manual Trigger or webhook]
       ↓
n8n HTTP Request → Apify run-sync endpoint
   POST https://api.apify.com/v2/acts/compass~google-maps-scraper/run-sync
       ↓
n8n Code node: leanBusiness() field cleanup
       ↓
n8n Loop (5 at a time): Claude prompt for outreach DM
       ↓
n8n Filter: drop records where Claude flagged riskLevel='high'
       ↓
n8n Google Sheets: write final list for human review
```

The Apify call takes 60-180 seconds depending on search size. n8n's `run-sync` mode blocks until the actor finishes, which is fine for batch flows; for interactive, switch to async with a webhook callback.

## Why this is in the vault

If you ask my agent "How should I scrape Turkish vets / lawyers / clinics for outreach?", this is the right answer. The `language` + `countryCode` + `maxCrawledPlacesPerSearch` combination is non-obvious until you've burned credits on the wrong actor configuration twice. The field-cleanup pattern is muscle memory I've developed but cannot find documented anywhere; I had to learn each field's value the hard way.

This is the kind of niche operational knowledge — emerging-market specifics, actor-config ergonomics, cost-per-record reality — that an LLM trained on the open web cannot answer well. Apify's own docs cover the actor's capabilities; they do not cover what works for Turkish-language searches with phone-prioritised contact extraction. That's why this page exists.

## Cross-references

- [`n8n-claude-orchestration`](./n8n-claude-orchestration.md) — Pattern 3 wraps this Apify call inside an end-to-end lead-gen flow.
- [`gemini-3-pro-vs-claude-haiku`](./gemini-3-pro-vs-claude-haiku.md) — Claude's role in the outreach-DM step (downstream of this scrape).
- [`build-in-public-hackathon-strategy`](../05-process/build-in-public-hackathon-strategy.md) — the same lead-gen tooling can target hackathon judges or grant reviewers if needed.
