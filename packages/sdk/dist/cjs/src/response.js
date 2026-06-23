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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esd0JBQXFDO0FBcUJyQzs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsV0FBVyxDQUFPLElBQWlCLEVBQUUsS0FBa0I7SUFDckUsSUFBSyxJQUF5QixDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNyRCxPQUFPLElBQXdCLENBQUM7SUFDbEMsQ0FBQztTQUFNLENBQUM7UUFDTixPQUFPLEtBQUssQ0FBQyxJQUFTLENBQUMsQ0FBQztJQUMxQixDQUFDO0FBQ0gsQ0FBQztBQU5ELGtDQU1DO0FBV0Q7O0dBRUc7QUFDSCxNQUFhLGtCQUFrQjtJQVM3Qix3RUFBd0U7SUFDeEUsS0FBSztRQUNILE9BQU8sdUJBQUEsSUFBSSx1Q0FBYyxDQUFDLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsc0VBQXNFO0lBQ3RFLFdBQVc7UUFDVCxPQUFPLHVCQUFBLElBQUksdUNBQWEsS0FBSyxTQUFTLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxTQUFTO1FBQ2IsSUFBSSx1QkFBQSxJQUFJLHVDQUFhLEtBQUssU0FBUztZQUFFLE9BQU87UUFDNUMsTUFBTSxPQUFPLEdBQUksdUJBQUEsSUFBSSxnQ0FBMkIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLE9BQU8sSUFBSSxTQUFTLENBQUM7UUFDN0YsSUFBSSxPQUFPLEtBQUssU0FBUztZQUFFLE9BQU87UUFFbEMsTUFBTSxHQUFHLEdBQUcsdUJBQUEsSUFBSSwrQkFBSyxDQUFDO1FBQ3RCLE9BQU8sTUFBTSxtQkFBZ0IsQ0FBQyxNQUFNLENBQUM7WUFDbkMsR0FBRyxFQUFFO2dCQUNILHFCQUFxQixFQUFFLEdBQUc7YUFDM0I7WUFDRCxNQUFNLEVBQUUsdUJBQUEsSUFBSSx1Q0FBYSxDQUFDLE1BQU07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QyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNyRSxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztJQUVsRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3RFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IE1mYVZvdGUsIEVudkludGVyZmFjZSB9IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50IH0gZnJvbSBcIi5cIjtcbmltcG9ydCB0eXBlIHsgTWZhUmVjZWlwdCB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHR5cGUgeyBBY2NlcHRlZFJlc3BvbnNlLCBOZXdTZXNzaW9uUmVzcG9uc2UgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcblxuLyoqXG4gKiBSZXNwb25zZSB0eXBlLCB3aGljaCBjYW4gYmUgZWl0aGVyIGEgdmFsdWUgb2YgdHlwZSB7QGxpbmsgVX1cbiAqIG9yIHtAbGluayBBY2NlcHRlZFJlc3BvbnNlfSAoc3RhdHVzIGNvZGUgMjAyKSB3aGljaCByZXF1aXJlcyBNRkEuXG4gKi9cbmV4cG9ydCB0eXBlIFJlc3BvbnNlPFU+ID0gVSB8IEFjY2VwdGVkUmVzcG9uc2U7XG5cbi8qKlxuICogUmVxdWVzdCBmdW5jdGlvbiB3aGljaCBvcHRpb25hbGx5IHRha2VzIGFkZGl0aW9uYWwgaGVhZGVyc1xuICogKHdoaWNoLCBmb3IgZXhhbXBsZSwgY2FuIGJlIHVzZWQgdG8gYXR0YWNoIGFuIE1GQSByZWNlaXB0KS5cbiAqL1xuZXhwb3J0IHR5cGUgUmVxdWVzdEZuPFU+ID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4gUHJvbWlzZTxSZXNwb25zZTxVPj47XG5cbi8qKlxuICogTWFwIGZ1bmN0aW9uIG9jY2FzaW9uYWxseSB1c2VkIHRvIG1hcCBhIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBpbnRvIGEgaGlnaGVyLWxldmVsIHR5cGUuXG4gKi9cbmV4cG9ydCB0eXBlIE1hcEZuPFUsIFY+ID0gKHU6IFUpID0+IFY7XG5cbi8qKlxuICogVGFrZSBhIHtAbGluayBSZXNwb25zZTxVPn0gYW5kIGEge0BsaW5rIE1hcEZuPFUsIFY+fSBmdW5jdGlvbiBhbmQgcmV0dXJuXG4gKiBhIHtAbGluayBSZXNwb25zZTxWPn0gdGhhdCBtYXBzIHRoZSB2YWx1ZSBvZiB0aGUgb3JpZ2luYWwgcmVzcG9uc2Ugd2hlbiBpdHMgc3RhdHVzIGNvZGUgaXMgMjAwLlxuICpcbiAqIEBwYXJhbSB7UmVzcG9uc2U8VT59IHJlc3AgT3JpZ2luYWwgcmVzcG9uc2VcbiAqIEBwYXJhbSB7TWFwPFUsIFY+fSBtYXBGbiBNYXAgdG8gYXBwbHkgdG8gdGhlIHJlc3BvbnNlIHZhbHVlIHdoZW4gaXRzIHN0YXR1cyBjb2RlIGlzIDIwMC5cbiAqIEByZXR1cm4ge1Jlc3BvbnNlPFY+fSBSZXNwb25zZSB3aG9zZSB2YWx1ZSBmb3Igc3RhdHVzIGNvZGUgMjAwIGlzIG1hcHBlZCBmcm9tIFUgdG8gVlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwUmVzcG9uc2U8VSwgVj4ocmVzcDogUmVzcG9uc2U8VT4sIG1hcEZuOiBNYXBGbjxVLCBWPik6IFJlc3BvbnNlPFY+IHtcbiAgaWYgKChyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZCkge1xuICAgIHJldHVybiByZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2U7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1hcEZuKHJlc3AgYXMgVSk7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZmFSZXF1aXJlZCB7XG4gIC8qKiBPcmcgaWQgKi9cbiAgb3JnX2lkOiBzdHJpbmc7XG4gIC8qKiBNRkEgcmVxdWVzdCBpZCAqL1xuICBpZDogc3RyaW5nO1xuICAvKiogT3B0aW9uYWwgTUZBIHNlc3Npb24gKi9cbiAgc2Vzc2lvbj86IE5ld1Nlc3Npb25SZXNwb25zZSB8IG51bGw7XG59XG5cbi8qKlxuICogQSByZXNwb25zZSBvZiBhIEN1YmVTaWduZXIgcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXJSZXNwb25zZTxVPiB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgI3JlcXVlc3RGbjogUmVxdWVzdEZuPFU+O1xuICByZWFkb25seSAjcmVzcDogVSB8IEFjY2VwdGVkUmVzcG9uc2U7XG4gIC8qKlxuICAgKiBPcHRpb25hbCBNRkEgaWQuIE9ubHkgc2V0IGlmIHRoZXJlIGlzIGFuIE1GQSByZXF1ZXN0IGFzc29jaWF0ZWQgd2l0aCB0aGUgcmVxdWVzdFxuICAgKi9cbiAgcmVhZG9ubHkgI21mYVJlcXVpcmVkPzogTWZhUmVxdWlyZWQ7XG5cbiAgLyoqIEByZXR1cm4ge3N0cmluZ30gVGhlIE1GQSBpZCBhc3NvY2lhdGVkIHdpdGggdGhpcyByZXF1ZXN0IChpZiBhbnkpICovXG4gIG1mYUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI21mYVJlcXVpcmVkIS5pZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoaXMgcmVxdWVzdCByZXF1aXJlcyBhbiBNRkEgYXBwcm92YWwgKi9cbiAgcmVxdWlyZXNNZmEoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI21mYVJlcXVpcmVkICE9PSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHNlc3Npb24gaW5mb3JtYXRpb24gdG8gdXNlIGZvciBhbnkgTUZBIGFwcHJvdmFsIHJlcXVlc3RzIChpZiBhbnkgd2FzIGluY2x1ZGVkIGluIHRoZSByZXNwb25zZSkuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q2xpZW50U2Vzc2lvbkluZm8gfCB1bmRlZmluZWQ+fVxuICAgKi9cbiAgYXN5bmMgbWZhQ2xpZW50KCk6IFByb21pc2U8Q3ViZVNpZ25lckNsaWVudCB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICh0aGlzLiNtZmFSZXF1aXJlZCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgY29uc3Qgc2Vzc2lvbiA9ICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZD8uc2Vzc2lvbiA/PyB1bmRlZmluZWQ7XG4gICAgaWYgKHNlc3Npb24gPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgY29uc3QgZW52ID0gdGhpcy4jZW52O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyQ2xpZW50LmNyZWF0ZSh7XG4gICAgICBlbnY6IHtcbiAgICAgICAgXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCI6IGVudixcbiAgICAgIH0sXG4gICAgICBvcmdfaWQ6IHRoaXMuI21mYVJlcXVpcmVkLm9yZ19pZCxcbiAgICAgIHNlc3Npb25fZXhwOiBzZXNzaW9uLmV4cGlyYXRpb24sXG4gICAgICBzZXNzaW9uX2luZm86IHNlc3Npb24uc2Vzc2lvbl9pbmZvLFxuICAgICAgdG9rZW46IHNlc3Npb24udG9rZW4sXG4gICAgfSk7XG4gIH1cblxuICAvKiogQHJldHVybiB7VX0gVGhlIHJlc3BvbnNlIGRhdGEsIGlmIG5vIE1GQSBpcyByZXF1aXJlZCAqL1xuICBkYXRhKCk6IFUge1xuICAgIGlmICh0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBjYWxsIGBkYXRhKClgIHdoaWxlIE1GQSBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3AgYXMgVTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIHRvdHBBcHByb3ZlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgY29kZTogc3RyaW5nKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jbWZhVG90cFZvdGUoY2xpZW50LCBjb2RlLCBcImFwcHJvdmVcIik7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqL1xuICBhc3luYyB0b3RwUmVqZWN0KGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgY29kZTogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy4jbWZhVG90cFZvdGUoY2xpZW50LCBjb2RlLCBcInJlamVjdFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhbiBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqIEBwYXJhbSB7TWZhVm90ZX0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdFxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2YgcmVzdWJtaXR0aW5nIHRoZSByZXF1ZXN0IHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyAjbWZhVG90cFZvdGUoXG4gICAgY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LFxuICAgIGNvZGU6IHN0cmluZyxcbiAgICB2b3RlOiBNZmFWb3RlLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGlmICghdGhpcy5yZXF1aXJlc01mYSgpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25zdCBtZmFJZCA9IHRoaXMubWZhSWQoKTtcbiAgICBjb25zdCBtZmFPcmdJZCA9IHRoaXMuI21mYVJlcXVpcmVkIS5vcmdfaWQ7XG4gICAgY29uc3QgbWZhQXBwcm92YWwgPSBhd2FpdCBjbGllbnQuYXBpQ2xpZW50Lm1mYVZvdGVUb3RwKG1mYUlkLCBjb2RlLCB2b3RlKTtcbiAgICBjb25zdCBtZmFDb25mID0gbWZhQXBwcm92YWwucmVjZWlwdD8uY29uZmlybWF0aW9uO1xuXG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjV2l0aE1mYUFwcHJvdmFsKHsgbWZhSWQsIG1mYU9yZ0lkLCBtZmFDb25mIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4ge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHJldHVybiB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSBUaGUgcmVzdWx0IG9mIHJlc3VibWl0dGluZyB0aGUgcmVxdWVzdCB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZShjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNtZmFWb3RlKGNsaWVudCwgXCJhcHByb3ZlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGFuY2UgKGkuZS4sIGl0cyBzZXNzaW9uKS5cbiAgICpcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQ2xpZW50fSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKi9cbiAgYXN5bmMgcmVqZWN0KGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCkge1xuICAgIGF3YWl0IHRoaXMuI21mYVZvdGUoY2xpZW50LCBcInJlamVjdFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhbiBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7TWZhVm90ZX0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdFxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2YgcmVzdWJtaXR0aW5nIHRoZSByZXF1ZXN0IHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyAjbWZhVm90ZShjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGlmICghdGhpcy5yZXF1aXJlc01mYSgpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25zdCBtZmFJZCA9IHRoaXMuI21mYVJlcXVpcmVkIS5pZDtcbiAgICBjb25zdCBtZmFPcmdJZCA9IHRoaXMuI21mYVJlcXVpcmVkIS5vcmdfaWQ7XG5cbiAgICBjb25zdCBtZmFBcHByb3ZhbCA9IGF3YWl0IGNsaWVudC5hcGlDbGllbnQubWZhVm90ZUNzKG1mYUlkLCBtZmFWb3RlKTtcbiAgICBjb25zdCBtZmFDb25mID0gbWZhQXBwcm92YWwucmVjZWlwdD8uY29uZmlybWF0aW9uO1xuXG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjV2l0aE1mYUFwcHJvdmFsKHsgbWZhSWQsIG1mYU9yZ0lkLCBtZmFDb25mIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3VibWl0cyB0aGUgcmVxdWVzdCB3aXRoIGEgZ2l2ZW4gTUZBIHJlY2VpcHQgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBUaGUgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgYWZ0ZXIgTUZBIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBleGVjV2l0aE1mYUFwcHJvdmFsKG1mYVJlY2VpcHQ6IE1mYVJlY2VpcHQpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBDdWJlU2lnbmVyUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KTtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXJSZXNwb25zZSh0aGlzLiNlbnYsIHRoaXMuI3JlcXVlc3RGbiwgYXdhaXQgdGhpcy4jcmVxdWVzdEZuKGhlYWRlcnMpKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCB3aGVyZSB0aGUgcmVzcG9uc2UgY29tZXMgZnJvbVxuICAgKiBAcGFyYW0ge1JlcXVlc3RGbn0gcmVxdWVzdEZuXG4gICAqICAgIFRoZSBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoIGRpZmZlcmVudCBoZWFkZXJzIGlmIG5lZWRlZC5cbiAgICogQHBhcmFtIHtVIHwgQWNjZXB0ZWRSZXNwb25zZX0gcmVzcCBUaGUgcmVzcG9uc2UgYXMgcmV0dXJuZWQgYnkgdGhlIE9wZW5BUEkgY2xpZW50LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihlbnY6IEVudkludGVyZmFjZSwgcmVxdWVzdEZuOiBSZXF1ZXN0Rm48VT4sIHJlc3A6IFUgfCBBY2NlcHRlZFJlc3BvbnNlKSB7XG4gICAgdGhpcy4jZW52ID0gZW52O1xuICAgIHRoaXMuI3JlcXVlc3RGbiA9IHJlcXVlc3RGbjtcbiAgICB0aGlzLiNyZXNwID0gcmVzcDtcbiAgICB0aGlzLiNtZmFSZXF1aXJlZCA9ICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGF0aWMgY29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IHdoZXJlIHRoZSByZXNwb25zZSBjb21lcyBmcm9tXG4gICAqIEBwYXJhbSB7UmVxdWVzdEZufSByZXF1ZXN0Rm5cbiAgICogICAgVGhlIHJlcXVlc3QgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgIFRoaXMgYXJndW1lbnQgaXMgdXNlZCB0byByZXNlbmQgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj59IE5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VT4oXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgcmVxdWVzdEZuOiBSZXF1ZXN0Rm48VT4sXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3Qgc2VlZCA9IGF3YWl0IHJlcXVlc3RGbih0aGlzLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCkpO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lclJlc3BvbnNlKGVudiwgcmVxdWVzdEZuLCBzZWVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gSFRUUCBoZWFkZXJzIGNvbnRhaW5pbmcgYSBnaXZlbiBNRkEgcmVjZWlwdC5cbiAgICpcbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge0hlYWRlcnNJbml0fSBIZWFkZXJzIGluY2x1ZGluZyB0aGF0IHJlY2VpcHRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCk6IEhlYWRlcnNJbml0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gbWZhUmVjZWlwdFxuICAgICAgPyB7XG4gICAgICAgICAgXCJ4LWN1YmlzdC1tZmEtaWRcIjogbWZhUmVjZWlwdC5tZmFJZCxcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1vcmctaWRcIjogbWZhUmVjZWlwdC5tZmFPcmdJZCxcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1jb25maXJtYXRpb25cIjogbWZhUmVjZWlwdC5tZmFDb25mLFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19