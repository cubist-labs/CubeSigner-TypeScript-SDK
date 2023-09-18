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
        const resp = await (await this.cs.management()).del("/v0/org/{org_id}/roles/{role_id}/tokens/{session_id}", {
            params: {
                path: {
                    org_id: session.org_id,
                    role_id: session.role_id,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esa0NBQW1DO0FBRW5DLHVEQUE4RDtBQXNDOUQsTUFBTSw0QkFBNEIsR0FBMEI7SUFDMUQsT0FBTyxFQUFFLE1BQU07SUFDZixJQUFJLEVBQUUsR0FBRztJQUNULE9BQU8sRUFBRSxLQUFLO0NBQ2YsQ0FBQztBQUVGLG1DQUFtQztBQUNuQyxNQUFhLG9CQUFxQixTQUFRLG1DQUFvQztJQUk1RTs7O09BR0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDN0IsT0FBTyx1QkFBQSxJQUFJLG9DQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsTUFBTTtRQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1NBQ3BEO1FBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FDakIsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUMzQixDQUFDLEdBQUcsQ0FBQyxzREFBc0QsRUFBRTtZQUM1RCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFO29CQUNKLE1BQU0sRUFBRSxPQUFP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QUNQLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixZQUFZO1lBQ1osaURBQWlEO1lBQ2pELEdBQUcsRUFBRTtnQkFDSCxDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUc7YUFDaEM7U0FDRixDQUFDO1FBQ0YsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQzFCLE9BQTZCLEVBQzdCLEVBQWU7UUFFZixNQUFNLE9BQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxPQUFPLElBQUksb0JBQW9CLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxZQUNFLFdBQThCLEVBQzlCLE9BQTZCLEVBQzdCLEVBQWU7UUFFZixLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUEzSjdFLCtDQUFnQjtRQTRKZCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLHVCQUFBLElBQUksZ0NBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQUEsQ0FBQztJQUN0RCxDQUFDO0NBQ0Y7QUFqS0Qsb0RBaUtDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3ViZVNpZ25lciB9IGZyb20gXCIuLlwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vdXRpbFwiO1xuaW1wb3J0IHsgY29tcG9uZW50cywgcGF0aHMsIENsaWVudCB9IGZyb20gXCIuLi9jbGllbnRcIjtcbmltcG9ydCB7IEhhc0VudiwgT3JnU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IFNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbl9zdG9yYWdlXCI7XG5cbmV4cG9ydCB0eXBlIENsaWVudFNlc3Npb25JbmZvID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJDbGllbnRTZXNzaW9uSW5mb1wiXTtcblxuZXhwb3J0IHR5cGUgQ3JlYXRlU2lnbmVyU2Vzc2lvblJlcXVlc3QgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3Rva2Vuc1wiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgUmVmcmVzaFNpZ25lclNlc3Npb25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L3Rva2VuL3JlZnJlc2hcIl1bXCJwYXRjaFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbi8qKiBKU09OIHJlcHJlc2VudGF0aW9uIG9mIG91ciBcInNpZ25lciBzZXNzaW9uXCIgZmlsZSBmb3JtYXQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbk9iamVjdCB7XG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIElEICovXG4gIG9yZ19pZDogc3RyaW5nO1xuICAvKiogVGhlIHJvbGUgSUQgKi9cbiAgcm9sZV9pZDogc3RyaW5nO1xuICAvKiogVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb24gdG9rZW4gKi9cbiAgcHVycG9zZTogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFNlc3Npb24gaW5mbyAqL1xuICBzZXNzaW9uX2luZm86IENsaWVudFNlc3Npb25JbmZvO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25EYXRhIGV4dGVuZHMgU2lnbmVyU2Vzc2lvbk9iamVjdCwgSGFzRW52IHt9XG5cbi8qKiBUeXBlIG9mIHN0b3JhZ2UgcmVxdWlyZWQgZm9yIHNpZ25lciBzZXNzaW9ucyAqL1xuZXhwb3J0IHR5cGUgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxTaWduZXJTZXNzaW9uRGF0YT47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbkxpZmV0aW1lIHtcbiAgLyoqIFNlc3Npb24gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgd2VlayAoNjA0ODAwKS4gKi9cbiAgc2Vzc2lvbj86IG51bWJlcjtcbiAgLyoqIEF1dGggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBmaXZlIG1pbnV0ZXMgKDMwMCkuICovXG4gIGF1dGg6IG51bWJlcjtcbiAgLyoqIFJlZnJlc2ggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgZGF5ICg4NjQwMCkuICovXG4gIHJlZnJlc2g/OiBudW1iZXI7XG59XG5cbmNvbnN0IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU6IFNpZ25lclNlc3Npb25MaWZldGltZSA9IHtcbiAgc2Vzc2lvbjogNjA0ODAwLFxuICBhdXRoOiAzMDAsXG4gIHJlZnJlc2g6IDg2NDAwLFxufTtcblxuLyoqIE1hbmFnZXIgZm9yIHNpZ25lciBzZXNzaW9ucy4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXJTZXNzaW9uTWFuYWdlciBleHRlbmRzIE9yZ1Nlc3Npb25NYW5hZ2VyPFNpZ25lclNlc3Npb25EYXRhPiB7XG4gIHJlYWRvbmx5IGNzPzogQ3ViZVNpZ25lcjtcbiAgI2NsaWVudDogQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IGF1dGggdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHNlc3Npb24udG9rZW47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNsaWVudCB3aXRoIHRoZSBjdXJyZW50IHNlc3Npb24gYW5kIHJlZnJlc2hlcyB0aGUgY3VycmVudFxuICAgKiBzZXNzaW9uLiBNYXkgKipVUERBVEUvTVVUQVRFKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIGNsaWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKiBSZXZva2VzIHRoZSBzZXNzaW9uLiAqL1xuICBhc3luYyByZXZva2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmNzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBtYW5hZ2VtZW50IHNlc3Npb24gYXZhaWxhYmxlXCIpO1xuICAgIH1cbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuY3MubWFuYWdlbWVudCgpXG4gICAgKS5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS90b2tlbnMve3Nlc3Npb25faWR9XCIsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgb3JnX2lkOiBzZXNzaW9uLm9yZ19pZCxcbiAgICAgICAgICByb2xlX2lkOiBzZXNzaW9uLnJvbGVfaWQsXG4gICAgICAgICAgc2Vzc2lvbl9pZDogc2Vzc2lvbi5zZXNzaW9uX2luZm8uc2Vzc2lvbl9pZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGlzU3RhbGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiB0aGlzLmhhc0V4cGlyZWQoc2Vzc2lvbi5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBhbmQgKipVUERBVEVTL01VVEFURVMqKiBzZWxmLlxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgY29uc3QgY3NpID0gc2Vzc2lvbi5zZXNzaW9uX2luZm87XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2NsaWVudC5wYXRjaChcIi92MS9vcmcve29yZ19pZH0vdG9rZW4vcmVmcmVzaFwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHNlc3Npb24ub3JnX2lkIH0gfSxcbiAgICAgIGJvZHk6IDxSZWZyZXNoU2lnbmVyU2Vzc2lvblJlcXVlc3Q+e1xuICAgICAgICBlcG9jaF9udW06IGNzaS5lcG9jaCxcbiAgICAgICAgZXBvY2hfdG9rZW46IGNzaS5lcG9jaF90b2tlbixcbiAgICAgICAgb3RoZXJfdG9rZW46IGNzaS5yZWZyZXNoX3Rva2VuLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICBhd2FpdCB0aGlzLnN0b3JhZ2Uuc2F2ZSg8U2lnbmVyU2Vzc2lvbkRhdGE+e1xuICAgICAgLi4uc2Vzc2lvbixcbiAgICAgIHNlc3Npb25faW5mbzogZGF0YS5zZXNzaW9uX2luZm8sXG4gICAgICB0b2tlbjogZGF0YS50b2tlbixcbiAgICB9KTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudChkYXRhLnRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24uXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgUm9sZSBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVycG9zZSBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25MaWZldGltZX0gdHRsIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBOZXcgc2lnbmVyIHNlc3Npb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGUoXG4gICAgY3M6IEN1YmVTaWduZXIsXG4gICAgc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgdHRsPzogU2lnbmVyU2Vzc2lvbkxpZmV0aW1lLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3Rva2Vuc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBwdXJwb3NlLFxuICAgICAgICBhdXRoX2xpZmV0aW1lOiB0dGw/LmF1dGggfHwgZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZS5hdXRoLFxuICAgICAgICByZWZyZXNoX2xpZmV0aW1lOiB0dGw/LnJlZnJlc2ggfHwgZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZS5yZWZyZXNoLFxuICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiB0dGw/LnNlc3Npb24gfHwgZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZS5zZXNzaW9uLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICBjb25zdCBzZXNzaW9uX2luZm8gPSBkYXRhLnNlc3Npb25faW5mbztcbiAgICBpZiAoIXNlc3Npb25faW5mbykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2lnbmVyIHNlc3Npb24gaW5mbyBtaXNzaW5nXCIpO1xuICAgIH1cbiAgICBjb25zdCBzZXNzaW9uRGF0YSA9IHtcbiAgICAgIG9yZ19pZDogb3JnSWQsXG4gICAgICByb2xlX2lkOiByb2xlSWQsXG4gICAgICBwdXJwb3NlLFxuICAgICAgdG9rZW46IGRhdGEudG9rZW4sXG4gICAgICBzZXNzaW9uX2luZm8sXG4gICAgICAvLyBLZWVwIGNvbXBhdGliaWxpdHkgd2l0aCB0b2tlbnMgcHJvZHVjZWQgYnkgQ0xJXG4gICAgICBlbnY6IHtcbiAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogY3MuZW52LFxuICAgICAgfSxcbiAgICB9O1xuICAgIGF3YWl0IHN0b3JhZ2Uuc2F2ZShzZXNzaW9uRGF0YSk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uTWFuYWdlcihzZXNzaW9uRGF0YSwgc3RvcmFnZSwgY3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXMgYW4gZXhpc3Rpbmcgc2Vzc2lvbiB0byBjcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIE9wdGlvbmFsIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqICAgIEN1cnJlbnRseSB1c2VkIGZvciB0b2tlbiByZXZvY2F0aW9uOyB3aWxsIGJlIGNvbXBsZXRlbHkgcmVtb3ZlZFxuICAgKiAgICBzaW5jZSB0b2tlbiByZXZvY2F0aW9uIHNob3VsZCBub3QgcmVxdWlyZSBtYW5hZ2VtZW50IHNlc3Npb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2luZ2VyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZEZyb21TdG9yYWdlKFxuICAgIHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICAgIGNzPzogQ3ViZVNpZ25lcixcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBzdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uTWFuYWdlcihzZXNzaW9uLCBzdG9yYWdlLCBjcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkRhdGF9IHNlc3Npb25EYXRhIFNlc3Npb24gZGF0YVxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzZXNzaW9uIHN0b3JhZ2UgdG8gdXNlXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgT3B0aW9uYWwgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogICAgQ3VycmVudGx5IHVzZWQgZm9yIHRva2VuIHJldm9jYXRpb247IHdpbGwgYmUgY29tcGxldGVseSByZW1vdmVkXG4gICAqICAgIHNpbmNlIHRva2VuIHJldm9jYXRpb24gc2hvdWxkIG5vdCByZXF1aXJlIG1hbmFnZW1lbnQgc2Vzc2lvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgIHNlc3Npb25EYXRhOiBTaWduZXJTZXNzaW9uRGF0YSxcbiAgICBzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgICBjcz86IEN1YmVTaWduZXIsXG4gICkge1xuICAgIHN1cGVyKHNlc3Npb25EYXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0sIHNlc3Npb25EYXRhLm9yZ19pZCwgc3RvcmFnZSk7XG4gICAgdGhpcy5jcyA9IGNzO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KHNlc3Npb25EYXRhLnRva2VuKTtcbiAgfVxufVxuIl19