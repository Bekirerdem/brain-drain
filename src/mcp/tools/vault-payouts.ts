/**
 * brain_drain_vault_payouts — vault-scoped USDC settlement history.
 *
 * Free, read-only. Lets agents verify a vault's earnings track record
 * and freshness before paying brain_drain_query_vault.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSellerPayouts, PayoutQuerySchema } from "@/lib/payouts";
import { getPublicVaultBySlug } from "@/lib/vaults";

const PAYOUT_LIMIT_MAX = 100;

const InputSchema = {
  slug: z.string().min(1).max(64),
  limit: z.number().int().min(1).max(PAYOUT_LIMIT_MAX).optional(),
  before: z.string().optional(),
};

export function registerVaultPayouts(server: McpServer): void {
  server.registerTool(
    "brain_drain_vault_payouts",
    {
      title: "Read a vault's USDC settlement history",
      description:
        "List recent USDC payouts to a specific vault's payout_address on Solana. Free and read-only — useful for verifying earnings, freshness, and settlement rate before paying for a query.",
      inputSchema: InputSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ slug, limit, before }) => {
      const vault = await getPublicVaultBySlug(slug);
      if (!vault) {
        const error = { error: `vault "${slug}" not found or not public` };
        return {
          content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
          structuredContent: error,
          isError: true,
        };
      }
      const query = PayoutQuerySchema.parse({ limit, before });
      const payouts = await getSellerPayouts(
        vault.payout_address,
        query,
        vault.slug,
      );
      const result = {
        vault_slug: vault.slug,
        recipient: vault.payout_address,
        count: payouts.length,
        payouts,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    },
  );
}
