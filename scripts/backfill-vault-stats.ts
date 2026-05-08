#!/usr/bin/env bun
/**
 * Backfill total_earned_usdc, total_settlements, and last_settlement_at
 * for every public vault by replaying its on-chain USDC payout history.
 *
 * Run after deploying the multi-vault counter fix so denormalized stats
 * reflect historical settlements (incrementVaultEarnings is forward-only).
 *
 * Usage:
 *   bun scripts/backfill-vault-stats.ts            # backfill all public vaults
 *   bun scripts/backfill-vault-stats.ts --dry-run  # show diffs without writing
 *   bun scripts/backfill-vault-stats.ts <slug>     # one specific vault
 */

import { getSupabaseAdmin } from "../src/lib/supabase";
import { getSellerPayouts } from "../src/lib/payouts";

const PAYOUT_FETCH_LIMIT = 100;

interface BackfillStats {
  readonly slug: string;
  readonly count: number;
  readonly totalUsdc: number;
  readonly lastBlockTime: number;
  readonly lastSettlementAt: string | null;
}

async function computeStats(
  slug: string,
  payoutAddress: string,
): Promise<BackfillStats> {
  const payouts = await getSellerPayouts(
    payoutAddress,
    { limit: PAYOUT_FETCH_LIMIT },
    slug,
  );
  let totalUsdc = 0;
  let lastBlockTime = 0;
  for (const p of payouts) {
    totalUsdc += p.amountUsdc;
    if (p.blockTime > lastBlockTime) lastBlockTime = p.blockTime;
  }
  return {
    slug,
    count: payouts.length,
    totalUsdc,
    lastBlockTime,
    lastSettlementAt:
      lastBlockTime > 0 ? new Date(lastBlockTime * 1000).toISOString() : null,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlySlug = args.find((a) => !a.startsWith("--"));

  const admin = getSupabaseAdmin();
  let q = admin
    .from("vaults")
    .select("slug, payout_address, total_earned_usdc, total_settlements, last_settlement_at")
    .eq("public", true);
  if (onlySlug) q = q.eq("slug", onlySlug);

  const res = await q;
  if (res.error) {
    console.error("[backfill] failed to list vaults:", res.error.message);
    process.exit(1);
  }

  console.log(`[backfill] ${res.data.length} vault(s) to scan${dryRun ? " (dry run)" : ""}`);

  for (const vault of res.data) {
    console.log(`\n[backfill] ${vault.slug} (${vault.payout_address})`);
    const stats = await computeStats(vault.slug, vault.payout_address);
    console.log(
      `  on-chain:  ${stats.count} settlements, ${stats.totalUsdc.toFixed(6)} USDC, last=${stats.lastSettlementAt ?? "never"}`,
    );
    console.log(
      `  db:        ${vault.total_settlements} settlements, ${Number(vault.total_earned_usdc).toFixed(6)} USDC, last=${vault.last_settlement_at ?? "never"}`,
    );

    if (dryRun) continue;

    const update = await admin
      .from("vaults")
      .update({
        total_earned_usdc: stats.totalUsdc,
        total_settlements: stats.count,
        last_settlement_at: stats.lastSettlementAt,
      })
      .eq("slug", vault.slug);
    if (update.error) {
      console.error(`  [error] update failed: ${update.error.message}`);
      continue;
    }
    console.log(`  [ok] updated`);
  }

  console.log(`\n[backfill] done`);
}

main().catch((err) => {
  console.error("[backfill] FAIL:", err);
  process.exit(1);
});
