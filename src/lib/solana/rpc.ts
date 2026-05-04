import { z } from "zod";
import { env } from "../env";

const RpcEnvelopeSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  result: z.unknown().optional(),
  error: z.object({ code: z.number(), message: z.string() }).optional(),
});

const SignatureInfoSchema = z.object({
  signature: z.string(),
  slot: z.number().int(),
  blockTime: z.number().int().nullable().optional(),
  err: z.unknown().nullable(),
});

const TokenBalanceSchema = z.object({
  accountIndex: z.number().int(),
  mint: z.string(),
  owner: z.string().optional(),
  uiTokenAmount: z.object({ amount: z.string() }),
});

const ParsedTransactionSchema = z
  .object({
    slot: z.number().int(),
    blockTime: z.number().int().nullable(),
    meta: z
      .object({
        err: z.unknown().nullable(),
        preTokenBalances: z.array(TokenBalanceSchema).nullable().optional(),
        postTokenBalances: z.array(TokenBalanceSchema).nullable().optional(),
      })
      .nullable(),
  })
  .nullable();

export type SignatureInfo = z.infer<typeof SignatureInfoSchema>;
export type ParsedTransaction = NonNullable<z.infer<typeof ParsedTransactionSchema>>;

let nextRpcId = 1;

async function rpcCall<T>(
  method: string,
  params: readonly unknown[],
  resultSchema: z.ZodType<T>,
): Promise<T> {
  const id = nextRpcId++;
  const res = await fetch(env.SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  if (!res.ok) {
    throw new Error(`RPC ${method} HTTP ${res.status}: ${await res.text()}`);
  }
  const envelope = RpcEnvelopeSchema.parse(await res.json());
  if (envelope.error) {
    throw new Error(`RPC ${method} error ${envelope.error.code}: ${envelope.error.message}`);
  }
  return resultSchema.parse(envelope.result);
}

interface SignaturesParams {
  readonly limit: number;
  readonly before?: string;
}

export function getSignaturesForAddress(
  address: string,
  params: SignaturesParams,
): Promise<SignatureInfo[]> {
  const opts: Record<string, unknown> = { limit: params.limit };
  if (params.before) opts.before = params.before;
  return rpcCall("getSignaturesForAddress", [address, opts], z.array(SignatureInfoSchema));
}

export function getParsedTransaction(
  signature: string,
): Promise<ParsedTransaction | null> {
  return rpcCall(
    "getTransaction",
    [
      signature,
      {
        encoding: "jsonParsed",
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      },
    ],
    ParsedTransactionSchema,
  );
}
