"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const STEPS = [
  {
    n: "01",
    title: "Point at your vault",
    body: "Any directory of Markdown files. Obsidian, Notion export, internal wiki, your engineering decision log — anything where your hard-won knowledge already lives.",
  },
  {
    n: "02",
    title: "Seed the embedding index",
    body: "One command (bun seed-vault) chunks every page, runs Gemini embeddings, and persists a query-ready index alongside your code. Build-time, no vector DB.",
  },
  {
    n: "03",
    title: "Get a paid MCP endpoint",
    body: "Brain Drain gives you a public x402-gated URL. AI agents discover it via MCP, see the price metadata, settle USDC on Solana, and receive top-3 snippets in one round trip.",
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
              Today my vault.{" "}
              <em className="not-italic font-normal text-[var(--color-accent)]">
                Tomorrow any vault.
              </em>
            </h2>
            <p className="mt-6 max-w-xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
              The decision log you already keep is the corpus AI agents
              hallucinate around today. Mount it as an x402 endpoint. Earn USDC
              every time an agent cites it. No "experts" gating — the trust
              signals are public; agents (and you) decide what's worth paying for.
            </p>

            <ol className="mt-12 space-y-7">
              {STEPS.map((step, i) => (
                <ExpertStep key={step.n} step={step} index={i} />
              ))}
            </ol>

            <p className="mt-12 text-mono-tight text-[12px] text-[var(--color-text-faint)] max-w-md leading-[1.6]">
              v0 is single-seller by design — proves the x402+RAG protocol works end-to-end. v1 opens the upload flow, per-seller payouts, and trust signals (LLM-judge refunds, vault reputation) to everyone on the waitlist.
            </p>
          </div>

          <WaitlistCard />
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

type Status = "idle" | "submitting" | "success" | "error";

function WaitlistCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error ?? "Could not record your email. Try again.");
        return;
      }
      setStatus("success");
      setMessage(data?.message ?? "You're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network blip. Try again in a moment.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/70 backdrop-blur-md p-7 lg:p-9"
    >
      <p className="text-eyebrow">Waitlist · v1</p>
      <h3 className="mt-4 text-display text-[clamp(22px,3vw,28px)] text-[var(--color-text)]">
        Mount your vault.{" "}
        <em className="not-italic font-normal text-[var(--color-accent)]">
          Get paid.
        </em>
      </h3>
      <p className="mt-3 text-[14px] leading-[1.6] text-[var(--color-text-muted)] max-w-sm">
        Drop your email and I&apos;ll ping you the moment per-seller upload + payout
        splitting goes live. No spam, no newsletter — one email when v1 ships.
      </p>

      <form onSubmit={onSubmit} className="mt-7">
        <label className="block">
          <span className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
            Email
          </span>
          <input
            type="email"
            required
            placeholder="you@vault.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting" || status === "success"}
            className="mt-2 w-full h-11 px-4 rounded-[var(--radius-pill)] bg-[var(--color-bg)] border border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] transition-colors"
          />
        </label>

        <button
          type="submit"
          disabled={status === "submitting" || status === "success"}
          className="mt-4 w-full h-11 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting"
            ? "Adding…"
            : status === "success"
              ? "On the list ✓"
              : "Join the v1 waitlist"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-[12.5px] leading-[1.5] ${
            status === "error"
              ? "text-[#ff8a8a]"
              : "text-[var(--color-accent)]"
          }`}
        >
          {message}
        </p>
      )}

      <p className="mt-6 text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
        Solo build · open source · MIT
      </p>
    </motion.div>
  );
}
