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
        const mfaId = res.mfaId();
        const mfaInfo = await __classPrivateFieldGet(this, _Signer_signerSession, "f").getMfaInfo(__classPrivateFieldGet(this, _Signer_managementSession, "f"), mfaId);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXRoZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQVFnQjtBQTZCaEI7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsY0FBYztJQXNCL0M7Ozs7T0FJRztJQUNILFlBQVksT0FBeUIsRUFBRSxhQUE0QixFQUFFLE9BQXVCO1FBQzFGLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7O1FBM0IzQixpQ0FBaUM7UUFDeEIsa0NBQWlCO1FBRTFCLGlDQUFpQztRQUNqQyw4QkFBZTtRQUVmLDZCQUE2QjtRQUNwQix3Q0FBOEI7UUFFdkM7OztXQUdHO1FBQ00sb0NBQTJDO1FBRXBELGdFQUFnRTtRQUN2RCw0Q0FBMkI7UUFFcEMsc0RBQXNEO1FBQzdDLDRDQUFnQztRQVN2QyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQix1QkFBQSxJQUFJLG1CQUFZLE9BQU8sTUFBQSxDQUFDO1NBQ3pCO2FBQU07WUFDTCx1QkFBQSxJQUFJLG1CQUFZLE9BQU8sQ0FBQyxVQUFVLE1BQUEsQ0FBQztZQUNuQyx1QkFBQSxJQUFJLGVBQVEsT0FBa0IsTUFBQSxDQUFDO1NBQ2hDO1FBQ0QsdUJBQUEsSUFBSSx5QkFBa0IsYUFBYSxNQUFBLENBQUM7UUFDcEMsdUJBQUEsSUFBSSxxQkFBYyxPQUFPLEVBQUUsU0FBUyxJQUFJLENBQUMsRUFBQyw4QkFBOEIsRUFBRSxFQUFFLEdBQUUsQ0FBQyxDQUFDLE1BQUEsQ0FBQyxDQUFDLDJEQUEyRDtRQUM3SSx1QkFBQSxJQUFJLDZCQUFzQixPQUFPLEVBQUUsaUJBQWlCLElBQUksSUFBSSxNQUFBLENBQUM7UUFDN0QsdUJBQUEsSUFBSSw2QkFBc0IsT0FBTyxFQUFFLGlCQUFpQixNQUFBLENBQUM7SUFDdkQsQ0FBQztJQUVELHNDQUFzQztJQUN0QyxL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QUEsSUFBSSw2QkFBZSxDQUFDLEtBQUs7Z0JBQ25DLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVk7YUFDdEMsQ0FBQyxDQUFDO1NBQ0o7S0FDRjtJQUNELE9BQU8sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBKc29uUnBjQXBpUHJvdmlkZXIsXG4gIFR5cGVkRGF0YURvbWFpbixcbiAgVHlwZWREYXRhRW5jb2RlcixcbiAgVHlwZWREYXRhRmllbGQsXG4gIGV0aGVycyxcbiAgZ2V0Qnl0ZXMsXG4gIHRvQmVIZXgsXG59IGZyb20gXCJldGhlcnNcIjtcbmltcG9ydCB7XG4gIEJsb2JTaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBTaWduZXJTZXNzaW9uLFxuICBTaWduUmVzcG9uc2UsXG59IGZyb20gXCIuLi9zaWduZXJfc2Vzc2lvblwiO1xuaW1wb3J0IHsgS2V5SW5mbyB9IGZyb20gXCIuLi9rZXlcIjtcbmltcG9ydCB7IEN1YmVTaWduZXIgfSBmcm9tIFwiLi5cIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmludGVyZmFjZSBTaWduZXJPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHByb3ZpZGVyIHRvIHVzZSAqL1xuICBwcm92aWRlcj86IG51bGwgfCBldGhlcnMuUHJvdmlkZXI7XG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICBvbk1mYVBvbGw/OiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBXG4gICAqIHVwZGF0ZXMuIERlZmF1bHQgaXMgMTAwMG1zXG4gICAqL1xuICBtZmFQb2xsSW50ZXJ2YWxNcz86IG51bWJlcjtcbiAgLyoqIE9wdGlvbmFsIG1hbmFnZW1lbnQgc2Vzc2lvbi4gVXNlZCB0byBjaGVjayBmb3IgTUZBIHVwZGF0ZXMgKi9cbiAgbWFuYWdlbWVudFNlc3Npb24/OiBDdWJlU2lnbmVyO1xufVxuXG4vKipcbiAqIEEgZXRoZXJzLmpzIFNpZ25lciB1c2luZyBDdWJlU2lnbmVyXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXIgZXh0ZW5kcyBldGhlcnMuQWJzdHJhY3RTaWduZXIge1xuICAvKiogVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgKi9cbiAgcmVhZG9ubHkgI2FkZHJlc3M6IHN0cmluZztcblxuICAvKiogVGhlIGtleSB0byB1c2UgZm9yIHNpZ25pbmcgKi9cbiAgI2tleT86IEtleUluZm87XG5cbiAgLyoqIFRoZSB1bmRlcmx5aW5nIHNlc3Npb24gKi9cbiAgcmVhZG9ubHkgI3NpZ25lclNlc3Npb246IFNpZ25lclNlc3Npb247XG5cbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gTUZBIGluZm9ybWF0aW9uIGlzIHJldHJpZXZlZC4gSWYgdGhpcyBjYWxsYmFja1xuICAgKiB0aHJvd3MsIG5vIHRyYW5zYWN0aW9uIGlzIGJyb2FkY2FzdC5cbiAgICovXG4gIHJlYWRvbmx5ICNvbk1mYVBvbGw6IChhcmcwOiBNZmFSZXF1ZXN0SW5mbykgPT4gdm9pZDtcblxuICAvKiogVGhlIGFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIE1GQSB1cGRhdGVzICovXG4gIHJlYWRvbmx5ICNtZmFQb2xsSW50ZXJ2YWxNczogbnVtYmVyO1xuXG4gIC8qKiBPcHRpb25hbCBtYW5hZ2VtZW50IHNlc3Npb24sIHVzZWQgZm9yIE1GQSBmbG93cyAqL1xuICByZWFkb25seSAjbWFuYWdlbWVudFNlc3Npb24/OiBDdWJlU2lnbmVyO1xuXG4gIC8qKiBDcmVhdGUgbmV3IFNpZ25lciBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0tleUluZm8gfCBzdHJpbmd9IGFkZHJlc3MgVGhlIGtleSBvciB0aGUgZXRoIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb259IHNpZ25lclNlc3Npb24gVGhlIHVuZGVybHlpbmcgU2lnbmVyIHNlc3Npb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyT3B0aW9uc30gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byB1c2UgZm9yIHRoZSBTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFkZHJlc3M6IEtleUluZm8gfCBzdHJpbmcsIHNpZ25lclNlc3Npb246IFNpZ25lclNlc3Npb24sIG9wdGlvbnM/OiBTaWduZXJPcHRpb25zKSB7XG4gICAgc3VwZXIob3B0aW9ucz8ucHJvdmlkZXIpO1xuICAgIGlmICh0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzLm1hdGVyaWFsSWQ7XG4gICAgICB0aGlzLiNrZXkgPSBhZGRyZXNzIGFzIEtleUluZm87XG4gICAgfVxuICAgIHRoaXMuI3NpZ25lclNlc3Npb24gPSBzaWduZXJTZXNzaW9uO1xuICAgIHRoaXMuI29uTWZhUG9sbCA9IG9wdGlvbnM/Lm9uTWZhUG9sbCA/PyAoKC8qIF9tZmFJbmZvOiBNZmFSZXF1ZXN0SW5mbyAqLykgPT4ge30pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvblxuICAgIHRoaXMuI21mYVBvbGxJbnRlcnZhbE1zID0gb3B0aW9ucz8ubWZhUG9sbEludGVydmFsTXMgPz8gMTAwMDtcbiAgICB0aGlzLiNtYW5hZ2VtZW50U2Vzc2lvbiA9IG9wdGlvbnM/Lm1hbmFnZW1lbnRTZXNzaW9uO1xuICB9XG5cbiAgLyoqIFJlc29sdmVzIHRvIHRoZSBzaWduZXIgYWRkcmVzcy4gKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLiNhZGRyZXNzO1xuICB9XG5cbiAgLyoqXG4gICAqICBSZXR1cm5zIHRoZSBzaWduZXIgY29ubmVjdGVkIHRvICUlcHJvdmlkZXIlJS5cbiAgICogIEBwYXJhbSB7bnVsbCB8IGV0aGVycy5Qcm92aWRlcn0gcHJvdmlkZXIgVGhlIG9wdGlvbmFsIHByb3ZpZGVyIGluc3RhbmNlIHRvIHVzZS5cbiAgICogIEByZXR1cm4ge1NpZ25lcn0gVGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gc2lnbmVyLlxuICAgKi9cbiAgY29ubmVjdChwcm92aWRlcjogbnVsbCB8IGV0aGVycy5Qcm92aWRlcik6IFNpZ25lciB7XG4gICAgcmV0dXJuIG5ldyBTaWduZXIodGhpcy4jYWRkcmVzcywgdGhpcy4jc2lnbmVyU2Vzc2lvbiwgeyBwcm92aWRlciB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBhIHRyYW5zYWN0aW9uLiBUaGlzIHBvcHVsYXRlcyB0aGUgdHJhbnNhY3Rpb24gdHlwZSB0byBgMHgwMmAgKEVJUC0xNTU5KSB1bmxlc3Mgc2V0LiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ/LnRvU3RyaW5nKCkgPz8gXCIxXCI7XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCB0aGUgdHJhbnNhY3Rpb24gaW50byBhIEpTT04tUlBDIHRyYW5zYWN0aW9uXG4gICAgY29uc3QgcnBjVHggPVxuICAgICAgdGhpcy5wcm92aWRlciBpbnN0YW5jZW9mIEpzb25ScGNBcGlQcm92aWRlclxuICAgICAgICA/IHRoaXMucHJvdmlkZXIuZ2V0UnBjVHJhbnNhY3Rpb24odHgpXG4gICAgICAgIDogLy8gV2UgY2FuIGp1c3QgY2FsbCB0aGUgZ2V0UnBjVHJhbnNhY3Rpb24gd2l0aCBhXG4gICAgICAgICAgLy8gbnVsbCByZWNlaXZlciBzaW5jZSBpdCBkb2Vzbid0IGFjdHVhbGx5IHVzZSBpdFxuICAgICAgICAgIC8vIChhbmQgcmVhbGx5IHNob3VsZCBiZSBkZWNsYXJlZCBzdGF0aWMpLlxuICAgICAgICAgIEpzb25ScGNBcGlQcm92aWRlci5wcm90b3R5cGUuZ2V0UnBjVHJhbnNhY3Rpb24uY2FsbChudWxsLCB0eCk7XG4gICAgcnBjVHgudHlwZSA9IHRvQmVIZXgodHgudHlwZSA/PyAweDAyLCAxKTsgLy8gd2UgZXhwZWN0IDB4MFswLTJdXG5cbiAgICBjb25zdCByZXEgPSA8RXZtU2lnblJlcXVlc3Q+e1xuICAgICAgY2hhaW5faWQ6IE51bWJlcihjaGFpbklkKSxcbiAgICAgIHR4OiBycGNUeCxcbiAgICB9O1xuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRXZtKHRoaXMuI2FkZHJlc3MsIHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKiogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgZXRoZXJzLmpzJ3MgW2hhc2hNZXNzYWdlXShodHRwczovL2RvY3MuZXRoZXJzLm9yZy92Ni9hcGkvaGFzaGluZy8jaGFzaE1lc3NhZ2UpXG4gICAqIHRvIGNvbXB1dGUgdGhlIEVJUC0xOTEgZGlnZXN0IGFuZCBzaWducyB0aGlzIGRpZ2VzdCB1c2luZyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtzdHJpbmcgfCBVaW50OEFycmF5fSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZyB8IFVpbnQ4QXJyYXkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRpZ2VzdCA9IGV0aGVycy5oYXNoTWVzc2FnZShtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5zaWduQmxvYihkaWdlc3QpO1xuICB9XG5cbiAgLyoqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIGV0aGVycy5qcydzXG4gICAqIFtUeXBlZERhdGFFbmNvZGVyLmhhc2hdKGh0dHBzOi8vZG9jcy5ldGhlcnMub3JnL3Y2L2FwaS9oYXNoaW5nLyNUeXBlZERhdGFFbmNvZGVyX2hhc2gpXG4gICAqIHRvIGNvbXB1dGUgdGhlIEVJUC03MTIgZGlnZXN0IGFuZCBzaWducyB0aGlzIGRpZ2VzdCB1c2luZyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtUeXBlZERhdGFEb21haW59IGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj59IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRpZ2VzdCA9IFR5cGVkRGF0YUVuY29kZXIuaGFzaChkb21haW4sIHR5cGVzLCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMuc2lnbkJsb2IoZGlnZXN0KTtcbiAgfVxuXG4gIC8qKiBTaWduIGFyYml0cmFyeSBkaWdlc3QuIFRoaXMgdXNlcyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGRpZ2VzdCBUaGUgZGlnZXN0IHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc2lnbkJsb2IoZGlnZXN0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGJsb2JSZXEgPSA8QmxvYlNpZ25SZXF1ZXN0PntcbiAgICAgIG1lc3NhZ2VfYmFzZTY0OiBCdWZmZXIuZnJvbShnZXRCeXRlcyhkaWdlc3QpKS50b1N0cmluZyhcImJhc2U2NFwiKSxcbiAgICB9O1xuICAgIC8vIEdldCB0aGUga2V5IGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBhZGRyZXNzXG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5rZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxfaWQgPT09IHRoaXMuI2FkZHJlc3MpO1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGFjY2VzcyBrZXkgJyR7dGhpcy4jYWRkcmVzc30nYCk7XG4gICAgICB9XG4gICAgICB0aGlzLiNrZXkgPSBrZXk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduQmxvYih0aGlzLiNrZXkua2V5X2lkLCBibG9iUmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnblJlc3BvbnNlPFU+fSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgI2hhbmRsZU1mYTxVPihyZXM6IFNpZ25SZXNwb25zZTxVPik6IFByb21pc2U8VT4ge1xuICAgIHdoaWxlIChyZXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jbWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSWQgPSByZXMubWZhSWQoKTtcbiAgICAgIGNvbnN0IG1mYUluZm8gPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLmdldE1mYUluZm8odGhpcy4jbWFuYWdlbWVudFNlc3Npb24hLCBtZmFJZCk7XG4gICAgICB0aGlzLiNvbk1mYVBvbGwobWZhSW5mbyk7XG4gICAgICBpZiAobWZhSW5mby5yZWNlaXB0KSB7XG4gICAgICAgIHJlcyA9IGF3YWl0IHJlcy5zaWduV2l0aE1mYUFwcHJvdmFsKHtcbiAgICAgICAgICBtZmFJZCxcbiAgICAgICAgICBtZmFPcmdJZDogdGhpcy4jc2lnbmVyU2Vzc2lvbi5vcmdJZCxcbiAgICAgICAgICBtZmFDb25mOiBtZmFJbmZvLnJlY2VpcHQuY29uZmlybWF0aW9uLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcy5kYXRhKCk7XG4gIH1cbn1cbiJdfQ==