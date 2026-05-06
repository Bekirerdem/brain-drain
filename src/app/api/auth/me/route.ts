import { type NextRequest, NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const wallet = getSessionWallet(request);
  return NextResponse.json({ wallet });
}
