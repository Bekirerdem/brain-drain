/**
 * Vault feedback service — agent-submitted satisfaction signal after a
 * paid query. The DB trigger keeps useful_count + useful_rate on the
 * vaults row in sync, so list_vaults reads stay one-shot.
 *
 * Idempotency comes from a UNIQUE(signature) constraint at the DB level:
 * the same on-chain settlement can only generate one feedback row, so
 * a retry-storm cannot inflate counts.
 */

import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const SIGNATURE_MIN = 60;
const SIGNATURE_MAX = 120;

export const FeedbackBodySchema = z.object({
  signature: z.string().min(SIGNATURE_MIN).max(SIGNATURE_MAX),
  useful: z.boolean(),
});

export type FeedbackBody = z.infer<typeof FeedbackBodySchema>;

export type FeedbackResult =
  | { ok: true; vault_slug: string; signature: string; useful: boolean; idempotent: boolean }
  | { ok: false; reason: string; status: number };

export async function submitVaultFeedback(
  vaultSlug: string,
  body: FeedbackBody,
): Promise<FeedbackResult> {
  const admin = getSupabaseAdmin();
  const insert = await admin
    .from("vault_feedback")
    .insert({
      vault_slug: vaultSlug,
      signature: body.signature,
      useful: body.useful,
    })
    .select()
    .single();

  if (!insert.error) {
    return {
      ok: true,
      vault_slug: vaultSlug,
      signature: body.signature,
      useful: body.useful,
      idempotent: false,
    };
  }

  // Duplicate signature — already recorded. Treat as idempotent success
  // so retrying agents see a stable response.
  if (insert.error.code === "23505") {
    return {
      ok: true,
      vault_slug: vaultSlug,
      signature: body.signature,
      useful: body.useful,
      idempotent: true,
    };
  }

  // Foreign-key violation = unknown vault slug.
  if (insert.error.code === "23503") {
    return {
      ok: false,
      reason: `vault "${vaultSlug}" not found`,
      status: 404,
    };
  }

  return {
    ok: false,
    reason: `feedback insert failed: ${insert.error.message}`,
    status: 500,
  };
}
