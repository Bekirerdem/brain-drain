import { listPublicVaults } from "@/lib/vaults/load";
import { getSellerPayouts } from "./service";
import type { PayoutEvent, PayoutQuery } from "./types";

const VAULT_SCAN_LIMIT = 24;
const PER_VAULT_SIGNATURE_LIMIT = 10;

export async function getNetworkPayouts(query: PayoutQuery): Promise<PayoutEvent[]> {
  const vaults = await listPublicVaults({ limit: VAULT_SCAN_LIMIT, sort: "recent" });
  if (vaults.length === 0) return [];

  const perVaultLimit = Math.min(query.limit, PER_VAULT_SIGNATURE_LIMIT);
  const results = await Promise.all(
    vaults.map((v) =>
      getSellerPayouts(v.payout_address, { limit: perVaultLimit }, v.slug).catch(
        () => [] as PayoutEvent[],
      ),
    ),
  );

  const seen = new Set<string>();
  const deduped: PayoutEvent[] = [];
  for (const event of results.flat()) {
    if (seen.has(event.signature)) continue;
    seen.add(event.signature);
    deduped.push(event);
  }

  return deduped
    .sort((a, b) => b.blockTime - a.blockTime)
    .slice(0, query.limit);
}
