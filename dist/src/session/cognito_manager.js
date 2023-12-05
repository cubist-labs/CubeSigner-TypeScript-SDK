"use strict";
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
var _CognitoSessionManager_client;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoSessionManager = void 0;
const path_1 = __importDefault(require("path"));
const session_manager_1 = require("./session_manager");
const session_storage_1 = require("./session_storage");
const util_1 = require("../util");
/** The session manager for cognito (management) sessions */
class CognitoSessionManager extends session_manager_1.OrgSessionManager {
    /**
     * @return {string} The current auth token.
     * @internal
     */
    async token() {
        const session = await this.storage.retrieve();
        return session.id_token;
    }
    /**
     * Returns a client with the current session and refreshes the current
     * session.
     */
    async client() {
        this.refreshIfNeeded();
        return __classPrivateFieldGet(this, _CognitoSessionManager_client, "f");
    }
    /** Revokes the session. */
    async revoke() {
        const idp = require("@aws-sdk/client-cognito-identity-provider"); // eslint-disable-line @typescript-eslint/no-var-requires
        const session = await this.storage.retrieve();
        const client = new idp.CognitoIdentityProviderClient({
            region: this.env.Region,
            signer: { sign: async (request) => request }, // eslint-disable-line @typescript-eslint/no-explicit-any
        });
        const input = {
            Token: session.refresh_token,
            ClientId: this.env.ClientId,
        };
        await client.send(new idp.RevokeTokenCommand(input));
    }
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    async isStale() {
        const session = await this.storage.retrieve();
        return session_manager_1.SessionManager.hasExpired(new Date(session.expiration));
    }
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    async refresh() {
        const idp = require("@aws-sdk/client-cognito-identity-provider"); // eslint-disable-line @typescript-eslint/no-var-requires
        const session = await this.storage.retrieve();
        const client = new idp.CognitoIdentityProviderClient({ region: this.env.Region });
        const resp = await client.send(new idp.InitiateAuthCommand({
            AuthFlow: "REFRESH_TOKEN_AUTH",
            AuthParameters: {
                REFRESH_TOKEN: session.refresh_token,
            },
            ClientId: this.env.ClientId,
        }));
        if (!resp.AuthenticationResult ||
            !resp.AuthenticationResult.ExpiresIn ||
            !resp.AuthenticationResult.IdToken) {
            throw new Error("Refresh failed");
        }
        const expiresInMs = resp.AuthenticationResult.ExpiresIn * 1000;
        const expiration = new Date(new Date().getTime() + expiresInMs).toISOString();
        const idToken = resp.AuthenticationResult.IdToken;
        await this.storage.save({
            ...session,
            id_token: idToken,
            access_token: resp.AuthenticationResult.AccessToken,
            expiration,
        });
        __classPrivateFieldSet(this, _CognitoSessionManager_client, this.createClient(idToken), "f");
    }
    /**
     * Loads an existing cognito (management) session from storage.
     * @param {CognitoSessionStorage} storage The storage back end to use
     * @return {Promise<SingerSession>} New token
     */
    static async loadFromStorage(storage) {
        const sessionInfo = await storage.retrieve();
        return new CognitoSessionManager(sessionInfo.env["Dev-CubeSignerStack"], sessionInfo.org_id, sessionInfo.id_token, storage);
    }
    /**
     * Loads an existing management session and creates a Cognito session manager for it.
     *
     * @param {CognitoSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the management session from the config
     * directory will be loaded.
     * @return {Promise<CognitoSessionManager>} Cognito session manager
     */
    static async loadManagementSession(storage) {
        return await CognitoSessionManager.loadFromStorage(storage ?? new session_storage_1.JsonFileSessionStorage(path_1.default.join((0, util_1.configDir)(), "management-session.json")));
    }
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} orgId The id of the org associated with this session
     * @param {string} token The current token of the session
     * @param {CognitoSessionStorage} storage The storage back end to use
     */
    constructor(env, orgId, token, storage) {
        super(env, orgId, storage);
        _CognitoSessionManager_client.set(this, void 0);
        __classPrivateFieldSet(this, _CognitoSessionManager_client, this.createClient(token), "f");
    }
}
exports.CognitoSessionManager = CognitoSessionManager;
_CognitoSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0b19tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUd4Qix1REFBOEU7QUFDOUUsdURBQTJFO0FBQzNFLGtDQUFvQztBQXVCcEMsNERBQTREO0FBQzVELE1BQWEscUJBQXNCLFNBQVEsbUNBQXFDO0lBRzlFOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQztJQUMxQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkIsT0FBTyx1QkFBQSxJQUFJLHFDQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDLENBQUMseURBQXlEO1FBQzNILE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztZQUNuRCxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNO1lBQ3ZCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBWSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSx5REFBeUQ7U0FDN0csQ0FBQyxDQUFDO1FBQ0gsTUFBTSxLQUFLLEdBQUc7WUFDWixLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWE7WUFDNUIsUUFBUSxFQUFFLElBQUks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RixDQUFDO0lBQ0osQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFlBQ0UsR0FBaUIsRUFDakIsS0FBYSxFQUNiLEtBQWEsRUFDYixPQUE4QjtRQUU5QixLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQS9IN0IsZ0RBQWdCO1FBZ0lkLHVCQUFBLElBQUksaUNBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQzFDLENBQUM7Q0FDRjtBQW5JRCxzREFtSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2FwaVwiO1xuaW1wb3J0IHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uL2VudlwiO1xuaW1wb3J0IHsgSGFzRW52LCBPcmdTZXNzaW9uTWFuYWdlciwgU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UsIFNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbl9zdG9yYWdlXCI7XG5pbXBvcnQgeyBjb25maWdEaXIgfSBmcm9tIFwiLi4vdXRpbFwiO1xuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiBvdXIgXCJtYW5hZ2VtZW50IHNlc3Npb25cIiBmaWxlIGZvcm1hdCAqL1xuZXhwb3J0IGludGVyZmFjZSBDb2duaXRvU2Vzc2lvbk9iamVjdCB7XG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIElEICovXG4gIG9yZ19pZDogc3RyaW5nO1xuICAvKiogVGhlIGVtYWlsIGFkZHJlc3Mgb2YgdGhlIHVzZXIgKi9cbiAgZW1haWw6IHN0cmluZztcbiAgLyoqIFRoZSBJRCB0b2tlbiAqL1xuICBpZF90b2tlbjogc3RyaW5nO1xuICAvKiogVGhlIGFjY2VzcyB0b2tlbiAqL1xuICBhY2Nlc3NfdG9rZW46IHN0cmluZztcbiAgLyoqIFRoZSByZWZyZXNoIHRva2VuICovXG4gIHJlZnJlc2hfdG9rZW46IHN0cmluZztcbiAgLyoqIFRoZSBleHBpcmF0aW9uIHRpbWUgb2YgdGhlIGFjY2VzcyB0b2tlbiAqL1xuICBleHBpcmF0aW9uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29nbml0b1Nlc3Npb25JbmZvIGV4dGVuZHMgQ29nbml0b1Nlc3Npb25PYmplY3QsIEhhc0VudiB7fVxuXG4vKiogVHlwZSBvZiBzdG9yYWdlIHJlcXVpcmVkIGZvciBjb2duaXRvIChtYW5hZ2VtZW50KSBzZXNzaW9ucyAqL1xuZXhwb3J0IHR5cGUgQ29nbml0b1Nlc3Npb25TdG9yYWdlID0gU2Vzc2lvblN0b3JhZ2U8Q29nbml0b1Nlc3Npb25JbmZvPjtcblxuLyoqIFRoZSBzZXNzaW9uIG1hbmFnZXIgZm9yIGNvZ25pdG8gKG1hbmFnZW1lbnQpIHNlc3Npb25zICovXG5leHBvcnQgY2xhc3MgQ29nbml0b1Nlc3Npb25NYW5hZ2VyIGV4dGVuZHMgT3JnU2Vzc2lvbk1hbmFnZXI8Q29nbml0b1Nlc3Npb25JbmZvPiB7XG4gICNjbGllbnQ6IENsaWVudDtcblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3VycmVudCBhdXRoIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBzZXNzaW9uLmlkX3Rva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBjbGllbnQgd2l0aCB0aGUgY3VycmVudCBzZXNzaW9uIGFuZCByZWZyZXNoZXMgdGhlIGN1cnJlbnRcbiAgICogc2Vzc2lvbi5cbiAgICovXG4gIGFzeW5jIGNsaWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKiBSZXZva2VzIHRoZSBzZXNzaW9uLiAqL1xuICBhc3luYyByZXZva2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaWRwID0gcmVxdWlyZShcIkBhd3Mtc2RrL2NsaWVudC1jb2duaXRvLWlkZW50aXR5LXByb3ZpZGVyXCIpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IGlkcC5Db2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudCh7XG4gICAgICByZWdpb246IHRoaXMuZW52LlJlZ2lvbixcbiAgICAgIHNpZ25lcjogeyBzaWduOiBhc3luYyAocmVxdWVzdDogYW55KSA9PiByZXF1ZXN0IH0sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIH0pO1xuICAgIGNvbnN0IGlucHV0ID0ge1xuICAgICAgVG9rZW46IHNlc3Npb24ucmVmcmVzaF90b2tlbixcbiAgICAgIENsaWVudElkOiB0aGlzLmVudi5DbGllbnRJZCxcbiAgICB9O1xuICAgIGF3YWl0IGNsaWVudC5zZW5kKG5ldyBpZHAuUmV2b2tlVG9rZW5Db21tYW5kKGlucHV0KSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gU2Vzc2lvbk1hbmFnZXIuaGFzRXhwaXJlZChuZXcgRGF0ZShzZXNzaW9uLmV4cGlyYXRpb24pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24gYW5kICoqVVBEQVRFUy9NVVRBVEVTKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaWRwID0gcmVxdWlyZShcIkBhd3Mtc2RrL2NsaWVudC1jb2duaXRvLWlkZW50aXR5LXByb3ZpZGVyXCIpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IGlkcC5Db2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudCh7IHJlZ2lvbjogdGhpcy5lbnYuUmVnaW9uIH0pO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuc2VuZChcbiAgICAgIG5ldyBpZHAuSW5pdGlhdGVBdXRoQ29tbWFuZCh7XG4gICAgICAgIEF1dGhGbG93OiBcIlJFRlJFU0hfVE9LRU5fQVVUSFwiLFxuICAgICAgICBBdXRoUGFyYW1ldGVyczoge1xuICAgICAgICAgIFJFRlJFU0hfVE9LRU46IHNlc3Npb24ucmVmcmVzaF90b2tlbixcbiAgICAgICAgfSxcbiAgICAgICAgQ2xpZW50SWQ6IHRoaXMuZW52LkNsaWVudElkLFxuICAgICAgfSksXG4gICAgKTtcblxuICAgIGlmIChcbiAgICAgICFyZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0IHx8XG4gICAgICAhcmVzcC5BdXRoZW50aWNhdGlvblJlc3VsdC5FeHBpcmVzSW4gfHxcbiAgICAgICFyZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LklkVG9rZW5cbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlZnJlc2ggZmFpbGVkXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cGlyZXNJbk1zID0gcmVzcC5BdXRoZW50aWNhdGlvblJlc3VsdC5FeHBpcmVzSW4gKiAxMDAwO1xuICAgIGNvbnN0IGV4cGlyYXRpb24gPSBuZXcgRGF0ZShuZXcgRGF0ZSgpLmdldFRpbWUoKSArIGV4cGlyZXNJbk1zKS50b0lTT1N0cmluZygpO1xuICAgIGNvbnN0IGlkVG9rZW4gPSByZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LklkVG9rZW47XG5cbiAgICBhd2FpdCB0aGlzLnN0b3JhZ2Uuc2F2ZSg8Q29nbml0b1Nlc3Npb25JbmZvPntcbiAgICAgIC4uLnNlc3Npb24sXG4gICAgICBpZF90b2tlbjogaWRUb2tlbixcbiAgICAgIGFjY2Vzc190b2tlbjogcmVzcC5BdXRoZW50aWNhdGlvblJlc3VsdC5BY2Nlc3NUb2tlbixcbiAgICAgIGV4cGlyYXRpb24sXG4gICAgfSk7XG4gICAgdGhpcy4jY2xpZW50ID0gdGhpcy5jcmVhdGVDbGllbnQoaWRUb2tlbik7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3RpbmcgY29nbml0byAobWFuYWdlbWVudCkgc2Vzc2lvbiBmcm9tIHN0b3JhZ2UuXG4gICAqIEBwYXJhbSB7Q29nbml0b1Nlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzdG9yYWdlIGJhY2sgZW5kIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpbmdlclNlc3Npb24+fSBOZXcgdG9rZW5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZTogQ29nbml0b1Nlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxDb2duaXRvU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uSW5mbyA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gbmV3IENvZ25pdG9TZXNzaW9uTWFuYWdlcihcbiAgICAgIHNlc3Npb25JbmZvLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0sXG4gICAgICBzZXNzaW9uSW5mby5vcmdfaWQsXG4gICAgICBzZXNzaW9uSW5mby5pZF90b2tlbixcbiAgICAgIHN0b3JhZ2UsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBtYW5hZ2VtZW50IHNlc3Npb24gYW5kIGNyZWF0ZXMgYSBDb2duaXRvIHNlc3Npb24gbWFuYWdlciBmb3IgaXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29nbml0b1Nlc3Npb25TdG9yYWdlfSBzdG9yYWdlIE9wdGlvbmFsIHNlc3Npb24gc3RvcmFnZSB0byBsb2FkXG4gICAqIHRoZSBzZXNzaW9uIGZyb20uIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBtYW5hZ2VtZW50IHNlc3Npb24gZnJvbSB0aGUgY29uZmlnXG4gICAqIGRpcmVjdG9yeSB3aWxsIGJlIGxvYWRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDb2duaXRvU2Vzc2lvbk1hbmFnZXI+fSBDb2duaXRvIHNlc3Npb24gbWFuYWdlclxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRNYW5hZ2VtZW50U2Vzc2lvbihcbiAgICBzdG9yYWdlPzogQ29nbml0b1Nlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPENvZ25pdG9TZXNzaW9uTWFuYWdlcj4ge1xuICAgIHJldHVybiBhd2FpdCBDb2duaXRvU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKFxuICAgICAgc3RvcmFnZSA/PyBuZXcgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZShwYXRoLmpvaW4oY29uZmlnRGlyKCksIFwibWFuYWdlbWVudC1zZXNzaW9uLmpzb25cIikpLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZyBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiBUaGUgY3VycmVudCB0b2tlbiBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0ge0NvZ25pdG9TZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2VcbiAgICovXG4gIHByaXZhdGUgY29uc3RydWN0b3IoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICB0b2tlbjogc3RyaW5nLFxuICAgIHN0b3JhZ2U6IENvZ25pdG9TZXNzaW9uU3RvcmFnZSxcbiAgKSB7XG4gICAgc3VwZXIoZW52LCBvcmdJZCwgc3RvcmFnZSk7XG4gICAgdGhpcy4jY2xpZW50ID0gdGhpcy5jcmVhdGVDbGllbnQodG9rZW4pO1xuICB9XG59XG4iXX0=