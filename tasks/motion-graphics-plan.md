# Motion Graphics — Live Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the seven motion features defined in `tasks/motion-graphics-spec.md` — four polish (LiveActivity entrance, vault card stagger, header scroll-state, CTA whileHover) and three concept (settlement packet trail, OrbitVisual feed-sync, stat stripe kicker) — all wired through a new `LiveEventsContext` spine.

**Architecture:** New `lib/motion/presets.ts` centralizes spring/stagger/duration constants. New `lib/live-events/context.tsx` is a tiny pub/sub that turns "feed got a new payout" into an app-wide event. Hero, LiveActivity, OrbitVisual, StatStripe, and StatBumper all import from these. Layout wraps `<main>` with the provider.

**Tech Stack:** framer-motion v12 (already installed), React 19, Next.js 16 App Router, TypeScript strict. No test runner installed — verification via `bunx tsc --noEmit`, `bun run lint`, dev server, and a real settlement triggered with `bun scripts/buy-query.ts`.

---

## File Structure

**Create:**
- `src/lib/motion/presets.ts` — SPRINGS, STAGGER, OFFSETS, DURATION constants
- `src/lib/live-events/context.tsx` — LiveEventsProvider + useLiveEvents hook
- `src/app/_components/SettlementPacket.tsx` — animated packet that lands on a new feed row

**Modify:**
- `src/app/layout.tsx` — wrap `<main>` with `<LiveEventsProvider>`
- `src/app/_sections/Hero.tsx` — pull springs from `lib/motion/presets`
- `src/app/_sections/LiveActivity.tsx` — pass `id="live"` props through; SSR untouched, choreography in client
- `src/app/_components/LiveActivityClient.tsx` — add stage state, push to LiveEventsContext, mount packet layer, kicker prop wiring
- `src/app/_components/AnimatedNumber.tsx` — accept optional `bumpOn` prop for kicker bounce
- `src/app/_components/OrbitVisual.tsx` — consume LiveEventsContext, central node pulse on event change
- `src/app/_components/Header.tsx` — convert to client, useScroll-driven `scrolled` state
- `src/app/_components/VaultCard.tsx` — convert to client, wrap in motion.div with whileInView + index-based stagger
- `src/app/vaults/page.tsx` — pass `index` prop to VaultCard
- `src/app/_sections/Hero.tsx` — convert two main CTA `<Link>`s to `motion(Link)` with whileHover/whileTap
- `src/app/_sections/ForExperts.tsx` — same CTA upgrade
- `src/app/_sections/ForAgents.tsx` — same CTA upgrade

---

# Commit 1 — Foundation (motion presets + LiveEventsContext + Hero migration)

### Task 1: Create motion presets

**Files:**
- Create: `src/lib/motion/presets.ts`

- [ ] **Step 1: Write the file**

```ts
/**
 * Motion presets — single source of truth for every spring, stagger,
 * offset, and duration used across the app.
 *
 * Per page-load-animations recipe: named timing constants > magic numbers
 * in delay props. New motion code MUST import from here.
 */

export const SPRINGS = {
  snappy:   { type: "spring" as const, stiffness: 400, damping: 30 },
  smooth:   { type: "spring" as const, stiffness: 300, damping: 30 },
  bouncy:   { type: "spring" as const, stiffness: 280, damping: 26 },
  stiff:    { type: "spring" as const, stiffness: 350, damping: 28 },
  headline: { type: "spring" as const, stiffness: 320, damping: 28 },
  packet:   { type: "spring" as const, stiffness: 220, damping: 22 },
} as const;

export const STAGGER = {
  tight:   0.04,  // dense rows (feed)
  normal:  0.06,  // medium grids (vault cards, stat stripe)
  relaxed: 0.12,  // hero cards
} as const;

export const OFFSETS = {
  rise: 16,    // section paragraphs, card entries
  drop: -8,    // top-anchored elements (live indicator)
  edge: 24,    // packet horizontal travel
} as const;

export const DURATION_MS = {
  kick:   300,   // stat stripe kicker flash
  reveal: 600,   // mount fades
  packet: 720,   // packet trail full arc
} as const;
```

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit`
Expected: clean (no consumers yet).

---

### Task 2: Create LiveEventsContext

**Files:**
- Create: `src/lib/live-events/context.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const MAX_RECENT = 5;

export type LiveEvent = {
  signature: string;
  vaultSlug: string | null;
  ts: number;
};

type Ctx = {
  recent: LiveEvent[];
  push: (e: LiveEvent) => void;
};

const LiveEventsContext = createContext<Ctx | null>(null);

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<LiveEvent[]>([]);

  const push = useCallback((e: LiveEvent) => {
    setRecent((prev) => {
      if (prev[0]?.signature === e.signature) return prev;
      const filtered = prev.filter((p) => p.signature !== e.signature);
      return [e, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  return (
    <LiveEventsContext.Provider value={{ recent, push }}>
      {children}
    </LiveEventsContext.Provider>
  );
}

export function useLiveEvents(): Ctx {
  const ctx = useContext(LiveEventsContext);
  if (!ctx) {
    throw new Error("useLiveEvents must be used within LiveEventsProvider");
  }
  return ctx;
}
```

- [ ] **Step 2: Wrap layout's `<main>` with the provider**

Edit `src/app/layout.tsx` lines 1–5 — add the import:

Replace:
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
import "./globals.css";
```
with:
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
import { LiveEventsProvider } from "@/lib/live-events/context";
import "./globals.css";
```

- [ ] **Step 3: Wrap `<main>`**

Replace lines 52–56 in `src/app/layout.tsx`:
```tsx
      <body className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
```
with:
```tsx
      <body className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <LiveEventsProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LiveEventsProvider>
      </body>
```

(Provider wraps `<Header />` so the header could later subscribe to the same context if we ever want a settlement counter in the nav.)

- [ ] **Step 4: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Run: `curl -s http://localhost:3000 -o /tmp/home.html && grep -c "next-route-announcer" /tmp/home.html`
Expected: ≥1 (server still rendering normally; provider has no SSR effect).

---

### Task 3: Migrate Hero springs to use presets

**Files:**
- Modify: `src/app/_sections/Hero.tsx:1-36`

- [ ] **Step 1: Add the import**

Replace `src/app/_sections/Hero.tsx` line 4:
```tsx
import { motion, useReducedMotion } from "framer-motion";
```
with:
```tsx
import { motion, useReducedMotion } from "framer-motion";
import { SPRINGS } from "@/lib/motion/presets";
```

- [ ] **Step 2: Replace the inline spring objects**

Replace lines 29–36 in `src/app/_sections/Hero.tsx`:
```tsx
const HEADLINE = {
  offsetY: 16,
  spring: { type: "spring" as const, stiffness: 320, damping: 28 },
};

const FADE = {
  spring: { type: "spring" as const, stiffness: 300, damping: 30 },
};
```
with:
```tsx
const HEADLINE = {
  offsetY: 16,
  spring: SPRINGS.headline,
};

const FADE = {
  spring: SPRINGS.smooth,
};
```

(Values are byte-for-byte identical — no behavioral change. Just plumbing.)

- [ ] **Step 3: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Open `http://localhost:3000` in browser, hard reload. Hero entrance choreography should look unchanged: live indicator → headline → paragraph → CTAs → orbit → stats stripe.

- [ ] **Step 4: Commit Foundation**

```
git add src/lib/motion/ src/lib/live-events/ src/app/layout.tsx src/app/_sections/Hero.tsx
git commit -m "feat(motion): centralize spring presets + live-events context

- New src/lib/motion/presets.ts is the single source of truth for
  springs, stagger, offsets, durations. Hero migrated (no behavioral
  change — values are byte-identical).
- New src/lib/live-events/context.tsx — pub/sub queue (cap 5) that
  any component can subscribe to via useLiveEvents(). Provider wraps
  the whole layout.
- Plumbing only: no consumers yet. Sets the foundation for the
  page-polish and live-protocol motion that lands in commits 2 and 3."
```

---

# Commit 2 — Page Polish Baseline

### Task 4: LiveActivity section entrance choreography

**Files:**
- Modify: `src/app/_components/LiveActivityClient.tsx`

- [ ] **Step 1: Add motion + presets imports + useInView**

Replace lines 1–14 in `src/app/_components/LiveActivityClient.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PayoutEvent } from "@/lib/payouts";
import {
  formatUsdc,
  solscanAddressUrl,
  solscanTxUrl,
  timeAgo,
  truncateAddress,
  truncateSignature,
  type SolanaCluster,
} from "@/lib/format";
import { AnimatedNumber } from "./AnimatedNumber";
```
with:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { PayoutEvent } from "@/lib/payouts";
import {
  formatUsdc,
  solscanAddressUrl,
  solscanTxUrl,
  timeAgo,
  truncateAddress,
  truncateSignature,
  type SolanaCluster,
} from "@/lib/format";
import { OFFSETS, SPRINGS, STAGGER } from "@/lib/motion/presets";
import { AnimatedNumber } from "./AnimatedNumber";
```

- [ ] **Step 2: Add stage timing constants below the existing constants**

Find lines 16–18 in `src/app/_components/LiveActivityClient.tsx`:
```tsx
const POLL_INTERVAL_MS = 10_000;
const FEED_VISIBLE = 5;
const HIGHLIGHT_MS = 2_000;
```

Insert immediately after them (new line 19+):
```tsx

/* ─────────────────────────────────────────────────────────
 * LIVEACTIVITY ENTRANCE STORYBOARD (fires on viewport enter)
 *
 *  0ms     blank — section invisible
 *  100ms   stage 1: eyebrow + headline rise (smooth spring)
 *  280ms   stage 2: body paragraph rise
 *  460ms   stage 3: stat stripe — 4 cells stagger 60ms
 *  720ms   stage 4: feed rows — 5 visible rows stagger 50ms
 * ───────────────────────────────────────────────────────── */
const ENTRANCE = {
  stage1: 100,
  stage2: 280,
  stage3: 460,
  stage4: 720,
} as const;

const FEED_ROW_STAGGER_MS = 50;
const STRIPE_CELL_STAGGER = STAGGER.normal; // 0.06s
```

- [ ] **Step 3: Restructure the top of LiveActivityClient component to add stage state + viewport sentinel**

Find lines 25–32 in `src/app/_components/LiveActivityClient.tsx` (the component declaration and existing state):
```tsx
export function LiveActivityClient({ initial, network }: Props) {
  const [payouts, setPayouts] = useState<PayoutEvent[]>(initial);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [polling, setPolling] = useState(true);
  const seenRef = useRef<Set<string>>(
    new Set(initial.map((p) => p.signature)),
  );
```

Replace with:
```tsx
export function LiveActivityClient({ initial, network }: Props) {
  const [payouts, setPayouts] = useState<PayoutEvent[]>(initial);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [polling, setPolling] = useState(true);
  const seenRef = useRef<Set<string>>(
    new Set(initial.map((p) => p.signature)),
  );

  const reduced = useReducedMotion();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sentinelRef, { once: true, margin: "-160px" });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduced) {
      setStage(99);
      return;
    }
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStage(1), ENTRANCE.stage1),
      setTimeout(() => setStage(2), ENTRANCE.stage2),
      setTimeout(() => setStage(3), ENTRANCE.stage3),
      setTimeout(() => setStage(4), ENTRANCE.stage4),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced]);
```

- [ ] **Step 4: Pass stage to renderers and add sentinel**

Find the existing return block (around line 84):
```tsx
  return (
    <>
      <StatStripe stats={stats} now={now} />

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <ActivityFeed
          rows={visible}
          highlighted={highlighted}
          network={network}
          now={now}
        />
      )}

      <p className="mt-6 text-mono-tight text-[11px] text-[var(--color-text-faint)]">
```

Replace with:
```tsx
  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute -mt-32" />
      <StatStripe stats={stats} now={now} stage={stage} />

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <ActivityFeed
          rows={visible}
          highlighted={highlighted}
          network={network}
          now={now}
          stage={stage}
        />
      )}

      <motion.p
        initial={{ opacity: 0, y: OFFSETS.rise }}
        animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : OFFSETS.rise }}
        transition={SPRINGS.smooth}
        className="mt-6 text-mono-tight text-[11px] text-[var(--color-text-faint)]"
      >
```

(Note: the `<p>` becomes `motion.p` and the existing closing `</p>` should also be updated — see next step.)

- [ ] **Step 5: Close the motion.p tag**

Find the closing of that paragraph (around line 105):
```tsx
        Showing latest {visible.length} of {payouts.length} settlements ·{" "}
        <a href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          full history in dashboard ↗
        </a>
      </p>
    </>
  );
}
```

Replace with:
```tsx
        Showing latest {visible.length} of {payouts.length} settlements ·{" "}
        <a href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          full history in dashboard ↗
        </a>
      </motion.p>
    </>
  );
}
```

- [ ] **Step 6: Update StatStripe to receive stage and stagger cells**

Find the StatStripe function signature (around line 142):
```tsx
function StatStripe({ stats, now }: { stats: Stats; now: number }) {
  const items: StatItem[] = [
```

Replace with:
```tsx
function StatStripe({
  stats,
  now,
  stage,
}: {
  stats: Stats;
  now: number;
  stage: number;
}) {
  const items: StatItem[] = [
```

Then find the JSX return at the end of StatStripe (around line 178):
```tsx
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
      {items.map((s) => (
        <div key={s.label} className="bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7">
```

Replace with:
```tsx
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
      {items.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: OFFSETS.rise }}
          animate={{
            opacity: stage >= 3 ? 1 : 0,
            y: stage >= 3 ? 0 : OFFSETS.rise,
          }}
          transition={{
            ...SPRINGS.smooth,
            delay: stage >= 3 ? i * STRIPE_CELL_STAGGER : 0,
          }}
          className="bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7"
        >
```

And update the closing `</div>` after the stat cell content to `</motion.div>`. Find around line 200:
```tsx
          <p className="text-mono-tight text-[11px] mt-1 text-[var(--color-text-faint)]">
            {s.caption}
          </p>
        </div>
      ))}
    </div>
  );
}
```

Replace with:
```tsx
          <p className="text-mono-tight text-[11px] mt-1 text-[var(--color-text-faint)]">
            {s.caption}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Update ActivityFeed to receive stage and stagger rows**

Find the ActivityFeed function signature:
```tsx
function ActivityFeed({
  rows,
  highlighted,
  network,
  now,
}: {
  rows: PayoutEvent[];
  highlighted: Set<string>;
  network: SolanaCluster;
  now: number;
}) {
```

Replace with:
```tsx
function ActivityFeed({
  rows,
  highlighted,
  network,
  now,
  stage,
}: {
  rows: PayoutEvent[];
  highlighted: Set<string>;
  network: SolanaCluster;
  now: number;
  stage: number;
}) {
```

Then find the rows-map block (the `<ul>`):
```tsx
      <ul className="divide-y divide-[var(--color-border)]">
        {rows.map((row) => (
          <FeedRow
            key={row.signature}
            row={row}
            isNew={highlighted.has(row.signature)}
            network={network}
            now={now}
          />
        ))}
      </ul>
```

Replace with:
```tsx
      <ul className="divide-y divide-[var(--color-border)]">
        {rows.map((row, i) => (
          <FeedRow
            key={row.signature}
            row={row}
            index={i}
            isNew={highlighted.has(row.signature)}
            network={network}
            now={now}
            stage={stage}
          />
        ))}
      </ul>
```

Then update FeedRow's signature and wrap its `<li>` in motion. Find:
```tsx
function FeedRow({
  row,
  isNew,
  network,
  now,
}: {
  row: PayoutEvent;
  isNew: boolean;
  network: SolanaCluster;
  now: number;
}) {
  const flashClass = isNew
    ? "bg-[rgba(25,251,155,0.08)] animate-[fade-up_400ms_var(--ease-out-expo)]"
    : "hover:bg-[var(--color-bg-card)]/40";
  return (
    <li
      className={`grid grid-cols-[1.6fr_1.4fr_1fr_0.9fr] sm:grid-cols-[1.6fr_1.4fr_1.4fr_1fr_0.9fr] gap-3 sm:gap-4 px-4 sm:px-5 lg:px-6 py-3.5 transition-colors duration-300 ${flashClass}`}
    >
```

Replace with:
```tsx
function FeedRow({
  row,
  index,
  isNew,
  network,
  now,
  stage,
}: {
  row: PayoutEvent;
  index: number;
  isNew: boolean;
  network: SolanaCluster;
  now: number;
  stage: number;
}) {
  const flashClass = isNew
    ? "bg-[rgba(25,251,155,0.08)] animate-[fade-up_400ms_var(--ease-out-expo)]"
    : "hover:bg-[var(--color-bg-card)]/40";
  return (
    <motion.li
      initial={{ opacity: 0, y: OFFSETS.rise }}
      animate={{
        opacity: stage >= 4 ? 1 : 0,
        y: stage >= 4 ? 0 : OFFSETS.rise,
      }}
      transition={{
        ...SPRINGS.smooth,
        delay: stage >= 4 ? (index * FEED_ROW_STAGGER_MS) / 1000 : 0,
      }}
      className={`grid grid-cols-[1.6fr_1.4fr_1fr_0.9fr] sm:grid-cols-[1.6fr_1.4fr_1.4fr_1fr_0.9fr] gap-3 sm:gap-4 px-4 sm:px-5 lg:px-6 py-3.5 transition-colors duration-300 ${flashClass}`}
    >
```

And the closing `</li>`. Find:
```tsx
      <span className="text-mono-tight text-[12px] text-[var(--color-text-faint)] text-right tabular-nums">
        {timeAgo(row.blockTime, now)}
      </span>
    </li>
  );
}
```

Replace with:
```tsx
      <span className="text-mono-tight text-[12px] text-[var(--color-text-faint)] text-right tabular-nums">
        {timeAgo(row.blockTime, now)}
      </span>
    </motion.li>
  );
}
```

- [ ] **Step 8: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Open `http://localhost:3000` in browser. Scroll to the LiveActivity section. The section content should now cascade in:
1. Eyebrow + headline rise (~100ms after entering viewport)
2. Body copy rises (~280ms)
3. Stat stripe cells stagger in left-to-right (~460ms, 60ms apart)
4. Feed rows stagger in top-to-bottom (~720ms, 50ms apart)
5. Final paragraph fades in last

Hard reload with Chrome DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. All four stages should be visible immediately on viewport enter; no animation.

- [ ] **Step 9: Don't commit** — Tasks 5-7 stack on this for one Page Polish commit.

---

### Task 5: Vault list cards stagger

**Files:**
- Modify: `src/app/_components/VaultCard.tsx`
- Modify: `src/app/vaults/page.tsx`

- [ ] **Step 1: Convert VaultCard to client + add motion wrapper**

Replace `src/app/_components/VaultCard.tsx` with:
```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Vault } from "@/lib/supabase";
import { formatUsdc, truncateAddress } from "@/lib/format";
import { OFFSETS, SPRINGS, STAGGER } from "@/lib/motion/presets";

const STAGGER_CAP_INDEX = 8;

interface Props {
  readonly vault: Vault;
  readonly index?: number;
}

export function VaultCard({ vault, index = 0 }: Props) {
  const cappedIndex = Math.min(index, STAGGER_CAP_INDEX);

  return (
    <motion.div
      initial={{ opacity: 0, y: OFFSETS.rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        ...SPRINGS.bouncy,
        delay: cappedIndex * STAGGER.normal,
      }}
    >
      <Link
        href={`/vaults/${vault.slug}`}
        className="group flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 backdrop-blur-sm p-6 lg:p-7 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-display text-[clamp(18px,2vw,22px)] text-[var(--color-text)] truncate">
              {vault.name}
            </h3>
            <p className="mt-1 text-mono-tight text-[11px] text-[var(--color-text-faint)]">
              /vaults/{vault.slug}
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center px-2.5 h-6 rounded-[var(--radius-pill)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-mono-tight text-[10px] uppercase tracking-[0.16em] text-[var(--color-accent)] tabular-nums">
            ${formatUsdc(vault.price_usdc)}
          </span>
        </div>

        {vault.description && (
          <p className="mt-3 text-[13px] leading-[1.55] text-[var(--color-text-muted)] line-clamp-3">
            {vault.description}
          </p>
        )}

        {vault.domains.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {vault.domains.slice(0, 5).map((d) => (
              <li
                key={d}
                className="inline-flex items-center px-2 h-5 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-bg)]/40 text-mono-tight text-[10px] text-[var(--color-text-muted)]"
              >
                {d}
              </li>
            ))}
            {vault.domains.length > 5 && (
              <li className="text-mono-tight text-[10px] text-[var(--color-text-faint)] self-center pl-1">
                +{vault.domains.length - 5}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto pt-5 grid grid-cols-3 gap-2 border-t border-[var(--color-border)] mt-5">
          <Stat label="Earned" value={`$${formatUsdc(vault.total_earned_usdc)}`} />
          <Stat label="Settles" value={vault.total_settlements.toString()} />
          <Stat label="Chunks" value={vault.chunks_count.toString()} />
        </div>

        <p className="mt-4 text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] flex items-center gap-1.5">
          <span>operator</span>
          <span className="text-[var(--color-text-muted)] normal-case tracking-normal">
            {truncateAddress(vault.owner_wallet)}
          </span>
          <span className="ml-auto text-[var(--color-text-faint)] group-hover:text-[var(--color-accent)] transition-colors">
            ask vault →
          </span>
        </p>
      </Link>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-mono-tight text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
        {label}
      </p>
      <p className="mt-1 text-mono-tight text-[13px] text-[var(--color-text)] tabular-nums">
        {value}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Pass index from vaults page**

In `src/app/vaults/page.tsx` find lines 60–62:
```tsx
            {vaults.map((v) => (
              <VaultCard key={v.id} vault={v} />
            ))}
```

Replace with:
```tsx
            {vaults.map((v, i) => (
              <VaultCard key={v.id} vault={v} index={i} />
            ))}
```

- [ ] **Step 3: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Navigate to `http://localhost:3000/vaults` in browser. Cards should stagger in (top-left first) when the page loads. Reload — same. The 24-vault max means at most 8 staggers (capped); the 9th–24th appear at delay=8*0.06=0.48s.

---

### Task 6: Header scroll-state

**Files:**
- Modify: `src/app/_components/Header.tsx`

- [ ] **Step 1: Convert to client + add useScroll-driven state**

Replace `src/app/_components/Header.tsx` with:
```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";

const NAV_ITEMS = [
  { label: "Vaults", href: "/vaults" },
  { label: "Live", href: "/#live" },
  { label: "Protocol", href: "/#how-it-works" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

const GITHUB_URL = "https://github.com/Bekirerdem/brain-drain";
const SCROLL_THRESHOLD = 24;

export function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > SCROLL_THRESHOLD;
    if (next !== scrolled) setScrolled(next);
  });

  const shellClass = scrolled
    ? "bg-[rgba(10,10,10,0.78)] backdrop-blur-xl border-b border-[var(--color-border)]"
    : "bg-[rgba(10,10,10,0.32)] backdrop-blur-md border-b border-transparent";

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-200 ${shellClass}`}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-2 group select-none"
          aria-label="Brain Drain home"
        >
          <span className="text-display text-[16px] tracking-[-0.02em]">
            Brain Drain<span className="text-[var(--color-accent)]">.</span>
          </span>
          <span className="hidden sm:inline text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] group-hover:text-[var(--color-text-muted)] transition-colors">
            x402 + RAG protocol
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 h-8 inline-flex items-center text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-8 px-3 items-center text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            GitHub
          </a>
          <Link
            href="/vaults/new"
            className="inline-flex h-9 px-4 items-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-medium hover:brightness-110 hover:shadow-[0_0_24px_-6px_var(--color-accent)] transition-all duration-200"
          >
            Mount vault
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Navigate to `http://localhost:3000`. At the top of page, header background is faint (low alpha). Scroll down past 24px — header gains stronger backdrop blur, deeper bg tint, and a bottom border. Scroll back to top — fades back to faint state. Transition is 200ms.

---

### Task 7: CTA whileHover springs

**Files:**
- Modify: `src/app/_sections/Hero.tsx`
- Modify: `src/app/_sections/ForExperts.tsx`
- Modify: `src/app/_sections/ForAgents.tsx`

- [ ] **Step 1: In Hero, swap two `Link` CTAs for `motion(Link)`**

In `src/app/_sections/Hero.tsx` add this near the existing imports (after the `import { motion, useReducedMotion } from "framer-motion";` line):

```tsx
const MotionLink = motion(Link);
```

Place it BEFORE the component (right above `export function Hero()`).

Then find the primary "Mount your vault →" CTA Link (around line 117–124 — it's the one inside `motion.div className="mt-9 flex flex-wrap..."` block):

```tsx
              <Link
                href="/vaults/new"
                className="group inline-flex h-11 px-6 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)] transition-all duration-200"
              >
```

Replace with:
```tsx
              <MotionLink
                href="/vaults/new"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.snappy}
                className="group inline-flex h-11 px-6 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)]"
              >
```

(Drop `transition-all duration-200` since framer now owns the transform transitions.)

Then find its closing `</Link>` (literally next to `Mount your vault →`):
```tsx
                Mount your vault
                <span aria-hidden="true">→</span>
              </Link>
```

Replace with:
```tsx
                Mount your vault
                <span aria-hidden="true">→</span>
              </MotionLink>
```

(There may be a second secondary CTA Link in Hero — repeat the same pattern with `MotionLink` + whileHover/whileTap if it exists. If it's an outline button, drop `y: -1` from whileHover to keep the lift subtle.)

- [ ] **Step 2: ForExperts CTA**

Open `src/app/_sections/ForExperts.tsx`. It already imports motion. Find the primary CTA (a `<Link>` to `/vaults/new` or similar — search for `href="/vaults/new"` in the file).

Add at the top of the file (with other consts):
```tsx
import { SPRINGS } from "@/lib/motion/presets";

const MotionLink = motion(Link);
```

Replace the primary CTA `<Link>` open tag (preserving its existing className) with `<MotionLink ... whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} transition={SPRINGS.snappy}>` and the closing `</Link>` with `</MotionLink>`. Drop any `transition-all duration-200` from the className.

If `Link` isn't already imported in this file, add `import Link from "next/link";` at the top.

- [ ] **Step 3: ForAgents CTA**

Repeat Step 2's pattern in `src/app/_sections/ForAgents.tsx`.

- [ ] **Step 4: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Run: `bun run lint 2>&1 | grep -E "^(error|warning).*motion-graphics|src/app/_sections|src/app/_components/(Header|VaultCard|LiveActivity)" | head -10`
Expected: no errors on the files this task touched. (Pre-existing lint issues in unrelated files are out of scope.)

In browser at `http://localhost:3000`, hover the primary green "Mount your vault" CTA. Should feel a subtle lift (1.02 scale + 1px up) with snappy spring. Click → quick press-down (0.98 scale). Repeat in `/vaults/new` and the for-agents/for-experts CTAs.

- [ ] **Step 5: Commit Page Polish**

```
git add src/app/_components/LiveActivityClient.tsx src/app/_components/VaultCard.tsx src/app/_components/Header.tsx src/app/vaults/page.tsx src/app/_sections/Hero.tsx src/app/_sections/ForExperts.tsx src/app/_sections/ForAgents.tsx
git commit -m "feat(motion): page polish — entrance, stagger, header, CTAs

- LiveActivity gets a 4-stage entrance choreography on viewport enter
  (eyebrow + headline → body → stat stripe stagger → feed rows
  stagger). Reduced-motion sets stage=99 immediately.
- /vaults list cards stagger in via whileInView with bouncy spring,
  capped at index 8 so a long directory does not stagger forever.
- Header gains a scroll-state: scrollY > 24px deepens the backdrop
  blur, bg tint, and adds a bottom border. 200ms CSS transition.
- Primary CTAs across Hero/ForExperts/ForAgents become motion(Link)
  with whileHover {scale:1.02, y:-1} and whileTap {scale:0.98},
  snappy spring."
```

---

# Commit 3 — Live Protocol Concepts

### Task 8: Wire LiveActivityClient → LiveEventsContext.push

**Files:**
- Modify: `src/app/_components/LiveActivityClient.tsx`

- [ ] **Step 1: Import the hook**

In `src/app/_components/LiveActivityClient.tsx` find the imports block (around line 15):
```tsx
import { OFFSETS, SPRINGS, STAGGER } from "@/lib/motion/presets";
import { AnimatedNumber } from "./AnimatedNumber";
```

Insert before `import { AnimatedNumber }`:
```tsx
import { useLiveEvents } from "@/lib/live-events/context";
```

- [ ] **Step 2: Use the hook + push on new sigs**

Find the existing `fetchPayouts` callback inside `LiveActivityClient` (around lines 34–62 of the post-Task-4 file):
```tsx
  const fetchPayouts = useCallback(async () => {
    try {
      const res = await fetch("/api/payouts?limit=20", { cache: "no-store" });
      if (!res.ok) return;
      const data: { payouts: PayoutEvent[] } = await res.json();
      const incoming = data.payouts;
      const newSigs = incoming
        .map((p) => p.signature)
        .filter((sig) => !seenRef.current.has(sig));
      if (newSigs.length > 0) {
        newSigs.forEach((sig) => seenRef.current.add(sig));
        setHighlighted((prev) => {
          const next = new Set(prev);
          newSigs.forEach((sig) => next.add(sig));
          return next;
        });
        setTimeout(() => {
          setHighlighted((prev) => {
            const next = new Set(prev);
            newSigs.forEach((sig) => next.delete(sig));
            return next;
          });
        }, HIGHLIGHT_MS);
      }
      setPayouts(incoming);
    } catch {
      // network blip — next tick will retry
    }
  }, []);
```

Add `const { push } = useLiveEvents();` immediately above `fetchPayouts`. Then replace the callback to push each new event:

```tsx
  const { push } = useLiveEvents();

  const fetchPayouts = useCallback(async () => {
    try {
      const res = await fetch("/api/payouts?limit=20", { cache: "no-store" });
      if (!res.ok) return;
      const data: { payouts: PayoutEvent[] } = await res.json();
      const incoming = data.payouts;
      const newOnes = incoming.filter(
        (p) => !seenRef.current.has(p.signature),
      );
      if (newOnes.length > 0) {
        newOnes.forEach((p) => {
          seenRef.current.add(p.signature);
          push({
            signature: p.signature,
            vaultSlug: p.vaultSlug,
            ts: Date.now(),
          });
        });
        setHighlighted((prev) => {
          const next = new Set(prev);
          newOnes.forEach((p) => next.add(p.signature));
          return next;
        });
        setTimeout(() => {
          setHighlighted((prev) => {
            const next = new Set(prev);
            newOnes.forEach((p) => next.delete(p.signature));
            return next;
          });
        }, HIGHLIGHT_MS);
      }
      setPayouts(incoming);
    } catch {
      // network blip — next tick will retry
    }
  }, [push]);
```

- [ ] **Step 3: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Run dev. Open `http://localhost:3000`. Open browser console — no errors about missing provider. Trigger a settlement: in another terminal `bun scripts/buy-query.ts "what is x402"`. The feed row flashes as before; the LiveEventsContext is now also receiving push events (verified more concretely in Tasks 9–10 when consumers light up).

---

### Task 9: SettlementPacket component + mount in feed

**Files:**
- Create: `src/app/_components/SettlementPacket.tsx`
- Modify: `src/app/_components/LiveActivityClient.tsx`

- [ ] **Step 1: Write SettlementPacket.tsx**

```tsx
"use client";

import { motion } from "framer-motion";
import { OFFSETS, SPRINGS } from "@/lib/motion/presets";

const HOLD_MS = 80;
const FADE_MS = 200;

export function SettlementPacket({ onDone }: { onDone?: () => void }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ x: OFFSETS.edge * 2.5, opacity: 0, scale: 0.6 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRINGS.packet}
      onAnimationComplete={() => {
        if (!onDone) return;
        const t = setTimeout(onDone, HOLD_MS + FADE_MS);
        return () => clearTimeout(t);
      }}
      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-3 h-3 rounded-[3px] bg-[var(--color-accent)] shadow-[0_0_18px_-2px_var(--color-accent)]"
    />
  );
}
```

- [ ] **Step 2: Mount packet layer in FeedRow**

In `src/app/_components/LiveActivityClient.tsx` add the import alongside the others:
```tsx
import { SettlementPacket } from "./SettlementPacket";
```

Then find the start of the FeedRow `<motion.li>` block (post-Task-4) and locate its first child — the Signature `<a>` link. Right before that anchor, inject the packet conditionally so it only renders for highlighted (new) rows. The simplest position: as the first child of `<motion.li>`, since `<motion.li>` already has `relative`-equivalent layout via grid.

Actually motion.li is currently a grid; absolute children can position relative to it if we add `relative` class.

Find the current motion.li className:
```tsx
      className={`grid grid-cols-[1.6fr_1.4fr_1fr_0.9fr] sm:grid-cols-[1.6fr_1.4fr_1.4fr_1fr_0.9fr] gap-3 sm:gap-4 px-4 sm:px-5 lg:px-6 py-3.5 transition-colors duration-300 ${flashClass}`}
```

Replace with:
```tsx
      className={`relative grid grid-cols-[1.6fr_1.4fr_1fr_0.9fr] sm:grid-cols-[1.6fr_1.4fr_1.4fr_1fr_0.9fr] gap-3 sm:gap-4 px-4 sm:px-5 lg:px-6 py-3.5 transition-colors duration-300 ${flashClass}`}
```

(Just added `relative` at the start.)

Then directly inside the motion.li (before the existing first `<a>`), insert:
```tsx
      {isNew && <SettlementPacket />}
```

- [ ] **Step 3: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Trigger a real settlement: `bun scripts/buy-query.ts "x402 packet test"` in a separate terminal. Watch the landing page LiveActivity feed. Within ~10s a new row flashes green; you should also briefly see a small green square fly in from the right edge of the new row, settle on the right margin (~600ms), hold a beat, then fade out. The row's existing `fade-up` flash continues to fire as before.

If reduced-motion is enabled (DevTools → Rendering), the row still flashes (existing CSS) but the packet component doesn't fire its motion (initial=animate=exit are skipped, so the packet briefly appears and exits with no spring). For a fully-clean reduced-motion experience, also gate the conditional render:

Find:
```tsx
      {isNew && <SettlementPacket />}
```

Replace with:
```tsx
      {isNew && !reduced && <SettlementPacket />}
```

(The component already has access to `reduced` from useReducedMotion that was added in Task 4 — it's a top-level hook, so it's in scope inside FeedRow if hoisted. To keep the change local: receive `reduced` as an additional prop on FeedRow.)

Pass `reduced` to FeedRow. In ActivityFeed:
```tsx
        {rows.map((row, i) => (
          <FeedRow
            key={row.signature}
            row={row}
            index={i}
            isNew={highlighted.has(row.signature)}
            network={network}
            now={now}
            stage={stage}
          />
        ))}
```

Replace with:
```tsx
        {rows.map((row, i) => (
          <FeedRow
            key={row.signature}
            row={row}
            index={i}
            isNew={highlighted.has(row.signature)}
            network={network}
            now={now}
            stage={stage}
            reduced={reduced}
          />
        ))}
```

Pass `reduced` from `LiveActivityClient` into `ActivityFeed`:
```tsx
        <ActivityFeed
          rows={visible}
          highlighted={highlighted}
          network={network}
          now={now}
          stage={stage}
        />
```

Replace with:
```tsx
        <ActivityFeed
          rows={visible}
          highlighted={highlighted}
          network={network}
          now={now}
          stage={stage}
          reduced={!!reduced}
        />
```

Update ActivityFeed's signature to accept `reduced: boolean` and pass it down. Update FeedRow's signature similarly:

```tsx
function FeedRow({
  row,
  index,
  isNew,
  network,
  now,
  stage,
  reduced,
}: {
  row: PayoutEvent;
  index: number;
  isNew: boolean;
  network: SolanaCluster;
  now: number;
  stage: number;
  reduced: boolean;
}) {
```

(Same for ActivityFeed.)

Run: `bunx tsc --noEmit`
Expected: clean.

---

### Task 10: OrbitVisual feed-sync

**Files:**
- Modify: `src/app/_components/OrbitVisual.tsx`

- [ ] **Step 1: Subscribe to LiveEventsContext + central pulse on event change**

The key change: when `useLiveEvents().recent[0]?.signature` changes, fire a one-shot 600ms pulse on the central node (scale 1 → 1.08 → 1, glow halo opacity 0.6 → 1 → 0.6).

Open `src/app/_components/OrbitVisual.tsx`.

Update the imports at the top — find:
```tsx
import { useReducedMotion } from "framer-motion";
```

Replace with:
```tsx
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DURATION_MS } from "@/lib/motion/presets";
import { useLiveEvents } from "@/lib/live-events/context";
```

Inside the OrbitVisual component, right after the existing `const reduced = useReducedMotion();` line, add the pulse state:

```tsx
  const { recent } = useLiveEvents();
  const [pulsing, setPulsing] = useState(false);
  const lastSigRef = useRef<string | null>(null);

  useEffect(() => {
    if (reduced) return;
    const head = recent[0]?.signature ?? null;
    if (!head || head === lastSigRef.current) return;
    lastSigRef.current = head;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), DURATION_MS.reveal);
    return () => clearTimeout(t);
  }, [recent, reduced]);
```

- [ ] **Step 2: Apply pulse to the central glow halo**

Find the existing `Brain Drain glow halo` block (around lines 67–74 of the existing file):
```tsx
        {/* Brain Drain glow halo */}
        <circle
          cx="262"
          cy="190"
          r="120"
          fill="url(#brain-glow)"
          opacity={active ? 1 : 0}
          style={{ transition: "opacity 600ms ease-out" }}
        />
```

Replace with:
```tsx
        {/* Brain Drain glow halo — base always-on, pulse layer on settlements */}
        <circle
          cx="262"
          cy="190"
          r="120"
          fill="url(#brain-glow)"
          opacity={active ? 1 : 0}
          style={{ transition: "opacity 600ms ease-out" }}
        />
        {pulsing && !reduced && (
          <motion.circle
            cx="262"
            cy="190"
            r="120"
            fill="url(#brain-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: DURATION_MS.reveal / 1000, ease: "easeOut" }}
          />
        )}
```

- [ ] **Step 3: Apply scale pulse to the central node**

Find the central Brain Drain `Node` definition (around line 142–152 — the second Node call with `glow` prop):
```tsx
        <Node
          cx={262}
          cy={190}
          r={62}
          stroke="#19fb9b"
          fill="rgba(25,251,255,0.06)"
          glow
          icon={<NodeIcon kind="vault" />}
          label="Brain Drain"
          sublabel="x402 + RAG"
        />
```

(The fill might be `rgba(25,251,155,0.06)` — copy whatever is there exactly.)

Wrap the central node in a `<motion.g>` that scales briefly when pulsing fires. Wrap the existing `<Node ... />` like so:

```tsx
        <motion.g
          style={{ originX: "262px", originY: "190px" }}
          animate={pulsing && !reduced ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: DURATION_MS.reveal / 1000, ease: "easeOut" }}
        >
          <Node
            cx={262}
            cy={190}
            r={62}
            stroke="#19fb9b"
            fill="rgba(25,251,155,0.06)"
            glow
            icon={<NodeIcon kind="vault" />}
            label="Brain Drain"
            sublabel="x402 + RAG"
          />
        </motion.g>
```

- [ ] **Step 4: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

In browser, scroll Hero into view. Trigger a settlement: `bun scripts/buy-query.ts "orbit pulse test"` in a separate terminal. Within 10s the central Brain Drain node briefly scales up + the green halo flashes brighter, then returns to baseline. The static loop of decorative packets continues uninterrupted.

Toggle reduced-motion. The pulse should not fire.

---

### Task 11: Stat stripe kicker

**Files:**
- Modify: `src/app/_components/AnimatedNumber.tsx`
- Modify: `src/app/_components/LiveActivityClient.tsx`

- [ ] **Step 1: Add `bumpOn` prop to AnimatedNumber**

Replace `src/app/_components/AnimatedNumber.tsx` with:
```tsx
"use client";

import {
  animate,
  useMotionValue,
  useTransform,
  motion,
  useReducedMotion,
  useAnimationControls,
} from "framer-motion";
import { useEffect } from "react";

const MOUNT_DURATION = 0.9;
const UPDATE_DURATION = 0.4;
const MOUNT_EASE = [0.16, 1, 0.3, 1] as const;
const UPDATE_EASE = [0.33, 1, 0.68, 1] as const;
const BUMP_DURATION = 0.32;
const BUMP_SCALE = 1.04;

type Props = {
  value: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  delay?: number;
  className?: string;
  /**
   * Optional trigger token. When this changes, the digit briefly scales to
   * BUMP_SCALE and back — a 'something just happened' kicker. Pass a
   * monotonically-changing string (e.g. latest signature) to fire one bump
   * per real event.
   */
  bumpOn?: string | number | null;
};

/**
 * Mount: dramatic ramp from 0 → value (~900ms expressive easing).
 * Updates: subtle smooth transition (~400ms).
 * Bump: optional 320ms scale flash on bumpOn change.
 * Honors prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  format = (n) => n.toString(),
  prefix = "",
  suffix = "",
  delay = 0,
  className,
  bumpOn,
}: Props) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const display = useTransform(
    motionValue,
    (latest) => `${prefix}${format(latest)}${suffix}`,
  );
  const controls = useAnimationControls();

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const isMount = motionValue.get() === 0 && value > 0;
    const ctrls = animate(motionValue, value, {
      duration: isMount ? MOUNT_DURATION : UPDATE_DURATION,
      ease: isMount ? MOUNT_EASE : UPDATE_EASE,
      delay: isMount ? delay : 0,
    });
    return () => ctrls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  useEffect(() => {
    if (reduced) return;
    if (bumpOn === undefined || bumpOn === null) return;
    controls.start({
      scale: [1, BUMP_SCALE, 1],
      transition: { duration: BUMP_DURATION, ease: "easeOut" },
    });
  }, [bumpOn, controls, reduced]);

  return (
    <motion.span
      className={className}
      animate={controls}
      style={{ display: "inline-block" }}
    >
      {display}
    </motion.span>
  );
}
```

- [ ] **Step 2: Wire kicker in StatStripe**

In `src/app/_components/LiveActivityClient.tsx` find the StatStripe function. After Task 4 it accepts `{ stats, now, stage }`. We need it to also know the latest signature to drive the kicker.

Update the LiveActivityClient component to subscribe and pass the head sig down. Find `const { push } = useLiveEvents();` (added in Task 8).

Replace with:
```tsx
  const { push, recent } = useLiveEvents();
  const headSig = recent[0]?.signature ?? null;
```

Find the call site of `<StatStripe ...>` (in the return block):
```tsx
      <StatStripe stats={stats} now={now} stage={stage} />
```

Replace with:
```tsx
      <StatStripe stats={stats} now={now} stage={stage} headSig={headSig} />
```

Update StatStripe's signature and add the `kickerActive` flash. Find:
```tsx
function StatStripe({
  stats,
  now,
  stage,
}: {
  stats: Stats;
  now: number;
  stage: number;
}) {
  const items: StatItem[] = [
```

Replace with:
```tsx
function StatStripe({
  stats,
  now,
  stage,
  headSig,
}: {
  stats: Stats;
  now: number;
  stage: number;
  headSig: string | null;
}) {
  const [kickerActive, setKickerActive] = useState(false);
  const lastBumpedSig = useRef<string | null>(null);

  useEffect(() => {
    if (!headSig || headSig === lastBumpedSig.current) return;
    lastBumpedSig.current = headSig;
    setKickerActive(true);
    const t = setTimeout(() => setKickerActive(false), 300);
    return () => clearTimeout(t);
  }, [headSig]);

  const items: StatItem[] = [
```

- [ ] **Step 3: Apply kicker border flash + bumpOn to AnimatedNumber**

Find the cell `<motion.div>` inside StatStripe's return (added in Task 4):
```tsx
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: OFFSETS.rise }}
          animate={{
            opacity: stage >= 3 ? 1 : 0,
            y: stage >= 3 ? 0 : OFFSETS.rise,
          }}
          transition={{
            ...SPRINGS.smooth,
            delay: stage >= 3 ? i * STRIPE_CELL_STAGGER : 0,
          }}
          className="bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7"
        >
```

Replace with:
```tsx
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: OFFSETS.rise }}
          animate={{
            opacity: stage >= 3 ? 1 : 0,
            y: stage >= 3 ? 0 : OFFSETS.rise,
          }}
          transition={{
            ...SPRINGS.smooth,
            delay: stage >= 3 ? i * STRIPE_CELL_STAGGER : 0,
          }}
          className={`bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7 transition-[box-shadow] duration-300 ${
            kickerActive ? "shadow-[inset_0_0_0_1px_var(--color-accent)]" : ""
          }`}
        >
```

Then find the AnimatedNumber call inside StatStripe (in the `s.numeric ? <AnimatedNumber ... /> : ...` branch):
```tsx
            <AnimatedNumber
              value={s.numeric.value}
              format={s.numeric.format}
              prefix={s.numeric.prefix}
              delay={s.numeric.delay}
              className="text-display text-[clamp(22px,3vw,32px)] mt-3 text-[var(--color-text)] tabular-nums block"
            />
```

Replace with:
```tsx
            <AnimatedNumber
              value={s.numeric.value}
              format={s.numeric.format}
              prefix={s.numeric.prefix}
              delay={s.numeric.delay}
              bumpOn={headSig}
              className="text-display text-[clamp(22px,3vw,32px)] mt-3 text-[var(--color-text)] tabular-nums block"
            />
```

(Static-value cells e.g. "Last settlement" don't need bumpOn — they re-render on `now` change anyway and use the static branch.)

- [ ] **Step 4: Verify**

Run: `bunx tsc --noEmit`
Expected: clean.

Run: `bun run lint 2>&1 | grep "src/app/_components/AnimatedNumber\|src/app/_components/LiveActivityClient\|src/app/_components/OrbitVisual\|src/app/_components/SettlementPacket" | head`
Expected: no errors on the touched files.

Trigger a settlement: `bun scripts/buy-query.ts "kicker test"`. Within 10s on the landing page:
- Stat stripe cells get a 1px accent-green inset border for 300ms
- AnimatedNumber digits in the numeric cells briefly scale to 1.04 and back
- (Plus all earlier features from Tasks 9–10: packet flies in, OrbitVisual pulses)

All four motion features fire within ~1s of each other in a clear visual sequence: packet enters → row flashes → orbit pulses → stripe kicker.

Reduced-motion: numbers still update, no flash, no scale, no packet, no orbit pulse.

- [ ] **Step 5: Commit Live Protocol**

```
git add src/app/_components/SettlementPacket.tsx src/app/_components/AnimatedNumber.tsx src/app/_components/LiveActivityClient.tsx src/app/_components/OrbitVisual.tsx
git commit -m "feat(motion): live protocol — packet trail, orbit sync, stat kicker

Three concept upgrades that turn settlement arrivals into a
choreographed visual moment, all wired through LiveEventsContext:

- SettlementPacket: small green packet animates from off the right
  edge of the feed table into the new row, holds, fades. Lands
  ~80ms before the existing row flash, creating a 'delivered →
  registered' two-beat rhythm.
- OrbitVisual feed-sync: the central Brain Drain node briefly
  scales (1 → 1.06 → 1) and the green glow halo flashes brighter
  on every new top-of-queue signature. Static decorative loop
  remains for between-settlement liveness.
- Stat stripe kicker: cell borders flash accent-green for 300ms
  on each new event; AnimatedNumber gains a bumpOn prop that
  drives a 1.04 scale flash so the digit feels reactive.

All motion respects prefers-reduced-motion: numbers still update,
none of the new motion fires."
```

---

# Final verification (after all 3 commits)

- [ ] **Step 1: Type-check + lint**

Run:
```
bunx tsc --noEmit
bun run lint 2>&1 | grep -E "error" | grep -v "vaults/page.tsx\|vaults/new/page.tsx\|supabase/types.ts" | head
```
Expected: tsc clean. Lint clean for files this plan touched (pre-existing unrelated errors are out of scope).

- [ ] **Step 2: Visual regression sweep**

In Chrome at 1280×800:
1. Reload `/` — Hero cascade unchanged.
2. Scroll to LiveActivity — section cascades in (eyebrow → body → stripe → feed rows).
3. Scroll past 24px — header gains backdrop weight.
4. Hover Mount Vault CTA — subtle lift + spring.
5. Click vaults — cards stagger in.
6. Trigger `bun scripts/buy-query.ts "final sweep"` from another terminal. Watch:
   - Packet flies into new feed row
   - Row flashes
   - Orbit central node pulses (scroll up to see it if needed)
   - Stat stripe cells border-flash + numbers bounce

In Chrome at 375×812 (resize page):
1. Repeat 1–6 — no horizontal overflow, all motion works at narrow viewport.

In Chrome with reduced-motion (DevTools → Rendering → Emulate prefers-reduced-motion: reduce):
1. Repeat 1–6 — content appears, numbers update, but no transforms, no packet, no pulse, no kicker flash.

- [ ] **Step 3: Push when satisfied**

```
git log --oneline -4
git push origin master
```

---

## Self-review

**1. Spec coverage**
- Motion presets file → Task 1 ✓
- LiveEventsContext + provider wrap → Task 2 ✓
- Hero springs migration → Task 3 ✓
- LiveActivity entrance choreography → Task 4 ✓
- Vault list cards stagger → Task 5 ✓
- Header scroll-state → Task 6 ✓
- CTA whileHover springs → Task 7 ✓
- LiveActivityClient pushes to context → Task 8 ✓
- Settlement packet trail → Task 9 ✓
- OrbitVisual feed-sync → Task 10 ✓
- Stat stripe kicker (with AnimatedNumber bumpOn) → Task 11 ✓
- Reduced-motion fallback → Tasks 4, 5, 9, 10, 11 each handle it
- Verification protocol → "Final verification" block ✓

**2. Placeholder scan** — no TBD/TODO. Every code step shows the exact code.

**3. Type consistency**
- `LiveEvent { signature, vaultSlug, ts }` — defined in Task 2, consumed in Task 8 (push call) and Task 10 (recent[0].signature)
- `useLiveEvents(): { recent, push }` — same return shape used in Tasks 8, 10, 11
- `bumpOn?: string | number | null` on AnimatedNumber — defined Task 11 Step 1, called Task 11 Step 3 with `headSig` (`string | null`) ✓
- `stage: number` prop chain — set in Task 4 Step 3, consumed Steps 4–7 of Task 4 (StatStripe + ActivityFeed + FeedRow)
- `headSig: string | null` — set in Task 11 Step 2, consumed in StatStripe + AnimatedNumber bumpOn
- `reduced: boolean` prop chain — set in Task 4 Step 3, threaded through ActivityFeed + FeedRow in Task 9 Step 3
