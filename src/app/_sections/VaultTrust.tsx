"use client";

import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────
 * VAULT TRUST — public metadata for the v0 operator vault.
 *
 * Answers the "who decides what's worth paying for?" question:
 * we don't gate operators. Trust signals are public, agents
 * (and humans) decide. v0 surfaces these signals manually for
 * the maintainer's vault. v1 federates the same shape across
 * uploads, with LLM-judge refunds + buyer ratings on top.
 * ───────────────────────────────────────────────────────── */

const VAULT = {
  operator: "Bekir Erdem",
  walletShort: "2SUm7…YMPb3L",
  description:
    "Lived experience across Avalanche L1 deployment, x402 micropayments on Solana, MCP architecture, agentic AI infrastructure, and CDP MPC wallet integration.",
  domains: [
    "Avalanche L1",
    "x402",
    "MCP",
    "Solana",
    "Foundry",
    "CDP MPC",
    "Anchor-free",
    "Helius RPC",
    "RAG",
  ],
  metrics: [
    { label: "Notes", value: "25" },
    { label: "Chunks", value: "152" },
    { label: "Avg chunk", value: "1.1k chars" },
    { label: "Frontmatter", value: "100%" },
    { label: "Source-linked", value: "high" },
    { label: "Last update", value: "May 2026" },
  ],
  signals: [
    "Every page has YAML frontmatter (operator, domain, last-update)",
    "Decision logs include alternatives-considered + explicit tradeoffs",
    "Source links in `[[wiki-format]]` cite the war-story they came from",
    "No synthetic AI-generated content — operator-authored only",
    "Build-time validated — malformed pages fail the seed step",
  ],
  shipped: [
    { name: "Koza-L1", url: "https://github.com/Bekirerdem/Koza-L1", note: "Avalanche L1 toolkit" },
    { name: "ChainBounty", url: "https://github.com/Bekirerdem/ChainBounty", note: "Cross-chain bounty (ICM)" },
    { name: "shavaxre", url: "https://github.com/Bekirerdem/shavaxre", note: "Education crowdfunding" },
    { name: "LexiMate", url: "https://leximate.com", note: "PWA, multiplayer duello" },
  ],
  v1: [
    "LLM-judge relevance refunds (Gemini-scored snippet quality, threshold-based USDC return)",
    "Vault metadata badges (citation density, freshness, owner wallet age)",
    "Buyer rating system (1–5 post-query, cumulative vault score, public)",
    "On-chain operator reputation (shipped-project verification + wallet history)",
  ],
} as const;

export function VaultTrust() {
  return (
    <section
      id="vault-trust"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-28 lg:pt-32 lg:pb-36">
        <p className="text-eyebrow">Vault trust signals</p>
        <h2 className="text-display mt-6 text-[clamp(36px,5.5vw,68px)] text-[var(--color-text)] max-w-3xl">
          Public signals,{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            no gatekeeper.
          </em>
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          We don't decide who counts as an expert. Every vault publishes its
          own metadata — chunk discipline, citation density, owner provenance,
          shipped projects — and agents pay (or don't) based on what they see.
          v0 surfaces these signals manually for the maintainer's vault. v1
          adds LLM-judge refunds and buyer ratings on top.
        </p>

        <div className="mt-12 lg:mt-16 grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
          <OperatorCard />
          <SignalsCard />
        </div>

        <V1RoadmapCard />
      </div>
    </section>
  );
}

function OperatorCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-7 lg:p-9"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
            Operator
          </p>
          <h3 className="mt-2 text-display text-[clamp(20px,2.6vw,28px)] text-[var(--color-text)]">
            {VAULT.operator}
          </h3>
          <p className="mt-1 text-mono-tight text-[12px] text-[var(--color-text-faint)]">
            wallet · {VAULT.walletShort}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 h-6 rounded-[var(--radius-pill)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
          v0 maintainer
        </span>
      </div>

      <p className="mt-5 text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
        {VAULT.description}
      </p>

      <div className="mt-6">
        <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
          Domains
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {VAULT.domains.map((d) => (
            <li
              key={d}
              className="inline-flex items-center px-2.5 h-6 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/60 text-mono-tight text-[11px] text-[var(--color-text-muted)]"
            >
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-px bg-[var(--color-border)] border border-[var(--color-border)] rounded-[10px] overflow-hidden">
        {VAULT.metrics.map((m) => (
          <div
            key={m.label}
            className="bg-[var(--color-bg-elevated)] px-3 py-3"
          >
            <p className="text-mono-tight text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
              {m.label}
            </p>
            <p className="mt-1.5 text-mono-tight text-[14px] text-[var(--color-text)] tabular-nums">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7">
        <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
          Shipped projects (operator history)
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {VAULT.shipped.map((s) => (
            <li key={s.name}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2.5 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)]/40 hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)] transition-colors"
              >
                <p className="text-[13px] font-medium text-[var(--color-text)]">
                  {s.name} <span className="text-[var(--color-text-faint)]">↗</span>
                </p>
                <p className="text-mono-tight text-[10px] text-[var(--color-text-faint)] mt-0.5">
                  {s.note}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function SignalsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 280, damping: 30, delay: 0.1 }}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-7 lg:p-9"
    >
      <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
        Quality signals
      </p>
      <h3 className="mt-2 text-display text-[clamp(20px,2.6vw,28px)] text-[var(--color-text)]">
        What an agent can verify before paying
      </h3>

      <ul className="mt-7 space-y-4">
        {VAULT.signals.map((s, i) => (
          <SignalRow key={i} text={s} />
        ))}
      </ul>

      <div className="mt-8 px-4 py-3.5 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)]/40">
        <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
          Validation in code
        </p>
        <p className="mt-1.5 text-mono-tight text-[12px] text-[var(--color-text-muted)] leading-[1.55]">
          <code className="text-[var(--color-accent)]">scripts/seed-vault.ts</code>{" "}
          parses every page with{" "}
          <code className="text-[var(--color-text)]">gray-matter</code>, fails
          on missing frontmatter, and chunks via Markdown structure (not
          paragraph-naive). The same script runs in CI before deploy.
        </p>
      </div>
    </motion.div>
  );
}

function SignalRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3.5">
      <span
        aria-hidden="true"
        className="shrink-0 mt-0.5 inline-flex items-center justify-center size-5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/40"
      >
        <svg viewBox="0 0 12 12" className="size-2.5">
          <path
            d="M2.5 6.5l2.5 2.5 4.5-5"
            stroke="#19fb9b"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className="text-[14px] leading-[1.55] text-[var(--color-text-muted)]"
        dangerouslySetInnerHTML={{ __html: renderInlineCode(text) }}
      />
    </li>
  );
}

function renderInlineCode(text: string): string {
  return text.replace(
    /`([^`]+)`/g,
    '<code class="text-mono-tight text-[var(--color-text)]">$1</code>',
  );
}

function V1RoadmapCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 280, damping: 30, delay: 0.2 }}
      className="mt-10 lg:mt-14 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]/30 backdrop-blur-sm p-7 lg:p-9"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
          v1 trust framework
        </p>
        <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-violet)]">
          post-hackathon
        </p>
      </div>
      <h3 className="mt-3 text-display text-[clamp(20px,2.6vw,26px)] text-[var(--color-text)]">
        How the protocol scales beyond a single operator
      </h3>
      <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
        v0 ships the protocol with the maintainer's vault. v1 keeps the same
        public-signal model but adds active quality denetim — same mechanism
        for everyone, no operator gating, agents stay in control.
      </p>
      <ul className="mt-6 grid sm:grid-cols-2 gap-3">
        {VAULT.v1.map((v, i) => (
          <li
            key={i}
            className="px-4 py-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)]/40 text-[13px] leading-[1.55] text-[var(--color-text-muted)]"
          >
            {v}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
