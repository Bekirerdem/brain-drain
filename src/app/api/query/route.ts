import { z } from "zod";
import {
  buildPaymentRequirements,
  encodeXPaymentResponse,
  requirePayment,
  X_PAYMENT_RESPONSE_HEADER,
} from "@/lib/x402";
import { embedText, getIndex, retrieveTopK } from "@/lib/rag";

export const dynamic = "force-dynamic";

const QUERY_MAX_CHARS = 1000;
const TOP_K = 3;

const QueryBodySchema = z.object({
  query: z.string().min(1).max(QUERY_MAX_CHARS),
  k: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const requirements = buildPaymentRequirements({
    resource: request.url,
    description: "Top-k RAG snippets from Bekir's expert vault",
  });

  const body = await safeReadBody(request);
  if (!body.ok) {
    return Response.json({ error: body.reason }, { status: 400 });
  }

  const gate = await requirePayment(request, requirements);
  if (!gate.ok) return gate.response;

  const queryVector = await embedText(body.value.query);
  const index = await getIndex();
  const results = retrieveTopK(queryVector, index.entries, {
    k: body.value.k ?? TOP_K,
  });

  const ack = encodeXPaymentResponse({
    success: true,
    transaction: gate.payment.signature,
    network: requirements.network,
  });

  return Response.json(
    {
      query: body.value.query,
      results: results.map((r) => ({
        id: r.chunk.id,
        source: r.chunk.source,
        heading: r.chunk.heading,
        content: r.chunk.content,
        score: r.score,
      })),
      payment: {
        signature: gate.payment.signature,
        payerOwner: gate.payment.payerOwner,
        amountUsdc: gate.payment.amountUsdc,
        slot: gate.payment.slot,
        blockTime: gate.payment.blockTime,
      },
    },
    { headers: { [X_PAYMENT_RESPONSE_HEADER]: ack } },
  );
}

type BodyResult =
  | { ok: true; value: z.infer<typeof QueryBodySchema> }
  | { ok: false; reason: string };

async function safeReadBody(request: Request): Promise<BodyResult> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, reason: "request body must be JSON" };
  }
  const parsed = QueryBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.message };
  }
  return { ok: true, value: parsed.data };
}
