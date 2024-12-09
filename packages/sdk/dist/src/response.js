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
     * Return session information to use for any MFA approval requests (if any was included in the response).
     *
     * @returns
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBOEJBLGtDQU1DO0FBbkNELHdCQUF3RDtBQUN4RCxpQ0FBMkM7QUFvQjNDOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixXQUFXLENBQU8sSUFBaUIsRUFBRSxLQUFrQjtJQUNyRSxJQUFLLElBQXlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3JELE9BQU8sSUFBd0IsQ0FBQztJQUNsQyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sS0FBSyxDQUFDLElBQVMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGtCQUFrQjtJQVM3QixnRUFBZ0U7SUFDaEUsS0FBSztRQUNILE9BQU8sdUJBQUEsSUFBSSx1Q0FBYyxDQUFDLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsNkRBQTZEO0lBQzdELFdBQVc7UUFDVCxPQUFPLHVCQUFBLElBQUksdUNBQWEsS0FBSyxTQUFTLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLElBQUksdUJBQUEsSUFBSSx1Q0FBYSxLQUFLLFNBQVM7WUFBRSxPQUFPO1FBQzVDLE1BQU0sT0FBTyxHQUFJLHVCQUFBLElBQUksZ0NBQTJCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxPQUFPLElBQUksU0FBUyxDQUFDO1FBQzdGLElBQUksT0FBTyxLQUFLLFNBQVM7WUFBRSxPQUFPO1FBRWxDLE1BQU0sR0FBRyxHQUFHLHVCQUFBLElBQUksK0JBQUssQ0FBQztRQUN0QixPQUFPLE1BQU0sbUJBQWdCLENBQUMsTUFBTSxDQUFDO1lBQ25DLEdBQUcsRUFBRTtnQkFDSCxxQkFBcUIsRUFBRSxHQUFHO2FBQzNCO1lBQ0QsTUFBTSxFQUFFLHVCQUFBLElBQUksdUNB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T0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO0lBRWxELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQXFCRDs7Ozs7O0dBTUc7QUFDSCxLQUFLLHNDQUFVLE1BQXdCLEVBQUUsT0FBZ0I7SUFDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFHLHVCQUFBLElBQUksdUNBQWMsQ0FBQyxFQUFFLENBQUM7SUFDcEMsTUFBTSxRQUFRLEdBQUcsdUJBQUEsSUFBSSx1Q0FBYyxDQUFDLE1BQU0sQ0FBQztJQUUzQyxNQUFNLFdBQVcsR0FBRyxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNyRSxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztJQUVsRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3RFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IE1mYVZvdGUsIEVudkludGVyZmFjZSwgTWZhUmVjZWlwdHMsIE1mYVJlcXVpcmVkIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQsIGlzTWFueU1mYVJlY2VpcHRzIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGVuY29kZVRvQmFzZTY0VXJsIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHR5cGUgeyBBY2NlcHRlZFJlc3BvbnNlIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8qKlxuICogUmVzcG9uc2UgdHlwZSwgd2hpY2ggY2FuIGJlIGVpdGhlciBhIHZhbHVlIG9mIHR5cGUge0BsaW5rIFV9XG4gKiBvciB7QGxpbmsgQWNjZXB0ZWRSZXNwb25zZX0gKHN0YXR1cyBjb2RlIDIwMikgd2hpY2ggcmVxdWlyZXMgTUZBLlxuICovXG5leHBvcnQgdHlwZSBSZXNwb25zZTxVPiA9IFUgfCBBY2NlcHRlZFJlc3BvbnNlO1xuXG4vKipcbiAqIFJlcXVlc3QgZnVuY3Rpb24gd2hpY2ggb3B0aW9uYWxseSB0YWtlcyBhZGRpdGlvbmFsIGhlYWRlcnNcbiAqICh3aGljaCwgZm9yIGV4YW1wbGUsIGNhbiBiZSB1c2VkIHRvIGF0dGFjaCBhbiBNRkEgcmVjZWlwdCkuXG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVlc3RGbjxVPiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IFByb21pc2U8UmVzcG9uc2U8VT4+O1xuXG4vKipcbiAqIE1hcCBmdW5jdGlvbiBvY2Nhc2lvbmFsbHkgdXNlZCB0byBtYXAgYSByZXNwb25zZSBmcm9tIHRoZSBBUEkgaW50byBhIGhpZ2hlci1sZXZlbCB0eXBlLlxuICovXG5leHBvcnQgdHlwZSBNYXBGbjxVLCBWPiA9ICh1OiBVKSA9PiBWO1xuXG4vKipcbiAqIFRha2UgYSB7QGxpbmsgUmVzcG9uc2U8VT59IGFuZCBhIHtAbGluayBNYXBGbjxVLCBWPn0gZnVuY3Rpb24gYW5kIHJldHVyblxuICogYSB7QGxpbmsgUmVzcG9uc2U8Vj59IHRoYXQgbWFwcyB0aGUgdmFsdWUgb2YgdGhlIG9yaWdpbmFsIHJlc3BvbnNlIHdoZW4gaXRzIHN0YXR1cyBjb2RlIGlzIDIwMC5cbiAqXG4gKiBAcGFyYW0gcmVzcCBPcmlnaW5hbCByZXNwb25zZVxuICogQHBhcmFtIG1hcEZuIE1hcCB0byBhcHBseSB0byB0aGUgcmVzcG9uc2UgdmFsdWUgd2hlbiBpdHMgc3RhdHVzIGNvZGUgaXMgMjAwLlxuICogQHJldHVybnMgUmVzcG9uc2Ugd2hvc2UgdmFsdWUgZm9yIHN0YXR1cyBjb2RlIDIwMCBpcyBtYXBwZWQgZnJvbSBVIHRvIFZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcFJlc3BvbnNlPFUsIFY+KHJlc3A6IFJlc3BvbnNlPFU+LCBtYXBGbjogTWFwRm48VSwgVj4pOiBSZXNwb25zZTxWPiB7XG4gIGlmICgocmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQpIHtcbiAgICByZXR1cm4gcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYXBGbihyZXNwIGFzIFUpO1xuICB9XG59XG5cbi8qKlxuICogQSByZXNwb25zZSBvZiBhIEN1YmVTaWduZXIgcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXJSZXNwb25zZTxVPiB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgI3JlcXVlc3RGbjogUmVxdWVzdEZuPFU+O1xuICByZWFkb25seSAjcmVzcDogVSB8IEFjY2VwdGVkUmVzcG9uc2U7XG4gIC8qKlxuICAgKiBPcHRpb25hbCBNRkEgaWQuIE9ubHkgc2V0IGlmIHRoZXJlIGlzIGFuIE1GQSByZXF1ZXN0IGFzc29jaWF0ZWQgd2l0aCB0aGUgcmVxdWVzdFxuICAgKi9cbiAgcmVhZG9ubHkgI21mYVJlcXVpcmVkPzogTWZhUmVxdWlyZWQ7XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcmVxdWVzdCAoaWYgYW55KSAqL1xuICBtZmFJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNtZmFSZXF1aXJlZCEuaWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIHJlcXVlc3QgcmVxdWlyZXMgYW4gTUZBIGFwcHJvdmFsICovXG4gIHJlcXVpcmVzTWZhKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNtZmFSZXF1aXJlZCAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBzZXNzaW9uIGluZm9ybWF0aW9uIHRvIHVzZSBmb3IgYW55IE1GQSBhcHByb3ZhbCByZXF1ZXN0cyAoaWYgYW55IHdhcyBpbmNsdWRlZCBpbiB0aGUgcmVzcG9uc2UpLlxuICAgKlxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgYXN5bmMgbWZhQ2xpZW50KCk6IFByb21pc2U8Q3ViZVNpZ25lckNsaWVudCB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICh0aGlzLiNtZmFSZXF1aXJlZCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgY29uc3Qgc2Vzc2lvbiA9ICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZD8uc2Vzc2lvbiA/PyB1bmRlZmluZWQ7XG4gICAgaWYgKHNlc3Npb24gPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgY29uc3QgZW52ID0gdGhpcy4jZW52O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyQ2xpZW50LmNyZWF0ZSh7XG4gICAgICBlbnY6IHtcbiAgICAgICAgXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCI6IGVudixcbiAgICAgIH0sXG4gICAgICBvcmdfaWQ6IHRoaXMuI21mYVJlcXVpcmVkLm9yZ19pZCxcbiAgICAgIHNlc3Npb25fZXhwOiBzZXNzaW9uLmV4cGlyYXRpb24sXG4gICAgICBzZXNzaW9uX2luZm86IHNlc3Npb24uc2Vzc2lvbl9pbmZvLFxuICAgICAgdG9rZW46IHNlc3Npb24udG9rZW4sXG4gICAgICByZWZyZXNoX3Rva2VuOiBzZXNzaW9uLnJlZnJlc2hfdG9rZW4sXG4gICAgfSk7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHJlc3BvbnNlIGRhdGEsIGlmIG5vIE1GQSBpcyByZXF1aXJlZCAqL1xuICBkYXRhKCk6IFUge1xuICAgIGlmICh0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBjYWxsIGBkYXRhKClgIHdoaWxlIE1GQSBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3AgYXMgVTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIHRvdHBBcHByb3ZlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgY29kZTogc3RyaW5nKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jbWZhVG90cFZvdGUoY2xpZW50LCBjb2RlLCBcImFwcHJvdmVcIik7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICovXG4gIGFzeW5jIHRvdHBSZWplY3QoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBjb2RlOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNtZmFUb3RwVm90ZShjbGllbnQsIGNvZGUsIFwicmVqZWN0XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGFuIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcGFyYW0gY29kZSA2LWRpZ2l0IFRPVFAgY29kZVxuICAgKiBAcGFyYW0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdFxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHJlc3VibWl0dGluZyB0aGUgcmVxdWVzdCB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgI21mYVRvdHBWb3RlKFxuICAgIGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCxcbiAgICBjb2RlOiBzdHJpbmcsXG4gICAgdm90ZTogTWZhVm90ZSxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBpZiAoIXRoaXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLm1mYUlkKCk7XG4gICAgY29uc3QgbWZhT3JnSWQgPSB0aGlzLiNtZmFSZXF1aXJlZCEub3JnX2lkO1xuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY2xpZW50LmFwaUNsaWVudC5tZmFWb3RlVG90cChtZmFJZCwgY29kZSwgdm90ZSk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY1dpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGFwcHJvdmUoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jbWZhVm90ZShjbGllbnQsIFwiYXBwcm92ZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4ge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKi9cbiAgYXN5bmMgcmVqZWN0KGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCkge1xuICAgIGF3YWl0IHRoaXMuI21mYVZvdGUoY2xpZW50LCBcInJlamVjdFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhbiBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3RcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiByZXN1Ym1pdHRpbmcgdGhlIHJlcXVlc3Qgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jICNtZmFWb3RlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgaWYgKCF0aGlzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY2xpZW50LmFwaUNsaWVudC5tZmFWb3RlQ3MobWZhSWQsIG1mYVZvdGUpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWNXaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdWJtaXRzIHRoZSByZXF1ZXN0IHdpdGggYSBnaXZlbiBNRkEgcmVjZWlwdChzKSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgVGhlIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2Ygc2lnbmluZyBhZnRlciBNRkEgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGV4ZWNXaXRoTWZhQXBwcm92YWwobWZhUmVjZWlwdDogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBDdWJlU2lnbmVyUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KTtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXJSZXNwb25zZSh0aGlzLiNlbnYsIHRoaXMuI3JlcXVlc3RGbiwgYXdhaXQgdGhpcy4jcmVxdWVzdEZuKGhlYWRlcnMpKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB3aGVyZSB0aGUgcmVzcG9uc2UgY29tZXMgZnJvbVxuICAgKiBAcGFyYW0gcmVxdWVzdEZuXG4gICAqICAgIFRoZSBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoIGRpZmZlcmVudCBoZWFkZXJzIGlmIG5lZWRlZC5cbiAgICogQHBhcmFtIHJlc3AgVGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGJ5IHRoZSBPcGVuQVBJIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoZW52OiBFbnZJbnRlcmZhY2UsIHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LCByZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZSkge1xuICAgIHRoaXMuI2VudiA9IGVudjtcbiAgICB0aGlzLiNyZXF1ZXN0Rm4gPSByZXF1ZXN0Rm47XG4gICAgdGhpcy4jcmVzcCA9IHJlc3A7XG4gICAgdGhpcy4jbWZhUmVxdWlyZWQgPSAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQ7XG4gIH1cblxuICAvKipcbiAgICogU3RhdGljIGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB3aGVyZSB0aGUgcmVzcG9uc2UgY29tZXMgZnJvbVxuICAgKiBAcGFyYW0gcmVxdWVzdEZuXG4gICAqICAgIFRoZSByZXF1ZXN0IGZ1bmN0aW9uIHRoYXQgdGhpcyByZXNwb25zZSBpcyBmcm9tLlxuICAgKiAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGggZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBOZXcgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlPFU+KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBzZWVkID0gYXdhaXQgcmVxdWVzdEZuKHRoaXMuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KSk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyUmVzcG9uc2UoZW52LCByZXF1ZXN0Rm4sIHNlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBIVFRQIGhlYWRlcnMgY29udGFpbmluZyBhIGdpdmVuIE1GQSByZWNlaXB0LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBIZWFkZXJzIGluY2x1ZGluZyB7QGxpbmsgbWZhUmVjZWlwdH1cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBIZWFkZXJzSW5pdCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKG1mYVJlY2VpcHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCByZWMgPSBpc01hbnlNZmFSZWNlaXB0cyhtZmFSZWNlaXB0KVxuICAgICAgPyBtZmFSZWNlaXB0XG4gICAgICA6IHtcbiAgICAgICAgICBvcmdJZDogbWZhUmVjZWlwdC5tZmFPcmdJZCxcbiAgICAgICAgICByZWNlaXB0czogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogbWZhUmVjZWlwdC5tZmFJZCxcbiAgICAgICAgICAgICAgY29uZmlybWF0aW9uOiBtZmFSZWNlaXB0Lm1mYUNvbmYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG5cbiAgICBpZiAocmVjLnJlY2VpcHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgIHJldHVybiB7XG4gICAgICBcIngtY3ViaXN0LW1mYS1vcmctaWRcIjogcmVjLm9yZ0lkLFxuICAgICAgXCJ4LWN1YmlzdC1tZmEtcmVjZWlwdHNcIjogZW5jb2RlVG9CYXNlNjRVcmwodGV4dEVuY29kZXIuZW5jb2RlKEpTT04uc3RyaW5naWZ5KHJlYy5yZWNlaXB0cykpKSxcbiAgICB9O1xuICB9XG59XG4iXX0=