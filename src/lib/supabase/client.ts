/**
 * Supabase clients.
 *
 * - `getSupabaseAdmin()` — service-role, bypasses RLS, server-only.
 *   Use for upload routes that mutate vaults table after wallet-sig verification.
 *
 * - `getSupabaseAnon()` — anon/publishable key, respects RLS.
 *   Use for public reads (vault directory, vault detail page).
 *
 * Both are lazily memoized; the modules importing this file only initialize
 * the client they need.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";
import type { Database } from "./types";

let adminCache: SupabaseClient<Database> | null = null;
let anonCache: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (adminCache) return adminCache;
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — required for server-side admin client",
    );
  }
  adminCache = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" },
    },
  );
  return adminCache;
}

export function getSupabaseAnon(): SupabaseClient<Database> {
  if (anonCache) return anonCache;
  anonCache = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" },
    },
  );
  return anonCache;
}

export const VAULT_INDEX_BUCKET = "vault-indexes";

export function vaultIndexPath(slug: string): string {
  return `${slug}/index.json`;
}
