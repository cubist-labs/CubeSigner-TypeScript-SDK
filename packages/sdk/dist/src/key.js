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
var _Key_instances, _Key_apiClient, _Key_setMetadataProperty;
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
})(Secp256k1 = exports.Secp256k1 || (exports.Secp256k1 = {}));
/** BLS key type */
var Bls;
(function (Bls) {
    Bls["Eth2Deposited"] = "BlsPub";
    Bls["Eth2Inactive"] = "BlsInactive";
})(Bls = exports.Bls || (exports.Bls = {}));
/** Ed25519 key type */
var Ed25519;
(function (Ed25519) {
    Ed25519["Solana"] = "Ed25519SolanaAddr";
    Ed25519["Sui"] = "Ed25519SuiAddr";
    Ed25519["Aptos"] = "Ed25519AptosAddr";
    Ed25519["Cardano"] = "Ed25519CardanoAddrVk";
    Ed25519["Stellar"] = "Ed25519StellarAddr";
})(Ed25519 = exports.Ed25519 || (exports.Ed25519 = {}));
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
        __classPrivateFieldSet(this, _Key_apiClient, client instanceof _1.CubeSignerClient ? client.apiClient : client, "f");
        this.id = data.key_id;
        this.materialId = data.material_id;
        this.publicKey = data.public_key;
        this.cached = data;
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
     * Sign a serialized Avalanche C-/X-/P-chain message.
     *
     * @param {AvaChain} avaChain Avalanche chain
     * @param {string} tx Hex encoded transaction
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    async signSerializedAva(avaChain, tx, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signSerializedAva(this, avaChain, tx, mfaReceipt);
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
        this.cached = await __classPrivateFieldGet(this, _Key_apiClient, "f").keyUpdate(this.id, request);
        return this.cached;
    }
    /**
     * Fetch the key information.
     *
     * @return {KeyInfo} The key information.
     * @internal
     */
    async fetch() {
        this.cached = await __classPrivateFieldGet(this, _Key_apiClient, "f").keyGet(this.id);
        return this.cached;
    }
}
exports.Key = Key;
_Key_apiClient = new WeakMap(), _Key_instances = new WeakSet(), _Key_setMetadataProperty = 
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFpQ0Esd0JBQTRDO0FBRTVDLHlCQUF5QjtBQUN6QixJQUFZLFNBU1g7QUFURCxXQUFZLFNBQVM7SUFDbkIsZ0NBQW1CLENBQUE7SUFDbkIsNEJBQWUsQ0FBQTtJQUNmLG9DQUF1QixDQUFBO0lBQ3ZCLG1DQUFzQixDQUFBO0lBQ3RCLDJDQUE4QixDQUFBO0lBQzlCLHdDQUEyQixDQUFBO0lBQzNCLGdDQUFtQixDQUFBO0lBQ25CLHdDQUEyQixDQUFBO0FBQzdCLENBQUMsRUFUVyxTQUFTLEdBQVQsaUJBQVMsS0FBVCxpQkFBUyxRQVNwQjtBQUVELG1CQUFtQjtBQUNuQixJQUFZLEdBR1g7QUFIRCxXQUFZLEdBQUc7SUFDYiwrQkFBd0IsQ0FBQTtJQUN4QixtQ0FBNEIsQ0FBQTtBQUM5QixDQUFDLEVBSFcsR0FBRyxHQUFILFdBQUcsS0FBSCxXQUFHLFFBR2Q7QUFFRCx1QkFBdUI7QUFDdkIsSUFBWSxPQU1YO0FBTkQsV0FBWSxPQUFPO0lBQ2pCLHVDQUE0QixDQUFBO0lBQzVCLGlDQUFzQixDQUFBO0lBQ3RCLHFDQUEwQixDQUFBO0lBQzFCLDJDQUFnQyxDQUFBO0lBQ2hDLHlDQUE4QixDQUFBO0FBQ2hDLENBQUMsRUFOVyxPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUFNbEI7QUFFRCx3QkFBd0I7QUFDWCxRQUFBLFFBQVEsR0FBRyxVQUFtQixDQUFDO0FBRzVDLHFCQUFxQjtBQUNSLFFBQUEsS0FBSyxHQUFHLE9BQWdCLENBQUM7QUFNdEM7O0dBRUc7QUFDSCxNQUFhLEdBQUc7SUFJZCwyQ0FBMkM7SUFDM0MsSUFBSSxLQUFLO1FBQ1AsT0FBTyx1QkFBQSxJQUFJLHNCQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztJQUM1QyxDQUFDO0lBOEJELHVCQUF1QjtJQUN2QixLQUFLLENBQUMs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QUMzQixLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDO1FBQy9CLEtBQUssWUFBWTtZQUNmLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUMzQixLQUFLLGdCQUFnQjtZQUNuQixPQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFDL0IsS0FBSyxRQUFRO1lBQ1gsT0FBTyxHQUFHLENBQUMsYUFBYSxDQUFDO1FBQzNCLEtBQUssYUFBYTtZQUNoQixPQUFPLEdBQUcsQ0FBQyxZQUFZLENBQUM7UUFDMUIsS0FBSyxtQkFBbUI7WUFDdEIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ3hCLEtBQUssZ0JBQWdCO1lBQ25CLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNyQixLQUFLLGtCQUFrQjtZQUNyQixPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDdkIsS0FBSyxzQkFBc0I7WUFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3pCLEtBQUssb0JBQW9CO1lBQ3ZCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUN6QixLQUFLLE9BQU87WUFDVixPQUFPLGFBQUssQ0FBQztRQUNmLEtBQUssVUFBVTtZQUNiLE9BQU8sZ0JBQVEsQ0FBQztLQUNuQjtBQUNILENBQUM7QUFyQ0QsOENBcUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBLZXlQb2xpY3kgfSBmcm9tIFwiLi9yb2xlXCI7XG5pbXBvcnQgdHlwZSB7IFBhZ2VPcHRzIH0gZnJvbSBcIi4vcGFnaW5hdG9yXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEtleUluZm8sXG4gIFVwZGF0ZUtleVJlcXVlc3QsXG4gIFNjaGVtYUtleVR5cGUsXG4gIEtleUluUm9sZUluZm8sXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVzcG9uc2UsXG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRXRoMlNpZ25SZXF1ZXN0LFxuICBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gIEF2YVR4LFxuICBCbG9iU2lnblJlcXVlc3QsXG4gIEJ0Y1NpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVxdWVzdCxcbiAgU29sYW5hU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVzcG9uc2UsXG4gIEJsb2JTaWduUmVzcG9uc2UsXG4gIEF2YVNpZ25SZXNwb25zZSxcbiAgRXRoMlVuc3Rha2VSZXNwb25zZSxcbiAgRXRoMlNpZ25SZXNwb25zZSxcbiAgRWlwMTkxT3I3MTJTaWduUmVzcG9uc2UsXG59IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHR5cGUge1xuICBBcGlDbGllbnQsXG4gIEF2YUNoYWluLFxuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEVyclJlc3BvbnNlLFxuICBKc29uVmFsdWUsXG4gIE1mYVJlY2VpcHQsXG59IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50LCBkZWxheSB9IGZyb20gXCIuXCI7XG5cbi8qKiBTZWNwMjU2azEga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIFNlY3AyNTZrMSB7XG4gIEV2bSA9IFwiU2VjcEV0aEFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGMgPSBcIlNlY3BCdGNcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGNUZXN0ID0gXCJTZWNwQnRjVGVzdFwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFRhcHJvb3QgPSBcIlRhcHJvb3RCdGNcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBUYXByb290VGVzdCA9IFwiVGFwcm9vdEJ0Y1Rlc3RcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCYWJ5bG9uRW90cyA9IFwiQmFieWxvbkVvdHNcIixcbiAgQXZhID0gXCJTZWNwQXZhQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEF2YVRlc3QgPSBcIlNlY3BBdmFUZXN0QWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBCTFMga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIEJscyB7XG4gIEV0aDJEZXBvc2l0ZWQgPSBcIkJsc1B1YlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV0aDJJbmFjdGl2ZSA9IFwiQmxzSW5hY3RpdmVcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogRWQyNTUxOSBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gRWQyNTUxOSB7XG4gIFNvbGFuYSA9IFwiRWQyNTUxOVNvbGFuYUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBTdWkgPSBcIkVkMjU1MTlTdWlBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQXB0b3MgPSBcIkVkMjU1MTlBcHRvc0FkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBDYXJkYW5vID0gXCJFZDI1NTE5Q2FyZGFub0FkZHJWa1wiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFN0ZWxsYXIgPSBcIkVkMjU1MTlTdGVsbGFyQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBNbmVtb25pYyBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IE1uZW1vbmljID0gXCJNbmVtb25pY1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgTW5lbW9uaWMgPSB0eXBlb2YgTW5lbW9uaWM7XG5cbi8qKiBTdGFyayBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IFN0YXJrID0gXCJTdGFya1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgU3RhcmsgPSB0eXBlb2YgU3Rhcms7XG5cbi8qKiBLZXkgdHlwZSAqL1xuZXhwb3J0IHR5cGUgS2V5VHlwZSA9IFNlY3AyNTZrMSB8IEJscyB8IEVkMjU1MTkgfCBNbmVtb25pYyB8IFN0YXJrO1xuXG4vKipcbiAqIEEgcmVwcmVzZW50YXRpb24gb2YgYSBzaWduaW5nIGtleS5cbiAqL1xuZXhwb3J0IGNsYXNzIEtleSB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0aGF0IHRoaXMga2V5IGlzIGFzc29jaWF0ZWQgd2l0aCAqL1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG5cbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGlzIGtleSBpcyBpbiAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGlkIG9mIHRoZSBrZXk6IFwiS2V5I1wiIGZvbGxvd2VkIGJ5IGEgdW5pcXVlIGlkZW50aWZpZXIgc3BlY2lmaWMgdG9cbiAgICogdGhlIHR5cGUgb2Yga2V5IChzdWNoIGFzIGEgcHVibGljIGtleSBmb3IgQkxTIG9yIGFuIGV0aGVyZXVtIGFkZHJlc3MgZm9yIFNlY3ApXG4gICAqIEBleGFtcGxlIEtleSMweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICovXG4gIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEEgdW5pcXVlIGlkZW50aWZpZXIgc3BlY2lmaWMgdG8gdGhlIHR5cGUgb2Yga2V5LCBzdWNoIGFzIGEgcHVibGljIGtleSBvciBhbiBldGhlcmV1bSBhZGRyZXNzXG4gICAqIEBleGFtcGxlIDB4OGUzNDg0Njg3ZTY2Y2RkMjZjZjA0YzM2NDc2MzNhYjRmMzU3MDE0OFxuICAgKi9cbiAgcmVhZG9ubHkgbWF0ZXJpYWxJZCE6IHN0cmluZztcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIEhleC1lbmNvZGVkLCBzZXJpYWxpemVkIHB1YmxpYyBrZXkuIFRoZSBmb3JtYXQgdXNlZCBkZXBlbmRzIG9uIHRoZSBrZXkgdHlwZTpcbiAgICogLSBzZWNwMjU2azEga2V5cyB1c2UgNjUtYnl0ZSB1bmNvbXByZXNzZWQgU0VDRyBmb3JtYXRcbiAgICogLSBCTFMga2V5cyB1c2UgNDgtYnl0ZSBjb21wcmVzc2VkIEJMUzEyLTM4MSAoWkNhc2gpIGZvcm1hdFxuICAgKiBAZXhhbXBsZSAweDA0ZDI2ODhiNmJjMmNlN2Y5ODc5YjllNzQ1ZjNjNGRjMTc3OTA4YzVjZWYwYzFiNjRjZmYxOWFlN2ZmMjdkZWU2MjNjNjRmZTlkOWMzMjVjN2ZiYmM3NDhiYmQ1ZjYwN2NlMTRkZDgzZTI4ZWJiYmI3ZDNlN2YyZmZiNzBhNzk0MzFcbiAgICovXG4gIHJlYWRvbmx5IHB1YmxpY0tleTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMga2V5LiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlIChlLmcuLCBhZnRlciBhd2FpdGluZyBgS2V5LmVuYWJsZWQoKWBcbiAgICogb3IgYEtleS5kaXNhYmxlKClgKS5cbiAgICovXG4gIGNhY2hlZDogS2V5SW5mbztcblxuICAvKiogVGhlIHR5cGUgb2Yga2V5LiAqL1xuICBhc3luYyB0eXBlKCk6IFByb21pc2U8S2V5VHlwZT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGZyb21TY2hlbWFLZXlUeXBlKGRhdGEua2V5X3R5cGUpO1xuICB9XG5cbiAgLyoqIElzIHRoZSBrZXkgZW5hYmxlZD8gKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKiogRW5hYmxlIHRoZSBrZXkuICovXG4gIGFzeW5jIGVuYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUga2V5LiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGxpc3Qgcm9sZXMgdGhpcyBrZXkgaXMgaW4uXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIHJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleUluUm9sZUluZm9bXT59IFJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlJblJvbGVJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleVJvbGVzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBuZXcgcG9saWN5IChvdmVyd3JpdGluZyBhbnkgcG9saWNpZXMgcHJldmlvdXNseSBzZXQgZm9yIHRoaXMga2V5KVxuICAgKiBAcGFyYW0ge0tleVBvbGljeX0gcG9saWN5IFRoZSBuZXcgcG9saWN5IHRvIHNldFxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogS2V5UG9saWN5KSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3k6IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBrZXkgbWV0YWRhdGEuIFRoZSBtZXRhZGF0YSBtdXN0IGJlIGF0IG1vc3QgMTAyNCBjaGFyYWN0ZXJzXG4gICAqIGFuZCBtdXN0IG1hdGNoIHRoZSBmb2xsb3dpbmcgcmVnZXg6IF5bQS1aYS16MC05Xz0rLyBcXC1cXC5cXCxdezAsMTAyNH0kLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWV0YWRhdGEgVGhlIG5ldyBtZXRhZGF0YSB0byBzZXQuXG4gICAqL1xuICBhc3luYyBzZXRNZXRhZGF0YShtZXRhZGF0YTogSnNvblZhbHVlKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgbWV0YWRhdGEgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBleGlzdGluZyBtZXRhZGF0YSwgYXNzZXJ0cyB0aGF0IGl0IGlzIGFuIG9iamVjdCAodGhyb3dzIGlmIGl0IGlzIG5vdCksXG4gICAqIHRoZW4gc2V0cyB0aGUgdmFsdWUgb2YgdGhlIHtAbGluayBuYW1lfSBwcm9wZXJ0eSBpbiB0aGF0IG9iamVjdCB0byB7QGxpbmsgdmFsdWV9LFxuICAgKiBhbmQgZmluYWxseSBzdWJtaXRzIHRoZSByZXF1ZXN0IHRvIHVwZGF0ZSB0aGUgbWV0YWRhdGEuXG4gICAqXG4gICAqIFRoaXMgd2hvbGUgcHJvY2VzcyBpcyBkb25lIGF0b21pY2FsbHksIG1lYW5pbmcsIHRoYXQgaWYgdGhlIG1ldGFkYXRhIGNoYW5nZXMgYmV0d2VlbiB0aGVcbiAgICogdGltZSB0aGlzIG1ldGhvZCBmaXJzdCByZXRyaWV2ZXMgaXQgYW5kIHRoZSB0aW1lIGl0IHN1Ym1pdHMgYSByZXF1ZXN0IHRvIHVwZGF0ZSBpdCwgdGhlXG4gICAqIHJlcXVlc3Qgd2lsbCBiZSByZWplY3RlZC4gV2hlbiB0aGF0IGhhcHBlbnMsIHRoaXMgbWV0aG9kIHdpbGwgcmV0cnkgYSBmZXcgdGltZXMsIGFzIHBlclxuICAgKiB7QGxpbmsgQXBpQ2xpZW50LmNvbmZpZ30uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBzZXRcbiAgICogQHBhcmFtIHtKc29uVmFsdWV9IHZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIHByb3BlcnR5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8S2V5SW5mbz59IFVwZGF0ZWQga2V5IGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBzZXRNZXRhZGF0YVByb3BlcnR5KG5hbWU6IHN0cmluZywgdmFsdWU6IEpzb25WYWx1ZSk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzZXRNZXRhZGF0YVByb3BlcnR5KG5hbWUsIHZhbHVlLCB0aGlzLiNhcGlDbGllbnQuY29uZmlnLnVwZGF0ZVJldHJ5RGVsYXlzTXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgZXhpc3RpbmcgbWV0YWRhdGEsIGFzc2VydHMgdGhhdCBpdCBpcyBpbiBvYmplY3QgKHRocm93cyBpZiBpdCBpcyBub3QpLFxuICAgKiB0aGVuIGRlbGV0ZXMgdGhlIHtAbGluayBuYW1lfSBwcm9wZXJ0eSBpbiB0aGF0IG9iamVjdCwgYW5kIGZpbmFsbHkgc3VibWl0cyB0aGVcbiAgICogcmVxdWVzdCB0byB1cGRhdGUgdGhlIG1ldGFkYXRhLlxuICAgKlxuICAgKiBUaGlzIHdob2xlIHByb2Nlc3MgaXMgZG9uZSBhdG9taWNhbGx5LCBtZWFuaW5nLCB0aGF0IGlmIHRoZSBtZXRhZGF0YSBjaGFuZ2VzIGJldHdlZW4gdGhlXG4gICAqIHRpbWUgdGhpcyBtZXRob2QgZmlyc3QgcmV0cmlldmVzIGl0IGFuZCB0aGUgdGltZSBpdCBzdWJtaXRzIGEgcmVxdWVzdCB0byB1cGRhdGUgaXQsIHRoZVxuICAgKiByZXF1ZXN0IHdpbGwgYmUgcmVqZWN0ZWQuIFdoZW4gdGhhdCBoYXBwZW5zLCB0aGlzIG1ldGhvZCB3aWxsIHJldHJ5IGEgZmV3IHRpbWVzLCBhcyBwZXJcbiAgICoge0BsaW5rIEFwaUNsaWVudC5jb25maWd9LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gc2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8S2V5SW5mbz59IFVwZGF0ZWQga2V5IGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBkZWxldGVNZXRhZGF0YVByb3BlcnR5KG5hbWU6IHN0cmluZyk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzZXRNZXRhZGF0YVByb3BlcnR5KFxuICAgICAgbmFtZSxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIHRoaXMuI2FwaUNsaWVudC5jb25maWcudXBkYXRlUmV0cnlEZWxheXNNcyxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBzZXRcbiAgICogQHBhcmFtIHtKc29uVmFsdWV9IHZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgdGhlIHByb3BlcnR5XG4gICAqIEBwYXJhbSB7bnVtYmVyW119IGRlbGF5c01zIERlbGF5cyBpbiBtaWxsaXNlY29uZHMgYmV0d2VlbiByZXRyaWVzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8S2V5SW5mbz59IFVwZGF0ZWQga2V5IGluZm9ybWF0aW9uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgI3NldE1ldGFkYXRhUHJvcGVydHkoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlOiBKc29uVmFsdWUgfCB1bmRlZmluZWQsXG4gICAgZGVsYXlzTXM6IG51bWJlcltdLFxuICApOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBkYXRhLm1ldGFkYXRhID8/IHt9O1xuICAgIGlmICh0eXBlb2YgY3VycmVudCAhPT0gXCJvYmplY3RcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudCBtZXRhZGF0YSBpcyBub3QgYSBKU09OIG9iamVjdFwiKTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlZCA9IHtcbiAgICAgIC4uLmN1cnJlbnQsXG4gICAgICBbbmFtZV06IHZhbHVlLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7XG4gICAgICAgIG1ldGFkYXRhOiB1cGRhdGVkLFxuICAgICAgICB2ZXJzaW9uOiBkYXRhLnZlcnNpb24sXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoKGUgYXMgRXJyUmVzcG9uc2UpLmVycm9yQ29kZSA9PT0gXCJJbnZhbGlkVXBkYXRlXCIgJiYgZGVsYXlzTXMubGVuZ3RoID4gMCkge1xuICAgICAgICBhd2FpdCBkZWxheShkZWxheXNNc1swXSk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLiNzZXRNZXRhZGF0YVByb3BlcnR5KG5hbWUsIHZhbHVlLCBkZWxheXNNcy5zbGljZSgxKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgdG8gZXhpc3Rpbmcga2V5IHBvbGljeS4gVGhpcyBhcHBlbmQgaXMgbm90IGF0b21pYyAtLSBpdCB1c2VzIHtAbGluayBwb2xpY3l9XG4gICAqIHRvIGZldGNoIHRoZSBjdXJyZW50IHBvbGljeSBhbmQgdGhlbiB7QGxpbmsgc2V0UG9saWN5fSB0byBzZXQgdGhlIHBvbGljeSAtLSBhbmRcbiAgICogc2hvdWxkIG5vdCBiZSB1c2VkIGluIGFjcm9zcyBjb25jdXJyZW50IHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVBvbGljeX0gcG9saWN5IFRoZSBwb2xpY3kgdG8gYXBwZW5kIHRvIHRoZSBleGlzdGluZyBvbmUuXG4gICAqL1xuICBhc3luYyBhcHBlbmRQb2xpY3kocG9saWN5OiBLZXlQb2xpY3kpIHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMucG9saWN5KCk7XG4gICAgYXdhaXQgdGhpcy5zZXRQb2xpY3koWy4uLmV4aXN0aW5nLCAuLi5wb2xpY3ldKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIGtleS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxLZXlQb2xpY3k+fSBUaGUgcG9saWN5IGZvciB0aGUga2V5LlxuICAgKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8S2V5UG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIEtleVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgbWV0YWRhdGEgZm9yIHRoZSBrZXkuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SnNvblZhbHVlPn0gVGhlIHBvbGljeSBmb3IgdGhlIGtleS5cbiAgICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8SnNvblZhbHVlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5tZXRhZGF0YSBhcyBKc29uVmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIE93bmVyIG9mIHRoZSBrZXlcbiAgICogQGV4YW1wbGUgVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICovXG4gIGFzeW5jIG93bmVyKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5vd25lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIG93bmVyIG9mIHRoZSBrZXkuIE9ubHkgdGhlIGtleSAob3Igb3JnKSBvd25lciBjYW4gY2hhbmdlIHRoZSBvd25lciBvZiB0aGUga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3duZXIgVGhlIHVzZXItaWQgb2YgdGhlIG5ldyBvd25lciBvZiB0aGUga2V5LlxuICAgKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgb3duZXIgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoaXMga2V5LlxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKCkge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlEZWxldGUodGhpcy5pZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudCB8IEN1YmVTaWduZXJDbGllbnR9IGNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSB7S2V5SW5mb30gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNsaWVudDogQXBpQ2xpZW50IHwgQ3ViZVNpZ25lckNsaWVudCwgZGF0YTogS2V5SW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGNsaWVudCBpbnN0YW5jZW9mIEN1YmVTaWduZXJDbGllbnQgPyBjbGllbnQuYXBpQ2xpZW50IDogY2xpZW50O1xuICAgIHRoaXMuaWQgPSBkYXRhLmtleV9pZDtcbiAgICB0aGlzLm1hdGVyaWFsSWQgPSBkYXRhLm1hdGVyaWFsX2lkO1xuICAgIHRoaXMucHVibGljS2V5ID0gZGF0YS5wdWJsaWNfa2V5O1xuICAgIHRoaXMuY2FjaGVkID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEVWTSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtFdm1TaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV2bVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25Fdm0oXG4gICAgcmVxOiBFdm1TaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkV2bSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTE5MSB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwMTkxU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDE5MShcbiAgICByZXE6IEVpcDE5MVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25FaXAxOTEodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIEVJUC03MTIgdHlwZWQgZGF0YS5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0VpcDcxMlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqXG4gICAqIEBwYXJhbSB7QmxvYlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV2bVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXA3MTIoXG4gICAgcmVxOiBFaXA3MTJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RWlwMTkxT3I3MTJTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduRWlwNzEyKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB2YWxpZGF0aW9uIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7RXRoMlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFdGgyU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbkV0aDIoXG4gICAgcmVxOiBFdGgyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduRXRoMih0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdW5zdGFrZS9leGl0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7RXRoMlVuc3Rha2VSZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXRoMlVuc3Rha2VSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyB1bnN0YWtlKFxuICAgIHJlcTogRXRoMlVuc3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyVW5zdGFrZVJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblVuc3Rha2UodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEF2YWxhbmNoZSBQLSBvciBYLWNoYWluIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7QXZhVHh9IHR4IEF2YWxhbmNoZSBtZXNzYWdlICh0cmFuc2FjdGlvbikgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxBdmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YSh0eDogQXZhVHgsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QXZhU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkF2YSh0aGlzLCB0eCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHNlcmlhbGl6ZWQgQXZhbGFuY2hlIEMtL1gtL1AtY2hhaW4gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtBdmFDaGFpbn0gYXZhQ2hhaW4gQXZhbGFuY2hlIGNoYWluXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eCBIZXggZW5jb2RlZCB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxBdmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblNlcmlhbGl6ZWRBdmEoXG4gICAgYXZhQ2hhaW46IEF2YUNoYWluLFxuICAgIHR4OiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25TZXJpYWxpemVkQXZhKHRoaXMsIGF2YUNoYWluLCB0eCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHJhdyBibG9iLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93UmF3QmxvYlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uIFRoaXMgaXMgYmVjYXVzZVxuICAgKiBzaWduaW5nIGFyYml0cmFyeSBtZXNzYWdlcyBpcywgaW4gZ2VuZXJhbCwgZGFuZ2Vyb3VzIChhbmQgeW91IHNob3VsZCBpbnN0ZWFkXG4gICAqIHByZWZlciB0eXBlZCBlbmQtcG9pbnRzIGFzIHVzZWQgYnksIGZvciBleGFtcGxlLCB7QGxpbmsgc2lnbkV2bX0pLiBGb3IgU2VjcDI1NmsxIGtleXMsXG4gICAqIGZvciBleGFtcGxlLCB5b3UgKiptdXN0KiogY2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggYSBtZXNzYWdlIHRoYXQgaXMgMzIgYnl0ZXMgbG9uZyBhbmRcbiAgICogdGhlIG91dHB1dCBvZiBhIHNlY3VyZSBoYXNoIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgc2lnbmF0dXJlcyBzZXJpYWxpemVkIGFzO1xuICAgKlxuICAgKiAtIEVDRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgYXMgYmlnLWVuZGlhbiByIGFuZCBzIHBsdXMgcmVjb3ZlcnktaWRcbiAgICogICAgYnl0ZSB2LCB3aGljaCBjYW4gaW4gZ2VuZXJhbCB0YWtlIGFueSBvZiB0aGUgdmFsdWVzIDAsIDEsIDIsIG9yIDMuXG4gICAqXG4gICAqIC0gRWREU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBpbiB0aGUgc3RhbmRhcmQgZm9ybWF0LlxuICAgKlxuICAgKiAtIEJMUyBzaWduYXR1cmVzIGFyZSBub3Qgc3VwcG9ydGVkIG9uIHRoZSBibG9iLXNpZ24gZW5kcG9pbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7QmxvYlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEJsb2JTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJsb2IoXG4gICAgcmVxOiBCbG9iU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJsb2JTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduQmxvYih0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7QnRjU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8QnRjU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGMoXG4gICAgcmVxOiBCdGNTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkJ0Yyh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBTb2xhbmEgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtTb2xhbmFTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxTb2xhbmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblNvbGFuYShcbiAgICByZXE6IFNvbGFuYVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTb2xhbmFTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduU29sYW5hKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7VXBkYXRlS2V5UmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge0tleUluZm99IFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHRoaXMuY2FjaGVkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleVVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0KTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7S2V5SW5mb30gVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHRoaXMuY2FjaGVkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldCh0aGlzLmlkKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgc2NoZW1hIGtleSB0eXBlIHRvIGEga2V5IHR5cGUuXG4gKlxuICogQHBhcmFtIHtTY2hlbWFLZXlUeXBlfSB0eSBUaGUgc2NoZW1hIGtleSB0eXBlLlxuICogQHJldHVybiB7S2V5VHlwZX0gVGhlIGtleSB0eXBlLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tU2NoZW1hS2V5VHlwZSh0eTogU2NoZW1hS2V5VHlwZSk6IEtleVR5cGUge1xuICBzd2l0Y2ggKHR5KSB7XG4gICAgY2FzZSBcIlNlY3BFdGhBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkV2bTtcbiAgICBjYXNlIFwiU2VjcEJ0Y1wiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGM7XG4gICAgY2FzZSBcIlNlY3BCdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0Y1Rlc3Q7XG4gICAgY2FzZSBcIlNlY3BBdmFBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YTtcbiAgICBjYXNlIFwiU2VjcEF2YVRlc3RBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YVRlc3Q7XG4gICAgY2FzZSBcIkJhYnlsb25Fb3RzXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJhYnlsb25Fb3RzO1xuICAgIGNhc2UgXCJUYXByb290QnRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlRhcHJvb3Q7XG4gICAgY2FzZSBcIlRhcHJvb3RCdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlRhcHJvb3RUZXN0O1xuICAgIGNhc2UgXCJCbHNQdWJcIjpcbiAgICAgIHJldHVybiBCbHMuRXRoMkRlcG9zaXRlZDtcbiAgICBjYXNlIFwiQmxzSW5hY3RpdmVcIjpcbiAgICAgIHJldHVybiBCbHMuRXRoMkluYWN0aXZlO1xuICAgIGNhc2UgXCJFZDI1NTE5U29sYW5hQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU29sYW5hO1xuICAgIGNhc2UgXCJFZDI1NTE5U3VpQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU3VpO1xuICAgIGNhc2UgXCJFZDI1NTE5QXB0b3NBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5BcHRvcztcbiAgICBjYXNlIFwiRWQyNTUxOUNhcmRhbm9BZGRyVmtcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LkNhcmRhbm87XG4gICAgY2FzZSBcIkVkMjU1MTlTdGVsbGFyQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU3RlbGxhcjtcbiAgICBjYXNlIFwiU3RhcmtcIjpcbiAgICAgIHJldHVybiBTdGFyaztcbiAgICBjYXNlIFwiTW5lbW9uaWNcIjpcbiAgICAgIHJldHVybiBNbmVtb25pYztcbiAgfVxufVxuIl19