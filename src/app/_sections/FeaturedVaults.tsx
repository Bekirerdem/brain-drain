/* ─────────────────────────────────────────────────────────
 * FEATURED VAULTS — surfaces the multi-vault reality on the home page.
 *
 * Without this section, a juror could read the landing as a
 * single-seller marketplace ("Bekir's stuff for sale"). Pulling the
 * top three earners from the same listPublicVaults() that powers the
 * /vaults catalog makes the multi-vault structure visible in five
 * seconds. Reuses the existing VaultCard so no new design tokens land.
 * ───────────────────────────────────────────────────────── */

import Link from "next/link";
import { listPublicVaults } from "@/lib/vaults";
import { VaultCard } from "../_components/VaultCard";

const FEATURED_COUNT = 3;

export async function FeaturedVaults() {
  let vaults;
  try {
    vaults = await listPublicVaults({ limit: FEATURED_COUNT, sort: "earnings" });
  } catch {
    return null;
  }
  if (vaults.length === 0) return null;

  return (
    <section
      id="vaults"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-24 lg:pt-28 lg:pb-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-eyebrow">Featured vaults</p>
            <h2 className="text-display mt-6 text-[clamp(36px,5.5vw,68px)] text-[var(--color-text)] max-w-3xl leading-[1.02]">
              Live on the protocol{" "}
              <em className="not-italic font-normal text-[var(--color-accent)]">
                right now.
              </em>
            </h2>
            <p className="mt-6 max-w-xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
              Public vaults agents can hit today. Each one sets its own price
              and routes USDC straight to its operator&apos;s Solana wallet —
              Brain Drain never touches the funds.
            </p>
          </div>
          <Link
            href="/vaults"
            className="inline-flex h-11 px-5 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)]/40 backdrop-blur text-[14px] text-[var(--color-text)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-emphasis)] transition-colors"
          >
            Browse all vaults →
          </Link>
        </div>

        <div className="mt-12 lg:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((v, i) => (
            <VaultCard key={v.id} vault={v} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
