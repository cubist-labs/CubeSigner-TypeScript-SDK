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
        return this.hasExpired(new Date(session.expiration).getTime());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0b19tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUd4Qix1REFBOEQ7QUFDOUQsdURBQTJFO0FBQzNFLGtDQUFvQztBQXVCcEMsNERBQTREO0FBQzVELE1BQWEscUJBQXNCLFNBQVEsbUNBQXFDO0lBRzlFOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQztJQUMxQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkIsT0FBTyx1QkFBQSxJQUFJLHFDQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDLENBQUMseURBQXlEO1FBQzNILE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztZQUNuRCxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNO1lBQ3ZCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBWSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSx5REFBeUQ7U0FDN0csQ0FBQyxDQUFDO1FBQ0gsTUFBTSxLQUFLLEdBQUc7WUFDWixLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWE7WUFDNUIsUUFBUSxFQUFFLElBQUks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Q0FBQyxDQUFDLENBQ3pGLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsWUFDRSxHQUFpQixFQUNqQixLQUFhLEVBQ2IsS0FBYSxFQUNiLE9BQThCO1FBRTlCLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBL0g3QixnREFBZ0I7UUFnSWQsdUJBQUEsSUFBSSxpQ0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFBLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBbklELHNEQW1JQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vYXBpXCI7XG5pbXBvcnQgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5pbXBvcnQgeyBIYXNFbnYsIE9yZ1Nlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIi4vc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBKc29uRmlsZVNlc3Npb25TdG9yYWdlLCBTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb25fc3RvcmFnZVwiO1xuaW1wb3J0IHsgY29uZmlnRGlyIH0gZnJvbSBcIi4uL3V0aWxcIjtcblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2Ygb3VyIFwibWFuYWdlbWVudCBzZXNzaW9uXCIgZmlsZSBmb3JtYXQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29nbml0b1Nlc3Npb25PYmplY3Qge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSBlbWFpbCBhZGRyZXNzIG9mIHRoZSB1c2VyICovXG4gIGVtYWlsOiBzdHJpbmc7XG4gIC8qKiBUaGUgSUQgdG9rZW4gKi9cbiAgaWRfdG9rZW46IHN0cmluZztcbiAgLyoqIFRoZSBhY2Nlc3MgdG9rZW4gKi9cbiAgYWNjZXNzX3Rva2VuOiBzdHJpbmc7XG4gIC8qKiBUaGUgcmVmcmVzaCB0b2tlbiAqL1xuICByZWZyZXNoX3Rva2VuOiBzdHJpbmc7XG4gIC8qKiBUaGUgZXhwaXJhdGlvbiB0aW1lIG9mIHRoZSBhY2Nlc3MgdG9rZW4gKi9cbiAgZXhwaXJhdGlvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvZ25pdG9TZXNzaW9uSW5mbyBleHRlbmRzIENvZ25pdG9TZXNzaW9uT2JqZWN0LCBIYXNFbnYge31cblxuLyoqIFR5cGUgb2Ygc3RvcmFnZSByZXF1aXJlZCBmb3IgY29nbml0byAobWFuYWdlbWVudCkgc2Vzc2lvbnMgKi9cbmV4cG9ydCB0eXBlIENvZ25pdG9TZXNzaW9uU3RvcmFnZSA9IFNlc3Npb25TdG9yYWdlPENvZ25pdG9TZXNzaW9uSW5mbz47XG5cbi8qKiBUaGUgc2Vzc2lvbiBtYW5hZ2VyIGZvciBjb2duaXRvIChtYW5hZ2VtZW50KSBzZXNzaW9ucyAqL1xuZXhwb3J0IGNsYXNzIENvZ25pdG9TZXNzaW9uTWFuYWdlciBleHRlbmRzIE9yZ1Nlc3Npb25NYW5hZ2VyPENvZ25pdG9TZXNzaW9uSW5mbz4ge1xuICAjY2xpZW50OiBDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGN1cnJlbnQgYXV0aCB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gc2Vzc2lvbi5pZF90b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgY2xpZW50IHdpdGggdGhlIGN1cnJlbnQgc2Vzc2lvbiBhbmQgcmVmcmVzaGVzIHRoZSBjdXJyZW50XG4gICAqIHNlc3Npb24uXG4gICAqL1xuICBhc3luYyBjbGllbnQoKTogUHJvbWlzZTxDbGllbnQ+IHtcbiAgICB0aGlzLnJlZnJlc2hJZk5lZWRlZCgpO1xuICAgIHJldHVybiB0aGlzLiNjbGllbnQ7XG4gIH1cblxuICAvKiogUmV2b2tlcyB0aGUgc2Vzc2lvbi4gKi9cbiAgYXN5bmMgcmV2b2tlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGlkcCA9IHJlcXVpcmUoXCJAYXdzLXNkay9jbGllbnQtY29nbml0by1pZGVudGl0eS1wcm92aWRlclwiKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdmFyLXJlcXVpcmVzXG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBpZHAuQ29nbml0b0lkZW50aXR5UHJvdmlkZXJDbGllbnQoe1xuICAgICAgcmVnaW9uOiB0aGlzLmVudi5SZWdpb24sXG4gICAgICBzaWduZXI6IHsgc2lnbjogYXN5bmMgKHJlcXVlc3Q6IGFueSkgPT4gcmVxdWVzdCB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICB9KTtcbiAgICBjb25zdCBpbnB1dCA9IHtcbiAgICAgIFRva2VuOiBzZXNzaW9uLnJlZnJlc2hfdG9rZW4sXG4gICAgICBDbGllbnRJZDogdGhpcy5lbnYuQ2xpZW50SWQsXG4gICAgfTtcbiAgICBhd2FpdCBjbGllbnQuc2VuZChuZXcgaWRwLlJldm9rZVRva2VuQ29tbWFuZChpbnB1dCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgaXNTdGFsZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHRoaXMuaGFzRXhwaXJlZChuZXcgRGF0ZShzZXNzaW9uLmV4cGlyYXRpb24pLmdldFRpbWUoKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBzZXNzaW9uIGFuZCAqKlVQREFURVMvTVVUQVRFUyoqIHNlbGYuXG4gICAqL1xuICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGlkcCA9IHJlcXVpcmUoXCJAYXdzLXNkay9jbGllbnQtY29nbml0by1pZGVudGl0eS1wcm92aWRlclwiKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdmFyLXJlcXVpcmVzXG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBpZHAuQ29nbml0b0lkZW50aXR5UHJvdmlkZXJDbGllbnQoeyByZWdpb246IHRoaXMuZW52LlJlZ2lvbiB9KTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnNlbmQoXG4gICAgICBuZXcgaWRwLkluaXRpYXRlQXV0aENvbW1hbmQoe1xuICAgICAgICBBdXRoRmxvdzogXCJSRUZSRVNIX1RPS0VOX0FVVEhcIixcbiAgICAgICAgQXV0aFBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBSRUZSRVNIX1RPS0VOOiBzZXNzaW9uLnJlZnJlc2hfdG9rZW4sXG4gICAgICAgIH0sXG4gICAgICAgIENsaWVudElkOiB0aGlzLmVudi5DbGllbnRJZCxcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICBpZiAoXG4gICAgICAhcmVzcC5BdXRoZW50aWNhdGlvblJlc3VsdCB8fFxuICAgICAgIXJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuRXhwaXJlc0luIHx8XG4gICAgICAhcmVzcC5BdXRoZW50aWNhdGlvblJlc3VsdC5JZFRva2VuXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZWZyZXNoIGZhaWxlZFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBleHBpcmVzSW5NcyA9IHJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuRXhwaXJlc0luICogMTAwMDtcbiAgICBjb25zdCBleHBpcmF0aW9uID0gbmV3IERhdGUobmV3IERhdGUoKS5nZXRUaW1lKCkgKyBleHBpcmVzSW5NcykudG9JU09TdHJpbmcoKTtcbiAgICBjb25zdCBpZFRva2VuID0gcmVzcC5BdXRoZW50aWNhdGlvblJlc3VsdC5JZFRva2VuO1xuXG4gICAgYXdhaXQgdGhpcy5zdG9yYWdlLnNhdmUoPENvZ25pdG9TZXNzaW9uSW5mbz57XG4gICAgICAuLi5zZXNzaW9uLFxuICAgICAgaWRfdG9rZW46IGlkVG9rZW4sXG4gICAgICBhY2Nlc3NfdG9rZW46IHJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuQWNjZXNzVG9rZW4sXG4gICAgICBleHBpcmF0aW9uLFxuICAgIH0pO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KGlkVG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuIGV4aXN0aW5nIGNvZ25pdG8gKG1hbmFnZW1lbnQpIHNlc3Npb24gZnJvbSBzdG9yYWdlLlxuICAgKiBAcGFyYW0ge0NvZ25pdG9TZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHRva2VuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZEZyb21TdG9yYWdlKHN0b3JhZ2U6IENvZ25pdG9TZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8Q29nbml0b1Nlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgc2Vzc2lvbkluZm8gPSBhd2FpdCBzdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIG5ldyBDb2duaXRvU2Vzc2lvbk1hbmFnZXIoXG4gICAgICBzZXNzaW9uSW5mby5lbnZbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdLFxuICAgICAgc2Vzc2lvbkluZm8ub3JnX2lkLFxuICAgICAgc2Vzc2lvbkluZm8uaWRfdG9rZW4sXG4gICAgICBzdG9yYWdlLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3RpbmcgbWFuYWdlbWVudCBzZXNzaW9uIGFuZCBjcmVhdGVzIGEgQ29nbml0byBzZXNzaW9uIG1hbmFnZXIgZm9yIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge0NvZ25pdG9TZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBPcHRpb25hbCBzZXNzaW9uIHN0b3JhZ2UgdG8gbG9hZFxuICAgKiB0aGUgc2Vzc2lvbiBmcm9tLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbWFuYWdlbWVudCBzZXNzaW9uIGZyb20gdGhlIGNvbmZpZ1xuICAgKiBkaXJlY3Rvcnkgd2lsbCBiZSBsb2FkZWQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q29nbml0b1Nlc3Npb25NYW5hZ2VyPn0gQ29nbml0byBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkTWFuYWdlbWVudFNlc3Npb24oXG4gICAgc3RvcmFnZT86IENvZ25pdG9TZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxDb2duaXRvU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICByZXR1cm4gYXdhaXQgQ29nbml0b1Nlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShcbiAgICAgIHN0b3JhZ2UgPz8gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UocGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcIm1hbmFnZW1lbnQtc2Vzc2lvbi5qc29uXCIpKSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmcgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2Vzc2lvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gVGhlIGN1cnJlbnQgdG9rZW4gb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtDb2duaXRvU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgYmFjayBlbmQgdG8gdXNlXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBzdG9yYWdlOiBDb2duaXRvU2Vzc2lvblN0b3JhZ2UsXG4gICkge1xuICAgIHN1cGVyKGVudiwgb3JnSWQsIHN0b3JhZ2UpO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KHRva2VuKTtcbiAgfVxufVxuIl19