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
var _KeyWithPolicies_apiClient, _Role_apiClient, _Role_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.KeyWithPolicies = exports.AllowEip712Signing = exports.AllowEip191Signing = exports.AllowRawBlobSigning = exports.OperationKind = exports.DepositContract = void 0;
const _1 = require(".");
/** The kind of deposit contracts. */
var DepositContract;
(function (DepositContract) {
    /** Canonical deposit contract */
    DepositContract[DepositContract["Canonical"] = 0] = "Canonical";
    /** Wrapper deposit contract */
    DepositContract[DepositContract["Wrapper"] = 1] = "Wrapper";
})(DepositContract = exports.DepositContract || (exports.DepositContract = {}));
/** All different kinds of sensitive operations. */
var OperationKind;
(function (OperationKind) {
    OperationKind["BlobSign"] = "BlobSign";
    OperationKind["EvmSign"] = "Eth1Sign";
    OperationKind["Eth2Sign"] = "Eth2Sign";
    OperationKind["Eth2Stake"] = "Eth2Stake";
    OperationKind["Eth2Unstake"] = "Eth2Unstake";
    OperationKind["SolanaSign"] = "SolanaSign";
})(OperationKind = exports.OperationKind || (exports.OperationKind = {}));
/** Allow raw blob signing */
exports.AllowRawBlobSigning = "AllowRawBlobSigning";
/** Allow EIP-191 signing */
exports.AllowEip191Signing = "AllowEip191Signing";
/** Allow EIP-712 signing */
exports.AllowEip712Signing = "AllowEip712Signing";
/** A key guarded by a policy. */
class KeyWithPolicies {
    /** @return {Promise<Key>} The key */
    async getKey() {
        const keyInfo = await __classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f").keyGet(this.keyId);
        return new _1.Key(__classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f"), keyInfo);
    }
    /**
     * Constructor.
     * @param {ApiClient} apiClient The API client to use.
     * @param {KeyWithPoliciesInfo} keyWithPolicies The key and its policies
     * @internal
     */
    constructor(apiClient, keyWithPolicies) {
        _KeyWithPolicies_apiClient.set(this, void 0);
        __classPrivateFieldSet(this, _KeyWithPolicies_apiClient, apiClient, "f");
        this.keyId = keyWithPolicies.key_id;
        this.policy = keyWithPolicies.policy;
    }
}
exports.KeyWithPolicies = KeyWithPolicies;
_KeyWithPolicies_apiClient = new WeakMap();
/** Roles. */
class Role {
    /** Human-readable name for the role */
    get name() {
        return __classPrivateFieldGet(this, _Role_data, "f").name ?? undefined;
    }
    /**
     * The ID of the role.
     * @example Role#bfe3eccb-731e-430d-b1e5-ac1363e6b06b
     */
    get id() {
        return __classPrivateFieldGet(this, _Role_data, "f").role_id;
    }
    /**
     * @return {RoleInfo} the cached properties of this role. The cached properties
     * reflect the state of the last fetch or update (e.g., after awaiting
     * `Role.enabled()` or `Role.disable()`).
     */
    get cached() {
        return __classPrivateFieldGet(this, _Role_data, "f");
    }
    /** Delete the role. */
    async delete() {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleDelete(this.id);
    }
    /** Is the role enabled? */
    async enabled() {
        const data = await this.fetch();
        return data.enabled;
    }
    /** Enable the role. */
    async enable() {
        await this.update({ enabled: true });
    }
    /** Disable the role. */
    async disable() {
        await this.update({ enabled: false });
    }
    /**
     * Set new policy (overwriting any policies previously set for this role)
     * @param {RolePolicy} policy The new policy to set
     */
    async setPolicy(policy) {
        await this.update({ policy: policy });
    }
    /**
     * Append to existing role policy. This append is not atomic---it uses
     * {@link policy} to fetch the current policy and then {@link setPolicy}
     * to set the policy---and should not be used in across concurrent sessions.
     *
     * @param {RolePolicy} policy The policy to append to the existing one.
     */
    async appendPolicy(policy) {
        const existing = await this.policy();
        await this.setPolicy([...existing, ...policy]);
    }
    /**
     * Get the policy for the role.
     * @return {Promise<RolePolicy>} The policy for the role.
     */
    async policy() {
        const data = await this.fetch();
        return (data.policy ?? []);
    }
    /**
     * The list of all users with access to the role.
     * @example [
     *   "User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f",
     *   "User#5593c25b-52e2-4fb5-b39b-96d41d681d82"
     * ]
     *
     * @param {PageOpts} page Optional pagination options; by default, retrieves all users.
     */
    async users(page) {
        const users = await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUsersList(this.id, page).fetch();
        return (users || []).map((u) => u.user_id);
    }
    /**
     * Add an existing user to an existing role.
     *
     * @param {string} userId The user-id of the user to add to the role.
     */
    async addUser(userId) {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUserAdd(this.id, userId);
    }
    /**
     * Remove an existing user from an existing role.
     *
     * @param {string} userId The user-id of the user to remove from the role.
     */
    async removeUser(userId) {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUserRemove(this.id, userId);
    }
    /**
     * The list of keys in the role.
     * @example [
     *    {
     *     id: "Key#bfe3eccb-731e-430d-b1e5-ac1363e6b06b",
     *     policy: { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
     *    },
     *  ]
     *
     * @param {PageOpts} page Optional pagination options; by default, retrieves all keys in this role.
     */
    async keys(page) {
        const keysInRole = await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeysList(this.id, page).fetch();
        return keysInRole.map((k) => new KeyWithPolicies(__classPrivateFieldGet(this, _Role_apiClient, "f"), k));
    }
    /**
     * Add a list of existing keys to an existing role.
     *
     * @param {Key[]} keys The list of keys to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to each key.
     */
    async addKeys(keys, policy) {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeysAdd(this.id, keys.map((k) => k.id), policy);
    }
    /**
     * Add an existing key to an existing role.
     *
     * @param {Key} key The key to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to the key.
     */
    async addKey(key, policy) {
        await this.addKeys([key], policy);
    }
    /**
     * Remove an existing key from an existing role.
     *
     * @param {Key} key The key to remove from the role.
     */
    async removeKey(key) {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeysRemove(this.id, key.id);
    }
    /**
     * Create a new session for this role.
     * @param {string} purpose Descriptive purpose.
     * @param {SessionLifetime} lifetimes Optional session lifetimes.
     * @param {Scope[]} scopes Session scopes. Only `sign:*` scopes are allowed.
     * @return {Promise<SessionData>} New session.
     */
    async createSession(purpose, lifetimes, scopes) {
        return await __classPrivateFieldGet(this, _Role_apiClient, "f").sessionCreateForRole(this.id, purpose, scopes, lifetimes);
    }
    /**
     * List all signer sessions for this role. Returned objects can be used to
     * revoke individual sessions, but they cannot be used for authentication.
     *
     * @param {PageOpts} page Optional pagination options; by default, retrieves all sessions.
     * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
     */
    async sessions(page) {
        const sessions = await __classPrivateFieldGet(this, _Role_apiClient, "f").sessionsList(this.id, page).fetch();
        return sessions.map((t) => new _1.SignerSessionInfo(__classPrivateFieldGet(this, _Role_apiClient, "f"), t.session_id, t.purpose));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     * @param {ApiClient} apiClient The API client to use.
     * @param {RoleInfo} data The JSON response from the API server.
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
     * @param {UpdateRoleRequest} request The JSON request to send to the API server.
     * @return {Promise<RoleInfo>} The updated role information.
     */
    async update(request) {
        __classPrivateFieldSet(this, _Role_data, await __classPrivateFieldGet(this, _Role_apiClient, "f").roleUpdate(this.id, request), "f");
        return __classPrivateFieldGet(this, _Role_data, "f");
    }
    /**
     * Fetches the role information.
     *
     * @return {RoleInfo} The role information.
     * @internal
     */
    async fetch() {
        __classPrivateFieldSet(this, _Role_data, await __classPrivateFieldGet(this, _Role_apiClient, "f").roleGet(this.id), "f");
        return __classPrivateFieldGet(this, _Role_data, "f");
    }
}
exports.Role = Role;
_Role_apiClient = new WeakMap(), _Role_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQWNBLHdCQUEyQztBQVMzQyxxQ0FBcUM7QUFDckMsSUFBWSxlQUtYO0FBTEQsV0FBWSxlQUFlO0lBQ3pCLGlDQUFpQztJQUNqQywrREFBUyxDQUFBO0lBQ1QsK0JBQStCO0lBQy9CLDJEQUFPLENBQUE7QUFDVCxDQUFDLEVBTFcsZUFBZSxHQUFmLHVCQUFlLEtBQWYsdUJBQWUsUUFLMUI7QUFnSEQsbURBQW1EO0FBQ25ELElBQVksYUFPWDtBQVBELFdBQVksYUFBYTtJQUN2QixzQ0FBcUIsQ0FBQTtJQUNyQixxQ0FBb0IsQ0FBQTtJQUNwQixzQ0FBcUIsQ0FBQTtJQUNyQix3Q0FBdUIsQ0FBQTtJQUN2Qiw0Q0FBMkIsQ0FBQTtJQUMzQiwwQ0FBeUIsQ0FBQTtBQUMzQixDQUFDLEVBUFcsYUFBYSxHQUFiLHFCQUFhLEtBQWIscUJBQWEsUUFPeEI7QUFrREQsNkJBQTZCO0FBQ2hCLFFBQUEsbUJBQW1CLEdBQUcscUJBQThCLENBQUM7QUFHbEUsNEJBQTRCO0FBQ2YsUUFBQSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSw0QkFBNEI7QUFDZixRQUFBLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBbURoRSxpQ0FBaUM7QUFDakMsTUFBYSxlQUFlO0lBSzFCLHFDQUFxQztJQUNyQyxLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sT0FBTyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxrQ0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekQsT0FBTyxJQUFJLE1BQUcsQ0FBQyx1QkFBQSxJQUFJLGtDQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLGVBQW9DO1FBaEJ0RSw2Q0FBK0I7UUFp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LE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQUEsQ0FBQztRQUNwRCxPQUFPLHVCQUFBLElBQUksa0JBQU0sQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUE3TkQsb0JBNk5DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBBcGlDbGllbnQsXG4gIENvbnRyYWN0QWRkcmVzcyxcbiAgRXZtVHhDbXAsXG4gIFNvbGFuYVR4Q21wLFxuICBLZXlXaXRoUG9saWNpZXNJbmZvLFxuICBNZmFUeXBlLFxuICBQYWdlT3B0cyxcbiAgUm9sZUluZm8sXG4gIFNjb3BlLFxuICBTZXNzaW9uRGF0YSxcbiAgU2Vzc2lvbkxpZmV0aW1lLFxuICBVcGRhdGVSb2xlUmVxdWVzdCxcbn0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEtleSwgU2lnbmVyU2Vzc2lvbkluZm8gfSBmcm9tIFwiLlwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHJlY2VpdmVyLlxuICpcbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4UmVjZWl2ZXIgPSB7IFR4UmVjZWl2ZXI6IHN0cmluZyB9O1xuXG4vKiogVGhlIGtpbmQgb2YgZGVwb3NpdCBjb250cmFjdHMuICovXG5leHBvcnQgZW51bSBEZXBvc2l0Q29udHJhY3Qge1xuICAvKiogQ2Fub25pY2FsIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgQ2Fub25pY2FsLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIC8qKiBXcmFwcGVyIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgV3JhcHBlciwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXQgPSBUeERlcG9zaXRCYXNlIHwgVHhEZXBvc2l0UHVia2V5IHwgVHhEZXBvc2l0Um9sZTtcblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0Ki9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdEJhc2UgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3QgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggZml4ZWQgdmFsaWRhdG9yIChwdWJrZXkpOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcHVia2V5OiBcIjg4NzkuLi44XCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFB1YmtleSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcHVia2V5OiBzdHJpbmcgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggYW55IHZhbGlkYXRvciBrZXkgaW4gYSByb2xlOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcm9sZV9pZDogXCJSb2xlI2M2My4uLmFmXCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFJvbGUgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHJvbGVfaWQ6IHN0cmluZyB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0LlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXQgPSBUeFZhbHVlTGltaXRQZXJUeCB8IFR4VmFsdWVMaW1pdFdpbmRvdztcblxuLyoqXG4gKiBSZXN0cmljdCBpbmRpdmlkdWFsIHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdC5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogXCIweDEyQTA1RjIwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0UGVyVHggPSB7IFR4VmFsdWVMaW1pdDogc3RyaW5nIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzIG92ZXIgYSB0aW1lIHdpbmRvdy5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDg2NDAwIH19XG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDYwNDgwMCwgY2hhaW5faWRzOiBbIFwiMDEyMzQ1XCIgXSB9fVxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXRXaW5kb3cgPSB7XG4gIFR4VmFsdWVMaW1pdDoge1xuICAgIGxpbWl0OiBzdHJpbmc7XG4gICAgd2luZG93PzogbnVtYmVyO1xuICAgIGNoYWluX2lkcz86IHN0cmluZ1tdO1xuICB9O1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiBtYXggZ2FzIGNvc3RzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0LlxuICpcbiAqIEBleGFtcGxlIHsgVHhHYXNDb3N0TGltaXQ6IFwiMHgyN0NBNTczNTdDMDAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBUeEdhc0Nvc3RMaW1pdCA9IHsgVHhHYXNDb3N0TGltaXQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IEVSQy0yMCBtZXRob2QgY2FsbHMgYWNjb3JkaW5nIHRvIHRoZSB7QGxpbmsgRXJjMjBQb2xpY3l9LlxuICogT25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMgdGhhdCBjYWxsIGEgdmFsaWQgRVJDLTIwIG1ldGhvZC5cbiAqIE5vbi1FUkMtMjAgdHJhbnNhY3Rpb25zIGFyZSBpZ25vcmVkIGJ5IHRoaXMgcG9saWN5LlxuICpcbiAqIEBleGFtcGxlIHsgSWZFcmMyMFR4OiB7IHRyYW5zZmVyX2xpbWl0czogW3sgbGltaXQ6IFwiMHhFOEQ0QTUxMDAwXCIgfV0gfSB9XG4gKiBAZXhhbXBsZSB7IElmRXJjMjBUeDogeyBhbGxvd2VkX2NvbnRyYWN0czogWyBcIjB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAzNGEyMGI4MDkwMDhhZmViMFwiIF0gfSB9XG4gKi9cbmV4cG9ydCB0eXBlIElmRXJjMjBUeCA9IHsgSWZFcmMyMFR4OiBFcmMyMFBvbGljeSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBvbmx5IGFsbG93IHZhbGlkIEVSQy0yMCBtZXRob2QgY2FsbHMuXG4gKi9cbmV4cG9ydCB0eXBlIEFzc2VydEVyYzIwVHggPSBcIkFzc2VydEVyYzIwVHhcIjtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgYHRyYW5zZmVyYCBhbmQgYHRyYW5zZmVyRnJvbWAgdHJhbnNhY3Rpb24gdmFsdWVzIGFuZCByZWNlaXZlcnMuXG4gKiBPbmx5IGFwcGxpZXMgdG8gY29udHJhY3RzIGRlZmluZWQgaW4gYGFwcGxpZXNfdG9fY29udHJhY3RzYCxcbiAqIG9yIHRvIGFsbCBjb250cmFjdHMgaWYgbm90IGRlZmluZWQuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwVHJhbnNmZXJMaW1pdCA9IHtcbiAgbGltaXQ/OiBzdHJpbmc7XG4gIHJlY2VpdmVycz86IHN0cmluZ1tdO1xuICBhcHBsaWVzX3RvX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgYGFwcHJvdmVgIHRyYW5zYWN0aW9uIHZhbHVlcyBhbmQgc3BlbmRlcnMuXG4gKiBPbmx5IGFwcGxpZXMgdG8gY29udHJhY3RzIGRlZmluZWQgaW4gYGFwcGxpZXNfdG9fY29udHJhY3RzYCxcbiAqIG9yIHRvIGFsbCBjb250cmFjdHMgaWYgbm90IGRlZmluZWQuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwQXBwcm92ZUxpbWl0ID0ge1xuICBsaW1pdD86IHN0cmluZztcbiAgc3BlbmRlcnM/OiBzdHJpbmdbXTtcbiAgYXBwbGllc190b19jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3RzIEVSQy0yMCBwb2xpY2llcyB0byBhIHNldCBvZiBrbm93biBjb250cmFjdHMsXG4gKiBhbmQgY2FuIGRlZmluZSBsaW1pdHMgb24gYHRyYW5zZmVyYCwgYHRyYW5zZmVyRnJvbWAgYW5kIGBhcHByb3ZlYCBtZXRob2QgY2FsbHMuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwUG9saWN5ID0ge1xuICBhbGxvd2VkX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xuICB0cmFuc2Zlcl9saW1pdHM/OiBFcmMyMFRyYW5zZmVyTGltaXRbXTtcbiAgYXBwcm92ZV9saW1pdHM/OiBFcmMyMEFwcHJvdmVMaW1pdFtdO1xufTtcblxuLyoqXG4gKiBPbmx5IGFsbG93IGNvbm5lY3Rpb25zIGZyb20gY2xpZW50cyB3aG9zZSBJUCBhZGRyZXNzZXMgbWF0Y2ggYW55IG9mIHRoZXNlIElQdjQgQ0lEUiBibG9ja3MuXG4gKlxuICogQGV4YW1wbGUgeyBTb3VyY2VJcEFsbG93bGlzdDogWyBcIjEyMy40NTYuNzguOS8xNlwiIF0gfVxuICovXG5leHBvcnQgdHlwZSBTb3VyY2VJcEFsbG93bGlzdCA9IHsgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdIH07XG5cbi8qKiBBbGwgZGlmZmVyZW50IGtpbmRzIG9mIHNlbnNpdGl2ZSBvcGVyYXRpb25zLiAqL1xuZXhwb3J0IGVudW0gT3BlcmF0aW9uS2luZCB7XG4gIEJsb2JTaWduID0gXCJCbG9iU2lnblwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV2bVNpZ24gPSBcIkV0aDFTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMlNpZ24gPSBcIkV0aDJTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMlN0YWtlID0gXCJFdGgyU3Rha2VcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdGgyVW5zdGFrZSA9IFwiRXRoMlVuc3Rha2VcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBTb2xhbmFTaWduID0gXCJTb2xhbmFTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqXG4gKiBNRkEgcG9saWN5XG4gKlxuICogQGV4YW1wbGUge1xuICoge1xuICogICBjb3VudDogMSxcbiAqICAgbnVtX2F1dGhfZmFjdG9yczogMSxcbiAqICAgYWxsb3dlZF9tZmFfdHlwZXM6IFsgXCJUb3RwXCIgXSxcbiAqICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiB9XG4gKi9cbmV4cG9ydCB0eXBlIE1mYVBvbGljeSA9IHtcbiAgY291bnQ/OiBudW1iZXI7XG4gIG51bV9hdXRoX2ZhY3RvcnM/OiBudW1iZXI7XG4gIGFsbG93ZWRfYXBwcm92ZXJzPzogc3RyaW5nW107XG4gIGFsbG93ZWRfbWZhX3R5cGVzPzogTWZhVHlwZVtdO1xuICByZXN0cmljdGVkX29wZXJhdGlvbnM/OiBPcGVyYXRpb25LaW5kW107XG4gIC8qKiBMaWZldGltZSBpbiBzZWNvbmRzLCBkZWZhdWx0cyB0byA5MDAgKDE1IG1pbnV0ZXMpICovXG4gIGxpZmV0aW1lPzogbnVtYmVyO1xuICAvKipcbiAgICogSG93IHRvIGNvbXBhcmUgSFRUUCByZXF1ZXN0cyB3aGVuIHZlcmlmeWluZyB0aGUgTUZBIHJlY2VpcHQuXG4gICAqIFRoaXMgc3BlY2lmaWVzIGhvdyB3ZSBjaGVjayBlcXVhbGl0eSBiZXR3ZWVuICgxKSB0aGUgSFRUUCByZXF1ZXN0IHdoZW4gdGhlIDIwMiAoTUZBIHJlcXVpcmVkKVxuICAgKiByZXNwb25zZSBpcyByZXR1cm5lZCBhbmQgKDIpIHRoZSBIVFRQIHJlcXVlc3Qgd2hlbiB0aGUgY29ycmVzcG9uZCBNRkEgcmVjZWlwdCBpcyB1c2VkLlxuICAgKi9cbiAgcmVxdWVzdF9jb21wYXJlcj86IEh0dHBSZXF1ZXN0Q29tcGFyZXI7XG59O1xuXG5leHBvcnQgdHlwZSBIdHRwUmVxdWVzdENvbXBhcmVyID0gXCJFcVwiIHwgeyBFdm1UeDogRXZtVHhDbXAgfSB8IHsgU29sYW5hVHg6IFNvbGFuYVR4Q21wIH07XG5cbi8qKlxuICogUmVxdWlyZSBNRkEgZm9yIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7XG4gKiAgICAgUmVxdWlyZU1mYToge1xuICogICAgICAgY291bnQ6IDEsXG4gKiAgICAgICBhbGxvd2VkX21mYV90eXBlczogWyBcIlRvdHBcIiBdLFxuICogICAgICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiAgICAgICByZXN0cmljdGVkX29wZXJhdGlvbnM6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqL1xuZXhwb3J0IHR5cGUgUmVxdWlyZU1mYSA9IHtcbiAgUmVxdWlyZU1mYTogTWZhUG9saWN5O1xufTtcblxuLyoqIEFsbG93IHJhdyBibG9iIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gdHlwZW9mIEFsbG93UmF3QmxvYlNpZ25pbmc7XG5cbi8qKiBBbGxvdyBFSVAtMTkxIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0VpcDE5MVNpZ25pbmcgPSBcIkFsbG93RWlwMTkxU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dFaXAxOTFTaWduaW5nID0gdHlwZW9mIEFsbG93RWlwMTkxU2lnbmluZztcblxuLyoqIEFsbG93IEVJUC03MTIgc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RWlwNzEyU2lnbmluZyA9IFwiQWxsb3dFaXA3MTJTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0VpcDcxMlNpZ25pbmcgPSB0eXBlb2YgQWxsb3dFaXA3MTJTaWduaW5nO1xuXG4vKiogS2V5IHBvbGljaWVzIHRoYXQgcmVzdHJpY3QgdGhlIHJlcXVlc3RzIHRoYXQgdGhlIHNpZ25pbmcgZW5kcG9pbnRzIGFjY2VwdCAqL1xuZXhwb3J0IHR5cGUgS2V5RGVueVBvbGljeSA9XG4gIHwgVHhSZWNlaXZlclxuICB8IFR4RGVwb3NpdFxuICB8IFR4VmFsdWVMaW1pdFxuICB8IFR4R2FzQ29zdExpbWl0XG4gIHwgSWZFcmMyMFR4XG4gIHwgQXNzZXJ0RXJjMjBUeFxuICB8IFNvdXJjZUlwQWxsb3dsaXN0XG4gIHwgUmVxdWlyZU1mYTtcblxuLyoqXG4gKiBLZXkgcG9saWN5XG4gKlxuICogQGV4YW1wbGUgW1xuICogICB7XG4gKiAgICAgXCJUeFJlY2VpdmVyXCI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCJcbiAqICAgfSxcbiAqICAge1xuICogICAgIFwiVHhEZXBvc2l0XCI6IHtcbiAqICAgICAgIFwia2luZFwiOiBcIkNhbm9uaWNhbFwiXG4gKiAgICAgfVxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJSZXF1aXJlTWZhXCI6IHtcbiAqICAgICAgIFwiY291bnRcIjogMSxcbiAqICAgICAgIFwiYWxsb3dlZF9tZmFfdHlwZXNcIjogW1wiQ3ViZVNpZ25lclwiXSxcbiAqICAgICAgIFwicmVzdHJpY3RlZF9vcGVyYXRpb25zXCI6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqIF1cbiAqXG4gKiBAZXhhbXBsZSBbXCJBc3NlcnRFcmMyMFR4XCIsIHsgXCJJZkVyYzIwVHhcIjogXCJ0cmFuc2Zlcl9saW1pdHNcIjogWyB7IFwibGltaXRcIjogXCIweDNCOUFDQTAwXCIgfSBdIH1dXG4gKi9cbmV4cG9ydCB0eXBlIEtleVBvbGljeSA9IEtleVBvbGljeVJ1bGVbXTtcblxuZXhwb3J0IHR5cGUgS2V5UG9saWN5UnVsZSA9XG4gIHwgS2V5RGVueVBvbGljeVxuICB8IEFsbG93UmF3QmxvYlNpZ25pbmdcbiAgfCBBbGxvd0VpcDE5MVNpZ25pbmdcbiAgfCBBbGxvd0VpcDcxMlNpZ25pbmc7XG5cbi8qKiBSb2xlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgUm9sZVBvbGljeSA9IEtleURlbnlQb2xpY3lbXTtcblxuLyoqIEEga2V5IGd1YXJkZWQgYnkgYSBwb2xpY3kuICovXG5leHBvcnQgY2xhc3MgS2V5V2l0aFBvbGljaWVzIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSBrZXlJZDogc3RyaW5nO1xuICByZWFkb25seSBwb2xpY3k/OiBLZXlQb2xpY3k7XG5cbiAgLyoqIEByZXR1cm4ge1Byb21pc2U8S2V5Pn0gVGhlIGtleSAqL1xuICBhc3luYyBnZXRLZXkoKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldCh0aGlzLmtleUlkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtLZXlXaXRoUG9saWNpZXNJbmZvfSBrZXlXaXRoUG9saWNpZXMgVGhlIGtleSBhbmQgaXRzIHBvbGljaWVzXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGtleVdpdGhQb2xpY2llczogS2V5V2l0aFBvbGljaWVzSW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLmtleUlkID0ga2V5V2l0aFBvbGljaWVzLmtleV9pZDtcbiAgICB0aGlzLnBvbGljeSA9IGtleVdpdGhQb2xpY2llcy5wb2xpY3kgYXMgdW5rbm93biBhcyBLZXlQb2xpY3k7XG4gIH1cbn1cblxuLyoqIFJvbGVzLiAqL1xuZXhwb3J0IGNsYXNzIFJvbGUge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIC8qKiBUaGUgcm9sZSBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YTogUm9sZUluZm87XG5cbiAgLyoqIEh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSByb2xlICovXG4gIGdldCBuYW1lKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAZXhhbXBsZSBSb2xlI2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucm9sZV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtSb2xlSW5mb30gdGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgcm9sZS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzXG4gICAqIHJlZmxlY3QgdGhlIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmdcbiAgICogYFJvbGUuZW5hYmxlZCgpYCBvciBgUm9sZS5kaXNhYmxlKClgKS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogUm9sZUluZm8ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqIERlbGV0ZSB0aGUgcm9sZS4gKi9cbiAgYXN5bmMgZGVsZXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlRGVsZXRlKHRoaXMuaWQpO1xuICB9XG5cbiAgLyoqIElzIHRoZSByb2xlIGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqIEVuYWJsZSB0aGUgcm9sZS4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSByb2xlLiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBwb2xpY2llcyBwcmV2aW91c2x5IHNldCBmb3IgdGhpcyByb2xlKVxuICAgKiBAcGFyYW0ge1JvbGVQb2xpY3l9IHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IFJvbGVQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHRvIGV4aXN0aW5nIHJvbGUgcG9saWN5LiBUaGlzIGFwcGVuZCBpcyBub3QgYXRvbWljLS0taXQgdXNlc1xuICAgKiB7QGxpbmsgcG9saWN5fSB0byBmZXRjaCB0aGUgY3VycmVudCBwb2xpY3kgYW5kIHRoZW4ge0BsaW5rIHNldFBvbGljeX1cbiAgICogdG8gc2V0IHRoZSBwb2xpY3ktLS1hbmQgc2hvdWxkIG5vdCBiZSB1c2VkIGluIGFjcm9zcyBjb25jdXJyZW50IHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0ge1JvbGVQb2xpY3l9IHBvbGljeSBUaGUgcG9saWN5IHRvIGFwcGVuZCB0byB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKi9cbiAgYXN5bmMgYXBwZW5kUG9saWN5KHBvbGljeTogUm9sZVBvbGljeSkge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxSb2xlUG9saWN5Pn0gVGhlIHBvbGljeSBmb3IgdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2YgYWxsIHVzZXJzIHdpdGggYWNjZXNzIHRvIHRoZSByb2xlLlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgXCJVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlwiLFxuICAgKiAgIFwiVXNlciM1NTkzYzI1Yi01MmUyLTRmYjUtYjM5Yi05NmQ0MWQ2ODFkODJcIlxuICAgKiBdXG4gICAqXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIHVzZXJzLlxuICAgKi9cbiAgYXN5bmMgdXNlcnMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHVzZXJzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVc2Vyc0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gKHVzZXJzIHx8IFtdKS5tYXAoKHUpID0+IHUudXNlcl9pZCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGV4aXN0aW5nIHVzZXIgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJJZCBUaGUgdXNlci1pZCBvZiB0aGUgdXNlciB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBhZGRVc2VyKHVzZXJJZDogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVc2VyQWRkKHRoaXMuaWQsIHVzZXJJZCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIHVzZXIgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlVXNlcih1c2VySWQ6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlclJlbW92ZSh0aGlzLmlkLCB1c2VySWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFtcbiAgICogICAge1xuICAgKiAgICAgaWQ6IFwiS2V5I2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlwiLFxuICAgKiAgICAgcG9saWN5OiB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICAgKiAgICB9LFxuICAgKiAgXVxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBrZXlzIGluIHRoaXMgcm9sZS5cbiAgICovXG4gIGFzeW5jIGtleXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXNbXT4ge1xuICAgIGNvbnN0IGtleXNJblJvbGUgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleXNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIGtleXNJblJvbGUubWFwKChrKSA9PiBuZXcgS2V5V2l0aFBvbGljaWVzKHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3Qgb2YgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVtdfSBrZXlzIFRoZSBsaXN0IG9mIGtleXMgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0ge0tleVBvbGljeT99IHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIGVhY2gga2V5LlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5cyhrZXlzOiBLZXlbXSwgcG9saWN5PzogS2V5UG9saWN5KSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzQWRkKFxuICAgICAgdGhpcy5pZCxcbiAgICAgIGtleXMubWFwKChrKSA9PiBrLmlkKSxcbiAgICAgIHBvbGljeSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyBrZXkgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtLZXl9IGtleSBUaGUga2V5IHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHtLZXlQb2xpY3k/fSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byB0aGUga2V5LlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5KGtleTogS2V5LCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLmFkZEtleXMoW2tleV0sIHBvbGljeSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIGtleSBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5fSBrZXkgVGhlIGtleSB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJlbW92ZUtleShrZXk6IEtleSkge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c1JlbW92ZSh0aGlzLmlkLCBrZXkuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzZXNzaW9uIGZvciB0aGlzIHJvbGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIERlc2NyaXB0aXZlIHB1cnBvc2UuXG4gICAqIEBwYXJhbSB7U2Vzc2lvbkxpZmV0aW1lfSBsaWZldGltZXMgT3B0aW9uYWwgc2Vzc2lvbiBsaWZldGltZXMuXG4gICAqIEBwYXJhbSB7U2NvcGVbXX0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLiBPbmx5IGBzaWduOipgIHNjb3BlcyBhcmUgYWxsb3dlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTZXNzaW9uRGF0YT59IE5ldyBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlU2Vzc2lvbihcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICAgIHNjb3Blcz86IFNjb3BlW10sXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25DcmVhdGVGb3JSb2xlKHRoaXMuaWQsIHB1cnBvc2UsIHNjb3BlcywgbGlmZXRpbWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBzaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS4gUmV0dXJuZWQgb2JqZWN0cyBjYW4gYmUgdXNlZCB0b1xuICAgKiByZXZva2UgaW5kaXZpZHVhbCBzZXNzaW9ucywgYnV0IHRoZXkgY2Fubm90IGJlIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBzZXNzaW9ucy5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uSW5mb1tdPn0gU2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuXG4gICAqL1xuICBhc3luYyBzZXNzaW9ucyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPFNpZ25lclNlc3Npb25JbmZvW10+IHtcbiAgICBjb25zdCBzZXNzaW9ucyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uc0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gc2Vzc2lvbnMubWFwKCh0KSA9PiBuZXcgU2lnbmVyU2Vzc2lvbkluZm8odGhpcy4jYXBpQ2xpZW50LCB0LnNlc3Npb25faWQsIHQucHVycG9zZSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50fSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge1JvbGVJbmZvfSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IFJvbGVJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtVcGRhdGVSb2xlUmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Um9sZUluZm8+fSBUaGUgdXBkYXRlZCByb2xlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlUm9sZVJlcXVlc3QpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXBkYXRlKHRoaXMuaWQsIHJlcXVlc3QpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge1JvbGVJbmZvfSBUaGUgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQodGhpcy5pZCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cbn1cbiJdfQ==