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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFFbEMseUJBQXlCO0FBQ3pCLElBQVksU0FNWDtBQU5ELFdBQVksU0FBUztJQUNuQixnQ0FBbUIsQ0FBQTtJQUNuQiw0QkFBZSxDQUFBO0lBQ2Ysb0NBQXVCLENBQUE7SUFDdkIsZ0NBQW1CLENBQUE7SUFDbkIsd0NBQTJCLENBQUE7QUFDN0IsQ0FBQyxFQU5XLFNBQVMseUJBQVQsU0FBUyxRQU1wQjtBQUVELG1CQUFtQjtBQUNuQixJQUFZLEdBR1g7QUFIRCxXQUFZLEdBQUc7SUFDYiwrQkFBd0IsQ0FBQTtJQUN4QixtQ0FBNEIsQ0FBQTtBQUM5QixDQUFDLEVBSFcsR0FBRyxtQkFBSCxHQUFHLFFBR2Q7QUFFRCx1QkFBdUI7QUFDdkIsSUFBWSxPQUtYO0FBTEQsV0FBWSxPQUFPO0lBQ2pCLHVDQUE0QixDQUFBO0lBQzVCLGlDQUFzQixDQUFBO0lBQ3RCLHFDQUEwQixDQUFBO0lBQzFCLDJDQUFnQyxDQUFBO0FBQ2xDLENBQUMsRUFMVyxPQUFPLHVCQUFQLE9BQU8sUUFLbEI7QUFFRCx3QkFBd0I7QUFDWCxRQUFBLFFBQVEsR0FBRyxVQUFtQixDQUFDO0FBRzVDLHFCQUFxQjtBQUNSLFFBQUEsS0FBSyxHQUFHLE9BQWdCLENBQUM7QUF5QnRDOzs7Ozs7R0FNRztBQUNILFNBQWdCLFNBQVMsQ0FBQyxHQUFlO0lBQ3ZDLE9BQU87UUFDTCxHQUFHLEdBQUc7UUFDTixFQUFFLEVBQUUsR0FBRyxDQUFDLE1BQU07UUFDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVE7UUFDbEIsU0FBUyxFQUFFLEdBQUcsQ0FBQyxVQUFVO1FBQ3pCLFVBQVUsRUFBRSxHQUFHLENBQUMsV0FBVztLQUM1QixDQUFDO0FBQ0osQ0FBQztBQVJELDhCQVFDO0FBRUQsb0JBQW9CO0FBQ3BCLE1BQWEsR0FB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QUFDO1FBQ2YsS0FBSyxVQUFVO1lBQ2IsT0FBTyxnQkFBUSxDQUFDO0tBQ25CO0FBQ0gsQ0FBQztBQTdCRCw4Q0E2QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdWJlU2lnbmVyLCBLZXlQb2xpY3kgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi91dGlsXCI7XG5cbi8qKiBTZWNwMjU2azEga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIFNlY3AyNTZrMSB7XG4gIEV2bSA9IFwiU2VjcEV0aEFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGMgPSBcIlNlY3BCdGNcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGNUZXN0ID0gXCJTZWNwQnRjVGVzdFwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEF2YSA9IFwiU2VjcEF2YUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBBdmFUZXN0ID0gXCJTZWNwQXZhVGVzdEFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogQkxTIGtleSB0eXBlICovXG5leHBvcnQgZW51bSBCbHMge1xuICBFdGgyRGVwb3NpdGVkID0gXCJCbHNQdWJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBFdGgySW5hY3RpdmUgPSBcIkJsc0luYWN0aXZlXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIEVkMjU1MTkga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIEVkMjU1MTkge1xuICBTb2xhbmEgPSBcIkVkMjU1MTlTb2xhbmFBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgU3VpID0gXCJFZDI1NTE5U3VpQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEFwdG9zID0gXCJFZDI1NTE5QXB0b3NBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQ2FyZGFubyA9IFwiRWQyNTUxOUNhcmRhbm9BZGRyVmtcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogTW5lbW9uaWMga2V5IHR5cGUgKi9cbmV4cG9ydCBjb25zdCBNbmVtb25pYyA9IFwiTW5lbW9uaWNcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIE1uZW1vbmljID0gdHlwZW9mIE1uZW1vbmljO1xuXG4vKiogU3Rhcmsga2V5IHR5cGUgKi9cbmV4cG9ydCBjb25zdCBTdGFyayA9IFwiU3RhcmtcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIFN0YXJrID0gdHlwZW9mIFN0YXJrO1xuXG4vKiogS2V5IHR5cGUgKi9cbmV4cG9ydCB0eXBlIEtleVR5cGUgPSBTZWNwMjU2azEgfCBCbHMgfCBFZDI1NTE5IHwgTW5lbW9uaWMgfCBTdGFyaztcblxuLyoqIFNjaGVtYSBrZXkgdHlwZSAoaS5lLiwga2V5IHR5cGUgYXQgdGhlIEFQSSBsZXZlbCkgKi9cbnR5cGUgU2NoZW1hS2V5VHlwZSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiS2V5VHlwZVwiXTtcblxudHlwZSBVcGRhdGVLZXlSZXF1ZXN0ID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJVcGRhdGVLZXlSZXF1ZXN0XCJdO1xudHlwZSBLZXlJbmZvQXBpID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJLZXlJbmZvXCJdO1xudHlwZSBLZXlUeXBlQXBpID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJLZXlUeXBlXCJdO1xuXG4vKiogQWRkaXRpb25hbCBwcm9wZXJ0aWVzIChmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSkgKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5SW5mbyBleHRlbmRzIEtleUluZm9BcGkge1xuICAvKiogQWxpYXMgZm9yIGtleV9pZCAqL1xuICBpZDogc3RyaW5nO1xuICAvKiogQWxpYXMgZm9yIGtleV90eXBlICovXG4gIHR5cGU6IEtleVR5cGVBcGk7XG4gIC8qKiBBbGlhcyBmb3IgbWF0ZXJpYWxfaWQgKi9cbiAgbWF0ZXJpYWxJZDogc3RyaW5nO1xuICAvKiogQWxpYXMgZm9yIHB1YmxpY19rZXkgKi9cbiAgcHVibGljS2V5OiBzdHJpbmc7XG59XG5cbi8qKlxuICogRGVmaW5lIHNvbWUgYWRkaXRpb25hbCAoYmFja3dhcmQgY29tcGF0aWJpbGl0eSkgcHJvcGVydGllc1xuICogb24gYSBgS2V5SW5mb0FwaWAgb2JqZWN0IHJldHVybmVkIGZyb20gdGhlIHJlbW90ZSBlbmQuXG4gKlxuICogQHBhcmFtIHtLZXlJbmZvQXBpfSBrZXkgS2V5IGluZm9ybWF0aW9uIHJldHVybmVkIGZyb20gdGhlIHJlbW90ZSBlbmRcbiAqIEByZXR1cm4ge0tleUluZm99IFRoZSBzYW1lIGBrZXlgIG9iamVjdCBleHRlbmRlZCB3aXRoIHNvbWUgZGVyaXZlZCBwcm9wZXJ0aWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9LZXlJbmZvKGtleTogS2V5SW5mb0FwaSk6IEtleUluZm8ge1xuICByZXR1cm4ge1xuICAgIC4uLmtleSxcbiAgICBpZDoga2V5LmtleV9pZCxcbiAgICB0eXBlOiBrZXkua2V5X3R5cGUsXG4gICAgcHVibGljS2V5OiBrZXkucHVibGljX2tleSxcbiAgICBtYXRlcmlhbElkOiBrZXkubWF0ZXJpYWxfaWQsXG4gIH07XG59XG5cbi8qKiBTaWduaW5nIGtleXMuICovXG5leHBvcnQgY2xhc3MgS2V5IHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoYXQgdGhpcyBrZXkgaXMgYXNzb2NpYXRlZCB3aXRoICovXG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGlzIGtleSBpcyBpbiAqL1xuICByZWFkb25seSBvcmdJZDogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIGlkIG9mIHRoZSBrZXk6IFwiS2V5I1wiIGZvbGxvd2VkIGJ5IGEgdW5pcXVlIGlkZW50aWZpZXIgc3BlY2lmaWMgdG9cbiAgICogdGhlIHR5cGUgb2Yga2V5IChzdWNoIGFzIGEgcHVibGljIGtleSBmb3IgQkxTIG9yIGFuIGV0aGVyZXVtIGFkZHJlc3MgZm9yIFNlY3ApXG4gICAqIEBleGFtcGxlIEtleSMweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICogKi9cbiAgcmVhZG9ubHkgaWQ6IHN0cmluZztcblxuICAvKipcbiAgICogQSB1bmlxdWUgaWRlbnRpZmllciBzcGVjaWZpYyB0byB0aGUgdHlwZSBvZiBrZXksIHN1Y2ggYXMgYSBwdWJsaWMga2V5IG9yIGFuIGV0aGVyZXVtIGFkZHJlc3NcbiAgICogQGV4YW1wbGUgMHg4ZTM0ODQ2ODdlNjZjZGQyNmNmMDRjMzY0NzYzM2FiNGYzNTcwMTQ4XG4gICAqICovXG4gIHJlYWRvbmx5IG1hdGVyaWFsSWQ6IHN0cmluZztcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIEhleC1lbmNvZGVkLCBzZXJpYWxpemVkIHB1YmxpYyBrZXkuIFRoZSBmb3JtYXQgdXNlZCBkZXBlbmRzIG9uIHRoZSBrZXkgdHlwZTpcbiAgICogLSBzZWNwMjU2azEga2V5cyB1c2UgNjUtYnl0ZSB1bmNvbXByZXNzZWQgU0VDRyBmb3JtYXRcbiAgICogLSBCTFMga2V5cyB1c2UgNDgtYnl0ZSBjb21wcmVzc2VkIEJMUzEyLTM4MSAoWkNhc2gpIGZvcm1hdFxuICAgKiBAZXhhbXBsZSAweDA0ZDI2ODhiNmJjMmNlN2Y5ODc5YjllNzQ1ZjNjNGRjMTc3OTA4YzVjZWYwYzFiNjRjZmYxOWFlN2ZmMjdkZWU2MjNjNjRmZTlkOWMzMjVjN2ZiYmM3NDhiYmQ1ZjYwN2NlMTRkZDgzZTI4ZWJiYmI3ZDNlN2YyZmZiNzBhNzk0MzFcbiAgICogKi9cbiAgcmVhZG9ubHkgcHVibGljS2V5OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSB0eXBlIG9mIGtleS4gKi9cbiAgYXN5bmMgdHlwZSgpOiBQcm9taXNlPEtleVR5cGU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBmcm9tU2NoZW1hS2V5VHlwZShkYXRhLmtleV90eXBlKTtcbiAgfVxuXG4gIC8qKiBJcyB0aGUga2V5IGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqIEVuYWJsZSB0aGUga2V5LiAqL1xuICBhc3luYyBlbmFibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqIERpc2FibGUgdGhlIGtleS4gKi9cbiAgYXN5bmMgZGlzYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBuZXcgcG9saWN5IChvdmVyd3JpdGluZyBhbnkgcG9saWNpZXMgcHJldmlvdXNseSBzZXQgZm9yIHRoaXMga2V5KVxuICAgKiBAcGFyYW0ge0tleVBvbGljeX0gcG9saWN5IFRoZSBuZXcgcG9saWN5IHRvIHNldFxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogS2V5UG9saWN5KSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3k6IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCB0byBleGlzdGluZyBrZXkgcG9saWN5LiBUaGlzIGFwcGVuZCBpcyBub3QgYXRvbWljIC0tIGl0IHVzZXMge0BsaW5rIHBvbGljeX0gdG8gZmV0Y2ggdGhlIGN1cnJlbnQgcG9saWN5IGFuZCB0aGVuIHtAbGluayBzZXRQb2xpY3l9IHRvIHNldCB0aGUgcG9saWN5IC0tIGFuZCBzaG91bGQgbm90IGJlIHVzZWQgaW4gYWNyb3NzIGNvbmN1cnJlbnQgc2Vzc2lvbnMuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5fSBwb2xpY3kgVGhlIHBvbGljeSB0byBhcHBlbmQgdG8gdGhlIGV4aXN0aW5nIG9uZS5cbiAgICovXG4gIGFzeW5jIGFwcGVuZFBvbGljeShwb2xpY3k6IEtleVBvbGljeSkge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleVBvbGljeT59IFRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxLZXlQb2xpY3k+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgS2V5UG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBPd25lciBvZiB0aGUga2V5XG4gICAqIEBleGFtcGxlIFVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqICovXG4gIGFzeW5jIG93bmVyKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5vd25lcjtcbiAgfVxuXG4gIC8qKiBTZXQgdGhlIG93bmVyIG9mIHRoZSBrZXkuIE9ubHkgdGhlIGtleSAob3Igb3JnKSBvd25lciBjYW4gY2hhbmdlIHRoZSBvd25lciBvZiB0aGUga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3duZXIgVGhlIHVzZXItaWQgb2YgdGhlIG5ldyBvd25lciBvZiB0aGUga2V5LlxuICAgKiAqL1xuICBhc3luYyBzZXRPd25lcihvd25lcjogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBvd25lciB9KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqIENyZWF0ZSBhIG5ldyBrZXkuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIGtleSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge0tleUluZm99IGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCBkYXRhOiBLZXlJbmZvQXBpKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLm9yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy5pZCA9IGRhdGEua2V5X2lkO1xuICAgIHRoaXMubWF0ZXJpYWxJZCA9IGRhdGEubWF0ZXJpYWxfaWQ7XG4gICAgdGhpcy5wdWJsaWNLZXkgPSBkYXRhLnB1YmxpY19rZXk7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7VXBkYXRlS2V5UmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge0tleUluZm99IFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZUtleVJlcXVlc3QpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5wYXRjaChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDogdGhpcy5pZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRvS2V5SW5mbyhhc3NlcnRPayhyZXNwKSk7XG4gIH1cblxuICAvKiogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIGtleSBiZWxvbmdzLlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVLZXlzKFxuICAgIGNzOiBDdWJlU2lnbmVyLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCBjaGFpbl9pZCA9IDA7IC8vIG5vdCB1c2VkIGFueW1vcmVcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBjb3VudCxcbiAgICAgICAgY2hhaW5faWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICBvd25lcjogb3duZXJJZCB8fCBudWxsLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YS5rZXlzLm1hcCgoaykgPT4gbmV3IEtleShjcywgb3JnSWQsIGspKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmVzIGEga2V5IG9mIGEgc3BlY2lmaWVkIHR5cGUgdXNpbmcgYSBzdXBwbGllZCBkZXJpdmF0aW9uIHBhdGggYW5kIGFuIGV4aXN0aW5nIGxvbmctbGl2ZWQgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBrZXkgY3JlYXRpb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUga2V5IGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBkZXJpdmF0aW9uUGF0aHMgRGVyaXZhdGlvbiBwYXRocyBmcm9tIHdoaWNoIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljSWQgbWF0ZXJpYWxJZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgbmV3bHkgZGVyaXZlZCBrZXlzLiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge0tleVtdfSBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGRlcml2ZUtleXMoXG4gICAgY3M6IEN1YmVTaWduZXIsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5wdXQoXCIvdjAvb3JnL3tvcmdfaWR9L2Rlcml2ZV9rZXlcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGRlcml2YXRpb25fcGF0aDogZGVyaXZhdGlvblBhdGhzLFxuICAgICAgICBtbmVtb25pY19pZDogbW5lbW9uaWNJZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIG93bmVyOiBvd25lcklkIHx8IG51bGwsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhLmtleXMubWFwKChrKSA9PiBuZXcgS2V5KGNzLCBvcmdJZCwgaykpO1xuICB9XG5cbiAgLyoqIEdldCBhIGtleSBieSBpZC5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUga2V5IGJlbG9uZ3MuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm4ge0tleX0gVGhlIGtleS5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHN0YXRpYyBhc3luYyBnZXRLZXkoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkLCBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gbmV3IEtleShjcywgb3JnSWQsIGRhdGEpO1xuICB9XG5cbiAgLyoqIEZldGNoZXMgdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICogQHJldHVybiB7S2V5SW5mb30gVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwga2V5X2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gdG9LZXlJbmZvKGRhdGEpO1xuICB9XG59XG5cbi8qKiBDb252ZXJ0IGEgc2NoZW1hIGtleSB0eXBlIHRvIGEga2V5IHR5cGUuXG4gKiBAcGFyYW0ge1NjaGVtYUtleVR5cGV9IHR5IFRoZSBzY2hlbWEga2V5IHR5cGUuXG4gKiBAcmV0dXJuIHtLZXlUeXBlfSBUaGUga2V5IHR5cGUuXG4gKiBAaW50ZXJuYWxcbiAqICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbVNjaGVtYUtleVR5cGUodHk6IFNjaGVtYUtleVR5cGUpOiBLZXlUeXBlIHtcbiAgc3dpdGNoICh0eSkge1xuICAgIGNhc2UgXCJTZWNwRXRoQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5Fdm07XG4gICAgY2FzZSBcIlNlY3BCdGNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjO1xuICAgIGNhc2UgXCJTZWNwQnRjVGVzdFwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGNUZXN0O1xuICAgIGNhc2UgXCJTZWNwQXZhQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5BdmE7XG4gICAgY2FzZSBcIlNlY3BBdmFUZXN0QWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5BdmFUZXN0O1xuICAgIGNhc2UgXCJCbHNQdWJcIjpcbiAgICAgIHJldHVybiBCbHMuRXRoMkRlcG9zaXRlZDtcbiAgICBjYXNlIFwiQmxzSW5hY3RpdmVcIjpcbiAgICAgIHJldHVybiBCbHMuRXRoMkluYWN0aXZlO1xuICAgIGNhc2UgXCJFZDI1NTE5U29sYW5hQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU29sYW5hO1xuICAgIGNhc2UgXCJFZDI1NTE5U3VpQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU3VpO1xuICAgIGNhc2UgXCJFZDI1NTE5QXB0b3NBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5BcHRvcztcbiAgICBjYXNlIFwiRWQyNTUxOUNhcmRhbm9BZGRyVmtcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LkNhcmRhbm87XG4gICAgY2FzZSBcIlN0YXJrXCI6XG4gICAgICByZXR1cm4gU3Rhcms7XG4gICAgY2FzZSBcIk1uZW1vbmljXCI6XG4gICAgICByZXR1cm4gTW5lbW9uaWM7XG4gIH1cbn1cbiJdfQ==