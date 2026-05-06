/**
 * In-process token bucket rate limiter.
 *
 * Multi-instance caveat: each Vercel function instance owns its own buckets,
 * so a determined attacker hitting many instances simultaneously could
 * exceed the nominal per-instance limit. For hackathon scope (single
 * region, low traffic) this is acceptable. v1 swap-in target:
 * @upstash/ratelimit + @upstash/redis for distributed counters.
 *
 * Bucket keys are arbitrary — typically `${route}:${ip}` or
 * `${route}:${wallet}` once an authenticated identity is available.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface Limit {
  /** Max tokens (also = burst capacity). */
  readonly capacity: number;
  /** ms over which `capacity` tokens are refilled linearly. */
  readonly intervalMs: number;
}

export interface RateLimitResult {
  readonly ok: boolean;
  readonly remaining: number;
  /** ms until next token is available (0 if `ok`). */
  readonly retryAfterMs: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5_000;

/** Common limits, named so calling code stays self-documenting. */
export const Limits = {
  /** Vault uploads — expensive (Gemini embeds + storage write). */
  vaultUpload: { capacity: 5, intervalMs: 60 * 60 * 1000 } satisfies Limit,
  /** Auth challenge issuance — cheap but spammable. */
  authChallenge: { capacity: 30, intervalMs: 60 * 1000 } satisfies Limit,
  /** Auth verify — slow ed25519 + DB delete; brute-force surface. */
  authVerify: { capacity: 10, intervalMs: 60 * 1000 } satisfies Limit,
  /** Waitlist — email signups; modest spam protection. */
  waitlist: { capacity: 5, intervalMs: 10 * 60 * 1000 } satisfies Limit,
} as const;

export function rateLimit(key: string, limit: Limit): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  const refillRate = limit.capacity / limit.intervalMs; // tokens per ms

  let tokens: number;
  if (!existing) {
    tokens = limit.capacity;
  } else {
    const elapsed = now - existing.lastRefill;
    tokens = Math.min(limit.capacity, existing.tokens + elapsed * refillRate);
  }

  if (tokens < 1) {
    buckets.set(key, { tokens, lastRefill: now });
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.ceil((1 - tokens) / refillRate),
    };
  }

  tokens -= 1;
  buckets.set(key, { tokens, lastRefill: now });

  // Cheap eviction — drop oldest when map grows too large.
  if (buckets.size > MAX_KEYS) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey !== undefined) buckets.delete(oldestKey);
  }

  return {
    ok: true,
    remaining: Math.floor(tokens),
    retryAfterMs: 0,
  };
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
