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
var _SignResponse_instances, _SignResponse_orgId, _SignResponse_signFn, _SignResponse_resp, _SignResponse_signWithMfaApproval, _SignResponse_mfaId, _SignerSessionInfo_cs, _SignerSessionInfo_orgId, _SignerSessionInfo_roleId, _SignerSessionInfo_sessionId, _SignerSession_orgId;
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
     * @param {CubeSigner} cs CubeSigner whose session to use
     * @return {SignResponse<U>} The result of signing with the approval
     */
    async approve(cs) {
        const mfaId = __classPrivateFieldGet(this, _SignResponse_instances, "m", _SignResponse_mfaId).call(this);
        const mfaApproval = await _1.Org.mfaApprove(cs, __classPrivateFieldGet(this, _SignResponse_orgId, "f"), mfaId);
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
     * @param {string} orgId The org id of the corresponding signing request
     * @param {SignFn} signFn The signing function that this response is from.
     *                        This argument is used to resend requests with
     *                        different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI
     *                                    client.
     */
    constructor(orgId, signFn, resp) {
        _SignResponse_instances.add(this);
        _SignResponse_orgId.set(this, void 0);
        _SignResponse_signFn.set(this, void 0);
        _SignResponse_resp.set(this, void 0);
        __classPrivateFieldSet(this, _SignResponse_orgId, orgId, "f");
        __classPrivateFieldSet(this, _SignResponse_signFn, signFn, "f");
        __classPrivateFieldSet(this, _SignResponse_resp, resp, "f");
    }
}
exports.SignResponse = SignResponse;
_SignResponse_orgId = new WeakMap(), _SignResponse_signFn = new WeakMap(), _SignResponse_resp = new WeakMap(), _SignResponse_instances = new WeakSet(), _SignResponse_signWithMfaApproval = 
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
    return new SignResponse(__classPrivateFieldGet(this, _SignResponse_orgId, "f"), __classPrivateFieldGet(this, _SignResponse_signFn, "f"), await __classPrivateFieldGet(this, _SignResponse_signFn, "f").call(this, headers));
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
        return data.keys.map((k) => (0, _1.toKeyInfo)(k));
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
        return new SignResponse(__classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
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
        return new SignResponse(__classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
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
        return new SignResponse(__classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
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
        return new SignResponse(__classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
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
        return new SignResponse(__classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
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
        return new SignResponse(__classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
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
        return new SignResponse(__classPrivateFieldGet(this, _SignerSession_orgId, "f"), sign, await sign());
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
        _SignerSession_orgId.set(this, void 0);
        this.sessionMgr = sessionMgr;
        __classPrivateFieldSet(this, _SignerSession_orgId, sessionMgr.orgId, "f");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLHdCQUE2RDtBQUU3RCxpQ0FBa0M7QUFDbEMsNkVBQThGO0FBNkM5Rjs7R0FFRztBQUNILE1BQWEsWUFBWTtJQUt2Qiw4RUFBOEU7SUFDOUUsV0FBVztRQUNULE9BQVEsdUJBQUEsSUFBSSwwQkFBMkIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxLQUFLLFNBQVMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLElBQUk7UUFDRixPQUFPLHVCQUFBLElBQUksMEJBQVcsQ0FBQztJQUN6QixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXNCLEVBQUUsSUFBWTtRQUNwRCxNQUFNLEtBQUssR0FBRyx1QkFBQSxJQUFJLG9EQUFPLE1BQVgsSUFBSSxDQUFTLENBQUM7UUFFNUIsTUFBTSxXQUFXLEdBQUcsTUFBTSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRCxJQUFBLGdCQUFNLEVBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztRQUVsRCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1NBQ3pEO1FBRUQsT0FBTyxNQUFNLHVCQUFBLElBQUksa0VBQXFCLE1BQXpCLElBQUksRUFBc0IsT0FBUSxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQWM7UUFDMUIsTUFBTSxLQUFLLEdBQUcsdUJBQUEs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LEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRTthQUNoRTtZQUNELE9BQU8sRUFBRSxNQUFNO1NBQ2hCLENBQUMsQ0FBQztRQUNILElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pCLENBQUM7Q0FDRjtBQXBQRCxzQ0FvUEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCB7IEN1YmVTaWduZXIsIEtleSwgdG9LZXlJbmZvLCBPcmcsIEtleUluZm8gfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cywgcGF0aHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsIFNpZ25lclNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5cbi8qIGVzbGludC1kaXNhYmxlICovXG5leHBvcnQgdHlwZSBFdm1TaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS9ldGgxL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS9ldGgyL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTdGFrZVJlcXVlc3QgPVxuICBwYXRoc1tcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlVuc3Rha2VSZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvdW5zdGFrZS97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQmxvYlNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2Jsb2Ivc2lnbi97a2V5X2lkfVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQnRjU2lnblJlcXVlc3QgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIFNvbGFuYVNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L3NvbGFuYS9zaWduL3twdWJrZXl9XCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbmV4cG9ydCB0eXBlIEV2bVNpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJFdGgxU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBFdGgyU2lnblJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIkV0aDJTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTdGFrZVJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlN0YWtlUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJVbnN0YWtlUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiVW5zdGFrZVJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBCbG9iU2lnblJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIkJsb2JTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEJ0Y1NpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJCdGNTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIFNvbGFuYVNpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJTb2xhbmFTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIE1mYVJlcXVlc3RJbmZvID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIk1mYVJlcXVlc3RJbmZvXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbmV4cG9ydCB0eXBlIEFjY2VwdGVkUmVzcG9uc2UgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIkFjY2VwdGVkUmVzcG9uc2VcIl07XG5leHBvcnQgdHlwZSBFcnJvclJlc3BvbnNlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJFcnJvclJlc3BvbnNlXCJdO1xuZXhwb3J0IHR5cGUgQnRjU2lnbmF0dXJlS2luZCA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiQnRjU2lnbmF0dXJlS2luZFwiXTtcbi8qIGVzbGludC1lbmFibGUgKi9cblxuLyoqIE1GQSByZXF1ZXN0IGtpbmQgKi9cbmV4cG9ydCB0eXBlIE1mYVR5cGUgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIk1mYVR5cGVcIl07XG5cbnR5cGUgU2lnbkZuPFU+ID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4gUHJvbWlzZTxVIHwgQWNjZXB0ZWRSZXNwb25zZT47XG5cbi8qKlxuICogQSByZXNwb25zZSBvZiBhIHNpZ25pbmcgcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25SZXNwb25zZTxVPiB7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICByZWFkb25seSAjc2lnbkZuOiBTaWduRm48VT47XG4gIHJlYWRvbmx5ICNyZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcblxuICAvKiogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGlzIHNpZ25pbmcgcmVxdWVzdCByZXF1aXJlcyBhbiBNRkEgYXBwcm92YWwgKi9cbiAgcmVxdWlyZXNNZmEoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZCAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge1V9IFRoZSBzaWduZWQgZGF0YSAqL1xuICBkYXRhKCk6IFUge1xuICAgIHJldHVybiB0aGlzLiNyZXNwIGFzIFU7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZXMgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2lnbmVyIHNlc3Npb24gYW5kIGEgVE9UUCBjb2RlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIG9ubHkgd29ya3MgZm9yIE1GQSByZXF1ZXN0cyB0aGF0IHJlcXVpcmUgYSBzaW5nbGUgYXBwcm92YWwuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc2Vzc2lvbiBTaWduZXIgc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7U2lnblJlc3BvbnNlPFU+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGFwcHJvdmVUb3RwKHNlc3Npb246IFNpZ25lclNlc3Npb24sIGNvZGU6IHN0cmluZyk6IFByb21pc2U8U2lnblJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLiNtZmFJZCgpO1xuXG4gICAgY29uc3QgbWZhQXBwcm92YWwgPSBhd2FpdCBzZXNzaW9uLnRvdHBBcHByb3ZlKG1mYUlkLCBjb2RlKTtcbiAgICBhc3NlcnQobWZhQXBwcm92YWwuaWQgPT09IG1mYUlkKTtcbiAgICBjb25zdCBtZmFDb25mID0gbWZhQXBwcm92YWwucmVjZWlwdD8uY29uZmlybWF0aW9uO1xuXG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZmFSZXF1ZXN0IGhhcyBub3QgYmVlbiBhcHByb3ZlZCB5ZXRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25XaXRoTWZhQXBwcm92YWwobWZhQ29uZiEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmVzIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBDdWJlU2lnbmVyJ3MgbWFuYWdlbWVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIG9ubHkgd29ya3MgZm9yIE1GQSByZXF1ZXN0cyB0aGF0IHJlcXVpcmUgYSBzaW5nbGUgYXBwcm92YWwuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtTaWduUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZShjczogQ3ViZVNpZ25lcik6IFByb21pc2U8U2lnblJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLiNtZmFJZCgpO1xuXG4gICAgY29uc3QgbWZhQXBwcm92YWwgPSBhd2FpdCBPcmcubWZhQXBwcm92ZShjcywgdGhpcy4jb3JnSWQsIG1mYUlkKTtcbiAgICBhc3NlcnQobWZhQXBwcm92YWwuaWQgPT09IG1mYUlkKTtcbiAgICBjb25zdCBtZmFDb25mID0gbWZhQXBwcm92YWwucmVjZWlwdD8uY29uZmlybWF0aW9uO1xuXG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZmFSZXF1ZXN0IGhhcyBub3QgYmVlbiBhcHByb3ZlZCB5ZXRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25XaXRoTWZhQXBwcm92YWwobWZhQ29uZik7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmcgaWQgb2YgdGhlIGNvcnJlc3BvbmRpbmcgc2lnbmluZyByZXF1ZXN0XG4gICAqIEBwYXJhbSB7U2lnbkZufSBzaWduRm4gVGhlIHNpZ25pbmcgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0ge1UgfCBBY2NlcHRlZFJlc3BvbnNlfSByZXNwIFRoZSByZXNwb25zZSBhcyByZXR1cm5lZCBieSB0aGUgT3BlbkFQSVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG9yZ0lkOiBzdHJpbmcsIHNpZ25GbjogU2lnbkZuPFU+LCByZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZSkge1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jc2lnbkZuID0gc2lnbkZuO1xuICAgIHRoaXMuI3Jlc3AgPSByZXNwO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFDb25mIE1GQSByZXF1ZXN0IGFwcHJvdmFsIGNvbmZpcm1hdGlvbiBjb2RlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnblJlc3BvbnNlPFU+Pn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIGFmdGVyIE1GQSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgI3NpZ25XaXRoTWZhQXBwcm92YWwobWZhQ29uZjogc3RyaW5nKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBtZmFJZCA9IHRoaXMuI21mYUlkKCk7XG5cbiAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgXCJ4LWN1YmlzdC1tZmEtaWRcIjogbWZhSWQsXG4gICAgICBcIngtY3ViaXN0LW1mYS1jb25maXJtYXRpb25cIjogbWZhQ29uZixcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuI29yZ0lkLCB0aGlzLiNzaWduRm4sIGF3YWl0IHRoaXMuI3NpZ25GbihoZWFkZXJzKSk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBNRkEgaWQgaWYgTUZBIGlzIHJlcXVpcmVkIGZvciB0aGlzIHJlc3BvbnNlOyB0aHJvd3Mgb3RoZXJ3aXNlLlxuICAgKi9cbiAgI21mYUlkKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbWZhUmVxdWlyZWQgPSAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQ7XG4gICAgaWYgKCFtZmFSZXF1aXJlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVxdWVzdCBkb2VzIG5vdCByZXF1aXJlIE1GQSBhcHByb3ZhbFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIG1mYVJlcXVpcmVkLmlkO1xuICB9XG59XG5cbi8qKiBTaWduZXIgc2Vzc2lvbiBpbmZvLiBDYW4gb25seSBiZSB1c2VkIHRvIHJldm9rZSBhIHRva2VuLCBidXQgbm90IGZvciBhdXRoZW50aWNhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXJTZXNzaW9uSW5mbyB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNyb2xlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgI3Nlc3Npb25JZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgcHVycG9zZTogc3RyaW5nO1xuXG4gIC8qKiBSZXZva2UgdGhpcyB0b2tlbiAqL1xuICBhc3luYyByZXZva2UoKSB7XG4gICAgYXdhaXQgU2lnbmVyU2Vzc2lvbi5yZXZva2UodGhpcy4jY3MsIHRoaXMuI29yZ0lkLCB0aGlzLiNyb2xlSWQsIHRoaXMuI3Nlc3Npb25JZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSB3aGVuIGNhbGxpbmcgYHJldm9rZWBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIE9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggVGhlIGhhc2ggb2YgdGhlIHRva2VuOyBjYW4gYmUgdXNlZCBmb3IgcmV2b2NhdGlvbiBidXQgbm90IGZvciBhdXRoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFNlc3Npb24gcHVycG9zZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCByb2xlSWQ6IHN0cmluZywgaGFzaDogc3RyaW5nLCBwdXJwb3NlOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNjcyA9IGNzO1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jcm9sZUlkID0gcm9sZUlkO1xuICAgIHRoaXMuI3Nlc3Npb25JZCA9IGhhc2g7XG4gICAgdGhpcy5wdXJwb3NlID0gcHVycG9zZTtcbiAgfVxufVxuXG4vKiogU2lnbmVyIHNlc3Npb24uICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbiB7XG4gIHNlc3Npb25NZ3I6IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuICByZWFkb25seSAjb3JnSWQ6IHN0cmluZztcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGlzdCBvZiBrZXlzIHRoYXQgdGhpcyB0b2tlbiBncmFudHMgYWNjZXNzIHRvLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIGxpc3Qgb2Yga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXMoKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3Rva2VuL2tleXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEua2V5cy5tYXAoKGspID0+IHRvS2V5SW5mbyhrKSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCB0byBhcHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBBcHByb3ZlKG1mYUlkOiBzdHJpbmcsIGNvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgKS5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L3RvdHBcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgICBib2R5OiB7IGNvZGUgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJtaXQgYW4gRVZNIHNpZ24gcmVxdWVzdC5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXZtU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShrZXk6IEtleSB8IHN0cmluZywgcmVxOiBFdm1TaWduUmVxdWVzdCk6IFByb21pc2U8U2lnblJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgxL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZSh0aGlzLiNvcmdJZCwgc2lnbiwgYXdhaXQgc2lnbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJtaXQgYW4gJ2V0aDInIHNpZ24gcmVxdWVzdC5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXRoMlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihrZXk6IEtleSB8IHN0cmluZywgcmVxOiBFdGgyU2lnblJlcXVlc3QpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxFdGgyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuI29yZ0lkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzdGFrZSByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0V0aDJTdGFrZVJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTdGFrZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHN0YWtlKHJlcTogRXRoMlN0YWtlUmVxdWVzdCk6IFByb21pc2U8U2lnblJlc3BvbnNlPEV0aDJTdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZSh0aGlzLiNvcmdJZCwgc2lnbiwgYXdhaXQgc2lnbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIHVuc3Rha2UgcmVxdWVzdC5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXRoMlVuc3Rha2VSZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxFdGgyVW5zdGFrZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHVuc3Rha2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gICk6IFByb21pc2U8U2lnblJlc3BvbnNlPEV0aDJVbnN0YWtlUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MS9vcmcve29yZ19pZH0vZXRoMi91bnN0YWtlL3twdWJrZXl9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2UodGhpcy4jb3JnSWQsIHNpZ24sIGF3YWl0IHNpZ24oKSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHJhdyBibG9iLlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIElEKS5cbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHJldHVybiB7UHJvbWlzZTxCbG9iU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKGtleTogS2V5IHwgc3RyaW5nLCByZXE6IEJsb2JTaWduUmVxdWVzdCk6IFByb21pc2U8U2lnblJlc3BvbnNlPEJsb2JTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3Qga2V5X2lkID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5pZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2Jsb2Ivc2lnbi97a2V5X2lkfVwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwga2V5X2lkIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuI29yZ0lkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBiaXRjb2luIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0J0Y1NpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEByZXR1cm4ge1Byb21pc2U8QnRjU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGMoa2V5OiBLZXkgfCBzdHJpbmcsIHJlcTogQnRjU2lnblJlcXVlc3QpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxCdGNTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZSh0aGlzLiNvcmdJZCwgc2lnbiwgYXdhaXQgc2lnbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc29sYW5hIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge1NvbGFuYVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U29sYW5hU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25Tb2xhbmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBTb2xhbmFTaWduUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8U29sYW5hU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L3NvbGFuYS9zaWduL3twdWJrZXl9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2UodGhpcy4jb3JnSWQsIHNpZ24sIGF3YWl0IHNpZ24oKSk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3Rpbmcgc2lnbmVyIHNlc3Npb24gZnJvbSBzdG9yYWdlLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzZXNzaW9uIHN0b3JhZ2UgdG8gdXNlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2luZ2VyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRTaWduZXJTZXNzaW9uKHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uPiB7XG4gICAgY29uc3QgbWFuYWdlciA9IGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKTtcbiAgICByZXR1cm4gbmV3IFNpZ25lclNlc3Npb24obWFuYWdlcik7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbk1hbmFnZXJ9IHNlc3Npb25NZ3IgVGhlIHNlc3Npb24gbWFuYWdlciB0byB1c2VcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uTWdyOiBTaWduZXJTZXNzaW9uTWFuYWdlcikge1xuICAgIHRoaXMuc2Vzc2lvbk1nciA9IHNlc3Npb25NZ3I7XG4gICAgdGhpcy4jb3JnSWQgPSBzZXNzaW9uTWdyLm9yZ0lkO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSByZXF1aXJlLWpzZG9jICovXG5cbiAgLyoqXG4gICAqIFN0YXRpYyBtZXRob2QgZm9yIHJldm9raW5nIGEgdG9rZW4gKHVzZWQgYm90aCBmcm9tIHtTaWduZXJTZXNzaW9ufSBhbmQge1NpZ25lclNlc3Npb25JbmZvfSkuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgUm9sZSBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2Vzc2lvbklkIFNpZ25lciBzZXNzaW9uIElEXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHJldm9rZShjczogQ3ViZVNpZ25lciwgb3JnSWQ6IHN0cmluZywgcm9sZUlkOiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdG9rZW5zL3tzZXNzaW9uX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkLCByb2xlX2lkOiByb2xlSWQsIHNlc3Npb25faWQ6IHNlc3Npb25JZCB9LFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG59XG4iXX0=