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
var _CubeSignerClient_apiClient;
import { ApiClient } from "./client/api_client.js";
// used in doc comments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TotpChallenge } from "./mfa.js";
import { Org } from "./org.js";
import { Key } from "./index.js";
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export class CubeSignerClient {
    /**
     * @returns The underlying API client. This client provides direct API access without convenience wrappers.
     */
    get apiClient() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f");
    }
    /** @returns The environment. */
    get env() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").env;
    }
    /** @returns All available regional environments */
    get envs() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").envs;
    }
    /**
     * @returns The org ID of the client.
     */
    get orgId() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").orgId;
    }
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     */
    constructor(apiClient) {
        _CubeSignerClient_apiClient.set(this, void 0);
        __classPrivateFieldSet(this, _CubeSignerClient_apiClient, apiClient, "f");
    }
    /**
     * Creates a NEW client with a preferred regional environment {@link env} to use.
     *
     * @param env Preferred environment to use.
     * @returns A new client with updated preferred environment.
     */
    withPreferredEnv(env) {
        return new CubeSignerClient(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").withPreferredEnv(env));
    }
    /**
     * Construct a client with a session or session manager
     *
     * @param session The session (object or base64 string) or manager that will back this client
     * @param targetOrgId The ID of the organization this client should operate on. Defaults to
     *   the org id from the supplied session. The only scenario in which it makes sense to use
     *   a {@link targetOrgId} different from the session org id is if {@link targetOrgId} is a
     *   child organization of the session organization.
     * @returns A client
     */
    static async create(session, targetOrgId) {
        return new CubeSignerClient(await ApiClient.create(session, targetOrgId));
    }
    /**
     * Get the org associated with this session.
     *
     * @returns The org
     */
    org() {
        return new Org(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), this.orgId);
    }
    /**
     * Get information about an org.
     *
     * @param orgId The ID or name of the org
     * @returns CubeSigner client for the requested org.
     */
    getOrg(orgId) {
        return new Org(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), orgId);
    }
    /**
     * Obtain information about the current user.
     *
     * Same as {@link ApiClient.userGet}, see its documentation for more details.
     *
     * @returns A function that resolves to the current user's information
     */
    get user() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userGet.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Get all keys accessible to the current session
     *
     * NOTE: this may be a subset from the keys in the current org.
     *
     * @returns The keys that a client can access
     */
    async sessionKeys() {
        return await __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f")
            .sessionKeysList()
            .then((keyInfos) => keyInfos.map((keyInfo) => new Key(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), keyInfo)));
    }
    /**
     * Create a new OIDC-backed session.
     *
     * Same as {@link ApiClient.oidcSessionCreate}, see its documentation for more details.
     *
     * @param args Request arguments
     * @returns The new session data
     */
    static async createOidcSession(...args) {
        return await ApiClient.oidcSessionCreate(...args);
    }
    /**
     * Prove an OIDC identity.
     *
     * Same as {@link ApiClient.identityProveOidc}, see its documentation for more details.
     *
     * @param args Request arguments
     * @returns Proof of authentication
     */
    static async proveOidcIdentity(...args) {
        return await ApiClient.identityProveOidc(...args);
    }
    /**
     * Initialize email OTP authentication.
     *
     * Same as {@link ApiClient.initEmailOtpAuth}, see its documentation for more details.
     *
     * @param args Request arguments
     * @returns — The partial OIDC token that must be combined with the signature in the email
     */
    static async initEmailOtpAuth(...args) {
        return await ApiClient.initEmailOtpAuth(...args);
    }
    /**
     * Creates a request to add a new FIDO device.
     *
     * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
     *
     * MFA may be required.
     *
     * Same as {@link ApiClient.userFidoRegisterInit}, see its documentation for more details.
     *
     * @returns A function that resolves to an AddFidoChallenge
     */
    get addFido() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userFidoRegisterInit.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * Same as {@link ApiClient.userFidoDelete}, see its documentation for more details.
     *
     * @returns A function that deletes a FIDO key
     */
    get deleteFido() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userFidoDelete.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Create a reference to an existing TOTP challenge.
     *
     * @param totpId The ID of the challenge
     * @returns The TOTP challenge
     */
    getTotpChallenge(totpId) {
        return new TotpChallenge(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), totpId);
    }
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered by calling {@link TotpChallenge.answer}.
     *
     * Same as {@link ApiClient.userTotpResetInit}, see its documentation for more details.
     *
     * @returns A promise that resolves to a TOTP challenge
     */
    get resetTotp() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userTotpResetInit.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Creates a request to change this user's verified email.
     *
     * Same as {@link ApiClient.userEmailResetInit}, see its documentation for more details.
     *
     * @returns A promise that resolves to an email challenge
     */
    get resetEmail() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userEmailResetInit.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * Same as {@link ApiClient.userTotpVerify}, see its documentation for more details.
     *
     * @returns A function that verifies the TOTP code, throwing if not valid
     */
    get verifyTotp() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userTotpVerify.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * Same as {@link ApiClient.userTotpDelete}, see its documentation for more details.
     *
     * @returns A function that deletes TOTP from the user
     */
    get deleteTotp() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userTotpDelete.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Add a listener for an event
     *
     * Same as {@link ApiClient.addEventListener}, see its documentation for more details.
     *
     * @returns A function that resolves to the ApiClient with the new listener
     */
    get addEventListener() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").addEventListener.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Remove a listener for an event
     *
     * Same as {@link ApiClient.removeEventListener}, see its documentation for more details.
     *
     * @returns A function that resolves to the ApiClient with a removed listener
     */
    get removeEventListener() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").removeEventListener.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Get this session metadata.
     *
     * @returns Current session metadata.
     */
    async getSession() {
        return await __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").sessionGet();
    }
    /**
     * Revoke this session.
     */
    async revokeSession() {
        await __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").sessionRevoke();
    }
}
_CubeSignerClient_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFHbkQsdUJBQXVCO0FBQ3ZCLDZEQUE2RDtBQUM3RCxPQUFPLEVBQW9CLGFBQWEsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUMzRCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBUS9CLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFVakM7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQUczQjs7T0FFRztJQUNILElBQUksU0FBUztRQUNYLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxnQ0FBZ0M7SUFDaEMsSUFBSSxHQUFHO1FBQ0wsT0FBTyx1QkFBQSxJQUFJLG1DQUFXLENBQUMsR0FBRyxDQUFDO0lBQzdCLENBQUM7SUFFRCxtREFBbUQ7SUFDbkQsSUFBSSxJQUFJO1FBQ04sT0FBTyx1QkFBQSxJQUFJLG1DQUFXLENBQUMsSUFBSSxDQUFDO0lBQzlCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksS0FBSztRQUNQLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLEtBQUssQ0FBQztJQUMvQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksU0FBb0I7UUEvQnZCLDhDQUFzQjtRQWdDN0IsdUJBQUEsSUFBSSwrQkFBYyxTQUFTLE1BQUEsQ0FBQztJQUM5QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxnQkFBZ0IsQ0FBQyxHQUE2QjtRQUM1QyxPQUFPLElBQUksZ0JBQWdCLENBQUMsdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNI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QUksQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxJQUFJLFVBQVU7UUFDWixPQUFPLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxJQUFJLGdCQUFnQjtRQUNsQixPQUFPLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILElBQUksbUJBQW1CO1FBQ3JCLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxVQUFVO1FBQ2QsT0FBTyxNQUFNLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsYUFBYTtRQUNqQixNQUFNLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcGlDbGllbnQgfSBmcm9tIFwiLi9jbGllbnQvYXBpX2NsaWVudC50c1wiO1xuaW1wb3J0IHR5cGUgeyBFbWFpbE90cFJlc3BvbnNlLCBJZGVudGl0eVByb29mLCBSYXRjaGV0Q29uZmlnIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzLnRzXCI7XG5cbi8vIHVzZWQgaW4gZG9jIGNvbW1lbnRzXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBBZGRGaWRvQ2hhbGxlbmdlLCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4vbWZhLnRzXCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmcudHNcIjtcbmltcG9ydCB0eXBlIHtcbiAgRW52SW50ZXJmYWNlLFxuICBNZmFSZWNlaXB0cyxcbiAgU2Vzc2lvbkRhdGEsXG4gIFNlc3Npb25JbmZvLFxuICBTZXNzaW9uTWFuYWdlcixcbn0gZnJvbSBcIi4vaW5kZXgudHNcIjtcbmltcG9ydCB7IEtleSB9IGZyb20gXCIuL2luZGV4LnRzXCI7XG5cbi8qKiBPcHRpb25zIGZvciBsb2dnaW5nIGluIHdpdGggT0lEQyB0b2tlbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPaWRjQXV0aE9wdGlvbnMge1xuICAvKiogT3B0aW9uYWwgdG9rZW4gbGlmZXRpbWVzICovXG4gIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWc7XG4gIC8qKiBPcHRpb25hbCBNRkEgcmVjZWlwdChzKSAqL1xuICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHM7XG59XG5cbi8qKlxuICogQ2xpZW50IHRvIHVzZSB0byBzZW5kIHJlcXVlc3RzIHRvIEN1YmVTaWduZXIgc2VydmljZXNcbiAqIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyQ2xpZW50IHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgdW5kZXJseWluZyBBUEkgY2xpZW50LiBUaGlzIGNsaWVudCBwcm92aWRlcyBkaXJlY3QgQVBJIGFjY2VzcyB3aXRob3V0IGNvbnZlbmllbmNlIHdyYXBwZXJzLlxuICAgKi9cbiAgZ2V0IGFwaUNsaWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50O1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBlbnZpcm9ubWVudC4gKi9cbiAgZ2V0IGVudigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmVudjtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBBbGwgYXZhaWxhYmxlIHJlZ2lvbmFsIGVudmlyb25tZW50cyAqL1xuICBnZXQgZW52cygpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmVudnM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIG9yZyBJRCBvZiB0aGUgY2xpZW50LlxuICAgKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQpIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIE5FVyBjbGllbnQgd2l0aCBhIHByZWZlcnJlZCByZWdpb25hbCBlbnZpcm9ubWVudCB7QGxpbmsgZW52fSB0byB1c2UuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgUHJlZmVycmVkIGVudmlyb25tZW50IHRvIHVzZS5cbiAgICogQHJldHVybnMgQSBuZXcgY2xpZW50IHdpdGggdXBkYXRlZCBwcmVmZXJyZWQgZW52aXJvbm1lbnQuXG4gICAqL1xuICB3aXRoUHJlZmVycmVkRW52KGVudjogRW52SW50ZXJmYWNlIHwgdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyQ2xpZW50KHRoaXMuI2FwaUNsaWVudC53aXRoUHJlZmVycmVkRW52KGVudikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIGNsaWVudCB3aXRoIGEgc2Vzc2lvbiBvciBzZXNzaW9uIG1hbmFnZXJcbiAgICpcbiAgICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gKG9iamVjdCBvciBiYXNlNjQgc3RyaW5nKSBvciBtYW5hZ2VyIHRoYXQgd2lsbCBiYWNrIHRoaXMgY2xpZW50XG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi4gRGVmYXVsdHMgdG9cbiAgICogICB0aGUgb3JnIGlkIGZyb20gdGhlIHN1cHBsaWVkIHNlc3Npb24uIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZVxuICAgKiAgIGEge0BsaW5rIHRhcmdldE9yZ0lkfSBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmcgaWQgaXMgaWYge0BsaW5rIHRhcmdldE9yZ0lkfSBpcyBhXG4gICAqICAgY2hpbGQgb3JnYW5pemF0aW9uIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybnMgQSBjbGllbnRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGUoXG4gICAgc2Vzc2lvbjogc3RyaW5nIHwgU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSxcbiAgICB0YXJnZXRPcmdJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyQ2xpZW50PiB7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyQ2xpZW50KGF3YWl0IEFwaUNsaWVudC5jcmVhdGUoc2Vzc2lvbiwgdGFyZ2V0T3JnSWQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG9yZyBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnXG4gICAqL1xuICBvcmcoKTogT3JnIHtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLiNhcGlDbGllbnQsIHRoaXMub3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgSUQgb3IgbmFtZSBvZiB0aGUgb3JnXG4gICAqIEByZXR1cm5zIEN1YmVTaWduZXIgY2xpZW50IGZvciB0aGUgcmVxdWVzdGVkIG9yZy5cbiAgICovXG4gIGdldE9yZyhvcmdJZDogc3RyaW5nKTogT3JnIHtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLiNhcGlDbGllbnQsIG9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJHZXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSBjdXJyZW50IHVzZXIncyBpbmZvcm1hdGlvblxuICAgKi9cbiAgZ2V0IHVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyR2V0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGtleXMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCBzZXNzaW9uXG4gICAqXG4gICAqIE5PVEU6IHRoaXMgbWF5IGJlIGEgc3Vic2V0IGZyb20gdGhlIGtleXMgaW4gdGhlIGN1cnJlbnQgb3JnLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUga2V5cyB0aGF0IGEgY2xpZW50IGNhbiBhY2Nlc3NcbiAgICovXG4gIGFzeW5jIHNlc3Npb25LZXlzKCk6IFByb21pc2U8S2V5W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50XG4gICAgICAuc2Vzc2lvbktleXNMaXN0KClcbiAgICAgIC50aGVuKChrZXlJbmZvcykgPT4ga2V5SW5mb3MubWFwKChrZXlJbmZvKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbykpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgT0lEQy1iYWNrZWQgc2Vzc2lvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9pZGNTZXNzaW9uQ3JlYXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEBwYXJhbSBhcmdzIFJlcXVlc3QgYXJndW1lbnRzXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgc2Vzc2lvbiBkYXRhXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlT2lkY1Nlc3Npb24oXG4gICAgLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgQXBpQ2xpZW50Lm9pZGNTZXNzaW9uQ3JlYXRlPlxuICApOiBQcm9taXNlPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgQXBpQ2xpZW50Lm9pZGNTZXNzaW9uQ3JlYXRlPj4+IHtcbiAgICByZXR1cm4gYXdhaXQgQXBpQ2xpZW50Lm9pZGNTZXNzaW9uQ3JlYXRlKC4uLmFyZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb3ZlIGFuIE9JREMgaWRlbnRpdHkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pZGVudGl0eVByb3ZlT2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcGFyYW0gYXJncyBSZXF1ZXN0IGFyZ3VtZW50c1xuICAgKiBAcmV0dXJucyBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHByb3ZlT2lkY0lkZW50aXR5KFxuICAgIC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIEFwaUNsaWVudC5pZGVudGl0eVByb3ZlT2lkYz5cbiAgKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5pZGVudGl0eVByb3ZlT2lkYyguLi5hcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGVtYWlsIE9UUCBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmluaXRFbWFpbE90cEF1dGh9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHBhcmFtIGFyZ3MgUmVxdWVzdCBhcmd1bWVudHNcbiAgICogQHJldHVybnMg4oCUIFRoZSBwYXJ0aWFsIE9JREMgdG9rZW4gdGhhdCBtdXN0IGJlIGNvbWJpbmVkIHdpdGggdGhlIHNpZ25hdHVyZSBpbiB0aGUgZW1haWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpbml0RW1haWxPdHBBdXRoKFxuICAgIC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIEFwaUNsaWVudC5pbml0RW1haWxPdHBBdXRoPlxuICApOiBQcm9taXNlPEVtYWlsT3RwUmVzcG9uc2U+IHtcbiAgICByZXR1cm4gYXdhaXQgQXBpQ2xpZW50LmluaXRFbWFpbE90cEF1dGgoLi4uYXJncyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIE1GQSBtYXkgYmUgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRmlkb1JlZ2lzdGVySW5pdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYW4gQWRkRmlkb0NoYWxsZW5nZVxuICAgKi9cbiAgZ2V0IGFkZEZpZG8oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRmlkb1JlZ2lzdGVySW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgRklETyBrZXkgZnJvbSB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIEFsbG93ZWQgb25seSBpZiBUT1RQIGlzIGFsc28gZGVmaW5lZC5cbiAgICogTUZBIHZpYSBUT1RQIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJGaWRvRGVsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGEgRklETyBrZXlcbiAgICovXG4gIGdldCBkZWxldGVGaWRvKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckZpZG9EZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHJlZmVyZW5jZSB0byBhbiBleGlzdGluZyBUT1RQIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHBhcmFtIHRvdHBJZCBUaGUgSUQgb2YgdGhlIGNoYWxsZW5nZVxuICAgKiBAcmV0dXJucyBUaGUgVE9UUCBjaGFsbGVuZ2VcbiAgICovXG4gIGdldFRvdHBDaGFsbGVuZ2UodG90cElkOiBzdHJpbmcpOiBUb3RwQ2hhbGxlbmdlIHtcbiAgICByZXR1cm4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcy4jYXBpQ2xpZW50LCB0b3RwSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gUmV0dXJucyBhIHtAbGluayBUb3RwQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlclRvdHBSZXNldEluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBUT1RQIGNoYWxsZW5nZVxuICAgKi9cbiAgZ2V0IHJlc2V0VG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJUb3RwUmVzZXRJbml0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdGhpcyB1c2VyJ3MgdmVyaWZpZWQgZW1haWwuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRW1haWxSZXNldEluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gZW1haWwgY2hhbGxlbmdlXG4gICAqL1xuICBnZXQgcmVzZXRFbWFpbCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFbWFpbFJlc2V0SW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJUb3RwVmVyaWZ5fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCB2ZXJpZmllcyB0aGUgVE9UUCBjb2RlLCB0aHJvd2luZyBpZiBub3QgdmFsaWRcbiAgICovXG4gIGdldCB2ZXJpZnlUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlclRvdHBWZXJpZnkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyVG90cERlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBUT1RQIGZyb20gdGhlIHVzZXJcbiAgICovXG4gIGdldCBkZWxldGVUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlclRvdHBEZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIGZvciBhbiBldmVudFxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuYWRkRXZlbnRMaXN0ZW5lcn0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIEFwaUNsaWVudCB3aXRoIHRoZSBuZXcgbGlzdGVuZXJcbiAgICovXG4gIGdldCBhZGRFdmVudExpc3RlbmVyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuYWRkRXZlbnRMaXN0ZW5lci5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGEgbGlzdGVuZXIgZm9yIGFuIGV2ZW50XG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5yZW1vdmVFdmVudExpc3RlbmVyfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgQXBpQ2xpZW50IHdpdGggYSByZW1vdmVkIGxpc3RlbmVyXG4gICAqL1xuICBnZXQgcmVtb3ZlRXZlbnRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGlzIHNlc3Npb24gbWV0YWRhdGEuXG4gICAqXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgc2Vzc2lvbiBtZXRhZGF0YS5cbiAgICovXG4gIGFzeW5jIGdldFNlc3Npb24oKTogUHJvbWlzZTxTZXNzaW9uSW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkdldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSB0aGlzIHNlc3Npb24uXG4gICAqL1xuICBhc3luYyByZXZva2VTZXNzaW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uUmV2b2tlKCk7XG4gIH1cbn1cbiJdfQ==