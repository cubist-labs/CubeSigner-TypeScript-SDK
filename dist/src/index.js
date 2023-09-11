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
var _CubeSigner_env;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethers = exports.CubeSigner = void 0;
const env_1 = require("./env");
const org_1 = require("./org");
const session_storage_1 = require("./session/session_storage");
const signer_session_1 = require("./signer_session");
const management_session_manager_1 = require("./session/management_session_manager");
const oidc_session_manager_1 = require("./session/oidc_session_manager");
const util_1 = require("./util");
const path = __importStar(require("path"));
/** CubeSigner client */
class CubeSigner {
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env() {
        return __classPrivateFieldGet(this, _CubeSigner_env, "f");
    }
    /**
     * Loads an existing management session and creates a CubeSigner instance.
     * @param {ManagementSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the management session from the config
     * directory will be loaded.
     * @return {Promise<CubeSigner>} New CubeSigner instance
     */
    static async loadManagementSession(storage) {
        const defaultFilePath = path.join((0, util_1.configDir)(), "management-session.json");
        const sessionMgr = await management_session_manager_1.ManagementSessionManager.loadFromStorage(storage ?? new session_storage_1.JsonFileSessionStorage(defaultFilePath));
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
        const env = (await sss.retrieve()).env["Dev-CubeSignerStack"];
        return await signer_session_1.SignerSession.loadSignerSession(new CubeSigner({ env }), sss);
    }
    /**
     * Loads a signer session from OIDC storage
     * @param {OidcSessionStorage} storage The storage to load from
     * @return {Promise<SignerSession>} New signer session
     */
    static async loadOidcSession(storage) {
        const env = (await storage.retrieve()).env;
        return await signer_session_1.SignerSession.loadOidcSession(new CubeSigner({ env }), storage);
    }
    /**
     * Create a new CubeSigner instance.
     * @param {CubeSignerOptions} options The options for the CubeSigner instance.
     */
    constructor(options) {
        _CubeSigner_env.set(this, void 0);
        let env = options.env;
        if (options.sessionMgr) {
            this.sessionMgr = options.sessionMgr;
            env = env ?? this.sessionMgr.env;
        }
        __classPrivateFieldSet(this, _CubeSigner_env, env ?? env_1.envs["gamma"], "f");
    }
    /**
     * Authenticate an OIDC user and create a new OIDC session manager for them.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {OidcSessionStorage} storage The signer session storage
     * @return {Promise<OidcSessionManager>} The OIDC session manager
     */
    async createOidcManager(oidcToken, orgId, scopes, storage) {
        return await oidc_session_manager_1.OidcSessionManager.create(this.env, storage || new session_storage_1.MemorySessionStorage(), oidcToken, orgId, scopes);
    }
    /**
     * Authenticate an OIDC user and create a new session for them.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {OidcSessionStorage} storage The signer session storage
     * @return {Promise<SignerSession>} The signer session
     */
    async createOidcSession(oidcToken, orgId, scopes, storage) {
        const mgr = await this.createOidcManager(oidcToken, orgId, scopes, storage);
        return await CubeSigner.loadOidcSession(mgr.storage);
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
__exportStar(require("./session/management_session_manager"), exports);
/** OIDC session manager */
__exportStar(require("./session/oidc_session_manager"), exports);
/** Signer session manager */
__exportStar(require("./session/signer_session_manager"), exports);
/** Export ethers.js Signer */
exports.ethers = __importStar(require("./ethers"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFFM0MsK0JBQTRCO0FBQzVCLCtEQUF5RjtBQUV6RixxREFBaUQ7QUFDakQscUZBRzhDO0FBQzlDLHlFQUF3RjtBQUN4RixpQ0FBNkM7QUFDN0MsMkNBQTZCO0FBYzdCLHdCQUF3QjtBQUN4QixNQUFhLFVBQVU7SUFJckIsdUVBQXVFO0lBQ3ZFLElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSx1QkFBSyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLE9BQWtDO1FBQ25FLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxnQkFBUyxHQUFFLEVBQUUseUJBQXlCLENBQUMsQ0FBQztRQUMxRSxNQUFNLFVBQVUsR0FBRyxNQUFNLHFEQUF3QixDQUFDLGVBQWUsQ0FDL0QsT0FBTyxJQUFJLElBQUksd0NBQXNCLENBQUMsZUFBZSxDQUFDLENBQ3ZELENBQUM7UUFDRixPQUFPLElBQUksVUFBVSxDQUFvQjtZQUN2QyxVQUFVO1NBQ1gsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBOEI7UUFDM0QsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFTLEdBQUUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sR0FBRyxHQUFHLE9BQU8sSUFBSSxJQUFJLHdDQUFzQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMs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ZSB9IGZyb20gXCIuL2VudlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cywgQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmdcIjtcbmltcG9ydCB7IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UsIE1lbW9yeVNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX3N0b3JhZ2VcIjtcbmltcG9ydCB7IFNpZ25lclNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBTaWduZXJTZXNzaW9uIH0gZnJvbSBcIi4vc2lnbmVyX3Nlc3Npb25cIjtcbmltcG9ydCB7XG4gIE1hbmFnZW1lbnRTZXNzaW9uTWFuYWdlcixcbiAgTWFuYWdlbWVudFNlc3Npb25TdG9yYWdlLFxufSBmcm9tIFwiLi9zZXNzaW9uL21hbmFnZW1lbnRfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBPaWRjU2Vzc2lvbk1hbmFnZXIsIE9pZGNTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb24vb2lkY19zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IGFzc2VydE9rLCBjb25maWdEaXIgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8qKiBDdWJlU2lnbmVyIGNvbnN0cnVjdG9yIG9wdGlvbnMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3ViZVNpZ25lck9wdGlvbnMge1xuICAvKiogVGhlIGVudmlyb25tZW50IHRvIHVzZSAqL1xuICBlbnY/OiBFbnZJbnRlcmZhY2U7XG4gIC8qKiBUaGUgbWFuYWdlbWVudCBhdXRob3JpemF0aW9uIHRva2VuICovXG4gIHNlc3Npb25NZ3I/OiBNYW5hZ2VtZW50U2Vzc2lvbk1hbmFnZXIgfCBPaWRjU2Vzc2lvbk1hbmFnZXI7XG59XG5cbmV4cG9ydCB0eXBlIFVzZXJJbmZvID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJVc2VySW5mb1wiXTtcbmV4cG9ydCB0eXBlIFRvdHBJbmZvID0gY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlRvdHBJbmZvXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBDb25maWd1cmVkTWZhID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJDb25maWd1cmVkTWZhXCJdO1xuXG4vKiogQ3ViZVNpZ25lciBjbGllbnQgKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyIHtcbiAgcmVhZG9ubHkgI2VudjogRW52SW50ZXJmYWNlO1xuICByZWFkb25seSBzZXNzaW9uTWdyPzogTWFuYWdlbWVudFNlc3Npb25NYW5hZ2VyIHwgT2lkY1Nlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKiBAcmV0dXJuIHtFbnZJbnRlcmZhY2V9IFRoZSBDdWJlU2lnbmVyIGVudmlyb25tZW50IG9mIHRoaXMgY2xpZW50ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy4jZW52O1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuIGV4aXN0aW5nIG1hbmFnZW1lbnQgc2Vzc2lvbiBhbmQgY3JlYXRlcyBhIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7TWFuYWdlbWVudFNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIE9wdGlvbmFsIHNlc3Npb24gc3RvcmFnZSB0byBsb2FkXG4gICAqIHRoZSBzZXNzaW9uIGZyb20uIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBtYW5hZ2VtZW50IHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyPn0gTmV3IEN1YmVTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkTWFuYWdlbWVudFNlc3Npb24oc3RvcmFnZT86IE1hbmFnZW1lbnRTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8Q3ViZVNpZ25lcj4ge1xuICAgIGNvbnN0IGRlZmF1bHRGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdEaXIoKSwgXCJtYW5hZ2VtZW50LXNlc3Npb24uanNvblwiKTtcbiAgICBjb25zdCBzZXNzaW9uTWdyID0gYXdhaXQgTWFuYWdlbWVudFNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShcbiAgICAgIHN0b3JhZ2UgPz8gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoZGVmYXVsdEZpbGVQYXRoKSxcbiAgICApO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lcig8Q3ViZVNpZ25lck9wdGlvbnM+e1xuICAgICAgc2Vzc2lvbk1ncixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNpZ25lciBzZXNzaW9uIGZyb20gYSBzZXNzaW9uIHN0b3JhZ2UgKGUuZy4sIHNlc3Npb24gZmlsZSkuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWRcbiAgICogdGhlIHNlc3Npb24gZnJvbS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIHNpZ25lciBzZXNzaW9uIGZyb20gdGhlIGNvbmZpZ1xuICAgKiBkaXJlY3Rvcnkgd2lsbCBiZSBsb2FkZWQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRTaWduZXJTZXNzaW9uKHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IGRlZmF1bHRGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdEaXIoKSwgXCJzaWduZXItc2Vzc2lvbi5qc29uXCIpO1xuICAgIGNvbnN0IHNzcyA9IHN0b3JhZ2UgPz8gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoZGVmYXVsdEZpbGVQYXRoKTtcbiAgICBjb25zdCBlbnYgPSAoYXdhaXQgc3NzLnJldHJpZXZlKCkpLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl07XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb24ubG9hZFNpZ25lclNlc3Npb24obmV3IEN1YmVTaWduZXIoeyBlbnYgfSksIHNzcyk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSBzaWduZXIgc2Vzc2lvbiBmcm9tIE9JREMgc3RvcmFnZVxuICAgKiBAcGFyYW0ge09pZGNTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSB0byBsb2FkIGZyb21cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZE9pZGNTZXNzaW9uKHN0b3JhZ2U6IE9pZGNTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IGVudiA9IChhd2FpdCBzdG9yYWdlLnJldHJpZXZlKCkpLmVudjtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbi5sb2FkT2lkY1Nlc3Npb24obmV3IEN1YmVTaWduZXIoeyBlbnYgfSksIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25zIGZvciB0aGUgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEN1YmVTaWduZXJPcHRpb25zKSB7XG4gICAgbGV0IGVudiA9IG9wdGlvbnMuZW52O1xuICAgIGlmIChvcHRpb25zLnNlc3Npb25NZ3IpIHtcbiAgICAgIHRoaXMuc2Vzc2lvbk1nciA9IG9wdGlvbnMuc2Vzc2lvbk1ncjtcbiAgICAgIGVudiA9IGVudiA/PyB0aGlzLnNlc3Npb25NZ3IuZW52O1xuICAgIH1cbiAgICB0aGlzLiNlbnYgPSBlbnYgPz8gZW52c1tcImdhbW1hXCJdO1xuICB9XG5cbiAgLyoqXG4gICAqIEF1dGhlbnRpY2F0ZSBhbiBPSURDIHVzZXIgYW5kIGNyZWF0ZSBhIG5ldyBPSURDIHNlc3Npb24gbWFuYWdlciBmb3IgdGhlbS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7T2lkY1Nlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzaWduZXIgc2Vzc2lvbiBzdG9yYWdlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8T2lkY1Nlc3Npb25NYW5hZ2VyPn0gVGhlIE9JREMgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBhc3luYyBjcmVhdGVPaWRjTWFuYWdlcihcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBzdG9yYWdlPzogT2lkY1Nlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPE9pZGNTZXNzaW9uTWFuYWdlcj4ge1xuICAgIHJldHVybiBhd2FpdCBPaWRjU2Vzc2lvbk1hbmFnZXIuY3JlYXRlKFxuICAgICAgdGhpcy5lbnYsXG4gICAgICBzdG9yYWdlIHx8IG5ldyBNZW1vcnlTZXNzaW9uU3RvcmFnZSgpLFxuICAgICAgb2lkY1Rva2VuLFxuICAgICAgb3JnSWQsXG4gICAgICBzY29wZXMsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRoZW50aWNhdGUgYW4gT0lEQyB1c2VyIGFuZCBjcmVhdGUgYSBuZXcgc2Vzc2lvbiBmb3IgdGhlbS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7T2lkY1Nlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzaWduZXIgc2Vzc2lvbiBzdG9yYWdlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbj59IFRoZSBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgYXN5bmMgY3JlYXRlT2lkY1Nlc3Npb24oXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgc3RvcmFnZT86IE9pZGNTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uPiB7XG4gICAgY29uc3QgbWdyID0gYXdhaXQgdGhpcy5jcmVhdGVPaWRjTWFuYWdlcihvaWRjVG9rZW4sIG9yZ0lkLCBzY29wZXMsIHN0b3JhZ2UpO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyLmxvYWRPaWRjU2Vzc2lvbihtZ3Iuc3RvcmFnZSk7XG4gIH1cblxuICAvKiogUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuICovXG4gIGFzeW5jIGFib3V0TWUoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL2Fib3V0X21lXCIsIHtcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBzZXRzIGEgbmV3IFRPVFAgY29uZmlndXJhdGlvbiBmb3IgdGhlIGxvZ2dlZC1pbiB1c2VyLFxuICAgKiBvdmVycmlkaW5nIHRoZSBleGlzdGluZyBvbmUgKGlmIGFueSkuXG4gICAqL1xuICBhc3luYyByZXNldFRvdHAoKTogUHJvbWlzZTxUb3RwSW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkucGF0Y2goXCIvdjAvdG90cFwiLCB7XG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgQ3VycmVudCBUT1RQIGNvZGVcbiAgICovXG4gIGFzeW5jIHZlcmlmeVRvdHAoY29kZTogc3RyaW5nKSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvdG90cC92ZXJpZnkve2NvZGV9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGNvZGUgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKiogUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IGFuIG9yZ2FuaXphdGlvbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBJRCBvciBuYW1lIG9mIHRoZSBvcmdhbml6YXRpb24uXG4gICAqIEByZXR1cm4ge09yZ30gVGhlIG9yZ2FuaXphdGlvbi5cbiAgICogKi9cbiAgYXN5bmMgZ2V0T3JnKG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPE9yZz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBuZXcgT3JnKHRoaXMsIGRhdGEpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgbWFuYWdlbWVudCBjbGllbnQuXG4gICAqIEByZXR1cm4ge0NsaWVudH0gVGhlIGNsaWVudC5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIGFzeW5jIG1hbmFnZW1lbnQoKTogUHJvbWlzZTxDbGllbnQ+IHtcbiAgICBpZiAoIXRoaXMuc2Vzc2lvbk1ncikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbWFuYWdlbWVudCBzZXNzaW9uIGxvYWRlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKTtcbiAgfVxufVxuXG4vKiogT3JnYW5pemF0aW9ucyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vb3JnXCI7XG4vKiogS2V5cyAqL1xuZXhwb3J0ICogZnJvbSBcIi4va2V5XCI7XG4vKiogUm9sZXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3JvbGVcIjtcbi8qKiBFbnYgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2VudlwiO1xuLyoqIFNlc3Npb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuLyoqIFNlc3Npb24gc3RvcmFnZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX3N0b3JhZ2VcIjtcbi8qKiBTZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogTWFuYWdlbWVudCBzZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vbWFuYWdlbWVudF9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBPSURDIHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9vaWRjX3Nlc3Npb25fbWFuYWdlclwiO1xuLyoqIFNpZ25lciBzZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuLyoqIEV4cG9ydCBldGhlcnMuanMgU2lnbmVyICovXG5leHBvcnQgKiBhcyBldGhlcnMgZnJvbSBcIi4vZXRoZXJzXCI7XG4iXX0=