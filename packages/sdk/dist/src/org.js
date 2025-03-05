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
     * @returns Metric values (data points) for the requested periods.
     */
    async queryMetrics(metricName, startTime, opt) {
        return await __classPrivateFieldGet(this, _Org_apiClient, "f").orgQueryMetrics({
            metric_name: metricName,
            start_time: startTime,
            ...opt,
        });
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
     * Get the keys in the organization
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsd0JBQTBDO0FBdUkxQzs7OztHQUlHO0FBQ0gsTUFBYSxHQUFHO0lBTWQ7OztPQUdHO0lBQ0gsSUFBSSxFQUFFO1FBQ0osT0FBTyx1QkFBQSxJQUFJLGtCQUFPLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSxpQkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksU0FBb0IsRUFBRSxLQUFhO1FBM0J0QyxpQ0FBc0I7UUFDL0IsNkJBQWM7UUFDZCwwQkFBMEI7UUFDMUIsNEJBQWdCO1FBeUJkLHVCQUFBLElBQUksa0JBQWMsU0FBUyxNQUFBLENBQUM7UUFDNUIsdUJBQUEsSUFBSSxjQUFVLEtBQUssTUFBQSxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFZO1FBQzFCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7T0FhRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQ2hCLFVBQXlCLEVBQ3pCLFNBQXlCLEVBQ3pCLEdBQTZEO1FBRTdELE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsZUFBZSxDQUFDO1lBQzNDLFdBQVcsRUFBRSxVQUFVO1lBQ3ZCLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLEdBQUcsR0FBRztT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O0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBc0I7UUFDckMsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxNQUFHLENBQUMsdUJBQUEsSUFBSSxzQkFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztDQUNGO0FBeGtCRCxrQkF3a0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBLZXlUeXBlLFxuICBLZXlQcm9wZXJ0aWVzLFxuICBOb3RpZmljYXRpb25FbmRwb2ludENvbmZpZ3VyYXRpb24sXG4gIFBhZ2VPcHRzLFxuICBVc2VySW5PcmdJbmZvLFxuICBBcGlDbGllbnQsXG4gIE9yZ0luZm8sXG4gIE1mYUlkLFxuICBJbXBvcnRLZXlSZXF1ZXN0LFxuICBLZXlQb2xpY3ksXG4gIFF1ZXJ5TWV0cmljc1Jlc3BvbnNlLFxuICBPcmdNZXRyaWNOYW1lLFxuICBRdWVyeU1ldHJpY3NSZXF1ZXN0LFxuICBLZXlUeXBlQW5kRGVyaXZhdGlvblBhdGgsXG59IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBLZXksIE1mYVJlcXVlc3QsIFJvbGUgfSBmcm9tIFwiLlwiO1xuXG4vKiogT3B0aW9ucyBwYXNlZCB0byBjcmVhdGVLZXkgYW5kIGRlcml2ZUtleSAqL1xuZXhwb3J0IHR5cGUgQ3JlYXRlS2V5UHJvcGVydGllcyA9IE9taXQ8S2V5UHJvcGVydGllcywgXCJwb2xpY3lcIj4gJiB7XG4gIC8qKlxuICAgKiBQb2xpY2llcyB0byBhcHBseSB0byB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogVGhpcyB0eXBlIG1ha2VzIGl0IHBvc3NpYmxlIHRvIGFzc2lnbiB2YWx1ZXMgbGlrZVxuICAgKiBgW0FsbG93RWlwMTkxU2lnbmluZ1BvbGljeV1gLCBidXQgcmVtYWlucyBiYWNrd2FyZHNcbiAgICogY29tcGF0aWJsZSB3aXRoIHByaW9yIHZlcnNpb25zIG9mIHRoZSBTREssIGluIHdoaWNoXG4gICAqIHRoaXMgcHJvcGVydHkgaGFkIHR5cGUgYFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIHwgbnVsbGAuXG4gICAqL1xuICBwb2xpY3k/OiBLZXlQb2xpY3kgfCBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGw7XG59O1xuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gaW1wb3J0S2V5IGFuZCBkZXJpdmVLZXkgKi9cbmV4cG9ydCB0eXBlIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMgPSBDcmVhdGVLZXlQcm9wZXJ0aWVzICYge1xuICAvKipcbiAgICogV2hlbiB0cnVlLCByZXR1cm5zIGEgJ0tleScgb2JqZWN0IGZvciBib3RoIG5ldyBhbmQgZXhpc3Rpbmcga2V5cy5cbiAgICovXG4gIGlkZW1wb3RlbnQ/OiBib29sZWFuO1xufTtcblxuLyoqIE9wdGlvbnMgcGFzc2VkIHRvIGRlcml2ZU11bHRpcGxlS2V5VHlwZXMgKi9cbmV4cG9ydCB0eXBlIERlcml2ZU11bHRpcGxlS2V5VHlwZXNQcm9wZXJ0aWVzID0gSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyAmIHtcbiAgLyoqXG4gICAqIFRoZSBtYXRlcmlhbF9pZCBvZiB0aGUgbW5lbW9uaWMgdXNlZCB0byBkZXJpdmUgbmV3IGtleXMuXG4gICAqXG4gICAqIElmIHRoaXMgYXJndW1lbnQgaXMgdW5kZWZpbmVkIG9yIG51bGwsIGEgbmV3IG1uZW1vbmljIGlzIGZpcnN0IGNyZWF0ZWRcbiAgICogYW5kIGFueSBvdGhlciBzcGVjaWZpZWQgcHJvcGVydGllcyBhcmUgYXBwbGllZCB0byBpdCAoaW4gYWRkaXRpb24gdG9cbiAgICogYmVpbmcgYXBwbGllZCB0byB0aGUgc3BlY2lmaWVkIGtleXMpLlxuICAgKlxuICAgKiBUaGUgbmV3bHkgY3JlYXRlZCBtbmVtb25pYy1pZCBjYW4gYmUgcmV0cmlldmVkIGZyb20gdGhlIGBkZXJpdmF0aW9uX2luZm9gXG4gICAqIHByb3BlcnR5IG9mIHRoZSBgS2V5SW5mb2AgdmFsdWUgZm9yIGEgcmVzdWx0aW5nIGtleS5cbiAgICovXG4gIG1uZW1vbmljX2lkPzogc3RyaW5nO1xufTtcblxuLyoqIE9yZ2FuaXphdGlvbiBpZCAqL1xuZXhwb3J0IHR5cGUgT3JnSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmctd2lkZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIE9yZ1BvbGljeSA9XG4gIHwgU291cmNlSXBBbGxvd2xpc3RQb2xpY3lcbiAgfCBPaWRjQXV0aFNvdXJjZXNQb2xpY3lcbiAgfCBPcmlnaW5BbGxvd2xpc3RQb2xpY3lcbiAgfCBNYXhEYWlseVVuc3Rha2VQb2xpY3lcbiAgfCBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzUG9saWN5XG4gIHwgRXhjbHVzaXZlS2V5QWNjZXNzUG9saWN5O1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gZW5mb3JjZSBleGNsdXNpdmUgYWNjZXNzIHRvIGtleXMuICBDb25jcmV0ZWx5LFxuICogLSBpZiBcIkxpbWl0VG9LZXlPd25lclwiIGlzIHNldCwgb25seSBrZXkgb3duZXJzIGFyZSBwZXJtaXR0ZWQgdG8gYWNjZXNzXG4gKiAgIHRoZWlyIGtleXMgZm9yIHNpZ25pbmc6IGEgdXNlciBzZXNzaW9uIChub3QgYSByb2xlIHNlc3Npb24pIGlzIHJlcXVpcmVkXG4gKiAgIGZvciBzaWduaW5nLCBhbmQgYWRkaW5nIGEga2V5IHRvIGEgcm9sZSBpcyBub3QgcGVybWl0dGVkLlxuICogLSBpZiBcIkxpbWl0VG9TaW5nbGVSb2xlXCIgaXMgc2V0LCBlYWNoIGtleSBpcyBwZXJtaXR0ZWQgdG8gYmUgaW4gYXQgbW9zdFxuICogICBvbmUgcm9sZSwgYW5kIHNpZ25pbmcgaXMgb25seSBhbGxvd2VkIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYSByb2xlIHNlc3Npb24gdG9rZW4uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXhjbHVzaXZlS2V5QWNjZXNzUG9saWN5IHtcbiAgRXhjbHVzaXZlS2V5QWNjZXNzOiBcIkxpbWl0VG9LZXlPd25lclwiIHwgXCJMaW1pdFRvU2luZ2xlUm9sZVwiO1xufVxuXG4vKipcbiAqIFRoZSBzZXQgb2YgcmVseWluZyBwYXJ0aWVzIHRvIGFsbG93IGZvciB3ZWJhdXRobiByZWdpc3RyYXRpb25cbiAqIFRoZXNlIGNvcnJlc3BvbmQgdG8gZG9tYWlucyBmcm9tIHdoaWNoIGJyb3dzZXJzIGNhbiBzdWNjZXNzZnVsbHkgY3JlYXRlIGNyZWRlbnRpYWxzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdlYkF1dGhuUmVseWluZ1BhcnRpZXNQb2xpY3kge1xuICBXZWJBdXRoblJlbHlpbmdQYXJ0aWVzOiB7IGlkPzogc3RyaW5nOyBuYW1lOiBzdHJpbmcgfVtdO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGFuIGFsbG93bGlzdCBvZiBPSURDIElzc3VlcnMgYW5kIGF1ZGllbmNlcyB0aGF0IGFyZSBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSBpbnRvIHRoaXMgb3JnLlxuICpcbiAqIEBleGFtcGxlIHtcIk9pZGNBdXRoU291cmNlc1wiOiB7IFwiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tXCI6IFsgXCIxMjM0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXCIgXX19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY0F1dGhTb3VyY2VzUG9saWN5IHtcbiAgT2lkY0F1dGhTb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXSB8IElzc3VlckNvbmZpZz47XG59XG5cbi8qKiBPSURDIGlzc3VlciBjb25maWd1cmF0aW9uICovXG5leHBvcnQgaW50ZXJmYWNlIElzc3VlckNvbmZpZyB7XG4gIC8qKiBUaGUgc2V0IG9mIGF1ZGllbmNlcyBzdXBwb3J0ZWQgZm9yIHRoaXMgaXNzdWVyICovXG4gIGF1ZHM6IHN0cmluZ1tdO1xuXG4gIC8qKiBUaGUga2luZHMgb2YgdXNlciBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoaXMgaXNzdWVyICovXG4gIHVzZXJzOiBzdHJpbmdbXTtcblxuICAvKiogT3B0aW9uYWwgbmlja25hbWUgZm9yIHRoaXMgcHJvdmlkZXIgKi9cbiAgbmlja25hbWU/OiBzdHJpbmc7XG5cbiAgLyoqIFdoZXRoZXIgdG8gbWFrZSB0aGlzIGlzc3VlciBwdWJsaWMgKi9cbiAgcHVibGljPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBPbmx5IGFsbG93IHJlcXVlc3RzIGZyb20gdGhlIHNwZWNpZmllZCBvcmlnaW5zLlxuICpcbiAqIEBleGFtcGxlIHtcIk9yaWdpbkFsbG93bGlzdFwiOiBcIipcIn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmlnaW5BbGxvd2xpc3RQb2xpY3kge1xuICBPcmlnaW5BbGxvd2xpc3Q6IHN0cmluZ1tdIHwgXCIqXCI7XG59XG5cbi8qKlxuICogUmVzdHJpY3Qgc2lnbmluZyB0byBzcGVjaWZpYyBzb3VyY2UgSVAgYWRkcmVzc2VzLlxuICpcbiAqIEBleGFtcGxlIHtcIlNvdXJjZUlwQWxsb3dsaXN0XCI6IFtcIjEwLjEuMi4zLzhcIiwgXCIxNjkuMjU0LjE3LjEvMTZcIl19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlSXBBbGxvd2xpc3RQb2xpY3kge1xuICBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW107XG59XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIG51bWJlciBvZiB1bnN0YWtlcyBwZXIgZGF5LlxuICpcbiAqIEBleGFtcGxlIHtcIk1heERhaWx5VW5zdGFrZVwiOiA1IH1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXhEYWlseVVuc3Rha2VQb2xpY3kge1xuICBNYXhEYWlseVVuc3Rha2U6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBGaWx0ZXIgdG8gdXNlIHdoZW4gbGlzdGluZyBrZXlzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5RmlsdGVyIHtcbiAgLyoqIEZpbHRlciBieSBrZXkgdHlwZSAqL1xuICB0eXBlPzogS2V5VHlwZTtcbiAgLyoqIEZpbHRlciBieSBrZXkgb3duZXIgKi9cbiAgb3duZXI/OiBzdHJpbmc7XG4gIC8qKiBTZWFyY2ggYnkga2V5J3MgbWF0ZXJpYWwgaWQgYW5kIG1ldGFkYXRhICovXG4gIHNlYXJjaD86IHN0cmluZztcbiAgLyoqIFBhZ2luYXRpb24gb3B0aW9ucyAqL1xuICBwYWdlPzogUGFnZU9wdHM7XG59XG5cbi8qKlxuICogQW4gb3JnYW5pemF0aW9uLlxuICpcbiAqIEV4dGVuZHMge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGFuZCBwcm92aWRlcyBhIGZldyBvcmctc3BlY2lmaWMgbWV0aG9kcyBvbiB0b3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBPcmcge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gICNvcmdJZDogT3JnSWQ7XG4gIC8qKiBUaGUgb3JnIGluZm9ybWF0aW9uICovXG4gICNkYXRhPzogT3JnSW5mbztcblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIG9yZyBpZFxuICAgKiBAZXhhbXBsZSBPcmcjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBnZXQgaWQoKTogT3JnSWQge1xuICAgIHJldHVybiB0aGlzLiNvcmdJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyBvcmcuIFRoZSBjYWNoZWQgcHJvcGVydGllcyByZWZsZWN0IHRoZVxuICAgKiBzdGF0ZSBvZiB0aGUgbGFzdCBmZXRjaCBvciB1cGRhdGUuXG4gICAqL1xuICBnZXQgY2FjaGVkKCk6IE9yZ0luZm8gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgb3JnSWQ6IHN0cmluZykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBvcmdhbml6YXRpb24uIFRoZSBuZXcgb3JnIGlzIGEgY2hpbGQgb2YgdGhlXG4gICAqIGN1cnJlbnQgb3JnIGFuZCBpbmhlcml0cyBpdHMga2V5LWV4cG9ydCBwb2xpY3kuIFRoZSBuZXcgb3JnXG4gICAqIGlzIGNyZWF0ZWQgd2l0aCBvbmUgb3duZXIsIHRoZSBjYWxsZXIgb2YgdGhpcyBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBuZXcgb3JnXG4gICAqIEByZXR1cm5zIEluZm9ybWF0aW9uIGFib3V0IHRoZSBuZXdseSBjcmVhdGVkIG9yZy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZU9yZyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBpZiAoIS9eW2EtekEtWjAtOV9dezMsMzB9JC8udGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3JnIG5hbWUgbXVzdCBiZSBhbHBoYW51bWVyaWMgYW5kIGJldHdlZW4gMyBhbmQgMzAgY2hhcmFjdGVyc1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdDcmVhdGVPcmcoeyBuYW1lIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IG9yZyBtZXRyaWNzLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0cmljTmFtZSBUaGUgbWV0cmljIG5hbWUuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIHN0YXJ0IGRhdGUgaW4gc2Vjb25kcyBzaW5jZSB1bml4IGVwb2NoLlxuICAgKiBAcGFyYW0gb3B0IE90aGVyIG9wdGlvbmFsIGFyZ3VtZW50c1xuICAgKiBAcGFyYW0gb3B0LmVuZF90aW1lIFRoZSBlbmQgZGF0ZSBpbiBzZWNvbmRzIHNpbmNlIHVuaXggZXBvY2guIElmIG9taXR0ZWQsIGRlZmF1bHRzIHRvICdub3cnLlxuICAgKiBAcGFyYW0gb3B0LnBlcmlvZCBUaGUgZ3JhbnVsYXJpdHksIGluIHNlY29uZHMsIG9mIHRoZSByZXR1cm5lZCBkYXRhIHBvaW50cy5cbiAgICogICBUaGlzIHZhbHVlIGlzIGF1dG9tYXRpY2FsbHkgcm91bmRlZCB1cCB0byBhIG11bHRpcGxlIG9mIDM2MDAgKGkuZS4sIDEgaG91cikuXG4gICAqICAgSWYgb21pdHRlZCwgZGVmYXVsdHMgdG8gdGhlIGR1cmF0aW9uIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCB0aGUgZW5kIGRhdGUuXG4gICAqICAgTXVzdCBiZSBubyBsZXNzIHRoYW4gMSBob3VyLCBpLmUuLCAzNjAwIHNlY29uZHMuIEFkZGl0aW9uYWxseSwgdGhpcyBwZXJpb2QgbXVzdCBub3RcbiAgICogICBkaXZpZGUgdGhlIGBlbmRUaW1lIC0gc3RhcnRUaW1lYCBwZXJpb2QgaW50byBtb3JlIHRoYW4gMTAwIGRhdGEgcG9pbnRzLlxuICAgKiBAcmV0dXJucyBNZXRyaWMgdmFsdWVzIChkYXRhIHBvaW50cykgZm9yIHRoZSByZXF1ZXN0ZWQgcGVyaW9kcy5cbiAgICovXG4gIGFzeW5jIHF1ZXJ5TWV0cmljcyhcbiAgICBtZXRyaWNOYW1lOiBPcmdNZXRyaWNOYW1lLFxuICAgIHN0YXJ0VGltZTogRXBvY2hUaW1lU3RhbXAsXG4gICAgb3B0PzogT21pdDxRdWVyeU1ldHJpY3NSZXF1ZXN0LCBcIm1ldHJpY19uYW1lXCIgfCBcInN0YXJ0X3RpbWVcIj4sXG4gICk6IFByb21pc2U8UXVlcnlNZXRyaWNzUmVzcG9uc2U+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1F1ZXJ5TWV0cmljcyh7XG4gICAgICBtZXRyaWNfbmFtZTogbWV0cmljTmFtZSxcbiAgICAgIHN0YXJ0X3RpbWU6IHN0YXJ0VGltZSxcbiAgICAgIC4uLm9wdCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JnIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdHZXQoKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuZXcgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAobXVzdCBiZSBhbHBoYW51bWVyaWMpLlxuICAgKiBAZXhhbXBsZSBteV9vcmdfbmFtZVxuICAgKi9cbiAgYXN5bmMgc2V0TmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eW2EtekEtWjAtOV9dezMsMzB9JC8udGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3JnIG5hbWUgbXVzdCBiZSBhbHBoYW51bWVyaWMgYW5kIGJldHdlZW4gMyBhbmQgMzAgY2hhcmFjdGVyc1wiKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VwZGF0ZSh7IG5hbWUgfSk7XG4gIH1cblxuICAvKiogQHJldHVybnMgV2hldGhlciB0aGUgb3JnIGlzIGVuYWJsZWQgKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKiogRW5hYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGVuYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUgb3JnLiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKiogQHJldHVybnMgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8T3JnUG9saWN5W10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgT3JnUG9saWN5W107XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBPcmdQb2xpY3lbXSkge1xuICAgIGNvbnN0IHAgPSBwb2xpY3kgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXTtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIG5vdGlmaWNhdGlvbiBlbmRwb2ludHMgZm9yIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBub3RpZmljYXRpb25fZW5kcG9pbnRzIEVuZHBvaW50cy5cbiAgICovXG4gIGFzeW5jIHNldE5vdGlmaWNhdGlvbkVuZHBvaW50cyhub3RpZmljYXRpb25fZW5kcG9pbnRzOiBOb3RpZmljYXRpb25FbmRwb2ludENvbmZpZ3VyYXRpb25bXSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIG5vdGlmaWNhdGlvbl9lbmRwb2ludHMsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNpZ25pbmcga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleS4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIHNldCBvbiB0aGUgbmV3IGtleS5cbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5KHR5cGU6IEtleVR5cGUsIG93bmVySWQ/OiBzdHJpbmcsIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlzQ3JlYXRlKHR5cGUsIDEsIG93bmVySWQsIHByb3BzKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleXNbMF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgc2lnbmluZyBrZXlzLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXlzLiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgdG8gc2V0IG9uIHRoZSBuZXcga2V5cy5cbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5cyhcbiAgICB0eXBlOiBLZXlUeXBlLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgb3duZXJJZD86IHN0cmluZyxcbiAgICBwcm9wcz86IENyZWF0ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNDcmVhdGUodHlwZSwgY291bnQsIG93bmVySWQsIHByb3BzKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IChmaXJzdC1wYXJ0eSkgdXNlciBpbiB0aGUgb3JnYW5pemF0aW9uIGFuZCBzZW5kcyBhbiBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJJbnZpdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBpbnZpdGVzIGEgdXNlclxuICAgKi9cbiAgZ2V0IGNyZWF0ZVVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VySW52aXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBkZWxldGVzIGEgdXNlclxuICAgKi9cbiAgZ2V0IGRlbGV0ZVVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyRGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgT0lEQyB1c2VyLiBUaGlzIGNhbiBiZSBhIGZpcnN0LXBhcnR5IFwiTWVtYmVyXCIgb3IgdGhpcmQtcGFydHkgXCJBbGllblwiLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckNyZWF0ZU9pZGN9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIGFuIE9JREMgdXNlciwgcmVzb2x2aW5nIHRvIHRoZSBuZXcgdXNlcidzIElEXG4gICAqL1xuICBnZXQgY3JlYXRlT2lkY1VzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2VyQ3JlYXRlT2lkYy5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGVPaWRjfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhbiBPSURDIHVzZXJcbiAgICovXG4gIGdldCBkZWxldGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJEZWxldGVPaWRjLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiB1c2Vyc1xuICAgKi9cbiAgYXN5bmMgdXNlcnMoKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm9yZ1VzZXJzTGlzdCgpLmZldGNoQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnYW5pemF0aW9uIChwYWdpbmF0ZWQpLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlcnNMaXN0fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHBhZ2luYXRlZCBsaXN0IG9mIHVzZXJzXG4gICAqL1xuICBnZXQgdXNlcnNQYWdpbmF0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVc2Vyc0xpc3QuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IGlkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQub3JnVXNlckdldH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGEgdXNlcidzIGluZm9cbiAgICovXG4gIGdldCBnZXRVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQub3JnVXNlckdldC5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIGEgdXNlciBpbiB0aGlzIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyIHdob3NlIG1lbWJlcnNoaXAgdG8gZW5hYmxlXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHVzZXIncyBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyBlbmFibGVVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCh1c2VySWQsIHsgZGlzYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgYSB1c2VyIGluIHRoaXMgb3JnXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byBkaXNhYmxlXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHVzZXIncyBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyBkaXNhYmxlVXNlcih1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQub3JnVXBkYXRlVXNlck1lbWJlcnNoaXAodXNlcklkLCB7IGRpc2FibGVkOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUga2V5cyBpbiB0aGUgb3JnYW5pemF0aW9uXG4gICAqXG4gICAqIEBwYXJhbSBwcm9wcyBPcHRpb25hbCBmaWx0ZXJpbmcgcHJvcGVydGllcy5cbiAgICogQHJldHVybnMgVGhlIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzKHByb3BzPzogS2V5RmlsdGVyKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IHBhZ2luYXRvciA9IHRoaXMuI2FwaUNsaWVudC5rZXlzTGlzdChcbiAgICAgIHByb3BzPy50eXBlLFxuICAgICAgcHJvcHM/LnBhZ2UsXG4gICAgICBwcm9wcz8ub3duZXIsXG4gICAgICBwcm9wcz8uc2VhcmNoLFxuICAgICk7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHBhZ2luYXRvci5mZXRjaCgpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgcm9sZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVJvbGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlQ3JlYXRlKG5hbWUpO1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpZCBvciBuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBnZXRSb2xlKHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3Qgcm9sZUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldChyb2xlSWQpO1xuICAgIHJldHVybiBuZXcgUm9sZSh0aGlzLiNhcGlDbGllbnQsIHJvbGVJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB0aGUgcm9sZXMgaW4gdGhlIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBUaGUgcGFnaW5hdG9yIG9wdGlvbnNcbiAgICogQHJldHVybnMgVGhlIHJvbGVzXG4gICAqL1xuICBhc3luYyByb2xlcyhwYWdlOiBQYWdlT3B0cyk6IFByb21pc2U8Um9sZVtdPiB7XG4gICAgY29uc3Qgcm9sZXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZXNMaXN0KHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIHJvbGVzLm1hcCgocikgPT4gbmV3IFJvbGUodGhpcy4jYXBpQ2xpZW50LCByKSk7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEga2V5IG9mIHRoZSBnaXZlbiB0eXBlIHVzaW5nIHRoZSBnaXZlbiBkZXJpdmF0aW9uIHBhdGggYW5kIG1uZW1vbmljLlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5IHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblBhdGggTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRoIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBwcm9wZXJ0aWVzIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBuZXdseSBkZXJpdmVkIGtleSBvciB1bmRlZmluZWQgaWYgaXQgYWxyZWFkeSBleGlzdHMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXkoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aDogc3RyaW5nLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5IHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmRlcml2ZUtleXModHlwZSwgW2Rlcml2YXRpb25QYXRoXSwgbW5lbW9uaWNJZCwgcHJvcHMpKVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBzZXQgb2Yga2V5cyBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRocyBhbmQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXlzIHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblBhdGhzIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aHMgdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gbW5lbW9uaWNJZCBtYXRlcmlhbF9pZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIHByb3BlcnRpZXMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleXMoXG4gICAgdHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleXNEZXJpdmUodHlwZSwgZGVyaXZhdGlvblBhdGhzLCBtbmVtb25pY0lkLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBlaXRoZXIgYSBuZXcgb3IgZXhpc3RpbmcgbW5lbW9uaWMgdG8gZGVyaXZlIGtleXMgb2Ygb25lIG9yIG1vcmVcbiAgICogc3BlY2lmaWVkIHR5cGVzIHZpYSBzcGVjaWZpZWQgZGVyaXZhdGlvbiBwYXRocy5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzIEEgbGlzdCBvZiBgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoYCBvYmplY3RzIHNwZWNpZnlpbmcgdGhlIGtleXMgdG8gYmUgZGVyaXZlZFxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlTXVsdGlwbGVLZXlUeXBlcyhcbiAgICBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRoczogS2V5VHlwZUFuZERlcml2YXRpb25QYXRoW10sXG4gICAgcHJvcHM/OiBEZXJpdmVNdWx0aXBsZUtleVR5cGVzUHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5c0Rlcml2ZU11bHRpKGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzLCBwcm9wcyk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpZC5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGtleS5cbiAgICovXG4gIGFzeW5jIGdldEtleShrZXlJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldChrZXlJZCk7XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCBrZXlJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaXRzIG1hdGVyaWFsIGlkIChlLmcuLCBhZGRyZXNzKS5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIGtleSB0eXBlLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxJZCBUaGUgbWF0ZXJpYWwgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBnZXRLZXlCeU1hdGVyaWFsSWQoa2V5VHlwZTogS2V5VHlwZSwgbWF0ZXJpYWxJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldEJ5TWF0ZXJpYWxJZChrZXlUeXBlLCBtYXRlcmlhbElkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuaWRlbnRpdHlQcm92ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIGFuIGlkZW50aXR5IHByb29mXG4gICAqL1xuICBnZXQgcHJvdmVJZGVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmlkZW50aXR5UHJvdmUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgZ2l2ZW4gcHJvb2Ygb2YgT0lEQyBhdXRoZW50aWNhdGlvbiBpcyB2YWxpZC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmlkZW50aXR5VmVyaWZ5fSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgdmVyaWZpZXMgYSBwcm9vZiBvZiBpZGVudGl0eSwgdGhyb3dpbmcgaWYgaW52YWxpZFxuICAgKi9cbiAgZ2V0IHZlcmlmeUlkZW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuaWRlbnRpdHlWZXJpZnkuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgTUZBIHJlcXVlc3QgSURcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBnZXRNZmFSZXF1ZXN0KG1mYUlkOiBNZmFJZCk6IE1mYVJlcXVlc3Qge1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIG1mYUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgTUZBIHJlcXVlc3RzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0cy5cbiAgICovXG4gIGFzeW5jIG1mYVJlcXVlc3RzKCk6IFByb21pc2U8TWZhUmVxdWVzdFtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudFxuICAgICAgLm1mYUxpc3QoKVxuICAgICAgLnRoZW4oKG1mYUluZm9zKSA9PiBtZmFJbmZvcy5tYXAoKG1mYUluZm8pID0+IG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgbWZhSW5mbykpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIGRlcG9zaXQgKG9yIHN0YWtpbmcpIG1lc3NhZ2UuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC5zaWduU3Rha2V9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBhIHN0YWtlIHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IHN0YWtlKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2lnblN0YWtlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZykuIFRoZSBsaWZldGltZSBvZlxuICAgKiB0aGUgbmV3IHNlc3Npb24gaXMgc2lsZW50bHkgdHJ1bmNhdGVkIHRvIHRoYXQgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LnNlc3Npb25DcmVhdGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0byBuZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGdldCBjcmVhdGVTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpIHdob3NlIGxpZmV0aW1lIHBvdGVudGlhbGx5XG4gICAqIGV4dGVuZHMgdGhlIGxpZmV0aW1lIG9mIHRoZSBjdXJyZW50IHNlc3Npb24uICBNRkEgaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUV4dGVuZGVkfSwgc2VlIGl0cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gbmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBnZXQgY3JlYXRlRXh0ZW5kZWRTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUV4dGVuZGVkLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgYSBzZXNzaW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQuc2Vzc2lvblJldm9rZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmV2b2tlcyBhIHNlc3Npb25cbiAgICovXG4gIGdldCByZXZva2VTZXNzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvblJldm9rZS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIGhlYXJ0YmVhdCAvIHVwY2hlY2sgcmVxdWVzdC5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmhlYXJ0YmVhdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgc2VuZHMgYSBoZWFydGJlYXRcbiAgICovXG4gIGdldCBoZWFydGJlYXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5oZWFydGJlYXQuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3Qgb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdHMuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0TGlzdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBwYWdpbmF0b3Igb2YgdXNlci1leHBvcnQgcmVxdWVzdHNcbiAgICovXG4gIGdldCBleHBvcnRzKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydExpc3QuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBBcGlDbGllbnQudXNlckV4cG9ydERlbGV0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgZGVsZXRlcyBhIHVzZXItZXhwb3J0IHJlcXVlc3RcbiAgICovXG4gIGdldCBkZWxldGVFeHBvcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC51c2VyRXhwb3J0RGVsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0SW5pdH0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHJlcXVlc3QgcmVzcG9uc2UuXG4gICAqL1xuICBnZXQgaW5pdEV4cG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnVzZXJFeHBvcnRJbml0LmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIEFwaUNsaWVudC51c2VyRXhwb3J0Q29tcGxldGV9LCBzZWUgaXRzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXF1ZXN0IHJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0IGNvbXBsZXRlRXhwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQudXNlckV4cG9ydENvbXBsZXRlLmJpbmQodGhpcy4jYXBpQ2xpZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIG9yZy5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50Lm9yZ1VwZGF0ZX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgdXBkYXRlcyBhbiBvcmcgYW5kIHJldHVybnMgdXBkYXRlZCBvcmcgaW5mb3JtYXRpb25cbiAgICovXG4gIGdldCB1cGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5vcmdVcGRhdGUuYmluZCh0aGlzLiNhcGlDbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcXVlc3QgYSBmcmVzaCBrZXktaW1wb3J0IGtleS5cbiAgICpcbiAgICogU2FtZSBhcyB7QGxpbmsgQXBpQ2xpZW50LmNyZWF0ZUtleUltcG9ydEtleX0sIHNlZSBpdHMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gYSBmcmVzaCBrZXktaW1wb3J0IGtleVxuICAgKi9cbiAgZ2V0IGNyZWF0ZUtleUltcG9ydEtleSgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LmNyZWF0ZUtleUltcG9ydEtleS5iaW5kKHRoaXMuI2FwaUNsaWVudCk7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0IG9uZSBvciBtb3JlIGtleXMuIFRvIHVzZSB0aGlzIGZ1bmN0aW9uYWxpdHksIHlvdSBtdXN0IGZpcnN0IGNyZWF0ZSBhblxuICAgKiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0IHVzaW5nIHRoZSBgQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGsta2V5LWltcG9ydGBcbiAgICogbGlicmFyeS4gU2VlIHRoYXQgbGlicmFyeSdzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgQW4gZW5jcnlwdGVkIGtleS1pbXBvcnQgcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGltcG9ydGVkIGtleXMuXG4gICAqL1xuICBhc3luYyBpbXBvcnRLZXlzKGJvZHk6IEltcG9ydEtleVJlcXVlc3QpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5pbXBvcnRLZXlzKGJvZHkpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxufVxuIl19