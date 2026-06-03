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
        // Backwards compatibility aliases for Named Wasm Policy
        /**
         * Create a new Wasm policy.
         *
         * @param name The name of the policy.
         * @param policy The Wasm policy object.
         * @param acl Optional list of policy access control entries.
         * @returns The new policy.
         */
        this.createWasmPolicy = this.createWasmFunction;
        /** @returns the Policy Engine configuration for the org. */
        this.policyEngineConfiguration = this.c2fConfiguration;
        /**
         * Set the Policy Engine configuration for the org.
         * Note that this overwrites any existing configuration.
         *
         * @param configs The Policy Engine configuration.
         */
        this.setPolicyEngineConfiguration = this.setC2FConfiguration;
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
            ...opt,
            start_time: startTime,
            // Must set end_time before fetchAll: without it the backend defaults to now()
            // on each page request, and a changing window invalidates the pagination token.
            end_time: opt?.end_time ?? Math.floor(Date.now() / 1000),
        };
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgQueryMetrics(req, pageOpts).fetchAll();
    }
    /**
     * Query the org audit log.
     *
     * @param startTime The start date in seconds since unix epoch.
     * @param opt Other optional arguments
     * @param opt.end_time The end date in seconds since unix epoch. Defaults to 'now'.
     * @param opt.events Filter by event name. If omitted, all events are included.
     * @param pageOpts Pagination options. Defaults to fetching the entire result set.
     * @returns Matching audit log entries.
     */
    async queryAuditLog(startTime, opt, pageOpts) {
        const req = {
            ...opt,
            start_time: startTime,
            // Must set end_time before fetchAll: without it the backend defaults to now()
            // on each page request, and a changing window invalidates the pagination token.
            end_time: opt?.end_time ?? Math.floor(Date.now() / 1000),
        };
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgQueryAuditLog(req, pageOpts).fetchAll();
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
    /**
     * Enable the org.
     *
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async enable(opts) {
        return await this.update({ enabled: true }, opts?.mfaReceipt);
    }
    /**
     * Disable the org.
     *
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async disable(opts) {
        return await this.update({ enabled: false }, opts?.mfaReceipt);
    }
    /** @returns the policy for the org. */
    async policy() {
        const data = await this.fetch();
        return (data.policy ?? []);
    }
    /** @returns the sign policy for the org. */
    async signPolicy() {
        const data = await this.fetch();
        return (data.sign_policy ?? []);
    }
    /**
     * Set the policy for the org.
     *
     * @param policy The new policy for the org.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setPolicy(policy, opts) {
        const p = policy;
        return await this.update({ policy: p }, opts?.mfaReceipt);
    }
    /**
     * Set the edit policy for the org.
     *
     * @param editPolicy The new edit policy for the org.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setEditPolicy(editPolicy, opts) {
        return await this.update({ edit_policy: editPolicy }, opts?.mfaReceipt);
    }
    /**
     * Set the sign policy for the org.
     *
     * This is a global sign policy that applies to every sign operation (every key, every role) in the org.
     * It is analogous to how role policies apply to all sign requests performed by the corresponding role sessions.
     *
     * @param policy The new policy for the org.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setSignPolicy(policy, opts) {
        return await this.update({ sign_policy: policy }, opts?.mfaReceipt);
    }
    /**
     * Retrieve the organization's extended properties (uncommon features not used by most users).
     *
     * @returns The extended properties
     */
    async getExtendedProperties() {
        const data = await this.fetch();
        return data.ext_data ? data.ext_data : null;
    }
    /**
     * Update the organization's extended properties (uncommon features not used by most users).
     *
     * @param props The new properties.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setExtendedProperties(props, opts) {
        return await this.update({ ext_props: props }, opts?.mfaReceipt);
    }
    /**
     * Update the per-alien key count threshold, which, once exceeded, disallows further key creation by alien users.
     *
     * This setting is checked only when an alien user requests to create or import a new key.
     * In other words, org admins can still assign unlimited number of keys to their alien users.
     *
     * @param alienKeyCountThreshold The new key count threshold.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setAlienKeyCountThreshold(alienKeyCountThreshold, opts) {
        const data = { ...((await this.getExtendedProperties()) ?? {}) };
        // erase the metadata that cannot be updated
        data.created = undefined;
        data.last_modified = undefined;
        // update 'alien_key_count_threshold' and keep everything else the same
        data.alien_key_count_threshold = alienKeyCountThreshold;
        return await this.update({ ext_props: data }, opts?.mfaReceipt);
    }
    /**
     * Set the notification endpoints for the org.
     *
     * @param notification_endpoints Endpoints.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setNotificationEndpoints(notification_endpoints, opts) {
        return await this.update({ notification_endpoints }, opts?.mfaReceipt);
    }
    /**
     * Set required MFA types for actions implicitly requiring MFA (see {@link MfaProtectedAction}).
     *
     * @param allowed_mfa_types Assignment of MFA types to actions that implicitly require MFA.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setAllowedMfaTypes(allowed_mfa_types, opts) {
        return await this.update({ allowed_mfa_types }, opts?.mfaReceipt);
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
     * @param acl Optional list of policy access control entries.
     * @returns The new policy.
     */
    async createPolicy(name, type, rules, acl) {
        const policyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").policyCreate(name, type, rules, acl);
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
     * Get a Confidential Cloud Function by name or named policy ID.
     *
     * @param functionId The name or named policy ID of the function to get.
     * @returns The C2F function.
     * @throws if name or ID is not associated to a C2F function (i.e. the name/id is for a key or role named policy)
     */
    async getFunction(functionId) {
        const functionInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").policyGet(functionId, "latest");
        if (functionInfo.policy_type !== "Wasm") {
            throw new Error(`${functionId} is not a Wasm function, it is a ${functionInfo.policy_type} named policy`);
        }
        return new _1.C2FFunction(__classPrivateFieldGet(this, _Org_apiClient, "f"), functionInfo);
    }
    /**
     * Gets all the named policies in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @param policyType The optional type of policies to fetch. Defaults to fetching all named policies regardless of type.
     * @returns The policies.
     */
    async policies(page, policyType) {
        const policies = await __classPrivateFieldGet(this, _Org_apiClient, "f").policiesList(page, policyType).fetch();
        return policies.map((p) => policy_1.NamedPolicy.fromInfo(__classPrivateFieldGet(this, _Org_apiClient, "f"), p));
    }
    /**
     * Gets all the C2F functions in the org.
     *
     * @param page The paginator options.
     * @returns The C2F functions.
     */
    async functions(page) {
        const policies = await __classPrivateFieldGet(this, _Org_apiClient, "f").policiesList(page, "Wasm").fetch();
        return policies.map((data) => new _1.C2FFunction(__classPrivateFieldGet(this, _Org_apiClient, "f"), data));
    }
    /**
     * Create a new Confidential Cloud Function.
     *
     * @param name The name of the function.
     * @param policy The Wasm function.
     * @param acl Optional list of policy access control entries.
     * @returns The C2F function
     */
    async createWasmFunction(name, policy, acl) {
        const hash = await (0, policy_1.uploadWasmFunction)(__classPrivateFieldGet(this, _Org_apiClient, "f"), policy);
        const policyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").policyCreate(name, "Wasm", [
            {
                hash,
            },
        ], acl);
        return new _1.C2FFunction(__classPrivateFieldGet(this, _Org_apiClient, "f"), policyInfo);
    }
    /** @returns the Confidential Cloud Functions configuration for the org. */
    async c2fConfiguration() {
        const data = await this.fetch();
        return data.policy_engine_configuration;
    }
    /**
     * Set the Confidential Cloud Functions configuration for the org.
     * Note that this overwrites any existing configuration.
     *
     * @param configs Confidential Cloud Functions configuration.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setC2FConfiguration(configs, opts) {
        return await this.update({
            policy_engine_configuration: configs,
        }, opts?.mfaReceipt);
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
     * @param labels The optional labels associated with the contact.
     * @returns The newly-created contact.
     */
    async createContact(name, addresses, metadata, editPolicy, labels) {
        const contactInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").contactCreate(name, addresses, metadata, editPolicy, labels);
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
     * Get all contacts in the organization, optionally matching the search query.
     *
     * @param search The optional search query. Either:
     *  - `label:...`, which will return contacts with the label provided after the ':',
     *  - an exact address search, which returns contacts with the provided ContactAddressData,
     *  - or an address prefix search, where all returned contacts will have an address starting with, or equaling, the given search string.
     * @returns All contacts.
     */
    async contacts(search) {
        let contacts;
        if (search !== undefined && typeof search !== "string") {
            contacts = await __classPrivateFieldGet(this, _Org_apiClient, "f").contactLookupByAddress(search);
        }
        else {
            const paginator = __classPrivateFieldGet(this, _Org_apiClient, "f").contactsList(undefined, search);
            contacts = await paginator.fetch();
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFpQ0EsdUNBQW9DO0FBQ3BDLHdCQUF1RDtBQUN2RCxxQ0FNa0I7QUF1SWxCOzs7O0dBSUc7QUFDSCxNQUFhLEdBQUc7SUFNZDs7O09BR0c7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksa0JBQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLGlCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLEtBQWE7UUEzQnRDLGlDQUFzQjtRQUMvQiw2QkFBYztRQUNkLDBCQUEwQjtRQUMxQiw0QkFBZ0I7UUE4NUJoQix3REFBd0Q7UUFFeEQ7Ozs7Ozs7V0FPRztRQUNILHFCQUFnQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUUzQyw0REFBNEQ7UUFDNUQsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBRWxEOzs7OztXQUtHO1FBQ0gsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBMTVCdEQsdUJBQUEsSUFBSSxjQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUksa0JBQWMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQzNGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxhQUF3QztRQUN0RCxNQUFNLEdBQUcsR0FBRyxPQUFPLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDLENB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QUksa0JBQWtCO1FBQ3BCLE9BQU8sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBc0I7UUFDckMsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxNQUFHLENBQUMsdUJBQUEsSUFBSSxzQkFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztDQXdCRjtBQXg3QkQsa0JBdzdCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgS2V5VHlwZSxcbiAgS2V5UHJvcGVydGllcyxcbiAgTm90aWZpY2F0aW9uRW5kcG9pbnRDb25maWd1cmF0aW9uLFxuICBQYWdlT3B0cyxcbiAgVXNlckluT3JnSW5mbyxcbiAgQXBpQ2xpZW50LFxuICBPcmdJbmZvLFxuICBNZmFJZCxcbiAgSW1wb3J0S2V5UmVxdWVzdCxcbiAgS2V5UG9saWN5LFxuICBRdWVyeU1ldHJpY3NSZXNwb25zZSxcbiAgT3JnTWV0cmljTmFtZSxcbiAgUXVlcnlNZXRyaWNzUmVxdWVzdCxcbiAgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoLFxuICBKc29uVmFsdWUsXG4gIEVkaXRQb2xpY3ksXG4gIEFkZHJlc3NNYXAsXG4gIENyZWF0ZU9yZ1JlcXVlc3QsXG4gIFJvbGVQb2xpY3ksXG4gIEMyRkNvbmZpZ3VyYXRpb24sXG4gIE1mYVByb3RlY3RlZEFjdGlvbixcbiAgTWZhVHlwZSxcbiAgUG9saWN5VHlwZSxcbiAgUG9saWN5QWNsLFxuICBDb250YWN0TGFiZWwsXG4gIENvbnRhY3RBZGRyZXNzRGF0YSxcbiAgT3JnRXh0UHJvcHMsXG4gIE9yZ0V4dERhdGEsXG4gIEF1ZGl0TG9nRW50cnksXG4gIEF1ZGl0TG9nUmVxdWVzdCxcbiAgTWZhUmVjZWlwdHMsXG59IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBDb250YWN0IH0gZnJvbSBcIi4vY29udGFjdFwiO1xuaW1wb3J0IHsgQzJGRnVuY3Rpb24sIEtleSwgTWZhUmVxdWVzdCwgUm9sZSB9IGZyb20gXCIuXCI7XG5pbXBvcnQge1xuICB0eXBlIE5hbWVkS2V5UG9saWN5LFxuICBOYW1lZFBvbGljeSxcbiAgdHlwZSBOYW1lZFJvbGVQb2xpY3ksXG4gIHVwbG9hZFdhc21GdW5jdGlvbixcbiAgdHlwZSBDMkZJbmZvLFxufSBmcm9tIFwiLi9wb2xpY3lcIjtcblxuLyoqIE9wdGlvbnMgcGFzZWQgdG8gY3JlYXRlS2V5IGFuZCBkZXJpdmVLZXkgKi9cbmV4cG9ydCB0eXBlIENyZWF0ZUtleVByb3BlcnRpZXMgPSBPbWl0PEtleVByb3BlcnRpZXMsIFwicG9saWN5XCI+ICYge1xuICAvKipcbiAgICogUG9saWNpZXMgdG8gYXBwbHkgdG8gdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIFRoaXMgdHlwZSBtYWtlcyBpdCBwb3NzaWJsZSB0byBhc3NpZ24gdmFsdWVzIGxpa2VcbiAgICogYFtBbGxvd0VpcDE5MVNpZ25pbmdQb2xpY3ldYCwgYnV0IHJlbWFpbnMgYmFja3dhcmRzXG4gICAqIGNvbXBhdGlibGUgd2l0aCBwcmlvciB2ZXJzaW9ucyBvZiB0aGUgU0RLLCBpbiB3aGljaFxuICAgKiB0aGlzIHByb3BlcnR5IGhhZCB0eXBlIGBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGxgLlxuICAgKi9cbiAgcG9saWN5PzogS2V5UG9saWN5IHwgdW5rbm93bltdIHwgbnVsbDtcbn07XG5cbi8qKiBPcHRpb25zIHBhc3NlZCB0byBpbXBvcnRLZXkgYW5kIGRlcml2ZUtleSAqL1xuZXhwb3J0IHR5cGUgSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyA9IENyZWF0ZUtleVByb3BlcnRpZXMgJiB7XG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIHJldHVybnMgYSAnS2V5JyBvYmplY3QgZm9yIGJvdGggbmV3IGFuZCBleGlzdGluZyBrZXlzLlxuICAgKi9cbiAgaWRlbXBvdGVudD86IGJvb2xlYW47XG59O1xuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gZGVyaXZlTXVsdGlwbGVLZXlUeXBlcyAqL1xuZXhwb3J0IHR5cGUgRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMgPSBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzICYge1xuICAvKipcbiAgICogVGhlIG1hdGVyaWFsX2lkIG9mIHRoZSBtbmVtb25pYyB1c2VkIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICpcbiAgICogSWYgdGhpcyBhcmd1bWVudCBpcyB1bmRlZmluZWQgb3IgbnVsbCwgYSBuZXcgbW5lbW9uaWMgaXMgZmlyc3QgY3JlYXRlZFxuICAgKiBhbmQgYW55IG90aGVyIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFyZSBhcHBsaWVkIHRvIGl0IChpbiBhZGRpdGlvbiB0b1xuICAgKiBiZWluZyBhcHBsaWVkIHRvIHRoZSBzcGVjaWZpZWQga2V5cykuXG4gICAqXG4gICAqIFRoZSBuZXdseSBjcmVhdGVkIG1uZW1vbmljLWlkIGNhbiBiZSByZXRyaWV2ZWQgZnJvbSB0aGUgYGRlcml2YXRpb25faW5mb2BcbiAgICogcHJvcGVydHkgb2YgdGhlIGBLZXlJbmZvYCB2YWx1ZSBmb3IgYSByZXN1bHRpbmcga2V5LlxuICAgKi9cbiAgbW5lbW9uaWNfaWQ/OiBzdHJpbmc7XG59O1xuXG4vKiogT3JnYW5pemF0aW9uIGlkICovXG5leHBvcnQgdHlwZSBPcmdJZCA9IHN0cmluZztcblxuLyoqIE9yZy13aWRlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgT3JnUG9saWN5ID1cbiAgfCBTb3VyY2VJcEFsbG93bGlzdFBvbGljeVxuICB8IE9pZGNBdXRoU291cmNlc1BvbGljeVxuICB8IE9yaWdpbkFsbG93bGlzdFBvbGljeVxuICB8IE1heERhaWx5VW5zdGFrZVBvbGljeVxuICB8IFdlYkF1dGhuUmVseWluZ1BhcnRpZXNQb2xpY3lcbiAgfCBFeGNsdXNpdmVLZXlBY2Nlc3NQb2xpY3k7XG5cbi8qKlxuICogV2hldGhlciB0byBlbmZvcmNlIGV4Y2x1c2l2ZSBhY2Nlc3MgdG8ga2V5cy4gIENvbmNyZXRlbHksXG4gKiAtIGlmIFwiTGltaXRUb0tleU93bmVyXCIgaXMgc2V0LCBvbmx5IGtleSBvd25lcnMgYXJlIHBlcm1pdHRlZCB0byBhY2Nlc3NcbiAqICAgdGhlaXIga2V5cyBmb3Igc2lnbmluZzogYSB1c2VyIHNlc3Npb24gKG5vdCBhIHJvbGUgc2Vzc2lvbikgaXMgcmVxdWlyZWRcbiAqICAgZm9yIHNpZ25pbmcsIGFuZCBhZGRpbmcgYSBrZXkgdG8gYSByb2xlIGlzIG5vdCBwZXJtaXR0ZWQuXG4gKiAtIGlmIFwiTGltaXRUb1NpbmdsZVJvbGVcIiBpcyBzZXQsIGVhY2gga2V5IGlzIHBlcm1pdHRlZCB0byBiZSBpbiBhdCBtb3N0XG4gKiAgIG9uZSByb2xlLCBhbmQgc2lnbmluZyBpcyBvbmx5IGFsbG93ZWQgd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIHJvbGUgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeGNsdXNpdmVLZXlBY2Nlc3NQb2xpY3kge1xuICBFeGNsdXNpdmVLZXlBY2Nlc3M6IFwiTGltaXRUb0tleU93bmVyXCIgfCBcIkxpbWl0VG9TaW5nbGVSb2xlXCI7XG59XG5cbi8qKlxuICogVGhlIHNldCBvZiByZWx5aW5nIHBhcnRpZXMgdG8gYWxsb3cgZm9yIHdlYmF1dGhuIHJlZ2lzdHJhdGlvblxuICogVGhlc2UgY29ycmVzcG9uZCB0byBkb21haW5zIGZyb20gd2hpY2ggYnJvd3NlcnMgY2FuIHN1Y2Nlc3NmdWxseSBjcmVhdGUgY3JlZGVudGlhbHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV2ViQXV0aG5SZWx5aW5nUGFydGllc1BvbGljeSB7XG4gIFdlYkF1dGhuUmVseWluZ1BhcnRpZXM6IHsgaWQ/OiBzdHJpbmc7IG5hbWU6IHN0cmluZyB9W107XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gYWxsb3dsaXN0IG9mIE9JREMgSXNzdWVycyBhbmQgYXVkaWVuY2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIGludG8gdGhpcyBvcmcuXG4gKlxuICogQGV4YW1wbGUge1wiT2lkY0F1dGhTb3VyY2VzXCI6IHsgXCJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb21cIjogWyBcIjEyMzQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb21cIiBdfX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPaWRjQXV0aFNvdXJjZXNQb2xpY3kge1xuICBPaWRjQXV0aFNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdIHwgSXNzdWVyQ29uZmlnPjtcbn1cblxuLyoqIE9JREMgaXNzdWVyIGNvbmZpZ3VyYXRpb24gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXNzdWVyQ29uZmlnIHtcbiAgLyoqIFRoZSBzZXQgb2YgYXVkaWVuY2VzIHN1cHBvcnRlZCBmb3IgdGhpcyBpc3N1ZXIgKi9cbiAgYXVkczogc3RyaW5nW107XG5cbiAgLyoqIFRoZSBraW5kcyBvZiB1c2VyIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhpcyBpc3N1ZXIgKi9cbiAgdXNlcnM6IHN0cmluZ1tdO1xuXG4gIC8qKiBPcHRpb25hbCBuaWNrbmFtZSBmb3IgdGhpcyBwcm92aWRlciAqL1xuICBuaWNrbmFtZT86IHN0cmluZztcblxuICAvKiogV2hldGhlciB0byBtYWtlIHRoaXMgaXNzdWVyIHB1YmxpYyAqL1xuICBwdWJsaWM/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIE9ubHkgYWxsb3cgcmVxdWVzdHMgZnJvbSB0aGUgc3BlY2lmaWVkIG9yaWdpbnMuXG4gKlxuICogQGV4YW1wbGUge1wiT3JpZ2luQWxsb3dsaXN0XCI6IFwiKlwifVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9yaWdpbkFsbG93bGlzdFBvbGljeSB7XG4gIE9yaWdpbkFsbG93bGlzdDogc3RyaW5nW10gfCBcIipcIjtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCBzaWduaW5nIHRvIHNwZWNpZmljIHNvdXJjZSBJUCBhZGRyZXNzZXMuXG4gKlxuICogQGV4YW1wbGUge1wiU291cmNlSXBBbGxvd2xpc3RcIjogW1wiMTAuMS4yLjMvOFwiLCBcIjE2OS4yNTQuMTcuMS8xNlwiXX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VJcEFsbG93bGlzdFBvbGljeSB7XG4gIFNvdXJjZUlwQWxsb3dsaXN0OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgbnVtYmVyIG9mIHVuc3Rha2VzIHBlciBkYXkuXG4gKlxuICogQGV4YW1wbGUge1wiTWF4RGFpbHlVbnN0YWtlXCI6IDUgfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1heERhaWx5VW5zdGFrZVBvbGljeSB7XG4gIE1heERhaWx5VW5zdGFrZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIEZpbHRlciB0byB1c2Ugd2hlbiBsaXN0aW5nIGtleXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlGaWx0ZXIge1xuICAvKiogRmlsdGVyIGJ5IGtleSB0eXBlICovXG4gIHR5cGU/OiBLZXlUeXBlO1xuICAvKiogRmlsdGVyIGJ5IGtleSBvd25lciAqL1xuICBvd25lcj86IHN0cmluZztcbiAgLyoqIFNlYXJjaCBieSBrZXkncyBtYXRlcmlhbCBpZCBhbmQgbWV0YWRhdGEgKi9cbiAgc2VhcmNoPzogc3RyaW5nO1xuICAvKiogUGFnaW5hdGlvbiBvcHRpb25zICovXG4gIHBhZ2U/OiBQYWdlT3B0cztcbn1cblxuLyoqXG4gKiBBbiBvcmdhbml6YXRpb24uXG4gKlxuICogRXh0ZW5kcyB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gYW5kIHByb3ZpZGVzIGEgZmV3IG9yZy1zcGVjaWZpYyBtZXRob2RzIG9uIHRvcC5cbiAqL1xuZXhwb3J0IGNsYXNzIE9yZyB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI29yZ0lkOiBPcmdJZDtcbiAgLyoqIFRoZSBvcmcgaW5mb3JtYXRpb24gKi9cbiAgI2RhdGE/OiBPcmdJbmZvO1xuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIGlkXG4gICAqIEBleGFtcGxlIE9yZyNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICovXG4gIGdldCBpZCgpOiBPcmdJZCB7XG4gICAgcmV0dXJuIHRoaXMuI29yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIG9yZy4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogT3JnSW5mbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBvcmdJZDogc3RyaW5nKSB7XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBvcmdJZCA9PT0gYXBpQ2xpZW50Lm9yZ0lkID8gYXBpQ2xpZW50IDogYXBpQ2xpZW50LndpdGhUYXJnZXRPcmcob3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBvcmdhbml6YXRpb24uIFRoZSBuZXcgb3JnIGlzIGEgY2hpbGQgb2YgdGhlXG4gICAqIGN1cnJlbnQgb3JnIGFuZCBpbmhlcml0cyBpdHMga2V5LWV4cG9ydCBwb2xpY3kuIFRoZSBuZXcgb3JnXG4gICAqIGlzIGNyZWF0ZWQgd2l0aCBvbmUgb3duZXIsIHRoZSBjYWxsZXIgb2YgdGhpcyBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lT3JSZXF1ZXN0IFRoZSBuYW1lIG9mIHRoZSBuZXcgb3JnIG9yIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBuZXcgb3JnLlxuICAgKiBAcmV0dXJucyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgbmV3bHkgY3JlYXRlZCBvcmcuXG4gICAqL1xuICBhc3luYyBjcmVhdGVPcmcobmFtZU9yUmVxdWVzdDogc3RyaW5nIHwgQ3JlYXRlT3JnUmVxdWVzdCk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIGNvbnN0IHJlcSA9IHR5cGVvZiBuYW1lT3JSZXF1ZXN0ID09PSBcInN0cmluZ1wiID8geyBuYW1lOiBuYW1lT3JSZXF1ZXN0IH0gOiBuYW1lT3JSZXF1ZXN0O1xuICAgIGlmICghL15bYS16QS1aMC05X117MywzMH0kLy50ZXN0KHJlcS5uYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3JnIG5hbWUgbXVzdCBiZSBhbHBoYW51bWVyaWMgYW5kIGJldHdlZW4gMyBhbmQgMzAgY2hhcmFjdGVyc1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdDcmVhdGVPcmcocmVxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBRdWVyeSBvcmcgbWV0cmljcy5cbiAgICpcbiAgICogQHBhcmFtIG1ldHJpY05hbWUgVGhlIG1ldHJpYyBuYW1lLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBzdGFydCBkYXRlIGluIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAgICogQHBhcmFtIG9wdCBPdGhlciBvcHRpb25hbCBhcmd1bWVudHNcbiAgICogQHBhcmFtIG9wdC5lbmRfdGltZSBUaGUgZW5kIGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLiBJZiBvbWl0dGVkLCBkZWZhdWx0cyB0byAnbm93Jy5cbiAgICogQHBhcmFtIG9wdC5wZXJpb2QgVGhlIGdyYW51bGFyaXR5LCBpbiBzZWNvbmRzLCBvZiB0aGUgcmV0dXJuZWQgZGF0YSBwb2ludHMuXG4gICAqICAgVGhpcyB2YWx1ZSBpcyBhdXRvbWF0aWNhbGx5IHJvdW5kZWQgdXAgdG8gYSBtdWx0aXBsZSBvZiAzNjAwIChpLmUuLCAxIGhvdXIpLlxuICAgKiAgIElmIG9taXR0ZWQsIGRlZmF1bHRzIHRvIHRoZSBkdXJhdGlvbiBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgdGhlIGVuZCBkYXRlLlxuICAgKiAgIE11c3QgYmUgbm8gbGVzcyB0aGFuIDEgaG91ciwgaS5lLiwgMzYwMCBzZWNvbmRzLiBBZGRpdGlvbmFsbHksIHRoaXMgcGVyaW9kIG11c3Qgbm90XG4gICAqICAgZGl2aWRlIHRoZSBgZW5kVGltZSAtIHN0YXJ0VGltZWAgcGVyaW9kIGludG8gbW9yZSB0aGFuIDEwMCBkYXRhIHBvaW50cy5cbiAgICogQHBhcmFtIHBhZ2VPcHRzIFBhZ2luYXRpb24gb3B0aW9ucy5cbiAgICogQHJldHVybnMgTWV0cmljIHZhbHVlcyAoZGF0YSBwb2ludHMpIGZvciB0aGUgcmVxdWVzdGVkIHBlcmlvZHMuXG4gICAqL1xuICBhc3luYyBxdWVyeU1ldHJpY3MoXG4gICAgbWV0cmljTmFtZTogT3JnTWV0cmljTmFtZSxcbiAgICBzdGFydFRpbWU6IEVwb2NoVGltZVN0YW1wLFxuICAgIG9wdD86IE9taXQ8UXVlcnlNZXRyaWNzUmVxdWVzdCwgXCJtZXRyaWNfbmFtZVwiIHwgXCJzdGFydF90aW1lXCI+LFxuICAgIHBhZ2VPcHRzPzogUGFnZU9wdHMsXG4gICk6IFByb21pc2U8UXVlcnlNZXRyaWNzUmVzcG9uc2U+IHtcbiAgICBjb25zdCByZXE6IFF1ZXJ5TWV0cmljc1JlcXVlc3QgPSB7XG4gICAgICBtZXRyaWNfbmFtZTogbWV0cmljTmFtZSxcbiAgICAgIC4uLm9wdCxcbiAgICAgIHN0YXJ0X3RpbWU6IHN0YXJ0VGltZSxcbiAgICAgIC8vIE11c3Qgc2V0IGVuZF90aW1lIGJlZm9yZSBmZXRjaEFsbDogd2l0aG91dCBpdCB0aGUgYmFja2VuZCBkZWZhdWx0cyB0byBub3coKVxuICAgICAgLy8gb24gZWFjaCBwYWdlIHJlcXVlc3QsIGFuZCBhIGNoYW5naW5nIHdpbmRvdyBpbnZhbGlkYXRlcyB0aGUgcGFnaW5hdGlvbiB0b2tlbi5cbiAgICAgIGVuZF90aW1lOiBvcHQ/LmVuZF90aW1lID8/IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdRdWVyeU1ldHJpY3MocmVxLCBwYWdlT3B0cykuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBRdWVyeSB0aGUgb3JnIGF1ZGl0IGxvZy5cbiAgICpcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgc3RhcnQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guXG4gICAqIEBwYXJhbSBvcHQgT3RoZXIgb3B0aW9uYWwgYXJndW1lbnRzXG4gICAqIEBwYXJhbSBvcHQuZW5kX3RpbWUgVGhlIGVuZCBkYXRlIGluIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC4gRGVmYXVsdHMgdG8gJ25vdycuXG4gICAqIEBwYXJhbSBvcHQuZXZlbnRzIEZpbHRlciBieSBldmVudCBuYW1lLiBJZiBvbWl0dGVkLCBhbGwgZXZlbnRzIGFyZSBpbmNsdWRlZC5cbiAgICogQHBhcmFtIHBhZ2VPcHRzIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBNYXRjaGluZyBhdWRpdCBsb2cgZW50cmllcy5cbiAgICovXG4gIGFzeW5jIHF1ZXJ5QXVkaXRMb2coXG4gICAgc3RhcnRUaW1lOiBFcG9jaFRpbWVTdGFtcCxcbiAgICBvcHQ/OiBPbWl0PEF1ZGl0TG9nUmVxdWVzdCwgXCJzdGFydF90aW1lXCI+LFxuICAgIHBhZ2VPcHRzPzogUGFnZU9wdHMsXG4gICk6IFByb21pc2U8QXVkaXRMb2dFbnRyeVtdPiB7XG4gICAgY29uc3QgcmVxOiBBdWRpdExvZ1JlcXVlc3QgPSB7XG4gICAgICAuLi5vcHQsXG4gICAgICBzdGFydF90aW1lOiBzdGFydFRpbWUsXG4gICAgICAvLyBNdXN0IHNldCBlbmRfdGltZSBiZWZvcmUgZmV0Y2hBbGw6IHdpdGhvdXQgaXQgdGhlIGJhY2tlbmQgZGVmYXVsdHMgdG8gbm93KClcbiAgICAgIC8vIG9uIGVhY2ggcGFnZSByZXF1ZXN0LCBhbmQgYSBjaGFuZ2luZyB3aW5kb3cgaW52YWxpZGF0ZXMgdGhlIHBhZ2luYXRpb24gdG9rZW4uXG4gICAgICBlbmRfdGltZTogb3B0Py5lbmRfdGltZSA/PyBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdRdWVyeUF1ZGl0TG9nKHJlcSwgcGFnZU9wdHMpLmZldGNoQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIG9yZyBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG9yZyBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGZldGNoKCk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnR2V0KCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBvcmcgKi9cbiAgYXN5bmMgbmFtZSgpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgV2hldGhlciB0aGUgb3JnIGlzIGVuYWJsZWQgKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIGVuYWJsZShvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBkaXNhYmxlKG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKiogQHJldHVybnMgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8T3JnUG9saWN5W10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgT3JnUG9saWN5W107XG4gIH1cblxuICAvKiogQHJldHVybnMgdGhlIHNpZ24gcG9saWN5IGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBzaWduUG9saWN5KCk6IFByb21pc2U8Um9sZVBvbGljeT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnNpZ25fcG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IE9yZ1BvbGljeVtdLCBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSkge1xuICAgIGNvbnN0IHAgPSBwb2xpY3kgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3k6IHAgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIG5ldyBlZGl0IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0RWRpdFBvbGljeShlZGl0UG9saWN5OiBFZGl0UG9saWN5LCBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVkaXRfcG9saWN5OiBlZGl0UG9saWN5IH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgc2lnbiBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIFRoaXMgaXMgYSBnbG9iYWwgc2lnbiBwb2xpY3kgdGhhdCBhcHBsaWVzIHRvIGV2ZXJ5IHNpZ24gb3BlcmF0aW9uIChldmVyeSBrZXksIGV2ZXJ5IHJvbGUpIGluIHRoZSBvcmcuXG4gICAqIEl0IGlzIGFuYWxvZ291cyB0byBob3cgcm9sZSBwb2xpY2llcyBhcHBseSB0byBhbGwgc2lnbiByZXF1ZXN0cyBwZXJmb3JtZWQgYnkgdGhlIGNvcnJlc3BvbmRpbmcgcm9sZSBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0U2lnblBvbGljeShwb2xpY3k6IFJvbGVQb2xpY3ksIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgc2lnbl9wb2xpY3k6IHBvbGljeSB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSB0aGUgb3JnYW5pemF0aW9uJ3MgZXh0ZW5kZWQgcHJvcGVydGllcyAodW5jb21tb24gZmVhdHVyZXMgbm90IHVzZWQgYnkgbW9zdCB1c2VycykuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBleHRlbmRlZCBwcm9wZXJ0aWVzXG4gICAqL1xuICBhc3luYyBnZXRFeHRlbmRlZFByb3BlcnRpZXMoKTogUHJvbWlzZTxPcmdFeHREYXRhIHwgbnVsbD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZXh0X2RhdGEgPyBkYXRhLmV4dF9kYXRhIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIG9yZ2FuaXphdGlvbidzIGV4dGVuZGVkIHByb3BlcnRpZXMgKHVuY29tbW9uIGZlYXR1cmVzIG5vdCB1c2VkIGJ5IG1vc3QgdXNlcnMpLlxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHMgVGhlIG5ldyBwcm9wZXJ0aWVzLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRFeHRlbmRlZFByb3BlcnRpZXMocHJvcHM6IE9yZ0V4dFByb3BzLCBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IGV4dF9wcm9wczogcHJvcHMgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwZXItYWxpZW4ga2V5IGNvdW50IHRocmVzaG9sZCwgd2hpY2gsIG9uY2UgZXhjZWVkZWQsIGRpc2FsbG93cyBmdXJ0aGVyIGtleSBjcmVhdGlvbiBieSBhbGllbiB1c2Vycy5cbiAgICpcbiAgICogVGhpcyBzZXR0aW5nIGlzIGNoZWNrZWQgb25seSB3aGVuIGFuIGFsaWVuIHVzZXIgcmVxdWVzdHMgdG8gY3JlYXRlIG9yIGltcG9ydCBhIG5ldyBrZXkuXG4gICAqIEluIG90aGVyIHdvcmRzLCBvcmcgYWRtaW5zIGNhbiBzdGlsbCBhc3NpZ24gdW5saW1pdGVkIG51bWJlciBvZiBrZXlzIHRvIHRoZWlyIGFsaWVuIHVzZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gYWxpZW5LZXlDb3VudFRocmVzaG9sZCBUaGUgbmV3IGtleSBjb3VudCB0aHJlc2hvbGQuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldEFsaWVuS2V5Q291bnRUaHJlc2hvbGQoXG4gICAgYWxpZW5LZXlDb3VudFRocmVzaG9sZDogbnVtYmVyLFxuICAgIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9LFxuICApIHtcbiAgICBjb25zdCBkYXRhID0geyAuLi4oKGF3YWl0IHRoaXMuZ2V0RXh0ZW5kZWRQcm9wZXJ0aWVzKCkpID8/IHt9KSB9O1xuXG4gICAgLy8gZXJhc2UgdGhlIG1ldGFkYXRhIHRoYXQgY2Fubm90IGJlIHVwZGF0ZWRcbiAgICBkYXRhLmNyZWF0ZWQgPSB1bmRlZmluZWQ7XG4gICAgZGF0YS5sYXN0X21vZGlmaWVkID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gdXBkYXRlICdhbGllbl9rZXlfY291bnRfdGhyZXNob2xkJyBhbmQga2VlcCBldmVyeXRoaW5nIGVsc2UgdGhlIHNhbWVcbiAgICBkYXRhLmFsaWVuX2tleV9jb3VudF90aHJlc2hvbGQgPSBhbGllbktleUNvdW50VGhyZXNob2xkO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgZXh0X3Byb3BzOiBkYXRhIH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgbm90aWZpY2F0aW9uIGVuZHBvaW50cyBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG5vdGlmaWNhdGlvbl9lbmRwb2ludHMgRW5kcG9pbnRzLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXROb3RpZmljYXRpb25FbmRwb2ludHMoXG4gICAgbm90aWZpY2F0aW9uX2VuZHBvaW50czogTm90aWZpY2F0aW9uRW5kcG9pbnRDb25maWd1cmF0aW9uW10sXG4gICAgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0sXG4gICkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IG5vdGlmaWNhdGlvbl9lbmRwb2ludHMgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHJlcXVpcmVkIE1GQSB0eXBlcyBmb3IgYWN0aW9ucyBpbXBsaWNpdGx5IHJlcXVpcmluZyBNRkEgKHNlZSB7QGxpbmsgTWZhUHJvdGVjdGVkQWN0aW9ufSkuXG4gICAqXG4gICAqIEBwYXJhbSBhbGxvd2VkX21mYV90eXBlcyBBc3NpZ25tZW50IG9mIE1GQSB0eXBlcyB0byBhY3Rpb25zIHRoYXQgaW1wbGljaXRseSByZXF1aXJlIE1GQS5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0QWxsb3dlZE1mYVR5cGVzKFxuICAgIGFsbG93ZWRfbWZhX3R5cGVzOiBQYXJ0aWFsPFJlY29yZDxNZmFQcm90ZWN0ZWRBY3Rpb24sIE1mYVR5cGVbXT4+LFxuICAgIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9LFxuICApIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBhbGxvd2VkX21mYV90eXBlcyB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmluZyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5LiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgdG8gc2V0IG9uIHRoZSBuZXcga2V5LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXkodHlwZTogS2V5VHlwZSwgb3duZXJJZD86IHN0cmluZywgcHJvcHM/OiBDcmVhdGVLZXlQcm9wZXJ0aWVzKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNDcmVhdGUodHlwZSwgMSwgb3duZXJJZCwgcHJvcHMpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5c1swXSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBjb3VudCBUaGUgbnVtYmVyIG9mIGtleXMgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyB0byBzZXQgb24gdGhlIG5ldyBrZXlzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBvd25lcklkPzogc3RyaW5nLFxuICAgIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0NyZWF0ZSh0eXBlLCBjb3VudCwgb3duZXJJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmRzIGFuIGludml0YXRpb24gdG8gdGhhdCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckludml0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGludml0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgY3JlYXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJJbnZpdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgZGVsZXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyQ3JlYXRlT2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgYW4gT0lEQyB1c2VyLCByZXNvbHZpbmcgdG8gdGhlIG5ldyB1c2VyJ3MgSURcbiAgICovXG4gIGdldCBjcmVhdGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJDcmVhdGVPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGFuIE9JREMgdXNlclxuICAgKi9cbiAgZ2V0IGRlbGV0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGMuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBzZWFyY2hRdWVyeSBPcHRpb25hbCBxdWVyeSBzdHJpbmcuIElmIGRlZmluZWQsIGFsbCByZXR1cm5lZCB1c2VycyB3aWxsIGNvbnRhaW4gdGhpcyBzdHJpbmcgaW4gdGhlaXIgbmFtZSBvciBlbWFpbC5cbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGFzeW5jIHVzZXJzKHNlYXJjaFF1ZXJ5Pzogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdCh1bmRlZmluZWQsIHNlYXJjaFF1ZXJ5KS5mZXRjaEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvbiAocGFnaW5hdGVkKS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBwYWdpbmF0ZWQgbGlzdCBvZiB1c2Vyc1xuICAgKi9cbiAgZ2V0IHVzZXJzUGFnaW5hdGVkKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlcnNMaXN0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlciBieSBpZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJHZXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHVzZXIncyBpbmZvXG4gICAqL1xuICBnZXQgZ2V0VXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJHZXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IGVtYWlsLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckdldEJ5RW1haWx9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHVzZXIncyBpbmZvXG4gICAqL1xuICBnZXQgZ2V0VXNlckJ5RW1haWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyR2V0QnlFbWFpbC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgT0lEQyBJRC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJHZXRCeU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHVzZXIncyBpbmZvXG4gICAqL1xuICBnZXQgZ2V0VXNlckJ5T2lkYygpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJHZXRCeU9pZGMuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSBhIHVzZXIgaW4gdGhpcyBvcmdcbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIGVuYWJsZVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCB1c2VyJ3MgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgZW5hYmxlVXNlcih1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlVXNlck1lbWJlcnNoaXAodXNlcklkLCB7IGRpc2FibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIGEgdXNlciBpbiB0aGlzIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyIHdob3NlIG1lbWJlcnNoaXAgdG8gZGlzYWJsZVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCB1c2VyJ3MgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgZGlzYWJsZVVzZXIodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKHVzZXJJZCwgeyBkaXNhYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFjY2Vzc2libGUga2V5cyBpbiB0aGUgb3JnYW5pemF0aW9uXG4gICAqXG4gICAqIEBwYXJhbSBwcm9wcyBPcHRpb25hbCBmaWx0ZXJpbmcgcHJvcGVydGllcy5cbiAgICogQHJldHVybnMgVGhlIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzKHByb3BzPzogS2V5RmlsdGVyKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IHBhZ2luYXRvciA9IHRoaXMuI2FwaUNsaWVudC5rZXlzTGlzdChcbiAgICAgIHByb3BzPy50eXBlLFxuICAgICAgcHJvcHM/LnBhZ2UsXG4gICAgICBwcm9wcz8ub3duZXIsXG4gICAgICBwcm9wcz8uc2VhcmNoLFxuICAgICk7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHBhZ2luYXRvci5mZXRjaCgpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgcm9sZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVJvbGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlQ3JlYXRlKG5hbWUpO1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpZCBvciBuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBnZXRSb2xlKHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3Qgcm9sZUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldChyb2xlSWQpO1xuICAgIHJldHVybiBuZXcgUm9sZSh0aGlzLiNhcGlDbGllbnQsIHJvbGVJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB0aGUgcm9sZXMgaW4gdGhlIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBUaGUgcGFnaW5hdG9yIG9wdGlvbnNcbiAgICogQHJldHVybnMgVGhlIHJvbGVzXG4gICAqL1xuICBhc3luYyByb2xlcyhwYWdlOiBQYWdlT3B0cyk6IFByb21pc2U8Um9sZVtdPiB7XG4gICAgY29uc3Qgcm9sZXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZXNMaXN0KHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIHJvbGVzLm1hcCgocikgPT4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIHJ1bGVzIFRoZSBwb2xpY3kgcnVsZXMuXG4gICAqIEBwYXJhbSBhY2wgT3B0aW9uYWwgbGlzdCBvZiBwb2xpY3kgYWNjZXNzIGNvbnRyb2wgZW50cmllcy5cbiAgICogQHJldHVybnMgVGhlIG5ldyBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBjcmVhdGVQb2xpY3k8VHlwZSBleHRlbmRzIFwiS2V5XCIgfCBcIlJvbGVcIj4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHR5cGU6IFR5cGUsXG4gICAgcnVsZXM6IFR5cGUgZXh0ZW5kcyBcIktleVwiID8gS2V5UG9saWN5IDogUm9sZVBvbGljeSxcbiAgICBhY2w/OiBQb2xpY3lBY2wsXG4gICk6IFByb21pc2U8VHlwZSBleHRlbmRzIFwiS2V5XCIgPyBOYW1lZEtleVBvbGljeSA6IE5hbWVkUm9sZVBvbGljeT4ge1xuICAgIGNvbnN0IHBvbGljeUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5Q3JlYXRlKG5hbWUsIHR5cGUsIHJ1bGVzLCBhY2wpO1xuICAgIGNvbnN0IHBvbGljeSA9IE5hbWVkUG9saWN5LmZyb21JbmZvKHRoaXMuI2FwaUNsaWVudCwgcG9saWN5SW5mbyk7XG4gICAgcmV0dXJuIHBvbGljeSBhcyBUeXBlIGV4dGVuZHMgXCJLZXlcIiA/IE5hbWVkS2V5UG9saWN5IDogTmFtZWRSb2xlUG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIG5hbWVkIHBvbGljeSBieSBpZCBvciBuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5SWQgVGhlIGlkIG9yIG5hbWUgb2YgdGhlIHBvbGljeSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBnZXRQb2xpY3kocG9saWN5SWQ6IHN0cmluZyk6IFByb21pc2U8TmFtZWRQb2xpY3k+IHtcbiAgICBjb25zdCBwb2xpY3lJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUdldChwb2xpY3lJZCwgXCJsYXRlc3RcIik7XG4gICAgcmV0dXJuIE5hbWVkUG9saWN5LmZyb21JbmZvKHRoaXMuI2FwaUNsaWVudCwgcG9saWN5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uIGJ5IG5hbWUgb3IgbmFtZWQgcG9saWN5IElELlxuICAgKlxuICAgKiBAcGFyYW0gZnVuY3Rpb25JZCBUaGUgbmFtZSBvciBuYW1lZCBwb2xpY3kgSUQgb2YgdGhlIGZ1bmN0aW9uIHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIEMyRiBmdW5jdGlvbi5cbiAgICogQHRocm93cyBpZiBuYW1lIG9yIElEIGlzIG5vdCBhc3NvY2lhdGVkIHRvIGEgQzJGIGZ1bmN0aW9uIChpLmUuIHRoZSBuYW1lL2lkIGlzIGZvciBhIGtleSBvciByb2xlIG5hbWVkIHBvbGljeSlcbiAgICovXG4gIGFzeW5jIGdldEZ1bmN0aW9uKGZ1bmN0aW9uSWQ6IHN0cmluZyk6IFByb21pc2U8QzJGRnVuY3Rpb24+IHtcbiAgICBjb25zdCBmdW5jdGlvbkluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5R2V0KGZ1bmN0aW9uSWQsIFwibGF0ZXN0XCIpO1xuICAgIGlmIChmdW5jdGlvbkluZm8ucG9saWN5X3R5cGUgIT09IFwiV2FzbVwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGAke2Z1bmN0aW9uSWR9IGlzIG5vdCBhIFdhc20gZnVuY3Rpb24sIGl0IGlzIGEgJHtmdW5jdGlvbkluZm8ucG9saWN5X3R5cGV9IG5hbWVkIHBvbGljeWAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEMyRkZ1bmN0aW9uKHRoaXMuI2FwaUNsaWVudCwgZnVuY3Rpb25JbmZvIGFzIEMyRkluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSBuYW1lZCBwb2xpY2llcyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHBhcmFtIHBvbGljeVR5cGUgVGhlIG9wdGlvbmFsIHR5cGUgb2YgcG9saWNpZXMgdG8gZmV0Y2guIERlZmF1bHRzIHRvIGZldGNoaW5nIGFsbCBuYW1lZCBwb2xpY2llcyByZWdhcmRsZXNzIG9mIHR5cGUuXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY2llcy5cbiAgICovXG4gIGFzeW5jIHBvbGljaWVzKHBhZ2U/OiBQYWdlT3B0cywgcG9saWN5VHlwZT86IFBvbGljeVR5cGUpOiBQcm9taXNlPE5hbWVkUG9saWN5W10+IHtcbiAgICBjb25zdCBwb2xpY2llcyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY2llc0xpc3QocGFnZSwgcG9saWN5VHlwZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gcG9saWNpZXMubWFwKChwKSA9PiBOYW1lZFBvbGljeS5mcm9tSW5mbyh0aGlzLiNhcGlDbGllbnQsIHApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB0aGUgQzJGIGZ1bmN0aW9ucyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBUaGUgcGFnaW5hdG9yIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIFRoZSBDMkYgZnVuY3Rpb25zLlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb25zKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8QzJGRnVuY3Rpb25bXT4ge1xuICAgIGNvbnN0IHBvbGljaWVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljaWVzTGlzdChwYWdlLCBcIldhc21cIikuZmV0Y2goKTtcbiAgICByZXR1cm4gcG9saWNpZXMubWFwKChkYXRhKSA9PiBuZXcgQzJGRnVuY3Rpb24odGhpcy4jYXBpQ2xpZW50LCBkYXRhIGFzIEMyRkluZm8pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIFdhc20gZnVuY3Rpb24uXG4gICAqIEBwYXJhbSBhY2wgT3B0aW9uYWwgbGlzdCBvZiBwb2xpY3kgYWNjZXNzIGNvbnRyb2wgZW50cmllcy5cbiAgICogQHJldHVybnMgVGhlIEMyRiBmdW5jdGlvblxuICAgKi9cbiAgYXN5bmMgY3JlYXRlV2FzbUZ1bmN0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwb2xpY3k6IFVpbnQ4QXJyYXksXG4gICAgYWNsPzogUG9saWN5QWNsLFxuICApOiBQcm9taXNlPEMyRkZ1bmN0aW9uPiB7XG4gICAgY29uc3QgaGFzaCA9IGF3YWl0IHVwbG9hZFdhc21GdW5jdGlvbih0aGlzLiNhcGlDbGllbnQsIHBvbGljeSk7XG4gICAgY29uc3QgcG9saWN5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lDcmVhdGUoXG4gICAgICBuYW1lLFxuICAgICAgXCJXYXNtXCIsXG4gICAgICBbXG4gICAgICAgIHtcbiAgICAgICAgICBoYXNoLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGFjbCxcbiAgICApO1xuICAgIHJldHVybiBuZXcgQzJGRnVuY3Rpb24odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvIGFzIEMyRkluZm8pO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIHRoZSBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb25zIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBvcmcuICovXG4gIGFzeW5jIGMyZkNvbmZpZ3VyYXRpb24oKTogUHJvbWlzZTxDMkZDb25maWd1cmF0aW9uIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5wb2xpY3lfZW5naW5lX2NvbmZpZ3VyYXRpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb25zIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBvcmcuXG4gICAqIE5vdGUgdGhhdCB0aGlzIG92ZXJ3cml0ZXMgYW55IGV4aXN0aW5nIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBjb25maWdzIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbnMgY29uZmlndXJhdGlvbi5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0QzJGQ29uZmlndXJhdGlvbihjb25maWdzOiBDMkZDb25maWd1cmF0aW9uLCBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZShcbiAgICAgIHtcbiAgICAgICAgcG9saWN5X2VuZ2luZV9jb25maWd1cmF0aW9uOiBjb25maWdzLFxuICAgICAgfSxcbiAgICAgIG9wdHM/Lm1mYVJlY2VpcHQsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBrZXkgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aCBhbmQgbW5lbW9uaWMuXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXkgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSBkZXJpdmF0aW9uUGF0aCBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGggdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gbW5lbW9uaWNJZCBtYXRlcmlhbF9pZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIG5ld2x5IGRlcml2ZWQga2V5IG9yIHVuZGVmaW5lZCBpZiBpdCBhbHJlYWR5IGV4aXN0cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleShcbiAgICB0eXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoOiBzdHJpbmcsXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXkgfCB1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZGVyaXZlS2V5cyh0eXBlLCBbZGVyaXZhdGlvblBhdGhdLCBtbmVtb25pY0lkLCBwcm9wcykpWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIHNldCBvZiBrZXlzIG9mIHRoZSBnaXZlbiB0eXBlIHVzaW5nIHRoZSBnaXZlbiBkZXJpdmF0aW9uIHBhdGhzIGFuZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleXMgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSBkZXJpdmF0aW9uUGF0aHMgTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRocyB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5cyhcbiAgICB0eXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0Rlcml2ZSh0eXBlLCBkZXJpdmF0aW9uUGF0aHMsIG1uZW1vbmljSWQsIHByb3BzKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlIGVpdGhlciBhIG5ldyBvciBleGlzdGluZyBtbmVtb25pYyB0byBkZXJpdmUga2V5cyBvZiBvbmUgb3IgbW9yZVxuICAgKiBzcGVjaWZpZWQgdHlwZXMgdmlhIHNwZWNpZmllZCBkZXJpdmF0aW9uIHBhdGhzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHMgQSBsaXN0IG9mIGBLZXlUeXBlQW5kRGVyaXZhdGlvblBhdGhgIG9iamVjdHMgc3BlY2lmeWluZyB0aGUga2V5cyB0byBiZSBkZXJpdmVkXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVNdWx0aXBsZUtleVR5cGVzKFxuICAgIGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzOiBLZXlUeXBlQW5kRGVyaXZhdGlvblBhdGhbXSxcbiAgICBwcm9wcz86IERlcml2ZU11bHRpcGxlS2V5VHlwZXNQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzRGVyaXZlTXVsdGkoa2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHMsIHByb3BzKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGlkLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5R2V0KGtleUlkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpdHMgbWF0ZXJpYWwgaWQgKGUuZy4sIGFkZHJlc3MpLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUga2V5IHR5cGUuXG4gICAqIEBwYXJhbSBtYXRlcmlhbElkIFRoZSBtYXRlcmlhbCBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGtleS5cbiAgICovXG4gIGFzeW5jIGdldEtleUJ5TWF0ZXJpYWxJZChrZXlUeXBlOiBLZXlUeXBlLCBtYXRlcmlhbElkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5R2V0QnlNYXRlcmlhbElkKGtleVR5cGUsIG1hdGVyaWFsSWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgY29udGFjdC5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgZm9yIHRoZSBuZXcgY29udGFjdC5cbiAgICogQHBhcmFtIGFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29udGFjdC5cbiAgICogQHBhcmFtIG1ldGFkYXRhIE1ldGFkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29udGFjdC4gSW50ZW5kZWQgZm9yIHVzZSBhcyBhIGRlc2NyaXB0aW9uLlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgZWRpdCBwb2xpY3kgZm9yIHRoZSBjb250YWN0LCBkZXRlcm1pbmluZyB3aGVuIGFuZCB3aG8gY2FuIGVkaXQgdGhpcyBjb250YWN0LlxuICAgKiBAcGFyYW0gbGFiZWxzIFRoZSBvcHRpb25hbCBsYWJlbHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHktY3JlYXRlZCBjb250YWN0LlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ29udGFjdChcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYWRkcmVzc2VzPzogQWRkcmVzc01hcCxcbiAgICBtZXRhZGF0YT86IEpzb25WYWx1ZSxcbiAgICBlZGl0UG9saWN5PzogRWRpdFBvbGljeSxcbiAgICBsYWJlbHM/OiBDb250YWN0TGFiZWxbXSxcbiAgKTogUHJvbWlzZTxDb250YWN0PiB7XG4gICAgY29uc3QgY29udGFjdEluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuY29udGFjdENyZWF0ZShcbiAgICAgIG5hbWUsXG4gICAgICBhZGRyZXNzZXMsXG4gICAgICBtZXRhZGF0YSxcbiAgICAgIGVkaXRQb2xpY3ksXG4gICAgICBsYWJlbHMsXG4gICAgKTtcblxuICAgIHJldHVybiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGNvbnRhY3RJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjb250YWN0IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogQHBhcmFtIGNvbnRhY3RJZCBUaGUgaWQgb2YgdGhlIGNvbnRhY3QgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgY29udGFjdC5cbiAgICovXG4gIGFzeW5jIGdldENvbnRhY3QoY29udGFjdElkOiBzdHJpbmcpOiBQcm9taXNlPENvbnRhY3Q+IHtcbiAgICBjb25zdCBjb250YWN0SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0R2V0KGNvbnRhY3RJZCk7XG5cbiAgICByZXR1cm4gbmV3IENvbnRhY3QodGhpcy4jYXBpQ2xpZW50LCBjb250YWN0SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBjb250YWN0cyBpbiB0aGUgb3JnYW5pemF0aW9uLCBvcHRpb25hbGx5IG1hdGNoaW5nIHRoZSBzZWFyY2ggcXVlcnkuXG4gICAqXG4gICAqIEBwYXJhbSBzZWFyY2ggVGhlIG9wdGlvbmFsIHNlYXJjaCBxdWVyeS4gRWl0aGVyOlxuICAgKiAgLSBgbGFiZWw6Li4uYCwgd2hpY2ggd2lsbCByZXR1cm4gY29udGFjdHMgd2l0aCB0aGUgbGFiZWwgcHJvdmlkZWQgYWZ0ZXIgdGhlICc6JyxcbiAgICogIC0gYW4gZXhhY3QgYWRkcmVzcyBzZWFyY2gsIHdoaWNoIHJldHVybnMgY29udGFjdHMgd2l0aCB0aGUgcHJvdmlkZWQgQ29udGFjdEFkZHJlc3NEYXRhLFxuICAgKiAgLSBvciBhbiBhZGRyZXNzIHByZWZpeCBzZWFyY2gsIHdoZXJlIGFsbCByZXR1cm5lZCBjb250YWN0cyB3aWxsIGhhdmUgYW4gYWRkcmVzcyBzdGFydGluZyB3aXRoLCBvciBlcXVhbGluZywgdGhlIGdpdmVuIHNlYXJjaCBzdHJpbmcuXG4gICAqIEByZXR1cm5zIEFsbCBjb250YWN0cy5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RzKFxuICAgIHNlYXJjaD86IGBsYWJlbCR7Q29udGFjdExhYmVsfWAgfCBDb250YWN0QWRkcmVzc0RhdGEgfCBzdHJpbmcsXG4gICk6IFByb21pc2U8Q29udGFjdFtdPiB7XG4gICAgbGV0IGNvbnRhY3RzO1xuXG4gICAgaWYgKHNlYXJjaCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBzZWFyY2ggIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbnRhY3RzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RMb29rdXBCeUFkZHJlc3Moc2VhcmNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcGFnaW5hdG9yID0gdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RzTGlzdCh1bmRlZmluZWQsIHNlYXJjaCk7XG4gICAgICBjb250YWN0cyA9IGF3YWl0IHBhZ2luYXRvci5mZXRjaCgpO1xuICAgIH1cblxuICAgIHJldHVybiBjb250YWN0cy5tYXAoKGMpID0+IG5ldyBDb250YWN0KHRoaXMuI2FwaUNsaWVudCwgYykpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaWRlbnRpdHlQcm92ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGFuIGlkZW50aXR5IHByb29mXG4gICAqL1xuICBnZXQgcHJvdmVJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmlkZW50aXR5UHJvdmUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgZ2l2ZW4gcHJvb2Ygb2YgT0lEQyBhdXRoZW50aWNhdGlvbiBpcyB2YWxpZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmlkZW50aXR5VmVyaWZ5fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgdmVyaWZpZXMgYSBwcm9vZiBvZiBpZGVudGl0eSwgdGhyb3dpbmcgaWYgaW52YWxpZFxuICAgKi9cbiAgZ2V0IHZlcmlmeUlkZW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaWRlbnRpdHlWZXJpZnkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgTUZBIHJlcXVlc3QgSURcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBnZXRNZmFSZXF1ZXN0KG1mYUlkOiBNZmFJZCk6IE1mYVJlcXVlc3Qge1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIG1mYUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgTUZBIHJlcXVlc3RzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0cy5cbiAgICovXG4gIGFzeW5jIG1mYVJlcXVlc3RzKCk6IFByb21pc2U8TWZhUmVxdWVzdFtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudFxuICAgICAgLm1mYUxpc3QoKVxuICAgICAgLnRoZW4oKG1mYUluZm9zKSA9PiBtZmFJbmZvcy5tYXAoKG1mYUluZm8pID0+IG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgbWZhSW5mbykpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIGRlcG9zaXQgKG9yIHN0YWtpbmcpIG1lc3NhZ2UuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zaWduU3Rha2V9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHN0YWtlIHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IHN0YWtlKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2lnblN0YWtlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZykuIFRoZSBsaWZldGltZSBvZlxuICAgKiB0aGUgbmV3IHNlc3Npb24gaXMgc2lsZW50bHkgdHJ1bmNhdGVkIHRvIHRoYXQgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25DcmVhdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBuZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGdldCBjcmVhdGVTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpIHdob3NlIGxpZmV0aW1lIHBvdGVudGlhbGx5XG4gICAqIGV4dGVuZHMgdGhlIGxpZmV0aW1lIG9mIHRoZSBjdXJyZW50IHNlc3Npb24uICBNRkEgaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUV4dGVuZGVkfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gbmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBnZXQgY3JlYXRlRXh0ZW5kZWRTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUV4dGVuZGVkLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgYSBzZXNzaW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvblJldm9rZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmV2b2tlcyBhIHNlc3Npb25cbiAgICovXG4gIGdldCByZXZva2VTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvblJldm9rZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIGhlYXJ0YmVhdCAvIHVwY2hlY2sgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmhlYXJ0YmVhdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgc2VuZHMgYSBoZWFydGJlYXRcbiAgICovXG4gIGdldCBoZWFydGJlYXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5oZWFydGJlYXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3Qgb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdHMuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0TGlzdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBwYWdpbmF0b3Igb2YgdXNlci1leHBvcnQgcmVxdWVzdHNcbiAgICovXG4gIGdldCBleHBvcnRzKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydExpc3QuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydERlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhIHVzZXItZXhwb3J0IHJlcXVlc3RcbiAgICovXG4gIGdldCBkZWxldGVFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0RGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0SW5pdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHJlcXVlc3QgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgaW5pdEV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRJbml0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0Q29tcGxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXF1ZXN0IHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IGNvbXBsZXRlRXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydENvbXBsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIG9yZy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VwZGF0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgdXBkYXRlcyBhbiBvcmcgYW5kIHJldHVybnMgdXBkYXRlZCBvcmcgaW5mb3JtYXRpb25cbiAgICovXG4gIGdldCB1cGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcXVlc3QgYSBmcmVzaCBrZXktaW1wb3J0IGtleS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmNyZWF0ZUtleUltcG9ydEtleX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBmcmVzaCBrZXktaW1wb3J0IGtleVxuICAgKi9cbiAgZ2V0IGNyZWF0ZUtleUltcG9ydEtleSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmNyZWF0ZUtleUltcG9ydEtleS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0IG9uZSBvciBtb3JlIGtleXMuIFRvIHVzZSB0aGlzIGZ1bmN0aW9uYWxpdHksIHlvdSBtdXN0IGZpcnN0IGNyZWF0ZSBhblxuICAgKiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0IHVzaW5nIHRoZSBgQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGsta2V5LWltcG9ydGBcbiAgICogbGlicmFyeS4gU2VlIHRoYXQgbGlicmFyeSdzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgQW4gZW5jcnlwdGVkIGtleS1pbXBvcnQgcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGltcG9ydGVkIGtleXMuXG4gICAqL1xuICBhc3luYyBpbXBvcnRLZXlzKGJvZHk6IEltcG9ydEtleVJlcXVlc3QpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5pbXBvcnRLZXlzKGJvZHkpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8vIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGFsaWFzZXMgZm9yIE5hbWVkIFdhc20gUG9saWN5XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBXYXNtIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgV2FzbSBwb2xpY3kgb2JqZWN0LlxuICAgKiBAcGFyYW0gYWNsIE9wdGlvbmFsIGxpc3Qgb2YgcG9saWN5IGFjY2VzcyBjb250cm9sIGVudHJpZXMuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgcG9saWN5LlxuICAgKi9cbiAgY3JlYXRlV2FzbVBvbGljeSA9IHRoaXMuY3JlYXRlV2FzbUZ1bmN0aW9uO1xuXG4gIC8qKiBAcmV0dXJucyB0aGUgUG9saWN5IEVuZ2luZSBjb25maWd1cmF0aW9uIGZvciB0aGUgb3JnLiAqL1xuICBwb2xpY3lFbmdpbmVDb25maWd1cmF0aW9uID0gdGhpcy5jMmZDb25maWd1cmF0aW9uO1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIFBvbGljeSBFbmdpbmUgY29uZmlndXJhdGlvbiBmb3IgdGhlIG9yZy5cbiAgICogTm90ZSB0aGF0IHRoaXMgb3ZlcndyaXRlcyBhbnkgZXhpc3RpbmcgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNvbmZpZ3MgVGhlIFBvbGljeSBFbmdpbmUgY29uZmlndXJhdGlvbi5cbiAgICovXG4gIHNldFBvbGljeUVuZ2luZUNvbmZpZ3VyYXRpb24gPSB0aGlzLnNldEMyRkNvbmZpZ3VyYXRpb247XG59XG4iXX0=