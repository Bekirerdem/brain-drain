import type { SolanaNetwork } from "../solana";
import type { X402Network } from "./types";

export function toX402Network(network: SolanaNetwork): X402Network {
  return network === "mainnet-beta" ? "solana" : "solana-devnet";
}

export function fromX402Network(network: X402Network): SolanaNetwork {
  return network === "solana" ? "mainnet-beta" : "devnet";
}
