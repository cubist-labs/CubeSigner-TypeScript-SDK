import type { TypedDataDomain, TypedDataField } from "ethers";
import { ethers } from "ethers";
import type {
  Eip191SignRequest,
  Eip712SignRequest,
  EvmSignRequest,
  CubeSignerClient,
  EvmSignerOptions,
  Key,
  MfaRequest,
} from "@cubist-labs/cubesigner-sdk";
import { encodeToHex, EvmSigner } from "@cubist-labs/cubesigner-sdk";
import type { Deferrable, Bytes } from "ethers/lib/utils";
import {
  _TypedDataEncoder,
  defineReadOnly,
  hexlify,
  isBytes,
  resolveProperties,
} from "ethers/lib/utils";
import type { TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import type { TypedDataSigner } from "@ethersproject/abstract-signer";

/** Options for the signer */
export interface SignerOptions extends EvmSignerOptions {
  /** Optional provider to use */
  provider?: null | ethers.providers.Provider;
}

/**
 * A ethers.js Signer using CubeSigner
 */
export class Signer extends ethers.Signer implements TypedDataSigner {
  /** The CubeSigner-backed ethers signer */
  readonly #signer: EvmSigner;

  /**
   * Create new Signer instance
   *
   * @param address The key or the eth address of the account to use.
   * @param client The underlying client.
   * @param options The options to use for the Signer instance
   */
  constructor(address: Key | string, client: CubeSignerClient, options?: SignerOptions) {
    super();
    this.#signer = new EvmSigner(address, client, options);
    if (options?.provider) {
      defineReadOnly(this, "provider", options.provider);
    }
  }

  /** Resolves to the signer checksum address. */
  async getAddress(): Promise<string> {
    return ethers.utils.getAddress(this.#signer.address);
  }

  /**
   *  Returns the signer connected to %%provider%%.
   *
   *  @param provider The provider instance to use.
   *  @returns The signer connected to signer.
   */
  connect(provider: ethers.providers.Provider): Signer {
    return new Signer(this.#signer.address, this.#signer.client, {
      ...this.#signer.options,
      provider,
    });
  }

  /**
   * Construct a signing request from a transaction. This populates the transaction
   * type to `0x02` (EIP-1559) unless set.
   *
   * @param tx The transaction
   * @returns The EVM sign request to be sent to CubeSigner
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

    return <EvmSignRequest>{
      chain_id: chainId,
      tx: rpcTx as unknown,
    };
  }

  /**
   * Sign a transaction. This method will block if the key requires MFA approval.
   *
   * @param tx The transaction to sign.
   * @returns Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransaction(tx: Deferrable<TransactionRequest>): Promise<string> {
    const req = await this.evmSignRequestFromTx(await resolveProperties(tx));
    return await this.#signer.signTransaction(req);
  }

  /**
   * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip191Signing"` policy attached.
   *
   * @param message The message to sign.  Bytes are treated as
   * as a binary messages; strings are treated as UTF8-messages.
   * @returns The signature.
   */
  async signMessage(message: string | Bytes): Promise<string> {
    return await this.#signer.signEip191(<Eip191SignRequest>{
      data: isBytes(message) ? hexlify(message) : encodeToHex(message),
    });
  }

  /**
   * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip712Signing"` policy attached.
   *
   * @param domain The domain of the typed data.
   * @param types The types of the typed data.
   * @param value The value of the typed data.
   * @returns The signature.
   */
  async _signTypedData(
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
      typed_data: _TypedDataEncoder.getPayload(domain, types, value),
    });
  }

  /**
   * Initialize the signing a message using MFA approvals. This method populates
   * missing fields. If the signing does not require MFA, this method throws.
   *
   * @param tx The transaction to send.
   * @returns The MFA id associated with the signing request.
   */
  async sendTransactionMfaInit(tx: TransactionRequest): Promise<string> {
    const popTx = await this.populateTransaction(tx);
    const req = await this.evmSignRequestFromTx(popTx);
    const res = await this.#signer.signEvm(req);
    return res.mfaId();
  }

  /**
   * Send a transaction from an approved MFA request. The MFA request contains
   * information about the approved signing request, which this method will
   * execute.
   *
   * @param mfaRequest The approved MFA request.
   * @returns The result of submitting the transaction
   */
  async sendTransactionMfaApproved(mfaRequest: MfaRequest): Promise<TransactionResponse> {
    const rplSigned = await this.#signer.signTransactionMfaApproved(mfaRequest);
    return await this.provider!.sendTransaction(rplSigned);
  }
}
