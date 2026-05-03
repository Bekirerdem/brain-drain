import { z } from "zod";

const BASE58_MIN = 32;
const BASE58_MAX = 44;
const SIGNATURE_MIN = 60;
const SIGNATURE_MAX = 120;

export const SolanaAddressSchema = z.string().min(BASE58_MIN).max(BASE58_MAX);
export const SolanaSignatureSchema = z
  .string()
  .min(SIGNATURE_MIN)
  .max(SIGNATURE_MAX);

export const SolanaNetworkSchema = z.enum(["devnet", "mainnet-beta"]);

export type SolanaAddress = z.infer<typeof SolanaAddressSchema>;
export type SolanaSignature = z.infer<typeof SolanaSignatureSchema>;
export type SolanaNetwork = z.infer<typeof SolanaNetworkSchema>;
