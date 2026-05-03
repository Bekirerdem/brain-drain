#!/usr/bin/env bun
import { env } from "../src/lib/env";
import { getOrCreateBuyerAccount } from "../src/lib/cdp";

const DUST_AMOUNT_ATOMIC = BigInt(1_000);

async function main(): Promise<void> {
  const buyer = await getOrCreateBuyerAccount();
  console.log(`[seed] buyer: ${buyer.address}`);
  console.log(`[seed] seller: ${env.SELLER_SOLANA_ADDRESS}`);
  console.log(`[seed] dusting 0.001 USDC to open seller ATA…`);

  const result = await buyer.transfer({
    to: env.SELLER_SOLANA_ADDRESS,
    token: "usdc",
    amount: DUST_AMOUNT_ATOMIC,
    network: "devnet",
  });

  console.log(`[seed] dust tx signature: ${result.signature}`);
  console.log("[seed] seller ATA initialised; buy-query.ts can now succeed.");
}

main().catch((error) => {
  console.error("[seed] FAIL:", error);
  process.exit(1);
});
