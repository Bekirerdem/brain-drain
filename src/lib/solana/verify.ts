import { z } from "zod";
import { getParsedTransaction, type ParsedTransaction } from "./rpc";
import { SolanaAddressSchema, SolanaSignatureSchema } from "./types";
import { atomicToUsdc, getUsdcMint, usdcToAtomic } from "./usdc";

const DEFAULT_MAX_AGE_SEC = 300;
const TX_LOOKUP_ATTEMPTS = 4;
const TX_LOOKUP_BACKOFF_MS = [0, 400, 900, 1500] as const;

export const VerifyPaymentInputSchema = z.object({
  signature: SolanaSignatureSchema,
  expectedRecipient: SolanaAddressSchema,
  expectedAmountUsdc: z.number().positive(),
  maxAgeSeconds: z.number().int().positive().default(DEFAULT_MAX_AGE_SEC),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>;

export const VerifiedPaymentSchema = z.object({
  signature: z.string(),
  payerOwner: z.string(),
  recipientOwner: z.string(),
  amountAtomic: z.string(),
  amountUsdc: z.number(),
  mint: z.string(),
  blockTime: z.number().int(),
  slot: z.number().int(),
});

export type VerifiedPayment = z.infer<typeof VerifiedPaymentSchema>;

export type VerifyResult =
  | { ok: true; payment: VerifiedPayment }
  | { ok: false; reason: string; retryable: boolean };

export async function verifyUsdcPayment(raw: unknown): Promise<VerifyResult> {
  const parsed = VerifyPaymentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `invalid input: ${parsed.error.message}`,
      retryable: false,
    };
  }
  const input = parsed.data;

  const tx = await fetchWithIndexingRetry(input.signature);
  if (!tx) {
    return {
      ok: false,
      reason: "transaction not yet indexed by RPC",
      retryable: true,
    };
  }
  if (tx.meta?.err) {
    return {
      ok: false,
      reason: "transaction failed on chain",
      retryable: false,
    };
  }

  const blockTime = tx.blockTime ?? 0;
  if (!blockTime) {
    return {
      ok: false,
      reason: "transaction missing block time",
      retryable: true,
    };
  }
  const ageSec = Math.floor(Date.now() / 1000) - blockTime;
  if (ageSec > input.maxAgeSeconds) {
    return {
      ok: false,
      reason: `transaction stale (age=${ageSec}s)`,
      retryable: false,
    };
  }

  const expectedMint = getUsdcMint();
  const expectedAtomic = usdcToAtomic(input.expectedAmountUsdc);

  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];

  const recipientPost = post.find(
    (b) => b.owner === input.expectedRecipient && b.mint === expectedMint,
  );
  if (!recipientPost) {
    return {
      ok: false,
      reason: "no USDC credit to recipient",
      retryable: false,
    };
  }

  const recipientPre = pre.find(
    (b) => b.accountIndex === recipientPost.accountIndex,
  );
  const preAmount = BigInt(recipientPre?.uiTokenAmount.amount ?? "0");
  const postAmount = BigInt(recipientPost.uiTokenAmount.amount ?? "0");
  const delta = postAmount - preAmount;

  if (delta < expectedAtomic) {
    return {
      ok: false,
      reason: `underpayment: got ${delta.toString()}, need ${expectedAtomic.toString()}`,
      retryable: false,
    };
  }

  const payerCandidate = post.find(
    (b) => b.mint === expectedMint && b.owner !== input.expectedRecipient,
  );
  const payerOwner = payerCandidate?.owner ?? "unknown";

  return {
    ok: true,
    payment: {
      signature: input.signature,
      payerOwner,
      recipientOwner: input.expectedRecipient,
      amountAtomic: delta.toString(),
      amountUsdc: atomicToUsdc(delta),
      mint: expectedMint,
      blockTime,
      slot: tx.slot,
    },
  };
}

async function fetchWithIndexingRetry(
  signature: string,
): Promise<ParsedTransaction | null> {
  for (let i = 0; i < TX_LOOKUP_ATTEMPTS; i++) {
    if (i > 0) await sleep(TX_LOOKUP_BACKOFF_MS[i]);
    const tx = await getParsedTransaction(signature);
    if (tx) return tx;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
