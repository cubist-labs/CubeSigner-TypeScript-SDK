import type { TypedDataDomain, TypedDataField } from "ethers";
import { JsonRpcApiProvider, TypedDataEncoder, ethers, toBeHex } from "ethers";
import type {
  EvmSignerOptions,
  Eip191SignRequest,
  Eip712SignRequest,
  EvmSignRequest,
  CubeSignerClient,
  Key,
  MfaRequest,
} from "@cubist-labs/cubesigner-sdk";
import { EvmSigner, encodeToHex } from "@cubist-labs/cubesigner-sdk";

/** Options for the signer */
export interface SignerOptions extends EvmSignerOptions {
  /** Optional provider to use */
  provider?: null | ethers.Provider;
}

/**
 * A ethers.js Signer using CubeSigner
 */
export class Signer extends ethers.AbstractSigner {
  /** The CubeSigner-backed ethers signer */
  readonly #signer: EvmSigner;

  /**
   * Create new Signer instance
   * @param {Key | string} address The key or the eth address of the account to use.
   * @param {CubeSignerClient} client The underlying client.
   * @param {SignerOptions} options The options to use for the Signer instance
   */
  constructor(address: Key | string, client: CubeSignerClient, options?: SignerOptions) {
    super(options?.provider);
    this.#signer = new EvmSigner(address, client, options);
  }

  /** Resolves to the checksummed signer address. */
  async getAddress(): Promise<string> {
    return ethers.getAddress(this.#signer.address);
  }

  /**
   *  Returns the signer connected to %%provider%%.
   *  @param {null | ethers.Provider} provider The optional provider instance to use.
   *  @return {Signer} The signer connected to signer.
   */
  connect(provider: null | ethers.Provider): Signer {
    return new Signer(this.#signer.address, this.#signer.client, {
      ...this.#signer.options,
      provider,
    });
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
      chainId = network?.chainId?.toString();
      if (chainId === undefined) {
        throw new Error("Cannot determine chainId");
      }
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
    return await this.#signer.signTransaction(req);
  }

  /**
   * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip191Signing"` policy attached.
   * @param {string | Uint8Array} message The message to sign.
   * @return {Promise<string>} The signature.
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    return await this.#signer.signEip191(<Eip191SignRequest>{
      data: encodeToHex(message),
    });
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
  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<string> {
    let chainId = domain.chainId;
    if (chainId === undefined) {
      // get chain id from provider
      const network = await this.provider?.getNetwork();
      chainId = network?.chainId;
      if (chainId === undefined) {
        throw new Error("Cannot determine chainId");
      }
    }

    return await this.#signer.signEip712(<Eip712SignRequest>{
      chain_id: Number(chainId),
      typed_data: TypedDataEncoder.getPayload(domain, types, value),
    });
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
    const res = await this.#signer.signEvm(req);
    return res.mfaId();
  }

  /**
   * Send a transaction from an approved MFA request. The MFA request contains
   * information about the approved signing request, which this method will
   * execute.
   * @param {MfaRequest} mfaRequest The approved MFA request.
   * @return {ethers.TransactionResponse} The result of submitting the transaction
   */
  async sendTransactionMfaApproved(mfaRequest: MfaRequest): Promise<ethers.TransactionResponse> {
    const rlpSigned = await this.#signer.signTransactionMfaApproved(mfaRequest);
    return await this.provider!.broadcastTransaction(rlpSigned);
  }
}
