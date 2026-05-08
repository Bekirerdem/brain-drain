/**
 * Vault creation orchestration.
 *
 * One server-side function that takes operator metadata + a markdown bundle
 * and:
 *   1. parses + chunks via existing rag pipeline
 *   2. computes Gemini embeddings
 *   3. uploads the IndexFile JSON to Supabase Storage (`vault-indexes/{slug}/index.json`)
 *   4. inserts the vaults row with denormalized counters (chunks/notes/domains)
 *
 * Used by:
 *   - POST /api/vaults (operator upload)
 *   - scripts/seed-vault-supabase.ts (sample vault one-shot)
 *
 * Pure server function — never imported from client components.
 */

import { z } from "zod";
import { embedTexts } from "@/lib/rag/embeddings";
import {
  chunkDocuments,
  loadVaultFromFiles,
  type InMemoryFile,
  type Chunk,
} from "@/lib/rag";
import { env } from "@/lib/env";
import {
  getSupabaseAdmin,
  VAULT_INDEX_BUCKET,
  vaultIndexPath,
  type Vault,
  type VaultInsert,
} from "@/lib/supabase";

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const WALLET_LENGTH_MIN = 32;
const WALLET_LENGTH_MAX = 44;
const PRICE_MIN = 0.05;
const PRICE_MAX = 5;
const NAME_MAX = 80;
const DESCRIPTION_MAX = 500;
const FILES_MAX = 200;
const FILE_CONTENT_MAX_BYTES = 200_000;
const TOTAL_BUNDLE_MAX_BYTES = 5_000_000;
const DOMAINS_MAX = 12;
const PREVIEW_CONTENT_MAX = 600;

export const VaultCreateInputSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(SLUG_PATTERN, "slug must be kebab-case (a-z, 0-9, hyphen)"),
  name: z.string().min(1).max(NAME_MAX),
  description: z.string().max(DESCRIPTION_MAX).optional(),
  ownerWallet: z.string().min(WALLET_LENGTH_MIN).max(WALLET_LENGTH_MAX),
  payoutAddress: z.string().min(WALLET_LENGTH_MIN).max(WALLET_LENGTH_MAX),
  priceUsdc: z.number().min(PRICE_MIN).max(PRICE_MAX).default(0.25),
  domains: z.array(z.string().min(1).max(40)).max(DOMAINS_MAX).default([]),
  public: z.boolean().default(true),
  files: z
    .array(
      z.object({
        source: z.string().min(1).max(255),
        content: z.string().min(1),
      }),
    )
    .min(1)
    .max(FILES_MAX),
});

export type VaultCreateInput = z.infer<typeof VaultCreateInputSchema>;

export type VaultCreateResult =
  | { ok: true; vault: Vault; chunksCount: number; notesCount: number }
  | { ok: false; reason: string; field?: string };

export async function createVault(
  raw: unknown,
): Promise<VaultCreateResult> {
  const parsed = VaultCreateInputSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      reason: first?.message ?? "invalid input",
      field: first?.path.join(".") ?? undefined,
    };
  }
  const input = parsed.data;

  const sizeCheck = checkBundleSize(input.files);
  if (!sizeCheck.ok) return sizeCheck;

  const docs = loadVaultFromFiles(input.files);
  if (docs.length === 0) {
    return {
      ok: false,
      reason: "bundle has no parseable markdown files",
      field: "files",
    };
  }

  const chunks = chunkDocuments(docs);
  if (chunks.length === 0) {
    return {
      ok: false,
      reason: "no chunks produced — files may be too short",
      field: "files",
    };
  }

  const vectors = await embedTexts(chunks.map((c) => c.content));
  if (vectors.length !== chunks.length) {
    return {
      ok: false,
      reason: `embedding count mismatch: got ${vectors.length}, expected ${chunks.length}`,
    };
  }

  const dimensions = vectors[0]?.length ?? 0;
  const indexFile = {
    version: 1 as const,
    model: env.GEMINI_EMBEDDING_MODEL,
    dimensions,
    generatedAt: new Date().toISOString(),
    entries: chunks.map((c, i) => ({ ...c, embedding: vectors[i] })),
  };

  const admin = getSupabaseAdmin();
  const path = vaultIndexPath(input.slug);

  const upload = await admin.storage
    .from(VAULT_INDEX_BUCKET)
    .upload(path, JSON.stringify(indexFile), {
      contentType: "application/json",
      upsert: true,
    });
  if (upload.error) {
    return { ok: false, reason: `storage upload failed: ${upload.error.message}` };
  }

  // Surface the first chunk as a free teaser so agents can preview the
  // vault's voice + density via list_vaults before paying. Trimmed to keep
  // catalog responses small.
  const previewChunks = chunks.slice(0, 1).map((c) => ({
    id: c.id,
    heading: c.heading,
    content: c.content.length > PREVIEW_CONTENT_MAX
      ? `${c.content.slice(0, PREVIEW_CONTENT_MAX)}…`
      : c.content,
  }));

  const insert: VaultInsert = {
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    owner_wallet: input.ownerWallet,
    payout_address: input.payoutAddress,
    price_usdc: input.priceUsdc,
    chunks_count: chunks.length,
    notes_count: docs.length,
    domains: input.domains,
    public: input.public,
    preview_chunks: previewChunks,
  };

  const inserted = await admin
    .from("vaults")
    .insert(insert)
    .select()
    .single();

  if (inserted.error) {
    // Roll back storage upload so we never have an orphan index.
    await admin.storage.from(VAULT_INDEX_BUCKET).remove([path]).catch(() => {});
    if (inserted.error.code === "23505") {
      return { ok: false, reason: "slug already taken", field: "slug" };
    }
    return { ok: false, reason: `database insert failed: ${inserted.error.message}` };
  }

  return {
    ok: true,
    vault: inserted.data,
    chunksCount: chunks.length,
    notesCount: docs.length,
  };
}

function checkBundleSize(
  files: readonly InMemoryFile[],
): { ok: true } | { ok: false; reason: string; field: string } {
  let total = 0;
  for (const file of files) {
    const size = byteLength(file.content);
    if (size > FILE_CONTENT_MAX_BYTES) {
      return {
        ok: false,
        reason: `${file.source}: exceeds ${FILE_CONTENT_MAX_BYTES.toLocaleString()} byte limit`,
        field: "files",
      };
    }
    total += size;
  }
  if (total > TOTAL_BUNDLE_MAX_BYTES) {
    return {
      ok: false,
      reason: `bundle exceeds ${TOTAL_BUNDLE_MAX_BYTES.toLocaleString()} byte total limit`,
      field: "files",
    };
  }
  return { ok: true };
}

function byteLength(s: string): number {
  return Buffer.byteLength(s, "utf8");
}

// Re-export the chunk type so the seed script + tests can use it without
// reaching into rag internals.
export type { Chunk };
