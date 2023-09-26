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
exports.fromSchemaKeyType = exports.Key = exports.toKeyInfo = exports.MnemonicType = exports.Ed25519 = exports.Bls = exports.Secp256k1 = void 0;
const util_1 = require("./util");
/** Secp256k1 key type */
var Secp256k1;
(function (Secp256k1) {
    Secp256k1["Evm"] = "SecpEthAddr";
    Secp256k1["Btc"] = "SecpBtc";
    Secp256k1["BtcTest"] = "SecpBtcTest";
    Secp256k1["Ava"] = "SecpAvaAddr";
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
var MnemonicType;
(function (MnemonicType) {
    MnemonicType["Mnemonic"] = "Mnemonic";
})(MnemonicType || (exports.MnemonicType = MnemonicType = {}));
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
     * @param {CubeSigner} cs The CubeSigner instance to use for key creation.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {KeyType} keyType The type of key to create.
     * @param {string[]} derivationPaths Derivation paths from which to derive new keys.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     * @param {string?} ownerId The owner of newly derived keys. Defaults to the session's user.
     *
     * @return {Key[]} The newly derived keys.
     */
    static async deriveKeys(cs, orgId, keyType, derivationPaths, mnemonicId, ownerId) {
        const resp = await (await cs.management()).put("/v0/org/{org_id}/derive_key", {
            params: { path: { org_id: orgId } },
            body: {
                derivation_path: derivationPaths,
                mnemonic_id: mnemonicId,
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
        case "Mnemonic":
            return MnemonicType.Mnemonic;
        default:
            throw new Error(`Unknown key type: ${ty}`);
    }
}
exports.fromSchemaKeyType = fromSchemaKeyType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFFbEMseUJBQXlCO0FBQ3pCLElBQVksU0FLWDtBQUxELFdBQVksU0FBUztJQUNuQixnQ0FBbUIsQ0FBQTtJQUNuQiw0QkFBZSxDQUFBO0lBQ2Ysb0NBQXVCLENBQUE7SUFDdkIsZ0NBQW1CLENBQUE7QUFDckIsQ0FBQyxFQUxXLFNBQVMseUJBQVQsU0FBUyxRQUtwQjtBQUVELG1CQUFtQjtBQUNuQixJQUFZLEdBR1g7QUFIRCxXQUFZLEdBQUc7SUFDYiwrQkFBd0IsQ0FBQTtJQUN4QixtQ0FBNEIsQ0FBQTtBQUM5QixDQUFDLEVBSFcsR0FBRyxtQkFBSCxHQUFHLFFBR2Q7QUFFRCx1QkFBdUI7QUFDdkIsSUFBWSxPQUtYO0FBTEQsV0FBWSxPQUFPO0lBQ2pCLHVDQUE0QixDQUFBO0lBQzVCLGlDQUFzQixDQUFBO0lBQ3RCLHFDQUEwQixDQUFBO0lBQzFCLDJDQUFnQyxDQUFBO0FBQ2xDLENBQUMsRUFMVyxPQUFPLHVCQUFQLE9BQU8sUUFLbEI7QUFFRCx3QkFBd0I7QUFDeEIsSUFBWSxZQUVYO0FBRkQsV0FBWSxZQUFZO0lBQ3RCLHFDQUFxQixDQUFBO0FBQ3ZCLENBQUMsRUFGVyxZQUFZLDRCQUFaLFlBQVksUUFFdkI7QUF3QkQ7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLEdBQWU7SUFDdkMsT0FBTztRQUNMLEdBQUcsR0FBRztRQUNOLEVBQUUsRUFBRSxHQUFHLENBQUMsTUFBTTtRQUNkLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUTtRQUNsQixTQUFTLEVBQUUsR0FBRyxDQUFDLFVBQVU7UUFDekIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxXQUFXO0tBQzVCLENBQUM7QUFDSixDQUFDO0FBUkQsOEJBUUM7QUFFRCxvQkFBb0I7QUFDcEIsTUFBYSxHQUFHO0lBMEJk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c291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3ViZVNpZ25lciwgS2V5UG9saWN5IH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGNvbXBvbmVudHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG4vKiogU2VjcDI1NmsxIGtleSB0eXBlICovXG5leHBvcnQgZW51bSBTZWNwMjU2azEge1xuICBFdm0gPSBcIlNlY3BFdGhBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQnRjID0gXCJTZWNwQnRjXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQnRjVGVzdCA9IFwiU2VjcEJ0Y1Rlc3RcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBBdmEgPSBcIlNlY3BBdmFBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIEJMUyBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gQmxzIHtcbiAgRXRoMkRlcG9zaXRlZCA9IFwiQmxzUHViXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMkluYWN0aXZlID0gXCJCbHNJbmFjdGl2ZVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBFZDI1NTE5IGtleSB0eXBlICovXG5leHBvcnQgZW51bSBFZDI1NTE5IHtcbiAgU29sYW5hID0gXCJFZDI1NTE5U29sYW5hQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFN1aSA9IFwiRWQyNTUxOVN1aUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBBcHRvcyA9IFwiRWQyNTUxOUFwdG9zQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIENhcmRhbm8gPSBcIkVkMjU1MTlDYXJkYW5vQWRkclZrXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIE1uZW1vbmljIGtleSB0eXBlICovXG5leHBvcnQgZW51bSBNbmVtb25pY1R5cGUge1xuICBNbmVtb25pYyA9IFwiTW5lbW9uaWNcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogS2V5IHR5cGUgKi9cbmV4cG9ydCB0eXBlIEtleVR5cGUgPSBTZWNwMjU2azEgfCBCbHMgfCBFZDI1NTE5IHwgTW5lbW9uaWNUeXBlO1xuXG4vKiogU2NoZW1hIGtleSB0eXBlIChpLmUuLCBrZXkgdHlwZSBhdCB0aGUgQVBJIGxldmVsKSAqL1xudHlwZSBTY2hlbWFLZXlUeXBlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJLZXlUeXBlXCJdO1xuXG50eXBlIFVwZGF0ZUtleVJlcXVlc3QgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlVwZGF0ZUtleVJlcXVlc3RcIl07XG50eXBlIEtleUluZm9BcGkgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIktleUluZm9cIl07XG50eXBlIEtleVR5cGVBcGkgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIktleVR5cGVcIl07XG5cbi8qKiBBZGRpdGlvbmFsIHByb3BlcnRpZXMgKGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5KSAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlJbmZvIGV4dGVuZHMgS2V5SW5mb0FwaSB7XG4gIC8qKiBBbGlhcyBmb3Iga2V5X2lkICovXG4gIGlkOiBzdHJpbmc7XG4gIC8qKiBBbGlhcyBmb3Iga2V5X3R5cGUgKi9cbiAgdHlwZTogS2V5VHlwZUFwaTtcbiAgLyoqIEFsaWFzIGZvciBtYXRlcmlhbF9pZCAqL1xuICBtYXRlcmlhbElkOiBzdHJpbmc7XG4gIC8qKiBBbGlhcyBmb3IgcHVibGljX2tleSAqL1xuICBwdWJsaWNLZXk6IHN0cmluZztcbn1cblxuLyoqXG4gKiBEZWZpbmUgc29tZSBhZGRpdGlvbmFsIChiYWNrd2FyZCBjb21wYXRpYmlsaXR5KSBwcm9wZXJ0aWVzXG4gKiBvbiBhIGBLZXlJbmZvQXBpYCBvYmplY3QgcmV0dXJuZWQgZnJvbSB0aGUgcmVtb3RlIGVuZC5cbiAqXG4gKiBAcGFyYW0ge0tleUluZm9BcGl9IGtleSBLZXkgaW5mb3JtYXRpb24gcmV0dXJuZWQgZnJvbSB0aGUgcmVtb3RlIGVuZFxuICogQHJldHVybiB7S2V5SW5mb30gVGhlIHNhbWUgYGtleWAgb2JqZWN0IGV4dGVuZGVkIHdpdGggc29tZSBkZXJpdmVkIHByb3BlcnRpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0tleUluZm8oa2V5OiBLZXlJbmZvQXBpKTogS2V5SW5mbyB7XG4gIHJldHVybiB7XG4gICAgLi4ua2V5LFxuICAgIGlkOiBrZXkua2V5X2lkLFxuICAgIHR5cGU6IGtleS5rZXlfdHlwZSxcbiAgICBwdWJsaWNLZXk6IGtleS5wdWJsaWNfa2V5LFxuICAgIG1hdGVyaWFsSWQ6IGtleS5tYXRlcmlhbF9pZCxcbiAgfTtcbn1cblxuLyoqIFNpZ25pbmcga2V5cy4gKi9cbmV4cG9ydCBjbGFzcyBLZXkge1xuICAvKiogVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdGhhdCB0aGlzIGtleSBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcmVhZG9ubHkgI2NzOiBDdWJlU2lnbmVyO1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoaXMga2V5IGlzIGluICovXG4gIHJlYWRvbmx5IG9yZ0lkOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgaWQgb2YgdGhlIGtleTogXCJLZXkjXCIgZm9sbG93ZWQgYnkgYSB1bmlxdWUgaWRlbnRpZmllciBzcGVjaWZpYyB0b1xuICAgKiB0aGUgdHlwZSBvZiBrZXkgKHN1Y2ggYXMgYSBwdWJsaWMga2V5IGZvciBCTFMgb3IgYW4gZXRoZXJldW0gYWRkcmVzcyBmb3IgU2VjcClcbiAgICogQGV4YW1wbGUgS2V5IzB4OGUzNDg0Njg3ZTY2Y2RkMjZjZjA0YzM2NDc2MzNhYjRmMzU3MDE0OFxuICAgKiAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvIHRoZSB0eXBlIG9mIGtleSwgc3VjaCBhcyBhIHB1YmxpYyBrZXkgb3IgYW4gZXRoZXJldW0gYWRkcmVzc1xuICAgKiBAZXhhbXBsZSAweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICogKi9cbiAgcmVhZG9ubHkgbWF0ZXJpYWxJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gSGV4LWVuY29kZWQsIHNlcmlhbGl6ZWQgcHVibGljIGtleS4gVGhlIGZvcm1hdCB1c2VkIGRlcGVuZHMgb24gdGhlIGtleSB0eXBlOlxuICAgKiAtIHNlY3AyNTZrMSBrZXlzIHVzZSA2NS1ieXRlIHVuY29tcHJlc3NlZCBTRUNHIGZvcm1hdFxuICAgKiAtIEJMUyBrZXlzIHVzZSA0OC1ieXRlIGNvbXByZXNzZWQgQkxTMTItMzgxIChaQ2FzaCkgZm9ybWF0XG4gICAqIEBleGFtcGxlIDB4MDRkMjY4OGI2YmMyY2U3Zjk4NzliOWU3NDVmM2M0ZGMxNzc5MDhjNWNlZjBjMWI2NGNmZjE5YWU3ZmYyN2RlZTYyM2M2NGZlOWQ5YzMyNWM3ZmJiYzc0OGJiZDVmNjA3Y2UxNGRkODNlMjhlYmJiYjdkM2U3ZjJmZmI3MGE3OTQzMVxuICAgKiAqL1xuICByZWFkb25seSBwdWJsaWNLZXk6IHN0cmluZztcblxuICAvKiogVGhlIHR5cGUgb2Yga2V5LiAqL1xuICBhc3luYyB0eXBlKCk6IFByb21pc2U8S2V5VHlwZT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGZyb21TY2hlbWFLZXlUeXBlKGRhdGEua2V5X3R5cGUpO1xuICB9XG5cbiAgLyoqIElzIHRoZSBrZXkgZW5hYmxlZD8gKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKiogRW5hYmxlIHRoZSBrZXkuICovXG4gIGFzeW5jIGVuYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUga2V5LiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBwb2xpY2llcyBwcmV2aW91c2x5IHNldCBmb3IgdGhpcyBrZXkpXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5fSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgdG8gc2V0XG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBLZXlQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHRvIGV4aXN0aW5nIGtleSBwb2xpY3kuIFRoaXMgYXBwZW5kIGlzIG5vdCBhdG9taWMgLS0gaXQgdXNlcyB7QGxpbmsgcG9saWN5fSB0byBmZXRjaCB0aGUgY3VycmVudCBwb2xpY3kgYW5kIHRoZW4ge0BsaW5rIHNldFBvbGljeX0gdG8gc2V0IHRoZSBwb2xpY3kgLS0gYW5kIHNob3VsZCBub3QgYmUgdXNlZCBpbiBhY3Jvc3MgY29uY3VycmVudCBzZXNzaW9ucy5cbiAgICogQHBhcmFtIHtLZXlQb2xpY3l9IHBvbGljeSBUaGUgcG9saWN5IHRvIGFwcGVuZCB0byB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKi9cbiAgYXN5bmMgYXBwZW5kUG9saWN5KHBvbGljeTogS2V5UG9saWN5KSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnBvbGljeSgpO1xuICAgIGF3YWl0IHRoaXMuc2V0UG9saWN5KFsuLi5leGlzdGluZywgLi4ucG9saWN5XSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8S2V5UG9saWN5Pn0gVGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICovXG4gIGFzeW5jIHBvbGljeSgpOiBQcm9taXNlPEtleVBvbGljeT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBLZXlQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIE93bmVyIG9mIHRoZSBrZXlcbiAgICogQGV4YW1wbGUgVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICogKi9cbiAgYXN5bmMgb3duZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm93bmVyO1xuICB9XG5cbiAgLyoqIFNldCB0aGUgb3duZXIgb2YgdGhlIGtleS4gT25seSB0aGUga2V5IChvciBvcmcpIG93bmVyIGNhbiBjaGFuZ2UgdGhlIG93bmVyIG9mIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvd25lciBUaGUgdXNlci1pZCBvZiB0aGUgbmV3IG93bmVyIG9mIHRoZSBrZXkuXG4gICAqICovXG4gIGFzeW5jIHNldE93bmVyKG93bmVyOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG93bmVyIH0pO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogQ3JlYXRlIGEgbmV3IGtleS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUga2V5IGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7S2V5SW5mb30gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgY29uc3RydWN0b3IoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIGRhdGE6IEtleUluZm9BcGkpIHtcbiAgICB0aGlzLiNjcyA9IGNzO1xuICAgIHRoaXMub3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLmlkID0gZGF0YS5rZXlfaWQ7XG4gICAgdGhpcy5tYXRlcmlhbElkID0gZGF0YS5tYXRlcmlhbF9pZDtcbiAgICB0aGlzLnB1YmxpY0tleSA9IGRhdGEucHVibGljX2tleTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGtleS5cbiAgICogQHBhcmFtIHtVcGRhdGVLZXlSZXF1ZXN0fSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybiB7S2V5SW5mb30gVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwga2V5X2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gdG9LZXlJbmZvKGFzc2VydE9rKHJlc3ApKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUga2V5IGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIG5ldyBrZXlzLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZUtleXMoXG4gICAgY3M6IEN1YmVTaWduZXIsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgb3duZXJJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGNoYWluX2lkID0gMDsgLy8gbm90IHVzZWQgYW55bW9yZVxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNvdW50LFxuICAgICAgICBjaGFpbl9pZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIG93bmVyOiBvd25lcklkIHx8IG51bGwsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhLmtleXMubWFwKChrKSA9PiBuZXcgS2V5KGNzLCBvcmdJZCwgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZXMgYSBrZXkgb2YgYSBzcGVjaWZpZWQgdHlwZSB1c2luZyBhIHN1cHBsaWVkIGRlcml2YXRpb24gcGF0aCBhbmQgYW4gZXhpc3RpbmcgbG9uZy1saXZlZCBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIGtleSBjcmVhdGlvbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSBrZXkgYmVsb25ncy5cbiAgICogQHBhcmFtIHtLZXlUeXBlfSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGRlcml2YXRpb25QYXRocyBEZXJpdmF0aW9uIHBhdGhzIGZyb20gd2hpY2ggdG8gZGVyaXZlIG5ldyBrZXlzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWNJZCBtYXRlcmlhbElkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiBuZXdseSBkZXJpdmVkIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICpcbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZGVyaXZlS2V5cyhcbiAgICBjczogQ3ViZVNpZ25lcixcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgb3duZXJJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLnB1dChcIi92MC9vcmcve29yZ19pZH0vZGVyaXZlX2tleVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZGVyaXZhdGlvbl9wYXRoOiBkZXJpdmF0aW9uUGF0aHMsXG4gICAgICAgIG1uZW1vbmljX2lkOiBtbmVtb25pY0lkLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgICAgb3duZXI6IG93bmVySWQgfHwgbnVsbCxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEua2V5cy5tYXAoKGspID0+IG5ldyBLZXkoY3MsIG9yZ0lkLCBrKSk7XG4gIH1cblxuICAvKiogR2V0IGEga2V5IGJ5IGlkLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSBrZXkgYmVsb25ncy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybiB7S2V5fSBUaGUga2V5LlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgc3RhdGljIGFzeW5jIGdldEtleShjczogQ3ViZVNpZ25lciwgb3JnSWQ6IHN0cmluZywga2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBuZXcgS2V5KGNzLCBvcmdJZCwgZGF0YSk7XG4gIH1cblxuICAvKiogRmV0Y2hlcyB0aGUga2V5IGluZm9ybWF0aW9uLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBrZXlfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiB0b0tleUluZm8oZGF0YSk7XG4gIH1cbn1cblxuLyoqIENvbnZlcnQgYSBzY2hlbWEga2V5IHR5cGUgdG8gYSBrZXkgdHlwZS5cbiAqIEBwYXJhbSB7U2NoZW1hS2V5VHlwZX0gdHkgVGhlIHNjaGVtYSBrZXkgdHlwZS5cbiAqIEByZXR1cm4ge0tleVR5cGV9IFRoZSBrZXkgdHlwZS5cbiAqIEBpbnRlcm5hbFxuICogKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tU2NoZW1hS2V5VHlwZSh0eTogU2NoZW1hS2V5VHlwZSk6IEtleVR5cGUge1xuICBzd2l0Y2ggKHR5KSB7XG4gICAgY2FzZSBcIlNlY3BFdGhBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkV2bTtcbiAgICBjYXNlIFwiU2VjcEJ0Y1wiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGM7XG4gICAgY2FzZSBcIlNlY3BCdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0Y1Rlc3Q7XG4gICAgY2FzZSBcIkJsc1B1YlwiOlxuICAgICAgcmV0dXJuIEJscy5FdGgyRGVwb3NpdGVkO1xuICAgIGNhc2UgXCJCbHNJbmFjdGl2ZVwiOlxuICAgICAgcmV0dXJuIEJscy5FdGgySW5hY3RpdmU7XG4gICAgY2FzZSBcIkVkMjU1MTlTb2xhbmFBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5Tb2xhbmE7XG4gICAgY2FzZSBcIkVkMjU1MTlTdWlBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5TdWk7XG4gICAgY2FzZSBcIkVkMjU1MTlBcHRvc0FkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LkFwdG9zO1xuICAgIGNhc2UgXCJFZDI1NTE5Q2FyZGFub0FkZHJWa1wiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQ2FyZGFubztcbiAgICBjYXNlIFwiTW5lbW9uaWNcIjpcbiAgICAgIHJldHVybiBNbmVtb25pY1R5cGUuTW5lbW9uaWM7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBrZXkgdHlwZTogJHt0eX1gKTtcbiAgfVxufVxuIl19