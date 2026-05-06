import type { Metadata } from "next";
import { OperatorDashboard } from "../_components/OperatorDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Operator dashboard",
  description:
    "Connect Phantom to view your Brain Drain vaults — chunks indexed, USDC earned per vault, settlement count, fast links to vault detail and re-mount.",
};

export default function DashboardPage() {
  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas opacity-50" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 pb-32 lg:pt-28 lg:pb-40">
        <p className="text-eyebrow">Operator dashboard</p>
        <h1 className="text-display mt-6 text-[clamp(36px,6vw,72px)] text-[var(--color-text)] max-w-3xl">
          Your vaults,{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            in one place.
          </em>
        </h1>
        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          Connect the wallet you mounted vaults with. You&apos;ll see chunks
          indexed, USDC earned, settlement counts, and a one-click jump to
          each vault&apos;s public detail page. No other operator&apos;s
          private data — everything is wallet-scoped.
        </p>

        <OperatorDashboard />
      </div>
    </section>
  );
}
