/**
 * Distributed token bucket rate limiter, backed by Postgres
 * (consume_rate_limit_token RPC under SELECT FOR UPDATE row lock).
 *
 * Multi-instance safe — every Vercel function instance shares the same
 * counters via Supabase. Adds one DB roundtrip per limited request,
 * which is acceptable for the rate-prone routes we gate (auth +
 * vault upload + waitlist).
 *
 * Failure mode: fail-OPEN. If Supabase is unreachable, allow the
 * request. Rationale — partial outage shouldn't deny legit users.
 * Attackers exploiting an outage to bypass limits face a separate
 * (more visible) downstream failure anyway.
 */

import { getSupabaseAdmin } from "@/lib/supabase";

interface Limit {
  /** Max tokens (also = burst capacity). */
  readonly capacity: number;
  /** ms over which `capacity` tokens are refilled linearly. */
  readonly intervalMs: number;
}

export interface RateLimitResult {
  readonly ok: boolean;
  readonly remaining: number;
  readonly retryAfterMs: number;
}

export const Limits = {
  vaultUpload: { capacity: 5, intervalMs: 60 * 60 * 1000 } satisfies Limit,
  authChallenge: { capacity: 30, intervalMs: 60 * 1000 } satisfies Limit,
  authVerify: { capacity: 10, intervalMs: 60 * 1000 } satisfies Limit,
  waitlist: { capacity: 5, intervalMs: 10 * 60 * 1000 } satisfies Limit,
  vaultFeedback: { capacity: 30, intervalMs: 10 * 60 * 1000 } satisfies Limit,
} as const;

export async function rateLimit(
  key: string,
  limit: Limit,
): Promise<RateLimitResult> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc("consume_rate_limit_token", {
      p_key: key,
      p_capacity: limit.capacity,
      p_interval_ms: limit.intervalMs,
    });
    if (error || !data || data.length === 0) {
      // Fail open — log so the issue is visible without paging.
      console.error(
        JSON.stringify({
          level: "warn",
          event: "ratelimit.failopen",
          key_prefix: key.slice(0, 32),
          error: error?.message ?? "no rows returned",
        }),
      );
      return { ok: true, remaining: limit.capacity, retryAfterMs: 0 };
    }
    const row = data[0];
    return {
      ok: row.allowed,
      remaining: row.remaining,
      retryAfterMs: Number(row.retry_after_ms),
    };
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "warn",
        event: "ratelimit.exception",
        key_prefix: key.slice(0, 32),
        error: (err as Error).message,
      }),
    );
    return { ok: true, remaining: limit.capacity, retryAfterMs: 0 };
  }
}

/** Extracts a best-effort client identifier from a Next request. */
export function clientKey(request: Request, route: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${route}:${ip}`;
}
