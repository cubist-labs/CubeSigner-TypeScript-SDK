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
    /** Returns the key address (NOT checksummed) */
    get address() {
        return __classPrivateFieldGet(this, _EvmSigner_address, "f");
    }
    /** Returns the underlying client */
    get client() {
        return __classPrivateFieldGet(this, _EvmSigner_client, "f");
    }
    /** Options */
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
    while (res.requiresMfa()) {
        await new Promise((resolve) => setTimeout(resolve, __classPrivateFieldGet(this, _EvmSigner_options, "f").mfaPollIntervalMs));
        const mfaId = res.mfaId();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQTBCQTs7OztHQUlHO0FBQ0gsTUFBYSxTQUFTO0lBYXBCLGdEQUFnRDtJQUNoRCxJQUFJLE9BQU87UUFDVCxPQUFPLHVCQUFBLElBQUksMEJBQVMsQ0FBQztJQUN2QixDQUFDO0lBRUQsb0NBQW9DO0lBQ3BDLElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSx5QkFBUSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxjQUFjO0lBQ2QsSUFBSSxPQUFPO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLDBCQUFTLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFlBQVksT0FBcUIsRUFBRSxNQUF3QixFQUFFLE9BQTBCOztRQWxDdkYsaUNBQWlDO1FBQ3hCLHFDQUFpQjtRQUUxQixpQ0FBaUM7UUFDakMsaUNBQVc7UUFFWCw2QkFBNkI7UUFDcEIsb0NBQTBCO1FBRW5DLGNBQWM7UUFDTCxxQ0FBMkI7UUF5QmxDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxzQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksc0JBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksa0JBQVEsT0FBTyxNQUFBLENBQUM7UUFDdEIsQ0FBQztRQUNELHVCQUFBLElBQUkscUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxzQkFBOEI7WUFDaEMsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTO1lBQzdCLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxpQkFBaUIsSUFBSSxJQUFJO1NBQ3RELE1BQUEsQ0FBQztJQUNKLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtB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QUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEN1YmVTaWduZXJSZXNwb25zZSxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVxdWVzdCxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIEV2bVNpZ25SZXNwb25zZSxcbiAgQ3ViZVNpZ25lckNsaWVudCxcbiAgS2V5LFxuICBNZmFSZXF1ZXN0LFxufSBmcm9tIFwiLi4vaW5kZXhcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXZtU2lnbmVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICBvbk1mYVBvbGw/OiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBXG4gICAqIHVwZGF0ZXMuIERlZmF1bHQgaXMgMTAwMG1zXG4gICAqL1xuICBtZmFQb2xsSW50ZXJ2YWxNcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lciwgd2l0aCBiYXNpYyBNRkEgaGFuZGxpbmcuXG4gKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBFdm1TaWduZXIge1xuICAvKiogVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgKi9cbiAgcmVhZG9ubHkgI2FkZHJlc3M6IHN0cmluZztcblxuICAvKiogVGhlIGtleSB0byB1c2UgZm9yIHNpZ25pbmcgKi9cbiAgI2tleT86IEtleTtcblxuICAvKiogVGhlIHVuZGVybHlpbmcgc2Vzc2lvbiAqL1xuICByZWFkb25seSAjY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50O1xuXG4gIC8qKiBPcHRpb25zICovXG4gIHJlYWRvbmx5ICNvcHRpb25zOiBFdm1TaWduZXJPcHRpb25zO1xuXG4gIC8qKiBSZXR1cm5zIHRoZSBrZXkgYWRkcmVzcyAoTk9UIGNoZWNrc3VtbWVkKSAqL1xuICBnZXQgYWRkcmVzcygpIHtcbiAgICByZXR1cm4gdGhpcy4jYWRkcmVzcztcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSB1bmRlcmx5aW5nIGNsaWVudCAqL1xuICBnZXQgY2xpZW50KCkge1xuICAgIHJldHVybiB0aGlzLiNjbGllbnQ7XG4gIH1cblxuICAvKiogT3B0aW9ucyAqL1xuICBnZXQgb3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy4jb3B0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IFNpZ25lciBpbnN0YW5jZVxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSBjbGllbnQgVGhlIHVuZGVybHlpbmcgQ3ViZVNpZ25lckNsaWVudC5cbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXkgfCBzdHJpbmcsIGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgb3B0aW9ucz86IEV2bVNpZ25lck9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcy5tYXRlcmlhbElkO1xuICAgICAgdGhpcy4ja2V5ID0gYWRkcmVzcztcbiAgICB9XG4gICAgdGhpcy4jY2xpZW50ID0gY2xpZW50O1xuICAgIHRoaXMuI29wdGlvbnMgPSA8RXZtU2lnbmVyT3B0aW9ucz57XG4gICAgICBvbk1mYVBvbGw6IG9wdGlvbnM/Lm9uTWZhUG9sbCxcbiAgICAgIG1mYVBvbGxJbnRlcnZhbE1zOiBvcHRpb25zPy5tZmFQb2xsSW50ZXJ2YWxNcyA/PyAxMDAwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSBzaWduIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24ocmVxOiBFdm1TaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5zaWduRXZtKHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCBkb2VzIG5vdCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbCwgaS5lLixcbiAgICogdGhlIHJldHVybmVkIHtAbGluayBDdWJlU2lnbmVyUmVzcG9uc2V9IG9iamVjdCBlaXRoZXIgY29udGFpbnMgYSBzaWduYXR1cmUgb3IgaW5kaWNhdGVzXG4gICAqIHRoYXQgTUZBIGlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgQ3ViZVNpZ25lciByZW1vdGUgZW5kLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShyZXE6IEV2bVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgcmV0dXJuIGF3YWl0IGtleS5zaWduRXZtKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgRUlQLTcxMiB0eXBlZCBkYXRhLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC03MTIgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwNzEyU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIEVJUDcxMiBzaWduIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKHJlcTogRWlwNzEyU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQga2V5LnNpZ25FaXA3MTIocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwMTkxKHJlcTogRWlwMTkxU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQga2V5LnNpZ25FaXAxOTEocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBrZXkgY29ycmVzcG9uZGluZyB0byB0aGlzIGFkZHJlc3MgKi9cbiAgYXN5bmMga2V5KCk6IFByb21pc2U8S2V5PiB7XG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jY2xpZW50LnNlc3Npb25LZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxJZCA9PT0gdGhpcy4jYWRkcmVzcyk7XG4gICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgYWNjZXNzIGtleSAnJHt0aGlzLiNhZGRyZXNzfSdgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI2tleSA9IGtleTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2tleTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBhcHByb3ZlZCBNRkEgcmVxdWVzdC4gVGhlIE1GQSByZXF1ZXN0IGNvbnRhaW5zXG4gICAqIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhcHByb3ZlZCBzaWduaW5nIHJlcXVlc3QsIHdoaWNoIHRoaXMgbWV0aG9kIHdpbGwgZXhlY3V0ZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlcXVlc3QgVGhlIGFwcHJvdmVkIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uTWZhQXBwcm92ZWQobWZhUmVxdWVzdDogTWZhUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IGF3YWl0IG1mYVJlcXVlc3QucmVxdWVzdCgpO1xuICAgIGlmICghcmVxdWVzdC5wYXRoLmluY2x1ZGVzKFwiL2V0aDEvc2lnbi9cIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgRVZNIHRyYW5zYWN0aW9uIHNpZ25pbmcgcmVxdWVzdCwgZ290ICR7cmVxdWVzdC5wYXRofWApO1xuICAgIH1cbiAgICBpZiAoIXJlcXVlc3QucGF0aC5pbmNsdWRlcyh0aGlzLiNhZGRyZXNzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBzaWduaW5nIHJlcXVlc3QgZm9yICR7dGhpcy4jYWRkcmVzc30gYnV0IGdvdCAke3JlcXVlc3QucGF0aH1gKTtcbiAgICB9XG4gICAgY29uc3QgcmVjZWlwdCA9IGF3YWl0IG1mYVJlcXVlc3QucmVjZWlwdCgpO1xuICAgIGlmICghcmVjZWlwdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTUZBIHJlcXVlc3QgaXMgbm90IGFwcHJvdmVkIHlldFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmtleSgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBrZXkuc2lnbkV2bShyZXF1ZXN0LmJvZHkgYXMgRXZtU2lnblJlcXVlc3QsIHJlY2VpcHQpO1xuICAgIHJldHVybiByZXNwLmRhdGEoKS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqXG4gICAqIEBwYXJhbSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm5zIFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgI2hhbmRsZU1mYTxVPihyZXM6IEN1YmVTaWduZXJSZXNwb25zZTxVPik6IFByb21pc2U8VT4ge1xuICAgIHdoaWxlIChyZXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jb3B0aW9ucy5tZmFQb2xsSW50ZXJ2YWxNcykpO1xuXG4gICAgICBjb25zdCBtZmFJZCA9IHJlcy5tZmFJZCgpO1xuICAgICAgY29uc3QgbWZhSW5mbyA9IGF3YWl0IHRoaXMuI2NsaWVudC5vcmcoKS5nZXRNZmFSZXF1ZXN0KG1mYUlkKS5mZXRjaCgpO1xuICAgICAgdGhpcy4jb3B0aW9ucy5vbk1mYVBvbGw/LihtZmFJbmZvKTtcbiAgICAgIGlmIChtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgcmVzLmV4ZWNXaXRoTWZhQXBwcm92YWwoe1xuICAgICAgICAgIG1mYUlkLFxuICAgICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNjbGllbnQub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=