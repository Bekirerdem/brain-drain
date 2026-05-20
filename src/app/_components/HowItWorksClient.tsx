"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Agent discovers the price",
    body: (
      <>
        The MCP server exposes{" "}
        <code className="text-mono-tight text-[var(--color-text)]">brain_drain_query_vault</code>{" "}
        with price metadata in <code className="text-mono-tight text-[var(--color-text)]">_meta</code>.
        Agents confirm cost before they call — no surprise charges, no mid-flight 402s.
      </>
    ),
    artifact: {
      lang: "json",
      label: "MCP tools/list response",
      lines: [
        "{",
        '  "name": "brain_drain_query_vault",',
        '  "title": "Query a Brain Drain vault (paid)",',
        '  "_meta": {',
        '    "priceVaries": true,',
        '    "currency": "USDC",',
        '    "network": "solana-devnet"',
        "  }",
        "}",
      ],
    },
  },
  {
    n: "02",
    title: "Server replies 402 Payment Required",
    body: (
      <>
        Full x402 spec via <code className="text-mono-tight text-[var(--color-text)]">x402-next</code>.
        Status code, <code className="text-mono-tight text-[var(--color-text)]">WWW-Authenticate</code>{" "}
        header, payment requirements — no custom protocol, no shortcuts. Audit-ready boundaries
        with Zod-validated inputs.
      </>
    ),
    artifact: {
      lang: "http",
      label: "HTTP 402 response",
      lines: [
        "HTTP/1.1 402 Payment Required",
        "WWW-Authenticate: x402",
        "Content-Type: application/json",
        "",
        "{",
        '  "amount": "__PRICE__",',
        '  "network": "solana-devnet",',
        '  "recipient": "2SUm7fDR…PAYMPb3L"',
        "}",
      ],
    },
  },
  {
    n: "03",
    title: "CDP signs, Solana settles",
    body: (
      <>
        Coinbase CDP signs through MPC threshold — private keys never leave the vault.
        The SPL transfer hits Helius RPC at{" "}
        <code className="text-mono-tight text-[var(--color-text)]">confirmed</code> finality.
        IPv4-first DNS hook keeps the round-trip tight.
      </>
    ),
    artifact: {
      lang: "log",
      label: "Buyer terminal — settlement",
      lines: [
        "[buyer] target: /api/v/bekir-erdem/query",
        "[buyer] probe: 402 · price=__PRICE__ USDC",
        "[buyer] signer: TransactionModifyingSigner (MPC)",
        "[buyer] X-Payment header attached",
        "✓ confirmed · 412ms · 48YttoTNkdBz…ze6Q3aL",
      ],
    },
  },
  {
    n: "04",
    title: "Snippets stream back",
    body: (
      <>
        Cosine similarity over the vault&apos;s embedded chunks returns the top-K most
        relevant passages with citations. Payment proof returned alongside — fully
        auditable. Single round trip, ~3.4 s end-to-end.
      </>
    ),
    artifact: {
      lang: "json",
      label: "200 OK response (truncated)",
      lines: [
        "{",
        '  "results": [',
        '    { "source": "x402-on-solana-primer", "score": 0.812 },',
        '    { "source": "anchor-free-solana-pattern", "score": 0.766 },',
        '    { "source": "helius-rpc-low-latency-patterns", "score": 0.704 }',
        "  ],",
        '  "payment": {',
        '    "signature": "48Ytto…ze6Q3aL",',
        '    "amountUsdc": __PRICE__',
        "  }",
        "}",
      ],
    },
  },
] as const;

type StepData = (typeof STEPS)[number];

export function HowItWorksClient({ price }: { price: string }) {
  const containerRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 60%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <ol ref={containerRef} className="mt-16 lg:mt-20 relative">
      <span
        className="absolute left-[19px] sm:left-[27px] top-2 bottom-2 w-px bg-[var(--color-border-strong)]/40"
        aria-hidden="true"
      />
      <motion.span
        className="absolute left-[19px] sm:left-[27px] top-2 w-px bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-accent)]/0"
        style={{ height: reduced ? "100%" : lineHeight }}
        aria-hidden="true"
      />
      {STEPS.map((step, i) => (
        <Step key={step.n} step={step} index={i} price={price} />
      ))}
    </ol>
  );
}

function Step({
  step,
  index,
  price,
}: {
  step: StepData;
  index: number;
  price: string;
}) {
  return (
    <motion.li
      className="relative pl-12 sm:pl-16 pb-16 last:pb-0"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
      }}
    >
      <StepNumber n={step.n} />
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-start font-mono">
        <div>
          <h3 className="text-xl md:text-2xl font-black uppercase text-[var(--color-text)]">
            {step.title}
          </h3>
          <p className="mt-4 text-[var(--color-text-muted)] text-xs lg:text-sm leading-relaxed max-w-[460px] pl-3 border-l border-border-strong">
            {step.body}
          </p>
        </div>
        <ArtifactCard artifact={step.artifact} price={price} />
      </div>
    </motion.li>
  );
}

function StepNumber({ n }: { n: string }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 inline-flex items-center justify-center size-10 sm:size-14 rounded-none bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)]"
    >
      <span className="text-mono-tight text-[11px] sm:text-[13px] tracking-[0.05em] text-[var(--color-accent)] font-mono font-bold">
        [{n}]
      </span>
    </span>
  );
}

function ArtifactCard({
  artifact,
  price,
}: {
  artifact: StepData["artifact"];
  price: string;
}) {
  return (
    <figure className="rounded-none border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/80 backdrop-blur-sm overflow-hidden font-mono">
      <figcaption className="flex items-center justify-between px-4 lg:px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/40">
        <span className="text-[10px] text-text-faint uppercase tracking-wider">[{artifact.label}]</span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
          {artifact.lang}
        </span>
      </figcaption>
      <pre className="px-4 lg:px-5 py-4 overflow-x-auto text-mono-tight text-[12.5px] leading-[1.65] text-[var(--color-text-muted)]">
        <code>
          {artifact.lines.map((line, i) => (
            <span key={i} className="block">
              {line.replace(/__PRICE__/g, price) || " "}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
