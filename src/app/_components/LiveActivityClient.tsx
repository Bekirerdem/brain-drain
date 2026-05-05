"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PayoutEvent } from "@/lib/payouts";
import {
  formatUsdc,
  solscanAddressUrl,
  solscanTxUrl,
  timeAgo,
  truncateAddress,
  truncateSignature,
  type SolanaCluster,
} from "@/lib/format";
import { AnimatedNumber } from "./AnimatedNumber";

const POLL_INTERVAL_MS = 10_000;
const FEED_VISIBLE = 5;
const HIGHLIGHT_MS = 2_000;

type Props = {
  initial: PayoutEvent[];
  network: SolanaCluster;
};

export function LiveActivityClient({ initial, network }: Props) {
  const [payouts, setPayouts] = useState<PayoutEvent[]>(initial);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [polling, setPolling] = useState(true);
  const seenRef = useRef<Set<string>>(
    new Set(initial.map((p) => p.signature)),
  );

  const fetchPayouts = useCallback(async () => {
    try {
      const res = await fetch("/api/payouts?limit=20", { cache: "no-store" });
      if (!res.ok) return;
      const data: { payouts: PayoutEvent[] } = await res.json();
      const incoming = data.payouts;
      const newSigs = incoming
        .map((p) => p.signature)
        .filter((sig) => !seenRef.current.has(sig));
      if (newSigs.length > 0) {
        newSigs.forEach((sig) => seenRef.current.add(sig));
        setHighlighted((prev) => {
          const next = new Set(prev);
          newSigs.forEach((sig) => next.add(sig));
          return next;
        });
        setTimeout(() => {
          setHighlighted((prev) => {
            const next = new Set(prev);
            newSigs.forEach((sig) => next.delete(sig));
            return next;
          });
        }, HIGHLIGHT_MS);
      }
      setPayouts(incoming);
    } catch {
      // network blip — next tick will retry
    }
  }, []);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(fetchPayouts, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [polling, fetchPayouts]);

  useEffect(() => {
    const onVisibility = () => setPolling(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const stats = computeStats(payouts);
  const visible = payouts.slice(0, FEED_VISIBLE);

  return (
    <>
      <StatStripe stats={stats} now={now} />

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <ActivityFeed
          rows={visible}
          highlighted={highlighted}
          network={network}
          now={now}
        />
      )}

      <p className="mt-6 text-mono-tight text-[11px] text-[var(--color-text-faint)]">
        Showing latest {visible.length} of {payouts.length} settlements ·{" "}
        <a href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          full history in dashboard ↗
        </a>
      </p>
    </>
  );
}

type Stats = {
  totalUsdc: number;
  count: number;
  lastBlockTime: number | null;
  uniquePayers: number;
};

function computeStats(payouts: PayoutEvent[]): Stats {
  let totalUsdc = 0;
  let lastBlockTime: number | null = null;
  const payers = new Set<string>();
  for (const p of payouts) {
    totalUsdc += p.amountUsdc;
    if (lastBlockTime === null || p.blockTime > lastBlockTime) {
      lastBlockTime = p.blockTime;
    }
    if (p.payer !== "unknown") payers.add(p.payer);
  }
  return {
    totalUsdc,
    count: payouts.length,
    lastBlockTime,
    uniquePayers: payers.size,
  };
}

type StatItem = {
  label: string;
  caption: string;
  numeric?: { value: number; format: (n: number) => string; prefix?: string; delay?: number };
  staticValue?: string;
};

function StatStripe({ stats, now }: { stats: Stats; now: number }) {
  const items: StatItem[] = [
    {
      label: "Volume settled",
      caption: "USDC, on protocol",
      numeric: {
        value: stats.totalUsdc,
        format: (n) => formatUsdc(n),
        prefix: "$",
        delay: 0,
      },
    },
    {
      label: "Settlements",
      caption: "confirmed tx",
      numeric: {
        value: stats.count,
        format: (n) => Math.round(n).toString(),
        delay: 0.1,
      },
    },
    {
      label: "Last settlement",
      caption: "real time",
      staticValue: stats.lastBlockTime ? timeAgo(stats.lastBlockTime, now) : "—",
    },
    {
      label: "Distinct agents",
      caption: "buyer wallets",
      numeric: {
        value: stats.uniquePayers,
        format: (n) => Math.round(n).toString(),
        delay: 0.2,
      },
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
      {items.map((s) => (
        <div key={s.label} className="bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7">
          <p className="text-eyebrow">{s.label}</p>
          {s.numeric ? (
            <AnimatedNumber
              value={s.numeric.value}
              format={s.numeric.format}
              prefix={s.numeric.prefix}
              delay={s.numeric.delay}
              className="text-display text-[clamp(22px,3vw,32px)] mt-3 text-[var(--color-text)] tabular-nums block"
            />
          ) : (
            <p className="text-display text-[clamp(22px,3vw,32px)] mt-3 text-[var(--color-text)] tabular-nums">
              {s.staticValue}
            </p>
          )}
          <p className="text-mono-tight text-[11px] mt-1 text-[var(--color-text-faint)]">
            {s.caption}
          </p>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed({
  rows,
  highlighted,
  network,
  now,
}: {
  rows: PayoutEvent[];
  highlighted: Set<string>;
  network: SolanaCluster;
  now: number;
}) {
  return (
    <div className="mt-10 rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 px-5 lg:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <span className="text-eyebrow">Signature</span>
        <span className="text-eyebrow">Payer</span>
        <span className="text-eyebrow text-right">Amount</span>
        <span className="text-eyebrow text-right">Time</span>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {rows.map((row) => (
          <FeedRow
            key={row.signature}
            row={row}
            isNew={highlighted.has(row.signature)}
            network={network}
            now={now}
          />
        ))}
      </ul>
    </div>
  );
}

function FeedRow({
  row,
  isNew,
  network,
  now,
}: {
  row: PayoutEvent;
  isNew: boolean;
  network: SolanaCluster;
  now: number;
}) {
  const flashClass = isNew
    ? "bg-[rgba(25,251,155,0.08)] animate-[fade-up_400ms_var(--ease-out-expo)]"
    : "hover:bg-[var(--color-bg-card)]/40";
  return (
    <li
      className={`grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 px-5 lg:px-6 py-3.5 transition-colors duration-300 ${flashClass}`}
    >
      <a
        href={solscanTxUrl(row.signature, network)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-mono-tight text-[13px] text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors truncate"
      >
        {truncateSignature(row.signature)}
      </a>
      {row.payer === "unknown" ? (
        <span className="text-mono-tight text-[13px] text-[var(--color-text-faint)] truncate">
          unknown
        </span>
      ) : (
        <a
          href={solscanAddressUrl(row.payer, network)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-mono-tight text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors truncate"
        >
          {truncateAddress(row.payer)}
        </a>
      )}
      <span className="text-mono-tight text-[13px] text-[var(--color-text)] text-right tabular-nums">
        +${formatUsdc(row.amountUsdc)}
      </span>
      <span className="text-mono-tight text-[12px] text-[var(--color-text-faint)] text-right tabular-nums">
        {timeAgo(row.blockTime, now)}
      </span>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] px-6 py-12 text-center">
      <p className="text-eyebrow">Awaiting first settlement</p>
      <p className="mt-4 text-[var(--color-text-muted)] text-sm max-w-md mx-auto leading-[1.55]">
        No agents have paid yet. Fire a query from the demo CLI to seed the feed:
      </p>
      <pre className="mt-5 inline-block px-4 py-2.5 rounded-[var(--radius-pill)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-mono-tight text-[12px] text-[var(--color-accent)]">
        bun scripts/buy-query.ts &quot;your question&quot;
      </pre>
    </div>
  );
}
