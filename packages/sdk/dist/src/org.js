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
const contact_1 = require("./contact");
const _1 = require(".");
const policy_1 = require("./policy");
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
     * Create a new named policy.
     *
     * @param name The name of the policy.
     * @param type The type of the policy.
     * @param rules The policy rules.
     * @returns The new policy.
     */
    async createPolicy(name, type, rules) {
        const policyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").policyCreate(name, type, rules);
        const policy = policy_1.NamedPolicy.fromInfo(__classPrivateFieldGet(this, _Org_apiClient, "f"), policyInfo);
        return policy;
    }
    /**
     * Get a named policy by id or name.
     *
     * @param policyId The id or name of the policy to get.
     * @returns The policy.
     */
    async getPolicy(policyId) {
        const policyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").policyGet(policyId, "latest");
        return policy_1.NamedPolicy.fromInfo(__classPrivateFieldGet(this, _Org_apiClient, "f"), policyInfo);
    }
    /**
     * Gets all the named policies in the org.
     *
     * @param page The paginator options.
     * @returns The policies.
     */
    async policies(page) {
        const policies = await __classPrivateFieldGet(this, _Org_apiClient, "f").policiesList(page).fetch();
        return policies.map((p) => policy_1.NamedPolicy.fromInfo(__classPrivateFieldGet(this, _Org_apiClient, "f"), p));
    }
    /**
     * Create a new Wasm policy.
     *
     * @param name The name of the policy.
     * @param policy The Wasm policy object.
     * @returns The new policy.
     */
    async createWasmPolicy(name, policy) {
        const hash = await (0, policy_1.uploadWasmPolicy)(__classPrivateFieldGet(this, _Org_apiClient, "f"), policy);
        const policyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").policyCreate(name, "Wasm", [
            {
                hash,
            },
        ]);
        return new policy_1.NamedWasmPolicy(__classPrivateFieldGet(this, _Org_apiClient, "f"), policyInfo);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFxQkEsdUNBQW9DO0FBQ3BDLHdCQUEwQztBQUMxQyxxQ0FPa0I7QUF1SWxCOzs7O0dBSUc7QUFDSCxNQUFhLEdBQUc7SUFNZDs7O09BR0c7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksa0JBQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLGlCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLEtBQWE7UUEzQnRDLGlDQUFzQjtRQUMvQiw2QkFBYztRQUNkLDBCQUEwQjtRQUMxQiw0QkFBZ0I7UUF5QmQsdUJBQUEsSUFBSSxjQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUksa0JBQWMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQzNGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxhQUF3QztRQUN0RCxNQUFNLEdBQUcsR0FBRyxPQUFPLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7UUFDeEYsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMzQyxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsWUFB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QUksQ0FBQyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBc0I7UUFDckMsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxNQUFHLENBQUMsdUJBQUEsSUFBSSxzQkFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztDQUNGO0FBcHFCRCxrQkFvcUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBLZXlUeXBlLFxuICBLZXlQcm9wZXJ0aWVzLFxuICBOb3RpZmljYXRpb25FbmRwb2ludENvbmZpZ3VyYXRpb24sXG4gIFBhZ2VPcHRzLFxuICBVc2VySW5PcmdJbmZvLFxuICBBcGlDbGllbnQsXG4gIE9yZ0luZm8sXG4gIE1mYUlkLFxuICBJbXBvcnRLZXlSZXF1ZXN0LFxuICBLZXlQb2xpY3ksXG4gIFF1ZXJ5TWV0cmljc1Jlc3BvbnNlLFxuICBPcmdNZXRyaWNOYW1lLFxuICBRdWVyeU1ldHJpY3NSZXF1ZXN0LFxuICBLZXlUeXBlQW5kRGVyaXZhdGlvblBhdGgsXG4gIEpzb25WYWx1ZSxcbiAgRWRpdFBvbGljeSxcbiAgQWRkcmVzc01hcCxcbiAgQ3JlYXRlT3JnUmVxdWVzdCxcbiAgUm9sZVBvbGljeSxcbn0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IENvbnRhY3QgfSBmcm9tIFwiLi9jb250YWN0XCI7XG5pbXBvcnQgeyBLZXksIE1mYVJlcXVlc3QsIFJvbGUgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHtcbiAgdHlwZSBOYW1lZEtleVBvbGljeSxcbiAgTmFtZWRQb2xpY3ksXG4gIHR5cGUgTmFtZWRSb2xlUG9saWN5LFxuICBOYW1lZFdhc21Qb2xpY3ksXG4gIHVwbG9hZFdhc21Qb2xpY3ksXG4gIHR5cGUgV2FzbVBvbGljeUluZm8sXG59IGZyb20gXCIuL3BvbGljeVwiO1xuXG4vKiogT3B0aW9ucyBwYXNlZCB0byBjcmVhdGVLZXkgYW5kIGRlcml2ZUtleSAqL1xuZXhwb3J0IHR5cGUgQ3JlYXRlS2V5UHJvcGVydGllcyA9IE9taXQ8S2V5UHJvcGVydGllcywgXCJwb2xpY3lcIj4gJiB7XG4gIC8qKlxuICAgKiBQb2xpY2llcyB0byBhcHBseSB0byB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogVGhpcyB0eXBlIG1ha2VzIGl0IHBvc3NpYmxlIHRvIGFzc2lnbiB2YWx1ZXMgbGlrZVxuICAgKiBgW0FsbG93RWlwMTkxU2lnbmluZ1BvbGljeV1gLCBidXQgcmVtYWlucyBiYWNrd2FyZHNcbiAgICogY29tcGF0aWJsZSB3aXRoIHByaW9yIHZlcnNpb25zIG9mIHRoZSBTREssIGluIHdoaWNoXG4gICAqIHRoaXMgcHJvcGVydHkgaGFkIHR5cGUgYFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIHwgbnVsbGAuXG4gICAqL1xuICBwb2xpY3k/OiBLZXlQb2xpY3kgfCB1bmtub3duW10gfCBudWxsO1xufTtcblxuLyoqIE9wdGlvbnMgcGFzc2VkIHRvIGltcG9ydEtleSBhbmQgZGVyaXZlS2V5ICovXG5leHBvcnQgdHlwZSBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzID0gQ3JlYXRlS2V5UHJvcGVydGllcyAmIHtcbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgcmV0dXJucyBhICdLZXknIG9iamVjdCBmb3IgYm90aCBuZXcgYW5kIGV4aXN0aW5nIGtleXMuXG4gICAqL1xuICBpZGVtcG90ZW50PzogYm9vbGVhbjtcbn07XG5cbi8qKiBPcHRpb25zIHBhc3NlZCB0byBkZXJpdmVNdWx0aXBsZUtleVR5cGVzICovXG5leHBvcnQgdHlwZSBEZXJpdmVNdWx0aXBsZUtleVR5cGVzUHJvcGVydGllcyA9IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMgJiB7XG4gIC8qKlxuICAgKiBUaGUgbWF0ZXJpYWxfaWQgb2YgdGhlIG1uZW1vbmljIHVzZWQgdG8gZGVyaXZlIG5ldyBrZXlzLlxuICAgKlxuICAgKiBJZiB0aGlzIGFyZ3VtZW50IGlzIHVuZGVmaW5lZCBvciBudWxsLCBhIG5ldyBtbmVtb25pYyBpcyBmaXJzdCBjcmVhdGVkXG4gICAqIGFuZCBhbnkgb3RoZXIgc3BlY2lmaWVkIHByb3BlcnRpZXMgYXJlIGFwcGxpZWQgdG8gaXQgKGluIGFkZGl0aW9uIHRvXG4gICAqIGJlaW5nIGFwcGxpZWQgdG8gdGhlIHNwZWNpZmllZCBrZXlzKS5cbiAgICpcbiAgICogVGhlIG5ld2x5IGNyZWF0ZWQgbW5lbW9uaWMtaWQgY2FuIGJlIHJldHJpZXZlZCBmcm9tIHRoZSBgZGVyaXZhdGlvbl9pbmZvYFxuICAgKiBwcm9wZXJ0eSBvZiB0aGUgYEtleUluZm9gIHZhbHVlIGZvciBhIHJlc3VsdGluZyBrZXkuXG4gICAqL1xuICBtbmVtb25pY19pZD86IHN0cmluZztcbn07XG5cbi8qKiBPcmdhbml6YXRpb24gaWQgKi9cbmV4cG9ydCB0eXBlIE9yZ0lkID0gc3RyaW5nO1xuXG4vKiogT3JnLXdpZGUgcG9saWN5ICovXG5leHBvcnQgdHlwZSBPcmdQb2xpY3kgPVxuICB8IFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5XG4gIHwgT2lkY0F1dGhTb3VyY2VzUG9saWN5XG4gIHwgT3JpZ2luQWxsb3dsaXN0UG9saWN5XG4gIHwgTWF4RGFpbHlVbnN0YWtlUG9saWN5XG4gIHwgV2ViQXV0aG5SZWx5aW5nUGFydGllc1BvbGljeVxuICB8IEV4Y2x1c2l2ZUtleUFjY2Vzc1BvbGljeTtcblxuLyoqXG4gKiBXaGV0aGVyIHRvIGVuZm9yY2UgZXhjbHVzaXZlIGFjY2VzcyB0byBrZXlzLiAgQ29uY3JldGVseSxcbiAqIC0gaWYgXCJMaW1pdFRvS2V5T3duZXJcIiBpcyBzZXQsIG9ubHkga2V5IG93bmVycyBhcmUgcGVybWl0dGVkIHRvIGFjY2Vzc1xuICogICB0aGVpciBrZXlzIGZvciBzaWduaW5nOiBhIHVzZXIgc2Vzc2lvbiAobm90IGEgcm9sZSBzZXNzaW9uKSBpcyByZXF1aXJlZFxuICogICBmb3Igc2lnbmluZywgYW5kIGFkZGluZyBhIGtleSB0byBhIHJvbGUgaXMgbm90IHBlcm1pdHRlZC5cbiAqIC0gaWYgXCJMaW1pdFRvU2luZ2xlUm9sZVwiIGlzIHNldCwgZWFjaCBrZXkgaXMgcGVybWl0dGVkIHRvIGJlIGluIGF0IG1vc3RcbiAqICAgb25lIHJvbGUsIGFuZCBzaWduaW5nIGlzIG9ubHkgYWxsb3dlZCB3aGVuIGF1dGhlbnRpY2F0aW5nIHVzaW5nIGEgcm9sZSBzZXNzaW9uIHRva2VuLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEV4Y2x1c2l2ZUtleUFjY2Vzc1BvbGljeSB7XG4gIEV4Y2x1c2l2ZUtleUFjY2VzczogXCJMaW1pdFRvS2V5T3duZXJcIiB8IFwiTGltaXRUb1NpbmdsZVJvbGVcIjtcbn1cblxuLyoqXG4gKiBUaGUgc2V0IG9mIHJlbHlpbmcgcGFydGllcyB0byBhbGxvdyBmb3Igd2ViYXV0aG4gcmVnaXN0cmF0aW9uXG4gKiBUaGVzZSBjb3JyZXNwb25kIHRvIGRvbWFpbnMgZnJvbSB3aGljaCBicm93c2VycyBjYW4gc3VjY2Vzc2Z1bGx5IGNyZWF0ZSBjcmVkZW50aWFscy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzUG9saWN5IHtcbiAgV2ViQXV0aG5SZWx5aW5nUGFydGllczogeyBpZD86IHN0cmluZzsgbmFtZTogc3RyaW5nIH1bXTtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhbiBhbGxvd2xpc3Qgb2YgT0lEQyBJc3N1ZXJzIGFuZCBhdWRpZW5jZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBhdXRoZW50aWNhdGUgaW50byB0aGlzIG9yZy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJPaWRjQXV0aFNvdXJjZXNcIjogeyBcImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbVwiOiBbIFwiMTIzNC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbVwiIF19fVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoU291cmNlc1BvbGljeSB7XG4gIE9pZGNBdXRoU291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10gfCBJc3N1ZXJDb25maWc+O1xufVxuXG4vKiogT0lEQyBpc3N1ZXIgY29uZmlndXJhdGlvbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJc3N1ZXJDb25maWcge1xuICAvKiogVGhlIHNldCBvZiBhdWRpZW5jZXMgc3VwcG9ydGVkIGZvciB0aGlzIGlzc3VlciAqL1xuICBhdWRzOiBzdHJpbmdbXTtcblxuICAvKiogVGhlIGtpbmRzIG9mIHVzZXIgYWxsb3dlZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGlzIGlzc3VlciAqL1xuICB1c2Vyczogc3RyaW5nW107XG5cbiAgLyoqIE9wdGlvbmFsIG5pY2tuYW1lIGZvciB0aGlzIHByb3ZpZGVyICovXG4gIG5pY2tuYW1lPzogc3RyaW5nO1xuXG4gIC8qKiBXaGV0aGVyIHRvIG1ha2UgdGhpcyBpc3N1ZXIgcHVibGljICovXG4gIHB1YmxpYz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogT25seSBhbGxvdyByZXF1ZXN0cyBmcm9tIHRoZSBzcGVjaWZpZWQgb3JpZ2lucy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJPcmlnaW5BbGxvd2xpc3RcIjogXCIqXCJ9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JpZ2luQWxsb3dsaXN0UG9saWN5IHtcbiAgT3JpZ2luQWxsb3dsaXN0OiBzdHJpbmdbXSB8IFwiKlwiO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHNpZ25pbmcgdG8gc3BlY2lmaWMgc291cmNlIElQIGFkZHJlc3Nlcy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJTb3VyY2VJcEFsbG93bGlzdFwiOiBbXCIxMC4xLjIuMy84XCIsIFwiMTY5LjI1NC4xNy4xLzE2XCJdfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5IHtcbiAgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSBudW1iZXIgb2YgdW5zdGFrZXMgcGVyIGRheS5cbiAqXG4gKiBAZXhhbXBsZSB7XCJNYXhEYWlseVVuc3Rha2VcIjogNSB9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWF4RGFpbHlVbnN0YWtlUG9saWN5IHtcbiAgTWF4RGFpbHlVbnN0YWtlOiBudW1iZXI7XG59XG5cbi8qKlxuICogRmlsdGVyIHRvIHVzZSB3aGVuIGxpc3Rpbmcga2V5c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleUZpbHRlciB7XG4gIC8qKiBGaWx0ZXIgYnkga2V5IHR5cGUgKi9cbiAgdHlwZT86IEtleVR5cGU7XG4gIC8qKiBGaWx0ZXIgYnkga2V5IG93bmVyICovXG4gIG93bmVyPzogc3RyaW5nO1xuICAvKiogU2VhcmNoIGJ5IGtleSdzIG1hdGVyaWFsIGlkIGFuZCBtZXRhZGF0YSAqL1xuICBzZWFyY2g/OiBzdHJpbmc7XG4gIC8qKiBQYWdpbmF0aW9uIG9wdGlvbnMgKi9cbiAgcGFnZT86IFBhZ2VPcHRzO1xufVxuXG4vKipcbiAqIEFuIG9yZ2FuaXphdGlvbi5cbiAqXG4gKiBFeHRlbmRzIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBhbmQgcHJvdmlkZXMgYSBmZXcgb3JnLXNwZWNpZmljIG1ldGhvZHMgb24gdG9wLlxuICovXG5leHBvcnQgY2xhc3MgT3JnIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAjb3JnSWQ6IE9yZ0lkO1xuICAvKiogVGhlIG9yZyBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YT86IE9yZ0luZm87XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBvcmcgaWRcbiAgICogQGV4YW1wbGUgT3JnI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgZ2V0IGlkKCk6IE9yZ0lkIHtcbiAgICByZXR1cm4gdGhpcy4jb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgb3JnLiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBPcmdJbmZvIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ1xuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG9yZ0lkOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IG9yZ0lkID09PSBhcGlDbGllbnQub3JnSWQgPyBhcGlDbGllbnQgOiBhcGlDbGllbnQud2l0aFRhcmdldE9yZyhvcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG9yZ2FuaXphdGlvbi4gVGhlIG5ldyBvcmcgaXMgYSBjaGlsZCBvZiB0aGVcbiAgICogY3VycmVudCBvcmcgYW5kIGluaGVyaXRzIGl0cyBrZXktZXhwb3J0IHBvbGljeS4gVGhlIG5ldyBvcmdcbiAgICogaXMgY3JlYXRlZCB3aXRoIG9uZSBvd25lciwgdGhlIGNhbGxlciBvZiB0aGlzIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWVPclJlcXVlc3QgVGhlIG5hbWUgb2YgdGhlIG5ldyBvcmcgb3IgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG5ldyBvcmcuXG4gICAqIEByZXR1cm5zIEluZm9ybWF0aW9uIGFib3V0IHRoZSBuZXdseSBjcmVhdGVkIG9yZy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZU9yZyhuYW1lT3JSZXF1ZXN0OiBzdHJpbmcgfCBDcmVhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgcmVxID0gdHlwZW9mIG5hbWVPclJlcXVlc3QgPT09IFwic3RyaW5nXCIgPyB7IG5hbWU6IG5hbWVPclJlcXVlc3QgfSA6IG5hbWVPclJlcXVlc3Q7XG4gICAgaWYgKCEvXlthLXpBLVowLTlfXXszLDMwfSQvLnRlc3QocmVxLm5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ0NyZWF0ZU9yZyhyZXEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IG9yZyBtZXRyaWNzLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0cmljTmFtZSBUaGUgbWV0cmljIG5hbWUuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIHN0YXJ0IGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLlxuICAgKiBAcGFyYW0gb3B0IE90aGVyIG9wdGlvbmFsIGFyZ3VtZW50c1xuICAgKiBAcGFyYW0gb3B0LmVuZF90aW1lIFRoZSBlbmQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guIElmIG9taXR0ZWQsIGRlZmF1bHRzIHRvICdub3cnLlxuICAgKiBAcGFyYW0gb3B0LnBlcmlvZCBUaGUgZ3JhbnVsYXJpdHksIGluIHNlY29uZHMsIG9mIHRoZSByZXR1cm5lZCBkYXRhIHBvaW50cy5cbiAgICogICBUaGlzIHZhbHVlIGlzIGF1dG9tYXRpY2FsbHkgcm91bmRlZCB1cCB0byBhIG11bHRpcGxlIG9mIDM2MDAgKGkuZS4sIDEgaG91cikuXG4gICAqICAgSWYgb21pdHRlZCwgZGVmYXVsdHMgdG8gdGhlIGR1cmF0aW9uIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCB0aGUgZW5kIGRhdGUuXG4gICAqICAgTXVzdCBiZSBubyBsZXNzIHRoYW4gMSBob3VyLCBpLmUuLCAzNjAwIHNlY29uZHMuIEFkZGl0aW9uYWxseSwgdGhpcyBwZXJpb2QgbXVzdCBub3RcbiAgICogICBkaXZpZGUgdGhlIGBlbmRUaW1lIC0gc3RhcnRUaW1lYCBwZXJpb2QgaW50byBtb3JlIHRoYW4gMTAwIGRhdGEgcG9pbnRzLlxuICAgKiBAcGFyYW0gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBNZXRyaWMgdmFsdWVzIChkYXRhIHBvaW50cykgZm9yIHRoZSByZXF1ZXN0ZWQgcGVyaW9kcy5cbiAgICovXG4gIGFzeW5jIHF1ZXJ5TWV0cmljcyhcbiAgICBtZXRyaWNOYW1lOiBPcmdNZXRyaWNOYW1lLFxuICAgIHN0YXJ0VGltZTogRXBvY2hUaW1lU3RhbXAsXG4gICAgb3B0PzogT21pdDxRdWVyeU1ldHJpY3NSZXF1ZXN0LCBcIm1ldHJpY19uYW1lXCIgfCBcInN0YXJ0X3RpbWVcIj4sXG4gICAgcGFnZU9wdHM/OiBQYWdlT3B0cyxcbiAgKTogUHJvbWlzZTxRdWVyeU1ldHJpY3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IHJlcTogUXVlcnlNZXRyaWNzUmVxdWVzdCA9IHtcbiAgICAgIG1ldHJpY19uYW1lOiBtZXRyaWNOYW1lLFxuICAgICAgc3RhcnRfdGltZTogc3RhcnRUaW1lLFxuICAgICAgLi4ub3B0LFxuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdRdWVyeU1ldHJpY3MocmVxLCBwYWdlT3B0cykuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdHZXQoKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBvcmcgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgcG9saWN5IGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxPcmdQb2xpY3lbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IE9yZ1BvbGljeVtdKSB7XG4gICAgY29uc3QgcCA9IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgbm90aWZpY2F0aW9uIGVuZHBvaW50cyBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG5vdGlmaWNhdGlvbl9lbmRwb2ludHMgRW5kcG9pbnRzLlxuICAgKi9cbiAgYXN5bmMgc2V0Tm90aWZpY2F0aW9uRW5kcG9pbnRzKG5vdGlmaWNhdGlvbl9lbmRwb2ludHM6IE5vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbltdKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoe1xuICAgICAgbm90aWZpY2F0aW9uX2VuZHBvaW50cyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmluZyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5LiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgdG8gc2V0IG9uIHRoZSBuZXcga2V5LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXkodHlwZTogS2V5VHlwZSwgb3duZXJJZD86IHN0cmluZywgcHJvcHM/OiBDcmVhdGVLZXlQcm9wZXJ0aWVzKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNDcmVhdGUodHlwZSwgMSwgb3duZXJJZCwgcHJvcHMpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5c1swXSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBjb3VudCBUaGUgbnVtYmVyIG9mIGtleXMgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyB0byBzZXQgb24gdGhlIG5ldyBrZXlzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBvd25lcklkPzogc3RyaW5nLFxuICAgIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0NyZWF0ZSh0eXBlLCBjb3VudCwgb3duZXJJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmRzIGFuIGludml0YXRpb24gdG8gdGhhdCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckludml0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGludml0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgY3JlYXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJJbnZpdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgZGVsZXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyQ3JlYXRlT2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgYW4gT0lEQyB1c2VyLCByZXNvbHZpbmcgdG8gdGhlIG5ldyB1c2VyJ3MgSURcbiAgICovXG4gIGdldCBjcmVhdGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJDcmVhdGVPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGFuIE9JREMgdXNlclxuICAgKi9cbiAgZ2V0IGRlbGV0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGMuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHVzZXJzXG4gICAqL1xuICBhc3luYyB1c2VycygpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm9bXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXNlcnNMaXN0KCkuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24gKHBhZ2luYXRlZCkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2Vyc0xpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcGFnaW5hdGVkIGxpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGdldCB1c2Vyc1BhZ2luYXRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyR2V0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgYSB1c2VyIGluIHRoaXMgb3JnXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byBlbmFibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGVuYWJsZVVzZXIodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKHVzZXJJZCwgeyBkaXNhYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSBhIHVzZXIgaW4gdGhpcyBvcmdcbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIGRpc2FibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGRpc2FibGVVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCh1c2VySWQsIHsgZGlzYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBhY2Nlc3NpYmxlIGtleXMgaW4gdGhlIG9yZ2FuaXphdGlvblxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHMgT3B0aW9uYWwgZmlsdGVyaW5nIHByb3BlcnRpZXMuXG4gICAqIEByZXR1cm5zIFRoZSBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwcm9wcz86IEtleUZpbHRlcik6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLiNhcGlDbGllbnQua2V5c0xpc3QoXG4gICAgICBwcm9wcz8udHlwZSxcbiAgICAgIHByb3BzPy5wYWdlLFxuICAgICAgcHJvcHM/Lm93bmVyLFxuICAgICAgcHJvcHM/LnNlYXJjaCxcbiAgICApO1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBwYWdpbmF0b3IuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyBjcmVhdGVSb2xlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSWQgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUNyZWF0ZShuYW1lKTtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJvbGUgYnkgaWQgb3IgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgZ2V0Um9sZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdGhlIHJvbGVzIGluIHRoZSBvcmdcbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIHBhZ2luYXRvciBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSByb2xlc1xuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZTogUGFnZU9wdHMpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiByb2xlcy5tYXAoKHIpID0+IG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgcG9saWN5IHJ1bGVzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVBvbGljeTxUeXBlIGV4dGVuZHMgXCJLZXlcIiB8IFwiUm9sZVwiPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogVHlwZSxcbiAgICBydWxlczogVHlwZSBleHRlbmRzIFwiS2V5XCIgPyBLZXlQb2xpY3kgOiBSb2xlUG9saWN5LFxuICApOiBQcm9taXNlPFR5cGUgZXh0ZW5kcyBcIktleVwiID8gTmFtZWRLZXlQb2xpY3kgOiBOYW1lZFJvbGVQb2xpY3k+IHtcbiAgICBjb25zdCBwb2xpY3lJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUNyZWF0ZShuYW1lLCB0eXBlLCBydWxlcyk7XG4gICAgY29uc3QgcG9saWN5ID0gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvKTtcbiAgICByZXR1cm4gcG9saWN5IGFzIFR5cGUgZXh0ZW5kcyBcIktleVwiID8gTmFtZWRLZXlQb2xpY3kgOiBOYW1lZFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbmFtZWQgcG9saWN5IGJ5IGlkIG9yIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3lJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcG9saWN5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGdldFBvbGljeShwb2xpY3lJZDogc3RyaW5nKTogUHJvbWlzZTxOYW1lZFBvbGljeT4ge1xuICAgIGNvbnN0IHBvbGljeUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5R2V0KHBvbGljeUlkLCBcImxhdGVzdFwiKTtcbiAgICByZXR1cm4gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB0aGUgbmFtZWQgcG9saWNpZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIHBhZ2luYXRvciBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWNpZXMuXG4gICAqL1xuICBhc3luYyBwb2xpY2llcyhwYWdlOiBQYWdlT3B0cyk6IFByb21pc2U8TmFtZWRQb2xpY3lbXT4ge1xuICAgIGNvbnN0IHBvbGljaWVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljaWVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBwb2xpY2llcy5tYXAoKHApID0+IE5hbWVkUG9saWN5LmZyb21JbmZvKHRoaXMuI2FwaUNsaWVudCwgcCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBXYXNtIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgV2FzbSBwb2xpY3kgb2JqZWN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhc21Qb2xpY3kobmFtZTogc3RyaW5nLCBwb2xpY3k6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPE5hbWVkV2FzbVBvbGljeT4ge1xuICAgIGNvbnN0IGhhc2ggPSBhd2FpdCB1cGxvYWRXYXNtUG9saWN5KHRoaXMuI2FwaUNsaWVudCwgcG9saWN5KTtcbiAgICBjb25zdCBwb2xpY3lJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUNyZWF0ZShuYW1lLCBcIldhc21cIiwgW1xuICAgICAge1xuICAgICAgICBoYXNoLFxuICAgICAgfSxcbiAgICBdKTtcbiAgICByZXR1cm4gbmV3IE5hbWVkV2FzbVBvbGljeSh0aGlzLiNhcGlDbGllbnQsIHBvbGljeUluZm8gYXMgV2FzbVBvbGljeUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIGtleSBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRoIGFuZCBtbmVtb25pYy5cbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRoIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aCB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgbmV3bHkgZGVyaXZlZCBrZXkgb3IgdW5kZWZpbmVkIGlmIGl0IGFscmVhZHkgZXhpc3RzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5KFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGg6IHN0cmluZyxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleSB8IHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5kZXJpdmVLZXlzKHR5cGUsIFtkZXJpdmF0aW9uUGF0aF0sIG1uZW1vbmljSWQsIHByb3BzKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aHMgYW5kIG1uZW1vbmljLlxuICAgKlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5cyB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRocyBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGhzIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzRGVyaXZlKHR5cGUsIGRlcml2YXRpb25QYXRocywgbW5lbW9uaWNJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgZWl0aGVyIGEgbmV3IG9yIGV4aXN0aW5nIG1uZW1vbmljIHRvIGRlcml2ZSBrZXlzIG9mIG9uZSBvciBtb3JlXG4gICAqIHNwZWNpZmllZCB0eXBlcyB2aWEgc3BlY2lmaWVkIGRlcml2YXRpb24gcGF0aHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyBBIGxpc3Qgb2YgYEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aGAgb2JqZWN0cyBzcGVjaWZ5aW5nIHRoZSBrZXlzIHRvIGJlIGRlcml2ZWRcbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMoXG4gICAga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHM6IEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aFtdLFxuICAgIHByb3BzPzogRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNEZXJpdmVNdWx0aShrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocywgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXQoa2V5SWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyBtYXRlcmlhbCBpZCAoZS5nLiwgYWRkcmVzcykuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSBrZXkgdHlwZS5cbiAgICogQHBhcmFtIG1hdGVyaWFsSWQgVGhlIG1hdGVyaWFsIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5QnlNYXRlcmlhbElkKGtleVR5cGU6IEtleVR5cGUsIG1hdGVyaWFsSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXRCeU1hdGVyaWFsSWQoa2V5VHlwZSwgbWF0ZXJpYWxJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBjb250YWN0LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBmb3IgdGhlIG5ldyBjb250YWN0LlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKiBAcGFyYW0gbWV0YWRhdGEgTWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LiBJbnRlbmRlZCBmb3IgdXNlIGFzIGEgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QsIGRldGVybWluaW5nIHdoZW4gYW5kIHdobyBjYW4gZWRpdCB0aGlzIGNvbnRhY3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseS1jcmVhdGVkIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDb250YWN0KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhZGRyZXNzZXM/OiBBZGRyZXNzTWFwLFxuICAgIG1ldGFkYXRhPzogSnNvblZhbHVlLFxuICAgIGVkaXRQb2xpY3k/OiBFZGl0UG9saWN5LFxuICApOiBQcm9taXNlPENvbnRhY3Q+IHtcbiAgICBjb25zdCBjb250YWN0SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0Q3JlYXRlKG5hbWUsIGFkZHJlc3NlcywgbWV0YWRhdGEsIGVkaXRQb2xpY3kpO1xuXG4gICAgcmV0dXJuIG5ldyBDb250YWN0KHRoaXMuI2FwaUNsaWVudCwgY29udGFjdEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGNvbnRhY3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0gY29udGFjdElkIFRoZSBpZCBvZiB0aGUgY29udGFjdCB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBjb250YWN0LlxuICAgKi9cbiAgYXN5bmMgZ2V0Q29udGFjdChjb250YWN0SWQ6IHN0cmluZyk6IFByb21pc2U8Q29udGFjdD4ge1xuICAgIGNvbnN0IGNvbnRhY3RJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RHZXQoY29udGFjdElkKTtcblxuICAgIHJldHVybiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGNvbnRhY3RJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGNvbnRhY3RzIGluIHRoZSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEFsbCBjb250YWN0cy5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RzKCk6IFByb21pc2U8Q29udGFjdFtdPiB7XG4gICAgY29uc3QgcGFnaW5hdG9yID0gdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RzTGlzdCgpO1xuICAgIGNvbnN0IGNvbnRhY3RzID0gYXdhaXQgcGFnaW5hdG9yLmZldGNoKCk7XG5cbiAgICByZXR1cm4gY29udGFjdHMubWFwKChjKSA9PiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmlkZW50aXR5UHJvdmV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhbiBpZGVudGl0eSBwcm9vZlxuICAgKi9cbiAgZ2V0IHByb3ZlSWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5pZGVudGl0eVByb3ZlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIGdpdmVuIHByb29mIG9mIE9JREMgYXV0aGVudGljYXRpb24gaXMgdmFsaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pZGVudGl0eVZlcmlmeX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHZlcmlmaWVzIGEgcHJvb2Ygb2YgaWRlbnRpdHksIHRocm93aW5nIGlmIGludmFsaWRcbiAgICovXG4gIGdldCB2ZXJpZnlJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmlkZW50aXR5VmVyaWZ5LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgZ2V0TWZhUmVxdWVzdChtZmFJZDogTWZhSWQpOiBNZmFSZXF1ZXN0IHtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBtZmFJZCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFSZXF1ZXN0cygpOiBQcm9taXNlPE1mYVJlcXVlc3RbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnRcbiAgICAgIC5tZmFMaXN0KClcbiAgICAgIC50aGVuKChtZmFJbmZvcykgPT4gbWZhSW5mb3MubWFwKChtZmFJbmZvKSA9PiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIG1mYUluZm8pKSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiBkZXBvc2l0IChvciBzdGFraW5nKSBtZXNzYWdlLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2lnblN0YWtlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdGFrZSByZXNwb25zZS5cbiAgICovXG4gIGdldCBzdGFrZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNpZ25TdGFrZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpLiBUaGUgbGlmZXRpbWUgb2ZcbiAgICogdGhlIG5ldyBzZXNzaW9uIGlzIHNpbGVudGx5IHRydW5jYXRlZCB0byB0aGF0IG9mIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uQ3JlYXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gbmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBnZXQgY3JlYXRlU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKSB3aG9zZSBsaWZldGltZSBwb3RlbnRpYWxseVxuICAgKiBleHRlbmRzIHRoZSBsaWZldGltZSBvZiB0aGUgY3VycmVudCBzZXNzaW9uLiAgTUZBIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25DcmVhdGVFeHRlbmRlZH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIG5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgZ2V0IGNyZWF0ZUV4dGVuZGVkU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGVFeHRlbmRlZC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGEgc2Vzc2lvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25SZXZva2V9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldm9rZXMgYSBzZXNzaW9uXG4gICAqL1xuICBnZXQgcmV2b2tlU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25SZXZva2UuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBoZWFydGJlYXQgLyB1cGNoZWNrIHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5oZWFydGJlYXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHNlbmRzIGEgaGVhcnRiZWF0XG4gICAqL1xuICBnZXQgaGVhcnRiZWF0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaGVhcnRiZWF0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3RzLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydExpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgcGFnaW5hdG9yIG9mIHVzZXItZXhwb3J0IHJlcXVlc3RzXG4gICAqL1xuICBnZXQgZXhwb3J0cygpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRMaXN0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnREZWxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyLWV4cG9ydCByZXF1ZXN0XG4gICAqL1xuICBnZXQgZGVsZXRlRXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydERlbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydEluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXF1ZXN0IHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IGluaXRFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0SW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydENvbXBsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgcmVxdWVzdCByZXNwb25zZS5cbiAgICovXG4gIGdldCBjb21wbGV0ZUV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRDb21wbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVcGRhdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgYW4gb3JnIGFuZCByZXR1cm5zIHVwZGF0ZWQgb3JnIGluZm9ybWF0aW9uXG4gICAqL1xuICBnZXQgdXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IGEgZnJlc2gga2V5LWltcG9ydCBrZXkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5jcmVhdGVLZXlJbXBvcnRLZXl9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgZnJlc2gga2V5LWltcG9ydCBrZXlcbiAgICovXG4gIGdldCBjcmVhdGVLZXlJbXBvcnRLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5jcmVhdGVLZXlJbXBvcnRLZXkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydCBvbmUgb3IgbW9yZSBrZXlzLiBUbyB1c2UgdGhpcyBmdW5jdGlvbmFsaXR5LCB5b3UgbXVzdCBmaXJzdCBjcmVhdGUgYW5cbiAgICogZW5jcnlwdGVkIGtleS1pbXBvcnQgcmVxdWVzdCB1c2luZyB0aGUgYEBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrLWtleS1pbXBvcnRgXG4gICAqIGxpYnJhcnkuIFNlZSB0aGF0IGxpYnJhcnkncyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IEFuIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBpbXBvcnRlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5cyhib2R5OiBJbXBvcnRLZXlSZXF1ZXN0KTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuaW1wb3J0S2V5cyhib2R5KTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cbn1cbiJdfQ==