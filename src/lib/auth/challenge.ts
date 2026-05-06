/**
 * One-shot wallet auth challenges, backed by Supabase auth_challenges table.
 *
 * Multi-instance safe (Vercel may spin up multiple function instances) since
 * issue + consume both go through Postgres. 5-minute TTL, deleted on consume
 * (single-use, prevents replay).
 */

import { randomBytes } from "node:crypto";
import bs58 from "bs58";
import { getSupabaseAdmin } from "@/lib/supabase";

const CHALLENGE_PREFIX = "bd-auth";
const NONCE_BYTES = 24;
const TTL_MS = 5 * 60 * 1000;

export async function issueChallenge(wallet: string): Promise<string> {
  const random = bs58.encode(randomBytes(NONCE_BYTES));
  const challenge = `${CHALLENGE_PREFIX}:${wallet}:${Date.now()}:${random}`;
  const admin = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  const { error } = await admin.from("auth_challenges").insert({
    challenge,
    wallet,
    expires_at: expiresAt,
  });
  if (error) {
    throw new Error(`challenge issue failed: ${error.message}`);
  }
  return challenge;
}

export type ConsumeResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function consumeChallenge(args: {
  readonly wallet: string;
  readonly challenge: string;
}): Promise<ConsumeResult> {
  const admin = getSupabaseAdmin();
  const lookup = await admin
    .from("auth_challenges")
    .select("challenge, wallet, expires_at")
    .eq("challenge", args.challenge)
    .maybeSingle();
  if (lookup.error) return { ok: false, reason: "challenge lookup failed" };
  if (!lookup.data) return { ok: false, reason: "challenge not found" };
  if (lookup.data.wallet !== args.wallet) {
    return { ok: false, reason: "wallet mismatch" };
  }
  if (new Date(lookup.data.expires_at).getTime() < Date.now()) {
    await admin.from("auth_challenges").delete().eq("challenge", args.challenge);
    return { ok: false, reason: "challenge expired" };
  }
  await admin.from("auth_challenges").delete().eq("challenge", args.challenge);
  return { ok: true };
}
