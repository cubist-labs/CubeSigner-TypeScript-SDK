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
        // trigger "session expired" if the session as a whole has expired
        // or if (for whatever reason) the token is still stale
        if (session_manager_1.SessionManager.hasExpired(__classPrivateFieldGet(this, _SignerSessionManager_client, "f").token_exp) ||
            (__classPrivateFieldGet(this, _SignerSessionManager_client, "f").session_exp && session_manager_1.SessionManager.hasExpired(__classPrivateFieldGet(this, _SignerSessionManager_client, "f").session_exp))) {
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
        return session_manager_1.SessionManager.isStale(__classPrivateFieldGet(this, _SignerSessionManager_client, "f").token_exp);
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
            token_exp: secondsSinceEpochToDate(newSession.session_info.auth_token_exp),
            session_exp: newSession.session_exp
                ? secondsSinceEpochToDate(newSession.session_exp)
                : undefined,
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
            session_exp: session.expiration,
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
            token_exp: secondsSinceEpochToDate(sessionData.session_info.auth_token_exp),
            session_exp: sessionData.session_exp
                ? secondsSinceEpochToDate(sessionData.session_exp)
                : undefined,
        }, "f");
    }
}
exports.SignerSessionManager = SignerSessionManager;
_SignerSessionManager_eventEmitter = new WeakMap(), _SignerSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBS0EsZ0NBQTBDO0FBQzFDLHVEQUE4RTtBQUM5RSx1REFBeUU7QUFDekUsc0NBQXlDO0FBbUJ6Qzs7OztHQUlHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FBQyxJQUFZO0lBQzNDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFrQkQsbUNBQW1DO0FBQ25DLE1BQWEsb0JBQXFCLFNBQVEsbUNBQW9DO0lBSTVFOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFN0Isa0VBQWtFO1FBQ2xFLHVEQUF1RDtRQUN2RCxJQUNFLGdDQUFjLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksb0NBQVEsQ0FBQyxTQUFTLENBQUM7WUFDakQsQ0FBQyx1QkFBQSxJQUFJLG9DQUFRLENBQUMsV0FBVyxJQUFJLGdDQUFjLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksb0NBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUNqRixDQUFDO1lBQ0QsTUFBTSx1QkFBQSxJQUFJLDBDQUFjLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNoRCxDQUFDO1FBRUQsT0FBTyx1QkFBQSxJQUFJLG9DQUFRLENBQUMsTUFBTSxDQUFDO0lBQzdCLENBQUM7SUFFRCwyQkFBMkI7SUFDM0IsS0FB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dFNlc3Npb25JbmZvLFxuICBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gIFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdCxcbn0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgQ2xpZW50LCBPcENsaWVudCB9IGZyb20gXCIuLi9hcGlcIjtcbmltcG9ydCB7IEhhc0VudiwgT3JnU2Vzc2lvbk1hbmFnZXIsIFNlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIi4vc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBNZW1vcnlTZXNzaW9uU3RvcmFnZSwgU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uX3N0b3JhZ2VcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2Ygb3VyIFwic2lnbmVyIHNlc3Npb25cIiBmaWxlIGZvcm1hdCAqL1xuZXhwb3J0IGludGVyZmFjZSBTaWduZXJTZXNzaW9uT2JqZWN0IHtcbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gSUQgKi9cbiAgb3JnX2lkOiBzdHJpbmc7XG4gIC8qKiBUaGUgcm9sZSBJRCAqL1xuICByb2xlX2lkPzogc3RyaW5nO1xuICAvKiogVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb24gdG9rZW4gKi9cbiAgcHVycG9zZT86IHN0cmluZztcbiAgLyoqIFRoZSB0b2tlbiB0byBpbmNsdWRlIGluIEF1dGhvcml6YXRpb24gaGVhZGVyICovXG4gIHRva2VuOiBzdHJpbmc7XG4gIC8qKiBTZXNzaW9uIGluZm8gKi9cbiAgc2Vzc2lvbl9pbmZvOiBDbGllbnRTZXNzaW9uSW5mbztcbiAgLyoqIFNlc3Npb24gZXhwaXJhdGlvbiAoaW4gc2Vjb25kcyBzaW5jZSBVTklYIGVwb2NoKSBiZXlvbmQgd2hpY2ggaXQgY2Fubm90IGJlIHJlZnJlc2hlZCAqL1xuICBzZXNzaW9uX2V4cDogbnVtYmVyIHwgdW5kZWZpbmVkOyAvLyBtYXkgYmUgbWlzc2luZyBpbiBsZWdhY3kgc2Vzc2lvbiBmaWxlc1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMge0BsaW5rIERhdGV9IGZyb20gYSBudW1iZXIgcmVwcmVzZW50aW5nIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzZWNzIFNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAqIEByZXR1cm4ge0RhdGV9IFRoZSBlcXVpdmFsZW50IGRhdGUuXG4gKi9cbmZ1bmN0aW9uIHNlY29uZHNTaW5jZUVwb2NoVG9EYXRlKHNlY3M6IG51bWJlcik6IERhdGUge1xuICByZXR1cm4gbmV3IERhdGUoc2VjcyAqIDEwMDApO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25EYXRhIGV4dGVuZHMgU2lnbmVyU2Vzc2lvbk9iamVjdCwgSGFzRW52IHt9XG5cbi8qKiBUeXBlIG9mIHN0b3JhZ2UgcmVxdWlyZWQgZm9yIHNpZ25lciBzZXNzaW9ucyAqL1xuZXhwb3J0IHR5cGUgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxTaWduZXJTZXNzaW9uRGF0YT47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbkxpZmV0aW1lIHtcbiAgLyoqIFNlc3Npb24gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgd2VlayAoNjA0ODAwKS4gKi9cbiAgc2Vzc2lvbj86IG51bWJlcjtcbiAgLyoqIEF1dGggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBmaXZlIG1pbnV0ZXMgKDMwMCkuICovXG4gIGF1dGg6IG51bWJlcjtcbiAgLyoqIFJlZnJlc2ggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgZGF5ICg4NjQwMCkuICovXG4gIHJlZnJlc2g/OiBudW1iZXI7XG4gIC8qKiBHcmFjZSBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIDMwIHNlY29uZHMgKDMwKS4gKi9cbiAgZ3JhY2U/OiBudW1iZXI7XG59XG5cbi8qKiBNYW5hZ2VyIGZvciBzaWduZXIgc2Vzc2lvbnMuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBPcmdTZXNzaW9uTWFuYWdlcjxTaWduZXJTZXNzaW9uRGF0YT4ge1xuICByZWFkb25seSAjZXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXI7XG4gICNjbGllbnQ6IHsgY2xpZW50OiBDbGllbnQ7IHRva2VuX2V4cDogRGF0ZTsgc2Vzc2lvbl9leHA/OiBEYXRlIH07XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGN1cnJlbnQgYXV0aCB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gc2Vzc2lvbi50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIGN1cnJlbnQgc2Vzc2lvbiBpZiBuZWVkZWQsIHRoZW4gcmV0dXJucyBhIGNsaWVudCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBNYXkgKipVUERBVEUvTVVUQVRFKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIGNsaWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG5cbiAgICAvLyB0cmlnZ2VyIFwic2Vzc2lvbiBleHBpcmVkXCIgaWYgdGhlIHNlc3Npb24gYXMgYSB3aG9sZSBoYXMgZXhwaXJlZFxuICAgIC8vIG9yIGlmIChmb3Igd2hhdGV2ZXIgcmVhc29uKSB0aGUgdG9rZW4gaXMgc3RpbGwgc3RhbGVcbiAgICBpZiAoXG4gICAgICBTZXNzaW9uTWFuYWdlci5oYXNFeHBpcmVkKHRoaXMuI2NsaWVudC50b2tlbl9leHApIHx8XG4gICAgICAodGhpcy4jY2xpZW50LnNlc3Npb25fZXhwICYmIFNlc3Npb25NYW5hZ2VyLmhhc0V4cGlyZWQodGhpcy4jY2xpZW50LnNlc3Npb25fZXhwKSlcbiAgICApIHtcbiAgICAgIGF3YWl0IHRoaXMuI2V2ZW50RW1pdHRlci5lbWl0U2Vzc2lvbkV4cGlyZWQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4jY2xpZW50LmNsaWVudDtcbiAgfVxuXG4gIC8qKiBSZXZva2VzIHRoZSBzZXNzaW9uLiAqL1xuICBhc3luYyByZXZva2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IE9wQ2xpZW50KFwicmV2b2tlQ3VycmVudFNlc3Npb25cIiwgYXdhaXQgdGhpcy5jbGllbnQoKSwgdGhpcy4jZXZlbnRFbWl0dGVyKTtcbiAgICBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uL3NlbGZcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGlzU3RhbGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIFNlc3Npb25NYW5hZ2VyLmlzU3RhbGUodGhpcy4jY2xpZW50LnRva2VuX2V4cCk7XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBzZXNzaW9uIGFuZCAqKlVQREFURVMvTVVUQVRFUyoqIHNlbGYuXG4gICAqL1xuICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGN1cnJTZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG5cbiAgICBjb25zdCBjbGllbnQgPSBuZXcgT3BDbGllbnQoXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiLCB0aGlzLiNjbGllbnQuY2xpZW50LCB0aGlzLiNldmVudEVtaXR0ZXIpO1xuICAgIGNvbnN0IGNzaSA9IGN1cnJTZXNzaW9uLnNlc3Npb25faW5mbztcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YxL29yZy97b3JnX2lkfS90b2tlbi9yZWZyZXNoXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiA8UmVmcmVzaFNpZ25lclNlc3Npb25SZXF1ZXN0PntcbiAgICAgICAgZXBvY2hfbnVtOiBjc2kuZXBvY2gsXG4gICAgICAgIGVwb2NoX3Rva2VuOiBjc2kuZXBvY2hfdG9rZW4sXG4gICAgICAgIG90aGVyX3Rva2VuOiBjc2kucmVmcmVzaF90b2tlbixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgbmV3U2Vzc2lvbiA9IDxTaWduZXJTZXNzaW9uRGF0YT57XG4gICAgICAuLi5jdXJyU2Vzc2lvbixcbiAgICAgIHNlc3Npb25faW5mbzogZGF0YS5zZXNzaW9uX2luZm8sXG4gICAgICB0b2tlbjogZGF0YS50b2tlbixcbiAgICB9O1xuXG4gICAgYXdhaXQgdGhpcy5zdG9yYWdlLnNhdmUobmV3U2Vzc2lvbik7XG4gICAgdGhpcy4jY2xpZW50ID0ge1xuICAgICAgY2xpZW50OiB0aGlzLmNyZWF0ZUNsaWVudChuZXdTZXNzaW9uLnRva2VuKSxcbiAgICAgIHRva2VuX2V4cDogc2Vjb25kc1NpbmNlRXBvY2hUb0RhdGUobmV3U2Vzc2lvbi5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHApLFxuICAgICAgc2Vzc2lvbl9leHA6IG5ld1Nlc3Npb24uc2Vzc2lvbl9leHBcbiAgICAgICAgPyBzZWNvbmRzU2luY2VFcG9jaFRvRGF0ZShuZXdTZXNzaW9uLnNlc3Npb25fZXhwKVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtOZXdTZXNzaW9uUmVzcG9uc2V9IHNlc3Npb24gVGhlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgdG8gdXNlIGZvciBzYXZpbmcgdGhlIHNlc3Npb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBOZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVGcm9tU2Vzc2lvbkluZm8oXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzZXNzaW9uOiBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gICAgc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgc2Vzc2lvbkRhdGEgPSB7XG4gICAgICBlbnY6IHtcbiAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogZW52LFxuICAgICAgfSxcbiAgICAgIG9yZ19pZDogb3JnSWQsXG4gICAgICB0b2tlbjogc2Vzc2lvbi50b2tlbixcbiAgICAgIHB1cnBvc2U6IFwic2lnbiB2aWEgb2lkY1wiLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBzZXNzaW9uLnNlc3Npb25faW5mbyxcbiAgICAgIHNlc3Npb25fZXhwOiBzZXNzaW9uLmV4cGlyYXRpb24hLFxuICAgIH07XG4gICAgc3RvcmFnZSA/Pz0gbmV3IE1lbW9yeVNlc3Npb25TdG9yYWdlKCk7XG4gICAgYXdhaXQgc3RvcmFnZS5zYXZlKHNlc3Npb25EYXRhKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkRhdGF9IHNlc3Npb25EYXRhIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzdG9yYWdlIHRvIHVzZSBmb3Igc2F2aW5nIHRoZSBzZXNzaW9uLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPn0gTmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXIuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlRnJvbVNlc3Npb25EYXRhKFxuICAgIHNlc3Npb25EYXRhOiBTaWduZXJTZXNzaW9uRGF0YSxcbiAgICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBzdG9yYWdlID8/PSBuZXcgTWVtb3J5U2Vzc2lvblN0b3JhZ2UoKTtcbiAgICBhd2FpdCBzdG9yYWdlLnNhdmUoc2Vzc2lvbkRhdGEpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlcyBhbiBleGlzdGluZyBzZXNzaW9uIHRvIGNyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzZXNzaW9uIHN0b3JhZ2UgdG8gdXNlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2luZ2VyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZEZyb21TdG9yYWdlKHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBzdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uTWFuYWdlcihzZXNzaW9uLCBzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uRGF0YX0gc2Vzc2lvbkRhdGEgU2Vzc2lvbiBkYXRhXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2UuXG4gICAqL1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3Ioc2Vzc2lvbkRhdGE6IFNpZ25lclNlc3Npb25EYXRhLCBzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSkge1xuICAgIHN1cGVyKHNlc3Npb25EYXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0sIHNlc3Npb25EYXRhLm9yZ19pZCwgc3RvcmFnZSk7XG4gICAgdGhpcy4jZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcihbdGhpcy5ldmVudHNdKTtcbiAgICB0aGlzLiNjbGllbnQgPSB7XG4gICAgICBjbGllbnQ6IHRoaXMuY3JlYXRlQ2xpZW50KHNlc3Npb25EYXRhLnRva2VuKSxcbiAgICAgIHRva2VuX2V4cDogc2Vjb25kc1NpbmNlRXBvY2hUb0RhdGUoc2Vzc2lvbkRhdGEuc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwKSxcbiAgICAgIHNlc3Npb25fZXhwOiBzZXNzaW9uRGF0YS5zZXNzaW9uX2V4cFxuICAgICAgICA/IHNlY29uZHNTaW5jZUVwb2NoVG9EYXRlKHNlc3Npb25EYXRhLnNlc3Npb25fZXhwKVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG59XG4iXX0=