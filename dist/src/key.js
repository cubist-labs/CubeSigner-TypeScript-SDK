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
var _Key_cs;
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromSchemaKeyType = exports.Key = exports.toKeyInfo = exports.Stark = exports.Mnemonic = exports.Ed25519 = exports.Bls = exports.Secp256k1 = void 0;
const util_1 = require("./util");
/** Secp256k1 key type */
var Secp256k1;
(function (Secp256k1) {
    Secp256k1["Evm"] = "SecpEthAddr";
    Secp256k1["Btc"] = "SecpBtc";
    Secp256k1["BtcTest"] = "SecpBtcTest";
    Secp256k1["Ava"] = "SecpAvaAddr";
    Secp256k1["AvaTest"] = "SecpAvaTestAddr";
})(Secp256k1 || (exports.Secp256k1 = Secp256k1 = {}));
/** BLS key type */
var Bls;
(function (Bls) {
    Bls["Eth2Deposited"] = "BlsPub";
    Bls["Eth2Inactive"] = "BlsInactive";
})(Bls || (exports.Bls = Bls = {}));
/** Ed25519 key type */
var Ed25519;
(function (Ed25519) {
    Ed25519["Solana"] = "Ed25519SolanaAddr";
    Ed25519["Sui"] = "Ed25519SuiAddr";
    Ed25519["Aptos"] = "Ed25519AptosAddr";
    Ed25519["Cardano"] = "Ed25519CardanoAddrVk";
})(Ed25519 || (exports.Ed25519 = Ed25519 = {}));
/** Mnemonic key type */
exports.Mnemonic = "Mnemonic";
/** Stark key type */
exports.Stark = "Stark";
/**
 * Define some additional (backward compatibility) properties
 * on a `KeyInfoApi` object returned from the remote end.
 *
 * @param {KeyInfoApi} key Key information returned from the remote end
 * @return {KeyInfo} The same `key` object extended with some derived properties.
 */
function toKeyInfo(key) {
    return {
        ...key,
        id: key.key_id,
        type: key.key_type,
        publicKey: key.public_key,
        materialId: key.material_id,
    };
}
exports.toKeyInfo = toKeyInfo;
/** Signing keys. */
class Key {
    /** The type of key. */
    async type() {
        const data = await this.fetch();
        return fromSchemaKeyType(data.key_type);
    }
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
    /**
     * Delete this key.
     */
    async delete() {
        await __classPrivateFieldGet(this, _Key_cs, "f").deleteKey(this.orgId, this.id);
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
        return toKeyInfo((0, util_1.assertOk)(resp));
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
    /**
     * Derives a key of a specified type using a supplied derivation path and an existing long-lived mnemonic.
     *
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {CubeSigner} cs The CubeSigner instance to use for key creation.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {KeyType} keyType The type of key to create.
     * @param {string[]} derivationPaths Derivation paths from which to derive new keys.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key[]} The newly derived keys.
     */
    static async deriveKeys(cs, orgId, keyType, derivationPaths, mnemonicId) {
        const resp = await (await cs.management()).put("/v0/org/{org_id}/derive_key", {
            params: { path: { org_id: orgId } },
            body: {
                derivation_path: derivationPaths,
                mnemonic_id: mnemonicId,
                key_type: keyType,
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
        return toKeyInfo(data);
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
        case "SecpAvaAddr":
            return Secp256k1.Ava;
        case "SecpAvaTestAddr":
            return Secp256k1.AvaTest;
        case "BlsPub":
            return Bls.Eth2Deposited;
        case "BlsInactive":
            return Bls.Eth2Inactive;
        case "Ed25519SolanaAddr":
            return Ed25519.Solana;
        case "Ed25519SuiAddr":
            return Ed25519.Sui;
        case "Ed25519AptosAddr":
            return Ed25519.Aptos;
        case "Ed25519CardanoAddrVk":
            return Ed25519.Cardano;
        case "Stark":
            return exports.Stark;
        case "Mnemonic":
            return exports.Mnemonic;
    }
}
exports.fromSchemaKeyType = fromSchemaKeyType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFFbEMseUJBQXlCO0FBQ3pCLElBQVksU0FNWDtBQU5ELFdBQVksU0FBUztJQUNuQixnQ0FBbUIsQ0FBQTtJQUNuQiw0QkFBZSxDQUFBO0lBQ2Ysb0NBQXVCLENBQUE7SUFDdkIsZ0NBQW1CLENBQUE7SUFDbkIsd0NBQTJCLENBQUE7QUFDN0IsQ0FBQyxFQU5XLFNBQVMseUJBQVQsU0FBUyxRQU1wQjtBQUVELG1CQUFtQjtBQUNuQixJQUFZLEdBR1g7QUFIRCxXQUFZLEdBQUc7SUFDYiwrQkFBd0IsQ0FBQTtJQUN4QixtQ0FBNEIsQ0FBQTtBQUM5QixDQUFDLEVBSFcsR0FBRyxtQkFBSCxHQUFHLFFBR2Q7QUFFRCx1QkFBdUI7QUFDdkIsSUFBWSxPQUtYO0FBTEQsV0FBWSxPQUFPO0lBQ2pCLHVDQUE0QixDQUFBO0lBQzVCLGlDQUFzQixDQUFBO0lBQ3RCLHFDQUEwQixDQUFBO0lBQzFCLDJDQUFnQyxDQUFBO0FBQ2xDLENBQUMsRUFMVyxPQUFPLHVCQUFQLE9BQU8sUUFLbEI7QUFFRCx3QkFBd0I7QUFDWCxRQUFBLFFBQVEsR0FBRyxVQUFtQixDQUFDO0FBRzVDLHFCQUFxQjtBQUNSLFFBQUEsS0FBSyxHQUFHLE9BQWdCLENBQUM7QUF5QnRDOzs7Ozs7R0FNRztBQUNILFNBQWdCLFNBQVMsQ0FBQyxHQUFlO0lBQ3ZDLE9BQU87UUFDTCxHQUFHLEdBQUc7UUFDTixFQUFFLEVBQUUsR0FBRyxDQUFDLE1BQU07UUFDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVE7UUFDbEIsU0FBUyxFQUFFLEdBQUcsQ0FBQyxVQUFVO1FBQ3pCLFVBQVUsRUFBRSxHQUFHLENBQUMsV0FBVztLQUM1QixDQUFDO0FBQ0osQ0FBQztBQVJELDhCQVFDO0FBRUQsb0JBQW9CO0FBQ3BCLE1BQWEsR0FB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QUFDO1FBQ3ZCLEtBQUssc0JBQXNCO1lBQ3pCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUN6QixLQUFLLE9BQU87WUFDVixPQUFPLGFBQUssQ0FBQztRQUNmLEtBQUssVUFBVTtZQUNiLE9BQU8sZ0JBQVEsQ0FBQztLQUNuQjtBQUNILENBQUM7QUE3QkQsOENBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3ViZVNpZ25lciwgS2V5UG9saWN5IH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGNvbXBvbmVudHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG4vKiogU2VjcDI1NmsxIGtleSB0eXBlICovXG5leHBvcnQgZW51bSBTZWNwMjU2azEge1xuICBFdm0gPSBcIlNlY3BFdGhBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQnRjID0gXCJTZWNwQnRjXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQnRjVGVzdCA9IFwiU2VjcEJ0Y1Rlc3RcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBBdmEgPSBcIlNlY3BBdmFBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQXZhVGVzdCA9IFwiU2VjcEF2YVRlc3RBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIEJMUyBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gQmxzIHtcbiAgRXRoMkRlcG9zaXRlZCA9IFwiQmxzUHViXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMkluYWN0aXZlID0gXCJCbHNJbmFjdGl2ZVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBFZDI1NTE5IGtleSB0eXBlICovXG5leHBvcnQgZW51bSBFZDI1NTE5IHtcbiAgU29sYW5hID0gXCJFZDI1NTE5U29sYW5hQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFN1aSA9IFwiRWQyNTUxOVN1aUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBBcHRvcyA9IFwiRWQyNTUxOUFwdG9zQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIENhcmRhbm8gPSBcIkVkMjU1MTlDYXJkYW5vQWRkclZrXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIE1uZW1vbmljIGtleSB0eXBlICovXG5leHBvcnQgY29uc3QgTW5lbW9uaWMgPSBcIk1uZW1vbmljXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBNbmVtb25pYyA9IHR5cGVvZiBNbmVtb25pYztcblxuLyoqIFN0YXJrIGtleSB0eXBlICovXG5leHBvcnQgY29uc3QgU3RhcmsgPSBcIlN0YXJrXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBTdGFyayA9IHR5cGVvZiBTdGFyaztcblxuLyoqIEtleSB0eXBlICovXG5leHBvcnQgdHlwZSBLZXlUeXBlID0gU2VjcDI1NmsxIHwgQmxzIHwgRWQyNTUxOSB8IE1uZW1vbmljIHwgU3Rhcms7XG5cbi8qKiBTY2hlbWEga2V5IHR5cGUgKGkuZS4sIGtleSB0eXBlIGF0IHRoZSBBUEkgbGV2ZWwpICovXG50eXBlIFNjaGVtYUtleVR5cGUgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIktleVR5cGVcIl07XG5cbnR5cGUgVXBkYXRlS2V5UmVxdWVzdCA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiVXBkYXRlS2V5UmVxdWVzdFwiXTtcbnR5cGUgS2V5SW5mb0FwaSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiS2V5SW5mb1wiXTtcbnR5cGUgS2V5VHlwZUFwaSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiS2V5VHlwZVwiXTtcblxuLyoqIEFkZGl0aW9uYWwgcHJvcGVydGllcyAoZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkpICovXG5leHBvcnQgaW50ZXJmYWNlIEtleUluZm8gZXh0ZW5kcyBLZXlJbmZvQXBpIHtcbiAgLyoqIEFsaWFzIGZvciBrZXlfaWQgKi9cbiAgaWQ6IHN0cmluZztcbiAgLyoqIEFsaWFzIGZvciBrZXlfdHlwZSAqL1xuICB0eXBlOiBLZXlUeXBlQXBpO1xuICAvKiogQWxpYXMgZm9yIG1hdGVyaWFsX2lkICovXG4gIG1hdGVyaWFsSWQ6IHN0cmluZztcbiAgLyoqIEFsaWFzIGZvciBwdWJsaWNfa2V5ICovXG4gIHB1YmxpY0tleTogc3RyaW5nO1xufVxuXG4vKipcbiAqIERlZmluZSBzb21lIGFkZGl0aW9uYWwgKGJhY2t3YXJkIGNvbXBhdGliaWxpdHkpIHByb3BlcnRpZXNcbiAqIG9uIGEgYEtleUluZm9BcGlgIG9iamVjdCByZXR1cm5lZCBmcm9tIHRoZSByZW1vdGUgZW5kLlxuICpcbiAqIEBwYXJhbSB7S2V5SW5mb0FwaX0ga2V5IEtleSBpbmZvcm1hdGlvbiByZXR1cm5lZCBmcm9tIHRoZSByZW1vdGUgZW5kXG4gKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUgc2FtZSBga2V5YCBvYmplY3QgZXh0ZW5kZWQgd2l0aCBzb21lIGRlcml2ZWQgcHJvcGVydGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvS2V5SW5mbyhrZXk6IEtleUluZm9BcGkpOiBLZXlJbmZvIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5rZXksXG4gICAgaWQ6IGtleS5rZXlfaWQsXG4gICAgdHlwZToga2V5LmtleV90eXBlLFxuICAgIHB1YmxpY0tleToga2V5LnB1YmxpY19rZXksXG4gICAgbWF0ZXJpYWxJZDoga2V5Lm1hdGVyaWFsX2lkLFxuICB9O1xufVxuXG4vKiogU2lnbmluZyBrZXlzLiAqL1xuZXhwb3J0IGNsYXNzIEtleSB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0aGF0IHRoaXMga2V5IGlzIGFzc29jaWF0ZWQgd2l0aCAqL1xuICByZWFkb25seSAjY3M6IEN1YmVTaWduZXI7XG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIHRoYXQgdGhpcyBrZXkgaXMgaW4gKi9cbiAgcmVhZG9ubHkgb3JnSWQ6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBpZCBvZiB0aGUga2V5OiBcIktleSNcIiBmb2xsb3dlZCBieSBhIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvXG4gICAqIHRoZSB0eXBlIG9mIGtleSAoc3VjaCBhcyBhIHB1YmxpYyBrZXkgZm9yIEJMUyBvciBhbiBldGhlcmV1bSBhZGRyZXNzIGZvciBTZWNwKVxuICAgKiBAZXhhbXBsZSBLZXkjMHg4ZTM0ODQ2ODdlNjZjZGQyNmNmMDRjMzY0NzYzM2FiNGYzNTcwMTQ4XG4gICAqICovXG4gIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEEgdW5pcXVlIGlkZW50aWZpZXIgc3BlY2lmaWMgdG8gdGhlIHR5cGUgb2Yga2V5LCBzdWNoIGFzIGEgcHVibGljIGtleSBvciBhbiBldGhlcmV1bSBhZGRyZXNzXG4gICAqIEBleGFtcGxlIDB4OGUzNDg0Njg3ZTY2Y2RkMjZjZjA0YzM2NDc2MzNhYjRmMzU3MDE0OFxuICAgKiAqL1xuICByZWFkb25seSBtYXRlcmlhbElkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBIZXgtZW5jb2RlZCwgc2VyaWFsaXplZCBwdWJsaWMga2V5LiBUaGUgZm9ybWF0IHVzZWQgZGVwZW5kcyBvbiB0aGUga2V5IHR5cGU6XG4gICAqIC0gc2VjcDI1NmsxIGtleXMgdXNlIDY1LWJ5dGUgdW5jb21wcmVzc2VkIFNFQ0cgZm9ybWF0XG4gICAqIC0gQkxTIGtleXMgdXNlIDQ4LWJ5dGUgY29tcHJlc3NlZCBCTFMxMi0zODEgKFpDYXNoKSBmb3JtYXRcbiAgICogQGV4YW1wbGUgMHgwNGQyNjg4YjZiYzJjZTdmOTg3OWI5ZTc0NWYzYzRkYzE3NzkwOGM1Y2VmMGMxYjY0Y2ZmMTlhZTdmZjI3ZGVlNjIzYzY0ZmU5ZDljMzI1YzdmYmJjNzQ4YmJkNWY2MDdjZTE0ZGQ4M2UyOGViYmJiN2QzZTdmMmZmYjcwYTc5NDMxXG4gICAqICovXG4gIHJlYWRvbmx5IHB1YmxpY0tleTogc3RyaW5nO1xuXG4gIC8qKiBUaGUgdHlwZSBvZiBrZXkuICovXG4gIGFzeW5jIHR5cGUoKTogUHJvbWlzZTxLZXlUeXBlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZnJvbVNjaGVtYUtleVR5cGUoZGF0YS5rZXlfdHlwZSk7XG4gIH1cblxuICAvKiogSXMgdGhlIGtleSBlbmFibGVkPyAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIGtleS4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBrZXkuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIGtleSlcbiAgICogQHBhcmFtIHtLZXlQb2xpY3l9IHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IEtleVBvbGljeSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwb2xpY3kgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgdG8gZXhpc3Rpbmcga2V5IHBvbGljeS4gVGhpcyBhcHBlbmQgaXMgbm90IGF0b21pYyAtLSBpdCB1c2VzIHtAbGluayBwb2xpY3l9IHRvIGZldGNoIHRoZSBjdXJyZW50IHBvbGljeSBhbmQgdGhlbiB7QGxpbmsgc2V0UG9saWN5fSB0byBzZXQgdGhlIHBvbGljeSAtLSBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkIGluIGFjcm9zcyBjb25jdXJyZW50IHNlc3Npb25zLlxuICAgKiBAcGFyYW0ge0tleVBvbGljeX0gcG9saWN5IFRoZSBwb2xpY3kgdG8gYXBwZW5kIHRvIHRoZSBleGlzdGluZyBvbmUuXG4gICAqL1xuICBhc3luYyBhcHBlbmRQb2xpY3kocG9saWN5OiBLZXlQb2xpY3kpIHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMucG9saWN5KCk7XG4gICAgYXdhaXQgdGhpcy5zZXRQb2xpY3koWy4uLmV4aXN0aW5nLCAuLi5wb2xpY3ldKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHJldHVybiB7UHJvbWlzZTxLZXlQb2xpY3k+fSBUaGUgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8S2V5UG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIEtleVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gT3duZXIgb2YgdGhlIGtleVxuICAgKiBAZXhhbXBsZSBVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKiAqL1xuICBhc3luYyBvd25lcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEub3duZXI7XG4gIH1cblxuICAvKiogU2V0IHRoZSBvd25lciBvZiB0aGUga2V5LiBPbmx5IHRoZSBrZXkgKG9yIG9yZykgb3duZXIgY2FuIGNoYW5nZSB0aGUgb3duZXIgb2YgdGhlIGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG93bmVyIFRoZSB1c2VyLWlkIG9mIHRoZSBuZXcgb3duZXIgb2YgdGhlIGtleS5cbiAgICogKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgb3duZXIgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoaXMga2V5LlxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKCkge1xuICAgIGF3YWl0IHRoaXMuI2NzLmRlbGV0ZUtleSh0aGlzLm9yZ0lkLCB0aGlzLmlkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqIENyZWF0ZSBhIG5ldyBrZXkuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIGtleSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge0tleUluZm99IGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCBkYXRhOiBLZXlJbmZvQXBpKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLm9yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy5pZCA9IGRhdGEua2V5X2lkO1xuICAgIHRoaXMubWF0ZXJpYWxJZCA9IGRhdGEubWF0ZXJpYWxfaWQ7XG4gICAgdGhpcy5wdWJsaWNLZXkgPSBkYXRhLnB1YmxpY19rZXk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7VXBkYXRlS2V5UmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge0tleUluZm99IFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZUtleVJlcXVlc3QpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5wYXRjaChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDogdGhpcy5pZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRvS2V5SW5mbyhhc3NlcnRPayhyZXNwKSk7XG4gIH1cblxuICAvKiogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIGtleSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVLZXlzKFxuICAgIGNzOiBDdWJlU2lnbmVyLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBjaGFpbl9pZCA9IDA7IC8vIG5vdCB1c2VkIGFueW1vcmVcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBjb3VudCxcbiAgICAgICAgY2hhaW5faWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICBvd25lcjogb3duZXJJZCB8fCBudWxsLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YS5rZXlzLm1hcCgoaykgPT4gbmV3IEtleShjcywgb3JnSWQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmVzIGEga2V5IG9mIGEgc3BlY2lmaWVkIHR5cGUgdXNpbmcgYSBzdXBwbGllZCBkZXJpdmF0aW9uIHBhdGggYW5kIGFuIGV4aXN0aW5nIGxvbmctbGl2ZWQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXkgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Iga2V5IGNyZWF0aW9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIGtleSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gZGVyaXZhdGlvblBhdGhzIERlcml2YXRpb24gcGF0aHMgZnJvbSB3aGljaCB0byBkZXJpdmUgbmV3IGtleXMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtbmVtb25pY0lkIG1hdGVyaWFsSWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBkZXJpdmVLZXlzKFxuICAgIGNzOiBDdWJlU2lnbmVyLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLnB1dChcIi92MC9vcmcve29yZ19pZH0vZGVyaXZlX2tleVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZGVyaXZhdGlvbl9wYXRoOiBkZXJpdmF0aW9uUGF0aHMsXG4gICAgICAgIG1uZW1vbmljX2lkOiBtbmVtb25pY0lkLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEua2V5cy5tYXAoKGspID0+IG5ldyBLZXkoY3MsIG9yZ0lkLCBrKSk7XG4gIH1cblxuICAvKiogR2V0IGEga2V5IGJ5IGlkLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSBrZXkgYmVsb25ncy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybiB7S2V5fSBUaGUga2V5LlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgc3RhdGljIGFzeW5jIGdldEtleShjczogQ3ViZVNpZ25lciwgb3JnSWQ6IHN0cmluZywga2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBuZXcgS2V5KGNzLCBvcmdJZCwgZGF0YSk7XG4gIH1cblxuICAvKiogRmV0Y2hlcyB0aGUga2V5IGluZm9ybWF0aW9uLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBrZXlfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiB0b0tleUluZm8oZGF0YSk7XG4gIH1cbn1cblxuLyoqIENvbnZlcnQgYSBzY2hlbWEga2V5IHR5cGUgdG8gYSBrZXkgdHlwZS5cbiAqIEBwYXJhbSB7U2NoZW1hS2V5VHlwZX0gdHkgVGhlIHNjaGVtYSBrZXkgdHlwZS5cbiAqIEByZXR1cm4ge0tleVR5cGV9IFRoZSBrZXkgdHlwZS5cbiAqIEBpbnRlcm5hbFxuICogKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tU2NoZW1hS2V5VHlwZSh0eTogU2NoZW1hS2V5VHlwZSk6IEtleVR5cGUge1xuICBzd2l0Y2ggKHR5KSB7XG4gICAgY2FzZSBcIlNlY3BFdGhBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkV2bTtcbiAgICBjYXNlIFwiU2VjcEJ0Y1wiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGM7XG4gICAgY2FzZSBcIlNlY3BCdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0Y1Rlc3Q7XG4gICAgY2FzZSBcIlNlY3BBdmFBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YTtcbiAgICBjYXNlIFwiU2VjcEF2YVRlc3RBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YVRlc3Q7XG4gICAgY2FzZSBcIkJsc1B1YlwiOlxuICAgICAgcmV0dXJuIEJscy5FdGgyRGVwb3NpdGVkO1xuICAgIGNhc2UgXCJCbHNJbmFjdGl2ZVwiOlxuICAgICAgcmV0dXJuIEJscy5FdGgySW5hY3RpdmU7XG4gICAgY2FzZSBcIkVkMjU1MTlTb2xhbmFBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5Tb2xhbmE7XG4gICAgY2FzZSBcIkVkMjU1MTlTdWlBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5TdWk7XG4gICAgY2FzZSBcIkVkMjU1MTlBcHRvc0FkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LkFwdG9zO1xuICAgIGNhc2UgXCJFZDI1NTE5Q2FyZGFub0FkZHJWa1wiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQ2FyZGFubztcbiAgICBjYXNlIFwiU3RhcmtcIjpcbiAgICAgIHJldHVybiBTdGFyaztcbiAgICBjYXNlIFwiTW5lbW9uaWNcIjpcbiAgICAgIHJldHVybiBNbmVtb25pYztcbiAgfVxufVxuIl19