import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  consumeChallenge,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifyWalletSignature,
} from "@/lib/auth";
import { Limits, clientKey, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  wallet: z.string().min(32).max(44),
  challenge: z.string().min(16).max(200),
  signature: z.string().min(64).max(120),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(clientKey(request, "auth-verify"), Limits.authVerify);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "too many verification attempts" },
      {
        status: 429,
        headers: { "retry-after": Math.ceil(limited.retryAfterMs / 1000).toString() },
      },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { wallet, challenge, signature } = parsed.data;

  // Consume the challenge first (one-shot, prevents replay even on signature failure).
  const consume = await consumeChallenge({ wallet, challenge });
  if (!consume.ok) {
    return NextResponse.json({ error: consume.reason }, { status: 401 });
  }

  if (!verifyWalletSignature({ wallet, challenge, signature })) {
    return NextResponse.json({ error: "signature invalid" }, { status: 401 });
  }

  const token = createSessionToken(wallet);
  const res = NextResponse.json({ ok: true, wallet });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
  return res;
}
