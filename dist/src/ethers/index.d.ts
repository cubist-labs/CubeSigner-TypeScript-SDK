import { TypedDataDomain, TypedDataField, ethers } from "ethers";
import { SignerSession } from "../signer_session";
/**
 * A ethers.js Signer using CubeSigner
 */
export declare class Signer extends ethers.AbstractSigner {
    #private;
    /** Create new Signer instance
     * @param {string} address The address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {null | ethers.Provider} provider The optional provider instance to use.
     */
    constructor(address: string, signerSession: SignerSession, provider?: null | ethers.Provider);
    /** Resolves to the signer address. */
    getAddress(): Promise<string>;
    /**
     *  Returns the signer connected to %%provider%%.
     *  @param {null | ethers.Provider} provider The optional provider instance to use.
     *  @return {Signer} The signer connected to signer.
     */
    connect(provider: null | ethers.Provider): Signer;
    /**
     * Signs a transaction. This populates the transaction type to `0x02` (EIP-1559) unless set.
     * @param {ethers.TransactionRequest} tx The transaction to sign.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    signTransaction(tx: ethers.TransactionRequest): Promise<string>;
    /** Signs arbitrary messages. This uses ethers.js's [hashMessage](https://docs.ethers.org/v6/api/hashing/#hashMessage)
     * to compute the EIP-191 digest and signs this digest using {@link Key#signBlob}.
     * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    signMessage(message: string | Uint8Array): Promise<string>;
    /** Signs EIP-712 typed data. This uses ethers.js's
     * [TypedDataEncoder.hash](https://docs.ethers.org/v6/api/hashing/#TypedDataEncoder_hash)
     * to compute the EIP-712 digest and signs this digest using {@link Key#signBlob}.
     * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
     * @param {TypedDataDomain} domain The domain of the typed data.
     * @param {Record<string, Array<TypedDataField>>} types The types of the typed data.
     * @param {Record<string, any>} value The value of the typed data.
     * @return {Promise<string>} The signature.
     */
    signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
    /** Sign arbitrary digest. This uses {@link Key#signBlob}.
     * @param {string} digest The digest to sign.
     * @return {Promise<string>} The signature.
     */
    private signBlob;
}
