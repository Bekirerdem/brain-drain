import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createPaymentHeader, selectPaymentRequirements } from "x402/client";
import { env } from "@/lib/env";
import { cdpAccountToSvmSigner, getOrCreateBuyerAccount } from "@/lib/cdp";
import { getSellerPayouts, PayoutQuerySchema } from "@/lib/payouts";

const X402_NETWORK = "solana-devnet" as const;
const DEFAULT_X402_VERSION = 1;
const QUERY_INPUT_MAX = 1000;
const QUERY_K_MIN = 1;
const QUERY_K_MAX = 10;
const PAYOUT_LIMIT_MAX = 100;

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "brain-drain", version: "0.1.0" });

  server.registerTool(
    "brain_drain_query",
    {
      title: "Query Bekir's expert vault",
      description:
        "Pay $0.05 USDC to retrieve top-K snippets from Bekir's private notes. Settles on Solana via x402.",
      inputSchema: {
        question: z.string().min(1).max(QUERY_INPUT_MAX),
        k: z.number().int().min(QUERY_K_MIN).max(QUERY_K_MAX).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
      _meta: {
        priceUsdc: env.X402_DEFAULT_PRICE_USDC,
        currency: "USDC",
        network: X402_NETWORK,
      },
    },
    async ({ question, k }) => {
      const result = await runPaidQuery({ question, k });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    "brain_drain_payouts",
    {
      title: "Read seller's USDC income",
      description:
        "List recent USDC credits to the seller's Solana wallet (read-only, no payment).",
      inputSchema: {
        limit: z.number().int().min(1).max(PAYOUT_LIMIT_MAX).optional(),
        before: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ limit, before }) => {
      const query = PayoutQuerySchema.parse({ limit, before });
      const payouts = await getSellerPayouts(query);
      return {
        content: [{ type: "text", text: JSON.stringify(payouts, null, 2) }],
        structuredContent: { count: payouts.length, payouts },
      };
    },
  );

  return server;
}

async function runPaidQuery(input: { question: string; k?: number }) {
  const url = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/query`;
  const body = JSON.stringify({ query: input.question, k: input.k });

  const probe = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (probe.status !== 402) {
    throw new Error(`expected 402, got ${probe.status}: ${await probe.text()}`);
  }

  const challenge = (await probe.json()) as {
    x402Version?: number;
    accepts: Parameters<typeof selectPaymentRequirements>[0];
  };
  const requirements = selectPaymentRequirements(challenge.accepts, X402_NETWORK, "exact");

  const account = await getOrCreateBuyerAccount();
  const signer = cdpAccountToSvmSigner(account);
  const xPaymentHeader = await createPaymentHeader(
    signer,
    challenge.x402Version ?? DEFAULT_X402_VERSION,
    requirements,
  );

  const paid = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Payment": xPaymentHeader },
    body,
  });
  if (paid.status !== 200) {
    throw new Error(`paid request failed: ${paid.status} ${await paid.text()}`);
  }
  return paid.json();
}
