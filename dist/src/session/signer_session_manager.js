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
     * @param {SessionStorage<SignerSessionObject>} storage The session storage to use
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
        await storage.save({
            org_id: orgId,
            role_id: roleId,
            purpose,
            token: data.token,
            session_info,
            // Keep compatibility with tokens produced by CLI
            env: {
                ["Dev-CubeSignerStack"]: cs.env,
            },
        });
        return new SignerSessionManager(cs, orgId, roleId, data.token, storage);
    }
    /**
     * Uses an existing session to create a new signer session manager.
     * @param {CubeSigner} cs The CubeSigner instance
     * @param {SessionStorage<SignerSessionObject>} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session manager
     */
    static async loadFromStorage(cs, storage) {
        const session = await storage.retrieve();
        return new SignerSessionManager(cs, session.org_id, session.role_id, session.token, storage);
    }
    /**
     * Constructor.
     * @param {CubeSigner} cs CubeSigner
     * @param {string} orgId The id of the org associated with this session
     * @param {string} roleId The id of the role that this session assumes
     * @param {string} token The authorization token to use
     * @param {SignerSessionStorage} storage The session storage to use
     * @internal
     */
    constructor(cs, orgId, roleId, token, storage) {
        super(cs.env, orgId, storage);
        _SignerSessionManager_client.set(this, void 0);
        this.cs = cs;
        this.roleId = roleId;
        __classPrivateFieldSet(this, _SignerSessionManager_client, this.createClient(token), "f");
    }
}
exports.SignerSessionManager = SignerSessionManager;
_SignerSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esa0NBQW1DO0FBRW5DLHVEQUE4RDtBQXNDOUQsTUFBTSw0QkFBNEIsR0FBMEI7SUFDMUQsT0FBTyxFQUFFLE1BQU07SUFDZixJQUFJLEVBQUUsR0FBRztJQUNULE9BQU8sRUFBRSxLQUFLO0NBQ2YsQ0FBQztBQUVGLG1DQUFtQztBQUNuQyxNQUFhLG9CQUFxQixTQUFRLG1DQUFvQztJQUs1RTs7O09BR0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDN0IsT0FBTyx1QkFBQSxJQUFJLG9DQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsTUFBTTtRQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1NBQ3BEO1FBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FDakIsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUMzQixDQUFDLEdBQUcsQ0FBQyxzREFBc0QsRUFBRTtZQUM1RCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFO29CQUNKLE1BQU0sRUFBRSxPQUFP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QUNmLE9BQU87WUFDUCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsWUFBWTtZQUNaLGlEQUFpRDtZQUNqRCxHQUFHLEVBQUU7Z0JBQ0gsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHO2FBQ2hDO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQzFCLEVBQWMsRUFDZCxPQUE2QjtRQUU3QixNQUFNLE9BQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxPQUFPLElBQUksb0JBQW9CLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQy9GLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILFlBQ0UsRUFBYyxFQUNkLEtBQWEsRUFDYixNQUFjLEVBQ2QsS0FBYSxFQUNiLE9BQTZCO1FBRTdCLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQTFKaEMsK0NBQWdCO1FBMkpkLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsdUJBQUEsSUFBSSxnQ0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFBLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBbEtELG9EQWtLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN1YmVTaWduZXIgfSBmcm9tIFwiLi5cIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4uL3V0aWxcIjtcbmltcG9ydCB7IGNvbXBvbmVudHMsIHBhdGhzLCBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50XCI7XG5pbXBvcnQgeyBIYXNFbnYsIE9yZ1Nlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIi4vc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb25fc3RvcmFnZVwiO1xuXG5leHBvcnQgdHlwZSBDbGllbnRTZXNzaW9uSW5mbyA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiQ2xpZW50U2Vzc2lvbkluZm9cIl07XG5cbmV4cG9ydCB0eXBlIENyZWF0ZVNpZ25lclNlc3Npb25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS90b2tlbnNcIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS90b2tlbi9yZWZyZXNoXCJdW1wicGF0Y2hcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiBvdXIgXCJzaWduZXIgc2Vzc2lvblwiIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25PYmplY3Qge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIElEICovXG4gIHJvbGVfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uIHRva2VuICovXG4gIHB1cnBvc2U6IHN0cmluZztcbiAgLyoqIFRoZSB0b2tlbiB0byBpbmNsdWRlIGluIEF1dGhvcml6YXRpb24gaGVhZGVyICovXG4gIHRva2VuOiBzdHJpbmc7XG4gIC8qKiBTZXNzaW9uIGluZm8gKi9cbiAgc2Vzc2lvbl9pbmZvOiBDbGllbnRTZXNzaW9uSW5mbztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaWduZXJTZXNzaW9uRGF0YSBleHRlbmRzIFNpZ25lclNlc3Npb25PYmplY3QsIEhhc0VudiB7fVxuXG4vKiogVHlwZSBvZiBzdG9yYWdlIHJlcXVpcmVkIGZvciBzaWduZXIgc2Vzc2lvbnMgKi9cbmV4cG9ydCB0eXBlIFNpZ25lclNlc3Npb25TdG9yYWdlID0gU2Vzc2lvblN0b3JhZ2U8U2lnbmVyU2Vzc2lvbkRhdGE+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25MaWZldGltZSB7XG4gIC8qKiBTZXNzaW9uIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIHdlZWsgKDYwNDgwMCkuICovXG4gIHNlc3Npb24/OiBudW1iZXI7XG4gIC8qKiBBdXRoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gZml2ZSBtaW51dGVzICgzMDApLiAqL1xuICBhdXRoOiBudW1iZXI7XG4gIC8qKiBSZWZyZXNoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIGRheSAoODY0MDApLiAqL1xuICByZWZyZXNoPzogbnVtYmVyO1xufVxuXG5jb25zdCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lOiBTaWduZXJTZXNzaW9uTGlmZXRpbWUgPSB7XG4gIHNlc3Npb246IDYwNDgwMCxcbiAgYXV0aDogMzAwLFxuICByZWZyZXNoOiA4NjQwMCxcbn07XG5cbi8qKiBNYW5hZ2VyIGZvciBzaWduZXIgc2Vzc2lvbnMuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBPcmdTZXNzaW9uTWFuYWdlcjxTaWduZXJTZXNzaW9uRGF0YT4ge1xuICByZWFkb25seSBjcz86IEN1YmVTaWduZXI7XG4gIHJlYWRvbmx5IHJvbGVJZDogc3RyaW5nO1xuICAjY2xpZW50OiBDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGN1cnJlbnQgYXV0aCB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gc2Vzc2lvbi50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgY2xpZW50IHdpdGggdGhlIGN1cnJlbnQgc2Vzc2lvbiBhbmQgcmVmcmVzaGVzIHRoZSBjdXJyZW50XG4gICAqIHNlc3Npb24uIE1heSAqKlVQREFURS9NVVRBVEUqKiBzZWxmLlxuICAgKi9cbiAgYXN5bmMgY2xpZW50KCk6IFByb21pc2U8Q2xpZW50PiB7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoSWZOZWVkZWQoKTtcbiAgICByZXR1cm4gdGhpcy4jY2xpZW50O1xuICB9XG5cbiAgLyoqIFJldm9rZXMgdGhlIHNlc3Npb24uICovXG4gIGFzeW5jIHJldm9rZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuY3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIG1hbmFnZW1lbnQgc2Vzc2lvbiBhdmFpbGFibGVcIik7XG4gICAgfVxuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5jcy5tYW5hZ2VtZW50KClcbiAgICApLmRlbChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3Rva2Vucy97c2Vzc2lvbl9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHNlc3Npb24ub3JnX2lkLFxuICAgICAgICAgIHJvbGVfaWQ6IHNlc3Npb24ucm9sZV9pZCxcbiAgICAgICAgICBzZXNzaW9uX2lkOiBzZXNzaW9uLnNlc3Npb25faW5mby5zZXNzaW9uX2lkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgaXNTdGFsZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHRoaXMuaGFzRXhwaXJlZChzZXNzaW9uLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cCk7XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBzZXNzaW9uIGFuZCAqKlVQREFURVMvTVVUQVRFUyoqIHNlbGYuXG4gICAqL1xuICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBjb25zdCBjc2kgPSBzZXNzaW9uLnNlc3Npb25faW5mbztcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY2xpZW50LnBhdGNoKFwiL3YxL29yZy97b3JnX2lkfS90b2tlbi9yZWZyZXNoXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogc2Vzc2lvbi5vcmdfaWQgfSB9LFxuICAgICAgYm9keTogPFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdD57XG4gICAgICAgIGVwb2NoX251bTogY3NpLmVwb2NoLFxuICAgICAgICBlcG9jaF90b2tlbjogY3NpLmVwb2NoX3Rva2VuLFxuICAgICAgICBvdGhlcl90b2tlbjogY3NpLnJlZnJlc2hfdG9rZW4sXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlKDxTaWduZXJTZXNzaW9uRGF0YT57XG4gICAgICAuLi5zZXNzaW9uLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBkYXRhLnNlc3Npb25faW5mbyxcbiAgICAgIHRva2VuOiBkYXRhLnRva2VuLFxuICAgIH0pO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KGRhdGEudG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1Nlc3Npb25TdG9yYWdlPFNpZ25lclNlc3Npb25PYmplY3Q+fSBzdG9yYWdlIFRoZSBzZXNzaW9uIHN0b3JhZ2UgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBPcmcgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkxpZmV0aW1lfSB0dGwgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IE5ldyBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZShcbiAgICBjczogQ3ViZVNpZ25lcixcbiAgICBzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHJvbGVJZDogc3RyaW5nLFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICB0dGw/OiBTaWduZXJTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdG9rZW5zXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIHB1cnBvc2UsXG4gICAgICAgIGF1dGhfbGlmZXRpbWU6IHR0bD8uYXV0aCB8fCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lLmF1dGgsXG4gICAgICAgIHJlZnJlc2hfbGlmZXRpbWU6IHR0bD8ucmVmcmVzaCB8fCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lLnJlZnJlc2gsXG4gICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IHR0bD8uc2Vzc2lvbiB8fCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lLnNlc3Npb24sXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIGNvbnN0IHNlc3Npb25faW5mbyA9IGRhdGEuc2Vzc2lvbl9pbmZvO1xuICAgIGlmICghc2Vzc2lvbl9pbmZvKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaWduZXIgc2Vzc2lvbiBpbmZvIG1pc3NpbmdcIik7XG4gICAgfVxuICAgIGF3YWl0IHN0b3JhZ2Uuc2F2ZSh7XG4gICAgICBvcmdfaWQ6IG9yZ0lkLFxuICAgICAgcm9sZV9pZDogcm9sZUlkLFxuICAgICAgcHVycG9zZSxcbiAgICAgIHRva2VuOiBkYXRhLnRva2VuLFxuICAgICAgc2Vzc2lvbl9pbmZvLFxuICAgICAgLy8gS2VlcCBjb21wYXRpYmlsaXR5IHdpdGggdG9rZW5zIHByb2R1Y2VkIGJ5IENMSVxuICAgICAgZW52OiB7XG4gICAgICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IGNzLmVudixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uTWFuYWdlcihjcywgb3JnSWQsIHJvbGVJZCwgZGF0YS50b2tlbiwgc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlcyBhbiBleGlzdGluZyBzZXNzaW9uIHRvIGNyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7U2Vzc2lvblN0b3JhZ2U8U2lnbmVyU2Vzc2lvbk9iamVjdD59IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkRnJvbVN0b3JhZ2UoXG4gICAgY3M6IEN1YmVTaWduZXIsXG4gICAgc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBuZXcgU2lnbmVyU2Vzc2lvbk1hbmFnZXIoY3MsIHNlc3Npb24ub3JnX2lkLCBzZXNzaW9uLnJvbGVfaWQsIHNlc3Npb24udG9rZW4sIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIEN1YmVTaWduZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBUaGUgaWQgb2YgdGhlIHJvbGUgdGhhdCB0aGlzIHNlc3Npb24gYXNzdW1lc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gVGhlIGF1dGhvcml6YXRpb24gdG9rZW4gdG8gdXNlXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgIGNzOiBDdWJlU2lnbmVyLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKSB7XG4gICAgc3VwZXIoY3MuZW52LCBvcmdJZCwgc3RvcmFnZSk7XG4gICAgdGhpcy5jcyA9IGNzO1xuICAgIHRoaXMucm9sZUlkID0gcm9sZUlkO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KHRva2VuKTtcbiAgfVxufVxuIl19