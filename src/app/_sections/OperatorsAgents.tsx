"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SPRINGS } from "@/lib/motion/presets";

const MotionLink = motion(Link);

const AGENT_RUNTIMES = [
  "Claude Desktop",
  "Cursor",
  "Cline",
  "Continue.dev",
  "OpenCode",
] as const;

/* ─────────────────────────────────────────────────────────
 * OPERATORS + AGENTS — single bento that replaces the two
 * separate ForExperts + ForAgents sections. Kept compact so the
 * landing reads like a teaser hub: each card is one paragraph plus
 * a "learn more" link. Deeper content lives on the destination
 * page (/vaults/new for operators, README + MCP docs for agents).
 * ───────────────────────────────────────────────────────── */
export function OperatorsAgents() {
  return (
    <section
      id="operators-and-agents"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      {/*
       * Lower-junction bg — futuristic-7.jpg. Mirror pair of the
       * upper section's junction-top. The orange tile junction sits
       * in the image's lower half; cover-fit + center top keeps the
       * top of the image at the section's top edge so its streaks
       * pick up exactly where HowItWorks' junction-top.jpg left off.
       * mix-blend-mode: screen drops the image's black backdrop.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/bg/junction-bottom.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          mixBlendMode: "screen",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-24 lg:pt-28 lg:pb-28">
        <p className="text-eyebrow">Two sides, one rail</p>
        <h2 className="text-display mt-6 text-[clamp(36px,5.5vw,64px)] text-[var(--color-text)] max-w-[860px] leading-[1.04]">
          Mount a vault. Or send your agent.{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            Both flows in one click.
          </em>
        </h2>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          <OperatorCard />
          <AgentCard />
        </div>
      </div>
    </section>
  );
}

function OperatorCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...SPRINGS.smooth }}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-7 lg:p-9 flex flex-col"
    >
      <p className="text-eyebrow">For operators</p>
      <h3 className="mt-5 text-display text-[clamp(22px,3vw,32px)] text-[var(--color-text)]">
        Your decision log{" "}
        <em className="not-italic font-normal text-[var(--color-accent)]">
          is a paid API now.
        </em>
      </h3>
      <p className="mt-4 text-[14.5px] leading-[1.6] text-[var(--color-text-muted)] max-w-[460px]">
        Drop a folder of markdown — Obsidian export, Notion dump,
        decision log. Brain Drain chunks, embeds, and mints an
        x402-gated endpoint at <code className="text-mono-tight text-[var(--color-text)]">/api/v/{`{your-slug}`}/query</code>.
        You set the price, USDC settles direct to your wallet.
      </p>

      <ul className="mt-6 space-y-2 text-[13px] text-[var(--color-text-muted)]">
        <Bullet>$0.05–$5 per query, operator-set</Bullet>
        <Bullet>No platform custody · no waitlist</Bullet>
        <Bullet>~30 seconds to mount 100 chunks</Bullet>
      </ul>

      <div className="mt-7 flex flex-wrap gap-3">
        <MotionLink
          href="/vaults/new"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRINGS.snappy}
          className="inline-flex h-10 px-5 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-medium hover:brightness-110 hover:shadow-[0_0_28px_-6px_var(--color-accent)]"
        >
          Mount your vault
          <Arrow />
        </MotionLink>
        <Link
          href="/vaults"
          className="inline-flex h-10 px-4 items-center text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Browse public vaults →
        </Link>
      </div>
    </motion.div>
  );
}

function AgentCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...SPRINGS.smooth, delay: 0.06 }}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-7 lg:p-9 flex flex-col"
    >
      <p className="text-eyebrow">For agent buyers</p>
      <h3 className="mt-5 text-display text-[clamp(22px,3vw,32px)] text-[var(--color-text)]">
        Stop hallucinating.{" "}
        <em className="not-italic font-normal text-[var(--color-accent)]">
          Cite real experts.
        </em>
      </h3>
      <p className="mt-4 text-[14.5px] leading-[1.6] text-[var(--color-text-muted)] max-w-[460px]">
        Paste the MCP endpoint into your agent runtime. CDP MPC
        signs every USDC transfer — no SDK lock-in, no key handling.
        Pay only what you cite, get on-chain proof every round trip.
      </p>

      <ul className="mt-5 flex flex-wrap gap-1.5">
        {AGENT_RUNTIMES.map((r) => (
          <li
            key={r}
            className="inline-flex items-center px-2.5 h-6 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/50 text-mono-tight text-[11px] text-[var(--color-text)]"
          >
            {r}
          </li>
        ))}
        <li className="inline-flex items-center px-2.5 h-6 rounded-[var(--radius-pill)] border border-dashed border-[var(--color-border)] text-mono-tight text-[11px] text-[var(--color-text-faint)]">
          + any MCP client
        </li>
      </ul>

      <div className="mt-7 flex flex-wrap gap-3">
        <MotionLink
          href="https://github.com/Bekirerdem/brain-drain#quickstart-local-development"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRINGS.snappy}
          className="inline-flex h-10 px-5 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] text-[13px] text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)] hover:border-[var(--color-accent)]/40"
        >
          Drop the endpoint
          <Arrow />
        </MotionLink>
        <Link
          href="/#how-it-works"
          className="inline-flex h-10 px-4 items-center text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          See protocol mechanics →
        </Link>
      </div>
    </motion.div>
  );
}

function Bullet({ children }: { readonly children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden="true" className="text-[var(--color-accent)] mt-0.5 text-[12px]">
        ▸
      </span>
      <span>{children}</span>
    </li>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className="size-3.5"
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
