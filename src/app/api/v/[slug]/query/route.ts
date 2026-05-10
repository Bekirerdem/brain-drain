/**
 * /api/v/[slug]/query — vault-aware paid x402 query endpoint.
 *
 * Resolves the vault by slug, wraps the RAG handler with x402 using the
 * vault's own payout_address + price_usdc. Each vault is its own
 * settlement target — Brain Drain itself never custodies the USDC.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withX402, type Network } from "x402-next";
import type { Address } from "viem";
import { embedText, retrieveTopK } from "@/lib/rag";
import { env } from "@/lib/env";
import {
  getPublicVaultBySlug,
  getVaultIndex,
  incrementVaultEarnings,
} from "@/lib/vaults";
import { recordSettlement } from "@/lib/payouts";
import { logAndSanitize, zodFieldError } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QUERY_MAX_CHARS = 1000;
const TOP_K_DEFAULT = 3;
const TOP_K_MAX = 10;

const QueryBodySchema = z.object({
  query: z.string().min(1).max(QUERY_MAX_CHARS),
  k: z.number().int().min(1).max(TOP_K_MAX).optional(),
});

interface RouteContext {
  readonly params: Promise<{ slug: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;
  const vault = await getPublicVaultBySlug(slug);
  if (!vault) {
    return NextResponse.json(
      { error: `vault "${slug}" not found or not public` },
      { status: 404 },
    );
  }

  const network: Network =
    env.SOLANA_NETWORK === "mainnet-beta" ? "solana" : "solana-devnet";

  const handler = async (req: NextRequest): Promise<NextResponse> => {
    const raw = await req.json().catch(() => null);
    const parsed = QueryBodySchema.safeParse(raw);
    if (!parsed.success) {
      const safe = zodFieldError(parsed.error, "query.body");
      return NextResponse.json(
        { error: safe.error, field: safe.field },
        { status: safe.status },
      );
    }
    const { query, k } = parsed.data;

    let index;
    try {
      index = await getVaultIndex(vault.slug);
    } catch (err) {
      const safe = logAndSanitize(err, {
        event: "query.vault_index",
        publicMessage: "vault index temporarily unavailable",
        status: 503,
      });
      return NextResponse.json({ error: safe.error }, { status: safe.status });
    }

    const queryVector = await embedText(query);
    const results = retrieveTopK(queryVector, index.entries, {
      k: k ?? TOP_K_DEFAULT,
    });

    // Fire-and-forget — x402-next settles payment after this handler
    // returns 2xx, so reaching this point implies the buyer paid. Failure
    // here only desyncs the denormalized counter, not the on-chain truth.
    void incrementVaultEarnings(vault.slug, Number(vault.price_usdc)).catch(
      (err) => {
        console.error(
          `[query] failed to update vault stats for ${vault.slug}:`,
          err,
        );
      },
    );

    return NextResponse.json({
      vault: {
        slug: vault.slug,
        name: vault.name,
        owner_wallet: vault.owner_wallet,
      },
      query,
      results: results.map((r) => ({
        id: r.chunk.id,
        source: r.chunk.source,
        heading: r.chunk.heading,
        content: r.chunk.content,
        score: r.score,
      })),
    });
  };

  const wrapped = withX402(handler, vault.payout_address as Address, {
    price: `$${vault.price_usdc}`,
    network,
    config: {
      description: `Top-k RAG snippets from ${vault.name}`,
    },
  });

  const response = await wrapped(request);

  // After a successful settlement, x402-next attaches the payment
  // receipt as an `x-payment-response` header (base64 JSON with the
  // tx signature, payer, success bool). Persist it to the ledger so
  // /api/payouts can serve a clean Brain-Drain-only feed instead of
  // pulling every USDC inbound off-chain. Fire-and-forget — the
  // buyer already has their 200 + snippets, ledger downtime must
  // never block the response path.
  if (response.status === 200) {
    const xPaymentResponse = response.headers.get("x-payment-response");
    if (xPaymentResponse) {
      try {
        const decoded = JSON.parse(
          Buffer.from(xPaymentResponse, "base64").toString("utf8"),
        ) as { transaction?: string; payer?: string; success?: boolean };
        if (decoded.transaction && decoded.success !== false) {
          void recordSettlement({
            signature: decoded.transaction,
            vaultSlug: vault.slug,
            payer: decoded.payer ?? "unknown",
            amountUsdc: Number(vault.price_usdc),
          }).catch((err) => {
            console.error(
              `[query] settlement ledger insert failed for ${vault.slug}:`,
              err,
            );
          });
        }
      } catch {
        // Header malformed — settlement still happened on-chain, just
        // not in the ledger this round. Buyer is unaffected.
      }
    }
  }

  return response;
}
