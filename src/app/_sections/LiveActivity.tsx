import { env } from "@/lib/env";
import { getNetworkPayouts, type PayoutEvent } from "@/lib/payouts";
import type { SolanaCluster } from "@/lib/format";
import { LiveActivityClient } from "../_components/LiveActivityClient";

const INITIAL_LIMIT = 20;

async function loadInitial(): Promise<PayoutEvent[]> {
  try {
    return await getNetworkPayouts({ limit: INITIAL_LIMIT });
  } catch {
    return [];
  }
}

export async function LiveActivity() {
  const initial = await loadInitial();
  const network: SolanaCluster = env.SOLANA_NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet";

  return (
    <section
      id="live"
      className="relative overflow-hidden border-t border-[var(--color-border)] bg-[#08080b]"
    >
      <div className="bg-grain-overlay opacity-60" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-16 pb-20 lg:pt-20 lg:pb-24">
        <div className="flex flex-wrap items-end justify-between gap-y-4 gap-x-10 mb-10 pb-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-5">
            <SectionEyebrow network={network} />
            <p className="text-mono-tight text-[12px] text-[var(--color-text-muted)] max-w-md leading-[1.55]">
              On-chain SPL transfers. Polled every 10s.{" "}
              <span className="text-[var(--color-text)]">/api/payouts</span>.
            </p>
          </div>
          <h2
            id="live-headline"
            className="text-mono-tight text-[12px] uppercase tracking-[0.22em] text-[var(--color-text-faint)]"
          >
            Network feed · cross-vault
          </h2>
        </div>

        <LiveActivityClient initial={initial} network={network} />
      </div>
    </section>
  );
}

function SectionEyebrow({ network }: { network: SolanaCluster }) {
  const label = network === "devnet" ? "Solana devnet · live" : "Solana mainnet · live";
  return (
    <div className="inline-flex items-center gap-2.5 px-3 h-7 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur-sm">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-60 animate-ping" />
        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-accent)]" />
      </span>
      <span className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
