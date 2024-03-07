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
var _CubeSignerResponse_instances, _CubeSignerResponse_requestFn, _CubeSignerResponse_resp, _CubeSignerResponse_mfaRequired, _CubeSignerResponse_mfaVoteTotp, _CubeSignerResponse_mfaVoteCs;
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
        return await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaVoteTotp).call(this, session, code, "approve");
    }
    /**
     * Reject the MFA request using a given session and a TOTP code.
     *
     * @param {SignerSession} session Signer session to use
     * @param {string} code 6-digit TOTP code
     */
    async rejectTotp(session, code) {
        await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaVoteTotp).call(this, session, code, "reject");
    }
    /**
     * Approve the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param {CubeSignerClient} cs CubeSigner whose session to use
     * @return {CubeSignerResponse<U>} The result of signing with the approval
     */
    async approve(cs) {
        return await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaVoteCs).call(this, cs, "approve");
    }
    /**
     * Reject the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param {CubeSignerClient} cs CubeSigner client whose session to use
     */
    async reject(cs) {
        await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaVoteCs).call(this, cs, "reject");
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
        _CubeSignerResponse_instances.add(this);
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
_CubeSignerResponse_requestFn = new WeakMap(), _CubeSignerResponse_resp = new WeakMap(), _CubeSignerResponse_mfaRequired = new WeakMap(), _CubeSignerResponse_instances = new WeakSet(), _CubeSignerResponse_mfaVoteTotp = 
/**
 * Approve or reject an MFA request using a given session and a TOTP code.
 *
 * @param {SignerSession} session Signer session to use
 * @param {string} code 6-digit TOTP code
 * @param {MfaVote} vote Approve or reject
 * @return {CubeSignerResponse<U>} The result of signing with the approval
 */
async function _CubeSignerResponse_mfaVoteTotp(session, code, vote) {
    if (!this.requiresMfa()) {
        return this;
    }
    const mfaId = this.mfaId();
    const mfaOrgId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id;
    const mfaApproval = await session.mfaVoteTotp(mfaId, code, vote);
    const mfaConf = mfaApproval.receipt?.confirmation;
    if (!mfaConf) {
        return this;
    }
    return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
}, _CubeSignerResponse_mfaVoteCs = 
/**
 * Approve or reject an MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
 *
 * @param {CubeSignerClient} cs CubeSigner whose session to use
 * @param {MfaVote} mfaVote Approve or reject
 * @return {CubeSignerResponse<U>} The result of signing with the approval
 */
async function _CubeSignerResponse_mfaVoteCs(cs, mfaVote) {
    if (!this.requiresMfa()) {
        return this;
    }
    const mfaId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").id;
    const mfaOrgId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id;
    const mfaApproval = await cs.mfaVoteCs(mfaId, mfaVote);
    const mfaConf = mfaApproval.receipt?.confirmation;
    if (!mfaConf) {
        return this;
    }
    return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixXQUFXLENBQU8sSUFBaUIsRUFBRSxLQUFrQjtJQUNyRSxJQUFLLElBQXlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3JELE9BQU8sSUFBd0IsQ0FBQztJQUNsQyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sS0FBSyxDQUFDLElBQVMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7QUFDSCxDQUFDO0FBTkQsa0NBTUM7QUFXRDs7R0FFRztBQUNILE1BQWEsa0JBQWtCO0lBUzdCLHdFQUF3RTtJQUN4RSxLQUFLO1FBQ0gsT0FBTyx1QkFBQSxJQUFJLHVDQUFjLENBQUMsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCxzRUFBc0U7SUFDdEUsV0FBVztRQUNULE9BQU8sdUJBQUEsSUFBSSx1Q0FBYSxLQUFLLFNBQVMsQ0FBQztJQUN6QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsY0FBYztRQUNaLE9BQVEsdUJBQUEsSUFBSSxnQ0FBMkIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLE9BQU8sSUFBSSxTQUFTLENBQUM7SUFDdEYsQ0FBQztJQUVELDJEQUEyRDtJQUMzRCxJQUFJO1FBQ0YsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUNELE9BQU8sdUJBQUEsSUFBSSxnQ0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXNCLEVBQUUsSUFBWTtRQUNwRCxPQUFPLE1BQU0sdUJBQUEsSUFBSSxzRUFBYSxNQUFqQixJQUFJLEVBQWMsT0FBTyxFQUFF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QztRQUNiLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQXFCRDs7Ozs7O0dBTUc7QUFDSCxLQUFLLHdDQUFZLEVBQW9CLEVBQUUsT0FBZ0I7SUFDckQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFHLHVCQUFBLElBQUksdUNBQWMsQ0FBQyxFQUFFLENBQUM7SUFDcEMsTUFBTSxRQUFRLEdBQUcsdUJBQUEsSUFBSSx1Q0FBYyxDQUFDLE1BQU0sQ0FBQztJQUUzQyxNQUFNLFdBQVcsR0FBRyxNQUFNLEVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO0lBRWxELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQsIE1mYVZvdGUsIFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgTWZhUmVjZWlwdCB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHsgQWNjZXB0ZWRSZXNwb25zZSwgTmV3U2Vzc2lvblJlc3BvbnNlIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8qKlxuICogUmVzcG9uc2UgdHlwZSwgd2hpY2ggY2FuIGJlIGVpdGhlciBhIHZhbHVlIG9mIHR5cGUge0BsaW5rIFV9XG4gKiBvciB7QGxpbmsgQWNjZXB0ZWRSZXNwb25zZX0gKHN0YXR1cyBjb2RlIDIwMikgd2hpY2ggcmVxdWlyZXMgTUZBLlxuICovXG5leHBvcnQgdHlwZSBSZXNwb25zZTxVPiA9IFUgfCBBY2NlcHRlZFJlc3BvbnNlO1xuXG4vKipcbiAqIFJlcXVlc3QgZnVuY3Rpb24gd2hpY2ggb3B0aW9uYWxseSB0YWtlcyBhZGRpdGlvbmFsIGhlYWRlcnNcbiAqICh3aGljaCwgZm9yIGV4YW1wbGUsIGNhbiBiZSB1c2VkIHRvIGF0dGFjaCBhbiBNRkEgcmVjZWlwdCkuXG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVlc3RGbjxVPiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IFByb21pc2U8UmVzcG9uc2U8VT4+O1xuXG4vKipcbiAqIE1hcCBmdW5jdGlvbiBvY2Nhc2lvbmFsbHkgdXNlZCB0byBtYXAgYSByZXNwb25zZSBmcm9tIHRoZSBBUEkgaW50byBhIGhpZ2hlci1sZXZlbCB0eXBlLlxuICovXG5leHBvcnQgdHlwZSBNYXBGbjxVLCBWPiA9ICh1OiBVKSA9PiBWO1xuXG4vKipcbiAqIFRha2UgYSB7QGxpbmsgUmVzcG9uc2U8VT59IGFuZCBhIHtAbGluayBNYXBGbjxVLCBWPn0gZnVuY3Rpb24gYW5kIHJldHVyblxuICogYSB7QGxpbmsgUmVzcG9uc2U8Vj59IHRoYXQgbWFwcyB0aGUgdmFsdWUgb2YgdGhlIG9yaWdpbmFsIHJlc3BvbnNlIHdoZW4gaXRzIHN0YXR1cyBjb2RlIGlzIDIwMC5cbiAqXG4gKiBAcGFyYW0ge1Jlc3BvbnNlPFU+fSByZXNwIE9yaWdpbmFsIHJlc3BvbnNlXG4gKiBAcGFyYW0ge01hcDxVLCBWPn0gbWFwRm4gTWFwIHRvIGFwcGx5IHRvIHRoZSByZXNwb25zZSB2YWx1ZSB3aGVuIGl0cyBzdGF0dXMgY29kZSBpcyAyMDAuXG4gKiBAcmV0dXJuIHtSZXNwb25zZTxWPn0gUmVzcG9uc2Ugd2hvc2UgdmFsdWUgZm9yIHN0YXR1cyBjb2RlIDIwMCBpcyBtYXBwZWQgZnJvbSBVIHRvIFZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcFJlc3BvbnNlPFUsIFY+KHJlc3A6IFJlc3BvbnNlPFU+LCBtYXBGbjogTWFwRm48VSwgVj4pOiBSZXNwb25zZTxWPiB7XG4gIGlmICgocmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQpIHtcbiAgICByZXR1cm4gcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYXBGbihyZXNwIGFzIFUpO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWZhUmVxdWlyZWQge1xuICAvKiogT3JnIGlkICovXG4gIG9yZ19pZDogc3RyaW5nO1xuICAvKiogTUZBIHJlcXVlc3QgaWQgKi9cbiAgaWQ6IHN0cmluZztcbiAgLyoqIE9wdGlvbmFsIE1GQSBzZXNzaW9uICovXG4gIHNlc3Npb24/OiBOZXdTZXNzaW9uUmVzcG9uc2UgfCBudWxsO1xufVxuXG4vKipcbiAqIEEgcmVzcG9uc2Ugb2YgYSBDdWJlU2lnbmVyIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyUmVzcG9uc2U8VT4ge1xuICByZWFkb25seSAjcmVxdWVzdEZuOiBSZXF1ZXN0Rm48VT47XG4gIHJlYWRvbmx5ICNyZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcbiAgLyoqXG4gICAqIE9wdGlvbmFsIE1GQSBpZC4gT25seSBzZXQgaWYgdGhlcmUgaXMgYW4gTUZBIHJlcXVlc3QgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICAgKiBzaWduaW5nIHJlcXVlc3RcbiAgICovXG4gIHJlYWRvbmx5ICNtZmFSZXF1aXJlZD86IE1mYVJlcXVpcmVkO1xuXG4gIC8qKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcmVxdWVzdCAoaWYgYW55KSAqL1xuICBtZmFJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNtZmFSZXF1aXJlZCEuaWQ7XG4gIH1cblxuICAvKiogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGlzIHJlcXVlc3QgcmVxdWlyZXMgYW4gTUZBIGFwcHJvdmFsICovXG4gIHJlcXVpcmVzTWZhKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNtZmFSZXF1aXJlZCAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBzZXNzaW9uIGluZm9ybWF0aW9uIHRvIHVzZSBmb3IgYW55IE1GQSBhcHByb3ZhbCByZXF1ZXN0cyAoaWYgYW55IHdhcyBpbmNsdWRlZCBpbiB0aGUgcmVzcG9uc2UpLlxuICAgKiBAcmV0dXJuIHtDbGllbnRTZXNzaW9uSW5mbyB8IHVuZGVmaW5lZH1cbiAgICovXG4gIG1mYVNlc3Npb25JbmZvKCk6IE5ld1Nlc3Npb25SZXNwb25zZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZD8uc2Vzc2lvbiA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQHJldHVybiB7VX0gVGhlIHJlc3BvbnNlIGRhdGEsIGlmIG5vIE1GQSBpcyByZXF1aXJlZCAqL1xuICBkYXRhKCk6IFUge1xuICAgIGlmICh0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBjYWxsIGBkYXRhKClgIHdoaWxlIE1GQSBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3AgYXMgVTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb259IHNlc3Npb24gU2lnbmVyIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBhcHByb3ZlVG90cChzZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNtZmFWb3RlVG90cChzZXNzaW9uLCBjb2RlLCBcImFwcHJvdmVcIik7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb259IHNlc3Npb24gU2lnbmVyIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqL1xuICBhc3luYyByZWplY3RUb3RwKHNlc3Npb246IFNpZ25lclNlc3Npb24sIGNvZGU6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMuI21mYVZvdGVUb3RwKHNlc3Npb24sIGNvZGUsIFwicmVqZWN0XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGFuIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc2Vzc2lvbiBTaWduZXIgc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHBhcmFtIHtNZmFWb3RlfSB2b3RlIEFwcHJvdmUgb3IgcmVqZWN0XG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyAjbWZhVm90ZVRvdHAoXG4gICAgc2Vzc2lvbjogU2lnbmVyU2Vzc2lvbixcbiAgICBjb2RlOiBzdHJpbmcsXG4gICAgdm90ZTogTWZhVm90ZSxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBpZiAoIXRoaXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLm1mYUlkKCk7XG4gICAgY29uc3QgbWZhT3JnSWQgPSB0aGlzLiNtZmFSZXF1aXJlZCEub3JnX2lkO1xuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgc2Vzc2lvbi5tZmFWb3RlVG90cChtZmFJZCwgY29kZSwgdm90ZSk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNzIEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHJldHVybiB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGFwcHJvdmUoY3M6IEN1YmVTaWduZXJDbGllbnQpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNtZmFWb3RlQ3MoY3MsIFwiYXBwcm92ZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4ge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY3MgQ3ViZVNpZ25lciBjbGllbnQgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICovXG4gIGFzeW5jIHJlamVjdChjczogQ3ViZVNpZ25lckNsaWVudCkge1xuICAgIGF3YWl0IHRoaXMuI21mYVZvdGVDcyhjcywgXCJyZWplY3RcIik7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBvciByZWplY3QgYW4gTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGFuY2UgKGkuZS4sIGl0cyBzZXNzaW9uKS5cbiAgICpcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQ2xpZW50fSBjcyBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7TWZhVm90ZX0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdFxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgI21mYVZvdGVDcyhjczogQ3ViZVNpZ25lckNsaWVudCwgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgaWYgKCF0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY3MubWZhVm90ZUNzKG1mYUlkLCBtZmFWb3RlKTtcbiAgICBjb25zdCBtZmFDb25mID0gbWZhQXBwcm92YWwucmVjZWlwdD8uY29uZmlybWF0aW9uO1xuXG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zaWduV2l0aE1mYUFwcHJvdmFsKHsgbWZhSWQsIG1mYU9yZ0lkLCBtZmFDb25mIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3VibWl0cyB0aGUgcmVxdWVzdCB3aXRoIGEgZ2l2ZW4gTUZBIHJlY2VpcHQgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBUaGUgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgYWZ0ZXIgTUZBIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBzaWduV2l0aE1mYUFwcHJvdmFsKG1mYVJlY2VpcHQ6IE1mYVJlY2VpcHQpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBDdWJlU2lnbmVyUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KTtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXJSZXNwb25zZSh0aGlzLiNyZXF1ZXN0Rm4sIGF3YWl0IHRoaXMuI3JlcXVlc3RGbihoZWFkZXJzKSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtSZXF1ZXN0Rm59IHJlcXVlc3RGblxuICAgKiAgICBUaGUgc2lnbmluZyBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoIGRpZmZlcmVudCBoZWFkZXJzIGlmIG5lZWRlZC5cbiAgICogQHBhcmFtIHtVIHwgQWNjZXB0ZWRSZXNwb25zZX0gcmVzcCBUaGUgcmVzcG9uc2UgYXMgcmV0dXJuZWQgYnkgdGhlIE9wZW5BUEkgY2xpZW50LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LCByZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZSkge1xuICAgIHRoaXMuI3JlcXVlc3RGbiA9IHJlcXVlc3RGbjtcbiAgICB0aGlzLiNyZXNwID0gcmVzcDtcbiAgICB0aGlzLiNtZmFSZXF1aXJlZCA9ICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGF0aWMgY29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7UmVxdWVzdEZufSByZXF1ZXN0Rm5cbiAgICogICAgVGhlIHJlcXVlc3QgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgIFRoaXMgYXJndW1lbnQgaXMgdXNlZCB0byByZXNlbmQgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj59IE5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VT4oXG4gICAgcmVxdWVzdEZuOiBSZXF1ZXN0Rm48VT4sXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3Qgc2VlZCA9IGF3YWl0IHJlcXVlc3RGbih0aGlzLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCkpO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lclJlc3BvbnNlKHJlcXVlc3RGbiwgc2VlZCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIEhUVFAgaGVhZGVycyBjb250YWluaW5nIGEgZ2l2ZW4gTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtIZWFkZXJzSW5pdH0gSGVhZGVycyBpbmNsdWRpbmcgdGhhdCByZWNlaXB0XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGdldE1mYUhlYWRlcnMobWZhUmVjZWlwdD86IE1mYVJlY2VpcHQpOiBIZWFkZXJzSW5pdCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIG1mYVJlY2VpcHRcbiAgICAgID8ge1xuICAgICAgICAgIFwieC1jdWJpc3QtbWZhLWlkXCI6IG1mYVJlY2VpcHQubWZhSWQsXG4gICAgICAgICAgXCJ4LWN1YmlzdC1tZmEtb3JnLWlkXCI6IG1mYVJlY2VpcHQubWZhT3JnSWQsXG4gICAgICAgICAgXCJ4LWN1YmlzdC1tZmEtY29uZmlybWF0aW9uXCI6IG1mYVJlY2VpcHQubWZhQ29uZixcbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQ7XG4gIH1cbn1cbiJdfQ==