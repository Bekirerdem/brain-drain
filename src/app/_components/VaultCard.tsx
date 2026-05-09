"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Vault } from "@/lib/supabase";
import { formatUsdc, truncateAddress } from "@/lib/format";
import { OFFSETS, SPRINGS, STAGGER } from "@/lib/motion/presets";

const STAGGER_CAP_INDEX = 8;

interface Props {
  readonly vault: Vault;
  readonly index?: number;
}

export function VaultCard({ vault, index = 0 }: Props) {
  const cappedIndex = Math.min(index, STAGGER_CAP_INDEX);

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: OFFSETS.rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        ...SPRINGS.bouncy,
        delay: cappedIndex * STAGGER.normal,
      }}
    >
      <Link
        href={`/vaults/${vault.slug}`}
        className="group flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 backdrop-blur-sm p-6 lg:p-7 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-display text-[clamp(18px,2vw,22px)] text-[var(--color-text)] truncate">
              {vault.name}
            </h3>
            <p className="mt-1 text-mono-tight text-[11px] text-[var(--color-text-faint)]">
              /vaults/{vault.slug}
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center px-2.5 h-6 rounded-[var(--radius-pill)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 text-mono-tight text-[10px] uppercase tracking-[0.16em] text-[var(--color-accent)] tabular-nums">
            ${formatUsdc(vault.price_usdc)}
          </span>
        </div>

        {vault.description && (
          <p className="mt-3 text-[13px] leading-[1.55] text-[var(--color-text-muted)] line-clamp-3">
            {vault.description}
          </p>
        )}

        {vault.domains.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {vault.domains.slice(0, 5).map((d) => (
              <li
                key={d}
                className="inline-flex items-center px-2 h-5 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-bg)]/40 text-mono-tight text-[10px] text-[var(--color-text-muted)]"
              >
                {d}
              </li>
            ))}
            {vault.domains.length > 5 && (
              <li className="text-mono-tight text-[10px] text-[var(--color-text-faint)] self-center pl-1">
                +{vault.domains.length - 5}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto pt-5 grid grid-cols-3 gap-2 border-t border-[var(--color-border)]">
          <Stat label="Earned" value={`$${formatUsdc(vault.total_earned_usdc)}`} />
          <Stat label="Settles" value={vault.total_settlements.toString()} />
          <Stat label="Chunks" value={vault.chunks_count.toString()} />
        </div>

        <p className="mt-4 text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] flex items-center gap-1.5">
          <span>operator</span>
          <span className="text-[var(--color-text-muted)] normal-case tracking-normal">
            {truncateAddress(vault.owner_wallet)}
          </span>
          <span className="ml-auto text-[var(--color-text-faint)] group-hover:text-[var(--color-accent)] transition-colors">
            ask vault →
          </span>
        </p>
      </Link>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-mono-tight text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
        {label}
      </p>
      <p className="mt-1 text-mono-tight text-[13px] text-[var(--color-text)] tabular-nums">
        {value}
      </p>
    </div>
  );
}
