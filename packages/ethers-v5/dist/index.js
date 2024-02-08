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
     * @param {KeyInfo | string} address The key or the eth address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {SignerOptions} options The options to use for the Signer instance
     */
    constructor(address, signerSession, options) {
        super();
        /** The CubeSigner-backed ethers signer */
        _Signer_signer.set(this, void 0);
        __classPrivateFieldSet(this, _Signer_signer, new cubesigner_sdk_1.EvmSigner(address, signerSession, options), "f");
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
        return new Signer(__classPrivateFieldGet(this, _Signer_signer, "f").address, __classPrivateFieldGet(this, _Signer_signer, "f").signerSession, {
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
        // CubeSigner end-point expects type to be 0x0[0-2]. hexlifyTransactions
        // doesn't add the extra leading 0, add it here:
        if (typeof rpcTx.type === "string") {
            rpcTx.type = rpcTx.type.replace(/^0x([0-2])$/, "0x0$1");
        }
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typed_data: {
                domain,
                types,
                primaryType: utils_1._TypedDataEncoder.getPrimaryType(types),
                message: value,
            },
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
     * @param {MfaRequestInfo} mfaInfo The approved MFA request.
     * @return {TransactionResponse} The result of submitting the transaction
     */
    async sendTransactionMfaApproved(mfaInfo) {
        const rplSigned = await __classPrivateFieldGet(this, _Signer_signer, "f").signTransactionMfaApproved(mfaInfo);
        return await this.provider.sendTransaction(rplSigned);
    }
}
exports.Signer = Signer;
_Signer_signer = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQWlFO0FBQ2pFLGdFQVVxQztBQUNyQyw0Q0FRMEI7QUFVMUI7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsTUFBTTtJQUl2Qzs7Ozs7T0FLRztJQUNILFlBQVksT0FBeUIsRUFBRSxhQUE0QixFQUFFLE9BQXVCO1FBQzFGLEtBQUssRUFBRSxDQUFDO1FBVlYsMENBQTBDO1FBQ2pDLGlDQUFtQjtRQVUxQix1QkFBQSxJQUFJLGtCQUFXLElBQUksMEJBQVMsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxNQUFBLENBQUM7UUFDOUQsSUFBSSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUM7WUFDdEIsSUFBQSxzQkFBYyxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELENBQUM7SUFDSCxDQUFDO0lBRUQsK0NBQStDO0lBQy9DLEtBQUssQ0FBQyxVQUFVO1FBQ2QsT0FBTyxlQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxPQUFPLENBQUMsUUFBbUM7UUFDekMsT0FBTyxJQUFJLE1BQU0sQ0FBQyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsT0FBTyxFQUFFLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxhQUFhLEVBQUU7WUFDbEUsR0FBRyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsT0FBTztZQUN2QixRQUFRO1NBQ1QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxFQUFzQjtRQUMvQywwQ0FBMEM7UUFDMUMsSUFBSSxPQUFPLEdB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Q2pELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25ELE1BQU0sR0FBRyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLDBCQUEwQixDQUFDLE9BQXVCO1FBQ3RELE1BQU0sU0FBUyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxzQkFBUSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6RCxDQUFDO0NBQ0Y7QUF6SkQsd0JBeUpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHlwZWREYXRhRG9tYWluLCBUeXBlZERhdGFGaWVsZCwgZXRoZXJzIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHtcbiAgS2V5SW5mbyxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVxdWVzdCxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIFNpZ25lclNlc3Npb24sXG4gIGVuY29kZVRvSGV4LFxuICBFdm1TaWduZXJPcHRpb25zLFxuICBFdm1TaWduZXIsXG59IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7XG4gIF9UeXBlZERhdGFFbmNvZGVyLFxuICBEZWZlcnJhYmxlLFxuICBCeXRlcyxcbiAgZGVmaW5lUmVhZE9ubHksXG4gIGhleGxpZnksXG4gIGlzQnl0ZXMsXG4gIHJlc29sdmVQcm9wZXJ0aWVzLFxufSBmcm9tIFwiZXRoZXJzL2xpYi91dGlsc1wiO1xuaW1wb3J0IHsgVHJhbnNhY3Rpb25SZXF1ZXN0LCBUcmFuc2FjdGlvblJlc3BvbnNlIH0gZnJvbSBcIkBldGhlcnNwcm9qZWN0L2Fic3RyYWN0LXByb3ZpZGVyXCI7XG5pbXBvcnQgeyBUeXBlZERhdGFTaWduZXIgfSBmcm9tIFwiQGV0aGVyc3Byb2plY3QvYWJzdHJhY3Qtc2lnbmVyXCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lck9wdGlvbnMgZXh0ZW5kcyBFdm1TaWduZXJPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHByb3ZpZGVyIHRvIHVzZSAqL1xuICBwcm92aWRlcj86IG51bGwgfCBldGhlcnMucHJvdmlkZXJzLlByb3ZpZGVyO1xufVxuXG4vKipcbiAqIEEgZXRoZXJzLmpzIFNpZ25lciB1c2luZyBDdWJlU2lnbmVyXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXIgZXh0ZW5kcyBldGhlcnMuU2lnbmVyIGltcGxlbWVudHMgVHlwZWREYXRhU2lnbmVyIHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyLWJhY2tlZCBldGhlcnMgc2lnbmVyICovXG4gIHJlYWRvbmx5ICNzaWduZXI6IEV2bVNpZ25lcjtcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtLZXlJbmZvIHwgc3RyaW5nfSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9ufSBzaWduZXJTZXNzaW9uIFRoZSB1bmRlcmx5aW5nIFNpZ25lciBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXlJbmZvIHwgc3RyaW5nLCBzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBvcHRpb25zPzogU2lnbmVyT3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jc2lnbmVyID0gbmV3IEV2bVNpZ25lcihhZGRyZXNzLCBzaWduZXJTZXNzaW9uLCBvcHRpb25zKTtcbiAgICBpZiAob3B0aW9ucz8ucHJvdmlkZXIpIHtcbiAgICAgIGRlZmluZVJlYWRPbmx5KHRoaXMsIFwicHJvdmlkZXJcIiwgb3B0aW9ucy5wcm92aWRlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlc29sdmVzIHRvIHRoZSBzaWduZXIgY2hlY2tzdW0gYWRkcmVzcy4gKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBldGhlcnMudXRpbHMuZ2V0QWRkcmVzcyh0aGlzLiNzaWduZXIuYWRkcmVzcyk7XG4gIH1cblxuICAvKipcbiAgICogIFJldHVybnMgdGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gJSVwcm92aWRlciUlLlxuICAgKiAgQHBhcmFtIHtldGhlcnMucHJvdmlkZXJzLlByb3ZpZGVyfSBwcm92aWRlciBUaGUgcHJvdmlkZXIgaW5zdGFuY2UgdG8gdXNlLlxuICAgKiAgQHJldHVybiB7U2lnbmVyfSBUaGUgc2lnbmVyIGNvbm5lY3RlZCB0byBzaWduZXIuXG4gICAqL1xuICBjb25uZWN0KHByb3ZpZGVyOiBldGhlcnMucHJvdmlkZXJzLlByb3ZpZGVyKTogU2lnbmVyIHtcbiAgICByZXR1cm4gbmV3IFNpZ25lcih0aGlzLiNzaWduZXIuYWRkcmVzcywgdGhpcy4jc2lnbmVyLnNpZ25lclNlc3Npb24sIHtcbiAgICAgIC4uLnRoaXMuI3NpZ25lci5vcHRpb25zLFxuICAgICAgcHJvdmlkZXIsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgc2lnbmluZyByZXF1ZXN0IGZyb20gYSB0cmFuc2FjdGlvbi4gVGhpcyBwb3B1bGF0ZXMgdGhlIHRyYW5zYWN0aW9uXG4gICAqIHR5cGUgdG8gYDB4MDJgIChFSVAtMTU1OSkgdW5sZXNzIHNldC5cbiAgICpcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJuIHtFdm1TaWduUmVxdWVzdH0gVGhlIEVWTSBzaWduIHJlcXVlc3QgdG8gYmUgc2VudCB0byBDdWJlU2lnbmVyXG4gICAqL1xuICBhc3luYyBldm1TaWduUmVxdWVzdEZyb21UeCh0eDogVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxFdm1TaWduUmVxdWVzdD4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkOiBudW1iZXIgfCB1bmRlZmluZWQgPSB0eC5jaGFpbklkO1xuICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG5ldHdvcmsgPSBhd2FpdCB0aGlzLnByb3ZpZGVyPy5nZXROZXR3b3JrKCk7XG4gICAgICBjaGFpbklkID0gbmV0d29yaz8uY2hhaW5JZDtcbiAgICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRldGVybWluZSBjaGFpbklkXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvbnZlcnQgdGhlIHRyYW5zYWN0aW9uIGludG8gYSBKU09OLVJQQyB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHJwY1R4ID0gZXRoZXJzLnByb3ZpZGVycy5Kc29uUnBjUHJvdmlkZXIuaGV4bGlmeVRyYW5zYWN0aW9uKHR4LCB7XG4gICAgICBmcm9tOiB0cnVlLFxuICAgICAgdHlwZTogdHJ1ZSxcbiAgICB9KTtcbiAgICAvLyBDdWJlU2lnbmVyIGVuZC1wb2ludCBleHBlY3RzIHR5cGUgdG8gYmUgMHgwWzAtMl0uIGhleGxpZnlUcmFuc2FjdGlvbnNcbiAgICAvLyBkb2Vzbid0IGFkZCB0aGUgZXh0cmEgbGVhZGluZyAwLCBhZGQgaXQgaGVyZTpcbiAgICBpZiAodHlwZW9mIHJwY1R4LnR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJwY1R4LnR5cGUgPSBycGNUeC50eXBlLnJlcGxhY2UoL14weChbMC0yXSkkLywgXCIweDAkMVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gPEV2bVNpZ25SZXF1ZXN0PntcbiAgICAgIGNoYWluX2lkOiBjaGFpbklkLFxuICAgICAgdHg6IHJwY1R4LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge0RlZmVycmFibGU8VHJhbnNhY3Rpb25SZXF1ZXN0Pn0gdHggVGhlIHRyYW5zYWN0aW9uIHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gSGV4LWVuY29kZWQgUkxQIGVuY29kaW5nIG9mIHRoZSB0cmFuc2FjdGlvbiBhbmQgaXRzIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UcmFuc2FjdGlvbih0eDogRGVmZXJyYWJsZTxUcmFuc2FjdGlvblJlcXVlc3Q+KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXEgPSBhd2FpdCB0aGlzLmV2bVNpZ25SZXF1ZXN0RnJvbVR4KGF3YWl0IHJlc29sdmVQcm9wZXJ0aWVzKHR4KSk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduVHJhbnNhY3Rpb24ocmVxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBhcmJpdHJhcnkgbWVzc2FnZXMuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTE5MSBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXAxOTFTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtzdHJpbmcgfCBCeXRlc30gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzaWduLiAgQnl0ZXMgYXJlIHRyZWF0ZWQgYXNcbiAgICogYXMgYSBiaW5hcnkgbWVzc2FnZXM7IHN0cmluZ3MgYXJlIHRyZWF0ZWQgYXMgVVRGOC1tZXNzYWdlcy5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nIHwgQnl0ZXMpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduZXIuc2lnbkVpcDE5MSg8RWlwMTkxU2lnblJlcXVlc3Q+e1xuICAgICAgZGF0YTogaXNCeXRlcyhtZXNzYWdlKSA/IGhleGxpZnkobWVzc2FnZSkgOiBlbmNvZGVUb0hleChtZXNzYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtUeXBlZERhdGFEb21haW59IGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj59IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIF9zaWduVHlwZWREYXRhKFxuICAgIGRvbWFpbjogVHlwZWREYXRhRG9tYWluLFxuICAgIHR5cGVzOiBSZWNvcmQ8c3RyaW5nLCBBcnJheTxUeXBlZERhdGFGaWVsZD4+LFxuICAgIHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgY2hhaW5JZCA9IGRvbWFpbi5jaGFpbklkO1xuICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIGdldCBjaGFpbiBpZCBmcm9tIHByb3ZpZGVyXG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ7XG4gICAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkZXRlcm1pbmUgY2hhaW5JZFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwNzEyKDxFaXA3MTJTaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHR5cGVkX2RhdGE6IDxhbnk+e1xuICAgICAgICBkb21haW4sXG4gICAgICAgIHR5cGVzLFxuICAgICAgICBwcmltYXJ5VHlwZTogX1R5cGVkRGF0YUVuY29kZXIuZ2V0UHJpbWFyeVR5cGUodHlwZXMpLFxuICAgICAgICBtZXNzYWdlOiB2YWx1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgc2lnbmluZyBhIG1lc3NhZ2UgdXNpbmcgTUZBIGFwcHJvdmFscy4gVGhpcyBtZXRob2QgcG9wdWxhdGVzXG4gICAqIG1pc3NpbmcgZmllbGRzLiBJZiB0aGUgc2lnbmluZyBkb2VzIG5vdCByZXF1aXJlIE1GQSwgdGhpcyBtZXRob2QgdGhyb3dzLlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9uUmVxdWVzdH0gdHggVGhlIHRyYW5zYWN0aW9uIHRvIHNlbmQuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIE1GQSBpZCBhc3NvY2lhdGVkIHdpdGggdGhlIHNpZ25pbmcgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUluaXQodHg6IFRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcG9wVHggPSBhd2FpdCB0aGlzLnBvcHVsYXRlVHJhbnNhY3Rpb24odHgpO1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgocG9wVHgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRXZtKHJlcSk7XG4gICAgcmV0dXJuIHJlcy5tZmFJZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbFxuICAgKiBleGVjdXRlLlxuICAgKiBAcGFyYW0ge01mYVJlcXVlc3RJbmZvfSBtZmFJbmZvIFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7VHJhbnNhY3Rpb25SZXNwb25zZX0gVGhlIHJlc3VsdCBvZiBzdWJtaXR0aW5nIHRoZSB0cmFuc2FjdGlvblxuICAgKi9cbiAgYXN5bmMgc2VuZFRyYW5zYWN0aW9uTWZhQXBwcm92ZWQobWZhSW5mbzogTWZhUmVxdWVzdEluZm8pOiBQcm9taXNlPFRyYW5zYWN0aW9uUmVzcG9uc2U+IHtcbiAgICBjb25zdCBycGxTaWduZWQgPSBhd2FpdCB0aGlzLiNzaWduZXIuc2lnblRyYW5zYWN0aW9uTWZhQXBwcm92ZWQobWZhSW5mbyk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucHJvdmlkZXIhLnNlbmRUcmFuc2FjdGlvbihycGxTaWduZWQpO1xuICB9XG59XG4iXX0=