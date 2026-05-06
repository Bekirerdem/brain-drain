/**
 * HMAC-signed session cookie (`bd_session`).
 *
 * Stateless: payload `{wallet, exp}` is base64url-encoded, signed with
 * HMAC-SHA256(AUTH_SECRET). No DB lookup per request — cookie itself is
 * the truth, and tampering is impossible without the secret.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "bd_session";
const TTL_MS = 60 * 60 * 1000; // 1 hour
export const SESSION_TTL_SECONDS = TTL_MS / 1000;

export interface SessionPayload {
  readonly wallet: string;
  readonly exp: number;
}

export function createSessionToken(wallet: string): string {
  const payload: SessionPayload = { wallet, exp: Date.now() + TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;
  const expectedSig = sign(payloadB64);
  if (sig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    );
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.wallet !== "string" ||
      typeof decoded.exp !== "number"
    ) {
      return null;
    }
    if (decoded.exp < Date.now()) return null;
    return { wallet: decoded.wallet, exp: decoded.exp };
  } catch {
    return null;
  }
}

function sign(payloadB64: string): string {
  if (!env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET missing — required for session signing");
  }
  return createHmac("sha256", env.AUTH_SECRET)
    .update(payloadB64)
    .digest("base64url");
}
