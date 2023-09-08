"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Key_cs;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Key = exports.Ed25519 = exports.BLS = exports.Secp256k1 = void 0;
const util_1 = require("./util");
/** Secp256k1 key type */
var Secp256k1;
(function (Secp256k1) {
    Secp256k1["Evm"] = "SecpEthAddr";
    Secp256k1["Btc"] = "SecpBtc";
    Secp256k1["BtcTest"] = "SecpBtcTest";
})(Secp256k1 || (exports.Secp256k1 = Secp256k1 = {}));
/** BLS key type */
var BLS;
(function (BLS) {
    BLS["Eth2Deposited"] = "BlsPub";
    BLS["Eth2Inactive"] = "BlsInactive";
})(BLS || (exports.BLS = BLS = {}));
/** Ed25519 key type */
var Ed25519;
(function (Ed25519) {
    Ed25519["Solana"] = "Ed25519SolanaAddr";
    Ed25519["Sui"] = "Ed25519SuiAddr";
    Ed25519["Aptos"] = "Ed25519AptosAddr";
})(Ed25519 || (exports.Ed25519 = Ed25519 = {}));
/** Signing keys. */
class Key {
    /** Is the key enabled? */
    async enabled() {
        const data = await this.fetch();
        return data.enabled;
    }
    /** Enable the key. */
    async enable() {
        await this.update({ enabled: true });
    }
    /** Disable the key. */
    async disable() {
        await this.update({ enabled: false });
    }
    /**
     * Set new policy (overwriting any policies previously set for this key)
     * @param {KeyPolicy} policy The new policy to set
     */
    async setPolicy(policy) {
        await this.update({ policy: policy });
    }
    /**
     * Append to existing key policy. This append is not atomic -- it uses {@link policy} to fetch the current policy and then {@link setPolicy} to set the policy -- and should not be used in across concurrent sessions.
     * @param {KeyPolicy} policy The policy to append to the existing one.
     */
    async appendPolicy(policy) {
        const existing = await this.policy();
        await this.setPolicy([...existing, ...policy]);
    }
    /**
     * Get the policy for the org.
     * @return {Promise<KeyPolicy>} The policy for the org.
     */
    async policy() {
        const data = await this.fetch();
        return (data.policy ?? []);
    }
    /**
     * @description Owner of the key
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     * */
    async owner() {
        const data = await this.fetch();
        return data.owner;
    }
    /** Set the owner of the key. Only the key (or org) owner can change the owner of the key.
     * @param {string} owner The user-id of the new owner of the key.
     * */
    async setOwner(owner) {
        await this.update({ owner });
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /** Create a new key.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {KeyInfo} data The JSON response from the API server.
     * @internal
     * */
    constructor(cs, orgId, data) {
        /** The CubeSigner instance that this key is associated with */
        _Key_cs.set(this, void 0);
        __classPrivateFieldSet(this, _Key_cs, cs, "f");
        this.orgId = orgId;
        this.id = data.key_id;
        this.type = fromSchemaKeyType(data.key_type);
        this.materialId = data.material_id;
        this.publicKey = data.public_key;
    }
    /** Update the key.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfo} The JSON response from the API server.
     * */
    async update(request) {
        const resp = await (await __classPrivateFieldGet(this, _Key_cs, "f").management()).patch("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: this.orgId, key_id: this.id } },
            body: request,
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /** Create new signing keys.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {KeyType} keyType The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     * @internal
     * */
    static async createKeys(cs, orgId, keyType, count, ownerId) {
        const chain_id = 0; // not used anymore
        const resp = await (await cs.management()).post("/v0/org/{org_id}/keys", {
            params: { path: { org_id: orgId } },
            body: {
                count,
                chain_id,
                key_type: keyType,
                owner: ownerId || null,
            },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data.keys.map((k) => new Key(cs, orgId, k));
    }
    /** Get a key by id.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     * @internal
     * */
    static async getKey(cs, orgId, keyId) {
        const resp = await (await cs.management()).get("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: orgId, key_id: keyId } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return new Key(cs, orgId, data);
    }
    /** Fetches the key information.
     * @return {KeyInfo} The key information.
     * @internal
     * */
    async fetch() {
        const resp = await (await __classPrivateFieldGet(this, _Key_cs, "f").management()).get("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: this.orgId, key_id: this.id } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data;
    }
}
exports.Key = Key;
_Key_cs = new WeakMap();
/** Convert a schema key type to a key type.
 * @param {SchemaKeyType} ty The schema key type.
 * @return {KeyType} The key type.
 * @internal
 * */
function fromSchemaKeyType(ty) {
    switch (ty) {
        case "SecpEthAddr":
            return Secp256k1.Evm;
        case "SecpBtc":
            return Secp256k1.Btc;
        case "SecpBtcTest":
            return Secp256k1.BtcTest;
        case "BlsPub":
            return BLS.Eth2Deposited;
        case "BlsInactive":
            return BLS.Eth2Inactive;
        case "Ed25519SolanaAddr":
            return Ed25519.Solana;
        case "Ed25519SuiAddr":
            return Ed25519.Sui;
        case "Ed25519AptosAddr":
            return Ed25519.Aptos;
        default:
            throw new Error(`Unknown key type: ${ty}`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFFbEMseUJBQXlCO0FBQ3pCLElBQVksU0FJWDtBQUpELFdBQVksU0FBUztJQUNuQixnQ0FBbUIsQ0FBQTtJQUNuQiw0QkFBZSxDQUFBO0lBQ2Ysb0NBQXVCLENBQUE7QUFDekIsQ0FBQyxFQUpXLFNBQVMseUJBQVQsU0FBUyxRQUlwQjtBQUVELG1CQUFtQjtBQUNuQixJQUFZLEdBR1g7QUFIRCxXQUFZLEdBQUc7SUFDYiwrQkFBd0IsQ0FBQTtJQUN4QixtQ0FBNEIsQ0FBQTtBQUM5QixDQUFDLEVBSFcsR0FBRyxtQkFBSCxHQUFHLFFBR2Q7QUFFRCx1QkFBdUI7QUFDdkIsSUFBWSxPQUlYO0FBSkQsV0FBWSxPQUFPO0lBQ2pCLHVDQUE0QixDQUFBO0lBQzVCLGlDQUFzQixDQUFBO0lBQ3RCLHFDQUEwQixDQUFBO0FBQzVCLENBQUMsRUFKVyxPQUFPLHVCQUFQLE9BQU8sUUFJbEI7QUFXRCxvQkFBb0I7QUFDcEIsTUFBYSxHQUFHO0lBNkJkLDBCQUEwQjtJQUMxQixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxL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UUFDSCxNQUFNLElBQUksR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQTFMRCxrQkEwTEM7O0FBRUQ7Ozs7S0FJSztBQUNMLFNBQVMsaUJBQWlCLENBQUMsRUFBaUI7SUFDMUMsUUFBUSxFQUFFLEVBQUU7UUFDVixLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDO1FBQ3ZCLEtBQUssU0FBUztZQUNaLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQztRQUN2QixLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDO1FBQzNCLEtBQUssUUFBUTtZQUNYLE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQztRQUMzQixLQUFLLGFBQWE7WUFDaEIsT0FBTyxHQUFHLENBQUMsWUFBWSxDQUFDO1FBQzFCLEtBQUssbUJBQW1CO1lBQ3RCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUN4QixLQUFLLGdCQUFnQjtZQUNuQixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDckIsS0FBSyxrQkFBa0I7WUFDckIsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3ZCO1lBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUM5QztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdWJlU2lnbmVyLCBLZXlQb2xpY3kgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi91dGlsXCI7XG5cbi8qKiBTZWNwMjU2azEga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIFNlY3AyNTZrMSB7XG4gIEV2bSA9IFwiU2VjcEV0aEFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGMgPSBcIlNlY3BCdGNcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGNUZXN0ID0gXCJTZWNwQnRjVGVzdFwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBCTFMga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIEJMUyB7XG4gIEV0aDJEZXBvc2l0ZWQgPSBcIkJsc1B1YlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV0aDJJbmFjdGl2ZSA9IFwiQmxzSW5hY3RpdmVcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogRWQyNTUxOSBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gRWQyNTUxOSB7XG4gIFNvbGFuYSA9IFwiRWQyNTUxOVNvbGFuYUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBTdWkgPSBcIkVkMjU1MTlTdWlBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQXB0b3MgPSBcIkVkMjU1MTlBcHRvc0FkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogS2V5IHR5cGUgKi9cbmV4cG9ydCB0eXBlIEtleVR5cGUgPSBTZWNwMjU2azEgfCBCTFMgfCBFZDI1NTE5O1xuXG4vKiogU2NoZW1hIGtleSB0eXBlIChpLmUuLCBrZXkgdHlwZSBhdCB0aGUgQVBJIGxldmVsKSAqL1xudHlwZSBTY2hlbWFLZXlUeXBlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJLZXlUeXBlXCJdO1xuXG50eXBlIFVwZGF0ZUtleVJlcXVlc3QgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlVwZGF0ZUtleVJlcXVlc3RcIl07XG50eXBlIEtleUluZm8gPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIktleUluZm9cIl07XG5cbi8qKiBTaWduaW5nIGtleXMuICovXG5leHBvcnQgY2xhc3MgS2V5IHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoYXQgdGhpcyBrZXkgaXMgYXNzb2NpYXRlZCB3aXRoICovXG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGlzIGtleSBpcyBpbiAqL1xuICByZWFkb25seSBvcmdJZDogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIGlkIG9mIHRoZSBrZXk6IFwiS2V5I1wiIGZvbGxvd2VkIGJ5IGEgdW5pcXVlIGlkZW50aWZpZXIgc3BlY2lmaWMgdG9cbiAgICogdGhlIHR5cGUgb2Yga2V5IChzdWNoIGFzIGEgcHVibGljIGtleSBmb3IgQkxTIG9yIGFuIGV0aGVyZXVtIGFkZHJlc3MgZm9yIFNlY3ApXG4gICAqIEBleGFtcGxlIEtleSMweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICogKi9cbiAgcmVhZG9ubHkgaWQ6IHN0cmluZztcblxuICAvKiogVGhlIHR5cGUgb2Yga2V5LiAqL1xuICByZWFkb25seSB0eXBlOiBLZXlUeXBlO1xuXG4gIC8qKlxuICAgKiBBIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvIHRoZSB0eXBlIG9mIGtleSwgc3VjaCBhcyBhIHB1YmxpYyBrZXkgb3IgYW4gZXRoZXJldW0gYWRkcmVzc1xuICAgKiBAZXhhbXBsZSAweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICogKi9cbiAgcmVhZG9ubHkgbWF0ZXJpYWxJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gSGV4LWVuY29kZWQsIHNlcmlhbGl6ZWQgcHVibGljIGtleS4gVGhlIGZvcm1hdCB1c2VkIGRlcGVuZHMgb24gdGhlIGtleSB0eXBlOlxuICAgKiAtIHNlY3AyNTZrMSBrZXlzIHVzZSA2NS1ieXRlIHVuY29tcHJlc3NlZCBTRUNHIGZvcm1hdFxuICAgKiAtIEJMUyBrZXlzIHVzZSA0OC1ieXRlIGNvbXByZXNzZWQgQkxTMTItMzgxIChaQ2FzaCkgZm9ybWF0XG4gICAqIEBleGFtcGxlIDB4MDRkMjY4OGI2YmMyY2U3Zjk4NzliOWU3NDVmM2M0ZGMxNzc5MDhjNWNlZjBjMWI2NGNmZjE5YWU3ZmYyN2RlZTYyM2M2NGZlOWQ5YzMyNWM3ZmJiYzc0OGJiZDVmNjA3Y2UxNGRkODNlMjhlYmJiYjdkM2U3ZjJmZmI3MGE3OTQzMVxuICAgKiAqL1xuICByZWFkb25seSBwdWJsaWNLZXk6IHN0cmluZztcblxuICAvKiogSXMgdGhlIGtleSBlbmFibGVkPyAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIGtleS4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBrZXkuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIGtleSlcbiAgICogQHBhcmFtIHtLZXlQb2xpY3l9IHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IEtleVBvbGljeSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwb2xpY3kgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgdG8gZXhpc3Rpbmcga2V5IHBvbGljeS4gVGhpcyBhcHBlbmQgaXMgbm90IGF0b21pYyAtLSBpdCB1c2VzIHtAbGluayBwb2xpY3l9IHRvIGZldGNoIHRoZSBjdXJyZW50IHBvbGljeSBhbmQgdGhlbiB7QGxpbmsgc2V0UG9saWN5fSB0byBzZXQgdGhlIHBvbGljeSAtLSBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkIGluIGFjcm9zcyBjb25jdXJyZW50IHNlc3Npb25zLlxuICAgKiBAcGFyYW0ge0tleVBvbGljeX0gcG9saWN5IFRoZSBwb2xpY3kgdG8gYXBwZW5kIHRvIHRoZSBleGlzdGluZyBvbmUuXG4gICAqL1xuICBhc3luYyBhcHBlbmRQb2xpY3kocG9saWN5OiBLZXlQb2xpY3kpIHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMucG9saWN5KCk7XG4gICAgYXdhaXQgdGhpcy5zZXRQb2xpY3koWy4uLmV4aXN0aW5nLCAuLi5wb2xpY3ldKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHJldHVybiB7UHJvbWlzZTxLZXlQb2xpY3k+fSBUaGUgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8S2V5UG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIEtleVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gT3duZXIgb2YgdGhlIGtleVxuICAgKiBAZXhhbXBsZSBVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKiAqL1xuICBhc3luYyBvd25lcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEub3duZXI7XG4gIH1cblxuICAvKiogU2V0IHRoZSBvd25lciBvZiB0aGUga2V5LiBPbmx5IHRoZSBrZXkgKG9yIG9yZykgb3duZXIgY2FuIGNoYW5nZSB0aGUgb3duZXIgb2YgdGhlIGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG93bmVyIFRoZSB1c2VyLWlkIG9mIHRoZSBuZXcgb3duZXIgb2YgdGhlIGtleS5cbiAgICogKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgb3duZXIgfSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKiBDcmVhdGUgYSBuZXcga2V5LlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSBrZXkgYmVsb25ncy5cbiAgICogQHBhcmFtIHtLZXlJbmZvfSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgb3JnSWQ6IHN0cmluZywgZGF0YTogS2V5SW5mbykge1xuICAgIHRoaXMuI2NzID0gY3M7XG4gICAgdGhpcy5vcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuaWQgPSBkYXRhLmtleV9pZDtcbiAgICB0aGlzLnR5cGUgPSBmcm9tU2NoZW1hS2V5VHlwZShkYXRhLmtleV90eXBlKTtcbiAgICB0aGlzLm1hdGVyaWFsSWQgPSBkYXRhLm1hdGVyaWFsX2lkO1xuICAgIHRoaXMucHVibGljS2V5ID0gZGF0YS5wdWJsaWNfa2V5O1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUga2V5LlxuICAgKiBAcGFyYW0ge1VwZGF0ZUtleVJlcXVlc3R9IHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZShyZXF1ZXN0OiBVcGRhdGVLZXlSZXF1ZXN0KTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBrZXlfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUga2V5IGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIG5ldyBrZXlzLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZUtleXMoXG4gICAgY3M6IEN1YmVTaWduZXIsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgb3duZXJJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGNoYWluX2lkID0gMDsgLy8gbm90IHVzZWQgYW55bW9yZVxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNvdW50LFxuICAgICAgICBjaGFpbl9pZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIG93bmVyOiBvd25lcklkIHx8IG51bGwsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhLmtleXMubWFwKChrOiBLZXlJbmZvKSA9PiBuZXcgS2V5KGNzLCBvcmdJZCwgaykpO1xuICB9XG5cbiAgLyoqIEdldCBhIGtleSBieSBpZC5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUga2V5IGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm4ge0tleX0gVGhlIGtleS5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHN0YXRpYyBhc3luYyBnZXRLZXkoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkLCBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gbmV3IEtleShjcywgb3JnSWQsIGRhdGEpO1xuICB9XG5cbiAgLyoqIEZldGNoZXMgdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICogQHJldHVybiB7S2V5SW5mb30gVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwga2V5X2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxufVxuXG4vKiogQ29udmVydCBhIHNjaGVtYSBrZXkgdHlwZSB0byBhIGtleSB0eXBlLlxuICogQHBhcmFtIHtTY2hlbWFLZXlUeXBlfSB0eSBUaGUgc2NoZW1hIGtleSB0eXBlLlxuICogQHJldHVybiB7S2V5VHlwZX0gVGhlIGtleSB0eXBlLlxuICogQGludGVybmFsXG4gKiAqL1xuZnVuY3Rpb24gZnJvbVNjaGVtYUtleVR5cGUodHk6IFNjaGVtYUtleVR5cGUpOiBLZXlUeXBlIHtcbiAgc3dpdGNoICh0eSkge1xuICAgIGNhc2UgXCJTZWNwRXRoQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5Fdm07XG4gICAgY2FzZSBcIlNlY3BCdGNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjO1xuICAgIGNhc2UgXCJTZWNwQnRjVGVzdFwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGNUZXN0O1xuICAgIGNhc2UgXCJCbHNQdWJcIjpcbiAgICAgIHJldHVybiBCTFMuRXRoMkRlcG9zaXRlZDtcbiAgICBjYXNlIFwiQmxzSW5hY3RpdmVcIjpcbiAgICAgIHJldHVybiBCTFMuRXRoMkluYWN0aXZlO1xuICAgIGNhc2UgXCJFZDI1NTE5U29sYW5hQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU29sYW5hO1xuICAgIGNhc2UgXCJFZDI1NTE5U3VpQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU3VpO1xuICAgIGNhc2UgXCJFZDI1NTE5QXB0b3NBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5BcHRvcztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGtleSB0eXBlOiAke3R5fWApO1xuICB9XG59XG4iXX0=