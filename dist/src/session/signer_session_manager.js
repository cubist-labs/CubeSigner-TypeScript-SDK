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
const error_1 = require("../error");
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
     *
     * @param {operations} operation The operation that this client will be
     *   used for. This parameter is used exclusively for more accurate error
     *   reporting and does not affect functionality.
     * @return {Client} The client with the current session
     */
    async client(operation) {
        await this.refreshIfNeeded();
        // trigger "session expired" if the session as a whole has expired
        // or if (for whatever reason) the token is still stale
        if (session_manager_1.SessionManager.hasExpired(__classPrivateFieldGet(this, _SignerSessionManager_client, "f").token_exp) || this.hasExpired()) {
            await __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f").emitSessionExpired();
            throw new error_1.SessionExpiredError(operation);
        }
        return __classPrivateFieldGet(this, _SignerSessionManager_client, "f").client;
    }
    /** Revoke the session. */
    async revoke() {
        const client = new api_1.OpClient("revokeCurrentSession", await this.client(), __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f"));
        await client.del("/v0/org/{org_id}/session/self", {
            params: { path: { org_id: this.orgId } },
        });
    }
    /**
     * Return whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    async isStale() {
        return session_manager_1.SessionManager.isStale(__classPrivateFieldGet(this, _SignerSessionManager_client, "f").token_exp);
    }
    /**
     * Return whether this session has expired and cannot be refreshed anymore.
     * @return {boolean} Whether this session has expired.
     * @internal
     */
    hasExpired() {
        return ((__classPrivateFieldGet(this, _SignerSessionManager_client, "f").session_exp || false) && session_manager_1.SessionManager.hasExpired(__classPrivateFieldGet(this, _SignerSessionManager_client, "f").session_exp));
    }
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    async refresh() {
        if (this.hasExpired()) {
            await __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f").emitSessionExpired();
            throw new error_1.SessionExpiredError("signerSessionRefresh");
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBS0EsZ0NBQTBDO0FBQzFDLHVEQUE4RTtBQUM5RSx1REFBeUU7QUFDekUsc0NBQXlDO0FBRXpDLG9DQUErQztBQW1CL0M7Ozs7R0FJRztBQUNILFNBQVMsdUJBQXVCLENBQUMsSUFBWTtJQUMzQyxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBa0JELG1DQUFtQztBQUNuQyxNQUFhLG9CQUFxQixTQUFRLG1DQUFvQztJQUk1RTs7O09BR0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBNEI7UUFDdkMsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFN0Isa0VBQWtFO1FBQ2xFLHVEQUF1RDtRQUN2RCxJQUFJLGdDQUFjLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksb0NBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztZQUMzRSxNQUFNLHVCQUFBLElBQUksMENBQWMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzlDLE1BQU0sSUFBSSwyQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsT0FBTyx1QkFBQSxJQUFJLG9DQUFRLENBQUMsTUFBTSxDQUFDO0lBQzdCLENBQUM7SUFFRCwwQkFBMEI7SUFDMUIsS0FBSyxD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LElBQUksZ0NBQVc7WUFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQzVDLFNBQVMsRUFBRSx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQztZQUMzRSxXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7Z0JBQ2xDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO2dCQUNsRCxDQUFDLENBQUMsU0FBUztTQUNkLE1BQUEsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTNLRCxvREEyS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDbGllbnRTZXNzaW9uSW5mbyxcbiAgTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBSZWZyZXNoU2lnbmVyU2Vzc2lvblJlcXVlc3QsXG59IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IENsaWVudCwgT3BDbGllbnQgfSBmcm9tIFwiLi4vYXBpXCI7XG5pbXBvcnQgeyBIYXNFbnYsIE9yZ1Nlc3Npb25NYW5hZ2VyLCBTZXNzaW9uTWFuYWdlciB9IGZyb20gXCIuL3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHsgTWVtb3J5U2Vzc2lvblN0b3JhZ2UsIFNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbl9zdG9yYWdlXCI7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5pbXBvcnQgeyBTZXNzaW9uRXhwaXJlZEVycm9yIH0gZnJvbSBcIi4uL2Vycm9yXCI7XG5pbXBvcnQgeyBvcGVyYXRpb25zIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiBvdXIgXCJzaWduZXIgc2Vzc2lvblwiIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25PYmplY3Qge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIElEICovXG4gIHJvbGVfaWQ/OiBzdHJpbmc7XG4gIC8qKiBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvbiB0b2tlbiAqL1xuICBwdXJwb3NlPzogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFNlc3Npb24gaW5mbyAqL1xuICBzZXNzaW9uX2luZm86IENsaWVudFNlc3Npb25JbmZvO1xuICAvKiogU2Vzc2lvbiBleHBpcmF0aW9uIChpbiBzZWNvbmRzIHNpbmNlIFVOSVggZXBvY2gpIGJleW9uZCB3aGljaCBpdCBjYW5ub3QgYmUgcmVmcmVzaGVkICovXG4gIHNlc3Npb25fZXhwOiBudW1iZXIgfCB1bmRlZmluZWQ7IC8vIG1heSBiZSBtaXNzaW5nIGluIGxlZ2FjeSBzZXNzaW9uIGZpbGVzXG59XG5cbi8qKlxuICogQ29uc3RydWN0cyB7QGxpbmsgRGF0ZX0gZnJvbSBhIG51bWJlciByZXByZXNlbnRpbmcgc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLlxuICogQHBhcmFtIHtudW1iZXJ9IHNlY3MgU2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLlxuICogQHJldHVybiB7RGF0ZX0gVGhlIGVxdWl2YWxlbnQgZGF0ZS5cbiAqL1xuZnVuY3Rpb24gc2Vjb25kc1NpbmNlRXBvY2hUb0RhdGUoc2VjczogbnVtYmVyKTogRGF0ZSB7XG4gIHJldHVybiBuZXcgRGF0ZShzZWNzICogMTAwMCk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbkRhdGEgZXh0ZW5kcyBTaWduZXJTZXNzaW9uT2JqZWN0LCBIYXNFbnYge31cblxuLyoqIFR5cGUgb2Ygc3RvcmFnZSByZXF1aXJlZCBmb3Igc2lnbmVyIHNlc3Npb25zICovXG5leHBvcnQgdHlwZSBTaWduZXJTZXNzaW9uU3RvcmFnZSA9IFNlc3Npb25TdG9yYWdlPFNpZ25lclNlc3Npb25EYXRhPjtcblxuZXhwb3J0IGludGVyZmFjZSBTaWduZXJTZXNzaW9uTGlmZXRpbWUge1xuICAvKiogU2Vzc2lvbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIG9uZSB3ZWVrICg2MDQ4MDApLiAqL1xuICBzZXNzaW9uPzogbnVtYmVyO1xuICAvKiogQXV0aCB0b2tlbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIGZpdmUgbWludXRlcyAoMzAwKS4gKi9cbiAgYXV0aDogbnVtYmVyO1xuICAvKiogUmVmcmVzaCB0b2tlbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIG9uZSBkYXkgKDg2NDAwKS4gKi9cbiAgcmVmcmVzaD86IG51bWJlcjtcbiAgLyoqIEdyYWNlIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gMzAgc2Vjb25kcyAoMzApLiAqL1xuICBncmFjZT86IG51bWJlcjtcbn1cblxuLyoqIE1hbmFnZXIgZm9yIHNpZ25lciBzZXNzaW9ucy4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXJTZXNzaW9uTWFuYWdlciBleHRlbmRzIE9yZ1Nlc3Npb25NYW5hZ2VyPFNpZ25lclNlc3Npb25EYXRhPiB7XG4gIHJlYWRvbmx5ICNldmVudEVtaXR0ZXI6IEV2ZW50RW1pdHRlcjtcbiAgI2NsaWVudDogeyBjbGllbnQ6IENsaWVudDsgdG9rZW5fZXhwOiBEYXRlOyBzZXNzaW9uX2V4cD86IERhdGUgfTtcblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3VycmVudCBhdXRoIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBzZXNzaW9uLnRva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgY3VycmVudCBzZXNzaW9uIGlmIG5lZWRlZCwgdGhlbiByZXR1cm5zIGEgY2xpZW50IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIE1heSAqKlVQREFURS9NVVRBVEUqKiBzZWxmLlxuICAgKlxuICAgKiBAcGFyYW0ge29wZXJhdGlvbnN9IG9wZXJhdGlvbiBUaGUgb3BlcmF0aW9uIHRoYXQgdGhpcyBjbGllbnQgd2lsbCBiZVxuICAgKiAgIHVzZWQgZm9yLiBUaGlzIHBhcmFtZXRlciBpcyB1c2VkIGV4Y2x1c2l2ZWx5IGZvciBtb3JlIGFjY3VyYXRlIGVycm9yXG4gICAqICAgcmVwb3J0aW5nIGFuZCBkb2VzIG5vdCBhZmZlY3QgZnVuY3Rpb25hbGl0eS5cbiAgICogQHJldHVybiB7Q2xpZW50fSBUaGUgY2xpZW50IHdpdGggdGhlIGN1cnJlbnQgc2Vzc2lvblxuICAgKi9cbiAgYXN5bmMgY2xpZW50KG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnMpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG5cbiAgICAvLyB0cmlnZ2VyIFwic2Vzc2lvbiBleHBpcmVkXCIgaWYgdGhlIHNlc3Npb24gYXMgYSB3aG9sZSBoYXMgZXhwaXJlZFxuICAgIC8vIG9yIGlmIChmb3Igd2hhdGV2ZXIgcmVhc29uKSB0aGUgdG9rZW4gaXMgc3RpbGwgc3RhbGVcbiAgICBpZiAoU2Vzc2lvbk1hbmFnZXIuaGFzRXhwaXJlZCh0aGlzLiNjbGllbnQudG9rZW5fZXhwKSB8fCB0aGlzLmhhc0V4cGlyZWQoKSkge1xuICAgICAgYXdhaXQgdGhpcy4jZXZlbnRFbWl0dGVyLmVtaXRTZXNzaW9uRXhwaXJlZCgpO1xuICAgICAgdGhyb3cgbmV3IFNlc3Npb25FeHBpcmVkRXJyb3Iob3BlcmF0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4jY2xpZW50LmNsaWVudDtcbiAgfVxuXG4gIC8qKiBSZXZva2UgdGhlIHNlc3Npb24uICovXG4gIGFzeW5jIHJldm9rZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgT3BDbGllbnQoXCJyZXZva2VDdXJyZW50U2Vzc2lvblwiLCBhd2FpdCB0aGlzLmNsaWVudCgpLCB0aGlzLiNldmVudEVtaXR0ZXIpO1xuICAgIGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb24vc2VsZlwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBTZXNzaW9uTWFuYWdlci5pc1N0YWxlKHRoaXMuI2NsaWVudC50b2tlbl9leHApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoaXMgc2Vzc2lvbiBoYXMgZXhwaXJlZCBhbmQgY2Fubm90IGJlIHJlZnJlc2hlZCBhbnltb3JlLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoaXMgc2Vzc2lvbiBoYXMgZXhwaXJlZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBoYXNFeHBpcmVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICAodGhpcy4jY2xpZW50LnNlc3Npb25fZXhwIHx8IGZhbHNlKSAmJiBTZXNzaW9uTWFuYWdlci5oYXNFeHBpcmVkKHRoaXMuI2NsaWVudC5zZXNzaW9uX2V4cClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBhbmQgKipVUERBVEVTL01VVEFURVMqKiBzZWxmLlxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5oYXNFeHBpcmVkKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuI2V2ZW50RW1pdHRlci5lbWl0U2Vzc2lvbkV4cGlyZWQoKTtcbiAgICAgIHRocm93IG5ldyBTZXNzaW9uRXhwaXJlZEVycm9yKFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIik7XG4gICAgfVxuXG4gICAgY29uc3QgY3VyclNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcblxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBPcENsaWVudChcInNpZ25lclNlc3Npb25SZWZyZXNoXCIsIHRoaXMuI2NsaWVudC5jbGllbnQsIHRoaXMuI2V2ZW50RW1pdHRlcik7XG4gICAgY29uc3QgY3NpID0gY3VyclNlc3Npb24uc2Vzc2lvbl9pbmZvO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjEvb3JnL3tvcmdfaWR9L3Rva2VuL3JlZnJlc2hcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IDxSZWZyZXNoU2lnbmVyU2Vzc2lvblJlcXVlc3Q+e1xuICAgICAgICBlcG9jaF9udW06IGNzaS5lcG9jaCxcbiAgICAgICAgZXBvY2hfdG9rZW46IGNzaS5lcG9jaF90b2tlbixcbiAgICAgICAgb3RoZXJfdG9rZW46IGNzaS5yZWZyZXNoX3Rva2VuLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBuZXdTZXNzaW9uID0gPFNpZ25lclNlc3Npb25EYXRhPntcbiAgICAgIC4uLmN1cnJTZXNzaW9uLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBkYXRhLnNlc3Npb25faW5mbyxcbiAgICAgIHRva2VuOiBkYXRhLnRva2VuLFxuICAgIH07XG5cbiAgICBhd2FpdCB0aGlzLnN0b3JhZ2Uuc2F2ZShuZXdTZXNzaW9uKTtcbiAgICB0aGlzLiNjbGllbnQgPSB7XG4gICAgICBjbGllbnQ6IHRoaXMuY3JlYXRlQ2xpZW50KG5ld1Nlc3Npb24udG9rZW4pLFxuICAgICAgdG9rZW5fZXhwOiBzZWNvbmRzU2luY2VFcG9jaFRvRGF0ZShuZXdTZXNzaW9uLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cCksXG4gICAgICBzZXNzaW9uX2V4cDogbmV3U2Vzc2lvbi5zZXNzaW9uX2V4cFxuICAgICAgICA/IHNlY29uZHNTaW5jZUVwb2NoVG9EYXRlKG5ld1Nlc3Npb24uc2Vzc2lvbl9leHApXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgQ3ViZVNpZ25lciBlbnZpcm9ubWVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge05ld1Nlc3Npb25SZXNwb25zZX0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSB0byB1c2UgZm9yIHNhdmluZyB0aGUgc2Vzc2lvbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IE5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZUZyb21TZXNzaW9uSW5mbyhcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNlc3Npb246IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uRGF0YSA9IHtcbiAgICAgIGVudjoge1xuICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBlbnYsXG4gICAgICB9LFxuICAgICAgb3JnX2lkOiBvcmdJZCxcbiAgICAgIHRva2VuOiBzZXNzaW9uLnRva2VuLFxuICAgICAgcHVycG9zZTogXCJzaWduIHZpYSBvaWRjXCIsXG4gICAgICBzZXNzaW9uX2luZm86IHNlc3Npb24uc2Vzc2lvbl9pbmZvLFxuICAgICAgc2Vzc2lvbl9leHA6IHNlc3Npb24uZXhwaXJhdGlvbiEsXG4gICAgfTtcbiAgICBzdG9yYWdlID8/PSBuZXcgTWVtb3J5U2Vzc2lvblN0b3JhZ2UoKTtcbiAgICBhd2FpdCBzdG9yYWdlLnNhdmUoc2Vzc2lvbkRhdGEpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uRGF0YX0gc2Vzc2lvbkRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgdG8gdXNlIGZvciBzYXZpbmcgdGhlIHNlc3Npb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBOZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVGcm9tU2Vzc2lvbkRhdGEoXG4gICAgc2Vzc2lvbkRhdGE6IFNpZ25lclNlc3Npb25EYXRhLFxuICAgIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIHN0b3JhZ2UgPz89IG5ldyBNZW1vcnlTZXNzaW9uU3RvcmFnZSgpO1xuICAgIGF3YWl0IHN0b3JhZ2Uuc2F2ZShzZXNzaW9uRGF0YSk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VzIGFuIGV4aXN0aW5nIHNlc3Npb24gdG8gY3JlYXRlIGEgbmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gbmV3IFNpZ25lclNlc3Npb25NYW5hZ2VyKHNlc3Npb24sIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25EYXRhfSBzZXNzaW9uRGF0YSBTZXNzaW9uIGRhdGFcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZS5cbiAgICovXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzZXNzaW9uRGF0YTogU2lnbmVyU2Vzc2lvbkRhdGEsIHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKSB7XG4gICAgc3VwZXIoc2Vzc2lvbkRhdGEuZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXSwgc2Vzc2lvbkRhdGEub3JnX2lkLCBzdG9yYWdlKTtcbiAgICB0aGlzLiNldmVudEVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKFt0aGlzLmV2ZW50c10pO1xuICAgIHRoaXMuI2NsaWVudCA9IHtcbiAgICAgIGNsaWVudDogdGhpcy5jcmVhdGVDbGllbnQoc2Vzc2lvbkRhdGEudG9rZW4pLFxuICAgICAgdG9rZW5fZXhwOiBzZWNvbmRzU2luY2VFcG9jaFRvRGF0ZShzZXNzaW9uRGF0YS5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHApLFxuICAgICAgc2Vzc2lvbl9leHA6IHNlc3Npb25EYXRhLnNlc3Npb25fZXhwXG4gICAgICAgID8gc2Vjb25kc1NpbmNlRXBvY2hUb0RhdGUoc2Vzc2lvbkRhdGEuc2Vzc2lvbl9leHApXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==