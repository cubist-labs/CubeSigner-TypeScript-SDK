var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CubeSignerSource_signer;
import { bytesToHex, formatTransactionRequest, getAddress, isHex, parseSignature, parseTransaction, serializeTransaction, stringToHex, } from "viem";
import { EvmSigner, encodeToBase64, } from "@cubist-labs/cubesigner-sdk";
import { hashAuthorization, hexToBytes } from "viem/utils";
/**
 * A class to wrap a CubeSigner key and client into a Viem {@link CustomSource}.
 * Use Viem's `toAccount` to convert this to a Viem Account.
 */
export class CubeSignerSource {
    /**
     * Construct a Viem {@link CustomSource} around a CubeSigner key and client.
     * Use Viem's `toAccount` to convert this to a Viem Account.
     *
     * @param address The EVM address this wallet is associated with
     * @param client The session used for signing. Must have necessary scopes.
     * @param options MFA options for the client to respect
     * @throws {Error} if the address is not a valid EVM address
     */
    constructor(address, client, options) {
        /** The internal CubeSigner signer used. */
        _CubeSignerSource_signer.set(this, void 0);
        /**
         * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
         * The key (for this session) must have the `"AllowRawBlobSigning"` or
         * `"AllowEip191Signing"` policy attached.
         *
         * @param root Object around the message
         * @param root.message The message to sign
         * @returns The signature
         */
        this.signMessage = async ({ message }) => {
            let hex;
            if (typeof message === "string") {
                hex = stringToHex(message);
            }
            else if (isHex(message.raw)) {
                hex = message.raw;
            }
            else {
                hex = bytesToHex(message.raw);
            }
            const signature = await __classPrivateFieldGet(this, _CubeSignerSource_signer, "f").signEip191({ data: hex });
            return ensureHex(signature);
        };
        /**
         * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
         * The key (for this session) must have the `"AllowRawBlobSigning"` or
         * `"AllowEip712Signing"` policy attached.
         * `chainId` must be specified within the `domain`.
         *
         * @param parameters Typed data
         * @returns signature for the typed data
         */
        this.signTypedData = async (parameters) => {
            assert(parameters.domain, "`domain` must be defined");
            const castedParameters = parameters;
            assert(castedParameters.domain.chainId, "`domain.chainId` must be defined");
            const signature = await __classPrivateFieldGet(this, _CubeSignerSource_signer, "f").signEip712({
                chain_id: Number(castedParameters.domain.chainId),
                typed_data: castedParameters,
            });
            return ensureHex(signature);
        };
        /**
         * It is recommended to use `prepareTransactionRequest` on your request
         * before calling this function.
         *
         * Sign a transaction. This method will block if the key requires MFA approval.
         * `type` and `chainId` must be defined. Only supports type "legacy" or "eip1559".
         *
         * @param transaction The transaction to sign
         * @param options Contains an optional custom serializer
         * @returns Signed transaction
         * @throws {Error} if transaction.type isn't "legacy" or "eip1559", or if "chainId" isn't specified
         */
        this.signTransaction = async (transaction, options) => {
            assert(transaction.type === "legacy" || transaction.type === "eip1559", `Unsupported transaction type '${transaction.type}', CubeSigner only supports type 'legacy' or 'eip1559'")}'`);
            assert(transaction.chainId, "`chainId` must be defined");
            const formatted = formatTransactionRequest(transaction);
            const rlpSignedTransaction = await __classPrivateFieldGet(this, _CubeSignerSource_signer, "f").signTransaction({
                chain_id: transaction.chainId,
                tx: formatted,
            });
            // CubeSigner returns an RLP-encoded transaction. Since Viem allows users to pass a custom serializer, we will
            // now unserialize and reserialize with Viem's serializer.
            const { r, s, v, yParity, ...parsedTransaction } = parseTransaction(ensureHex(rlpSignedTransaction));
            const serializer = options?.serializer ?? serializeTransaction;
            return await serializer(parsedTransaction, { r, s, v, yParity });
        };
        __classPrivateFieldSet(this, _CubeSignerSource_signer, new EvmSigner(address, client, options), "f");
        // NOTE: `getAddress` will checksum the address and throw if it's an invalid EVM address.
        this.address = getAddress(__classPrivateFieldGet(this, _CubeSignerSource_signer, "f").address);
        // Scope these functions to properly resolve `this`
        this.signMessage = this.signMessage.bind(this);
        this.signTransaction = this.signTransaction.bind(this);
        this.signTypedData = this.signTypedData.bind(this);
        this.signAuthorization = this.signAuthorization.bind(this);
    }
    /**
     * Signs EIP-7702 authorization data
     *
     * @param parameters Authorization requests
     * @returns Signed authorization
     */
    async signAuthorization(parameters) {
        const hashToSign = hashAuthorization(parameters);
        const key = await __classPrivateFieldGet(this, _CubeSignerSource_signer, "f").key();
        // TODO(CS-3720): use the typed endpoint once we have it
        const resp = await key.signBlob({
            message_base64: encodeToBase64(hexToBytes(hashToSign)),
        });
        const data = await __classPrivateFieldGet(this, _CubeSignerSource_signer, "f").handleMfa(resp);
        const signature = ensureHex(data.signature);
        return {
            address: parameters.contractAddress ?? parameters.address,
            nonce: parameters.nonce,
            chainId: parameters.chainId,
            ...parseSignature(signature),
        };
    }
}
_CubeSignerSource_signer = new WeakMap();
/**
 * @param input A hex string
 * @returns the input, type narrowed to Hex
 * @throws {Error} if input is not Hex
 */
function ensureHex(input) {
    assert(isHex(input), `${input} is not hex`);
    return input;
}
/**
 * @param value A value that is expected to be truthy
 * @param message The error message if the value is falsy
 * @throws {Error} if value is not truthy
 */
function assert(value, message) {
    if (!value) {
        throw new Error(message);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxFQU9MLFVBQVUsRUFDVix3QkFBd0IsRUFDeEIsVUFBVSxFQUNWLEtBQUssRUFDTCxjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUNwQixXQUFXLEdBQ1osTUFBTSxNQUFNLENBQUM7QUFDZCxPQUFPLEVBSUwsU0FBUyxFQUdULGNBQWMsR0FDZixNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFM0Q7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQU8zQjs7Ozs7Ozs7T0FRRztJQUNILFlBQVksT0FBcUIsRUFBRSxNQUF3QixFQUFFLE9BQTBCO1FBZnZGLDJDQUEyQztRQUNsQywyQ0FBbUI7UUEyQjVCOzs7Ozs7OztXQVFHO1FBQ0ksZ0JBQVcsR0FBZ0MsS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtZQUN0RSxJQUFJLEdBQUcsQ0FBQztZQUNSLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLEdBQUcsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0IsQ0FBQztpQkFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDcEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLEdBQUcsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLHVCQUFBLElBQUksZ0NBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FB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QU0sdUJBQUEsSUFBSSxnQ0FBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3JDLHdEQUF3RDtRQUN4RCxNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUM7WUFDOUIsY0FBYyxFQUFFLGNBQWMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDdkQsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGdDQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUMsT0FBTztZQUNMLE9BQU8sRUFBRSxVQUFVLENBQUMsZUFBZSxJQUFJLFVBQVUsQ0FBQyxPQUFPO1lBQ3pELEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSztZQUN2QixPQUFPLEVBQUUsVUFBVSxDQUFDLE9BQU87WUFDM0IsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO1NBQzdCLENBQUM7SUFDSixDQUFDO0NBcUNGOztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLFNBQVMsQ0FBQyxLQUFhO0lBQzlCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxLQUFLLGFBQWEsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLE1BQU0sQ0FBQyxLQUFjLEVBQUUsT0FBZTtJQUM3QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzNCLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgdHlwZSBBZGRyZXNzLFxuICB0eXBlIEF1dGhvcml6YXRpb25SZXF1ZXN0LFxuICB0eXBlIEN1c3RvbVNvdXJjZSxcbiAgdHlwZSBIZXgsXG4gIHR5cGUgU2lnbkF1dGhvcml6YXRpb25SZXR1cm5UeXBlLFxuICB0eXBlIFNpZ25hdHVyZSxcbiAgYnl0ZXNUb0hleCxcbiAgZm9ybWF0VHJhbnNhY3Rpb25SZXF1ZXN0LFxuICBnZXRBZGRyZXNzLFxuICBpc0hleCxcbiAgcGFyc2VTaWduYXR1cmUsXG4gIHBhcnNlVHJhbnNhY3Rpb24sXG4gIHNlcmlhbGl6ZVRyYW5zYWN0aW9uLFxuICBzdHJpbmdUb0hleCxcbn0gZnJvbSBcInZpZW1cIjtcbmltcG9ydCB7XG4gIHR5cGUgQ3ViZVNpZ25lckNsaWVudCxcbiAgdHlwZSBFaXA3MTJTaWduUmVxdWVzdCxcbiAgdHlwZSBFdm1TaWduUmVxdWVzdCxcbiAgRXZtU2lnbmVyLFxuICB0eXBlIEV2bVNpZ25lck9wdGlvbnMsXG4gIHR5cGUgS2V5LFxuICBlbmNvZGVUb0Jhc2U2NCxcbn0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBoYXNoQXV0aG9yaXphdGlvbiwgaGV4VG9CeXRlcyB9IGZyb20gXCJ2aWVtL3V0aWxzXCI7XG5cbi8qKlxuICogQSBjbGFzcyB0byB3cmFwIGEgQ3ViZVNpZ25lciBrZXkgYW5kIGNsaWVudCBpbnRvIGEgVmllbSB7QGxpbmsgQ3VzdG9tU291cmNlfS5cbiAqIFVzZSBWaWVtJ3MgYHRvQWNjb3VudGAgdG8gY29udmVydCB0aGlzIHRvIGEgVmllbSBBY2NvdW50LlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lclNvdXJjZSBpbXBsZW1lbnRzIEN1c3RvbVNvdXJjZSB7XG4gIC8qKiBUaGUgaW50ZXJuYWwgQ3ViZVNpZ25lciBzaWduZXIgdXNlZC4gKi9cbiAgcmVhZG9ubHkgI3NpZ25lcjogRXZtU2lnbmVyO1xuXG4gIC8qKiBUaGUgYWRkcmVzcyB0aGUgd2FsbGV0IGlzIGFzc29jaWF0ZWQgd2l0aC4gKi9cbiAgcHVibGljIHJlYWRvbmx5IGFkZHJlc3M6IEFkZHJlc3M7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIFZpZW0ge0BsaW5rIEN1c3RvbVNvdXJjZX0gYXJvdW5kIGEgQ3ViZVNpZ25lciBrZXkgYW5kIGNsaWVudC5cbiAgICogVXNlIFZpZW0ncyBgdG9BY2NvdW50YCB0byBjb252ZXJ0IHRoaXMgdG8gYSBWaWVtIEFjY291bnQuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBFVk0gYWRkcmVzcyB0aGlzIHdhbGxldCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAgICogQHBhcmFtIGNsaWVudCBUaGUgc2Vzc2lvbiB1c2VkIGZvciBzaWduaW5nLiBNdXN0IGhhdmUgbmVjZXNzYXJ5IHNjb3Blcy5cbiAgICogQHBhcmFtIG9wdGlvbnMgTUZBIG9wdGlvbnMgZm9yIHRoZSBjbGllbnQgdG8gcmVzcGVjdFxuICAgKiBAdGhyb3dzIHtFcnJvcn0gaWYgdGhlIGFkZHJlc3MgaXMgbm90IGEgdmFsaWQgRVZNIGFkZHJlc3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFkZHJlc3M6IEtleSB8IHN0cmluZywgY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBvcHRpb25zPzogRXZtU2lnbmVyT3B0aW9ucykge1xuICAgIHRoaXMuI3NpZ25lciA9IG5ldyBFdm1TaWduZXIoYWRkcmVzcywgY2xpZW50LCBvcHRpb25zKTtcblxuICAgIC8vIE5PVEU6IGBnZXRBZGRyZXNzYCB3aWxsIGNoZWNrc3VtIHRoZSBhZGRyZXNzIGFuZCB0aHJvdyBpZiBpdCdzIGFuIGludmFsaWQgRVZNIGFkZHJlc3MuXG4gICAgdGhpcy5hZGRyZXNzID0gZ2V0QWRkcmVzcyh0aGlzLiNzaWduZXIuYWRkcmVzcyk7XG5cbiAgICAvLyBTY29wZSB0aGVzZSBmdW5jdGlvbnMgdG8gcHJvcGVybHkgcmVzb2x2ZSBgdGhpc2BcbiAgICB0aGlzLnNpZ25NZXNzYWdlID0gdGhpcy5zaWduTWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2lnblRyYW5zYWN0aW9uID0gdGhpcy5zaWduVHJhbnNhY3Rpb24uYmluZCh0aGlzKTtcbiAgICB0aGlzLnNpZ25UeXBlZERhdGEgPSB0aGlzLnNpZ25UeXBlZERhdGEuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNpZ25BdXRob3JpemF0aW9uID0gdGhpcy5zaWduQXV0aG9yaXphdGlvbi5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gcm9vdCBPYmplY3QgYXJvdW5kIHRoZSBtZXNzYWdlXG4gICAqIEBwYXJhbSByb290Lm1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc2lnblxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmF0dXJlXG4gICAqL1xuICBwdWJsaWMgc2lnbk1lc3NhZ2U6IEN1c3RvbVNvdXJjZVtcInNpZ25NZXNzYWdlXCJdID0gYXN5bmMgKHsgbWVzc2FnZSB9KSA9PiB7XG4gICAgbGV0IGhleDtcbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGhleCA9IHN0cmluZ1RvSGV4KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSBpZiAoaXNIZXgobWVzc2FnZS5yYXcpKSB7XG4gICAgICBoZXggPSBtZXNzYWdlLnJhdztcbiAgICB9IGVsc2Uge1xuICAgICAgaGV4ID0gYnl0ZXNUb0hleChtZXNzYWdlLnJhdyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmF0dXJlID0gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25FaXAxOTEoeyBkYXRhOiBoZXggfSk7XG5cbiAgICByZXR1cm4gZW5zdXJlSGV4KHNpZ25hdHVyZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtNzEyIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDcxMlNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBgY2hhaW5JZGAgbXVzdCBiZSBzcGVjaWZpZWQgd2l0aGluIHRoZSBgZG9tYWluYC5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgVHlwZWQgZGF0YVxuICAgKiBAcmV0dXJucyBzaWduYXR1cmUgZm9yIHRoZSB0eXBlZCBkYXRhXG4gICAqL1xuICBwdWJsaWMgc2lnblR5cGVkRGF0YTogQ3VzdG9tU291cmNlW1wic2lnblR5cGVkRGF0YVwiXSA9IGFzeW5jIChwYXJhbWV0ZXJzKSA9PiB7XG4gICAgYXNzZXJ0KHBhcmFtZXRlcnMuZG9tYWluLCBcImBkb21haW5gIG11c3QgYmUgZGVmaW5lZFwiKTtcblxuICAgIGNvbnN0IGNhc3RlZFBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzIGFzIEVpcDcxMlNpZ25SZXF1ZXN0W1widHlwZWRfZGF0YVwiXTtcbiAgICBhc3NlcnQoY2FzdGVkUGFyYW1ldGVycy5kb21haW4uY2hhaW5JZCwgXCJgZG9tYWluLmNoYWluSWRgIG11c3QgYmUgZGVmaW5lZFwiKTtcblxuICAgIGNvbnN0IHNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwNzEyKHtcbiAgICAgIGNoYWluX2lkOiBOdW1iZXIoY2FzdGVkUGFyYW1ldGVycy5kb21haW4uY2hhaW5JZCksXG4gICAgICB0eXBlZF9kYXRhOiBjYXN0ZWRQYXJhbWV0ZXJzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGVuc3VyZUhleChzaWduYXR1cmUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzcwMiBhdXRob3JpemF0aW9uIGRhdGFcbiAgICpcbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgQXV0aG9yaXphdGlvbiByZXF1ZXN0c1xuICAgKiBAcmV0dXJucyBTaWduZWQgYXV0aG9yaXphdGlvblxuICAgKi9cbiAgcHVibGljIGFzeW5jIHNpZ25BdXRob3JpemF0aW9uKFxuICAgIHBhcmFtZXRlcnM6IEF1dGhvcml6YXRpb25SZXF1ZXN0LFxuICApOiBQcm9taXNlPFNpZ25BdXRob3JpemF0aW9uUmV0dXJuVHlwZT4ge1xuICAgIGNvbnN0IGhhc2hUb1NpZ24gPSBoYXNoQXV0aG9yaXphdGlvbihwYXJhbWV0ZXJzKTtcbiAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLiNzaWduZXIua2V5KCk7XG4gICAgLy8gVE9ETyhDUy0zNzIwKTogdXNlIHRoZSB0eXBlZCBlbmRwb2ludCBvbmNlIHdlIGhhdmUgaXRcbiAgICBjb25zdCByZXNwID0gYXdhaXQga2V5LnNpZ25CbG9iKHtcbiAgICAgIG1lc3NhZ2VfYmFzZTY0OiBlbmNvZGVUb0Jhc2U2NChoZXhUb0J5dGVzKGhhc2hUb1NpZ24pKSxcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jc2lnbmVyLmhhbmRsZU1mYShyZXNwKTtcbiAgICBjb25zdCBzaWduYXR1cmUgPSBlbnN1cmVIZXgoZGF0YS5zaWduYXR1cmUpO1xuICAgIHJldHVybiB7XG4gICAgICBhZGRyZXNzOiBwYXJhbWV0ZXJzLmNvbnRyYWN0QWRkcmVzcyA/PyBwYXJhbWV0ZXJzLmFkZHJlc3MsXG4gICAgICBub25jZTogcGFyYW1ldGVycy5ub25jZSxcbiAgICAgIGNoYWluSWQ6IHBhcmFtZXRlcnMuY2hhaW5JZCxcbiAgICAgIC4uLnBhcnNlU2lnbmF0dXJlKHNpZ25hdHVyZSksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdCBpcyByZWNvbW1lbmRlZCB0byB1c2UgYHByZXBhcmVUcmFuc2FjdGlvblJlcXVlc3RgIG9uIHlvdXIgcmVxdWVzdFxuICAgKiBiZWZvcmUgY2FsbGluZyB0aGlzIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24uIFRoaXMgbWV0aG9kIHdpbGwgYmxvY2sgaWYgdGhlIGtleSByZXF1aXJlcyBNRkEgYXBwcm92YWwuXG4gICAqIGB0eXBlYCBhbmQgYGNoYWluSWRgIG11c3QgYmUgZGVmaW5lZC4gT25seSBzdXBwb3J0cyB0eXBlIFwibGVnYWN5XCIgb3IgXCJlaXAxNTU5XCIuXG4gICAqXG4gICAqIEBwYXJhbSB0cmFuc2FjdGlvbiBUaGUgdHJhbnNhY3Rpb24gdG8gc2lnblxuICAgKiBAcGFyYW0gb3B0aW9ucyBDb250YWlucyBhbiBvcHRpb25hbCBjdXN0b20gc2VyaWFsaXplclxuICAgKiBAcmV0dXJucyBTaWduZWQgdHJhbnNhY3Rpb25cbiAgICogQHRocm93cyB7RXJyb3J9IGlmIHRyYW5zYWN0aW9uLnR5cGUgaXNuJ3QgXCJsZWdhY3lcIiBvciBcImVpcDE1NTlcIiwgb3IgaWYgXCJjaGFpbklkXCIgaXNuJ3Qgc3BlY2lmaWVkXG4gICAqL1xuICBwdWJsaWMgc2lnblRyYW5zYWN0aW9uOiBDdXN0b21Tb3VyY2VbXCJzaWduVHJhbnNhY3Rpb25cIl0gPSBhc3luYyAodHJhbnNhY3Rpb24sIG9wdGlvbnMpID0+IHtcbiAgICBhc3NlcnQoXG4gICAgICB0cmFuc2FjdGlvbi50eXBlID09PSBcImxlZ2FjeVwiIHx8IHRyYW5zYWN0aW9uLnR5cGUgPT09IFwiZWlwMTU1OVwiLFxuICAgICAgYFVuc3VwcG9ydGVkIHRyYW5zYWN0aW9uIHR5cGUgJyR7dHJhbnNhY3Rpb24udHlwZX0nLCBDdWJlU2lnbmVyIG9ubHkgc3VwcG9ydHMgdHlwZSAnbGVnYWN5JyBvciAnZWlwMTU1OSdcIil9J2AsXG4gICAgKTtcblxuICAgIGFzc2VydCh0cmFuc2FjdGlvbi5jaGFpbklkLCBcImBjaGFpbklkYCBtdXN0IGJlIGRlZmluZWRcIik7XG5cbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBmb3JtYXRUcmFuc2FjdGlvblJlcXVlc3QodHJhbnNhY3Rpb24pO1xuICAgIGNvbnN0IHJscFNpZ25lZFRyYW5zYWN0aW9uID0gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25UcmFuc2FjdGlvbih7XG4gICAgICBjaGFpbl9pZDogdHJhbnNhY3Rpb24uY2hhaW5JZCxcbiAgICAgIHR4OiBmb3JtYXR0ZWQgYXMgRXZtU2lnblJlcXVlc3RbXCJ0eFwiXSxcbiAgICB9KTtcblxuICAgIC8vIEN1YmVTaWduZXIgcmV0dXJucyBhbiBSTFAtZW5jb2RlZCB0cmFuc2FjdGlvbi4gU2luY2UgVmllbSBhbGxvd3MgdXNlcnMgdG8gcGFzcyBhIGN1c3RvbSBzZXJpYWxpemVyLCB3ZSB3aWxsXG4gICAgLy8gbm93IHVuc2VyaWFsaXplIGFuZCByZXNlcmlhbGl6ZSB3aXRoIFZpZW0ncyBzZXJpYWxpemVyLlxuICAgIGNvbnN0IHsgciwgcywgdiwgeVBhcml0eSwgLi4ucGFyc2VkVHJhbnNhY3Rpb24gfSA9IHBhcnNlVHJhbnNhY3Rpb24oXG4gICAgICBlbnN1cmVIZXgocmxwU2lnbmVkVHJhbnNhY3Rpb24pLFxuICAgICk7XG4gICAgY29uc3Qgc2VyaWFsaXplciA9IG9wdGlvbnM/LnNlcmlhbGl6ZXIgPz8gc2VyaWFsaXplVHJhbnNhY3Rpb247XG5cbiAgICByZXR1cm4gYXdhaXQgc2VyaWFsaXplcihwYXJzZWRUcmFuc2FjdGlvbiwgeyByLCBzLCB2LCB5UGFyaXR5IH0gYXMgU2lnbmF0dXJlKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gaW5wdXQgQSBoZXggc3RyaW5nXG4gKiBAcmV0dXJucyB0aGUgaW5wdXQsIHR5cGUgbmFycm93ZWQgdG8gSGV4XG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgaW5wdXQgaXMgbm90IEhleFxuICovXG5mdW5jdGlvbiBlbnN1cmVIZXgoaW5wdXQ6IHN0cmluZyk6IEhleCB7XG4gIGFzc2VydChpc0hleChpbnB1dCksIGAke2lucHV0fSBpcyBub3QgaGV4YCk7XG4gIHJldHVybiBpbnB1dDtcbn1cblxuLyoqXG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSB0aGF0IGlzIGV4cGVjdGVkIHRvIGJlIHRydXRoeVxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIGVycm9yIG1lc3NhZ2UgaWYgdGhlIHZhbHVlIGlzIGZhbHN5XG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgdmFsdWUgaXMgbm90IHRydXRoeVxuICovXG5mdW5jdGlvbiBhc3NlcnQodmFsdWU6IHVua25vd24sIG1lc3NhZ2U6IHN0cmluZyk6IGFzc2VydHMgdmFsdWUge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICB9XG59XG4iXX0=