"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CubeSignerClient = void 0;
const signer_session_manager_1 = require("./session/signer_session_manager");
const api_1 = require("./api");
const key_1 = require("./key");
const role_1 = require("./role");
const session_storage_1 = require("./session/session_storage");
const util_1 = require("./util");
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
     * @param {SignerSessionStorage} storage Optional storage from which to load the session (defaults to the default management session json file location)
     * @return {Promise<CubeSignerClient>} New CubeSigner instance
     */
    static async loadManagementSession(storage) {
        const filePath = (0, util_1.pathJoin)((0, util_1.configDir)(), "management-session.json");
        storage ??= new session_storage_1.JsonFileSessionStorage(filePath);
        // Throw and actionable error if the management session file contains a Cognito session
        const session = await storage.retrieve();
        if (session.id_token) {
            throw new Error(`It appears that the '${filePath}' file contains the old (Cognito) session; please update your session by updating your 'cs' to version 'v0.37.0' or later and then running 'cs login'`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2RUFBOEY7QUFDOUYsK0JBQWtEO0FBQ2xELCtCQUFxQztBQUlyQyxpQ0FBOEI7QUFLOUIsK0RBQXlGO0FBQ3pGLGlDQUE2QztBQVk3Qzs7O0dBR0c7QUFDSCxNQUFhLGdCQUFpQixTQUFRLG1CQUFhO0lBQ2pEOzs7O09BSUc7SUFDSCxZQUFZLFVBQWdDLEVBQUUsS0FBYztRQUMxRCxLQUFLLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE9BQU8sQ0FBQyxLQUFjO1FBQ3BCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNyRSxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLE9BQThCO1FBQy9ELE1BQU0sUUFBUSxHQUFHLElBQUEsZUFBUSxFQUFDLElBQUEsZ0JBQVMsR0FBRSxFQUFFLHlCQUF5QixDQUFDLENBQUM7UUFDbEUsT0FBTyxLQUFLLElBQUksd0NBQXNCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFakQsdUZBQXVGO1FBQ3ZGLE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pDLElBQUssT0FBMkMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxRCxNQUFNLElBQUksS0FBSyxDQUNiLHdCQUF3QixRQUFRLHVKQUF1SixDQUN4TCxDQUFDO1FBQ0osQ0FBQztRQUVELE1BQU0sR0FBRyxHQUFHLE1BQU0sNkNBQW9CLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sSUFBSSxnQkFBZ0IsQ0FB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QU1HO0lBQ0gsSUFBSSxVQUFVO1FBQ1osT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FDRjtBQTlaRCw0Q0E4WkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTaWduZXJTZXNzaW9uTWFuYWdlciwgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJBcGksIE9pZGNDbGllbnQgfSBmcm9tIFwiLi9hcGlcIjtcbmltcG9ydCB7IEtleVR5cGUsIEtleSB9IGZyb20gXCIuL2tleVwiO1xuaW1wb3J0IHsgT3JnSW5mbywgUmF0Y2hldENvbmZpZyB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgTWZhUmVjZWlwdCB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHsgUGFnZU9wdHMgfSBmcm9tIFwiLi9wYWdpbmF0b3JcIjtcbmltcG9ydCB7IFJvbGUgfSBmcm9tIFwiLi9yb2xlXCI7XG5cbi8vIHVzZWQgaW4gZG9jIGNvbW1lbnRzXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuaW1wb3J0IHsgQWRkRmlkb0NoYWxsZW5nZSwgTWZhRmlkb0NoYWxsZW5nZSwgVG90cENoYWxsZW5nZSB9IGZyb20gXCIuL21mYVwiO1xuaW1wb3J0IHsgSnNvbkZpbGVTZXNzaW9uU3RvcmFnZSwgTWVtb3J5U2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuaW1wb3J0IHsgY29uZmlnRGlyLCBwYXRoSm9pbiB9IGZyb20gXCIuL3V0aWxcIjtcblxuLyoqIE9wdGlvbnMgZm9yIGxvZ2dpbmcgaW4gd2l0aCBPSURDIHRva2VuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCB0b2tlbiBsaWZldGltZXMgKi9cbiAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZztcbiAgLyoqIE9wdGlvbmFsIE1GQSByZWNlaXB0ICovXG4gIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0O1xuICAvKiogT3B0aW9uYWwgc3RvcmFnZSB0byB1c2UgZm9yIHRoZSByZXR1cm5lZCBzZXNzaW9uIChkZWZhdWx0cyB0byB7QGxpbmsgTWVtb3J5U2Vzc2lvblN0b3JhZ2V9KSAqL1xuICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2U7XG59XG5cbi8qKlxuICogQ2xpZW50IHRvIHVzZSB0byBzZW5kIHJlcXVlc3RzIHRvIEN1YmVTaWduZXIgc2VydmljZXNcbiAqIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyQ2xpZW50IGV4dGVuZHMgQ3ViZVNpZ25lckFwaSB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTWFuYWdlcn0gc2Vzc2lvbk1nciBUaGUgc2Vzc2lvbiBtYW5hZ2VyIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZz99IG9yZ0lkIE9wdGlvbmFsIG9yZ2FuaXphdGlvbiBJRDsgaWYgb21pdHRlZCwgdXNlcyB0aGUgb3JnIElEIGZyb20gdGhlIHNlc3Npb24gbWFuYWdlci5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25NZ3I6IFNpZ25lclNlc3Npb25NYW5hZ2VyLCBvcmdJZD86IHN0cmluZykge1xuICAgIHN1cGVyKHNlc3Npb25NZ3IsIG9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgdXNpbmcgdGhlIHNhbWUgc2Vzc2lvbiBtYW5hZ2VyIGJ1dCB0YXJnZXRpbmcgYSBkaWZmZXJlbnQgb3JnYW5pemF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZ2FuaXphdGlvbiBJRC5cbiAgICogQHJldHVybiB7Q3ViZVNpZ25lckNsaWVudH0gQSBuZXcgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyB1c2luZyB0aGUgc2FtZSBzZXNzaW9uIG1hbmFnZXIgYnV0IHRhcmdldGluZyBkaWZmZXJlbnQgb3JnYW5pemF0aW9uLlxuICAgKi9cbiAgd2l0aE9yZyhvcmdJZD86IHN0cmluZyk6IEN1YmVTaWduZXJDbGllbnQge1xuICAgIHJldHVybiBvcmdJZCA/IG5ldyBDdWJlU2lnbmVyQ2xpZW50KHRoaXMuc2Vzc2lvbk1nciwgb3JnSWQpIDogdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBtYW5hZ2VtZW50IHNlc3Npb24gYW5kIGNyZWF0ZXMgYSB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgT3B0aW9uYWwgc3RvcmFnZSBmcm9tIHdoaWNoIHRvIGxvYWQgdGhlIHNlc3Npb24gKGRlZmF1bHRzIHRvIHRoZSBkZWZhdWx0IG1hbmFnZW1lbnQgc2Vzc2lvbiBqc29uIGZpbGUgbG9jYXRpb24pXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lckNsaWVudD59IE5ldyBDdWJlU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZE1hbmFnZW1lbnRTZXNzaW9uKHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8Q3ViZVNpZ25lckNsaWVudD4ge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aEpvaW4oY29uZmlnRGlyKCksIFwibWFuYWdlbWVudC1zZXNzaW9uLmpzb25cIik7XG4gICAgc3RvcmFnZSA/Pz0gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoZmlsZVBhdGgpO1xuXG4gICAgLy8gVGhyb3cgYW5kIGFjdGlvbmFibGUgZXJyb3IgaWYgdGhlIG1hbmFnZW1lbnQgc2Vzc2lvbiBmaWxlIGNvbnRhaW5zIGEgQ29nbml0byBzZXNzaW9uXG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBpZiAoKHNlc3Npb24gYXMgdW5rbm93biBhcyB7IGlkX3Rva2VuOiBzdHJpbmcgfSkuaWRfdG9rZW4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEl0IGFwcGVhcnMgdGhhdCB0aGUgJyR7ZmlsZVBhdGh9JyBmaWxlIGNvbnRhaW5zIHRoZSBvbGQgKENvZ25pdG8pIHNlc3Npb247IHBsZWFzZSB1cGRhdGUgeW91ciBzZXNzaW9uIGJ5IHVwZGF0aW5nIHlvdXIgJ2NzJyB0byB2ZXJzaW9uICd2MC4zNy4wJyBvciBsYXRlciBhbmQgdGhlbiBydW5uaW5nICdjcyBsb2dpbidgLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBtZ3IgPSBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZSk7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyQ2xpZW50KG1ncik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNpZ25pbmcga2V5LlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5LiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEByZXR1cm4ge0tleVtdfSBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXkodHlwZTogS2V5VHlwZSwgb3duZXJJZD86IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNyZWF0ZUtleXModHlwZSwgMSwgb3duZXJJZCkpWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgc2lnbmluZyBrZXlzLlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleXModHlwZTogS2V5VHlwZSwgY291bnQ6IG51bWJlciwgb3duZXJJZD86IHN0cmluZyk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy5rZXlzQ3JlYXRlKHR5cGUsIGNvdW50LCBvd25lcklkKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcywgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIGtleSBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRoIGFuZCBtbmVtb25pYy5cbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkZXJpdmF0aW9uUGF0aCBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGggdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWNJZCBtYXRlcmlhbElkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogQHJldHVybiB7S2V5fSBuZXdseSBkZXJpdmVkIGtleSBvciB1bmRlZmluZWQgaWYgaXQgYWxyZWFkeSBleGlzdHMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXkoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aDogc3RyaW5nLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxLZXkgfCB1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZGVyaXZlS2V5cyh0eXBlLCBbZGVyaXZhdGlvblBhdGhdLCBtbmVtb25pY0lkKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aHMgYW5kIG1uZW1vbmljLlxuICAgKlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5cyB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGRlcml2YXRpb25QYXRocyBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGhzIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljSWQgbWF0ZXJpYWxJZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIEByZXR1cm4ge0tleVtdfSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXlzKHR5cGU6IEtleVR5cGUsIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sIG1uZW1vbmljSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy5rZXlzRGVyaXZlKHR5cGUsIGRlcml2YXRpb25QYXRocywgbW5lbW9uaWNJZCk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcge0BsaW5rIE9pZGNDbGllbnR9IHRoYXQgd2lsbCB1c2UgYSBnaXZlbiBPSURDIHRva2VuIGZvciBhdXRoLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBhdXRoZW50aWNhdGlvbiB0b2tlbiB0byB1c2VcbiAgICogQHJldHVybiB7T2lkY0NsaWVudH0gTmV3IE9JREMgY2xpZW50LlxuICAgKi9cbiAgbmV3T2lkY0NsaWVudChvaWRjVG9rZW46IHN0cmluZyk6IE9pZGNDbGllbnQge1xuICAgIHJldHVybiBuZXcgT2lkY0NsaWVudCh0aGlzLnNlc3Npb25NZ3IuZW52LCB0aGlzLm9yZ0lkLCBvaWRjVG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEF1dGhlbnRpY2F0ZSBhbiBPSURDIHVzZXIgYW5kIGNyZWF0ZSBhIG5ldyBzZXNzaW9uIG1hbmFnZXIgZm9yIHRoZW0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge09pZGNBdXRoT3B0aW9uc30gb3B0aW9ucyBPcHRpb25zLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPn0gVGhlIHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIGFzeW5jIG9pZGNBdXRoKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBvcHRpb25zPzogT2lkY0F1dGhPcHRpb25zLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgb2lkY0NsaWVudCA9IHRoaXMubmV3T2lkY0NsaWVudChvaWRjVG9rZW4pO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBvaWRjQ2xpZW50LnNlc3Npb25DcmVhdGUoc2NvcGVzLCBvcHRpb25zPy5saWZldGltZXMsIG9wdGlvbnM/Lm1mYVJlY2VpcHQpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2UobmV3IE1lbW9yeVNlc3Npb25TdG9yYWdlKHJlc3AuZGF0YSgpKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHVzZXIgaW4gdGhlIG9yZ2FuaXphdGlvbiBhbmQgc2VuZHMgYW4gaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG9yZ1VzZXJJbnZpdGV9LlxuICAgKi9cbiAgZ2V0IGNyZWF0ZVVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMub3JnVXNlckludml0ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG9yZ1VzZXJDcmVhdGVPaWRjfS5cbiAgICovXG4gIGdldCBjcmVhdGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy5vcmdVc2VyQ3JlYXRlT2lkYy5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyBPSURDIHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG9yZ1VzZXJEZWxldGVPaWRjfS5cbiAgICovXG4gIGdldCBkZWxldGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy5vcmdVc2VyRGVsZXRlT2lkYy5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgb3JnVXNlcnNMaXN0fVxuICAgKi9cbiAgZ2V0IHVzZXJzKCkge1xuICAgIHJldHVybiB0aGlzLm9yZ1VzZXJzTGlzdC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayB1c2VyR2V0fVxuICAgKi9cbiAgZ2V0IHVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlckdldC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpbmZvcm1hdGlvbiBhYm91dCBhIHNwZWNpZmljIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvcmdJZCBUaGUgSUQgb3IgbmFtZSBvZiB0aGUgb3JnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8T3JnSW5mbz59IEN1YmVTaWduZXIgY2xpZW50IGZvciB0aGUgcmVxdWVzdGVkIG9yZy5cbiAgICovXG4gIGFzeW5jIG9yZyhvcmdJZD86IHN0cmluZyk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLndpdGhPcmcob3JnSWQpLm9yZ0dldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayB1c2VyR2V0fVxuICAgKi9cbiAgZ2V0IGFib3V0TWUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlckdldC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybiB7S2V5fSBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleUluZm8gPSBhd2FpdCB0aGlzLmtleUdldChrZXlJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcywga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBrZXlzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZT99IHR5cGUgT3B0aW9uYWwga2V5IHR5cGUgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleVtdPn0gVGhlIGtleXMuXG4gICAqL1xuICBhc3luYyBvcmdLZXlzKHR5cGU/OiBLZXlUeXBlLCBwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3QgcGFnaW5hdG9yID0gdGhpcy5rZXlzTGlzdCh0eXBlLCBwYWdlKTtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgcGFnaW5hdG9yLmZldGNoKCk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmc/fSBuYW1lIFRoZSBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJuIHtSb2xlfSBUaGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyBjcmVhdGVSb2xlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSWQgPSBhd2FpdCB0aGlzLnJvbGVDcmVhdGUobmFtZSk7XG4gICAgY29uc3Qgcm9sZUluZm8gPSBhd2FpdCB0aGlzLnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcywgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJvbGUgYnkgaWQgb3IgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm4ge1JvbGV9IFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgZ2V0Um9sZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMsIHJvbGVJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCByb2xlcyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtSb2xlW119IFRoZSByb2xlcy5cbiAgICovXG4gIGFzeW5jIGxpc3RSb2xlcyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgdGhpcy5yb2xlc0xpc3QocGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gcm9sZXMubWFwKChyKSA9PiBuZXcgUm9sZSh0aGlzLCByKSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgb3JnVXNlcnNMaXN0fVxuICAgKi9cbiAgZ2V0IGxpc3RVc2VycygpIHtcbiAgICByZXR1cm4gdGhpcy5vcmdVc2Vyc0xpc3QuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgbWZhQXBwcm92ZX1cbiAgICovXG4gIGdldCBhcHByb3ZlTWZhUmVxdWVzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5tZmFBcHByb3ZlLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgbWZhQXBwcm92ZVRvdHB9XG4gICAqL1xuICBnZXQgdG90cEFwcHJvdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMubWZhQXBwcm92ZVRvdHAuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhcHByb3ZhbCBvZiBhbiBleGlzdGluZyBNRkEgcmVxdWVzdCB1c2luZyBGSURPLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nXG4gICAqIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIGZpZG9BcHByb3ZlQ29tcGxldGV9LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBtZmFBcHByb3ZlRmlkb0luaXR9XG4gICAqL1xuICBnZXQgZmlkb0FwcHJvdmVTdGFydCgpIHtcbiAgICByZXR1cm4gdGhpcy5tZmFBcHByb3ZlRmlkb0luaXQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIE1GQSBhcHByb3ZhbCB3aXRoIEZJRE8gY2hhbGxlbmdlIGlzc3VlZCBieSB7QGxpbmsgZmlkb0FwcHJvdmVTdGFydH0uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG1mYUFwcHJvdmVGaWRvQ29tcGxldGV9XG4gICAqL1xuICBnZXQgZmlkb0FwcHJvdmVDb21wbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5tZmFBcHByb3ZlRmlkb0NvbXBsZXRlLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCBieSBpdHMgaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG1mYUdldH1cbiAgICovXG4gIGdldCBnZXRNZmFJbmZvKCkge1xuICAgIHJldHVybiB0aGlzLm1mYUdldC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBtZmFMaXN0fVxuICAgKi9cbiAgZ2V0IGxpc3RNZmFJbmZvcygpIHtcbiAgICByZXR1cm4gdGhpcy5tZmFMaXN0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIGlkZW50aXR5UHJvdmV9XG4gICAqL1xuICBnZXQgcHJvdmVJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5pZGVudGl0eVByb3ZlLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBnaXZlbiBwcm9vZiBvZiBPSURDIGF1dGhlbnRpY2F0aW9uIGlzIHZhbGlkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBpZGVudGl0eVZlcmlmeX1cbiAgICovXG4gIGdldCB2ZXJpZnlJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5pZGVudGl0eVZlcmlmeS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAgICpcbiAgICogUmV0dXJucyBhIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlfSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBNRkEgbWF5IGJlIHJlcXVpcmVkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayB1c2VyRmlkb1JlZ2lzdGVySW5pdH1cbiAgICovXG4gIGdldCBhZGRGaWRvU3RhcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlckZpZG9SZWdpc3RlckluaXQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBGSURPIGtleSBmcm9tIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogQWxsb3dlZCBvbmx5IGlmIFRPVFAgaXMgYWxzbyBkZWZpbmVkLlxuICAgKiBNRkEgdmlhIFRPVFAgaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayB1c2VyRmlkb0RlbGV0ZX1cbiAgICovXG4gIGdldCBkZWxldGVGaWRvKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJGaWRvRGVsZXRlLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gY2hhbmdlIHVzZXIncyBUT1RQLiBSZXR1cm5zIGEge0BsaW5rIFRvdHBDaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0gb3JcbiAgICoge0BsaW5rIHJlc2V0VG90cENvbXBsZXRlfS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgdXNlclRvdHBSZXNldEluaXR9XG4gICAqL1xuICBnZXQgcmVzZXRUb3RwU3RhcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlclRvdHBSZXNldEluaXQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIFRPVFAgY2hhbGxlbmdlIGlzc3VlZCBieSB7QGxpbmsgcmVzZXRUb3RwU3RhcnR9LiBJZiBzdWNjZXNzZnVsLFxuICAgKiB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uIHdpbGwgYmUgdXBkYXRlZCB0byB0aGF0IG9mIHRoZSBUT1RQIGNoYWxsZW5nZS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgdXNlclRvdHBSZXNldENvbXBsZXRlfVxuICAgKi9cbiAgZ2V0IHJlc2V0VG90cENvbXBsZXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJUb3RwUmVzZXRDb21wbGV0ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSB2ZXJpZmljYXRpb24gZmFpbHMuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHVzZXJUb3RwVmVyaWZ5fVxuICAgKi9cbiAgZ2V0IHZlcmlmeVRvdHAoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlclRvdHBWZXJpZnkuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgVE9UUCBmcm9tIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogQWxsb3dlZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBGSURPIGtleSBpcyByZWdpc3RlcmVkIHdpdGggdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBNRkEgdmlhIEZJRE8gaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayB1c2VyVG90cERlbGV0ZX0uXG4gICAqL1xuICBnZXQgZGVsZXRlVG90cCgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyVG90cERlbGV0ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzdGFrZSByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBzaWduU3Rha2V9XG4gICAqL1xuICBnZXQgc3Rha2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2lnblN0YWtlLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiB1bnN0YWtlIHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHNpZ25VbnN0YWtlfVxuICAgKi9cbiAgZ2V0IHVuc3Rha2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2lnblVuc3Rha2UuYmluZCh0aGlzKTtcbiAgfVxufVxuIl19