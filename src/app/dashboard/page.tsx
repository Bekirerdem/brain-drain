import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Live earnings, payout activity, and vault analytics for Brain Drain.",
};

export default function DashboardPage() {
  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas opacity-50" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 pb-28 lg:pt-28">
        <p className="text-eyebrow">Dashboard · coming next phase</p>
        <h1 className="text-display mt-6 text-[clamp(40px,7vw,80px)]">
          Live earnings, <em className="not-italic font-normal text-[var(--color-accent)]">streamed</em>.
        </h1>
        <p className="mt-6 max-w-xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          Total earned, payout history, top topics, and agent retention — all
          driven by real on-chain data from{" "}
          <span className="text-mono-tight text-[var(--color-text)]">/api/payouts</span>.
        </p>
      </div>
    </section>
  );
}
