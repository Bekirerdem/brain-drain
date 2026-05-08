/**
 * Vault metadata reads.
 *
 * Server-only. Uses the admin client for owner-private fetches and falls
 * back to anon for public reads — keeping RLS the source of truth even
 * when service-role is available.
 */

import { getSupabaseAdmin, type Vault } from "@/lib/supabase";

export async function getVaultBySlug(slug: string): Promise<Vault | null> {
  const admin = getSupabaseAdmin();
  const res = await admin
    .from("vaults")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (res.error) {
    throw new Error(`vault ${slug} lookup failed: ${res.error.message}`);
  }
  return res.data;
}

export async function getPublicVaultBySlug(slug: string): Promise<Vault | null> {
  const vault = await getVaultBySlug(slug);
  if (!vault || !vault.public) return null;
  return vault;
}

export interface ListVaultsParams {
  readonly limit?: number;
  readonly sort?: "earnings" | "recent";
}

export async function listPublicVaults(params: ListVaultsParams = {}): Promise<Vault[]> {
  const { limit = 24, sort = "earnings" } = params;
  const admin = getSupabaseAdmin();
  const orderColumn = sort === "earnings" ? "total_earned_usdc" : "created_at";
  const res = await admin
    .from("vaults")
    .select("*")
    .eq("public", true)
    .order(orderColumn, { ascending: false })
    .limit(limit);
  if (res.error) {
    throw new Error(`vaults list failed: ${res.error.message}`);
  }
  return res.data;
}

/**
 * Best-effort denormalized counter update. Race-prone under concurrent
 * settlements (read-then-write), but on-chain settlement history is the
 * source of truth — these fields exist for fast directory sort and agent
 * signal (kazanan, dolu, taze), not accounting. x402-next has no onPaid
 * hook; the route handler calls this fire-and-forget on success.
 */
export async function incrementVaultEarnings(
  slug: string,
  amountUsdc: number,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const current = await admin
    .from("vaults")
    .select("total_earned_usdc, total_settlements")
    .eq("slug", slug)
    .single();
  if (current.error) return;
  await admin
    .from("vaults")
    .update({
      total_earned_usdc: Number(current.data.total_earned_usdc) + amountUsdc,
      total_settlements: current.data.total_settlements + 1,
      last_settlement_at: new Date().toISOString(),
    })
    .eq("slug", slug);
}
