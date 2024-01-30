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
exports.VERSION = exports.NAME = exports.userExportKeygen = exports.userExportDecrypt = exports.SessionExpiredEvent = exports.GlobalEvents = exports.Events = exports.CubeSigner = void 0;
const env_1 = require("./env");
const api_1 = require("./api");
const client_1 = require("./client");
const org_1 = require("./org");
const signer_session_manager_1 = require("./session/signer_session_manager");
const signer_session_1 = require("./signer_session");
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
     * @param {SignerSessionStorage} storage Session storage to load the session from.
     * @return {Promise<CubeSigner>} New CubeSigner instance
     */
    static async loadManagementSession(storage) {
        return new CubeSigner({
            sessionMgr: await signer_session_manager_1.SignerSessionManager.loadFromStorage(storage),
        });
    }
    /**
     * Loads a signer session from a session storage (e.g., session file).
     * @param {SignerSessionStorage} storage Session storage to load the session from.
     * @return {Promise<SignerSession>} New signer session
     */
    static async loadSignerSession(storage) {
        return await signer_session_1.SignerSession.loadSignerSession(storage);
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
        return this.csc.userFidoRegisterInit.bind(this.csc);
    }
    /**
     * Creates a request to change user's TOTP. This request returns a new TOTP challenge
     * that must be answered by calling `resetTotpComplete`
     */
    get resetTotpStart() {
        return this.csc.userTotpResetInit.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
    }
    /**
     * Answer the TOTP challenge issued by `resetTotpStart`. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.he TOTP configuration from the challenge.
     */
    get resetTotpComplete() {
        return this.csc.userTotpResetComplete.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     */
    get verifyTotp() {
        return this.csc.userTotpVerify.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
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
/** Errors */
__exportStar(require("./error"), exports);
/** API */
__exportStar(require("./api"), exports);
/** Client */
__exportStar(require("./client"), exports);
/** Callbacks */
var events_1 = require("./events");
Object.defineProperty(exports, "Events", { enumerable: true, get: function () { return events_1.Events; } });
Object.defineProperty(exports, "GlobalEvents", { enumerable: true, get: function () { return events_1.GlobalEvents; } });
Object.defineProperty(exports, "SessionExpiredEvent", { enumerable: true, get: function () { return events_1.SessionExpiredEvent; } });
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
/** Signer session manager */
__exportStar(require("./session/signer_session_manager"), exports);
/** Utils */
__exportStar(require("./util"), exports);
/** User-export decryption helper */
var user_export_1 = require("./user_export");
Object.defineProperty(exports, "userExportDecrypt", { enumerable: true, get: function () { return user_export_1.userExportDecrypt; } });
Object.defineProperty(exports, "userExportKeygen", { enumerable: true, get: function () { return user_export_1.userExportKeygen; } });
/** CubeSigner SDK package name */
exports.NAME = package_json_1.name;
/** CubeSigner SDK version */
exports.VERSION = package_json_1.version;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0MsK0JBQTJDO0FBQzNDLHFDQUE0QztBQUM1QywrQkFBNEI7QUFFNUIsNkVBSTBDO0FBRTFDLHFEQUFpRDtBQUVqRCxvREFBa0Q7QUFhbEQ7Ozs7R0FJRztBQUNILE1BQWEsVUFBVTtJQUtyQjs7O09BR0c7SUFDSCxJQUFJLEdBQUc7UUFDTCxJQUFJLENBQUMsdUJBQUEsSUFBSSx1QkFBSyxFQUFFLENBQUM7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDakQsQ0FBQztRQUNELE9BQU8sdUJBQUEsSUFBSSx1QkFBSyxDQUFDO0lBQ25CLENBQUM7SUFFRCx1RUFBdUU7SUFDdkUsSUFBSSxHQUFHO1FBQ0wsT0FBTyx1QkFBQSxJQUFJLHVCQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVELHNCQUFzQjtJQUN0QixJQUFJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxRQUFRLENBQUMsS0FBYTtRQUNwQix1QkFBQSxJQUFJLG1CQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFBLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUE2QjtRQUM5RCxPQUFPLElBQUksVUFBVSxDQUFvQjtZQUN2QyxVQUFVLEVBQUUsTUFBTSw2Q0FBb0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDO1NBQ2hFLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxP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QUUsK0dBQUEsZ0JBQWdCLE9BQUE7QUFFNUMsa0NBQWtDO0FBQ3JCLFFBQUEsSUFBSSxHQUFXLG1CQUFJLENBQUM7QUFFakMsNkJBQTZCO0FBQ2hCLFFBQUEsT0FBTyxHQUFXLHNCQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlbnZzLCBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi9lbnZcIjtcbmltcG9ydCB7IENsaWVudCwgT2lkY0NsaWVudCB9IGZyb20gXCIuL2FwaVwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgT3JnIH0gZnJvbSBcIi4vb3JnXCI7XG5cbmltcG9ydCB7XG4gIFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICBTaWduZXJTZXNzaW9uTWFuYWdlcixcbiAgU2lnbmVyU2Vzc2lvbkRhdGEsXG59IGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lclJlc3BvbnNlIH0gZnJvbSBcIi4vcmVzcG9uc2VcIjtcbmltcG9ydCB7IFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuaW1wb3J0IHsgTWZhUmVjZWlwdCB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHsgbmFtZSwgdmVyc2lvbiB9IGZyb20gXCIuLy4uL3BhY2thZ2UuanNvblwiO1xuaW1wb3J0IHsgSWRlbnRpdHlQcm9vZiwgTWZhUmVxdWVzdEluZm8sIFJhdGNoZXRDb25maWcsIFVzZXJJbmZvIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8qKiBDdWJlU2lnbmVyIGNvbnN0cnVjdG9yIG9wdGlvbnMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3ViZVNpZ25lck9wdGlvbnMge1xuICAvKiogVGhlIGVudmlyb25tZW50IHRvIHVzZSAqL1xuICBlbnY/OiBFbnZJbnRlcmZhY2U7XG4gIC8qKiBUaGUgbWFuYWdlbWVudCBhdXRob3JpemF0aW9uIHRva2VuICovXG4gIHNlc3Npb25NZ3I/OiBTaWduZXJTZXNzaW9uTWFuYWdlcjtcbiAgLyoqIE9wdGlvbmFsIG9yZ2FuaXphdGlvbiBpZCAqL1xuICBvcmdJZD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBDdWJlU2lnbmVyIGNsaWVudFxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgT3JnfSBvciB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXIge1xuICByZWFkb25seSAjZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5IHNlc3Npb25NZ3I/OiBTaWduZXJTZXNzaW9uTWFuYWdlcjtcbiAgI2NzYz86IEN1YmVTaWduZXJDbGllbnQ7XG5cbiAgLyoqXG4gICAqIFVuZGVybHlpbmcge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlLCBpZiBzZXQ7IG90aGVyd2lzZSB0aHJvd3MuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IGNzYygpOiBDdWJlU2lnbmVyQ2xpZW50IHtcbiAgICBpZiAoIXRoaXMuI2NzYykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3ViZVNpZ25lckNsaWVudCBpcyBub3Qgc2V0XCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jY3NjO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge0VudkludGVyZmFjZX0gVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnQgb2YgdGhpcyBjbGllbnQgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLiNlbnY7XG4gIH1cblxuICAvKiogT3JnYW5pemF0aW9uIElEICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2Mub3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBuZXcgb3JnYW5pemF0aW9uIGlkLlxuICAgKi9cbiAgc2V0T3JnSWQob3JnSWQ6IHN0cmluZykge1xuICAgIHRoaXMuI2NzYyA9IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuIGV4aXN0aW5nIG1hbmFnZW1lbnQgc2Vzc2lvbiBhbmQgY3JlYXRlcyBhIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgU2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWQgdGhlIHNlc3Npb24gZnJvbS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyPn0gTmV3IEN1YmVTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkTWFuYWdlbWVudFNlc3Npb24oc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPEN1YmVTaWduZXI+IHtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXIoPEN1YmVTaWduZXJPcHRpb25zPntcbiAgICAgIHNlc3Npb25NZ3I6IGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNpZ25lciBzZXNzaW9uIGZyb20gYSBzZXNzaW9uIHN0b3JhZ2UgKGUuZy4sIHNlc3Npb24gZmlsZSkuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgU2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWQgdGhlIHNlc3Npb24gZnJvbS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb24+IHtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbi5sb2FkU2lnbmVyU2Vzc2lvbihzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyT3B0aW9uc30gb3B0aW9ucyBUaGUgb3B0aW9uYWwgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBDdWJlU2lnbmVyT3B0aW9ucykge1xuICAgIGxldCBlbnYgPSBvcHRpb25zPy5lbnY7XG4gICAgaWYgKG9wdGlvbnM/LnNlc3Npb25NZ3IpIHtcbiAgICAgIHRoaXMuc2Vzc2lvbk1nciA9IG9wdGlvbnMuc2Vzc2lvbk1ncjtcbiAgICAgIGVudiA9IGVudiA/PyB0aGlzLnNlc3Npb25NZ3IuZW52O1xuICAgIH1cbiAgICB0aGlzLiNlbnYgPSBlbnYgPz8gZW52c1tcImdhbW1hXCJdO1xuICAgIHRoaXMuI2NzYyA9IG5ldyBDdWJlU2lnbmVyQ2xpZW50KFxuICAgICAgLy8gSEFDSzogaWdub3JlIHRoYXQgc2Vzc2lvbk1nciBtYXkgYmUgYSBDb2duaXRvU2Vzc2lvbk1hbmFnZXIgYW5kIHByZXRlbmQgdGhhdCBpdFxuICAgICAgLy8gICAgICAgaXMgYSBTaWduZXJTZXNzaW9uTWFuYWdlcjsgdGhhdCdzIGZpbmUgYmVjYXVzZSB0aGUgQ3ViZVNpZ25lckNsaWVudCB3aWxsXG4gICAgICAvLyAgICAgICBhbG1vc3QgYWx3YXlzIGp1c3QgY2FsbCBgYXdhaXQgdG9rZW4oKWAgb24gaXQsIHdoaWNoIHdvcmtzIGluIGJvdGggY2FzZXMuXG4gICAgICAvL1xuICAgICAgLy8gVGhpcyBpcyBkb25lIGhlcmUgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgcmVhc29ucyBvbmx5OyBpbiB0aGUgZnV0dXJlLFxuICAgICAgLy8gd2Ugc2hvdWxkIGRlcHJlY2F0ZSB0aGlzIGNsYXNzIGFuZCBwZW9wbGUgc2hvdWxkIHN0YXJ0IHVzaW5nIGBDdWJlU2luZ2VyQ2xpZW50YCBkaXJlY3RseS5cbiAgICAgIG9wdGlvbnM/LnNlc3Npb25NZ3IgYXMgdW5rbm93biBhcyBTaWduZXJTZXNzaW9uTWFuYWdlcixcbiAgICAgIG9wdGlvbnM/Lm9yZ0lkLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQXV0aGVudGljYXRlIGFuIE9JREMgdXNlciBhbmQgY3JlYXRlIGEgbmV3IHNlc3Npb24gbWFuYWdlciBmb3IgdGhlbS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2U/fSBzdG9yYWdlIE9wdGlvbmFsIHNpZ25lciBzZXNzaW9uIHN0b3JhZ2UgKGRlZmF1bHRzIHRvIGluLW1lbW9yeSBzdG9yYWdlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPn0gVGhlIHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIGFzeW5jIG9pZGNBdXRoKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMub2lkY0xvZ2luKG9pZGNUb2tlbiwgb3JnSWQsIHNjb3BlcywgbGlmZXRpbWVzKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIuY3JlYXRlRnJvbVNlc3Npb25JbmZvKHRoaXMuZW52LCBvcmdJZCwgcmVzcC5kYXRhKCksIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFVzZXJJbmZvPn0gVXNlciBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGFib3V0TWUoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNzYy51c2VyR2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGV4aXN0aW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChvcmdJZDogc3RyaW5nLCBtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5tZmFHZXQobWZhSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm9bXT59IFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFMaXN0KG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkubWZhTGlzdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZyBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFBcHByb3ZlKG9yZ0lkOiBzdHJpbmcsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLm1mYUFwcHJvdmUobWZhSWQpO1xuICB9XG5cbiAgLyoqIEluaXRpYXRlIGFkZGluZyBhIG5ldyBGSURPIGRldmljZS4gTUZBIG1heSBiZSByZXF1aXJlZC4gKi9cbiAgZ2V0IGFkZEZpZG9TdGFydCgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2MudXNlckZpZG9SZWdpc3RlckluaXQuYmluZCh0aGlzLmNzYyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gY2hhbmdlIHVzZXIncyBUT1RQLiBUaGlzIHJlcXVlc3QgcmV0dXJucyBhIG5ldyBUT1RQIGNoYWxsZW5nZVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyBgcmVzZXRUb3RwQ29tcGxldGVgXG4gICAqL1xuICBnZXQgcmVzZXRUb3RwU3RhcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3NjLnVzZXJUb3RwUmVzZXRJbml0LmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIFRPVFAgY2hhbGxlbmdlIGlzc3VlZCBieSBgcmVzZXRUb3RwU3RhcnRgLiBJZiBzdWNjZXNzZnVsLCB1c2VyJ3NcbiAgICogVE9UUCBjb25maWd1cmF0aW9uIHdpbGwgYmUgdXBkYXRlZCB0byB0aGF0IG9mIHRoZSBUT1RQIGNoYWxsZW5nZS5oZSBUT1RQIGNvbmZpZ3VyYXRpb24gZnJvbSB0aGUgY2hhbGxlbmdlLlxuICAgKi9cbiAgZ2V0IHJlc2V0VG90cENvbXBsZXRlKCkge1xuICAgIHJldHVybiB0aGlzLmNzYy51c2VyVG90cFJlc2V0Q29tcGxldGUuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqL1xuICBnZXQgdmVyaWZ5VG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2MudXNlclRvdHBWZXJpZnkuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0IGFuIG9yZ2FuaXphdGlvbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBJRCBvciBuYW1lIG9mIHRoZSBvcmdhbml6YXRpb24uXG4gICAqIEByZXR1cm4ge09yZ30gVGhlIG9yZ2FuaXphdGlvbi5cbiAgICovXG4gIGFzeW5jIGdldE9yZyhvcmdJZD86IHN0cmluZyk6IFByb21pc2U8T3JnPiB7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcy5jc2Muc2Vzc2lvbk1nciwgb3JnSWQgPz8gdGhpcy5jc2Mub3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYSBnaXZlbiBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCAtIE9yZ2FuaXphdGlvbiBpZFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgLSBLZXkgaWRcbiAgICovXG4gIGFzeW5jIGRlbGV0ZUtleShvcmdJZDogc3RyaW5nLCBrZXlJZDogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkua2V5RGVsZXRlKGtleUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1hbmFnZW1lbnQgY2xpZW50LlxuICAgKiBAcmV0dXJuIHtDbGllbnR9IFRoZSBjbGllbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgbWFuYWdlbWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGlmICghdGhpcy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBtYW5hZ2VtZW50IHNlc3Npb24gbG9hZGVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgcHJvdmVJZGVudGl0eShvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLmlkZW50aXR5UHJvdmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SWRlbnRpdHlQcm9vZj59IFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBhc3luYyBvaWRjUHJvdmVJZGVudGl0eShvaWRjVG9rZW46IHN0cmluZywgb3JnSWQ6IHN0cmluZyk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IG9pZGNDbGllbnQgPSBuZXcgT2lkY0NsaWVudCh0aGlzLiNlbnYsIG9yZ0lkLCBvaWRjVG9rZW4pO1xuICAgIHJldHVybiBhd2FpdCBvaWRjQ2xpZW50LmlkZW50aXR5UHJvdmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBnaXZlbiBpZGVudGl0eSBwcm9vZiBpcyB2YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW4uXG4gICAqIEBwYXJhbSB7SWRlbnRpdHlQcm9vZn0gaWRlbnRpdHlQcm9vZiBUaGUgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqL1xuICBhc3luYyB2ZXJpZnlJZGVudGl0eShvcmdJZDogc3RyaW5nLCBpZGVudGl0eVByb29mOiBJZGVudGl0eVByb29mKSB7XG4gICAgYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkuaWRlbnRpdHlWZXJpZnkoaWRlbnRpdHlQcm9vZik7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1JhdGNoZXRDb25maWd9IGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQgKGlkICsgY29uZmlybWF0aW9uIGNvZGUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNpZ25lclNlc3Npb25EYXRhPj59IFRoZSBzZXNzaW9uIGRhdGEuXG4gICAqL1xuICBhc3luYyBvaWRjTG9naW4oXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2lnbmVyU2Vzc2lvbkRhdGE+PiB7XG4gICAgY29uc3Qgb2lkY0NsaWVudCA9IG5ldyBPaWRjQ2xpZW50KHRoaXMuI2Vudiwgb3JnSWQsIG9pZGNUb2tlbik7XG4gICAgcmV0dXJuIGF3YWl0IG9pZGNDbGllbnQuc2Vzc2lvbkNyZWF0ZShzY29wZXMsIGxpZmV0aW1lcywgbWZhUmVjZWlwdCk7XG4gIH1cbn1cblxuLyoqIEVycm9ycyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vZXJyb3JcIjtcbi8qKiBBUEkgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2FwaVwiO1xuLyoqIENsaWVudCAqL1xuZXhwb3J0ICogZnJvbSBcIi4vY2xpZW50XCI7XG4vKiogQ2FsbGJhY2tzICovXG5leHBvcnQgeyBFdmVudHMsIEV2ZW50SGFuZGxlciwgRXJyb3JFdmVudCwgR2xvYmFsRXZlbnRzLCBTZXNzaW9uRXhwaXJlZEV2ZW50IH0gZnJvbSBcIi4vZXZlbnRzXCI7XG4vKiogT3JnYW5pemF0aW9ucyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vb3JnXCI7XG4vKiogS2V5cyAqL1xuZXhwb3J0ICogZnJvbSBcIi4va2V5XCI7XG4vKiogUm9sZXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3JvbGVcIjtcbi8qKiBFbnYgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2VudlwiO1xuLyoqIEZpZG8gKi9cbmV4cG9ydCAqIGZyb20gXCIuL21mYVwiO1xuLyoqIFBhZ2luYXRpb24gKi9cbmV4cG9ydCAqIGZyb20gXCIuL3BhZ2luYXRvclwiO1xuLyoqIFJlc3BvbnNlICovXG5leHBvcnQgKiBmcm9tIFwiLi9yZXNwb25zZVwiO1xuLyoqIFR5cGVzICovXG5leHBvcnQgKiBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbi8qKiBTZXNzaW9ucyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2lnbmVyX3Nlc3Npb25cIjtcbi8qKiBTZXNzaW9uIHN0b3JhZ2UgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlXCI7XG4vKiogU2lnbmVyIHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogVXRpbHMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3V0aWxcIjtcbi8qKiBVc2VyLWV4cG9ydCBkZWNyeXB0aW9uIGhlbHBlciAqL1xuZXhwb3J0IHsgdXNlckV4cG9ydERlY3J5cHQsIHVzZXJFeHBvcnRLZXlnZW4gfSBmcm9tIFwiLi91c2VyX2V4cG9ydFwiO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgcGFja2FnZSBuYW1lICovXG5leHBvcnQgY29uc3QgTkFNRTogc3RyaW5nID0gbmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSB2ZXJzaW9uO1xuIl19