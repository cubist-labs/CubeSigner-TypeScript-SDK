import { TypedDataDomain, TypedDataField, ethers } from "ethers";
import {
  CubeSignerResponse,
  KeyInfo,
  Eip191SignRequest,
  Eip712SignRequest,
  EvmSignRequest,
  MfaRequestInfo,
  SignerSession,
  encodeToHex,
} from "@cubist-labs/cubesigner-sdk";
import {
  _TypedDataEncoder,
  Deferrable,
  Bytes,
  defineReadOnly,
  hexlify,
  isBytes,
  resolveProperties,
} from "ethers/lib/utils";
import { TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import { TypedDataSigner } from "@ethersproject/abstract-signer";

/** Options for the signer */
export interface SignerOptions {
  /** Optional provider to use */
  provider?: null | ethers.providers.Provider;
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
export class Signer extends ethers.Signer implements TypedDataSigner {
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
    super();

    if (options?.provider) {
      defineReadOnly(this, "provider", options?.provider);
    }

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

  /** Resolves to the signer checksum address. */
  async getAddress(): Promise<string> {
    return ethers.utils.getAddress(this.#address);
  }

  /**
   *  Returns the signer connected to %%provider%%.
   *  @param {ethers.providers.Provider} provider The provider instance to use.
   *  @return {Signer} The signer connected to signer.
   */
  connect(provider: ethers.providers.Provider): Signer {
    return new Signer(this.#address, this.#signerSession, { provider });
  }

  /**
   * Construct a signing request from a transaction. This populates the transaction
   * type to `0x02` (EIP-1559) unless set.
   *
   * @param {TransactionRequest} tx The transaction
   * @return {EvmSignRequest} The EVM sign request to be sent to CubeSigner
   */
  async evmSignRequestFromTx(tx: TransactionRequest): Promise<EvmSignRequest> {
    // get the chain id from the network or tx
    let chainId: number | undefined = tx.chainId;
    if (chainId === undefined) {
      const network = await this.provider?.getNetwork();
      chainId = network?.chainId;
      if (chainId === undefined) {
        throw new Error("Cannot determine chainId");
      }
    }

    // Convert the transaction into a JSON-RPC transaction
    const rpcTx = ethers.providers.JsonRpcProvider.hexlifyTransaction(tx, {
      from: true,
      type: true,
    });
    // CubeSigner end-point expects type to be 0x0[0-2]. hexlifyTransactions
    // doesn't add the extra leading 0, add it here:
    if (typeof rpcTx.type === "string") {
      rpcTx.type = rpcTx.type.replace(/^0x([0-2])$/, "0x0$1");
    }

    return <EvmSignRequest>{
      chain_id: chainId,
      tx: rpcTx,
    };
  }

  /**
   * Sign a transaction. This method will block if the key requires MFA approval.
   * @param {Deferrable<TransactionRequest>} tx The transaction to sign.
   * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransaction(tx: Deferrable<TransactionRequest>): Promise<string> {
    const req = await this.evmSignRequestFromTx(await resolveProperties(tx));
    const res = await this.#signerSession.signEvm(this.#address, req);
    const data = await this.#handleMfa(res);
    return data.rlp_signed_tx;
  }

  /**
   * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip191Signing"` policy attached.
   * @param {string | Bytes} message The message to sign.  Bytes are treated as
   * as a binary messages; strings are treated as UTF8-messages.
   * @return {Promise<string>} The signature.
   */
  async signMessage(message: string | Bytes): Promise<string> {
    const key = await this.key();
    const res = await this.#signerSession.signEip191(key.material_id, <Eip191SignRequest>{
      data: isBytes(message) ? hexlify(message) : encodeToHex(message),
    });
    const data = await this.#handleMfa(res);
    return data.signature;
  }

  /**
   * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip712Signing"` policy attached.
   * @param {TypedDataDomain} domain The domain of the typed data.
   * @param {Record<string, Array<TypedDataField>>} types The types of the typed data.
   * @param {Record<string, any>} value The value of the typed data.
   * @return {Promise<string>} The signature.
   */
  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<string> {
    const key = await this.key();
    let chainId = domain.chainId;
    if (chainId === undefined) {
      // get chain id from provider
      const network = await this.provider?.getNetwork();
      chainId = network?.chainId;
      if (chainId === undefined) {
        throw new Error("Cannot determine chainId");
      }
    }
    const res = await this.#signerSession.signEip712(key.material_id, <Eip712SignRequest>{
      chain_id: Number(chainId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typed_data: <any>{
        domain,
        types,
        primaryType: _TypedDataEncoder.getPrimaryType(types),
        message: value,
      },
    });
    const data = await this.#handleMfa(res);
    return data.signature;
  }

  /** @return {KeyInfo} The key corresponding to this address */
  private async key(): Promise<KeyInfo> {
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
   * Initialize the signing a message using MFA approvals. This method populates
   * missing fields. If the signing does not require MFA, this method throws.
   * @param {TransactionRequest} tx The transaction to send.
   * @return {string} The MFA id associated with the signing request.
   */
  async sendTransactionMfaInit(tx: TransactionRequest): Promise<string> {
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
   * @return {TransactionResponse} The result of submitting the transaction
   */
  async sendTransactionMfaApproved(mfaInfo: MfaRequestInfo): Promise<TransactionResponse> {
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
    return await this.provider!.sendTransaction(signedTx.data().rlp_signed_tx);
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
