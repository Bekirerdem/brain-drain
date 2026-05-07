# Motion Graphics — Live Protocol Direction (Design Spec)

> Brand: Linear/Stripe deliberation, not playful slop. Motion serves the protocol metaphor — settlements arrive, value flows, the system feels alive.

**Goal:** Lift the landing experience from "a site with some animations" to "a protocol that you watch breathing." Adds a `LiveEventsContext` so settlement arrivals become a first-class app event, then layers seven motion features on top of it — four polish, three concept.

**Philosophy hierarchy** (decision order when tuning):
1. **Truthful** — every motion ties to a real state change (mount, scroll, settlement, hover, tap). No decorative hover wiggles.
2. **Restrained** — under 800ms even for the most dramatic flourish; subtle outscale (≤1.04) over flashy ones.
3. **Reduced-motion safe** — every motion call has a final-state fallback. Site is fully usable with motion off.
4. **Brand-coherent** — accent green `#19fb9b`, secondary violet `#9945ff`, amber `#fbbf24`. Already-defined easing tokens reused (`--ease-out-expo`, `--ease-out-quart`).

---

## 1. Motion System (constants & primitives)

A single `src/lib/motion/presets.ts` becomes the source of truth for all spring/easing/stagger constants. Existing Hero TIMING object stays in place but its springs migrate to import from here.

```ts
// src/lib/motion/presets.ts
export const SPRINGS = {
  snappy:  { type: "spring", stiffness: 400, damping: 30 } as const,  // dropdowns, header
  smooth:  { type: "spring", stiffness: 300, damping: 30 } as const,  // sections, paragraphs
  bouncy:  { type: "spring", stiffness: 280, damping: 26 } as const,  // hero cards, vault cards
  stiff:   { type: "spring", stiffness: 350, damping: 28 } as const,  // headlines, top content
  packet:  { type: "spring", stiffness: 220, damping: 22 } as const,  // settlement packet trail
} as const;

export const STAGGER = {
  tight:   0.04,  // dense rows (feed)
  normal:  0.06,  // medium grids (vault cards)
  relaxed: 0.12,  // hero cards, stripe cells
} as const;

export const OFFSETS = {
  rise: 16,    // section paragraphs, card entries
  drop: -8,    // top-anchored elements
  edge: 24,    // packet horizontal travel
} as const;

export const DURATION = {
  kick:    300,   // stat stripe kicker flash
  reveal:  600,   // mount fades
  packet:  720,   // packet trail full arc
} as const;
```

Why a presets file: **named timing constants** is a non-negotiable per the page-load-animations recipe — magic numbers in `delay` props rot fast. Every new motion in this spec imports from here.

---

## 2. LiveEventsContext (the spine)

A lightweight pub/sub that turns "feed got new payouts" into an app-wide event the OrbitVisual and stat stripe kicker subscribe to.

```ts
// src/lib/live-events/context.tsx
"use client";

const MAX_RECENT = 5;

type LiveEvent = { signature: string; vaultSlug: string | null; ts: number };

type Ctx = {
  recent: LiveEvent[];
  push: (e: LiveEvent) => void;
};

export const LiveEventsContext = createContext<Ctx | null>(null);

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<LiveEvent[]>([]);
  const push = useCallback((e: LiveEvent) => {
    setRecent((prev) => [e, ...prev.filter((p) => p.signature !== e.signature)].slice(0, MAX_RECENT));
  }, []);
  return (
    <LiveEventsContext.Provider value={{ recent, push }}>
      {children}
    </LiveEventsContext.Provider>
  );
}

export function useLiveEvents() {
  const ctx = useContext(LiveEventsContext);
  if (!ctx) throw new Error("useLiveEvents must be used within LiveEventsProvider");
  return ctx;
}
```

**Wiring:**
- `src/app/layout.tsx` wraps `<main>` with `<LiveEventsProvider>`.
- `LiveActivityClient.fetchPayouts` calls `push({ signature, vaultSlug, ts: Date.now() })` for each new sig (post-dedupe with `seenRef`).
- `OrbitVisual` reads `recent[0]` and triggers a one-shot pulse on change.
- `StatStripe` watches `recent.length` increment to fire the kicker (decoupled from the underlying number animation).

Why context, not props: OrbitVisual lives inside Hero, which is server-rendered above the fold; LiveActivityClient lives lower in the page. Context lets either component subscribe without prop-drilling through the layout.

**Server-render safety:** Provider mounts client-side only. SSR sees the static initial state from each consumer.

---

## 3. Page Polish Baseline (4 features)

### 3.1 LiveActivity section entrance choreography

**Problem:** the section currently shows up fully-rendered when scrolled into view — header, stripe, feed rows all snap in at once. Hero's stage choreography sets the bar; this section should match it.

**Storyboard** (triggered when section enters viewport with `-160px` margin):

```
Stage 0  -- empty (initial state for all)
Stage 1  100ms  eyebrow + headline rise (smooth spring)
Stage 2  280ms  body paragraph rise
Stage 3  460ms  stat stripe — 4 cells stagger 60ms each
Stage 4  720ms  feed rows — visible 5 rows stagger 50ms each
```

**Implementation pattern** (matches Hero):
- `LiveActivityClient` gets a `stage` integer state, advanced by a `setTimeout` chain inside a `useEffect` triggered by an `IntersectionObserver` (or `useInView` from framer).
- Each animated element: `initial={{ opacity: 0, y: OFFSETS.rise }}` + `animate={{ opacity: stage >= N ? 1 : 0, y: stage >= N ? 0 : OFFSETS.rise }}` + `transition={SPRINGS.smooth}`.
- Reduced motion → `stage = 99` immediately.
- Once stage >= 4, content stays visible (no exit animation when scrolling away).

### 3.2 Vault list cards stagger

**File:** `src/app/_components/VaultCard.tsx` (currently no motion) wrapped in a thin `<motion.div>`. The `vaults/page.tsx` parent keeps its server-rendered layout.

**Pattern:**
```tsx
<motion.div
  initial={{ opacity: 0, y: OFFSETS.rise }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ ...SPRINGS.bouncy, delay: index * STAGGER.normal }}
>
  <VaultCard ... />
</motion.div>
```

`index` comes from the `.map` in `vaults/page.tsx`. Cap effective stagger at index 8 (`Math.min(index, 8) * STAGGER.normal`) so a 24-vault page doesn't stagger forever.

### 3.3 Header scroll-state

**File:** `src/app/_components/Header.tsx`

**Behavior:** transparent at scrollY=0 → at scrollY > 24px, gain `backdrop-blur-md` + bottom border + slight bg tint. 200ms transition both ways.

**Implementation:** framer's `useScroll` + `useMotionValueEvent("change")` to flip a `scrolled` boolean. Apply via Tailwind class swap; the underlying CSS does the transition. (Avoids re-rendering on every scroll frame.)

### 3.4 CTA whileHover springs

**Targets:** "Mount your vault →" buttons in Hero, ForExperts, ForAgents, ForExperts CTA panel; "Install Phantom →" in dashboard/vaults-new; "ASK VAULT" in vault cards.

**Pattern:**
```tsx
<motion.button
  whileHover={{ scale: 1.02, y: -1 }}
  whileTap={{ scale: 0.98 }}
  transition={SPRINGS.snappy}
>
  ...
</motion.button>
```

For accent-green pill CTAs, additionally swap `hover:shadow-[0_0_36px_-6px_var(--color-accent)]` (already used) with a slightly larger `0_0_48px_-4px` on whileHover via inline style — gives a subtle glow lift on hover that matches the brand.

Replace `<Link>` with `<Link asChild>` pattern OR use `motion(Link)` to keep client-side nav.

---

## 4. Live Protocol Concept Upgrades (3 features)

### 4.1 Settlement packet trail

**The idea:** when a new settlement signature appears in the feed, a small green packet (~12×12px rounded square) animates from off the right edge of the feed table into the new row, then dissolves. Lands ~80ms before the row's existing fade-up flash, creating a "delivered → registered" two-beat rhythm.

**Visual:**
- Off-screen right (`x: 60, opacity: 0, scale: 0.6`)
- Lands at row's right edge (`x: 0, opacity: 1, scale: 1`) — `SPRINGS.packet`, ~600ms
- Holds 80ms
- Fades out (`opacity: 0`, 200ms `ease-out`)

**Implementation:** inside `ActivityFeed`, render an absolutely-positioned `<AnimatePresence>` layer. For each `signature` in `highlighted` set, mount a `<Packet>` keyed by signature. Packet self-removes via `setTimeout`(900ms) cleanup.

**Skip on mount:** the `seenRef`-based highlighted set already excludes initial-load rows. Only true new arrivals fire the packet.

**Reduced motion:** packet not rendered.

### 4.2 OrbitVisual feed-sync

**Current:** `OrbitVisual` runs a static loop of SVG `<animateMotion>` packets along three paths regardless of any real activity.

**Upgrade:** when `useLiveEvents().recent[0]?.signature` changes, the central "Brain Drain" node fires a one-shot pulse:
- Inner core scales 1.0 → 1.08 → 1.0 over 600ms (`SPRINGS.bouncy`)
- Glow halo opacity 0.6 → 1.0 → 0.6 same window
- Optionally: spawn one extra accent-green packet on `path-pay` for the same window (real settlement → real packet, instead of constant decorative loop)

**Implementation:** new `lastSig` state inside OrbitVisual derived from `recent[0]?.signature`; a `useEffect` on `lastSig` change toggles a `pulsing` boolean for 600ms via timeout; motion targets condition on that boolean.

The existing static loop stays — feed-sync ADDS to it, doesn't replace it (so the visual still feels alive when no settlements are happening).

**Hero is `"use client"` already**, so no SSR concerns.

### 4.3 Stat stripe kicker

**Trigger:** when `recent[0]?.signature` changes (top of the recent queue rotates → new event landed), fire a 300ms cell-border flash + AnimatedNumber digit bounce on the affected cells. Using the head signature as trigger (not `recent.length`) is necessary because the queue caps at 5 — length stops incrementing after the fifth event but the head still rotates with every arrival.

**Behavior:**
- Cell border (currently `border-[var(--color-border)]`): briefly transitions to `border-[var(--color-accent)]/40`, then back, 300ms total.
- Inside the cell, the AnimatedNumber gets a `scale: 1` → `1.04` → `1` mini-bounce timed to land 80ms after the cell border peak (so the eye reads "container reacts → number updates").
- Volume Settled and Settlements cells fire on every event; Distinct Agents only when payer is novel; Last Settlement always updates (the number naturally re-renders).

**Implementation:** `useEffect` on `recent[0]?.signature` change inside StatStripe → set `kickerActive` true → `setTimeout(300ms)` clears. AnimatedNumber accepts an optional `bumpOn` prop (a number that, when changed, triggers a brief scale tween via `useAnimationControls`).

---

## 5. Data Flow

```
┌─────────────────┐    push(event)     ┌────────────────────┐
│ LiveActivity    │───────────────────▶│ LiveEventsContext  │
│ Client          │                    │ (recent[5])        │
│ (poll /api)     │                    └─────────┬──────────┘
└──────┬──────────┘                              │
       │                                          │ useLiveEvents()
       │ highlighted set                          ├──────────▶ OrbitVisual
       │                                          │            (central pulse)
       ▼                                          │
   ┌───────────┐                                  ├──────────▶ StatStripe
   │ Packet    │                                  │            (kicker)
   │ trail     │                                  │
   │ + flash   │                                  └──────────▶ (future consumers)
   └───────────┘

        Independent:
        - Header (useScroll only, no event subscription)
        - VaultCard (whileInView on mount)
        - CTA buttons (whileHover, local)
```

Each motion has a single trigger source. No motion subscribes to multiple state sources.

---

## 6. Reduced Motion & Accessibility

Every component checks `useReducedMotion()`:
- Stage choreography: `stage = 99` immediately
- Cards stagger: skip delays, instant entrance
- Header scroll-state: still flips, but with no transition (CSS handles via `motion-safe:transition`)
- CTA whileHover: skip whileHover/whileTap
- Packet trail: not rendered
- OrbitVisual feed-sync pulse: not rendered (the existing static loop already respects reduced motion)
- Stat stripe kicker: not rendered (number still updates instantly)

`prefers-reduced-motion: reduce` should leave a fully-functional site with no detected motion above the existing static-content baseline.

---

## 7. Files Touched

**New:**
- `src/lib/motion/presets.ts` — spring/stagger/offset/duration constants
- `src/lib/live-events/context.tsx` — LiveEventsProvider + hook
- `src/app/_components/SettlementPacket.tsx` — packet trail animated div (extracted for clarity)

**Modified:**
- `src/app/layout.tsx` — wrap with LiveEventsProvider
- `src/app/_sections/Hero.tsx` — import SPRINGS from presets (no behavioral change)
- `src/app/_sections/LiveActivity.tsx` — pass section eyebrow/headline through stage choreography
- `src/app/_components/LiveActivityClient.tsx` — stage state, push to LiveEventsContext, mount SettlementPacket layer, kicker prop wiring
- `src/app/_components/AnimatedNumber.tsx` — accept optional `bumpOn` prop for kicker bounce
- `src/app/_components/OrbitVisual.tsx` — consume LiveEventsContext, central node pulse on event
- `src/app/_components/Header.tsx` — useScroll-driven scrolled state
- `src/app/_components/VaultCard.tsx` — wrap in motion.div with whileInView stagger
- `src/app/vaults/page.tsx` — pass index prop to VaultCard
- Hero/ForExperts/ForAgents CTA buttons — convert to motion (or motion(Link)) with whileHover/whileTap

---

## 8. Verification

**No test runner installed**, so verification is manual but structured:

1. **Type-check + lint clean** after every commit.
2. **Dev server visual sweep** at three viewports (375px, 768px, 1280px):
   - Reload landing — Hero choreography unchanged (regression check)
   - Scroll to LiveActivity — stage 1→4 visible cascade
   - Scroll to vault list — cards stagger in
   - Scroll up — header gains/loses backdrop
   - Hover all main CTAs — subtle scale + glow
3. **Trigger a real settlement:** `bun scripts/buy-query.ts "test query"` in a separate terminal. Watch the landing page:
   - Packet animates from right edge into new feed row
   - Row flashes green
   - Stat stripe cells border-flash + numbers bounce
   - OrbitVisual central node pulses
   - All four happen within ~1s of each other in a clear visual sequence
4. **Reduced motion:** Chrome DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Reload, repeat the settlement test. Numbers still update, feed still appears, but no packet, no pulses, no border flashes.
5. **Mobile:** repeat at 375px — no horizontal overflow, no clipped packets, choreography still readable.

---

## 9. Sequencing & Commits

Three commits, one per layer:

1. **`feat(motion): centralize spring/stagger presets + live-events context`** — `presets.ts` + `context.tsx` + Hero migrated to use presets (no behavioral change, just plumbing).
2. **`feat(motion): page polish baseline`** — LiveActivity entrance + VaultCard stagger + Header scroll-state + CTA whileHover (4 polish features).
3. **`feat(motion): live protocol — packet trail, orbit sync, stat kicker`** — three concept upgrades, all wired through the LiveEventsContext from commit 1.

Each commit must build clean (`bunx tsc --noEmit` + `bun run lint` for files I touch) and the dev server must render without runtime errors at the end of each.

---

## 10. Out of scope (intentionally)

- Hero scroll parallax (reserved for "Premium Editorial" direction)
- Vault card 3D tilt on hover
- SystemMap self-drawing reveal
- WebSocket / SSE replacement for the 10s polling (separate plumbing concern)
- Any motion below `LiveActivity` that doesn't have a high-impact opportunity (Footer, etc. — already restrained, leave alone)

These can be picked up in a Day 9 or post-submit polish round. This spec stays focused on **Live Protocol** direction only.
