import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from "@/lib/env";
import { getOrCreateBuyerAccount } from "@/lib/cdp";
import { getSellerPayouts, PayoutQuerySchema } from "@/lib/payouts";
import { embedText, getIndex, retrieveTopK } from "@/lib/rag";
import { usdcToAtomic } from "@/lib/solana";

const X402_NETWORK = "solana-devnet" as const;
const QUERY_INPUT_MAX = 1000;
const QUERY_K_MIN = 1;
const QUERY_K_MAX = 10;
const QUERY_K_DEFAULT = 3;
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
  const buyer = await timed("buyer", () => getOrCreateBuyerAccount());
  const transfer = await timed("transfer", () =>
    buyer.transfer({
      to: env.SELLER_SOLANA_ADDRESS,
      token: "usdc",
      amount: usdcToAtomic(env.X402_DEFAULT_PRICE_USDC),
      network: "devnet",
    }),
  );

  const queryVector = await timed("embed", () => embedText(input.question));
  const index = await timed("index", () => getIndex());
  const results = retrieveTopK(queryVector, index.entries, {
    k: input.k ?? QUERY_K_DEFAULT,
  });

  return {
    query: input.question,
    results: results.map((r) => ({
      id: r.chunk.id,
      source: r.chunk.source,
      heading: r.chunk.heading,
      content: r.chunk.content,
      score: r.score,
    })),
    payment: {
      signature: transfer.signature,
      amountUsdc: env.X402_DEFAULT_PRICE_USDC,
      network: X402_NETWORK,
      payer: buyer.address,
    },
  };
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  console.log(`[mcp.query] ${label} ${Math.round(performance.now() - start)}ms`);
  return result;
}
