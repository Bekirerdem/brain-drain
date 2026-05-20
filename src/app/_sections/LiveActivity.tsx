import { env } from "@/lib/env";
import { getLedgerPayouts, type PayoutEvent } from "@/lib/payouts";
import type { SolanaCluster } from "@/lib/format";
import { LiveActivityClient } from "../_components/LiveActivityClient";

const INITIAL_LIMIT = 20;

async function loadInitial(): Promise<PayoutEvent[]> {
  try {
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
      className="bg-transparent relative overflow-hidden border-t border-border"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-16 pb-20 md:pt-20 md:pb-24">
        <SectionEyebrow network={network} />

        <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-mono tracking-tight font-black uppercase text-text max-w-3xl leading-[0.95]">
          Protocol settlements, <br />
          <span className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 mt-2 inline-block border border-[var(--color-accent)]/20">
            in real time.
          </span>
        </h2>

        <p className="mt-6 max-w-2xl text-text-muted text-sm font-mono leading-relaxed pl-4 border-l border-border-strong">
          Every paid query is an on-chain SPL transfer from the buyer agent&apos;s
          wallet to a vault operator&apos;s payout address. The feed below merges
          settlements across every public vault on the protocol, polling{" "}
          <span className="text-[var(--color-accent)]">/api/payouts</span>{" "}
          every 10 seconds — no mocks, no proxies, just on-chain truth.
        </p>

        <div className="mt-10 md:mt-12">
          <LiveActivityClient initial={initial} network={network} />
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ network }: { network: SolanaCluster }) {
  const label = network === "devnet" ? "Solana devnet · live" : "Solana mainnet · live";
  return (
    <div className="inline-flex items-center gap-2.5 px-3 h-7 rounded-none border border-border bg-bg-card font-mono text-[10px]">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-60 animate-ping" />
        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-accent)]" />
      </span>
      <span className="uppercase tracking-[0.15em] text-text-muted font-bold">
        [{label}]
      </span>
    </div>
  );
}
