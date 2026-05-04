import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { env } from "../env";
import { atomicToUsdc, getUsdcMint } from "../solana/usdc";
import {
  getParsedTransaction,
  getSignaturesForAddress,
  type ParsedTransaction,
} from "../solana/rpc";
import type { PayoutEvent, PayoutQuery } from "./types";

const RPC_THROTTLE_MS = 150;

export async function getSellerPayouts(query: PayoutQuery): Promise<PayoutEvent[]> {
  const mintAddress = getUsdcMint();
  const seller = env.SELLER_SOLANA_ADDRESS;
  const sellerAta = getAssociatedTokenAddressSync(
    new PublicKey(mintAddress),
    new PublicKey(seller),
  ).toBase58();

  const signatures = await getSignaturesForAddress(sellerAta, {
    limit: query.limit,
    before: query.before,
  });
  if (signatures.length === 0) return [];

  const events: PayoutEvent[] = [];
  for (const [i, sig] of signatures.entries()) {
    if (i > 0) await sleep(RPC_THROTTLE_MS);
    const tx = await getParsedTransaction(sig.signature);
    if (!tx || tx.meta?.err) continue;
    const event = extractPayout(tx, sig.signature, seller, mintAddress);
    if (event) events.push(event);
  }
  return events;
}

function extractPayout(
  tx: ParsedTransaction,
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
