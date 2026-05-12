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
var _CubeSignerResponse_instances, _CubeSignerResponse_env, _CubeSignerResponse_requestFn, _CubeSignerResponse_resp, _CubeSignerResponse_mfaTotpVote, _CubeSignerResponse_mfaVote;
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
    if (asAccepted(resp) !== undefined) {
        return resp;
    }
    else {
        return mapFn(resp);
    }
}
/**
 * @param resp The response to check
 * @returns The {@link AcceptedValue} if the response status code is 202.
 */
function asAccepted(resp) {
    const acceptedResp = resp;
    return acceptedResp.error_code === "SignDryRun" || acceptedResp.error_code === "MfaRequired"
        ? (acceptedResp.accepted ?? undefined)
        : undefined;
}
/**
 * A response of a CubeSigner request.
 */
class CubeSignerResponse {
    /**
     * @returns The {@link AcceptedValue} if the response status code is 202.
     */
    asAccepted() {
        return asAccepted(__classPrivateFieldGet(this, _CubeSignerResponse_resp, "f"));
    }
    /**
     * @returns The associated {@link MfaRequired} value, if the response status code is 202 and the response indicates that MFA is required.
     */
    asMfaRequired() {
        return this.asAccepted()?.MfaRequired ?? undefined;
    }
    /**
     * @returns The associated {@link SignDryRun} value, if the response status code is 202 and the response is a dry run of a sign operation.
     */
    asSignDryRun() {
        return this.asAccepted()?.SignDryRun ?? undefined;
    }
    /**
     * @returns The associated {@link BinanceDryRun} value, if the response status code is 202 and the response is a dry run of a sign operation.
     */
    asBinanceDryRun() {
        return this.asAccepted()?.BinanceDryRun ?? undefined;
    }
    /**
     * @returns Whether this response is a "200 Success" (in which case it is safe to call {@link data})
     */
    isSuccess() {
        return this.asAccepted() === undefined;
    }
    /**
     * @returns The underlying {@link MfaRequired} response (if any).
     */
    get mfaRequired() {
        return this.asAccepted()?.MfaRequired;
    }
    /** @returns The first MFA id associated with this request (if any) */
    mfaId() {
        return this.mfaRequired?.id;
    }
    /** @returns The MFA ids associated with this request (if any) */
    mfaIds() {
        return this.mfaRequired?.ids ?? [];
    }
    /** @returns True if this request requires an MFA approval */
    requiresMfa() {
        return this.mfaRequired !== undefined;
    }
    /**
     * @returns Session information to use for any MFA approval requests (if any was included in the response).
     */
    async mfaClient() {
        if (this.mfaRequired === undefined)
            return;
        const session = this.asMfaRequired()?.session ?? undefined;
        if (session === undefined)
            return;
        return await _1.CubeSignerClient.create({
            env: __classPrivateFieldGet(this, _CubeSignerResponse_env, "f").spec,
            org_id: this.mfaRequired.org_id,
            session_exp: session.expiration,
            session_info: session.session_info,
            token: session.token,
            refresh_token: session.refresh_token,
        });
    }
    /** @returns The response data, if no MFA is required */
    data() {
        if (!this.isSuccess()) {
            throw new Error("Cannot call `data()` on a 202 Accepted response; use `asMfaRequired()` or `asSignDryRun()`");
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
        __classPrivateFieldSet(this, _CubeSignerResponse_env, env, "f");
        __classPrivateFieldSet(this, _CubeSignerResponse_requestFn, requestFn, "f");
        __classPrivateFieldSet(this, _CubeSignerResponse_resp, resp, "f");
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
        return new CubeSignerResponse(_1.MultiRegionEnv.create(env), requestFn, seed);
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
_CubeSignerResponse_env = new WeakMap(), _CubeSignerResponse_requestFn = new WeakMap(), _CubeSignerResponse_resp = new WeakMap(), _CubeSignerResponse_instances = new WeakSet(), _CubeSignerResponse_mfaTotpVote = 
/**
 * Approve or reject an MFA request using a given session and a TOTP code.
 *
 * @param client CubeSigner whose session to use
 * @param code 6-digit TOTP code
 * @param vote Approve or reject
 * @returns The result of resubmitting the request with the approval
 */
async function _CubeSignerResponse_mfaTotpVote(client, code, vote) {
    const mfaId = this.mfaId();
    if (mfaId === undefined) {
        return this;
    }
    const mfaOrgId = this.mfaRequired.org_id;
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
    const mfaId = this.mfaId();
    if (mfaId === undefined) {
        return this;
    }
    const mfaOrgId = this.mfaRequired.org_id;
    const mfaApproval = await client.apiClient.mfaVoteCs(mfaId, mfaVote);
    const mfaConf = mfaApproval.receipt?.confirmation;
    if (!mfaConf) {
        return this;
    }
    return await this.execWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBOEJBLGtDQU1DO0FBbkNELHdCQUF3RTtBQUN4RSxpQ0FBMkM7QUFvQjNDOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixXQUFXLENBQU8sSUFBaUIsRUFBRSxLQUFrQjtJQUNyRSxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUNuQyxPQUFPLElBQXdCLENBQUM7SUFDbEMsQ0FBQztTQUFNLENBQUM7UUFDTixPQUFPLEtBQUssQ0FBQyxJQUFTLENBQUMsQ0FBQztJQUMxQixDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsVUFBVSxDQUFJLElBQWlCO0lBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQXdCLENBQUM7SUFDOUMsT0FBTyxZQUFZLENBQUMsVUFBVSxLQUFLLFlBQVksSUFBSSxZQUFZLENBQUMsVUFBVSxLQUFLLGFBQWE7UUFDMUYsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUM7UUFDdEMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNoQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGtCQUFrQjtJQUs3Qjs7T0FFRztJQUNILFVBQVU7UUFDUixPQUFPLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLGdDQUFNLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhO1FBQ1gsT0FBTyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsV0FBVyxJQUFJLFNBQVMsQ0FBQztJQUNyRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxZQUFZO1FBQ1YsT0FBTyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsVUFBVSxJQUFJLFNBQVMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxlQUFlO1FBQ2Is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T0FBZ0I7SUFDdkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzNCLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFZLENBQUMsTUFBTSxDQUFDO0lBRTFDLE1BQU0sV0FBVyxHQUFHLE1BQU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JFLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO0lBRWxELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWZhVm90ZSwgRW52SW50ZXJmYWNlLCBNZmFSZWNlaXB0cywgTWZhUmVxdWlyZWQgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCwgTXVsdGlSZWdpb25FbnYsIGlzTWFueU1mYVJlY2VpcHRzIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGVuY29kZVRvQmFzZTY0VXJsIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHR5cGUgeyBBY2NlcHRlZFJlc3BvbnNlLCBBY2NlcHRlZFZhbHVlLCBCaW5hbmNlRHJ5UnVuLCBTaWduRHJ5UnVuIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8qKlxuICogUmVzcG9uc2UgdHlwZSwgd2hpY2ggY2FuIGJlIGVpdGhlciBhIHZhbHVlIG9mIHR5cGUge0BsaW5rIFV9XG4gKiBvciB7QGxpbmsgQWNjZXB0ZWRSZXNwb25zZX0gKHN0YXR1cyBjb2RlIDIwMikgd2hpY2ggcmVxdWlyZXMgTUZBLlxuICovXG5leHBvcnQgdHlwZSBSZXNwb25zZTxVPiA9IFUgfCBBY2NlcHRlZFJlc3BvbnNlO1xuXG4vKipcbiAqIFJlcXVlc3QgZnVuY3Rpb24gd2hpY2ggb3B0aW9uYWxseSB0YWtlcyBhZGRpdGlvbmFsIGhlYWRlcnNcbiAqICh3aGljaCwgZm9yIGV4YW1wbGUsIGNhbiBiZSB1c2VkIHRvIGF0dGFjaCBhbiBNRkEgcmVjZWlwdCkuXG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVlc3RGbjxVPiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IFByb21pc2U8UmVzcG9uc2U8VT4+O1xuXG4vKipcbiAqIE1hcCBmdW5jdGlvbiBvY2Nhc2lvbmFsbHkgdXNlZCB0byBtYXAgYSByZXNwb25zZSBmcm9tIHRoZSBBUEkgaW50byBhIGhpZ2hlci1sZXZlbCB0eXBlLlxuICovXG5leHBvcnQgdHlwZSBNYXBGbjxVLCBWPiA9ICh1OiBVKSA9PiBWO1xuXG4vKipcbiAqIFRha2UgYSB7QGxpbmsgUmVzcG9uc2U8VT59IGFuZCBhIHtAbGluayBNYXBGbjxVLCBWPn0gZnVuY3Rpb24gYW5kIHJldHVyblxuICogYSB7QGxpbmsgUmVzcG9uc2U8Vj59IHRoYXQgbWFwcyB0aGUgdmFsdWUgb2YgdGhlIG9yaWdpbmFsIHJlc3BvbnNlIHdoZW4gaXRzIHN0YXR1cyBjb2RlIGlzIDIwMC5cbiAqXG4gKiBAcGFyYW0gcmVzcCBPcmlnaW5hbCByZXNwb25zZVxuICogQHBhcmFtIG1hcEZuIE1hcCB0byBhcHBseSB0byB0aGUgcmVzcG9uc2UgdmFsdWUgd2hlbiBpdHMgc3RhdHVzIGNvZGUgaXMgMjAwLlxuICogQHJldHVybnMgUmVzcG9uc2Ugd2hvc2UgdmFsdWUgZm9yIHN0YXR1cyBjb2RlIDIwMCBpcyBtYXBwZWQgZnJvbSBVIHRvIFZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcFJlc3BvbnNlPFUsIFY+KHJlc3A6IFJlc3BvbnNlPFU+LCBtYXBGbjogTWFwRm48VSwgVj4pOiBSZXNwb25zZTxWPiB7XG4gIGlmIChhc0FjY2VwdGVkKHJlc3ApICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYXBGbihyZXNwIGFzIFUpO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHJlc3AgVGhlIHJlc3BvbnNlIHRvIGNoZWNrXG4gKiBAcmV0dXJucyBUaGUge0BsaW5rIEFjY2VwdGVkVmFsdWV9IGlmIHRoZSByZXNwb25zZSBzdGF0dXMgY29kZSBpcyAyMDIuXG4gKi9cbmZ1bmN0aW9uIGFzQWNjZXB0ZWQ8VT4ocmVzcDogUmVzcG9uc2U8VT4pOiBBY2NlcHRlZFZhbHVlIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgYWNjZXB0ZWRSZXNwID0gcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlO1xuICByZXR1cm4gYWNjZXB0ZWRSZXNwLmVycm9yX2NvZGUgPT09IFwiU2lnbkRyeVJ1blwiIHx8IGFjY2VwdGVkUmVzcC5lcnJvcl9jb2RlID09PSBcIk1mYVJlcXVpcmVkXCJcbiAgICA/IChhY2NlcHRlZFJlc3AuYWNjZXB0ZWQgPz8gdW5kZWZpbmVkKVxuICAgIDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEEgcmVzcG9uc2Ugb2YgYSBDdWJlU2lnbmVyIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyUmVzcG9uc2U8VT4ge1xuICByZWFkb25seSAjZW52OiBNdWx0aVJlZ2lvbkVudjtcbiAgcmVhZG9ubHkgI3JlcXVlc3RGbjogUmVxdWVzdEZuPFU+O1xuICByZWFkb25seSAjcmVzcDogUmVzcG9uc2U8VT47XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB7QGxpbmsgQWNjZXB0ZWRWYWx1ZX0gaWYgdGhlIHJlc3BvbnNlIHN0YXR1cyBjb2RlIGlzIDIwMi5cbiAgICovXG4gIGFzQWNjZXB0ZWQoKTogQWNjZXB0ZWRWYWx1ZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGFzQWNjZXB0ZWQodGhpcy4jcmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGFzc29jaWF0ZWQge0BsaW5rIE1mYVJlcXVpcmVkfSB2YWx1ZSwgaWYgdGhlIHJlc3BvbnNlIHN0YXR1cyBjb2RlIGlzIDIwMiBhbmQgdGhlIHJlc3BvbnNlIGluZGljYXRlcyB0aGF0IE1GQSBpcyByZXF1aXJlZC5cbiAgICovXG4gIGFzTWZhUmVxdWlyZWQoKTogTWZhUmVxdWlyZWQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmFzQWNjZXB0ZWQoKT8uTWZhUmVxdWlyZWQgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBhc3NvY2lhdGVkIHtAbGluayBTaWduRHJ5UnVufSB2YWx1ZSwgaWYgdGhlIHJlc3BvbnNlIHN0YXR1cyBjb2RlIGlzIDIwMiBhbmQgdGhlIHJlc3BvbnNlIGlzIGEgZHJ5IHJ1biBvZiBhIHNpZ24gb3BlcmF0aW9uLlxuICAgKi9cbiAgYXNTaWduRHJ5UnVuKCk6IFNpZ25EcnlSdW4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmFzQWNjZXB0ZWQoKT8uU2lnbkRyeVJ1biA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGFzc29jaWF0ZWQge0BsaW5rIEJpbmFuY2VEcnlSdW59IHZhbHVlLCBpZiB0aGUgcmVzcG9uc2Ugc3RhdHVzIGNvZGUgaXMgMjAyIGFuZCB0aGUgcmVzcG9uc2UgaXMgYSBkcnkgcnVuIG9mIGEgc2lnbiBvcGVyYXRpb24uXG4gICAqL1xuICBhc0JpbmFuY2VEcnlSdW4oKTogQmluYW5jZURyeVJ1biB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuYXNBY2NlcHRlZCgpPy5CaW5hbmNlRHJ5UnVuID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoaXMgcmVzcG9uc2UgaXMgYSBcIjIwMCBTdWNjZXNzXCIgKGluIHdoaWNoIGNhc2UgaXQgaXMgc2FmZSB0byBjYWxsIHtAbGluayBkYXRhfSlcbiAgICovXG4gIGlzU3VjY2VzcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hc0FjY2VwdGVkKCkgPT09IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgdW5kZXJseWluZyB7QGxpbmsgTWZhUmVxdWlyZWR9IHJlc3BvbnNlIChpZiBhbnkpLlxuICAgKi9cbiAgcHJpdmF0ZSBnZXQgbWZhUmVxdWlyZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXNBY2NlcHRlZCgpPy5NZmFSZXF1aXJlZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgZmlyc3QgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHJlcXVlc3QgKGlmIGFueSkgKi9cbiAgbWZhSWQoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5tZmFSZXF1aXJlZD8uaWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIE1GQSBpZHMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcmVxdWVzdCAoaWYgYW55KSAqL1xuICBtZmFJZHMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLm1mYVJlcXVpcmVkPy5pZHMgPz8gW107XG4gIH1cblxuICAvKiogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIHJlcXVlc3QgcmVxdWlyZXMgYW4gTUZBIGFwcHJvdmFsICovXG4gIHJlcXVpcmVzTWZhKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm1mYVJlcXVpcmVkICE9PSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgU2Vzc2lvbiBpbmZvcm1hdGlvbiB0byB1c2UgZm9yIGFueSBNRkEgYXBwcm92YWwgcmVxdWVzdHMgKGlmIGFueSB3YXMgaW5jbHVkZWQgaW4gdGhlIHJlc3BvbnNlKS5cbiAgICovXG4gIGFzeW5jIG1mYUNsaWVudCgpOiBQcm9taXNlPEN1YmVTaWduZXJDbGllbnQgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAodGhpcy5tZmFSZXF1aXJlZCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgY29uc3Qgc2Vzc2lvbiA9IHRoaXMuYXNNZmFSZXF1aXJlZCgpPy5zZXNzaW9uID8/IHVuZGVmaW5lZDtcbiAgICBpZiAoc2Vzc2lvbiA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lckNsaWVudC5jcmVhdGUoe1xuICAgICAgZW52OiB0aGlzLiNlbnYuc3BlYyxcbiAgICAgIG9yZ19pZDogdGhpcy5tZmFSZXF1aXJlZC5vcmdfaWQsXG4gICAgICBzZXNzaW9uX2V4cDogc2Vzc2lvbi5leHBpcmF0aW9uLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBzZXNzaW9uLnNlc3Npb25faW5mbyxcbiAgICAgIHRva2VuOiBzZXNzaW9uLnRva2VuLFxuICAgICAgcmVmcmVzaF90b2tlbjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSByZXNwb25zZSBkYXRhLCBpZiBubyBNRkEgaXMgcmVxdWlyZWQgKi9cbiAgZGF0YSgpOiBVIHtcbiAgICBpZiAoIXRoaXMuaXNTdWNjZXNzKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJDYW5ub3QgY2FsbCBgZGF0YSgpYCBvbiBhIDIwMiBBY2NlcHRlZCByZXNwb25zZTsgdXNlIGBhc01mYVJlcXVpcmVkKClgIG9yIGBhc1NpZ25EcnlSdW4oKWBcIixcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNyZXNwIGFzIFU7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiBzZXNzaW9uIGFuZCBhIFRPVFAgY29kZS5cbiAgICpcbiAgICogQHBhcmFtIGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgcmVzdWJtaXR0aW5nIHRoZSByZXF1ZXN0IHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyB0b3RwQXBwcm92ZShjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIGNvZGU6IHN0cmluZyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI21mYVRvdHBWb3RlKGNsaWVudCwgY29kZSwgXCJhcHByb3ZlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiBzZXNzaW9uIGFuZCBhIFRPVFAgY29kZS5cbiAgICpcbiAgICogQHBhcmFtIGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqL1xuICBhc3luYyB0b3RwUmVqZWN0KGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgY29kZTogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy4jbWZhVG90cFZvdGUoY2xpZW50LCBjb2RlLCBcInJlamVjdFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhbiBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHBhcmFtIHZvdGUgQXBwcm92ZSBvciByZWplY3RcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jICNtZmFUb3RwVm90ZShcbiAgICBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsXG4gICAgY29kZTogc3RyaW5nLFxuICAgIHZvdGU6IE1mYVZvdGUsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLm1mYUlkKCk7XG4gICAgaWYgKG1mYUlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy5tZmFSZXF1aXJlZCEub3JnX2lkO1xuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY2xpZW50LmFwaUNsaWVudC5tZmFWb3RlVG90cChtZmFJZCwgY29kZSwgdm90ZSk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY1dpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGFwcHJvdmUoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jbWZhVm90ZShjbGllbnQsIFwiYXBwcm92ZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4ge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKi9cbiAgYXN5bmMgcmVqZWN0KGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCkge1xuICAgIGF3YWl0IHRoaXMuI21mYVZvdGUoY2xpZW50LCBcInJlamVjdFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhbiBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3RcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jICNtZmFWb3RlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLm1mYUlkKCk7XG4gICAgaWYgKG1mYUlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy5tZmFSZXF1aXJlZCEub3JnX2lkO1xuXG4gICAgY29uc3QgbWZhQXBwcm92YWwgPSBhd2FpdCBjbGllbnQuYXBpQ2xpZW50Lm1mYVZvdGVDcyhtZmFJZCwgbWZhVm90ZSk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY1dpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN1Ym1pdHMgdGhlIHJlcXVlc3Qgd2l0aCBhIGdpdmVuIE1GQSByZWNlaXB0KHMpIGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBUaGUgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiBzaWduaW5nIGFmdGVyIE1GQSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgZXhlY1dpdGhNZmFBcHByb3ZhbChtZmFSZWNlaXB0OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3QgaGVhZGVycyA9IEN1YmVTaWduZXJSZXNwb25zZS5nZXRNZmFIZWFkZXJzKG1mYVJlY2VpcHQpO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lclJlc3BvbnNlKHRoaXMuI2VudiwgdGhpcy4jcmVxdWVzdEZuLCBhd2FpdCB0aGlzLiNyZXF1ZXN0Rm4oaGVhZGVycykpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHdoZXJlIHRoZSByZXNwb25zZSBjb21lcyBmcm9tXG4gICAqIEBwYXJhbSByZXF1ZXN0Rm5cbiAgICogICAgVGhlIGZ1bmN0aW9uIHRoYXQgdGhpcyByZXNwb25zZSBpcyBmcm9tLlxuICAgKiAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGggZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0gcmVzcCBUaGUgcmVzcG9uc2UgYXMgcmV0dXJuZWQgYnkgdGhlIE9wZW5BUEkgY2xpZW50LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihlbnY6IE11bHRpUmVnaW9uRW52LCByZXF1ZXN0Rm46IFJlcXVlc3RGbjxVPiwgcmVzcDogUmVzcG9uc2U8VT4pIHtcbiAgICB0aGlzLiNlbnYgPSBlbnY7XG4gICAgdGhpcy4jcmVxdWVzdEZuID0gcmVxdWVzdEZuO1xuICAgIHRoaXMuI3Jlc3AgPSByZXNwO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXRpYyBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgd2hlcmUgdGhlIHJlc3BvbnNlIGNvbWVzIGZyb21cbiAgICogQHBhcmFtIHJlcXVlc3RGblxuICAgKiAgICBUaGUgcmVxdWVzdCBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoIGRpZmZlcmVudCBoZWFkZXJzIGlmIG5lZWRlZC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgTmV3IGluc3RhbmNlIG9mIHRoaXMgY2xhc3MuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxVPihcbiAgICBlbnY6IEVudkludGVyZmFjZSB8IE11bHRpUmVnaW9uRW52LFxuICAgIHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBzZWVkID0gYXdhaXQgcmVxdWVzdEZuKHRoaXMuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KSk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyUmVzcG9uc2UoTXVsdGlSZWdpb25FbnYuY3JlYXRlKGVudiksIHJlcXVlc3RGbiwgc2VlZCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIEhUVFAgaGVhZGVycyBjb250YWluaW5nIGEgZ2l2ZW4gTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIEhlYWRlcnMgaW5jbHVkaW5nIHtAbGluayBtZmFSZWNlaXB0fVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBnZXRNZmFIZWFkZXJzKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IEhlYWRlcnNJbml0IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAobWZhUmVjZWlwdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHJlYyA9IGlzTWFueU1mYVJlY2VpcHRzKG1mYVJlY2VpcHQpXG4gICAgICA/IG1mYVJlY2VpcHRcbiAgICAgIDoge1xuICAgICAgICAgIG9yZ0lkOiBtZmFSZWNlaXB0Lm1mYU9yZ0lkLFxuICAgICAgICAgIHJlY2VpcHRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiBtZmFSZWNlaXB0Lm1mYUlkLFxuICAgICAgICAgICAgICBjb25maXJtYXRpb246IG1mYVJlY2VpcHQubWZhQ29uZixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfTtcblxuICAgIGlmIChyZWMucmVjZWlwdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIFwieC1jdWJpc3QtbWZhLW9yZy1pZFwiOiByZWMub3JnSWQsXG4gICAgICBcIngtY3ViaXN0LW1mYS1yZWNlaXB0c1wiOiBlbmNvZGVUb0Jhc2U2NFVybCh0ZXh0RW5jb2Rlci5lbmNvZGUoSlNPTi5zdHJpbmdpZnkocmVjLnJlY2VpcHRzKSkpLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==