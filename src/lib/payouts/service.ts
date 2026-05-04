import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { env } from "../env";
import { getConnection } from "../solana/connection";
import { atomicToUsdc, getUsdcMint } from "../solana/usdc";
import type { PayoutEvent, PayoutQuery } from "./types";

export async function getSellerPayouts(query: PayoutQuery): Promise<PayoutEvent[]> {
  const conn = getConnection();
  const mintAddress = getUsdcMint();
  const seller = env.SELLER_SOLANA_ADDRESS;
  const sellerAta = getAssociatedTokenAddressSync(
    new PublicKey(mintAddress),
    new PublicKey(seller),
  );

  const signatures = await conn.getSignaturesForAddress(sellerAta, {
    limit: query.limit,
    before: query.before,
  });
  if (signatures.length === 0) return [];

  const txs = await conn.getParsedTransactions(
    signatures.map((s) => s.signature),
    { commitment: "confirmed", maxSupportedTransactionVersion: 0 },
  );

  const events: PayoutEvent[] = [];
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    if (!tx || tx.meta?.err) continue;
    const event = extractPayout(tx, signatures[i]?.signature ?? "", seller, mintAddress);
    if (event) events.push(event);
  }
  return events;
}

interface ParsedTx {
  readonly slot: number;
  readonly blockTime?: number | null;
  readonly meta?: {
    readonly preTokenBalances?: readonly TokenBalance[] | null;
    readonly postTokenBalances?: readonly TokenBalance[] | null;
  } | null;
}

interface TokenBalance {
  readonly accountIndex: number;
  readonly mint: string;
  readonly owner?: string;
  readonly uiTokenAmount: { readonly amount: string };
}

function extractPayout(
  tx: ParsedTx,
  signature: string,
  seller: string,
  mint: string,
): PayoutEvent | null {
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];
  const sellerPost = post.find((b) => b.owner === seller && b.mint === mint);
  if (!sellerPost) return null;

  const sellerPre = pre.find((b) => b.accountIndex === sellerPost.accountIndex);
  const preAmount = BigInt(sellerPre?.uiTokenAmount.amount ?? "0");
  const postAmount = BigInt(sellerPost.uiTokenAmount.amount ?? "0");
  const delta = postAmount - preAmount;
  if (delta <= BigInt(0)) return null;

  const payerCandidate = post.find((b) => b.mint === mint && b.owner !== seller);
  const payer = payerCandidate?.owner ?? "unknown";

  return {
    signature,
    blockTime: tx.blockTime ?? 0,
    slot: tx.slot,
    payer,
    amountAtomic: delta.toString(),
    amountUsdc: atomicToUsdc(delta),
    mint,
  };
}
