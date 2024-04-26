import type { TypedDataDomain, TypedDataField } from "ethers";
import { ethers } from "ethers";
import type { EvmSignerOptions, EvmSignRequest, CubeSignerClient, Key, MfaRequest } from "@cubist-labs/cubesigner-sdk";
/** Options for the signer */
export interface SignerOptions extends EvmSignerOptions {
    /** Optional provider to use */
    provider?: null | ethers.Provider;
}
/**
 * A ethers.js Signer using CubeSigner
 */
export declare class Signer extends ethers.AbstractSigner {
    #private;
    /**
     * Create new Signer instance
     * @param {Key | string} address The key or the eth address of the account to use.
     * @param {CubeSignerClient} client The underlying client.
     * @param {SignerOptions} options The options to use for the Signer instance
     */
    constructor(address: Key | string, client: CubeSignerClient, options?: SignerOptions);
    /** Resolves to the checksummed signer address. */
    getAddress(): Promise<string>;
    /**
     *  Returns the signer connected to %%provider%%.
     *  @param {null | ethers.Provider} provider The optional provider instance to use.
     *  @return {Signer} The signer connected to signer.
     */
    connect(provider: null | ethers.Provider): Signer;
    /**
     * Construct a signing request from a transaction. This populates the transaction
     * type to `0x02` (EIP-1559) unless set.
     *
     * @param {ethers.TransactionRequest} tx The transaction
     * @return {EvmSignRequest} The EVM sign request to be sent to CubeSigner
     */
    evmSignRequestFromTx(tx: ethers.TransactionRequest): Promise<EvmSignRequest>;
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     * @param {ethers.TransactionRequest} tx The transaction to sign.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    signTransaction(tx: ethers.TransactionRequest): Promise<string>;
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    signMessage(message: string | Uint8Array): Promise<string>;
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     * @param {TypedDataDomain} domain The domain of the typed data.
     * @param {Record<string, Array<TypedDataField>>} types The types of the typed data.
     * @param {Record<string, any>} value The value of the typed data.
     * @return {Promise<string>} The signature.
     */
    signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
    /**
     * Initialize the signing a message using MFA approvals. This method populates
     * missing fields. If the signing does not require MFA, this method throws.
     * @param {ethers.TransactionRequest} tx The transaction to send.
     * @return {string} The MFA id associated with the signing request.
     */
    sendTransactionMfaInit(tx: ethers.TransactionRequest): Promise<string>;
    /**
     * Send a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will
     * execute.
     * @param {MfaRequest} mfaRequest The approved MFA request.
     * @return {ethers.TransactionResponse} The result of submitting the transaction
     */
    sendTransactionMfaApproved(mfaRequest: MfaRequest): Promise<ethers.TransactionResponse>;
}
