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
var _KeyWithPolicies_cs, _KeyWithPolicies_orgId, _Role_cs, _Role_orgId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.KeyWithPolicies = exports.AllowRawBlobSigning = exports.OperationKind = exports.DepositContract = void 0;
const _1 = require(".");
const util_1 = require("./util");
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
        return await _1.Key.getKey(__classPrivateFieldGet(this, _KeyWithPolicies_cs, "f"), __classPrivateFieldGet(this, _KeyWithPolicies_orgId, "f"), this.keyId);
    }
    /** Constructor.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {KeyWithPoliciesInfo} keyWithPolicies The key and its policies
     * @internal
     * */
    constructor(cs, orgId, keyWithPolicies) {
        _KeyWithPolicies_cs.set(this, void 0);
        _KeyWithPolicies_orgId.set(this, void 0);
        __classPrivateFieldSet(this, _KeyWithPolicies_cs, cs, "f");
        __classPrivateFieldSet(this, _KeyWithPolicies_orgId, orgId, "f");
        this.keyId = keyWithPolicies.key_id;
        this.policy = keyWithPolicies.policy;
    }
}
exports.KeyWithPolicies = KeyWithPolicies;
_KeyWithPolicies_cs = new WeakMap(), _KeyWithPolicies_orgId = new WeakMap();
/** Roles. */
class Role {
    /** Delete the role. */
    async delete() {
        await Role.deleteRole(__classPrivateFieldGet(this, _Role_cs, "f"), __classPrivateFieldGet(this, _Role_orgId, "f"), this.id);
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
    /** The list of users with access to the role.
     * @example [
     *   "User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f",
     *   "User#5593c25b-52e2-4fb5-b39b-96d41d681d82"
     * ]
     * */
    async users() {
        const data = await this.fetch();
        return data.users || [];
    }
    /** Add a user to the role.
     * Adds an existing user to an existing role.
     * @param {string} userId The user-id of the user to add to the role.
     * */
    async addUser(userId) {
        const resp = await (await __classPrivateFieldGet(this, _Role_cs, "f").management()).put("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _Role_orgId, "f"), role_id: this.id, user_id: userId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp, "Failed to add user to role");
    }
    /** The list of keys in the role.
     * @example [
     *    {
     *     id: "Key#bfe3eccb-731e-430d-b1e5-ac1363e6b06b",
     *     policy: { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
     *    },
     *  ]
     * */
    async keys() {
        const data = await this.fetch();
        return (data.keys || []).map((k) => new KeyWithPolicies(__classPrivateFieldGet(this, _Role_cs, "f"), __classPrivateFieldGet(this, _Role_orgId, "f"), k));
    }
    /** Add keys to the role.
     * Adds a list of existing keys to an existing role.
     * @param {Key[]} keys The list of keys to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to each key.
     * */
    async addKeys(keys, policy) {
        const resp = await (await __classPrivateFieldGet(this, _Role_cs, "f").management()).put("/v0/org/{org_id}/roles/{role_id}/add_keys", {
            params: { path: { org_id: __classPrivateFieldGet(this, _Role_orgId, "f"), role_id: this.id } },
            body: {
                key_ids: keys.map((k) => k.id),
                policy: (policy ?? null),
            },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp, "Failed to add keys to role");
    }
    /** Add a key to the role.
     * Adds an existing key to an existing role.
     * @param {Key} key The key to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to the key.
     * */
    async addKey(key, policy) {
        return await this.addKeys([key], policy);
    }
    /** Remove key from the role.
     * Removes an existing key from an existing role.
     * @param {Key} key The key to remove from the role.
     * */
    async removeKey(key) {
        const resp = await (await __classPrivateFieldGet(this, _Role_cs, "f").management()).del("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _Role_orgId, "f"), role_id: this.id, key_id: key.id } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp, "Failed to remove key from role");
    }
    /**
     * Create a new session for this role.
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {string} purpose Descriptive purpose.
     * @param {SignerSessionLifetime} ttl Optional session lifetimes.
     * @return {Promise<SignerSession>} New signer session.
     */
    async createSession(storage, purpose, ttl) {
        const manager = await _1.SignerSessionManager.create(__classPrivateFieldGet(this, _Role_cs, "f"), storage, __classPrivateFieldGet(this, _Role_orgId, "f"), this.id, purpose, ttl);
        return new _1.SignerSession(manager);
    }
    /**
     * List all signer sessions for this role. Returned objects can be used to
     * revoke individual sessions, but they cannot be used for authentication.
     * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
     */
    async sessions() {
        const resp = await (await __classPrivateFieldGet(this, _Role_cs, "f").management()).get("/v0/org/{org_id}/roles/{role_id}/tokens", {
            params: { path: { org_id: __classPrivateFieldGet(this, _Role_orgId, "f"), role_id: this.id } },
        });
        const data = (0, util_1.assertOk)(resp);
        return data.tokens.map((t) => new _1.SignerSessionInfo(__classPrivateFieldGet(this, _Role_cs, "f"), __classPrivateFieldGet(this, _Role_orgId, "f"), this.id, t.hash, t.purpose));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /** Create a new role.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the role belongs.
     * @param {RoleInfo} data The JSON response from the API server.
     * @internal
     * */
    constructor(cs, orgId, data) {
        _Role_cs.set(this, void 0);
        _Role_orgId.set(this, void 0);
        __classPrivateFieldSet(this, _Role_cs, cs, "f");
        __classPrivateFieldSet(this, _Role_orgId, orgId, "f");
        this.id = data.role_id;
        this.name = data.name ?? undefined;
    }
    /** Update the role.
     * @param {UpdateRoleRequest} request The JSON request to send to the API server.
     * */
    async update(request) {
        const resp = await (await __classPrivateFieldGet(this, _Role_cs, "f").management()).patch("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _Role_orgId, "f"), role_id: this.id } },
            body: request,
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /** Create new role.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the role belongs.
     * @param {string?} name The optional name of the role.
     * @return {Role} The new role.
     * @internal
     * */
    static async createRole(cs, orgId, name) {
        const resp = await (await cs.management()).post("/v0/org/{org_id}/roles", {
            params: { path: { org_id: orgId } },
            body: name ? { name } : undefined,
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return await Role.getRole(cs, orgId, data.role_id);
    }
    /** Get a role by id.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the role belongs.
     * @param {string} roleId The id of the role to get.
     * @return {Role} The role.
     * @internal
     * */
    static async getRole(cs, orgId, roleId) {
        const resp = await (await cs.management()).get("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: orgId, role_id: roleId } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return new Role(cs, orgId, data);
    }
    /** Fetches the role information.
     * @return {RoleInfo} The role information.
     * @internal
     * */
    async fetch() {
        const resp = await (await __classPrivateFieldGet(this, _Role_cs, "f").management()).get("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _Role_orgId, "f"), role_id: this.id } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data;
    }
    /** Delete role.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the role belongs.
     * @param {string} roleId The id of the role to delete.
     * @internal
     * */
    static async deleteRole(cs, orgId, roleId) {
        const resp = await (await cs.management()).del("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: orgId, role_id: roleId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
}
exports.Role = Role;
_Role_cs = new WeakMap(), _Role_orgId = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdCQVNXO0FBRVgsaUNBQWtDO0FBWWxDLHFDQUFxQztBQUNyQyxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLCtCQUFmLGVBQWUsUUFLMUI7QUFrQkQsbURBQW1EO0FBQ25ELElBQVksYUFPWDtBQVBELFdBQVksYUFBYTtJQUN2QixzQ0FBcUIsQ0FBQTtJQUNyQixxQ0FBb0IsQ0FBQTtJQUNwQixzQ0FBcUIsQ0FBQTtJQUNyQix3Q0FBdUIsQ0FBQTtJQUN2Qiw0Q0FBMkIsQ0FBQTtJQUMzQiwwQ0FBeUIsQ0FBQTtBQUMzQixDQUFDLEVBUFcsYUFBYSw2QkFBYixhQUFhLFFBT3hCO0FBb0NELDZCQUE2QjtBQUNoQixRQUFBLG1CQUFtQixHQUFHLHFCQUE4QixDQUFDO0FBMkJsRSxpQ0FBaUM7QUFDakMsTUFBYSxlQUFlO0lBTTFCLHFDQUFxQztJQUNyQyxLQUFLLENBQUMsTUFBTTtRQUNWLE9BQU8sTUFBTSxNQUFHLENBQUMsTUFBTSxDQUFDLHVCQUFBLElBQUksMkJBQUksRUFBRSx1QkFBQSxJQUFJLDhCQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRDs7Ozs7U0FLSztJQUNMLFlBQVksRUFBYyxFQUFFLEtBQWEsRUFBRSxlQUFvQztRQWhCdEUsc0NBQWdCO1FBQ2hCLHlDQUFlO1FBZ0J0Qix1QkFBQSxJQUFJLHVCQUFPLEVBQUUsTUFBQSxDQUFDO1FBQ2QsdUJBQUEsSUFBSSwwQkFBVSxLQUFLLE1BQUEsQ0FBQztRQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7UUFDcEMs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aWduZXIsXG4gIEtleSxcbiAgTWZhVHlwZSxcbiAgU2lnbmVyU2Vzc2lvbixcbiAgU2lnbmVyU2Vzc2lvbkluZm8sXG4gIFNpZ25lclNlc3Npb25MaWZldGltZSxcbiAgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG4gIFNpZ25lclNlc3Npb25TdG9yYWdlLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cywgcGF0aHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG50eXBlIFVwZGF0ZVJvbGVSZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIl1bXCJwYXRjaFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG50eXBlIEtleVdpdGhQb2xpY2llc0luZm8gPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIktleUluUm9sZUluZm9cIl07XG5leHBvcnQgdHlwZSBSb2xlSW5mbyA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiUm9sZUluZm9cIl07XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbiByZWNlaXZlci5cbiAqIEBleGFtcGxlIHsgVHhSZWNlaXZlcjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIiB9XG4gKiAqL1xuZXhwb3J0IHR5cGUgVHhSZWNlaXZlciA9IHsgVHhSZWNlaXZlcjogc3RyaW5nIH07XG5cbi8qKiBUaGUga2luZCBvZiBkZXBvc2l0IGNvbnRyYWN0cy4gKi9cbmV4cG9ydCBlbnVtIERlcG9zaXRDb250cmFjdCB7XG4gIC8qKiBDYW5vbmljYWwgZGVwb3NpdCBjb250cmFjdCAqL1xuICBDYW5vbmljYWwsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgLyoqIFdyYXBwZXIgZGVwb3NpdCBjb250cmFjdCAqL1xuICBXcmFwcGVyLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdC4gKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdCA9IFR4RGVwb3NpdEJhc2UgfCBUeERlcG9zaXRQdWJrZXkgfCBUeERlcG9zaXRSb2xlO1xuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3QqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0QmFzZSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdCB9IH07XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCB3aXRoIGZpeGVkIHZhbGlkYXRvciAocHVia2V5KTpcbiAqICBAZXhhbXBsZSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXNwb3NpdENvbnRyYWN0LkNhbm9uaWNhbCwgdmFsaWRhdG9yOiB7IHB1YmtleTogXCI4ODc5Li4uOFwifSB9fVxuICogKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFB1YmtleSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcHVia2V5OiBzdHJpbmcgfSB9O1xuXG4vKiogUmVzdHJpY3QgdHJhbnNhY3Rpb25zIHRvIGNhbGxzIHRvIGRlcG9zaXQgY29udHJhY3Qgd2l0aCBhbnkgdmFsaWRhdG9yIGtleSBpbiBhIHJvbGU6XG4gKiBAZXhhbXBsZSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXNwb3NpdENvbnRyYWN0LkNhbm9uaWNhbCwgdmFsaWRhdG9yOiB7IHJvbGVfaWQ6IFwiUm9sZSNjNjMuLi5hZlwifSB9fVxuICogKi9cbmV4cG9ydCB0eXBlIFR4RGVwb3NpdFJvbGUgPSB7IFR4RGVwb3NpdDogeyBraW5kOiBEZXBvc2l0Q29udHJhY3Q7IHJvbGVfaWQ6IHN0cmluZyB9IH07XG5cbi8qKiBBbGwgZGlmZmVyZW50IGtpbmRzIG9mIHNlbnNpdGl2ZSBvcGVyYXRpb25zLiAqL1xuZXhwb3J0IGVudW0gT3BlcmF0aW9uS2luZCB7XG4gIEJsb2JTaWduID0gXCJCbG9iU2lnblwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV2bVNpZ24gPSBcIkV0aDFTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMlNpZ24gPSBcIkV0aDJTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMlN0YWtlID0gXCJFdGgyU3Rha2VcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdGgyVW5zdGFrZSA9IFwiRXRoMlVuc3Rha2VcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBTb2xhbmFTaWduID0gXCJTb2xhbmFTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIE1GQSBwb2xpY3lcbiAqIEBleGFtcGxlIHtcbiAqIHtcbiAqICAgY291bnQ6IDEsXG4gKiAgIG51bV9hdXRoX2ZhY3RvcnM6IDEsXG4gKiAgIGFsbG93ZWRfbWZhX3R5cGVzOiBbIFwiVG90cFwiIF0sXG4gKiAgIGFsbG93ZWRfYXBwcm92ZXJzOiBbIFwiVXNlciMxMjNcIiBdLFxuICogfVxuICogKi9cbmV4cG9ydCB0eXBlIE1mYVBvbGljeSA9IHtcbiAgY291bnQ/OiBudW1iZXI7XG4gIG51bV9hdXRoX2ZhY3RvcnM/OiBudW1iZXI7XG4gIGFsbG93ZWRfYXBwcm92ZXJzPzogc3RyaW5nW107XG4gIGFsbG93ZWRfbWZhX3R5cGVzPzogTWZhVHlwZVtdO1xuICByZXN0cmljdGVkX29wZXJhdGlvbnM/OiBPcGVyYXRpb25LaW5kW107XG59O1xuXG4vKiogUmVxdWlyZSBNRkEgZm9yIHRyYW5zYWN0aW9ucy5cbiAqIEBleGFtcGxlIHtcbiAqICAgICBSZXF1aXJlTWZhOiB7XG4gKiAgICAgICBjb3VudDogMSxcbiAqICAgICAgIGFsbG93ZWRfbWZhX3R5cGVzOiBbIFwiVG90cFwiIF0sXG4gKiAgICAgICBhbGxvd2VkX2FwcHJvdmVyczogWyBcIlVzZXIjMTIzXCIgXSxcbiAqICAgICAgIHJlc3RyaWN0ZWRfb3BlcmF0aW9uczogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICogKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVNZmEgPSB7XG4gIFJlcXVpcmVNZmE6IE1mYVBvbGljeTtcbn07XG5cbi8qKiBBbGxvdyByYXcgYmxvYiBzaWduaW5nICovXG5leHBvcnQgY29uc3QgQWxsb3dSYXdCbG9iU2lnbmluZyA9IFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQWxsb3dSYXdCbG9iU2lnbmluZyA9IHR5cGVvZiBBbGxvd1Jhd0Jsb2JTaWduaW5nO1xuXG4vKiogS2V5IHBvbGljeVxuICogQGV4YW1wbGUgW1xuICogICB7XG4gKiAgICAgXCJUeFJlY2VpdmVyXCI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCJcbiAqICAgfSxcbiAqICAge1xuICogICAgIFwiVHhEZXBvc2l0XCI6IHtcbiAqICAgICAgIFwia2luZFwiOiBcIkNhbm9uaWNhbFwiXG4gKiAgICAgfVxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJSZXF1aXJlTWZhXCI6IHtcbiAqICAgICAgIFwiY291bnRcIjogMSxcbiAqICAgICAgIFwiYWxsb3dlZF9tZmFfdHlwZXNcIjogW1wiQ3ViZVNpZ25lclwiXSxcbiAqICAgICAgIFwicmVzdHJpY3RlZF9vcGVyYXRpb25zXCI6IFtcbiAqICAgICAgICAgXCJFdGgxU2lnblwiLFxuICogICAgICAgICBcIkJsb2JTaWduXCJcbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIH1cbiAqIF1cbiAqICovXG5leHBvcnQgdHlwZSBLZXlQb2xpY3kgPSAoVHhSZWNlaXZlciB8IFR4RGVwb3NpdCB8IFJlcXVpcmVNZmEgfCBBbGxvd1Jhd0Jsb2JTaWduaW5nKVtdO1xuXG4vKiogQSBrZXkgZ3VhcmRlZCBieSBhIHBvbGljeS4gKi9cbmV4cG9ydCBjbGFzcyBLZXlXaXRoUG9saWNpZXMge1xuICByZWFkb25seSAjY3M6IEN1YmVTaWduZXI7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICByZWFkb25seSBrZXlJZDogc3RyaW5nO1xuICByZWFkb25seSBwb2xpY3k/OiBLZXlQb2xpY3k7XG5cbiAgLyoqIEByZXR1cm4ge1Byb21pc2U8S2V5Pn0gVGhlIGtleSAqL1xuICBhc3luYyBnZXRLZXkoKTogUHJvbWlzZTxLZXk+IHtcbiAgICByZXR1cm4gYXdhaXQgS2V5LmdldEtleSh0aGlzLiNjcywgdGhpcy4jb3JnSWQsIHRoaXMua2V5SWQpO1xuICB9XG5cbiAgLyoqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSBrZXkgYmVsb25ncy5cbiAgICogQHBhcmFtIHtLZXlXaXRoUG9saWNpZXNJbmZvfSBrZXlXaXRoUG9saWNpZXMgVGhlIGtleSBhbmQgaXRzIHBvbGljaWVzXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgb3JnSWQ6IHN0cmluZywga2V5V2l0aFBvbGljaWVzOiBLZXlXaXRoUG9saWNpZXNJbmZvKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMua2V5SWQgPSBrZXlXaXRoUG9saWNpZXMua2V5X2lkO1xuICAgIHRoaXMucG9saWN5ID0ga2V5V2l0aFBvbGljaWVzLnBvbGljeSBhcyB1bmtub3duIGFzIEtleVBvbGljeTtcbiAgfVxufVxuXG4vKiogUm9sZXMuICovXG5leHBvcnQgY2xhc3MgUm9sZSB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gIC8qKiBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgcm9sZSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbmFtZT86IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAZXhhbXBsZSBSb2xlI2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlxuICAgKiAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKiBEZWxldGUgdGhlIHJvbGUuICovXG4gIGFzeW5jIGRlbGV0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBSb2xlLmRlbGV0ZVJvbGUodGhpcy4jY3MsIHRoaXMuI29yZ0lkLCB0aGlzLmlkKTtcbiAgfVxuXG4gIC8qKiBJcyB0aGUgcm9sZSBlbmFibGVkPyAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIHJvbGUuICovXG4gIGFzeW5jIGVuYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUgcm9sZS4gKi9cbiAgYXN5bmMgZGlzYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqIFRoZSBsaXN0IG9mIHVzZXJzIHdpdGggYWNjZXNzIHRvIHRoZSByb2xlLlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgXCJVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlwiLFxuICAgKiAgIFwiVXNlciM1NTkzYzI1Yi01MmUyLTRmYjUtYjM5Yi05NmQ0MWQ2ODFkODJcIlxuICAgKiBdXG4gICAqICovXG4gIGFzeW5jIHVzZXJzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLnVzZXJzIHx8IFtdO1xuICB9XG5cbiAgLyoqIEFkZCBhIHVzZXIgdG8gdGhlIHJvbGUuXG4gICAqIEFkZHMgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSB1c2VyLWlkIG9mIHRoZSB1c2VyIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogKi9cbiAgYXN5bmMgYWRkVXNlcih1c2VySWQ6IHN0cmluZykge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnB1dChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2FkZF91c2VyL3t1c2VyX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCByb2xlX2lkOiB0aGlzLmlkLCB1c2VyX2lkOiB1c2VySWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCwgXCJGYWlsZWQgdG8gYWRkIHVzZXIgdG8gcm9sZVwiKTtcbiAgfVxuXG4gIC8qKiBUaGUgbGlzdCBvZiBrZXlzIGluIHRoZSByb2xlLlxuICAgKiBAZXhhbXBsZSBbXG4gICAqICAgIHtcbiAgICogICAgIGlkOiBcIktleSNiZmUzZWNjYi03MzFlLTQzMGQtYjFlNS1hYzEzNjNlNmIwNmJcIixcbiAgICogICAgIHBvbGljeTogeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAgICogICAgfSxcbiAgICogIF1cbiAgICogKi9cbiAgYXN5bmMga2V5cygpOiBQcm9taXNlPEtleVdpdGhQb2xpY2llc1tdPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEua2V5cyB8fCBbXSkubWFwKChrKSA9PiBuZXcgS2V5V2l0aFBvbGljaWVzKHRoaXMuI2NzLCB0aGlzLiNvcmdJZCwgaykpO1xuICB9XG5cbiAgLyoqIEFkZCBrZXlzIHRvIHRoZSByb2xlLlxuICAgKiBBZGRzIGEgbGlzdCBvZiBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5W119IGtleXMgVGhlIGxpc3Qgb2Yga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5P30gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqICovXG4gIGFzeW5jIGFkZEtleXMoa2V5czogS2V5W10sIHBvbGljeT86IEtleVBvbGljeSkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnB1dChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2FkZF9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBrZXlfaWRzOiBrZXlzLm1hcCgoaykgPT4gay5pZCksXG4gICAgICAgIHBvbGljeTogKHBvbGljeSA/PyBudWxsKSBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGwsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCwgXCJGYWlsZWQgdG8gYWRkIGtleXMgdG8gcm9sZVwiKTtcbiAgfVxuXG4gIC8qKiBBZGQgYSBrZXkgdG8gdGhlIHJvbGUuXG4gICAqIEFkZHMgYW4gZXhpc3Rpbmcga2V5IHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5fSBrZXkgVGhlIGtleSB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5P30gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gdGhlIGtleS5cbiAgICogKi9cbiAgYXN5bmMgYWRkS2V5KGtleTogS2V5LCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hZGRLZXlzKFtrZXldLCBwb2xpY3kpO1xuICB9XG5cbiAgLyoqIFJlbW92ZSBrZXkgZnJvbSB0aGUgcm9sZS5cbiAgICogUmVtb3ZlcyBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKiBAcGFyYW0ge0tleX0ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqICovXG4gIGFzeW5jIHJlbW92ZUtleShrZXk6IEtleSkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmRlbChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2tleXMve2tleV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcm9sZV9pZDogdGhpcy5pZCwga2V5X2lkOiBrZXkuaWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCwgXCJGYWlsZWQgdG8gcmVtb3ZlIGtleSBmcm9tIHJvbGVcIik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNlc3Npb24gZm9yIHRoaXMgcm9sZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVycG9zZSBEZXNjcmlwdGl2ZSBwdXJwb3NlLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25MaWZldGltZX0gdHRsIE9wdGlvbmFsIHNlc3Npb24gbGlmZXRpbWVzLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb24+fSBOZXcgc2lnbmVyIHNlc3Npb24uXG4gICAqL1xuICBhc3luYyBjcmVhdGVTZXNzaW9uKFxuICAgIHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICB0dGw/OiBTaWduZXJTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IG1hbmFnZXIgPSBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5jcmVhdGUoXG4gICAgICB0aGlzLiNjcyxcbiAgICAgIHN0b3JhZ2UsXG4gICAgICB0aGlzLiNvcmdJZCxcbiAgICAgIHRoaXMuaWQsXG4gICAgICBwdXJwb3NlLFxuICAgICAgdHRsLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uKG1hbmFnZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLiBSZXR1cm5lZCBvYmplY3RzIGNhbiBiZSB1c2VkIHRvXG4gICAqIHJldm9rZSBpbmRpdmlkdWFsIHNlc3Npb25zLCBidXQgdGhleSBjYW5ub3QgYmUgdXNlZCBmb3IgYXV0aGVudGljYXRpb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbkluZm9bXT59IFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbnMoKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uSW5mb1tdPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdG9rZW5zXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHRoaXMuaWQgfSB9LFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YS50b2tlbnMubWFwKFxuICAgICAgKHQpID0+IG5ldyBTaWduZXJTZXNzaW9uSW5mbyh0aGlzLiNjcywgdGhpcy4jb3JnSWQsIHRoaXMuaWQsIHQuaGFzaCwgdC5wdXJwb3NlKSxcbiAgICApO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIHJvbGUgYmVsb25ncy5cbiAgICogQHBhcmFtIHtSb2xlSW5mb30gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgY29uc3RydWN0b3IoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIGRhdGE6IFJvbGVJbmZvKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuaWQgPSBkYXRhLnJvbGVfaWQ7XG4gICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7VXBkYXRlUm9sZVJlcXVlc3R9IHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZShyZXF1ZXN0OiBVcGRhdGVSb2xlUmVxdWVzdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcm9sZV9pZDogdGhpcy5pZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKiogQ3JlYXRlIG5ldyByb2xlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSByb2xlIGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gbmFtZSBUaGUgb3B0aW9uYWwgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybiB7Um9sZX0gVGhlIG5ldyByb2xlLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVJvbGUoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IG5hbWUgPyB7IG5hbWUgfSA6IHVuZGVmaW5lZCxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gYXdhaXQgUm9sZS5nZXRSb2xlKGNzLCBvcmdJZCwgZGF0YS5yb2xlX2lkKTtcbiAgfVxuXG4gIC8qKiBHZXQgYSByb2xlIGJ5IGlkLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSByb2xlIGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIGlkIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybiB7Um9sZX0gVGhlIHJvbGUuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0Um9sZShjczogQ3ViZVNpZ25lciwgb3JnSWQ6IHN0cmluZywgcm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBuZXcgUm9sZShjcywgb3JnSWQsIGRhdGEpO1xuICB9XG5cbiAgLyoqIEZldGNoZXMgdGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqIEByZXR1cm4ge1JvbGVJbmZvfSBUaGUgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgLyoqIERlbGV0ZSByb2xlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSByb2xlIGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIGlkIG9mIHRoZSByb2xlIHRvIGRlbGV0ZS5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIGRlbGV0ZVJvbGUoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG59XG4iXX0=