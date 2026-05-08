/**
 * brain_drain_query_vault — paid vault-aware RAG query.
 *
 * Resolves a public vault by slug, transfers the vault's USDC price to the
 * vault's own payout_address via the buyer's CDP wallet, then returns
 * top-K snippets from that vault's index. Brain Drain itself never
 * custodies the USDC — every vault is its own settlement target.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { embedText, retrieveTopK } from "@/lib/rag";
import { getOrCreateBuyerAccount } from "@/lib/cdp";
import { getPublicVaultBySlug, getVaultIndex } from "@/lib/vaults";
import { usdcToAtomic } from "@/lib/solana";
import { env } from "@/lib/env";

const QUERY_INPUT_MAX = 1000;
const QUERY_K_MIN = 1;
const QUERY_K_MAX = 10;
const QUERY_K_DEFAULT = 3;

// CDP SDK Solana transfer expects "devnet"/"mainnet"; x402 protocol uses
// "solana-devnet"/"solana". They speak different network strings.
const CDP_NETWORK = "devnet" as const;
const X402_NETWORK =
  env.SOLANA_NETWORK === "mainnet-beta" ? "solana" : "solana-devnet";

const InputSchema = {
  slug: z.string().min(1).max(64),
  question: z.string().min(1).max(QUERY_INPUT_MAX),
  k: z.number().int().min(QUERY_K_MIN).max(QUERY_K_MAX).optional(),
};

export function registerQueryVault(server: McpServer): void {
  server.registerTool(
    "brain_drain_query_vault",
    {
      title: "Query a Brain Drain vault (paid)",
      description:
        "Pay USDC on Solana to retrieve top-K snippets from a specific vault. Each vault has its own price (price_usdc) and payout address — settlement goes directly to the vault owner via x402. Discover vaults via brain_drain_list_vaults first.",
      inputSchema: InputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false },
      _meta: {
        currency: "USDC",
        priceVaries: true,
        network: X402_NETWORK,
      },
    },
    async ({ slug, question, k }) => {
      const vault = await getPublicVaultBySlug(slug);
      if (!vault) {
        const error = { error: `vault "${slug}" not found or not public` };
        return {
          content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
          structuredContent: error,
          isError: true,
        };
      }

      const buyer = await timed("buyer", () => getOrCreateBuyerAccount());
      const transfer = await timed("transfer", () =>
        buyer.transfer({
          to: vault.payout_address,
          token: "usdc",
          amount: usdcToAtomic(Number(vault.price_usdc)),
          network: CDP_NETWORK,
        }),
      );

      const queryVector = await timed("embed", () => embedText(question));
      const index = await timed("index", () => getVaultIndex(vault.slug));
      const results = retrieveTopK(queryVector, index.entries, {
        k: k ?? QUERY_K_DEFAULT,
      });

      const result = {
        vault: {
          slug: vault.slug,
          name: vault.name,
          owner_wallet: vault.owner_wallet,
          payout_address: vault.payout_address,
        },
        query: question,
        results: results.map((r) => ({
          id: r.chunk.id,
          source: r.chunk.source,
          heading: r.chunk.heading,
          content: r.chunk.content,
          score: r.score,
        })),
        payment: {
          signature: transfer.signature,
          amountUsdc: Number(vault.price_usdc),
          network: X402_NETWORK,
          payer: buyer.address,
          recipient: vault.payout_address,
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    },
  );
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  console.log(`[mcp.query_vault] ${label} ${Math.round(performance.now() - start)}ms`);
  return result;
}
