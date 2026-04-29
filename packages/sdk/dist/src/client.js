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
     * Create a new OIDC-backed session.
     *
     * Same as {@link ApiClient.oidcSessionCreate}, see its documentation for more details.
     *
     * @param args Request arguments
     * @returns The new session data
     */
    static async createOidcSession(...args) {
        return await api_client_1.ApiClient.oidcSessionCreate(...args);
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
        return await api_client_1.ApiClient.identityProveOidc(...args);
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
        return await api_client_1.ApiClient.initEmailOtpAuth(...args);
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
exports.CubeSignerClient = CubeSignerClient;
_CubeSignerClient_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBZ0Q7QUFHaEQsdUJBQXVCO0FBQ3ZCLDZEQUE2RDtBQUM3RCwrQkFBd0Q7QUFDeEQsK0JBQTRCO0FBRTVCLHdCQUF3QjtBQVV4Qjs7O0dBR0c7QUFDSCxNQUFhLGdCQUFnQjtJQUczQjs7T0FFRztJQUNILElBQUksU0FBUztRQUNYLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLEdBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLEtBQUs7UUFDUCxPQUFPLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxLQUFLLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxZQUFZLFNBQW9CO1FBNUJ2Qiw4Q0FBc0I7UUE2QjdCLHVCQUFBLElBQUksK0JBQWMsU0FBUyxNQUFBLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUNqQixPQUE4QyxFQUM5QyxXQUFvQjtRQUVwQixPQUFPLElBQUksZ0JBQWdCLENBQUMsTUFBTSxzQkFBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEdBQUc7UUFDRCxPQUFPLElBQUksU0FBRyxDQUFDLHVCQUFBLElBQUksbUNBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQWE7UUFDbEIsT0FBTyxJQUFJLFNBQUcsQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLEVB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UUFDckIsT0FBTyx1QkFBQSxJQUFJLG1DQUFXLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLE1BQU0sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxhQUFhO1FBQ2pCLE1BQU0sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQWxRRCw0Q0FrUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcGlDbGllbnQgfSBmcm9tIFwiLi9jbGllbnQvYXBpX2NsaWVudFwiO1xuaW1wb3J0IHR5cGUgeyBFbWFpbE90cFJlc3BvbnNlLCBJZGVudGl0eVByb29mLCBSYXRjaGV0Q29uZmlnIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8vIHVzZWQgaW4gZG9jIGNvbW1lbnRzXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBBZGRGaWRvQ2hhbGxlbmdlLCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmdcIjtcbmltcG9ydCB0eXBlIHsgTWZhUmVjZWlwdHMsIFNlc3Npb25EYXRhLCBTZXNzaW9uSW5mbywgU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgS2V5IH0gZnJvbSBcIi5cIjtcblxuLyoqIE9wdGlvbnMgZm9yIGxvZ2dpbmcgaW4gd2l0aCBPSURDIHRva2VuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCB0b2tlbiBsaWZldGltZXMgKi9cbiAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZztcbiAgLyoqIE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpICovXG4gIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cztcbn1cblxuLyoqXG4gKiBDbGllbnQgdG8gdXNlIHRvIHNlbmQgcmVxdWVzdHMgdG8gQ3ViZVNpZ25lciBzZXJ2aWNlc1xuICogd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXJDbGllbnQge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIEFQSSBjbGllbnQuIFRoaXMgY2xpZW50IHByb3ZpZGVzIGRpcmVjdCBBUEkgYWNjZXNzIHdpdGhvdXQgY29udmVuaWVuY2Ugd3JhcHBlcnMuXG4gICAqL1xuICBnZXQgYXBpQ2xpZW50KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGVudmlyb25tZW50LlxuICAgKi9cbiAgZ2V0IGVudigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmVudjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIElEIG9mIHRoZSBjbGllbnQuXG4gICAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCkge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBjbGllbnQgd2l0aCBhIHNlc3Npb24gb3Igc2Vzc2lvbiBtYW5hZ2VyXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIChvYmplY3Qgb3IgYmFzZTY0IHN0cmluZykgb3IgbWFuYWdlciB0aGF0IHdpbGwgYmFjayB0aGlzIGNsaWVudFxuICAgKiBAcGFyYW0gdGFyZ2V0T3JnSWQgVGhlIElEIG9mIHRoZSBvcmdhbml6YXRpb24gdGhpcyBjbGllbnQgc2hvdWxkIG9wZXJhdGUgb24uIERlZmF1bHRzIHRvXG4gICAqICAgdGhlIG9yZyBpZCBmcm9tIHRoZSBzdXBwbGllZCBzZXNzaW9uLiBUaGUgb25seSBzY2VuYXJpbyBpbiB3aGljaCBpdCBtYWtlcyBzZW5zZSB0byB1c2VcbiAgICogICBhIHtAbGluayB0YXJnZXRPcmdJZH0gZGlmZmVyZW50IGZyb20gdGhlIHNlc3Npb24gb3JnIGlkIGlzIGlmIHtAbGluayB0YXJnZXRPcmdJZH0gaXMgYVxuICAgKiAgIGNoaWxkIG9yZ2FuaXphdGlvbiBvZiB0aGUgc2Vzc2lvbiBvcmdhbml6YXRpb24uXG4gICAqIEByZXR1cm5zIEEgY2xpZW50XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlKFxuICAgIHNlc3Npb246IHN0cmluZyB8IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEsXG4gICAgdGFyZ2V0T3JnSWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lckNsaWVudD4ge1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lckNsaWVudChhd2FpdCBBcGlDbGllbnQuY3JlYXRlKHNlc3Npb24sIHRhcmdldE9yZ0lkKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBvcmcgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG9yZ1xuICAgKi9cbiAgb3JnKCk6IE9yZyB7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcy4jYXBpQ2xpZW50LCB0aGlzLm9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIElEIG9yIG5hbWUgb2YgdGhlIG9yZ1xuICAgKiBAcmV0dXJucyBDdWJlU2lnbmVyIGNsaWVudCBmb3IgdGhlIHJlcXVlc3RlZCBvcmcuXG4gICAqL1xuICBnZXRPcmcob3JnSWQ6IHN0cmluZyk6IE9yZyB7XG4gICAgcmV0dXJuIG5ldyBPcmcodGhpcy4jYXBpQ2xpZW50LCBvcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyR2V0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgY3VycmVudCB1c2VyJ3MgaW5mb3JtYXRpb25cbiAgICovXG4gIGdldCB1c2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckdldC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBrZXlzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgc2Vzc2lvblxuICAgKlxuICAgKiBOT1RFOiB0aGlzIG1heSBiZSBhIHN1YnNldCBmcm9tIHRoZSBrZXlzIGluIHRoZSBjdXJyZW50IG9yZy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGtleXMgdGhhdCBhIGNsaWVudCBjYW4gYWNjZXNzXG4gICAqL1xuICBhc3luYyBzZXNzaW9uS2V5cygpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudFxuICAgICAgLnNlc3Npb25LZXlzTGlzdCgpXG4gICAgICAudGhlbigoa2V5SW5mb3MpID0+IGtleUluZm9zLm1hcCgoa2V5SW5mbykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IE9JREMtYmFja2VkIHNlc3Npb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vaWRjU2Vzc2lvbkNyZWF0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcGFyYW0gYXJncyBSZXF1ZXN0IGFyZ3VtZW50c1xuICAgKiBAcmV0dXJucyBUaGUgbmV3IHNlc3Npb24gZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZU9pZGNTZXNzaW9uKFxuICAgIC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIEFwaUNsaWVudC5vaWRjU2Vzc2lvbkNyZWF0ZT5cbiAgKTogUHJvbWlzZTxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIEFwaUNsaWVudC5vaWRjU2Vzc2lvbkNyZWF0ZT4+PiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5vaWRjU2Vzc2lvbkNyZWF0ZSguLi5hcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm92ZSBhbiBPSURDIGlkZW50aXR5LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaWRlbnRpdHlQcm92ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHBhcmFtIGFyZ3MgUmVxdWVzdCBhcmd1bWVudHNcbiAgICogQHJldHVybnMgUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBwcm92ZU9pZGNJZGVudGl0eShcbiAgICAuLi5hcmdzOiBQYXJhbWV0ZXJzPHR5cGVvZiBBcGlDbGllbnQuaWRlbnRpdHlQcm92ZU9pZGM+XG4gICk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIHJldHVybiBhd2FpdCBBcGlDbGllbnQuaWRlbnRpdHlQcm92ZU9pZGMoLi4uYXJncyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBlbWFpbCBPVFAgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pbml0RW1haWxPdHBBdXRofSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEBwYXJhbSBhcmdzIFJlcXVlc3QgYXJndW1lbnRzXG4gICAqIEByZXR1cm5zIOKAlCBUaGUgcGFydGlhbCBPSURDIHRva2VuIHRoYXQgbXVzdCBiZSBjb21iaW5lZCB3aXRoIHRoZSBzaWduYXR1cmUgaW4gdGhlIGVtYWlsXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaW5pdEVtYWlsT3RwQXV0aChcbiAgICAuLi5hcmdzOiBQYXJhbWV0ZXJzPHR5cGVvZiBBcGlDbGllbnQuaW5pdEVtYWlsT3RwQXV0aD5cbiAgKTogUHJvbWlzZTxFbWFpbE90cFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5pbml0RW1haWxPdHBBdXRoKC4uLmFyZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAgICpcbiAgICogUmV0dXJucyBhIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlfSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBNRkEgbWF5IGJlIHJlcXVpcmVkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckZpZG9SZWdpc3RlckluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGFuIEFkZEZpZG9DaGFsbGVuZ2VcbiAgICovXG4gIGdldCBhZGRGaWRvKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckZpZG9SZWdpc3RlckluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRmlkb0RlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhIEZJRE8ga2V5XG4gICAqL1xuICBnZXQgZGVsZXRlRmlkbygpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJGaWRvRGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSByZWZlcmVuY2UgdG8gYW4gZXhpc3RpbmcgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB0b3RwSWQgVGhlIElEIG9mIHRoZSBjaGFsbGVuZ2VcbiAgICogQHJldHVybnMgVGhlIFRPVFAgY2hhbGxlbmdlXG4gICAqL1xuICBnZXRUb3RwQ2hhbGxlbmdlKHRvdHBJZDogc3RyaW5nKTogVG90cENoYWxsZW5nZSB7XG4gICAgcmV0dXJuIG5ldyBUb3RwQ2hhbGxlbmdlKHRoaXMuI2FwaUNsaWVudCwgdG90cElkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdXNlcidzIFRPVFAuIFJldHVybnMgYSB7QGxpbmsgVG90cENoYWxsZW5nZX1cbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmcge0BsaW5rIFRvdHBDaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJUb3RwUmVzZXRJbml0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgVE9UUCBjaGFsbGVuZ2VcbiAgICovXG4gIGdldCByZXNldFRvdHAoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyVG90cFJlc2V0SW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gY2hhbmdlIHRoaXMgdXNlcidzIHZlcmlmaWVkIGVtYWlsLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckVtYWlsUmVzZXRJbml0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGVtYWlsIGNoYWxsZW5nZVxuICAgKi9cbiAgZ2V0IHJlc2V0RW1haWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRW1haWxSZXNldEluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyVG90cFZlcmlmeX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgdmVyaWZpZXMgdGhlIFRPVFAgY29kZSwgdGhyb3dpbmcgaWYgbm90IHZhbGlkXG4gICAqL1xuICBnZXQgdmVyaWZ5VG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJUb3RwVmVyaWZ5LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgVE9UUCBmcm9tIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogQWxsb3dlZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBGSURPIGtleSBpcyByZWdpc3RlcmVkIHdpdGggdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBNRkEgdmlhIEZJRE8gaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlclRvdHBEZWxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgVE9UUCBmcm9tIHRoZSB1c2VyXG4gICAqL1xuICBnZXQgZGVsZXRlVG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJUb3RwRGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciBmb3IgYW4gZXZlbnRcbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmFkZEV2ZW50TGlzdGVuZXJ9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSBBcGlDbGllbnQgd2l0aCB0aGUgbmV3IGxpc3RlbmVyXG4gICAqL1xuICBnZXQgYWRkRXZlbnRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmFkZEV2ZW50TGlzdGVuZXIuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIGxpc3RlbmVyIGZvciBhbiBldmVudFxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcn0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIEFwaUNsaWVudCB3aXRoIGEgcmVtb3ZlZCBsaXN0ZW5lclxuICAgKi9cbiAgZ2V0IHJlbW92ZUV2ZW50TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5yZW1vdmVFdmVudExpc3RlbmVyLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhpcyBzZXNzaW9uIG1ldGFkYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyBDdXJyZW50IHNlc3Npb24gbWV0YWRhdGEuXG4gICAqL1xuICBhc3luYyBnZXRTZXNzaW9uKCk6IFByb21pc2U8U2Vzc2lvbkluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25HZXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgdGhpcyBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgcmV2b2tlU2Vzc2lvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvblJldm9rZSgpO1xuICB9XG59XG4iXX0=