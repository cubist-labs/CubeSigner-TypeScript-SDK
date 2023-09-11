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
exports.Role = exports.KeyWithPolicies = exports.OperationKind = exports.DepositContract = void 0;
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
        return data.users;
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
        return data.keys.map((k) => new KeyWithPolicies(__classPrivateFieldGet(this, _Role_cs, "f"), __classPrivateFieldGet(this, _Role_orgId, "f"), k));
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
        return new _1.SignerSession(__classPrivateFieldGet(this, _Role_cs, "f"), manager);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdCQVNXO0FBRVgsaUNBQWtDO0FBWWxDLHFDQUFxQztBQUNyQyxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDekIsaUNBQWlDO0lBQ2pDLCtEQUFTLENBQUE7SUFDVCwrQkFBK0I7SUFDL0IsMkRBQU8sQ0FBQTtBQUNULENBQUMsRUFMVyxlQUFlLCtCQUFmLGVBQWUsUUFLMUI7QUFrQkQsbURBQW1EO0FBQ25ELElBQVksYUFPWDtBQVBELFdBQVksYUFBYTtJQUN2QixzQ0FBcUIsQ0FBQTtJQUNyQixxQ0FBb0IsQ0FBQTtJQUNwQixzQ0FBcUIsQ0FBQTtJQUNyQix3Q0FBdUIsQ0FBQTtJQUN2Qiw0Q0FBMkIsQ0FBQTtJQUMzQiwwQ0FBeUIsQ0FBQTtBQUMzQixDQUFDLEVBUFcsYUFBYSw2QkFBYixhQUFhLFFBT3hCO0FBbURELGlDQUFpQztBQUNqQyxNQUFhLGVBQWU7SUFNMUIscUNBQXFDO0lBQ3JDLEtBQUssQ0FBQyxNQUFNO1FBQ1YsT0FBTyxNQUFNLE1BQUcsQ0FBQyxNQUFNLENBQUMsdUJBQUEsSUFBSSwyQkFBSSxFQUFFLHVCQUFBLElBQUksOEJBQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVEOzs7OztTQUtLO0lBQ0wsWUFBWSxFQUFjLEVBQUUsS0FBYSxFQUFFLGVBQW9DO1FBaEJ0RSxzQ0FBZ0I7UUFDaEIseUNBQWU7UUFnQnRCLHVCQUFBLElBQUksdUJBQU8sRUFBRSxNQUFBLENBQUM7UUFDZCx1QkFBQSxJQUFJLDBCQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztRQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLGVBQWUsQ0FBQyxNQUE4QixDQUFDO0lBQy9ELENB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QUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsT0FBTyxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7O1NBR0s7SUFDRyxLQUFLLENBQUMsS0FBSztRQUNqQixNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sdUJBQUEsSUFBSSxnQkFBSSxDQUFDLFVBQVUsRUFBRSxDQUM1QixDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsRUFBRTtZQUN4QyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsdUJBQUEsSUFBSSxtQkFBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDM0QsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7O1NBS0s7SUFDRyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFjLEVBQUUsS0FBYSxFQUFFLE1BQWM7UUFDM0UsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUNqQixNQUFNLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FDdEIsQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEVBQUU7WUFDeEMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDcEQsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBM1BELG9CQTJQQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEN1YmVTaWduZXIsXG4gIEtleSxcbiAgTWZhVHlwZSxcbiAgU2lnbmVyU2Vzc2lvbixcbiAgU2lnbmVyU2Vzc2lvbkluZm8sXG4gIFNpZ25lclNlc3Npb25MaWZldGltZSxcbiAgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG4gIFNpZ25lclNlc3Npb25TdG9yYWdlLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cywgcGF0aHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG50eXBlIFVwZGF0ZVJvbGVSZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIl1bXCJwYXRjaFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG50eXBlIEtleVdpdGhQb2xpY2llc0luZm8gPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIktleVdpdGhQb2xpY2llc1wiXTtcbmV4cG9ydCB0eXBlIFJvbGVJbmZvID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJSb2xlSW5mb1wiXTtcblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9uIHJlY2VpdmVyLlxuICogQGV4YW1wbGUgeyBUeFJlY2VpdmVyOiBcIjB4OGM1OTQ2OTFjMGU1OTJmZmEyMWYxNTNhMTZhZTQxZGI1YmVmY2FhYVwiIH1cbiAqICovXG5leHBvcnQgdHlwZSBUeFJlY2VpdmVyID0geyBUeFJlY2VpdmVyOiBzdHJpbmcgfTtcblxuLyoqIFRoZSBraW5kIG9mIGRlcG9zaXQgY29udHJhY3RzLiAqL1xuZXhwb3J0IGVudW0gRGVwb3NpdENvbnRyYWN0IHtcbiAgLyoqIENhbm9uaWNhbCBkZXBvc2l0IGNvbnRyYWN0ICovXG4gIENhbm9uaWNhbCwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAvKiogV3JhcHBlciBkZXBvc2l0IGNvbnRyYWN0ICovXG4gIFdyYXBwZXIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0ID0gVHhEZXBvc2l0QmFzZSB8IFR4RGVwb3NpdFB1YmtleSB8IFR4RGVwb3NpdFJvbGU7XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCovXG5leHBvcnQgdHlwZSBUeERlcG9zaXRCYXNlID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0IH0gfTtcblxuLyoqIFJlc3RyaWN0IHRyYW5zYWN0aW9ucyB0byBjYWxscyB0byBkZXBvc2l0IGNvbnRyYWN0IHdpdGggZml4ZWQgdmFsaWRhdG9yIChwdWJrZXkpOlxuICogIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcHVia2V5OiBcIjg4NzkuLi44XCJ9IH19XG4gKiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0UHVia2V5ID0geyBUeERlcG9zaXQ6IHsga2luZDogRGVwb3NpdENvbnRyYWN0OyBwdWJrZXk6IHN0cmluZyB9IH07XG5cbi8qKiBSZXN0cmljdCB0cmFuc2FjdGlvbnMgdG8gY2FsbHMgdG8gZGVwb3NpdCBjb250cmFjdCB3aXRoIGFueSB2YWxpZGF0b3Iga2V5IGluIGEgcm9sZTpcbiAqIEBleGFtcGxlIHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlc3Bvc2l0Q29udHJhY3QuQ2Fub25pY2FsLCB2YWxpZGF0b3I6IHsgcm9sZV9pZDogXCJSb2xlI2M2My4uLmFmXCJ9IH19XG4gKiAqL1xuZXhwb3J0IHR5cGUgVHhEZXBvc2l0Um9sZSA9IHsgVHhEZXBvc2l0OiB7IGtpbmQ6IERlcG9zaXRDb250cmFjdDsgcm9sZV9pZDogc3RyaW5nIH0gfTtcblxuLyoqIEFsbCBkaWZmZXJlbnQga2luZHMgb2Ygc2Vuc2l0aXZlIG9wZXJhdGlvbnMuICovXG5leHBvcnQgZW51bSBPcGVyYXRpb25LaW5kIHtcbiAgQmxvYlNpZ24gPSBcIkJsb2JTaWduXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXZtU2lnbiA9IFwiRXRoMVNpZ25cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdGgyU2lnbiA9IFwiRXRoMlNpZ25cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdGgyU3Rha2UgPSBcIkV0aDJTdGFrZVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV0aDJVbnN0YWtlID0gXCJFdGgyVW5zdGFrZVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFNvbGFuYVNpZ24gPSBcIlNvbGFuYVNpZ25cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogUmVxdWlyZSBNRkEgZm9yIHRyYW5zYWN0aW9ucy5cbiAqIEBleGFtcGxlIHtcbiAqICAgICBSZXF1aXJlTWZhOiB7XG4gKiAgICAgICBjb3VudDogMSxcbiAqICAgICAgIGFsbG93ZWRfbWZhX3R5cGVzOiBbIFwiVG90cFwiIF0sXG4gKiAgICAgICBhbGxvd2VkX2FwcHJvdmVyczogWyBcIlVzZXIjMTIzXCIgXSxcbiAqICAgICAgIHJlc3RyaWN0ZWRfb3BlcmF0aW9uczogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICogKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVNZmEgPSB7XG4gIFJlcXVpcmVNZmE6IHtcbiAgICBjb3VudD86IG51bWJlcjtcbiAgICByZXN0cmljdGVkX29wZXJhdGlvbnM/OiBPcGVyYXRpb25LaW5kW107XG4gICAgYWxsb3dlZF9hcHByb3ZlcnM/OiBzdHJpbmdbXTtcbiAgICBhbGxvd2VkX21mYV90eXBlcz86IE1mYVR5cGVbXTtcbiAgfTtcbn07XG5cbi8qKiBBbGxvdyByYXcgYmxvYiBzaWduaW5nICovXG5leHBvcnQgdHlwZSBBbGxvd1Jhd0Jsb2JTaWduaW5nID0gXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCI7XG5cbi8qKiBLZXkgcG9saWN5XG4gKiBAZXhhbXBsZSBbXG4gKiAgIHtcbiAqICAgICBcIlR4UmVjZWl2ZXJcIjogXCIweDhjNTk0NjkxYzBlNTkyZmZhMjFmMTUzYTE2YWU0MWRiNWJlZmNhYWFcIlxuICogICB9LFxuICogICB7XG4gKiAgICAgXCJUeERlcG9zaXRcIjoge1xuICogICAgICAgXCJraW5kXCI6IFwiQ2Fub25pY2FsXCJcbiAqICAgICB9XG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICBcIlJlcXVpcmVNZmFcIjoge1xuICogICAgICAgXCJjb3VudFwiOiAxLFxuICogICAgICAgXCJhbGxvd2VkX21mYV90eXBlc1wiOiBbXCJDdWJlU2lnbmVyXCJdLFxuICogICAgICAgXCJyZXN0cmljdGVkX29wZXJhdGlvbnNcIjogW1xuICogICAgICAgICBcIkV0aDFTaWduXCIsXG4gKiAgICAgICAgIFwiQmxvYlNpZ25cIlxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgfVxuICogXVxuICogKi9cbmV4cG9ydCB0eXBlIEtleVBvbGljeSA9IChUeFJlY2VpdmVyIHwgVHhEZXBvc2l0IHwgUmVxdWlyZU1mYSB8IEFsbG93UmF3QmxvYlNpZ25pbmcpW107XG5cbi8qKiBBIGtleSBndWFyZGVkIGJ5IGEgcG9saWN5LiAqL1xuZXhwb3J0IGNsYXNzIEtleVdpdGhQb2xpY2llcyB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGtleUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBvbGljeT86IEtleVBvbGljeTtcblxuICAvKiogQHJldHVybiB7UHJvbWlzZTxLZXk+fSBUaGUga2V5ICovXG4gIGFzeW5jIGdldEtleSgpOiBQcm9taXNlPEtleT4ge1xuICAgIHJldHVybiBhd2FpdCBLZXkuZ2V0S2V5KHRoaXMuI2NzLCB0aGlzLiNvcmdJZCwgdGhpcy5rZXlJZCk7XG4gIH1cblxuICAvKiogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIGtleSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge0tleVdpdGhQb2xpY2llc0luZm99IGtleVdpdGhQb2xpY2llcyBUaGUga2V5IGFuZCBpdHMgcG9saWNpZXNcbiAgICogQGludGVybmFsXG4gICAqICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCBrZXlXaXRoUG9saWNpZXM6IEtleVdpdGhQb2xpY2llc0luZm8pIHtcbiAgICB0aGlzLiNjcyA9IGNzO1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy5rZXlJZCA9IGtleVdpdGhQb2xpY2llcy5rZXlfaWQ7XG4gICAgdGhpcy5wb2xpY3kgPSBrZXlXaXRoUG9saWNpZXMucG9saWN5IGFzIHVua25vd24gYXMgS2V5UG9saWN5O1xuICB9XG59XG5cbi8qKiBSb2xlcy4gKi9cbmV4cG9ydCBjbGFzcyBSb2xlIHtcbiAgcmVhZG9ubHkgI2NzOiBDdWJlU2lnbmVyO1xuICByZWFkb25seSAjb3JnSWQ6IHN0cmluZztcbiAgLyoqIEh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSByb2xlICovXG4gIHB1YmxpYyByZWFkb25seSBuYW1lPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFJvbGUjYmZlM2VjY2ItNzMxZS00MzBkLWIxZTUtYWMxMzYzZTZiMDZiXG4gICAqICovXG4gIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG5cbiAgLyoqIERlbGV0ZSB0aGUgcm9sZS4gKi9cbiAgYXN5bmMgZGVsZXRlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IFJvbGUuZGVsZXRlUm9sZSh0aGlzLiNjcywgdGhpcy4jb3JnSWQsIHRoaXMuaWQpO1xuICB9XG5cbiAgLyoqIElzIHRoZSByb2xlIGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqIEVuYWJsZSB0aGUgcm9sZS4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSByb2xlLiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKiogVGhlIGxpc3Qgb2YgdXNlcnMgd2l0aCBhY2Nlc3MgdG8gdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFtcbiAgICogICBcIlVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXCIsXG4gICAqICAgXCJVc2VyIzU1OTNjMjViLTUyZTItNGZiNS1iMzliLTk2ZDQxZDY4MWQ4MlwiXG4gICAqIF1cbiAgICogKi9cbiAgYXN5bmMgdXNlcnMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEudXNlcnM7XG4gIH1cblxuICAvKiogQWRkIGEgdXNlciB0byB0aGUgcm9sZS5cbiAgICogQWRkcyBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIHVzZXItaWQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiAqL1xuICBhc3luYyBhZGRVc2VyKHVzZXJJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkucHV0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vYWRkX3VzZXIve3VzZXJfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHRoaXMuaWQsIHVzZXJfaWQ6IHVzZXJJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwLCBcIkZhaWxlZCB0byBhZGQgdXNlciB0byByb2xlXCIpO1xuICB9XG5cbiAgLyoqIFRoZSBsaXN0IG9mIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqIEBleGFtcGxlIFtcbiAgICogICAge1xuICAgKiAgICAgaWQ6IFwiS2V5I2JmZTNlY2NiLTczMWUtNDMwZC1iMWU1LWFjMTM2M2U2YjA2YlwiLFxuICAgKiAgICAgcG9saWN5OiB7IFR4UmVjZWl2ZXI6IFwiMHg4YzU5NDY5MWMwZTU5MmZmYTIxZjE1M2ExNmFlNDFkYjViZWZjYWFhXCIgfVxuICAgKiAgICB9LFxuICAgKiAgXVxuICAgKiAqL1xuICBhc3luYyBrZXlzKCk6IFByb21pc2U8S2V5V2l0aFBvbGljaWVzW10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmtleXMubWFwKChrKSA9PiBuZXcgS2V5V2l0aFBvbGljaWVzKHRoaXMuI2NzLCB0aGlzLiNvcmdJZCwgaykpO1xuICB9XG5cbiAgLyoqIEFkZCBrZXlzIHRvIHRoZSByb2xlLlxuICAgKiBBZGRzIGEgbGlzdCBvZiBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5W119IGtleXMgVGhlIGxpc3Qgb2Yga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5P30gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqICovXG4gIGFzeW5jIGFkZEtleXMoa2V5czogS2V5W10sIHBvbGljeT86IEtleVBvbGljeSkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnB1dChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2FkZF9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBrZXlfaWRzOiBrZXlzLm1hcCgoaykgPT4gay5pZCksXG4gICAgICAgIHBvbGljeTogKHBvbGljeSA/PyBudWxsKSBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGwsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCwgXCJGYWlsZWQgdG8gYWRkIGtleXMgdG8gcm9sZVwiKTtcbiAgfVxuXG4gIC8qKiBBZGQgYSBrZXkgdG8gdGhlIHJvbGUuXG4gICAqIEFkZHMgYW4gZXhpc3Rpbmcga2V5IHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5fSBrZXkgVGhlIGtleSB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5P30gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gdGhlIGtleS5cbiAgICogKi9cbiAgYXN5bmMgYWRkS2V5KGtleTogS2V5LCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hZGRLZXlzKFtrZXldLCBwb2xpY3kpO1xuICB9XG5cbiAgLyoqIFJlbW92ZSBrZXkgZnJvbSB0aGUgcm9sZS5cbiAgICogUmVtb3ZlcyBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKiBAcGFyYW0ge0tleX0ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqICovXG4gIGFzeW5jIHJlbW92ZUtleShrZXk6IEtleSkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmRlbChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2tleXMve2tleV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcm9sZV9pZDogdGhpcy5pZCwga2V5X2lkOiBrZXkuaWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCwgXCJGYWlsZWQgdG8gcmVtb3ZlIGtleSBmcm9tIHJvbGVcIik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNlc3Npb24gZm9yIHRoaXMgcm9sZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVycG9zZSBEZXNjcmlwdGl2ZSBwdXJwb3NlLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25MaWZldGltZX0gdHRsIE9wdGlvbmFsIHNlc3Npb24gbGlmZXRpbWVzLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb24+fSBOZXcgc2lnbmVyIHNlc3Npb24uXG4gICAqL1xuICBhc3luYyBjcmVhdGVTZXNzaW9uKFxuICAgIHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlLFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICB0dGw/OiBTaWduZXJTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IG1hbmFnZXIgPSBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5jcmVhdGUoXG4gICAgICB0aGlzLiNjcyxcbiAgICAgIHN0b3JhZ2UsXG4gICAgICB0aGlzLiNvcmdJZCxcbiAgICAgIHRoaXMuaWQsXG4gICAgICBwdXJwb3NlLFxuICAgICAgdHRsLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uKHRoaXMuI2NzLCBtYW5hZ2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBzaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS4gUmV0dXJuZWQgb2JqZWN0cyBjYW4gYmUgdXNlZCB0b1xuICAgKiByZXZva2UgaW5kaXZpZHVhbCBzZXNzaW9ucywgYnV0IHRoZXkgY2Fubm90IGJlIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25JbmZvW10+fSBTaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25zKCk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbkluZm9bXT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3Rva2Vuc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCByb2xlX2lkOiB0aGlzLmlkIH0gfSxcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEudG9rZW5zLm1hcChcbiAgICAgICh0KSA9PiBuZXcgU2lnbmVyU2Vzc2lvbkluZm8odGhpcy4jY3MsIHRoaXMuI29yZ0lkLCB0aGlzLmlkLCB0Lmhhc2gsIHQucHVycG9zZSksXG4gICAgKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSByb2xlIGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7Um9sZUluZm99IGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCBkYXRhOiBSb2xlSW5mbykge1xuICAgIHRoaXMuI2NzID0gY3M7XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLmlkID0gZGF0YS5yb2xlX2lkO1xuICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSByb2xlLlxuICAgKiBAcGFyYW0ge1VwZGF0ZVJvbGVSZXF1ZXN0fSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlUm9sZVJlcXVlc3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIENyZWF0ZSBuZXcgcm9sZS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUgcm9sZSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG5hbWUgVGhlIG9wdGlvbmFsIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm4ge1JvbGV9IFRoZSBuZXcgcm9sZS5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVSb2xlKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCBuYW1lPzogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBib2R5OiBuYW1lID8geyBuYW1lIH0gOiB1bmRlZmluZWQsXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGF3YWl0IFJvbGUuZ2V0Um9sZShjcywgb3JnSWQsIGRhdGEucm9sZV9pZCk7XG4gIH1cblxuICAvKiogR2V0IGEgcm9sZSBieSBpZC5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUgcm9sZSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm4ge1JvbGV9IFRoZSByb2xlLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgc3RhdGljIGFzeW5jIGdldFJvbGUoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gbmV3IFJvbGUoY3MsIG9yZ0lkLCBkYXRhKTtcbiAgfVxuXG4gIC8qKiBGZXRjaGVzIHRoZSByb2xlIGluZm9ybWF0aW9uLlxuICAgKiBAcmV0dXJuIHtSb2xlSW5mb30gVGhlIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCByb2xlX2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIC8qKiBEZWxldGUgcm9sZS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUgcm9sZSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZSB0byBkZWxldGUuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBkZWxldGVSb2xlKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCByb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLmRlbChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxufVxuIl19