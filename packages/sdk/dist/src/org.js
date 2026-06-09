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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFrQ0EsdUNBQW9DO0FBQ3BDLHdCQUF1RDtBQUN2RCxxQ0FNa0I7QUF1SWxCOzs7O0dBSUc7QUFDSCxNQUFhLEdBQUc7SUFNZDs7O09BR0c7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksa0JBQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLGlCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLEtBQWE7UUEzQnRDLGlDQUFzQjtRQUMvQiw2QkFBYztRQUNkLDBCQUEwQjtRQUMxQiw0QkFBZ0I7UUE4NUJoQix3REFBd0Q7UUFFeEQ7Ozs7Ozs7V0FPRztRQUNILHFCQUFnQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUUzQyw0REFBNEQ7UUFDNUQsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBRWxEOzs7OztXQUtHO1FBQ0gsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBMTVCdEQsdUJBQUEsSUFBSSxjQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUksa0JBQWMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQzNGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxhQUF3QztRQUN0RCxNQUFNLEdBQUcsR0FBRyxPQUFPLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDLENB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QUksa0JBQWtCO1FBQ3BCLE9BQU8sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBc0I7UUFDckMsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxNQUFHLENBQUMsdUJBQUEsSUFBSSxzQkFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztDQXdCRjtBQXg3QkQsa0JBdzdCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgS2V5VHlwZSxcbiAgS2V5UHJvcGVydGllcyxcbiAgTm90aWZpY2F0aW9uRW5kcG9pbnRDb25maWd1cmF0aW9uLFxuICBQYWdlT3B0cyxcbiAgVXNlckluT3JnSW5mbyxcbiAgQXBpQ2xpZW50LFxuICBPcmdJbmZvLFxuICBNZmFJZCxcbiAgSW1wb3J0S2V5UmVxdWVzdCxcbiAgS2V5UG9saWN5LFxuICBRdWVyeU1ldHJpY3NSZXNwb25zZSxcbiAgT3JnTWV0cmljTmFtZSxcbiAgUXVlcnlNZXRyaWNzUmVxdWVzdCxcbiAgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoLFxuICBKc29uVmFsdWUsXG4gIEVkaXRQb2xpY3ksXG4gIEFkZHJlc3NNYXAsXG4gIENyZWF0ZU9yZ1JlcXVlc3QsXG4gIE1lbWJlclJvbGUsXG4gIFJvbGVQb2xpY3ksXG4gIEMyRkNvbmZpZ3VyYXRpb24sXG4gIE1mYVByb3RlY3RlZEFjdGlvbixcbiAgTWZhVHlwZSxcbiAgUG9saWN5VHlwZSxcbiAgUG9saWN5QWNsLFxuICBDb250YWN0TGFiZWwsXG4gIENvbnRhY3RBZGRyZXNzRGF0YSxcbiAgT3JnRXh0UHJvcHMsXG4gIE9yZ0V4dERhdGEsXG4gIEF1ZGl0TG9nRW50cnksXG4gIEF1ZGl0TG9nUmVxdWVzdCxcbiAgTWZhUmVjZWlwdHMsXG59IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBDb250YWN0IH0gZnJvbSBcIi4vY29udGFjdFwiO1xuaW1wb3J0IHsgQzJGRnVuY3Rpb24sIEtleSwgTWZhUmVxdWVzdCwgUm9sZSB9IGZyb20gXCIuXCI7XG5pbXBvcnQge1xuICB0eXBlIE5hbWVkS2V5UG9saWN5LFxuICBOYW1lZFBvbGljeSxcbiAgdHlwZSBOYW1lZFJvbGVQb2xpY3ksXG4gIHVwbG9hZFdhc21GdW5jdGlvbixcbiAgdHlwZSBDMkZJbmZvLFxufSBmcm9tIFwiLi9wb2xpY3lcIjtcblxuLyoqIE9wdGlvbnMgcGFzZWQgdG8gY3JlYXRlS2V5IGFuZCBkZXJpdmVLZXkgKi9cbmV4cG9ydCB0eXBlIENyZWF0ZUtleVByb3BlcnRpZXMgPSBPbWl0PEtleVByb3BlcnRpZXMsIFwicG9saWN5XCI+ICYge1xuICAvKipcbiAgICogUG9saWNpZXMgdG8gYXBwbHkgdG8gdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIFRoaXMgdHlwZSBtYWtlcyBpdCBwb3NzaWJsZSB0byBhc3NpZ24gdmFsdWVzIGxpa2VcbiAgICogYFtBbGxvd0VpcDE5MVNpZ25pbmdQb2xpY3ldYCwgYnV0IHJlbWFpbnMgYmFja3dhcmRzXG4gICAqIGNvbXBhdGlibGUgd2l0aCBwcmlvciB2ZXJzaW9ucyBvZiB0aGUgU0RLLCBpbiB3aGljaFxuICAgKiB0aGlzIHByb3BlcnR5IGhhZCB0eXBlIGBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGxgLlxuICAgKi9cbiAgcG9saWN5PzogS2V5UG9saWN5IHwgdW5rbm93bltdIHwgbnVsbDtcbn07XG5cbi8qKiBPcHRpb25zIHBhc3NlZCB0byBpbXBvcnRLZXkgYW5kIGRlcml2ZUtleSAqL1xuZXhwb3J0IHR5cGUgSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyA9IENyZWF0ZUtleVByb3BlcnRpZXMgJiB7XG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIHJldHVybnMgYSAnS2V5JyBvYmplY3QgZm9yIGJvdGggbmV3IGFuZCBleGlzdGluZyBrZXlzLlxuICAgKi9cbiAgaWRlbXBvdGVudD86IGJvb2xlYW47XG59O1xuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gZGVyaXZlTXVsdGlwbGVLZXlUeXBlcyAqL1xuZXhwb3J0IHR5cGUgRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMgPSBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzICYge1xuICAvKipcbiAgICogVGhlIG1hdGVyaWFsX2lkIG9mIHRoZSBtbmVtb25pYyB1c2VkIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICpcbiAgICogSWYgdGhpcyBhcmd1bWVudCBpcyB1bmRlZmluZWQgb3IgbnVsbCwgYSBuZXcgbW5lbW9uaWMgaXMgZmlyc3QgY3JlYXRlZFxuICAgKiBhbmQgYW55IG90aGVyIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFyZSBhcHBsaWVkIHRvIGl0IChpbiBhZGRpdGlvbiB0b1xuICAgKiBiZWluZyBhcHBsaWVkIHRvIHRoZSBzcGVjaWZpZWQga2V5cykuXG4gICAqXG4gICAqIFRoZSBuZXdseSBjcmVhdGVkIG1uZW1vbmljLWlkIGNhbiBiZSByZXRyaWV2ZWQgZnJvbSB0aGUgYGRlcml2YXRpb25faW5mb2BcbiAgICogcHJvcGVydHkgb2YgdGhlIGBLZXlJbmZvYCB2YWx1ZSBmb3IgYSByZXN1bHRpbmcga2V5LlxuICAgKi9cbiAgbW5lbW9uaWNfaWQ/OiBzdHJpbmc7XG59O1xuXG4vKiogT3JnYW5pemF0aW9uIGlkICovXG5leHBvcnQgdHlwZSBPcmdJZCA9IHN0cmluZztcblxuLyoqIE9yZy13aWRlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgT3JnUG9saWN5ID1cbiAgfCBTb3VyY2VJcEFsbG93bGlzdFBvbGljeVxuICB8IE9pZGNBdXRoU291cmNlc1BvbGljeVxuICB8IE9yaWdpbkFsbG93bGlzdFBvbGljeVxuICB8IE1heERhaWx5VW5zdGFrZVBvbGljeVxuICB8IFdlYkF1dGhuUmVseWluZ1BhcnRpZXNQb2xpY3lcbiAgfCBFeGNsdXNpdmVLZXlBY2Nlc3NQb2xpY3k7XG5cbi8qKlxuICogV2hldGhlciB0byBlbmZvcmNlIGV4Y2x1c2l2ZSBhY2Nlc3MgdG8ga2V5cy4gIENvbmNyZXRlbHksXG4gKiAtIGlmIFwiTGltaXRUb0tleU93bmVyXCIgaXMgc2V0LCBvbmx5IGtleSBvd25lcnMgYXJlIHBlcm1pdHRlZCB0byBhY2Nlc3NcbiAqICAgdGhlaXIga2V5cyBmb3Igc2lnbmluZzogYSB1c2VyIHNlc3Npb24gKG5vdCBhIHJvbGUgc2Vzc2lvbikgaXMgcmVxdWlyZWRcbiAqICAgZm9yIHNpZ25pbmcsIGFuZCBhZGRpbmcgYSBrZXkgdG8gYSByb2xlIGlzIG5vdCBwZXJtaXR0ZWQuXG4gKiAtIGlmIFwiTGltaXRUb1NpbmdsZVJvbGVcIiBpcyBzZXQsIGVhY2gga2V5IGlzIHBlcm1pdHRlZCB0byBiZSBpbiBhdCBtb3N0XG4gKiAgIG9uZSByb2xlLCBhbmQgc2lnbmluZyBpcyBvbmx5IGFsbG93ZWQgd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIHJvbGUgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeGNsdXNpdmVLZXlBY2Nlc3NQb2xpY3kge1xuICBFeGNsdXNpdmVLZXlBY2Nlc3M6IFwiTGltaXRUb0tleU93bmVyXCIgfCBcIkxpbWl0VG9TaW5nbGVSb2xlXCI7XG59XG5cbi8qKlxuICogVGhlIHNldCBvZiByZWx5aW5nIHBhcnRpZXMgdG8gYWxsb3cgZm9yIHdlYmF1dGhuIHJlZ2lzdHJhdGlvblxuICogVGhlc2UgY29ycmVzcG9uZCB0byBkb21haW5zIGZyb20gd2hpY2ggYnJvd3NlcnMgY2FuIHN1Y2Nlc3NmdWxseSBjcmVhdGUgY3JlZGVudGlhbHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV2ViQXV0aG5SZWx5aW5nUGFydGllc1BvbGljeSB7XG4gIFdlYkF1dGhuUmVseWluZ1BhcnRpZXM6IHsgaWQ/OiBzdHJpbmc7IG5hbWU6IHN0cmluZyB9W107XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gYWxsb3dsaXN0IG9mIE9JREMgSXNzdWVycyBhbmQgYXVkaWVuY2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIGludG8gdGhpcyBvcmcuXG4gKlxuICogQGV4YW1wbGUge1wiT2lkY0F1dGhTb3VyY2VzXCI6IHsgXCJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb21cIjogWyBcIjEyMzQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb21cIiBdfX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPaWRjQXV0aFNvdXJjZXNQb2xpY3kge1xuICBPaWRjQXV0aFNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdIHwgSXNzdWVyQ29uZmlnPjtcbn1cblxuLyoqIE9JREMgaXNzdWVyIGNvbmZpZ3VyYXRpb24gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXNzdWVyQ29uZmlnIHtcbiAgLyoqIFRoZSBzZXQgb2YgYXVkaWVuY2VzIHN1cHBvcnRlZCBmb3IgdGhpcyBpc3N1ZXIgKi9cbiAgYXVkczogc3RyaW5nW107XG5cbiAgLyoqIFRoZSBraW5kcyBvZiB1c2VyIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhpcyBpc3N1ZXIgKi9cbiAgdXNlcnM6IE1lbWJlclJvbGVbXTtcblxuICAvKiogT3B0aW9uYWwgbmlja25hbWUgZm9yIHRoaXMgcHJvdmlkZXIgKi9cbiAgbmlja25hbWU/OiBzdHJpbmc7XG5cbiAgLyoqIFdoZXRoZXIgdG8gbWFrZSB0aGlzIGlzc3VlciBwdWJsaWMgKi9cbiAgcHVibGljPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBPbmx5IGFsbG93IHJlcXVlc3RzIGZyb20gdGhlIHNwZWNpZmllZCBvcmlnaW5zLlxuICpcbiAqIEBleGFtcGxlIHtcIk9yaWdpbkFsbG93bGlzdFwiOiBcIipcIn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmlnaW5BbGxvd2xpc3RQb2xpY3kge1xuICBPcmlnaW5BbGxvd2xpc3Q6IHN0cmluZ1tdIHwgXCIqXCI7XG59XG5cbi8qKlxuICogUmVzdHJpY3Qgc2lnbmluZyB0byBzcGVjaWZpYyBzb3VyY2UgSVAgYWRkcmVzc2VzLlxuICpcbiAqIEBleGFtcGxlIHtcIlNvdXJjZUlwQWxsb3dsaXN0XCI6IFtcIjEwLjEuMi4zLzhcIiwgXCIxNjkuMjU0LjE3LjEvMTZcIl19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlSXBBbGxvd2xpc3RQb2xpY3kge1xuICBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW107XG59XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIG51bWJlciBvZiB1bnN0YWtlcyBwZXIgZGF5LlxuICpcbiAqIEBleGFtcGxlIHtcIk1heERhaWx5VW5zdGFrZVwiOiA1IH1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXhEYWlseVVuc3Rha2VQb2xpY3kge1xuICBNYXhEYWlseVVuc3Rha2U6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBGaWx0ZXIgdG8gdXNlIHdoZW4gbGlzdGluZyBrZXlzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5RmlsdGVyIHtcbiAgLyoqIEZpbHRlciBieSBrZXkgdHlwZSAqL1xuICB0eXBlPzogS2V5VHlwZTtcbiAgLyoqIEZpbHRlciBieSBrZXkgb3duZXIgKi9cbiAgb3duZXI/OiBzdHJpbmc7XG4gIC8qKiBTZWFyY2ggYnkga2V5J3MgbWF0ZXJpYWwgaWQgYW5kIG1ldGFkYXRhICovXG4gIHNlYXJjaD86IHN0cmluZztcbiAgLyoqIFBhZ2luYXRpb24gb3B0aW9ucyAqL1xuICBwYWdlPzogUGFnZU9wdHM7XG59XG5cbi8qKlxuICogQW4gb3JnYW5pemF0aW9uLlxuICpcbiAqIEV4dGVuZHMge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGFuZCBwcm92aWRlcyBhIGZldyBvcmctc3BlY2lmaWMgbWV0aG9kcyBvbiB0b3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBPcmcge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gICNvcmdJZDogT3JnSWQ7XG4gIC8qKiBUaGUgb3JnIGluZm9ybWF0aW9uICovXG4gICNkYXRhPzogT3JnSW5mbztcblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIG9yZyBpZFxuICAgKiBAZXhhbXBsZSBPcmcjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBnZXQgaWQoKTogT3JnSWQge1xuICAgIHJldHVybiB0aGlzLiNvcmdJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyBvcmcuIFRoZSBjYWNoZWQgcHJvcGVydGllcyByZWZsZWN0IHRoZVxuICAgKiBzdGF0ZSBvZiB0aGUgbGFzdCBmZXRjaCBvciB1cGRhdGUuXG4gICAqL1xuICBnZXQgY2FjaGVkKCk6IE9yZ0luZm8gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgb3JnSWQ6IHN0cmluZykge1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gb3JnSWQgPT09IGFwaUNsaWVudC5vcmdJZCA/IGFwaUNsaWVudCA6IGFwaUNsaWVudC53aXRoVGFyZ2V0T3JnKG9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgb3JnYW5pemF0aW9uLiBUaGUgbmV3IG9yZyBpcyBhIGNoaWxkIG9mIHRoZVxuICAgKiBjdXJyZW50IG9yZyBhbmQgaW5oZXJpdHMgaXRzIGtleS1leHBvcnQgcG9saWN5LiBUaGUgbmV3IG9yZ1xuICAgKiBpcyBjcmVhdGVkIHdpdGggb25lIG93bmVyLCB0aGUgY2FsbGVyIG9mIHRoaXMgQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZU9yUmVxdWVzdCBUaGUgbmFtZSBvZiB0aGUgbmV3IG9yZyBvciB0aGUgcHJvcGVydGllcyBvZiB0aGUgbmV3IG9yZy5cbiAgICogQHJldHVybnMgSW5mb3JtYXRpb24gYWJvdXQgdGhlIG5ld2x5IGNyZWF0ZWQgb3JnLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlT3JnKG5hbWVPclJlcXVlc3Q6IHN0cmluZyB8IENyZWF0ZU9yZ1JlcXVlc3QpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBjb25zdCByZXEgPSB0eXBlb2YgbmFtZU9yUmVxdWVzdCA9PT0gXCJzdHJpbmdcIiA/IHsgbmFtZTogbmFtZU9yUmVxdWVzdCB9IDogbmFtZU9yUmVxdWVzdDtcbiAgICBpZiAoIS9eW2EtekEtWjAtOV9dezMsMzB9JC8udGVzdChyZXEubmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9yZyBuYW1lIG11c3QgYmUgYWxwaGFudW1lcmljIGFuZCBiZXR3ZWVuIDMgYW5kIDMwIGNoYXJhY3RlcnNcIik7XG4gICAgfVxuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnQ3JlYXRlT3JnKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogUXVlcnkgb3JnIG1ldHJpY3MuXG4gICAqXG4gICAqIEBwYXJhbSBtZXRyaWNOYW1lIFRoZSBtZXRyaWMgbmFtZS5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgc3RhcnQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guXG4gICAqIEBwYXJhbSBvcHQgT3RoZXIgb3B0aW9uYWwgYXJndW1lbnRzXG4gICAqIEBwYXJhbSBvcHQuZW5kX3RpbWUgVGhlIGVuZCBkYXRlIGluIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC4gSWYgb21pdHRlZCwgZGVmYXVsdHMgdG8gJ25vdycuXG4gICAqIEBwYXJhbSBvcHQucGVyaW9kIFRoZSBncmFudWxhcml0eSwgaW4gc2Vjb25kcywgb2YgdGhlIHJldHVybmVkIGRhdGEgcG9pbnRzLlxuICAgKiAgIFRoaXMgdmFsdWUgaXMgYXV0b21hdGljYWxseSByb3VuZGVkIHVwIHRvIGEgbXVsdGlwbGUgb2YgMzYwMCAoaS5lLiwgMSBob3VyKS5cbiAgICogICBJZiBvbWl0dGVkLCBkZWZhdWx0cyB0byB0aGUgZHVyYXRpb24gYmV0d2VlbiB0aGUgc3RhcnQgYW5kIHRoZSBlbmQgZGF0ZS5cbiAgICogICBNdXN0IGJlIG5vIGxlc3MgdGhhbiAxIGhvdXIsIGkuZS4sIDM2MDAgc2Vjb25kcy4gQWRkaXRpb25hbGx5LCB0aGlzIHBlcmlvZCBtdXN0IG5vdFxuICAgKiAgIGRpdmlkZSB0aGUgYGVuZFRpbWUgLSBzdGFydFRpbWVgIHBlcmlvZCBpbnRvIG1vcmUgdGhhbiAxMDAgZGF0YSBwb2ludHMuXG4gICAqIEBwYXJhbSBwYWdlT3B0cyBQYWdpbmF0aW9uIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIE1ldHJpYyB2YWx1ZXMgKGRhdGEgcG9pbnRzKSBmb3IgdGhlIHJlcXVlc3RlZCBwZXJpb2RzLlxuICAgKi9cbiAgYXN5bmMgcXVlcnlNZXRyaWNzKFxuICAgIG1ldHJpY05hbWU6IE9yZ01ldHJpY05hbWUsXG4gICAgc3RhcnRUaW1lOiBFcG9jaFRpbWVTdGFtcCxcbiAgICBvcHQ/OiBPbWl0PFF1ZXJ5TWV0cmljc1JlcXVlc3QsIFwibWV0cmljX25hbWVcIiB8IFwic3RhcnRfdGltZVwiPixcbiAgICBwYWdlT3B0cz86IFBhZ2VPcHRzLFxuICApOiBQcm9taXNlPFF1ZXJ5TWV0cmljc1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVxOiBRdWVyeU1ldHJpY3NSZXF1ZXN0ID0ge1xuICAgICAgbWV0cmljX25hbWU6IG1ldHJpY05hbWUsXG4gICAgICAuLi5vcHQsXG4gICAgICBzdGFydF90aW1lOiBzdGFydFRpbWUsXG4gICAgICAvLyBNdXN0IHNldCBlbmRfdGltZSBiZWZvcmUgZmV0Y2hBbGw6IHdpdGhvdXQgaXQgdGhlIGJhY2tlbmQgZGVmYXVsdHMgdG8gbm93KClcbiAgICAgIC8vIG9uIGVhY2ggcGFnZSByZXF1ZXN0LCBhbmQgYSBjaGFuZ2luZyB3aW5kb3cgaW52YWxpZGF0ZXMgdGhlIHBhZ2luYXRpb24gdG9rZW4uXG4gICAgICBlbmRfdGltZTogb3B0Py5lbmRfdGltZSA/PyBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKSxcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnUXVlcnlNZXRyaWNzKHJlcSwgcGFnZU9wdHMpLmZldGNoQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogUXVlcnkgdGhlIG9yZyBhdWRpdCBsb2cuXG4gICAqXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIHN0YXJ0IGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLlxuICAgKiBAcGFyYW0gb3B0IE90aGVyIG9wdGlvbmFsIGFyZ3VtZW50c1xuICAgKiBAcGFyYW0gb3B0LmVuZF90aW1lIFRoZSBlbmQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guIERlZmF1bHRzIHRvICdub3cnLlxuICAgKiBAcGFyYW0gb3B0LmV2ZW50cyBGaWx0ZXIgYnkgZXZlbnQgbmFtZS4gSWYgb21pdHRlZCwgYWxsIGV2ZW50cyBhcmUgaW5jbHVkZWQuXG4gICAqIEBwYXJhbSBwYWdlT3B0cyBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgTWF0Y2hpbmcgYXVkaXQgbG9nIGVudHJpZXMuXG4gICAqL1xuICBhc3luYyBxdWVyeUF1ZGl0TG9nKFxuICAgIHN0YXJ0VGltZTogRXBvY2hUaW1lU3RhbXAsXG4gICAgb3B0PzogT21pdDxBdWRpdExvZ1JlcXVlc3QsIFwic3RhcnRfdGltZVwiPixcbiAgICBwYWdlT3B0cz86IFBhZ2VPcHRzLFxuICApOiBQcm9taXNlPEF1ZGl0TG9nRW50cnlbXT4ge1xuICAgIGNvbnN0IHJlcTogQXVkaXRMb2dSZXF1ZXN0ID0ge1xuICAgICAgLi4ub3B0LFxuICAgICAgc3RhcnRfdGltZTogc3RhcnRUaW1lLFxuICAgICAgLy8gTXVzdCBzZXQgZW5kX3RpbWUgYmVmb3JlIGZldGNoQWxsOiB3aXRob3V0IGl0IHRoZSBiYWNrZW5kIGRlZmF1bHRzIHRvIG5vdygpXG4gICAgICAvLyBvbiBlYWNoIHBhZ2UgcmVxdWVzdCwgYW5kIGEgY2hhbmdpbmcgd2luZG93IGludmFsaWRhdGVzIHRoZSBwYWdpbmF0aW9uIHRva2VuLlxuICAgICAgZW5kX3RpbWU6IG9wdD8uZW5kX3RpbWUgPz8gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXG4gICAgfTtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnUXVlcnlBdWRpdExvZyhyZXEsIHBhZ2VPcHRzKS5mZXRjaEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBvcmcgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBvcmcgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBmZXRjaCgpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ0dldCgpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFdoZXRoZXIgdGhlIG9yZyBpcyBlbmFibGVkICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBlbmFibGUob3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiB0cnVlIH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgZGlzYWJsZShvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuICovXG4gIGFzeW5jIHBvbGljeSgpOiBQcm9taXNlPE9yZ1BvbGljeVtdPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIE9yZ1BvbGljeVtdO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIHRoZSBzaWduIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgc2lnblBvbGljeSgpOiBQcm9taXNlPFJvbGVQb2xpY3k+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5zaWduX3BvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBSb2xlUG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBuZXcgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBPcmdQb2xpY3lbXSwgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICBjb25zdCBwID0gcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W107XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwIH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgZWRpdCBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBuZXcgZWRpdCBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldEVkaXRQb2xpY3koZWRpdFBvbGljeTogRWRpdFBvbGljeSwgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBlZGl0X3BvbGljeTogZWRpdFBvbGljeSB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHNpZ24gcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKlxuICAgKiBUaGlzIGlzIGEgZ2xvYmFsIHNpZ24gcG9saWN5IHRoYXQgYXBwbGllcyB0byBldmVyeSBzaWduIG9wZXJhdGlvbiAoZXZlcnkga2V5LCBldmVyeSByb2xlKSBpbiB0aGUgb3JnLlxuICAgKiBJdCBpcyBhbmFsb2dvdXMgdG8gaG93IHJvbGUgcG9saWNpZXMgYXBwbHkgdG8gYWxsIHNpZ24gcmVxdWVzdHMgcGVyZm9ybWVkIGJ5IHRoZSBjb3JyZXNwb25kaW5nIHJvbGUgc2Vzc2lvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldFNpZ25Qb2xpY3kocG9saWN5OiBSb2xlUG9saWN5LCBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IHNpZ25fcG9saWN5OiBwb2xpY3kgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgdGhlIG9yZ2FuaXphdGlvbidzIGV4dGVuZGVkIHByb3BlcnRpZXMgKHVuY29tbW9uIGZlYXR1cmVzIG5vdCB1c2VkIGJ5IG1vc3QgdXNlcnMpLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZXh0ZW5kZWQgcHJvcGVydGllc1xuICAgKi9cbiAgYXN5bmMgZ2V0RXh0ZW5kZWRQcm9wZXJ0aWVzKCk6IFByb21pc2U8T3JnRXh0RGF0YSB8IG51bGw+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmV4dF9kYXRhID8gZGF0YS5leHRfZGF0YSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmdhbml6YXRpb24ncyBleHRlbmRlZCBwcm9wZXJ0aWVzICh1bmNvbW1vbiBmZWF0dXJlcyBub3QgdXNlZCBieSBtb3N0IHVzZXJzKS5cbiAgICpcbiAgICogQHBhcmFtIHByb3BzIFRoZSBuZXcgcHJvcGVydGllcy5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0RXh0ZW5kZWRQcm9wZXJ0aWVzKHByb3BzOiBPcmdFeHRQcm9wcywgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBleHRfcHJvcHM6IHByb3BzIH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcGVyLWFsaWVuIGtleSBjb3VudCB0aHJlc2hvbGQsIHdoaWNoLCBvbmNlIGV4Y2VlZGVkLCBkaXNhbGxvd3MgZnVydGhlciBrZXkgY3JlYXRpb24gYnkgYWxpZW4gdXNlcnMuXG4gICAqXG4gICAqIFRoaXMgc2V0dGluZyBpcyBjaGVja2VkIG9ubHkgd2hlbiBhbiBhbGllbiB1c2VyIHJlcXVlc3RzIHRvIGNyZWF0ZSBvciBpbXBvcnQgYSBuZXcga2V5LlxuICAgKiBJbiBvdGhlciB3b3Jkcywgb3JnIGFkbWlucyBjYW4gc3RpbGwgYXNzaWduIHVubGltaXRlZCBudW1iZXIgb2Yga2V5cyB0byB0aGVpciBhbGllbiB1c2Vycy5cbiAgICpcbiAgICogQHBhcmFtIGFsaWVuS2V5Q291bnRUaHJlc2hvbGQgVGhlIG5ldyBrZXkgY291bnQgdGhyZXNob2xkLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRBbGllbktleUNvdW50VGhyZXNob2xkKFxuICAgIGFsaWVuS2V5Q291bnRUaHJlc2hvbGQ6IG51bWJlcixcbiAgICBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSxcbiAgKSB7XG4gICAgY29uc3QgZGF0YSA9IHsgLi4uKChhd2FpdCB0aGlzLmdldEV4dGVuZGVkUHJvcGVydGllcygpKSA/PyB7fSkgfTtcblxuICAgIC8vIGVyYXNlIHRoZSBtZXRhZGF0YSB0aGF0IGNhbm5vdCBiZSB1cGRhdGVkXG4gICAgZGF0YS5jcmVhdGVkID0gdW5kZWZpbmVkO1xuICAgIGRhdGEubGFzdF9tb2RpZmllZCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIHVwZGF0ZSAnYWxpZW5fa2V5X2NvdW50X3RocmVzaG9sZCcgYW5kIGtlZXAgZXZlcnl0aGluZyBlbHNlIHRoZSBzYW1lXG4gICAgZGF0YS5hbGllbl9rZXlfY291bnRfdGhyZXNob2xkID0gYWxpZW5LZXlDb3VudFRocmVzaG9sZDtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IGV4dF9wcm9wczogZGF0YSB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIG5vdGlmaWNhdGlvbiBlbmRwb2ludHMgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBub3RpZmljYXRpb25fZW5kcG9pbnRzIEVuZHBvaW50cy5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0Tm90aWZpY2F0aW9uRW5kcG9pbnRzKFxuICAgIG5vdGlmaWNhdGlvbl9lbmRwb2ludHM6IE5vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbltdLFxuICAgIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9LFxuICApIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBub3RpZmljYXRpb25fZW5kcG9pbnRzIH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCByZXF1aXJlZCBNRkEgdHlwZXMgZm9yIGFjdGlvbnMgaW1wbGljaXRseSByZXF1aXJpbmcgTUZBIChzZWUge0BsaW5rIE1mYVByb3RlY3RlZEFjdGlvbn0pLlxuICAgKlxuICAgKiBAcGFyYW0gYWxsb3dlZF9tZmFfdHlwZXMgQXNzaWdubWVudCBvZiBNRkEgdHlwZXMgdG8gYWN0aW9ucyB0aGF0IGltcGxpY2l0bHkgcmVxdWlyZSBNRkEuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldEFsbG93ZWRNZmFUeXBlcyhcbiAgICBhbGxvd2VkX21mYV90eXBlczogUGFydGlhbDxSZWNvcmQ8TWZhUHJvdGVjdGVkQWN0aW9uLCBNZmFUeXBlW10+PixcbiAgICBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSxcbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgYWxsb3dlZF9tZmFfdHlwZXMgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNpZ25pbmcga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleS4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIHNldCBvbiB0aGUgbmV3IGtleS5cbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5KHR5cGU6IEtleVR5cGUsIG93bmVySWQ/OiBzdHJpbmcsIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzQ3JlYXRlKHR5cGUsIDEsIG93bmVySWQsIHByb3BzKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleXNbMF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgc2lnbmluZyBrZXlzLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXlzLiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgdG8gc2V0IG9uIHRoZSBuZXcga2V5cy5cbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5cyhcbiAgICB0eXBlOiBLZXlUeXBlLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgb3duZXJJZD86IHN0cmluZyxcbiAgICBwcm9wcz86IENyZWF0ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNDcmVhdGUodHlwZSwgY291bnQsIG93bmVySWQsIHByb3BzKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IChmaXJzdC1wYXJ0eSkgdXNlciBpbiB0aGUgb3JnYW5pemF0aW9uIGFuZCBzZW5kcyBhbiBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJJbnZpdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBpbnZpdGVzIGEgdXNlclxuICAgKi9cbiAgZ2V0IGNyZWF0ZVVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VySW52aXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGEgdXNlclxuICAgKi9cbiAgZ2V0IGRlbGV0ZVVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyRGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgT0lEQyB1c2VyLiBUaGlzIGNhbiBiZSBhIGZpcnN0LXBhcnR5IFwiTWVtYmVyXCIgb3IgdGhpcmQtcGFydHkgXCJBbGllblwiLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckNyZWF0ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIGFuIE9JREMgdXNlciwgcmVzb2x2aW5nIHRvIHRoZSBuZXcgdXNlcidzIElEXG4gICAqL1xuICBnZXQgY3JlYXRlT2lkY1VzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyQ3JlYXRlT2lkYy5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGVPaWRjfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhbiBPSURDIHVzZXJcbiAgICovXG4gIGdldCBkZWxldGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGVPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gc2VhcmNoUXVlcnkgT3B0aW9uYWwgcXVlcnkgc3RyaW5nLiBJZiBkZWZpbmVkLCBhbGwgcmV0dXJuZWQgdXNlcnMgd2lsbCBjb250YWluIHRoaXMgc3RyaW5nIGluIHRoZWlyIG5hbWUgb3IgZW1haWwuXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHVzZXJzXG4gICAqL1xuICBhc3luYyB1c2VycyhzZWFyY2hRdWVyeT86IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mb1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVc2Vyc0xpc3QodW5kZWZpbmVkLCBzZWFyY2hRdWVyeSkuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24gKHBhZ2luYXRlZCkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2Vyc0xpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcGFnaW5hdGVkIGxpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGdldCB1c2Vyc1BhZ2luYXRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyR2V0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlciBieSBlbWFpbC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJHZXRCeUVtYWlsfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXJCeUVtYWlsKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckdldEJ5RW1haWwuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IE9JREMgSUQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0QnlPaWRjfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXJCeU9pZGMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyR2V0QnlPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgYSB1c2VyIGluIHRoaXMgb3JnXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byBlbmFibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGVuYWJsZVVzZXIodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKHVzZXJJZCwgeyBkaXNhYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSBhIHVzZXIgaW4gdGhpcyBvcmdcbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIGRpc2FibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGRpc2FibGVVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCh1c2VySWQsIHsgZGlzYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBhY2Nlc3NpYmxlIGtleXMgaW4gdGhlIG9yZ2FuaXphdGlvblxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHMgT3B0aW9uYWwgZmlsdGVyaW5nIHByb3BlcnRpZXMuXG4gICAqIEByZXR1cm5zIFRoZSBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwcm9wcz86IEtleUZpbHRlcik6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLiNhcGlDbGllbnQua2V5c0xpc3QoXG4gICAgICBwcm9wcz8udHlwZSxcbiAgICAgIHByb3BzPy5wYWdlLFxuICAgICAgcHJvcHM/Lm93bmVyLFxuICAgICAgcHJvcHM/LnNlYXJjaCxcbiAgICApO1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBwYWdpbmF0b3IuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyBjcmVhdGVSb2xlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSWQgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUNyZWF0ZShuYW1lKTtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJvbGUgYnkgaWQgb3IgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgZ2V0Um9sZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdGhlIHJvbGVzIGluIHRoZSBvcmdcbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIHBhZ2luYXRvciBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSByb2xlc1xuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZTogUGFnZU9wdHMpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiByb2xlcy5tYXAoKHIpID0+IG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgcG9saWN5IHJ1bGVzLlxuICAgKiBAcGFyYW0gYWNsIE9wdGlvbmFsIGxpc3Qgb2YgcG9saWN5IGFjY2VzcyBjb250cm9sIGVudHJpZXMuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlUG9saWN5PFR5cGUgZXh0ZW5kcyBcIktleVwiIHwgXCJSb2xlXCI+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBUeXBlLFxuICAgIHJ1bGVzOiBUeXBlIGV4dGVuZHMgXCJLZXlcIiA/IEtleVBvbGljeSA6IFJvbGVQb2xpY3ksXG4gICAgYWNsPzogUG9saWN5QWNsLFxuICApOiBQcm9taXNlPFR5cGUgZXh0ZW5kcyBcIktleVwiID8gTmFtZWRLZXlQb2xpY3kgOiBOYW1lZFJvbGVQb2xpY3k+IHtcbiAgICBjb25zdCBwb2xpY3lJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUNyZWF0ZShuYW1lLCB0eXBlLCBydWxlcywgYWNsKTtcbiAgICBjb25zdCBwb2xpY3kgPSBOYW1lZFBvbGljeS5mcm9tSW5mbyh0aGlzLiNhcGlDbGllbnQsIHBvbGljeUluZm8pO1xuICAgIHJldHVybiBwb2xpY3kgYXMgVHlwZSBleHRlbmRzIFwiS2V5XCIgPyBOYW1lZEtleVBvbGljeSA6IE5hbWVkUm9sZVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBuYW1lZCBwb2xpY3kgYnkgaWQgb3IgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSBwb2xpY3kgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgZ2V0UG9saWN5KHBvbGljeUlkOiBzdHJpbmcpOiBQcm9taXNlPE5hbWVkUG9saWN5PiB7XG4gICAgY29uc3QgcG9saWN5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lHZXQocG9saWN5SWQsIFwibGF0ZXN0XCIpO1xuICAgIHJldHVybiBOYW1lZFBvbGljeS5mcm9tSW5mbyh0aGlzLiNhcGlDbGllbnQsIHBvbGljeUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbiBieSBuYW1lIG9yIG5hbWVkIHBvbGljeSBJRC5cbiAgICpcbiAgICogQHBhcmFtIGZ1bmN0aW9uSWQgVGhlIG5hbWUgb3IgbmFtZWQgcG9saWN5IElEIG9mIHRoZSBmdW5jdGlvbiB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBDMkYgZnVuY3Rpb24uXG4gICAqIEB0aHJvd3MgaWYgbmFtZSBvciBJRCBpcyBub3QgYXNzb2NpYXRlZCB0byBhIEMyRiBmdW5jdGlvbiAoaS5lLiB0aGUgbmFtZS9pZCBpcyBmb3IgYSBrZXkgb3Igcm9sZSBuYW1lZCBwb2xpY3kpXG4gICAqL1xuICBhc3luYyBnZXRGdW5jdGlvbihmdW5jdGlvbklkOiBzdHJpbmcpOiBQcm9taXNlPEMyRkZ1bmN0aW9uPiB7XG4gICAgY29uc3QgZnVuY3Rpb25JbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUdldChmdW5jdGlvbklkLCBcImxhdGVzdFwiKTtcbiAgICBpZiAoZnVuY3Rpb25JbmZvLnBvbGljeV90eXBlICE9PSBcIldhc21cIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgJHtmdW5jdGlvbklkfSBpcyBub3QgYSBXYXNtIGZ1bmN0aW9uLCBpdCBpcyBhICR7ZnVuY3Rpb25JbmZvLnBvbGljeV90eXBlfSBuYW1lZCBwb2xpY3lgLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDMkZGdW5jdGlvbih0aGlzLiNhcGlDbGllbnQsIGZ1bmN0aW9uSW5mbyBhcyBDMkZJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB0aGUgbmFtZWQgcG9saWNpZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEBwYXJhbSBwb2xpY3lUeXBlIFRoZSBvcHRpb25hbCB0eXBlIG9mIHBvbGljaWVzIHRvIGZldGNoLiBEZWZhdWx0cyB0byBmZXRjaGluZyBhbGwgbmFtZWQgcG9saWNpZXMgcmVnYXJkbGVzcyBvZiB0eXBlLlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWNpZXMuXG4gICAqL1xuICBhc3luYyBwb2xpY2llcyhwYWdlPzogUGFnZU9wdHMsIHBvbGljeVR5cGU/OiBQb2xpY3lUeXBlKTogUHJvbWlzZTxOYW1lZFBvbGljeVtdPiB7XG4gICAgY29uc3QgcG9saWNpZXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWNpZXNMaXN0KHBhZ2UsIHBvbGljeVR5cGUpLmZldGNoKCk7XG4gICAgcmV0dXJuIHBvbGljaWVzLm1hcCgocCkgPT4gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdGhlIEMyRiBmdW5jdGlvbnMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIHBhZ2luYXRvciBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBUaGUgQzJGIGZ1bmN0aW9ucy5cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9ucyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEMyRkZ1bmN0aW9uW10+IHtcbiAgICBjb25zdCBwb2xpY2llcyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY2llc0xpc3QocGFnZSwgXCJXYXNtXCIpLmZldGNoKCk7XG4gICAgcmV0dXJuIHBvbGljaWVzLm1hcCgoZGF0YSkgPT4gbmV3IEMyRkZ1bmN0aW9uKHRoaXMuI2FwaUNsaWVudCwgZGF0YSBhcyBDMkZJbmZvKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBXYXNtIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gYWNsIE9wdGlvbmFsIGxpc3Qgb2YgcG9saWN5IGFjY2VzcyBjb250cm9sIGVudHJpZXMuXG4gICAqIEByZXR1cm5zIFRoZSBDMkYgZnVuY3Rpb25cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhc21GdW5jdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcG9saWN5OiBVaW50OEFycmF5LFxuICAgIGFjbD86IFBvbGljeUFjbCxcbiAgKTogUHJvbWlzZTxDMkZGdW5jdGlvbj4ge1xuICAgIGNvbnN0IGhhc2ggPSBhd2FpdCB1cGxvYWRXYXNtRnVuY3Rpb24odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3kpO1xuICAgIGNvbnN0IHBvbGljeUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5Q3JlYXRlKFxuICAgICAgbmFtZSxcbiAgICAgIFwiV2FzbVwiLFxuICAgICAgW1xuICAgICAgICB7XG4gICAgICAgICAgaGFzaCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBhY2wsXG4gICAgKTtcbiAgICByZXR1cm4gbmV3IEMyRkZ1bmN0aW9uKHRoaXMuI2FwaUNsaWVudCwgcG9saWN5SW5mbyBhcyBDMkZJbmZvKTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9ucyBjb25maWd1cmF0aW9uIGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBjMmZDb25maWd1cmF0aW9uKCk6IFByb21pc2U8QzJGQ29uZmlndXJhdGlvbiB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEucG9saWN5X2VuZ2luZV9jb25maWd1cmF0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9ucyBjb25maWd1cmF0aW9uIGZvciB0aGUgb3JnLlxuICAgKiBOb3RlIHRoYXQgdGhpcyBvdmVyd3JpdGVzIGFueSBleGlzdGluZyBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gY29uZmlncyBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb25zIGNvbmZpZ3VyYXRpb24uXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldEMyRkNvbmZpZ3VyYXRpb24oY29uZmlnczogQzJGQ29uZmlndXJhdGlvbiwgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoXG4gICAgICB7XG4gICAgICAgIHBvbGljeV9lbmdpbmVfY29uZmlndXJhdGlvbjogY29uZmlncyxcbiAgICAgIH0sXG4gICAgICBvcHRzPy5tZmFSZWNlaXB0LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEga2V5IG9mIHRoZSBnaXZlbiB0eXBlIHVzaW5nIHRoZSBnaXZlbiBkZXJpdmF0aW9uIHBhdGggYW5kIG1uZW1vbmljLlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5IHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblBhdGggTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRoIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBuZXdseSBkZXJpdmVkIGtleSBvciB1bmRlZmluZWQgaWYgaXQgYWxyZWFkeSBleGlzdHMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXkoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aDogc3RyaW5nLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5IHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmRlcml2ZUtleXModHlwZSwgW2Rlcml2YXRpb25QYXRoXSwgbW5lbW9uaWNJZCwgcHJvcHMpKVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBzZXQgb2Yga2V5cyBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRocyBhbmQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXlzIHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblBhdGhzIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aHMgdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gbW5lbW9uaWNJZCBtYXRlcmlhbF9pZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleXMoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNEZXJpdmUodHlwZSwgZGVyaXZhdGlvblBhdGhzLCBtbmVtb25pY0lkLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBlaXRoZXIgYSBuZXcgb3IgZXhpc3RpbmcgbW5lbW9uaWMgdG8gZGVyaXZlIGtleXMgb2Ygb25lIG9yIG1vcmVcbiAgICogc3BlY2lmaWVkIHR5cGVzIHZpYSBzcGVjaWZpZWQgZGVyaXZhdGlvbiBwYXRocy5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzIEEgbGlzdCBvZiBgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoYCBvYmplY3RzIHNwZWNpZnlpbmcgdGhlIGtleXMgdG8gYmUgZGVyaXZlZFxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlTXVsdGlwbGVLZXlUeXBlcyhcbiAgICBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRoczogS2V5VHlwZUFuZERlcml2YXRpb25QYXRoW10sXG4gICAgcHJvcHM/OiBEZXJpdmVNdWx0aXBsZUtleVR5cGVzUHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0Rlcml2ZU11bHRpKGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpZC5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGtleS5cbiAgICovXG4gIGFzeW5jIGdldEtleShrZXlJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldChrZXlJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaXRzIG1hdGVyaWFsIGlkIChlLmcuLCBhZGRyZXNzKS5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIGtleSB0eXBlLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxJZCBUaGUgbWF0ZXJpYWwgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXlCeU1hdGVyaWFsSWQoa2V5VHlwZTogS2V5VHlwZSwgbWF0ZXJpYWxJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldEJ5TWF0ZXJpYWxJZChrZXlUeXBlLCBtYXRlcmlhbElkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIGNvbnRhY3QuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIGZvciB0aGUgbmV3IGNvbnRhY3QuXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuXG4gICAqIEBwYXJhbSBtZXRhZGF0YSBNZXRhZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuIEludGVuZGVkIGZvciB1c2UgYXMgYSBkZXNjcmlwdGlvbi5cbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIGVkaXQgcG9saWN5IGZvciB0aGUgY29udGFjdCwgZGV0ZXJtaW5pbmcgd2hlbiBhbmQgd2hvIGNhbiBlZGl0IHRoaXMgY29udGFjdC5cbiAgICogQHBhcmFtIGxhYmVscyBUaGUgb3B0aW9uYWwgbGFiZWxzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29udGFjdC5cbiAgICogQHJldHVybnMgVGhlIG5ld2x5LWNyZWF0ZWQgY29udGFjdC5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNvbnRhY3QoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFkZHJlc3Nlcz86IEFkZHJlc3NNYXAsXG4gICAgbWV0YWRhdGE/OiBKc29uVmFsdWUsXG4gICAgZWRpdFBvbGljeT86IEVkaXRQb2xpY3ksXG4gICAgbGFiZWxzPzogQ29udGFjdExhYmVsW10sXG4gICk6IFByb21pc2U8Q29udGFjdD4ge1xuICAgIGNvbnN0IGNvbnRhY3RJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RDcmVhdGUoXG4gICAgICBuYW1lLFxuICAgICAgYWRkcmVzc2VzLFxuICAgICAgbWV0YWRhdGEsXG4gICAgICBlZGl0UG9saWN5LFxuICAgICAgbGFiZWxzLFxuICAgICk7XG5cbiAgICByZXR1cm4gbmV3IENvbnRhY3QodGhpcy4jYXBpQ2xpZW50LCBjb250YWN0SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgY29udGFjdCBieSBpdHMgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBjb250YWN0SWQgVGhlIGlkIG9mIHRoZSBjb250YWN0IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBnZXRDb250YWN0KGNvbnRhY3RJZDogc3RyaW5nKTogUHJvbWlzZTxDb250YWN0PiB7XG4gICAgY29uc3QgY29udGFjdEluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuY29udGFjdEdldChjb250YWN0SWQpO1xuXG4gICAgcmV0dXJuIG5ldyBDb250YWN0KHRoaXMuI2FwaUNsaWVudCwgY29udGFjdEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgY29udGFjdHMgaW4gdGhlIG9yZ2FuaXphdGlvbiwgb3B0aW9uYWxseSBtYXRjaGluZyB0aGUgc2VhcmNoIHF1ZXJ5LlxuICAgKlxuICAgKiBAcGFyYW0gc2VhcmNoIFRoZSBvcHRpb25hbCBzZWFyY2ggcXVlcnkuIEVpdGhlcjpcbiAgICogIC0gYGxhYmVsOi4uLmAsIHdoaWNoIHdpbGwgcmV0dXJuIGNvbnRhY3RzIHdpdGggdGhlIGxhYmVsIHByb3ZpZGVkIGFmdGVyIHRoZSAnOicsXG4gICAqICAtIGFuIGV4YWN0IGFkZHJlc3Mgc2VhcmNoLCB3aGljaCByZXR1cm5zIGNvbnRhY3RzIHdpdGggdGhlIHByb3ZpZGVkIENvbnRhY3RBZGRyZXNzRGF0YSxcbiAgICogIC0gb3IgYW4gYWRkcmVzcyBwcmVmaXggc2VhcmNoLCB3aGVyZSBhbGwgcmV0dXJuZWQgY29udGFjdHMgd2lsbCBoYXZlIGFuIGFkZHJlc3Mgc3RhcnRpbmcgd2l0aCwgb3IgZXF1YWxpbmcsIHRoZSBnaXZlbiBzZWFyY2ggc3RyaW5nLlxuICAgKiBAcmV0dXJucyBBbGwgY29udGFjdHMuXG4gICAqL1xuICBhc3luYyBjb250YWN0cyhcbiAgICBzZWFyY2g/OiBgbGFiZWwke0NvbnRhY3RMYWJlbH1gIHwgQ29udGFjdEFkZHJlc3NEYXRhIHwgc3RyaW5nLFxuICApOiBQcm9taXNlPENvbnRhY3RbXT4ge1xuICAgIGxldCBjb250YWN0cztcblxuICAgIGlmIChzZWFyY2ggIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygc2VhcmNoICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb250YWN0cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0TG9va3VwQnlBZGRyZXNzKHNlYXJjaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHBhZ2luYXRvciA9IHRoaXMuI2FwaUNsaWVudC5jb250YWN0c0xpc3QodW5kZWZpbmVkLCBzZWFyY2gpO1xuICAgICAgY29udGFjdHMgPSBhd2FpdCBwYWdpbmF0b3IuZmV0Y2goKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGFjdHMubWFwKChjKSA9PiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmlkZW50aXR5UHJvdmV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhbiBpZGVudGl0eSBwcm9vZlxuICAgKi9cbiAgZ2V0IHByb3ZlSWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5pZGVudGl0eVByb3ZlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIGdpdmVuIHByb29mIG9mIE9JREMgYXV0aGVudGljYXRpb24gaXMgdmFsaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pZGVudGl0eVZlcmlmeX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHZlcmlmaWVzIGEgcHJvb2Ygb2YgaWRlbnRpdHksIHRocm93aW5nIGlmIGludmFsaWRcbiAgICovXG4gIGdldCB2ZXJpZnlJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmlkZW50aXR5VmVyaWZ5LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgZ2V0TWZhUmVxdWVzdChtZmFJZDogTWZhSWQpOiBNZmFSZXF1ZXN0IHtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBtZmFJZCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFSZXF1ZXN0cygpOiBQcm9taXNlPE1mYVJlcXVlc3RbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnRcbiAgICAgIC5tZmFMaXN0KClcbiAgICAgIC50aGVuKChtZmFJbmZvcykgPT4gbWZhSW5mb3MubWFwKChtZmFJbmZvKSA9PiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIG1mYUluZm8pKSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiBkZXBvc2l0IChvciBzdGFraW5nKSBtZXNzYWdlLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2lnblN0YWtlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdGFrZSByZXNwb25zZS5cbiAgICovXG4gIGdldCBzdGFrZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNpZ25TdGFrZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpLiBUaGUgbGlmZXRpbWUgb2ZcbiAgICogdGhlIG5ldyBzZXNzaW9uIGlzIHNpbGVudGx5IHRydW5jYXRlZCB0byB0aGF0IG9mIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uQ3JlYXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gbmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBnZXQgY3JlYXRlU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKSB3aG9zZSBsaWZldGltZSBwb3RlbnRpYWxseVxuICAgKiBleHRlbmRzIHRoZSBsaWZldGltZSBvZiB0aGUgY3VycmVudCBzZXNzaW9uLiAgTUZBIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25DcmVhdGVFeHRlbmRlZH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIG5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgZ2V0IGNyZWF0ZUV4dGVuZGVkU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGVFeHRlbmRlZC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGEgc2Vzc2lvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25SZXZva2V9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldm9rZXMgYSBzZXNzaW9uXG4gICAqL1xuICBnZXQgcmV2b2tlU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25SZXZva2UuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBoZWFydGJlYXQgLyB1cGNoZWNrIHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5oZWFydGJlYXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHNlbmRzIGEgaGVhcnRiZWF0XG4gICAqL1xuICBnZXQgaGVhcnRiZWF0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaGVhcnRiZWF0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3RzLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydExpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgcGFnaW5hdG9yIG9mIHVzZXItZXhwb3J0IHJlcXVlc3RzXG4gICAqL1xuICBnZXQgZXhwb3J0cygpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRMaXN0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnREZWxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyLWV4cG9ydCByZXF1ZXN0XG4gICAqL1xuICBnZXQgZGVsZXRlRXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydERlbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydEluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXF1ZXN0IHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IGluaXRFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0SW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydENvbXBsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgcmVxdWVzdCByZXNwb25zZS5cbiAgICovXG4gIGdldCBjb21wbGV0ZUV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRDb21wbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVcGRhdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgYW4gb3JnIGFuZCByZXR1cm5zIHVwZGF0ZWQgb3JnIGluZm9ybWF0aW9uXG4gICAqL1xuICBnZXQgdXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IGEgZnJlc2gga2V5LWltcG9ydCBrZXkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5jcmVhdGVLZXlJbXBvcnRLZXl9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgZnJlc2gga2V5LWltcG9ydCBrZXlcbiAgICovXG4gIGdldCBjcmVhdGVLZXlJbXBvcnRLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5jcmVhdGVLZXlJbXBvcnRLZXkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydCBvbmUgb3IgbW9yZSBrZXlzLiBUbyB1c2UgdGhpcyBmdW5jdGlvbmFsaXR5LCB5b3UgbXVzdCBmaXJzdCBjcmVhdGUgYW5cbiAgICogZW5jcnlwdGVkIGtleS1pbXBvcnQgcmVxdWVzdCB1c2luZyB0aGUgYEBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrLWtleS1pbXBvcnRgXG4gICAqIGxpYnJhcnkuIFNlZSB0aGF0IGxpYnJhcnkncyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IEFuIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBpbXBvcnRlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5cyhib2R5OiBJbXBvcnRLZXlSZXF1ZXN0KTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuaW1wb3J0S2V5cyhib2R5KTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvLyBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBhbGlhc2VzIGZvciBOYW1lZCBXYXNtIFBvbGljeVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgV2FzbSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIFdhc20gcG9saWN5IG9iamVjdC5cbiAgICogQHBhcmFtIGFjbCBPcHRpb25hbCBsaXN0IG9mIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHBvbGljeS5cbiAgICovXG4gIGNyZWF0ZVdhc21Qb2xpY3kgPSB0aGlzLmNyZWF0ZVdhc21GdW5jdGlvbjtcblxuICAvKiogQHJldHVybnMgdGhlIFBvbGljeSBFbmdpbmUgY29uZmlndXJhdGlvbiBmb3IgdGhlIG9yZy4gKi9cbiAgcG9saWN5RW5naW5lQ29uZmlndXJhdGlvbiA9IHRoaXMuYzJmQ29uZmlndXJhdGlvbjtcblxuICAvKipcbiAgICogU2V0IHRoZSBQb2xpY3kgRW5naW5lIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBvcmcuXG4gICAqIE5vdGUgdGhhdCB0aGlzIG92ZXJ3cml0ZXMgYW55IGV4aXN0aW5nIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBjb25maWdzIFRoZSBQb2xpY3kgRW5naW5lIGNvbmZpZ3VyYXRpb24uXG4gICAqL1xuICBzZXRQb2xpY3lFbmdpbmVDb25maWd1cmF0aW9uID0gdGhpcy5zZXRDMkZDb25maWd1cmF0aW9uO1xufVxuIl19