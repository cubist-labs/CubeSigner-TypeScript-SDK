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
var _CubeSigner_env;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethers = exports.CubeSigner = void 0;
const env_1 = require("./env");
const org_1 = require("./org");
const session_storage_1 = require("./session/session_storage");
const signer_session_manager_1 = require("./session/signer_session_manager");
const signer_session_1 = require("./signer_session");
const cognito_manager_1 = require("./session/cognito_manager");
const util_1 = require("./util");
const path = __importStar(require("path"));
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
/** CubeSigner client */
class CubeSigner {
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env() {
        return __classPrivateFieldGet(this, _CubeSigner_env, "f");
    }
    /**
     * Loads an existing management session and creates a CubeSigner instance.
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
        let env = options?.env;
        if (options?.sessionMgr) {
            this.sessionMgr = options.sessionMgr;
            env = env ?? this.sessionMgr.env;
        }
        __classPrivateFieldSet(this, _CubeSigner_env, env ?? env_1.envs["gamma"], "f");
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
    /** Retrieves information about the current user. */
    async aboutMe() {
        const resp = await (await this.management()).get("/v0/about_me", {
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data;
    }
    /**
     * Creates and sets a new TOTP configuration for the logged in user,
     * if and only if no TOTP configuration is already set.
     *
     * @return {Promise<TotpInfo>} Newly created TOTP configuration.
     */
    async initTotp() {
        const resp = await (await this.management()).put("/v0/totp", {
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
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
     * Creates and sets a new TOTP configuration for the logged-in user,
     * overriding the existing one (if any).
     */
    async resetTotp() {
        const resp = await (await this.management()).patch("/v0/totp", {
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     * @param {string} code Current TOTP code
     */
    async verifyTotp(code) {
        const resp = await (await this.management()).get("/v0/totp/verify/{code}", {
            params: { path: { code } },
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
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @return {Promise<OidcProof>} Proof of authentication
     */
    async oidcProve(oidcToken, orgId) {
        const client = (0, openapi_fetch_1.default)({
            baseUrl: this.env.SignerApiRoot,
            headers: {
                Authorization: oidcToken,
            },
        });
        const resp = await client.post("/v0/org/{org_id}/oidc/prove", {
            params: { path: { org_id: orgId } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Checks if a given proof of OIDC authentication is valid.
     *
     * @param {string} orgId The id of the organization that the user is in.
     * @param {OidcProof} oidcProof The proof of authentication.
     */
    async oidcVerify(orgId, oidcProof) {
        const resp = await (await this.management()).post("/v0/org/{org_id}/oidc/verify", {
            params: { path: { org_id: orgId } },
            body: oidcProof,
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
        const h1 = mfaReceipt
            ? signer_session_1.SignResponse.getMfaHeaders(mfaReceipt.mfaId, mfaReceipt.mfaConf)
            : undefined;
        return new signer_session_1.SignResponse(orgId, loginFn, await loginFn(h1));
    }
}
exports.CubeSigner = CubeSigner;
_CubeSigner_env = new WeakMap();
/** Organizations */
__exportStar(require("./org"), exports);
/** Keys */
__exportStar(require("./key"), exports);
/** Roles */
__exportStar(require("./role"), exports);
/** Env */
__exportStar(require("./env"), exports);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFFM0MsK0JBQTRCO0FBQzVCLCtEQUFtRTtBQUVuRSw2RUFBOEY7QUFDOUYscURBQStFO0FBQy9FLCtEQUF5RjtBQUN6RixpQ0FBNkM7QUFDN0MsMkNBQTZCO0FBQzdCLGtFQUF5QztBQW1CekMsd0JBQXdCO0FBQ3hCLE1BQWEsVUFBVTtJQUlyQix1RUFBdUU7SUFDdkUsSUFBSSxHQUFHO1FBQ0wsT0FBTyx1QkFBQSxJQUFJLHVCQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsT0FBK0I7UUFDaEUsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFTLEdBQUUsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sVUFBVSxHQUFHLE1BQU0sdUNBQXFCLENBQUMsZUFBZSxDQUM1RCxPQUFPLElBQUksSUFBSSx3Q0FBc0IsQ0FBQyxlQUFlLENBQUMsQ0FDdkQsQ0FBQztRQUNGLE9BQU8sSUFBSSxVQUFVLENBQW9CO1lBQ3ZDLFVBQVU7U0FDWCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUE4QjtRQUMzRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsZ0JBQVMsR0FBRSxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDdEUsTUFBTSxHQUFHLEdBQUcsT0FBTyxJQUFJLElBQUksd0NBQXNCLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkUsT0FBTyxNQUFNLDhCQUFhLENBQUMsaUJBQWlCLENBQUMs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QUMsQ0FBQztRQUN4QixDQUFDLENBQUM7UUFFRixNQUFNLEVBQUUsR0FBRyxVQUFVO1lBQ25CLENBQUMsQ0FBQyw2QkFBWSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUM7WUFDbEUsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNkLE9BQU8sSUFBSSw2QkFBWSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0Y7QUF2UEQsZ0NBdVBDOztBQVVELG9CQUFvQjtBQUNwQix3Q0FBc0I7QUFDdEIsV0FBVztBQUNYLHdDQUFzQjtBQUN0QixZQUFZO0FBQ1oseUNBQXVCO0FBQ3ZCLFVBQVU7QUFDVix3Q0FBc0I7QUFDdEIsZUFBZTtBQUNmLG1EQUFpQztBQUNqQyxzQkFBc0I7QUFDdEIsNERBQTBDO0FBQzFDLHNCQUFzQjtBQUN0Qiw0REFBMEM7QUFDMUMsaUNBQWlDO0FBQ2pDLDREQUEwQztBQUMxQyw2QkFBNkI7QUFDN0IsbUVBQWlEO0FBQ2pELDhCQUE4QjtBQUM5QixtREFBbUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlbnZzLCBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi9lbnZcIjtcbmltcG9ydCB7IGNvbXBvbmVudHMsIENsaWVudCwgcGF0aHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IE9yZyB9IGZyb20gXCIuL29yZ1wiO1xuaW1wb3J0IHsgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlXCI7XG5cbmltcG9ydCB7IFNpZ25lclNlc3Npb25TdG9yYWdlLCBTaWduZXJTZXNzaW9uTWFuYWdlciB9IGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHsgTWZhUmVxdWVzdEluZm8sIFNpZ25SZXNwb25zZSwgU2lnbmVyU2Vzc2lvbiB9IGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG5pbXBvcnQgeyBDb2duaXRvU2Vzc2lvbk1hbmFnZXIsIENvZ25pdG9TZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyXCI7XG5pbXBvcnQgeyBhc3NlcnRPaywgY29uZmlnRGlyIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGNyZWF0ZUNsaWVudCBmcm9tIFwib3BlbmFwaS1mZXRjaFwiO1xuXG4vKiogQ3ViZVNpZ25lciBjb25zdHJ1Y3RvciBvcHRpb25zICovXG5leHBvcnQgaW50ZXJmYWNlIEN1YmVTaWduZXJPcHRpb25zIHtcbiAgLyoqIFRoZSBlbnZpcm9ubWVudCB0byB1c2UgKi9cbiAgZW52PzogRW52SW50ZXJmYWNlO1xuICAvKiogVGhlIG1hbmFnZW1lbnQgYXV0aG9yaXphdGlvbiB0b2tlbiAqL1xuICBzZXNzaW9uTWdyPzogQ29nbml0b1Nlc3Npb25NYW5hZ2VyIHwgU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG59XG5cbmV4cG9ydCB0eXBlIFVzZXJJbmZvID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJVc2VySW5mb1wiXTtcbmV4cG9ydCB0eXBlIFRvdHBJbmZvID0gY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlRvdHBJbmZvXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBDb25maWd1cmVkTWZhID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJDb25maWd1cmVkTWZhXCJdO1xuZXhwb3J0IHR5cGUgUmF0Y2hldENvbmZpZyA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiUmF0Y2hldENvbmZpZ1wiXTtcbmV4cG9ydCB0eXBlIE9pZGNQcm9vZiA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiT2lkY1Byb29mXCJdO1xuXG50eXBlIE9pZGNBdXRoUmVzcG9uc2UgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH0vb2lkY1wiXVtcInBvc3RcIl1bXCJyZXNwb25zZXNcIl1bXCIyMDBcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcblxuLyoqIEN1YmVTaWduZXIgY2xpZW50ICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lciB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgc2Vzc2lvbk1ncj86IENvZ25pdG9TZXNzaW9uTWFuYWdlciB8IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKiBAcmV0dXJuIHtFbnZJbnRlcmZhY2V9IFRoZSBDdWJlU2lnbmVyIGVudmlyb25tZW50IG9mIHRoaXMgY2xpZW50ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy4jZW52O1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuIGV4aXN0aW5nIG1hbmFnZW1lbnQgc2Vzc2lvbiBhbmQgY3JlYXRlcyBhIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7Q29nbml0b1Nlc3Npb25TdG9yYWdlfSBzdG9yYWdlIE9wdGlvbmFsIHNlc3Npb24gc3RvcmFnZSB0byBsb2FkXG4gICAqIHRoZSBzZXNzaW9uIGZyb20uIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBtYW5hZ2VtZW50IHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyPn0gTmV3IEN1YmVTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkTWFuYWdlbWVudFNlc3Npb24oc3RvcmFnZT86IENvZ25pdG9TZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8Q3ViZVNpZ25lcj4ge1xuICAgIGNvbnN0IGRlZmF1bHRGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdEaXIoKSwgXCJtYW5hZ2VtZW50LXNlc3Npb24uanNvblwiKTtcbiAgICBjb25zdCBzZXNzaW9uTWdyID0gYXdhaXQgQ29nbml0b1Nlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShcbiAgICAgIHN0b3JhZ2UgPz8gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoZGVmYXVsdEZpbGVQYXRoKSxcbiAgICApO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lcig8Q3ViZVNpZ25lck9wdGlvbnM+e1xuICAgICAgc2Vzc2lvbk1ncixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNpZ25lciBzZXNzaW9uIGZyb20gYSBzZXNzaW9uIHN0b3JhZ2UgKGUuZy4sIHNlc3Npb24gZmlsZSkuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWRcbiAgICogdGhlIHNlc3Npb24gZnJvbS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIHNpZ25lciBzZXNzaW9uIGZyb20gdGhlIGNvbmZpZ1xuICAgKiBkaXJlY3Rvcnkgd2lsbCBiZSBsb2FkZWQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRTaWduZXJTZXNzaW9uKHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IGRlZmF1bHRGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdEaXIoKSwgXCJzaWduZXItc2Vzc2lvbi5qc29uXCIpO1xuICAgIGNvbnN0IHNzcyA9IHN0b3JhZ2UgPz8gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoZGVmYXVsdEZpbGVQYXRoKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbi5sb2FkU2lnbmVyU2Vzc2lvbihzc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25hbCBjb25maWd1cmFpdG9uIG9wdGlvbnMgZm9yIHRoZSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IEN1YmVTaWduZXJPcHRpb25zKSB7XG4gICAgbGV0IGVudiA9IG9wdGlvbnM/LmVudjtcbiAgICBpZiAob3B0aW9ucz8uc2Vzc2lvbk1ncikge1xuICAgICAgdGhpcy5zZXNzaW9uTWdyID0gb3B0aW9ucy5zZXNzaW9uTWdyO1xuICAgICAgZW52ID0gZW52ID8/IHRoaXMuc2Vzc2lvbk1nci5lbnY7XG4gICAgfVxuICAgIHRoaXMuI2VudiA9IGVudiA/PyBlbnZzW1wiZ2FtbWFcIl07XG4gIH1cblxuICAvKipcbiAgICogQXV0aGVudGljYXRlIGFuIE9JREMgdXNlciBhbmQgY3JlYXRlIGEgbmV3IHNlc3Npb24gbWFuYWdlciBmb3IgdGhlbS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2U/fSBzdG9yYWdlIE9wdGlvbmFsIHNpZ25lciBzZXNzaW9uIHN0b3JhZ2UgKGRlZmF1bHRzIHRvIGluLW1lbW9yeSBzdG9yYWdlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPn0gVGhlIHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIGFzeW5jIG9pZGNBdXRoKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMub2lkY0xvZ2luKG9pZGNUb2tlbiwgb3JnSWQsIHNjb3BlcywgbGlmZXRpbWVzKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIuY3JlYXRlRnJvbVNlc3Npb25JbmZvKHRoaXMuZW52LCBvcmdJZCwgcmVzcC5kYXRhKCksIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLiAqL1xuICBhc3luYyBhYm91dE1lKCk6IFByb21pc2U8VXNlckluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9hYm91dF9tZVwiLCB7XG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgc2V0cyBhIG5ldyBUT1RQIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBsb2dnZWQgaW4gdXNlcixcbiAgICogaWYgYW5kIG9ubHkgaWYgbm8gVE9UUCBjb25maWd1cmF0aW9uIGlzIGFscmVhZHkgc2V0LlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFRvdHBJbmZvPn0gTmV3bHkgY3JlYXRlZCBUT1RQIGNvbmZpZ3VyYXRpb24uXG4gICAqL1xuICBhc3luYyBpbml0VG90cCgpOiBQcm9taXNlPFRvdHBJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMubWFuYWdlbWVudCgpXG4gICAgKS5wdXQoXCIvdjAvdG90cFwiLCB7XG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGV4aXN0aW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChvcmdJZDogc3RyaW5nLCBtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW5kIHNldHMgYSBuZXcgVE9UUCBjb25maWd1cmF0aW9uIGZvciB0aGUgbG9nZ2VkLWluIHVzZXIsXG4gICAqIG92ZXJyaWRpbmcgdGhlIGV4aXN0aW5nIG9uZSAoaWYgYW55KS5cbiAgICovXG4gIGFzeW5jIHJlc2V0VG90cCgpOiBQcm9taXNlPFRvdHBJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMubWFuYWdlbWVudCgpXG4gICAgKS5wYXRjaChcIi92MC90b3RwXCIsIHtcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyBhIGdpdmVuIFRPVFAgY29kZSBhZ2FpbnN0IHRoZSBjdXJyZW50IHVzZXIncyBUT1RQIGNvbmZpZ3VyYXRpb24uXG4gICAqIFRocm93cyBhbiBlcnJvciBpZiB0aGUgdmVyaWZpY2F0aW9uIGZhaWxzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSBDdXJyZW50IFRPVFAgY29kZVxuICAgKi9cbiAgYXN5bmMgdmVyaWZ5VG90cChjb2RlOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC90b3RwL3ZlcmlmeS97Y29kZX1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgY29kZSB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKiBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnYW5pemF0aW9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIElEIG9yIG5hbWUgb2YgdGhlIG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybiB7T3JnfSBUaGUgb3JnYW5pemF0aW9uLlxuICAgKiAqL1xuICBhc3luYyBnZXRPcmcob3JnSWQ6IHN0cmluZyk6IFByb21pc2U8T3JnPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcywgZGF0YSk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBtYW5hZ2VtZW50IGNsaWVudC5cbiAgICogQHJldHVybiB7Q2xpZW50fSBUaGUgY2xpZW50LlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgYXN5bmMgbWFuYWdlbWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGlmICghdGhpcy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBtYW5hZ2VtZW50IHNlc3Npb24gbG9hZGVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxPaWRjUHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgb2lkY1Byb3ZlKG9pZGNUb2tlbjogc3RyaW5nLCBvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxPaWRjUHJvb2Y+IHtcbiAgICBjb25zdCBjbGllbnQgPSBjcmVhdGVDbGllbnQ8cGF0aHM+KHtcbiAgICAgIGJhc2VVcmw6IHRoaXMuZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IG9pZGNUb2tlbixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9vaWRjL3Byb3ZlXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIHByb29mIG9mIE9JREMgYXV0aGVudGljYXRpb24gaXMgdmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluLlxuICAgKiBAcGFyYW0ge09pZGNQcm9vZn0gb2lkY1Byb29mIFRoZSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICovXG4gIGFzeW5jIG9pZGNWZXJpZnkob3JnSWQ6IHN0cmluZywgb2lkY1Byb29mOiBPaWRjUHJvb2YpIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGMvdmVyaWZ5XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgYm9keTogb2lkY1Byb29mLFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1JhdGNoZXRDb25maWd9IGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQgKGlkICsgY29uZmlybWF0aW9uIGNvZGUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnblJlc3BvbnNlPE9pZGNBdXRoUmVzcG9uc2U+Pn0gVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIGFzeW5jIG9pZGNMb2dpbihcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxPaWRjQXV0aFJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGNyZWF0ZUNsaWVudDxwYXRocz4oe1xuICAgICAgYmFzZVVybDogdGhpcy5lbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogb2lkY1Rva2VuLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBsb2dpbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9vaWRjXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBzY29wZXMsXG4gICAgICAgICAgdG9rZW5zOiBsaWZldGltZXMsXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGgxID0gbWZhUmVjZWlwdFxuICAgICAgPyBTaWduUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0Lm1mYUlkLCBtZmFSZWNlaXB0Lm1mYUNvbmYpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZShvcmdJZCwgbG9naW5GbiwgYXdhaXQgbG9naW5GbihoMSkpO1xuICB9XG59XG5cbi8qKiBNRkEgcmVjZWlwdCAqL1xuZXhwb3J0IGludGVyZmFjZSBNZmFSZWNlaXB0IHtcbiAgLyoqIE1GQSByZXF1ZXN0IElEICovXG4gIG1mYUlkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgbWZhQ29uZjogc3RyaW5nO1xufVxuXG4vKiogT3JnYW5pemF0aW9ucyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vb3JnXCI7XG4vKiogS2V5cyAqL1xuZXhwb3J0ICogZnJvbSBcIi4va2V5XCI7XG4vKiogUm9sZXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3JvbGVcIjtcbi8qKiBFbnYgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2VudlwiO1xuLyoqIFNlc3Npb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuLyoqIFNlc3Npb24gc3RvcmFnZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX3N0b3JhZ2VcIjtcbi8qKiBTZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogTWFuYWdlbWVudCBzZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyXCI7XG4vKiogU2lnbmVyIHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogRXhwb3J0IGV0aGVycy5qcyBTaWduZXIgKi9cbmV4cG9ydCAqIGFzIGV0aGVycyBmcm9tIFwiLi9ldGhlcnNcIjtcbiJdfQ==