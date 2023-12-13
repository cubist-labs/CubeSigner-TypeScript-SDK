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
    /**
     * Create new Signer instance
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
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), req);
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.rlp_signed_tx;
    }
    /**
     * Signs arbitrary messages. This uses ethers.js's [hashMessage](https://docs.ethers.org/v6/api/hashing/#hashMessage)
     * to compute the EIP-191 digest and signs this digest using {@link Key#signBlob}.
     * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    async signMessage(message) {
        const digest = ethers_1.ethers.hashMessage(message);
        return this.signBlob(digest);
    }
    /**
     * Signs EIP-712 typed data. This uses ethers.js's
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
    /**
     * Sign arbitrary digest. This uses {@link Key#signBlob}.
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
        const v_adj = (parseInt(data.signature.slice(128), 16) + 27).toString(16);
        return data.signature.slice(0, 128) + v_adj;
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
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), req);
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
        if (!mfaInfo.request.path.includes("/eth1/sign/")) {
            throw new Error(`Expected EVM transaction signing request, got ${mfaInfo.request.path}`);
        }
        if (!mfaInfo.request.path.includes(__classPrivateFieldGet(this, _Signer_address, "f"))) {
            throw new Error(`Expected signing request for ${__classPrivateFieldGet(this, _Signer_address, "f")} but got ${mfaInfo.request.path}`);
        }
        const signedTx = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), mfaInfo.request.body, {
            mfaId: mfaInfo.id,
            mfaOrgId: __classPrivateFieldGet(this, _Signer_signerSession, "f").orgId,
            mfaConf: mfaInfo.receipt.confirmation,
        });
        return await this.provider.broadcastTransaction(signedTx.data().rlp_signed_tx);
    }
}
exports.Signer = Signer;
_Signer_address = new WeakMap(), _Signer_key = new WeakMap(), _Signer_signerSession = new WeakMap(), _Signer_onMfaPoll = new WeakMap(), _Signer_mfaPollIntervalMs = new WeakMap(), _Signer_instances = new WeakSet(), _Signer_handleMfa = 
/**
 * If the sign request requires MFA, this method waits for approvals
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXRoZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQVFnQjtBQXNCaEI7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsY0FBYztJQW1CL0M7Ozs7O09BS0c7SUFDSCxZQUFZLE9BQXlCLEVBQUUsYUFBNEIsRUFBRSxPQUF1QjtRQUMxRixLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDOztRQXpCM0IsaUNBQWlDO1FBQ3hCLGtDQUFpQjtRQUUxQixpQ0FBaUM7UUFDakMsOEJBQWU7UUFFZiw2QkFBNkI7UUFDcEIsd0NBQThCO1FBRXZDOzs7V0FHRztRQUNNLG9DQUEyQztRQUVwRCxnRUFBZ0U7UUFDdkQsNENBQTJCO1FBVWxDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxtQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksbUJBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksZUFBUSxPQUFrQixNQUFBLENBQUM7UUFDakMsQ0FBQztRQUNELHVCQUFBLElBQUkseUJBQWtCLGFBQWEsTUFBQSxDQUFDO1FBQ3BDLHVCQUFBLElBQUkscUJBQWMsT0FBTyxFQUFFLFNBQVMsSUFBSSxDQUFDLEVBQUMsOEJBQThCLEVBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQyxNQUFBLENBQUMsQ0FBQywyREFBMkQ7UUFDN0ksdUJBQUEsSUFBSSw2QkFBc0IsT0FBTyxFQUFFLGlCQUFpQixJQUFJLElBQUksTUFBQSxDQUFDO0lBQy9ELENBQUM7SUFFRCxzQ0FBc0M7SUFDdEMsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLHVCQUFBLElBQUksdUJBQVMsQ0FBQztJQUN2QixDQUFD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LENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztRQUN6QixNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLHVCQUFBLElBQUksaUNBQW1CLENBQUMsQ0FBQyxDQUFDO1FBRTdFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxQixNQUFNLE9BQU8sR0FBRyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUQsdUJBQUEsSUFBSSx5QkFBVyxNQUFmLElBQUksRUFBWSxPQUFPLENBQUMsQ0FBQztRQUN6QixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsbUJBQW1CLENBQUM7Z0JBQ2xDLEtBQUs7Z0JBQ0wsUUFBUSxFQUFFLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxLQUFLO2dCQUNuQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZO2FBQ3RDLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEpzb25ScGNBcGlQcm92aWRlcixcbiAgVHlwZWREYXRhRG9tYWluLFxuICBUeXBlZERhdGFFbmNvZGVyLFxuICBUeXBlZERhdGFGaWVsZCxcbiAgZXRoZXJzLFxuICBnZXRCeXRlcyxcbiAgdG9CZUhleCxcbn0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvbiB9IGZyb20gXCIuLi9zaWduZXJfc2Vzc2lvblwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lclJlc3BvbnNlIH0gZnJvbSBcIi4uL3Jlc3BvbnNlXCI7XG5pbXBvcnQgeyBCbG9iU2lnblJlcXVlc3QsIEV2bVNpZ25SZXF1ZXN0LCBNZmFSZXF1ZXN0SW5mbyB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IEtleUluZm8gfSBmcm9tIFwiLi4va2V5XCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5pbnRlcmZhY2UgU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCBwcm92aWRlciB0byB1c2UgKi9cbiAgcHJvdmlkZXI/OiBudWxsIHwgZXRoZXJzLlByb3ZpZGVyO1xuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgb25NZmFQb2xsPzogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiB0aW1lIChpbiBtaWxsaXNlY29uZHMpIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIE1GQVxuICAgKiB1cGRhdGVzLiBEZWZhdWx0IGlzIDEwMDBtc1xuICAgKi9cbiAgbWZhUG9sbEludGVydmFsTXM/OiBudW1iZXI7XG59XG5cbi8qKlxuICogQSBldGhlcnMuanMgU2lnbmVyIHVzaW5nIEN1YmVTaWduZXJcbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lciBleHRlbmRzIGV0aGVycy5BYnN0cmFjdFNpZ25lciB7XG4gIC8qKiBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCAqL1xuICByZWFkb25seSAjYWRkcmVzczogc3RyaW5nO1xuXG4gIC8qKiBUaGUga2V5IHRvIHVzZSBmb3Igc2lnbmluZyAqL1xuICAja2V5PzogS2V5SW5mbztcblxuICAvKiogVGhlIHVuZGVybHlpbmcgc2Vzc2lvbiAqL1xuICByZWFkb25seSAjc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbjtcblxuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgcmVhZG9ubHkgI29uTWZhUG9sbDogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuXG4gIC8qKiBUaGUgYW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBIHVwZGF0ZXMgKi9cbiAgcmVhZG9ubHkgI21mYVBvbGxJbnRlcnZhbE1zOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7S2V5SW5mbyB8IHN0cmluZ30gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc2lnbmVyU2Vzc2lvbiBUaGUgdW5kZXJseWluZyBTaWduZXIgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5SW5mbyB8IHN0cmluZywgc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbiwgb3B0aW9ucz86IFNpZ25lck9wdGlvbnMpIHtcbiAgICBzdXBlcihvcHRpb25zPy5wcm92aWRlcik7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3MubWF0ZXJpYWxJZDtcbiAgICAgIHRoaXMuI2tleSA9IGFkZHJlc3MgYXMgS2V5SW5mbztcbiAgICB9XG4gICAgdGhpcy4jc2lnbmVyU2Vzc2lvbiA9IHNpZ25lclNlc3Npb247XG4gICAgdGhpcy4jb25NZmFQb2xsID0gb3B0aW9ucz8ub25NZmFQb2xsID8/ICgoLyogX21mYUluZm86IE1mYVJlcXVlc3RJbmZvICovKSA9PiB7fSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uXG4gICAgdGhpcy4jbWZhUG9sbEludGVydmFsTXMgPSBvcHRpb25zPy5tZmFQb2xsSW50ZXJ2YWxNcyA/PyAxMDAwO1xuICB9XG5cbiAgLyoqIFJlc29sdmVzIHRvIHRoZSBzaWduZXIgYWRkcmVzcy4gKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLiNhZGRyZXNzO1xuICB9XG5cbiAgLyoqXG4gICAqICBSZXR1cm5zIHRoZSBzaWduZXIgY29ubmVjdGVkIHRvICUlcHJvdmlkZXIlJS5cbiAgICogIEBwYXJhbSB7bnVsbCB8IGV0aGVycy5Qcm92aWRlcn0gcHJvdmlkZXIgVGhlIG9wdGlvbmFsIHByb3ZpZGVyIGluc3RhbmNlIHRvIHVzZS5cbiAgICogIEByZXR1cm4ge1NpZ25lcn0gVGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gc2lnbmVyLlxuICAgKi9cbiAgY29ubmVjdChwcm92aWRlcjogbnVsbCB8IGV0aGVycy5Qcm92aWRlcik6IFNpZ25lciB7XG4gICAgcmV0dXJuIG5ldyBTaWduZXIodGhpcy4jYWRkcmVzcywgdGhpcy4jc2lnbmVyU2Vzc2lvbiwgeyBwcm92aWRlciB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBzaWduaW5nIHJlcXVlc3QgZnJvbSBhIHRyYW5zYWN0aW9uLiBUaGlzIHBvcHVsYXRlcyB0aGUgdHJhbnNhY3Rpb25cbiAgICogdHlwZSB0byBgMHgwMmAgKEVJUC0xNTU5KSB1bmxlc3Mgc2V0LlxuICAgKlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJuIHtFdm1TaWduUmVxdWVzdH0gVGhlIEVWTSBzaWduIHJlcXVlc3QgdG8gYmUgc2VudCB0byBDdWJlU2lnbmVyXG4gICAqL1xuICBhc3luYyBldm1TaWduUmVxdWVzdEZyb21UeCh0eDogZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8RXZtU2lnblJlcXVlc3Q+IHtcbiAgICAvLyBnZXQgdGhlIGNoYWluIGlkIGZyb20gdGhlIG5ldHdvcmsgb3IgdHhcbiAgICBsZXQgY2hhaW5JZCA9IHR4LmNoYWluSWQ7XG4gICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkPy50b1N0cmluZygpID8/IFwiMVwiO1xuICAgIH1cblxuICAgIC8vIENvbnZlcnQgdGhlIHRyYW5zYWN0aW9uIGludG8gYSBKU09OLVJQQyB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHJwY1R4ID1cbiAgICAgIHRoaXMucHJvdmlkZXIgaW5zdGFuY2VvZiBKc29uUnBjQXBpUHJvdmlkZXJcbiAgICAgICAgPyB0aGlzLnByb3ZpZGVyLmdldFJwY1RyYW5zYWN0aW9uKHR4KVxuICAgICAgICA6IC8vIFdlIGNhbiBqdXN0IGNhbGwgdGhlIGdldFJwY1RyYW5zYWN0aW9uIHdpdGggYVxuICAgICAgICAgIC8vIG51bGwgcmVjZWl2ZXIgc2luY2UgaXQgZG9lc24ndCBhY3R1YWxseSB1c2UgaXRcbiAgICAgICAgICAvLyAoYW5kIHJlYWxseSBzaG91bGQgYmUgZGVjbGFyZWQgc3RhdGljKS5cbiAgICAgICAgICBKc29uUnBjQXBpUHJvdmlkZXIucHJvdG90eXBlLmdldFJwY1RyYW5zYWN0aW9uLmNhbGwobnVsbCwgdHgpO1xuICAgIHJwY1R4LnR5cGUgPSB0b0JlSGV4KHR4LnR5cGUgPz8gMHgwMiwgMSk7IC8vIHdlIGV4cGVjdCAweDBbMC0yXVxuXG4gICAgcmV0dXJuIDxFdm1TaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHg6IHJwY1R4LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgodHgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bSh0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIGV0aGVycy5qcydzIFtoYXNoTWVzc2FnZV0oaHR0cHM6Ly9kb2NzLmV0aGVycy5vcmcvdjYvYXBpL2hhc2hpbmcvI2hhc2hNZXNzYWdlKVxuICAgKiB0byBjb21wdXRlIHRoZSBFSVAtMTkxIGRpZ2VzdCBhbmQgc2lnbnMgdGhpcyBkaWdlc3QgdXNpbmcge0BsaW5rIEtleSNzaWduQmxvYn0uXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgVWludDhBcnJheX0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcgfCBVaW50OEFycmF5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkaWdlc3QgPSBldGhlcnMuaGFzaE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMuc2lnbkJsb2IoZGlnZXN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBldGhlcnMuanMnc1xuICAgKiBbVHlwZWREYXRhRW5jb2Rlci5oYXNoXShodHRwczovL2RvY3MuZXRoZXJzLm9yZy92Ni9hcGkvaGFzaGluZy8jVHlwZWREYXRhRW5jb2Rlcl9oYXNoKVxuICAgKiB0byBjb21wdXRlIHRoZSBFSVAtNzEyIGRpZ2VzdCBhbmQgc2lnbnMgdGhpcyBkaWdlc3QgdXNpbmcge0BsaW5rIEtleSNzaWduQmxvYn0uXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7VHlwZWREYXRhRG9tYWlufSBkb21haW4gVGhlIGRvbWFpbiBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBBcnJheTxUeXBlZERhdGFGaWVsZD4+fSB0eXBlcyBUaGUgdHlwZXMgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHlwZWREYXRhKFxuICAgIGRvbWFpbjogVHlwZWREYXRhRG9tYWluLFxuICAgIHR5cGVzOiBSZWNvcmQ8c3RyaW5nLCBBcnJheTxUeXBlZERhdGFGaWVsZD4+LFxuICAgIHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkaWdlc3QgPSBUeXBlZERhdGFFbmNvZGVyLmhhc2goZG9tYWluLCB0eXBlcywgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzLnNpZ25CbG9iKGRpZ2VzdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhcmJpdHJhcnkgZGlnZXN0LiBUaGlzIHVzZXMge0BsaW5rIEtleSNzaWduQmxvYn0uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkaWdlc3QgVGhlIGRpZ2VzdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNpZ25CbG9iKGRpZ2VzdDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBibG9iUmVxID0gPEJsb2JTaWduUmVxdWVzdD57XG4gICAgICBtZXNzYWdlX2Jhc2U2NDogQnVmZmVyLmZyb20oZ2V0Qnl0ZXMoZGlnZXN0KSkudG9TdHJpbmcoXCJiYXNlNjRcIiksXG4gICAgfTtcbiAgICAvLyBHZXQgdGhlIGtleSBjb3JyZXNwb25kaW5nIHRvIHRoaXMgYWRkcmVzc1xuICAgIGlmICh0aGlzLiNrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qga2V5ID0gKGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24ua2V5cygpKS5maW5kKChrKSA9PiBrLm1hdGVyaWFsX2lkID09PSB0aGlzLiNhZGRyZXNzKTtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBhY2Nlc3Mga2V5ICcke3RoaXMuI2FkZHJlc3N9J2ApO1xuICAgICAgfVxuICAgICAgdGhpcy4ja2V5ID0ga2V5O1xuICAgIH1cblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkJsb2IodGhpcy4ja2V5LmtleV9pZCwgYmxvYlJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuXG4gICAgY29uc3Qgdl9hZGogPSAocGFyc2VJbnQoZGF0YS5zaWduYXR1cmUuc2xpY2UoMTI4KSwgMTYpICsgMjcpLnRvU3RyaW5nKDE2KTtcbiAgICByZXR1cm4gZGF0YS5zaWduYXR1cmUuc2xpY2UoMCwgMTI4KSArIHZfYWRqO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHNpZ25pbmcgYSBtZXNzYWdlIHVzaW5nIE1GQSBhcHByb3ZhbHMuIFRoaXMgbWV0aG9kIHBvcHVsYXRlc1xuICAgKiBtaXNzaW5nIGZpZWxkcy4gSWYgdGhlIHNpZ25pbmcgZG9lcyBub3QgcmVxdWlyZSBNRkEsIHRoaXMgbWV0aG9kIHRocm93cy5cbiAgICogQHBhcmFtIHtldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0fSB0eCBUaGUgdHJhbnNhY3Rpb24gdG8gc2VuZC5cbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2lnbmluZyByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgc2VuZFRyYW5zYWN0aW9uTWZhSW5pdCh0eDogZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcG9wVHggPSBhd2FpdCB0aGlzLnBvcHVsYXRlVHJhbnNhY3Rpb24odHgpO1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgocG9wVHgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bSh0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIHJldHVybiByZXMubWZhSWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBhcHByb3ZlZCBNRkEgcmVxdWVzdC4gVGhlIE1GQSByZXF1ZXN0IGNvbnRhaW5zXG4gICAqIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhcHByb3ZlZCBzaWduaW5nIHJlcXVlc3QsIHdoaWNoIHRoaXMgbWV0aG9kIHdpbGxcbiAgICogZXhlY3V0ZS5cbiAgICogQHBhcmFtIHtNZmFSZXF1ZXN0SW5mb30gbWZhSW5mbyBUaGUgYXBwcm92ZWQgTUZBIHJlcXVlc3QuXG4gICAqIEByZXR1cm4ge2V0aGVycy5UcmFuc2FjdGlvblJlc3BvbnNlfSBUaGUgcmVzdWx0IG9mIHN1Ym1pdHRpbmcgdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFJbmZvOiBNZmFSZXF1ZXN0SW5mbyk6IFByb21pc2U8ZXRoZXJzLlRyYW5zYWN0aW9uUmVzcG9uc2U+IHtcbiAgICBpZiAoIW1mYUluZm8ucmVxdWVzdC5wYXRoLmluY2x1ZGVzKFwiL2V0aDEvc2lnbi9cIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgRVZNIHRyYW5zYWN0aW9uIHNpZ25pbmcgcmVxdWVzdCwgZ290ICR7bWZhSW5mby5yZXF1ZXN0LnBhdGh9YCk7XG4gICAgfVxuICAgIGlmICghbWZhSW5mby5yZXF1ZXN0LnBhdGguaW5jbHVkZXModGhpcy4jYWRkcmVzcykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEV4cGVjdGVkIHNpZ25pbmcgcmVxdWVzdCBmb3IgJHt0aGlzLiNhZGRyZXNzfSBidXQgZ290ICR7bWZhSW5mby5yZXF1ZXN0LnBhdGh9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmVkVHggPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLnNpZ25Fdm0oXG4gICAgICB0aGlzLiNhZGRyZXNzLFxuICAgICAgbWZhSW5mby5yZXF1ZXN0LmJvZHkgYXMgRXZtU2lnblJlcXVlc3QsXG4gICAgICB7XG4gICAgICAgIG1mYUlkOiBtZmFJbmZvLmlkLFxuICAgICAgICBtZmFPcmdJZDogdGhpcy4jc2lnbmVyU2Vzc2lvbi5vcmdJZCxcbiAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0IS5jb25maXJtYXRpb24sXG4gICAgICB9LFxuICAgICk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucHJvdmlkZXIhLmJyb2FkY2FzdFRyYW5zYWN0aW9uKHNpZ25lZFR4LmRhdGEoKS5ybHBfc2lnbmVkX3R4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgc2lnbiByZXF1ZXN0IHJlcXVpcmVzIE1GQSwgdGhpcyBtZXRob2Qgd2FpdHMgZm9yIGFwcHJvdmFsc1xuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gcmVzIFRoZSByZXNwb25zZSBvZiBhIHNpZ24gcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFU+fSBUaGUgc2lnbiBkYXRhIGFmdGVyIE1GQSBhcHByb3ZhbHNcbiAgICovXG4gIGFzeW5jICNoYW5kbGVNZmE8VT4ocmVzOiBDdWJlU2lnbmVyUmVzcG9uc2U8VT4pOiBQcm9taXNlPFU+IHtcbiAgICB3aGlsZSAocmVzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMuI21mYVBvbGxJbnRlcnZhbE1zKSk7XG5cbiAgICAgIGNvbnN0IG1mYUlkID0gcmVzLm1mYUlkKCk7XG4gICAgICBjb25zdCBtZmFJbmZvID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5nZXRNZmFJbmZvKG1mYUlkKTtcbiAgICAgIHRoaXMuI29uTWZhUG9sbChtZmFJbmZvKTtcbiAgICAgIGlmIChtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgcmVzLnNpZ25XaXRoTWZhQXBwcm92YWwoe1xuICAgICAgICAgIG1mYUlkLFxuICAgICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNzaWduZXJTZXNzaW9uLm9yZ0lkLFxuICAgICAgICAgIG1mYUNvbmY6IG1mYUluZm8ucmVjZWlwdC5jb25maXJtYXRpb24sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzLmRhdGEoKTtcbiAgfVxufVxuIl19