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
import { Key, SignerSessionInfo } from ".";
/** The kind of deposit contracts. */
export var DepositContract;
(function (DepositContract) {
    /** Canonical deposit contract */
    DepositContract[DepositContract["Canonical"] = 0] = "Canonical";
    /** Wrapper deposit contract */
    DepositContract[DepositContract["Wrapper"] = 1] = "Wrapper";
})(DepositContract || (DepositContract = {}));
/** All different kinds of sensitive operations. */
export var OperationKind;
(function (OperationKind) {
    OperationKind["BlobSign"] = "BlobSign";
    OperationKind["EvmSign"] = "Eth1Sign";
    OperationKind["Eth2Sign"] = "Eth2Sign";
    OperationKind["Eth2Stake"] = "Eth2Stake";
    OperationKind["Eth2Unstake"] = "Eth2Unstake";
    OperationKind["SolanaSign"] = "SolanaSign";
})(OperationKind || (OperationKind = {}));
/** Allow raw blob signing */
export const AllowRawBlobSigning = "AllowRawBlobSigning";
/** Allow EIP-191 signing */
export const AllowEip191Signing = "AllowEip191Signing";
/** Allow EIP-712 signing */
export const AllowEip712Signing = "AllowEip712Signing";
/** A key guarded by a policy. */
export class KeyWithPolicies {
    /** @return {Promise<Key>} The key */
    async getKey() {
        const keyInfo = await __classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f").keyGet(this.keyId);
        return new Key(__classPrivateFieldGet(this, _KeyWithPolicies_apiClient, "f"), keyInfo);
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
_KeyWithPolicies_apiClient = new WeakMap();
/** Roles. */
export class Role {
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
        return sessions.map((t) => new SignerSessionInfo(__classPrivateFieldGet(this, _Role_apiClient, "f"), t.session_id, t.purpose));
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
_Role_apiClient = new WeakMap(), _Role_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBRSxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxHQUFHLENBQUM7QUFTM0MscUNBQXFDO0FBQ3JDLE1BQU0sQ0FBTixJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLEtBQWYsZUFBZSxRQUsxQjtBQWlFRCxtREFBbUQ7QUFDbkQsTUFBTSxDQUFOLElBQVksYUFPWDtBQVBELFdBQVksYUFBYTtJQUN2QixzQ0FBcUIsQ0FBQTtJQUNyQixxQ0FBb0IsQ0FBQTtJQUNwQixzQ0FBcUIsQ0FBQTtJQUNyQix3Q0FBdUIsQ0FBQTtJQUN2Qiw0Q0FBMkIsQ0FBQTtJQUMzQiwwQ0FBeUIsQ0FBQTtBQUMzQixDQUFDLEVBUFcsYUFBYSxLQUFiLGFBQWEsUUFPeEI7QUF3Q0QsNkJBQTZCO0FBQzdCLE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHLHFCQUE4QixDQUFDO0FBR2xFLDRCQUE0QjtBQUM1QixNQUFNLENBQUMsTUFBTSxrQkFBa0IsR0FBRyxvQkFBNkIsQ0FBQztBQUdoRSw0QkFBNEI7QUFDNUIsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQUcsb0JBQTZCLENBQUM7QUErQ2hFLGlDQUFpQztBQUNqQyxNQUFNLE9BQU8sZUFBZTtJQUsxQixxQ0FBcUM7SUFDckMsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLE9BQU8sR0FBRyxNQUFNLHVCQUFBLElBQUksa0NBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pELE9BQU8sSUFBSSxHQUFHLENBQUMsdUJBQUEsSUFBSSxrQ0FBVyxFQUFFLE9BQU8sQ0FBQyxD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SyxLQUFLLENBQUMsS0FBSztRQUNqQix1QkFBQSxJQUFJLGNBQVMsTUFBTSx1QkFBQSxJQUFJLHVCQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBQSxDQUFDO1FBQ3BELE9BQU8sdUJBQUEsSUFBSSxrQkFBTSxDQUFDO0lBQ3BCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQXBpQ2xpZW50LFxuICBLZXlXaXRoUG9saWNpZXNJbmZvLFxuICBNZmFUeXBlLFxuICBQYWdlT3B0cyxcbiAgUm9sZUluZm8sXG4gIFNlc3Npb25EYXRhLFxuICBTZXNzaW9uTGlmZXRpbWUsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgS2V5LCBTaWduZXJTZXNzaW9uSW5mbyB9IGZyb20gXCIuXCI7XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb24gcmVjZWl2ZXIuXG4gKlxuICogQGV4YW1wbGUgeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAqL1xuZXhwb3J0IHR5cGUgVHhSZWNlaXZlciA9IHsgVHhSZWNlaXZlcjogc3RyaW5nIH07XG5cbi8qKiBUaGUga2luZCBvZiBkZXBvc2l0IGNvbnRyYWN0cy4gKi9cbmV4cG9ydCBlbnVtIERlcG9zaXRDb250cmFjdCB7XG4gIC8qKiBDYW5vbmljYWwgZGVwb3NpdCBjb250cmFjdCAqL1xuICBDYW5vbmljYWwsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgLyoqIFdyYXBwZXIgZGVwb3NpdCBjb250cmFjdCAqL1xuICBXcmFwcGVyLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdC4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdCA9IFR4RGVwb3NpdEJhc2UgfCBUeERlcG9zaXRQdWJrZXkgfCBUeERlcG9zaXRSb2xlO1xuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0QmFzZSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdCB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3Qgd2l0aCBmaXhlZCB2YWxpZGF0b3IgKHB1YmtleSk6XG4gKlxuICogQGV4YW1wbGUgeyBUeERlcG9zaXQ6IHsga2luZDogRGVzcG9zaXRDb250cmFjdC5DYW5vbmljYWwsIHZhbGlkYXRvcjogeyBwdWJrZXk6IFwiODg3OS4uLjhcIn0gfX1cbiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0UHVia2V5ID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0OyBwdWJrZXk6IHN0cmluZyB9IH07XG5cbi8qKlxuICogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3Qgd2l0aCBhbnkgdmFsaWRhdG9yIGtleSBpbiBhIHJvbGU6XG4gKlxuICogQGV4YW1wbGUgeyBUeERlcG9zaXQ6IHsga2luZDogRGVzcG9zaXRDb250cmFjdC5DYW5vbmljYWwsIHZhbGlkYXRvcjogeyByb2xlX2lkOiBcIlJvbGUjYzYzLi4uYWZcIn0gfX1cbiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0Um9sZSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcm9sZV9pZDogc3RyaW5nIH0gfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiB2YWx1ZXMgdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQuXG4gKiBDdXJyZW50bHksIHRoaXMgb25seSBhcHBsaWVzIHRvIEVWTSB0cmFuc2FjdGlvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdCA9IFR4VmFsdWVMaW1pdFBlclR4IHwgVHhWYWx1ZUxpbWl0V2luZG93O1xuXG4vKipcbiAqIFJlc3RyaWN0IGluZGl2aWR1YWwgdHJhbnNhY3Rpb24gdmFsdWVzIHRvIGFtb3VudHMgYXQgb3IgYmVsb3cgdGhlIGdpdmVuIGxpbWl0LlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiBcIjB4MTJBMDVGMjAwXCIgfVxuICovXG5leHBvcnQgdHlwZSBUeFZhbHVlTGltaXRQZXJUeCA9IHsgVHhWYWx1ZUxpbWl0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBSZXN0cmljdCB0cmFuc2FjdGlvbiB2YWx1ZXMgb3ZlciBhIHRpbWUgd2luZG93LlxuICogQ3VycmVudGx5LCB0aGlzIG9ubHkgYXBwbGllcyB0byBFVk0gdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjB4MTJBMDVGMjAwXCIsIHdpbmRvdzogODY0MDAgfX1cbiAqIEBleGFtcGxlIHsgVHhWYWx1ZUxpbWl0OiB7IGxpbWl0OiBcIjB4MTJBMDVGMjAwXCIsIHdpbmRvdzogNjA0ODAwLCBjaGFpbl9pZHM6IFsgXCIwMTIzNDVcIiBdIH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4VmFsdWVMaW1pdFdpbmRvdyA9IHtcbiAgVHhWYWx1ZUxpbWl0OiB7XG4gICAgbGltaXQ6IHN0cmluZztcbiAgICB3aW5kb3c/OiBudW1iZXI7XG4gICAgY2hhaW5faWRzPzogc3RyaW5nW107XG4gIH07XG59O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIG1heCBnYXMgY29zdHMgdG8gYW1vdW50cyBhdCBvciBiZWxvdyB0aGUgZ2l2ZW4gbGltaXQuXG4gKlxuICogQGV4YW1wbGUgeyBUeEdhc0Nvc3RMaW1pdDogXCIweDI3Q0E1NzM1N0MwMDBcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4R2FzQ29zdExpbWl0ID0geyBUeEdhc0Nvc3RMaW1pdDogc3RyaW5nIH07XG5cbi8qKlxuICogT25seSBhbGxvdyBjb25uZWN0aW9ucyBmcm9tIGNsaWVudHMgd2hvc2UgSVAgYWRkcmVzc2VzIG1hdGNoIGFueSBvZiB0aGVzZSBJUHY0IENJRFIgYmxvY2tzLlxuICpcbiAqIEBleGFtcGxlIHsgU291cmNlSXBBbGxvd2xpc3Q6IFsgXCIxMjMuNDU2Ljc4LjkvMTZcIiBdIH1cbiAqL1xuZXhwb3J0IHR5cGUgU291cmNlSXBBbGxvd2xpc3QgPSB7IFNvdXJjZUlwQWxsb3dsaXN0OiBzdHJpbmdbXSB9O1xuXG4vKiogQWxsIGRpZmZlcmVudCBraW5kcyBvZiBzZW5zaXRpdmUgb3BlcmF0aW9ucy4gKi9cbmV4cG9ydCBlbnVtIE9wZXJhdGlvbktpbmQge1xuICBCbG9iU2lnbiA9IFwiQmxvYlNpZ25cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdm1TaWduID0gXCJFdGgxU2lnblwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV0aDJTaWduID0gXCJFdGgyU2lnblwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV0aDJTdGFrZSA9IFwiRXRoMlN0YWtlXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMlVuc3Rha2UgPSBcIkV0aDJVbnN0YWtlXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgU29sYW5hU2lnbiA9IFwiU29sYW5hU2lnblwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKlxuICogTUZBIHBvbGljeVxuICpcbiAqIEBleGFtcGxlIHtcbiAqIHtcbiAqICAgY291bnQ6IDEsXG4gKiAgIG51bV9hdXRoX2ZhY3RvcnM6IDEsXG4gKiAgIGFsbG93ZWRfbWZhX3R5cGVzOiBbIFwiVG90cFwiIF0sXG4gKiAgIGFsbG93ZWRfYXBwcm92ZXJzOiBbIFwiVXNlciMxMjNcIiBdLFxuICogfVxuICovXG5leHBvcnQgdHlwZSBNZmFQb2xpY3kgPSB7XG4gIGNvdW50PzogbnVtYmVyO1xuICBudW1fYXV0aF9mYWN0b3JzPzogbnVtYmVyO1xuICBhbGxvd2VkX2FwcHJvdmVycz86IHN0cmluZ1tdO1xuICBhbGxvd2VkX21mYV90eXBlcz86IE1mYVR5cGVbXTtcbiAgcmVzdHJpY3RlZF9vcGVyYXRpb25zPzogT3BlcmF0aW9uS2luZFtdO1xufTtcblxuLyoqXG4gKiBSZXF1aXJlIE1GQSBmb3IgdHJhbnNhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlIHtcbiAqICAgICBSZXF1aXJlTWZhOiB7XG4gKiAgICAgICBjb3VudDogMSxcbiAqICAgICAgIGFsbG93ZWRfbWZhX3R5cGVzOiBbIFwiVG90cFwiIF0sXG4gKiAgICAgICBhbGxvd2VkX2FwcHJvdmVyczogWyBcIlVzZXIjMTIzXCIgXSxcbiAqICAgICAgIHJlc3RyaWN0ZWRfb3BlcmF0aW9uczogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICovXG5leHBvcnQgdHlwZSBSZXF1aXJlTWZhID0ge1xuICBSZXF1aXJlTWZhOiBNZmFQb2xpY3k7XG59O1xuXG4vKiogQWxsb3cgcmF3IGJsb2Igc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93UmF3QmxvYlNpZ25pbmcgPSBcIkFsbG93UmF3QmxvYlNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93UmF3QmxvYlNpZ25pbmcgPSB0eXBlb2YgQWxsb3dSYXdCbG9iU2lnbmluZztcblxuLyoqIEFsbG93IEVJUC0xOTEgc2lnbmluZyAqL1xuZXhwb3J0IGNvbnN0IEFsbG93RWlwMTkxU2lnbmluZyA9IFwiQWxsb3dFaXAxOTFTaWduaW5nXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBbGxvd0VpcDE5MVNpZ25pbmcgPSB0eXBlb2YgQWxsb3dFaXAxOTFTaWduaW5nO1xuXG4vKiogQWxsb3cgRUlQLTcxMiBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dFaXA3MTJTaWduaW5nID0gXCJBbGxvd0VpcDcxMlNpZ25pbmdcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFsbG93RWlwNzEyU2lnbmluZyA9IHR5cGVvZiBBbGxvd0VpcDcxMlNpZ25pbmc7XG5cbi8qKiBLZXkgcG9saWNpZXMgdGhhdCByZXN0cmljdCB0aGUgcmVxdWVzdHMgdGhhdCB0aGUgc2lnbmluZyBlbmRwb2ludHMgYWNjZXB0ICovXG50eXBlIEtleURlbnlQb2xpY3kgPVxuICB8IFR4UmVjZWl2ZXJcbiAgfCBUeERlcG9zaXRcbiAgfCBUeFZhbHVlTGltaXRcbiAgfCBUeEdhc0Nvc3RMaW1pdFxuICB8IFNvdXJjZUlwQWxsb3dsaXN0XG4gIHwgUmVxdWlyZU1mYTtcblxuLyoqXG4gKiBLZXkgcG9saWN5XG4gKlxuICogQGV4YW1wbGUgW1xuICogICB7XG4gKiAgICAgXCJUeFJlY2VpdmVyXCI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCJcbiAqICAgfSxcbiAqICAge1xuICogICAgIFwiVHhEZXBvc2l0XCI6IHtcbiAqICAgICAgIFwia2luZFwiOiBcIkNhbm9uaWNhbFwiXG4gKiAgICAgfVxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJSZXF1aXJlTWZhXCI6IHtcbiAqICAgICAgIFwiY291bnRcIjogMSxcbiAqICAgICAgIFwiYWxsb3dlZF9tZmFfdHlwZXNcIjogW1wiQ3ViZVNpZ25lclwiXSxcbiAqICAgICAgIFwicmVzdHJpY3RlZF9vcGVyYXRpb25zXCI6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqIF1cbiAqL1xuZXhwb3J0IHR5cGUgS2V5UG9saWN5ID0gS2V5UG9saWN5UnVsZVtdO1xuXG5leHBvcnQgdHlwZSBLZXlQb2xpY3lSdWxlID1cbiAgfCBLZXlEZW55UG9saWN5XG4gIHwgQWxsb3dSYXdCbG9iU2lnbmluZ1xuICB8IEFsbG93RWlwMTkxU2lnbmluZ1xuICB8IEFsbG93RWlwNzEyU2lnbmluZztcblxuLyoqIFJvbGUgcG9saWN5ICovXG5leHBvcnQgdHlwZSBSb2xlUG9saWN5ID0gS2V5RGVueVBvbGljeVtdO1xuXG4vKiogQSBrZXkgZ3VhcmRlZCBieSBhIHBvbGljeS4gKi9cbmV4cG9ydCBjbGFzcyBLZXlXaXRoUG9saWNpZXMge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IGtleUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBvbGljeT86IEtleVBvbGljeTtcblxuICAvKiogQHJldHVybiB7UHJvbWlzZTxLZXk+fSBUaGUga2V5ICovXG4gIGFzeW5jIGdldEtleSgpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleUluZm8gPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5R2V0KHRoaXMua2V5SWQpO1xuICAgIHJldHVybiBuZXcgS2V5KHRoaXMuI2FwaUNsaWVudCwga2V5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50fSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge0tleVdpdGhQb2xpY2llc0luZm99IGtleVdpdGhQb2xpY2llcyBUaGUga2V5IGFuZCBpdHMgcG9saWNpZXNcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwga2V5V2l0aFBvbGljaWVzOiBLZXlXaXRoUG9saWNpZXNJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMua2V5SWQgPSBrZXlXaXRoUG9saWNpZXMua2V5X2lkO1xuICAgIHRoaXMucG9saWN5ID0ga2V5V2l0aFBvbGljaWVzLnBvbGljeSBhcyB1bmtub3duIGFzIEtleVBvbGljeTtcbiAgfVxufVxuXG4vKiogUm9sZXMuICovXG5leHBvcnQgY2xhc3MgUm9sZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgLyoqIFRoZSByb2xlIGluZm9ybWF0aW9uICovXG4gICNkYXRhOiBSb2xlSW5mbztcblxuICAvKiogSHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIHJvbGUgKi9cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFJvbGUjYmZlM2VjY2ItNzMxZS00MzBkLWIxZTUtYWMxMzYzZTZiMDZiXG4gICAqL1xuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5yb2xlX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1JvbGVJbmZvfSB0aGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyByb2xlLiBUaGUgY2FjaGVkIHByb3BlcnRpZXNcbiAgICogcmVmbGVjdCB0aGUgc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlIChlLmcuLCBhZnRlciBhd2FpdGluZ1xuICAgKiBgUm9sZS5lbmFibGVkKClgIG9yIGBSb2xlLmRpc2FibGUoKWApLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBSb2xlSW5mbyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKiogRGVsZXRlIHRoZSByb2xlLiAqL1xuICBhc3luYyBkZWxldGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVEZWxldGUodGhpcy5pZCk7XG4gIH1cblxuICAvKiogSXMgdGhlIHJvbGUgZW5hYmxlZD8gKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKiogRW5hYmxlIHRoZSByb2xlLiAqL1xuICBhc3luYyBlbmFibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqIERpc2FibGUgdGhlIHJvbGUuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIHJvbGUpXG4gICAqIEBwYXJhbSB7Um9sZVBvbGljeX0gcG9saWN5IFRoZSBuZXcgcG9saWN5IHRvIHNldFxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogUm9sZVBvbGljeSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwb2xpY3kgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgdG8gZXhpc3Rpbmcgcm9sZSBwb2xpY3kuIFRoaXMgYXBwZW5kIGlzIG5vdCBhdG9taWMtLS1pdCB1c2VzXG4gICAqIHtAbGluayBwb2xpY3l9IHRvIGZldGNoIHRoZSBjdXJyZW50IHBvbGljeSBhbmQgdGhlbiB7QGxpbmsgc2V0UG9saWN5fVxuICAgKiB0byBzZXQgdGhlIHBvbGljeS0tLWFuZCBzaG91bGQgbm90IGJlIHVzZWQgaW4gYWNyb3NzIGNvbmN1cnJlbnQgc2Vzc2lvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7Um9sZVBvbGljeX0gcG9saWN5IFRoZSBwb2xpY3kgdG8gYXBwZW5kIHRvIHRoZSBleGlzdGluZyBvbmUuXG4gICAqL1xuICBhc3luYyBhcHBlbmRQb2xpY3kocG9saWN5OiBSb2xlUG9saWN5KSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnBvbGljeSgpO1xuICAgIGF3YWl0IHRoaXMuc2V0UG9saWN5KFsuLi5leGlzdGluZywgLi4ucG9saWN5XSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb2xpY3kgZm9yIHRoZSByb2xlLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFJvbGVQb2xpY3k+fSBUaGUgcG9saWN5IGZvciB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHBvbGljeSgpOiBQcm9taXNlPFJvbGVQb2xpY3k+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgUm9sZVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBhbGwgdXNlcnMgd2l0aCBhY2Nlc3MgdG8gdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFtcbiAgICogICBcIlVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXCIsXG4gICAqICAgXCJVc2VyIzU1OTNjMjViLTUyZTItNGZiNS1iMzliLTk2ZDQxZDY4MWQ4MlwiXG4gICAqIF1cbiAgICpcbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgdXNlcnMuXG4gICAqL1xuICBhc3luYyB1c2VycyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgdXNlcnMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiAodXNlcnMgfHwgW10pLm1hcCgodSkgPT4gdS51c2VyX2lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIGFkZFVzZXIodXNlcklkOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVzZXJBZGQodGhpcy5pZCwgdXNlcklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3RpbmcgdXNlciBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyByZW1vdmVVc2VyKHVzZXJJZDogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVVc2VyUmVtb3ZlKHRoaXMuaWQsIHVzZXJJZCk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2Yga2V5cyBpbiB0aGUgcm9sZS5cbiAgICogQGV4YW1wbGUgW1xuICAgKiAgICB7XG4gICAqICAgICBpZDogXCJLZXkjYmZlM2VjY2ItNzMxZS00MzBkLWIxZTUtYWMxMzYzZTZiMDZiXCIsXG4gICAqICAgICBwb2xpY3k6IHsgVHhSZWNlaXZlcjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIiB9XG4gICAqICAgIH0sXG4gICAqICBdXG4gICAqXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIGtleXMgaW4gdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMga2V5cyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEtleVdpdGhQb2xpY2llc1tdPiB7XG4gICAgY29uc3Qga2V5c0luUm9sZSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlS2V5c0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4ga2V5c0luUm9sZS5tYXAoKGspID0+IG5ldyBLZXlXaXRoUG9saWNpZXModGhpcy4jYXBpQ2xpZW50LCBrKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbGlzdCBvZiBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5W119IGtleXMgVGhlIGxpc3Qgb2Yga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5P30gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqL1xuICBhc3luYyBhZGRLZXlzKGtleXM6IEtleVtdLCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZUtleXNBZGQoXG4gICAgICB0aGlzLmlkLFxuICAgICAga2V5cy5tYXAoKGspID0+IGsuaWQpLFxuICAgICAgcG9saWN5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGV4aXN0aW5nIGtleSB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleX0ga2V5IFRoZSBrZXkgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0ge0tleVBvbGljeT99IHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIHRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBhZGRLZXkoa2V5OiBLZXksIHBvbGljeT86IEtleVBvbGljeSkge1xuICAgIGF3YWl0IHRoaXMuYWRkS2V5cyhba2V5XSwgcG9saWN5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3Rpbmcga2V5IGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtLZXl9IGtleSBUaGUga2V5IHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlS2V5KGtleTogS2V5KSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnJvbGVLZXlzUmVtb3ZlKHRoaXMuaWQsIGtleS5pZCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNlc3Npb24gZm9yIHRoaXMgcm9sZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1cnBvc2UgRGVzY3JpcHRpdmUgcHVycG9zZS5cbiAgICogQHBhcmFtIHtTZXNzaW9uTGlmZXRpbWV9IGxpZmV0aW1lcyBPcHRpb25hbCBzZXNzaW9uIGxpZmV0aW1lcy5cbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLiBPbmx5IGBzaWduOipgIHNjb3BlcyBhcmUgYWxsb3dlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTZXNzaW9uRGF0YT59IE5ldyBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlU2Vzc2lvbihcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICAgIHNjb3Blcz86IHN0cmluZ1tdLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uQ3JlYXRlRm9yUm9sZSh0aGlzLmlkLCBwdXJwb3NlLCBzY29wZXMsIGxpZmV0aW1lcyk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgc2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuIFJldHVybmVkIG9iamVjdHMgY2FuIGJlIHVzZWQgdG9cbiAgICogcmV2b2tlIGluZGl2aWR1YWwgc2Vzc2lvbnMsIGJ1dCB0aGV5IGNhbm5vdCBiZSB1c2VkIGZvciBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgc2Vzc2lvbnMuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbkluZm9bXT59IFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbnMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uSW5mb1tdPiB7XG4gICAgY29uc3Qgc2Vzc2lvbnMgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbnNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIHNlc3Npb25zLm1hcCgodCkgPT4gbmV3IFNpZ25lclNlc3Npb25JbmZvKHRoaXMuI2FwaUNsaWVudCwgdC5zZXNzaW9uX2lkLCB0LnB1cnBvc2UpKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtSb2xlSW5mb30gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBSb2xlSW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7VXBkYXRlUm9sZVJlcXVlc3R9IHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFJvbGVJbmZvPn0gVGhlIHVwZGF0ZWQgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZVJvbGVSZXF1ZXN0KTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQucm9sZVVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0KTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSByb2xlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtSb2xlSW5mb30gVGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5yb2xlR2V0KHRoaXMuaWQpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG59XG4iXX0=