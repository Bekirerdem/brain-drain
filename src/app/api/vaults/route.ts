/**
 * /api/vaults
 *   POST  — operator uploads a markdown bundle, server creates the vault.
 *   GET   — public list of vaults (paginated, sorted by total_earned_usdc).
 *
 * AUTH NOTE (v0): the POST body carries `ownerWallet` and the server trusts
 * it. Cryptographic wallet signature verification (sign-in-with-Solana) is
 * task #23 — once Phantom auth is wired, this route validates the signed
 * nonce against `ownerWallet` before forwarding to createVault().
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createVault } from "@/lib/vaults";
import { getSupabaseAnon } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LIST_LIMIT_DEFAULT = 24;
const LIST_LIMIT_MAX = 60;

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(LIST_LIMIT_MAX).default(LIST_LIMIT_DEFAULT),
  sort: z.enum(["earnings", "recent"]).default("earnings"),
  owner: z.string().min(32).max(44).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const result = await createVault(raw);
  if (!result.ok) {
    const status = result.reason.includes("already taken") ? 409 : 400;
    return NextResponse.json(
      { error: result.reason, field: result.field ?? null },
      { status },
    );
  }

  return NextResponse.json(
    {
      vault: result.vault,
      chunks: result.chunksCount,
      notes: result.notesCount,
    },
    { status: 201 },
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sp = request.nextUrl.searchParams;
  const parsed = ListQuerySchema.safeParse({
    limit: sp.get("limit") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    owner: sp.get("owner") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { limit, sort, owner } = parsed.data;

  const orderColumn = sort === "earnings" ? "total_earned_usdc" : "created_at";
  const supabase = getSupabaseAnon();

  let query = supabase
    .from("vaults")
    .select(
      "id, slug, name, description, owner_wallet, payout_address, price_usdc, chunks_count, notes_count, total_earned_usdc, total_settlements, domains, created_at",
    )
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (owner) {
    // Operator dashboard scope: include private vaults of this owner.
    query = query.eq("owner_wallet", owner);
  } else {
    // Public directory: only public vaults.
    query = query.eq("public", true);
  }

  const res = await query;
  if (res.error) {
    return NextResponse.json({ error: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ count: res.data.length, vaults: res.data });
}
