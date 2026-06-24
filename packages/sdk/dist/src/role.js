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
import { Key, SignerSessionInfo } from "./index.js";
/** The kind of deposit contracts. */
export var DepositContract;
(function (DepositContract) {
    /** Canonical deposit contract */
    DepositContract[DepositContract["Canonical"] = 0] = "Canonical";
    /** Wrapper deposit contract */
    DepositContract[DepositContract["Wrapper"] = 1] = "Wrapper";
})(DepositContract || (DepositContract = {}));
/** Allow raw blob signing */
export const AllowRawBlobSigning = "AllowRawBlobSigning";
/** Allow Diffie-Hellman exchange */
export const AllowDiffieHellmanExchange = "AllowDiffieHellmanExchange";
/** Allow EIP-191 signing */
export const AllowEip191Signing = "AllowEip191Signing";
/** Allow EIP-712 signing */
export const AllowEip712Signing = "AllowEip712Signing";
/** Allow BTC message signing */
export const AllowBtcMessageSigning = "AllowBtcMessageSigning";
/** A key guarded by a policy. */
export class KeyWithPolicies {
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
        return new Key(__classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f"), __classPrivateFieldGet(this, _KeyWithPolicies_cached, "f").key_info);
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
_KeyWithPolicies_apiClient = new WeakMap(), _KeyWithPolicies_cached = new WeakMap();
/** Roles. */
export class Role {
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
     * Attest to role properties.
     *
     * @param query Query parameters:
     * @param query.verbosity Role properties to include in an attestation. Defaults to basic role properties, including associated users, but excluding associated keys.
     * @param query.key_filter Filter down to a single associated key. Defaults to including all associated keys.
     * @returns A JWT whose claims are the role properties. The type of the returned JWT payload is {@link RoleAttestationClaims}.
     */
    async attest(query) {
        return await __classPrivateFieldGet(this, _Role_apiClient, "f").roleAttest(this.id, query);
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
        return sessions.map((t) => new SignerSessionInfo(__classPrivateFieldGet(this, _Role_apiClient, "f"), t.session_id, t.purpose));
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
_Role_apiClient = new WeakMap(), _Role_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQXVCQSxPQUFPLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBa0NwRCxxQ0FBcUM7QUFDckMsTUFBTSxDQUFOLElBQVksZUFLWDtBQUxELFdBQVksZUFBZTtJQUN6QixpQ0FBaUM7SUFDakMsK0RBQVMsQ0FBQTtJQUNULCtCQUErQjtJQUMvQiwyREFBTyxDQUFBO0FBQ1QsQ0FBQyxFQUxXLGVBQWUsS0FBZixlQUFlLFFBSzFCO0FBaVlELDZCQUE2QjtBQUM3QixNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRyxxQkFBOEIsQ0FBQztBQUdsRSxvQ0FBb0M7QUFDcEMsTUFBTSxDQUFDLE1BQU0sMEJBQTBCLEdBQUcsNEJBQXFDLENBQUM7QUFHaEYsNEJBQTRCO0FBQzVCLE1BQU0sQ0FBQyxNQUFNLGtCQUFrQixHQUFHLG9CQUE2QixDQUFDO0FBR2hFLDRCQUE0QjtBQUM1QixNQUFNLENBQUMsTUFBTSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSxnQ0FBZ0M7QUFDaEMsTUFBTSxDQUFDLE1BQU0sc0JBQXNCLEdBQUcsd0JBQWlDLENBQUM7QUE2SXhFLGlDQUFpQztBQUNqQyxNQUFNLE9BQU8sZUFBZTtJQU8xQixzQ0FBc0M7SUFDdEMsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLCtCQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELGlDQUFpQztJQUNqQyxJQUFJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBK0IsQ0FBQztJQUNyRCxDQUFDO0lBRUQsdUJBQXVCO0lBQ3ZCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsSUFBSSx1QkFBQSxJQUFJLCtCQUFRLENBQUMsUUFBUSxLQUFLLFNBQVMsSUFBSSx1QkFBQSxJQUFJLCtCQUFRLENBQUMs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ICBFdm1UeENtcCxcbiAgU29sYW5hVHhDbXAsXG4gIEtleVdpdGhQb2xpY2llc0luZm8sXG4gIFBhZ2VPcHRzLFxuICBSb2xlSW5mbyxcbiAgU2NvcGUsXG4gIFNlc3Npb25EYXRhLFxuICBTZXNzaW9uTGlmZXRpbWUsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxuICBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gIE9wZXJhdGlvbktpbmQsXG4gIE1mYVJlY2VpcHRzLFxuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEVtcHR5LFxuICBSZXN0cmljdGVkQWN0aW9uc01hcCxcbiAgR2V0Um9sZUtleU9wdGlvbnMsXG4gIEVkaXRQb2xpY3ksXG4gIE1mYVBvbGljeSxcbiAgUm9sZUluZm9Kd3QsXG59IGZyb20gXCIuL2luZGV4LnRzXCI7XG5pbXBvcnQgeyBLZXksIFNpZ25lclNlc3Npb25JbmZvIH0gZnJvbSBcIi4vaW5kZXgudHNcIjtcblxuLy8gdGhlc2UgdHlwZXMgYXJlIHVzZWQgaW4gZG9jIGNvbW1lbnRzIG9ubHlcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbmltcG9ydCB0eXBlIHsgUm9sZUF0dGVzdGF0aW9uQ2xhaW1zLCBSb2xlQXR0ZXN0YXRpb25RdWVyeSB9IGZyb20gXCIuL3NjaGVtYV90eXBlcy50c1wiO1xuXG50eXBlIE5hbWVPckFkZHJlc3NPck51bGwgPSBzdHJpbmcgfCBudWxsO1xuXG4vKiogT25seSBhbGxvdyB0aGUgZm9sbG93aW5nIG9wZXJhdGlvbnMgKi9cbmV4cG9ydCB0eXBlIE9wZXJhdGlvbkFsbG93bGlzdCA9IHsgT3BlcmF0aW9uQWxsb3dsaXN0OiBPcGVyYXRpb25LaW5kW10gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIEVWTSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogbnVsbCB9XG4gKiBAZXhhbXBsZSB7IFR4UmVjZWl2ZXI6IFtudWxsLCBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiXSB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4UmVjZWl2ZXIgPSB7IFR4UmVjZWl2ZXI6IE5hbWVPckFkZHJlc3NPck51bGwgfCBOYW1lT3JBZGRyZXNzT3JOdWxsW10gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIFNVSSB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBTdWlUeFJlY2VpdmVyOiBbIFwiMHhjOTgzN2EwYWQyZDExNDY4YmJmODQ3ZTNhZjRlM2VkZTgzN2JjYzAyYTFiZTZmYWVlNjIxZGYxYThhNDAzY2JmXCIgXSB9XG4gKi9cbmV4cG9ydCB0eXBlIFN1aVR4UmVjZWl2ZXJzID0geyBTdWlUeFJlY2VpdmVyczogc3RyaW5nW10gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgcmVjZWl2ZXIgZm9yIEJUQyB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUgeyBCdGNUeFJlY2VpdmVyczogWyBcImJjMXEzcWRhdmwzN2RuajZoanVhemR6ZHhrMGFhbndqc2c0NG1ndXE2NlwiLCBcImJjMXFmcmp0eG04ZzIwZzk3cXpnYWRnN3Y5czNmdGprcTAycWZzc2s4N1wiIF0gfVxuICovXG5leHBvcnQgdHlwZSBCdGNUeFJlY2VpdmVycyA9IHsgQnRjVHhSZWNlaXZlcnM6IHN0cmluZ1tdIH07XG5cbi8qKiBUaGUga2luZCBvZiBkZXBvc2l0IGNvbnRyYWN0cy4gKi9cbmV4cG9ydCBlbnVtIERlcG9zaXRDb250cmFjdCB7XG4gIC8qKiBDYW5vbmljYWwgZGVwb3NpdCBjb250cmFjdCAqL1xuICBDYW5vbmljYWwsXG4gIC8qKiBXcmFwcGVyIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgV3JhcHBlcixcbn1cblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0ID0gVHhEZXBvc2l0QmFzZSB8IFR4RGVwb3NpdFB1YmtleSB8IFR4RGVwb3NpdFJvbGU7XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRCYXNlID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0IH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCB3aXRoIGZpeGVkIHZhbGlkYXRvciAocHVia2V5KTpcbiAqXG4gKiBAZXhhbXBsZSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXNwb3NpdENvbnRyYWN0LkNhbm9uaWNhbCwgdmFsaWRhdG9yOiB7IHB1YmtleTogXCI4ODc5Li4uOFwifSB9fVxuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRQdWJrZXkgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHB1YmtleTogc3RyaW5nIH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCB3aXRoIGFueSB2YWxpZGF0b3Iga2V5IGluIGEgcm9sZTpcbiAqXG4gKiBAZXhhbXBsZSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXNwb3NpdENvbnRyYWN0LkNhbm9uaWNhbCwgdmFsaWRhdG9yOiB7IHJvbGVfaWQ6IFwiUm9sZSNjNjMuLi5hZlwifSB9fVxuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRSb2xlID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0OyByb2xlX2lkOiBzdHJpbmcgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHZhbHVlcyB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdCBpbiB3ZWkuXG4gKiBDdXJyZW50bHksIHRoaXMgb25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdCA9IFR4VmFsdWVMaW1pdFBlclR4IHwgVHhWYWx1ZUxpbWl0V2luZG93O1xuXG4vKipcbiAqIFJlc3RyaWN0IGluZGl2aWR1YWwgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0IGluIHdlaS5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogXCIweDEyQTA1RjIwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhWYWx1ZUxpbWl0UGVyVHggPSB7IFR4VmFsdWVMaW1pdDogc3RyaW5nIH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gdmFsdWVzLCBpbiB3ZWksIG92ZXIgYSB0aW1lIHdpbmRvdy5cbiAqIEN1cnJlbnRseSwgdGhpcyBvbmx5IGFwcGxpZXMgdG8gRVZNIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDg2NDAwIH19XG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDYwNDgwMCwgY2hhaW5faWRzOiBbIFwiMVwiLCBcIjVcIiBdIH19XG4gKiBAZXhhbXBsZSB7IFR4VmFsdWVMaW1pdDogeyBsaW1pdDogXCIweDEyQTA1RjIwMFwiLCB3aW5kb3c6IDYwNDgwMCwgZXhjZXB0X2NoYWluX2lkczogWyBcIjFcIiBdIH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdFdpbmRvdyA9IHtcbiAgVHhWYWx1ZUxpbWl0OiB7XG4gICAgLyoqXG4gICAgICogTWF4IGFsbG93ZWQgdmFsdWUgaW4gd2VpXG4gICAgICovXG4gICAgbGltaXQ6IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBPcHRpb25hbCBzbGlkaW5nIHRpbWUgd2luZG93IChpbiBzZWNvbmRzKS5cbiAgICAgKlxuICAgICAqIElmIHNwZWNpZmllZCwgdGhlIGBsaW1pdGAgYXBwbGllcyB0byB0aGUgYWdncmVnYXRlIHZhbHVlIG9mIGFsbCB0cmFuc2FjdGlvbnMgd2l0aGluIHRoYXRcbiAgICAgKiB0aW1lIHdpbmRvdzsgb3RoZXJ3aXNlLCB0aGUgd2luZG93IGlzIDAsIGkuZS4sIHRoZSBsaW1pdCBhcHBsaWVzIHRvIGluZGl2aWR1YWwgdHJhbnNhY3Rpb25zLlxuICAgICAqL1xuICAgIHdpbmRvdz86IG51bWJlcjtcbiAgICAvKipcbiAgICAgKiBPcHRpb25hbCBjaGFpbiBpZHMuXG4gICAgICpcbiAgICAgKiBJZiBzcGVjaWZpZWQsIHRoZSBwb2xpY3kgYXBwbGllcyBvbmx5IGlmIGEgdHJhbnNhY3Rpb24gaXMgb24gb25lIG9mIHRoZVxuICAgICAqIGdpdmVuIGNoYWlucyAob3RoZXJ3aXNlIGl0IGFwcGxpZXMgdG8gYWxsIHRyYW5zYWN0aW9ucykuIElmIGEgJ3dpbmRvdycgaXNcbiAgICAgKiBhbHNvIGRlZmluZWQsIHRoZSBwb2xpY3kgbGltaXQgYXBwbGllcyBjdW11bGF0aXZlbHkgYWNyb3NzIGFsbCBzcGVjaWZpZWQgY2hhaW5zLlxuICAgICAqXG4gICAgICogTXVzdCBub3QgYmUgc3BlY2lmaWVkIHRvZ2V0aGVyIHdpdGggYGV4Y2VwdF9jaGFpbl9pZHNgLlxuICAgICAqL1xuICAgIGNoYWluX2lkcz86IHN0cmluZ1tdO1xuICAgIC8qKlxuICAgICAqIE9wdGlvbmFsIGNoYWluIGlkcyB0byBleGNsdWRlLlxuICAgICAqXG4gICAgICogSWYgc3BlY2lmaWVkLCB0aGUgcG9saWN5IGFwcGxpZXMgb25seSBpZiBhIHRyYW5zYWN0aW9uIGlzIG9uIGEgY2hhaW4gaWQgbm90XG4gICAgICogaW5jbHVkZWQgaW4gdGhpcyBsaXN0LiBJZiBhICd3aW5kb3cnIGlzIGFsc28gZGVmaW5lZCwgdGhlIHBvbGljeSBsaW1pdCBhcHBsaWVzXG4gICAgICogY3VtdWxhdGl2ZWx5IGFjcm9zcyBhbGwgY2hhaW5zIG90aGVyIHRoYW4gdGhlIGxpc3RlZCBvbmVzLlxuICAgICAqXG4gICAgICogTXVzdCBub3QgYmUgc3BlY2lmaWVkIHRvZ2V0aGVyIHdpdGggYGNoYWluX2lkc2AuXG4gICAgICovXG4gICAgZXhjZXB0X2NoYWluX2lkcz86IHN0cmluZ1tdO1xuICB9O1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiBtYXggZ2FzIGNvc3RzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0IGluIHdlaS5cbiAqXG4gKiBAZXhhbXBsZSB7IFR4R2FzQ29zdExpbWl0OiBcIjB4MjdDQTU3MzU3QzAwMFwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhHYXNDb3N0TGltaXQgPSB7IFR4R2FzQ29zdExpbWl0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBSZXN0cmljdCBFUkMtMjAgbWV0aG9kIGNhbGxzIGFjY29yZGluZyB0byB0aGUge0BsaW5rIEVyYzIwUG9saWN5fS5cbiAqIE9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zIHRoYXQgY2FsbCBhIHZhbGlkIEVSQy0yMCBtZXRob2QuXG4gKiBOb24tRVJDLTIwIHRyYW5zYWN0aW9ucyBhcmUgaWdub3JlZCBieSB0aGlzIHBvbGljeS5cbiAqXG4gKiBAZXhhbXBsZSB7IElmRXJjMjBUeDogeyB0cmFuc2Zlcl9saW1pdHM6IFt7IGxpbWl0OiBcIjB4RThENEE1MTAwMFwiIH1dIH0gfVxuICogQGV4YW1wbGUgeyBJZkVyYzIwVHg6IHsgYWxsb3dlZF9jb250cmFjdHM6IFsgeyBhZGRyZXNzOiBcIjB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAzNGEyMGI4MDkwMDhhZmViMFwiLCBcImNoYWluX2lkXCI6IFwiMVwiIH0gXSB9IH1cbiAqL1xuZXhwb3J0IHR5cGUgSWZFcmMyMFR4ID0geyBJZkVyYzIwVHg6IEVyYzIwUG9saWN5IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIG9ubHkgYWxsb3cgdmFsaWQgRVJDLTIwIG1ldGhvZCBjYWxscy5cbiAqL1xuZXhwb3J0IHR5cGUgQXNzZXJ0RXJjMjBUeCA9IFwiQXNzZXJ0RXJjMjBUeFwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBvbmx5IGFsbG93IG5hdGl2ZSB0b2tlbiB0cmFuc2ZlcnMuXG4gKi9cbmV4cG9ydCB0eXBlIEFzc2VydFRyYW5zZmVyT25seVR4ID0gXCJBc3NlcnRUcmFuc2Zlck9ubHlUeFwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IEVSQy0yMCBgdHJhbnNmZXJgIGFuZCBgdHJhbnNmZXJGcm9tYCB0cmFuc2FjdGlvbiB2YWx1ZXMgYW5kIHJlY2VpdmVycy5cbiAqIE9ubHkgYXBwbGllcyB0byBjb250cmFjdHMgZGVmaW5lZCBpbiBgYXBwbGllc190b19jb250cmFjdHNgLFxuICogb3IgdG8gYWxsIGNvbnRyYWN0cyBpZiBub3QgZGVmaW5lZC5cbiAqIFRoZSBsaW1pdCBpcyBpbiB0aGUgdG9rZW4ncyB1bml0LlxuICovXG5leHBvcnQgdHlwZSBFcmMyMFRyYW5zZmVyTGltaXQgPSB7XG4gIGxpbWl0Pzogc3RyaW5nO1xuICByZWNlaXZlcnM/OiBzdHJpbmdbXTtcbiAgYXBwbGllc190b19jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgRVJDLTIwIGBhcHByb3ZlYCB0cmFuc2FjdGlvbiB2YWx1ZXMgYW5kIHNwZW5kZXJzLlxuICogT25seSBhcHBsaWVzIHRvIGNvbnRyYWN0cyBkZWZpbmVkIGluIGBhcHBsaWVzX3RvX2NvbnRyYWN0c2AsXG4gKiBvciB0byBhbGwgY29udHJhY3RzIGlmIG5vdCBkZWZpbmVkLlxuICogVGhlIGxpbWl0IGlzIGluIHRoZSB0b2tlbidzIHVuaXQuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwQXBwcm92ZUxpbWl0ID0ge1xuICBsaW1pdD86IHN0cmluZztcbiAgc3BlbmRlcnM/OiBzdHJpbmdbXTtcbiAgYXBwbGllc190b19jb250cmFjdHM/OiBDb250cmFjdEFkZHJlc3NbXTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3RzIEVSQy0yMCBwb2xpY2llcyB0byBhIHNldCBvZiBrbm93biBjb250cmFjdHMsXG4gKiBhbmQgY2FuIGRlZmluZSBsaW1pdHMgb24gYHRyYW5zZmVyYCwgYHRyYW5zZmVyRnJvbWAgYW5kIGBhcHByb3ZlYCBtZXRob2QgY2FsbHMuXG4gKi9cbmV4cG9ydCB0eXBlIEVyYzIwUG9saWN5ID0ge1xuICBhbGxvd2VkX2NvbnRyYWN0cz86IENvbnRyYWN0QWRkcmVzc1tdO1xuICB0cmFuc2Zlcl9saW1pdHM/OiBFcmMyMFRyYW5zZmVyTGltaXRbXTtcbiAgYXBwcm92ZV9saW1pdHM/OiBFcmMyMEFwcHJvdmVMaW1pdFtdO1xufTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gb25seSBhbGxvdyBjYWxsaW5nIHRoZSBnaXZlbiBtZXRob2RzIGluIHRoZSBnaXZlbiBjb250cmFjdHMuXG4gKlxuICogQGV4YW1wbGUgeyBBc3NlcnRDb250cmFjdFR4OiB7XG4gKiAgIGFsbG93bGlzdDogW3tcbiAqICAgICBhZGRyZXNzOiB7IGFkZHJlc3M6IFwiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDM0YTIwYjgwOTAwOGFmZWIwXCIsIFwiY2hhaW5faWRcIjogXCIxXCIgfSxcbiAqICAgICBtZXRob2RzOiBbXG4gKiAgICAgICBcImZ1bmN0aW9uIG5hbWUoKSBwdWJsaWMgdmlldyByZXR1cm5zIChzdHJpbmcpXCIsXG4gKiAgICAgICBcImZ1bmN0aW9uIHRyYW5zZmVyKGFkZHJlc3MgdG8sIHVpbnQyNTYgdmFsdWUpIHB1YmxpYyByZXR1cm5zIChib29sIHN1Y2Nlc3MpXCJcbiAqICAgICBdXG4gKiAgIH1dXG4gKiB9XG4gKi9cbmV4cG9ydCB0eXBlIEFzc2VydENvbnRyYWN0VHggPSB7XG4gIEFzc2VydENvbnRyYWN0VHg6IHtcbiAgICBhbGxvd2xpc3Q6IHtcbiAgICAgIGFkZHJlc3M6IENvbnRyYWN0QWRkcmVzcztcbiAgICAgIG1ldGhvZHM6IHN0cmluZ1tdO1xuICAgIH1bXTtcbiAgfTtcbn07XG5cbi8qKlxuICogU29sYW5hIGFkZHJlc3MgbWF0Y2hlci5cbiAqIENhbiBiZSBlaXRoZXIgdGhlIHB1YmtleSBvZiB0aGUgYWNjb3VudCB1c2luZyBiYXNlNTggZW5jb2RpbmcsXG4gKiBvciB0aGUgaW5kZXggb2YgdGhlIHB1YmtleSBvZiBhbiBhZGRyZXNzIGxvb2t1cCB0YWJsZSBhbmQgdGhlXG4gKiBpbmRleCBvZiB0aGUgYWNjb3VudCBpbiB0aGF0IHRhYmxlLlxuICovXG5leHBvcnQgdHlwZSBTb2xhbmFBZGRyZXNzTWF0Y2hlciA9XG4gIHwgc3RyaW5nXG4gIHwge1xuICAgICAgYWx0X2FkZHJlc3M6IHN0cmluZztcbiAgICAgIGluZGV4OiBudW1iZXI7XG4gICAgfTtcblxuLyoqXG4gKiBTb2xhbmEgaW5zdHJ1Y3Rpb24gbWF0Y2hlci5cbiAqL1xuZXhwb3J0IHR5cGUgU29sYW5hSW5zdHJ1Y3Rpb25NYXRjaGVyID0ge1xuICBwcm9ncmFtX2lkOiBzdHJpbmc7XG4gIGluZGV4PzogbnVtYmVyO1xuICBhY2NvdW50cz86IChcbiAgICB8IHtcbiAgICAgICAgYWRkcmVzczogU29sYW5hQWRkcmVzc01hdGNoZXIgfCBTb2xhbmFBZGRyZXNzTWF0Y2hlcltdO1xuICAgICAgfVxuICAgIHwgKHtcbiAgICAgICAgLyoqIEBkZXByZWNhdGVkIHVzZSBgYWRkcmVzc2AgaW5zdGVhZC4gKi9cbiAgICAgICAgcHVia2V5OiBzdHJpbmc7XG4gICAgICB9ICYge1xuICAgICAgICBpbmRleDogbnVtYmVyO1xuICAgICAgfSlcbiAgKVtdO1xuICBkYXRhPzpcbiAgICB8IHN0cmluZ1xuICAgIHwge1xuICAgICAgICBkYXRhOiBzdHJpbmc7XG4gICAgICAgIHN0YXJ0X2luZGV4OiBudW1iZXI7XG4gICAgICB9W107XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0cyBTb2xhbmEgdHJhbnNhY3Rpb24gaW5zdHJ1Y3Rpb25zLiBDYW4gbGltaXQgdGhlIG51bWJlciBvZiBpbnN0cnVjdGlvbnMsXG4gKiB0aGUgbGlzdCBvZiBhbGxvd2VkIGluc3RydWN0aW9ucywgYW5kIGEgc2V0IG9mIHJlcXVpcmVkIGluc3RydWN0aW9ucyBpbiBhbGwgdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgdHlwZSBTb2xhbmFJbnN0cnVjdGlvblBvbGljeSA9IHtcbiAgU29sYW5hSW5zdHJ1Y3Rpb25Qb2xpY3k6IHtcbiAgICBjb3VudD86IHtcbiAgICAgIG1pbj86IG51bWJlcjtcbiAgICAgIG1heD86IG51bWJlcjtcbiAgICB9O1xuICAgIGFsbG93bGlzdD86IFNvbGFuYUluc3RydWN0aW9uTWF0Y2hlcltdO1xuICAgIHJlcXVpcmVkPzogU29sYW5hSW5zdHJ1Y3Rpb25NYXRjaGVyW107XG4gIH07XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSB0b3RhbCB2YWx1ZSB0cmFuc2ZlcnJlZCBvdXQgb2YgdGhlIGlucHV0cyBpbiBhIEJpdGNvaW4gU2Vnd2l0IHRyYW5zYWN0aW9uXG4gKiB0byBhbW91bnRzIGF0IG9yIGJlbG93IHRoZSBnaXZlbiBsaW1pdC5cbiAqL1xuZXhwb3J0IHR5cGUgQnRjU2Vnd2l0VmFsdWVMaW1pdCA9IEJ0Y1NlZ3dpdFZhbHVlTGltaXRQZXJUeCB8IEJ0Y1NlZ3dpdFZhbHVlTGltaXRXaW5kb3c7XG5cbi8qKlxuICogUmVzdHJpY3QgaW5kaXZpZHVhbCBCaXRjb2luIFNlZ3dpdCB0cmFuc2FjdGlvbiB2YWx1ZXMgdG8gYW1vdW50cyBhdCBvciBiZWxvd1xuICogdGhlIGdpdmVuIGxpbWl0LlxuICpcbiAqIEBleGFtcGxlIHsgQnRjU2Vnd2l0VmFsdWVMaW1pdDogXCIxMDAwMDAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBCdGNTZWd3aXRWYWx1ZUxpbWl0UGVyVHggPSB7XG4gIEJ0Y1NlZ3dpdFZhbHVlTGltaXQ6IG51bWJlcjtcbn07XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIHRvdGFsIHZhbHVlIHRyYW5zZmVycmVkIG91dCBvZiB0aGUgaW5wdXRzIGluIEJpdGNvaW4gU2Vnd2l0IHRyYW5zYWN0aW9uc1xuICogb3ZlciBhIHRpbWUgd2luZG93LlxuICpcbiAqIEBleGFtcGxlIHsgQnRjU2Vnd2l0VmFsdWVMaW1pdDogeyBsaW1pdDogXCIxMDAwMDAwXCIsIHdpbmRvdzogODY0MDAgfX1cbiAqL1xuZXhwb3J0IHR5cGUgQnRjU2Vnd2l0VmFsdWVMaW1pdFdpbmRvdyA9IHtcbiAgQnRjU2Vnd2l0VmFsdWVMaW1pdDoge1xuICAgIGxpbWl0OiBudW1iZXI7XG4gICAgd2luZG93PzogbnVtYmVyO1xuICB9O1xufTtcblxuLyoqXG4gKiBPbmx5IGFsbG93IGNvbm5lY3Rpb25zIGZyb20gY2xpZW50cyB3aG9zZSBJUCBhZGRyZXNzZXMgbWF0Y2ggYW55IG9mIHRoZXNlIElQdjQgQ0lEUiBibG9ja3MuXG4gKlxuICogQGV4YW1wbGUgeyBTb3VyY2VJcEFsbG93bGlzdDogWyBcIjEyMy40NTYuNzguOS8xNlwiIF0gfVxuICovXG5leHBvcnQgdHlwZSBTb3VyY2VJcEFsbG93bGlzdCA9IHsgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdIH07XG5cbi8qKlxuICogRGlzYWxsb3cgc2lnbmluZyB1bnRpbCB0aGUgc3BlY2lmaWVkIFVuaXggdGltZXN0YW1wIChpbiBzZWNvbmRzIHNpbmNlIGVwb2NoKS5cbiAqXG4gKiBAZXhhbXBsZSB7IFRpbWVMb2NrOiAxNzUwMDAwMDAwIH1cbiAqL1xuZXhwb3J0IHR5cGUgVGltZUxvY2sgPSB7IFRpbWVMb2NrOiBudW1iZXIgfTtcblxuZXhwb3J0IHR5cGUgSHR0cFJlcXVlc3RDb21wYXJlciA9IFwiRXFcIiB8IHsgRXZtVHg6IEV2bVR4Q21wIH0gfCB7IFNvbGFuYVR4OiBTb2xhbmFUeENtcCB9O1xuXG4vKipcbiAqIFJlcXVpcmUgTUZBIGZvciB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUge1xuICogICAgIFJlcXVpcmVNZmE6IHtcbiAqICAgICAgIGNvdW50OiAxLFxuICogICAgICAgYWxsb3dlZF9tZmFfdHlwZXM6IFsgXCJUb3RwXCIgXSxcbiAqICAgICAgIGFsbG93ZWRfYXBwcm92ZXJzOiBbIFwiVXNlciMxMjNcIiBdLFxuICogICAgICAgcmVzdHJpY3RlZF9vcGVyYXRpb25zOiBbXG4gKiAgICAgICAgIFwiRXRoMVNpZ25cIixcbiAqICAgICAgICAgXCJCbG9iU2lnblwiXG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICB9XG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVNZmEgPSB7XG4gIFJlcXVpcmVNZmE6IE1mYVBvbGljeTtcbn07XG5cbi8qKlxuICogUmVxdWlyZSB0aGF0IHRoZSBrZXkgaXMgYWNjZXNzZWQgdmlhIGEgcm9sZSBzZXNzaW9uLlxuICpcbiAqIEBleGFtcGxlIHsgXCJSZXF1aXJlUm9sZVNlc3Npb25cIjogXCIqXCIgfVxuICogQGV4YW1wbGUgeyBcIlJlcXVpcmVSb2xlU2Vzc2lvblwiOiBbXG4gKiAgIFwiUm9sZSMzNGRmYjY1NC1mMzZkLTQ4ZWEtYmRmNi04MzNjMGQ5NGI3NTlcIixcbiAqICAgXCJSb2xlIzk4ZDg3NjMzLWQxYTctNDYxMi1iNmI0LWIyZmEyYjQzY2QzZFwiXG4gKiBdfVxuICovXG5leHBvcnQgdHlwZSBSZXF1aXJlUm9sZVNlc3Npb24gPSB7XG4gIC8qKiBSZXF1aXJlIGVpdGhlciBhbnkgcm9sZSBzZXNzaW9uIG9yIGFueSBvbmUgb2YgdGhlIGFwcHJvdmVkIHJvbGVzICovXG4gIFJlcXVpcmVSb2xlU2Vzc2lvbjogXCIqXCIgfCBzdHJpbmdbXTtcbn07XG5cbi8qKlxuICogRm9yd2FyZHMgdGhlIHJlcXVlc3QgcGFyYW1ldGVycyB0byB0aGlzIHdlYmhvb2sgd2hpY2ggZGV0ZXJtaW5lc1xuICogd2hldGhlciB0aGUgcmVxdWVzdCBpcyBhbGxvd2VkIHRvIGJlIGV4ZWN1dGVkLlxuICovXG5leHBvcnQgdHlwZSBXZWJob29rUG9saWN5ID0ge1xuICBXZWJob29rOiB7XG4gICAgLyoqIFRoZSB1cmwgb2YgdGhlIHdlYmhvb2sgKi9cbiAgICB1cmw6IHN0cmluZztcblxuICAgIC8qKiBPcHRpb25hbCBIVFRQIG1ldGhvZCB0byB1c2UuIERlZmF1bHRzIHRvIFBPU1QuICovXG4gICAgbWV0aG9kPzogc3RyaW5nO1xuXG4gICAgLyoqIE9wdGlvbmFsIEhUVFAgaGVhZGVycyB0byBzZXQgKi9cbiAgICBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgZXhlY3V0aW9uIHRpbWVvdXQgaW4gc2Vjb25kczsgbXVzdCBiZSBhdCBsZWFzdCAxIG5vdCBleGNlZWQgNSBzZWNvbmRzLlxuICAgICAqIERlZmF1bHRzIHRvIDUuXG4gICAgICovXG4gICAgdGltZW91dD86IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIEN1YmVTaWduZXIgb3BlcmF0aW9ucyB0byB3aGljaCB0aGlzIHBvbGljeSBzaG91bGQgYXBwbHkuXG4gICAgICogV2hlbiBvbWl0dGVkLCBhcHBsaWVzIHRvIGFsbCBvcGVyYXRpb25zLlxuICAgICAqL1xuICAgIHJlc3RyaWN0ZWRfb3BlcmF0aW9ucz86IE9wZXJhdGlvbktpbmRbXTtcbiAgfTtcbn07XG5cbi8qKiBCYWJ5bG9uIHN0YWtpbmcgcG9saWN5ICovXG5leHBvcnQgdHlwZSBCYWJ5bG9uU3Rha2luZyA9IHtcbiAgQmFieWxvblN0YWtpbmc6IHtcbiAgICAvKipcbiAgICAgKiBQdWJsaWMga2V5cyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdGFraW5nLiBNdXN0IGJlIGRlZmluZWQgaWYgdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkXG4gICAgICogdG8gYSBTZWdXaXQga2V5OyBvdGhlcndpc2UsIGlmIGB1bmRlZmluZWRgLCBvbmx5IHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZ1xuICAgICAqIGFwcGxpZWQgY2FuIGJlIHVzZWQgYXMgdGhlIHN0YWtpbmcgcHVibGljIGtleSB3aGVuIGNyZWF0aW5nIEJhYnlsb24tcmVsYXRlZCB0cmFuc2FjdGlvbnMuXG4gICAgICpcbiAgICAgKiBIZXgtZW5jb2RlZCBwdWJsaWMga2V5cywgV0lUSE9VVCB0aGUgbGVhZGluZyAnMHgnLlxuICAgICAqL1xuICAgIGFsbG93ZWRfc3Rha2VyX3Brcz86IHN0cmluZ1tdO1xuXG4gICAgLyoqXG4gICAgICogRmluYWxpdHkgcHJvdmlkZXJzIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHN0YWtpbmcuIElmIGB1bmRlZmluZWRgLCBhbnkgZmluYWxpdHlcbiAgICAgKiBwcm92aWRlciBjYW4gYmUgdXNlZC5cbiAgICAgKlxuICAgICAqIEhleC1lbmNvZGVkIHB1YmxpYyBrZXlzLCBXSVRIT1VUIHRoZSBsZWFkaW5nICcweCcuXG4gICAgICovXG4gICAgYWxsb3dlZF9maW5hbGl0eV9wcm92aWRlcl9wa3M/OiBzdHJpbmdbXTtcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBhZGRyZXNzZXMgdGhhdCBjYW4gYmUgdXNlZCBpbiBzdGFraW5nIHRyYW5zYWN0aW9ucy4gSWYgYHVuZGVmaW5lZGAsIG9ubHlcbiAgICAgKiB0aGUga2V5IHRvIHdoaWNoIHRoZSBwb2xpY3kgaXMgYmVpbmcgYXBwbGllZCBjYW4gYmUgdXNlZCBhcyB0aGUgY2hhbmdlIGFkZHJlc3MuXG4gICAgICovXG4gICAgYWxsb3dlZF9jaGFuZ2VfYWRkcnM/OiBzdHJpbmdbXTtcblxuICAgIC8qKlxuICAgICAqIFdpdGhkcmF3YWwgYWRkcmVzc2VzIHRoYXQgY2FuIGJlIHVzZWQgaW4gd2l0aGRyYXdhbCB0eG5zLiBJZiBgdW5kZWZpbmVkYCwgb25seVxuICAgICAqIHRoZSBrZXkgdG8gd2hpY2ggdGhlIHBvbGljeSBpcyBiZWluZyBhcHBsaWVkIGNhbiBiZSB1c2VkIGFzIHRoZSB3aXRoZHJhd2FsIGFkZHJlc3MuXG4gICAgICovXG4gICAgYWxsb3dlZF93aXRoZHJhd2FsX2FkZHJzPzogc3RyaW5nW107XG5cbiAgICAvKiogQmFieWxvbiBuZXR3b3JrcyB0aGF0IHRoaXMga2V5IGNhbiBiZSB1c2VkIHdpdGguIElmIGB1bmRlZmluZWRgLCBhbnkgbmV0d29yay4gKi9cbiAgICBhbGxvd2VkX25ldHdvcmtfaWRzPzogQmFieWxvblN0YWtpbmdSZXF1ZXN0W1wibmV0d29ya1wiXVtdO1xuXG4gICAgLyoqXG4gICAgICogTWF4IGZlZSBhbGxvd2VkIGluIGEgc3Rha2luZyBvciB3aXRoZHJhd2FsIHR4bi4gSWYgYHVuZGVmaW5lZGAsIHRoZXJlIGlzIG5vIGZlZSBsaW1pdC5cbiAgICAgKiBOb3RlIHRoYXQgdGhlIGZlZSBmb3Igdm9sdW50YXJ5IHVuYm9uZGluZyBhbmQgc2xhc2hpbmcgYXJlIGZpeGVkIGJ5IHRoZSBCYWJ5bG9uXG4gICAgICogcGFyYW1zLCBhbmQgdGhpcyBsaW1pdCBpcyBub3QgZW5mb3JjZWQgaW4gdGhvc2UgY2FzZXMuXG4gICAgICovXG4gICAgbWF4X2ZlZT86IG51bWJlcjtcblxuICAgIC8qKiBNaW4gc3Rha2luZyB0aW1lIGluIHNlY29uZHMuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1pbl9sb2NrX3RpbWU/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4IHN0YWtpbmcgdGltZSBpbiBzZWNvbmRzLiBJZiBgdW5kZWZpbmVkYCwgdXNlcyB0aGUgbGltaXQgZGVmaW5lZCBieSB0aGUgQmFieWxvbiBzdGFraW5nIHBhcmFtcy4gKi9cbiAgICBtYXhfbG9ja190aW1lPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbiBzdGFraW5nIGFtb3VudCBpbiBTQVQuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1pbl9zdGFraW5nX3ZhbHVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1heCBzdGFraW5nIGFtb3VudCBpbiBTQVQuIElmIGB1bmRlZmluZWRgLCB1c2VzIHRoZSBsaW1pdCBkZWZpbmVkIGJ5IHRoZSBCYWJ5bG9uIHN0YWtpbmcgcGFyYW1zLiAqL1xuICAgIG1heF9zdGFraW5nX3ZhbHVlPzogbnVtYmVyO1xuXG4gICAgLyoqIE1pbmltdW0gbmV0d29yayBwYXJhbWV0ZXJzIHZlcnNpb24gYWxsb3dlZC4gKi9cbiAgICBtaW5fcGFyYW1zX3ZlcnNpb24/OiBudW1iZXI7XG5cbiAgICAvKiogTWF4aW11bSBuZXR3b3JrIHBhcmFtZXRlcnMgdmVyc2lvbiBhbGxvd2VkLiAqL1xuICAgIG1heF9wYXJhbXNfdmVyc2lvbj86IG51bWJlcjtcbiAgfTtcbn07XG5cbi8qKiBBbGxvdyByYXcgYmxvYiBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dSYXdCbG9iU2lnbmluZyA9IFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dSYXdCbG9iU2lnbmluZyA9IHR5cGVvZiBBbGxvd1Jhd0Jsb2JTaWduaW5nO1xuXG4vKiogQWxsb3cgRGlmZmllLUhlbGxtYW4gZXhjaGFuZ2UgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0RpZmZpZUhlbGxtYW5FeGNoYW5nZSA9IFwiQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2VcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93RGlmZmllSGVsbG1hbkV4Y2hhbmdlID0gdHlwZW9mIEFsbG93RGlmZmllSGVsbG1hbkV4Y2hhbmdlO1xuXG4vKiogQWxsb3cgRUlQLTE5MSBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dFaXAxOTFTaWduaW5nID0gXCJBbGxvd0VpcDE5MVNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93RWlwMTkxU2lnbmluZyA9IHR5cGVvZiBBbGxvd0VpcDE5MVNpZ25pbmc7XG5cbi8qKiBBbGxvdyBFSVAtNzEyIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0VpcDcxMlNpZ25pbmcgPSBcIkFsbG93RWlwNzEyU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dFaXA3MTJTaWduaW5nID0gdHlwZW9mIEFsbG93RWlwNzEyU2lnbmluZztcblxuLyoqIEFsbG93IEJUQyBtZXNzYWdlIHNpZ25pbmcgKi9cbmV4cG9ydCBjb25zdCBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nID0gXCJBbGxvd0J0Y01lc3NhZ2VTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nID0gdHlwZW9mIEFsbG93QnRjTWVzc2FnZVNpZ25pbmc7XG5cbmV4cG9ydCB0eXBlIEFsbG93UG9saWN5ID1cbiAgfCBBbGxvd1Jhd0Jsb2JTaWduaW5nXG4gIHwgQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2VcbiAgfCBBbGxvd0VpcDE5MVNpZ25pbmdcbiAgfCBBbGxvd0VpcDcxMlNpZ25pbmdcbiAgfCBBbGxvd0J0Y01lc3NhZ2VTaWduaW5nO1xuXG4vKiogQSByZWZlcmVuY2UgdG8gYW4gb3JnLWxldmVsIG5hbWVkIHBvbGljeSwgdXNpbmcgaXRzIG5hbWUvaWQgYW5kIGl0cyB2ZXJzaW9uICovXG5leHBvcnQgdHlwZSBQb2xpY3lSZWZlcmVuY2UgPSBgJHtzdHJpbmd9L3Yke251bWJlcn1gIHwgYCR7c3RyaW5nfS9sYXRlc3RgO1xuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIGFuIG9yZy1sZXZlbCBuYW1lZCBwb2xpY3kgdXNpbmcgaXRzIGlkLlxuICogV2UgY2Fubm90IHVzZSB0aGUgcG9saWN5J3MgbmFtZSBpbiB0aGlzIGZvcm1hdC5cbiAqL1xuZXhwb3J0IHR5cGUgTmFtZWRQb2xpY3lSZWZlcmVuY2UgPSB7XG4gIFJlZmVyZW5jZTogUG9saWN5UmVmZXJlbmNlO1xufTtcblxuLyoqIEV4cGxpY2l0IFwicGVybWl0XCIgdnMgXCJkZW55XCIgcG9saWN5IG91dGNvbWUsIHdpdGggb3Igd2l0aG91dCBhIGRlc2NyaXB0aXZlIG1lc3NhZ2UuICovXG5leHBvcnQgdHlwZSBDb25zdCA9IENvbnN0T3V0Y29tZSB8IHsgb3V0Y29tZTogQ29uc3RPdXRjb21lOyBtZXNzYWdlOiBzdHJpbmcgfTtcblxuLyoqIEV4cGxpY2l0IFwicGVybWl0XCIgdnMgXCJkZW55XCIgcG9saWN5IG91dGNvbWUuICovXG5leHBvcnQgdHlwZSBDb25zdE91dGNvbWUgPSBcIlBlcm1pdFwiIHwgXCJEZW55XCI7XG5cbi8qKlxuICogQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9jZWwtc3BlYyBDb21tb24gRXhwcmVzc2lvbiBMYW5ndWFnZX1cbiAqIHBvbGljeSB0byBldmFsdWF0ZSBhZ2FpbnN0IHRoZSBmb2xsb3dpbmcgY29udGV4dDpcbiAqXG4gKiBgYGBqc29uXG4gKiB7XG4gKiAgIFwib3BlcmF0aW9uXCI6IE9wZXJhdGlvbktpbmQsXG4gKiAgIFwiaWRlbnRpdHlcIjogPFVzZXJPclJvbGVJZD4sXG4gKiAgIFwiYm9keVwiOiA8UmVxdWVzdEJvZHlKc29uPlxuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCB0eXBlIENlbCA9IHsgQ2VsOiBzdHJpbmcgfTtcblxuLyoqIEtleSBwb2xpY2llcyB0aGF0IHJlc3RyaWN0IHRoZSByZXF1ZXN0cyB0aGF0IHRoZSBzaWduaW5nIGVuZHBvaW50cyBhY2NlcHQgKi9cbmV4cG9ydCB0eXBlIEtleURlbnlQb2xpY3kgPVxuICB8IENvbnN0XG4gIHwgQ2VsXG4gIHwgT3BlcmF0aW9uQWxsb3dsaXN0XG4gIHwgVHhSZWNlaXZlclxuICB8IFR4RGVwb3NpdFxuICB8IFR4VmFsdWVMaW1pdFxuICB8IFR4R2FzQ29zdExpbWl0XG4gIHwgSWZFcmMyMFR4XG4gIHwgQXNzZXJ0RXJjMjBUeFxuICB8IEFzc2VydFRyYW5zZmVyT25seVR4XG4gIHwgQXNzZXJ0Q29udHJhY3RUeFxuICB8IFN1aVR4UmVjZWl2ZXJzXG4gIHwgQnRjVHhSZWNlaXZlcnNcbiAgfCBTb3VyY2VJcEFsbG93bGlzdFxuICB8IFRpbWVMb2NrXG4gIHwgU29sYW5hSW5zdHJ1Y3Rpb25Qb2xpY3lcbiAgfCBCdGNTZWd3aXRWYWx1ZUxpbWl0XG4gIHwgUmVxdWlyZU1mYVxuICB8IFJlcXVpcmVSb2xlU2Vzc2lvblxuICB8IEJhYnlsb25TdGFraW5nXG4gIHwgV2ViaG9va1BvbGljeVxuICB8IFBvbGljeUFuZFxuICB8IFBvbGljeU9yXG4gIHwgUG9saWN5Tm90XG4gIHwgUG9saWN5SXRlXG4gIHwgTmFtZWRQb2xpY3lSZWZlcmVuY2U7XG5cbi8qKlxuICogS2V5IHBvbGljeVxuICpcbiAqIEBleGFtcGxlIFtcbiAqICAge1xuICogICAgIFwiVHhSZWNlaXZlclwiOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiXG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlR4RGVwb3NpdFwiOiB7XG4gKiAgICAgICBcImtpbmRcIjogXCJDYW5vbmljYWxcIlxuICogICAgIH1cbiAqICAgfSxcbiAqICAge1xuICogICAgIFwiUmVxdWlyZU1mYVwiOiB7XG4gKiAgICAgICBcImNvdW50XCI6IDEsXG4gKiAgICAgICBcImFsbG93ZWRfbWZhX3R5cGVzXCI6IFtcIkN1YmVTaWduZXJcIl0sXG4gKiAgICAgICBcInJlc3RyaWN0ZWRfb3BlcmF0aW9uc1wiOiBbXG4gKiAgICAgICAgIFwiRXRoMVNpZ25cIixcbiAqICAgICAgICAgXCJCbG9iU2lnblwiXG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICB9XG4gKiBdXG4gKlxuICogQGV4YW1wbGUgW1wiQXNzZXJ0RXJjMjBUeFwiLCB7IFwiSWZFcmMyMFR4XCI6IFwidHJhbnNmZXJfbGltaXRzXCI6IFsgeyBcImxpbWl0XCI6IFwiMHgzQjlBQ0EwMFwiIH0gXSB9XVxuICovXG5leHBvcnQgdHlwZSBLZXlQb2xpY3kgPSBLZXlQb2xpY3lSdWxlW107XG5cbmV4cG9ydCB0eXBlIEtleVBvbGljeVJ1bGUgPSBLZXlEZW55UG9saWN5IHwgQWxsb3dQb2xpY3kgfCBQb2xpY3lSZWZlcmVuY2U7XG5cbi8qKiBSb2xlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgUm9sZVBvbGljeSA9IFJvbGVQb2xpY3lSdWxlW107XG5cbmV4cG9ydCB0eXBlIFJvbGVQb2xpY3lSdWxlID0gS2V5RGVueVBvbGljeSB8IFBvbGljeVJlZmVyZW5jZTtcblxuLyoqIENvbmRpdGlvbmFsIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgQ29uZGl0aW9uYWwgPSB7XG4gIC8qKiBUaGUgY29uZGl0aW9uIHRvIGV2YWx1YXRlIGZpcnN0LiAqL1xuICBpZjogS2V5RGVueVBvbGljeTtcblxuICAvKiogVGhlIHBvbGljeSB0byBhcHBseSB3aGVuIHRoZSBjb25kaXRpb24gZXZhbHVhdGVzIHRvICdQZXJtaXQnLiAqL1xuICB0aGVuOiBLZXlEZW55UG9saWN5O1xufTtcblxuLyoqIE9uZSBvciBtb3JlIGNvbmRpdGlvbmFsIHBvbGljaWVzICovXG5leHBvcnQgdHlwZSBDb25kaXRpb25hbHMgPVxuICB8IENvbmRpdGlvbmFsXG4gIHwge1xuICAgICAgY29uZGl0aW9uYWxzOiBDb25kaXRpb25hbFtdO1xuICAgIH07XG5cbi8qKiBJZi10aGVuLWVsc2UgcG9saWN5ICovXG5leHBvcnQgdHlwZSBQb2xpY3lJdGUgPSB7XG4gIElmVGhlbkVsc2U6IENvbmRpdGlvbmFscyAmIHtcbiAgICAvKiogVGhlIHBvbGljeSB0byBhcHBseSB3aGVuIG5vbmUgb2YgdGhlIGNvbmRpdGlvbmFscyBhcHBseS4gKi9cbiAgICBlbHNlOiBLZXlEZW55UG9saWN5O1xuICB9O1xufTtcblxuZXhwb3J0IHR5cGUgUG9saWN5QW5kID0ge1xuICBBbmQ6IEtleURlbnlQb2xpY3lbXTtcbn07XG5cbmV4cG9ydCB0eXBlIFBvbGljeU9yID0ge1xuICBPcjogS2V5RGVueVBvbGljeVtdO1xufTtcblxuZXhwb3J0IHR5cGUgUG9saWN5Tm90ID0ge1xuICBOb3Q6IEtleURlbnlQb2xpY3k7XG59O1xuXG4vKiogQSBrZXkgZ3VhcmRlZCBieSBhIHBvbGljeS4gKi9cbmV4cG9ydCBjbGFzcyBLZXlXaXRoUG9saWNpZXMge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IHJvbGVJZDogc3RyaW5nO1xuICByZWFkb25seSBrZXlJZDogc3RyaW5nO1xuICAvKiogVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMga2V5L3BvbGljaWVzICovXG4gICNjYWNoZWQ6IEtleVdpdGhQb2xpY2llc0luZm87XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBjYWNoZWQgaW5mb3JtYXRpb24gKi9cbiAgZ2V0IGNhY2hlZCgpOiBLZXlXaXRoUG9saWNpZXNJbmZvIHtcbiAgICByZXR1cm4gdGhpcy4jY2FjaGVkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBjYWNoZWQgcG9saWN5ICovXG4gIGdldCBwb2xpY3koKTogS2V5UG9saWN5IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQucG9saWN5IGFzIEtleVBvbGljeSB8IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUga2V5ICovXG4gIGFzeW5jIGdldEtleSgpOiBQcm9taXNlPEtleT4ge1xuICAgIGlmICh0aGlzLiNjYWNoZWQua2V5X2luZm8gPT09IHVuZGVmaW5lZCB8fCB0aGlzLiNjYWNoZWQua2V5X2luZm8gPT09IG51bGwpIHtcbiAgICAgIHRoaXMuI2NhY2hlZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5R2V0KHRoaXMucm9sZUlkLCB0aGlzLmtleUlkLCB7IGRldGFpbHM6IHRydWUgfSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwgdGhpcy4jY2FjaGVkLmtleV9pbmZvISk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ga2V5V2l0aFBvbGljaWVzIFRoZSBrZXkgYW5kIGl0cyBwb2xpY2llc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBrZXlXaXRoUG9saWNpZXM6IEtleVdpdGhQb2xpY2llc0luZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy5yb2xlSWQgPSBrZXlXaXRoUG9saWNpZXMucm9sZV9pZDtcbiAgICB0aGlzLmtleUlkID0ga2V5V2l0aFBvbGljaWVzLmtleV9pZDtcbiAgICB0aGlzLiNjYWNoZWQgPSBrZXlXaXRoUG9saWNpZXM7XG4gIH1cbn1cblxuLyoqIFJvbGVzLiAqL1xuZXhwb3J0IGNsYXNzIFJvbGUge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIC8qKiBUaGUgcm9sZSBpbmZvcm1hdGlvbiAqL1xuICAjZGF0YTogUm9sZUluZm87XG5cbiAgLyoqIEByZXR1cm5zIEh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSByb2xlICovXG4gIGdldCBuYW1lKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBSb2xlI2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucm9sZV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyB0aGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyByb2xlLiBUaGUgY2FjaGVkIHByb3BlcnRpZXNcbiAgICogcmVmbGVjdCB0aGUgc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlIChlLmcuLCBhZnRlciBhd2FpdGluZ1xuICAgKiBgUm9sZS5lbmFibGVkKClgIG9yIGBSb2xlLmRpc2FibGUoKWApLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBSb2xlSW5mbyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZXN0IHRvIHJvbGUgcHJvcGVydGllcy5cbiAgICpcbiAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5IHBhcmFtZXRlcnM6XG4gICAqIEBwYXJhbSBxdWVyeS52ZXJib3NpdHkgUm9sZSBwcm9wZXJ0aWVzIHRvIGluY2x1ZGUgaW4gYW4gYXR0ZXN0YXRpb24uIERlZmF1bHRzIHRvIGJhc2ljIHJvbGUgcHJvcGVydGllcywgaW5jbHVkaW5nIGFzc29jaWF0ZWQgdXNlcnMsIGJ1dCBleGNsdWRpbmcgYXNzb2NpYXRlZCBrZXlzLlxuICAgKiBAcGFyYW0gcXVlcnkua2V5X2ZpbHRlciBGaWx0ZXIgZG93biB0byBhIHNpbmdsZSBhc3NvY2lhdGVkIGtleS4gRGVmYXVsdHMgdG8gaW5jbHVkaW5nIGFsbCBhc3NvY2lhdGVkIGtleXMuXG4gICAqIEByZXR1cm5zIEEgSldUIHdob3NlIGNsYWltcyBhcmUgdGhlIHJvbGUgcHJvcGVydGllcy4gVGhlIHR5cGUgb2YgdGhlIHJldHVybmVkIEpXVCBwYXlsb2FkIGlzIHtAbGluayBSb2xlQXR0ZXN0YXRpb25DbGFpbXN9LlxuICAgKi9cbiAgYXN5bmMgYXR0ZXN0KHF1ZXJ5PzogUm9sZUF0dGVzdGF0aW9uUXVlcnkpOiBQcm9taXNlPFJvbGVJbmZvSnd0PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlQXR0ZXN0KHRoaXMuaWQsIHF1ZXJ5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqL1xuICBhc3luYyBkZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlRGVsZXRlKHRoaXMuaWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFdoZXRoZXIgdGhlIHJvbGUgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBlbmFibGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiB0cnVlIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBkaXNhYmxlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBwb2xpY2llcyBwcmV2aW91c2x5IHNldCBmb3IgdGhpcyByb2xlKVxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBuZXcgcG9saWN5IHRvIHNldFxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogUm9sZVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3kgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHRvIGV4aXN0aW5nIHJvbGUgcG9saWN5LiBUaGlzIGFwcGVuZCBpcyBub3QgYXRvbWljLS0taXQgdXNlc1xuICAgKiB7QGxpbmsgcG9saWN5fSB0byBmZXRjaCB0aGUgY3VycmVudCBwb2xpY3kgYW5kIHRoZW4ge0BsaW5rIHNldFBvbGljeX1cbiAgICogdG8gc2V0IHRoZSBwb2xpY3ktLS1hbmQgc2hvdWxkIG5vdCBiZSB1c2VkIGFjcm9zcyBjb25jdXJyZW50IHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBwb2xpY3kgdG8gYXBwZW5kIHRvIHRoZSBleGlzdGluZyBvbmUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBhcHBlbmRQb2xpY3kocG9saWN5OiBSb2xlUG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMucG9saWN5KCk7XG4gICAgYXdhaXQgdGhpcy5zZXRQb2xpY3koWy4uLmV4aXN0aW5nLCAuLi5wb2xpY3ldLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIHJvbGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgZm9yIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8Um9sZVBvbGljeT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBSb2xlUG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBuZXcgZWRpdCBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBlZGl0IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIHJvbGUpXG4gICAqXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBuZXcgZWRpdCBwb2xpY3kgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldEVkaXRQb2xpY3koZWRpdFBvbGljeTogRWRpdFBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlZGl0X3BvbGljeTogZWRpdFBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGVkaXQgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGVkaXQgcG9saWN5IGZvciB0aGUgcm9sZSwgdW5kZWZpbmVkIGlmIHRoZXJlIGlzIG5vIGVkaXQgcG9saWN5XG4gICAqL1xuICBhc3luYyBlZGl0UG9saWN5KCk6IFByb21pc2U8RWRpdFBvbGljeSB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZWRpdF9wb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcmVzdHJpY3RlZCBhY3Rpb25zIG9uIHRoZSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVzdHJpY3RlZEFjdGlvbnMgVGhlIG1hcCBvZiByZXN0cmljdGVkIGFjdGlvbnNcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFJlc3RyaWN0ZWRBY3Rpb25zKHJlc3RyaWN0ZWRBY3Rpb25zOiBSZXN0cmljdGVkQWN0aW9uc01hcCwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgY29uc3QgcmVzdHJpY3RlZF9hY3Rpb25zID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgT2JqZWN0LmVudHJpZXMocmVzdHJpY3RlZEFjdGlvbnMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBba2V5LnRvU3RyaW5nKCksIHZhbHVlXSksXG4gICAgKTtcblxuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcmVzdHJpY3RlZF9hY3Rpb25zIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGFsbCB1c2VycyB3aXRoIGFjY2VzcyB0byB0aGUgcm9sZS5cbiAgICpcbiAgICogQGV4YW1wbGUgW1xuICAgKiAgIFwiVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcIixcbiAgICogICBcIlVzZXIjNTU5M2MyNWItNTJlMi00ZmI1LWIzOWItOTZkNDFkNjgxZDgyXCJcbiAgICogXVxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgdXNlcnMuXG4gICAqL1xuICBhc3luYyB1c2VycyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiAodXNlcnMgfHwgW10pLm1hcCgodSkgPT4gdS51c2VyX2lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgYW4gZW1wdHkgcmVzcG9uc2UsIG9yIGEgcmVzcG9uc2UgdGhhdCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWQuXG4gICAqL1xuICBhc3luYyBhZGRVc2VyKHVzZXJJZDogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVc2VyQWRkKHRoaXMuaWQsIHVzZXJJZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIHVzZXIgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBhbiBlbXB0eSByZXNwb25zZSwgb3IgYSByZXNwb25zZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZC5cbiAgICovXG4gIGFzeW5jIHJlbW92ZVVzZXIodXNlcklkOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJSZW1vdmUodGhpcy5pZCwgdXNlcklkLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBrZXlzIGluIHRoZSByb2xlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgIHtcbiAgICogICAgIGlkOiBcIktleSNiZmUzZWNjYi03MzFlLTQzMGQtYjFlNS1hYzEzNjNlNmIwNmJcIixcbiAgICogICAgIHBvbGljeTogeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAgICogICAgfSxcbiAgICogIF1cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIGtleXMgaW4gdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEtleVdpdGhQb2xpY2llc1tdPiB7XG4gICAgY29uc3Qga2V5c0luUm9sZSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5c0luUm9sZS5tYXAoKGspID0+IG5ldyBLZXlXaXRoUG9saWNpZXModGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGluIHRoZSByb2xlIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBJRCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBmb3IgZ2V0dGluZyB0aGUga2V5LlxuICAgKiBAcmV0dXJucyBUaGUga2V5IHdpdGggaXRzIHBvbGljaWVzLlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5KGtleUlkOiBzdHJpbmcsIG9wdHM/OiBHZXRSb2xlS2V5T3B0aW9ucyk6IFByb21pc2U8S2V5V2l0aFBvbGljaWVzPiB7XG4gICAgY29uc3Qga3dwID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlHZXQodGhpcy5pZCwga2V5SWQsIG9wdHMpO1xuICAgIHJldHVybiBuZXcgS2V5V2l0aFBvbGljaWVzKHRoaXMuI2FwaUNsaWVudCwga3dwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0IG9mIGV4aXN0aW5nIGtleXMgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIGtleXMgVGhlIGxpc3Qgb2Yga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byBlYWNoIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgQSBDdWJlU2lnbmVyIHJlc3BvbnNlIGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlLlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5cyhrZXlzOiBLZXlbXSwgcG9saWN5PzogS2V5UG9saWN5KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c0FkZChcbiAgICAgIHRoaXMuaWQsXG4gICAgICBrZXlzLm1hcCgoaykgPT4gay5pZCksXG4gICAgICBwb2xpY3ksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3Rpbmcga2V5IHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byB0aGUga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEN1YmVTaWduZXIgcmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyBhZGRLZXkoa2V5OiBLZXksIHBvbGljeT86IEtleVBvbGljeSk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFkZEtleXMoW2tleV0sIHBvbGljeSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIGtleSBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHJldHVybnMgQSBDdWJlU2lnbmVyIHJlc3BvbnNlIGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlLlxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlS2V5KGtleTogS2V5KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c1JlbW92ZSh0aGlzLmlkLCBrZXkuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzZXNzaW9uIGZvciB0aGlzIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIERlc2NyaXB0aXZlIHB1cnBvc2UuXG4gICAqIEBwYXJhbSBsaWZldGltZXMgT3B0aW9uYWwgc2Vzc2lvbiBsaWZldGltZXMuXG4gICAqIEBwYXJhbSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuIE9ubHkgYHNpZ246KmAgc2NvcGVzIGFyZSBhbGxvd2VkLlxuICAgKiBAcmV0dXJucyBOZXcgc2Vzc2lvbi5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVNlc3Npb24oXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIGxpZmV0aW1lcz86IFNlc3Npb25MaWZldGltZSxcbiAgICBzY29wZXM/OiBTY29wZVtdLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRm9yUm9sZSh0aGlzLmlkLCBwdXJwb3NlLCBzY29wZXMsIGxpZmV0aW1lcyk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgc2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuIFJldHVybmVkIG9iamVjdHMgY2FuIGJlIHVzZWQgdG9cbiAgICogcmV2b2tlIGluZGl2aWR1YWwgc2Vzc2lvbnMsIGJ1dCB0aGV5IGNhbm5vdCBiZSB1c2VkIGZvciBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIHNlc3Npb25zLlxuICAgKiBAcmV0dXJucyBTaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25zKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbkluZm9bXT4ge1xuICAgIGNvbnN0IHNlc3Npb25zID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25zTGlzdCh7IHJvbGU6IHRoaXMuaWQgfSwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gc2Vzc2lvbnMubWFwKCh0KSA9PiBuZXcgU2lnbmVyU2Vzc2lvbkluZm8odGhpcy4jYXBpQ2xpZW50LCB0LnNlc3Npb25faWQsIHQucHVycG9zZSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBSb2xlSW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBJZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIE1GQSByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZVJvbGVSZXF1ZXN0LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlVXBkYXRlKHRoaXMuaWQsIHJlcXVlc3QsIG1mYVJlY2VpcHQpO1xuICAgIHRoaXMuI2RhdGEgPSByZXNwLmRhdGEoKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSByb2xlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVHZXQodGhpcy5pZCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cbn1cbiJdfQ==