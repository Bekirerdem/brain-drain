import { env } from "@/lib/env";
import { getLedgerPayouts, type PayoutEvent } from "@/lib/payouts";
import type { SolanaCluster } from "@/lib/format";
import { LiveActivityClient } from "../_components/LiveActivityClient";

const INITIAL_LIMIT = 20;

async function loadInitial(): Promise<PayoutEvent[]> {
  try {
    // Same source as /api/payouts — the DB-backed ledger. Earlier this
    // used getNetworkPayouts (RPC indexer), which on hard refresh
    // briefly painted faucet-inflated stats ($25.20 / 17 settlements)
    // before the client poll replaced them with the real ledger view
    // ($3.70 / 9). SSR + polling now read the same source.
    return await getLedgerPayouts({ limit: INITIAL_LIMIT });
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
      <div className="bg-aurora-canvas opacity-50" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      {/*
       * Center burst accent — futuristic-7.gif → VP9 WebM (1.16 MB →
       * 481 KB). Single instance, centered in the section.
       * object-contain keeps the square aspect; the area around it
       * stays the section bg (dark), so the particle burst reads as
       * a focal element rather than a tiled pattern.
       * mix-blend-mode: screen drops the video's black backdrop.
       * Hidden below lg.
       */}
      <video
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none hidden lg:block absolute inset-0 w-full h-full object-contain z-[1]"
        style={{ mixBlendMode: "screen" }}
      >
        <source src="/video/live-burst.webm" type="video/webm" />
      </video>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-28 lg:pt-32 lg:pb-36">
        <SectionEyebrow network={network} />

        <h2 className="text-display mt-8 text-[clamp(36px,6vw,72px)] text-[var(--color-text)] max-w-3xl">
          Protocol settlements,{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            in real time.
          </em>
        </h2>

        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          Every paid query is an on-chain SPL transfer from the buyer agent's
          wallet to a vault operator's payout address. The feed below merges
          settlements across every public vault on the protocol, polling{" "}
          <span className="text-mono-tight text-[var(--color-text)]">/api/payouts</span>{" "}
          every 10 seconds — no mocks, no proxies, just on-chain truth.
        </p>

        <div className="mt-12 lg:mt-14">
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
