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
     * @param {SignerSessionStorage?} storage Optional signer session storage (defaults to in-memory storage)
     * @return {Promise<SignerSessionManager>} The signer session manager
     */
    async oidcAuth(oidcToken, orgId, scopes, storage) {
        const resp = await this.oidcLogin(oidcToken, orgId, scopes);
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
     * @param {unknown} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<SignerSessionData>} The session data.
     */
    async oidcLogin(oidcToken, orgId, scopes, mfaReceipt) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFFM0MsK0JBQTRCO0FBQzVCLCtEQUFtRTtBQUVuRSw2RUFBOEY7QUFDOUYscURBQStFO0FBQy9FLCtEQUF5RjtBQUN6RixpQ0FBNkM7QUFDN0MsMkNBQTZCO0FBQzdCLGtFQUF5QztBQWlCekMsd0JBQXdCO0FBQ3hCLE1BQWEsVUFBVTtJQUlyQix1RUFBdUU7SUFDdkUsSUFBSSxHQUFHO1FBQ0wsT0FBTyx1QkFBQSxJQUFJLHVCQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsT0FBK0I7UUFDaEUsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFTLEdBQUUsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sVUFBVSxHQUFHLE1BQU0sdUNBQXFCLENBQUMsZUFBZSxDQUM1RCxPQUFPLElBQUksSUFBSSx3Q0FBc0IsQ0FBQyxlQUFlLENBQUMsQ0FDdkQsQ0FBQztRQUNGLE9BQU8sSUFBSSxVQUFVLENBQW9CO1lBQ3ZDLFVBQVU7U0FDWCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUE4QjtRQUMzRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsZ0JBQVMsR0FBRSxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDdEUsTUFBTSxHQUFHLEdBQUcsT0FBTyxJQUFJLElBQUksd0NBQXNCLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkUsT0FBTyxNQUFNLDhCQUFhLENBQUMsaUJBQWlCLENBQUMs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LEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ25DLE9BQU87Z0JBQ1AsSUFBSSxFQUFFO29CQUNKLE1BQU07aUJBQ1A7Z0JBQ0QsT0FBTyxFQUFFLE1BQU07YUFDaEIsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUM7UUFFRixNQUFNLEVBQUUsR0FBRyxVQUFVO1lBQ25CLENBQUMsQ0FBQyw2QkFBWSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUM7WUFDbEUsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNkLE9BQU8sSUFBSSw2QkFBWSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0Y7QUE1TUQsZ0NBNE1DOztBQUVELG9CQUFvQjtBQUNwQix3Q0FBc0I7QUFDdEIsV0FBVztBQUNYLHdDQUFzQjtBQUN0QixZQUFZO0FBQ1oseUNBQXVCO0FBQ3ZCLFVBQVU7QUFDVix3Q0FBc0I7QUFDdEIsZUFBZTtBQUNmLG1EQUFpQztBQUNqQyxzQkFBc0I7QUFDdEIsNERBQTBDO0FBQzFDLHNCQUFzQjtBQUN0Qiw0REFBMEM7QUFDMUMsaUNBQWlDO0FBQ2pDLDREQUEwQztBQUMxQyw2QkFBNkI7QUFDN0IsbUVBQWlEO0FBQ2pELDhCQUE4QjtBQUM5QixtREFBbUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlbnZzLCBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi9lbnZcIjtcbmltcG9ydCB7IGNvbXBvbmVudHMsIENsaWVudCwgcGF0aHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IE9yZyB9IGZyb20gXCIuL29yZ1wiO1xuaW1wb3J0IHsgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlXCI7XG5cbmltcG9ydCB7IFNpZ25lclNlc3Npb25TdG9yYWdlLCBTaWduZXJTZXNzaW9uTWFuYWdlciB9IGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHsgTWZhUmVxdWVzdEluZm8sIFNpZ25SZXNwb25zZSwgU2lnbmVyU2Vzc2lvbiB9IGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG5pbXBvcnQgeyBDb2duaXRvU2Vzc2lvbk1hbmFnZXIsIENvZ25pdG9TZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyXCI7XG5pbXBvcnQgeyBhc3NlcnRPaywgY29uZmlnRGlyIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGNyZWF0ZUNsaWVudCBmcm9tIFwib3BlbmFwaS1mZXRjaFwiO1xuXG4vKiogQ3ViZVNpZ25lciBjb25zdHJ1Y3RvciBvcHRpb25zICovXG5leHBvcnQgaW50ZXJmYWNlIEN1YmVTaWduZXJPcHRpb25zIHtcbiAgLyoqIFRoZSBlbnZpcm9ubWVudCB0byB1c2UgKi9cbiAgZW52PzogRW52SW50ZXJmYWNlO1xuICAvKiogVGhlIG1hbmFnZW1lbnQgYXV0aG9yaXphdGlvbiB0b2tlbiAqL1xuICBzZXNzaW9uTWdyPzogQ29nbml0b1Nlc3Npb25NYW5hZ2VyIHwgU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG59XG5cbmV4cG9ydCB0eXBlIFVzZXJJbmZvID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJVc2VySW5mb1wiXTtcbmV4cG9ydCB0eXBlIFRvdHBJbmZvID0gY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlRvdHBJbmZvXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBDb25maWd1cmVkTWZhID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJDb25maWd1cmVkTWZhXCJdO1xuXG50eXBlIE9pZGNBdXRoUmVzcG9uc2UgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH0vb2lkY1wiXVtcInBvc3RcIl1bXCJyZXNwb25zZXNcIl1bXCIyMDBcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcblxuLyoqIEN1YmVTaWduZXIgY2xpZW50ICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lciB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgc2Vzc2lvbk1ncj86IENvZ25pdG9TZXNzaW9uTWFuYWdlciB8IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKiBAcmV0dXJuIHtFbnZJbnRlcmZhY2V9IFRoZSBDdWJlU2lnbmVyIGVudmlyb25tZW50IG9mIHRoaXMgY2xpZW50ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy4jZW52O1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuIGV4aXN0aW5nIG1hbmFnZW1lbnQgc2Vzc2lvbiBhbmQgY3JlYXRlcyBhIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7Q29nbml0b1Nlc3Npb25TdG9yYWdlfSBzdG9yYWdlIE9wdGlvbmFsIHNlc3Npb24gc3RvcmFnZSB0byBsb2FkXG4gICAqIHRoZSBzZXNzaW9uIGZyb20uIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBtYW5hZ2VtZW50IHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyPn0gTmV3IEN1YmVTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkTWFuYWdlbWVudFNlc3Npb24oc3RvcmFnZT86IENvZ25pdG9TZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8Q3ViZVNpZ25lcj4ge1xuICAgIGNvbnN0IGRlZmF1bHRGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdEaXIoKSwgXCJtYW5hZ2VtZW50LXNlc3Npb24uanNvblwiKTtcbiAgICBjb25zdCBzZXNzaW9uTWdyID0gYXdhaXQgQ29nbml0b1Nlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShcbiAgICAgIHN0b3JhZ2UgPz8gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoZGVmYXVsdEZpbGVQYXRoKSxcbiAgICApO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lcig8Q3ViZVNpZ25lck9wdGlvbnM+e1xuICAgICAgc2Vzc2lvbk1ncixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNpZ25lciBzZXNzaW9uIGZyb20gYSBzZXNzaW9uIHN0b3JhZ2UgKGUuZy4sIHNlc3Npb24gZmlsZSkuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWRcbiAgICogdGhlIHNlc3Npb24gZnJvbS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIHNpZ25lciBzZXNzaW9uIGZyb20gdGhlIGNvbmZpZ1xuICAgKiBkaXJlY3Rvcnkgd2lsbCBiZSBsb2FkZWQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRTaWduZXJTZXNzaW9uKHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IGRlZmF1bHRGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdEaXIoKSwgXCJzaWduZXItc2Vzc2lvbi5qc29uXCIpO1xuICAgIGNvbnN0IHNzcyA9IHN0b3JhZ2UgPz8gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoZGVmYXVsdEZpbGVQYXRoKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbi5sb2FkU2lnbmVyU2Vzc2lvbihzc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25hbCBjb25maWd1cmFpdG9uIG9wdGlvbnMgZm9yIHRoZSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IEN1YmVTaWduZXJPcHRpb25zKSB7XG4gICAgbGV0IGVudiA9IG9wdGlvbnM/LmVudjtcbiAgICBpZiAob3B0aW9ucz8uc2Vzc2lvbk1ncikge1xuICAgICAgdGhpcy5zZXNzaW9uTWdyID0gb3B0aW9ucy5zZXNzaW9uTWdyO1xuICAgICAgZW52ID0gZW52ID8/IHRoaXMuc2Vzc2lvbk1nci5lbnY7XG4gICAgfVxuICAgIHRoaXMuI2VudiA9IGVudiA/PyBlbnZzW1wiZ2FtbWFcIl07XG4gIH1cblxuICAvKipcbiAgICogQXV0aGVudGljYXRlIGFuIE9JREMgdXNlciBhbmQgY3JlYXRlIGEgbmV3IHNlc3Npb24gbWFuYWdlciBmb3IgdGhlbS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2U/fSBzdG9yYWdlIE9wdGlvbmFsIHNpZ25lciBzZXNzaW9uIHN0b3JhZ2UgKGRlZmF1bHRzIHRvIGluLW1lbW9yeSBzdG9yYWdlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPn0gVGhlIHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIGFzeW5jIG9pZGNBdXRoKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLm9pZGNMb2dpbihvaWRjVG9rZW4sIG9yZ0lkLCBzY29wZXMpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5jcmVhdGVGcm9tU2Vzc2lvbkluZm8odGhpcy5lbnYsIG9yZ0lkLCByZXNwLmRhdGEoKSwgc3RvcmFnZSk7XG4gIH1cblxuICAvKiogUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuICovXG4gIGFzeW5jIGFib3V0TWUoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL2Fib3V0X21lXCIsIHtcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBzZXRzIGEgbmV3IFRPVFAgY29uZmlndXJhdGlvbiBmb3IgdGhlIGxvZ2dlZCBpbiB1c2VyLFxuICAgKiBpZiBhbmQgb25seSBpZiBubyBUT1RQIGNvbmZpZ3VyYXRpb24gaXMgYWxyZWFkeSBzZXQuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VG90cEluZm8+fSBOZXdseSBjcmVhdGVkIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICovXG4gIGFzeW5jIGluaXRUb3RwKCk6IFByb21pc2U8VG90cEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnB1dChcIi92MC90b3RwXCIsIHtcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgZXhpc3RpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBNRkEgcmVxdWVzdCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgbWZhR2V0KG9yZ0lkOiBzdHJpbmcsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgc2V0cyBhIG5ldyBUT1RQIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBsb2dnZWQtaW4gdXNlcixcbiAgICogb3ZlcnJpZGluZyB0aGUgZXhpc3Rpbmcgb25lIChpZiBhbnkpLlxuICAgKi9cbiAgYXN5bmMgcmVzZXRUb3RwKCk6IFByb21pc2U8VG90cEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL3RvdHBcIiwge1xuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIEN1cnJlbnQgVE9UUCBjb2RlXG4gICAqL1xuICBhc3luYyB2ZXJpZnlUb3RwKGNvZGU6IHN0cmluZykge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL3RvdHAvdmVyaWZ5L3tjb2RlfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBjb2RlIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmdhbml6YXRpb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgSUQgb3IgbmFtZSBvZiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKiBAcmV0dXJuIHtPcmd9IFRoZSBvcmdhbml6YXRpb24uXG4gICAqICovXG4gIGFzeW5jIGdldE9yZyhvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxPcmc+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLCBkYXRhKTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIG1hbmFnZW1lbnQgY2xpZW50LlxuICAgKiBAcmV0dXJuIHtDbGllbnR9IFRoZSBjbGllbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBhc3luYyBtYW5hZ2VtZW50KCk6IFByb21pc2U8Q2xpZW50PiB7XG4gICAgaWYgKCF0aGlzLnNlc3Npb25NZ3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG1hbmFnZW1lbnQgc2Vzc2lvbiBsb2FkZWRcIik7XG4gICAgfVxuICAgIHJldHVybiBhd2FpdCB0aGlzLnNlc3Npb25NZ3IuY2xpZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge3Vua25vd259IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQgKGlkICsgY29uZmlybWF0aW9uIGNvZGUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbkRhdGE+fSBUaGUgc2Vzc2lvbiBkYXRhLlxuICAgKi9cbiAgYXN5bmMgb2lkY0xvZ2luKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIG1mYVJlY2VpcHQ/OiB7IG1mYUlkOiBzdHJpbmc7IG1mYUNvbmY6IHN0cmluZyB9LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxPaWRjQXV0aFJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGNyZWF0ZUNsaWVudDxwYXRocz4oe1xuICAgICAgYmFzZVVybDogdGhpcy5lbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogb2lkY1Rva2VuLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBsb2dpbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9vaWRjXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBzY29wZXMsXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGgxID0gbWZhUmVjZWlwdFxuICAgICAgPyBTaWduUmVzcG9uc2UuZ2V0TWZhSGVhZGVycyhtZmFSZWNlaXB0Lm1mYUlkLCBtZmFSZWNlaXB0Lm1mYUNvbmYpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZShvcmdJZCwgbG9naW5GbiwgYXdhaXQgbG9naW5GbihoMSkpO1xuICB9XG59XG5cbi8qKiBPcmdhbml6YXRpb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9vcmdcIjtcbi8qKiBLZXlzICovXG5leHBvcnQgKiBmcm9tIFwiLi9rZXlcIjtcbi8qKiBSb2xlcyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcm9sZVwiO1xuLyoqIEVudiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vZW52XCI7XG4vKiogU2Vzc2lvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG4vKiogU2Vzc2lvbiBzdG9yYWdlICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuLyoqIFNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBNYW5hZ2VtZW50IHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9jb2duaXRvX21hbmFnZXJcIjtcbi8qKiBTaWduZXIgc2Vzc2lvbiBtYW5hZ2VyICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBFeHBvcnQgZXRoZXJzLmpzIFNpZ25lciAqL1xuZXhwb3J0ICogYXMgZXRoZXJzIGZyb20gXCIuL2V0aGVyc1wiO1xuIl19