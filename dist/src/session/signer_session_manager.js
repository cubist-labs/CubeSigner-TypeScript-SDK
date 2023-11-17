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
var _SignerSessionManager_client;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerSessionManager = void 0;
const session_manager_1 = require("./session_manager");
const session_storage_1 = require("./session_storage");
const util_1 = require("../util");
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
        return __classPrivateFieldGet(this, _SignerSessionManager_client, "f");
    }
    /**
     * @return {Client} A client using the current session (without attempting to refresh it).
     */
    clientNoRefresh() {
        return __classPrivateFieldGet(this, _SignerSessionManager_client, "f");
    }
    /** Revokes the session. */
    async revoke() {
        const client = await this.client();
        const resp = await client.del("/v0/org/{org_id}/session/self", {
            params: { path: { org_id: this.orgId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    async isStale() {
        const session = await this.storage.retrieve();
        return this.hasExpired(session.session_info.auth_token_exp * 1000);
    }
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    async refresh() {
        const currSession = await this.storage.retrieve();
        const csi = currSession.session_info;
        const resp = await __classPrivateFieldGet(this, _SignerSessionManager_client, "f").patch("/v1/org/{org_id}/token/refresh", {
            params: { path: { org_id: this.orgId } },
            body: {
                epoch_num: csi.epoch,
                epoch_token: csi.epoch_token,
                other_token: csi.refresh_token,
            },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        const newSession = {
            ...currSession,
            session_info: data.session_info,
            token: data.token,
        };
        await this.storage.save(newSession);
        __classPrivateFieldSet(this, _SignerSessionManager_client, this.createClient(newSession.token), "f");
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
     * @param {SignerSessionStorage} storage The session storage to use
     */
    constructor(sessionData, storage) {
        super(sessionData.env["Dev-CubeSignerStack"], sessionData.org_id, storage);
        _SignerSessionManager_client.set(this, void 0);
        __classPrivateFieldSet(this, _SignerSessionManager_client, this.createClient(sessionData.token), "f");
    }
}
exports.SignerSessionManager = SignerSessionManager;
_SignerSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBT0EsdURBQThEO0FBQzlELHVEQUF5RTtBQUN6RSxrQ0FBbUM7QUFnQ25DLG1DQUFtQztBQUNuQyxNQUFhLG9CQUFxQixTQUFRLG1DQUFvQztJQUc1RTs7O09BR0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzdCLE9BQU8sdUJBQUEsSUFBSSxvQ0FBUSxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7T0FFRztJQUNILGVBQWU7UUFDYixPQUFPLHVCQUFBLElBQUksb0NBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsMkJBQTJCO0lBQzNCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbkMsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLCtCQUErQixFQUFFO1lBQzdELE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDeEMsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFbEQsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztRQUNyQyxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksb0NBQVEsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUU7WUFDdEUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN4QyxJQUFJLEVBQStCO2dCQUNqQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEtBQUs7Z0JBQ3BCLFdBQVcsRUFBRSxHQUFHLENBQUMsV0FBVztnQkFDNUIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxhQUFhO2FBQy9CO1lBQ0QsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsTUFBTSxVQUFVLEdBQXNCO1lBQ3BDLEdBQUcsV0FBVztZQUNkLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtZQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7U0FDbEIsQ0FBQztRQUVGLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsdUJBQUEsSUFBSSxnQ0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQ3JELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUNoQyxHQUFpQixFQUNqQixLQUFhLEVBQ2IsT0FBMkIsRUFDM0IsT0FBOEI7UUFFOUIsTUFBTSxXQUFXLEdBQUc7WUFDbEIsR0FBRyxFQUFFO2dCQUNILENBQUMscUJBQXFCLENBQUMsRUFBRSxHQUFHO2FBQzdCO1lBQ0QsTUFBTSxFQUFFLEtBQUs7WUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7WUFDcEIsT0FBTyxFQUFFLGVBQWU7WUFDeEIsWUFBWSxFQUFFLE9BQU8sQ0FBQyxZQUFZO1NBQ25DLENBQUM7UUFDRixPQUFPLEtBQUssSUFBSSxzQ0FBb0IsRUFBRSxDQUFDO1FBQ3ZDLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNoQyxPQUFPLE1BQU0sb0JBQW9CLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQTZCO1FBQ3hELE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pDLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxXQUE4QixFQUFFLE9BQTZCO1FBQ3ZFLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQXhIN0UsK0NBQWdCO1FBeUhkLHVCQUFBLElBQUksZ0NBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQUEsQ0FBQztJQUN0RCxDQUFDO0NBQ0Y7QUE1SEQsb0RBNEhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uXCI7XG5pbXBvcnQge1xuICBDbGllbnRTZXNzaW9uSW5mbyxcbiAgTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBSZWZyZXNoU2lnbmVyU2Vzc2lvblJlcXVlc3QsXG59IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuLi9jbGllbnRcIjtcbmltcG9ydCB7IEhhc0VudiwgT3JnU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IE1lbW9yeVNlc3Npb25TdG9yYWdlLCBTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb25fc3RvcmFnZVwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vdXRpbFwiO1xuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiBvdXIgXCJzaWduZXIgc2Vzc2lvblwiIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25PYmplY3Qge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIElEICovXG4gIHJvbGVfaWQ/OiBzdHJpbmc7XG4gIC8qKiBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvbiB0b2tlbiAqL1xuICBwdXJwb3NlPzogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFNlc3Npb24gaW5mbyAqL1xuICBzZXNzaW9uX2luZm86IENsaWVudFNlc3Npb25JbmZvO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25EYXRhIGV4dGVuZHMgU2lnbmVyU2Vzc2lvbk9iamVjdCwgSGFzRW52IHt9XG5cbi8qKiBUeXBlIG9mIHN0b3JhZ2UgcmVxdWlyZWQgZm9yIHNpZ25lciBzZXNzaW9ucyAqL1xuZXhwb3J0IHR5cGUgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxTaWduZXJTZXNzaW9uRGF0YT47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbkxpZmV0aW1lIHtcbiAgLyoqIFNlc3Npb24gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgd2VlayAoNjA0ODAwKS4gKi9cbiAgc2Vzc2lvbj86IG51bWJlcjtcbiAgLyoqIEF1dGggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBmaXZlIG1pbnV0ZXMgKDMwMCkuICovXG4gIGF1dGg6IG51bWJlcjtcbiAgLyoqIFJlZnJlc2ggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgZGF5ICg4NjQwMCkuICovXG4gIHJlZnJlc2g/OiBudW1iZXI7XG4gIC8qKiBHcmFjZSBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIDMwIHNlY29uZHMgKDMwKS4gKi9cbiAgZ3JhY2U/OiBudW1iZXI7XG59XG5cbi8qKiBNYW5hZ2VyIGZvciBzaWduZXIgc2Vzc2lvbnMuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBPcmdTZXNzaW9uTWFuYWdlcjxTaWduZXJTZXNzaW9uRGF0YT4ge1xuICAjY2xpZW50OiBDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGN1cnJlbnQgYXV0aCB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gc2Vzc2lvbi50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIGN1cnJlbnQgc2Vzc2lvbiBpZiBuZWVkZWQsIHRoZW4gcmV0dXJucyBhIGNsaWVudCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBNYXkgKipVUERBVEUvTVVUQVRFKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIGNsaWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtDbGllbnR9IEEgY2xpZW50IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24gKHdpdGhvdXQgYXR0ZW1wdGluZyB0byByZWZyZXNoIGl0KS5cbiAgICovXG4gIGNsaWVudE5vUmVmcmVzaCgpOiBDbGllbnQge1xuICAgIHJldHVybiB0aGlzLiNjbGllbnQ7XG4gIH1cblxuICAvKiogUmV2b2tlcyB0aGUgc2Vzc2lvbi4gKi9cbiAgYXN5bmMgcmV2b2tlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb24vc2VsZlwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gdGhpcy5oYXNFeHBpcmVkKHNlc3Npb24uc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwICogMTAwMCk7XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBzZXNzaW9uIGFuZCAqKlVQREFURVMvTVVUQVRFUyoqIHNlbGYuXG4gICAqL1xuICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGN1cnJTZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG5cbiAgICBjb25zdCBjc2kgPSBjdXJyU2Vzc2lvbi5zZXNzaW9uX2luZm87XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2NsaWVudC5wYXRjaChcIi92MS9vcmcve29yZ19pZH0vdG9rZW4vcmVmcmVzaFwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogPFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdD57XG4gICAgICAgIGVwb2NoX251bTogY3NpLmVwb2NoLFxuICAgICAgICBlcG9jaF90b2tlbjogY3NpLmVwb2NoX3Rva2VuLFxuICAgICAgICBvdGhlcl90b2tlbjogY3NpLnJlZnJlc2hfdG9rZW4sXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIGNvbnN0IG5ld1Nlc3Npb24gPSA8U2lnbmVyU2Vzc2lvbkRhdGE+e1xuICAgICAgLi4uY3VyclNlc3Npb24sXG4gICAgICBzZXNzaW9uX2luZm86IGRhdGEuc2Vzc2lvbl9pbmZvLFxuICAgICAgdG9rZW46IGRhdGEudG9rZW4sXG4gICAgfTtcblxuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlKG5ld1Nlc3Npb24pO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KG5ld1Nlc3Npb24udG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtOZXdTZXNzaW9uUmVzcG9uc2V9IHNlc3Npb24gVGhlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgdG8gdXNlIGZvciBzYXZpbmcgdGhlIHNlc3Npb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBOZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVGcm9tU2Vzc2lvbkluZm8oXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzZXNzaW9uOiBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gICAgc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgc2Vzc2lvbkRhdGEgPSB7XG4gICAgICBlbnY6IHtcbiAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogZW52LFxuICAgICAgfSxcbiAgICAgIG9yZ19pZDogb3JnSWQsXG4gICAgICB0b2tlbjogc2Vzc2lvbi50b2tlbixcbiAgICAgIHB1cnBvc2U6IFwic2lnbiB2aWEgb2lkY1wiLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBzZXNzaW9uLnNlc3Npb25faW5mbyxcbiAgICB9O1xuICAgIHN0b3JhZ2UgPz89IG5ldyBNZW1vcnlTZXNzaW9uU3RvcmFnZSgpO1xuICAgIGF3YWl0IHN0b3JhZ2Uuc2F2ZShzZXNzaW9uRGF0YSk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VzIGFuIGV4aXN0aW5nIHNlc3Npb24gdG8gY3JlYXRlIGEgbmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gbmV3IFNpZ25lclNlc3Npb25NYW5hZ2VyKHNlc3Npb24sIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25EYXRhfSBzZXNzaW9uRGF0YSBTZXNzaW9uIGRhdGFcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbkRhdGE6IFNpZ25lclNlc3Npb25EYXRhLCBzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSkge1xuICAgIHN1cGVyKHNlc3Npb25EYXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0sIHNlc3Npb25EYXRhLm9yZ19pZCwgc3RvcmFnZSk7XG4gICAgdGhpcy4jY2xpZW50ID0gdGhpcy5jcmVhdGVDbGllbnQoc2Vzc2lvbkRhdGEudG9rZW4pO1xuICB9XG59XG4iXX0=