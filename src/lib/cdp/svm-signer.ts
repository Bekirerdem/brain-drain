import {
  address as toAddress,
  getBase64Encoder,
  getBase64EncodedWireTransaction,
  getTransactionDecoder,
  type Address,
  type Transaction,
  type TransactionModifyingSigner,
  type TransactionWithLifetime,
  type TransactionWithinSizeLimit,
} from "@solana/kit";
import type { BuyerAccount } from "./account";

type SignableInput = Transaction | (Transaction & TransactionWithLifetime);
type SignedOutput = Transaction & TransactionWithinSizeLimit & TransactionWithLifetime;

const base64 = getBase64Encoder();
const txDecoder = getTransactionDecoder();

export function cdpAccountToSvmSigner(account: BuyerAccount): TransactionModifyingSigner {
  const addr = toAddress(account.address) as Address;
  return {
    address: addr,
    async modifyAndSignTransactions(
      transactions: readonly SignableInput[],
    ): Promise<readonly SignedOutput[]> {
      return Promise.all(
        transactions.map(async (tx) => {
          const wire = getBase64EncodedWireTransaction(tx as SignedOutput);
          const { signedTransaction } = await account.signTransaction({ transaction: wire });
          const signedBytes = base64.encode(signedTransaction);
          return txDecoder.decode(signedBytes) as SignedOutput;
        }),
      );
    },
  };
}
