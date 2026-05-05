/* ─────────────────────────────────────────────────────────
 * BUILT ON — continuous marquee of ecosystem partners
 *
 * Pure CSS animation (marquee-scroll keyframe in globals.css).
 * Items duplicated for seamless loop. Pauses on hover.
 * ───────────────────────────────────────────────────────── */

const STACK = [
  { name: "Solana", role: "settlement" },
  { name: "Helius", role: "rpc" },
  { name: "Coinbase CDP", role: "buyer wallet" },
  { name: "Phantom Cash", role: "seller payout" },
  { name: "x402", role: "payment protocol" },
  { name: "MCP", role: "agent surface" },
  { name: "Gemini 3.1 Pro", role: "embeddings + reasoning" },
  { name: "Next.js 16", role: "framework" },
  { name: "Vercel", role: "deployment" },
] as const;

export function BuiltOn() {
  return (
    <section
      aria-label="Built on"
      className="relative border-y border-[var(--color-border)] bg-[var(--color-bg)]/60 backdrop-blur-sm overflow-hidden"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center">
        <p className="text-eyebrow whitespace-nowrap">Built on</p>
        <Marquee />
      </div>
    </section>
  );
}

function Marquee() {
  // Render twice for seamless wrap-around.
  const items = [...STACK, ...STACK];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]">
      <div className="flex items-center gap-10 lg:gap-14 w-max animate-[marquee-scroll_38s_linear_infinite] hover:[animation-play-state:paused]">
        {items.map((item, i) => (
          <Pill key={`${item.name}-${i}`} name={item.name} role={item.role} />
        ))}
      </div>
    </div>
  );
}

function Pill({ name, role }: { name: string; role: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-display text-[15px] tracking-[-0.01em] text-[var(--color-text)]">
        {name}
      </span>
      <span className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
        {role}
      </span>
    </span>
  );
}
