import { Connection } from "@solana/web3.js";
import { env } from "../env";

const CONFIRM_TIMEOUT_MS = 30_000;

let cached: Connection | null = null;

export function getConnection(): Connection {
  if (cached) return cached;
  cached = new Connection(env.SOLANA_RPC_URL, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: CONFIRM_TIMEOUT_MS,
  });
  return cached;
}
