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
exports.VERSION = exports.NAME = exports.ethers = exports.userExportKeygen = exports.userExportDecrypt = exports.GlobalEvents = exports.Events = exports.CubeSigner = void 0;
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
/** API */
__exportStar(require("./api"), exports);
/** Client */
__exportStar(require("./client"), exports);
/** Callbacks */
var events_1 = require("./events");
Object.defineProperty(exports, "Events", { enumerable: true, get: function () { return events_1.Events; } });
Object.defineProperty(exports, "GlobalEvents", { enumerable: true, get: function () { return events_1.GlobalEvents; } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0MsK0JBQTJDO0FBQzNDLHFDQUE0QztBQUM1QywrQkFBNEI7QUFDNUIsK0RBQW1FO0FBRW5FLDZFQUkwQztBQUUxQyxxREFBaUQ7QUFDakQsK0RBQXlGO0FBQ3pGLGlDQUFtQztBQUNuQywyQ0FBNkI7QUFFN0Isb0RBQWtEO0FBYWxEOzs7O0dBSUc7QUFDSCxNQUFhLFVBQVU7SUFLckI7OztPQUdHO0lBQ0gsSUFBSSxHQUFHO1FBQ0wsSUFBSSxDQUFDLHVCQUFBLElBQUksdUJBQUssRUFBRSxDQUFDO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFDRCxPQUFPLHVCQUFBLElBQUksdUJBQUssQ0FBQztJQUNuQixDQUFDO0lBRUQsdUVBQXVFO0lBQ3ZFLElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSx1QkFBSyxDQUFDO0lBQ25CLENBQUM7SUFFRCxzQkFBc0I7SUFDdEIsSUFBSSxLQUFLO1FBQ1AsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztJQUN4QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsUUFBUSxDQUFDLEtBQWE7UUFDcEIsdUJBQUEsSUFBSSxtQkFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUErQjtRQUNoRSxPQUFPLElBQUksVUFBVSxDQUFvQjtZQUN2QyxVQUFVLEVBQUUsTUFBTSx1Q0FBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUM7U0FDdkUsQ0FBQyxD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O0FBQ1osaURBQStCO0FBQy9CLGVBQWU7QUFDZixtREFBaUM7QUFDakMsc0JBQXNCO0FBQ3RCLDREQUEwQztBQUMxQyxzQkFBc0I7QUFDdEIsNERBQTBDO0FBQzFDLGlDQUFpQztBQUNqQyw0REFBMEM7QUFDMUMsNkJBQTZCO0FBQzdCLG1FQUFpRDtBQUNqRCxvQ0FBb0M7QUFDcEMsNkNBQW9FO0FBQTNELGdIQUFBLGlCQUFpQixPQUFBO0FBQUUsK0dBQUEsZ0JBQWdCLE9BQUE7QUFDNUMsOEJBQThCO0FBQzlCLG1EQUFtQztBQUVuQyxrQ0FBa0M7QUFDckIsUUFBQSxJQUFJLEdBQVcsbUJBQUksQ0FBQztBQUVqQyw2QkFBNkI7QUFDaEIsUUFBQSxPQUFPLEdBQVcsc0JBQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVudnMsIEVudkludGVyZmFjZSB9IGZyb20gXCIuL2VudlwiO1xuaW1wb3J0IHsgQ2xpZW50LCBPaWRjQ2xpZW50IH0gZnJvbSBcIi4vYXBpXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmdcIjtcbmltcG9ydCB7IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuXG5pbXBvcnQge1xuICBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG4gIFNpZ25lclNlc3Npb25EYXRhLFxufSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJSZXNwb25zZSB9IGZyb20gXCIuL3Jlc3BvbnNlXCI7XG5pbXBvcnQgeyBTaWduZXJTZXNzaW9uIH0gZnJvbSBcIi4vc2lnbmVyX3Nlc3Npb25cIjtcbmltcG9ydCB7IENvZ25pdG9TZXNzaW9uTWFuYWdlciwgQ29nbml0b1Nlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9jb2duaXRvX21hbmFnZXJcIjtcbmltcG9ydCB7IGNvbmZpZ0RpciB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IE1mYVJlY2VpcHQgfSBmcm9tIFwiLi9tZmFcIjtcbmltcG9ydCB7IG5hbWUsIHZlcnNpb24gfSBmcm9tIFwiLi8uLi9wYWNrYWdlLmpzb25cIjtcbmltcG9ydCB7IElkZW50aXR5UHJvb2YsIE1mYVJlcXVlc3RJbmZvLCBSYXRjaGV0Q29uZmlnLCBVc2VySW5mbyB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuXG4vKiogQ3ViZVNpZ25lciBjb25zdHJ1Y3RvciBvcHRpb25zICovXG5leHBvcnQgaW50ZXJmYWNlIEN1YmVTaWduZXJPcHRpb25zIHtcbiAgLyoqIFRoZSBlbnZpcm9ubWVudCB0byB1c2UgKi9cbiAgZW52PzogRW52SW50ZXJmYWNlO1xuICAvKiogVGhlIG1hbmFnZW1lbnQgYXV0aG9yaXphdGlvbiB0b2tlbiAqL1xuICBzZXNzaW9uTWdyPzogQ29nbml0b1Nlc3Npb25NYW5hZ2VyIHwgU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG4gIC8qKiBPcHRpb25hbCBvcmdhbml6YXRpb24gaWQgKi9cbiAgb3JnSWQ/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ3ViZVNpZ25lciBjbGllbnRcbiAqXG4gKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIE9yZ30gb3Ige0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyIHtcbiAgcmVhZG9ubHkgI2VudjogRW52SW50ZXJmYWNlO1xuICByZWFkb25seSBzZXNzaW9uTWdyPzogQ29nbml0b1Nlc3Npb25NYW5hZ2VyIHwgU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG4gICNjc2M/OiBDdWJlU2lnbmVyQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBVbmRlcmx5aW5nIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSwgaWYgc2V0OyBvdGhlcndpc2UgdGhyb3dzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBjc2MoKTogQ3ViZVNpZ25lckNsaWVudCB7XG4gICAgaWYgKCF0aGlzLiNjc2MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1YmVTaWduZXJDbGllbnQgaXMgbm90IHNldFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2NzYztcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtFbnZJbnRlcmZhY2V9IFRoZSBDdWJlU2lnbmVyIGVudmlyb25tZW50IG9mIHRoaXMgY2xpZW50ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy4jZW52O1xuICB9XG5cbiAgLyoqIE9yZ2FuaXphdGlvbiBJRCAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3NjLm9yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgb3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgbmV3IG9yZ2FuaXphdGlvbiBpZC5cbiAgICovXG4gIHNldE9yZ0lkKG9yZ0lkOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNjc2MgPSB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBtYW5hZ2VtZW50IHNlc3Npb24gYW5kIGNyZWF0ZXMgYSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvZ25pdG9TZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBPcHRpb25hbCBzZXNzaW9uIHN0b3JhZ2UgdG8gbG9hZFxuICAgKiB0aGUgc2Vzc2lvbiBmcm9tLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbWFuYWdlbWVudCBzZXNzaW9uIGZyb20gdGhlIGNvbmZpZ1xuICAgKiBkaXJlY3Rvcnkgd2lsbCBiZSBsb2FkZWQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lcj59IE5ldyBDdWJlU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZE1hbmFnZW1lbnRTZXNzaW9uKHN0b3JhZ2U/OiBDb2duaXRvU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPEN1YmVTaWduZXI+IHtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXIoPEN1YmVTaWduZXJPcHRpb25zPntcbiAgICAgIHNlc3Npb25NZ3I6IGF3YWl0IENvZ25pdG9TZXNzaW9uTWFuYWdlci5sb2FkTWFuYWdlbWVudFNlc3Npb24oc3RvcmFnZSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSBzaWduZXIgc2Vzc2lvbiBmcm9tIGEgc2Vzc2lvbiBzdG9yYWdlIChlLmcuLCBzZXNzaW9uIGZpbGUpLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIE9wdGlvbmFsIHNlc3Npb24gc3RvcmFnZSB0byBsb2FkXG4gICAqIHRoZSBzZXNzaW9uIGZyb20uIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBzaWduZXIgc2Vzc2lvbiBmcm9tIHRoZSBjb25maWdcbiAgICogZGlyZWN0b3J5IHdpbGwgYmUgbG9hZGVkLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb24+fSBOZXcgc2lnbmVyIHNlc3Npb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkU2lnbmVyU2Vzc2lvbihzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb24+IHtcbiAgICBjb25zdCBkZWZhdWx0RmlsZVBhdGggPSBwYXRoLmpvaW4oY29uZmlnRGlyKCksIFwic2lnbmVyLXNlc3Npb24uanNvblwiKTtcbiAgICBjb25zdCBzc3MgPSBzdG9yYWdlID8/IG5ldyBKc29uRmlsZVNlc3Npb25TdG9yYWdlKGRlZmF1bHRGaWxlUGF0aCk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb24ubG9hZFNpZ25lclNlc3Npb24oc3NzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyT3B0aW9uc30gb3B0aW9ucyBUaGUgb3B0aW9uYWwgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBDdWJlU2lnbmVyT3B0aW9ucykge1xuICAgIGxldCBlbnYgPSBvcHRpb25zPy5lbnY7XG4gICAgaWYgKG9wdGlvbnM/LnNlc3Npb25NZ3IpIHtcbiAgICAgIHRoaXMuc2Vzc2lvbk1nciA9IG9wdGlvbnMuc2Vzc2lvbk1ncjtcbiAgICAgIGVudiA9IGVudiA/PyB0aGlzLnNlc3Npb25NZ3IuZW52O1xuICAgIH1cbiAgICB0aGlzLiNlbnYgPSBlbnYgPz8gZW52c1tcImdhbW1hXCJdO1xuICAgIHRoaXMuI2NzYyA9IG5ldyBDdWJlU2lnbmVyQ2xpZW50KFxuICAgICAgLy8gSEFDSzogaWdub3JlIHRoYXQgc2Vzc2lvbk1nciBtYXkgYmUgYSBDb2duaXRvU2Vzc2lvbk1hbmFnZXIgYW5kIHByZXRlbmQgdGhhdCBpdFxuICAgICAgLy8gICAgICAgaXMgYSBTaWduZXJTZXNzaW9uTWFuYWdlcjsgdGhhdCdzIGZpbmUgYmVjYXVzZSB0aGUgQ3ViZVNpZ25lckNsaWVudCB3aWxsXG4gICAgICAvLyAgICAgICBhbG1vc3QgYWx3YXlzIGp1c3QgY2FsbCBgYXdhaXQgdG9rZW4oKWAgb24gaXQsIHdoaWNoIHdvcmtzIGluIGJvdGggY2FzZXMuXG4gICAgICAvL1xuICAgICAgLy8gVGhpcyBpcyBkb25lIGhlcmUgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgcmVhc29ucyBvbmx5OyBpbiB0aGUgZnV0dXJlLFxuICAgICAgLy8gd2Ugc2hvdWxkIGRlcHJlY2F0ZSB0aGlzIGNsYXNzIGFuZCBwZW9wbGUgc2hvdWxkIHN0YXJ0IHVzaW5nIGBDdWJlU2luZ2VyQ2xpZW50YCBkaXJlY3RseS5cbiAgICAgIG9wdGlvbnM/LnNlc3Npb25NZ3IgYXMgdW5rbm93biBhcyBTaWduZXJTZXNzaW9uTWFuYWdlcixcbiAgICAgIG9wdGlvbnM/Lm9yZ0lkLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQXV0aGVudGljYXRlIGFuIE9JREMgdXNlciBhbmQgY3JlYXRlIGEgbmV3IHNlc3Npb24gbWFuYWdlciBmb3IgdGhlbS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2U/fSBzdG9yYWdlIE9wdGlvbmFsIHNpZ25lciBzZXNzaW9uIHN0b3JhZ2UgKGRlZmF1bHRzIHRvIGluLW1lbW9yeSBzdG9yYWdlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPn0gVGhlIHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIGFzeW5jIG9pZGNBdXRoKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMub2lkY0xvZ2luKG9pZGNUb2tlbiwgb3JnSWQsIHNjb3BlcywgbGlmZXRpbWVzKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIuY3JlYXRlRnJvbVNlc3Npb25JbmZvKHRoaXMuZW52LCBvcmdJZCwgcmVzcC5kYXRhKCksIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFVzZXJJbmZvPn0gVXNlciBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGFib3V0TWUoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNzYy51c2VyR2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGV4aXN0aW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChvcmdJZDogc3RyaW5nLCBtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5tZmFHZXQobWZhSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm9bXT59IFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFMaXN0KG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkubWZhTGlzdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZyBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFBcHByb3ZlKG9yZ0lkOiBzdHJpbmcsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLm1mYUFwcHJvdmUobWZhSWQpO1xuICB9XG5cbiAgLyoqIEluaXRpYXRlIGFkZGluZyBhIG5ldyBGSURPIGRldmljZS4gTUZBIG1heSBiZSByZXF1aXJlZC4gKi9cbiAgZ2V0IGFkZEZpZG9TdGFydCgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2MudXNlckZpZG9SZWdpc3RlckluaXQuYmluZCh0aGlzLmNzYyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gY2hhbmdlIHVzZXIncyBUT1RQLiBUaGlzIHJlcXVlc3QgcmV0dXJucyBhIG5ldyBUT1RQIGNoYWxsZW5nZVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyBgcmVzZXRUb3RwQ29tcGxldGVgXG4gICAqL1xuICBnZXQgcmVzZXRUb3RwU3RhcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3NjLnVzZXJUb3RwUmVzZXRJbml0LmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIFRPVFAgY2hhbGxlbmdlIGlzc3VlZCBieSBgcmVzZXRUb3RwU3RhcnRgLiBJZiBzdWNjZXNzZnVsLCB1c2VyJ3NcbiAgICogVE9UUCBjb25maWd1cmF0aW9uIHdpbGwgYmUgdXBkYXRlZCB0byB0aGF0IG9mIHRoZSBUT1RQIGNoYWxsZW5nZS5oZSBUT1RQIGNvbmZpZ3VyYXRpb24gZnJvbSB0aGUgY2hhbGxlbmdlLlxuICAgKi9cbiAgZ2V0IHJlc2V0VG90cENvbXBsZXRlKCkge1xuICAgIHJldHVybiB0aGlzLmNzYy51c2VyVG90cFJlc2V0Q29tcGxldGUuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqL1xuICBnZXQgdmVyaWZ5VG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2MudXNlclRvdHBWZXJpZnkuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0IGFuIG9yZ2FuaXphdGlvbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBJRCBvciBuYW1lIG9mIHRoZSBvcmdhbml6YXRpb24uXG4gICAqIEByZXR1cm4ge09yZ30gVGhlIG9yZ2FuaXphdGlvbi5cbiAgICovXG4gIGFzeW5jIGdldE9yZyhvcmdJZD86IHN0cmluZyk6IFByb21pc2U8T3JnPiB7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcy5jc2Muc2Vzc2lvbk1nciwgb3JnSWQgPz8gdGhpcy5jc2Mub3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYSBnaXZlbiBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCAtIE9yZ2FuaXphdGlvbiBpZFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgLSBLZXkgaWRcbiAgICovXG4gIGFzeW5jIGRlbGV0ZUtleShvcmdJZDogc3RyaW5nLCBrZXlJZDogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkua2V5RGVsZXRlKGtleUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1hbmFnZW1lbnQgY2xpZW50LlxuICAgKiBAcmV0dXJuIHtDbGllbnR9IFRoZSBjbGllbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgbWFuYWdlbWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGlmICghdGhpcy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBtYW5hZ2VtZW50IHNlc3Npb24gbG9hZGVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgcHJvdmVJZGVudGl0eShvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLmlkZW50aXR5UHJvdmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SWRlbnRpdHlQcm9vZj59IFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBhc3luYyBvaWRjUHJvdmVJZGVudGl0eShvaWRjVG9rZW46IHN0cmluZywgb3JnSWQ6IHN0cmluZyk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IG9pZGNDbGllbnQgPSBuZXcgT2lkY0NsaWVudCh0aGlzLiNlbnYsIG9yZ0lkLCBvaWRjVG9rZW4pO1xuICAgIHJldHVybiBhd2FpdCBvaWRjQ2xpZW50LmlkZW50aXR5UHJvdmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBnaXZlbiBpZGVudGl0eSBwcm9vZiBpcyB2YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW4uXG4gICAqIEBwYXJhbSB7SWRlbnRpdHlQcm9vZn0gaWRlbnRpdHlQcm9vZiBUaGUgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqL1xuICBhc3luYyB2ZXJpZnlJZGVudGl0eShvcmdJZDogc3RyaW5nLCBpZGVudGl0eVByb29mOiBJZGVudGl0eVByb29mKSB7XG4gICAgYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkuaWRlbnRpdHlWZXJpZnkoaWRlbnRpdHlQcm9vZik7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1JhdGNoZXRDb25maWd9IGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQgKGlkICsgY29uZmlybWF0aW9uIGNvZGUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNpZ25lclNlc3Npb25EYXRhPj59IFRoZSBzZXNzaW9uIGRhdGEuXG4gICAqL1xuICBhc3luYyBvaWRjTG9naW4oXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2lnbmVyU2Vzc2lvbkRhdGE+PiB7XG4gICAgY29uc3Qgb2lkY0NsaWVudCA9IG5ldyBPaWRjQ2xpZW50KHRoaXMuI2Vudiwgb3JnSWQsIG9pZGNUb2tlbik7XG4gICAgcmV0dXJuIGF3YWl0IG9pZGNDbGllbnQuc2Vzc2lvbkNyZWF0ZShzY29wZXMsIGxpZmV0aW1lcywgbWZhUmVjZWlwdCk7XG4gIH1cbn1cblxuLyoqIEFQSSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vYXBpXCI7XG4vKiogQ2xpZW50ICovXG5leHBvcnQgKiBmcm9tIFwiLi9jbGllbnRcIjtcbi8qKiBDYWxsYmFja3MgKi9cbmV4cG9ydCB7IEV2ZW50cywgRXZlbnRIYW5kbGVyLCBFcnJvckV2ZW50LCBHbG9iYWxFdmVudHMsIFNlc3Npb25FeHBpcmVkRXZlbnQgfSBmcm9tIFwiLi9ldmVudHNcIjtcbi8qKiBPcmdhbml6YXRpb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9vcmdcIjtcbi8qKiBLZXlzICovXG5leHBvcnQgKiBmcm9tIFwiLi9rZXlcIjtcbi8qKiBSb2xlcyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcm9sZVwiO1xuLyoqIEVudiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vZW52XCI7XG4vKiogRmlkbyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vbWZhXCI7XG4vKiogUGFnaW5hdGlvbiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcGFnaW5hdG9yXCI7XG4vKiogUmVzcG9uc2UgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Jlc3BvbnNlXCI7XG4vKiogVHlwZXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuLyoqIFNlc3Npb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuLyoqIFNlc3Npb24gc3RvcmFnZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX3N0b3JhZ2VcIjtcbi8qKiBTZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogTWFuYWdlbWVudCBzZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyXCI7XG4vKiogU2lnbmVyIHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogVXNlci1leHBvcnQgZGVjcnlwdGlvbiBoZWxwZXIgKi9cbmV4cG9ydCB7IHVzZXJFeHBvcnREZWNyeXB0LCB1c2VyRXhwb3J0S2V5Z2VuIH0gZnJvbSBcIi4vdXNlcl9leHBvcnRcIjtcbi8qKiBFeHBvcnQgZXRoZXJzLmpzIFNpZ25lciAqL1xuZXhwb3J0ICogYXMgZXRoZXJzIGZyb20gXCIuL2V0aGVyc1wiO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgcGFja2FnZSBuYW1lICovXG5leHBvcnQgY29uc3QgTkFNRTogc3RyaW5nID0gbmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSB2ZXJzaW9uO1xuIl19