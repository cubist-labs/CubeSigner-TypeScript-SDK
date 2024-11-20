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
exports.Key = exports.Stark = exports.Mnemonic = exports.P256 = exports.Ed25519 = exports.Bls = exports.Secp256k1 = void 0;
exports.fromSchemaKeyType = fromSchemaKeyType;
const _1 = require(".");
const util_1 = require("./util");
/** Secp256k1 key type */
var Secp256k1;
(function (Secp256k1) {
    Secp256k1["Evm"] = "SecpEthAddr";
    Secp256k1["Btc"] = "SecpBtc";
    Secp256k1["BtcTest"] = "SecpBtcTest";
    Secp256k1["Cosmos"] = "SecpCosmosAddr";
    Secp256k1["Taproot"] = "TaprootBtc";
    Secp256k1["TaprootTest"] = "TaprootBtcTest";
    Secp256k1["BabylonEots"] = "BabylonEots";
    Secp256k1["Ava"] = "SecpAvaAddr";
    Secp256k1["AvaTest"] = "SecpAvaTestAddr";
    Secp256k1["Tron"] = "SecpTronAddr";
    Secp256k1["BtcLegacy"] = "SecpBtcLegacy";
    Secp256k1["BtcLegacyTest"] = "SecpBtcLegacyTest";
    Secp256k1["Doge"] = "SecpDogeAddr";
    Secp256k1["DogeTest"] = "SecpDogeTestAddr";
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
    Ed25519["Substrate"] = "Ed25519SubstrateAddr";
    Ed25519["Tendermint"] = "Ed25519TendermintAddr";
    Ed25519["Ton"] = "Ed25519TonAddr";
})(Ed25519 || (exports.Ed25519 = Ed25519 = {}));
/** P256 key type */
var P256;
(function (P256) {
    P256["Cosmos"] = "P256CosmosAddr";
})(P256 || (exports.P256 = P256 = {}));
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
     * List roles this key is in.
     * @param {PageOpts} page Optional pagination options; by default, retrieves all roles this key is in.
     * @return {Promise<KeyInRoleInfo[]>} Roles this key is in.
     */
    async roles(page) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").keyRolesList(this.id, page).fetch();
    }
    /**
     * List historical transactions for this key.
     * @param {PageOpts} page Optional pagination options; by default, retrieves all historical transactions for this key.
     * @return {Promise<HistoricalTx[]>} Historical key transactions.
     */
    async history(page) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").keyHistory(this.id, page).fetch();
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s).
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    async signEip712(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEip712(this, req, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param {Eth2SignRequest} req What to sign.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    async signEth2(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEth2(this, req, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    async unstake(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signUnstake(this, req, mfaReceipt);
    }
    /**
     * Sign an Avalanche P- or X-chain message.
     *
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
     */
    async signBlob(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signBlob(this, req, mfaReceipt);
    }
    /**
     * Sign a Bitcoin transaction.
     *
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    async signBtc(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signBtc(this, req, mfaReceipt);
    }
    /**
     * Sign a PSBT.
     *
     * @param { PsbtSignRequest } req What to sign
     * @param { MfaReceipts } mfaReceipt Optional MFA receipt(s)
     * @return { Promise<PsbtSignResponse | AcceptedResponse>} The response
     */
    async signPsbt(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signPsbt(this, req, mfaReceipt);
    }
    /**
     * @typedef { Object } BtcMessageOptions
     * @property { boolean } p2sh If this is a segwit key and p2sh is true, sign as p2sh-p2wpkh instead of p2wpkh. Defaults to false if not specified.
     * @property { MfaReceipts } mfaReceipt Optional MFA receipt(s)
     */
    /**
     * Sign a Bitcoin message.
     *
     * @param { Uint8Array | string } req The message to sign
     * @param { BtcMessageOptions } opts Options for this request
     * @return { Promise<BtcMessageSignResponse | AcceptedResponse> } The response
     */
    async signBtcMessage(req, opts) {
        const request = {
            data: (0, util_1.encodeToHex)(req),
            is_p2sh: opts.p2sh ?? false,
        };
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signBtcMessage(this, request, opts.mfaReceipt);
    }
    /**
     * Sign a Solana message.
     *
     * @param {SolanaSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
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
        case "SecpCosmosAddr":
            return Secp256k1.Cosmos;
        case "SecpBtc":
            return Secp256k1.Btc;
        case "SecpBtcTest":
            return Secp256k1.BtcTest;
        case "SecpBtcLegacy":
            return Secp256k1.BtcLegacy;
        case "SecpBtcLegacyTest":
            return Secp256k1.BtcLegacyTest;
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
        case "SecpTronAddr":
            return Secp256k1.Tron;
        case "SecpDogeAddr":
            return Secp256k1.Doge;
        case "SecpDogeTestAddr":
            return Secp256k1.DogeTest;
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
        case "Ed25519SubstrateAddr":
            return Ed25519.Substrate;
        case "Ed25519TendermintAddr":
            return Ed25519.Tendermint;
        case "Ed25519TonAddr":
            return Ed25519.Ton;
        case "Stark":
            return exports.Stark;
        case "Mnemonic":
            return exports.Mnemonic;
        case "P256CosmosAddr":
            return P256.Cosmos;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFvakJBLDhDQXlEQztBQXhrQkQsd0JBQTRDO0FBQzVDLGlDQUFxQztBQUVyQyx5QkFBeUI7QUFDekIsSUFBWSxTQWVYO0FBZkQsV0FBWSxTQUFTO0lBQ25CLGdDQUFtQixDQUFBO0lBQ25CLDRCQUFlLENBQUE7SUFDZixvQ0FBdUIsQ0FBQTtJQUN2QixzQ0FBeUIsQ0FBQTtJQUN6QixtQ0FBc0IsQ0FBQTtJQUN0QiwyQ0FBOEIsQ0FBQTtJQUM5Qix3Q0FBMkIsQ0FBQTtJQUMzQixnQ0FBbUIsQ0FBQTtJQUNuQix3Q0FBMkIsQ0FBQTtJQUMzQixrQ0FBcUIsQ0FBQTtJQUNyQix3Q0FBMkIsQ0FBQTtJQUMzQixnREFBbUMsQ0FBQTtJQUNuQyxrQ0FBcUIsQ0FBQTtJQUNyQiwwQ0FBNkIsQ0FBQTtBQUMvQixDQUFDLEVBZlcsU0FBUyx5QkFBVCxTQUFTLFFBZXBCO0FBRUQsbUJBQW1CO0FBQ25CLElBQVksR0FHWDtBQUhELFdBQVksR0FBRztJQUNiLCtCQUF3QixDQUFBO0lBQ3hCLG1DQUE0QixDQUFBO0FBQzlCLENBQUMsRUFIVyxHQUFHLG1CQUFILEdBQUcsUUFHZDtBQUVELHVCQUF1QjtBQUN2QixJQUFZLE9BU1g7QUFURCxXQUFZLE9BQU87SUFDakIsdUNBQTRCLENBQUE7SUFDNUIsaUNBQXNCLENBQUE7SUFDdEIscUNBQTBCLENBQUE7SUFDMUIsMkNBQWdDLENBQUE7SUFDaEMseUNBQThCLENBQUE7SUFDOUIsNkNBQWtDLENBQUE7SUFDbEMsK0NBQW9DLENBQUE7SUFDcEMsaUNBQXNCLENBQUE7QUFDeEIsQ0FBQyxFQVRXLE9BQU8sdUJBQVAsT0FBTyxRQVNsQjtBQUVELG9CQUFvQjtBQUNwQixJQUFZLElBRVg7QUFGRCxXQUFZLElBQUk7SUFDZCxpQ0FBeUIsQ0FBQTtBQUMzQixDQUFDLEVB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T0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNyQixLQUFLLE9BQU87WUFDVixPQUFPLGFBQUssQ0FBQztRQUNmLEtBQUssVUFBVTtZQUNiLE9BQU8sZ0JBQVEsQ0FBQztRQUNsQixLQUFLLGdCQUFnQjtZQUNuQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDdkIsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEtleVBvbGljeSB9IGZyb20gXCIuL3JvbGVcIjtcbmltcG9ydCB0eXBlIHsgUGFnZU9wdHMgfSBmcm9tIFwiLi9wYWdpbmF0b3JcIjtcbmltcG9ydCB0eXBlIHtcbiAgS2V5SW5mbyxcbiAgVXBkYXRlS2V5UmVxdWVzdCxcbiAgU2NoZW1hS2V5VHlwZSxcbiAgS2V5SW5Sb2xlSW5mbyxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXNwb25zZSxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFdGgyU2lnblJlcXVlc3QsXG4gIEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgQXZhVHgsXG4gIEJsb2JTaWduUmVxdWVzdCxcbiAgQnRjU2lnblJlcXVlc3QsXG4gIFNvbGFuYVNpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVzcG9uc2UsXG4gIEJ0Y01lc3NhZ2VTaWduUmVzcG9uc2UsXG4gIEJ0Y1NpZ25SZXNwb25zZSxcbiAgQmxvYlNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlc3BvbnNlLFxuICBFdGgyVW5zdGFrZVJlc3BvbnNlLFxuICBFdGgyU2lnblJlc3BvbnNlLFxuICBFaXAxOTFPcjcxMlNpZ25SZXNwb25zZSxcbiAgUHNidFNpZ25SZXF1ZXN0LFxuICBQc2J0U2lnblJlc3BvbnNlLFxufSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB0eXBlIHtcbiAgQXBpQ2xpZW50LFxuICBBdmFDaGFpbixcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFcnJSZXNwb25zZSxcbiAgSGlzdG9yaWNhbFR4LFxuICBKc29uVmFsdWUsXG4gIE1mYVJlY2VpcHRzLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCwgZGVsYXkgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgZW5jb2RlVG9IZXggfSBmcm9tIFwiLi91dGlsXCI7XG5cbi8qKiBTZWNwMjU2azEga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIFNlY3AyNTZrMSB7XG4gIEV2bSA9IFwiU2VjcEV0aEFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGMgPSBcIlNlY3BCdGNcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGNUZXN0ID0gXCJTZWNwQnRjVGVzdFwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIENvc21vcyA9IFwiU2VjcENvc21vc0FkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBUYXByb290ID0gXCJUYXByb290QnRjXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgVGFwcm9vdFRlc3QgPSBcIlRhcHJvb3RCdGNUZXN0XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQmFieWxvbkVvdHMgPSBcIkJhYnlsb25Fb3RzXCIsXG4gIEF2YSA9IFwiU2VjcEF2YUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBBdmFUZXN0ID0gXCJTZWNwQXZhVGVzdEFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBUcm9uID0gXCJTZWNwVHJvbkFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBCdGNMZWdhY3kgPSBcIlNlY3BCdGNMZWdhY3lcIixcbiAgQnRjTGVnYWN5VGVzdCA9IFwiU2VjcEJ0Y0xlZ2FjeVRlc3RcIixcbiAgRG9nZSA9IFwiU2VjcERvZ2VBZGRyXCIsXG4gIERvZ2VUZXN0ID0gXCJTZWNwRG9nZVRlc3RBZGRyXCIsXG59XG5cbi8qKiBCTFMga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIEJscyB7XG4gIEV0aDJEZXBvc2l0ZWQgPSBcIkJsc1B1YlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIEV0aDJJbmFjdGl2ZSA9IFwiQmxzSW5hY3RpdmVcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xufVxuXG4vKiogRWQyNTUxOSBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gRWQyNTUxOSB7XG4gIFNvbGFuYSA9IFwiRWQyNTUxOVNvbGFuYUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBTdWkgPSBcIkVkMjU1MTlTdWlBZGRyXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQXB0b3MgPSBcIkVkMjU1MTlBcHRvc0FkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBDYXJkYW5vID0gXCJFZDI1NTE5Q2FyZGFub0FkZHJWa1wiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFN0ZWxsYXIgPSBcIkVkMjU1MTlTdGVsbGFyQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIFN1YnN0cmF0ZSA9IFwiRWQyNTUxOVN1YnN0cmF0ZUFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBUZW5kZXJtaW50ID0gXCJFZDI1NTE5VGVuZGVybWludEFkZHJcIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBUb24gPSBcIkVkMjU1MTlUb25BZGRyXCIsXG59XG5cbi8qKiBQMjU2IGtleSB0eXBlICovXG5leHBvcnQgZW51bSBQMjU2IHtcbiAgQ29zbW9zID0gXCJQMjU2Q29zbW9zQWRkclwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG59XG5cbi8qKiBNbmVtb25pYyBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IE1uZW1vbmljID0gXCJNbmVtb25pY1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgTW5lbW9uaWMgPSB0eXBlb2YgTW5lbW9uaWM7XG5cbi8qKiBTdGFyayBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IFN0YXJrID0gXCJTdGFya1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgU3RhcmsgPSB0eXBlb2YgU3Rhcms7XG5cbi8qKiBLZXkgdHlwZSAqL1xuZXhwb3J0IHR5cGUgS2V5VHlwZSA9IFNlY3AyNTZrMSB8IEJscyB8IEVkMjU1MTkgfCBNbmVtb25pYyB8IFN0YXJrIHwgUDI1NjtcblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgc2lnbmluZyBrZXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXkge1xuICAvKiogVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdGhhdCB0aGlzIGtleSBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuXG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIHRoYXQgdGhpcyBrZXkgaXMgaW4gKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBpZCBvZiB0aGUga2V5OiBcIktleSNcIiBmb2xsb3dlZCBieSBhIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvXG4gICAqIHRoZSB0eXBlIG9mIGtleSAoc3VjaCBhcyBhIHB1YmxpYyBrZXkgZm9yIEJMUyBvciBhbiBldGhlcmV1bSBhZGRyZXNzIGZvciBTZWNwKVxuICAgKiBAZXhhbXBsZSBLZXkjMHg4ZTM0ODQ2ODdlNjZjZGQyNmNmMDRjMzY0NzYzM2FiNGYzNTcwMTQ4XG4gICAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvIHRoZSB0eXBlIG9mIGtleSwgc3VjaCBhcyBhIHB1YmxpYyBrZXkgb3IgYW4gZXRoZXJldW0gYWRkcmVzc1xuICAgKiBAZXhhbXBsZSAweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICovXG4gIHJlYWRvbmx5IG1hdGVyaWFsSWQhOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBIZXgtZW5jb2RlZCwgc2VyaWFsaXplZCBwdWJsaWMga2V5LiBUaGUgZm9ybWF0IHVzZWQgZGVwZW5kcyBvbiB0aGUga2V5IHR5cGU6XG4gICAqIC0gc2VjcDI1NmsxIGtleXMgdXNlIDY1LWJ5dGUgdW5jb21wcmVzc2VkIFNFQ0cgZm9ybWF0XG4gICAqIC0gQkxTIGtleXMgdXNlIDQ4LWJ5dGUgY29tcHJlc3NlZCBCTFMxMi0zODEgKFpDYXNoKSBmb3JtYXRcbiAgICogQGV4YW1wbGUgMHgwNGQyNjg4YjZiYzJjZTdmOTg3OWI5ZTc0NWYzYzRkYzE3NzkwOGM1Y2VmMGMxYjY0Y2ZmMTlhZTdmZjI3ZGVlNjIzYzY0ZmU5ZDljMzI1YzdmYmJjNzQ4YmJkNWY2MDdjZTE0ZGQ4M2UyOGViYmJiN2QzZTdmMmZmYjcwYTc5NDMxXG4gICAqL1xuICByZWFkb25seSBwdWJsaWNLZXk6IHN0cmluZztcblxuICAvKipcbiAgICogR2V0IHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIGtleS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmcgYEtleS5lbmFibGVkKClgXG4gICAqIG9yIGBLZXkuZGlzYWJsZSgpYCkuXG4gICAqL1xuICBjYWNoZWQ6IEtleUluZm87XG5cbiAgLyoqIFRoZSB0eXBlIG9mIGtleS4gKi9cbiAgYXN5bmMgdHlwZSgpOiBQcm9taXNlPEtleVR5cGU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBmcm9tU2NoZW1hS2V5VHlwZShkYXRhLmtleV90eXBlKTtcbiAgfVxuXG4gIC8qKiBJcyB0aGUga2V5IGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqIEVuYWJsZSB0aGUga2V5LiAqL1xuICBhc3luYyBlbmFibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqIERpc2FibGUgdGhlIGtleS4gKi9cbiAgYXN5bmMgZGlzYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3Qgcm9sZXMgdGhpcyBrZXkgaXMgaW4uXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIHJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleUluUm9sZUluZm9bXT59IFJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlJblJvbGVJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleVJvbGVzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgaGlzdG9yaWNhbCB0cmFuc2FjdGlvbnMgZm9yIHRoaXMga2V5LlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIE9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9uczsgYnkgZGVmYXVsdCwgcmV0cmlldmVzIGFsbCBoaXN0b3JpY2FsIHRyYW5zYWN0aW9ucyBmb3IgdGhpcyBrZXkuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SGlzdG9yaWNhbFR4W10+fSBIaXN0b3JpY2FsIGtleSB0cmFuc2FjdGlvbnMuXG4gICAqL1xuICBhc3luYyBoaXN0b3J5KHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8SGlzdG9yaWNhbFR4W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUhpc3RvcnkodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIGtleSlcbiAgICogQHBhcmFtIHtLZXlQb2xpY3l9IHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IEtleVBvbGljeSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcG9saWN5OiBwb2xpY3kgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQga2V5IG1ldGFkYXRhLiBUaGUgbWV0YWRhdGEgbXVzdCBiZSBhdCBtb3N0IDEwMjQgY2hhcmFjdGVyc1xuICAgKiBhbmQgbXVzdCBtYXRjaCB0aGUgZm9sbG93aW5nIHJlZ2V4OiBeW0EtWmEtejAtOV89Ky8gXFwtXFwuXFwsXXswLDEwMjR9JC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGFkYXRhIFRoZSBuZXcgbWV0YWRhdGEgdG8gc2V0LlxuICAgKi9cbiAgYXN5bmMgc2V0TWV0YWRhdGEobWV0YWRhdGE6IEpzb25WYWx1ZSk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IG1ldGFkYXRhIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgZXhpc3RpbmcgbWV0YWRhdGEsIGFzc2VydHMgdGhhdCBpdCBpcyBhbiBvYmplY3QgKHRocm93cyBpZiBpdCBpcyBub3QpLFxuICAgKiB0aGVuIHNldHMgdGhlIHZhbHVlIG9mIHRoZSB7QGxpbmsgbmFtZX0gcHJvcGVydHkgaW4gdGhhdCBvYmplY3QgdG8ge0BsaW5rIHZhbHVlfSxcbiAgICogYW5kIGZpbmFsbHkgc3VibWl0cyB0aGUgcmVxdWVzdCB0byB1cGRhdGUgdGhlIG1ldGFkYXRhLlxuICAgKlxuICAgKiBUaGlzIHdob2xlIHByb2Nlc3MgaXMgZG9uZSBhdG9taWNhbGx5LCBtZWFuaW5nLCB0aGF0IGlmIHRoZSBtZXRhZGF0YSBjaGFuZ2VzIGJldHdlZW4gdGhlXG4gICAqIHRpbWUgdGhpcyBtZXRob2QgZmlyc3QgcmV0cmlldmVzIGl0IGFuZCB0aGUgdGltZSBpdCBzdWJtaXRzIGEgcmVxdWVzdCB0byB1cGRhdGUgaXQsIHRoZVxuICAgKiByZXF1ZXN0IHdpbGwgYmUgcmVqZWN0ZWQuIFdoZW4gdGhhdCBoYXBwZW5zLCB0aGlzIG1ldGhvZCB3aWxsIHJldHJ5IGEgZmV3IHRpbWVzLCBhcyBwZXJcbiAgICoge0BsaW5rIEFwaUNsaWVudC5jb25maWd9LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gc2V0XG4gICAqIEBwYXJhbSB7SnNvblZhbHVlfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleUluZm8+fSBVcGRhdGVkIGtleSBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgc2V0TWV0YWRhdGFQcm9wZXJ0eShuYW1lOiBzdHJpbmcsIHZhbHVlOiBKc29uVmFsdWUpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2V0TWV0YWRhdGFQcm9wZXJ0eShuYW1lLCB2YWx1ZSwgdGhpcy4jYXBpQ2xpZW50LmNvbmZpZy51cGRhdGVSZXRyeURlbGF5c01zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIG1ldGFkYXRhLCBhc3NlcnRzIHRoYXQgaXQgaXMgaW4gb2JqZWN0ICh0aHJvd3MgaWYgaXQgaXMgbm90KSxcbiAgICogdGhlbiBkZWxldGVzIHRoZSB7QGxpbmsgbmFtZX0gcHJvcGVydHkgaW4gdGhhdCBvYmplY3QsIGFuZCBmaW5hbGx5IHN1Ym1pdHMgdGhlXG4gICAqIHJlcXVlc3QgdG8gdXBkYXRlIHRoZSBtZXRhZGF0YS5cbiAgICpcbiAgICogVGhpcyB3aG9sZSBwcm9jZXNzIGlzIGRvbmUgYXRvbWljYWxseSwgbWVhbmluZywgdGhhdCBpZiB0aGUgbWV0YWRhdGEgY2hhbmdlcyBiZXR3ZWVuIHRoZVxuICAgKiB0aW1lIHRoaXMgbWV0aG9kIGZpcnN0IHJldHJpZXZlcyBpdCBhbmQgdGhlIHRpbWUgaXQgc3VibWl0cyBhIHJlcXVlc3QgdG8gdXBkYXRlIGl0LCB0aGVcbiAgICogcmVxdWVzdCB3aWxsIGJlIHJlamVjdGVkLiBXaGVuIHRoYXQgaGFwcGVucywgdGhpcyBtZXRob2Qgd2lsbCByZXRyeSBhIGZldyB0aW1lcywgYXMgcGVyXG4gICAqIHtAbGluayBBcGlDbGllbnQuY29uZmlnfS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHNldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleUluZm8+fSBVcGRhdGVkIGtleSBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgZGVsZXRlTWV0YWRhdGFQcm9wZXJ0eShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2V0TWV0YWRhdGFQcm9wZXJ0eShcbiAgICAgIG5hbWUsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICB0aGlzLiNhcGlDbGllbnQuY29uZmlnLnVwZGF0ZVJldHJ5RGVsYXlzTXMsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gc2V0XG4gICAqIEBwYXJhbSB7SnNvblZhbHVlfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge251bWJlcltdfSBkZWxheXNNcyBEZWxheXMgaW4gbWlsbGlzZWNvbmRzIGJldHdlZW4gcmV0cmllc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPEtleUluZm8+fSBVcGRhdGVkIGtleSBpbmZvcm1hdGlvblxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jICNzZXRNZXRhZGF0YVByb3BlcnR5KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZTogSnNvblZhbHVlIHwgdW5kZWZpbmVkLFxuICAgIGRlbGF5c01zOiBudW1iZXJbXSxcbiAgKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICBjb25zdCBjdXJyZW50ID0gZGF0YS5tZXRhZGF0YSA/PyB7fTtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnQgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1cnJlbnQgbWV0YWRhdGEgaXMgbm90IGEgSlNPTiBvYmplY3RcIik7XG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZWQgPSB7XG4gICAgICAuLi5jdXJyZW50LFxuICAgICAgW25hbWVdOiB2YWx1ZSxcbiAgICB9O1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoe1xuICAgICAgICBtZXRhZGF0YTogdXBkYXRlZCxcbiAgICAgICAgdmVyc2lvbjogZGF0YS52ZXJzaW9uLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKChlIGFzIEVyclJlc3BvbnNlKS5lcnJvckNvZGUgPT09IFwiSW52YWxpZFVwZGF0ZVwiICYmIGRlbGF5c01zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYXdhaXQgZGVsYXkoZGVsYXlzTXNbMF0pO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2V0TWV0YWRhdGFQcm9wZXJ0eShuYW1lLCB2YWx1ZSwgZGVsYXlzTXMuc2xpY2UoMSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHRvIGV4aXN0aW5nIGtleSBwb2xpY3kuIFRoaXMgYXBwZW5kIGlzIG5vdCBhdG9taWMgLS0gaXQgdXNlcyB7QGxpbmsgcG9saWN5fVxuICAgKiB0byBmZXRjaCB0aGUgY3VycmVudCBwb2xpY3kgYW5kIHRoZW4ge0BsaW5rIHNldFBvbGljeX0gdG8gc2V0IHRoZSBwb2xpY3kgLS0gYW5kXG4gICAqIHNob3VsZCBub3QgYmUgdXNlZCBpbiBhY3Jvc3MgY29uY3VycmVudCBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtLZXlQb2xpY3l9IHBvbGljeSBUaGUgcG9saWN5IHRvIGFwcGVuZCB0byB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKi9cbiAgYXN5bmMgYXBwZW5kUG9saWN5KHBvbGljeTogS2V5UG9saWN5KSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnBvbGljeSgpO1xuICAgIGF3YWl0IHRoaXMuc2V0UG9saWN5KFsuLi5leGlzdGluZywgLi4ucG9saWN5XSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBrZXkuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8S2V5UG9saWN5Pn0gVGhlIHBvbGljeSBmb3IgdGhlIGtleS5cbiAgICovXG4gIGFzeW5jIHBvbGljeSgpOiBQcm9taXNlPEtleVBvbGljeT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBLZXlQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIG1ldGFkYXRhIGZvciB0aGUga2V5LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEpzb25WYWx1ZT59IFRoZSBwb2xpY3kgZm9yIHRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBtZXRhZGF0YSgpOiBQcm9taXNlPEpzb25WYWx1ZT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEubWV0YWRhdGEgYXMgSnNvblZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBPd25lciBvZiB0aGUga2V5XG4gICAqIEBleGFtcGxlIFVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBhc3luYyBvd25lcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEub3duZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvd25lciBvZiB0aGUga2V5LiBPbmx5IHRoZSBrZXkgKG9yIG9yZykgb3duZXIgY2FuIGNoYW5nZSB0aGUgb3duZXIgb2YgdGhlIGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG93bmVyIFRoZSB1c2VyLWlkIG9mIHRoZSBuZXcgb3duZXIgb2YgdGhlIGtleS5cbiAgICovXG4gIGFzeW5jIHNldE93bmVyKG93bmVyOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG93bmVyIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGlzIGtleS5cbiAgICovXG4gIGFzeW5jIGRlbGV0ZSgpIHtcbiAgICBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5RGVsZXRlKHRoaXMuaWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGtleS5cbiAgICpcbiAgICogQHBhcmFtIHtBcGlDbGllbnQgfCBDdWJlU2lnbmVyQ2xpZW50fSBjbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge0tleUluZm99IGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjbGllbnQ6IEFwaUNsaWVudCB8IEN1YmVTaWduZXJDbGllbnQsIGRhdGE6IEtleUluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBjbGllbnQgaW5zdGFuY2VvZiBDdWJlU2lnbmVyQ2xpZW50ID8gY2xpZW50LmFwaUNsaWVudCA6IGNsaWVudDtcbiAgICB0aGlzLmlkID0gZGF0YS5rZXlfaWQ7XG4gICAgdGhpcy5tYXRlcmlhbElkID0gZGF0YS5tYXRlcmlhbF9pZDtcbiAgICB0aGlzLnB1YmxpY0tleSA9IGRhdGEucHVibGljX2tleTtcbiAgICB0aGlzLmNhY2hlZCA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RXZtU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdHN9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShcbiAgICByZXE6IEV2bVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkV2bSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTE5MSB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwMTkxU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV2bVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXAxOTEoXG4gICAgcmVxOiBFaXAxOTFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkVpcDE5MSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTcxMiB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwNzEyU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV2bVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXA3MTIoXG4gICAgcmVxOiBFaXA3MTJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkVpcDcxMih0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdmFsaWRhdGlvbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0V0aDJTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihcbiAgICByZXE6IEV0aDJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduRXRoMih0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdW5zdGFrZS9leGl0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7RXRoMlVuc3Rha2VSZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJVbnN0YWtlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdW5zdGFrZShcbiAgICByZXE6IEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJVbnN0YWtlUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduVW5zdGFrZSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gQXZhbGFuY2hlIFAtIG9yIFgtY2hhaW4gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtBdmFUeH0gdHggQXZhbGFuY2hlIG1lc3NhZ2UgKHRyYW5zYWN0aW9uKSB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdHN9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybiB7UHJvbWlzZTxBdmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YSh0eDogQXZhVHgsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25BdmEodGhpcywgdHgsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzZXJpYWxpemVkIEF2YWxhbmNoZSBDLS9YLS9QLWNoYWluIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7QXZhQ2hhaW59IGF2YUNoYWluIEF2YWxhbmNoZSBjaGFpblxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHggSGV4IGVuY29kZWQgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEF2YVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU2VyaWFsaXplZEF2YShcbiAgICBhdmFDaGFpbjogQXZhQ2hhaW4sXG4gICAgdHg6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25TZXJpYWxpemVkQXZhKHRoaXMsIGF2YUNoYWluLCB0eCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHJhdyBibG9iLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93UmF3QmxvYlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uIFRoaXMgaXMgYmVjYXVzZVxuICAgKiBzaWduaW5nIGFyYml0cmFyeSBtZXNzYWdlcyBpcywgaW4gZ2VuZXJhbCwgZGFuZ2Vyb3VzIChhbmQgeW91IHNob3VsZCBpbnN0ZWFkXG4gICAqIHByZWZlciB0eXBlZCBlbmQtcG9pbnRzIGFzIHVzZWQgYnksIGZvciBleGFtcGxlLCB7QGxpbmsgc2lnbkV2bX0pLiBGb3IgU2VjcDI1NmsxIGtleXMsXG4gICAqIGZvciBleGFtcGxlLCB5b3UgKiptdXN0KiogY2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggYSBtZXNzYWdlIHRoYXQgaXMgMzIgYnl0ZXMgbG9uZyBhbmRcbiAgICogdGhlIG91dHB1dCBvZiBhIHNlY3VyZSBoYXNoIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgc2lnbmF0dXJlcyBzZXJpYWxpemVkIGFzO1xuICAgKlxuICAgKiAtIEVDRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgYXMgYmlnLWVuZGlhbiByIGFuZCBzIHBsdXMgcmVjb3ZlcnktaWRcbiAgICogICAgYnl0ZSB2LCB3aGljaCBjYW4gaW4gZ2VuZXJhbCB0YWtlIGFueSBvZiB0aGUgdmFsdWVzIDAsIDEsIDIsIG9yIDMuXG4gICAqXG4gICAqIC0gRWREU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBpbiB0aGUgc3RhbmRhcmQgZm9ybWF0LlxuICAgKlxuICAgKiAtIEJMUyBzaWduYXR1cmVzIGFyZSBub3Qgc3VwcG9ydGVkIG9uIHRoZSBibG9iLXNpZ24gZW5kcG9pbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7QmxvYlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdHN9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybiB7UHJvbWlzZTxCbG9iU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKFxuICAgIHJlcTogQmxvYlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmxvYlNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25CbG9iKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJpdGNvaW4gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7QnRjU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEJ0Y1NpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQnRjKFxuICAgIHJlcTogQnRjU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCdGNTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduQnRjKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFBTQlQuXG4gICAqXG4gICAqIEBwYXJhbSB7IFBzYnRTaWduUmVxdWVzdCB9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHsgTWZhUmVjZWlwdHMgfSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm4geyBQcm9taXNlPFBzYnRTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBzaWduUHNidChcbiAgICByZXE6IFBzYnRTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFBzYnRTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduUHNidCh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIHsgT2JqZWN0IH0gQnRjTWVzc2FnZU9wdGlvbnNcbiAgICogQHByb3BlcnR5IHsgYm9vbGVhbiB9IHAyc2ggSWYgdGhpcyBpcyBhIHNlZ3dpdCBrZXkgYW5kIHAyc2ggaXMgdHJ1ZSwgc2lnbiBhcyBwMnNoLXAyd3BraCBpbnN0ZWFkIG9mIHAyd3BraC4gRGVmYXVsdHMgdG8gZmFsc2UgaWYgbm90IHNwZWNpZmllZC5cbiAgICogQHByb3BlcnR5IHsgTWZhUmVjZWlwdHMgfSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqL1xuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0geyBVaW50OEFycmF5IHwgc3RyaW5nIH0gcmVxIFRoZSBtZXNzYWdlIHRvIHNpZ25cbiAgICogQHBhcmFtIHsgQnRjTWVzc2FnZU9wdGlvbnMgfSBvcHRzIE9wdGlvbnMgZm9yIHRoaXMgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHsgUHJvbWlzZTxCdGNNZXNzYWdlU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT4gfSBUaGUgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHNpZ25CdGNNZXNzYWdlKFxuICAgIHJlcTogVWludDhBcnJheSB8IHN0cmluZyxcbiAgICBvcHRzOiB7IHAyc2g/OiBib29sZWFuOyBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMgfSxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjTWVzc2FnZVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgZGF0YTogZW5jb2RlVG9IZXgocmVxKSxcbiAgICAgIGlzX3Ayc2g6IG9wdHMucDJzaCA/PyBmYWxzZSxcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkJ0Y01lc3NhZ2UodGhpcywgcmVxdWVzdCwgb3B0cy5tZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgU29sYW5hIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U29sYW5hU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0c30gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNvbGFuYVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU29sYW5hKFxuICAgIHJlcTogU29sYW5hU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTb2xhbmFTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduU29sYW5hKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBrZXkuXG4gICAqIEBwYXJhbSB7VXBkYXRlS2V5UmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge0tleUluZm99IFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHRoaXMuY2FjaGVkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleVVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0KTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7S2V5SW5mb30gVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHRoaXMuY2FjaGVkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldCh0aGlzLmlkKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgc2NoZW1hIGtleSB0eXBlIHRvIGEga2V5IHR5cGUuXG4gKlxuICogQHBhcmFtIHtTY2hlbWFLZXlUeXBlfSB0eSBUaGUgc2NoZW1hIGtleSB0eXBlLlxuICogQHJldHVybiB7S2V5VHlwZX0gVGhlIGtleSB0eXBlLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tU2NoZW1hS2V5VHlwZSh0eTogU2NoZW1hS2V5VHlwZSk6IEtleVR5cGUge1xuICBzd2l0Y2ggKHR5KSB7XG4gICAgY2FzZSBcIlNlY3BFdGhBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkV2bTtcbiAgICBjYXNlIFwiU2VjcENvc21vc0FkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQ29zbW9zO1xuICAgIGNhc2UgXCJTZWNwQnRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0YztcbiAgICBjYXNlIFwiU2VjcEJ0Y1Rlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjVGVzdDtcbiAgICBjYXNlIFwiU2VjcEJ0Y0xlZ2FjeVwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGNMZWdhY3k7XG4gICAgY2FzZSBcIlNlY3BCdGNMZWdhY3lUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0Y0xlZ2FjeVRlc3Q7XG4gICAgY2FzZSBcIlNlY3BBdmFBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YTtcbiAgICBjYXNlIFwiU2VjcEF2YVRlc3RBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YVRlc3Q7XG4gICAgY2FzZSBcIkJhYnlsb25Fb3RzXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJhYnlsb25Fb3RzO1xuICAgIGNhc2UgXCJUYXByb290QnRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlRhcHJvb3Q7XG4gICAgY2FzZSBcIlRhcHJvb3RCdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlRhcHJvb3RUZXN0O1xuICAgIGNhc2UgXCJTZWNwVHJvbkFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuVHJvbjtcbiAgICBjYXNlIFwiU2VjcERvZ2VBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkRvZ2U7XG4gICAgY2FzZSBcIlNlY3BEb2dlVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuRG9nZVRlc3Q7XG4gICAgY2FzZSBcIkJsc1B1YlwiOlxuICAgICAgcmV0dXJuIEJscy5FdGgyRGVwb3NpdGVkO1xuICAgIGNhc2UgXCJCbHNJbmFjdGl2ZVwiOlxuICAgICAgcmV0dXJuIEJscy5FdGgySW5hY3RpdmU7XG4gICAgY2FzZSBcIkVkMjU1MTlTb2xhbmFBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5Tb2xhbmE7XG4gICAgY2FzZSBcIkVkMjU1MTlTdWlBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5TdWk7XG4gICAgY2FzZSBcIkVkMjU1MTlBcHRvc0FkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LkFwdG9zO1xuICAgIGNhc2UgXCJFZDI1NTE5Q2FyZGFub0FkZHJWa1wiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQ2FyZGFubztcbiAgICBjYXNlIFwiRWQyNTUxOVN0ZWxsYXJBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5TdGVsbGFyO1xuICAgIGNhc2UgXCJFZDI1NTE5U3Vic3RyYXRlQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU3Vic3RyYXRlO1xuICAgIGNhc2UgXCJFZDI1NTE5VGVuZGVybWludEFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlRlbmRlcm1pbnQ7XG4gICAgY2FzZSBcIkVkMjU1MTlUb25BZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5Ub247XG4gICAgY2FzZSBcIlN0YXJrXCI6XG4gICAgICByZXR1cm4gU3Rhcms7XG4gICAgY2FzZSBcIk1uZW1vbmljXCI6XG4gICAgICByZXR1cm4gTW5lbW9uaWM7XG4gICAgY2FzZSBcIlAyNTZDb3Ntb3NBZGRyXCI6XG4gICAgICByZXR1cm4gUDI1Ni5Db3Ntb3M7XG4gIH1cbn1cbiJdfQ==