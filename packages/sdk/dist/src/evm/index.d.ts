import { type CubeSignerResponse, type Eip191SignRequest, type Eip712SignRequest, type EvmSignRequest, Key, type MfaRequestInfo, type EvmSignResponse, type CubeSignerClient, type MfaRequest } from "../index";
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
export declare class EvmSigner {
    #private;
    /** @returns The key address (NOT checksummed) */
    get address(): string;
    /** @returns The underlying client */
    get client(): CubeSignerClient;
    /** @returns The options used for this EvmSigner */
    get options(): EvmSignerOptions;
    /**
     * Create new Signer instance
     *
     * @param address The key or the eth address of the account to use.
     * @param client The underlying CubeSignerClient.
     * @param options The options to use for the Signer instance
     */
    constructor(address: Key | string, client: CubeSignerClient, options?: EvmSignerOptions);
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     *
     * @param req The sign request.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    signTransaction(req: EvmSignRequest): Promise<string>;
    /**
     * Sign a transaction. This method does not block if the key requires MFA approval, i.e.,
     * the returned {@link CubeSignerResponse} object either contains a signature or indicates
     * that MFA is required.
     *
     * @param req The transaction to sign.
     * @returns The response from the CubeSigner remote end.
     */
    signEvm(req: EvmSignRequest): Promise<CubeSignerResponse<EvmSignResponse>>;
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     *
     * @param req The EIP712 sign request.
     * @returns The signature.
     */
    signEip712(req: Eip712SignRequest): Promise<string>;
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     *
     * @param req The request to sign.
     * @returns The signature.
     */
    signEip191(req: Eip191SignRequest): Promise<string>;
    /** @returns The key corresponding to this address */
    key(): Promise<Key>;
    /**
     * Sign a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will execute.
     *
     * @param mfaRequest The approved MFA request.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    signTransactionMfaApproved(mfaRequest: MfaRequest): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map