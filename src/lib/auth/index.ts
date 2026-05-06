import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export { verifyWalletSignature, type VerifyArgs } from "./signature";
export {
  issueChallenge,
  consumeChallenge,
  type ConsumeResult,
} from "./challenge";
export {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./session";

/**
 * Reads bd_session cookie from a Next.js request and returns the
 * authenticated wallet, or null if the cookie is missing/invalid/expired.
 * Does not throw — routes can branch on `=== null` for 401 handling.
 */
export function getSessionWallet(request: NextRequest): string | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  const payload = verifySessionToken(cookie.value);
  return payload?.wallet ?? null;
}
