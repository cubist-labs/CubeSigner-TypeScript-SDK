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
const util_1 = require("../util");
const session_manager_1 = require("./session_manager");
const session_storage_1 = require("./session_storage");
const defaultSignerSessionLifetime = {
    session: 604800,
    auth: 300,
    refresh: 86400,
};
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
     * Returns a client with the current session and refreshes the current
     * session. May **UPDATE/MUTATE** self.
     */
    async client() {
        await this.refreshIfNeeded();
        return __classPrivateFieldGet(this, _SignerSessionManager_client, "f");
    }
    /** Revokes the session. */
    async revoke() {
        if (!this.cs) {
            throw new Error("No management session available");
        }
        const session = await this.storage.retrieve();
        const resp = await (await this.cs.management()).del("/v0/org/{org_id}/session/{session_id}", {
            params: {
                path: {
                    org_id: session.org_id,
                    session_id: session.session_info.session_id,
                },
            },
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
        return this.hasExpired(session.session_info.auth_token_exp);
    }
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    async refresh() {
        const session = await this.storage.retrieve();
        const csi = session.session_info;
        const resp = await __classPrivateFieldGet(this, _SignerSessionManager_client, "f").patch("/v1/org/{org_id}/token/refresh", {
            params: { path: { org_id: session.org_id } },
            body: {
                epoch_num: csi.epoch,
                epoch_token: csi.epoch_token,
                other_token: csi.refresh_token,
            },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        await this.storage.save({
            ...session,
            session_info: data.session_info,
            token: data.token,
        });
        __classPrivateFieldSet(this, _SignerSessionManager_client, this.createClient(data.token), "f");
    }
    /**
     * Create a new signer session.
     * @param {CubeSigner} cs The CubeSigner instance
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {string} orgId Org ID
     * @param {string} roleId Role ID
     * @param {string} purpose The purpose of the session
     * @param {SignerSessionLifetime} ttl Lifetime settings
     * @return {Promise<SignerSessionManager>} New signer session
     */
    static async create(cs, storage, orgId, roleId, purpose, ttl) {
        const resp = await (await cs.management()).post("/v0/org/{org_id}/roles/{role_id}/tokens", {
            params: { path: { org_id: orgId, role_id: roleId } },
            body: {
                purpose,
                auth_lifetime: ttl?.auth || defaultSignerSessionLifetime.auth,
                refresh_lifetime: ttl?.refresh || defaultSignerSessionLifetime.refresh,
                session_lifetime: ttl?.session || defaultSignerSessionLifetime.session,
            },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        const session_info = data.session_info;
        if (!session_info) {
            throw new Error("Signer session info missing");
        }
        const sessionData = {
            org_id: orgId,
            role_id: roleId,
            purpose,
            token: data.token,
            session_info,
            // Keep compatibility with tokens produced by CLI
            env: {
                ["Dev-CubeSignerStack"]: cs.env,
            },
        };
        await storage.save(sessionData);
        return new SignerSessionManager(sessionData, storage, cs);
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
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {CubeSigner} cs Optional CubeSigner instance.
     *    Currently used for token revocation; will be completely removed
     *    since token revocation should not require management session.
     * @return {Promise<SingerSession>} New signer session manager
     */
    static async loadFromStorage(storage, cs) {
        const session = await storage.retrieve();
        return new SignerSessionManager(session, storage, cs);
    }
    /**
     * Constructor.
     * @param {SignerSessionData} sessionData Session data
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {CubeSigner} cs Optional CubeSigner instance.
     *    Currently used for token revocation; will be completely removed
     *    since token revocation should not require management session.
     * @internal
     */
    constructor(sessionData, storage, cs) {
        super(sessionData.env["Dev-CubeSignerStack"], sessionData.org_id, storage);
        _SignerSessionManager_client.set(this, void 0);
        this.cs = cs;
        __classPrivateFieldSet(this, _SignerSessionManager_client, this.createClient(sessionData.token), "f");
    }
}
exports.SignerSessionManager = SignerSessionManager;
_SignerSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esa0NBQW1DO0FBRW5DLHVEQUE4RDtBQUM5RCx1REFBeUU7QUFzQ3pFLE1BQU0sNEJBQTRCLEdBQTBCO0lBQzFELE9BQU8sRUFBRSxNQUFNO0lBQ2YsSUFBSSxFQUFFLEdBQUc7SUFDVCxPQUFPLEVBQUUsS0FBSztDQUNmLENBQUM7QUFFRixtQ0FBbUM7QUFDbkMsTUFBYSxvQkFBcUIsU0FBUSxtQ0FBb0M7SUFJNUU7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzdCLE9BQU8sdUJBQUEsSUFBSSxvQ0FBUSxDQUFDO0lBQ3RCLENBQUM7SUFFRCwyQkFBMkI7SUFDM0IsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztTQUNwRDtRQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FDM0IsQ0FBQyxHQUFHLENBQUMsdUNBQXVDLEVBQUU7WUFDN0MsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRTtvQkFDSixN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RUFBZTtRQUVmLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQXJMN0UsK0NBQWdCO1FBc0xkLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsdUJBQUEsSUFBSSxnQ0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQ3RELENBQUM7Q0FDRjtBQTNMRCxvREEyTEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdWJlU2lnbmVyLCBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi5cIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4uL3V0aWxcIjtcbmltcG9ydCB7IGNvbXBvbmVudHMsIHBhdGhzLCBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50XCI7XG5pbXBvcnQgeyBIYXNFbnYsIE9yZ1Nlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIi4vc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBNZW1vcnlTZXNzaW9uU3RvcmFnZSwgU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uX3N0b3JhZ2VcIjtcblxuZXhwb3J0IHR5cGUgQ2xpZW50U2Vzc2lvbkluZm8gPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIkNsaWVudFNlc3Npb25JbmZvXCJdO1xuZXhwb3J0IHR5cGUgTmV3U2Vzc2lvblJlc3BvbnNlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJOZXdTZXNzaW9uUmVzcG9uc2VcIl07XG5cbmV4cG9ydCB0eXBlIENyZWF0ZVNpZ25lclNlc3Npb25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS90b2tlbnNcIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS90b2tlbi9yZWZyZXNoXCJdW1wicGF0Y2hcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiBvdXIgXCJzaWduZXIgc2Vzc2lvblwiIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25PYmplY3Qge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIElEICovXG4gIHJvbGVfaWQ/OiBzdHJpbmc7XG4gIC8qKiBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvbiB0b2tlbiAqL1xuICBwdXJwb3NlPzogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFNlc3Npb24gaW5mbyAqL1xuICBzZXNzaW9uX2luZm86IENsaWVudFNlc3Npb25JbmZvO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25EYXRhIGV4dGVuZHMgU2lnbmVyU2Vzc2lvbk9iamVjdCwgSGFzRW52IHt9XG5cbi8qKiBUeXBlIG9mIHN0b3JhZ2UgcmVxdWlyZWQgZm9yIHNpZ25lciBzZXNzaW9ucyAqL1xuZXhwb3J0IHR5cGUgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxTaWduZXJTZXNzaW9uRGF0YT47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbkxpZmV0aW1lIHtcbiAgLyoqIFNlc3Npb24gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgd2VlayAoNjA0ODAwKS4gKi9cbiAgc2Vzc2lvbj86IG51bWJlcjtcbiAgLyoqIEF1dGggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBmaXZlIG1pbnV0ZXMgKDMwMCkuICovXG4gIGF1dGg6IG51bWJlcjtcbiAgLyoqIFJlZnJlc2ggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgZGF5ICg4NjQwMCkuICovXG4gIHJlZnJlc2g/OiBudW1iZXI7XG59XG5cbmNvbnN0IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU6IFNpZ25lclNlc3Npb25MaWZldGltZSA9IHtcbiAgc2Vzc2lvbjogNjA0ODAwLFxuICBhdXRoOiAzMDAsXG4gIHJlZnJlc2g6IDg2NDAwLFxufTtcblxuLyoqIE1hbmFnZXIgZm9yIHNpZ25lciBzZXNzaW9ucy4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXJTZXNzaW9uTWFuYWdlciBleHRlbmRzIE9yZ1Nlc3Npb25NYW5hZ2VyPFNpZ25lclNlc3Npb25EYXRhPiB7XG4gIHJlYWRvbmx5IGNzPzogQ3ViZVNpZ25lcjtcbiAgI2NsaWVudDogQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IGF1dGggdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHNlc3Npb24udG9rZW47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNsaWVudCB3aXRoIHRoZSBjdXJyZW50IHNlc3Npb24gYW5kIHJlZnJlc2hlcyB0aGUgY3VycmVudFxuICAgKiBzZXNzaW9uLiBNYXkgKipVUERBVEUvTVVUQVRFKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIGNsaWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKiBSZXZva2VzIHRoZSBzZXNzaW9uLiAqL1xuICBhc3luYyByZXZva2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmNzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBtYW5hZ2VtZW50IHNlc3Npb24gYXZhaWxhYmxlXCIpO1xuICAgIH1cbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuY3MubWFuYWdlbWVudCgpXG4gICAgKS5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb24ve3Nlc3Npb25faWR9XCIsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgb3JnX2lkOiBzZXNzaW9uLm9yZ19pZCxcbiAgICAgICAgICBzZXNzaW9uX2lkOiBzZXNzaW9uLnNlc3Npb25faW5mby5zZXNzaW9uX2lkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgaXNTdGFsZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHRoaXMuaGFzRXhwaXJlZChzZXNzaW9uLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cCk7XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBzZXNzaW9uIGFuZCAqKlVQREFURVMvTVVUQVRFUyoqIHNlbGYuXG4gICAqL1xuICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBjb25zdCBjc2kgPSBzZXNzaW9uLnNlc3Npb25faW5mbztcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY2xpZW50LnBhdGNoKFwiL3YxL29yZy97b3JnX2lkfS90b2tlbi9yZWZyZXNoXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogc2Vzc2lvbi5vcmdfaWQgfSB9LFxuICAgICAgYm9keTogPFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdD57XG4gICAgICAgIGVwb2NoX251bTogY3NpLmVwb2NoLFxuICAgICAgICBlcG9jaF90b2tlbjogY3NpLmVwb2NoX3Rva2VuLFxuICAgICAgICBvdGhlcl90b2tlbjogY3NpLnJlZnJlc2hfdG9rZW4sXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlKDxTaWduZXJTZXNzaW9uRGF0YT57XG4gICAgICAuLi5zZXNzaW9uLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBkYXRhLnNlc3Npb25faW5mbyxcbiAgICAgIHRva2VuOiBkYXRhLnRva2VuLFxuICAgIH0pO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KGRhdGEudG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzZXNzaW9uIHN0b3JhZ2UgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmcgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkxpZmV0aW1lfSB0dGwgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IE5ldyBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZShcbiAgICBjczogQ3ViZVNpZ25lcixcbiAgICBzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHJvbGVJZDogc3RyaW5nLFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICB0dGw/OiBTaWduZXJTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdG9rZW5zXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIHB1cnBvc2UsXG4gICAgICAgIGF1dGhfbGlmZXRpbWU6IHR0bD8uYXV0aCB8fCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lLmF1dGgsXG4gICAgICAgIHJlZnJlc2hfbGlmZXRpbWU6IHR0bD8ucmVmcmVzaCB8fCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lLnJlZnJlc2gsXG4gICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IHR0bD8uc2Vzc2lvbiB8fCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lLnNlc3Npb24sXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIGNvbnN0IHNlc3Npb25faW5mbyA9IGRhdGEuc2Vzc2lvbl9pbmZvO1xuICAgIGlmICghc2Vzc2lvbl9pbmZvKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaWduZXIgc2Vzc2lvbiBpbmZvIG1pc3NpbmdcIik7XG4gICAgfVxuICAgIGNvbnN0IHNlc3Npb25EYXRhID0ge1xuICAgICAgb3JnX2lkOiBvcmdJZCxcbiAgICAgIHJvbGVfaWQ6IHJvbGVJZCxcbiAgICAgIHB1cnBvc2UsXG4gICAgICB0b2tlbjogZGF0YS50b2tlbixcbiAgICAgIHNlc3Npb25faW5mbyxcbiAgICAgIC8vIEtlZXAgY29tcGF0aWJpbGl0eSB3aXRoIHRva2VucyBwcm9kdWNlZCBieSBDTElcbiAgICAgIGVudjoge1xuICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBjcy5lbnYsXG4gICAgICB9LFxuICAgIH07XG4gICAgYXdhaXQgc3RvcmFnZS5zYXZlKHNlc3Npb25EYXRhKTtcbiAgICByZXR1cm4gbmV3IFNpZ25lclNlc3Npb25NYW5hZ2VyKHNlc3Npb25EYXRhLCBzdG9yYWdlLCBjcyk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgQ3ViZVNpZ25lciBlbnZpcm9ubWVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge05ld1Nlc3Npb25SZXNwb25zZX0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSB0byB1c2UgZm9yIHNhdmluZyB0aGUgc2Vzc2lvbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IE5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZUZyb21TZXNzaW9uSW5mbyhcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNlc3Npb246IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uRGF0YSA9IHtcbiAgICAgIGVudjoge1xuICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBlbnYsXG4gICAgICB9LFxuICAgICAgb3JnX2lkOiBvcmdJZCxcbiAgICAgIHRva2VuOiBzZXNzaW9uLnRva2VuLFxuICAgICAgcHVycG9zZTogXCJzaWduIHZpYSBvaWRjXCIsXG4gICAgICBzZXNzaW9uX2luZm86IHNlc3Npb24uc2Vzc2lvbl9pbmZvLFxuICAgIH07XG4gICAgc3RvcmFnZSA/Pz0gbmV3IE1lbW9yeVNlc3Npb25TdG9yYWdlKCk7XG4gICAgYXdhaXQgc3RvcmFnZS5zYXZlKHNlc3Npb25EYXRhKTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXMgYW4gZXhpc3Rpbmcgc2Vzc2lvbiB0byBjcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIE9wdGlvbmFsIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqICAgIEN1cnJlbnRseSB1c2VkIGZvciB0b2tlbiByZXZvY2F0aW9uOyB3aWxsIGJlIGNvbXBsZXRlbHkgcmVtb3ZlZFxuICAgKiAgICBzaW5jZSB0b2tlbiByZXZvY2F0aW9uIHNob3VsZCBub3QgcmVxdWlyZSBtYW5hZ2VtZW50IHNlc3Npb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2luZ2VyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZEZyb21TdG9yYWdlKFxuICAgIHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICAgIGNzPzogQ3ViZVNpZ25lcixcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBzdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uTWFuYWdlcihzZXNzaW9uLCBzdG9yYWdlLCBjcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkRhdGF9IHNlc3Npb25EYXRhIFNlc3Npb24gZGF0YVxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzZXNzaW9uIHN0b3JhZ2UgdG8gdXNlXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgT3B0aW9uYWwgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogICAgQ3VycmVudGx5IHVzZWQgZm9yIHRva2VuIHJldm9jYXRpb247IHdpbGwgYmUgY29tcGxldGVseSByZW1vdmVkXG4gICAqICAgIHNpbmNlIHRva2VuIHJldm9jYXRpb24gc2hvdWxkIG5vdCByZXF1aXJlIG1hbmFnZW1lbnQgc2Vzc2lvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgIHNlc3Npb25EYXRhOiBTaWduZXJTZXNzaW9uRGF0YSxcbiAgICBzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgICBjcz86IEN1YmVTaWduZXIsXG4gICkge1xuICAgIHN1cGVyKHNlc3Npb25EYXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0sIHNlc3Npb25EYXRhLm9yZ19pZCwgc3RvcmFnZSk7XG4gICAgdGhpcy5jcyA9IGNzO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KHNlc3Npb25EYXRhLnRva2VuKTtcbiAgfVxufVxuIl19