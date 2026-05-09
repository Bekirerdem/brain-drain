import { listPublicVaults } from "@/lib/vaults/load";
import { getSellerPayouts } from "./service";
import type { PayoutEvent, PayoutQuery } from "./types";

const VAULT_SCAN_LIMIT = 24;
const PER_VAULT_SIGNATURE_LIMIT = 10;
// Filter out ATA-initialisation dusts (≤ 0.005 USDC) so the public feed
// shows only real paid queries. The minimum operator price is 0.05 USDC,
// so any settlement below 0.005 is non-economic seeding traffic.
const DUST_THRESHOLD_USDC = 0.005;

export async function getNetworkPayouts(query: PayoutQuery): Promise<PayoutEvent[]> {
  const vaults = await listPublicVaults({ limit: VAULT_SCAN_LIMIT, sort: "recent" });
  if (vaults.length === 0) return [];

  // Iterate oldest vault first. When two vaults share a payout_address
  // (Bekir's test wallet, devnet seeding) the same on-chain transfer
  // surfaces under each slug. Set-dedup keeps the FIRST occurrence, so
  // ascending creation order means the original recipient vault wins
  // the attribution rather than whichever vault was registered last.
  const ordered = [...vaults].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );

  const perVaultLimit = Math.min(query.limit, PER_VAULT_SIGNATURE_LIMIT);
  const results = await Promise.all(
    ordered.map((v) =>
      getSellerPayouts(v.payout_address, { limit: perVaultLimit }, v.slug).catch(
        () => [] as PayoutEvent[],
      ),
    ),
  );

  const seen = new Set<string>();
  const deduped: PayoutEvent[] = [];
  for (const event of results.flat()) {
    if (seen.has(event.signature)) continue;
    if (event.amountUsdc < DUST_THRESHOLD_USDC) continue;
    seen.add(event.signature);
    deduped.push(event);
  }

  return deduped
    .sort((a, b) => b.blockTime - a.blockTime)
    .slice(0, query.limit);
}
