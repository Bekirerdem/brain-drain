import { atomicToUsdc, verifyUsdcPayment, type VerifiedPayment } from "../solana";
import { challengeResponse } from "./challenge";
import { decodeXPaymentHeader, X_PAYMENT_HEADER } from "./header";
import { toX402Network } from "./network";
import { env } from "../env";
import type { PaymentRequirements } from "./types";

export type GateResult =
  | { ok: true; payment: VerifiedPayment }
  | { ok: false; response: Response };

export async function requirePayment(
  request: Request,
  requirements: PaymentRequirements,
): Promise<GateResult> {
  const headerValue = request.headers.get(X_PAYMENT_HEADER);
  const decoded = decodeXPaymentHeader(headerValue);
  if (!decoded.ok) {
    return { ok: false, response: challengeResponse(requirements, decoded.reason) };
  }

  const expectedNetwork = toX402Network(env.SOLANA_NETWORK);
  if (decoded.payload.network !== expectedNetwork) {
    return {
      ok: false,
      response: challengeResponse(
        requirements,
        `network mismatch: expected ${expectedNetwork}, got ${decoded.payload.network}`,
      ),
    };
  }

  const result = await verifyUsdcPayment({
    signature: decoded.payload.payload.transaction,
    expectedRecipient: requirements.payTo,
    expectedAmountUsdc: atomicToUsdc(BigInt(requirements.maxAmountRequired)),
    maxAgeSeconds: requirements.maxTimeoutSeconds,
  });

  if (!result.ok) {
    return { ok: false, response: challengeResponse(requirements, result.reason) };
  }

  return { ok: true, payment: result.payment };
}
