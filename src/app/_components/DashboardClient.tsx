"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const PAGE_SIZE = 25;
const POLL_INTERVAL_MS = 15_000;

type Props = {
  initial: PayoutEvent[];
  cursor: string | null;
  network: SolanaCluster;
};

export function DashboardClient({ initial, cursor: initCursor, network }: Props) {
  const [payouts, setPayouts] = useState<PayoutEvent[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [seenIds] = useState<Set<string>>(
    () => new Set(initial.map((p) => p.signature)),
  );

  // Polling — only refresh top of feed, not pagination
  const fetchTop = useCallback(async () => {
    try {
      const res = await fetch(`/api/payouts?limit=${PAGE_SIZE}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: { payouts: PayoutEvent[] } = await res.json();
      const fresh = data.payouts.filter((p) => !seenIds.has(p.signature));
      if (fresh.length === 0) return;
      fresh.forEach((p) => seenIds.add(p.signature));
      setPayouts((prev) => mergeAndSort([...fresh, ...prev]));
    } catch {
      // skip
    }
  }, [seenIds]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) fetchTop();
    };
    document.addEventListener("visibilitychange", onVis);
    const id = setInterval(() => {
      if (!document.hidden) fetchTop();
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchTop]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  async function loadMore() {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/payouts?limit=${PAGE_SIZE}&before=${encodeURIComponent(cursor)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data: { payouts: PayoutEvent[]; cursor: string | null } = await res.json();
      const fresh = data.payouts.filter((p) => !seenIds.has(p.signature));
      fresh.forEach((p) => seenIds.add(p.signature));
      setPayouts((prev) => mergeAndSort([...prev, ...fresh]));
      setCursor(data.cursor);
    } finally {
      setLoadingMore(false);
    }
  }

  const stats = useMemo(() => computeStats(payouts), [payouts]);
  const topBuyers = useMemo(() => computeTopBuyers(payouts), [payouts]);
  const series = useMemo(() => computeCumulativeSeries(payouts), [payouts]);

  return (
    <>
      <StatStripe stats={stats} now={now} />

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8 mt-12">
        <EarningsChart series={series} stats={stats} />
        <TopBuyers buyers={topBuyers} network={network} />
      </div>

      <PayoutTable
        rows={payouts}
        network={network}
        now={now}
        cursor={cursor}
        onLoadMore={loadMore}
        loadingMore={loadingMore}
      />
    </>
  );
}

// ─── data helpers ─────────────────────────────────────────────

function mergeAndSort(events: PayoutEvent[]): PayoutEvent[] {
  const seen = new Map<string, PayoutEvent>();
  for (const e of events) seen.set(e.signature, e);
  return [...seen.values()].sort((a, b) => b.blockTime - a.blockTime);
}

type Stats = {
  totalUsdc: number;
  count: number;
  lastBlockTime: number | null;
  uniquePayers: number;
  avgUsdc: number;
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
  const count = payouts.length;
  return {
    totalUsdc,
    count,
    lastBlockTime,
    uniquePayers: payers.size,
    avgUsdc: count === 0 ? 0 : totalUsdc / count,
  };
}

type Buyer = { address: string; total: number; count: number; lastSeen: number };

function computeTopBuyers(payouts: PayoutEvent[]): Buyer[] {
  const map = new Map<string, Buyer>();
  for (const p of payouts) {
    if (p.payer === "unknown") continue;
    const prev = map.get(p.payer);
    if (prev) {
      prev.total += p.amountUsdc;
      prev.count += 1;
      if (p.blockTime > prev.lastSeen) prev.lastSeen = p.blockTime;
    } else {
      map.set(p.payer, {
        address: p.payer,
        total: p.amountUsdc,
        count: 1,
        lastSeen: p.blockTime,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 6);
}

type SeriesPoint = { t: number; cumulative: number };

function computeCumulativeSeries(payouts: PayoutEvent[]): SeriesPoint[] {
  if (payouts.length === 0) return [];
  const ascending = [...payouts].sort((a, b) => a.blockTime - b.blockTime);
  let running = 0;
  return ascending.map((p) => {
    running += p.amountUsdc;
    return { t: p.blockTime, cumulative: running };
  });
}

// ─── UI: top stat stripe ──────────────────────────────────────

type DashStat = {
  label: string;
  caption: string;
  numeric?: { value: number; format: (n: number) => string; prefix?: string };
  staticValue?: string;
};

function StatStripe({ stats, now }: { stats: Stats; now: number }) {
  const items: DashStat[] = [
    {
      label: "Lifetime volume",
      caption: "USDC, on-chain",
      numeric: { value: stats.totalUsdc, format: (n) => formatUsdc(n), prefix: "$" },
    },
    {
      label: "Settlements",
      caption: "confirmed tx",
      numeric: { value: stats.count, format: (n) => Math.round(n).toString() },
    },
    {
      label: "Average ticket",
      caption: "per query",
      numeric: { value: stats.avgUsdc, format: (n) => formatUsdc(n), prefix: "$" },
    },
    {
      label: "Last settlement",
      caption: stats.lastBlockTime ? "real time" : "no activity yet",
      staticValue: stats.lastBlockTime ? timeAgo(stats.lastBlockTime, now) : "—",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
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
          {s.numeric ? (
            <AnimatedNumber
              value={s.numeric.value}
              format={s.numeric.format}
              prefix={s.numeric.prefix}
              delay={i * 0.05}
              className="text-display text-[clamp(22px,3vw,34px)] mt-3 text-[var(--color-text)] tabular-nums block"
            />
          ) : (
            <p className="text-display text-[clamp(22px,3vw,34px)] mt-3 text-[var(--color-text)] tabular-nums">
              {s.staticValue}
            </p>
          )}
          <p className="text-mono-tight text-[11px] mt-1 text-[var(--color-text-faint)]">
            {s.caption}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── UI: earnings chart ────────────────────────────────────────

const CHART_W = 600;
const CHART_H = 220;
const CHART_PAD = { x: 16, top: 24, bottom: 24 } as const;

function EarningsChart({ series, stats }: { series: SeriesPoint[]; stats: Stats }) {
  const path = useMemo(
    () => buildAreaPath(series, CHART_W, CHART_H, CHART_PAD),
    [series],
  );
  const linePath = useMemo(
    () => buildLinePath(series, CHART_W, CHART_H, CHART_PAD),
    [series],
  );
  const isEmpty = series.length === 0;

  return (
    <motion.div
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 backdrop-blur-sm p-6 lg:p-7"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 30, delay: 0.3 }}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-eyebrow">Cumulative earnings</p>
          <p className="mt-2 text-display text-[clamp(20px,2.6vw,28px)] text-[var(--color-text)] tabular-nums">
            ${formatUsdc(stats.totalUsdc)}
          </p>
        </div>
        <p className="text-mono-tight text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
          all-time · USDC
        </p>
      </div>

      {isEmpty ? (
        <div className="mt-6 h-[220px] grid place-items-center text-mono-tight text-[12px] text-[var(--color-text-faint)]">
          No settlements yet — chart will populate as payouts confirm.
        </div>
      ) : (
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="mt-4 w-full h-auto">
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(25,251,155,0.35)" />
              <stop offset="100%" stopColor="rgba(25,251,155,0)" />
            </linearGradient>
          </defs>
          <path d={path} fill="url(#chart-fill)" />
          <motion.path
            d={linePath}
            fill="none"
            stroke="#19fb9b"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
      )}
    </motion.div>
  );
}

type ChartPad = { x: number; top: number; bottom: number };

function buildLinePath(
  series: SeriesPoint[],
  width: number,
  height: number,
  pad: ChartPad,
): string {
  if (series.length === 0) return "";
  const innerW = width - pad.x * 2;
  const innerH = height - pad.top - pad.bottom;
  const tStart = series[0].t;
  const tEnd = series[series.length - 1].t;
  const tSpan = Math.max(1, tEnd - tStart);
  const yMax = Math.max(...series.map((p) => p.cumulative));

  return series
    .map((p, i) => {
      const x = pad.x + ((p.t - tStart) / tSpan) * innerW;
      const y = pad.top + (1 - p.cumulative / Math.max(yMax, 0.0001)) * innerH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(
  series: SeriesPoint[],
  width: number,
  height: number,
  pad: ChartPad,
): string {
  if (series.length === 0) return "";
  const linePath = buildLinePath(series, width, height, pad);
  const innerH = height - pad.bottom;
  const lastX = width - pad.x;
  const firstX = pad.x;
  return `${linePath} L ${lastX} ${innerH} L ${firstX} ${innerH} Z`;
}

// ─── UI: top buyers ────────────────────────────────────────────

function TopBuyers({ buyers, network }: { buyers: Buyer[]; network: SolanaCluster }) {
  return (
    <motion.div
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 backdrop-blur-sm p-6 lg:p-7"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 30, delay: 0.4 }}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-eyebrow">Top paying agents</p>
        <p className="text-mono-tight text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
          ranked by spend
        </p>
      </div>

      {buyers.length === 0 ? (
        <p className="mt-8 text-mono-tight text-[12px] text-[var(--color-text-faint)]">
          No identified payers yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {buyers.map((b, i) => (
            <li key={b.address} className="flex items-center gap-3.5">
              <span className="text-mono-tight text-[11px] text-[var(--color-text-faint)] w-5 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <a
                href={solscanAddressUrl(b.address, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono-tight text-[13px] text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors flex-1 truncate"
              >
                {truncateAddress(b.address)}
              </a>
              <span className="text-mono-tight text-[11px] text-[var(--color-text-faint)] tabular-nums">
                {b.count}×
              </span>
              <span className="text-mono-tight text-[13px] text-[var(--color-text)] tabular-nums w-[72px] text-right">
                ${formatUsdc(b.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

// ─── UI: full payout table ─────────────────────────────────────

type TableProps = {
  rows: PayoutEvent[];
  network: SolanaCluster;
  now: number;
  cursor: string | null;
  onLoadMore: () => void;
  loadingMore: boolean;
};

function PayoutTable({ rows, network, now, cursor, onLoadMore, loadingMore }: TableProps) {
  return (
    <motion.div
      className="mt-12 rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 30, delay: 0.5 }}
    >
      <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr] gap-4 px-5 lg:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <span className="text-eyebrow">Signature</span>
        <span className="text-eyebrow">Payer</span>
        <span className="text-eyebrow text-right">Amount</span>
        <span className="text-eyebrow text-right">Time</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 lg:px-6 py-12 text-center text-mono-tight text-[13px] text-[var(--color-text-faint)]">
          No settlements yet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {rows.map((r) => (
            <li
              key={r.signature}
              className="grid grid-cols-[2fr_1.4fr_1fr_1fr] gap-4 px-5 lg:px-6 py-3.5 hover:bg-[var(--color-bg-card)]/30 transition-colors"
            >
              <a
                href={solscanTxUrl(r.signature, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono-tight text-[13px] text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors truncate"
              >
                {truncateSignature(r.signature)}
              </a>
              {r.payer === "unknown" ? (
                <span className="text-mono-tight text-[13px] text-[var(--color-text-faint)] truncate">
                  unknown
                </span>
              ) : (
                <a
                  href={solscanAddressUrl(r.payer, network)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mono-tight text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors truncate"
                >
                  {truncateAddress(r.payer)}
                </a>
              )}
              <span className="text-mono-tight text-[13px] text-[var(--color-text)] text-right tabular-nums">
                +${formatUsdc(r.amountUsdc)}
              </span>
              <span className="text-mono-tight text-[12px] text-[var(--color-text-faint)] text-right tabular-nums">
                {timeAgo(r.blockTime, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-[var(--color-border)] px-5 lg:px-6 py-4 flex items-center justify-between">
        <p className="text-mono-tight text-[11px] text-[var(--color-text-faint)]">
          Showing {rows.length} settlement{rows.length === 1 ? "" : "s"}
        </p>
        {cursor && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-mono-tight text-[12px] uppercase tracking-[0.16em] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Load more ↓"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
