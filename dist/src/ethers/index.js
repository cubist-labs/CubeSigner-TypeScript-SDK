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
var _Signer_instances, _Signer_address, _Signer_key, _Signer_signerSession, _Signer_onMfaPoll, _Signer_mfaPollIntervalMs, _Signer_handleMfa;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = void 0;
const ethers_1 = require("ethers");
/**
 * A ethers.js Signer using CubeSigner
 */
class Signer extends ethers_1.ethers.AbstractSigner {
    /** Create new Signer instance
     * @param {KeyInfo | string} address The key or the eth address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {SignerOptions} options The options to use for the Signer instance
     */
    constructor(address, signerSession, options) {
        super(options?.provider);
        _Signer_instances.add(this);
        /** The address of the account */
        _Signer_address.set(this, void 0);
        /** The key to use for signing */
        _Signer_key.set(this, void 0);
        /** The underlying session */
        _Signer_signerSession.set(this, void 0);
        /**
         * The function to call when MFA information is retrieved. If this callback
         * throws, no transaction is broadcast.
         */
        _Signer_onMfaPoll.set(this, void 0);
        /** The amount of time to wait between checks for MFA updates */
        _Signer_mfaPollIntervalMs.set(this, void 0);
        if (typeof address === "string") {
            __classPrivateFieldSet(this, _Signer_address, address, "f");
        }
        else {
            __classPrivateFieldSet(this, _Signer_address, address.materialId, "f");
            __classPrivateFieldSet(this, _Signer_key, address, "f");
        }
        __classPrivateFieldSet(this, _Signer_signerSession, signerSession, "f");
        __classPrivateFieldSet(this, _Signer_onMfaPoll, options?.onMfaPoll ?? (( /* _mfaInfo: MfaRequestInfo */) => { }), "f"); // eslint-disable-line @typescript-eslint/no-empty-function
        __classPrivateFieldSet(this, _Signer_mfaPollIntervalMs, options?.mfaPollIntervalMs ?? 1000, "f");
    }
    /** Resolves to the signer address. */
    async getAddress() {
        return __classPrivateFieldGet(this, _Signer_address, "f");
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *  @param {null | ethers.Provider} provider The optional provider instance to use.
     *  @return {Signer} The signer connected to signer.
     */
    connect(provider) {
        return new Signer(__classPrivateFieldGet(this, _Signer_address, "f"), __classPrivateFieldGet(this, _Signer_signerSession, "f"), { provider });
    }
    /**
     * Signs a transaction. This populates the transaction type to `0x02` (EIP-1559) unless set. This method will block if the key requires MFA approval.
     * @param {ethers.TransactionRequest} tx The transaction to sign.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(tx) {
        // get the chain id from the network or tx
        let chainId = tx.chainId;
        if (chainId === undefined) {
            const network = await this.provider?.getNetwork();
            chainId = network?.chainId?.toString() ?? "1";
        }
        // Convert the transaction into a JSON-RPC transaction
        const rpcTx = this.provider instanceof ethers_1.JsonRpcApiProvider
            ? this.provider.getRpcTransaction(tx)
            : // We can just call the getRpcTransaction with a
                // null receiver since it doesn't actually use it
                // (and really should be declared static).
                ethers_1.JsonRpcApiProvider.prototype.getRpcTransaction.call(null, tx);
        rpcTx.type = (0, ethers_1.toBeHex)(tx.type ?? 0x02, 1); // we expect 0x0[0-2]
        const req = {
            chain_id: Number(chainId),
            tx: rpcTx,
        };
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), req);
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.rlp_signed_tx;
    }
    /** Signs arbitrary messages. This uses ethers.js's [hashMessage](https://docs.ethers.org/v6/api/hashing/#hashMessage)
     * to compute the EIP-191 digest and signs this digest using {@link Key#signBlob}.
     * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    async signMessage(message) {
        const digest = ethers_1.ethers.hashMessage(message);
        return this.signBlob(digest);
    }
    /** Signs EIP-712 typed data. This uses ethers.js's
     * [TypedDataEncoder.hash](https://docs.ethers.org/v6/api/hashing/#TypedDataEncoder_hash)
     * to compute the EIP-712 digest and signs this digest using {@link Key#signBlob}.
     * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
     * @param {TypedDataDomain} domain The domain of the typed data.
     * @param {Record<string, Array<TypedDataField>>} types The types of the typed data.
     * @param {Record<string, any>} value The value of the typed data.
     * @return {Promise<string>} The signature.
     */
    async signTypedData(domain, types, value) {
        const digest = ethers_1.TypedDataEncoder.hash(domain, types, value);
        return this.signBlob(digest);
    }
    /** Sign arbitrary digest. This uses {@link Key#signBlob}.
     * @param {string} digest The digest to sign.
     * @return {Promise<string>} The signature.
     */
    async signBlob(digest) {
        const blobReq = {
            message_base64: Buffer.from((0, ethers_1.getBytes)(digest)).toString("base64"),
        };
        // Get the key corresponding to this address
        if (__classPrivateFieldGet(this, _Signer_key, "f") === undefined) {
            const key = (await __classPrivateFieldGet(this, _Signer_signerSession, "f").keys()).find((k) => k.material_id === __classPrivateFieldGet(this, _Signer_address, "f"));
            if (key === undefined) {
                throw new Error(`Cannot access key '${__classPrivateFieldGet(this, _Signer_address, "f")}'`);
            }
            __classPrivateFieldSet(this, _Signer_key, key, "f");
        }
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signBlob(__classPrivateFieldGet(this, _Signer_key, "f").key_id, blobReq);
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.signature;
    }
}
exports.Signer = Signer;
_Signer_address = new WeakMap(), _Signer_key = new WeakMap(), _Signer_signerSession = new WeakMap(), _Signer_onMfaPoll = new WeakMap(), _Signer_mfaPollIntervalMs = new WeakMap(), _Signer_instances = new WeakSet(), _Signer_handleMfa = 
/**
 * If the sign request requires MFA, this method waits for approvals
 *
 * @param {CubeSignerResponse<U>} res The response of a sign request
 * @return {Promise<U>} The sign data after MFA approvals
 */
async function _Signer_handleMfa(res) {
    while (res.requiresMfa()) {
        await new Promise((resolve) => setTimeout(resolve, __classPrivateFieldGet(this, _Signer_mfaPollIntervalMs, "f")));
        const mfaId = res.mfaId();
        const mfaInfo = await __classPrivateFieldGet(this, _Signer_signerSession, "f").getMfaInfo(mfaId);
        __classPrivateFieldGet(this, _Signer_onMfaPoll, "f").call(this, mfaInfo);
        if (mfaInfo.receipt) {
            res = await res.signWithMfaApproval({
                mfaId,
                mfaOrgId: __classPrivateFieldGet(this, _Signer_signerSession, "f").orgId,
                mfaConf: mfaInfo.receipt.confirmation,
            });
        }
    }
    return res.data();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXRoZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQVFnQjtBQXFCaEI7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsY0FBYztJQW1CL0M7Ozs7T0FJRztJQUNILFlBQVksT0FBeUIsRUFBRSxhQUE0QixFQUFFLE9BQXVCO1FBQzFGLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7O1FBeEIzQixpQ0FBaUM7UUFDeEIsa0NBQWlCO1FBRTFCLGlDQUFpQztRQUNqQyw4QkFBZTtRQUVmLDZCQUE2QjtRQUNwQix3Q0FBOEI7UUFFdkM7OztXQUdHO1FBQ00sb0NBQTJDO1FBRXBELGdFQUFnRTtRQUN2RCw0Q0FBMkI7UUFTbEMsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7WUFDL0IsdUJBQUEsSUFBSSxtQkFBWSxPQUFPLE1BQUEsQ0FBQztTQUN6QjthQUFNO1lBQ0wsdUJBQUEsSUFBSSxtQkFBWSxPQUFPLENBQUMsVUFBVSxNQUFBLENBQUM7WUFDbkMsdUJBQUEsSUFBSSxlQUFRLE9BQWtCLE1BQUEsQ0FBQztTQUNoQztRQUNELHVCQUFBLElBQUkseUJBQWtCLGFBQWEsTUFBQSxDQUFDO1FBQ3BDLHVCQUFBLElBQUkscUJBQWMsT0FBTyxFQUFFLFNBQVMsSUFBSSxDQUFDLEVBQUMsOEJBQThCLEVBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQyxNQUFBLENBQUMsQ0FBQywyREFBMkQ7UUFDN0ksdUJBQUEsSUFBSSw2QkFBc0IsT0FBTyxFQUFFLGlCQUFpQixJQUFJLElBQUksTUFBQSxDQUFDO0lBQy9ELENBQUM7SUFFRCxzQ0FBc0M7SUFDdEMsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLHVCQUFBLElBQUksdUJBQVMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE9B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TyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEpzb25ScGNBcGlQcm92aWRlcixcbiAgVHlwZWREYXRhRG9tYWluLFxuICBUeXBlZERhdGFFbmNvZGVyLFxuICBUeXBlZERhdGFGaWVsZCxcbiAgZXRoZXJzLFxuICBnZXRCeXRlcyxcbiAgdG9CZUhleCxcbn0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvbiwgQ3ViZVNpZ25lclJlc3BvbnNlIH0gZnJvbSBcIi4uL3NpZ25lcl9zZXNzaW9uXCI7XG5pbXBvcnQgeyBCbG9iU2lnblJlcXVlc3QsIEV2bVNpZ25SZXF1ZXN0LCBNZmFSZXF1ZXN0SW5mbyB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IEtleUluZm8gfSBmcm9tIFwiLi4va2V5XCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5pbnRlcmZhY2UgU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCBwcm92aWRlciB0byB1c2UgKi9cbiAgcHJvdmlkZXI/OiBudWxsIHwgZXRoZXJzLlByb3ZpZGVyO1xuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgb25NZmFQb2xsPzogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiB0aW1lIChpbiBtaWxsaXNlY29uZHMpIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIE1GQVxuICAgKiB1cGRhdGVzLiBEZWZhdWx0IGlzIDEwMDBtc1xuICAgKi9cbiAgbWZhUG9sbEludGVydmFsTXM/OiBudW1iZXI7XG59XG5cbi8qKlxuICogQSBldGhlcnMuanMgU2lnbmVyIHVzaW5nIEN1YmVTaWduZXJcbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lciBleHRlbmRzIGV0aGVycy5BYnN0cmFjdFNpZ25lciB7XG4gIC8qKiBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCAqL1xuICByZWFkb25seSAjYWRkcmVzczogc3RyaW5nO1xuXG4gIC8qKiBUaGUga2V5IHRvIHVzZSBmb3Igc2lnbmluZyAqL1xuICAja2V5PzogS2V5SW5mbztcblxuICAvKiogVGhlIHVuZGVybHlpbmcgc2Vzc2lvbiAqL1xuICByZWFkb25seSAjc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbjtcblxuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgcmVhZG9ubHkgI29uTWZhUG9sbDogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuXG4gIC8qKiBUaGUgYW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBIHVwZGF0ZXMgKi9cbiAgcmVhZG9ubHkgI21mYVBvbGxJbnRlcnZhbE1zOiBudW1iZXI7XG5cbiAgLyoqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7S2V5SW5mbyB8IHN0cmluZ30gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc2lnbmVyU2Vzc2lvbiBUaGUgdW5kZXJseWluZyBTaWduZXIgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5SW5mbyB8IHN0cmluZywgc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbiwgb3B0aW9ucz86IFNpZ25lck9wdGlvbnMpIHtcbiAgICBzdXBlcihvcHRpb25zPy5wcm92aWRlcik7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3MubWF0ZXJpYWxJZDtcbiAgICAgIHRoaXMuI2tleSA9IGFkZHJlc3MgYXMgS2V5SW5mbztcbiAgICB9XG4gICAgdGhpcy4jc2lnbmVyU2Vzc2lvbiA9IHNpZ25lclNlc3Npb247XG4gICAgdGhpcy4jb25NZmFQb2xsID0gb3B0aW9ucz8ub25NZmFQb2xsID8/ICgoLyogX21mYUluZm86IE1mYVJlcXVlc3RJbmZvICovKSA9PiB7fSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uXG4gICAgdGhpcy4jbWZhUG9sbEludGVydmFsTXMgPSBvcHRpb25zPy5tZmFQb2xsSW50ZXJ2YWxNcyA/PyAxMDAwO1xuICB9XG5cbiAgLyoqIFJlc29sdmVzIHRvIHRoZSBzaWduZXIgYWRkcmVzcy4gKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLiNhZGRyZXNzO1xuICB9XG5cbiAgLyoqXG4gICAqICBSZXR1cm5zIHRoZSBzaWduZXIgY29ubmVjdGVkIHRvICUlcHJvdmlkZXIlJS5cbiAgICogIEBwYXJhbSB7bnVsbCB8IGV0aGVycy5Qcm92aWRlcn0gcHJvdmlkZXIgVGhlIG9wdGlvbmFsIHByb3ZpZGVyIGluc3RhbmNlIHRvIHVzZS5cbiAgICogIEByZXR1cm4ge1NpZ25lcn0gVGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gc2lnbmVyLlxuICAgKi9cbiAgY29ubmVjdChwcm92aWRlcjogbnVsbCB8IGV0aGVycy5Qcm92aWRlcik6IFNpZ25lciB7XG4gICAgcmV0dXJuIG5ldyBTaWduZXIodGhpcy4jYWRkcmVzcywgdGhpcy4jc2lnbmVyU2Vzc2lvbiwgeyBwcm92aWRlciB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBhIHRyYW5zYWN0aW9uLiBUaGlzIHBvcHVsYXRlcyB0aGUgdHJhbnNhY3Rpb24gdHlwZSB0byBgMHgwMmAgKEVJUC0xNTU5KSB1bmxlc3Mgc2V0LiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ/LnRvU3RyaW5nKCkgPz8gXCIxXCI7XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCB0aGUgdHJhbnNhY3Rpb24gaW50byBhIEpTT04tUlBDIHRyYW5zYWN0aW9uXG4gICAgY29uc3QgcnBjVHggPVxuICAgICAgdGhpcy5wcm92aWRlciBpbnN0YW5jZW9mIEpzb25ScGNBcGlQcm92aWRlclxuICAgICAgICA/IHRoaXMucHJvdmlkZXIuZ2V0UnBjVHJhbnNhY3Rpb24odHgpXG4gICAgICAgIDogLy8gV2UgY2FuIGp1c3QgY2FsbCB0aGUgZ2V0UnBjVHJhbnNhY3Rpb24gd2l0aCBhXG4gICAgICAgICAgLy8gbnVsbCByZWNlaXZlciBzaW5jZSBpdCBkb2Vzbid0IGFjdHVhbGx5IHVzZSBpdFxuICAgICAgICAgIC8vIChhbmQgcmVhbGx5IHNob3VsZCBiZSBkZWNsYXJlZCBzdGF0aWMpLlxuICAgICAgICAgIEpzb25ScGNBcGlQcm92aWRlci5wcm90b3R5cGUuZ2V0UnBjVHJhbnNhY3Rpb24uY2FsbChudWxsLCB0eCk7XG4gICAgcnBjVHgudHlwZSA9IHRvQmVIZXgodHgudHlwZSA/PyAweDAyLCAxKTsgLy8gd2UgZXhwZWN0IDB4MFswLTJdXG5cbiAgICBjb25zdCByZXEgPSA8RXZtU2lnblJlcXVlc3Q+e1xuICAgICAgY2hhaW5faWQ6IE51bWJlcihjaGFpbklkKSxcbiAgICAgIHR4OiBycGNUeCxcbiAgICB9O1xuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRXZtKHRoaXMuI2FkZHJlc3MsIHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKiogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgZXRoZXJzLmpzJ3MgW2hhc2hNZXNzYWdlXShodHRwczovL2RvY3MuZXRoZXJzLm9yZy92Ni9hcGkvaGFzaGluZy8jaGFzaE1lc3NhZ2UpXG4gICAqIHRvIGNvbXB1dGUgdGhlIEVJUC0xOTEgZGlnZXN0IGFuZCBzaWducyB0aGlzIGRpZ2VzdCB1c2luZyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtzdHJpbmcgfCBVaW50OEFycmF5fSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZyB8IFVpbnQ4QXJyYXkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRpZ2VzdCA9IGV0aGVycy5oYXNoTWVzc2FnZShtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5zaWduQmxvYihkaWdlc3QpO1xuICB9XG5cbiAgLyoqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIGV0aGVycy5qcydzXG4gICAqIFtUeXBlZERhdGFFbmNvZGVyLmhhc2hdKGh0dHBzOi8vZG9jcy5ldGhlcnMub3JnL3Y2L2FwaS9oYXNoaW5nLyNUeXBlZERhdGFFbmNvZGVyX2hhc2gpXG4gICAqIHRvIGNvbXB1dGUgdGhlIEVJUC03MTIgZGlnZXN0IGFuZCBzaWducyB0aGlzIGRpZ2VzdCB1c2luZyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtUeXBlZERhdGFEb21haW59IGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj59IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRpZ2VzdCA9IFR5cGVkRGF0YUVuY29kZXIuaGFzaChkb21haW4sIHR5cGVzLCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMuc2lnbkJsb2IoZGlnZXN0KTtcbiAgfVxuXG4gIC8qKiBTaWduIGFyYml0cmFyeSBkaWdlc3QuIFRoaXMgdXNlcyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGRpZ2VzdCBUaGUgZGlnZXN0IHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc2lnbkJsb2IoZGlnZXN0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGJsb2JSZXEgPSA8QmxvYlNpZ25SZXF1ZXN0PntcbiAgICAgIG1lc3NhZ2VfYmFzZTY0OiBCdWZmZXIuZnJvbShnZXRCeXRlcyhkaWdlc3QpKS50b1N0cmluZyhcImJhc2U2NFwiKSxcbiAgICB9O1xuICAgIC8vIEdldCB0aGUga2V5IGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBhZGRyZXNzXG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5rZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxfaWQgPT09IHRoaXMuI2FkZHJlc3MpO1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGFjY2VzcyBrZXkgJyR7dGhpcy4jYWRkcmVzc30nYCk7XG4gICAgICB9XG4gICAgICB0aGlzLiNrZXkgPSBrZXk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduQmxvYih0aGlzLiNrZXkua2V5X2lkLCBibG9iUmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgI2hhbmRsZU1mYTxVPihyZXM6IEN1YmVTaWduZXJSZXNwb25zZTxVPik6IFByb21pc2U8VT4ge1xuICAgIHdoaWxlIChyZXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jbWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSWQgPSByZXMubWZhSWQoKTtcbiAgICAgIGNvbnN0IG1mYUluZm8gPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLmdldE1mYUluZm8obWZhSWQpO1xuICAgICAgdGhpcy4jb25NZmFQb2xsKG1mYUluZm8pO1xuICAgICAgaWYgKG1mYUluZm8ucmVjZWlwdCkge1xuICAgICAgICByZXMgPSBhd2FpdCByZXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7XG4gICAgICAgICAgbWZhSWQsXG4gICAgICAgICAgbWZhT3JnSWQ6IHRoaXMuI3NpZ25lclNlc3Npb24ub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=