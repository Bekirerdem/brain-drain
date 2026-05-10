import Image from "next/image";
import Link from "next/link";

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/Bekirerdem/brain-drain" },
  { label: "X / Twitter", href: "https://x.com/l3ekirerdem" },
  { label: "Telegram", href: "https://t.me/Bekirerdem" },
] as const;

const PROTOCOL_LINKS = [
  { label: "Browse vaults", href: "/vaults" },
  { label: "Mount your vault", href: "/vaults/new" },
  { label: "Live settlements", href: "/#live" },
  { label: "How it works", href: "/#how-it-works" },
] as const;

const ECOSYSTEM_LINKS = [
  { label: "Solana", href: "https://solana.com" },
  { label: "Coinbase CDP", href: "https://portal.cdp.coinbase.com" },
  { label: "Phantom", href: "https://phantom.app" },
  { label: "Helius", href: "https://helius.dev" },
  { label: "x402", href: "https://x402.org" },
  { label: "MCP", href: "https://modelcontextprotocol.io" },
] as const;

const BOUNTIES = [
  "x402 Integration",
  "Multi-Protocol Agent Hub",
  "CDP Embedded Wallets",
];

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-border)] mt-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/bd-mark.png"
                alt=""
                width={2986}
                height={1408}
                className="h-20 w-auto"
                style={{ filter: "invert(var(--logo-invert))" }}
              />
              <span className="text-brand text-[17px] uppercase tracking-[0.04em]">
                Brain Drain<span className="text-[var(--color-accent)]">.</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[13px] leading-[1.6] text-[var(--color-text-muted)]">
              AI agents finally pay the experts they cite. Mount a decision
              log on Solana, set your price, earn USDC straight to your
              wallet — Brain Drain never custodies the funds.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                Built for
              </span>
              <a
                href="https://www.colosseum.com/frontier"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono-tight text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Colosseum Frontier 2026
              </a>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {BOUNTIES.map((b) => (
                <li
                  key={b}
                  className="inline-flex items-center px-2 h-5 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/60 text-mono-tight text-[10px] text-[var(--color-text-muted)]"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-eyebrow">Protocol</p>
            <ul className="mt-4 space-y-2.5">
              {PROTOCOL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
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
            </ul>
          </div>
        </div>

        <div className="divider-hairline mt-14" />

        <div className="mt-8 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-mono-tight text-[11px] text-[var(--color-text-faint)]">
            © 2026 Brain Drain · Made by{" "}
            <a
              href="https://x.com/l3ekirerdem"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Bekir Erdem
            </a>
            {" "}in Bursa · MIT licensed
          </p>
          <p className="text-mono-tight text-[11px] text-[var(--color-text-faint)]">
            Live on Solana devnet · mainnet path is one env flag
          </p>
        </div>
      </div>
    </footer>
  );
}
