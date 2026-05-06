import { type NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { Limits, clientKey, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("That doesn't look like a valid email."),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(clientKey(request, "waitlist"), Limits.waitlist);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "too many signups" },
      {
        status: 429,
        headers: { "retry-after": Math.ceil(limited.retryAfterMs / 1000).toString() },
      },
    );
  }

  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const domain = email.split("@")[1] ?? "unknown";
  const emailHash = createHash("sha256").update(email).digest("hex").slice(0, 16);

  // BD-07: never log raw email or UA — log structured, redacted record only.
  // Persistence target (Vercel KV / Supabase / Resend audience) is the next decision.
  console.log(
    JSON.stringify({
      level: "info",
      event: "waitlist.signup",
      email_hash: emailHash,
      email_domain: domain,
      ts: new Date().toISOString(),
    }),
  );

  return NextResponse.json({
    ok: true,
    message: "On the list — I'll ping you when v1 ships.",
  });
}
