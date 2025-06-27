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
var _KeyWithPolicies_apiClient, _KeyWithPolicies_cached, _Role_apiClient, _Role_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.KeyWithPolicies = exports.AllowBtcMessageSigning = exports.AllowEip712Signing = exports.AllowEip191Signing = exports.AllowRawBlobSigning = exports.DepositContract = void 0;
const _1 = require(".");
/** The kind of deposit contracts. */
var DepositContract;
(function (DepositContract) {
    /** Canonical deposit contract */
    DepositContract[DepositContract["Canonical"] = 0] = "Canonical";
    /** Wrapper deposit contract */
    DepositContract[DepositContract["Wrapper"] = 1] = "Wrapper";
})(DepositContract || (exports.DepositContract = DepositContract = {}));
/** Allow raw blob signing */
exports.AllowRawBlobSigning = "AllowRawBlobSigning";
/** Allow EIP-191 signing */
exports.AllowEip191Signing = "AllowEip191Signing";
/** Allow EIP-712 signing */
exports.AllowEip712Signing = "AllowEip712Signing";
/** Allow BTC message signing */
exports.AllowBtcMessageSigning = "AllowBtcMessageSigning";
/** A key guarded by a policy. */
class KeyWithPolicies {
    /** @returns The cached information */
    get cached() {
        return __classPrivateFieldGet(this, _KeyWithPolicies_cached, "f");
    }
    /** @returns The cached policy */
    get policy() {
        return this.cached.policy;
    }
    /** @returns The key */
    async getKey() {
        if (__classPrivateFieldGet(this, _KeyWithPolicies_cached, "f").key_info === undefined || __classPrivateFieldGet(this, _KeyWithPolicies_cached, "f").key_info === null) {
            __classPrivateFieldSet(this, _KeyWithPolicies_cached, await __classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f").roleKeyGet(this.roleId, this.keyId, { details: true }), "f");
        }
        return new _1.Key(__classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f"), __classPrivateFieldGet(this, _KeyWithPolicies_cached, "f").key_info);
    }
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param keyWithPolicies The key and its policies
     * @internal
     */
    constructor(apiClient, keyWithPolicies) {
        _KeyWithPolicies_apiClient.set(this, void 0);
        /** The cached properties of this key/policies */
        _KeyWithPolicies_cached.set(this, void 0);
        __classPrivateFieldSet(this, _KeyWithPolicies_apiClient, apiClient, "f");
        this.roleId = keyWithPolicies.role_id;
        this.keyId = keyWithPolicies.key_id;
        __classPrivateFieldSet(this, _KeyWithPolicies_cached, keyWithPolicies, "f");
    }
}
exports.KeyWithPolicies = KeyWithPolicies;
_KeyWithPolicies_apiClient = new WeakMap(), _KeyWithPolicies_cached = new WeakMap();
/** Roles. */
class Role {
    /** @returns Human-readable name for the role */
    get name() {
        return __classPrivateFieldGet(this, _Role_data, "f").name ?? undefined;
    }
    /**
     * @returns The ID of the role.
     *
     * @example Role#bfe3eccb-731e-430d-b1e5-ac1363e6b06b
     */
    get id() {
        return __classPrivateFieldGet(this, _Role_data, "f").role_id;
    }
    /**
     * @returns the cached properties of this role. The cached properties
     * reflect the state of the last fetch or update (e.g., after awaiting
     * `Role.enabled()` or `Role.disable()`).
     */
    get cached() {
        return __classPrivateFieldGet(this, _Role_data, "f");
    }
    /**
     * Delete the role.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws If MFA is required and no MFA receipts are provided
     * @returns A response which can be used to approve MFA if needed
     */
    async delete(mfaReceipt) {
        return await __classPrivateFieldGet(this, _Role_apiClient, "f").roleDelete(this.id, mfaReceipt);
    }
    /** @returns Whether the role is enabled */
    async enabled() {
        const data = await this.fetch();
        return data.enabled;
    }
    /**
     * Enable the role.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws If MFA is required and no MFA receipts are provided
     */
    async enable(mfaReceipt) {
        await this.update({ enabled: true }, mfaReceipt);
    }
    /**
     * Disable the role.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws If MFA is required and no MFA receipts are provided
     */
    async disable(mfaReceipt) {
        await this.update({ enabled: false }, mfaReceipt);
    }
    /**
     * Set new policy (overwriting any policies previously set for this role)
     *
     * @param policy The new policy to set
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws If MFA is required and no MFA receipts are provided
     */
    async setPolicy(policy, mfaReceipt) {
        await this.update({ policy }, mfaReceipt);
    }
    /**
     * Append to existing role policy. This append is not atomic---it uses
     * {@link policy} to fetch the current policy and then {@link setPolicy}
     * to set the policy---and should not be used in across concurrent sessions.
     *
     * @param policy The policy to append to the existing one.
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws If MFA is required and no MFA receipts are provided
     */
    async appendPolicy(policy, mfaReceipt) {
        const existing = await this.policy();
        await this.setPolicy([...existing, ...policy], mfaReceipt);
    }
    /**
     * Get the policy for the role.
     *
     * @returns The policy for the role.
     */
    async policy() {
        const data = await this.fetch();
        return (data.policy ?? []);
    }
    /**
     * Sets the restricted actions on the role.
     *
     * @param restrictedActions The map of restricted actions
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws If MFA is required and no MFA receipts are provided
     */
    async setRestrictedActions(restrictedActions, mfaReceipt) {
        const restricted_actions = Object.fromEntries(Object.entries(restrictedActions).map(([key, value]) => [key.toString(), value]));
        await this.update({ restricted_actions }, mfaReceipt);
    }
    /**
     * @returns The list of all users with access to the role.
     *
     * @example [
     *   "User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f",
     *   "User#5593c25b-52e2-4fb5-b39b-96d41d681d82"
     * ]
     *
     * @param page Optional pagination options; by default, retrieves all users.
     */
    async users(page) {
        const users = await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUsersList(this.id, page).fetch();
        return (users || []).map((u) => u.user_id);
    }
    /**
     * Add an existing user to an existing role.
     *
     * @param userId The user-id of the user to add to the role.
     */
    async addUser(userId) {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUserAdd(this.id, userId);
    }
    /**
     * Remove an existing user from an existing role.
     *
     * @param userId The user-id of the user to remove from the role.
     */
    async removeUser(userId) {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUserRemove(this.id, userId);
    }
    /**
     * @returns The list of keys in the role.
     *
     * @example [
     *    {
     *     id: "Key#bfe3eccb-731e-430d-b1e5-ac1363e6b06b",
     *     policy: { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
     *    },
     *  ]
     *
     * @param page Optional pagination options; by default, retrieves all keys in this role.
     */
    async keys(page) {
        const keysInRole = await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeysList(this.id, page).fetch();
        return keysInRole.map((k) => new KeyWithPolicies(__classPrivateFieldGet(this, _Role_apiClient, "f"), k));
    }
    /**
     * Get a key in the role by its ID.
     *
     * @param keyId The ID of the key to get.
     * @param opts Optional options for getting the key.
     * @returns The key with its policies.
     */
    async getKey(keyId, opts) {
        const kwp = await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeyGet(this.id, keyId, opts);
        return new KeyWithPolicies(__classPrivateFieldGet(this, _Role_apiClient, "f"), kwp);
    }
    /**
     * Add a list of existing keys to an existing role.
     *
     * @param keys The list of keys to add to the role.
     * @param policy The optional policy to apply to each key.
     *
     * @returns A CubeSigner response indicating success or failure.
     */
    async addKeys(keys, policy) {
        return await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeysAdd(this.id, keys.map((k) => k.id), policy);
    }
    /**
     * Add an existing key to an existing role.
     *
     * @param key The key to add to the role.
     * @param policy The optional policy to apply to the key.
     *
     * @returns A CubeSigner response indicating success or failure.
     */
    async addKey(key, policy) {
        return await this.addKeys([key], policy);
    }
    /**
     * Remove an existing key from an existing role.
     *
     * @param key The key to remove from the role.
     *
     * @returns A CubeSigner response indicating success or failure.
     */
    async removeKey(key) {
        return await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeysRemove(this.id, key.id);
    }
    /**
     * Create a new session for this role.
     *
     * @param purpose Descriptive purpose.
     * @param lifetimes Optional session lifetimes.
     * @param scopes Session scopes. Only `sign:*` scopes are allowed.
     * @returns New session.
     */
    async createSession(purpose, lifetimes, scopes) {
        return await __classPrivateFieldGet(this, _Role_apiClient, "f").sessionCreateForRole(this.id, purpose, scopes, lifetimes);
    }
    /**
     * List all signer sessions for this role. Returned objects can be used to
     * revoke individual sessions, but they cannot be used for authentication.
     *
     * @param page Optional pagination options; by default, retrieves all sessions.
     * @returns Signer sessions for this role.
     */
    async sessions(page) {
        const sessions = await __classPrivateFieldGet(this, _Role_apiClient, "f").sessionsList({ role: this.id }, page).fetch();
        return sessions.map((t) => new _1.SignerSessionInfo(__classPrivateFieldGet(this, _Role_apiClient, "f"), t.session_id, t.purpose));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient, data) {
        _Role_apiClient.set(this, void 0);
        /** The role information */
        _Role_data.set(this, void 0);
        __classPrivateFieldSet(this, _Role_apiClient, apiClient, "f");
        __classPrivateFieldSet(this, _Role_data, data, "f");
    }
    /**
     * Update the role.
     *
     * @param request The JSON request to send to the API server.
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws If MFA is required and no MFA receipts are provided
     * @returns The updated role information.
     */
    async update(request, mfaReceipt) {
        const resp = await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUpdate(this.id, request, mfaReceipt);
        __classPrivateFieldSet(this, _Role_data, resp.data(), "f");
        return __classPrivateFieldGet(this, _Role_data, "f");
    }
    /**
     * Fetches the role information.
     *
     * @returns The role information.
     * @internal
     */
    async fetch() {
        __classPrivateFieldSet(this, _Role_data, await __classPrivateFieldGet(this, _Role_apiClient, "f").roleGet(this.id), "f");
        return __classPrivateFieldGet(this, _Role_data, "f");
    }
}
exports.Role = Role;
_Role_apiClient = new WeakMap(), _Role_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQXFCQSx3QkFBMkM7QUF1QjNDLHFDQUFxQztBQUNyQyxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLCtCQUFmLGVBQWUsUUFLMUI7QUEyWEQsNkJBQTZCO0FBQ2hCLFFBQUEsbUJBQW1CLEdBQUcscUJBQThCLENBQUM7QUFHbEUsNEJBQTRCO0FBQ2YsUUFBQSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSw0QkFBNEI7QUFDZixRQUFBLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBR2hFLGdDQUFnQztBQUNuQixRQUFBLHNCQUFzQixHQUFHLHdCQUFpQyxDQUFDO0FBa0V4RSxpQ0FBaUM7QUFDakMsTUFBYSxlQUFlO0lBTzFCLHNDQUFzQztJQUN0QyxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksK0JBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUErQixDQUFDO0lBQ3JELENBQUM7SUFFRCx1QkFBdUI7SUFDdkIsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssU0FBUyxJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDMUUsdUJBQUEsSUFBSSwyQkFBVyxNQUFNLHVCQUFBLElBQUksa0NBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxD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LENBQUM7UUFDekIsT0FBTyx1QkFBQSxJQUFJLGtCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssS0FBSyxDQUFDLEtBQUs7UUFDakIsdUJBQUEsSUFBSSxjQUFTLE1BQU0sdUJBQUEsSUFBSSx1QkFBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQUEsQ0FBQztRQUNwRCxPQUFPLHVCQUFBLElBQUksa0JBQU0sQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUE1UkQsb0JBNFJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBBcGlDbGllbnQsXG4gIENvbnRyYWN0QWRkcmVzcyxcbiAgRXZtVHhDbXAsXG4gIFNvbGFuYVR4Q21wLFxuICBLZXlXaXRoUG9saWNpZXNJbmZvLFxuICBNZmFUeXBlLFxuICBQYWdlT3B0cyxcbiAgUm9sZUluZm8sXG4gIFNjb3BlLFxuICBTZXNzaW9uRGF0YSxcbiAgU2Vzc2lvbkxpZmV0aW1lLFxuICBVcGRhdGVSb2xlUmVxdWVzdCxcbiAgQmFieWxvblN0YWtpbmdSZXF1ZXN0LFxuICBPcGVyYXRpb25LaW5kLFxuICBNZmFSZWNlaXB0cyxcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFbXB0eSxcbiAgUmVzdHJpY3RlZEFjdGlvbnNNYXAsXG4gIEdldFJvbGVLZXlPcHRpb25zLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgS2V5LCBTaWduZXJTZXNzaW9uSW5mbyB9IGZyb20gXCIuXCI7XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHJlY2VpdmVyIGZvciBFVk0gdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4UmVjZWl2ZXIgPSB7IFR4UmVjZWl2ZXI6IHN0cmluZyB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSByZWNlaXZlciBmb3IgU1VJIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFN1aVR4UmVjZWl2ZXI6IFsgXCIweGM5ODM3YTBhZDJkMTE0NjhiYmY4NDdlM2FmNGUzZWRlODM3YmNjMDJhMWJlNmZhZWU2MjFkZjFhOGE0MDNjYmZcIiBdIH1cbiAqL1xuZXhwb3J0IHR5cGUgU3VpVHhSZWNlaXZlcnMgPSB7IFN1aVR4UmVjZWl2ZXJzOiBzdHJpbmdbXSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSByZWNlaXZlciBmb3IgQlRDIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IEJ0Y1R4UmVjZWl2ZXJzOiBbIFwiYmMxcTNxZGF2bDM3ZG5qNmhqdWF6ZHpkeGswYWFud2pzZzQ0bWd1cTY2XCIsIFwiYmMxcWZyanR4bThnMjBnOTdxemdhZGc3djlzM2Z0amtxMDJxZnNzazg3XCIgXSB9XG4gKi9cbmV4cG9ydCB0eXBlIEJ0Y1R4UmVjZWl2ZXJzID0geyBCdGNUeFJlY2VpdmVyczogc3RyaW5nW10gfTtcblxuLyoqIFRoZSBraW5kIG9mIGRlcG9zaXQgY29udHJhY3RzLiAqL1xuZXhwb3J0IGVudW0gRGVwb3NpdENvbnRyYWN0IHtcbiAgLyoqIENhbm9uaWNhbCBkZXBvc2l0IGNvbnRyYWN0ICovXG4gIENhbm9uaWNhbCxcbiAgLyoqIFdyYXBwZXIgZGVwb3NpdCBjb250cmFjdCAqL1xuICBXcmFwcGVyLFxufVxuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXQgPSBUeERlcG9zaXRCYXNlIHwgVHhEZXBvc2l0UHVia2V5IHwgVHhEZXBvc2l0Um9sZTtcblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0Ki9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdEJhc2UgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3QgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggZml4ZWQgdmFsaWRhdG9yIChwdWJrZXkpOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcHVia2V5OiBcIjg4NzkuLi44XCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFB1YmtleSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcHVia2V5OiBzdHJpbmcgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggYW55IHZhbGlkYXRvciBrZXkgaW4gYSByb2xlOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcm9sZV9pZDogXCJSb2xlI2M2My4uLmFmXCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFJvbGUgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHJvbGVfaWQ6IHN0cmluZyB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0IGluIHdlaS5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0ID0gVHhWYWx1ZUxpbWl0UGVyVHggfCBUeFZhbHVlTGltaXRXaW5kb3c7XG5cbi8qKlxuICogUmVzdHJpY3QgaW5kaXZpZHVhbCB0cmFuc2FjdGlvbiB2YWx1ZXMgdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQgaW4gd2VpLlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiBcIjB4MTJBMDVGMjAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXRQZXJUeCA9IHsgVHhWYWx1ZUxpbWl0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiB2YWx1ZXMsIGluIHdlaSwgb3ZlciBhIHRpbWUgd2luZG93LlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjB4MTJBMDVGMjAwXCIsIHdpbmRvdzogODY0MDAgfX1cbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjB4MTJBMDVGMjAwXCIsIHdpbmRvdzogNjA0ODAwLCBjaGFpbl9pZHM6IFsgXCIwMTIzNDVcIiBdIH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdFdpbmRvdyA9IHtcbiAgVHhWYWx1ZUxpbWl0OiB7XG4gICAgbGltaXQ6IHN0cmluZztcbiAgICB3aW5kb3c/OiBudW1iZXI7XG4gICAgY2hhaW5faWRzPzogc3RyaW5nW107XG4gIH07XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIG1heCBnYXMgY29zdHMgdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQgaW4gd2VpLlxuICpcbiAqIEBleGFtcGxlIHsgVHhHYXNDb3N0TGltaXQ6IFwiMHgyN0NBNTczNTdDMDAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBUeEdhc0Nvc3RMaW1pdCA9IHsgVHhHYXNDb3N0TGltaXQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IEVSQy0yMCBtZXRob2QgY2FsbHMgYWNjb3JkaW5nIHRvIHRoZSB7QGxpbmsgRXJjMjBQb2xpY3l9LlxuICogT25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMgdGhhdCBjYWxsIGEgdmFsaWQgRVJDLTIwIG1ldGhvZC5cbiAqIE5vbi1FUkMtMjAgdHJhbnNhY3Rpb25zIGFyZSBpZ25vcmVkIGJ5IHRoaXMgcG9saWN5LlxuICpcbiAqIEBleGFtcGxlIHsgSWZFcmMyMFR4OiB7IHRyYW5zZmVyX2xpbWl0czogW3sgbGltaXQ6IFwiMHhFOEQ0QTUxMDAwXCIgfV0gfSB9XG4gKiBAZXhhbXBsZSB7IElmRXJjMjBUeDogeyBhbGxvd2VkX2NvbnRyYWN0czogWyB7IGFkZHJlc3M6IFwiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDM0YTIwYjgwOTAwOGFmZWIwXCIsIFwiY2hhaW5faWRcIjogXCIxXCIgfSBdIH0gfVxuICovXG5leHBvcnQgdHlwZSBJZkVyYzIwVHggPSB7IElmRXJjMjBUeDogRXJjMjBQb2xpY3kgfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gb25seSBhbGxvdyB2YWxpZCBFUkMtMjAgbWV0aG9kIGNhbGxzLlxuICovXG5leHBvcnQgdHlwZSBBc3NlcnRFcmMyMFR4ID0gXCJBc3NlcnRFcmMyMFR4XCI7XG5cbi8qKlxuICogUmVzdHJpY3QgRVJDLTIwIGB0cmFuc2ZlcmAgYW5kIGB0cmFuc2ZlckZyb21gIHRyYW5zYWN0aW9uIHZhbHVlcyBhbmQgcmVjZWl2ZXJzLlxuICogT25seSBhcHBsaWVzIHRvIGNvbnRyYWN0cyBkZWZpbmVkIGluIGBhcHBsaWVzX3RvX2NvbnRyYWN0c2AsXG4gKiBvciB0byBhbGwgY29udHJhY3RzIGlmIG5vdCBkZWZpbmVkLlxuICogVGhlIGxpbWl0IGlzIGluIHRoZSB0b2tlbidzIHVuaXQuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwVHJhbnNmZXJMaW1pdCA9IHtcbiAgbGltaXQ/OiBzdHJpbmc7XG4gIHJlY2VpdmVycz86IHN0cmluZ1tdO1xuICBhcHBsaWVzX3RvX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgYGFwcHJvdmVgIHRyYW5zYWN0aW9uIHZhbHVlcyBhbmQgc3BlbmRlcnMuXG4gKiBPbmx5IGFwcGxpZXMgdG8gY29udHJhY3RzIGRlZmluZWQgaW4gYGFwcGxpZXNfdG9fY29udHJhY3RzYCxcbiAqIG9yIHRvIGFsbCBjb250cmFjdHMgaWYgbm90IGRlZmluZWQuXG4gKiBUaGUgbGltaXQgaXMgaW4gdGhlIHRva2VuJ3MgdW5pdC5cbiAqL1xuZXhwb3J0IHR5cGUgRXJjMjBBcHByb3ZlTGltaXQgPSB7XG4gIGxpbWl0Pzogc3RyaW5nO1xuICBzcGVuZGVycz86IHN0cmluZ1tdO1xuICBhcHBsaWVzX3RvX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdHMgRVJDLTIwIHBvbGljaWVzIHRvIGEgc2V0IG9mIGtub3duIGNvbnRyYWN0cyxcbiAqIGFuZCBjYW4gZGVmaW5lIGxpbWl0cyBvbiBgdHJhbnNmZXJgLCBgdHJhbnNmZXJGcm9tYCBhbmQgYGFwcHJvdmVgIG1ldGhvZCBjYWxscy5cbiAqL1xuZXhwb3J0IHR5cGUgRXJjMjBQb2xpY3kgPSB7XG4gIGFsbG93ZWRfY29udHJhY3RzPzogQ29udHJhY3RBZGRyZXNzW107XG4gIHRyYW5zZmVyX2xpbWl0cz86IEVyYzIwVHJhbnNmZXJMaW1pdFtdO1xuICBhcHByb3ZlX2xpbWl0cz86IEVyYzIwQXBwcm92ZUxpbWl0W107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBvbmx5IGFsbG93IGNhbGxpbmcgdGhlIGdpdmVuIG1ldGhvZHMgaW4gdGhlIGdpdmVuIGNvbnRyYWN0cy5cbiAqXG4gKiBAZXhhbXBsZSB7IEFzc2VydENvbnRyYWN0VHg6IHtcbiAqICAgYWxsb3dsaXN0OiBbe1xuICogICAgIGFkZHJlc3M6IHsgYWRkcmVzczogXCIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMzRhMjBiODA5MDA4YWZlYjBcIiwgXCJjaGFpbl9pZFwiOiBcIjFcIiB9LFxuICogICAgIG1ldGhvZHM6IFtcbiAqICAgICAgIFwiZnVuY3Rpb24gbmFtZSgpIHB1YmxpYyB2aWV3IHJldHVybnMgKHN0cmluZylcIixcbiAqICAgICAgIFwiZnVuY3Rpb24gdHJhbnNmZXIoYWRkcmVzcyB0bywgdWludDI1NiB2YWx1ZSkgcHVibGljIHJldHVybnMgKGJvb2wgc3VjY2VzcylcIlxuICogICAgIF1cbiAqICAgfV1cbiAqIH1cbiAqL1xuZXhwb3J0IHR5cGUgQXNzZXJ0Q29udHJhY3RUeCA9IHtcbiAgQXNzZXJ0Q29udHJhY3RUeDoge1xuICAgIGFsbG93bGlzdDoge1xuICAgICAgYWRkcmVzczogQ29udHJhY3RBZGRyZXNzO1xuICAgICAgbWV0aG9kczogc3RyaW5nW107XG4gICAgfVtdO1xuICB9O1xufTtcblxuLyoqXG4gKiBTb2xhbmEgYWRkcmVzcyBtYXRjaGVyLlxuICogQ2FuIGJlIGVpdGhlciB0aGUgcHVia2V5IG9mIHRoZSBhY2NvdW50IHVzaW5nIGJhc2U1OCBlbmNvZGluZyxcbiAqIG9yIHRoZSBpbmRleCBvZiB0aGUgcHVia2V5IG9mIGFuIGFkZHJlc3MgbG9va3VwIHRhYmxlIGFuZCB0aGVcbiAqIGluZGV4IG9mIHRoZSBhY2NvdW50IGluIHRoYXQgdGFibGUuXG4gKi9cbmV4cG9ydCB0eXBlIFNvbGFuYUFkZHJlc3NNYXRjaGVyID1cbiAgfCBzdHJpbmdcbiAgfCB7XG4gICAgICBhbHRfYWRkcmVzczogc3RyaW5nO1xuICAgICAgaW5kZXg6IG51bWJlcjtcbiAgICB9O1xuXG4vKipcbiAqIFNvbGFuYSBpbnN0cnVjdGlvbiBtYXRjaGVyLlxuICovXG5leHBvcnQgdHlwZSBTb2xhbmFJbnN0cnVjdGlvbk1hdGNoZXIgPSB7XG4gIHByb2dyYW1faWQ6IHN0cmluZztcbiAgaW5kZXg/OiBudW1iZXI7XG4gIGFjY291bnRzPzogKFxuICAgIHwge1xuICAgICAgICBhZGRyZXNzOiBTb2xhbmFBZGRyZXNzTWF0Y2hlciB8IFNvbGFuYUFkZHJlc3NNYXRjaGVyW107XG4gICAgICB9XG4gICAgfCAoe1xuICAgICAgICAvKiogQGRlcHJlY2F0ZWQgdXNlIGBhZGRyZXNzYCBpbnN0ZWFkLiAqL1xuICAgICAgICBwdWJrZXk6IHN0cmluZztcbiAgICAgIH0gJiB7XG4gICAgICAgIGluZGV4OiBudW1iZXI7XG4gICAgICB9KVxuICApW107XG4gIGRhdGE/OlxuICAgIHwgc3RyaW5nXG4gICAgfCB7XG4gICAgICAgIGRhdGE6IHN0cmluZztcbiAgICAgICAgc3RhcnRfaW5kZXg6IG51bWJlcjtcbiAgICAgIH1bXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3RzIFNvbGFuYSB0cmFuc2FjdGlvbiBpbnN0cnVjdGlvbnMuIENhbiBsaW1pdCB0aGUgbnVtYmVyIG9mIGluc3RydWN0aW9ucyxcbiAqIHRoZSBsaXN0IG9mIGFsbG93ZWQgaW5zdHJ1Y3Rpb25zLCBhbmQgYSBzZXQgb2YgcmVxdWlyZWQgaW5zdHJ1Y3Rpb25zIGluIGFsbCB0cmFuc2FjdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIFNvbGFuYUluc3RydWN0aW9uUG9saWN5ID0ge1xuICBTb2xhbmFJbnN0cnVjdGlvblBvbGljeToge1xuICAgIGNvdW50Pzoge1xuICAgICAgbWluPzogbnVtYmVyO1xuICAgICAgbWF4PzogbnVtYmVyO1xuICAgIH07XG4gICAgYWxsb3dsaXN0PzogU29sYW5hSW5zdHJ1Y3Rpb25NYXRjaGVyW107XG4gICAgcmVxdWlyZWQ/OiBTb2xhbmFJbnN0cnVjdGlvbk1hdGNoZXJbXTtcbiAgfTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHRvdGFsIHZhbHVlIHRyYW5zZmVycmVkIG91dCBvZiB0aGUgaW5wdXRzIGluIGEgQml0Y29pbiBTZWd3aXQgdHJhbnNhY3Rpb25cbiAqIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0LlxuICovXG5leHBvcnQgdHlwZSBCdGNTZWd3aXRWYWx1ZUxpbWl0ID0gQnRjU2Vnd2l0VmFsdWVMaW1pdFBlclR4IHwgQnRjU2Vnd2l0VmFsdWVMaW1pdFdpbmRvdztcblxuLyoqXG4gKiBSZXN0cmljdCBpbmRpdmlkdWFsIEJpdGNvaW4gU2Vnd2l0IHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93XG4gKiB0aGUgZ2l2ZW4gbGltaXQuXG4gKlxuICogQGV4YW1wbGUgeyBCdGNTZWd3aXRWYWx1ZUxpbWl0OiBcIjEwMDAwMDBcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIEJ0Y1NlZ3dpdFZhbHVlTGltaXRQZXJUeCA9IHtcbiAgQnRjU2Vnd2l0VmFsdWVMaW1pdDogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgdG90YWwgdmFsdWUgdHJhbnNmZXJyZWQgb3V0IG9mIHRoZSBpbnB1dHMgaW4gQml0Y29pbiBTZWd3aXQgdHJhbnNhY3Rpb25zXG4gKiBvdmVyIGEgdGltZSB3aW5kb3cuXG4gKlxuICogQGV4YW1wbGUgeyBCdGNTZWd3aXRWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjEwMDAwMDBcIiwgd2luZG93OiA4NjQwMCB9fVxuICovXG5leHBvcnQgdHlwZSBCdGNTZWd3aXRWYWx1ZUxpbWl0V2luZG93ID0ge1xuICBCdGNTZWd3aXRWYWx1ZUxpbWl0OiB7XG4gICAgbGltaXQ6IG51bWJlcjtcbiAgICB3aW5kb3c/OiBudW1iZXI7XG4gIH07XG59O1xuXG4vKipcbiAqIE9ubHkgYWxsb3cgY29ubmVjdGlvbnMgZnJvbSBjbGllbnRzIHdob3NlIElQIGFkZHJlc3NlcyBtYXRjaCBhbnkgb2YgdGhlc2UgSVB2NCBDSURSIGJsb2Nrcy5cbiAqXG4gKiBAZXhhbXBsZSB7IFNvdXJjZUlwQWxsb3dsaXN0OiBbIFwiMTIzLjQ1Ni43OC45LzE2XCIgXSB9XG4gKi9cbmV4cG9ydCB0eXBlIFNvdXJjZUlwQWxsb3dsaXN0ID0geyBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW10gfTtcblxuLyoqXG4gKiBNRkEgcG9saWN5XG4gKlxuICogQGV4YW1wbGUge1xuICoge1xuICogICBjb3VudDogMSxcbiAqICAgbnVtX2F1dGhfZmFjdG9yczogMSxcbiAqICAgYWxsb3dlZF9tZmFfdHlwZXM6IFsgXCJUb3RwXCIgXSxcbiAqICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiB9XG4gKi9cbmV4cG9ydCB0eXBlIE1mYVBvbGljeSA9IHtcbiAgY291bnQ/OiBudW1iZXI7XG4gIG51bV9hdXRoX2ZhY3RvcnM/OiBudW1iZXI7XG4gIGFsbG93ZWRfYXBwcm92ZXJzPzogc3RyaW5nW107XG4gIGFsbG93ZWRfbWZhX3R5cGVzPzogTWZhVHlwZVtdO1xuICByZXN0cmljdGVkX29wZXJhdGlvbnM/OiBPcGVyYXRpb25LaW5kW107XG4gIC8qKiBMaWZldGltZSBpbiBzZWNvbmRzLCBkZWZhdWx0cyB0byA5MDAgKDE1IG1pbnV0ZXMpICovXG4gIGxpZmV0aW1lPzogbnVtYmVyO1xuICAvKipcbiAgICogSG93IHRvIGNvbXBhcmUgSFRUUCByZXF1ZXN0cyB3aGVuIHZlcmlmeWluZyB0aGUgTUZBIHJlY2VpcHQuXG4gICAqIFRoaXMgc3BlY2lmaWVzIGhvdyB3ZSBjaGVjayBlcXVhbGl0eSBiZXR3ZWVuICgxKSB0aGUgSFRUUCByZXF1ZXN0IHdoZW4gdGhlIDIwMiAoTUZBIHJlcXVpcmVkKVxuICAgKiByZXNwb25zZSBpcyByZXR1cm5lZCBhbmQgKDIpIHRoZSBIVFRQIHJlcXVlc3Qgd2hlbiB0aGUgY29ycmVzcG9uZCBNRkEgcmVjZWlwdCBpcyB1c2VkLlxuICAgKi9cbiAgcmVxdWVzdF9jb21wYXJlcj86IEh0dHBSZXF1ZXN0Q29tcGFyZXI7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgaW4gc2Vjb25kcyBiZWZvcmUgYW4gTUZBIHJlY2VpcHQgY2FuIGJlIHJlZGVlbWVkLlxuICAgKiBEZWZhdWx0cyB0byAwLCBpLmUuLCBubyBkZWxheS4gQXBwcm92ZXJzIGNhbiB2b3RlIHRvIGFwcHJvdmUgb3IgdmV0b1xuICAgKiBiZWZvcmUgdGhlIGRlbGF5IGV4cGlyZXMuIEFmdGVyIGFwcHJvdmluZywgaXQgaXMgc3RpbGwgcG9zc2libGUgZm9yXG4gICAqIGFueW9uZSB0byB2ZXRvIHRoZSByZXF1ZXN0IHVudGlsIHRoZSBkZWxheSBleHBpcmVzIGFuZCB0aGUgcmVjZWlwdFxuICAgKiBpcyByZWRlZW1lZC5cbiAgICovXG4gIHRpbWVfZGVsYXk/OiBudW1iZXI7XG59O1xuXG5leHBvcnQgdHlwZSBIdHRwUmVxdWVzdENvbXBhcmVyID0gXCJFcVwiIHwgeyBFdm1UeDogRXZtVHhDbXAgfSB8IHsgU29sYW5hVHg6IFNvbGFuYVR4Q21wIH07XG5cbi8qKlxuICogUmVxdWlyZSBNRkEgZm9yIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7XG4gKiAgICAgUmVxdWlyZU1mYToge1xuICogICAgICAgY291bnQ6IDEsXG4gKiAgICAgICBhbGxvd2VkX21mYV90eXBlczogWyBcIlRvdHBcIiBdLFxuICogICAgICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiAgICAgICByZXN0cmljdGVkX29wZXJhdGlvbnM6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqL1xuZXhwb3J0IHR5cGUgUmVxdWlyZU1mYSA9IHtcbiAgUmVxdWlyZU1mYTogTWZhUG9saWN5O1xufTtcblxuLyoqXG4gKiBSZXF1aXJlIHRoYXQgdGhlIGtleSBpcyBhY2Nlc3NlZCB2aWEgYSByb2xlIHNlc3Npb24uXG4gKlxuICogQGV4YW1wbGUgeyBcIlJlcXVpcmVSb2xlU2Vzc2lvblwiOiBcIipcIiB9XG4gKiBAZXhhbXBsZSB7IFwiUmVxdWlyZVJvbGVTZXNzaW9uXCI6IFtcbiAqICAgXCJSb2xlIzM0ZGZiNjU0LWYzNmQtNDhlYS1iZGY2LTgzM2MwZDk0Yjc1OVwiLFxuICogICBcIlJvbGUjOThkODc2MzMtZDFhNy00NjEyLWI2YjQtYjJmYTJiNDNjZDNkXCJcbiAqIF19XG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVSb2xlU2Vzc2lvbiA9IHtcbiAgLyoqIFJlcXVpcmUgZWl0aGVyIGFueSByb2xlIHNlc3Npb24gb3IgYW55IG9uZSBvZiB0aGUgYXBwcm92ZWQgcm9sZXMgKi9cbiAgUmVxdWlyZVJvbGVTZXNzaW9uOiBcIipcIiB8IHN0cmluZ1tdO1xufTtcblxuLyoqXG4gKiBGb3J3YXJkcyB0aGUgcmVxdWVzdCBwYXJhbWV0ZXJzIHRvIHRoaXMgd2ViaG9vayB3aGljaCBkZXRlcm1pbmVzXG4gKiB3aGV0aGVyIHRoZSByZXF1ZXN0IGlzIGFsbG93ZWQgdG8gYmUgZXhlY3V0ZWQuXG4gKi9cbmV4cG9ydCB0eXBlIFdlYmhvb2tQb2xpY3kgPSB7XG4gIFdlYmhvb2s6IHtcbiAgICAvKiogVGhlIHVybCBvZiB0aGUgd2ViaG9vayAqL1xuICAgIHVybDogc3RyaW5nO1xuXG4gICAgLyoqIE9wdGlvbmFsIEhUVFAgbWV0aG9kIHRvIHVzZS4gRGVmYXVsdHMgdG8gUE9TVC4gKi9cbiAgICBtZXRob2Q/OiBzdHJpbmc7XG5cbiAgICAvKiogT3B0aW9uYWwgSFRUUCBoZWFkZXJzIHRvIHNldCAqL1xuICAgIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBleGVjdXRpb24gdGltZW91dCBpbiBzZWNvbmRzOyBtdXN0IGJlIGF0IGxlYXN0IDEgbm90IGV4Y2VlZCA1IHNlY29uZHMuXG4gICAgICogRGVmYXVsdHMgdG8gNS5cbiAgICAgKi9cbiAgICB0aW1lb3V0PzogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogQ3ViZVNpZ25lciBvcGVyYXRpb25zIHRvIHdoaWNoIHRoaXMgcG9saWN5IHNob3VsZCBhcHBseS5cbiAgICAgKiBXaGVuIG9taXR0ZWQsIGFwcGxpZXMgdG8gYWxsIG9wZXJhdGlvbnMuXG4gICAgICovXG4gICAgcmVzdHJpY3RlZF9vcGVyYXRpb25zPzogT3BlcmF0aW9uS2luZFtdO1xuICB9O1xufTtcblxuLyoqIEJhYnlsb24gc3Rha2luZyBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIEJhYnlsb25TdGFraW5nID0ge1xuICBCYWJ5bG9uU3Rha2luZzoge1xuICAgIC8qKlxuICAgICAqIFB1YmxpYyBrZXlzIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHN0YWtpbmcuIE11c3QgYmUgZGVmaW5lZCBpZiB0aGUgcG9saWN5IGlzIGJlaW5nIGFwcGxpZWRcbiAgICAgKiB0byBhIFNlZ1dpdCBrZXk7IG90aGVyd2lzZSwgaWYgYHVuZGVmaW5lZGAsIG9ubHkgdGhlIGtleSB0byB3aGljaCB0aGUgcG9saWN5IGlzIGJlaW5nXG4gICAgICogYXBwbGllZCBjYW4gYmUgdXNlZCBhcyB0aGUgc3Rha2luZyBwdWJsaWMga2V5IHdoZW4gY3JlYXRpbmcgQmFieWxvbi1yZWxhdGVkIHRyYW5zYWN0aW9ucy5cbiAgICAgKlxuICAgICAqIEhleC1lbmNvZGVkIHB1YmxpYyBrZXlzLCBXSVRIT1VUIHRoZSBsZWFkaW5nICcweCcuXG4gICAgICovXG4gICAgYWxsb3dlZF9zdGFrZXJfcGtzPzogc3RyaW5nW107XG5cbiAgICAvKipcbiAgICAgKiBGaW5hbGl0eSBwcm92aWRlcnMgdGhhdCBjYW4gYmUgdXNlZCBmb3Igc3Rha2luZy4gSWYgYHVuZGVmaW5lZGAsIGFueSBmaW5hbGl0eVxuICAgICAqIHByb3ZpZGVyIGNhbiBiZSB1c2VkLlxuICAgICAqXG4gICAgICogSGV4LWVuY29kZWQgcHVibGljIGtleXMsIFdJVEhPVVQgdGhlIGxlYWRpbmcgJzB4Jy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX2ZpbmFsaXR5X3Byb3ZpZGVyX3Brcz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIGFkZHJlc3NlcyB0aGF0IGNhbiBiZSB1c2VkIGluIHN0YWtpbmcgdHJhbnNhY3Rpb25zLiBJZiBgdW5kZWZpbmVkYCwgb25seVxuICAgICAqIHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkIGNhbiBiZSB1c2VkIGFzIHRoZSBjaGFuZ2UgYWRkcmVzcy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX2NoYW5nZV9hZGRycz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogV2l0aGRyYXdhbCBhZGRyZXNzZXMgdGhhdCBjYW4gYmUgdXNlZCBpbiB3aXRoZHJhd2FsIHR4bnMuIElmIGB1bmRlZmluZWRgLCBvbmx5XG4gICAgICogdGhlIGtleSB0byB3aGljaCB0aGUgcG9saWN5IGlzIGJlaW5nIGFwcGxpZWQgY2FuIGJlIHVzZWQgYXMgdGhlIHdpdGhkcmF3YWwgYWRkcmVzcy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX3dpdGhkcmF3YWxfYWRkcnM/OiBzdHJpbmdbXTtcblxuICAgIC8qKiBCYWJ5bG9uIG5ldHdvcmtzIHRoYXQgdGhpcyBrZXkgY2FuIGJlIHVzZWQgd2l0aC4gSWYgYHVuZGVmaW5lZGAsIGFueSBuZXR3b3JrLiAqL1xuICAgIGFsbG93ZWRfbmV0d29ya19pZHM/OiBCYWJ5bG9uU3Rha2luZ1JlcXVlc3RbXCJuZXR3b3JrXCJdW107XG5cbiAgICAvKipcbiAgICAgKiBNYXggZmVlIGFsbG93ZWQgaW4gYSBzdGFraW5nIG9yIHdpdGhkcmF3YWwgdHhuLiBJZiBgdW5kZWZpbmVkYCwgdGhlcmUgaXMgbm8gZmVlIGxpbWl0LlxuICAgICAqIE5vdGUgdGhhdCB0aGUgZmVlIGZvciB2b2x1bnRhcnkgdW5ib25kaW5nIGFuZCBzbGFzaGluZyBhcmUgZml4ZWQgYnkgdGhlIEJhYnlsb25cbiAgICAgKiBwYXJhbXMsIGFuZCB0aGlzIGxpbWl0IGlzIG5vdCBlbmZvcmNlZCBpbiB0aG9zZSBjYXNlcy5cbiAgICAgKi9cbiAgICBtYXhfZmVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbiBzdGFraW5nIHRpbWUgaW4gc2Vjb25kcy4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWluX2xvY2tfdGltZT86IG51bWJlcjtcblxuICAgIC8qKiBNYXggc3Rha2luZyB0aW1lIGluIHNlY29uZHMuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1heF9sb2NrX3RpbWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWluIHN0YWtpbmcgYW1vdW50IGluIFNBVC4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWluX3N0YWtpbmdfdmFsdWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4IHN0YWtpbmcgYW1vdW50IGluIFNBVC4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWF4X3N0YWtpbmdfdmFsdWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWluaW11bSBuZXR3b3JrIHBhcmFtZXRlcnMgdmVyc2lvbiBhbGxvd2VkLiAqL1xuICAgIG1pbl9wYXJhbXNfdmVyc2lvbj86IG51bWJlcjtcblxuICAgIC8qKiBNYXhpbXVtIG5ldHdvcmsgcGFyYW1ldGVycyB2ZXJzaW9uIGFsbG93ZWQuICovXG4gICAgbWF4X3BhcmFtc192ZXJzaW9uPzogbnVtYmVyO1xuICB9O1xufTtcblxuLyoqIEFsbG93IHJhdyBibG9iIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gdHlwZW9mIEFsbG93UmF3QmxvYlNpZ25pbmc7XG5cbi8qKiBBbGxvdyBFSVAtMTkxIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0VpcDE5MVNpZ25pbmcgPSBcIkFsbG93RWlwMTkxU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dFaXAxOTFTaWduaW5nID0gdHlwZW9mIEFsbG93RWlwMTkxU2lnbmluZztcblxuLyoqIEFsbG93IEVJUC03MTIgc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RWlwNzEyU2lnbmluZyA9IFwiQWxsb3dFaXA3MTJTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0VpcDcxMlNpZ25pbmcgPSB0eXBlb2YgQWxsb3dFaXA3MTJTaWduaW5nO1xuXG4vKiogQWxsb3cgQlRDIG1lc3NhZ2Ugc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93QnRjTWVzc2FnZVNpZ25pbmcgPSBcIkFsbG93QnRjTWVzc2FnZVNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93QnRjTWVzc2FnZVNpZ25pbmcgPSB0eXBlb2YgQWxsb3dCdGNNZXNzYWdlU2lnbmluZztcblxuLyoqIEEgcmVmZXJlbmNlIHRvIGFuIG9yZy1sZXZlbCBuYW1lZCBwb2xpY3kgYW5kIGl0cyB2ZXJzaW9uICovXG5leHBvcnQgdHlwZSBQb2xpY3lSZWZlcmVuY2UgPSBgJHtzdHJpbmd9L3Yke251bWJlcn1gIHwgYCR7c3RyaW5nfS9sYXRlc3RgO1xuXG4vKiogS2V5IHBvbGljaWVzIHRoYXQgcmVzdHJpY3QgdGhlIHJlcXVlc3RzIHRoYXQgdGhlIHNpZ25pbmcgZW5kcG9pbnRzIGFjY2VwdCAqL1xuZXhwb3J0IHR5cGUgS2V5RGVueVBvbGljeSA9XG4gIHwgVHhSZWNlaXZlclxuICB8IFR4RGVwb3NpdFxuICB8IFR4VmFsdWVMaW1pdFxuICB8IFR4R2FzQ29zdExpbWl0XG4gIHwgSWZFcmMyMFR4XG4gIHwgQXNzZXJ0RXJjMjBUeFxuICB8IEFzc2VydENvbnRyYWN0VHhcbiAgfCBTdWlUeFJlY2VpdmVyc1xuICB8IEJ0Y1R4UmVjZWl2ZXJzXG4gIHwgU291cmNlSXBBbGxvd2xpc3RcbiAgfCBTb2xhbmFJbnN0cnVjdGlvblBvbGljeVxuICB8IEJ0Y1NlZ3dpdFZhbHVlTGltaXRcbiAgfCBSZXF1aXJlTWZhXG4gIHwgUmVxdWlyZVJvbGVTZXNzaW9uXG4gIHwgQmFieWxvblN0YWtpbmdcbiAgfCBXZWJob29rUG9saWN5O1xuXG4vKipcbiAqIEtleSBwb2xpY3lcbiAqXG4gKiBAZXhhbXBsZSBbXG4gKiAgIHtcbiAqICAgICBcIlR4UmVjZWl2ZXJcIjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIlxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJUeERlcG9zaXRcIjoge1xuICogICAgICAgXCJraW5kXCI6IFwiQ2Fub25pY2FsXCJcbiAqICAgICB9XG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlJlcXVpcmVNZmFcIjoge1xuICogICAgICAgXCJjb3VudFwiOiAxLFxuICogICAgICAgXCJhbGxvd2VkX21mYV90eXBlc1wiOiBbXCJDdWJlU2lnbmVyXCJdLFxuICogICAgICAgXCJyZXN0cmljdGVkX29wZXJhdGlvbnNcIjogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICogXVxuICpcbiAqIEBleGFtcGxlIFtcIkFzc2VydEVyYzIwVHhcIiwgeyBcIklmRXJjMjBUeFwiOiBcInRyYW5zZmVyX2xpbWl0c1wiOiBbIHsgXCJsaW1pdFwiOiBcIjB4M0I5QUNBMDBcIiB9IF0gfV1cbiAqL1xuZXhwb3J0IHR5cGUgS2V5UG9saWN5ID0gS2V5UG9saWN5UnVsZVtdO1xuXG5leHBvcnQgdHlwZSBLZXlQb2xpY3lSdWxlID1cbiAgfCBLZXlEZW55UG9saWN5XG4gIHwgQWxsb3dSYXdCbG9iU2lnbmluZ1xuICB8IEFsbG93RWlwMTkxU2lnbmluZ1xuICB8IEFsbG93RWlwNzEyU2lnbmluZ1xuICB8IEFsbG93QnRjTWVzc2FnZVNpZ25pbmdcbiAgfCBQb2xpY3lSZWZlcmVuY2U7XG5cbi8qKiBSb2xlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgUm9sZVBvbGljeSA9IFJvbGVQb2xpY3lSdWxlW107XG5cbmV4cG9ydCB0eXBlIFJvbGVQb2xpY3lSdWxlID0gS2V5RGVueVBvbGljeSB8IFBvbGljeVJlZmVyZW5jZTtcblxuLyoqIEEga2V5IGd1YXJkZWQgYnkgYSBwb2xpY3kuICovXG5leHBvcnQgY2xhc3MgS2V5V2l0aFBvbGljaWVzIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSByb2xlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkga2V5SWQ6IHN0cmluZztcbiAgLyoqIFRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIGtleS9wb2xpY2llcyAqL1xuICAjY2FjaGVkOiBLZXlXaXRoUG9saWNpZXNJbmZvO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgY2FjaGVkIGluZm9ybWF0aW9uICovXG4gIGdldCBjYWNoZWQoKTogS2V5V2l0aFBvbGljaWVzSW5mbyB7XG4gICAgcmV0dXJuIHRoaXMuI2NhY2hlZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgY2FjaGVkIHBvbGljeSAqL1xuICBnZXQgcG9saWN5KCk6IEtleVBvbGljeSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkLnBvbGljeSBhcyBLZXlQb2xpY3kgfCB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGtleSAqL1xuICBhc3luYyBnZXRLZXkoKTogUHJvbWlzZTxLZXk+IHtcbiAgICBpZiAodGhpcy4jY2FjaGVkLmtleV9pbmZvID09PSB1bmRlZmluZWQgfHwgdGhpcy4jY2FjaGVkLmtleV9pbmZvID09PSBudWxsKSB7XG4gICAgICB0aGlzLiNjYWNoZWQgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleUdldCh0aGlzLnJvbGVJZCwgdGhpcy5rZXlJZCwgeyBkZXRhaWxzOiB0cnVlIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIHRoaXMuI2NhY2hlZC5rZXlfaW5mbyEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGtleVdpdGhQb2xpY2llcyBUaGUga2V5IGFuZCBpdHMgcG9saWNpZXNcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwga2V5V2l0aFBvbGljaWVzOiBLZXlXaXRoUG9saWNpZXNJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMucm9sZUlkID0ga2V5V2l0aFBvbGljaWVzLnJvbGVfaWQ7XG4gICAgdGhpcy5rZXlJZCA9IGtleVdpdGhQb2xpY2llcy5rZXlfaWQ7XG4gICAgdGhpcy4jY2FjaGVkID0ga2V5V2l0aFBvbGljaWVzO1xuICB9XG59XG5cbi8qKiBSb2xlcy4gKi9cbmV4cG9ydCBjbGFzcyBSb2xlIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAvKiogVGhlIHJvbGUgaW5mb3JtYXRpb24gKi9cbiAgI2RhdGE6IFJvbGVJbmZvO1xuXG4gIC8qKiBAcmV0dXJucyBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgcm9sZSAqL1xuICBnZXQgbmFtZSgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICpcbiAgICogQGV4YW1wbGUgUm9sZSNiZmUzZWNjYi03MzFlLTQzMGQtYjFlNS1hYzEzNjNlNmIwNmJcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLnJvbGVfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgdGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgcm9sZS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzXG4gICAqIHJlZmxlY3QgdGhlIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmdcbiAgICogYFJvbGUuZW5hYmxlZCgpYCBvciBgUm9sZS5kaXNhYmxlKClgKS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogUm9sZUluZm8ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICovXG4gIGFzeW5jIGRlbGV0ZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVEZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKiogQHJldHVybnMgV2hldGhlciB0aGUgcm9sZSBpcyBlbmFibGVkICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGVuYWJsZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGRpc2FibGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIHJvbGUpXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBSb2xlUG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgdG8gZXhpc3Rpbmcgcm9sZSBwb2xpY3kuIFRoaXMgYXBwZW5kIGlzIG5vdCBhdG9taWMtLS1pdCB1c2VzXG4gICAqIHtAbGluayBwb2xpY3l9IHRvIGZldGNoIHRoZSBjdXJyZW50IHBvbGljeSBhbmQgdGhlbiB7QGxpbmsgc2V0UG9saWN5fVxuICAgKiB0byBzZXQgdGhlIHBvbGljeS0tLWFuZCBzaG91bGQgbm90IGJlIHVzZWQgaW4gYWNyb3NzIGNvbmN1cnJlbnQgc2Vzc2lvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIHBvbGljeSB0byBhcHBlbmQgdG8gdGhlIGV4aXN0aW5nIG9uZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGFwcGVuZFBvbGljeShwb2xpY3k6IFJvbGVQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBmb3IgdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcmVzdHJpY3RlZCBhY3Rpb25zIG9uIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVzdHJpY3RlZEFjdGlvbnMgVGhlIG1hcCBvZiByZXN0cmljdGVkIGFjdGlvbnNcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFJlc3RyaWN0ZWRBY3Rpb25zKHJlc3RyaWN0ZWRBY3Rpb25zOiBSZXN0cmljdGVkQWN0aW9uc01hcCwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgY29uc3QgcmVzdHJpY3RlZF9hY3Rpb25zID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgT2JqZWN0LmVudHJpZXMocmVzdHJpY3RlZEFjdGlvbnMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBba2V5LnRvU3RyaW5nKCksIHZhbHVlXSksXG4gICAgKTtcblxuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcmVzdHJpY3RlZF9hY3Rpb25zIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGFsbCB1c2VycyB3aXRoIGFjY2VzcyB0byB0aGUgcm9sZS5cbiAgICpcbiAgICogQGV4YW1wbGUgW1xuICAgKiAgIFwiVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcIixcbiAgICogICBcIlVzZXIjNTU5M2MyNWItNTJlMi00ZmI1LWIzOWItOTZkNDFkNjgxZDgyXCJcbiAgICogXVxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgdXNlcnMuXG4gICAqL1xuICBhc3luYyB1c2VycyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiAodXNlcnMgfHwgW10pLm1hcCgodSkgPT4gdS51c2VyX2lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIGFkZFVzZXIodXNlcklkOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJBZGQodGhpcy5pZCwgdXNlcklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3RpbmcgdXNlciBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyByZW1vdmVVc2VyKHVzZXJJZDogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVc2VyUmVtb3ZlKHRoaXMuaWQsIHVzZXJJZCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2Yga2V5cyBpbiB0aGUgcm9sZS5cbiAgICpcbiAgICogQGV4YW1wbGUgW1xuICAgKiAgICB7XG4gICAqICAgICBpZDogXCJLZXkjYmZlM2VjY2ItNzMxZS00MzBkLWIxZTUtYWMxMzYzZTZiMDZiXCIsXG4gICAqICAgICBwb2xpY3k6IHsgVHhSZWNlaXZlcjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIiB9XG4gICAqICAgIH0sXG4gICAqICBdXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBrZXlzIGluIHRoaXMgcm9sZS5cbiAgICovXG4gIGFzeW5jIGtleXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXNbXT4ge1xuICAgIGNvbnN0IGtleXNJblJvbGUgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleXNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIGtleXNJblJvbGUubWFwKChrKSA9PiBuZXcgS2V5V2l0aFBvbGljaWVzKHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBpbiB0aGUgcm9sZSBieSBpdHMgSUQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgSUQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgZm9yIGdldHRpbmcgdGhlIGtleS5cbiAgICogQHJldHVybnMgVGhlIGtleSB3aXRoIGl0cyBwb2xpY2llcy5cbiAgICovXG4gIGFzeW5jIGdldEtleShrZXlJZDogc3RyaW5nLCBvcHRzPzogR2V0Um9sZUtleU9wdGlvbnMpOiBQcm9taXNlPEtleVdpdGhQb2xpY2llcz4ge1xuICAgIGNvbnN0IGt3cCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5R2V0KHRoaXMuaWQsIGtleUlkLCBvcHRzKTtcbiAgICByZXR1cm4gbmV3IEtleVdpdGhQb2xpY2llcyh0aGlzLiNhcGlDbGllbnQsIGt3cCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbGlzdCBvZiBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlzIFRoZSBsaXN0IG9mIGtleXMgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgQ3ViZVNpZ25lciByZXNwb25zZSBpbmRpY2F0aW5nIHN1Y2Nlc3Mgb3IgZmFpbHVyZS5cbiAgICovXG4gIGFzeW5jIGFkZEtleXMoa2V5czogS2V5W10sIHBvbGljeT86IEtleVBvbGljeSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleXNBZGQoXG4gICAgICB0aGlzLmlkLFxuICAgICAga2V5cy5tYXAoKGspID0+IGsuaWQpLFxuICAgICAgcG9saWN5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGV4aXN0aW5nIGtleSB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gdGhlIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgQSBDdWJlU2lnbmVyIHJlc3BvbnNlIGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlLlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5KGtleTogS2V5LCBwb2xpY3k/OiBLZXlQb2xpY3kpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hZGRLZXlzKFtrZXldLCBwb2xpY3kpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgQ3ViZVNpZ25lciByZXNwb25zZSBpbmRpY2F0aW5nIHN1Y2Nlc3Mgb3IgZmFpbHVyZS5cbiAgICovXG4gIGFzeW5jIHJlbW92ZUtleShrZXk6IEtleSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleXNSZW1vdmUodGhpcy5pZCwga2V5LmlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2Vzc2lvbiBmb3IgdGhpcyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcHVycG9zZSBEZXNjcmlwdGl2ZSBwdXJwb3NlLlxuICAgKiBAcGFyYW0gbGlmZXRpbWVzIE9wdGlvbmFsIHNlc3Npb24gbGlmZXRpbWVzLlxuICAgKiBAcGFyYW0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLiBPbmx5IGBzaWduOipgIHNjb3BlcyBhcmUgYWxsb3dlZC5cbiAgICogQHJldHVybnMgTmV3IHNlc3Npb24uXG4gICAqL1xuICBhc3luYyBjcmVhdGVTZXNzaW9uKFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICBsaWZldGltZXM/OiBTZXNzaW9uTGlmZXRpbWUsXG4gICAgc2NvcGVzPzogU2NvcGVbXSxcbiAgKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUZvclJvbGUodGhpcy5pZCwgcHVycG9zZSwgc2NvcGVzLCBsaWZldGltZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLiBSZXR1cm5lZCBvYmplY3RzIGNhbiBiZSB1c2VkIHRvXG4gICAqIHJldm9rZSBpbmRpdmlkdWFsIHNlc3Npb25zLCBidXQgdGhleSBjYW5ub3QgYmUgdXNlZCBmb3IgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBzZXNzaW9ucy5cbiAgICogQHJldHVybnMgU2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuXG4gICAqL1xuICBhc3luYyBzZXNzaW9ucyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPFNpZ25lclNlc3Npb25JbmZvW10+IHtcbiAgICBjb25zdCBzZXNzaW9ucyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uc0xpc3QoeyByb2xlOiB0aGlzLmlkIH0sIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIHNlc3Npb25zLm1hcCgodCkgPT4gbmV3IFNpZ25lclNlc3Npb25JbmZvKHRoaXMuI2FwaUNsaWVudCwgdC5zZXNzaW9uX2lkLCB0LnB1cnBvc2UpKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogUm9sZUluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZShyZXF1ZXN0OiBVcGRhdGVSb2xlUmVxdWVzdCwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0LCBtZmFSZWNlaXB0KTtcbiAgICB0aGlzLiNkYXRhID0gcmVzcC5kYXRhKCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHRoaXMuaWQpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG59XG4iXX0=