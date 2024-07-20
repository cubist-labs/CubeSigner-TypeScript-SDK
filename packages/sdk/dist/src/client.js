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
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const mfa_1 = require("./mfa");
const org_1 = require("./org");
const _1 = require(".");
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
class CubeSignerClient {
    /**
     * Get the underlying API client. This client provides direct API access without convenience wrappers.
     */
    get apiClient() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f");
    }
    /**
     * Get the environment.
     */
    get env() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").env;
    }
    /**
     * Get the org ID of the client.
     */
    get orgId() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").sessionMeta.org_id;
    }
    /**
     * Constructor.
     *
     * @param {ApiClient} apiClient The API client to use.
     */
    constructor(apiClient) {
        _CubeSignerClient_apiClient.set(this, void 0);
        __classPrivateFieldSet(this, _CubeSignerClient_apiClient, apiClient, "f");
    }
    /**
     * Construct a client with a session or session manager
     * @param {SessionManager | SessionData | string} session The session (object or base64 string)
     *   or manager that will back this client
     * @return {CubeSignerClient} A Client
     */
    static async create(session) {
        return new CubeSignerClient(await api_client_1.ApiClient.create(session));
    }
    /**
     * Get the org associated with this session.
     *
     * @return {Org} The org
     */
    org() {
        return new org_1.Org(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), this.orgId);
    }
    /**
     * Get information about an org.
     *
     * @param {string} orgId The ID or name of the org
     * @return {Promise<OrgInfo>} CubeSigner client for the requested org.
     */
    getOrg(orgId) {
        return new org_1.Org(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), orgId);
    }
    /**
     * Obtain information about the current user.
     *
     * Same as {@link ApiClient.userGet}
     */
    get user() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userGet.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Get all keys accessible to the current session
     *
     * NOTE: this may be a subset from the keys in the current org.
     *
     * @return {Promise<Key[]>} The keys that a client can access
     */
    async sessionKeys() {
        return await __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f")
            .sessionKeysList()
            .then((keyInfos) => keyInfos.map((keyInfo) => new _1.Key(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), keyInfo)));
    }
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org to log into.
     * @param {string} token The OIDC token to exchange
     * @param {List<Scope>} scopes The scopes for the new session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @param {string} purpose Optional session description.
     * @return {Promise<SessionData>} The session data.
     */
    static async createOidcSession(env, orgId, token, scopes, lifetimes, mfaReceipt, purpose) {
        return await api_client_1.ApiClient.oidcSessionCreate(env, orgId, token, scopes, lifetimes, mfaReceipt, purpose);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org id in which to generate proof
     * @param {string} token The oidc token
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    static async proveOidcIdentity(env, orgId, token) {
        return await api_client_1.ApiClient.identityProveOidc(env, orgId, token);
    }
    /**
     * Creates a request to add a new FIDO device.
     *
     * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
     *
     * MFA may be required.
     *
     * Same as {@link ApiClient.userFidoRegisterInit}
     */
    get addFido() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userFidoRegisterInit.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * Same as {@link ApiClient.userFidoDelete}
     */
    get deleteFido() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userFidoDelete.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Create a reference to an existing TOTP challenge.
     *
     * @param {string} totpId The ID of the challenge
     * @return {TotpChallenge} The TOTP challenge
     */
    getTotpChallenge(totpId) {
        return new mfa_1.TotpChallenge(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"), totpId);
    }
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered by calling {@link TotpChallenge.answer}.
     *
     * Same as {@link ApiClient.userTotpResetInit}
     */
    get resetTotp() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userTotpResetInit.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * Same as {@link ApiClient.userTotpVerify}
     */
    get verifyTotp() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userTotpVerify.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * Same as {@link ApiClient.userTotpDelete}.
     */
    get deleteTotp() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").userTotpDelete.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Add a listener for an event
     *
     * Same as {@link ApiClient.addEventListener}.
     */
    get addEventListener() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").addEventListener.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Remove a listener for an event
     *
     * Same as {@link ApiClient.removeEventListener}.
     */
    get removeEventListener() {
        return __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").removeEventListener.bind(__classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f"));
    }
    /**
     * Revoke this session.
     */
    async revokeSession() {
        return await __classPrivateFieldGet(this, _CubeSignerClient_apiClient, "f").sessionRevoke();
    }
}
exports.CubeSignerClient = CubeSignerClient;
_CubeSignerClient_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBZ0Q7QUFJaEQsdUJBQXVCO0FBQ3ZCLDZFQUE2RTtBQUM3RSwrQkFBd0Q7QUFDeEQsK0JBQTRCO0FBRTVCLHdCQUF3QjtBQVV4Qjs7O0dBR0c7QUFDSCxNQUFhLGdCQUFnQjtJQUczQjs7T0FFRztJQUNILElBQUksU0FBUztRQUNYLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLEdBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLEtBQUs7UUFDUCxPQUFPLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQzVDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUFvQjtRQTVCaEMsOENBQStCO1FBNkI3Qix1QkFBQSxJQUFJLCtCQUFjLFNBQVMsTUFBQSxDQUFDO0lBQzlCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQThDO1FBQ2hFLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLHNCQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxHQUFHO1FBQ0QsT0FBTyxJQUFJLFNBQUcsQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFhO1FBQ2xCLE9BQU8sSUFBSSxTQUFHLENBQUMsdUJBQUEsSUFBSSxtQ0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFD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TSx1QkFBQSxJQUFJLG1DQUFXLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDL0MsQ0FBQztDQUNGO0FBN05ELDRDQTZOQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwaUNsaWVudCB9IGZyb20gXCIuL2NsaWVudC9hcGlfY2xpZW50XCI7XG5pbXBvcnQgdHlwZSB7IElkZW50aXR5UHJvb2YsIFJhdGNoZXRDb25maWcgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgTWZhUmVjZWlwdCB9IGZyb20gXCIuL21mYVwiO1xuXG4vLyB1c2VkIGluIGRvYyBjb21tZW50c1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzLCBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbmltcG9ydCB7IEFkZEZpZG9DaGFsbGVuZ2UsIFRvdHBDaGFsbGVuZ2UgfSBmcm9tIFwiLi9tZmFcIjtcbmltcG9ydCB7IE9yZyB9IGZyb20gXCIuL29yZ1wiO1xuaW1wb3J0IHR5cGUgeyBDdWJlU2lnbmVyUmVzcG9uc2UsIEVudkludGVyZmFjZSwgU2NvcGUsIFNlc3Npb25EYXRhLCBTZXNzaW9uTWFuYWdlciB9IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBLZXkgfSBmcm9tIFwiLlwiO1xuXG4vKiogT3B0aW9ucyBmb3IgbG9nZ2luZyBpbiB3aXRoIE9JREMgdG9rZW4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY0F1dGhPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHRva2VuIGxpZmV0aW1lcyAqL1xuICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnO1xuICAvKiogT3B0aW9uYWwgTUZBIHJlY2VpcHQgKi9cbiAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQ7XG59XG5cbi8qKlxuICogQ2xpZW50IHRvIHVzZSB0byBzZW5kIHJlcXVlc3RzIHRvIEN1YmVTaWduZXIgc2VydmljZXNcbiAqIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyQ2xpZW50IHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHVuZGVybHlpbmcgQVBJIGNsaWVudC4gVGhpcyBjbGllbnQgcHJvdmlkZXMgZGlyZWN0IEFQSSBhY2Nlc3Mgd2l0aG91dCBjb252ZW5pZW5jZSB3cmFwcGVycy5cbiAgICovXG4gIGdldCBhcGlDbGllbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGVudmlyb25tZW50LlxuICAgKi9cbiAgZ2V0IGVudigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmVudjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG9yZyBJRCBvZiB0aGUgY2xpZW50LlxuICAgKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50KSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIGNsaWVudCB3aXRoIGEgc2Vzc2lvbiBvciBzZXNzaW9uIG1hbmFnZXJcbiAgICogQHBhcmFtIHtTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhIHwgc3RyaW5nfSBzZXNzaW9uIFRoZSBzZXNzaW9uIChvYmplY3Qgb3IgYmFzZTY0IHN0cmluZylcbiAgICogICBvciBtYW5hZ2VyIHRoYXQgd2lsbCBiYWNrIHRoaXMgY2xpZW50XG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJDbGllbnR9IEEgQ2xpZW50XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlKHNlc3Npb246IHN0cmluZyB8IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEpOiBQcm9taXNlPEN1YmVTaWduZXJDbGllbnQ+IHtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXJDbGllbnQoYXdhaXQgQXBpQ2xpZW50LmNyZWF0ZShzZXNzaW9uKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBvcmcgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybiB7T3JnfSBUaGUgb3JnXG4gICAqL1xuICBvcmcoKTogT3JnIHtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLiNhcGlDbGllbnQsIHRoaXMub3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgSUQgb3IgbmFtZSBvZiB0aGUgb3JnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8T3JnSW5mbz59IEN1YmVTaWduZXIgY2xpZW50IGZvciB0aGUgcmVxdWVzdGVkIG9yZy5cbiAgICovXG4gIGdldE9yZyhvcmdJZDogc3RyaW5nKTogT3JnIHtcbiAgICByZXR1cm4gbmV3IE9yZyh0aGlzLiNhcGlDbGllbnQsIG9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJHZXR9XG4gICAqL1xuICBnZXQgdXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJHZXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwga2V5cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHNlc3Npb25cbiAgICpcbiAgICogTk9URTogdGhpcyBtYXkgYmUgYSBzdWJzZXQgZnJvbSB0aGUga2V5cyBpbiB0aGUgY3VycmVudCBvcmcuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8S2V5W10+fSBUaGUga2V5cyB0aGF0IGEgY2xpZW50IGNhbiBhY2Nlc3NcbiAgICovXG4gIGFzeW5jIHNlc3Npb25LZXlzKCk6IFByb21pc2U8S2V5W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50XG4gICAgICAuc2Vzc2lvbktleXNMaXN0KClcbiAgICAgIC50aGVuKChrZXlJbmZvcykgPT4ga2V5SW5mb3MubWFwKChrZXlJbmZvKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbykpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAgICpcbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmcgdG8gbG9nIGludG8uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiBUaGUgT0lEQyB0b2tlbiB0byBleGNoYW5nZVxuICAgKiBAcGFyYW0ge0xpc3Q8U2NvcGU+fSBzY29wZXMgVGhlIHNjb3BlcyBmb3IgdGhlIG5ldyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCAoaWQgKyBjb25maXJtYXRpb24gY29kZSlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1cnBvc2UgT3B0aW9uYWwgc2Vzc2lvbiBkZXNjcmlwdGlvbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTZXNzaW9uRGF0YT59IFRoZSBzZXNzaW9uIGRhdGEuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlT2lkY1Nlc3Npb24oXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICB0b2tlbjogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8U2NvcGU+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICAgcHVycG9zZT86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2Vzc2lvbkRhdGE+PiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5vaWRjU2Vzc2lvbkNyZWF0ZShcbiAgICAgIGVudixcbiAgICAgIG9yZ0lkLFxuICAgICAgdG9rZW4sXG4gICAgICBzY29wZXMsXG4gICAgICBsaWZldGltZXMsXG4gICAgICBtZmFSZWNlaXB0LFxuICAgICAgcHVycG9zZSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIGlkIGluIHdoaWNoIHRvIGdlbmVyYXRlIHByb29mXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiBUaGUgb2lkYyB0b2tlblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHByb3ZlT2lkY0lkZW50aXR5KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5pZGVudGl0eVByb3ZlT2lkYyhlbnYsIG9yZ0lkLCB0b2tlbik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIE1GQSBtYXkgYmUgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRmlkb1JlZ2lzdGVySW5pdH1cbiAgICovXG4gIGdldCBhZGRGaWRvKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckZpZG9SZWdpc3RlckluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRmlkb0RlbGV0ZX1cbiAgICovXG4gIGdldCBkZWxldGVGaWRvKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckZpZG9EZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHJlZmVyZW5jZSB0byBhbiBleGlzdGluZyBUT1RQIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvdHBJZCBUaGUgSUQgb2YgdGhlIGNoYWxsZW5nZVxuICAgKiBAcmV0dXJuIHtUb3RwQ2hhbGxlbmdlfSBUaGUgVE9UUCBjaGFsbGVuZ2VcbiAgICovXG4gIGdldFRvdHBDaGFsbGVuZ2UodG90cElkOiBzdHJpbmcpOiBUb3RwQ2hhbGxlbmdlIHtcbiAgICByZXR1cm4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcy4jYXBpQ2xpZW50LCB0b3RwSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gUmV0dXJucyBhIHtAbGluayBUb3RwQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlclRvdHBSZXNldEluaXR9XG4gICAqL1xuICBnZXQgcmVzZXRUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlclRvdHBSZXNldEluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyVG90cFZlcmlmeX1cbiAgICovXG4gIGdldCB2ZXJpZnlUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlclRvdHBWZXJpZnkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyVG90cERlbGV0ZX0uXG4gICAqL1xuICBnZXQgZGVsZXRlVG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJUb3RwRGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciBmb3IgYW4gZXZlbnRcbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmFkZEV2ZW50TGlzdGVuZXJ9LlxuICAgKi9cbiAgZ2V0IGFkZEV2ZW50TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5hZGRFdmVudExpc3RlbmVyLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsaXN0ZW5lciBmb3IgYW4gZXZlbnRcbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnJlbW92ZUV2ZW50TGlzdGVuZXJ9LlxuICAgKi9cbiAgZ2V0IHJlbW92ZUV2ZW50TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5yZW1vdmVFdmVudExpc3RlbmVyLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgdGhpcyBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgcmV2b2tlU2Vzc2lvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25SZXZva2UoKTtcbiAgfVxufVxuIl19