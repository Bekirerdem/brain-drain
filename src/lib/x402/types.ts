import { z } from "zod";

export const X402_VERSION = 1;

export const X402NetworkSchema = z.enum(["solana-devnet", "solana"]);
export type X402Network = z.infer<typeof X402NetworkSchema>;

export const PaymentRequirementsSchema = z.object({
  scheme: z.literal("exact"),
  network: X402NetworkSchema,
  maxAmountRequired: z.string().regex(/^\d+$/),
  resource: z.string().url(),
  description: z.string(),
  mimeType: z.string(),
  payTo: z.string().min(32).max(44),
  maxTimeoutSeconds: z.number().int().positive(),
  asset: z.string().min(32).max(44),
  extra: z
    .object({
      name: z.string(),
      decimals: z.number().int().nonnegative(),
    })
    .optional(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

export const PaymentChallengeBodySchema = z.object({
  x402Version: z.literal(X402_VERSION),
  accepts: z.array(PaymentRequirementsSchema).min(1),
  error: z.string().optional(),
});

export type PaymentChallengeBody = z.infer<typeof PaymentChallengeBodySchema>;

export const PaymentPayloadSchema = z.object({
  x402Version: z.literal(X402_VERSION),
  scheme: z.literal("exact"),
  network: X402NetworkSchema,
  payload: z.object({
    transaction: z.string().min(60).max(120),
  }),
});

export type PaymentPayload = z.infer<typeof PaymentPayloadSchema>;
