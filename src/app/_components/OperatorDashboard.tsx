"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Vault } from "@/lib/supabase";
import { formatUsdc } from "@/lib/format";
import { PhantomConnect } from "./PhantomConnect";
import { VaultCard } from "./VaultCard";
import { AnimatedNumber } from "./AnimatedNumber";

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; vaults: Vault[] }
  | { kind: "error"; reason: string };

export function OperatorDashboard() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [state, setState] = useState<FetchState>({ kind: "idle" });

  const onWalletChange = useCallback((w: string | null) => {
    setWallet(w);
    if (w === null) setState({ kind: "idle" });
  }, []);

  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    setState({ kind: "loading" });
    fetch(`/api/vaults?owner=${encodeURIComponent(wallet)}&limit=60&sort=recent`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`http ${res.status}`);
        return res.json() as Promise<{ vaults: Vault[] }>;
      })
      .then((data) => {
        if (!cancelled) setState({ kind: "ready", vaults: data.vaults });
      })
      .catch((err) => {
        if (!cancelled) setState({ kind: "error", reason: (err as Error).message });
      });
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  return (
    <div className="mt-12 lg:mt-14">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[var(--color-border)]">
        <div>
          <p className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
            {wallet ? "Connected wallet" : "Connect to view your vaults"}
          </p>
          {wallet && (
            <p className="mt-2 text-mono-tight text-[13px] text-[var(--color-text)]">
              Showing vaults where{" "}
              <code className="text-[var(--color-accent)]">owner_wallet</code>{" "}
              matches your address.
            </p>
          )}
        </div>
        <PhantomConnect onChange={onWalletChange} />
      </div>

      {!wallet && <DisconnectedState />}
      {wallet && state.kind === "loading" && <LoadingState />}
      {wallet && state.kind === "error" && (
        <ErrorState reason={state.reason} />
      )}
      {wallet && state.kind === "ready" && (
        <ReadyState vaults={state.vaults} wallet={wallet} />
      )}
    </div>
  );
}

function DisconnectedState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] px-6 py-14 text-center"
    >
      <p className="text-eyebrow">Wallet identity</p>
      <p className="mt-4 text-[var(--color-text-muted)] text-sm max-w-md mx-auto leading-[1.55]">
        Brain Drain uses your Solana wallet as identity — no email, no
        password, no separate account. Connect Phantom and we&apos;ll fetch
        every vault you&apos;ve mounted under that address.
      </p>
      <p className="mt-5 text-mono-tight text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
        v0: trust-the-wallet · v1: signed nonce attestation
      </p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 p-6 h-[260px] animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState({ reason }: { reason: string }) {
  return (
    <div className="mt-10 rounded-[var(--radius-card)] border border-[#ff8a8a]/30 bg-[#ff8a8a]/5 p-6">
      <p className="text-mono-tight text-[12px] text-[#ff8a8a]">
        Failed to load vaults · {reason}
      </p>
    </div>
  );
}

function ReadyState({
  vaults,
  wallet,
}: {
  readonly vaults: Vault[];
  readonly wallet: string;
}) {
  const aggregates = useMemo(() => computeAggregates(vaults), [vaults]);

  if (vaults.length === 0) {
    return <NoVaultsYet wallet={wallet} />;
  }

  return (
    <>
      <AggregateStrip aggregates={aggregates} />

      <div className="mt-10 flex items-baseline justify-between">
        <p className="text-eyebrow">Your vaults</p>
        <Link
          href="/vaults/new"
          className="text-mono-tight text-[12px] uppercase tracking-[0.16em] text-[var(--color-accent)] hover:brightness-110 transition-colors"
        >
          Mount another →
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {vaults.map((v) => (
          <VaultCard key={v.id} vault={v} />
        ))}
      </div>
    </>
  );
}

function NoVaultsYet({ wallet }: { readonly wallet: string }) {
  const short = `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] px-6 py-14 text-center"
    >
      <p className="text-eyebrow">No vaults under {short}</p>
      <p className="mt-4 text-[var(--color-text-muted)] text-sm max-w-md mx-auto leading-[1.55]">
        This wallet hasn&apos;t mounted a vault yet. Drop a markdown bundle
        and you&apos;ll have a paid x402 endpoint in under a minute.
      </p>
      <Link
        href="/vaults/new"
        className="mt-6 inline-flex h-11 px-6 items-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 transition-all"
      >
        Mount your first vault →
      </Link>
    </motion.div>
  );
}

interface Aggregates {
  readonly count: number;
  readonly totalEarned: number;
  readonly totalSettlements: number;
  readonly totalChunks: number;
}

function computeAggregates(vaults: Vault[]): Aggregates {
  let totalEarned = 0;
  let totalSettlements = 0;
  let totalChunks = 0;
  for (const v of vaults) {
    totalEarned += Number(v.total_earned_usdc);
    totalSettlements += v.total_settlements;
    totalChunks += v.chunks_count;
  }
  return {
    count: vaults.length,
    totalEarned,
    totalSettlements,
    totalChunks,
  };
}

function AggregateStrip({ aggregates }: { readonly aggregates: Aggregates }) {
  const items = [
    {
      label: "Vaults",
      value: aggregates.count,
      format: (n: number) => Math.round(n).toString(),
      caption: aggregates.count === 1 ? "operator vault" : "operator vaults",
    },
    {
      label: "Lifetime earned",
      value: aggregates.totalEarned,
      format: (n: number) => `$${formatUsdc(n)}`,
      caption: "USDC, on-chain",
    },
    {
      label: "Settlements",
      value: aggregates.totalSettlements,
      format: (n: number) => Math.round(n).toString(),
      caption: "across all vaults",
    },
    {
      label: "Chunks indexed",
      value: aggregates.totalChunks,
      format: (n: number) => Math.round(n).toString(),
      caption: "embeddings stored",
    },
  ];

  return (
    <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
      {items.map((s, i) => (
        <motion.div
          key={s.label}
          className="bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 30,
            delay: i * 0.06,
          }}
        >
          <p className="text-eyebrow">{s.label}</p>
          <AnimatedNumber
            value={s.value}
            format={s.format}
            delay={i * 0.05}
            className="text-display text-[clamp(22px,3vw,34px)] mt-3 text-[var(--color-text)] tabular-nums block"
          />
          <p className="text-mono-tight text-[11px] mt-1 text-[var(--color-text-faint)]">
            {s.caption}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
