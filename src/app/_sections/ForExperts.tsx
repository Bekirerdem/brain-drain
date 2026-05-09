"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SPRINGS } from "@/lib/motion/presets";

const MotionLink = motion(Link);

const STEPS = [
  {
    n: "01",
    title: "Point at your vault",
    body: "Any directory of Markdown files. Obsidian, Notion export, internal wiki, your engineering decision log — anything where your hard-won knowledge already lives.",
  },
  {
    n: "02",
    title: "Seed the embedding index",
    body: "Drop the bundle in /vaults/new. Brain Drain chunks every page, runs Gemini embeddings, and persists a query-ready index in Supabase Storage. ~30 s for 100 chunks.",
  },
  {
    n: "03",
    title: "Earn USDC per query",
    body: "Get a paid x402 endpoint at /api/v/{your-slug}/query. Settlements route directly to your Solana address — Brain Drain never custodies funds. Operator picks the price.",
  },
] as const;

export function ForExperts() {
  return (
    <section
      id="for-experts"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-28 lg:pt-32 lg:pb-36">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-start">
          <div>
            <p className="text-eyebrow">For vault operators</p>
            <h2 className="text-display mt-6 text-[clamp(36px,5.5vw,68px)] text-[var(--color-text)]">
              Mount your vault.{" "}
              <em className="not-italic font-normal text-[var(--color-accent)]">
                Get paid.
              </em>
            </h2>
            <p className="mt-6 max-w-xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
              The decision log you already keep is what AI agents
              hallucinate around today. Mount it as an x402 endpoint, set
              your price, get paid every time an agent cites it. No
              gatekeeping — every vault publishes its own metadata, agents
              pay (or don&apos;t) based on what they see.
            </p>

            <ol className="mt-12 space-y-7">
              {STEPS.map((step, i) => (
                <ExpertStep key={step.n} step={step} index={i} />
              ))}
            </ol>

            <p className="mt-12 text-mono-tight text-[12px] text-[var(--color-text-faint)] max-w-md leading-[1.6]">
              Multi-vault devnet live now. Mainnet config is one env flag —
              `SOLANA_NETWORK=mainnet-beta` — protocol logic is identical.
            </p>
          </div>

          <MountCallout />
        </div>
      </div>
    </section>
  );
}

function ExpertStep({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  return (
    <motion.li
      className="flex gap-5"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 28,
        delay: index * 0.08,
      }}
    >
      <span className="shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)]">
        <span className="text-mono-tight text-[11px] tracking-[0.04em] text-[var(--color-accent)]">
          {step.n}
        </span>
      </span>
      <div>
        <h3 className="text-[17px] font-medium text-[var(--color-text)]">
          {step.title}
        </h3>
        <p className="mt-2 text-[14px] leading-[1.65] text-[var(--color-text-muted)] max-w-md">
          {step.body}
        </p>
      </div>
    </motion.li>
  );
}

function MountCallout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/70 backdrop-blur-md p-7 lg:p-9"
    >
      <p className="text-eyebrow">Live now · devnet</p>
      <h3 className="mt-4 text-display text-[clamp(22px,3vw,28px)] text-[var(--color-text)]">
        Drop your markdown.{" "}
        <em className="not-italic font-normal text-[var(--color-accent)]">
          Get an endpoint.
        </em>
      </h3>
      <p className="mt-3 text-[14px] leading-[1.6] text-[var(--color-text-muted)] max-w-sm">
        No waitlist, no approval queue, no gating. Mount a vault now and
        share the URL with any agent runtime that speaks MCP or x402.
        Settlements route to your Solana wallet on-chain.
      </p>

      <div className="mt-7 space-y-3">
        <MotionLink
          href="/vaults/new"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRINGS.snappy}
          className="block w-full h-11 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)] grid place-items-center"
        >
          Mount your vault →
        </MotionLink>
        <MotionLink
          href="/vaults"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRINGS.snappy}
          className="block w-full h-11 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/40 text-[14px] text-[var(--color-text)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-emphasis)] grid place-items-center"
        >
          Browse public vaults
        </MotionLink>
      </div>

      <ul className="mt-8 space-y-2.5 text-[12.5px] text-[var(--color-text-muted)] leading-[1.55]">
        <Bullet>You set the price · 0.05 – 5.00 USDC per query</Bullet>
        <Bullet>Settlements land in your wallet · Brain Drain holds nothing</Bullet>
        <Bullet>Re-mount any time to pick up vault edits</Bullet>
        <Bullet>Public metadata — agents inspect before paying</Bullet>
      </ul>

      <p className="mt-6 text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
        Solo build · open source · MIT
      </p>
    </motion.div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="text-[var(--color-accent)] text-[11px] mt-1">▸</span>
      <span>{children}</span>
    </li>
  );
}
