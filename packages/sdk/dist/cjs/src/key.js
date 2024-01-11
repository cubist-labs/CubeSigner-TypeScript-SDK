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
var _Key_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromSchemaKeyType = exports.Key = exports.toKeyInfo = exports.Stark = exports.Mnemonic = exports.Ed25519 = exports.Bls = exports.Secp256k1 = void 0;
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
    Ed25519["Stellar"] = "Ed25519StellarAddr";
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
/**
 * A representation of a signing key.
 */
class Key {
    /** The organization that this key is in */
    get orgId() {
        return this.csc.orgId;
    }
    /**
     * The id of the key: "Key#" followed by a unique identifier specific to
     * the type of key (such as a public key for BLS or an ethereum address for Secp)
     * @example Key#0x8e3484687e66cdd26cf04c3647633ab4f3570148
     */
    get id() {
        return __classPrivateFieldGet(this, _Key_data, "f").key_id;
    }
    /**
     * A unique identifier specific to the type of key, such as a public key or an ethereum address
     * @example 0x8e3484687e66cdd26cf04c3647633ab4f3570148
     */
    get materialId() {
        return __classPrivateFieldGet(this, _Key_data, "f").material_id;
    }
    /**
     * @description Hex-encoded, serialized public key. The format used depends on the key type:
     * - secp256k1 keys use 65-byte uncompressed SECG format
     * - BLS keys use 48-byte compressed BLS12-381 (ZCash) format
     * @example 0x04d2688b6bc2ce7f9879b9e745f3c4dc177908c5cef0c1b64cff19ae7ff27dee623c64fe9d9c325c7fbbc748bbd5f607ce14dd83e28ebbbb7d3e7f2ffb70a79431
     */
    get publicKey() {
        return __classPrivateFieldGet(this, _Key_data, "f").public_key;
    }
    /**
     * Get the cached properties of this key. The cached properties reflect the
     * state of the last fetch or update (e.g., after awaiting `Key.enabled()`
     * or `Key.disable()`).
     */
    get cached() {
        return __classPrivateFieldGet(this, _Key_data, "f");
    }
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
     * Get the policy for the key.
     * @return {Promise<KeyPolicy>} The policy for the key.
     */
    async policy() {
        const data = await this.fetch();
        return (data.policy ?? []);
    }
    /**
     * @description Owner of the key
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    async owner() {
        const data = await this.fetch();
        return data.owner;
    }
    /**
     * Set the owner of the key. Only the key (or org) owner can change the owner of the key.
     * @param {string} owner The user-id of the new owner of the key.
     */
    async setOwner(owner) {
        await this.update({ owner });
    }
    /**
     * Delete this key.
     */
    async delete() {
        await this.csc.keyDelete(this.id);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Create a new key.
     *
     * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
     * @param {KeyInfoApi} data The JSON response from the API server.
     * @internal
     */
    constructor(csc, data) {
        /** The key information */
        _Key_data.set(this, void 0);
        this.csc = csc;
        __classPrivateFieldSet(this, _Key_data, toKeyInfo(data), "f");
    }
    /**
     * Update the key.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfo} The JSON response from the API server.
     * @internal
     */
    async update(request) {
        __classPrivateFieldSet(this, _Key_data, await this.csc.keyUpdate(this.id, request).then(toKeyInfo), "f");
        return __classPrivateFieldGet(this, _Key_data, "f");
    }
    /**
     * Fetch the key information.
     *
     * @return {KeyInfo} The key information.
     * @internal
     */
    async fetch() {
        __classPrivateFieldSet(this, _Key_data, await this.csc.keyGet(this.id).then(toKeyInfo), "f");
        return __classPrivateFieldGet(this, _Key_data, "f");
    }
}
exports.Key = Key;
_Key_data = new WeakMap();
/**
 * Convert a schema key type to a key type.
 *
 * @param {SchemaKeyType} ty The schema key type.
 * @return {KeyType} The key type.
 * @internal
 */
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
        case "Ed25519StellarAddr":
            return Ed25519.Stellar;
        case "Stark":
            return exports.Stark;
        case "Mnemonic":
            return exports.Mnemonic;
    }
}
exports.fromSchemaKeyType = fromSchemaKeyType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFJQSx5QkFBeUI7QUFDekIsSUFBWSxTQU1YO0FBTkQsV0FBWSxTQUFTO0lBQ25CLGdDQUFtQixDQUFBO0lBQ25CLDRCQUFlLENBQUE7SUFDZixvQ0FBdUIsQ0FBQTtJQUN2QixnQ0FBbUIsQ0FBQTtJQUNuQix3Q0FBMkIsQ0FBQTtBQUM3QixDQUFDLEVBTlcsU0FBUyx5QkFBVCxTQUFTLFFBTXBCO0FBRUQsbUJBQW1CO0FBQ25CLElBQVksR0FHWDtBQUhELFdBQVksR0FBRztJQUNiLCtCQUF3QixDQUFBO0lBQ3hCLG1DQUE0QixDQUFBO0FBQzlCLENBQUMsRUFIVyxHQUFHLG1CQUFILEdBQUcsUUFHZDtBQUVELHVCQUF1QjtBQUN2QixJQUFZLE9BTVg7QUFORCxXQUFZLE9BQU87SUFDakIsdUNBQTRCLENBQUE7SUFDNUIsaUNBQXNCLENBQUE7SUFDdEIscUNBQTBCLENBQUE7SUFDMUIsMkNBQWdDLENBQUE7SUFDaEMseUNBQThCLENBQUE7QUFDaEMsQ0FBQyxFQU5XLE9BQU8sdUJBQVAsT0FBTyxRQU1sQjtBQUVELHdCQUF3QjtBQUNYLFFBQUEsUUFBUSxHQUFHLFVBQW1CLENBQUM7QUFHNUMscUJBQXFCO0FBQ1IsUUFBQSxLQUFLLEdBQUcsT0FBZ0IsQ0FBQztBQWtCdEM7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLEdBQWU7SUFDdkMsT0FBTztRQUNMLEdBQUcsR0FBRztRQUNOLEVBQUUsRUFBRSxHQUFHLENBQUMsTUFBTTtRQUNkLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUTtRQUNsQixTQUFTLEVBQUUsR0FBRyxDQUFDLFVBQVU7UUFDekIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxXQUFXO0tBQzVCLENBQUM7QUFDSixDQUFDO0FBUkQsOEJBUUM7QUFFRDs7R0FFRztBQUNILE1B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QixLQUFLLG1CQUFtQjtZQUN0QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDeEIsS0FBSyxnQkFBZ0I7WUFDbkIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3JCLEtBQUssa0JBQWtCO1lBQ3JCLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztRQUN2QixLQUFLLHNCQUFzQjtZQUN6QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDekIsS0FBSyxvQkFBb0I7WUFDdkIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3pCLEtBQUssT0FBTztZQUNWLE9BQU8sYUFBSyxDQUFDO1FBQ2YsS0FBSyxVQUFVO1lBQ2IsT0FBTyxnQkFBUSxDQUFDO0lBQ3BCLENBQUM7QUFDSCxDQUFDO0FBL0JELDhDQStCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEtleVBvbGljeSB9IGZyb20gXCIuL3JvbGVcIjtcbmltcG9ydCB7IEtleUluZm9BcGksIEtleVR5cGVBcGksIFVwZGF0ZUtleVJlcXVlc3QsIFNjaGVtYUtleVR5cGUgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQgfSBmcm9tIFwiLi9jbGllbnRcIjtcblxuLyoqIFNlY3AyNTZrMSBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gU2VjcDI1NmsxIHtcbiAgRXZtID0gXCJTZWNwRXRoQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEJ0YyA9IFwiU2VjcEJ0Y1wiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEJ0Y1Rlc3QgPSBcIlNlY3BCdGNUZXN0XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQXZhID0gXCJTZWNwQXZhQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEF2YVRlc3QgPSBcIlNlY3BBdmFUZXN0QWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBCTFMga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIEJscyB7XG4gIEV0aDJEZXBvc2l0ZWQgPSBcIkJsc1B1YlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV0aDJJbmFjdGl2ZSA9IFwiQmxzSW5hY3RpdmVcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogRWQyNTUxOSBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gRWQyNTUxOSB7XG4gIFNvbGFuYSA9IFwiRWQyNTUxOVNvbGFuYUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBTdWkgPSBcIkVkMjU1MTlTdWlBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQXB0b3MgPSBcIkVkMjU1MTlBcHRvc0FkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBDYXJkYW5vID0gXCJFZDI1NTE5Q2FyZGFub0FkZHJWa1wiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFN0ZWxsYXIgPSBcIkVkMjU1MTlTdGVsbGFyQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBNbmVtb25pYyBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IE1uZW1vbmljID0gXCJNbmVtb25pY1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgTW5lbW9uaWMgPSB0eXBlb2YgTW5lbW9uaWM7XG5cbi8qKiBTdGFyayBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IFN0YXJrID0gXCJTdGFya1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgU3RhcmsgPSB0eXBlb2YgU3Rhcms7XG5cbi8qKiBLZXkgdHlwZSAqL1xuZXhwb3J0IHR5cGUgS2V5VHlwZSA9IFNlY3AyNTZrMSB8IEJscyB8IEVkMjU1MTkgfCBNbmVtb25pYyB8IFN0YXJrO1xuXG4vKiogQWRkaXRpb25hbCBwcm9wZXJ0aWVzIChmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSkgKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5SW5mbyBleHRlbmRzIEtleUluZm9BcGkge1xuICAvKiogQWxpYXMgZm9yIGtleV9pZCAqL1xuICBpZDogc3RyaW5nO1xuICAvKiogQWxpYXMgZm9yIGtleV90eXBlICovXG4gIHR5cGU6IEtleVR5cGVBcGk7XG4gIC8qKiBBbGlhcyBmb3IgbWF0ZXJpYWxfaWQgKi9cbiAgbWF0ZXJpYWxJZDogc3RyaW5nO1xuICAvKiogQWxpYXMgZm9yIHB1YmxpY19rZXkgKi9cbiAgcHVibGljS2V5OiBzdHJpbmc7XG59XG5cbi8qKlxuICogRGVmaW5lIHNvbWUgYWRkaXRpb25hbCAoYmFja3dhcmQgY29tcGF0aWJpbGl0eSkgcHJvcGVydGllc1xuICogb24gYSBgS2V5SW5mb0FwaWAgb2JqZWN0IHJldHVybmVkIGZyb20gdGhlIHJlbW90ZSBlbmQuXG4gKlxuICogQHBhcmFtIHtLZXlJbmZvQXBpfSBrZXkgS2V5IGluZm9ybWF0aW9uIHJldHVybmVkIGZyb20gdGhlIHJlbW90ZSBlbmRcbiAqIEByZXR1cm4ge0tleUluZm99IFRoZSBzYW1lIGBrZXlgIG9iamVjdCBleHRlbmRlZCB3aXRoIHNvbWUgZGVyaXZlZCBwcm9wZXJ0aWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9LZXlJbmZvKGtleTogS2V5SW5mb0FwaSk6IEtleUluZm8ge1xuICByZXR1cm4ge1xuICAgIC4uLmtleSxcbiAgICBpZDoga2V5LmtleV9pZCxcbiAgICB0eXBlOiBrZXkua2V5X3R5cGUsXG4gICAgcHVibGljS2V5OiBrZXkucHVibGljX2tleSxcbiAgICBtYXRlcmlhbElkOiBrZXkubWF0ZXJpYWxfaWQsXG4gIH07XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIHNpZ25pbmcga2V5LlxuICovXG5leHBvcnQgY2xhc3MgS2V5IHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoYXQgdGhpcyBrZXkgaXMgYXNzb2NpYXRlZCB3aXRoICovXG4gIHByb3RlY3RlZCByZWFkb25seSBjc2M6IEN1YmVTaWduZXJDbGllbnQ7XG4gIC8qKiBUaGUga2V5IGluZm9ybWF0aW9uICovXG4gICNkYXRhOiBLZXlJbmZvO1xuXG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIHRoYXQgdGhpcyBrZXkgaXMgaW4gKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLmNzYy5vcmdJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgaWQgb2YgdGhlIGtleTogXCJLZXkjXCIgZm9sbG93ZWQgYnkgYSB1bmlxdWUgaWRlbnRpZmllciBzcGVjaWZpYyB0b1xuICAgKiB0aGUgdHlwZSBvZiBrZXkgKHN1Y2ggYXMgYSBwdWJsaWMga2V5IGZvciBCTFMgb3IgYW4gZXRoZXJldW0gYWRkcmVzcyBmb3IgU2VjcClcbiAgICogQGV4YW1wbGUgS2V5IzB4OGUzNDg0Njg3ZTY2Y2RkMjZjZjA0YzM2NDc2MzNhYjRmMzU3MDE0OFxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEua2V5X2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgdW5pcXVlIGlkZW50aWZpZXIgc3BlY2lmaWMgdG8gdGhlIHR5cGUgb2Yga2V5LCBzdWNoIGFzIGEgcHVibGljIGtleSBvciBhbiBldGhlcmV1bSBhZGRyZXNzXG4gICAqIEBleGFtcGxlIDB4OGUzNDg0Njg3ZTY2Y2RkMjZjZjA0YzM2NDc2MzNhYjRmMzU3MDE0OFxuICAgKi9cbiAgZ2V0IG1hdGVyaWFsSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5tYXRlcmlhbF9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gSGV4LWVuY29kZWQsIHNlcmlhbGl6ZWQgcHVibGljIGtleS4gVGhlIGZvcm1hdCB1c2VkIGRlcGVuZHMgb24gdGhlIGtleSB0eXBlOlxuICAgKiAtIHNlY3AyNTZrMSBrZXlzIHVzZSA2NS1ieXRlIHVuY29tcHJlc3NlZCBTRUNHIGZvcm1hdFxuICAgKiAtIEJMUyBrZXlzIHVzZSA0OC1ieXRlIGNvbXByZXNzZWQgQkxTMTItMzgxIChaQ2FzaCkgZm9ybWF0XG4gICAqIEBleGFtcGxlIDB4MDRkMjY4OGI2YmMyY2U3Zjk4NzliOWU3NDVmM2M0ZGMxNzc5MDhjNWNlZjBjMWI2NGNmZjE5YWU3ZmYyN2RlZTYyM2M2NGZlOWQ5YzMyNWM3ZmJiYzc0OGJiZDVmNjA3Y2UxNGRkODNlMjhlYmJiYjdkM2U3ZjJmZmI3MGE3OTQzMVxuICAgKi9cbiAgZ2V0IHB1YmxpY0tleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLnB1YmxpY19rZXk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIGtleS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmcgYEtleS5lbmFibGVkKClgXG4gICAqIG9yIGBLZXkuZGlzYWJsZSgpYCkuXG4gICAqL1xuICBnZXQgY2FjaGVkKCk6IEtleUluZm8ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqIFRoZSB0eXBlIG9mIGtleS4gKi9cbiAgYXN5bmMgdHlwZSgpOiBQcm9taXNlPEtleVR5cGU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBmcm9tU2NoZW1hS2V5VHlwZShkYXRhLmtleV90eXBlKTtcbiAgfVxuXG4gIC8qKiBJcyB0aGUga2V5IGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqIEVuYWJsZSB0aGUga2V5LiAqL1xuICBhc3luYyBlbmFibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqIERpc2FibGUgdGhlIGtleS4gKi9cbiAgYXN5bmMgZGlzYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBuZXcgcG9saWN5IChvdmVyd3JpdGluZyBhbnkgcG9saWNpZXMgcHJldmlvdXNseSBzZXQgZm9yIHRoaXMga2V5KVxuICAgKiBAcGFyYW0ge0tleVBvbGljeX0gcG9saWN5IFRoZSBuZXcgcG9saWN5IHRvIHNldFxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogS2V5UG9saWN5KSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3k6IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCB0byBleGlzdGluZyBrZXkgcG9saWN5LiBUaGlzIGFwcGVuZCBpcyBub3QgYXRvbWljIC0tIGl0IHVzZXMge0BsaW5rIHBvbGljeX0gdG8gZmV0Y2ggdGhlIGN1cnJlbnQgcG9saWN5IGFuZCB0aGVuIHtAbGluayBzZXRQb2xpY3l9IHRvIHNldCB0aGUgcG9saWN5IC0tIGFuZCBzaG91bGQgbm90IGJlIHVzZWQgaW4gYWNyb3NzIGNvbmN1cnJlbnQgc2Vzc2lvbnMuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5fSBwb2xpY3kgVGhlIHBvbGljeSB0byBhcHBlbmQgdG8gdGhlIGV4aXN0aW5nIG9uZS5cbiAgICovXG4gIGFzeW5jIGFwcGVuZFBvbGljeShwb2xpY3k6IEtleVBvbGljeSkge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUga2V5LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleVBvbGljeT59IFRoZSBwb2xpY3kgZm9yIHRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxLZXlQb2xpY3k+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgS2V5UG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBPd25lciBvZiB0aGUga2V5XG4gICAqIEBleGFtcGxlIFVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBhc3luYyBvd25lcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEub3duZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvd25lciBvZiB0aGUga2V5LiBPbmx5IHRoZSBrZXkgKG9yIG9yZykgb3duZXIgY2FuIGNoYW5nZSB0aGUgb3duZXIgb2YgdGhlIGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG93bmVyIFRoZSB1c2VyLWlkIG9mIHRoZSBuZXcgb3duZXIgb2YgdGhlIGtleS5cbiAgICovXG4gIGFzeW5jIHNldE93bmVyKG93bmVyOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG93bmVyIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGlzIGtleS5cbiAgICovXG4gIGFzeW5jIGRlbGV0ZSgpIHtcbiAgICBhd2FpdCB0aGlzLmNzYy5rZXlEZWxldGUodGhpcy5pZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNzYyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7S2V5SW5mb0FwaX0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzYzogQ3ViZVNpZ25lckNsaWVudCwgZGF0YTogS2V5SW5mb0FwaSkge1xuICAgIHRoaXMuY3NjID0gY3NjO1xuICAgIHRoaXMuI2RhdGEgPSB0b0tleUluZm8oZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7VXBkYXRlS2V5UmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge0tleUluZm99IFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLmNzYy5rZXlVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCkudGhlbih0b0tleUluZm8pO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge0tleUluZm99IFRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy5jc2Mua2V5R2V0KHRoaXMuaWQpLnRoZW4odG9LZXlJbmZvKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgYSBzY2hlbWEga2V5IHR5cGUgdG8gYSBrZXkgdHlwZS5cbiAqXG4gKiBAcGFyYW0ge1NjaGVtYUtleVR5cGV9IHR5IFRoZSBzY2hlbWEga2V5IHR5cGUuXG4gKiBAcmV0dXJuIHtLZXlUeXBlfSBUaGUga2V5IHR5cGUuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21TY2hlbWFLZXlUeXBlKHR5OiBTY2hlbWFLZXlUeXBlKTogS2V5VHlwZSB7XG4gIHN3aXRjaCAodHkpIHtcbiAgICBjYXNlIFwiU2VjcEV0aEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuRXZtO1xuICAgIGNhc2UgXCJTZWNwQnRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0YztcbiAgICBjYXNlIFwiU2VjcEJ0Y1Rlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjVGVzdDtcbiAgICBjYXNlIFwiU2VjcEF2YUFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQXZhO1xuICAgIGNhc2UgXCJTZWNwQXZhVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQXZhVGVzdDtcbiAgICBjYXNlIFwiQmxzUHViXCI6XG4gICAgICByZXR1cm4gQmxzLkV0aDJEZXBvc2l0ZWQ7XG4gICAgY2FzZSBcIkJsc0luYWN0aXZlXCI6XG4gICAgICByZXR1cm4gQmxzLkV0aDJJbmFjdGl2ZTtcbiAgICBjYXNlIFwiRWQyNTUxOVNvbGFuYUFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlNvbGFuYTtcbiAgICBjYXNlIFwiRWQyNTUxOVN1aUFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlN1aTtcbiAgICBjYXNlIFwiRWQyNTUxOUFwdG9zQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQXB0b3M7XG4gICAgY2FzZSBcIkVkMjU1MTlDYXJkYW5vQWRkclZrXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5DYXJkYW5vO1xuICAgIGNhc2UgXCJFZDI1NTE5U3RlbGxhckFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlN0ZWxsYXI7XG4gICAgY2FzZSBcIlN0YXJrXCI6XG4gICAgICByZXR1cm4gU3Rhcms7XG4gICAgY2FzZSBcIk1uZW1vbmljXCI6XG4gICAgICByZXR1cm4gTW5lbW9uaWM7XG4gIH1cbn1cbiJdfQ==