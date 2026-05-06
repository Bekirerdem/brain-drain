/**
 * Solana ed25519 signature verification.
 *
 * Phantom's signMessage produces (signature, publicKey) over a UTF-8 message.
 * Server reproduces the message bytes from the original challenge string,
 * decodes signature + wallet from base58, then runs nacl.sign.detached.verify.
 *
 * Pure server function — never imported from the browser bundle.
 */

import nacl from "tweetnacl";
import bs58 from "bs58";

const SIGNATURE_BYTES = 64;
const PUBLIC_KEY_BYTES = 32;

export interface VerifyArgs {
  readonly wallet: string;
  readonly challenge: string;
  readonly signature: string;
}

export function verifyWalletSignature(args: VerifyArgs): boolean {
  try {
    const message = new TextEncoder().encode(args.challenge);
    const signatureBytes = bs58.decode(args.signature);
    const publicKeyBytes = bs58.decode(args.wallet);
    if (signatureBytes.length !== SIGNATURE_BYTES) return false;
    if (publicKeyBytes.length !== PUBLIC_KEY_BYTES) return false;
    return nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}
