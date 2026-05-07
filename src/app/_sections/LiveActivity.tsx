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
      className="bg-aurora bg-grain relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="bg-aurora-canvas opacity-60" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative pt-32 pb-32 lg:pt-44 lg:pb-44">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <SectionEyebrow network={network} />

          <h2 className="text-display mt-8 text-[clamp(36px,6vw,72px)] text-[var(--color-text)] max-w-3xl">
            Protocol settlements,
            <span className="block text-[var(--color-text-muted)]">in real time.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
            Every paid query is an on-chain SPL transfer from the buyer agent's
            wallet to a vault operator's payout address. The feed below merges
            settlements across every public vault on the protocol, polling{" "}
            <span className="text-mono-tight text-[var(--color-text)]">/api/payouts</span>{" "}
            every 10 seconds — no mocks, no proxies, just on-chain truth.
          </p>
        </div>

        <div className="mt-12 lg:mt-14 px-4 sm:px-6 lg:px-12">
          <LiveActivityClient initial={initial} network={network} />
        </div>
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
