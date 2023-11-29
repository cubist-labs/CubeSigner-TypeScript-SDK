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
     * @param {SignerSessionStorage} storage The session storage to use.
     */
    constructor(sessionData, storage) {
        super(sessionData.env["Dev-CubeSignerStack"], sessionData.org_id, storage);
        _SignerSessionManager_client.set(this, void 0);
        __classPrivateFieldSet(this, _SignerSessionManager_client, this.createClient(sessionData.token), "f");
    }
}
exports.SignerSessionManager = SignerSessionManager;
_SignerSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBT0EsdURBQThEO0FBQzlELHVEQUF5RTtBQUN6RSxrQ0FBbUM7QUFnQ25DLG1DQUFtQztBQUNuQyxNQUFhLG9CQUFxQixTQUFRLG1DQUFvQztJQUc1RTs7O09BR0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzdCLE9BQU8sdUJBQUEsSUFBSSxvQ0FBUSxDQUFDO0lBQ3RCLENBQUM7SUFFRCwyQkFBMkI7SUFDM0IsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNuQyxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxHQUFHLENBQUMsK0JBQStCLEVBQUU7WUFDN0QsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN4QyxPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVsRCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxvQ0FBUSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRTtZQUN0RSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3hDLElBQUksRUFBK0I7Z0JBQ2pDLFNBQVMsRUFBRSxHQUFHLENBQUMsS0FBSztnQkFDcEIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXO2dCQUM1QixXQUFXLEVBQUUsR0FBRyxDQUFDLGFBQWE7YUFDL0I7WUFDRCxPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxNQUFNLElBQUksR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixNQUFNLFVBQVUsR0FBc0I7WUFDcEMsR0FBRyxXQUFXO1lBQ2QsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQy9CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztTQUNsQixDQUFDO1FBRUYsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNwQyx1QkFBQSxJQUFJLGdDQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFBLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQ2hDLEdBQWlCLEVBQ2pCLEtBQWEsRUFDYixPQUEyQixFQUMzQixPQUE4QjtRQUU5QixNQUFNLFdBQVcsR0FBRztZQUNsQixHQUFHLEVBQUU7Z0JBQ0gsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEdBQUc7YUFDN0I7WUFDRCxNQUFNLEVBQUUsS0FBSztZQUNiLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztZQUNwQixPQUFPLEVBQUUsZUFBZTtZQUN4QixZQUFZLEVBQUUsT0FBTyxDQUFDLFlBQVk7U0FDbkMsQ0FBQztRQUNGLE9BQU8sS0FBSyxJQUFJLHNDQUFvQixFQUFFLENBQUM7UUFDdkMsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sTUFBTSxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBNkI7UUFDeEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekMsT0FBTyxJQUFJLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFvQixXQUE4QixFQUFFLE9BQTZCO1FBQy9FLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQWpIN0UsK0NBQWdCO1FBa0hkLHVCQUFBLElBQUksZ0NBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQUEsQ0FBQztJQUN0RCxDQUFDO0NBQ0Y7QUFySEQsb0RBcUhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uXCI7XG5pbXBvcnQge1xuICBDbGllbnRTZXNzaW9uSW5mbyxcbiAgTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBSZWZyZXNoU2lnbmVyU2Vzc2lvblJlcXVlc3QsXG59IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuLi9hcGlcIjtcbmltcG9ydCB7IEhhc0VudiwgT3JnU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IE1lbW9yeVNlc3Npb25TdG9yYWdlLCBTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb25fc3RvcmFnZVwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vdXRpbFwiO1xuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiBvdXIgXCJzaWduZXIgc2Vzc2lvblwiIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25PYmplY3Qge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIElEICovXG4gIHJvbGVfaWQ/OiBzdHJpbmc7XG4gIC8qKiBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvbiB0b2tlbiAqL1xuICBwdXJwb3NlPzogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFNlc3Npb24gaW5mbyAqL1xuICBzZXNzaW9uX2luZm86IENsaWVudFNlc3Npb25JbmZvO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25EYXRhIGV4dGVuZHMgU2lnbmVyU2Vzc2lvbk9iamVjdCwgSGFzRW52IHt9XG5cbi8qKiBUeXBlIG9mIHN0b3JhZ2UgcmVxdWlyZWQgZm9yIHNpZ25lciBzZXNzaW9ucyAqL1xuZXhwb3J0IHR5cGUgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxTaWduZXJTZXNzaW9uRGF0YT47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbkxpZmV0aW1lIHtcbiAgLyoqIFNlc3Npb24gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgd2VlayAoNjA0ODAwKS4gKi9cbiAgc2Vzc2lvbj86IG51bWJlcjtcbiAgLyoqIEF1dGggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBmaXZlIG1pbnV0ZXMgKDMwMCkuICovXG4gIGF1dGg6IG51bWJlcjtcbiAgLyoqIFJlZnJlc2ggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgZGF5ICg4NjQwMCkuICovXG4gIHJlZnJlc2g/OiBudW1iZXI7XG4gIC8qKiBHcmFjZSBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIDMwIHNlY29uZHMgKDMwKS4gKi9cbiAgZ3JhY2U/OiBudW1iZXI7XG59XG5cbi8qKiBNYW5hZ2VyIGZvciBzaWduZXIgc2Vzc2lvbnMuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBPcmdTZXNzaW9uTWFuYWdlcjxTaWduZXJTZXNzaW9uRGF0YT4ge1xuICAjY2xpZW50OiBDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGN1cnJlbnQgYXV0aCB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gc2Vzc2lvbi50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIGN1cnJlbnQgc2Vzc2lvbiBpZiBuZWVkZWQsIHRoZW4gcmV0dXJucyBhIGNsaWVudCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBNYXkgKipVUERBVEUvTVVUQVRFKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIGNsaWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKiBSZXZva2VzIHRoZSBzZXNzaW9uLiAqL1xuICBhc3luYyByZXZva2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvbi9zZWxmXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGlzU3RhbGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiB0aGlzLmhhc0V4cGlyZWQoc2Vzc2lvbi5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHAgKiAxMDAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24gYW5kICoqVVBEQVRFUy9NVVRBVEVTKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY3VyclNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcblxuICAgIGNvbnN0IGNzaSA9IGN1cnJTZXNzaW9uLnNlc3Npb25faW5mbztcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY2xpZW50LnBhdGNoKFwiL3YxL29yZy97b3JnX2lkfS90b2tlbi9yZWZyZXNoXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiA8UmVmcmVzaFNpZ25lclNlc3Npb25SZXF1ZXN0PntcbiAgICAgICAgZXBvY2hfbnVtOiBjc2kuZXBvY2gsXG4gICAgICAgIGVwb2NoX3Rva2VuOiBjc2kuZXBvY2hfdG9rZW4sXG4gICAgICAgIG90aGVyX3Rva2VuOiBjc2kucmVmcmVzaF90b2tlbixcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgY29uc3QgbmV3U2Vzc2lvbiA9IDxTaWduZXJTZXNzaW9uRGF0YT57XG4gICAgICAuLi5jdXJyU2Vzc2lvbixcbiAgICAgIHNlc3Npb25faW5mbzogZGF0YS5zZXNzaW9uX2luZm8sXG4gICAgICB0b2tlbjogZGF0YS50b2tlbixcbiAgICB9O1xuXG4gICAgYXdhaXQgdGhpcy5zdG9yYWdlLnNhdmUobmV3U2Vzc2lvbik7XG4gICAgdGhpcy4jY2xpZW50ID0gdGhpcy5jcmVhdGVDbGllbnQobmV3U2Vzc2lvbi50b2tlbik7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgQ3ViZVNpZ25lciBlbnZpcm9ubWVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge05ld1Nlc3Npb25SZXNwb25zZX0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSB0byB1c2UgZm9yIHNhdmluZyB0aGUgc2Vzc2lvbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IE5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZUZyb21TZXNzaW9uSW5mbyhcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNlc3Npb246IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uRGF0YSA9IHtcbiAgICAgIGVudjoge1xuICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBlbnYsXG4gICAgICB9LFxuICAgICAgb3JnX2lkOiBvcmdJZCxcbiAgICAgIHRva2VuOiBzZXNzaW9uLnRva2VuLFxuICAgICAgcHVycG9zZTogXCJzaWduIHZpYSBvaWRjXCIsXG4gICAgICBzZXNzaW9uX2luZm86IHNlc3Npb24uc2Vzc2lvbl9pbmZvLFxuICAgIH07XG4gICAgc3RvcmFnZSA/Pz0gbmV3IE1lbW9yeVNlc3Npb25TdG9yYWdlKCk7XG4gICAgYXdhaXQgc3RvcmFnZS5zYXZlKHNlc3Npb25EYXRhKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXMgYW4gZXhpc3Rpbmcgc2Vzc2lvbiB0byBjcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICpcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpbmdlclNlc3Npb24+fSBOZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlclxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRGcm9tU3RvcmFnZShzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBuZXcgU2lnbmVyU2Vzc2lvbk1hbmFnZXIoc2Vzc2lvbiwgc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkRhdGF9IHNlc3Npb25EYXRhIFNlc3Npb24gZGF0YVxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzZXNzaW9uIHN0b3JhZ2UgdG8gdXNlLlxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihzZXNzaW9uRGF0YTogU2lnbmVyU2Vzc2lvbkRhdGEsIHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKSB7XG4gICAgc3VwZXIoc2Vzc2lvbkRhdGEuZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXSwgc2Vzc2lvbkRhdGEub3JnX2lkLCBzdG9yYWdlKTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudChzZXNzaW9uRGF0YS50b2tlbik7XG4gIH1cbn1cbiJdfQ==