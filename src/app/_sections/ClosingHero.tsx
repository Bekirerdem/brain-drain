"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SPRINGS } from "@/lib/motion/presets";

const MotionLink = motion(Link);

/* ─────────────────────────────────────────────────────────
 * CLOSING HERO — orquestra-style closing breath before the
 * footer. Big headline, terse copy, two CTAs, and a giant
 * stylized brand glyph on the right that mirrors the lockup
 * watermark in the footer. The page should feel like it
 * "exhales" here before the link grid below.
 * ───────────────────────────────────────────────────────── */
export function ClosingHero() {
  return (
    <section
      id="closing"
      className="bg-aurora bg-grain relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="bg-aurora-canvas opacity-60" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-24 lg:pt-28 lg:pb-32">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={SPRINGS.smooth}
          >
            <p className="text-eyebrow">Protocol · live</p>
            <h2 className="mt-6 text-display text-[clamp(40px,6vw,80px)] text-[var(--color-text)] leading-[0.98]">
              Mount once.{" "}
              <em className="not-italic font-normal text-[var(--color-accent)]">
                Get paid forever.
              </em>
            </h2>
            <p className="mt-6 max-w-xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
              The rail is on Solana devnet. 5 vaults indexed, 9
              settlements on-chain, real USDC moving from agent
              wallets to operator wallets. Add yours, or send your
              agent — both flows take one click each.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <MotionLink
                href="/vaults/new"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.snappy}
                className="group inline-flex h-11 px-6 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)]"
              >
                Mount your vault
                <Arrow className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </MotionLink>
              <MotionLink
                href="/vaults"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.snappy}
                className="group inline-flex h-11 px-5 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)]/40 backdrop-blur text-[14px] text-[var(--color-text)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-emphasis)]"
              >
                Browse vaults
                <Arrow className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </MotionLink>
              <a
                href="https://github.com/Bekirerdem/brain-drain"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex h-11 px-3 items-center text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Read the source ↗
              </a>
            </div>
          </motion.div>

          <ClosingGlyph />
        </div>
      </div>
    </section>
  );
}

/**
 * Giant stylized "BD" glyph — same brand vocabulary as the lockup,
 * sized so it carries the right column on its own. Pure SVG so it
 * stays sharp at any breakpoint and respects the theme accent.
 */
function ClosingGlyph() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="relative aspect-square w-full max-w-[420px] mx-auto lg:mx-0"
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(25,251,155,0.25),transparent_60%)]" />
      <svg
        viewBox="0 0 200 200"
        fill="none"
        className="relative size-full"
        aria-hidden="true"
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="var(--color-border-strong)"
          strokeWidth="0.6"
        />
        <circle
          cx="100"
          cy="100"
          r="64"
          stroke="var(--color-accent)"
          strokeOpacity="0.55"
          strokeWidth="1"
          strokeDasharray="2 6"
        />
        <circle
          cx="100"
          cy="100"
          r="38"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
        />
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fontFamily="var(--font-brand)"
          fontSize="48"
          fill="var(--color-text)"
          letterSpacing="-2"
        >
          bd
        </text>
        <circle cx="100" cy="100" r="3" fill="var(--color-accent)" />
      </svg>
    </motion.div>
  );
}

function Arrow({ className }: { readonly className?: string }) {
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
