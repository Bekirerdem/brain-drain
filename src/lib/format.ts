/**
 * UI formatting helpers for on-chain data display.
 * Pure functions — safe to import from server and client components.
 */

export function truncateMiddle(value: string, head = 4, tail = 4): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function truncateSignature(sig: string): string {
  return truncateMiddle(sig, 6, 6);
}

export function truncateAddress(addr: string): string {
  return truncateMiddle(addr, 4, 4);
}

const TIME_UNITS = [
  { limit: 60, divisor: 1, suffix: "s" },
  { limit: 3600, divisor: 60, suffix: "m" },
  { limit: 86400, divisor: 3600, suffix: "h" },
  { limit: 604800, divisor: 86400, suffix: "d" },
] as const;

export function timeAgo(unixSeconds: number, now: number = Date.now()): string {
  const diff = Math.max(0, Math.floor(now / 1000 - unixSeconds));
  if (diff < 5) return "just now";
  for (const u of TIME_UNITS) {
    if (diff < u.limit) return `${Math.floor(diff / u.divisor)}${u.suffix} ago`;
  }
  return `${Math.floor(diff / 604800)}w ago`;
}

const USDC_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsdc(amount: number): string {
  return USDC_FORMAT.format(amount);
}

export type SolanaCluster = "devnet" | "mainnet-beta";

export function solscanTxUrl(signature: string, network: SolanaCluster): string {
  const cluster = network === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/tx/${signature}${cluster}`;
}

export function solscanAddressUrl(address: string, network: SolanaCluster): string {
  const cluster = network === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/account/${address}${cluster}`;
}
