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
const index_1 = require("../index");
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
            const key = await __classPrivateFieldGet(this, _EvmSigner_client, "f").apiClient.keyGetByMaterialId(index_1.Secp256k1.Evm, __classPrivateFieldGet(this, _EvmSigner_address, "f").toLowerCase());
            __classPrivateFieldSet(this, _EvmSigner_key, new index_1.Key(__classPrivateFieldGet(this, _EvmSigner_client, "f"), key), "f");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG9DQVdrQjtBQWdCbEI7Ozs7R0FJRztBQUNILE1BQWEsU0FBUztJQWFwQixpREFBaUQ7SUFDakQsSUFBSSxPQUFPO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLDBCQUFTLENBQUM7SUFDdkIsQ0FBQztJQUVELHFDQUFxQztJQUNyQyxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUkseUJBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsbURBQW1EO0lBQ25ELElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwwQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxZQUFZLE9BQXFCLEVBQUUsTUFBd0IsRUFBRSxPQUEwQjs7UUFsQ3ZGLGlDQUFpQztRQUN4QixxQ0FBaUI7UUFFMUIsaUNBQWlDO1FBQ2pDLGlDQUFXO1FBRVgsNkJBQTZCO1FBQ3BCLG9DQUEwQjtRQUVuQyxjQUFjO1FBQ0wscUNBQTJCO1FBeUJsQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLHVCQUFBLElBQUksc0JBQVksT0FBTyxNQUFBLENBQUM7UUFDMUIsQ0FBQzthQUFNLENBQUM7WUFDTix1QkFBQSxJQUFJLHNCQUFZLE9BQU8sQ0FBQyxVQUFVLE1BQUEsQ0FBQztZQUNuQyx1QkFBQSxJQUFJLGtCQUFRLE9BQU8sTUFBQSxDQUFDO1FBQ3RCLENBQUM7UUFDRCx1QkFBQSxJQUFJLHFCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksc0JBQThCO1lBQ2hDLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUztZQUM3QixpQkFBaUIsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLElBQUksSUFBSTtTQUN0RCxNQUFBLENBQUM7SUFDSixDQUFDO0lBRUQ7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b250ZW50IjpbImltcG9ydCB7XG4gIHR5cGUgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICB0eXBlIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICB0eXBlIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICB0eXBlIEV2bVNpZ25SZXF1ZXN0LFxuICBLZXksXG4gIHR5cGUgTWZhUmVxdWVzdEluZm8sXG4gIHR5cGUgRXZtU2lnblJlc3BvbnNlLFxuICB0eXBlIEN1YmVTaWduZXJDbGllbnQsXG4gIHR5cGUgTWZhUmVxdWVzdCxcbiAgU2VjcDI1NmsxLFxufSBmcm9tIFwiLi4vaW5kZXhcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXZtU2lnbmVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICBvbk1mYVBvbGw/OiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBXG4gICAqIHVwZGF0ZXMuIERlZmF1bHQgaXMgMTAwMG1zXG4gICAqL1xuICBtZmFQb2xsSW50ZXJ2YWxNcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lciwgd2l0aCBiYXNpYyBNRkEgaGFuZGxpbmcuXG4gKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBFdm1TaWduZXIge1xuICAvKiogVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgKi9cbiAgcmVhZG9ubHkgI2FkZHJlc3M6IHN0cmluZztcblxuICAvKiogVGhlIGtleSB0byB1c2UgZm9yIHNpZ25pbmcgKi9cbiAgI2tleT86IEtleTtcblxuICAvKiogVGhlIHVuZGVybHlpbmcgc2Vzc2lvbiAqL1xuICByZWFkb25seSAjY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50O1xuXG4gIC8qKiBPcHRpb25zICovXG4gIHJlYWRvbmx5ICNvcHRpb25zOiBFdm1TaWduZXJPcHRpb25zO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUga2V5IGFkZHJlc3MgKE5PVCBjaGVja3N1bW1lZCkgKi9cbiAgZ2V0IGFkZHJlc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FkZHJlc3M7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHVuZGVybHlpbmcgY2xpZW50ICovXG4gIGdldCBjbGllbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgb3B0aW9ucyB1c2VkIGZvciB0aGlzIEV2bVNpZ25lciAqL1xuICBnZXQgb3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy4jb3B0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IFNpZ25lciBpbnN0YW5jZVxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSBjbGllbnQgVGhlIHVuZGVybHlpbmcgQ3ViZVNpZ25lckNsaWVudC5cbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXkgfCBzdHJpbmcsIGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgb3B0aW9ucz86IEV2bVNpZ25lck9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcy5tYXRlcmlhbElkO1xuICAgICAgdGhpcy4ja2V5ID0gYWRkcmVzcztcbiAgICB9XG4gICAgdGhpcy4jY2xpZW50ID0gY2xpZW50O1xuICAgIHRoaXMuI29wdGlvbnMgPSA8RXZtU2lnbmVyT3B0aW9ucz57XG4gICAgICBvbk1mYVBvbGw6IG9wdGlvbnM/Lm9uTWZhUG9sbCxcbiAgICAgIG1mYVBvbGxJbnRlcnZhbE1zOiBvcHRpb25zPy5tZmFQb2xsSW50ZXJ2YWxNcyA/PyAxMDAwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSBzaWduIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24ocmVxOiBFdm1TaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5zaWduRXZtKHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCBkb2VzIG5vdCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbCwgaS5lLixcbiAgICogdGhlIHJldHVybmVkIHtAbGluayBDdWJlU2lnbmVyUmVzcG9uc2V9IG9iamVjdCBlaXRoZXIgY29udGFpbnMgYSBzaWduYXR1cmUgb3IgaW5kaWNhdGVzXG4gICAqIHRoYXQgTUZBIGlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgQ3ViZVNpZ25lciByZW1vdGUgZW5kLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShyZXE6IEV2bVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgcmV0dXJuIGF3YWl0IGtleS5zaWduRXZtKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgRUlQLTcxMiB0eXBlZCBkYXRhLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC03MTIgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwNzEyU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIEVJUDcxMiBzaWduIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKHJlcTogRWlwNzEyU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQga2V5LnNpZ25FaXA3MTIocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwMTkxKHJlcTogRWlwMTkxU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQga2V5LnNpZ25FaXAxOTEocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBrZXkgY29ycmVzcG9uZGluZyB0byB0aGlzIGFkZHJlc3MgKi9cbiAgYXN5bmMga2V5KCk6IFByb21pc2U8S2V5PiB7XG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLiNjbGllbnQuYXBpQ2xpZW50LmtleUdldEJ5TWF0ZXJpYWxJZChcbiAgICAgICAgU2VjcDI1NmsxLkV2bSxcbiAgICAgICAgdGhpcy4jYWRkcmVzcy50b0xvd2VyQ2FzZSgpLFxuICAgICAgKTtcbiAgICAgIHRoaXMuI2tleSA9IG5ldyBLZXkodGhpcy4jY2xpZW50LCBrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4ja2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbCBleGVjdXRlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVxdWVzdCBUaGUgYXBwcm92ZWQgTUZBIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0OiBNZmFSZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0gYXdhaXQgbWZhUmVxdWVzdC5yZXF1ZXN0KCk7XG4gICAgaWYgKCFyZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHtyZXF1ZXN0LnBhdGh9YCk7XG4gICAgfVxuICAgIGlmICghcmVxdWVzdC5wYXRoLmluY2x1ZGVzKHRoaXMuI2FkZHJlc3MpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHNpZ25pbmcgcmVxdWVzdCBmb3IgJHt0aGlzLiNhZGRyZXNzfSBidXQgZ290ICR7cmVxdWVzdC5wYXRofWApO1xuICAgIH1cbiAgICBjb25zdCByZWNlaXB0ID0gYXdhaXQgbWZhUmVxdWVzdC5yZWNlaXB0KCk7XG4gICAgaWYgKCFyZWNlaXB0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNRkEgcmVxdWVzdCBpcyBub3QgYXBwcm92ZWQgeWV0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGtleS5zaWduRXZtKHJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCwgcmVjZWlwdCk7XG4gICAgcmV0dXJuIHJlc3AuZGF0YSgpLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIHNpZ24gcmVxdWVzdCByZXF1aXJlcyBNRkEsIHRoaXMgbWV0aG9kIHdhaXRzIGZvciBhcHByb3ZhbHNcbiAgICpcbiAgICogQHBhcmFtIHJlcyBUaGUgcmVzcG9uc2Ugb2YgYSBzaWduIHJlcXVlc3RcbiAgICogQHJldHVybnMgVGhlIHNpZ24gZGF0YSBhZnRlciBNRkEgYXBwcm92YWxzXG4gICAqL1xuICBhc3luYyAjaGFuZGxlTWZhPFU+KHJlczogQ3ViZVNpZ25lclJlc3BvbnNlPFU+KTogUHJvbWlzZTxVPiB7XG4gICAgbGV0IG1mYUlkID0gdW5kZWZpbmVkO1xuICAgIHdoaWxlICgobWZhSWQgPSByZXMubWZhSWQoKSkpIHtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMuI29wdGlvbnMubWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSW5mbyA9IGF3YWl0IHRoaXMuI2NsaWVudC5vcmcoKS5nZXRNZmFSZXF1ZXN0KG1mYUlkKS5mZXRjaCgpO1xuICAgICAgdGhpcy4jb3B0aW9ucy5vbk1mYVBvbGw/LihtZmFJbmZvKTtcbiAgICAgIGlmIChtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgcmVzLmV4ZWNXaXRoTWZhQXBwcm92YWwoe1xuICAgICAgICAgIG1mYUlkLFxuICAgICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNjbGllbnQub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=