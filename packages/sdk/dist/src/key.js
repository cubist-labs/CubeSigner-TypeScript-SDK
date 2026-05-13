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
exports.Key = exports.BabyJubjub = exports.Stark = exports.Mnemonic = exports.P256 = exports.Ed25519 = exports.Bls = exports.Secp256k1 = void 0;
exports.fromSchemaKeyType = fromSchemaKeyType;
const _1 = require(".");
const user_export_1 = require("./user_export");
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
    Ed25519["Canton"] = "Ed25519CantonAddr";
    Ed25519["Cardano"] = "Ed25519CardanoAddrVk";
    Ed25519["Stellar"] = "Ed25519StellarAddr";
    Ed25519["Substrate"] = "Ed25519SubstrateAddr";
    Ed25519["Tendermint"] = "Ed25519TendermintAddr";
    Ed25519["BinanceApi"] = "Ed25519BinanceApi";
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
/** Baby Jubjub key type */
exports.BabyJubjub = "BabyJubjub";
/**
 * A representation of a signing key.
 */
class Key {
    /** @returns The organization that this key is in */
    get orgId() {
        return __classPrivateFieldGet(this, _Key_apiClient, "f").sessionMeta.org_id;
    }
    /**
     * Attest to key properties.
     *
     * @param query Query parameters:
     * @param query.include_roles If specified, include all the roles the key is in.
     * @returns A JWT whose claims are the properties of the key. The type of the returned JWT payload is {@link KeyAttestationClaims}.
     */
    async attest(query) {
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").keyAttest(this.id, query);
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
     * Set new edit policy (overwriting any edit policies previously set for this key)
     *
     * @param editPolicy The new edit policy to set
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    async setEditPolicy(editPolicy, mfaReceipt) {
        await this.update({ edit_policy: editPolicy }, mfaReceipt);
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
     * Set key properties. Each field in the provided patch is independent: missing
     * means leave alone, `null` clears, a value sets. Sending `null` for the whole
     * field clears all properties on the key.
     *
     * @param patch Type-specific properties
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     * @returns The updated key info
     */
    async setProperties(patch, mfaReceipt) {
        return await this.update({ properties: patch }, mfaReceipt);
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
     * should not be used across concurrent sessions.
     *
     * @param policy The policy to append to the existing one.
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws If MFA is required and no MFA receipts are provided
     */
    async appendPolicy(policy, mfaReceipt) {
        const existing = await this.policy();
        await this.setPolicy([...existing, ...policy], mfaReceipt);
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
     * Get the edit policy for the key.
     *
     * @returns The edit policy for the key, undefined if there is no edit policy
     */
    async editPolicy() {
        const data = await this.fetch();
        return data.edit_policy;
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
     * Perform a Diffie-Hellman exchange with one or more public keys.
     *
     * This requires the key to have a '"AllowDiffieHellmanExchange"' {@link KeyPolicy}.
     * This is because performing arbitrary Diffie-Hellman exchanges using signing keys
     * is, in general, dangerous. You should only use this API if you are 100% sure that
     * you know what you're doing!
     *
     * @param points Up to 32 elliptic curve points with which to perform Diffie-Hellman exchanges. These points must be serialized in a key-type--specific format; see the CubeSigner documentation for more info.
     * @param publicKey The NIST P-256 public key with which the responses will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response. On success, the result can be decrypted with `diffieHellmanDecrypt`.
     */
    async diffieHellmanExchange(points, publicKey, mfaReceipt) {
        if (points.length > 32) {
            throw new Error("maximum 32 DH exchanges per request");
        }
        // construct the request
        const subtle = await (0, user_export_1.loadSubtleCrypto)();
        const req = {
            points: points.map((pt) => (0, util_1.encodeToBase64)(pt)),
            public_key: (0, util_1.encodeToBase64)(await subtle.exportKey("raw", publicKey)),
        };
        // send
        return await __classPrivateFieldGet(this, _Key_apiClient, "f").diffieHellmanExchange(this, req, mfaReceipt);
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
        case "Ed25519CantonAddr":
            return Ed25519.Canton;
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
        case "Ed25519BinanceApi":
            return Ed25519.BinanceApi;
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
        case "BabyJubjub":
            return exports.BabyJubjub;
        // NOTE: if you are adding a new key type, update the `create ${keyType} key` test in key.test.ts
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUE0d0JBLDhDQXdGQztBQWp6QkQsd0JBQTRDO0FBQzVDLCtDQUFpRDtBQUNqRCxpQ0FBcUQ7QUFNckQseUJBQXlCO0FBQ3pCLElBQVksU0F1Qlg7QUF2QkQsV0FBWSxTQUFTO0lBQ25CLGdDQUFtQixDQUFBO0lBQ25CLDRCQUFlLENBQUE7SUFDZixvQ0FBdUIsQ0FBQTtJQUN2Qiw0QkFBZSxDQUFBO0lBQ2Ysb0NBQXVCLENBQUE7SUFDdkIsZ0NBQW1CLENBQUE7SUFDbkIsc0NBQXlCLENBQUE7SUFDekIsbUNBQXNCLENBQUE7SUFDdEIsMkNBQThCLENBQUE7SUFDOUIsd0NBQTJCLENBQUE7SUFDM0Isc0NBQXlCLENBQUE7SUFDekIsZ0NBQW1CLENBQUE7SUFDbkIsd0NBQTJCLENBQUE7SUFDM0Isa0NBQXFCLENBQUE7SUFDckIsd0NBQTJCLENBQUE7SUFDM0IsZ0RBQW1DLENBQUE7SUFDbkMsa0NBQXFCLENBQUE7SUFDckIsMENBQTZCLENBQUE7SUFDN0Isb0NBQXVCLENBQUE7SUFDdkIsNENBQStCLENBQUE7SUFDL0IsOENBQWlDLENBQUE7SUFDakMsc0RBQXlDLENBQUE7QUFDM0MsQ0FBQyxFQXZCVyxTQUFTLHlCQUFULFNBQVMsUUF1QnBCO0FBRUQsbUJBQW1CO0FBQ25CLElBQVksR0FJWDtBQUpELFdBQVksR0FBRztJQUNiLCtCQUF3QixDQUFBO0lBQ3hCLG1DQUE0QixDQUFBO0lBQzVCLDJCQUFvQixDQUFBO0FBQ3RCLENBQUMsRUFKVyxHQUFHLG1CQUFILEdBQUcsUUFJZDtBQUVELHVCQUF1QjtBQUN2QixJQUFZLE9BWVg7QUFaRCxXQUFZLE9BQU87SUFDakIsdUNBQTRCLENBQUE7SUFDNUIsaUNBQXNCLENBQUE7SUFDdEIscUNBQTBCLENBQUE7SUFDMUIsdUNBQTRCLENBQUE7SUFDNUIs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Z0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNyQixLQUFLLGtCQUFrQjtZQUNyQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdkIsS0FBSyxjQUFjO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNuQixLQUFLLFNBQVM7WUFDWixPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7UUFDdkIsS0FBSyxhQUFhO1lBQ2hCLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUMzQixLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDO1FBQ3ZCLEtBQUssZ0JBQWdCO1lBQ25CLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNyQixLQUFLLFlBQVk7WUFDZixPQUFPLGtCQUFVLENBQUM7UUFDcEIsaUdBQWlHO0lBQ25HLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBLZXlQb2xpY3kgfSBmcm9tIFwiLi9yb2xlXCI7XG5pbXBvcnQgdHlwZSB7IFBhZ2VPcHRzIH0gZnJvbSBcIi4vcGFnaW5hdG9yXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEtleUluZm8sXG4gIFVwZGF0ZUtleVJlcXVlc3QsXG4gIFNjaGVtYUtleVR5cGUsXG4gIEtleUluUm9sZUluZm8sXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVzcG9uc2UsXG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRXRoMlNpZ25SZXF1ZXN0LFxuICBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gIEF2YVR4LFxuICBCbG9iU2lnblJlcXVlc3QsXG4gIEJ0Y1NpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVxdWVzdCxcbiAgU29sYW5hU2lnblJlc3BvbnNlLFxuICBCdGNNZXNzYWdlU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVzcG9uc2UsXG4gIEJsb2JTaWduUmVzcG9uc2UsXG4gIEF2YVNpZ25SZXNwb25zZSxcbiAgRXRoMlVuc3Rha2VSZXNwb25zZSxcbiAgRXRoMlNpZ25SZXNwb25zZSxcbiAgRWlwMTkxT3I3MTJTaWduUmVzcG9uc2UsXG4gIFBzYnRTaWduUmVxdWVzdCxcbiAgUHNidFNpZ25SZXNwb25zZSxcbiAgRGlmZmllSGVsbG1hblJlcXVlc3QsXG4gIERpZmZpZUhlbGxtYW5SZXNwb25zZSxcbiAgS2V5SW5mb0p3dCxcbiAgS2V5QXR0ZXN0YXRpb25RdWVyeSxcbiAgQmluYW5jZUFwaVByb3BlcnRpZXMsXG59IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHR5cGUge1xuICBBcGlDbGllbnQsXG4gIEF2YUNoYWluLFxuICBCYWJ5bG9uUmVnaXN0cmF0aW9uUmVxdWVzdCxcbiAgQmFieWxvblJlZ2lzdHJhdGlvblJlc3BvbnNlLFxuICBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gIEJhYnlsb25TdGFraW5nUmVzcG9uc2UsXG4gIEJ0Y01lc3NhZ2VTaWduUmVxdWVzdCxcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFZGl0UG9saWN5LFxuICBFbXB0eSxcbiAgRXJyUmVzcG9uc2UsXG4gIEhpc3RvcmljYWxUeCxcbiAgSnNvblZhbHVlLFxuICBNZmFSZWNlaXB0cyxcbiAgU3VpU2lnblJlcXVlc3QsXG4gIFN1aVNpZ25SZXNwb25zZSxcbn0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQsIGRlbGF5IH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGxvYWRTdWJ0bGVDcnlwdG8gfSBmcm9tIFwiLi91c2VyX2V4cG9ydFwiO1xuaW1wb3J0IHsgZW5jb2RlVG9IZXgsIGVuY29kZVRvQmFzZTY0IH0gZnJvbSBcIi4vdXRpbFwiO1xuXG4vLyB0aGVzZSB0eXBlcyBhcmUgdXNlZCBpbiBkb2MgY29tbWVudHMgb25seVxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuaW1wb3J0IHR5cGUgeyBLZXlBdHRlc3RhdGlvbkNsYWltcyB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuXG4vKiogU2VjcDI1NmsxIGtleSB0eXBlICovXG5leHBvcnQgZW51bSBTZWNwMjU2azEge1xuICBFdm0gPSBcIlNlY3BFdGhBZGRyXCIsXG4gIEJ0YyA9IFwiU2VjcEJ0Y1wiLFxuICBCdGNUZXN0ID0gXCJTZWNwQnRjVGVzdFwiLFxuICBMdGMgPSBcIlNlY3BMdGNcIixcbiAgTHRjVGVzdCA9IFwiU2VjcEx0Y1Rlc3RcIixcbiAgWHJwID0gXCJTZWNwWHJwQWRkclwiLFxuICBDb3Ntb3MgPSBcIlNlY3BDb3Ntb3NBZGRyXCIsXG4gIFRhcHJvb3QgPSBcIlRhcHJvb3RCdGNcIixcbiAgVGFwcm9vdFRlc3QgPSBcIlRhcHJvb3RCdGNUZXN0XCIsXG4gIEJhYnlsb25Fb3RzID0gXCJCYWJ5bG9uRW90c1wiLFxuICBCYWJ5bG9uQ292ID0gXCJCYWJ5bG9uQ292XCIsXG4gIEF2YSA9IFwiU2VjcEF2YUFkZHJcIixcbiAgQXZhVGVzdCA9IFwiU2VjcEF2YVRlc3RBZGRyXCIsXG4gIFRyb24gPSBcIlNlY3BUcm9uQWRkclwiLFxuICBCdGNMZWdhY3kgPSBcIlNlY3BCdGNMZWdhY3lcIixcbiAgQnRjTGVnYWN5VGVzdCA9IFwiU2VjcEJ0Y0xlZ2FjeVRlc3RcIixcbiAgRG9nZSA9IFwiU2VjcERvZ2VBZGRyXCIsXG4gIERvZ2VUZXN0ID0gXCJTZWNwRG9nZVRlc3RBZGRyXCIsXG4gIEthc3BhID0gXCJTZWNwS2FzcGFBZGRyXCIsXG4gIEthc3BhVGVzdCA9IFwiU2VjcEthc3BhVGVzdEFkZHJcIixcbiAgS2FzcGFTY2hub3JyID0gXCJTY2hub3JyS2FzcGFBZGRyXCIsXG4gIEthc3BhVGVzdFNjaG5vcnIgPSBcIlNjaG5vcnJLYXNwYVRlc3RBZGRyXCIsXG59XG5cbi8qKiBCTFMga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIEJscyB7XG4gIEV0aDJEZXBvc2l0ZWQgPSBcIkJsc1B1YlwiLFxuICBFdGgySW5hY3RpdmUgPSBcIkJsc0luYWN0aXZlXCIsXG4gIEF2YUljbSA9IFwiQmxzQXZhSWNtXCIsXG59XG5cbi8qKiBFZDI1NTE5IGtleSB0eXBlICovXG5leHBvcnQgZW51bSBFZDI1NTE5IHtcbiAgU29sYW5hID0gXCJFZDI1NTE5U29sYW5hQWRkclwiLFxuICBTdWkgPSBcIkVkMjU1MTlTdWlBZGRyXCIsXG4gIEFwdG9zID0gXCJFZDI1NTE5QXB0b3NBZGRyXCIsXG4gIENhbnRvbiA9IFwiRWQyNTUxOUNhbnRvbkFkZHJcIixcbiAgQ2FyZGFubyA9IFwiRWQyNTUxOUNhcmRhbm9BZGRyVmtcIixcbiAgU3RlbGxhciA9IFwiRWQyNTUxOVN0ZWxsYXJBZGRyXCIsXG4gIFN1YnN0cmF0ZSA9IFwiRWQyNTUxOVN1YnN0cmF0ZUFkZHJcIixcbiAgVGVuZGVybWludCA9IFwiRWQyNTUxOVRlbmRlcm1pbnRBZGRyXCIsXG4gIEJpbmFuY2VBcGkgPSBcIkVkMjU1MTlCaW5hbmNlQXBpXCIsXG4gIFRvbiA9IFwiRWQyNTUxOVRvbkFkZHJcIixcbiAgWHJwID0gXCJFZDI1NTE5WHJwQWRkclwiLFxufVxuXG4vKiogUDI1NiBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gUDI1NiB7XG4gIENvc21vcyA9IFwiUDI1NkNvc21vc0FkZHJcIixcbiAgT250b2xvZ3kgPSBcIlAyNTZPbnRvbG9neUFkZHJcIixcbiAgTmVvMyA9IFwiUDI1Nk5lbzNBZGRyXCIsXG59XG5cbi8qKiBNbmVtb25pYyBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IE1uZW1vbmljID0gXCJNbmVtb25pY1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgTW5lbW9uaWMgPSB0eXBlb2YgTW5lbW9uaWM7XG5cbi8qKiBTdGFyayBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IFN0YXJrID0gXCJTdGFya1wiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgU3RhcmsgPSB0eXBlb2YgU3Rhcms7XG5cbi8qKiBCYWJ5IEp1Ymp1YiBrZXkgdHlwZSAqL1xuZXhwb3J0IGNvbnN0IEJhYnlKdWJqdWIgPSBcIkJhYnlKdWJqdWJcIiBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEJhYnlKdWJqdWIgPSB0eXBlb2YgQmFieUp1Ymp1YjtcblxuLyoqIEtleSB0eXBlICovXG5leHBvcnQgdHlwZSBLZXlUeXBlID0gU2VjcDI1NmsxIHwgQmxzIHwgRWQyNTUxOSB8IE1uZW1vbmljIHwgU3RhcmsgfCBQMjU2IHwgQmFieUp1Ymp1YjtcblxuLyoqIFRoZSB0eXBlIHJlcHJlc2VudGluZyBhbGwgZGlmZmVyZW50IGtpbmRzIG9mIGtleSBwcm9wZXJ0aWVzLiAqL1xuZXhwb3J0IHR5cGUgS2V5UHJvcGVydGllc1BhdGNoID0geyBraW5kOiBcIkJpbmFuY2VBcGlcIiB9ICYgQmluYW5jZUFwaVByb3BlcnRpZXM7XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIHNpZ25pbmcga2V5LlxuICovXG5leHBvcnQgY2xhc3MgS2V5IHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoYXQgdGhpcyBrZXkgaXMgYXNzb2NpYXRlZCB3aXRoICovXG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcblxuICAvKiogQHJldHVybnMgVGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoaXMga2V5IGlzIGluICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25NZXRhLm9yZ19pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgaWQgb2YgdGhlIGtleTogXCJLZXkjXCIgZm9sbG93ZWQgYnkgYSB1bmlxdWUgaWRlbnRpZmllciBzcGVjaWZpYyB0b1xuICAgKiB0aGUgdHlwZSBvZiBrZXkgKHN1Y2ggYXMgYSBwdWJsaWMga2V5IGZvciBCTFMgb3IgYW4gZXRoZXJldW0gYWRkcmVzcyBmb3IgU2VjcClcbiAgICpcbiAgICogQGV4YW1wbGUgS2V5IzB4OGUzNDg0Njg3ZTY2Y2RkMjZjZjA0YzM2NDc2MzNhYjRmMzU3MDE0OFxuICAgKi9cbiAgcmVhZG9ubHkgaWQ6IHN0cmluZztcblxuICAvKipcbiAgICogQSB1bmlxdWUgaWRlbnRpZmllciBzcGVjaWZpYyB0byB0aGUgdHlwZSBvZiBrZXksIHN1Y2ggYXMgYSBwdWJsaWMga2V5IG9yIGFuIGV0aGVyZXVtIGFkZHJlc3NcbiAgICpcbiAgICogQGV4YW1wbGUgMHg4ZTM0ODQ2ODdlNjZjZGQyNmNmMDRjMzY0NzYzM2FiNGYzNTcwMTQ4XG4gICAqL1xuICByZWFkb25seSBtYXRlcmlhbElkITogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gSGV4LWVuY29kZWQsIHNlcmlhbGl6ZWQgcHVibGljIGtleS4gVGhlIGZvcm1hdCB1c2VkIGRlcGVuZHMgb24gdGhlIGtleSB0eXBlOlxuICAgKiAtIHNlY3AyNTZrMSBrZXlzIHVzZSA2NS1ieXRlIHVuY29tcHJlc3NlZCBTRUNHIGZvcm1hdFxuICAgKiAtIEJMUyBrZXlzIHVzZSA0OC1ieXRlIGNvbXByZXNzZWQgQkxTMTItMzgxIChaQ2FzaCkgZm9ybWF0XG4gICAqIEBleGFtcGxlIDB4MDRkMjY4OGI2YmMyY2U3Zjk4NzliOWU3NDVmM2M0ZGMxNzc5MDhjNWNlZjBjMWI2NGNmZjE5YWU3ZmYyN2RlZTYyM2M2NGZlOWQ5YzMyNWM3ZmJiYzc0OGJiZDVmNjA3Y2UxNGRkODNlMjhlYmJiYjdkM2U3ZjJmZmI3MGE3OTQzMVxuICAgKi9cbiAgcmVhZG9ubHkgcHVibGljS2V5OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyBrZXkuIFRoZSBjYWNoZWQgcHJvcGVydGllcyByZWZsZWN0IHRoZVxuICAgKiBzdGF0ZSBvZiB0aGUgbGFzdCBmZXRjaCBvciB1cGRhdGUgKGUuZy4sIGFmdGVyIGF3YWl0aW5nIGBLZXkuZW5hYmxlZCgpYFxuICAgKiBvciBgS2V5LmRpc2FibGUoKWApLlxuICAgKi9cbiAgY2FjaGVkOiBLZXlJbmZvO1xuXG4gIC8qKlxuICAgKiBBdHRlc3QgdG8ga2V5IHByb3BlcnRpZXMuXG4gICAqXG4gICAqIEBwYXJhbSBxdWVyeSBRdWVyeSBwYXJhbWV0ZXJzOlxuICAgKiBAcGFyYW0gcXVlcnkuaW5jbHVkZV9yb2xlcyBJZiBzcGVjaWZpZWQsIGluY2x1ZGUgYWxsIHRoZSByb2xlcyB0aGUga2V5IGlzIGluLlxuICAgKiBAcmV0dXJucyBBIEpXVCB3aG9zZSBjbGFpbXMgYXJlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBrZXkuIFRoZSB0eXBlIG9mIHRoZSByZXR1cm5lZCBKV1QgcGF5bG9hZCBpcyB7QGxpbmsgS2V5QXR0ZXN0YXRpb25DbGFpbXN9LlxuICAgKi9cbiAgYXN5bmMgYXR0ZXN0KHF1ZXJ5PzogS2V5QXR0ZXN0YXRpb25RdWVyeSk6IFByb21pc2U8S2V5SW5mb0p3dD4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5QXR0ZXN0KHRoaXMuaWQsIHF1ZXJ5KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgdHlwZSBvZiBrZXkuICovXG4gIGFzeW5jIHR5cGUoKTogUHJvbWlzZTxLZXlUeXBlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZnJvbVNjaGVtYUtleVR5cGUoZGF0YS5rZXlfdHlwZSk7XG4gIH1cblxuICAvKiogQHJldHVybnMgV2hldGhlciB0aGUga2V5IGlzIGVuYWJsZWQgKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVuYWJsZWQ7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHRoZSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGVuYWJsZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSB0aGUga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBkaXNhYmxlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCByb2xlcyB0aGlzIGtleSBpcyBpbi5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIHJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKiBAcmV0dXJucyBSb2xlcyB0aGlzIGtleSBpcyBpbi5cbiAgICovXG4gIGFzeW5jIHJvbGVzKHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8S2V5SW5Sb2xlSW5mb1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlSb2xlc0xpc3QodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGhpc3RvcmljYWwgdHJhbnNhY3Rpb25zIGZvciB0aGlzIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgT3B0aW9uYWwgcGFnaW5hdGlvbiBvcHRpb25zOyBieSBkZWZhdWx0LCByZXRyaWV2ZXMgYWxsIGhpc3RvcmljYWwgdHJhbnNhY3Rpb25zIGZvciB0aGlzIGtleS5cbiAgICogQHJldHVybnMgSGlzdG9yaWNhbCBrZXkgdHJhbnNhY3Rpb25zLlxuICAgKi9cbiAgYXN5bmMgaGlzdG9yeShwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEhpc3RvcmljYWxUeFtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlIaXN0b3J5KHRoaXMuaWQsIHBhZ2UpLmZldGNoKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBwb2xpY3kgKG92ZXJ3cml0aW5nIGFueSBwb2xpY2llcyBwcmV2aW91c2x5IHNldCBmb3IgdGhpcyBrZXkpXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBwb2xpY3kgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IEtleVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3kgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG5ldyBlZGl0IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IGVkaXQgcG9saWNpZXMgcHJldmlvdXNseSBzZXQgZm9yIHRoaXMga2V5KVxuICAgKlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgbmV3IGVkaXQgcG9saWN5IHRvIHNldFxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRFZGl0UG9saWN5KGVkaXRQb2xpY3k6IEVkaXRQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZWRpdF9wb2xpY3k6IGVkaXRQb2xpY3kgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGtleSBtZXRhZGF0YS4gVGhlIG1ldGFkYXRhIG11c3QgYmUgYXQgbW9zdCAxMDI0IGNoYXJhY3RlcnNcbiAgICogYW5kIG11c3QgbWF0Y2ggdGhlIGZvbGxvd2luZyByZWdleDogXltBLVphLXowLTlfPSsvIFxcLVxcLlxcLF17MCwxMDI0fSQuXG4gICAqXG4gICAqIEBwYXJhbSBtZXRhZGF0YSBUaGUgbmV3IG1ldGFkYXRhIHRvIHNldC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCBrZXkgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0TWV0YWRhdGEobWV0YWRhdGE6IEpzb25WYWx1ZSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKHsgbWV0YWRhdGEgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGtleSBwcm9wZXJ0aWVzLiBFYWNoIGZpZWxkIGluIHRoZSBwcm92aWRlZCBwYXRjaCBpcyBpbmRlcGVuZGVudDogbWlzc2luZ1xuICAgKiBtZWFucyBsZWF2ZSBhbG9uZSwgYG51bGxgIGNsZWFycywgYSB2YWx1ZSBzZXRzLiBTZW5kaW5nIGBudWxsYCBmb3IgdGhlIHdob2xlXG4gICAqIGZpZWxkIGNsZWFycyBhbGwgcHJvcGVydGllcyBvbiB0aGUga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gcGF0Y2ggVHlwZS1zcGVjaWZpYyBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQga2V5IGluZm9cbiAgICovXG4gIGFzeW5jIHNldFByb3BlcnRpZXMoXG4gICAgcGF0Y2g6IEtleVByb3BlcnRpZXNQYXRjaCB8IG51bGwsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBwcm9wZXJ0aWVzOiBwYXRjaCB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIG1ldGFkYXRhLCBhc3NlcnRzIHRoYXQgaXQgaXMgYW4gb2JqZWN0ICh0aHJvd3MgaWYgaXQgaXMgbm90KSxcbiAgICogdGhlbiBzZXRzIHRoZSB2YWx1ZSBvZiB0aGUge0BsaW5rIG5hbWV9IHByb3BlcnR5IGluIHRoYXQgb2JqZWN0IHRvIHtAbGluayB2YWx1ZX0sXG4gICAqIGFuZCBmaW5hbGx5IHN1Ym1pdHMgdGhlIHJlcXVlc3QgdG8gdXBkYXRlIHRoZSBtZXRhZGF0YS5cbiAgICpcbiAgICogVGhpcyB3aG9sZSBwcm9jZXNzIGlzIGRvbmUgYXRvbWljYWxseSwgbWVhbmluZywgdGhhdCBpZiB0aGUgbWV0YWRhdGEgY2hhbmdlcyBiZXR3ZWVuIHRoZVxuICAgKiB0aW1lIHRoaXMgbWV0aG9kIGZpcnN0IHJldHJpZXZlcyBpdCBhbmQgdGhlIHRpbWUgaXQgc3VibWl0cyBhIHJlcXVlc3QgdG8gdXBkYXRlIGl0LCB0aGVcbiAgICogcmVxdWVzdCB3aWxsIGJlIHJlamVjdGVkLiBXaGVuIHRoYXQgaGFwcGVucywgdGhpcyBtZXRob2Qgd2lsbCByZXRyeSBhIGZldyB0aW1lcywgYXMgcGVyXG4gICAqIHtAbGluayBBcGlDbGllbnQuY29uZmlnfS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHNldFxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIGtleSBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgc2V0TWV0YWRhdGFQcm9wZXJ0eShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IEpzb25WYWx1ZSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzZXRNZXRhZGF0YVByb3BlcnR5KFxuICAgICAgbmFtZSxcbiAgICAgIHZhbHVlLFxuICAgICAgdGhpcy4jYXBpQ2xpZW50LmNvbmZpZy51cGRhdGVSZXRyeURlbGF5c01zLFxuICAgICAgbWZhUmVjZWlwdCxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgZXhpc3RpbmcgbWV0YWRhdGEsIGFzc2VydHMgdGhhdCBpdCBpcyBpbiBvYmplY3QgKHRocm93cyBpZiBpdCBpcyBub3QpLFxuICAgKiB0aGVuIGRlbGV0ZXMgdGhlIHtAbGluayBuYW1lfSBwcm9wZXJ0eSBpbiB0aGF0IG9iamVjdCwgYW5kIGZpbmFsbHkgc3VibWl0cyB0aGVcbiAgICogcmVxdWVzdCB0byB1cGRhdGUgdGhlIG1ldGFkYXRhLlxuICAgKlxuICAgKiBUaGlzIHdob2xlIHByb2Nlc3MgaXMgZG9uZSBhdG9taWNhbGx5LCBtZWFuaW5nLCB0aGF0IGlmIHRoZSBtZXRhZGF0YSBjaGFuZ2VzIGJldHdlZW4gdGhlXG4gICAqIHRpbWUgdGhpcyBtZXRob2QgZmlyc3QgcmV0cmlldmVzIGl0IGFuZCB0aGUgdGltZSBpdCBzdWJtaXRzIGEgcmVxdWVzdCB0byB1cGRhdGUgaXQsIHRoZVxuICAgKiByZXF1ZXN0IHdpbGwgYmUgcmVqZWN0ZWQuIFdoZW4gdGhhdCBoYXBwZW5zLCB0aGlzIG1ldGhvZCB3aWxsIHJldHJ5IGEgZmV3IHRpbWVzLCBhcyBwZXJcbiAgICoge0BsaW5rIEFwaUNsaWVudC5jb25maWd9LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgVXBkYXRlZCBrZXkgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIGRlbGV0ZU1ldGFkYXRhUHJvcGVydHkobmFtZTogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2V0TWV0YWRhdGFQcm9wZXJ0eShcbiAgICAgIG5hbWUsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICB0aGlzLiNhcGlDbGllbnQuY29uZmlnLnVwZGF0ZVJldHJ5RGVsYXlzTXMsXG4gICAgICBtZmFSZWNlaXB0LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHNldFxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICogQHBhcmFtIGRlbGF5c01zIERlbGF5cyBpbiBtaWxsaXNlY29uZHMgYmV0d2VlbiByZXRyaWVzXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQHJldHVybnMgVXBkYXRlZCBrZXkgaW5mb3JtYXRpb25cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyAjc2V0TWV0YWRhdGFQcm9wZXJ0eShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IEpzb25WYWx1ZSB8IHVuZGVmaW5lZCxcbiAgICBkZWxheXNNczogbnVtYmVyW10sXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBkYXRhLm1ldGFkYXRhID8/IHt9O1xuICAgIGlmICh0eXBlb2YgY3VycmVudCAhPT0gXCJvYmplY3RcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudCBtZXRhZGF0YSBpcyBub3QgYSBKU09OIG9iamVjdFwiKTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlZCA9IHtcbiAgICAgIC4uLmN1cnJlbnQsXG4gICAgICBbbmFtZV06IHZhbHVlLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZShcbiAgICAgICAge1xuICAgICAgICAgIG1ldGFkYXRhOiB1cGRhdGVkLFxuICAgICAgICAgIHZlcnNpb246IGRhdGEudmVyc2lvbixcbiAgICAgICAgfSxcbiAgICAgICAgbWZhUmVjZWlwdCxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKChlIGFzIEVyclJlc3BvbnNlKS5lcnJvckNvZGUgPT09IFwiSW52YWxpZFVwZGF0ZVwiICYmIGRlbGF5c01zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYXdhaXQgZGVsYXkoZGVsYXlzTXNbMF0pO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2V0TWV0YWRhdGFQcm9wZXJ0eShuYW1lLCB2YWx1ZSwgZGVsYXlzTXMuc2xpY2UoMSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIHRvIGV4aXN0aW5nIGtleSBwb2xpY3kuIFRoaXMgYXBwZW5kIGlzIG5vdCBhdG9taWMgLS0gaXQgdXNlcyB7QGxpbmsgcG9saWN5fVxuICAgKiB0byBmZXRjaCB0aGUgY3VycmVudCBwb2xpY3kgYW5kIHRoZW4ge0BsaW5rIHNldFBvbGljeX0gdG8gc2V0IHRoZSBwb2xpY3kgLS0gYW5kXG4gICAqIHNob3VsZCBub3QgYmUgdXNlZCBhY3Jvc3MgY29uY3VycmVudCBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgcG9saWN5IHRvIGFwcGVuZCB0byB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIElmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgYXBwZW5kUG9saWN5KHBvbGljeTogS2V5UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMucG9saWN5KCk7XG4gICAgYXdhaXQgdGhpcy5zZXRQb2xpY3koWy4uLmV4aXN0aW5nLCAuLi5wb2xpY3ldLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBmb3IgdGhlIGtleS5cbiAgICovXG4gIGFzeW5jIHBvbGljeSgpOiBQcm9taXNlPEtleVBvbGljeT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBLZXlQb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGVkaXQgcG9saWN5IGZvciB0aGUga2V5LCB1bmRlZmluZWQgaWYgdGhlcmUgaXMgbm8gZWRpdCBwb2xpY3lcbiAgICovXG4gIGFzeW5jIGVkaXRQb2xpY3koKTogUHJvbWlzZTxFZGl0UG9saWN5IHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lZGl0X3BvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgbWV0YWRhdGEgZm9yIHRoZSBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgZm9yIHRoZSBrZXkuXG4gICAqL1xuICBhc3luYyBtZXRhZGF0YSgpOiBQcm9taXNlPEpzb25WYWx1ZT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEubWV0YWRhdGEgYXMgSnNvblZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB1c2VyIGlkIGZvciB0aGUgb3duZXIgb2YgdGhlIGtleVxuICAgKiBAZXhhbXBsZSBVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgYXN5bmMgb3duZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm93bmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgb3duZXIgb2YgdGhlIGtleS4gT25seSB0aGUga2V5IChvciBvcmcpIG93bmVyIGNhbiBjaGFuZ2UgdGhlIG93bmVyIG9mIHRoZSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBvd25lciBUaGUgdXNlci1pZCBvZiB0aGUgbmV3IG93bmVyIG9mIHRoZSBrZXkuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldE93bmVyKG93bmVyOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgb3duZXIgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoaXMga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBBIHJlc3BvbnNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5RGVsZXRlKHRoaXMuaWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGtleS5cbiAgICpcbiAgICogQHBhcmFtIGNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoY2xpZW50OiBBcGlDbGllbnQgfCBDdWJlU2lnbmVyQ2xpZW50LCBkYXRhOiBLZXlJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gY2xpZW50IGluc3RhbmNlb2YgQ3ViZVNpZ25lckNsaWVudCA/IGNsaWVudC5hcGlDbGllbnQgOiBjbGllbnQ7XG4gICAgdGhpcy5pZCA9IGRhdGEua2V5X2lkO1xuICAgIHRoaXMubWF0ZXJpYWxJZCA9IGRhdGEubWF0ZXJpYWxfaWQ7XG4gICAgdGhpcy5wdWJsaWNLZXkgPSBkYXRhLnB1YmxpY19rZXk7XG4gICAgdGhpcy5jYWNoZWQgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRVZNIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShcbiAgICByZXE6IEV2bVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkV2bSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCYWJ5bG9uIHN0YWtpbmcgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHN0YWtpbmcgdHJhbnNhY3Rpb24gdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduQmFieWxvblN0YWtpbmdUeG4oXG4gICAgcmVxOiBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCYWJ5bG9uU3Rha2luZ1Jlc3BvbnNlPj4ge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2lnbkJhYnlsb25TdGFraW5nVHhuKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJhYnlsb24gcmVnaXN0cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZWdpc3RyYXRpb24gcmVxdWVzdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBCYWJ5bG9uIHN0YWtpbmcgcmVnaXN0cmF0aW9uIGRhdGEgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25CYWJ5bG9uUmVnaXN0cmF0aW9uKFxuICAgIHJlcTogQmFieWxvblJlZ2lzdHJhdGlvblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCYWJ5bG9uUmVnaXN0cmF0aW9uUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zaWduQmFieWxvblJlZ2lzdHJhdGlvbih0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTE5MSB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwMTkxU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwMTkxKFxuICAgIHJlcTogRWlwMTkxU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25FaXAxOTEodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIEVJUC03MTIgdHlwZWQgZGF0YS5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0VpcDcxMlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDcxMihcbiAgICByZXE6IEVpcDcxMlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RWlwMTkxT3I3MTJTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduRWlwNzEyKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB2YWxpZGF0aW9uIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBTaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIHNpZ25FdGgyKFxuICAgIHJlcTogRXRoMlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25FdGgyKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB1bnN0YWtlL2V4aXQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyB1bnN0YWtlKFxuICAgIHJlcTogRXRoMlVuc3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25VbnN0YWtlKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBBdmFsYW5jaGUgUC0gb3IgWC1jaGFpbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gdHggQXZhbGFuY2hlIG1lc3NhZ2UgKHRyYW5zYWN0aW9uKSB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25BdmEodHg6IEF2YVR4LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBdmFTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduQXZhKHRoaXMsIHR4LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc2VyaWFsaXplZCBBdmFsYW5jaGUgQy0vWC0vUC1jaGFpbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gYXZhQ2hhaW4gQXZhbGFuY2hlIGNoYWluXG4gICAqIEBwYXJhbSB0eCBIZXggZW5jb2RlZCB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU2VyaWFsaXplZEF2YShcbiAgICBhdmFDaGFpbjogQXZhQ2hhaW4sXG4gICAgdHg6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25TZXJpYWxpemVkQXZhKHRoaXMsIGF2YUNoYWluLCB0eCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHJhdyBibG9iLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93UmF3QmxvYlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uIFRoaXMgaXMgYmVjYXVzZVxuICAgKiBzaWduaW5nIGFyYml0cmFyeSBtZXNzYWdlcyBpcywgaW4gZ2VuZXJhbCwgZGFuZ2Vyb3VzIChhbmQgeW91IHNob3VsZCBpbnN0ZWFkXG4gICAqIHByZWZlciB0eXBlZCBlbmQtcG9pbnRzIGFzIHVzZWQgYnksIGZvciBleGFtcGxlLCB7QGxpbmsgc2lnbkV2bX0pLiBGb3IgU2VjcDI1NmsxIGtleXMsXG4gICAqIGZvciBleGFtcGxlLCB5b3UgKiptdXN0KiogY2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggYSBtZXNzYWdlIHRoYXQgaXMgMzIgYnl0ZXMgbG9uZyBhbmRcbiAgICogdGhlIG91dHB1dCBvZiBhIHNlY3VyZSBoYXNoIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgc2lnbmF0dXJlcyBzZXJpYWxpemVkIGFzO1xuICAgKlxuICAgKiAtIEVDRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgYXMgYmlnLWVuZGlhbiByIGFuZCBzIHBsdXMgcmVjb3ZlcnktaWRcbiAgICogICAgYnl0ZSB2LCB3aGljaCBjYW4gaW4gZ2VuZXJhbCB0YWtlIGFueSBvZiB0aGUgdmFsdWVzIDAsIDEsIDIsIG9yIDMuXG4gICAqXG4gICAqIC0gRWREU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBpbiB0aGUgc3RhbmRhcmQgZm9ybWF0LlxuICAgKlxuICAgKiAtIEJMUyBzaWduYXR1cmVzIGFyZSBub3Qgc3VwcG9ydGVkIG9uIHRoZSBibG9iLXNpZ24gZW5kcG9pbnQuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKFxuICAgIHJlcTogQmxvYlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmxvYlNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25CbG9iKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybSBhIERpZmZpZS1IZWxsbWFuIGV4Y2hhbmdlIHdpdGggb25lIG9yIG1vcmUgcHVibGljIGtleXMuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2VcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqIFRoaXMgaXMgYmVjYXVzZSBwZXJmb3JtaW5nIGFyYml0cmFyeSBEaWZmaWUtSGVsbG1hbiBleGNoYW5nZXMgdXNpbmcgc2lnbmluZyBrZXlzXG4gICAqIGlzLCBpbiBnZW5lcmFsLCBkYW5nZXJvdXMuIFlvdSBzaG91bGQgb25seSB1c2UgdGhpcyBBUEkgaWYgeW91IGFyZSAxMDAlIHN1cmUgdGhhdFxuICAgKiB5b3Uga25vdyB3aGF0IHlvdSdyZSBkb2luZyFcbiAgICpcbiAgICogQHBhcmFtIHBvaW50cyBVcCB0byAzMiBlbGxpcHRpYyBjdXJ2ZSBwb2ludHMgd2l0aCB3aGljaCB0byBwZXJmb3JtIERpZmZpZS1IZWxsbWFuIGV4Y2hhbmdlcy4gVGhlc2UgcG9pbnRzIG11c3QgYmUgc2VyaWFsaXplZCBpbiBhIGtleS10eXBlLS1zcGVjaWZpYyBmb3JtYXQ7IHNlZSB0aGUgQ3ViZVNpZ25lciBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqIEBwYXJhbSBwdWJsaWNLZXkgVGhlIE5JU1QgUC0yNTYgcHVibGljIGtleSB3aXRoIHdoaWNoIHRoZSByZXNwb25zZXMgd2lsbCBiZSBlbmNyeXB0ZWQuIFRoaXMgc2hvdWxkIGJlIHRoZSBgcHVibGljS2V5YCBwcm9wZXJ0eSBvZiBhIHZhbHVlIHJldHVybmVkIGJ5IGB1c2VyRXhwb3J0S2V5Z2VuYC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS4gT24gc3VjY2VzcywgdGhlIHJlc3VsdCBjYW4gYmUgZGVjcnlwdGVkIHdpdGggYGRpZmZpZUhlbGxtYW5EZWNyeXB0YC5cbiAgICovXG4gIGFzeW5jIGRpZmZpZUhlbGxtYW5FeGNoYW5nZShcbiAgICBwb2ludHM6IFVpbnQ4QXJyYXlbXSxcbiAgICBwdWJsaWNLZXk6IENyeXB0b0tleSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPERpZmZpZUhlbGxtYW5SZXNwb25zZT4+IHtcbiAgICBpZiAocG9pbnRzLmxlbmd0aCA+IDMyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtYXhpbXVtIDMyIERIIGV4Y2hhbmdlcyBwZXIgcmVxdWVzdFwiKTtcbiAgICB9XG5cbiAgICAvLyBjb25zdHJ1Y3QgdGhlIHJlcXVlc3RcbiAgICBjb25zdCBzdWJ0bGUgPSBhd2FpdCBsb2FkU3VidGxlQ3J5cHRvKCk7XG4gICAgY29uc3QgcmVxOiBEaWZmaWVIZWxsbWFuUmVxdWVzdCA9IHtcbiAgICAgIHBvaW50czogcG9pbnRzLm1hcCgocHQpID0+IGVuY29kZVRvQmFzZTY0KHB0KSksXG4gICAgICBwdWJsaWNfa2V5OiBlbmNvZGVUb0Jhc2U2NChhd2FpdCBzdWJ0bGUuZXhwb3J0S2V5KFwicmF3XCIsIHB1YmxpY0tleSkpLFxuICAgIH07XG5cbiAgICAvLyBzZW5kXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5kaWZmaWVIZWxsbWFuRXhjaGFuZ2UodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkJ0Yyh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBQU0JULlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHNpZ25Qc2J0KFxuICAgIHJlcTogUHNidFNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8UHNidFNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25Qc2J0KHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJpdGNvaW4gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgbWVzc2FnZSB0byBzaWduXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbnMgZm9yIHRoaXMgcmVxdWVzdFxuICAgKiBAcGFyYW0gb3B0cy5wMnNoIElmIHRoaXMgaXMgYSBzZWd3aXQga2V5IGFuZCBwMnNoIGlzIHRydWUsIHNpZ24gYXMgcDJzaC1wMndwa2ggaW5zdGVhZCBvZiBwMndwa2guIERlZmF1bHRzIHRvIGZhbHNlIGlmIG5vdCBzcGVjaWZpZWQuXG4gICAqIEBwYXJhbSBvcHRzLm1ldGFkYXRhIE9wdGlvbmFsIGFyYml0cmFyeSBKU09OIG1ldGFkYXRhXG4gICAqIEBwYXJhbSBvcHRzLm1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBzaWduQnRjTWVzc2FnZShcbiAgICByZXE6IFVpbnQ4QXJyYXkgfCBzdHJpbmcsXG4gICAgb3B0czogeyBwMnNoPzogYm9vbGVhbjsgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzOyBtZXRhZGF0YT86IHVua25vd24gfSxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjTWVzc2FnZVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCByZXF1ZXN0OiBCdGNNZXNzYWdlU2lnblJlcXVlc3QgPSB7XG4gICAgICBkYXRhOiBlbmNvZGVUb0hleChyZXEpLFxuICAgICAgaXNfcDJzaDogb3B0cy5wMnNoID8/IGZhbHNlLFxuICAgICAgbWV0YWRhdGE6IG9wdHMubWV0YWRhdGEsXG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25CdGNNZXNzYWdlKHRoaXMsIHJlcXVlc3QsIG9wdHMubWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNvbGFuYSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU29sYW5hKFxuICAgIHJlcTogU29sYW5hU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTb2xhbmFTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduU29sYW5hKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNVSSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblN1aShcbiAgICByZXE6IFN1aVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U3VpU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblN1aSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgdGhpcy5jYWNoZWQgPSByZXNwLmRhdGEoKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHRoaXMuY2FjaGVkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUdldCh0aGlzLmlkKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgc2NoZW1hIGtleSB0eXBlIHRvIGEga2V5IHR5cGUuXG4gKlxuICogQHBhcmFtIHR5IFRoZSBzY2hlbWEga2V5IHR5cGUuXG4gKiBAcmV0dXJucyBUaGUga2V5IHR5cGUuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21TY2hlbWFLZXlUeXBlKHR5OiBTY2hlbWFLZXlUeXBlKTogS2V5VHlwZSB7XG4gIHN3aXRjaCAodHkpIHtcbiAgICBjYXNlIFwiU2VjcEV0aEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuRXZtO1xuICAgIGNhc2UgXCJTZWNwQ29zbW9zQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5Db3Ntb3M7XG4gICAgY2FzZSBcIlNlY3BCdGNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjO1xuICAgIGNhc2UgXCJTZWNwQnRjVGVzdFwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGNUZXN0O1xuICAgIGNhc2UgXCJTZWNwQnRjTGVnYWN5XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0Y0xlZ2FjeTtcbiAgICBjYXNlIFwiU2VjcEJ0Y0xlZ2FjeVRlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjTGVnYWN5VGVzdDtcbiAgICBjYXNlIFwiU2VjcEF2YUFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQXZhO1xuICAgIGNhc2UgXCJTZWNwQXZhVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQXZhVGVzdDtcbiAgICBjYXNlIFwiQmFieWxvbkVvdHNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQmFieWxvbkVvdHM7XG4gICAgY2FzZSBcIkJhYnlsb25Db3ZcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQmFieWxvbkVvdHM7XG4gICAgY2FzZSBcIlRhcHJvb3RCdGNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuVGFwcm9vdDtcbiAgICBjYXNlIFwiVGFwcm9vdEJ0Y1Rlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuVGFwcm9vdFRlc3Q7XG4gICAgY2FzZSBcIlNlY3BUcm9uQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5Ucm9uO1xuICAgIGNhc2UgXCJTZWNwRG9nZUFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuRG9nZTtcbiAgICBjYXNlIFwiU2VjcERvZ2VUZXN0QWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5Eb2dlVGVzdDtcbiAgICBjYXNlIFwiU2VjcEthc3BhQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5LYXNwYTtcbiAgICBjYXNlIFwiU2VjcEthc3BhVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuS2FzcGFUZXN0O1xuICAgIGNhc2UgXCJTY2hub3JyS2FzcGFBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkthc3BhU2Nobm9ycjtcbiAgICBjYXNlIFwiU2Nobm9yckthc3BhVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuS2FzcGFUZXN0U2Nobm9ycjtcbiAgICBjYXNlIFwiQmxzUHViXCI6XG4gICAgICByZXR1cm4gQmxzLkV0aDJEZXBvc2l0ZWQ7XG4gICAgY2FzZSBcIkJsc0luYWN0aXZlXCI6XG4gICAgICByZXR1cm4gQmxzLkV0aDJJbmFjdGl2ZTtcbiAgICBjYXNlIFwiQmxzQXZhSWNtXCI6XG4gICAgICByZXR1cm4gQmxzLkF2YUljbTtcbiAgICBjYXNlIFwiRWQyNTUxOVNvbGFuYUFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlNvbGFuYTtcbiAgICBjYXNlIFwiRWQyNTUxOVN1aUFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlN1aTtcbiAgICBjYXNlIFwiRWQyNTUxOUFwdG9zQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQXB0b3M7XG4gICAgY2FzZSBcIkVkMjU1MTlDYW50b25BZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5DYW50b247XG4gICAgY2FzZSBcIkVkMjU1MTlDYXJkYW5vQWRkclZrXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5DYXJkYW5vO1xuICAgIGNhc2UgXCJFZDI1NTE5U3RlbGxhckFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlN0ZWxsYXI7XG4gICAgY2FzZSBcIkVkMjU1MTlTdWJzdHJhdGVBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5TdWJzdHJhdGU7XG4gICAgY2FzZSBcIkVkMjU1MTlUZW5kZXJtaW50QWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuVGVuZGVybWludDtcbiAgICBjYXNlIFwiRWQyNTUxOVRvbkFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlRvbjtcbiAgICBjYXNlIFwiRWQyNTUxOUJpbmFuY2VBcGlcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LkJpbmFuY2VBcGk7XG4gICAgY2FzZSBcIlN0YXJrXCI6XG4gICAgICByZXR1cm4gU3Rhcms7XG4gICAgY2FzZSBcIk1uZW1vbmljXCI6XG4gICAgICByZXR1cm4gTW5lbW9uaWM7XG4gICAgY2FzZSBcIlAyNTZDb3Ntb3NBZGRyXCI6XG4gICAgICByZXR1cm4gUDI1Ni5Db3Ntb3M7XG4gICAgY2FzZSBcIlAyNTZPbnRvbG9neUFkZHJcIjpcbiAgICAgIHJldHVybiBQMjU2Lk9udG9sb2d5O1xuICAgIGNhc2UgXCJQMjU2TmVvM0FkZHJcIjpcbiAgICAgIHJldHVybiBQMjU2Lk5lbzM7XG4gICAgY2FzZSBcIlNlY3BMdGNcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuTHRjO1xuICAgIGNhc2UgXCJTZWNwTHRjVGVzdFwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5MdGNUZXN0O1xuICAgIGNhc2UgXCJTZWNwWHJwQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5YcnA7XG4gICAgY2FzZSBcIkVkMjU1MTlYcnBBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5YcnA7XG4gICAgY2FzZSBcIkJhYnlKdWJqdWJcIjpcbiAgICAgIHJldHVybiBCYWJ5SnVianViO1xuICAgIC8vIE5PVEU6IGlmIHlvdSBhcmUgYWRkaW5nIGEgbmV3IGtleSB0eXBlLCB1cGRhdGUgdGhlIGBjcmVhdGUgJHtrZXlUeXBlfSBrZXlgIHRlc3QgaW4ga2V5LnRlc3QudHNcbiAgfVxufVxuIl19