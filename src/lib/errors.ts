/**
 * Error helpers for API routes.
 *
 * BD-08 fix: keep raw upstream errors (Supabase schema hints, Zod issue
 * paths, internal stack traces) on the server side; clients see a
 * coarse, intent-aligned message. Logs are structured so they remain
 * grep-able in Vercel function logs.
 */

import type { ZodError } from "zod";

interface SafeErrorOptions {
  /** Short event tag for log search, e.g. "vaults.post" */
  readonly event: string;
  /** Public-facing message (must not leak internals). */
  readonly publicMessage: string;
  /** HTTP status the route will return. */
  readonly status: number;
}

interface SafeErrorPayload {
  readonly error: string;
  readonly status: number;
}

export function logAndSanitize(
  err: unknown,
  opts: SafeErrorOptions,
): SafeErrorPayload {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({
      level: "error",
      event: opts.event,
      detail,
      status: opts.status,
      ts: new Date().toISOString(),
    }),
  );
  return { error: opts.publicMessage, status: opts.status };
}

/**
 * Zod issues carry the full schema path/message — useful for clients to
 * highlight a field, but messages can leak schema shape. Return only
 * the first issue's path; let server logs keep the full error.
 */
export function zodFieldError(
  err: ZodError,
  event: string,
): { error: string; field: string | null; status: number } {
  const first = err.issues[0];
  console.error(
    JSON.stringify({
      level: "warn",
      event,
      zod_issues: err.issues.map((i) => ({
        path: i.path.join("."),
        code: i.code,
      })),
      ts: new Date().toISOString(),
    }),
  );
  return {
    error: "invalid input",
    field: first?.path.join(".") ?? null,
    status: 400,
  };
}
