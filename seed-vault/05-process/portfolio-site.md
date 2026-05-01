---
title: bekirerdem.dev — personal portfolio site, stack and shipped state
tags: [portfolio, astro, cloudflare, web, process]
created: 2026-04-19
updated: 2026-04-29
url: https://bekirerdem.dev
repo: https://github.com/Bekirerdem/bekirerdem.dev
status: production
---

# What this site is

`bekirerdem.dev` is my personal portfolio site, deployed on Cloudflare Pages. The site is intentionally a minimal black-and-white landing optimised for typography and motion, fork-rooted on the AW-2025-Portfolio template by waaark. Production-grade for hiring conversations and grant-application linking, not a CMS.

- **Production:** https://bekirerdem.dev
- **Preview:** https://bekirerdem.pages.dev
- **Repo:** https://github.com/Bekirerdem/bekirerdem.dev (private)
- **Last meaningful deploy:** 2026-04-19 (`69ed6bd` — hero rework + skills modernisation)
- **Trigger:** manual `wrangler pages deploy dist`. Cloudflare Pages' Git provider is not auto-wired on this project.

## Tech stack

| Layer | Choice | Why |
| :-- | :-- | :-- |
| Framework | **Astro 5.7** | Best-in-class for content-light sites; zero JS by default; islands of interactivity only where needed. |
| Styling | **SCSS** with CSS modules + custom theme tokens | Type-safe class names; tokens in one file (`tokens.scss`) drive the entire palette. |
| Animation | **GSAP 3.13 + ScrollTrigger** | Industry-standard for editorial-feel scroll motion; mature accessibility story. |
| Smooth scroll | **Lenis 1.3** | Clean inertial scroll; disables itself on touch devices automatically. |
| Image optimisation | `astro:assets` Image | AVIF/WebP auto-emit; responsive srcset; build-time. |
| Video | Native `<video>` + IntersectionObserver autoplay | No third-party player; bandwidth-aware autoplay only when in view. |
| i18n | Custom `translations.ts` → `build-i18n.mjs` → `public/i18n.js` | Build-time bundle, inline script, no client-side framework dependency. |
| Type checking | **TypeScript strict** | Catches the ~3-4 typo-shaped mistakes per refactor that runtime doesn't. |
| Build tool | **Bun 1.3.11** | Faster install; npm fallback works for legacy clients. |
| Deploy | **Cloudflare Pages** project `bekirerdem` | Edge CDN; sub-50ms TTFB globally; Workers integration available. |
| SEO | JSON-LD Schema.org Person + WebSite | `Person` includes `knowsAbout` array (14 concepts); helps semantic search. |

The intentional non-choices: no Vercel (Cloudflare's edge is fine), no React (Astro is enough for this content density), no headless CMS (the content fits in `translations.ts`).

## Site structure (in render order)

1. **Hero (`SHero.astro`)** — name, role line ("AI & Blockchain Engineer"), two `ASeparator`s with binary-encoded streaming text strips ("Bekir-Erdem-Bursa-Türkiye" / "AI × Blockchain × Automation"), fluid typography that scales with viewport.
2. **About (`SAbout.astro`)** — four paragraphs of self-description, Skills 4-category grid (Frontend / Web3 / AI / Automation), vertical side-tickers running text down the left and right edges of the section.
3. **Skills** — under the same component as About: Frontend (TS / Next / React / Astro), Web3 (Solidity / Foundry / Avalanche), AI (Claude / Gemini / Agents), Automation (n8n / Apify / MCP), plus three text-only rows below for Backend, Deploy, Design.
4. **Work (`SWork.astro`)** — project cards: ChainBounty currently visible, more to be added.
5. **Dream It / Build It (`SDreamIt.astro`)** — large slogan typography ("HAYAL ET / İNŞA ET" — Turkish-language stylistic accent kept on this section deliberately).
6. **My Way (`SMyWay.astro`)** — 18-image timeline rendered through an `AMedia` component that supports both static images and lazy-loaded videos.
7. **Footer (`SiteFooter.astro`)** — contact details + animated particle canvas as background.

## Key components

- **`AMedia.astro`** — reusable media tile abstraction. Accepts either an `image` (Astro:assets) or a `video` (`webm + poster`) prop. For videos, an IntersectionObserver lazy-loads and autoplays only when the tile enters the viewport. Saves ~10MB of unnecessary download on first paint for the My Way section.
- **`ASeparator.astro`** — the binary-encoded text streams used in Hero. Renders an animated horizontal line of pseudo-data with periodic decoded glimpses of the actual phrase.
- **`SiteHead.astro` / `SiteMobileMenu.astro`** — the desktop nav and mobile menu drawer. Blog and Studio links exist with "Coming Soon" badges; clicks suppressed.

## i18n pipeline

```
src/i18n/translations.ts          (TR / EN source; canonical)
        ↓
scripts/build-i18n.mjs            (build-time script; runs on every build)
        ↓
public/i18n.js                    (inline client bundle, ~5KB minified)
        ↓
[data-i18n="key"] across all components
```

Language switch: `setLang('tr' | 'en')` writes to `localStorage` and dispatches a custom `langchange` event that components listen for and re-render against.

This pipeline is deliberately not React i18next or similar. The site has ~50 strings; a real i18n framework would be 80x the runtime weight for the same outcome.

## What shipped on 2026-04-19

The most recent meaningful session:

**Hero:** introduced ASeparator binary-streams above and below the name; changed the role line from "Software Developer" to "AI & Blockchain Engineer".

**Menu:** added Blog and Studio links to both desktop and mobile menus, with "Coming Soon" badges that prevent clicks. Reserve the namespace before the content lands.

**About:** rewrote the four paragraphs — repositioned FunnyDog Farm as "partner + facility scope" rather than "operating", which is the accurate framing as of 2026.

**Skills:** restructured into 4-category grid (was a flat tag cloud previously); added TypeScript, Git, Claude as explicit skills; fixed a font-overflow bug on the Automation row at narrow viewports.

**Dream It / Build It:** moved the "Build It" baseline 12px upward to better hint at the cross-positioning composition.

**My Way:** introduced the `AMedia` component abstraction, swapped two static images (`hacker-1`, `hacker-2`) for lazy-loaded webm variants, ~40% bandwidth reduction on the section.

**i18n:** synced TR and EN translations across all changed copy.

## What's still in the queue

Not yet shipped, deferred for the next session:

- **Work section side perspectives.** I tried three iterations of perspective-distorted side panels (floating tiles, full-width trapezoids, small cells); rejected all three. Need a fourth idea.
- **OG image regeneration.** Need a headless browser (Playwright) to capture the new hero composition. Holding for now because the existing OG card is acceptable.
- **My Way section site-screenshot tiles.** Same Playwright dependency. Not blocking.
- **About / Skills side perspective fills.** Three iterations failed. The vertical tickers are the placeholder.

## Performance and SEO

- **AVIF / WebP auto-optimisation** for 16 source images. ~70% size reduction vs original PNG/JPG.
- **JSON-LD Schema.org Person + WebSite.** The `Person` JSON-LD includes a `knowsAbout` array of 14 concepts (Solidity, Foundry, Avalanche, MCP, agentic systems, etc.) that helps semantic search and tools like Brave's site-info card.
- **Sitemap** + `robots.txt` with index permission for the production domain only.
- **`prefers-reduced-motion` guard.** When a user has reduced-motion enabled, Lenis smooth scroll and GSAP ScrollTrigger animations are both disabled. The site degrades cleanly to a static layout.
- **`Cache-Control` headers** on static assets via Cloudflare Pages `_headers` file: 1-year immutable for hashed assets, 1-day for HTML.

## Deploy commands

```bash
# Local development
npm run dev      # Astro dev server with HMR

# Production build
npm run build    # Astro builds to dist/

# Regenerate i18n bundle (after editing translations.ts)
node scripts/build-i18n.mjs

# Deploy to Cloudflare Pages (manual; no Git provider)
npx wrangler pages deploy dist \
  --project-name=bekirerdem \
  --branch=main \
  --commit-dirty=true
```

The `--commit-dirty=true` flag allows deploying without pushing the commit first; useful for hot-fix iterations during a session.

## Why this is in the vault

The site is the visible artefact behind every grant application, every hackathon submission, every cold-outreach DM. Its stack is the canonical reference for "what does this builder choose by default?" — Astro for content sites, Cloudflare for edge deploy, Bun for tooling, GSAP for motion. The decisions transfer; the site is the proof.

## Cross-references

- [`build-in-public-hackathon-strategy`](./build-in-public-hackathon-strategy.md) — the same discipline applied to a hackathon's public commit log.
- [`magic-byte-file-verification`](../04-devops-gotchas/magic-byte-file-verification.md) — the WOFF/WOFF2 bug that bit me during a portfolio rework session.
- [`koza-l1-deployment-lessons`](../01-avalanche-evm/koza-l1-deployment-lessons.md) — `koza.bekirerdem.dev` is on the same Cloudflare Pages account, same deploy pattern.
- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — Brain Drain is on Vercel + Cloudflare hybrid, a deliberate divergence from the all-Cloudflare default this site uses.
