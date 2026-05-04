import Link from "next/link";

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/Bekirerdem/brain-drain" },
  { label: "X", href: "https://x.com/l3ekirerdem" },
  { label: "Telegram", href: "https://t.me/Bekirerdem" },
] as const;

const ECOSYSTEM_LINKS = [
  { label: "Solana", href: "https://solana.com" },
  { label: "Coinbase CDP", href: "https://portal.cdp.coinbase.com" },
  { label: "Phantom", href: "https://phantom.app" },
  { label: "Helius", href: "https://helius.dev" },
  { label: "x402", href: "https://x402.org" },
] as const;

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-border)] mt-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-baseline gap-2">
              <span className="text-display text-[18px] tracking-[-0.02em]">
                Brain Drain<span className="text-[var(--color-accent)]">.</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-[13px] leading-[1.6] text-[var(--color-text-muted)]">
              An editorial vault where AI agents settle{" "}
              <span className="text-mono-tight text-[var(--color-text)]">0.05 USDC</span>{" "}
              per snippet on Solana via x402. Open source. Audit-ready.
            </p>
            <p className="mt-6 text-mono-tight text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
              Made by Bekir Erdem · Bursa · in 11 days
            </p>
          </div>

          <div>
            <p className="text-eyebrow">Ecosystem</p>
            <ul className="mt-4 space-y-2.5">
              {ECOSYSTEM_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-eyebrow">Connect</p>
            <ul className="mt-4 space-y-2.5">
              {SOCIAL_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/dashboard"
                  className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider-hairline mt-14" />

        <div className="mt-8 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-mono-tight text-[11px] text-[var(--color-text-faint)]">
            © 2026 Brain Drain. All rights reserved.
          </p>
          <p className="text-mono-tight text-[11px] text-[var(--color-text-faint)]">
            Built for{" "}
            <a
              href="https://colosseum.com/frontier"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Colosseum Frontier 2026
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
