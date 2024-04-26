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
var _Key_instances, _Key_apiClient, _Key_data, _Key_setMetadataProperty;
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromSchemaKeyType = exports.Key = exports.Stark = exports.Mnemonic = exports.Ed25519 = exports.Bls = exports.Secp256k1 = void 0;
const _1 = require(".");
/** Secp256k1 key type */
var Secp256k1;
(function (Secp256k1) {
    Secp256k1["Evm"] = "SecpEthAddr";
    Secp256k1["Btc"] = "SecpBtc";
    Secp256k1["BtcTest"] = "SecpBtcTest";
    Secp256k1["Taproot"] = "TaprootBtc";
    Secp256k1["TaprootTest"] = "TaprootBtcTest";
    Secp256k1["BabylonEots"] = "BabylonEots";
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
 * A representation of a signing key.
 */
class Key {
    /** The organization that this key is in */
    get orgId() {
        return __classPrivateFieldGet(this, _Key_apiClient, "f").sessionMeta.org_id;
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
     * The list roles this key is in.
     * @param {PageOpts} page Optional pagination options; by default, retrieves all roles this key is in.
     * @return {Promise<KeyInRoleInfo[]>} Roles this key is in.
     */
    async roles(page) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").keyRolesList(this.id, page).fetch();
    }
    /**
     * Set new policy (overwriting any policies previously set for this key)
     * @param {KeyPolicy} policy The new policy to set
     */
    async setPolicy(policy) {
        await this.update({ policy: policy });
    }
    /**
     * Set key metadata. The metadata must be at most 1024 characters
     * and must match the following regex: ^[A-Za-z0-9_=+/ \-\.\,]{0,1024}$.
     *
     * @param {string} metadata The new metadata to set.
     */
    async setMetadata(metadata) {
        return await this.update({ metadata });
    }
    /**
     * Retrieves the existing metadata, asserts that it is an object (throws if it is not),
     * then sets the value of the {@link name} property in that object to {@link value},
     * and finally submits the request to update the metadata.
     *
     * This whole process is done atomically, meaning, that if the metadata changes between the
     * time this method first retrieves it and the time it submits a request to update it, the
     * request will be rejected. When that happens, this method will retry a few times, as per
     * {@link ApiClient.config}.
     *
     * @param {string} name The name of the property to set
     * @param {JsonValue} value The new value of the property
     * @return {Promise<KeyInfo>} Updated key information
     */
    async setMetadataProperty(name, value) {
        return await __classPrivateFieldGet(this, _Key_instances, "m", _Key_setMetadataProperty).call(this, name, value, __classPrivateFieldGet(this, _Key_apiClient, "f").config.updateRetryDelaysMs);
    }
    /**
     * Retrieves the existing metadata, asserts that it is in object (throws if it is not),
     * then deletes the {@link name} property in that object, and finally submits the
     * request to update the metadata.
     *
     * This whole process is done atomically, meaning, that if the metadata changes between the
     * time this method first retrieves it and the time it submits a request to update it, the
     * request will be rejected. When that happens, this method will retry a few times, as per
     * {@link ApiClient.config}.
     *
     * @param {string} name The name of the property to set
     * @return {Promise<KeyInfo>} Updated key information
     */
    async deleteMetadataProperty(name) {
        return await __classPrivateFieldGet(this, _Key_instances, "m", _Key_setMetadataProperty).call(this, name, undefined, __classPrivateFieldGet(this, _Key_apiClient, "f").config.updateRetryDelaysMs);
    }
    /**
     * Append to existing key policy. This append is not atomic -- it uses {@link policy}
     * to fetch the current policy and then {@link setPolicy} to set the policy -- and
     * should not be used in across concurrent sessions.
     *
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
     * Fetch the metadata for the key.
     * @return {Promise<JsonValue>} The policy for the key.
     */
    async metadata() {
        const data = await this.fetch();
        return data.metadata;
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
        await __classPrivateFieldGet(this, _Key_apiClient, "f").keyDelete(this.id);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Create a new key.
     *
     * @param {ApiClient | CubeSignerClient} client The API client to use.
     * @param {KeyInfo} data The JSON response from the API server.
     * @internal
     */
    constructor(client, data) {
        _Key_instances.add(this);
        /** The CubeSigner instance that this key is associated with */
        _Key_apiClient.set(this, void 0);
        /** The key information */
        _Key_data.set(this, void 0);
        __classPrivateFieldSet(this, _Key_apiClient, client instanceof _1.CubeSignerClient ? client.apiClient : client, "f");
        __classPrivateFieldSet(this, _Key_data, data, "f");
    }
    /**
     * Sign an EVM transaction.
     *
     * @param {EvmSignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    async signEvm(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEvm(this, req, mfaReceipt);
    }
    /**
     * Sign EIP-191 typed data.
     *
     * This requires the key to have a '"AllowEip191Signing"' {@link KeyPolicy}.
     *
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    async signEip191(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEip191(this, req, mfaReceipt);
    }
    /**
     * Sign EIP-712 typed data.
     *
     * This requires the key to have a '"AllowEip712Signing"' {@link KeyPolicy}.
     *
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    async signEip712(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEip712(this, req, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param {Eth2SignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    async signEth2(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEth2(this, req, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    async unstake(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signUnstake(this, req, mfaReceipt);
    }
    /**
     * Sign an Avalanche P- or X-chain message.
     *
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    async signAva(tx, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signAva(this, tx, mfaReceipt);
    }
    /**
     * Sign a raw blob.
     *
     * This requires the key to have a '"AllowRawBlobSigning"' {@link KeyPolicy}. This is because
     * signing arbitrary messages is, in general, dangerous (and you should instead
     * prefer typed end-points as used by, for example, {@link signEvm}). For Secp256k1 keys,
     * for example, you **must** call this function with a message that is 32 bytes long and
     * the output of a secure hash function.
     *
     * This function returns signatures serialized as;
     *
     * - ECDSA signatures are serialized as big-endian r and s plus recovery-id
     *    byte v, which can in general take any of the values 0, 1, 2, or 3.
     *
     * - EdDSA signatures are serialized in the standard format.
     *
     * - BLS signatures are not supported on the blob-sign endpoint.
     *
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
     */
    async signBlob(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signBlob(this, req, mfaReceipt);
    }
    /**
     * Sign a Bitcoin message.
     *
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    async signBtc(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signBtc(this, req, mfaReceipt);
    }
    /**
     * Sign a Solana message.
     *
     * @param {SolanaSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    async signSolana(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signSolana(this, req, mfaReceipt);
    }
    /**
     * Update the key.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfo} The JSON response from the API server.
     * @internal
     */
    async update(request) {
        __classPrivateFieldSet(this, _Key_data, await __classPrivateFieldGet(this, _Key_apiClient, "f").keyUpdate(this.id, request), "f");
        return __classPrivateFieldGet(this, _Key_data, "f");
    }
    /**
     * Fetch the key information.
     *
     * @return {KeyInfo} The key information.
     * @internal
     */
    async fetch() {
        __classPrivateFieldSet(this, _Key_data, await __classPrivateFieldGet(this, _Key_apiClient, "f").keyGet(this.id), "f");
        return __classPrivateFieldGet(this, _Key_data, "f");
    }
}
exports.Key = Key;
_Key_apiClient = new WeakMap(), _Key_data = new WeakMap(), _Key_instances = new WeakSet(), _Key_setMetadataProperty = 
/**
 * @param {string} name The name of the property to set
 * @param {JsonValue} value The new value of the property
 * @param {number[]} delaysMs Delays in milliseconds between retries
 * @return {Promise<KeyInfo>} Updated key information
 * @internal
 */
async function _Key_setMetadataProperty(name, value, delaysMs) {
    const data = await this.fetch();
    const current = data.metadata ?? {};
    if (typeof current !== "object") {
        throw new Error("Current metadata is not a JSON object");
    }
    const updated = {
        ...current,
        [name]: value,
    };
    try {
        return await this.update({
            metadata: updated,
            version: data.version,
        });
    }
    catch (e) {
        if (e.errorCode === "InvalidUpdate" && delaysMs.length > 0) {
            await (0, _1.delay)(delaysMs[0]);
            return await __classPrivateFieldGet(this, _Key_instances, "m", _Key_setMetadataProperty).call(this, name, value, delaysMs.slice(1));
        }
        else {
            throw e;
        }
    }
};
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
        case "BabylonEots":
            return Secp256k1.BabylonEots;
        case "TaprootBtc":
            return Secp256k1.Taproot;
        case "TaprootBtcTest":
            return Secp256k1.TaprootTest;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUEwQkEsd0JBQTRDO0FBRTVDLHlCQUF5QjtBQUN6QixJQUFZLFNBU1g7QUFURCxXQUFZLFNBQVM7SUFDbkIsZ0NBQW1CLENBQUE7SUFDbkIsNEJBQWUsQ0FBQTtJQUNmLG9DQUF1QixDQUFBO0lBQ3ZCLG1DQUFzQixDQUFBO0lBQ3RCLDJDQUE4QixDQUFBO0lBQzlCLHdDQUEyQixDQUFBO0lBQzNCLGdDQUFtQixDQUFBO0lBQ25CLHdDQUEyQixDQUFBO0FBQzdCLENBQUMsRUFUVyxTQUFTLHlCQUFULFNBQVMsUUFTcEI7QUFFRCxtQkFBbUI7QUFDbkIsSUFBWSxHQUdYO0FBSEQsV0FBWSxHQUFHO0lBQ2IsK0JBQXdCLENBQUE7SUFDeEIsbUNBQTRCLENBQUE7QUFDOUIsQ0FBQyxFQUhXLEdBQUcsbUJBQUgsR0FBRyxRQUdkO0FBRUQsdUJBQXVCO0FBQ3ZCLElBQVksT0FNWDtBQU5ELFdBQVksT0FBTztJQUNqQix1Q0FBNEIsQ0FBQTtJQUM1QixpQ0FBc0IsQ0FBQTtJQUN0QixxQ0FBMEIsQ0FBQTtJQUMxQiwyQ0FBZ0MsQ0FBQTtJQUNoQyx5Q0FBOEIsQ0FBQTtBQUNoQyxDQUFDLEVBTlcsT0FBTyx1QkFBUCxPQUFPLFFBTWxCO0FBRUQsd0JBQXdCO0FBQ1gsUUFBQSxRQUFRLEdBQUcsVUFBbUIsQ0FBQztBQUc1QyxxQkFBcUI7QUFDUixRQUFBLEtBQUssR0FBRyxPQUFnQixDQUFDO0FBTXRDOztHQUVHO0FBQ0gsTUFBYSxHQUFHO0lBTWQsMkNBQTJDO0lBQzNDLElBQUksS0FBSztRQUNQLE9BQU8sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksaUJBQU0s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RyxDQUFDO1FBQ3ZCLEtBQUssaUJBQWlCO1lBQ3BCLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUMzQixLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDO1FBQy9CLEtBQUssWUFBWTtZQUNmLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUMzQixLQUFLLGdCQUFnQjtZQUNuQixPQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFDL0IsS0FBSyxRQUFRO1lBQ1gsT0FBTyxHQUFHLENBQUMsYUFBYSxDQUFDO1FBQzNCLEtBQUssYUFBYTtZQUNoQixPQUFPLEdBQUcsQ0FBQyxZQUFZLENBQUM7UUFDMUIsS0FBSyxtQkFBbUI7WUFDdEIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ3hCLEtBQUssZ0JBQWdCO1lBQ25CLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNyQixLQUFLLGtCQUFrQjtZQUNyQixPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDdkIsS0FBSyxzQkFBc0I7WUFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3pCLEtBQUssb0JBQW9CO1lBQ3ZCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUN6QixLQUFLLE9BQU87WUFDVixPQUFPLGFBQUssQ0FBQztRQUNmLEtBQUssVUFBVTtZQUNiLE9BQU8sZ0JBQVEsQ0FBQztJQUNwQixDQUFDO0FBQ0gsQ0FBQztBQXJDRCw4Q0FxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEtleVBvbGljeSB9IGZyb20gXCIuL3JvbGVcIjtcbmltcG9ydCB0eXBlIHsgUGFnZU9wdHMgfSBmcm9tIFwiLi9wYWdpbmF0b3JcIjtcbmltcG9ydCB0eXBlIHtcbiAgS2V5SW5mbyxcbiAgVXBkYXRlS2V5UmVxdWVzdCxcbiAgU2NoZW1hS2V5VHlwZSxcbiAgS2V5SW5Sb2xlSW5mbyxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXNwb25zZSxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFdGgyU2lnblJlcXVlc3QsXG4gIEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgQXZhVHgsXG4gIEJsb2JTaWduUmVxdWVzdCxcbiAgQnRjU2lnblJlcXVlc3QsXG4gIFNvbGFuYVNpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVzcG9uc2UsXG4gIEJ0Y1NpZ25SZXNwb25zZSxcbiAgQmxvYlNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlc3BvbnNlLFxuICBFdGgyVW5zdGFrZVJlc3BvbnNlLFxuICBFdGgyU2lnblJlc3BvbnNlLFxuICBFaXAxOTFPcjcxMlNpZ25SZXNwb25zZSxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFwaUNsaWVudCwgQ3ViZVNpZ25lclJlc3BvbnNlLCBFcnJSZXNwb25zZSwgSnNvblZhbHVlLCBNZmFSZWNlaXB0IH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQsIGRlbGF5IH0gZnJvbSBcIi5cIjtcblxuLyoqIFNlY3AyNTZrMSBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gU2VjcDI1NmsxIHtcbiAgRXZtID0gXCJTZWNwRXRoQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEJ0YyA9IFwiU2VjcEJ0Y1wiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEJ0Y1Rlc3QgPSBcIlNlY3BCdGNUZXN0XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgVGFwcm9vdCA9IFwiVGFwcm9vdEJ0Y1wiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFRhcHJvb3RUZXN0ID0gXCJUYXByb290QnRjVGVzdFwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEJhYnlsb25Fb3RzID0gXCJCYWJ5bG9uRW90c1wiLFxuICBBdmEgPSBcIlNlY3BBdmFBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQXZhVGVzdCA9IFwiU2VjcEF2YVRlc3RBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIEJMUyBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gQmxzIHtcbiAgRXRoMkRlcG9zaXRlZCA9IFwiQmxzUHViXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgRXRoMkluYWN0aXZlID0gXCJCbHNJbmFjdGl2ZVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBFZDI1NTE5IGtleSB0eXBlICovXG5leHBvcnQgZW51bSBFZDI1NTE5IHtcbiAgU29sYW5hID0gXCJFZDI1NTE5U29sYW5hQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFN1aSA9IFwiRWQyNTUxOVN1aUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBBcHRvcyA9IFwiRWQyNTUxOUFwdG9zQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIENhcmRhbm8gPSBcIkVkMjU1MTlDYXJkYW5vQWRkclZrXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgU3RlbGxhciA9IFwiRWQyNTUxOVN0ZWxsYXJBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbn1cblxuLyoqIE1uZW1vbmljIGtleSB0eXBlICovXG5leHBvcnQgY29uc3QgTW5lbW9uaWMgPSBcIk1uZW1vbmljXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBNbmVtb25pYyA9IHR5cGVvZiBNbmVtb25pYztcblxuLyoqIFN0YXJrIGtleSB0eXBlICovXG5leHBvcnQgY29uc3QgU3RhcmsgPSBcIlN0YXJrXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBTdGFyayA9IHR5cGVvZiBTdGFyaztcblxuLyoqIEtleSB0eXBlICovXG5leHBvcnQgdHlwZSBLZXlUeXBlID0gU2VjcDI1NmsxIHwgQmxzIHwgRWQyNTUxOSB8IE1uZW1vbmljIHwgU3Rhcms7XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIHNpZ25pbmcga2V5LlxuICovXG5leHBvcnQgY2xhc3MgS2V5IHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoYXQgdGhpcyBrZXkgaXMgYXNzb2NpYXRlZCB3aXRoICovXG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgLyoqIFRoZSBrZXkgaW5mb3JtYXRpb24gKi9cbiAgI2RhdGE6IEtleUluZm87XG5cbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGlzIGtleSBpcyBpbiAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGlkIG9mIHRoZSBrZXk6IFwiS2V5I1wiIGZvbGxvd2VkIGJ5IGEgdW5pcXVlIGlkZW50aWZpZXIgc3BlY2lmaWMgdG9cbiAgICogdGhlIHR5cGUgb2Yga2V5IChzdWNoIGFzIGEgcHVibGljIGtleSBmb3IgQkxTIG9yIGFuIGV0aGVyZXVtIGFkZHJlc3MgZm9yIFNlY3ApXG4gICAqIEBleGFtcGxlIEtleSMweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLmtleV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvIHRoZSB0eXBlIG9mIGtleSwgc3VjaCBhcyBhIHB1YmxpYyBrZXkgb3IgYW4gZXRoZXJldW0gYWRkcmVzc1xuICAgKiBAZXhhbXBsZSAweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICovXG4gIGdldCBtYXRlcmlhbElkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEubWF0ZXJpYWxfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIEhleC1lbmNvZGVkLCBzZXJpYWxpemVkIHB1YmxpYyBrZXkuIFRoZSBmb3JtYXQgdXNlZCBkZXBlbmRzIG9uIHRoZSBrZXkgdHlwZTpcbiAgICogLSBzZWNwMjU2azEga2V5cyB1c2UgNjUtYnl0ZSB1bmNvbXByZXNzZWQgU0VDRyBmb3JtYXRcbiAgICogLSBCTFMga2V5cyB1c2UgNDgtYnl0ZSBjb21wcmVzc2VkIEJMUzEyLTM4MSAoWkNhc2gpIGZvcm1hdFxuICAgKiBAZXhhbXBsZSAweDA0ZDI2ODhiNmJjMmNlN2Y5ODc5YjllNzQ1ZjNjNGRjMTc3OTA4YzVjZWYwYzFiNjRjZmYxOWFlN2ZmMjdkZWU2MjNjNjRmZTlkOWMzMjVjN2ZiYmM3NDhiYmQ1ZjYwN2NlMTRkZDgzZTI4ZWJiYmI3ZDNlN2YyZmZiNzBhNzk0MzFcbiAgICovXG4gIGdldCBwdWJsaWNLZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5wdWJsaWNfa2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyBrZXkuIFRoZSBjYWNoZWQgcHJvcGVydGllcyByZWZsZWN0IHRoZVxuICAgKiBzdGF0ZSBvZiB0aGUgbGFzdCBmZXRjaCBvciB1cGRhdGUgKGUuZy4sIGFmdGVyIGF3YWl0aW5nIGBLZXkuZW5hYmxlZCgpYFxuICAgKiBvciBgS2V5LmRpc2FibGUoKWApLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBLZXlJbmZvIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKiBUaGUgdHlwZSBvZiBrZXkuICovXG4gIGFzeW5jIHR5cGUoKTogUHJvbWlzZTxLZXlUeXBlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZnJvbVNjaGVtYUtleVR5cGUoZGF0YS5rZXlfdHlwZSk7XG4gIH1cblxuICAvKiogSXMgdGhlIGtleSBlbmFibGVkPyAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIGtleS4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBrZXkuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCByb2xlcyB0aGlzIGtleSBpcyBpbi5cbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgcm9sZXMgdGhpcyBrZXkgaXMgaW4uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8S2V5SW5Sb2xlSW5mb1tdPn0gUm9sZXMgdGhpcyBrZXkgaXMgaW4uXG4gICAqL1xuICBhc3luYyByb2xlcyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEtleUluUm9sZUluZm9bXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5Um9sZXNMaXN0KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBwb2xpY2llcyBwcmV2aW91c2x5IHNldCBmb3IgdGhpcyBrZXkpXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5fSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgdG8gc2V0XG4gICAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBLZXlQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGtleSBtZXRhZGF0YS4gVGhlIG1ldGFkYXRhIG11c3QgYmUgYXQgbW9zdCAxMDI0IGNoYXJhY3RlcnNcbiAgICogYW5kIG11c3QgbWF0Y2ggdGhlIGZvbGxvd2luZyByZWdleDogXltBLVphLXowLTlfPSsvIFxcLVxcLlxcLF17MCwxMDI0fSQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRhZGF0YSBUaGUgbmV3IG1ldGFkYXRhIHRvIHNldC5cbiAgICovXG4gIGFzeW5jIHNldE1ldGFkYXRhKG1ldGFkYXRhOiBKc29uVmFsdWUpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBtZXRhZGF0YSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIG1ldGFkYXRhLCBhc3NlcnRzIHRoYXQgaXQgaXMgYW4gb2JqZWN0ICh0aHJvd3MgaWYgaXQgaXMgbm90KSxcbiAgICogdGhlbiBzZXRzIHRoZSB2YWx1ZSBvZiB0aGUge0BsaW5rIG5hbWV9IHByb3BlcnR5IGluIHRoYXQgb2JqZWN0IHRvIHtAbGluayB2YWx1ZX0sXG4gICAqIGFuZCBmaW5hbGx5IHN1Ym1pdHMgdGhlIHJlcXVlc3QgdG8gdXBkYXRlIHRoZSBtZXRhZGF0YS5cbiAgICpcbiAgICogVGhpcyB3aG9sZSBwcm9jZXNzIGlzIGRvbmUgYXRvbWljYWxseSwgbWVhbmluZywgdGhhdCBpZiB0aGUgbWV0YWRhdGEgY2hhbmdlcyBiZXR3ZWVuIHRoZVxuICAgKiB0aW1lIHRoaXMgbWV0aG9kIGZpcnN0IHJldHJpZXZlcyBpdCBhbmQgdGhlIHRpbWUgaXQgc3VibWl0cyBhIHJlcXVlc3QgdG8gdXBkYXRlIGl0LCB0aGVcbiAgICogcmVxdWVzdCB3aWxsIGJlIHJlamVjdGVkLiBXaGVuIHRoYXQgaGFwcGVucywgdGhpcyBtZXRob2Qgd2lsbCByZXRyeSBhIGZldyB0aW1lcywgYXMgcGVyXG4gICAqIHtAbGluayBBcGlDbGllbnQuY29uZmlnfS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHNldFxuICAgKiBAcGFyYW0ge0pzb25WYWx1ZX0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICogQHJldHVybiB7UHJvbWlzZTxLZXlJbmZvPn0gVXBkYXRlZCBrZXkgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIHNldE1ldGFkYXRhUHJvcGVydHkobmFtZTogc3RyaW5nLCB2YWx1ZTogSnNvblZhbHVlKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NldE1ldGFkYXRhUHJvcGVydHkobmFtZSwgdmFsdWUsIHRoaXMuI2FwaUNsaWVudC5jb25maWcudXBkYXRlUmV0cnlEZWxheXNNcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBleGlzdGluZyBtZXRhZGF0YSwgYXNzZXJ0cyB0aGF0IGl0IGlzIGluIG9iamVjdCAodGhyb3dzIGlmIGl0IGlzIG5vdCksXG4gICAqIHRoZW4gZGVsZXRlcyB0aGUge0BsaW5rIG5hbWV9IHByb3BlcnR5IGluIHRoYXQgb2JqZWN0LCBhbmQgZmluYWxseSBzdWJtaXRzIHRoZVxuICAgKiByZXF1ZXN0IHRvIHVwZGF0ZSB0aGUgbWV0YWRhdGEuXG4gICAqXG4gICAqIFRoaXMgd2hvbGUgcHJvY2VzcyBpcyBkb25lIGF0b21pY2FsbHksIG1lYW5pbmcsIHRoYXQgaWYgdGhlIG1ldGFkYXRhIGNoYW5nZXMgYmV0d2VlbiB0aGVcbiAgICogdGltZSB0aGlzIG1ldGhvZCBmaXJzdCByZXRyaWV2ZXMgaXQgYW5kIHRoZSB0aW1lIGl0IHN1Ym1pdHMgYSByZXF1ZXN0IHRvIHVwZGF0ZSBpdCwgdGhlXG4gICAqIHJlcXVlc3Qgd2lsbCBiZSByZWplY3RlZC4gV2hlbiB0aGF0IGhhcHBlbnMsIHRoaXMgbWV0aG9kIHdpbGwgcmV0cnkgYSBmZXcgdGltZXMsIGFzIHBlclxuICAgKiB7QGxpbmsgQXBpQ2xpZW50LmNvbmZpZ30uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBzZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxLZXlJbmZvPn0gVXBkYXRlZCBrZXkgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIGRlbGV0ZU1ldGFkYXRhUHJvcGVydHkobmFtZTogc3RyaW5nKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NldE1ldGFkYXRhUHJvcGVydHkoXG4gICAgICBuYW1lLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgdGhpcy4jYXBpQ2xpZW50LmNvbmZpZy51cGRhdGVSZXRyeURlbGF5c01zLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHNldFxuICAgKiBAcGFyYW0ge0pzb25WYWx1ZX0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gZGVsYXlzTXMgRGVsYXlzIGluIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIHJldHJpZXNcbiAgICogQHJldHVybiB7UHJvbWlzZTxLZXlJbmZvPn0gVXBkYXRlZCBrZXkgaW5mb3JtYXRpb25cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyAjc2V0TWV0YWRhdGFQcm9wZXJ0eShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IEpzb25WYWx1ZSB8IHVuZGVmaW5lZCxcbiAgICBkZWxheXNNczogbnVtYmVyW10sXG4gICk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgY29uc3QgY3VycmVudCA9IGRhdGEubWV0YWRhdGEgPz8ge307XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDdXJyZW50IG1ldGFkYXRhIGlzIG5vdCBhIEpTT04gb2JqZWN0XCIpO1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGVkID0ge1xuICAgICAgLi4uY3VycmVudCxcbiAgICAgIFtuYW1lXTogdmFsdWUsXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgICAgbWV0YWRhdGE6IHVwZGF0ZWQsXG4gICAgICAgIHZlcnNpb246IGRhdGEudmVyc2lvbixcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICgoZSBhcyBFcnJSZXNwb25zZSkuZXJyb3JDb2RlID09PSBcIkludmFsaWRVcGRhdGVcIiAmJiBkZWxheXNNcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGF3YWl0IGRlbGF5KGRlbGF5c01zWzBdKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NldE1ldGFkYXRhUHJvcGVydHkobmFtZSwgdmFsdWUsIGRlbGF5c01zLnNsaWNlKDEpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCB0byBleGlzdGluZyBrZXkgcG9saWN5LiBUaGlzIGFwcGVuZCBpcyBub3QgYXRvbWljIC0tIGl0IHVzZXMge0BsaW5rIHBvbGljeX1cbiAgICogdG8gZmV0Y2ggdGhlIGN1cnJlbnQgcG9saWN5IGFuZCB0aGVuIHtAbGluayBzZXRQb2xpY3l9IHRvIHNldCB0aGUgcG9saWN5IC0tIGFuZFxuICAgKiBzaG91bGQgbm90IGJlIHVzZWQgaW4gYWNyb3NzIGNvbmN1cnJlbnQgc2Vzc2lvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5fSBwb2xpY3kgVGhlIHBvbGljeSB0byBhcHBlbmQgdG8gdGhlIGV4aXN0aW5nIG9uZS5cbiAgICovXG4gIGFzeW5jIGFwcGVuZFBvbGljeShwb2xpY3k6IEtleVBvbGljeSkge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUga2V5LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleVBvbGljeT59IFRoZSBwb2xpY3kgZm9yIHRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxLZXlQb2xpY3k+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgS2V5UG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBtZXRhZGF0YSBmb3IgdGhlIGtleS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxKc29uVmFsdWU+fSBUaGUgcG9saWN5IGZvciB0aGUga2V5LlxuICAgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxKc29uVmFsdWU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm1ldGFkYXRhIGFzIEpzb25WYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gT3duZXIgb2YgdGhlIGtleVxuICAgKiBAZXhhbXBsZSBVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgYXN5bmMgb3duZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm93bmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgb3duZXIgb2YgdGhlIGtleS4gT25seSB0aGUga2V5IChvciBvcmcpIG93bmVyIGNhbiBjaGFuZ2UgdGhlIG93bmVyIG9mIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvd25lciBUaGUgdXNlci1pZCBvZiB0aGUgbmV3IG93bmVyIG9mIHRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBzZXRPd25lcihvd25lcjogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBvd25lciB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhpcyBrZXkuXG4gICAqL1xuICBhc3luYyBkZWxldGUoKSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleURlbGV0ZSh0aGlzLmlkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50IHwgQ3ViZVNpZ25lckNsaWVudH0gY2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtLZXlJbmZvfSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoY2xpZW50OiBBcGlDbGllbnQgfCBDdWJlU2lnbmVyQ2xpZW50LCBkYXRhOiBLZXlJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gY2xpZW50IGluc3RhbmNlb2YgQ3ViZVNpZ25lckNsaWVudCA/IGNsaWVudC5hcGlDbGllbnQgOiBjbGllbnQ7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RXZtU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxFdm1TaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRXZtKFxuICAgIHJlcTogRXZtU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25Fdm0odGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIEVJUC0xOTEgdHlwZWQgZGF0YS5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0VpcDE5MVNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqXG4gICAqIEBwYXJhbSB7QmxvYlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV2bVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXAxOTEoXG4gICAgcmVxOiBFaXAxOTFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RWlwMTkxT3I3MTJTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduRWlwMTkxKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtNzEyIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXA3MTJTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0ge0Jsb2JTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFdm1TaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKFxuICAgIHJlcTogRWlwNzEyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkVpcDcxMih0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdmFsaWRhdGlvbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0V0aDJTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXRoMlNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIHNpZ25FdGgyKFxuICAgIHJlcTogRXRoMlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkV0aDIodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHVuc3Rha2UvZXhpdCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge0V0aDJVbnN0YWtlUmVxdWVzdH0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJVbnN0YWtlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdW5zdGFrZShcbiAgICByZXE6IEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25VbnN0YWtlKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBBdmFsYW5jaGUgUC0gb3IgWC1jaGFpbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0F2YVR4fSB0eCBBdmFsYW5jaGUgbWVzc2FnZSAodHJhbnNhY3Rpb24pIHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8QXZhU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25BdmEodHg6IEF2YVR4LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25BdmEodGhpcywgdHgsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSByYXcgYmxvYi5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LiBUaGlzIGlzIGJlY2F1c2VcbiAgICogc2lnbmluZyBhcmJpdHJhcnkgbWVzc2FnZXMgaXMsIGluIGdlbmVyYWwsIGRhbmdlcm91cyAoYW5kIHlvdSBzaG91bGQgaW5zdGVhZFxuICAgKiBwcmVmZXIgdHlwZWQgZW5kLXBvaW50cyBhcyB1c2VkIGJ5LCBmb3IgZXhhbXBsZSwge0BsaW5rIHNpZ25Fdm19KS4gRm9yIFNlY3AyNTZrMSBrZXlzLFxuICAgKiBmb3IgZXhhbXBsZSwgeW91ICoqbXVzdCoqIGNhbGwgdGhpcyBmdW5jdGlvbiB3aXRoIGEgbWVzc2FnZSB0aGF0IGlzIDMyIGJ5dGVzIGxvbmcgYW5kXG4gICAqIHRoZSBvdXRwdXQgb2YgYSBzZWN1cmUgaGFzaCBmdW5jdGlvbi5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHNpZ25hdHVyZXMgc2VyaWFsaXplZCBhcztcbiAgICpcbiAgICogLSBFQ0RTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGFzIGJpZy1lbmRpYW4gciBhbmQgcyBwbHVzIHJlY292ZXJ5LWlkXG4gICAqICAgIGJ5dGUgdiwgd2hpY2ggY2FuIGluIGdlbmVyYWwgdGFrZSBhbnkgb2YgdGhlIHZhbHVlcyAwLCAxLCAyLCBvciAzLlxuICAgKlxuICAgKiAtIEVkRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgaW4gdGhlIHN0YW5kYXJkIGZvcm1hdC5cbiAgICpcbiAgICogLSBCTFMgc2lnbmF0dXJlcyBhcmUgbm90IHN1cHBvcnRlZCBvbiB0aGUgYmxvYi1zaWduIGVuZHBvaW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0Jsb2JTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCbG9iU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKFxuICAgIHJlcTogQmxvYlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCbG9iU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkJsb2IodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0J0Y1NpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEJ0Y1NpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQnRjKFxuICAgIHJlcTogQnRjU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJ0Y1NpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25CdGModGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgU29sYW5hIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U29sYW5hU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8U29sYW5hU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25Tb2xhbmEoXG4gICAgcmVxOiBTb2xhbmFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U29sYW5hU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblNvbGFuYSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUga2V5LlxuICAgKiBAcGFyYW0ge1VwZGF0ZUtleVJlcXVlc3R9IHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZUtleVJlcXVlc3QpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleVVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0KTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUga2V5IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXQodGhpcy5pZCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgc2NoZW1hIGtleSB0eXBlIHRvIGEga2V5IHR5cGUuXG4gKlxuICogQHBhcmFtIHtTY2hlbWFLZXlUeXBlfSB0eSBUaGUgc2NoZW1hIGtleSB0eXBlLlxuICogQHJldHVybiB7S2V5VHlwZX0gVGhlIGtleSB0eXBlLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tU2NoZW1hS2V5VHlwZSh0eTogU2NoZW1hS2V5VHlwZSk6IEtleVR5cGUge1xuICBzd2l0Y2ggKHR5KSB7XG4gICAgY2FzZSBcIlNlY3BFdGhBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkV2bTtcbiAgICBjYXNlIFwiU2VjcEJ0Y1wiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGM7XG4gICAgY2FzZSBcIlNlY3BCdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0Y1Rlc3Q7XG4gICAgY2FzZSBcIlNlY3BBdmFBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YTtcbiAgICBjYXNlIFwiU2VjcEF2YVRlc3RBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YVRlc3Q7XG4gICAgY2FzZSBcIkJhYnlsb25Fb3RzXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJhYnlsb25Fb3RzO1xuICAgIGNhc2UgXCJUYXByb290QnRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlRhcHJvb3Q7XG4gICAgY2FzZSBcIlRhcHJvb3RCdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlRhcHJvb3RUZXN0O1xuICAgIGNhc2UgXCJCbHNQdWJcIjpcbiAgICAgIHJldHVybiBCbHMuRXRoMkRlcG9zaXRlZDtcbiAgICBjYXNlIFwiQmxzSW5hY3RpdmVcIjpcbiAgICAgIHJldHVybiBCbHMuRXRoMkluYWN0aXZlO1xuICAgIGNhc2UgXCJFZDI1NTE5U29sYW5hQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU29sYW5hO1xuICAgIGNhc2UgXCJFZDI1NTE5U3VpQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU3VpO1xuICAgIGNhc2UgXCJFZDI1NTE5QXB0b3NBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5BcHRvcztcbiAgICBjYXNlIFwiRWQyNTUxOUNhcmRhbm9BZGRyVmtcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LkNhcmRhbm87XG4gICAgY2FzZSBcIkVkMjU1MTlTdGVsbGFyQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU3RlbGxhcjtcbiAgICBjYXNlIFwiU3RhcmtcIjpcbiAgICAgIHJldHVybiBTdGFyaztcbiAgICBjYXNlIFwiTW5lbW9uaWNcIjpcbiAgICAgIHJldHVybiBNbmVtb25pYztcbiAgfVxufVxuIl19