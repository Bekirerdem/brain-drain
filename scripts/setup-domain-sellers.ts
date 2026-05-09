#!/usr/bin/env bun
/**
 * Provisions a unique CDP Solana account for each domain vault, so the
 * vault's payout_address is unique and getNetworkPayouts can attribute
 * settlements without collisions.
 *
 * Idempotent — getOrCreateAccount returns the same address on re-run.
 *
 * Usage: bun scripts/setup-domain-sellers.ts
 */

import { getCdpClient } from "../src/lib/cdp";

const SELLER_NAMES = [
  "brain-drain-seller-koza",
  "brain-drain-seller-x402",
  "brain-drain-seller-devops",
] as const;

async function main(): Promise<void> {
  const cdp = getCdpClient();
  console.log(`[sellers] resolving ${SELLER_NAMES.length} CDP seller accounts...\n`);

  const records: { name: string; address: string }[] = [];
  for (const name of SELLER_NAMES) {
    const account = await cdp.solana.getOrCreateAccount({ name });
    console.log(`  ${name}\n    address: ${account.address}`);
    records.push({ name, address: account.address });
  }

  console.log(`\n[sellers] copy these into seed-domain-vaults.ts payout overrides:\n`);
  console.log(JSON.stringify(records, null, 2));
}

main().catch((err) => {
  console.error("[sellers] FATAL", err);
  process.exit(1);
});
