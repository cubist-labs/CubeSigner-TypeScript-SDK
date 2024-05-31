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
var _CubeSignerResponse_instances, _CubeSignerResponse_env, _CubeSignerResponse_requestFn, _CubeSignerResponse_resp, _CubeSignerResponse_mfaRequired, _CubeSignerResponse_mfaTotpVote, _CubeSignerResponse_mfaVote;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubeSignerResponse = exports.mapResponse = void 0;
const _1 = require(".");
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
     * @return {Promise<ClientSessionInfo | undefined>}
     */
    async mfaClient() {
        if (__classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f") === undefined)
            return;
        const session = __classPrivateFieldGet(this, _CubeSignerResponse_resp, "f").accepted?.MfaRequired?.session ?? undefined;
        if (session === undefined)
            return;
        const env = __classPrivateFieldGet(this, _CubeSignerResponse_env, "f");
        return await _1.CubeSignerClient.create({
            env: {
                "Dev-CubeSignerStack": env,
            },
            org_id: __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id,
            session_exp: session.expiration,
            session_info: session.session_info,
            token: session.token,
        });
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
     * @param {CubeSignerClient} client CubeSigner whose session to use
     * @param {string} code 6-digit TOTP code
     * @return {CubeSignerResponse<U>} The result of resubmitting the request with the approval
     */
    async totpApprove(client, code) {
        return await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaTotpVote).call(this, client, code, "approve");
    }
    /**
     * Reject the MFA request using a given session and a TOTP code.
     *
     * @param {CubeSignerClient} client CubeSigner whose session to use
     * @param {string} code 6-digit TOTP code
     */
    async totpReject(client, code) {
        await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaTotpVote).call(this, client, code, "reject");
    }
    /**
     * Approve the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param {CubeSignerClient} client CubeSigner whose session to use
     * @return {CubeSignerResponse<U>} The result of resubmitting the request with the approval
     */
    async approve(client) {
        return await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaVote).call(this, client, "approve");
    }
    /**
     * Reject the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param {CubeSignerClient} client CubeSigner whose session to use
     */
    async reject(client) {
        await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaVote).call(this, client, "reject");
    }
    /**
     * Resubmits the request with a given MFA receipt attached.
     *
     * @param {MfaReceipt} mfaReceipt The MFA receipt
     * @return {Promise<CubeSignerResponse<U>>} The result of signing after MFA approval
     */
    async execWithMfaApproval(mfaReceipt) {
        const headers = CubeSignerResponse.getMfaHeaders(mfaReceipt);
        return new CubeSignerResponse(__classPrivateFieldGet(this, _CubeSignerResponse_env, "f"), __classPrivateFieldGet(this, _CubeSignerResponse_requestFn, "f"), await __classPrivateFieldGet(this, _CubeSignerResponse_requestFn, "f").call(this, headers));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     * @param {EnvInterface} env The environment where the response comes from
     * @param {RequestFn} requestFn
     *    The function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI client.
     * @internal
     */
    constructor(env, requestFn, resp) {
        _CubeSignerResponse_instances.add(this);
        _CubeSignerResponse_env.set(this, void 0);
        _CubeSignerResponse_requestFn.set(this, void 0);
        _CubeSignerResponse_resp.set(this, void 0);
        /**
         * Optional MFA id. Only set if there is an MFA request associated with the request
         */
        _CubeSignerResponse_mfaRequired.set(this, void 0);
        __classPrivateFieldSet(this, _CubeSignerResponse_env, env, "f");
        __classPrivateFieldSet(this, _CubeSignerResponse_requestFn, requestFn, "f");
        __classPrivateFieldSet(this, _CubeSignerResponse_resp, resp, "f");
        __classPrivateFieldSet(this, _CubeSignerResponse_mfaRequired, __classPrivateFieldGet(this, _CubeSignerResponse_resp, "f").accepted?.MfaRequired, "f");
    }
    /**
     * Static constructor.
     * @param {EnvInterface} env The environment where the response comes from
     * @param {RequestFn} requestFn
     *    The request function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<CubeSignerResponse<U>>} New instance of this class.
     * @internal
     */
    static async create(env, requestFn, mfaReceipt) {
        const seed = await requestFn(this.getMfaHeaders(mfaReceipt));
        return new CubeSignerResponse(env, requestFn, seed);
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
_CubeSignerResponse_env = new WeakMap(), _CubeSignerResponse_requestFn = new WeakMap(), _CubeSignerResponse_resp = new WeakMap(), _CubeSignerResponse_mfaRequired = new WeakMap(), _CubeSignerResponse_instances = new WeakSet(), _CubeSignerResponse_mfaTotpVote = 
/**
 * Approve or reject an MFA request using a given session and a TOTP code.
 *
 * @param {CubeSignerClient} client CubeSigner whose session to use
 * @param {string} code 6-digit TOTP code
 * @param {MfaVote} vote Approve or reject
 * @return {CubeSignerResponse<U>} The result of resubmitting the request with the approval
 */
async function _CubeSignerResponse_mfaTotpVote(client, code, vote) {
    if (!this.requiresMfa()) {
        return this;
    }
    const mfaId = this.mfaId();
    const mfaOrgId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id;
    const mfaApproval = await client.apiClient.mfaVoteTotp(mfaId, code, vote);
    const mfaConf = mfaApproval.receipt?.confirmation;
    if (!mfaConf) {
        return this;
    }
    return await this.execWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
}, _CubeSignerResponse_mfaVote = 
/**
 * Approve or reject an MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
 *
 * @param {CubeSignerClient} client CubeSigner whose session to use
 * @param {MfaVote} mfaVote Approve or reject
 * @return {CubeSignerResponse<U>} The result of resubmitting the request with the approval
 */
async function _CubeSignerResponse_mfaVote(client, mfaVote) {
    if (!this.requiresMfa()) {
        return this;
    }
    const mfaId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").id;
    const mfaOrgId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id;
    const mfaApproval = await client.apiClient.mfaVoteCs(mfaId, mfaVote);
    const mfaConf = mfaApproval.receipt?.confirmation;
    if (!mfaConf) {
        return this;
    }
    return await this.execWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esd0JBQXFDO0FBcUJyQzs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsV0FBVyxDQUFPLElBQWlCLEVBQUUsS0FBa0I7SUFDckUsSUFBSyxJQUF5QixDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUU7UUFDcEQsT0FBTyxJQUF3QixDQUFDO0tBQ2pDO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQyxJQUFTLENBQUMsQ0FBQztLQUN6QjtBQUNILENBQUM7QUFORCxrQ0FNQztBQVdEOztHQUVHO0FBQ0gsTUFBYSxrQkFBa0I7SUFTN0Isd0VBQXdFO0lBQ3hFLEtBQUs7UUFDSCxPQUFPLHVCQUFBLElBQUksdUNBQWMsQ0FBQyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELHNFQUFzRTtJQUN0RSxXQUFXO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLHVDQUFhLEtBQUssU0FBUyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLElBQUksdUJBQUEsSUFBSSx1Q0FBYSxLQUFLLFNBQVM7WUFBRSxPQUFPO1FBQzVDLE1BQU0sT0FBTyxHQUFJLHVCQUFBLElBQUksZ0NBQTJCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxPQUFPLElBQUksU0FBUyxDQUFDO1FBQzdGLElBQUksT0FBTyxLQUFLLFNBQVM7WUFBRSxPQUFPO1FBRWxDLE1BQU0sR0FBRyxHQUFHLHVCQUFBLElBQUksK0JBQUssQ0FBQztRQUN0QixPQUFPLE1BQU0sbUJBQWdCLENBQUMsTUFBTSxDQUFDO1lBQ25DLEdBQUcsRUFBRTtnQkFDSCxxQkFBcUIsRUFBRSxHQUFHO2FBQzNCO1lBQ0QsTUFBTSxFQUFFLHVCQUFBLElBQUksdUNBQWEsQ0FBQyxNQUFNO1lBQ2hDLFdBQVcsRUFBRSxPQUFPLENB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R0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztJQUVsRCxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWZhVm90ZSwgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHR5cGUgeyBNZmFSZWNlaXB0IH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgdHlwZSB7IEFjY2VwdGVkUmVzcG9uc2UsIE5ld1Nlc3Npb25SZXNwb25zZSB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuXG4vKipcbiAqIFJlc3BvbnNlIHR5cGUsIHdoaWNoIGNhbiBiZSBlaXRoZXIgYSB2YWx1ZSBvZiB0eXBlIHtAbGluayBVfVxuICogb3Ige0BsaW5rIEFjY2VwdGVkUmVzcG9uc2V9IChzdGF0dXMgY29kZSAyMDIpIHdoaWNoIHJlcXVpcmVzIE1GQS5cbiAqL1xuZXhwb3J0IHR5cGUgUmVzcG9uc2U8VT4gPSBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcblxuLyoqXG4gKiBSZXF1ZXN0IGZ1bmN0aW9uIHdoaWNoIG9wdGlvbmFsbHkgdGFrZXMgYWRkaXRpb25hbCBoZWFkZXJzXG4gKiAod2hpY2gsIGZvciBleGFtcGxlLCBjYW4gYmUgdXNlZCB0byBhdHRhY2ggYW4gTUZBIHJlY2VpcHQpLlxuICovXG5leHBvcnQgdHlwZSBSZXF1ZXN0Rm48VT4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiBQcm9taXNlPFJlc3BvbnNlPFU+PjtcblxuLyoqXG4gKiBNYXAgZnVuY3Rpb24gb2NjYXNpb25hbGx5IHVzZWQgdG8gbWFwIGEgcmVzcG9uc2UgZnJvbSB0aGUgQVBJIGludG8gYSBoaWdoZXItbGV2ZWwgdHlwZS5cbiAqL1xuZXhwb3J0IHR5cGUgTWFwRm48VSwgVj4gPSAodTogVSkgPT4gVjtcblxuLyoqXG4gKiBUYWtlIGEge0BsaW5rIFJlc3BvbnNlPFU+fSBhbmQgYSB7QGxpbmsgTWFwRm48VSwgVj59IGZ1bmN0aW9uIGFuZCByZXR1cm5cbiAqIGEge0BsaW5rIFJlc3BvbnNlPFY+fSB0aGF0IG1hcHMgdGhlIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCByZXNwb25zZSB3aGVuIGl0cyBzdGF0dXMgY29kZSBpcyAyMDAuXG4gKlxuICogQHBhcmFtIHtSZXNwb25zZTxVPn0gcmVzcCBPcmlnaW5hbCByZXNwb25zZVxuICogQHBhcmFtIHtNYXA8VSwgVj59IG1hcEZuIE1hcCB0byBhcHBseSB0byB0aGUgcmVzcG9uc2UgdmFsdWUgd2hlbiBpdHMgc3RhdHVzIGNvZGUgaXMgMjAwLlxuICogQHJldHVybiB7UmVzcG9uc2U8Vj59IFJlc3BvbnNlIHdob3NlIHZhbHVlIGZvciBzdGF0dXMgY29kZSAyMDAgaXMgbWFwcGVkIGZyb20gVSB0byBWXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXBSZXNwb25zZTxVLCBWPihyZXNwOiBSZXNwb25zZTxVPiwgbWFwRm46IE1hcEZuPFUsIFY+KTogUmVzcG9uc2U8Vj4ge1xuICBpZiAoKHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkKSB7XG4gICAgcmV0dXJuIHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFwRm4ocmVzcCBhcyBVKTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1mYVJlcXVpcmVkIHtcbiAgLyoqIE9yZyBpZCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIE1GQSByZXF1ZXN0IGlkICovXG4gIGlkOiBzdHJpbmc7XG4gIC8qKiBPcHRpb25hbCBNRkEgc2Vzc2lvbiAqL1xuICBzZXNzaW9uPzogTmV3U2Vzc2lvblJlc3BvbnNlIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBBIHJlc3BvbnNlIG9mIGEgQ3ViZVNpZ25lciByZXF1ZXN0LlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lclJlc3BvbnNlPFU+IHtcbiAgcmVhZG9ubHkgI2VudjogRW52SW50ZXJmYWNlO1xuICByZWFkb25seSAjcmVxdWVzdEZuOiBSZXF1ZXN0Rm48VT47XG4gIHJlYWRvbmx5ICNyZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcbiAgLyoqXG4gICAqIE9wdGlvbmFsIE1GQSBpZC4gT25seSBzZXQgaWYgdGhlcmUgaXMgYW4gTUZBIHJlcXVlc3QgYXNzb2NpYXRlZCB3aXRoIHRoZSByZXF1ZXN0XG4gICAqL1xuICByZWFkb25seSAjbWZhUmVxdWlyZWQ/OiBNZmFSZXF1aXJlZDtcblxuICAvKiogQHJldHVybiB7c3RyaW5nfSBUaGUgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHJlcXVlc3QgKGlmIGFueSkgKi9cbiAgbWZhSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhpcyByZXF1ZXN0IHJlcXVpcmVzIGFuIE1GQSBhcHByb3ZhbCAqL1xuICByZXF1aXJlc01mYSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jbWZhUmVxdWlyZWQgIT09IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gc2Vzc2lvbiBpbmZvcm1hdGlvbiB0byB1c2UgZm9yIGFueSBNRkEgYXBwcm92YWwgcmVxdWVzdHMgKGlmIGFueSB3YXMgaW5jbHVkZWQgaW4gdGhlIHJlc3BvbnNlKS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDbGllbnRTZXNzaW9uSW5mbyB8IHVuZGVmaW5lZD59XG4gICAqL1xuICBhc3luYyBtZmFDbGllbnQoKTogUHJvbWlzZTxDdWJlU2lnbmVyQ2xpZW50IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMuI21mYVJlcXVpcmVkID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICBjb25zdCBzZXNzaW9uID0gKHRoaXMuI3Jlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkPy5zZXNzaW9uID8/IHVuZGVmaW5lZDtcbiAgICBpZiAoc2Vzc2lvbiA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cbiAgICBjb25zdCBlbnYgPSB0aGlzLiNlbnY7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJDbGllbnQuY3JlYXRlKHtcbiAgICAgIGVudjoge1xuICAgICAgICBcIkRldi1DdWJlU2lnbmVyU3RhY2tcIjogZW52LFxuICAgICAgfSxcbiAgICAgIG9yZ19pZDogdGhpcy4jbWZhUmVxdWlyZWQub3JnX2lkLFxuICAgICAgc2Vzc2lvbl9leHA6IHNlc3Npb24uZXhwaXJhdGlvbixcbiAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbi5zZXNzaW9uX2luZm8sXG4gICAgICB0b2tlbjogc2Vzc2lvbi50b2tlbixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtVfSBUaGUgcmVzcG9uc2UgZGF0YSwgaWYgbm8gTUZBIGlzIHJlcXVpcmVkICovXG4gIGRhdGEoKTogVSB7XG4gICAgaWYgKHRoaXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNhbGwgYGRhdGEoKWAgd2hpbGUgTUZBIGlzIHJlcXVpcmVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jcmVzcCBhcyBVO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSBUaGUgcmVzdWx0IG9mIHJlc3VibWl0dGluZyB0aGUgcmVxdWVzdCB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgdG90cEFwcHJvdmUoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNtZmFUb3RwVm90ZShjbGllbnQsIGNvZGUsIFwiYXBwcm92ZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICovXG4gIGFzeW5jIHRvdHBSZWplY3QoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBjb2RlOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNtZmFUb3RwVm90ZShjbGllbnQsIGNvZGUsIFwicmVqZWN0XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGFuIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHBhcmFtIHtNZmFWb3RlfSB2b3RlIEFwcHJvdmUgb3IgcmVqZWN0XG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jICNtZmFUb3RwVm90ZShcbiAgICBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsXG4gICAgY29kZTogc3RyaW5nLFxuICAgIHZvdGU6IE1mYVZvdGUsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgaWYgKCF0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYUlkID0gdGhpcy5tZmFJZCgpO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcbiAgICBjb25zdCBtZmFBcHByb3ZhbCA9IGF3YWl0IGNsaWVudC5hcGlDbGllbnQubWZhVm90ZVRvdHAobWZhSWQsIGNvZGUsIHZvdGUpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWNXaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGFuY2UgKGkuZS4sIGl0cyBzZXNzaW9uKS5cbiAgICpcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQ2xpZW50fSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2YgcmVzdWJtaXR0aW5nIHRoZSByZXF1ZXN0IHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBhcHByb3ZlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI21mYVZvdGUoY2xpZW50LCBcImFwcHJvdmVcIik7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqL1xuICBhc3luYyByZWplY3QoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50KSB7XG4gICAgYXdhaXQgdGhpcy4jbWZhVm90ZShjbGllbnQsIFwicmVqZWN0XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGFuIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4ge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtNZmFWb3RlfSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0XG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jICNtZmFWb3RlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgaWYgKCF0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY2xpZW50LmFwaUNsaWVudC5tZmFWb3RlQ3MobWZhSWQsIG1mYVZvdGUpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWNXaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdWJtaXRzIHRoZSByZXF1ZXN0IHdpdGggYSBnaXZlbiBNRkEgcmVjZWlwdCBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IFRoZSBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyBhZnRlciBNRkEgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGV4ZWNXaXRoTWZhQXBwcm92YWwobWZhUmVjZWlwdDogTWZhUmVjZWlwdCk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3QgaGVhZGVycyA9IEN1YmVTaWduZXJSZXNwb25zZS5nZXRNZmFIZWFkZXJzKG1mYVJlY2VpcHQpO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lclJlc3BvbnNlKHRoaXMuI2VudiwgdGhpcy4jcmVxdWVzdEZuLCBhd2FpdCB0aGlzLiNyZXF1ZXN0Rm4oaGVhZGVycykpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IHdoZXJlIHRoZSByZXNwb25zZSBjb21lcyBmcm9tXG4gICAqIEBwYXJhbSB7UmVxdWVzdEZufSByZXF1ZXN0Rm5cbiAgICogICAgVGhlIGZ1bmN0aW9uIHRoYXQgdGhpcyByZXNwb25zZSBpcyBmcm9tLlxuICAgKiAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGggZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0ge1UgfCBBY2NlcHRlZFJlc3BvbnNlfSByZXNwIFRoZSByZXNwb25zZSBhcyByZXR1cm5lZCBieSB0aGUgT3BlbkFQSSBjbGllbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKGVudjogRW52SW50ZXJmYWNlLCByZXF1ZXN0Rm46IFJlcXVlc3RGbjxVPiwgcmVzcDogVSB8IEFjY2VwdGVkUmVzcG9uc2UpIHtcbiAgICB0aGlzLiNlbnYgPSBlbnY7XG4gICAgdGhpcy4jcmVxdWVzdEZuID0gcmVxdWVzdEZuO1xuICAgIHRoaXMuI3Jlc3AgPSByZXNwO1xuICAgIHRoaXMuI21mYVJlcXVpcmVkID0gKHRoaXMuI3Jlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXRpYyBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgd2hlcmUgdGhlIHJlc3BvbnNlIGNvbWVzIGZyb21cbiAgICogQHBhcmFtIHtSZXF1ZXN0Rm59IHJlcXVlc3RGblxuICAgKiAgICBUaGUgcmVxdWVzdCBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoIGRpZmZlcmVudCBoZWFkZXJzIGlmIG5lZWRlZC5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+Pn0gTmV3IGluc3RhbmNlIG9mIHRoaXMgY2xhc3MuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxVPihcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICByZXF1ZXN0Rm46IFJlcXVlc3RGbjxVPixcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBzZWVkID0gYXdhaXQgcmVxdWVzdEZuKHRoaXMuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KSk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyUmVzcG9uc2UoZW52LCByZXF1ZXN0Rm4sIHNlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBIVFRQIGhlYWRlcnMgY29udGFpbmluZyBhIGdpdmVuIE1GQSByZWNlaXB0LlxuICAgKlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7SGVhZGVyc0luaXR9IEhlYWRlcnMgaW5jbHVkaW5nIHRoYXQgcmVjZWlwdFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBnZXRNZmFIZWFkZXJzKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0KTogSGVhZGVyc0luaXQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBtZmFSZWNlaXB0XG4gICAgICA/IHtcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1pZFwiOiBtZmFSZWNlaXB0Lm1mYUlkLFxuICAgICAgICAgIFwieC1jdWJpc3QtbWZhLW9yZy1pZFwiOiBtZmFSZWNlaXB0Lm1mYU9yZ0lkLFxuICAgICAgICAgIFwieC1jdWJpc3QtbWZhLWNvbmZpcm1hdGlvblwiOiBtZmFSZWNlaXB0Lm1mYUNvbmYsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkO1xuICB9XG59XG4iXX0=