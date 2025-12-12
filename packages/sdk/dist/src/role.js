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
exports.Role = exports.KeyWithPolicies = exports.AllowBtcMessageSigning = exports.AllowEip712Signing = exports.AllowEip191Signing = exports.AllowDiffieHellmanExchange = exports.AllowRawBlobSigning = exports.DepositContract = void 0;
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
/** Allow Diffie-Hellman exchange */
exports.AllowDiffieHellmanExchange = "AllowDiffieHellmanExchange";
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
     * to set the policy---and should not be used across concurrent sessions.
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
     * Set new edit policy (overwriting any edit policies previously set for this role)
     *
     * @param editPolicy The new edit policy to set
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    async setEditPolicy(editPolicy, mfaReceipt) {
        await this.update({ edit_policy: editPolicy }, mfaReceipt);
    }
    /**
     * Get the edit policy for the role.
     *
     * @returns The edit policy for the role, undefined if there is no edit policy
     */
    async editPolicy() {
        const data = await this.fetch();
        return data.edit_policy;
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
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns an empty response, or a response that can be used to approve MFA if needed.
     */
    async addUser(userId, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUserAdd(this.id, userId, mfaReceipt);
    }
    /**
     * Remove an existing user from an existing role.
     *
     * @param userId The user-id of the user to remove from the role.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns an empty response, or a response that can be used to approve MFA if needed.
     */
    async removeUser(userId, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUserRemove(this.id, userId, mfaReceipt);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQXNCQSx3QkFBMkM7QUEyQjNDLHFDQUFxQztBQUNyQyxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLCtCQUFmLGVBQWUsUUFLMUI7QUE2WkQsNkJBQTZCO0FBQ2hCLFFBQUEsbUJBQW1CLEdBQUcscUJBQThCLENBQUM7QUFHbEUsb0NBQW9DO0FBQ3ZCLFFBQUEsMEJBQTBCLEdBQUcsNEJBQXFDLENBQUM7QUFHaEYsNEJBQTRCO0FBQ2YsUUFBQSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSw0QkFBNEI7QUFDZixRQUFBLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBR2hFLGdDQUFnQztBQUNuQixRQUFBLHNCQUFzQixHQUFHLHdCQUFpQyxDQUFDO0FBb0V4RSxpQ0FBaUM7QUFDakMsTUFBYSxlQUFlO0lBTzFCLHNDQUFzQztJQUN0QyxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksK0JBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUErQixDQUFDO0lBQ3JELENBQUM7SUFFRCx1QkFBdUI7SUFDdkIsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssU0FBUyxJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDMUUsdUJBQUEsSUFBSSwyQkFBVyxNQUFNLHVCQUFBLElBQUksa0NBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFB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RTdFOzs7Ozs7T0FNRztJQUNILFlBQVksU0FBb0IsRUFBRSxJQUFjO1FBdlJ2QyxrQ0FBc0I7UUFDL0IsMkJBQTJCO1FBQzNCLDZCQUFnQjtRQXNSZCx1QkFBQSxJQUFJLG1CQUFjLFNBQVMsTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUksY0FBUyxJQUFJLE1BQUEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNLLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBMEIsRUFBRSxVQUF3QjtRQUN2RSxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksdUJBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUUsdUJBQUEsSUFBSSxjQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBQSxDQUFDO1FBQ3pCLE9BQU8sdUJBQUEsSUFBSSxrQkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNLLEtBQUssQ0FBQyxLQUFLO1FBQ2pCLHVCQUFBLElBQUksY0FBUyxNQUFNLHVCQUFBLElBQUksdUJBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFBLENBQUM7UUFDcEQsT0FBTyx1QkFBQSxJQUFJLGtCQUFNLENBQUM7SUFDcEIsQ0FBQztDQUNGO0FBclRELG9CQXFUQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQXBpQ2xpZW50LFxuICBDb250cmFjdEFkZHJlc3MsXG4gIEV2bVR4Q21wLFxuICBTb2xhbmFUeENtcCxcbiAgS2V5V2l0aFBvbGljaWVzSW5mbyxcbiAgTWZhVHlwZSxcbiAgUGFnZU9wdHMsXG4gIFJvbGVJbmZvLFxuICBTY29wZSxcbiAgU2Vzc2lvbkRhdGEsXG4gIFNlc3Npb25MaWZldGltZSxcbiAgVXBkYXRlUm9sZVJlcXVlc3QsXG4gIEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgT3BlcmF0aW9uS2luZCxcbiAgTWZhUmVjZWlwdHMsXG4gIEN1YmVTaWduZXJSZXNwb25zZSxcbiAgRW1wdHksXG4gIFJlc3RyaWN0ZWRBY3Rpb25zTWFwLFxuICBHZXRSb2xlS2V5T3B0aW9ucyxcbiAgRWRpdFBvbGljeSxcbn0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEtleSwgU2lnbmVyU2Vzc2lvbkluZm8gfSBmcm9tIFwiLlwiO1xuXG50eXBlIE5hbWVPckFkZHJlc3NPck51bGwgPSBzdHJpbmcgfCBudWxsO1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSByZWNlaXZlciBmb3IgRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICogQGV4YW1wbGUgeyBUeFJlY2VpdmVyOiBudWxsIH1cbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogW251bGwsIFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCJdIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhSZWNlaXZlciA9IHsgVHhSZWNlaXZlcjogTmFtZU9yQWRkcmVzc09yTnVsbCB8IE5hbWVPckFkZHJlc3NPck51bGxbXSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSByZWNlaXZlciBmb3IgU1VJIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFN1aVR4UmVjZWl2ZXI6IFsgXCIweGM5ODM3YTBhZDJkMTE0NjhiYmY4NDdlM2FmNGUzZWRlODM3YmNjMDJhMWJlNmZhZWU2MjFkZjFhOGE0MDNjYmZcIiBdIH1cbiAqL1xuZXhwb3J0IHR5cGUgU3VpVHhSZWNlaXZlcnMgPSB7IFN1aVR4UmVjZWl2ZXJzOiBzdHJpbmdbXSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSByZWNlaXZlciBmb3IgQlRDIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IEJ0Y1R4UmVjZWl2ZXJzOiBbIFwiYmMxcTNxZGF2bDM3ZG5qNmhqdWF6ZHpkeGswYWFud2pzZzQ0bWd1cTY2XCIsIFwiYmMxcWZyanR4bThnMjBnOTdxemdhZGc3djlzM2Z0amtxMDJxZnNzazg3XCIgXSB9XG4gKi9cbmV4cG9ydCB0eXBlIEJ0Y1R4UmVjZWl2ZXJzID0geyBCdGNUeFJlY2VpdmVyczogc3RyaW5nW10gfTtcblxuLyoqIFRoZSBraW5kIG9mIGRlcG9zaXQgY29udHJhY3RzLiAqL1xuZXhwb3J0IGVudW0gRGVwb3NpdENvbnRyYWN0IHtcbiAgLyoqIENhbm9uaWNhbCBkZXBvc2l0IGNvbnRyYWN0ICovXG4gIENhbm9uaWNhbCxcbiAgLyoqIFdyYXBwZXIgZGVwb3NpdCBjb250cmFjdCAqL1xuICBXcmFwcGVyLFxufVxuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXQgPSBUeERlcG9zaXRCYXNlIHwgVHhEZXBvc2l0UHVia2V5IHwgVHhEZXBvc2l0Um9sZTtcblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0Ki9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdEJhc2UgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3QgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggZml4ZWQgdmFsaWRhdG9yIChwdWJrZXkpOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcHVia2V5OiBcIjg4NzkuLi44XCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFB1YmtleSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcHVia2V5OiBzdHJpbmcgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggYW55IHZhbGlkYXRvciBrZXkgaW4gYSByb2xlOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcm9sZV9pZDogXCJSb2xlI2M2My4uLmFmXCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFJvbGUgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHJvbGVfaWQ6IHN0cmluZyB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0IGluIHdlaS5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0ID0gVHhWYWx1ZUxpbWl0UGVyVHggfCBUeFZhbHVlTGltaXRXaW5kb3c7XG5cbi8qKlxuICogUmVzdHJpY3QgaW5kaXZpZHVhbCB0cmFuc2FjdGlvbiB2YWx1ZXMgdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQgaW4gd2VpLlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiBcIjB4MTJBMDVGMjAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXRQZXJUeCA9IHsgVHhWYWx1ZUxpbWl0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiB2YWx1ZXMsIGluIHdlaSwgb3ZlciBhIHRpbWUgd2luZG93LlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjB4MTJBMDVGMjAwXCIsIHdpbmRvdzogODY0MDAgfX1cbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjB4MTJBMDVGMjAwXCIsIHdpbmRvdzogNjA0ODAwLCBjaGFpbl9pZHM6IFsgXCIxXCIsIFwiNVwiIF0gfX1cbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjB4MTJBMDVGMjAwXCIsIHdpbmRvdzogNjA0ODAwLCBleGNlcHRfY2hhaW5faWRzOiBbIFwiMVwiIF0gfX1cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0V2luZG93ID0ge1xuICBUeFZhbHVlTGltaXQ6IHtcbiAgICAvKipcbiAgICAgKiBNYXggYWxsb3dlZCB2YWx1ZSBpbiB3ZWlcbiAgICAgKi9cbiAgICBsaW1pdDogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIE9wdGlvbmFsIHNsaWRpbmcgdGltZSB3aW5kb3cgKGluIHNlY29uZHMpLlxuICAgICAqXG4gICAgICogSWYgc3BlY2lmaWVkLCB0aGUgYGxpbWl0YCBhcHBsaWVzIHRvIHRoZSBhZ2dyZWdhdGUgdmFsdWUgb2YgYWxsIHRyYW5zYWN0aW9ucyB3aXRoaW4gdGhhdFxuICAgICAqIHRpbWUgd2luZG93OyBvdGhlcndpc2UsIHRoZSB3aW5kb3cgaXMgMCwgaS5lLiwgdGhlIGxpbWl0IGFwcGxpZXMgdG8gaW5kaXZpZHVhbCB0cmFuc2FjdGlvbnMuXG4gICAgICovXG4gICAgd2luZG93PzogbnVtYmVyO1xuICAgIC8qKlxuICAgICAqIE9wdGlvbmFsIGNoYWluIGlkcy5cbiAgICAgKlxuICAgICAqIElmIHNwZWNpZmllZCwgdGhlIHBvbGljeSBhcHBsaWVzIG9ubHkgaWYgYSB0cmFuc2FjdGlvbiBpcyBvbiBvbmUgb2YgdGhlXG4gICAgICogZ2l2ZW4gY2hhaW5zIChvdGhlcndpc2UgaXQgYXBwbGllcyB0byBhbGwgdHJhbnNhY3Rpb25zKS4gSWYgYSAnd2luZG93JyBpc1xuICAgICAqIGFsc28gZGVmaW5lZCwgdGhlIHBvbGljeSBsaW1pdCBhcHBsaWVzIGN1bXVsYXRpdmVseSBhY3Jvc3MgYWxsIHNwZWNpZmllZCBjaGFpbnMuXG4gICAgICpcbiAgICAgKiBNdXN0IG5vdCBiZSBzcGVjaWZpZWQgdG9nZXRoZXIgd2l0aCBgZXhjZXB0X2NoYWluX2lkc2AuXG4gICAgICovXG4gICAgY2hhaW5faWRzPzogc3RyaW5nW107XG4gICAgLyoqXG4gICAgICogT3B0aW9uYWwgY2hhaW4gaWRzIHRvIGV4Y2x1ZGUuXG4gICAgICpcbiAgICAgKiBJZiBzcGVjaWZpZWQsIHRoZSBwb2xpY3kgYXBwbGllcyBvbmx5IGlmIGEgdHJhbnNhY3Rpb24gaXMgb24gYSBjaGFpbiBpZCBub3RcbiAgICAgKiBpbmNsdWRlZCBpbiB0aGlzIGxpc3QuIElmIGEgJ3dpbmRvdycgaXMgYWxzbyBkZWZpbmVkLCB0aGUgcG9saWN5IGxpbWl0IGFwcGxpZXNcbiAgICAgKiBjdW11bGF0aXZlbHkgYWNyb3NzIGFsbCBjaGFpbnMgb3RoZXIgdGhhbiB0aGUgbGlzdGVkIG9uZXMuXG4gICAgICpcbiAgICAgKiBNdXN0IG5vdCBiZSBzcGVjaWZpZWQgdG9nZXRoZXIgd2l0aCBgY2hhaW5faWRzYC5cbiAgICAgKi9cbiAgICBleGNlcHRfY2hhaW5faWRzPzogc3RyaW5nW107XG4gIH07XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIG1heCBnYXMgY29zdHMgdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQgaW4gd2VpLlxuICpcbiAqIEBleGFtcGxlIHsgVHhHYXNDb3N0TGltaXQ6IFwiMHgyN0NBNTczNTdDMDAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBUeEdhc0Nvc3RMaW1pdCA9IHsgVHhHYXNDb3N0TGltaXQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IEVSQy0yMCBtZXRob2QgY2FsbHMgYWNjb3JkaW5nIHRvIHRoZSB7QGxpbmsgRXJjMjBQb2xpY3l9LlxuICogT25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMgdGhhdCBjYWxsIGEgdmFsaWQgRVJDLTIwIG1ldGhvZC5cbiAqIE5vbi1FUkMtMjAgdHJhbnNhY3Rpb25zIGFyZSBpZ25vcmVkIGJ5IHRoaXMgcG9saWN5LlxuICpcbiAqIEBleGFtcGxlIHsgSWZFcmMyMFR4OiB7IHRyYW5zZmVyX2xpbWl0czogW3sgbGltaXQ6IFwiMHhFOEQ0QTUxMDAwXCIgfV0gfSB9XG4gKiBAZXhhbXBsZSB7IElmRXJjMjBUeDogeyBhbGxvd2VkX2NvbnRyYWN0czogWyB7IGFkZHJlc3M6IFwiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDM0YTIwYjgwOTAwOGFmZWIwXCIsIFwiY2hhaW5faWRcIjogXCIxXCIgfSBdIH0gfVxuICovXG5leHBvcnQgdHlwZSBJZkVyYzIwVHggPSB7IElmRXJjMjBUeDogRXJjMjBQb2xpY3kgfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gb25seSBhbGxvdyB2YWxpZCBFUkMtMjAgbWV0aG9kIGNhbGxzLlxuICovXG5leHBvcnQgdHlwZSBBc3NlcnRFcmMyMFR4ID0gXCJBc3NlcnRFcmMyMFR4XCI7XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIG9ubHkgYWxsb3cgbmF0aXZlIHRva2VuIHRyYW5zZmVycy5cbiAqL1xuZXhwb3J0IHR5cGUgQXNzZXJ0VHJhbnNmZXJPbmx5VHggPSBcIkFzc2VydFRyYW5zZmVyT25seVR4XCI7XG5cbi8qKlxuICogUmVzdHJpY3QgRVJDLTIwIGB0cmFuc2ZlcmAgYW5kIGB0cmFuc2ZlckZyb21gIHRyYW5zYWN0aW9uIHZhbHVlcyBhbmQgcmVjZWl2ZXJzLlxuICogT25seSBhcHBsaWVzIHRvIGNvbnRyYWN0cyBkZWZpbmVkIGluIGBhcHBsaWVzX3RvX2NvbnRyYWN0c2AsXG4gKiBvciB0byBhbGwgY29udHJhY3RzIGlmIG5vdCBkZWZpbmVkLlxuICogVGhlIGxpbWl0IGlzIGluIHRoZSB0b2tlbidzIHVuaXQuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwVHJhbnNmZXJMaW1pdCA9IHtcbiAgbGltaXQ/OiBzdHJpbmc7XG4gIHJlY2VpdmVycz86IHN0cmluZ1tdO1xuICBhcHBsaWVzX3RvX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgYGFwcHJvdmVgIHRyYW5zYWN0aW9uIHZhbHVlcyBhbmQgc3BlbmRlcnMuXG4gKiBPbmx5IGFwcGxpZXMgdG8gY29udHJhY3RzIGRlZmluZWQgaW4gYGFwcGxpZXNfdG9fY29udHJhY3RzYCxcbiAqIG9yIHRvIGFsbCBjb250cmFjdHMgaWYgbm90IGRlZmluZWQuXG4gKiBUaGUgbGltaXQgaXMgaW4gdGhlIHRva2VuJ3MgdW5pdC5cbiAqL1xuZXhwb3J0IHR5cGUgRXJjMjBBcHByb3ZlTGltaXQgPSB7XG4gIGxpbWl0Pzogc3RyaW5nO1xuICBzcGVuZGVycz86IHN0cmluZ1tdO1xuICBhcHBsaWVzX3RvX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdHMgRVJDLTIwIHBvbGljaWVzIHRvIGEgc2V0IG9mIGtub3duIGNvbnRyYWN0cyxcbiAqIGFuZCBjYW4gZGVmaW5lIGxpbWl0cyBvbiBgdHJhbnNmZXJgLCBgdHJhbnNmZXJGcm9tYCBhbmQgYGFwcHJvdmVgIG1ldGhvZCBjYWxscy5cbiAqL1xuZXhwb3J0IHR5cGUgRXJjMjBQb2xpY3kgPSB7XG4gIGFsbG93ZWRfY29udHJhY3RzPzogQ29udHJhY3RBZGRyZXNzW107XG4gIHRyYW5zZmVyX2xpbWl0cz86IEVyYzIwVHJhbnNmZXJMaW1pdFtdO1xuICBhcHByb3ZlX2xpbWl0cz86IEVyYzIwQXBwcm92ZUxpbWl0W107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBvbmx5IGFsbG93IGNhbGxpbmcgdGhlIGdpdmVuIG1ldGhvZHMgaW4gdGhlIGdpdmVuIGNvbnRyYWN0cy5cbiAqXG4gKiBAZXhhbXBsZSB7IEFzc2VydENvbnRyYWN0VHg6IHtcbiAqICAgYWxsb3dsaXN0OiBbe1xuICogICAgIGFkZHJlc3M6IHsgYWRkcmVzczogXCIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMzRhMjBiODA5MDA4YWZlYjBcIiwgXCJjaGFpbl9pZFwiOiBcIjFcIiB9LFxuICogICAgIG1ldGhvZHM6IFtcbiAqICAgICAgIFwiZnVuY3Rpb24gbmFtZSgpIHB1YmxpYyB2aWV3IHJldHVybnMgKHN0cmluZylcIixcbiAqICAgICAgIFwiZnVuY3Rpb24gdHJhbnNmZXIoYWRkcmVzcyB0bywgdWludDI1NiB2YWx1ZSkgcHVibGljIHJldHVybnMgKGJvb2wgc3VjY2VzcylcIlxuICogICAgIF1cbiAqICAgfV1cbiAqIH1cbiAqL1xuZXhwb3J0IHR5cGUgQXNzZXJ0Q29udHJhY3RUeCA9IHtcbiAgQXNzZXJ0Q29udHJhY3RUeDoge1xuICAgIGFsbG93bGlzdDoge1xuICAgICAgYWRkcmVzczogQ29udHJhY3RBZGRyZXNzO1xuICAgICAgbWV0aG9kczogc3RyaW5nW107XG4gICAgfVtdO1xuICB9O1xufTtcblxuLyoqXG4gKiBTb2xhbmEgYWRkcmVzcyBtYXRjaGVyLlxuICogQ2FuIGJlIGVpdGhlciB0aGUgcHVia2V5IG9mIHRoZSBhY2NvdW50IHVzaW5nIGJhc2U1OCBlbmNvZGluZyxcbiAqIG9yIHRoZSBpbmRleCBvZiB0aGUgcHVia2V5IG9mIGFuIGFkZHJlc3MgbG9va3VwIHRhYmxlIGFuZCB0aGVcbiAqIGluZGV4IG9mIHRoZSBhY2NvdW50IGluIHRoYXQgdGFibGUuXG4gKi9cbmV4cG9ydCB0eXBlIFNvbGFuYUFkZHJlc3NNYXRjaGVyID1cbiAgfCBzdHJpbmdcbiAgfCB7XG4gICAgICBhbHRfYWRkcmVzczogc3RyaW5nO1xuICAgICAgaW5kZXg6IG51bWJlcjtcbiAgICB9O1xuXG4vKipcbiAqIFNvbGFuYSBpbnN0cnVjdGlvbiBtYXRjaGVyLlxuICovXG5leHBvcnQgdHlwZSBTb2xhbmFJbnN0cnVjdGlvbk1hdGNoZXIgPSB7XG4gIHByb2dyYW1faWQ6IHN0cmluZztcbiAgaW5kZXg/OiBudW1iZXI7XG4gIGFjY291bnRzPzogKFxuICAgIHwge1xuICAgICAgICBhZGRyZXNzOiBTb2xhbmFBZGRyZXNzTWF0Y2hlciB8IFNvbGFuYUFkZHJlc3NNYXRjaGVyW107XG4gICAgICB9XG4gICAgfCAoe1xuICAgICAgICAvKiogQGRlcHJlY2F0ZWQgdXNlIGBhZGRyZXNzYCBpbnN0ZWFkLiAqL1xuICAgICAgICBwdWJrZXk6IHN0cmluZztcbiAgICAgIH0gJiB7XG4gICAgICAgIGluZGV4OiBudW1iZXI7XG4gICAgICB9KVxuICApW107XG4gIGRhdGE/OlxuICAgIHwgc3RyaW5nXG4gICAgfCB7XG4gICAgICAgIGRhdGE6IHN0cmluZztcbiAgICAgICAgc3RhcnRfaW5kZXg6IG51bWJlcjtcbiAgICAgIH1bXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3RzIFNvbGFuYSB0cmFuc2FjdGlvbiBpbnN0cnVjdGlvbnMuIENhbiBsaW1pdCB0aGUgbnVtYmVyIG9mIGluc3RydWN0aW9ucyxcbiAqIHRoZSBsaXN0IG9mIGFsbG93ZWQgaW5zdHJ1Y3Rpb25zLCBhbmQgYSBzZXQgb2YgcmVxdWlyZWQgaW5zdHJ1Y3Rpb25zIGluIGFsbCB0cmFuc2FjdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIFNvbGFuYUluc3RydWN0aW9uUG9saWN5ID0ge1xuICBTb2xhbmFJbnN0cnVjdGlvblBvbGljeToge1xuICAgIGNvdW50Pzoge1xuICAgICAgbWluPzogbnVtYmVyO1xuICAgICAgbWF4PzogbnVtYmVyO1xuICAgIH07XG4gICAgYWxsb3dsaXN0PzogU29sYW5hSW5zdHJ1Y3Rpb25NYXRjaGVyW107XG4gICAgcmVxdWlyZWQ/OiBTb2xhbmFJbnN0cnVjdGlvbk1hdGNoZXJbXTtcbiAgfTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHRvdGFsIHZhbHVlIHRyYW5zZmVycmVkIG91dCBvZiB0aGUgaW5wdXRzIGluIGEgQml0Y29pbiBTZWd3aXQgdHJhbnNhY3Rpb25cbiAqIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0LlxuICovXG5leHBvcnQgdHlwZSBCdGNTZWd3aXRWYWx1ZUxpbWl0ID0gQnRjU2Vnd2l0VmFsdWVMaW1pdFBlclR4IHwgQnRjU2Vnd2l0VmFsdWVMaW1pdFdpbmRvdztcblxuLyoqXG4gKiBSZXN0cmljdCBpbmRpdmlkdWFsIEJpdGNvaW4gU2Vnd2l0IHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93XG4gKiB0aGUgZ2l2ZW4gbGltaXQuXG4gKlxuICogQGV4YW1wbGUgeyBCdGNTZWd3aXRWYWx1ZUxpbWl0OiBcIjEwMDAwMDBcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIEJ0Y1NlZ3dpdFZhbHVlTGltaXRQZXJUeCA9IHtcbiAgQnRjU2Vnd2l0VmFsdWVMaW1pdDogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgdG90YWwgdmFsdWUgdHJhbnNmZXJyZWQgb3V0IG9mIHRoZSBpbnB1dHMgaW4gQml0Y29pbiBTZWd3aXQgdHJhbnNhY3Rpb25zXG4gKiBvdmVyIGEgdGltZSB3aW5kb3cuXG4gKlxuICogQGV4YW1wbGUgeyBCdGNTZWd3aXRWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjEwMDAwMDBcIiwgd2luZG93OiA4NjQwMCB9fVxuICovXG5leHBvcnQgdHlwZSBCdGNTZWd3aXRWYWx1ZUxpbWl0V2luZG93ID0ge1xuICBCdGNTZWd3aXRWYWx1ZUxpbWl0OiB7XG4gICAgbGltaXQ6IG51bWJlcjtcbiAgICB3aW5kb3c/OiBudW1iZXI7XG4gIH07XG59O1xuXG4vKipcbiAqIE9ubHkgYWxsb3cgY29ubmVjdGlvbnMgZnJvbSBjbGllbnRzIHdob3NlIElQIGFkZHJlc3NlcyBtYXRjaCBhbnkgb2YgdGhlc2UgSVB2NCBDSURSIGJsb2Nrcy5cbiAqXG4gKiBAZXhhbXBsZSB7IFNvdXJjZUlwQWxsb3dsaXN0OiBbIFwiMTIzLjQ1Ni43OC45LzE2XCIgXSB9XG4gKi9cbmV4cG9ydCB0eXBlIFNvdXJjZUlwQWxsb3dsaXN0ID0geyBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW10gfTtcblxuLyoqXG4gKiBNRkEgcG9saWN5XG4gKlxuICogQGV4YW1wbGUge1xuICoge1xuICogICBjb3VudDogMSxcbiAqICAgbnVtX2F1dGhfZmFjdG9yczogMSxcbiAqICAgYWxsb3dlZF9tZmFfdHlwZXM6IFsgXCJUb3RwXCIgXSxcbiAqICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiB9XG4gKi9cbmV4cG9ydCB0eXBlIE1mYVBvbGljeSA9IHtcbiAgY291bnQ/OiBudW1iZXI7XG4gIG51bV9hdXRoX2ZhY3RvcnM/OiBudW1iZXI7XG4gIGFsbG93ZWRfYXBwcm92ZXJzPzogc3RyaW5nW107XG4gIGFsbG93ZWRfbWZhX3R5cGVzPzogTWZhVHlwZVtdO1xuICByZXN0cmljdGVkX29wZXJhdGlvbnM/OiBPcGVyYXRpb25LaW5kW107XG4gIC8qKiBMaWZldGltZSBpbiBzZWNvbmRzLCBkZWZhdWx0cyB0byA5MDAgKDE1IG1pbnV0ZXMpICovXG4gIGxpZmV0aW1lPzogbnVtYmVyO1xuICAvKipcbiAgICogSG93IHRvIGNvbXBhcmUgSFRUUCByZXF1ZXN0cyB3aGVuIHZlcmlmeWluZyB0aGUgTUZBIHJlY2VpcHQuXG4gICAqIFRoaXMgc3BlY2lmaWVzIGhvdyB3ZSBjaGVjayBlcXVhbGl0eSBiZXR3ZWVuICgxKSB0aGUgSFRUUCByZXF1ZXN0IHdoZW4gdGhlIDIwMiAoTUZBIHJlcXVpcmVkKVxuICAgKiByZXNwb25zZSBpcyByZXR1cm5lZCBhbmQgKDIpIHRoZSBIVFRQIHJlcXVlc3Qgd2hlbiB0aGUgY29ycmVzcG9uZCBNRkEgcmVjZWlwdCBpcyB1c2VkLlxuICAgKi9cbiAgcmVxdWVzdF9jb21wYXJlcj86IEh0dHBSZXF1ZXN0Q29tcGFyZXI7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgaW4gc2Vjb25kcyBiZWZvcmUgYW4gTUZBIHJlY2VpcHQgY2FuIGJlIHJlZGVlbWVkLlxuICAgKiBEZWZhdWx0cyB0byAwLCBpLmUuLCBubyBkZWxheS4gQXBwcm92ZXJzIGNhbiB2b3RlIHRvIGFwcHJvdmUgb3IgdmV0b1xuICAgKiBiZWZvcmUgdGhlIGRlbGF5IGV4cGlyZXMuIEFmdGVyIGFwcHJvdmluZywgaXQgaXMgc3RpbGwgcG9zc2libGUgZm9yXG4gICAqIGFueW9uZSB0byB2ZXRvIHRoZSByZXF1ZXN0IHVudGlsIHRoZSBkZWxheSBleHBpcmVzIGFuZCB0aGUgcmVjZWlwdFxuICAgKiBpcyByZWRlZW1lZC5cbiAgICovXG4gIHRpbWVfZGVsYXk/OiBudW1iZXI7XG59O1xuXG5leHBvcnQgdHlwZSBIdHRwUmVxdWVzdENvbXBhcmVyID0gXCJFcVwiIHwgeyBFdm1UeDogRXZtVHhDbXAgfSB8IHsgU29sYW5hVHg6IFNvbGFuYVR4Q21wIH07XG5cbi8qKlxuICogUmVxdWlyZSBNRkEgZm9yIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7XG4gKiAgICAgUmVxdWlyZU1mYToge1xuICogICAgICAgY291bnQ6IDEsXG4gKiAgICAgICBhbGxvd2VkX21mYV90eXBlczogWyBcIlRvdHBcIiBdLFxuICogICAgICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiAgICAgICByZXN0cmljdGVkX29wZXJhdGlvbnM6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqL1xuZXhwb3J0IHR5cGUgUmVxdWlyZU1mYSA9IHtcbiAgUmVxdWlyZU1mYTogTWZhUG9saWN5O1xufTtcblxuLyoqXG4gKiBSZXF1aXJlIHRoYXQgdGhlIGtleSBpcyBhY2Nlc3NlZCB2aWEgYSByb2xlIHNlc3Npb24uXG4gKlxuICogQGV4YW1wbGUgeyBcIlJlcXVpcmVSb2xlU2Vzc2lvblwiOiBcIipcIiB9XG4gKiBAZXhhbXBsZSB7IFwiUmVxdWlyZVJvbGVTZXNzaW9uXCI6IFtcbiAqICAgXCJSb2xlIzM0ZGZiNjU0LWYzNmQtNDhlYS1iZGY2LTgzM2MwZDk0Yjc1OVwiLFxuICogICBcIlJvbGUjOThkODc2MzMtZDFhNy00NjEyLWI2YjQtYjJmYTJiNDNjZDNkXCJcbiAqIF19XG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVSb2xlU2Vzc2lvbiA9IHtcbiAgLyoqIFJlcXVpcmUgZWl0aGVyIGFueSByb2xlIHNlc3Npb24gb3IgYW55IG9uZSBvZiB0aGUgYXBwcm92ZWQgcm9sZXMgKi9cbiAgUmVxdWlyZVJvbGVTZXNzaW9uOiBcIipcIiB8IHN0cmluZ1tdO1xufTtcblxuLyoqXG4gKiBGb3J3YXJkcyB0aGUgcmVxdWVzdCBwYXJhbWV0ZXJzIHRvIHRoaXMgd2ViaG9vayB3aGljaCBkZXRlcm1pbmVzXG4gKiB3aGV0aGVyIHRoZSByZXF1ZXN0IGlzIGFsbG93ZWQgdG8gYmUgZXhlY3V0ZWQuXG4gKi9cbmV4cG9ydCB0eXBlIFdlYmhvb2tQb2xpY3kgPSB7XG4gIFdlYmhvb2s6IHtcbiAgICAvKiogVGhlIHVybCBvZiB0aGUgd2ViaG9vayAqL1xuICAgIHVybDogc3RyaW5nO1xuXG4gICAgLyoqIE9wdGlvbmFsIEhUVFAgbWV0aG9kIHRvIHVzZS4gRGVmYXVsdHMgdG8gUE9TVC4gKi9cbiAgICBtZXRob2Q/OiBzdHJpbmc7XG5cbiAgICAvKiogT3B0aW9uYWwgSFRUUCBoZWFkZXJzIHRvIHNldCAqL1xuICAgIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBleGVjdXRpb24gdGltZW91dCBpbiBzZWNvbmRzOyBtdXN0IGJlIGF0IGxlYXN0IDEgbm90IGV4Y2VlZCA1IHNlY29uZHMuXG4gICAgICogRGVmYXVsdHMgdG8gNS5cbiAgICAgKi9cbiAgICB0aW1lb3V0PzogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogQ3ViZVNpZ25lciBvcGVyYXRpb25zIHRvIHdoaWNoIHRoaXMgcG9saWN5IHNob3VsZCBhcHBseS5cbiAgICAgKiBXaGVuIG9taXR0ZWQsIGFwcGxpZXMgdG8gYWxsIG9wZXJhdGlvbnMuXG4gICAgICovXG4gICAgcmVzdHJpY3RlZF9vcGVyYXRpb25zPzogT3BlcmF0aW9uS2luZFtdO1xuICB9O1xufTtcblxuLyoqIEJhYnlsb24gc3Rha2luZyBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIEJhYnlsb25TdGFraW5nID0ge1xuICBCYWJ5bG9uU3Rha2luZzoge1xuICAgIC8qKlxuICAgICAqIFB1YmxpYyBrZXlzIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHN0YWtpbmcuIE11c3QgYmUgZGVmaW5lZCBpZiB0aGUgcG9saWN5IGlzIGJlaW5nIGFwcGxpZWRcbiAgICAgKiB0byBhIFNlZ1dpdCBrZXk7IG90aGVyd2lzZSwgaWYgYHVuZGVmaW5lZGAsIG9ubHkgdGhlIGtleSB0byB3aGljaCB0aGUgcG9saWN5IGlzIGJlaW5nXG4gICAgICogYXBwbGllZCBjYW4gYmUgdXNlZCBhcyB0aGUgc3Rha2luZyBwdWJsaWMga2V5IHdoZW4gY3JlYXRpbmcgQmFieWxvbi1yZWxhdGVkIHRyYW5zYWN0aW9ucy5cbiAgICAgKlxuICAgICAqIEhleC1lbmNvZGVkIHB1YmxpYyBrZXlzLCBXSVRIT1VUIHRoZSBsZWFkaW5nICcweCcuXG4gICAgICovXG4gICAgYWxsb3dlZF9zdGFrZXJfcGtzPzogc3RyaW5nW107XG5cbiAgICAvKipcbiAgICAgKiBGaW5hbGl0eSBwcm92aWRlcnMgdGhhdCBjYW4gYmUgdXNlZCBmb3Igc3Rha2luZy4gSWYgYHVuZGVmaW5lZGAsIGFueSBmaW5hbGl0eVxuICAgICAqIHByb3ZpZGVyIGNhbiBiZSB1c2VkLlxuICAgICAqXG4gICAgICogSGV4LWVuY29kZWQgcHVibGljIGtleXMsIFdJVEhPVVQgdGhlIGxlYWRpbmcgJzB4Jy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX2ZpbmFsaXR5X3Byb3ZpZGVyX3Brcz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIGFkZHJlc3NlcyB0aGF0IGNhbiBiZSB1c2VkIGluIHN0YWtpbmcgdHJhbnNhY3Rpb25zLiBJZiBgdW5kZWZpbmVkYCwgb25seVxuICAgICAqIHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkIGNhbiBiZSB1c2VkIGFzIHRoZSBjaGFuZ2UgYWRkcmVzcy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX2NoYW5nZV9hZGRycz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogV2l0aGRyYXdhbCBhZGRyZXNzZXMgdGhhdCBjYW4gYmUgdXNlZCBpbiB3aXRoZHJhd2FsIHR4bnMuIElmIGB1bmRlZmluZWRgLCBvbmx5XG4gICAgICogdGhlIGtleSB0byB3aGljaCB0aGUgcG9saWN5IGlzIGJlaW5nIGFwcGxpZWQgY2FuIGJlIHVzZWQgYXMgdGhlIHdpdGhkcmF3YWwgYWRkcmVzcy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX3dpdGhkcmF3YWxfYWRkcnM/OiBzdHJpbmdbXTtcblxuICAgIC8qKiBCYWJ5bG9uIG5ldHdvcmtzIHRoYXQgdGhpcyBrZXkgY2FuIGJlIHVzZWQgd2l0aC4gSWYgYHVuZGVmaW5lZGAsIGFueSBuZXR3b3JrLiAqL1xuICAgIGFsbG93ZWRfbmV0d29ya19pZHM/OiBCYWJ5bG9uU3Rha2luZ1JlcXVlc3RbXCJuZXR3b3JrXCJdW107XG5cbiAgICAvKipcbiAgICAgKiBNYXggZmVlIGFsbG93ZWQgaW4gYSBzdGFraW5nIG9yIHdpdGhkcmF3YWwgdHhuLiBJZiBgdW5kZWZpbmVkYCwgdGhlcmUgaXMgbm8gZmVlIGxpbWl0LlxuICAgICAqIE5vdGUgdGhhdCB0aGUgZmVlIGZvciB2b2x1bnRhcnkgdW5ib25kaW5nIGFuZCBzbGFzaGluZyBhcmUgZml4ZWQgYnkgdGhlIEJhYnlsb25cbiAgICAgKiBwYXJhbXMsIGFuZCB0aGlzIGxpbWl0IGlzIG5vdCBlbmZvcmNlZCBpbiB0aG9zZSBjYXNlcy5cbiAgICAgKi9cbiAgICBtYXhfZmVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbiBzdGFraW5nIHRpbWUgaW4gc2Vjb25kcy4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWluX2xvY2tfdGltZT86IG51bWJlcjtcblxuICAgIC8qKiBNYXggc3Rha2luZyB0aW1lIGluIHNlY29uZHMuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1heF9sb2NrX3RpbWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWluIHN0YWtpbmcgYW1vdW50IGluIFNBVC4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWluX3N0YWtpbmdfdmFsdWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4IHN0YWtpbmcgYW1vdW50IGluIFNBVC4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWF4X3N0YWtpbmdfdmFsdWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWluaW11bSBuZXR3b3JrIHBhcmFtZXRlcnMgdmVyc2lvbiBhbGxvd2VkLiAqL1xuICAgIG1pbl9wYXJhbXNfdmVyc2lvbj86IG51bWJlcjtcblxuICAgIC8qKiBNYXhpbXVtIG5ldHdvcmsgcGFyYW1ldGVycyB2ZXJzaW9uIGFsbG93ZWQuICovXG4gICAgbWF4X3BhcmFtc192ZXJzaW9uPzogbnVtYmVyO1xuICB9O1xufTtcblxuLyoqIEFsbG93IHJhdyBibG9iIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gdHlwZW9mIEFsbG93UmF3QmxvYlNpZ25pbmc7XG5cbi8qKiBBbGxvdyBEaWZmaWUtSGVsbG1hbiBleGNoYW5nZSAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RGlmZmllSGVsbG1hbkV4Y2hhbmdlID0gXCJBbGxvd0RpZmZpZUhlbGxtYW5FeGNoYW5nZVwiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2UgPSB0eXBlb2YgQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2U7XG5cbi8qKiBBbGxvdyBFSVAtMTkxIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0VpcDE5MVNpZ25pbmcgPSBcIkFsbG93RWlwMTkxU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dFaXAxOTFTaWduaW5nID0gdHlwZW9mIEFsbG93RWlwMTkxU2lnbmluZztcblxuLyoqIEFsbG93IEVJUC03MTIgc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RWlwNzEyU2lnbmluZyA9IFwiQWxsb3dFaXA3MTJTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0VpcDcxMlNpZ25pbmcgPSB0eXBlb2YgQWxsb3dFaXA3MTJTaWduaW5nO1xuXG4vKiogQWxsb3cgQlRDIG1lc3NhZ2Ugc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93QnRjTWVzc2FnZVNpZ25pbmcgPSBcIkFsbG93QnRjTWVzc2FnZVNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93QnRjTWVzc2FnZVNpZ25pbmcgPSB0eXBlb2YgQWxsb3dCdGNNZXNzYWdlU2lnbmluZztcblxuLyoqIEEgcmVmZXJlbmNlIHRvIGFuIG9yZy1sZXZlbCBuYW1lZCBwb2xpY3kgYW5kIGl0cyB2ZXJzaW9uICovXG5leHBvcnQgdHlwZSBQb2xpY3lSZWZlcmVuY2UgPSBgJHtzdHJpbmd9L3Yke251bWJlcn1gIHwgYCR7c3RyaW5nfS9sYXRlc3RgO1xuXG4vKiogS2V5IHBvbGljaWVzIHRoYXQgcmVzdHJpY3QgdGhlIHJlcXVlc3RzIHRoYXQgdGhlIHNpZ25pbmcgZW5kcG9pbnRzIGFjY2VwdCAqL1xuZXhwb3J0IHR5cGUgS2V5RGVueVBvbGljeSA9XG4gIHwgVHhSZWNlaXZlclxuICB8IFR4RGVwb3NpdFxuICB8IFR4VmFsdWVMaW1pdFxuICB8IFR4R2FzQ29zdExpbWl0XG4gIHwgSWZFcmMyMFR4XG4gIHwgQXNzZXJ0RXJjMjBUeFxuICB8IEFzc2VydFRyYW5zZmVyT25seVR4XG4gIHwgQXNzZXJ0Q29udHJhY3RUeFxuICB8IFN1aVR4UmVjZWl2ZXJzXG4gIHwgQnRjVHhSZWNlaXZlcnNcbiAgfCBTb3VyY2VJcEFsbG93bGlzdFxuICB8IFNvbGFuYUluc3RydWN0aW9uUG9saWN5XG4gIHwgQnRjU2Vnd2l0VmFsdWVMaW1pdFxuICB8IFJlcXVpcmVNZmFcbiAgfCBSZXF1aXJlUm9sZVNlc3Npb25cbiAgfCBCYWJ5bG9uU3Rha2luZ1xuICB8IFdlYmhvb2tQb2xpY3k7XG5cbi8qKlxuICogS2V5IHBvbGljeVxuICpcbiAqIEBleGFtcGxlIFtcbiAqICAge1xuICogICAgIFwiVHhSZWNlaXZlclwiOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiXG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlR4RGVwb3NpdFwiOiB7XG4gKiAgICAgICBcImtpbmRcIjogXCJDYW5vbmljYWxcIlxuICogICAgIH1cbiAqICAgfSxcbiAqICAge1xuICogICAgIFwiUmVxdWlyZU1mYVwiOiB7XG4gKiAgICAgICBcImNvdW50XCI6IDEsXG4gKiAgICAgICBcImFsbG93ZWRfbWZhX3R5cGVzXCI6IFtcIkN1YmVTaWduZXJcIl0sXG4gKiAgICAgICBcInJlc3RyaWN0ZWRfb3BlcmF0aW9uc1wiOiBbXG4gKiAgICAgICAgIFwiRXRoMVNpZ25cIixcbiAqICAgICAgICAgXCJCbG9iU2lnblwiXG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICB9XG4gKiBdXG4gKlxuICogQGV4YW1wbGUgW1wiQXNzZXJ0RXJjMjBUeFwiLCB7IFwiSWZFcmMyMFR4XCI6IFwidHJhbnNmZXJfbGltaXRzXCI6IFsgeyBcImxpbWl0XCI6IFwiMHgzQjlBQ0EwMFwiIH0gXSB9XVxuICovXG5leHBvcnQgdHlwZSBLZXlQb2xpY3kgPSBLZXlQb2xpY3lSdWxlW107XG5cbmV4cG9ydCB0eXBlIEtleVBvbGljeVJ1bGUgPVxuICB8IEtleURlbnlQb2xpY3lcbiAgfCBBbGxvd1Jhd0Jsb2JTaWduaW5nXG4gIHwgQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2VcbiAgfCBBbGxvd0VpcDE5MVNpZ25pbmdcbiAgfCBBbGxvd0VpcDcxMlNpZ25pbmdcbiAgfCBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nXG4gIHwgUG9saWN5UmVmZXJlbmNlO1xuXG4vKiogUm9sZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIFJvbGVQb2xpY3kgPSBSb2xlUG9saWN5UnVsZVtdO1xuXG5leHBvcnQgdHlwZSBSb2xlUG9saWN5UnVsZSA9IEtleURlbnlQb2xpY3kgfCBQb2xpY3lSZWZlcmVuY2U7XG5cbi8qKiBBIGtleSBndWFyZGVkIGJ5IGEgcG9saWN5LiAqL1xuZXhwb3J0IGNsYXNzIEtleVdpdGhQb2xpY2llcyB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgcm9sZUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGtleUlkOiBzdHJpbmc7XG4gIC8qKiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyBrZXkvcG9saWNpZXMgKi9cbiAgI2NhY2hlZDogS2V5V2l0aFBvbGljaWVzSW5mbztcblxuICAvKiogQHJldHVybnMgVGhlIGNhY2hlZCBpbmZvcm1hdGlvbiAqL1xuICBnZXQgY2FjaGVkKCk6IEtleVdpdGhQb2xpY2llc0luZm8ge1xuICAgIHJldHVybiB0aGlzLiNjYWNoZWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGNhY2hlZCBwb2xpY3kgKi9cbiAgZ2V0IHBvbGljeSgpOiBLZXlQb2xpY3kgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNhY2hlZC5wb2xpY3kgYXMgS2V5UG9saWN5IHwgdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBrZXkgKi9cbiAgYXN5bmMgZ2V0S2V5KCk6IFByb21pc2U8S2V5PiB7XG4gICAgaWYgKHRoaXMuI2NhY2hlZC5rZXlfaW5mbyA9PT0gdW5kZWZpbmVkIHx8IHRoaXMuI2NhY2hlZC5rZXlfaW5mbyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy4jY2FjaGVkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlHZXQodGhpcy5yb2xlSWQsIHRoaXMua2V5SWQsIHsgZGV0YWlsczogdHJ1ZSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBLZXkodGhpcy4jYXBpQ2xpZW50LCB0aGlzLiNjYWNoZWQua2V5X2luZm8hKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBrZXlXaXRoUG9saWNpZXMgVGhlIGtleSBhbmQgaXRzIHBvbGljaWVzXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGtleVdpdGhQb2xpY2llczogS2V5V2l0aFBvbGljaWVzSW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLnJvbGVJZCA9IGtleVdpdGhQb2xpY2llcy5yb2xlX2lkO1xuICAgIHRoaXMua2V5SWQgPSBrZXlXaXRoUG9saWNpZXMua2V5X2lkO1xuICAgIHRoaXMuI2NhY2hlZCA9IGtleVdpdGhQb2xpY2llcztcbiAgfVxufVxuXG4vKiogUm9sZXMuICovXG5leHBvcnQgY2xhc3MgUm9sZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgLyoqIFRoZSByb2xlIGluZm9ybWF0aW9uICovXG4gICNkYXRhOiBSb2xlSW5mbztcblxuICAvKiogQHJldHVybnMgSHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIHJvbGUgKi9cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBleGFtcGxlIFJvbGUjYmZlM2VjY2ItNzMxZS00MzBkLWIxZTUtYWMxMzYzZTZiMDZiXG4gICAqL1xuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5yb2xlX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIHJvbGUuIFRoZSBjYWNoZWQgcHJvcGVydGllc1xuICAgKiByZWZsZWN0IHRoZSBzdGF0ZSBvZiB0aGUgbGFzdCBmZXRjaCBvciB1cGRhdGUgKGUuZy4sIGFmdGVyIGF3YWl0aW5nXG4gICAqIGBSb2xlLmVuYWJsZWQoKWAgb3IgYFJvbGUuZGlzYWJsZSgpYCkuXG4gICAqL1xuICBnZXQgY2FjaGVkKCk6IFJvbGVJbmZvIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqL1xuICBhc3luYyBkZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlRGVsZXRlKHRoaXMuaWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFdoZXRoZXIgdGhlIHJvbGUgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBlbmFibGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiB0cnVlIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBkaXNhYmxlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBwb2xpY2llcyBwcmV2aW91c2x5IHNldCBmb3IgdGhpcyByb2xlKVxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBuZXcgcG9saWN5IHRvIHNldFxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogUm9sZVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3kgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHRvIGV4aXN0aW5nIHJvbGUgcG9saWN5LiBUaGlzIGFwcGVuZCBpcyBub3QgYXRvbWljLS0taXQgdXNlc1xuICAgKiB7QGxpbmsgcG9saWN5fSB0byBmZXRjaCB0aGUgY3VycmVudCBwb2xpY3kgYW5kIHRoZW4ge0BsaW5rIHNldFBvbGljeX1cbiAgICogdG8gc2V0IHRoZSBwb2xpY3ktLS1hbmQgc2hvdWxkIG5vdCBiZSB1c2VkIGFjcm9zcyBjb25jdXJyZW50IHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBwb2xpY3kgdG8gYXBwZW5kIHRvIHRoZSBleGlzdGluZyBvbmUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBhcHBlbmRQb2xpY3kocG9saWN5OiBSb2xlUG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMucG9saWN5KCk7XG4gICAgYXdhaXQgdGhpcy5zZXRQb2xpY3koWy4uLmV4aXN0aW5nLCAuLi5wb2xpY3ldLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIHJvbGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgZm9yIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8Um9sZVBvbGljeT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBSb2xlUG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBuZXcgZWRpdCBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBlZGl0IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIHJvbGUpXG4gICAqXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBuZXcgZWRpdCBwb2xpY3kgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldEVkaXRQb2xpY3koZWRpdFBvbGljeTogRWRpdFBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlZGl0X3BvbGljeTogZWRpdFBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGVkaXQgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGVkaXQgcG9saWN5IGZvciB0aGUgcm9sZSwgdW5kZWZpbmVkIGlmIHRoZXJlIGlzIG5vIGVkaXQgcG9saWN5XG4gICAqL1xuICBhc3luYyBlZGl0UG9saWN5KCk6IFByb21pc2U8RWRpdFBvbGljeSB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZWRpdF9wb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcmVzdHJpY3RlZCBhY3Rpb25zIG9uIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVzdHJpY3RlZEFjdGlvbnMgVGhlIG1hcCBvZiByZXN0cmljdGVkIGFjdGlvbnNcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFJlc3RyaWN0ZWRBY3Rpb25zKHJlc3RyaWN0ZWRBY3Rpb25zOiBSZXN0cmljdGVkQWN0aW9uc01hcCwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgY29uc3QgcmVzdHJpY3RlZF9hY3Rpb25zID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgT2JqZWN0LmVudHJpZXMocmVzdHJpY3RlZEFjdGlvbnMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBba2V5LnRvU3RyaW5nKCksIHZhbHVlXSksXG4gICAgKTtcblxuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcmVzdHJpY3RlZF9hY3Rpb25zIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGFsbCB1c2VycyB3aXRoIGFjY2VzcyB0byB0aGUgcm9sZS5cbiAgICpcbiAgICogQGV4YW1wbGUgW1xuICAgKiAgIFwiVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcIixcbiAgICogICBcIlVzZXIjNTU5M2MyNWItNTJlMi00ZmI1LWIzOWItOTZkNDFkNjgxZDgyXCJcbiAgICogXVxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgdXNlcnMuXG4gICAqL1xuICBhc3luYyB1c2VycyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiAodXNlcnMgfHwgW10pLm1hcCgodSkgPT4gdS51c2VyX2lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgYW4gZW1wdHkgcmVzcG9uc2UsIG9yIGEgcmVzcG9uc2UgdGhhdCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWQuXG4gICAqL1xuICBhc3luYyBhZGRVc2VyKHVzZXJJZDogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVc2VyQWRkKHRoaXMuaWQsIHVzZXJJZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIHVzZXIgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBhbiBlbXB0eSByZXNwb25zZSwgb3IgYSByZXNwb25zZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZC5cbiAgICovXG4gIGFzeW5jIHJlbW92ZVVzZXIodXNlcklkOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJSZW1vdmUodGhpcy5pZCwgdXNlcklkLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBrZXlzIGluIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgIHtcbiAgICogICAgIGlkOiBcIktleSNiZmUzZWNjYi03MzFlLTQzMGQtYjFlNS1hYzEzNjNlNmIwNmJcIixcbiAgICogICAgIHBvbGljeTogeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAgICogICAgfSxcbiAgICogIF1cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIGtleXMgaW4gdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEtleVdpdGhQb2xpY2llc1tdPiB7XG4gICAgY29uc3Qga2V5c0luUm9sZSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5c0luUm9sZS5tYXAoKGspID0+IG5ldyBLZXlXaXRoUG9saWNpZXModGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGluIHRoZSByb2xlIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBJRCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBmb3IgZ2V0dGluZyB0aGUga2V5LlxuICAgKiBAcmV0dXJucyBUaGUga2V5IHdpdGggaXRzIHBvbGljaWVzLlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5KGtleUlkOiBzdHJpbmcsIG9wdHM/OiBHZXRSb2xlS2V5T3B0aW9ucyk6IFByb21pc2U8S2V5V2l0aFBvbGljaWVzPiB7XG4gICAgY29uc3Qga3dwID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlHZXQodGhpcy5pZCwga2V5SWQsIG9wdHMpO1xuICAgIHJldHVybiBuZXcgS2V5V2l0aFBvbGljaWVzKHRoaXMuI2FwaUNsaWVudCwga3dwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0IG9mIGV4aXN0aW5nIGtleXMgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIGtleXMgVGhlIGxpc3Qgb2Yga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byBlYWNoIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgQSBDdWJlU2lnbmVyIHJlc3BvbnNlIGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlLlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5cyhrZXlzOiBLZXlbXSwgcG9saWN5PzogS2V5UG9saWN5KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c0FkZChcbiAgICAgIHRoaXMuaWQsXG4gICAgICBrZXlzLm1hcCgoaykgPT4gay5pZCksXG4gICAgICBwb2xpY3ksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3Rpbmcga2V5IHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byB0aGUga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEN1YmVTaWduZXIgcmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyBhZGRLZXkoa2V5OiBLZXksIHBvbGljeT86IEtleVBvbGljeSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFkZEtleXMoW2tleV0sIHBvbGljeSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIGtleSBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHJldHVybnMgQSBDdWJlU2lnbmVyIHJlc3BvbnNlIGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlLlxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlS2V5KGtleTogS2V5KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c1JlbW92ZSh0aGlzLmlkLCBrZXkuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzZXNzaW9uIGZvciB0aGlzIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIERlc2NyaXB0aXZlIHB1cnBvc2UuXG4gICAqIEBwYXJhbSBsaWZldGltZXMgT3B0aW9uYWwgc2Vzc2lvbiBsaWZldGltZXMuXG4gICAqIEBwYXJhbSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuIE9ubHkgYHNpZ246KmAgc2NvcGVzIGFyZSBhbGxvd2VkLlxuICAgKiBAcmV0dXJucyBOZXcgc2Vzc2lvbi5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVNlc3Npb24oXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIGxpZmV0aW1lcz86IFNlc3Npb25MaWZldGltZSxcbiAgICBzY29wZXM/OiBTY29wZVtdLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRm9yUm9sZSh0aGlzLmlkLCBwdXJwb3NlLCBzY29wZXMsIGxpZmV0aW1lcyk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgc2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuIFJldHVybmVkIG9iamVjdHMgY2FuIGJlIHVzZWQgdG9cbiAgICogcmV2b2tlIGluZGl2aWR1YWwgc2Vzc2lvbnMsIGJ1dCB0aGV5IGNhbm5vdCBiZSB1c2VkIGZvciBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIHNlc3Npb25zLlxuICAgKiBAcmV0dXJucyBTaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25zKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbkluZm9bXT4ge1xuICAgIGNvbnN0IHNlc3Npb25zID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25zTGlzdCh7IHJvbGU6IHRoaXMuaWQgfSwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gc2Vzc2lvbnMubWFwKCh0KSA9PiBuZXcgU2lnbmVyU2Vzc2lvbkluZm8odGhpcy4jYXBpQ2xpZW50LCB0LnNlc3Npb25faWQsIHQucHVycG9zZSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBSb2xlSW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZVJvbGVSZXF1ZXN0LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXBkYXRlKHRoaXMuaWQsIHJlcXVlc3QsIG1mYVJlY2VpcHQpO1xuICAgIHRoaXMuI2RhdGEgPSByZXNwLmRhdGEoKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSByb2xlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQodGhpcy5pZCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cbn1cbiJdfQ==