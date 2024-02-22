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
     * @param {KeyInfo | string} address The key or the eth address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {SignerOptions} options The options to use for the Signer instance
     */
    constructor(address, signerSession, options) {
        super(options?.provider);
        /** The CubeSigner-backed ethers signer */
        _Signer_signer.set(this, void 0);
        __classPrivateFieldSet(this, _Signer_signer, new cubesigner_sdk_1.EvmSigner(address, signerSession, options), "f");
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
        return new Signer(__classPrivateFieldGet(this, _Signer_signer, "f").address, __classPrivateFieldGet(this, _Signer_signer, "f").signerSession, {
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
        rpcTx.type = (0, ethers_1.toBeHex)(tx.type ?? 0x02, 1); // we expect 0x0[0-2]
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typed_data: {
                domain,
                types,
                primaryType: ethers_1.TypedDataEncoder.getPrimaryType(types),
                message: value,
            },
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
     * @param {MfaRequestInfo} mfaInfo The approved MFA request.
     * @return {ethers.TransactionResponse} The result of submitting the transaction
     */
    async sendTransactionMfaApproved(mfaInfo) {
        const rlpSigned = await __classPrivateFieldGet(this, _Signer_signer, "f").signTransactionMfaApproved(mfaInfo);
        return await this.provider.broadcastTransaction(rlpSigned);
    }
}
exports.Signer = Signer;
_Signer_signer = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBT2dCO0FBQ2hCLGdFQVVxQztBQVFyQzs7R0FFRztBQUNILE1BQWEsTUFBTyxTQUFRLGVBQU0sQ0FBQyxjQUFjO0lBSS9DOzs7OztPQUtHO0lBQ0gsWUFBWSxPQUF5QixFQUFFLGFBQTRCLEVBQUUsT0FBdUI7UUFDMUYsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQVYzQiwwQ0FBMEM7UUFDakMsaUNBQW1CO1FBVTFCLHVCQUFBLElBQUksa0JBQVcsSUFBSSwwQkFBUyxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsT0FBTyxDQUFDLE1BQUEsQ0FBQztJQUNoRSxDQUFDO0lBRUQsa0RBQWtEO0lBQ2xELEtBQUssQ0FBQyxVQUFVO1FBQ2QsT0FBTyxlQUFNLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE9BQU8sQ0FBQyxRQUFnQztRQUN0QyxPQUFPLElBQUksTUFBTSxDQUFDLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLEVBQUUsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLGFBQWEsRUFBRTtZQUNsRSxHQUFHLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPO1lBQ3ZCLFFBQVE7U0FDVCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEVBQTZCO1FBQ3RELDBDQUEwQztRQUMxQyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3pCLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzFCLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUs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SyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxPQUF1QjtRQUN0RCxNQUFNLFNBQVMsR0FBRyxNQUFNLHVCQUFBLElBQUksc0JBQVEsQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6RSxPQUFPLE1BQU0sSUFBSSxDQUFDLFFBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5RCxDQUFDO0NBQ0Y7QUFwSkQsd0JBb0pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgSnNvblJwY0FwaVByb3ZpZGVyLFxuICBUeXBlZERhdGFEb21haW4sXG4gIFR5cGVkRGF0YUZpZWxkLFxuICBUeXBlZERhdGFFbmNvZGVyLFxuICBldGhlcnMsXG4gIHRvQmVIZXgsXG59IGZyb20gXCJldGhlcnNcIjtcbmltcG9ydCB7XG4gIEV2bVNpZ25lcixcbiAgRXZtU2lnbmVyT3B0aW9ucyxcbiAgS2V5SW5mbyxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVxdWVzdCxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIFNpZ25lclNlc3Npb24sXG4gIGVuY29kZVRvSGV4LFxufSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lck9wdGlvbnMgZXh0ZW5kcyBFdm1TaWduZXJPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHByb3ZpZGVyIHRvIHVzZSAqL1xuICBwcm92aWRlcj86IG51bGwgfCBldGhlcnMuUHJvdmlkZXI7XG59XG5cbi8qKlxuICogQSBldGhlcnMuanMgU2lnbmVyIHVzaW5nIEN1YmVTaWduZXJcbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lciBleHRlbmRzIGV0aGVycy5BYnN0cmFjdFNpZ25lciB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lci1iYWNrZWQgZXRoZXJzIHNpZ25lciAqL1xuICByZWFkb25seSAjc2lnbmVyOiBFdm1TaWduZXI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7S2V5SW5mbyB8IHN0cmluZ30gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc2lnbmVyU2Vzc2lvbiBUaGUgdW5kZXJseWluZyBTaWduZXIgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5SW5mbyB8IHN0cmluZywgc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbiwgb3B0aW9ucz86IFNpZ25lck9wdGlvbnMpIHtcbiAgICBzdXBlcihvcHRpb25zPy5wcm92aWRlcik7XG4gICAgdGhpcy4jc2lnbmVyID0gbmV3IEV2bVNpZ25lcihhZGRyZXNzLCBzaWduZXJTZXNzaW9uLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBSZXNvbHZlcyB0byB0aGUgY2hlY2tzdW1tZWQgc2lnbmVyIGFkZHJlc3MuICovXG4gIGFzeW5jIGdldEFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gZXRoZXJzLmdldEFkZHJlc3ModGhpcy4jc2lnbmVyLmFkZHJlc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqICBSZXR1cm5zIHRoZSBzaWduZXIgY29ubmVjdGVkIHRvICUlcHJvdmlkZXIlJS5cbiAgICogIEBwYXJhbSB7bnVsbCB8IGV0aGVycy5Qcm92aWRlcn0gcHJvdmlkZXIgVGhlIG9wdGlvbmFsIHByb3ZpZGVyIGluc3RhbmNlIHRvIHVzZS5cbiAgICogIEByZXR1cm4ge1NpZ25lcn0gVGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gc2lnbmVyLlxuICAgKi9cbiAgY29ubmVjdChwcm92aWRlcjogbnVsbCB8IGV0aGVycy5Qcm92aWRlcik6IFNpZ25lciB7XG4gICAgcmV0dXJuIG5ldyBTaWduZXIodGhpcy4jc2lnbmVyLmFkZHJlc3MsIHRoaXMuI3NpZ25lci5zaWduZXJTZXNzaW9uLCB7XG4gICAgICAuLi50aGlzLiNzaWduZXIub3B0aW9ucyxcbiAgICAgIHByb3ZpZGVyLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIHNpZ25pbmcgcmVxdWVzdCBmcm9tIGEgdHJhbnNhY3Rpb24uIFRoaXMgcG9wdWxhdGVzIHRoZSB0cmFuc2FjdGlvblxuICAgKiB0eXBlIHRvIGAweDAyYCAoRUlQLTE1NTkpIHVubGVzcyBzZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdH0gdHggVGhlIHRyYW5zYWN0aW9uXG4gICAqIEByZXR1cm4ge0V2bVNpZ25SZXF1ZXN0fSBUaGUgRVZNIHNpZ24gcmVxdWVzdCB0byBiZSBzZW50IHRvIEN1YmVTaWduZXJcbiAgICovXG4gIGFzeW5jIGV2bVNpZ25SZXF1ZXN0RnJvbVR4KHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxFdm1TaWduUmVxdWVzdD4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ/LnRvU3RyaW5nKCk7XG4gICAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkZXRlcm1pbmUgY2hhaW5JZFwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0IHRoZSB0cmFuc2FjdGlvbiBpbnRvIGEgSlNPTi1SUEMgdHJhbnNhY3Rpb25cbiAgICBjb25zdCBycGNUeCA9XG4gICAgICB0aGlzLnByb3ZpZGVyIGluc3RhbmNlb2YgSnNvblJwY0FwaVByb3ZpZGVyXG4gICAgICAgID8gdGhpcy5wcm92aWRlci5nZXRScGNUcmFuc2FjdGlvbih0eClcbiAgICAgICAgOiAvLyBXZSBjYW4ganVzdCBjYWxsIHRoZSBnZXRScGNUcmFuc2FjdGlvbiB3aXRoIGFcbiAgICAgICAgICAvLyBudWxsIHJlY2VpdmVyIHNpbmNlIGl0IGRvZXNuJ3QgYWN0dWFsbHkgdXNlIGl0XG4gICAgICAgICAgLy8gKGFuZCByZWFsbHkgc2hvdWxkIGJlIGRlY2xhcmVkIHN0YXRpYykuXG4gICAgICAgICAgSnNvblJwY0FwaVByb3ZpZGVyLnByb3RvdHlwZS5nZXRScGNUcmFuc2FjdGlvbi5jYWxsKG51bGwsIHR4KTtcbiAgICBycGNUeC50eXBlID0gdG9CZUhleCh0eC50eXBlID8/IDB4MDIsIDEpOyAvLyB3ZSBleHBlY3QgMHgwWzAtMl1cblxuICAgIHJldHVybiA8RXZtU2lnblJlcXVlc3Q+e1xuICAgICAgY2hhaW5faWQ6IE51bWJlcihjaGFpbklkKSxcbiAgICAgIHR4OiBycGNUeCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2Qgd2lsbCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbC5cbiAgICogQHBhcmFtIHtldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0fSB0eCBUaGUgdHJhbnNhY3Rpb24gdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uKHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXEgPSBhd2FpdCB0aGlzLmV2bVNpZ25SZXF1ZXN0RnJvbVR4KHR4KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25UcmFuc2FjdGlvbihyZXEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IFVpbnQ4QXJyYXl9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nIHwgVWludDhBcnJheSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwMTkxKDxFaXAxOTFTaWduUmVxdWVzdD57XG4gICAgICBkYXRhOiBlbmNvZGVUb0hleChtZXNzYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtUeXBlZERhdGFEb21haW59IGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj59IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBjaGFpbklkID0gZG9tYWluLmNoYWluSWQ7XG4gICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gZ2V0IGNoYWluIGlkIGZyb20gcHJvdmlkZXJcbiAgICAgIGNvbnN0IG5ldHdvcmsgPSBhd2FpdCB0aGlzLnByb3ZpZGVyPy5nZXROZXR3b3JrKCk7XG4gICAgICBjaGFpbklkID0gbmV0d29yaz8uY2hhaW5JZDtcbiAgICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRldGVybWluZSBjaGFpbklkXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25FaXA3MTIoPEVpcDcxMlNpZ25SZXF1ZXN0PntcbiAgICAgIGNoYWluX2lkOiBOdW1iZXIoY2hhaW5JZCksXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgdHlwZWRfZGF0YTogPGFueT57XG4gICAgICAgIGRvbWFpbixcbiAgICAgICAgdHlwZXMsXG4gICAgICAgIHByaW1hcnlUeXBlOiBUeXBlZERhdGFFbmNvZGVyLmdldFByaW1hcnlUeXBlKHR5cGVzKSxcbiAgICAgICAgbWVzc2FnZTogdmFsdWUsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHNpZ25pbmcgYSBtZXNzYWdlIHVzaW5nIE1GQSBhcHByb3ZhbHMuIFRoaXMgbWV0aG9kIHBvcHVsYXRlc1xuICAgKiBtaXNzaW5nIGZpZWxkcy4gSWYgdGhlIHNpZ25pbmcgZG9lcyBub3QgcmVxdWlyZSBNRkEsIHRoaXMgbWV0aG9kIHRocm93cy5cbiAgICogQHBhcmFtIHtldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0fSB0eCBUaGUgdHJhbnNhY3Rpb24gdG8gc2VuZC5cbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2lnbmluZyByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgc2VuZFRyYW5zYWN0aW9uTWZhSW5pdCh0eDogZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcG9wVHggPSBhd2FpdCB0aGlzLnBvcHVsYXRlVHJhbnNhY3Rpb24odHgpO1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgocG9wVHgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRXZtKHJlcSk7XG4gICAgcmV0dXJuIHJlcy5tZmFJZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbFxuICAgKiBleGVjdXRlLlxuICAgKiBAcGFyYW0ge01mYVJlcXVlc3RJbmZvfSBtZmFJbmZvIFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVzcG9uc2V9IFRoZSByZXN1bHQgb2Ygc3VibWl0dGluZyB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYUluZm86IE1mYVJlcXVlc3RJbmZvKTogUHJvbWlzZTxldGhlcnMuVHJhbnNhY3Rpb25SZXNwb25zZT4ge1xuICAgIGNvbnN0IHJscFNpZ25lZCA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFJbmZvKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm92aWRlciEuYnJvYWRjYXN0VHJhbnNhY3Rpb24ocmxwU2lnbmVkKTtcbiAgfVxufVxuIl19