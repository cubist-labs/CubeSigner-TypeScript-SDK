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
        (0, assert_1.default)(this.requiresMfa());
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
        (0, assert_1.default)(this.requiresMfa());
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
     * Initiate approval of an existing MFA request using FIDO.
     * @param {string} mfaId The MFA request ID.
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
     */
    async fidoApproveStart(mfaId) {
        const client = await this.sessionMgr.client();
        const resp = await client.post("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
            params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), mfa_id: mfaId } },
            parseAs: "json",
        });
        const challenge = (0, util_1.assertOk)(resp);
        return new _1.MfaFidoChallenge(this, mfaId, challenge);
    }
    /**
     * Complete a previously initiated MFA request approval using FIDO.
     * @param {string} mfaId The MFA request ID
     * @param {string} challengeId The challenge ID
     * @param {PublicKeyCredential} credential The answer to the challenge
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
     */
    async fidoApproveComplete(mfaId, challengeId, credential) {
        const client = await this.sessionMgr.client();
        const resp = await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
            params: { path: { org_id: __classPrivateFieldGet(this, _SignerSession_orgId, "f"), mfa_id: mfaId } },
            body: {
                challenge_id: challengeId,
                credential,
            },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLHdCQVNXO0FBRVgsaUNBQTJDO0FBRTNDLDZFQUkwQztBQTBFMUM7O0dBRUc7QUFDSCxNQUFhLFlBQVk7SUFTdkIsK0RBQStEO0lBQy9ELEtBQUs7UUFDSCxPQUFPLHVCQUFBLElBQUksaUNBQWMsQ0FBQyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELHNFQUFzRTtJQUN0RSxXQUFXO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLGlDQUFhLEtBQUssU0FBUyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxjQUFjO1FBQ1osT0FBUSx1QkFBQSxJQUFJLDBCQUEyQixDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsT0FBTyxJQUFJLFNBQVMsQ0FBQztJQUN0RixDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLElBQUk7UUFDRixPQUFPLHVCQUFBLElBQUksMEJBQVcsQ0FBQztJQUN6QixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFzQixFQUFFLElBQVk7UUFDcEQsSUFBQSxnQkFBTSxFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMzQixNQUFNLFFBQVEsR0FBRyx1QkFBQSxJQUFJLGlDQUFjLENBQUMsTUFBTSxDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLE1BQU0sT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0QsSUFBQSxnQkFBTSxFQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssS0FBSyxDQUFDLENBQUM7UUFDakMsTUFBTSxPQUFPLEdBQUcsV0FB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YUFDaEU7WUFDRCxPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUNqQixDQUFDO0NBQ0Y7QUF2WEQsc0NBdVhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQge1xuICBDdWJlU2lnbmVyLFxuICBLZXksXG4gIHRvS2V5SW5mbyxcbiAgT3JnLFxuICBLZXlJbmZvLFxuICBNZmFSZWNlaXB0LFxuICBJZGVudGl0eVByb29mLFxuICBNZmFGaWRvQ2hhbGxlbmdlLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cywgcGF0aHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IEpzb25NYXAsIGFzc2VydE9rIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHsgUHVibGljS2V5Q3JlZGVudGlhbCB9IGZyb20gXCIuL2ZpZG9cIjtcbmltcG9ydCB7XG4gIE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG4gIFNpZ25lclNlc3Npb25TdG9yYWdlLFxufSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcblxuLyogZXNsaW50LWRpc2FibGUgKi9cbmV4cG9ydCB0eXBlIEV2bVNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDEvc2lnbi97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlN0YWtlUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS9ldGgyL3N0YWtlXCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBFdGgyVW5zdGFrZVJlcXVlc3QgPVxuICBwYXRoc1tcIi92MS9vcmcve29yZ19pZH0vZXRoMi91bnN0YWtlL3twdWJrZXl9XCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBCbG9iU2lnblJlcXVlc3QgPVxuICBwYXRoc1tcIi92MS9vcmcve29yZ19pZH0vYmxvYi9zaWduL3trZXlfaWR9XCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBCdGNTaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YwL29yZy97b3JnX2lkfS9idGMvc2lnbi97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgU29sYW5hU2lnblJlcXVlc3QgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH0vc29sYW5hL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEF2YVNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9L2F2YS9zaWduL3twdWJrZXl9XCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbmV4cG9ydCB0eXBlIEV2bVNpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJFdGgxU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBFdGgyU2lnblJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIkV0aDJTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTdGFrZVJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlN0YWtlUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJVbnN0YWtlUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiVW5zdGFrZVJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBCbG9iU2lnblJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIkJsb2JTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEJ0Y1NpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJCdGNTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIFNvbGFuYVNpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJTb2xhbmFTaWduUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIE1mYVJlcXVlc3RJbmZvID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIk1mYVJlcXVlc3RJbmZvXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBBdmFTaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiQXZhU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbmV4cG9ydCB0eXBlIEFjY2VwdGVkUmVzcG9uc2UgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIkFjY2VwdGVkUmVzcG9uc2VcIl07XG5leHBvcnQgdHlwZSBFcnJvclJlc3BvbnNlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJFcnJvclJlc3BvbnNlXCJdO1xuZXhwb3J0IHR5cGUgQnRjU2lnbmF0dXJlS2luZCA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiQnRjU2lnbmF0dXJlS2luZFwiXTtcbi8qIGVzbGludC1lbmFibGUgKi9cblxuLyoqIE1GQSByZXF1ZXN0IGtpbmQgKi9cbmV4cG9ydCB0eXBlIE1mYVR5cGUgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIk1mYVR5cGVcIl07XG5cbi8qKiBBdmEgUC0gb3IgWC1jaGFpbiB0cmFuc2FjdGlvbiAqL1xuZXhwb3J0IHR5cGUgQXZhVHggPSB7IFA6IEF2YVBDaGFpblR4IH0gfCB7IFg6IEF2YVhDaGFpblR4IH07XG5cbi8qKiBBdmEgUC1jaGFpbiB0cmFuc2FjdGlvbiAqL1xuZXhwb3J0IHR5cGUgQXZhUENoYWluVHggPVxuICB8IHsgQWRkUGVybWlzc2lvbmxlc3NWYWxpZGF0b3I6IEpzb25NYXAgfVxuICB8IHsgQWRkU3VibmV0VmFsaWRhdG9yOiBKc29uTWFwIH1cbiAgfCB7IEFkZFZhbGlkYXRvcjogSnNvbk1hcCB9XG4gIHwgeyBDcmVhdGVDaGFpbjogSnNvbk1hcCB9XG4gIHwgeyBDcmVhdGVTdWJuZXQ6IEpzb25NYXAgfVxuICB8IHsgRXhwb3J0OiBKc29uTWFwIH1cbiAgfCB7IEltcG9ydDogSnNvbk1hcCB9O1xuXG4vKiogQXZhIFgtY2hhaW4gdHJhbnNhY3Rpb24gKi9cbmV4cG9ydCB0eXBlIEF2YVhDaGFpblR4ID0geyBCYXNlOiBKc29uTWFwIH0gfCB7IEV4cG9ydDogSnNvbk1hcCB9IHwgeyBJbXBvcnQ6IEpzb25NYXAgfTtcblxudHlwZSBTaWduRm48VT4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiBQcm9taXNlPFUgfCBBY2NlcHRlZFJlc3BvbnNlPjtcblxuZXhwb3J0IGludGVyZmFjZSBNZmFSZXF1aXJlZCB7XG4gIC8qKiBPcmcgaWQgKi9cbiAgb3JnX2lkOiBzdHJpbmc7XG4gIC8qKiBNRkEgcmVxdWVzdCBpZCAqL1xuICBpZDogc3RyaW5nO1xuICAvKiogT3B0aW9uYWwgTUZBIHNlc3Npb24gKi9cbiAgc2Vzc2lvbj86IE5ld1Nlc3Npb25SZXNwb25zZSB8IG51bGw7XG59XG5cbi8qKlxuICogQSByZXNwb25zZSBvZiBhIEN1YmVTaWduZXIgcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25SZXNwb25zZTxVPiB7XG4gIHJlYWRvbmx5ICNzaWduRm46IFNpZ25GbjxVPjtcbiAgcmVhZG9ubHkgI3Jlc3A6IFUgfCBBY2NlcHRlZFJlc3BvbnNlO1xuICAvKipcbiAgICogT3B0aW9uYWwgTUZBIGlkLiBPbmx5IHNldCBpZiB0aGVyZSBpcyBhbiBNRkEgcmVxdWVzdCBhc3NvY2lhdGVkIHdpdGggdGhlXG4gICAqIHNpZ25pbmcgcmVxdWVzdFxuICAgKi9cbiAgcmVhZG9ubHkgI21mYVJlcXVpcmVkPzogTWZhUmVxdWlyZWQ7XG5cbiAgLyoqIEByZXR1cm4ge3N0cmluZ30gVGhlIE1GQSBpZCBhc3NvY2lhdGVkIHdpdGggdGhpcyByZXF1ZXN0ICovXG4gIG1mYUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI21mYVJlcXVpcmVkIS5pZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoaXMgcmVxdWVzdCByZXF1aXJlcyBhbiBNRkEgYXBwcm92YWwgKi9cbiAgcmVxdWlyZXNNZmEoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI21mYVJlcXVpcmVkICE9PSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBzZXNzaW9uIGluZm9ybWF0aW9uIHRvIHVzZSBmb3IgYW55IE1GQSBhcHByb3ZhbCByZXF1ZXN0cyAoaWYgYW55IHdhcyBpbmNsdWRlZCBpbiB0aGUgcmVzcG9uc2UpLlxuICAgKiBAcmV0dXJuIHtDbGllbnRTZXNzaW9uSW5mbyB8IHVuZGVmaW5lZH1cbiAgICovXG4gIG1mYVNlc3Npb25JbmZvKCk6IE5ld1Nlc3Npb25SZXNwb25zZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuICh0aGlzLiNyZXNwIGFzIEFjY2VwdGVkUmVzcG9uc2UpLmFjY2VwdGVkPy5NZmFSZXF1aXJlZD8uc2Vzc2lvbiA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQHJldHVybiB7VX0gVGhlIHNpZ25lZCBkYXRhICovXG4gIGRhdGEoKTogVSB7XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3AgYXMgVTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlcyB0aGUgTUZBIHJlcXVlc3QgdXNpbmcgYSBnaXZlbiBzZXNzaW9uIGFuZCBhIFRPVFAgY29kZS5cbiAgICpcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9ufSBzZXNzaW9uIFNpZ25lciBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSA2LWRpZ2l0IFRPVFAgY29kZVxuICAgKiBAcmV0dXJuIHtTaWduUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZVRvdHAoc2Vzc2lvbjogU2lnbmVyU2Vzc2lvbiwgY29kZTogc3RyaW5nKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8VT4+IHtcbiAgICBhc3NlcnQodGhpcy5yZXF1aXJlc01mYSgpKTtcbiAgICBjb25zdCBtZmFJZCA9IHRoaXMubWZhSWQoKTtcbiAgICBjb25zdCBtZmFPcmdJZCA9IHRoaXMuI21mYVJlcXVpcmVkIS5vcmdfaWQ7XG4gICAgY29uc3QgbWZhQXBwcm92YWwgPSBhd2FpdCBzZXNzaW9uLnRvdHBBcHByb3ZlKG1mYUlkLCBjb2RlKTtcbiAgICBhc3NlcnQobWZhQXBwcm92YWwuaWQgPT09IG1mYUlkKTtcbiAgICBjb25zdCBtZmFDb25mID0gbWZhQXBwcm92YWwucmVjZWlwdD8uY29uZmlybWF0aW9uO1xuXG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zaWduV2l0aE1mYUFwcHJvdmFsKHsgbWZhSWQsIG1mYU9yZ0lkLCBtZmFDb25mIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmVzIHRoZSBNRkEgcmVxdWVzdCB1c2luZyBhIGdpdmVuIGBDdWJlU2lnbmVyYCBpbnN0YW5jZSAoaS5lLiwgaXRzIG1hbmFnZW1lbnQgc2Vzc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgQ3ViZVNpZ25lciB3aG9zZSBzZXNzaW9uIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtTaWduUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZShjczogQ3ViZVNpZ25lcik6IFByb21pc2U8U2lnblJlc3BvbnNlPFU+PiB7XG4gICAgYXNzZXJ0KHRoaXMucmVxdWlyZXNNZmEoKSk7XG4gICAgY29uc3QgbWZhSWQgPSB0aGlzLiNtZmFSZXF1aXJlZCEuaWQ7XG4gICAgY29uc3QgbWZhT3JnSWQgPSB0aGlzLiNtZmFSZXF1aXJlZCEub3JnX2lkO1xuXG4gICAgY29uc3QgbWZhQXBwcm92YWwgPSBhd2FpdCBPcmcubWZhQXBwcm92ZShjcywgbWZhT3JnSWQsIG1mYUlkKTtcbiAgICBhc3NlcnQobWZhQXBwcm92YWwuaWQgPT09IG1mYUlkKTtcbiAgICBjb25zdCBtZmFDb25mID0gbWZhQXBwcm92YWwucmVjZWlwdD8uY29uZmlybWF0aW9uO1xuXG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zaWduV2l0aE1mYUFwcHJvdmFsKHsgbWZhSWQsIG1mYU9yZ0lkLCBtZmFDb25mIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBUaGUgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduUmVzcG9uc2U8VT4+fSBUaGUgcmVzdWx0IG9mIHNpZ25pbmcgYWZ0ZXIgTUZBIGFwcHJvdmFsXG4gICAqL1xuICBhc3luYyBzaWduV2l0aE1mYUFwcHJvdmFsKG1mYVJlY2VpcHQ6IE1mYVJlY2VpcHQpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBTaWduUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZSh0aGlzLiNzaWduRm4sIGF3YWl0IHRoaXMuI3NpZ25GbihoZWFkZXJzKSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtTaWduRm59IHNpZ25GbiBUaGUgc2lnbmluZyBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGhcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7VSB8IEFjY2VwdGVkUmVzcG9uc2V9IHJlc3AgVGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGJ5IHRoZSBPcGVuQVBJXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50LlxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2lnbkZuOiBTaWduRm48VT4sIHJlc3A6IFUgfCBBY2NlcHRlZFJlc3BvbnNlKSB7XG4gICAgdGhpcy4jc2lnbkZuID0gc2lnbkZuO1xuICAgIHRoaXMuI3Jlc3AgPSByZXNwO1xuICAgIHRoaXMuI21mYVJlcXVpcmVkID0gKHRoaXMuI3Jlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXRpYyBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtTaWduRm59IHNpZ25GbiBUaGUgc2lnbmluZyBmdW5jdGlvbiB0aGF0IHRoaXMgcmVzcG9uc2UgaXMgZnJvbS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICBUaGlzIGFyZ3VtZW50IGlzIHVzZWQgdG8gcmVzZW5kIHJlcXVlc3RzIHdpdGhcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBkaWZmZXJlbnQgaGVhZGVycyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25SZXNwb25zZTxVPj59IE5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxVPihzaWduRm46IFNpZ25GbjxVPiwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IHNlZWQgPSBhd2FpdCBzaWduRm4odGhpcy5nZXRNZmFIZWFkZXJzKG1mYVJlY2VpcHQpKTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZShzaWduRm4sIHNlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgSFRUUCBoZWFkZXJzIGNvbnRhaW5pbmcgYSBnaXZlbiBNRkEgcmVjZWlwdC5cbiAgICpcbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge0hlYWRlcnNJbml0fSBIZWFkZXJzIGluY2x1ZGluZyB0aGF0IHJlY2VpcHRcbiAgICovXG4gIHN0YXRpYyBnZXRNZmFIZWFkZXJzKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0KTogSGVhZGVyc0luaXQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBtZmFSZWNlaXB0XG4gICAgICA/IHtcbiAgICAgICAgICBcIngtY3ViaXN0LW1mYS1pZFwiOiBtZmFSZWNlaXB0Lm1mYUlkLFxuICAgICAgICAgIFwieC1jdWJpc3QtbWZhLW9yZy1pZFwiOiBtZmFSZWNlaXB0Lm1mYU9yZ0lkLFxuICAgICAgICAgIFwieC1jdWJpc3QtbWZhLWNvbmZpcm1hdGlvblwiOiBtZmFSZWNlaXB0Lm1mYUNvbmYsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKiBTaWduZXIgc2Vzc2lvbiBpbmZvLiBDYW4gb25seSBiZSB1c2VkIHRvIHJldm9rZSBhIHRva2VuLCBidXQgbm90IGZvciBhdXRoZW50aWNhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXJTZXNzaW9uSW5mbyB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNyb2xlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgI3Nlc3Npb25JZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgcHVycG9zZTogc3RyaW5nO1xuXG4gIC8qKiBSZXZva2UgdGhpcyB0b2tlbiAqL1xuICBhc3luYyByZXZva2UoKSB7XG4gICAgYXdhaXQgU2lnbmVyU2Vzc2lvbi5yZXZva2UodGhpcy4jY3MsIHRoaXMuI29yZ0lkLCB0aGlzLiNyb2xlSWQsIHRoaXMuI3Nlc3Npb25JZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSB3aGVuIGNhbGxpbmcgYHJldm9rZWBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIE9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggVGhlIGhhc2ggb2YgdGhlIHRva2VuOyBjYW4gYmUgdXNlZCBmb3IgcmV2b2NhdGlvbiBidXQgbm90IGZvciBhdXRoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFNlc3Npb24gcHVycG9zZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCByb2xlSWQ6IHN0cmluZywgaGFzaDogc3RyaW5nLCBwdXJwb3NlOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNjcyA9IGNzO1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jcm9sZUlkID0gcm9sZUlkO1xuICAgIHRoaXMuI3Nlc3Npb25JZCA9IGhhc2g7XG4gICAgdGhpcy5wdXJwb3NlID0gcHVycG9zZTtcbiAgfVxufVxuXG4vKiogU2lnbmVyIHNlc3Npb24uICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbiB7XG4gIHNlc3Npb25NZ3I6IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuICByZWFkb25seSAjb3JnSWQ6IHN0cmluZztcblxuICAvKiogT3JnIGlkICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGlzdCBvZiBrZXlzIHRoYXQgdGhpcyB0b2tlbiBncmFudHMgYWNjZXNzIHRvLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIGxpc3Qgb2Yga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXMoKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3Rva2VuL2tleXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEua2V5cy5tYXAoKGspID0+IHRvS2V5SW5mbyhrKSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCB0byBhcHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBBcHByb3ZlKG1mYUlkOiBzdHJpbmcsIGNvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgKS5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L3RvdHBcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgICBib2R5OiB7IGNvZGUgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhcHByb3ZhbCBvZiBhbiBleGlzdGluZyBNRkEgcmVxdWVzdCB1c2luZyBGSURPLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElELlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+fSBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIGZpZG9BcHByb3ZlU3RhcnQobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhRmlkb0NoYWxsZW5nZT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9maWRvXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIG1mYV9pZDogbWZhSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgY2hhbGxlbmdlID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIG5ldyBNZmFGaWRvQ2hhbGxlbmdlKHRoaXMsIG1mYUlkLCBjaGFsbGVuZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgTUZBIHJlcXVlc3QgYXBwcm92YWwgdXNpbmcgRklETy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2hhbGxlbmdlSWQgVGhlIGNoYWxsZW5nZSBJRFxuICAgKiBAcGFyYW0ge1B1YmxpY0tleUNyZWRlbnRpYWx9IGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgZmlkb0FwcHJvdmVDb21wbGV0ZShcbiAgICBtZmFJZDogc3RyaW5nLFxuICAgIGNoYWxsZW5nZUlkOiBzdHJpbmcsXG4gICAgY3JlZGVudGlhbDogUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZmlkb1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgY2hhbGxlbmdlX2lkOiBjaGFsbGVuZ2VJZCxcbiAgICAgICAgY3JlZGVudGlhbCxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCBieSBpdHMgaWQuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgTWFuYWdlbWVudCBzZXNzaW9uIHRvIHVzZSAodGhpcyBhcmd1bWVudCB3aWxsIGJlIHJlbW92ZWQgaW4gZnV0dXJlIHZlcnNpb25zKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIGdldE1mYUluZm8oY3M6IEN1YmVTaWduZXIsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1Ym1pdCBhbiBFVk0gc2lnbiByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdm1TaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV2bVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIHNpZ25Fdm0oXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdm1TaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBTaWduUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1Ym1pdCBhbiAnZXRoMicgc2lnbiByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgyU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXRoMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc3Rha2UgcmVxdWVzdC5cbiAgICogQHBhcmFtIHtFdGgyU3Rha2VSZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXRoMlN0YWtlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc3Rha2UoXG4gICAgcmVxOiBFdGgyU3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxFdGgyU3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc3Rha2VcIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25SZXNwb25zZS5jcmVhdGUoc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiB1bnN0YWtlIHJlcXVlc3QuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0V0aDJVbnN0YWtlUmVxdWVzdH0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJVbnN0YWtlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdW5zdGFrZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3Vuc3Rha2Uve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgcmF3IGJsb2IuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgSUQpLlxuICAgKiBAcGFyYW0ge0Jsb2JTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCbG9iU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQmxvYlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxCbG9iU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGtleV9pZCA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkuaWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ibG9iL3NpZ24ve2tleV9pZH1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIGtleV9pZCB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgYml0Y29pbiBtZXNzYWdlLlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCdGNTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCdGNTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxCdGNTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc29sYW5hIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge1NvbGFuYVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNvbGFuYVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU29sYW5hKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogU29sYW5hU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8U2lnblJlc3BvbnNlPFNvbGFuYVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9zb2xhbmEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBTaWduUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gQXZhbGFuY2hlIFAtIG9yIFgtY2hhaW4gbWVzc2FnZS5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7QXZhVHh9IHR4IEF2YWxhbmNoZSBtZXNzYWdlICh0cmFuc2FjdGlvbikgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxBdmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICB0eDogQXZhVHgsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8U2lnblJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlcSA9IDxBdmFTaWduUmVxdWVzdD57XG4gICAgICAgIHR4OiB0eCBhcyB1bmtub3duLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBTaWduUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgcHJvdmVJZGVudGl0eSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBzaWduZXIgc2Vzc2lvbiBmcm9tIHN0b3JhZ2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb24+IHtcbiAgICBjb25zdCBtYW5hZ2VyID0gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICAgIHJldHVybiBuZXcgU2lnbmVyU2Vzc2lvbihtYW5hZ2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTWFuYWdlcn0gc2Vzc2lvbk1nciBUaGUgc2Vzc2lvbiBtYW5hZ2VyIHRvIHVzZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25NZ3I6IFNpZ25lclNlc3Npb25NYW5hZ2VyKSB7XG4gICAgdGhpcy5zZXNzaW9uTWdyID0gc2Vzc2lvbk1ncjtcbiAgICB0aGlzLiNvcmdJZCA9IHNlc3Npb25NZ3Iub3JnSWQ7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIHJlcXVpcmUtanNkb2MgKi9cblxuICAvKipcbiAgICogU3RhdGljIG1ldGhvZCBmb3IgcmV2b2tpbmcgYSB0b2tlbiAodXNlZCBib3RoIGZyb20ge1NpZ25lclNlc3Npb259IGFuZCB7U2lnbmVyU2Vzc2lvbkluZm99KS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBDdWJlU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZXNzaW9uSWQgU2lnbmVyIHNlc3Npb24gSURcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcmV2b2tlKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCByb2xlSWQ6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS90b2tlbnMve3Nlc3Npb25faWR9XCIsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IG9yZ19pZDogb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCwgc2Vzc2lvbl9pZDogc2Vzc2lvbklkIH0sXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cbn1cbiJdfQ==