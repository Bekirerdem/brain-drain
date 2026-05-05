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

const DEFAULT_ATTEMPTS = 3;
const BACKOFF_MS = [0, 250, 750] as const;

let nextRpcId = 1;

class RpcError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rpcCall<T>(
  method: string,
  params: readonly unknown[],
  resultSchema: z.ZodType<T>,
  attempts: number = DEFAULT_ATTEMPTS,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(BACKOFF_MS[Math.min(i, BACKOFF_MS.length - 1)]);
    try {
      return await rpcCallOnce(method, params, resultSchema);
    } catch (err) {
      lastErr = err;
      if (err instanceof RpcError && !err.retryable) throw err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`RPC ${method} failed after ${attempts} attempts`);
}

async function rpcCallOnce<T>(
  method: string,
  params: readonly unknown[],
  resultSchema: z.ZodType<T>,
): Promise<T> {
  const id = nextRpcId++;
  let res: Response;
  try {
    res = await fetch(env.SOLANA_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    });
  } catch (err) {
    // network-level failures (DNS, timeout, TLS) — always retryable
    throw new RpcError(`RPC ${method} network error: ${String(err)}`, true);
  }
  if (!res.ok) {
    const retryable = res.status === 429 || res.status >= 500;
    const body = await res.text().catch(() => "");
    throw new RpcError(`RPC ${method} HTTP ${res.status}: ${body}`, retryable);
  }
  const envelope = RpcEnvelopeSchema.parse(await res.json());
  if (envelope.error) {
    // JSON-RPC errors are logic-level — not retryable.
    throw new RpcError(
      `RPC ${method} error ${envelope.error.code}: ${envelope.error.message}`,
      false,
    );
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
