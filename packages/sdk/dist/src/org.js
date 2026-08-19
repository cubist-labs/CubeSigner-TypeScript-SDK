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
var _Org_instances, _Org_apiClient, _Org_orgId, _Org_data, _Org_updateExtProps;
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
        _Org_instances.add(this);
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
        return await __classPrivateFieldGet(this, _Org_instances, "m", _Org_updateExtProps).call(this, (data) => {
            data.alien_key_count_threshold = alienKeyCountThreshold;
        }, opts);
    }
    /**
     * Update whether the alien users should be allowed to update their own key policies.
     *
     * @param aliensCanUpdateKeyPolicy Whether alien users should be allowed to update their own key policies.
     * @param opts Optional parameters
     * @param opts.mfaReceipt Optional MFA receipts
     * @returns Org info
     */
    async setAliensCanUpdateKeyPolicy(aliensCanUpdateKeyPolicy, opts) {
        return await __classPrivateFieldGet(this, _Org_instances, "m", _Org_updateExtProps).call(this, (data) => {
            data.aliens_can_update_key_policy = aliensCanUpdateKeyPolicy;
        }, opts);
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
     * List all pending invitations in the organization, i.e., those that have
     * neither been accepted nor canceled, and have not expired.
     *
     * @param opts Pagination and filtering options. Defaults to fetching the entire result set.
     * @returns The list of pending invitations
     */
    async invitations(opts) {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgInvitationsList(opts).fetchAll();
    }
    /**
     * List pending invitations in the organization (paginated).
     *
     * Same as {@link ApiClient.orgInvitationsList}, see its documentation for more information.
     *
     * @returns A function that returns a paginated list of pending invitations
     */
    get invitationsPaginated() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgInvitationsList.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * Cancel a pending invitation.
     *
     * Same as {@link ApiClient.orgInvitationCancel}, see its documentation for more information.
     *
     * @returns A function that cancels a pending invitation
     */
    get cancelInvitation() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").orgInvitationCancel.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
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
     * Initiate an MFA reset for a user in the org. The reset is completed by
     * the user via {@link CubeSignerClient.resetUserMfaComplete}.
     *
     * Same as {@link ApiClient.resetUserMfaInit}, see its documentation for more information.
     *
     * @returns A function that initiates an MFA reset for a user
     */
    get resetUserMfaInit() {
        return __classPrivateFieldGet(this, _Org_apiClient, "f").resetUserMfaInit.bind(__classPrivateFieldGet(this, _Org_apiClient, "f"));
    }
    /**
     * List all users in the organization.
     *
     * @param optsOrSearchQuery Either additional options for filtering the users, or (deprecated) a search query string.
     * @returns The list of users
     */
    async users(optsOrSearchQuery) {
        const opts = typeof optsOrSearchQuery === "string"
            ? { searchQuery: optsOrSearchQuery }
            : (optsOrSearchQuery ?? {});
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgUsersList(opts).fetchAll();
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
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns The MFA requests.
     */
    async mfaRequests(page) {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f")
            .mfaList(page)
            .fetch()
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
_Org_apiClient = new WeakMap(), _Org_orgId = new WeakMap(), _Org_data = new WeakMap(), _Org_instances = new WeakSet(), _Org_updateExtProps = 
/**
 * Update select extended properties.
 *
 * @param update The update function
 * @param opts Optional parameters
 * @param opts.mfaReceipt Optional MFA receipts
 * @returns Org info
 */
async function _Org_updateExtProps(update, opts) {
    const data = { ...((await this.getExtendedProperties()) ?? {}) };
    // erase the metadata that cannot be updated
    data.created = undefined;
    data.last_modified = undefined;
    // execute client-supplied update function
    update(data);
    return await this.update({ ext_props: data }, opts?.mfaReceipt);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFxQ0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ2hFLE9BQU8sRUFFTCxXQUFXLEVBRVgsa0JBQWtCLEdBRW5CLE1BQU0sYUFBYSxDQUFDO0FBdUlyQjs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLEdBQUc7SUFNZDs7O09BR0c7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksa0JBQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLGlCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLEtBQWE7O1FBM0J0QyxpQ0FBc0I7UUFDL0IsNkJBQWM7UUFDZCwwQkFBMEI7UUFDMUIsNEJBQWdCO1FBaWdDaEIsd0RBQXdEO1FBRXhEOzs7Ozs7O1dBT0c7UUFDSCxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFFM0MsNERBQTREO1FBQzVELDhCQUF5QixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUVsRDs7Ozs7V0FLRztRQUNILGlDQUE0QixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQTcvQnRELHVCQUFBLElBQUksY0FBVSxLQUFLLE1BQUEsQ0FBQztRQUNwQix1QkFBQSxJQUFJLGtCQUFjLEtBQUssS0FBSyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLE1BQUEsQ0FBQztJQUMzRixDQUFDO0lBRUQ7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LHNCQUFXLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBc0I7UUFDckMsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsdUJBQUEsSUFBSSxzQkFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztDQXdCRjs7QUFyeEJDOzs7Ozs7O0dBT0c7QUFDSCxLQUFLLDhCQUFpQixNQUFtQyxFQUFFLElBQW1DO0lBQzVGLE1BQU0sSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFFakUsNENBQTRDO0lBQzVDLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDO0lBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDO0lBRS9CLDBDQUEwQztJQUMxQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFYixPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgS2V5VHlwZSxcbiAgS2V5UHJvcGVydGllcyxcbiAgTm90aWZpY2F0aW9uRW5kcG9pbnRDb25maWd1cmF0aW9uLFxuICBQYWdlT3B0cyxcbiAgVXNlckluT3JnSW5mbyxcbiAgQXBpQ2xpZW50LFxuICBPcmdJbmZvLFxuICBNZmFJZCxcbiAgSW1wb3J0S2V5UmVxdWVzdCxcbiAgS2V5UG9saWN5LFxuICBRdWVyeU1ldHJpY3NSZXNwb25zZSxcbiAgT3JnTWV0cmljTmFtZSxcbiAgUXVlcnlNZXRyaWNzUmVxdWVzdCxcbiAgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoLFxuICBKc29uVmFsdWUsXG4gIEVkaXRQb2xpY3ksXG4gIEFkZHJlc3NNYXAsXG4gIENyZWF0ZU9yZ1JlcXVlc3QsXG4gIE1lbWJlclJvbGUsXG4gIFJvbGVQb2xpY3ksXG4gIEMyRkNvbmZpZ3VyYXRpb24sXG4gIE1mYVByb3RlY3RlZEFjdGlvbixcbiAgTWZhVHlwZSxcbiAgUG9saWN5VHlwZSxcbiAgUG9saWN5QWNsLFxuICBDb250YWN0TGFiZWwsXG4gIENvbnRhY3RBZGRyZXNzRGF0YSxcbiAgT3JnRXh0UHJvcHMsXG4gIE9yZ0V4dERhdGEsXG4gIEF1ZGl0TG9nRW50cnksXG4gIEF1ZGl0TG9nUmVxdWVzdCxcbiAgTWZhUmVjZWlwdHMsXG4gIEludml0YXRpb25JbmZvLFxuICBMaXN0VXNlcnNPcHRpb25zLFxuICBMaXN0SW52aXRhdGlvbnNPcHRpb25zLFxufSBmcm9tIFwiLi9pbmRleC50c1wiO1xuaW1wb3J0IHsgQ29udGFjdCB9IGZyb20gXCIuL2NvbnRhY3QudHNcIjtcbmltcG9ydCB7IEMyRkZ1bmN0aW9uLCBLZXksIE1mYVJlcXVlc3QsIFJvbGUgfSBmcm9tIFwiLi9pbmRleC50c1wiO1xuaW1wb3J0IHtcbiAgdHlwZSBOYW1lZEtleVBvbGljeSxcbiAgTmFtZWRQb2xpY3ksXG4gIHR5cGUgTmFtZWRSb2xlUG9saWN5LFxuICB1cGxvYWRXYXNtRnVuY3Rpb24sXG4gIHR5cGUgQzJGSW5mbyxcbn0gZnJvbSBcIi4vcG9saWN5LnRzXCI7XG5cbi8qKiBPcHRpb25zIHBhc2VkIHRvIGNyZWF0ZUtleSBhbmQgZGVyaXZlS2V5ICovXG5leHBvcnQgdHlwZSBDcmVhdGVLZXlQcm9wZXJ0aWVzID0gT21pdDxLZXlQcm9wZXJ0aWVzLCBcInBvbGljeVwiPiAmIHtcbiAgLyoqXG4gICAqIFBvbGljaWVzIHRvIGFwcGx5IHRvIHRoZSBuZXcga2V5LlxuICAgKlxuICAgKiBUaGlzIHR5cGUgbWFrZXMgaXQgcG9zc2libGUgdG8gYXNzaWduIHZhbHVlcyBsaWtlXG4gICAqIGBbQWxsb3dFaXAxOTFTaWduaW5nUG9saWN5XWAsIGJ1dCByZW1haW5zIGJhY2t3YXJkc1xuICAgKiBjb21wYXRpYmxlIHdpdGggcHJpb3IgdmVyc2lvbnMgb2YgdGhlIFNESywgaW4gd2hpY2hcbiAgICogdGhpcyBwcm9wZXJ0eSBoYWQgdHlwZSBgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfCBudWxsYC5cbiAgICovXG4gIHBvbGljeT86IEtleVBvbGljeSB8IHVua25vd25bXSB8IG51bGw7XG59O1xuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gaW1wb3J0S2V5IGFuZCBkZXJpdmVLZXkgKi9cbmV4cG9ydCB0eXBlIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMgPSBDcmVhdGVLZXlQcm9wZXJ0aWVzICYge1xuICAvKipcbiAgICogV2hlbiB0cnVlLCByZXR1cm5zIGEgJ0tleScgb2JqZWN0IGZvciBib3RoIG5ldyBhbmQgZXhpc3Rpbmcga2V5cy5cbiAgICovXG4gIGlkZW1wb3RlbnQ/OiBib29sZWFuO1xufTtcblxuLyoqIE9wdGlvbnMgcGFzc2VkIHRvIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMgKi9cbmV4cG9ydCB0eXBlIERlcml2ZU11bHRpcGxlS2V5VHlwZXNQcm9wZXJ0aWVzID0gSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyAmIHtcbiAgLyoqXG4gICAqIFRoZSBtYXRlcmlhbF9pZCBvZiB0aGUgbW5lbW9uaWMgdXNlZCB0byBkZXJpdmUgbmV3IGtleXMuXG4gICAqXG4gICAqIElmIHRoaXMgYXJndW1lbnQgaXMgdW5kZWZpbmVkIG9yIG51bGwsIGEgbmV3IG1uZW1vbmljIGlzIGZpcnN0IGNyZWF0ZWRcbiAgICogYW5kIGFueSBvdGhlciBzcGVjaWZpZWQgcHJvcGVydGllcyBhcmUgYXBwbGllZCB0byBpdCAoaW4gYWRkaXRpb24gdG9cbiAgICogYmVpbmcgYXBwbGllZCB0byB0aGUgc3BlY2lmaWVkIGtleXMpLlxuICAgKlxuICAgKiBUaGUgbmV3bHkgY3JlYXRlZCBtbmVtb25pYy1pZCBjYW4gYmUgcmV0cmlldmVkIGZyb20gdGhlIGBkZXJpdmF0aW9uX2luZm9gXG4gICAqIHByb3BlcnR5IG9mIHRoZSBgS2V5SW5mb2AgdmFsdWUgZm9yIGEgcmVzdWx0aW5nIGtleS5cbiAgICovXG4gIG1uZW1vbmljX2lkPzogc3RyaW5nO1xufTtcblxuLyoqIE9yZ2FuaXphdGlvbiBpZCAqL1xuZXhwb3J0IHR5cGUgT3JnSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmctd2lkZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIE9yZ1BvbGljeSA9XG4gIHwgU291cmNlSXBBbGxvd2xpc3RQb2xpY3lcbiAgfCBPaWRjQXV0aFNvdXJjZXNQb2xpY3lcbiAgfCBPcmlnaW5BbGxvd2xpc3RQb2xpY3lcbiAgfCBNYXhEYWlseVVuc3Rha2VQb2xpY3lcbiAgfCBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzUG9saWN5XG4gIHwgRXhjbHVzaXZlS2V5QWNjZXNzUG9saWN5O1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gZW5mb3JjZSBleGNsdXNpdmUgYWNjZXNzIHRvIGtleXMuICBDb25jcmV0ZWx5LFxuICogLSBpZiBcIkxpbWl0VG9LZXlPd25lclwiIGlzIHNldCwgb25seSBrZXkgb3duZXJzIGFyZSBwZXJtaXR0ZWQgdG8gYWNjZXNzXG4gKiAgIHRoZWlyIGtleXMgZm9yIHNpZ25pbmc6IGEgdXNlciBzZXNzaW9uIChub3QgYSByb2xlIHNlc3Npb24pIGlzIHJlcXVpcmVkXG4gKiAgIGZvciBzaWduaW5nLCBhbmQgYWRkaW5nIGEga2V5IHRvIGEgcm9sZSBpcyBub3QgcGVybWl0dGVkLlxuICogLSBpZiBcIkxpbWl0VG9TaW5nbGVSb2xlXCIgaXMgc2V0LCBlYWNoIGtleSBpcyBwZXJtaXR0ZWQgdG8gYmUgaW4gYXQgbW9zdFxuICogICBvbmUgcm9sZSwgYW5kIHNpZ25pbmcgaXMgb25seSBhbGxvd2VkIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYSByb2xlIHNlc3Npb24gdG9rZW4uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXhjbHVzaXZlS2V5QWNjZXNzUG9saWN5IHtcbiAgRXhjbHVzaXZlS2V5QWNjZXNzOiBcIkxpbWl0VG9LZXlPd25lclwiIHwgXCJMaW1pdFRvU2luZ2xlUm9sZVwiO1xufVxuXG4vKipcbiAqIFRoZSBzZXQgb2YgcmVseWluZyBwYXJ0aWVzIHRvIGFsbG93IGZvciB3ZWJhdXRobiByZWdpc3RyYXRpb25cbiAqIFRoZXNlIGNvcnJlc3BvbmQgdG8gZG9tYWlucyBmcm9tIHdoaWNoIGJyb3dzZXJzIGNhbiBzdWNjZXNzZnVsbHkgY3JlYXRlIGNyZWRlbnRpYWxzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdlYkF1dGhuUmVseWluZ1BhcnRpZXNQb2xpY3kge1xuICBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzOiB7IGlkPzogc3RyaW5nOyBuYW1lOiBzdHJpbmcgfVtdO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGFuIGFsbG93bGlzdCBvZiBPSURDIElzc3VlcnMgYW5kIGF1ZGllbmNlcyB0aGF0IGFyZSBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSBpbnRvIHRoaXMgb3JnLlxuICpcbiAqIEBleGFtcGxlIHtcIk9pZGNBdXRoU291cmNlc1wiOiB7IFwiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tXCI6IFsgXCIxMjM0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXCIgXX19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY0F1dGhTb3VyY2VzUG9saWN5IHtcbiAgT2lkY0F1dGhTb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXSB8IElzc3VlckNvbmZpZz47XG59XG5cbi8qKiBPSURDIGlzc3VlciBjb25maWd1cmF0aW9uICovXG5leHBvcnQgaW50ZXJmYWNlIElzc3VlckNvbmZpZyB7XG4gIC8qKiBUaGUgc2V0IG9mIGF1ZGllbmNlcyBzdXBwb3J0ZWQgZm9yIHRoaXMgaXNzdWVyICovXG4gIGF1ZHM6IHN0cmluZ1tdO1xuXG4gIC8qKiBUaGUga2luZHMgb2YgdXNlciBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoaXMgaXNzdWVyICovXG4gIHVzZXJzOiBNZW1iZXJSb2xlW107XG5cbiAgLyoqIE9wdGlvbmFsIG5pY2tuYW1lIGZvciB0aGlzIHByb3ZpZGVyICovXG4gIG5pY2tuYW1lPzogc3RyaW5nO1xuXG4gIC8qKiBXaGV0aGVyIHRvIG1ha2UgdGhpcyBpc3N1ZXIgcHVibGljICovXG4gIHB1YmxpYz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogT25seSBhbGxvdyByZXF1ZXN0cyBmcm9tIHRoZSBzcGVjaWZpZWQgb3JpZ2lucy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJPcmlnaW5BbGxvd2xpc3RcIjogXCIqXCJ9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JpZ2luQWxsb3dsaXN0UG9saWN5IHtcbiAgT3JpZ2luQWxsb3dsaXN0OiBzdHJpbmdbXSB8IFwiKlwiO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHNpZ25pbmcgdG8gc3BlY2lmaWMgc291cmNlIElQIGFkZHJlc3Nlcy5cbiAqXG4gKiBAZXhhbXBsZSB7XCJTb3VyY2VJcEFsbG93bGlzdFwiOiBbXCIxMC4xLjIuMy84XCIsIFwiMTY5LjI1NC4xNy4xLzE2XCJdfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5IHtcbiAgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSBudW1iZXIgb2YgdW5zdGFrZXMgcGVyIGRheS5cbiAqXG4gKiBAZXhhbXBsZSB7XCJNYXhEYWlseVVuc3Rha2VcIjogNSB9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWF4RGFpbHlVbnN0YWtlUG9saWN5IHtcbiAgTWF4RGFpbHlVbnN0YWtlOiBudW1iZXI7XG59XG5cbi8qKlxuICogRmlsdGVyIHRvIHVzZSB3aGVuIGxpc3Rpbmcga2V5c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleUZpbHRlciB7XG4gIC8qKiBGaWx0ZXIgYnkga2V5IHR5cGUgKi9cbiAgdHlwZT86IEtleVR5cGU7XG4gIC8qKiBGaWx0ZXIgYnkga2V5IG93bmVyICovXG4gIG93bmVyPzogc3RyaW5nO1xuICAvKiogU2VhcmNoIGJ5IGtleSdzIG1hdGVyaWFsIGlkIGFuZCBtZXRhZGF0YSAqL1xuICBzZWFyY2g/OiBzdHJpbmc7XG4gIC8qKiBQYWdpbmF0aW9uIG9wdGlvbnMgKi9cbiAgcGFnZT86IFBhZ2VPcHRzO1xufVxuXG4vKipcbiAqIEFuIG9yZ2FuaXphdGlvbi5cbiAqXG4gKiBFeHRlbmRzIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBhbmQgcHJvdmlkZXMgYSBmZXcgb3JnLXNwZWNpZmljIG1ldGhvZHMgb24gdG9wLlxuICovXG5leHBvcnQgY2xhc3MgT3JnIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAjb3JnSWQ6IE9yZ0lkO1xuICAvKiogVGhlIG9yZyBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YT86IE9yZ0luZm87XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBvcmcgaWRcbiAgICogQGV4YW1wbGUgT3JnI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgZ2V0IGlkKCk6IE9yZ0lkIHtcbiAgICByZXR1cm4gdGhpcy4jb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgb3JnLiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBPcmdJbmZvIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ1xuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG9yZ0lkOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IG9yZ0lkID09PSBhcGlDbGllbnQub3JnSWQgPyBhcGlDbGllbnQgOiBhcGlDbGllbnQud2l0aFRhcmdldE9yZyhvcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG9yZ2FuaXphdGlvbi4gVGhlIG5ldyBvcmcgaXMgYSBjaGlsZCBvZiB0aGVcbiAgICogY3VycmVudCBvcmcgYW5kIGluaGVyaXRzIGl0cyBrZXktZXhwb3J0IHBvbGljeS4gVGhlIG5ldyBvcmdcbiAgICogaXMgY3JlYXRlZCB3aXRoIG9uZSBvd25lciwgdGhlIGNhbGxlciBvZiB0aGlzIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWVPclJlcXVlc3QgVGhlIG5hbWUgb2YgdGhlIG5ldyBvcmcgb3IgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG5ldyBvcmcuXG4gICAqIEByZXR1cm5zIEluZm9ybWF0aW9uIGFib3V0IHRoZSBuZXdseSBjcmVhdGVkIG9yZy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZU9yZyhuYW1lT3JSZXF1ZXN0OiBzdHJpbmcgfCBDcmVhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgcmVxID0gdHlwZW9mIG5hbWVPclJlcXVlc3QgPT09IFwic3RyaW5nXCIgPyB7IG5hbWU6IG5hbWVPclJlcXVlc3QgfSA6IG5hbWVPclJlcXVlc3Q7XG4gICAgaWYgKCEvXlthLXpBLVowLTlfXXszLDMwfSQvLnRlc3QocmVxLm5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ0NyZWF0ZU9yZyhyZXEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IG9yZyBtZXRyaWNzLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0cmljTmFtZSBUaGUgbWV0cmljIG5hbWUuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIHN0YXJ0IGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLlxuICAgKiBAcGFyYW0gb3B0IE90aGVyIG9wdGlvbmFsIGFyZ3VtZW50c1xuICAgKiBAcGFyYW0gb3B0LmVuZF90aW1lIFRoZSBlbmQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guIElmIG9taXR0ZWQsIGRlZmF1bHRzIHRvICdub3cnLlxuICAgKiBAcGFyYW0gb3B0LnBlcmlvZCBUaGUgZ3JhbnVsYXJpdHksIGluIHNlY29uZHMsIG9mIHRoZSByZXR1cm5lZCBkYXRhIHBvaW50cy5cbiAgICogICBUaGlzIHZhbHVlIGlzIGF1dG9tYXRpY2FsbHkgcm91bmRlZCB1cCB0byBhIG11bHRpcGxlIG9mIDM2MDAgKGkuZS4sIDEgaG91cikuXG4gICAqICAgSWYgb21pdHRlZCwgZGVmYXVsdHMgdG8gdGhlIGR1cmF0aW9uIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCB0aGUgZW5kIGRhdGUuXG4gICAqICAgTXVzdCBiZSBubyBsZXNzIHRoYW4gMSBob3VyLCBpLmUuLCAzNjAwIHNlY29uZHMuIEFkZGl0aW9uYWxseSwgdGhpcyBwZXJpb2QgbXVzdCBub3RcbiAgICogICBkaXZpZGUgdGhlIGBlbmRUaW1lIC0gc3RhcnRUaW1lYCBwZXJpb2QgaW50byBtb3JlIHRoYW4gMTAwIGRhdGEgcG9pbnRzLlxuICAgKiBAcGFyYW0gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBNZXRyaWMgdmFsdWVzIChkYXRhIHBvaW50cykgZm9yIHRoZSByZXF1ZXN0ZWQgcGVyaW9kcy5cbiAgICovXG4gIGFzeW5jIHF1ZXJ5TWV0cmljcyhcbiAgICBtZXRyaWNOYW1lOiBPcmdNZXRyaWNOYW1lLFxuICAgIHN0YXJ0VGltZTogRXBvY2hUaW1lU3RhbXAsXG4gICAgb3B0PzogT21pdDxRdWVyeU1ldHJpY3NSZXF1ZXN0LCBcIm1ldHJpY19uYW1lXCIgfCBcInN0YXJ0X3RpbWVcIj4sXG4gICAgcGFnZU9wdHM/OiBQYWdlT3B0cyxcbiAgKTogUHJvbWlzZTxRdWVyeU1ldHJpY3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IHJlcTogUXVlcnlNZXRyaWNzUmVxdWVzdCA9IHtcbiAgICAgIG1ldHJpY19uYW1lOiBtZXRyaWNOYW1lLFxuICAgICAgLi4ub3B0LFxuICAgICAgc3RhcnRfdGltZTogc3RhcnRUaW1lLFxuICAgICAgLy8gTXVzdCBzZXQgZW5kX3RpbWUgYmVmb3JlIGZldGNoQWxsOiB3aXRob3V0IGl0IHRoZSBiYWNrZW5kIGRlZmF1bHRzIHRvIG5vdygpXG4gICAgICAvLyBvbiBlYWNoIHBhZ2UgcmVxdWVzdCwgYW5kIGEgY2hhbmdpbmcgd2luZG93IGludmFsaWRhdGVzIHRoZSBwYWdpbmF0aW9uIHRva2VuLlxuICAgICAgZW5kX3RpbWU6IG9wdD8uZW5kX3RpbWUgPz8gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1F1ZXJ5TWV0cmljcyhyZXEsIHBhZ2VPcHRzKS5mZXRjaEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IHRoZSBvcmcgYXVkaXQgbG9nLlxuICAgKlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBzdGFydCBkYXRlIGluIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAgICogQHBhcmFtIG9wdCBPdGhlciBvcHRpb25hbCBhcmd1bWVudHNcbiAgICogQHBhcmFtIG9wdC5lbmRfdGltZSBUaGUgZW5kIGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLiBEZWZhdWx0cyB0byAnbm93Jy5cbiAgICogQHBhcmFtIG9wdC5ldmVudHMgRmlsdGVyIGJ5IGV2ZW50IG5hbWUuIElmIG9taXR0ZWQsIGFsbCBldmVudHMgYXJlIGluY2x1ZGVkLlxuICAgKiBAcGFyYW0gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIE1hdGNoaW5nIGF1ZGl0IGxvZyBlbnRyaWVzLlxuICAgKi9cbiAgYXN5bmMgcXVlcnlBdWRpdExvZyhcbiAgICBzdGFydFRpbWU6IEVwb2NoVGltZVN0YW1wLFxuICAgIG9wdD86IE9taXQ8QXVkaXRMb2dSZXF1ZXN0LCBcInN0YXJ0X3RpbWVcIj4sXG4gICAgcGFnZU9wdHM/OiBQYWdlT3B0cyxcbiAgKTogUHJvbWlzZTxBdWRpdExvZ0VudHJ5W10+IHtcbiAgICBjb25zdCByZXE6IEF1ZGl0TG9nUmVxdWVzdCA9IHtcbiAgICAgIC4uLm9wdCxcbiAgICAgIHN0YXJ0X3RpbWU6IHN0YXJ0VGltZSxcbiAgICAgIC8vIE11c3Qgc2V0IGVuZF90aW1lIGJlZm9yZSBmZXRjaEFsbDogd2l0aG91dCBpdCB0aGUgYmFja2VuZCBkZWZhdWx0cyB0byBub3coKVxuICAgICAgLy8gb24gZWFjaCBwYWdlIHJlcXVlc3QsIGFuZCBhIGNoYW5naW5nIHdpbmRvdyBpbnZhbGlkYXRlcyB0aGUgcGFnaW5hdGlvbiB0b2tlbi5cbiAgICAgIGVuZF90aW1lOiBvcHQ/LmVuZF90aW1lID8/IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1F1ZXJ5QXVkaXRMb2cocmVxLCBwYWdlT3B0cykuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdHZXQoKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBvcmcgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgZW5hYmxlKG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIGRpc2FibGUob3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgcG9saWN5IGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxPcmdQb2xpY3lbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgc2lnbiBwb2xpY3kgZm9yIHRoZSBvcmcuICovXG4gIGFzeW5jIHNpZ25Qb2xpY3koKTogUHJvbWlzZTxSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEuc2lnbl9wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgUm9sZVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogT3JnUG9saWN5W10sIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgY29uc3QgcCA9IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcCB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGVkaXQgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgbmV3IGVkaXQgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRFZGl0UG9saWN5KGVkaXRQb2xpY3k6IEVkaXRQb2xpY3ksIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgZWRpdF9wb2xpY3k6IGVkaXRQb2xpY3kgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBzaWduIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogVGhpcyBpcyBhIGdsb2JhbCBzaWduIHBvbGljeSB0aGF0IGFwcGxpZXMgdG8gZXZlcnkgc2lnbiBvcGVyYXRpb24gKGV2ZXJ5IGtleSwgZXZlcnkgcm9sZSkgaW4gdGhlIG9yZy5cbiAgICogSXQgaXMgYW5hbG9nb3VzIHRvIGhvdyByb2xlIHBvbGljaWVzIGFwcGx5IHRvIGFsbCBzaWduIHJlcXVlc3RzIHBlcmZvcm1lZCBieSB0aGUgY29ycmVzcG9uZGluZyByb2xlIHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBuZXcgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRTaWduUG9saWN5KHBvbGljeTogUm9sZVBvbGljeSwgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBzaWduX3BvbGljeTogcG9saWN5IH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBvcmdhbml6YXRpb24ncyBleHRlbmRlZCBwcm9wZXJ0aWVzICh1bmNvbW1vbiBmZWF0dXJlcyBub3QgdXNlZCBieSBtb3N0IHVzZXJzKS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGV4dGVuZGVkIHByb3BlcnRpZXNcbiAgICovXG4gIGFzeW5jIGdldEV4dGVuZGVkUHJvcGVydGllcygpOiBQcm9taXNlPE9yZ0V4dERhdGEgfCBudWxsPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5leHRfZGF0YSA/IGRhdGEuZXh0X2RhdGEgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgb3JnYW5pemF0aW9uJ3MgZXh0ZW5kZWQgcHJvcGVydGllcyAodW5jb21tb24gZmVhdHVyZXMgbm90IHVzZWQgYnkgbW9zdCB1c2VycykuXG4gICAqXG4gICAqIEBwYXJhbSBwcm9wcyBUaGUgbmV3IHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldEV4dGVuZGVkUHJvcGVydGllcyhwcm9wczogT3JnRXh0UHJvcHMsIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgZXh0X3Byb3BzOiBwcm9wcyB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBlci1hbGllbiBrZXkgY291bnQgdGhyZXNob2xkLCB3aGljaCwgb25jZSBleGNlZWRlZCwgZGlzYWxsb3dzIGZ1cnRoZXIga2V5IGNyZWF0aW9uIGJ5IGFsaWVuIHVzZXJzLlxuICAgKlxuICAgKiBUaGlzIHNldHRpbmcgaXMgY2hlY2tlZCBvbmx5IHdoZW4gYW4gYWxpZW4gdXNlciByZXF1ZXN0cyB0byBjcmVhdGUgb3IgaW1wb3J0IGEgbmV3IGtleS5cbiAgICogSW4gb3RoZXIgd29yZHMsIG9yZyBhZG1pbnMgY2FuIHN0aWxsIGFzc2lnbiB1bmxpbWl0ZWQgbnVtYmVyIG9mIGtleXMgdG8gdGhlaXIgYWxpZW4gdXNlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBhbGllbktleUNvdW50VGhyZXNob2xkIFRoZSBuZXcga2V5IGNvdW50IHRocmVzaG9sZC5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0QWxpZW5LZXlDb3VudFRocmVzaG9sZChcbiAgICBhbGllbktleUNvdW50VGhyZXNob2xkOiBudW1iZXIsXG4gICAgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0sXG4gICkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiN1cGRhdGVFeHRQcm9wcygoZGF0YSkgPT4ge1xuICAgICAgZGF0YS5hbGllbl9rZXlfY291bnRfdGhyZXNob2xkID0gYWxpZW5LZXlDb3VudFRocmVzaG9sZDtcbiAgICB9LCBvcHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgd2hldGhlciB0aGUgYWxpZW4gdXNlcnMgc2hvdWxkIGJlIGFsbG93ZWQgdG8gdXBkYXRlIHRoZWlyIG93biBrZXkgcG9saWNpZXMuXG4gICAqXG4gICAqIEBwYXJhbSBhbGllbnNDYW5VcGRhdGVLZXlQb2xpY3kgV2hldGhlciBhbGllbiB1c2VycyBzaG91bGQgYmUgYWxsb3dlZCB0byB1cGRhdGUgdGhlaXIgb3duIGtleSBwb2xpY2llcy5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0QWxpZW5zQ2FuVXBkYXRlS2V5UG9saWN5KFxuICAgIGFsaWVuc0NhblVwZGF0ZUtleVBvbGljeTogYm9vbGVhbixcbiAgICBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSxcbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3VwZGF0ZUV4dFByb3BzKChkYXRhKSA9PiB7XG4gICAgICBkYXRhLmFsaWVuc19jYW5fdXBkYXRlX2tleV9wb2xpY3kgPSBhbGllbnNDYW5VcGRhdGVLZXlQb2xpY3k7XG4gICAgfSwgb3B0cyk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHNlbGVjdCBleHRlbmRlZCBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiBAcGFyYW0gdXBkYXRlIFRoZSB1cGRhdGUgZnVuY3Rpb25cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBPcmcgaW5mb1xuICAgKi9cbiAgYXN5bmMgI3VwZGF0ZUV4dFByb3BzKHVwZGF0ZTogKGRhdGE6IE9yZ0V4dFByb3BzKSA9PiB2b2lkLCBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSkge1xuICAgIGNvbnN0IGRhdGEgPSB7IC4uLigoYXdhaXQgdGhpcy5nZXRFeHRlbmRlZFByb3BlcnRpZXMoKSkgPz8ge30pIH07XG5cbiAgICAvLyBlcmFzZSB0aGUgbWV0YWRhdGEgdGhhdCBjYW5ub3QgYmUgdXBkYXRlZFxuICAgIGRhdGEuY3JlYXRlZCA9IHVuZGVmaW5lZDtcbiAgICBkYXRhLmxhc3RfbW9kaWZpZWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBleGVjdXRlIGNsaWVudC1zdXBwbGllZCB1cGRhdGUgZnVuY3Rpb25cbiAgICB1cGRhdGUoZGF0YSk7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBleHRfcHJvcHM6IGRhdGEgfSwgb3B0cz8ubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBub3RpZmljYXRpb24gZW5kcG9pbnRzIGZvciB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gbm90aWZpY2F0aW9uX2VuZHBvaW50cyBFbmRwb2ludHMuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIG9wdHMubWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdHNcbiAgICogQHJldHVybnMgT3JnIGluZm9cbiAgICovXG4gIGFzeW5jIHNldE5vdGlmaWNhdGlvbkVuZHBvaW50cyhcbiAgICBub3RpZmljYXRpb25fZW5kcG9pbnRzOiBOb3RpZmljYXRpb25FbmRwb2ludENvbmZpZ3VyYXRpb25bXSxcbiAgICBvcHRzPzogeyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSxcbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgbm90aWZpY2F0aW9uX2VuZHBvaW50cyB9LCBvcHRzPy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgcmVxdWlyZWQgTUZBIHR5cGVzIGZvciBhY3Rpb25zIGltcGxpY2l0bHkgcmVxdWlyaW5nIE1GQSAoc2VlIHtAbGluayBNZmFQcm90ZWN0ZWRBY3Rpb259KS5cbiAgICpcbiAgICogQHBhcmFtIGFsbG93ZWRfbWZhX3R5cGVzIEFzc2lnbm1lbnQgb2YgTUZBIHR5cGVzIHRvIGFjdGlvbnMgdGhhdCBpbXBsaWNpdGx5IHJlcXVpcmUgTUZBLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRBbGxvd2VkTWZhVHlwZXMoXG4gICAgYWxsb3dlZF9tZmFfdHlwZXM6IFBhcnRpYWw8UmVjb3JkPE1mYVByb3RlY3RlZEFjdGlvbiwgTWZhVHlwZVtdPj4sXG4gICAgb3B0cz86IHsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzIH0sXG4gICkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IGFsbG93ZWRfbWZhX3R5cGVzIH0sIG9wdHM/Lm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduaW5nIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXkuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyB0byBzZXQgb24gdGhlIG5ldyBrZXkuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleSh0eXBlOiBLZXlUeXBlLCBvd25lcklkPzogc3RyaW5nLCBwcm9wcz86IENyZWF0ZUtleVByb3BlcnRpZXMpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0NyZWF0ZSh0eXBlLCAxLCBvd25lcklkLCBwcm9wcyk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlzWzBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIHNldCBvbiB0aGUgbmV3IGtleXMuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleXMoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICAgcHJvcHM/OiBDcmVhdGVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzQ3JlYXRlKHR5cGUsIGNvdW50LCBvd25lcklkLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyAoZmlyc3QtcGFydHkpIHVzZXIgaW4gdGhlIG9yZ2FuaXphdGlvbiBhbmQgc2VuZHMgYW4gaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VySW52aXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgaW52aXRlcyBhIHVzZXJcbiAgICovXG4gIGdldCBjcmVhdGVVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckludml0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcGVuZGluZyBpbnZpdGF0aW9ucyBpbiB0aGUgb3JnYW5pemF0aW9uLCBpLmUuLCB0aG9zZSB0aGF0IGhhdmVcbiAgICogbmVpdGhlciBiZWVuIGFjY2VwdGVkIG5vciBjYW5jZWxlZCwgYW5kIGhhdmUgbm90IGV4cGlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIFBhZ2luYXRpb24gYW5kIGZpbHRlcmluZyBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHBlbmRpbmcgaW52aXRhdGlvbnNcbiAgICovXG4gIGFzeW5jIGludml0YXRpb25zKG9wdHM/OiBMaXN0SW52aXRhdGlvbnNPcHRpb25zKTogUHJvbWlzZTxJbnZpdGF0aW9uSW5mb1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdJbnZpdGF0aW9uc0xpc3Qob3B0cykuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgaW52aXRhdGlvbnMgaW4gdGhlIG9yZ2FuaXphdGlvbiAocGFnaW5hdGVkKS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ0ludml0YXRpb25zTGlzdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBwYWdpbmF0ZWQgbGlzdCBvZiBwZW5kaW5nIGludml0YXRpb25zXG4gICAqL1xuICBnZXQgaW52aXRhdGlvbnNQYWdpbmF0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdJbnZpdGF0aW9uc0xpc3QuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbmNlbCBhIHBlbmRpbmcgaW52aXRhdGlvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ0ludml0YXRpb25DYW5jZWx9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBjYW5jZWxzIGEgcGVuZGluZyBpbnZpdGF0aW9uXG4gICAqL1xuICBnZXQgY2FuY2VsSW52aXRhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ0ludml0YXRpb25DYW5jZWwuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgZGVsZXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyQ3JlYXRlT2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgYW4gT0lEQyB1c2VyLCByZXNvbHZpbmcgdG8gdGhlIG5ldyB1c2VyJ3MgSURcbiAgICovXG4gIGdldCBjcmVhdGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJDcmVhdGVPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGFuIE9JREMgdXNlclxuICAgKi9cbiAgZ2V0IGRlbGV0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGMuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFuIE1GQSByZXNldCBmb3IgYSB1c2VyIGluIHRoZSBvcmcuIFRoZSByZXNldCBpcyBjb21wbGV0ZWQgYnlcbiAgICogdGhlIHVzZXIgdmlhIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50LnJlc2V0VXNlck1mYUNvbXBsZXRlfS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnJlc2V0VXNlck1mYUluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBpbml0aWF0ZXMgYW4gTUZBIHJlc2V0IGZvciBhIHVzZXJcbiAgICovXG4gIGdldCByZXNldFVzZXJNZmFJbml0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQucmVzZXRVc2VyTWZhSW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQG92ZXJsb2FkXG4gICAqIEBwYXJhbSBvcHRzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZmlsdGVyaW5nIHRoZSB1c2Vycy5cbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGFzeW5jIHVzZXJzKG9wdHM/OiBMaXN0VXNlcnNPcHRpb25zKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvW10+O1xuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQG92ZXJsb2FkXG4gICAqIEBwYXJhbSBzZWFyY2hRdWVyeSBRdWVyeSBzdHJpbmcuIElmIGRlZmluZWQsIGFsbCByZXR1cm5lZCB1c2VycyB3aWxsIGNvbnRhaW4gdGhpcyBzdHJpbmcgaW4gdGhlaXIgbmFtZSBvciBlbWFpbC5cbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgdXNlcnNcbiAgICogQGRlcHJlY2F0ZWQgVXNlIHRoZSBgTGlzdFVzZXJzT3B0aW9uc2AgcGFyYW1ldGVyIG92ZXJsb2FkIGluc3RlYWQuXG4gICAqL1xuICBhc3luYyB1c2VycyhzZWFyY2hRdWVyeT86IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mb1tdPjtcbiAgLyoqXG4gICAqIExpc3QgYWxsIHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBvcHRzT3JTZWFyY2hRdWVyeSBFaXRoZXIgYWRkaXRpb25hbCBvcHRpb25zIGZvciBmaWx0ZXJpbmcgdGhlIHVzZXJzLCBvciAoZGVwcmVjYXRlZCkgYSBzZWFyY2ggcXVlcnkgc3RyaW5nLlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiB1c2Vyc1xuICAgKi9cbiAgYXN5bmMgdXNlcnMob3B0c09yU2VhcmNoUXVlcnk/OiBMaXN0VXNlcnNPcHRpb25zIHwgc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvW10+IHtcbiAgICBjb25zdCBvcHRzOiBMaXN0VXNlcnNPcHRpb25zID1cbiAgICAgIHR5cGVvZiBvcHRzT3JTZWFyY2hRdWVyeSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICA/IHsgc2VhcmNoUXVlcnk6IG9wdHNPclNlYXJjaFF1ZXJ5IH1cbiAgICAgICAgOiAob3B0c09yU2VhcmNoUXVlcnkgPz8ge30pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXNlcnNMaXN0KG9wdHMpLmZldGNoQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnYW5pemF0aW9uIChwYWdpbmF0ZWQpLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlcnNMaXN0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHBhZ2luYXRlZCBsaXN0IG9mIHVzZXJzXG4gICAqL1xuICBnZXQgdXNlcnNQYWdpbmF0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2Vyc0xpc3QuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IGlkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckdldH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgdXNlcidzIGluZm9cbiAgICovXG4gIGdldCBnZXRVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckdldC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgZW1haWwuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0QnlFbWFpbH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgdXNlcidzIGluZm9cbiAgICovXG4gIGdldCBnZXRVc2VyQnlFbWFpbCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJHZXRCeUVtYWlsLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlciBieSBPSURDIElELlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckdldEJ5T2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgdXNlcidzIGluZm9cbiAgICovXG4gIGdldCBnZXRVc2VyQnlPaWRjKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckdldEJ5T2lkYy5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIGEgdXNlciBpbiB0aGlzIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyIHdob3NlIG1lbWJlcnNoaXAgdG8gZW5hYmxlXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHVzZXIncyBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyBlbmFibGVVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCh1c2VySWQsIHsgZGlzYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgYSB1c2VyIGluIHRoaXMgb3JnXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byBkaXNhYmxlXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHVzZXIncyBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyBkaXNhYmxlVXNlcih1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlVXNlck1lbWJlcnNoaXAodXNlcklkLCB7IGRpc2FibGVkOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYWNjZXNzaWJsZSBrZXlzIGluIHRoZSBvcmdhbml6YXRpb25cbiAgICpcbiAgICogQHBhcmFtIHByb3BzIE9wdGlvbmFsIGZpbHRlcmluZyBwcm9wZXJ0aWVzLlxuICAgKiBAcmV0dXJucyBUaGUga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXMocHJvcHM/OiBLZXlGaWx0ZXIpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3QgcGFnaW5hdG9yID0gdGhpcy4jYXBpQ2xpZW50LmtleXNMaXN0KFxuICAgICAgcHJvcHM/LnR5cGUsXG4gICAgICBwcm9wcz8ucGFnZSxcbiAgICAgIHByb3BzPy5vd25lcixcbiAgICAgIHByb3BzPy5zZWFyY2gsXG4gICAgKTtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgcGFnaW5hdG9yLmZldGNoKCk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybnMgVGhlIG5ldyByb2xlLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlUm9sZShuYW1lPzogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3Qgcm9sZUlkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVDcmVhdGUobmFtZSk7XG4gICAgY29uc3Qgcm9sZUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldChyb2xlSWQpO1xuICAgIHJldHVybiBuZXcgUm9sZSh0aGlzLiNhcGlDbGllbnQsIHJvbGVJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByb2xlIGJ5IGlkIG9yIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIGlkIG9yIG5hbWUgb2YgdGhlIHJvbGUgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIGdldFJvbGUocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSByb2xlcyBpbiB0aGUgb3JnXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFRoZSBwYWdpbmF0b3Igb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgcm9sZXNcbiAgICovXG4gIGFzeW5jIHJvbGVzKHBhZ2U6IFBhZ2VPcHRzKTogUHJvbWlzZTxSb2xlW10+IHtcbiAgICBjb25zdCByb2xlcyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlc0xpc3QocGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gcm9sZXMubWFwKChyKSA9PiBuZXcgUm9sZSh0aGlzLiNhcGlDbGllbnQsIHIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gcnVsZXMgVGhlIHBvbGljeSBydWxlcy5cbiAgICogQHBhcmFtIGFjbCBPcHRpb25hbCBsaXN0IG9mIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVBvbGljeTxUeXBlIGV4dGVuZHMgXCJLZXlcIiB8IFwiUm9sZVwiPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogVHlwZSxcbiAgICBydWxlczogVHlwZSBleHRlbmRzIFwiS2V5XCIgPyBLZXlQb2xpY3kgOiBSb2xlUG9saWN5LFxuICAgIGFjbD86IFBvbGljeUFjbCxcbiAgKTogUHJvbWlzZTxUeXBlIGV4dGVuZHMgXCJLZXlcIiA/IE5hbWVkS2V5UG9saWN5IDogTmFtZWRSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgcG9saWN5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lDcmVhdGUobmFtZSwgdHlwZSwgcnVsZXMsIGFjbCk7XG4gICAgY29uc3QgcG9saWN5ID0gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvKTtcbiAgICByZXR1cm4gcG9saWN5IGFzIFR5cGUgZXh0ZW5kcyBcIktleVwiID8gTmFtZWRLZXlQb2xpY3kgOiBOYW1lZFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbmFtZWQgcG9saWN5IGJ5IGlkIG9yIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3lJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcG9saWN5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGdldFBvbGljeShwb2xpY3lJZDogc3RyaW5nKTogUHJvbWlzZTxOYW1lZFBvbGljeT4ge1xuICAgIGNvbnN0IHBvbGljeUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5R2V0KHBvbGljeUlkLCBcImxhdGVzdFwiKTtcbiAgICByZXR1cm4gTmFtZWRQb2xpY3kuZnJvbUluZm8odGhpcy4jYXBpQ2xpZW50LCBwb2xpY3lJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24gYnkgbmFtZSBvciBuYW1lZCBwb2xpY3kgSUQuXG4gICAqXG4gICAqIEBwYXJhbSBmdW5jdGlvbklkIFRoZSBuYW1lIG9yIG5hbWVkIHBvbGljeSBJRCBvZiB0aGUgZnVuY3Rpb24gdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgQzJGIGZ1bmN0aW9uLlxuICAgKiBAdGhyb3dzIGlmIG5hbWUgb3IgSUQgaXMgbm90IGFzc29jaWF0ZWQgdG8gYSBDMkYgZnVuY3Rpb24gKGkuZS4gdGhlIG5hbWUvaWQgaXMgZm9yIGEga2V5IG9yIHJvbGUgbmFtZWQgcG9saWN5KVxuICAgKi9cbiAgYXN5bmMgZ2V0RnVuY3Rpb24oZnVuY3Rpb25JZDogc3RyaW5nKTogUHJvbWlzZTxDMkZGdW5jdGlvbj4ge1xuICAgIGNvbnN0IGZ1bmN0aW9uSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lHZXQoZnVuY3Rpb25JZCwgXCJsYXRlc3RcIik7XG4gICAgaWYgKGZ1bmN0aW9uSW5mby5wb2xpY3lfdHlwZSAhPT0gXCJXYXNtXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYCR7ZnVuY3Rpb25JZH0gaXMgbm90IGEgV2FzbSBmdW5jdGlvbiwgaXQgaXMgYSAke2Z1bmN0aW9uSW5mby5wb2xpY3lfdHlwZX0gbmFtZWQgcG9saWN5YCxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQzJGRnVuY3Rpb24odGhpcy4jYXBpQ2xpZW50LCBmdW5jdGlvbkluZm8gYXMgQzJGSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdGhlIG5hbWVkIHBvbGljaWVzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcGFyYW0gcG9saWN5VHlwZSBUaGUgb3B0aW9uYWwgdHlwZSBvZiBwb2xpY2llcyB0byBmZXRjaC4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgYWxsIG5hbWVkIHBvbGljaWVzIHJlZ2FyZGxlc3Mgb2YgdHlwZS5cbiAgICogQHJldHVybnMgVGhlIHBvbGljaWVzLlxuICAgKi9cbiAgYXN5bmMgcG9saWNpZXMocGFnZT86IFBhZ2VPcHRzLCBwb2xpY3lUeXBlPzogUG9saWN5VHlwZSk6IFByb21pc2U8TmFtZWRQb2xpY3lbXT4ge1xuICAgIGNvbnN0IHBvbGljaWVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljaWVzTGlzdChwYWdlLCBwb2xpY3lUeXBlKS5mZXRjaCgpO1xuICAgIHJldHVybiBwb2xpY2llcy5tYXAoKHApID0+IE5hbWVkUG9saWN5LmZyb21JbmZvKHRoaXMuI2FwaUNsaWVudCwgcCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSBDMkYgZnVuY3Rpb25zIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFRoZSBwYWdpbmF0b3Igb3B0aW9ucy5cbiAgICogQHJldHVybnMgVGhlIEMyRiBmdW5jdGlvbnMuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbnMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxDMkZGdW5jdGlvbltdPiB7XG4gICAgY29uc3QgcG9saWNpZXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWNpZXNMaXN0KHBhZ2UsIFwiV2FzbVwiKS5mZXRjaCgpO1xuICAgIHJldHVybiBwb2xpY2llcy5tYXAoKGRhdGEpID0+IG5ldyBDMkZGdW5jdGlvbih0aGlzLiNhcGlDbGllbnQsIGRhdGEgYXMgQzJGSW5mbykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgV2FzbSBmdW5jdGlvbi5cbiAgICogQHBhcmFtIGFjbCBPcHRpb25hbCBsaXN0IG9mIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzLlxuICAgKiBAcmV0dXJucyBUaGUgQzJGIGZ1bmN0aW9uXG4gICAqL1xuICBhc3luYyBjcmVhdGVXYXNtRnVuY3Rpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBvbGljeTogVWludDhBcnJheSxcbiAgICBhY2w/OiBQb2xpY3lBY2wsXG4gICk6IFByb21pc2U8QzJGRnVuY3Rpb24+IHtcbiAgICBjb25zdCBoYXNoID0gYXdhaXQgdXBsb2FkV2FzbUZ1bmN0aW9uKHRoaXMuI2FwaUNsaWVudCwgcG9saWN5KTtcbiAgICBjb25zdCBwb2xpY3lJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUNyZWF0ZShcbiAgICAgIG5hbWUsXG4gICAgICBcIldhc21cIixcbiAgICAgIFtcbiAgICAgICAge1xuICAgICAgICAgIGhhc2gsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgYWNsLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBDMkZGdW5jdGlvbih0aGlzLiNhcGlDbGllbnQsIHBvbGljeUluZm8gYXMgQzJGSW5mbyk7XG4gIH1cblxuICAvKiogQHJldHVybnMgdGhlIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbnMgY29uZmlndXJhdGlvbiBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgYzJmQ29uZmlndXJhdGlvbigpOiBQcm9taXNlPEMyRkNvbmZpZ3VyYXRpb24gfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLnBvbGljeV9lbmdpbmVfY29uZmlndXJhdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbnMgY29uZmlndXJhdGlvbiBmb3IgdGhlIG9yZy5cbiAgICogTm90ZSB0aGF0IHRoaXMgb3ZlcndyaXRlcyBhbnkgZXhpc3RpbmcgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNvbmZpZ3MgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9ucyBjb25maWd1cmF0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRzXG4gICAqIEByZXR1cm5zIE9yZyBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRDMkZDb25maWd1cmF0aW9uKGNvbmZpZ3M6IEMyRkNvbmZpZ3VyYXRpb24sIG9wdHM/OiB7IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyB9KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKFxuICAgICAge1xuICAgICAgICBwb2xpY3lfZW5naW5lX2NvbmZpZ3VyYXRpb246IGNvbmZpZ3MsXG4gICAgICB9LFxuICAgICAgb3B0cz8ubWZhUmVjZWlwdCxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIGtleSBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRoIGFuZCBtbmVtb25pYy5cbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRoIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aCB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgbmV3bHkgZGVyaXZlZCBrZXkgb3IgdW5kZWZpbmVkIGlmIGl0IGFscmVhZHkgZXhpc3RzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5KFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGg6IHN0cmluZyxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleSB8IHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5kZXJpdmVLZXlzKHR5cGUsIFtkZXJpdmF0aW9uUGF0aF0sIG1uZW1vbmljSWQsIHByb3BzKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aHMgYW5kIG1uZW1vbmljLlxuICAgKlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5cyB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRocyBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGhzIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzRGVyaXZlKHR5cGUsIGRlcml2YXRpb25QYXRocywgbW5lbW9uaWNJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgZWl0aGVyIGEgbmV3IG9yIGV4aXN0aW5nIG1uZW1vbmljIHRvIGRlcml2ZSBrZXlzIG9mIG9uZSBvciBtb3JlXG4gICAqIHNwZWNpZmllZCB0eXBlcyB2aWEgc3BlY2lmaWVkIGRlcml2YXRpb24gcGF0aHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyBBIGxpc3Qgb2YgYEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aGAgb2JqZWN0cyBzcGVjaWZ5aW5nIHRoZSBrZXlzIHRvIGJlIGRlcml2ZWRcbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMoXG4gICAga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHM6IEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aFtdLFxuICAgIHByb3BzPzogRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNEZXJpdmVNdWx0aShrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocywgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXQoa2V5SWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyBtYXRlcmlhbCBpZCAoZS5nLiwgYWRkcmVzcykuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSBrZXkgdHlwZS5cbiAgICogQHBhcmFtIG1hdGVyaWFsSWQgVGhlIG1hdGVyaWFsIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5QnlNYXRlcmlhbElkKGtleVR5cGU6IEtleVR5cGUsIG1hdGVyaWFsSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXRCeU1hdGVyaWFsSWQoa2V5VHlwZSwgbWF0ZXJpYWxJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBjb250YWN0LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBmb3IgdGhlIG5ldyBjb250YWN0LlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKiBAcGFyYW0gbWV0YWRhdGEgTWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LiBJbnRlbmRlZCBmb3IgdXNlIGFzIGEgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QsIGRldGVybWluaW5nIHdoZW4gYW5kIHdobyBjYW4gZWRpdCB0aGlzIGNvbnRhY3QuXG4gICAqIEBwYXJhbSBsYWJlbHMgVGhlIG9wdGlvbmFsIGxhYmVscyBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseS1jcmVhdGVkIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDb250YWN0KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhZGRyZXNzZXM/OiBBZGRyZXNzTWFwLFxuICAgIG1ldGFkYXRhPzogSnNvblZhbHVlLFxuICAgIGVkaXRQb2xpY3k/OiBFZGl0UG9saWN5LFxuICAgIGxhYmVscz86IENvbnRhY3RMYWJlbFtdLFxuICApOiBQcm9taXNlPENvbnRhY3Q+IHtcbiAgICBjb25zdCBjb250YWN0SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0Q3JlYXRlKFxuICAgICAgbmFtZSxcbiAgICAgIGFkZHJlc3NlcyxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgZWRpdFBvbGljeSxcbiAgICAgIGxhYmVscyxcbiAgICApO1xuXG4gICAgcmV0dXJuIG5ldyBDb250YWN0KHRoaXMuI2FwaUNsaWVudCwgY29udGFjdEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGNvbnRhY3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0gY29udGFjdElkIFRoZSBpZCBvZiB0aGUgY29udGFjdCB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBjb250YWN0LlxuICAgKi9cbiAgYXN5bmMgZ2V0Q29udGFjdChjb250YWN0SWQ6IHN0cmluZyk6IFByb21pc2U8Q29udGFjdD4ge1xuICAgIGNvbnN0IGNvbnRhY3RJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RHZXQoY29udGFjdElkKTtcblxuICAgIHJldHVybiBuZXcgQ29udGFjdCh0aGlzLiNhcGlDbGllbnQsIGNvbnRhY3RJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGNvbnRhY3RzIGluIHRoZSBvcmdhbml6YXRpb24sIG9wdGlvbmFsbHkgbWF0Y2hpbmcgdGhlIHNlYXJjaCBxdWVyeS5cbiAgICpcbiAgICogQHBhcmFtIHNlYXJjaCBUaGUgb3B0aW9uYWwgc2VhcmNoIHF1ZXJ5LiBFaXRoZXI6XG4gICAqICAtIGBsYWJlbDouLi5gLCB3aGljaCB3aWxsIHJldHVybiBjb250YWN0cyB3aXRoIHRoZSBsYWJlbCBwcm92aWRlZCBhZnRlciB0aGUgJzonLFxuICAgKiAgLSBhbiBleGFjdCBhZGRyZXNzIHNlYXJjaCwgd2hpY2ggcmV0dXJucyBjb250YWN0cyB3aXRoIHRoZSBwcm92aWRlZCBDb250YWN0QWRkcmVzc0RhdGEsXG4gICAqICAtIG9yIGFuIGFkZHJlc3MgcHJlZml4IHNlYXJjaCwgd2hlcmUgYWxsIHJldHVybmVkIGNvbnRhY3RzIHdpbGwgaGF2ZSBhbiBhZGRyZXNzIHN0YXJ0aW5nIHdpdGgsIG9yIGVxdWFsaW5nLCB0aGUgZ2l2ZW4gc2VhcmNoIHN0cmluZy5cbiAgICogQHJldHVybnMgQWxsIGNvbnRhY3RzLlxuICAgKi9cbiAgYXN5bmMgY29udGFjdHMoXG4gICAgc2VhcmNoPzogYGxhYmVsJHtDb250YWN0TGFiZWx9YCB8IENvbnRhY3RBZGRyZXNzRGF0YSB8IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDb250YWN0W10+IHtcbiAgICBsZXQgY29udGFjdHM7XG5cbiAgICBpZiAoc2VhcmNoICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHNlYXJjaCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgY29udGFjdHMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuY29udGFjdExvb2t1cEJ5QWRkcmVzcyhzZWFyY2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLiNhcGlDbGllbnQuY29udGFjdHNMaXN0KHVuZGVmaW5lZCwgc2VhcmNoKTtcbiAgICAgIGNvbnRhY3RzID0gYXdhaXQgcGFnaW5hdG9yLmZldGNoKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRhY3RzLm1hcCgoYykgPT4gbmV3IENvbnRhY3QodGhpcy4jYXBpQ2xpZW50LCBjKSk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pZGVudGl0eVByb3ZlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYW4gaWRlbnRpdHkgcHJvb2ZcbiAgICovXG4gIGdldCBwcm92ZUlkZW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaWRlbnRpdHlQcm92ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBnaXZlbiBwcm9vZiBvZiBPSURDIGF1dGhlbnRpY2F0aW9uIGlzIHZhbGlkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaWRlbnRpdHlWZXJpZnl9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCB2ZXJpZmllcyBhIHByb29mIG9mIGlkZW50aXR5LCB0aHJvd2luZyBpZiBpbnZhbGlkXG4gICAqL1xuICBnZXQgdmVyaWZ5SWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5pZGVudGl0eVZlcmlmeS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCBieSBpdHMgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGdldE1mYVJlcXVlc3QobWZhSWQ6IE1mYUlkKTogTWZhUmVxdWVzdCB7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgbWZhSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0cy5cbiAgICovXG4gIGFzeW5jIG1mYVJlcXVlc3RzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8TWZhUmVxdWVzdFtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudFxuICAgICAgLm1mYUxpc3QocGFnZSlcbiAgICAgIC5mZXRjaCgpXG4gICAgICAudGhlbigobWZhSW5mb3MpID0+IG1mYUluZm9zLm1hcCgobWZhSW5mbykgPT4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBtZmFJbmZvKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gZGVwb3NpdCAob3Igc3Rha2luZykgbWVzc2FnZS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNpZ25TdGFrZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgc3Rha2UgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgc3Rha2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zaWduU3Rha2UuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKS4gVGhlIGxpZmV0aW1lIG9mXG4gICAqIHRoZSBuZXcgc2Vzc2lvbiBpcyBzaWxlbnRseSB0cnVuY2F0ZWQgdG8gdGhhdCBvZiB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIG5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgZ2V0IGNyZWF0ZVNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZykgd2hvc2UgbGlmZXRpbWUgcG90ZW50aWFsbHlcbiAgICogZXh0ZW5kcyB0aGUgbGlmZXRpbWUgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbi4gIE1GQSBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRXh0ZW5kZWR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBuZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGdldCBjcmVhdGVFeHRlbmRlZFNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRXh0ZW5kZWQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSBhIHNlc3Npb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uUmV2b2tlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXZva2VzIGEgc2Vzc2lvblxuICAgKi9cbiAgZ2V0IHJldm9rZVNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uUmV2b2tlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgaGVhcnRiZWF0IC8gdXBjaGVjayByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaGVhcnRiZWF0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBzZW5kcyBhIGhlYXJ0YmVhdFxuICAgKi9cbiAgZ2V0IGhlYXJ0YmVhdCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmhlYXJ0YmVhdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0cy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRMaXN0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHBhZ2luYXRvciBvZiB1c2VyLWV4cG9ydCByZXF1ZXN0c1xuICAgKi9cbiAgZ2V0IGV4cG9ydHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0TGlzdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0RGVsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGEgdXNlci1leHBvcnQgcmVxdWVzdFxuICAgKi9cbiAgZ2V0IGRlbGV0ZUV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnREZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRJbml0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgcmVxdWVzdCByZXNwb25zZS5cbiAgICovXG4gIGdldCBpbml0RXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydEluaXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnRDb21wbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHJlcXVlc3QgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgY29tcGxldGVFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0Q29tcGxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgb3JnLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXBkYXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCB1cGRhdGVzIGFuIG9yZyBhbmQgcmV0dXJucyB1cGRhdGVkIG9yZyBpbmZvcm1hdGlvblxuICAgKi9cbiAgZ2V0IHVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCBhIGZyZXNoIGtleS1pbXBvcnQga2V5LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuY3JlYXRlS2V5SW1wb3J0S2V5fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIGZyZXNoIGtleS1pbXBvcnQga2V5XG4gICAqL1xuICBnZXQgY3JlYXRlS2V5SW1wb3J0S2V5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuY3JlYXRlS2V5SW1wb3J0S2V5LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgb25lIG9yIG1vcmUga2V5cy4gVG8gdXNlIHRoaXMgZnVuY3Rpb25hbGl0eSwgeW91IG11c3QgZmlyc3QgY3JlYXRlIGFuXG4gICAqIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QgdXNpbmcgdGhlIGBAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNkay1rZXktaW1wb3J0YFxuICAgKiBsaWJyYXJ5LiBTZWUgdGhhdCBsaWJyYXJ5J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBBbiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgaW1wb3J0ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGltcG9ydEtleXMoYm9keTogSW1wb3J0S2V5UmVxdWVzdCk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmltcG9ydEtleXMoYm9keSk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHkgYWxpYXNlcyBmb3IgTmFtZWQgV2FzbSBQb2xpY3lcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IFdhc20gcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBXYXNtIHBvbGljeSBvYmplY3QuXG4gICAqIEBwYXJhbSBhY2wgT3B0aW9uYWwgbGlzdCBvZiBwb2xpY3kgYWNjZXNzIGNvbnRyb2wgZW50cmllcy5cbiAgICogQHJldHVybnMgVGhlIG5ldyBwb2xpY3kuXG4gICAqL1xuICBjcmVhdGVXYXNtUG9saWN5ID0gdGhpcy5jcmVhdGVXYXNtRnVuY3Rpb247XG5cbiAgLyoqIEByZXR1cm5zIHRoZSBQb2xpY3kgRW5naW5lIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBvcmcuICovXG4gIHBvbGljeUVuZ2luZUNvbmZpZ3VyYXRpb24gPSB0aGlzLmMyZkNvbmZpZ3VyYXRpb247XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgUG9saWN5IEVuZ2luZSBjb25maWd1cmF0aW9uIGZvciB0aGUgb3JnLlxuICAgKiBOb3RlIHRoYXQgdGhpcyBvdmVyd3JpdGVzIGFueSBleGlzdGluZyBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gY29uZmlncyBUaGUgUG9saWN5IEVuZ2luZSBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgc2V0UG9saWN5RW5naW5lQ29uZmlndXJhdGlvbiA9IHRoaXMuc2V0QzJGQ29uZmlndXJhdGlvbjtcbn1cbiJdfQ==