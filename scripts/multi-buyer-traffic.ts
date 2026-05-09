#!/usr/bin/env bun
/**
 * Generates organic-looking settlement traffic on devnet by routing
 * paid queries through multiple distinct CDP buyer wallets, each
 * targeting a different vault. The point is to make LiveActivity feed
 * a multi-payer + multi-vault network rather than a single buyer test
 * loop.
 *
 * Each buyer is provisioned with a unique CDP account name → unique
 * Solana address → faucet-funded with SOL + devnet USDC, then issues
 * one paid x402 call to its assigned vault.
 *
 * Usage: bun scripts/multi-buyer-traffic.ts
 *        bun scripts/multi-buyer-traffic.ts --skip-faucet  # if already funded
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

interface BuyerJob {
  readonly buyerName: string;
  readonly vaultSlug: string;
  readonly query: string;
}

const JOBS: readonly BuyerJob[] = [
  {
    buyerName: "brain-drain-buyer-research",
    vaultSlug: "koza-l1-playbook",
    query: "How do I verify a contract on Routescan when snowtrace rejects my rs_ key?",
  },
  {
    buyerName: "brain-drain-buyer-eng",
    vaultSlug: "x402-solana-build-log",
    query: "Why use TransactionModifyingSigner for CDP-signed Solana SPL transfers?",
  },
  {
    buyerName: "brain-drain-buyer-devops",
    vaultSlug: "devops-gotchas",
    query: "Binance signature error — does the URL param order match the docs?",
  },
  {
    buyerName: "brain-drain-buyer-broad",
    vaultSlug: "bekir-erdem",
    query: "What's the right pattern for cross-chain bounty payouts via ICM?",
  },
];

async function fundBuyer(address: string): Promise<void> {
  try {
    const solSig = await requestDevnetFaucet({ address, token: "sol" });
    console.log(`  sol faucet: ${solSig.slice(0, 16)}…`);
  } catch (err) {
    console.warn(
      `  sol faucet skipped: ${err instanceof Error ? err.message : err}`,
    );
  }
  try {
    const usdcSig = await requestDevnetFaucet({ address, token: "usdc" });
    console.log(`  usdc faucet: ${usdcSig.slice(0, 16)}…`);
  } catch (err) {
    console.warn(
      `  usdc faucet skipped: ${err instanceof Error ? err.message : err}`,
    );
  }
}

async function runJob(job: BuyerJob, skipFaucet: boolean): Promise<void> {
  console.log(`\n[traffic] === ${job.buyerName} → ${job.vaultSlug} ===`);
  const account = await getOrCreateBuyerAccount({ name: job.buyerName });
  console.log(`  buyer address: ${account.address}`);

  if (!skipFaucet) {
    await fundBuyer(account.address);
    // Brief settle so the next call sees fresh balances. The CDP API
    // returns the signature before final commitment in some flows.
    await new Promise((r) => setTimeout(r, 4000));
  }

  const url = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/v/${job.vaultSlug}/query`;
  console.log(`  target: ${url}`);
  console.log(`  query: ${job.query}`);

  const probe = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: job.query }),
  });
  if (probe.status !== 402) {
    console.error(`  unexpected probe status: ${probe.status}`);
    console.error(await probe.text().catch(() => ""));
    return;
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
    `  402 quote: ${requirements.maxAmountRequired} of ${requirements.asset.slice(0, 8)}…`,
  );

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
    body: JSON.stringify({ query: job.query }),
  });

  if (paid.status !== 200) {
    console.error(`  paid response: ${paid.status}`);
    console.error(await paid.text().catch(() => ""));
    return;
  }

  const xResp = paid.headers.get("x-payment-response");
  if (xResp) {
    try {
      const decoded = JSON.parse(
        Buffer.from(xResp, "base64").toString("utf8"),
      );
      console.log(
        `  settled: ${(decoded.transaction ?? "").slice(0, 24)}… (success=${decoded.success})`,
      );
    } catch {
      console.log(`  settled (raw header): ${xResp.slice(0, 32)}…`);
    }
  } else {
    console.log(`  paid response: ${paid.status} (no settlement header)`);
  }
}

async function main(): Promise<void> {
  const skipFaucet = process.argv.includes("--skip-faucet");
  console.log(
    `[traffic] running ${JOBS.length} buyer→vault job(s)${skipFaucet ? " (faucet skipped)" : ""}`,
  );

  for (const job of JOBS) {
    try {
      await runJob(job, skipFaucet);
    } catch (err) {
      console.error(
        `[traffic] ${job.buyerName} FAILED:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`\n[traffic] done`);
}

main().catch((err) => {
  console.error("[traffic] FATAL", err);
  process.exit(1);
});
