"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SPRINGS } from "@/lib/motion/presets";

const MotionLink = motion(Link);

export function EndingRecap() {
  return (
    <section
      aria-labelledby="recap-headline"
      className="relative border-t border-[var(--color-border)]"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-32 pb-36 lg:pt-44 lg:pb-48">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-mono-tight text-[10px] uppercase tracking-[0.28em] text-[var(--color-accent)]/70">
            ─── ready ───
          </p>
          <h2
            id="recap-headline"
            className="text-display-lg mt-10 text-[var(--color-text)]"
          >
            Mount your corpus.
            <span className="block text-[var(--color-text-muted)]">
              Get an x402 endpoint.
            </span>
            <span className="block text-[var(--color-accent)]">
              Earn USDC, today.
            </span>
          </h2>
          <p className="text-lead mt-10 mx-auto max-w-xl">
            Live on Solana devnet right now — the same code path that ships
            to mainnet. Your wallet, your price, your settlement.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <MotionLink
              href="/vaults/new"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRINGS.snappy}
              className="group inline-flex h-12 px-8 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_48px_-8px_var(--color-accent)]"
            >
              Mount your vault
              <span aria-hidden="true">→</span>
            </MotionLink>
            <MotionLink
              href="/vaults"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRINGS.snappy}
              className="inline-flex h-12 px-7 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)]/40 backdrop-blur text-[14px] text-[var(--color-text)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-emphasis)]"
            >
              Browse public vaults
            </MotionLink>
          </div>

          <p className="mt-10 text-mono-tight text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-faint)]">
            No waitlist · Phantom + 1 signature · MIT-licensed
          </p>
        </div>
      </div>
    </section>
  );
}
