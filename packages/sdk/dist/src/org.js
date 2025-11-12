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
     * @param searchQuery Optional query string. If defined, all returned users will contain this string in their name or email.
     * @returns The list of users
     */
    async users(searchQuery) {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgUsersList(undefined, searchQuery).fetchAll();
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
     * Get user by email.
     *
     * Same as {@link ApiClient.orgUserGetByEmail}, see its documentation for more information.
     *
     * @returns A function that resolves to a user's info
     */
    get getUserByEmail() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUserGetByEmail.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Get user by OIDC ID.
     *
     * Same as {@link ApiClient.orgUserGetByOidc}, see its documentation for more information.
     *
     * @returns A function that resolves to a user's info
     */
    get getUserByOidc() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgUserGetByOidc.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsdUNBQW9DO0FBQ3BDLHdCQUEwQztBQUMxQyxxQ0FPa0I7QUF1SWxCOzs7O0dBSUc7QUFDSCxNQUFhLEdBQUc7SUFNZDs7O09BR0c7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksa0JBQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLGlCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLEtBQWE7UUEzQnRDLGlDQUFzQjtRQUMvQiw2QkFBYztRQUNkLDBCQUEwQjtRQUMxQiw0QkFBZ0I7UUF5QmQsdUJBQUEsSUFBSSxjQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUksa0JBQWMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQzNGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxhQUF3QztRQUN0RCxNQUFNLEdBQUcsR0FBRyxPQUFPLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7UUFDeEYsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMzQyxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsWUFB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c0JBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7Q0FDRjtBQXh0QkQsa0JBd3RCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgS2V5VHlwZSxcbiAgS2V5UHJvcGVydGllcyxcbiAgTm90aWZpY2F0aW9uRW5kcG9pbnRDb25maWd1cmF0aW9uLFxuICBQYWdlT3B0cyxcbiAgVXNlckluT3JnSW5mbyxcbiAgQXBpQ2xpZW50LFxuICBPcmdJbmZvLFxuICBNZmFJZCxcbiAgSW1wb3J0S2V5UmVxdWVzdCxcbiAgS2V5UG9saWN5LFxuICBRdWVyeU1ldHJpY3NSZXNwb25zZSxcbiAgT3JnTWV0cmljTmFtZSxcbiAgUXVlcnlNZXRyaWNzUmVxdWVzdCxcbiAgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoLFxuICBKc29uVmFsdWUsXG4gIEVkaXRQb2xpY3ksXG4gIEFkZHJlc3NNYXAsXG4gIENyZWF0ZU9yZ1JlcXVlc3QsXG4gIFJvbGVQb2xpY3ksXG4gIFBvbGljeUVuZ2luZUNvbmZpZ3VyYXRpb24sXG4gIE1mYVByb3RlY3RlZEFjdGlvbixcbiAgTWZhVHlwZSxcbn0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IENvbnRhY3QgfSBmcm9tIFwiLi9jb250YWN0XCI7XG5pbXBvcnQgeyBLZXksIE1mYVJlcXVlc3QsIFJvbGUgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHtcbiAgdHlwZSBOYW1lZEtleVBvbGljeSxcbiAgTmFtZWRQb2xpY3ksXG4gIHR5cGUgTmFtZWRSb2xlUG9saWN5LFxuICBOYW1lZFdhc21Qb2xpY3ksXG4gIHVwbG9hZFdhc21Qb2xpY3ksXG4gIHR5cGUgV2FzbVBvbGljeUluZm8sXG59IGZyb20gXCIuL3BvbGljeVwiO1xuXG4vKiogT3B0aW9ucyBwYXNlZCB0byBjcmVhdGVLZXkgYW5kIGRlcml2ZUtleSAqL1xuZXhwb3J0IHR5cGUgQ3JlYXRlS2V5UHJvcGVydGllcyA9IE9taXQ8S2V5UHJvcGVydGllcywgXCJwb2xpY3lcIj4gJiB7XG4gIC8qKlxuICAgKiBQb2xpY2llcyB0byBhcHBseSB0byB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogVGhpcyB0eXBlIG1ha2VzIGl0IHBvc3NpYmxlIHRvIGFzc2lnbiB2YWx1ZXMgbGlrZVxuICAgKiBgW0FsbG93RWlwMTkxU2lnbmluZ1BvbGljeV1gLCBidXQgcmVtYWlucyBiYWNrd2FyZHNcbiAgICogY29tcGF0aWJsZSB3aXRoIHByaW9yIHZlcnNpb25zIG9mIHRoZSBTREssIGluIHdoaWNoXG4gICAqIHRoaXMgcHJvcGVydHkgaGFkIHR5cGUgYFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIHwgbnVsbGAuXG4gICAqL1xuICBwb2xpY3k/OiBLZXlQb2xpY3kgfCB1bmtub3duW10gfCBudWxsO1xufTtcblxuLyoqIE9wdGlvbnMgcGFzc2VkIHRvIGltcG9ydEtleSBhbmQgZGVyaXZlS2V5ICovXG5leHBvcnQgdHlwZSBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzID0gQ3JlYXRlS2V5UHJvcGVydGllcyAmIHtcbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgcmV0dXJucyBhICdLZXknIG9iamVjdCBmb3IgYm90aCBuZXcgYW5kIGV4aXN0aW5nIGtleXMuXG4gICAqL1xuICBpZGVtcG90ZW50PzogYm9vbGVhbjtcbn07XG5cbi8qKiBPcHRpb25zIHBhc3NlZCB0byBkZXJpdmVNdWx0aXBsZUtleVR5cGVzICovXG5leHBvcnQgdHlwZSBEZXJpdmVNdWx0aXBsZUtleVR5cGVzUHJvcGVydGllcyA9IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMgJiB7XG4gIC8qKlxuICAgKiBUaGUgbWF0ZXJpYWxfaWQgb2YgdGhlIG1uZW1vbmljIHVzZWQgdG8gZGVyaXZlIG5ldyBrZXlzLlxuICAgKlxuICAgKiBJZiB0aGlzIGFyZ3VtZW50IGlzIHVuZGVmaW5lZCBvciBudWxsLCBhIG5ldyBtbmVtb25pYyBpcyBmaXJzdCBjcmVhdGVkXG4gICAqIGFuZCBhbnkgb3RoZXIgc3BlY2lmaWVkIHByb3BlcnRpZXMgYXJlIGFwcGxpZWQgdG8gaXQgKGluIGFkZGl0aW9uIHRvXG4gICAqIGJlaW5nIGFwcGxpZWQgdG8gdGhlIHNwZWNpZmllZCBrZXlzKS5cbiAgICpcbiAgICogVGhlIG5ld2x5IGNyZWF0ZWQgbW5lbW9uaWMtaWQgY2FuIGJlIHJldHJpZXZlZCBmcm9tIHRoZSBgZGVyaXZhdGlvbl9pbmZvYFxuICAgKiBwcm9wZXJ0eSBvZiB0aGUgYEtleUluZm9gIHZhbHVlIGZvciBhIHJlc3VsdGluZyBrZXkuXG4gICAqL1xuICBtbmVtb25pY19pZD86IHN0cmluZztcbn07XG5cbi8qKiBPcmdhbml6YXRpb24gaWQgKi9cbmV4cG9ydCB0eXBlIE9yZ0lkID0gc3RyaW5nO1xuXG4vKiogT3JnLXdpZGUgcG9saWN5ICovXG5leHBvcnQgdHlwZSBPcmdQb2xpY3kgPVxuICB8IFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5XG4gIHwgT2lkY0F1dGhTb3VyY2VzUG9saWN5XG4gIHwgT3JpZ2luQWxsb3dsaXN0UG9saWN5XG4gIHwgTWF4RGFpbHlVbnN0YWtlUG9saWN5XG4gIHwgV2ViQXV0aG5SZWx5aW5nUGFydGllc1BvbGljeVxuICB8IEV4Y2x1c2l2ZUtleUFjY2Vzc1BvbGljeTtcblxuLyoqXG4gKiBXaGV0aGVyIHRvIGVuZm9yY2UgZXhjbHVzaXZlIGFjY2VzcyB0byBrZXlzLiAgQ29uY3JldGVseSxcbiAqIC0gaWYgXCJMaW1pdFRvS2V5T3duZXJcIiBpcyBzZXQsIG9ubHkga2V5IG93bmVycyBhcmUgcGVybWl0dGVkIHRvIGFjY2Vzc1xuICogICB0aGVpciBrZXlzIGZvciBzaWduaW5nOiBhIHVzZXIgc2Vzc2lvbiAobm90IGEgcm9sZSBzZXNzaW9uKSBpcyByZXF1aXJlZFxuICogICBmb3Igc2lnbmluZywgYW5kIGFkZGluZyBhIGtleSB0byBhIHJvbGUgaXMgbm90IHBlcm1pdHRlZC5cbiAqIC0gaWYgXCJMaW1pdFRvU2luZ2xlUm9sZVwiIGlzIHNldCwgZWFjaCBrZXkgaXMgcGVybWl0dGVkIHRvIGJlIGluIGF0IG1vc3RcbiAqICAgb25lIHJvbGUsIGFuZCBzaWduaW5nIGlzIG9ubHkgYWxsb3dlZCB3aGVuIGF1dGhlbnRpY2F0aW5nIHVzaW5nIGEgcm9sZSBzZXNzaW9uIHRva2VuLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEV4Y2x1c2l2ZUtleUFjY2Vzc1BvbGljeSB7XG4gIEV4Y2x1c2l2ZUtleUFjY2VzczogXCJMaW1pdFRvS2V5T3duZXJcIiB8IFwiTGltaXRUb1NpbmdsZVJvbGVcIjtcbn1cblxuLyoqXG4gKiBUaGUgc2V0IG9mIHJlbHlpbmcgcGFydGllcyB0byBhbGxvdyBmb3Igd2ViYXV0aG4gcmVnaXN0cmF0aW9uXG4gKiBUaGVzZSBjb3JyZXNwb25kIHRvIGRvbWFpbnMgZnJvbSB3aGljaCBicm93c2VycyBjYW4gc3VjY2Vzc2Z1bGx5IGNyZWF0ZSBjcmVkZW50aWFscy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzUG9saWN5IHtcbiAgV2ViQXV0aG5SZWx5aW5nUGFydGllczogeyBpZD86IHN0cmluZzsgbmFtZTogc3RyaW5nIH1bXTtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhbiBhbGxvd2xpc3Qgb2YgT0lEQyBJc3N1ZXJzIGFuZCBhdWRpZW5jZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBhdXRoZW50aWNhdGUgaW50byB0aGlzIG9yZy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJPaWRjQXV0aFNvdXJjZXNcIjogeyBcImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbVwiOiBbIFwiMTIzNC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbVwiIF19fVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoU291cmNlc1BvbGljeSB7XG4gIE9pZGNBdXRoU291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10gfCBJc3N1ZXJDb25maWc+O1xufVxuXG4vKiogT0lEQyBpc3N1ZXIgY29uZmlndXJhdGlvbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJc3N1ZXJDb25maWcge1xuICAvKiogVGhlIHNldCBvZiBhdWRpZW5jZXMgc3VwcG9ydGVkIGZvciB0aGlzIGlzc3VlciAqL1xuICBhdWRzOiBzdHJpbmdbXTtcblxuICAvKiogVGhlIGtpbmRzIG9mIHVzZXIgYWxsb3dlZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGlzIGlzc3VlciAqL1xuICB1c2Vyczogc3RyaW5nW107XG5cbiAgLyoqIE9wdGlvbmFsIG5pY2tuYW1lIGZvciB0aGlzIHByb3ZpZGVyICovXG4gIG5pY2tuYW1lPzogc3RyaW5nO1xuXG4gIC8qKiBXaGV0aGVyIHRvIG1ha2UgdGhpcyBpc3N1ZXIgcHVibGljICovXG4gIHB1YmxpYz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogT25seSBhbGxvdyByZXF1ZXN0cyBmcm9tIHRoZSBzcGVjaWZpZWQgb3JpZ2lucy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJPcmlnaW5BbGxvd2xpc3RcIjogXCIqXCJ9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JpZ2luQWxsb3dsaXN0UG9saWN5IHtcbiAgT3JpZ2luQWxsb3dsaXN0OiBzdHJpbmdbXSB8IFwiKlwiO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHNpZ25pbmcgdG8gc3BlY2lmaWMgc291cmNlIElQIGFkZHJlc3Nlcy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJTb3VyY2VJcEFsbG93bGlzdFwiOiBbXCIxMC4xLjIuMy84XCIsIFwiMTY5LjI1NC4xNy4xLzE2XCJdfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5IHtcbiAgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSBudW1iZXIgb2YgdW5zdGFrZXMgcGVyIGRheS5cbiAqXG4gKiBAZXhhbXBsZSB7XCJNYXhEYWlseVVuc3Rha2VcIjogNSB9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWF4RGFpbHlVbnN0YWtlUG9saWN5IHtcbiAgTWF4RGFpbHlVbnN0YWtlOiBudW1iZXI7XG59XG5cbi8qKlxuICogRmlsdGVyIHRvIHVzZSB3aGVuIGxpc3Rpbmcga2V5c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleUZpbHRlciB7XG4gIC8qKiBGaWx0ZXIgYnkga2V5IHR5cGUgKi9cbiAgdHlwZT86IEtleVR5cGU7XG4gIC8qKiBGaWx0ZXIgYnkga2V5IG93bmVyICovXG4gIG93bmVyPzogc3RyaW5nO1xuICAvKiogU2VhcmNoIGJ5IGtleSdzIG1hdGVyaWFsIGlkIGFuZCBtZXRhZGF0YSAqL1xuICBzZWFyY2g/OiBzdHJpbmc7XG4gIC8qKiBQYWdpbmF0aW9uIG9wdGlvbnMgKi9cbiAgcGFnZT86IFBhZ2VPcHRzO1xufVxuXG4vKipcbiAqIEFuIG9yZ2FuaXphdGlvbi5cbiAqXG4gKiBFeHRlbmRzIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBhbmQgcHJvdmlkZXMgYSBmZXcgb3JnLXNwZWNpZmljIG1ldGhvZHMgb24gdG9wLlxuICovXG5leHBvcnQgY2xhc3MgT3JnIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAjb3JnSWQ6IE9yZ0lkO1xuICAvKiogVGhlIG9yZyBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YT86IE9yZ0luZm87XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBvcmcgaWRcbiAgICogQGV4YW1wbGUgT3JnI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgZ2V0IGlkKCk6IE9yZ0lkIHtcbiAgICByZXR1cm4gdGhpcy4jb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgb3JnLiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBPcmdJbmZvIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ1xuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG9yZ0lkOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IG9yZ0lkID09PSBhcGlDbGllbnQub3JnSWQgPyBhcGlDbGllbnQgOiBhcGlDbGllbnQud2l0aFRhcmdldE9yZyhvcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG9yZ2FuaXphdGlvbi4gVGhlIG5ldyBvcmcgaXMgYSBjaGlsZCBvZiB0aGVcbiAgICogY3VycmVudCBvcmcgYW5kIGluaGVyaXRzIGl0cyBrZXktZXhwb3J0IHBvbGljeS4gVGhlIG5ldyBvcmdcbiAgICogaXMgY3JlYXRlZCB3aXRoIG9uZSBvd25lciwgdGhlIGNhbGxlciBvZiB0aGlzIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWVPclJlcXVlc3QgVGhlIG5hbWUgb2YgdGhlIG5ldyBvcmcgb3IgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG5ldyBvcmcuXG4gICAqIEByZXR1cm5zIEluZm9ybWF0aW9uIGFib3V0IHRoZSBuZXdseSBjcmVhdGVkIG9yZy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZU9yZyhuYW1lT3JSZXF1ZXN0OiBzdHJpbmcgfCBDcmVhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgcmVxID0gdHlwZW9mIG5hbWVPclJlcXVlc3QgPT09IFwic3RyaW5nXCIgPyB7IG5hbWU6IG5hbWVPclJlcXVlc3QgfSA6IG5hbWVPclJlcXVlc3Q7XG4gICAgaWYgKCEvXlthLXpBLVowLTlfXXszLDMwfSQvLnRlc3QocmVxLm5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ0NyZWF0ZU9yZyhyZXEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IG9yZyBtZXRyaWNzLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0cmljTmFtZSBUaGUgbWV0cmljIG5hbWUuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIHN0YXJ0IGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLlxuICAgKiBAcGFyYW0gb3B0IE90aGVyIG9wdGlvbmFsIGFyZ3VtZW50c1xuICAgKiBAcGFyYW0gb3B0LmVuZF90aW1lIFRoZSBlbmQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guIElmIG9taXR0ZWQsIGRlZmF1bHRzIHRvICdub3cnLlxuICAgKiBAcGFyYW0gb3B0LnBlcmlvZCBUaGUgZ3JhbnVsYXJpdHksIGluIHNlY29uZHMsIG9mIHRoZSByZXR1cm5lZCBkYXRhIHBvaW50cy5cbiAgICogICBUaGlzIHZhbHVlIGlzIGF1dG9tYXRpY2FsbHkgcm91bmRlZCB1cCB0byBhIG11bHRpcGxlIG9mIDM2MDAgKGkuZS4sIDEgaG91cikuXG4gICAqICAgSWYgb21pdHRlZCwgZGVmYXVsdHMgdG8gdGhlIGR1cmF0aW9uIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCB0aGUgZW5kIGRhdGUuXG4gICAqICAgTXVzdCBiZSBubyBsZXNzIHRoYW4gMSBob3VyLCBpLmUuLCAzNjAwIHNlY29uZHMuIEFkZGl0aW9uYWxseSwgdGhpcyBwZXJpb2QgbXVzdCBub3RcbiAgICogICBkaXZpZGUgdGhlIGBlbmRUaW1lIC0gc3RhcnRUaW1lYCBwZXJpb2QgaW50byBtb3JlIHRoYW4gMTAwIGRhdGEgcG9pbnRzLlxuICAgKiBAcGFyYW0gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBNZXRyaWMgdmFsdWVzIChkYXRhIHBvaW50cykgZm9yIHRoZSByZXF1ZXN0ZWQgcGVyaW9kcy5cbiAgICovXG4gIGFzeW5jIHF1ZXJ5TWV0cmljcyhcbiAgICBtZXRyaWNOYW1lOiBPcmdNZXRyaWNOYW1lLFxuICAgIHN0YXJ0VGltZTogRXBvY2hUaW1lU3RhbXAsXG4gICAgb3B0PzogT21pdDxRdWVyeU1ldHJpY3NSZXF1ZXN0LCBcIm1ldHJpY19uYW1lXCIgfCBcInN0YXJ0X3RpbWVcIj4sXG4gICAgcGFnZU9wdHM/OiBQYWdlT3B0cyxcbiAgKTogUHJvbWlzZTxRdWVyeU1ldHJpY3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IHJlcTogUXVlcnlNZXRyaWNzUmVxdWVzdCA9IHtcbiAgICAgIG1ldHJpY19uYW1lOiBtZXRyaWNOYW1lLFxuICAgICAgc3RhcnRfdGltZTogc3RhcnRUaW1lLFxuICAgICAgLi4ub3B0LFxuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdRdWVyeU1ldHJpY3MocmVxLCBwYWdlT3B0cykuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdHZXQoKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBvcmcgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgcG9saWN5IGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxPcmdQb2xpY3lbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IE9yZ1BvbGljeVtdKSB7XG4gICAgY29uc3QgcCA9IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgbm90aWZpY2F0aW9uIGVuZHBvaW50cyBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG5vdGlmaWNhdGlvbl9lbmRwb2ludHMgRW5kcG9pbnRzLlxuICAgKi9cbiAgYXN5bmMgc2V0Tm90aWZpY2F0aW9uRW5kcG9pbnRzKG5vdGlmaWNhdGlvbl9lbmRwb2ludHM6IE5vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbltdKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoe1xuICAgICAgbm90aWZpY2F0aW9uX2VuZHBvaW50cyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgcmVxdWlyZWQgTUZBIHR5cGVzIGZvciBhY3Rpb25zIGltcGxpY2l0bHkgcmVxdWlyaW5nIE1GQSAoc2VlIHtAbGluayBNZmFQcm90ZWN0ZWRBY3Rpb259KS5cbiAgICpcbiAgICogQHBhcmFtIGFsbG93ZWRfbWZhX3R5cGVzIEFzc2lnbm1lbnQgb2YgTUZBIHR5cGVzIHRvIGFjdGlvbnMgdGhhdCBpbXBsaWNpdGx5IHJlcXVpcmUgTUZBLlxuICAgKi9cbiAgYXN5bmMgc2V0QWxsb3dlZE1mYVR5cGVzKGFsbG93ZWRfbWZhX3R5cGVzOiBQYXJ0aWFsPFJlY29yZDxNZmFQcm90ZWN0ZWRBY3Rpb24sIE1mYVR5cGVbXT4+KSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoe1xuICAgICAgYWxsb3dlZF9tZmFfdHlwZXMsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNpZ25pbmcga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleS4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIHNldCBvbiB0aGUgbmV3IGtleS5cbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5KHR5cGU6IEtleVR5cGUsIG93bmVySWQ/OiBzdHJpbmcsIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzQ3JlYXRlKHR5cGUsIDEsIG93bmVySWQsIHByb3BzKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleXNbMF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgc2lnbmluZyBrZXlzLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXlzLiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgdG8gc2V0IG9uIHRoZSBuZXcga2V5cy5cbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5cyhcbiAgICB0eXBlOiBLZXlUeXBlLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgb3duZXJJZD86IHN0cmluZyxcbiAgICBwcm9wcz86IENyZWF0ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNDcmVhdGUodHlwZSwgY291bnQsIG93bmVySWQsIHByb3BzKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IChmaXJzdC1wYXJ0eSkgdXNlciBpbiB0aGUgb3JnYW5pemF0aW9uIGFuZCBzZW5kcyBhbiBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJJbnZpdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBpbnZpdGVzIGEgdXNlclxuICAgKi9cbiAgZ2V0IGNyZWF0ZVVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VySW52aXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGEgdXNlclxuICAgKi9cbiAgZ2V0IGRlbGV0ZVVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyRGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgT0lEQyB1c2VyLiBUaGlzIGNhbiBiZSBhIGZpcnN0LXBhcnR5IFwiTWVtYmVyXCIgb3IgdGhpcmQtcGFydHkgXCJBbGllblwiLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckNyZWF0ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIGFuIE9JREMgdXNlciwgcmVzb2x2aW5nIHRvIHRoZSBuZXcgdXNlcidzIElEXG4gICAqL1xuICBnZXQgY3JlYXRlT2lkY1VzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyQ3JlYXRlT2lkYy5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGVPaWRjfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhbiBPSURDIHVzZXJcbiAgICovXG4gIGdldCBkZWxldGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGVPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gc2VhcmNoUXVlcnkgT3B0aW9uYWwgcXVlcnkgc3RyaW5nLiBJZiBkZWZpbmVkLCBhbGwgcmV0dXJuZWQgdXNlcnMgd2lsbCBjb250YWluIHRoaXMgc3RyaW5nIGluIHRoZWlyIG5hbWUgb3IgZW1haWwuXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHVzZXJzXG4gICAqL1xuICBhc3luYyB1c2VycyhzZWFyY2hRdWVyeT86IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mb1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVc2Vyc0xpc3QodW5kZWZpbmVkLCBzZWFyY2hRdWVyeSkuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24gKHBhZ2luYXRlZCkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2Vyc0xpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcGFnaW5hdGVkIGxpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGdldCB1c2Vyc1BhZ2luYXRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyR2V0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlciBieSBlbWFpbC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJHZXRCeUVtYWlsfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXJCeUVtYWlsKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckdldEJ5RW1haWwuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IE9JREMgSUQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0QnlPaWRjfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXJCeU9pZGMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyR2V0QnlPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgYSB1c2VyIGluIHRoaXMgb3JnXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byBlbmFibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGVuYWJsZVVzZXIodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKHVzZXJJZCwgeyBkaXNhYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSBhIHVzZXIgaW4gdGhpcyBvcmdcbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIGRpc2FibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGRpc2FibGVVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCh1c2VySWQsIHsgZGlzYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBhY2Nlc3NpYmxlIGtleXMgaW4gdGhlIG9yZ2FuaXphdGlvblxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHMgT3B0aW9uYWwgZmlsdGVyaW5nIHByb3BlcnRpZXMuXG4gICAqIEByZXR1cm5zIFRoZSBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwcm9wcz86IEtleUZpbHRlcik6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLiNhcGlDbGllbnQua2V5c0xpc3QoXG4gICAgICBwcm9wcz8udHlwZSxcbiAgICAgIHByb3BzPy5wYWdlLFxuICAgICAgcHJvcHM/Lm93bmVyLFxuICAgICAgcHJvcHM/LnNlYXJjaCxcbiAgICApO1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBwYWdpbmF0b3IuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyBjcmVhdGVSb2xlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSWQgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUNyZWF0ZShuYW1lKTtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJvbGUgYnkgaWQgb3IgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgZ2V0Um9sZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdGhlIHJvbGVzIGluIHRoZSBvcmdcbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIHBhZ2luYXRvciBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSByb2xlc1xuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZTogUGFnZU9wdHMpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiByb2xlcy5tYXAoKHIpID0+IG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgcG9saWN5IHJ1bGVzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVBvbGljeTxUeXBlIGV4dGVuZHMgXCJLZXlcIiB8IFwiUm9sZVwiPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogVHlwZSxcbiAgICBydWxlczogVHlwZSBleHRlbmRzIFwiS2V5XCIgPyBLZXlQb2xpY3kgOiBSb2xlUG9saWN5LFxuICApOiBQcm9taXNlPFR5cGUgZXh0ZW5kcyBcIktleVwiID8gTmFtZWRLZXlQb2xpY3kgOiBOYW1lZFJvbGVQb2xpY3k+IHtcbiAgICBjb25zdCBwb2xpY3lJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUNyZWF0ZShuYW1lLCB0eXBlLCBydWxlcyk7XG4gICAgY29uc3QgcG9saWN5ID0gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvKTtcbiAgICByZXR1cm4gcG9saWN5IGFzIFR5cGUgZXh0ZW5kcyBcIktleVwiID8gTmFtZWRLZXlQb2xpY3kgOiBOYW1lZFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbmFtZWQgcG9saWN5IGJ5IGlkIG9yIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3lJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcG9saWN5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGdldFBvbGljeShwb2xpY3lJZDogc3RyaW5nKTogUHJvbWlzZTxOYW1lZFBvbGljeT4ge1xuICAgIGNvbnN0IHBvbGljeUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5R2V0KHBvbGljeUlkLCBcImxhdGVzdFwiKTtcbiAgICByZXR1cm4gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB0aGUgbmFtZWQgcG9saWNpZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIHBhZ2luYXRvciBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWNpZXMuXG4gICAqL1xuICBhc3luYyBwb2xpY2llcyhwYWdlOiBQYWdlT3B0cyk6IFByb21pc2U8TmFtZWRQb2xpY3lbXT4ge1xuICAgIGNvbnN0IHBvbGljaWVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljaWVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBwb2xpY2llcy5tYXAoKHApID0+IE5hbWVkUG9saWN5LmZyb21JbmZvKHRoaXMuI2FwaUNsaWVudCwgcCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBXYXNtIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgV2FzbSBwb2xpY3kgb2JqZWN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhc21Qb2xpY3kobmFtZTogc3RyaW5nLCBwb2xpY3k6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPE5hbWVkV2FzbVBvbGljeT4ge1xuICAgIGNvbnN0IGhhc2ggPSBhd2FpdCB1cGxvYWRXYXNtUG9saWN5KHRoaXMuI2FwaUNsaWVudCwgcG9saWN5KTtcbiAgICBjb25zdCBwb2xpY3lJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUNyZWF0ZShuYW1lLCBcIldhc21cIiwgW1xuICAgICAge1xuICAgICAgICBoYXNoLFxuICAgICAgfSxcbiAgICBdKTtcbiAgICByZXR1cm4gbmV3IE5hbWVkV2FzbVBvbGljeSh0aGlzLiNhcGlDbGllbnQsIHBvbGljeUluZm8gYXMgV2FzbVBvbGljeUluZm8pO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIHRoZSBQb2xpY3kgRW5naW5lIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBvcmcuICovXG4gIGFzeW5jIHBvbGljeUVuZ2luZUNvbmZpZ3VyYXRpb24oKTogUHJvbWlzZTxQb2xpY3lFbmdpbmVDb25maWd1cmF0aW9uIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5wb2xpY3lfZW5naW5lX2NvbmZpZ3VyYXRpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBQb2xpY3kgRW5naW5lIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBvcmcuXG4gICAqIE5vdGUgdGhhdCB0aGlzIG92ZXJ3cml0ZXMgYW55IGV4aXN0aW5nIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBjb25maWdzIFRoZSBQb2xpY3kgRW5naW5lIGNvbmZpZ3VyYXRpb24uXG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3lFbmdpbmVDb25maWd1cmF0aW9uKGNvbmZpZ3M6IFBvbGljeUVuZ2luZUNvbmZpZ3VyYXRpb24pIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7XG4gICAgICBwb2xpY3lfZW5naW5lX2NvbmZpZ3VyYXRpb246IGNvbmZpZ3MsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEga2V5IG9mIHRoZSBnaXZlbiB0eXBlIHVzaW5nIHRoZSBnaXZlbiBkZXJpdmF0aW9uIHBhdGggYW5kIG1uZW1vbmljLlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5IHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblBhdGggTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRoIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBuZXdseSBkZXJpdmVkIGtleSBvciB1bmRlZmluZWQgaWYgaXQgYWxyZWFkeSBleGlzdHMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXkoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aDogc3RyaW5nLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5IHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmRlcml2ZUtleXModHlwZSwgW2Rlcml2YXRpb25QYXRoXSwgbW5lbW9uaWNJZCwgcHJvcHMpKVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBzZXQgb2Yga2V5cyBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRocyBhbmQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXlzIHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblBhdGhzIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aHMgdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gbW5lbW9uaWNJZCBtYXRlcmlhbF9pZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleXMoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNEZXJpdmUodHlwZSwgZGVyaXZhdGlvblBhdGhzLCBtbmVtb25pY0lkLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBlaXRoZXIgYSBuZXcgb3IgZXhpc3RpbmcgbW5lbW9uaWMgdG8gZGVyaXZlIGtleXMgb2Ygb25lIG9yIG1vcmVcbiAgICogc3BlY2lmaWVkIHR5cGVzIHZpYSBzcGVjaWZpZWQgZGVyaXZhdGlvbiBwYXRocy5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzIEEgbGlzdCBvZiBgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoYCBvYmplY3RzIHNwZWNpZnlpbmcgdGhlIGtleXMgdG8gYmUgZGVyaXZlZFxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlTXVsdGlwbGVLZXlUeXBlcyhcbiAgICBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRoczogS2V5VHlwZUFuZERlcml2YXRpb25QYXRoW10sXG4gICAgcHJvcHM/OiBEZXJpdmVNdWx0aXBsZUtleVR5cGVzUHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0Rlcml2ZU11bHRpKGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpZC5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGtleS5cbiAgICovXG4gIGFzeW5jIGdldEtleShrZXlJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldChrZXlJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaXRzIG1hdGVyaWFsIGlkIChlLmcuLCBhZGRyZXNzKS5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIGtleSB0eXBlLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxJZCBUaGUgbWF0ZXJpYWwgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXlCeU1hdGVyaWFsSWQoa2V5VHlwZTogS2V5VHlwZSwgbWF0ZXJpYWxJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldEJ5TWF0ZXJpYWxJZChrZXlUeXBlLCBtYXRlcmlhbElkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIGNvbnRhY3QuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIGZvciB0aGUgbmV3IGNvbnRhY3QuXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuXG4gICAqIEBwYXJhbSBtZXRhZGF0YSBNZXRhZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuIEludGVuZGVkIGZvciB1c2UgYXMgYSBkZXNjcmlwdGlvbi5cbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIGVkaXQgcG9saWN5IGZvciB0aGUgY29udGFjdCwgZGV0ZXJtaW5pbmcgd2hlbiBhbmQgd2hvIGNhbiBlZGl0IHRoaXMgY29udGFjdC5cbiAgICogQHJldHVybnMgVGhlIG5ld2x5LWNyZWF0ZWQgY29udGFjdC5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNvbnRhY3QoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFkZHJlc3Nlcz86IEFkZHJlc3NNYXAsXG4gICAgbWV0YWRhdGE/OiBKc29uVmFsdWUsXG4gICAgZWRpdFBvbGljeT86IEVkaXRQb2xpY3ksXG4gICk6IFByb21pc2U8Q29udGFjdD4ge1xuICAgIGNvbnN0IGNvbnRhY3RJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RDcmVhdGUobmFtZSwgYWRkcmVzc2VzLCBtZXRhZGF0YSwgZWRpdFBvbGljeSk7XG5cbiAgICByZXR1cm4gbmV3IENvbnRhY3QodGhpcy4jYXBpQ2xpZW50LCBjb250YWN0SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgY29udGFjdCBieSBpdHMgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBjb250YWN0SWQgVGhlIGlkIG9mIHRoZSBjb250YWN0IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBnZXRDb250YWN0KGNvbnRhY3RJZDogc3RyaW5nKTogUHJvbWlzZTxDb250YWN0PiB7XG4gICAgY29uc3QgY29udGFjdEluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuY29udGFjdEdldChjb250YWN0SWQpO1xuXG4gICAgcmV0dXJuIG5ldyBDb250YWN0KHRoaXMuI2FwaUNsaWVudCwgY29udGFjdEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgY29udGFjdHMgaW4gdGhlIG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQWxsIGNvbnRhY3RzLlxuICAgKi9cbiAgYXN5bmMgY29udGFjdHMoKTogUHJvbWlzZTxDb250YWN0W10+IHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLiNhcGlDbGllbnQuY29udGFjdHNMaXN0KCk7XG4gICAgY29uc3QgY29udGFjdHMgPSBhd2FpdCBwYWdpbmF0b3IuZmV0Y2goKTtcblxuICAgIHJldHVybiBjb250YWN0cy5tYXAoKGMpID0+IG5ldyBDb250YWN0KHRoaXMuI2FwaUNsaWVudCwgYykpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaWRlbnRpdHlQcm92ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGFuIGlkZW50aXR5IHByb29mXG4gICAqL1xuICBnZXQgcHJvdmVJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmlkZW50aXR5UHJvdmUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgZ2l2ZW4gcHJvb2Ygb2YgT0lEQyBhdXRoZW50aWNhdGlvbiBpcyB2YWxpZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmlkZW50aXR5VmVyaWZ5fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgdmVyaWZpZXMgYSBwcm9vZiBvZiBpZGVudGl0eSwgdGhyb3dpbmcgaWYgaW52YWxpZFxuICAgKi9cbiAgZ2V0IHZlcmlmeUlkZW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaWRlbnRpdHlWZXJpZnkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgTUZBIHJlcXVlc3QgSURcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBnZXRNZmFSZXF1ZXN0KG1mYUlkOiBNZmFJZCk6IE1mYVJlcXVlc3Qge1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIG1mYUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgTUZBIHJlcXVlc3RzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0cy5cbiAgICovXG4gIGFzeW5jIG1mYVJlcXVlc3RzKCk6IFByb21pc2U8TWZhUmVxdWVzdFtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudFxuICAgICAgLm1mYUxpc3QoKVxuICAgICAgLnRoZW4oKG1mYUluZm9zKSA9PiBtZmFJbmZvcy5tYXAoKG1mYUluZm8pID0+IG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgbWZhSW5mbykpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIGRlcG9zaXQgKG9yIHN0YWtpbmcpIG1lc3NhZ2UuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zaWduU3Rha2V9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHN0YWtlIHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IHN0YWtlKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2lnblN0YWtlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZykuIFRoZSBsaWZldGltZSBvZlxuICAgKiB0aGUgbmV3IHNlc3Npb24gaXMgc2lsZW50bHkgdHJ1bmNhdGVkIHRvIHRoYXQgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25DcmVhdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBuZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGdldCBjcmVhdGVTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpIHdob3NlIGxpZmV0aW1lIHBvdGVudGlhbGx5XG4gICAqIGV4dGVuZHMgdGhlIGxpZmV0aW1lIG9mIHRoZSBjdXJyZW50IHNlc3Npb24uICBNRkEgaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUV4dGVuZGVkfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gbmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBnZXQgY3JlYXRlRXh0ZW5kZWRTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUV4dGVuZGVkLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgYSBzZXNzaW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvblJldm9rZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmV2b2tlcyBhIHNlc3Npb25cbiAgICovXG4gIGdldCByZXZva2VTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvblJldm9rZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIGhlYXJ0YmVhdCAvIHVwY2hlY2sgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmhlYXJ0YmVhdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgc2VuZHMgYSBoZWFydGJlYXRcbiAgICovXG4gIGdldCBoZWFydGJlYXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5oZWFydGJlYXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3Qgb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdHMuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0TGlzdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBwYWdpbmF0b3Igb2YgdXNlci1leHBvcnQgcmVxdWVzdHNcbiAgICovXG4gIGdldCBleHBvcnRzKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydExpc3QuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydERlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhIHVzZXItZXhwb3J0IHJlcXVlc3RcbiAgICovXG4gIGdldCBkZWxldGVFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0RGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0SW5pdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHJlcXVlc3QgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgaW5pdEV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRJbml0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0Q29tcGxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXF1ZXN0IHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IGNvbXBsZXRlRXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydENvbXBsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIG9yZy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VwZGF0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgdXBkYXRlcyBhbiBvcmcgYW5kIHJldHVybnMgdXBkYXRlZCBvcmcgaW5mb3JtYXRpb25cbiAgICovXG4gIGdldCB1cGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcXVlc3QgYSBmcmVzaCBrZXktaW1wb3J0IGtleS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmNyZWF0ZUtleUltcG9ydEtleX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBmcmVzaCBrZXktaW1wb3J0IGtleVxuICAgKi9cbiAgZ2V0IGNyZWF0ZUtleUltcG9ydEtleSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmNyZWF0ZUtleUltcG9ydEtleS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0IG9uZSBvciBtb3JlIGtleXMuIFRvIHVzZSB0aGlzIGZ1bmN0aW9uYWxpdHksIHlvdSBtdXN0IGZpcnN0IGNyZWF0ZSBhblxuICAgKiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0IHVzaW5nIHRoZSBgQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGsta2V5LWltcG9ydGBcbiAgICogbGlicmFyeS4gU2VlIHRoYXQgbGlicmFyeSdzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgQW4gZW5jcnlwdGVkIGtleS1pbXBvcnQgcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGltcG9ydGVkIGtleXMuXG4gICAqL1xuICBhc3luYyBpbXBvcnRLZXlzKGJvZHk6IEltcG9ydEtleVJlcXVlc3QpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5pbXBvcnRLZXlzKGJvZHkpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxufVxuIl19