import { type Address, type AuthorizationRequest, type CustomSource, type SignAuthorizationReturnType } from "viem";
import { type CubeSignerClient, type EvmSignerOptions, type Key } from "@cubist-labs/cubesigner-sdk";
/**
 * A class to wrap a CubeSigner key and client into a Viem {@link CustomSource}.
 * Use Viem's `toAccount` to convert this to a Viem Account.
 */
export declare class CubeSignerSource implements CustomSource {
    #private;
    /** The address the wallet is associated with. */
    readonly address: Address;
    /**
     * Construct a Viem {@link CustomSource} around a CubeSigner key and client.
     * Use Viem's `toAccount` to convert this to a Viem Account.
     *
     * @param address The EVM address this wallet is associated with
     * @param client The session used for signing. Must have necessary scopes.
     * @param options MFA options for the client to respect
     * @throws {Error} if the address is not a valid EVM address
     */
    constructor(address: Key | string, client: CubeSignerClient, options?: EvmSignerOptions);
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     *
     * @param root Object around the message
     * @param root.message The message to sign
     * @returns The signature
     */
    signMessage: CustomSource["signMessage"];
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     * `chainId` must be specified within the `domain`.
     *
     * @param parameters Typed data
     * @returns signature for the typed data
     */
    signTypedData: CustomSource["signTypedData"];
    /**
     * Signs EIP-7702 authorization data
     *
     * @param parameters Authorization requests
     * @returns Signed authorization
     */
    signAuthorization(parameters: AuthorizationRequest): Promise<SignAuthorizationReturnType>;
    /**
     * It is recommended to use `prepareTransactionRequest` on your request
     * before calling this function.
     *
     * Sign a transaction. This method will block if the key requires MFA approval.
     * `chainId` must be defined. If transaction type is not "legacy" or "eip1559",
     * the key must have the `AllowRawBlobSigning` allow policy.
     *
     * @param transaction The transaction to sign
     * @param options Contains an optional custom serializer
     * @returns Signed transaction
     * @throws {Error} if "chainId" isn't specified, or if transaction is not type "legacy" or "eip1559" and key does not have the `AllowRawBlobSigning` allow policy
     */
    signTransaction: CustomSource["signTransaction"];
}
//# sourceMappingURL=index.d.ts.map