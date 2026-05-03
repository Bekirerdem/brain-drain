import { CdpClient } from "@coinbase/cdp-sdk";
import { env } from "../env";

let cached: CdpClient | null = null;

export function getCdpClient(): CdpClient {
  if (cached) return cached;
  cached = new CdpClient({
    apiKeyId: env.CDP_API_KEY_ID,
    apiKeySecret: env.CDP_API_KEY_SECRET,
    walletSecret: env.CDP_WALLET_SECRET,
  });
  return cached;
}
