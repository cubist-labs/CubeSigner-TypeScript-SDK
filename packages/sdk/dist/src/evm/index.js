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
var _EvmSigner_address, _EvmSigner_key, _EvmSigner_client, _EvmSigner_options;
import { Key, Secp256k1, } from "../index.js";
/**
 * Signer using CubeSigner, with basic MFA handling.
 *
 * @internal
 */
export class EvmSigner {
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
        const data = await this.handleMfa(res);
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
        const data = await this.handleMfa(res);
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
        const data = await this.handleMfa(res);
        return data.signature;
    }
    /** @returns The key corresponding to this address */
    async key() {
        if (__classPrivateFieldGet(this, _EvmSigner_key, "f") === undefined) {
            const key = await __classPrivateFieldGet(this, _EvmSigner_client, "f").apiClient.keyGetByMaterialId(Secp256k1.Evm, __classPrivateFieldGet(this, _EvmSigner_address, "f").toLowerCase());
            __classPrivateFieldSet(this, _EvmSigner_key, new Key(__classPrivateFieldGet(this, _EvmSigner_client, "f"), key), "f");
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
    /**
     * If the sign request requires MFA, this method waits for approvals
     *
     * @param res The response of a sign request
     * @returns The sign data after MFA approvals
     */
    async handleMfa(res) {
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
    }
}
_EvmSigner_address = new WeakMap(), _EvmSigner_key = new WeakMap(), _EvmSigner_client = new WeakMap(), _EvmSigner_options = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLE9BQU8sRUFLTCxHQUFHLEVBS0gsU0FBUyxHQUNWLE1BQU0sYUFBYSxDQUFDO0FBZ0JyQjs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLFNBQVM7SUFhcEIsaURBQWlEO0lBQ2pELElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwwQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxxQ0FBcUM7SUFDckMsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLHlCQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELG1EQUFtRDtJQUNuRCxJQUFJLE9BQU87UUFDVCxPQUFPLHVCQUFBLElBQUksMEJBQVMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsWUFBWSxPQUFxQixFQUFFLE1BQXdCLEVBQUUsT0FBMEI7UUFsQ3ZGLGlDQUFpQztRQUN4QixxQ0FBaUI7UUFFMUIsaUNBQWlDO1FBQ2pDLGlDQUFXO1FBRVgsNkJBQTZCO1FBQ3BCLG9DQUEwQjtRQUVuQyxjQUFjO1FBQ0wscUNBQTJCO1FBeUJsQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLHVCQUFBLElBQUksc0JBQVksT0FBTyxNQUFBLENBQUM7UUFDMUIsQ0FBQzthQUFNLENBQUM7WUFDTix1QkFBQSxJQUFJLHNCQUFZLE9BQU8sQ0FBQyxVQUFVLE1BQUEsQ0FBQztZQUNuQyx1QkFBQSxJQUFJLGtCQUFRLE9BQU8sTUFBQSxDQUFDO1FBQ3RCLENBQUM7UUFDRCx1QkFBQSxJQUFJLHFCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksc0JBQThCO1lBQ2hDLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUztZQUM3QixpQkFBaUIsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLElB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ZW50IjpbImltcG9ydCB7XG4gIHR5cGUgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICB0eXBlIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICB0eXBlIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICB0eXBlIEV2bVNpZ25SZXF1ZXN0LFxuICBLZXksXG4gIHR5cGUgTWZhUmVxdWVzdEluZm8sXG4gIHR5cGUgRXZtU2lnblJlc3BvbnNlLFxuICB0eXBlIEN1YmVTaWduZXJDbGllbnQsXG4gIHR5cGUgTWZhUmVxdWVzdCxcbiAgU2VjcDI1NmsxLFxufSBmcm9tIFwiLi4vaW5kZXgudHNcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXZtU2lnbmVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICBvbk1mYVBvbGw/OiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBXG4gICAqIHVwZGF0ZXMuIERlZmF1bHQgaXMgMTAwMG1zXG4gICAqL1xuICBtZmFQb2xsSW50ZXJ2YWxNcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lciwgd2l0aCBiYXNpYyBNRkEgaGFuZGxpbmcuXG4gKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBFdm1TaWduZXIge1xuICAvKiogVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgKi9cbiAgcmVhZG9ubHkgI2FkZHJlc3M6IHN0cmluZztcblxuICAvKiogVGhlIGtleSB0byB1c2UgZm9yIHNpZ25pbmcgKi9cbiAgI2tleT86IEtleTtcblxuICAvKiogVGhlIHVuZGVybHlpbmcgc2Vzc2lvbiAqL1xuICByZWFkb25seSAjY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50O1xuXG4gIC8qKiBPcHRpb25zICovXG4gIHJlYWRvbmx5ICNvcHRpb25zOiBFdm1TaWduZXJPcHRpb25zO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUga2V5IGFkZHJlc3MgKE5PVCBjaGVja3N1bW1lZCkgKi9cbiAgZ2V0IGFkZHJlc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FkZHJlc3M7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHVuZGVybHlpbmcgY2xpZW50ICovXG4gIGdldCBjbGllbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgb3B0aW9ucyB1c2VkIGZvciB0aGlzIEV2bVNpZ25lciAqL1xuICBnZXQgb3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy4jb3B0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IFNpZ25lciBpbnN0YW5jZVxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSBjbGllbnQgVGhlIHVuZGVybHlpbmcgQ3ViZVNpZ25lckNsaWVudC5cbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXkgfCBzdHJpbmcsIGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgb3B0aW9ucz86IEV2bVNpZ25lck9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcy5tYXRlcmlhbElkO1xuICAgICAgdGhpcy4ja2V5ID0gYWRkcmVzcztcbiAgICB9XG4gICAgdGhpcy4jY2xpZW50ID0gY2xpZW50O1xuICAgIHRoaXMuI29wdGlvbnMgPSA8RXZtU2lnbmVyT3B0aW9ucz57XG4gICAgICBvbk1mYVBvbGw6IG9wdGlvbnM/Lm9uTWZhUG9sbCxcbiAgICAgIG1mYVBvbGxJbnRlcnZhbE1zOiBvcHRpb25zPy5tZmFQb2xsSW50ZXJ2YWxNcyA/PyAxMDAwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSBzaWduIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24ocmVxOiBFdm1TaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5zaWduRXZtKHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEucmxwX3NpZ25lZF90eDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24uIFRoaXMgbWV0aG9kIGRvZXMgbm90IGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLCBpLmUuLFxuICAgKiB0aGUgcmV0dXJuZWQge0BsaW5rIEN1YmVTaWduZXJSZXNwb25zZX0gb2JqZWN0IGVpdGhlciBjb250YWlucyBhIHNpZ25hdHVyZSBvciBpbmRpY2F0ZXNcbiAgICogdGhhdCBNRkEgaXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHRyYW5zYWN0aW9uIHRvIHNpZ24uXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZSBmcm9tIHRoZSBDdWJlU2lnbmVyIHJlbW90ZSBlbmQuXG4gICAqL1xuICBhc3luYyBzaWduRXZtKHJlcTogRXZtU2lnblJlcXVlc3QpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICByZXR1cm4gYXdhaXQga2V5LnNpZ25Fdm0ocmVxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgRUlQNzEyIHNpZ24gcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXA3MTIocmVxOiBFaXA3MTJTaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBrZXkuc2lnbkVpcDcxMihyZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmhhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnNpZ25hdHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBhcmJpdHJhcnkgbWVzc2FnZXMuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTE5MSBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXAxOTFTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDE5MShyZXE6IEVpcDE5MVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmtleSgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGtleS5zaWduRWlwMTkxKHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBrZXkgY29ycmVzcG9uZGluZyB0byB0aGlzIGFkZHJlc3MgKi9cbiAgYXN5bmMga2V5KCk6IFByb21pc2U8S2V5PiB7XG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLiNjbGllbnQuYXBpQ2xpZW50LmtleUdldEJ5TWF0ZXJpYWxJZChcbiAgICAgICAgU2VjcDI1NmsxLkV2bSxcbiAgICAgICAgdGhpcy4jYWRkcmVzcy50b0xvd2VyQ2FzZSgpLFxuICAgICAgKTtcbiAgICAgIHRoaXMuI2tleSA9IG5ldyBLZXkodGhpcy4jY2xpZW50LCBrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4ja2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbCBleGVjdXRlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVxdWVzdCBUaGUgYXBwcm92ZWQgTUZBIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0OiBNZmFSZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0gYXdhaXQgbWZhUmVxdWVzdC5yZXF1ZXN0KCk7XG4gICAgaWYgKCFyZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHtyZXF1ZXN0LnBhdGh9YCk7XG4gICAgfVxuICAgIGlmICghcmVxdWVzdC5wYXRoLmluY2x1ZGVzKHRoaXMuI2FkZHJlc3MpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHNpZ25pbmcgcmVxdWVzdCBmb3IgJHt0aGlzLiNhZGRyZXNzfSBidXQgZ290ICR7cmVxdWVzdC5wYXRofWApO1xuICAgIH1cbiAgICBjb25zdCByZWNlaXB0ID0gYXdhaXQgbWZhUmVxdWVzdC5yZWNlaXB0KCk7XG4gICAgaWYgKCFyZWNlaXB0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNRkEgcmVxdWVzdCBpcyBub3QgYXBwcm92ZWQgeWV0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGtleS5zaWduRXZtKHJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCwgcmVjZWlwdCk7XG4gICAgcmV0dXJuIHJlc3AuZGF0YSgpLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIHNpZ24gcmVxdWVzdCByZXF1aXJlcyBNRkEsIHRoaXMgbWV0aG9kIHdhaXRzIGZvciBhcHByb3ZhbHNcbiAgICpcbiAgICogQHBhcmFtIHJlcyBUaGUgcmVzcG9uc2Ugb2YgYSBzaWduIHJlcXVlc3RcbiAgICogQHJldHVybnMgVGhlIHNpZ24gZGF0YSBhZnRlciBNRkEgYXBwcm92YWxzXG4gICAqL1xuICBhc3luYyBoYW5kbGVNZmE8VT4ocmVzOiBDdWJlU2lnbmVyUmVzcG9uc2U8VT4pOiBQcm9taXNlPFU+IHtcbiAgICBsZXQgbWZhSWQgPSB1bmRlZmluZWQ7XG4gICAgd2hpbGUgKChtZmFJZCA9IHJlcy5tZmFJZCgpKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jb3B0aW9ucy5tZmFQb2xsSW50ZXJ2YWxNcykpO1xuXG4gICAgICBjb25zdCBtZmFJbmZvID0gYXdhaXQgdGhpcy4jY2xpZW50Lm9yZygpLmdldE1mYVJlcXVlc3QobWZhSWQpLmZldGNoKCk7XG4gICAgICB0aGlzLiNvcHRpb25zLm9uTWZhUG9sbD8uKG1mYUluZm8pO1xuICAgICAgaWYgKG1mYUluZm8ucmVjZWlwdCkge1xuICAgICAgICByZXMgPSBhd2FpdCByZXMuZXhlY1dpdGhNZmFBcHByb3ZhbCh7XG4gICAgICAgICAgbWZhSWQsXG4gICAgICAgICAgbWZhT3JnSWQ6IHRoaXMuI2NsaWVudC5vcmdJZCxcbiAgICAgICAgICBtZmFDb25mOiBtZmFJbmZvLnJlY2VpcHQuY29uZmlybWF0aW9uLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcy5kYXRhKCk7XG4gIH1cbn1cbiJdfQ==