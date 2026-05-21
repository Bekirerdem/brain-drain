"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BuiltOn } from "./BuiltOn";

export function ClosingHero() {
  return (
    <section
      id="closing"
      className="bg-transparent relative overflow-hidden border-t border-border"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-16 pb-16 md:pt-20 md:pb-24">
        
        {/* Layout Grid */}
        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-12 lg:gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.25 }}
            className="font-mono"
          >
            {/* Eyebrow */}
            <div className="text-[10px] font-mono tracking-widest text-text-muted uppercase font-bold">
              [ Protocol · live ]
            </div>

            {/* Headline */}
            <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-mono tracking-tight font-black uppercase text-text leading-[0.95]">
              Mount once. <br />
              <span className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 mt-2 inline-block border border-[var(--color-accent)]/20">
                Get paid forever.
              </span>
            </h2>

            {/* Paragraph */}
            <p className="mt-6 max-w-xl text-text-muted text-sm leading-relaxed pl-4 border-l border-border-strong">
              The rail is on Solana devnet. 7 vaults indexed, 72
              settlements on-chain, real USDC moving from agent
              wallets to operator wallets. Add yours, or send your
              agent — both flows take one click each.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/vaults/new"
                className="bg-[var(--color-accent)] text-[var(--color-bg)] font-mono font-bold text-xs uppercase px-5 h-11 inline-flex items-center justify-center border border-[var(--color-accent)] hover:bg-bg hover:text-[var(--color-accent)] transition-colors duration-100"
              >
                [ Mount Vault ]
              </Link>
              <Link
                href="/vaults"
                className="bg-bg border border-border-strong text-text font-mono font-bold text-xs uppercase px-5 h-11 inline-flex items-center justify-center hover:border-[var(--color-accent)]/50 transition-colors duration-100"
              >
                [ Browse Vaults ]
              </Link>
              <a
                href="https://github.com/Bekirerdem/brain-drain"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex h-11 px-3 items-center text-xs text-text-muted hover:text-[var(--color-accent)] transition-colors font-bold"
              >
                Read Source ↗
              </a>
            </div>
          </motion.div>

          <ClosingGlyph />
        </div>
      </div>

      <div className="relative z-10">
        <BuiltOn />
      </div>
    </section>
  );
}

function ClosingGlyph() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.25 }}
      className="relative aspect-square w-full max-w-[340px] mx-auto lg:mx-0 flex items-center justify-center"
    >
      {/* Concentric orbit rings */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="var(--color-border-strong)"
          strokeWidth="0.6"
        />
        <circle
          cx="100"
          cy="100"
          r="68"
          stroke="var(--color-accent)"
          strokeOpacity="0.45"
          strokeWidth="0.9"
          strokeDasharray="2 6"
        />
      </svg>

      <Image
        src="/bd-mark.png"
        alt=""
        width={2986}
        height={1408}
        className="relative w-[85%] h-auto"
        style={{ filter: "invert(var(--logo-invert))" }}
      />
    </motion.div>
  );
}
