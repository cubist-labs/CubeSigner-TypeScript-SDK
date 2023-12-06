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
var _SignerSessionManager_eventEmitter, _SignerSessionManager_client;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerSessionManager = void 0;
const api_1 = require("../api");
const session_manager_1 = require("./session_manager");
const session_storage_1 = require("./session_storage");
const events_1 = require("../events");
/**
 * Constructs {@link Date} from a number representing seconds since unix epoch.
 * @param {number} secs Seconds since unix epoch.
 * @return {Date} The equivalent date.
 */
function secondsSinceEpochToDate(secs) {
    return new Date(secs * 1000);
}
/** Manager for signer sessions. */
class SignerSessionManager extends session_manager_1.OrgSessionManager {
    /**
     * @return {string} The current auth token.
     * @internal
     */
    async token() {
        const session = await this.storage.retrieve();
        return session.token;
    }
    /**
     * Refreshes the current session if needed, then returns a client using the current session.
     *
     * May **UPDATE/MUTATE** self.
     */
    async client() {
        await this.refreshIfNeeded();
        // trigger "session expired" if for whatever reason the token is still stale
        if (session_manager_1.SessionManager.hasExpired(__classPrivateFieldGet(this, _SignerSessionManager_client, "f").exp, /* buffer */ 0)) {
            await __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f").emitSessionExpired();
        }
        return __classPrivateFieldGet(this, _SignerSessionManager_client, "f").client;
    }
    /** Revokes the session. */
    async revoke() {
        const client = new api_1.OpClient("revokeCurrentSession", await this.client(), __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f"));
        await client.del("/v0/org/{org_id}/session/self", {
            params: { path: { org_id: this.orgId } },
        });
    }
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    async isStale() {
        return session_manager_1.SessionManager.hasExpired(__classPrivateFieldGet(this, _SignerSessionManager_client, "f").exp);
    }
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    async refresh() {
        const currSession = await this.storage.retrieve();
        const client = new api_1.OpClient("signerSessionRefresh", __classPrivateFieldGet(this, _SignerSessionManager_client, "f").client, __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f"));
        const csi = currSession.session_info;
        const data = await client.patch("/v1/org/{org_id}/token/refresh", {
            params: { path: { org_id: this.orgId } },
            body: {
                epoch_num: csi.epoch,
                epoch_token: csi.epoch_token,
                other_token: csi.refresh_token,
            },
        });
        const newSession = {
            ...currSession,
            session_info: data.session_info,
            token: data.token,
        };
        await this.storage.save(newSession);
        __classPrivateFieldSet(this, _SignerSessionManager_client, {
            client: this.createClient(newSession.token),
            exp: secondsSinceEpochToDate(newSession.session_info.auth_token_exp),
        }, "f");
    }
    /**
     * @param {EnvInterface} env The CubeSigner environment
     * @param {string} orgId The organization ID
     * @param {NewSessionResponse} session The session information.
     * @param {SignerSessionStorage} storage The storage to use for saving the session.
     * @return {Promise<SignerSessionManager>} New signer session manager.
     */
    static async createFromSessionInfo(env, orgId, session, storage) {
        const sessionData = {
            env: {
                ["Dev-CubeSignerStack"]: env,
            },
            org_id: orgId,
            token: session.token,
            purpose: "sign via oidc",
            session_info: session.session_info,
        };
        storage ??= new session_storage_1.MemorySessionStorage();
        await storage.save(sessionData);
        return await SignerSessionManager.loadFromStorage(storage);
    }
    /**
     * @param {SignerSessionData} sessionData The session information.
     * @param {SignerSessionStorage} storage The storage to use for saving the session.
     * @return {Promise<SignerSessionManager>} New signer session manager.
     */
    static async createFromSessionData(sessionData, storage) {
        storage ??= new session_storage_1.MemorySessionStorage();
        await storage.save(sessionData);
        return await SignerSessionManager.loadFromStorage(storage);
    }
    /**
     * Uses an existing session to create a new signer session manager.
     *
     * @param {SignerSessionStorage} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session manager
     */
    static async loadFromStorage(storage) {
        const session = await storage.retrieve();
        return new SignerSessionManager(session, storage);
    }
    /**
     * Constructor.
     *
     * @param {SignerSessionData} sessionData Session data
     * @param {SignerSessionStorage} storage The session storage to use.
     */
    constructor(sessionData, storage) {
        super(sessionData.env["Dev-CubeSignerStack"], sessionData.org_id, storage);
        _SignerSessionManager_eventEmitter.set(this, void 0);
        _SignerSessionManager_client.set(this, void 0);
        __classPrivateFieldSet(this, _SignerSessionManager_eventEmitter, new events_1.EventEmitter([this.events]), "f");
        __classPrivateFieldSet(this, _SignerSessionManager_client, {
            client: this.createClient(sessionData.token),
            exp: secondsSinceEpochToDate(sessionData.session_info.auth_token_exp),
        }, "f");
    }
}
exports.SignerSessionManager = SignerSessionManager;
_SignerSessionManager_eventEmitter = new WeakMap(), _SignerSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBS0EsZ0NBQTBDO0FBQzFDLHVEQUE4RTtBQUM5RSx1REFBeUU7QUFDekUsc0NBQXlDO0FBaUJ6Qzs7OztHQUlHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FBQyxJQUFZO0lBQzNDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFrQkQsbUNBQW1DO0FBQ25DLE1BQWEsb0JBQXFCLFNBQVEsbUNBQW9DO0lBSTVFOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFN0IsNEVBQTRFO1FBQzVFLElBQUksZ0NBQWMsQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxvQ0FBUSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNoRSxNQUFNLHVCQUFBLElBQUksMENBQWMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ2hELENBQUM7UUFFRCxPQUFPLHVCQUFBLElBQUksb0NBQVEsQ0FBQyxNQUFNLENBQUM7SUFDN0IsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sTUFBTSxHQUFHLElBQUksY0FBUSxDQUFDLHNCQUFzQixFQUFFLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLHVCQUFB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NkI7UUFDeEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekMsT0FBTyxJQUFJLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFzQixXQUE4QixFQUFFLE9BQTZCO1FBQ2pGLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQXJJcEUscURBQTRCO1FBQ3JDLCtDQUF1QztRQXFJckMsdUJBQUEsSUFBSSxzQ0FBaUIsSUFBSSxxQkFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQUEsQ0FBQztRQUNyRCx1QkFBQSxJQUFJLGdDQUFXO1lBQ2IsTUFBTSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUM1QyxHQUFHLEVBQUUsdUJBQXVCLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUM7U0FDdEUsTUFBQSxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBN0lELG9EQTZJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENsaWVudFNlc3Npb25JbmZvLFxuICBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gIFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdCxcbn0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgQ2xpZW50LCBPcENsaWVudCB9IGZyb20gXCIuLi9hcGlcIjtcbmltcG9ydCB7IEhhc0VudiwgT3JnU2Vzc2lvbk1hbmFnZXIsIFNlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIi4vc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBNZW1vcnlTZXNzaW9uU3RvcmFnZSwgU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uX3N0b3JhZ2VcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2Ygb3VyIFwic2lnbmVyIHNlc3Npb25cIiBmaWxlIGZvcm1hdCAqL1xuZXhwb3J0IGludGVyZmFjZSBTaWduZXJTZXNzaW9uT2JqZWN0IHtcbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gSUQgKi9cbiAgb3JnX2lkOiBzdHJpbmc7XG4gIC8qKiBUaGUgcm9sZSBJRCAqL1xuICByb2xlX2lkPzogc3RyaW5nO1xuICAvKiogVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb24gdG9rZW4gKi9cbiAgcHVycG9zZT86IHN0cmluZztcbiAgLyoqIFRoZSB0b2tlbiB0byBpbmNsdWRlIGluIEF1dGhvcml6YXRpb24gaGVhZGVyICovXG4gIHRva2VuOiBzdHJpbmc7XG4gIC8qKiBTZXNzaW9uIGluZm8gKi9cbiAgc2Vzc2lvbl9pbmZvOiBDbGllbnRTZXNzaW9uSW5mbztcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIHtAbGluayBEYXRlfSBmcm9tIGEgbnVtYmVyIHJlcHJlc2VudGluZyBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guXG4gKiBAcGFyYW0ge251bWJlcn0gc2VjcyBTZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guXG4gKiBAcmV0dXJuIHtEYXRlfSBUaGUgZXF1aXZhbGVudCBkYXRlLlxuICovXG5mdW5jdGlvbiBzZWNvbmRzU2luY2VFcG9jaFRvRGF0ZShzZWNzOiBudW1iZXIpOiBEYXRlIHtcbiAgcmV0dXJuIG5ldyBEYXRlKHNlY3MgKiAxMDAwKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaWduZXJTZXNzaW9uRGF0YSBleHRlbmRzIFNpZ25lclNlc3Npb25PYmplY3QsIEhhc0VudiB7fVxuXG4vKiogVHlwZSBvZiBzdG9yYWdlIHJlcXVpcmVkIGZvciBzaWduZXIgc2Vzc2lvbnMgKi9cbmV4cG9ydCB0eXBlIFNpZ25lclNlc3Npb25TdG9yYWdlID0gU2Vzc2lvblN0b3JhZ2U8U2lnbmVyU2Vzc2lvbkRhdGE+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25MaWZldGltZSB7XG4gIC8qKiBTZXNzaW9uIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIHdlZWsgKDYwNDgwMCkuICovXG4gIHNlc3Npb24/OiBudW1iZXI7XG4gIC8qKiBBdXRoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gZml2ZSBtaW51dGVzICgzMDApLiAqL1xuICBhdXRoOiBudW1iZXI7XG4gIC8qKiBSZWZyZXNoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIGRheSAoODY0MDApLiAqL1xuICByZWZyZXNoPzogbnVtYmVyO1xuICAvKiogR3JhY2UgbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byAzMCBzZWNvbmRzICgzMCkuICovXG4gIGdyYWNlPzogbnVtYmVyO1xufVxuXG4vKiogTWFuYWdlciBmb3Igc2lnbmVyIHNlc3Npb25zLiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lclNlc3Npb25NYW5hZ2VyIGV4dGVuZHMgT3JnU2Vzc2lvbk1hbmFnZXI8U2lnbmVyU2Vzc2lvbkRhdGE+IHtcbiAgcmVhZG9ubHkgI2V2ZW50RW1pdHRlcjogRXZlbnRFbWl0dGVyO1xuICAjY2xpZW50OiB7IGNsaWVudDogQ2xpZW50OyBleHA6IERhdGUgfTtcblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3VycmVudCBhdXRoIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBzZXNzaW9uLnRva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgY3VycmVudCBzZXNzaW9uIGlmIG5lZWRlZCwgdGhlbiByZXR1cm5zIGEgY2xpZW50IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIE1heSAqKlVQREFURS9NVVRBVEUqKiBzZWxmLlxuICAgKi9cbiAgYXN5bmMgY2xpZW50KCk6IFByb21pc2U8Q2xpZW50PiB7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoSWZOZWVkZWQoKTtcblxuICAgIC8vIHRyaWdnZXIgXCJzZXNzaW9uIGV4cGlyZWRcIiBpZiBmb3Igd2hhdGV2ZXIgcmVhc29uIHRoZSB0b2tlbiBpcyBzdGlsbCBzdGFsZVxuICAgIGlmIChTZXNzaW9uTWFuYWdlci5oYXNFeHBpcmVkKHRoaXMuI2NsaWVudC5leHAsIC8qIGJ1ZmZlciAqLyAwKSkge1xuICAgICAgYXdhaXQgdGhpcy4jZXZlbnRFbWl0dGVyLmVtaXRTZXNzaW9uRXhwaXJlZCgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLiNjbGllbnQuY2xpZW50O1xuICB9XG5cbiAgLyoqIFJldm9rZXMgdGhlIHNlc3Npb24uICovXG4gIGFzeW5jIHJldm9rZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgT3BDbGllbnQoXCJyZXZva2VDdXJyZW50U2Vzc2lvblwiLCBhd2FpdCB0aGlzLmNsaWVudCgpLCB0aGlzLiNldmVudEVtaXR0ZXIpO1xuICAgIGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb24vc2VsZlwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgaXNTdGFsZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gU2Vzc2lvbk1hbmFnZXIuaGFzRXhwaXJlZCh0aGlzLiNjbGllbnQuZXhwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24gYW5kICoqVVBEQVRFUy9NVVRBVEVTKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY3VyclNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcblxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBPcENsaWVudChcInNpZ25lclNlc3Npb25SZWZyZXNoXCIsIHRoaXMuI2NsaWVudC5jbGllbnQsIHRoaXMuI2V2ZW50RW1pdHRlcik7XG4gICAgY29uc3QgY3NpID0gY3VyclNlc3Npb24uc2Vzc2lvbl9pbmZvO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjEvb3JnL3tvcmdfaWR9L3Rva2VuL3JlZnJlc2hcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IDxSZWZyZXNoU2lnbmVyU2Vzc2lvblJlcXVlc3Q+e1xuICAgICAgICBlcG9jaF9udW06IGNzaS5lcG9jaCxcbiAgICAgICAgZXBvY2hfdG9rZW46IGNzaS5lcG9jaF90b2tlbixcbiAgICAgICAgb3RoZXJfdG9rZW46IGNzaS5yZWZyZXNoX3Rva2VuLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBuZXdTZXNzaW9uID0gPFNpZ25lclNlc3Npb25EYXRhPntcbiAgICAgIC4uLmN1cnJTZXNzaW9uLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBkYXRhLnNlc3Npb25faW5mbyxcbiAgICAgIHRva2VuOiBkYXRhLnRva2VuLFxuICAgIH07XG5cbiAgICBhd2FpdCB0aGlzLnN0b3JhZ2Uuc2F2ZShuZXdTZXNzaW9uKTtcbiAgICB0aGlzLiNjbGllbnQgPSB7XG4gICAgICBjbGllbnQ6IHRoaXMuY3JlYXRlQ2xpZW50KG5ld1Nlc3Npb24udG9rZW4pLFxuICAgICAgZXhwOiBzZWNvbmRzU2luY2VFcG9jaFRvRGF0ZShuZXdTZXNzaW9uLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cCksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBDdWJlU2lnbmVyIGVudmlyb25tZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7TmV3U2Vzc2lvblJlc3BvbnNlfSBzZXNzaW9uIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzdG9yYWdlIHRvIHVzZSBmb3Igc2F2aW5nIHRoZSBzZXNzaW9uLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPn0gTmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXIuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlRnJvbVNlc3Npb25JbmZvKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2Vzc2lvbjogTmV3U2Vzc2lvblJlc3BvbnNlLFxuICAgIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHNlc3Npb25EYXRhID0ge1xuICAgICAgZW52OiB7XG4gICAgICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IGVudixcbiAgICAgIH0sXG4gICAgICBvcmdfaWQ6IG9yZ0lkLFxuICAgICAgdG9rZW46IHNlc3Npb24udG9rZW4sXG4gICAgICBwdXJwb3NlOiBcInNpZ24gdmlhIG9pZGNcIixcbiAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbi5zZXNzaW9uX2luZm8sXG4gICAgfTtcbiAgICBzdG9yYWdlID8/PSBuZXcgTWVtb3J5U2Vzc2lvblN0b3JhZ2UoKTtcbiAgICBhd2FpdCBzdG9yYWdlLnNhdmUoc2Vzc2lvbkRhdGEpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uRGF0YX0gc2Vzc2lvbkRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgdG8gdXNlIGZvciBzYXZpbmcgdGhlIHNlc3Npb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBOZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVGcm9tU2Vzc2lvbkRhdGEoXG4gICAgc2Vzc2lvbkRhdGE6IFNpZ25lclNlc3Npb25EYXRhLFxuICAgIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIHN0b3JhZ2UgPz89IG5ldyBNZW1vcnlTZXNzaW9uU3RvcmFnZSgpO1xuICAgIGF3YWl0IHN0b3JhZ2Uuc2F2ZShzZXNzaW9uRGF0YSk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VzIGFuIGV4aXN0aW5nIHNlc3Npb24gdG8gY3JlYXRlIGEgbmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gbmV3IFNpZ25lclNlc3Npb25NYW5hZ2VyKHNlc3Npb24sIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25EYXRhfSBzZXNzaW9uRGF0YSBTZXNzaW9uIGRhdGFcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZS5cbiAgICovXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzZXNzaW9uRGF0YTogU2lnbmVyU2Vzc2lvbkRhdGEsIHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKSB7XG4gICAgc3VwZXIoc2Vzc2lvbkRhdGEuZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXSwgc2Vzc2lvbkRhdGEub3JnX2lkLCBzdG9yYWdlKTtcbiAgICB0aGlzLiNldmVudEVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKFt0aGlzLmV2ZW50c10pO1xuICAgIHRoaXMuI2NsaWVudCA9IHtcbiAgICAgIGNsaWVudDogdGhpcy5jcmVhdGVDbGllbnQoc2Vzc2lvbkRhdGEudG9rZW4pLFxuICAgICAgZXhwOiBzZWNvbmRzU2luY2VFcG9jaFRvRGF0ZShzZXNzaW9uRGF0YS5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHApLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==