import { env } from "../env";

export const USDC_DECIMALS = 6;
const USDC_UNIT = 10 ** USDC_DECIMALS;

export function getUsdcMint(): string {
  return env.SOLANA_NETWORK === "mainnet-beta"
    ? env.USDC_MINT_MAINNET
    : env.USDC_MINT_DEVNET;
}

export function usdcToAtomic(usdc: number): bigint {
  return BigInt(Math.round(usdc * USDC_UNIT));
}

export function atomicToUsdc(atomic: bigint): number {
  return Number(atomic) / USDC_UNIT;
}
