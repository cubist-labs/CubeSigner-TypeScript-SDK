"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubeSignerClient = void 0;
const signer_session_manager_1 = require("./session/signer_session_manager");
const api_1 = require("./api");
const key_1 = require("./key");
const role_1 = require("./role");
const session_storage_1 = require("./session/session_storage");
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
class CubeSignerClient extends api_1.CubeSignerApi {
    /**
     * Constructor.
     * @param {SignerSessionManager} sessionMgr The session manager to use
     * @param {string?} orgId Optional organization ID; if omitted, uses the org ID from the session manager.
     */
    constructor(sessionMgr, orgId) {
        super(sessionMgr, orgId);
    }
    /**
     * Returns a new instance of this class using the same session manager but targeting a different organization.
     *
     * @param {string} orgId The organization ID.
     * @return {CubeSignerClient} A new instance of this class using the same session manager but targeting different organization.
     */
    withOrg(orgId) {
        return orgId ? new CubeSignerClient(this.sessionMgr, orgId) : this;
    }
    /**
     * Loads an existing management session and creates a {@link CubeSignerClient} instance.
     *
     * @param {SignerSessionStorage} storage Storage from which to load the session
     * @return {Promise<CubeSignerClient>} New CubeSigner instance
     */
    static async loadManagementSession(storage) {
        // Throw and actionable error if the management session file contains a Cognito session
        const session = await storage.retrieve();
        if (session.id_token) {
            throw new Error(`It appears that the storage contains the old (Cognito) session; please update your session by updating your 'cs' to version 'v0.37.0' or later and then running 'cs login'`);
        }
        const mgr = await signer_session_manager_1.SignerSessionManager.loadFromStorage(storage);
        return new CubeSignerClient(mgr);
    }
    /**
     * Create a new signing key.
     * @param {KeyType} type The type of key to create.
     * @param {string?} ownerId The owner of the key. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    async createKey(type, ownerId) {
        return (await this.createKeys(type, 1, ownerId))[0];
    }
    /**
     * Create new signing keys.
     * @param {KeyType} type The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    async createKeys(type, count, ownerId) {
        const keys = await this.keysCreate(type, count, ownerId);
        return keys.map((k) => new key_1.Key(this, k));
    }
    /**
     * Derive a key of the given type using the given derivation path and mnemonic.
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {KeyType} type Type of key to derive from the mnemonic.
     * @param {string} derivationPath Mnemonic derivation path used to generate new key.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key} newly derived key or undefined if it already exists.
     */
    async deriveKey(type, derivationPath, mnemonicId) {
        return (await this.deriveKeys(type, [derivationPath], mnemonicId))[0];
    }
    /**
     * Derive a set of keys of the given type using the given derivation paths and mnemonic.
     *
     * The owner of the derived keys will be the owner of the mnemonic.
     *
     * @param {KeyType} type Type of key to derive from the mnemonic.
     * @param {string[]} derivationPaths Mnemonic derivation paths used to generate new key.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key[]} newly derived keys.
     */
    async deriveKeys(type, derivationPaths, mnemonicId) {
        const keys = await this.keysDerive(type, derivationPaths, mnemonicId);
        return keys.map((k) => new key_1.Key(this, k));
    }
    /**
     * Create a new {@link OidcClient} that will use a given OIDC token for auth.
     * @param {string} oidcToken The authentication token to use
     * @return {OidcClient} New OIDC client.
     */
    newOidcClient(oidcToken) {
        return new api_1.OidcClient(this.sessionMgr.env, this.orgId, oidcToken);
    }
    /**
     * Authenticate an OIDC user and create a new session manager for them.
     *
     * @param {string} oidcToken The OIDC token
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {OidcAuthOptions} options Options.
     * @return {Promise<SignerSessionManager>} The signer session manager
     */
    async oidcAuth(oidcToken, scopes, options) {
        const oidcClient = this.newOidcClient(oidcToken);
        const resp = await oidcClient.sessionCreate(scopes, options?.lifetimes, options?.mfaReceipt);
        return await signer_session_manager_1.SignerSessionManager.loadFromStorage(new session_storage_1.MemorySessionStorage(resp.data()));
    }
    /**
     * Create a new user in the organization and sends an invitation to that user.
     *
     * Same as {@link orgUserInvite}.
     */
    get createUser() {
        return this.orgUserInvite.bind(this);
    }
    /**
     * Create a new OIDC user.
     *
     * Same as {@link orgUserCreateOidc}.
     */
    get createOidcUser() {
        return this.orgUserCreateOidc.bind(this);
    }
    /**
     * Delete an existing OIDC user.
     *
     * Same as {@link orgUserDeleteOidc}.
     */
    get deleteOidcUser() {
        return this.orgUserDeleteOidc.bind(this);
    }
    /**
     * List users in the organization.
     *
     * Same as {@link orgUsersList}
     */
    get users() {
        return this.orgUsersList.bind(this);
    }
    /**
     * Obtain information about the current user.
     *
     * Same as {@link userGet}
     */
    get user() {
        return this.userGet.bind(this);
    }
    /**
     * Get information about a specific org.
     *
     * @param {string?} orgId The ID or name of the org
     * @return {Promise<OrgInfo>} CubeSigner client for the requested org.
     */
    async org(orgId) {
        return await this.withOrg(orgId).orgGet();
    }
    /**
     * Obtain information about the current user.
     *
     * Same as {@link userGet}
     */
    get aboutMe() {
        return this.userGet.bind(this);
    }
    /**
     * Get a key by id.
     *
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     */
    async getKey(keyId) {
        const keyInfo = await this.keyGet(keyId);
        return new key_1.Key(this, keyInfo);
    }
    /**
     * Get all keys in the org.
     *
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Promise<Key[]>} The keys.
     */
    async orgKeys(type, page) {
        const paginator = this.keysList(type, page);
        const keys = await paginator.fetch();
        return keys.map((k) => new key_1.Key(this, k));
    }
    /**
     * Create a new role.
     *
     * @param {string?} name The name of the role.
     * @return {Role} The new role.
     */
    async createRole(name) {
        const roleId = await this.roleCreate(name);
        const roleInfo = await this.roleGet(roleId);
        return new role_1.Role(this, roleInfo);
    }
    /**
     * Get a role by id or name.
     *
     * @param {string} roleId The id or name of the role to get.
     * @return {Role} The role.
     */
    async getRole(roleId) {
        const roleInfo = await this.roleGet(roleId);
        return new role_1.Role(this, roleInfo);
    }
    /**
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Role[]} The roles.
     */
    async listRoles(page) {
        const roles = await this.rolesList(page).fetch();
        return roles.map((r) => new role_1.Role(this, r));
    }
    /**
     * List all users in the org.
     *
     * Same as {@link orgUsersList}
     */
    get listUsers() {
        return this.orgUsersList.bind(this);
    }
    /**
     * Approve a pending MFA request.
     *
     * Same as {@link mfaApprove}
     */
    get approveMfaRequest() {
        return this.mfaApprove.bind(this);
    }
    /**
     * Approve a pending MFA request using TOTP.
     *
     * Same as {@link mfaApproveTotp}
     */
    get totpApprove() {
        return this.mfaApproveTotp.bind(this);
    }
    /**
     * Initiate approval of an existing MFA request using FIDO.
     *
     * Returns a {@link MfaFidoChallenge} that must be answered by calling
     * {@link MfaFidoChallenge.answer} or {@link fidoApproveComplete}.
     *
     * Same as {@link mfaApproveFidoInit}
     */
    get fidoApproveStart() {
        return this.mfaApproveFidoInit.bind(this);
    }
    /**
     * Answer the MFA approval with FIDO challenge issued by {@link fidoApproveStart}.
     *
     * Same as {@link mfaApproveFidoComplete}
     */
    get fidoApproveComplete() {
        return this.mfaApproveFidoComplete.bind(this);
    }
    /**
     * Get a pending MFA request by its id.
     *
     * Same as {@link mfaGet}
     */
    get getMfaInfo() {
        return this.mfaGet.bind(this);
    }
    /**
     * List pending MFA requests accessible to the current user.
     *
     * Same as {@link mfaList}
     */
    get listMfaInfos() {
        return this.mfaList.bind(this);
    }
    /**
     * Obtain a proof of authentication.
     *
     * Same as {@link identityProve}
     */
    get proveIdentity() {
        return this.identityProve.bind(this);
    }
    /**
     * Check if a given proof of OIDC authentication is valid.
     *
     * Same as {@link identityVerify}
     */
    get verifyIdentity() {
        return this.identityVerify.bind(this);
    }
    /**
     * Creates a request to add a new FIDO device.
     *
     * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
     *
     * MFA may be required.
     *
     * Same as {@link userFidoRegisterInit}
     */
    get addFidoStart() {
        return this.userFidoRegisterInit.bind(this);
    }
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * Same as {@link userFidoDelete}
     */
    get deleteFido() {
        return this.userFidoDelete.bind(this);
    }
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered by calling {@link TotpChallenge.answer} or
     * {@link resetTotpComplete}.
     *
     * Same as {@link userTotpResetInit}
     */
    get resetTotpStart() {
        return this.userTotpResetInit.bind(this);
    }
    /**
     * Answer the TOTP challenge issued by {@link resetTotpStart}. If successful,
     * user's TOTP configuration will be updated to that of the TOTP challenge.
     *
     * Same as {@link userTotpResetComplete}
     */
    get resetTotpComplete() {
        return this.userTotpResetComplete.bind(this);
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * Same as {@link userTotpVerify}
     */
    get verifyTotp() {
        return this.userTotpVerify.bind(this);
    }
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * Same as {@link userTotpDelete}.
     */
    get deleteTotp() {
        return this.userTotpDelete.bind(this);
    }
    /**
     * Sign a stake request.
     *
     * Same as {@link signStake}
     */
    get stake() {
        return this.signStake.bind(this);
    }
    /**
     * Sign an unstake request.
     *
     * Same as {@link signUnstake}
     */
    get unstake() {
        return this.signUnstake.bind(this);
    }
}
exports.CubeSignerClient = CubeSignerClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2RUFBOEY7QUFDOUYsK0JBQWtEO0FBQ2xELCtCQUFxQztBQUlyQyxpQ0FBOEI7QUFLOUIsK0RBQWlFO0FBWWpFOzs7R0FHRztBQUNILE1BQWEsZ0JBQWlCLFNBQVEsbUJBQWE7SUFDakQ7Ozs7T0FJRztJQUNILFlBQVksVUFBZ0MsRUFBRSxLQUFjO1FBQzFELEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsT0FBTyxDQUFDLEtBQWM7UUFDcEIsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3JFLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsT0FBNkI7UUFDOUQsdUZBQXVGO1FBQ3ZGLE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pDLElBQUssT0FBMkMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxRCxNQUFNLElBQUksS0FBSyxDQUNiLDRLQUE0SyxDQUM3SyxDQUFDO1FBQ0osQ0FBQztRQUVELE1BQU0sR0FBRyxHQUFHLE1BQU0sNkNBQW9CLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQWEsRUFBRSxPQUFnQjtRQUM3QyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUs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QUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FDRjtBQTNaRCw0Q0EyWkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTaWduZXJTZXNzaW9uTWFuYWdlciwgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJBcGksIE9pZGNDbGllbnQgfSBmcm9tIFwiLi9hcGlcIjtcbmltcG9ydCB7IEtleVR5cGUsIEtleSB9IGZyb20gXCIuL2tleVwiO1xuaW1wb3J0IHsgT3JnSW5mbywgUmF0Y2hldENvbmZpZyB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgTWZhUmVjZWlwdCB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHsgUGFnZU9wdHMgfSBmcm9tIFwiLi9wYWdpbmF0b3JcIjtcbmltcG9ydCB7IFJvbGUgfSBmcm9tIFwiLi9yb2xlXCI7XG5cbi8vIHVzZWQgaW4gZG9jIGNvbW1lbnRzXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuaW1wb3J0IHsgQWRkRmlkb0NoYWxsZW5nZSwgTWZhRmlkb0NoYWxsZW5nZSwgVG90cENoYWxsZW5nZSB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHsgTWVtb3J5U2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuXG4vKiogT3B0aW9ucyBmb3IgbG9nZ2luZyBpbiB3aXRoIE9JREMgdG9rZW4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY0F1dGhPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHRva2VuIGxpZmV0aW1lcyAqL1xuICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnO1xuICAvKiogT3B0aW9uYWwgTUZBIHJlY2VpcHQgKi9cbiAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQ7XG4gIC8qKiBPcHRpb25hbCBzdG9yYWdlIHRvIHVzZSBmb3IgdGhlIHJldHVybmVkIHNlc3Npb24gKGRlZmF1bHRzIHRvIHtAbGluayBNZW1vcnlTZXNzaW9uU3RvcmFnZX0pICovXG4gIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZTtcbn1cblxuLyoqXG4gKiBDbGllbnQgdG8gdXNlIHRvIHNlbmQgcmVxdWVzdHMgdG8gQ3ViZVNpZ25lciBzZXJ2aWNlc1xuICogd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXJDbGllbnQgZXh0ZW5kcyBDdWJlU2lnbmVyQXBpIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25NYW5hZ2VyfSBzZXNzaW9uTWdyIFRoZSBzZXNzaW9uIG1hbmFnZXIgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3JnSWQgT3B0aW9uYWwgb3JnYW5pemF0aW9uIElEOyBpZiBvbWl0dGVkLCB1c2VzIHRoZSBvcmcgSUQgZnJvbSB0aGUgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbk1ncjogU2lnbmVyU2Vzc2lvbk1hbmFnZXIsIG9yZ0lkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoc2Vzc2lvbk1nciwgb3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyB1c2luZyB0aGUgc2FtZSBzZXNzaW9uIG1hbmFnZXIgYnV0IHRhcmdldGluZyBhIGRpZmZlcmVudCBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnYW5pemF0aW9uIElELlxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyQ2xpZW50fSBBIG5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIHVzaW5nIHRoZSBzYW1lIHNlc3Npb24gbWFuYWdlciBidXQgdGFyZ2V0aW5nIGRpZmZlcmVudCBvcmdhbml6YXRpb24uXG4gICAqL1xuICB3aXRoT3JnKG9yZ0lkPzogc3RyaW5nKTogQ3ViZVNpZ25lckNsaWVudCB7XG4gICAgcmV0dXJuIG9yZ0lkID8gbmV3IEN1YmVTaWduZXJDbGllbnQodGhpcy5zZXNzaW9uTWdyLCBvcmdJZCkgOiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuIGV4aXN0aW5nIG1hbmFnZW1lbnQgc2Vzc2lvbiBhbmQgY3JlYXRlcyBhIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBTdG9yYWdlIGZyb20gd2hpY2ggdG8gbG9hZCB0aGUgc2Vzc2lvblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXJDbGllbnQ+fSBOZXcgQ3ViZVNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRNYW5hZ2VtZW50U2Vzc2lvbihzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8Q3ViZVNpZ25lckNsaWVudD4ge1xuICAgIC8vIFRocm93IGFuZCBhY3Rpb25hYmxlIGVycm9yIGlmIHRoZSBtYW5hZ2VtZW50IHNlc3Npb24gZmlsZSBjb250YWlucyBhIENvZ25pdG8gc2Vzc2lvblxuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBzdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgaWYgKChzZXNzaW9uIGFzIHVua25vd24gYXMgeyBpZF90b2tlbjogc3RyaW5nIH0pLmlkX3Rva2VuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBJdCBhcHBlYXJzIHRoYXQgdGhlIHN0b3JhZ2UgY29udGFpbnMgdGhlIG9sZCAoQ29nbml0bykgc2Vzc2lvbjsgcGxlYXNlIHVwZGF0ZSB5b3VyIHNlc3Npb24gYnkgdXBkYXRpbmcgeW91ciAnY3MnIHRvIHZlcnNpb24gJ3YwLjM3LjAnIG9yIGxhdGVyIGFuZCB0aGVuIHJ1bm5pbmcgJ2NzIGxvZ2luJ2AsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IG1nciA9IGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKTtcbiAgICByZXR1cm4gbmV3IEN1YmVTaWduZXJDbGllbnQobWdyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmluZyBrZXkuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXkuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleSh0eXBlOiBLZXlUeXBlLCBvd25lcklkPzogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY3JlYXRlS2V5cyh0eXBlLCAxLCBvd25lcklkKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5cyh0eXBlOiBLZXlUeXBlLCBjb3VudDogbnVtYmVyLCBvd25lcklkPzogc3RyaW5nKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLmtleXNDcmVhdGUodHlwZSwgY291bnQsIG93bmVySWQpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEga2V5IG9mIHRoZSBnaXZlbiB0eXBlIHVzaW5nIHRoZSBnaXZlbiBkZXJpdmF0aW9uIHBhdGggYW5kIG1uZW1vbmljLlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5IHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHtLZXlUeXBlfSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGRlcml2YXRpb25QYXRoIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aCB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtbmVtb25pY0lkIG1hdGVyaWFsSWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKlxuICAgKiBAcmV0dXJuIHtLZXl9IG5ld2x5IGRlcml2ZWQga2V5IG9yIHVuZGVmaW5lZCBpZiBpdCBhbHJlYWR5IGV4aXN0cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleShcbiAgICB0eXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoOiBzdHJpbmcsXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICApOiBQcm9taXNlPEtleSB8IHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5kZXJpdmVLZXlzKHR5cGUsIFtkZXJpdmF0aW9uUGF0aF0sIG1uZW1vbmljSWQpKVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBzZXQgb2Yga2V5cyBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRocyBhbmQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXlzIHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHtLZXlUeXBlfSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gZGVyaXZhdGlvblBhdGhzIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aHMgdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWNJZCBtYXRlcmlhbElkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogQHJldHVybiB7S2V5W119IG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleXModHlwZTogS2V5VHlwZSwgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSwgbW5lbW9uaWNJZDogc3RyaW5nKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLmtleXNEZXJpdmUodHlwZSwgZGVyaXZhdGlvblBhdGhzLCBtbmVtb25pY0lkKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcywgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB7QGxpbmsgT2lkY0NsaWVudH0gdGhhdCB3aWxsIHVzZSBhIGdpdmVuIE9JREMgdG9rZW4gZm9yIGF1dGguXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIGF1dGhlbnRpY2F0aW9uIHRva2VuIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtPaWRjQ2xpZW50fSBOZXcgT0lEQyBjbGllbnQuXG4gICAqL1xuICBuZXdPaWRjQ2xpZW50KG9pZGNUb2tlbjogc3RyaW5nKTogT2lkY0NsaWVudCB7XG4gICAgcmV0dXJuIG5ldyBPaWRjQ2xpZW50KHRoaXMuc2Vzc2lvbk1nci5lbnYsIHRoaXMub3JnSWQsIG9pZGNUb2tlbik7XG4gIH1cblxuICAvKipcbiAgICogQXV0aGVudGljYXRlIGFuIE9JREMgdXNlciBhbmQgY3JlYXRlIGEgbmV3IHNlc3Npb24gbWFuYWdlciBmb3IgdGhlbS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge0xpc3Q8c3RyaW5nPn0gc2NvcGVzIFRoZSBzY29wZXMgb2YgdGhlIHJlc3VsdGluZyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7T2lkY0F1dGhPcHRpb25zfSBvcHRpb25zIE9wdGlvbnMuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBUaGUgc2lnbmVyIHNlc3Npb24gbWFuYWdlclxuICAgKi9cbiAgYXN5bmMgb2lkY0F1dGgoXG4gICAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIG9wdGlvbnM/OiBPaWRjQXV0aE9wdGlvbnMsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBvaWRjQ2xpZW50ID0gdGhpcy5uZXdPaWRjQ2xpZW50KG9pZGNUb2tlbik7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IG9pZGNDbGllbnQuc2Vzc2lvbkNyZWF0ZShzY29wZXMsIG9wdGlvbnM/LmxpZmV0aW1lcywgb3B0aW9ucz8ubWZhUmVjZWlwdCk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShuZXcgTWVtb3J5U2Vzc2lvblN0b3JhZ2UocmVzcC5kYXRhKCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdXNlciBpbiB0aGUgb3JnYW5pemF0aW9uIGFuZCBzZW5kcyBhbiBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgb3JnVXNlckludml0ZX0uXG4gICAqL1xuICBnZXQgY3JlYXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy5vcmdVc2VySW52aXRlLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IE9JREMgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgb3JnVXNlckNyZWF0ZU9pZGN9LlxuICAgKi9cbiAgZ2V0IGNyZWF0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLm9yZ1VzZXJDcmVhdGVPaWRjLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgb3JnVXNlckRlbGV0ZU9pZGN9LlxuICAgKi9cbiAgZ2V0IGRlbGV0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLm9yZ1VzZXJEZWxldGVPaWRjLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBvcmdVc2Vyc0xpc3R9XG4gICAqL1xuICBnZXQgdXNlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMub3JnVXNlcnNMaXN0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHVzZXJHZXR9XG4gICAqL1xuICBnZXQgdXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyR2V0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGluZm9ybWF0aW9uIGFib3V0IGEgc3BlY2lmaWMgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG9yZ0lkIFRoZSBJRCBvciBuYW1lIG9mIHRoZSBvcmdcbiAgICogQHJldHVybiB7UHJvbWlzZTxPcmdJbmZvPn0gQ3ViZVNpZ25lciBjbGllbnQgZm9yIHRoZSByZXF1ZXN0ZWQgb3JnLlxuICAgKi9cbiAgYXN5bmMgb3JnKG9yZ0lkPzogc3RyaW5nKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMud2l0aE9yZyhvcmdJZCkub3JnR2V0KCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHVzZXJHZXR9XG4gICAqL1xuICBnZXQgYWJvdXRNZSgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyR2V0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJuIHtLZXl9IFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMua2V5R2V0KGtleUlkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGtleXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHtLZXlUeXBlP30gdHlwZSBPcHRpb25hbCBrZXkgdHlwZSB0byBmaWx0ZXIgbGlzdCBmb3IuXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8S2V5W10+fSBUaGUga2V5cy5cbiAgICovXG4gIGFzeW5jIG9yZ0tleXModHlwZT86IEtleVR5cGUsIHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLmtleXNMaXN0KHR5cGUsIHBhZ2UpO1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBwYWdpbmF0b3IuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcywgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm4ge1JvbGV9IFRoZSBuZXcgcm9sZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVJvbGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJZCA9IGF3YWl0IHRoaXMucm9sZUNyZWF0ZShuYW1lKTtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMucm9sZUdldChyb2xlSWQpO1xuICAgIHJldHVybiBuZXcgUm9sZSh0aGlzLCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpZCBvciBuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybiB7Um9sZX0gVGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBnZXRSb2xlKHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3Qgcm9sZUluZm8gPSBhd2FpdCB0aGlzLnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcywgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHJvbGVzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1JvbGVbXX0gVGhlIHJvbGVzLlxuICAgKi9cbiAgYXN5bmMgbGlzdFJvbGVzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8Um9sZVtdPiB7XG4gICAgY29uc3Qgcm9sZXMgPSBhd2FpdCB0aGlzLnJvbGVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiByb2xlcy5tYXAoKHIpID0+IG5ldyBSb2xlKHRoaXMsIHIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBvcmdVc2Vyc0xpc3R9XG4gICAqL1xuICBnZXQgbGlzdFVzZXJzKCkge1xuICAgIHJldHVybiB0aGlzLm9yZ1VzZXJzTGlzdC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBtZmFBcHByb3ZlfVxuICAgKi9cbiAgZ2V0IGFwcHJvdmVNZmFSZXF1ZXN0KCkge1xuICAgIHJldHVybiB0aGlzLm1mYUFwcHJvdmUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBtZmFBcHByb3ZlVG90cH1cbiAgICovXG4gIGdldCB0b3RwQXBwcm92ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5tZmFBcHByb3ZlVG90cC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZX0gdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmdcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvciB7QGxpbmsgZmlkb0FwcHJvdmVDb21wbGV0ZX0uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG1mYUFwcHJvdmVGaWRvSW5pdH1cbiAgICovXG4gIGdldCBmaWRvQXBwcm92ZVN0YXJ0KCkge1xuICAgIHJldHVybiB0aGlzLm1mYUFwcHJvdmVGaWRvSW5pdC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgTUZBIGFwcHJvdmFsIHdpdGggRklETyBjaGFsbGVuZ2UgaXNzdWVkIGJ5IHtAbGluayBmaWRvQXBwcm92ZVN0YXJ0fS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgbWZhQXBwcm92ZUZpZG9Db21wbGV0ZX1cbiAgICovXG4gIGdldCBmaWRvQXBwcm92ZUNvbXBsZXRlKCkge1xuICAgIHJldHVybiB0aGlzLm1mYUFwcHJvdmVGaWRvQ29tcGxldGUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgbWZhR2V0fVxuICAgKi9cbiAgZ2V0IGdldE1mYUluZm8oKSB7XG4gICAgcmV0dXJuIHRoaXMubWZhR2V0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG1mYUxpc3R9XG4gICAqL1xuICBnZXQgbGlzdE1mYUluZm9zKCkge1xuICAgIHJldHVybiB0aGlzLm1mYUxpc3QuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgaWRlbnRpdHlQcm92ZX1cbiAgICovXG4gIGdldCBwcm92ZUlkZW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLmlkZW50aXR5UHJvdmUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIGdpdmVuIHByb29mIG9mIE9JREMgYXV0aGVudGljYXRpb24gaXMgdmFsaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIGlkZW50aXR5VmVyaWZ5fVxuICAgKi9cbiAgZ2V0IHZlcmlmeUlkZW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLmlkZW50aXR5VmVyaWZ5LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIE1GQSBtYXkgYmUgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHVzZXJGaWRvUmVnaXN0ZXJJbml0fVxuICAgKi9cbiAgZ2V0IGFkZEZpZG9TdGFydCgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyRmlkb1JlZ2lzdGVySW5pdC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHVzZXJGaWRvRGVsZXRlfVxuICAgKi9cbiAgZ2V0IGRlbGV0ZUZpZG8oKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlckZpZG9EZWxldGUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdXNlcidzIFRPVFAuIFJldHVybnMgYSB7QGxpbmsgVG90cENoYWxsZW5nZX1cbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmcge0BsaW5rIFRvdHBDaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgcmVzZXRUb3RwQ29tcGxldGV9LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayB1c2VyVG90cFJlc2V0SW5pdH1cbiAgICovXG4gIGdldCByZXNldFRvdHBTdGFydCgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyVG90cFJlc2V0SW5pdC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgVE9UUCBjaGFsbGVuZ2UgaXNzdWVkIGJ5IHtAbGluayByZXNldFRvdHBTdGFydH0uIElmIHN1Y2Nlc3NmdWwsXG4gICAqIHVzZXIncyBUT1RQIGNvbmZpZ3VyYXRpb24gd2lsbCBiZSB1cGRhdGVkIHRvIHRoYXQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayB1c2VyVG90cFJlc2V0Q29tcGxldGV9XG4gICAqL1xuICBnZXQgcmVzZXRUb3RwQ29tcGxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlclRvdHBSZXNldENvbXBsZXRlLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgdXNlclRvdHBWZXJpZnl9XG4gICAqL1xuICBnZXQgdmVyaWZ5VG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyVG90cFZlcmlmeS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHVzZXJUb3RwRGVsZXRlfS5cbiAgICovXG4gIGdldCBkZWxldGVUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJUb3RwRGVsZXRlLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHN0YWtlIHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHNpZ25TdGFrZX1cbiAgICovXG4gIGdldCBzdGFrZSgpIHtcbiAgICByZXR1cm4gdGhpcy5zaWduU3Rha2UuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIHVuc3Rha2UgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgc2lnblVuc3Rha2V9XG4gICAqL1xuICBnZXQgdW5zdGFrZSgpIHtcbiAgICByZXR1cm4gdGhpcy5zaWduVW5zdGFrZS5iaW5kKHRoaXMpO1xuICB9XG59XG4iXX0=