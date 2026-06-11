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
import { Contact } from "./contact.js";
import { C2FFunction, Key, MfaRequest, Role } from "./index.js";
import { NamedPolicy, uploadWasmFunction, } from "./policy.js";
/**
 * An organization.
 *
 * Extends {@link CubeSignerClient} and provides a few org-specific methods on top.
 */
export class Org {
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
        return new Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), keys[0]);
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
        return keys.map((k) => new Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
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
        return keys.map((k) => new Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
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
        return new Role(__classPrivateFieldGet(this, _Org_apiClient, "f"), roleInfo);
    }
    /**
     * Get a role by id or name.
     *
     * @param roleId The id or name of the role to get.
     * @returns The role.
     */
    async getRole(roleId) {
        const roleInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").roleGet(roleId);
        return new Role(__classPrivateFieldGet(this, _Org_apiClient, "f"), roleInfo);
    }
    /**
     * Gets all the roles in the org
     *
     * @param page The paginator options
     * @returns The roles
     */
    async roles(page) {
        const roles = await __classPrivateFieldGet(this, _Org_apiClient, "f").rolesList(page).fetch();
        return roles.map((r) => new Role(__classPrivateFieldGet(this, _Org_apiClient, "f"), r));
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
        const policy = NamedPolicy.fromInfo(__classPrivateFieldGet(this, _Org_apiClient, "f"), policyInfo);
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
        return NamedPolicy.fromInfo(__classPrivateFieldGet(this, _Org_apiClient, "f"), policyInfo);
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
        return new C2FFunction(__classPrivateFieldGet(this, _Org_apiClient, "f"), functionInfo);
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
        return policies.map((p) => NamedPolicy.fromInfo(__classPrivateFieldGet(this, _Org_apiClient, "f"), p));
    }
    /**
     * Gets all the C2F functions in the org.
     *
     * @param page The paginator options.
     * @returns The C2F functions.
     */
    async functions(page) {
        const policies = await __classPrivateFieldGet(this, _Org_apiClient, "f").policiesList(page, "Wasm").fetch();
        return policies.map((data) => new C2FFunction(__classPrivateFieldGet(this, _Org_apiClient, "f"), data));
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
        const hash = await uploadWasmFunction(__classPrivateFieldGet(this, _Org_apiClient, "f"), policy);
        const policyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").policyCreate(name, "Wasm", [
            {
                hash,
            },
        ], acl);
        return new C2FFunction(__classPrivateFieldGet(this, _Org_apiClient, "f"), policyInfo);
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
        return keys.map((k) => new Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
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
        return keys.map((k) => new Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
    }
    /**
     * Get a key by id.
     *
     * @param keyId The id of the key to get.
     * @returns The key.
     */
    async getKey(keyId) {
        const keyInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").keyGet(keyId);
        return new Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), keyInfo);
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
        return new Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), keyInfo);
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
        return new Contact(__classPrivateFieldGet(this, _Org_apiClient, "f"), contactInfo);
    }
    /**
     * Get a contact by its id.
     *
     * @param contactId The id of the contact to get.
     * @returns The contact.
     */
    async getContact(contactId) {
        const contactInfo = await __classPrivateFieldGet(this, _Org_apiClient, "f").contactGet(contactId);
        return new Contact(__classPrivateFieldGet(this, _Org_apiClient, "f"), contactInfo);
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
        return contacts.map((c) => new Contact(__classPrivateFieldGet(this, _Org_apiClient, "f"), c));
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
        return new MfaRequest(__classPrivateFieldGet(this, _Org_apiClient, "f"), mfaId);
    }
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @returns The MFA requests.
     */
    async mfaRequests() {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f")
            .mfaList()
            .then((mfaInfos) => mfaInfos.map((mfaInfo) => new MfaRequest(__classPrivateFieldGet(this, _Org_apiClient, "f"), mfaInfo)));
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
        return keys.map((k) => new Key(__classPrivateFieldGet(this, _Org_apiClient, "f"), k));
    }
}
_Org_apiClient = new WeakMap(), _Org_orgId = new WeakMap(), _Org_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFrQ0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ2hFLE9BQU8sRUFFTCxXQUFXLEVBRVgsa0JBQWtCLEdBRW5CLE1BQU0sYUFBYSxDQUFDO0FBdUlyQjs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLEdBQUc7SUFNZDs7O09BR0c7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksa0JBQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLGlCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLEtBQWE7UUEzQnRDLGlDQUFzQjtRQUMvQiw2QkFBYztRQUNkLDBCQUEwQjtRQUMxQiw0QkFBZ0I7UUE4NUJoQix3REFBd0Q7UUFFeEQ7Ozs7Ozs7V0FPRztRQUNILHFCQUFnQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUUzQyw0REFBNEQ7UUFDNUQsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBRWxEOzs7OztXQUtHO1FBQ0gsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBMTVCdEQsdUJBQUEsSUFBSSxjQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUksa0JBQWMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBQSxDQUFDO0lBQzNGLENBQUM7SUFFRDs7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LE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxJQUFJLGtCQUFrQjtRQUNwQixPQUFPLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsdUJBQUEsSUFBSSxzQkFBVyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUFDLElBQXNCO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLHVCQUFBLElBQUksc0JBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7Q0F3QkYiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEtleVR5cGUsXG4gIEtleVByb3BlcnRpZXMsXG4gIE5vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbixcbiAgUGFnZU9wdHMsXG4gIFVzZXJJbk9yZ0luZm8sXG4gIEFwaUNsaWVudCxcbiAgT3JnSW5mbyxcbiAgTWZhSWQsXG4gIEltcG9ydEtleVJlcXVlc3QsXG4gIEtleVBvbGljeSxcbiAgUXVlcnlNZXRyaWNzUmVzcG9uc2UsXG4gIE9yZ01ldHJpY05hbWUsXG4gIFF1ZXJ5TWV0cmljc1JlcXVlc3QsXG4gIEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aCxcbiAgSnNvblZhbHVlLFxuICBFZGl0UG9saWN5LFxuICBBZGRyZXNzTWFwLFxuICBDcmVhdGVPcmdSZXF1ZXN0LFxuICBNZW1iZXJSb2xlLFxuICBSb2xlUG9saWN5LFxuICBDMkZDb25maWd1cmF0aW9uLFxuICBNZmFQcm90ZWN0ZWRBY3Rpb24sXG4gIE1mYVR5cGUsXG4gIFBvbGljeVR5cGUsXG4gIFBvbGljeUFjbCxcbiAgQ29udGFjdExhYmVsLFxuICBDb250YWN0QWRkcmVzc0RhdGEsXG4gIE9yZ0V4dFByb3BzLFxuICBPcmdFeHREYXRhLFxuICBBdWRpdExvZ0VudHJ5LFxuICBBdWRpdExvZ1JlcXVlc3QsXG4gIE1mYVJlY2VpcHRzLFxufSBmcm9tIFwiLi9pbmRleC50c1wiO1xuaW1wb3J0IHsgQ29udGFjdCB9IGZyb20gXCIuL2NvbnRhY3QudHNcIjtcbmltcG9ydCB7IEMyRkZ1bmN0aW9uLCBLZXksIE1mYVJlcXVlc3QsIFJvbGUgfSBmcm9tIFwiLi9pbmRleC50c1wiO1xuaW1wb3J0IHtcbiAgdHlwZSBOYW1lZEtleVBvbGljeSxcbiAgTmFtZWRQb2xpY3ksXG4gIHR5cGUgTmFtZWRSb2xlUG9saWN5LFxuICB1cGxvYWRXYXNtRnVuY3Rpb24sXG4gIHR5cGUgQzJGSW5mbyxcbn0gZnJvbSBcIi4vcG9saWN5LnRzXCI7XG5cbi8qKiBPcHRpb25zIHBhc2VkIHRvIGNyZWF0ZUtleSBhbmQgZGVyaXZlS2V5ICovXG5leHBvcnQgdHlwZSBDcmVhdGVLZXlQcm9wZXJ0aWVzID0gT21pdDxLZXlQcm9wZXJ0aWVzLCBcInBvbGljeVwiPiAmIHtcbiAgLyoqXG4gICAqIFBvbGljaWVzIHRvIGFwcGx5IHRvIHRoZSBuZXcga2V5LlxuICAgKlxuICAgKiBUaGlzIHR5cGUgbWFrZXMgaXQgcG9zc2libGUgdG8gYXNzaWduIHZhbHVlcyBsaWtlXG4gICAqIGBbQWxsb3dFaXAxOTFTaWduaW5nUG9saWN5XWAsIGJ1dCByZW1haW5zIGJhY2t3YXJkc1xuICAgKiBjb21wYXRpYmxlIHdpdGggcHJpb3IgdmVyc2lvbnMgb2YgdGhlIFNESywgaW4gd2hpY2hcbiAgICogdGhpcyBwcm9wZXJ0eSBoYWQgdHlwZSBgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfCBudWxsYC5cbiAgICovXG4gIHBvbGljeT86IEtleVBvbGljeSB8IHVua25vd25bXSB8IG51bGw7XG59O1xuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gaW1wb3J0S2V5IGFuZCBkZXJpdmVLZXkgKi9cbmV4cG9ydCB0eXBlIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMgPSBDcmVhdGVLZXlQcm9wZXJ0aWVzICYge1xuICAvKipcbiAgICogV2hlbiB0cnVlLCByZXR1cm5zIGEgJ0tleScgb2JqZWN0IGZvciBib3RoIG5ldyBhbmQgZXhpc3Rpbmcga2V5cy5cbiAgICovXG4gIGlkZW1wb3RlbnQ/OiBib29sZWFuO1xufTtcblxuLyoqIE9wdGlvbnMgcGFzc2VkIHRvIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMgKi9cbmV4cG9ydCB0eXBlIERlcml2ZU11bHRpcGxlS2V5VHlwZXNQcm9wZXJ0aWVzID0gSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyAmIHtcbiAgLyoqXG4gICAqIFRoZSBtYXRlcmlhbF9pZCBvZiB0aGUgbW5lbW9uaWMgdXNlZCB0byBkZXJpdmUgbmV3IGtleXMuXG4gICAqXG4gICAqIElmIHRoaXMgYXJndW1lbnQgaXMgdW5kZWZpbmVkIG9yIG51bGwsIGEgbmV3IG1uZW1vbmljIGlzIGZpcnN0IGNyZWF0ZWRcbiAgICogYW5kIGFueSBvdGhlciBzcGVjaWZpZWQgcHJvcGVydGllcyBhcmUgYXBwbGllZCB0byBpdCAoaW4gYWRkaXRpb24gdG9cbiAgICogYmVpbmcgYXBwbGllZCB0byB0aGUgc3BlY2lmaWVkIGtleXMpLlxuICAgKlxuICAgKiBUaGUgbmV3bHkgY3JlYXRlZCBtbmVtb25pYy1pZCBjYW4gYmUgcmV0cmlldmVkIGZyb20gdGhlIGBkZXJpdmF0aW9uX2luZm9gXG4gICAqIHByb3BlcnR5IG9mIHRoZSBgS2V5SW5mb2AgdmFsdWUgZm9yIGEgcmVzdWx0aW5nIGtleS5cbiAgICovXG4gIG1uZW1vbmljX2lkPzogc3RyaW5nO1xufTtcblxuLyoqIE9yZ2FuaXphdGlvbiBpZCAqL1xuZXhwb3J0IHR5cGUgT3JnSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmctd2lkZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIE9yZ1BvbGljeSA9XG4gIHwgU291cmNlSXBBbGxvd2xpc3RQb2xpY3lcbiAgfCBPaWRjQXV0aFNvdXJjZXNQb2xpY3lcbiAgfCBPcmlnaW5BbGxvd2xpc3RQb2xpY3lcbiAgfCBNYXhEYWlseVVuc3Rha2VQb2xpY3lcbiAgfCBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzUG9saWN5XG4gIHwgRXhjbHVzaXZlS2V5QWNjZXNzUG9saWN5O1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gZW5mb3JjZSBleGNsdXNpdmUgYWNjZXNzIHRvIGtleXMuICBDb25jcmV0ZWx5LFxuICogLSBpZiBcIkxpbWl0VG9LZXlPd25lclwiIGlzIHNldCwgb25seSBrZXkgb3duZXJzIGFyZSBwZXJtaXR0ZWQgdG8gYWNjZXNzXG4gKiAgIHRoZWlyIGtleXMgZm9yIHNpZ25pbmc6IGEgdXNlciBzZXNzaW9uIChub3QgYSByb2xlIHNlc3Npb24pIGlzIHJlcXVpcmVkXG4gKiAgIGZvciBzaWduaW5nLCBhbmQgYWRkaW5nIGEga2V5IHRvIGEgcm9sZSBpcyBub3QgcGVybWl0dGVkLlxuICogLSBpZiBcIkxpbWl0VG9TaW5nbGVSb2xlXCIgaXMgc2V0LCBlYWNoIGtleSBpcyBwZXJtaXR0ZWQgdG8gYmUgaW4gYXQgbW9zdFxuICogICBvbmUgcm9sZSwgYW5kIHNpZ25pbmcgaXMgb25seSBhbGxvd2VkIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYSByb2xlIHNlc3Npb24gdG9rZW4uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXhjbHVzaXZlS2V5QWNjZXNzUG9saWN5IHtcbiAgRXhjbHVzaXZlS2V5QWNjZXNzOiBcIkxpbWl0VG9LZXlPd25lclwiIHwgXCJMaW1pdFRvU2luZ2xlUm9sZVwiO1xufVxuXG4vKipcbiAqIFRoZSBzZXQgb2YgcmVseWluZyBwYXJ0aWVzIHRvIGFsbG93IGZvciB3ZWJhdXRobiByZWdpc3RyYXRpb25cbiAqIFRoZXNlIGNvcnJlc3BvbmQgdG8gZG9tYWlucyBmcm9tIHdoaWNoIGJyb3dzZXJzIGNhbiBzdWNjZXNzZnVsbHkgY3JlYXRlIGNyZWRlbnRpYWxzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdlYkF1dGhuUmVseWluZ1BhcnRpZXNQb2xpY3kge1xuICBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzOiB7IGlkPzogc3RyaW5nOyBuYW1lOiBzdHJpbmcgfVtdO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGFuIGFsbG93bGlzdCBvZiBPSURDIElzc3VlcnMgYW5kIGF1ZGllbmNlcyB0aGF0IGFyZSBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSBpbnRvIHRoaXMgb3JnLlxuICpcbiAqIEBleGFtcGxlIHtcIk9pZGNBdXRoU291cmNlc1wiOiB7IFwiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tXCI6IFsgXCIxMjM0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXCIgXX19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY0F1dGhTb3VyY2VzUG9saWN5IHtcbiAgT2lkY0F1dGhTb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXSB8IElzc3VlckNvbmZpZz47XG59XG5cbi8qKiBPSURDIGlzc3VlciBjb25maWd1cmF0aW9uICovXG5leHBvcnQgaW50ZXJmYWNlIElzc3VlckNvbmZpZyB7XG4gIC8qKiBUaGUgc2V0IG9mIGF1ZGllbmNlcyBzdXBwb3J0ZWQgZm9yIHRoaXMgaXNzdWVyICovXG4gIGF1ZHM6IHN0cmluZ1tdO1xuXG4gIC8qKiBUaGUga2luZHMgb2YgdXNlciBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoaXMgaXNzdWVyICovXG4gIHVzZXJzOiBNZW1iZXJSb2xlW107XG5cbiAgLyoqIE9wdGlvbmFsIG5pY2tuYW1lIGZvciB0aGlzIHByb3ZpZGVyICovXG4gIG5pY2tuYW1lPzogc3RyaW5nO1xuXG4gIC8qKiBXaGV0aGVyIHRvIG1ha2UgdGhpcyBpc3N1ZXIgcHVibGljICovXG4gIHB1YmxpYz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogT25seSBhbGxvdyByZXF1ZXN0cyBmcm9tIHRoZSBzcGVjaWZpZWQgb3JpZ2lucy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJPcmlnaW5BbGxvd2xpc3RcIjogXCIqXCJ9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JpZ2luQWxsb3dsaXN0UG9saWN5IHtcbiAgT3JpZ2luQWxsb3dsaXN0OiBzdHJpbmdbXSB8IFwiKlwiO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHNpZ25pbmcgdG8gc3BlY2lmaWMgc291cmNlIElQIGFkZHJlc3Nlcy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJTb3VyY2VJcEFsbG93bGlzdFwiOiBbXCIxMC4xLjIuMy84XCIsIFwiMTY5LjI1NC4xNy4xLzE2XCJdfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5IHtcbiAgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSBudW1iZXIgb2YgdW5zdGFrZXMgcGVyIGRheS5cbiAqXG4gKiBAZXhhbXBsZSB7XCJNYXhEYWlseVVuc3Rha2VcIjogNSB9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWF4RGFpbHlVbnN0YWtlUG9saWN5IHtcbiAgTWF4RGFpbHlVbnN0YWtlOiBudW1iZXI7XG59XG5cbi8qKlxuICogRmlsdGVyIHRvIHVzZSB3aGVuIGxpc3Rpbmcga2V5c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleUZpbHRlciB7XG4gIC8qKiBGaWx0ZXIgYnkga2V5IHR5cGUgKi9cbiAgdHlwZT86IEtleVR5cGU7XG4gIC8qKiBGaWx0ZXIgYnkga2V5IG93bmVyICovXG4gIG93bmVyPzogc3RyaW5nO1xuICAvKiogU2VhcmNoIGJ5IGtleSdzIG1hdGVyaWFsIGlkIGFuZCBtZXRhZGF0YSAqL1xuICBzZWFyY2g/OiBzdHJpbmc7XG4gIC8qKiBQYWdpbmF0aW9uIG9wdGlvbnMgKi9cbiAgcGFnZT86IFBhZ2VPcHRzO1xufVxuXG4vKipcbiAqIEFuIG9yZ2FuaXphdGlvbi5cbiAqXG4gKiBFeHRlbmRzIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBhbmQgcHJvdmlkZXMgYSBmZXcgb3JnLXNwZWNpZmljIG1ldGhvZHMgb24gdG9wLlxuICovXG5leHBvcnQgY2xhc3MgT3JnIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAjb3JnSWQ6IE9yZ0lkO1xuICAvKiogVGhlIG9yZyBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YT86IE9yZ0luZm87XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBvcmcgaWRcbiAgICogQGV4YW1wbGUgT3JnI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgZ2V0IGlkKCk6IE9yZ0lkIHtcbiAgICByZXR1cm4gdGhpcy4jb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgb3JnLiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBPcmdJbmZvIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ1xuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG9yZ0lkOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IG9yZ0lkID09PSBhcGlDbGllbnQub3JnSWQgPyBhcGlDbGllbnQgOiBhcGlDbGllbnQud2l0aFRhcmdldE9yZyhvcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG9yZ2FuaXphdGlvbi4gVGhlIG5ldyBvcmcgaXMgYSBjaGlsZCBvZiB0aGVcbiAgICogY3VycmVudCBvcmcgYW5kIGluaGVyaXRzIGl0cyBrZXktZXhwb3J0IHBvbGljeS4gVGhlIG5ldyBvcmdcbiAgICogaXMgY3JlYXRlZCB3aXRoIG9uZSBvd25lciwgdGhlIGNhbGxlciBvZiB0aGlzIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWVPclJlcXVlc3QgVGhlIG5hbWUgb2YgdGhlIG5ldyBvcmcgb3IgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG5ldyBvcmcuXG4gICAqIEByZXR1cm5zIEluZm9ybWF0aW9uIGFib3V0IHRoZSBuZXdseSBjcmVhdGVkIG9yZy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZU9yZyhuYW1lT3JSZXF1ZXN0OiBzdHJpbmcgfCBDcmVhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgcmVxID0gdHlwZW9mIG5hbWVPclJlcXVlc3QgPT09IFwic3RyaW5nXCIgPyB7IG5hbWU6IG5hbWVPclJlcXVlc3QgfSA6IG5hbWVPclJlcXVlc3Q7XG4gICAgaWYgKCEvXlthLXpBLVowLTlfXXszLDMwfSQvLnRlc3QocmVxLm5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ0NyZWF0ZU9yZyhyZXEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IG9yZyBtZXRyaWNzLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0cmljTmFtZSBUaGUgbWV0cmljIG5hbWUuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIHN0YXJ0IGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLlxuICAgKiBAcGFyYW0gb3B0IE90aGVyIG9wdGlvbmFsIGFyZ3VtZW50c1xuICAgKiBAcGFyYW0gb3B0LmVuZF90aW1lIFRoZSBlbmQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guIElmIG9taXR0ZWQsIGRlZmF1bHRzIHRvICdub3cnLlxuICAgKiBAcGFyYW0gb3B0LnBlcmlvZCBUaGUgZ3JhbnVsYXJpdHksIGluIHNlY29uZHMsIG9mIHRoZSByZXR1cm5lZCBkYXRhIHBvaW50cy5cbiAgICogICBUaGlzIHZhbHVlIGlzIGF1dG9tYXRpY2FsbHkgcm91bmRlZCB1cCB0byBhIG11bHRpcGxlIG9mIDM2MDAgKGkuZS4sIDEgaG91cikuXG4gICAqICAgSWYgb21pdHRlZCwgZGVmYXVsdHMgdG8gdGhlIGR1cmF0aW9uIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCB0aGUgZW5kIGRhdGUuXG4gICAqICAgTXVzdCBiZSBubyBsZXNzIHRoYW4gMSBob3VyLCBpLmUuLCAzNjAwIHNlY29uZHMuIEFkZGl0aW9uYWxseSwgdGhpcyBwZXJpb2QgbXVzdCBub3RcbiAgICogICBkaXZpZGUgdGhlIGBlbmRUaW1lIC0gc3RhcnRUaW1lYCBwZXJpb2QgaW50byBtb3JlIHRoYW4gMTAwIGRhdGEgcG9pbnRzLlxuICAgKiBAcGFyYW0gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBNZXRyaWMgdmFsdWVzIChkYXRhIHBvaW50cykgZm9yIHRoZSByZXF1ZXN0ZWQgcGVyaW9kcy5cbiAgICovXG4gIGFzeW5jIHF1ZXJ5TWV0cmljcyhcbiAgICBtZXRyaWNOYW1lOiBPcmdNZXRyaWNOYW1lLFxuICAgIHN0YXJ0VGltZTogRXBvY2hUaW1lU3RhbXAsXG4gICAgb3B0PzogT21pdDxRdWVyeU1ldHJpY3NSZXF1ZXN0LCBcIm1ldHJpY19uYW1lXCIgfCBcInN0YXJ0X3RpbWVcIj4sXG4gICAgcGFnZU9wdHM/OiBQYWdlT3B0cyxcbiAgKTogUHJvbWlzZTxRdWVyeU1ldHJpY3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IHJlcTogUXVlcnlNZXRyaWNzUmVxdWVzdCA9IHtcbiAgICAgIG1ldHJpY19uYW1lOiBtZXRyaWNOYW1lLFxuICAgICAgLi4ub3B0LFxuICAgICAgc3RhcnRfdGltZTogc3RhcnRUaW1lLFxuICAgICAgLy8gTXVzdCBzZXQgZW5kX3RpbWUgYmVmb3JlIGZldGNoQWxsOiB3aXRob3V0IGl0IHRoZSBiYWNrZW5kIGRlZmF1bHRzIHRvIG5vdygpXG4gICAgICAvLyBvbiBlYWNoIHBhZ2UgcmVxdWVzdCwgYW5kIGEgY2hhbmdpbmcgd2luZG93IGludmFsaWRhdGVzIHRoZSBwYWdpbmF0aW9uIHRva2VuLlxuICAgICAgZW5kX3RpbWU6IG9wdD8uZW5kX3RpbWUgPz8gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1F1ZXJ5TWV0cmljcyhyZXEsIHBhZ2VPcHRzKS5mZXRjaEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IHRoZSBvcmcgYXVkaXQgbG9nLlxuICAgKlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBzdGFydCBkYXRlIGluIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAgICogQHBhcmFtIG9wdCBPdGhlciBvcHRpb25hbCBhcmd1bWVudHNcbiAgICogQHBhcmFtIG9wdC5lbmRfdGltZSBUaGUgZW5kIGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLiBEZWZhdWx0cyB0byAnbm93Jy5cbiAgICogQHBhcmFtIG9wdC5ldmVudHMgRmlsdGVyIGJ5IGV2ZW50IG5hbWUuIElmIG9taXR0ZWQsIGFsbCBldmVudHMgYXJlIGluY2x1ZGVkLlxuICAgKiBAcGFyYW0gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIE1hdGNoaW5nIGF1ZGl0IGxvZyBlbnRyaWVzLlxuICAgKi9cbiAgYXN5bmMgcXVlcnlBdWRpdExvZyhcbiAgICBzdGFydFRpbWU6IEVwb2NoVGltZVN0YW1wLFxuICAgIG9wdD86IE9taXQ8QXVkaXRMb2dSZXF1ZXN0LCBcInN0YXJ0X3RpbWVcIj4sXG4gICAgcGFnZU9wdHM/OiBQYWdlT3B0cyxcbiAgKTogUHJvbWlzZTxBdWRpdExvZ0VudHJ5W10+IHtcbiAgICBjb25zdCByZXE6IEF1ZGl0TG9nUmVxdWVzdCA9IHtcbiAgICAgIC4uLm9wdCxcbiAgICAgIHN0YXJ0X3RpbWU6IHN0YXJ0VGltZSxcbiAgICAgIC8vIE11c3Qgc2V0IGVuZF90aW1lIGJlZm9yZSBmZXRjaEFsbDogd2l0aG91dCBpdCB0aGUgYmFja2VuZCBkZWZhdWx0cyB0byBub3coKVxuICAgICAgLy8gb24gZWFjaCBwYWdlIHJlcXVlc3QsIGFuZCBhIGNoYW5naW5nIHdpbmRvdyBpbnZhbGlkYXRlcyB0aGUgcGFnaW5hdGlvbiB0b2tlbi5cbiAgICAgIGVuZF90aW1lOiBvcHQ/LmVuZF90aW1lID8/IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1F1ZXJ5QXVkaXRMb2cocmVxLCBwYWdlT3B0cykuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdHZXQoKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBvcmcgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgZW5hYmxlKG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIGRpc2FibGUob3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgcG9saWN5IGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxPcmdQb2xpY3lbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgc2lnbiBwb2xpY3kgZm9yIHRoZSBvcmcuICovXG4gIGFzeW5jIHNpZ25Qb2xpY3koKTogUHJvbWlzZTxSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEuc2lnbl9wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgUm9sZVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogT3JnUG9saWN5W10sIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgY29uc3QgcCA9IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcCB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGVkaXQgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgbmV3IGVkaXQgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRFZGl0UG9saWN5KGVkaXRQb2xpY3k6IEVkaXRQb2xpY3ksIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgZWRpdF9wb2xpY3k6IGVkaXRQb2xpY3kgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBzaWduIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogVGhpcyBpcyBhIGdsb2JhbCBzaWduIHBvbGljeSB0aGF0IGFwcGxpZXMgdG8gZXZlcnkgc2lnbiBvcGVyYXRpb24gKGV2ZXJ5IGtleSwgZXZlcnkgcm9sZSkgaW4gdGhlIG9yZy5cbiAgICogSXQgaXMgYW5hbG9nb3VzIHRvIGhvdyByb2xlIHBvbGljaWVzIGFwcGx5IHRvIGFsbCBzaWduIHJlcXVlc3RzIHBlcmZvcm1lZCBieSB0aGUgY29ycmVzcG9uZGluZyByb2xlIHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBuZXcgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRTaWduUG9saWN5KHBvbGljeTogUm9sZVBvbGljeSwgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBzaWduX3BvbGljeTogcG9saWN5IH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBvcmdhbml6YXRpb24ncyBleHRlbmRlZCBwcm9wZXJ0aWVzICh1bmNvbW1vbiBmZWF0dXJlcyBub3QgdXNlZCBieSBtb3N0IHVzZXJzKS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGV4dGVuZGVkIHByb3BlcnRpZXNcbiAgICovXG4gIGFzeW5jIGdldEV4dGVuZGVkUHJvcGVydGllcygpOiBQcm9taXNlPE9yZ0V4dERhdGEgfCBudWxsPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5leHRfZGF0YSA/IGRhdGEuZXh0X2RhdGEgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgb3JnYW5pemF0aW9uJ3MgZXh0ZW5kZWQgcHJvcGVydGllcyAodW5jb21tb24gZmVhdHVyZXMgbm90IHVzZWQgYnkgbW9zdCB1c2VycykuXG4gICAqXG4gICAqIEBwYXJhbSBwcm9wcyBUaGUgbmV3IHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldEV4dGVuZGVkUHJvcGVydGllcyhwcm9wczogT3JnRXh0UHJvcHMsIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgZXh0X3Byb3BzOiBwcm9wcyB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBlci1hbGllbiBrZXkgY291bnQgdGhyZXNob2xkLCB3aGljaCwgb25jZSBleGNlZWRlZCwgZGlzYWxsb3dzIGZ1cnRoZXIga2V5IGNyZWF0aW9uIGJ5IGFsaWVuIHVzZXJzLlxuICAgKlxuICAgKiBUaGlzIHNldHRpbmcgaXMgY2hlY2tlZCBvbmx5IHdoZW4gYW4gYWxpZW4gdXNlciByZXF1ZXN0cyB0byBjcmVhdGUgb3IgaW1wb3J0IGEgbmV3IGtleS5cbiAgICogSW4gb3RoZXIgd29yZHMsIG9yZyBhZG1pbnMgY2FuIHN0aWxsIGFzc2lnbiB1bmxpbWl0ZWQgbnVtYmVyIG9mIGtleXMgdG8gdGhlaXIgYWxpZW4gdXNlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBhbGllbktleUNvdW50VGhyZXNob2xkIFRoZSBuZXcga2V5IGNvdW50IHRocmVzaG9sZC5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0QWxpZW5LZXlDb3VudFRocmVzaG9sZChcbiAgICBhbGllbktleUNvdW50VGhyZXNob2xkOiBudW1iZXIsXG4gICAgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0sXG4gICkge1xuICAgIGNvbnN0IGRhdGEgPSB7IC4uLigoYXdhaXQgdGhpcy5nZXRFeHRlbmRlZFByb3BlcnRpZXMoKSkgPz8ge30pIH07XG5cbiAgICAvLyBlcmFzZSB0aGUgbWV0YWRhdGEgdGhhdCBjYW5ub3QgYmUgdXBkYXRlZFxuICAgIGRhdGEuY3JlYXRlZCA9IHVuZGVmaW5lZDtcbiAgICBkYXRhLmxhc3RfbW9kaWZpZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyB1cGRhdGUgJ2FsaWVuX2tleV9jb3VudF90aHJlc2hvbGQnIGFuZCBrZWVwIGV2ZXJ5dGhpbmcgZWxzZSB0aGUgc2FtZVxuICAgIGRhdGEuYWxpZW5fa2V5X2NvdW50X3RocmVzaG9sZCA9IGFsaWVuS2V5Q291bnRUaHJlc2hvbGQ7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBleHRfcHJvcHM6IGRhdGEgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBub3RpZmljYXRpb24gZW5kcG9pbnRzIGZvciB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gbm90aWZpY2F0aW9uX2VuZHBvaW50cyBFbmRwb2ludHMuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldE5vdGlmaWNhdGlvbkVuZHBvaW50cyhcbiAgICBub3RpZmljYXRpb25fZW5kcG9pbnRzOiBOb3RpZmljYXRpb25FbmRwb2ludENvbmZpZ3VyYXRpb25bXSxcbiAgICBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSxcbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgbm90aWZpY2F0aW9uX2VuZHBvaW50cyB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgcmVxdWlyZWQgTUZBIHR5cGVzIGZvciBhY3Rpb25zIGltcGxpY2l0bHkgcmVxdWlyaW5nIE1GQSAoc2VlIHtAbGluayBNZmFQcm90ZWN0ZWRBY3Rpb259KS5cbiAgICpcbiAgICogQHBhcmFtIGFsbG93ZWRfbWZhX3R5cGVzIEFzc2lnbm1lbnQgb2YgTUZBIHR5cGVzIHRvIGFjdGlvbnMgdGhhdCBpbXBsaWNpdGx5IHJlcXVpcmUgTUZBLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRBbGxvd2VkTWZhVHlwZXMoXG4gICAgYWxsb3dlZF9tZmFfdHlwZXM6IFBhcnRpYWw8UmVjb3JkPE1mYVByb3RlY3RlZEFjdGlvbiwgTWZhVHlwZVtdPj4sXG4gICAgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0sXG4gICkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IGFsbG93ZWRfbWZhX3R5cGVzIH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduaW5nIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXkuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyB0byBzZXQgb24gdGhlIG5ldyBrZXkuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleSh0eXBlOiBLZXlUeXBlLCBvd25lcklkPzogc3RyaW5nLCBwcm9wcz86IENyZWF0ZUtleVByb3BlcnRpZXMpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0NyZWF0ZSh0eXBlLCAxLCBvd25lcklkLCBwcm9wcyk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlzWzBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIHNldCBvbiB0aGUgbmV3IGtleXMuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleXMoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICAgcHJvcHM/OiBDcmVhdGVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzQ3JlYXRlKHR5cGUsIGNvdW50LCBvd25lcklkLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyAoZmlyc3QtcGFydHkpIHVzZXIgaW4gdGhlIG9yZ2FuaXphdGlvbiBhbmQgc2VuZHMgYW4gaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VySW52aXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgaW52aXRlcyBhIHVzZXJcbiAgICovXG4gIGdldCBjcmVhdGVVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckludml0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyRGVsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhIHVzZXJcbiAgICovXG4gIGdldCBkZWxldGVVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckRlbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IE9JREMgdXNlci4gVGhpcyBjYW4gYmUgYSBmaXJzdC1wYXJ0eSBcIk1lbWJlclwiIG9yIHRoaXJkLXBhcnR5IFwiQWxpZW5cIi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJDcmVhdGVPaWRjfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBhbiBPSURDIHVzZXIsIHJlc29sdmluZyB0byB0aGUgbmV3IHVzZXIncyBJRFxuICAgKi9cbiAgZ2V0IGNyZWF0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckNyZWF0ZU9pZGMuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyBPSURDIHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyRGVsZXRlT2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYW4gT0lEQyB1c2VyXG4gICAqL1xuICBnZXQgZGVsZXRlT2lkY1VzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyRGVsZXRlT2lkYy5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHNlYXJjaFF1ZXJ5IE9wdGlvbmFsIHF1ZXJ5IHN0cmluZy4gSWYgZGVmaW5lZCwgYWxsIHJldHVybmVkIHVzZXJzIHdpbGwgY29udGFpbiB0aGlzIHN0cmluZyBpbiB0aGVpciBuYW1lIG9yIGVtYWlsLlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiB1c2Vyc1xuICAgKi9cbiAgYXN5bmMgdXNlcnMoc2VhcmNoUXVlcnk/OiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm9bXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXNlcnNMaXN0KHVuZGVmaW5lZCwgc2VhcmNoUXVlcnkpLmZldGNoQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnYW5pemF0aW9uIChwYWdpbmF0ZWQpLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlcnNMaXN0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHBhZ2luYXRlZCBsaXN0IG9mIHVzZXJzXG4gICAqL1xuICBnZXQgdXNlcnNQYWdpbmF0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2Vyc0xpc3QuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IGlkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckdldH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgdXNlcidzIGluZm9cbiAgICovXG4gIGdldCBnZXRVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckdldC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgZW1haWwuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0QnlFbWFpbH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgdXNlcidzIGluZm9cbiAgICovXG4gIGdldCBnZXRVc2VyQnlFbWFpbCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJHZXRCeUVtYWlsLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlciBieSBPSURDIElELlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckdldEJ5T2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgdXNlcidzIGluZm9cbiAgICovXG4gIGdldCBnZXRVc2VyQnlPaWRjKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckdldEJ5T2lkYy5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIGEgdXNlciBpbiB0aGlzIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyIHdob3NlIG1lbWJlcnNoaXAgdG8gZW5hYmxlXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHVzZXIncyBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyBlbmFibGVVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCh1c2VySWQsIHsgZGlzYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgYSB1c2VyIGluIHRoaXMgb3JnXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byBkaXNhYmxlXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHVzZXIncyBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyBkaXNhYmxlVXNlcih1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlVXNlck1lbWJlcnNoaXAodXNlcklkLCB7IGRpc2FibGVkOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYWNjZXNzaWJsZSBrZXlzIGluIHRoZSBvcmdhbml6YXRpb25cbiAgICpcbiAgICogQHBhcmFtIHByb3BzIE9wdGlvbmFsIGZpbHRlcmluZyBwcm9wZXJ0aWVzLlxuICAgKiBAcmV0dXJucyBUaGUga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXMocHJvcHM/OiBLZXlGaWx0ZXIpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3QgcGFnaW5hdG9yID0gdGhpcy4jYXBpQ2xpZW50LmtleXNMaXN0KFxuICAgICAgcHJvcHM/LnR5cGUsXG4gICAgICBwcm9wcz8ucGFnZSxcbiAgICAgIHByb3BzPy5vd25lcixcbiAgICAgIHByb3BzPy5zZWFyY2gsXG4gICAgKTtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgcGFnaW5hdG9yLmZldGNoKCk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybnMgVGhlIG5ldyByb2xlLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlUm9sZShuYW1lPzogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3Qgcm9sZUlkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVDcmVhdGUobmFtZSk7XG4gICAgY29uc3Qgcm9sZUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldChyb2xlSWQpO1xuICAgIHJldHVybiBuZXcgUm9sZSh0aGlzLiNhcGlDbGllbnQsIHJvbGVJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByb2xlIGJ5IGlkIG9yIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIGlkIG9yIG5hbWUgb2YgdGhlIHJvbGUgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIGdldFJvbGUocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSByb2xlcyBpbiB0aGUgb3JnXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFRoZSBwYWdpbmF0b3Igb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgcm9sZXNcbiAgICovXG4gIGFzeW5jIHJvbGVzKHBhZ2U6IFBhZ2VPcHRzKTogUHJvbWlzZTxSb2xlW10+IHtcbiAgICBjb25zdCByb2xlcyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlc0xpc3QocGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gcm9sZXMubWFwKChyKSA9PiBuZXcgUm9sZSh0aGlzLiNhcGlDbGllbnQsIHIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gcnVsZXMgVGhlIHBvbGljeSBydWxlcy5cbiAgICogQHBhcmFtIGFjbCBPcHRpb25hbCBsaXN0IG9mIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVBvbGljeTxUeXBlIGV4dGVuZHMgXCJLZXlcIiB8IFwiUm9sZVwiPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogVHlwZSxcbiAgICBydWxlczogVHlwZSBleHRlbmRzIFwiS2V5XCIgPyBLZXlQb2xpY3kgOiBSb2xlUG9saWN5LFxuICAgIGFjbD86IFBvbGljeUFjbCxcbiAgKTogUHJvbWlzZTxUeXBlIGV4dGVuZHMgXCJLZXlcIiA/IE5hbWVkS2V5UG9saWN5IDogTmFtZWRSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgcG9saWN5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lDcmVhdGUobmFtZSwgdHlwZSwgcnVsZXMsIGFjbCk7XG4gICAgY29uc3QgcG9saWN5ID0gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvKTtcbiAgICByZXR1cm4gcG9saWN5IGFzIFR5cGUgZXh0ZW5kcyBcIktleVwiID8gTmFtZWRLZXlQb2xpY3kgOiBOYW1lZFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbmFtZWQgcG9saWN5IGJ5IGlkIG9yIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3lJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcG9saWN5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGdldFBvbGljeShwb2xpY3lJZDogc3RyaW5nKTogUHJvbWlzZTxOYW1lZFBvbGljeT4ge1xuICAgIGNvbnN0IHBvbGljeUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5R2V0KHBvbGljeUlkLCBcImxhdGVzdFwiKTtcbiAgICByZXR1cm4gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24gYnkgbmFtZSBvciBuYW1lZCBwb2xpY3kgSUQuXG4gICAqXG4gICAqIEBwYXJhbSBmdW5jdGlvbklkIFRoZSBuYW1lIG9yIG5hbWVkIHBvbGljeSBJRCBvZiB0aGUgZnVuY3Rpb24gdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgQzJGIGZ1bmN0aW9uLlxuICAgKiBAdGhyb3dzIGlmIG5hbWUgb3IgSUQgaXMgbm90IGFzc29jaWF0ZWQgdG8gYSBDMkYgZnVuY3Rpb24gKGkuZS4gdGhlIG5hbWUvaWQgaXMgZm9yIGEga2V5IG9yIHJvbGUgbmFtZWQgcG9saWN5KVxuICAgKi9cbiAgYXN5bmMgZ2V0RnVuY3Rpb24oZnVuY3Rpb25JZDogc3RyaW5nKTogUHJvbWlzZTxDMkZGdW5jdGlvbj4ge1xuICAgIGNvbnN0IGZ1bmN0aW9uSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lHZXQoZnVuY3Rpb25JZCwgXCJsYXRlc3RcIik7XG4gICAgaWYgKGZ1bmN0aW9uSW5mby5wb2xpY3lfdHlwZSAhPT0gXCJXYXNtXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYCR7ZnVuY3Rpb25JZH0gaXMgbm90IGEgV2FzbSBmdW5jdGlvbiwgaXQgaXMgYSAke2Z1bmN0aW9uSW5mby5wb2xpY3lfdHlwZX0gbmFtZWQgcG9saWN5YCxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQzJGRnVuY3Rpb24odGhpcy4jYXBpQ2xpZW50LCBmdW5jdGlvbkluZm8gYXMgQzJGSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdGhlIG5hbWVkIHBvbGljaWVzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcGFyYW0gcG9saWN5VHlwZSBUaGUgb3B0aW9uYWwgdHlwZSBvZiBwb2xpY2llcyB0byBmZXRjaC4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgYWxsIG5hbWVkIHBvbGljaWVzIHJlZ2FyZGxlc3Mgb2YgdHlwZS5cbiAgICogQHJldHVybnMgVGhlIHBvbGljaWVzLlxuICAgKi9cbiAgYXN5bmMgcG9saWNpZXMocGFnZT86IFBhZ2VPcHRzLCBwb2xpY3lUeXBlPzogUG9saWN5VHlwZSk6IFByb21pc2U8TmFtZWRQb2xpY3lbXT4ge1xuICAgIGNvbnN0IHBvbGljaWVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljaWVzTGlzdChwYWdlLCBwb2xpY3lUeXBlKS5mZXRjaCgpO1xuICAgIHJldHVybiBwb2xpY2llcy5tYXAoKHApID0+IE5hbWVkUG9saWN5LmZyb21JbmZvKHRoaXMuI2FwaUNsaWVudCwgcCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSBDMkYgZnVuY3Rpb25zIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFRoZSBwYWdpbmF0b3Igb3B0aW9ucy5cbiAgICogQHJldHVybnMgVGhlIEMyRiBmdW5jdGlvbnMuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbnMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxDMkZGdW5jdGlvbltdPiB7XG4gICAgY29uc3QgcG9saWNpZXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWNpZXNMaXN0KHBhZ2UsIFwiV2FzbVwiKS5mZXRjaCgpO1xuICAgIHJldHVybiBwb2xpY2llcy5tYXAoKGRhdGEpID0+IG5ldyBDMkZGdW5jdGlvbih0aGlzLiNhcGlDbGllbnQsIGRhdGEgYXMgQzJGSW5mbykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgV2FzbSBmdW5jdGlvbi5cbiAgICogQHBhcmFtIGFjbCBPcHRpb25hbCBsaXN0IG9mIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzLlxuICAgKiBAcmV0dXJucyBUaGUgQzJGIGZ1bmN0aW9uXG4gICAqL1xuICBhc3luYyBjcmVhdGVXYXNtRnVuY3Rpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBvbGljeTogVWludDhBcnJheSxcbiAgICBhY2w/OiBQb2xpY3lBY2wsXG4gICk6IFByb21pc2U8QzJGRnVuY3Rpb24+IHtcbiAgICBjb25zdCBoYXNoID0gYXdhaXQgdXBsb2FkV2FzbUZ1bmN0aW9uKHRoaXMuI2FwaUNsaWVudCwgcG9saWN5KTtcbiAgICBjb25zdCBwb2xpY3lJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUNyZWF0ZShcbiAgICAgIG5hbWUsXG4gICAgICBcIldhc21cIixcbiAgICAgIFtcbiAgICAgICAge1xuICAgICAgICAgIGhhc2gsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgYWNsLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBDMkZGdW5jdGlvbih0aGlzLiNhcGlDbGllbnQsIHBvbGljeUluZm8gYXMgQzJGSW5mbyk7XG4gIH1cblxuICAvKiogQHJldHVybnMgdGhlIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbnMgY29uZmlndXJhdGlvbiBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgYzJmQ29uZmlndXJhdGlvbigpOiBQcm9taXNlPEMyRkNvbmZpZ3VyYXRpb24gfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLnBvbGljeV9lbmdpbmVfY29uZmlndXJhdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbnMgY29uZmlndXJhdGlvbiBmb3IgdGhlIG9yZy5cbiAgICogTm90ZSB0aGF0IHRoaXMgb3ZlcndyaXRlcyBhbnkgZXhpc3RpbmcgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNvbmZpZ3MgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9ucyBjb25maWd1cmF0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRDMkZDb25maWd1cmF0aW9uKGNvbmZpZ3M6IEMyRkNvbmZpZ3VyYXRpb24sIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKFxuICAgICAge1xuICAgICAgICBwb2xpY3lfZW5naW5lX2NvbmZpZ3VyYXRpb246IGNvbmZpZ3MsXG4gICAgICB9LFxuICAgICAgb3B0cz8ubWZhUmVjZWlwdCxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIGtleSBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRoIGFuZCBtbmVtb25pYy5cbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRoIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aCB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgbmV3bHkgZGVyaXZlZCBrZXkgb3IgdW5kZWZpbmVkIGlmIGl0IGFscmVhZHkgZXhpc3RzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5KFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGg6IHN0cmluZyxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleSB8IHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5kZXJpdmVLZXlzKHR5cGUsIFtkZXJpdmF0aW9uUGF0aF0sIG1uZW1vbmljSWQsIHByb3BzKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aHMgYW5kIG1uZW1vbmljLlxuICAgKlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5cyB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRocyBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGhzIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzRGVyaXZlKHR5cGUsIGRlcml2YXRpb25QYXRocywgbW5lbW9uaWNJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgZWl0aGVyIGEgbmV3IG9yIGV4aXN0aW5nIG1uZW1vbmljIHRvIGRlcml2ZSBrZXlzIG9mIG9uZSBvciBtb3JlXG4gICAqIHNwZWNpZmllZCB0eXBlcyB2aWEgc3BlY2lmaWVkIGRlcml2YXRpb24gcGF0aHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyBBIGxpc3Qgb2YgYEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aGAgb2JqZWN0cyBzcGVjaWZ5aW5nIHRoZSBrZXlzIHRvIGJlIGRlcml2ZWRcbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMoXG4gICAga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHM6IEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aFtdLFxuICAgIHByb3BzPzogRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNEZXJpdmVNdWx0aShrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocywgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXQoa2V5SWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyBtYXRlcmlhbCBpZCAoZS5nLiwgYWRkcmVzcykuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSBrZXkgdHlwZS5cbiAgICogQHBhcmFtIG1hdGVyaWFsSWQgVGhlIG1hdGVyaWFsIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5QnlNYXRlcmlhbElkKGtleVR5cGU6IEtleVR5cGUsIG1hdGVyaWFsSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXRCeU1hdGVyaWFsSWQoa2V5VHlwZSwgbWF0ZXJpYWxJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBjb250YWN0LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBmb3IgdGhlIG5ldyBjb250YWN0LlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKiBAcGFyYW0gbWV0YWRhdGEgTWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LiBJbnRlbmRlZCBmb3IgdXNlIGFzIGEgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QsIGRldGVybWluaW5nIHdoZW4gYW5kIHdobyBjYW4gZWRpdCB0aGlzIGNvbnRhY3QuXG4gICAqIEBwYXJhbSBsYWJlbHMgVGhlIG9wdGlvbmFsIGxhYmVscyBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseS1jcmVhdGVkIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDb250YWN0KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhZGRyZXNzZXM/OiBBZGRyZXNzTWFwLFxuICAgIG1ldGFkYXRhPzogSnNvblZhbHVlLFxuICAgIGVkaXRQb2xpY3k/OiBFZGl0UG9saWN5LFxuICAgIGxhYmVscz86IENvbnRhY3RMYWJlbFtdLFxuICApOiBQcm9taXNlPENvbnRhY3Q+IHtcbiAgICBjb25zdCBjb250YWN0SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0Q3JlYXRlKFxuICAgICAgbmFtZSxcbiAgICAgIGFkZHJlc3NlcyxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgZWRpdFBvbGljeSxcbiAgICAgIGxhYmVscyxcbiAgICApO1xuXG4gICAgcmV0dXJuIG5ldyBDb250YWN0KHRoaXMuI2FwaUNsaWVudCwgY29udGFjdEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGNvbnRhY3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0gY29udGFjdElkIFRoZSBpZCBvZiB0aGUgY29udGFjdCB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBjb250YWN0LlxuICAgKi9cbiAgYXN5bmMgZ2V0Q29udGFjdChjb250YWN0SWQ6IHN0cmluZyk6IFByb21pc2U8Q29udGFjdD4ge1xuICAgIGNvbnN0IGNvbnRhY3RJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RHZXQoY29udGFjdElkKTtcblxuICAgIHJldHVybiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGNvbnRhY3RJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGNvbnRhY3RzIGluIHRoZSBvcmdhbml6YXRpb24sIG9wdGlvbmFsbHkgbWF0Y2hpbmcgdGhlIHNlYXJjaCBxdWVyeS5cbiAgICpcbiAgICogQHBhcmFtIHNlYXJjaCBUaGUgb3B0aW9uYWwgc2VhcmNoIHF1ZXJ5LiBFaXRoZXI6XG4gICAqICAtIGBsYWJlbDouLi5gLCB3aGljaCB3aWxsIHJldHVybiBjb250YWN0cyB3aXRoIHRoZSBsYWJlbCBwcm92aWRlZCBhZnRlciB0aGUgJzonLFxuICAgKiAgLSBhbiBleGFjdCBhZGRyZXNzIHNlYXJjaCwgd2hpY2ggcmV0dXJucyBjb250YWN0cyB3aXRoIHRoZSBwcm92aWRlZCBDb250YWN0QWRkcmVzc0RhdGEsXG4gICAqICAtIG9yIGFuIGFkZHJlc3MgcHJlZml4IHNlYXJjaCwgd2hlcmUgYWxsIHJldHVybmVkIGNvbnRhY3RzIHdpbGwgaGF2ZSBhbiBhZGRyZXNzIHN0YXJ0aW5nIHdpdGgsIG9yIGVxdWFsaW5nLCB0aGUgZ2l2ZW4gc2VhcmNoIHN0cmluZy5cbiAgICogQHJldHVybnMgQWxsIGNvbnRhY3RzLlxuICAgKi9cbiAgYXN5bmMgY29udGFjdHMoXG4gICAgc2VhcmNoPzogYGxhYmVsJHtDb250YWN0TGFiZWx9YCB8IENvbnRhY3RBZGRyZXNzRGF0YSB8IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDb250YWN0W10+IHtcbiAgICBsZXQgY29udGFjdHM7XG5cbiAgICBpZiAoc2VhcmNoICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHNlYXJjaCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgY29udGFjdHMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuY29udGFjdExvb2t1cEJ5QWRkcmVzcyhzZWFyY2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLiNhcGlDbGllbnQuY29udGFjdHNMaXN0KHVuZGVmaW5lZCwgc2VhcmNoKTtcbiAgICAgIGNvbnRhY3RzID0gYXdhaXQgcGFnaW5hdG9yLmZldGNoKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRhY3RzLm1hcCgoYykgPT4gbmV3IENvbnRhY3QodGhpcy4jYXBpQ2xpZW50LCBjKSk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pZGVudGl0eVByb3ZlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYW4gaWRlbnRpdHkgcHJvb2ZcbiAgICovXG4gIGdldCBwcm92ZUlkZW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaWRlbnRpdHlQcm92ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBnaXZlbiBwcm9vZiBvZiBPSURDIGF1dGhlbnRpY2F0aW9uIGlzIHZhbGlkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaWRlbnRpdHlWZXJpZnl9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCB2ZXJpZmllcyBhIHByb29mIG9mIGlkZW50aXR5LCB0aHJvd2luZyBpZiBpbnZhbGlkXG4gICAqL1xuICBnZXQgdmVyaWZ5SWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5pZGVudGl0eVZlcmlmeS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCBieSBpdHMgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGdldE1mYVJlcXVlc3QobWZhSWQ6IE1mYUlkKTogTWZhUmVxdWVzdCB7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgbWZhSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlcXVlc3RzLlxuICAgKi9cbiAgYXN5bmMgbWZhUmVxdWVzdHMoKTogUHJvbWlzZTxNZmFSZXF1ZXN0W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50XG4gICAgICAubWZhTGlzdCgpXG4gICAgICAudGhlbigobWZhSW5mb3MpID0+IG1mYUluZm9zLm1hcCgobWZhSW5mbykgPT4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBtZmFJbmZvKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gZGVwb3NpdCAob3Igc3Rha2luZykgbWVzc2FnZS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNpZ25TdGFrZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgc3Rha2UgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgc3Rha2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zaWduU3Rha2UuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKS4gVGhlIGxpZmV0aW1lIG9mXG4gICAqIHRoZSBuZXcgc2Vzc2lvbiBpcyBzaWxlbnRseSB0cnVuY2F0ZWQgdG8gdGhhdCBvZiB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIG5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgZ2V0IGNyZWF0ZVNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZykgd2hvc2UgbGlmZXRpbWUgcG90ZW50aWFsbHlcbiAgICogZXh0ZW5kcyB0aGUgbGlmZXRpbWUgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbi4gIE1GQSBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRXh0ZW5kZWR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBuZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGdldCBjcmVhdGVFeHRlbmRlZFNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRXh0ZW5kZWQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSBhIHNlc3Npb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uUmV2b2tlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXZva2VzIGEgc2Vzc2lvblxuICAgKi9cbiAgZ2V0IHJldm9rZVNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uUmV2b2tlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgaGVhcnRiZWF0IC8gdXBjaGVjayByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaGVhcnRiZWF0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBzZW5kcyBhIGhlYXJ0YmVhdFxuICAgKi9cbiAgZ2V0IGhlYXJ0YmVhdCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmhlYXJ0YmVhdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0cy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRMaXN0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHBhZ2luYXRvciBvZiB1c2VyLWV4cG9ydCByZXF1ZXN0c1xuICAgKi9cbiAgZ2V0IGV4cG9ydHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0TGlzdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0RGVsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGEgdXNlci1leHBvcnQgcmVxdWVzdFxuICAgKi9cbiAgZ2V0IGRlbGV0ZUV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnREZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRJbml0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgcmVxdWVzdCByZXNwb25zZS5cbiAgICovXG4gIGdldCBpbml0RXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydEluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRDb21wbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHJlcXVlc3QgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgY29tcGxldGVFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0Q29tcGxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgb3JnLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXBkYXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCB1cGRhdGVzIGFuIG9yZyBhbmQgcmV0dXJucyB1cGRhdGVkIG9yZyBpbmZvcm1hdGlvblxuICAgKi9cbiAgZ2V0IHVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCBhIGZyZXNoIGtleS1pbXBvcnQga2V5LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuY3JlYXRlS2V5SW1wb3J0S2V5fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIGZyZXNoIGtleS1pbXBvcnQga2V5XG4gICAqL1xuICBnZXQgY3JlYXRlS2V5SW1wb3J0S2V5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuY3JlYXRlS2V5SW1wb3J0S2V5LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgb25lIG9yIG1vcmUga2V5cy4gVG8gdXNlIHRoaXMgZnVuY3Rpb25hbGl0eSwgeW91IG11c3QgZmlyc3QgY3JlYXRlIGFuXG4gICAqIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QgdXNpbmcgdGhlIGBAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNkay1rZXktaW1wb3J0YFxuICAgKiBsaWJyYXJ5LiBTZWUgdGhhdCBsaWJyYXJ5J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBBbiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgaW1wb3J0ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGltcG9ydEtleXMoYm9keTogSW1wb3J0S2V5UmVxdWVzdCk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmltcG9ydEtleXMoYm9keSk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHkgYWxpYXNlcyBmb3IgTmFtZWQgV2FzbSBQb2xpY3lcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IFdhc20gcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBXYXNtIHBvbGljeSBvYmplY3QuXG4gICAqIEBwYXJhbSBhY2wgT3B0aW9uYWwgbGlzdCBvZiBwb2xpY3kgYWNjZXNzIGNvbnRyb2wgZW50cmllcy5cbiAgICogQHJldHVybnMgVGhlIG5ldyBwb2xpY3kuXG4gICAqL1xuICBjcmVhdGVXYXNtUG9saWN5ID0gdGhpcy5jcmVhdGVXYXNtRnVuY3Rpb247XG5cbiAgLyoqIEByZXR1cm5zIHRoZSBQb2xpY3kgRW5naW5lIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBvcmcuICovXG4gIHBvbGljeUVuZ2luZUNvbmZpZ3VyYXRpb24gPSB0aGlzLmMyZkNvbmZpZ3VyYXRpb247XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgUG9saWN5IEVuZ2luZSBjb25maWd1cmF0aW9uIGZvciB0aGUgb3JnLlxuICAgKiBOb3RlIHRoYXQgdGhpcyBvdmVyd3JpdGVzIGFueSBleGlzdGluZyBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gY29uZmlncyBUaGUgUG9saWN5IEVuZ2luZSBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgc2V0UG9saWN5RW5naW5lQ29uZmlndXJhdGlvbiA9IHRoaXMuc2V0QzJGQ29uZmlndXJhdGlvbjtcbn1cbiJdfQ==