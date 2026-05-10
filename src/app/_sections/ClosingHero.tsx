"use client";

import Image from "next/image";
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
 * Closing brand panel — the actual bd-mark monogram inside an
 * accent-glow halo. Same logo asset as the header/footer (theme-
 * aware invert via --logo-invert) so the brand stays consistent
 * end to end. Concentric rings stay as ambient orbit decoration
 * around the logo, not as a substitute for it.
 */
function ClosingGlyph() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="relative aspect-square w-full max-w-[420px] mx-auto lg:mx-0 flex items-center justify-center"
    >
      {/* Soft accent glow behind the lockup */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(25,251,155,0.22),transparent_62%)]"
      />

      {/* Ambient orbit rings — pure decoration, lockup is the focus */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="var(--color-border-strong)"
          strokeWidth="0.6"
        />
        <circle
          cx="100"
          cy="100"
          r="68"
          stroke="var(--color-accent)"
          strokeOpacity="0.45"
          strokeWidth="0.9"
          strokeDasharray="2 6"
        />
      </svg>

      {/* Real bd-mark monogram, theme-aware invert. Sized to actually
          carry the right column — 80% of the panel up to 420px. */}
      <Image
        src="/bd-mark.png"
        alt=""
        width={2986}
        height={1408}
        className="relative w-[80%] max-w-[420px] h-auto"
        style={{ filter: "invert(var(--logo-invert))" }}
      />
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
