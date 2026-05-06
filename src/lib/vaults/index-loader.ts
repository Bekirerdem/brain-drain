/**
 * Per-vault embedding index loader with in-process LRU-ish cache.
 *
 * Each /api/v/[slug]/query call needs the vault's IndexFile to run
 * cosine similarity. Pulling the JSON from Supabase Storage on every
 * request would add ~200ms and waste storage bandwidth, so we memoize
 * by slug with a TTL.
 *
 * Cache lives in the Node process. Vercel function instances re-warm
 * the cache on first request; multiple instances may each hold their
 * own copy — acceptable for a read-only payload.
 */

import {
  getSupabaseAdmin,
  VAULT_INDEX_BUCKET,
  vaultIndexPath,
} from "@/lib/supabase";
import { IndexFileSchema, type IndexFile } from "@/lib/rag";

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 32;

interface CacheEntry {
  readonly value: IndexFile;
  readonly loadedAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function getVaultIndex(slug: string): Promise<IndexFile> {
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.loadedAt < TTL_MS) return hit.value;

  const admin = getSupabaseAdmin();
  const path = vaultIndexPath(slug);
  const res = await admin.storage.from(VAULT_INDEX_BUCKET).download(path);
  if (res.error || !res.data) {
    throw new Error(
      `vault index ${slug}: ${res.error?.message ?? "missing data"}`,
    );
  }
  const text = await res.data.text();
  const parsed = IndexFileSchema.parse(JSON.parse(text));

  if (cache.size >= MAX_ENTRIES) {
    // Evict oldest entry (insertion order).
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(slug, { value: parsed, loadedAt: Date.now() });
  return parsed;
}

export function invalidateVaultIndex(slug: string): void {
  cache.delete(slug);
}

export function clearVaultIndexCache(): void {
  cache.clear();
}
