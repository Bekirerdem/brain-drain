import {
  address as toAddress,
  getBase58Encoder,
  getBase64EncodedWireTransaction,
  type Address,
  type SignatureDictionary,
  type Transaction,
  type TransactionPartialSigner,
  type TransactionWithinSizeLimit,
  type TransactionWithLifetime,
} from "@solana/kit";
import type { BuyerAccount } from "./account";

type SignableTransaction = Transaction & TransactionWithinSizeLimit & TransactionWithLifetime;

const base58 = getBase58Encoder();

export function cdpAccountToSvmSigner(account: BuyerAccount): TransactionPartialSigner {
  const addr = toAddress(account.address) as Address;
  return {
    address: addr,
    async signTransactions(
      transactions: readonly SignableTransaction[],
    ): Promise<readonly SignatureDictionary[]> {
      return Promise.all(
        transactions.map(async (tx) => {
          const base64 = getBase64EncodedWireTransaction(tx);
          const { signedTransaction } = await account.signTransaction({ transaction: base64 });
          const signatureBytes = base58.encode(signedTransaction);
          return { [addr]: signatureBytes } as unknown as SignatureDictionary;
        }),
      );
    },
  };
}
