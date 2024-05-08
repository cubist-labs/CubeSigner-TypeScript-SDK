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
})(DepositContract || (exports.DepositContract = DepositContract = {}));
/** All different kinds of sensitive operations. */
var OperationKind;
(function (OperationKind) {
    OperationKind["BlobSign"] = "BlobSign";
    OperationKind["EvmSign"] = "Eth1Sign";
    OperationKind["Eth2Sign"] = "Eth2Sign";
    OperationKind["Eth2Stake"] = "Eth2Stake";
    OperationKind["Eth2Unstake"] = "Eth2Unstake";
    OperationKind["SolanaSign"] = "SolanaSign";
})(OperationKind || (exports.OperationKind = OperationKind = {}));
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
     * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVVBLHdCQUEyQztBQVMzQyxxQ0FBcUM7QUFDckMsSUFBWSxlQUtYO0FBTEQsV0FBWSxlQUFlO0lBQ3pCLGlDQUFpQztJQUNqQywrREFBUyxDQUFBO0lBQ1QsK0JBQStCO0lBQy9CLDJEQUFPLENBQUE7QUFDVCxDQUFDLEVBTFcsZUFBZSwrQkFBZixlQUFlLFFBSzFCO0FBaUVELG1EQUFtRDtBQUNuRCxJQUFZLGFBT1g7QUFQRCxXQUFZLGFBQWE7SUFDdkIsc0NBQXFCLENBQUE7SUFDckIscUNBQW9CLENBQUE7SUFDcEIsc0NBQXFCLENBQUE7SUFDckIsd0NBQXVCLENBQUE7SUFDdkIsNENBQTJCLENBQUE7SUFDM0IsMENBQXlCLENBQUE7QUFDM0IsQ0FBQyxFQVBXLGFBQWEsNkJBQWIsYUFBYSxRQU94QjtBQXdDRCw2QkFBNkI7QUFDaEIsUUFBQSxtQkFBbUIsR0FBRyxxQkFBOEIsQ0FBQztBQUdsRSw0QkFBNEI7QUFDZixRQUFBLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBR2hFLDRCQUE0QjtBQUNmLFFBQUEsa0JBQWtCLEdBQUcsb0JBQTZCLENBQUM7QUErQ2hFLGlDQUFpQztBQUNqQyxNQUFhLGVBQWU7SUFLMUIscUNBQXFDO0lBQ3JDLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxPQUFPLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGtDQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6RCxPQUFPLElBQUksTUFBRyxDQUFDLHVCQUFBLElBQUksa0NBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLFNBQW9CLEVBQUUsZUFBb0M7UUFoQjdELDZDQUFzQjtRQWlCN0IsdUJBQUEsSUFBSSw4QkFB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QyxFQUFFLENBQUMsTUFBQSxDQUFDO1FBQ3BELE9BQU8sdUJBQUEsSUFBSSxrQkFBTSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQTdORCxvQkE2TkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEFwaUNsaWVudCxcbiAgS2V5V2l0aFBvbGljaWVzSW5mbyxcbiAgTWZhVHlwZSxcbiAgUGFnZU9wdHMsXG4gIFJvbGVJbmZvLFxuICBTZXNzaW9uRGF0YSxcbiAgU2Vzc2lvbkxpZmV0aW1lLFxuICBVcGRhdGVSb2xlUmVxdWVzdCxcbn0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEtleSwgU2lnbmVyU2Vzc2lvbkluZm8gfSBmcm9tIFwiLlwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHJlY2VpdmVyLlxuICpcbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4UmVjZWl2ZXIgPSB7IFR4UmVjZWl2ZXI6IHN0cmluZyB9O1xuXG4vKiogVGhlIGtpbmQgb2YgZGVwb3NpdCBjb250cmFjdHMuICovXG5leHBvcnQgZW51bSBEZXBvc2l0Q29udHJhY3Qge1xuICAvKiogQ2Fub25pY2FsIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgQ2Fub25pY2FsLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIC8qKiBXcmFwcGVyIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgV3JhcHBlciwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXQgPSBUeERlcG9zaXRCYXNlIHwgVHhEZXBvc2l0UHVia2V5IHwgVHhEZXBvc2l0Um9sZTtcblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0Ki9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdEJhc2UgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3QgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggZml4ZWQgdmFsaWRhdG9yIChwdWJrZXkpOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcHVia2V5OiBcIjg4NzkuLi44XCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFB1YmtleSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcHVia2V5OiBzdHJpbmcgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggYW55IHZhbGlkYXRvciBrZXkgaW4gYSByb2xlOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcm9sZV9pZDogXCJSb2xlI2M2My4uLmFmXCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFJvbGUgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHJvbGVfaWQ6IHN0cmluZyB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0LlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXQgPSBUeFZhbHVlTGltaXRQZXJUeCB8IFR4VmFsdWVMaW1pdFdpbmRvdztcblxuLyoqXG4gKiBSZXN0cmljdCBpbmRpdmlkdWFsIHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdC5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogXCIweDEyQTA1RjIwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0UGVyVHggPSB7IFR4VmFsdWVMaW1pdDogc3RyaW5nIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzIG92ZXIgYSB0aW1lIHdpbmRvdy5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDg2NDAwIH19XG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDYwNDgwMCwgY2hhaW5faWRzOiBbIFwiMDEyMzQ1XCIgXSB9fVxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXRXaW5kb3cgPSB7XG4gIFR4VmFsdWVMaW1pdDoge1xuICAgIGxpbWl0OiBzdHJpbmc7XG4gICAgd2luZG93PzogbnVtYmVyO1xuICAgIGNoYWluX2lkcz86IHN0cmluZ1tdO1xuICB9O1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiBtYXggZ2FzIGNvc3RzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0LlxuICpcbiAqIEBleGFtcGxlIHsgVHhHYXNDb3N0TGltaXQ6IFwiMHgyN0NBNTczNTdDMDAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBUeEdhc0Nvc3RMaW1pdCA9IHsgVHhHYXNDb3N0TGltaXQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIE9ubHkgYWxsb3cgY29ubmVjdGlvbnMgZnJvbSBjbGllbnRzIHdob3NlIElQIGFkZHJlc3NlcyBtYXRjaCBhbnkgb2YgdGhlc2UgSVB2NCBDSURSIGJsb2Nrcy5cbiAqXG4gKiBAZXhhbXBsZSB7IFNvdXJjZUlwQWxsb3dsaXN0OiBbIFwiMTIzLjQ1Ni43OC45LzE2XCIgXSB9XG4gKi9cbmV4cG9ydCB0eXBlIFNvdXJjZUlwQWxsb3dsaXN0ID0geyBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW10gfTtcblxuLyoqIEFsbCBkaWZmZXJlbnQga2luZHMgb2Ygc2Vuc2l0aXZlIG9wZXJhdGlvbnMuICovXG5leHBvcnQgZW51bSBPcGVyYXRpb25LaW5kIHtcbiAgQmxvYlNpZ24gPSBcIkJsb2JTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXZtU2lnbiA9IFwiRXRoMVNpZ25cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdGgyU2lnbiA9IFwiRXRoMlNpZ25cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdGgyU3Rha2UgPSBcIkV0aDJTdGFrZVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV0aDJVbnN0YWtlID0gXCJFdGgyVW5zdGFrZVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFNvbGFuYVNpZ24gPSBcIlNvbGFuYVNpZ25cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKipcbiAqIE1GQSBwb2xpY3lcbiAqXG4gKiBAZXhhbXBsZSB7XG4gKiB7XG4gKiAgIGNvdW50OiAxLFxuICogICBudW1fYXV0aF9mYWN0b3JzOiAxLFxuICogICBhbGxvd2VkX21mYV90eXBlczogWyBcIlRvdHBcIiBdLFxuICogICBhbGxvd2VkX2FwcHJvdmVyczogWyBcIlVzZXIjMTIzXCIgXSxcbiAqIH1cbiAqL1xuZXhwb3J0IHR5cGUgTWZhUG9saWN5ID0ge1xuICBjb3VudD86IG51bWJlcjtcbiAgbnVtX2F1dGhfZmFjdG9ycz86IG51bWJlcjtcbiAgYWxsb3dlZF9hcHByb3ZlcnM/OiBzdHJpbmdbXTtcbiAgYWxsb3dlZF9tZmFfdHlwZXM/OiBNZmFUeXBlW107XG4gIHJlc3RyaWN0ZWRfb3BlcmF0aW9ucz86IE9wZXJhdGlvbktpbmRbXTtcbn07XG5cbi8qKlxuICogUmVxdWlyZSBNRkEgZm9yIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7XG4gKiAgICAgUmVxdWlyZU1mYToge1xuICogICAgICAgY291bnQ6IDEsXG4gKiAgICAgICBhbGxvd2VkX21mYV90eXBlczogWyBcIlRvdHBcIiBdLFxuICogICAgICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiAgICAgICByZXN0cmljdGVkX29wZXJhdGlvbnM6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqL1xuZXhwb3J0IHR5cGUgUmVxdWlyZU1mYSA9IHtcbiAgUmVxdWlyZU1mYTogTWZhUG9saWN5O1xufTtcblxuLyoqIEFsbG93IHJhdyBibG9iIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gdHlwZW9mIEFsbG93UmF3QmxvYlNpZ25pbmc7XG5cbi8qKiBBbGxvdyBFSVAtMTkxIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0VpcDE5MVNpZ25pbmcgPSBcIkFsbG93RWlwMTkxU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dFaXAxOTFTaWduaW5nID0gdHlwZW9mIEFsbG93RWlwMTkxU2lnbmluZztcblxuLyoqIEFsbG93IEVJUC03MTIgc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RWlwNzEyU2lnbmluZyA9IFwiQWxsb3dFaXA3MTJTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0VpcDcxMlNpZ25pbmcgPSB0eXBlb2YgQWxsb3dFaXA3MTJTaWduaW5nO1xuXG4vKiogS2V5IHBvbGljaWVzIHRoYXQgcmVzdHJpY3QgdGhlIHJlcXVlc3RzIHRoYXQgdGhlIHNpZ25pbmcgZW5kcG9pbnRzIGFjY2VwdCAqL1xudHlwZSBLZXlEZW55UG9saWN5ID1cbiAgfCBUeFJlY2VpdmVyXG4gIHwgVHhEZXBvc2l0XG4gIHwgVHhWYWx1ZUxpbWl0XG4gIHwgVHhHYXNDb3N0TGltaXRcbiAgfCBTb3VyY2VJcEFsbG93bGlzdFxuICB8IFJlcXVpcmVNZmE7XG5cbi8qKlxuICogS2V5IHBvbGljeVxuICpcbiAqIEBleGFtcGxlIFtcbiAqICAge1xuICogICAgIFwiVHhSZWNlaXZlclwiOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiXG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlR4RGVwb3NpdFwiOiB7XG4gKiAgICAgICBcImtpbmRcIjogXCJDYW5vbmljYWxcIlxuICogICAgIH1cbiAqICAgfSxcbiAqICAge1xuICogICAgIFwiUmVxdWlyZU1mYVwiOiB7XG4gKiAgICAgICBcImNvdW50XCI6IDEsXG4gKiAgICAgICBcImFsbG93ZWRfbWZhX3R5cGVzXCI6IFtcIkN1YmVTaWduZXJcIl0sXG4gKiAgICAgICBcInJlc3RyaWN0ZWRfb3BlcmF0aW9uc1wiOiBbXG4gKiAgICAgICAgIFwiRXRoMVNpZ25cIixcbiAqICAgICAgICAgXCJCbG9iU2lnblwiXG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICB9XG4gKiBdXG4gKi9cbmV4cG9ydCB0eXBlIEtleVBvbGljeSA9IEtleVBvbGljeVJ1bGVbXTtcblxuZXhwb3J0IHR5cGUgS2V5UG9saWN5UnVsZSA9XG4gIHwgS2V5RGVueVBvbGljeVxuICB8IEFsbG93UmF3QmxvYlNpZ25pbmdcbiAgfCBBbGxvd0VpcDE5MVNpZ25pbmdcbiAgfCBBbGxvd0VpcDcxMlNpZ25pbmc7XG5cbi8qKiBSb2xlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgUm9sZVBvbGljeSA9IEtleURlbnlQb2xpY3lbXTtcblxuLyoqIEEga2V5IGd1YXJkZWQgYnkgYSBwb2xpY3kuICovXG5leHBvcnQgY2xhc3MgS2V5V2l0aFBvbGljaWVzIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSBrZXlJZDogc3RyaW5nO1xuICByZWFkb25seSBwb2xpY3k/OiBLZXlQb2xpY3k7XG5cbiAgLyoqIEByZXR1cm4ge1Byb21pc2U8S2V5Pn0gVGhlIGtleSAqL1xuICBhc3luYyBnZXRLZXkoKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldCh0aGlzLmtleUlkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNhcGlDbGllbnQsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtLZXlXaXRoUG9saWNpZXNJbmZvfSBrZXlXaXRoUG9saWNpZXMgVGhlIGtleSBhbmQgaXRzIHBvbGljaWVzXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGtleVdpdGhQb2xpY2llczogS2V5V2l0aFBvbGljaWVzSW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLmtleUlkID0ga2V5V2l0aFBvbGljaWVzLmtleV9pZDtcbiAgICB0aGlzLnBvbGljeSA9IGtleVdpdGhQb2xpY2llcy5wb2xpY3kgYXMgdW5rbm93biBhcyBLZXlQb2xpY3k7XG4gIH1cbn1cblxuLyoqIFJvbGVzLiAqL1xuZXhwb3J0IGNsYXNzIFJvbGUge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIC8qKiBUaGUgcm9sZSBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YTogUm9sZUluZm87XG5cbiAgLyoqIEh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSByb2xlICovXG4gIGdldCBuYW1lKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAZXhhbXBsZSBSb2xlI2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucm9sZV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtSb2xlSW5mb30gdGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgcm9sZS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzXG4gICAqIHJlZmxlY3QgdGhlIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmdcbiAgICogYFJvbGUuZW5hYmxlZCgpYCBvciBgUm9sZS5kaXNhYmxlKClgKS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogUm9sZUluZm8ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqIERlbGV0ZSB0aGUgcm9sZS4gKi9cbiAgYXN5bmMgZGVsZXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlRGVsZXRlKHRoaXMuaWQpO1xuICB9XG5cbiAgLyoqIElzIHRoZSByb2xlIGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqIEVuYWJsZSB0aGUgcm9sZS4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSByb2xlLiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBwb2xpY2llcyBwcmV2aW91c2x5IHNldCBmb3IgdGhpcyByb2xlKVxuICAgKiBAcGFyYW0ge1JvbGVQb2xpY3l9IHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IFJvbGVQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHRvIGV4aXN0aW5nIHJvbGUgcG9saWN5LiBUaGlzIGFwcGVuZCBpcyBub3QgYXRvbWljLS0taXQgdXNlc1xuICAgKiB7QGxpbmsgcG9saWN5fSB0byBmZXRjaCB0aGUgY3VycmVudCBwb2xpY3kgYW5kIHRoZW4ge0BsaW5rIHNldFBvbGljeX1cbiAgICogdG8gc2V0IHRoZSBwb2xpY3ktLS1hbmQgc2hvdWxkIG5vdCBiZSB1c2VkIGluIGFjcm9zcyBjb25jdXJyZW50IHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0ge1JvbGVQb2xpY3l9IHBvbGljeSBUaGUgcG9saWN5IHRvIGFwcGVuZCB0byB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKi9cbiAgYXN5bmMgYXBwZW5kUG9saWN5KHBvbGljeTogUm9sZVBvbGljeSkge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxSb2xlUG9saWN5Pn0gVGhlIHBvbGljeSBmb3IgdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2YgYWxsIHVzZXJzIHdpdGggYWNjZXNzIHRvIHRoZSByb2xlLlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgXCJVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlwiLFxuICAgKiAgIFwiVXNlciM1NTkzYzI1Yi01MmUyLTRmYjUtYjM5Yi05NmQ0MWQ2ODFkODJcIlxuICAgKiBdXG4gICAqXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIHVzZXJzLlxuICAgKi9cbiAgYXN5bmMgdXNlcnMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHVzZXJzID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVc2Vyc0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gKHVzZXJzIHx8IFtdKS5tYXAoKHUpID0+IHUudXNlcl9pZCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGV4aXN0aW5nIHVzZXIgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJJZCBUaGUgdXNlci1pZCBvZiB0aGUgdXNlciB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBhZGRVc2VyKHVzZXJJZDogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVc2VyQWRkKHRoaXMuaWQsIHVzZXJJZCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIHVzZXIgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlVXNlcih1c2VySWQ6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlclJlbW92ZSh0aGlzLmlkLCB1c2VySWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFtcbiAgICogICAge1xuICAgKiAgICAgaWQ6IFwiS2V5I2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlwiLFxuICAgKiAgICAgcG9saWN5OiB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICAgKiAgICB9LFxuICAgKiAgXVxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBrZXlzIGluIHRoaXMgcm9sZS5cbiAgICovXG4gIGFzeW5jIGtleXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXNbXT4ge1xuICAgIGNvbnN0IGtleXNJblJvbGUgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleXNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIGtleXNJblJvbGUubWFwKChrKSA9PiBuZXcgS2V5V2l0aFBvbGljaWVzKHRoaXMuI2FwaUNsaWVudCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3Qgb2YgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVtdfSBrZXlzIFRoZSBsaXN0IG9mIGtleXMgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0ge0tleVBvbGljeT99IHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIGVhY2gga2V5LlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5cyhrZXlzOiBLZXlbXSwgcG9saWN5PzogS2V5UG9saWN5KSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzQWRkKFxuICAgICAgdGhpcy5pZCxcbiAgICAgIGtleXMubWFwKChrKSA9PiBrLmlkKSxcbiAgICAgIHBvbGljeSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyBrZXkgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtLZXl9IGtleSBUaGUga2V5IHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHtLZXlQb2xpY3k/fSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byB0aGUga2V5LlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5KGtleTogS2V5LCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLmFkZEtleXMoW2tleV0sIHBvbGljeSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIGtleSBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5fSBrZXkgVGhlIGtleSB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJlbW92ZUtleShrZXk6IEtleSkge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c1JlbW92ZSh0aGlzLmlkLCBrZXkuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzZXNzaW9uIGZvciB0aGlzIHJvbGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIERlc2NyaXB0aXZlIHB1cnBvc2UuXG4gICAqIEBwYXJhbSB7U2Vzc2lvbkxpZmV0aW1lfSBsaWZldGltZXMgT3B0aW9uYWwgc2Vzc2lvbiBsaWZldGltZXMuXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gT25seSBgc2lnbjoqYCBzY29wZXMgYXJlIGFsbG93ZWQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2Vzc2lvbkRhdGE+fSBOZXcgc2Vzc2lvbi5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVNlc3Npb24oXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIGxpZmV0aW1lcz86IFNlc3Npb25MaWZldGltZSxcbiAgICBzY29wZXM/OiBzdHJpbmdbXSxcbiAgKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUZvclJvbGUodGhpcy5pZCwgcHVycG9zZSwgc2NvcGVzLCBsaWZldGltZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLiBSZXR1cm5lZCBvYmplY3RzIGNhbiBiZSB1c2VkIHRvXG4gICAqIHJldm9rZSBpbmRpdmlkdWFsIHNlc3Npb25zLCBidXQgdGhleSBjYW5ub3QgYmUgdXNlZCBmb3IgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIHNlc3Npb25zLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25JbmZvW10+fSBTaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25zKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbkluZm9bXT4ge1xuICAgIGNvbnN0IHNlc3Npb25zID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25zTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiBzZXNzaW9ucy5tYXAoKHQpID0+IG5ldyBTaWduZXJTZXNzaW9uSW5mbyh0aGlzLiNhcGlDbGllbnQsIHQuc2Vzc2lvbl9pZCwgdC5wdXJwb3NlKSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtBcGlDbGllbnR9IGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSB7Um9sZUluZm99IGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogUm9sZUluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge1VwZGF0ZVJvbGVSZXF1ZXN0fSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybiB7UHJvbWlzZTxSb2xlSW5mbz59IFRoZSB1cGRhdGVkIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZShyZXF1ZXN0OiBVcGRhdGVSb2xlUmVxdWVzdCk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7Um9sZUluZm99IFRoZSByb2xlIGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUdldCh0aGlzLmlkKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxufVxuIl19