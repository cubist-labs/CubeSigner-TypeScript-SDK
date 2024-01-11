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
var _CubeSignerResponse_requestFn, _CubeSignerResponse_resp, _CubeSignerResponse_mfaRequired;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubeSignerResponse = exports.mapResponse = void 0;
/**
 * Take a {@link Response<U>} and a {@link MapFn<U, V>} function and return
 * a {@link Response<V>} that maps the value of the original response when its status code is 200.
 *
 * @param {Response<U>} resp Original response
 * @param {Map<U, V>} mapFn Map to apply to the response value when its status code is 200.
 * @return {Response<V>} Response whose value for status code 200 is mapped from U to V
 */
function mapResponse(resp, mapFn) {
    if (resp.accepted?.MfaRequired) {
        return resp;
    }
    else {
        return mapFn(resp);
    }
}
exports.mapResponse = mapResponse;
/**
 * A response of a CubeSigner request.
 */
class CubeSignerResponse {
    /** @return {string} The MFA id associated with this request (if any) */
    mfaId() {
        return __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").id;
    }
    /** @return {boolean} True if this request requires an MFA approval */
    requiresMfa() {
        return __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f") !== undefined;
    }
    /**
     * Return session information to use for any MFA approval requests (if any was included in the response).
     * @return {ClientSessionInfo | undefined}
     */
    mfaSessionInfo() {
        return __classPrivateFieldGet(this, _CubeSignerResponse_resp, "f").accepted?.MfaRequired?.session ?? undefined;
    }
    /** @return {U} The response data, if no MFA is required */
    data() {
        if (this.requiresMfa()) {
            throw new Error("Cannot call `data()` while MFA is required");
        }
        return __classPrivateFieldGet(this, _CubeSignerResponse_resp, "f");
    }
    /**
     * Approve the MFA request using a given session and a TOTP code.
     *
     * @param {SignerSession} session Signer session to use
     * @param {string} code 6-digit TOTP code
     * @return {CubeSignerResponse<U>} The result of signing with the approval
     */
    async approveTotp(session, code) {
        if (!this.requiresMfa()) {
            return this;
        }
        const mfaId = this.mfaId();
        const mfaOrgId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id;
        const mfaApproval = await session.mfaApproveTotp(mfaId, code);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            return this;
        }
        return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
    }
    /**
     * Approve the MFA request using a given `CubeSignerClient` instance (i.e., its session).
     *
     * @param {CubeSignerClient} cs CubeSigner whose session to use
     * @return {CubeSignerResponse<U>} The result of signing with the approval
     */
    async approve(cs) {
        if (!this.requiresMfa()) {
            return this;
        }
        const mfaId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").id;
        const mfaOrgId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id;
        const mfaApproval = await cs.mfaApprove(mfaId);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            return this;
        }
        return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
    }
    /**
     * Resubmits the request with a given MFA receipt attached.
     *
     * @param {MfaReceipt} mfaReceipt The MFA receipt
     * @return {Promise<CubeSignerResponse<U>>} The result of signing after MFA approval
     */
    async signWithMfaApproval(mfaReceipt) {
        const headers = CubeSignerResponse.getMfaHeaders(mfaReceipt);
        return new CubeSignerResponse(__classPrivateFieldGet(this, _CubeSignerResponse_requestFn, "f"), await __classPrivateFieldGet(this, _CubeSignerResponse_requestFn, "f").call(this, headers));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param {RequestFn} requestFn
     *    The signing function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI client.
     * @internal
     */
    constructor(requestFn, resp) {
        _CubeSignerResponse_requestFn.set(this, void 0);
        _CubeSignerResponse_resp.set(this, void 0);
        /**
         * Optional MFA id. Only set if there is an MFA request associated with the
         * signing request
         */
        _CubeSignerResponse_mfaRequired.set(this, void 0);
        __classPrivateFieldSet(this, _CubeSignerResponse_requestFn, requestFn, "f");
        __classPrivateFieldSet(this, _CubeSignerResponse_resp, resp, "f");
        __classPrivateFieldSet(this, _CubeSignerResponse_mfaRequired, __classPrivateFieldGet(this, _CubeSignerResponse_resp, "f").accepted?.MfaRequired, "f");
    }
    /**
     * Static constructor.
     * @param {RequestFn} requestFn
     *    The request function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<CubeSignerResponse<U>>} New instance of this class.
     * @internal
     */
    static async create(requestFn, mfaReceipt) {
        const seed = await requestFn(this.getMfaHeaders(mfaReceipt));
        return new CubeSignerResponse(requestFn, seed);
    }
    /**
     * Return HTTP headers containing a given MFA receipt.
     *
     * @param {MfaReceipt} mfaReceipt MFA receipt
     * @return {HeadersInit} Headers including that receipt
     * @internal
     */
    static getMfaHeaders(mfaReceipt) {
        return mfaReceipt
            ? {
                "x-cubist-mfa-id": mfaReceipt.mfaId,
                "x-cubist-mfa-org-id": mfaReceipt.mfaOrgId,
                "x-cubist-mfa-confirmation": mfaReceipt.mfaConf,
            }
            : undefined;
    }
}
exports.CubeSignerResponse = CubeSignerResponse;
_CubeSignerResponse_requestFn = new WeakMap(), _CubeSignerResponse_resp = new WeakMap(), _CubeSignerResponse_mfaRequired = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixXQUFXLENBQU8sSUFBaUIsRUFBRSxLQUFrQjtJQUNyRSxJQUFLLElBQXlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3JELE9BQU8sSUFBd0IsQ0FBQztJQUNsQyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sS0FBSyxDQUFDLElBQVMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7QUFDSCxDQUFDO0FBTkQsa0NBTUM7QUFXRDs7R0FFRztBQUNILE1BQWEsa0JBQWtCO0lBUzdCLHdFQUF3RTtJQUN4RSxLQUFLO1FBQ0gsT0FBTyx1QkFBQSxJQUFJLHVDQUFjLENBQUMsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCxzRUFBc0U7SUFDdEUsV0FBVztRQUNULE9BQU8sdUJBQUEsSUFBSSx1Q0FBYSxLQUFLLFNBQVMsQ0FBQztJQUN6QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsY0FBYztRQUNaLE9BQVEsdUJBQUEsSUFBSSxnQ0FBMkIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLE9BQU8sSUFBSSxTQUFTLENBQUM7SUFDdEYsQ0FBQztJQUVELDJEQUEyRDtJQUMzRCxJQUFJO1FBQ0YsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUNELE9BQU8sdUJBQUEsSUFBSSxnQ0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXNCLEVBQUUsSUFBWTtRQUNwRCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFDeEIsT0FBTyxJ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QUNILENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDaEIsQ0FBQztDQUNGO0FBbEpELGdEQWtKQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQsIFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgTWZhUmVjZWlwdCB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHsgQWNjZXB0ZWRSZXNwb25zZSwgTmV3U2Vzc2lvblJlc3BvbnNlIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8qKlxuICogUmVzcG9uc2UgdHlwZSwgd2hpY2ggY2FuIGJlIGVpdGhlciBhIHZhbHVlIG9mIHR5cGUge0BsaW5rIFV9XG4gKiBvciB7QGxpbmsgQWNjZXB0ZWRSZXNwb25zZX0gKHN0YXR1cyBjb2RlIDIwMikgd2hpY2ggcmVxdWlyZXMgTUZBLlxuICovXG5leHBvcnQgdHlwZSBSZXNwb25zZTxVPiA9IFUgfCBBY2NlcHRlZFJlc3BvbnNlO1xuXG4vKipcbiAqIFJlcXVlc3QgZnVuY3Rpb24gd2hpY2ggb3B0aW9uYWxseSB0YWtlcyBhZGRpdGlvbmFsIGhlYWRlcnNcbiAqICh3aGljaCwgZm9yIGV4YW1wbGUsIGNhbiBiZSB1c2VkIHRvIGF0dGFjaCBhbiBNRkEgcmVjZWlwdCkuXG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVlc3RGbjxVPiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IFByb21pc2U8UmVzcG9uc2U8VT4+O1xuXG4vKipcbiAqIE1hcCBmdW5jdGlvbiBvY2Nhc2lvbmFsbHkgdXNlZCB0byBtYXAgYSByZXNwb25zZSBmcm9tIHRoZSBBUEkgaW50byBhIGhpZ2hlci1sZXZlbCB0eXBlLlxuICovXG5leHBvcnQgdHlwZSBNYXBGbjxVLCBWPiA9ICh1OiBVKSA9PiBWO1xuXG4vKipcbiAqIFRha2UgYSB7QGxpbmsgUmVzcG9uc2U8VT59IGFuZCBhIHtAbGluayBNYXBGbjxVLCBWPn0gZnVuY3Rpb24gYW5kIHJldHVyblxuICogYSB7QGxpbmsgUmVzcG9uc2U8Vj59IHRoYXQgbWFwcyB0aGUgdmFsdWUgb2YgdGhlIG9yaWdpbmFsIHJlc3BvbnNlIHdoZW4gaXRzIHN0YXR1cyBjb2RlIGlzIDIwMC5cbiAqXG4gKiBAcGFyYW0ge1Jlc3BvbnNlPFU+fSByZXNwIE9yaWdpbmFsIHJlc3BvbnNlXG4gKiBAcGFyYW0ge01hcDxVLCBWPn0gbWFwRm4gTWFwIHRvIGFwcGx5IHRvIHRoZSByZXNwb25zZSB2YWx1ZSB3aGVuIGl0cyBzdGF0dXMgY29kZSBpcyAyMDAuXG4gKiBAcmV0dXJuIHtSZXNwb25zZTxWPn0gUmVzcG9uc2Ugd2hvc2UgdmFsdWUgZm9yIHN0YXR1cyBjb2RlIDIwMCBpcyBtYXBwZWQgZnJvbSBVIHRvIFZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcFJlc3BvbnNlPFUsIFY+KHJlc3A6IFJlc3BvbnNlPFU+LCBtYXBGbjogTWFwRm48VSwgVj4pOiBSZXNwb25zZTxWPiB7XG4gIGlmICgocmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQpIHtcbiAgICByZXR1cm4gcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYXBGbihyZXNwIGFzIFUpO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWZhUmVxdWlyZWQge1xuICAvKiogT3JnIGlkICovXG4gIG9yZ19pZDogc3RyaW5nO1xuICAvKiogTUZBIHJlcXVlc3QgaWQgKi9cbiAgaWQ6IHN0cmluZztcbiAgLyoqIE9wdGlvbmFsIE1GQSBzZXNzaW9uICovXG4gIHNlc3Npb24/OiBOZXdTZXNzaW9uUmVzcG9uc2UgfCBudWxsO1xufVxuXG4vKipcbiAqIEEgcmVzcG9uc2Ugb2YgYSBDdWJlU2lnbmVyIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyUmVzcG9uc2U8VT4ge1xuICByZWFkb25seSAjcmVxdWVzdEZuOiBSZXF1ZXN0Rm48VT47XG4gIHJlYWRvbmx5ICNyZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcbiAgLyoqXG4gICAqIE9wdGlvbmFsIE1GQSBpZC4gT25seSBzZXQgaWYgdGhlcmUgaXMgYW4gTUZBIHJlcXVlc3QgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICAgKiBzaWduaW5nIHJlcXVlc3RcbiAgICovXG4gIHJlYWRvbmx5ICNtZmFSZXF1aXJlZD86IE1mYVJlcXVpcmVkO1xuXG4gIC8qKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcmVxdWVzdCAoaWYgYW55KSAqL1xuICBtZmFJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNtZmFSZXF1aXJlZCEuaWQ7XG4gIH1cblxuICAvKiogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGlzIHJlcXVlc3QgcmVxdWlyZXMgYW4gTUZBIGFwcHJvdmFsICovXG4gIHJlcXVpcmVzTWZhKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNtZmFSZXF1aXJlZCAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBzZXNzaW9uIGluZm9ybWF0aW9uIHRvIHVzZSBmb3IgYW55IE1GQSBhcHByb3ZhbCByZXF1ZXN0cyAoaWYgYW55IHdhcyBpbmNsdWRlZCBpbiB0aGUgcmVzcG9uc2UpLlxuICAgKiBAcmV0dXJuIHtDbGllbnRTZXNzaW9uSW5mbyB8IHVuZGVmaW5lZH1cbiAgICovXG4gIG1mYVNlc3Npb25JbmZvKCk6IE5ld1Nlc3Npb25SZXNwb25zZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZD8uc2Vzc2lvbiA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQHJldHVybiB7VX0gVGhlIHJlc3BvbnNlIGRhdGEsIGlmIG5vIE1GQSBpcyByZXF1aXJlZCAqL1xuICBkYXRhKCk6IFUge1xuICAgIGlmICh0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBjYWxsIGBkYXRhKClgIHdoaWxlIE1GQSBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3AgYXMgVTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb259IHNlc3Npb24gU2lnbmVyIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBhcHByb3ZlVG90cChzZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGlmICghdGhpcy5yZXF1aXJlc01mYSgpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25zdCBtZmFJZCA9IHRoaXMubWZhSWQoKTtcbiAgICBjb25zdCBtZmFPcmdJZCA9IHRoaXMuI21mYVJlcXVpcmVkIS5vcmdfaWQ7XG4gICAgY29uc3QgbWZhQXBwcm92YWwgPSBhd2FpdCBzZXNzaW9uLm1mYUFwcHJvdmVUb3RwKG1mYUlkLCBjb2RlKTtcbiAgICBjb25zdCBtZmFDb25mID0gbWZhQXBwcm92YWwucmVjZWlwdD8uY29uZmlybWF0aW9uO1xuXG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zaWduV2l0aE1mYUFwcHJvdmFsKHsgbWZhSWQsIG1mYU9yZ0lkLCBtZmFDb25mIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gYEN1YmVTaWduZXJDbGllbnRgIGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY3MgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZShjczogQ3ViZVNpZ25lckNsaWVudCk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgaWYgKCF0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY3MubWZhQXBwcm92ZShtZmFJZCk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN1Ym1pdHMgdGhlIHJlcXVlc3Qgd2l0aCBhIGdpdmVuIE1GQSByZWNlaXB0IGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgVGhlIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+Pn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIGFmdGVyIE1GQSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgc2lnbldpdGhNZmFBcHByb3ZhbChtZmFSZWNlaXB0OiBNZmFSZWNlaXB0KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBoZWFkZXJzID0gQ3ViZVNpZ25lclJlc3BvbnNlLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyUmVzcG9uc2UodGhpcy4jcmVxdWVzdEZuLCBhd2FpdCB0aGlzLiNyZXF1ZXN0Rm4oaGVhZGVycykpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7UmVxdWVzdEZufSByZXF1ZXN0Rm5cbiAgICogICAgVGhlIHNpZ25pbmcgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgIFRoaXMgYXJndW1lbnQgaXMgdXNlZCB0byByZXNlbmQgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7VSB8IEFjY2VwdGVkUmVzcG9uc2V9IHJlc3AgVGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGJ5IHRoZSBPcGVuQVBJIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihyZXF1ZXN0Rm46IFJlcXVlc3RGbjxVPiwgcmVzcDogVSB8IEFjY2VwdGVkUmVzcG9uc2UpIHtcbiAgICB0aGlzLiNyZXF1ZXN0Rm4gPSByZXF1ZXN0Rm47XG4gICAgdGhpcy4jcmVzcCA9IHJlc3A7XG4gICAgdGhpcy4jbWZhUmVxdWlyZWQgPSAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQ7XG4gIH1cblxuICAvKipcbiAgICogU3RhdGljIGNvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge1JlcXVlc3RGbn0gcmVxdWVzdEZuXG4gICAqICAgIFRoZSByZXF1ZXN0IGZ1bmN0aW9uIHRoYXQgdGhpcyByZXNwb25zZSBpcyBmcm9tLlxuICAgKiAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGggZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+fSBOZXcgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlPFU+KFxuICAgIHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IHNlZWQgPSBhd2FpdCByZXF1ZXN0Rm4odGhpcy5nZXRNZmFIZWFkZXJzKG1mYVJlY2VpcHQpKTtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXJSZXNwb25zZShyZXF1ZXN0Rm4sIHNlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBIVFRQIGhlYWRlcnMgY29udGFpbmluZyBhIGdpdmVuIE1GQSByZWNlaXB0LlxuICAgKlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7SGVhZGVyc0luaXR9IEhlYWRlcnMgaW5jbHVkaW5nIHRoYXQgcmVjZWlwdFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBnZXRNZmFIZWFkZXJzKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0KTogSGVhZGVyc0luaXQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBtZmFSZWNlaXB0XG4gICAgICA/IHtcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1pZFwiOiBtZmFSZWNlaXB0Lm1mYUlkLFxuICAgICAgICAgIFwieC1jdWJpc3QtbWZhLW9yZy1pZFwiOiBtZmFSZWNlaXB0Lm1mYU9yZ0lkLFxuICAgICAgICAgIFwieC1jdWJpc3QtbWZhLWNvbmZpcm1hdGlvblwiOiBtZmFSZWNlaXB0Lm1mYUNvbmYsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkO1xuICB9XG59XG4iXX0=