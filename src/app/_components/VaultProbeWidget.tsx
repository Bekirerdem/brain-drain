"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Vault } from "@/lib/supabase";
import { formatUsdc, truncateAddress } from "@/lib/format";

interface Props {
  readonly vault: Vault;
}

interface Probe402Response {
  readonly accepts: ReadonlyArray<{
    readonly network: string;
    readonly maxAmountRequired: string;
    readonly resource: string;
    readonly payTo: string;
    readonly asset: string;
    readonly description: string;
  }>;
  readonly x402Version: number;
}

type State =
  | { kind: "idle" }
  | { kind: "probing" }
  | { kind: "quoted"; data: Probe402Response }
  | { kind: "error"; reason: string };

export function VaultProbeWidget({ vault }: Props) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onProbe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "probing") return;
    if (query.trim().length === 0) return;
    setState({ kind: "probing" });
    try {
      const res = await fetch(`/api/v/${vault.slug}/query`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.status === 402) {
        const data = (await res.json()) as Probe402Response;
        setState({ kind: "quoted", data });
        return;
      }
      const fallback = await res.text();
      setState({ kind: "error", reason: `unexpected ${res.status}: ${fallback.slice(0, 160)}` });
    } catch (err) {
      setState({ kind: "error", reason: (err as Error).message });
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-md p-7 lg:p-9">
      <p className="text-eyebrow">Ask the vault</p>
      <h3 className="mt-3 text-display text-[clamp(20px,2.6vw,28px)] text-[var(--color-text)]">
        See the 402 quote{" "}
        <em className="not-italic font-normal text-[var(--color-accent)]">live</em>.
      </h3>
      <p className="mt-3 max-w-md text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
        Drops a real x402 probe at{" "}
        <code className="text-mono-tight text-[var(--color-text)]">
          /api/v/{vault.slug}/query
        </code>
        . You&apos;ll get back the same 402 + payment requirements an agent
        would receive — no actual settlement until your wallet signs.
      </p>

      <form onSubmit={onProbe} className="mt-6 space-y-3">
        <label className="block">
          <span className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
            Question
          </span>
          <input
            type="text"
            required
            placeholder="e.g. Why x402 on Solana, not Base?"
            value={query}
            maxLength={1000}
            onChange={(e) => setQuery(e.target.value)}
            disabled={state.kind === "probing"}
            className="mt-2 w-full h-11 px-4 rounded-[var(--radius-pill)] bg-[var(--color-bg)] border border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] transition-colors"
          />
        </label>
        <button
          type="submit"
          disabled={state.kind === "probing" || query.trim().length === 0}
          className="w-full h-11 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state.kind === "probing" ? "Probing…" : "Probe 402 quote"}
        </button>
      </form>

      {state.kind === "quoted" && state.data.accepts[0] && (
        <QuoteResult quote={state.data.accepts[0]} version={state.data.x402Version} vault={vault} />
      )}
      {state.kind === "error" && (
        <p className="mt-5 text-mono-tight text-[12px] text-[#ff8a8a]">
          error · {state.reason}
        </p>
      )}
    </div>
  );
}

function QuoteResult({
  quote,
  version,
  vault,
}: {
  readonly quote: NonNullable<Probe402Response["accepts"][number]>;
  readonly version: number;
  readonly vault: Vault;
}) {
  const usdcAmount = Number(quote.maxAmountRequired) / 1_000_000;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="mt-6 rounded-[10px] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-5"
    >
      <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
        ✓ 402 received · x402 v{version}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Row label="Price" value={`$${formatUsdc(usdcAmount)} USDC`} />
        <Row label="Network" value={quote.network} />
        <Row label="Pay to" value={truncateAddress(quote.payTo)} mono />
        <Row label="Asset" value={truncateAddress(quote.asset)} mono />
      </dl>
      <p className="mt-4 text-[12px] leading-[1.55] text-[var(--color-text-muted)]">
        Sign a USDC transfer for{" "}
        <span className="text-mono-tight text-[var(--color-text)]">
          {usdcAmount.toFixed(2)}
        </span>{" "}
        to the address above, attach the signed tx as{" "}
        <code className="text-mono-tight text-[var(--color-text)]">X-Payment</code>{" "}
        header, retry the request — the vault returns{" "}
        <span className="text-mono-tight text-[var(--color-text)]">{vault.chunks_count}</span>{" "}
        cosine-similarity-ranked snippets.
      </p>
    </motion.div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
        {label}
      </dt>
      <dd
        className={`mt-1 text-[13px] text-[var(--color-text)] ${mono ? "text-mono-tight" : ""} tabular-nums`}
      >
        {value}
      </dd>
    </div>
  );
}
