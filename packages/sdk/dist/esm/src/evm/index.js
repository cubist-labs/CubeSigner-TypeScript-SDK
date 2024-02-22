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
/**
 * Signer using CubeSigner, with basic MFA handling.
 * @internal
 */
export class EvmSigner {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQXlCQTs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sU0FBUztJQWFwQixnREFBZ0Q7SUFDaEQsSUFBSSxPQUFPO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLDBCQUFTLENBQUM7SUFDdkIsQ0FBQztJQUVELDRDQUE0QztJQUM1QyxJQUFJLGFBQWE7UUFDZixPQUFPLHVCQUFBLElBQUksZ0NBQWUsQ0FBQztJQUM3QixDQUFDO0lBRUQsY0FBYztJQUNkLElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwwQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksT0FBeUIsRUFBRSxhQUE0QixFQUFFLE9BQTBCOztRQWpDL0YsaUNBQWlDO1FBQ3hCLHFDQUFpQjtRQUUxQixpQ0FBaUM7UUFDakMsaUNBQWU7UUFFZiw2QkFBNkI7UUFDcEIsMkNBQThCO1FBRXZDLGNBQWM7UUFDTCxxQ0FBMkI7UUF3QmxDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxzQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksc0JBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksa0JBQVEsT0FBTyxNQUFBLENBQUM7UUFDdEIsQ0FBQztRQUNELHVCQUFBLElBQUksNEJBQWtCLGFBQWEsTUFBQSxDQUFDO1FBQ3BDLHVCQUFBLElBQUksc0JBQThCO1lBQ2hDLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUztZQUM3QixpQkFBaUIsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLElBQUksSUFBSTtTQUN0RCxNQUFBLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNI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SSxFQUFFLENBQUM7QUFDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEN1YmVTaWduZXJSZXNwb25zZSxcbiAgS2V5SW5mbyxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVxdWVzdCxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIFNpZ25lclNlc3Npb24sXG4gIEV2bVNpZ25SZXNwb25zZSxcbn0gZnJvbSBcIi4uL2luZGV4XCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIEV2bVNpZ25lck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgb25NZmFQb2xsPzogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiB0aW1lIChpbiBtaWxsaXNlY29uZHMpIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIE1GQVxuICAgKiB1cGRhdGVzLiBEZWZhdWx0IGlzIDEwMDBtc1xuICAgKi9cbiAgbWZhUG9sbEludGVydmFsTXM/OiBudW1iZXI7XG59XG5cbi8qKlxuICogU2lnbmVyIHVzaW5nIEN1YmVTaWduZXIsIHdpdGggYmFzaWMgTUZBIGhhbmRsaW5nLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBFdm1TaWduZXIge1xuICAvKiogVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgKi9cbiAgcmVhZG9ubHkgI2FkZHJlc3M6IHN0cmluZztcblxuICAvKiogVGhlIGtleSB0byB1c2UgZm9yIHNpZ25pbmcgKi9cbiAgI2tleT86IEtleUluZm87XG5cbiAgLyoqIFRoZSB1bmRlcmx5aW5nIHNlc3Npb24gKi9cbiAgcmVhZG9ubHkgI3NpZ25lclNlc3Npb246IFNpZ25lclNlc3Npb247XG5cbiAgLyoqIE9wdGlvbnMgKi9cbiAgcmVhZG9ubHkgI29wdGlvbnM6IEV2bVNpZ25lck9wdGlvbnM7XG5cbiAgLyoqIFJldHVybnMgdGhlIGtleSBhZGRyZXNzIChOT1QgY2hlY2tzdW1tZWQpICovXG4gIGdldCBhZGRyZXNzKCkge1xuICAgIHJldHVybiB0aGlzLiNhZGRyZXNzO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHVuZGVybHlpbmcgc2lnbmVyIHNlc3Npb24gKi9cbiAgZ2V0IHNpZ25lclNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI3NpZ25lclNlc3Npb247XG4gIH1cblxuICAvKiogT3B0aW9ucyAqL1xuICBnZXQgb3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy4jb3B0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IFNpZ25lciBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0tleUluZm8gfCBzdHJpbmd9IGFkZHJlc3MgVGhlIGtleSBvciB0aGUgZXRoIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb259IHNpZ25lclNlc3Npb24gVGhlIHVuZGVybHlpbmcgU2lnbmVyIHNlc3Npb24uXG4gICAqIEBwYXJhbSB7RXZtU2lnbmVyT3B0aW9uc30gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byB1c2UgZm9yIHRoZSBTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFkZHJlc3M6IEtleUluZm8gfCBzdHJpbmcsIHNpZ25lclNlc3Npb246IFNpZ25lclNlc3Npb24sIG9wdGlvbnM/OiBFdm1TaWduZXJPcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3MubWF0ZXJpYWxJZDtcbiAgICAgIHRoaXMuI2tleSA9IGFkZHJlc3M7XG4gICAgfVxuICAgIHRoaXMuI3NpZ25lclNlc3Npb24gPSBzaWduZXJTZXNzaW9uO1xuICAgIHRoaXMuI29wdGlvbnMgPSA8RXZtU2lnbmVyT3B0aW9ucz57XG4gICAgICBvbk1mYVBvbGw6IG9wdGlvbnM/Lm9uTWZhUG9sbCxcbiAgICAgIG1mYVBvbGxJbnRlcnZhbE1zOiBvcHRpb25zPy5tZmFQb2xsSW50ZXJ2YWxNcyA/PyAxMDAwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge0V2bVNpZ25SZXF1ZXN0fSByZXEgVGhlIHNpZ24gcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uKHJlcTogRXZtU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuc2lnbkV2bShyZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2QgZG9lcyBub3QgYmxvY2sgaWYgdGhlIGtleSByZXF1aXJlcyBNRkEgYXBwcm92YWwsIGkuZS4sXG4gICAqIHRoZSByZXR1cm5lZCB7QGxpbmsgQ3ViZVNpZ25lclJlc3BvbnNlfSBvYmplY3QgZWl0aGVyIGNvbnRhaW5zIGEgc2lnbmF0dXJlIG9yIGluZGljYXRlc1xuICAgKiB0aGF0IE1GQSBpcyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIHtFdm1TaWduUmVxdWVzdH0gcmVxIFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlIGZyb20gdGhlIEN1YmVTaWduZXIgcmVtb3RlIGVuZC5cbiAgICovXG4gIGFzeW5jIHNpZ25Fdm0ocmVxOiBFdm1TaWduUmVxdWVzdCk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRXZtKHRoaXMuI2FkZHJlc3MsIHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgRUlQLTcxMiB0eXBlZCBkYXRhLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC03MTIgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwNzEyU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7RWlwNzEyU2lnblJlcXVlc3R9IHJlcSBUaGUgRUlQNzEyIHNpZ24gcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDcxMihyZXE6IEVpcDcxMlNpZ25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLnNpZ25FaXA3MTIodGhpcy4jYWRkcmVzcywgcmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge0VpcDE5MVNpZ25SZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDE5MShyZXE6IEVpcDE5MVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLnNpZ25FaXAxOTEodGhpcy4jYWRkcmVzcywgcmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge0tleUluZm99IFRoZSBrZXkgY29ycmVzcG9uZGluZyB0byB0aGlzIGFkZHJlc3MgKi9cbiAgYXN5bmMga2V5KCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGlmICh0aGlzLiNrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qga2V5ID0gKGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24ua2V5cygpKS5maW5kKChrKSA9PiBrLm1hdGVyaWFsX2lkID09PSB0aGlzLiNhZGRyZXNzKTtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBhY2Nlc3Mga2V5ICcke3RoaXMuI2FkZHJlc3N9J2ApO1xuICAgICAgfVxuICAgICAgdGhpcy4ja2V5ID0ga2V5O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4ja2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbCBleGVjdXRlLlxuICAgKiBAcGFyYW0ge01mYVJlcXVlc3RJbmZvfSBtZmFJbmZvIFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uTWZhQXBwcm92ZWQobWZhSW5mbzogTWZhUmVxdWVzdEluZm8pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghbWZhSW5mby5yZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gKTtcbiAgICB9XG4gICAgaWYgKCFtZmFJbmZvLnJlcXVlc3QucGF0aC5pbmNsdWRlcyh0aGlzLiNhZGRyZXNzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRXhwZWN0ZWQgc2lnbmluZyByZXF1ZXN0IGZvciAke3RoaXMuI2FkZHJlc3N9IGJ1dCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKCFtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1GQSByZXF1ZXN0IGlzIG5vdCBhcHByb3ZlZCB5ZXRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bShcbiAgICAgIHRoaXMuI2FkZHJlc3MsXG4gICAgICBtZmFJbmZvLnJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCxcbiAgICAgIHtcbiAgICAgICAgbWZhSWQ6IG1mYUluZm8uaWQsXG4gICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNzaWduZXJTZXNzaW9uLm9yZ0lkLFxuICAgICAgICBtZmFDb25mOiBtZmFJbmZvLnJlY2VpcHQhLmNvbmZpcm1hdGlvbixcbiAgICAgIH0sXG4gICAgKTtcbiAgICByZXR1cm4gcmVzcC5kYXRhKCkucmxwX3NpZ25lZF90eDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgc2lnbiByZXF1ZXN0IHJlcXVpcmVzIE1GQSwgdGhpcyBtZXRob2Qgd2FpdHMgZm9yIGFwcHJvdmFsc1xuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gcmVzIFRoZSByZXNwb25zZSBvZiBhIHNpZ24gcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFU+fSBUaGUgc2lnbiBkYXRhIGFmdGVyIE1GQSBhcHByb3ZhbHNcbiAgICovXG4gIGFzeW5jICNoYW5kbGVNZmE8VT4ocmVzOiBDdWJlU2lnbmVyUmVzcG9uc2U8VT4pOiBQcm9taXNlPFU+IHtcbiAgICB3aGlsZSAocmVzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMuI29wdGlvbnMubWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSWQgPSByZXMubWZhSWQoKTtcbiAgICAgIGNvbnN0IG1mYUluZm8gPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLmdldE1mYUluZm8obWZhSWQpO1xuICAgICAgdGhpcy4jb3B0aW9ucy5vbk1mYVBvbGw/LihtZmFJbmZvKTtcbiAgICAgIGlmIChtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgcmVzLnNpZ25XaXRoTWZhQXBwcm92YWwoe1xuICAgICAgICAgIG1mYUlkLFxuICAgICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNzaWduZXJTZXNzaW9uLm9yZ0lkLFxuICAgICAgICAgIG1mYUNvbmY6IG1mYUluZm8ucmVjZWlwdC5jb25maXJtYXRpb24sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzLmRhdGEoKTtcbiAgfVxufVxuIl19