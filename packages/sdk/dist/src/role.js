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
    /** @returns The key */
    async getKey() {
        const keyInfo = await __classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f").keyGet(this.keyId);
        return new _1.Key(__classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f"), keyInfo);
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
        __classPrivateFieldSet(this, _KeyWithPolicies_apiClient, apiClient, "f");
        this.keyId = keyWithPolicies.key_id;
        this.policy = keyWithPolicies.policy;
    }
}
exports.KeyWithPolicies = KeyWithPolicies;
_KeyWithPolicies_apiClient = new WeakMap();
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
     * Add a list of existing keys to an existing role.
     *
     * @param keys The list of keys to add to the role.
     * @param policy The optional policy to apply to each key.
     */
    async addKeys(keys, policy) {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeysAdd(this.id, keys.map((k) => k.id), policy);
    }
    /**
     * Add an existing key to an existing role.
     *
     * @param key The key to add to the role.
     * @param policy The optional policy to apply to the key.
     */
    async addKey(key, policy) {
        await this.addKeys([key], policy);
    }
    /**
     * Remove an existing key from an existing role.
     *
     * @param key The key to remove from the role.
     */
    async removeKey(key) {
        await __classPrivateFieldGet(this, _Role_apiClient, "f").roleKeysRemove(this.id, key.id);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSx3QkFBMkM7QUF1QjNDLHFDQUFxQztBQUNyQyxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLCtCQUFmLGVBQWUsUUFLMUI7QUEyWEQsNkJBQTZCO0FBQ2hCLFFBQUEsbUJBQW1CLEdBQUcscUJBQThCLENBQUM7QUFHbEUsNEJBQTRCO0FBQ2YsUUFBQSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSw0QkFBNEI7QUFDZixRQUFBLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBR2hFLGdDQUFnQztBQUNuQixRQUFBLHNCQUFzQixHQUFHLHdCQUFpQyxDQUFDO0FBa0V4RSxpQ0FBaUM7QUFDakMsTUFBYSxlQUFlO0lBSzFCLHVCQUF1QjtJQUN2QixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sT0FBTyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxrQ0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekQsT0FBTyxJQUFJLE1BQUcsQ0FBQyx1QkFBQSxJQUFJLGtDQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFlBQVksU0FBb0IsRUFBRSxlQUFvQztRQWpCN0QsNkNBQXNCO1FBa0I3Qix1QkFBQSxJQUFJLDhCQUFjLFNBQVMsTUFBQSxDQUFDO1FBQzVCLElBQUksQ0FBQyxLQUFLLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztRQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLGVBQWUsQ0FBQyxNQUE4QixDQUFDO0lBQy9ELENBQUM7Q0FDRjtBQXZCRCwwQ0F1QkM7O0FB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akIsdUJBQUEsSUFBSSxjQUFTLE1BQU0sdUJBQUEsSUFBSSx1QkFBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQUEsQ0FBQztRQUNwRCxPQUFPLHVCQUFBLElBQUksa0JBQU0sQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUEzUEQsb0JBMlBDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBBcGlDbGllbnQsXG4gIENvbnRyYWN0QWRkcmVzcyxcbiAgRXZtVHhDbXAsXG4gIFNvbGFuYVR4Q21wLFxuICBLZXlXaXRoUG9saWNpZXNJbmZvLFxuICBNZmFUeXBlLFxuICBQYWdlT3B0cyxcbiAgUm9sZUluZm8sXG4gIFNjb3BlLFxuICBTZXNzaW9uRGF0YSxcbiAgU2Vzc2lvbkxpZmV0aW1lLFxuICBVcGRhdGVSb2xlUmVxdWVzdCxcbiAgQmFieWxvblN0YWtpbmdSZXF1ZXN0LFxuICBPcGVyYXRpb25LaW5kLFxuICBNZmFSZWNlaXB0cyxcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFbXB0eSxcbn0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEtleSwgU2lnbmVyU2Vzc2lvbkluZm8gfSBmcm9tIFwiLlwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSByZWNlaXZlciBmb3IgRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICovXG5leHBvcnQgdHlwZSBUeFJlY2VpdmVyID0geyBUeFJlY2VpdmVyOiBzdHJpbmcgfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIFNVSSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBTdWlUeFJlY2VpdmVyOiBbIFwiMHhjOTgzN2EwYWQyZDExNDY4YmJmODQ3ZTNhZjRlM2VkZTgzN2JjYzAyYTFiZTZmYWVlNjIxZGYxYThhNDAzY2JmXCIgXSB9XG4gKi9cbmV4cG9ydCB0eXBlIFN1aVR4UmVjZWl2ZXJzID0geyBTdWlUeFJlY2VpdmVyczogc3RyaW5nW10gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIEJUQyB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBCdGNUeFJlY2VpdmVyczogWyBcImJjMXEzcWRhdmwzN2RuajZoanVhemR6ZHhrMGFhbndqc2c0NG1ndXE2NlwiLCBcImJjMXFmcmp0eG04ZzIwZzk3cXpnYWRnN3Y5czNmdGprcTAycWZzc2s4N1wiIF0gfVxuICovXG5leHBvcnQgdHlwZSBCdGNUeFJlY2VpdmVycyA9IHsgQnRjVHhSZWNlaXZlcnM6IHN0cmluZ1tdIH07XG5cbi8qKiBUaGUga2luZCBvZiBkZXBvc2l0IGNvbnRyYWN0cy4gKi9cbmV4cG9ydCBlbnVtIERlcG9zaXRDb250cmFjdCB7XG4gIC8qKiBDYW5vbmljYWwgZGVwb3NpdCBjb250cmFjdCAqL1xuICBDYW5vbmljYWwsXG4gIC8qKiBXcmFwcGVyIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgV3JhcHBlcixcbn1cblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0ID0gVHhEZXBvc2l0QmFzZSB8IFR4RGVwb3NpdFB1YmtleSB8IFR4RGVwb3NpdFJvbGU7XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRCYXNlID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0IH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCB3aXRoIGZpeGVkIHZhbGlkYXRvciAocHVia2V5KTpcbiAqXG4gKiBAZXhhbXBsZSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXNwb3NpdENvbnRyYWN0LkNhbm9uaWNhbCwgdmFsaWRhdG9yOiB7IHB1YmtleTogXCI4ODc5Li4uOFwifSB9fVxuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRQdWJrZXkgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHB1YmtleTogc3RyaW5nIH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCB3aXRoIGFueSB2YWxpZGF0b3Iga2V5IGluIGEgcm9sZTpcbiAqXG4gKiBAZXhhbXBsZSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXNwb3NpdENvbnRyYWN0LkNhbm9uaWNhbCwgdmFsaWRhdG9yOiB7IHJvbGVfaWQ6IFwiUm9sZSNjNjMuLi5hZlwifSB9fVxuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRSb2xlID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0OyByb2xlX2lkOiBzdHJpbmcgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdCBpbiB3ZWkuXG4gKiBDdXJyZW50bHksIHRoaXMgb25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdCA9IFR4VmFsdWVMaW1pdFBlclR4IHwgVHhWYWx1ZUxpbWl0V2luZG93O1xuXG4vKipcbiAqIFJlc3RyaWN0IGluZGl2aWR1YWwgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0IGluIHdlaS5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogXCIweDEyQTA1RjIwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0UGVyVHggPSB7IFR4VmFsdWVMaW1pdDogc3RyaW5nIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzLCBpbiB3ZWksIG92ZXIgYSB0aW1lIHdpbmRvdy5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDg2NDAwIH19XG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDYwNDgwMCwgY2hhaW5faWRzOiBbIFwiMDEyMzQ1XCIgXSB9fVxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXRXaW5kb3cgPSB7XG4gIFR4VmFsdWVMaW1pdDoge1xuICAgIGxpbWl0OiBzdHJpbmc7XG4gICAgd2luZG93PzogbnVtYmVyO1xuICAgIGNoYWluX2lkcz86IHN0cmluZ1tdO1xuICB9O1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiBtYXggZ2FzIGNvc3RzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0IGluIHdlaS5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4R2FzQ29zdExpbWl0OiBcIjB4MjdDQTU3MzU3QzAwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhHYXNDb3N0TGltaXQgPSB7IFR4R2FzQ29zdExpbWl0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgbWV0aG9kIGNhbGxzIGFjY29yZGluZyB0byB0aGUge0BsaW5rIEVyYzIwUG9saWN5fS5cbiAqIE9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zIHRoYXQgY2FsbCBhIHZhbGlkIEVSQy0yMCBtZXRob2QuXG4gKiBOb24tRVJDLTIwIHRyYW5zYWN0aW9ucyBhcmUgaWdub3JlZCBieSB0aGlzIHBvbGljeS5cbiAqXG4gKiBAZXhhbXBsZSB7IElmRXJjMjBUeDogeyB0cmFuc2Zlcl9saW1pdHM6IFt7IGxpbWl0OiBcIjB4RThENEE1MTAwMFwiIH1dIH0gfVxuICogQGV4YW1wbGUgeyBJZkVyYzIwVHg6IHsgYWxsb3dlZF9jb250cmFjdHM6IFsgeyBhZGRyZXNzOiBcIjB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAzNGEyMGI4MDkwMDhhZmViMFwiLCBcImNoYWluX2lkXCI6IFwiMVwiIH0gXSB9IH1cbiAqL1xuZXhwb3J0IHR5cGUgSWZFcmMyMFR4ID0geyBJZkVyYzIwVHg6IEVyYzIwUG9saWN5IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIG9ubHkgYWxsb3cgdmFsaWQgRVJDLTIwIG1ldGhvZCBjYWxscy5cbiAqL1xuZXhwb3J0IHR5cGUgQXNzZXJ0RXJjMjBUeCA9IFwiQXNzZXJ0RXJjMjBUeFwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IEVSQy0yMCBgdHJhbnNmZXJgIGFuZCBgdHJhbnNmZXJGcm9tYCB0cmFuc2FjdGlvbiB2YWx1ZXMgYW5kIHJlY2VpdmVycy5cbiAqIE9ubHkgYXBwbGllcyB0byBjb250cmFjdHMgZGVmaW5lZCBpbiBgYXBwbGllc190b19jb250cmFjdHNgLFxuICogb3IgdG8gYWxsIGNvbnRyYWN0cyBpZiBub3QgZGVmaW5lZC5cbiAqIFRoZSBsaW1pdCBpcyBpbiB0aGUgdG9rZW4ncyB1bml0LlxuICovXG5leHBvcnQgdHlwZSBFcmMyMFRyYW5zZmVyTGltaXQgPSB7XG4gIGxpbWl0Pzogc3RyaW5nO1xuICByZWNlaXZlcnM/OiBzdHJpbmdbXTtcbiAgYXBwbGllc190b19jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgRVJDLTIwIGBhcHByb3ZlYCB0cmFuc2FjdGlvbiB2YWx1ZXMgYW5kIHNwZW5kZXJzLlxuICogT25seSBhcHBsaWVzIHRvIGNvbnRyYWN0cyBkZWZpbmVkIGluIGBhcHBsaWVzX3RvX2NvbnRyYWN0c2AsXG4gKiBvciB0byBhbGwgY29udHJhY3RzIGlmIG5vdCBkZWZpbmVkLlxuICogVGhlIGxpbWl0IGlzIGluIHRoZSB0b2tlbidzIHVuaXQuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwQXBwcm92ZUxpbWl0ID0ge1xuICBsaW1pdD86IHN0cmluZztcbiAgc3BlbmRlcnM/OiBzdHJpbmdbXTtcbiAgYXBwbGllc190b19jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3RzIEVSQy0yMCBwb2xpY2llcyB0byBhIHNldCBvZiBrbm93biBjb250cmFjdHMsXG4gKiBhbmQgY2FuIGRlZmluZSBsaW1pdHMgb24gYHRyYW5zZmVyYCwgYHRyYW5zZmVyRnJvbWAgYW5kIGBhcHByb3ZlYCBtZXRob2QgY2FsbHMuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwUG9saWN5ID0ge1xuICBhbGxvd2VkX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xuICB0cmFuc2Zlcl9saW1pdHM/OiBFcmMyMFRyYW5zZmVyTGltaXRbXTtcbiAgYXBwcm92ZV9saW1pdHM/OiBFcmMyMEFwcHJvdmVMaW1pdFtdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gb25seSBhbGxvdyBjYWxsaW5nIHRoZSBnaXZlbiBtZXRob2RzIGluIHRoZSBnaXZlbiBjb250cmFjdHMuXG4gKlxuICogQGV4YW1wbGUgeyBBc3NlcnRDb250cmFjdFR4OiB7XG4gKiAgIGFsbG93bGlzdDogW3tcbiAqICAgICBhZGRyZXNzOiB7IGFkZHJlc3M6IFwiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDM0YTIwYjgwOTAwOGFmZWIwXCIsIFwiY2hhaW5faWRcIjogXCIxXCIgfSxcbiAqICAgICBtZXRob2RzOiBbXG4gKiAgICAgICBcImZ1bmN0aW9uIG5hbWUoKSBwdWJsaWMgdmlldyByZXR1cm5zIChzdHJpbmcpXCIsXG4gKiAgICAgICBcImZ1bmN0aW9uIHRyYW5zZmVyKGFkZHJlc3MgdG8sIHVpbnQyNTYgdmFsdWUpIHB1YmxpYyByZXR1cm5zIChib29sIHN1Y2Nlc3MpXCJcbiAqICAgICBdXG4gKiAgIH1dXG4gKiB9XG4gKi9cbmV4cG9ydCB0eXBlIEFzc2VydENvbnRyYWN0VHggPSB7XG4gIEFzc2VydENvbnRyYWN0VHg6IHtcbiAgICBhbGxvd2xpc3Q6IHtcbiAgICAgIGFkZHJlc3M6IENvbnRyYWN0QWRkcmVzcztcbiAgICAgIG1ldGhvZHM6IHN0cmluZ1tdO1xuICAgIH1bXTtcbiAgfTtcbn07XG5cbi8qKlxuICogU29sYW5hIGFkZHJlc3MgbWF0Y2hlci5cbiAqIENhbiBiZSBlaXRoZXIgdGhlIHB1YmtleSBvZiB0aGUgYWNjb3VudCB1c2luZyBiYXNlNTggZW5jb2RpbmcsXG4gKiBvciB0aGUgaW5kZXggb2YgdGhlIHB1YmtleSBvZiBhbiBhZGRyZXNzIGxvb2t1cCB0YWJsZSBhbmQgdGhlXG4gKiBpbmRleCBvZiB0aGUgYWNjb3VudCBpbiB0aGF0IHRhYmxlLlxuICovXG5leHBvcnQgdHlwZSBTb2xhbmFBZGRyZXNzTWF0Y2hlciA9XG4gIHwgc3RyaW5nXG4gIHwge1xuICAgICAgYWx0X2FkZHJlc3M6IHN0cmluZztcbiAgICAgIGluZGV4OiBudW1iZXI7XG4gICAgfTtcblxuLyoqXG4gKiBTb2xhbmEgaW5zdHJ1Y3Rpb24gbWF0Y2hlci5cbiAqL1xuZXhwb3J0IHR5cGUgU29sYW5hSW5zdHJ1Y3Rpb25NYXRjaGVyID0ge1xuICBwcm9ncmFtX2lkOiBzdHJpbmc7XG4gIGluZGV4PzogbnVtYmVyO1xuICBhY2NvdW50cz86IChcbiAgICB8IHtcbiAgICAgICAgYWRkcmVzczogU29sYW5hQWRkcmVzc01hdGNoZXIgfCBTb2xhbmFBZGRyZXNzTWF0Y2hlcltdO1xuICAgICAgfVxuICAgIHwgKHtcbiAgICAgICAgLyoqIEBkZXByZWNhdGVkIHVzZSBgYWRkcmVzc2AgaW5zdGVhZC4gKi9cbiAgICAgICAgcHVia2V5OiBzdHJpbmc7XG4gICAgICB9ICYge1xuICAgICAgICBpbmRleDogbnVtYmVyO1xuICAgICAgfSlcbiAgKVtdO1xuICBkYXRhPzpcbiAgICB8IHN0cmluZ1xuICAgIHwge1xuICAgICAgICBkYXRhOiBzdHJpbmc7XG4gICAgICAgIHN0YXJ0X2luZGV4OiBudW1iZXI7XG4gICAgICB9W107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0cyBTb2xhbmEgdHJhbnNhY3Rpb24gaW5zdHJ1Y3Rpb25zLiBDYW4gbGltaXQgdGhlIG51bWJlciBvZiBpbnN0cnVjdGlvbnMsXG4gKiB0aGUgbGlzdCBvZiBhbGxvd2VkIGluc3RydWN0aW9ucywgYW5kIGEgc2V0IG9mIHJlcXVpcmVkIGluc3RydWN0aW9ucyBpbiBhbGwgdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgdHlwZSBTb2xhbmFJbnN0cnVjdGlvblBvbGljeSA9IHtcbiAgU29sYW5hSW5zdHJ1Y3Rpb25Qb2xpY3k6IHtcbiAgICBjb3VudD86IHtcbiAgICAgIG1pbj86IG51bWJlcjtcbiAgICAgIG1heD86IG51bWJlcjtcbiAgICB9O1xuICAgIGFsbG93bGlzdD86IFNvbGFuYUluc3RydWN0aW9uTWF0Y2hlcltdO1xuICAgIHJlcXVpcmVkPzogU29sYW5hSW5zdHJ1Y3Rpb25NYXRjaGVyW107XG4gIH07XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSB0b3RhbCB2YWx1ZSB0cmFuc2ZlcnJlZCBvdXQgb2YgdGhlIGlucHV0cyBpbiBhIEJpdGNvaW4gU2Vnd2l0IHRyYW5zYWN0aW9uXG4gKiB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdC5cbiAqL1xuZXhwb3J0IHR5cGUgQnRjU2Vnd2l0VmFsdWVMaW1pdCA9IEJ0Y1NlZ3dpdFZhbHVlTGltaXRQZXJUeCB8IEJ0Y1NlZ3dpdFZhbHVlTGltaXRXaW5kb3c7XG5cbi8qKlxuICogUmVzdHJpY3QgaW5kaXZpZHVhbCBCaXRjb2luIFNlZ3dpdCB0cmFuc2FjdGlvbiB2YWx1ZXMgdG8gYW1vdW50cyBhdCBvciBiZWxvd1xuICogdGhlIGdpdmVuIGxpbWl0LlxuICpcbiAqIEBleGFtcGxlIHsgQnRjU2Vnd2l0VmFsdWVMaW1pdDogXCIxMDAwMDAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBCdGNTZWd3aXRWYWx1ZUxpbWl0UGVyVHggPSB7XG4gIEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IG51bWJlcjtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHRvdGFsIHZhbHVlIHRyYW5zZmVycmVkIG91dCBvZiB0aGUgaW5wdXRzIGluIEJpdGNvaW4gU2Vnd2l0IHRyYW5zYWN0aW9uc1xuICogb3ZlciBhIHRpbWUgd2luZG93LlxuICpcbiAqIEBleGFtcGxlIHsgQnRjU2Vnd2l0VmFsdWVMaW1pdDogeyBsaW1pdDogXCIxMDAwMDAwXCIsIHdpbmRvdzogODY0MDAgfX1cbiAqL1xuZXhwb3J0IHR5cGUgQnRjU2Vnd2l0VmFsdWVMaW1pdFdpbmRvdyA9IHtcbiAgQnRjU2Vnd2l0VmFsdWVMaW1pdDoge1xuICAgIGxpbWl0OiBudW1iZXI7XG4gICAgd2luZG93PzogbnVtYmVyO1xuICB9O1xufTtcblxuLyoqXG4gKiBPbmx5IGFsbG93IGNvbm5lY3Rpb25zIGZyb20gY2xpZW50cyB3aG9zZSBJUCBhZGRyZXNzZXMgbWF0Y2ggYW55IG9mIHRoZXNlIElQdjQgQ0lEUiBibG9ja3MuXG4gKlxuICogQGV4YW1wbGUgeyBTb3VyY2VJcEFsbG93bGlzdDogWyBcIjEyMy40NTYuNzguOS8xNlwiIF0gfVxuICovXG5leHBvcnQgdHlwZSBTb3VyY2VJcEFsbG93bGlzdCA9IHsgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdIH07XG5cbi8qKlxuICogTUZBIHBvbGljeVxuICpcbiAqIEBleGFtcGxlIHtcbiAqIHtcbiAqICAgY291bnQ6IDEsXG4gKiAgIG51bV9hdXRoX2ZhY3RvcnM6IDEsXG4gKiAgIGFsbG93ZWRfbWZhX3R5cGVzOiBbIFwiVG90cFwiIF0sXG4gKiAgIGFsbG93ZWRfYXBwcm92ZXJzOiBbIFwiVXNlciMxMjNcIiBdLFxuICogfVxuICovXG5leHBvcnQgdHlwZSBNZmFQb2xpY3kgPSB7XG4gIGNvdW50PzogbnVtYmVyO1xuICBudW1fYXV0aF9mYWN0b3JzPzogbnVtYmVyO1xuICBhbGxvd2VkX2FwcHJvdmVycz86IHN0cmluZ1tdO1xuICBhbGxvd2VkX21mYV90eXBlcz86IE1mYVR5cGVbXTtcbiAgcmVzdHJpY3RlZF9vcGVyYXRpb25zPzogT3BlcmF0aW9uS2luZFtdO1xuICAvKiogTGlmZXRpbWUgaW4gc2Vjb25kcywgZGVmYXVsdHMgdG8gOTAwICgxNSBtaW51dGVzKSAqL1xuICBsaWZldGltZT86IG51bWJlcjtcbiAgLyoqXG4gICAqIEhvdyB0byBjb21wYXJlIEhUVFAgcmVxdWVzdHMgd2hlbiB2ZXJpZnlpbmcgdGhlIE1GQSByZWNlaXB0LlxuICAgKiBUaGlzIHNwZWNpZmllcyBob3cgd2UgY2hlY2sgZXF1YWxpdHkgYmV0d2VlbiAoMSkgdGhlIEhUVFAgcmVxdWVzdCB3aGVuIHRoZSAyMDIgKE1GQSByZXF1aXJlZClcbiAgICogcmVzcG9uc2UgaXMgcmV0dXJuZWQgYW5kICgyKSB0aGUgSFRUUCByZXF1ZXN0IHdoZW4gdGhlIGNvcnJlc3BvbmQgTUZBIHJlY2VpcHQgaXMgdXNlZC5cbiAgICovXG4gIHJlcXVlc3RfY29tcGFyZXI/OiBIdHRwUmVxdWVzdENvbXBhcmVyO1xuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiB0aW1lIGluIHNlY29uZHMgYmVmb3JlIGFuIE1GQSByZWNlaXB0IGNhbiBiZSByZWRlZW1lZC5cbiAgICogRGVmYXVsdHMgdG8gMCwgaS5lLiwgbm8gZGVsYXkuIEFwcHJvdmVycyBjYW4gdm90ZSB0byBhcHByb3ZlIG9yIHZldG9cbiAgICogYmVmb3JlIHRoZSBkZWxheSBleHBpcmVzLiBBZnRlciBhcHByb3ZpbmcsIGl0IGlzIHN0aWxsIHBvc3NpYmxlIGZvclxuICAgKiBhbnlvbmUgdG8gdmV0byB0aGUgcmVxdWVzdCB1bnRpbCB0aGUgZGVsYXkgZXhwaXJlcyBhbmQgdGhlIHJlY2VpcHRcbiAgICogaXMgcmVkZWVtZWQuXG4gICAqL1xuICB0aW1lX2RlbGF5PzogbnVtYmVyO1xufTtcblxuZXhwb3J0IHR5cGUgSHR0cFJlcXVlc3RDb21wYXJlciA9IFwiRXFcIiB8IHsgRXZtVHg6IEV2bVR4Q21wIH0gfCB7IFNvbGFuYVR4OiBTb2xhbmFUeENtcCB9O1xuXG4vKipcbiAqIFJlcXVpcmUgTUZBIGZvciB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUge1xuICogICAgIFJlcXVpcmVNZmE6IHtcbiAqICAgICAgIGNvdW50OiAxLFxuICogICAgICAgYWxsb3dlZF9tZmFfdHlwZXM6IFsgXCJUb3RwXCIgXSxcbiAqICAgICAgIGFsbG93ZWRfYXBwcm92ZXJzOiBbIFwiVXNlciMxMjNcIiBdLFxuICogICAgICAgcmVzdHJpY3RlZF9vcGVyYXRpb25zOiBbXG4gKiAgICAgICAgIFwiRXRoMVNpZ25cIixcbiAqICAgICAgICAgXCJCbG9iU2lnblwiXG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICB9XG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVNZmEgPSB7XG4gIFJlcXVpcmVNZmE6IE1mYVBvbGljeTtcbn07XG5cbi8qKlxuICogUmVxdWlyZSB0aGF0IHRoZSBrZXkgaXMgYWNjZXNzZWQgdmlhIGEgcm9sZSBzZXNzaW9uLlxuICpcbiAqIEBleGFtcGxlIHsgXCJSZXF1aXJlUm9sZVNlc3Npb25cIjogXCIqXCIgfVxuICogQGV4YW1wbGUgeyBcIlJlcXVpcmVSb2xlU2Vzc2lvblwiOiBbXG4gKiAgIFwiUm9sZSMzNGRmYjY1NC1mMzZkLTQ4ZWEtYmRmNi04MzNjMGQ5NGI3NTlcIixcbiAqICAgXCJSb2xlIzk4ZDg3NjMzLWQxYTctNDYxMi1iNmI0LWIyZmEyYjQzY2QzZFwiXG4gKiBdfVxuICovXG5leHBvcnQgdHlwZSBSZXF1aXJlUm9sZVNlc3Npb24gPSB7XG4gIC8qKiBSZXF1aXJlIGVpdGhlciBhbnkgcm9sZSBzZXNzaW9uIG9yIGFueSBvbmUgb2YgdGhlIGFwcHJvdmVkIHJvbGVzICovXG4gIFJlcXVpcmVSb2xlU2Vzc2lvbjogXCIqXCIgfCBzdHJpbmdbXTtcbn07XG5cbi8qKlxuICogRm9yd2FyZHMgdGhlIHJlcXVlc3QgcGFyYW1ldGVycyB0byB0aGlzIHdlYmhvb2sgd2hpY2ggZGV0ZXJtaW5lc1xuICogd2hldGhlciB0aGUgcmVxdWVzdCBpcyBhbGxvd2VkIHRvIGJlIGV4ZWN1dGVkLlxuICovXG5leHBvcnQgdHlwZSBXZWJob29rUG9saWN5ID0ge1xuICBXZWJob29rOiB7XG4gICAgLyoqIFRoZSB1cmwgb2YgdGhlIHdlYmhvb2sgKi9cbiAgICB1cmw6IHN0cmluZztcblxuICAgIC8qKiBPcHRpb25hbCBIVFRQIG1ldGhvZCB0byB1c2UuIERlZmF1bHRzIHRvIFBPU1QuICovXG4gICAgbWV0aG9kPzogc3RyaW5nO1xuXG4gICAgLyoqIE9wdGlvbmFsIEhUVFAgaGVhZGVycyB0byBzZXQgKi9cbiAgICBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgZXhlY3V0aW9uIHRpbWVvdXQgaW4gc2Vjb25kczsgbXVzdCBiZSBhdCBsZWFzdCAxIG5vdCBleGNlZWQgNSBzZWNvbmRzLlxuICAgICAqIERlZmF1bHRzIHRvIDUuXG4gICAgICovXG4gICAgdGltZW91dD86IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIEN1YmVTaWduZXIgb3BlcmF0aW9ucyB0byB3aGljaCB0aGlzIHBvbGljeSBzaG91bGQgYXBwbHkuXG4gICAgICogV2hlbiBvbWl0dGVkLCBhcHBsaWVzIHRvIGFsbCBvcGVyYXRpb25zLlxuICAgICAqL1xuICAgIHJlc3RyaWN0ZWRfb3BlcmF0aW9ucz86IE9wZXJhdGlvbktpbmRbXTtcbiAgfTtcbn07XG5cbi8qKiBCYWJ5bG9uIHN0YWtpbmcgcG9saWN5ICovXG5leHBvcnQgdHlwZSBCYWJ5bG9uU3Rha2luZyA9IHtcbiAgQmFieWxvblN0YWtpbmc6IHtcbiAgICAvKipcbiAgICAgKiBQdWJsaWMga2V5cyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdGFraW5nLiBNdXN0IGJlIGRlZmluZWQgaWYgdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkXG4gICAgICogdG8gYSBTZWdXaXQga2V5OyBvdGhlcndpc2UsIGlmIGB1bmRlZmluZWRgLCBvbmx5IHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZ1xuICAgICAqIGFwcGxpZWQgY2FuIGJlIHVzZWQgYXMgdGhlIHN0YWtpbmcgcHVibGljIGtleSB3aGVuIGNyZWF0aW5nIEJhYnlsb24tcmVsYXRlZCB0cmFuc2FjdGlvbnMuXG4gICAgICpcbiAgICAgKiBIZXgtZW5jb2RlZCBwdWJsaWMga2V5cywgV0lUSE9VVCB0aGUgbGVhZGluZyAnMHgnLlxuICAgICAqL1xuICAgIGFsbG93ZWRfc3Rha2VyX3Brcz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogRmluYWxpdHkgcHJvdmlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHN0YWtpbmcuIElmIGB1bmRlZmluZWRgLCBhbnkgZmluYWxpdHlcbiAgICAgKiBwcm92aWRlciBjYW4gYmUgdXNlZC5cbiAgICAgKlxuICAgICAqIEhleC1lbmNvZGVkIHB1YmxpYyBrZXlzLCBXSVRIT1VUIHRoZSBsZWFkaW5nICcweCcuXG4gICAgICovXG4gICAgYWxsb3dlZF9maW5hbGl0eV9wcm92aWRlcl9wa3M/OiBzdHJpbmdbXTtcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBhZGRyZXNzZXMgdGhhdCBjYW4gYmUgdXNlZCBpbiBzdGFraW5nIHRyYW5zYWN0aW9ucy4gSWYgYHVuZGVmaW5lZGAsIG9ubHlcbiAgICAgKiB0aGUga2V5IHRvIHdoaWNoIHRoZSBwb2xpY3kgaXMgYmVpbmcgYXBwbGllZCBjYW4gYmUgdXNlZCBhcyB0aGUgY2hhbmdlIGFkZHJlc3MuXG4gICAgICovXG4gICAgYWxsb3dlZF9jaGFuZ2VfYWRkcnM/OiBzdHJpbmdbXTtcblxuICAgIC8qKlxuICAgICAqIFdpdGhkcmF3YWwgYWRkcmVzc2VzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2l0aGRyYXdhbCB0eG5zLiBJZiBgdW5kZWZpbmVkYCwgb25seVxuICAgICAqIHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkIGNhbiBiZSB1c2VkIGFzIHRoZSB3aXRoZHJhd2FsIGFkZHJlc3MuXG4gICAgICovXG4gICAgYWxsb3dlZF93aXRoZHJhd2FsX2FkZHJzPzogc3RyaW5nW107XG5cbiAgICAvKiogQmFieWxvbiBuZXR3b3JrcyB0aGF0IHRoaXMga2V5IGNhbiBiZSB1c2VkIHdpdGguIElmIGB1bmRlZmluZWRgLCBhbnkgbmV0d29yay4gKi9cbiAgICBhbGxvd2VkX25ldHdvcmtfaWRzPzogQmFieWxvblN0YWtpbmdSZXF1ZXN0W1wibmV0d29ya1wiXVtdO1xuXG4gICAgLyoqXG4gICAgICogTWF4IGZlZSBhbGxvd2VkIGluIGEgc3Rha2luZyBvciB3aXRoZHJhd2FsIHR4bi4gSWYgYHVuZGVmaW5lZGAsIHRoZXJlIGlzIG5vIGZlZSBsaW1pdC5cbiAgICAgKiBOb3RlIHRoYXQgdGhlIGZlZSBmb3Igdm9sdW50YXJ5IHVuYm9uZGluZyBhbmQgc2xhc2hpbmcgYXJlIGZpeGVkIGJ5IHRoZSBCYWJ5bG9uXG4gICAgICogcGFyYW1zLCBhbmQgdGhpcyBsaW1pdCBpcyBub3QgZW5mb3JjZWQgaW4gdGhvc2UgY2FzZXMuXG4gICAgICovXG4gICAgbWF4X2ZlZT86IG51bWJlcjtcblxuICAgIC8qKiBNaW4gc3Rha2luZyB0aW1lIGluIHNlY29uZHMuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1pbl9sb2NrX3RpbWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4IHN0YWtpbmcgdGltZSBpbiBzZWNvbmRzLiBJZiBgdW5kZWZpbmVkYCwgdXNlcyB0aGUgbGltaXQgZGVmaW5lZCBieSB0aGUgQmFieWxvbiBzdGFraW5nIHBhcmFtcy4gKi9cbiAgICBtYXhfbG9ja190aW1lPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbiBzdGFraW5nIGFtb3VudCBpbiBTQVQuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1pbl9zdGFraW5nX3ZhbHVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1heCBzdGFraW5nIGFtb3VudCBpbiBTQVQuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1heF9zdGFraW5nX3ZhbHVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbmltdW0gbmV0d29yayBwYXJhbWV0ZXJzIHZlcnNpb24gYWxsb3dlZC4gKi9cbiAgICBtaW5fcGFyYW1zX3ZlcnNpb24/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4aW11bSBuZXR3b3JrIHBhcmFtZXRlcnMgdmVyc2lvbiBhbGxvd2VkLiAqL1xuICAgIG1heF9wYXJhbXNfdmVyc2lvbj86IG51bWJlcjtcbiAgfTtcbn07XG5cbi8qKiBBbGxvdyByYXcgYmxvYiBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dSYXdCbG9iU2lnbmluZyA9IFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dSYXdCbG9iU2lnbmluZyA9IHR5cGVvZiBBbGxvd1Jhd0Jsb2JTaWduaW5nO1xuXG4vKiogQWxsb3cgRUlQLTE5MSBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dFaXAxOTFTaWduaW5nID0gXCJBbGxvd0VpcDE5MVNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93RWlwMTkxU2lnbmluZyA9IHR5cGVvZiBBbGxvd0VpcDE5MVNpZ25pbmc7XG5cbi8qKiBBbGxvdyBFSVAtNzEyIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0VpcDcxMlNpZ25pbmcgPSBcIkFsbG93RWlwNzEyU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dFaXA3MTJTaWduaW5nID0gdHlwZW9mIEFsbG93RWlwNzEyU2lnbmluZztcblxuLyoqIEFsbG93IEJUQyBtZXNzYWdlIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nID0gXCJBbGxvd0J0Y01lc3NhZ2VTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nID0gdHlwZW9mIEFsbG93QnRjTWVzc2FnZVNpZ25pbmc7XG5cbi8qKiBBIHJlZmVyZW5jZSB0byBhbiBvcmctbGV2ZWwgbmFtZWQgcG9saWN5IGFuZCBpdHMgdmVyc2lvbiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5UmVmZXJlbmNlID0gYCR7c3RyaW5nfS92JHtudW1iZXJ9YCB8IGAke3N0cmluZ30vbGF0ZXN0YDtcblxuLyoqIEtleSBwb2xpY2llcyB0aGF0IHJlc3RyaWN0IHRoZSByZXF1ZXN0cyB0aGF0IHRoZSBzaWduaW5nIGVuZHBvaW50cyBhY2NlcHQgKi9cbmV4cG9ydCB0eXBlIEtleURlbnlQb2xpY3kgPVxuICB8IFR4UmVjZWl2ZXJcbiAgfCBUeERlcG9zaXRcbiAgfCBUeFZhbHVlTGltaXRcbiAgfCBUeEdhc0Nvc3RMaW1pdFxuICB8IElmRXJjMjBUeFxuICB8IEFzc2VydEVyYzIwVHhcbiAgfCBBc3NlcnRDb250cmFjdFR4XG4gIHwgU3VpVHhSZWNlaXZlcnNcbiAgfCBCdGNUeFJlY2VpdmVyc1xuICB8IFNvdXJjZUlwQWxsb3dsaXN0XG4gIHwgU29sYW5hSW5zdHJ1Y3Rpb25Qb2xpY3lcbiAgfCBCdGNTZWd3aXRWYWx1ZUxpbWl0XG4gIHwgUmVxdWlyZU1mYVxuICB8IFJlcXVpcmVSb2xlU2Vzc2lvblxuICB8IEJhYnlsb25TdGFraW5nXG4gIHwgV2ViaG9va1BvbGljeTtcblxuLyoqXG4gKiBLZXkgcG9saWN5XG4gKlxuICogQGV4YW1wbGUgW1xuICogICB7XG4gKiAgICAgXCJUeFJlY2VpdmVyXCI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCJcbiAqICAgfSxcbiAqICAge1xuICogICAgIFwiVHhEZXBvc2l0XCI6IHtcbiAqICAgICAgIFwia2luZFwiOiBcIkNhbm9uaWNhbFwiXG4gKiAgICAgfVxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJSZXF1aXJlTWZhXCI6IHtcbiAqICAgICAgIFwiY291bnRcIjogMSxcbiAqICAgICAgIFwiYWxsb3dlZF9tZmFfdHlwZXNcIjogW1wiQ3ViZVNpZ25lclwiXSxcbiAqICAgICAgIFwicmVzdHJpY3RlZF9vcGVyYXRpb25zXCI6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqIF1cbiAqXG4gKiBAZXhhbXBsZSBbXCJBc3NlcnRFcmMyMFR4XCIsIHsgXCJJZkVyYzIwVHhcIjogXCJ0cmFuc2Zlcl9saW1pdHNcIjogWyB7IFwibGltaXRcIjogXCIweDNCOUFDQTAwXCIgfSBdIH1dXG4gKi9cbmV4cG9ydCB0eXBlIEtleVBvbGljeSA9IEtleVBvbGljeVJ1bGVbXTtcblxuZXhwb3J0IHR5cGUgS2V5UG9saWN5UnVsZSA9XG4gIHwgS2V5RGVueVBvbGljeVxuICB8IEFsbG93UmF3QmxvYlNpZ25pbmdcbiAgfCBBbGxvd0VpcDE5MVNpZ25pbmdcbiAgfCBBbGxvd0VpcDcxMlNpZ25pbmdcbiAgfCBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nXG4gIHwgUG9saWN5UmVmZXJlbmNlO1xuXG4vKiogUm9sZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIFJvbGVQb2xpY3kgPSBSb2xlUG9saWN5UnVsZVtdO1xuXG5leHBvcnQgdHlwZSBSb2xlUG9saWN5UnVsZSA9IEtleURlbnlQb2xpY3kgfCBQb2xpY3lSZWZlcmVuY2U7XG5cbi8qKiBBIGtleSBndWFyZGVkIGJ5IGEgcG9saWN5LiAqL1xuZXhwb3J0IGNsYXNzIEtleVdpdGhQb2xpY2llcyB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkga2V5SWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgcG9saWN5PzogS2V5UG9saWN5O1xuXG4gIC8qKiBAcmV0dXJucyBUaGUga2V5ICovXG4gIGFzeW5jIGdldEtleSgpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5R2V0KHRoaXMua2V5SWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ga2V5V2l0aFBvbGljaWVzIFRoZSBrZXkgYW5kIGl0cyBwb2xpY2llc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBrZXlXaXRoUG9saWNpZXM6IEtleVdpdGhQb2xpY2llc0luZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy5rZXlJZCA9IGtleVdpdGhQb2xpY2llcy5rZXlfaWQ7XG4gICAgdGhpcy5wb2xpY3kgPSBrZXlXaXRoUG9saWNpZXMucG9saWN5IGFzIHVua25vd24gYXMgS2V5UG9saWN5O1xuICB9XG59XG5cbi8qKiBSb2xlcy4gKi9cbmV4cG9ydCBjbGFzcyBSb2xlIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAvKiogVGhlIHJvbGUgaW5mb3JtYXRpb24gKi9cbiAgI2RhdGE6IFJvbGVJbmZvO1xuXG4gIC8qKiBAcmV0dXJucyBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgcm9sZSAqL1xuICBnZXQgbmFtZSgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICpcbiAgICogQGV4YW1wbGUgUm9sZSNiZmUzZWNjYi03MzFlLTQzMGQtYjFlNS1hYzEzNjNlNmIwNmJcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLnJvbGVfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgdGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgcm9sZS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzXG4gICAqIHJlZmxlY3QgdGhlIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmdcbiAgICogYFJvbGUuZW5hYmxlZCgpYCBvciBgUm9sZS5kaXNhYmxlKClgKS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogUm9sZUluZm8ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICovXG4gIGFzeW5jIGRlbGV0ZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVEZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKiogQHJldHVybnMgV2hldGhlciB0aGUgcm9sZSBpcyBlbmFibGVkICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGVuYWJsZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGRpc2FibGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIHJvbGUpXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBSb2xlUG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgdG8gZXhpc3Rpbmcgcm9sZSBwb2xpY3kuIFRoaXMgYXBwZW5kIGlzIG5vdCBhdG9taWMtLS1pdCB1c2VzXG4gICAqIHtAbGluayBwb2xpY3l9IHRvIGZldGNoIHRoZSBjdXJyZW50IHBvbGljeSBhbmQgdGhlbiB7QGxpbmsgc2V0UG9saWN5fVxuICAgKiB0byBzZXQgdGhlIHBvbGljeS0tLWFuZCBzaG91bGQgbm90IGJlIHVzZWQgaW4gYWNyb3NzIGNvbmN1cnJlbnQgc2Vzc2lvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIHBvbGljeSB0byBhcHBlbmQgdG8gdGhlIGV4aXN0aW5nIG9uZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGFwcGVuZFBvbGljeShwb2xpY3k6IFJvbGVQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBmb3IgdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxSb2xlUG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIFJvbGVQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgYWxsIHVzZXJzIHdpdGggYWNjZXNzIHRvIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgXCJVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlwiLFxuICAgKiAgIFwiVXNlciM1NTkzYzI1Yi01MmUyLTRmYjUtYjM5Yi05NmQ0MWQ2ODFkODJcIlxuICAgKiBdXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCB1c2Vycy5cbiAgICovXG4gIGFzeW5jIHVzZXJzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCB1c2VycyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlcnNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuICh1c2VycyB8fCBbXSkubWFwKCh1KSA9PiB1LnVzZXJfaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgYWRkVXNlcih1c2VySWQ6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXNlckFkZCh0aGlzLmlkLCB1c2VySWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyB1c2VyIGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgdXNlci1pZCBvZiB0aGUgdXNlciB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJlbW92ZVVzZXIodXNlcklkOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJSZW1vdmUodGhpcy5pZCwgdXNlcklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBrZXlzIGluIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgIHtcbiAgICogICAgIGlkOiBcIktleSNiZmUzZWNjYi03MzFlLTQzMGQtYjFlNS1hYzEzNjNlNmIwNmJcIixcbiAgICogICAgIHBvbGljeTogeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAgICogICAgfSxcbiAgICogIF1cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIGtleXMgaW4gdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEtleVdpdGhQb2xpY2llc1tdPiB7XG4gICAgY29uc3Qga2V5c0luUm9sZSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5c0luUm9sZS5tYXAoKGspID0+IG5ldyBLZXlXaXRoUG9saWNpZXModGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbGlzdCBvZiBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlzIFRoZSBsaXN0IG9mIGtleXMgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqL1xuICBhc3luYyBhZGRLZXlzKGtleXM6IEtleVtdLCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleXNBZGQoXG4gICAgICB0aGlzLmlkLFxuICAgICAga2V5cy5tYXAoKGspID0+IGsuaWQpLFxuICAgICAgcG9saWN5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGV4aXN0aW5nIGtleSB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gdGhlIGtleS5cbiAgICovXG4gIGFzeW5jIGFkZEtleShrZXk6IEtleSwgcG9saWN5PzogS2V5UG9saWN5KSB7XG4gICAgYXdhaXQgdGhpcy5hZGRLZXlzKFtrZXldLCBwb2xpY3kpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyByZW1vdmVLZXkoa2V5OiBLZXkpIHtcbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleXNSZW1vdmUodGhpcy5pZCwga2V5LmlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2Vzc2lvbiBmb3IgdGhpcyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcHVycG9zZSBEZXNjcmlwdGl2ZSBwdXJwb3NlLlxuICAgKiBAcGFyYW0gbGlmZXRpbWVzIE9wdGlvbmFsIHNlc3Npb24gbGlmZXRpbWVzLlxuICAgKiBAcGFyYW0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLiBPbmx5IGBzaWduOipgIHNjb3BlcyBhcmUgYWxsb3dlZC5cbiAgICogQHJldHVybnMgTmV3IHNlc3Npb24uXG4gICAqL1xuICBhc3luYyBjcmVhdGVTZXNzaW9uKFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICBsaWZldGltZXM/OiBTZXNzaW9uTGlmZXRpbWUsXG4gICAgc2NvcGVzPzogU2NvcGVbXSxcbiAgKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbkNyZWF0ZUZvclJvbGUodGhpcy5pZCwgcHVycG9zZSwgc2NvcGVzLCBsaWZldGltZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLiBSZXR1cm5lZCBvYmplY3RzIGNhbiBiZSB1c2VkIHRvXG4gICAqIHJldm9rZSBpbmRpdmlkdWFsIHNlc3Npb25zLCBidXQgdGhleSBjYW5ub3QgYmUgdXNlZCBmb3IgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBzZXNzaW9ucy5cbiAgICogQHJldHVybnMgU2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuXG4gICAqL1xuICBhc3luYyBzZXNzaW9ucyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPFNpZ25lclNlc3Npb25JbmZvW10+IHtcbiAgICBjb25zdCBzZXNzaW9ucyA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uc0xpc3QoeyByb2xlOiB0aGlzLmlkIH0sIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIHNlc3Npb25zLm1hcCgodCkgPT4gbmV3IFNpZ25lclNlc3Npb25JbmZvKHRoaXMuI2FwaUNsaWVudCwgdC5zZXNzaW9uX2lkLCB0LnB1cnBvc2UpKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogUm9sZUluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZShyZXF1ZXN0OiBVcGRhdGVSb2xlUmVxdWVzdCwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0LCBtZmFSZWNlaXB0KTtcbiAgICB0aGlzLiNkYXRhID0gcmVzcC5kYXRhKCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHRoaXMuaWQpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG59XG4iXX0=