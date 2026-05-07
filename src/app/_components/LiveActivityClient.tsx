"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
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
import { OFFSETS, SPRINGS, STAGGER } from "@/lib/motion/presets";
import { useLiveEvents } from "@/lib/live-events/context";
import { AnimatedNumber } from "./AnimatedNumber";
import { SettlementPacket } from "./SettlementPacket";

const POLL_INTERVAL_MS = 10_000;
const FEED_VISIBLE = 5;
const HIGHLIGHT_MS = 2_000;

/* ─────────────────────────────────────────────────────────
 * LIVEACTIVITY ENTRANCE STORYBOARD (fires on viewport enter)
 *
 * Eyebrow + headline + body copy stay server-rendered in
 * LiveActivity.tsx (no entrance animation — they read as static
 * label content). The choreographed pieces are the client-owned
 * stat stripe + feed rows that this file renders.
 *
 *    0ms   blank — stat stripe + feed invisible
 *  200ms   stage 1: stat stripe — 4 cells stagger 60ms each
 *  460ms   stage 2: feed rows — visible 5 rows stagger 50ms each
 *  720ms   trailing meta paragraph fades in
 * ───────────────────────────────────────────────────────── */
const ENTRANCE = {
  stripe: 200,
  feed:   460,
  meta:   720,
} as const;

const FEED_ROW_STAGGER_MS = 50;
const STRIPE_CELL_STAGGER = STAGGER.normal;

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

  const reduced = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapperRef, { once: true, amount: 0.1 });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduced) {
      setStage(99);
      return;
    }
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStage(1), ENTRANCE.stripe),
      setTimeout(() => setStage(2), ENTRANCE.feed),
      setTimeout(() => setStage(3), ENTRANCE.meta),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced]);

  const { push, recent } = useLiveEvents();
  const headSig = recent[0]?.signature ?? null;

  const fetchPayouts = useCallback(async () => {
    try {
      const res = await fetch("/api/payouts?limit=20", { cache: "no-store" });
      if (!res.ok) return;
      const data: { payouts: PayoutEvent[] } = await res.json();
      const incoming = data.payouts;
      const newOnes = incoming.filter(
        (p) => !seenRef.current.has(p.signature),
      );
      if (newOnes.length > 0) {
        newOnes.forEach((p) => {
          seenRef.current.add(p.signature);
          push({
            signature: p.signature,
            vaultSlug: p.vaultSlug,
            ts: Date.now(),
          });
        });
        setHighlighted((prev) => {
          const next = new Set(prev);
          newOnes.forEach((p) => next.add(p.signature));
          return next;
        });
        setTimeout(() => {
          setHighlighted((prev) => {
            const next = new Set(prev);
            newOnes.forEach((p) => next.delete(p.signature));
            return next;
          });
        }, HIGHLIGHT_MS);
      }
      setPayouts(incoming);
    } catch {
      // network blip — next tick will retry
    }
  }, [push]);

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
    <div ref={wrapperRef}>
      <StatStripe stats={stats} now={now} stage={stage} headSig={headSig} />

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <ActivityFeed
          rows={visible}
          highlighted={highlighted}
          network={network}
          now={now}
          stage={stage}
          reduced={!!reduced}
        />
      )}

      <motion.p
        initial={{ opacity: 0, y: OFFSETS.rise }}
        animate={{
          opacity: stage >= 3 ? 1 : 0,
          y: stage >= 3 ? 0 : OFFSETS.rise,
        }}
        transition={SPRINGS.smooth}
        className="mt-6 text-mono-tight text-[11px] text-[var(--color-text-faint)]"
      >
        Showing latest {visible.length} of {payouts.length} settlements ·{" "}
        <a href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          full history in dashboard ↗
        </a>
      </motion.p>
    </div>
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

function StatStripe({
  stats,
  now,
  stage,
  headSig,
}: {
  stats: Stats;
  now: number;
  stage: number;
  headSig: string | null;
}) {
  const [kickerActive, setKickerActive] = useState(false);
  const lastBumpedSig = useRef<string | null>(null);

  useEffect(() => {
    if (!headSig || headSig === lastBumpedSig.current) return;
    lastBumpedSig.current = headSig;
    setKickerActive(true);
    const t = setTimeout(() => setKickerActive(false), 300);
    return () => clearTimeout(t);
  }, [headSig]);

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
      {items.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: OFFSETS.rise }}
          animate={{
            opacity: stage >= 1 ? 1 : 0,
            y: stage >= 1 ? 0 : OFFSETS.rise,
          }}
          transition={{
            ...SPRINGS.smooth,
            delay: stage >= 1 ? i * STRIPE_CELL_STAGGER : 0,
          }}
          className={`bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7 transition-[box-shadow] duration-300 ${
            kickerActive ? "shadow-[inset_0_0_0_1px_var(--color-accent)]" : ""
          }`}
        >
          <p className="text-eyebrow">{s.label}</p>
          {s.numeric ? (
            <AnimatedNumber
              value={s.numeric.value}
              format={s.numeric.format}
              prefix={s.numeric.prefix}
              delay={s.numeric.delay}
              bumpOn={headSig}
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
        </motion.div>
      ))}
    </div>
  );
}

function ActivityFeed({
  rows,
  highlighted,
  network,
  now,
  stage,
  reduced,
}: {
  rows: PayoutEvent[];
  highlighted: Set<string>;
  network: SolanaCluster;
  now: number;
  stage: number;
  reduced: boolean;
}) {
  return (
    <div className="mt-10 rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
      <div className="grid grid-cols-[1.6fr_1.4fr_1fr_0.9fr] sm:grid-cols-[1.6fr_1.4fr_1.4fr_1fr_0.9fr] gap-3 sm:gap-4 px-4 sm:px-5 lg:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <span className="text-eyebrow">Signature</span>
        <span className="text-eyebrow hidden sm:inline">Vault</span>
        <span className="text-eyebrow">Payer</span>
        <span className="text-eyebrow text-right">Amount</span>
        <span className="text-eyebrow text-right">Time</span>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {rows.map((row, i) => (
          <FeedRow
            key={row.signature}
            row={row}
            index={i}
            isNew={highlighted.has(row.signature)}
            network={network}
            now={now}
            stage={stage}
            reduced={reduced}
          />
        ))}
      </ul>
    </div>
  );
}

function FeedRow({
  row,
  index,
  isNew,
  network,
  now,
  stage,
  reduced,
}: {
  row: PayoutEvent;
  index: number;
  isNew: boolean;
  network: SolanaCluster;
  now: number;
  stage: number;
  reduced: boolean;
}) {
  const flashClass = isNew
    ? "bg-[rgba(25,251,155,0.08)] animate-[fade-up_400ms_var(--ease-out-expo)]"
    : "hover:bg-[var(--color-bg-card)]/40";
  return (
    <motion.li
      initial={{ opacity: 0, y: OFFSETS.rise }}
      animate={{
        opacity: stage >= 2 ? 1 : 0,
        y: stage >= 2 ? 0 : OFFSETS.rise,
      }}
      transition={{
        ...SPRINGS.smooth,
        delay: stage >= 2 ? (index * FEED_ROW_STAGGER_MS) / 1000 : 0,
      }}
      className={`relative grid grid-cols-[1.6fr_1.4fr_1fr_0.9fr] sm:grid-cols-[1.6fr_1.4fr_1.4fr_1fr_0.9fr] gap-3 sm:gap-4 px-4 sm:px-5 lg:px-6 py-3.5 transition-colors duration-300 ${flashClass}`}
    >
      {isNew && !reduced && <SettlementPacket />}
      <a
        href={solscanTxUrl(row.signature, network)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-mono-tight text-[13px] text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors truncate"
      >
        {truncateSignature(row.signature)}
      </a>
      <div className="hidden sm:flex min-w-0">
        {row.vaultSlug ? (
          <a
            href={`/vaults/${row.vaultSlug}`}
            className="text-mono-tight text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors truncate"
          >
            {row.vaultSlug}
          </a>
        ) : (
          <a
            href={solscanAddressUrl(row.recipient, network)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mono-tight text-[13px] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors truncate"
          >
            {truncateAddress(row.recipient)}
          </a>
        )}
      </div>
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
    </motion.li>
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
