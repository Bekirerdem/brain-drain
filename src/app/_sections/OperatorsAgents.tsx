"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const AGENT_RUNTIMES = [
  "Claude Desktop",
  "Cursor",
  "Cline",
  "Continue.dev",
  "OpenCode",
] as const;

export function OperatorsAgents() {
  return (
    <section
      id="operators-and-agents"
      className="relative overflow-hidden border-t border-border bg-transparent"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-16 pb-16 md:pt-20 md:pb-20">
        
        {/* Eyebrow */}
        <div className="text-[10px] font-mono tracking-widest text-text-muted uppercase font-bold">
          [ Two sides, one rail ]
        </div>

        {/* Heading */}
        <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-mono tracking-tight font-black uppercase text-text max-w-3xl leading-[0.95]">
          Mount a vault. Or send your agent. <br />
          <span className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 mt-2 inline-block border border-[var(--color-accent)]/20">
            Both flows in one click.
          </span>
        </h2>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.2 }}
      className="rounded-none border border-border bg-bg-card p-6 md:p-8 flex flex-col justify-between font-mono"
    >
      <div className="space-y-4">
        <p className="text-[10px] text-text-faint uppercase tracking-wider">[For operators]</p>
        <h3 className="text-xl md:text-2xl font-black uppercase text-text">
          Your decision log <br />
          <span className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 mt-1 inline-block border border-[var(--color-accent)]/20">
            is a paid API now.
          </span>
        </h3>
        <p className="text-xs lg:text-sm leading-relaxed text-text-muted max-w-[460px] pl-3 border-l border-border-strong">
          Drop a folder of markdown — Obsidian export, Notion dump,
          decision log. Brain Drain chunks, embeds, and mints an
          x402-gated endpoint at <code className="text-text font-bold">/api/v/{"{your-slug}"}/query</code>.
          You set the price, USDC settles direct to your wallet.
        </p>

        <ul className="space-y-2 text-xs text-text-muted pt-2">
          <Bullet>$0.05–$5 per query, operator-set</Bullet>
          <Bullet>No platform custody · no waitlist</Bullet>
          <Bullet>~30 seconds to mount 100 chunks</Bullet>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 items-center">
        <Link
          href="/vaults/new"
          className="bg-[var(--color-accent)] text-[var(--color-bg)] font-mono font-bold text-xs uppercase px-5 h-10 inline-flex items-center justify-center border border-[var(--color-accent)] hover:bg-bg hover:text-[var(--color-accent)] transition-colors duration-100"
        >
          [ Mount Vault ]
        </Link>
        <Link
          href="/vaults"
          className="text-xs text-text-muted hover:text-[var(--color-accent)] transition-colors font-bold"
        >
          Browse public vaults &rarr;
        </Link>
      </div>
    </motion.div>
  );
}

function AgentCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.2, delay: 0.05 }}
      className="rounded-none border border-border bg-bg-card p-6 md:p-8 flex flex-col justify-between font-mono"
    >
      <div className="space-y-4">
        <p className="text-[10px] text-text-faint uppercase tracking-wider">[For agent buyers]</p>
        <h3 className="text-xl md:text-2xl font-black uppercase text-text">
          Stop hallucinating. <br />
          <span className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 mt-1 inline-block border border-[var(--color-accent)]/20">
            Cite real experts.
          </span>
        </h3>
        <p className="text-xs lg:text-sm leading-relaxed text-text-muted max-w-[460px] pl-3 border-l border-border-strong">
          Paste the MCP endpoint into your agent runtime. CDP MPC
          signs every USDC transfer — no SDK lock-in, no key handling.
          Pay only what you cite, get on-chain proof every round trip.
        </p>

        <ul className="flex flex-wrap gap-2 pt-2">
          {AGENT_RUNTIMES.map((r) => (
            <li
              key={r}
              className="inline-flex items-center px-2.5 h-6 rounded-none border border-border-strong bg-bg/50 text-[10px] text-text font-bold"
            >
              {r}
            </li>
          ))}
          <li className="inline-flex items-center px-2.5 h-6 rounded-none border border-dashed border-border text-[10px] text-text-faint">
            + any MCP client
          </li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 items-center">
        <Link
          href="https://github.com/Bekirerdem/brain-drain#quickstart-local-development"
          className="bg-bg border border-border-strong text-text font-mono font-bold text-xs uppercase px-5 h-10 inline-flex items-center justify-center hover:border-[var(--color-accent)]/50 transition-colors duration-100"
        >
          [ Drop Endpoint ]
        </Link>
        <Link
          href="/#how-it-works"
          className="text-xs text-text-muted hover:text-[var(--color-accent)] transition-colors font-bold"
        >
          See mechanics &rarr;
        </Link>
      </div>
    </motion.div>
  );
}

function Bullet({ children }: { readonly children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden="true" className="text-[var(--color-accent)]">
        &gt;
      </span>
      <span>{children}</span>
    </li>
  );
}
