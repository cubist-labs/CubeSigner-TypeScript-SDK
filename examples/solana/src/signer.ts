import { type CubeSignerClient, encodeToBase64 } from "@cubist-labs/cubesigner-sdk";
import type {
  Address,
  SignatureDictionary,
  Transaction,
  TransactionPartialSigner,
  TransactionWithinSizeLimit,
  TransactionWithLifetime,
} from "@solana/kit";
import {
  SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION,
  SolanaError,
  signatureBytes,
} from "@solana/kit";

/**
 * A TransactionPartialSigner powered by CubeSigner.
 */
export class CsTransactionPartialSigner<TAddress extends string = string>
  implements TransactionPartialSigner<TAddress>
{
  /** The Solana address this signer applies to. */
  address: Address<TAddress>;
  /** The CubeSignerClient which has access to sign with `address`. */
  #client: CubeSignerClient;

  /**
   * @param address The Solana address used to sign the message.
   * @param client An authenticated CubeSigner client instance with access to key.
   */
  constructor(address: Address<TAddress>, client: CubeSignerClient) {
    this.address = address;
    this.#client = client;
  }

  /**
   * Signs Solana transactions using the typed CubeSigner `signSolana` endpoint.
   *
   * WARNING: Does not currently support MFA approval.
   *
   * @param transactions Transactions to sign.
   * @returns A SignatureDictionary per transaction holding the necessary signatures.
   * @see {@link https://github.com/anza-xyz/kit/blob/ef25b9ea50b37f9998d66a3cc66b552e8c587144/packages/signers/src/keypair-signer.ts#L123-L131|CryptoKeyPair's signTransaction}, used as a reference
   * @see {@link https://github.com/anza-xyz/kit/blob/ef25b9ea50b37f9998d66a3cc66b552e8c587144/packages/transactions/src/signatures.ts#L69-L125|partiallySignTransaction}, used as a reference
   */
  async signTransactions(
    transactions: readonly (Transaction & TransactionWithinSizeLimit & TransactionWithLifetime)[],
  ): Promise<readonly SignatureDictionary[]> {
    return Promise.all(
      transactions.map(async (transaction) => {
        // If this address is expected to sign this transaction, it should have a `null` value in `transaction.signatures`.
        // If it's `undefined`, then this address isn't expected to be signing this transaction.
        const existingSignature = transaction.signatures[this.address];

        if (existingSignature === undefined) {
          throw new SolanaError(SOLANA_ERROR__TRANSACTION__ADDRESSES_CANNOT_SIGN_TRANSACTION, {
            expectedAddresses: Object.keys(transaction.signatures),
            unexpectedAddresses: this.address,
          });
        }

        const resp = await this.#client.apiClient.signSolana(this.address, {
          message_base64: encodeToBase64(transaction.messageBytes),
        });

        if (resp.requiresMfa()) {
          throw new Error("MFA is currently not supported");
        }

        let { signature: hexEncodedSignature } = resp.data();
        hexEncodedSignature = hexEncodedSignature.replace(/^0x/, "");
        const newSignature = signatureBytes(Buffer.from(hexEncodedSignature, "hex"));

        return Object.freeze({ [this.address]: newSignature });
      }),
    );
  }
}
