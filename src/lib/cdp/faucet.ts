import { getCdpClient } from "./client";

export type FaucetToken = "sol" | "usdc";

export interface RequestFaucetInput {
  readonly address: string;
  readonly token: FaucetToken;
}

export async function requestDevnetFaucet(input: RequestFaucetInput): Promise<string> {
  const result = await getCdpClient().solana.requestFaucet({
    address: input.address,
    token: input.token,
  });
  return result.signature;
}
