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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQXFCQSx3QkFBMkM7QUF1QjNDLHFDQUFxQztBQUNyQyxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLCtCQUFmLGVBQWUsUUFLMUI7QUEyWEQsNkJBQTZCO0FBQ2hCLFFBQUEsbUJBQW1CLEdBQUcscUJBQThCLENBQUM7QUFHbEUsNEJBQTRCO0FBQ2YsUUFBQSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSw0QkFBNEI7QUFDZixRQUFBLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBR2hFLGdDQUFnQztBQUNuQixRQUFBLHNCQUFzQixHQUFHLHdCQUFpQyxDQUFDO0FBa0V4RSxpQ0FBaUM7QUFDakMsTUFBYSxlQUFlO0lBTzFCLHNDQUFzQztJQUN0QyxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksK0JBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUErQixDQUFDO0lBQ3JELENBQUM7SUFFRCx1QkFBdUI7SUFDdkIsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssU0FBUyxJQUFJLHVCQUFBLElBQUksK0JBQVEsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDMUUsdUJBQUEsSUFBSSwyQkFBVyxNQUFNLHVCQUFBLElBQUksa0NBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxD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Q0FBQyxDQUFDO1FBQzVFLHVCQUFBLElBQUksY0FBUyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQUEsQ0FBQztRQUN6QixPQUFPLHVCQUFBLElBQUksa0JBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxLQUFLLENBQUMsS0FBSztRQUNqQix1QkFBQSxJQUFJLGNBQVMsTUFBTSx1QkFBQSxJQUFJLHVCQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBQSxDQUFDO1FBQ3BELE9BQU8sdUJBQUEsSUFBSSxrQkFBTSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQWhTRCxvQkFnU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEFwaUNsaWVudCxcbiAgQ29udHJhY3RBZGRyZXNzLFxuICBFdm1UeENtcCxcbiAgU29sYW5hVHhDbXAsXG4gIEtleVdpdGhQb2xpY2llc0luZm8sXG4gIE1mYVR5cGUsXG4gIFBhZ2VPcHRzLFxuICBSb2xlSW5mbyxcbiAgU2NvcGUsXG4gIFNlc3Npb25EYXRhLFxuICBTZXNzaW9uTGlmZXRpbWUsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxuICBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gIE9wZXJhdGlvbktpbmQsXG4gIE1mYVJlY2VpcHRzLFxuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEVtcHR5LFxuICBSZXN0cmljdGVkQWN0aW9uc01hcCxcbiAgR2V0Um9sZUtleU9wdGlvbnMsXG59IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBLZXksIFNpZ25lclNlc3Npb25JbmZvIH0gZnJvbSBcIi5cIjtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIEVWTSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhSZWNlaXZlciA9IHsgVHhSZWNlaXZlcjogc3RyaW5nIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHJlY2VpdmVyIGZvciBTVUkgdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgU3VpVHhSZWNlaXZlcjogWyBcIjB4Yzk4MzdhMGFkMmQxMTQ2OGJiZjg0N2UzYWY0ZTNlZGU4MzdiY2MwMmExYmU2ZmFlZTYyMWRmMWE4YTQwM2NiZlwiIF0gfVxuICovXG5leHBvcnQgdHlwZSBTdWlUeFJlY2VpdmVycyA9IHsgU3VpVHhSZWNlaXZlcnM6IHN0cmluZ1tdIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHJlY2VpdmVyIGZvciBCVEMgdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgQnRjVHhSZWNlaXZlcnM6IFsgXCJiYzFxM3FkYXZsMzdkbmo2aGp1YXpkemR4azBhYW53anNnNDRtZ3VxNjZcIiwgXCJiYzFxZnJqdHhtOGcyMGc5N3F6Z2FkZzd2OXMzZnRqa3EwMnFmc3NrODdcIiBdIH1cbiAqL1xuZXhwb3J0IHR5cGUgQnRjVHhSZWNlaXZlcnMgPSB7IEJ0Y1R4UmVjZWl2ZXJzOiBzdHJpbmdbXSB9O1xuXG4vKiogVGhlIGtpbmQgb2YgZGVwb3NpdCBjb250cmFjdHMuICovXG5leHBvcnQgZW51bSBEZXBvc2l0Q29udHJhY3Qge1xuICAvKiogQ2Fub25pY2FsIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgQ2Fub25pY2FsLFxuICAvKiogV3JhcHBlciBkZXBvc2l0IGNvbnRyYWN0ICovXG4gIFdyYXBwZXIsXG59XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdC4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdCA9IFR4RGVwb3NpdEJhc2UgfCBUeERlcG9zaXRQdWJrZXkgfCBUeERlcG9zaXRSb2xlO1xuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0QmFzZSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdCB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3Qgd2l0aCBmaXhlZCB2YWxpZGF0b3IgKHB1YmtleSk6XG4gKlxuICogQGV4YW1wbGUgeyBUeERlcG9zaXQ6IHsga2luZDogRGVzcG9zaXRDb250cmFjdC5DYW5vbmljYWwsIHZhbGlkYXRvcjogeyBwdWJrZXk6IFwiODg3OS4uLjhcIn0gfX1cbiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0UHVia2V5ID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0OyBwdWJrZXk6IHN0cmluZyB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3Qgd2l0aCBhbnkgdmFsaWRhdG9yIGtleSBpbiBhIHJvbGU6XG4gKlxuICogQGV4YW1wbGUgeyBUeERlcG9zaXQ6IHsga2luZDogRGVzcG9zaXRDb250cmFjdC5DYW5vbmljYWwsIHZhbGlkYXRvcjogeyByb2xlX2lkOiBcIlJvbGUjYzYzLi4uYWZcIn0gfX1cbiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0Um9sZSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcm9sZV9pZDogc3RyaW5nIH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiB2YWx1ZXMgdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQgaW4gd2VpLlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXQgPSBUeFZhbHVlTGltaXRQZXJUeCB8IFR4VmFsdWVMaW1pdFdpbmRvdztcblxuLyoqXG4gKiBSZXN0cmljdCBpbmRpdmlkdWFsIHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdCBpbiB3ZWkuXG4gKiBDdXJyZW50bHksIHRoaXMgb25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBUeFZhbHVlTGltaXQ6IFwiMHgxMkEwNUYyMDBcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdFBlclR4ID0geyBUeFZhbHVlTGltaXQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHZhbHVlcywgaW4gd2VpLCBvdmVyIGEgdGltZSB3aW5kb3cuXG4gKiBDdXJyZW50bHksIHRoaXMgb25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBUeFZhbHVlTGltaXQ6IHsgbGltaXQ6IFwiMHgxMkEwNUYyMDBcIiwgd2luZG93OiA4NjQwMCB9fVxuICogQGV4YW1wbGUgeyBUeFZhbHVlTGltaXQ6IHsgbGltaXQ6IFwiMHgxMkEwNUYyMDBcIiwgd2luZG93OiA2MDQ4MDAsIGNoYWluX2lkczogWyBcIjAxMjM0NVwiIF0gfX1cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0V2luZG93ID0ge1xuICBUeFZhbHVlTGltaXQ6IHtcbiAgICBsaW1pdDogc3RyaW5nO1xuICAgIHdpbmRvdz86IG51bWJlcjtcbiAgICBjaGFpbl9pZHM/OiBzdHJpbmdbXTtcbiAgfTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gbWF4IGdhcyBjb3N0cyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdCBpbiB3ZWkuXG4gKlxuICogQGV4YW1wbGUgeyBUeEdhc0Nvc3RMaW1pdDogXCIweDI3Q0E1NzM1N0MwMDBcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4R2FzQ29zdExpbWl0ID0geyBUeEdhc0Nvc3RMaW1pdDogc3RyaW5nIH07XG5cbi8qKlxuICogUmVzdHJpY3QgRVJDLTIwIG1ldGhvZCBjYWxscyBhY2NvcmRpbmcgdG8gdGhlIHtAbGluayBFcmMyMFBvbGljeX0uXG4gKiBPbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucyB0aGF0IGNhbGwgYSB2YWxpZCBFUkMtMjAgbWV0aG9kLlxuICogTm9uLUVSQy0yMCB0cmFuc2FjdGlvbnMgYXJlIGlnbm9yZWQgYnkgdGhpcyBwb2xpY3kuXG4gKlxuICogQGV4YW1wbGUgeyBJZkVyYzIwVHg6IHsgdHJhbnNmZXJfbGltaXRzOiBbeyBsaW1pdDogXCIweEU4RDRBNTEwMDBcIiB9XSB9IH1cbiAqIEBleGFtcGxlIHsgSWZFcmMyMFR4OiB7IGFsbG93ZWRfY29udHJhY3RzOiBbIHsgYWRkcmVzczogXCIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMzRhMjBiODA5MDA4YWZlYjBcIiwgXCJjaGFpbl9pZFwiOiBcIjFcIiB9IF0gfSB9XG4gKi9cbmV4cG9ydCB0eXBlIElmRXJjMjBUeCA9IHsgSWZFcmMyMFR4OiBFcmMyMFBvbGljeSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBvbmx5IGFsbG93IHZhbGlkIEVSQy0yMCBtZXRob2QgY2FsbHMuXG4gKi9cbmV4cG9ydCB0eXBlIEFzc2VydEVyYzIwVHggPSBcIkFzc2VydEVyYzIwVHhcIjtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgYHRyYW5zZmVyYCBhbmQgYHRyYW5zZmVyRnJvbWAgdHJhbnNhY3Rpb24gdmFsdWVzIGFuZCByZWNlaXZlcnMuXG4gKiBPbmx5IGFwcGxpZXMgdG8gY29udHJhY3RzIGRlZmluZWQgaW4gYGFwcGxpZXNfdG9fY29udHJhY3RzYCxcbiAqIG9yIHRvIGFsbCBjb250cmFjdHMgaWYgbm90IGRlZmluZWQuXG4gKiBUaGUgbGltaXQgaXMgaW4gdGhlIHRva2VuJ3MgdW5pdC5cbiAqL1xuZXhwb3J0IHR5cGUgRXJjMjBUcmFuc2ZlckxpbWl0ID0ge1xuICBsaW1pdD86IHN0cmluZztcbiAgcmVjZWl2ZXJzPzogc3RyaW5nW107XG4gIGFwcGxpZXNfdG9fY29udHJhY3RzPzogQ29udHJhY3RBZGRyZXNzW107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IEVSQy0yMCBgYXBwcm92ZWAgdHJhbnNhY3Rpb24gdmFsdWVzIGFuZCBzcGVuZGVycy5cbiAqIE9ubHkgYXBwbGllcyB0byBjb250cmFjdHMgZGVmaW5lZCBpbiBgYXBwbGllc190b19jb250cmFjdHNgLFxuICogb3IgdG8gYWxsIGNvbnRyYWN0cyBpZiBub3QgZGVmaW5lZC5cbiAqIFRoZSBsaW1pdCBpcyBpbiB0aGUgdG9rZW4ncyB1bml0LlxuICovXG5leHBvcnQgdHlwZSBFcmMyMEFwcHJvdmVMaW1pdCA9IHtcbiAgbGltaXQ/OiBzdHJpbmc7XG4gIHNwZW5kZXJzPzogc3RyaW5nW107XG4gIGFwcGxpZXNfdG9fY29udHJhY3RzPzogQ29udHJhY3RBZGRyZXNzW107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0cyBFUkMtMjAgcG9saWNpZXMgdG8gYSBzZXQgb2Yga25vd24gY29udHJhY3RzLFxuICogYW5kIGNhbiBkZWZpbmUgbGltaXRzIG9uIGB0cmFuc2ZlcmAsIGB0cmFuc2ZlckZyb21gIGFuZCBgYXBwcm92ZWAgbWV0aG9kIGNhbGxzLlxuICovXG5leHBvcnQgdHlwZSBFcmMyMFBvbGljeSA9IHtcbiAgYWxsb3dlZF9jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbiAgdHJhbnNmZXJfbGltaXRzPzogRXJjMjBUcmFuc2ZlckxpbWl0W107XG4gIGFwcHJvdmVfbGltaXRzPzogRXJjMjBBcHByb3ZlTGltaXRbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIG9ubHkgYWxsb3cgY2FsbGluZyB0aGUgZ2l2ZW4gbWV0aG9kcyBpbiB0aGUgZ2l2ZW4gY29udHJhY3RzLlxuICpcbiAqIEBleGFtcGxlIHsgQXNzZXJ0Q29udHJhY3RUeDoge1xuICogICBhbGxvd2xpc3Q6IFt7XG4gKiAgICAgYWRkcmVzczogeyBhZGRyZXNzOiBcIjB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAzNGEyMGI4MDkwMDhhZmViMFwiLCBcImNoYWluX2lkXCI6IFwiMVwiIH0sXG4gKiAgICAgbWV0aG9kczogW1xuICogICAgICAgXCJmdW5jdGlvbiBuYW1lKCkgcHVibGljIHZpZXcgcmV0dXJucyAoc3RyaW5nKVwiLFxuICogICAgICAgXCJmdW5jdGlvbiB0cmFuc2ZlcihhZGRyZXNzIHRvLCB1aW50MjU2IHZhbHVlKSBwdWJsaWMgcmV0dXJucyAoYm9vbCBzdWNjZXNzKVwiXG4gKiAgICAgXVxuICogICB9XVxuICogfVxuICovXG5leHBvcnQgdHlwZSBBc3NlcnRDb250cmFjdFR4ID0ge1xuICBBc3NlcnRDb250cmFjdFR4OiB7XG4gICAgYWxsb3dsaXN0OiB7XG4gICAgICBhZGRyZXNzOiBDb250cmFjdEFkZHJlc3M7XG4gICAgICBtZXRob2RzOiBzdHJpbmdbXTtcbiAgICB9W107XG4gIH07XG59O1xuXG4vKipcbiAqIFNvbGFuYSBhZGRyZXNzIG1hdGNoZXIuXG4gKiBDYW4gYmUgZWl0aGVyIHRoZSBwdWJrZXkgb2YgdGhlIGFjY291bnQgdXNpbmcgYmFzZTU4IGVuY29kaW5nLFxuICogb3IgdGhlIGluZGV4IG9mIHRoZSBwdWJrZXkgb2YgYW4gYWRkcmVzcyBsb29rdXAgdGFibGUgYW5kIHRoZVxuICogaW5kZXggb2YgdGhlIGFjY291bnQgaW4gdGhhdCB0YWJsZS5cbiAqL1xuZXhwb3J0IHR5cGUgU29sYW5hQWRkcmVzc01hdGNoZXIgPVxuICB8IHN0cmluZ1xuICB8IHtcbiAgICAgIGFsdF9hZGRyZXNzOiBzdHJpbmc7XG4gICAgICBpbmRleDogbnVtYmVyO1xuICAgIH07XG5cbi8qKlxuICogU29sYW5hIGluc3RydWN0aW9uIG1hdGNoZXIuXG4gKi9cbmV4cG9ydCB0eXBlIFNvbGFuYUluc3RydWN0aW9uTWF0Y2hlciA9IHtcbiAgcHJvZ3JhbV9pZDogc3RyaW5nO1xuICBpbmRleD86IG51bWJlcjtcbiAgYWNjb3VudHM/OiAoXG4gICAgfCB7XG4gICAgICAgIGFkZHJlc3M6IFNvbGFuYUFkZHJlc3NNYXRjaGVyIHwgU29sYW5hQWRkcmVzc01hdGNoZXJbXTtcbiAgICAgIH1cbiAgICB8ICh7XG4gICAgICAgIC8qKiBAZGVwcmVjYXRlZCB1c2UgYGFkZHJlc3NgIGluc3RlYWQuICovXG4gICAgICAgIHB1YmtleTogc3RyaW5nO1xuICAgICAgfSAmIHtcbiAgICAgICAgaW5kZXg6IG51bWJlcjtcbiAgICAgIH0pXG4gIClbXTtcbiAgZGF0YT86XG4gICAgfCBzdHJpbmdcbiAgICB8IHtcbiAgICAgICAgZGF0YTogc3RyaW5nO1xuICAgICAgICBzdGFydF9pbmRleDogbnVtYmVyO1xuICAgICAgfVtdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdHMgU29sYW5hIHRyYW5zYWN0aW9uIGluc3RydWN0aW9ucy4gQ2FuIGxpbWl0IHRoZSBudW1iZXIgb2YgaW5zdHJ1Y3Rpb25zLFxuICogdGhlIGxpc3Qgb2YgYWxsb3dlZCBpbnN0cnVjdGlvbnMsIGFuZCBhIHNldCBvZiByZXF1aXJlZCBpbnN0cnVjdGlvbnMgaW4gYWxsIHRyYW5zYWN0aW9ucy5cbiAqL1xuZXhwb3J0IHR5cGUgU29sYW5hSW5zdHJ1Y3Rpb25Qb2xpY3kgPSB7XG4gIFNvbGFuYUluc3RydWN0aW9uUG9saWN5OiB7XG4gICAgY291bnQ/OiB7XG4gICAgICBtaW4/OiBudW1iZXI7XG4gICAgICBtYXg/OiBudW1iZXI7XG4gICAgfTtcbiAgICBhbGxvd2xpc3Q/OiBTb2xhbmFJbnN0cnVjdGlvbk1hdGNoZXJbXTtcbiAgICByZXF1aXJlZD86IFNvbGFuYUluc3RydWN0aW9uTWF0Y2hlcltdO1xuICB9O1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgdG90YWwgdmFsdWUgdHJhbnNmZXJyZWQgb3V0IG9mIHRoZSBpbnB1dHMgaW4gYSBCaXRjb2luIFNlZ3dpdCB0cmFuc2FjdGlvblxuICogdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQuXG4gKi9cbmV4cG9ydCB0eXBlIEJ0Y1NlZ3dpdFZhbHVlTGltaXQgPSBCdGNTZWd3aXRWYWx1ZUxpbWl0UGVyVHggfCBCdGNTZWd3aXRWYWx1ZUxpbWl0V2luZG93O1xuXG4vKipcbiAqIFJlc3RyaWN0IGluZGl2aWR1YWwgQml0Y29pbiBTZWd3aXQgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3dcbiAqIHRoZSBnaXZlbiBsaW1pdC5cbiAqXG4gKiBAZXhhbXBsZSB7IEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IFwiMTAwMDAwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgQnRjU2Vnd2l0VmFsdWVMaW1pdFBlclR4ID0ge1xuICBCdGNTZWd3aXRWYWx1ZUxpbWl0OiBudW1iZXI7XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSB0b3RhbCB2YWx1ZSB0cmFuc2ZlcnJlZCBvdXQgb2YgdGhlIGlucHV0cyBpbiBCaXRjb2luIFNlZ3dpdCB0cmFuc2FjdGlvbnNcbiAqIG92ZXIgYSB0aW1lIHdpbmRvdy5cbiAqXG4gKiBAZXhhbXBsZSB7IEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IHsgbGltaXQ6IFwiMTAwMDAwMFwiLCB3aW5kb3c6IDg2NDAwIH19XG4gKi9cbmV4cG9ydCB0eXBlIEJ0Y1NlZ3dpdFZhbHVlTGltaXRXaW5kb3cgPSB7XG4gIEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IHtcbiAgICBsaW1pdDogbnVtYmVyO1xuICAgIHdpbmRvdz86IG51bWJlcjtcbiAgfTtcbn07XG5cbi8qKlxuICogT25seSBhbGxvdyBjb25uZWN0aW9ucyBmcm9tIGNsaWVudHMgd2hvc2UgSVAgYWRkcmVzc2VzIG1hdGNoIGFueSBvZiB0aGVzZSBJUHY0IENJRFIgYmxvY2tzLlxuICpcbiAqIEBleGFtcGxlIHsgU291cmNlSXBBbGxvd2xpc3Q6IFsgXCIxMjMuNDU2Ljc4LjkvMTZcIiBdIH1cbiAqL1xuZXhwb3J0IHR5cGUgU291cmNlSXBBbGxvd2xpc3QgPSB7IFNvdXJjZUlwQWxsb3dsaXN0OiBzdHJpbmdbXSB9O1xuXG4vKipcbiAqIE1GQSBwb2xpY3lcbiAqXG4gKiBAZXhhbXBsZSB7XG4gKiB7XG4gKiAgIGNvdW50OiAxLFxuICogICBudW1fYXV0aF9mYWN0b3JzOiAxLFxuICogICBhbGxvd2VkX21mYV90eXBlczogWyBcIlRvdHBcIiBdLFxuICogICBhbGxvd2VkX2FwcHJvdmVyczogWyBcIlVzZXIjMTIzXCIgXSxcbiAqIH1cbiAqL1xuZXhwb3J0IHR5cGUgTWZhUG9saWN5ID0ge1xuICBjb3VudD86IG51bWJlcjtcbiAgbnVtX2F1dGhfZmFjdG9ycz86IG51bWJlcjtcbiAgYWxsb3dlZF9hcHByb3ZlcnM/OiBzdHJpbmdbXTtcbiAgYWxsb3dlZF9tZmFfdHlwZXM/OiBNZmFUeXBlW107XG4gIHJlc3RyaWN0ZWRfb3BlcmF0aW9ucz86IE9wZXJhdGlvbktpbmRbXTtcbiAgLyoqIExpZmV0aW1lIGluIHNlY29uZHMsIGRlZmF1bHRzIHRvIDkwMCAoMTUgbWludXRlcykgKi9cbiAgbGlmZXRpbWU/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBIb3cgdG8gY29tcGFyZSBIVFRQIHJlcXVlc3RzIHdoZW4gdmVyaWZ5aW5nIHRoZSBNRkEgcmVjZWlwdC5cbiAgICogVGhpcyBzcGVjaWZpZXMgaG93IHdlIGNoZWNrIGVxdWFsaXR5IGJldHdlZW4gKDEpIHRoZSBIVFRQIHJlcXVlc3Qgd2hlbiB0aGUgMjAyIChNRkEgcmVxdWlyZWQpXG4gICAqIHJlc3BvbnNlIGlzIHJldHVybmVkIGFuZCAoMikgdGhlIEhUVFAgcmVxdWVzdCB3aGVuIHRoZSBjb3JyZXNwb25kIE1GQSByZWNlaXB0IGlzIHVzZWQuXG4gICAqL1xuICByZXF1ZXN0X2NvbXBhcmVyPzogSHR0cFJlcXVlc3RDb21wYXJlcjtcbiAgLyoqXG4gICAqIFRoZSBhbW91bnQgb2YgdGltZSBpbiBzZWNvbmRzIGJlZm9yZSBhbiBNRkEgcmVjZWlwdCBjYW4gYmUgcmVkZWVtZWQuXG4gICAqIERlZmF1bHRzIHRvIDAsIGkuZS4sIG5vIGRlbGF5LiBBcHByb3ZlcnMgY2FuIHZvdGUgdG8gYXBwcm92ZSBvciB2ZXRvXG4gICAqIGJlZm9yZSB0aGUgZGVsYXkgZXhwaXJlcy4gQWZ0ZXIgYXBwcm92aW5nLCBpdCBpcyBzdGlsbCBwb3NzaWJsZSBmb3JcbiAgICogYW55b25lIHRvIHZldG8gdGhlIHJlcXVlc3QgdW50aWwgdGhlIGRlbGF5IGV4cGlyZXMgYW5kIHRoZSByZWNlaXB0XG4gICAqIGlzIHJlZGVlbWVkLlxuICAgKi9cbiAgdGltZV9kZWxheT86IG51bWJlcjtcbn07XG5cbmV4cG9ydCB0eXBlIEh0dHBSZXF1ZXN0Q29tcGFyZXIgPSBcIkVxXCIgfCB7IEV2bVR4OiBFdm1UeENtcCB9IHwgeyBTb2xhbmFUeDogU29sYW5hVHhDbXAgfTtcblxuLyoqXG4gKiBSZXF1aXJlIE1GQSBmb3IgdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHtcbiAqICAgICBSZXF1aXJlTWZhOiB7XG4gKiAgICAgICBjb3VudDogMSxcbiAqICAgICAgIGFsbG93ZWRfbWZhX3R5cGVzOiBbIFwiVG90cFwiIF0sXG4gKiAgICAgICBhbGxvd2VkX2FwcHJvdmVyczogWyBcIlVzZXIjMTIzXCIgXSxcbiAqICAgICAgIHJlc3RyaWN0ZWRfb3BlcmF0aW9uczogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICovXG5leHBvcnQgdHlwZSBSZXF1aXJlTWZhID0ge1xuICBSZXF1aXJlTWZhOiBNZmFQb2xpY3k7XG59O1xuXG4vKipcbiAqIFJlcXVpcmUgdGhhdCB0aGUga2V5IGlzIGFjY2Vzc2VkIHZpYSBhIHJvbGUgc2Vzc2lvbi5cbiAqXG4gKiBAZXhhbXBsZSB7IFwiUmVxdWlyZVJvbGVTZXNzaW9uXCI6IFwiKlwiIH1cbiAqIEBleGFtcGxlIHsgXCJSZXF1aXJlUm9sZVNlc3Npb25cIjogW1xuICogICBcIlJvbGUjMzRkZmI2NTQtZjM2ZC00OGVhLWJkZjYtODMzYzBkOTRiNzU5XCIsXG4gKiAgIFwiUm9sZSM5OGQ4NzYzMy1kMWE3LTQ2MTItYjZiNC1iMmZhMmI0M2NkM2RcIlxuICogXX1cbiAqL1xuZXhwb3J0IHR5cGUgUmVxdWlyZVJvbGVTZXNzaW9uID0ge1xuICAvKiogUmVxdWlyZSBlaXRoZXIgYW55IHJvbGUgc2Vzc2lvbiBvciBhbnkgb25lIG9mIHRoZSBhcHByb3ZlZCByb2xlcyAqL1xuICBSZXF1aXJlUm9sZVNlc3Npb246IFwiKlwiIHwgc3RyaW5nW107XG59O1xuXG4vKipcbiAqIEZvcndhcmRzIHRoZSByZXF1ZXN0IHBhcmFtZXRlcnMgdG8gdGhpcyB3ZWJob29rIHdoaWNoIGRldGVybWluZXNcbiAqIHdoZXRoZXIgdGhlIHJlcXVlc3QgaXMgYWxsb3dlZCB0byBiZSBleGVjdXRlZC5cbiAqL1xuZXhwb3J0IHR5cGUgV2ViaG9va1BvbGljeSA9IHtcbiAgV2ViaG9vazoge1xuICAgIC8qKiBUaGUgdXJsIG9mIHRoZSB3ZWJob29rICovXG4gICAgdXJsOiBzdHJpbmc7XG5cbiAgICAvKiogT3B0aW9uYWwgSFRUUCBtZXRob2QgdG8gdXNlLiBEZWZhdWx0cyB0byBQT1NULiAqL1xuICAgIG1ldGhvZD86IHN0cmluZztcblxuICAgIC8qKiBPcHRpb25hbCBIVFRQIGhlYWRlcnMgdG8gc2V0ICovXG4gICAgaGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGV4ZWN1dGlvbiB0aW1lb3V0IGluIHNlY29uZHM7IG11c3QgYmUgYXQgbGVhc3QgMSBub3QgZXhjZWVkIDUgc2Vjb25kcy5cbiAgICAgKiBEZWZhdWx0cyB0byA1LlxuICAgICAqL1xuICAgIHRpbWVvdXQ/OiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBDdWJlU2lnbmVyIG9wZXJhdGlvbnMgdG8gd2hpY2ggdGhpcyBwb2xpY3kgc2hvdWxkIGFwcGx5LlxuICAgICAqIFdoZW4gb21pdHRlZCwgYXBwbGllcyB0byBhbGwgb3BlcmF0aW9ucy5cbiAgICAgKi9cbiAgICByZXN0cmljdGVkX29wZXJhdGlvbnM/OiBPcGVyYXRpb25LaW5kW107XG4gIH07XG59O1xuXG4vKiogQmFieWxvbiBzdGFraW5nIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgQmFieWxvblN0YWtpbmcgPSB7XG4gIEJhYnlsb25TdGFraW5nOiB7XG4gICAgLyoqXG4gICAgICogUHVibGljIGtleXMgdGhhdCBjYW4gYmUgdXNlZCBmb3Igc3Rha2luZy4gTXVzdCBiZSBkZWZpbmVkIGlmIHRoZSBwb2xpY3kgaXMgYmVpbmcgYXBwbGllZFxuICAgICAqIHRvIGEgU2VnV2l0IGtleTsgb3RoZXJ3aXNlLCBpZiBgdW5kZWZpbmVkYCwgb25seSB0aGUga2V5IHRvIHdoaWNoIHRoZSBwb2xpY3kgaXMgYmVpbmdcbiAgICAgKiBhcHBsaWVkIGNhbiBiZSB1c2VkIGFzIHRoZSBzdGFraW5nIHB1YmxpYyBrZXkgd2hlbiBjcmVhdGluZyBCYWJ5bG9uLXJlbGF0ZWQgdHJhbnNhY3Rpb25zLlxuICAgICAqXG4gICAgICogSGV4LWVuY29kZWQgcHVibGljIGtleXMsIFdJVEhPVVQgdGhlIGxlYWRpbmcgJzB4Jy5cbiAgICAgKi9cbiAgICBhbGxvd2VkX3N0YWtlcl9wa3M/OiBzdHJpbmdbXTtcblxuICAgIC8qKlxuICAgICAqIEZpbmFsaXR5IHByb3ZpZGVycyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdGFraW5nLiBJZiBgdW5kZWZpbmVkYCwgYW55IGZpbmFsaXR5XG4gICAgICogcHJvdmlkZXIgY2FuIGJlIHVzZWQuXG4gICAgICpcbiAgICAgKiBIZXgtZW5jb2RlZCBwdWJsaWMga2V5cywgV0lUSE9VVCB0aGUgbGVhZGluZyAnMHgnLlxuICAgICAqL1xuICAgIGFsbG93ZWRfZmluYWxpdHlfcHJvdmlkZXJfcGtzPzogc3RyaW5nW107XG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgYWRkcmVzc2VzIHRoYXQgY2FuIGJlIHVzZWQgaW4gc3Rha2luZyB0cmFuc2FjdGlvbnMuIElmIGB1bmRlZmluZWRgLCBvbmx5XG4gICAgICogdGhlIGtleSB0byB3aGljaCB0aGUgcG9saWN5IGlzIGJlaW5nIGFwcGxpZWQgY2FuIGJlIHVzZWQgYXMgdGhlIGNoYW5nZSBhZGRyZXNzLlxuICAgICAqL1xuICAgIGFsbG93ZWRfY2hhbmdlX2FkZHJzPzogc3RyaW5nW107XG5cbiAgICAvKipcbiAgICAgKiBXaXRoZHJhd2FsIGFkZHJlc3NlcyB0aGF0IGNhbiBiZSB1c2VkIGluIHdpdGhkcmF3YWwgdHhucy4gSWYgYHVuZGVmaW5lZGAsIG9ubHlcbiAgICAgKiB0aGUga2V5IHRvIHdoaWNoIHRoZSBwb2xpY3kgaXMgYmVpbmcgYXBwbGllZCBjYW4gYmUgdXNlZCBhcyB0aGUgd2l0aGRyYXdhbCBhZGRyZXNzLlxuICAgICAqL1xuICAgIGFsbG93ZWRfd2l0aGRyYXdhbF9hZGRycz86IHN0cmluZ1tdO1xuXG4gICAgLyoqIEJhYnlsb24gbmV0d29ya3MgdGhhdCB0aGlzIGtleSBjYW4gYmUgdXNlZCB3aXRoLiBJZiBgdW5kZWZpbmVkYCwgYW55IG5ldHdvcmsuICovXG4gICAgYWxsb3dlZF9uZXR3b3JrX2lkcz86IEJhYnlsb25TdGFraW5nUmVxdWVzdFtcIm5ldHdvcmtcIl1bXTtcblxuICAgIC8qKlxuICAgICAqIE1heCBmZWUgYWxsb3dlZCBpbiBhIHN0YWtpbmcgb3Igd2l0aGRyYXdhbCB0eG4uIElmIGB1bmRlZmluZWRgLCB0aGVyZSBpcyBubyBmZWUgbGltaXQuXG4gICAgICogTm90ZSB0aGF0IHRoZSBmZWUgZm9yIHZvbHVudGFyeSB1bmJvbmRpbmcgYW5kIHNsYXNoaW5nIGFyZSBmaXhlZCBieSB0aGUgQmFieWxvblxuICAgICAqIHBhcmFtcywgYW5kIHRoaXMgbGltaXQgaXMgbm90IGVuZm9yY2VkIGluIHRob3NlIGNhc2VzLlxuICAgICAqL1xuICAgIG1heF9mZWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWluIHN0YWtpbmcgdGltZSBpbiBzZWNvbmRzLiBJZiBgdW5kZWZpbmVkYCwgdXNlcyB0aGUgbGltaXQgZGVmaW5lZCBieSB0aGUgQmFieWxvbiBzdGFraW5nIHBhcmFtcy4gKi9cbiAgICBtaW5fbG9ja190aW1lPzogbnVtYmVyO1xuXG4gICAgLyoqIE1heCBzdGFraW5nIHRpbWUgaW4gc2Vjb25kcy4gSWYgYHVuZGVmaW5lZGAsIHVzZXMgdGhlIGxpbWl0IGRlZmluZWQgYnkgdGhlIEJhYnlsb24gc3Rha2luZyBwYXJhbXMuICovXG4gICAgbWF4X2xvY2tfdGltZT86IG51bWJlcjtcblxuICAgIC8qKiBNaW4gc3Rha2luZyBhbW91bnQgaW4gU0FULiBJZiBgdW5kZWZpbmVkYCwgdXNlcyB0aGUgbGltaXQgZGVmaW5lZCBieSB0aGUgQmFieWxvbiBzdGFraW5nIHBhcmFtcy4gKi9cbiAgICBtaW5fc3Rha2luZ192YWx1ZT86IG51bWJlcjtcblxuICAgIC8qKiBNYXggc3Rha2luZyBhbW91bnQgaW4gU0FULiBJZiBgdW5kZWZpbmVkYCwgdXNlcyB0aGUgbGltaXQgZGVmaW5lZCBieSB0aGUgQmFieWxvbiBzdGFraW5nIHBhcmFtcy4gKi9cbiAgICBtYXhfc3Rha2luZ192YWx1ZT86IG51bWJlcjtcblxuICAgIC8qKiBNaW5pbXVtIG5ldHdvcmsgcGFyYW1ldGVycyB2ZXJzaW9uIGFsbG93ZWQuICovXG4gICAgbWluX3BhcmFtc192ZXJzaW9uPzogbnVtYmVyO1xuXG4gICAgLyoqIE1heGltdW0gbmV0d29yayBwYXJhbWV0ZXJzIHZlcnNpb24gYWxsb3dlZC4gKi9cbiAgICBtYXhfcGFyYW1zX3ZlcnNpb24/OiBudW1iZXI7XG4gIH07XG59O1xuXG4vKiogQWxsb3cgcmF3IGJsb2Igc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93UmF3QmxvYlNpZ25pbmcgPSBcIkFsbG93UmF3QmxvYlNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93UmF3QmxvYlNpZ25pbmcgPSB0eXBlb2YgQWxsb3dSYXdCbG9iU2lnbmluZztcblxuLyoqIEFsbG93IEVJUC0xOTEgc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RWlwMTkxU2lnbmluZyA9IFwiQWxsb3dFaXAxOTFTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0VpcDE5MVNpZ25pbmcgPSB0eXBlb2YgQWxsb3dFaXAxOTFTaWduaW5nO1xuXG4vKiogQWxsb3cgRUlQLTcxMiBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dFaXA3MTJTaWduaW5nID0gXCJBbGxvd0VpcDcxMlNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93RWlwNzEyU2lnbmluZyA9IHR5cGVvZiBBbGxvd0VpcDcxMlNpZ25pbmc7XG5cbi8qKiBBbGxvdyBCVEMgbWVzc2FnZSBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dCdGNNZXNzYWdlU2lnbmluZyA9IFwiQWxsb3dCdGNNZXNzYWdlU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dCdGNNZXNzYWdlU2lnbmluZyA9IHR5cGVvZiBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nO1xuXG4vKiogQSByZWZlcmVuY2UgdG8gYW4gb3JnLWxldmVsIG5hbWVkIHBvbGljeSBhbmQgaXRzIHZlcnNpb24gKi9cbmV4cG9ydCB0eXBlIFBvbGljeVJlZmVyZW5jZSA9IGAke3N0cmluZ30vdiR7bnVtYmVyfWAgfCBgJHtzdHJpbmd9L2xhdGVzdGA7XG5cbi8qKiBLZXkgcG9saWNpZXMgdGhhdCByZXN0cmljdCB0aGUgcmVxdWVzdHMgdGhhdCB0aGUgc2lnbmluZyBlbmRwb2ludHMgYWNjZXB0ICovXG5leHBvcnQgdHlwZSBLZXlEZW55UG9saWN5ID1cbiAgfCBUeFJlY2VpdmVyXG4gIHwgVHhEZXBvc2l0XG4gIHwgVHhWYWx1ZUxpbWl0XG4gIHwgVHhHYXNDb3N0TGltaXRcbiAgfCBJZkVyYzIwVHhcbiAgfCBBc3NlcnRFcmMyMFR4XG4gIHwgQXNzZXJ0Q29udHJhY3RUeFxuICB8IFN1aVR4UmVjZWl2ZXJzXG4gIHwgQnRjVHhSZWNlaXZlcnNcbiAgfCBTb3VyY2VJcEFsbG93bGlzdFxuICB8IFNvbGFuYUluc3RydWN0aW9uUG9saWN5XG4gIHwgQnRjU2Vnd2l0VmFsdWVMaW1pdFxuICB8IFJlcXVpcmVNZmFcbiAgfCBSZXF1aXJlUm9sZVNlc3Npb25cbiAgfCBCYWJ5bG9uU3Rha2luZ1xuICB8IFdlYmhvb2tQb2xpY3k7XG5cbi8qKlxuICogS2V5IHBvbGljeVxuICpcbiAqIEBleGFtcGxlIFtcbiAqICAge1xuICogICAgIFwiVHhSZWNlaXZlclwiOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiXG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlR4RGVwb3NpdFwiOiB7XG4gKiAgICAgICBcImtpbmRcIjogXCJDYW5vbmljYWxcIlxuICogICAgIH1cbiAqICAgfSxcbiAqICAge1xuICogICAgIFwiUmVxdWlyZU1mYVwiOiB7XG4gKiAgICAgICBcImNvdW50XCI6IDEsXG4gKiAgICAgICBcImFsbG93ZWRfbWZhX3R5cGVzXCI6IFtcIkN1YmVTaWduZXJcIl0sXG4gKiAgICAgICBcInJlc3RyaWN0ZWRfb3BlcmF0aW9uc1wiOiBbXG4gKiAgICAgICAgIFwiRXRoMVNpZ25cIixcbiAqICAgICAgICAgXCJCbG9iU2lnblwiXG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICB9XG4gKiBdXG4gKlxuICogQGV4YW1wbGUgW1wiQXNzZXJ0RXJjMjBUeFwiLCB7IFwiSWZFcmMyMFR4XCI6IFwidHJhbnNmZXJfbGltaXRzXCI6IFsgeyBcImxpbWl0XCI6IFwiMHgzQjlBQ0EwMFwiIH0gXSB9XVxuICovXG5leHBvcnQgdHlwZSBLZXlQb2xpY3kgPSBLZXlQb2xpY3lSdWxlW107XG5cbmV4cG9ydCB0eXBlIEtleVBvbGljeVJ1bGUgPVxuICB8IEtleURlbnlQb2xpY3lcbiAgfCBBbGxvd1Jhd0Jsb2JTaWduaW5nXG4gIHwgQWxsb3dFaXAxOTFTaWduaW5nXG4gIHwgQWxsb3dFaXA3MTJTaWduaW5nXG4gIHwgQWxsb3dCdGNNZXNzYWdlU2lnbmluZ1xuICB8IFBvbGljeVJlZmVyZW5jZTtcblxuLyoqIFJvbGUgcG9saWN5ICovXG5leHBvcnQgdHlwZSBSb2xlUG9saWN5ID0gUm9sZVBvbGljeVJ1bGVbXTtcblxuZXhwb3J0IHR5cGUgUm9sZVBvbGljeVJ1bGUgPSBLZXlEZW55UG9saWN5IHwgUG9saWN5UmVmZXJlbmNlO1xuXG4vKiogQSBrZXkgZ3VhcmRlZCBieSBhIHBvbGljeS4gKi9cbmV4cG9ydCBjbGFzcyBLZXlXaXRoUG9saWNpZXMge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IHJvbGVJZDogc3RyaW5nO1xuICByZWFkb25seSBrZXlJZDogc3RyaW5nO1xuICAvKiogVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMga2V5L3BvbGljaWVzICovXG4gICNjYWNoZWQ6IEtleVdpdGhQb2xpY2llc0luZm87XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBjYWNoZWQgaW5mb3JtYXRpb24gKi9cbiAgZ2V0IGNhY2hlZCgpOiBLZXlXaXRoUG9saWNpZXNJbmZvIHtcbiAgICByZXR1cm4gdGhpcy4jY2FjaGVkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBjYWNoZWQgcG9saWN5ICovXG4gIGdldCBwb2xpY3koKTogS2V5UG9saWN5IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQucG9saWN5IGFzIEtleVBvbGljeSB8IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUga2V5ICovXG4gIGFzeW5jIGdldEtleSgpOiBQcm9taXNlPEtleT4ge1xuICAgIGlmICh0aGlzLiNjYWNoZWQua2V5X2luZm8gPT09IHVuZGVmaW5lZCB8fCB0aGlzLiNjYWNoZWQua2V5X2luZm8gPT09IG51bGwpIHtcbiAgICAgIHRoaXMuI2NhY2hlZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5R2V0KHRoaXMucm9sZUlkLCB0aGlzLmtleUlkLCB7IGRldGFpbHM6IHRydWUgfSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgdGhpcy4jY2FjaGVkLmtleV9pbmZvISk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ga2V5V2l0aFBvbGljaWVzIFRoZSBrZXkgYW5kIGl0cyBwb2xpY2llc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBrZXlXaXRoUG9saWNpZXM6IEtleVdpdGhQb2xpY2llc0luZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy5yb2xlSWQgPSBrZXlXaXRoUG9saWNpZXMucm9sZV9pZDtcbiAgICB0aGlzLmtleUlkID0ga2V5V2l0aFBvbGljaWVzLmtleV9pZDtcbiAgICB0aGlzLiNjYWNoZWQgPSBrZXlXaXRoUG9saWNpZXM7XG4gIH1cbn1cblxuLyoqIFJvbGVzLiAqL1xuZXhwb3J0IGNsYXNzIFJvbGUge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIC8qKiBUaGUgcm9sZSBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YTogUm9sZUluZm87XG5cbiAgLyoqIEByZXR1cm5zIEh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSByb2xlICovXG4gIGdldCBuYW1lKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBSb2xlI2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucm9sZV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyB0aGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyByb2xlLiBUaGUgY2FjaGVkIHByb3BlcnRpZXNcbiAgICogcmVmbGVjdCB0aGUgc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlIChlLmcuLCBhZnRlciBhd2FpdGluZ1xuICAgKiBgUm9sZS5lbmFibGVkKClgIG9yIGBSb2xlLmRpc2FibGUoKWApLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBSb2xlSW5mbyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBBIHJlc3BvbnNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZURlbGV0ZSh0aGlzLmlkLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSByb2xlIGlzIGVuYWJsZWQgKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZW5hYmxlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZGlzYWJsZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBuZXcgcG9saWN5IChvdmVyd3JpdGluZyBhbnkgcG9saWNpZXMgcHJldmlvdXNseSBzZXQgZm9yIHRoaXMgcm9sZSlcbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IFJvbGVQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5IH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCB0byBleGlzdGluZyByb2xlIHBvbGljeS4gVGhpcyBhcHBlbmQgaXMgbm90IGF0b21pYy0tLWl0IHVzZXNcbiAgICoge0BsaW5rIHBvbGljeX0gdG8gZmV0Y2ggdGhlIGN1cnJlbnQgcG9saWN5IGFuZCB0aGVuIHtAbGluayBzZXRQb2xpY3l9XG4gICAqIHRvIHNldCB0aGUgcG9saWN5LS0tYW5kIHNob3VsZCBub3QgYmUgdXNlZCBpbiBhY3Jvc3MgY29uY3VycmVudCBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgcG9saWN5IHRvIGFwcGVuZCB0byB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgYXBwZW5kUG9saWN5KHBvbGljeTogUm9sZVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnBvbGljeSgpO1xuICAgIGF3YWl0IHRoaXMuc2V0UG9saWN5KFsuLi5leGlzdGluZywgLi4ucG9saWN5XSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb2xpY3kgZm9yIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHBvbGljeSgpOiBQcm9taXNlPFJvbGVQb2xpY3k+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgUm9sZVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSByZXN0cmljdGVkIGFjdGlvbnMgb24gdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByZXN0cmljdGVkQWN0aW9ucyBUaGUgbWFwIG9mIHJlc3RyaWN0ZWQgYWN0aW9uc1xuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UmVzdHJpY3RlZEFjdGlvbnMocmVzdHJpY3RlZEFjdGlvbnM6IFJlc3RyaWN0ZWRBY3Rpb25zTWFwLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBjb25zdCByZXN0cmljdGVkX2FjdGlvbnMgPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICBPYmplY3QuZW50cmllcyhyZXN0cmljdGVkQWN0aW9ucykubWFwKChba2V5LCB2YWx1ZV0pID0+IFtrZXkudG9TdHJpbmcoKSwgdmFsdWVdKSxcbiAgICApO1xuXG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyByZXN0cmljdGVkX2FjdGlvbnMgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgYWxsIHVzZXJzIHdpdGggYWNjZXNzIHRvIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgXCJVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlwiLFxuICAgKiAgIFwiVXNlciM1NTkzYzI1Yi01MmUyLTRmYjUtYjM5Yi05NmQ0MWQ2ODFkODJcIlxuICAgKiBdXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCB1c2Vycy5cbiAgICovXG4gIGFzeW5jIHVzZXJzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCB1c2VycyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlcnNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuICh1c2VycyB8fCBbXSkubWFwKCh1KSA9PiB1LnVzZXJfaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBhbiBlbXB0eSByZXNwb25zZSwgb3IgYSByZXNwb25zZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZC5cbiAgICovXG4gIGFzeW5jIGFkZFVzZXIodXNlcklkOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJBZGQodGhpcy5pZCwgdXNlcklkLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3RpbmcgdXNlciBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIGFuIGVtcHR5IHJlc3BvbnNlLCBvciBhIHJlc3BvbnNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkLlxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlVXNlcih1c2VySWQ6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlclJlbW92ZSh0aGlzLmlkLCB1c2VySWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqXG4gICAqIEBleGFtcGxlIFtcbiAgICogICAge1xuICAgKiAgICAgaWQ6IFwiS2V5I2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlwiLFxuICAgKiAgICAgcG9saWN5OiB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICAgKiAgICB9LFxuICAgKiAgXVxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwga2V5cyBpbiB0aGlzIHJvbGUuXG4gICAqL1xuICBhc3luYyBrZXlzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8S2V5V2l0aFBvbGljaWVzW10+IHtcbiAgICBjb25zdCBrZXlzSW5Sb2xlID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBrZXlzSW5Sb2xlLm1hcCgoaykgPT4gbmV3IEtleVdpdGhQb2xpY2llcyh0aGlzLiNhcGlDbGllbnQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgaW4gdGhlIHJvbGUgYnkgaXRzIElELlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25hbCBvcHRpb25zIGZvciBnZXR0aW5nIHRoZSBrZXkuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkgd2l0aCBpdHMgcG9saWNpZXMuXG4gICAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZywgb3B0cz86IEdldFJvbGVLZXlPcHRpb25zKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXM+IHtcbiAgICBjb25zdCBrd3AgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleUdldCh0aGlzLmlkLCBrZXlJZCwgb3B0cyk7XG4gICAgcmV0dXJuIG5ldyBLZXlXaXRoUG9saWNpZXModGhpcy4jYXBpQ2xpZW50LCBrd3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3Qgb2YgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5cyBUaGUgbGlzdCBvZiBrZXlzIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIGVhY2gga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEN1YmVTaWduZXIgcmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyBhZGRLZXlzKGtleXM6IEtleVtdLCBwb2xpY3k/OiBLZXlQb2xpY3kpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzQWRkKFxuICAgICAgdGhpcy5pZCxcbiAgICAgIGtleXMubWFwKChrKSA9PiBrLmlkKSxcbiAgICAgIHBvbGljeSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyBrZXkgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIHRoZSBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgQ3ViZVNpZ25lciByZXNwb25zZSBpbmRpY2F0aW5nIHN1Y2Nlc3Mgb3IgZmFpbHVyZS5cbiAgICovXG4gIGFzeW5jIGFkZEtleShrZXk6IEtleSwgcG9saWN5PzogS2V5UG9saWN5KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYWRkS2V5cyhba2V5XSwgcG9saWN5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3Rpbmcga2V5IGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEN1YmVTaWduZXIgcmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyByZW1vdmVLZXkoa2V5OiBLZXkpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzUmVtb3ZlKHRoaXMuaWQsIGtleS5pZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNlc3Npb24gZm9yIHRoaXMgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgRGVzY3JpcHRpdmUgcHVycG9zZS5cbiAgICogQHBhcmFtIGxpZmV0aW1lcyBPcHRpb25hbCBzZXNzaW9uIGxpZmV0aW1lcy5cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gT25seSBgc2lnbjoqYCBzY29wZXMgYXJlIGFsbG93ZWQuXG4gICAqIEByZXR1cm5zIE5ldyBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlU2Vzc2lvbihcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICAgIHNjb3Blcz86IFNjb3BlW10sXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGVGb3JSb2xlKHRoaXMuaWQsIHB1cnBvc2UsIHNjb3BlcywgbGlmZXRpbWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBzaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS4gUmV0dXJuZWQgb2JqZWN0cyBjYW4gYmUgdXNlZCB0b1xuICAgKiByZXZva2UgaW5kaXZpZHVhbCBzZXNzaW9ucywgYnV0IHRoZXkgY2Fubm90IGJlIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgc2Vzc2lvbnMuXG4gICAqIEByZXR1cm5zIFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbnMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uSW5mb1tdPiB7XG4gICAgY29uc3Qgc2Vzc2lvbnMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbnNMaXN0KHsgcm9sZTogdGhpcy5pZCB9LCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBzZXNzaW9ucy5tYXAoKHQpID0+IG5ldyBTaWduZXJTZXNzaW9uSW5mbyh0aGlzLiNhcGlDbGllbnQsIHQuc2Vzc2lvbl9pZCwgdC5wdXJwb3NlKSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IFJvbGVJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCByb2xlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlUm9sZVJlcXVlc3QsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgdGhpcy4jZGF0YSA9IHJlc3AuZGF0YSgpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByb2xlIGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldCh0aGlzLmlkKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxufVxuIl19