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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBZ0Q7QUFHaEQsdUJBQXVCO0FBQ3ZCLDZFQUE2RTtBQUM3RSwrQkFBd0Q7QUFDeEQsK0JBQTRCO0FBUzVCLHdCQUF3QjtBQVV4Qjs7O0dBR0c7QUFDSCxNQUFhLGdCQUFnQjtJQUczQjs7T0FFRztJQUNILElBQUksU0FBUztRQUNYLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksR0FBRztRQUNMLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLEdBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLEtBQUs7UUFDUCxPQUFPLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQzVDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUFvQjtRQTVCdkIsOENBQXNCO1FBNkI3Qix1QkFBQSxJQUFJLCtCQUFjLFNBQVMsTUFBQSxDQUFDO0lBQzlCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQThDO1FBQ2hFLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLHNCQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxHQUFHO1FBQ0QsT0FBTyxJQUFJLFNBQUcsQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFhO1FBQ2xCLE9BQU8sSUFBSSxTQUFHLENBQUMsdUJBQUEsSUFBSSxtQ0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFD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TSx1QkFBQSxJQUFJLG1DQUFXLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDL0MsQ0FBQztDQUNGO0FBN05ELDRDQTZOQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwaUNsaWVudCB9IGZyb20gXCIuL2NsaWVudC9hcGlfY2xpZW50XCI7XG5pbXBvcnQgdHlwZSB7IElkZW50aXR5UHJvb2YsIFJhdGNoZXRDb25maWcgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcblxuLy8gdXNlZCBpbiBkb2MgY29tbWVudHNcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBBZGRGaWRvQ2hhbGxlbmdlLCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgeyBPcmcgfSBmcm9tIFwiLi9vcmdcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFbnZJbnRlcmZhY2UsXG4gIE1mYVJlY2VpcHRzLFxuICBTY29wZSxcbiAgU2Vzc2lvbkRhdGEsXG4gIFNlc3Npb25NYW5hZ2VyLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgS2V5IH0gZnJvbSBcIi5cIjtcblxuLyoqIE9wdGlvbnMgZm9yIGxvZ2dpbmcgaW4gd2l0aCBPSURDIHRva2VuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCB0b2tlbiBsaWZldGltZXMgKi9cbiAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZztcbiAgLyoqIE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpICovXG4gIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cztcbn1cblxuLyoqXG4gKiBDbGllbnQgdG8gdXNlIHRvIHNlbmQgcmVxdWVzdHMgdG8gQ3ViZVNpZ25lciBzZXJ2aWNlc1xuICogd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXJDbGllbnQge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdW5kZXJseWluZyBBUEkgY2xpZW50LiBUaGlzIGNsaWVudCBwcm92aWRlcyBkaXJlY3QgQVBJIGFjY2VzcyB3aXRob3V0IGNvbnZlbmllbmNlIHdyYXBwZXJzLlxuICAgKi9cbiAgZ2V0IGFwaUNsaWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZW52aXJvbm1lbnQuXG4gICAqL1xuICBnZXQgZW52KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuZW52O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgb3JnIElEIG9mIHRoZSBjbGllbnQuXG4gICAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50fSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQpIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgY2xpZW50IHdpdGggYSBzZXNzaW9uIG9yIHNlc3Npb24gbWFuYWdlclxuICAgKiBAcGFyYW0ge1Nlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEgfCBzdHJpbmd9IHNlc3Npb24gVGhlIHNlc3Npb24gKG9iamVjdCBvciBiYXNlNjQgc3RyaW5nKVxuICAgKiAgIG9yIG1hbmFnZXIgdGhhdCB3aWxsIGJhY2sgdGhpcyBjbGllbnRcbiAgICogQHJldHVybiB7Q3ViZVNpZ25lckNsaWVudH0gQSBDbGllbnRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGUoc2Vzc2lvbjogc3RyaW5nIHwgU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSk6IFByb21pc2U8Q3ViZVNpZ25lckNsaWVudD4ge1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lckNsaWVudChhd2FpdCBBcGlDbGllbnQuY3JlYXRlKHNlc3Npb24pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG9yZyBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtPcmd9IFRoZSBvcmdcbiAgICovXG4gIG9yZygpOiBPcmcge1xuICAgIHJldHVybiBuZXcgT3JnKHRoaXMuI2FwaUNsaWVudCwgdGhpcy5vcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGluZm9ybWF0aW9uIGFib3V0IGFuIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBJRCBvciBuYW1lIG9mIHRoZSBvcmdcbiAgICogQHJldHVybiB7UHJvbWlzZTxPcmdJbmZvPn0gQ3ViZVNpZ25lciBjbGllbnQgZm9yIHRoZSByZXF1ZXN0ZWQgb3JnLlxuICAgKi9cbiAgZ2V0T3JnKG9yZ0lkOiBzdHJpbmcpOiBPcmcge1xuICAgIHJldHVybiBuZXcgT3JnKHRoaXMuI2FwaUNsaWVudCwgb3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckdldH1cbiAgICovXG4gIGdldCB1c2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckdldC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBrZXlzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgc2Vzc2lvblxuICAgKlxuICAgKiBOT1RFOiB0aGlzIG1heSBiZSBhIHN1YnNldCBmcm9tIHRoZSBrZXlzIGluIHRoZSBjdXJyZW50IG9yZy5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxLZXlbXT59IFRoZSBrZXlzIHRoYXQgYSBjbGllbnQgY2FuIGFjY2Vzc1xuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbktleXMoKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnRcbiAgICAgIC5zZXNzaW9uS2V5c0xpc3QoKVxuICAgICAgLnRoZW4oKGtleUluZm9zKSA9PiBrZXlJbmZvcy5tYXAoKGtleUluZm8pID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZyB0byBsb2cgaW50by5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIFRoZSBPSURDIHRva2VuIHRvIGV4Y2hhbmdlXG4gICAqIEBwYXJhbSB7TGlzdDxTY29wZT59IHNjb3BlcyBUaGUgc2NvcGVzIGZvciB0aGUgbmV3IHNlc3Npb25cbiAgICogQHBhcmFtIHtSYXRjaGV0Q29uZmlnfSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVycG9zZSBPcHRpb25hbCBzZXNzaW9uIGRlc2NyaXB0aW9uLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNlc3Npb25EYXRhPn0gVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVPaWRjU2Vzc2lvbihcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxTY29wZT4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICAgcHVycG9zZT86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2Vzc2lvbkRhdGE+PiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5vaWRjU2Vzc2lvbkNyZWF0ZShcbiAgICAgIGVudixcbiAgICAgIG9yZ0lkLFxuICAgICAgdG9rZW4sXG4gICAgICBzY29wZXMsXG4gICAgICBsaWZldGltZXMsXG4gICAgICBtZmFSZWNlaXB0LFxuICAgICAgcHVycG9zZSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIGlkIGluIHdoaWNoIHRvIGdlbmVyYXRlIHByb29mXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiBUaGUgb2lkYyB0b2tlblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHByb3ZlT2lkY0lkZW50aXR5KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5pZGVudGl0eVByb3ZlT2lkYyhlbnYsIG9yZ0lkLCB0b2tlbik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIE1GQSBtYXkgYmUgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRmlkb1JlZ2lzdGVySW5pdH1cbiAgICovXG4gIGdldCBhZGRGaWRvKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckZpZG9SZWdpc3RlckluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRmlkb0RlbGV0ZX1cbiAgICovXG4gIGdldCBkZWxldGVGaWRvKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckZpZG9EZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHJlZmVyZW5jZSB0byBhbiBleGlzdGluZyBUT1RQIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRvdHBJZCBUaGUgSUQgb2YgdGhlIGNoYWxsZW5nZVxuICAgKiBAcmV0dXJuIHtUb3RwQ2hhbGxlbmdlfSBUaGUgVE9UUCBjaGFsbGVuZ2VcbiAgICovXG4gIGdldFRvdHBDaGFsbGVuZ2UodG90cElkOiBzdHJpbmcpOiBUb3RwQ2hhbGxlbmdlIHtcbiAgICByZXR1cm4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcy4jYXBpQ2xpZW50LCB0b3RwSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gUmV0dXJucyBhIHtAbGluayBUb3RwQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlclRvdHBSZXNldEluaXR9XG4gICAqL1xuICBnZXQgcmVzZXRUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlclRvdHBSZXNldEluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyVG90cFZlcmlmeX1cbiAgICovXG4gIGdldCB2ZXJpZnlUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlclRvdHBWZXJpZnkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyVG90cERlbGV0ZX0uXG4gICAqL1xuICBnZXQgZGVsZXRlVG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJUb3RwRGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciBmb3IgYW4gZXZlbnRcbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmFkZEV2ZW50TGlzdGVuZXJ9LlxuICAgKi9cbiAgZ2V0IGFkZEV2ZW50TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5hZGRFdmVudExpc3RlbmVyLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsaXN0ZW5lciBmb3IgYW4gZXZlbnRcbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnJlbW92ZUV2ZW50TGlzdGVuZXJ9LlxuICAgKi9cbiAgZ2V0IHJlbW92ZUV2ZW50TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5yZW1vdmVFdmVudExpc3RlbmVyLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgdGhpcyBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgcmV2b2tlU2Vzc2lvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25SZXZva2UoKTtcbiAgfVxufVxuIl19