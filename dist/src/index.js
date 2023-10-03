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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFFM0MsK0JBQTRCO0FBQzVCLCtEQUFtRTtBQUVuRSw2RUFBOEY7QUFDOUYscURBQStFO0FBQy9FLCtEQUF5RjtBQUN6RixpQ0FBNkM7QUFDN0MsMkNBQTZCO0FBQzdCLGtFQUF5QztBQWtCekMsd0JBQXdCO0FBQ3hCLE1BQWEsVUFBVTtJQUlyQix1RUFBdUU7SUFDdkUsSUFBSSxHQUFHO1FBQ0wsT0FBTyx1QkFBQSxJQUFJLHVCQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsT0FBK0I7UUFDaEUsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFTLEdBQUUsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sVUFBVSxHQUFHLE1BQU0sdUNBQXFCLENBQUMsZUFBZSxDQUM1RCxPQUFPLElBQUksSUFBSSx3Q0FBc0IsQ0FBQyxlQUFlLENBQUMsQ0FDdkQsQ0FBQztRQUNGLE9BQU8sSUFBSSxVQUFVLENBQW9CO1lBQ3ZDLFVBQVU7U0FDWCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUE4QjtRQUMzRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsZ0JBQVMsR0FBRSxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDdEUsTUFBTSxHQUFHLEdBQUcsT0FBTyxJQUFJLElBQUksd0NBQXNCLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkUsT0FBTyxNQUFNLDhCQUFhLENBQUMsaUJBQWlCLENBQUMs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RCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ25DLE9BQU87Z0JBQ1AsSUFBSSxFQUFFO29CQUNKLE1BQU07b0JBQ04sTUFBTSxFQUFFLFNBQVM7aUJBQ2xCO2dCQUNELE9BQU8sRUFBRSxNQUFNO2FBQ2hCLENBQUMsQ0FBQztZQUNILE9BQU8sSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDO1FBRUYsTUFBTSxFQUFFLEdBQUcsVUFBVTtZQUNuQixDQUFDLENBQUMsNkJBQVksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQ2xFLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDZCxPQUFPLElBQUksNkJBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0QsQ0FBQztDQUNGO0FBak5ELGdDQWlOQzs7QUFVRCxvQkFBb0I7QUFDcEIsd0NBQXNCO0FBQ3RCLFdBQVc7QUFDWCx3Q0FBc0I7QUFDdEIsWUFBWTtBQUNaLHlDQUF1QjtBQUN2QixVQUFVO0FBQ1Ysd0NBQXNCO0FBQ3RCLGVBQWU7QUFDZixtREFBaUM7QUFDakMsc0JBQXNCO0FBQ3RCLDREQUEwQztBQUMxQyxzQkFBc0I7QUFDdEIsNERBQTBDO0FBQzFDLGlDQUFpQztBQUNqQyw0REFBMEM7QUFDMUMsNkJBQTZCO0FBQzdCLG1FQUFpRDtBQUNqRCw4QkFBOEI7QUFDOUIsbURBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZW52cywgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4vZW52XCI7XG5pbXBvcnQgeyBjb21wb25lbnRzLCBDbGllbnQsIHBhdGhzIH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmdcIjtcbmltcG9ydCB7IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuXG5pbXBvcnQgeyBTaWduZXJTZXNzaW9uU3RvcmFnZSwgU2lnbmVyU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IE1mYVJlcXVlc3RJbmZvLCBTaWduUmVzcG9uc2UsIFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuaW1wb3J0IHsgQ29nbml0b1Nlc3Npb25NYW5hZ2VyLCBDb2duaXRvU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL2NvZ25pdG9fbWFuYWdlclwiO1xuaW1wb3J0IHsgYXNzZXJ0T2ssIGNvbmZpZ0RpciB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBjcmVhdGVDbGllbnQgZnJvbSBcIm9wZW5hcGktZmV0Y2hcIjtcblxuLyoqIEN1YmVTaWduZXIgY29uc3RydWN0b3Igb3B0aW9ucyAqL1xuZXhwb3J0IGludGVyZmFjZSBDdWJlU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgdG8gdXNlICovXG4gIGVudj86IEVudkludGVyZmFjZTtcbiAgLyoqIFRoZSBtYW5hZ2VtZW50IGF1dGhvcml6YXRpb24gdG9rZW4gKi9cbiAgc2Vzc2lvbk1ncj86IENvZ25pdG9TZXNzaW9uTWFuYWdlciB8IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xufVxuXG5leHBvcnQgdHlwZSBVc2VySW5mbyA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiVXNlckluZm9cIl07XG5leHBvcnQgdHlwZSBUb3RwSW5mbyA9IGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJUb3RwSW5mb1wiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQ29uZmlndXJlZE1mYSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiQ29uZmlndXJlZE1mYVwiXTtcbmV4cG9ydCB0eXBlIFJhdGNoZXRDb25maWcgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlJhdGNoZXRDb25maWdcIl07XG5cbnR5cGUgT2lkY0F1dGhSZXNwb25zZSA9XG4gIHBhdGhzW1wiL3YwL29yZy97b3JnX2lkfS9vaWRjXCJdW1wicG9zdFwiXVtcInJlc3BvbnNlc1wiXVtcIjIwMFwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuXG4vKiogQ3ViZVNpZ25lciBjbGllbnQgKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyIHtcbiAgcmVhZG9ubHkgI2VudjogRW52SW50ZXJmYWNlO1xuICByZWFkb25seSBzZXNzaW9uTWdyPzogQ29nbml0b1Nlc3Npb25NYW5hZ2VyIHwgU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG5cbiAgLyoqIEByZXR1cm4ge0VudkludGVyZmFjZX0gVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnQgb2YgdGhpcyBjbGllbnQgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLiNlbnY7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3RpbmcgbWFuYWdlbWVudCBzZXNzaW9uIGFuZCBjcmVhdGVzIGEgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtDb2duaXRvU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWRcbiAgICogdGhlIHNlc3Npb24gZnJvbS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIG1hbmFnZW1lbnQgc2Vzc2lvbiBmcm9tIHRoZSBjb25maWdcbiAgICogZGlyZWN0b3J5IHdpbGwgYmUgbG9hZGVkLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXI+fSBOZXcgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRNYW5hZ2VtZW50U2Vzc2lvbihzdG9yYWdlPzogQ29nbml0b1Nlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxDdWJlU2lnbmVyPiB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcIm1hbmFnZW1lbnQtc2Vzc2lvbi5qc29uXCIpO1xuICAgIGNvbnN0IHNlc3Npb25NZ3IgPSBhd2FpdCBDb2duaXRvU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKFxuICAgICAgc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyKDxDdWJlU2lnbmVyT3B0aW9ucz57XG4gICAgICBzZXNzaW9uTWdyLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2lnbmVyIHNlc3Npb24gZnJvbSBhIHNlc3Npb24gc3RvcmFnZSAoZS5nLiwgc2Vzc2lvbiBmaWxlKS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBPcHRpb25hbCBzZXNzaW9uIHN0b3JhZ2UgdG8gbG9hZFxuICAgKiB0aGUgc2Vzc2lvbiBmcm9tLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgc2lnbmVyIHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uPiB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcInNpZ25lci1zZXNzaW9uLmpzb25cIik7XG4gICAgY29uc3Qgc3NzID0gc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uLmxvYWRTaWduZXJTZXNzaW9uKHNzcyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbmFsIGNvbmZpZ3VyYWl0b24gb3B0aW9ucyBmb3IgdGhlIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogQ3ViZVNpZ25lck9wdGlvbnMpIHtcbiAgICBsZXQgZW52ID0gb3B0aW9ucz8uZW52O1xuICAgIGlmIChvcHRpb25zPy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aGlzLnNlc3Npb25NZ3IgPSBvcHRpb25zLnNlc3Npb25NZ3I7XG4gICAgICBlbnYgPSBlbnYgPz8gdGhpcy5zZXNzaW9uTWdyLmVudjtcbiAgICB9XG4gICAgdGhpcy4jZW52ID0gZW52ID8/IGVudnNbXCJnYW1tYVwiXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRoZW50aWNhdGUgYW4gT0lEQyB1c2VyIGFuZCBjcmVhdGUgYSBuZXcgc2Vzc2lvbiBtYW5hZ2VyIGZvciB0aGVtLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEBwYXJhbSB7TGlzdDxzdHJpbmc+fSBzY29wZXMgVGhlIHNjb3BlcyBvZiB0aGUgcmVzdWx0aW5nIHNlc3Npb25cbiAgICogQHBhcmFtIHtSYXRjaGV0Q29uZmlnfSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZT99IHN0b3JhZ2UgT3B0aW9uYWwgc2lnbmVyIHNlc3Npb24gc3RvcmFnZSAoZGVmYXVsdHMgdG8gaW4tbWVtb3J5IHN0b3JhZ2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBUaGUgc2lnbmVyIHNlc3Npb24gbWFuYWdlclxuICAgKi9cbiAgYXN5bmMgb2lkY0F1dGgoXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5vaWRjTG9naW4ob2lkY1Rva2VuLCBvcmdJZCwgc2NvcGVzLCBsaWZldGltZXMpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5jcmVhdGVGcm9tU2Vzc2lvbkluZm8odGhpcy5lbnYsIG9yZ0lkLCByZXNwLmRhdGEoKSwgc3RvcmFnZSk7XG4gIH1cblxuICAvKiogUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuICovXG4gIGFzeW5jIGFib3V0TWUoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL2Fib3V0X21lXCIsIHtcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBzZXRzIGEgbmV3IFRPVFAgY29uZmlndXJhdGlvbiBmb3IgdGhlIGxvZ2dlZCBpbiB1c2VyLFxuICAgKiBpZiBhbmQgb25seSBpZiBubyBUT1RQIGNvbmZpZ3VyYXRpb24gaXMgYWxyZWFkeSBzZXQuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VG90cEluZm8+fSBOZXdseSBjcmVhdGVkIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICovXG4gIGFzeW5jIGluaXRUb3RwKCk6IFByb21pc2U8VG90cEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnB1dChcIi92MC90b3RwXCIsIHtcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgZXhpc3RpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBNRkEgcmVxdWVzdCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgbWZhR2V0KG9yZ0lkOiBzdHJpbmcsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgc2V0cyBhIG5ldyBUT1RQIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBsb2dnZWQtaW4gdXNlcixcbiAgICogb3ZlcnJpZGluZyB0aGUgZXhpc3Rpbmcgb25lIChpZiBhbnkpLlxuICAgKi9cbiAgYXN5bmMgcmVzZXRUb3RwKCk6IFByb21pc2U8VG90cEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL3RvdHBcIiwge1xuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIEN1cnJlbnQgVE9UUCBjb2RlXG4gICAqL1xuICBhc3luYyB2ZXJpZnlUb3RwKGNvZGU6IHN0cmluZykge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL3RvdHAvdmVyaWZ5L3tjb2RlfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBjb2RlIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmdhbml6YXRpb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgSUQgb3IgbmFtZSBvZiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKiBAcmV0dXJuIHtPcmd9IFRoZSBvcmdhbml6YXRpb24uXG4gICAqICovXG4gIGFzeW5jIGdldE9yZyhvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxPcmc+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLCBkYXRhKTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIG1hbmFnZW1lbnQgY2xpZW50LlxuICAgKiBAcmV0dXJuIHtDbGllbnR9IFRoZSBjbGllbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBhc3luYyBtYW5hZ2VtZW50KCk6IFByb21pc2U8Q2xpZW50PiB7XG4gICAgaWYgKCF0aGlzLnNlc3Npb25NZ3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG1hbmFnZW1lbnQgc2Vzc2lvbiBsb2FkZWRcIik7XG4gICAgfVxuICAgIHJldHVybiBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1JhdGNoZXRDb25maWd9IGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQgKGlkICsgY29uZmlybWF0aW9uIGNvZGUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnblJlc3BvbnNlPE9pZGNBdXRoUmVzcG9uc2U+Pn0gVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIGFzeW5jIG9pZGNMb2dpbihcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxPaWRjQXV0aFJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGNyZWF0ZUNsaWVudDxwYXRocz4oe1xuICAgICAgYmFzZVVybDogdGhpcy5lbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogb2lkY1Rva2VuLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBsb2dpbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9vaWRjXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBzY29wZXMsXG4gICAgICAgICAgdG9rZW5zOiBsaWZldGltZXMsXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGgxID0gbWZhUmVjZWlwdFxuICAgICAgPyBTaWduUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0Lm1mYUlkLCBtZmFSZWNlaXB0Lm1mYUNvbmYpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZShvcmdJZCwgbG9naW5GbiwgYXdhaXQgbG9naW5GbihoMSkpO1xuICB9XG59XG5cbi8qKiBNRkEgcmVjZWlwdCAqL1xuZXhwb3J0IGludGVyZmFjZSBNZmFSZWNlaXB0IHtcbiAgLyoqIE1GQSByZXF1ZXN0IElEICovXG4gIG1mYUlkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgbWZhQ29uZjogc3RyaW5nO1xufVxuXG4vKiogT3JnYW5pemF0aW9ucyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vb3JnXCI7XG4vKiogS2V5cyAqL1xuZXhwb3J0ICogZnJvbSBcIi4va2V5XCI7XG4vKiogUm9sZXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3JvbGVcIjtcbi8qKiBFbnYgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2VudlwiO1xuLyoqIFNlc3Npb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuLyoqIFNlc3Npb24gc3RvcmFnZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX3N0b3JhZ2VcIjtcbi8qKiBTZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogTWFuYWdlbWVudCBzZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyXCI7XG4vKiogU2lnbmVyIHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogRXhwb3J0IGV0aGVycy5qcyBTaWduZXIgKi9cbmV4cG9ydCAqIGFzIGV0aGVycyBmcm9tIFwiLi9ldGhlcnNcIjtcbiJdfQ==