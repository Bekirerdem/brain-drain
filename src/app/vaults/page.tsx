import Link from "next/link";
import type { Metadata } from "next";
import { listPublicVaults } from "@/lib/vaults";
import { VaultCard } from "../_components/VaultCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Vaults",
  description:
    "Public Brain Drain vaults. Each one is a maintained markdown corpus an AI agent can query for USDC.",
};

export default async function VaultsPage() {
  const vaults = await listPublicVaults({ limit: 60, sort: "earnings" });

  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas opacity-50" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-eyebrow">Vault directory</p>
            <h1 className="text-display mt-6 text-[clamp(36px,6vw,72px)] text-[var(--color-text)] max-w-3xl">
              {vaults.length === 0 ? (
                <>
                  No vaults{" "}
                  <em className="not-italic font-normal text-[var(--color-accent)]">yet.</em>
                </>
              ) : (
                <>
                  {vaults.length} maintained{" "}
                  <em className="not-italic font-normal text-[var(--color-accent)]">
                    {vaults.length === 1 ? "vault" : "vaults"}
                  </em>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
              Each vault is a markdown corpus mounted by its operator. Agents
              query, the protocol settles USDC straight to the operator's
              Solana address — Brain Drain itself never holds funds.
            </p>
          </div>
          <Link
            href="/vaults/new"
            className="inline-flex h-11 px-6 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)] transition-all duration-200"
          >
            Mount your vault →
          </Link>
        </div>

        {vaults.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {vaults.map((v, i) => (
              <VaultCard key={v.id} vault={v} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] px-6 py-16 text-center">
      <p className="text-eyebrow">No vaults indexed yet</p>
      <p className="mt-4 text-[var(--color-text-muted)] text-sm max-w-md mx-auto leading-[1.55]">
        Be the first. Mount a markdown directory, get a paid x402 endpoint,
        start earning USDC every time an agent cites your work.
      </p>
      <Link
        href="/vaults/new"
        className="mt-6 inline-flex h-11 px-6 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 transition-all"
      >
        Mount the first vault →
      </Link>
    </div>
  );
}
