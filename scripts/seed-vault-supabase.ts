#!/usr/bin/env bun
/**
 * Seeds the maintainer's `seed-vault/` directory into Supabase as the
 * "bekir-erdem" sample vault. Idempotent: removes existing row + storage
 * object before re-creating, so re-running picks up any vault edits.
 *
 * Usage: bun scripts/seed-vault-supabase.ts
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

const VAULT_DIR = "./seed-vault";
const SLUG = "bekir-erdem";

const VAULT_METADATA = {
  slug: SLUG,
  name: "Bekir Erdem's Operator Vault",
  description:
    "Lived experience across Avalanche L1 deployment, x402 micropayments on Solana, MCP architecture, agentic AI infrastructure, and CDP MPC wallet integration. Decision logs with alternatives + tradeoffs, source-linked war stories, no synthetic AI content.",
  domains: [
    "Avalanche L1",
    "x402",
    "MCP",
    "Solana",
    "Foundry",
    "CDP MPC",
    "Anchor-free",
    "Helius RPC",
    "RAG",
  ],
  priceUsdc: 0.25,
  public: true,
} as const;

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

async function purgeExisting(): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin.from("vaults").delete().eq("slug", SLUG);
  await admin.storage.from(VAULT_INDEX_BUCKET).remove([vaultIndexPath(SLUG)]);
}

async function main(): Promise<void> {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY missing — cannot seed");
    process.exit(1);
  }

  console.log(`[seed] reading ${VAULT_DIR}`);
  const files = await readMarkdownBundle(VAULT_DIR);
  console.log(`[seed] files: ${files.length}`);

  console.log(`[seed] purging existing slug "${SLUG}"`);
  await purgeExisting();

  console.log("[seed] embedding + uploading…");
  const result = await createVault({
    ...VAULT_METADATA,
    ownerWallet: env.SELLER_SOLANA_ADDRESS,
    payoutAddress: env.SELLER_SOLANA_ADDRESS,
    files,
  });

  if (!result.ok) {
    console.error(`[seed] FAILED: ${result.reason} (${result.field ?? "—"})`);
    process.exit(1);
  }

  const v = result.vault;
  console.log(`[seed] OK`);
  console.log(`  slug:        ${v.slug}`);
  console.log(`  name:        ${v.name}`);
  console.log(`  notes:       ${result.notesCount}`);
  console.log(`  chunks:      ${result.chunksCount}`);
  console.log(`  domains:     ${v.domains.join(", ")}`);
  console.log(`  payout:      ${v.payout_address}`);
  console.log(`  price USDC:  ${v.price_usdc}`);
  console.log(`  public:      ${v.public}`);
  console.log(`  index path:  ${VAULT_INDEX_BUCKET}/${vaultIndexPath(v.slug)}`);
}

main().catch((err) => {
  console.error("[seed] FATAL", err);
  process.exit(1);
});
