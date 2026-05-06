import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueChallenge } from "@/lib/auth";
import { Limits, clientKey, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  wallet: z.string().min(32).max(44),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimit(clientKey(request, "auth-challenge"), Limits.authChallenge);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "too many challenge requests" },
      {
        status: 429,
        headers: { "retry-after": Math.ceil(limited.retryAfterMs / 1000).toString() },
      },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
  }
  try {
    const challenge = await issueChallenge(parsed.data.wallet);
    return NextResponse.json({ challenge });
  } catch {
    return NextResponse.json(
      { error: "failed to issue challenge" },
      { status: 500 },
    );
  }
}
