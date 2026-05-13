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
  { label: "Settles in", value: "~400ms", caption: "Solana on-chain" },
  { label: "From", value: "$0.05", caption: "operator-set price" },
  { label: "Routes via", value: "x402", caption: "Brain Drain holds nothing" },
  { label: "Drop into", value: "MCP", caption: "Claude · Cursor · Cline" },
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

      {/*
       * Symmetric vortex accents — futuristic-4.gif converted to VP9
       * WebM (3.15 MB GIF → 506 KB video, 6× smaller). Same source
       * rendered twice: right-anchored on the right half, left-
       * anchored on the left half with scaleX(-1) so the two vortex
       * rings face each other and converge at the hero centerline.
       * mix-blend-mode: screen drops the video's black backdrop.
       * Hidden below lg to keep mobile clean and skip the double
       * decode cost on small screens.
       */}
      <video
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none hidden lg:block absolute inset-y-0 right-0 w-[50%] h-full object-cover z-[1]"
        style={{
          opacity: 0.6,
          filter: "saturate(0.85) brightness(1.15)",
          mixBlendMode: "screen",
        }}
      >
        <source src="/video/hero-vortex.webm" type="video/webm" />
      </video>
      <video
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none hidden lg:block absolute inset-y-0 left-0 w-[50%] h-full object-cover z-[1]"
        style={{
          opacity: 0.6,
          filter: "saturate(0.85) brightness(1.15)",
          mixBlendMode: "screen",
          transform: "scaleX(-1)",
        }}
      >
        <source src="/video/hero-vortex.webm" type="video/webm" />
      </video>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : -8 }}
              transition={FADE.spring}
            >
              <LiveIndicator />
            </motion.div>

            <motion.h1
              className="text-display mt-8 text-[clamp(40px,7vw,96px)] text-[var(--color-text)]"
              initial={{ opacity: 0, y: HEADLINE.offsetY }}
              animate={{
                opacity: stage >= 2 ? 1 : 0,
                y: stage >= 2 ? 0 : HEADLINE.offsetY,
              }}
              transition={HEADLINE.spring}
            >
              AI cites you.{" "}
              <br className="hidden md:block" aria-hidden="true" />
              <em className="not-italic font-normal text-[var(--color-accent)]">
                USDC arrives.
              </em>
            </motion.h1>

            <motion.p
              className="mt-7 max-w-xl text-[var(--color-text-muted)] text-lg lg:text-xl leading-[1.55]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 12 }}
              transition={FADE.spring}
            >
              Your{" "}
              <span className="text-mono-tight text-[var(--color-text)]">Claude&nbsp;Desktop</span>
              , your{" "}
              <span className="text-mono-tight text-[var(--color-text)]">Cursor</span>
              , any MCP-speaking agent — they read your decision log and pay your Solana wallet directly.{" "}
              <span className="text-mono-tight text-[var(--color-text)]">~400ms</span>{" "}
              settlement, no platform custody.
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
            className="relative order-first lg:order-last"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{
              opacity: stage >= 5 ? 1 : 0,
              scale: stage >= 5 ? 1 : 0.96,
            }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
          >
            <OrbitVisual active={stage >= 5} />
          </motion.div>
        </div>

        <div className="mt-20 lg:mt-28 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
          {HERO_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7"
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: stage >= 6 ? 1 : 0,
                y: stage >= 6 ? 0 : 12,
              }}
              transition={{
                ...FADE.spring,
                delay: stage >= 6 ? (i * CARD_STAGGER_MS) / 1000 : 0,
              }}
            >
              <p className="text-eyebrow">{stat.label}</p>
              <p className="text-display text-[clamp(22px,3vw,32px)] mt-3 text-[var(--color-text)] tabular-nums">
                {stat.value}
              </p>
              <p className="text-mono-tight text-[11px] mt-1 text-[var(--color-text-faint)]">
                {stat.caption}
              </p>
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
