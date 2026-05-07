"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { SPRINGS } from "@/lib/motion/presets";
import { OrbitVisual } from "../_components/OrbitVisual";

const MotionLink = motion(Link);

/* ─────────────────────────────────────────────────────────
 * HERO ENTRANCE STORYBOARD
 *
 *    0ms   blank — chrome stays static (header/nav already rendered)
 *  100ms   live indicator slides down + ping starts
 *  250ms   headline fades up
 *  400ms   sub-paragraph fades up
 *  550ms   CTAs fade up
 *  700ms   orbit canvas reveals (right column)
 *  850ms   stats stripe stagger in (4 cells × 80ms)
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  liveIndicator: 100,
  headline: 250,
  paragraph: 400,
  ctas: 550,
  orbit: 700,
  stats: 850,
} as const;

const HEADLINE = {
  offsetY: 16,
  spring: SPRINGS.headline,
};

const FADE = {
  spring: SPRINGS.smooth,
};

const CARD_STAGGER_MS = 80;

const HERO_STATS = [
  { label: "Confirmation", value: "~400ms", caption: "Solana devnet" },
  { label: "Starting at", value: "0.05 USDC", caption: "operator-set price" },
  { label: "Per-vault routing", value: "x402", caption: "no platform custody" },
  { label: "Agent surface", value: "MCP", caption: "drop-in for any runtime" },
] as const;

export function Hero() {
  const [rawStage, setRawStage] = useState(0);
  const reduced = useReducedMotion();
  const stage = reduced ? 99 : rawStage;

  useEffect(() => {
    if (reduced) return;
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setRawStage(1), TIMING.liveIndicator),
      setTimeout(() => setRawStage(2), TIMING.headline),
      setTimeout(() => setRawStage(3), TIMING.paragraph),
      setTimeout(() => setRawStage(4), TIMING.ctas),
      setTimeout(() => setRawStage(5), TIMING.orbit),
      setTimeout(() => setRawStage(6), TIMING.stats),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-16 pb-24 lg:pt-28 lg:pb-36">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : -8 }}
              transition={FADE.spring}
            >
              <LiveIndicator />
            </motion.div>

            <motion.h1
              className="text-display-xl mt-10 text-[var(--color-text)] max-w-[18ch]"
              initial={{ opacity: 0, y: HEADLINE.offsetY }}
              animate={{
                opacity: stage >= 2 ? 1 : 0,
                y: stage >= 2 ? 0 : HEADLINE.offsetY,
              }}
              transition={HEADLINE.spring}
            >
              AI agents pay you{" "}
              <em className="not-italic font-normal text-[var(--color-accent)]">
                when they cite
              </em>{" "}
              your knowledge.
            </motion.h1>

            <motion.p
              className="text-lead mt-8 max-w-xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 12 }}
              transition={FADE.spring}
            >
              Mount any markdown corpus, get an{" "}
              <span className="text-mono-tight text-[var(--color-text)]">x402 + RAG</span>{" "}
              endpoint, earn USDC every time an AI agent cites it. Per-vault
              routing on Solana — Brain Drain itself never custodies the
              funds, settlements land in the operator&apos;s wallet in{" "}
              <span className="text-mono-tight text-[var(--color-text)]">~400ms</span>.
            </motion.p>

            <motion.div
              className="mt-9 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 12 }}
              transition={FADE.spring}
            >
              <MotionLink
                href="/vaults/new"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.snappy}
                className="group inline-flex h-11 px-6 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)]"
              >
                Mount your vault
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </MotionLink>
              <MotionLink
                href="/vaults"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.snappy}
                className="group inline-flex h-11 px-5 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)]/40 backdrop-blur text-[14px] text-[var(--color-text)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-emphasis)]"
              >
                Browse vaults
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </MotionLink>
              <a
                href="#how-it-works"
                className="hidden sm:inline-flex h-11 px-3 items-center text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                How it works ↓
              </a>
            </motion.div>
          </div>

          <motion.div
            className="relative order-last hidden lg:block scale-90 origin-top-right"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{
              opacity: stage >= 5 ? 0.92 : 0,
              scale: stage >= 5 ? 0.9 : 0.86,
            }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
            aria-hidden="true"
          >
            <OrbitVisual active={stage >= 5} />
          </motion.div>
        </div>

        <div className="mt-24 lg:mt-32 flex flex-wrap items-baseline gap-x-10 gap-y-5 border-t border-[var(--color-border)] pt-7">
          {HERO_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex items-baseline gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: stage >= 6 ? 1 : 0,
                y: stage >= 6 ? 0 : 8,
              }}
              transition={{
                ...FADE.spring,
                delay: stage >= 6 ? (i * CARD_STAGGER_MS) / 1000 : 0,
              }}
            >
              <span className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
                {stat.label}
              </span>
              <span className="text-mono-tight text-[14px] text-[var(--color-text)] tabular-nums">
                {stat.value}
              </span>
              <span className="hidden md:inline text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
                · {stat.caption}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveIndicator() {
  return (
    <div className="inline-flex items-center gap-2.5 px-3 h-7 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur-sm">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-60 animate-ping" />
        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-accent)]" />
      </span>
      <span className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
        Live on Solana devnet
      </span>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 6h6m0 0L6 3m3 3L6 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
