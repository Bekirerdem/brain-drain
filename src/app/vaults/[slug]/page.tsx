import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicVaultBySlug } from "@/lib/vaults";
import { env } from "@/lib/env";
import {
  formatUsdc,
  solscanAddressUrl,
  truncateAddress,
  type SolanaCluster,
} from "@/lib/format";
import { VaultProbeWidget } from "../../_components/VaultProbeWidget";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vault = await getPublicVaultBySlug(slug);
  if (!vault) return { title: "Vault not found" };
  return {
    title: vault.name,
    description:
      vault.description ??
      `${vault.chunks_count} chunks · ${vault.price_usdc} USDC per query · settled on Solana via x402.`,
  };
}

export default async function VaultDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const vault = await getPublicVaultBySlug(slug);
  if (!vault) notFound();

  const network: SolanaCluster =
    env.SOLANA_NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet";

  const stats = [
    { label: "Per query", value: `$${formatUsdc(vault.price_usdc)}`, caption: "USDC" },
    { label: "Chunks", value: vault.chunks_count.toString(), caption: "indexed" },
    { label: "Notes", value: vault.notes_count.toString(), caption: "markdown files" },
    { label: "Earned", value: `$${formatUsdc(vault.total_earned_usdc)}`, caption: "lifetime" },
    { label: "Settlements", value: vault.total_settlements.toString(), caption: "confirmed tx" },
    {
      label: "Updated",
      value: new Date(vault.updated_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      caption: "last edit",
    },
  ];

  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas opacity-50" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <Link
          href="/vaults"
          className="text-mono-tight text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors"
        >
          ← All vaults
        </Link>

        <div className="mt-6 grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
          <div>
            <p className="text-eyebrow">Operator vault</p>
            <h1 className="mt-6 text-display text-[clamp(36px,6vw,72px)] text-[var(--color-text)] leading-[0.95]">
              {vault.name}
            </h1>
            {vault.description && (
              <p className="mt-6 max-w-xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
                {vault.description}
              </p>
            )}

            {vault.domains.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-1.5">
                {vault.domains.map((d) => (
                  <li
                    key={d}
                    className="inline-flex items-center px-2.5 h-6 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/60 text-mono-tight text-[11px] text-[var(--color-text-muted)]"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 grid grid-cols-3 sm:grid-cols-6 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-[var(--color-bg)] px-3 py-4"
                >
                  <p className="text-mono-tight text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                    {s.label}
                  </p>
                  <p className="mt-1.5 text-mono-tight text-[15px] text-[var(--color-text)] tabular-nums">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-mono-tight text-[9px] text-[var(--color-text-faint)]">
                    {s.caption}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 p-5">
              <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                Operator
              </p>
              <a
                href={solscanAddressUrl(vault.owner_wallet, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-mono-tight text-[14px] text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
              >
                {truncateAddress(vault.owner_wallet)}
                <span className="text-[var(--color-text-faint)]">↗</span>
              </a>
              <p className="mt-3 text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                Payout address
              </p>
              <a
                href={solscanAddressUrl(vault.payout_address, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-mono-tight text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {truncateAddress(vault.payout_address)}
                <span className="text-[var(--color-text-faint)]">↗</span>
              </a>
            </div>

            <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 p-5">
              <p className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                Endpoint
              </p>
              <code className="mt-2 block text-mono-tight text-[12.5px] text-[var(--color-text)] break-all">
                POST {env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/v/{vault.slug}/query
              </code>
              <p className="mt-3 text-[12px] leading-[1.55] text-[var(--color-text-muted)]">
                Same x402 spec the protocol uses everywhere. Drop into Claude
                Desktop / Cursor / any MCP client, or hit it raw with curl + a
                signed USDC tx.
              </p>
            </div>
          </div>

          <VaultProbeWidget vault={vault} />
        </div>
      </div>
    </section>
  );
}
