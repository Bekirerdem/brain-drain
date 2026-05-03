#!/usr/bin/env bun
import { createPaymentHeader, selectPaymentRequirements } from "x402/client";
import { env } from "../src/lib/env";
import { cdpAccountToSvmSigner, getOrCreateBuyerAccount } from "../src/lib/cdp";

const DEFAULT_X402_VERSION = 1;
const X402_NETWORK = "solana-devnet" as const;

async function main(): Promise<void> {
  const query = process.argv[2];
  if (!query) {
    console.error("Usage: bun scripts/buy-query.ts <query>");
    process.exit(1);
  }

  const url = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/query`;
  console.log(`[buyer] target: ${url}`);
  console.log(`[buyer] query: ${query}`);

  const probe = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (probe.status !== 402) {
    console.error(`[buyer] unexpected initial status: ${probe.status}`);
    console.error(await probe.text());
    process.exit(1);
  }
  const challenge = (await probe.json()) as {
    x402Version?: number;
    accepts: Parameters<typeof selectPaymentRequirements>[0];
  };
  console.log(`[buyer] 402 challenge: ${challenge.accepts.length} option(s)`);

  const requirements = selectPaymentRequirements(challenge.accepts, X402_NETWORK, "exact");
  console.log(
    `[buyer] paying ${requirements.maxAmountRequired} of ${requirements.asset} → ${requirements.payTo}`,
  );

  const account = await getOrCreateBuyerAccount();
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

  console.log(`[buyer] paid response: ${paid.status}`);
  const xResp = paid.headers.get("x-payment-response");
  if (xResp) console.log(`[buyer] X-Payment-Response: ${xResp}`);

  const body = await paid.json();
  console.log(JSON.stringify(body, null, 2));
}

main().catch((error) => {
  console.error("[buyer] FAIL:", error);
  process.exit(1);
});
