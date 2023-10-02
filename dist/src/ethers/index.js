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
var _Signer_instances, _Signer_address, _Signer_key, _Signer_signerSession, _Signer_onMfaPoll, _Signer_mfaPollIntervalMs, _Signer_managementSession, _Signer_handleMfa;
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
        /** Optional management session, used for MFA flows */
        _Signer_managementSession.set(this, void 0);
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
        __classPrivateFieldSet(this, _Signer_managementSession, options?.managementSession, "f");
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
_Signer_address = new WeakMap(), _Signer_key = new WeakMap(), _Signer_signerSession = new WeakMap(), _Signer_onMfaPoll = new WeakMap(), _Signer_mfaPollIntervalMs = new WeakMap(), _Signer_managementSession = new WeakMap(), _Signer_instances = new WeakSet(), _Signer_handleMfa = 
/**
 * If the sign request requires MFA, this method waits for approvals
 *
 * @param {SignResponse<U>} res The response of a sign request
 * @return {Promise<U>} The sign data after MFA approvals
 */
async function _Signer_handleMfa(res) {
    while (res.requiresMfa()) {
        await new Promise((resolve) => setTimeout(resolve, __classPrivateFieldGet(this, _Signer_mfaPollIntervalMs, "f")));
        const mfaInfo = await __classPrivateFieldGet(this, _Signer_signerSession, "f").getMfaInfo(__classPrivateFieldGet(this, _Signer_managementSession, "f"), res.mfaId());
        __classPrivateFieldGet(this, _Signer_onMfaPoll, "f").call(this, mfaInfo);
        if (mfaInfo.receipt) {
            res = await res.signWithMfaApproval(mfaInfo);
        }
    }
    return res.data();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXRoZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQVFnQjtBQTZCaEI7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsY0FBYztJQXNCL0M7Ozs7T0FJRztJQUNILFlBQVksT0FBeUIsRUFBRSxhQUE0QixFQUFFLE9BQXVCO1FBQzFGLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7O1FBM0IzQixpQ0FBaUM7UUFDeEIsa0NBQWlCO1FBRTFCLGlDQUFpQztRQUNqQyw4QkFBZTtRQUVmLDZCQUE2QjtRQUNwQix3Q0FBOEI7UUFFdkM7OztXQUdHO1FBQ00sb0NBQTJDO1FBRXBELGdFQUFnRTtRQUN2RCw0Q0FBMkI7UUFFcEMsc0RBQXNEO1FBQzdDLDRDQUFnQztRQVN2QyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQix1QkFBQSxJQUFJLG1CQUFZLE9BQU8sTUFBQSxDQUFDO1NBQ3pCO2FBQU07WUFDTCx1QkFBQSxJQUFJLG1CQUFZLE9BQU8sQ0FBQyxVQUFVLE1BQUEsQ0FBQztZQUNuQyx1QkFBQSxJQUFJLGVBQVEsT0FBa0IsTUFBQSxDQUFDO1NBQ2hDO1FBQ0QsdUJBQUEsSUFBSSx5QkFBa0IsYUFBYSxNQUFBLENBQUM7UUFDcEMsdUJBQUEsSUFBSSxxQkFBYyxPQUFPLEVBQUUsU0FBUyxJQUFJLENBQUMsRUFBQyw4QkFBOEIsRUFBRSxFQUFFLEdBQUUsQ0FBQyxDQUFDLE1BQUEsQ0FBQyxDQUFDLDJEQUEyRDtRQUM3SSx1QkFBQSxJQUFJLDZCQUFzQixPQUFPLEVBQUUsaUJBQWlCLElBQUksSUFBSSxNQUFBLENBQUM7UUFDN0QsdUJBQUEsSUFBSSw2QkFBc0IsT0FBTyxFQUFFLGlCQUFpQixNQUFBLENBQUM7SUFDdkQsQ0FBQztJQUVELHNDQUFzQztJQUN0QyxL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QUNwQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgSnNvblJwY0FwaVByb3ZpZGVyLFxuICBUeXBlZERhdGFEb21haW4sXG4gIFR5cGVkRGF0YUVuY29kZXIsXG4gIFR5cGVkRGF0YUZpZWxkLFxuICBldGhlcnMsXG4gIGdldEJ5dGVzLFxuICB0b0JlSGV4LFxufSBmcm9tIFwiZXRoZXJzXCI7XG5pbXBvcnQge1xuICBCbG9iU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgU2lnbmVyU2Vzc2lvbixcbiAgU2lnblJlc3BvbnNlLFxufSBmcm9tIFwiLi4vc2lnbmVyX3Nlc3Npb25cIjtcbmltcG9ydCB7IEtleUluZm8gfSBmcm9tIFwiLi4va2V5XCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyIH0gZnJvbSBcIi4uXCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5pbnRlcmZhY2UgU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCBwcm92aWRlciB0byB1c2UgKi9cbiAgcHJvdmlkZXI/OiBudWxsIHwgZXRoZXJzLlByb3ZpZGVyO1xuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgb25NZmFQb2xsPzogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiB0aW1lIChpbiBtaWxsaXNlY29uZHMpIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIE1GQVxuICAgKiB1cGRhdGVzLiBEZWZhdWx0IGlzIDEwMDBtc1xuICAgKi9cbiAgbWZhUG9sbEludGVydmFsTXM/OiBudW1iZXI7XG4gIC8qKiBPcHRpb25hbCBtYW5hZ2VtZW50IHNlc3Npb24uIFVzZWQgdG8gY2hlY2sgZm9yIE1GQSB1cGRhdGVzICovXG4gIG1hbmFnZW1lbnRTZXNzaW9uPzogQ3ViZVNpZ25lcjtcbn1cblxuLyoqXG4gKiBBIGV0aGVycy5qcyBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lclxuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyIGV4dGVuZHMgZXRoZXJzLkFic3RyYWN0U2lnbmVyIHtcbiAgLyoqIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50ICovXG4gIHJlYWRvbmx5ICNhZGRyZXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBrZXkgdG8gdXNlIGZvciBzaWduaW5nICovXG4gICNrZXk/OiBLZXlJbmZvO1xuXG4gIC8qKiBUaGUgdW5kZXJseWluZyBzZXNzaW9uICovXG4gIHJlYWRvbmx5ICNzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uO1xuXG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICByZWFkb25seSAjb25NZmFQb2xsOiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG5cbiAgLyoqIFRoZSBhbW91bnQgb2YgdGltZSB0byB3YWl0IGJldHdlZW4gY2hlY2tzIGZvciBNRkEgdXBkYXRlcyAqL1xuICByZWFkb25seSAjbWZhUG9sbEludGVydmFsTXM6IG51bWJlcjtcblxuICAvKiogT3B0aW9uYWwgbWFuYWdlbWVudCBzZXNzaW9uLCB1c2VkIGZvciBNRkEgZmxvd3MgKi9cbiAgcmVhZG9ubHkgI21hbmFnZW1lbnRTZXNzaW9uPzogQ3ViZVNpZ25lcjtcblxuICAvKiogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtLZXlJbmZvIHwgc3RyaW5nfSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9ufSBzaWduZXJTZXNzaW9uIFRoZSB1bmRlcmx5aW5nIFNpZ25lciBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXlJbmZvIHwgc3RyaW5nLCBzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBvcHRpb25zPzogU2lnbmVyT3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnM/LnByb3ZpZGVyKTtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcy5tYXRlcmlhbElkO1xuICAgICAgdGhpcy4ja2V5ID0gYWRkcmVzcyBhcyBLZXlJbmZvO1xuICAgIH1cbiAgICB0aGlzLiNzaWduZXJTZXNzaW9uID0gc2lnbmVyU2Vzc2lvbjtcbiAgICB0aGlzLiNvbk1mYVBvbGwgPSBvcHRpb25zPy5vbk1mYVBvbGwgPz8gKCgvKiBfbWZhSW5mbzogTWZhUmVxdWVzdEluZm8gKi8pID0+IHt9KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb25cbiAgICB0aGlzLiNtZmFQb2xsSW50ZXJ2YWxNcyA9IG9wdGlvbnM/Lm1mYVBvbGxJbnRlcnZhbE1zID8/IDEwMDA7XG4gICAgdGhpcy4jbWFuYWdlbWVudFNlc3Npb24gPSBvcHRpb25zPy5tYW5hZ2VtZW50U2Vzc2lvbjtcbiAgfVxuXG4gIC8qKiBSZXNvbHZlcyB0byB0aGUgc2lnbmVyIGFkZHJlc3MuICovXG4gIGFzeW5jIGdldEFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy4jYWRkcmVzcztcbiAgfVxuXG4gIC8qKlxuICAgKiAgUmV0dXJucyB0aGUgc2lnbmVyIGNvbm5lY3RlZCB0byAlJXByb3ZpZGVyJSUuXG4gICAqICBAcGFyYW0ge251bGwgfCBldGhlcnMuUHJvdmlkZXJ9IHByb3ZpZGVyIFRoZSBvcHRpb25hbCBwcm92aWRlciBpbnN0YW5jZSB0byB1c2UuXG4gICAqICBAcmV0dXJuIHtTaWduZXJ9IFRoZSBzaWduZXIgY29ubmVjdGVkIHRvIHNpZ25lci5cbiAgICovXG4gIGNvbm5lY3QocHJvdmlkZXI6IG51bGwgfCBldGhlcnMuUHJvdmlkZXIpOiBTaWduZXIge1xuICAgIHJldHVybiBuZXcgU2lnbmVyKHRoaXMuI2FkZHJlc3MsIHRoaXMuI3NpZ25lclNlc3Npb24sIHsgcHJvdmlkZXIgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYSB0cmFuc2FjdGlvbi4gVGhpcyBwb3B1bGF0ZXMgdGhlIHRyYW5zYWN0aW9uIHR5cGUgdG8gYDB4MDJgIChFSVAtMTU1OSkgdW5sZXNzIHNldC4gVGhpcyBtZXRob2Qgd2lsbCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbC5cbiAgICogQHBhcmFtIHtldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0fSB0eCBUaGUgdHJhbnNhY3Rpb24gdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uKHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBnZXQgdGhlIGNoYWluIGlkIGZyb20gdGhlIG5ldHdvcmsgb3IgdHhcbiAgICBsZXQgY2hhaW5JZCA9IHR4LmNoYWluSWQ7XG4gICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkPy50b1N0cmluZygpID8/IFwiMVwiO1xuICAgIH1cblxuICAgIC8vIENvbnZlcnQgdGhlIHRyYW5zYWN0aW9uIGludG8gYSBKU09OLVJQQyB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHJwY1R4ID1cbiAgICAgIHRoaXMucHJvdmlkZXIgaW5zdGFuY2VvZiBKc29uUnBjQXBpUHJvdmlkZXJcbiAgICAgICAgPyB0aGlzLnByb3ZpZGVyLmdldFJwY1RyYW5zYWN0aW9uKHR4KVxuICAgICAgICA6IC8vIFdlIGNhbiBqdXN0IGNhbGwgdGhlIGdldFJwY1RyYW5zYWN0aW9uIHdpdGggYVxuICAgICAgICAgIC8vIG51bGwgcmVjZWl2ZXIgc2luY2UgaXQgZG9lc24ndCBhY3R1YWxseSB1c2UgaXRcbiAgICAgICAgICAvLyAoYW5kIHJlYWxseSBzaG91bGQgYmUgZGVjbGFyZWQgc3RhdGljKS5cbiAgICAgICAgICBKc29uUnBjQXBpUHJvdmlkZXIucHJvdG90eXBlLmdldFJwY1RyYW5zYWN0aW9uLmNhbGwobnVsbCwgdHgpO1xuICAgIHJwY1R4LnR5cGUgPSB0b0JlSGV4KHR4LnR5cGUgPz8gMHgwMiwgMSk7IC8vIHdlIGV4cGVjdCAweDBbMC0yXVxuXG4gICAgY29uc3QgcmVxID0gPEV2bVNpZ25SZXF1ZXN0PntcbiAgICAgIGNoYWluX2lkOiBOdW1iZXIoY2hhaW5JZCksXG4gICAgICB0eDogcnBjVHgsXG4gICAgfTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bSh0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIGV0aGVycy5qcydzIFtoYXNoTWVzc2FnZV0oaHR0cHM6Ly9kb2NzLmV0aGVycy5vcmcvdjYvYXBpL2hhc2hpbmcvI2hhc2hNZXNzYWdlKVxuICAgKiB0byBjb21wdXRlIHRoZSBFSVAtMTkxIGRpZ2VzdCBhbmQgc2lnbnMgdGhpcyBkaWdlc3QgdXNpbmcge0BsaW5rIEtleSNzaWduQmxvYn0uXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgVWludDhBcnJheX0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcgfCBVaW50OEFycmF5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkaWdlc3QgPSBldGhlcnMuaGFzaE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMuc2lnbkJsb2IoZGlnZXN0KTtcbiAgfVxuXG4gIC8qKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBldGhlcnMuanMnc1xuICAgKiBbVHlwZWREYXRhRW5jb2Rlci5oYXNoXShodHRwczovL2RvY3MuZXRoZXJzLm9yZy92Ni9hcGkvaGFzaGluZy8jVHlwZWREYXRhRW5jb2Rlcl9oYXNoKVxuICAgKiB0byBjb21wdXRlIHRoZSBFSVAtNzEyIGRpZ2VzdCBhbmQgc2lnbnMgdGhpcyBkaWdlc3QgdXNpbmcge0BsaW5rIEtleSNzaWduQmxvYn0uXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7VHlwZWREYXRhRG9tYWlufSBkb21haW4gVGhlIGRvbWFpbiBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBBcnJheTxUeXBlZERhdGFGaWVsZD4+fSB0eXBlcyBUaGUgdHlwZXMgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHlwZWREYXRhKFxuICAgIGRvbWFpbjogVHlwZWREYXRhRG9tYWluLFxuICAgIHR5cGVzOiBSZWNvcmQ8c3RyaW5nLCBBcnJheTxUeXBlZERhdGFGaWVsZD4+LFxuICAgIHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkaWdlc3QgPSBUeXBlZERhdGFFbmNvZGVyLmhhc2goZG9tYWluLCB0eXBlcywgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzLnNpZ25CbG9iKGRpZ2VzdCk7XG4gIH1cblxuICAvKiogU2lnbiBhcmJpdHJhcnkgZGlnZXN0LiBUaGlzIHVzZXMge0BsaW5rIEtleSNzaWduQmxvYn0uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkaWdlc3QgVGhlIGRpZ2VzdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNpZ25CbG9iKGRpZ2VzdDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBibG9iUmVxID0gPEJsb2JTaWduUmVxdWVzdD57XG4gICAgICBtZXNzYWdlX2Jhc2U2NDogQnVmZmVyLmZyb20oZ2V0Qnl0ZXMoZGlnZXN0KSkudG9TdHJpbmcoXCJiYXNlNjRcIiksXG4gICAgfTtcbiAgICAvLyBHZXQgdGhlIGtleSBjb3JyZXNwb25kaW5nIHRvIHRoaXMgYWRkcmVzc1xuICAgIGlmICh0aGlzLiNrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qga2V5ID0gKGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24ua2V5cygpKS5maW5kKChrKSA9PiBrLm1hdGVyaWFsX2lkID09PSB0aGlzLiNhZGRyZXNzKTtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBhY2Nlc3Mga2V5ICcke3RoaXMuI2FkZHJlc3N9J2ApO1xuICAgICAgfVxuICAgICAgdGhpcy4ja2V5ID0ga2V5O1xuICAgIH1cblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkJsb2IodGhpcy4ja2V5LmtleV9pZCwgYmxvYlJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnNpZ25hdHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgc2lnbiByZXF1ZXN0IHJlcXVpcmVzIE1GQSwgdGhpcyBtZXRob2Qgd2FpdHMgZm9yIGFwcHJvdmFsc1xuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25SZXNwb25zZTxVPn0gcmVzIFRoZSByZXNwb25zZSBvZiBhIHNpZ24gcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFU+fSBUaGUgc2lnbiBkYXRhIGFmdGVyIE1GQSBhcHByb3ZhbHNcbiAgICovXG4gIGFzeW5jICNoYW5kbGVNZmE8VT4ocmVzOiBTaWduUmVzcG9uc2U8VT4pOiBQcm9taXNlPFU+IHtcbiAgICB3aGlsZSAocmVzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMuI21mYVBvbGxJbnRlcnZhbE1zKSk7XG5cbiAgICAgIGNvbnN0IG1mYUluZm8gPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLmdldE1mYUluZm8odGhpcy4jbWFuYWdlbWVudFNlc3Npb24hLCByZXMubWZhSWQoKSk7XG4gICAgICB0aGlzLiNvbk1mYVBvbGwobWZhSW5mbyk7XG4gICAgICBpZiAobWZhSW5mby5yZWNlaXB0KSB7XG4gICAgICAgIHJlcyA9IGF3YWl0IHJlcy5zaWduV2l0aE1mYUFwcHJvdmFsKG1mYUluZm8pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzLmRhdGEoKTtcbiAgfVxufVxuIl19