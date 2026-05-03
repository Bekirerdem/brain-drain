#!/usr/bin/env bun
import { env } from "../src/lib/env";
import { getCdpClient, getOrCreateBuyerAccount } from "../src/lib/cdp";

async function listBalances(label: string, address: string): Promise<void> {
  console.log(`\n[balance] ${label}: ${address}`);
  const result = await getCdpClient().solana.listTokenBalances({
    address,
    network: "solana-devnet",
  });
  if (result.balances.length === 0) {
    console.log("[balance]   (no token balances)");
    return;
  }
  for (const b of result.balances) {
    const human = Number(b.amount.amount) / 10 ** b.amount.decimals;
    const name = b.token.name ?? b.token.symbol ?? "?";
    console.log(
      `[balance]   ${name.padEnd(12)} ${human}  mint=${b.token.mintAddress}`,
    );
  }
}

async function main(): Promise<void> {
  const buyer = await getOrCreateBuyerAccount();
  console.log(`[balance] env.USDC_MINT_DEVNET = ${env.USDC_MINT_DEVNET}`);
  await listBalances("buyer ", buyer.address);
  await listBalances("seller", env.SELLER_SOLANA_ADDRESS);
}

main().catch((error) => {
  console.error("[balance] FAIL:", error);
  process.exit(1);
});
