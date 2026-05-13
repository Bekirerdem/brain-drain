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
    <footer className="relative border-t border-[var(--color-border)] mt-32 overflow-hidden">
      {/*
       * Symmetric wave accents — futuristic.jpg rendered twice: once
       * left-anchored, once right-anchored with scaleX(-1) so the two
       * waves converge at the footer's vertical centerline. Each
       * container is locked to the image's native 736×490 aspect so
       * the wave never crops. mix-blend-mode: screen hides the
       * image's black backdrop. Hidden below lg to keep mobile clean.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute z-[1] left-0 top-1/2 -translate-y-1/2 w-[50%]"
        style={{
          aspectRatio: "736 / 490",
          backgroundImage: "url('/bg/wave-strip.jpg')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          opacity: 0.45,
          filter: "saturate(0.8) brightness(1.05) hue-rotate(-15deg)",
          mixBlendMode: "screen",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute z-[1] right-0 top-1/2 w-[50%]"
        style={{
          aspectRatio: "736 / 490",
          backgroundImage: "url('/bg/wave-strip.jpg')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          opacity: 0.45,
          filter: "saturate(0.8) brightness(1.05) hue-rotate(-15deg)",
          mixBlendMode: "screen",
          transform: "translateY(-50%) scaleX(-1)",
        }}
      />

      {/*
       * Giant brand watermark — solana.com / avax.network pattern.
       * Sits behind the column content, runs full-width, clipped at the
       * bottom edge. Audiowide via text-brand, opacity dialed to ~5-7%
       * so the wordmark reads as a horizon line instead of competing
       * with the actual nav. Pointer-events-none so it never steals
       * clicks; aria-hidden because screen readers already see the
       * brand in the lockup above.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-0 overflow-hidden"
      >
        <span className="block whitespace-nowrap text-brand uppercase tracking-[-0.03em] text-[clamp(56px,11vw,180px)] leading-[0.82] text-[var(--color-text)] opacity-[0.13] translate-y-[0.16em] text-center">
          Brain&nbsp;Drain<span className="text-[var(--color-accent)] opacity-90">.</span>
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10 py-16 lg:py-20">
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
              <span className="text-brand text-[22px] sm:text-[26px] uppercase tracking-[0.04em] leading-none">
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
            © 2026 Brain Drain · MIT licensed · open source on{" "}
            <a
              href="https://github.com/Bekirerdem/brain-drain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              GitHub
            </a>
          </p>
          <p className="text-mono-tight text-[11px] text-[var(--color-text-faint)]">
            The protocol AI agents pay vault operators through ·
            Solana devnet
          </p>
        </div>
      </div>
    </footer>
  );
}
