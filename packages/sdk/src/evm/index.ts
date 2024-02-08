import {
  CubeSignerResponse,
  KeyInfo,
  Eip191SignRequest,
  Eip712SignRequest,
  EvmSignRequest,
  MfaRequestInfo,
  SignerSession,
  EvmSignResponse,
} from "../index";

/** Options for the signer */
export interface EvmSignerOptions {
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
 * Signer using CubeSigner, with basic MFA handling.
 * @internal
 */
export class EvmSigner {
  /** The address of the account */
  readonly #address: string;

  /** The key to use for signing */
  #key?: KeyInfo;

  /** The underlying session */
  readonly #signerSession: SignerSession;

  /** Options */
  readonly #options: EvmSignerOptions;

  /** Returns the key address (NOT checksummed) */
  get address() {
    return this.#address;
  }

  /** Returns the underlying signer session */
  get signerSession() {
    return this.#signerSession;
  }

  /** Options */
  get options() {
    return this.#options;
  }

  /**
   * Create new Signer instance
   * @param {KeyInfo | string} address The key or the eth address of the account to use.
   * @param {SignerSession} signerSession The underlying Signer session.
   * @param {EvmSignerOptions} options The options to use for the Signer instance
   */
  constructor(address: KeyInfo | string, signerSession: SignerSession, options?: EvmSignerOptions) {
    if (typeof address === "string") {
      this.#address = address;
    } else {
      this.#address = address.materialId;
      this.#key = address;
    }
    this.#signerSession = signerSession;
    this.#options = <EvmSignerOptions>{
      onMfaPoll: options?.onMfaPoll,
      mfaPollIntervalMs: options?.mfaPollIntervalMs ?? 1000,
    };
  }

  /**
   * Sign a transaction. This method will block if the key requires MFA approval.
   * @param {EvmSignRequest} req The sign request.
   * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransaction(req: EvmSignRequest): Promise<string> {
    const res = await this.signEvm(req);
    const data = await this.#handleMfa(res);
    return data.rlp_signed_tx;
  }

  /**
   * Sign a transaction. This method does not block if the key requires MFA approval, i.e.,
   * the returned {@link CubeSignerResponse} object either contains a signature or indicates
   * that MFA is required.
   *
   * @param {EvmSignRequest} req The transaction to sign.
   * @return {CubeSignerResponse<EvmSignResponse>} The response from the CubeSigner remote end.
   */
  async signEvm(req: EvmSignRequest): Promise<CubeSignerResponse<EvmSignResponse>> {
    return await this.#signerSession.signEvm(this.#address, req);
  }

  /**
   * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip712Signing"` policy attached.
   * @param {Eip712SignRequest} req The EIP712 sign request.
   * @return {Promise<string>} The signature.
   */
  async signEip712(req: Eip712SignRequest): Promise<string> {
    const res = await this.#signerSession.signEip712(this.#address, req);
    const data = await this.#handleMfa(res);
    return data.signature;
  }

  /**
   * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip191Signing"` policy attached.
   * @param {Eip191SignRequest} req The request to sign.
   * @return {Promise<string>} The signature.
   */
  async signEip191(req: Eip191SignRequest): Promise<string> {
    const res = await this.#signerSession.signEip191(this.#address, req);
    const data = await this.#handleMfa(res);
    return data.signature;
  }

  /** @return {KeyInfo} The key corresponding to this address */
  async key(): Promise<KeyInfo> {
    if (this.#key === undefined) {
      const key = (await this.#signerSession.keys()).find((k) => k.material_id === this.#address);
      if (key === undefined) {
        throw new Error(`Cannot access key '${this.#address}'`);
      }
      this.#key = key;
    }
    return this.#key;
  }

  /**
   * Sign a transaction from an approved MFA request. The MFA request contains
   * information about the approved signing request, which this method will execute.
   * @param {MfaRequestInfo} mfaInfo The approved MFA request.
   * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransactionMfaApproved(mfaInfo: MfaRequestInfo): Promise<string> {
    if (!mfaInfo.request.path.includes("/eth1/sign/")) {
      throw new Error(`Expected EVM transaction signing request, got ${mfaInfo.request.path}`);
    }
    if (!mfaInfo.request.path.includes(this.#address)) {
      throw new Error(
        `Expected signing request for ${this.#address} but got ${mfaInfo.request.path}`,
      );
    }
    if (!mfaInfo.receipt) {
      throw new Error("MFA request is not approved yet");
    }

    const resp = await this.#signerSession.signEvm(
      this.#address,
      mfaInfo.request.body as EvmSignRequest,
      {
        mfaId: mfaInfo.id,
        mfaOrgId: this.#signerSession.orgId,
        mfaConf: mfaInfo.receipt!.confirmation,
      },
    );
    return resp.data().rlp_signed_tx;
  }

  /**
   * If the sign request requires MFA, this method waits for approvals
   * @param {CubeSignerResponse<U>} res The response of a sign request
   * @return {Promise<U>} The sign data after MFA approvals
   */
  async #handleMfa<U>(res: CubeSignerResponse<U>): Promise<U> {
    while (res.requiresMfa()) {
      await new Promise((resolve) => setTimeout(resolve, this.#options.mfaPollIntervalMs));

      const mfaId = res.mfaId();
      const mfaInfo = await this.#signerSession.getMfaInfo(mfaId);
      this.#options.onMfaPoll?.(mfaInfo);
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
