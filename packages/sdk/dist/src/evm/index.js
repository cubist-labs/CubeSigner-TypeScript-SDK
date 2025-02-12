"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _EvmSigner_instances, _EvmSigner_address, _EvmSigner_key, _EvmSigner_client, _EvmSigner_options, _EvmSigner_handleMfa;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmSigner = void 0;
/**
 * Signer using CubeSigner, with basic MFA handling.
 *
 * @internal
 */
class EvmSigner {
    /** @returns The key address (NOT checksummed) */
    get address() {
        return __classPrivateFieldGet(this, _EvmSigner_address, "f");
    }
    /** @returns The underlying client */
    get client() {
        return __classPrivateFieldGet(this, _EvmSigner_client, "f");
    }
    /** @returns The options used for this EvmSigner */
    get options() {
        return __classPrivateFieldGet(this, _EvmSigner_options, "f");
    }
    /**
     * Create new Signer instance
     *
     * @param address The key or the eth address of the account to use.
     * @param client The underlying CubeSignerClient.
     * @param options The options to use for the Signer instance
     */
    constructor(address, client, options) {
        _EvmSigner_instances.add(this);
        /** The address of the account */
        _EvmSigner_address.set(this, void 0);
        /** The key to use for signing */
        _EvmSigner_key.set(this, void 0);
        /** The underlying session */
        _EvmSigner_client.set(this, void 0);
        /** Options */
        _EvmSigner_options.set(this, void 0);
        if (typeof address === "string") {
            __classPrivateFieldSet(this, _EvmSigner_address, address, "f");
        }
        else {
            __classPrivateFieldSet(this, _EvmSigner_address, address.materialId, "f");
            __classPrivateFieldSet(this, _EvmSigner_key, address, "f");
        }
        __classPrivateFieldSet(this, _EvmSigner_client, client, "f");
        __classPrivateFieldSet(this, _EvmSigner_options, {
            onMfaPoll: options?.onMfaPoll,
            mfaPollIntervalMs: options?.mfaPollIntervalMs ?? 1000,
        }, "f");
    }
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     *
     * @param req The sign request.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(req) {
        const res = await this.signEvm(req);
        const data = await __classPrivateFieldGet(this, _EvmSigner_instances, "m", _EvmSigner_handleMfa).call(this, res);
        return data.rlp_signed_tx;
    }
    /**
     * Sign a transaction. This method does not block if the key requires MFA approval, i.e.,
     * the returned {@link CubeSignerResponse} object either contains a signature or indicates
     * that MFA is required.
     *
     * @param req The transaction to sign.
     * @returns The response from the CubeSigner remote end.
     */
    async signEvm(req) {
        const key = await this.key();
        return await key.signEvm(req);
    }
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     *
     * @param req The EIP712 sign request.
     * @returns The signature.
     */
    async signEip712(req) {
        const key = await this.key();
        const res = await key.signEip712(req);
        const data = await __classPrivateFieldGet(this, _EvmSigner_instances, "m", _EvmSigner_handleMfa).call(this, res);
        return data.signature;
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     *
     * @param req The request to sign.
     * @returns The signature.
     */
    async signEip191(req) {
        const key = await this.key();
        const res = await key.signEip191(req);
        const data = await __classPrivateFieldGet(this, _EvmSigner_instances, "m", _EvmSigner_handleMfa).call(this, res);
        return data.signature;
    }
    /** @returns The key corresponding to this address */
    async key() {
        if (__classPrivateFieldGet(this, _EvmSigner_key, "f") === undefined) {
            const key = (await __classPrivateFieldGet(this, _EvmSigner_client, "f").sessionKeys()).find((k) => k.materialId === __classPrivateFieldGet(this, _EvmSigner_address, "f"));
            if (key === undefined) {
                throw new Error(`Cannot access key '${__classPrivateFieldGet(this, _EvmSigner_address, "f")}'`);
            }
            __classPrivateFieldSet(this, _EvmSigner_key, key, "f");
        }
        return __classPrivateFieldGet(this, _EvmSigner_key, "f");
    }
    /**
     * Sign a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will execute.
     *
     * @param mfaRequest The approved MFA request.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransactionMfaApproved(mfaRequest) {
        const request = await mfaRequest.request();
        if (!request.path.includes("/eth1/sign/")) {
            throw new Error(`Expected EVM transaction signing request, got ${request.path}`);
        }
        if (!request.path.includes(__classPrivateFieldGet(this, _EvmSigner_address, "f"))) {
            throw new Error(`Expected signing request for ${__classPrivateFieldGet(this, _EvmSigner_address, "f")} but got ${request.path}`);
        }
        const receipt = await mfaRequest.receipt();
        if (!receipt) {
            throw new Error("MFA request is not approved yet");
        }
        const key = await this.key();
        const resp = await key.signEvm(request.body, receipt);
        return resp.data().rlp_signed_tx;
    }
}
exports.EvmSigner = EvmSigner;
_EvmSigner_address = new WeakMap(), _EvmSigner_key = new WeakMap(), _EvmSigner_client = new WeakMap(), _EvmSigner_options = new WeakMap(), _EvmSigner_instances = new WeakSet(), _EvmSigner_handleMfa = 
/**
 * If the sign request requires MFA, this method waits for approvals
 *
 * @param res The response of a sign request
 * @returns The sign data after MFA approvals
 */
async function _EvmSigner_handleMfa(res) {
    let mfaId = undefined;
    while ((mfaId = res.mfaId())) {
        await new Promise((resolve) => setTimeout(resolve, __classPrivateFieldGet(this, _EvmSigner_options, "f").mfaPollIntervalMs));
        const mfaInfo = await __classPrivateFieldGet(this, _EvmSigner_client, "f").org().getMfaRequest(mfaId).fetch();
        __classPrivateFieldGet(this, _EvmSigner_options, "f").onMfaPoll?.(mfaInfo);
        if (mfaInfo.receipt) {
            res = await res.execWithMfaApproval({
                mfaId,
                mfaOrgId: __classPrivateFieldGet(this, _EvmSigner_client, "f").orgId,
                mfaConf: mfaInfo.receipt.confirmation,
            });
        }
    }
    return res.data();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQTBCQTs7OztHQUlHO0FBQ0gsTUFBYSxTQUFTO0lBYXBCLGlEQUFpRDtJQUNqRCxJQUFJLE9BQU87UUFDVCxPQUFPLHVCQUFBLElBQUksMEJBQVMsQ0FBQztJQUN2QixDQUFDO0lBRUQscUNBQXFDO0lBQ3JDLElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSx5QkFBUSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxtREFBbUQ7SUFDbkQsSUFBSSxPQUFPO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLDBCQUFTLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFlBQVksT0FBcUIsRUFBRSxNQUF3QixFQUFFLE9BQTBCOztRQWxDdkYsaUNBQWlDO1FBQ3hCLHFDQUFpQjtRQUUxQixpQ0FBaUM7UUFDakMsaUNBQVc7UUFFWCw2QkFBNkI7UUFDcEIsb0NBQTBCO1FBRW5DLGNBQWM7UUFDTCxxQ0FBMkI7UUF5QmxDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxzQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksc0JBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksa0JBQVEsT0FBTyxNQUFBLENBQUM7UUFDdEIsQ0FBQztRQUNELHVCQUFBLElBQUkscUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxzQkFBOEI7WUFDaEMsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTO1lBQzdCLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxpQkFBaUIsSUFBSSxJQUFJO1NBQ3RELE1BQUEsQ0FBQztJQUNKLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNI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QztRQUNMLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgRXZtU2lnblJlc3BvbnNlLFxuICBDdWJlU2lnbmVyQ2xpZW50LFxuICBLZXksXG4gIE1mYVJlcXVlc3QsXG59IGZyb20gXCIuLi9pbmRleFwiO1xuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHNpZ25lciAqL1xuZXhwb3J0IGludGVyZmFjZSBFdm1TaWduZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gTUZBIGluZm9ybWF0aW9uIGlzIHJldHJpZXZlZC4gSWYgdGhpcyBjYWxsYmFja1xuICAgKiB0aHJvd3MsIG5vIHRyYW5zYWN0aW9uIGlzIGJyb2FkY2FzdC5cbiAgICovXG4gIG9uTWZhUG9sbD86IChhcmcwOiBNZmFSZXF1ZXN0SW5mbykgPT4gdm9pZDtcbiAgLyoqXG4gICAqIFRoZSBhbW91bnQgb2YgdGltZSAoaW4gbWlsbGlzZWNvbmRzKSB0byB3YWl0IGJldHdlZW4gY2hlY2tzIGZvciBNRkFcbiAgICogdXBkYXRlcy4gRGVmYXVsdCBpcyAxMDAwbXNcbiAgICovXG4gIG1mYVBvbGxJbnRlcnZhbE1zPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFNpZ25lciB1c2luZyBDdWJlU2lnbmVyLCB3aXRoIGJhc2ljIE1GQSBoYW5kbGluZy5cbiAqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGNsYXNzIEV2bVNpZ25lciB7XG4gIC8qKiBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCAqL1xuICByZWFkb25seSAjYWRkcmVzczogc3RyaW5nO1xuXG4gIC8qKiBUaGUga2V5IHRvIHVzZSBmb3Igc2lnbmluZyAqL1xuICAja2V5PzogS2V5O1xuXG4gIC8qKiBUaGUgdW5kZXJseWluZyBzZXNzaW9uICovXG4gIHJlYWRvbmx5ICNjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQ7XG5cbiAgLyoqIE9wdGlvbnMgKi9cbiAgcmVhZG9ubHkgI29wdGlvbnM6IEV2bVNpZ25lck9wdGlvbnM7XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBrZXkgYWRkcmVzcyAoTk9UIGNoZWNrc3VtbWVkKSAqL1xuICBnZXQgYWRkcmVzcygpIHtcbiAgICByZXR1cm4gdGhpcy4jYWRkcmVzcztcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgdW5kZXJseWluZyBjbGllbnQgKi9cbiAgZ2V0IGNsaWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jY2xpZW50O1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBvcHRpb25zIHVzZWQgZm9yIHRoaXMgRXZtU2lnbmVyICovXG4gIGdldCBvcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLiNvcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGNsaWVudCBUaGUgdW5kZXJseWluZyBDdWJlU2lnbmVyQ2xpZW50LlxuICAgKiBAcGFyYW0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byB1c2UgZm9yIHRoZSBTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFkZHJlc3M6IEtleSB8IHN0cmluZywgY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBvcHRpb25zPzogRXZtU2lnbmVyT3B0aW9ucykge1xuICAgIGlmICh0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzLm1hdGVyaWFsSWQ7XG4gICAgICB0aGlzLiNrZXkgPSBhZGRyZXNzO1xuICAgIH1cbiAgICB0aGlzLiNjbGllbnQgPSBjbGllbnQ7XG4gICAgdGhpcy4jb3B0aW9ucyA9IDxFdm1TaWduZXJPcHRpb25zPntcbiAgICAgIG9uTWZhUG9sbDogb3B0aW9ucz8ub25NZmFQb2xsLFxuICAgICAgbWZhUG9sbEludGVydmFsTXM6IG9wdGlvbnM/Lm1mYVBvbGxJbnRlcnZhbE1zID8/IDEwMDAsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24uIFRoaXMgbWV0aG9kIHdpbGwgYmxvY2sgaWYgdGhlIGtleSByZXF1aXJlcyBNRkEgYXBwcm92YWwuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHNpZ24gcmVxdWVzdC5cbiAgICogQHJldHVybnMgSGV4LWVuY29kZWQgUkxQIGVuY29kaW5nIG9mIHRoZSB0cmFuc2FjdGlvbiBhbmQgaXRzIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UcmFuc2FjdGlvbihyZXE6IEV2bVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLnNpZ25Fdm0ocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEucmxwX3NpZ25lZF90eDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24uIFRoaXMgbWV0aG9kIGRvZXMgbm90IGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLCBpLmUuLFxuICAgKiB0aGUgcmV0dXJuZWQge0BsaW5rIEN1YmVTaWduZXJSZXNwb25zZX0gb2JqZWN0IGVpdGhlciBjb250YWlucyBhIHNpZ25hdHVyZSBvciBpbmRpY2F0ZXNcbiAgICogdGhhdCBNRkEgaXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHRyYW5zYWN0aW9uIHRvIHNpZ24uXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZSBmcm9tIHRoZSBDdWJlU2lnbmVyIHJlbW90ZSBlbmQuXG4gICAqL1xuICBhc3luYyBzaWduRXZtKHJlcTogRXZtU2lnblJlcXVlc3QpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICByZXR1cm4gYXdhaXQga2V5LnNpZ25Fdm0ocmVxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgRUlQNzEyIHNpZ24gcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXA3MTIocmVxOiBFaXA3MTJTaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBrZXkuc2lnbkVpcDcxMihyZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5zaWduYXR1cmU7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC0xOTEgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwMTkxU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHJldHVybnMgVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXAxOTEocmVxOiBFaXAxOTFTaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBrZXkuc2lnbkVpcDE5MShyZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5zaWduYXR1cmU7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGtleSBjb3JyZXNwb25kaW5nIHRvIHRoaXMgYWRkcmVzcyAqL1xuICBhc3luYyBrZXkoKTogUHJvbWlzZTxLZXk+IHtcbiAgICBpZiAodGhpcy4ja2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGtleSA9IChhd2FpdCB0aGlzLiNjbGllbnQuc2Vzc2lvbktleXMoKSkuZmluZCgoaykgPT4gay5tYXRlcmlhbElkID09PSB0aGlzLiNhZGRyZXNzKTtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBhY2Nlc3Mga2V5ICcke3RoaXMuI2FkZHJlc3N9J2ApO1xuICAgICAgfVxuICAgICAgdGhpcy4ja2V5ID0ga2V5O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4ja2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbCBleGVjdXRlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVxdWVzdCBUaGUgYXBwcm92ZWQgTUZBIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0OiBNZmFSZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0gYXdhaXQgbWZhUmVxdWVzdC5yZXF1ZXN0KCk7XG4gICAgaWYgKCFyZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHtyZXF1ZXN0LnBhdGh9YCk7XG4gICAgfVxuICAgIGlmICghcmVxdWVzdC5wYXRoLmluY2x1ZGVzKHRoaXMuI2FkZHJlc3MpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHNpZ25pbmcgcmVxdWVzdCBmb3IgJHt0aGlzLiNhZGRyZXNzfSBidXQgZ290ICR7cmVxdWVzdC5wYXRofWApO1xuICAgIH1cbiAgICBjb25zdCByZWNlaXB0ID0gYXdhaXQgbWZhUmVxdWVzdC5yZWNlaXB0KCk7XG4gICAgaWYgKCFyZWNlaXB0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNRkEgcmVxdWVzdCBpcyBub3QgYXBwcm92ZWQgeWV0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGtleS5zaWduRXZtKHJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCwgcmVjZWlwdCk7XG4gICAgcmV0dXJuIHJlc3AuZGF0YSgpLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIHNpZ24gcmVxdWVzdCByZXF1aXJlcyBNRkEsIHRoaXMgbWV0aG9kIHdhaXRzIGZvciBhcHByb3ZhbHNcbiAgICpcbiAgICogQHBhcmFtIHJlcyBUaGUgcmVzcG9uc2Ugb2YgYSBzaWduIHJlcXVlc3RcbiAgICogQHJldHVybnMgVGhlIHNpZ24gZGF0YSBhZnRlciBNRkEgYXBwcm92YWxzXG4gICAqL1xuICBhc3luYyAjaGFuZGxlTWZhPFU+KHJlczogQ3ViZVNpZ25lclJlc3BvbnNlPFU+KTogUHJvbWlzZTxVPiB7XG4gICAgbGV0IG1mYUlkID0gdW5kZWZpbmVkO1xuICAgIHdoaWxlICgobWZhSWQgPSByZXMubWZhSWQoKSkpIHtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMuI29wdGlvbnMubWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSW5mbyA9IGF3YWl0IHRoaXMuI2NsaWVudC5vcmcoKS5nZXRNZmFSZXF1ZXN0KG1mYUlkKS5mZXRjaCgpO1xuICAgICAgdGhpcy4jb3B0aW9ucy5vbk1mYVBvbGw/LihtZmFJbmZvKTtcbiAgICAgIGlmIChtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgcmVzLmV4ZWNXaXRoTWZhQXBwcm92YWwoe1xuICAgICAgICAgIG1mYUlkLFxuICAgICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNjbGllbnQub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=