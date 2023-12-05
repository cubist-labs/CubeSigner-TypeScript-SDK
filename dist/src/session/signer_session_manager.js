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
const __1 = require("..");
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
        const client = new __1.OpClient("revokeCurrentSession", await this.client(), __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f"));
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
        const client = new __1.OpClient("signerSessionRefresh", __classPrivateFieldGet(this, _SignerSessionManager_client, "f").client, __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRDO0FBTzVDLHVEQUE4RTtBQUM5RSx1REFBeUU7QUFDekUsc0NBQXlDO0FBZ0J6Qzs7OztHQUlHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FBQyxJQUFZO0lBQzNDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFrQkQsbUNBQW1DO0FBQ25DLE1BQWEsb0JBQXFCLFNBQVEsbUNBQW9DO0lBSTVFOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFN0IsNEVBQTRFO1FBQzVFLElBQUksZ0NBQWMsQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxvQ0FBUSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNoRSxNQUFNLHVCQUFBLElBQUksMENBQWMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ2hELENBQUM7UUFFRCxPQUFPLHVCQUFBLElBQUksb0NBQVEsQ0FBQyxNQUFNLENBQUM7SUFDN0IsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sTUFBTSxHQUFHLElBQUksWUFBUSxDQUFDLHNCQUFzQixFQUFFLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLHVCQUFBLElBQUksMENBQWMsQ0FBQyxDQUFDO1FBQzdGLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsRUFBRTtZQUNoRCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFO1NBQ3pDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxPQUFPLGdDQUFjLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksb0NBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVsRCxNQUFNLE1BQU0sR0FBRyxJQUFJLFlBQVEsQ0FBQyxzQkFBc0IsRUFBRSx1QkFBQSxJQUFJLG9DQUFRLENBQUMsTUFBTSxFQUFFLHVCQUFBLElBQUksMENBQWMsQ0FBQyxDQUFDO1FBQzdGLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUM7UUFDckMsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFO1lBQ2hFLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDeEMsSUFBSSxFQUErQjtnQkFDakMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxLQUFLO2dCQUNwQixXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVc7Z0JBQzVCLFdBQVcsRUFBRSxHQUFHLENBQUMsYUFBYTthQUMvQjtTQUNGLENBQUMsQ0FBQztRQUNILE1BQU0sVUFBVSxHQUFzQjtZQUNwQyxHQUFHLFdBQVc7WUFDZCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1NBQ2xCLENBQUM7UUFFRixNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BDLHVCQUFBLElBQUksZ0NBQVc7WUFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQzNDLEdBQUcsRUFBRSx1QkFBdUIsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQztTQUNyRSxNQUFBLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FDaEMsR0FBaUIsRUFDakIsS0FBYSxFQUNiLE9BQTJCLEVBQzNCLE9BQThCO1FBRTlCLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLEdBQUcsRUFBRTtnQkFDSCxDQUFDLHFCQUFxQixDQUFDLEVBQUUsR0FBRzthQUM3QjtZQUNELE1BQU0sRUFBRSxLQUFLO1lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3BCLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLFlBQVksRUFBRSxPQUFPLENBQUMsWUFBWTtTQUNuQyxDQUFDO1FBQ0YsT0FBTyxLQUFLLElBQUksc0NBQW9CLEVBQUUsQ0FBQztRQUN2QyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDaEMsT0FBTyxNQUFNLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQ2hDLFdBQThCLEVBQzlCLE9BQThCO1FBRTlCLE9BQU8sS0FBSyxJQUFJLHNDQUFvQixFQUFFLENBQUM7UUFDdkMsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sTUFBTSxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBNkI7UUFDeEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekMsT0FBTyxJQUFJLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFzQixXQUE4QixFQUFFLE9BQTZCO1FBQ2pGLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQXJJcEUscURBQTRCO1FBQ3JDLCtDQUF1QztRQXFJckMsdUJBQUEsSUFBSSxzQ0FBaUIsSUFBSSxxQkFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQUEsQ0FBQztRQUNyRCx1QkFBQSxJQUFJLGdDQUFXO1lBQ2IsTUFBTSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUM1QyxHQUFHLEVBQUUsdUJBQXVCLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUM7U0FDdEUsTUFBQSxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBN0lELG9EQTZJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVudkludGVyZmFjZSwgT3BDbGllbnQgfSBmcm9tIFwiLi5cIjtcbmltcG9ydCB7XG4gIENsaWVudFNlc3Npb25JbmZvLFxuICBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gIFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdCxcbn0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2FwaVwiO1xuaW1wb3J0IHsgSGFzRW52LCBPcmdTZXNzaW9uTWFuYWdlciwgU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IE1lbW9yeVNlc3Npb25TdG9yYWdlLCBTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb25fc3RvcmFnZVwiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4uL2V2ZW50c1wiO1xuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiBvdXIgXCJzaWduZXIgc2Vzc2lvblwiIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25PYmplY3Qge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIElEICovXG4gIHJvbGVfaWQ/OiBzdHJpbmc7XG4gIC8qKiBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvbiB0b2tlbiAqL1xuICBwdXJwb3NlPzogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFNlc3Npb24gaW5mbyAqL1xuICBzZXNzaW9uX2luZm86IENsaWVudFNlc3Npb25JbmZvO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMge0BsaW5rIERhdGV9IGZyb20gYSBudW1iZXIgcmVwcmVzZW50aW5nIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzZWNzIFNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAqIEByZXR1cm4ge0RhdGV9IFRoZSBlcXVpdmFsZW50IGRhdGUuXG4gKi9cbmZ1bmN0aW9uIHNlY29uZHNTaW5jZUVwb2NoVG9EYXRlKHNlY3M6IG51bWJlcik6IERhdGUge1xuICByZXR1cm4gbmV3IERhdGUoc2VjcyAqIDEwMDApO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25EYXRhIGV4dGVuZHMgU2lnbmVyU2Vzc2lvbk9iamVjdCwgSGFzRW52IHt9XG5cbi8qKiBUeXBlIG9mIHN0b3JhZ2UgcmVxdWlyZWQgZm9yIHNpZ25lciBzZXNzaW9ucyAqL1xuZXhwb3J0IHR5cGUgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxTaWduZXJTZXNzaW9uRGF0YT47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbkxpZmV0aW1lIHtcbiAgLyoqIFNlc3Npb24gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgd2VlayAoNjA0ODAwKS4gKi9cbiAgc2Vzc2lvbj86IG51bWJlcjtcbiAgLyoqIEF1dGggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBmaXZlIG1pbnV0ZXMgKDMwMCkuICovXG4gIGF1dGg6IG51bWJlcjtcbiAgLyoqIFJlZnJlc2ggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgZGF5ICg4NjQwMCkuICovXG4gIHJlZnJlc2g/OiBudW1iZXI7XG4gIC8qKiBHcmFjZSBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIDMwIHNlY29uZHMgKDMwKS4gKi9cbiAgZ3JhY2U/OiBudW1iZXI7XG59XG5cbi8qKiBNYW5hZ2VyIGZvciBzaWduZXIgc2Vzc2lvbnMuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBPcmdTZXNzaW9uTWFuYWdlcjxTaWduZXJTZXNzaW9uRGF0YT4ge1xuICByZWFkb25seSAjZXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXI7XG4gICNjbGllbnQ6IHsgY2xpZW50OiBDbGllbnQ7IGV4cDogRGF0ZSB9O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IGF1dGggdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHNlc3Npb24udG9rZW47XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBjdXJyZW50IHNlc3Npb24gaWYgbmVlZGVkLCB0aGVuIHJldHVybnMgYSBjbGllbnQgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogTWF5ICoqVVBEQVRFL01VVEFURSoqIHNlbGYuXG4gICAqL1xuICBhc3luYyBjbGllbnQoKTogUHJvbWlzZTxDbGllbnQ+IHtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hJZk5lZWRlZCgpO1xuXG4gICAgLy8gdHJpZ2dlciBcInNlc3Npb24gZXhwaXJlZFwiIGlmIGZvciB3aGF0ZXZlciByZWFzb24gdGhlIHRva2VuIGlzIHN0aWxsIHN0YWxlXG4gICAgaWYgKFNlc3Npb25NYW5hZ2VyLmhhc0V4cGlyZWQodGhpcy4jY2xpZW50LmV4cCwgLyogYnVmZmVyICovIDApKSB7XG4gICAgICBhd2FpdCB0aGlzLiNldmVudEVtaXR0ZXIuZW1pdFNlc3Npb25FeHBpcmVkKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudC5jbGllbnQ7XG4gIH1cblxuICAvKiogUmV2b2tlcyB0aGUgc2Vzc2lvbi4gKi9cbiAgYXN5bmMgcmV2b2tlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBPcENsaWVudChcInJldm9rZUN1cnJlbnRTZXNzaW9uXCIsIGF3YWl0IHRoaXMuY2xpZW50KCksIHRoaXMuI2V2ZW50RW1pdHRlcik7XG4gICAgYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvbi9zZWxmXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBTZXNzaW9uTWFuYWdlci5oYXNFeHBpcmVkKHRoaXMuI2NsaWVudC5leHApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBhbmQgKipVUERBVEVTL01VVEFURVMqKiBzZWxmLlxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjdXJyU2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuXG4gICAgY29uc3QgY2xpZW50ID0gbmV3IE9wQ2xpZW50KFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiwgdGhpcy4jY2xpZW50LmNsaWVudCwgdGhpcy4jZXZlbnRFbWl0dGVyKTtcbiAgICBjb25zdCBjc2kgPSBjdXJyU2Vzc2lvbi5zZXNzaW9uX2luZm87XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wYXRjaChcIi92MS9vcmcve29yZ19pZH0vdG9rZW4vcmVmcmVzaFwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogPFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdD57XG4gICAgICAgIGVwb2NoX251bTogY3NpLmVwb2NoLFxuICAgICAgICBlcG9jaF90b2tlbjogY3NpLmVwb2NoX3Rva2VuLFxuICAgICAgICBvdGhlcl90b2tlbjogY3NpLnJlZnJlc2hfdG9rZW4sXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnN0IG5ld1Nlc3Npb24gPSA8U2lnbmVyU2Vzc2lvbkRhdGE+e1xuICAgICAgLi4uY3VyclNlc3Npb24sXG4gICAgICBzZXNzaW9uX2luZm86IGRhdGEuc2Vzc2lvbl9pbmZvLFxuICAgICAgdG9rZW46IGRhdGEudG9rZW4sXG4gICAgfTtcblxuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlKG5ld1Nlc3Npb24pO1xuICAgIHRoaXMuI2NsaWVudCA9IHtcbiAgICAgIGNsaWVudDogdGhpcy5jcmVhdGVDbGllbnQobmV3U2Vzc2lvbi50b2tlbiksXG4gICAgICBleHA6IHNlY29uZHNTaW5jZUVwb2NoVG9EYXRlKG5ld1Nlc3Npb24uc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwKSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtOZXdTZXNzaW9uUmVzcG9uc2V9IHNlc3Npb24gVGhlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgdG8gdXNlIGZvciBzYXZpbmcgdGhlIHNlc3Npb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBOZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVGcm9tU2Vzc2lvbkluZm8oXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzZXNzaW9uOiBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gICAgc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgc2Vzc2lvbkRhdGEgPSB7XG4gICAgICBlbnY6IHtcbiAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogZW52LFxuICAgICAgfSxcbiAgICAgIG9yZ19pZDogb3JnSWQsXG4gICAgICB0b2tlbjogc2Vzc2lvbi50b2tlbixcbiAgICAgIHB1cnBvc2U6IFwic2lnbiB2aWEgb2lkY1wiLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBzZXNzaW9uLnNlc3Npb25faW5mbyxcbiAgICB9O1xuICAgIHN0b3JhZ2UgPz89IG5ldyBNZW1vcnlTZXNzaW9uU3RvcmFnZSgpO1xuICAgIGF3YWl0IHN0b3JhZ2Uuc2F2ZShzZXNzaW9uRGF0YSk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25EYXRhfSBzZXNzaW9uRGF0YSBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSB0byB1c2UgZm9yIHNhdmluZyB0aGUgc2Vzc2lvbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IE5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZUZyb21TZXNzaW9uRGF0YShcbiAgICBzZXNzaW9uRGF0YTogU2lnbmVyU2Vzc2lvbkRhdGEsXG4gICAgc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgc3RvcmFnZSA/Pz0gbmV3IE1lbW9yeVNlc3Npb25TdG9yYWdlKCk7XG4gICAgYXdhaXQgc3RvcmFnZS5zYXZlKHNlc3Npb25EYXRhKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXMgYW4gZXhpc3Rpbmcgc2Vzc2lvbiB0byBjcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICpcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpbmdlclNlc3Npb24+fSBOZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlclxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRGcm9tU3RvcmFnZShzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBuZXcgU2lnbmVyU2Vzc2lvbk1hbmFnZXIoc2Vzc2lvbiwgc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkRhdGF9IHNlc3Npb25EYXRhIFNlc3Npb24gZGF0YVxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzZXNzaW9uIHN0b3JhZ2UgdG8gdXNlLlxuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHNlc3Npb25EYXRhOiBTaWduZXJTZXNzaW9uRGF0YSwgc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpIHtcbiAgICBzdXBlcihzZXNzaW9uRGF0YS5lbnZbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdLCBzZXNzaW9uRGF0YS5vcmdfaWQsIHN0b3JhZ2UpO1xuICAgIHRoaXMuI2V2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoW3RoaXMuZXZlbnRzXSk7XG4gICAgdGhpcy4jY2xpZW50ID0ge1xuICAgICAgY2xpZW50OiB0aGlzLmNyZWF0ZUNsaWVudChzZXNzaW9uRGF0YS50b2tlbiksXG4gICAgICBleHA6IHNlY29uZHNTaW5jZUVwb2NoVG9EYXRlKHNlc3Npb25EYXRhLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cCksXG4gICAgfTtcbiAgfVxufVxuIl19