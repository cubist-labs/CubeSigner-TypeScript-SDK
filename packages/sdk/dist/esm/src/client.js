import { SignerSessionManager } from "./session/signer_session_manager";
import { CubeSignerApi, OidcClient } from "./api";
import { Key } from "./key";
import { Role } from "./role";
import { MemorySessionStorage } from "./session/session_storage";
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export class CubeSignerClient extends CubeSignerApi {
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
        const mgr = await SignerSessionManager.loadFromStorage(storage);
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
        return keys.map((k) => new Key(this, k));
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
        return keys.map((k) => new Key(this, k));
    }
    /**
     * Create a new {@link OidcClient} that will use a given OIDC token for auth.
     * @param {string} oidcToken The authentication token to use
     * @return {OidcClient} New OIDC client.
     */
    newOidcClient(oidcToken) {
        return new OidcClient(this.sessionMgr.env, this.orgId, oidcToken);
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
        return await SignerSessionManager.loadFromStorage(new MemorySessionStorage(resp.data()));
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
        return new Key(this, keyInfo);
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
        return keys.map((k) => new Key(this, k));
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
        return new Role(this, roleInfo);
    }
    /**
     * Get a role by id or name.
     *
     * @param {string} roleId The id or name of the role to get.
     * @return {Role} The role.
     */
    async getRole(roleId) {
        const roleInfo = await this.roleGet(roleId);
        return new Role(this, roleInfo);
    }
    /**
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Role[]} The roles.
     */
    async listRoles(page) {
        const roles = await this.rolesList(page).fetch();
        return roles.map((r) => new Role(this, r));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsb0JBQW9CLEVBQXdCLE1BQU0sa0NBQWtDLENBQUM7QUFDOUYsT0FBTyxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFDbEQsT0FBTyxFQUFXLEdBQUcsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUlyQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBSzlCLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBWWpFOzs7R0FHRztBQUNILE1BQU0sT0FBTyxnQkFBaUIsU0FBUSxhQUFhO0lBQ2pEOzs7O09BSUc7SUFDSCxZQUFZLFVBQWdDLEVBQUUsS0FBYztRQUMxRCxLQUFLLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE9BQU8sQ0FBQyxLQUFjO1FBQ3BCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNyRSxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLE9BQTZCO1FBQzlELHVGQUF1RjtRQUN2RixNQUFNLE9BQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxJQUFLLE9BQTJDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FDYiw0S0FBNEssQ0FDN0ssQ0FBQztRQUNKLENBQUM7UUFFRCxNQUFNLEdBQUcsR0FBRyxNQUFNLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRSxPQUFP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QUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsSUFBSSxVQUFVO1FBQ1osT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNpZ25lclNlc3Npb25NYW5hZ2VyLCBTaWduZXJTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckFwaSwgT2lkY0NsaWVudCB9IGZyb20gXCIuL2FwaVwiO1xuaW1wb3J0IHsgS2V5VHlwZSwgS2V5IH0gZnJvbSBcIi4va2V5XCI7XG5pbXBvcnQgeyBPcmdJbmZvLCBSYXRjaGV0Q29uZmlnIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBNZmFSZWNlaXB0IH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgeyBQYWdlT3B0cyB9IGZyb20gXCIuL3BhZ2luYXRvclwiO1xuaW1wb3J0IHsgUm9sZSB9IGZyb20gXCIuL3JvbGVcIjtcblxuLy8gdXNlZCBpbiBkb2MgY29tbWVudHNcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgeyBBZGRGaWRvQ2hhbGxlbmdlLCBNZmFGaWRvQ2hhbGxlbmdlLCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgeyBNZW1vcnlTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlXCI7XG5cbi8qKiBPcHRpb25zIGZvciBsb2dnaW5nIGluIHdpdGggT0lEQyB0b2tlbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPaWRjQXV0aE9wdGlvbnMge1xuICAvKiogT3B0aW9uYWwgdG9rZW4gbGlmZXRpbWVzICovXG4gIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWc7XG4gIC8qKiBPcHRpb25hbCBNRkEgcmVjZWlwdCAqL1xuICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdDtcbiAgLyoqIE9wdGlvbmFsIHN0b3JhZ2UgdG8gdXNlIGZvciB0aGUgcmV0dXJuZWQgc2Vzc2lvbiAoZGVmYXVsdHMgdG8ge0BsaW5rIE1lbW9yeVNlc3Npb25TdG9yYWdlfSkgKi9cbiAgc3RvcmFnZT86IFNpZ25lclNlc3Npb25TdG9yYWdlO1xufVxuXG4vKipcbiAqIENsaWVudCB0byB1c2UgdG8gc2VuZCByZXF1ZXN0cyB0byBDdWJlU2lnbmVyIHNlcnZpY2VzXG4gKiB3aGVuIGF1dGhlbnRpY2F0aW5nIHVzaW5nIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lckNsaWVudCBleHRlbmRzIEN1YmVTaWduZXJBcGkge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbk1hbmFnZXJ9IHNlc3Npb25NZ3IgVGhlIHNlc3Npb24gbWFuYWdlciB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvcmdJZCBPcHRpb25hbCBvcmdhbml6YXRpb24gSUQ7IGlmIG9taXR0ZWQsIHVzZXMgdGhlIG9yZyBJRCBmcm9tIHRoZSBzZXNzaW9uIG1hbmFnZXIuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uTWdyOiBTaWduZXJTZXNzaW9uTWFuYWdlciwgb3JnSWQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihzZXNzaW9uTWdyLCBvcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIHVzaW5nIHRoZSBzYW1lIHNlc3Npb24gbWFuYWdlciBidXQgdGFyZ2V0aW5nIGEgZGlmZmVyZW50IG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmdhbml6YXRpb24gSUQuXG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJDbGllbnR9IEEgbmV3IGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgdXNpbmcgdGhlIHNhbWUgc2Vzc2lvbiBtYW5hZ2VyIGJ1dCB0YXJnZXRpbmcgZGlmZmVyZW50IG9yZ2FuaXphdGlvbi5cbiAgICovXG4gIHdpdGhPcmcob3JnSWQ/OiBzdHJpbmcpOiBDdWJlU2lnbmVyQ2xpZW50IHtcbiAgICByZXR1cm4gb3JnSWQgPyBuZXcgQ3ViZVNpZ25lckNsaWVudCh0aGlzLnNlc3Npb25NZ3IsIG9yZ0lkKSA6IHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW4gZXhpc3RpbmcgbWFuYWdlbWVudCBzZXNzaW9uIGFuZCBjcmVhdGVzIGEge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFN0b3JhZ2UgZnJvbSB3aGljaCB0byBsb2FkIHRoZSBzZXNzaW9uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lckNsaWVudD59IE5ldyBDdWJlU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZE1hbmFnZW1lbnRTZXNzaW9uKHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxDdWJlU2lnbmVyQ2xpZW50PiB7XG4gICAgLy8gVGhyb3cgYW5kIGFjdGlvbmFibGUgZXJyb3IgaWYgdGhlIG1hbmFnZW1lbnQgc2Vzc2lvbiBmaWxlIGNvbnRhaW5zIGEgQ29nbml0byBzZXNzaW9uXG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBpZiAoKHNlc3Npb24gYXMgdW5rbm93biBhcyB7IGlkX3Rva2VuOiBzdHJpbmcgfSkuaWRfdG9rZW4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEl0IGFwcGVhcnMgdGhhdCB0aGUgc3RvcmFnZSBjb250YWlucyB0aGUgb2xkIChDb2duaXRvKSBzZXNzaW9uOyBwbGVhc2UgdXBkYXRlIHlvdXIgc2Vzc2lvbiBieSB1cGRhdGluZyB5b3VyICdjcycgdG8gdmVyc2lvbiAndjAuMzcuMCcgb3IgbGF0ZXIgYW5kIHRoZW4gcnVubmluZyAnY3MgbG9naW4nYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgbWdyID0gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICAgIHJldHVybiBuZXcgQ3ViZVNpZ25lckNsaWVudChtZ3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduaW5nIGtleS5cbiAgICogQHBhcmFtIHtLZXlUeXBlfSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleS4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5KHR5cGU6IEtleVR5cGUsIG93bmVySWQ/OiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jcmVhdGVLZXlzKHR5cGUsIDEsIG93bmVySWQpKVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICogQHBhcmFtIHtLZXlUeXBlfSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIGtleXMgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXlzLiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEByZXR1cm4ge0tleVtdfSBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlzKHR5cGU6IEtleVR5cGUsIGNvdW50OiBudW1iZXIsIG93bmVySWQ/OiBzdHJpbmcpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMua2V5c0NyZWF0ZSh0eXBlLCBjb3VudCwgb3duZXJJZCk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBrZXkgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aCBhbmQgbW5lbW9uaWMuXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXkgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGVyaXZhdGlvblBhdGggTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRoIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljSWQgbWF0ZXJpYWxJZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIEByZXR1cm4ge0tleX0gbmV3bHkgZGVyaXZlZCBrZXkgb3IgdW5kZWZpbmVkIGlmIGl0IGFscmVhZHkgZXhpc3RzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5KFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGg6IHN0cmluZyxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICk6IFByb21pc2U8S2V5IHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmRlcml2ZUtleXModHlwZSwgW2Rlcml2YXRpb25QYXRoXSwgbW5lbW9uaWNJZCkpWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIHNldCBvZiBrZXlzIG9mIHRoZSBnaXZlbiB0eXBlIHVzaW5nIHRoZSBnaXZlbiBkZXJpdmF0aW9uIHBhdGhzIGFuZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleXMgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBkZXJpdmF0aW9uUGF0aHMgTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRocyB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtbmVtb25pY0lkIG1hdGVyaWFsSWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5cyh0eXBlOiBLZXlUeXBlLCBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLCBtbmVtb25pY0lkOiBzdHJpbmcpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMua2V5c0Rlcml2ZSh0eXBlLCBkZXJpdmF0aW9uUGF0aHMsIG1uZW1vbmljSWQpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHtAbGluayBPaWRjQ2xpZW50fSB0aGF0IHdpbGwgdXNlIGEgZ2l2ZW4gT0lEQyB0b2tlbiBmb3IgYXV0aC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgYXV0aGVudGljYXRpb24gdG9rZW4gdG8gdXNlXG4gICAqIEByZXR1cm4ge09pZGNDbGllbnR9IE5ldyBPSURDIGNsaWVudC5cbiAgICovXG4gIG5ld09pZGNDbGllbnQob2lkY1Rva2VuOiBzdHJpbmcpOiBPaWRjQ2xpZW50IHtcbiAgICByZXR1cm4gbmV3IE9pZGNDbGllbnQodGhpcy5zZXNzaW9uTWdyLmVudiwgdGhpcy5vcmdJZCwgb2lkY1Rva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRoZW50aWNhdGUgYW4gT0lEQyB1c2VyIGFuZCBjcmVhdGUgYSBuZXcgc2Vzc2lvbiBtYW5hZ2VyIGZvciB0aGVtLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7TGlzdDxzdHJpbmc+fSBzY29wZXMgVGhlIHNjb3BlcyBvZiB0aGUgcmVzdWx0aW5nIHNlc3Npb25cbiAgICogQHBhcmFtIHtPaWRjQXV0aE9wdGlvbnN9IG9wdGlvbnMgT3B0aW9ucy5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IFRoZSBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBhc3luYyBvaWRjQXV0aChcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgb3B0aW9ucz86IE9pZGNBdXRoT3B0aW9ucyxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IG9pZGNDbGllbnQgPSB0aGlzLm5ld09pZGNDbGllbnQob2lkY1Rva2VuKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgb2lkY0NsaWVudC5zZXNzaW9uQ3JlYXRlKHNjb3Blcywgb3B0aW9ucz8ubGlmZXRpbWVzLCBvcHRpb25zPy5tZmFSZWNlaXB0KTtcbiAgICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKG5ldyBNZW1vcnlTZXNzaW9uU3RvcmFnZShyZXNwLmRhdGEoKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmRzIGFuIGludml0YXRpb24gdG8gdGhhdCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBvcmdVc2VySW52aXRlfS5cbiAgICovXG4gIGdldCBjcmVhdGVVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLm9yZ1VzZXJJbnZpdGUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgT0lEQyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBvcmdVc2VyQ3JlYXRlT2lkY30uXG4gICAqL1xuICBnZXQgY3JlYXRlT2lkY1VzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMub3JnVXNlckNyZWF0ZU9pZGMuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBvcmdVc2VyRGVsZXRlT2lkY30uXG4gICAqL1xuICBnZXQgZGVsZXRlT2lkY1VzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMub3JnVXNlckRlbGV0ZU9pZGMuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG9yZ1VzZXJzTGlzdH1cbiAgICovXG4gIGdldCB1c2VycygpIHtcbiAgICByZXR1cm4gdGhpcy5vcmdVc2Vyc0xpc3QuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgdXNlckdldH1cbiAgICovXG4gIGdldCB1c2VyKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJHZXQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBzcGVjaWZpYyBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3JnSWQgVGhlIElEIG9yIG5hbWUgb2YgdGhlIG9yZ1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPE9yZ0luZm8+fSBDdWJlU2lnbmVyIGNsaWVudCBmb3IgdGhlIHJlcXVlc3RlZCBvcmcuXG4gICAqL1xuICBhc3luYyBvcmcob3JnSWQ/OiBzdHJpbmcpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy53aXRoT3JnKG9yZ0lkKS5vcmdHZXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgdXNlckdldH1cbiAgICovXG4gIGdldCBhYm91dE1lKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJHZXQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm4ge0tleX0gVGhlIGtleS5cbiAgICovXG4gIGFzeW5jIGdldEtleShrZXlJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy5rZXlHZXQoa2V5SWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwga2V5cyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVR5cGU/fSB0eXBlIE9wdGlvbmFsIGtleSB0eXBlIHRvIGZpbHRlciBsaXN0IGZvci5cbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxLZXlbXT59IFRoZSBrZXlzLlxuICAgKi9cbiAgYXN5bmMgb3JnS2V5cyh0eXBlPzogS2V5VHlwZSwgcGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IHBhZ2luYXRvciA9IHRoaXMua2V5c0xpc3QodHlwZSwgcGFnZSk7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHBhZ2luYXRvci5mZXRjaCgpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybiB7Um9sZX0gVGhlIG5ldyByb2xlLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlUm9sZShuYW1lPzogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3Qgcm9sZUlkID0gYXdhaXQgdGhpcy5yb2xlQ3JlYXRlKG5hbWUpO1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMsIHJvbGVJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByb2xlIGJ5IGlkIG9yIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIGlkIG9yIG5hbWUgb2YgdGhlIHJvbGUgdG8gZ2V0LlxuICAgKiBAcmV0dXJuIHtSb2xlfSBUaGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIGdldFJvbGUocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMucm9sZUdldChyb2xlSWQpO1xuICAgIHJldHVybiBuZXcgUm9sZSh0aGlzLCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7Um9sZVtdfSBUaGUgcm9sZXMuXG4gICAqL1xuICBhc3luYyBsaXN0Um9sZXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxSb2xlW10+IHtcbiAgICBjb25zdCByb2xlcyA9IGF3YWl0IHRoaXMucm9sZXNMaXN0KHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIHJvbGVzLm1hcCgocikgPT4gbmV3IFJvbGUodGhpcywgcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHVzZXJzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG9yZ1VzZXJzTGlzdH1cbiAgICovXG4gIGdldCBsaXN0VXNlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMub3JnVXNlcnNMaXN0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG1mYUFwcHJvdmV9XG4gICAqL1xuICBnZXQgYXBwcm92ZU1mYVJlcXVlc3QoKSB7XG4gICAgcmV0dXJuIHRoaXMubWZhQXBwcm92ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIFRPVFAuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG1mYUFwcHJvdmVUb3RwfVxuICAgKi9cbiAgZ2V0IHRvdHBBcHByb3ZlKCkge1xuICAgIHJldHVybiB0aGlzLm1mYUFwcHJvdmVUb3RwLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwgb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgRklETy5cbiAgICpcbiAgICogUmV0dXJucyBhIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlfSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZ1xuICAgKiB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yIHtAbGluayBmaWRvQXBwcm92ZUNvbXBsZXRlfS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgbWZhQXBwcm92ZUZpZG9Jbml0fVxuICAgKi9cbiAgZ2V0IGZpZG9BcHByb3ZlU3RhcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMubWZhQXBwcm92ZUZpZG9Jbml0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBNRkEgYXBwcm92YWwgd2l0aCBGSURPIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIGZpZG9BcHByb3ZlU3RhcnR9LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBtZmFBcHByb3ZlRmlkb0NvbXBsZXRlfVxuICAgKi9cbiAgZ2V0IGZpZG9BcHByb3ZlQ29tcGxldGUoKSB7XG4gICAgcmV0dXJuIHRoaXMubWZhQXBwcm92ZUZpZG9Db21wbGV0ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBtZmFHZXR9XG4gICAqL1xuICBnZXQgZ2V0TWZhSW5mbygpIHtcbiAgICByZXR1cm4gdGhpcy5tZmFHZXQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgTUZBIHJlcXVlc3RzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgbWZhTGlzdH1cbiAgICovXG4gIGdldCBsaXN0TWZhSW5mb3MoKSB7XG4gICAgcmV0dXJuIHRoaXMubWZhTGlzdC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBpZGVudGl0eVByb3ZlfVxuICAgKi9cbiAgZ2V0IHByb3ZlSWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWRlbnRpdHlQcm92ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgZ2l2ZW4gcHJvb2Ygb2YgT0lEQyBhdXRoZW50aWNhdGlvbiBpcyB2YWxpZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgaWRlbnRpdHlWZXJpZnl9XG4gICAqL1xuICBnZXQgdmVyaWZ5SWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWRlbnRpdHlWZXJpZnkuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBhZGQgYSBuZXcgRklETyBkZXZpY2UuXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZX0gdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmcge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogTUZBIG1heSBiZSByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgdXNlckZpZG9SZWdpc3RlckluaXR9XG4gICAqL1xuICBnZXQgYWRkRmlkb1N0YXJ0KCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJGaWRvUmVnaXN0ZXJJbml0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgRklETyBrZXkgZnJvbSB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIEFsbG93ZWQgb25seSBpZiBUT1RQIGlzIGFsc28gZGVmaW5lZC5cbiAgICogTUZBIHZpYSBUT1RQIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgdXNlckZpZG9EZWxldGV9XG4gICAqL1xuICBnZXQgZGVsZXRlRmlkbygpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyRmlkb0RlbGV0ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gUmV0dXJucyBhIHtAbGluayBUb3RwQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayByZXNldFRvdHBDb21wbGV0ZX0uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHVzZXJUb3RwUmVzZXRJbml0fVxuICAgKi9cbiAgZ2V0IHJlc2V0VG90cFN0YXJ0KCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJUb3RwUmVzZXRJbml0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIHJlc2V0VG90cFN0YXJ0fS4gSWYgc3VjY2Vzc2Z1bCxcbiAgICogdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIHVzZXJUb3RwUmVzZXRDb21wbGV0ZX1cbiAgICovXG4gIGdldCByZXNldFRvdHBDb21wbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VyVG90cFJlc2V0Q29tcGxldGUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyBhIGdpdmVuIFRPVFAgY29kZSBhZ2FpbnN0IHRoZSBjdXJyZW50IHVzZXIncyBUT1RQIGNvbmZpZ3VyYXRpb24uXG4gICAqIFRocm93cyBhbiBlcnJvciBpZiB0aGUgdmVyaWZpY2F0aW9uIGZhaWxzLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayB1c2VyVG90cFZlcmlmeX1cbiAgICovXG4gIGdldCB2ZXJpZnlUb3RwKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJUb3RwVmVyaWZ5LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIFRPVFAgZnJvbSB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIEFsbG93ZWQgb25seSBpZiBhdCBsZWFzdCBvbmUgRklETyBrZXkgaXMgcmVnaXN0ZXJlZCB3aXRoIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogTUZBIHZpYSBGSURPIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgdXNlclRvdHBEZWxldGV9LlxuICAgKi9cbiAgZ2V0IGRlbGV0ZVRvdHAoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlclRvdHBEZWxldGUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc3Rha2UgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgc2lnblN0YWtlfVxuICAgKi9cbiAgZ2V0IHN0YWtlKCkge1xuICAgIHJldHVybiB0aGlzLnNpZ25TdGFrZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gdW5zdGFrZSByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBzaWduVW5zdGFrZX1cbiAgICovXG4gIGdldCB1bnN0YWtlKCkge1xuICAgIHJldHVybiB0aGlzLnNpZ25VbnN0YWtlLmJpbmQodGhpcyk7XG4gIH1cbn1cbiJdfQ==