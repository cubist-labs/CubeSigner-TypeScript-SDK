import { CubeSignerResponse, KeyInfo, Eip191SignRequest, Eip712SignRequest, EvmSignRequest, MfaRequestInfo, SignerSession, EvmSignResponse } from "../index";
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
export declare class EvmSigner {
    #private;
    /** Returns the key address (NOT checksummed) */
    get address(): string;
    /** Returns the underlying signer session */
    get signerSession(): SignerSession;
    /** Options */
    get options(): EvmSignerOptions;
    /**
     * Create new Signer instance
     * @param {KeyInfo | string} address The key or the eth address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {EvmSignerOptions} options The options to use for the Signer instance
     */
    constructor(address: KeyInfo | string, signerSession: SignerSession, options?: EvmSignerOptions);
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     * @param {EvmSignRequest} req The sign request.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    signTransaction(req: EvmSignRequest): Promise<string>;
    /**
     * Sign a transaction. This method does not block if the key requires MFA approval, i.e.,
     * the returned {@link CubeSignerResponse} object either contains a signature or indicates
     * that MFA is required.
     *
     * @param {EvmSignRequest} req The transaction to sign.
     * @return {CubeSignerResponse<EvmSignResponse>} The response from the CubeSigner remote end.
     */
    signEvm(req: EvmSignRequest): Promise<CubeSignerResponse<EvmSignResponse>>;
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     * @param {Eip712SignRequest} req The EIP712 sign request.
     * @return {Promise<string>} The signature.
     */
    signEip712(req: Eip712SignRequest): Promise<string>;
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {Eip191SignRequest} req The request to sign.
     * @return {Promise<string>} The signature.
     */
    signEip191(req: Eip191SignRequest): Promise<string>;
    /** @return {KeyInfo} The key corresponding to this address */
    key(): Promise<KeyInfo>;
    /**
     * Sign a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will execute.
     * @param {MfaRequestInfo} mfaInfo The approved MFA request.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    signTransactionMfaApproved(mfaInfo: MfaRequestInfo): Promise<string>;
}
