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
var _CubeSigner_env, _CubeSigner_csc;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.NAME = exports.ethers = exports.userExportKeygen = exports.userExportDecrypt = exports.CubeSigner = void 0;
const env_1 = require("./env");
const api_1 = require("./api");
const client_1 = require("./client");
const org_1 = require("./org");
const session_storage_1 = require("./session/session_storage");
const signer_session_manager_1 = require("./session/signer_session_manager");
const signer_session_1 = require("./signer_session");
const cognito_manager_1 = require("./session/cognito_manager");
const util_1 = require("./util");
const path = __importStar(require("path"));
const package_json_1 = require("./../package.json");
/**
 * CubeSigner client
 *
 * @deprecated Use {@link Org} or {@link CubeSignerClient} instead.
 */
class CubeSigner {
    /**
     * Underlying {@link CubeSignerClient} instance, if set; otherwise throws.
     * @internal
     */
    get csc() {
        if (!__classPrivateFieldGet(this, _CubeSigner_csc, "f")) {
            throw new Error("CubeSignerClient is not set");
        }
        return __classPrivateFieldGet(this, _CubeSigner_csc, "f");
    }
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env() {
        return __classPrivateFieldGet(this, _CubeSigner_env, "f");
    }
    /** Organization ID */
    get orgId() {
        return this.csc.orgId;
    }
    /**
     * Set the organization ID
     * @param {string} orgId The new organization id.
     */
    setOrgId(orgId) {
        __classPrivateFieldSet(this, _CubeSigner_csc, this.csc.withOrg(orgId), "f");
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
        return new CubeSigner({
            sessionMgr: await cognito_manager_1.CognitoSessionManager.loadManagementSession(storage),
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
     * @param {CubeSignerOptions} options The optional configuration options for the CubeSigner instance.
     */
    constructor(options) {
        _CubeSigner_env.set(this, void 0);
        _CubeSigner_csc.set(this, void 0);
        let env = options?.env;
        if (options?.sessionMgr) {
            this.sessionMgr = options.sessionMgr;
            env = env ?? this.sessionMgr.env;
        }
        __classPrivateFieldSet(this, _CubeSigner_env, env ?? env_1.envs["gamma"], "f");
        __classPrivateFieldSet(this, _CubeSigner_csc, new client_1.CubeSignerClient(
        // HACK: ignore that sessionMgr may be a CognitoSessionManager and pretend that it
        //       is a SignerSessionManager; that's fine because the CubeSignerClient will
        //       almost always just call `await token()` on it, which works in both cases.
        //
        // This is done here for backward compatibility reasons only; in the future,
        // we should deprecate this class and people should start using `CubeSingerClient` directly.
        options?.sessionMgr, options?.orgId), "f");
    }
    /**
     * Authenticate an OIDC user and create a new session manager for them.
     *
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
        return await this.csc.userGet();
    }
    /**
     * Retrieves existing MFA request.
     *
     * @param {string} orgId Organization ID
     * @param {string} mfaId MFA request ID
     * @return {Promise<MfaRequestInfo>} MFA request information
     */
    async mfaGet(orgId, mfaId) {
        return await this.csc.withOrg(orgId).mfaGet(mfaId);
    }
    /**
     * List pending MFA requests accessible to the current user.
     * @param {string} orgId Organization ID
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    async mfaList(orgId) {
        return await this.csc.withOrg(orgId).mfaList();
    }
    /**
     * Approve a pending MFA request.
     *
     * @param {string} orgId The org id of the MFA request
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    async mfaApprove(orgId, mfaId) {
        return await this.csc.withOrg(orgId).mfaApprove(mfaId);
    }
    /** Initiate adding a new FIDO device. MFA may be required. */
    get addFidoStart() {
        return this.csc.userRegisterFidoInit.bind(this.csc);
    }
    /**
     * Creates a request to change user's TOTP. This request returns a new TOTP challenge
     * that must be answered by calling `resetTotpComplete`
     */
    get resetTotpStart() {
        return this.csc.userResetTotpInit.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
    }
    /**
     * Answer the TOTP challenge issued by `resetTotpStart`. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.he TOTP configuration from the challenge.
     */
    get resetTotpComplete() {
        return this.csc.userResetTotpComplete.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     */
    get verifyTotp() {
        return this.csc.userVerifyTotp.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
    }
    /**
     * Retrieve information about an organization.
     * @param {string} orgId The ID or name of the organization.
     * @return {Org} The organization.
     */
    async getOrg(orgId) {
        return new org_1.Org(this.csc.sessionMgr, orgId ?? this.csc.orgId);
    }
    /**
     * Deletes a given key.
     * @param {string} orgId - Organization id
     * @param {string} keyId - Key id
     */
    async deleteKey(orgId, keyId) {
        await this.csc.withOrg(orgId).keyDelete(keyId);
    }
    /**
     * Get the management client.
     * @return {Client} The client.
     * @internal
     */
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
        return await this.csc.withOrg(orgId).identityProve();
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async oidcProveIdentity(oidcToken, orgId) {
        const oidcClient = new api_1.OidcClient(__classPrivateFieldGet(this, _CubeSigner_env, "f"), orgId, oidcToken);
        return await oidcClient.identityProve();
    }
    /**
     * Checks if a given identity proof is valid.
     *
     * @param {string} orgId The id of the organization that the user is in.
     * @param {IdentityProof} identityProof The proof of authentication.
     */
    async verifyIdentity(orgId, identityProof) {
        await this.csc.withOrg(orgId).identityVerify(identityProof);
    }
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<CubeSignerResponse<SignerSessionData>>} The session data.
     */
    async oidcLogin(oidcToken, orgId, scopes, lifetimes, mfaReceipt) {
        const oidcClient = new api_1.OidcClient(__classPrivateFieldGet(this, _CubeSigner_env, "f"), orgId, oidcToken);
        return await oidcClient.sessionCreate(scopes, lifetimes, mfaReceipt);
    }
}
exports.CubeSigner = CubeSigner;
_CubeSigner_env = new WeakMap(), _CubeSigner_csc = new WeakMap();
/** API */
__exportStar(require("./api"), exports);
/** Client */
__exportStar(require("./client"), exports);
/** Organizations */
__exportStar(require("./org"), exports);
/** Keys */
__exportStar(require("./key"), exports);
/** Roles */
__exportStar(require("./role"), exports);
/** Env */
__exportStar(require("./env"), exports);
/** Fido */
__exportStar(require("./mfa"), exports);
/** Pagination */
__exportStar(require("./paginator"), exports);
/** Response */
__exportStar(require("./response"), exports);
/** Types */
__exportStar(require("./schema_types"), exports);
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
/** User-export decryption helper */
var user_export_1 = require("./user_export");
Object.defineProperty(exports, "userExportDecrypt", { enumerable: true, get: function () { return user_export_1.userExportDecrypt; } });
Object.defineProperty(exports, "userExportKeygen", { enumerable: true, get: function () { return user_export_1.userExportKeygen; } });
/** Export ethers.js Signer */
exports.ethers = __importStar(require("./ethers"));
/** CubeSigner SDK package name */
exports.NAME = package_json_1.name;
/** CubeSigner SDK version */
exports.VERSION = package_json_1.version;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0MsK0JBQTJDO0FBQzNDLHFDQUE0QztBQUM1QywrQkFBNEI7QUFDNUIsK0RBQW1FO0FBRW5FLDZFQUkwQztBQUUxQyxxREFBaUQ7QUFDakQsK0RBQXlGO0FBQ3pGLGlDQUFtQztBQUNuQywyQ0FBNkI7QUFFN0Isb0RBQWtEO0FBYWxEOzs7O0dBSUc7QUFDSCxNQUFhLFVBQVU7SUFLckI7OztPQUdHO0lBQ0gsSUFBSSxHQUFHO1FBQ0wsSUFBSSxDQUFDLHVCQUFBLElBQUksdUJBQUssRUFBRSxDQUFDO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFDRCxPQUFPLHVCQUFBLElBQUksdUJBQUssQ0FBQztJQUNuQixDQUFDO0lBRUQsdUVBQXVFO0lBQ3ZFLElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSx1QkFBSyxDQUFDO0lBQ25CLENBQUM7SUFFRCxzQkFBc0I7SUFDdEIsSUFBSSxLQUFLO1FBQ1AsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztJQUN4QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsUUFBUSxDQUFDLEtBQWE7UUFDcEIsdUJBQUEsSUFBSSxtQkFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUErQjtRQUNoRSxPQUFPLElBQUksVUFBVSxDQUFvQjtZQUN2QyxVQUFVLEVBQUUsTUFBTSx1Q0FBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUM7U0FDdkUsQ0FBQyxD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QUFzQjtBQUN0Qiw0REFBMEM7QUFDMUMsaUNBQWlDO0FBQ2pDLDREQUEwQztBQUMxQyw2QkFBNkI7QUFDN0IsbUVBQWlEO0FBQ2pELG9DQUFvQztBQUNwQyw2Q0FBb0U7QUFBM0QsZ0hBQUEsaUJBQWlCLE9BQUE7QUFBRSwrR0FBQSxnQkFBZ0IsT0FBQTtBQUM1Qyw4QkFBOEI7QUFDOUIsbURBQW1DO0FBRW5DLGtDQUFrQztBQUNyQixRQUFBLElBQUksR0FBVyxtQkFBSSxDQUFDO0FBRWpDLDZCQUE2QjtBQUNoQixRQUFBLE9BQU8sR0FBVyxzQkFBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZW52cywgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4vZW52XCI7XG5pbXBvcnQgeyBDbGllbnQsIE9pZGNDbGllbnQgfSBmcm9tIFwiLi9hcGlcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IE9yZyB9IGZyb20gXCIuL29yZ1wiO1xuaW1wb3J0IHsgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlXCI7XG5cbmltcG9ydCB7XG4gIFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICBTaWduZXJTZXNzaW9uTWFuYWdlcixcbiAgU2lnbmVyU2Vzc2lvbkRhdGEsXG59IGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lclJlc3BvbnNlIH0gZnJvbSBcIi4vcmVzcG9uc2VcIjtcbmltcG9ydCB7IFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuaW1wb3J0IHsgQ29nbml0b1Nlc3Npb25NYW5hZ2VyLCBDb2duaXRvU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL2NvZ25pdG9fbWFuYWdlclwiO1xuaW1wb3J0IHsgY29uZmlnRGlyIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgTWZhUmVjZWlwdCB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHsgbmFtZSwgdmVyc2lvbiB9IGZyb20gXCIuLy4uL3BhY2thZ2UuanNvblwiO1xuaW1wb3J0IHsgSWRlbnRpdHlQcm9vZiwgTWZhUmVxdWVzdEluZm8sIFJhdGNoZXRDb25maWcsIFVzZXJJbmZvIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8qKiBDdWJlU2lnbmVyIGNvbnN0cnVjdG9yIG9wdGlvbnMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3ViZVNpZ25lck9wdGlvbnMge1xuICAvKiogVGhlIGVudmlyb25tZW50IHRvIHVzZSAqL1xuICBlbnY/OiBFbnZJbnRlcmZhY2U7XG4gIC8qKiBUaGUgbWFuYWdlbWVudCBhdXRob3JpemF0aW9uIHRva2VuICovXG4gIHNlc3Npb25NZ3I/OiBDb2duaXRvU2Vzc2lvbk1hbmFnZXIgfCBTaWduZXJTZXNzaW9uTWFuYWdlcjtcbiAgLyoqIE9wdGlvbmFsIG9yZ2FuaXphdGlvbiBpZCAqL1xuICBvcmdJZD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBDdWJlU2lnbmVyIGNsaWVudFxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgT3JnfSBvciB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXIge1xuICByZWFkb25seSAjZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5IHNlc3Npb25NZ3I/OiBDb2duaXRvU2Vzc2lvbk1hbmFnZXIgfCBTaWduZXJTZXNzaW9uTWFuYWdlcjtcbiAgI2NzYz86IEN1YmVTaWduZXJDbGllbnQ7XG5cbiAgLyoqXG4gICAqIFVuZGVybHlpbmcge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlLCBpZiBzZXQ7IG90aGVyd2lzZSB0aHJvd3MuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IGNzYygpOiBDdWJlU2lnbmVyQ2xpZW50IHtcbiAgICBpZiAoIXRoaXMuI2NzYykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3ViZVNpZ25lckNsaWVudCBpcyBub3Qgc2V0XCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jY3NjO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge0VudkludGVyZmFjZX0gVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnQgb2YgdGhpcyBjbGllbnQgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLiNlbnY7XG4gIH1cblxuICAvKiogT3JnYW5pemF0aW9uIElEICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2Mub3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBuZXcgb3JnYW5pemF0aW9uIGlkLlxuICAgKi9cbiAgc2V0T3JnSWQob3JnSWQ6IHN0cmluZykge1xuICAgIHRoaXMuI2NzYyA9IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuIGV4aXN0aW5nIG1hbmFnZW1lbnQgc2Vzc2lvbiBhbmQgY3JlYXRlcyBhIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29nbml0b1Nlc3Npb25TdG9yYWdlfSBzdG9yYWdlIE9wdGlvbmFsIHNlc3Npb24gc3RvcmFnZSB0byBsb2FkXG4gICAqIHRoZSBzZXNzaW9uIGZyb20uIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBtYW5hZ2VtZW50IHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyPn0gTmV3IEN1YmVTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkTWFuYWdlbWVudFNlc3Npb24oc3RvcmFnZT86IENvZ25pdG9TZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8Q3ViZVNpZ25lcj4ge1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lcig8Q3ViZVNpZ25lck9wdGlvbnM+e1xuICAgICAgc2Vzc2lvbk1ncjogYXdhaXQgQ29nbml0b1Nlc3Npb25NYW5hZ2VyLmxvYWRNYW5hZ2VtZW50U2Vzc2lvbihzdG9yYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNpZ25lciBzZXNzaW9uIGZyb20gYSBzZXNzaW9uIHN0b3JhZ2UgKGUuZy4sIHNlc3Npb24gZmlsZSkuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWRcbiAgICogdGhlIHNlc3Npb24gZnJvbS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIHNpZ25lciBzZXNzaW9uIGZyb20gdGhlIGNvbmZpZ1xuICAgKiBkaXJlY3Rvcnkgd2lsbCBiZSBsb2FkZWQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRTaWduZXJTZXNzaW9uKHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IGRlZmF1bHRGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdEaXIoKSwgXCJzaWduZXItc2Vzc2lvbi5qc29uXCIpO1xuICAgIGNvbnN0IHNzcyA9IHN0b3JhZ2UgPz8gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoZGVmYXVsdEZpbGVQYXRoKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbi5sb2FkU2lnbmVyU2Vzc2lvbihzc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25hbCBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IEN1YmVTaWduZXJPcHRpb25zKSB7XG4gICAgbGV0IGVudiA9IG9wdGlvbnM/LmVudjtcbiAgICBpZiAob3B0aW9ucz8uc2Vzc2lvbk1ncikge1xuICAgICAgdGhpcy5zZXNzaW9uTWdyID0gb3B0aW9ucy5zZXNzaW9uTWdyO1xuICAgICAgZW52ID0gZW52ID8/IHRoaXMuc2Vzc2lvbk1nci5lbnY7XG4gICAgfVxuICAgIHRoaXMuI2VudiA9IGVudiA/PyBlbnZzW1wiZ2FtbWFcIl07XG4gICAgdGhpcy4jY3NjID0gbmV3IEN1YmVTaWduZXJDbGllbnQoXG4gICAgICAvLyBIQUNLOiBpZ25vcmUgdGhhdCBzZXNzaW9uTWdyIG1heSBiZSBhIENvZ25pdG9TZXNzaW9uTWFuYWdlciBhbmQgcHJldGVuZCB0aGF0IGl0XG4gICAgICAvLyAgICAgICBpcyBhIFNpZ25lclNlc3Npb25NYW5hZ2VyOyB0aGF0J3MgZmluZSBiZWNhdXNlIHRoZSBDdWJlU2lnbmVyQ2xpZW50IHdpbGxcbiAgICAgIC8vICAgICAgIGFsbW9zdCBhbHdheXMganVzdCBjYWxsIGBhd2FpdCB0b2tlbigpYCBvbiBpdCwgd2hpY2ggd29ya3MgaW4gYm90aCBjYXNlcy5cbiAgICAgIC8vXG4gICAgICAvLyBUaGlzIGlzIGRvbmUgaGVyZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSByZWFzb25zIG9ubHk7IGluIHRoZSBmdXR1cmUsXG4gICAgICAvLyB3ZSBzaG91bGQgZGVwcmVjYXRlIHRoaXMgY2xhc3MgYW5kIHBlb3BsZSBzaG91bGQgc3RhcnQgdXNpbmcgYEN1YmVTaW5nZXJDbGllbnRgIGRpcmVjdGx5LlxuICAgICAgb3B0aW9ucz8uc2Vzc2lvbk1nciBhcyB1bmtub3duIGFzIFNpZ25lclNlc3Npb25NYW5hZ2VyLFxuICAgICAgb3B0aW9ucz8ub3JnSWQsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRoZW50aWNhdGUgYW4gT0lEQyB1c2VyIGFuZCBjcmVhdGUgYSBuZXcgc2Vzc2lvbiBtYW5hZ2VyIGZvciB0aGVtLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEBwYXJhbSB7TGlzdDxzdHJpbmc+fSBzY29wZXMgVGhlIHNjb3BlcyBvZiB0aGUgcmVzdWx0aW5nIHNlc3Npb25cbiAgICogQHBhcmFtIHtSYXRjaGV0Q29uZmlnfSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZT99IHN0b3JhZ2UgT3B0aW9uYWwgc2lnbmVyIHNlc3Npb24gc3RvcmFnZSAoZGVmYXVsdHMgdG8gaW4tbWVtb3J5IHN0b3JhZ2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBUaGUgc2lnbmVyIHNlc3Npb24gbWFuYWdlclxuICAgKi9cbiAgYXN5bmMgb2lkY0F1dGgoXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5vaWRjTG9naW4ob2lkY1Rva2VuLCBvcmdJZCwgc2NvcGVzLCBsaWZldGltZXMpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5jcmVhdGVGcm9tU2Vzc2lvbkluZm8odGhpcy5lbnYsIG9yZ0lkLCByZXNwLmRhdGEoKSwgc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckluZm8+fSBVc2VyIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgYWJvdXRNZSgpOiBQcm9taXNlPFVzZXJJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLnVzZXJHZXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgZXhpc3RpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBNRkEgcmVxdWVzdCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgbWZhR2V0KG9yZ0lkOiBzdHJpbmcsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLm1mYUdldChtZmFJZCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mb1tdPn0gVGhlIE1GQSByZXF1ZXN0cy5cbiAgICovXG4gIGFzeW5jIG1mYUxpc3Qob3JnSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm9bXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5tZmFMaXN0KCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYUFwcHJvdmUob3JnSWQ6IHN0cmluZywgbWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkubWZhQXBwcm92ZShtZmFJZCk7XG4gIH1cblxuICAvKiogSW5pdGlhdGUgYWRkaW5nIGEgbmV3IEZJRE8gZGV2aWNlLiBNRkEgbWF5IGJlIHJlcXVpcmVkLiAqL1xuICBnZXQgYWRkRmlkb1N0YXJ0KCkge1xuICAgIHJldHVybiB0aGlzLmNzYy51c2VyUmVnaXN0ZXJGaWRvSW5pdC5iaW5kKHRoaXMuY3NjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdXNlcidzIFRPVFAuIFRoaXMgcmVxdWVzdCByZXR1cm5zIGEgbmV3IFRPVFAgY2hhbGxlbmdlXG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIGByZXNldFRvdHBDb21wbGV0ZWBcbiAgICovXG4gIGdldCByZXNldFRvdHBTdGFydCgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2MudXNlclJlc2V0VG90cEluaXQuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgVE9UUCBjaGFsbGVuZ2UgaXNzdWVkIGJ5IGByZXNldFRvdHBTdGFydGAuIElmIHN1Y2Nlc3NmdWwsIHVzZXInc1xuICAgKiBUT1RQIGNvbmZpZ3VyYXRpb24gd2lsbCBiZSB1cGRhdGVkIHRvIHRoYXQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlLmhlIFRPVFAgY29uZmlndXJhdGlvbiBmcm9tIHRoZSBjaGFsbGVuZ2UuXG4gICAqL1xuICBnZXQgcmVzZXRUb3RwQ29tcGxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3NjLnVzZXJSZXNldFRvdHBDb21wbGV0ZS5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICovXG4gIGdldCB2ZXJpZnlUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLmNzYy51c2VyVmVyaWZ5VG90cC5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnYW5pemF0aW9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIElEIG9yIG5hbWUgb2YgdGhlIG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybiB7T3JnfSBUaGUgb3JnYW5pemF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZ2V0T3JnKG9yZ0lkPzogc3RyaW5nKTogUHJvbWlzZTxPcmc+IHtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLmNzYy5zZXNzaW9uTWdyLCBvcmdJZCA/PyB0aGlzLmNzYy5vcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhIGdpdmVuIGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIC0gT3JnYW5pemF0aW9uIGlkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCAtIEtleSBpZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlS2V5KG9yZ0lkOiBzdHJpbmcsIGtleUlkOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5rZXlEZWxldGUoa2V5SWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWFuYWdlbWVudCBjbGllbnQuXG4gICAqIEByZXR1cm4ge0NsaWVudH0gVGhlIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBtYW5hZ2VtZW50KCk6IFByb21pc2U8Q2xpZW50PiB7XG4gICAgaWYgKCF0aGlzLnNlc3Npb25NZ3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG1hbmFnZW1lbnQgc2Vzc2lvbiBsb2FkZWRcIik7XG4gICAgfVxuICAgIHJldHVybiBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SWRlbnRpdHlQcm9vZj59IFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBhc3luYyBwcm92ZUlkZW50aXR5KG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkuaWRlbnRpdHlQcm92ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxJZGVudGl0eVByb29mPn0gUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIGFzeW5jIG9pZGNQcm92ZUlkZW50aXR5KG9pZGNUb2tlbjogc3RyaW5nLCBvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3Qgb2lkY0NsaWVudCA9IG5ldyBPaWRjQ2xpZW50KHRoaXMuI2Vudiwgb3JnSWQsIG9pZGNUb2tlbik7XG4gICAgcmV0dXJuIGF3YWl0IG9pZGNDbGllbnQuaWRlbnRpdHlQcm92ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGlkZW50aXR5IHByb29mIGlzIHZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpbi5cbiAgICogQHBhcmFtIHtJZGVudGl0eVByb29mfSBpZGVudGl0eVByb29mIFRoZSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICovXG4gIGFzeW5jIHZlcmlmeUlkZW50aXR5KG9yZ0lkOiBzdHJpbmcsIGlkZW50aXR5UHJvb2Y6IElkZW50aXR5UHJvb2YpIHtcbiAgICBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5pZGVudGl0eVZlcmlmeShpZGVudGl0eVByb29mKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCAoaWQgKyBjb25maXJtYXRpb24gY29kZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2lnbmVyU2Vzc2lvbkRhdGE+Pn0gVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIGFzeW5jIG9pZGNMb2dpbihcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTaWduZXJTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvaWRjQ2xpZW50ID0gbmV3IE9pZGNDbGllbnQodGhpcy4jZW52LCBvcmdJZCwgb2lkY1Rva2VuKTtcbiAgICByZXR1cm4gYXdhaXQgb2lkY0NsaWVudC5zZXNzaW9uQ3JlYXRlKHNjb3BlcywgbGlmZXRpbWVzLCBtZmFSZWNlaXB0KTtcbiAgfVxufVxuXG4vKiogQVBJICovXG5leHBvcnQgKiBmcm9tIFwiLi9hcGlcIjtcbi8qKiBDbGllbnQgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2NsaWVudFwiO1xuLyoqIE9yZ2FuaXphdGlvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL29yZ1wiO1xuLyoqIEtleXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2tleVwiO1xuLyoqIFJvbGVzICovXG5leHBvcnQgKiBmcm9tIFwiLi9yb2xlXCI7XG4vKiogRW52ICovXG5leHBvcnQgKiBmcm9tIFwiLi9lbnZcIjtcbi8qKiBGaWRvICovXG5leHBvcnQgKiBmcm9tIFwiLi9tZmFcIjtcbi8qKiBQYWdpbmF0aW9uICovXG5leHBvcnQgKiBmcm9tIFwiLi9wYWdpbmF0b3JcIjtcbi8qKiBSZXNwb25zZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcmVzcG9uc2VcIjtcbi8qKiBUeXBlcyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG4vKiogU2Vzc2lvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG4vKiogU2Vzc2lvbiBzdG9yYWdlICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuLyoqIFNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBNYW5hZ2VtZW50IHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9jb2duaXRvX21hbmFnZXJcIjtcbi8qKiBTaWduZXIgc2Vzc2lvbiBtYW5hZ2VyICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBVc2VyLWV4cG9ydCBkZWNyeXB0aW9uIGhlbHBlciAqL1xuZXhwb3J0IHsgdXNlckV4cG9ydERlY3J5cHQsIHVzZXJFeHBvcnRLZXlnZW4gfSBmcm9tIFwiLi91c2VyX2V4cG9ydFwiO1xuLyoqIEV4cG9ydCBldGhlcnMuanMgU2lnbmVyICovXG5leHBvcnQgKiBhcyBldGhlcnMgZnJvbSBcIi4vZXRoZXJzXCI7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyBwYWNrYWdlIG5hbWUgKi9cbmV4cG9ydCBjb25zdCBOQU1FOiBzdHJpbmcgPSBuYW1lO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgdmVyc2lvbiAqL1xuZXhwb3J0IGNvbnN0IFZFUlNJT046IHN0cmluZyA9IHZlcnNpb247XG4iXX0=