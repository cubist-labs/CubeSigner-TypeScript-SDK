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
var _EvmSigner_instances, _EvmSigner_address, _EvmSigner_key, _EvmSigner_signerSession, _EvmSigner_options, _EvmSigner_handleMfa;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmSigner = void 0;
/**
 * Signer using CubeSigner, with basic MFA handling.
 * @internal
 */
class EvmSigner {
    /** Returns the key address (NOT checksummed) */
    get address() {
        return __classPrivateFieldGet(this, _EvmSigner_address, "f");
    }
    /** Returns the underlying signer session */
    get signerSession() {
        return __classPrivateFieldGet(this, _EvmSigner_signerSession, "f");
    }
    /** Options */
    get options() {
        return __classPrivateFieldGet(this, _EvmSigner_options, "f");
    }
    /**
     * Create new Signer instance
     * @param {KeyInfo | string} address The key or the eth address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {EvmSignerOptions} options The options to use for the Signer instance
     */
    constructor(address, signerSession, options) {
        _EvmSigner_instances.add(this);
        /** The address of the account */
        _EvmSigner_address.set(this, void 0);
        /** The key to use for signing */
        _EvmSigner_key.set(this, void 0);
        /** The underlying session */
        _EvmSigner_signerSession.set(this, void 0);
        /** Options */
        _EvmSigner_options.set(this, void 0);
        if (typeof address === "string") {
            __classPrivateFieldSet(this, _EvmSigner_address, address, "f");
        }
        else {
            __classPrivateFieldSet(this, _EvmSigner_address, address.materialId, "f");
            __classPrivateFieldSet(this, _EvmSigner_key, address, "f");
        }
        __classPrivateFieldSet(this, _EvmSigner_signerSession, signerSession, "f");
        __classPrivateFieldSet(this, _EvmSigner_options, {
            onMfaPoll: options?.onMfaPoll,
            mfaPollIntervalMs: options?.mfaPollIntervalMs ?? 1000,
        }, "f");
    }
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     * @param {EvmSignRequest} req The sign request.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
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
     * @param {EvmSignRequest} req The transaction to sign.
     * @return {CubeSignerResponse<EvmSignResponse>} The response from the CubeSigner remote end.
     */
    async signEvm(req) {
        return await __classPrivateFieldGet(this, _EvmSigner_signerSession, "f").signEvm(__classPrivateFieldGet(this, _EvmSigner_address, "f"), req);
    }
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     * @param {Eip712SignRequest} req The EIP712 sign request.
     * @return {Promise<string>} The signature.
     */
    async signEip712(req) {
        const res = await __classPrivateFieldGet(this, _EvmSigner_signerSession, "f").signEip712(__classPrivateFieldGet(this, _EvmSigner_address, "f"), req);
        const data = await __classPrivateFieldGet(this, _EvmSigner_instances, "m", _EvmSigner_handleMfa).call(this, res);
        return data.signature;
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {Eip191SignRequest} req The request to sign.
     * @return {Promise<string>} The signature.
     */
    async signEip191(req) {
        const res = await __classPrivateFieldGet(this, _EvmSigner_signerSession, "f").signEip191(__classPrivateFieldGet(this, _EvmSigner_address, "f"), req);
        const data = await __classPrivateFieldGet(this, _EvmSigner_instances, "m", _EvmSigner_handleMfa).call(this, res);
        return data.signature;
    }
    /** @return {KeyInfo} The key corresponding to this address */
    async key() {
        if (__classPrivateFieldGet(this, _EvmSigner_key, "f") === undefined) {
            const key = (await __classPrivateFieldGet(this, _EvmSigner_signerSession, "f").keys()).find((k) => k.material_id === __classPrivateFieldGet(this, _EvmSigner_address, "f"));
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
     * @param {MfaRequestInfo} mfaInfo The approved MFA request.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransactionMfaApproved(mfaInfo) {
        if (!mfaInfo.request.path.includes("/eth1/sign/")) {
            throw new Error(`Expected EVM transaction signing request, got ${mfaInfo.request.path}`);
        }
        if (!mfaInfo.request.path.includes(__classPrivateFieldGet(this, _EvmSigner_address, "f"))) {
            throw new Error(`Expected signing request for ${__classPrivateFieldGet(this, _EvmSigner_address, "f")} but got ${mfaInfo.request.path}`);
        }
        if (!mfaInfo.receipt) {
            throw new Error("MFA request is not approved yet");
        }
        const resp = await __classPrivateFieldGet(this, _EvmSigner_signerSession, "f").signEvm(__classPrivateFieldGet(this, _EvmSigner_address, "f"), mfaInfo.request.body, {
            mfaId: mfaInfo.id,
            mfaOrgId: __classPrivateFieldGet(this, _EvmSigner_signerSession, "f").orgId,
            mfaConf: mfaInfo.receipt.confirmation,
        });
        return resp.data().rlp_signed_tx;
    }
}
exports.EvmSigner = EvmSigner;
_EvmSigner_address = new WeakMap(), _EvmSigner_key = new WeakMap(), _EvmSigner_signerSession = new WeakMap(), _EvmSigner_options = new WeakMap(), _EvmSigner_instances = new WeakSet(), _EvmSigner_handleMfa = 
/**
 * If the sign request requires MFA, this method waits for approvals
 * @param {CubeSignerResponse<U>} res The response of a sign request
 * @return {Promise<U>} The sign data after MFA approvals
 */
async function _EvmSigner_handleMfa(res) {
    while (res.requiresMfa()) {
        await new Promise((resolve) => setTimeout(resolve, __classPrivateFieldGet(this, _EvmSigner_options, "f").mfaPollIntervalMs));
        const mfaId = res.mfaId();
        const mfaInfo = await __classPrivateFieldGet(this, _EvmSigner_signerSession, "f").getMfaInfo(mfaId);
        __classPrivateFieldGet(this, _EvmSigner_options, "f").onMfaPoll?.(mfaInfo);
        if (mfaInfo.receipt) {
            res = await res.signWithMfaApproval({
                mfaId,
                mfaOrgId: __classPrivateFieldGet(this, _EvmSigner_signerSession, "f").orgId,
                mfaConf: mfaInfo.receipt.confirmation,
            });
        }
    }
    return res.data();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQXlCQTs7O0dBR0c7QUFDSCxNQUFhLFNBQVM7SUFhcEIsZ0RBQWdEO0lBQ2hELElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwwQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCw0Q0FBNEM7SUFDNUMsSUFBSSxhQUFhO1FBQ2YsT0FBTyx1QkFBQSxJQUFJLGdDQUFlLENBQUM7SUFDN0IsQ0FBQztJQUVELGNBQWM7SUFDZCxJQUFJLE9BQU87UUFDVCxPQUFPLHVCQUFBLElBQUksMEJBQVMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLE9BQXlCLEVBQUUsYUFBNEIsRUFBRSxPQUEwQjs7UUFqQy9GLGlDQUFpQztRQUN4QixxQ0FBaUI7UUFFMUIsaUNBQWlDO1FBQ2pDLGlDQUFlO1FBRWYsNkJBQTZCO1FBQ3BCLDJDQUE4QjtRQUV2QyxjQUFjO1FBQ0wscUNBQTJCO1FBd0JsQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLHVCQUFBLElBQUksc0JBQVksT0FBTyxNQUFBLENBQUM7UUFDMUIsQ0FBQzthQUFNLENBQUM7WUFDTix1QkFBQSxJQUFJLHNCQUFZLE9BQU8sQ0FBQyxVQUFVLE1BQUEsQ0FBQztZQUNuQyx1QkFBQSxJQUFJLGtCQUFRLE9BQU8sTUFBQSxDQUFDO1FBQ3RCLENBQUM7UUFDRCx1QkFBQSxJQUFJLDRCQUFrQixhQUFhLE1BQUEsQ0FBQztRQUNwQyx1QkFBQSxJQUFJLHNCQUE4QjtZQUNoQyxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVM7WUFDN0IsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixJQUFJLElBQUk7U0FDdEQsTUFBQSxDQUFDO0lBQ0osQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxL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QUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNwQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBLZXlJbmZvLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgU2lnbmVyU2Vzc2lvbixcbiAgRXZtU2lnblJlc3BvbnNlLFxufSBmcm9tIFwiLi4vaW5kZXhcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXZtU2lnbmVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICBvbk1mYVBvbGw/OiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBXG4gICAqIHVwZGF0ZXMuIERlZmF1bHQgaXMgMTAwMG1zXG4gICAqL1xuICBtZmFQb2xsSW50ZXJ2YWxNcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lciwgd2l0aCBiYXNpYyBNRkEgaGFuZGxpbmcuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGNsYXNzIEV2bVNpZ25lciB7XG4gIC8qKiBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCAqL1xuICByZWFkb25seSAjYWRkcmVzczogc3RyaW5nO1xuXG4gIC8qKiBUaGUga2V5IHRvIHVzZSBmb3Igc2lnbmluZyAqL1xuICAja2V5PzogS2V5SW5mbztcblxuICAvKiogVGhlIHVuZGVybHlpbmcgc2Vzc2lvbiAqL1xuICByZWFkb25seSAjc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbjtcblxuICAvKiogT3B0aW9ucyAqL1xuICByZWFkb25seSAjb3B0aW9uczogRXZtU2lnbmVyT3B0aW9ucztcblxuICAvKiogUmV0dXJucyB0aGUga2V5IGFkZHJlc3MgKE5PVCBjaGVja3N1bW1lZCkgKi9cbiAgZ2V0IGFkZHJlc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FkZHJlc3M7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgdW5kZXJseWluZyBzaWduZXIgc2Vzc2lvbiAqL1xuICBnZXQgc2lnbmVyU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jc2lnbmVyU2Vzc2lvbjtcbiAgfVxuXG4gIC8qKiBPcHRpb25zICovXG4gIGdldCBvcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLiNvcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7S2V5SW5mbyB8IHN0cmluZ30gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc2lnbmVyU2Vzc2lvbiBUaGUgdW5kZXJseWluZyBTaWduZXIgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtFdm1TaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5SW5mbyB8IHN0cmluZywgc2lnbmVyU2Vzc2lvbjogU2lnbmVyU2Vzc2lvbiwgb3B0aW9ucz86IEV2bVNpZ25lck9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcy5tYXRlcmlhbElkO1xuICAgICAgdGhpcy4ja2V5ID0gYWRkcmVzcztcbiAgICB9XG4gICAgdGhpcy4jc2lnbmVyU2Vzc2lvbiA9IHNpZ25lclNlc3Npb247XG4gICAgdGhpcy4jb3B0aW9ucyA9IDxFdm1TaWduZXJPcHRpb25zPntcbiAgICAgIG9uTWZhUG9sbDogb3B0aW9ucz8ub25NZmFQb2xsLFxuICAgICAgbWZhUG9sbEludGVydmFsTXM6IG9wdGlvbnM/Lm1mYVBvbGxJbnRlcnZhbE1zID8/IDEwMDAsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24uIFRoaXMgbWV0aG9kIHdpbGwgYmxvY2sgaWYgdGhlIGtleSByZXF1aXJlcyBNRkEgYXBwcm92YWwuXG4gICAqIEBwYXJhbSB7RXZtU2lnblJlcXVlc3R9IHJlcSBUaGUgc2lnbiByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24ocmVxOiBFdm1TaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5zaWduRXZtKHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCBkb2VzIG5vdCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbCwgaS5lLixcbiAgICogdGhlIHJldHVybmVkIHtAbGluayBDdWJlU2lnbmVyUmVzcG9uc2V9IG9iamVjdCBlaXRoZXIgY29udGFpbnMgYSBzaWduYXR1cmUgb3IgaW5kaWNhdGVzXG4gICAqIHRoYXQgTUZBIGlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0ge0V2bVNpZ25SZXF1ZXN0fSByZXEgVGhlIHRyYW5zYWN0aW9uIHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgQ3ViZVNpZ25lciByZW1vdGUgZW5kLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShyZXE6IEV2bVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLnNpZ25Fdm0odGhpcy4jYWRkcmVzcywgcmVxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtFaXA3MTJTaWduUmVxdWVzdH0gcmVxIFRoZSBFSVA3MTIgc2lnbiByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKHJlcTogRWlwNzEyU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkVpcDcxMih0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5zaWduYXR1cmU7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC0xOTEgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwMTkxU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7RWlwMTkxU2lnblJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwMTkxKHJlcTogRWlwMTkxU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkVpcDE5MSh0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5zaWduYXR1cmU7XG4gIH1cblxuICAvKiogQHJldHVybiB7S2V5SW5mb30gVGhlIGtleSBjb3JyZXNwb25kaW5nIHRvIHRoaXMgYWRkcmVzcyAqL1xuICBhc3luYyBrZXkoKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5rZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxfaWQgPT09IHRoaXMuI2FkZHJlc3MpO1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGFjY2VzcyBrZXkgJyR7dGhpcy4jYWRkcmVzc30nYCk7XG4gICAgICB9XG4gICAgICB0aGlzLiNrZXkgPSBrZXk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNrZXk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uIGZyb20gYW4gYXBwcm92ZWQgTUZBIHJlcXVlc3QuIFRoZSBNRkEgcmVxdWVzdCBjb250YWluc1xuICAgKiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYXBwcm92ZWQgc2lnbmluZyByZXF1ZXN0LCB3aGljaCB0aGlzIG1ldGhvZCB3aWxsIGV4ZWN1dGUuXG4gICAqIEBwYXJhbSB7TWZhUmVxdWVzdEluZm99IG1mYUluZm8gVGhlIGFwcHJvdmVkIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFJbmZvOiBNZmFSZXF1ZXN0SW5mbyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCFtZmFJbmZvLnJlcXVlc3QucGF0aC5pbmNsdWRlcyhcIi9ldGgxL3NpZ24vXCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIEVWTSB0cmFuc2FjdGlvbiBzaWduaW5nIHJlcXVlc3QsIGdvdCAke21mYUluZm8ucmVxdWVzdC5wYXRofWApO1xuICAgIH1cbiAgICBpZiAoIW1mYUluZm8ucmVxdWVzdC5wYXRoLmluY2x1ZGVzKHRoaXMuI2FkZHJlc3MpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFeHBlY3RlZCBzaWduaW5nIHJlcXVlc3QgZm9yICR7dGhpcy4jYWRkcmVzc30gYnV0IGdvdCAke21mYUluZm8ucmVxdWVzdC5wYXRofWAsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIW1mYUluZm8ucmVjZWlwdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTUZBIHJlcXVlc3QgaXMgbm90IGFwcHJvdmVkIHlldFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRXZtKFxuICAgICAgdGhpcy4jYWRkcmVzcyxcbiAgICAgIG1mYUluZm8ucmVxdWVzdC5ib2R5IGFzIEV2bVNpZ25SZXF1ZXN0LFxuICAgICAge1xuICAgICAgICBtZmFJZDogbWZhSW5mby5pZCxcbiAgICAgICAgbWZhT3JnSWQ6IHRoaXMuI3NpZ25lclNlc3Npb24ub3JnSWQsXG4gICAgICAgIG1mYUNvbmY6IG1mYUluZm8ucmVjZWlwdCEuY29uZmlybWF0aW9uLFxuICAgICAgfSxcbiAgICApO1xuICAgIHJldHVybiByZXNwLmRhdGEoKS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgI2hhbmRsZU1mYTxVPihyZXM6IEN1YmVTaWduZXJSZXNwb25zZTxVPik6IFByb21pc2U8VT4ge1xuICAgIHdoaWxlIChyZXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jb3B0aW9ucy5tZmFQb2xsSW50ZXJ2YWxNcykpO1xuXG4gICAgICBjb25zdCBtZmFJZCA9IHJlcy5tZmFJZCgpO1xuICAgICAgY29uc3QgbWZhSW5mbyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uZ2V0TWZhSW5mbyhtZmFJZCk7XG4gICAgICB0aGlzLiNvcHRpb25zLm9uTWZhUG9sbD8uKG1mYUluZm8pO1xuICAgICAgaWYgKG1mYUluZm8ucmVjZWlwdCkge1xuICAgICAgICByZXMgPSBhd2FpdCByZXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7XG4gICAgICAgICAgbWZhSWQsXG4gICAgICAgICAgbWZhT3JnSWQ6IHRoaXMuI3NpZ25lclNlc3Npb24ub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=