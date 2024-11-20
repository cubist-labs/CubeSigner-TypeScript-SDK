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
/**
 * A ethers.js Signer using CubeSigner
 */
class Signer extends ethers_1.ethers.AbstractSigner {
    /**
     * Create new Signer instance
     * @param {Key | string} address The key or the eth address of the account to use.
     * @param {CubeSignerClient} client The underlying client.
     * @param {SignerOptions} options The options to use for the Signer instance
     */
    constructor(address, client, options) {
        super(options?.provider);
        /** The CubeSigner-backed ethers signer */
        _Signer_signer.set(this, void 0);
        __classPrivateFieldSet(this, _Signer_signer, new cubesigner_sdk_1.EvmSigner(address, client, options), "f");
    }
    /** Resolves to the checksummed signer address. */
    async getAddress() {
        return ethers_1.ethers.getAddress(__classPrivateFieldGet(this, _Signer_signer, "f").address);
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *  @param {null | ethers.Provider} provider The optional provider instance to use.
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
     * @param {ethers.TransactionRequest} tx The transaction
     * @return {EvmSignRequest} The EVM sign request to be sent to CubeSigner
     */
    async evmSignRequestFromTx(tx) {
        // get the chain id from the network or tx
        let chainId = tx.chainId;
        if (chainId === undefined) {
            const network = await this.provider?.getNetwork();
            chainId = network?.chainId?.toString();
            if (chainId === undefined) {
                throw new Error("Cannot determine chainId");
            }
        }
        // Convert the transaction into a JSON-RPC transaction
        const rpcTx = this.provider instanceof ethers_1.JsonRpcApiProvider
            ? this.provider.getRpcTransaction(tx)
            : // We can just call the getRpcTransaction with a
                // null receiver since it doesn't actually use it
                // (and really should be declared static).
                ethers_1.JsonRpcApiProvider.prototype.getRpcTransaction.call(null, tx);
        if (!rpcTx.type) {
            rpcTx.type = rpcTx.gasPrice ? "0x00" : "0x02";
        }
        else {
            rpcTx.type = (0, ethers_1.toBeHex)(rpcTx.type, 1);
        }
        return {
            chain_id: Number(chainId),
            tx: rpcTx,
        };
    }
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     * @param {ethers.TransactionRequest} tx The transaction to sign.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(tx) {
        const req = await this.evmSignRequestFromTx(tx);
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signTransaction(req);
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    async signMessage(message) {
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signEip191({
            data: (0, cubesigner_sdk_1.encodeToHex)(message),
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
    async signTypedData(domain, types, value) {
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
            typed_data: ethers_1.TypedDataEncoder.getPayload(domain, types, value),
        });
    }
    /**
     * Initialize the signing a message using MFA approvals. This method populates
     * missing fields. If the signing does not require MFA, this method throws.
     * @param {ethers.TransactionRequest} tx The transaction to send.
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
     * @return {ethers.TransactionResponse} The result of submitting the transaction
     */
    async sendTransactionMfaApproved(mfaRequest) {
        const rlpSigned = await __classPrivateFieldGet(this, _Signer_signer, "f").signTransactionMfaApproved(mfaRequest);
        return await this.provider.broadcastTransaction(rlpSigned);
    }
}
exports.Signer = Signer;
_Signer_signer = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsbUNBQStFO0FBVS9FLGdFQUFxRTtBQVFyRTs7R0FFRztBQUNILE1BQWEsTUFBTyxTQUFRLGVBQU0sQ0FBQyxjQUFjO0lBSS9DOzs7OztPQUtHO0lBQ0gsWUFBWSxPQUFxQixFQUFFLE1BQXdCLEVBQUUsT0FBdUI7UUFDbEYsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQVYzQiwwQ0FBMEM7UUFDakMsaUNBQW1CO1FBVTFCLHVCQUFBLElBQUksa0JBQVcsSUFBSSwwQkFBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQUEsQ0FBQztJQUN6RCxDQUFDO0lBRUQsa0RBQWtEO0lBQ2xELEtBQUssQ0FBQyxVQUFVO1FBQ2QsT0FBTyxlQUFNLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE9BQU8sQ0FBQyxRQUFnQztRQUN0QyxPQUFPLElBQUksTUFBTSxDQUFDLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLEVBQUUsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE1BQU0sRUFBRTtZQUMzRCxHQUFHLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPO1lBQ3ZCLFFBQVE7U0FDVCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEVBQTZCO1FBQ3RELDBDQUEwQztRQUMxQyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3pCLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzFCLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUs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RyxNQUFNLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUMsT0FBTyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxVQUFzQjtRQUNyRCxNQUFNLFNBQVMsR0FBRyxNQUFNLHVCQUFBLElBQUksc0JBQVEsQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM1RSxPQUFPLE1BQU0sSUFBSSxDQUFDLFFBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5RCxDQUFDO0NBQ0Y7QUFwSkQsd0JBb0pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUeXBlZERhdGFEb21haW4sIFR5cGVkRGF0YUZpZWxkIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgSnNvblJwY0FwaVByb3ZpZGVyLCBUeXBlZERhdGFFbmNvZGVyLCBldGhlcnMsIHRvQmVIZXggfSBmcm9tIFwiZXRoZXJzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEV2bVNpZ25lck9wdGlvbnMsXG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIEN1YmVTaWduZXJDbGllbnQsXG4gIEtleSxcbiAgTWZhUmVxdWVzdCxcbn0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgRXZtU2lnbmVyLCBlbmNvZGVUb0hleCB9IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyT3B0aW9ucyBleHRlbmRzIEV2bVNpZ25lck9wdGlvbnMge1xuICAvKiogT3B0aW9uYWwgcHJvdmlkZXIgdG8gdXNlICovXG4gIHByb3ZpZGVyPzogbnVsbCB8IGV0aGVycy5Qcm92aWRlcjtcbn1cblxuLyoqXG4gKiBBIGV0aGVycy5qcyBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lclxuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyIGV4dGVuZHMgZXRoZXJzLkFic3RyYWN0U2lnbmVyIHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyLWJhY2tlZCBldGhlcnMgc2lnbmVyICovXG4gIHJlYWRvbmx5ICNzaWduZXI6IEV2bVNpZ25lcjtcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGFkZHJlc3MgVGhlIGtleSBvciB0aGUgZXRoIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNsaWVudCBUaGUgdW5kZXJseWluZyBjbGllbnQuXG4gICAqIEBwYXJhbSB7U2lnbmVyT3B0aW9uc30gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byB1c2UgZm9yIHRoZSBTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFkZHJlc3M6IEtleSB8IHN0cmluZywgY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBvcHRpb25zPzogU2lnbmVyT3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnM/LnByb3ZpZGVyKTtcbiAgICB0aGlzLiNzaWduZXIgPSBuZXcgRXZtU2lnbmVyKGFkZHJlc3MsIGNsaWVudCwgb3B0aW9ucyk7XG4gIH1cblxuICAvKiogUmVzb2x2ZXMgdG8gdGhlIGNoZWNrc3VtbWVkIHNpZ25lciBhZGRyZXNzLiAqL1xuICBhc3luYyBnZXRBZGRyZXNzKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGV0aGVycy5nZXRBZGRyZXNzKHRoaXMuI3NpZ25lci5hZGRyZXNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAgUmV0dXJucyB0aGUgc2lnbmVyIGNvbm5lY3RlZCB0byAlJXByb3ZpZGVyJSUuXG4gICAqICBAcGFyYW0ge251bGwgfCBldGhlcnMuUHJvdmlkZXJ9IHByb3ZpZGVyIFRoZSBvcHRpb25hbCBwcm92aWRlciBpbnN0YW5jZSB0byB1c2UuXG4gICAqICBAcmV0dXJuIHtTaWduZXJ9IFRoZSBzaWduZXIgY29ubmVjdGVkIHRvIHNpZ25lci5cbiAgICovXG4gIGNvbm5lY3QocHJvdmlkZXI6IG51bGwgfCBldGhlcnMuUHJvdmlkZXIpOiBTaWduZXIge1xuICAgIHJldHVybiBuZXcgU2lnbmVyKHRoaXMuI3NpZ25lci5hZGRyZXNzLCB0aGlzLiNzaWduZXIuY2xpZW50LCB7XG4gICAgICAuLi50aGlzLiNzaWduZXIub3B0aW9ucyxcbiAgICAgIHByb3ZpZGVyLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIHNpZ25pbmcgcmVxdWVzdCBmcm9tIGEgdHJhbnNhY3Rpb24uIFRoaXMgcG9wdWxhdGVzIHRoZSB0cmFuc2FjdGlvblxuICAgKiB0eXBlIHRvIGAweDAyYCAoRUlQLTE1NTkpIHVubGVzcyBzZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdH0gdHggVGhlIHRyYW5zYWN0aW9uXG4gICAqIEByZXR1cm4ge0V2bVNpZ25SZXF1ZXN0fSBUaGUgRVZNIHNpZ24gcmVxdWVzdCB0byBiZSBzZW50IHRvIEN1YmVTaWduZXJcbiAgICovXG4gIGFzeW5jIGV2bVNpZ25SZXF1ZXN0RnJvbVR4KHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxFdm1TaWduUmVxdWVzdD4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ/LnRvU3RyaW5nKCk7XG4gICAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkZXRlcm1pbmUgY2hhaW5JZFwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0IHRoZSB0cmFuc2FjdGlvbiBpbnRvIGEgSlNPTi1SUEMgdHJhbnNhY3Rpb25cbiAgICBjb25zdCBycGNUeCA9XG4gICAgICB0aGlzLnByb3ZpZGVyIGluc3RhbmNlb2YgSnNvblJwY0FwaVByb3ZpZGVyXG4gICAgICAgID8gdGhpcy5wcm92aWRlci5nZXRScGNUcmFuc2FjdGlvbih0eClcbiAgICAgICAgOiAvLyBXZSBjYW4ganVzdCBjYWxsIHRoZSBnZXRScGNUcmFuc2FjdGlvbiB3aXRoIGFcbiAgICAgICAgICAvLyBudWxsIHJlY2VpdmVyIHNpbmNlIGl0IGRvZXNuJ3QgYWN0dWFsbHkgdXNlIGl0XG4gICAgICAgICAgLy8gKGFuZCByZWFsbHkgc2hvdWxkIGJlIGRlY2xhcmVkIHN0YXRpYykuXG4gICAgICAgICAgSnNvblJwY0FwaVByb3ZpZGVyLnByb3RvdHlwZS5nZXRScGNUcmFuc2FjdGlvbi5jYWxsKG51bGwsIHR4KTtcblxuICAgIGlmICghcnBjVHgudHlwZSkge1xuICAgICAgcnBjVHgudHlwZSA9IHJwY1R4Lmdhc1ByaWNlID8gXCIweDAwXCIgOiBcIjB4MDJcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgcnBjVHgudHlwZSA9IHRvQmVIZXgocnBjVHgudHlwZSwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDxFdm1TaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHg6IHJwY1R4LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgodHgpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduZXIuc2lnblRyYW5zYWN0aW9uKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC0xOTEgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwMTkxU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgVWludDhBcnJheX0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcgfCBVaW50OEFycmF5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25FaXAxOTEoPEVpcDE5MVNpZ25SZXF1ZXN0PntcbiAgICAgIGRhdGE6IGVuY29kZVRvSGV4KG1lc3NhZ2UpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtNzEyIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDcxMlNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge1R5cGVkRGF0YURvbWFpbn0gZG9tYWluIFRoZSBkb21haW4gb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgQXJyYXk8VHlwZWREYXRhRmllbGQ+Pn0gdHlwZXMgVGhlIHR5cGVzIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblR5cGVkRGF0YShcbiAgICBkb21haW46IFR5cGVkRGF0YURvbWFpbixcbiAgICB0eXBlczogUmVjb3JkPHN0cmluZywgQXJyYXk8VHlwZWREYXRhRmllbGQ+PixcbiAgICB2YWx1ZTogUmVjb3JkPHN0cmluZywgYW55PiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IGNoYWluSWQgPSBkb21haW4uY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBnZXQgY2hhaW4gaWQgZnJvbSBwcm92aWRlclxuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkO1xuICAgICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGV0ZXJtaW5lIGNoYWluSWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwNzEyKDxFaXA3MTJTaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHlwZWRfZGF0YTogVHlwZWREYXRhRW5jb2Rlci5nZXRQYXlsb2FkKGRvbWFpbiwgdHlwZXMsIHZhbHVlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBzaWduaW5nIGEgbWVzc2FnZSB1c2luZyBNRkEgYXBwcm92YWxzLiBUaGlzIG1ldGhvZCBwb3B1bGF0ZXNcbiAgICogbWlzc2luZyBmaWVsZHMuIElmIHRoZSBzaWduaW5nIGRvZXMgbm90IHJlcXVpcmUgTUZBLCB0aGlzIG1ldGhvZCB0aHJvd3MuXG4gICAqIEBwYXJhbSB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdH0gdHggVGhlIHRyYW5zYWN0aW9uIHRvIHNlbmQuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIE1GQSBpZCBhc3NvY2lhdGVkIHdpdGggdGhlIHNpZ25pbmcgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUluaXQodHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHBvcFR4ID0gYXdhaXQgdGhpcy5wb3B1bGF0ZVRyYW5zYWN0aW9uKHR4KTtcbiAgICBjb25zdCByZXEgPSBhd2FpdCB0aGlzLmV2bVNpZ25SZXF1ZXN0RnJvbVR4KHBvcFR4KTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXIuc2lnbkV2bShyZXEpO1xuICAgIHJldHVybiByZXMubWZhSWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBhcHByb3ZlZCBNRkEgcmVxdWVzdC4gVGhlIE1GQSByZXF1ZXN0IGNvbnRhaW5zXG4gICAqIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhcHByb3ZlZCBzaWduaW5nIHJlcXVlc3QsIHdoaWNoIHRoaXMgbWV0aG9kIHdpbGxcbiAgICogZXhlY3V0ZS5cbiAgICogQHBhcmFtIHtNZmFSZXF1ZXN0fSBtZmFSZXF1ZXN0IFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVzcG9uc2V9IFRoZSByZXN1bHQgb2Ygc3VibWl0dGluZyB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYVJlcXVlc3Q6IE1mYVJlcXVlc3QpOiBQcm9taXNlPGV0aGVycy5UcmFuc2FjdGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgcmxwU2lnbmVkID0gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25UcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYVJlcXVlc3QpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3ZpZGVyIS5icm9hZGNhc3RUcmFuc2FjdGlvbihybHBTaWduZWQpO1xuICB9XG59XG4iXX0=