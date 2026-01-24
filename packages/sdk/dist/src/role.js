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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQXNCQSx3QkFBMkM7QUEyQjNDLHFDQUFxQztBQUNyQyxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLCtCQUFmLGVBQWUsUUFLMUI7QUEwWEQsNkJBQTZCO0FBQ2hCLFFBQUEsbUJBQW1CLEdBQUcscUJBQThCLENBQUM7QUFHbEUsb0NBQW9DO0FBQ3ZCLFFBQUEsMEJBQTBCLEdBQUcsNEJBQXFDLENBQUM7QUFHaEYsNEJBQTRCO0FBQ2YsUUFBQSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSw0QkFBNEI7QUFDZixRQUFBLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBR2hFLGdDQUFnQztBQUNuQixRQUFBLHNCQUFzQixHQUFHLHdCQUFpQyxDQUFDO0FBNEZ4RSxpQ0FBaUM7QUFDakMsTUFBYSxlQUFlO0lBTzFCLHNDQUFzQztJQUN0QyxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksK0JBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUErQixDQUFDO0lBQ3JELENBQUM7SUFFRCx1QkFBdUI7SUFDdkIsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssU0FBUyxJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDMUUsdUJBQUEsSUFBSSwyQkFBVyxNQUFNLHVCQUFBLElBQUksa0NBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFB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RTdFOzs7Ozs7T0FNRztJQUNILFlBQVksU0FBb0IsRUFBRSxJQUFjO1FBdlJ2QyxrQ0FBc0I7UUFDL0IsMkJBQTJCO1FBQzNCLDZCQUFnQjtRQXNSZCx1QkFBQSxJQUFJLG1CQUFjLFNBQVMsTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUksY0FBUyxJQUFJLE1BQUEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNLLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBMEIsRUFBRSxVQUF3QjtRQUN2RSxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksdUJBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUUsdUJBQUEsSUFBSSxjQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBQSxDQUFDO1FBQ3pCLE9BQU8sdUJBQUEsSUFBSSxrQkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNLLEtBQUssQ0FBQyxLQUFLO1FBQ2pCLHVCQUFBLElBQUksY0FBUyxNQUFNLHVCQUFBLElBQUksdUJBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFBLENBQUM7UUFDcEQsT0FBTyx1QkFBQSxJQUFJLGtCQUFNLENBQUM7SUFDcEIsQ0FBQztDQUNGO0FBclRELG9CQXFUQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQXBpQ2xpZW50LFxuICBDb250cmFjdEFkZHJlc3MsXG4gIEV2bVR4Q21wLFxuICBTb2xhbmFUeENtcCxcbiAgS2V5V2l0aFBvbGljaWVzSW5mbyxcbiAgUGFnZU9wdHMsXG4gIFJvbGVJbmZvLFxuICBTY29wZSxcbiAgU2Vzc2lvbkRhdGEsXG4gIFNlc3Npb25MaWZldGltZSxcbiAgVXBkYXRlUm9sZVJlcXVlc3QsXG4gIEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgT3BlcmF0aW9uS2luZCxcbiAgTWZhUmVjZWlwdHMsXG4gIEN1YmVTaWduZXJSZXNwb25zZSxcbiAgRW1wdHksXG4gIFJlc3RyaWN0ZWRBY3Rpb25zTWFwLFxuICBHZXRSb2xlS2V5T3B0aW9ucyxcbiAgRWRpdFBvbGljeSxcbiAgTWZhUG9saWN5LFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgS2V5LCBTaWduZXJTZXNzaW9uSW5mbyB9IGZyb20gXCIuXCI7XG5cbnR5cGUgTmFtZU9yQWRkcmVzc09yTnVsbCA9IHN0cmluZyB8IG51bGw7XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHJlY2VpdmVyIGZvciBFVk0gdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIiB9XG4gKiBAZXhhbXBsZSB7IFR4UmVjZWl2ZXI6IG51bGwgfVxuICogQGV4YW1wbGUgeyBUeFJlY2VpdmVyOiBbbnVsbCwgXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIl0gfVxuICovXG5leHBvcnQgdHlwZSBUeFJlY2VpdmVyID0geyBUeFJlY2VpdmVyOiBOYW1lT3JBZGRyZXNzT3JOdWxsIHwgTmFtZU9yQWRkcmVzc09yTnVsbFtdIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHJlY2VpdmVyIGZvciBTVUkgdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgU3VpVHhSZWNlaXZlcjogWyBcIjB4Yzk4MzdhMGFkMmQxMTQ2OGJiZjg0N2UzYWY0ZTNlZGU4MzdiY2MwMmExYmU2ZmFlZTYyMWRmMWE4YTQwM2NiZlwiIF0gfVxuICovXG5leHBvcnQgdHlwZSBTdWlUeFJlY2VpdmVycyA9IHsgU3VpVHhSZWNlaXZlcnM6IHN0cmluZ1tdIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHJlY2VpdmVyIGZvciBCVEMgdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgQnRjVHhSZWNlaXZlcnM6IFsgXCJiYzFxM3FkYXZsMzdkbmo2aGp1YXpkemR4azBhYW53anNnNDRtZ3VxNjZcIiwgXCJiYzFxZnJqdHhtOGcyMGc5N3F6Z2FkZzd2OXMzZnRqa3EwMnFmc3NrODdcIiBdIH1cbiAqL1xuZXhwb3J0IHR5cGUgQnRjVHhSZWNlaXZlcnMgPSB7IEJ0Y1R4UmVjZWl2ZXJzOiBzdHJpbmdbXSB9O1xuXG4vKiogVGhlIGtpbmQgb2YgZGVwb3NpdCBjb250cmFjdHMuICovXG5leHBvcnQgZW51bSBEZXBvc2l0Q29udHJhY3Qge1xuICAvKiogQ2Fub25pY2FsIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgQ2Fub25pY2FsLFxuICAvKiogV3JhcHBlciBkZXBvc2l0IGNvbnRyYWN0ICovXG4gIFdyYXBwZXIsXG59XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdC4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdCA9IFR4RGVwb3NpdEJhc2UgfCBUeERlcG9zaXRQdWJrZXkgfCBUeERlcG9zaXRSb2xlO1xuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0QmFzZSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdCB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3Qgd2l0aCBmaXhlZCB2YWxpZGF0b3IgKHB1YmtleSk6XG4gKlxuICogQGV4YW1wbGUgeyBUeERlcG9zaXQ6IHsga2luZDogRGVzcG9zaXRDb250cmFjdC5DYW5vbmljYWwsIHZhbGlkYXRvcjogeyBwdWJrZXk6IFwiODg3OS4uLjhcIn0gfX1cbiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0UHVia2V5ID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0OyBwdWJrZXk6IHN0cmluZyB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3Qgd2l0aCBhbnkgdmFsaWRhdG9yIGtleSBpbiBhIHJvbGU6XG4gKlxuICogQGV4YW1wbGUgeyBUeERlcG9zaXQ6IHsga2luZDogRGVzcG9zaXRDb250cmFjdC5DYW5vbmljYWwsIHZhbGlkYXRvcjogeyByb2xlX2lkOiBcIlJvbGUjYzYzLi4uYWZcIn0gfX1cbiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0Um9sZSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcm9sZV9pZDogc3RyaW5nIH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiB2YWx1ZXMgdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQgaW4gd2VpLlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXQgPSBUeFZhbHVlTGltaXRQZXJUeCB8IFR4VmFsdWVMaW1pdFdpbmRvdztcblxuLyoqXG4gKiBSZXN0cmljdCBpbmRpdmlkdWFsIHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdCBpbiB3ZWkuXG4gKiBDdXJyZW50bHksIHRoaXMgb25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBUeFZhbHVlTGltaXQ6IFwiMHgxMkEwNUYyMDBcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdFBlclR4ID0geyBUeFZhbHVlTGltaXQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHZhbHVlcywgaW4gd2VpLCBvdmVyIGEgdGltZSB3aW5kb3cuXG4gKiBDdXJyZW50bHksIHRoaXMgb25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBUeFZhbHVlTGltaXQ6IHsgbGltaXQ6IFwiMHgxMkEwNUYyMDBcIiwgd2luZG93OiA4NjQwMCB9fVxuICogQGV4YW1wbGUgeyBUeFZhbHVlTGltaXQ6IHsgbGltaXQ6IFwiMHgxMkEwNUYyMDBcIiwgd2luZG93OiA2MDQ4MDAsIGNoYWluX2lkczogWyBcIjFcIiwgXCI1XCIgXSB9fVxuICogQGV4YW1wbGUgeyBUeFZhbHVlTGltaXQ6IHsgbGltaXQ6IFwiMHgxMkEwNUYyMDBcIiwgd2luZG93OiA2MDQ4MDAsIGV4Y2VwdF9jaGFpbl9pZHM6IFsgXCIxXCIgXSB9fVxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXRXaW5kb3cgPSB7XG4gIFR4VmFsdWVMaW1pdDoge1xuICAgIC8qKlxuICAgICAqIE1heCBhbGxvd2VkIHZhbHVlIGluIHdlaVxuICAgICAqL1xuICAgIGxpbWl0OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogT3B0aW9uYWwgc2xpZGluZyB0aW1lIHdpbmRvdyAoaW4gc2Vjb25kcykuXG4gICAgICpcbiAgICAgKiBJZiBzcGVjaWZpZWQsIHRoZSBgbGltaXRgIGFwcGxpZXMgdG8gdGhlIGFnZ3JlZ2F0ZSB2YWx1ZSBvZiBhbGwgdHJhbnNhY3Rpb25zIHdpdGhpbiB0aGF0XG4gICAgICogdGltZSB3aW5kb3c7IG90aGVyd2lzZSwgdGhlIHdpbmRvdyBpcyAwLCBpLmUuLCB0aGUgbGltaXQgYXBwbGllcyB0byBpbmRpdmlkdWFsIHRyYW5zYWN0aW9ucy5cbiAgICAgKi9cbiAgICB3aW5kb3c/OiBudW1iZXI7XG4gICAgLyoqXG4gICAgICogT3B0aW9uYWwgY2hhaW4gaWRzLlxuICAgICAqXG4gICAgICogSWYgc3BlY2lmaWVkLCB0aGUgcG9saWN5IGFwcGxpZXMgb25seSBpZiBhIHRyYW5zYWN0aW9uIGlzIG9uIG9uZSBvZiB0aGVcbiAgICAgKiBnaXZlbiBjaGFpbnMgKG90aGVyd2lzZSBpdCBhcHBsaWVzIHRvIGFsbCB0cmFuc2FjdGlvbnMpLiBJZiBhICd3aW5kb3cnIGlzXG4gICAgICogYWxzbyBkZWZpbmVkLCB0aGUgcG9saWN5IGxpbWl0IGFwcGxpZXMgY3VtdWxhdGl2ZWx5IGFjcm9zcyBhbGwgc3BlY2lmaWVkIGNoYWlucy5cbiAgICAgKlxuICAgICAqIE11c3Qgbm90IGJlIHNwZWNpZmllZCB0b2dldGhlciB3aXRoIGBleGNlcHRfY2hhaW5faWRzYC5cbiAgICAgKi9cbiAgICBjaGFpbl9pZHM/OiBzdHJpbmdbXTtcbiAgICAvKipcbiAgICAgKiBPcHRpb25hbCBjaGFpbiBpZHMgdG8gZXhjbHVkZS5cbiAgICAgKlxuICAgICAqIElmIHNwZWNpZmllZCwgdGhlIHBvbGljeSBhcHBsaWVzIG9ubHkgaWYgYSB0cmFuc2FjdGlvbiBpcyBvbiBhIGNoYWluIGlkIG5vdFxuICAgICAqIGluY2x1ZGVkIGluIHRoaXMgbGlzdC4gSWYgYSAnd2luZG93JyBpcyBhbHNvIGRlZmluZWQsIHRoZSBwb2xpY3kgbGltaXQgYXBwbGllc1xuICAgICAqIGN1bXVsYXRpdmVseSBhY3Jvc3MgYWxsIGNoYWlucyBvdGhlciB0aGFuIHRoZSBsaXN0ZWQgb25lcy5cbiAgICAgKlxuICAgICAqIE11c3Qgbm90IGJlIHNwZWNpZmllZCB0b2dldGhlciB3aXRoIGBjaGFpbl9pZHNgLlxuICAgICAqL1xuICAgIGV4Y2VwdF9jaGFpbl9pZHM/OiBzdHJpbmdbXTtcbiAgfTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gbWF4IGdhcyBjb3N0cyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdCBpbiB3ZWkuXG4gKlxuICogQGV4YW1wbGUgeyBUeEdhc0Nvc3RMaW1pdDogXCIweDI3Q0E1NzM1N0MwMDBcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4R2FzQ29zdExpbWl0ID0geyBUeEdhc0Nvc3RMaW1pdDogc3RyaW5nIH07XG5cbi8qKlxuICogUmVzdHJpY3QgRVJDLTIwIG1ldGhvZCBjYWxscyBhY2NvcmRpbmcgdG8gdGhlIHtAbGluayBFcmMyMFBvbGljeX0uXG4gKiBPbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucyB0aGF0IGNhbGwgYSB2YWxpZCBFUkMtMjAgbWV0aG9kLlxuICogTm9uLUVSQy0yMCB0cmFuc2FjdGlvbnMgYXJlIGlnbm9yZWQgYnkgdGhpcyBwb2xpY3kuXG4gKlxuICogQGV4YW1wbGUgeyBJZkVyYzIwVHg6IHsgdHJhbnNmZXJfbGltaXRzOiBbeyBsaW1pdDogXCIweEU4RDRBNTEwMDBcIiB9XSB9IH1cbiAqIEBleGFtcGxlIHsgSWZFcmMyMFR4OiB7IGFsbG93ZWRfY29udHJhY3RzOiBbIHsgYWRkcmVzczogXCIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMzRhMjBiODA5MDA4YWZlYjBcIiwgXCJjaGFpbl9pZFwiOiBcIjFcIiB9IF0gfSB9XG4gKi9cbmV4cG9ydCB0eXBlIElmRXJjMjBUeCA9IHsgSWZFcmMyMFR4OiBFcmMyMFBvbGljeSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBvbmx5IGFsbG93IHZhbGlkIEVSQy0yMCBtZXRob2QgY2FsbHMuXG4gKi9cbmV4cG9ydCB0eXBlIEFzc2VydEVyYzIwVHggPSBcIkFzc2VydEVyYzIwVHhcIjtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gb25seSBhbGxvdyBuYXRpdmUgdG9rZW4gdHJhbnNmZXJzLlxuICovXG5leHBvcnQgdHlwZSBBc3NlcnRUcmFuc2Zlck9ubHlUeCA9IFwiQXNzZXJ0VHJhbnNmZXJPbmx5VHhcIjtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgYHRyYW5zZmVyYCBhbmQgYHRyYW5zZmVyRnJvbWAgdHJhbnNhY3Rpb24gdmFsdWVzIGFuZCByZWNlaXZlcnMuXG4gKiBPbmx5IGFwcGxpZXMgdG8gY29udHJhY3RzIGRlZmluZWQgaW4gYGFwcGxpZXNfdG9fY29udHJhY3RzYCxcbiAqIG9yIHRvIGFsbCBjb250cmFjdHMgaWYgbm90IGRlZmluZWQuXG4gKiBUaGUgbGltaXQgaXMgaW4gdGhlIHRva2VuJ3MgdW5pdC5cbiAqL1xuZXhwb3J0IHR5cGUgRXJjMjBUcmFuc2ZlckxpbWl0ID0ge1xuICBsaW1pdD86IHN0cmluZztcbiAgcmVjZWl2ZXJzPzogc3RyaW5nW107XG4gIGFwcGxpZXNfdG9fY29udHJhY3RzPzogQ29udHJhY3RBZGRyZXNzW107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IEVSQy0yMCBgYXBwcm92ZWAgdHJhbnNhY3Rpb24gdmFsdWVzIGFuZCBzcGVuZGVycy5cbiAqIE9ubHkgYXBwbGllcyB0byBjb250cmFjdHMgZGVmaW5lZCBpbiBgYXBwbGllc190b19jb250cmFjdHNgLFxuICogb3IgdG8gYWxsIGNvbnRyYWN0cyBpZiBub3QgZGVmaW5lZC5cbiAqIFRoZSBsaW1pdCBpcyBpbiB0aGUgdG9rZW4ncyB1bml0LlxuICovXG5leHBvcnQgdHlwZSBFcmMyMEFwcHJvdmVMaW1pdCA9IHtcbiAgbGltaXQ/OiBzdHJpbmc7XG4gIHNwZW5kZXJzPzogc3RyaW5nW107XG4gIGFwcGxpZXNfdG9fY29udHJhY3RzPzogQ29udHJhY3RBZGRyZXNzW107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0cyBFUkMtMjAgcG9saWNpZXMgdG8gYSBzZXQgb2Yga25vd24gY29udHJhY3RzLFxuICogYW5kIGNhbiBkZWZpbmUgbGltaXRzIG9uIGB0cmFuc2ZlcmAsIGB0cmFuc2ZlckZyb21gIGFuZCBgYXBwcm92ZWAgbWV0aG9kIGNhbGxzLlxuICovXG5leHBvcnQgdHlwZSBFcmMyMFBvbGljeSA9IHtcbiAgYWxsb3dlZF9jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbiAgdHJhbnNmZXJfbGltaXRzPzogRXJjMjBUcmFuc2ZlckxpbWl0W107XG4gIGFwcHJvdmVfbGltaXRzPzogRXJjMjBBcHByb3ZlTGltaXRbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIG9ubHkgYWxsb3cgY2FsbGluZyB0aGUgZ2l2ZW4gbWV0aG9kcyBpbiB0aGUgZ2l2ZW4gY29udHJhY3RzLlxuICpcbiAqIEBleGFtcGxlIHsgQXNzZXJ0Q29udHJhY3RUeDoge1xuICogICBhbGxvd2xpc3Q6IFt7XG4gKiAgICAgYWRkcmVzczogeyBhZGRyZXNzOiBcIjB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAzNGEyMGI4MDkwMDhhZmViMFwiLCBcImNoYWluX2lkXCI6IFwiMVwiIH0sXG4gKiAgICAgbWV0aG9kczogW1xuICogICAgICAgXCJmdW5jdGlvbiBuYW1lKCkgcHVibGljIHZpZXcgcmV0dXJucyAoc3RyaW5nKVwiLFxuICogICAgICAgXCJmdW5jdGlvbiB0cmFuc2ZlcihhZGRyZXNzIHRvLCB1aW50MjU2IHZhbHVlKSBwdWJsaWMgcmV0dXJucyAoYm9vbCBzdWNjZXNzKVwiXG4gKiAgICAgXVxuICogICB9XVxuICogfVxuICovXG5leHBvcnQgdHlwZSBBc3NlcnRDb250cmFjdFR4ID0ge1xuICBBc3NlcnRDb250cmFjdFR4OiB7XG4gICAgYWxsb3dsaXN0OiB7XG4gICAgICBhZGRyZXNzOiBDb250cmFjdEFkZHJlc3M7XG4gICAgICBtZXRob2RzOiBzdHJpbmdbXTtcbiAgICB9W107XG4gIH07XG59O1xuXG4vKipcbiAqIFNvbGFuYSBhZGRyZXNzIG1hdGNoZXIuXG4gKiBDYW4gYmUgZWl0aGVyIHRoZSBwdWJrZXkgb2YgdGhlIGFjY291bnQgdXNpbmcgYmFzZTU4IGVuY29kaW5nLFxuICogb3IgdGhlIGluZGV4IG9mIHRoZSBwdWJrZXkgb2YgYW4gYWRkcmVzcyBsb29rdXAgdGFibGUgYW5kIHRoZVxuICogaW5kZXggb2YgdGhlIGFjY291bnQgaW4gdGhhdCB0YWJsZS5cbiAqL1xuZXhwb3J0IHR5cGUgU29sYW5hQWRkcmVzc01hdGNoZXIgPVxuICB8IHN0cmluZ1xuICB8IHtcbiAgICAgIGFsdF9hZGRyZXNzOiBzdHJpbmc7XG4gICAgICBpbmRleDogbnVtYmVyO1xuICAgIH07XG5cbi8qKlxuICogU29sYW5hIGluc3RydWN0aW9uIG1hdGNoZXIuXG4gKi9cbmV4cG9ydCB0eXBlIFNvbGFuYUluc3RydWN0aW9uTWF0Y2hlciA9IHtcbiAgcHJvZ3JhbV9pZDogc3RyaW5nO1xuICBpbmRleD86IG51bWJlcjtcbiAgYWNjb3VudHM/OiAoXG4gICAgfCB7XG4gICAgICAgIGFkZHJlc3M6IFNvbGFuYUFkZHJlc3NNYXRjaGVyIHwgU29sYW5hQWRkcmVzc01hdGNoZXJbXTtcbiAgICAgIH1cbiAgICB8ICh7XG4gICAgICAgIC8qKiBAZGVwcmVjYXRlZCB1c2UgYGFkZHJlc3NgIGluc3RlYWQuICovXG4gICAgICAgIHB1YmtleTogc3RyaW5nO1xuICAgICAgfSAmIHtcbiAgICAgICAgaW5kZXg6IG51bWJlcjtcbiAgICAgIH0pXG4gIClbXTtcbiAgZGF0YT86XG4gICAgfCBzdHJpbmdcbiAgICB8IHtcbiAgICAgICAgZGF0YTogc3RyaW5nO1xuICAgICAgICBzdGFydF9pbmRleDogbnVtYmVyO1xuICAgICAgfVtdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdHMgU29sYW5hIHRyYW5zYWN0aW9uIGluc3RydWN0aW9ucy4gQ2FuIGxpbWl0IHRoZSBudW1iZXIgb2YgaW5zdHJ1Y3Rpb25zLFxuICogdGhlIGxpc3Qgb2YgYWxsb3dlZCBpbnN0cnVjdGlvbnMsIGFuZCBhIHNldCBvZiByZXF1aXJlZCBpbnN0cnVjdGlvbnMgaW4gYWxsIHRyYW5zYWN0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgU29sYW5hSW5zdHJ1Y3Rpb25Qb2xpY3kgPSB7XG4gIFNvbGFuYUluc3RydWN0aW9uUG9saWN5OiB7XG4gICAgY291bnQ/OiB7XG4gICAgICBtaW4/OiBudW1iZXI7XG4gICAgICBtYXg/OiBudW1iZXI7XG4gICAgfTtcbiAgICBhbGxvd2xpc3Q/OiBTb2xhbmFJbnN0cnVjdGlvbk1hdGNoZXJbXTtcbiAgICByZXF1aXJlZD86IFNvbGFuYUluc3RydWN0aW9uTWF0Y2hlcltdO1xuICB9O1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgdG90YWwgdmFsdWUgdHJhbnNmZXJyZWQgb3V0IG9mIHRoZSBpbnB1dHMgaW4gYSBCaXRjb2luIFNlZ3dpdCB0cmFuc2FjdGlvblxuICogdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQuXG4gKi9cbmV4cG9ydCB0eXBlIEJ0Y1NlZ3dpdFZhbHVlTGltaXQgPSBCdGNTZWd3aXRWYWx1ZUxpbWl0UGVyVHggfCBCdGNTZWd3aXRWYWx1ZUxpbWl0V2luZG93O1xuXG4vKipcbiAqIFJlc3RyaWN0IGluZGl2aWR1YWwgQml0Y29pbiBTZWd3aXQgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3dcbiAqIHRoZSBnaXZlbiBsaW1pdC5cbiAqXG4gKiBAZXhhbXBsZSB7IEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IFwiMTAwMDAwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgQnRjU2Vnd2l0VmFsdWVMaW1pdFBlclR4ID0ge1xuICBCdGNTZWd3aXRWYWx1ZUxpbWl0OiBudW1iZXI7XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSB0b3RhbCB2YWx1ZSB0cmFuc2ZlcnJlZCBvdXQgb2YgdGhlIGlucHV0cyBpbiBCaXRjb2luIFNlZ3dpdCB0cmFuc2FjdGlvbnNcbiAqIG92ZXIgYSB0aW1lIHdpbmRvdy5cbiAqXG4gKiBAZXhhbXBsZSB7IEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IHsgbGltaXQ6IFwiMTAwMDAwMFwiLCB3aW5kb3c6IDg2NDAwIH19XG4gKi9cbmV4cG9ydCB0eXBlIEJ0Y1NlZ3dpdFZhbHVlTGltaXRXaW5kb3cgPSB7XG4gIEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IHtcbiAgICBsaW1pdDogbnVtYmVyO1xuICAgIHdpbmRvdz86IG51bWJlcjtcbiAgfTtcbn07XG5cbi8qKlxuICogT25seSBhbGxvdyBjb25uZWN0aW9ucyBmcm9tIGNsaWVudHMgd2hvc2UgSVAgYWRkcmVzc2VzIG1hdGNoIGFueSBvZiB0aGVzZSBJUHY0IENJRFIgYmxvY2tzLlxuICpcbiAqIEBleGFtcGxlIHsgU291cmNlSXBBbGxvd2xpc3Q6IFsgXCIxMjMuNDU2Ljc4LjkvMTZcIiBdIH1cbiAqL1xuZXhwb3J0IHR5cGUgU291cmNlSXBBbGxvd2xpc3QgPSB7IFNvdXJjZUlwQWxsb3dsaXN0OiBzdHJpbmdbXSB9O1xuXG5leHBvcnQgdHlwZSBIdHRwUmVxdWVzdENvbXBhcmVyID0gXCJFcVwiIHwgeyBFdm1UeDogRXZtVHhDbXAgfSB8IHsgU29sYW5hVHg6IFNvbGFuYVR4Q21wIH07XG5cbi8qKlxuICogUmVxdWlyZSBNRkEgZm9yIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7XG4gKiAgICAgUmVxdWlyZU1mYToge1xuICogICAgICAgY291bnQ6IDEsXG4gKiAgICAgICBhbGxvd2VkX21mYV90eXBlczogWyBcIlRvdHBcIiBdLFxuICogICAgICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiAgICAgICByZXN0cmljdGVkX29wZXJhdGlvbnM6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqL1xuZXhwb3J0IHR5cGUgUmVxdWlyZU1mYSA9IHtcbiAgUmVxdWlyZU1mYTogTWZhUG9saWN5O1xufTtcblxuLyoqXG4gKiBSZXF1aXJlIHRoYXQgdGhlIGtleSBpcyBhY2Nlc3NlZCB2aWEgYSByb2xlIHNlc3Npb24uXG4gKlxuICogQGV4YW1wbGUgeyBcIlJlcXVpcmVSb2xlU2Vzc2lvblwiOiBcIipcIiB9XG4gKiBAZXhhbXBsZSB7IFwiUmVxdWlyZVJvbGVTZXNzaW9uXCI6IFtcbiAqICAgXCJSb2xlIzM0ZGZiNjU0LWYzNmQtNDhlYS1iZGY2LTgzM2MwZDk0Yjc1OVwiLFxuICogICBcIlJvbGUjOThkODc2MzMtZDFhNy00NjEyLWI2YjQtYjJmYTJiNDNjZDNkXCJcbiAqIF19XG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVSb2xlU2Vzc2lvbiA9IHtcbiAgLyoqIFJlcXVpcmUgZWl0aGVyIGFueSByb2xlIHNlc3Npb24gb3IgYW55IG9uZSBvZiB0aGUgYXBwcm92ZWQgcm9sZXMgKi9cbiAgUmVxdWlyZVJvbGVTZXNzaW9uOiBcIipcIiB8IHN0cmluZ1tdO1xufTtcblxuLyoqXG4gKiBGb3J3YXJkcyB0aGUgcmVxdWVzdCBwYXJhbWV0ZXJzIHRvIHRoaXMgd2ViaG9vayB3aGljaCBkZXRlcm1pbmVzXG4gKiB3aGV0aGVyIHRoZSByZXF1ZXN0IGlzIGFsbG93ZWQgdG8gYmUgZXhlY3V0ZWQuXG4gKi9cbmV4cG9ydCB0eXBlIFdlYmhvb2tQb2xpY3kgPSB7XG4gIFdlYmhvb2s6IHtcbiAgICAvKiogVGhlIHVybCBvZiB0aGUgd2ViaG9vayAqL1xuICAgIHVybDogc3RyaW5nO1xuXG4gICAgLyoqIE9wdGlvbmFsIEhUVFAgbWV0aG9kIHRvIHVzZS4gRGVmYXVsdHMgdG8gUE9TVC4gKi9cbiAgICBtZXRob2Q/OiBzdHJpbmc7XG5cbiAgICAvKiogT3B0aW9uYWwgSFRUUCBoZWFkZXJzIHRvIHNldCAqL1xuICAgIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBleGVjdXRpb24gdGltZW91dCBpbiBzZWNvbmRzOyBtdXN0IGJlIGF0IGxlYXN0IDEgbm90IGV4Y2VlZCA1IHNlY29uZHMuXG4gICAgICogRGVmYXVsdHMgdG8gNS5cbiAgICAgKi9cbiAgICB0aW1lb3V0PzogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogQ3ViZVNpZ25lciBvcGVyYXRpb25zIHRvIHdoaWNoIHRoaXMgcG9saWN5IHNob3VsZCBhcHBseS5cbiAgICAgKiBXaGVuIG9taXR0ZWQsIGFwcGxpZXMgdG8gYWxsIG9wZXJhdGlvbnMuXG4gICAgICovXG4gICAgcmVzdHJpY3RlZF9vcGVyYXRpb25zPzogT3BlcmF0aW9uS2luZFtdO1xuICB9O1xufTtcblxuLyoqIEJhYnlsb24gc3Rha2luZyBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIEJhYnlsb25TdGFraW5nID0ge1xuICBCYWJ5bG9uU3Rha2luZzoge1xuICAgIC8qKlxuICAgICAqIFB1YmxpYyBrZXlzIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHN0YWtpbmcuIE11c3QgYmUgZGVmaW5lZCBpZiB0aGUgcG9saWN5IGlzIGJlaW5nIGFwcGxpZWRcbiAgICAgKiB0byBhIFNlZ1dpdCBrZXk7IG90aGVyd2lzZSwgaWYgYHVuZGVmaW5lZGAsIG9ubHkgdGhlIGtleSB0byB3aGljaCB0aGUgcG9saWN5IGlzIGJlaW5nXG4gICAgICogYXBwbGllZCBjYW4gYmUgdXNlZCBhcyB0aGUgc3Rha2luZyBwdWJsaWMga2V5IHdoZW4gY3JlYXRpbmcgQmFieWxvbi1yZWxhdGVkIHRyYW5zYWN0aW9ucy5cbiAgICAgKlxuICAgICAqIEhleC1lbmNvZGVkIHB1YmxpYyBrZXlzLCBXSVRIT1VUIHRoZSBsZWFkaW5nICcweCcuXG4gICAgICovXG4gICAgYWxsb3dlZF9zdGFrZXJfcGtzPzogc3RyaW5nW107XG5cbiAgICAvKipcbiAgICAgKiBGaW5hbGl0eSBwcm92aWRlcnMgdGhhdCBjYW4gYmUgdXNlZCBmb3Igc3Rha2luZy4gSWYgYHVuZGVmaW5lZGAsIGFueSBmaW5hbGl0eVxuICAgICAqIHByb3ZpZGVyIGNhbiBiZSB1c2VkLlxuICAgICAqXG4gICAgICogSGV4LWVuY29kZWQgcHVibGljIGtleXMsIFdJVEhPVVQgdGhlIGxlYWRpbmcgJzB4Jy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX2ZpbmFsaXR5X3Byb3ZpZGVyX3Brcz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIGFkZHJlc3NlcyB0aGF0IGNhbiBiZSB1c2VkIGluIHN0YWtpbmcgdHJhbnNhY3Rpb25zLiBJZiBgdW5kZWZpbmVkYCwgb25seVxuICAgICAqIHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkIGNhbiBiZSB1c2VkIGFzIHRoZSBjaGFuZ2UgYWRkcmVzcy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX2NoYW5nZV9hZGRycz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogV2l0aGRyYXdhbCBhZGRyZXNzZXMgdGhhdCBjYW4gYmUgdXNlZCBpbiB3aXRoZHJhd2FsIHR4bnMuIElmIGB1bmRlZmluZWRgLCBvbmx5XG4gICAgICogdGhlIGtleSB0byB3aGljaCB0aGUgcG9saWN5IGlzIGJlaW5nIGFwcGxpZWQgY2FuIGJlIHVzZWQgYXMgdGhlIHdpdGhkcmF3YWwgYWRkcmVzcy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX3dpdGhkcmF3YWxfYWRkcnM/OiBzdHJpbmdbXTtcblxuICAgIC8qKiBCYWJ5bG9uIG5ldHdvcmtzIHRoYXQgdGhpcyBrZXkgY2FuIGJlIHVzZWQgd2l0aC4gSWYgYHVuZGVmaW5lZGAsIGFueSBuZXR3b3JrLiAqL1xuICAgIGFsbG93ZWRfbmV0d29ya19pZHM/OiBCYWJ5bG9uU3Rha2luZ1JlcXVlc3RbXCJuZXR3b3JrXCJdW107XG5cbiAgICAvKipcbiAgICAgKiBNYXggZmVlIGFsbG93ZWQgaW4gYSBzdGFraW5nIG9yIHdpdGhkcmF3YWwgdHhuLiBJZiBgdW5kZWZpbmVkYCwgdGhlcmUgaXMgbm8gZmVlIGxpbWl0LlxuICAgICAqIE5vdGUgdGhhdCB0aGUgZmVlIGZvciB2b2x1bnRhcnkgdW5ib25kaW5nIGFuZCBzbGFzaGluZyBhcmUgZml4ZWQgYnkgdGhlIEJhYnlsb25cbiAgICAgKiBwYXJhbXMsIGFuZCB0aGlzIGxpbWl0IGlzIG5vdCBlbmZvcmNlZCBpbiB0aG9zZSBjYXNlcy5cbiAgICAgKi9cbiAgICBtYXhfZmVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbiBzdGFraW5nIHRpbWUgaW4gc2Vjb25kcy4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWluX2xvY2tfdGltZT86IG51bWJlcjtcblxuICAgIC8qKiBNYXggc3Rha2luZyB0aW1lIGluIHNlY29uZHMuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1heF9sb2NrX3RpbWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWluIHN0YWtpbmcgYW1vdW50IGluIFNBVC4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWluX3N0YWtpbmdfdmFsdWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4IHN0YWtpbmcgYW1vdW50IGluIFNBVC4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWF4X3N0YWtpbmdfdmFsdWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWluaW11bSBuZXR3b3JrIHBhcmFtZXRlcnMgdmVyc2lvbiBhbGxvd2VkLiAqL1xuICAgIG1pbl9wYXJhbXNfdmVyc2lvbj86IG51bWJlcjtcblxuICAgIC8qKiBNYXhpbXVtIG5ldHdvcmsgcGFyYW1ldGVycyB2ZXJzaW9uIGFsbG93ZWQuICovXG4gICAgbWF4X3BhcmFtc192ZXJzaW9uPzogbnVtYmVyO1xuICB9O1xufTtcblxuLyoqIEFsbG93IHJhdyBibG9iIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gdHlwZW9mIEFsbG93UmF3QmxvYlNpZ25pbmc7XG5cbi8qKiBBbGxvdyBEaWZmaWUtSGVsbG1hbiBleGNoYW5nZSAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RGlmZmllSGVsbG1hbkV4Y2hhbmdlID0gXCJBbGxvd0RpZmZpZUhlbGxtYW5FeGNoYW5nZVwiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2UgPSB0eXBlb2YgQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2U7XG5cbi8qKiBBbGxvdyBFSVAtMTkxIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0VpcDE5MVNpZ25pbmcgPSBcIkFsbG93RWlwMTkxU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dFaXAxOTFTaWduaW5nID0gdHlwZW9mIEFsbG93RWlwMTkxU2lnbmluZztcblxuLyoqIEFsbG93IEVJUC03MTIgc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RWlwNzEyU2lnbmluZyA9IFwiQWxsb3dFaXA3MTJTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0VpcDcxMlNpZ25pbmcgPSB0eXBlb2YgQWxsb3dFaXA3MTJTaWduaW5nO1xuXG4vKiogQWxsb3cgQlRDIG1lc3NhZ2Ugc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93QnRjTWVzc2FnZVNpZ25pbmcgPSBcIkFsbG93QnRjTWVzc2FnZVNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93QnRjTWVzc2FnZVNpZ25pbmcgPSB0eXBlb2YgQWxsb3dCdGNNZXNzYWdlU2lnbmluZztcblxuZXhwb3J0IHR5cGUgQWxsb3dQb2xpY3kgPVxuICB8IEFsbG93UmF3QmxvYlNpZ25pbmdcbiAgfCBBbGxvd0RpZmZpZUhlbGxtYW5FeGNoYW5nZVxuICB8IEFsbG93RWlwMTkxU2lnbmluZ1xuICB8IEFsbG93RWlwNzEyU2lnbmluZ1xuICB8IEFsbG93QnRjTWVzc2FnZVNpZ25pbmc7XG5cbi8qKiBBIHJlZmVyZW5jZSB0byBhbiBvcmctbGV2ZWwgbmFtZWQgcG9saWN5LCB1c2luZyBpdHMgbmFtZS9pZCBhbmQgaXRzIHZlcnNpb24gKi9cbmV4cG9ydCB0eXBlIFBvbGljeVJlZmVyZW5jZSA9IGAke3N0cmluZ30vdiR7bnVtYmVyfWAgfCBgJHtzdHJpbmd9L2xhdGVzdGA7XG5cbi8qKlxuICogQSByZWZlcmVuY2UgdG8gYW4gb3JnLWxldmVsIG5hbWVkIHBvbGljeSB1c2luZyBpdHMgaWQuXG4gKiBXZSBjYW5ub3QgdXNlIHRoZSBwb2xpY3kncyBuYW1lIGluIHRoaXMgZm9ybWF0LlxuICovXG5leHBvcnQgdHlwZSBOYW1lZFBvbGljeVJlZmVyZW5jZSA9IHtcbiAgUmVmZXJlbmNlOiBQb2xpY3lSZWZlcmVuY2U7XG59O1xuXG4vKiogS2V5IHBvbGljaWVzIHRoYXQgcmVzdHJpY3QgdGhlIHJlcXVlc3RzIHRoYXQgdGhlIHNpZ25pbmcgZW5kcG9pbnRzIGFjY2VwdCAqL1xuZXhwb3J0IHR5cGUgS2V5RGVueVBvbGljeSA9XG4gIHwgVHhSZWNlaXZlclxuICB8IFR4RGVwb3NpdFxuICB8IFR4VmFsdWVMaW1pdFxuICB8IFR4R2FzQ29zdExpbWl0XG4gIHwgSWZFcmMyMFR4XG4gIHwgQXNzZXJ0RXJjMjBUeFxuICB8IEFzc2VydFRyYW5zZmVyT25seVR4XG4gIHwgQXNzZXJ0Q29udHJhY3RUeFxuICB8IFN1aVR4UmVjZWl2ZXJzXG4gIHwgQnRjVHhSZWNlaXZlcnNcbiAgfCBTb3VyY2VJcEFsbG93bGlzdFxuICB8IFNvbGFuYUluc3RydWN0aW9uUG9saWN5XG4gIHwgQnRjU2Vnd2l0VmFsdWVMaW1pdFxuICB8IFJlcXVpcmVNZmFcbiAgfCBSZXF1aXJlUm9sZVNlc3Npb25cbiAgfCBCYWJ5bG9uU3Rha2luZ1xuICB8IFdlYmhvb2tQb2xpY3lcbiAgfCBQb2xpY3lBbmRcbiAgfCBQb2xpY3lPclxuICB8IFBvbGljeU5vdFxuICB8IE5hbWVkUG9saWN5UmVmZXJlbmNlO1xuXG4vKipcbiAqIEtleSBwb2xpY3lcbiAqXG4gKiBAZXhhbXBsZSBbXG4gKiAgIHtcbiAqICAgICBcIlR4UmVjZWl2ZXJcIjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIlxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJUeERlcG9zaXRcIjoge1xuICogICAgICAgXCJraW5kXCI6IFwiQ2Fub25pY2FsXCJcbiAqICAgICB9XG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlJlcXVpcmVNZmFcIjoge1xuICogICAgICAgXCJjb3VudFwiOiAxLFxuICogICAgICAgXCJhbGxvd2VkX21mYV90eXBlc1wiOiBbXCJDdWJlU2lnbmVyXCJdLFxuICogICAgICAgXCJyZXN0cmljdGVkX29wZXJhdGlvbnNcIjogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICogXVxuICpcbiAqIEBleGFtcGxlIFtcIkFzc2VydEVyYzIwVHhcIiwgeyBcIklmRXJjMjBUeFwiOiBcInRyYW5zZmVyX2xpbWl0c1wiOiBbIHsgXCJsaW1pdFwiOiBcIjB4M0I5QUNBMDBcIiB9IF0gfV1cbiAqL1xuZXhwb3J0IHR5cGUgS2V5UG9saWN5ID0gS2V5UG9saWN5UnVsZVtdO1xuXG5leHBvcnQgdHlwZSBLZXlQb2xpY3lSdWxlID0gS2V5RGVueVBvbGljeSB8IEFsbG93UG9saWN5IHwgUG9saWN5UmVmZXJlbmNlO1xuXG4vKiogUm9sZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIFJvbGVQb2xpY3kgPSBSb2xlUG9saWN5UnVsZVtdO1xuXG5leHBvcnQgdHlwZSBSb2xlUG9saWN5UnVsZSA9IEtleURlbnlQb2xpY3kgfCBQb2xpY3lSZWZlcmVuY2U7XG5cbmV4cG9ydCB0eXBlIFBvbGljeUFuZCA9IHtcbiAgQW5kOiBLZXlEZW55UG9saWN5W107XG59O1xuXG5leHBvcnQgdHlwZSBQb2xpY3lPciA9IHtcbiAgT3I6IEtleURlbnlQb2xpY3lbXTtcbn07XG5cbmV4cG9ydCB0eXBlIFBvbGljeU5vdCA9IHtcbiAgTm90OiBLZXlEZW55UG9saWN5O1xufTtcblxuLyoqIEEga2V5IGd1YXJkZWQgYnkgYSBwb2xpY3kuICovXG5leHBvcnQgY2xhc3MgS2V5V2l0aFBvbGljaWVzIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSByb2xlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkga2V5SWQ6IHN0cmluZztcbiAgLyoqIFRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIGtleS9wb2xpY2llcyAqL1xuICAjY2FjaGVkOiBLZXlXaXRoUG9saWNpZXNJbmZvO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgY2FjaGVkIGluZm9ybWF0aW9uICovXG4gIGdldCBjYWNoZWQoKTogS2V5V2l0aFBvbGljaWVzSW5mbyB7XG4gICAgcmV0dXJuIHRoaXMuI2NhY2hlZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgY2FjaGVkIHBvbGljeSAqL1xuICBnZXQgcG9saWN5KCk6IEtleVBvbGljeSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkLnBvbGljeSBhcyBLZXlQb2xpY3kgfCB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGtleSAqL1xuICBhc3luYyBnZXRLZXkoKTogUHJvbWlzZTxLZXk+IHtcbiAgICBpZiAodGhpcy4jY2FjaGVkLmtleV9pbmZvID09PSB1bmRlZmluZWQgfHwgdGhpcy4jY2FjaGVkLmtleV9pbmZvID09PSBudWxsKSB7XG4gICAgICB0aGlzLiNjYWNoZWQgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleUdldCh0aGlzLnJvbGVJZCwgdGhpcy5rZXlJZCwgeyBkZXRhaWxzOiB0cnVlIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIHRoaXMuI2NhY2hlZC5rZXlfaW5mbyEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGtleVdpdGhQb2xpY2llcyBUaGUga2V5IGFuZCBpdHMgcG9saWNpZXNcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwga2V5V2l0aFBvbGljaWVzOiBLZXlXaXRoUG9saWNpZXNJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMucm9sZUlkID0ga2V5V2l0aFBvbGljaWVzLnJvbGVfaWQ7XG4gICAgdGhpcy5rZXlJZCA9IGtleVdpdGhQb2xpY2llcy5rZXlfaWQ7XG4gICAgdGhpcy4jY2FjaGVkID0ga2V5V2l0aFBvbGljaWVzO1xuICB9XG59XG5cbi8qKiBSb2xlcy4gKi9cbmV4cG9ydCBjbGFzcyBSb2xlIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAvKiogVGhlIHJvbGUgaW5mb3JtYXRpb24gKi9cbiAgI2RhdGE6IFJvbGVJbmZvO1xuXG4gIC8qKiBAcmV0dXJucyBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgcm9sZSAqL1xuICBnZXQgbmFtZSgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICpcbiAgICogQGV4YW1wbGUgUm9sZSNiZmUzZWNjYi03MzFlLTQzMGQtYjFlNS1hYzEzNjNlNmIwNmJcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLnJvbGVfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgdGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgcm9sZS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzXG4gICAqIHJlZmxlY3QgdGhlIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmdcbiAgICogYFJvbGUuZW5hYmxlZCgpYCBvciBgUm9sZS5kaXNhYmxlKClgKS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogUm9sZUluZm8ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICovXG4gIGFzeW5jIGRlbGV0ZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVEZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKiogQHJldHVybnMgV2hldGhlciB0aGUgcm9sZSBpcyBlbmFibGVkICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGVuYWJsZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGRpc2FibGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIHJvbGUpXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBSb2xlUG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgdG8gZXhpc3Rpbmcgcm9sZSBwb2xpY3kuIFRoaXMgYXBwZW5kIGlzIG5vdCBhdG9taWMtLS1pdCB1c2VzXG4gICAqIHtAbGluayBwb2xpY3l9IHRvIGZldGNoIHRoZSBjdXJyZW50IHBvbGljeSBhbmQgdGhlbiB7QGxpbmsgc2V0UG9saWN5fVxuICAgKiB0byBzZXQgdGhlIHBvbGljeS0tLWFuZCBzaG91bGQgbm90IGJlIHVzZWQgYWNyb3NzIGNvbmN1cnJlbnQgc2Vzc2lvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIHBvbGljeSB0byBhcHBlbmQgdG8gdGhlIGV4aXN0aW5nIG9uZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGFwcGVuZFBvbGljeShwb2xpY3k6IFJvbGVQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBmb3IgdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBlZGl0IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IGVkaXQgcG9saWNpZXMgcHJldmlvdXNseSBzZXQgZm9yIHRoaXMgcm9sZSlcbiAgICpcbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIG5ldyBlZGl0IHBvbGljeSB0byBzZXRcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0RWRpdFBvbGljeShlZGl0UG9saWN5OiBFZGl0UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVkaXRfcG9saWN5OiBlZGl0UG9saWN5IH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZWRpdCBwb2xpY3kgZm9yIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZWRpdCBwb2xpY3kgZm9yIHRoZSByb2xlLCB1bmRlZmluZWQgaWYgdGhlcmUgaXMgbm8gZWRpdCBwb2xpY3lcbiAgICovXG4gIGFzeW5jIGVkaXRQb2xpY3koKTogUHJvbWlzZTxFZGl0UG9saWN5IHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lZGl0X3BvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSByZXN0cmljdGVkIGFjdGlvbnMgb24gdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByZXN0cmljdGVkQWN0aW9ucyBUaGUgbWFwIG9mIHJlc3RyaWN0ZWQgYWN0aW9uc1xuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UmVzdHJpY3RlZEFjdGlvbnMocmVzdHJpY3RlZEFjdGlvbnM6IFJlc3RyaWN0ZWRBY3Rpb25zTWFwLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBjb25zdCByZXN0cmljdGVkX2FjdGlvbnMgPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICBPYmplY3QuZW50cmllcyhyZXN0cmljdGVkQWN0aW9ucykubWFwKChba2V5LCB2YWx1ZV0pID0+IFtrZXkudG9TdHJpbmcoKSwgdmFsdWVdKSxcbiAgICApO1xuXG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyByZXN0cmljdGVkX2FjdGlvbnMgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgYWxsIHVzZXJzIHdpdGggYWNjZXNzIHRvIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgXCJVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlwiLFxuICAgKiAgIFwiVXNlciM1NTkzYzI1Yi01MmUyLTRmYjUtYjM5Yi05NmQ0MWQ2ODFkODJcIlxuICAgKiBdXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCB1c2Vycy5cbiAgICovXG4gIGFzeW5jIHVzZXJzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCB1c2VycyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlcnNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuICh1c2VycyB8fCBbXSkubWFwKCh1KSA9PiB1LnVzZXJfaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBhbiBlbXB0eSByZXNwb25zZSwgb3IgYSByZXNwb25zZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZC5cbiAgICovXG4gIGFzeW5jIGFkZFVzZXIodXNlcklkOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJBZGQodGhpcy5pZCwgdXNlcklkLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3RpbmcgdXNlciBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIGFuIGVtcHR5IHJlc3BvbnNlLCBvciBhIHJlc3BvbnNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkLlxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlVXNlcih1c2VySWQ6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlclJlbW92ZSh0aGlzLmlkLCB1c2VySWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqXG4gICAqIEBleGFtcGxlIFtcbiAgICogICAge1xuICAgKiAgICAgaWQ6IFwiS2V5I2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlwiLFxuICAgKiAgICAgcG9saWN5OiB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICAgKiAgICB9LFxuICAgKiAgXVxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwga2V5cyBpbiB0aGlzIHJvbGUuXG4gICAqL1xuICBhc3luYyBrZXlzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8S2V5V2l0aFBvbGljaWVzW10+IHtcbiAgICBjb25zdCBrZXlzSW5Sb2xlID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBrZXlzSW5Sb2xlLm1hcCgoaykgPT4gbmV3IEtleVdpdGhQb2xpY2llcyh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgaW4gdGhlIHJvbGUgYnkgaXRzIElELlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBvcHRpb25zIGZvciBnZXR0aW5nIHRoZSBrZXkuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkgd2l0aCBpdHMgcG9saWNpZXMuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZywgb3B0cz86IEdldFJvbGVLZXlPcHRpb25zKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXM+IHtcbiAgICBjb25zdCBrd3AgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleUdldCh0aGlzLmlkLCBrZXlJZCwgb3B0cyk7XG4gICAgcmV0dXJuIG5ldyBLZXlXaXRoUG9saWNpZXModGhpcy4jYXBpQ2xpZW50LCBrd3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3Qgb2YgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5cyBUaGUgbGlzdCBvZiBrZXlzIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIGVhY2gga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEN1YmVTaWduZXIgcmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyBhZGRLZXlzKGtleXM6IEtleVtdLCBwb2xpY3k/OiBLZXlQb2xpY3kpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzQWRkKFxuICAgICAgdGhpcy5pZCxcbiAgICAgIGtleXMubWFwKChrKSA9PiBrLmlkKSxcbiAgICAgIHBvbGljeSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyBrZXkgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIHRoZSBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgQ3ViZVNpZ25lciByZXNwb25zZSBpbmRpY2F0aW5nIHN1Y2Nlc3Mgb3IgZmFpbHVyZS5cbiAgICovXG4gIGFzeW5jIGFkZEtleShrZXk6IEtleSwgcG9saWN5PzogS2V5UG9saWN5KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYWRkS2V5cyhba2V5XSwgcG9saWN5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3Rpbmcga2V5IGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEN1YmVTaWduZXIgcmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyByZW1vdmVLZXkoa2V5OiBLZXkpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzUmVtb3ZlKHRoaXMuaWQsIGtleS5pZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNlc3Npb24gZm9yIHRoaXMgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgRGVzY3JpcHRpdmUgcHVycG9zZS5cbiAgICogQHBhcmFtIGxpZmV0aW1lcyBPcHRpb25hbCBzZXNzaW9uIGxpZmV0aW1lcy5cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gT25seSBgc2lnbjoqYCBzY29wZXMgYXJlIGFsbG93ZWQuXG4gICAqIEByZXR1cm5zIE5ldyBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlU2Vzc2lvbihcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICAgIHNjb3Blcz86IFNjb3BlW10sXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGVGb3JSb2xlKHRoaXMuaWQsIHB1cnBvc2UsIHNjb3BlcywgbGlmZXRpbWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBzaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS4gUmV0dXJuZWQgb2JqZWN0cyBjYW4gYmUgdXNlZCB0b1xuICAgKiByZXZva2UgaW5kaXZpZHVhbCBzZXNzaW9ucywgYnV0IHRoZXkgY2Fubm90IGJlIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgc2Vzc2lvbnMuXG4gICAqIEByZXR1cm5zIFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbnMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uSW5mb1tdPiB7XG4gICAgY29uc3Qgc2Vzc2lvbnMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbnNMaXN0KHsgcm9sZTogdGhpcy5pZCB9LCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBzZXNzaW9ucy5tYXAoKHQpID0+IG5ldyBTaWduZXJTZXNzaW9uSW5mbyh0aGlzLiNhcGlDbGllbnQsIHQuc2Vzc2lvbl9pZCwgdC5wdXJwb3NlKSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IFJvbGVJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCByb2xlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlUm9sZVJlcXVlc3QsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgdGhpcy4jZGF0YSA9IHJlc3AuZGF0YSgpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByb2xlIGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldCh0aGlzLmlkKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxufVxuIl19