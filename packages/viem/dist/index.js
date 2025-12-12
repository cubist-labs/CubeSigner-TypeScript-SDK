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
import { bytesToHex, formatTransactionRequest, getAddress, isHex, parseTransaction, serializeTransaction, stringToHex, } from "viem";
import { EvmSigner, } from "@cubist-labs/cubesigner-sdk";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxFQUtMLFVBQVUsRUFDVix3QkFBd0IsRUFDeEIsVUFBVSxFQUNWLEtBQUssRUFDTCxnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLFdBQVcsR0FDWixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFJTCxTQUFTLEdBR1YsTUFBTSw0QkFBNEIsQ0FBQztBQUVwQzs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sZ0JBQWdCO0lBTzNCOzs7Ozs7OztPQVFHO0lBQ0gsWUFBWSxPQUFxQixFQUFFLE1BQXdCLEVBQUUsT0FBMEI7UUFmdkYsMkNBQTJDO1FBQ2xDLDJDQUFtQjtRQTBCNUI7Ozs7Ozs7O1dBUUc7UUFDSSxnQkFBVyxHQUFnQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO1lBQ3RFLElBQUksR0FBRyxDQUFDO1lBQ1IsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsR0FBRyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QixDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM5QixHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNwQixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sR0FBRyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxnQ0FBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBRS9ELE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQztRQUVGOzs7Ozs7OztXQVFHO1FB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QUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgdHlwZSBBZGRyZXNzLFxuICB0eXBlIEN1c3RvbVNvdXJjZSxcbiAgdHlwZSBIZXgsXG4gIHR5cGUgU2lnbmF0dXJlLFxuICBieXRlc1RvSGV4LFxuICBmb3JtYXRUcmFuc2FjdGlvblJlcXVlc3QsXG4gIGdldEFkZHJlc3MsXG4gIGlzSGV4LFxuICBwYXJzZVRyYW5zYWN0aW9uLFxuICBzZXJpYWxpemVUcmFuc2FjdGlvbixcbiAgc3RyaW5nVG9IZXgsXG59IGZyb20gXCJ2aWVtXCI7XG5pbXBvcnQge1xuICB0eXBlIEN1YmVTaWduZXJDbGllbnQsXG4gIHR5cGUgRWlwNzEyU2lnblJlcXVlc3QsXG4gIHR5cGUgRXZtU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25lcixcbiAgdHlwZSBFdm1TaWduZXJPcHRpb25zLFxuICB0eXBlIEtleSxcbn0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5cbi8qKlxuICogQSBjbGFzcyB0byB3cmFwIGEgQ3ViZVNpZ25lciBrZXkgYW5kIGNsaWVudCBpbnRvIGEgVmllbSB7QGxpbmsgQ3VzdG9tU291cmNlfS5cbiAqIFVzZSBWaWVtJ3MgYHRvQWNjb3VudGAgdG8gY29udmVydCB0aGlzIHRvIGEgVmllbSBBY2NvdW50LlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lclNvdXJjZSBpbXBsZW1lbnRzIEN1c3RvbVNvdXJjZSB7XG4gIC8qKiBUaGUgaW50ZXJuYWwgQ3ViZVNpZ25lciBzaWduZXIgdXNlZC4gKi9cbiAgcmVhZG9ubHkgI3NpZ25lcjogRXZtU2lnbmVyO1xuXG4gIC8qKiBUaGUgYWRkcmVzcyB0aGUgd2FsbGV0IGlzIGFzc29jaWF0ZWQgd2l0aC4gKi9cbiAgcHVibGljIHJlYWRvbmx5IGFkZHJlc3M6IEFkZHJlc3M7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIFZpZW0ge0BsaW5rIEN1c3RvbVNvdXJjZX0gYXJvdW5kIGEgQ3ViZVNpZ25lciBrZXkgYW5kIGNsaWVudC5cbiAgICogVXNlIFZpZW0ncyBgdG9BY2NvdW50YCB0byBjb252ZXJ0IHRoaXMgdG8gYSBWaWVtIEFjY291bnQuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBFVk0gYWRkcmVzcyB0aGlzIHdhbGxldCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAgICogQHBhcmFtIGNsaWVudCBUaGUgc2Vzc2lvbiB1c2VkIGZvciBzaWduaW5nLiBNdXN0IGhhdmUgbmVjZXNzYXJ5IHNjb3Blcy5cbiAgICogQHBhcmFtIG9wdGlvbnMgTUZBIG9wdGlvbnMgZm9yIHRoZSBjbGllbnQgdG8gcmVzcGVjdFxuICAgKiBAdGhyb3dzIHtFcnJvcn0gaWYgdGhlIGFkZHJlc3MgaXMgbm90IGEgdmFsaWQgRVZNIGFkZHJlc3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFkZHJlc3M6IEtleSB8IHN0cmluZywgY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBvcHRpb25zPzogRXZtU2lnbmVyT3B0aW9ucykge1xuICAgIHRoaXMuI3NpZ25lciA9IG5ldyBFdm1TaWduZXIoYWRkcmVzcywgY2xpZW50LCBvcHRpb25zKTtcblxuICAgIC8vIE5PVEU6IGBnZXRBZGRyZXNzYCB3aWxsIGNoZWNrc3VtIHRoZSBhZGRyZXNzIGFuZCB0aHJvdyBpZiBpdCdzIGFuIGludmFsaWQgRVZNIGFkZHJlc3MuXG4gICAgdGhpcy5hZGRyZXNzID0gZ2V0QWRkcmVzcyh0aGlzLiNzaWduZXIuYWRkcmVzcyk7XG5cbiAgICAvLyBTY29wZSB0aGVzZSBmdW5jdGlvbnMgdG8gcHJvcGVybHkgcmVzb2x2ZSBgdGhpc2BcbiAgICB0aGlzLnNpZ25NZXNzYWdlID0gdGhpcy5zaWduTWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2lnblRyYW5zYWN0aW9uID0gdGhpcy5zaWduVHJhbnNhY3Rpb24uYmluZCh0aGlzKTtcbiAgICB0aGlzLnNpZ25UeXBlZERhdGEgPSB0aGlzLnNpZ25UeXBlZERhdGEuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBhcmJpdHJhcnkgbWVzc2FnZXMuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTE5MSBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXAxOTFTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIHJvb3QgT2JqZWN0IGFyb3VuZCB0aGUgbWVzc2FnZVxuICAgKiBAcGFyYW0gcm9vdC5tZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ25cbiAgICogQHJldHVybnMgVGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgcHVibGljIHNpZ25NZXNzYWdlOiBDdXN0b21Tb3VyY2VbXCJzaWduTWVzc2FnZVwiXSA9IGFzeW5jICh7IG1lc3NhZ2UgfSkgPT4ge1xuICAgIGxldCBoZXg7XG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBoZXggPSBzdHJpbmdUb0hleChtZXNzYWdlKTtcbiAgICB9IGVsc2UgaWYgKGlzSGV4KG1lc3NhZ2UucmF3KSkge1xuICAgICAgaGV4ID0gbWVzc2FnZS5yYXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhleCA9IGJ5dGVzVG9IZXgobWVzc2FnZS5yYXcpO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwMTkxKHsgZGF0YTogaGV4IH0pO1xuXG4gICAgcmV0dXJuIGVuc3VyZUhleChzaWduYXR1cmUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogYGNoYWluSWRgIG11c3QgYmUgc3BlY2lmaWVkIHdpdGhpbiB0aGUgYGRvbWFpbmAuXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbWV0ZXJzIFR5cGVkIGRhdGFcbiAgICogQHJldHVybnMgc2lnbmF0dXJlIGZvciB0aGUgdHlwZWQgZGF0YVxuICAgKi9cbiAgcHVibGljIHNpZ25UeXBlZERhdGE6IEN1c3RvbVNvdXJjZVtcInNpZ25UeXBlZERhdGFcIl0gPSBhc3luYyAocGFyYW1ldGVycykgPT4ge1xuICAgIGFzc2VydChwYXJhbWV0ZXJzLmRvbWFpbiwgXCJgZG9tYWluYCBtdXN0IGJlIGRlZmluZWRcIik7XG5cbiAgICBjb25zdCBjYXN0ZWRQYXJhbWV0ZXJzID0gcGFyYW1ldGVycyBhcyBFaXA3MTJTaWduUmVxdWVzdFtcInR5cGVkX2RhdGFcIl07XG4gICAgYXNzZXJ0KGNhc3RlZFBhcmFtZXRlcnMuZG9tYWluLmNoYWluSWQsIFwiYGRvbWFpbi5jaGFpbklkYCBtdXN0IGJlIGRlZmluZWRcIik7XG5cbiAgICBjb25zdCBzaWduYXR1cmUgPSBhd2FpdCB0aGlzLiNzaWduZXIuc2lnbkVpcDcxMih7XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNhc3RlZFBhcmFtZXRlcnMuZG9tYWluLmNoYWluSWQpLFxuICAgICAgdHlwZWRfZGF0YTogY2FzdGVkUGFyYW1ldGVycyxcbiAgICB9KTtcblxuICAgIHJldHVybiBlbnN1cmVIZXgoc2lnbmF0dXJlKTtcbiAgfTtcblxuICAvKipcbiAgICogSXQgaXMgcmVjb21tZW5kZWQgdG8gdXNlIGBwcmVwYXJlVHJhbnNhY3Rpb25SZXF1ZXN0YCBvbiB5b3VyIHJlcXVlc3RcbiAgICogYmVmb3JlIGNhbGxpbmcgdGhpcyBmdW5jdGlvbi5cbiAgICpcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBgdHlwZWAgYW5kIGBjaGFpbklkYCBtdXN0IGJlIGRlZmluZWQuIE9ubHkgc3VwcG9ydHMgdHlwZSBcImxlZ2FjeVwiIG9yIFwiZWlwMTU1OVwiLlxuICAgKlxuICAgKiBAcGFyYW0gdHJhbnNhY3Rpb24gVGhlIHRyYW5zYWN0aW9uIHRvIHNpZ25cbiAgICogQHBhcmFtIG9wdGlvbnMgQ29udGFpbnMgYW4gb3B0aW9uYWwgY3VzdG9tIHNlcmlhbGl6ZXJcbiAgICogQHJldHVybnMgU2lnbmVkIHRyYW5zYWN0aW9uXG4gICAqIEB0aHJvd3Mge0Vycm9yfSBpZiB0cmFuc2FjdGlvbi50eXBlIGlzbid0IFwibGVnYWN5XCIgb3IgXCJlaXAxNTU5XCIsIG9yIGlmIFwiY2hhaW5JZFwiIGlzbid0IHNwZWNpZmllZFxuICAgKi9cbiAgcHVibGljIHNpZ25UcmFuc2FjdGlvbjogQ3VzdG9tU291cmNlW1wic2lnblRyYW5zYWN0aW9uXCJdID0gYXN5bmMgKHRyYW5zYWN0aW9uLCBvcHRpb25zKSA9PiB7XG4gICAgYXNzZXJ0KFxuICAgICAgdHJhbnNhY3Rpb24udHlwZSA9PT0gXCJsZWdhY3lcIiB8fCB0cmFuc2FjdGlvbi50eXBlID09PSBcImVpcDE1NTlcIixcbiAgICAgIGBVbnN1cHBvcnRlZCB0cmFuc2FjdGlvbiB0eXBlICcke3RyYW5zYWN0aW9uLnR5cGV9JywgQ3ViZVNpZ25lciBvbmx5IHN1cHBvcnRzIHR5cGUgJ2xlZ2FjeScgb3IgJ2VpcDE1NTknXCIpfSdgLFxuICAgICk7XG5cbiAgICBhc3NlcnQodHJhbnNhY3Rpb24uY2hhaW5JZCwgXCJgY2hhaW5JZGAgbXVzdCBiZSBkZWZpbmVkXCIpO1xuXG4gICAgY29uc3QgZm9ybWF0dGVkID0gZm9ybWF0VHJhbnNhY3Rpb25SZXF1ZXN0KHRyYW5zYWN0aW9uKTtcbiAgICBjb25zdCBybHBTaWduZWRUcmFuc2FjdGlvbiA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduVHJhbnNhY3Rpb24oe1xuICAgICAgY2hhaW5faWQ6IHRyYW5zYWN0aW9uLmNoYWluSWQsXG4gICAgICB0eDogZm9ybWF0dGVkIGFzIEV2bVNpZ25SZXF1ZXN0W1widHhcIl0sXG4gICAgfSk7XG5cbiAgICAvLyBDdWJlU2lnbmVyIHJldHVybnMgYW4gUkxQLWVuY29kZWQgdHJhbnNhY3Rpb24uIFNpbmNlIFZpZW0gYWxsb3dzIHVzZXJzIHRvIHBhc3MgYSBjdXN0b20gc2VyaWFsaXplciwgd2Ugd2lsbFxuICAgIC8vIG5vdyB1bnNlcmlhbGl6ZSBhbmQgcmVzZXJpYWxpemUgd2l0aCBWaWVtJ3Mgc2VyaWFsaXplci5cbiAgICBjb25zdCB7IHIsIHMsIHYsIHlQYXJpdHksIC4uLnBhcnNlZFRyYW5zYWN0aW9uIH0gPSBwYXJzZVRyYW5zYWN0aW9uKFxuICAgICAgZW5zdXJlSGV4KHJscFNpZ25lZFRyYW5zYWN0aW9uKSxcbiAgICApO1xuICAgIGNvbnN0IHNlcmlhbGl6ZXIgPSBvcHRpb25zPy5zZXJpYWxpemVyID8/IHNlcmlhbGl6ZVRyYW5zYWN0aW9uO1xuXG4gICAgcmV0dXJuIGF3YWl0IHNlcmlhbGl6ZXIocGFyc2VkVHJhbnNhY3Rpb24sIHsgciwgcywgdiwgeVBhcml0eSB9IGFzIFNpZ25hdHVyZSk7XG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIGlucHV0IEEgaGV4IHN0cmluZ1xuICogQHJldHVybnMgdGhlIGlucHV0LCB0eXBlIG5hcnJvd2VkIHRvIEhleFxuICogQHRocm93cyB7RXJyb3J9IGlmIGlucHV0IGlzIG5vdCBIZXhcbiAqL1xuZnVuY3Rpb24gZW5zdXJlSGV4KGlucHV0OiBzdHJpbmcpOiBIZXgge1xuICBhc3NlcnQoaXNIZXgoaW5wdXQpLCBgJHtpbnB1dH0gaXMgbm90IGhleGApO1xuICByZXR1cm4gaW5wdXQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgdGhhdCBpcyBleHBlY3RlZCB0byBiZSB0cnV0aHlcbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSBlcnJvciBtZXNzYWdlIGlmIHRoZSB2YWx1ZSBpcyBmYWxzeVxuICogQHRocm93cyB7RXJyb3J9IGlmIHZhbHVlIGlzIG5vdCB0cnV0aHlcbiAqL1xuZnVuY3Rpb24gYXNzZXJ0KHZhbHVlOiB1bmtub3duLCBtZXNzYWdlOiBzdHJpbmcpOiBhc3NlcnRzIHZhbHVlIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgfVxufVxuIl19