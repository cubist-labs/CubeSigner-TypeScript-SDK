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
var _KeyWithPolicies_csc, _Role_csc;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.KeyWithPolicies = exports.AllowRawBlobSigning = exports.OperationKind = exports.DepositContract = void 0;
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
/** A key guarded by a policy. */
class KeyWithPolicies {
    /** @return {Promise<Key>} The key */
    async getKey() {
        const keyInfo = await __classPrivateFieldGet(this, _KeyWithPolicies_csc, "f").keyGet(this.keyId);
        return new _1.Key(__classPrivateFieldGet(this, _KeyWithPolicies_csc, "f"), keyInfo);
    }
    /**
     * Constructor.
     * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
     * @param {KeyWithPoliciesInfo} keyWithPolicies The key and its policies
     * @internal
     */
    constructor(csc, keyWithPolicies) {
        _KeyWithPolicies_csc.set(this, void 0);
        __classPrivateFieldSet(this, _KeyWithPolicies_csc, csc, "f");
        this.keyId = keyWithPolicies.key_id;
        this.policy = keyWithPolicies.policy;
    }
}
exports.KeyWithPolicies = KeyWithPolicies;
_KeyWithPolicies_csc = new WeakMap();
/** Roles. */
class Role {
    /** Delete the role. */
    async delete() {
        await __classPrivateFieldGet(this, _Role_csc, "f").roleDelete(this.id);
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
     * The list of all users with access to the role.
     * @example [
     *   "User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f",
     *   "User#5593c25b-52e2-4fb5-b39b-96d41d681d82"
     * ]
     *
     * @param {PageOpts} page Optional pagination options; by default, retrieves all users.
     */
    async users(page) {
        const users = await __classPrivateFieldGet(this, _Role_csc, "f").roleUsersList(this.id, page).fetch();
        return (users || []).map((u) => u.user_id);
    }
    /**
     * Add an existing user to an existing role.
     *
     * @param {string} userId The user-id of the user to add to the role.
     */
    async addUser(userId) {
        await __classPrivateFieldGet(this, _Role_csc, "f").roleUserAdd(this.id, userId);
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
        const keysInRole = await __classPrivateFieldGet(this, _Role_csc, "f").roleKeysList(this.id, page).fetch();
        return keysInRole.map((k) => new KeyWithPolicies(__classPrivateFieldGet(this, _Role_csc, "f"), k));
    }
    /**
     * Add a list of existing keys to an existing role.
     *
     * @param {Key[]} keys The list of keys to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to each key.
     */
    async addKeys(keys, policy) {
        await __classPrivateFieldGet(this, _Role_csc, "f").roleKeysAdd(this.id, keys.map((k) => k.id), policy);
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
        await __classPrivateFieldGet(this, _Role_csc, "f").roleKeysRemove(this.id, key.id);
    }
    /**
     * Create a new session for this role.
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {string} purpose Descriptive purpose.
     * @param {SignerSessionLifetime} lifetimes Optional session lifetimes.
     * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
     * @return {Promise<SignerSession>} New signer session.
     */
    async createSession(storage, purpose, lifetimes, scopes) {
        const sessionData = await __classPrivateFieldGet(this, _Role_csc, "f").sessionCreateForRole(this.id, purpose, scopes, lifetimes);
        await storage.save(sessionData);
        const manager = await _1.SignerSessionManager.loadFromStorage(storage);
        return new _1.SignerSession(manager);
    }
    /**
     * List all signer sessions for this role. Returned objects can be used to
     * revoke individual sessions, but they cannot be used for authentication.
     *
     * @param {PageOpts} page Optional pagination options; by default, retrieves all sessions.
     * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
     */
    async sessions(page) {
        const sessions = await __classPrivateFieldGet(this, _Role_csc, "f").sessionsList(this.id, page).fetch();
        return sessions.map((t) => new _1.SignerSessionInfo(__classPrivateFieldGet(this, _Role_csc, "f"), t.session_id, t.purpose));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
     * @param {RoleInfo} data The JSON response from the API server.
     * @internal
     */
    constructor(csc, data) {
        _Role_csc.set(this, void 0);
        __classPrivateFieldSet(this, _Role_csc, csc, "f");
        this.id = data.role_id;
        this.name = data.name ?? undefined;
    }
    /**
     * Update the role.
     *
     * @param {UpdateRoleRequest} request The JSON request to send to the API server.
     * @return {Promise<RoleInfo>} The updated role information.
     */
    async update(request) {
        return await __classPrivateFieldGet(this, _Role_csc, "f").roleUpdate(this.id, request);
    }
    /**
     * Fetches the role information.
     *
     * @return {RoleInfo} The role information.
     * @internal
     */
    async fetch() {
        return await __classPrivateFieldGet(this, _Role_csc, "f").roleGet(this.id);
    }
}
exports.Role = Role;
_Role_csc = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdCQVlXO0FBVVgscUNBQXFDO0FBQ3JDLElBQVksZUFLWDtBQUxELFdBQVksZUFBZTtJQUN6QixpQ0FBaUM7SUFDakMsK0RBQVMsQ0FBQTtJQUNULCtCQUErQjtJQUMvQiwyREFBTyxDQUFBO0FBQ1QsQ0FBQyxFQUxXLGVBQWUsK0JBQWYsZUFBZSxRQUsxQjtBQXNCRCxtREFBbUQ7QUFDbkQsSUFBWSxhQU9YO0FBUEQsV0FBWSxhQUFhO0lBQ3ZCLHNDQUFxQixDQUFBO0lBQ3JCLHFDQUFvQixDQUFBO0lBQ3BCLHNDQUFxQixDQUFBO0lBQ3JCLHdDQUF1QixDQUFBO0lBQ3ZCLDRDQUEyQixDQUFBO0lBQzNCLDBDQUF5QixDQUFBO0FBQzNCLENBQUMsRUFQVyxhQUFhLDZCQUFiLGFBQWEsUUFPeEI7QUF3Q0QsNkJBQTZCO0FBQ2hCLFFBQUEsbUJBQW1CLEdBQUcscUJBQThCLENBQUM7QUE2QmxFLGlDQUFpQztBQUNqQyxNQUFhLGVBQWU7SUFLMUIscUNBQXFDO0lBQ3JDLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxPQUFPLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDRCQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuRCxPQUFPLElBQUksTUFBRyxDQUFDLHVCQUFBLElBQUksNEJBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLEdBQXFCLEVBQUUsZUFBb0M7UUFoQjlELHVDQUF1QjtRQWlCOUIsdUJBQUEsSUFBSSx3QkFBUSxHQUFHLE1BQUEsQ0FBQztRQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7UUFDcEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxlQUFlLENBQUMs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QUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxLQUFLLENBQUMsS0FBSztRQUNqQixPQUFPLE1BQU0sdUJBQUEsSUFBSSxpQkFBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBNUtELG9CQTRLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEtleSxcbiAgS2V5V2l0aFBvbGljaWVzSW5mbyxcbiAgTWZhVHlwZSxcbiAgUGFnZU9wdHMsXG4gIFJvbGVJbmZvLFxuICBTaWduZXJTZXNzaW9uLFxuICBTaWduZXJTZXNzaW9uSW5mbyxcbiAgU2lnbmVyU2Vzc2lvbkxpZmV0aW1lLFxuICBTaWduZXJTZXNzaW9uTWFuYWdlcixcbiAgU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCB9IGZyb20gXCIuL2NsaWVudFwiO1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHJlY2VpdmVyLlxuICpcbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIiB9XG4gKi9cbmV4cG9ydCB0eXBlIFR4UmVjZWl2ZXIgPSB7IFR4UmVjZWl2ZXI6IHN0cmluZyB9O1xuXG4vKiogVGhlIGtpbmQgb2YgZGVwb3NpdCBjb250cmFjdHMuICovXG5leHBvcnQgZW51bSBEZXBvc2l0Q29udHJhY3Qge1xuICAvKiogQ2Fub25pY2FsIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgQ2Fub25pY2FsLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIC8qKiBXcmFwcGVyIGRlcG9zaXQgY29udHJhY3QgKi9cbiAgV3JhcHBlciwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QuICovXG5leHBvcnQgdHlwZSBUeERlcG9zaXQgPSBUeERlcG9zaXRCYXNlIHwgVHhEZXBvc2l0UHVia2V5IHwgVHhEZXBvc2l0Um9sZTtcblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0Ki9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdEJhc2UgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3QgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggZml4ZWQgdmFsaWRhdG9yIChwdWJrZXkpOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcHVia2V5OiBcIjg4NzkuLi44XCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFB1YmtleSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcHVia2V5OiBzdHJpbmcgfSB9O1xuXG4vKipcbiAqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggYW55IHZhbGlkYXRvciBrZXkgaW4gYSByb2xlOlxuICpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcm9sZV9pZDogXCJSb2xlI2M2My4uLmFmXCJ9IH19XG4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFJvbGUgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHJvbGVfaWQ6IHN0cmluZyB9IH07XG5cbi8qKiBBbGwgZGlmZmVyZW50IGtpbmRzIG9mIHNlbnNpdGl2ZSBvcGVyYXRpb25zLiAqL1xuZXhwb3J0IGVudW0gT3BlcmF0aW9uS2luZCB7XG4gIEJsb2JTaWduID0gXCJCbG9iU2lnblwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV2bVNpZ24gPSBcIkV0aDFTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMlNpZ24gPSBcIkV0aDJTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMlN0YWtlID0gXCJFdGgyU3Rha2VcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdGgyVW5zdGFrZSA9IFwiRXRoMlVuc3Rha2VcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBTb2xhbmFTaWduID0gXCJTb2xhbmFTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqXG4gKiBNRkEgcG9saWN5XG4gKlxuICogQGV4YW1wbGUge1xuICoge1xuICogICBjb3VudDogMSxcbiAqICAgbnVtX2F1dGhfZmFjdG9yczogMSxcbiAqICAgYWxsb3dlZF9tZmFfdHlwZXM6IFsgXCJUb3RwXCIgXSxcbiAqICAgYWxsb3dlZF9hcHByb3ZlcnM6IFsgXCJVc2VyIzEyM1wiIF0sXG4gKiB9XG4gKi9cbmV4cG9ydCB0eXBlIE1mYVBvbGljeSA9IHtcbiAgY291bnQ/OiBudW1iZXI7XG4gIG51bV9hdXRoX2ZhY3RvcnM/OiBudW1iZXI7XG4gIGFsbG93ZWRfYXBwcm92ZXJzPzogc3RyaW5nW107XG4gIGFsbG93ZWRfbWZhX3R5cGVzPzogTWZhVHlwZVtdO1xuICByZXN0cmljdGVkX29wZXJhdGlvbnM/OiBPcGVyYXRpb25LaW5kW107XG59O1xuXG4vKipcbiAqIFJlcXVpcmUgTUZBIGZvciB0cmFuc2FjdGlvbnMuXG4gKlxuICogQGV4YW1wbGUge1xuICogICAgIFJlcXVpcmVNZmE6IHtcbiAqICAgICAgIGNvdW50OiAxLFxuICogICAgICAgYWxsb3dlZF9tZmFfdHlwZXM6IFsgXCJUb3RwXCIgXSxcbiAqICAgICAgIGFsbG93ZWRfYXBwcm92ZXJzOiBbIFwiVXNlciMxMjNcIiBdLFxuICogICAgICAgcmVzdHJpY3RlZF9vcGVyYXRpb25zOiBbXG4gKiAgICAgICAgIFwiRXRoMVNpZ25cIixcbiAqICAgICAgICAgXCJCbG9iU2lnblwiXG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICB9XG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVNZmEgPSB7XG4gIFJlcXVpcmVNZmE6IE1mYVBvbGljeTtcbn07XG5cbi8qKiBBbGxvdyByYXcgYmxvYiBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dSYXdCbG9iU2lnbmluZyA9IFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dSYXdCbG9iU2lnbmluZyA9IHR5cGVvZiBBbGxvd1Jhd0Jsb2JTaWduaW5nO1xuXG4vKipcbiAqIEtleSBwb2xpY3lcbiAqXG4gKiBAZXhhbXBsZSBbXG4gKiAgIHtcbiAqICAgICBcIlR4UmVjZWl2ZXJcIjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIlxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJUeERlcG9zaXRcIjoge1xuICogICAgICAgXCJraW5kXCI6IFwiQ2Fub25pY2FsXCJcbiAqICAgICB9XG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlJlcXVpcmVNZmFcIjoge1xuICogICAgICAgXCJjb3VudFwiOiAxLFxuICogICAgICAgXCJhbGxvd2VkX21mYV90eXBlc1wiOiBbXCJDdWJlU2lnbmVyXCJdLFxuICogICAgICAgXCJyZXN0cmljdGVkX29wZXJhdGlvbnNcIjogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICogXVxuICovXG5leHBvcnQgdHlwZSBLZXlQb2xpY3kgPSAoVHhSZWNlaXZlciB8IFR4RGVwb3NpdCB8IFJlcXVpcmVNZmEgfCBBbGxvd1Jhd0Jsb2JTaWduaW5nKVtdO1xuXG4vKiogQSBrZXkgZ3VhcmRlZCBieSBhIHBvbGljeS4gKi9cbmV4cG9ydCBjbGFzcyBLZXlXaXRoUG9saWNpZXMge1xuICByZWFkb25seSAjY3NjOiBDdWJlU2lnbmVyQ2xpZW50O1xuICByZWFkb25seSBrZXlJZDogc3RyaW5nO1xuICByZWFkb25seSBwb2xpY3k/OiBLZXlQb2xpY3k7XG5cbiAgLyoqIEByZXR1cm4ge1Byb21pc2U8S2V5Pn0gVGhlIGtleSAqL1xuICBhc3luYyBnZXRLZXkoKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCBrZXlJbmZvID0gYXdhaXQgdGhpcy4jY3NjLmtleUdldCh0aGlzLmtleUlkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNjc2MsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNzYyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7S2V5V2l0aFBvbGljaWVzSW5mb30ga2V5V2l0aFBvbGljaWVzIFRoZSBrZXkgYW5kIGl0cyBwb2xpY2llc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzYzogQ3ViZVNpZ25lckNsaWVudCwga2V5V2l0aFBvbGljaWVzOiBLZXlXaXRoUG9saWNpZXNJbmZvKSB7XG4gICAgdGhpcy4jY3NjID0gY3NjO1xuICAgIHRoaXMua2V5SWQgPSBrZXlXaXRoUG9saWNpZXMua2V5X2lkO1xuICAgIHRoaXMucG9saWN5ID0ga2V5V2l0aFBvbGljaWVzLnBvbGljeSBhcyB1bmtub3duIGFzIEtleVBvbGljeTtcbiAgfVxufVxuXG4vKiogUm9sZXMuICovXG5leHBvcnQgY2xhc3MgUm9sZSB7XG4gIHJlYWRvbmx5ICNjc2M6IEN1YmVTaWduZXJDbGllbnQ7XG5cbiAgLyoqIEh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSByb2xlICovXG4gIHB1YmxpYyByZWFkb25seSBuYW1lPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFJvbGUjYmZlM2VjY2ItNzMxZS00MzBkLWIxZTUtYWMxMzYzZTZiMDZiXG4gICAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKiBEZWxldGUgdGhlIHJvbGUuICovXG4gIGFzeW5jIGRlbGV0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLiNjc2Mucm9sZURlbGV0ZSh0aGlzLmlkKTtcbiAgfVxuXG4gIC8qKiBJcyB0aGUgcm9sZSBlbmFibGVkPyAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIHJvbGUuICovXG4gIGFzeW5jIGVuYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUgcm9sZS4gKi9cbiAgYXN5bmMgZGlzYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIGFsbCB1c2VycyB3aXRoIGFjY2VzcyB0byB0aGUgcm9sZS5cbiAgICogQGV4YW1wbGUgW1xuICAgKiAgIFwiVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcIixcbiAgICogICBcIlVzZXIjNTU5M2MyNWItNTJlMi00ZmI1LWIzOWItOTZkNDFkNjgxZDgyXCJcbiAgICogXVxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCB1c2Vycy5cbiAgICovXG4gIGFzeW5jIHVzZXJzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCB1c2VycyA9IGF3YWl0IHRoaXMuI2NzYy5yb2xlVXNlcnNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuICh1c2VycyB8fCBbXSkubWFwKCh1KSA9PiB1LnVzZXJfaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgYWRkVXNlcih1c2VySWQ6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMuI2NzYy5yb2xlVXNlckFkZCh0aGlzLmlkLCB1c2VySWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFtcbiAgICogICAge1xuICAgKiAgICAgaWQ6IFwiS2V5I2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlwiLFxuICAgKiAgICAgcG9saWN5OiB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICAgKiAgICB9LFxuICAgKiAgXVxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBrZXlzIGluIHRoaXMgcm9sZS5cbiAgICovXG4gIGFzeW5jIGtleXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXNbXT4ge1xuICAgIGNvbnN0IGtleXNJblJvbGUgPSBhd2FpdCB0aGlzLiNjc2Mucm9sZUtleXNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gICAgcmV0dXJuIGtleXNJblJvbGUubWFwKChrKSA9PiBuZXcgS2V5V2l0aFBvbGljaWVzKHRoaXMuI2NzYywgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3Qgb2YgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVtdfSBrZXlzIFRoZSBsaXN0IG9mIGtleXMgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0ge0tleVBvbGljeT99IHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIGVhY2gga2V5LlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5cyhrZXlzOiBLZXlbXSwgcG9saWN5PzogS2V5UG9saWN5KSB7XG4gICAgYXdhaXQgdGhpcy4jY3NjLnJvbGVLZXlzQWRkKFxuICAgICAgdGhpcy5pZCxcbiAgICAgIGtleXMubWFwKChrKSA9PiBrLmlkKSxcbiAgICAgIHBvbGljeSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyBrZXkgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtLZXl9IGtleSBUaGUga2V5IHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHtLZXlQb2xpY3k/fSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byB0aGUga2V5LlxuICAgKi9cbiAgYXN5bmMgYWRkS2V5KGtleTogS2V5LCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLmFkZEtleXMoW2tleV0sIHBvbGljeSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIGtleSBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5fSBrZXkgVGhlIGtleSB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJlbW92ZUtleShrZXk6IEtleSkge1xuICAgIGF3YWl0IHRoaXMuI2NzYy5yb2xlS2V5c1JlbW92ZSh0aGlzLmlkLCBrZXkuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzZXNzaW9uIGZvciB0aGlzIHJvbGUuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1cnBvc2UgRGVzY3JpcHRpdmUgcHVycG9zZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTGlmZXRpbWV9IGxpZmV0aW1lcyBPcHRpb25hbCBzZXNzaW9uIGxpZmV0aW1lcy5cbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLiBPbmx5IGBzaWduOipgIHNjb3BlcyBhcmUgYWxsb3dlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlU2Vzc2lvbihcbiAgICBzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgbGlmZXRpbWVzPzogU2lnbmVyU2Vzc2lvbkxpZmV0aW1lLFxuICAgIHNjb3Blcz86IHN0cmluZ1tdLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb24+IHtcbiAgICBjb25zdCBzZXNzaW9uRGF0YSA9IGF3YWl0IHRoaXMuI2NzYy5zZXNzaW9uQ3JlYXRlRm9yUm9sZSh0aGlzLmlkLCBwdXJwb3NlLCBzY29wZXMsIGxpZmV0aW1lcyk7XG4gICAgYXdhaXQgc3RvcmFnZS5zYXZlKHNlc3Npb25EYXRhKTtcbiAgICBjb25zdCBtYW5hZ2VyID0gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICAgIHJldHVybiBuZXcgU2lnbmVyU2Vzc2lvbihtYW5hZ2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBzaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS4gUmV0dXJuZWQgb2JqZWN0cyBjYW4gYmUgdXNlZCB0b1xuICAgKiByZXZva2UgaW5kaXZpZHVhbCBzZXNzaW9ucywgYnV0IHRoZXkgY2Fubm90IGJlIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBzZXNzaW9ucy5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uSW5mb1tdPn0gU2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuXG4gICAqL1xuICBhc3luYyBzZXNzaW9ucyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPFNpZ25lclNlc3Npb25JbmZvW10+IHtcbiAgICBjb25zdCBzZXNzaW9ucyA9IGF3YWl0IHRoaXMuI2NzYy5zZXNzaW9uc0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgICByZXR1cm4gc2Vzc2lvbnMubWFwKCh0KSA9PiBuZXcgU2lnbmVyU2Vzc2lvbkluZm8odGhpcy4jY3NjLCB0LnNlc3Npb25faWQsIHQucHVycG9zZSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY3NjIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtSb2xlSW5mb30gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzYzogQ3ViZVNpZ25lckNsaWVudCwgZGF0YTogUm9sZUluZm8pIHtcbiAgICB0aGlzLiNjc2MgPSBjc2M7XG4gICAgdGhpcy5pZCA9IGRhdGEucm9sZV9pZDtcbiAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtVcGRhdGVSb2xlUmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Um9sZUluZm8+fSBUaGUgdXBkYXRlZCByb2xlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlUm9sZVJlcXVlc3QpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2NzYy5yb2xlVXBkYXRlKHRoaXMuaWQsIHJlcXVlc3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge1JvbGVJbmZvfSBUaGUgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jY3NjLnJvbGVHZXQodGhpcy5pZCk7XG4gIH1cbn1cbiJdfQ==