"use client";

import { motion } from "framer-motion";
import { CodeTabs } from "../_components/CodeTabs";

const STEPS = [
  {
    n: "01",
    title: "Paste the endpoint",
    body: "One line in claude_desktop_config.json (or your Cursor settings, or any MCP client). Same wire format everywhere — no SDK to vendor, no key to manage.",
  },
  {
    n: "02",
    title: "CDP wallet signs",
    body: "Coinbase CDP MPC auto-funds and auto-signs the USDC SPL transfer. No private key in your code. TransactionModifyingSigner pattern — sign + retry in one round trip.",
  },
  {
    n: "03",
    title: "Snippets + on-chain proof",
    body: "402 quote → CDP signs → Helius confirms → top-K cited snippets + tx signature stream back. ~3.4s end-to-end, idempotent on signature.",
  },
] as const;

const CODE_TABS = [
  {
    id: "mcp",
    label: "MCP config",
    language: "json · claude_desktop_config.json",
    code: `{
  "mcpServers": {
    "Brain Drain": {
      "transport": "http",
      "url": "https://brain-drain-iota.vercel.app/api/mcp"
    }
  }
}`,
  },
  {
    id: "curl",
    label: "Raw HTTP",
    language: "bash · paid query",
    code: `# 1. Probe — receive 402 with payment requirements
curl -i -X POST https://brain-drain-iota.vercel.app/api/v/bekir-erdem/query \\
  -H "content-type: application/json" \\
  -d '{ "query": "Why x402 on Solana, not Base?" }'

# 2. Sign USDC transfer with your CDP wallet, then retry:
curl -X POST https://brain-drain-iota.vercel.app/api/v/bekir-erdem/query \\
  -H "content-type: application/json" \\
  -H "X-Payment: <base64-signed-tx>" \\
  -d '{ "query": "Why x402 on Solana, not Base?" }'`,
  },
  {
    id: "ts",
    label: "TypeScript",
    language: "ts · @ai-sdk client",
    code: `import { createX402Client } from "x402-axios";
import { cdpAccountToSvmSigner } from "@/lib/cdp";

const buyer = await getOrCreateBuyerAccount();
const client = createX402Client({
  endpoint: "https://brain-drain-iota.vercel.app/api/v/bekir-erdem/query",
  signer: cdpAccountToSvmSigner(buyer),
  maxPriceUsdc: 0.25,
});

const { results, payment } = await client.query({
  query: "Top-k snippets on Helius RPC patterns?"
});`,
  },
] as const;

export function ForAgents() {
  return (
    <section
      id="for-agents"
      className="bg-aurora bg-grain relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="bg-aurora-canvas opacity-30" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-28 lg:pt-32 lg:pb-36">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-eyebrow">For agent buyers</p>
            <h2 className="mt-6 text-display text-[clamp(36px,5.5vw,68px)] text-[var(--color-text)]">
              Stop hallucinating.{" "}
              <em className="not-italic font-normal text-[var(--color-accent)]">
                Cite real experts.
              </em>
            </h2>
            <p className="mt-6 max-w-lg text-[var(--color-text-muted)] text-lg leading-[1.55]">
              Drop the MCP endpoint into{" "}
              <span className="text-mono-tight text-[var(--color-text)]">
                Claude Desktop, Cursor, Cline, Continue.dev, OpenCode
              </span>
              , or any custom agent. CDP MPC signs every settlement — no
              SDK lock-in, no key handling. Pay only what your agent cites.
            </p>

            <ol className="mt-12 space-y-7">
              {STEPS.map((step, i) => (
                <AgentStep key={step.n} step={step} index={i} />
              ))}
            </ol>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <CodeTabs tabs={CODE_TABS} />
            <p className="mt-4 text-mono-tight text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-faint)] text-right">
              endpoint live · /api/mcp
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AgentStep({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  return (
    <motion.li
      className="flex gap-5"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 28,
        delay: index * 0.08,
      }}
    >
      <span className="shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)]">
        <span className="text-mono-tight text-[11px] tracking-[0.04em] text-[var(--color-violet)]">
          {step.n}
        </span>
      </span>
      <div>
        <h3 className="text-[17px] font-medium text-[var(--color-text)]">
          {step.title}
        </h3>
        <p className="mt-2 text-[14px] leading-[1.65] text-[var(--color-text-muted)] max-w-md">
          {step.body}
        </p>
      </div>
    </motion.li>
  );
}
