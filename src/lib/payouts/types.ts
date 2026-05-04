import { z } from "zod";
import { SolanaAddressSchema, SolanaSignatureSchema } from "../solana";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const PayoutEventSchema = z.object({
  signature: z.string(),
  blockTime: z.number().int(),
  slot: z.number().int(),
  payer: SolanaAddressSchema.or(z.literal("unknown")),
  amountAtomic: z.string(),
  amountUsdc: z.number(),
  mint: SolanaAddressSchema,
});

export type PayoutEvent = z.infer<typeof PayoutEventSchema>;

export const PayoutQuerySchema = z.object({
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  before: SolanaSignatureSchema.optional(),
});

export type PayoutQuery = z.infer<typeof PayoutQuerySchema>;
