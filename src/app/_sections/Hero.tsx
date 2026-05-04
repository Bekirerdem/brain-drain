import Link from "next/link";

const HERO_STATS = [
  { label: "Settlement", value: "~400ms", caption: "Solana devnet" },
  { label: "Per snippet", value: "0.05 USDC", caption: "x402 protocol" },
  { label: "Vault chunks", value: "152", caption: "25 expert notes" },
  { label: "Open source", value: "MIT", caption: "audit-ready" },
] as const;

export function Hero() {
  return (
    <section className="bg-aurora bg-grain relative overflow-hidden">
      <div className="bg-aurora-canvas" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 pb-28 lg:pt-28 lg:pb-40">
        <div className="max-w-4xl">
          <LiveIndicator />
          <h1 className="text-display mt-8 text-[clamp(44px,8vw,112px)] text-[var(--color-text)]">
            AI agents are paying me{" "}
            <br className="hidden md:block" aria-hidden="true" />
            <em className="not-italic font-normal text-[var(--color-accent)]">
              for what I know.
            </em>
          </h1>
          <p className="mt-8 max-w-2xl text-[var(--color-text-muted)] text-lg lg:text-xl leading-[1.55]">
            An editorial vault where AI agents settle{" "}
            <span className="text-mono-tight text-[var(--color-text)]">0.05 USDC</span>{" "}
            per snippet on Solana via x402. Open source. Audit-ready.{" "}
            <span className="text-mono-tight text-[var(--color-text)]">~400ms</span>{" "}
            settlement.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#claude-desktop"
              className="group inline-flex h-11 px-6 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[14px] font-medium hover:brightness-110 hover:shadow-[0_0_36px_-6px_var(--color-accent)] transition-all duration-200"
            >
              Add to Claude Desktop
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/dashboard"
              className="group inline-flex h-11 px-5 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)]/40 backdrop-blur text-[14px] text-[var(--color-text)] hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-emphasis)] transition-all duration-200"
            >
              View dashboard
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="mt-24 lg:mt-32 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
          {HERO_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--color-bg)] px-5 py-6 lg:px-6 lg:py-7"
            >
              <p className="text-eyebrow">{stat.label}</p>
              <p className="text-display text-[clamp(22px,3vw,32px)] mt-3 text-[var(--color-text)]">
                {stat.value}
              </p>
              <p className="text-mono-tight text-[11px] mt-1 text-[var(--color-text-faint)]">
                {stat.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveIndicator() {
  return (
    <div className="inline-flex items-center gap-2.5 px-3 h-7 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur-sm">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-60 animate-ping" />
        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-accent)]" />
      </span>
      <span className="text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
        Live on Solana devnet
      </span>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 6h6m0 0L6 3m3 3L6 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
