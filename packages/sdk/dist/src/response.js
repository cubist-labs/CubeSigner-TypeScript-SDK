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
exports.CubeSignerResponse = void 0;
exports.mapResponse = mapResponse;
const _1 = require(".");
const util_1 = require("./util");
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
            refresh_token: session.refresh_token,
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
     * Resubmits the request with a given MFA receipt(s) attached.
     *
     * @param {MfaReceipts} mfaReceipt The MFA receipt(s)
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
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
     * @param {MfaReceipts} mfaReceipt MFA receipt(s)
     * @return {HeadersInit} Headers including {@link mfaReceipt}
     * @internal
     */
    static getMfaHeaders(mfaReceipt) {
        if (mfaReceipt === undefined) {
            return undefined;
        }
        const rec = (0, _1.isManyMfaReceipts)(mfaReceipt)
            ? mfaReceipt
            : {
                orgId: mfaReceipt.mfaOrgId,
                receipts: [
                    {
                        id: mfaReceipt.mfaId,
                        confirmation: mfaReceipt.mfaConf,
                    },
                ],
            };
        if (rec.receipts.length === 0) {
            return undefined;
        }
        const textEncoder = new TextEncoder();
        return {
            "x-cubist-mfa-org-id": rec.orgId,
            "x-cubist-mfa-receipts": (0, util_1.encodeToBase64Url)(textEncoder.encode(JSON.stringify(rec.receipts))),
        };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBOEJBLGtDQU1DO0FBbkNELHdCQUF3RDtBQUN4RCxpQ0FBMkM7QUFvQjNDOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixXQUFXLENBQU8sSUFBaUIsRUFBRSxLQUFrQjtJQUNyRSxJQUFLLElBQXlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3JELE9BQU8sSUFBd0IsQ0FBQztJQUNsQyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sS0FBSyxDQUFDLElBQVMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7QUFDSCxDQUFDO0FBV0Q7O0dBRUc7QUFDSCxNQUFhLGtCQUFrQjtJQVM3Qix3RUFBd0U7SUFDeEUsS0FBSztRQUNILE9BQU8sdUJBQUEsSUFBSSx1Q0FBYyxDQUFDLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsc0VBQXNFO0lBQ3RFLFdBQVc7UUFDVCxPQUFPLHVCQUFBLElBQUksdUNBQWEsS0FBSyxTQUFTLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxTQUFTO1FBQ2IsSUFBSSx1QkFBQSxJQUFJLHVDQUFhLEtBQUssU0FBUztZQUFFLE9BQU87UUFDNUMsTUFBTSxPQUFPLEdBQUksdUJBQUEsSUFBSSxnQ0FBMkIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLE9BQU8sSUFBSSxTQUFTLENBQUM7UUFDN0YsSUFBSSxPQUFPLEtBQUssU0FBUztZQUFFLE9BQU87UUFFbEMsTUFBTSxHQUFHLEdBQUcsdUJBQUEsSUFBSSwrQkFBSyxDQUFDO1FBQ3RCLE9BQU8sTUFBTSxtQkFBZ0IsQ0FBQyxNQUFNLENBQUM7WUFDbkMsR0FBRyxFQUFFO2dCQUNILHFCQUFxQixFQUFFLEdBQUc7YUFDM0I7WUFDRCxNQUFNLEVBQUUsdUJBQUEsSUFBSSx1Q0FB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TyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO0lBRWxELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQXFCRDs7Ozs7O0dBTUc7QUFDSCxLQUFLLHNDQUFVLE1BQXdCLEVBQUUsT0FBZ0I7SUFDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFHLHVCQUFBLElBQUksdUNBQWMsQ0FBQyxFQUFFLENBQUM7SUFDcEMsTUFBTSxRQUFRLEdBQUcsdUJBQUEsSUFBSSx1Q0FBYyxDQUFDLE1BQU0sQ0FBQztJQUUzQyxNQUFNLFdBQVcsR0FBRyxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNyRSxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztJQUVsRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3RFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IE1mYVZvdGUsIEVudkludGVyZmFjZSwgTWZhUmVjZWlwdHMgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCwgaXNNYW55TWZhUmVjZWlwdHMgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgZW5jb2RlVG9CYXNlNjRVcmwgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgdHlwZSB7IEFjY2VwdGVkUmVzcG9uc2UsIE5ld1Nlc3Npb25SZXNwb25zZSB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuXG4vKipcbiAqIFJlc3BvbnNlIHR5cGUsIHdoaWNoIGNhbiBiZSBlaXRoZXIgYSB2YWx1ZSBvZiB0eXBlIHtAbGluayBVfVxuICogb3Ige0BsaW5rIEFjY2VwdGVkUmVzcG9uc2V9IChzdGF0dXMgY29kZSAyMDIpIHdoaWNoIHJlcXVpcmVzIE1GQS5cbiAqL1xuZXhwb3J0IHR5cGUgUmVzcG9uc2U8VT4gPSBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcblxuLyoqXG4gKiBSZXF1ZXN0IGZ1bmN0aW9uIHdoaWNoIG9wdGlvbmFsbHkgdGFrZXMgYWRkaXRpb25hbCBoZWFkZXJzXG4gKiAod2hpY2gsIGZvciBleGFtcGxlLCBjYW4gYmUgdXNlZCB0byBhdHRhY2ggYW4gTUZBIHJlY2VpcHQpLlxuICovXG5leHBvcnQgdHlwZSBSZXF1ZXN0Rm48VT4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiBQcm9taXNlPFJlc3BvbnNlPFU+PjtcblxuLyoqXG4gKiBNYXAgZnVuY3Rpb24gb2NjYXNpb25hbGx5IHVzZWQgdG8gbWFwIGEgcmVzcG9uc2UgZnJvbSB0aGUgQVBJIGludG8gYSBoaWdoZXItbGV2ZWwgdHlwZS5cbiAqL1xuZXhwb3J0IHR5cGUgTWFwRm48VSwgVj4gPSAodTogVSkgPT4gVjtcblxuLyoqXG4gKiBUYWtlIGEge0BsaW5rIFJlc3BvbnNlPFU+fSBhbmQgYSB7QGxpbmsgTWFwRm48VSwgVj59IGZ1bmN0aW9uIGFuZCByZXR1cm5cbiAqIGEge0BsaW5rIFJlc3BvbnNlPFY+fSB0aGF0IG1hcHMgdGhlIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCByZXNwb25zZSB3aGVuIGl0cyBzdGF0dXMgY29kZSBpcyAyMDAuXG4gKlxuICogQHBhcmFtIHtSZXNwb25zZTxVPn0gcmVzcCBPcmlnaW5hbCByZXNwb25zZVxuICogQHBhcmFtIHtNYXA8VSwgVj59IG1hcEZuIE1hcCB0byBhcHBseSB0byB0aGUgcmVzcG9uc2UgdmFsdWUgd2hlbiBpdHMgc3RhdHVzIGNvZGUgaXMgMjAwLlxuICogQHJldHVybiB7UmVzcG9uc2U8Vj59IFJlc3BvbnNlIHdob3NlIHZhbHVlIGZvciBzdGF0dXMgY29kZSAyMDAgaXMgbWFwcGVkIGZyb20gVSB0byBWXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXBSZXNwb25zZTxVLCBWPihyZXNwOiBSZXNwb25zZTxVPiwgbWFwRm46IE1hcEZuPFUsIFY+KTogUmVzcG9uc2U8Vj4ge1xuICBpZiAoKHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkKSB7XG4gICAgcmV0dXJuIHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFwRm4ocmVzcCBhcyBVKTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1mYVJlcXVpcmVkIHtcbiAgLyoqIE9yZyBpZCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIE1GQSByZXF1ZXN0IGlkICovXG4gIGlkOiBzdHJpbmc7XG4gIC8qKiBPcHRpb25hbCBNRkEgc2Vzc2lvbiAqL1xuICBzZXNzaW9uPzogTmV3U2Vzc2lvblJlc3BvbnNlIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBBIHJlc3BvbnNlIG9mIGEgQ3ViZVNpZ25lciByZXF1ZXN0LlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lclJlc3BvbnNlPFU+IHtcbiAgcmVhZG9ubHkgI2VudjogRW52SW50ZXJmYWNlO1xuICByZWFkb25seSAjcmVxdWVzdEZuOiBSZXF1ZXN0Rm48VT47XG4gIHJlYWRvbmx5ICNyZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcbiAgLyoqXG4gICAqIE9wdGlvbmFsIE1GQSBpZC4gT25seSBzZXQgaWYgdGhlcmUgaXMgYW4gTUZBIHJlcXVlc3QgYXNzb2NpYXRlZCB3aXRoIHRoZSByZXF1ZXN0XG4gICAqL1xuICByZWFkb25seSAjbWZhUmVxdWlyZWQ/OiBNZmFSZXF1aXJlZDtcblxuICAvKiogQHJldHVybiB7c3RyaW5nfSBUaGUgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHJlcXVlc3QgKGlmIGFueSkgKi9cbiAgbWZhSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhpcyByZXF1ZXN0IHJlcXVpcmVzIGFuIE1GQSBhcHByb3ZhbCAqL1xuICByZXF1aXJlc01mYSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jbWZhUmVxdWlyZWQgIT09IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gc2Vzc2lvbiBpbmZvcm1hdGlvbiB0byB1c2UgZm9yIGFueSBNRkEgYXBwcm92YWwgcmVxdWVzdHMgKGlmIGFueSB3YXMgaW5jbHVkZWQgaW4gdGhlIHJlc3BvbnNlKS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDbGllbnRTZXNzaW9uSW5mbyB8IHVuZGVmaW5lZD59XG4gICAqL1xuICBhc3luYyBtZmFDbGllbnQoKTogUHJvbWlzZTxDdWJlU2lnbmVyQ2xpZW50IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMuI21mYVJlcXVpcmVkID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICBjb25zdCBzZXNzaW9uID0gKHRoaXMuI3Jlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkPy5zZXNzaW9uID8/IHVuZGVmaW5lZDtcbiAgICBpZiAoc2Vzc2lvbiA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cbiAgICBjb25zdCBlbnYgPSB0aGlzLiNlbnY7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJDbGllbnQuY3JlYXRlKHtcbiAgICAgIGVudjoge1xuICAgICAgICBcIkRldi1DdWJlU2lnbmVyU3RhY2tcIjogZW52LFxuICAgICAgfSxcbiAgICAgIG9yZ19pZDogdGhpcy4jbWZhUmVxdWlyZWQub3JnX2lkLFxuICAgICAgc2Vzc2lvbl9leHA6IHNlc3Npb24uZXhwaXJhdGlvbixcbiAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbi5zZXNzaW9uX2luZm8sXG4gICAgICB0b2tlbjogc2Vzc2lvbi50b2tlbixcbiAgICAgIHJlZnJlc2hfdG9rZW46IHNlc3Npb24ucmVmcmVzaF90b2tlbixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtVfSBUaGUgcmVzcG9uc2UgZGF0YSwgaWYgbm8gTUZBIGlzIHJlcXVpcmVkICovXG4gIGRhdGEoKTogVSB7XG4gICAgaWYgKHRoaXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNhbGwgYGRhdGEoKWAgd2hpbGUgTUZBIGlzIHJlcXVpcmVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jcmVzcCBhcyBVO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSBUaGUgcmVzdWx0IG9mIHJlc3VibWl0dGluZyB0aGUgcmVxdWVzdCB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgdG90cEFwcHJvdmUoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNtZmFUb3RwVm90ZShjbGllbnQsIGNvZGUsIFwiYXBwcm92ZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICovXG4gIGFzeW5jIHRvdHBSZWplY3QoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBjb2RlOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNtZmFUb3RwVm90ZShjbGllbnQsIGNvZGUsIFwicmVqZWN0XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGFuIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHBhcmFtIHtNZmFWb3RlfSB2b3RlIEFwcHJvdmUgb3IgcmVqZWN0XG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jICNtZmFUb3RwVm90ZShcbiAgICBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsXG4gICAgY29kZTogc3RyaW5nLFxuICAgIHZvdGU6IE1mYVZvdGUsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgaWYgKCF0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYUlkID0gdGhpcy5tZmFJZCgpO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcbiAgICBjb25zdCBtZmFBcHByb3ZhbCA9IGF3YWl0IGNsaWVudC5hcGlDbGllbnQubWZhVm90ZVRvdHAobWZhSWQsIGNvZGUsIHZvdGUpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWNXaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGFuY2UgKGkuZS4sIGl0cyBzZXNzaW9uKS5cbiAgICpcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQ2xpZW50fSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2YgcmVzdWJtaXR0aW5nIHRoZSByZXF1ZXN0IHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBhcHByb3ZlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI21mYVZvdGUoY2xpZW50LCBcImFwcHJvdmVcIik7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqL1xuICBhc3luYyByZWplY3QoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50KSB7XG4gICAgYXdhaXQgdGhpcy4jbWZhVm90ZShjbGllbnQsIFwicmVqZWN0XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGFuIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4ge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtNZmFWb3RlfSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0XG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jICNtZmFWb3RlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgaWYgKCF0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY2xpZW50LmFwaUNsaWVudC5tZmFWb3RlQ3MobWZhSWQsIG1mYVZvdGUpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWNXaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdWJtaXRzIHRoZSByZXF1ZXN0IHdpdGggYSBnaXZlbiBNRkEgcmVjZWlwdChzKSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBUaGUgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgYWZ0ZXIgTUZBIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBleGVjV2l0aE1mYUFwcHJvdmFsKG1mYVJlY2VpcHQ6IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBoZWFkZXJzID0gQ3ViZVNpZ25lclJlc3BvbnNlLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyUmVzcG9uc2UodGhpcy4jZW52LCB0aGlzLiNyZXF1ZXN0Rm4sIGF3YWl0IHRoaXMuI3JlcXVlc3RGbihoZWFkZXJzKSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgd2hlcmUgdGhlIHJlc3BvbnNlIGNvbWVzIGZyb21cbiAgICogQHBhcmFtIHtSZXF1ZXN0Rm59IHJlcXVlc3RGblxuICAgKiAgICBUaGUgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgIFRoaXMgYXJndW1lbnQgaXMgdXNlZCB0byByZXNlbmQgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7VSB8IEFjY2VwdGVkUmVzcG9uc2V9IHJlc3AgVGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGJ5IHRoZSBPcGVuQVBJIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoZW52OiBFbnZJbnRlcmZhY2UsIHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LCByZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZSkge1xuICAgIHRoaXMuI2VudiA9IGVudjtcbiAgICB0aGlzLiNyZXF1ZXN0Rm4gPSByZXF1ZXN0Rm47XG4gICAgdGhpcy4jcmVzcCA9IHJlc3A7XG4gICAgdGhpcy4jbWZhUmVxdWlyZWQgPSAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQ7XG4gIH1cblxuICAvKipcbiAgICogU3RhdGljIGNvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCB3aGVyZSB0aGUgcmVzcG9uc2UgY29tZXMgZnJvbVxuICAgKiBAcGFyYW0ge1JlcXVlc3RGbn0gcmVxdWVzdEZuXG4gICAqICAgIFRoZSByZXF1ZXN0IGZ1bmN0aW9uIHRoYXQgdGhpcyByZXNwb25zZSBpcyBmcm9tLlxuICAgKiAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGggZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHRzfSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+Pn0gTmV3IGluc3RhbmNlIG9mIHRoaXMgY2xhc3MuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxVPihcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICByZXF1ZXN0Rm46IFJlcXVlc3RGbjxVPixcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3Qgc2VlZCA9IGF3YWl0IHJlcXVlc3RGbih0aGlzLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCkpO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lclJlc3BvbnNlKGVudiwgcmVxdWVzdEZuLCBzZWVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gSFRUUCBoZWFkZXJzIGNvbnRhaW5pbmcgYSBnaXZlbiBNRkEgcmVjZWlwdC5cbiAgICpcbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJuIHtIZWFkZXJzSW5pdH0gSGVhZGVycyBpbmNsdWRpbmcge0BsaW5rIG1mYVJlY2VpcHR9XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGdldE1mYUhlYWRlcnMobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogSGVhZGVyc0luaXQgfCB1bmRlZmluZWQge1xuICAgIGlmIChtZmFSZWNlaXB0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgcmVjID0gaXNNYW55TWZhUmVjZWlwdHMobWZhUmVjZWlwdClcbiAgICAgID8gbWZhUmVjZWlwdFxuICAgICAgOiB7XG4gICAgICAgICAgb3JnSWQ6IG1mYVJlY2VpcHQubWZhT3JnSWQsXG4gICAgICAgICAgcmVjZWlwdHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6IG1mYVJlY2VpcHQubWZhSWQsXG4gICAgICAgICAgICAgIGNvbmZpcm1hdGlvbjogbWZhUmVjZWlwdC5tZmFDb25mLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9O1xuXG4gICAgaWYgKHJlYy5yZWNlaXB0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICByZXR1cm4ge1xuICAgICAgXCJ4LWN1YmlzdC1tZmEtb3JnLWlkXCI6IHJlYy5vcmdJZCxcbiAgICAgIFwieC1jdWJpc3QtbWZhLXJlY2VpcHRzXCI6IGVuY29kZVRvQmFzZTY0VXJsKHRleHRFbmNvZGVyLmVuY29kZShKU09OLnN0cmluZ2lmeShyZWMucmVjZWlwdHMpKSksXG4gICAgfTtcbiAgfVxufVxuIl19