import type { TypedDataDomain, TypedDataField } from "ethers";
import { ethers } from "ethers";
import type { EvmSignRequest, CubeSignerClient, EvmSignerOptions, Key, MfaRequest } from "@cubist-labs/cubesigner-sdk";
import type { Deferrable, Bytes } from "ethers/lib/utils";
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
export declare class Signer extends ethers.Signer implements TypedDataSigner {
    #private;
    /**
     * Create new Signer instance
     *
     * @param address The key or the eth address of the account to use.
     * @param client The underlying client.
     * @param options The options to use for the Signer instance
     */
    constructor(address: Key | string, client: CubeSignerClient, options?: SignerOptions);
    /** @returns The signer checksum address. */
    getAddress(): Promise<string>;
    /**
     *  Returns the signer connected to %%provider%%.
     *
     *  @param provider The provider instance to use.
     *  @returns The signer connected to signer.
     */
    connect(provider: ethers.providers.Provider): Signer;
    /**
     * Construct a signing request from a transaction. This populates the transaction
     * type to `0x02` (EIP-1559) unless set.
     *
     * @param tx The transaction
     * @returns The EVM sign request to be sent to CubeSigner
     */
    evmSignRequestFromTx(tx: TransactionRequest): Promise<EvmSignRequest>;
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     *
     * @param tx The transaction to sign.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    signTransaction(tx: Deferrable<TransactionRequest>): Promise<string>;
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     *
     * @param message The message to sign.  Bytes are treated as
     * as a binary messages; strings are treated as UTF8-messages.
     * @returns The signature.
     */
    signMessage(message: string | Bytes): Promise<string>;
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
    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
    /**
     * Initialize the signing a message using MFA approvals. This method populates
     * missing fields. If the signing does not require MFA, this method throws.
     *
     * @param tx The transaction to send.
     * @returns The MFA id associated with the signing request.
     */
    sendTransactionMfaInit(tx: TransactionRequest): Promise<string>;
    /**
     * Send a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will
     * execute.
     *
     * @param mfaRequest The approved MFA request.
     * @returns The result of submitting the transaction
     */
    sendTransactionMfaApproved(mfaRequest: MfaRequest): Promise<TransactionResponse>;
}
//# sourceMappingURL=index.d.ts.map