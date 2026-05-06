import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueChallenge } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  wallet: z.string().min(32).max(44),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
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
