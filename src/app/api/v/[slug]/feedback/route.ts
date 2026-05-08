/**
 * /api/v/[slug]/feedback — vault satisfaction signal.
 *
 * Free, rate-limited. Agents POST after a paid query to register whether
 * the snippets were useful. The DB trigger keeps vaults.useful_count +
 * useful_rate synced; list_vaults reads stay one-shot.
 *
 * Idempotency comes from a UNIQUE(signature) constraint — retrying with
 * the same on-chain settlement signature returns 200 without inflating.
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  FeedbackBodySchema,
  getPublicVaultBySlug,
  submitVaultFeedback,
} from "@/lib/vaults";
import { Limits, clientKey, rateLimit } from "@/lib/ratelimit";
import { logAndSanitize, zodFieldError } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ slug: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  const limited = await rateLimit(
    clientKey(request, `feedback:${slug}`),
    Limits.vaultFeedback,
  );
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: "rate limit exceeded — slow down on feedback for this vault",
        retry_after_ms: limited.retryAfterMs,
      },
      {
        status: 429,
        headers: {
          "retry-after": Math.ceil(limited.retryAfterMs / 1000).toString(),
        },
      },
    );
  }

  const vault = await getPublicVaultBySlug(slug);
  if (!vault) {
    return NextResponse.json(
      { error: `vault "${slug}" not found or not public` },
      { status: 404 },
    );
  }

  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = FeedbackBodySchema.safeParse(raw);
  if (!parsed.success) {
    const safe = zodFieldError(parsed.error, "feedback.body");
    return NextResponse.json(
      { error: safe.error, field: safe.field },
      { status: safe.status },
    );
  }

  try {
    const result = await submitVaultFeedback(vault.slug, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason },
        { status: result.status },
      );
    }
    return NextResponse.json({
      vault_slug: result.vault_slug,
      signature: result.signature,
      useful: result.useful,
      idempotent: result.idempotent,
    });
  } catch (err) {
    const safe = logAndSanitize(err, {
      event: "feedback.submit",
      publicMessage: "could not record feedback",
      status: 500,
    });
    return NextResponse.json({ error: safe.error }, { status: safe.status });
  }
}
