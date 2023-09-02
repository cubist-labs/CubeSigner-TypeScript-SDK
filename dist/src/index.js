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
exports.CubeSigner = void 0;
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
        return await signer_session_1.SignerSession.loadSignerSession(new CubeSigner({ env }), storage ?? new session_storage_1.JsonFileSessionStorage(defaultFilePath));
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
     * Authenticate an OIDC user and create a new session for them.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {OidcSessionStorage} storage The signer session storage
     * @return {Promise<SignerSession>} The signer session
     */
    async createOidcSession(oidcToken, orgId, scopes, storage) {
        return await oidc_session_manager_1.OidcSessionManager.create(this.env, storage || new session_storage_1.MemorySessionStorage(), oidcToken, orgId, scopes);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFFM0MsK0JBQTRCO0FBQzVCLCtEQUF5RjtBQUV6RixxREFBaUQ7QUFDakQscUZBRzhDO0FBQzlDLHlFQUF3RjtBQUN4RixpQ0FBNkM7QUFDN0MsMkNBQTZCO0FBYTdCLHdCQUF3QjtBQUN4QixNQUFhLFVBQVU7SUFJckIsdUVBQXVFO0lBQ3ZFLElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSx1QkFBSyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLE9BQWtDO1FBQ25FLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxnQkFBUyxHQUFFLEVBQUUseUJBQXlCLENBQUMsQ0FBQztRQUMxRSxNQUFNLFVBQVUsR0FBRyxNQUFNLHFEQUF3QixDQUFDLGVBQWUsQ0FDL0QsT0FBTyxJQUFJLElBQUksd0NBQXNCLENBQUMsZUFBZSxDQUFDLENBQ3ZELENBQUM7UUFDRixPQUFPLElBQUksVUFBVSxDQUFvQjtZQUN2QyxVQUFVO1NBQ1gsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBOEI7UUFDM0QsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGdCQUFTLEdBQUUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sR0FBRyxHQUFHLE9BQU8sSUFBSSxJQUFJLHdDQUFzQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMs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O0FBQ3RCLDREQUEwQztBQUMxQyxzQkFBc0I7QUFDdEIsNERBQTBDO0FBQzFDLGlDQUFpQztBQUNqQyx1RUFBcUQ7QUFDckQsMkJBQTJCO0FBQzNCLGlFQUErQztBQUMvQyw2QkFBNkI7QUFDN0IsbUVBQWlEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZW52cywgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4vZW52XCI7XG5pbXBvcnQgeyBjb21wb25lbnRzLCBDbGllbnQgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IE9yZyB9IGZyb20gXCIuL29yZ1wiO1xuaW1wb3J0IHsgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZSwgTWVtb3J5U2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLi9zaWduZXJfc2Vzc2lvblwiO1xuaW1wb3J0IHtcbiAgTWFuYWdlbWVudFNlc3Npb25NYW5hZ2VyLFxuICBNYW5hZ2VtZW50U2Vzc2lvblN0b3JhZ2UsXG59IGZyb20gXCIuL3Nlc3Npb24vbWFuYWdlbWVudF9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IE9pZGNTZXNzaW9uTWFuYWdlciwgT2lkY1Nlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9vaWRjX3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHsgYXNzZXJ0T2ssIGNvbmZpZ0RpciB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuLyoqIEN1YmVTaWduZXIgY29uc3RydWN0b3Igb3B0aW9ucyAqL1xuZXhwb3J0IGludGVyZmFjZSBDdWJlU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgdG8gdXNlICovXG4gIGVudj86IEVudkludGVyZmFjZTtcbiAgLyoqIFRoZSBtYW5hZ2VtZW50IGF1dGhvcml6YXRpb24gdG9rZW4gKi9cbiAgc2Vzc2lvbk1ncj86IE1hbmFnZW1lbnRTZXNzaW9uTWFuYWdlciB8IE9pZGNTZXNzaW9uTWFuYWdlcjtcbn1cblxudHlwZSBVc2VySW5mbyA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiVXNlckluZm9cIl07XG50eXBlIFRvdHBJbmZvID0gY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlRvdHBJbmZvXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbi8qKiBDdWJlU2lnbmVyIGNsaWVudCAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXIge1xuICByZWFkb25seSAjZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5IHNlc3Npb25NZ3I/OiBNYW5hZ2VtZW50U2Vzc2lvbk1hbmFnZXIgfCBPaWRjU2Vzc2lvbk1hbmFnZXI7XG5cbiAgLyoqIEByZXR1cm4ge0VudkludGVyZmFjZX0gVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnQgb2YgdGhpcyBjbGllbnQgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLiNlbnY7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3RpbmcgbWFuYWdlbWVudCBzZXNzaW9uIGFuZCBjcmVhdGVzIGEgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtNYW5hZ2VtZW50U2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc2Vzc2lvbiBzdG9yYWdlIHRvIGxvYWRcbiAgICogdGhlIHNlc3Npb24gZnJvbS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIG1hbmFnZW1lbnQgc2Vzc2lvbiBmcm9tIHRoZSBjb25maWdcbiAgICogZGlyZWN0b3J5IHdpbGwgYmUgbG9hZGVkLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXI+fSBOZXcgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRNYW5hZ2VtZW50U2Vzc2lvbihzdG9yYWdlPzogTWFuYWdlbWVudFNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxDdWJlU2lnbmVyPiB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcIm1hbmFnZW1lbnQtc2Vzc2lvbi5qc29uXCIpO1xuICAgIGNvbnN0IHNlc3Npb25NZ3IgPSBhd2FpdCBNYW5hZ2VtZW50U2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKFxuICAgICAgc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyKDxDdWJlU2lnbmVyT3B0aW9ucz57XG4gICAgICBzZXNzaW9uTWdyLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2lnbmVyIHNlc3Npb24gZnJvbSBhIHNlc3Npb24gc3RvcmFnZSAoZS5nLiwgc2Vzc2lvbiBmaWxlKS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBPcHRpb25hbCBzZXNzaW9uIHN0b3JhZ2UgdG8gbG9hZFxuICAgKiB0aGUgc2Vzc2lvbiBmcm9tLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgc2lnbmVyIHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uPiB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcInNpZ25lci1zZXNzaW9uLmpzb25cIik7XG4gICAgY29uc3Qgc3NzID0gc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpO1xuICAgIGNvbnN0IGVudiA9IChhd2FpdCBzc3MucmV0cmlldmUoKSkuZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbi5sb2FkU2lnbmVyU2Vzc2lvbihcbiAgICAgIG5ldyBDdWJlU2lnbmVyKHsgZW52IH0pLFxuICAgICAgc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShkZWZhdWx0RmlsZVBhdGgpLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbnMgZm9yIHRoZSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9uczogQ3ViZVNpZ25lck9wdGlvbnMpIHtcbiAgICBsZXQgZW52ID0gb3B0aW9ucy5lbnY7XG4gICAgaWYgKG9wdGlvbnMuc2Vzc2lvbk1ncikge1xuICAgICAgdGhpcy5zZXNzaW9uTWdyID0gb3B0aW9ucy5zZXNzaW9uTWdyO1xuICAgICAgZW52ID0gZW52ID8/IHRoaXMuc2Vzc2lvbk1nci5lbnY7XG4gICAgfVxuICAgIHRoaXMuI2VudiA9IGVudiA/PyBlbnZzW1wiZ2FtbWFcIl07XG4gIH1cblxuICAvKipcbiAgICogQXV0aGVudGljYXRlIGFuIE9JREMgdXNlciBhbmQgY3JlYXRlIGEgbmV3IHNlc3Npb24gZm9yIHRoZW0uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge09pZGNTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2lnbmVyIHNlc3Npb24gc3RvcmFnZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb24+fSBUaGUgc2lnbmVyIHNlc3Npb25cbiAgICovXG4gIGFzeW5jIGNyZWF0ZU9pZGNTZXNzaW9uKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIHN0b3JhZ2U/OiBPaWRjU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8T2lkY1Nlc3Npb25NYW5hZ2VyPiB7XG4gICAgcmV0dXJuIGF3YWl0IE9pZGNTZXNzaW9uTWFuYWdlci5jcmVhdGUoXG4gICAgICB0aGlzLmVudixcbiAgICAgIHN0b3JhZ2UgfHwgbmV3IE1lbW9yeVNlc3Npb25TdG9yYWdlKCksXG4gICAgICBvaWRjVG9rZW4sXG4gICAgICBvcmdJZCxcbiAgICAgIHNjb3BlcyxcbiAgICApO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLiAqL1xuICBhc3luYyBhYm91dE1lKCk6IFByb21pc2U8VXNlckluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9hYm91dF9tZVwiLCB7XG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgc2V0cyBhIG5ldyBUT1RQIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBsb2dnZWQtaW4gdXNlcixcbiAgICogb3ZlcnJpZGluZyB0aGUgZXhpc3Rpbmcgb25lIChpZiBhbnkpLlxuICAgKi9cbiAgYXN5bmMgcmVzZXRUb3RwKCk6IFByb21pc2U8VG90cEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL3RvdHBcIiwge1xuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmdhbml6YXRpb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgSUQgb3IgbmFtZSBvZiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKiBAcmV0dXJuIHtPcmd9IFRoZSBvcmdhbml6YXRpb24uXG4gICAqICovXG4gIGFzeW5jIGdldE9yZyhvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxPcmc+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcywgZGF0YSk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBtYW5hZ2VtZW50IGNsaWVudC5cbiAgICogQHJldHVybiB7Q2xpZW50fSBUaGUgY2xpZW50LlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgYXN5bmMgbWFuYWdlbWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGlmICghdGhpcy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBtYW5hZ2VtZW50IHNlc3Npb24gbG9hZGVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXNzaW9uTWdyLmNsaWVudCgpO1xuICB9XG59XG5cbi8qKiBPcmdhbml6YXRpb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9vcmdcIjtcbi8qKiBLZXlzICovXG5leHBvcnQgKiBmcm9tIFwiLi9rZXlcIjtcbi8qKiBSb2xlcyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcm9sZVwiO1xuLyoqIEVudiAqL1xuZXhwb3J0ICogZnJvbSBcIi4vZW52XCI7XG4vKiogU2Vzc2lvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG4vKiogU2Vzc2lvbiBzdG9yYWdlICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuLyoqIFNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zZXNzaW9uX21hbmFnZXJcIjtcbi8qKiBNYW5hZ2VtZW50IHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9tYW5hZ2VtZW50X3Nlc3Npb25fbWFuYWdlclwiO1xuLyoqIE9JREMgc2Vzc2lvbiBtYW5hZ2VyICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL29pZGNfc2Vzc2lvbl9tYW5hZ2VyXCI7XG4vKiogU2lnbmVyIHNlc3Npb24gbWFuYWdlciAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG4iXX0=