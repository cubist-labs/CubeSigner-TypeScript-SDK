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
            if (x.accepted?.MfaRequired) {
                return x;
            }
            else {
                return new TotpChallenge(this, x);
            }
        };
        const h1 = mfaReceipt ? signer_session_1.SignResponse.getMfaHeaders(mfaReceipt) : undefined;
        return new signer_session_1.SignResponse(resetTotpFn, await resetTotpFn(h1));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFFM0MsK0JBQTRCO0FBQzVCLCtEQUFtRTtBQUVuRSw2RUFBOEY7QUFDOUYscURBQWlHO0FBQ2pHLCtEQUF5RjtBQUN6RixpQ0FBNkM7QUFDN0MsMkNBQTZCO0FBQzdCLGtFQUF5QztBQXFCekMseUVBQXlFO0FBQ3pFLE1BQWEsYUFBYTtJQUd4Qiw4QkFBOEI7SUFDOUIsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLCtCQUFVLENBQUMsT0FBTyxDQUFDO0lBQ2hDLENBQUM7SUFDRCxpQ0FBaUM7SUFDakMsSUFBSSxPQUFPO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLCtCQUFVLENBQUMsUUFBUSxDQUFDO0lBQ2pDLENBQUM7SUFDRDs7O09BR0c7SUFDSCxZQUFZLEVBQWMsRUFBRSxRQUFrQjtRQWRyQyxvQ0FBZ0I7UUFDaEIsMENBQW9CO1FBYzNCLHVCQUFBLElBQUkscUJBQU8sRUFBRSxNQUFBLENBQUM7UUFDZCx1QkFBQSxJQUFJLDJCQUFhLFFBQVEsTUFBQSxDQUFDO0lBQzVCLENBQUM7SUFDRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVk7UUFDdkIsTUFBTSx1QkFBQSxJQUFJLHlCQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDO0NBQ0Y7QUExQkQsc0NBMEJDOztBQUVELHdCQUF3QjtBQUN4QixNQUFhLFVBQVU7SUFLckIsdUVBQXVFO0lBQ3ZFLElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSx1QkFBSyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7O09BR0c7SUFDSCxRQUFRLENBQUMsS0FBYTtRQUNwQix1QkFB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Q0FBc0I7QUFDdEIsaUJBQWlCO0FBQ2pCLDhDQUE0QjtBQUM1QixlQUFlO0FBQ2YsbURBQWlDO0FBQ2pDLHNCQUFzQjtBQUN0Qiw0REFBMEM7QUFDMUMsc0JBQXNCO0FBQ3RCLDREQUEwQztBQUMxQyxpQ0FBaUM7QUFDakMsNERBQTBDO0FBQzFDLDZCQUE2QjtBQUM3QixtRUFBaUQ7QUFDakQsOEJBQThCO0FBQzlCLG1EQUFtQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVudnMsIEVudkludGVyZmFjZSB9IGZyb20gXCIuL2VudlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cywgQ2xpZW50LCBwYXRocyB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgT3JnIH0gZnJvbSBcIi4vb3JnXCI7XG5pbXBvcnQgeyBKc29uRmlsZVNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX3N0b3JhZ2VcIjtcblxuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvblN0b3JhZ2UsIFNpZ25lclNlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBBY2NlcHRlZFJlc3BvbnNlLCBNZmFSZXF1ZXN0SW5mbywgU2lnblJlc3BvbnNlLCBTaWduZXJTZXNzaW9uIH0gZnJvbSBcIi4vc2lnbmVyX3Nlc3Npb25cIjtcbmltcG9ydCB7IENvZ25pdG9TZXNzaW9uTWFuYWdlciwgQ29nbml0b1Nlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9jb2duaXRvX21hbmFnZXJcIjtcbmltcG9ydCB7IGFzc2VydE9rLCBjb25maWdEaXIgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgY3JlYXRlQ2xpZW50IGZyb20gXCJvcGVuYXBpLWZldGNoXCI7XG5cbi8qKiBDdWJlU2lnbmVyIGNvbnN0cnVjdG9yIG9wdGlvbnMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3ViZVNpZ25lck9wdGlvbnMge1xuICAvKiogVGhlIGVudmlyb25tZW50IHRvIHVzZSAqL1xuICBlbnY/OiBFbnZJbnRlcmZhY2U7XG4gIC8qKiBUaGUgbWFuYWdlbWVudCBhdXRob3JpemF0aW9uIHRva2VuICovXG4gIHNlc3Npb25NZ3I/OiBDb2duaXRvU2Vzc2lvbk1hbmFnZXIgfCBTaWduZXJTZXNzaW9uTWFuYWdlcjtcbiAgLyoqIE9wdGlvbmFsIG9yZ2FuaXphdGlvbiBpZCAqL1xuICBvcmdJZD86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgVXNlckluZm8gPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlVzZXJJbmZvXCJdO1xuZXhwb3J0IHR5cGUgVG90cEluZm8gPSBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiVG90cEluZm9cIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIENvbmZpZ3VyZWRNZmEgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIkNvbmZpZ3VyZWRNZmFcIl07XG5leHBvcnQgdHlwZSBSYXRjaGV0Q29uZmlnID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJSYXRjaGV0Q29uZmlnXCJdO1xuZXhwb3J0IHR5cGUgSWRlbnRpdHlQcm9vZiA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiSWRlbnRpdHlQcm9vZlwiXTtcblxudHlwZSBPaWRjQXV0aFJlc3BvbnNlID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9L29pZGNcIl1bXCJwb3N0XCJdW1wicmVzcG9uc2VzXCJdW1wiMjAwXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbi8qKiBUT1RQIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYmVmb3JlIHVzZXIncyBUT1RQIGlzIHVwZGF0ZWQgKi9cbmV4cG9ydCBjbGFzcyBUb3RwQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2NzOiBDdWJlU2lnbmVyO1xuICByZWFkb25seSAjdG90cEluZm86IFRvdHBJbmZvO1xuICAvKiogVGhlIGlkIG9mIHRoZSBjaGFsbGVuZ2UgKi9cbiAgZ2V0IHRvdHBJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdG90cEluZm8udG90cF9pZDtcbiAgfVxuICAvKiogVGhlIG5ldyBUT1RQIGNvbmZpZ3VyYXRpb24gKi9cbiAgZ2V0IHRvdHBVcmwoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3RvdHBJbmZvLnRvdHBfdXJsO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFVzZWQgd2hlbiBhbnN3ZXJpbmcgdGhlIGNoYWxsZW5nZS5cbiAgICogQHBhcmFtIHtUb3RwSW5mb30gdG90cEluZm8gVE9UUCBjaGFsbGVuZ2UgaW5mb3JtYXRpb24uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgdG90cEluZm86IFRvdHBJbmZvKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLiN0b3RwSW5mbyA9IHRvdHBJbmZvO1xuICB9XG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIGNoYWxsZW5nZSB3aXRoIHRoZSBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhpcyBgdGhpcy50b3RwVXJsYC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhpcyBgdGhpcy50b3RwVXJsYC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjb2RlOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNjcy5yZXNldFRvdHBDb21wbGV0ZSh0aGlzLnRvdHBJZCwgY29kZSk7XG4gIH1cbn1cblxuLyoqIEN1YmVTaWduZXIgY2xpZW50ICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lciB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgc2Vzc2lvbk1ncj86IENvZ25pdG9TZXNzaW9uTWFuYWdlciB8IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuICAjb3JnSWQ/OiBzdHJpbmc7XG5cbiAgLyoqIEByZXR1cm4ge0VudkludGVyZmFjZX0gVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnQgb2YgdGhpcyBjbGllbnQgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLiNlbnY7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBuZXcgb3JnYW5pemF0aW9uIGlkLlxuICAgKi9cbiAgc2V0T3JnSWQob3JnSWQ6IHN0cmluZykge1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3RpbmcgbWFuYWdlbWVudCBzZXNzaW9uIGFuZCBjcmVhdGVzIGEgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtDb2duaXRvU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWRcbiAgICogdGhlIHNlc3Npb24gZnJvbS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIG1hbmFnZW1lbnQgc2Vzc2lvbiBmcm9tIHRoZSBjb25maWdcbiAgICogZGlyZWN0b3J5IHdpbGwgYmUgbG9hZGVkLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXI+fSBOZXcgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRNYW5hZ2VtZW50U2Vzc2lvbihzdG9yYWdlPzogQ29nbml0b1Nlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxDdWJlU2lnbmVyPiB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcIm1hbmFnZW1lbnQtc2Vzc2lvbi5qc29uXCIpO1xuICAgIGNvbnN0IHNlc3Npb25NZ3IgPSBhd2FpdCBDb2duaXRvU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKFxuICAgICAgc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyKDxDdWJlU2lnbmVyT3B0aW9ucz57XG4gICAgICBzZXNzaW9uTWdyLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2lnbmVyIHNlc3Npb24gZnJvbSBhIHNlc3Npb24gc3RvcmFnZSAoZS5nLiwgc2Vzc2lvbiBmaWxlKS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBPcHRpb25hbCBzZXNzaW9uIHN0b3JhZ2UgdG8gbG9hZFxuICAgKiB0aGUgc2Vzc2lvbiBmcm9tLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgc2lnbmVyIHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uPiB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcInNpZ25lci1zZXNzaW9uLmpzb25cIik7XG4gICAgY29uc3Qgc3NzID0gc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uLmxvYWRTaWduZXJTZXNzaW9uKHNzcyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbmFsIGNvbmZpZ3VyYWl0b24gb3B0aW9ucyBmb3IgdGhlIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogQ3ViZVNpZ25lck9wdGlvbnMpIHtcbiAgICBsZXQgZW52ID0gb3B0aW9ucz8uZW52O1xuICAgIGlmIChvcHRpb25zPy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aGlzLnNlc3Npb25NZ3IgPSBvcHRpb25zLnNlc3Npb25NZ3I7XG4gICAgICBlbnYgPSBlbnYgPz8gdGhpcy5zZXNzaW9uTWdyLmVudjtcbiAgICB9XG4gICAgdGhpcy4jZW52ID0gZW52ID8/IGVudnNbXCJnYW1tYVwiXTtcbiAgICB0aGlzLiNvcmdJZCA9IG9wdGlvbnM/Lm9yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEF1dGhlbnRpY2F0ZSBhbiBPSURDIHVzZXIgYW5kIGNyZWF0ZSBhIG5ldyBzZXNzaW9uIG1hbmFnZXIgZm9yIHRoZW0uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1JhdGNoZXRDb25maWd9IGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlP30gc3RvcmFnZSBPcHRpb25hbCBzaWduZXIgc2Vzc2lvbiBzdG9yYWdlIChkZWZhdWx0cyB0byBpbi1tZW1vcnkgc3RvcmFnZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IFRoZSBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBhc3luYyBvaWRjQXV0aChcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLm9pZGNMb2dpbihvaWRjVG9rZW4sIG9yZ0lkLCBzY29wZXMsIGxpZmV0aW1lcyk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmNyZWF0ZUZyb21TZXNzaW9uSW5mbyh0aGlzLmVudiwgb3JnSWQsIHJlc3AuZGF0YSgpLCBzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxVc2VySW5mbz59IFVzZXIgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBhYm91dE1lKCk6IFByb21pc2U8VXNlckluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKTtcbiAgICBjb25zdCByZXNwID0gdGhpcy4jb3JnSWRcbiAgICAgID8gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZVwiLCB7XG4gICAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICAgIH0pXG4gICAgICA6IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvYWJvdXRfbWVcIiwge1xuICAgICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGV4aXN0aW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChvcmdJZDogc3RyaW5nLCBtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm9bXT59IFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFMaXN0KG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0vbWZhXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKS5tZmFfcmVxdWVzdHM7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYUFwcHJvdmUob3JnSWQ6IHN0cmluZywgbWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gVGhpcyByZXF1ZXN0IHJldHVybnMgYSBuZXcgVE9UUCBjaGFsbGVuZ2VcbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmcgYHJlc2V0VG90cENvbXBsZXRlYFxuICAgKlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgTUZBIHJlY2VpcHQgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICovXG4gIGFzeW5jIHJlc2V0VG90cFN0YXJ0KG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0KTogUHJvbWlzZTxTaWduUmVzcG9uc2U8VG90cENoYWxsZW5nZT4+IHtcbiAgICBjb25zdCByZXNldFRvdHBGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IG9yZ0lkID0gdGhpcy4jb3JnSWQgfHwgbWZhUmVjZWlwdD8ubWZhT3JnSWQ7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBvcmdJZFxuICAgICAgICA/IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwge1xuICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICAgICAgYm9keTogbnVsbCxcbiAgICAgICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgICAgIH0pXG4gICAgICAgIDogYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvdXNlci9tZS90b3RwXCIsIHtcbiAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICBib2R5OiBudWxsLFxuICAgICAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICAgICAgfSk7XG4gICAgICBjb25zdCB4ID0gYXNzZXJ0T2socmVzcCk7XG4gICAgICBpZiAoKHggYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkKSB7XG4gICAgICAgIHJldHVybiB4IGFzIEFjY2VwdGVkUmVzcG9uc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcywgeCBhcyBUb3RwSW5mbyk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBoMSA9IG1mYVJlY2VpcHQgPyBTaWduUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KSA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZShyZXNldFRvdHBGbiwgYXdhaXQgcmVzZXRUb3RwRm4oaDEpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIFRPVFAgY2hhbGxlbmdlIGlzc3VlZCBieSBgcmVzZXRUb3RwU3RhcnRgLiBJZiBzdWNjZXNzZnVsLCB1c2VyJ3NcbiAgICogVE9UUCBjb25maWd1cmF0aW9uIHdpbGwgYmUgdXBkYXRlZCB0byB0aGF0IG9mIHRoZSBUT1RQIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvdHBJZCAtIFRoZSBJRCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgLSBUaGUgVE9UUCBjb2RlIHRoYXQgc2hvdWxkIHZlcmlmeSBhZ2FpbnN0IHRoZSBUT1RQIGNvbmZpZ3VyYXRpb24gZnJvbSB0aGUgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgcmVzZXRUb3RwQ29tcGxldGUodG90cElkOiBzdHJpbmcsIGNvZGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMubWFuYWdlbWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSB0aGlzLiNvcmdJZFxuICAgICAgPyBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCB7XG4gICAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICAgICAgYm9keTogeyB0b3RwX2lkOiB0b3RwSWQsIGNvZGUgfSxcbiAgICAgICAgfSlcbiAgICAgIDogYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL3VzZXIvbWUvdG90cFwiLCB7XG4gICAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICAgICAgYm9keTogeyB0b3RwX2lkOiB0b3RwSWQsIGNvZGUgfSxcbiAgICAgICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgQ3VycmVudCBUT1RQIGNvZGVcbiAgICovXG4gIGFzeW5jIHZlcmlmeVRvdHAoY29kZTogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5tYW5hZ2VtZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IHRoaXMuI29yZ0lkXG4gICAgICA/IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHAvdmVyaWZ5XCIsIHtcbiAgICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkIH0gfSxcbiAgICAgICAgICBib2R5OiB7IGNvZGUgfSxcbiAgICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgICAgfSlcbiAgICAgIDogYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvdXNlci9tZS90b3RwL3ZlcmlmeVwiLCB7XG4gICAgICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmdhbml6YXRpb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgSUQgb3IgbmFtZSBvZiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKiBAcmV0dXJuIHtPcmd9IFRoZSBvcmdhbml6YXRpb24uXG4gICAqICovXG4gIGFzeW5jIGdldE9yZyhvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxPcmc+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGEgZ2l2ZW4ga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgLSBPcmdhbml6YXRpb24gaWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIC0gS2V5IGlkXG4gICAqL1xuICBhc3luYyBkZWxldGVLZXkob3JnSWQ6IHN0cmluZywga2V5SWQ6IHN0cmluZykge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBtYW5hZ2VtZW50IGNsaWVudC5cbiAgICogQHJldHVybiB7Q2xpZW50fSBUaGUgY2xpZW50LlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgYXN5bmMgbWFuYWdlbWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGlmICghdGhpcy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBtYW5hZ2VtZW50IHNlc3Npb24gbG9hZGVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgcHJvdmVJZGVudGl0eShvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5tYW5hZ2VtZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SWRlbnRpdHlQcm9vZj59IFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBhc3luYyBvaWRjUHJvdmVJZGVudGl0eShvaWRjVG9rZW46IHN0cmluZywgb3JnSWQ6IHN0cmluZyk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGNyZWF0ZUNsaWVudDxwYXRocz4oe1xuICAgICAgYmFzZVVybDogdGhpcy5lbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogb2lkY1Rva2VuLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3Byb3ZlL29pZGNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgZ2l2ZW4gaWRlbnRpdHkgcHJvb2YgaXMgdmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluLlxuICAgKiBAcGFyYW0ge0lkZW50aXR5UHJvb2Z9IGlkZW50aXR5UHJvb2YgVGhlIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKi9cbiAgYXN5bmMgdmVyaWZ5SWRlbnRpdHkob3JnSWQ6IHN0cmluZywgaWRlbnRpdHlQcm9vZjogSWRlbnRpdHlQcm9vZikge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHkvdmVyaWZ5XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgYm9keTogaWRlbnRpdHlQcm9vZixcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEBwYXJhbSB7TGlzdDxzdHJpbmc+fSBzY29wZXMgVGhlIHNjb3BlcyBvZiB0aGUgcmVzdWx0aW5nIHNlc3Npb25cbiAgICogQHBhcmFtIHtSYXRjaGV0Q29uZmlnfSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0IChpZCArIGNvbmZpcm1hdGlvbiBjb2RlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25SZXNwb25zZTxPaWRjQXV0aFJlc3BvbnNlPj59IFRoZSBzZXNzaW9uIGRhdGEuXG4gICAqL1xuICBhc3luYyBvaWRjTG9naW4oXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8T2lkY0F1dGhSZXNwb25zZT4+IHtcbiAgICBjb25zdCBjbGllbnQgPSBjcmVhdGVDbGllbnQ8cGF0aHM+KHtcbiAgICAgIGJhc2VVcmw6IHRoaXMuZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IG9pZGNUb2tlbixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgbG9naW5GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vb2lkY1wiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgc2NvcGVzLFxuICAgICAgICAgIHRva2VuczogbGlmZXRpbWVzLFxuICAgICAgICB9LFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG5cbiAgICBjb25zdCBoMSA9IG1mYVJlY2VpcHQgPyBTaWduUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0KSA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZShsb2dpbkZuLCBhd2FpdCBsb2dpbkZuKGgxKSk7XG4gIH1cbn1cblxuLyoqIE1GQSByZWNlaXB0ICovXG5leHBvcnQgaW50ZXJmYWNlIE1mYVJlY2VpcHQge1xuICAvKiogTUZBIHJlcXVlc3QgSUQgKi9cbiAgbWZhSWQ6IHN0cmluZztcbiAgLyoqIENvcnJlc3BvbmRpbmcgb3JnIElEICovXG4gIG1mYU9yZ0lkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgbWZhQ29uZjogc3RyaW5nO1xufVxuXG4vKiogT3JnYW5pemF0aW9ucyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vb3JnXCI7XG4vKiogS2V5cyAqL1xuZXhwb3J0ICogZnJvbSBcIi4va2V5XCI7XG4vKiogUm9sZXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3JvbGVcIjtcbi8qKiBFbnYgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2VudlwiO1xuLyoqIFBhZ2luYXRpb24gKi9cbmV4cG9ydCAqIGZyb20gXCIuL3BhZ2luYXRvclwiO1xuLyoqIFNlc3Npb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuLyoqIFNlc3Npb24gc3RvcmFnZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX3N0b3JhZ2VcIjtcbi8qKiBTZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogTWFuYWdlbWVudCBzZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyXCI7XG4vKiogU2lnbmVyIHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogRXhwb3J0IGV0aGVycy5qcyBTaWduZXIgKi9cbmV4cG9ydCAqIGFzIGV0aGVycyBmcm9tIFwiLi9ldGhlcnNcIjtcbiJdfQ==