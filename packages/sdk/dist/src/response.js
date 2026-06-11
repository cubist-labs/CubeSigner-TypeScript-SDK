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
import { ALL_ACCEPTED_CODES, CubeSignerClient, ErrResponse, MultiRegionEnv, isManyMfaReceipts, } from "./index.js";
import { encodeToBase64Url } from "./util.js";
/**
 * Take a {@link Response<U>} and a {@link MapFn<U, V>} function and return
 * a {@link Response<V>} that maps the value of the original response when its status code is 200.
 *
 * @param resp Original response
 * @param mapFn Map to apply to the response value when its status code is 200.
 * @returns Response whose value for status code 200 is mapped from U to V
 */
export function mapResponse(resp, mapFn) {
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
    return ALL_ACCEPTED_CODES.includes(acceptedResp.error_code)
        ? (acceptedResp.accepted ?? undefined)
        : undefined;
}
/**
 * A response of a CubeSigner request.
 */
export class CubeSignerResponse {
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
        return await CubeSignerClient.create({
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
        return new CubeSignerResponse(MultiRegionEnv.create(env), requestFn, seed);
    }
    /**
     * Similar to {@link create} except that unwraps the {@link JsonRpcResponse}
     * to throw an {@link ErrResponse} on error
     *
     * @param env The environment where the response comes from
     * @param reqFn
     *    The request function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns New instance of this class.
     * @internal
     */
    static async createForJsonRpc(env, reqFn, mfaReceipt) {
        const requestFn = async (headers) => {
            const resp = await reqFn(headers);
            if (resp.result)
                return resp.result;
            const errResp = resp.error?.data;
            // return AcceptedResponse if accepted
            if (errResp?.accepted) {
                return errResp;
            }
            // otherwise it's an error
            throw new ErrResponse({
                message: errResp?.message ?? resp.error?.message ?? "JSON-RPC error",
                errorCode: errResp?.error_code,
                requestId: errResp?.request_id,
            });
        };
        const seed = await requestFn(this.getMfaHeaders(mfaReceipt));
        return new CubeSignerResponse(MultiRegionEnv.create(env), requestFn, seed);
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
        const rec = isManyMfaReceipts(mfaReceipt)
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
            "x-cubist-mfa-receipts": encodeToBase64Url(textEncoder.encode(JSON.stringify(rec.receipts))),
        };
    }
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVzcG9uc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQ0EsT0FBTyxFQUNMLGtCQUFrQixFQUNsQixnQkFBZ0IsRUFDaEIsV0FBVyxFQUNYLGNBQWMsRUFDZCxpQkFBaUIsR0FDbEIsTUFBTSxZQUFZLENBQUM7QUFDcEIsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sV0FBVyxDQUFDO0FBNEI5Qzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBTyxJQUFpQixFQUFFLEtBQWtCO0lBQ3JFLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ25DLE9BQU8sSUFBd0IsQ0FBQztJQUNsQyxDQUFDO1NBQU0sQ0FBQztRQUNOLE9BQU8sS0FBSyxDQUFDLElBQVMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxVQUFVLENBQUksSUFBaUI7SUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBd0IsQ0FBQztJQUM5QyxPQUFPLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBK0IsQ0FBQztRQUM5RSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxJQUFJLFNBQVMsQ0FBQztRQUN0QyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ2hCLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sT0FBTyxrQkFBa0I7SUFLN0I7O09BRUc7SUFDSCxVQUFVO1FBQ1IsT0FBTyxVQUFVLENBQUMsdUJBQUEsSUFBSSxnQ0FBTSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsYUFBYTtRQUNYLE9BQU8sSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLFdBQVcsSUFBSSxTQUFTLENBQUM7SUFDckQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsWUFBWTtRQUNW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QUFDO0lBRTFDLE1BQU0sV0FBVyxHQUFHLE1BQU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JFLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO0lBRWxELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWZhVm90ZSwgRW52SW50ZXJmYWNlLCBNZmFSZWNlaXB0cywgTWZhUmVxdWlyZWQgfSBmcm9tIFwiLi9pbmRleC50c1wiO1xuaW1wb3J0IHtcbiAgQUxMX0FDQ0VQVEVEX0NPREVTLFxuICBDdWJlU2lnbmVyQ2xpZW50LFxuICBFcnJSZXNwb25zZSxcbiAgTXVsdGlSZWdpb25FbnYsXG4gIGlzTWFueU1mYVJlY2VpcHRzLFxufSBmcm9tIFwiLi9pbmRleC50c1wiO1xuaW1wb3J0IHsgZW5jb2RlVG9CYXNlNjRVcmwgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFjY2VwdGVkUmVzcG9uc2UsXG4gIEFjY2VwdGVkVmFsdWUsXG4gIFNpZ25EcnlSdW4sXG4gIEpzb25ScGNSZXNwb25zZSxcbiAgSnNvblJwY1Jlc3VsdCxcbiAgRXJyb3JSZXNwb25zZSxcbiAgQWNjZXB0ZWRWYWx1ZUNvZGUsXG59IGZyb20gXCIuL3NjaGVtYV90eXBlcy50c1wiO1xuXG4vKipcbiAqIFJlc3BvbnNlIHR5cGUsIHdoaWNoIGNhbiBiZSBlaXRoZXIgYSB2YWx1ZSBvZiB0eXBlIHtAbGluayBVfVxuICogb3Ige0BsaW5rIEFjY2VwdGVkUmVzcG9uc2V9IChzdGF0dXMgY29kZSAyMDIpIHdoaWNoIHJlcXVpcmVzIE1GQS5cbiAqL1xuZXhwb3J0IHR5cGUgUmVzcG9uc2U8VT4gPSBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcblxuLyoqXG4gKiBSZXF1ZXN0IGZ1bmN0aW9uIHdoaWNoIG9wdGlvbmFsbHkgdGFrZXMgYWRkaXRpb25hbCBoZWFkZXJzXG4gKiAod2hpY2gsIGZvciBleGFtcGxlLCBjYW4gYmUgdXNlZCB0byBhdHRhY2ggYW4gTUZBIHJlY2VpcHQpLlxuICovXG5leHBvcnQgdHlwZSBSZXF1ZXN0Rm48VT4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiBQcm9taXNlPFJlc3BvbnNlPFU+PjtcblxuLyoqXG4gKiBNYXAgZnVuY3Rpb24gb2NjYXNpb25hbGx5IHVzZWQgdG8gbWFwIGEgcmVzcG9uc2UgZnJvbSB0aGUgQVBJIGludG8gYSBoaWdoZXItbGV2ZWwgdHlwZS5cbiAqL1xuZXhwb3J0IHR5cGUgTWFwRm48VSwgVj4gPSAodTogVSkgPT4gVjtcblxuLyoqXG4gKiBUYWtlIGEge0BsaW5rIFJlc3BvbnNlPFU+fSBhbmQgYSB7QGxpbmsgTWFwRm48VSwgVj59IGZ1bmN0aW9uIGFuZCByZXR1cm5cbiAqIGEge0BsaW5rIFJlc3BvbnNlPFY+fSB0aGF0IG1hcHMgdGhlIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCByZXNwb25zZSB3aGVuIGl0cyBzdGF0dXMgY29kZSBpcyAyMDAuXG4gKlxuICogQHBhcmFtIHJlc3AgT3JpZ2luYWwgcmVzcG9uc2VcbiAqIEBwYXJhbSBtYXBGbiBNYXAgdG8gYXBwbHkgdG8gdGhlIHJlc3BvbnNlIHZhbHVlIHdoZW4gaXRzIHN0YXR1cyBjb2RlIGlzIDIwMC5cbiAqIEByZXR1cm5zIFJlc3BvbnNlIHdob3NlIHZhbHVlIGZvciBzdGF0dXMgY29kZSAyMDAgaXMgbWFwcGVkIGZyb20gVSB0byBWXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXBSZXNwb25zZTxVLCBWPihyZXNwOiBSZXNwb25zZTxVPiwgbWFwRm46IE1hcEZuPFUsIFY+KTogUmVzcG9uc2U8Vj4ge1xuICBpZiAoYXNBY2NlcHRlZChyZXNwKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFwRm4ocmVzcCBhcyBVKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSByZXNwIFRoZSByZXNwb25zZSB0byBjaGVja1xuICogQHJldHVybnMgVGhlIHtAbGluayBBY2NlcHRlZFZhbHVlfSBpZiB0aGUgcmVzcG9uc2Ugc3RhdHVzIGNvZGUgaXMgMjAyLlxuICovXG5mdW5jdGlvbiBhc0FjY2VwdGVkPFU+KHJlc3A6IFJlc3BvbnNlPFU+KTogQWNjZXB0ZWRWYWx1ZSB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IGFjY2VwdGVkUmVzcCA9IHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZTtcbiAgcmV0dXJuIEFMTF9BQ0NFUFRFRF9DT0RFUy5pbmNsdWRlcyhhY2NlcHRlZFJlc3AuZXJyb3JfY29kZSBhcyBBY2NlcHRlZFZhbHVlQ29kZSlcbiAgICA/IChhY2NlcHRlZFJlc3AuYWNjZXB0ZWQgPz8gdW5kZWZpbmVkKVxuICAgIDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEEgcmVzcG9uc2Ugb2YgYSBDdWJlU2lnbmVyIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyUmVzcG9uc2U8VT4ge1xuICByZWFkb25seSAjZW52OiBNdWx0aVJlZ2lvbkVudjtcbiAgcmVhZG9ubHkgI3JlcXVlc3RGbjogUmVxdWVzdEZuPFU+O1xuICByZWFkb25seSAjcmVzcDogUmVzcG9uc2U8VT47XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB7QGxpbmsgQWNjZXB0ZWRWYWx1ZX0gaWYgdGhlIHJlc3BvbnNlIHN0YXR1cyBjb2RlIGlzIDIwMi5cbiAgICovXG4gIGFzQWNjZXB0ZWQoKTogQWNjZXB0ZWRWYWx1ZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGFzQWNjZXB0ZWQodGhpcy4jcmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGFzc29jaWF0ZWQge0BsaW5rIE1mYVJlcXVpcmVkfSB2YWx1ZSwgaWYgdGhlIHJlc3BvbnNlIHN0YXR1cyBjb2RlIGlzIDIwMiBhbmQgdGhlIHJlc3BvbnNlIGluZGljYXRlcyB0aGF0IE1GQSBpcyByZXF1aXJlZC5cbiAgICovXG4gIGFzTWZhUmVxdWlyZWQoKTogTWZhUmVxdWlyZWQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmFzQWNjZXB0ZWQoKT8uTWZhUmVxdWlyZWQgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBhc3NvY2lhdGVkIHtAbGluayBTaWduRHJ5UnVufSB2YWx1ZSwgaWYgdGhlIHJlc3BvbnNlIHN0YXR1cyBjb2RlIGlzIDIwMiBhbmQgdGhlIHJlc3BvbnNlIGlzIGEgZHJ5IHJ1biBvZiBhIHNpZ24gb3BlcmF0aW9uLlxuICAgKi9cbiAgYXNTaWduRHJ5UnVuKCk6IFNpZ25EcnlSdW4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmFzQWNjZXB0ZWQoKT8uU2lnbkRyeVJ1biA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgV2hldGhlciB0aGlzIHJlc3BvbnNlIGlzIGEgXCIyMDAgU3VjY2Vzc1wiIChpbiB3aGljaCBjYXNlIGl0IGlzIHNhZmUgdG8gY2FsbCB7QGxpbmsgZGF0YX0pXG4gICAqL1xuICBpc1N1Y2Nlc3MoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYXNBY2NlcHRlZCgpID09PSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHVuZGVybHlpbmcge0BsaW5rIE1mYVJlcXVpcmVkfSByZXNwb25zZSAoaWYgYW55KS5cbiAgICovXG4gIHByaXZhdGUgZ2V0IG1mYVJlcXVpcmVkKCkge1xuICAgIHJldHVybiB0aGlzLmFzQWNjZXB0ZWQoKT8uTWZhUmVxdWlyZWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGZpcnN0IE1GQSBpZCBhc3NvY2lhdGVkIHdpdGggdGhpcyByZXF1ZXN0IChpZiBhbnkpICovXG4gIG1mYUlkKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubWZhUmVxdWlyZWQ/LmlkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBNRkEgaWRzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHJlcXVlc3QgKGlmIGFueSkgKi9cbiAgbWZhSWRzKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5tZmFSZXF1aXJlZD8uaWRzID8/IFtdO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRydWUgaWYgdGhpcyByZXF1ZXN0IHJlcXVpcmVzIGFuIE1GQSBhcHByb3ZhbCAqL1xuICByZXF1aXJlc01mYSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tZmFSZXF1aXJlZCAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFNlc3Npb24gaW5mb3JtYXRpb24gdG8gdXNlIGZvciBhbnkgTUZBIGFwcHJvdmFsIHJlcXVlc3RzIChpZiBhbnkgd2FzIGluY2x1ZGVkIGluIHRoZSByZXNwb25zZSkuXG4gICAqL1xuICBhc3luYyBtZmFDbGllbnQoKTogUHJvbWlzZTxDdWJlU2lnbmVyQ2xpZW50IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMubWZhUmVxdWlyZWQgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLmFzTWZhUmVxdWlyZWQoKT8uc2Vzc2lvbiA/PyB1bmRlZmluZWQ7XG4gICAgaWYgKHNlc3Npb24gPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJDbGllbnQuY3JlYXRlKHtcbiAgICAgIGVudjogdGhpcy4jZW52LnNwZWMsXG4gICAgICBvcmdfaWQ6IHRoaXMubWZhUmVxdWlyZWQub3JnX2lkLFxuICAgICAgc2Vzc2lvbl9leHA6IHNlc3Npb24uZXhwaXJhdGlvbixcbiAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbi5zZXNzaW9uX2luZm8sXG4gICAgICB0b2tlbjogc2Vzc2lvbi50b2tlbixcbiAgICAgIHJlZnJlc2hfdG9rZW46IHNlc3Npb24ucmVmcmVzaF90b2tlbixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UgZGF0YSwgaWYgbm8gTUZBIGlzIHJlcXVpcmVkICovXG4gIGRhdGEoKTogVSB7XG4gICAgaWYgKCF0aGlzLmlzU3VjY2VzcygpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiQ2Fubm90IGNhbGwgYGRhdGEoKWAgb24gYSAyMDIgQWNjZXB0ZWQgcmVzcG9uc2U7IHVzZSBgYXNNZmFSZXF1aXJlZCgpYCBvciBgYXNTaWduRHJ5UnVuKClgXCIsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jcmVzcCBhcyBVO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcGFyYW0gY29kZSA2LWRpZ2l0IFRPVFAgY29kZVxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHJlc3VibWl0dGluZyB0aGUgcmVxdWVzdCB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgdG90cEFwcHJvdmUoY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNtZmFUb3RwVm90ZShjbGllbnQsIGNvZGUsIFwiYXBwcm92ZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSBjbGllbnQgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcGFyYW0gY29kZSA2LWRpZ2l0IFRPVFAgY29kZVxuICAgKi9cbiAgYXN5bmMgdG90cFJlamVjdChjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIGNvZGU6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMuI21mYVRvdHBWb3RlKGNsaWVudCwgY29kZSwgXCJyZWplY3RcIik7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBvciByZWplY3QgYW4gTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiBzZXNzaW9uIGFuZCBhIFRPVFAgY29kZS5cbiAgICpcbiAgICogQHBhcmFtIGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqIEBwYXJhbSB2b3RlIEFwcHJvdmUgb3IgcmVqZWN0XG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgcmVzdWJtaXR0aW5nIHRoZSByZXF1ZXN0IHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyAjbWZhVG90cFZvdGUoXG4gICAgY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LFxuICAgIGNvZGU6IHN0cmluZyxcbiAgICB2b3RlOiBNZmFWb3RlLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IG1mYUlkID0gdGhpcy5tZmFJZCgpO1xuICAgIGlmIChtZmFJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25zdCBtZmFPcmdJZCA9IHRoaXMubWZhUmVxdWlyZWQhLm9yZ19pZDtcbiAgICBjb25zdCBtZmFBcHByb3ZhbCA9IGF3YWl0IGNsaWVudC5hcGlDbGllbnQubWZhVm90ZVRvdHAobWZhSWQsIGNvZGUsIHZvdGUpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWNXaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGFuY2UgKGkuZS4sIGl0cyBzZXNzaW9uKS5cbiAgICpcbiAgICogQHBhcmFtIGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgcmVzdWJtaXR0aW5nIHRoZSByZXF1ZXN0IHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBhcHByb3ZlKGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI21mYVZvdGUoY2xpZW50LCBcImFwcHJvdmVcIik7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSAoaS5lLiwgaXRzIHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICovXG4gIGFzeW5jIHJlamVjdChjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQpIHtcbiAgICBhd2FpdCB0aGlzLiNtZmFWb3RlKGNsaWVudCwgXCJyZWplY3RcIik7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBvciByZWplY3QgYW4gTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGFuY2UgKGkuZS4sIGl0cyBzZXNzaW9uKS5cbiAgICpcbiAgICogQHBhcmFtIGNsaWVudCBDdWJlU2lnbmVyIHdob3NlIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0XG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgcmVzdWJtaXR0aW5nIHRoZSByZXF1ZXN0IHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyAjbWZhVm90ZShjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IG1mYUlkID0gdGhpcy5tZmFJZCgpO1xuICAgIGlmIChtZmFJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25zdCBtZmFPcmdJZCA9IHRoaXMubWZhUmVxdWlyZWQhLm9yZ19pZDtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgY2xpZW50LmFwaUNsaWVudC5tZmFWb3RlQ3MobWZhSWQsIG1mYVZvdGUpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWNXaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdWJtaXRzIHRoZSByZXF1ZXN0IHdpdGggYSBnaXZlbiBNRkEgcmVjZWlwdChzKSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgVGhlIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2Ygc2lnbmluZyBhZnRlciBNRkEgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGV4ZWNXaXRoTWZhQXBwcm92YWwobWZhUmVjZWlwdDogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBDdWJlU2lnbmVyUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KTtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXJSZXNwb25zZSh0aGlzLiNlbnYsIHRoaXMuI3JlcXVlc3RGbiwgYXdhaXQgdGhpcy4jcmVxdWVzdEZuKGhlYWRlcnMpKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB3aGVyZSB0aGUgcmVzcG9uc2UgY29tZXMgZnJvbVxuICAgKiBAcGFyYW0gcmVxdWVzdEZuXG4gICAqICAgIFRoZSBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoIGRpZmZlcmVudCBoZWFkZXJzIGlmIG5lZWRlZC5cbiAgICogQHBhcmFtIHJlc3AgVGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGJ5IHRoZSBPcGVuQVBJIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoZW52OiBNdWx0aVJlZ2lvbkVudiwgcmVxdWVzdEZuOiBSZXF1ZXN0Rm48VT4sIHJlc3A6IFJlc3BvbnNlPFU+KSB7XG4gICAgdGhpcy4jZW52ID0gZW52O1xuICAgIHRoaXMuI3JlcXVlc3RGbiA9IHJlcXVlc3RGbjtcbiAgICB0aGlzLiNyZXNwID0gcmVzcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGF0aWMgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHdoZXJlIHRoZSByZXNwb25zZSBjb21lcyBmcm9tXG4gICAqIEBwYXJhbSByZXF1ZXN0Rm5cbiAgICogICAgVGhlIHJlcXVlc3QgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgIFRoaXMgYXJndW1lbnQgaXMgdXNlZCB0byByZXNlbmQgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIE5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VT4oXG4gICAgZW52OiBFbnZJbnRlcmZhY2UgfCBNdWx0aVJlZ2lvbkVudixcbiAgICByZXF1ZXN0Rm46IFJlcXVlc3RGbjxVPixcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3Qgc2VlZCA9IGF3YWl0IHJlcXVlc3RGbih0aGlzLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCkpO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lclJlc3BvbnNlKE11bHRpUmVnaW9uRW52LmNyZWF0ZShlbnYpLCByZXF1ZXN0Rm4sIHNlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpbWlsYXIgdG8ge0BsaW5rIGNyZWF0ZX0gZXhjZXB0IHRoYXQgdW53cmFwcyB0aGUge0BsaW5rIEpzb25ScGNSZXNwb25zZX1cbiAgICogdG8gdGhyb3cgYW4ge0BsaW5rIEVyclJlc3BvbnNlfSBvbiBlcnJvclxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB3aGVyZSB0aGUgcmVzcG9uc2UgY29tZXMgZnJvbVxuICAgKiBAcGFyYW0gcmVxRm5cbiAgICogICAgVGhlIHJlcXVlc3QgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgIFRoaXMgYXJndW1lbnQgaXMgdXNlZCB0byByZXNlbmQgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIE5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVGb3JKc29uUnBjKFxuICAgIGVudjogRW52SW50ZXJmYWNlIHwgTXVsdGlSZWdpb25FbnYsXG4gICAgcmVxRm46IFJlcXVlc3RGbjxKc29uUnBjUmVzcG9uc2U+LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8SnNvblJwY1Jlc3VsdD4+IHtcbiAgICBjb25zdCByZXF1ZXN0Rm46IFJlcXVlc3RGbjxKc29uUnBjUmVzdWx0PiA9IGFzeW5jIChoZWFkZXJzKSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgcmVxRm4oaGVhZGVycyk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQpIHJldHVybiByZXNwLnJlc3VsdDtcbiAgICAgIGNvbnN0IGVyclJlc3AgPSByZXNwLmVycm9yPy5kYXRhIGFzIEVycm9yUmVzcG9uc2UgfCB1bmRlZmluZWQ7XG5cbiAgICAgIC8vIHJldHVybiBBY2NlcHRlZFJlc3BvbnNlIGlmIGFjY2VwdGVkXG4gICAgICBpZiAoZXJyUmVzcD8uYWNjZXB0ZWQpIHtcbiAgICAgICAgcmV0dXJuIGVyclJlc3A7XG4gICAgICB9XG5cbiAgICAgIC8vIG90aGVyd2lzZSBpdCdzIGFuIGVycm9yXG4gICAgICB0aHJvdyBuZXcgRXJyUmVzcG9uc2Uoe1xuICAgICAgICBtZXNzYWdlOiBlcnJSZXNwPy5tZXNzYWdlID8/IHJlc3AuZXJyb3I/Lm1lc3NhZ2UgPz8gXCJKU09OLVJQQyBlcnJvclwiLFxuICAgICAgICBlcnJvckNvZGU6IGVyclJlc3A/LmVycm9yX2NvZGUsXG4gICAgICAgIHJlcXVlc3RJZDogZXJyUmVzcD8ucmVxdWVzdF9pZCxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3Qgc2VlZCA9IGF3YWl0IHJlcXVlc3RGbih0aGlzLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCkpO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lclJlc3BvbnNlKE11bHRpUmVnaW9uRW52LmNyZWF0ZShlbnYpLCByZXF1ZXN0Rm4sIHNlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBIVFRQIGhlYWRlcnMgY29udGFpbmluZyBhIGdpdmVuIE1GQSByZWNlaXB0LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBIZWFkZXJzIGluY2x1ZGluZyB7QGxpbmsgbWZhUmVjZWlwdH1cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBIZWFkZXJzSW5pdCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKG1mYVJlY2VpcHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCByZWMgPSBpc01hbnlNZmFSZWNlaXB0cyhtZmFSZWNlaXB0KVxuICAgICAgPyBtZmFSZWNlaXB0XG4gICAgICA6IHtcbiAgICAgICAgICBvcmdJZDogbWZhUmVjZWlwdC5tZmFPcmdJZCxcbiAgICAgICAgICByZWNlaXB0czogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogbWZhUmVjZWlwdC5tZmFJZCxcbiAgICAgICAgICAgICAgY29uZmlybWF0aW9uOiBtZmFSZWNlaXB0Lm1mYUNvbmYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH07XG5cbiAgICBpZiAocmVjLnJlY2VpcHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgIHJldHVybiB7XG4gICAgICBcIngtY3ViaXN0LW1mYS1vcmctaWRcIjogcmVjLm9yZ0lkLFxuICAgICAgXCJ4LWN1YmlzdC1tZmEtcmVjZWlwdHNcIjogZW5jb2RlVG9CYXNlNjRVcmwodGV4dEVuY29kZXIuZW5jb2RlKEpTT04uc3RyaW5naWZ5KHJlYy5yZWNlaXB0cykpKSxcbiAgICB9O1xuICB9XG59XG4iXX0=