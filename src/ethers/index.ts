import {
  JsonRpcApiProvider,
  TypedDataDomain,
  TypedDataEncoder,
  TypedDataField,
  ethers,
  getBytes,
  toBeHex,
} from "ethers";
import { SignerSession } from "../signer_session";
import { CubeSignerResponse } from "../response";
import { BlobSignRequest, EvmSignRequest, MfaRequestInfo } from "../schema_types";
import { KeyInfo } from "../key";
import assert from "assert";

/** Options for the signer */
interface SignerOptions {
  /** Optional provider to use */
  provider?: null | ethers.Provider;
  /**
   * The function to call when MFA information is retrieved. If this callback
   * throws, no transaction is broadcast.
   */
  onMfaPoll?: (arg0: MfaRequestInfo) => void;
  /**
   * The amount of time (in milliseconds) to wait between checks for MFA
   * updates. Default is 1000ms
   */
  mfaPollIntervalMs?: number;
}

/**
 * A ethers.js Signer using CubeSigner
 */
export class Signer extends ethers.AbstractSigner {
  /** The address of the account */
  readonly #address: string;

  /** The key to use for signing */
  #key?: KeyInfo;

  /** The underlying session */
  readonly #signerSession: SignerSession;

  /**
   * The function to call when MFA information is retrieved. If this callback
   * throws, no transaction is broadcast.
   */
  readonly #onMfaPoll: (arg0: MfaRequestInfo) => void;

  /** The amount of time to wait between checks for MFA updates */
  readonly #mfaPollIntervalMs: number;

  /**
   * Create new Signer instance
   * @param {KeyInfo | string} address The key or the eth address of the account to use.
   * @param {SignerSession} signerSession The underlying Signer session.
   * @param {SignerOptions} options The options to use for the Signer instance
   */
  constructor(address: KeyInfo | string, signerSession: SignerSession, options?: SignerOptions) {
    super(options?.provider);
    if (typeof address === "string") {
      this.#address = address;
    } else {
      this.#address = address.materialId;
      this.#key = address as KeyInfo;
    }
    this.#signerSession = signerSession;
    this.#onMfaPoll = options?.onMfaPoll ?? ((/* _mfaInfo: MfaRequestInfo */) => {}); // eslint-disable-line @typescript-eslint/no-empty-function
    this.#mfaPollIntervalMs = options?.mfaPollIntervalMs ?? 1000;
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
    return new Signer(this.#address, this.#signerSession, { provider });
  }

  /**
   * Construct a signing request from a transaction. This populates the transaction
   * type to `0x02` (EIP-1559) unless set.
   *
   * @param {ethers.TransactionRequest} tx The transaction
   * @return {EvmSignRequest} The EVM sign request to be sent to CubeSigner
   */
  async evmSignRequestFromTx(tx: ethers.TransactionRequest): Promise<EvmSignRequest> {
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

    return <EvmSignRequest>{
      chain_id: Number(chainId),
      tx: rpcTx,
    };
  }

  /**
   * Sign a transaction. This method will block if the key requires MFA approval.
   * @param {ethers.TransactionRequest} tx The transaction to sign.
   * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    const req = await this.evmSignRequestFromTx(tx);
    const res = await this.#signerSession.signEvm(this.#address, req);
    const data = await this.#handleMfa(res);
    return data.rlp_signed_tx;
  }

  /**
   * Signs arbitrary messages. This uses ethers.js's [hashMessage](https://docs.ethers.org/v6/api/hashing/#hashMessage)
   * to compute the EIP-191 digest and signs this digest using {@link Key#signBlob}.
   * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
   * @param {string | Uint8Array} message The message to sign.
   * @return {Promise<string>} The signature.
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    const digest = ethers.hashMessage(message);
    return this.signBlob(digest);
  }

  /**
   * Signs EIP-712 typed data. This uses ethers.js's
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

  /**
   * Sign arbitrary digest. This uses {@link Key#signBlob}.
   * @param {string} digest The digest to sign.
   * @return {Promise<string>} The signature.
   */
  private async signBlob(digest: string): Promise<string> {
    const blobReq = <BlobSignRequest>{
      message_base64: Buffer.from(getBytes(digest)).toString("base64"),
    };
    // Get the key corresponding to this address
    if (this.#key === undefined) {
      const key = (await this.#signerSession.keys()).find((k) => k.material_id === this.#address);
      if (key === undefined) {
        throw new Error(`Cannot access key '${this.#address}'`);
      }
      this.#key = key;
    }

    const res = await this.#signerSession.signBlob(this.#key.key_id, blobReq);
    const data = await this.#handleMfa(res);

    const signature = data.signature;
    assert(signature.startsWith("0x"));
    assert(signature.length == 132);
    const vAdj = (parseInt(signature.slice(130), 16) + 27).toString(16);
    return signature.slice(0, 130) + vAdj;
  }

  /**
   * Initialize the signing a message using MFA approvals. This method populates
   * missing fields. If the signing does not require MFA, this method throws.
   * @param {ethers.TransactionRequest} tx The transaction to send.
   * @return {string} The MFA id associated with the signing request.
   */
  async sendTransactionMfaInit(tx: ethers.TransactionRequest): Promise<string> {
    const popTx = await this.populateTransaction(tx);
    const req = await this.evmSignRequestFromTx(popTx);
    const res = await this.#signerSession.signEvm(this.#address, req);
    return res.mfaId();
  }

  /**
   * Send a transaction from an approved MFA request. The MFA request contains
   * information about the approved signing request, which this method will
   * execute.
   * @param {MfaRequestInfo} mfaInfo The approved MFA request.
   * @return {ethers.TransactionResponse} The result of submitting the transaction
   */
  async sendTransactionMfaApproved(mfaInfo: MfaRequestInfo): Promise<ethers.TransactionResponse> {
    if (!mfaInfo.request.path.includes("/eth1/sign/")) {
      throw new Error(`Expected EVM transaction signing request, got ${mfaInfo.request.path}`);
    }
    if (!mfaInfo.request.path.includes(this.#address)) {
      throw new Error(
        `Expected signing request for ${this.#address} but got ${mfaInfo.request.path}`,
      );
    }

    const signedTx = await this.#signerSession.signEvm(
      this.#address,
      mfaInfo.request.body as EvmSignRequest,
      {
        mfaId: mfaInfo.id,
        mfaOrgId: this.#signerSession.orgId,
        mfaConf: mfaInfo.receipt!.confirmation,
      },
    );
    return await this.provider!.broadcastTransaction(signedTx.data().rlp_signed_tx);
  }

  /**
   * If the sign request requires MFA, this method waits for approvals
   * @param {CubeSignerResponse<U>} res The response of a sign request
   * @return {Promise<U>} The sign data after MFA approvals
   */
  async #handleMfa<U>(res: CubeSignerResponse<U>): Promise<U> {
    while (res.requiresMfa()) {
      await new Promise((resolve) => setTimeout(resolve, this.#mfaPollIntervalMs));

      const mfaId = res.mfaId();
      const mfaInfo = await this.#signerSession.getMfaInfo(mfaId);
      this.#onMfaPoll(mfaInfo);
      if (mfaInfo.receipt) {
        res = await res.signWithMfaApproval({
          mfaId,
          mfaOrgId: this.#signerSession.orgId,
          mfaConf: mfaInfo.receipt.confirmation,
        });
      }
    }
    return res.data();
  }
}
