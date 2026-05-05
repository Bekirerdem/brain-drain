import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

  // TODO: persist to Vercel KV / Supabase / Resend audience before mainnet cut.
  // For now: structured log so deploy provider can scrape it.
  console.log(
    JSON.stringify({
      level: "info",
      event: "waitlist.signup",
      email,
      ts: new Date().toISOString(),
      ua: request.headers.get("user-agent") ?? null,
    }),
  );

  return NextResponse.json({
    ok: true,
    message: "On the list — I'll ping you when v1 ships.",
  });
}
