"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";

const NAV_ITEMS = [
  { label: "Vaults", href: "/vaults" },
  { label: "Live", href: "/#live" },
  { label: "Protocol", href: "/#how-it-works" },
] as const;

const GITHUB_URL = "https://github.com/Bekirerdem/brain-drain";
const SCROLL_THRESHOLD = 24;

export function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > SCROLL_THRESHOLD;
    if (next !== scrolled) setScrolled(next);
  });

  const shellClass = scrolled
    ? "bg-[rgba(10,10,10,0.78)] backdrop-blur-xl border-b border-[var(--color-border)]"
    : "bg-[rgba(10,10,10,0.32)] backdrop-blur-md border-b border-transparent";

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-200 ${shellClass}`}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group select-none"
          aria-label="Brain Drain home"
        >
          <Image
            src="/BD-logo.png"
            alt=""
            width={2986}
            height={1408}
            priority
            // Background is now properly transparent (the prior
            // export shipped a baked-in light-gray fill that was
            // stripped via LockBits). No clip wrapper needed —
            // the wide horizontal margins on the canvas are now
            // genuinely empty. Invert keeps the black strokes
            // legible on the dark theme.
            className="h-12 w-auto invert"
          />
          <span className="text-brand text-[15px] uppercase tracking-[0.04em]">
            Brain Drain<span className="text-[var(--color-accent)]">.</span>
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
          <Link
            href="/vaults/new"
            className="inline-flex h-9 px-4 items-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-medium hover:brightness-110 hover:shadow-[0_0_24px_-6px_var(--color-accent)] transition-all duration-200"
          >
            Mount vault
          </Link>
        </div>
      </div>
    </header>
  );
}
