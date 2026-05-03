import { env } from "../env";
import { getUsdcMint, USDC_DECIMALS, usdcToAtomic } from "../solana";
import { toX402Network } from "./network";
import {
  PaymentChallengeBodySchema,
  X402_VERSION,
  type PaymentChallengeBody,
  type PaymentRequirements,
} from "./types";

export interface BuildRequirementsOptions {
  readonly resource: string;
  readonly description: string;
  readonly priceUsdc?: number;
  readonly maxTimeoutSeconds?: number;
  readonly mimeType?: string;
}

const DEFAULT_TIMEOUT_SEC = 300;
const DEFAULT_MIME = "application/json";

export function buildPaymentRequirements(
  options: BuildRequirementsOptions,
): PaymentRequirements {
  const priceUsdc = options.priceUsdc ?? env.X402_DEFAULT_PRICE_USDC;
  return {
    scheme: "exact",
    network: toX402Network(env.SOLANA_NETWORK),
    maxAmountRequired: usdcToAtomic(priceUsdc).toString(),
    resource: options.resource,
    description: options.description,
    mimeType: options.mimeType ?? DEFAULT_MIME,
    payTo: env.SELLER_SOLANA_ADDRESS,
    maxTimeoutSeconds: options.maxTimeoutSeconds ?? DEFAULT_TIMEOUT_SEC,
    asset: getUsdcMint(),
    extra: { name: "USDC", decimals: USDC_DECIMALS },
  };
}

export function buildChallengeBody(
  requirements: PaymentRequirements,
  error?: string,
): PaymentChallengeBody {
  const body: PaymentChallengeBody = {
    x402Version: X402_VERSION,
    accepts: [requirements],
    ...(error ? { error } : {}),
  };
  return PaymentChallengeBodySchema.parse(body);
}

export function challengeResponse(
  requirements: PaymentRequirements,
  error?: string,
): Response {
  return Response.json(buildChallengeBody(requirements, error), {
    status: 402,
    headers: {
      "WWW-Authenticate": `x402 scheme="exact", network="${requirements.network}"`,
      "Cache-Control": "no-store",
    },
  });
}
