#!/usr/bin/env bun
/**
 * Initialises USDC Associated Token Accounts for the three domain seller
 * wallets by dusting 0.001 devnet USDC from the maintainer's buyer
 * account. Without this, the first paid x402 transfer to a seller
 * whose ATA does not exist yet will fail.
 *
 * Usage: bun scripts/seed-domain-seller-atas.ts
 */

import { getOrCreateBuyerAccount } from "../src/lib/cdp";

const DUST_AMOUNT_ATOMIC = BigInt(1_000);

const SELLERS = [
  { name: "brain-drain-seller-koza", address: "Eiddypggwni7WBuCC7xzbqjjbkwB8rhQcdqdf5VuAhqD" },
  { name: "brain-drain-seller-x402", address: "Ak91bushH76iJ7UtfC4aQTJncFTogAQFR49VhYauhYQL" },
  { name: "brain-drain-seller-devops", address: "EmGu3NSeuvDxVfkJbuNWH8HtM3ajWMNSZgBHBwQSpdYj" },
] as const;

async function main(): Promise<void> {
  const buyer = await getOrCreateBuyerAccount();
  console.log(`[ata] buyer: ${buyer.address}`);

  for (const seller of SELLERS) {
    console.log(`\n[ata] dusting ${seller.name} (${seller.address})...`);
    try {
      const result = await buyer.transfer({
        to: seller.address,
        token: "usdc",
        amount: DUST_AMOUNT_ATOMIC,
        network: "devnet",
      });
      console.log(`  signature: ${result.signature}`);
    } catch (err) {
      console.error(
        `  FAILED: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`\n[ata] done`);
}

main().catch((error) => {
  console.error("[ata] FAIL:", error);
  process.exit(1);
});
