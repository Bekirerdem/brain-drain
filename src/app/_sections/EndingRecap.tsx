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
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 pb-32 lg:pt-36 lg:pb-40">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-eyebrow text-[var(--color-accent)]/80">Ready</p>
            <h2
              id="recap-headline"
              className="text-display mt-7 text-[clamp(36px,5.5vw,64px)] text-[var(--color-text)] leading-[1.02]"
            >
              Mount your corpus.
              <span className="block text-[var(--color-text-muted)]">
                Get an x402 endpoint.
              </span>
              <span className="block text-[var(--color-accent)]">
                Earn USDC, today.
              </span>
            </h2>
            <p className="mt-7 max-w-xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
              Live on Solana devnet right now — same code path that ships to
              mainnet. Your wallet, your price, your settlement.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <MotionLink
                href="/vaults/new"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.snappy}
                className="group inline-flex h-12 px-7 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)]"
              >
                Mount your vault
                <span aria-hidden="true">→</span>
              </MotionLink>
              <MotionLink
                href="/vaults"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.snappy}
                className="inline-flex h-12 px-6 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)]/40 backdrop-blur text-[14px] text-[var(--color-text)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-emphasis)]"
              >
                Browse public vaults
              </MotionLink>
            </div>

            <p className="mt-7 text-mono-tight text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
              No waitlist · Phantom + 1 signature · MIT-licensed
            </p>
          </div>

          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 backdrop-blur-sm p-7 lg:p-9">
            <p className="text-eyebrow">For agents</p>
            <p className="mt-4 text-[15px] leading-[1.6] text-[var(--color-text-muted)]">
              Already running an MCP-capable runtime? Skip the rest of the
              page — drop our endpoint into your config and your agent can
              cite paid knowledge in the next request.
            </p>
            <a
              href="#how-it-works"
              className="mt-6 inline-flex items-center gap-2 text-[13px] text-[var(--color-violet)] hover:text-[var(--color-text)] transition-colors"
            >
              ↑ Jump to MCP quickstart
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
