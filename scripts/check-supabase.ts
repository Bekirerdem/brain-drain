#!/usr/bin/env bun
/**
 * Verifies Supabase env wiring end-to-end:
 *   1. env.ts zod schema parses without throwing
 *   2. anon client can read public vaults (RLS allows)
 *   3. service-role client can list storage buckets (admin scope)
 *
 * Usage: bun scripts/check-supabase.ts
 */

import { env } from "@/lib/env";
import {
  getSupabaseAdmin,
  getSupabaseAnon,
  VAULT_INDEX_BUCKET,
} from "@/lib/supabase";

function dot(label: string, ok: boolean, detail?: string): void {
  const mark = ok ? "✓" : "✗";
  const tone = ok ? "\x1b[32m" : "\x1b[31m";
  console.log(`${tone}${mark}\x1b[0m ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main(): Promise<void> {
  console.log("\nSupabase env + connectivity check\n");

  dot(
    "env: NEXT_PUBLIC_SUPABASE_URL",
    Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
    env.NEXT_PUBLIC_SUPABASE_URL,
  );
  dot(
    "env: NEXT_PUBLIC_SUPABASE_ANON_KEY",
    Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    `${env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 16)}…`,
  );
  dot(
    "env: SUPABASE_SERVICE_ROLE_KEY",
    Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    env.SUPABASE_SERVICE_ROLE_KEY
      ? `${env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 12)}…`
      : "MISSING",
  );

  console.log();

  // Anon read — should hit RLS public-read policy.
  const anon = getSupabaseAnon();
  const anonRes = await anon
    .from("vaults")
    .select("id, slug, name", { count: "exact" })
    .limit(1);
  dot(
    "anon: select from vaults (public RLS)",
    !anonRes.error,
    anonRes.error?.message ?? `count=${anonRes.count ?? 0}`,
  );

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      "\n\x1b[33m!\x1b[0m skipping admin checks — SUPABASE_SERVICE_ROLE_KEY not set\n",
    );
    process.exit(1);
  }

  // Admin read — bypasses RLS.
  const admin = getSupabaseAdmin();
  const adminRes = await admin
    .from("vaults")
    .select("id", { count: "exact" })
    .limit(1);
  dot(
    "admin: select from vaults (RLS bypass)",
    !adminRes.error,
    adminRes.error?.message ?? `count=${adminRes.count ?? 0}`,
  );

  // Admin storage — list bucket.
  const buckets = await admin.storage.listBuckets();
  const targetBucket = buckets.data?.find((b) => b.name === VAULT_INDEX_BUCKET);
  dot(
    `admin: storage bucket "${VAULT_INDEX_BUCKET}" exists`,
    Boolean(targetBucket),
    targetBucket ? `id=${targetBucket.id}` : (buckets.error?.message ?? "missing"),
  );

  // Admin storage — list objects in bucket (should be empty for now).
  const objs = await admin.storage.from(VAULT_INDEX_BUCKET).list();
  dot(
    `admin: storage list ${VAULT_INDEX_BUCKET}`,
    !objs.error,
    objs.error?.message ?? `${objs.data?.length ?? 0} objects`,
  );

  console.log();
}

main().catch((err) => {
  console.error("\n\x1b[31mFATAL\x1b[0m", err);
  process.exit(1);
});
