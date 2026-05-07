"use client";

import { motion } from "framer-motion";
import { CodeTabs } from "../_components/CodeTabs";
import { AgentQuickstart } from "../_components/AgentQuickstart";

const STEPS = [
  {
    n: "01",
    title: "Drop the endpoint",
    body: "Paste the Brain Drain MCP URL into your agent runtime. Claude Desktop, Cursor, custom MCP clients — same wire format, no SDK lock-in.",
  },
  {
    n: "02",
    title: "Wallet auto-funds, auto-signs",
    body: "Coinbase CDP MPC handles signing. No private key in your code. The TransactionModifyingSigner pattern returns a fully signed Solana transaction your agent can attach as the X-Payment header.",
  },
  {
    n: "03",
    title: "One round trip, snippet returned",
    body: "402 quote → CDP signs → Helius confirms → top-3 snippets stream back with citations and tx hash. Auditable, idempotent, ~3.4s end-to-end.",
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
curl -i -X POST https://brain-drain-iota.vercel.app/api/query \\
  -H "content-type: application/json" \\
  -d '{ "query": "Why x402 on Solana, not Base?" }'

# 2. Sign USDC transfer with your CDP wallet, then retry:
curl -X POST https://brain-drain-iota.vercel.app/api/query \\
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
  endpoint: "https://brain-drain-iota.vercel.app/api/query",
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
        <div className="grid lg:grid-cols-[1.25fr_0.85fr] gap-12 lg:gap-16 items-start">
          <motion.div
            className="lg:order-1 order-last"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <CodeTabs tabs={CODE_TABS} />
            <AgentQuickstart />
          </motion.div>

          <div className="lg:order-2 order-first lg:pt-2">
            <p className="text-eyebrow text-[var(--color-violet)]/80">For agents</p>
            <h2 className="mt-6 text-display-md text-[var(--color-text)]">
              Drop the URL.
              <span className="block text-[var(--color-violet)]">Pay per insight.</span>
            </h2>
            <p className="text-lead mt-6 max-w-md">
              No SDK lock-in. No key handling. The MCP server speaks the same
              wire format as every other modern agent tool.
            </p>

            <ol className="mt-10 space-y-6">
              {STEPS.map((step, i) => (
                <AgentStep key={step.n} step={step} index={i} />
              ))}
            </ol>

            <p className="mt-10 text-mono-tight text-[12px] text-[var(--color-text-faint)] max-w-sm leading-[1.6]">
              Devnet endpoint live now. Mainnet config is one env flag — same
              code path. Idempotency + replay protection in KV.
            </p>
          </div>
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
