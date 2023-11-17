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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _CubeSignerResponse_requestFn, _CubeSignerResponse_resp, _CubeSignerResponse_mfaRequired, _SignerSessionInfo_csc, _SignerSessionInfo_sessionId, _SignerSession_csc;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerSession = exports.SignerSessionInfo = exports.CubeSignerResponse = exports.mapResponse = void 0;
const assert_1 = __importDefault(require("assert"));
const _1 = require(".");
const client_1 = require("./client");
const signer_session_manager_1 = require("./session/signer_session_manager");
/**
 * Takes a {@link Response<U>} and a {@link MapFn<U, V>} function and returns
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
    /** @return {string} The MFA id associated with this request */
    mfaId() {
        return __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").id;
    }
    /** @return {boolean} True if this request requires an MFA approval */
    requiresMfa() {
        return __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f") !== undefined;
    }
    /**
     * Returns session information to use for any MFA approval requests (if any was included in the response).
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
     * Approves the MFA request using a given session and a TOTP code.
     *
     * @param {SignerSession} session Signer session to use
     * @param {string} code 6-digit TOTP code
     * @return {CubeSignerResponse<U>} The result of signing with the approval
     */
    async approveTotp(session, code) {
        (0, assert_1.default)(this.requiresMfa());
        const mfaId = this.mfaId();
        const mfaOrgId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id;
        const mfaApproval = await session.totpApprove(mfaId, code);
        (0, assert_1.default)(mfaApproval.id === mfaId);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            return this;
        }
        return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
    }
    /**
     * Approves the MFA request using a given `CubeSignerClient` instance (i.e., its session).
     *
     * @param {CubeSigner} cs CubeSigner whose session to use
     * @return {CubeSignerResponse<U>} The result of signing with the approval
     */
    async approve(cs) {
        (0, assert_1.default)(this.requiresMfa());
        const mfaId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").id;
        const mfaOrgId = __classPrivateFieldGet(this, _CubeSignerResponse_mfaRequired, "f").org_id;
        const mfaApproval = await cs.mfaApprove(mfaOrgId, mfaId);
        (0, assert_1.default)(mfaApproval.id === mfaId);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            return this;
        }
        return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
    }
    /**
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
     */
    static async create(requestFn, mfaReceipt) {
        const seed = await requestFn(this.getMfaHeaders(mfaReceipt));
        return new CubeSignerResponse(requestFn, seed);
    }
    /**
     * Returns HTTP headers containing a given MFA receipt.
     *
     * @param {MfaReceipt} mfaReceipt MFA receipt
     * @return {HeadersInit} Headers including that receipt
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
/** Signer session info. Can only be used to revoke a token, but not for authentication. */
class SignerSessionInfo {
    /** Revoke this session */
    async revoke() {
        await __classPrivateFieldGet(this, _SignerSessionInfo_csc, "f").sessionRevoke(__classPrivateFieldGet(this, _SignerSessionInfo_sessionId, "f"));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Internal constructor.
     * @param {CubeSignerClient} cs CubeSigner instance to use when calling `revoke`
     * @param {string} sessionId The ID of the session; can be used for revocation but not for auth
     * @param {string} purpose Session purpose
     * @internal
     */
    constructor(cs, sessionId, purpose) {
        _SignerSessionInfo_csc.set(this, void 0);
        _SignerSessionInfo_sessionId.set(this, void 0);
        __classPrivateFieldSet(this, _SignerSessionInfo_csc, cs, "f");
        __classPrivateFieldSet(this, _SignerSessionInfo_sessionId, sessionId, "f");
        this.purpose = purpose;
    }
}
exports.SignerSessionInfo = SignerSessionInfo;
_SignerSessionInfo_csc = new WeakMap(), _SignerSessionInfo_sessionId = new WeakMap();
/**
 * Signer session.
 *
 * @deprecated Use {@link CubeSignerClient} instead.
 */
class SignerSession {
    /** Deprecated */
    get sessionMgr() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").sessionMgr;
    }
    /** Org id */
    get orgId() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").orgId;
    }
    /**
     * Returns the list of keys that this token grants access to.
     * @return {KeyInfo[]} The list of keys.
     */
    async keys() {
        const keys = await __classPrivateFieldGet(this, _SignerSession_csc, "f").sessionKeysList();
        return keys.map((k) => (0, _1.toKeyInfo)(k));
    }
    /** Approve a pending MFA request using TOTP. */
    get totpApprove() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").mfaApproveTotp.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Initiate approval of an existing MFA request using FIDO. */
    get fidoApproveStart() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").mfaApproveFidoInit.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Get a pending MFA request by its id. */
    get getMfaInfo() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").mfaGet.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Submit an EVM sign request. */
    get signEvm() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").signEvm.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Submit an 'eth2' sign request. */
    get signEth2() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").signEth2.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Sign a stake request. */
    get stake() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").signStake.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Sign an unstake request. */
    get unstake() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").signUnstake.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Sign a raw blob.*/
    get signBlob() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").signBlob.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Sign a bitcoin message. */
    get signBtc() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").signBtc.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Sign a solana message. */
    get signSolana() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").signSolana.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /** Sign an Avalanche P- or X-chain message. */
    get signAva() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").signAva.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /**
     * Obtain a proof of authentication.
     */
    get proveIdentity() {
        return __classPrivateFieldGet(this, _SignerSession_csc, "f").identityProve.bind(__classPrivateFieldGet(this, _SignerSession_csc, "f"));
    }
    /**
     * Loads an existing signer session from storage.
     * @param {SignerSessionStorage} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session
     */
    static async loadSignerSession(storage) {
        const manager = await signer_session_manager_1.SignerSessionManager.loadFromStorage(storage);
        return new SignerSession(manager);
    }
    /**
     * Constructor.
     * @param {SignerSessionManager} sessionMgr The session manager to use
     * @internal
     */
    constructor(sessionMgr) {
        _SignerSession_csc.set(this, void 0);
        __classPrivateFieldSet(this, _SignerSession_csc, new client_1.CubeSignerClient(sessionMgr), "f");
    }
}
exports.SignerSession = SignerSession;
_SignerSession_csc = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLHdCQUErRDtBQUMvRCxxQ0FBNEM7QUFFNUMsNkVBQThGO0FBTTlGOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixXQUFXLENBQU8sSUFBaUIsRUFBRSxLQUFrQjtJQUNyRSxJQUFLLElBQXlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNwRCxPQUFPLElBQXdCLENBQUM7S0FDakM7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDLElBQVMsQ0FBQyxDQUFDO0tBQ3pCO0FBQ0gsQ0FBQztBQU5ELGtDQU1DO0FBV0Q7O0dBRUc7QUFDSCxNQUFhLGtCQUFrQjtJQVM3QiwrREFBK0Q7SUFDL0QsS0FBSztRQUNILE9BQU8sdUJBQUEsSUFBSSx1Q0FBYyxDQUFDLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsc0VBQXNFO0lBQ3RFLFdBQVc7UUFDVCxPQUFPLHVCQUFBLElBQUksdUNBQWEsS0FBSyxTQUFTLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7T0FHRztJQUNILGNBQWM7UUFDWixPQUFRLHVCQUFBLElBQUksZ0NBQTJCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxPQUFPLElBQUksU0FBUyxDQUFDO0lBQ3RGLENBQUM7SUFFRCwyREFBMkQ7SUFDM0QsSUFBSTtRQUNGLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztTQUMvRDtRQUNELE9BQU8sdUJBQUEsSUFBSSxnQ0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXNCLEVBQUUsSUFBWTtRQUNwRCxJQUFBLGdCQUFNLEVBQUMsSUFB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aW1wb3J0IHsgQ3ViZVNpZ25lciwgdG9LZXlJbmZvLCBNZmFSZWNlaXB0LCBLZXlJbmZvIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IEFjY2VwdGVkUmVzcG9uc2UsIE5ld1Nlc3Npb25SZXNwb25zZSB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsIFNpZ25lclNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5cbnR5cGUgUmVzcG9uc2U8VT4gPSBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcbnR5cGUgUmVxdWVzdEZuPFU+ID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4gUHJvbWlzZTxSZXNwb25zZTxVPj47XG50eXBlIE1hcEZuPFUsIFY+ID0gKHU6IFUpID0+IFY7XG5cbi8qKlxuICogVGFrZXMgYSB7QGxpbmsgUmVzcG9uc2U8VT59IGFuZCBhIHtAbGluayBNYXBGbjxVLCBWPn0gZnVuY3Rpb24gYW5kIHJldHVybnNcbiAqIGEge0BsaW5rIFJlc3BvbnNlPFY+fSB0aGF0IG1hcHMgdGhlIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCByZXNwb25zZSB3aGVuIGl0cyBzdGF0dXMgY29kZSBpcyAyMDAuXG4gKlxuICogQHBhcmFtIHtSZXNwb25zZTxVPn0gcmVzcCBPcmlnaW5hbCByZXNwb25zZVxuICogQHBhcmFtIHtNYXA8VSwgVj59IG1hcEZuIE1hcCB0byBhcHBseSB0byB0aGUgcmVzcG9uc2UgdmFsdWUgd2hlbiBpdHMgc3RhdHVzIGNvZGUgaXMgMjAwLlxuICogQHJldHVybiB7UmVzcG9uc2U8Vj59IFJlc3BvbnNlIHdob3NlIHZhbHVlIGZvciBzdGF0dXMgY29kZSAyMDAgaXMgbWFwcGVkIGZyb20gVSB0byBWXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXBSZXNwb25zZTxVLCBWPihyZXNwOiBSZXNwb25zZTxVPiwgbWFwRm46IE1hcEZuPFUsIFY+KTogUmVzcG9uc2U8Vj4ge1xuICBpZiAoKHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkKSB7XG4gICAgcmV0dXJuIHJlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFwRm4ocmVzcCBhcyBVKTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1mYVJlcXVpcmVkIHtcbiAgLyoqIE9yZyBpZCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIE1GQSByZXF1ZXN0IGlkICovXG4gIGlkOiBzdHJpbmc7XG4gIC8qKiBPcHRpb25hbCBNRkEgc2Vzc2lvbiAqL1xuICBzZXNzaW9uPzogTmV3U2Vzc2lvblJlc3BvbnNlIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBBIHJlc3BvbnNlIG9mIGEgQ3ViZVNpZ25lciByZXF1ZXN0LlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lclJlc3BvbnNlPFU+IHtcbiAgcmVhZG9ubHkgI3JlcXVlc3RGbjogUmVxdWVzdEZuPFU+O1xuICByZWFkb25seSAjcmVzcDogVSB8IEFjY2VwdGVkUmVzcG9uc2U7XG4gIC8qKlxuICAgKiBPcHRpb25hbCBNRkEgaWQuIE9ubHkgc2V0IGlmIHRoZXJlIGlzIGFuIE1GQSByZXF1ZXN0IGFzc29jaWF0ZWQgd2l0aCB0aGVcbiAgICogc2lnbmluZyByZXF1ZXN0XG4gICAqL1xuICByZWFkb25seSAjbWZhUmVxdWlyZWQ/OiBNZmFSZXF1aXJlZDtcblxuICAvKiogQHJldHVybiB7c3RyaW5nfSBUaGUgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHJlcXVlc3QgKi9cbiAgbWZhSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhpcyByZXF1ZXN0IHJlcXVpcmVzIGFuIE1GQSBhcHByb3ZhbCAqL1xuICByZXF1aXJlc01mYSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jbWZhUmVxdWlyZWQgIT09IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHNlc3Npb24gaW5mb3JtYXRpb24gdG8gdXNlIGZvciBhbnkgTUZBIGFwcHJvdmFsIHJlcXVlc3RzIChpZiBhbnkgd2FzIGluY2x1ZGVkIGluIHRoZSByZXNwb25zZSkuXG4gICAqIEByZXR1cm4ge0NsaWVudFNlc3Npb25JbmZvIHwgdW5kZWZpbmVkfVxuICAgKi9cbiAgbWZhU2Vzc2lvbkluZm8oKTogTmV3U2Vzc2lvblJlc3BvbnNlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gKHRoaXMuI3Jlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkPy5zZXNzaW9uID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtVfSBUaGUgcmVzcG9uc2UgZGF0YSwgaWYgbm8gTUZBIGlzIHJlcXVpcmVkICovXG4gIGRhdGEoKTogVSB7XG4gICAgaWYgKHRoaXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNhbGwgYGRhdGEoKWAgd2hpbGUgTUZBIGlzIHJlcXVpcmVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jcmVzcCBhcyBVO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmVzIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb259IHNlc3Npb24gU2lnbmVyIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBhcHByb3ZlVG90cChzZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj4ge1xuICAgIGFzc2VydCh0aGlzLnJlcXVpcmVzTWZhKCkpO1xuICAgIGNvbnN0IG1mYUlkID0gdGhpcy5tZmFJZCgpO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcbiAgICBjb25zdCBtZmFBcHByb3ZhbCA9IGF3YWl0IHNlc3Npb24udG90cEFwcHJvdmUobWZhSWQsIGNvZGUpO1xuICAgIGFzc2VydChtZmFBcHByb3ZhbC5pZCA9PT0gbWZhSWQpO1xuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG5cbiAgICBpZiAoIW1mYUNvbmYpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnNpZ25XaXRoTWZhQXBwcm92YWwoeyBtZmFJZCwgbWZhT3JnSWQsIG1mYUNvbmYgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZXMgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gYEN1YmVTaWduZXJDbGllbnRgIGluc3RhbmNlIChpLmUuLCBpdHMgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZShjczogQ3ViZVNpZ25lcik6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+PiB7XG4gICAgYXNzZXJ0KHRoaXMucmVxdWlyZXNNZmEoKSk7XG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLiNtZmFSZXF1aXJlZCEuaWQ7XG4gICAgY29uc3QgbWZhT3JnSWQgPSB0aGlzLiNtZmFSZXF1aXJlZCEub3JnX2lkO1xuXG4gICAgY29uc3QgbWZhQXBwcm92YWwgPSBhd2FpdCBjcy5tZmFBcHByb3ZlKG1mYU9yZ0lkLCBtZmFJZCk7XG4gICAgYXNzZXJ0KG1mYUFwcHJvdmFsLmlkID09PSBtZmFJZCk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgVGhlIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFU+Pn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIGFmdGVyIE1GQSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgc2lnbldpdGhNZmFBcHByb3ZhbChtZmFSZWNlaXB0OiBNZmFSZWNlaXB0KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBoZWFkZXJzID0gQ3ViZVNpZ25lclJlc3BvbnNlLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyUmVzcG9uc2UodGhpcy4jcmVxdWVzdEZuLCBhd2FpdCB0aGlzLiNyZXF1ZXN0Rm4oaGVhZGVycykpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7UmVxdWVzdEZufSByZXF1ZXN0Rm5cbiAgICogICAgVGhlIHNpZ25pbmcgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgIFRoaXMgYXJndW1lbnQgaXMgdXNlZCB0byByZXNlbmQgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7VSB8IEFjY2VwdGVkUmVzcG9uc2V9IHJlc3AgVGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGJ5IHRoZSBPcGVuQVBJIGNsaWVudC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHJlcXVlc3RGbjogUmVxdWVzdEZuPFU+LCByZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZSkge1xuICAgIHRoaXMuI3JlcXVlc3RGbiA9IHJlcXVlc3RGbjtcbiAgICB0aGlzLiNyZXNwID0gcmVzcDtcbiAgICB0aGlzLiNtZmFSZXF1aXJlZCA9ICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGF0aWMgY29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7UmVxdWVzdEZufSByZXF1ZXN0Rm5cbiAgICogICAgVGhlIHJlcXVlc3QgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgIFRoaXMgYXJndW1lbnQgaXMgdXNlZCB0byByZXNlbmQgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVPj59IE5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxVPihcbiAgICByZXF1ZXN0Rm46IFJlcXVlc3RGbjxVPixcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBzZWVkID0gYXdhaXQgcmVxdWVzdEZuKHRoaXMuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KSk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyUmVzcG9uc2UocmVxdWVzdEZuLCBzZWVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIEhUVFAgaGVhZGVycyBjb250YWluaW5nIGEgZ2l2ZW4gTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtIZWFkZXJzSW5pdH0gSGVhZGVycyBpbmNsdWRpbmcgdGhhdCByZWNlaXB0XG4gICAqL1xuICBzdGF0aWMgZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCk6IEhlYWRlcnNJbml0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gbWZhUmVjZWlwdFxuICAgICAgPyB7XG4gICAgICAgICAgXCJ4LWN1YmlzdC1tZmEtaWRcIjogbWZhUmVjZWlwdC5tZmFJZCxcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1vcmctaWRcIjogbWZhUmVjZWlwdC5tZmFPcmdJZCxcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1jb25maXJtYXRpb25cIjogbWZhUmVjZWlwdC5tZmFDb25mLFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKiogU2lnbmVyIHNlc3Npb24gaW5mby4gQ2FuIG9ubHkgYmUgdXNlZCB0byByZXZva2UgYSB0b2tlbiwgYnV0IG5vdCBmb3IgYXV0aGVudGljYXRpb24uICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbkluZm8ge1xuICByZWFkb25seSAjY3NjOiBDdWJlU2lnbmVyQ2xpZW50O1xuICByZWFkb25seSAjc2Vzc2lvbklkOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBwdXJwb3NlOiBzdHJpbmc7XG5cbiAgLyoqIFJldm9rZSB0aGlzIHNlc3Npb24gKi9cbiAgYXN5bmMgcmV2b2tlKCkge1xuICAgIGF3YWl0IHRoaXMuI2NzYy5zZXNzaW9uUmV2b2tlKHRoaXMuI3Nlc3Npb25JZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQ2xpZW50fSBjcyBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSB3aGVuIGNhbGxpbmcgYHJldm9rZWBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlc3Npb25JZCBUaGUgSUQgb2YgdGhlIHNlc3Npb247IGNhbiBiZSB1c2VkIGZvciByZXZvY2F0aW9uIGJ1dCBub3QgZm9yIGF1dGhcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1cnBvc2UgU2Vzc2lvbiBwdXJwb3NlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoY3M6IEN1YmVTaWduZXJDbGllbnQsIHNlc3Npb25JZDogc3RyaW5nLCBwdXJwb3NlOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNjc2MgPSBjcztcbiAgICB0aGlzLiNzZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG4gICAgdGhpcy5wdXJwb3NlID0gcHVycG9zZTtcbiAgfVxufVxuXG4vKipcbiAqIFNpZ25lciBzZXNzaW9uLlxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lclNlc3Npb24ge1xuICByZWFkb25seSAjY3NjOiBDdWJlU2lnbmVyQ2xpZW50O1xuXG4gIC8qKiBEZXByZWNhdGVkICovXG4gIGdldCBzZXNzaW9uTWdyKCkge1xuICAgIHJldHVybiB0aGlzLiNjc2Muc2Vzc2lvbk1ncjtcbiAgfVxuXG4gIC8qKiBPcmcgaWQgKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLiNjc2Mub3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGlzdCBvZiBrZXlzIHRoYXQgdGhpcyB0b2tlbiBncmFudHMgYWNjZXNzIHRvLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvW119IFRoZSBsaXN0IG9mIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzKCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2NzYy5zZXNzaW9uS2V5c0xpc3QoKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IHRvS2V5SW5mbyhrKSk7XG4gIH1cblxuICAvKiogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC4gKi9cbiAgZ2V0IHRvdHBBcHByb3ZlKCkge1xuICAgIHJldHVybiB0aGlzLiNjc2MubWZhQXBwcm92ZVRvdHAuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqIEluaXRpYXRlIGFwcHJvdmFsIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uICovXG4gIGdldCBmaWRvQXBwcm92ZVN0YXJ0KCkge1xuICAgIHJldHVybiB0aGlzLiNjc2MubWZhQXBwcm92ZUZpZG9Jbml0LmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKiBHZXQgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IGJ5IGl0cyBpZC4gKi9cbiAgZ2V0IGdldE1mYUluZm8oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5tZmFHZXQuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqIFN1Ym1pdCBhbiBFVk0gc2lnbiByZXF1ZXN0LiAqL1xuICBnZXQgc2lnbkV2bSgpIHtcbiAgICByZXR1cm4gdGhpcy4jY3NjLnNpZ25Fdm0uYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqIFN1Ym1pdCBhbiAnZXRoMicgc2lnbiByZXF1ZXN0LiAqL1xuICBnZXQgc2lnbkV0aDIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5zaWduRXRoMi5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKiogU2lnbiBhIHN0YWtlIHJlcXVlc3QuICovXG4gIGdldCBzdGFrZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jY3NjLnNpZ25TdGFrZS5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKiogU2lnbiBhbiB1bnN0YWtlIHJlcXVlc3QuICovXG4gIGdldCB1bnN0YWtlKCkge1xuICAgIHJldHVybiB0aGlzLiNjc2Muc2lnblVuc3Rha2UuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqIFNpZ24gYSByYXcgYmxvYi4qL1xuICBnZXQgc2lnbkJsb2IoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5zaWduQmxvYi5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKiogU2lnbiBhIGJpdGNvaW4gbWVzc2FnZS4gKi9cbiAgZ2V0IHNpZ25CdGMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5zaWduQnRjLmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKiBTaWduIGEgc29sYW5hIG1lc3NhZ2UuICovXG4gIGdldCBzaWduU29sYW5hKCkge1xuICAgIHJldHVybiB0aGlzLiNjc2Muc2lnblNvbGFuYS5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKiogU2lnbiBhbiBBdmFsYW5jaGUgUC0gb3IgWC1jaGFpbiBtZXNzYWdlLiAqL1xuICBnZXQgc2lnbkF2YSgpIHtcbiAgICByZXR1cm4gdGhpcy4jY3NjLnNpZ25BdmEuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKi9cbiAgZ2V0IHByb3ZlSWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5pZGVudGl0eVByb3ZlLmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBzaWduZXIgc2Vzc2lvbiBmcm9tIHN0b3JhZ2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb24+IHtcbiAgICBjb25zdCBtYW5hZ2VyID0gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICAgIHJldHVybiBuZXcgU2lnbmVyU2Vzc2lvbihtYW5hZ2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTWFuYWdlcn0gc2Vzc2lvbk1nciBUaGUgc2Vzc2lvbiBtYW5hZ2VyIHRvIHVzZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25NZ3I6IFNpZ25lclNlc3Npb25NYW5hZ2VyKSB7XG4gICAgdGhpcy4jY3NjID0gbmV3IEN1YmVTaWduZXJDbGllbnQoc2Vzc2lvbk1ncik7XG4gIH1cbn1cbiJdfQ==