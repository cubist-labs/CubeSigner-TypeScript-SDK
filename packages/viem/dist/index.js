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
        this.signAuthorization = async (parameters) => {
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
        this.signAuthorization = this.signAuthorization?.bind(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxFQU1MLFVBQVUsRUFDVix3QkFBd0IsRUFDeEIsVUFBVSxFQUNWLEtBQUssRUFDTCxjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUNwQixXQUFXLEdBQ1osTUFBTSxNQUFNLENBQUM7QUFDZCxPQUFPLEVBSUwsU0FBUyxFQUdULGNBQWMsR0FDZixNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFM0Q7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQU8zQjs7Ozs7Ozs7T0FRRztJQUNILFlBQVksT0FBcUIsRUFBRSxNQUF3QixFQUFFLE9BQTBCO1FBZnZGLDJDQUEyQztRQUNsQywyQ0FBbUI7UUEyQjVCOzs7Ozs7OztXQVFHO1FBQ0ksZ0JBQVcsR0FBZ0MsS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtZQUN0RSxJQUFJLEdBQUcsQ0FBQztZQUNSLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLEdBQUcsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0IsQ0FBQztpQkFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDcEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLEdBQUcsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLHVCQUFBLElBQUksZ0NBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FB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aEhBLHVCQUFBLElBQUksNEJBQVcsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBQSxDQUFDO1FBRXZELHlGQUF5RjtRQUN6RixJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLGdDQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEQsbURBQW1EO1FBQ25ELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlELENBQUM7Q0F1R0Y7O0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsU0FBUyxDQUFDLEtBQWE7SUFDOUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEtBQUssYUFBYSxDQUFDLENBQUM7SUFDNUMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsTUFBTSxDQUFDLEtBQWMsRUFBRSxPQUFlO0lBQzdDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0IsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICB0eXBlIEFkZHJlc3MsXG4gIHR5cGUgQ3VzdG9tU291cmNlLFxuICB0eXBlIEhleCxcbiAgdHlwZSBTaWduQXV0aG9yaXphdGlvblJldHVyblR5cGUsXG4gIHR5cGUgU2lnbmF0dXJlLFxuICBieXRlc1RvSGV4LFxuICBmb3JtYXRUcmFuc2FjdGlvblJlcXVlc3QsXG4gIGdldEFkZHJlc3MsXG4gIGlzSGV4LFxuICBwYXJzZVNpZ25hdHVyZSxcbiAgcGFyc2VUcmFuc2FjdGlvbixcbiAgc2VyaWFsaXplVHJhbnNhY3Rpb24sXG4gIHN0cmluZ1RvSGV4LFxufSBmcm9tIFwidmllbVwiO1xuaW1wb3J0IHtcbiAgdHlwZSBDdWJlU2lnbmVyQ2xpZW50LFxuICB0eXBlIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICB0eXBlIEV2bVNpZ25SZXF1ZXN0LFxuICBFdm1TaWduZXIsXG4gIHR5cGUgRXZtU2lnbmVyT3B0aW9ucyxcbiAgdHlwZSBLZXksXG4gIGVuY29kZVRvQmFzZTY0LFxufSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IGhhc2hBdXRob3JpemF0aW9uLCBoZXhUb0J5dGVzIH0gZnJvbSBcInZpZW0vdXRpbHNcIjtcblxuLyoqXG4gKiBBIGNsYXNzIHRvIHdyYXAgYSBDdWJlU2lnbmVyIGtleSBhbmQgY2xpZW50IGludG8gYSBWaWVtIHtAbGluayBDdXN0b21Tb3VyY2V9LlxuICogVXNlIFZpZW0ncyBgdG9BY2NvdW50YCB0byBjb252ZXJ0IHRoaXMgdG8gYSBWaWVtIEFjY291bnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyU291cmNlIGltcGxlbWVudHMgQ3VzdG9tU291cmNlIHtcbiAgLyoqIFRoZSBpbnRlcm5hbCBDdWJlU2lnbmVyIHNpZ25lciB1c2VkLiAqL1xuICByZWFkb25seSAjc2lnbmVyOiBFdm1TaWduZXI7XG5cbiAgLyoqIFRoZSBhZGRyZXNzIHRoZSB3YWxsZXQgaXMgYXNzb2NpYXRlZCB3aXRoLiAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYWRkcmVzczogQWRkcmVzcztcblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgVmllbSB7QGxpbmsgQ3VzdG9tU291cmNlfSBhcm91bmQgYSBDdWJlU2lnbmVyIGtleSBhbmQgY2xpZW50LlxuICAgKiBVc2UgVmllbSdzIGB0b0FjY291bnRgIHRvIGNvbnZlcnQgdGhpcyB0byBhIFZpZW0gQWNjb3VudC5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIEVWTSBhZGRyZXNzIHRoaXMgd2FsbGV0IGlzIGFzc29jaWF0ZWQgd2l0aFxuICAgKiBAcGFyYW0gY2xpZW50IFRoZSBzZXNzaW9uIHVzZWQgZm9yIHNpZ25pbmcuIE11c3QgaGF2ZSBuZWNlc3Nhcnkgc2NvcGVzLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBNRkEgb3B0aW9ucyBmb3IgdGhlIGNsaWVudCB0byByZXNwZWN0XG4gICAqIEB0aHJvd3Mge0Vycm9yfSBpZiB0aGUgYWRkcmVzcyBpcyBub3QgYSB2YWxpZCBFVk0gYWRkcmVzc1xuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5IHwgc3RyaW5nLCBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIG9wdGlvbnM/OiBFdm1TaWduZXJPcHRpb25zKSB7XG4gICAgdGhpcy4jc2lnbmVyID0gbmV3IEV2bVNpZ25lcihhZGRyZXNzLCBjbGllbnQsIG9wdGlvbnMpO1xuXG4gICAgLy8gTk9URTogYGdldEFkZHJlc3NgIHdpbGwgY2hlY2tzdW0gdGhlIGFkZHJlc3MgYW5kIHRocm93IGlmIGl0J3MgYW4gaW52YWxpZCBFVk0gYWRkcmVzcy5cbiAgICB0aGlzLmFkZHJlc3MgPSBnZXRBZGRyZXNzKHRoaXMuI3NpZ25lci5hZGRyZXNzKTtcblxuICAgIC8vIFNjb3BlIHRoZXNlIGZ1bmN0aW9ucyB0byBwcm9wZXJseSByZXNvbHZlIGB0aGlzYFxuICAgIHRoaXMuc2lnbk1lc3NhZ2UgPSB0aGlzLnNpZ25NZXNzYWdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zaWduVHJhbnNhY3Rpb24gPSB0aGlzLnNpZ25UcmFuc2FjdGlvbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2lnblR5cGVkRGF0YSA9IHRoaXMuc2lnblR5cGVkRGF0YS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2lnbkF1dGhvcml6YXRpb24gPSB0aGlzLnNpZ25BdXRob3JpemF0aW9uPy5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gcm9vdCBPYmplY3QgYXJvdW5kIHRoZSBtZXNzYWdlXG4gICAqIEBwYXJhbSByb290Lm1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc2lnblxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmF0dXJlXG4gICAqL1xuICBwdWJsaWMgc2lnbk1lc3NhZ2U6IEN1c3RvbVNvdXJjZVtcInNpZ25NZXNzYWdlXCJdID0gYXN5bmMgKHsgbWVzc2FnZSB9KSA9PiB7XG4gICAgbGV0IGhleDtcbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGhleCA9IHN0cmluZ1RvSGV4KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSBpZiAoaXNIZXgobWVzc2FnZS5yYXcpKSB7XG4gICAgICBoZXggPSBtZXNzYWdlLnJhdztcbiAgICB9IGVsc2Uge1xuICAgICAgaGV4ID0gYnl0ZXNUb0hleChtZXNzYWdlLnJhdyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmF0dXJlID0gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25FaXAxOTEoeyBkYXRhOiBoZXggfSk7XG5cbiAgICByZXR1cm4gZW5zdXJlSGV4KHNpZ25hdHVyZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtNzEyIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDcxMlNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBgY2hhaW5JZGAgbXVzdCBiZSBzcGVjaWZpZWQgd2l0aGluIHRoZSBgZG9tYWluYC5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgVHlwZWQgZGF0YVxuICAgKiBAcmV0dXJucyBzaWduYXR1cmUgZm9yIHRoZSB0eXBlZCBkYXRhXG4gICAqL1xuICBwdWJsaWMgc2lnblR5cGVkRGF0YTogQ3VzdG9tU291cmNlW1wic2lnblR5cGVkRGF0YVwiXSA9IGFzeW5jIChwYXJhbWV0ZXJzKSA9PiB7XG4gICAgYXNzZXJ0KHBhcmFtZXRlcnMuZG9tYWluLCBcImBkb21haW5gIG11c3QgYmUgZGVmaW5lZFwiKTtcblxuICAgIGNvbnN0IGNhc3RlZFBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzIGFzIEVpcDcxMlNpZ25SZXF1ZXN0W1widHlwZWRfZGF0YVwiXTtcbiAgICBhc3NlcnQoY2FzdGVkUGFyYW1ldGVycy5kb21haW4uY2hhaW5JZCwgXCJgZG9tYWluLmNoYWluSWRgIG11c3QgYmUgZGVmaW5lZFwiKTtcblxuICAgIGNvbnN0IHNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwNzEyKHtcbiAgICAgIGNoYWluX2lkOiBOdW1iZXIoY2FzdGVkUGFyYW1ldGVycy5kb21haW4uY2hhaW5JZCksXG4gICAgICB0eXBlZF9kYXRhOiBjYXN0ZWRQYXJhbWV0ZXJzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGVuc3VyZUhleChzaWduYXR1cmUpO1xuICB9O1xuXG4gIHB1YmxpYyBzaWduQXV0aG9yaXphdGlvbjogQ3VzdG9tU291cmNlW1wic2lnbkF1dGhvcml6YXRpb25cIl0gPSBhc3luYyAoXG4gICAgcGFyYW1ldGVycyxcbiAgKTogUHJvbWlzZTxTaWduQXV0aG9yaXphdGlvblJldHVyblR5cGU+ID0+IHtcbiAgICBjb25zdCBoYXNoVG9TaWduID0gaGFzaEF1dGhvcml6YXRpb24ocGFyYW1ldGVycyk7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy4jc2lnbmVyLmtleSgpO1xuICAgIC8vIFRPRE8oQ1MtMzcyMCk6IHVzZSB0aGUgdHlwZWQgZW5kcG9pbnQgb25jZSB3ZSBoYXZlIGl0XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGtleS5zaWduQmxvYih7XG4gICAgICBtZXNzYWdlX2Jhc2U2NDogZW5jb2RlVG9CYXNlNjQoaGV4VG9CeXRlcyhoYXNoVG9TaWduKSksXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI3NpZ25lci5oYW5kbGVNZmEocmVzcCk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gZW5zdXJlSGV4KGRhdGEuc2lnbmF0dXJlKTtcbiAgICByZXR1cm4ge1xuICAgICAgYWRkcmVzczogcGFyYW1ldGVycy5jb250cmFjdEFkZHJlc3MgPz8gcGFyYW1ldGVycy5hZGRyZXNzLFxuICAgICAgbm9uY2U6IHBhcmFtZXRlcnMubm9uY2UsXG4gICAgICBjaGFpbklkOiBwYXJhbWV0ZXJzLmNoYWluSWQsXG4gICAgICAuLi5wYXJzZVNpZ25hdHVyZShzaWduYXR1cmUpLFxuICAgIH07XG4gIH07XG5cbiAgLyoqXG4gICAqIEl0IGlzIHJlY29tbWVuZGVkIHRvIHVzZSBgcHJlcGFyZVRyYW5zYWN0aW9uUmVxdWVzdGAgb24geW91ciByZXF1ZXN0XG4gICAqIGJlZm9yZSBjYWxsaW5nIHRoaXMgZnVuY3Rpb24uXG4gICAqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2Qgd2lsbCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbC5cbiAgICogYHR5cGVgIGFuZCBgY2hhaW5JZGAgbXVzdCBiZSBkZWZpbmVkLiBPbmx5IHN1cHBvcnRzIHR5cGUgXCJsZWdhY3lcIiBvciBcImVpcDE1NTlcIi5cbiAgICpcbiAgICogQHBhcmFtIHRyYW5zYWN0aW9uIFRoZSB0cmFuc2FjdGlvbiB0byBzaWduXG4gICAqIEBwYXJhbSBvcHRpb25zIENvbnRhaW5zIGFuIG9wdGlvbmFsIGN1c3RvbSBzZXJpYWxpemVyXG4gICAqIEByZXR1cm5zIFNpZ25lZCB0cmFuc2FjdGlvblxuICAgKiBAdGhyb3dzIHtFcnJvcn0gaWYgdHJhbnNhY3Rpb24udHlwZSBpc24ndCBcImxlZ2FjeVwiIG9yIFwiZWlwMTU1OVwiLCBvciBpZiBcImNoYWluSWRcIiBpc24ndCBzcGVjaWZpZWRcbiAgICovXG4gIHB1YmxpYyBzaWduVHJhbnNhY3Rpb246IEN1c3RvbVNvdXJjZVtcInNpZ25UcmFuc2FjdGlvblwiXSA9IGFzeW5jICh0cmFuc2FjdGlvbiwgb3B0aW9ucykgPT4ge1xuICAgIGFzc2VydChcbiAgICAgIHRyYW5zYWN0aW9uLnR5cGUgPT09IFwibGVnYWN5XCIgfHwgdHJhbnNhY3Rpb24udHlwZSA9PT0gXCJlaXAxNTU5XCIsXG4gICAgICBgVW5zdXBwb3J0ZWQgdHJhbnNhY3Rpb24gdHlwZSAnJHt0cmFuc2FjdGlvbi50eXBlfScsIEN1YmVTaWduZXIgb25seSBzdXBwb3J0cyB0eXBlICdsZWdhY3knIG9yICdlaXAxNTU5J1wiKX0nYCxcbiAgICApO1xuXG4gICAgYXNzZXJ0KHRyYW5zYWN0aW9uLmNoYWluSWQsIFwiYGNoYWluSWRgIG11c3QgYmUgZGVmaW5lZFwiKTtcblxuICAgIGNvbnN0IGZvcm1hdHRlZCA9IGZvcm1hdFRyYW5zYWN0aW9uUmVxdWVzdCh0cmFuc2FjdGlvbik7XG4gICAgY29uc3QgcmxwU2lnbmVkVHJhbnNhY3Rpb24gPSBhd2FpdCB0aGlzLiNzaWduZXIuc2lnblRyYW5zYWN0aW9uKHtcbiAgICAgIGNoYWluX2lkOiB0cmFuc2FjdGlvbi5jaGFpbklkLFxuICAgICAgdHg6IGZvcm1hdHRlZCBhcyBFdm1TaWduUmVxdWVzdFtcInR4XCJdLFxuICAgIH0pO1xuXG4gICAgLy8gQ3ViZVNpZ25lciByZXR1cm5zIGFuIFJMUC1lbmNvZGVkIHRyYW5zYWN0aW9uLiBTaW5jZSBWaWVtIGFsbG93cyB1c2VycyB0byBwYXNzIGEgY3VzdG9tIHNlcmlhbGl6ZXIsIHdlIHdpbGxcbiAgICAvLyBub3cgdW5zZXJpYWxpemUgYW5kIHJlc2VyaWFsaXplIHdpdGggVmllbSdzIHNlcmlhbGl6ZXIuXG4gICAgY29uc3QgeyByLCBzLCB2LCB5UGFyaXR5LCAuLi5wYXJzZWRUcmFuc2FjdGlvbiB9ID0gcGFyc2VUcmFuc2FjdGlvbihcbiAgICAgIGVuc3VyZUhleChybHBTaWduZWRUcmFuc2FjdGlvbiksXG4gICAgKTtcbiAgICBjb25zdCBzZXJpYWxpemVyID0gb3B0aW9ucz8uc2VyaWFsaXplciA/PyBzZXJpYWxpemVUcmFuc2FjdGlvbjtcblxuICAgIHJldHVybiBhd2FpdCBzZXJpYWxpemVyKHBhcnNlZFRyYW5zYWN0aW9uLCB7IHIsIHMsIHYsIHlQYXJpdHkgfSBhcyBTaWduYXR1cmUpO1xuICB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSBpbnB1dCBBIGhleCBzdHJpbmdcbiAqIEByZXR1cm5zIHRoZSBpbnB1dCwgdHlwZSBuYXJyb3dlZCB0byBIZXhcbiAqIEB0aHJvd3Mge0Vycm9yfSBpZiBpbnB1dCBpcyBub3QgSGV4XG4gKi9cbmZ1bmN0aW9uIGVuc3VyZUhleChpbnB1dDogc3RyaW5nKTogSGV4IHtcbiAgYXNzZXJ0KGlzSGV4KGlucHV0KSwgYCR7aW5wdXR9IGlzIG5vdCBoZXhgKTtcbiAgcmV0dXJuIGlucHV0O1xufVxuXG4vKipcbiAqIEBwYXJhbSB2YWx1ZSBBIHZhbHVlIHRoYXQgaXMgZXhwZWN0ZWQgdG8gYmUgdHJ1dGh5XG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgZXJyb3IgbWVzc2FnZSBpZiB0aGUgdmFsdWUgaXMgZmFsc3lcbiAqIEB0aHJvd3Mge0Vycm9yfSBpZiB2YWx1ZSBpcyBub3QgdHJ1dGh5XG4gKi9cbmZ1bmN0aW9uIGFzc2VydCh2YWx1ZTogdW5rbm93biwgbWVzc2FnZTogc3RyaW5nKTogYXNzZXJ0cyB2YWx1ZSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gIH1cbn1cbiJdfQ==