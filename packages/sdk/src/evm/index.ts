import type {
  CubeSignerResponse,
  Eip191SignRequest,
  Eip712SignRequest,
  EvmSignRequest,
  MfaRequestInfo,
  EvmSignResponse,
  CubeSignerClient,
  Key,
  MfaRequest,
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
 *
 * @internal
 */
export class EvmSigner {
  /** The address of the account */
  readonly #address: string;

  /** The key to use for signing */
  #key?: Key;

  /** The underlying session */
  readonly #client: CubeSignerClient;

  /** Options */
  readonly #options: EvmSignerOptions;

  /** @returns The key address (NOT checksummed) */
  get address() {
    return this.#address;
  }

  /** @returns The underlying client */
  get client() {
    return this.#client;
  }

  /** @returns The options used for this EvmSigner */
  get options() {
    return this.#options;
  }

  /**
   * Create new Signer instance
   *
   * @param address The key or the eth address of the account to use.
   * @param client The underlying CubeSignerClient.
   * @param options The options to use for the Signer instance
   */
  constructor(address: Key | string, client: CubeSignerClient, options?: EvmSignerOptions) {
    if (typeof address === "string") {
      this.#address = address;
    } else {
      this.#address = address.materialId;
      this.#key = address;
    }
    this.#client = client;
    this.#options = <EvmSignerOptions>{
      onMfaPoll: options?.onMfaPoll,
      mfaPollIntervalMs: options?.mfaPollIntervalMs ?? 1000,
    };
  }

  /**
   * Sign a transaction. This method will block if the key requires MFA approval.
   *
   * @param req The sign request.
   * @returns Hex-encoded RLP encoding of the transaction and its signature.
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
   * @param req The transaction to sign.
   * @returns The response from the CubeSigner remote end.
   */
  async signEvm(req: EvmSignRequest): Promise<CubeSignerResponse<EvmSignResponse>> {
    const key = await this.key();
    return await key.signEvm(req);
  }

  /**
   * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip712Signing"` policy attached.
   *
   * @param req The EIP712 sign request.
   * @returns The signature.
   */
  async signEip712(req: Eip712SignRequest): Promise<string> {
    const key = await this.key();
    const res = await key.signEip712(req);
    const data = await this.#handleMfa(res);
    return data.signature;
  }

  /**
   * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip191Signing"` policy attached.
   *
   * @param req The request to sign.
   * @returns The signature.
   */
  async signEip191(req: Eip191SignRequest): Promise<string> {
    const key = await this.key();
    const res = await key.signEip191(req);
    const data = await this.#handleMfa(res);
    return data.signature;
  }

  /** @returns The key corresponding to this address */
  async key(): Promise<Key> {
    if (this.#key === undefined) {
      const key = (await this.#client.sessionKeys()).find((k) => k.materialId === this.#address);
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
   *
   * @param mfaRequest The approved MFA request.
   * @returns Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransactionMfaApproved(mfaRequest: MfaRequest): Promise<string> {
    const request = await mfaRequest.request();
    if (!request.path.includes("/eth1/sign/")) {
      throw new Error(`Expected EVM transaction signing request, got ${request.path}`);
    }
    if (!request.path.includes(this.#address)) {
      throw new Error(`Expected signing request for ${this.#address} but got ${request.path}`);
    }
    const receipt = await mfaRequest.receipt();
    if (!receipt) {
      throw new Error("MFA request is not approved yet");
    }

    const key = await this.key();
    const resp = await key.signEvm(request.body as EvmSignRequest, receipt);
    return resp.data().rlp_signed_tx;
  }

  /**
   * If the sign request requires MFA, this method waits for approvals
   *
   * @param res The response of a sign request
   * @returns The sign data after MFA approvals
   */
  async #handleMfa<U>(res: CubeSignerResponse<U>): Promise<U> {
    let mfaId = undefined;
    while ((mfaId = res.mfaId())) {
      await new Promise((resolve) => setTimeout(resolve, this.#options.mfaPollIntervalMs));

      const mfaInfo = await this.#client.org().getMfaRequest(mfaId).fetch();
      this.#options.onMfaPoll?.(mfaInfo);
      if (mfaInfo.receipt) {
        res = await res.execWithMfaApproval({
          mfaId,
          mfaOrgId: this.#client.orgId,
          mfaConf: mfaInfo.receipt.confirmation,
        });
      }
    }
    return res.data();
  }
}
