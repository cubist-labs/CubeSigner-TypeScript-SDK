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
     * @param {Key | string} address The key or the eth address of the account to use.
     * @param {CubeSignerClient} client The underlying client.
     * @param {SignerOptions} options The options to use for the Signer instance
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
    /** Resolves to the signer checksum address. */
    async getAddress() {
        return ethers_1.ethers.utils.getAddress(__classPrivateFieldGet(this, _Signer_signer, "f").address);
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *  @param {ethers.providers.Provider} provider The provider instance to use.
     *  @return {Signer} The signer connected to signer.
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
     * @param {TransactionRequest} tx The transaction
     * @return {EvmSignRequest} The EVM sign request to be sent to CubeSigner
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
     * @param {Deferrable<TransactionRequest>} tx The transaction to sign.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(tx) {
        const req = await this.evmSignRequestFromTx(await (0, utils_1.resolveProperties)(tx));
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signTransaction(req);
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {string | Bytes} message The message to sign.  Bytes are treated as
     * as a binary messages; strings are treated as UTF8-messages.
     * @return {Promise<string>} The signature.
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
     * @param {TypedDataDomain} domain The domain of the typed data.
     * @param {Record<string, Array<TypedDataField>>} types The types of the typed data.
     * @param {Record<string, any>} value The value of the typed data.
     * @return {Promise<string>} The signature.
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
     * @param {TransactionRequest} tx The transaction to send.
     * @return {string} The MFA id associated with the signing request.
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
     * @param {MfaRequest} mfaRequest The approved MFA request.
     * @return {TransactionResponse} The result of submitting the transaction
     */
    async sendTransactionMfaApproved(mfaRequest) {
        const rplSigned = await __classPrivateFieldGet(this, _Signer_signer, "f").signTransactionMfaApproved(mfaRequest);
        return await this.provider.sendTransaction(rplSigned);
    }
}
exports.Signer = Signer;
_Signer_signer = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsbUNBQWdDO0FBVWhDLGdFQUFxRTtBQUVyRSw0Q0FNMEI7QUFVMUI7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsTUFBTTtJQUl2Qzs7Ozs7T0FLRztJQUNILFlBQVksT0FBcUIsRUFBRSxNQUF3QixFQUFFLE9BQXVCO1FBQ2xGLEtBQUssRUFBRSxDQUFDO1FBVlYsMENBQTBDO1FBQ2pDLGlDQUFtQjtRQVUxQix1QkFBQSxJQUFJLGtCQUFXLElBQUksMEJBQVMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFBLENBQUM7UUFDdkQsSUFBSSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUM7WUFDdEIsSUFBQSxzQkFBYyxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELENBQUM7SUFDSCxDQUFDO0lBRUQsK0NBQStDO0lBQy9DLEtBQUssQ0FBQyxVQUFVO1FBQ2QsT0FBTyxlQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxPQUFPLENBQUMsUUFBbUM7UUFDekMsT0FBTyxJQUFJLE1BQU0sQ0FBQyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsT0FBTyxFQUFFLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxNQUFNLEVBQUU7WUFDM0QsR0FBRyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsT0FBTztZQUN2QixRQUFRO1NBQ1QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxFQUFzQjtRQUMvQywwQ0FBMEM7UUFDMUMsSUFBSSxPQUFPLEdB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VUFBc0I7UUFDckQsTUFBTSxTQUFTLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFRLENBQUMsMEJBQTBCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUUsT0FBTyxNQUFNLElBQUksQ0FBQyxRQUFTLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FDRjtBQS9JRCx3QkErSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFR5cGVkRGF0YURvbWFpbiwgVHlwZWREYXRhRmllbGQgfSBmcm9tIFwiZXRoZXJzXCI7XG5pbXBvcnQgeyBldGhlcnMgfSBmcm9tIFwiZXRoZXJzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIEN1YmVTaWduZXJDbGllbnQsXG4gIEV2bVNpZ25lck9wdGlvbnMsXG4gIEtleSxcbiAgTWZhUmVxdWVzdCxcbn0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgZW5jb2RlVG9IZXgsIEV2bVNpZ25lciB9IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB0eXBlIHsgRGVmZXJyYWJsZSwgQnl0ZXMgfSBmcm9tIFwiZXRoZXJzL2xpYi91dGlsc1wiO1xuaW1wb3J0IHtcbiAgX1R5cGVkRGF0YUVuY29kZXIsXG4gIGRlZmluZVJlYWRPbmx5LFxuICBoZXhsaWZ5LFxuICBpc0J5dGVzLFxuICByZXNvbHZlUHJvcGVydGllcyxcbn0gZnJvbSBcImV0aGVycy9saWIvdXRpbHNcIjtcbmltcG9ydCB0eXBlIHsgVHJhbnNhY3Rpb25SZXF1ZXN0LCBUcmFuc2FjdGlvblJlc3BvbnNlIH0gZnJvbSBcIkBldGhlcnNwcm9qZWN0L2Fic3RyYWN0LXByb3ZpZGVyXCI7XG5pbXBvcnQgdHlwZSB7IFR5cGVkRGF0YVNpZ25lciB9IGZyb20gXCJAZXRoZXJzcHJvamVjdC9hYnN0cmFjdC1zaWduZXJcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyT3B0aW9ucyBleHRlbmRzIEV2bVNpZ25lck9wdGlvbnMge1xuICAvKiogT3B0aW9uYWwgcHJvdmlkZXIgdG8gdXNlICovXG4gIHByb3ZpZGVyPzogbnVsbCB8IGV0aGVycy5wcm92aWRlcnMuUHJvdmlkZXI7XG59XG5cbi8qKlxuICogQSBldGhlcnMuanMgU2lnbmVyIHVzaW5nIEN1YmVTaWduZXJcbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lciBleHRlbmRzIGV0aGVycy5TaWduZXIgaW1wbGVtZW50cyBUeXBlZERhdGFTaWduZXIge1xuICAvKiogVGhlIEN1YmVTaWduZXItYmFja2VkIGV0aGVycyBzaWduZXIgKi9cbiAgcmVhZG9ubHkgI3NpZ25lcjogRXZtU2lnbmVyO1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IFNpZ25lciBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IFRoZSB1bmRlcmx5aW5nIGNsaWVudC5cbiAgICogQHBhcmFtIHtTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5IHwgc3RyaW5nLCBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIG9wdGlvbnM/OiBTaWduZXJPcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNzaWduZXIgPSBuZXcgRXZtU2lnbmVyKGFkZHJlc3MsIGNsaWVudCwgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnM/LnByb3ZpZGVyKSB7XG4gICAgICBkZWZpbmVSZWFkT25seSh0aGlzLCBcInByb3ZpZGVyXCIsIG9wdGlvbnMucHJvdmlkZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZXNvbHZlcyB0byB0aGUgc2lnbmVyIGNoZWNrc3VtIGFkZHJlc3MuICovXG4gIGFzeW5jIGdldEFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gZXRoZXJzLnV0aWxzLmdldEFkZHJlc3ModGhpcy4jc2lnbmVyLmFkZHJlc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqICBSZXR1cm5zIHRoZSBzaWduZXIgY29ubmVjdGVkIHRvICUlcHJvdmlkZXIlJS5cbiAgICogIEBwYXJhbSB7ZXRoZXJzLnByb3ZpZGVycy5Qcm92aWRlcn0gcHJvdmlkZXIgVGhlIHByb3ZpZGVyIGluc3RhbmNlIHRvIHVzZS5cbiAgICogIEByZXR1cm4ge1NpZ25lcn0gVGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gc2lnbmVyLlxuICAgKi9cbiAgY29ubmVjdChwcm92aWRlcjogZXRoZXJzLnByb3ZpZGVycy5Qcm92aWRlcik6IFNpZ25lciB7XG4gICAgcmV0dXJuIG5ldyBTaWduZXIodGhpcy4jc2lnbmVyLmFkZHJlc3MsIHRoaXMuI3NpZ25lci5jbGllbnQsIHtcbiAgICAgIC4uLnRoaXMuI3NpZ25lci5vcHRpb25zLFxuICAgICAgcHJvdmlkZXIsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgc2lnbmluZyByZXF1ZXN0IGZyb20gYSB0cmFuc2FjdGlvbi4gVGhpcyBwb3B1bGF0ZXMgdGhlIHRyYW5zYWN0aW9uXG4gICAqIHR5cGUgdG8gYDB4MDJgIChFSVAtMTU1OSkgdW5sZXNzIHNldC5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJuIHtFdm1TaWduUmVxdWVzdH0gVGhlIEVWTSBzaWduIHJlcXVlc3QgdG8gYmUgc2VudCB0byBDdWJlU2lnbmVyXG4gICAqL1xuICBhc3luYyBldm1TaWduUmVxdWVzdEZyb21UeCh0eDogVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxFdm1TaWduUmVxdWVzdD4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkOiBudW1iZXIgfCB1bmRlZmluZWQgPSB0eC5jaGFpbklkO1xuICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG5ldHdvcmsgPSBhd2FpdCB0aGlzLnByb3ZpZGVyPy5nZXROZXR3b3JrKCk7XG4gICAgICBjaGFpbklkID0gbmV0d29yaz8uY2hhaW5JZDtcbiAgICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRldGVybWluZSBjaGFpbklkXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvbnZlcnQgdGhlIHRyYW5zYWN0aW9uIGludG8gYSBKU09OLVJQQyB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHJwY1R4ID0gZXRoZXJzLnByb3ZpZGVycy5Kc29uUnBjUHJvdmlkZXIuaGV4bGlmeVRyYW5zYWN0aW9uKHR4LCB7XG4gICAgICBmcm9tOiB0cnVlLFxuICAgICAgdHlwZTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIHJldHVybiA8RXZtU2lnblJlcXVlc3Q+e1xuICAgICAgY2hhaW5faWQ6IGNoYWluSWQsXG4gICAgICB0eDogcnBjVHggYXMgdW5rbm93bixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2Qgd2lsbCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbC5cbiAgICogQHBhcmFtIHtEZWZlcnJhYmxlPFRyYW5zYWN0aW9uUmVxdWVzdD59IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IERlZmVycmFibGU8VHJhbnNhY3Rpb25SZXF1ZXN0Pik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVxID0gYXdhaXQgdGhpcy5ldm1TaWduUmVxdWVzdEZyb21UeChhd2FpdCByZXNvbHZlUHJvcGVydGllcyh0eCkpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduZXIuc2lnblRyYW5zYWN0aW9uKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC0xOTEgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwMTkxU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgQnl0ZXN9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc2lnbi4gIEJ5dGVzIGFyZSB0cmVhdGVkIGFzXG4gICAqIGFzIGEgYmluYXJ5IG1lc3NhZ2VzOyBzdHJpbmdzIGFyZSB0cmVhdGVkIGFzIFVURjgtbWVzc2FnZXMuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZyB8IEJ5dGVzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25FaXAxOTEoPEVpcDE5MVNpZ25SZXF1ZXN0PntcbiAgICAgIGRhdGE6IGlzQnl0ZXMobWVzc2FnZSkgPyBoZXhsaWZ5KG1lc3NhZ2UpIDogZW5jb2RlVG9IZXgobWVzc2FnZSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgRUlQLTcxMiB0eXBlZCBkYXRhLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC03MTIgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwNzEyU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7VHlwZWREYXRhRG9tYWlufSBkb21haW4gVGhlIGRvbWFpbiBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBBcnJheTxUeXBlZERhdGFGaWVsZD4+fSB0eXBlcyBUaGUgdHlwZXMgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBfc2lnblR5cGVkRGF0YShcbiAgICBkb21haW46IFR5cGVkRGF0YURvbWFpbixcbiAgICB0eXBlczogUmVjb3JkPHN0cmluZywgQXJyYXk8VHlwZWREYXRhRmllbGQ+PixcbiAgICB2YWx1ZTogUmVjb3JkPHN0cmluZywgYW55PiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IGNoYWluSWQgPSBkb21haW4uY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBnZXQgY2hhaW4gaWQgZnJvbSBwcm92aWRlclxuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkO1xuICAgICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGV0ZXJtaW5lIGNoYWluSWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwNzEyKDxFaXA3MTJTaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHlwZWRfZGF0YTogX1R5cGVkRGF0YUVuY29kZXIuZ2V0UGF5bG9hZChkb21haW4sIHR5cGVzLCB2YWx1ZSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgc2lnbmluZyBhIG1lc3NhZ2UgdXNpbmcgTUZBIGFwcHJvdmFscy4gVGhpcyBtZXRob2QgcG9wdWxhdGVzXG4gICAqIG1pc3NpbmcgZmllbGRzLiBJZiB0aGUgc2lnbmluZyBkb2VzIG5vdCByZXF1aXJlIE1GQSwgdGhpcyBtZXRob2QgdGhyb3dzLlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9uUmVxdWVzdH0gdHggVGhlIHRyYW5zYWN0aW9uIHRvIHNlbmQuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIE1GQSBpZCBhc3NvY2lhdGVkIHdpdGggdGhlIHNpZ25pbmcgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUluaXQodHg6IFRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcG9wVHggPSBhd2FpdCB0aGlzLnBvcHVsYXRlVHJhbnNhY3Rpb24odHgpO1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgocG9wVHgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRXZtKHJlcSk7XG4gICAgcmV0dXJuIHJlcy5tZmFJZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbFxuICAgKiBleGVjdXRlLlxuICAgKiBAcGFyYW0ge01mYVJlcXVlc3R9IG1mYVJlcXVlc3QgVGhlIGFwcHJvdmVkIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtUcmFuc2FjdGlvblJlc3BvbnNlfSBUaGUgcmVzdWx0IG9mIHN1Ym1pdHRpbmcgdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0OiBNZmFSZXF1ZXN0KTogUHJvbWlzZTxUcmFuc2FjdGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgcnBsU2lnbmVkID0gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25UcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYVJlcXVlc3QpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3ZpZGVyIS5zZW5kVHJhbnNhY3Rpb24ocnBsU2lnbmVkKTtcbiAgfVxufVxuIl19