/**
 * DB-backed payout ledger.
 *
 * Replaces the RPC indexer (network.ts → service.ts) as the canonical
 * source for `/api/payouts` and the LiveActivity feed. The RPC walker
 * surfaced every USDC inbound to a vault's payout address — devnet
 * faucet drops to a self-funded operator address looked indistinguishable
 * from a real x402 query settlement, polluting the volume stat.
 *
 * The ledger only carries rows that a successful x402 query handler
 * inserted, so faucet movement, manual transfers, and unrelated
 * devnet traffic stay out of the demo feed by construction.
 */

import { getSupabaseAdmin } from "@/lib/supabase";
import type { PayoutEvent, PayoutQuery } from "./types";

const USDC_DECIMALS = 6;
const USDC_MULT = 10 ** USDC_DECIMALS;

interface RecordSettlementInput {
  readonly signature: string;
  readonly vaultSlug: string;
  readonly payer: string;
  readonly amountUsdc: number;
  readonly blockTime?: Date;
}

/**
 * Persist a confirmed x402 settlement. Idempotent — signature is the
 * primary key, so a duplicate insert (e.g. a retried route) silently
 * no-ops via the conflict path.
 */
export async function recordSettlement(
  input: RecordSettlementInput,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const blockTime = (input.blockTime ?? new Date()).toISOString();
  const res = await admin
    .from("vault_settlements")
    .upsert(
      {
        signature: input.signature,
        vault_slug: input.vaultSlug,
        payer: input.payer,
        amount_usdc: input.amountUsdc,
        block_time: blockTime,
      },
      { onConflict: "signature", ignoreDuplicates: true },
    );
  if (res.error) {
    // Don't throw — failing to log a settlement should not break the
    // 200 response the buyer already paid for. Surface to logs only.
    console.error(
      JSON.stringify({
        level: "warn",
        event: "ledger.record_failed",
        signature_prefix: input.signature.slice(0, 8),
        vault_slug: input.vaultSlug,
        error: res.error.message,
      }),
    );
  }
}

interface LedgerRow {
  signature: string;
  vault_slug: string;
  payer: string;
  amount_usdc: number;
  block_time: string;
  vaults: { payout_address: string } | null;
}

export async function getLedgerPayouts(
  query: PayoutQuery,
): Promise<PayoutEvent[]> {
  const admin = getSupabaseAdmin();
  let q = admin
    .from("vault_settlements")
    .select(
      "signature, vault_slug, payer, amount_usdc, block_time, vaults!inner(payout_address)",
    )
    .order("block_time", { ascending: false })
    .limit(query.limit);
  if (query.before) {
    // Cursor pagination: fetch the cursor row's block_time and page on it.
    const cursor = await admin
      .from("vault_settlements")
      .select("block_time")
      .eq("signature", query.before)
      .maybeSingle();
    if (cursor.data) q = q.lt("block_time", cursor.data.block_time);
  }
  const res = await q;
  if (res.error) {
    throw new Error(`ledger fetch failed: ${res.error.message}`);
  }
  return (res.data as unknown as LedgerRow[]).map(toPayoutEvent);
}

function toPayoutEvent(row: LedgerRow): PayoutEvent {
  const amountUsdc = Number(row.amount_usdc);
  return {
    signature: row.signature,
    blockTime: Math.floor(Date.parse(row.block_time) / 1000),
    slot: 0, // Ledger does not store slot — feed UI only renders blockTime.
    payer: row.payer,
    recipient: row.vaults?.payout_address ?? row.payer,
    vaultSlug: row.vault_slug,
    amountAtomic: Math.round(amountUsdc * USDC_MULT).toString(),
    amountUsdc,
    mint: "", // Always USDC; UI ignores mint when empty.
  } satisfies PayoutEvent;
}
