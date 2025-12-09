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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQXFCQSx3QkFBMkM7QUEyQjNDLHFDQUFxQztBQUNyQyxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLCtCQUFmLGVBQWUsUUFLMUI7QUE2WkQsNkJBQTZCO0FBQ2hCLFFBQUEsbUJBQW1CLEdBQUcscUJBQThCLENBQUM7QUFHbEUsb0NBQW9DO0FBQ3ZCLFFBQUEsMEJBQTBCLEdBQUcsNEJBQXFDLENBQUM7QUFHaEYsNEJBQTRCO0FBQ2YsUUFBQSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSw0QkFBNEI7QUFDZixRQUFBLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBR2hFLGdDQUFnQztBQUNuQixRQUFBLHNCQUFzQixHQUFHLHdCQUFpQyxDQUFDO0FBb0V4RSxpQ0FBaUM7QUFDakMsTUFBYSxlQUFlO0lBTzFCLHNDQUFzQztJQUN0QyxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksK0JBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUErQixDQUFDO0lBQ3JELENBQUM7SUFFRCx1QkFBdUI7SUFDdkIsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssU0FBUyxJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDMUUsdUJBQUEsSUFBSSwyQkFBVyxNQUFNLHVCQUFBLElBQUksa0NBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFB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QUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzVFLHVCQUFBLElBQUksY0FBUyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQUEsQ0FBQztRQUN6QixPQUFPLHVCQUFBLElBQUksa0JBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxLQUFLLENBQUMsS0FBSztRQUNqQix1QkFBQSxJQUFJLGNBQVMsTUFBTSx1QkFBQSxJQUFJLHVCQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBQSxDQUFDO1FBQ3BELE9BQU8sdUJBQUEsSUFBSSxrQkFBTSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQWhTRCxvQkFnU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEFwaUNsaWVudCxcbiAgQ29udHJhY3RBZGRyZXNzLFxuICBFdm1UeENtcCxcbiAgU29sYW5hVHhDbXAsXG4gIEtleVdpdGhQb2xpY2llc0luZm8sXG4gIE1mYVR5cGUsXG4gIFBhZ2VPcHRzLFxuICBSb2xlSW5mbyxcbiAgU2NvcGUsXG4gIFNlc3Npb25EYXRhLFxuICBTZXNzaW9uTGlmZXRpbWUsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxuICBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gIE9wZXJhdGlvbktpbmQsXG4gIE1mYVJlY2VpcHRzLFxuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEVtcHR5LFxuICBSZXN0cmljdGVkQWN0aW9uc01hcCxcbiAgR2V0Um9sZUtleU9wdGlvbnMsXG59IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBLZXksIFNpZ25lclNlc3Npb25JbmZvIH0gZnJvbSBcIi5cIjtcblxudHlwZSBOYW1lT3JBZGRyZXNzT3JOdWxsID0gc3RyaW5nIHwgbnVsbDtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIEVWTSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogbnVsbCB9XG4gKiBAZXhhbXBsZSB7IFR4UmVjZWl2ZXI6IFtudWxsLCBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiXSB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4UmVjZWl2ZXIgPSB7IFR4UmVjZWl2ZXI6IE5hbWVPckFkZHJlc3NPck51bGwgfCBOYW1lT3JBZGRyZXNzT3JOdWxsW10gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIFNVSSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBTdWlUeFJlY2VpdmVyOiBbIFwiMHhjOTgzN2EwYWQyZDExNDY4YmJmODQ3ZTNhZjRlM2VkZTgzN2JjYzAyYTFiZTZmYWVlNjIxZGYxYThhNDAzY2JmXCIgXSB9XG4gKi9cbmV4cG9ydCB0eXBlIFN1aVR4UmVjZWl2ZXJzID0geyBTdWlUeFJlY2VpdmVyczogc3RyaW5nW10gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIEJUQyB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBCdGNUeFJlY2VpdmVyczogWyBcImJjMXEzcWRhdmwzN2RuajZoanVhemR6ZHhrMGFhbndqc2c0NG1ndXE2NlwiLCBcImJjMXFmcmp0eG04ZzIwZzk3cXpnYWRnN3Y5czNmdGprcTAycWZzc2s4N1wiIF0gfVxuICovXG5leHBvcnQgdHlwZSBCdGNUeFJlY2VpdmVycyA9IHsgQnRjVHhSZWNlaXZlcnM6IHN0cmluZ1tdIH07XG5cbi8qKiBUaGUga2luZCBvZiBkZXBvc2l0IGNvbnRyYWN0cy4gKi9cbmV4cG9ydCBlbnVtIERlcG9zaXRDb250cmFjdCB7XG4gIC8qKiBDYW5vbmljYWwgZGVwb3NpdCBjb250cmFjdCAqL1xuICBDYW5vbmljYWwsXG4gIC8qKiBXcmFwcGVyIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgV3JhcHBlcixcbn1cblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0ID0gVHhEZXBvc2l0QmFzZSB8IFR4RGVwb3NpdFB1YmtleSB8IFR4RGVwb3NpdFJvbGU7XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRCYXNlID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0IH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCB3aXRoIGZpeGVkIHZhbGlkYXRvciAocHVia2V5KTpcbiAqXG4gKiBAZXhhbXBsZSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXNwb3NpdENvbnRyYWN0LkNhbm9uaWNhbCwgdmFsaWRhdG9yOiB7IHB1YmtleTogXCI4ODc5Li4uOFwifSB9fVxuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRQdWJrZXkgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHB1YmtleTogc3RyaW5nIH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCB3aXRoIGFueSB2YWxpZGF0b3Iga2V5IGluIGEgcm9sZTpcbiAqXG4gKiBAZXhhbXBsZSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXNwb3NpdENvbnRyYWN0LkNhbm9uaWNhbCwgdmFsaWRhdG9yOiB7IHJvbGVfaWQ6IFwiUm9sZSNjNjMuLi5hZlwifSB9fVxuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRSb2xlID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0OyByb2xlX2lkOiBzdHJpbmcgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdCBpbiB3ZWkuXG4gKiBDdXJyZW50bHksIHRoaXMgb25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdCA9IFR4VmFsdWVMaW1pdFBlclR4IHwgVHhWYWx1ZUxpbWl0V2luZG93O1xuXG4vKipcbiAqIFJlc3RyaWN0IGluZGl2aWR1YWwgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0IGluIHdlaS5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogXCIweDEyQTA1RjIwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0UGVyVHggPSB7IFR4VmFsdWVMaW1pdDogc3RyaW5nIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzLCBpbiB3ZWksIG92ZXIgYSB0aW1lIHdpbmRvdy5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDg2NDAwIH19XG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDYwNDgwMCwgY2hhaW5faWRzOiBbIFwiMVwiLCBcIjVcIiBdIH19XG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDYwNDgwMCwgZXhjZXB0X2NoYWluX2lkczogWyBcIjFcIiBdIH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdFdpbmRvdyA9IHtcbiAgVHhWYWx1ZUxpbWl0OiB7XG4gICAgLyoqXG4gICAgICogTWF4IGFsbG93ZWQgdmFsdWUgaW4gd2VpXG4gICAgICovXG4gICAgbGltaXQ6IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBPcHRpb25hbCBzbGlkaW5nIHRpbWUgd2luZG93IChpbiBzZWNvbmRzKS5cbiAgICAgKlxuICAgICAqIElmIHNwZWNpZmllZCwgdGhlIGBsaW1pdGAgYXBwbGllcyB0byB0aGUgYWdncmVnYXRlIHZhbHVlIG9mIGFsbCB0cmFuc2FjdGlvbnMgd2l0aGluIHRoYXRcbiAgICAgKiB0aW1lIHdpbmRvdzsgb3RoZXJ3aXNlLCB0aGUgd2luZG93IGlzIDAsIGkuZS4sIHRoZSBsaW1pdCBhcHBsaWVzIHRvIGluZGl2aWR1YWwgdHJhbnNhY3Rpb25zLlxuICAgICAqL1xuICAgIHdpbmRvdz86IG51bWJlcjtcbiAgICAvKipcbiAgICAgKiBPcHRpb25hbCBjaGFpbiBpZHMuXG4gICAgICpcbiAgICAgKiBJZiBzcGVjaWZpZWQsIHRoZSBwb2xpY3kgYXBwbGllcyBvbmx5IGlmIGEgdHJhbnNhY3Rpb24gaXMgb24gb25lIG9mIHRoZVxuICAgICAqIGdpdmVuIGNoYWlucyAob3RoZXJ3aXNlIGl0IGFwcGxpZXMgdG8gYWxsIHRyYW5zYWN0aW9ucykuIElmIGEgJ3dpbmRvdycgaXNcbiAgICAgKiBhbHNvIGRlZmluZWQsIHRoZSBwb2xpY3kgbGltaXQgYXBwbGllcyBjdW11bGF0aXZlbHkgYWNyb3NzIGFsbCBzcGVjaWZpZWQgY2hhaW5zLlxuICAgICAqXG4gICAgICogTXVzdCBub3QgYmUgc3BlY2lmaWVkIHRvZ2V0aGVyIHdpdGggYGV4Y2VwdF9jaGFpbl9pZHNgLlxuICAgICAqL1xuICAgIGNoYWluX2lkcz86IHN0cmluZ1tdO1xuICAgIC8qKlxuICAgICAqIE9wdGlvbmFsIGNoYWluIGlkcyB0byBleGNsdWRlLlxuICAgICAqXG4gICAgICogSWYgc3BlY2lmaWVkLCB0aGUgcG9saWN5IGFwcGxpZXMgb25seSBpZiBhIHRyYW5zYWN0aW9uIGlzIG9uIGEgY2hhaW4gaWQgbm90XG4gICAgICogaW5jbHVkZWQgaW4gdGhpcyBsaXN0LiBJZiBhICd3aW5kb3cnIGlzIGFsc28gZGVmaW5lZCwgdGhlIHBvbGljeSBsaW1pdCBhcHBsaWVzXG4gICAgICogY3VtdWxhdGl2ZWx5IGFjcm9zcyBhbGwgY2hhaW5zIG90aGVyIHRoYW4gdGhlIGxpc3RlZCBvbmVzLlxuICAgICAqXG4gICAgICogTXVzdCBub3QgYmUgc3BlY2lmaWVkIHRvZ2V0aGVyIHdpdGggYGNoYWluX2lkc2AuXG4gICAgICovXG4gICAgZXhjZXB0X2NoYWluX2lkcz86IHN0cmluZ1tdO1xuICB9O1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiBtYXggZ2FzIGNvc3RzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0IGluIHdlaS5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4R2FzQ29zdExpbWl0OiBcIjB4MjdDQTU3MzU3QzAwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhHYXNDb3N0TGltaXQgPSB7IFR4R2FzQ29zdExpbWl0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgbWV0aG9kIGNhbGxzIGFjY29yZGluZyB0byB0aGUge0BsaW5rIEVyYzIwUG9saWN5fS5cbiAqIE9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zIHRoYXQgY2FsbCBhIHZhbGlkIEVSQy0yMCBtZXRob2QuXG4gKiBOb24tRVJDLTIwIHRyYW5zYWN0aW9ucyBhcmUgaWdub3JlZCBieSB0aGlzIHBvbGljeS5cbiAqXG4gKiBAZXhhbXBsZSB7IElmRXJjMjBUeDogeyB0cmFuc2Zlcl9saW1pdHM6IFt7IGxpbWl0OiBcIjB4RThENEE1MTAwMFwiIH1dIH0gfVxuICogQGV4YW1wbGUgeyBJZkVyYzIwVHg6IHsgYWxsb3dlZF9jb250cmFjdHM6IFsgeyBhZGRyZXNzOiBcIjB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAzNGEyMGI4MDkwMDhhZmViMFwiLCBcImNoYWluX2lkXCI6IFwiMVwiIH0gXSB9IH1cbiAqL1xuZXhwb3J0IHR5cGUgSWZFcmMyMFR4ID0geyBJZkVyYzIwVHg6IEVyYzIwUG9saWN5IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIG9ubHkgYWxsb3cgdmFsaWQgRVJDLTIwIG1ldGhvZCBjYWxscy5cbiAqL1xuZXhwb3J0IHR5cGUgQXNzZXJ0RXJjMjBUeCA9IFwiQXNzZXJ0RXJjMjBUeFwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBvbmx5IGFsbG93IG5hdGl2ZSB0b2tlbiB0cmFuc2ZlcnMuXG4gKi9cbmV4cG9ydCB0eXBlIEFzc2VydFRyYW5zZmVyT25seVR4ID0gXCJBc3NlcnRUcmFuc2Zlck9ubHlUeFwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IEVSQy0yMCBgdHJhbnNmZXJgIGFuZCBgdHJhbnNmZXJGcm9tYCB0cmFuc2FjdGlvbiB2YWx1ZXMgYW5kIHJlY2VpdmVycy5cbiAqIE9ubHkgYXBwbGllcyB0byBjb250cmFjdHMgZGVmaW5lZCBpbiBgYXBwbGllc190b19jb250cmFjdHNgLFxuICogb3IgdG8gYWxsIGNvbnRyYWN0cyBpZiBub3QgZGVmaW5lZC5cbiAqIFRoZSBsaW1pdCBpcyBpbiB0aGUgdG9rZW4ncyB1bml0LlxuICovXG5leHBvcnQgdHlwZSBFcmMyMFRyYW5zZmVyTGltaXQgPSB7XG4gIGxpbWl0Pzogc3RyaW5nO1xuICByZWNlaXZlcnM/OiBzdHJpbmdbXTtcbiAgYXBwbGllc190b19jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgRVJDLTIwIGBhcHByb3ZlYCB0cmFuc2FjdGlvbiB2YWx1ZXMgYW5kIHNwZW5kZXJzLlxuICogT25seSBhcHBsaWVzIHRvIGNvbnRyYWN0cyBkZWZpbmVkIGluIGBhcHBsaWVzX3RvX2NvbnRyYWN0c2AsXG4gKiBvciB0byBhbGwgY29udHJhY3RzIGlmIG5vdCBkZWZpbmVkLlxuICogVGhlIGxpbWl0IGlzIGluIHRoZSB0b2tlbidzIHVuaXQuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwQXBwcm92ZUxpbWl0ID0ge1xuICBsaW1pdD86IHN0cmluZztcbiAgc3BlbmRlcnM/OiBzdHJpbmdbXTtcbiAgYXBwbGllc190b19jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3RzIEVSQy0yMCBwb2xpY2llcyB0byBhIHNldCBvZiBrbm93biBjb250cmFjdHMsXG4gKiBhbmQgY2FuIGRlZmluZSBsaW1pdHMgb24gYHRyYW5zZmVyYCwgYHRyYW5zZmVyRnJvbWAgYW5kIGBhcHByb3ZlYCBtZXRob2QgY2FsbHMuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwUG9saWN5ID0ge1xuICBhbGxvd2VkX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xuICB0cmFuc2Zlcl9saW1pdHM/OiBFcmMyMFRyYW5zZmVyTGltaXRbXTtcbiAgYXBwcm92ZV9saW1pdHM/OiBFcmMyMEFwcHJvdmVMaW1pdFtdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gb25seSBhbGxvdyBjYWxsaW5nIHRoZSBnaXZlbiBtZXRob2RzIGluIHRoZSBnaXZlbiBjb250cmFjdHMuXG4gKlxuICogQGV4YW1wbGUgeyBBc3NlcnRDb250cmFjdFR4OiB7XG4gKiAgIGFsbG93bGlzdDogW3tcbiAqICAgICBhZGRyZXNzOiB7IGFkZHJlc3M6IFwiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDM0YTIwYjgwOTAwOGFmZWIwXCIsIFwiY2hhaW5faWRcIjogXCIxXCIgfSxcbiAqICAgICBtZXRob2RzOiBbXG4gKiAgICAgICBcImZ1bmN0aW9uIG5hbWUoKSBwdWJsaWMgdmlldyByZXR1cm5zIChzdHJpbmcpXCIsXG4gKiAgICAgICBcImZ1bmN0aW9uIHRyYW5zZmVyKGFkZHJlc3MgdG8sIHVpbnQyNTYgdmFsdWUpIHB1YmxpYyByZXR1cm5zIChib29sIHN1Y2Nlc3MpXCJcbiAqICAgICBdXG4gKiAgIH1dXG4gKiB9XG4gKi9cbmV4cG9ydCB0eXBlIEFzc2VydENvbnRyYWN0VHggPSB7XG4gIEFzc2VydENvbnRyYWN0VHg6IHtcbiAgICBhbGxvd2xpc3Q6IHtcbiAgICAgIGFkZHJlc3M6IENvbnRyYWN0QWRkcmVzcztcbiAgICAgIG1ldGhvZHM6IHN0cmluZ1tdO1xuICAgIH1bXTtcbiAgfTtcbn07XG5cbi8qKlxuICogU29sYW5hIGFkZHJlc3MgbWF0Y2hlci5cbiAqIENhbiBiZSBlaXRoZXIgdGhlIHB1YmtleSBvZiB0aGUgYWNjb3VudCB1c2luZyBiYXNlNTggZW5jb2RpbmcsXG4gKiBvciB0aGUgaW5kZXggb2YgdGhlIHB1YmtleSBvZiBhbiBhZGRyZXNzIGxvb2t1cCB0YWJsZSBhbmQgdGhlXG4gKiBpbmRleCBvZiB0aGUgYWNjb3VudCBpbiB0aGF0IHRhYmxlLlxuICovXG5leHBvcnQgdHlwZSBTb2xhbmFBZGRyZXNzTWF0Y2hlciA9XG4gIHwgc3RyaW5nXG4gIHwge1xuICAgICAgYWx0X2FkZHJlc3M6IHN0cmluZztcbiAgICAgIGluZGV4OiBudW1iZXI7XG4gICAgfTtcblxuLyoqXG4gKiBTb2xhbmEgaW5zdHJ1Y3Rpb24gbWF0Y2hlci5cbiAqL1xuZXhwb3J0IHR5cGUgU29sYW5hSW5zdHJ1Y3Rpb25NYXRjaGVyID0ge1xuICBwcm9ncmFtX2lkOiBzdHJpbmc7XG4gIGluZGV4PzogbnVtYmVyO1xuICBhY2NvdW50cz86IChcbiAgICB8IHtcbiAgICAgICAgYWRkcmVzczogU29sYW5hQWRkcmVzc01hdGNoZXIgfCBTb2xhbmFBZGRyZXNzTWF0Y2hlcltdO1xuICAgICAgfVxuICAgIHwgKHtcbiAgICAgICAgLyoqIEBkZXByZWNhdGVkIHVzZSBgYWRkcmVzc2AgaW5zdGVhZC4gKi9cbiAgICAgICAgcHVia2V5OiBzdHJpbmc7XG4gICAgICB9ICYge1xuICAgICAgICBpbmRleDogbnVtYmVyO1xuICAgICAgfSlcbiAgKVtdO1xuICBkYXRhPzpcbiAgICB8IHN0cmluZ1xuICAgIHwge1xuICAgICAgICBkYXRhOiBzdHJpbmc7XG4gICAgICAgIHN0YXJ0X2luZGV4OiBudW1iZXI7XG4gICAgICB9W107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0cyBTb2xhbmEgdHJhbnNhY3Rpb24gaW5zdHJ1Y3Rpb25zLiBDYW4gbGltaXQgdGhlIG51bWJlciBvZiBpbnN0cnVjdGlvbnMsXG4gKiB0aGUgbGlzdCBvZiBhbGxvd2VkIGluc3RydWN0aW9ucywgYW5kIGEgc2V0IG9mIHJlcXVpcmVkIGluc3RydWN0aW9ucyBpbiBhbGwgdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgdHlwZSBTb2xhbmFJbnN0cnVjdGlvblBvbGljeSA9IHtcbiAgU29sYW5hSW5zdHJ1Y3Rpb25Qb2xpY3k6IHtcbiAgICBjb3VudD86IHtcbiAgICAgIG1pbj86IG51bWJlcjtcbiAgICAgIG1heD86IG51bWJlcjtcbiAgICB9O1xuICAgIGFsbG93bGlzdD86IFNvbGFuYUluc3RydWN0aW9uTWF0Y2hlcltdO1xuICAgIHJlcXVpcmVkPzogU29sYW5hSW5zdHJ1Y3Rpb25NYXRjaGVyW107XG4gIH07XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSB0b3RhbCB2YWx1ZSB0cmFuc2ZlcnJlZCBvdXQgb2YgdGhlIGlucHV0cyBpbiBhIEJpdGNvaW4gU2Vnd2l0IHRyYW5zYWN0aW9uXG4gKiB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdC5cbiAqL1xuZXhwb3J0IHR5cGUgQnRjU2Vnd2l0VmFsdWVMaW1pdCA9IEJ0Y1NlZ3dpdFZhbHVlTGltaXRQZXJUeCB8IEJ0Y1NlZ3dpdFZhbHVlTGltaXRXaW5kb3c7XG5cbi8qKlxuICogUmVzdHJpY3QgaW5kaXZpZHVhbCBCaXRjb2luIFNlZ3dpdCB0cmFuc2FjdGlvbiB2YWx1ZXMgdG8gYW1vdW50cyBhdCBvciBiZWxvd1xuICogdGhlIGdpdmVuIGxpbWl0LlxuICpcbiAqIEBleGFtcGxlIHsgQnRjU2Vnd2l0VmFsdWVMaW1pdDogXCIxMDAwMDAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBCdGNTZWd3aXRWYWx1ZUxpbWl0UGVyVHggPSB7XG4gIEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IG51bWJlcjtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHRvdGFsIHZhbHVlIHRyYW5zZmVycmVkIG91dCBvZiB0aGUgaW5wdXRzIGluIEJpdGNvaW4gU2Vnd2l0IHRyYW5zYWN0aW9uc1xuICogb3ZlciBhIHRpbWUgd2luZG93LlxuICpcbiAqIEBleGFtcGxlIHsgQnRjU2Vnd2l0VmFsdWVMaW1pdDogeyBsaW1pdDogXCIxMDAwMDAwXCIsIHdpbmRvdzogODY0MDAgfX1cbiAqL1xuZXhwb3J0IHR5cGUgQnRjU2Vnd2l0VmFsdWVMaW1pdFdpbmRvdyA9IHtcbiAgQnRjU2Vnd2l0VmFsdWVMaW1pdDoge1xuICAgIGxpbWl0OiBudW1iZXI7XG4gICAgd2luZG93PzogbnVtYmVyO1xuICB9O1xufTtcblxuLyoqXG4gKiBPbmx5IGFsbG93IGNvbm5lY3Rpb25zIGZyb20gY2xpZW50cyB3aG9zZSBJUCBhZGRyZXNzZXMgbWF0Y2ggYW55IG9mIHRoZXNlIElQdjQgQ0lEUiBibG9ja3MuXG4gKlxuICogQGV4YW1wbGUgeyBTb3VyY2VJcEFsbG93bGlzdDogWyBcIjEyMy40NTYuNzguOS8xNlwiIF0gfVxuICovXG5leHBvcnQgdHlwZSBTb3VyY2VJcEFsbG93bGlzdCA9IHsgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdIH07XG5cbi8qKlxuICogTUZBIHBvbGljeVxuICpcbiAqIEBleGFtcGxlIHtcbiAqIHtcbiAqICAgY291bnQ6IDEsXG4gKiAgIG51bV9hdXRoX2ZhY3RvcnM6IDEsXG4gKiAgIGFsbG93ZWRfbWZhX3R5cGVzOiBbIFwiVG90cFwiIF0sXG4gKiAgIGFsbG93ZWRfYXBwcm92ZXJzOiBbIFwiVXNlciMxMjNcIiBdLFxuICogfVxuICovXG5leHBvcnQgdHlwZSBNZmFQb2xpY3kgPSB7XG4gIGNvdW50PzogbnVtYmVyO1xuICBudW1fYXV0aF9mYWN0b3JzPzogbnVtYmVyO1xuICBhbGxvd2VkX2FwcHJvdmVycz86IHN0cmluZ1tdO1xuICBhbGxvd2VkX21mYV90eXBlcz86IE1mYVR5cGVbXTtcbiAgcmVzdHJpY3RlZF9vcGVyYXRpb25zPzogT3BlcmF0aW9uS2luZFtdO1xuICAvKiogTGlmZXRpbWUgaW4gc2Vjb25kcywgZGVmYXVsdHMgdG8gOTAwICgxNSBtaW51dGVzKSAqL1xuICBsaWZldGltZT86IG51bWJlcjtcbiAgLyoqXG4gICAqIEhvdyB0byBjb21wYXJlIEhUVFAgcmVxdWVzdHMgd2hlbiB2ZXJpZnlpbmcgdGhlIE1GQSByZWNlaXB0LlxuICAgKiBUaGlzIHNwZWNpZmllcyBob3cgd2UgY2hlY2sgZXF1YWxpdHkgYmV0d2VlbiAoMSkgdGhlIEhUVFAgcmVxdWVzdCB3aGVuIHRoZSAyMDIgKE1GQSByZXF1aXJlZClcbiAgICogcmVzcG9uc2UgaXMgcmV0dXJuZWQgYW5kICgyKSB0aGUgSFRUUCByZXF1ZXN0IHdoZW4gdGhlIGNvcnJlc3BvbmQgTUZBIHJlY2VpcHQgaXMgdXNlZC5cbiAgICovXG4gIHJlcXVlc3RfY29tcGFyZXI/OiBIdHRwUmVxdWVzdENvbXBhcmVyO1xuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiB0aW1lIGluIHNlY29uZHMgYmVmb3JlIGFuIE1GQSByZWNlaXB0IGNhbiBiZSByZWRlZW1lZC5cbiAgICogRGVmYXVsdHMgdG8gMCwgaS5lLiwgbm8gZGVsYXkuIEFwcHJvdmVycyBjYW4gdm90ZSB0byBhcHByb3ZlIG9yIHZldG9cbiAgICogYmVmb3JlIHRoZSBkZWxheSBleHBpcmVzLiBBZnRlciBhcHByb3ZpbmcsIGl0IGlzIHN0aWxsIHBvc3NpYmxlIGZvclxuICAgKiBhbnlvbmUgdG8gdmV0byB0aGUgcmVxdWVzdCB1bnRpbCB0aGUgZGVsYXkgZXhwaXJlcyBhbmQgdGhlIHJlY2VpcHRcbiAgICogaXMgcmVkZWVtZWQuXG4gICAqL1xuICB0aW1lX2RlbGF5PzogbnVtYmVyO1xufTtcblxuZXhwb3J0IHR5cGUgSHR0cFJlcXVlc3RDb21wYXJlciA9IFwiRXFcIiB8IHsgRXZtVHg6IEV2bVR4Q21wIH0gfCB7IFNvbGFuYVR4OiBTb2xhbmFUeENtcCB9O1xuXG4vKipcbiAqIFJlcXVpcmUgTUZBIGZvciB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUge1xuICogICAgIFJlcXVpcmVNZmE6IHtcbiAqICAgICAgIGNvdW50OiAxLFxuICogICAgICAgYWxsb3dlZF9tZmFfdHlwZXM6IFsgXCJUb3RwXCIgXSxcbiAqICAgICAgIGFsbG93ZWRfYXBwcm92ZXJzOiBbIFwiVXNlciMxMjNcIiBdLFxuICogICAgICAgcmVzdHJpY3RlZF9vcGVyYXRpb25zOiBbXG4gKiAgICAgICAgIFwiRXRoMVNpZ25cIixcbiAqICAgICAgICAgXCJCbG9iU2lnblwiXG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICB9XG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVNZmEgPSB7XG4gIFJlcXVpcmVNZmE6IE1mYVBvbGljeTtcbn07XG5cbi8qKlxuICogUmVxdWlyZSB0aGF0IHRoZSBrZXkgaXMgYWNjZXNzZWQgdmlhIGEgcm9sZSBzZXNzaW9uLlxuICpcbiAqIEBleGFtcGxlIHsgXCJSZXF1aXJlUm9sZVNlc3Npb25cIjogXCIqXCIgfVxuICogQGV4YW1wbGUgeyBcIlJlcXVpcmVSb2xlU2Vzc2lvblwiOiBbXG4gKiAgIFwiUm9sZSMzNGRmYjY1NC1mMzZkLTQ4ZWEtYmRmNi04MzNjMGQ5NGI3NTlcIixcbiAqICAgXCJSb2xlIzk4ZDg3NjMzLWQxYTctNDYxMi1iNmI0LWIyZmEyYjQzY2QzZFwiXG4gKiBdfVxuICovXG5leHBvcnQgdHlwZSBSZXF1aXJlUm9sZVNlc3Npb24gPSB7XG4gIC8qKiBSZXF1aXJlIGVpdGhlciBhbnkgcm9sZSBzZXNzaW9uIG9yIGFueSBvbmUgb2YgdGhlIGFwcHJvdmVkIHJvbGVzICovXG4gIFJlcXVpcmVSb2xlU2Vzc2lvbjogXCIqXCIgfCBzdHJpbmdbXTtcbn07XG5cbi8qKlxuICogRm9yd2FyZHMgdGhlIHJlcXVlc3QgcGFyYW1ldGVycyB0byB0aGlzIHdlYmhvb2sgd2hpY2ggZGV0ZXJtaW5lc1xuICogd2hldGhlciB0aGUgcmVxdWVzdCBpcyBhbGxvd2VkIHRvIGJlIGV4ZWN1dGVkLlxuICovXG5leHBvcnQgdHlwZSBXZWJob29rUG9saWN5ID0ge1xuICBXZWJob29rOiB7XG4gICAgLyoqIFRoZSB1cmwgb2YgdGhlIHdlYmhvb2sgKi9cbiAgICB1cmw6IHN0cmluZztcblxuICAgIC8qKiBPcHRpb25hbCBIVFRQIG1ldGhvZCB0byB1c2UuIERlZmF1bHRzIHRvIFBPU1QuICovXG4gICAgbWV0aG9kPzogc3RyaW5nO1xuXG4gICAgLyoqIE9wdGlvbmFsIEhUVFAgaGVhZGVycyB0byBzZXQgKi9cbiAgICBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgZXhlY3V0aW9uIHRpbWVvdXQgaW4gc2Vjb25kczsgbXVzdCBiZSBhdCBsZWFzdCAxIG5vdCBleGNlZWQgNSBzZWNvbmRzLlxuICAgICAqIERlZmF1bHRzIHRvIDUuXG4gICAgICovXG4gICAgdGltZW91dD86IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIEN1YmVTaWduZXIgb3BlcmF0aW9ucyB0byB3aGljaCB0aGlzIHBvbGljeSBzaG91bGQgYXBwbHkuXG4gICAgICogV2hlbiBvbWl0dGVkLCBhcHBsaWVzIHRvIGFsbCBvcGVyYXRpb25zLlxuICAgICAqL1xuICAgIHJlc3RyaWN0ZWRfb3BlcmF0aW9ucz86IE9wZXJhdGlvbktpbmRbXTtcbiAgfTtcbn07XG5cbi8qKiBCYWJ5bG9uIHN0YWtpbmcgcG9saWN5ICovXG5leHBvcnQgdHlwZSBCYWJ5bG9uU3Rha2luZyA9IHtcbiAgQmFieWxvblN0YWtpbmc6IHtcbiAgICAvKipcbiAgICAgKiBQdWJsaWMga2V5cyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdGFraW5nLiBNdXN0IGJlIGRlZmluZWQgaWYgdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkXG4gICAgICogdG8gYSBTZWdXaXQga2V5OyBvdGhlcndpc2UsIGlmIGB1bmRlZmluZWRgLCBvbmx5IHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZ1xuICAgICAqIGFwcGxpZWQgY2FuIGJlIHVzZWQgYXMgdGhlIHN0YWtpbmcgcHVibGljIGtleSB3aGVuIGNyZWF0aW5nIEJhYnlsb24tcmVsYXRlZCB0cmFuc2FjdGlvbnMuXG4gICAgICpcbiAgICAgKiBIZXgtZW5jb2RlZCBwdWJsaWMga2V5cywgV0lUSE9VVCB0aGUgbGVhZGluZyAnMHgnLlxuICAgICAqL1xuICAgIGFsbG93ZWRfc3Rha2VyX3Brcz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogRmluYWxpdHkgcHJvdmlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHN0YWtpbmcuIElmIGB1bmRlZmluZWRgLCBhbnkgZmluYWxpdHlcbiAgICAgKiBwcm92aWRlciBjYW4gYmUgdXNlZC5cbiAgICAgKlxuICAgICAqIEhleC1lbmNvZGVkIHB1YmxpYyBrZXlzLCBXSVRIT1VUIHRoZSBsZWFkaW5nICcweCcuXG4gICAgICovXG4gICAgYWxsb3dlZF9maW5hbGl0eV9wcm92aWRlcl9wa3M/OiBzdHJpbmdbXTtcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBhZGRyZXNzZXMgdGhhdCBjYW4gYmUgdXNlZCBpbiBzdGFraW5nIHRyYW5zYWN0aW9ucy4gSWYgYHVuZGVmaW5lZGAsIG9ubHlcbiAgICAgKiB0aGUga2V5IHRvIHdoaWNoIHRoZSBwb2xpY3kgaXMgYmVpbmcgYXBwbGllZCBjYW4gYmUgdXNlZCBhcyB0aGUgY2hhbmdlIGFkZHJlc3MuXG4gICAgICovXG4gICAgYWxsb3dlZF9jaGFuZ2VfYWRkcnM/OiBzdHJpbmdbXTtcblxuICAgIC8qKlxuICAgICAqIFdpdGhkcmF3YWwgYWRkcmVzc2VzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2l0aGRyYXdhbCB0eG5zLiBJZiBgdW5kZWZpbmVkYCwgb25seVxuICAgICAqIHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkIGNhbiBiZSB1c2VkIGFzIHRoZSB3aXRoZHJhd2FsIGFkZHJlc3MuXG4gICAgICovXG4gICAgYWxsb3dlZF93aXRoZHJhd2FsX2FkZHJzPzogc3RyaW5nW107XG5cbiAgICAvKiogQmFieWxvbiBuZXR3b3JrcyB0aGF0IHRoaXMga2V5IGNhbiBiZSB1c2VkIHdpdGguIElmIGB1bmRlZmluZWRgLCBhbnkgbmV0d29yay4gKi9cbiAgICBhbGxvd2VkX25ldHdvcmtfaWRzPzogQmFieWxvblN0YWtpbmdSZXF1ZXN0W1wibmV0d29ya1wiXVtdO1xuXG4gICAgLyoqXG4gICAgICogTWF4IGZlZSBhbGxvd2VkIGluIGEgc3Rha2luZyBvciB3aXRoZHJhd2FsIHR4bi4gSWYgYHVuZGVmaW5lZGAsIHRoZXJlIGlzIG5vIGZlZSBsaW1pdC5cbiAgICAgKiBOb3RlIHRoYXQgdGhlIGZlZSBmb3Igdm9sdW50YXJ5IHVuYm9uZGluZyBhbmQgc2xhc2hpbmcgYXJlIGZpeGVkIGJ5IHRoZSBCYWJ5bG9uXG4gICAgICogcGFyYW1zLCBhbmQgdGhpcyBsaW1pdCBpcyBub3QgZW5mb3JjZWQgaW4gdGhvc2UgY2FzZXMuXG4gICAgICovXG4gICAgbWF4X2ZlZT86IG51bWJlcjtcblxuICAgIC8qKiBNaW4gc3Rha2luZyB0aW1lIGluIHNlY29uZHMuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1pbl9sb2NrX3RpbWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4IHN0YWtpbmcgdGltZSBpbiBzZWNvbmRzLiBJZiBgdW5kZWZpbmVkYCwgdXNlcyB0aGUgbGltaXQgZGVmaW5lZCBieSB0aGUgQmFieWxvbiBzdGFraW5nIHBhcmFtcy4gKi9cbiAgICBtYXhfbG9ja190aW1lPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbiBzdGFraW5nIGFtb3VudCBpbiBTQVQuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1pbl9zdGFraW5nX3ZhbHVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1heCBzdGFraW5nIGFtb3VudCBpbiBTQVQuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1heF9zdGFraW5nX3ZhbHVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbmltdW0gbmV0d29yayBwYXJhbWV0ZXJzIHZlcnNpb24gYWxsb3dlZC4gKi9cbiAgICBtaW5fcGFyYW1zX3ZlcnNpb24/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4aW11bSBuZXR3b3JrIHBhcmFtZXRlcnMgdmVyc2lvbiBhbGxvd2VkLiAqL1xuICAgIG1heF9wYXJhbXNfdmVyc2lvbj86IG51bWJlcjtcbiAgfTtcbn07XG5cbi8qKiBBbGxvdyByYXcgYmxvYiBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dSYXdCbG9iU2lnbmluZyA9IFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dSYXdCbG9iU2lnbmluZyA9IHR5cGVvZiBBbGxvd1Jhd0Jsb2JTaWduaW5nO1xuXG4vKiogQWxsb3cgRGlmZmllLUhlbGxtYW4gZXhjaGFuZ2UgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0RpZmZpZUhlbGxtYW5FeGNoYW5nZSA9IFwiQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2VcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93RGlmZmllSGVsbG1hbkV4Y2hhbmdlID0gdHlwZW9mIEFsbG93RGlmZmllSGVsbG1hbkV4Y2hhbmdlO1xuXG4vKiogQWxsb3cgRUlQLTE5MSBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dFaXAxOTFTaWduaW5nID0gXCJBbGxvd0VpcDE5MVNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93RWlwMTkxU2lnbmluZyA9IHR5cGVvZiBBbGxvd0VpcDE5MVNpZ25pbmc7XG5cbi8qKiBBbGxvdyBFSVAtNzEyIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0VpcDcxMlNpZ25pbmcgPSBcIkFsbG93RWlwNzEyU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dFaXA3MTJTaWduaW5nID0gdHlwZW9mIEFsbG93RWlwNzEyU2lnbmluZztcblxuLyoqIEFsbG93IEJUQyBtZXNzYWdlIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nID0gXCJBbGxvd0J0Y01lc3NhZ2VTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nID0gdHlwZW9mIEFsbG93QnRjTWVzc2FnZVNpZ25pbmc7XG5cbi8qKiBBIHJlZmVyZW5jZSB0byBhbiBvcmctbGV2ZWwgbmFtZWQgcG9saWN5IGFuZCBpdHMgdmVyc2lvbiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5UmVmZXJlbmNlID0gYCR7c3RyaW5nfS92JHtudW1iZXJ9YCB8IGAke3N0cmluZ30vbGF0ZXN0YDtcblxuLyoqIEtleSBwb2xpY2llcyB0aGF0IHJlc3RyaWN0IHRoZSByZXF1ZXN0cyB0aGF0IHRoZSBzaWduaW5nIGVuZHBvaW50cyBhY2NlcHQgKi9cbmV4cG9ydCB0eXBlIEtleURlbnlQb2xpY3kgPVxuICB8IFR4UmVjZWl2ZXJcbiAgfCBUeERlcG9zaXRcbiAgfCBUeFZhbHVlTGltaXRcbiAgfCBUeEdhc0Nvc3RMaW1pdFxuICB8IElmRXJjMjBUeFxuICB8IEFzc2VydEVyYzIwVHhcbiAgfCBBc3NlcnRUcmFuc2Zlck9ubHlUeFxuICB8IEFzc2VydENvbnRyYWN0VHhcbiAgfCBTdWlUeFJlY2VpdmVyc1xuICB8IEJ0Y1R4UmVjZWl2ZXJzXG4gIHwgU291cmNlSXBBbGxvd2xpc3RcbiAgfCBTb2xhbmFJbnN0cnVjdGlvblBvbGljeVxuICB8IEJ0Y1NlZ3dpdFZhbHVlTGltaXRcbiAgfCBSZXF1aXJlTWZhXG4gIHwgUmVxdWlyZVJvbGVTZXNzaW9uXG4gIHwgQmFieWxvblN0YWtpbmdcbiAgfCBXZWJob29rUG9saWN5O1xuXG4vKipcbiAqIEtleSBwb2xpY3lcbiAqXG4gKiBAZXhhbXBsZSBbXG4gKiAgIHtcbiAqICAgICBcIlR4UmVjZWl2ZXJcIjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIlxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJUeERlcG9zaXRcIjoge1xuICogICAgICAgXCJraW5kXCI6IFwiQ2Fub25pY2FsXCJcbiAqICAgICB9XG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlJlcXVpcmVNZmFcIjoge1xuICogICAgICAgXCJjb3VudFwiOiAxLFxuICogICAgICAgXCJhbGxvd2VkX21mYV90eXBlc1wiOiBbXCJDdWJlU2lnbmVyXCJdLFxuICogICAgICAgXCJyZXN0cmljdGVkX29wZXJhdGlvbnNcIjogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICogXVxuICpcbiAqIEBleGFtcGxlIFtcIkFzc2VydEVyYzIwVHhcIiwgeyBcIklmRXJjMjBUeFwiOiBcInRyYW5zZmVyX2xpbWl0c1wiOiBbIHsgXCJsaW1pdFwiOiBcIjB4M0I5QUNBMDBcIiB9IF0gfV1cbiAqL1xuZXhwb3J0IHR5cGUgS2V5UG9saWN5ID0gS2V5UG9saWN5UnVsZVtdO1xuXG5leHBvcnQgdHlwZSBLZXlQb2xpY3lSdWxlID1cbiAgfCBLZXlEZW55UG9saWN5XG4gIHwgQWxsb3dSYXdCbG9iU2lnbmluZ1xuICB8IEFsbG93RGlmZmllSGVsbG1hbkV4Y2hhbmdlXG4gIHwgQWxsb3dFaXAxOTFTaWduaW5nXG4gIHwgQWxsb3dFaXA3MTJTaWduaW5nXG4gIHwgQWxsb3dCdGNNZXNzYWdlU2lnbmluZ1xuICB8IFBvbGljeVJlZmVyZW5jZTtcblxuLyoqIFJvbGUgcG9saWN5ICovXG5leHBvcnQgdHlwZSBSb2xlUG9saWN5ID0gUm9sZVBvbGljeVJ1bGVbXTtcblxuZXhwb3J0IHR5cGUgUm9sZVBvbGljeVJ1bGUgPSBLZXlEZW55UG9saWN5IHwgUG9saWN5UmVmZXJlbmNlO1xuXG4vKiogQSBrZXkgZ3VhcmRlZCBieSBhIHBvbGljeS4gKi9cbmV4cG9ydCBjbGFzcyBLZXlXaXRoUG9saWNpZXMge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IHJvbGVJZDogc3RyaW5nO1xuICByZWFkb25seSBrZXlJZDogc3RyaW5nO1xuICAvKiogVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMga2V5L3BvbGljaWVzICovXG4gICNjYWNoZWQ6IEtleVdpdGhQb2xpY2llc0luZm87XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBjYWNoZWQgaW5mb3JtYXRpb24gKi9cbiAgZ2V0IGNhY2hlZCgpOiBLZXlXaXRoUG9saWNpZXNJbmZvIHtcbiAgICByZXR1cm4gdGhpcy4jY2FjaGVkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBjYWNoZWQgcG9saWN5ICovXG4gIGdldCBwb2xpY3koKTogS2V5UG9saWN5IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQucG9saWN5IGFzIEtleVBvbGljeSB8IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUga2V5ICovXG4gIGFzeW5jIGdldEtleSgpOiBQcm9taXNlPEtleT4ge1xuICAgIGlmICh0aGlzLiNjYWNoZWQua2V5X2luZm8gPT09IHVuZGVmaW5lZCB8fCB0aGlzLiNjYWNoZWQua2V5X2luZm8gPT09IG51bGwpIHtcbiAgICAgIHRoaXMuI2NhY2hlZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5R2V0KHRoaXMucm9sZUlkLCB0aGlzLmtleUlkLCB7IGRldGFpbHM6IHRydWUgfSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgdGhpcy4jY2FjaGVkLmtleV9pbmZvISk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ga2V5V2l0aFBvbGljaWVzIFRoZSBrZXkgYW5kIGl0cyBwb2xpY2llc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBrZXlXaXRoUG9saWNpZXM6IEtleVdpdGhQb2xpY2llc0luZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy5yb2xlSWQgPSBrZXlXaXRoUG9saWNpZXMucm9sZV9pZDtcbiAgICB0aGlzLmtleUlkID0ga2V5V2l0aFBvbGljaWVzLmtleV9pZDtcbiAgICB0aGlzLiNjYWNoZWQgPSBrZXlXaXRoUG9saWNpZXM7XG4gIH1cbn1cblxuLyoqIFJvbGVzLiAqL1xuZXhwb3J0IGNsYXNzIFJvbGUge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIC8qKiBUaGUgcm9sZSBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YTogUm9sZUluZm87XG5cbiAgLyoqIEByZXR1cm5zIEh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSByb2xlICovXG4gIGdldCBuYW1lKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBSb2xlI2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucm9sZV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyB0aGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyByb2xlLiBUaGUgY2FjaGVkIHByb3BlcnRpZXNcbiAgICogcmVmbGVjdCB0aGUgc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlIChlLmcuLCBhZnRlciBhd2FpdGluZ1xuICAgKiBgUm9sZS5lbmFibGVkKClgIG9yIGBSb2xlLmRpc2FibGUoKWApLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBSb2xlSW5mbyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBBIHJlc3BvbnNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZURlbGV0ZSh0aGlzLmlkLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSByb2xlIGlzIGVuYWJsZWQgKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZW5hYmxlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZGlzYWJsZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBuZXcgcG9saWN5IChvdmVyd3JpdGluZyBhbnkgcG9saWNpZXMgcHJldmlvdXNseSBzZXQgZm9yIHRoaXMgcm9sZSlcbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IFJvbGVQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5IH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCB0byBleGlzdGluZyByb2xlIHBvbGljeS4gVGhpcyBhcHBlbmQgaXMgbm90IGF0b21pYy0tLWl0IHVzZXNcbiAgICoge0BsaW5rIHBvbGljeX0gdG8gZmV0Y2ggdGhlIGN1cnJlbnQgcG9saWN5IGFuZCB0aGVuIHtAbGluayBzZXRQb2xpY3l9XG4gICAqIHRvIHNldCB0aGUgcG9saWN5LS0tYW5kIHNob3VsZCBub3QgYmUgdXNlZCBpbiBhY3Jvc3MgY29uY3VycmVudCBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgcG9saWN5IHRvIGFwcGVuZCB0byB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgYXBwZW5kUG9saWN5KHBvbGljeTogUm9sZVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnBvbGljeSgpO1xuICAgIGF3YWl0IHRoaXMuc2V0UG9saWN5KFsuLi5leGlzdGluZywgLi4ucG9saWN5XSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb2xpY3kgZm9yIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHBvbGljeSgpOiBQcm9taXNlPFJvbGVQb2xpY3k+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgUm9sZVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSByZXN0cmljdGVkIGFjdGlvbnMgb24gdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByZXN0cmljdGVkQWN0aW9ucyBUaGUgbWFwIG9mIHJlc3RyaWN0ZWQgYWN0aW9uc1xuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UmVzdHJpY3RlZEFjdGlvbnMocmVzdHJpY3RlZEFjdGlvbnM6IFJlc3RyaWN0ZWRBY3Rpb25zTWFwLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBjb25zdCByZXN0cmljdGVkX2FjdGlvbnMgPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICBPYmplY3QuZW50cmllcyhyZXN0cmljdGVkQWN0aW9ucykubWFwKChba2V5LCB2YWx1ZV0pID0+IFtrZXkudG9TdHJpbmcoKSwgdmFsdWVdKSxcbiAgICApO1xuXG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyByZXN0cmljdGVkX2FjdGlvbnMgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgYWxsIHVzZXJzIHdpdGggYWNjZXNzIHRvIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgXCJVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlwiLFxuICAgKiAgIFwiVXNlciM1NTkzYzI1Yi01MmUyLTRmYjUtYjM5Yi05NmQ0MWQ2ODFkODJcIlxuICAgKiBdXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCB1c2Vycy5cbiAgICovXG4gIGFzeW5jIHVzZXJzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCB1c2VycyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlcnNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuICh1c2VycyB8fCBbXSkubWFwKCh1KSA9PiB1LnVzZXJfaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBhbiBlbXB0eSByZXNwb25zZSwgb3IgYSByZXNwb25zZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZC5cbiAgICovXG4gIGFzeW5jIGFkZFVzZXIodXNlcklkOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJBZGQodGhpcy5pZCwgdXNlcklkLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3RpbmcgdXNlciBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIGFuIGVtcHR5IHJlc3BvbnNlLCBvciBhIHJlc3BvbnNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkLlxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlVXNlcih1c2VySWQ6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlclJlbW92ZSh0aGlzLmlkLCB1c2VySWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqXG4gICAqIEBleGFtcGxlIFtcbiAgICogICAge1xuICAgKiAgICAgaWQ6IFwiS2V5I2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlwiLFxuICAgKiAgICAgcG9saWN5OiB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICAgKiAgICB9LFxuICAgKiAgXVxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwga2V5cyBpbiB0aGlzIHJvbGUuXG4gICAqL1xuICBhc3luYyBrZXlzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8S2V5V2l0aFBvbGljaWVzW10+IHtcbiAgICBjb25zdCBrZXlzSW5Sb2xlID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBrZXlzSW5Sb2xlLm1hcCgoaykgPT4gbmV3IEtleVdpdGhQb2xpY2llcyh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgaW4gdGhlIHJvbGUgYnkgaXRzIElELlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBvcHRpb25zIGZvciBnZXR0aW5nIHRoZSBrZXkuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkgd2l0aCBpdHMgcG9saWNpZXMuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZywgb3B0cz86IEdldFJvbGVLZXlPcHRpb25zKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXM+IHtcbiAgICBjb25zdCBrd3AgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleUdldCh0aGlzLmlkLCBrZXlJZCwgb3B0cyk7XG4gICAgcmV0dXJuIG5ldyBLZXlXaXRoUG9saWNpZXModGhpcy4jYXBpQ2xpZW50LCBrd3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3Qgb2YgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5cyBUaGUgbGlzdCBvZiBrZXlzIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIGVhY2gga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEN1YmVTaWduZXIgcmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyBhZGRLZXlzKGtleXM6IEtleVtdLCBwb2xpY3k/OiBLZXlQb2xpY3kpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzQWRkKFxuICAgICAgdGhpcy5pZCxcbiAgICAgIGtleXMubWFwKChrKSA9PiBrLmlkKSxcbiAgICAgIHBvbGljeSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyBrZXkgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIHRoZSBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgQ3ViZVNpZ25lciByZXNwb25zZSBpbmRpY2F0aW5nIHN1Y2Nlc3Mgb3IgZmFpbHVyZS5cbiAgICovXG4gIGFzeW5jIGFkZEtleShrZXk6IEtleSwgcG9saWN5PzogS2V5UG9saWN5KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYWRkS2V5cyhba2V5XSwgcG9saWN5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3Rpbmcga2V5IGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEN1YmVTaWduZXIgcmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyByZW1vdmVLZXkoa2V5OiBLZXkpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzUmVtb3ZlKHRoaXMuaWQsIGtleS5pZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNlc3Npb24gZm9yIHRoaXMgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgRGVzY3JpcHRpdmUgcHVycG9zZS5cbiAgICogQHBhcmFtIGxpZmV0aW1lcyBPcHRpb25hbCBzZXNzaW9uIGxpZmV0aW1lcy5cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gT25seSBgc2lnbjoqYCBzY29wZXMgYXJlIGFsbG93ZWQuXG4gICAqIEByZXR1cm5zIE5ldyBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlU2Vzc2lvbihcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICAgIHNjb3Blcz86IFNjb3BlW10sXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGVGb3JSb2xlKHRoaXMuaWQsIHB1cnBvc2UsIHNjb3BlcywgbGlmZXRpbWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBzaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS4gUmV0dXJuZWQgb2JqZWN0cyBjYW4gYmUgdXNlZCB0b1xuICAgKiByZXZva2UgaW5kaXZpZHVhbCBzZXNzaW9ucywgYnV0IHRoZXkgY2Fubm90IGJlIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgc2Vzc2lvbnMuXG4gICAqIEByZXR1cm5zIFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbnMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uSW5mb1tdPiB7XG4gICAgY29uc3Qgc2Vzc2lvbnMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbnNMaXN0KHsgcm9sZTogdGhpcy5pZCB9LCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBzZXNzaW9ucy5tYXAoKHQpID0+IG5ldyBTaWduZXJTZXNzaW9uSW5mbyh0aGlzLiNhcGlDbGllbnQsIHQuc2Vzc2lvbl9pZCwgdC5wdXJwb3NlKSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IFJvbGVJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCByb2xlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlUm9sZVJlcXVlc3QsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgdGhpcy4jZGF0YSA9IHJlc3AuZGF0YSgpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByb2xlIGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldCh0aGlzLmlkKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxufVxuIl19