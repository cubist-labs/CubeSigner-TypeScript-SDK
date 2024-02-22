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
/** Ethers.js helpers */
__exportStar(require("./evm"), exports);
/** CubeSigner SDK package name */
exports.NAME = package_json_1.name;
/** CubeSigner SDK version */
exports.VERSION = package_json_1.version;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0MsK0JBQTJDO0FBQzNDLHFDQUE0QztBQUM1QywrQkFBNEI7QUFFNUIsNkVBSTBDO0FBRTFDLHFEQUFpRDtBQUVqRCxvREFBa0Q7QUFhbEQ7Ozs7R0FJRztBQUNILE1BQWEsVUFBVTtJQUtyQjs7O09BR0c7SUFDSCxJQUFJLEdBQUc7UUFDTCxJQUFJLENBQUMsdUJBQUEsSUFBSSx1QkFBSyxFQUFFLENBQUM7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDakQsQ0FBQztRQUNELE9BQU8sdUJBQUEsSUFBSSx1QkFBSyxDQUFDO0lBQ25CLENBQUM7SUFFRCx1RUFBdUU7SUFDdkUsSUFBSSxHQUFHO1FBQ0wsT0FBTyx1QkFBQSxJQUFJLHVCQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVELHNCQUFzQjtJQUN0QixJQUFJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxRQUFRLENBQUMsS0FBYTtRQUNwQix1QkFBQSxJQUFJLG1CQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFBLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUE2QjtRQUM5RCxPQUFPLElBQUksVUFBVSxDQUFvQjtZQUN2QyxVQUFVLEVBQUUsTUFBTSw2Q0FBb0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDO1NBQ2hFLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxP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QUUsK0dBQUEsZ0JBQWdCLE9BQUE7QUFDNUMsd0JBQXdCO0FBQ3hCLHdDQUFzQjtBQUV0QixrQ0FBa0M7QUFDckIsUUFBQSxJQUFJLEdBQVcsbUJBQUksQ0FBQztBQUVqQyw2QkFBNkI7QUFDaEIsUUFBQSxPQUFPLEdBQVcsc0JBQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVudnMsIEVudkludGVyZmFjZSB9IGZyb20gXCIuL2VudlwiO1xuaW1wb3J0IHsgQ2xpZW50LCBPaWRjQ2xpZW50IH0gZnJvbSBcIi4vYXBpXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmdcIjtcblxuaW1wb3J0IHtcbiAgU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gIFNpZ25lclNlc3Npb25NYW5hZ2VyLFxuICBTaWduZXJTZXNzaW9uRGF0YSxcbn0gZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyUmVzcG9uc2UgfSBmcm9tIFwiLi9yZXNwb25zZVwiO1xuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvbiB9IGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG5pbXBvcnQgeyBNZmFSZWNlaXB0IH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgeyBuYW1lLCB2ZXJzaW9uIH0gZnJvbSBcIi4vLi4vcGFja2FnZS5qc29uXCI7XG5pbXBvcnQgeyBJZGVudGl0eVByb29mLCBNZmFSZXF1ZXN0SW5mbywgUmF0Y2hldENvbmZpZywgVXNlckluZm8gfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcblxuLyoqIEN1YmVTaWduZXIgY29uc3RydWN0b3Igb3B0aW9ucyAqL1xuZXhwb3J0IGludGVyZmFjZSBDdWJlU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgdG8gdXNlICovXG4gIGVudj86IEVudkludGVyZmFjZTtcbiAgLyoqIFRoZSBtYW5hZ2VtZW50IGF1dGhvcml6YXRpb24gdG9rZW4gKi9cbiAgc2Vzc2lvbk1ncj86IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuICAvKiogT3B0aW9uYWwgb3JnYW5pemF0aW9uIGlkICovXG4gIG9yZ0lkPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIEN1YmVTaWduZXIgY2xpZW50XG4gKlxuICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBPcmd9IG9yIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0ZWFkLlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lciB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgc2Vzc2lvbk1ncj86IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuICAjY3NjPzogQ3ViZVNpZ25lckNsaWVudDtcblxuICAvKipcbiAgICogVW5kZXJseWluZyB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGFuY2UsIGlmIHNldDsgb3RoZXJ3aXNlIHRocm93cy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgY3NjKCk6IEN1YmVTaWduZXJDbGllbnQge1xuICAgIGlmICghdGhpcy4jY3NjKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDdWJlU2lnbmVyQ2xpZW50IGlzIG5vdCBzZXRcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNjc2M7XG4gIH1cblxuICAvKiogQHJldHVybiB7RW52SW50ZXJmYWNlfSBUaGUgQ3ViZVNpZ25lciBlbnZpcm9ubWVudCBvZiB0aGlzIGNsaWVudCAqL1xuICBnZXQgZW52KCk6IEVudkludGVyZmFjZSB7XG4gICAgcmV0dXJuIHRoaXMuI2VudjtcbiAgfVxuXG4gIC8qKiBPcmdhbml6YXRpb24gSUQgKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLmNzYy5vcmdJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIG9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG5ldyBvcmdhbml6YXRpb24gaWQuXG4gICAqL1xuICBzZXRPcmdJZChvcmdJZDogc3RyaW5nKSB7XG4gICAgdGhpcy4jY3NjID0gdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3RpbmcgbWFuYWdlbWVudCBzZXNzaW9uIGFuZCBjcmVhdGVzIGEgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBTZXNzaW9uIHN0b3JhZ2UgdG8gbG9hZCB0aGUgc2Vzc2lvbiBmcm9tLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXI+fSBOZXcgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRNYW5hZ2VtZW50U2Vzc2lvbihzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8Q3ViZVNpZ25lcj4ge1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lcig8Q3ViZVNpZ25lck9wdGlvbnM+e1xuICAgICAgc2Vzc2lvbk1ncjogYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2lnbmVyIHNlc3Npb24gZnJvbSBhIHNlc3Npb24gc3RvcmFnZSAoZS5nLiwgc2Vzc2lvbiBmaWxlKS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBTZXNzaW9uIHN0b3JhZ2UgdG8gbG9hZCB0aGUgc2Vzc2lvbiBmcm9tLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb24+fSBOZXcgc2lnbmVyIHNlc3Npb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkU2lnbmVyU2Vzc2lvbihzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uLmxvYWRTaWduZXJTZXNzaW9uKHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25hbCBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IEN1YmVTaWduZXJPcHRpb25zKSB7XG4gICAgbGV0IGVudiA9IG9wdGlvbnM/LmVudjtcbiAgICBpZiAob3B0aW9ucz8uc2Vzc2lvbk1ncikge1xuICAgICAgdGhpcy5zZXNzaW9uTWdyID0gb3B0aW9ucy5zZXNzaW9uTWdyO1xuICAgICAgZW52ID0gZW52ID8/IHRoaXMuc2Vzc2lvbk1nci5lbnY7XG4gICAgfVxuICAgIHRoaXMuI2VudiA9IGVudiA/PyBlbnZzW1wiZ2FtbWFcIl07XG4gICAgdGhpcy4jY3NjID0gbmV3IEN1YmVTaWduZXJDbGllbnQoXG4gICAgICAvLyBIQUNLOiBpZ25vcmUgdGhhdCBzZXNzaW9uTWdyIG1heSBiZSBhIENvZ25pdG9TZXNzaW9uTWFuYWdlciBhbmQgcHJldGVuZCB0aGF0IGl0XG4gICAgICAvLyAgICAgICBpcyBhIFNpZ25lclNlc3Npb25NYW5hZ2VyOyB0aGF0J3MgZmluZSBiZWNhdXNlIHRoZSBDdWJlU2lnbmVyQ2xpZW50IHdpbGxcbiAgICAgIC8vICAgICAgIGFsbW9zdCBhbHdheXMganVzdCBjYWxsIGBhd2FpdCB0b2tlbigpYCBvbiBpdCwgd2hpY2ggd29ya3MgaW4gYm90aCBjYXNlcy5cbiAgICAgIC8vXG4gICAgICAvLyBUaGlzIGlzIGRvbmUgaGVyZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSByZWFzb25zIG9ubHk7IGluIHRoZSBmdXR1cmUsXG4gICAgICAvLyB3ZSBzaG91bGQgZGVwcmVjYXRlIHRoaXMgY2xhc3MgYW5kIHBlb3BsZSBzaG91bGQgc3RhcnQgdXNpbmcgYEN1YmVTaW5nZXJDbGllbnRgIGRpcmVjdGx5LlxuICAgICAgb3B0aW9ucz8uc2Vzc2lvbk1nciBhcyB1bmtub3duIGFzIFNpZ25lclNlc3Npb25NYW5hZ2VyLFxuICAgICAgb3B0aW9ucz8ub3JnSWQsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRoZW50aWNhdGUgYW4gT0lEQyB1c2VyIGFuZCBjcmVhdGUgYSBuZXcgc2Vzc2lvbiBtYW5hZ2VyIGZvciB0aGVtLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEBwYXJhbSB7TGlzdDxzdHJpbmc+fSBzY29wZXMgVGhlIHNjb3BlcyBvZiB0aGUgcmVzdWx0aW5nIHNlc3Npb25cbiAgICogQHBhcmFtIHtSYXRjaGV0Q29uZmlnfSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZT99IHN0b3JhZ2UgT3B0aW9uYWwgc2lnbmVyIHNlc3Npb24gc3RvcmFnZSAoZGVmYXVsdHMgdG8gaW4tbWVtb3J5IHN0b3JhZ2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBUaGUgc2lnbmVyIHNlc3Npb24gbWFuYWdlclxuICAgKi9cbiAgYXN5bmMgb2lkY0F1dGgoXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5vaWRjTG9naW4ob2lkY1Rva2VuLCBvcmdJZCwgc2NvcGVzLCBsaWZldGltZXMpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5jcmVhdGVGcm9tU2Vzc2lvbkluZm8odGhpcy5lbnYsIG9yZ0lkLCByZXNwLmRhdGEoKSwgc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckluZm8+fSBVc2VyIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgYWJvdXRNZSgpOiBQcm9taXNlPFVzZXJJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLnVzZXJHZXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgZXhpc3RpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBNRkEgcmVxdWVzdCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgbWZhR2V0KG9yZ0lkOiBzdHJpbmcsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLm1mYUdldChtZmFJZCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mb1tdPn0gVGhlIE1GQSByZXF1ZXN0cy5cbiAgICovXG4gIGFzeW5jIG1mYUxpc3Qob3JnSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm9bXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5tZmFMaXN0KCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYUFwcHJvdmUob3JnSWQ6IHN0cmluZywgbWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkubWZhQXBwcm92ZShtZmFJZCk7XG4gIH1cblxuICAvKiogSW5pdGlhdGUgYWRkaW5nIGEgbmV3IEZJRE8gZGV2aWNlLiBNRkEgbWF5IGJlIHJlcXVpcmVkLiAqL1xuICBnZXQgYWRkRmlkb1N0YXJ0KCkge1xuICAgIHJldHVybiB0aGlzLmNzYy51c2VyRmlkb1JlZ2lzdGVySW5pdC5iaW5kKHRoaXMuY3NjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdXNlcidzIFRPVFAuIFRoaXMgcmVxdWVzdCByZXR1cm5zIGEgbmV3IFRPVFAgY2hhbGxlbmdlXG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIGByZXNldFRvdHBDb21wbGV0ZWBcbiAgICovXG4gIGdldCByZXNldFRvdHBTdGFydCgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2MudXNlclRvdHBSZXNldEluaXQuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgVE9UUCBjaGFsbGVuZ2UgaXNzdWVkIGJ5IGByZXNldFRvdHBTdGFydGAuIElmIHN1Y2Nlc3NmdWwsIHVzZXInc1xuICAgKiBUT1RQIGNvbmZpZ3VyYXRpb24gd2lsbCBiZSB1cGRhdGVkIHRvIHRoYXQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlLmhlIFRPVFAgY29uZmlndXJhdGlvbiBmcm9tIHRoZSBjaGFsbGVuZ2UuXG4gICAqL1xuICBnZXQgcmVzZXRUb3RwQ29tcGxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3NjLnVzZXJUb3RwUmVzZXRDb21wbGV0ZS5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICovXG4gIGdldCB2ZXJpZnlUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLmNzYy51c2VyVG90cFZlcmlmeS5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnYW5pemF0aW9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIElEIG9yIG5hbWUgb2YgdGhlIG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybiB7T3JnfSBUaGUgb3JnYW5pemF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZ2V0T3JnKG9yZ0lkPzogc3RyaW5nKTogUHJvbWlzZTxPcmc+IHtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLmNzYy5zZXNzaW9uTWdyLCBvcmdJZCA/PyB0aGlzLmNzYy5vcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhIGdpdmVuIGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIC0gT3JnYW5pemF0aW9uIGlkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCAtIEtleSBpZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlS2V5KG9yZ0lkOiBzdHJpbmcsIGtleUlkOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5rZXlEZWxldGUoa2V5SWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWFuYWdlbWVudCBjbGllbnQuXG4gICAqIEByZXR1cm4ge0NsaWVudH0gVGhlIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBtYW5hZ2VtZW50KCk6IFByb21pc2U8Q2xpZW50PiB7XG4gICAgaWYgKCF0aGlzLnNlc3Npb25NZ3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG1hbmFnZW1lbnQgc2Vzc2lvbiBsb2FkZWRcIik7XG4gICAgfVxuICAgIHJldHVybiBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SWRlbnRpdHlQcm9vZj59IFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBhc3luYyBwcm92ZUlkZW50aXR5KG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkuaWRlbnRpdHlQcm92ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxJZGVudGl0eVByb29mPn0gUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIGFzeW5jIG9pZGNQcm92ZUlkZW50aXR5KG9pZGNUb2tlbjogc3RyaW5nLCBvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3Qgb2lkY0NsaWVudCA9IG5ldyBPaWRjQ2xpZW50KHRoaXMuI2Vudiwgb3JnSWQsIG9pZGNUb2tlbik7XG4gICAgcmV0dXJuIGF3YWl0IG9pZGNDbGllbnQuaWRlbnRpdHlQcm92ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGlkZW50aXR5IHByb29mIGlzIHZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpbi5cbiAgICogQHBhcmFtIHtJZGVudGl0eVByb29mfSBpZGVudGl0eVByb29mIFRoZSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICovXG4gIGFzeW5jIHZlcmlmeUlkZW50aXR5KG9yZ0lkOiBzdHJpbmcsIGlkZW50aXR5UHJvb2Y6IElkZW50aXR5UHJvb2YpIHtcbiAgICBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5pZGVudGl0eVZlcmlmeShpZGVudGl0eVByb29mKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCAoaWQgKyBjb25maXJtYXRpb24gY29kZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2lnbmVyU2Vzc2lvbkRhdGE+Pn0gVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIGFzeW5jIG9pZGNMb2dpbihcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTaWduZXJTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvaWRjQ2xpZW50ID0gbmV3IE9pZGNDbGllbnQodGhpcy4jZW52LCBvcmdJZCwgb2lkY1Rva2VuKTtcbiAgICByZXR1cm4gYXdhaXQgb2lkY0NsaWVudC5zZXNzaW9uQ3JlYXRlKHNjb3BlcywgbGlmZXRpbWVzLCBtZmFSZWNlaXB0KTtcbiAgfVxufVxuXG4vKiogRXJyb3JzICovXG5leHBvcnQgKiBmcm9tIFwiLi9lcnJvclwiO1xuLyoqIEFQSSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vYXBpXCI7XG4vKiogQ2xpZW50ICovXG5leHBvcnQgKiBmcm9tIFwiLi9jbGllbnRcIjtcbi8qKiBDYWxsYmFja3MgKi9cbmV4cG9ydCB7IEV2ZW50cywgRXZlbnRIYW5kbGVyLCBFcnJvckV2ZW50LCBHbG9iYWxFdmVudHMsIFNlc3Npb25FeHBpcmVkRXZlbnQgfSBmcm9tIFwiLi9ldmVudHNcIjtcbi8qKiBPcmdhbml6YXRpb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9vcmdcIjtcbi8qKiBLZXlzICovXG5leHBvcnQgKiBmcm9tIFwiLi9rZXlcIjtcbi8qKiBSb2xlcyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcm9sZVwiO1xuLyoqIEVudiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vZW52XCI7XG4vKiogRmlkbyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vbWZhXCI7XG4vKiogUGFnaW5hdGlvbiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcGFnaW5hdG9yXCI7XG4vKiogUmVzcG9uc2UgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Jlc3BvbnNlXCI7XG4vKiogVHlwZXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuLyoqIFNlc3Npb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuLyoqIFNlc3Npb24gc3RvcmFnZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX3N0b3JhZ2VcIjtcbi8qKiBTaWduZXIgc2Vzc2lvbiBtYW5hZ2VyICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBVdGlscyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vdXRpbFwiO1xuLyoqIFVzZXItZXhwb3J0IGRlY3J5cHRpb24gaGVscGVyICovXG5leHBvcnQgeyB1c2VyRXhwb3J0RGVjcnlwdCwgdXNlckV4cG9ydEtleWdlbiB9IGZyb20gXCIuL3VzZXJfZXhwb3J0XCI7XG4vKiogRXRoZXJzLmpzIGhlbHBlcnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2V2bVwiO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgcGFja2FnZSBuYW1lICovXG5leHBvcnQgY29uc3QgTkFNRTogc3RyaW5nID0gbmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSB2ZXJzaW9uO1xuIl19