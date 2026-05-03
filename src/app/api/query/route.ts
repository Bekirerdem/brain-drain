import { type NextRequest, NextResponse } from "next/server";
import { withX402, type Network } from "x402-next";
import type { Address } from "viem";
import { z } from "zod";
import { embedText, getIndex, retrieveTopK } from "@/lib/rag";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const QUERY_MAX_CHARS = 1000;
const TOP_K = 3;

const QueryBodySchema = z.object({
  query: z.string().min(1).max(QUERY_MAX_CHARS),
  k: z.number().int().min(1).max(10).optional(),
});

const handler = async (request: NextRequest): Promise<NextResponse> => {
  const raw = await request.json().catch(() => null);
  const parsed = QueryBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { query, k } = parsed.data;

  const queryVector = await embedText(query);
  const index = await getIndex();
  const results = retrieveTopK(queryVector, index.entries, { k: k ?? TOP_K });

  return NextResponse.json({
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

const x402Network: Network =
  env.SOLANA_NETWORK === "mainnet-beta" ? "solana" : "solana-devnet";

export const POST = withX402(
  handler,
  env.SELLER_SOLANA_ADDRESS as Address,
  {
    price: `$${env.X402_DEFAULT_PRICE_USDC}`,
    network: x402Network,
    config: {
      description: "Top-k RAG snippets from Bekir's expert vault",
    },
  },
);
