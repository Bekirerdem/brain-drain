#!/usr/bin/env bun
import { getOrCreateBuyerAccount, requestDevnetFaucet } from "../src/lib/cdp";

async function main(): Promise<void> {
  console.log("[buyer] resolving CDP buyer account…");
  const account = await getOrCreateBuyerAccount();
  console.log(`[buyer] address: ${account.address}`);

  console.log("[buyer] requesting devnet SOL…");
  const solSig = await requestDevnetFaucet({ address: account.address, token: "sol" });
  console.log(`[buyer] sol faucet sig: ${solSig}`);

  console.log("[buyer] requesting devnet USDC…");
  const usdcSig = await requestDevnetFaucet({ address: account.address, token: "usdc" });
  console.log(`[buyer] usdc faucet sig: ${usdcSig}`);

  console.log(`\n[buyer] ready. Address: ${account.address}`);
  console.log("[buyer] next: bun scripts/buy-query.ts \"<your question>\"");
}

main().catch((error) => {
  console.error("[buyer] FAIL:", error);
  process.exit(1);
});
