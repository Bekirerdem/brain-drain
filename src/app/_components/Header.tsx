import Link from "next/link";

const NAV_ITEMS = [
  { label: "Vault", href: "/#vault" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Protocol", href: "/#how-it-works" },
] as const;

const GITHUB_URL = "https://github.com/Bekirerdem/brain-drain";

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[rgba(10,10,10,0.72)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-2 group select-none"
          aria-label="Brain Drain home"
        >
          <span className="text-display text-[16px] tracking-[-0.02em]">
            Brain Drain<span className="text-[var(--color-accent)]">.</span>
          </span>
          <span className="hidden sm:inline text-mono-tight text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] group-hover:text-[var(--color-text-muted)] transition-colors">
            vault for agents
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 h-8 inline-flex items-center text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-8 px-3 items-center text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="#claude-desktop"
            className="inline-flex h-9 px-4 items-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-medium hover:brightness-110 hover:shadow-[0_0_24px_-6px_var(--color-accent)] transition-all duration-200"
          >
            Connect
          </a>
        </div>
      </div>
    </header>
  );
}
