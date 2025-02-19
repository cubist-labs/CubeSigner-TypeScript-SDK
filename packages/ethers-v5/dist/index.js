"use strict";
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
var _Signer_signer;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = void 0;
const ethers_1 = require("ethers");
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const utils_1 = require("ethers/lib/utils");
/**
 * A ethers.js Signer using CubeSigner
 */
class Signer extends ethers_1.ethers.Signer {
    /**
     * Create new Signer instance
     *
     * @param address The key or the eth address of the account to use.
     * @param client The underlying client.
     * @param options The options to use for the Signer instance
     */
    constructor(address, client, options) {
        super();
        /** The CubeSigner-backed ethers signer */
        _Signer_signer.set(this, void 0);
        __classPrivateFieldSet(this, _Signer_signer, new cubesigner_sdk_1.EvmSigner(address, client, options), "f");
        if (options?.provider) {
            (0, utils_1.defineReadOnly)(this, "provider", options.provider);
        }
    }
    /** @returns The signer checksum address. */
    async getAddress() {
        return ethers_1.ethers.utils.getAddress(__classPrivateFieldGet(this, _Signer_signer, "f").address);
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *
     *  @param provider The provider instance to use.
     *  @returns The signer connected to signer.
     */
    connect(provider) {
        return new Signer(__classPrivateFieldGet(this, _Signer_signer, "f").address, __classPrivateFieldGet(this, _Signer_signer, "f").client, {
            ...__classPrivateFieldGet(this, _Signer_signer, "f").options,
            provider,
        });
    }
    /**
     * Construct a signing request from a transaction. This populates the transaction
     * type to `0x02` (EIP-1559) unless set.
     *
     * @param tx The transaction
     * @returns The EVM sign request to be sent to CubeSigner
     */
    async evmSignRequestFromTx(tx) {
        // get the chain id from the network or tx
        let chainId = tx.chainId;
        if (chainId === undefined) {
            const network = await this.provider?.getNetwork();
            chainId = network?.chainId;
            if (chainId === undefined) {
                throw new Error("Cannot determine chainId");
            }
        }
        // Convert the transaction into a JSON-RPC transaction
        const rpcTx = ethers_1.ethers.providers.JsonRpcProvider.hexlifyTransaction(tx, {
            from: true,
            type: true,
        });
        return {
            chain_id: chainId,
            tx: rpcTx,
        };
    }
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     *
     * @param tx The transaction to sign.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(tx) {
        const req = await this.evmSignRequestFromTx(await (0, utils_1.resolveProperties)(tx));
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signTransaction(req);
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     *
     * @param message The message to sign.  Bytes are treated as
     * as a binary messages; strings are treated as UTF8-messages.
     * @returns The signature.
     */
    async signMessage(message) {
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signEip191({
            data: (0, utils_1.isBytes)(message) ? (0, utils_1.hexlify)(message) : (0, cubesigner_sdk_1.encodeToHex)(message),
        });
    }
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
    async _signTypedData(domain, types, value) {
        let chainId = domain.chainId;
        if (chainId === undefined) {
            // get chain id from provider
            const network = await this.provider?.getNetwork();
            chainId = network?.chainId;
            if (chainId === undefined) {
                throw new Error("Cannot determine chainId");
            }
        }
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signEip712({
            chain_id: Number(chainId),
            typed_data: utils_1._TypedDataEncoder.getPayload(domain, types, value),
        });
    }
    /**
     * Initialize the signing a message using MFA approvals. This method populates
     * missing fields. If the signing does not require MFA, this method throws.
     *
     * @param tx The transaction to send.
     * @returns The MFA id associated with the signing request.
     */
    async sendTransactionMfaInit(tx) {
        const popTx = await this.populateTransaction(tx);
        const req = await this.evmSignRequestFromTx(popTx);
        const res = await __classPrivateFieldGet(this, _Signer_signer, "f").signEvm(req);
        return res.mfaId();
    }
    /**
     * Send a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will
     * execute.
     *
     * @param mfaRequest The approved MFA request.
     * @returns The result of submitting the transaction
     */
    async sendTransactionMfaApproved(mfaRequest) {
        const rplSigned = await __classPrivateFieldGet(this, _Signer_signer, "f").signTransactionMfaApproved(mfaRequest);
        return await this.provider.sendTransaction(rplSigned);
    }
}
exports.Signer = Signer;
_Signer_signer = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsbUNBQWdDO0FBVWhDLGdFQUFxRTtBQUVyRSw0Q0FNMEI7QUFVMUI7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsTUFBTTtJQUl2Qzs7Ozs7O09BTUc7SUFDSCxZQUFZLE9BQXFCLEVBQUUsTUFBd0IsRUFBRSxPQUF1QjtRQUNsRixLQUFLLEVBQUUsQ0FBQztRQVhWLDBDQUEwQztRQUNqQyxpQ0FBbUI7UUFXMUIsdUJBQUEsSUFBSSxrQkFBVyxJQUFJLDBCQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBQSxDQUFDO1FBQ3ZELElBQUksT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQ3RCLElBQUEsc0JBQWMsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRCxDQUFDO0lBQ0gsQ0FBQztJQUVELDRDQUE0QztJQUM1QyxLQUFLLENBQUMsVUFBVTtRQUNkLE9BQU8sZUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE9BQU8sQ0FBQyxRQUFtQztRQUN6QyxPQUFPLElBQUksTUFBTSxDQUFDLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLEVBQUUsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE1BQU0sRUFBRTtZQUMzRCxHQUFHLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPO1lBQ3ZCLFFBQVE7U0FDVCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEVBQXNCO1FBQy9DLDBDQUEwQztRQUMxQyxJQUFJLE9BQU8s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QixDQUFDLFVBQXNCO1FBQ3JELE1BQU0sU0FBUyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxzQkFBUSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVFLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6RCxDQUFDO0NBQ0Y7QUF0SkQsd0JBc0pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUeXBlZERhdGFEb21haW4sIFR5cGVkRGF0YUZpZWxkIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgZXRoZXJzIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHR5cGUge1xuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBDdWJlU2lnbmVyQ2xpZW50LFxuICBFdm1TaWduZXJPcHRpb25zLFxuICBLZXksXG4gIE1mYVJlcXVlc3QsXG59IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IGVuY29kZVRvSGV4LCBFdm1TaWduZXIgfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgdHlwZSB7IERlZmVycmFibGUsIEJ5dGVzIH0gZnJvbSBcImV0aGVycy9saWIvdXRpbHNcIjtcbmltcG9ydCB7XG4gIF9UeXBlZERhdGFFbmNvZGVyLFxuICBkZWZpbmVSZWFkT25seSxcbiAgaGV4bGlmeSxcbiAgaXNCeXRlcyxcbiAgcmVzb2x2ZVByb3BlcnRpZXMsXG59IGZyb20gXCJldGhlcnMvbGliL3V0aWxzXCI7XG5pbXBvcnQgdHlwZSB7IFRyYW5zYWN0aW9uUmVxdWVzdCwgVHJhbnNhY3Rpb25SZXNwb25zZSB9IGZyb20gXCJAZXRoZXJzcHJvamVjdC9hYnN0cmFjdC1wcm92aWRlclwiO1xuaW1wb3J0IHR5cGUgeyBUeXBlZERhdGFTaWduZXIgfSBmcm9tIFwiQGV0aGVyc3Byb2plY3QvYWJzdHJhY3Qtc2lnbmVyXCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lck9wdGlvbnMgZXh0ZW5kcyBFdm1TaWduZXJPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHByb3ZpZGVyIHRvIHVzZSAqL1xuICBwcm92aWRlcj86IG51bGwgfCBldGhlcnMucHJvdmlkZXJzLlByb3ZpZGVyO1xufVxuXG4vKipcbiAqIEEgZXRoZXJzLmpzIFNpZ25lciB1c2luZyBDdWJlU2lnbmVyXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXIgZXh0ZW5kcyBldGhlcnMuU2lnbmVyIGltcGxlbWVudHMgVHlwZWREYXRhU2lnbmVyIHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyLWJhY2tlZCBldGhlcnMgc2lnbmVyICovXG4gIHJlYWRvbmx5ICNzaWduZXI6IEV2bVNpZ25lcjtcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGtleSBvciB0aGUgZXRoIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gY2xpZW50IFRoZSB1bmRlcmx5aW5nIGNsaWVudC5cbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXkgfCBzdHJpbmcsIGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgb3B0aW9ucz86IFNpZ25lck9wdGlvbnMpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI3NpZ25lciA9IG5ldyBFdm1TaWduZXIoYWRkcmVzcywgY2xpZW50LCBvcHRpb25zKTtcbiAgICBpZiAob3B0aW9ucz8ucHJvdmlkZXIpIHtcbiAgICAgIGRlZmluZVJlYWRPbmx5KHRoaXMsIFwicHJvdmlkZXJcIiwgb3B0aW9ucy5wcm92aWRlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBzaWduZXIgY2hlY2tzdW0gYWRkcmVzcy4gKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBldGhlcnMudXRpbHMuZ2V0QWRkcmVzcyh0aGlzLiNzaWduZXIuYWRkcmVzcyk7XG4gIH1cblxuICAvKipcbiAgICogIFJldHVybnMgdGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gJSVwcm92aWRlciUlLlxuICAgKlxuICAgKiAgQHBhcmFtIHByb3ZpZGVyIFRoZSBwcm92aWRlciBpbnN0YW5jZSB0byB1c2UuXG4gICAqICBAcmV0dXJucyBUaGUgc2lnbmVyIGNvbm5lY3RlZCB0byBzaWduZXIuXG4gICAqL1xuICBjb25uZWN0KHByb3ZpZGVyOiBldGhlcnMucHJvdmlkZXJzLlByb3ZpZGVyKTogU2lnbmVyIHtcbiAgICByZXR1cm4gbmV3IFNpZ25lcih0aGlzLiNzaWduZXIuYWRkcmVzcywgdGhpcy4jc2lnbmVyLmNsaWVudCwge1xuICAgICAgLi4udGhpcy4jc2lnbmVyLm9wdGlvbnMsXG4gICAgICBwcm92aWRlcixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBzaWduaW5nIHJlcXVlc3QgZnJvbSBhIHRyYW5zYWN0aW9uLiBUaGlzIHBvcHVsYXRlcyB0aGUgdHJhbnNhY3Rpb25cbiAgICogdHlwZSB0byBgMHgwMmAgKEVJUC0xNTU5KSB1bmxlc3Mgc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gdHggVGhlIHRyYW5zYWN0aW9uXG4gICAqIEByZXR1cm5zIFRoZSBFVk0gc2lnbiByZXF1ZXN0IHRvIGJlIHNlbnQgdG8gQ3ViZVNpZ25lclxuICAgKi9cbiAgYXN5bmMgZXZtU2lnblJlcXVlc3RGcm9tVHgodHg6IFRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8RXZtU2lnblJlcXVlc3Q+IHtcbiAgICAvLyBnZXQgdGhlIGNoYWluIGlkIGZyb20gdGhlIG5ldHdvcmsgb3IgdHhcbiAgICBsZXQgY2hhaW5JZDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ7XG4gICAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkZXRlcm1pbmUgY2hhaW5JZFwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0IHRoZSB0cmFuc2FjdGlvbiBpbnRvIGEgSlNPTi1SUEMgdHJhbnNhY3Rpb25cbiAgICBjb25zdCBycGNUeCA9IGV0aGVycy5wcm92aWRlcnMuSnNvblJwY1Byb3ZpZGVyLmhleGxpZnlUcmFuc2FjdGlvbih0eCwge1xuICAgICAgZnJvbTogdHJ1ZSxcbiAgICAgIHR5cGU6IHRydWUsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gPEV2bVNpZ25SZXF1ZXN0PntcbiAgICAgIGNoYWluX2lkOiBjaGFpbklkLFxuICAgICAgdHg6IHJwY1R4IGFzIHVua25vd24sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24uIFRoaXMgbWV0aG9kIHdpbGwgYmxvY2sgaWYgdGhlIGtleSByZXF1aXJlcyBNRkEgYXBwcm92YWwuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBUaGUgdHJhbnNhY3Rpb24gdG8gc2lnbi5cbiAgICogQHJldHVybnMgSGV4LWVuY29kZWQgUkxQIGVuY29kaW5nIG9mIHRoZSB0cmFuc2FjdGlvbiBhbmQgaXRzIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UcmFuc2FjdGlvbih0eDogRGVmZXJyYWJsZTxUcmFuc2FjdGlvblJlcXVlc3Q+KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXEgPSBhd2FpdCB0aGlzLmV2bVNpZ25SZXF1ZXN0RnJvbVR4KGF3YWl0IHJlc29sdmVQcm9wZXJ0aWVzKHR4KSk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduVHJhbnNhY3Rpb24ocmVxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBhcmJpdHJhcnkgbWVzc2FnZXMuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTE5MSBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXAxOTFTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc2lnbi4gIEJ5dGVzIGFyZSB0cmVhdGVkIGFzXG4gICAqIGFzIGEgYmluYXJ5IG1lc3NhZ2VzOyBzdHJpbmdzIGFyZSB0cmVhdGVkIGFzIFVURjgtbWVzc2FnZXMuXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcgfCBCeXRlcyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwMTkxKDxFaXAxOTFTaWduUmVxdWVzdD57XG4gICAgICBkYXRhOiBpc0J5dGVzKG1lc3NhZ2UpID8gaGV4bGlmeShtZXNzYWdlKSA6IGVuY29kZVRvSGV4KG1lc3NhZ2UpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtNzEyIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDcxMlNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZG9tYWluIFRoZSBkb21haW4gb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB0eXBlcyBUaGUgdHlwZXMgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBfc2lnblR5cGVkRGF0YShcbiAgICBkb21haW46IFR5cGVkRGF0YURvbWFpbixcbiAgICB0eXBlczogUmVjb3JkPHN0cmluZywgQXJyYXk8VHlwZWREYXRhRmllbGQ+PixcbiAgICB2YWx1ZTogUmVjb3JkPHN0cmluZywgYW55PiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IGNoYWluSWQgPSBkb21haW4uY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBnZXQgY2hhaW4gaWQgZnJvbSBwcm92aWRlclxuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkO1xuICAgICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGV0ZXJtaW5lIGNoYWluSWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwNzEyKDxFaXA3MTJTaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHlwZWRfZGF0YTogX1R5cGVkRGF0YUVuY29kZXIuZ2V0UGF5bG9hZChkb21haW4sIHR5cGVzLCB2YWx1ZSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgc2lnbmluZyBhIG1lc3NhZ2UgdXNpbmcgTUZBIGFwcHJvdmFscy4gVGhpcyBtZXRob2QgcG9wdWxhdGVzXG4gICAqIG1pc3NpbmcgZmllbGRzLiBJZiB0aGUgc2lnbmluZyBkb2VzIG5vdCByZXF1aXJlIE1GQSwgdGhpcyBtZXRob2QgdGhyb3dzLlxuICAgKlxuICAgKiBAcGFyYW0gdHggVGhlIHRyYW5zYWN0aW9uIHRvIHNlbmQuXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoZSBzaWduaW5nIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFJbml0KHR4OiBUcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IHBvcFR4ID0gYXdhaXQgdGhpcy5wb3B1bGF0ZVRyYW5zYWN0aW9uKHR4KTtcbiAgICBjb25zdCByZXEgPSBhd2FpdCB0aGlzLmV2bVNpZ25SZXF1ZXN0RnJvbVR4KHBvcFR4KTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXIuc2lnbkV2bShyZXEpO1xuICAgIHJldHVybiByZXMubWZhSWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBhcHByb3ZlZCBNRkEgcmVxdWVzdC4gVGhlIE1GQSByZXF1ZXN0IGNvbnRhaW5zXG4gICAqIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhcHByb3ZlZCBzaWduaW5nIHJlcXVlc3QsIHdoaWNoIHRoaXMgbWV0aG9kIHdpbGxcbiAgICogZXhlY3V0ZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlcXVlc3QgVGhlIGFwcHJvdmVkIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHN1Ym1pdHRpbmcgdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0OiBNZmFSZXF1ZXN0KTogUHJvbWlzZTxUcmFuc2FjdGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgcnBsU2lnbmVkID0gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25UcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYVJlcXVlc3QpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3ZpZGVyIS5zZW5kVHJhbnNhY3Rpb24ocnBsU2lnbmVkKTtcbiAgfVxufVxuIl19