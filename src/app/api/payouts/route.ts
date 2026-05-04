import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSellerPayouts, PayoutQuerySchema } from "@/lib/payouts";

export const dynamic = "force-dynamic";

const SearchParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().min(60).max(120).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams;
  const raw = SearchParamsSchema.safeParse({
    limit: sp.get("limit") ?? undefined,
    before: sp.get("before") ?? undefined,
  });
  if (!raw.success) {
    return NextResponse.json({ error: raw.error.message }, { status: 400 });
  }

  const query = PayoutQuerySchema.parse(raw.data);
  const payouts = await getSellerPayouts(query);

  const last = payouts[payouts.length - 1];
  return NextResponse.json({
    count: payouts.length,
    payouts,
    cursor: last?.signature ?? null,
  });
}
