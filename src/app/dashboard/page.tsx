import type { Metadata } from "next";
import { env } from "@/lib/env";
import { getSellerPayouts, type PayoutEvent } from "@/lib/payouts";
import type { SolanaCluster } from "@/lib/format";
import { DashboardClient } from "../_components/DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INITIAL_LIMIT = 25;

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Live earnings, settlements, top buyers, and payout history for the Brain Drain seller wallet.",
};

async function loadInitial(): Promise<{
  events: PayoutEvent[];
  cursor: string | null;
}> {
  try {
    const events = await getSellerPayouts({ limit: INITIAL_LIMIT });
    const cursor = events.length === INITIAL_LIMIT
      ? events[events.length - 1].signature
      : null;
    return { events, cursor };
  } catch {
    return { events: [], cursor: null };
  }
}

export default async function DashboardPage() {
  const { events, cursor } = await loadInitial();
  const network: SolanaCluster =
    env.SOLANA_NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet";

  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas opacity-50" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 pb-32 lg:pt-28 lg:pb-40">
        <NetworkBadge network={network} />
        <h1 className="text-display mt-8 text-[clamp(40px,7vw,80px)] text-[var(--color-text)] max-w-3xl">
          Protocol settlements,{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            streamed.
          </em>
        </h1>
        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          Every USDC settlement that confirms on-chain shows up here in real
          time — pulled directly from{" "}
          <span className="text-mono-tight text-[var(--color-text)]">
            /api/payouts
          </span>{" "}
          via Helius parsed-tx. No off-chain ledger, no edits. v0 surfaces
          the maintainer's vault; v1 will federate per-operator dashboards.
        </p>

        <div className="mt-14 lg:mt-16">
          <DashboardClient initial={events} cursor={cursor} network={network} />
        </div>
      </div>
    </section>
  );
}

function NetworkBadge({ network }: { network: SolanaCluster }) {
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
