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
        __classPrivateFieldSet(this, _Org_apiClient, apiClient, "f");
        __classPrivateFieldSet(this, _Org_orgId, orgId, "f");
    }
    /**
     * Create a new organization. The new org is a child of the
     * current org and inherits its key-export policy. The new org
     * is created with one owner, the caller of this API.
     *
     * @param name The name of the new org
     * @returns Information about the newly created org.
     */
    async createOrg(name) {
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) {
            throw new Error("Org name must be alphanumeric and between 3 and 30 characters");
        }
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgCreateOrg({ name });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsd0JBQTBDO0FBdUkxQzs7OztHQUlHO0FBQ0gsTUFBYSxHQUFHO0lBTWQ7OztPQUdHO0lBQ0gsSUFBSSxFQUFFO1FBQ0osT0FBTyx1QkFBQSxJQUFJLGtCQUFPLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSxpQkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksU0FBb0IsRUFBRSxLQUFhO1FBM0J0QyxpQ0FBc0I7UUFDL0IsNkJBQWM7UUFDZCwwQkFBMEI7UUFDMUIsNEJBQWdCO1FBeUJkLHVCQUFBLElBQUksa0JBQWMsU0FBUyxNQUFBLENBQUM7UUFDNUIsdUJBQUEsSUFBSSxjQUFVLEtBQUssTUFBQSxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFZO1FBQzFCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUNoQixVQUF5QixFQUN6QixTQUF5QixFQUN6QixHQUE2RCxFQUM3RCxRQUFtQjtRQUVuQixNQUFNLEdBQUcsR0FBd0I7WUFDL0IsV0FBVyxFQUFFLFVBQVU7WUFDdkIsVUFBVSxFQUFFLFNBQVM7WUFDckIsR0FBRyxHQUFHO1NBQ1AsQ0FBQztRQUNG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c0JBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsdUJBQUEsSUFBSSxzQkFBVyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUFDLElBQXNCO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksTUFBRyxDQUFDLHVCQUFBLElBQUksc0JBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7Q0FDRjtBQTNrQkQsa0JBMmtCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgS2V5VHlwZSxcbiAgS2V5UHJvcGVydGllcyxcbiAgTm90aWZpY2F0aW9uRW5kcG9pbnRDb25maWd1cmF0aW9uLFxuICBQYWdlT3B0cyxcbiAgVXNlckluT3JnSW5mbyxcbiAgQXBpQ2xpZW50LFxuICBPcmdJbmZvLFxuICBNZmFJZCxcbiAgSW1wb3J0S2V5UmVxdWVzdCxcbiAgS2V5UG9saWN5LFxuICBRdWVyeU1ldHJpY3NSZXNwb25zZSxcbiAgT3JnTWV0cmljTmFtZSxcbiAgUXVlcnlNZXRyaWNzUmVxdWVzdCxcbiAgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgS2V5LCBNZmFSZXF1ZXN0LCBSb2xlIH0gZnJvbSBcIi5cIjtcblxuLyoqIE9wdGlvbnMgcGFzZWQgdG8gY3JlYXRlS2V5IGFuZCBkZXJpdmVLZXkgKi9cbmV4cG9ydCB0eXBlIENyZWF0ZUtleVByb3BlcnRpZXMgPSBPbWl0PEtleVByb3BlcnRpZXMsIFwicG9saWN5XCI+ICYge1xuICAvKipcbiAgICogUG9saWNpZXMgdG8gYXBwbHkgdG8gdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIFRoaXMgdHlwZSBtYWtlcyBpdCBwb3NzaWJsZSB0byBhc3NpZ24gdmFsdWVzIGxpa2VcbiAgICogYFtBbGxvd0VpcDE5MVNpZ25pbmdQb2xpY3ldYCwgYnV0IHJlbWFpbnMgYmFja3dhcmRzXG4gICAqIGNvbXBhdGlibGUgd2l0aCBwcmlvciB2ZXJzaW9ucyBvZiB0aGUgU0RLLCBpbiB3aGljaFxuICAgKiB0aGlzIHByb3BlcnR5IGhhZCB0eXBlIGBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGxgLlxuICAgKi9cbiAgcG9saWN5PzogS2V5UG9saWN5IHwgdW5rbm93bltdIHwgbnVsbDtcbn07XG5cbi8qKiBPcHRpb25zIHBhc3NlZCB0byBpbXBvcnRLZXkgYW5kIGRlcml2ZUtleSAqL1xuZXhwb3J0IHR5cGUgSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyA9IENyZWF0ZUtleVByb3BlcnRpZXMgJiB7XG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIHJldHVybnMgYSAnS2V5JyBvYmplY3QgZm9yIGJvdGggbmV3IGFuZCBleGlzdGluZyBrZXlzLlxuICAgKi9cbiAgaWRlbXBvdGVudD86IGJvb2xlYW47XG59O1xuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gZGVyaXZlTXVsdGlwbGVLZXlUeXBlcyAqL1xuZXhwb3J0IHR5cGUgRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMgPSBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzICYge1xuICAvKipcbiAgICogVGhlIG1hdGVyaWFsX2lkIG9mIHRoZSBtbmVtb25pYyB1c2VkIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICpcbiAgICogSWYgdGhpcyBhcmd1bWVudCBpcyB1bmRlZmluZWQgb3IgbnVsbCwgYSBuZXcgbW5lbW9uaWMgaXMgZmlyc3QgY3JlYXRlZFxuICAgKiBhbmQgYW55IG90aGVyIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFyZSBhcHBsaWVkIHRvIGl0IChpbiBhZGRpdGlvbiB0b1xuICAgKiBiZWluZyBhcHBsaWVkIHRvIHRoZSBzcGVjaWZpZWQga2V5cykuXG4gICAqXG4gICAqIFRoZSBuZXdseSBjcmVhdGVkIG1uZW1vbmljLWlkIGNhbiBiZSByZXRyaWV2ZWQgZnJvbSB0aGUgYGRlcml2YXRpb25faW5mb2BcbiAgICogcHJvcGVydHkgb2YgdGhlIGBLZXlJbmZvYCB2YWx1ZSBmb3IgYSByZXN1bHRpbmcga2V5LlxuICAgKi9cbiAgbW5lbW9uaWNfaWQ/OiBzdHJpbmc7XG59O1xuXG4vKiogT3JnYW5pemF0aW9uIGlkICovXG5leHBvcnQgdHlwZSBPcmdJZCA9IHN0cmluZztcblxuLyoqIE9yZy13aWRlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgT3JnUG9saWN5ID1cbiAgfCBTb3VyY2VJcEFsbG93bGlzdFBvbGljeVxuICB8IE9pZGNBdXRoU291cmNlc1BvbGljeVxuICB8IE9yaWdpbkFsbG93bGlzdFBvbGljeVxuICB8IE1heERhaWx5VW5zdGFrZVBvbGljeVxuICB8IFdlYkF1dGhuUmVseWluZ1BhcnRpZXNQb2xpY3lcbiAgfCBFeGNsdXNpdmVLZXlBY2Nlc3NQb2xpY3k7XG5cbi8qKlxuICogV2hldGhlciB0byBlbmZvcmNlIGV4Y2x1c2l2ZSBhY2Nlc3MgdG8ga2V5cy4gIENvbmNyZXRlbHksXG4gKiAtIGlmIFwiTGltaXRUb0tleU93bmVyXCIgaXMgc2V0LCBvbmx5IGtleSBvd25lcnMgYXJlIHBlcm1pdHRlZCB0byBhY2Nlc3NcbiAqICAgdGhlaXIga2V5cyBmb3Igc2lnbmluZzogYSB1c2VyIHNlc3Npb24gKG5vdCBhIHJvbGUgc2Vzc2lvbikgaXMgcmVxdWlyZWRcbiAqICAgZm9yIHNpZ25pbmcsIGFuZCBhZGRpbmcgYSBrZXkgdG8gYSByb2xlIGlzIG5vdCBwZXJtaXR0ZWQuXG4gKiAtIGlmIFwiTGltaXRUb1NpbmdsZVJvbGVcIiBpcyBzZXQsIGVhY2gga2V5IGlzIHBlcm1pdHRlZCB0byBiZSBpbiBhdCBtb3N0XG4gKiAgIG9uZSByb2xlLCBhbmQgc2lnbmluZyBpcyBvbmx5IGFsbG93ZWQgd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIHJvbGUgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeGNsdXNpdmVLZXlBY2Nlc3NQb2xpY3kge1xuICBFeGNsdXNpdmVLZXlBY2Nlc3M6IFwiTGltaXRUb0tleU93bmVyXCIgfCBcIkxpbWl0VG9TaW5nbGVSb2xlXCI7XG59XG5cbi8qKlxuICogVGhlIHNldCBvZiByZWx5aW5nIHBhcnRpZXMgdG8gYWxsb3cgZm9yIHdlYmF1dGhuIHJlZ2lzdHJhdGlvblxuICogVGhlc2UgY29ycmVzcG9uZCB0byBkb21haW5zIGZyb20gd2hpY2ggYnJvd3NlcnMgY2FuIHN1Y2Nlc3NmdWxseSBjcmVhdGUgY3JlZGVudGlhbHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV2ViQXV0aG5SZWx5aW5nUGFydGllc1BvbGljeSB7XG4gIFdlYkF1dGhuUmVseWluZ1BhcnRpZXM6IHsgaWQ/OiBzdHJpbmc7IG5hbWU6IHN0cmluZyB9W107XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gYWxsb3dsaXN0IG9mIE9JREMgSXNzdWVycyBhbmQgYXVkaWVuY2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIGludG8gdGhpcyBvcmcuXG4gKlxuICogQGV4YW1wbGUge1wiT2lkY0F1dGhTb3VyY2VzXCI6IHsgXCJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb21cIjogWyBcIjEyMzQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb21cIiBdfX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPaWRjQXV0aFNvdXJjZXNQb2xpY3kge1xuICBPaWRjQXV0aFNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdIHwgSXNzdWVyQ29uZmlnPjtcbn1cblxuLyoqIE9JREMgaXNzdWVyIGNvbmZpZ3VyYXRpb24gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXNzdWVyQ29uZmlnIHtcbiAgLyoqIFRoZSBzZXQgb2YgYXVkaWVuY2VzIHN1cHBvcnRlZCBmb3IgdGhpcyBpc3N1ZXIgKi9cbiAgYXVkczogc3RyaW5nW107XG5cbiAgLyoqIFRoZSBraW5kcyBvZiB1c2VyIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhpcyBpc3N1ZXIgKi9cbiAgdXNlcnM6IHN0cmluZ1tdO1xuXG4gIC8qKiBPcHRpb25hbCBuaWNrbmFtZSBmb3IgdGhpcyBwcm92aWRlciAqL1xuICBuaWNrbmFtZT86IHN0cmluZztcblxuICAvKiogV2hldGhlciB0byBtYWtlIHRoaXMgaXNzdWVyIHB1YmxpYyAqL1xuICBwdWJsaWM/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIE9ubHkgYWxsb3cgcmVxdWVzdHMgZnJvbSB0aGUgc3BlY2lmaWVkIG9yaWdpbnMuXG4gKlxuICogQGV4YW1wbGUge1wiT3JpZ2luQWxsb3dsaXN0XCI6IFwiKlwifVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9yaWdpbkFsbG93bGlzdFBvbGljeSB7XG4gIE9yaWdpbkFsbG93bGlzdDogc3RyaW5nW10gfCBcIipcIjtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCBzaWduaW5nIHRvIHNwZWNpZmljIHNvdXJjZSBJUCBhZGRyZXNzZXMuXG4gKlxuICogQGV4YW1wbGUge1wiU291cmNlSXBBbGxvd2xpc3RcIjogW1wiMTAuMS4yLjMvOFwiLCBcIjE2OS4yNTQuMTcuMS8xNlwiXX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VJcEFsbG93bGlzdFBvbGljeSB7XG4gIFNvdXJjZUlwQWxsb3dsaXN0OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgbnVtYmVyIG9mIHVuc3Rha2VzIHBlciBkYXkuXG4gKlxuICogQGV4YW1wbGUge1wiTWF4RGFpbHlVbnN0YWtlXCI6IDUgfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1heERhaWx5VW5zdGFrZVBvbGljeSB7XG4gIE1heERhaWx5VW5zdGFrZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIEZpbHRlciB0byB1c2Ugd2hlbiBsaXN0aW5nIGtleXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlGaWx0ZXIge1xuICAvKiogRmlsdGVyIGJ5IGtleSB0eXBlICovXG4gIHR5cGU/OiBLZXlUeXBlO1xuICAvKiogRmlsdGVyIGJ5IGtleSBvd25lciAqL1xuICBvd25lcj86IHN0cmluZztcbiAgLyoqIFNlYXJjaCBieSBrZXkncyBtYXRlcmlhbCBpZCBhbmQgbWV0YWRhdGEgKi9cbiAgc2VhcmNoPzogc3RyaW5nO1xuICAvKiogUGFnaW5hdGlvbiBvcHRpb25zICovXG4gIHBhZ2U/OiBQYWdlT3B0cztcbn1cblxuLyoqXG4gKiBBbiBvcmdhbml6YXRpb24uXG4gKlxuICogRXh0ZW5kcyB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gYW5kIHByb3ZpZGVzIGEgZmV3IG9yZy1zcGVjaWZpYyBtZXRob2RzIG9uIHRvcC5cbiAqL1xuZXhwb3J0IGNsYXNzIE9yZyB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI29yZ0lkOiBPcmdJZDtcbiAgLyoqIFRoZSBvcmcgaW5mb3JtYXRpb24gKi9cbiAgI2RhdGE/OiBPcmdJbmZvO1xuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIGlkXG4gICAqIEBleGFtcGxlIE9yZyNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICovXG4gIGdldCBpZCgpOiBPcmdJZCB7XG4gICAgcmV0dXJuIHRoaXMuI29yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIG9yZy4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogT3JnSW5mbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBvcmdJZDogc3RyaW5nKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG9yZ2FuaXphdGlvbi4gVGhlIG5ldyBvcmcgaXMgYSBjaGlsZCBvZiB0aGVcbiAgICogY3VycmVudCBvcmcgYW5kIGluaGVyaXRzIGl0cyBrZXktZXhwb3J0IHBvbGljeS4gVGhlIG5ldyBvcmdcbiAgICogaXMgY3JlYXRlZCB3aXRoIG9uZSBvd25lciwgdGhlIGNhbGxlciBvZiB0aGlzIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIG5ldyBvcmdcbiAgICogQHJldHVybnMgSW5mb3JtYXRpb24gYWJvdXQgdGhlIG5ld2x5IGNyZWF0ZWQgb3JnLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlT3JnKG5hbWU6IHN0cmluZyk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIGlmICghL15bYS16QS1aMC05X117MywzMH0kLy50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ0NyZWF0ZU9yZyh7IG5hbWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogUXVlcnkgb3JnIG1ldHJpY3MuXG4gICAqXG4gICAqIEBwYXJhbSBtZXRyaWNOYW1lIFRoZSBtZXRyaWMgbmFtZS5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgc3RhcnQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guXG4gICAqIEBwYXJhbSBvcHQgT3RoZXIgb3B0aW9uYWwgYXJndW1lbnRzXG4gICAqIEBwYXJhbSBvcHQuZW5kX3RpbWUgVGhlIGVuZCBkYXRlIGluIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC4gSWYgb21pdHRlZCwgZGVmYXVsdHMgdG8gJ25vdycuXG4gICAqIEBwYXJhbSBvcHQucGVyaW9kIFRoZSBncmFudWxhcml0eSwgaW4gc2Vjb25kcywgb2YgdGhlIHJldHVybmVkIGRhdGEgcG9pbnRzLlxuICAgKiAgIFRoaXMgdmFsdWUgaXMgYXV0b21hdGljYWxseSByb3VuZGVkIHVwIHRvIGEgbXVsdGlwbGUgb2YgMzYwMCAoaS5lLiwgMSBob3VyKS5cbiAgICogICBJZiBvbWl0dGVkLCBkZWZhdWx0cyB0byB0aGUgZHVyYXRpb24gYmV0d2VlbiB0aGUgc3RhcnQgYW5kIHRoZSBlbmQgZGF0ZS5cbiAgICogICBNdXN0IGJlIG5vIGxlc3MgdGhhbiAxIGhvdXIsIGkuZS4sIDM2MDAgc2Vjb25kcy4gQWRkaXRpb25hbGx5LCB0aGlzIHBlcmlvZCBtdXN0IG5vdFxuICAgKiAgIGRpdmlkZSB0aGUgYGVuZFRpbWUgLSBzdGFydFRpbWVgIHBlcmlvZCBpbnRvIG1vcmUgdGhhbiAxMDAgZGF0YSBwb2ludHMuXG4gICAqIEBwYXJhbSBwYWdlT3B0cyBQYWdpbmF0aW9uIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIE1ldHJpYyB2YWx1ZXMgKGRhdGEgcG9pbnRzKSBmb3IgdGhlIHJlcXVlc3RlZCBwZXJpb2RzLlxuICAgKi9cbiAgYXN5bmMgcXVlcnlNZXRyaWNzKFxuICAgIG1ldHJpY05hbWU6IE9yZ01ldHJpY05hbWUsXG4gICAgc3RhcnRUaW1lOiBFcG9jaFRpbWVTdGFtcCxcbiAgICBvcHQ/OiBPbWl0PFF1ZXJ5TWV0cmljc1JlcXVlc3QsIFwibWV0cmljX25hbWVcIiB8IFwic3RhcnRfdGltZVwiPixcbiAgICBwYWdlT3B0cz86IFBhZ2VPcHRzLFxuICApOiBQcm9taXNlPFF1ZXJ5TWV0cmljc1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVxOiBRdWVyeU1ldHJpY3NSZXF1ZXN0ID0ge1xuICAgICAgbWV0cmljX25hbWU6IG1ldHJpY05hbWUsXG4gICAgICBzdGFydF90aW1lOiBzdGFydFRpbWUsXG4gICAgICAuLi5vcHQsXG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1F1ZXJ5TWV0cmljcyhyZXEsIHBhZ2VPcHRzKS5mZXRjaEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBvcmcgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBvcmcgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBmZXRjaCgpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ0dldCgpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5ldyBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnIChtdXN0IGJlIGFscGhhbnVtZXJpYykuXG4gICAqIEBleGFtcGxlIG15X29yZ19uYW1lXG4gICAqL1xuICBhc3luYyBzZXROYW1lKG5hbWU6IHN0cmluZykge1xuICAgIGlmICghL15bYS16QS1aMC05X117MywzMH0kLy50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlKHsgbmFtZSB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBvcmcgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgcG9saWN5IGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxPcmdQb2xpY3lbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IE9yZ1BvbGljeVtdKSB7XG4gICAgY29uc3QgcCA9IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgbm90aWZpY2F0aW9uIGVuZHBvaW50cyBmb3IgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIG5vdGlmaWNhdGlvbl9lbmRwb2ludHMgRW5kcG9pbnRzLlxuICAgKi9cbiAgYXN5bmMgc2V0Tm90aWZpY2F0aW9uRW5kcG9pbnRzKG5vdGlmaWNhdGlvbl9lbmRwb2ludHM6IE5vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbltdKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoe1xuICAgICAgbm90aWZpY2F0aW9uX2VuZHBvaW50cyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmluZyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5LiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgdG8gc2V0IG9uIHRoZSBuZXcga2V5LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXkodHlwZTogS2V5VHlwZSwgb3duZXJJZD86IHN0cmluZywgcHJvcHM/OiBDcmVhdGVLZXlQcm9wZXJ0aWVzKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNDcmVhdGUodHlwZSwgMSwgb3duZXJJZCwgcHJvcHMpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5c1swXSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBjb3VudCBUaGUgbnVtYmVyIG9mIGtleXMgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyB0byBzZXQgb24gdGhlIG5ldyBrZXlzLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBvd25lcklkPzogc3RyaW5nLFxuICAgIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0NyZWF0ZSh0eXBlLCBjb3VudCwgb3duZXJJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmRzIGFuIGludml0YXRpb24gdG8gdGhhdCB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckludml0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGludml0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgY3JlYXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJJbnZpdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyXG4gICAqL1xuICBnZXQgZGVsZXRlVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyQ3JlYXRlT2lkY30sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgYW4gT0lEQyB1c2VyLCByZXNvbHZpbmcgdG8gdGhlIG5ldyB1c2VyJ3MgSURcbiAgICovXG4gIGdldCBjcmVhdGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJDcmVhdGVPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGFuIE9JREMgdXNlclxuICAgKi9cbiAgZ2V0IGRlbGV0ZU9pZGNVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckRlbGV0ZU9pZGMuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHVzZXJzXG4gICAqL1xuICBhc3luYyB1c2VycygpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm9bXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXNlcnNMaXN0KCkuZmV0Y2hBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb24gKHBhZ2luYXRlZCkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2Vyc0xpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcGFnaW5hdGVkIGxpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGdldCB1c2Vyc1BhZ2luYXRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVc2VyR2V0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSB1c2VyJ3MgaW5mb1xuICAgKi9cbiAgZ2V0IGdldFVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyR2V0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgYSB1c2VyIGluIHRoaXMgb3JnXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byBlbmFibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGVuYWJsZVVzZXIodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKHVzZXJJZCwgeyBkaXNhYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSBhIHVzZXIgaW4gdGhpcyBvcmdcbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIGRpc2FibGVcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGRpc2FibGVVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCh1c2VySWQsIHsgZGlzYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBhY2Nlc3NpYmxlIGtleXMgaW4gdGhlIG9yZ2FuaXphdGlvblxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHMgT3B0aW9uYWwgZmlsdGVyaW5nIHByb3BlcnRpZXMuXG4gICAqIEByZXR1cm5zIFRoZSBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwcm9wcz86IEtleUZpbHRlcik6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLiNhcGlDbGllbnQua2V5c0xpc3QoXG4gICAgICBwcm9wcz8udHlwZSxcbiAgICAgIHByb3BzPy5wYWdlLFxuICAgICAgcHJvcHM/Lm93bmVyLFxuICAgICAgcHJvcHM/LnNlYXJjaCxcbiAgICApO1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBwYWdpbmF0b3IuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyBjcmVhdGVSb2xlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByb2xlSWQgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUNyZWF0ZShuYW1lKTtcbiAgICBjb25zdCByb2xlSW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHJvbGVJZCk7XG4gICAgcmV0dXJuIG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcm9sZUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJvbGUgYnkgaWQgb3IgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgZ2V0Um9sZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdGhlIHJvbGVzIGluIHRoZSBvcmdcbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIHBhZ2luYXRvciBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSByb2xlc1xuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZTogUGFnZU9wdHMpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiByb2xlcy5tYXAoKHIpID0+IG5ldyBSb2xlKHRoaXMuI2FwaUNsaWVudCwgcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIGtleSBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRoIGFuZCBtbmVtb25pYy5cbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRoIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aCB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgcHJvcGVydGllcyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgbmV3bHkgZGVyaXZlZCBrZXkgb3IgdW5kZWZpbmVkIGlmIGl0IGFscmVhZHkgZXhpc3RzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5KFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGg6IHN0cmluZyxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleSB8IHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5kZXJpdmVLZXlzKHR5cGUsIFtkZXJpdmF0aW9uUGF0aF0sIG1uZW1vbmljSWQsIHByb3BzKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aHMgYW5kIG1uZW1vbmljLlxuICAgKlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5cyB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIGRlcml2YXRpb25QYXRocyBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGhzIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXlzKFxuICAgIHR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzRGVyaXZlKHR5cGUsIGRlcml2YXRpb25QYXRocywgbW5lbW9uaWNJZCwgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgZWl0aGVyIGEgbmV3IG9yIGV4aXN0aW5nIG1uZW1vbmljIHRvIGRlcml2ZSBrZXlzIG9mIG9uZSBvciBtb3JlXG4gICAqIHNwZWNpZmllZCB0eXBlcyB2aWEgc3BlY2lmaWVkIGRlcml2YXRpb24gcGF0aHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyBBIGxpc3Qgb2YgYEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aGAgb2JqZWN0cyBzcGVjaWZ5aW5nIHRoZSBrZXlzIHRvIGJlIGRlcml2ZWRcbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMoXG4gICAga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHM6IEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aFtdLFxuICAgIHByb3BzPzogRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNEZXJpdmVNdWx0aShrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocywgcHJvcHMpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXQoa2V5SWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyBtYXRlcmlhbCBpZCAoZS5nLiwgYWRkcmVzcykuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSBrZXkgdHlwZS5cbiAgICogQHBhcmFtIG1hdGVyaWFsSWQgVGhlIG1hdGVyaWFsIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5QnlNYXRlcmlhbElkKGtleVR5cGU6IEtleVR5cGUsIG1hdGVyaWFsSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5SW5mbyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXRCeU1hdGVyaWFsSWQoa2V5VHlwZSwgbWF0ZXJpYWxJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmlkZW50aXR5UHJvdmV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhbiBpZGVudGl0eSBwcm9vZlxuICAgKi9cbiAgZ2V0IHByb3ZlSWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5pZGVudGl0eVByb3ZlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIGdpdmVuIHByb29mIG9mIE9JREMgYXV0aGVudGljYXRpb24gaXMgdmFsaWQuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5pZGVudGl0eVZlcmlmeX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHZlcmlmaWVzIGEgcHJvb2Ygb2YgaWRlbnRpdHksIHRocm93aW5nIGlmIGludmFsaWRcbiAgICovXG4gIGdldCB2ZXJpZnlJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmlkZW50aXR5VmVyaWZ5LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgZ2V0TWZhUmVxdWVzdChtZmFJZDogTWZhSWQpOiBNZmFSZXF1ZXN0IHtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBtZmFJZCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFSZXF1ZXN0cygpOiBQcm9taXNlPE1mYVJlcXVlc3RbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnRcbiAgICAgIC5tZmFMaXN0KClcbiAgICAgIC50aGVuKChtZmFJbmZvcykgPT4gbWZhSW5mb3MubWFwKChtZmFJbmZvKSA9PiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIG1mYUluZm8pKSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiBkZXBvc2l0IChvciBzdGFraW5nKSBtZXNzYWdlLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2lnblN0YWtlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdGFrZSByZXNwb25zZS5cbiAgICovXG4gIGdldCBzdGFrZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNpZ25TdGFrZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpLiBUaGUgbGlmZXRpbWUgb2ZcbiAgICogdGhlIG5ldyBzZXNzaW9uIGlzIHNpbGVudGx5IHRydW5jYXRlZCB0byB0aGF0IG9mIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zZXNzaW9uQ3JlYXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gbmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBnZXQgY3JlYXRlU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKSB3aG9zZSBsaWZldGltZSBwb3RlbnRpYWxseVxuICAgKiBleHRlbmRzIHRoZSBsaWZldGltZSBvZiB0aGUgY3VycmVudCBzZXNzaW9uLiAgTUZBIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25DcmVhdGVFeHRlbmRlZH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIG5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgZ2V0IGNyZWF0ZUV4dGVuZGVkU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGVFeHRlbmRlZC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGEgc2Vzc2lvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25SZXZva2V9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldm9rZXMgYSBzZXNzaW9uXG4gICAqL1xuICBnZXQgcmV2b2tlU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25SZXZva2UuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBoZWFydGJlYXQgLyB1cGNoZWNrIHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5oZWFydGJlYXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHNlbmRzIGEgaGVhcnRiZWF0XG4gICAqL1xuICBnZXQgaGVhcnRiZWF0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaGVhcnRiZWF0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3RzLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydExpc3R9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgcGFnaW5hdG9yIG9mIHVzZXItZXhwb3J0IHJlcXVlc3RzXG4gICAqL1xuICBnZXQgZXhwb3J0cygpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRMaXN0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFeHBvcnREZWxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IGRlbGV0ZXMgYSB1c2VyLWV4cG9ydCByZXF1ZXN0XG4gICAqL1xuICBnZXQgZGVsZXRlRXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydERlbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydEluaXR9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXF1ZXN0IHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IGluaXRFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0SW5pdC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydENvbXBsZXRlfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgcmVxdWVzdCByZXNwb25zZS5cbiAgICovXG4gIGdldCBjb21wbGV0ZUV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRDb21wbGV0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5vcmdVcGRhdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgYW4gb3JnIGFuZCByZXR1cm5zIHVwZGF0ZWQgb3JnIGluZm9ybWF0aW9uXG4gICAqL1xuICBnZXQgdXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IGEgZnJlc2gga2V5LWltcG9ydCBrZXkuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5jcmVhdGVLZXlJbXBvcnRLZXl9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgZnJlc2gga2V5LWltcG9ydCBrZXlcbiAgICovXG4gIGdldCBjcmVhdGVLZXlJbXBvcnRLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5jcmVhdGVLZXlJbXBvcnRLZXkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydCBvbmUgb3IgbW9yZSBrZXlzLiBUbyB1c2UgdGhpcyBmdW5jdGlvbmFsaXR5LCB5b3UgbXVzdCBmaXJzdCBjcmVhdGUgYW5cbiAgICogZW5jcnlwdGVkIGtleS1pbXBvcnQgcmVxdWVzdCB1c2luZyB0aGUgYEBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrLWtleS1pbXBvcnRgXG4gICAqIGxpYnJhcnkuIFNlZSB0aGF0IGxpYnJhcnkncyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IEFuIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBpbXBvcnRlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5cyhib2R5OiBJbXBvcnRLZXlSZXF1ZXN0KTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuaW1wb3J0S2V5cyhib2R5KTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cbn1cbiJdfQ==