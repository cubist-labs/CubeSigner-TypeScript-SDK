import {
  JsonRpcApiProvider,
  TypedDataDomain,
  TypedDataEncoder,
  TypedDataField,
  ethers,
  getBytes,
  toBeHex,
} from "ethers";
import { BlobSignRequest, EvmSignRequest, SignerSession } from "../signer_session";
import { Key } from "../key";

/**
 * A ethers.js Signer using CubeSigner
 */
export class Signer extends ethers.AbstractSigner {
  /** The address of the account */
  readonly #address: string;

  /** The key to use for signing */
  #key?: Key;

  /** The underlying session */
  readonly #signerSession: SignerSession;

  /** Create new Signer instance
   * @param {string} address The address of the account to use.
   * @param {SignerSession} signerSession The underlying Signer session.
   * @param {null | ethers.Provider} provider The optional provider instance to use.
   */
  constructor(address: string, signerSession: SignerSession, provider?: null | ethers.Provider) {
    super(provider);
    this.#address = address;
    this.#signerSession = signerSession;
  }

  /** Resolves to the signer address. */
  async getAddress(): Promise<string> {
    return this.#address;
  }

  /**
   *  Returns the signer connected to %%provider%%.
   *  @param {null | ethers.Provider} provider The optional provider instance to use.
   *  @return {Signer} The signer connected to signer.
   */
  connect(provider: null | ethers.Provider): Signer {
    return new Signer(this.#address, this.#signerSession, provider);
  }

  /**
   * Signs a transaction. This populates the transaction type to `0x02` (EIP-1559) unless set.
   * @param {ethers.TransactionRequest} tx The transaction to sign.
   * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    // get the chain id from the network or tx
    let chainId = tx.chainId;
    if (chainId === undefined) {
      const network = await this.provider?.getNetwork();
      chainId = network?.chainId?.toString() ?? "1";
    }

    // Convert the transaction into a JSON-RPC transaction
    const rpcTx =
      this.provider instanceof JsonRpcApiProvider
        ? this.provider.getRpcTransaction(tx)
        : // We can just call the getRpcTransaction with a
          // null receiver since it doesn't actually use it
          // (and really should be declared static).
          JsonRpcApiProvider.prototype.getRpcTransaction.call(null, tx);
    rpcTx.type = toBeHex(tx.type ?? 0x02, 1); // we expect 0x0[0-2]

    const req = <EvmSignRequest>{
      chain_id: Number(chainId),
      tx: rpcTx,
    };
    const sig = await this.#signerSession.signEvm(this.#address, req);
    return sig.data().rlp_signed_tx;
  }

  /** Signs arbitrary messages. This uses ethers.js's [hashMessage](https://docs.ethers.org/v6/api/hashing/#hashMessage)
   * to compute the EIP-191 digest and signs this digest using {@link Key#signBlob}.
   * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
   * @param {string | Uint8Array} message The message to sign.
   * @return {Promise<string>} The signature.
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    const digest = ethers.hashMessage(message);
    return this.signBlob(digest);
  }

  /** Signs EIP-712 typed data. This uses ethers.js's
   * [TypedDataEncoder.hash](https://docs.ethers.org/v6/api/hashing/#TypedDataEncoder_hash)
   * to compute the EIP-712 digest and signs this digest using {@link Key#signBlob}.
   * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
   * @param {TypedDataDomain} domain The domain of the typed data.
   * @param {Record<string, Array<TypedDataField>>} types The types of the typed data.
   * @param {Record<string, any>} value The value of the typed data.
   * @return {Promise<string>} The signature.
   */
  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<string> {
    const digest = TypedDataEncoder.hash(domain, types, value);
    return this.signBlob(digest);
  }

  /** Sign arbitrary digest. This uses {@link Key#signBlob}.
   * @param {string} digest The digest to sign.
   * @return {Promise<string>} The signature.
   */
  private async signBlob(digest: string): Promise<string> {
    const blobReq = <BlobSignRequest>{
      message_base64: Buffer.from(getBytes(digest)).toString("base64"),
    };
    // Get the key corresponding to this address
    if (this.#key === undefined) {
      const key = (await this.#signerSession.keys()).find((k) => k.materialId === this.#address);
      if (key === undefined) {
        throw new Error(`Cannot access key '${this.#address}'`);
      }
      this.#key = key;
    }
    // sign
    const result = await this.#signerSession.signBlob(this.#key, blobReq);
    return result.data().signature;
  }
}
