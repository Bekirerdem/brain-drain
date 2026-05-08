#!/usr/bin/env bun
/**
 * Backfill preview_chunks for existing vaults that pre-date the
 * createVault default. Pulls the first entry from each vault's stored
 * IndexFile and writes a trimmed teaser into vaults.preview_chunks.
 *
 * Skips vaults that already have at least one preview chunk so re-runs
 * are safe. Usage:
 *   bun scripts/backfill-preview-chunks.ts            # all public vaults
 *   bun scripts/backfill-preview-chunks.ts --dry-run  # show plan
 *   bun scripts/backfill-preview-chunks.ts <slug>     # one vault
 */

import { getSupabaseAdmin } from "../src/lib/supabase";
import { getVaultIndex } from "../src/lib/vaults";

const PREVIEW_CONTENT_MAX = 600;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlySlug = args.find((a) => !a.startsWith("--"));

  const admin = getSupabaseAdmin();
  let q = admin
    .from("vaults")
    .select("slug, preview_chunks")
    .eq("public", true);
  if (onlySlug) q = q.eq("slug", onlySlug);

  const res = await q;
  if (res.error) {
    console.error("[preview] failed to list vaults:", res.error.message);
    process.exit(1);
  }
  console.log(
    `[preview] ${res.data.length} vault(s) to scan${dryRun ? " (dry run)" : ""}`,
  );

  for (const vault of res.data) {
    const existing = Array.isArray(vault.preview_chunks)
      ? vault.preview_chunks.length
      : 0;
    if (existing > 0) {
      console.log(`[preview] ${vault.slug}: has ${existing} preview chunk(s), skip`);
      continue;
    }

    let first;
    try {
      const index = await getVaultIndex(vault.slug);
      first = index.entries[0];
    } catch (err) {
      console.error(
        `[preview] ${vault.slug}: failed to load index:`,
        err instanceof Error ? err.message : err,
      );
      continue;
    }
    if (!first) {
      console.log(`[preview] ${vault.slug}: empty index, skip`);
      continue;
    }

    const preview = [
      {
        id: first.id,
        heading: first.heading,
        content:
          first.content.length > PREVIEW_CONTENT_MAX
            ? `${first.content.slice(0, PREVIEW_CONTENT_MAX)}…`
            : first.content,
      },
    ];

    if (dryRun) {
      console.log(
        `[preview] ${vault.slug}: would set 1 preview chunk (heading=${JSON.stringify(first.heading)}, source chars=${first.content.length})`,
      );
      continue;
    }

    const update = await admin
      .from("vaults")
      .update({ preview_chunks: preview })
      .eq("slug", vault.slug);
    if (update.error) {
      console.error(`[preview] ${vault.slug}: ${update.error.message}`);
      continue;
    }
    console.log(`[preview] ${vault.slug}: backfilled (1 chunk)`);
  }

  console.log(`\n[preview] done`);
}

main().catch((err) => {
  console.error("[preview] FAIL:", err);
  process.exit(1);
});
