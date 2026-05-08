/**
 * brain_drain_submit_feedback — register a vault's usefulness signal.
 *
 * Free, idempotent (UNIQUE(signature) at the DB level). Agents call this
 * after a paid brain_drain_query_vault to vote on whether the returned
 * snippets actually moved them forward. Aggregates feed back into
 * list_vaults via useful_count + useful_rate, closing the discovery loop.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  FeedbackBodySchema,
  getPublicVaultBySlug,
  submitVaultFeedback,
} from "@/lib/vaults";

const InputSchema = {
  slug: z.string().min(1).max(64),
  signature: FeedbackBodySchema.shape.signature,
  useful: FeedbackBodySchema.shape.useful,
};

export function registerSubmitFeedback(server: McpServer): void {
  server.registerTool(
    "brain_drain_submit_feedback",
    {
      title: "Submit feedback for a paid query",
      description:
        "Free, idempotent. Submit a usefulness signal for a vault after a paid brain_drain_query_vault call. `signature` is the on-chain settlement signature returned by that call; passing the same signature twice is a no-op (DB UNIQUE constraint). The aggregate useful_rate appears in brain_drain_list_vaults so future agents can prioritize trusted vaults.",
      inputSchema: InputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ slug, signature, useful }) => {
      const vault = await getPublicVaultBySlug(slug);
      if (!vault) {
        const error = { error: `vault "${slug}" not found or not public` };
        return {
          content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
          structuredContent: error,
          isError: true,
        };
      }

      const result = await submitVaultFeedback(vault.slug, {
        signature,
        useful,
      });
      if (!result.ok) {
        const error = { error: result.reason };
        return {
          content: [{ type: "text", text: JSON.stringify(error, null, 2) }],
          structuredContent: error,
          isError: true,
        };
      }

      const payload = {
        vault_slug: result.vault_slug,
        signature: result.signature,
        useful: result.useful,
        idempotent: result.idempotent,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    },
  );
}
