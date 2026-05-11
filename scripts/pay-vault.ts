#!/usr/bin/env bun
/**
 * One-shot paid query to a specific vault on production devnet.
 *
 * Built for the submission video demo: Bekir narrates "now I'll pay
 * the Snowball team's vault", Claude triggers this script, the
 * LiveActivity feed pops a new settlement in real time, and devnet
 * USDC lands in the foreign operator's wallet — concrete proof of
 * the "anyone can mount, operators get paid directly" claim.
 *
 * Usage:
 *   bun scripts/pay-vault.ts <slug> "<query>"
 *   bun scripts/pay-vault.ts llm-agent-debugging-logs "What patterns help debug LLM agents?"
 *   bun scripts/pay-vault.ts react-pattern "What's the cleanest Next.js client state pattern?"
 *
 * Flags:
 *   --local        hit local dev server instead of production
 *   --skip-faucet  reuse existing buyer balance (faster when looping)
 *   --buyer=NAME   CDP buyer wallet handle (defaults to a stable demo identity)
 */

import { createPaymentHeader, selectPaymentRequirements } from "x402/client";
import { env } from "../src/lib/env";
import {
  cdpAccountToSvmSigner,
  getOrCreateBuyerAccount,
  requestDevnetFaucet,
} from "../src/lib/cdp";

const X402_NETWORK = "solana-devnet" as const;
const DEFAULT_X402_VERSION = 1;
const DEFAULT_BUYER = "brain-drain-buyer-demo";

function resolveBaseUrl(): string {
  if (process.argv.includes("--local")) {
    return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return "https://brain-drain-iota.vercel.app";
}

function resolveBuyerName(): string {
  const flag = process.argv.find((a) => a.startsWith("--buyer="));
  return flag ? flag.slice("--buyer=".length) : DEFAULT_BUYER;
}

async function fundBuyer(address: string): Promise<void> {
  try {
    const solSig = await requestDevnetFaucet({ address, token: "sol" });
    console.log(`  sol faucet: ${solSig.slice(0, 16)}…`);
  } catch (err) {
    console.warn(`  sol faucet skipped: ${err instanceof Error ? err.message : err}`);
  }
  try {
    const usdcSig = await requestDevnetFaucet({ address, token: "usdc" });
    console.log(`  usdc faucet: ${usdcSig.slice(0, 16)}…`);
  } catch (err) {
    console.warn(`  usdc faucet skipped: ${err instanceof Error ? err.message : err}`);
  }
}

async function main(): Promise<void> {
  const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const slug = positional[0];
  const query = positional[1] ?? "What does this vault cover?";

  if (!slug) {
    console.error('Usage: bun scripts/pay-vault.ts <slug> "<query>"');
    process.exit(1);
  }

  const baseUrl = resolveBaseUrl();
  const buyerName = resolveBuyerName();
  const skipFaucet = process.argv.includes("--skip-faucet");

  console.log(`[pay-vault] target → ${baseUrl}/api/v/${slug}/query`);
  console.log(`[pay-vault] query  → ${query}`);
  console.log(`[pay-vault] buyer  → ${buyerName}`);

  const account = await getOrCreateBuyerAccount({ name: buyerName });
  console.log(`[pay-vault] address → ${account.address}`);

  if (!skipFaucet) {
    await fundBuyer(account.address);
    await new Promise((r) => setTimeout(r, 3500));
  }

  const url = `${baseUrl}/api/v/${slug}/query`;

  const probe = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (probe.status !== 402) {
    console.error(`[pay-vault] unexpected probe status: ${probe.status}`);
    console.error(await probe.text().catch(() => ""));
    process.exit(1);
  }

  const challenge = (await probe.json()) as {
    x402Version?: number;
    accepts: Parameters<typeof selectPaymentRequirements>[0];
  };
  const requirements = selectPaymentRequirements(
    challenge.accepts,
    X402_NETWORK,
    "exact",
  );
  console.log(
    `[pay-vault] 402 quote → ${requirements.maxAmountRequired} of ${requirements.asset.slice(0, 8)}…`,
  );
  console.log(`[pay-vault] payTo → ${requirements.payTo}`);

  // Pre-seed recipient USDC ATA with a dust transfer (0.001 USDC) so the
  // x402 SPL transfer doesn't fail on InvalidAccountData when the operator
  // has never received USDC on devnet before. Idempotent — if the ATA
  // already exists, this is just a tiny extra transfer that gets folded
  // into the operator's balance.
  if (!process.argv.includes("--skip-ata-seed")) {
    console.log(`[pay-vault] seeding recipient ATA via 0.001 USDC dust…`);
    try {
      const seedResult = await account.transfer({
        to: requirements.payTo,
        token: "usdc",
        amount: 1000n,
        network: "devnet",
      });
      console.log(`  dust tx: ${seedResult.signature.slice(0, 24)}…`);
      await new Promise((r) => setTimeout(r, 3500));
    } catch (err) {
      console.warn(
        `  dust skipped: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  const signer = cdpAccountToSvmSigner(account);
  const xPaymentHeader = await createPaymentHeader(
    signer,
    challenge.x402Version ?? DEFAULT_X402_VERSION,
    requirements,
  );

  const paid = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Payment": xPaymentHeader,
    },
    body: JSON.stringify({ query }),
  });

  if (paid.status !== 200) {
    console.error(`[pay-vault] paid response: ${paid.status}`);
    console.error(await paid.text().catch(() => ""));
    process.exit(1);
  }

  const xResp = paid.headers.get("x-payment-response");
  if (xResp) {
    try {
      const decoded = JSON.parse(Buffer.from(xResp, "base64").toString("utf8"));
      console.log(
        `[pay-vault] settled → tx ${(decoded.transaction ?? "").slice(0, 24)}… success=${decoded.success}`,
      );
    } catch {
      console.log(`[pay-vault] settled (raw header): ${xResp.slice(0, 32)}…`);
    }
  } else {
    console.log(`[pay-vault] paid response: ${paid.status} (no settlement header)`);
  }

  console.log(`[pay-vault] done`);
}

main().catch((err) => {
  console.error("[pay-vault] FATAL", err);
  process.exit(1);
});
