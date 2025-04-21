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
var _Org_apiClient, _Org_orgId, _Org_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Org = void 0;
const _1 = require(".");
const contact_1 = require("./contact");
/**
 * An organization.
 *
 * Extends {@link CubeSignerClient} and provides a few org-specific methods on top.
 */
class Org {
    /**
     * @returns The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    get id() {
        return __classPrivateFieldGet(this, _Org_orgId, "f");
    }
    /**
     * @returns The cached properties of this org. The cached properties reflect the
     * state of the last fetch or update.
     */
    get cached() {
        return __classPrivateFieldGet(this, _Org_data, "f");
    }
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param orgId The id of the org
     */
    constructor(apiClient, orgId) {
        _Org_apiClient.set(this, void 0);
        _Org_orgId.set(this, void 0);
        /** The org information */
        _Org_data.set(this, void 0);
        __classPrivateFieldSet(this, _Org_orgId, orgId, "f");
        __classPrivateFieldSet(this, _Org_apiClient, orgId === apiClient.orgId ? apiClient : apiClient.withTargetOrg(orgId), "f");
    }
    /**
     * Create a new organization. The new org is a child of the
     * current org and inherits its key-export policy. The new org
     * is created with one owner, the caller of this API.
     *
     * @param nameOrRequest The name of the new org or the properties of the new org.
     * @returns Information about the newly created org.
     */
    async createOrg(nameOrRequest) {
        const req = typeof nameOrRequest === "string" ? { name: nameOrRequest } : nameOrRequest;
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(req.name)) {
            throw new Error("Org name must be alphanumeric and between 3 and 30 characters");
        }
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgCreateOrg(req);
    }
    /**
     * Query org metrics.
     *
     * @param metricName The metric name.
     * @param startTime The start date in seconds since unix epoch.
     * @param opt Other optional arguments
     * @param opt.end_time The end date in seconds since unix epoch. If omitted, defaults to 'now'.
     * @param opt.period The granularity, in seconds, of the returned data points.
     *   This value is automatically rounded up to a multiple of 3600 (i.e., 1 hour).
     *   If omitted, defaults to the duration between the start and the end date.
     *   Must be no less than 1 hour, i.e., 3600 seconds. Additionally, this period must not
     *   divide the `endTime - startTime` period into more than 100 data points.
     * @param pageOpts Pagination options.
     * @returns Metric values (data points) for the requested periods.
     */
    async queryMetrics(metricName, startTime, opt, pageOpts) {
        const req = {
            metric_name: metricName,
            start_time: startTime,
            ...opt,
        };
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgQueryMetrics(req, pageOpts).fetchAll();
    }
    /**
     * Fetch the org information.
     *
     * @returns The org information.
     */
    async fetch() {
        __classPrivateFieldSet(this, _Org_data, await __classPrivateFieldGet(this, _Org_apiClient, "f").orgGet(), "f");
        return __classPrivateFieldGet(this, _Org_data, "f");
    }
    /** @returns The human-readable name for the org */
    async name() {
        const data = await this.fetch();
        return data.name ?? undefined;
    }
    /**
     * Set the human-readable name for the org.
     *
     * @param name The new human-readable name for the org (must be alphanumeric).
     * @example my_org_name
     */
    async setName(name) {
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) {
            throw new Error("Org name must be alphanumeric and between 3 and 30 characters");
        }
        await __classPrivateFieldGet(this, _Org_apiClient, "f").orgUpdate({ name });
    }
    /** @returns Whether the org is enabled */
    async enabled() {
        const data = await this.fetch();
        return data.enabled;
    }
    /** Enable the org. */
    async enable() {
        await this.update({ enabled: true });
    }
    /** Disable the org. */
    async disable() {
        await this.update({ enabled: false });
    }
    /** @returns the policy for the org. */
    async policy() {
        const data = await this.fetch();
        return (data.policy ?? []);
    }
    /**
     * Set the policy for the org.
     *
     * @param policy The new policy for the org.
     */
    async setPolicy(policy) {
        const p = policy;
        await this.update({ policy: p });
    }
    /**
     * Set the notification endpoints for the org.
     *
     * @param notification_endpoints Endpoints.
     */
    async setNotificationEndpoints(notification_endpoints) {
        await this.update({
            notification_endpoints,
        });
    }
    /**
     * Create a new signing key.
     *
     * @param type The type of key to create.
     * @param ownerId The owner of the key. Defaults to the session's user.
     * @param props Additional properties to set on the new key.
     * @returns The new keys.
     */
    async createKey(type, ownerId, props) {
        const keys = await __classPrivateFieldGet(this, _Org_apiClient, "f").keysCreate(type, 1, ownerId, props);
        return new _1.Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), keys[0]);
    }
    /**
     * Create new signing keys.
     *
     * @param type The type of key to create.
     * @param count The number of keys to create.
     * @param ownerId The owner of the keys. Defaults to the session's user.
     * @param props Additional properties to set on the new keys.
     * @returns The new keys.
     */
    async createKeys(type, count, ownerId, props) {
        const keys = await __classPrivateFieldGet(this, _Org_apiClient, "f").keysCreate(type, count, ownerId, props);
        return keys.map((k) => new _1.Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
    }
    /**
     * Create a new (first-party) user in the organization and sends an invitation to that user.
     *
     * Same as {@link ApiClient.orgUserInvite}, see its documentation for more information.
     *
     * @returns A function that invites a user
     */
    get createUser() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUserInvite.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Delete an existing user.
     *
     * Same as {@link ApiClient.orgUserDelete}, see its documentation for more information.
     *
     * @returns A function that deletes a user
     */
    get deleteUser() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUserDelete.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     *
     * Same as {@link ApiClient.orgUserCreateOidc}, see its documentation for more information.
     *
     * @returns A function that creates an OIDC user, resolving to the new user's ID
     */
    get createOidcUser() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUserCreateOidc.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Delete an existing OIDC user.
     *
     * Same as {@link ApiClient.orgUserDeleteOidc}, see its documentation for more information.
     *
     * @returns A function that deletes an OIDC user
     */
    get deleteOidcUser() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUserDeleteOidc.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * List all users in the organization.
     *
     * @returns The list of users
     */
    async users() {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgUsersList().fetchAll();
    }
    /**
     * List users in the organization (paginated).
     *
     * Same as {@link ApiClient.orgUsersList}, see its documentation for more information.
     *
     * @returns A function that returns a paginated list of users
     */
    get usersPaginated() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUsersList.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Get user by id.
     *
     * Same as {@link ApiClient.orgUserGet}, see its documentation for more information.
     *
     * @returns A function that resolves to a user's info
     */
    get getUser() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUserGet.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Enable a user in this org
     *
     * @param userId The user whose membership to enable
     * @returns The updated user's membership
     */
    async enableUser(userId) {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgUpdateUserMembership(userId, { disabled: false });
    }
    /**
     * Disable a user in this org
     *
     * @param userId The user whose membership to disable
     * @returns The updated user's membership
     */
    async disableUser(userId) {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgUpdateUserMembership(userId, { disabled: true });
    }
    /**
     * Get the accessible keys in the organization
     *
     * @param props Optional filtering properties.
     * @returns The keys.
     */
    async keys(props) {
        const paginator = __classPrivateFieldGet(this, _Org_apiClient, "f").keysList(props?.type, props?.page, props?.owner, props?.search);
        const keys = await paginator.fetch();
        return keys.map((k) => new _1.Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
    }
    /**
     * Create a new role.
     *
     * @param name The name of the role.
     * @returns The new role.
     */
    async createRole(name) {
        const roleId = await __classPrivateFieldGet(this, _Org_apiClient, "f").roleCreate(name);
        const roleInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").roleGet(roleId);
        return new _1.Role(__classPrivateFieldGet(this, _Org_apiClient, "f"), roleInfo);
    }
    /**
     * Get a role by id or name.
     *
     * @param roleId The id or name of the role to get.
     * @returns The role.
     */
    async getRole(roleId) {
        const roleInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").roleGet(roleId);
        return new _1.Role(__classPrivateFieldGet(this, _Org_apiClient, "f"), roleInfo);
    }
    /**
     * Gets all the roles in the org
     *
     * @param page The paginator options
     * @returns The roles
     */
    async roles(page) {
        const roles = await __classPrivateFieldGet(this, _Org_apiClient, "f").rolesList(page).fetch();
        return roles.map((r) => new _1.Role(__classPrivateFieldGet(this, _Org_apiClient, "f"), r));
    }
    /**
     * Derive a key of the given type using the given derivation path and mnemonic.
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param type Type of key to derive from the mnemonic.
     * @param derivationPath Mnemonic derivation path used to generate new key.
     * @param mnemonicId material_id of mnemonic key used to derive the new key.
     * @param props Additional properties for derivation.
     *
     * @returns newly derived key or undefined if it already exists.
     */
    async deriveKey(type, derivationPath, mnemonicId, props) {
        return (await this.deriveKeys(type, [derivationPath], mnemonicId, props))[0];
    }
    /**
     * Derive a set of keys of the given type using the given derivation paths and mnemonic.
     *
     * The owner of the derived keys will be the owner of the mnemonic.
     *
     * @param type Type of key to derive from the mnemonic.
     * @param derivationPaths Mnemonic derivation paths used to generate new key.
     * @param mnemonicId material_id of mnemonic key used to derive the new key.
     * @param props Additional properties for derivation.
     *
     * @returns newly derived keys.
     */
    async deriveKeys(type, derivationPaths, mnemonicId, props) {
        const keys = await __classPrivateFieldGet(this, _Org_apiClient, "f").keysDerive(type, derivationPaths, mnemonicId, props);
        return keys.map((k) => new _1.Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
    }
    /**
     * Use either a new or existing mnemonic to derive keys of one or more
     * specified types via specified derivation paths.
     *
     * @param keyTypesAndDerivationPaths A list of `KeyTypeAndDerivationPath` objects specifying the keys to be derived
     * @param props Additional options for derivation.
     *
     * @returns The newly derived keys.
     */
    async deriveMultipleKeyTypes(keyTypesAndDerivationPaths, props) {
        const keys = await __classPrivateFieldGet(this, _Org_apiClient, "f").keysDeriveMulti(keyTypesAndDerivationPaths, props);
        return keys.map((k) => new _1.Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
    }
    /**
     * Get a key by id.
     *
     * @param keyId The id of the key to get.
     * @returns The key.
     */
    async getKey(keyId) {
        const keyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").keyGet(keyId);
        return new _1.Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), keyInfo);
    }
    /**
     * Get a key by its material id (e.g., address).
     *
     * @param keyType The key type.
     * @param materialId The material id of the key to get.
     * @returns The key.
     */
    async getKeyByMaterialId(keyType, materialId) {
        const keyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").keyGetByMaterialId(keyType, materialId);
        return new _1.Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), keyInfo);
    }
    /**
     * Create a contact.
     *
     * @param name The name for the new contact.
     * @param addresses The addresses associated with the contact.
     * @param metadata Metadata associated with the contact. Intended for use as a description.
     * @param editPolicy The edit policy for the contact, determining when and who can edit this contact.
     * @returns The newly-created contact.
     */
    async createContact(name, addresses, metadata, editPolicy) {
        const contactInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").contactCreate(name, addresses, metadata, editPolicy);
        return new contact_1.Contact(__classPrivateFieldGet(this, _Org_apiClient, "f"), contactInfo);
    }
    /**
     * Get a contact by its id.
     *
     * @param contactId The id of the contact to get.
     * @returns The contact.
     */
    async getContact(contactId) {
        const contactInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").contactGet(contactId);
        return new contact_1.Contact(__classPrivateFieldGet(this, _Org_apiClient, "f"), contactInfo);
    }
    /**
     * Get all contacts in the organization.
     *
     * @returns All contacts.
     */
    async contacts() {
        const paginator = __classPrivateFieldGet(this, _Org_apiClient, "f").contactsList();
        const contacts = await paginator.fetch();
        return contacts.map((c) => new contact_1.Contact(__classPrivateFieldGet(this, _Org_apiClient, "f"), c));
    }
    /**
     * Obtain a proof of authentication.
     *
     * Same as {@link ApiClient.identityProve}, see its documentation for more information.
     *
     * @returns A function that resolves to an identity proof
     */
    get proveIdentity() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").identityProve.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Check if a given proof of OIDC authentication is valid.
     *
     * Same as {@link ApiClient.identityVerify}, see its documentation for more information.
     *
     * @returns A function that verifies a proof of identity, throwing if invalid
     */
    get verifyIdentity() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").identityVerify.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Get a pending MFA request by its id.
     *
     * @param mfaId MFA request ID
     * @returns The MFA request
     */
    getMfaRequest(mfaId) {
        return new _1.MfaRequest(__classPrivateFieldGet(this, _Org_apiClient, "f"), mfaId);
    }
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @returns The MFA requests.
     */
    async mfaRequests() {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f")
            .mfaList()
            .then((mfaInfos) => mfaInfos.map((mfaInfo) => new _1.MfaRequest(__classPrivateFieldGet(this, _Org_apiClient, "f"), mfaInfo)));
    }
    /**
     * Sign an Eth2/Beacon-chain deposit (or staking) message.
     *
     * Same as {@link ApiClient.signStake}, see its documentation for more information.
     *
     * @returns A function that resolves to a stake response.
     */
    get stake() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").signStake.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Create new user session (management and/or signing). The lifetime of
     * the new session is silently truncated to that of the current session.
     *
     * Same as {@link ApiClient.sessionCreate}, see its documentation for more information.
     *
     * @returns A function that resolves to new signer session info.
     */
    get createSession() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").sessionCreate.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Create new user session (management and/or signing) whose lifetime potentially
     * extends the lifetime of the current session.  MFA is always required.
     *
     * Same as {@link ApiClient.sessionCreateExtended}, see its documentation for more information.
     *
     * @returns A function that resolves to new signer session info.
     */
    get createExtendedSession() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").sessionCreateExtended.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Revoke a session.
     *
     * Same as {@link ApiClient.sessionRevoke}, see its documentation for more info.
     *
     * @returns A function that revokes a session
     */
    get revokeSession() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").sessionRevoke.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Send a heartbeat / upcheck request.
     *
     * Same as {@link ApiClient.heartbeat}, see its documentation for more info.
     *
     * @returns A function that sends a heartbeat
     */
    get heartbeat() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").heartbeat.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * List outstanding user-export requests.
     *
     * Same as {@link ApiClient.userExportList}, see its documentation for more info.
     *
     * @returns A function that resolves to a paginator of user-export requests
     */
    get exports() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").userExportList.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Delete an outstanding user-export request.
     *
     * Same as {@link ApiClient.userExportDelete}, see its documentation for more info.
     *
     * @returns A function that deletes a user-export request
     */
    get deleteExport() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").userExportDelete.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Initiate a user-export request.
     *
     * Same as {@link ApiClient.userExportInit}, see its documentation for more info.
     *
     * @returns A function that resolves to the request response.
     */
    get initExport() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").userExportInit.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Complete a user-export request.
     *
     * Same as {@link ApiClient.userExportComplete}, see its documentation for more info.
     *
     * @returns A function that resolves to the request response.
     */
    get completeExport() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").userExportComplete.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Update the org.
     *
     * Same as {@link ApiClient.orgUpdate}, see its documentation for more info.
     *
     * @returns A function that updates an org and returns updated org information
     */
    get update() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUpdate.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Request a fresh key-import key.
     *
     * Same as {@link ApiClient.createKeyImportKey}, see its documentation for more info.
     *
     * @returns A function that resolves to a fresh key-import key
     */
    get createKeyImportKey() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").createKeyImportKey.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Import one or more keys. To use this functionality, you must first create an
     * encrypted key-import request using the `@cubist-labs/cubesigner-sdk-key-import`
     * library. See that library's documentation for more info.
     *
     * @param body An encrypted key-import request.
     * @returns The newly imported keys.
     */
    async importKeys(body) {
        const keys = await __classPrivateFieldGet(this, _Org_apiClient, "f").importKeys(body);
        return keys.map((k) => new _1.Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
    }
}
exports.Org = Org;
_Org_apiClient = new WeakMap(), _Org_orgId = new WeakMap(), _Org_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFvQkEsd0JBQTBDO0FBQzFDLHVDQUFvQztBQXVJcEM7Ozs7R0FJRztBQUNILE1BQWEsR0FBRztJQU1kOzs7T0FHRztJQUNILElBQUksRUFBRTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxrQkFBTyxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksaUJBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLFNBQW9CLEVBQUUsS0FBYTtRQTNCdEMsaUNBQXNCO1FBQy9CLDZCQUFjO1FBQ2QsMEJBQTBCO1FBQzFCLDRCQUFnQjtRQXlCZCx1QkFBQSxJQUFJLGNBQVUsS0FBSyxNQUFBLENBQUM7UUFDcEIsdUJBQUEsSUFBSSxrQkFBYyxLQUFLLEtBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFBLENBQUM7SUFDM0YsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLGFBQXdDO1FBQ3RELE1BQU0sR0FBRyxHQUFHLE9BQU8sYUFBYSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztRQUN4RixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0RBQStELENBQUMsQ0FBQztRQUNuRixDQUFDO1FBQ0QsT0FBTyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxZQUFZLENBQUMsR0FBRyxD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a0I7UUFDcEIsT0FBTyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFzQjtRQUNyQyxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLE1BQUcsQ0FBQyx1QkFBQSxJQUFJLHNCQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0NBQ0Y7QUF4bkJELGtCQXduQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEtleVR5cGUsXG4gIEtleVByb3BlcnRpZXMsXG4gIE5vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbixcbiAgUGFnZU9wdHMsXG4gIFVzZXJJbk9yZ0luZm8sXG4gIEFwaUNsaWVudCxcbiAgT3JnSW5mbyxcbiAgTWZhSWQsXG4gIEltcG9ydEtleVJlcXVlc3QsXG4gIEtleVBvbGljeSxcbiAgUXVlcnlNZXRyaWNzUmVzcG9uc2UsXG4gIE9yZ01ldHJpY05hbWUsXG4gIFF1ZXJ5TWV0cmljc1JlcXVlc3QsXG4gIEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aCxcbiAgSnNvblZhbHVlLFxuICBFZGl0UG9saWN5LFxuICBBZGRyZXNzTWFwLFxuICBDcmVhdGVPcmdSZXF1ZXN0LFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgS2V5LCBNZmFSZXF1ZXN0LCBSb2xlIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IENvbnRhY3QgfSBmcm9tIFwiLi9jb250YWN0XCI7XG5cbi8qKiBPcHRpb25zIHBhc2VkIHRvIGNyZWF0ZUtleSBhbmQgZGVyaXZlS2V5ICovXG5leHBvcnQgdHlwZSBDcmVhdGVLZXlQcm9wZXJ0aWVzID0gT21pdDxLZXlQcm9wZXJ0aWVzLCBcInBvbGljeVwiPiAmIHtcbiAgLyoqXG4gICAqIFBvbGljaWVzIHRvIGFwcGx5IHRvIHRoZSBuZXcga2V5LlxuICAgKlxuICAgKiBUaGlzIHR5cGUgbWFrZXMgaXQgcG9zc2libGUgdG8gYXNzaWduIHZhbHVlcyBsaWtlXG4gICAqIGBbQWxsb3dFaXAxOTFTaWduaW5nUG9saWN5XWAsIGJ1dCByZW1haW5zIGJhY2t3YXJkc1xuICAgKiBjb21wYXRpYmxlIHdpdGggcHJpb3IgdmVyc2lvbnMgb2YgdGhlIFNESywgaW4gd2hpY2hcbiAgICogdGhpcyBwcm9wZXJ0eSBoYWQgdHlwZSBgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfCBudWxsYC5cbiAgICovXG4gIHBvbGljeT86IEtleVBvbGljeSB8IHVua25vd25bXSB8IG51bGw7XG59O1xuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gaW1wb3J0S2V5IGFuZCBkZXJpdmVLZXkgKi9cbmV4cG9ydCB0eXBlIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMgPSBDcmVhdGVLZXlQcm9wZXJ0aWVzICYge1xuICAvKipcbiAgICogV2hlbiB0cnVlLCByZXR1cm5zIGEgJ0tleScgb2JqZWN0IGZvciBib3RoIG5ldyBhbmQgZXhpc3Rpbmcga2V5cy5cbiAgICovXG4gIGlkZW1wb3RlbnQ/OiBib29sZWFuO1xufTtcblxuLyoqIE9wdGlvbnMgcGFzc2VkIHRvIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMgKi9cbmV4cG9ydCB0eXBlIERlcml2ZU11bHRpcGxlS2V5VHlwZXNQcm9wZXJ0aWVzID0gSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyAmIHtcbiAgLyoqXG4gICAqIFRoZSBtYXRlcmlhbF9pZCBvZiB0aGUgbW5lbW9uaWMgdXNlZCB0byBkZXJpdmUgbmV3IGtleXMuXG4gICAqXG4gICAqIElmIHRoaXMgYXJndW1lbnQgaXMgdW5kZWZpbmVkIG9yIG51bGwsIGEgbmV3IG1uZW1vbmljIGlzIGZpcnN0IGNyZWF0ZWRcbiAgICogYW5kIGFueSBvdGhlciBzcGVjaWZpZWQgcHJvcGVydGllcyBhcmUgYXBwbGllZCB0byBpdCAoaW4gYWRkaXRpb24gdG9cbiAgICogYmVpbmcgYXBwbGllZCB0byB0aGUgc3BlY2lmaWVkIGtleXMpLlxuICAgKlxuICAgKiBUaGUgbmV3bHkgY3JlYXRlZCBtbmVtb25pYy1pZCBjYW4gYmUgcmV0cmlldmVkIGZyb20gdGhlIGBkZXJpdmF0aW9uX2luZm9gXG4gICAqIHByb3BlcnR5IG9mIHRoZSBgS2V5SW5mb2AgdmFsdWUgZm9yIGEgcmVzdWx0aW5nIGtleS5cbiAgICovXG4gIG1uZW1vbmljX2lkPzogc3RyaW5nO1xufTtcblxuLyoqIE9yZ2FuaXphdGlvbiBpZCAqL1xuZXhwb3J0IHR5cGUgT3JnSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmctd2lkZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIE9yZ1BvbGljeSA9XG4gIHwgU291cmNlSXBBbGxvd2xpc3RQb2xpY3lcbiAgfCBPaWRjQXV0aFNvdXJjZXNQb2xpY3lcbiAgfCBPcmlnaW5BbGxvd2xpc3RQb2xpY3lcbiAgfCBNYXhEYWlseVVuc3Rha2VQb2xpY3lcbiAgfCBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzUG9saWN5XG4gIHwgRXhjbHVzaXZlS2V5QWNjZXNzUG9saWN5O1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gZW5mb3JjZSBleGNsdXNpdmUgYWNjZXNzIHRvIGtleXMuICBDb25jcmV0ZWx5LFxuICogLSBpZiBcIkxpbWl0VG9LZXlPd25lclwiIGlzIHNldCwgb25seSBrZXkgb3duZXJzIGFyZSBwZXJtaXR0ZWQgdG8gYWNjZXNzXG4gKiAgIHRoZWlyIGtleXMgZm9yIHNpZ25pbmc6IGEgdXNlciBzZXNzaW9uIChub3QgYSByb2xlIHNlc3Npb24pIGlzIHJlcXVpcmVkXG4gKiAgIGZvciBzaWduaW5nLCBhbmQgYWRkaW5nIGEga2V5IHRvIGEgcm9sZSBpcyBub3QgcGVybWl0dGVkLlxuICogLSBpZiBcIkxpbWl0VG9TaW5nbGVSb2xlXCIgaXMgc2V0LCBlYWNoIGtleSBpcyBwZXJtaXR0ZWQgdG8gYmUgaW4gYXQgbW9zdFxuICogICBvbmUgcm9sZSwgYW5kIHNpZ25pbmcgaXMgb25seSBhbGxvd2VkIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYSByb2xlIHNlc3Npb24gdG9rZW4uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXhjbHVzaXZlS2V5QWNjZXNzUG9saWN5IHtcbiAgRXhjbHVzaXZlS2V5QWNjZXNzOiBcIkxpbWl0VG9LZXlPd25lclwiIHwgXCJMaW1pdFRvU2luZ2xlUm9sZVwiO1xufVxuXG4vKipcbiAqIFRoZSBzZXQgb2YgcmVseWluZyBwYXJ0aWVzIHRvIGFsbG93IGZvciB3ZWJhdXRobiByZWdpc3RyYXRpb25cbiAqIFRoZXNlIGNvcnJlc3BvbmQgdG8gZG9tYWlucyBmcm9tIHdoaWNoIGJyb3dzZXJzIGNhbiBzdWNjZXNzZnVsbHkgY3JlYXRlIGNyZWRlbnRpYWxzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdlYkF1dGhuUmVseWluZ1BhcnRpZXNQb2xpY3kge1xuICBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzOiB7IGlkPzogc3RyaW5nOyBuYW1lOiBzdHJpbmcgfVtdO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGFuIGFsbG93bGlzdCBvZiBPSURDIElzc3VlcnMgYW5kIGF1ZGllbmNlcyB0aGF0IGFyZSBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSBpbnRvIHRoaXMgb3JnLlxuICpcbiAqIEBleGFtcGxlIHtcIk9pZGNBdXRoU291cmNlc1wiOiB7IFwiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tXCI6IFsgXCIxMjM0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXCIgXX19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY0F1dGhTb3VyY2VzUG9saWN5IHtcbiAgT2lkY0F1dGhTb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXSB8IElzc3VlckNvbmZpZz47XG59XG5cbi8qKiBPSURDIGlzc3VlciBjb25maWd1cmF0aW9uICovXG5leHBvcnQgaW50ZXJmYWNlIElzc3VlckNvbmZpZyB7XG4gIC8qKiBUaGUgc2V0IG9mIGF1ZGllbmNlcyBzdXBwb3J0ZWQgZm9yIHRoaXMgaXNzdWVyICovXG4gIGF1ZHM6IHN0cmluZ1tdO1xuXG4gIC8qKiBUaGUga2luZHMgb2YgdXNlciBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoaXMgaXNzdWVyICovXG4gIHVzZXJzOiBzdHJpbmdbXTtcblxuICAvKiogT3B0aW9uYWwgbmlja25hbWUgZm9yIHRoaXMgcHJvdmlkZXIgKi9cbiAgbmlja25hbWU/OiBzdHJpbmc7XG5cbiAgLyoqIFdoZXRoZXIgdG8gbWFrZSB0aGlzIGlzc3VlciBwdWJsaWMgKi9cbiAgcHVibGljPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBPbmx5IGFsbG93IHJlcXVlc3RzIGZyb20gdGhlIHNwZWNpZmllZCBvcmlnaW5zLlxuICpcbiAqIEBleGFtcGxlIHtcIk9yaWdpbkFsbG93bGlzdFwiOiBcIipcIn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmlnaW5BbGxvd2xpc3RQb2xpY3kge1xuICBPcmlnaW5BbGxvd2xpc3Q6IHN0cmluZ1tdIHwgXCIqXCI7XG59XG5cbi8qKlxuICogUmVzdHJpY3Qgc2lnbmluZyB0byBzcGVjaWZpYyBzb3VyY2UgSVAgYWRkcmVzc2VzLlxuICpcbiAqIEBleGFtcGxlIHtcIlNvdXJjZUlwQWxsb3dsaXN0XCI6IFtcIjEwLjEuMi4zLzhcIiwgXCIxNjkuMjU0LjE3LjEvMTZcIl19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlSXBBbGxvd2xpc3RQb2xpY3kge1xuICBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW107XG59XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIG51bWJlciBvZiB1bnN0YWtlcyBwZXIgZGF5LlxuICpcbiAqIEBleGFtcGxlIHtcIk1heERhaWx5VW5zdGFrZVwiOiA1IH1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXhEYWlseVVuc3Rha2VQb2xpY3kge1xuICBNYXhEYWlseVVuc3Rha2U6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBGaWx0ZXIgdG8gdXNlIHdoZW4gbGlzdGluZyBrZXlzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5RmlsdGVyIHtcbiAgLyoqIEZpbHRlciBieSBrZXkgdHlwZSAqL1xuICB0eXBlPzogS2V5VHlwZTtcbiAgLyoqIEZpbHRlciBieSBrZXkgb3duZXIgKi9cbiAgb3duZXI/OiBzdHJpbmc7XG4gIC8qKiBTZWFyY2ggYnkga2V5J3MgbWF0ZXJpYWwgaWQgYW5kIG1ldGFkYXRhICovXG4gIHNlYXJjaD86IHN0cmluZztcbiAgLyoqIFBhZ2luYXRpb24gb3B0aW9ucyAqL1xuICBwYWdlPzogUGFnZU9wdHM7XG59XG5cbi8qKlxuICogQW4gb3JnYW5pemF0aW9uLlxuICpcbiAqIEV4dGVuZHMge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGFuZCBwcm92aWRlcyBhIGZldyBvcmctc3BlY2lmaWMgbWV0aG9kcyBvbiB0b3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBPcmcge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gICNvcmdJZDogT3JnSWQ7XG4gIC8qKiBUaGUgb3JnIGluZm9ybWF0aW9uICovXG4gICNkYXRhPzogT3JnSW5mbztcblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIG9yZyBpZFxuICAgKiBAZXhhbXBsZSBPcmcjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBnZXQgaWQoKTogT3JnSWQge1xuICAgIHJldHVybiB0aGlzLiNvcmdJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyBvcmcuIFRoZSBjYWNoZWQgcHJvcGVydGllcyByZWZsZWN0IHRoZVxuICAgKiBzdGF0ZSBvZiB0aGUgbGFzdCBmZXRjaCBvciB1cGRhdGUuXG4gICAqL1xuICBnZXQgY2FjaGVkKCk6IE9yZ0luZm8gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgb3JnSWQ6IHN0cmluZykge1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gb3JnSWQgPT09IGFwaUNsaWVudC5vcmdJZCA/IGFwaUNsaWVudCA6IGFwaUNsaWVudC53aXRoVGFyZ2V0T3JnKG9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgb3JnYW5pemF0aW9uLiBUaGUgbmV3IG9yZyBpcyBhIGNoaWxkIG9mIHRoZVxuICAgKiBjdXJyZW50IG9yZyBhbmQgaW5oZXJpdHMgaXRzIGtleS1leHBvcnQgcG9saWN5LiBUaGUgbmV3IG9yZ1xuICAgKiBpcyBjcmVhdGVkIHdpdGggb25lIG93bmVyLCB0aGUgY2FsbGVyIG9mIHRoaXMgQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZU9yUmVxdWVzdCBUaGUgbmFtZSBvZiB0aGUgbmV3IG9yZyBvciB0aGUgcHJvcGVydGllcyBvZiB0aGUgbmV3IG9yZy5cbiAgICogQHJldHVybnMgSW5mb3JtYXRpb24gYWJvdXQgdGhlIG5ld2x5IGNyZWF0ZWQgb3JnLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlT3JnKG5hbWVPclJlcXVlc3Q6IHN0cmluZyB8IENyZWF0ZU9yZ1JlcXVlc3QpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBjb25zdCByZXEgPSB0eXBlb2YgbmFtZU9yUmVxdWVzdCA9PT0gXCJzdHJpbmdcIiA/IHsgbmFtZTogbmFtZU9yUmVxdWVzdCB9IDogbmFtZU9yUmVxdWVzdDtcbiAgICBpZiAoIS9eW2EtekEtWjAtOV9dezMsMzB9JC8udGVzdChyZXEubmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9yZyBuYW1lIG11c3QgYmUgYWxwaGFudW1lcmljIGFuZCBiZXR3ZWVuIDMgYW5kIDMwIGNoYXJhY3RlcnNcIik7XG4gICAgfVxuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnQ3JlYXRlT3JnKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogUXVlcnkgb3JnIG1ldHJpY3MuXG4gICAqXG4gICAqIEBwYXJhbSBtZXRyaWNOYW1lIFRoZSBtZXRyaWMgbmFtZS5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgc3RhcnQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guXG4gICAqIEBwYXJhbSBvcHQgT3RoZXIgb3B0aW9uYWwgYXJndW1lbnRzXG4gICAqIEBwYXJhbSBvcHQuZW5kX3RpbWUgVGhlIGVuZCBkYXRlIGluIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC4gSWYgb21pdHRlZCwgZGVmYXVsdHMgdG8gJ25vdycuXG4gICAqIEBwYXJhbSBvcHQucGVyaW9kIFRoZSBncmFudWxhcml0eSwgaW4gc2Vjb25kcywgb2YgdGhlIHJldHVybmVkIGRhdGEgcG9pbnRzLlxuICAgKiAgIFRoaXMgdmFsdWUgaXMgYXV0b21hdGljYWxseSByb3VuZGVkIHVwIHRvIGEgbXVsdGlwbGUgb2YgMzYwMCAoaS5lLiwgMSBob3VyKS5cbiAgICogICBJZiBvbWl0dGVkLCBkZWZhdWx0cyB0byB0aGUgZHVyYXRpb24gYmV0d2VlbiB0aGUgc3RhcnQgYW5kIHRoZSBlbmQgZGF0ZS5cbiAgICogICBNdXN0IGJlIG5vIGxlc3MgdGhhbiAxIGhvdXIsIGkuZS4sIDM2MDAgc2Vjb25kcy4gQWRkaXRpb25hbGx5LCB0aGlzIHBlcmlvZCBtdXN0IG5vdFxuICAgKiAgIGRpdmlkZSB0aGUgYGVuZFRpbWUgLSBzdGFydFRpbWVgIHBlcmlvZCBpbnRvIG1vcmUgdGhhbiAxMDAgZGF0YSBwb2ludHMuXG4gICAqIEBwYXJhbSBwYWdlT3B0cyBQYWdpbmF0aW9uIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIE1ldHJpYyB2YWx1ZXMgKGRhdGEgcG9pbnRzKSBmb3IgdGhlIHJlcXVlc3RlZCBwZXJpb2RzLlxuICAgKi9cbiAgYXN5bmMgcXVlcnlNZXRyaWNzKFxuICAgIG1ldHJpY05hbWU6IE9yZ01ldHJpY05hbWUsXG4gICAgc3RhcnRUaW1lOiBFcG9jaFRpbWVTdGFtcCxcbiAgICBvcHQ/OiBPbWl0PFF1ZXJ5TWV0cmljc1JlcXVlc3QsIFwibWV0cmljX25hbWVcIiB8IFwic3RhcnRfdGltZVwiPixcbiAgICBwYWdlT3B0cz86IFBhZ2VPcHRzLFxuICApOiBQcm9taXNlPFF1ZXJ5TWV0cmljc1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVxOiBRdWVyeU1ldHJpY3NSZXF1ZXN0ID0ge1xuICAgICAgbWV0cmljX25hbWU6IG1ldHJpY05hbWUsXG4gICAgICBzdGFydF90aW1lOiBzdGFydFRpbWUsXG4gICAgICAuLi5vcHQsXG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1F1ZXJ5TWV0cmljcyhyZXEsIHBhZ2VPcHRzKS5mZXRjaEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBvcmcgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBvcmcgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBmZXRjaCgpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ0dldCgpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5ldyBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnIChtdXN0IGJlIGFscGhhbnVtZXJpYykuXG4gICAqIEBleGFtcGxlIG15X29yZ19uYW1lXG4gICAqL1xuICBhc3luYyBzZXROYW1lKG5hbWU6IHN0cmluZykge1xuICAgIGlmICghL15bYS16QS1aMC05X117MywzMH0kLy50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlKHsgbmFtZSB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBvcmcgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgcG9saWN5IGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxPcmdQb2xpY3lbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IE9yZ1BvbGljeVtdKSB7XG4gICAgY29uc3QgcCA9IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgbm90aWZpY2F0aW9uIGVuZHBvaW50cyBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG5vdGlmaWNhdGlvbl9lbmRwb2ludHMgRW5kcG9pbnRzLlxuICAgKi9cbiAgYXN5bmMgc2V0Tm90aWZpY2F0aW9uRW5kcG9pbnRzKG5vdGlmaWNhdGlvbl9lbmRwb2ludHM6IE5vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbltdKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoe1xuICAgICAgbm90aWZpY2F0aW9uX2VuZHBvaW50cyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmluZyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5LiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgdG8gc2V0IG9uIHRoZSBuZXcga2V5LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXkodHlwZTogS2V5VHlwZSwgb3duZXJJZD86IHN0cmluZywgcHJvcHM/OiBDcmVhdGVLZXlQcm9wZXJ0aWVzKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNDcmVhdGUodHlwZSwgMSwgb3duZXJJZCwgcHJvcHMpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5c1swXSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBjb3VudCBUaGUgbnVtYmVyIG9mIGtleXMgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyB0byBzZXQgb24gdGhlIG5ldyBrZXlzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBvd25lcklkPzogc3RyaW5nLFxuICAgIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0NyZWF0ZSh0eXBlLCBjb3VudCwgb3duZXJJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmRzIGFuIGludml0YXRpb24gdG8gdGhhdCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckludml0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGludml0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgY3JlYXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJJbnZpdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgZGVsZXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyQ3JlYXRlT2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgYW4gT0lEQyB1c2VyLCByZXNvbHZpbmcgdG8gdGhlIG5ldyB1c2VyJ3MgSURcbiAgICovXG4gIGdldCBjcmVhdGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJDcmVhdGVPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGFuIE9JREMgdXNlclxuICAgKi9cbiAgZ2V0IGRlbGV0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGMuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHVzZXJzXG4gICAqL1xuICBhc3luYyB1c2VycygpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm9bXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXNlcnNMaXN0KCkuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24gKHBhZ2luYXRlZCkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2Vyc0xpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcGFnaW5hdGVkIGxpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGdldCB1c2Vyc1BhZ2luYXRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyR2V0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgYSB1c2VyIGluIHRoaXMgb3JnXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byBlbmFibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGVuYWJsZVVzZXIodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKHVzZXJJZCwgeyBkaXNhYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSBhIHVzZXIgaW4gdGhpcyBvcmdcbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIGRpc2FibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGRpc2FibGVVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCh1c2VySWQsIHsgZGlzYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBhY2Nlc3NpYmxlIGtleXMgaW4gdGhlIG9yZ2FuaXphdGlvblxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHMgT3B0aW9uYWwgZmlsdGVyaW5nIHByb3BlcnRpZXMuXG4gICAqIEByZXR1cm5zIFRoZSBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwcm9wcz86IEtleUZpbHRlcik6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLiNhcGlDbGllbnQua2V5c0xpc3QoXG4gICAgICBwcm9wcz8udHlwZSxcbiAgICAgIHByb3BzPy5wYWdlLFxuICAgICAgcHJvcHM/Lm93bmVyLFxuICAgICAgcHJvcHM/LnNlYXJjaCxcbiAgICApO1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBwYWdpbmF0b3IuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyBjcmVhdGVSb2xlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSWQgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUNyZWF0ZShuYW1lKTtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJvbGUgYnkgaWQgb3IgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgZ2V0Um9sZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdGhlIHJvbGVzIGluIHRoZSBvcmdcbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIHBhZ2luYXRvciBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSByb2xlc1xuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZTogUGFnZU9wdHMpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiByb2xlcy5tYXAoKHIpID0+IG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIGtleSBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRoIGFuZCBtbmVtb25pYy5cbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRoIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aCB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgbmV3bHkgZGVyaXZlZCBrZXkgb3IgdW5kZWZpbmVkIGlmIGl0IGFscmVhZHkgZXhpc3RzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5KFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGg6IHN0cmluZyxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleSB8IHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5kZXJpdmVLZXlzKHR5cGUsIFtkZXJpdmF0aW9uUGF0aF0sIG1uZW1vbmljSWQsIHByb3BzKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aHMgYW5kIG1uZW1vbmljLlxuICAgKlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5cyB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRocyBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGhzIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzRGVyaXZlKHR5cGUsIGRlcml2YXRpb25QYXRocywgbW5lbW9uaWNJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgZWl0aGVyIGEgbmV3IG9yIGV4aXN0aW5nIG1uZW1vbmljIHRvIGRlcml2ZSBrZXlzIG9mIG9uZSBvciBtb3JlXG4gICAqIHNwZWNpZmllZCB0eXBlcyB2aWEgc3BlY2lmaWVkIGRlcml2YXRpb24gcGF0aHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyBBIGxpc3Qgb2YgYEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aGAgb2JqZWN0cyBzcGVjaWZ5aW5nIHRoZSBrZXlzIHRvIGJlIGRlcml2ZWRcbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMoXG4gICAga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHM6IEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aFtdLFxuICAgIHByb3BzPzogRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNEZXJpdmVNdWx0aShrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocywgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXQoa2V5SWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyBtYXRlcmlhbCBpZCAoZS5nLiwgYWRkcmVzcykuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSBrZXkgdHlwZS5cbiAgICogQHBhcmFtIG1hdGVyaWFsSWQgVGhlIG1hdGVyaWFsIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5QnlNYXRlcmlhbElkKGtleVR5cGU6IEtleVR5cGUsIG1hdGVyaWFsSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXRCeU1hdGVyaWFsSWQoa2V5VHlwZSwgbWF0ZXJpYWxJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBjb250YWN0LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBmb3IgdGhlIG5ldyBjb250YWN0LlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKiBAcGFyYW0gbWV0YWRhdGEgTWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LiBJbnRlbmRlZCBmb3IgdXNlIGFzIGEgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QsIGRldGVybWluaW5nIHdoZW4gYW5kIHdobyBjYW4gZWRpdCB0aGlzIGNvbnRhY3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseS1jcmVhdGVkIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDb250YWN0KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhZGRyZXNzZXM/OiBBZGRyZXNzTWFwLFxuICAgIG1ldGFkYXRhPzogSnNvblZhbHVlLFxuICAgIGVkaXRQb2xpY3k/OiBFZGl0UG9saWN5LFxuICApOiBQcm9taXNlPENvbnRhY3Q+IHtcbiAgICBjb25zdCBjb250YWN0SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0Q3JlYXRlKG5hbWUsIGFkZHJlc3NlcywgbWV0YWRhdGEsIGVkaXRQb2xpY3kpO1xuXG4gICAgcmV0dXJuIG5ldyBDb250YWN0KHRoaXMuI2FwaUNsaWVudCwgY29udGFjdEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGNvbnRhY3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0gY29udGFjdElkIFRoZSBpZCBvZiB0aGUgY29udGFjdCB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBjb250YWN0LlxuICAgKi9cbiAgYXN5bmMgZ2V0Q29udGFjdChjb250YWN0SWQ6IHN0cmluZyk6IFByb21pc2U8Q29udGFjdD4ge1xuICAgIGNvbnN0IGNvbnRhY3RJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RHZXQoY29udGFjdElkKTtcblxuICAgIHJldHVybiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGNvbnRhY3RJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGNvbnRhY3RzIGluIHRoZSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEFsbCBjb250YWN0cy5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RzKCk6IFByb21pc2U8Q29udGFjdFtdPiB7XG4gICAgY29uc3QgcGFnaW5hdG9yID0gdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RzTGlzdCgpO1xuICAgIGNvbnN0IGNvbnRhY3RzID0gYXdhaXQgcGFnaW5hdG9yLmZldGNoKCk7XG5cbiAgICByZXR1cm4gY29udGFjdHMubWFwKChjKSA9PiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmlkZW50aXR5UHJvdmV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhbiBpZGVudGl0eSBwcm9vZlxuICAgKi9cbiAgZ2V0IHByb3ZlSWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5pZGVudGl0eVByb3ZlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIGdpdmVuIHByb29mIG9mIE9JREMgYXV0aGVudGljYXRpb24gaXMgdmFsaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pZGVudGl0eVZlcmlmeX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHZlcmlmaWVzIGEgcHJvb2Ygb2YgaWRlbnRpdHksIHRocm93aW5nIGlmIGludmFsaWRcbiAgICovXG4gIGdldCB2ZXJpZnlJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmlkZW50aXR5VmVyaWZ5LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgZ2V0TWZhUmVxdWVzdChtZmFJZDogTWZhSWQpOiBNZmFSZXF1ZXN0IHtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBtZmFJZCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFSZXF1ZXN0cygpOiBQcm9taXNlPE1mYVJlcXVlc3RbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnRcbiAgICAgIC5tZmFMaXN0KClcbiAgICAgIC50aGVuKChtZmFJbmZvcykgPT4gbWZhSW5mb3MubWFwKChtZmFJbmZvKSA9PiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIG1mYUluZm8pKSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiBkZXBvc2l0IChvciBzdGFraW5nKSBtZXNzYWdlLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2lnblN0YWtlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdGFrZSByZXNwb25zZS5cbiAgICovXG4gIGdldCBzdGFrZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNpZ25TdGFrZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpLiBUaGUgbGlmZXRpbWUgb2ZcbiAgICogdGhlIG5ldyBzZXNzaW9uIGlzIHNpbGVudGx5IHRydW5jYXRlZCB0byB0aGF0IG9mIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uQ3JlYXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gbmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBnZXQgY3JlYXRlU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKSB3aG9zZSBsaWZldGltZSBwb3RlbnRpYWxseVxuICAgKiBleHRlbmRzIHRoZSBsaWZldGltZSBvZiB0aGUgY3VycmVudCBzZXNzaW9uLiAgTUZBIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25DcmVhdGVFeHRlbmRlZH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIG5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgZ2V0IGNyZWF0ZUV4dGVuZGVkU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGVFeHRlbmRlZC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGEgc2Vzc2lvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25SZXZva2V9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldm9rZXMgYSBzZXNzaW9uXG4gICAqL1xuICBnZXQgcmV2b2tlU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25SZXZva2UuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBoZWFydGJlYXQgLyB1cGNoZWNrIHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5oZWFydGJlYXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHNlbmRzIGEgaGVhcnRiZWF0XG4gICAqL1xuICBnZXQgaGVhcnRiZWF0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaGVhcnRiZWF0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3RzLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydExpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgcGFnaW5hdG9yIG9mIHVzZXItZXhwb3J0IHJlcXVlc3RzXG4gICAqL1xuICBnZXQgZXhwb3J0cygpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRMaXN0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnREZWxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyLWV4cG9ydCByZXF1ZXN0XG4gICAqL1xuICBnZXQgZGVsZXRlRXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydERlbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydEluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXF1ZXN0IHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IGluaXRFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0SW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydENvbXBsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgcmVxdWVzdCByZXNwb25zZS5cbiAgICovXG4gIGdldCBjb21wbGV0ZUV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRDb21wbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVcGRhdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgYW4gb3JnIGFuZCByZXR1cm5zIHVwZGF0ZWQgb3JnIGluZm9ybWF0aW9uXG4gICAqL1xuICBnZXQgdXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IGEgZnJlc2gga2V5LWltcG9ydCBrZXkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5jcmVhdGVLZXlJbXBvcnRLZXl9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgZnJlc2gga2V5LWltcG9ydCBrZXlcbiAgICovXG4gIGdldCBjcmVhdGVLZXlJbXBvcnRLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5jcmVhdGVLZXlJbXBvcnRLZXkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydCBvbmUgb3IgbW9yZSBrZXlzLiBUbyB1c2UgdGhpcyBmdW5jdGlvbmFsaXR5LCB5b3UgbXVzdCBmaXJzdCBjcmVhdGUgYW5cbiAgICogZW5jcnlwdGVkIGtleS1pbXBvcnQgcmVxdWVzdCB1c2luZyB0aGUgYEBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrLWtleS1pbXBvcnRgXG4gICAqIGxpYnJhcnkuIFNlZSB0aGF0IGxpYnJhcnkncyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IEFuIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBpbXBvcnRlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5cyhib2R5OiBJbXBvcnRLZXlSZXF1ZXN0KTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuaW1wb3J0S2V5cyhib2R5KTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cbn1cbiJdfQ==