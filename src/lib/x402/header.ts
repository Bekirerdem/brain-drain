import { PaymentPayloadSchema, type PaymentPayload } from "./types";

export const X_PAYMENT_HEADER = "x-payment";
export const X_PAYMENT_RESPONSE_HEADER = "x-payment-response";

export type DecodeResult =
  | { ok: true; payload: PaymentPayload }
  | { ok: false; reason: string };

export function decodeXPaymentHeader(value: string | null): DecodeResult {
  if (!value) return { ok: false, reason: "missing X-Payment header" };
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return { ok: false, reason: "X-Payment header is not valid base64 JSON" };
  }
  const parsed = PaymentPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, reason: `X-Payment payload schema mismatch: ${parsed.error.message}` };
  }
  return { ok: true, payload: parsed.data };
}

export function encodeXPaymentResponse(body: {
  success: boolean;
  transaction: string;
  network: string;
}): string {
  return Buffer.from(JSON.stringify(body), "utf8").toString("base64");
}
