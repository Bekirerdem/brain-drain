# Hero Scroll Cinematic — Pin & Morph (Design Spec)

> **Date:** 2026-05-08
> **Direction:** A — Hero Pin-and-Morph (selected from Live Protocol Concepts agent research, 2026-05-08).
> **Builds on:** existing motion-graphics-spec (Live Protocol direction, shipped commits `179301a` `a910e1e` `92970b0`). This spec ADDS a scroll-cinematic layer, does NOT replace prior work.

**Goal:** Turn the first 150vh of the landing page into a directed three-act morph that physically rewrites the OrbitVisual data-flow diagram as the user scrolls. By the time Hero unpins, the user has watched the protocol scale from a single agent paying a single vault to a network of agents paying many vaults to a real-time settlement cascade. The LiveActivity feed below picks up the narrative with its existing entrance choreography.

**Why this direction over B (horizontal protocol journey) or C (layered depth Telescope-style):**
- A leverages our existing `OrbitVisual.tsx` asset — no new visual to design from scratch
- A is single-pinned-section-bounded — implementation risk is contained vs B's multi-section pin-row
- A tells the *protocol's own story* (single → network → cascade) better than C's depth metaphor
- A is the GSAP recommendation from the 2026-05-08 research agent

---

## 1. Tech Stack Additions

| Package | Version | Why |
|---|---|---|
| `gsap` | latest 3.x | Free since Webflow 2024 acquisition; closed-source but our use is permitted (not building a Webflow competitor). ~27KB gz. |
| `@gsap/react` | latest | Provides `useGSAP()` — handles `gsap.context()` cleanup, isomorphic layout effect for SSR safety. Mandatory for App Router. |
| `lenis` | 1.3.x | MIT, ~25KB gz. Smooth-scroll source-of-truth so framer-motion's `useScroll` and GSAP's `ScrollTrigger` share a single scroll listener. Without it the two libraries fight. |

ScrollTrigger ships in the gsap package; no separate install needed but must be registered.

**Total bundle delta:** ~75KB gz. Acceptable for a marketing landing page; tree-shakes cleanly.

**License note:** GSAP became free in Apr 2024 after Webflow acquisition, but it is **not MIT** — closed source, prohibits use in Webflow-competing tools. Brain Drain is fine. Documented to prevent future "wait, can we use this commercially" panic.

---

## 2. Lenis + ScrollTrigger Wiring

A new client provider runs Lenis as the smooth-scroll engine and pipes its scroll events into both ScrollTrigger and the browser's native scrollY (which framer-motion's `useScroll` reads).

**File:** `src/lib/scroll/lenis-provider.tsx`

**Behavior:**
- Mounts a `Lenis` instance once at layout root
- Registers GSAP plugins (`gsap.registerPlugin(ScrollTrigger)`)
- Pipes `lenis.on('scroll', ScrollTrigger.update)`
- Drives Lenis's RAF inside `gsap.ticker.add` so they share a frame
- Disables Lenis touch sync (`syncTouch: false`) — iOS <16 has unpredictable behavior per Lenis docs
- Auto-disables on `prefers-reduced-motion: reduce` and on viewport width < 1024px (matches our ScrollTrigger gate; no smooth scroll on mobile either)

**Mounting point:** `src/app/layout.tsx` wraps `<main>` (inside `<LiveEventsProvider>` from prior spec). Order: `body > LiveEventsProvider > LenisProvider > Header + main + Footer`.

**Why a provider, not direct setup in Hero:** Lenis must live above any scroll-driven component, must mount once for the whole page, and must clean up on route change. A provider handles all three.

---

## 3. The Morph — Three States

OrbitVisual's existing coordinate system: `viewBox=520×380`, Agent at `(80,190) r=36 violet`, Brain Drain at `(262,190) r=62 green` with glow halo `r=120`, Phantom Cash at `(440,190) r=36 amber`. Three paths: `path-pay` (120→200 horizontal), `path-snippet` (Q-curve loop), `path-settle` (324→404 horizontal).

The morph is implemented as a single GSAP timeline scrubbed to scroll progress 0→1. Three keyframes define the named states; GSAP interpolates between them.

### State 1 — "Single flow" (scroll progress 0.0)
- Agent + Brain Drain + Phantom Cash in current positions
- Existing static loop of `<animateMotion>` packets continues on the three base paths
- Hero text at 100% opacity (matches mount-time state from existing Hero stage choreography)
- No additional ghost nodes
- Aurora background at base intensity
- **Reading:** "Here's a single agent paying a single vault."

### State 2 — "Network fan-out" (scroll progress 0.5)
- Agent stays anchored at `(80,190)`; two ghost agents fade in at `(80,130)` and `(80,250)` — same radius, 50% opacity
- Phantom Cash stays at `(440,190)`; two ghost vaults fade in at `(440,130)` and `(440,250)` — same radius, 50% opacity
- New transient paths drawn:
  - 3 pay paths: `(80,130)→(200,170)`, `(80,190)→(200,190)`, `(80,250)→(200,210)` — converging into Brain Drain
  - 3 settle paths: `(324,170)→(440,130)`, `(324,190)→(440,190)`, `(324,210)→(440,250)` — diverging out
- Brain Drain glow halo intensifies (current opacity 1 → 1.3 via stronger fill stop)
- Hero text remains at 100% opacity
- **Reading:** "Many agents query many vaults. The protocol routes."

### State 3 — "Settlement cascade" (scroll progress 1.0)
- All 3 vaults at right emit downward packet trails (small accent-green dots, animated `y: 0 → 380` looped) — visually flowing toward the bottom of the viewport
- Brain Drain node scales `1.0 → 0.85` and translates `y: 0 → -20` (shrinks + lifts)
- Background aurora intensifies (`opacity 0.5 → 0.85` on the existing aurora-canvas layer)
- Hero text fades to `opacity: 0.35` — the visual takes focus
- Mock receipt count counter appears next to Brain Drain ("+1247 receipts/min" in mono, fading in)
- **Reading:** "And the cascade you'll see below is happening right now."

When Hero unpins (scroll past `150vh`), the next section (LiveActivity) snaps to viewport top and fires its existing entrance choreography. The packet streams from State 3 fade out within 200ms of unpin to avoid visual collision with the LiveActivity stat stripe.

---

## 4. Pin Behavior + Timeline Structure

```js
ScrollTrigger.create({
  trigger: heroEl,
  pin: true,
  start: "top top",
  end: "+=150%",        // user scrolls 1.5 viewport heights while pinned
  scrub: 1,             // 1s catch-up smoothing — feels Lenis-native, not jittery
  pinType: "fixed",     // avoids pin-spacer breaking sticky header above
  anticipatePin: 1,
});

const tl = gsap.timeline({
  scrollTrigger: { /* same as above */ },
});

// 0.0 → 0.5: State 1 → State 2
tl.to(".orbit-agent-ghost-top", { opacity: 0.5, duration: 0.5 }, 0);
tl.to(".orbit-agent-ghost-bottom", { opacity: 0.5, duration: 0.5 }, 0);
tl.to(".orbit-vault-ghost-top", { opacity: 0.5, duration: 0.5 }, 0);
tl.to(".orbit-vault-ghost-bottom", { opacity: 0.5, duration: 0.5 }, 0);
tl.to(".orbit-fanout-paths", { opacity: 0.7, strokeDashoffset: 0, duration: 0.5 }, 0);
tl.to(".orbit-glow", { opacity: 1.3, duration: 0.5 }, 0);

// 0.5 → 1.0: State 2 → State 3
tl.to(".orbit-cascade-stream", { opacity: 1, duration: 0.5 }, 0.5);
tl.to(".orbit-brain-node", { scale: 0.85, y: -20, duration: 0.5, transformOrigin: "262 190" }, 0.5);
tl.to(".aurora-canvas", { opacity: 0.85, duration: 0.5 }, 0.5);
tl.to(".hero-text-block", { opacity: 0.35, duration: 0.5 }, 0.5);
tl.to(".receipt-counter", { opacity: 1, duration: 0.5 }, 0.5);
```

Timeline lives inside a `useGSAP()` hook in `HeroScrollScene.tsx`. All GSAP-targeted elements get `className` hooks added; OrbitVisual.tsx exports those classes as constants for safety.

**Existing Hero stage choreography (mount entrance) stays untouched.** It runs at `t=0` and lands Hero at the visual State 1 baseline. The scroll timeline takes over from there.

---

## 5. Pin Boundary — What's Inside vs Outside the Pin

Existing Hero `setStage(1..6)` chain on mount sets opacity/y on live indicator, headline, paragraph, CTAs, OrbitVisual, and HERO_STATS bottom stripe. By scroll progress 0 the user has already seen this complete (mount entrance is ~850ms). Scroll then drives the morph.

Hero section is taller than 100vh (visual + heading + paragraph + CTAs + HERO_STATS bottom stripe + 28lg-spaced gaps). If we pin the entire section, only the top viewport-height is ever visible — HERO_STATS stripe stays below the viewport and never enters frame during the 150vh pin. That breaks the existing layout intent (HERO_STATS is meant to be read).

**Pin only the upper morphable region:**
- **Inside pin:** live indicator + headline + paragraph + CTAs + OrbitVisual block (the grid row that's `lg:grid-cols-[1.15fr_1fr]`)
- **Outside pin (scrolls normally):** HERO_STATS stripe at the bottom of the section

**Implementation:** wrap only the upper `<div className="grid lg:grid-cols-[1.15fr_1fr] ...">` block in a ref'd container; ScrollTrigger uses *that* element as `trigger` and `pin: true`. HERO_STATS stripe sits below as a sibling, unaffected.

**User experience:** scroll past 150vh of pin → upper Hero unpins → HERO_STATS stripe scrolls into view normally (its existing whileInView animation still fires) → LiveActivity follows. The narrative reads as: morph cinematic → "here are the specs" → "here are the live receipts."

---

## 6. Mobile + Reduced Motion

Wrap the entire ScrollTrigger setup in `ScrollTrigger.matchMedia` so it ONLY runs at `(min-width: 1024px) and (prefers-reduced-motion: no-preference)`:

```js
ScrollTrigger.matchMedia({
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)": () => {
    // setup pin + timeline
    return () => { /* cleanup auto-handled by useGSAP context */ };
  },
});
```

Below 1024px or with reduced-motion enabled:
- No Lenis (provider becomes a no-op pass-through)
- No ScrollTrigger pin
- No morph timeline
- Standard scroll, Hero behaves exactly as it does today (mount entrance + framer micro-interactions from prior commits)

Mobile users get a normal scroll experience. Cinematic is desktop-only by intent — every reference site does this.

---

## 7. File Structure

**New:**
- `src/lib/scroll/lenis-provider.tsx` — Lenis + ScrollTrigger sync, mobile/reduced-motion gated
- `src/lib/scroll/gsap-init.ts` — single-call plugin registration
- `src/app/_components/HeroScrollScene.tsx` — client component that pins Hero and runs the morph timeline; imports OrbitVisual + Hero text and wires ScrollTrigger
- `src/app/_components/CascadeStream.tsx` — small SVG component for the State 3 downward packet trails (3 paths, 5 packets each, animateMotion)

**Modified:**
- `src/app/layout.tsx` — wrap `<main>` with `<LenisProvider>` (inside existing `<LiveEventsProvider>`)
- `src/app/_sections/Hero.tsx` — wrap return JSX in `HeroScrollScene` component; expose className hooks (`.hero-text-block`, `.receipt-counter`)
- `src/app/_components/OrbitVisual.tsx` — add ghost nodes (3 agents, 3 vaults, currently 1 each), fan-out paths, className hooks (`.orbit-agent-ghost-*`, `.orbit-vault-ghost-*`, `.orbit-fanout-paths`, `.orbit-glow`, `.orbit-brain-node`, `.orbit-cascade-stream`). Initial state: ghosts opacity=0, fanout paths opacity=0, cascade stream opacity=0 — so non-cinematic experience renders State 1 unchanged.

**Note on OrbitVisual changes:** ghost nodes and fan-out paths add to the SVG but are invisible at rest. On reduced-motion / mobile, they stay invisible (no motion runs). The static experience is byte-identical to today.

---

## 8. Implementation Gotchas (from research, must apply)

- **`useGSAP()` is mandatory** in App Router — wraps `gsap.context()`, reverts everything on unmount. Without it ScrollTriggers leak across `next/link` navigation. Must be inside a `"use client"` file.
- **Plugin registration once** — call `gsap.registerPlugin(ScrollTrigger)` only in `gsap-init.ts`, imported by HeroScrollScene. Duplicate registration warns in dev.
- **Lenis ↔ ScrollTrigger sync is one-way** — `lenis.on('scroll', ScrollTrigger.update)` + Lenis RAF inside `gsap.ticker.add` + `gsap.ticker.lagSmoothing(0)`. Never run both internal RAFs.
- **Layout-shift refresh** — fonts/images loading after mount shift ScrollTrigger start/end. Reserve `aspect-ratio` on hero visuals; call `ScrollTrigger.refresh()` from a `ResizeObserver` on the body if needed.
- **Pin spacer + sticky header** — ScrollTrigger pin inserts a wrapper that breaks `position: sticky` on header above. Use `pinType: "fixed"`; verify Header's `z-index: 40` keeps it above the pinned hero.
- **`scrub: 1` not `scrub: true`** — `true` snaps instantly to scroll position; jittery on Lenis. `1` adds 1s catch-up smoothing — feels native.
- **Hydration safety** — ScrollTrigger reads `window`. Inside `useGSAP` (which uses isomorphic layout effect) or `useEffect`. Never at module scope.
- **Dev HMR** — ScrollTrigger instances survive Fast Refresh and stack. `useGSAP` cleans them via context revert; if you ever write raw `gsap.to(...)` outside the hook during dev, full reload to clear ghosts.

---

## 9. Verification Protocol

**No test runner.** Manual verification:

1. **Type-check + lint** clean: `bunx tsc --noEmit` + `bun run lint` for touched files.

2. **Desktop ≥1024px (Chrome):**
   - Reload landing — Hero mount entrance fires (existing stage choreography, ~850ms)
   - Slowly scroll: at 0vh State 1, at 75vh State 2 (ghost agents/vaults visible, fan-out paths drawn, glow intensified), at 150vh State 3 (cascade streams flowing down, brain node smaller and lifted, text dimmed, receipt counter visible)
   - Continue scrolling — Hero unpins, LiveActivity enters viewport with its existing choreography
   - Scroll back up — Hero re-pins and morph reverses smoothly (scrub: 1 makes this feel intentional)

3. **Mobile (375px / 502px):** No pin, no morph. Hero behaves exactly as today. No console errors.

4. **Reduced motion (DevTools → Rendering → `prefers-reduced-motion: reduce`):** No pin, no morph. Hero shows mount entrance then is static. OrbitVisual's existing `<animateMotion>` packets do NOT run (already gated on `reduced`).

5. **Other browsers:** Spot-check Safari + Firefox at desktop. Lenis + GSAP support both; the gotcha is iOS Safari touch scroll, which we already disable via mobile gate.

6. **Bundle verification:** `next build` output. Total JS for `/` route should grow by ~75KB; if it's >120KB, investigate.

---

## 10. Sequencing & Commits

Three commits, in order:

1. **`feat(scroll): lenis + gsap scrolltrigger plumbing`** — install gsap + @gsap/react + lenis, create LenisProvider + gsap-init, wrap layout. No visual change yet (LenisProvider is a passive plumbing layer; mobile/reduced-motion fully no-op).

2. **`feat(orbit): ghost nodes + fan-out paths (invisible by default)`** — extend OrbitVisual.tsx with 3 ghost agents, 3 ghost vaults, fan-out paths, className hooks. All new elements at opacity=0 by default. Visual on the rendered page is unchanged. CascadeStream.tsx component created (also opacity=0 by default).

3. **`feat(scroll): hero pin-and-morph cinematic`** — HeroScrollScene wraps Hero, sets up ScrollTrigger pin + timeline driving the three states. Reduced-motion + mobile guards. The visible cinematic lands here.

Each commit must build clean and the dev server must render without runtime errors.

---

## 11. Out of Scope (for follow-up)

- Direction B (horizontal protocol journey) and Direction C (layered depth) reserved for potential follow-up
- Cross-section coordination (State 3 cascade packets literally landing on LiveActivity feed rows) — interesting but adds significant complexity; State 3 cascade self-contained inside Hero is good enough for v1
- WebGL/Three.js OrbitVisual upgrade
- Section-to-section page transitions (next/link route changes)
- GSAP `SplitText` for character-level reveals on body copy
- Receipt counter actual data binding (uses static "+1247 receipts/min" placeholder for v1; could later read from `useLiveEvents().recent.length` or a derived RPM)
