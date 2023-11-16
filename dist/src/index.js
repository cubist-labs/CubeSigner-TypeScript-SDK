"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
var _TotpChallenge_cs, _TotpChallenge_totpInfo, _CubeSigner_env, _CubeSigner_orgId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethers = exports.CubeSigner = exports.TotpChallenge = void 0;
const env_1 = require("./env");
const org_1 = require("./org");
const session_storage_1 = require("./session/session_storage");
const signer_session_manager_1 = require("./session/signer_session_manager");
const signer_session_1 = require("./signer_session");
const cognito_manager_1 = require("./session/cognito_manager");
const util_1 = require("./util");
const path = __importStar(require("path"));
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
const fido_1 = require("./fido");
/** TOTP challenge that must be answered before user's TOTP is updated */
class TotpChallenge {
    /** The id of the challenge */
    get totpId() {
        return __classPrivateFieldGet(this, _TotpChallenge_totpInfo, "f").totp_id;
    }
    /** The new TOTP configuration */
    get totpUrl() {
        return __classPrivateFieldGet(this, _TotpChallenge_totpInfo, "f").totp_url;
    }
    /**
     * @param {CubeSigner} cs Used when answering the challenge.
     * @param {TotpInfo} totpInfo TOTP challenge information.
     */
    constructor(cs, totpInfo) {
        _TotpChallenge_cs.set(this, void 0);
        _TotpChallenge_totpInfo.set(this, void 0);
        __classPrivateFieldSet(this, _TotpChallenge_cs, cs, "f");
        __classPrivateFieldSet(this, _TotpChallenge_totpInfo, totpInfo, "f");
    }
    /**
     * Answer the challenge with the code that corresponds to this `this.totpUrl`.
     * @param {string} code 6-digit code that corresponds to this `this.totpUrl`.
     */
    async answer(code) {
        await __classPrivateFieldGet(this, _TotpChallenge_cs, "f").resetTotpComplete(this.totpId, code);
    }
}
exports.TotpChallenge = TotpChallenge;
_TotpChallenge_cs = new WeakMap(), _TotpChallenge_totpInfo = new WeakMap();
/** CubeSigner client */
class CubeSigner {
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env() {
        return __classPrivateFieldGet(this, _CubeSigner_env, "f");
    }
    /**
     * Set the organization ID
     * @param {string} orgId The new organization id.
     */
    setOrgId(orgId) {
        __classPrivateFieldSet(this, _CubeSigner_orgId, orgId, "f");
    }
    /**
     * Loads an existing management session and creates a CubeSigner instance.
     *
     * @param {CognitoSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the management session from the config
     * directory will be loaded.
     * @return {Promise<CubeSigner>} New CubeSigner instance
     */
    static async loadManagementSession(storage) {
        const defaultFilePath = path.join((0, util_1.configDir)(), "management-session.json");
        const sessionMgr = await cognito_manager_1.CognitoSessionManager.loadFromStorage(storage ?? new session_storage_1.JsonFileSessionStorage(defaultFilePath));
        return new CubeSigner({
            sessionMgr,
        });
    }
    /**
     * Loads a signer session from a session storage (e.g., session file).
     * @param {SignerSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the signer session from the config
     * directory will be loaded.
     * @return {Promise<SignerSession>} New signer session
     */
    static async loadSignerSession(storage) {
        const defaultFilePath = path.join((0, util_1.configDir)(), "signer-session.json");
        const sss = storage ?? new session_storage_1.JsonFileSessionStorage(defaultFilePath);
        return await signer_session_1.SignerSession.loadSignerSession(sss);
    }
    /**
     * Create a new CubeSigner instance.
     * @param {CubeSignerOptions} options The optional configuraiton options for the CubeSigner instance.
     */
    constructor(options) {
        _CubeSigner_env.set(this, void 0);
        _CubeSigner_orgId.set(this, void 0);
        let env = options?.env;
        if (options?.sessionMgr) {
            this.sessionMgr = options.sessionMgr;
            env = env ?? this.sessionMgr.env;
        }
        __classPrivateFieldSet(this, _CubeSigner_env, env ?? env_1.envs["gamma"], "f");
        __classPrivateFieldSet(this, _CubeSigner_orgId, options?.orgId, "f");
    }
    /**
     * Authenticate an OIDC user and create a new session manager for them.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {SignerSessionStorage?} storage Optional signer session storage (defaults to in-memory storage)
     * @return {Promise<SignerSessionManager>} The signer session manager
     */
    async oidcAuth(oidcToken, orgId, scopes, lifetimes, storage) {
        const resp = await this.oidcLogin(oidcToken, orgId, scopes, lifetimes);
        return await signer_session_manager_1.SignerSessionManager.createFromSessionInfo(this.env, orgId, resp.data(), storage);
    }
    /**
     * Retrieves information about the current user.
     *
     * @return {Promise<UserInfo>} User information.
     */
    async aboutMe() {
        const client = await this.management();
        const resp = __classPrivateFieldGet(this, _CubeSigner_orgId, "f")
            ? await client.get("/v0/org/{org_id}/user/me", {
                params: { path: { org_id: __classPrivateFieldGet(this, _CubeSigner_orgId, "f") } },
                parseAs: "json",
            })
            : await client.get("/v0/about_me", {
                parseAs: "json",
            });
        const data = (0, util_1.assertOk)(resp);
        return data;
    }
    /**
     * Retrieves existing MFA request.
     *
     * @param {string} orgId Organization ID
     * @param {string} mfaId MFA request ID
     * @return {Promise<MfaRequestInfo>} MFA request information
     */
    async mfaGet(orgId, mfaId) {
        const resp = await (await this.management()).get("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: orgId, mfa_id: mfaId } },
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * List pending MFA requests accessible to the current user.
     * @param {string} orgId Organization ID
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    async mfaList(orgId) {
        const resp = await (await this.management()).get("/v0/org/{org_id}/mfa", {
            params: { path: { org_id: orgId } },
        });
        return (0, util_1.assertOk)(resp).mfa_requests;
    }
    /**
     * Approve a pending MFA request.
     *
     * @param {string} orgId The org id of the MFA request
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    async mfaApprove(orgId, mfaId) {
        const resp = await (await this.management()).patch("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: orgId, mfa_id: mfaId } },
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Initiate adding a new FIDO device. MFA may be required.
     * @param {string} name The name of the new device.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
     * @return {Promise<SignResponse<AddFidoChallenge>>} A challenge that must be answered in order to complete FIDO registration.
     */
    async addFidoStart(name, mfaReceipt) {
        const orgId = __classPrivateFieldGet(this, _CubeSigner_orgId, "f") || mfaReceipt?.mfaOrgId;
        if (!orgId) {
            throw new Error("Org ID must be set");
        }
        const addFidoFn = async (headers) => {
            const client = await this.management();
            const resp = await client.post("/v0/org/{org_id}/user/me/fido", {
                headers,
                params: { path: { org_id: orgId } },
                body: { name },
                parseAs: "json",
            });
            const x = (0, util_1.assertOk)(resp);
            // TODO: add mapFn to SignResponse
            if (x.accepted?.MfaRequired) {
                return x;
            }
            else {
                return new fido_1.AddFidoChallenge(this, x);
            }
        };
        return await signer_session_1.SignResponse.create(addFidoFn, mfaReceipt);
    }
    /**
     * Complete a previously initiated request to add a new FIDO device.
     * @param {string} challengeId The ID of the challenge returned by the remote end.
     * @param {PublicKeyCredential} credential The answer to the challenge.
     */
    async addFidoComplete(challengeId, credential) {
        const orgId = __classPrivateFieldGet(this, _CubeSigner_orgId, "f");
        if (!orgId) {
            throw new Error("Org ID must be set");
        }
        const client = await this.management();
        const resp = await client.patch("/v0/org/{org_id}/user/me/fido", {
            params: { path: { org_id: orgId } },
            body: {
                challenge_id: challengeId,
                credential,
            },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Creates a request to change user's TOTP. This request returns a new TOTP challenge
     * that must be answered by calling `resetTotpComplete`
     *
     * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
     */
    async resetTotpStart(mfaReceipt) {
        const resetTotpFn = async (headers) => {
            const orgId = __classPrivateFieldGet(this, _CubeSigner_orgId, "f") || mfaReceipt?.mfaOrgId;
            const client = await this.management();
            const resp = orgId
                ? await client.post("/v0/org/{org_id}/user/me/totp", {
                    headers,
                    params: { path: { org_id: orgId } },
                    body: null,
                    parseAs: "json",
                })
                : await client.post("/v0/user/me/totp", {
                    headers,
                    body: null,
                    parseAs: "json",
                });
            const x = (0, util_1.assertOk)(resp);
            // TODO: add mapFn to SignResponse
            if (x.accepted?.MfaRequired) {
                return x;
            }
            else {
                return new TotpChallenge(this, x);
            }
        };
        return await signer_session_1.SignResponse.create(resetTotpFn, mfaReceipt);
    }
    /**
     * Answer the TOTP challenge issued by `resetTotpStart`. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.
     *
     * @param {string} totpId - The ID of the TOTP challenge
     * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
     */
    async resetTotpComplete(totpId, code) {
        const client = await this.management();
        const resp = __classPrivateFieldGet(this, _CubeSigner_orgId, "f")
            ? await client.patch("/v0/org/{org_id}/user/me/totp", {
                parseAs: "json",
                params: { path: { org_id: __classPrivateFieldGet(this, _CubeSigner_orgId, "f") } },
                body: { totp_id: totpId, code },
            })
            : await client.patch("/v0/user/me/totp", {
                parseAs: "json",
                body: { totp_id: totpId, code },
            });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     * @param {string} code Current TOTP code
     */
    async verifyTotp(code) {
        const client = await this.management();
        const resp = __classPrivateFieldGet(this, _CubeSigner_orgId, "f")
            ? await client.post("/v0/org/{org_id}/user/me/totp/verify", {
                params: { path: { org_id: __classPrivateFieldGet(this, _CubeSigner_orgId, "f") } },
                body: { code },
                parseAs: "json",
            })
            : await client.post("/v0/user/me/totp/verify", {
                body: { code },
                parseAs: "json",
            });
        (0, util_1.assertOk)(resp);
    }
    /** Retrieves information about an organization.
     * @param {string} orgId The ID or name of the organization.
     * @return {Org} The organization.
     * */
    async getOrg(orgId) {
        const resp = await (await this.management()).get("/v0/org/{org_id}", {
            params: { path: { org_id: orgId } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return new org_1.Org(this, data);
    }
    /**
     * Deletes a given key.
     * @param {string} orgId - Organization id
     * @param {string} keyId - Key id
     */
    async deleteKey(orgId, keyId) {
        const resp = await (await this.management()).del("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: orgId, key_id: keyId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /** Get the management client.
     * @return {Client} The client.
     * @internal
     * */
    async management() {
        if (!this.sessionMgr) {
            throw new Error("No management session loaded");
        }
        return await this.sessionMgr.client();
    }
    /**
     * Obtain a proof of authentication.
     *
     * @param {string} orgId The id of the organization that the user is in
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async proveIdentity(orgId) {
        const client = await this.management();
        const resp = await client.post("/v0/org/{org_id}/identity/prove", {
            params: { path: { org_id: orgId } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async oidcProveIdentity(oidcToken, orgId) {
        const client = (0, openapi_fetch_1.default)({
            baseUrl: this.env.SignerApiRoot,
            headers: {
                Authorization: oidcToken,
            },
        });
        const resp = await client.post("/v0/org/{org_id}/identity/prove/oidc", {
            params: { path: { org_id: orgId } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Checks if a given identity proof is valid.
     *
     * @param {string} orgId The id of the organization that the user is in.
     * @param {IdentityProof} identityProof The proof of authentication.
     */
    async verifyIdentity(orgId, identityProof) {
        const resp = await (await this.management()).post("/v0/org/{org_id}/identity/verify", {
            params: { path: { org_id: orgId } },
            body: identityProof,
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<SignResponse<OidcAuthResponse>>} The session data.
     */
    async oidcLogin(oidcToken, orgId, scopes, lifetimes, mfaReceipt) {
        const client = (0, openapi_fetch_1.default)({
            baseUrl: this.env.SignerApiRoot,
            headers: {
                Authorization: oidcToken,
            },
        });
        const loginFn = async (headers) => {
            const resp = await client.post("/v0/org/{org_id}/oidc", {
                params: { path: { org_id: orgId } },
                headers,
                body: {
                    scopes,
                    tokens: lifetimes,
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        const h1 = mfaReceipt ? signer_session_1.SignResponse.getMfaHeaders(mfaReceipt) : undefined;
        return new signer_session_1.SignResponse(loginFn, await loginFn(h1));
    }
}
exports.CubeSigner = CubeSigner;
_CubeSigner_env = new WeakMap(), _CubeSigner_orgId = new WeakMap();
/** Organizations */
__exportStar(require("./org"), exports);
/** Keys */
__exportStar(require("./key"), exports);
/** Roles */
__exportStar(require("./role"), exports);
/** Env */
__exportStar(require("./env"), exports);
/** Fido */
__exportStar(require("./fido"), exports);
/** Pagination */
__exportStar(require("./paginator"), exports);
/** Sessions */
__exportStar(require("./signer_session"), exports);
/** Session storage */
__exportStar(require("./session/session_storage"), exports);
/** Session manager */
__exportStar(require("./session/session_manager"), exports);
/** Management session manager */
__exportStar(require("./session/cognito_manager"), exports);
/** Signer session manager */
__exportStar(require("./session/signer_session_manager"), exports);
/** Export ethers.js Signer */
exports.ethers = __importStar(require("./ethers"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFFM0MsK0JBQTRCO0FBQzVCLCtEQUFtRTtBQUVuRSw2RUFBOEY7QUFDOUYscURBQWlHO0FBQ2pHLCtEQUF5RjtBQUN6RixpQ0FBNkM7QUFDN0MsMkNBQTZCO0FBQzdCLGtFQUF5QztBQUN6QyxpQ0FBb0Y7QUFxQnBGLHlFQUF5RTtBQUN6RSxNQUFhLGFBQWE7SUFHeEIsOEJBQThCO0lBQzlCLElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSwrQkFBVSxDQUFDLE9BQU8sQ0FBQztJQUNoQyxDQUFDO0lBQ0QsaUNBQWlDO0lBQ2pDLElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwrQkFBVSxDQUFDLFFBQVEsQ0FBQztJQUNqQyxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsWUFBWSxFQUFjLEVBQUUsUUFBa0I7UUFkckMsb0NBQWdCO1FBQ2hCLDBDQUFvQjtRQWMzQix1QkFBQSxJQUFJLHFCQUFPLEVBQUUsTUFBQSxDQUFDO1FBQ2QsdUJBQUEsSUFBSSwyQkFBYSxRQUFRLE1BQUEsQ0FBQztJQUM1QixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFZO1FBQ3ZCLE1BQU0sdUJBQUEsSUFBSSx5QkFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEQsQ0FBQztDQUNGO0FBMUJELHNDQTBCQzs7QUFFRCx3QkFBd0I7QUFDeEIsTUFBYSxVQUFVO0lBS3JCLHVFQUF1RTtJQUN2RSxJQUFJLEdBQUc7UUFDTCxPQUFPLHVCQUFBLElBQUksdUJBQUssQ0FBQztJQUNuQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsUUFBUSxDQUFDLEtB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RSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsNkJBQVksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUMzRSxPQUFPLElBQUksNkJBQVksQ0FBQyxPQUFPLEVBQUUsTUFBTSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0NBQ0Y7QUEzWkQsZ0NBMlpDOztBQVlELG9CQUFvQjtBQUNwQix3Q0FBc0I7QUFDdEIsV0FBVztBQUNYLHdDQUFzQjtBQUN0QixZQUFZO0FBQ1oseUNBQXVCO0FBQ3ZCLFVBQVU7QUFDVix3Q0FBc0I7QUFDdEIsV0FBVztBQUNYLHlDQUF1QjtBQUN2QixpQkFBaUI7QUFDakIsOENBQTRCO0FBQzVCLGVBQWU7QUFDZixtREFBaUM7QUFDakMsc0JBQXNCO0FBQ3RCLDREQUEwQztBQUMxQyxzQkFBc0I7QUFDdEIsNERBQTBDO0FBQzFDLGlDQUFpQztBQUNqQyw0REFBMEM7QUFDMUMsNkJBQTZCO0FBQzdCLG1FQUFpRDtBQUNqRCw4QkFBOEI7QUFDOUIsbURBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZW52cywgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4vZW52XCI7XG5pbXBvcnQgeyBjb21wb25lbnRzLCBDbGllbnQsIHBhdGhzIH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmdcIjtcbmltcG9ydCB7IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuXG5pbXBvcnQgeyBTaWduZXJTZXNzaW9uU3RvcmFnZSwgU2lnbmVyU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IEFjY2VwdGVkUmVzcG9uc2UsIE1mYVJlcXVlc3RJbmZvLCBTaWduUmVzcG9uc2UsIFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuaW1wb3J0IHsgQ29nbml0b1Nlc3Npb25NYW5hZ2VyLCBDb2duaXRvU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL2NvZ25pdG9fbWFuYWdlclwiO1xuaW1wb3J0IHsgYXNzZXJ0T2ssIGNvbmZpZ0RpciB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBjcmVhdGVDbGllbnQgZnJvbSBcIm9wZW5hcGktZmV0Y2hcIjtcbmltcG9ydCB7IEFkZEZpZG9DaGFsbGVuZ2UsIEFwaUFkZEZpZG9DaGFsbGVuZ2UsIFB1YmxpY0tleUNyZWRlbnRpYWwgfSBmcm9tIFwiLi9maWRvXCI7XG5cbi8qKiBDdWJlU2lnbmVyIGNvbnN0cnVjdG9yIG9wdGlvbnMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3ViZVNpZ25lck9wdGlvbnMge1xuICAvKiogVGhlIGVudmlyb25tZW50IHRvIHVzZSAqL1xuICBlbnY/OiBFbnZJbnRlcmZhY2U7XG4gIC8qKiBUaGUgbWFuYWdlbWVudCBhdXRob3JpemF0aW9uIHRva2VuICovXG4gIHNlc3Npb25NZ3I/OiBDb2duaXRvU2Vzc2lvbk1hbmFnZXIgfCBTaWduZXJTZXNzaW9uTWFuYWdlcjtcbiAgLyoqIE9wdGlvbmFsIG9yZ2FuaXphdGlvbiBpZCAqL1xuICBvcmdJZD86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgVXNlckluZm8gPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlVzZXJJbmZvXCJdO1xuZXhwb3J0IHR5cGUgVG90cEluZm8gPSBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiVG90cEluZm9cIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIENvbmZpZ3VyZWRNZmEgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIkNvbmZpZ3VyZWRNZmFcIl07XG5leHBvcnQgdHlwZSBSYXRjaGV0Q29uZmlnID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJSYXRjaGV0Q29uZmlnXCJdO1xuZXhwb3J0IHR5cGUgSWRlbnRpdHlQcm9vZiA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiSWRlbnRpdHlQcm9vZlwiXTtcblxudHlwZSBPaWRjQXV0aFJlc3BvbnNlID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9L29pZGNcIl1bXCJwb3N0XCJdW1wicmVzcG9uc2VzXCJdW1wiMjAwXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbi8qKiBUT1RQIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYmVmb3JlIHVzZXIncyBUT1RQIGlzIHVwZGF0ZWQgKi9cbmV4cG9ydCBjbGFzcyBUb3RwQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2NzOiBDdWJlU2lnbmVyO1xuICByZWFkb25seSAjdG90cEluZm86IFRvdHBJbmZvO1xuICAvKiogVGhlIGlkIG9mIHRoZSBjaGFsbGVuZ2UgKi9cbiAgZ2V0IHRvdHBJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdG90cEluZm8udG90cF9pZDtcbiAgfVxuICAvKiogVGhlIG5ldyBUT1RQIGNvbmZpZ3VyYXRpb24gKi9cbiAgZ2V0IHRvdHBVcmwoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3RvdHBJbmZvLnRvdHBfdXJsO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFVzZWQgd2hlbiBhbnN3ZXJpbmcgdGhlIGNoYWxsZW5nZS5cbiAgICogQHBhcmFtIHtUb3RwSW5mb30gdG90cEluZm8gVE9UUCBjaGFsbGVuZ2UgaW5mb3JtYXRpb24uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgdG90cEluZm86IFRvdHBJbmZvKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLiN0b3RwSW5mbyA9IHRvdHBJbmZvO1xuICB9XG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIGNoYWxsZW5nZSB3aXRoIHRoZSBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhpcyBgdGhpcy50b3RwVXJsYC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhpcyBgdGhpcy50b3RwVXJsYC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjb2RlOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNjcy5yZXNldFRvdHBDb21wbGV0ZSh0aGlzLnRvdHBJZCwgY29kZSk7XG4gIH1cbn1cblxuLyoqIEN1YmVTaWduZXIgY2xpZW50ICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lciB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgc2Vzc2lvbk1ncj86IENvZ25pdG9TZXNzaW9uTWFuYWdlciB8IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuICAjb3JnSWQ/OiBzdHJpbmc7XG5cbiAgLyoqIEByZXR1cm4ge0VudkludGVyZmFjZX0gVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnQgb2YgdGhpcyBjbGllbnQgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLiNlbnY7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBuZXcgb3JnYW5pemF0aW9uIGlkLlxuICAgKi9cbiAgc2V0T3JnSWQob3JnSWQ6IHN0cmluZykge1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3RpbmcgbWFuYWdlbWVudCBzZXNzaW9uIGFuZCBjcmVhdGVzIGEgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtDb2duaXRvU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWRcbiAgICogdGhlIHNlc3Npb24gZnJvbS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIG1hbmFnZW1lbnQgc2Vzc2lvbiBmcm9tIHRoZSBjb25maWdcbiAgICogZGlyZWN0b3J5IHdpbGwgYmUgbG9hZGVkLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXI+fSBOZXcgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRNYW5hZ2VtZW50U2Vzc2lvbihzdG9yYWdlPzogQ29nbml0b1Nlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxDdWJlU2lnbmVyPiB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcIm1hbmFnZW1lbnQtc2Vzc2lvbi5qc29uXCIpO1xuICAgIGNvbnN0IHNlc3Npb25NZ3IgPSBhd2FpdCBDb2duaXRvU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKFxuICAgICAgc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyKDxDdWJlU2lnbmVyT3B0aW9ucz57XG4gICAgICBzZXNzaW9uTWdyLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2lnbmVyIHNlc3Npb24gZnJvbSBhIHNlc3Npb24gc3RvcmFnZSAoZS5nLiwgc2Vzc2lvbiBmaWxlKS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBPcHRpb25hbCBzZXNzaW9uIHN0b3JhZ2UgdG8gbG9hZFxuICAgKiB0aGUgc2Vzc2lvbiBmcm9tLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgc2lnbmVyIHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uPiB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcInNpZ25lci1zZXNzaW9uLmpzb25cIik7XG4gICAgY29uc3Qgc3NzID0gc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uLmxvYWRTaWduZXJTZXNzaW9uKHNzcyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbmFsIGNvbmZpZ3VyYWl0b24gb3B0aW9ucyBmb3IgdGhlIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogQ3ViZVNpZ25lck9wdGlvbnMpIHtcbiAgICBsZXQgZW52ID0gb3B0aW9ucz8uZW52O1xuICAgIGlmIChvcHRpb25zPy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aGlzLnNlc3Npb25NZ3IgPSBvcHRpb25zLnNlc3Npb25NZ3I7XG4gICAgICBlbnYgPSBlbnYgPz8gdGhpcy5zZXNzaW9uTWdyLmVudjtcbiAgICB9XG4gICAgdGhpcy4jZW52ID0gZW52ID8/IGVudnNbXCJnYW1tYVwiXTtcbiAgICB0aGlzLiNvcmdJZCA9IG9wdGlvbnM/Lm9yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEF1dGhlbnRpY2F0ZSBhbiBPSURDIHVzZXIgYW5kIGNyZWF0ZSBhIG5ldyBzZXNzaW9uIG1hbmFnZXIgZm9yIHRoZW0uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1JhdGNoZXRDb25maWd9IGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlP30gc3RvcmFnZSBPcHRpb25hbCBzaWduZXIgc2Vzc2lvbiBzdG9yYWdlIChkZWZhdWx0cyB0byBpbi1tZW1vcnkgc3RvcmFnZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IFRoZSBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBhc3luYyBvaWRjQXV0aChcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLm9pZGNMb2dpbihvaWRjVG9rZW4sIG9yZ0lkLCBzY29wZXMsIGxpZmV0aW1lcyk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmNyZWF0ZUZyb21TZXNzaW9uSW5mbyh0aGlzLmVudiwgb3JnSWQsIHJlc3AuZGF0YSgpLCBzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxVc2VySW5mbz59IFVzZXIgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBhYm91dE1lKCk6IFByb21pc2U8VXNlckluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKTtcbiAgICBjb25zdCByZXNwID0gdGhpcy4jb3JnSWRcbiAgICAgID8gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZVwiLCB7XG4gICAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICAgIH0pXG4gICAgICA6IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvYWJvdXRfbWVcIiwge1xuICAgICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGV4aXN0aW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChvcmdJZDogc3RyaW5nLCBtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm9bXT59IFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFMaXN0KG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0vbWZhXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKS5tZmFfcmVxdWVzdHM7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYUFwcHJvdmUob3JnSWQ6IHN0cmluZywgbWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFkZGluZyBhIG5ldyBGSURPIGRldmljZS4gTUZBIG1heSBiZSByZXF1aXJlZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIG5ldyBkZXZpY2UuXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25SZXNwb25zZTxBZGRGaWRvQ2hhbGxlbmdlPj59IEEgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBpbiBvcmRlciB0byBjb21wbGV0ZSBGSURPIHJlZ2lzdHJhdGlvbi5cbiAgICovXG4gIGFzeW5jIGFkZEZpZG9TdGFydChcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8U2lnblJlc3BvbnNlPEFkZEZpZG9DaGFsbGVuZ2U+PiB7XG4gICAgY29uc3Qgb3JnSWQgPSB0aGlzLiNvcmdJZCB8fCBtZmFSZWNlaXB0Py5tZmFPcmdJZDtcbiAgICBpZiAoIW9yZ0lkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgSUQgbXVzdCBiZSBzZXRcIik7XG4gICAgfVxuICAgIGNvbnN0IGFkZEZpZG9GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMubWFuYWdlbWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2ZpZG9cIiwge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogeyBuYW1lIH0sXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICBjb25zdCB4ID0gYXNzZXJ0T2socmVzcCk7XG4gICAgICAvLyBUT0RPOiBhZGQgbWFwRm4gdG8gU2lnblJlc3BvbnNlXG4gICAgICBpZiAoKHggYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkKSB7XG4gICAgICAgIHJldHVybiB4IGFzIEFjY2VwdGVkUmVzcG9uc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IEFkZEZpZG9DaGFsbGVuZ2UodGhpcywgeCBhcyBBcGlBZGRGaWRvQ2hhbGxlbmdlKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBTaWduUmVzcG9uc2UuY3JlYXRlKGFkZEZpZG9GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGNoYWxsZW5nZUlkIFRoZSBJRCBvZiB0aGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKiBAcGFyYW0ge1B1YmxpY0tleUNyZWRlbnRpYWx9IGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgYWRkRmlkb0NvbXBsZXRlKGNoYWxsZW5nZUlkOiBzdHJpbmcsIGNyZWRlbnRpYWw6IFB1YmxpY0tleUNyZWRlbnRpYWwpIHtcbiAgICBjb25zdCBvcmdJZCA9IHRoaXMuI29yZ0lkO1xuICAgIGlmICghb3JnSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9yZyBJRCBtdXN0IGJlIHNldFwiKTtcbiAgICB9XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5tYW5hZ2VtZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBjaGFsbGVuZ2VfaWQ6IGNoYWxsZW5nZUlkLFxuICAgICAgICBjcmVkZW50aWFsLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gVGhpcyByZXF1ZXN0IHJldHVybnMgYSBuZXcgVE9UUCBjaGFsbGVuZ2VcbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmcgYHJlc2V0VG90cENvbXBsZXRlYFxuICAgKlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgTUZBIHJlY2VpcHQgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICovXG4gIGFzeW5jIHJlc2V0VG90cFN0YXJ0KG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0KTogUHJvbWlzZTxTaWduUmVzcG9uc2U8VG90cENoYWxsZW5nZT4+IHtcbiAgICBjb25zdCByZXNldFRvdHBGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IG9yZ0lkID0gdGhpcy4jb3JnSWQgfHwgbWZhUmVjZWlwdD8ubWZhT3JnSWQ7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBvcmdJZFxuICAgICAgICA/IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwge1xuICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICAgICAgYm9keTogbnVsbCxcbiAgICAgICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgICAgIH0pXG4gICAgICAgIDogYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvdXNlci9tZS90b3RwXCIsIHtcbiAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICBib2R5OiBudWxsLFxuICAgICAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICAgICAgfSk7XG4gICAgICBjb25zdCB4ID0gYXNzZXJ0T2socmVzcCk7XG4gICAgICAvLyBUT0RPOiBhZGQgbWFwRm4gdG8gU2lnblJlc3BvbnNlXG4gICAgICBpZiAoKHggYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkKSB7XG4gICAgICAgIHJldHVybiB4IGFzIEFjY2VwdGVkUmVzcG9uc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcywgeCBhcyBUb3RwSW5mbyk7XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgU2lnblJlc3BvbnNlLmNyZWF0ZShyZXNldFRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkgYHJlc2V0VG90cFN0YXJ0YC4gSWYgc3VjY2Vzc2Z1bCwgdXNlcidzXG4gICAqIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3RwSWQgLSBUaGUgSUQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIC0gVGhlIFRPVFAgY29kZSB0aGF0IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgVE9UUCBjb25maWd1cmF0aW9uIGZyb20gdGhlIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIHJlc2V0VG90cENvbXBsZXRlKHRvdHBJZDogc3RyaW5nLCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKTtcbiAgICBjb25zdCByZXNwID0gdGhpcy4jb3JnSWRcbiAgICAgID8gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwge1xuICAgICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQgfSB9LFxuICAgICAgICAgIGJvZHk6IHsgdG90cF9pZDogdG90cElkLCBjb2RlIH0sXG4gICAgICAgIH0pXG4gICAgICA6IGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC91c2VyL21lL3RvdHBcIiwge1xuICAgICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgICAgIGJvZHk6IHsgdG90cF9pZDogdG90cElkLCBjb2RlIH0sXG4gICAgICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIEN1cnJlbnQgVE9UUCBjb2RlXG4gICAqL1xuICBhc3luYyB2ZXJpZnlUb3RwKGNvZGU6IHN0cmluZykge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMubWFuYWdlbWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSB0aGlzLiNvcmdJZFxuICAgICAgPyBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwL3ZlcmlmeVwiLCB7XG4gICAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICAgIH0pXG4gICAgICA6IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL3VzZXIvbWUvdG90cC92ZXJpZnlcIiwge1xuICAgICAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKiBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnYW5pemF0aW9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIElEIG9yIG5hbWUgb2YgdGhlIG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybiB7T3JnfSBUaGUgb3JnYW5pemF0aW9uLlxuICAgKiAqL1xuICBhc3luYyBnZXRPcmcob3JnSWQ6IHN0cmluZyk6IFByb21pc2U8T3JnPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcywgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhIGdpdmVuIGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIC0gT3JnYW5pemF0aW9uIGlkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCAtIEtleSBpZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlS2V5KG9yZ0lkOiBzdHJpbmcsIGtleUlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmRlbChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkLCBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgbWFuYWdlbWVudCBjbGllbnQuXG4gICAqIEByZXR1cm4ge0NsaWVudH0gVGhlIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIGFzeW5jIG1hbmFnZW1lbnQoKTogUHJvbWlzZTxDbGllbnQ+IHtcbiAgICBpZiAoIXRoaXMuc2Vzc2lvbk1ncikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbWFuYWdlbWVudCBzZXNzaW9uIGxvYWRlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxJZGVudGl0eVByb29mPn0gUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIGFzeW5jIHByb3ZlSWRlbnRpdHkob3JnSWQ6IHN0cmluZyk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMubWFuYWdlbWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHkvcHJvdmVcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgb2lkY1Byb3ZlSWRlbnRpdHkob2lkY1Rva2VuOiBzdHJpbmcsIG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBjbGllbnQgPSBjcmVhdGVDbGllbnQ8cGF0aHM+KHtcbiAgICAgIGJhc2VVcmw6IHRoaXMuZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IG9pZGNUb2tlbixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZS9vaWRjXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGlkZW50aXR5IHByb29mIGlzIHZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpbi5cbiAgICogQHBhcmFtIHtJZGVudGl0eVByb29mfSBpZGVudGl0eVByb29mIFRoZSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICovXG4gIGFzeW5jIHZlcmlmeUlkZW50aXR5KG9yZ0lkOiBzdHJpbmcsIGlkZW50aXR5UHJvb2Y6IElkZW50aXR5UHJvb2YpIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3ZlcmlmeVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IGlkZW50aXR5UHJvb2YsXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCAoaWQgKyBjb25maXJtYXRpb24gY29kZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduUmVzcG9uc2U8T2lkY0F1dGhSZXNwb25zZT4+fSBUaGUgc2Vzc2lvbiBkYXRhLlxuICAgKi9cbiAgYXN5bmMgb2lkY0xvZ2luKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8U2lnblJlc3BvbnNlPE9pZGNBdXRoUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgY2xpZW50ID0gY3JlYXRlQ2xpZW50PHBhdGhzPih7XG4gICAgICBiYXNlVXJsOiB0aGlzLmVudi5TaWduZXJBcGlSb290LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiBvaWRjVG9rZW4sXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnN0IGxvZ2luRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGNcIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICB0b2tlbnM6IGxpZmV0aW1lcyxcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaDEgPSBtZmFSZWNlaXB0ID8gU2lnblJlc3BvbnNlLmdldE1mYUhlYWRlcnMobWZhUmVjZWlwdCkgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2UobG9naW5GbiwgYXdhaXQgbG9naW5GbihoMSkpO1xuICB9XG59XG5cbi8qKiBNRkEgcmVjZWlwdCAqL1xuZXhwb3J0IGludGVyZmFjZSBNZmFSZWNlaXB0IHtcbiAgLyoqIE1GQSByZXF1ZXN0IElEICovXG4gIG1mYUlkOiBzdHJpbmc7XG4gIC8qKiBDb3JyZXNwb25kaW5nIG9yZyBJRCAqL1xuICBtZmFPcmdJZDogc3RyaW5nO1xuICAvKiogTUZBIGNvbmZpcm1hdGlvbiBjb2RlICovXG4gIG1mYUNvbmY6IHN0cmluZztcbn1cblxuLyoqIE9yZ2FuaXphdGlvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL29yZ1wiO1xuLyoqIEtleXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2tleVwiO1xuLyoqIFJvbGVzICovXG5leHBvcnQgKiBmcm9tIFwiLi9yb2xlXCI7XG4vKiogRW52ICovXG5leHBvcnQgKiBmcm9tIFwiLi9lbnZcIjtcbi8qKiBGaWRvICovXG5leHBvcnQgKiBmcm9tIFwiLi9maWRvXCI7XG4vKiogUGFnaW5hdGlvbiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcGFnaW5hdG9yXCI7XG4vKiogU2Vzc2lvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG4vKiogU2Vzc2lvbiBzdG9yYWdlICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuLyoqIFNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBNYW5hZ2VtZW50IHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9jb2duaXRvX21hbmFnZXJcIjtcbi8qKiBTaWduZXIgc2Vzc2lvbiBtYW5hZ2VyICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBFeHBvcnQgZXRoZXJzLmpzIFNpZ25lciAqL1xuZXhwb3J0ICogYXMgZXRoZXJzIGZyb20gXCIuL2V0aGVyc1wiO1xuIl19