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
var _SignResponse_signFn, _SignResponse_resp, _SignResponse_mfaRequired, _SignerSessionInfo_cs, _SignerSessionInfo_orgId, _SignerSessionInfo_roleId, _SignerSessionInfo_sessionId, _SignerSession_orgId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerSession = exports.SignerSessionInfo = exports.SignResponse = void 0;
const assert_1 = __importDefault(require("assert"));
const _1 = require(".");
const util_1 = require("./util");
const signer_session_manager_1 = require("./session/signer_session_manager");
/**
 * A response of a CubeSigner request.
 */
class SignResponse {
    /** @return {string} The MFA id associated with this request */
    mfaId() {
        return __classPrivateFieldGet(this, _SignResponse_mfaRequired, "f").id;
    }
    /** @return {boolean} True if this request requires an MFA approval */
    requiresMfa() {
        return __classPrivateFieldGet(this, _SignResponse_mfaRequired, "f") !== undefined;
    }
    /**
     * Returns session information to use for any MFA approval requests (if any was included in the response).
     * @return {ClientSessionInfo | undefined}
     */
    mfaSessionInfo() {
        return __classPrivateFieldGet(this, _SignResponse_resp, "f").accepted?.MfaRequired?.session ?? undefined;
    }
    /** @return {U} The signed data */
    data() {
        return __classPrivateFieldGet(this, _SignResponse_resp, "f");
    }
    /**
     * Approves the MFA request using a given session and a TOTP code.
     *
     * @param {SignerSession} session Signer session to use
     * @param {string} code 6-digit TOTP code
     * @return {SignResponse<U>} The result of signing with the approval
     */
    async approveTotp(session, code) {
        const mfaId = this.mfaId();
        const mfaOrgId = __classPrivateFieldGet(this, _SignResponse_mfaRequired, "f").org_id;
        const mfaApproval = await session.totpApprove(mfaId, code);
        (0, assert_1.default)(mfaApproval.id === mfaId);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            return this;
        }
        return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
    }
    /**
     * Approves the MFA request using a given `CubeSigner` instance (i.e., its management session).
     *
     * @param {CubeSigner} cs CubeSigner whose session to use
     * @return {SignResponse<U>} The result of signing with the approval
     */
    async approve(cs) {
        const mfaId = __classPrivateFieldGet(this, _SignResponse_mfaRequired, "f").id;
        const mfaOrgId = __classPrivateFieldGet(this, _SignResponse_mfaRequired, "f").org_id;
        const mfaApproval = await _1.Org.mfaApprove(cs, mfaOrgId, mfaId);
        (0, assert_1.default)(mfaApproval.id === mfaId);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            return this;
        }
        return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
    }
    /**
     * @param {MfaReceipt} mfaReceipt The MFA receipt
     * @return {Promise<SignResponse<U>>} The result of signing after MFA approval
     */
    async signWithMfaApproval(mfaReceipt) {
        const headers = SignResponse.getMfaHeaders(mfaReceipt);
        return new SignResponse(__classPrivateFieldGet(this, _SignResponse_signFn, "f"), await __classPrivateFieldGet(this, _SignResponse_signFn, "f").call(this, headers));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param {SignFn} signFn The signing function that this response is from.
     *                        This argument is used to resend requests with
     *                        different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI
     *                                    client.
     */
    constructor(signFn, resp) {
        _SignResponse_signFn.set(this, void 0);
        _SignResponse_resp.set(this, void 0);
        /**
         * Optional MFA id. Only set if there is an MFA request associated with the
         * signing request
         */
        _SignResponse_mfaRequired.set(this, void 0);
        __classPrivateFieldSet(this, _SignResponse_signFn, signFn, "f");
        __classPrivateFieldSet(this, _SignResponse_resp, resp, "f");
        __classPrivateFieldSet(this, _SignResponse_mfaRequired, __classPrivateFieldGet(this, _SignResponse_resp, "f").accepted?.MfaRequired, "f");
    }
    /**
     * Static constructor.
     * @param {SignFn} signFn The signing function that this response is from.
     *                        This argument is used to resend requests with
     *                        different headers if needed.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<SignResponse<U>>} New instance of this class.
     */
    static async create(signFn, mfaReceipt) {
        const seed = await signFn(this.getMfaHeaders(mfaReceipt));
        return new SignResponse(signFn, seed);
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
exports.SignResponse = SignResponse;
_SignResponse_signFn = new WeakMap(), _SignResponse_resp = new WeakMap(), _SignResponse_mfaRequired = new WeakMap();
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
    /** Org id */
    get orgId() {
        return __classPrivateFieldGet(this, _SignerSession_orgId, "f");
    }
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
     * Get a pending MFA request by its id.
     * @param {CubeSigner} cs Management session to use (this argument will be removed in future versions)
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    async getMfaInfo(cs, mfaId) {
        const resp = await (await cs.management()).get("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), mfa_id: mfaId } },
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Submit an EVM sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EvmSignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature
     */
    async signEvm(key, req, mfaReceipt) {
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
        return await SignResponse.create(sign, mfaReceipt);
    }
    /**
     * Submit an 'eth2' sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2SignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    async signEth2(key, req, mfaReceipt) {
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
        return await SignResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign a stake request.
     * @param {Eth2StakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
     */
    async stake(req, mfaReceipt) {
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v1/org/{org_id}/eth2/stake", {
                params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f") } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await SignResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign an unstake request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    async unstake(key, req, mfaReceipt) {
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
        return await SignResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign a raw blob.
     * @param {Key | string} key The key to sign with (either {@link Key} or its ID).
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
     */
    async signBlob(key, req, mfaReceipt) {
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
        return await SignResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign a bitcoin message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    async signBtc(key, req, mfaReceipt) {
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
        return await SignResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign a solana message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SolanaSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    async signSolana(key, req, mfaReceipt) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await this.sessionMgr.client()).post("/v0/org/{org_id}/solana/sign/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await SignResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign an Avalanche P- or X-chain message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    async signAva(key, tx, mfaReceipt) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const req = {
                tx: tx,
            };
            const resp = await (await this.sessionMgr.client()).post("/v0/org/{org_id}/ava/sign/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await SignResponse.create(sign, mfaReceipt);
    }
    /**
     * Obtain a proof of authentication.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async proveIdentity() {
        const client = await this.sessionMgr.client();
        const resp = await client.post("/v0/org/{org_id}/identity/prove", {
            params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f") } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLHdCQUF3RjtBQUV4RixpQ0FBMkM7QUFDM0MsNkVBSTBDO0FBMEUxQzs7R0FFRztBQUNILE1BQWEsWUFBWTtJQVN2QiwrREFBK0Q7SUFDL0QsS0FBSztRQUNILE9BQU8sdUJBQUEsSUFBSSxpQ0FBYyxDQUFDLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsc0VBQXNFO0lBQ3RFLFdBQVc7UUFDVCxPQUFPLHVCQUFBLElBQUksaUNBQWEsS0FBSyxTQUFTLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7T0FHRztJQUNILGNBQWM7UUFDWixPQUFRLHVCQUFBLElBQUksMEJBQTJCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxPQUFPLElBQUksU0FBUyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxrQ0FBa0M7SUFDbEMsSUFBSTtRQUNGLE9BQU8sdUJBQUEsSUFBSSwwQkFBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXNCLEVBQUUsSUFBWTtRQUNwRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0IsTUFBTSxRQUFRLEdBQUcsdUJBQUEsSUFBSSxpQ0FBYyxDQUFDLE1BQU0sQ0FBQztRQUMzQyxNQUFNLFdBQVcsR0FBRyxNQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNELElBQUEsZ0JBQU0sRUFBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO1FBRWxELElBQUksQ0FBQyxPQUFPLEVB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Q0gsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBaFZELHNDQWdWQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lciwgS2V5LCB0b0tleUluZm8sIE9yZywgS2V5SW5mbywgTWZhUmVjZWlwdCwgSWRlbnRpdHlQcm9vZiB9IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBjb21wb25lbnRzLCBwYXRocyB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgSnNvbk1hcCwgYXNzZXJ0T2sgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQge1xuICBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gIFNpZ25lclNlc3Npb25NYW5hZ2VyLFxuICBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbn0gZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5cbi8qIGVzbGludC1kaXNhYmxlICovXG5leHBvcnQgdHlwZSBFdm1TaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS9ldGgxL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS9ldGgyL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTdGFrZVJlcXVlc3QgPVxuICBwYXRoc1tcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlVuc3Rha2VSZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvdW5zdGFrZS97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQmxvYlNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2Jsb2Ivc2lnbi97a2V5X2lkfVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQnRjU2lnblJlcXVlc3QgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIFNvbGFuYVNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9L3NvbGFuYS9zaWduL3twdWJrZXl9XCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBBdmFTaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuXG5leHBvcnQgdHlwZSBFdm1TaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiRXRoMVNpZ25SZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlNpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJFdGgyU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBFdGgyU3Rha2VSZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJTdGFrZVJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBFdGgyVW5zdGFrZVJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlVuc3Rha2VSZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQmxvYlNpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJCbG9iU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBCdGNTaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiQnRjU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBTb2xhbmFTaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiU29sYW5hU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBNZmFSZXF1ZXN0SW5mbyA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJNZmFSZXF1ZXN0SW5mb1wiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQXZhU2lnblJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIkF2YVNpZ25SZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuXG5leHBvcnQgdHlwZSBBY2NlcHRlZFJlc3BvbnNlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJBY2NlcHRlZFJlc3BvbnNlXCJdO1xuZXhwb3J0IHR5cGUgRXJyb3JSZXNwb25zZSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiRXJyb3JSZXNwb25zZVwiXTtcbmV4cG9ydCB0eXBlIEJ0Y1NpZ25hdHVyZUtpbmQgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIkJ0Y1NpZ25hdHVyZUtpbmRcIl07XG4vKiBlc2xpbnQtZW5hYmxlICovXG5cbi8qKiBNRkEgcmVxdWVzdCBraW5kICovXG5leHBvcnQgdHlwZSBNZmFUeXBlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJNZmFUeXBlXCJdO1xuXG4vKiogQXZhIFAtIG9yIFgtY2hhaW4gdHJhbnNhY3Rpb24gKi9cbmV4cG9ydCB0eXBlIEF2YVR4ID0geyBQOiBBdmFQQ2hhaW5UeCB9IHwgeyBYOiBBdmFYQ2hhaW5UeCB9O1xuXG4vKiogQXZhIFAtY2hhaW4gdHJhbnNhY3Rpb24gKi9cbmV4cG9ydCB0eXBlIEF2YVBDaGFpblR4ID1cbiAgfCB7IEFkZFBlcm1pc3Npb25sZXNzVmFsaWRhdG9yOiBKc29uTWFwIH1cbiAgfCB7IEFkZFN1Ym5ldFZhbGlkYXRvcjogSnNvbk1hcCB9XG4gIHwgeyBBZGRWYWxpZGF0b3I6IEpzb25NYXAgfVxuICB8IHsgQ3JlYXRlQ2hhaW46IEpzb25NYXAgfVxuICB8IHsgQ3JlYXRlU3VibmV0OiBKc29uTWFwIH1cbiAgfCB7IEV4cG9ydDogSnNvbk1hcCB9XG4gIHwgeyBJbXBvcnQ6IEpzb25NYXAgfTtcblxuLyoqIEF2YSBYLWNoYWluIHRyYW5zYWN0aW9uICovXG5leHBvcnQgdHlwZSBBdmFYQ2hhaW5UeCA9IHsgQmFzZTogSnNvbk1hcCB9IHwgeyBFeHBvcnQ6IEpzb25NYXAgfSB8IHsgSW1wb3J0OiBKc29uTWFwIH07XG5cbnR5cGUgU2lnbkZuPFU+ID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4gUHJvbWlzZTxVIHwgQWNjZXB0ZWRSZXNwb25zZT47XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWZhUmVxdWlyZWQge1xuICAvKiogT3JnIGlkICovXG4gIG9yZ19pZDogc3RyaW5nO1xuICAvKiogTUZBIHJlcXVlc3QgaWQgKi9cbiAgaWQ6IHN0cmluZztcbiAgLyoqIE9wdGlvbmFsIE1GQSBzZXNzaW9uICovXG4gIHNlc3Npb24/OiBOZXdTZXNzaW9uUmVzcG9uc2UgfCBudWxsO1xufVxuXG4vKipcbiAqIEEgcmVzcG9uc2Ugb2YgYSBDdWJlU2lnbmVyIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWduUmVzcG9uc2U8VT4ge1xuICByZWFkb25seSAjc2lnbkZuOiBTaWduRm48VT47XG4gIHJlYWRvbmx5ICNyZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZTtcbiAgLyoqXG4gICAqIE9wdGlvbmFsIE1GQSBpZC4gT25seSBzZXQgaWYgdGhlcmUgaXMgYW4gTUZBIHJlcXVlc3QgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICAgKiBzaWduaW5nIHJlcXVlc3RcbiAgICovXG4gIHJlYWRvbmx5ICNtZmFSZXF1aXJlZD86IE1mYVJlcXVpcmVkO1xuXG4gIC8qKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcmVxdWVzdCAqL1xuICBtZmFJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNtZmFSZXF1aXJlZCEuaWQ7XG4gIH1cblxuICAvKiogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGlzIHJlcXVlc3QgcmVxdWlyZXMgYW4gTUZBIGFwcHJvdmFsICovXG4gIHJlcXVpcmVzTWZhKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNtZmFSZXF1aXJlZCAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgc2Vzc2lvbiBpbmZvcm1hdGlvbiB0byB1c2UgZm9yIGFueSBNRkEgYXBwcm92YWwgcmVxdWVzdHMgKGlmIGFueSB3YXMgaW5jbHVkZWQgaW4gdGhlIHJlc3BvbnNlKS5cbiAgICogQHJldHVybiB7Q2xpZW50U2Vzc2lvbkluZm8gfCB1bmRlZmluZWR9XG4gICAqL1xuICBtZmFTZXNzaW9uSW5mbygpOiBOZXdTZXNzaW9uUmVzcG9uc2UgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQ/LnNlc3Npb24gPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge1V9IFRoZSBzaWduZWQgZGF0YSAqL1xuICBkYXRhKCk6IFUge1xuICAgIHJldHVybiB0aGlzLiNyZXNwIGFzIFU7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZXMgdGhlIE1GQSByZXF1ZXN0IHVzaW5nIGEgZ2l2ZW4gc2Vzc2lvbiBhbmQgYSBUT1RQIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc2Vzc2lvbiBTaWduZXIgc2Vzc2lvbiB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7U2lnblJlc3BvbnNlPFU+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGFwcHJvdmVUb3RwKHNlc3Npb246IFNpZ25lclNlc3Npb24sIGNvZGU6IHN0cmluZyk6IFByb21pc2U8U2lnblJlc3BvbnNlPFU+PiB7XG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLm1mYUlkKCk7XG4gICAgY29uc3QgbWZhT3JnSWQgPSB0aGlzLiNtZmFSZXF1aXJlZCEub3JnX2lkO1xuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgc2Vzc2lvbi50b3RwQXBwcm92ZShtZmFJZCwgY29kZSk7XG4gICAgYXNzZXJ0KG1mYUFwcHJvdmFsLmlkID09PSBtZmFJZCk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlcyB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiBgQ3ViZVNpZ25lcmAgaW5zdGFuY2UgKGkuZS4sIGl0cyBtYW5hZ2VtZW50IHNlc3Npb24pLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIEN1YmVTaWduZXIgd2hvc2Ugc2Vzc2lvbiB0byB1c2VcbiAgICogQHJldHVybiB7U2lnblJlc3BvbnNlPFU+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgd2l0aCB0aGUgYXBwcm92YWxcbiAgICovXG4gIGFzeW5jIGFwcHJvdmUoY3M6IEN1YmVTaWduZXIpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IG1mYUlkID0gdGhpcy4jbWZhUmVxdWlyZWQhLmlkO1xuICAgIGNvbnN0IG1mYU9yZ0lkID0gdGhpcy4jbWZhUmVxdWlyZWQhLm9yZ19pZDtcblxuICAgIGNvbnN0IG1mYUFwcHJvdmFsID0gYXdhaXQgT3JnLm1mYUFwcHJvdmUoY3MsIG1mYU9yZ0lkLCBtZmFJZCk7XG4gICAgYXNzZXJ0KG1mYUFwcHJvdmFsLmlkID09PSBtZmFJZCk7XG4gICAgY29uc3QgbWZhQ29uZiA9IG1mYUFwcHJvdmFsLnJlY2VpcHQ/LmNvbmZpcm1hdGlvbjtcblxuICAgIGlmICghbWZhQ29uZikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7IG1mYUlkLCBtZmFPcmdJZCwgbWZhQ29uZiB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgVGhlIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnblJlc3BvbnNlPFU+Pn0gVGhlIHJlc3VsdCBvZiBzaWduaW5nIGFmdGVyIE1GQSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgc2lnbldpdGhNZmFBcHByb3ZhbChtZmFSZWNlaXB0OiBNZmFSZWNlaXB0KTogUHJvbWlzZTxTaWduUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBoZWFkZXJzID0gU2lnblJlc3BvbnNlLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCk7XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2UodGhpcy4jc2lnbkZuLCBhd2FpdCB0aGlzLiNzaWduRm4oaGVhZGVycykpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbkZufSBzaWduRm4gVGhlIHNpZ25pbmcgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0ge1UgfCBBY2NlcHRlZFJlc3BvbnNlfSByZXNwIFRoZSByZXNwb25zZSBhcyByZXR1cm5lZCBieSB0aGUgT3BlbkFQSVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHNpZ25GbjogU2lnbkZuPFU+LCByZXNwOiBVIHwgQWNjZXB0ZWRSZXNwb25zZSkge1xuICAgIHRoaXMuI3NpZ25GbiA9IHNpZ25GbjtcbiAgICB0aGlzLiNyZXNwID0gcmVzcDtcbiAgICB0aGlzLiNtZmFSZXF1aXJlZCA9ICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGF0aWMgY29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7U2lnbkZufSBzaWduRm4gVGhlIHNpZ25pbmcgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduUmVzcG9uc2U8VT4+fSBOZXcgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcy5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VT4oc2lnbkZuOiBTaWduRm48VT4sIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0KTogUHJvbWlzZTxTaWduUmVzcG9uc2U8VT4+IHtcbiAgICBjb25zdCBzZWVkID0gYXdhaXQgc2lnbkZuKHRoaXMuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KSk7XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2Uoc2lnbkZuLCBzZWVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIEhUVFAgaGVhZGVycyBjb250YWluaW5nIGEgZ2l2ZW4gTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtIZWFkZXJzSW5pdH0gSGVhZGVycyBpbmNsdWRpbmcgdGhhdCByZWNlaXB0XG4gICAqL1xuICBzdGF0aWMgZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCk6IEhlYWRlcnNJbml0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gbWZhUmVjZWlwdFxuICAgICAgPyB7XG4gICAgICAgICAgXCJ4LWN1YmlzdC1tZmEtaWRcIjogbWZhUmVjZWlwdC5tZmFJZCxcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1vcmctaWRcIjogbWZhUmVjZWlwdC5tZmFPcmdJZCxcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1jb25maXJtYXRpb25cIjogbWZhUmVjZWlwdC5tZmFDb25mLFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKiogU2lnbmVyIHNlc3Npb24gaW5mby4gQ2FuIG9ubHkgYmUgdXNlZCB0byByZXZva2UgYSB0b2tlbiwgYnV0IG5vdCBmb3IgYXV0aGVudGljYXRpb24uICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbkluZm8ge1xuICByZWFkb25seSAjY3M6IEN1YmVTaWduZXI7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICByZWFkb25seSAjcm9sZUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNzZXNzaW9uSWQ6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHB1cnBvc2U6IHN0cmluZztcblxuICAvKiogUmV2b2tlIHRoaXMgdG9rZW4gKi9cbiAgYXN5bmMgcmV2b2tlKCkge1xuICAgIGF3YWl0IFNpZ25lclNlc3Npb24ucmV2b2tlKHRoaXMuI2NzLCB0aGlzLiNvcmdJZCwgdGhpcy4jcm9sZUlkLCB0aGlzLiNzZXNzaW9uSWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2Ugd2hlbiBjYWxsaW5nIGByZXZva2VgXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoIFRoZSBoYXNoIG9mIHRoZSB0b2tlbjsgY2FuIGJlIHVzZWQgZm9yIHJldm9jYXRpb24gYnV0IG5vdCBmb3IgYXV0aFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVycG9zZSBTZXNzaW9uIHB1cnBvc2VcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgb3JnSWQ6IHN0cmluZywgcm9sZUlkOiBzdHJpbmcsIGhhc2g6IHN0cmluZywgcHVycG9zZTogc3RyaW5nKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuI3JvbGVJZCA9IHJvbGVJZDtcbiAgICB0aGlzLiNzZXNzaW9uSWQgPSBoYXNoO1xuICAgIHRoaXMucHVycG9zZSA9IHB1cnBvc2U7XG4gIH1cbn1cblxuLyoqIFNpZ25lciBzZXNzaW9uLiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lclNlc3Npb24ge1xuICBzZXNzaW9uTWdyOiBTaWduZXJTZXNzaW9uTWFuYWdlcjtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG5cbiAgLyoqIE9yZyBpZCAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI29yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxpc3Qgb2Yga2V5cyB0aGF0IHRoaXMgdG9rZW4gZ3JhbnRzIGFjY2VzcyB0by5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBsaXN0IG9mIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzKCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS90b2tlbi9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhLmtleXMubWFwKChrKSA9PiB0b0tleUluZm8oaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIFRPVFAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgdG8gYXBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyB0b3RwQXBwcm92ZShtZmFJZDogc3RyaW5nLCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICkucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS90b3RwXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIG1mYV9pZDogbWZhSWQgfSB9LFxuICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCBieSBpdHMgaWQuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgTWFuYWdlbWVudCBzZXNzaW9uIHRvIHVzZSAodGhpcyBhcmd1bWVudCB3aWxsIGJlIHJlbW92ZWQgaW4gZnV0dXJlIHZlcnNpb25zKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIGdldE1mYUluZm8oY3M6IEN1YmVTaWduZXIsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1Ym1pdCBhbiBFVk0gc2lnbiByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdm1TaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV2bVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIHNpZ25Fdm0oXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdm1TaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBTaWduUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1Ym1pdCBhbiAnZXRoMicgc2lnbiByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgyU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXRoMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc3Rha2UgcmVxdWVzdC5cbiAgICogQHBhcmFtIHtFdGgyU3Rha2VSZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXRoMlN0YWtlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc3Rha2UoXG4gICAgcmVxOiBFdGgyU3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxFdGgyU3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc3Rha2VcIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25SZXNwb25zZS5jcmVhdGUoc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiB1bnN0YWtlIHJlcXVlc3QuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0V0aDJVbnN0YWtlUmVxdWVzdH0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJVbnN0YWtlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdW5zdGFrZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3Vuc3Rha2Uve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgcmF3IGJsb2IuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgSUQpLlxuICAgKiBAcGFyYW0ge0Jsb2JTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCbG9iU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQmxvYlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxCbG9iU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGtleV9pZCA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkuaWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ibG9iL3NpZ24ve2tleV9pZH1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIGtleV9pZCB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgYml0Y29pbiBtZXNzYWdlLlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCdGNTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCdGNTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxCdGNTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc29sYW5hIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge1NvbGFuYVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNvbGFuYVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU29sYW5hKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogU29sYW5hU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8U2lnblJlc3BvbnNlPFNvbGFuYVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9zb2xhbmEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBTaWduUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gQXZhbGFuY2hlIFAtIG9yIFgtY2hhaW4gbWVzc2FnZS5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7QXZhVHh9IHR4IEF2YWxhbmNoZSBtZXNzYWdlICh0cmFuc2FjdGlvbikgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxBdmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICB0eDogQXZhVHgsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8U2lnblJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlcSA9IDxBdmFTaWduUmVxdWVzdD57XG4gICAgICAgIHR4OiB0eCBhcyB1bmtub3duLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBTaWduUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgcHJvdmVJZGVudGl0eSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBzaWduZXIgc2Vzc2lvbiBmcm9tIHN0b3JhZ2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb24+IHtcbiAgICBjb25zdCBtYW5hZ2VyID0gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICAgIHJldHVybiBuZXcgU2lnbmVyU2Vzc2lvbihtYW5hZ2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTWFuYWdlcn0gc2Vzc2lvbk1nciBUaGUgc2Vzc2lvbiBtYW5hZ2VyIHRvIHVzZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25NZ3I6IFNpZ25lclNlc3Npb25NYW5hZ2VyKSB7XG4gICAgdGhpcy5zZXNzaW9uTWdyID0gc2Vzc2lvbk1ncjtcbiAgICB0aGlzLiNvcmdJZCA9IHNlc3Npb25NZ3Iub3JnSWQ7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIHJlcXVpcmUtanNkb2MgKi9cblxuICAvKipcbiAgICogU3RhdGljIG1ldGhvZCBmb3IgcmV2b2tpbmcgYSB0b2tlbiAodXNlZCBib3RoIGZyb20ge1NpZ25lclNlc3Npb259IGFuZCB7U2lnbmVyU2Vzc2lvbkluZm99KS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBDdWJlU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZXNzaW9uSWQgU2lnbmVyIHNlc3Npb24gSURcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcmV2b2tlKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCByb2xlSWQ6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS90b2tlbnMve3Nlc3Npb25faWR9XCIsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IG9yZ19pZDogb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCwgc2Vzc2lvbl9pZDogc2Vzc2lvbklkIH0sXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cbn1cbiJdfQ==