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
var _a, _OidcSessionManager_client, _OidcSessionManager_exchangeToken;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcSessionManager = void 0;
const util_1 = require("../util");
const session_manager_1 = require("./session_manager");
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
// An token obtained from an OIDC token is valid for 5 minutes
const OIDC_TOKEN_EXP_SECS = 300;
/** Manager for OIDC sessions. */
class OidcSessionManager extends session_manager_1.OrgSessionManager {
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
        return __classPrivateFieldGet(this, _OidcSessionManager_client, "f");
    }
    /** Revokes the session. */
    async revoke() {
        this.unsupported("revoke");
    }
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    async refresh() {
        const session = await this.storage.retrieve();
        const [token, tokenExp] = await __classPrivateFieldGet(OidcSessionManager, _a, "m", _OidcSessionManager_exchangeToken).call(OidcSessionManager, session.env, session.oidc_token, session.org_id, session.scopes);
        await this.storage.save({
            ...session,
            token: token,
            token_exp: tokenExp,
        });
        __classPrivateFieldSet(this, _OidcSessionManager_client, this.createClient(token), "f");
    }
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    async isStale() {
        const session = await this.storage.retrieve();
        return this.hasExpired(session.token_exp);
    }
    /**
     * Refreshes the session if it is about to expire.
     * @return {boolean} Whether the session token was refreshed.
     * @internal
     */
    async refreshIfNeeded() {
        if (await this.isStale()) {
            await this.refresh();
            return true;
        }
        return false;
    }
    /**
     * Authenticate an OIDC user and create a new session for them.
     * @param {EnvInterface} env The environment of the session
     * @param {SessionStorage<SignerSessionObject>} storage The signer session storage
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @return {Promise<OidcSessionManager>} The signer session
     */
    static async create(env, storage, oidcToken, orgId, scopes) {
        const [token, tokenExp] = await __classPrivateFieldGet(OidcSessionManager, _a, "m", _OidcSessionManager_exchangeToken).call(OidcSessionManager, env, oidcToken, orgId, scopes);
        await storage.save({
            env,
            org_id: orgId,
            oidc_token: oidcToken,
            token,
            token_exp: tokenExp,
            scopes,
        });
        return new OidcSessionManager(env, orgId, token, storage);
    }
    /**
     * Load from storage
     * @param {OidcSessionStorage} storage The storage to load from
     * @return {Promise<OidcSessionManager>} New OIDC session manager
     */
    static async loadFromStorage(storage) {
        const info = await storage.retrieve();
        return new OidcSessionManager(info.env, info.org_id, info.token, storage);
    }
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} orgId The id of the org associated with this session
     * @param {string} token The authorization token to use
     * @param {SessionStorage<U>} storage The storage back end to use for storing
     *                                    session information
     */
    constructor(env, orgId, token, storage) {
        super(env, orgId, storage);
        _OidcSessionManager_client.set(this, void 0);
        __classPrivateFieldSet(this, _OidcSessionManager_client, this.createClient(token), "f");
    }
}
exports.OidcSessionManager = OidcSessionManager;
_a = OidcSessionManager, _OidcSessionManager_client = new WeakMap(), _OidcSessionManager_exchangeToken = async function _OidcSessionManager_exchangeToken(env, oidcToken, orgId, scopes) {
    const client = (0, openapi_fetch_1.default)({
        baseUrl: env.SignerApiRoot,
        headers: {
            Authorization: oidcToken,
        },
    });
    const resp = await client.post("/v0/org/{org_id}/oidc", {
        params: { path: { org_id: orgId } },
        body: {
            scopes,
        },
        parseAs: "json",
    });
    const data = (0, util_1.assertOk)(resp);
    return [data.token, new Date().getTime() / 1000 + OIDC_TOKEN_EXP_SECS];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2lkY19zZXNzaW9uX21hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2Vzc2lvbi9vaWRjX3Nlc3Npb25fbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxrQ0FBbUM7QUFDbkMsdURBQXNEO0FBRXRELGtFQUF5QztBQUV6Qyw4REFBOEQ7QUFDOUQsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLENBQUM7QUF3QmhDLGlDQUFpQztBQUNqQyxNQUFhLGtCQUFtQixTQUFRLG1DQUFrQztJQUd4RTs7O09BR0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDN0IsT0FBTyx1QkFBQSxJQUFJLGtDQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsTUFBTTtRQUNWLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxNQUFNLHVCQUFBLGtCQUFrQiw2Q0FBZSxNQUFqQyxrQkFBa0IsRUFDaEQsT0FBTyxDQUFDLEdBQUcsRUFDWCxPQUFPLENBQUMsVUFBVSxFQUNsQixPQUFPLENBQUMsTUFBTSxFQUNkLE9BQU8sQ0FBQyxNQUFNLENBQ2YsQ0FBQztRQUNGLE1BQU0sSUFBSSxDQUFD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QXFCLENBQUM7SUFDaEQsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztBQUN6RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGF0aHMsIENsaWVudCB9IGZyb20gXCIuLi9jbGllbnRcIjtcbmltcG9ydCB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLlwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vdXRpbFwiO1xuaW1wb3J0IHsgT3JnU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IFNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbl9zdG9yYWdlXCI7XG5pbXBvcnQgY3JlYXRlQ2xpZW50IGZyb20gXCJvcGVuYXBpLWZldGNoXCI7XG5cbi8vIEFuIHRva2VuIG9idGFpbmVkIGZyb20gYW4gT0lEQyB0b2tlbiBpcyB2YWxpZCBmb3IgNSBtaW51dGVzXG5jb25zdCBPSURDX1RPS0VOX0VYUF9TRUNTID0gMzAwO1xuXG50eXBlIE9pZGNBdXRoUmVzcG9uc2UgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH0vb2lkY1wiXVtcInBvc3RcIl1bXCJyZXNwb25zZXNcIl1bXCIyMDBcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIE9JREMgdG9rZW4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY1Nlc3Npb25EYXRhIHtcbiAgLyoqIFRoZSBlbnZpcm9ubWVudCB0aGF0IHRoaXMgdG9rZW4gaXMgZm9yICovXG4gIGVudjogRW52SW50ZXJmYWNlO1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSBPSURDIHRva2VuIHRoYXQgdGhpcyBzZXNzaW9uIHdhcyBjcmVhdGVkIGZyb20gKi9cbiAgb2lkY190b2tlbjogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFRva2VuIGV4cGlyYXRpb24gdGltZXN0YW1wICovXG4gIHRva2VuX2V4cDogbnVtYmVyO1xuICAvKiogVGhlIHNjb3BlcyBvZiB0aGUgdG9rZW4gKi9cbiAgc2NvcGVzOiBBcnJheTxzdHJpbmc+O1xufVxuXG4vKiogVHlwZSBvZiBzdG9yYWdlIHJlcXVpcmVkIGZvciBPSURDIHNlc3Npb25zICovXG5leHBvcnQgdHlwZSBPaWRjU2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxPaWRjU2Vzc2lvbkRhdGE+O1xuXG4vKiogTWFuYWdlciBmb3IgT0lEQyBzZXNzaW9ucy4gKi9cbmV4cG9ydCBjbGFzcyBPaWRjU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBPcmdTZXNzaW9uTWFuYWdlcjxPaWRjU2Vzc2lvbkRhdGE+IHtcbiAgI2NsaWVudDogQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IGF1dGggdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHNlc3Npb24udG9rZW47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNsaWVudCB3aXRoIHRoZSBjdXJyZW50IHNlc3Npb24gYW5kIHJlZnJlc2hlcyB0aGUgY3VycmVudFxuICAgKiBzZXNzaW9uLiBNYXkgKipVUERBVEUvTVVUQVRFKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIGNsaWVudCgpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKiBSZXZva2VzIHRoZSBzZXNzaW9uLiAqL1xuICBhc3luYyByZXZva2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy51bnN1cHBvcnRlZChcInJldm9rZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24gYW5kICoqVVBEQVRFUy9NVVRBVEVTKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIGNvbnN0IFt0b2tlbiwgdG9rZW5FeHBdID0gYXdhaXQgT2lkY1Nlc3Npb25NYW5hZ2VyLiNleGNoYW5nZVRva2VuKFxuICAgICAgc2Vzc2lvbi5lbnYsXG4gICAgICBzZXNzaW9uLm9pZGNfdG9rZW4sXG4gICAgICBzZXNzaW9uLm9yZ19pZCxcbiAgICAgIHNlc3Npb24uc2NvcGVzLFxuICAgICk7XG4gICAgYXdhaXQgdGhpcy5zdG9yYWdlLnNhdmUoPE9pZGNTZXNzaW9uRGF0YT57XG4gICAgICAuLi5zZXNzaW9uLFxuICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgdG9rZW5fZXhwOiB0b2tlbkV4cCxcbiAgICB9KTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudCh0b2tlbik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gdGhpcy5oYXNFeHBpcmVkKHNlc3Npb24udG9rZW5fZXhwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24gaWYgaXQgaXMgYWJvdXQgdG8gZXhwaXJlLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBzZXNzaW9uIHRva2VuIHdhcyByZWZyZXNoZWQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaElmTmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChhd2FpdCB0aGlzLmlzU3RhbGUoKSkge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEF1dGhlbnRpY2F0ZSBhbiBPSURDIHVzZXIgYW5kIGNyZWF0ZSBhIG5ldyBzZXNzaW9uIGZvciB0aGVtLlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1Nlc3Npb25TdG9yYWdlPFNpZ25lclNlc3Npb25PYmplY3Q+fSBzdG9yYWdlIFRoZSBzaWduZXIgc2Vzc2lvbiBzdG9yYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE9pZGNTZXNzaW9uTWFuYWdlcj59IFRoZSBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBzdG9yYWdlOiBTZXNzaW9uU3RvcmFnZTxPaWRjU2Vzc2lvbkRhdGE+LFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICApOiBQcm9taXNlPE9pZGNTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IFt0b2tlbiwgdG9rZW5FeHBdID0gYXdhaXQgT2lkY1Nlc3Npb25NYW5hZ2VyLiNleGNoYW5nZVRva2VuKFxuICAgICAgZW52LFxuICAgICAgb2lkY1Rva2VuLFxuICAgICAgb3JnSWQsXG4gICAgICBzY29wZXMsXG4gICAgKTtcbiAgICBhd2FpdCBzdG9yYWdlLnNhdmUoPE9pZGNTZXNzaW9uRGF0YT57XG4gICAgICBlbnYsXG4gICAgICBvcmdfaWQ6IG9yZ0lkLFxuICAgICAgb2lkY190b2tlbjogb2lkY1Rva2VuLFxuICAgICAgdG9rZW4sXG4gICAgICB0b2tlbl9leHA6IHRva2VuRXhwLFxuICAgICAgc2NvcGVzLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgT2lkY1Nlc3Npb25NYW5hZ2VyKGVudiwgb3JnSWQsIHRva2VuLCBzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIGZyb20gc3RvcmFnZVxuICAgKiBAcGFyYW0ge09pZGNTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSB0byBsb2FkIGZyb21cbiAgICogQHJldHVybiB7UHJvbWlzZTxPaWRjU2Vzc2lvbk1hbmFnZXI+fSBOZXcgT0lEQyBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZTogT2lkY1Nlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxPaWRjU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBpbmZvID0gYXdhaXQgc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBuZXcgT2lkY1Nlc3Npb25NYW5hZ2VyKGluZm8uZW52LCBpbmZvLm9yZ19pZCwgaW5mby50b2tlbiwgc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZyBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiBUaGUgYXV0aG9yaXphdGlvbiB0b2tlbiB0byB1c2VcbiAgICogQHBhcmFtIHtTZXNzaW9uU3RvcmFnZTxVPn0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2UgZm9yIHN0b3JpbmdcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBzdG9yYWdlOiBTZXNzaW9uU3RvcmFnZTxPaWRjU2Vzc2lvbkRhdGE+LFxuICApIHtcbiAgICBzdXBlcihlbnYsIG9yZ0lkLCBzdG9yYWdlKTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudCh0b2tlbik7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8W3N0cmluZywgbnVtYmVyXT59IFRoZSBzZXNzaW9uIHRva2VuIGFuZCBpdHMgZXhwaXJhdGlvbiB0aW1lXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgI2V4Y2hhbmdlVG9rZW4oXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICk6IFByb21pc2U8W3N0cmluZywgbnVtYmVyXT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGNyZWF0ZUNsaWVudDxwYXRocz4oe1xuICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IG9pZGNUb2tlbixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9vaWRjXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBzY29wZXMsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApIGFzIE9pZGNBdXRoUmVzcG9uc2U7XG4gICAgcmV0dXJuIFtkYXRhLnRva2VuLCBuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDAgKyBPSURDX1RPS0VOX0VYUF9TRUNTXTtcbiAgfVxufVxuIl19