import { getCdpClient } from "./client";

const DEFAULT_BUYER_NAME = "brain-drain-buyer";

export interface GetBuyerAccountOptions {
  readonly name?: string;
}

export async function getOrCreateBuyerAccount(options: GetBuyerAccountOptions = {}) {
  const name = options.name ?? DEFAULT_BUYER_NAME;
  return getCdpClient().solana.getOrCreateAccount({ name });
}

export type BuyerAccount = Awaited<ReturnType<typeof getOrCreateBuyerAccount>>;
