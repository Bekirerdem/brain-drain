import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNetworkPayouts, PayoutQuerySchema } from "@/lib/payouts";
import { logAndSanitize, zodFieldError } from "@/lib/errors";

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
    const safe = zodFieldError(raw.error, "payouts.query");
    return NextResponse.json(
      { error: safe.error, field: safe.field },
      { status: safe.status },
    );
  }

  const query = PayoutQuerySchema.parse(raw.data);
  try {
    const payouts = await getNetworkPayouts(query);
    const last = payouts[payouts.length - 1];
    return NextResponse.json({
      count: payouts.length,
      payouts,
      cursor: last?.signature ?? null,
    });
  } catch (err) {
    const safe = logAndSanitize(err, {
      event: "payouts.fetch",
      publicMessage: "could not load payouts",
      status: 502,
    });
    return NextResponse.json({ error: safe.error }, { status: safe.status });
  }
}
