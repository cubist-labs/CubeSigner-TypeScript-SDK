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
import { hashAuthorization, hexToBytes, keccak256 } from "viem/utils";
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
         * `chainId` must be defined. If transaction type is not "legacy" or "eip1559",
         * the key must have the `AllowRawBlobSigning` allow policy.
         *
         * @param transaction The transaction to sign
         * @param options Contains an optional custom serializer
         * @returns Signed transaction
         * @throws {Error} if "chainId" isn't specified, or if transaction is not type "legacy" or "eip1559" and key does not have the `AllowRawBlobSigning` allow policy
         */
        this.signTransaction = async (transaction, options) => {
            assert(transaction.chainId, "`chainId` must be defined");
            const serializer = options?.serializer ?? serializeTransaction;
            // our type sign transaction endpoint only supports type 'legacy' or 'eip1559'
            if (transaction.type === "legacy" || transaction.type === "eip1559") {
                const formatted = formatTransactionRequest(transaction);
                const rlpSignedTransaction = await __classPrivateFieldGet(this, _CubeSignerSource_signer, "f").signTransaction({
                    chain_id: transaction.chainId,
                    tx: formatted,
                });
                // since Viem allows users to pass a custom serializer, we will
                // now unserialize and reserialize with Viem's serializer.
                const { r, s, v, yParity, ...parsedTransaction } = parseTransaction(ensureHex(rlpSignedTransaction));
                return await serializer(parsedTransaction, { r, s, v, yParity });
            }
            else {
                // otherwise, sign using blob signing
                const serialized = await serializer(transaction);
                const hashToSign = keccak256(serialized);
                const key = await __classPrivateFieldGet(this, _CubeSignerSource_signer, "f").key();
                const resp = await key.signBlob({
                    message_base64: encodeToBase64(hexToBytes(hashToSign)),
                });
                const data = await __classPrivateFieldGet(this, _CubeSignerSource_signer, "f").handleMfa(resp);
                const signature = parseSignature(ensureHex(data.signature));
                return await serializer(transaction, signature);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxFQU9MLFVBQVUsRUFDVix3QkFBd0IsRUFDeEIsVUFBVSxFQUNWLEtBQUssRUFDTCxjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUNwQixXQUFXLEdBQ1osTUFBTSxNQUFNLENBQUM7QUFDZCxPQUFPLEVBSUwsU0FBUyxFQUdULGNBQWMsR0FDZixNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRXRFOzs7R0FHRztBQUNILE1BQU0sT0FBTyxnQkFBZ0I7SUFPM0I7Ozs7Ozs7O09BUUc7SUFDSCxZQUFZLE9BQXFCLEVBQUUsTUFBd0IsRUFBRSxPQUEwQjtRQWZ2RiwyQ0FBMkM7UUFDbEMsMkNBQW1CO1FBMkI1Qjs7Ozs7Ozs7V0FRRztRQUNJLGdCQUFXLEdBQWdDLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7WUFDdEUsSUFBSSxHQUFHLENBQUM7WUFDUixJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxHQUFHLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ3BCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixHQUFHLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGdDQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFB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Q3ZCLE9BQU8sRUFBRSxVQUFVLENBQUMsT0FBTztZQUMzQixHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUM7U0FDN0IsQ0FBQztJQUNKLENBQUM7Q0FnREY7O0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsU0FBUyxDQUFDLEtBQWE7SUFDOUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEtBQUssYUFBYSxDQUFDLENBQUM7SUFDNUMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsTUFBTSxDQUFDLEtBQWMsRUFBRSxPQUFlO0lBQzdDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0IsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICB0eXBlIEFkZHJlc3MsXG4gIHR5cGUgQXV0aG9yaXphdGlvblJlcXVlc3QsXG4gIHR5cGUgQ3VzdG9tU291cmNlLFxuICB0eXBlIEhleCxcbiAgdHlwZSBTaWduQXV0aG9yaXphdGlvblJldHVyblR5cGUsXG4gIHR5cGUgU2lnbmF0dXJlLFxuICBieXRlc1RvSGV4LFxuICBmb3JtYXRUcmFuc2FjdGlvblJlcXVlc3QsXG4gIGdldEFkZHJlc3MsXG4gIGlzSGV4LFxuICBwYXJzZVNpZ25hdHVyZSxcbiAgcGFyc2VUcmFuc2FjdGlvbixcbiAgc2VyaWFsaXplVHJhbnNhY3Rpb24sXG4gIHN0cmluZ1RvSGV4LFxufSBmcm9tIFwidmllbVwiO1xuaW1wb3J0IHtcbiAgdHlwZSBDdWJlU2lnbmVyQ2xpZW50LFxuICB0eXBlIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICB0eXBlIEV2bVNpZ25SZXF1ZXN0LFxuICBFdm1TaWduZXIsXG4gIHR5cGUgRXZtU2lnbmVyT3B0aW9ucyxcbiAgdHlwZSBLZXksXG4gIGVuY29kZVRvQmFzZTY0LFxufSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IGhhc2hBdXRob3JpemF0aW9uLCBoZXhUb0J5dGVzLCBrZWNjYWsyNTYgfSBmcm9tIFwidmllbS91dGlsc1wiO1xuXG4vKipcbiAqIEEgY2xhc3MgdG8gd3JhcCBhIEN1YmVTaWduZXIga2V5IGFuZCBjbGllbnQgaW50byBhIFZpZW0ge0BsaW5rIEN1c3RvbVNvdXJjZX0uXG4gKiBVc2UgVmllbSdzIGB0b0FjY291bnRgIHRvIGNvbnZlcnQgdGhpcyB0byBhIFZpZW0gQWNjb3VudC5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXJTb3VyY2UgaW1wbGVtZW50cyBDdXN0b21Tb3VyY2Uge1xuICAvKiogVGhlIGludGVybmFsIEN1YmVTaWduZXIgc2lnbmVyIHVzZWQuICovXG4gIHJlYWRvbmx5ICNzaWduZXI6IEV2bVNpZ25lcjtcblxuICAvKiogVGhlIGFkZHJlc3MgdGhlIHdhbGxldCBpcyBhc3NvY2lhdGVkIHdpdGguICovXG4gIHB1YmxpYyByZWFkb25seSBhZGRyZXNzOiBBZGRyZXNzO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBWaWVtIHtAbGluayBDdXN0b21Tb3VyY2V9IGFyb3VuZCBhIEN1YmVTaWduZXIga2V5IGFuZCBjbGllbnQuXG4gICAqIFVzZSBWaWVtJ3MgYHRvQWNjb3VudGAgdG8gY29udmVydCB0aGlzIHRvIGEgVmllbSBBY2NvdW50LlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgRVZNIGFkZHJlc3MgdGhpcyB3YWxsZXQgaXMgYXNzb2NpYXRlZCB3aXRoXG4gICAqIEBwYXJhbSBjbGllbnQgVGhlIHNlc3Npb24gdXNlZCBmb3Igc2lnbmluZy4gTXVzdCBoYXZlIG5lY2Vzc2FyeSBzY29wZXMuXG4gICAqIEBwYXJhbSBvcHRpb25zIE1GQSBvcHRpb25zIGZvciB0aGUgY2xpZW50IHRvIHJlc3BlY3RcbiAgICogQHRocm93cyB7RXJyb3J9IGlmIHRoZSBhZGRyZXNzIGlzIG5vdCBhIHZhbGlkIEVWTSBhZGRyZXNzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXkgfCBzdHJpbmcsIGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgb3B0aW9ucz86IEV2bVNpZ25lck9wdGlvbnMpIHtcbiAgICB0aGlzLiNzaWduZXIgPSBuZXcgRXZtU2lnbmVyKGFkZHJlc3MsIGNsaWVudCwgb3B0aW9ucyk7XG5cbiAgICAvLyBOT1RFOiBgZ2V0QWRkcmVzc2Agd2lsbCBjaGVja3N1bSB0aGUgYWRkcmVzcyBhbmQgdGhyb3cgaWYgaXQncyBhbiBpbnZhbGlkIEVWTSBhZGRyZXNzLlxuICAgIHRoaXMuYWRkcmVzcyA9IGdldEFkZHJlc3ModGhpcy4jc2lnbmVyLmFkZHJlc3MpO1xuXG4gICAgLy8gU2NvcGUgdGhlc2UgZnVuY3Rpb25zIHRvIHByb3Blcmx5IHJlc29sdmUgYHRoaXNgXG4gICAgdGhpcy5zaWduTWVzc2FnZSA9IHRoaXMuc2lnbk1lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNpZ25UcmFuc2FjdGlvbiA9IHRoaXMuc2lnblRyYW5zYWN0aW9uLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zaWduVHlwZWREYXRhID0gdGhpcy5zaWduVHlwZWREYXRhLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zaWduQXV0aG9yaXphdGlvbiA9IHRoaXMuc2lnbkF1dGhvcml6YXRpb24uYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBhcmJpdHJhcnkgbWVzc2FnZXMuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTE5MSBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXAxOTFTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIHJvb3QgT2JqZWN0IGFyb3VuZCB0aGUgbWVzc2FnZVxuICAgKiBAcGFyYW0gcm9vdC5tZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ25cbiAgICogQHJldHVybnMgVGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgcHVibGljIHNpZ25NZXNzYWdlOiBDdXN0b21Tb3VyY2VbXCJzaWduTWVzc2FnZVwiXSA9IGFzeW5jICh7IG1lc3NhZ2UgfSkgPT4ge1xuICAgIGxldCBoZXg7XG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBoZXggPSBzdHJpbmdUb0hleChtZXNzYWdlKTtcbiAgICB9IGVsc2UgaWYgKGlzSGV4KG1lc3NhZ2UucmF3KSkge1xuICAgICAgaGV4ID0gbWVzc2FnZS5yYXc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhleCA9IGJ5dGVzVG9IZXgobWVzc2FnZS5yYXcpO1xuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hdHVyZSA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwMTkxKHsgZGF0YTogaGV4IH0pO1xuXG4gICAgcmV0dXJuIGVuc3VyZUhleChzaWduYXR1cmUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogYGNoYWluSWRgIG11c3QgYmUgc3BlY2lmaWVkIHdpdGhpbiB0aGUgYGRvbWFpbmAuXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbWV0ZXJzIFR5cGVkIGRhdGFcbiAgICogQHJldHVybnMgc2lnbmF0dXJlIGZvciB0aGUgdHlwZWQgZGF0YVxuICAgKi9cbiAgcHVibGljIHNpZ25UeXBlZERhdGE6IEN1c3RvbVNvdXJjZVtcInNpZ25UeXBlZERhdGFcIl0gPSBhc3luYyAocGFyYW1ldGVycykgPT4ge1xuICAgIGFzc2VydChwYXJhbWV0ZXJzLmRvbWFpbiwgXCJgZG9tYWluYCBtdXN0IGJlIGRlZmluZWRcIik7XG5cbiAgICBjb25zdCBjYXN0ZWRQYXJhbWV0ZXJzID0gcGFyYW1ldGVycyBhcyBFaXA3MTJTaWduUmVxdWVzdFtcInR5cGVkX2RhdGFcIl07XG4gICAgYXNzZXJ0KGNhc3RlZFBhcmFtZXRlcnMuZG9tYWluLmNoYWluSWQsIFwiYGRvbWFpbi5jaGFpbklkYCBtdXN0IGJlIGRlZmluZWRcIik7XG5cbiAgICBjb25zdCBzaWduYXR1cmUgPSBhd2FpdCB0aGlzLiNzaWduZXIuc2lnbkVpcDcxMih7XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNhc3RlZFBhcmFtZXRlcnMuZG9tYWluLmNoYWluSWQpLFxuICAgICAgdHlwZWRfZGF0YTogY2FzdGVkUGFyYW1ldGVycyxcbiAgICB9KTtcblxuICAgIHJldHVybiBlbnN1cmVIZXgoc2lnbmF0dXJlKTtcbiAgfTtcblxuICAvKipcbiAgICogU2lnbnMgRUlQLTc3MDIgYXV0aG9yaXphdGlvbiBkYXRhXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbWV0ZXJzIEF1dGhvcml6YXRpb24gcmVxdWVzdHNcbiAgICogQHJldHVybnMgU2lnbmVkIGF1dGhvcml6YXRpb25cbiAgICovXG4gIHB1YmxpYyBhc3luYyBzaWduQXV0aG9yaXphdGlvbihcbiAgICBwYXJhbWV0ZXJzOiBBdXRob3JpemF0aW9uUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxTaWduQXV0aG9yaXphdGlvblJldHVyblR5cGU+IHtcbiAgICBjb25zdCBoYXNoVG9TaWduID0gaGFzaEF1dGhvcml6YXRpb24ocGFyYW1ldGVycyk7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy4jc2lnbmVyLmtleSgpO1xuICAgIC8vIFRPRE8oQ1MtMzcyMCk6IHVzZSB0aGUgdHlwZWQgZW5kcG9pbnQgb25jZSB3ZSBoYXZlIGl0XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGtleS5zaWduQmxvYih7XG4gICAgICBtZXNzYWdlX2Jhc2U2NDogZW5jb2RlVG9CYXNlNjQoaGV4VG9CeXRlcyhoYXNoVG9TaWduKSksXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI3NpZ25lci5oYW5kbGVNZmEocmVzcCk7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gZW5zdXJlSGV4KGRhdGEuc2lnbmF0dXJlKTtcbiAgICByZXR1cm4ge1xuICAgICAgYWRkcmVzczogcGFyYW1ldGVycy5jb250cmFjdEFkZHJlc3MgPz8gcGFyYW1ldGVycy5hZGRyZXNzLFxuICAgICAgbm9uY2U6IHBhcmFtZXRlcnMubm9uY2UsXG4gICAgICBjaGFpbklkOiBwYXJhbWV0ZXJzLmNoYWluSWQsXG4gICAgICAuLi5wYXJzZVNpZ25hdHVyZShzaWduYXR1cmUpLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogSXQgaXMgcmVjb21tZW5kZWQgdG8gdXNlIGBwcmVwYXJlVHJhbnNhY3Rpb25SZXF1ZXN0YCBvbiB5b3VyIHJlcXVlc3RcbiAgICogYmVmb3JlIGNhbGxpbmcgdGhpcyBmdW5jdGlvbi5cbiAgICpcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBgY2hhaW5JZGAgbXVzdCBiZSBkZWZpbmVkLiBJZiB0cmFuc2FjdGlvbiB0eXBlIGlzIG5vdCBcImxlZ2FjeVwiIG9yIFwiZWlwMTU1OVwiLFxuICAgKiB0aGUga2V5IG11c3QgaGF2ZSB0aGUgYEFsbG93UmF3QmxvYlNpZ25pbmdgIGFsbG93IHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHRyYW5zYWN0aW9uIFRoZSB0cmFuc2FjdGlvbiB0byBzaWduXG4gICAqIEBwYXJhbSBvcHRpb25zIENvbnRhaW5zIGFuIG9wdGlvbmFsIGN1c3RvbSBzZXJpYWxpemVyXG4gICAqIEByZXR1cm5zIFNpZ25lZCB0cmFuc2FjdGlvblxuICAgKiBAdGhyb3dzIHtFcnJvcn0gaWYgXCJjaGFpbklkXCIgaXNuJ3Qgc3BlY2lmaWVkLCBvciBpZiB0cmFuc2FjdGlvbiBpcyBub3QgdHlwZSBcImxlZ2FjeVwiIG9yIFwiZWlwMTU1OVwiIGFuZCBrZXkgZG9lcyBub3QgaGF2ZSB0aGUgYEFsbG93UmF3QmxvYlNpZ25pbmdgIGFsbG93IHBvbGljeVxuICAgKi9cbiAgcHVibGljIHNpZ25UcmFuc2FjdGlvbjogQ3VzdG9tU291cmNlW1wic2lnblRyYW5zYWN0aW9uXCJdID0gYXN5bmMgKHRyYW5zYWN0aW9uLCBvcHRpb25zKSA9PiB7XG4gICAgYXNzZXJ0KHRyYW5zYWN0aW9uLmNoYWluSWQsIFwiYGNoYWluSWRgIG11c3QgYmUgZGVmaW5lZFwiKTtcblxuICAgIGNvbnN0IHNlcmlhbGl6ZXIgPSBvcHRpb25zPy5zZXJpYWxpemVyID8/IHNlcmlhbGl6ZVRyYW5zYWN0aW9uO1xuXG4gICAgLy8gb3VyIHR5cGUgc2lnbiB0cmFuc2FjdGlvbiBlbmRwb2ludCBvbmx5IHN1cHBvcnRzIHR5cGUgJ2xlZ2FjeScgb3IgJ2VpcDE1NTknXG4gICAgaWYgKHRyYW5zYWN0aW9uLnR5cGUgPT09IFwibGVnYWN5XCIgfHwgdHJhbnNhY3Rpb24udHlwZSA9PT0gXCJlaXAxNTU5XCIpIHtcbiAgICAgIGNvbnN0IGZvcm1hdHRlZCA9IGZvcm1hdFRyYW5zYWN0aW9uUmVxdWVzdCh0cmFuc2FjdGlvbik7XG4gICAgICBjb25zdCBybHBTaWduZWRUcmFuc2FjdGlvbiA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduVHJhbnNhY3Rpb24oe1xuICAgICAgICBjaGFpbl9pZDogdHJhbnNhY3Rpb24uY2hhaW5JZCxcbiAgICAgICAgdHg6IGZvcm1hdHRlZCBhcyBFdm1TaWduUmVxdWVzdFtcInR4XCJdLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIHNpbmNlIFZpZW0gYWxsb3dzIHVzZXJzIHRvIHBhc3MgYSBjdXN0b20gc2VyaWFsaXplciwgd2Ugd2lsbFxuICAgICAgLy8gbm93IHVuc2VyaWFsaXplIGFuZCByZXNlcmlhbGl6ZSB3aXRoIFZpZW0ncyBzZXJpYWxpemVyLlxuICAgICAgY29uc3QgeyByLCBzLCB2LCB5UGFyaXR5LCAuLi5wYXJzZWRUcmFuc2FjdGlvbiB9ID0gcGFyc2VUcmFuc2FjdGlvbihcbiAgICAgICAgZW5zdXJlSGV4KHJscFNpZ25lZFRyYW5zYWN0aW9uKSxcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBhd2FpdCBzZXJpYWxpemVyKHBhcnNlZFRyYW5zYWN0aW9uLCB7IHIsIHMsIHYsIHlQYXJpdHkgfSBhcyBTaWduYXR1cmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBvdGhlcndpc2UsIHNpZ24gdXNpbmcgYmxvYiBzaWduaW5nXG4gICAgICBjb25zdCBzZXJpYWxpemVkID0gYXdhaXQgc2VyaWFsaXplcih0cmFuc2FjdGlvbik7XG4gICAgICBjb25zdCBoYXNoVG9TaWduID0ga2VjY2FrMjU2KHNlcmlhbGl6ZWQpO1xuICAgICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy4jc2lnbmVyLmtleSgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGtleS5zaWduQmxvYih7XG4gICAgICAgIG1lc3NhZ2VfYmFzZTY0OiBlbmNvZGVUb0Jhc2U2NChoZXhUb0J5dGVzKGhhc2hUb1NpZ24pKSxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI3NpZ25lci5oYW5kbGVNZmEocmVzcCk7XG4gICAgICBjb25zdCBzaWduYXR1cmUgPSBwYXJzZVNpZ25hdHVyZShlbnN1cmVIZXgoZGF0YS5zaWduYXR1cmUpKTtcbiAgICAgIHJldHVybiBhd2FpdCBzZXJpYWxpemVyKHRyYW5zYWN0aW9uLCBzaWduYXR1cmUpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gaW5wdXQgQSBoZXggc3RyaW5nXG4gKiBAcmV0dXJucyB0aGUgaW5wdXQsIHR5cGUgbmFycm93ZWQgdG8gSGV4XG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgaW5wdXQgaXMgbm90IEhleFxuICovXG5mdW5jdGlvbiBlbnN1cmVIZXgoaW5wdXQ6IHN0cmluZyk6IEhleCB7XG4gIGFzc2VydChpc0hleChpbnB1dCksIGAke2lucHV0fSBpcyBub3QgaGV4YCk7XG4gIHJldHVybiBpbnB1dDtcbn1cblxuLyoqXG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSB0aGF0IGlzIGV4cGVjdGVkIHRvIGJlIHRydXRoeVxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIGVycm9yIG1lc3NhZ2UgaWYgdGhlIHZhbHVlIGlzIGZhbHN5XG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgdmFsdWUgaXMgbm90IHRydXRoeVxuICovXG5mdW5jdGlvbiBhc3NlcnQodmFsdWU6IHVua25vd24sIG1lc3NhZ2U6IHN0cmluZyk6IGFzc2VydHMgdmFsdWUge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICB9XG59XG4iXX0=