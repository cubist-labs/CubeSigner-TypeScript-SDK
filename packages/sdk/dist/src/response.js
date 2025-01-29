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
 * @param resp Original response
 * @param mapFn Map to apply to the response value when its status code is 200.
 * @returns Response whose value for status code 200 is mapped from U to V
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
    /** @returns The MFA id associated with this request (if any) */
    mfaId() {
        return __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").id;
    }
    /** @returns True if this request requires an MFA approval */
    requiresMfa() {
        return __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f") !== undefined;
    }
    /**
     * @returns Session information to use for any MFA approval requests (if any was included in the response).
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
    /** @returns The response data, if no MFA is required */
    data() {
        if (this.requiresMfa()) {
            throw new Error("Cannot call `data()` while MFA is required");
        }
        return __classPrivateFieldGet(this, _CubeSignerResponse_resp, "f");
    }
    /**
     * Approve the MFA request using a given session and a TOTP code.
     *
     * @param client CubeSigner whose session to use
     * @param code 6-digit TOTP code
     * @returns The result of resubmitting the request with the approval
     */
    async totpApprove(client, code) {
        return await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaTotpVote).call(this, client, code, "approve");
    }
    /**
     * Reject the MFA request using a given session and a TOTP code.
     *
     * @param client CubeSigner whose session to use
     * @param code 6-digit TOTP code
     */
    async totpReject(client, code) {
        await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaTotpVote).call(this, client, code, "reject");
    }
    /**
     * Approve the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param client CubeSigner whose session to use
     * @returns The result of resubmitting the request with the approval
     */
    async approve(client) {
        return await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaVote).call(this, client, "approve");
    }
    /**
     * Reject the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param client CubeSigner whose session to use
     */
    async reject(client) {
        await __classPrivateFieldGet(this, _CubeSignerResponse_instances, "m", _CubeSignerResponse_mfaVote).call(this, client, "reject");
    }
    /**
     * Resubmits the request with a given MFA receipt(s) attached.
     *
     * @param mfaReceipt The MFA receipt(s)
     * @returns The result of signing after MFA approval
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
     *
     * @param env The environment where the response comes from
     * @param requestFn
     *    The function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param resp The response as returned by the OpenAPI client.
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
     *
     * @param env The environment where the response comes from
     * @param requestFn
     *    The request function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns New instance of this class.
     * @internal
     */
    static async create(env, requestFn, mfaReceipt) {
        const seed = await requestFn(this.getMfaHeaders(mfaReceipt));
        return new CubeSignerResponse(env, requestFn, seed);
    }
    /**
     * Return HTTP headers containing a given MFA receipt.
     *
     * @param mfaReceipt MFA receipt(s)
     * @returns Headers including {@link mfaReceipt}
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
 * @param client CubeSigner whose session to use
 * @param code 6-digit TOTP code
 * @param vote Approve or reject
 * @returns The result of resubmitting the request with the approval
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
 * @param client CubeSigner whose session to use
 * @param mfaVote Approve or reject
 * @returns The result of resubmitting the request with the approval
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBOEJBLGtDQU1DO0FBbkNELHdCQUF3RDtBQUN4RCxpQ0FBMkM7QUFvQjNDOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixXQUFXLENBQU8sSUFBaUIsRUFBRSxLQUFrQjtJQUNyRSxJQUFLLElBQXlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3JELE9BQU8sSUFBd0IsQ0FBQztJQUNsQyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sS0FBSyxDQUFDLElBQVMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGtCQUFrQjtJQVM3QixnRUFBZ0U7SUFDaEUsS0FBSztRQUNILE9BQU8sdUJBQUEsSUFBSSx1Q0FBYyxDQUFDLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsNkRBQTZEO0lBQzdELFdBQVc7UUFDVCxPQUFPLHVCQUFBLElBQUksdUNBQWEsS0FBSyxTQUFTLENBQUM7SUFDekMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFNBQVM7UUFDYixJQUFJLHVCQUFBLElBQUksdUNBQWEsS0FBSyxTQUFTO1lBQUUsT0FBTztRQUM1QyxNQUFNLE9BQU8sR0FBSSx1QkFBQSxJQUFJLGdDQUEyQixDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsT0FBTyxJQUFJLFNBQVMsQ0FBQztRQUM3RixJQUFJLE9BQU8sS0FBSyxTQUFTO1lBQUUsT0FBTztRQUVsQyxNQUFNLEdBQUcsR0FBRyx1QkFBQSxJQUFJLCtCQUFLLENBQUM7UUFDdEIsT0FBTyxNQUFNLG1CQUFnQixDQUFDLE1BQU0sQ0FBQztZQUNuQyxHQUFHLEVBQUU7Z0JBQ0gscUJBQXFCLEVBQUUsR0FBRzthQUMzQjtZQUNELE1BQU0sRUFBRSx1QkFBQSxJQUFJLHVDQUFh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QU8sR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztJQUVsRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFxQkQ7Ozs7OztHQU1HO0FBQ0gsS0FBSyxzQ0FBVSxNQUF3QixFQUFFLE9BQWdCO0lBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztRQUN4QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNLEtBQUssR0FBRyx1QkFBQSxJQUFJLHVDQUFjLENBQUMsRUFBRSxDQUFDO0lBQ3BDLE1BQU0sUUFBUSxHQUFHLHVCQUFBLElBQUksdUNBQWMsQ0FBQyxNQUFNLENBQUM7SUFFM0MsTUFBTSxXQUFXLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDckUsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUM7SUFFbEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsT0FBTyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUN0RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBNZmFWb3RlLCBFbnZJbnRlcmZhY2UsIE1mYVJlY2VpcHRzLCBNZmFSZXF1aXJlZCB9IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50LCBpc01hbnlNZmFSZWNlaXB0cyB9IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBlbmNvZGVUb0Jhc2U2NFVybCB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCB0eXBlIHsgQWNjZXB0ZWRSZXNwb25zZSB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuXG4vKipcbiAqIFJlc3BvbnNlIHR5cGUsIHdoaWNoIGNhbiBiZSBlaXRoZXIgYSB2YWx1ZSBvZiB0eXBlIHtAbGluayBVfVxuICogb3Ige0BsaW5rIEFjY2VwdGVkUmVzcG9uc2V9IChzdGF0dXMgY29kZSAyMDIpIHdoaWNoIHJlcXVpcmVzIE1GQS5cbiAqL1xuZXhwb3J0IHR5cGUgUmVzcG9uc2U8VT4gPSBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcblxuLyoqXG4gKiBSZXF1ZXN0IGZ1bmN0aW9uIHdoaWNoIG9wdGlvbmFsbHkgdGFrZXMgYWRkaXRpb25hbCBoZWFkZXJzXG4gKiAod2hpY2gsIGZvciBleGFtcGxlLCBjYW4gYmUgdXNlZCB0byBhdHRhY2ggYW4gTUZBIHJlY2VpcHQpLlxuICovXG5leHBvcnQgdHlwZSBSZXF1ZXN0Rm48VT4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiBQcm9taXNlPFJlc3BvbnNlPFU+PjtcblxuLyoqXG4gKiBNYXAgZnVuY3Rpb24gb2NjYXNpb25hbGx5IHVzZWQgdG8gbWFwIGEgcmVzcG9uc2UgZnJvbSB0aGUgQVBJIGludG8gYSBoaWdoZXItbGV2ZWwgdHlwZS5cbiAqL1xuZXhwb3J0IHR5cGUgTWFwRm48VSwgVj4gPSAodTogVSkgPT4gVjtcblxuLyoqXG4gKiBUYWtlIGEge0BsaW5rIFJlc3BvbnNlPFU+fSBhbmQgYSB7QGxpbmsgTWFwRm48VSwgVj59IGZ1bmN0aW9uIGFuZCByZXR1cm5cbiAqIGEge0BsaW5rIFJlc3BvbnNlPFY+fSB0aGF0IG1hcHMgdGhlIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCByZXNwb25zZSB3aGVuIGl0cyBzdGF0dXMgY29kZSBpcyAyMDAuXG4gKlxuICogQHBhcmFtIHJlc3AgT3JpZ2luYWwgcmVzcG9uc2VcbiAqIEBwYXJhbSBtYXBGbiBNYXAgdG8gYXBwbHkgdG8gdGhlIHJlc3BvbnNlIHZhbHVlIHdoZW4gaXRzIHN0YXR1cyBjb2RlIGlzIDIwMC5cbiAqIEByZXR1cm5zIFJlc3BvbnNlIHdob3NlIHZhbHVlIGZvciBzdGF0dXMgY29kZSAyMDAgaXMgbWFwcGVkIGZyb20gVSB0byBWXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXBSZXNwb25zZTxVLCBWPihyZXNwOiBSZXNwb25zZTxVPiwgbWFwRm46IE1hcEZuPFUsIFY+KTogUmVzcG9uc2U8Vj4ge1xuICBpZiAoKHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkKSB7XG4gICAgcmV0dXJuIHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFwRm4ocmVzcCBhcyBVKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgcmVzcG9uc2Ugb2YgYSBDdWJlU2lnbmVyIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyUmVzcG9uc2U8VT4ge1xuICByZWFkb25seSAjZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5ICNyZXF1ZXN0Rm46IFJlcXVlc3RGbjxVPjtcbiAgcmVhZG9ubHkgI3Jlc3A6IFUgfCBBY2NlcHRlZFJlc3BvbnNlO1xuICAvKipcbiAgICogT3B0aW9uYWwgTUZBIGlkLiBPbmx5IHNldCBpZiB0aGVyZSBpcyBhbiBNRkEgcmVxdWVzdCBhc3NvY2lhdGVkIHdpdGggdGhlIHJlcXVlc3RcbiAgICovXG4gIHJlYWRvbmx5ICNtZmFSZXF1aXJlZD86IE1mYVJlcXVpcmVkO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHJlcXVlc3QgKGlmIGFueSkgKi9cbiAgbWZhSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRydWUgaWYgdGhpcyByZXF1ZXN0IHJlcXVpcmVzIGFuIE1GQSBhcHByb3ZhbCAqL1xuICByZXF1aXJlc01mYSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jbWZhUmVxdWlyZWQgIT09IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBTZXNzaW9uIGluZm9ybWF0aW9uIHRvIHVzZSBmb3IgYW55IE1GQSBhcHByb3ZhbCByZXF1ZXN0cyAoaWYgYW55IHdhcyBpbmNsdWRlZCBpbiB0aGUgcmVzcG9uc2UpLlxuICAgKi9cbiAgYXN5bmMgbWZhQ2xpZW50KCk6IFByb21pc2U8Q3ViZVNpZ25lckNsaWVudCB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICh0aGlzLiNtZmFSZXF1aXJlZCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgY29uc3Qgc2Vzc2lvbiA9ICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZD8uc2Vzc2lvbiA/PyB1bmRlZmluZWQ7XG4gICAgaWYgKHNlc3Npb24gPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgY29uc3QgZW52ID0gdGhpcy4jZW52O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyQ2xpZW50LmNyZWF0ZSh7XG4gICAgICBlbnY6IHtcbiAgICAgICAgXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCI6IGVudixcbiAgICAgIH0sXG4gICAgICBvcmdfaWQ6IHRoaXMuI21mYVJlcXVpcmVkLm9yZ19pZCxcbiAgICAgIHNlc3Npb25fZXhwOiBzZXNzaW9uLmV4cGlyYXRpb24sXG4gICAgICBzZXNzaW9uX2luZm86IHNlc3Npb24uc2Vzc2lvbl9pbmZvLFxuICAgICAgdG9rZW46IHNlc3Npb24udG9rZW4sXG4gICAgICByZWZyZXNoX3Rva2VuOiBzZXNzaW9uLnJlZnJlc2hfdG9rZW4sXG4gICAgfSk7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHJlc3BvbnNlIGRhdGEsIGlmIG5vIE1GQSBpcyByZXF1aXJlZCAqL1xuICBkYXRhKCk6IFUge1xuICAgIGlmICh0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBjYWxsIGBkYXRhKClgIHdoaWxlIE1GQSBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3AgYXMgVTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIHRvdHBBcHByb3ZlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgY29kZTogc3RyaW5nKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jbWZhVG90cFZvdGUoY2xpZW50LCBjb2RlLCBcImFwcHJvdmVcIik7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICovXG4gIGFzeW5jIHRvdHBSZWplY3QoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBjb2RlOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNtZmFUb3RwVm90ZShjbGllbnQsIGNvZGUsIFwicmVqZWN0XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGFuIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcGFyYW0gY29kZSA2LWRpZ2l0IFRPVFAgY29kZVxuICAgKiBAcGFyYW0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdFxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHJlc3VibWl0dGluZyB0aGUgcmVxdWVzdCB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgI21mYVRvdHBWb3RlKFxuICAgIGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCxcbiAgICBjb2RlOiBzdHJpbmcsXG4gICAgdm90ZTogTWZhVm90ZSxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBpZiAoIXRoaXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLm1mYUlkKCk7XG4gICAgY29uc3QgbWZhT3JnSWQgPSB0aGlzLiNtZmFSZXF1aXJlZCEub3JnX2lkO1xuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY2xpZW50LmFwaUNsaWVudC5tZmFWb3RlVG90cChtZmFJZCwgY29kZSwgdm90ZSk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY1dpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGFwcHJvdmUoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jbWZhVm90ZShjbGllbnQsIFwiYXBwcm92ZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4ge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKi9cbiAgYXN5bmMgcmVqZWN0KGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCkge1xuICAgIGF3YWl0IHRoaXMuI21mYVZvdGUoY2xpZW50LCBcInJlamVjdFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhbiBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3RcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jICNtZmFWb3RlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgaWYgKCF0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY2xpZW50LmFwaUNsaWVudC5tZmFWb3RlQ3MobWZhSWQsIG1mYVZvdGUpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWNXaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdWJtaXRzIHRoZSByZXF1ZXN0IHdpdGggYSBnaXZlbiBNRkEgcmVjZWlwdChzKSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgVGhlIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2Ygc2lnbmluZyBhZnRlciBNRkEgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGV4ZWNXaXRoTWZhQXBwcm92YWwobWZhUmVjZWlwdDogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBDdWJlU2lnbmVyUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KTtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXJSZXNwb25zZSh0aGlzLiNlbnYsIHRoaXMuI3JlcXVlc3RGbiwgYXdhaXQgdGhpcy4jcmVxdWVzdEZuKGhlYWRlcnMpKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB3aGVyZSB0aGUgcmVzcG9uc2UgY29tZXMgZnJvbVxuICAgKiBAcGFyYW0gcmVxdWVzdEZuXG4gICAqICAgIFRoZSBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoIGRpZmZlcmVudCBoZWFkZXJzIGlmIG5lZWRlZC5cbiAgICogQHBhcmFtIHJlc3AgVGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGJ5IHRoZSBPcGVuQVBJIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoZW52OiBFbnZJbnRlcmZhY2UsIHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LCByZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZSkge1xuICAgIHRoaXMuI2VudiA9IGVudjtcbiAgICB0aGlzLiNyZXF1ZXN0Rm4gPSByZXF1ZXN0Rm47XG4gICAgdGhpcy4jcmVzcCA9IHJlc3A7XG4gICAgdGhpcy4jbWZhUmVxdWlyZWQgPSAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQ7XG4gIH1cblxuICAvKipcbiAgICogU3RhdGljIGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB3aGVyZSB0aGUgcmVzcG9uc2UgY29tZXMgZnJvbVxuICAgKiBAcGFyYW0gcmVxdWVzdEZuXG4gICAqICAgIFRoZSByZXF1ZXN0IGZ1bmN0aW9uIHRoYXQgdGhpcyByZXNwb25zZSBpcyBmcm9tLlxuICAgKiAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGggZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBOZXcgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlPFU+KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBzZWVkID0gYXdhaXQgcmVxdWVzdEZuKHRoaXMuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KSk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyUmVzcG9uc2UoZW52LCByZXF1ZXN0Rm4sIHNlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBIVFRQIGhlYWRlcnMgY29udGFpbmluZyBhIGdpdmVuIE1GQSByZWNlaXB0LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBIZWFkZXJzIGluY2x1ZGluZyB7QGxpbmsgbWZhUmVjZWlwdH1cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBIZWFkZXJzSW5pdCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKG1mYVJlY2VpcHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCByZWMgPSBpc01hbnlNZmFSZWNlaXB0cyhtZmFSZWNlaXB0KVxuICAgICAgPyBtZmFSZWNlaXB0XG4gICAgICA6IHtcbiAgICAgICAgICBvcmdJZDogbWZhUmVjZWlwdC5tZmFPcmdJZCxcbiAgICAgICAgICByZWNlaXB0czogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogbWZhUmVjZWlwdC5tZmFJZCxcbiAgICAgICAgICAgICAgY29uZmlybWF0aW9uOiBtZmFSZWNlaXB0Lm1mYUNvbmYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG5cbiAgICBpZiAocmVjLnJlY2VpcHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgIHJldHVybiB7XG4gICAgICBcIngtY3ViaXN0LW1mYS1vcmctaWRcIjogcmVjLm9yZ0lkLFxuICAgICAgXCJ4LWN1YmlzdC1tZmEtcmVjZWlwdHNcIjogZW5jb2RlVG9CYXNlNjRVcmwodGV4dEVuY29kZXIuZW5jb2RlKEpTT04uc3RyaW5naWZ5KHJlYy5yZWNlaXB0cykpKSxcbiAgICB9O1xuICB9XG59XG4iXX0=