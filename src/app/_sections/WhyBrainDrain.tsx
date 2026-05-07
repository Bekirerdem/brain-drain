"use client";

import { motion } from "framer-motion";

const ROWS = [
  {
    other: "Skyfire / paid agent platforms",
    them: "Custodial wallet — platform holds and routes the funds.",
    us: "Operator's Solana wallet receives directly. Brain Drain never custodies.",
  },
  {
    other: "A paid MCP server you wrote yourself",
    them: "Off-chain Stripe / Lightning / API key — receipts not auditable on a public chain.",
    us: "x402 settlement on Solana — every cited snippet is an on-chain transfer with a real signature.",
  },
  {
    other: "Data marketplaces (Ocean / Streamr / Snowflake share)",
    them: "Curation gate, listing fees, platform cut on every query.",
    us: "MIT reference implementation. Mount your corpus, set your price, keep 100% of the settlement.",
  },
] as const;

export function WhyBrainDrain() {
  return (
    <section
      aria-labelledby="why-brain-drain-headline"
      className="relative border-t border-[var(--color-border)] bg-[var(--color-bg)]"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-28 lg:pt-32 lg:pb-36">
        <p className="text-eyebrow">Why Brain Drain · differentiator</p>
        <h2
          id="why-brain-drain-headline"
          className="text-display mt-7 text-[clamp(36px,5.5vw,64px)] text-[var(--color-text)] max-w-3xl"
        >
          Same job, three different mechanisms.
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          Other ways exist to charge AI agents for paid knowledge. Each one
          makes a different trade — custody, fees, or auditability. Here is
          what Brain Drain trades for what.
        </p>

        <div className="mt-14 rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1.1fr_1.4fr_1.4fr] gap-px bg-[var(--color-border)]">
            <div className="px-6 py-4 bg-[var(--color-bg-elevated)]">
              <p className="text-eyebrow">Mechanism</p>
            </div>
            <div className="px-6 py-4 bg-[var(--color-bg-elevated)]">
              <p className="text-eyebrow">Their trade</p>
            </div>
            <div className="px-6 py-4 bg-[var(--color-bg-elevated)]">
              <p className="text-eyebrow text-[var(--color-accent)]">
                Brain Drain
              </p>
            </div>
          </div>

          <ul className="divide-y divide-[var(--color-border)]">
            {ROWS.map((row, i) => (
              <motion.li
                key={row.other}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 26,
                  delay: i * 0.08,
                }}
                className="grid md:grid-cols-[1.1fr_1.4fr_1.4fr] gap-3 md:gap-px bg-[var(--color-border)]"
              >
                <div className="px-6 py-6 bg-[var(--color-bg)]">
                  <p className="md:hidden text-eyebrow mb-2">Mechanism</p>
                  <p className="text-[14px] text-[var(--color-text)] leading-[1.5]">
                    {row.other}
                  </p>
                </div>
                <div className="px-6 py-6 bg-[var(--color-bg)]">
                  <p className="md:hidden text-eyebrow mb-2">Their trade</p>
                  <p className="text-[13.5px] text-[var(--color-text-muted)] leading-[1.55]">
                    {row.them}
                  </p>
                </div>
                <div className="px-6 py-6 bg-[var(--color-bg)]">
                  <p className="md:hidden text-eyebrow mb-2 text-[var(--color-accent)]">
                    Brain Drain
                  </p>
                  <p className="text-[13.5px] text-[var(--color-text)] leading-[1.55]">
                    {row.us}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="mt-10 max-w-3xl text-mono-tight text-[12px] text-[var(--color-text-faint)] leading-[1.65]">
          The reference implementation is MIT-licensed. Fork it, run your own
          deployment, point your operator's MCP URL at your own host — the
          protocol survives the deployment.
        </p>
      </div>
    </section>
  );
}
