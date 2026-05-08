/**
 * brain_drain_list_vaults — public catalog discovery (free, read-only).
 *
 * Agents call this before paying brain_drain_query_vault so they can pick
 * a vault by domain, price, freshness, and earnings track record.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listPublicVaults } from "@/lib/vaults";
import type { PreviewChunk, Vault } from "@/lib/supabase";

const LIST_LIMIT_MAX = 50;
const LIST_LIMIT_DEFAULT = 24;
// 30 days without a settlement = dormant signal.
const DORMANT_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

const InputSchema = {
  domain: z.string().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(LIST_LIMIT_MAX).optional(),
  sort: z.enum(["earnings", "recent"]).optional(),
};

interface VaultSummary {
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly domains: readonly string[];
  readonly price_usdc: number;
  readonly payout_address: string;
  readonly chunks_count: number;
  readonly notes_count: number;
  readonly total_earned_usdc: number;
  readonly total_settlements: number;
  readonly last_settlement_at: string | null;
  readonly dormant: boolean;
  readonly created_at: string;
  readonly preview_chunks: readonly PreviewChunk[];
}

export function registerListVaults(server: McpServer): void {
  server.registerTool(
    "brain_drain_list_vaults",
    {
      title: "List public Brain Drain vaults",
      description:
        'Return the public catalog of Brain Drain vaults. Each vault is a paid knowledge source with its own price (USDC) and Solana payout address. Free and read-only — call this to discover vaults before paying brain_drain_query_vault. Each entry includes earnings stats (total_earned_usdc, total_settlements, last_settlement_at, dormant) and free preview_chunks so agents can sample voice + density before paying. Optional `domain` filters by domain tag (e.g. "Solana"); `sort` accepts "earnings" (default) or "recent".',
      inputSchema: InputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ domain, limit, sort }) => {
      const vaults = await listPublicVaults({
        limit: limit ?? LIST_LIMIT_DEFAULT,
        sort: sort ?? "earnings",
      });
      const filtered = domain
        ? vaults.filter((v) => v.domains.includes(domain))
        : vaults;
      const summaries = filtered.map(toVaultSummary);
      const result = { count: summaries.length, vaults: summaries };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    },
  );
}

function toVaultSummary(v: Vault): VaultSummary {
  return {
    slug: v.slug,
    name: v.name,
    description: v.description,
    domains: v.domains,
    price_usdc: Number(v.price_usdc),
    payout_address: v.payout_address,
    chunks_count: v.chunks_count,
    notes_count: v.notes_count,
    total_earned_usdc: Number(v.total_earned_usdc),
    total_settlements: v.total_settlements,
    last_settlement_at: v.last_settlement_at,
    dormant: isDormant(v.last_settlement_at),
    created_at: v.created_at,
    preview_chunks: parsePreviewChunks(v.preview_chunks),
  };
}

function isDormant(lastSettlementAt: string | null): boolean {
  if (!lastSettlementAt) return false;
  return Date.now() - Date.parse(lastSettlementAt) > DORMANT_THRESHOLD_MS;
}

function parsePreviewChunks(raw: unknown): readonly PreviewChunk[] {
  if (!Array.isArray(raw)) return [];
  const out: PreviewChunk[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { id?: unknown }).id === "string" &&
      typeof (item as { content?: unknown }).content === "string"
    ) {
      const obj = item as { id: string; heading?: unknown; content: string };
      out.push({
        id: obj.id,
        heading: typeof obj.heading === "string" ? obj.heading : null,
        content: obj.content,
      });
    }
  }
  return out;
}
