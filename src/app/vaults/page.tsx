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

interface PageProps {
  readonly searchParams: Promise<{ domain?: string }>;
}

export default async function VaultsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Default sort is "recent" — newly mounted vaults surface above older
  // ones so a fresh upload is visible without scrolling. Earnings rank
  // is still available via /api/vaults?sort=earnings for clients that
  // want it.
  const allVaults = await listPublicVaults({ limit: 60, sort: "recent" });
  const selectedDomain = params.domain?.trim() || null;

  // Surface every domain across the catalog, ranked by frequency so the
  // most popular tags lead. Ranking ties broken by alphabetic order.
  const domainCounts = new Map<string, number>();
  for (const v of allVaults) {
    for (const d of v.domains) {
      domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
    }
  }
  const domainList = Array.from(domainCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([d]) => d);

  const vaults = selectedDomain
    ? allVaults.filter((v) => v.domains.includes(selectedDomain))
    : allVaults;

  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas opacity-50" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-eyebrow">Vault directory</p>
            <h1 className="text-display mt-6 text-[clamp(36px,6vw,72px)] text-[var(--color-text)] max-w-3xl">
              {allVaults.length === 0 ? (
                <>
                  No vaults{" "}
                  <em className="not-italic font-normal text-[var(--color-accent)]">yet.</em>
                </>
              ) : selectedDomain ? (
                <>
                  {vaults.length}{" "}
                  <em className="not-italic font-normal text-[var(--color-accent)]">
                    {selectedDomain}
                  </em>{" "}
                  {vaults.length === 1 ? "vault" : "vaults"}
                </>
              ) : (
                <>
                  {allVaults.length} maintained{" "}
                  <em className="not-italic font-normal text-[var(--color-accent)]">
                    {allVaults.length === 1 ? "vault" : "vaults"}
                  </em>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
              Each vault is a markdown corpus mounted by its operator. Agents
              query, the protocol settles USDC straight to the operator&apos;s
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

        {domainList.length > 0 && (
          <DomainFilter
            domains={domainList}
            selected={selectedDomain}
            counts={domainCounts}
            totalCount={allVaults.length}
          />
        )}

        {vaults.length === 0 && allVaults.length === 0 ? (
          <EmptyState />
        ) : vaults.length === 0 ? (
          <NoMatchState domain={selectedDomain ?? ""} />
        ) : (
          <div className="mt-10 lg:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {vaults.map((v, i) => (
              <VaultCard key={v.id} vault={v} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DomainFilter({
  domains,
  selected,
  counts,
  totalCount,
}: {
  readonly domains: readonly string[];
  readonly selected: string | null;
  readonly counts: Map<string, number>;
  readonly totalCount: number;
}) {
  return (
    <nav aria-label="Filter vaults by domain" className="mt-10">
      <p className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
        Filter by domain
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        <li>
          <Chip href="/vaults" active={selected === null} count={totalCount}>
            All
          </Chip>
        </li>
        {domains.map((d) => (
          <li key={d}>
            <Chip
              href={`/vaults?domain=${encodeURIComponent(d)}`}
              active={selected === d}
              count={counts.get(d) ?? 0}
            >
              {d}
            </Chip>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Chip({
  href,
  active,
  count,
  children,
}: {
  readonly href: string;
  readonly active: boolean;
  readonly count: number;
  readonly children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-pill)] text-mono-tight text-[11px] tabular-nums transition-colors";
  const styled = active
    ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/40 text-[var(--color-accent)]"
    : "bg-[var(--color-bg)]/60 border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]";
  return (
    <Link href={href} className={`${base} ${styled}`}>
      <span>{children}</span>
      <span className="text-[var(--color-text-faint)]">{count}</span>
    </Link>
  );
}

function NoMatchState({ domain }: { readonly domain: string }) {
  return (
    <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] px-6 py-12 text-center">
      <p className="text-eyebrow">No vaults match {domain}</p>
      <p className="mt-4 text-[var(--color-text-muted)] text-sm max-w-md mx-auto leading-[1.55]">
        Try another domain — or mount the first {domain} vault yourself.
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <Link
          href="/vaults"
          className="inline-flex h-9 px-4 items-center rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/40 text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          ← Show all
        </Link>
        <Link
          href="/vaults/new"
          className="inline-flex h-9 px-4 items-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-medium hover:brightness-110 transition-all"
        >
          Mount {domain} vault →
        </Link>
      </div>
    </div>
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
