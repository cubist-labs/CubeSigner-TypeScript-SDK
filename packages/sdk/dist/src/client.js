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
var _CubeSignerClient_apiClient;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubeSignerClient = void 0;
const api_client_1 = require("./client/api_client");
// used in doc comments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mfa_1 = require("./mfa");
const org_1 = require("./org");
const _1 = require(".");
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
class CubeSignerClient {
    /**
     * @returns The underlying API client. This client provides direct API access without convenience wrappers.
     */
    get apiClient() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f");
    }
    /**
     * @returns The environment.
     */
    get env() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").env;
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
        return new CubeSignerClient(await api_client_1.ApiClient.create(session, targetOrgId));
    }
    /**
     * Get the org associated with this session.
     *
     * @returns The org
     */
    org() {
        return new org_1.Org(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), this.orgId);
    }
    /**
     * Get information about an org.
     *
     * @param orgId The ID or name of the org
     * @returns CubeSigner client for the requested org.
     */
    getOrg(orgId) {
        return new org_1.Org(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), orgId);
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
            .then((keyInfos) => keyInfos.map((keyInfo) => new _1.Key(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), keyInfo)));
    }
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     *
     * @param env The environment to log into
     * @param orgId The org to log into.
     * @param token The OIDC token to exchange
     * @param scopes The scopes for the new session
     * @param lifetimes Lifetimes of the new session.
     * @param mfaReceipt Optional MFA receipt(s)
     * @param purpose Optional session description.
     * @returns The session data.
     */
    static async createOidcSession(env, orgId, token, scopes, lifetimes, mfaReceipt, purpose) {
        return await api_client_1.ApiClient.oidcSessionCreate(env, orgId, token, scopes, lifetimes, mfaReceipt, purpose);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param env The environment to log into
     * @param orgId The org id in which to generate proof
     * @param token The oidc token
     * @returns Proof of authentication
     */
    static async proveOidcIdentity(env, orgId, token) {
        return await api_client_1.ApiClient.identityProveOidc(env, orgId, token);
    }
    /**
     * Initiates login via Email OTP.
     * Returns an unsigned OIDC token and sends an email to the user containing the signature of that token.
     * The OIDC token can be reconstructed by appending the signature to the partial token like so:
     *
     * token = partial_token + signature
     *
     * @param env The environment to use
     * @param orgId The org to login to
     * @param email The email to send the signature to
     * @returns The partial OIDC token that must be combined with the signature in the email
     */
    static async initEmailOtpAuth(env, orgId, email) {
        return await api_client_1.ApiClient.initEmailOtpAuth(env, orgId, email);
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
        return new mfa_1.TotpChallenge(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), totpId);
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
     * Revoke this session.
     */
    async revokeSession() {
        await __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").sessionRevoke();
    }
}
exports.CubeSignerClient = CubeSignerClient;
_CubeSignerClient_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBZ0Q7QUFHaEQsdUJBQXVCO0FBQ3ZCLDZEQUE2RDtBQUM3RCwrQkFBd0Q7QUFDeEQsK0JBQTRCO0FBUzVCLHdCQUF3QjtBQVV4Qjs7O0dBR0c7QUFDSCxNQUFhLGdCQUFnQjtJQUczQjs7T0FFRztJQUNILElBQUksU0FBUztRQUNYLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLEdBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLEtBQUs7UUFDUCxPQUFPLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxLQUFLLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxZQUFZLFNBQW9CO1FBNUJ2Qiw4Q0FBc0I7UUE2QjdCLHVCQUFBLElBQUksK0JBQWMsU0FBUyxNQUFBLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUNqQixPQUE4QyxFQUM5QyxXQUFvQjtRQUVwQixPQUFPLElBQUksZ0JBQWdCLENBQUMsTUFBTSxzQkFBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEdBQUc7UUFDRCxPQUFPLElBQUksU0FBRyxDQUFDLHVCQUFBLElBQUksbUNBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQWE7UUFDbEIsT0FBTyxJQUFJLFNBQUcsQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLEVB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SSxtQ0FBVyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILElBQUksZ0JBQWdCO1FBQ2xCLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsSUFBSSxtQkFBbUI7UUFDckIsT0FBTyx1QkFBQSxJQUFJLG1DQUFXLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxhQUFhO1FBQ2pCLE1BQU0sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQW5SRCw0Q0FtUkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcGlDbGllbnQgfSBmcm9tIFwiLi9jbGllbnQvYXBpX2NsaWVudFwiO1xuaW1wb3J0IHR5cGUgeyBJZGVudGl0eVByb29mLCBSYXRjaGV0Q29uZmlnLCBFbWFpbE90cFJlc3BvbnNlIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8vIHVzZWQgaW4gZG9jIGNvbW1lbnRzXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBBZGRGaWRvQ2hhbGxlbmdlLCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmdcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFbnZJbnRlcmZhY2UsXG4gIE1mYVJlY2VpcHRzLFxuICBTY29wZSxcbiAgU2Vzc2lvbkRhdGEsXG4gIFNlc3Npb25NYW5hZ2VyLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgS2V5IH0gZnJvbSBcIi5cIjtcblxuLyoqIE9wdGlvbnMgZm9yIGxvZ2dpbmcgaW4gd2l0aCBPSURDIHRva2VuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCB0b2tlbiBsaWZldGltZXMgKi9cbiAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZztcbiAgLyoqIE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpICovXG4gIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cztcbn1cblxuLyoqXG4gKiBDbGllbnQgdG8gdXNlIHRvIHNlbmQgcmVxdWVzdHMgdG8gQ3ViZVNpZ25lciBzZXJ2aWNlc1xuICogd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXJDbGllbnQge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIEFQSSBjbGllbnQuIFRoaXMgY2xpZW50IHByb3ZpZGVzIGRpcmVjdCBBUEkgYWNjZXNzIHdpdGhvdXQgY29udmVuaWVuY2Ugd3JhcHBlcnMuXG4gICAqL1xuICBnZXQgYXBpQ2xpZW50KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGVudmlyb25tZW50LlxuICAgKi9cbiAgZ2V0IGVudigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmVudjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIElEIG9mIHRoZSBjbGllbnQuXG4gICAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCkge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBjbGllbnQgd2l0aCBhIHNlc3Npb24gb3Igc2Vzc2lvbiBtYW5hZ2VyXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIChvYmplY3Qgb3IgYmFzZTY0IHN0cmluZykgb3IgbWFuYWdlciB0aGF0IHdpbGwgYmFjayB0aGlzIGNsaWVudFxuICAgKiBAcGFyYW0gdGFyZ2V0T3JnSWQgVGhlIElEIG9mIHRoZSBvcmdhbml6YXRpb24gdGhpcyBjbGllbnQgc2hvdWxkIG9wZXJhdGUgb24uIERlZmF1bHRzIHRvXG4gICAqICAgdGhlIG9yZyBpZCBmcm9tIHRoZSBzdXBwbGllZCBzZXNzaW9uLiBUaGUgb25seSBzY2VuYXJpbyBpbiB3aGljaCBpdCBtYWtlcyBzZW5zZSB0byB1c2VcbiAgICogICBhIHtAbGluayB0YXJnZXRPcmdJZH0gZGlmZmVyZW50IGZyb20gdGhlIHNlc3Npb24gb3JnIGlkIGlzIGlmIHtAbGluayB0YXJnZXRPcmdJZH0gaXMgYVxuICAgKiAgIGNoaWxkIG9yZ2FuaXphdGlvbiBvZiB0aGUgc2Vzc2lvbiBvcmdhbml6YXRpb24uXG4gICAqIEByZXR1cm5zIEEgY2xpZW50XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlKFxuICAgIHNlc3Npb246IHN0cmluZyB8IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEsXG4gICAgdGFyZ2V0T3JnSWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lckNsaWVudD4ge1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lckNsaWVudChhd2FpdCBBcGlDbGllbnQuY3JlYXRlKHNlc3Npb24sIHRhcmdldE9yZ0lkKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBvcmcgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG9yZ1xuICAgKi9cbiAgb3JnKCk6IE9yZyB7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcy4jYXBpQ2xpZW50LCB0aGlzLm9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIElEIG9yIG5hbWUgb2YgdGhlIG9yZ1xuICAgKiBAcmV0dXJucyBDdWJlU2lnbmVyIGNsaWVudCBmb3IgdGhlIHJlcXVlc3RlZCBvcmcuXG4gICAqL1xuICBnZXRPcmcob3JnSWQ6IHN0cmluZyk6IE9yZyB7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcy4jYXBpQ2xpZW50LCBvcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyR2V0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgY3VycmVudCB1c2VyJ3MgaW5mb3JtYXRpb25cbiAgICovXG4gIGdldCB1c2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckdldC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBrZXlzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgc2Vzc2lvblxuICAgKlxuICAgKiBOT1RFOiB0aGlzIG1heSBiZSBhIHN1YnNldCBmcm9tIHRoZSBrZXlzIGluIHRoZSBjdXJyZW50IG9yZy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGtleXMgdGhhdCBhIGNsaWVudCBjYW4gYWNjZXNzXG4gICAqL1xuICBhc3luYyBzZXNzaW9uS2V5cygpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudFxuICAgICAgLnNlc3Npb25LZXlzTGlzdCgpXG4gICAgICAudGhlbigoa2V5SW5mb3MpID0+IGtleUluZm9zLm1hcCgoa2V5SW5mbykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pKSk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGxvZyBpbnRvLlxuICAgKiBAcGFyYW0gdG9rZW4gVGhlIE9JREMgdG9rZW4gdG8gZXhjaGFuZ2VcbiAgICogQHBhcmFtIHNjb3BlcyBUaGUgc2NvcGVzIGZvciB0aGUgbmV3IHNlc3Npb25cbiAgICogQHBhcmFtIGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcGFyYW0gcHVycG9zZSBPcHRpb25hbCBzZXNzaW9uIGRlc2NyaXB0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBkYXRhLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZU9pZGNTZXNzaW9uKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PFNjb3BlPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgICBwdXJwb3NlPzogc3RyaW5nLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTZXNzaW9uRGF0YT4+IHtcbiAgICByZXR1cm4gYXdhaXQgQXBpQ2xpZW50Lm9pZGNTZXNzaW9uQ3JlYXRlKFxuICAgICAgZW52LFxuICAgICAgb3JnSWQsXG4gICAgICB0b2tlbixcbiAgICAgIHNjb3BlcyxcbiAgICAgIGxpZmV0aW1lcyxcbiAgICAgIG1mYVJlY2VpcHQsXG4gICAgICBwdXJwb3NlLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgaWQgaW4gd2hpY2ggdG8gZ2VuZXJhdGUgcHJvb2ZcbiAgICogQHBhcmFtIHRva2VuIFRoZSBvaWRjIHRva2VuXG4gICAqIEByZXR1cm5zIFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcHJvdmVPaWRjSWRlbnRpdHkoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICB0b2tlbjogc3RyaW5nLFxuICApOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICByZXR1cm4gYXdhaXQgQXBpQ2xpZW50LmlkZW50aXR5UHJvdmVPaWRjKGVudiwgb3JnSWQsIHRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZXMgbG9naW4gdmlhIEVtYWlsIE9UUC5cbiAgICogUmV0dXJucyBhbiB1bnNpZ25lZCBPSURDIHRva2VuIGFuZCBzZW5kcyBhbiBlbWFpbCB0byB0aGUgdXNlciBjb250YWluaW5nIHRoZSBzaWduYXR1cmUgb2YgdGhhdCB0b2tlbi5cbiAgICogVGhlIE9JREMgdG9rZW4gY2FuIGJlIHJlY29uc3RydWN0ZWQgYnkgYXBwZW5kaW5nIHRoZSBzaWduYXR1cmUgdG8gdGhlIHBhcnRpYWwgdG9rZW4gbGlrZSBzbzpcbiAgICpcbiAgICogdG9rZW4gPSBwYXJ0aWFsX3Rva2VuICsgc2lnbmF0dXJlXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIHVzZVxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyB0byBsb2dpbiB0b1xuICAgKiBAcGFyYW0gZW1haWwgVGhlIGVtYWlsIHRvIHNlbmQgdGhlIHNpZ25hdHVyZSB0b1xuICAgKiBAcmV0dXJucyBUaGUgcGFydGlhbCBPSURDIHRva2VuIHRoYXQgbXVzdCBiZSBjb21iaW5lZCB3aXRoIHRoZSBzaWduYXR1cmUgaW4gdGhlIGVtYWlsXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaW5pdEVtYWlsT3RwQXV0aChcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGVtYWlsOiBzdHJpbmcsXG4gICk6IFByb21pc2U8RW1haWxPdHBSZXNwb25zZT4ge1xuICAgIHJldHVybiBhd2FpdCBBcGlDbGllbnQuaW5pdEVtYWlsT3RwQXV0aChlbnYsIG9yZ0lkLCBlbWFpbCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIE1GQSBtYXkgYmUgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRmlkb1JlZ2lzdGVySW5pdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYW4gQWRkRmlkb0NoYWxsZW5nZVxuICAgKi9cbiAgZ2V0IGFkZEZpZG8oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRmlkb1JlZ2lzdGVySW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgRklETyBrZXkgZnJvbSB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIEFsbG93ZWQgb25seSBpZiBUT1RQIGlzIGFsc28gZGVmaW5lZC5cbiAgICogTUZBIHZpYSBUT1RQIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJGaWRvRGVsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGEgRklETyBrZXlcbiAgICovXG4gIGdldCBkZWxldGVGaWRvKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckZpZG9EZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHJlZmVyZW5jZSB0byBhbiBleGlzdGluZyBUT1RQIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHBhcmFtIHRvdHBJZCBUaGUgSUQgb2YgdGhlIGNoYWxsZW5nZVxuICAgKiBAcmV0dXJucyBUaGUgVE9UUCBjaGFsbGVuZ2VcbiAgICovXG4gIGdldFRvdHBDaGFsbGVuZ2UodG90cElkOiBzdHJpbmcpOiBUb3RwQ2hhbGxlbmdlIHtcbiAgICByZXR1cm4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcy4jYXBpQ2xpZW50LCB0b3RwSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gUmV0dXJucyBhIHtAbGluayBUb3RwQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlclRvdHBSZXNldEluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBUT1RQIGNoYWxsZW5nZVxuICAgKi9cbiAgZ2V0IHJlc2V0VG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJUb3RwUmVzZXRJbml0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdGhpcyB1c2VyJ3MgdmVyaWZpZWQgZW1haWwuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRW1haWxSZXNldEluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gZW1haWwgY2hhbGxlbmdlXG4gICAqL1xuICBnZXQgcmVzZXRFbWFpbCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFbWFpbFJlc2V0SW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJUb3RwVmVyaWZ5fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCB2ZXJpZmllcyB0aGUgVE9UUCBjb2RlLCB0aHJvd2luZyBpZiBub3QgdmFsaWRcbiAgICovXG4gIGdldCB2ZXJpZnlUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlclRvdHBWZXJpZnkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyVG90cERlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBUT1RQIGZyb20gdGhlIHVzZXJcbiAgICovXG4gIGdldCBkZWxldGVUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlclRvdHBEZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIGZvciBhbiBldmVudFxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuYWRkRXZlbnRMaXN0ZW5lcn0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIEFwaUNsaWVudCB3aXRoIHRoZSBuZXcgbGlzdGVuZXJcbiAgICovXG4gIGdldCBhZGRFdmVudExpc3RlbmVyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuYWRkRXZlbnRMaXN0ZW5lci5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGEgbGlzdGVuZXIgZm9yIGFuIGV2ZW50XG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5yZW1vdmVFdmVudExpc3RlbmVyfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgQXBpQ2xpZW50IHdpdGggYSByZW1vdmVkIGxpc3RlbmVyXG4gICAqL1xuICBnZXQgcmVtb3ZlRXZlbnRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSB0aGlzIHNlc3Npb24uXG4gICAqL1xuICBhc3luYyByZXZva2VTZXNzaW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uUmV2b2tlKCk7XG4gIH1cbn1cbiJdfQ==