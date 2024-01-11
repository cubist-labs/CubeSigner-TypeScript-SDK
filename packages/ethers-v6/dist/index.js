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
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    async signMessage(message) {
        const key = await this.key();
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEip191(key.material_id, {
            data: (0, cubesigner_sdk_1.encodeToHex)(message),
        });
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.signature;
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
        const key = await this.key();
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEip712(key.material_id, {
            chain_id: 1,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typed_data: {
                domain,
                types,
                primaryType: ethers_1.TypedDataEncoder.getPrimaryType(types),
                message: value,
            },
        });
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.signature;
    }
    /** @return {KeyInfo} The key corresponding to this address */
    async key() {
        if (__classPrivateFieldGet(this, _Signer_key, "f") === undefined) {
            const key = (await __classPrivateFieldGet(this, _Signer_signerSession, "f").keys()).find((k) => k.material_id === __classPrivateFieldGet(this, _Signer_address, "f"));
            if (key === undefined) {
                throw new Error(`Cannot access key '${__classPrivateFieldGet(this, _Signer_address, "f")}'`);
            }
            __classPrivateFieldSet(this, _Signer_key, key, "f");
        }
        return __classPrivateFieldGet(this, _Signer_key, "f");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBT2dCO0FBQ2hCLGdFQVNxQztBQWtCckM7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsY0FBYztJQW1CL0M7Ozs7O09BS0c7SUFDSCxZQUFZLE9BQXlCLEVBQUUsYUFBNEIsRUFBRSxPQUF1QjtRQUMxRixLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDOztRQXpCM0IsaUNBQWlDO1FBQ3hCLGtDQUFpQjtRQUUxQixpQ0FBaUM7UUFDakMsOEJBQWU7UUFFZiw2QkFBNkI7UUFDcEIsd0NBQThCO1FBRXZDOzs7V0FHRztRQUNNLG9DQUEyQztRQUVwRCxnRUFBZ0U7UUFDdkQsNENBQTJCO1FBVWxDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxtQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksbUJBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksZUFBUSxPQUFrQixNQUFBLENBQUM7UUFDakMsQ0FBQztRQUNELHVCQUFBLElBQUkseUJBQWtCLGFBQWEsTUFBQSxDQUFDO1FBQ3BDLHVCQUFBLElBQUkscUJBQWMsT0FBTyxFQUFFLFNBQVMsSUFBSSxDQUFDLEVBQUMsOEJBQThCLEVBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQyxNQUFBLENBQUMsQ0FBQywyREFBMkQ7UUFDN0ksdUJBQUEsSUFBSSw2QkFBc0IsT0FBTyxFQUFFLGlCQUFpQixJQUFJLElBQUksTUFBQSxDQUFDO0lBQy9ELENBQUM7SUFFRCxzQ0FBc0M7SUFDdEMsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLHVCQUFBLElBQUksdUJBQVMsQ0FBQztJQUN2QixDQUFD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Q0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSx1QkFBQSxJQUFJLGlDQUFtQixDQUFDLENBQUMsQ0FBQztRQUU3RSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVELHVCQUFBLElBQUkseUJBQVcsTUFBZixJQUFJLEVBQVksT0FBTyxDQUFDLENBQUM7UUFDekIsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsR0FBRyxHQUFHLE1BQU0sR0FBRyxDQUFDLG1CQUFtQixDQUFDO2dCQUNsQyxLQUFLO2dCQUNMLFFBQVEsRUFBRSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsS0FBSztnQkFDbkMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWTthQUN0QyxDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBKc29uUnBjQXBpUHJvdmlkZXIsXG4gIFR5cGVkRGF0YURvbWFpbixcbiAgVHlwZWREYXRhRmllbGQsXG4gIFR5cGVkRGF0YUVuY29kZXIsXG4gIGV0aGVycyxcbiAgdG9CZUhleCxcbn0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHtcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBLZXlJbmZvLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgU2lnbmVyU2Vzc2lvbixcbiAgZW5jb2RlVG9IZXgsXG59IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCBwcm92aWRlciB0byB1c2UgKi9cbiAgcHJvdmlkZXI/OiBudWxsIHwgZXRoZXJzLlByb3ZpZGVyO1xuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgb25NZmFQb2xsPzogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiB0aW1lIChpbiBtaWxsaXNlY29uZHMpIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIE1GQVxuICAgKiB1cGRhdGVzLiBEZWZhdWx0IGlzIDEwMDBtc1xuICAgKi9cbiAgbWZhUG9sbEludGVydmFsTXM/OiBudW1iZXI7XG59XG5cbi8qKlxuICogQSBldGhlcnMuanMgU2lnbmVyIHVzaW5nIEN1YmVTaWduZXJcbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lciBleHRlbmRzIGV0aGVycy5BYnN0cmFjdFNpZ25lciB7XG4gIC8qKiBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCAqL1xuICByZWFkb25seSAjYWRkcmVzczogc3RyaW5nO1xuXG4gIC8qKiBUaGUga2V5IHRvIHVzZSBmb3Igc2lnbmluZyAqL1xuICAja2V5PzogS2V5SW5mbztcblxuICAvKiogVGhlIHVuZGVybHlpbmcgc2Vzc2lvbiAqL1xuICByZWFkb25seSAjc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbjtcblxuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgcmVhZG9ubHkgI29uTWZhUG9sbDogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuXG4gIC8qKiBUaGUgYW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBIHVwZGF0ZXMgKi9cbiAgcmVhZG9ubHkgI21mYVBvbGxJbnRlcnZhbE1zOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7S2V5SW5mbyB8IHN0cmluZ30gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc2lnbmVyU2Vzc2lvbiBUaGUgdW5kZXJseWluZyBTaWduZXIgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5SW5mbyB8IHN0cmluZywgc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbiwgb3B0aW9ucz86IFNpZ25lck9wdGlvbnMpIHtcbiAgICBzdXBlcihvcHRpb25zPy5wcm92aWRlcik7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3MubWF0ZXJpYWxJZDtcbiAgICAgIHRoaXMuI2tleSA9IGFkZHJlc3MgYXMgS2V5SW5mbztcbiAgICB9XG4gICAgdGhpcy4jc2lnbmVyU2Vzc2lvbiA9IHNpZ25lclNlc3Npb247XG4gICAgdGhpcy4jb25NZmFQb2xsID0gb3B0aW9ucz8ub25NZmFQb2xsID8/ICgoLyogX21mYUluZm86IE1mYVJlcXVlc3RJbmZvICovKSA9PiB7fSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWZ1bmN0aW9uXG4gICAgdGhpcy4jbWZhUG9sbEludGVydmFsTXMgPSBvcHRpb25zPy5tZmFQb2xsSW50ZXJ2YWxNcyA/PyAxMDAwO1xuICB9XG5cbiAgLyoqIFJlc29sdmVzIHRvIHRoZSBzaWduZXIgYWRkcmVzcy4gKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLiNhZGRyZXNzO1xuICB9XG5cbiAgLyoqXG4gICAqICBSZXR1cm5zIHRoZSBzaWduZXIgY29ubmVjdGVkIHRvICUlcHJvdmlkZXIlJS5cbiAgICogIEBwYXJhbSB7bnVsbCB8IGV0aGVycy5Qcm92aWRlcn0gcHJvdmlkZXIgVGhlIG9wdGlvbmFsIHByb3ZpZGVyIGluc3RhbmNlIHRvIHVzZS5cbiAgICogIEByZXR1cm4ge1NpZ25lcn0gVGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gc2lnbmVyLlxuICAgKi9cbiAgY29ubmVjdChwcm92aWRlcjogbnVsbCB8IGV0aGVycy5Qcm92aWRlcik6IFNpZ25lciB7XG4gICAgcmV0dXJuIG5ldyBTaWduZXIodGhpcy4jYWRkcmVzcywgdGhpcy4jc2lnbmVyU2Vzc2lvbiwgeyBwcm92aWRlciB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBzaWduaW5nIHJlcXVlc3QgZnJvbSBhIHRyYW5zYWN0aW9uLiBUaGlzIHBvcHVsYXRlcyB0aGUgdHJhbnNhY3Rpb25cbiAgICogdHlwZSB0byBgMHgwMmAgKEVJUC0xNTU5KSB1bmxlc3Mgc2V0LlxuICAgKlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJuIHtFdm1TaWduUmVxdWVzdH0gVGhlIEVWTSBzaWduIHJlcXVlc3QgdG8gYmUgc2VudCB0byBDdWJlU2lnbmVyXG4gICAqL1xuICBhc3luYyBldm1TaWduUmVxdWVzdEZyb21UeCh0eDogZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8RXZtU2lnblJlcXVlc3Q+IHtcbiAgICAvLyBnZXQgdGhlIGNoYWluIGlkIGZyb20gdGhlIG5ldHdvcmsgb3IgdHhcbiAgICBsZXQgY2hhaW5JZCA9IHR4LmNoYWluSWQ7XG4gICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkPy50b1N0cmluZygpID8/IFwiMVwiO1xuICAgIH1cblxuICAgIC8vIENvbnZlcnQgdGhlIHRyYW5zYWN0aW9uIGludG8gYSBKU09OLVJQQyB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHJwY1R4ID1cbiAgICAgIHRoaXMucHJvdmlkZXIgaW5zdGFuY2VvZiBKc29uUnBjQXBpUHJvdmlkZXJcbiAgICAgICAgPyB0aGlzLnByb3ZpZGVyLmdldFJwY1RyYW5zYWN0aW9uKHR4KVxuICAgICAgICA6IC8vIFdlIGNhbiBqdXN0IGNhbGwgdGhlIGdldFJwY1RyYW5zYWN0aW9uIHdpdGggYVxuICAgICAgICAgIC8vIG51bGwgcmVjZWl2ZXIgc2luY2UgaXQgZG9lc24ndCBhY3R1YWxseSB1c2UgaXRcbiAgICAgICAgICAvLyAoYW5kIHJlYWxseSBzaG91bGQgYmUgZGVjbGFyZWQgc3RhdGljKS5cbiAgICAgICAgICBKc29uUnBjQXBpUHJvdmlkZXIucHJvdG90eXBlLmdldFJwY1RyYW5zYWN0aW9uLmNhbGwobnVsbCwgdHgpO1xuICAgIHJwY1R4LnR5cGUgPSB0b0JlSGV4KHR4LnR5cGUgPz8gMHgwMiwgMSk7IC8vIHdlIGV4cGVjdCAweDBbMC0yXVxuXG4gICAgcmV0dXJuIDxFdm1TaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHg6IHJwY1R4LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgodHgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bSh0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IFVpbnQ4QXJyYXl9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nIHwgVWludDhBcnJheSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLnNpZ25FaXAxOTEoa2V5Lm1hdGVyaWFsX2lkLCA8RWlwMTkxU2lnblJlcXVlc3Q+e1xuICAgICAgZGF0YTogZW5jb2RlVG9IZXgobWVzc2FnZSksXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnNpZ25hdHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtUeXBlZERhdGFEb21haW59IGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj59IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRWlwNzEyKGtleS5tYXRlcmlhbF9pZCwgPEVpcDcxMlNpZ25SZXF1ZXN0PntcbiAgICAgIGNoYWluX2lkOiAxLFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHR5cGVkX2RhdGE6IDxhbnk+e1xuICAgICAgICBkb21haW4sXG4gICAgICAgIHR5cGVzLFxuICAgICAgICBwcmltYXJ5VHlwZTogVHlwZWREYXRhRW5jb2Rlci5nZXRQcmltYXJ5VHlwZSh0eXBlcyksXG4gICAgICAgIG1lc3NhZ2U6IHZhbHVlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge0tleUluZm99IFRoZSBrZXkgY29ycmVzcG9uZGluZyB0byB0aGlzIGFkZHJlc3MgKi9cbiAgcHJpdmF0ZSBhc3luYyBrZXkoKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5rZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxfaWQgPT09IHRoaXMuI2FkZHJlc3MpO1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGFjY2VzcyBrZXkgJyR7dGhpcy4jYWRkcmVzc30nYCk7XG4gICAgICB9XG4gICAgICB0aGlzLiNrZXkgPSBrZXk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNrZXk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgc2lnbmluZyBhIG1lc3NhZ2UgdXNpbmcgTUZBIGFwcHJvdmFscy4gVGhpcyBtZXRob2QgcG9wdWxhdGVzXG4gICAqIG1pc3NpbmcgZmllbGRzLiBJZiB0aGUgc2lnbmluZyBkb2VzIG5vdCByZXF1aXJlIE1GQSwgdGhpcyBtZXRob2QgdGhyb3dzLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzZW5kLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoZSBzaWduaW5nIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFJbml0KHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBwb3BUeCA9IGF3YWl0IHRoaXMucG9wdWxhdGVUcmFuc2FjdGlvbih0eCk7XG4gICAgY29uc3QgcmVxID0gYXdhaXQgdGhpcy5ldm1TaWduUmVxdWVzdEZyb21UeChwb3BUeCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRXZtKHRoaXMuI2FkZHJlc3MsIHJlcSk7XG4gICAgcmV0dXJuIHJlcy5tZmFJZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbFxuICAgKiBleGVjdXRlLlxuICAgKiBAcGFyYW0ge01mYVJlcXVlc3RJbmZvfSBtZmFJbmZvIFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVzcG9uc2V9IFRoZSByZXN1bHQgb2Ygc3VibWl0dGluZyB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYUluZm86IE1mYVJlcXVlc3RJbmZvKTogUHJvbWlzZTxldGhlcnMuVHJhbnNhY3Rpb25SZXNwb25zZT4ge1xuICAgIGlmICghbWZhSW5mby5yZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gKTtcbiAgICB9XG4gICAgaWYgKCFtZmFJbmZvLnJlcXVlc3QucGF0aC5pbmNsdWRlcyh0aGlzLiNhZGRyZXNzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRXhwZWN0ZWQgc2lnbmluZyByZXF1ZXN0IGZvciAke3RoaXMuI2FkZHJlc3N9IGJ1dCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaWduZWRUeCA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bShcbiAgICAgIHRoaXMuI2FkZHJlc3MsXG4gICAgICBtZmFJbmZvLnJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCxcbiAgICAgIHtcbiAgICAgICAgbWZhSWQ6IG1mYUluZm8uaWQsXG4gICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNzaWduZXJTZXNzaW9uLm9yZ0lkLFxuICAgICAgICBtZmFDb25mOiBtZmFJbmZvLnJlY2VpcHQhLmNvbmZpcm1hdGlvbixcbiAgICAgIH0sXG4gICAgKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm92aWRlciEuYnJvYWRjYXN0VHJhbnNhY3Rpb24oc2lnbmVkVHguZGF0YSgpLnJscF9zaWduZWRfdHgpO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgI2hhbmRsZU1mYTxVPihyZXM6IEN1YmVTaWduZXJSZXNwb25zZTxVPik6IFByb21pc2U8VT4ge1xuICAgIHdoaWxlIChyZXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jbWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSWQgPSByZXMubWZhSWQoKTtcbiAgICAgIGNvbnN0IG1mYUluZm8gPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLmdldE1mYUluZm8obWZhSWQpO1xuICAgICAgdGhpcy4jb25NZmFQb2xsKG1mYUluZm8pO1xuICAgICAgaWYgKG1mYUluZm8ucmVjZWlwdCkge1xuICAgICAgICByZXMgPSBhd2FpdCByZXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7XG4gICAgICAgICAgbWZhSWQsXG4gICAgICAgICAgbWZhT3JnSWQ6IHRoaXMuI3NpZ25lclNlc3Npb24ub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=