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
var _SignResponse_instances, _SignResponse_cs, _SignResponse_orgId, _SignResponse_signFn, _SignResponse_resp, _SignResponse_signWithMfaApproval, _SignResponse_mfaId, _SignerSessionInfo_cs, _SignerSessionInfo_orgId, _SignerSessionInfo_roleId, _SignerSessionInfo_sessionId, _SignerSession_orgId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerSession = exports.SignerSessionInfo = exports.SignResponse = void 0;
const assert_1 = __importDefault(require("assert"));
const _1 = require(".");
const util_1 = require("./util");
const signer_session_manager_1 = require("./session/signer_session_manager");
/**
 * A response of a signing request.
 */
class SignResponse {
    /** @return {boolean} True if this signing request requires an MFA approval */
    requiresMfa() {
        return __classPrivateFieldGet(this, _SignResponse_resp, "f").accepted?.MfaRequired !== undefined;
    }
    /** @return {U} The signed data */
    data() {
        return __classPrivateFieldGet(this, _SignResponse_resp, "f");
    }
    /**
     * Approves the MFA request using a given signer session and a TOTP code.
     *
     * Note: This only works for MFA requests that require a single approval.
     *
     * @param {SignerSession} session Signer session to use
     * @param {string} code 6-digit TOTP code
     * @return {SignResponse<U>} The result of signing with the approval
     */
    async approveTotp(session, code) {
        const mfaId = __classPrivateFieldGet(this, _SignResponse_instances, "m", _SignResponse_mfaId).call(this);
        const mfaApproval = await session.totpApprove(mfaId, code);
        (0, assert_1.default)(mfaApproval.id === mfaId);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            throw new Error("MfaRequest has not been approved yet");
        }
        return await __classPrivateFieldGet(this, _SignResponse_instances, "m", _SignResponse_signWithMfaApproval).call(this, mfaConf);
    }
    /**
     * Approves the MFA request using CubeSigner's management session.
     *
     * Note: This only works for MFA requests that require a single approval.
     *
     * @return {SignResponse<U>} The result of signing with the approval
     */
    async approve() {
        const mfaId = __classPrivateFieldGet(this, _SignResponse_instances, "m", _SignResponse_mfaId).call(this);
        const mfaApproval = await _1.Org.mfaApprove(__classPrivateFieldGet(this, _SignResponse_cs, "f"), __classPrivateFieldGet(this, _SignResponse_orgId, "f"), mfaId);
        (0, assert_1.default)(mfaApproval.id === mfaId);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            throw new Error("MfaRequest has not been approved yet");
        }
        return await __classPrivateFieldGet(this, _SignResponse_instances, "m", _SignResponse_signWithMfaApproval).call(this, mfaConf);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param {CubeSigner} cs The CubeSigner instance to use for requests
     * @param {string} orgId The org id of the corresponding signing request
     * @param {SignFn} signFn The signing function that this response is from.
     *                        This argument is used to resend requests with
     *                        different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI
     *                                    client.
     */
    constructor(cs, orgId, signFn, resp) {
        _SignResponse_instances.add(this);
        _SignResponse_cs.set(this, void 0);
        _SignResponse_orgId.set(this, void 0);
        _SignResponse_signFn.set(this, void 0);
        _SignResponse_resp.set(this, void 0);
        __classPrivateFieldSet(this, _SignResponse_cs, cs, "f");
        __classPrivateFieldSet(this, _SignResponse_orgId, orgId, "f");
        __classPrivateFieldSet(this, _SignResponse_signFn, signFn, "f");
        __classPrivateFieldSet(this, _SignResponse_resp, resp, "f");
    }
}
exports.SignResponse = SignResponse;
_SignResponse_cs = new WeakMap(), _SignResponse_orgId = new WeakMap(), _SignResponse_signFn = new WeakMap(), _SignResponse_resp = new WeakMap(), _SignResponse_instances = new WeakSet(), _SignResponse_signWithMfaApproval = 
/**
 * @param {string} mfaConf MFA request approval confirmation code
 * @return {Promise<SignResponse<U>>} The result of signing after MFA approval
 */
async function _SignResponse_signWithMfaApproval(mfaConf) {
    const mfaId = __classPrivateFieldGet(this, _SignResponse_instances, "m", _SignResponse_mfaId).call(this);
    const headers = {
        "x-cubist-mfa-id": mfaId,
        "x-cubist-mfa-confirmation": mfaConf,
    };
    return new SignResponse(__classPrivateFieldGet(this, _SignResponse_cs, "f"), __classPrivateFieldGet(this, _SignResponse_orgId, "f"), __classPrivateFieldGet(this, _SignResponse_signFn, "f"), await __classPrivateFieldGet(this, _SignResponse_signFn, "f").call(this, headers));
}, _SignResponse_mfaId = function _SignResponse_mfaId() {
    const mfaRequired = __classPrivateFieldGet(this, _SignResponse_resp, "f").accepted?.MfaRequired;
    if (!mfaRequired) {
        throw new Error("Request does not require MFA approval");
    }
    return mfaRequired.id;
};
/** Signer session info. Can only be used to revoke a token, but not for authentication. */
class SignerSessionInfo {
    /** Revoke this token */
    async revoke() {
        await SignerSession.revoke(__classPrivateFieldGet(this, _SignerSessionInfo_cs, "f"), __classPrivateFieldGet(this, _SignerSessionInfo_orgId, "f"), __classPrivateFieldGet(this, _SignerSessionInfo_roleId, "f"), __classPrivateFieldGet(this, _SignerSessionInfo_sessionId, "f"));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Internal constructor.
     * @param {CubeSigner} cs CubeSigner instance to use when calling `revoke`
     * @param {string} orgId Organization ID
     * @param {string} roleId Role ID
     * @param {string} hash The hash of the token; can be used for revocation but not for auth
     * @param {string} purpose Session purpose
     * @internal
     */
    constructor(cs, orgId, roleId, hash, purpose) {
        _SignerSessionInfo_cs.set(this, void 0);
        _SignerSessionInfo_orgId.set(this, void 0);
        _SignerSessionInfo_roleId.set(this, void 0);
        _SignerSessionInfo_sessionId.set(this, void 0);
        __classPrivateFieldSet(this, _SignerSessionInfo_cs, cs, "f");
        __classPrivateFieldSet(this, _SignerSessionInfo_orgId, orgId, "f");
        __classPrivateFieldSet(this, _SignerSessionInfo_roleId, roleId, "f");
        __classPrivateFieldSet(this, _SignerSessionInfo_sessionId, hash, "f");
        this.purpose = purpose;
    }
}
exports.SignerSessionInfo = SignerSessionInfo;
_SignerSessionInfo_cs = new WeakMap(), _SignerSessionInfo_orgId = new WeakMap(), _SignerSessionInfo_roleId = new WeakMap(), _SignerSessionInfo_sessionId = new WeakMap();
/** Signer session. */
class SignerSession {
    /**
     * Returns the list of keys that this token grants access to.
     * @return {Key[]} The list of keys.
     */
    async keys() {
        const resp = await (await this.sessionMgr.client()).get("/v0/org/{org_id}/token/keys", {
            params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f") } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data.keys.map((k) => new _1.Key(this.cs, __classPrivateFieldGet(this, _SignerSession_orgId, "f"), k));
    }
    /**
     * Approve a pending MFA request using TOTP.
     *
     * @param {string} mfaId The MFA request to approve
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request
     */
    async totpApprove(mfaId, code) {
        const resp = await (await this.sessionMgr.client()).patch("/v0/org/{org_id}/mfa/{mfa_id}/totp", {
            params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), mfa_id: mfaId } },
            body: { code },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Submit an EVM sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EvmSignRequest} req What to sign.
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature
     */
    async signEvm(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v1/org/{org_id}/eth1/sign/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new SignResponse(this.cs, __classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
    }
    /**
     * Submit an 'eth2' sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2SignRequest} req What to sign.
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    async signEth2(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v1/org/{org_id}/eth2/sign/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new SignResponse(this.cs, __classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
    }
    /**
     * Sign a stake request.
     * @param {Eth2StakeRequest} req The request to sign.
     * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
     */
    async stake(req) {
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v1/org/{org_id}/eth2/stake", {
                params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f") } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new SignResponse(this.cs, __classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
    }
    /**
     * Sign an unstake request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    async unstake(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v1/org/{org_id}/eth2/unstake/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new SignResponse(this.cs, __classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
    }
    /**
     * Sign a raw blob.
     * @param {Key | string} key The key to sign with (either {@link Key} or its ID).
     * @param {BlobSignRequest} req What to sign
     * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
     */
    async signBlob(key, req) {
        const key_id = typeof key === "string" ? key : key.id;
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v1/org/{org_id}/blob/sign/{key_id}", {
                params: {
                    path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), key_id },
                },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new SignResponse(this.cs, __classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
    }
    /**
     * Sign a bitcoin message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    async signBtc(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v0/org/{org_id}/btc/sign/{pubkey}", {
                params: {
                    path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), pubkey },
                },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new SignResponse(this.cs, __classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
    }
    /**
     * Sign a solana message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SolanaSignRequest} req What to sign
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    async signSolana(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v1/org/{org_id}/solana/sign/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new SignResponse(this.cs, __classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
    }
    /**
     * Loads an existing signer session from storage.
     * @param {CubeSigner} cs The CubeSigner instance
     * @param {SignerSessionStorage} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session
     */
    static async loadSignerSession(cs, storage) {
        const info = await storage.retrieve();
        const manager = await signer_session_manager_1.SignerSessionManager.loadFromStorage(cs, storage);
        return new SignerSession(cs, manager, info.role_id);
    }
    /**
     * Constructor.
     * @param {CubeSigner} cs The CubeSigner instance to use for requests
     * @param {OidcSessionManager | SignerSessionManager} sessionMgr The session manager to use
     * @param {string} roleId The id of the role that this session assumes
     * @internal
     */
    constructor(cs, sessionMgr, roleId) {
        _SignerSession_orgId.set(this, void 0);
        this.cs = cs;
        this.sessionMgr = sessionMgr;
        __classPrivateFieldSet(this, _SignerSession_orgId, sessionMgr.orgId, "f");
        this.roleId = roleId;
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /* eslint-disable require-jsdoc */
    /**
     * Static method for revoking a token (used both from {SignerSession} and {SignerSessionInfo}).
     * @param {CubeSigner} cs CubeSigner instance
     * @param {string} orgId Organization ID
     * @param {string} roleId Role ID
     * @param {string} sessionId Signer session ID
     * @internal
     */
    static async revoke(cs, orgId, roleId, sessionId) {
        const resp = await (await cs.management()).del("/v0/org/{org_id}/roles/{role_id}/tokens/{session_id}", {
            params: {
                path: { org_id: orgId, role_id: roleId, session_id: sessionId },
            },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
}
exports.SignerSession = SignerSession;
_SignerSession_orgId = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLHdCQUE2RDtBQUU3RCxpQ0FBa0M7QUFDbEMsNkVBQThGO0FBK0M5Rjs7R0FFRztBQUNILE1BQWEsWUFBWTtJQU12Qiw4RUFBOEU7SUFDOUUsV0FBVztRQUNULE9BQVEsdUJBQUEsSUFBSSwwQkFBMkIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxLQUFLLFNBQVMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLElBQUk7UUFDRixPQUFPLHVCQUFBLElBQUksMEJBQVcsQ0FBQztJQUN6QixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXNCLEVBQUUsSUFBWTtRQUNwRCxNQUFNLEtBQUssR0FBRyx1QkFBQSxJQUFJLG9EQUFPLE1BQVgsSUFBSSxDQUFTLENBQUM7UUFFNUIsTUFBTSxXQUFXLEdBQUcsTUFBTSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRCxJQUFBLGdCQUFNLEVBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztRQUVsRCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1NBQ3pEO1FBRUQsT0FBTyxNQUFNLHVCQUFBLElBQUksa0VBQXFCLE1BQXpCLElBQUksRUFBc0IsT0FBUSxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxLQUFLLEdBQUcsdUJBQUEsSUFBSSxvREFBTyxN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RUFBYyxFQUNkLFVBQXFELEVBQ3JELE1BQWM7UUEvTlAsdUNBQWU7UUFpT3RCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsdUJBQUEsSUFBSSx3QkFBVSxVQUFVLENBQUMsS0FBSyxNQUFBLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDdkIsQ0FBQztJQUVELDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBRTdFLGtDQUFrQztJQUVsQzs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBYyxFQUFFLEtBQWEsRUFBRSxNQUFjLEVBQUUsU0FBaUI7UUFDbEYsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUNqQixNQUFNLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FDdEIsQ0FBQyxHQUFHLENBQUMsc0RBQXNELEVBQUU7WUFDNUQsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFO2FBQ2hFO1lBQ0QsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBblFELHNDQW1RQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lciwgS2V5LCBPaWRjU2Vzc2lvbk1hbmFnZXIsIE9yZyB9IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBjb21wb25lbnRzLCBwYXRocyB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgeyBTaWduZXJTZXNzaW9uTWFuYWdlciwgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcblxuZXhwb3J0IHR5cGUgS2V5SW5mbyA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiS2V5SW5mb1wiXTtcblxuLyogZXNsaW50LWRpc2FibGUgKi9cbmV4cG9ydCB0eXBlIEV2bVNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDEvc2lnbi97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlN0YWtlUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS9ldGgyL3N0YWtlXCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBFdGgyVW5zdGFrZVJlcXVlc3QgPVxuICBwYXRoc1tcIi92MS9vcmcve29yZ19pZH0vZXRoMi91bnN0YWtlL3twdWJrZXl9XCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBCbG9iU2lnblJlcXVlc3QgPVxuICBwYXRoc1tcIi92MS9vcmcve29yZ19pZH0vYmxvYi9zaWduL3trZXlfaWR9XCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBCdGNTaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YwL29yZy97b3JnX2lkfS9idGMvc2lnbi97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgU29sYW5hU2lnblJlcXVlc3QgPVxuICBwYXRoc1tcIi92MS9vcmcve29yZ19pZH0vc29sYW5hL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcblxuZXhwb3J0IHR5cGUgRXZtU2lnblJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIkV0aDFTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiRXRoMlNpZ25SZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlN0YWtlUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiU3Rha2VSZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlVuc3Rha2VSZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJVbnN0YWtlUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEJsb2JTaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiQmxvYlNpZ25SZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQnRjU2lnblJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIkJ0Y1NpZ25SZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgU29sYW5hU2lnblJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlNvbGFuYVNpZ25SZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgTWZhUmVxdWVzdEluZm8gPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiTWZhUmVxdWVzdEluZm9cIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcblxuZXhwb3J0IHR5cGUgQWNjZXB0ZWRSZXNwb25zZSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiQWNjZXB0ZWRSZXNwb25zZVwiXTtcbmV4cG9ydCB0eXBlIEVycm9yUmVzcG9uc2UgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIkVycm9yUmVzcG9uc2VcIl07XG5leHBvcnQgdHlwZSBCdGNTaWduYXR1cmVLaW5kID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJCdGNTaWduYXR1cmVLaW5kXCJdO1xuLyogZXNsaW50LWVuYWJsZSAqL1xuXG4vKiogTUZBIHJlcXVlc3Qga2luZCAqL1xuZXhwb3J0IHR5cGUgTWZhVHlwZSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiTWZhVHlwZVwiXTtcblxudHlwZSBTaWduRm48VT4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiBQcm9taXNlPFUgfCBBY2NlcHRlZFJlc3BvbnNlPjtcblxuLyoqXG4gKiBBIHJlc3BvbnNlIG9mIGEgc2lnbmluZyByZXF1ZXN0LlxuICovXG5leHBvcnQgY2xhc3MgU2lnblJlc3BvbnNlPFU+IHtcbiAgcmVhZG9ubHkgI2NzOiBDdWJlU2lnbmVyO1xuICByZWFkb25seSAjb3JnSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgI3NpZ25GbjogU2lnbkZuPFU+O1xuICByZWFkb25seSAjcmVzcDogVSB8IEFjY2VwdGVkUmVzcG9uc2U7XG5cbiAgLyoqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhpcyBzaWduaW5nIHJlcXVlc3QgcmVxdWlyZXMgYW4gTUZBIGFwcHJvdmFsICovXG4gIHJlcXVpcmVzTWZhKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQgIT09IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtVfSBUaGUgc2lnbmVkIGRhdGEgKi9cbiAgZGF0YSgpOiBVIHtcbiAgICByZXR1cm4gdGhpcy4jcmVzcCBhcyBVO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmVzIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIHNpZ25lciBzZXNzaW9uIGFuZCBhIFRPVFAgY29kZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyBvbmx5IHdvcmtzIGZvciBNRkEgcmVxdWVzdHMgdGhhdCByZXF1aXJlIGEgc2luZ2xlIGFwcHJvdmFsLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb259IHNlc3Npb24gU2lnbmVyIHNlc3Npb24gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgVE9UUCBjb2RlXG4gICAqIEByZXR1cm4ge1NpZ25SZXNwb25zZTxVPn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIHdpdGggdGhlIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBhcHByb3ZlVG90cChzZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhSWQoKTtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgc2Vzc2lvbi50b3RwQXBwcm92ZShtZmFJZCwgY29kZSk7XG4gICAgYXNzZXJ0KG1mYUFwcHJvdmFsLmlkID09PSBtZmFJZCk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWZhUmVxdWVzdCBoYXMgbm90IGJlZW4gYXBwcm92ZWQgeWV0XCIpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduV2l0aE1mYUFwcHJvdmFsKG1mYUNvbmYhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlcyB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgQ3ViZVNpZ25lcidzIG1hbmFnZW1lbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogTm90ZTogVGhpcyBvbmx5IHdvcmtzIGZvciBNRkEgcmVxdWVzdHMgdGhhdCByZXF1aXJlIGEgc2luZ2xlIGFwcHJvdmFsLlxuICAgKlxuICAgKiBAcmV0dXJuIHtTaWduUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhSWQoKTtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgT3JnLm1mYUFwcHJvdmUodGhpcy4jY3MsIHRoaXMuI29yZ0lkLCBtZmFJZCk7XG4gICAgYXNzZXJ0KG1mYUFwcHJvdmFsLmlkID09PSBtZmFJZCk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWZhUmVxdWVzdCBoYXMgbm90IGJlZW4gYXBwcm92ZWQgeWV0XCIpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduV2l0aE1mYUFwcHJvdmFsKG1mYUNvbmYpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciByZXF1ZXN0c1xuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZyBpZCBvZiB0aGUgY29ycmVzcG9uZGluZyBzaWduaW5nIHJlcXVlc3RcbiAgICogQHBhcmFtIHtTaWduRm59IHNpZ25GbiBUaGUgc2lnbmluZyBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGhcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7VSB8IEFjY2VwdGVkUmVzcG9uc2V9IHJlc3AgVGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGJ5IHRoZSBPcGVuQVBJXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50LlxuICAgKi9cbiAgY29uc3RydWN0b3IoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIHNpZ25GbjogU2lnbkZuPFU+LCByZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZSkge1xuICAgIHRoaXMuI2NzID0gY3M7XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLiNzaWduRm4gPSBzaWduRm47XG4gICAgdGhpcy4jcmVzcCA9IHJlc3A7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUNvbmYgTUZBIHJlcXVlc3QgYXBwcm92YWwgY29uZmlybWF0aW9uIGNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduUmVzcG9uc2U8VT4+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgYWZ0ZXIgTUZBIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyAjc2lnbldpdGhNZmFBcHByb3ZhbChtZmFDb25mOiBzdHJpbmcpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhSWQoKTtcblxuICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICBcIngtY3ViaXN0LW1mYS1pZFwiOiBtZmFJZCxcbiAgICAgIFwieC1jdWJpc3QtbWZhLWNvbmZpcm1hdGlvblwiOiBtZmFDb25mLFxuICAgIH07XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2UodGhpcy4jY3MsIHRoaXMuI29yZ0lkLCB0aGlzLiNzaWduRm4sIGF3YWl0IHRoaXMuI3NpZ25GbihoZWFkZXJzKSk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBNRkEgaWQgaWYgTUZBIGlzIHJlcXVpcmVkIGZvciB0aGlzIHJlc3BvbnNlOyB0aHJvd3Mgb3RoZXJ3aXNlLlxuICAgKi9cbiAgI21mYUlkKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbWZhUmVxdWlyZWQgPSAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQ7XG4gICAgaWYgKCFtZmFSZXF1aXJlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVxdWVzdCBkb2VzIG5vdCByZXF1aXJlIE1GQSBhcHByb3ZhbFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIG1mYVJlcXVpcmVkLmlkO1xuICB9XG59XG5cbi8qKiBTaWduZXIgc2Vzc2lvbiBpbmZvLiBDYW4gb25seSBiZSB1c2VkIHRvIHJldm9rZSBhIHRva2VuLCBidXQgbm90IGZvciBhdXRoZW50aWNhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXJTZXNzaW9uSW5mbyB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNyb2xlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgI3Nlc3Npb25JZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgcHVycG9zZTogc3RyaW5nO1xuXG4gIC8qKiBSZXZva2UgdGhpcyB0b2tlbiAqL1xuICBhc3luYyByZXZva2UoKSB7XG4gICAgYXdhaXQgU2lnbmVyU2Vzc2lvbi5yZXZva2UodGhpcy4jY3MsIHRoaXMuI29yZ0lkLCB0aGlzLiNyb2xlSWQsIHRoaXMuI3Nlc3Npb25JZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSB3aGVuIGNhbGxpbmcgYHJldm9rZWBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIE9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggVGhlIGhhc2ggb2YgdGhlIHRva2VuOyBjYW4gYmUgdXNlZCBmb3IgcmV2b2NhdGlvbiBidXQgbm90IGZvciBhdXRoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFNlc3Npb24gcHVycG9zZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCByb2xlSWQ6IHN0cmluZywgaGFzaDogc3RyaW5nLCBwdXJwb3NlOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNjcyA9IGNzO1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jcm9sZUlkID0gcm9sZUlkO1xuICAgIHRoaXMuI3Nlc3Npb25JZCA9IGhhc2g7XG4gICAgdGhpcy5wdXJwb3NlID0gcHVycG9zZTtcbiAgfVxufVxuXG4vKiogU2lnbmVyIHNlc3Npb24uICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbiB7XG4gIHJlYWRvbmx5IGNzOiBDdWJlU2lnbmVyO1xuICBzZXNzaW9uTWdyOiBPaWRjU2Vzc2lvbk1hbmFnZXIgfCBTaWduZXJTZXNzaW9uTWFuYWdlcjtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHJvbGVJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBsaXN0IG9mIGtleXMgdGhhdCB0aGlzIHRva2VuIGdyYW50cyBhY2Nlc3MgdG8uXG4gICAqIEByZXR1cm4ge0tleVtdfSBUaGUgbGlzdCBvZiBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5cygpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS90b2tlbi9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhLmtleXMubWFwKChrOiBLZXlJbmZvKSA9PiBuZXcgS2V5KHRoaXMuY3MsIHRoaXMuI29yZ0lkLCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCB0byBhcHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBBcHByb3ZlKG1mYUlkOiBzdHJpbmcsIGNvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgKS5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L3RvdHBcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgICBib2R5OiB7IGNvZGUgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJtaXQgYW4gRVZNIHNpZ24gcmVxdWVzdC5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXZtU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShrZXk6IEtleSB8IHN0cmluZywgcmVxOiBFdm1TaWduUmVxdWVzdCk6IFByb21pc2U8U2lnblJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgxL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZSh0aGlzLmNzLCB0aGlzLiNvcmdJZCwgc2lnbiwgYXdhaXQgc2lnbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJtaXQgYW4gJ2V0aDInIHNpZ24gcmVxdWVzdC5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXRoMlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihrZXk6IEtleSB8IHN0cmluZywgcmVxOiBFdGgyU2lnblJlcXVlc3QpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxFdGgyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuY3MsIHRoaXMuI29yZ0lkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzdGFrZSByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0V0aDJTdGFrZVJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTdGFrZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHN0YWtlKHJlcTogRXRoMlN0YWtlUmVxdWVzdCk6IFByb21pc2U8U2lnblJlc3BvbnNlPEV0aDJTdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZSh0aGlzLmNzLCB0aGlzLiNvcmdJZCwgc2lnbiwgYXdhaXQgc2lnbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIHVuc3Rha2UgcmVxdWVzdC5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXRoMlVuc3Rha2VSZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxFdGgyVW5zdGFrZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHVuc3Rha2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gICk6IFByb21pc2U8U2lnblJlc3BvbnNlPEV0aDJVbnN0YWtlUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MS9vcmcve29yZ19pZH0vZXRoMi91bnN0YWtlL3twdWJrZXl9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2UodGhpcy5jcywgdGhpcy4jb3JnSWQsIHNpZ24sIGF3YWl0IHNpZ24oKSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHJhdyBibG9iLlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIElEKS5cbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHJldHVybiB7UHJvbWlzZTxCbG9iU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKGtleTogS2V5IHwgc3RyaW5nLCByZXE6IEJsb2JTaWduUmVxdWVzdCk6IFByb21pc2U8U2lnblJlc3BvbnNlPEJsb2JTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3Qga2V5X2lkID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5pZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2Jsb2Ivc2lnbi97a2V5X2lkfVwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwga2V5X2lkIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuY3MsIHRoaXMuI29yZ0lkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBiaXRjb2luIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0J0Y1NpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEByZXR1cm4ge1Byb21pc2U8QnRjU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGMoa2V5OiBLZXkgfCBzdHJpbmcsIHJlcTogQnRjU2lnblJlcXVlc3QpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxCdGNTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZSh0aGlzLmNzLCB0aGlzLiNvcmdJZCwgc2lnbiwgYXdhaXQgc2lnbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc29sYW5hIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge1NvbGFuYVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U29sYW5hU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25Tb2xhbmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBTb2xhbmFTaWduUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8U29sYW5hU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L3NvbGFuYS9zaWduL3twdWJrZXl9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2UodGhpcy5jcywgdGhpcy4jb3JnSWQsIHNpZ24sIGF3YWl0IHNpZ24oKSk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3Rpbmcgc2lnbmVyIHNlc3Npb24gZnJvbSBzdG9yYWdlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oXG4gICAgY3M6IEN1YmVTaWduZXIsXG4gICAgc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IGluZm8gPSBhd2FpdCBzdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgY29uc3QgbWFuYWdlciA9IGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShjcywgc3RvcmFnZSk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uKGNzLCBtYW5hZ2VyLCBpbmZvLnJvbGVfaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3IgcmVxdWVzdHNcbiAgICogQHBhcmFtIHtPaWRjU2Vzc2lvbk1hbmFnZXIgfCBTaWduZXJTZXNzaW9uTWFuYWdlcn0gc2Vzc2lvbk1nciBUaGUgc2Vzc2lvbiBtYW5hZ2VyIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZSB0aGF0IHRoaXMgc2Vzc2lvbiBhc3N1bWVzXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgY3M6IEN1YmVTaWduZXIsXG4gICAgc2Vzc2lvbk1ncjogT2lkY1Nlc3Npb25NYW5hZ2VyIHwgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICkge1xuICAgIHRoaXMuY3MgPSBjcztcbiAgICB0aGlzLnNlc3Npb25NZ3IgPSBzZXNzaW9uTWdyO1xuICAgIHRoaXMuI29yZ0lkID0gc2Vzc2lvbk1nci5vcmdJZDtcbiAgICB0aGlzLnJvbGVJZCA9IHJvbGVJZDtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyogZXNsaW50LWRpc2FibGUgcmVxdWlyZS1qc2RvYyAqL1xuXG4gIC8qKlxuICAgKiBTdGF0aWMgbWV0aG9kIGZvciByZXZva2luZyBhIHRva2VuICh1c2VkIGJvdGggZnJvbSB7U2lnbmVyU2Vzc2lvbn0gYW5kIHtTaWduZXJTZXNzaW9uSW5mb30pLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIEN1YmVTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIE9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlc3Npb25JZCBTaWduZXIgc2Vzc2lvbiBJRFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyByZXZva2UoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIHJvbGVJZDogc3RyaW5nLCBzZXNzaW9uSWQ6IHN0cmluZykge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLmRlbChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3Rva2Vucy97c2Vzc2lvbl9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgcm9sZV9pZDogcm9sZUlkLCBzZXNzaW9uX2lkOiBzZXNzaW9uSWQgfSxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxufVxuIl19