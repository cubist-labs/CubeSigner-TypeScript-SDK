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
     * Set required MFA types for actions implicitly requiring MFA (see {@link MfaProtectedAction}).
     *
     * @param allowed_mfa_types Assignment of MFA types to actions that implicitly require MFA.
     */
    async setAllowedMfaTypes(allowed_mfa_types) {
        await this.update({
            allowed_mfa_types,
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
    /** @returns the Policy Engine configuration for the org. */
    async policyEngineConfiguration() {
        const data = await this.fetch();
        return data.policy_engine_configuration;
    }
    /**
     * Set the Policy Engine configuration for the org.
     * Note that this overwrites any existing configuration.
     *
     * @param configs The Policy Engine configuration.
     */
    async setPolicyEngineConfiguration(configs) {
        await this.update({
            policy_engine_configuration: configs,
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsdUNBQW9DO0FBQ3BDLHdCQUEwQztBQUMxQyxxQ0FPa0I7QUF1SWxCOzs7O0dBSUc7QUFDSCxNQUFhLEdBQUc7SUFNZDs7O09BR0c7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksa0JBQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLGlCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLEtBQWE7UUEzQnRDLGlDQUFzQjtRQUMvQiw2QkFBYztRQUNkLDBCQUEwQjtRQUMxQiw0QkFBZ0I7UUF5QmQsdUJBQUEsSUFBSSxjQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUksa0JBQWMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQzNGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxhQUF3QztRQUN0RCxNQUFNLEdBQUcsR0FBRyxPQUFPLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7UUFDeEYsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMzQyxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsWUFB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QUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsSUFBSSxjQUFjO1FBQ2hCLE9BQU8sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsSUFBSSxrQkFBa0I7UUFDcEIsT0FBTyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFzQjtRQUNyQyxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLE1BQUcsQ0FBQyx1QkFBQSxJQUFJLHNCQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0NBQ0Y7QUFqc0JELGtCQWlzQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEtleVR5cGUsXG4gIEtleVByb3BlcnRpZXMsXG4gIE5vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbixcbiAgUGFnZU9wdHMsXG4gIFVzZXJJbk9yZ0luZm8sXG4gIEFwaUNsaWVudCxcbiAgT3JnSW5mbyxcbiAgTWZhSWQsXG4gIEltcG9ydEtleVJlcXVlc3QsXG4gIEtleVBvbGljeSxcbiAgUXVlcnlNZXRyaWNzUmVzcG9uc2UsXG4gIE9yZ01ldHJpY05hbWUsXG4gIFF1ZXJ5TWV0cmljc1JlcXVlc3QsXG4gIEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aCxcbiAgSnNvblZhbHVlLFxuICBFZGl0UG9saWN5LFxuICBBZGRyZXNzTWFwLFxuICBDcmVhdGVPcmdSZXF1ZXN0LFxuICBSb2xlUG9saWN5LFxuICBQb2xpY3lFbmdpbmVDb25maWd1cmF0aW9uLFxuICBNZmFQcm90ZWN0ZWRBY3Rpb24sXG4gIE1mYVR5cGUsXG59IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBDb250YWN0IH0gZnJvbSBcIi4vY29udGFjdFwiO1xuaW1wb3J0IHsgS2V5LCBNZmFSZXF1ZXN0LCBSb2xlIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7XG4gIHR5cGUgTmFtZWRLZXlQb2xpY3ksXG4gIE5hbWVkUG9saWN5LFxuICB0eXBlIE5hbWVkUm9sZVBvbGljeSxcbiAgTmFtZWRXYXNtUG9saWN5LFxuICB1cGxvYWRXYXNtUG9saWN5LFxuICB0eXBlIFdhc21Qb2xpY3lJbmZvLFxufSBmcm9tIFwiLi9wb2xpY3lcIjtcblxuLyoqIE9wdGlvbnMgcGFzZWQgdG8gY3JlYXRlS2V5IGFuZCBkZXJpdmVLZXkgKi9cbmV4cG9ydCB0eXBlIENyZWF0ZUtleVByb3BlcnRpZXMgPSBPbWl0PEtleVByb3BlcnRpZXMsIFwicG9saWN5XCI+ICYge1xuICAvKipcbiAgICogUG9saWNpZXMgdG8gYXBwbHkgdG8gdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIFRoaXMgdHlwZSBtYWtlcyBpdCBwb3NzaWJsZSB0byBhc3NpZ24gdmFsdWVzIGxpa2VcbiAgICogYFtBbGxvd0VpcDE5MVNpZ25pbmdQb2xpY3ldYCwgYnV0IHJlbWFpbnMgYmFja3dhcmRzXG4gICAqIGNvbXBhdGlibGUgd2l0aCBwcmlvciB2ZXJzaW9ucyBvZiB0aGUgU0RLLCBpbiB3aGljaFxuICAgKiB0aGlzIHByb3BlcnR5IGhhZCB0eXBlIGBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGxgLlxuICAgKi9cbiAgcG9saWN5PzogS2V5UG9saWN5IHwgdW5rbm93bltdIHwgbnVsbDtcbn07XG5cbi8qKiBPcHRpb25zIHBhc3NlZCB0byBpbXBvcnRLZXkgYW5kIGRlcml2ZUtleSAqL1xuZXhwb3J0IHR5cGUgSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyA9IENyZWF0ZUtleVByb3BlcnRpZXMgJiB7XG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIHJldHVybnMgYSAnS2V5JyBvYmplY3QgZm9yIGJvdGggbmV3IGFuZCBleGlzdGluZyBrZXlzLlxuICAgKi9cbiAgaWRlbXBvdGVudD86IGJvb2xlYW47XG59O1xuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gZGVyaXZlTXVsdGlwbGVLZXlUeXBlcyAqL1xuZXhwb3J0IHR5cGUgRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMgPSBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzICYge1xuICAvKipcbiAgICogVGhlIG1hdGVyaWFsX2lkIG9mIHRoZSBtbmVtb25pYyB1c2VkIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICpcbiAgICogSWYgdGhpcyBhcmd1bWVudCBpcyB1bmRlZmluZWQgb3IgbnVsbCwgYSBuZXcgbW5lbW9uaWMgaXMgZmlyc3QgY3JlYXRlZFxuICAgKiBhbmQgYW55IG90aGVyIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFyZSBhcHBsaWVkIHRvIGl0IChpbiBhZGRpdGlvbiB0b1xuICAgKiBiZWluZyBhcHBsaWVkIHRvIHRoZSBzcGVjaWZpZWQga2V5cykuXG4gICAqXG4gICAqIFRoZSBuZXdseSBjcmVhdGVkIG1uZW1vbmljLWlkIGNhbiBiZSByZXRyaWV2ZWQgZnJvbSB0aGUgYGRlcml2YXRpb25faW5mb2BcbiAgICogcHJvcGVydHkgb2YgdGhlIGBLZXlJbmZvYCB2YWx1ZSBmb3IgYSByZXN1bHRpbmcga2V5LlxuICAgKi9cbiAgbW5lbW9uaWNfaWQ/OiBzdHJpbmc7XG59O1xuXG4vKiogT3JnYW5pemF0aW9uIGlkICovXG5leHBvcnQgdHlwZSBPcmdJZCA9IHN0cmluZztcblxuLyoqIE9yZy13aWRlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgT3JnUG9saWN5ID1cbiAgfCBTb3VyY2VJcEFsbG93bGlzdFBvbGljeVxuICB8IE9pZGNBdXRoU291cmNlc1BvbGljeVxuICB8IE9yaWdpbkFsbG93bGlzdFBvbGljeVxuICB8IE1heERhaWx5VW5zdGFrZVBvbGljeVxuICB8IFdlYkF1dGhuUmVseWluZ1BhcnRpZXNQb2xpY3lcbiAgfCBFeGNsdXNpdmVLZXlBY2Nlc3NQb2xpY3k7XG5cbi8qKlxuICogV2hldGhlciB0byBlbmZvcmNlIGV4Y2x1c2l2ZSBhY2Nlc3MgdG8ga2V5cy4gIENvbmNyZXRlbHksXG4gKiAtIGlmIFwiTGltaXRUb0tleU93bmVyXCIgaXMgc2V0LCBvbmx5IGtleSBvd25lcnMgYXJlIHBlcm1pdHRlZCB0byBhY2Nlc3NcbiAqICAgdGhlaXIga2V5cyBmb3Igc2lnbmluZzogYSB1c2VyIHNlc3Npb24gKG5vdCBhIHJvbGUgc2Vzc2lvbikgaXMgcmVxdWlyZWRcbiAqICAgZm9yIHNpZ25pbmcsIGFuZCBhZGRpbmcgYSBrZXkgdG8gYSByb2xlIGlzIG5vdCBwZXJtaXR0ZWQuXG4gKiAtIGlmIFwiTGltaXRUb1NpbmdsZVJvbGVcIiBpcyBzZXQsIGVhY2gga2V5IGlzIHBlcm1pdHRlZCB0byBiZSBpbiBhdCBtb3N0XG4gKiAgIG9uZSByb2xlLCBhbmQgc2lnbmluZyBpcyBvbmx5IGFsbG93ZWQgd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIHJvbGUgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeGNsdXNpdmVLZXlBY2Nlc3NQb2xpY3kge1xuICBFeGNsdXNpdmVLZXlBY2Nlc3M6IFwiTGltaXRUb0tleU93bmVyXCIgfCBcIkxpbWl0VG9TaW5nbGVSb2xlXCI7XG59XG5cbi8qKlxuICogVGhlIHNldCBvZiByZWx5aW5nIHBhcnRpZXMgdG8gYWxsb3cgZm9yIHdlYmF1dGhuIHJlZ2lzdHJhdGlvblxuICogVGhlc2UgY29ycmVzcG9uZCB0byBkb21haW5zIGZyb20gd2hpY2ggYnJvd3NlcnMgY2FuIHN1Y2Nlc3NmdWxseSBjcmVhdGUgY3JlZGVudGlhbHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV2ViQXV0aG5SZWx5aW5nUGFydGllc1BvbGljeSB7XG4gIFdlYkF1dGhuUmVseWluZ1BhcnRpZXM6IHsgaWQ/OiBzdHJpbmc7IG5hbWU6IHN0cmluZyB9W107XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gYWxsb3dsaXN0IG9mIE9JREMgSXNzdWVycyBhbmQgYXVkaWVuY2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIGludG8gdGhpcyBvcmcuXG4gKlxuICogQGV4YW1wbGUge1wiT2lkY0F1dGhTb3VyY2VzXCI6IHsgXCJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb21cIjogWyBcIjEyMzQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb21cIiBdfX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPaWRjQXV0aFNvdXJjZXNQb2xpY3kge1xuICBPaWRjQXV0aFNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdIHwgSXNzdWVyQ29uZmlnPjtcbn1cblxuLyoqIE9JREMgaXNzdWVyIGNvbmZpZ3VyYXRpb24gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXNzdWVyQ29uZmlnIHtcbiAgLyoqIFRoZSBzZXQgb2YgYXVkaWVuY2VzIHN1cHBvcnRlZCBmb3IgdGhpcyBpc3N1ZXIgKi9cbiAgYXVkczogc3RyaW5nW107XG5cbiAgLyoqIFRoZSBraW5kcyBvZiB1c2VyIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhpcyBpc3N1ZXIgKi9cbiAgdXNlcnM6IHN0cmluZ1tdO1xuXG4gIC8qKiBPcHRpb25hbCBuaWNrbmFtZSBmb3IgdGhpcyBwcm92aWRlciAqL1xuICBuaWNrbmFtZT86IHN0cmluZztcblxuICAvKiogV2hldGhlciB0byBtYWtlIHRoaXMgaXNzdWVyIHB1YmxpYyAqL1xuICBwdWJsaWM/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIE9ubHkgYWxsb3cgcmVxdWVzdHMgZnJvbSB0aGUgc3BlY2lmaWVkIG9yaWdpbnMuXG4gKlxuICogQGV4YW1wbGUge1wiT3JpZ2luQWxsb3dsaXN0XCI6IFwiKlwifVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9yaWdpbkFsbG93bGlzdFBvbGljeSB7XG4gIE9yaWdpbkFsbG93bGlzdDogc3RyaW5nW10gfCBcIipcIjtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCBzaWduaW5nIHRvIHNwZWNpZmljIHNvdXJjZSBJUCBhZGRyZXNzZXMuXG4gKlxuICogQGV4YW1wbGUge1wiU291cmNlSXBBbGxvd2xpc3RcIjogW1wiMTAuMS4yLjMvOFwiLCBcIjE2OS4yNTQuMTcuMS8xNlwiXX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VJcEFsbG93bGlzdFBvbGljeSB7XG4gIFNvdXJjZUlwQWxsb3dsaXN0OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgbnVtYmVyIG9mIHVuc3Rha2VzIHBlciBkYXkuXG4gKlxuICogQGV4YW1wbGUge1wiTWF4RGFpbHlVbnN0YWtlXCI6IDUgfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1heERhaWx5VW5zdGFrZVBvbGljeSB7XG4gIE1heERhaWx5VW5zdGFrZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIEZpbHRlciB0byB1c2Ugd2hlbiBsaXN0aW5nIGtleXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlGaWx0ZXIge1xuICAvKiogRmlsdGVyIGJ5IGtleSB0eXBlICovXG4gIHR5cGU/OiBLZXlUeXBlO1xuICAvKiogRmlsdGVyIGJ5IGtleSBvd25lciAqL1xuICBvd25lcj86IHN0cmluZztcbiAgLyoqIFNlYXJjaCBieSBrZXkncyBtYXRlcmlhbCBpZCBhbmQgbWV0YWRhdGEgKi9cbiAgc2VhcmNoPzogc3RyaW5nO1xuICAvKiogUGFnaW5hdGlvbiBvcHRpb25zICovXG4gIHBhZ2U/OiBQYWdlT3B0cztcbn1cblxuLyoqXG4gKiBBbiBvcmdhbml6YXRpb24uXG4gKlxuICogRXh0ZW5kcyB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gYW5kIHByb3ZpZGVzIGEgZmV3IG9yZy1zcGVjaWZpYyBtZXRob2RzIG9uIHRvcC5cbiAqL1xuZXhwb3J0IGNsYXNzIE9yZyB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI29yZ0lkOiBPcmdJZDtcbiAgLyoqIFRoZSBvcmcgaW5mb3JtYXRpb24gKi9cbiAgI2RhdGE/OiBPcmdJbmZvO1xuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIGlkXG4gICAqIEBleGFtcGxlIE9yZyNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICovXG4gIGdldCBpZCgpOiBPcmdJZCB7XG4gICAgcmV0dXJuIHRoaXMuI29yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIG9yZy4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogT3JnSW5mbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBvcmdJZDogc3RyaW5nKSB7XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBvcmdJZCA9PT0gYXBpQ2xpZW50Lm9yZ0lkID8gYXBpQ2xpZW50IDogYXBpQ2xpZW50LndpdGhUYXJnZXRPcmcob3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBvcmdhbml6YXRpb24uIFRoZSBuZXcgb3JnIGlzIGEgY2hpbGQgb2YgdGhlXG4gICAqIGN1cnJlbnQgb3JnIGFuZCBpbmhlcml0cyBpdHMga2V5LWV4cG9ydCBwb2xpY3kuIFRoZSBuZXcgb3JnXG4gICAqIGlzIGNyZWF0ZWQgd2l0aCBvbmUgb3duZXIsIHRoZSBjYWxsZXIgb2YgdGhpcyBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lT3JSZXF1ZXN0IFRoZSBuYW1lIG9mIHRoZSBuZXcgb3JnIG9yIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBuZXcgb3JnLlxuICAgKiBAcmV0dXJucyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgbmV3bHkgY3JlYXRlZCBvcmcuXG4gICAqL1xuICBhc3luYyBjcmVhdGVPcmcobmFtZU9yUmVxdWVzdDogc3RyaW5nIHwgQ3JlYXRlT3JnUmVxdWVzdCk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIGNvbnN0IHJlcSA9IHR5cGVvZiBuYW1lT3JSZXF1ZXN0ID09PSBcInN0cmluZ1wiID8geyBuYW1lOiBuYW1lT3JSZXF1ZXN0IH0gOiBuYW1lT3JSZXF1ZXN0O1xuICAgIGlmICghL15bYS16QS1aMC05X117MywzMH0kLy50ZXN0KHJlcS5uYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3JnIG5hbWUgbXVzdCBiZSBhbHBoYW51bWVyaWMgYW5kIGJldHdlZW4gMyBhbmQgMzAgY2hhcmFjdGVyc1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdDcmVhdGVPcmcocmVxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBRdWVyeSBvcmcgbWV0cmljcy5cbiAgICpcbiAgICogQHBhcmFtIG1ldHJpY05hbWUgVGhlIG1ldHJpYyBuYW1lLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBzdGFydCBkYXRlIGluIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAgICogQHBhcmFtIG9wdCBPdGhlciBvcHRpb25hbCBhcmd1bWVudHNcbiAgICogQHBhcmFtIG9wdC5lbmRfdGltZSBUaGUgZW5kIGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLiBJZiBvbWl0dGVkLCBkZWZhdWx0cyB0byAnbm93Jy5cbiAgICogQHBhcmFtIG9wdC5wZXJpb2QgVGhlIGdyYW51bGFyaXR5LCBpbiBzZWNvbmRzLCBvZiB0aGUgcmV0dXJuZWQgZGF0YSBwb2ludHMuXG4gICAqICAgVGhpcyB2YWx1ZSBpcyBhdXRvbWF0aWNhbGx5IHJvdW5kZWQgdXAgdG8gYSBtdWx0aXBsZSBvZiAzNjAwIChpLmUuLCAxIGhvdXIpLlxuICAgKiAgIElmIG9taXR0ZWQsIGRlZmF1bHRzIHRvIHRoZSBkdXJhdGlvbiBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgdGhlIGVuZCBkYXRlLlxuICAgKiAgIE11c3QgYmUgbm8gbGVzcyB0aGFuIDEgaG91ciwgaS5lLiwgMzYwMCBzZWNvbmRzLiBBZGRpdGlvbmFsbHksIHRoaXMgcGVyaW9kIG11c3Qgbm90XG4gICAqICAgZGl2aWRlIHRoZSBgZW5kVGltZSAtIHN0YXJ0VGltZWAgcGVyaW9kIGludG8gbW9yZSB0aGFuIDEwMCBkYXRhIHBvaW50cy5cbiAgICogQHBhcmFtIHBhZ2VPcHRzIFBhZ2luYXRpb24gb3B0aW9ucy5cbiAgICogQHJldHVybnMgTWV0cmljIHZhbHVlcyAoZGF0YSBwb2ludHMpIGZvciB0aGUgcmVxdWVzdGVkIHBlcmlvZHMuXG4gICAqL1xuICBhc3luYyBxdWVyeU1ldHJpY3MoXG4gICAgbWV0cmljTmFtZTogT3JnTWV0cmljTmFtZSxcbiAgICBzdGFydFRpbWU6IEVwb2NoVGltZVN0YW1wLFxuICAgIG9wdD86IE9taXQ8UXVlcnlNZXRyaWNzUmVxdWVzdCwgXCJtZXRyaWNfbmFtZVwiIHwgXCJzdGFydF90aW1lXCI+LFxuICAgIHBhZ2VPcHRzPzogUGFnZU9wdHMsXG4gICk6IFByb21pc2U8UXVlcnlNZXRyaWNzUmVzcG9uc2U+IHtcbiAgICBjb25zdCByZXE6IFF1ZXJ5TWV0cmljc1JlcXVlc3QgPSB7XG4gICAgICBtZXRyaWNfbmFtZTogbWV0cmljTmFtZSxcbiAgICAgIHN0YXJ0X3RpbWU6IHN0YXJ0VGltZSxcbiAgICAgIC4uLm9wdCxcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnUXVlcnlNZXRyaWNzKHJlcSwgcGFnZU9wdHMpLmZldGNoQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIG9yZyBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG9yZyBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGZldGNoKCk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnR2V0KCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBvcmcgKi9cbiAgYXN5bmMgbmFtZSgpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgV2hldGhlciB0aGUgb3JnIGlzIGVuYWJsZWQgKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKiogRW5hYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGVuYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUgb3JnLiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKiogQHJldHVybnMgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8T3JnUG9saWN5W10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgT3JnUG9saWN5W107XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBPcmdQb2xpY3lbXSkge1xuICAgIGNvbnN0IHAgPSBwb2xpY3kgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXTtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIG5vdGlmaWNhdGlvbiBlbmRwb2ludHMgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBub3RpZmljYXRpb25fZW5kcG9pbnRzIEVuZHBvaW50cy5cbiAgICovXG4gIGFzeW5jIHNldE5vdGlmaWNhdGlvbkVuZHBvaW50cyhub3RpZmljYXRpb25fZW5kcG9pbnRzOiBOb3RpZmljYXRpb25FbmRwb2ludENvbmZpZ3VyYXRpb25bXSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIG5vdGlmaWNhdGlvbl9lbmRwb2ludHMsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHJlcXVpcmVkIE1GQSB0eXBlcyBmb3IgYWN0aW9ucyBpbXBsaWNpdGx5IHJlcXVpcmluZyBNRkEgKHNlZSB7QGxpbmsgTWZhUHJvdGVjdGVkQWN0aW9ufSkuXG4gICAqXG4gICAqIEBwYXJhbSBhbGxvd2VkX21mYV90eXBlcyBBc3NpZ25tZW50IG9mIE1GQSB0eXBlcyB0byBhY3Rpb25zIHRoYXQgaW1wbGljaXRseSByZXF1aXJlIE1GQS5cbiAgICovXG4gIGFzeW5jIHNldEFsbG93ZWRNZmFUeXBlcyhhbGxvd2VkX21mYV90eXBlczogUGFydGlhbDxSZWNvcmQ8TWZhUHJvdGVjdGVkQWN0aW9uLCBNZmFUeXBlW10+Pikge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIGFsbG93ZWRfbWZhX3R5cGVzLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduaW5nIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXkuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyB0byBzZXQgb24gdGhlIG5ldyBrZXkuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleSh0eXBlOiBLZXlUeXBlLCBvd25lcklkPzogc3RyaW5nLCBwcm9wcz86IENyZWF0ZUtleVByb3BlcnRpZXMpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0NyZWF0ZSh0eXBlLCAxLCBvd25lcklkLCBwcm9wcyk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlzWzBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIHNldCBvbiB0aGUgbmV3IGtleXMuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleXMoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICAgcHJvcHM/OiBDcmVhdGVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzQ3JlYXRlKHR5cGUsIGNvdW50LCBvd25lcklkLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyAoZmlyc3QtcGFydHkpIHVzZXIgaW4gdGhlIG9yZ2FuaXphdGlvbiBhbmQgc2VuZHMgYW4gaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VySW52aXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgaW52aXRlcyBhIHVzZXJcbiAgICovXG4gIGdldCBjcmVhdGVVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckludml0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyRGVsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhIHVzZXJcbiAgICovXG4gIGdldCBkZWxldGVVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckRlbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IE9JREMgdXNlci4gVGhpcyBjYW4gYmUgYSBmaXJzdC1wYXJ0eSBcIk1lbWJlclwiIG9yIHRoaXJkLXBhcnR5IFwiQWxpZW5cIi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJDcmVhdGVPaWRjfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBhbiBPSURDIHVzZXIsIHJlc29sdmluZyB0byB0aGUgbmV3IHVzZXIncyBJRFxuICAgKi9cbiAgZ2V0IGNyZWF0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckNyZWF0ZU9pZGMuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyBPSURDIHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyRGVsZXRlT2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYW4gT0lEQyB1c2VyXG4gICAqL1xuICBnZXQgZGVsZXRlT2lkY1VzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyRGVsZXRlT2lkYy5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGFzeW5jIHVzZXJzKCk6IFByb21pc2U8VXNlckluT3JnSW5mb1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVc2Vyc0xpc3QoKS5mZXRjaEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvbiAocGFnaW5hdGVkKS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBwYWdpbmF0ZWQgbGlzdCBvZiB1c2Vyc1xuICAgKi9cbiAgZ2V0IHVzZXJzUGFnaW5hdGVkKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlcnNMaXN0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlciBieSBpZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJHZXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHVzZXIncyBpbmZvXG4gICAqL1xuICBnZXQgZ2V0VXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJHZXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSBhIHVzZXIgaW4gdGhpcyBvcmdcbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIGVuYWJsZVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCB1c2VyJ3MgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgZW5hYmxlVXNlcih1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlVXNlck1lbWJlcnNoaXAodXNlcklkLCB7IGRpc2FibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIGEgdXNlciBpbiB0aGlzIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyIHdob3NlIG1lbWJlcnNoaXAgdG8gZGlzYWJsZVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCB1c2VyJ3MgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgZGlzYWJsZVVzZXIodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKHVzZXJJZCwgeyBkaXNhYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFjY2Vzc2libGUga2V5cyBpbiB0aGUgb3JnYW5pemF0aW9uXG4gICAqXG4gICAqIEBwYXJhbSBwcm9wcyBPcHRpb25hbCBmaWx0ZXJpbmcgcHJvcGVydGllcy5cbiAgICogQHJldHVybnMgVGhlIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzKHByb3BzPzogS2V5RmlsdGVyKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IHBhZ2luYXRvciA9IHRoaXMuI2FwaUNsaWVudC5rZXlzTGlzdChcbiAgICAgIHByb3BzPy50eXBlLFxuICAgICAgcHJvcHM/LnBhZ2UsXG4gICAgICBwcm9wcz8ub3duZXIsXG4gICAgICBwcm9wcz8uc2VhcmNoLFxuICAgICk7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHBhZ2luYXRvci5mZXRjaCgpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgcm9sZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVJvbGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlQ3JlYXRlKG5hbWUpO1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpZCBvciBuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBnZXRSb2xlKHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3Qgcm9sZUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldChyb2xlSWQpO1xuICAgIHJldHVybiBuZXcgUm9sZSh0aGlzLiNhcGlDbGllbnQsIHJvbGVJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB0aGUgcm9sZXMgaW4gdGhlIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBUaGUgcGFnaW5hdG9yIG9wdGlvbnNcbiAgICogQHJldHVybnMgVGhlIHJvbGVzXG4gICAqL1xuICBhc3luYyByb2xlcyhwYWdlOiBQYWdlT3B0cyk6IFByb21pc2U8Um9sZVtdPiB7XG4gICAgY29uc3Qgcm9sZXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZXNMaXN0KHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIHJvbGVzLm1hcCgocikgPT4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIHJ1bGVzIFRoZSBwb2xpY3kgcnVsZXMuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlUG9saWN5PFR5cGUgZXh0ZW5kcyBcIktleVwiIHwgXCJSb2xlXCI+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBUeXBlLFxuICAgIHJ1bGVzOiBUeXBlIGV4dGVuZHMgXCJLZXlcIiA/IEtleVBvbGljeSA6IFJvbGVQb2xpY3ksXG4gICk6IFByb21pc2U8VHlwZSBleHRlbmRzIFwiS2V5XCIgPyBOYW1lZEtleVBvbGljeSA6IE5hbWVkUm9sZVBvbGljeT4ge1xuICAgIGNvbnN0IHBvbGljeUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5Q3JlYXRlKG5hbWUsIHR5cGUsIHJ1bGVzKTtcbiAgICBjb25zdCBwb2xpY3kgPSBOYW1lZFBvbGljeS5mcm9tSW5mbyh0aGlzLiNhcGlDbGllbnQsIHBvbGljeUluZm8pO1xuICAgIHJldHVybiBwb2xpY3kgYXMgVHlwZSBleHRlbmRzIFwiS2V5XCIgPyBOYW1lZEtleVBvbGljeSA6IE5hbWVkUm9sZVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBuYW1lZCBwb2xpY3kgYnkgaWQgb3IgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSBwb2xpY3kgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgZ2V0UG9saWN5KHBvbGljeUlkOiBzdHJpbmcpOiBQcm9taXNlPE5hbWVkUG9saWN5PiB7XG4gICAgY29uc3QgcG9saWN5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lHZXQocG9saWN5SWQsIFwibGF0ZXN0XCIpO1xuICAgIHJldHVybiBOYW1lZFBvbGljeS5mcm9tSW5mbyh0aGlzLiNhcGlDbGllbnQsIHBvbGljeUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSBuYW1lZCBwb2xpY2llcyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBUaGUgcGFnaW5hdG9yIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY2llcy5cbiAgICovXG4gIGFzeW5jIHBvbGljaWVzKHBhZ2U6IFBhZ2VPcHRzKTogUHJvbWlzZTxOYW1lZFBvbGljeVtdPiB7XG4gICAgY29uc3QgcG9saWNpZXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWNpZXNMaXN0KHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIHBvbGljaWVzLm1hcCgocCkgPT4gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IFdhc20gcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBXYXNtIHBvbGljeSBvYmplY3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlV2FzbVBvbGljeShuYW1lOiBzdHJpbmcsIHBvbGljeTogVWludDhBcnJheSk6IFByb21pc2U8TmFtZWRXYXNtUG9saWN5PiB7XG4gICAgY29uc3QgaGFzaCA9IGF3YWl0IHVwbG9hZFdhc21Qb2xpY3kodGhpcy4jYXBpQ2xpZW50LCBwb2xpY3kpO1xuICAgIGNvbnN0IHBvbGljeUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5Q3JlYXRlKG5hbWUsIFwiV2FzbVwiLCBbXG4gICAgICB7XG4gICAgICAgIGhhc2gsXG4gICAgICB9LFxuICAgIF0pO1xuICAgIHJldHVybiBuZXcgTmFtZWRXYXNtUG9saWN5KHRoaXMuI2FwaUNsaWVudCwgcG9saWN5SW5mbyBhcyBXYXNtUG9saWN5SW5mbyk7XG4gIH1cblxuICAvKiogQHJldHVybnMgdGhlIFBvbGljeSBFbmdpbmUgY29uZmlndXJhdGlvbiBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5RW5naW5lQ29uZmlndXJhdGlvbigpOiBQcm9taXNlPFBvbGljeUVuZ2luZUNvbmZpZ3VyYXRpb24gfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLnBvbGljeV9lbmdpbmVfY29uZmlndXJhdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIFBvbGljeSBFbmdpbmUgY29uZmlndXJhdGlvbiBmb3IgdGhlIG9yZy5cbiAgICogTm90ZSB0aGF0IHRoaXMgb3ZlcndyaXRlcyBhbnkgZXhpc3RpbmcgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNvbmZpZ3MgVGhlIFBvbGljeSBFbmdpbmUgY29uZmlndXJhdGlvbi5cbiAgICovXG4gIGFzeW5jIHNldFBvbGljeUVuZ2luZUNvbmZpZ3VyYXRpb24oY29uZmlnczogUG9saWN5RW5naW5lQ29uZmlndXJhdGlvbikge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIHBvbGljeV9lbmdpbmVfY29uZmlndXJhdGlvbjogY29uZmlncyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBrZXkgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aCBhbmQgbW5lbW9uaWMuXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXkgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSBkZXJpdmF0aW9uUGF0aCBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGggdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gbW5lbW9uaWNJZCBtYXRlcmlhbF9pZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIG5ld2x5IGRlcml2ZWQga2V5IG9yIHVuZGVmaW5lZCBpZiBpdCBhbHJlYWR5IGV4aXN0cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleShcbiAgICB0eXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoOiBzdHJpbmcsXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXkgfCB1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZGVyaXZlS2V5cyh0eXBlLCBbZGVyaXZhdGlvblBhdGhdLCBtbmVtb25pY0lkLCBwcm9wcykpWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIHNldCBvZiBrZXlzIG9mIHRoZSBnaXZlbiB0eXBlIHVzaW5nIHRoZSBnaXZlbiBkZXJpdmF0aW9uIHBhdGhzIGFuZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleXMgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSBkZXJpdmF0aW9uUGF0aHMgTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRocyB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5cyhcbiAgICB0eXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0Rlcml2ZSh0eXBlLCBkZXJpdmF0aW9uUGF0aHMsIG1uZW1vbmljSWQsIHByb3BzKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlIGVpdGhlciBhIG5ldyBvciBleGlzdGluZyBtbmVtb25pYyB0byBkZXJpdmUga2V5cyBvZiBvbmUgb3IgbW9yZVxuICAgKiBzcGVjaWZpZWQgdHlwZXMgdmlhIHNwZWNpZmllZCBkZXJpdmF0aW9uIHBhdGhzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHMgQSBsaXN0IG9mIGBLZXlUeXBlQW5kRGVyaXZhdGlvblBhdGhgIG9iamVjdHMgc3BlY2lmeWluZyB0aGUga2V5cyB0byBiZSBkZXJpdmVkXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVNdWx0aXBsZUtleVR5cGVzKFxuICAgIGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzOiBLZXlUeXBlQW5kRGVyaXZhdGlvblBhdGhbXSxcbiAgICBwcm9wcz86IERlcml2ZU11bHRpcGxlS2V5VHlwZXNQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzRGVyaXZlTXVsdGkoa2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHMsIHByb3BzKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGlkLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5R2V0KGtleUlkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpdHMgbWF0ZXJpYWwgaWQgKGUuZy4sIGFkZHJlc3MpLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUga2V5IHR5cGUuXG4gICAqIEBwYXJhbSBtYXRlcmlhbElkIFRoZSBtYXRlcmlhbCBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGtleS5cbiAgICovXG4gIGFzeW5jIGdldEtleUJ5TWF0ZXJpYWxJZChrZXlUeXBlOiBLZXlUeXBlLCBtYXRlcmlhbElkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5R2V0QnlNYXRlcmlhbElkKGtleVR5cGUsIG1hdGVyaWFsSWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgY29udGFjdC5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgZm9yIHRoZSBuZXcgY29udGFjdC5cbiAgICogQHBhcmFtIGFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29udGFjdC5cbiAgICogQHBhcmFtIG1ldGFkYXRhIE1ldGFkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29udGFjdC4gSW50ZW5kZWQgZm9yIHVzZSBhcyBhIGRlc2NyaXB0aW9uLlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgZWRpdCBwb2xpY3kgZm9yIHRoZSBjb250YWN0LCBkZXRlcm1pbmluZyB3aGVuIGFuZCB3aG8gY2FuIGVkaXQgdGhpcyBjb250YWN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHktY3JlYXRlZCBjb250YWN0LlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ29udGFjdChcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYWRkcmVzc2VzPzogQWRkcmVzc01hcCxcbiAgICBtZXRhZGF0YT86IEpzb25WYWx1ZSxcbiAgICBlZGl0UG9saWN5PzogRWRpdFBvbGljeSxcbiAgKTogUHJvbWlzZTxDb250YWN0PiB7XG4gICAgY29uc3QgY29udGFjdEluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuY29udGFjdENyZWF0ZShuYW1lLCBhZGRyZXNzZXMsIG1ldGFkYXRhLCBlZGl0UG9saWN5KTtcblxuICAgIHJldHVybiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGNvbnRhY3RJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjb250YWN0IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogQHBhcmFtIGNvbnRhY3RJZCBUaGUgaWQgb2YgdGhlIGNvbnRhY3QgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgY29udGFjdC5cbiAgICovXG4gIGFzeW5jIGdldENvbnRhY3QoY29udGFjdElkOiBzdHJpbmcpOiBQcm9taXNlPENvbnRhY3Q+IHtcbiAgICBjb25zdCBjb250YWN0SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0R2V0KGNvbnRhY3RJZCk7XG5cbiAgICByZXR1cm4gbmV3IENvbnRhY3QodGhpcy4jYXBpQ2xpZW50LCBjb250YWN0SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBjb250YWN0cyBpbiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbGwgY29udGFjdHMuXG4gICAqL1xuICBhc3luYyBjb250YWN0cygpOiBQcm9taXNlPENvbnRhY3RbXT4ge1xuICAgIGNvbnN0IHBhZ2luYXRvciA9IHRoaXMuI2FwaUNsaWVudC5jb250YWN0c0xpc3QoKTtcbiAgICBjb25zdCBjb250YWN0cyA9IGF3YWl0IHBhZ2luYXRvci5mZXRjaCgpO1xuXG4gICAgcmV0dXJuIGNvbnRhY3RzLm1hcCgoYykgPT4gbmV3IENvbnRhY3QodGhpcy4jYXBpQ2xpZW50LCBjKSk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pZGVudGl0eVByb3ZlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYW4gaWRlbnRpdHkgcHJvb2ZcbiAgICovXG4gIGdldCBwcm92ZUlkZW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaWRlbnRpdHlQcm92ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBnaXZlbiBwcm9vZiBvZiBPSURDIGF1dGhlbnRpY2F0aW9uIGlzIHZhbGlkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaWRlbnRpdHlWZXJpZnl9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCB2ZXJpZmllcyBhIHByb29mIG9mIGlkZW50aXR5LCB0aHJvd2luZyBpZiBpbnZhbGlkXG4gICAqL1xuICBnZXQgdmVyaWZ5SWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5pZGVudGl0eVZlcmlmeS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCBieSBpdHMgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGdldE1mYVJlcXVlc3QobWZhSWQ6IE1mYUlkKTogTWZhUmVxdWVzdCB7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgbWZhSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlcXVlc3RzLlxuICAgKi9cbiAgYXN5bmMgbWZhUmVxdWVzdHMoKTogUHJvbWlzZTxNZmFSZXF1ZXN0W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50XG4gICAgICAubWZhTGlzdCgpXG4gICAgICAudGhlbigobWZhSW5mb3MpID0+IG1mYUluZm9zLm1hcCgobWZhSW5mbykgPT4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBtZmFJbmZvKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gZGVwb3NpdCAob3Igc3Rha2luZykgbWVzc2FnZS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNpZ25TdGFrZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgc3Rha2UgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgc3Rha2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zaWduU3Rha2UuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKS4gVGhlIGxpZmV0aW1lIG9mXG4gICAqIHRoZSBuZXcgc2Vzc2lvbiBpcyBzaWxlbnRseSB0cnVuY2F0ZWQgdG8gdGhhdCBvZiB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIG5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgZ2V0IGNyZWF0ZVNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZykgd2hvc2UgbGlmZXRpbWUgcG90ZW50aWFsbHlcbiAgICogZXh0ZW5kcyB0aGUgbGlmZXRpbWUgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbi4gIE1GQSBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRXh0ZW5kZWR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBuZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGdldCBjcmVhdGVFeHRlbmRlZFNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRXh0ZW5kZWQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSBhIHNlc3Npb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uUmV2b2tlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXZva2VzIGEgc2Vzc2lvblxuICAgKi9cbiAgZ2V0IHJldm9rZVNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uUmV2b2tlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgaGVhcnRiZWF0IC8gdXBjaGVjayByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaGVhcnRiZWF0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBzZW5kcyBhIGhlYXJ0YmVhdFxuICAgKi9cbiAgZ2V0IGhlYXJ0YmVhdCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmhlYXJ0YmVhdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0cy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRMaXN0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHBhZ2luYXRvciBvZiB1c2VyLWV4cG9ydCByZXF1ZXN0c1xuICAgKi9cbiAgZ2V0IGV4cG9ydHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0TGlzdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0RGVsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGEgdXNlci1leHBvcnQgcmVxdWVzdFxuICAgKi9cbiAgZ2V0IGRlbGV0ZUV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnREZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRJbml0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgcmVxdWVzdCByZXNwb25zZS5cbiAgICovXG4gIGdldCBpbml0RXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydEluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRDb21wbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHJlcXVlc3QgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgY29tcGxldGVFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0Q29tcGxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgb3JnLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXBkYXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCB1cGRhdGVzIGFuIG9yZyBhbmQgcmV0dXJucyB1cGRhdGVkIG9yZyBpbmZvcm1hdGlvblxuICAgKi9cbiAgZ2V0IHVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCBhIGZyZXNoIGtleS1pbXBvcnQga2V5LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuY3JlYXRlS2V5SW1wb3J0S2V5fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIGZyZXNoIGtleS1pbXBvcnQga2V5XG4gICAqL1xuICBnZXQgY3JlYXRlS2V5SW1wb3J0S2V5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuY3JlYXRlS2V5SW1wb3J0S2V5LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgb25lIG9yIG1vcmUga2V5cy4gVG8gdXNlIHRoaXMgZnVuY3Rpb25hbGl0eSwgeW91IG11c3QgZmlyc3QgY3JlYXRlIGFuXG4gICAqIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QgdXNpbmcgdGhlIGBAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNkay1rZXktaW1wb3J0YFxuICAgKiBsaWJyYXJ5LiBTZWUgdGhhdCBsaWJyYXJ5J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBBbiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgaW1wb3J0ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGltcG9ydEtleXMoYm9keTogSW1wb3J0S2V5UmVxdWVzdCk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmltcG9ydEtleXMoYm9keSk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG59XG4iXX0=