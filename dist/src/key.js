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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFFbEMseUJBQXlCO0FBQ3pCLElBQVksU0FJWDtBQUpELFdBQVksU0FBUztJQUNuQixnQ0FBbUIsQ0FBQTtJQUNuQiw0QkFBZSxDQUFBO0lBQ2Ysb0NBQXVCLENBQUE7QUFDekIsQ0FBQyxFQUpXLFNBQVMseUJBQVQsU0FBUyxRQUlwQjtBQUVELG1CQUFtQjtBQUNuQixJQUFZLEdBR1g7QUFIRCxXQUFZLEdBQUc7SUFDYiwrQkFBd0IsQ0FBQTtJQUN4QixtQ0FBNEIsQ0FBQTtBQUM5QixDQUFDLEVBSFcsR0FBRyxtQkFBSCxHQUFHLFFBR2Q7QUFFRCx1QkFBdUI7QUFDdkIsSUFBWSxPQUlYO0FBSkQsV0FBWSxPQUFPO0lBQ2pCLHVDQUE0QixDQUFBO0lBQzVCLGlDQUFzQixDQUFBO0lBQ3RCLHFDQUEwQixDQUFBO0FBQzVCLENBQUMsRUFKVyxPQUFPLHVCQUFQLE9BQU8sUUFJbEI7QUFZRCxvQkFBb0I7QUFDcEIsTUFBYSxHQUFHO0lBNkJkLDBCQUEwQjtJQUMxQixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRDs7O1NBR0s7SUFDTCxL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QixLQUFLLGdCQUFnQjtZQUNuQixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDckIsS0FBSyxrQkFBa0I7WUFDckIsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3ZCO1lBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUM5QztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdWJlU2lnbmVyIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGNvbXBvbmVudHMsIHBhdGhzIH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBhc3NlcnRPayB9IGZyb20gXCIuL3V0aWxcIjtcblxuLyoqIFNlY3AyNTZrMSBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gU2VjcDI1NmsxIHtcbiAgRXZtID0gXCJTZWNwRXRoQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEJ0YyA9IFwiU2VjcEJ0Y1wiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEJ0Y1Rlc3QgPSBcIlNlY3BCdGNUZXN0XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIEJMUyBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gQkxTIHtcbiAgRXRoMkRlcG9zaXRlZCA9IFwiQmxzUHViXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMkluYWN0aXZlID0gXCJCbHNJbmFjdGl2ZVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBFZDI1NTE5IGtleSB0eXBlICovXG5leHBvcnQgZW51bSBFZDI1NTE5IHtcbiAgU29sYW5hID0gXCJFZDI1NTE5U29sYW5hQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFN1aSA9IFwiRWQyNTUxOVN1aUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBBcHRvcyA9IFwiRWQyNTUxOUFwdG9zQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBLZXkgdHlwZSAqL1xuZXhwb3J0IHR5cGUgS2V5VHlwZSA9IFNlY3AyNTZrMSB8IEJMUyB8IEVkMjU1MTk7XG5cbi8qKiBTY2hlbWEga2V5IHR5cGUgKGkuZS4sIGtleSB0eXBlIGF0IHRoZSBBUEkgbGV2ZWwpICovXG50eXBlIFNjaGVtYUtleVR5cGUgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIktleVR5cGVcIl07XG5cbnR5cGUgVXBkYXRlS2V5UmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCJdW1wicGF0Y2hcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xudHlwZSBLZXlJbmZvID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJLZXlJbmZvXCJdO1xuXG4vKiogU2lnbmluZyBrZXlzLiAqL1xuZXhwb3J0IGNsYXNzIEtleSB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0aGF0IHRoaXMga2V5IGlzIGFzc29jaWF0ZWQgd2l0aCAqL1xuICByZWFkb25seSAjY3M6IEN1YmVTaWduZXI7XG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIHRoYXQgdGhpcyBrZXkgaXMgaW4gKi9cbiAgcmVhZG9ubHkgb3JnSWQ6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBpZCBvZiB0aGUga2V5OiBcIktleSNcIiBmb2xsb3dlZCBieSBhIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvXG4gICAqIHRoZSB0eXBlIG9mIGtleSAoc3VjaCBhcyBhIHB1YmxpYyBrZXkgZm9yIEJMUyBvciBhbiBldGhlcmV1bSBhZGRyZXNzIGZvciBTZWNwKVxuICAgKiBAZXhhbXBsZSBLZXkjMHg4ZTM0ODQ2ODdlNjZjZGQyNmNmMDRjMzY0NzYzM2FiNGYzNTcwMTQ4XG4gICAqICovXG4gIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSB0eXBlIG9mIGtleS4gKi9cbiAgcmVhZG9ubHkgdHlwZTogS2V5VHlwZTtcblxuICAvKipcbiAgICogQSB1bmlxdWUgaWRlbnRpZmllciBzcGVjaWZpYyB0byB0aGUgdHlwZSBvZiBrZXksIHN1Y2ggYXMgYSBwdWJsaWMga2V5IG9yIGFuIGV0aGVyZXVtIGFkZHJlc3NcbiAgICogQGV4YW1wbGUgMHg4ZTM0ODQ2ODdlNjZjZGQyNmNmMDRjMzY0NzYzM2FiNGYzNTcwMTQ4XG4gICAqICovXG4gIHJlYWRvbmx5IG1hdGVyaWFsSWQ6IHN0cmluZztcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIEhleC1lbmNvZGVkLCBzZXJpYWxpemVkIHB1YmxpYyBrZXkuIFRoZSBmb3JtYXQgdXNlZCBkZXBlbmRzIG9uIHRoZSBrZXkgdHlwZTpcbiAgICogLSBzZWNwMjU2azEga2V5cyB1c2UgNjUtYnl0ZSB1bmNvbXByZXNzZWQgU0VDRyBmb3JtYXRcbiAgICogLSBCTFMga2V5cyB1c2UgNDgtYnl0ZSBjb21wcmVzc2VkIEJMUzEyLTM4MSAoWkNhc2gpIGZvcm1hdFxuICAgKiBAZXhhbXBsZSAweDA0ZDI2ODhiNmJjMmNlN2Y5ODc5YjllNzQ1ZjNjNGRjMTc3OTA4YzVjZWYwYzFiNjRjZmYxOWFlN2ZmMjdkZWU2MjNjNjRmZTlkOWMzMjVjN2ZiYmM3NDhiYmQ1ZjYwN2NlMTRkZDgzZTI4ZWJiYmI3ZDNlN2YyZmZiNzBhNzk0MzFcbiAgICogKi9cbiAgcmVhZG9ubHkgcHVibGljS2V5OiBzdHJpbmc7XG5cbiAgLyoqIElzIHRoZSBrZXkgZW5hYmxlZD8gKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKiogRW5hYmxlIHRoZSBrZXkuICovXG4gIGFzeW5jIGVuYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUga2V5LiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIE93bmVyIG9mIHRoZSBrZXlcbiAgICogQGV4YW1wbGUgVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICogKi9cbiAgYXN5bmMgb3duZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm93bmVyO1xuICB9XG5cbiAgLyoqIFNldCB0aGUgb3duZXIgb2YgdGhlIGtleS4gT25seSB0aGUga2V5IChvciBvcmcpIG93bmVyIGNhbiBjaGFuZ2UgdGhlIG93bmVyIG9mIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvd25lciBUaGUgdXNlci1pZCBvZiB0aGUgbmV3IG93bmVyIG9mIHRoZSBrZXkuXG4gICAqICovXG4gIGFzeW5jIHNldE93bmVyKG93bmVyOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG93bmVyIH0pO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogQ3JlYXRlIGEgbmV3IGtleS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUga2V5IGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7S2V5SW5mb30gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgY29uc3RydWN0b3IoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIGRhdGE6IEtleUluZm8pIHtcbiAgICB0aGlzLiNjcyA9IGNzO1xuICAgIHRoaXMub3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLmlkID0gZGF0YS5rZXlfaWQ7XG4gICAgdGhpcy50eXBlID0gZnJvbVNjaGVtYUtleVR5cGUoZGF0YS5rZXlfdHlwZSk7XG4gICAgdGhpcy5tYXRlcmlhbElkID0gZGF0YS5tYXRlcmlhbF9pZDtcbiAgICB0aGlzLnB1YmxpY0tleSA9IGRhdGEucHVibGljX2tleTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGtleS5cbiAgICogQHBhcmFtIHtVcGRhdGVLZXlSZXF1ZXN0fSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybiB7S2V5SW5mb30gVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwga2V5X2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKiogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIGtleSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVLZXlzKFxuICAgIGNzOiBDdWJlU2lnbmVyLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBjaGFpbl9pZCA9IDA7IC8vIG5vdCB1c2VkIGFueW1vcmVcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBjb3VudCxcbiAgICAgICAgY2hhaW5faWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICBvd25lcjogb3duZXJJZCB8fCBudWxsLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YS5rZXlzLm1hcCgoazogS2V5SW5mbykgPT4gbmV3IEtleShjcywgb3JnSWQsIGspKTtcbiAgfVxuXG4gIC8qKiBHZXQgYSBrZXkgYnkgaWQuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIGtleSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJuIHtLZXl9IFRoZSBrZXkuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0S2V5KGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCBrZXlJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIG5ldyBLZXkoY3MsIG9yZ0lkLCBkYXRhKTtcbiAgfVxuXG4gIC8qKiBGZXRjaGVzIHRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqIEByZXR1cm4ge0tleUluZm99IFRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDogdGhpcy5pZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cbn1cblxuLyoqIENvbnZlcnQgYSBzY2hlbWEga2V5IHR5cGUgdG8gYSBrZXkgdHlwZS5cbiAqIEBwYXJhbSB7U2NoZW1hS2V5VHlwZX0gdHkgVGhlIHNjaGVtYSBrZXkgdHlwZS5cbiAqIEByZXR1cm4ge0tleVR5cGV9IFRoZSBrZXkgdHlwZS5cbiAqIEBpbnRlcm5hbFxuICogKi9cbmZ1bmN0aW9uIGZyb21TY2hlbWFLZXlUeXBlKHR5OiBTY2hlbWFLZXlUeXBlKTogS2V5VHlwZSB7XG4gIHN3aXRjaCAodHkpIHtcbiAgICBjYXNlIFwiU2VjcEV0aEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuRXZtO1xuICAgIGNhc2UgXCJTZWNwQnRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0YztcbiAgICBjYXNlIFwiU2VjcEJ0Y1Rlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjVGVzdDtcbiAgICBjYXNlIFwiQmxzUHViXCI6XG4gICAgICByZXR1cm4gQkxTLkV0aDJEZXBvc2l0ZWQ7XG4gICAgY2FzZSBcIkJsc0luYWN0aXZlXCI6XG4gICAgICByZXR1cm4gQkxTLkV0aDJJbmFjdGl2ZTtcbiAgICBjYXNlIFwiRWQyNTUxOVNvbGFuYUFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlNvbGFuYTtcbiAgICBjYXNlIFwiRWQyNTUxOVN1aUFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlN1aTtcbiAgICBjYXNlIFwiRWQyNTUxOUFwdG9zQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQXB0b3M7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBrZXkgdHlwZTogJHt0eX1gKTtcbiAgfVxufVxuIl19