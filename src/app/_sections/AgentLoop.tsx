"use client";

import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────
 * AGENT LOOP — surfaces the four-tool MCP catalog as a flow.
 *
 * HowItWorks shows the wire-level x402 protocol. This section sits
 * one level above: what the agent actually does across a full
 * decision loop (discover → preview → pay → rate). Without it, a
 * juror reads the landing as "one paid endpoint" instead of an
 * agent commerce primitive with quality signals.
 * ───────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    tool: "brain_drain_list_vaults",
    title: "Discover",
    cost: "free",
    body: "Agent fetches the public catalog. Each entry carries the price, payout address, chunks_count, earnings track record (total_earned_usdc, total_settlements, last_settlement_at), satisfaction signal (useful_rate), and a free preview_chunk.",
  },
  {
    n: "02",
    tool: "preview_chunks",
    title: "Preview",
    cost: "free",
    body: "Operators ship one chunk as a teaser so the agent can sample voice and density before committing. Quality check before payment, not after.",
  },
  {
    n: "03",
    tool: "brain_drain_query_vault",
    title: "Pay",
    cost: "price varies per vault",
    body: "Agent picks a vault by slug, the buyer's CDP wallet signs a USDC transfer to that vault's payout address on Solana, and the top-K snippets stream back with the on-chain settlement signature. Round-trip ~3.4s.",
  },
  {
    n: "04",
    tool: "brain_drain_submit_feedback",
    title: "Rate",
    cost: "free, idempotent",
    body: "After the paid query, the agent rates whether the snippets actually moved it forward. Idempotent on settlement signature, aggregated into useful_rate so future agents prioritize the experts whose work pays off.",
  },
] as const;

export function AgentLoop() {
  return (
    <section
      id="agent-loop"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-28 lg:pt-32 lg:pb-32">
        <p className="text-eyebrow">Agent decision loop</p>
        <h2 className="text-display mt-6 text-[clamp(36px,5.5vw,68px)] text-[var(--color-text)] max-w-3xl leading-[1.02]">
          Four MCP tools.{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            One closed loop.
          </em>
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          The MCP catalog is more than a paid endpoint — it&apos;s a
          full discovery + payment + feedback loop. Quality signals feed
          back into the catalog, so agents who pay learn where to look
          next time.
        </p>

        <ol className="mt-14 lg:mt-16 grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
          {STEPS.map((step, i) => (
            <LoopStep key={step.n} step={step} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function LoopStep({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 30,
        delay: index * 0.05,
      }}
      className="bg-[var(--color-bg)] px-7 py-8 lg:px-9 lg:py-10"
    >
      <div className="flex items-baseline gap-4">
        <span className="text-mono-tight text-[11px] tracking-[0.04em] text-[var(--color-accent)]">
          {step.n}
        </span>
        <span className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
          {step.cost}
        </span>
      </div>
      <h3 className="mt-4 text-display text-[clamp(22px,3vw,28px)] text-[var(--color-text)]">
        {step.title}
      </h3>
      <code className="mt-2 inline-block text-mono-tight text-[12px] text-[var(--color-text-muted)]">
        {step.tool}
      </code>
      <p className="mt-4 text-[14px] leading-[1.65] text-[var(--color-text-muted)] max-w-[480px]">
        {step.body}
      </p>
    </motion.li>
  );
}
