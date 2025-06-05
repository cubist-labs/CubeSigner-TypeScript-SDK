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
    Secp256k1["Ltc"] = "SecpLtc";
    Secp256k1["LtcTest"] = "SecpLtcTest";
    Secp256k1["Xrp"] = "SecpXrpAddr";
    Secp256k1["Cosmos"] = "SecpCosmosAddr";
    Secp256k1["Taproot"] = "TaprootBtc";
    Secp256k1["TaprootTest"] = "TaprootBtcTest";
    Secp256k1["BabylonEots"] = "BabylonEots";
    Secp256k1["BabylonCov"] = "BabylonCov";
    Secp256k1["Ava"] = "SecpAvaAddr";
    Secp256k1["AvaTest"] = "SecpAvaTestAddr";
    Secp256k1["Tron"] = "SecpTronAddr";
    Secp256k1["BtcLegacy"] = "SecpBtcLegacy";
    Secp256k1["BtcLegacyTest"] = "SecpBtcLegacyTest";
    Secp256k1["Doge"] = "SecpDogeAddr";
    Secp256k1["DogeTest"] = "SecpDogeTestAddr";
    Secp256k1["Kaspa"] = "SecpKaspaAddr";
    Secp256k1["KaspaTest"] = "SecpKaspaTestAddr";
    Secp256k1["KaspaSchnorr"] = "SchnorrKaspaAddr";
    Secp256k1["KaspaTestSchnorr"] = "SchnorrKaspaTestAddr";
})(Secp256k1 || (exports.Secp256k1 = Secp256k1 = {}));
/** BLS key type */
var Bls;
(function (Bls) {
    Bls["Eth2Deposited"] = "BlsPub";
    Bls["Eth2Inactive"] = "BlsInactive";
    Bls["AvaIcm"] = "BlsAvaIcm";
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
    Ed25519["Xrp"] = "Ed25519XrpAddr";
})(Ed25519 || (exports.Ed25519 = Ed25519 = {}));
/** P256 key type */
var P256;
(function (P256) {
    P256["Cosmos"] = "P256CosmosAddr";
    P256["Ontology"] = "P256OntologyAddr";
    P256["Neo3"] = "P256Neo3Addr";
})(P256 || (exports.P256 = P256 = {}));
/** Mnemonic key type */
exports.Mnemonic = "Mnemonic";
/** Stark key type */
exports.Stark = "Stark";
/**
 * A representation of a signing key.
 */
class Key {
    /** @returns The organization that this key is in */
    get orgId() {
        return __classPrivateFieldGet(this, _Key_apiClient, "f").sessionMeta.org_id;
    }
    /** @returns The type of key. */
    async type() {
        const data = await this.fetch();
        return fromSchemaKeyType(data.key_type);
    }
    /** @returns Whether the key is enabled */
    async enabled() {
        const data = await this.fetch();
        return data.enabled;
    }
    /**
     * Enable the key.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    async enable(mfaReceipt) {
        await this.update({ enabled: true }, mfaReceipt);
    }
    /**
     * Disable the key.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    async disable(mfaReceipt) {
        await this.update({ enabled: false }, mfaReceipt);
    }
    /**
     * List roles this key is in.
     *
     * @param page Optional pagination options; by default, retrieves all roles this key is in.
     * @returns Roles this key is in.
     */
    async roles(page) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").keyRolesList(this.id, page).fetch();
    }
    /**
     * List historical transactions for this key.
     *
     * @param page Optional pagination options; by default, retrieves all historical transactions for this key.
     * @returns Historical key transactions.
     */
    async history(page) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").keyHistory(this.id, page).fetch();
    }
    /**
     * Set new policy (overwriting any policies previously set for this key)
     *
     * @param policy The new policy to set
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    async setPolicy(policy, mfaReceipt) {
        await this.update({ policy }, mfaReceipt);
    }
    /**
     * Set key metadata. The metadata must be at most 1024 characters
     * and must match the following regex: ^[A-Za-z0-9_=+/ \-\.\,]{0,1024}$.
     *
     * @param metadata The new metadata to set.
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     * @returns The updated key info
     */
    async setMetadata(metadata, mfaReceipt) {
        return await this.update({ metadata }, mfaReceipt);
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
     * @param name The name of the property to set
     * @param value The new value of the property
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     * @returns Updated key information
     */
    async setMetadataProperty(name, value, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_instances, "m", _Key_setMetadataProperty).call(this, name, value, __classPrivateFieldGet(this, _Key_apiClient, "f").config.updateRetryDelaysMs, mfaReceipt);
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
     * @param name The name of the property to set
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     * @returns Updated key information
     */
    async deleteMetadataProperty(name, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_instances, "m", _Key_setMetadataProperty).call(this, name, undefined, __classPrivateFieldGet(this, _Key_apiClient, "f").config.updateRetryDelaysMs, mfaReceipt);
    }
    /**
     * Append to existing key policy. This append is not atomic -- it uses {@link policy}
     * to fetch the current policy and then {@link setPolicy} to set the policy -- and
     * should not be used in across concurrent sessions.
     *
     * @param policy The policy to append to the existing one.
     */
    async appendPolicy(policy) {
        const existing = await this.policy();
        await this.setPolicy([...existing, ...policy]);
    }
    /**
     * Get the policy for the key.
     *
     * @returns The policy for the key.
     */
    async policy() {
        const data = await this.fetch();
        return (data.policy ?? []);
    }
    /**
     * Fetch the metadata for the key.
     *
     * @returns The policy for the key.
     */
    async metadata() {
        const data = await this.fetch();
        return data.metadata;
    }
    /**
     * @returns The user id for the owner of the key
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    async owner() {
        const data = await this.fetch();
        return data.owner;
    }
    /**
     * Set the owner of the key. Only the key (or org) owner can change the owner of the key.
     *
     * @param owner The user-id of the new owner of the key.
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    async setOwner(owner, mfaReceipt) {
        await this.update({ owner }, mfaReceipt);
    }
    /**
     * Delete this key.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    async delete(mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").keyDelete(this.id, mfaReceipt);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Create a new key.
     *
     * @param client The API client to use.
     * @param data The JSON response from the API server.
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
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature (or MFA approval request).
     */
    async signEvm(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEvm(this, req, mfaReceipt);
    }
    /**
     * Sign a Babylon staking transaction.
     *
     * @param req The staking transaction to sign
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature (or MFA approval request).
     */
    async signBabylonStakingTxn(req, mfaReceipt) {
        return __classPrivateFieldGet(this, _Key_apiClient, "f").signBabylonStakingTxn(this, req, mfaReceipt);
    }
    /**
     * Sign a Babylon registration.
     *
     * @param req The registration request to sign
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Babylon staking registration data (or MFA approval request).
     */
    async signBabylonRegistration(req, mfaReceipt) {
        return __classPrivateFieldGet(this, _Key_apiClient, "f").signBabylonRegistration(this, req, mfaReceipt);
    }
    /**
     * Sign EIP-191 typed data.
     *
     * This requires the key to have a '"AllowEip191Signing"' {@link KeyPolicy}.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Signature (or MFA approval request).
     */
    async signEip191(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEip191(this, req, mfaReceipt);
    }
    /**
     * Sign EIP-712 typed data.
     *
     * This requires the key to have a '"AllowEip712Signing"' {@link KeyPolicy}.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Signature (or MFA approval request).
     */
    async signEip712(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEip712(this, req, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Signature
     */
    async signEth2(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signEth2(this, req, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param req The request to sign.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async unstake(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signUnstake(this, req, mfaReceipt);
    }
    /**
     * Sign an Avalanche P- or X-chain message.
     *
     * @param tx Avalanche message (transaction) to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signAva(tx, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signAva(this, tx, mfaReceipt);
    }
    /**
     * Sign a serialized Avalanche C-/X-/P-chain message.
     *
     * @param avaChain Avalanche chain
     * @param tx Hex encoded transaction
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
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
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBlob(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signBlob(this, req, mfaReceipt);
    }
    /**
     * Sign a Bitcoin transaction.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBtc(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signBtc(this, req, mfaReceipt);
    }
    /**
     * Sign a PSBT.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response
     */
    async signPsbt(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signPsbt(this, req, mfaReceipt);
    }
    /**
     * Sign a Bitcoin message.
     *
     * @param req The message to sign
     * @param opts Options for this request
     * @param opts.p2sh If this is a segwit key and p2sh is true, sign as p2sh-p2wpkh instead of p2wpkh. Defaults to false if not specified.
     * @param opts.metadata Optional arbitrary JSON metadata
     * @param opts.mfaReceipt Optional MFA receipt(s)
     * @returns The response
     */
    async signBtcMessage(req, opts) {
        const request = {
            data: (0, util_1.encodeToHex)(req),
            is_p2sh: opts.p2sh ?? false,
            metadata: opts.metadata,
        };
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signBtcMessage(this, request, opts.mfaReceipt);
    }
    /**
     * Sign a Solana message.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signSolana(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signSolana(this, req, mfaReceipt);
    }
    /**
     * Sign a SUI transaction.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signSui(req, mfaReceipt) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").signSui(this, req, mfaReceipt);
    }
    /**
     * Update the key.
     *
     * @param request The JSON request to send to the API server.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The JSON response from the API server.
     * @throws if MFA is required and no MFA receipts are provided
     * @internal
     */
    async update(request, mfaReceipt) {
        const resp = await __classPrivateFieldGet(this, _Key_apiClient, "f").keyUpdate(this.id, request, mfaReceipt);
        this.cached = resp.data();
        return this.cached;
    }
    /**
     * Fetch the key information.
     *
     * @returns The key information.
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
 * @param name The name of the property to set
 * @param value The new value of the property
 * @param delaysMs Delays in milliseconds between retries
 * @param mfaReceipt Optional MFA receipt(s)
 * @throws if MFA is required and no receipts are provided
 * @returns Updated key information
 * @internal
 */
async function _Key_setMetadataProperty(name, value, delaysMs, mfaReceipt) {
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
        }, mfaReceipt);
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
 * @param ty The schema key type.
 * @returns The key type.
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
        case "BabylonCov":
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
        case "SecpKaspaAddr":
            return Secp256k1.Kaspa;
        case "SecpKaspaTestAddr":
            return Secp256k1.KaspaTest;
        case "SchnorrKaspaAddr":
            return Secp256k1.KaspaSchnorr;
        case "SchnorrKaspaTestAddr":
            return Secp256k1.KaspaTestSchnorr;
        case "BlsPub":
            return Bls.Eth2Deposited;
        case "BlsInactive":
            return Bls.Eth2Inactive;
        case "BlsAvaIcm":
            return Bls.AvaIcm;
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
        case "P256OntologyAddr":
            return P256.Ontology;
        case "P256Neo3Addr":
            return P256.Neo3;
        case "SecpLtc":
            return Secp256k1.Ltc;
        case "SecpLtcTest":
            return Secp256k1.LtcTest;
        case "SecpXrpAddr":
            return Secp256k1.Xrp;
        case "Ed25519XrpAddr":
            return Ed25519.Xrp;
        // NOTE: if you are adding a new key type, update the `create ${keyType} key` test in key.test.ts
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFvcUJBLDhDQWtGQztBQXpzQkQsd0JBQTRDO0FBQzVDLGlDQUFxQztBQUVyQyx5QkFBeUI7QUFDekIsSUFBWSxTQXVCWDtBQXZCRCxXQUFZLFNBQVM7SUFDbkIsZ0NBQW1CLENBQUE7SUFDbkIsNEJBQWUsQ0FBQTtJQUNmLG9DQUF1QixDQUFBO0lBQ3ZCLDRCQUFlLENBQUE7SUFDZixvQ0FBdUIsQ0FBQTtJQUN2QixnQ0FBbUIsQ0FBQTtJQUNuQixzQ0FBeUIsQ0FBQTtJQUN6QixtQ0FBc0IsQ0FBQTtJQUN0QiwyQ0FBOEIsQ0FBQTtJQUM5Qix3Q0FBMkIsQ0FBQTtJQUMzQixzQ0FBeUIsQ0FBQTtJQUN6QixnQ0FBbUIsQ0FBQTtJQUNuQix3Q0FBMkIsQ0FBQTtJQUMzQixrQ0FBcUIsQ0FBQTtJQUNyQix3Q0FBMkIsQ0FBQTtJQUMzQixnREFBbUMsQ0FBQTtJQUNuQyxrQ0FBcUIsQ0FBQTtJQUNyQiwwQ0FBNkIsQ0FBQTtJQUM3QixvQ0FBdUIsQ0FBQTtJQUN2Qiw0Q0FBK0IsQ0FBQTtJQUMvQiw4Q0FBaUMsQ0FBQTtJQUNqQyxzREFBeUMsQ0FBQTtBQUMzQyxDQUFDLEVBdkJXLFNBQVMseUJBQVQsU0FBUyxRQXVCcEI7QUFFRCxtQkFBbUI7QUFDbkIsSUFBWSxHQUlYO0FBSkQsV0FBWSxHQUFHO0lBQ2IsK0JBQXdCLENBQUE7SUFDeEIsbUNBQTRCLENBQUE7SUFDNUIsMkJBQW9CLENBQUE7QUFDdEIsQ0FBQyxFQUpXLEdBQUcsbUJBQUgsR0FBRyxRQUlkO0FBRUQsdUJBQXVCO0FBQ3ZCLElBQVksT0FVWDtBQVZELFdBQVksT0FBTztJQUNqQix1Q0FBNEIsQ0FBQTtJQUM1QixpQ0FBc0IsQ0FBQTtJQUN0QixxQ0FBMEIsQ0FBQTtJQUMxQiwyQ0FBZ0MsQ0FBQTtJQUNoQyx5Q0FBOEIsQ0FBQTtJ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dHlwZSB7IFBhZ2VPcHRzIH0gZnJvbSBcIi4vcGFnaW5hdG9yXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEtleUluZm8sXG4gIFVwZGF0ZUtleVJlcXVlc3QsXG4gIFNjaGVtYUtleVR5cGUsXG4gIEtleUluUm9sZUluZm8sXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVzcG9uc2UsXG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRXRoMlNpZ25SZXF1ZXN0LFxuICBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gIEF2YVR4LFxuICBCbG9iU2lnblJlcXVlc3QsXG4gIEJ0Y1NpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVxdWVzdCxcbiAgU29sYW5hU2lnblJlc3BvbnNlLFxuICBCdGNNZXNzYWdlU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVzcG9uc2UsXG4gIEJsb2JTaWduUmVzcG9uc2UsXG4gIEF2YVNpZ25SZXNwb25zZSxcbiAgRXRoMlVuc3Rha2VSZXNwb25zZSxcbiAgRXRoMlNpZ25SZXNwb25zZSxcbiAgRWlwMTkxT3I3MTJTaWduUmVzcG9uc2UsXG4gIFBzYnRTaWduUmVxdWVzdCxcbiAgUHNidFNpZ25SZXNwb25zZSxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFwaUNsaWVudCxcbiAgQXZhQ2hhaW4sXG4gIEJhYnlsb25SZWdpc3RyYXRpb25SZXF1ZXN0LFxuICBCYWJ5bG9uUmVnaXN0cmF0aW9uUmVzcG9uc2UsXG4gIEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgQmFieWxvblN0YWtpbmdSZXNwb25zZSxcbiAgQnRjTWVzc2FnZVNpZ25SZXF1ZXN0LFxuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEVtcHR5LFxuICBFcnJSZXNwb25zZSxcbiAgSGlzdG9yaWNhbFR4LFxuICBKc29uVmFsdWUsXG4gIE1mYVJlY2VpcHRzLFxuICBTdWlTaWduUmVxdWVzdCxcbiAgU3VpU2lnblJlc3BvbnNlLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCwgZGVsYXkgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgZW5jb2RlVG9IZXggfSBmcm9tIFwiLi91dGlsXCI7XG5cbi8qKiBTZWNwMjU2azEga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIFNlY3AyNTZrMSB7XG4gIEV2bSA9IFwiU2VjcEV0aEFkZHJcIixcbiAgQnRjID0gXCJTZWNwQnRjXCIsXG4gIEJ0Y1Rlc3QgPSBcIlNlY3BCdGNUZXN0XCIsXG4gIEx0YyA9IFwiU2VjcEx0Y1wiLFxuICBMdGNUZXN0ID0gXCJTZWNwTHRjVGVzdFwiLFxuICBYcnAgPSBcIlNlY3BYcnBBZGRyXCIsXG4gIENvc21vcyA9IFwiU2VjcENvc21vc0FkZHJcIixcbiAgVGFwcm9vdCA9IFwiVGFwcm9vdEJ0Y1wiLFxuICBUYXByb290VGVzdCA9IFwiVGFwcm9vdEJ0Y1Rlc3RcIixcbiAgQmFieWxvbkVvdHMgPSBcIkJhYnlsb25Fb3RzXCIsXG4gIEJhYnlsb25Db3YgPSBcIkJhYnlsb25Db3ZcIixcbiAgQXZhID0gXCJTZWNwQXZhQWRkclwiLFxuICBBdmFUZXN0ID0gXCJTZWNwQXZhVGVzdEFkZHJcIixcbiAgVHJvbiA9IFwiU2VjcFRyb25BZGRyXCIsXG4gIEJ0Y0xlZ2FjeSA9IFwiU2VjcEJ0Y0xlZ2FjeVwiLFxuICBCdGNMZWdhY3lUZXN0ID0gXCJTZWNwQnRjTGVnYWN5VGVzdFwiLFxuICBEb2dlID0gXCJTZWNwRG9nZUFkZHJcIixcbiAgRG9nZVRlc3QgPSBcIlNlY3BEb2dlVGVzdEFkZHJcIixcbiAgS2FzcGEgPSBcIlNlY3BLYXNwYUFkZHJcIixcbiAgS2FzcGFUZXN0ID0gXCJTZWNwS2FzcGFUZXN0QWRkclwiLFxuICBLYXNwYVNjaG5vcnIgPSBcIlNjaG5vcnJLYXNwYUFkZHJcIixcbiAgS2FzcGFUZXN0U2Nobm9yciA9IFwiU2Nobm9yckthc3BhVGVzdEFkZHJcIixcbn1cblxuLyoqIEJMUyBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gQmxzIHtcbiAgRXRoMkRlcG9zaXRlZCA9IFwiQmxzUHViXCIsXG4gIEV0aDJJbmFjdGl2ZSA9IFwiQmxzSW5hY3RpdmVcIixcbiAgQXZhSWNtID0gXCJCbHNBdmFJY21cIixcbn1cblxuLyoqIEVkMjU1MTkga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIEVkMjU1MTkge1xuICBTb2xhbmEgPSBcIkVkMjU1MTlTb2xhbmFBZGRyXCIsXG4gIFN1aSA9IFwiRWQyNTUxOVN1aUFkZHJcIixcbiAgQXB0b3MgPSBcIkVkMjU1MTlBcHRvc0FkZHJcIixcbiAgQ2FyZGFubyA9IFwiRWQyNTUxOUNhcmRhbm9BZGRyVmtcIixcbiAgU3RlbGxhciA9IFwiRWQyNTUxOVN0ZWxsYXJBZGRyXCIsXG4gIFN1YnN0cmF0ZSA9IFwiRWQyNTUxOVN1YnN0cmF0ZUFkZHJcIixcbiAgVGVuZGVybWludCA9IFwiRWQyNTUxOVRlbmRlcm1pbnRBZGRyXCIsXG4gIFRvbiA9IFwiRWQyNTUxOVRvbkFkZHJcIixcbiAgWHJwID0gXCJFZDI1NTE5WHJwQWRkclwiLFxufVxuXG4vKiogUDI1NiBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gUDI1NiB7XG4gIENvc21vcyA9IFwiUDI1NkNvc21vc0FkZHJcIixcbiAgT250b2xvZ3kgPSBcIlAyNTZPbnRvbG9neUFkZHJcIixcbiAgTmVvMyA9IFwiUDI1Nk5lbzNBZGRyXCIsXG59XG5cbi8qKiBNbmVtb25pYyBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IE1uZW1vbmljID0gXCJNbmVtb25pY1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgTW5lbW9uaWMgPSB0eXBlb2YgTW5lbW9uaWM7XG5cbi8qKiBTdGFyayBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IFN0YXJrID0gXCJTdGFya1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgU3RhcmsgPSB0eXBlb2YgU3Rhcms7XG5cbi8qKiBLZXkgdHlwZSAqL1xuZXhwb3J0IHR5cGUgS2V5VHlwZSA9IFNlY3AyNTZrMSB8IEJscyB8IEVkMjU1MTkgfCBNbmVtb25pYyB8IFN0YXJrIHwgUDI1NjtcblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgc2lnbmluZyBrZXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXkge1xuICAvKiogVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdGhhdCB0aGlzIGtleSBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgb3JnYW5pemF0aW9uIHRoYXQgdGhpcyBrZXkgaXMgaW4gKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBpZCBvZiB0aGUga2V5OiBcIktleSNcIiBmb2xsb3dlZCBieSBhIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvXG4gICAqIHRoZSB0eXBlIG9mIGtleSAoc3VjaCBhcyBhIHB1YmxpYyBrZXkgZm9yIEJMUyBvciBhbiBldGhlcmV1bSBhZGRyZXNzIGZvciBTZWNwKVxuICAgKlxuICAgKiBAZXhhbXBsZSBLZXkjMHg4ZTM0ODQ2ODdlNjZjZGQyNmNmMDRjMzY0NzYzM2FiNGYzNTcwMTQ4XG4gICAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvIHRoZSB0eXBlIG9mIGtleSwgc3VjaCBhcyBhIHB1YmxpYyBrZXkgb3IgYW4gZXRoZXJldW0gYWRkcmVzc1xuICAgKlxuICAgKiBAZXhhbXBsZSAweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICovXG4gIHJlYWRvbmx5IG1hdGVyaWFsSWQhOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBIZXgtZW5jb2RlZCwgc2VyaWFsaXplZCBwdWJsaWMga2V5LiBUaGUgZm9ybWF0IHVzZWQgZGVwZW5kcyBvbiB0aGUga2V5IHR5cGU6XG4gICAqIC0gc2VjcDI1NmsxIGtleXMgdXNlIDY1LWJ5dGUgdW5jb21wcmVzc2VkIFNFQ0cgZm9ybWF0XG4gICAqIC0gQkxTIGtleXMgdXNlIDQ4LWJ5dGUgY29tcHJlc3NlZCBCTFMxMi0zODEgKFpDYXNoKSBmb3JtYXRcbiAgICogQGV4YW1wbGUgMHgwNGQyNjg4YjZiYzJjZTdmOTg3OWI5ZTc0NWYzYzRkYzE3NzkwOGM1Y2VmMGMxYjY0Y2ZmMTlhZTdmZjI3ZGVlNjIzYzY0ZmU5ZDljMzI1YzdmYmJjNzQ4YmJkNWY2MDdjZTE0ZGQ4M2UyOGViYmJiN2QzZTdmMmZmYjcwYTc5NDMxXG4gICAqL1xuICByZWFkb25seSBwdWJsaWNLZXk6IHN0cmluZztcblxuICAvKipcbiAgICogR2V0IHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIGtleS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmcgYEtleS5lbmFibGVkKClgXG4gICAqIG9yIGBLZXkuZGlzYWJsZSgpYCkuXG4gICAqL1xuICBjYWNoZWQ6IEtleUluZm87XG5cbiAgLyoqIEByZXR1cm5zIFRoZSB0eXBlIG9mIGtleS4gKi9cbiAgYXN5bmMgdHlwZSgpOiBQcm9taXNlPEtleVR5cGU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBmcm9tU2NoZW1hS2V5VHlwZShkYXRhLmtleV90eXBlKTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBrZXkgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgdGhlIGtleS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZW5hYmxlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIHRoZSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGRpc2FibGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgcm9sZXMgdGhpcyBrZXkgaXMgaW4uXG4gICAqIEByZXR1cm5zIFJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlJblJvbGVJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleVJvbGVzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgaGlzdG9yaWNhbCB0cmFuc2FjdGlvbnMgZm9yIHRoaXMga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgaGlzdG9yaWNhbCB0cmFuc2FjdGlvbnMgZm9yIHRoaXMga2V5LlxuICAgKiBAcmV0dXJucyBIaXN0b3JpY2FsIGtleSB0cmFuc2FjdGlvbnMuXG4gICAqL1xuICBhc3luYyBoaXN0b3J5KHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8SGlzdG9yaWNhbFR4W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUhpc3RvcnkodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIGtleSlcbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogS2V5UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQga2V5IG1ldGFkYXRhLiBUaGUgbWV0YWRhdGEgbXVzdCBiZSBhdCBtb3N0IDEwMjQgY2hhcmFjdGVyc1xuICAgKiBhbmQgbXVzdCBtYXRjaCB0aGUgZm9sbG93aW5nIHJlZ2V4OiBeW0EtWmEtejAtOV89Ky8gXFwtXFwuXFwsXXswLDEwMjR9JC5cbiAgICpcbiAgICogQHBhcmFtIG1ldGFkYXRhIFRoZSBuZXcgbWV0YWRhdGEgdG8gc2V0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIGtleSBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRNZXRhZGF0YShtZXRhZGF0YTogSnNvblZhbHVlLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBtZXRhZGF0YSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIG1ldGFkYXRhLCBhc3NlcnRzIHRoYXQgaXQgaXMgYW4gb2JqZWN0ICh0aHJvd3MgaWYgaXQgaXMgbm90KSxcbiAgICogdGhlbiBzZXRzIHRoZSB2YWx1ZSBvZiB0aGUge0BsaW5rIG5hbWV9IHByb3BlcnR5IGluIHRoYXQgb2JqZWN0IHRvIHtAbGluayB2YWx1ZX0sXG4gICAqIGFuZCBmaW5hbGx5IHN1Ym1pdHMgdGhlIHJlcXVlc3QgdG8gdXBkYXRlIHRoZSBtZXRhZGF0YS5cbiAgICpcbiAgICogVGhpcyB3aG9sZSBwcm9jZXNzIGlzIGRvbmUgYXRvbWljYWxseSwgbWVhbmluZywgdGhhdCBpZiB0aGUgbWV0YWRhdGEgY2hhbmdlcyBiZXR3ZWVuIHRoZVxuICAgKiB0aW1lIHRoaXMgbWV0aG9kIGZpcnN0IHJldHJpZXZlcyBpdCBhbmQgdGhlIHRpbWUgaXQgc3VibWl0cyBhIHJlcXVlc3QgdG8gdXBkYXRlIGl0LCB0aGVcbiAgICogcmVxdWVzdCB3aWxsIGJlIHJlamVjdGVkLiBXaGVuIHRoYXQgaGFwcGVucywgdGhpcyBtZXRob2Qgd2lsbCByZXRyeSBhIGZldyB0aW1lcywgYXMgcGVyXG4gICAqIHtAbGluayBBcGlDbGllbnQuY29uZmlnfS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHNldFxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIGtleSBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgc2V0TWV0YWRhdGFQcm9wZXJ0eShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IEpzb25WYWx1ZSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzZXRNZXRhZGF0YVByb3BlcnR5KFxuICAgICAgbmFtZSxcbiAgICAgIHZhbHVlLFxuICAgICAgdGhpcy4jYXBpQ2xpZW50LmNvbmZpZy51cGRhdGVSZXRyeURlbGF5c01zLFxuICAgICAgbWZhUmVjZWlwdCxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgZXhpc3RpbmcgbWV0YWRhdGEsIGFzc2VydHMgdGhhdCBpdCBpcyBpbiBvYmplY3QgKHRocm93cyBpZiBpdCBpcyBub3QpLFxuICAgKiB0aGVuIGRlbGV0ZXMgdGhlIHtAbGluayBuYW1lfSBwcm9wZXJ0eSBpbiB0aGF0IG9iamVjdCwgYW5kIGZpbmFsbHkgc3VibWl0cyB0aGVcbiAgICogcmVxdWVzdCB0byB1cGRhdGUgdGhlIG1ldGFkYXRhLlxuICAgKlxuICAgKiBUaGlzIHdob2xlIHByb2Nlc3MgaXMgZG9uZSBhdG9taWNhbGx5LCBtZWFuaW5nLCB0aGF0IGlmIHRoZSBtZXRhZGF0YSBjaGFuZ2VzIGJldHdlZW4gdGhlXG4gICAqIHRpbWUgdGhpcyBtZXRob2QgZmlyc3QgcmV0cmlldmVzIGl0IGFuZCB0aGUgdGltZSBpdCBzdWJtaXRzIGEgcmVxdWVzdCB0byB1cGRhdGUgaXQsIHRoZVxuICAgKiByZXF1ZXN0IHdpbGwgYmUgcmVqZWN0ZWQuIFdoZW4gdGhhdCBoYXBwZW5zLCB0aGlzIG1ldGhvZCB3aWxsIHJldHJ5IGEgZmV3IHRpbWVzLCBhcyBwZXJcbiAgICoge0BsaW5rIEFwaUNsaWVudC5jb25maWd9LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgVXBkYXRlZCBrZXkgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIGRlbGV0ZU1ldGFkYXRhUHJvcGVydHkobmFtZTogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2V0TWV0YWRhdGFQcm9wZXJ0eShcbiAgICAgIG5hbWUsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICB0aGlzLiNhcGlDbGllbnQuY29uZmlnLnVwZGF0ZVJldHJ5RGVsYXlzTXMsXG4gICAgICBtZmFSZWNlaXB0LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHNldFxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICogQHBhcmFtIGRlbGF5c01zIERlbGF5cyBpbiBtaWxsaXNlY29uZHMgYmV0d2VlbiByZXRyaWVzXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgVXBkYXRlZCBrZXkgaW5mb3JtYXRpb25cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyAjc2V0TWV0YWRhdGFQcm9wZXJ0eShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IEpzb25WYWx1ZSB8IHVuZGVmaW5lZCxcbiAgICBkZWxheXNNczogbnVtYmVyW10sXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBkYXRhLm1ldGFkYXRhID8/IHt9O1xuICAgIGlmICh0eXBlb2YgY3VycmVudCAhPT0gXCJvYmplY3RcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudCBtZXRhZGF0YSBpcyBub3QgYSBKU09OIG9iamVjdFwiKTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlZCA9IHtcbiAgICAgIC4uLmN1cnJlbnQsXG4gICAgICBbbmFtZV06IHZhbHVlLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZShcbiAgICAgICAge1xuICAgICAgICAgIG1ldGFkYXRhOiB1cGRhdGVkLFxuICAgICAgICAgIHZlcnNpb246IGRhdGEudmVyc2lvbixcbiAgICAgICAgfSxcbiAgICAgICAgbWZhUmVjZWlwdCxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKChlIGFzIEVyclJlc3BvbnNlKS5lcnJvckNvZGUgPT09IFwiSW52YWxpZFVwZGF0ZVwiICYmIGRlbGF5c01zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYXdhaXQgZGVsYXkoZGVsYXlzTXNbMF0pO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2V0TWV0YWRhdGFQcm9wZXJ0eShuYW1lLCB2YWx1ZSwgZGVsYXlzTXMuc2xpY2UoMSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHRvIGV4aXN0aW5nIGtleSBwb2xpY3kuIFRoaXMgYXBwZW5kIGlzIG5vdCBhdG9taWMgLS0gaXQgdXNlcyB7QGxpbmsgcG9saWN5fVxuICAgKiB0byBmZXRjaCB0aGUgY3VycmVudCBwb2xpY3kgYW5kIHRoZW4ge0BsaW5rIHNldFBvbGljeX0gdG8gc2V0IHRoZSBwb2xpY3kgLS0gYW5kXG4gICAqIHNob3VsZCBub3QgYmUgdXNlZCBpbiBhY3Jvc3MgY29uY3VycmVudCBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgcG9saWN5IHRvIGFwcGVuZCB0byB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKi9cbiAgYXN5bmMgYXBwZW5kUG9saWN5KHBvbGljeTogS2V5UG9saWN5KSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnBvbGljeSgpO1xuICAgIGF3YWl0IHRoaXMuc2V0UG9saWN5KFsuLi5leGlzdGluZywgLi4ucG9saWN5XSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgZm9yIHRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxLZXlQb2xpY3k+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgS2V5UG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBtZXRhZGF0YSBmb3IgdGhlIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBmb3IgdGhlIGtleS5cbiAgICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8SnNvblZhbHVlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5tZXRhZGF0YSBhcyBKc29uVmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHVzZXIgaWQgZm9yIHRoZSBvd25lciBvZiB0aGUga2V5XG4gICAqIEBleGFtcGxlIFVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBhc3luYyBvd25lcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEub3duZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvd25lciBvZiB0aGUga2V5LiBPbmx5IHRoZSBrZXkgKG9yIG9yZykgb3duZXIgY2FuIGNoYW5nZSB0aGUgb3duZXIgb2YgdGhlIGtleS5cbiAgICpcbiAgICogQHBhcmFtIG93bmVyIFRoZSB1c2VyLWlkIG9mIHRoZSBuZXcgb3duZXIgb2YgdGhlIGtleS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBvd25lciB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhpcyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqL1xuICBhc3luYyBkZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlEZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjbGllbnQ6IEFwaUNsaWVudCB8IEN1YmVTaWduZXJDbGllbnQsIGRhdGE6IEtleUluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBjbGllbnQgaW5zdGFuY2VvZiBDdWJlU2lnbmVyQ2xpZW50ID8gY2xpZW50LmFwaUNsaWVudCA6IGNsaWVudDtcbiAgICB0aGlzLmlkID0gZGF0YS5rZXlfaWQ7XG4gICAgdGhpcy5tYXRlcmlhbElkID0gZGF0YS5tYXRlcmlhbF9pZDtcbiAgICB0aGlzLnB1YmxpY0tleSA9IGRhdGEucHVibGljX2tleTtcbiAgICB0aGlzLmNhY2hlZCA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRXZtKFxuICAgIHJlcTogRXZtU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduRXZtKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJhYnlsb24gc3Rha2luZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgc3Rha2luZyB0cmFuc2FjdGlvbiB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25CYWJ5bG9uU3Rha2luZ1R4bihcbiAgICByZXE6IEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJhYnlsb25TdGFraW5nUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zaWduQmFieWxvblN0YWtpbmdUeG4odGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQmFieWxvbiByZWdpc3RyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHJlZ2lzdHJhdGlvbiByZXF1ZXN0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIEJhYnlsb24gc3Rha2luZyByZWdpc3RyYXRpb24gZGF0YSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJhYnlsb25SZWdpc3RyYXRpb24oXG4gICAgcmVxOiBCYWJ5bG9uUmVnaXN0cmF0aW9uUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJhYnlsb25SZWdpc3RyYXRpb25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNpZ25CYWJ5bG9uUmVnaXN0cmF0aW9uKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtMTkxIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXAxOTFTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXAxOTEoXG4gICAgcmVxOiBFaXAxOTFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkVpcDE5MSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTcxMiB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwNzEyU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKFxuICAgIHJlcTogRWlwNzEyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25FaXA3MTIodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHZhbGlkYXRpb24gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbkV0aDIoXG4gICAgcmVxOiBFdGgyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkV0aDIodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHVuc3Rha2UvZXhpdCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHVuc3Rha2UoXG4gICAgcmVxOiBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyVW5zdGFrZVJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblVuc3Rha2UodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEF2YWxhbmNoZSBQLSBvciBYLWNoYWluIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBBdmFsYW5jaGUgbWVzc2FnZSAodHJhbnNhY3Rpb24pIHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YSh0eDogQXZhVHgsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25BdmEodGhpcywgdHgsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzZXJpYWxpemVkIEF2YWxhbmNoZSBDLS9YLS9QLWNoYWluIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBhdmFDaGFpbiBBdmFsYW5jaGUgY2hhaW5cbiAgICogQHBhcmFtIHR4IEhleCBlbmNvZGVkIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TZXJpYWxpemVkQXZhKFxuICAgIGF2YUNoYWluOiBBdmFDaGFpbixcbiAgICB0eDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QXZhU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblNlcmlhbGl6ZWRBdmEodGhpcywgYXZhQ2hhaW4sIHR4LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgcmF3IGJsb2IuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dSYXdCbG9iU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS4gVGhpcyBpcyBiZWNhdXNlXG4gICAqIHNpZ25pbmcgYXJiaXRyYXJ5IG1lc3NhZ2VzIGlzLCBpbiBnZW5lcmFsLCBkYW5nZXJvdXMgKGFuZCB5b3Ugc2hvdWxkIGluc3RlYWRcbiAgICogcHJlZmVyIHR5cGVkIGVuZC1wb2ludHMgYXMgdXNlZCBieSwgZm9yIGV4YW1wbGUsIHtAbGluayBzaWduRXZtfSkuIEZvciBTZWNwMjU2azEga2V5cyxcbiAgICogZm9yIGV4YW1wbGUsIHlvdSAqKm11c3QqKiBjYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBhIG1lc3NhZ2UgdGhhdCBpcyAzMiBieXRlcyBsb25nIGFuZFxuICAgKiB0aGUgb3V0cHV0IG9mIGEgc2VjdXJlIGhhc2ggZnVuY3Rpb24uXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBzaWduYXR1cmVzIHNlcmlhbGl6ZWQgYXM7XG4gICAqXG4gICAqIC0gRUNEU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBhcyBiaWctZW5kaWFuIHIgYW5kIHMgcGx1cyByZWNvdmVyeS1pZFxuICAgKiAgICBieXRlIHYsIHdoaWNoIGNhbiBpbiBnZW5lcmFsIHRha2UgYW55IG9mIHRoZSB2YWx1ZXMgMCwgMSwgMiwgb3IgMy5cbiAgICpcbiAgICogLSBFZERTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGluIHRoZSBzdGFuZGFyZCBmb3JtYXQuXG4gICAqXG4gICAqIC0gQkxTIHNpZ25hdHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQgb24gdGhlIGJsb2Itc2lnbiBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJsb2IoXG4gICAgcmVxOiBCbG9iU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCbG9iU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkJsb2IodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkJ0Yyh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBQU0JULlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHNpZ25Qc2J0KFxuICAgIHJlcTogUHNidFNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8UHNidFNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25Qc2J0KHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJpdGNvaW4gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgbWVzc2FnZSB0byBzaWduXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbnMgZm9yIHRoaXMgcmVxdWVzdFxuICAgKiBAcGFyYW0gb3B0cy5wMnNoIElmIHRoaXMgaXMgYSBzZWd3aXQga2V5IGFuZCBwMnNoIGlzIHRydWUsIHNpZ24gYXMgcDJzaC1wMndwa2ggaW5zdGVhZCBvZiBwMndwa2guIERlZmF1bHRzIHRvIGZhbHNlIGlmIG5vdCBzcGVjaWZpZWQuXG4gICAqIEBwYXJhbSBvcHRzLm1ldGFkYXRhIE9wdGlvbmFsIGFyYml0cmFyeSBKU09OIG1ldGFkYXRhXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBzaWduQnRjTWVzc2FnZShcbiAgICByZXE6IFVpbnQ4QXJyYXkgfCBzdHJpbmcsXG4gICAgb3B0czogeyBwMnNoPzogYm9vbGVhbjsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzOyBtZXRhZGF0YT86IHVua25vd24gfSxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjTWVzc2FnZVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCByZXF1ZXN0OiBCdGNNZXNzYWdlU2lnblJlcXVlc3QgPSB7XG4gICAgICBkYXRhOiBlbmNvZGVUb0hleChyZXEpLFxuICAgICAgaXNfcDJzaDogb3B0cy5wMnNoID8/IGZhbHNlLFxuICAgICAgbWV0YWRhdGE6IG9wdHMubWV0YWRhdGEsXG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25CdGNNZXNzYWdlKHRoaXMsIHJlcXVlc3QsIG9wdHMubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNvbGFuYSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU29sYW5hKFxuICAgIHJlcTogU29sYW5hU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTb2xhbmFTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduU29sYW5hKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNVSSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblN1aShcbiAgICByZXE6IFN1aVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U3VpU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblN1aSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgdGhpcy5jYWNoZWQgPSByZXNwLmRhdGEoKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHRoaXMuY2FjaGVkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldCh0aGlzLmlkKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgc2NoZW1hIGtleSB0eXBlIHRvIGEga2V5IHR5cGUuXG4gKlxuICogQHBhcmFtIHR5IFRoZSBzY2hlbWEga2V5IHR5cGUuXG4gKiBAcmV0dXJucyBUaGUga2V5IHR5cGUuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21TY2hlbWFLZXlUeXBlKHR5OiBTY2hlbWFLZXlUeXBlKTogS2V5VHlwZSB7XG4gIHN3aXRjaCAodHkpIHtcbiAgICBjYXNlIFwiU2VjcEV0aEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuRXZtO1xuICAgIGNhc2UgXCJTZWNwQ29zbW9zQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5Db3Ntb3M7XG4gICAgY2FzZSBcIlNlY3BCdGNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjO1xuICAgIGNhc2UgXCJTZWNwQnRjVGVzdFwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGNUZXN0O1xuICAgIGNhc2UgXCJTZWNwQnRjTGVnYWN5XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0Y0xlZ2FjeTtcbiAgICBjYXNlIFwiU2VjcEJ0Y0xlZ2FjeVRlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjTGVnYWN5VGVzdDtcbiAgICBjYXNlIFwiU2VjcEF2YUFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQXZhO1xuICAgIGNhc2UgXCJTZWNwQXZhVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQXZhVGVzdDtcbiAgICBjYXNlIFwiQmFieWxvbkVvdHNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQmFieWxvbkVvdHM7XG4gICAgY2FzZSBcIkJhYnlsb25Db3ZcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQmFieWxvbkVvdHM7XG4gICAgY2FzZSBcIlRhcHJvb3RCdGNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuVGFwcm9vdDtcbiAgICBjYXNlIFwiVGFwcm9vdEJ0Y1Rlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuVGFwcm9vdFRlc3Q7XG4gICAgY2FzZSBcIlNlY3BUcm9uQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5Ucm9uO1xuICAgIGNhc2UgXCJTZWNwRG9nZUFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuRG9nZTtcbiAgICBjYXNlIFwiU2VjcERvZ2VUZXN0QWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5Eb2dlVGVzdDtcbiAgICBjYXNlIFwiU2VjcEthc3BhQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5LYXNwYTtcbiAgICBjYXNlIFwiU2VjcEthc3BhVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuS2FzcGFUZXN0O1xuICAgIGNhc2UgXCJTY2hub3JyS2FzcGFBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkthc3BhU2Nobm9ycjtcbiAgICBjYXNlIFwiU2Nobm9yckthc3BhVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuS2FzcGFUZXN0U2Nobm9ycjtcbiAgICBjYXNlIFwiQmxzUHViXCI6XG4gICAgICByZXR1cm4gQmxzLkV0aDJEZXBvc2l0ZWQ7XG4gICAgY2FzZSBcIkJsc0luYWN0aXZlXCI6XG4gICAgICByZXR1cm4gQmxzLkV0aDJJbmFjdGl2ZTtcbiAgICBjYXNlIFwiQmxzQXZhSWNtXCI6XG4gICAgICByZXR1cm4gQmxzLkF2YUljbTtcbiAgICBjYXNlIFwiRWQyNTUxOVNvbGFuYUFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlNvbGFuYTtcbiAgICBjYXNlIFwiRWQyNTUxOVN1aUFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlN1aTtcbiAgICBjYXNlIFwiRWQyNTUxOUFwdG9zQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQXB0b3M7XG4gICAgY2FzZSBcIkVkMjU1MTlDYXJkYW5vQWRkclZrXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5DYXJkYW5vO1xuICAgIGNhc2UgXCJFZDI1NTE5U3RlbGxhckFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlN0ZWxsYXI7XG4gICAgY2FzZSBcIkVkMjU1MTlTdWJzdHJhdGVBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5TdWJzdHJhdGU7XG4gICAgY2FzZSBcIkVkMjU1MTlUZW5kZXJtaW50QWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuVGVuZGVybWludDtcbiAgICBjYXNlIFwiRWQyNTUxOVRvbkFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlRvbjtcbiAgICBjYXNlIFwiU3RhcmtcIjpcbiAgICAgIHJldHVybiBTdGFyaztcbiAgICBjYXNlIFwiTW5lbW9uaWNcIjpcbiAgICAgIHJldHVybiBNbmVtb25pYztcbiAgICBjYXNlIFwiUDI1NkNvc21vc0FkZHJcIjpcbiAgICAgIHJldHVybiBQMjU2LkNvc21vcztcbiAgICBjYXNlIFwiUDI1Nk9udG9sb2d5QWRkclwiOlxuICAgICAgcmV0dXJuIFAyNTYuT250b2xvZ3k7XG4gICAgY2FzZSBcIlAyNTZOZW8zQWRkclwiOlxuICAgICAgcmV0dXJuIFAyNTYuTmVvMztcbiAgICBjYXNlIFwiU2VjcEx0Y1wiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5MdGM7XG4gICAgY2FzZSBcIlNlY3BMdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkx0Y1Rlc3Q7XG4gICAgY2FzZSBcIlNlY3BYcnBBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlhycDtcbiAgICBjYXNlIFwiRWQyNTUxOVhycEFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlhycDtcbiAgICAvLyBOT1RFOiBpZiB5b3UgYXJlIGFkZGluZyBhIG5ldyBrZXkgdHlwZSwgdXBkYXRlIHRoZSBgY3JlYXRlICR7a2V5VHlwZX0ga2V5YCB0ZXN0IGluIGtleS50ZXN0LnRzXG4gIH1cbn1cbiJdfQ==