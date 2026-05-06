/**
 * /api/vaults
 *   POST  — operator uploads a markdown bundle. Authenticated: ownerWallet
 *           is taken from the session cookie, body's value is overridden.
 *   GET   — public list of vaults; ?owner= filter requires session match.
 *
 * AUTH (post-BD-01/BD-02 hardening):
 *   - POST requires bd_session cookie. The wallet is server-derived; clients
 *     cannot mount a vault under another wallet's identity.
 *   - GET ?owner=<wallet> requires session.wallet === owner. Otherwise the
 *     branch always falls back to public-only reads via the anon RLS path.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createVault } from "@/lib/vaults";
import { getSupabaseAnon } from "@/lib/supabase";
import { getSessionWallet } from "@/lib/auth";
import { Limits, rateLimit } from "@/lib/ratelimit";
import { logAndSanitize, zodFieldError } from "@/lib/errors";

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
  const sessionWallet = getSessionWallet(request);
  if (!sessionWallet) {
    return NextResponse.json(
      { error: "auth required — sign in with Phantom first" },
      { status: 401 },
    );
  }

  // Per-wallet upload throttle — Gemini embedding is the expensive part.
  const limited = await rateLimit(`vault-upload:${sessionWallet}`, Limits.vaultUpload);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: "rate limit exceeded — wait before mounting again",
        retry_after_ms: limited.retryAfterMs,
      },
      { status: 429, headers: { "retry-after": Math.ceil(limited.retryAfterMs / 1000).toString() } },
    );
  }

  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  // Server is the source of truth for ownerWallet. Body's claim is ignored.
  const merged =
    raw && typeof raw === "object"
      ? { ...raw, ownerWallet: sessionWallet }
      : { ownerWallet: sessionWallet };

  const result = await createVault(merged);
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
    const safe = zodFieldError(parsed.error, "vaults.list.query");
    return NextResponse.json(
      { error: safe.error, field: safe.field },
      { status: safe.status },
    );
  }
  const { limit, sort, owner } = parsed.data;

  // Owner-scoped reads require a matching session — protects private vaults
  // from being enumerated by anyone who knows another wallet's address.
  if (owner) {
    const sessionWallet = getSessionWallet(request);
    if (sessionWallet !== owner) {
      return NextResponse.json(
        { error: "auth required to view this wallet's vaults" },
        { status: 401 },
      );
    }
  }

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
    // Authenticated owner branch: include the wallet's private vaults too.
    query = query.eq("owner_wallet", owner);
  } else {
    // Anonymous: public-only, RLS-bound.
    query = query.eq("public", true);
  }

  const res = await query;
  if (res.error) {
    const safe = logAndSanitize(res.error, {
      event: "vaults.list.db",
      publicMessage: "could not load vaults",
      status: 500,
    });
    return NextResponse.json({ error: safe.error }, { status: safe.status });
  }

  return NextResponse.json({ count: res.data.length, vaults: res.data });
}
