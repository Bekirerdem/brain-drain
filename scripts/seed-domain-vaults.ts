#!/usr/bin/env bun
/**
 * Mounts three domain-focused vaults from the existing seed-vault/
 * directory. Idempotent — purges any existing rows + storage objects
 * before re-creating, so re-running picks up edits.
 *
 * Why three vaults instead of one umbrella vault: agents need a real
 * catalog to demo discovery + price comparison. The maintainer's
 * "bekir-erdem" vault remains as the broad index ($0.25, all domains);
 * these three slice the same expertise into narrow + deep slugs.
 *
 * Usage: bun scripts/seed-domain-vaults.ts
 */

import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { env } from "@/lib/env";
import { createVault } from "@/lib/vaults";
import {
  getSupabaseAdmin,
  VAULT_INDEX_BUCKET,
  vaultIndexPath,
} from "@/lib/supabase";

interface DomainVault {
  readonly slug: string;
  readonly sourceDir: string;
  readonly name: string;
  readonly description: string;
  readonly domains: readonly string[];
  readonly priceUsdc: number;
  /**
   * Unique payout address for this vault — provisioned via
   * scripts/setup-domain-sellers.ts. Each vault routes settlements to
   * its own CDP-managed Solana account so getNetworkPayouts can
   * attribute on-chain transfers without payout_address collisions.
   */
  readonly payoutAddress: string;
}

const VAULTS: readonly DomainVault[] = [
  {
    slug: "koza-l1-playbook",
    sourceDir: "./seed-vault/01-avalanche-evm",
    name: "Koza L1 Deployment Playbook",
    description:
      "First-hand notes from shipping an Avalanche L1 (Subnet-EVM) on Fuji and verifying contracts through Routescan when the snowtrace endpoint silently rejects rs_ keys. Foundry vs Hardhat tradeoffs, ICM cross-chain pattern decisions, Soulbound roadmap from the shavaxre crowdfunding build. War stories with exact error messages.",
    domains: ["Avalanche L1", "Subnet-EVM", "Foundry", "ICM", "Routescan", "Soulbound"],
    priceUsdc: 0.5,
    payoutAddress: "Eiddypggwni7WBuCC7xzbqjjbkwB8rhQcdqdf5VuAhqD",
  },
  {
    slug: "x402-solana-build-log",
    sourceDir: "./seed-vault/02-solana-brain-drain",
    name: "x402 on Solana — Build Log",
    description:
      "The decision log behind Brain Drain itself: why x402 instead of Base-only payment rails, the Anchor-free SPL transfer pattern, CDP MPC vs Privy for buyer-side signing (TransactionModifyingSigner walked end-to-end), Helius low-latency RPC tweaks, MCP server architecture for paid tools, and the Phantom Cash seller flow.",
    domains: ["x402", "Solana", "CDP MPC", "Helius RPC", "MCP", "Anchor-free", "Phantom Cash"],
    priceUsdc: 0.5,
    payoutAddress: "Ak91bushH76iJ7UtfC4aQTJncFTogAQFR49VhYauhYQL",
  },
  {
    slug: "devops-gotchas",
    sourceDir: "./seed-vault/04-devops-gotchas",
    name: "Devops Gotchas — War Stories",
    description:
      "Specific bugs that cost specific hours. The Binance signature bug where docs claim alphabetical param order but the working JS sample uses URL order. Why npm lockfiles built on Windows fail Linux CI's `npm ci` and how to regenerate cleanly. Trusting magic-byte verification over file extensions when accepting uploads.",
    domains: ["Binance", "npm", "CI/CD", "file-uploads", "war-stories"],
    priceUsdc: 0.1,
    payoutAddress: "EmGu3NSeuvDxVfkJbuNWH8HtM3ajWMNSZgBHBwQSpdYj",
  },
];

interface InMemoryFile {
  source: string;
  content: string;
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
      continue;
    }
    if (!entry.isFile()) continue;
    const lower = entry.name.toLowerCase();
    if (lower.endsWith(".md") || lower.endsWith(".mdx")) yield path;
  }
}

async function readMarkdownBundle(root: string): Promise<InMemoryFile[]> {
  const files: InMemoryFile[] = [];
  for await (const filePath of walk(root)) {
    const content = await readFile(filePath, "utf8");
    files.push({
      source: relative(root, filePath).replaceAll("\\", "/"),
      content,
    });
  }
  files.sort((a, b) => a.source.localeCompare(b.source));
  return files;
}

async function purgeExisting(slug: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin.from("vaults").delete().eq("slug", slug);
  await admin.storage.from(VAULT_INDEX_BUCKET).remove([vaultIndexPath(slug)]);
}

async function mountOne(vault: DomainVault): Promise<void> {
  console.log(`\n[seed] === ${vault.slug} ===`);
  console.log(`[seed] reading ${vault.sourceDir}`);
  const files = await readMarkdownBundle(vault.sourceDir);
  console.log(`[seed] files: ${files.length}`);
  if (files.length === 0) {
    console.error(`[seed] no markdown found at ${vault.sourceDir}`);
    return;
  }

  console.log(`[seed] purging existing slug`);
  await purgeExisting(vault.slug);

  console.log(`[seed] embedding + uploading...`);
  const result = await createVault({
    slug: vault.slug,
    name: vault.name,
    description: vault.description,
    domains: [...vault.domains],
    priceUsdc: vault.priceUsdc,
    public: true,
    ownerWallet: env.SELLER_SOLANA_ADDRESS,
    payoutAddress: vault.payoutAddress,
    files,
  });

  if (!result.ok) {
    console.error(
      `[seed] FAILED ${vault.slug}: ${result.reason} (${result.field ?? "—"})`,
    );
    return;
  }

  const v = result.vault;
  console.log(`[seed] OK ${v.slug}`);
  console.log(`  notes:    ${result.notesCount}`);
  console.log(`  chunks:   ${result.chunksCount}`);
  console.log(`  price:    $${v.price_usdc}`);
  console.log(`  domains:  ${v.domains.join(", ")}`);
}

async function main(): Promise<void> {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY missing — cannot seed");
    process.exit(1);
  }

  for (const vault of VAULTS) {
    await mountOne(vault);
  }

  console.log(`\n[seed] done — ${VAULTS.length} domain vaults mounted`);
}

main().catch((err) => {
  console.error("[seed] FATAL", err);
  process.exit(1);
});
