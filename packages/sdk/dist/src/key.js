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
            points: points.map((pt) => (0, util_1.encodeToBase64)(Buffer.from(pt))),
            public_key: (0, util_1.encodeToBase64)(Buffer.from(await subtle.exportKey("raw", publicKey))),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUE0d0JBLDhDQXdGQztBQWp6QkQsd0JBQTRDO0FBQzVDLCtDQUFpRDtBQUNqRCxpQ0FBcUQ7QUFNckQseUJBQXlCO0FBQ3pCLElBQVksU0F1Qlg7QUF2QkQsV0FBWSxTQUFTO0lBQ25CLGdDQUFtQixDQUFBO0lBQ25CLDRCQUFlLENBQUE7SUFDZixvQ0FBdUIsQ0FBQTtJQUN2Qiw0QkFBZSxDQUFBO0lBQ2Ysb0NBQXVCLENBQUE7SUFDdkIsZ0NBQW1CLENBQUE7SUFDbkIsc0NBQXlCLENBQUE7SUFDekIsbUNBQXNCLENBQUE7SUFDdEIsMkNBQThCLENBQUE7SUFDOUIsd0NBQTJCLENBQUE7SUFDM0Isc0NBQXlCLENBQUE7SUFDekIsZ0NBQW1CLENBQUE7SUFDbkIsd0NBQTJCLENBQUE7SUFDM0Isa0NBQXFCLENBQUE7SUFDckIsd0NBQTJCLENBQUE7SUFDM0IsZ0RBQW1DLENBQUE7SUFDbkMsa0NBQXFCLENBQUE7SUFDckIsMENBQTZCLENBQUE7SUFDN0Isb0NBQXVCLENBQUE7SUFDdkIsNENBQStCLENBQUE7SUFDL0IsOENBQWlDLENBQUE7SUFDakMsc0RBQXlDLENBQUE7QUFDM0MsQ0FBQyxFQXZCVyxTQUFTLHlCQUFULFNBQVMsUUF1QnBCO0FBRUQsbUJBQW1CO0FBQ25CLElBQVksR0FJWDtBQUpELFdBQVksR0FBRztJQUNiLCtCQUF3QixDQUFBO0lBQ3hCLG1DQUE0QixDQUFBO0lBQzVCLDJCQUFvQixDQUFBO0FBQ3RCLENBQUMsRUFKVyxHQUFHLG1CQUFILEdBQUcsUUFJZDtBQUVELHVCQUF1QjtBQUN2QixJQUFZLE9BWVg7QUFaRCxXQUFZLE9BQU87SUFDakIsdUNBQTRCLENBQUE7SUFDNUIsaUNBQXNCLENBQUE7SUFDdEIscUNBQTBCLENBQUE7SUFDMUIsdUNBQTRCLENBQUE7SUFDNUIsMkNBQWdDLENBQUE7SUFDaEMseUNBQThCLENBQUE7SUFDOUIsNkNBQWtDLENBQUE7SUFDbEMsK0NBQW9DLENBQUE7SUFDcEMsMkNBQWdDLENBQUE7SUFDaEMsaUNBQXNCLENBQUE7SUFDdEIsaUNBQXNCLENBQUE7QUFDeEIsQ0FBQyxFQVpXLE9BQU8sdUJBQVAsT0FBTyxRQVlsQjtBQUVELG9CQUFvQjtBQUNwQixJQUFZLElBSVg7QUFKRCxXQUFZLElBQUk7SUFDZCxpQ0FBeUIsQ0FBQTtJQUN6QixxQ0FBNkIsQ0FBQTtJQUM3Qiw2QkFBcUIsQ0FBQTtBQUN2QixDQUFDLEVBSlcsSUFBSSxvQkFBSixJQUFJLFFBSWY7QUFFRCx3QkFBd0I7QUFDWCxRQUFBLFFBQVEsR0FBRyxVQUFtQixDQUFDO0FBRzVDLHFCQUFxQjtBQUNSLFFBQUEsS0FBSyxHQUFHLE9BQWdCLENBQUM7QUFHdEMsMkJBQTJCO0FBQ2QsUUFBQSxVQUFVLEdBQUcsWUFBcUIsQ0FBQztBQVNoRDs7R0FFRztBQUNILE1BQWEsR0FBRztJQUlkLG9EQUFvRDtJQUNwRCxJQUFJLEtBQUs7UUFDUCxPQUFPLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQzVDLENBQUM7SUFnQ0Q7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUEyQjtRQUN0QyxPQUFPLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxnQ0FBZ0M7SUFDaEMsS0FBSyxDQUFDLElBQUk7UUFDUixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxPQUFPLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsMENBQTBDO0lBQzFDLEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBd0I7UUFDbkMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBd0I7UUFDcEMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBZTtRQUN6QixPQUFPLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ25FLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBZTtRQUMzQixPQUFPLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQWlCLEVBQUUsVUFBd0I7UUFDekQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBc0IsRUFBRSxVQUF3QjtRQUNsRSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFtQixFQUFFLFVBQXdCO1FBQzdELE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQ2pCLEtBQWdDLEVBQ2hDLFVBQXdCO1FBRXhCLE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7O09BZUc7SUFDSCxLQUFLLENBQUMsbUJBQW1CLENBQ3ZCLElBQVksRUFDWixLQUFnQixFQUNoQixVQUF3QjtRQUV4QixPQUFPLE1BQU0sdUJBQUEsSUFBSSxnREFBcUIsTUFBekIsSUFBSSxFQUNmLElBQUksRUFDSixLQUFLLEVBQ0wsdUJBQUEsSUFBSSxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFDMUMsVUFBVSxDQUNYLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxLQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBWSxFQUFFLFVBQXdCO1FBQ2pFLE9BQU8sTUFBTSx1QkFBQSxJQUFJLGdEQUFxQixNQUF6QixJQUFJLEVBQ2YsSUFBSSxFQUNKLFNBQVMsRUFDVCx1QkFBQSxJQUFJLHNCQUFXLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUMxQyxVQUFVLENBQ1gsQ0FBQztJQUNKLENBQUM7SUE0Q0Q7Ozs7Ozs7O09BUUc7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQWlCLEVBQUUsVUFBd0I7UUFDNUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksRUFBRSxDQUF5QixDQUFDO0lBQ3JELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFVBQVU7UUFDZCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDMUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLFFBQXFCLENBQUM7SUFDcEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQWEsRUFBRSxVQUF3QjtRQUNwRCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQXdCO1FBQ25DLE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVELDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBRTdFOzs7Ozs7T0FNRztJQUNILFlBQVksTUFBb0MsRUFBRSxJQUFhOztRQTdVL0QsK0RBQStEO1FBQ3RELGlDQUFzQjtRQTZVN0IsdUJBQUEsSUFBSSxrQkFBYyxNQUFNLFlBQVksbUJBQWdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sTUFBQSxDQUFDO1FBQ2pGLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUN0QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUNYLEdBQW1CLEVBQ25CLFVBQXdCO1FBRXhCLE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxxQkFBcUIsQ0FDekIsR0FBMEIsRUFDMUIsVUFBd0I7UUFFeEIsT0FBTyx1QkFBQSxJQUFJLHNCQUFXLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLHVCQUF1QixDQUMzQixHQUErQixFQUMvQixVQUF3QjtRQUV4QixPQUFPLHVCQUFBLElBQUksc0JBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQ2QsR0FBc0IsRUFDdEIsVUFBd0I7UUFFeEIsT0FBTyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUNkLEdBQXNCLEVBQ3RCLFVBQXdCO1FBRXhCLE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxRQUFRLENBQ1osR0FBb0IsRUFDcEIsVUFBd0I7UUFFeEIsT0FBTyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FDWCxHQUF1QixFQUN2QixVQUF3QjtRQUV4QixPQUFPLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQVMsRUFBRSxVQUF3QjtRQUMvQyxPQUFPLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLGlCQUFpQixDQUNyQixRQUFrQixFQUNsQixFQUFVLEVBQ1YsVUFBd0I7UUFFeEIsT0FBTyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXFCRztJQUNILEtBQUssQ0FBQyxRQUFRLENBQ1osR0FBb0IsRUFDcEIsVUFBd0I7UUFFeEIsT0FBTyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsS0FBSyxDQUFDLHFCQUFxQixDQUN6QixNQUFvQixFQUNwQixTQUFvQixFQUNwQixVQUF3QjtRQUV4QixJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFLENBQUM7WUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFRCx3QkFBd0I7UUFDeEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLDhCQUFnQixHQUFFLENBQUM7UUFDeEMsTUFBTSxHQUFHLEdBQXlCO1lBQ2hDLE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFBLHFCQUFjLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNELFVBQVUsRUFBRSxJQUFBLHFCQUFjLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7U0FDbEYsQ0FBQztRQUVGLE9BQU87UUFDUCxPQUFPLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQ1gsR0FBbUIsRUFDbkIsVUFBd0I7UUFFeEIsT0FBTyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FDWixHQUFvQixFQUNwQixVQUF3QjtRQUV4QixPQUFPLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUNsQixHQUF3QixFQUN4QixJQUFzRTtRQUV0RSxNQUFNLE9BQU8sR0FBMEI7WUFDckMsSUFBSSxFQUFFLElBQUEsa0JBQVcsRUFBQyxHQUFHLENBQUM7WUFDdEIsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSztZQUMzQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7U0FDeEIsQ0FBQztRQUNGLE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzlFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUNkLEdBQXNCLEVBQ3RCLFVBQXdCO1FBRXhCLE9BQU8sTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQ1gsR0FBbUIsRUFDbkIsVUFBd0I7UUFFeEIsT0FBTyxNQUFNLHVCQUFBLElBQUksc0JBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQXlCLEVBQUUsVUFBd0I7UUFDdEUsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNFLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzFCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxLQUFLLENBQUMsS0FBSztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQTVuQkQsa0JBNG5CQzs7QUE3YUM7Ozs7Ozs7O0dBUUc7QUFDSCxLQUFLLG1DQUNILElBQVksRUFDWixLQUE0QixFQUM1QixRQUFrQixFQUNsQixVQUF3QjtJQUV4QixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztJQUNwQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBQ0QsTUFBTSxPQUFPLEdBQUc7UUFDZCxHQUFHLE9BQU87UUFDVixDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUs7S0FDZCxDQUFDO0lBQ0YsSUFBSSxDQUFDO1FBQ0gsT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQ3RCO1lBQ0UsUUFBUSxFQUFFLE9BQU87WUFDakIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1NBQ3RCLEVBQ0QsVUFBVSxDQUNYLENBQUM7SUFDSixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLElBQUssQ0FBaUIsQ0FBQyxTQUFTLEtBQUssZUFBZSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDNUUsTUFBTSxJQUFBLFFBQUssRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QixPQUFPLE1BQU0sdUJBQUEsSUFBSSxnREFBcUIsTUFBekIsSUFBSSxFQUFzQixJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RSxDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDO0FBdVlIOzs7Ozs7R0FNRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLEVBQWlCO0lBQ2pELFFBQVEsRUFBRSxFQUFFLENBQUM7UUFDWCxLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDO1FBQ3ZCLEtBQUssZ0JBQWdCO1lBQ25CLE9BQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUMxQixLQUFLLFNBQVM7WUFDWixPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7UUFDdkIsS0FBSyxhQUFhO1lBQ2hCLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUMzQixLQUFLLGVBQWU7WUFDbEIsT0FBTyxTQUFTLENBQUMsU0FBUyxDQUFDO1FBQzdCLEtBQUssbUJBQW1CO1lBQ3RCLE9BQU8sU0FBUyxDQUFDLGFBQWEsQ0FBQztRQUNqQyxLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDO1FBQ3ZCLEtBQUssaUJBQWlCO1lBQ3BCLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUMzQixLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDO1FBQy9CLEtBQUssWUFBWTtZQUNmLE9BQU8sU0FBUyxDQUFDLFdBQVcsQ0FBQztRQUMvQixLQUFLLFlBQVk7WUFDZixPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUM7UUFDM0IsS0FBSyxnQkFBZ0I7WUFDbkIsT0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDO1FBQy9CLEtBQUssY0FBYztZQUNqQixPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDeEIsS0FBSyxjQUFjO1lBQ2pCLE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQztRQUN4QixLQUFLLGtCQUFrQjtZQUNyQixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDNUIsS0FBSyxlQUFlO1lBQ2xCLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQztRQUN6QixLQUFLLG1CQUFtQjtZQUN0QixPQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUM7UUFDN0IsS0FBSyxrQkFBa0I7WUFDckIsT0FBTyxTQUFTLENBQUMsWUFBWSxDQUFDO1FBQ2hDLEtBQUssc0JBQXNCO1lBQ3pCLE9BQU8sU0FBUyxDQUFDLGdCQUFnQixDQUFDO1FBQ3BDLEtBQUssUUFBUTtZQUNYLE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQztRQUMzQixLQUFLLGFBQWE7WUFDaEIsT0FBTyxHQUFHLENBQUMsWUFBWSxDQUFDO1FBQzFCLEtBQUssV0FBVztZQUNkLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUNwQixLQUFLLG1CQUFtQjtZQUN0QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDeEIsS0FBSyxnQkFBZ0I7WUFDbkIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3JCLEtBQUssa0JBQWtCO1lBQ3JCLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztRQUN2QixLQUFLLG1CQUFtQjtZQUN0QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDeEIsS0FBSyxzQkFBc0I7WUFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3pCLEtBQUssb0JBQW9CO1lBQ3ZCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUN6QixLQUFLLHNCQUFzQjtZQUN6QixPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDM0IsS0FBSyx1QkFBdUI7WUFDMUIsT0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQzVCLEtBQUssZ0JBQWdCO1lBQ25CLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNyQixLQUFLLG1CQUFtQjtZQUN0QixPQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFDNUIsS0FBSyxPQUFPO1lBQ1YsT0FBTyxhQUFLLENBQUM7UUFDZixLQUFLLFVBQVU7WUFDYixPQUFPLGdCQUFRLENBQUM7UUFDbEIsS0FBSyxnQkFBZ0I7WUFDbkIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3JCLEtBQUssa0JBQWtCO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLGNBQWM7WUFDakIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssU0FBUztZQUNaLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQztRQUN2QixLQUFLLGFBQWE7WUFDaEIsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDO1FBQzNCLEtBQUssYUFBYTtZQUNoQixPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7UUFDdkIsS0FBSyxnQkFBZ0I7WUFDbkIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3JCLEtBQUssWUFBWTtZQUNmLE9BQU8sa0JBQVUsQ0FBQztRQUNwQixpR0FBaUc7SUFDbkcsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEtleVBvbGljeSB9IGZyb20gXCIuL3JvbGVcIjtcbmltcG9ydCB0eXBlIHsgUGFnZU9wdHMgfSBmcm9tIFwiLi9wYWdpbmF0b3JcIjtcbmltcG9ydCB0eXBlIHtcbiAgS2V5SW5mbyxcbiAgVXBkYXRlS2V5UmVxdWVzdCxcbiAgU2NoZW1hS2V5VHlwZSxcbiAgS2V5SW5Sb2xlSW5mbyxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXNwb25zZSxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFdGgyU2lnblJlcXVlc3QsXG4gIEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgQXZhVHgsXG4gIEJsb2JTaWduUmVxdWVzdCxcbiAgQnRjU2lnblJlcXVlc3QsXG4gIFNvbGFuYVNpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVzcG9uc2UsXG4gIEJ0Y01lc3NhZ2VTaWduUmVzcG9uc2UsXG4gIEJ0Y1NpZ25SZXNwb25zZSxcbiAgQmxvYlNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlc3BvbnNlLFxuICBFdGgyVW5zdGFrZVJlc3BvbnNlLFxuICBFdGgyU2lnblJlc3BvbnNlLFxuICBFaXAxOTFPcjcxMlNpZ25SZXNwb25zZSxcbiAgUHNidFNpZ25SZXF1ZXN0LFxuICBQc2J0U2lnblJlc3BvbnNlLFxuICBEaWZmaWVIZWxsbWFuUmVxdWVzdCxcbiAgRGlmZmllSGVsbG1hblJlc3BvbnNlLFxuICBLZXlJbmZvSnd0LFxuICBLZXlBdHRlc3RhdGlvblF1ZXJ5LFxuICBCaW5hbmNlQXBpUHJvcGVydGllcyxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFwaUNsaWVudCxcbiAgQXZhQ2hhaW4sXG4gIEJhYnlsb25SZWdpc3RyYXRpb25SZXF1ZXN0LFxuICBCYWJ5bG9uUmVnaXN0cmF0aW9uUmVzcG9uc2UsXG4gIEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgQmFieWxvblN0YWtpbmdSZXNwb25zZSxcbiAgQnRjTWVzc2FnZVNpZ25SZXF1ZXN0LFxuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEVkaXRQb2xpY3ksXG4gIEVtcHR5LFxuICBFcnJSZXNwb25zZSxcbiAgSGlzdG9yaWNhbFR4LFxuICBKc29uVmFsdWUsXG4gIE1mYVJlY2VpcHRzLFxuICBTdWlTaWduUmVxdWVzdCxcbiAgU3VpU2lnblJlc3BvbnNlLFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCwgZGVsYXkgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgbG9hZFN1YnRsZUNyeXB0byB9IGZyb20gXCIuL3VzZXJfZXhwb3J0XCI7XG5pbXBvcnQgeyBlbmNvZGVUb0hleCwgZW5jb2RlVG9CYXNlNjQgfSBmcm9tIFwiLi91dGlsXCI7XG5cbi8vIHRoZXNlIHR5cGVzIGFyZSB1c2VkIGluIGRvYyBjb21tZW50cyBvbmx5XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG5pbXBvcnQgdHlwZSB7IEtleUF0dGVzdGF0aW9uQ2xhaW1zIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5cbi8qKiBTZWNwMjU2azEga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIFNlY3AyNTZrMSB7XG4gIEV2bSA9IFwiU2VjcEV0aEFkZHJcIixcbiAgQnRjID0gXCJTZWNwQnRjXCIsXG4gIEJ0Y1Rlc3QgPSBcIlNlY3BCdGNUZXN0XCIsXG4gIEx0YyA9IFwiU2VjcEx0Y1wiLFxuICBMdGNUZXN0ID0gXCJTZWNwTHRjVGVzdFwiLFxuICBYcnAgPSBcIlNlY3BYcnBBZGRyXCIsXG4gIENvc21vcyA9IFwiU2VjcENvc21vc0FkZHJcIixcbiAgVGFwcm9vdCA9IFwiVGFwcm9vdEJ0Y1wiLFxuICBUYXByb290VGVzdCA9IFwiVGFwcm9vdEJ0Y1Rlc3RcIixcbiAgQmFieWxvbkVvdHMgPSBcIkJhYnlsb25Fb3RzXCIsXG4gIEJhYnlsb25Db3YgPSBcIkJhYnlsb25Db3ZcIixcbiAgQXZhID0gXCJTZWNwQXZhQWRkclwiLFxuICBBdmFUZXN0ID0gXCJTZWNwQXZhVGVzdEFkZHJcIixcbiAgVHJvbiA9IFwiU2VjcFRyb25BZGRyXCIsXG4gIEJ0Y0xlZ2FjeSA9IFwiU2VjcEJ0Y0xlZ2FjeVwiLFxuICBCdGNMZWdhY3lUZXN0ID0gXCJTZWNwQnRjTGVnYWN5VGVzdFwiLFxuICBEb2dlID0gXCJTZWNwRG9nZUFkZHJcIixcbiAgRG9nZVRlc3QgPSBcIlNlY3BEb2dlVGVzdEFkZHJcIixcbiAgS2FzcGEgPSBcIlNlY3BLYXNwYUFkZHJcIixcbiAgS2FzcGFUZXN0ID0gXCJTZWNwS2FzcGFUZXN0QWRkclwiLFxuICBLYXNwYVNjaG5vcnIgPSBcIlNjaG5vcnJLYXNwYUFkZHJcIixcbiAgS2FzcGFUZXN0U2Nobm9yciA9IFwiU2Nobm9yckthc3BhVGVzdEFkZHJcIixcbn1cblxuLyoqIEJMUyBrZXkgdHlwZSAqL1xuZXhwb3J0IGVudW0gQmxzIHtcbiAgRXRoMkRlcG9zaXRlZCA9IFwiQmxzUHViXCIsXG4gIEV0aDJJbmFjdGl2ZSA9IFwiQmxzSW5hY3RpdmVcIixcbiAgQXZhSWNtID0gXCJCbHNBdmFJY21cIixcbn1cblxuLyoqIEVkMjU1MTkga2V5IHR5cGUgKi9cbmV4cG9ydCBlbnVtIEVkMjU1MTkge1xuICBTb2xhbmEgPSBcIkVkMjU1MTlTb2xhbmFBZGRyXCIsXG4gIFN1aSA9IFwiRWQyNTUxOVN1aUFkZHJcIixcbiAgQXB0b3MgPSBcIkVkMjU1MTlBcHRvc0FkZHJcIixcbiAgQ2FudG9uID0gXCJFZDI1NTE5Q2FudG9uQWRkclwiLFxuICBDYXJkYW5vID0gXCJFZDI1NTE5Q2FyZGFub0FkZHJWa1wiLFxuICBTdGVsbGFyID0gXCJFZDI1NTE5U3RlbGxhckFkZHJcIixcbiAgU3Vic3RyYXRlID0gXCJFZDI1NTE5U3Vic3RyYXRlQWRkclwiLFxuICBUZW5kZXJtaW50ID0gXCJFZDI1NTE5VGVuZGVybWludEFkZHJcIixcbiAgQmluYW5jZUFwaSA9IFwiRWQyNTUxOUJpbmFuY2VBcGlcIixcbiAgVG9uID0gXCJFZDI1NTE5VG9uQWRkclwiLFxuICBYcnAgPSBcIkVkMjU1MTlYcnBBZGRyXCIsXG59XG5cbi8qKiBQMjU2IGtleSB0eXBlICovXG5leHBvcnQgZW51bSBQMjU2IHtcbiAgQ29zbW9zID0gXCJQMjU2Q29zbW9zQWRkclwiLFxuICBPbnRvbG9neSA9IFwiUDI1Nk9udG9sb2d5QWRkclwiLFxuICBOZW8zID0gXCJQMjU2TmVvM0FkZHJcIixcbn1cblxuLyoqIE1uZW1vbmljIGtleSB0eXBlICovXG5leHBvcnQgY29uc3QgTW5lbW9uaWMgPSBcIk1uZW1vbmljXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBNbmVtb25pYyA9IHR5cGVvZiBNbmVtb25pYztcblxuLyoqIFN0YXJrIGtleSB0eXBlICovXG5leHBvcnQgY29uc3QgU3RhcmsgPSBcIlN0YXJrXCIgYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBTdGFyayA9IHR5cGVvZiBTdGFyaztcblxuLyoqIEJhYnkgSnVianViIGtleSB0eXBlICovXG5leHBvcnQgY29uc3QgQmFieUp1Ymp1YiA9IFwiQmFieUp1Ymp1YlwiIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQmFieUp1Ymp1YiA9IHR5cGVvZiBCYWJ5SnVianViO1xuXG4vKiogS2V5IHR5cGUgKi9cbmV4cG9ydCB0eXBlIEtleVR5cGUgPSBTZWNwMjU2azEgfCBCbHMgfCBFZDI1NTE5IHwgTW5lbW9uaWMgfCBTdGFyayB8IFAyNTYgfCBCYWJ5SnVianViO1xuXG4vKiogVGhlIHR5cGUgcmVwcmVzZW50aW5nIGFsbCBkaWZmZXJlbnQga2luZHMgb2Yga2V5IHByb3BlcnRpZXMuICovXG5leHBvcnQgdHlwZSBLZXlQcm9wZXJ0aWVzUGF0Y2ggPSB7IGtpbmQ6IFwiQmluYW5jZUFwaVwiIH0gJiBCaW5hbmNlQXBpUHJvcGVydGllcztcblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgc2lnbmluZyBrZXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXkge1xuICAvKiogVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdGhhdCB0aGlzIGtleSBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgb3JnYW5pemF0aW9uIHRoYXQgdGhpcyBrZXkgaXMgaW4gKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBpZCBvZiB0aGUga2V5OiBcIktleSNcIiBmb2xsb3dlZCBieSBhIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvXG4gICAqIHRoZSB0eXBlIG9mIGtleSAoc3VjaCBhcyBhIHB1YmxpYyBrZXkgZm9yIEJMUyBvciBhbiBldGhlcmV1bSBhZGRyZXNzIGZvciBTZWNwKVxuICAgKlxuICAgKiBAZXhhbXBsZSBLZXkjMHg4ZTM0ODQ2ODdlNjZjZGQyNmNmMDRjMzY0NzYzM2FiNGYzNTcwMTQ4XG4gICAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBIHVuaXF1ZSBpZGVudGlmaWVyIHNwZWNpZmljIHRvIHRoZSB0eXBlIG9mIGtleSwgc3VjaCBhcyBhIHB1YmxpYyBrZXkgb3IgYW4gZXRoZXJldW0gYWRkcmVzc1xuICAgKlxuICAgKiBAZXhhbXBsZSAweDhlMzQ4NDY4N2U2NmNkZDI2Y2YwNGMzNjQ3NjMzYWI0ZjM1NzAxNDhcbiAgICovXG4gIHJlYWRvbmx5IG1hdGVyaWFsSWQhOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBIZXgtZW5jb2RlZCwgc2VyaWFsaXplZCBwdWJsaWMga2V5LiBUaGUgZm9ybWF0IHVzZWQgZGVwZW5kcyBvbiB0aGUga2V5IHR5cGU6XG4gICAqIC0gc2VjcDI1NmsxIGtleXMgdXNlIDY1LWJ5dGUgdW5jb21wcmVzc2VkIFNFQ0cgZm9ybWF0XG4gICAqIC0gQkxTIGtleXMgdXNlIDQ4LWJ5dGUgY29tcHJlc3NlZCBCTFMxMi0zODEgKFpDYXNoKSBmb3JtYXRcbiAgICogQGV4YW1wbGUgMHgwNGQyNjg4YjZiYzJjZTdmOTg3OWI5ZTc0NWYzYzRkYzE3NzkwOGM1Y2VmMGMxYjY0Y2ZmMTlhZTdmZjI3ZGVlNjIzYzY0ZmU5ZDljMzI1YzdmYmJjNzQ4YmJkNWY2MDdjZTE0ZGQ4M2UyOGViYmJiN2QzZTdmMmZmYjcwYTc5NDMxXG4gICAqL1xuICByZWFkb25seSBwdWJsaWNLZXk6IHN0cmluZztcblxuICAvKipcbiAgICogR2V0IHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIGtleS4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiwgYWZ0ZXIgYXdhaXRpbmcgYEtleS5lbmFibGVkKClgXG4gICAqIG9yIGBLZXkuZGlzYWJsZSgpYCkuXG4gICAqL1xuICBjYWNoZWQ6IEtleUluZm87XG5cbiAgLyoqXG4gICAqIEF0dGVzdCB0byBrZXkgcHJvcGVydGllcy5cbiAgICpcbiAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5IHBhcmFtZXRlcnM6XG4gICAqIEBwYXJhbSBxdWVyeS5pbmNsdWRlX3JvbGVzIElmIHNwZWNpZmllZCwgaW5jbHVkZSBhbGwgdGhlIHJvbGVzIHRoZSBrZXkgaXMgaW4uXG4gICAqIEByZXR1cm5zIEEgSldUIHdob3NlIGNsYWltcyBhcmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGtleS4gVGhlIHR5cGUgb2YgdGhlIHJldHVybmVkIEpXVCBwYXlsb2FkIGlzIHtAbGluayBLZXlBdHRlc3RhdGlvbkNsYWltc30uXG4gICAqL1xuICBhc3luYyBhdHRlc3QocXVlcnk/OiBLZXlBdHRlc3RhdGlvblF1ZXJ5KTogUHJvbWlzZTxLZXlJbmZvSnd0PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlBdHRlc3QodGhpcy5pZCwgcXVlcnkpO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSB0eXBlIG9mIGtleS4gKi9cbiAgYXN5bmMgdHlwZSgpOiBQcm9taXNlPEtleVR5cGU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBmcm9tU2NoZW1hS2V5VHlwZShkYXRhLmtleV90eXBlKTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBrZXkgaXMgZW5hYmxlZCAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgdGhlIGtleS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZW5hYmxlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIHRoZSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGRpc2FibGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgcm9sZXMgdGhpcyBrZXkgaXMgaW4uXG4gICAqIEByZXR1cm5zIFJvbGVzIHRoaXMga2V5IGlzIGluLlxuICAgKi9cbiAgYXN5bmMgcm9sZXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlJblJvbGVJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleVJvbGVzTGlzdCh0aGlzLmlkLCBwYWdlKS5mZXRjaCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgaGlzdG9yaWNhbCB0cmFuc2FjdGlvbnMgZm9yIHRoaXMga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBPcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnM7IGJ5IGRlZmF1bHQsIHJldHJpZXZlcyBhbGwgaGlzdG9yaWNhbCB0cmFuc2FjdGlvbnMgZm9yIHRoaXMga2V5LlxuICAgKiBAcmV0dXJucyBIaXN0b3JpY2FsIGtleSB0cmFuc2FjdGlvbnMuXG4gICAqL1xuICBhc3luYyBoaXN0b3J5KHBhZ2U/OiBQYWdlT3B0cyk6IFByb21pc2U8SGlzdG9yaWNhbFR4W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmtleUhpc3RvcnkodGhpcy5pZCwgcGFnZSkuZmV0Y2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IHBvbGljeSAob3ZlcndyaXRpbmcgYW55IHBvbGljaWVzIHByZXZpb3VzbHkgc2V0IGZvciB0aGlzIGtleSlcbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IHBvbGljeSB0byBzZXRcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogS2V5UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbmV3IGVkaXQgcG9saWN5IChvdmVyd3JpdGluZyBhbnkgZWRpdCBwb2xpY2llcyBwcmV2aW91c2x5IHNldCBmb3IgdGhpcyBrZXkpXG4gICAqXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBuZXcgZWRpdCBwb2xpY3kgdG8gc2V0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldEVkaXRQb2xpY3koZWRpdFBvbGljeTogRWRpdFBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlZGl0X3BvbGljeTogZWRpdFBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQga2V5IG1ldGFkYXRhLiBUaGUgbWV0YWRhdGEgbXVzdCBiZSBhdCBtb3N0IDEwMjQgY2hhcmFjdGVyc1xuICAgKiBhbmQgbXVzdCBtYXRjaCB0aGUgZm9sbG93aW5nIHJlZ2V4OiBeW0EtWmEtejAtOV89Ky8gXFwtXFwuXFwsXXswLDEwMjR9JC5cbiAgICpcbiAgICogQHBhcmFtIG1ldGFkYXRhIFRoZSBuZXcgbWV0YWRhdGEgdG8gc2V0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIGtleSBpbmZvXG4gICAqL1xuICBhc3luYyBzZXRNZXRhZGF0YShtZXRhZGF0YTogSnNvblZhbHVlLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGUoeyBtZXRhZGF0YSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQga2V5IHByb3BlcnRpZXMuIEVhY2ggZmllbGQgaW4gdGhlIHByb3ZpZGVkIHBhdGNoIGlzIGluZGVwZW5kZW50OiBtaXNzaW5nXG4gICAqIG1lYW5zIGxlYXZlIGFsb25lLCBgbnVsbGAgY2xlYXJzLCBhIHZhbHVlIHNldHMuIFNlbmRpbmcgYG51bGxgIGZvciB0aGUgd2hvbGVcbiAgICogZmllbGQgY2xlYXJzIGFsbCBwcm9wZXJ0aWVzIG9uIHRoZSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBwYXRjaCBUeXBlLXNwZWNpZmljIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCBrZXkgaW5mb1xuICAgKi9cbiAgYXN5bmMgc2V0UHJvcGVydGllcyhcbiAgICBwYXRjaDogS2V5UHJvcGVydGllc1BhdGNoIHwgbnVsbCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZSh7IHByb3BlcnRpZXM6IHBhdGNoIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgZXhpc3RpbmcgbWV0YWRhdGEsIGFzc2VydHMgdGhhdCBpdCBpcyBhbiBvYmplY3QgKHRocm93cyBpZiBpdCBpcyBub3QpLFxuICAgKiB0aGVuIHNldHMgdGhlIHZhbHVlIG9mIHRoZSB7QGxpbmsgbmFtZX0gcHJvcGVydHkgaW4gdGhhdCBvYmplY3QgdG8ge0BsaW5rIHZhbHVlfSxcbiAgICogYW5kIGZpbmFsbHkgc3VibWl0cyB0aGUgcmVxdWVzdCB0byB1cGRhdGUgdGhlIG1ldGFkYXRhLlxuICAgKlxuICAgKiBUaGlzIHdob2xlIHByb2Nlc3MgaXMgZG9uZSBhdG9taWNhbGx5LCBtZWFuaW5nLCB0aGF0IGlmIHRoZSBtZXRhZGF0YSBjaGFuZ2VzIGJldHdlZW4gdGhlXG4gICAqIHRpbWUgdGhpcyBtZXRob2QgZmlyc3QgcmV0cmlldmVzIGl0IGFuZCB0aGUgdGltZSBpdCBzdWJtaXRzIGEgcmVxdWVzdCB0byB1cGRhdGUgaXQsIHRoZVxuICAgKiByZXF1ZXN0IHdpbGwgYmUgcmVqZWN0ZWQuIFdoZW4gdGhhdCBoYXBwZW5zLCB0aGlzIG1ldGhvZCB3aWxsIHJldHJ5IGEgZmV3IHRpbWVzLCBhcyBwZXJcbiAgICoge0BsaW5rIEFwaUNsaWVudC5jb25maWd9LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gc2V0XG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQga2V5IGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBzZXRNZXRhZGF0YVByb3BlcnR5KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZTogSnNvblZhbHVlLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NldE1ldGFkYXRhUHJvcGVydHkoXG4gICAgICBuYW1lLFxuICAgICAgdmFsdWUsXG4gICAgICB0aGlzLiNhcGlDbGllbnQuY29uZmlnLnVwZGF0ZVJldHJ5RGVsYXlzTXMsXG4gICAgICBtZmFSZWNlaXB0LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBleGlzdGluZyBtZXRhZGF0YSwgYXNzZXJ0cyB0aGF0IGl0IGlzIGluIG9iamVjdCAodGhyb3dzIGlmIGl0IGlzIG5vdCksXG4gICAqIHRoZW4gZGVsZXRlcyB0aGUge0BsaW5rIG5hbWV9IHByb3BlcnR5IGluIHRoYXQgb2JqZWN0LCBhbmQgZmluYWxseSBzdWJtaXRzIHRoZVxuICAgKiByZXF1ZXN0IHRvIHVwZGF0ZSB0aGUgbWV0YWRhdGEuXG4gICAqXG4gICAqIFRoaXMgd2hvbGUgcHJvY2VzcyBpcyBkb25lIGF0b21pY2FsbHksIG1lYW5pbmcsIHRoYXQgaWYgdGhlIG1ldGFkYXRhIGNoYW5nZXMgYmV0d2VlbiB0aGVcbiAgICogdGltZSB0aGlzIG1ldGhvZCBmaXJzdCByZXRyaWV2ZXMgaXQgYW5kIHRoZSB0aW1lIGl0IHN1Ym1pdHMgYSByZXF1ZXN0IHRvIHVwZGF0ZSBpdCwgdGhlXG4gICAqIHJlcXVlc3Qgd2lsbCBiZSByZWplY3RlZC4gV2hlbiB0aGF0IGhhcHBlbnMsIHRoaXMgbWV0aG9kIHdpbGwgcmV0cnkgYSBmZXcgdGltZXMsIGFzIHBlclxuICAgKiB7QGxpbmsgQXBpQ2xpZW50LmNvbmZpZ30uXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBzZXRcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIGtleSBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgZGVsZXRlTWV0YWRhdGFQcm9wZXJ0eShuYW1lOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzZXRNZXRhZGF0YVByb3BlcnR5KFxuICAgICAgbmFtZSxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIHRoaXMuI2FwaUNsaWVudC5jb25maWcudXBkYXRlUmV0cnlEZWxheXNNcyxcbiAgICAgIG1mYVJlY2VpcHQsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gc2V0XG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0gZGVsYXlzTXMgRGVsYXlzIGluIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIHJldHJpZXNcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIGtleSBpbmZvcm1hdGlvblxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jICNzZXRNZXRhZGF0YVByb3BlcnR5KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZTogSnNvblZhbHVlIHwgdW5kZWZpbmVkLFxuICAgIGRlbGF5c01zOiBudW1iZXJbXSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgY29uc3QgY3VycmVudCA9IGRhdGEubWV0YWRhdGEgPz8ge307XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDdXJyZW50IG1ldGFkYXRhIGlzIG5vdCBhIEpTT04gb2JqZWN0XCIpO1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGVkID0ge1xuICAgICAgLi4uY3VycmVudCxcbiAgICAgIFtuYW1lXTogdmFsdWUsXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlKFxuICAgICAgICB7XG4gICAgICAgICAgbWV0YWRhdGE6IHVwZGF0ZWQsXG4gICAgICAgICAgdmVyc2lvbjogZGF0YS52ZXJzaW9uLFxuICAgICAgICB9LFxuICAgICAgICBtZmFSZWNlaXB0LFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoKGUgYXMgRXJyUmVzcG9uc2UpLmVycm9yQ29kZSA9PT0gXCJJbnZhbGlkVXBkYXRlXCIgJiYgZGVsYXlzTXMubGVuZ3RoID4gMCkge1xuICAgICAgICBhd2FpdCBkZWxheShkZWxheXNNc1swXSk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLiNzZXRNZXRhZGF0YVByb3BlcnR5KG5hbWUsIHZhbHVlLCBkZWxheXNNcy5zbGljZSgxKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgdG8gZXhpc3Rpbmcga2V5IHBvbGljeS4gVGhpcyBhcHBlbmQgaXMgbm90IGF0b21pYyAtLSBpdCB1c2VzIHtAbGluayBwb2xpY3l9XG4gICAqIHRvIGZldGNoIHRoZSBjdXJyZW50IHBvbGljeSBhbmQgdGhlbiB7QGxpbmsgc2V0UG9saWN5fSB0byBzZXQgdGhlIHBvbGljeSAtLSBhbmRcbiAgICogc2hvdWxkIG5vdCBiZSB1c2VkIGFjcm9zcyBjb25jdXJyZW50IHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBwb2xpY3kgdG8gYXBwZW5kIHRvIHRoZSBleGlzdGluZyBvbmUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEB0aHJvd3MgSWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyBNRkEgcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBhcHBlbmRQb2xpY3kocG9saWN5OiBLZXlQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5wb2xpY3koKTtcbiAgICBhd2FpdCB0aGlzLnNldFBvbGljeShbLi4uZXhpc3RpbmcsIC4uLnBvbGljeV0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcG9saWN5IGZvciB0aGUga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IGZvciB0aGUga2V5LlxuICAgKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8S2V5UG9saWN5PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gKGRhdGEucG9saWN5ID8/IFtdKSBhcyB1bmtub3duIGFzIEtleVBvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGVkaXQgcG9saWN5IGZvciB0aGUga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZWRpdCBwb2xpY3kgZm9yIHRoZSBrZXksIHVuZGVmaW5lZCBpZiB0aGVyZSBpcyBubyBlZGl0IHBvbGljeVxuICAgKi9cbiAgYXN5bmMgZWRpdFBvbGljeSgpOiBQcm9taXNlPEVkaXRQb2xpY3kgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVkaXRfcG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBtZXRhZGF0YSBmb3IgdGhlIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBmb3IgdGhlIGtleS5cbiAgICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8SnNvblZhbHVlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5tZXRhZGF0YSBhcyBKc29uVmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHVzZXIgaWQgZm9yIHRoZSBvd25lciBvZiB0aGUga2V5XG4gICAqIEBleGFtcGxlIFVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBhc3luYyBvd25lcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEub3duZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBvd25lciBvZiB0aGUga2V5LiBPbmx5IHRoZSBrZXkgKG9yIG9yZykgb3duZXIgY2FuIGNoYW5nZSB0aGUgb3duZXIgb2YgdGhlIGtleS5cbiAgICpcbiAgICogQHBhcmFtIG93bmVyIFRoZSB1c2VyLWlkIG9mIHRoZSBuZXcgb3duZXIgb2YgdGhlIGtleS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBvd25lciB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhpcyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqL1xuICBhc3luYyBkZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlEZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjbGllbnQ6IEFwaUNsaWVudCB8IEN1YmVTaWduZXJDbGllbnQsIGRhdGE6IEtleUluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBjbGllbnQgaW5zdGFuY2VvZiBDdWJlU2lnbmVyQ2xpZW50ID8gY2xpZW50LmFwaUNsaWVudCA6IGNsaWVudDtcbiAgICB0aGlzLmlkID0gZGF0YS5rZXlfaWQ7XG4gICAgdGhpcy5tYXRlcmlhbElkID0gZGF0YS5tYXRlcmlhbF9pZDtcbiAgICB0aGlzLnB1YmxpY0tleSA9IGRhdGEucHVibGljX2tleTtcbiAgICB0aGlzLmNhY2hlZCA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRXZtKFxuICAgIHJlcTogRXZtU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduRXZtKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJhYnlsb24gc3Rha2luZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgc3Rha2luZyB0cmFuc2FjdGlvbiB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25CYWJ5bG9uU3Rha2luZ1R4bihcbiAgICByZXE6IEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJhYnlsb25TdGFraW5nUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zaWduQmFieWxvblN0YWtpbmdUeG4odGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQmFieWxvbiByZWdpc3RyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHJlZ2lzdHJhdGlvbiByZXF1ZXN0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIEJhYnlsb24gc3Rha2luZyByZWdpc3RyYXRpb24gZGF0YSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJhYnlsb25SZWdpc3RyYXRpb24oXG4gICAgcmVxOiBCYWJ5bG9uUmVnaXN0cmF0aW9uUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJhYnlsb25SZWdpc3RyYXRpb25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gdGhpcy4jYXBpQ2xpZW50LnNpZ25CYWJ5bG9uUmVnaXN0cmF0aW9uKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtMTkxIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXAxOTFTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXAxOTEoXG4gICAgcmVxOiBFaXAxOTFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkVpcDE5MSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTcxMiB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwNzEyU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKFxuICAgIHJlcTogRWlwNzEyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25FaXA3MTIodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHZhbGlkYXRpb24gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbkV0aDIoXG4gICAgcmVxOiBFdGgyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkV0aDIodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHVuc3Rha2UvZXhpdCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHVuc3Rha2UoXG4gICAgcmVxOiBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyVW5zdGFrZVJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblVuc3Rha2UodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEF2YWxhbmNoZSBQLSBvciBYLWNoYWluIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBBdmFsYW5jaGUgbWVzc2FnZSAodHJhbnNhY3Rpb24pIHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YSh0eDogQXZhVHgsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25BdmEodGhpcywgdHgsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzZXJpYWxpemVkIEF2YWxhbmNoZSBDLS9YLS9QLWNoYWluIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBhdmFDaGFpbiBBdmFsYW5jaGUgY2hhaW5cbiAgICogQHBhcmFtIHR4IEhleCBlbmNvZGVkIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TZXJpYWxpemVkQXZhKFxuICAgIGF2YUNoYWluOiBBdmFDaGFpbixcbiAgICB0eDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QXZhU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblNlcmlhbGl6ZWRBdmEodGhpcywgYXZhQ2hhaW4sIHR4LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgcmF3IGJsb2IuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dSYXdCbG9iU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS4gVGhpcyBpcyBiZWNhdXNlXG4gICAqIHNpZ25pbmcgYXJiaXRyYXJ5IG1lc3NhZ2VzIGlzLCBpbiBnZW5lcmFsLCBkYW5nZXJvdXMgKGFuZCB5b3Ugc2hvdWxkIGluc3RlYWRcbiAgICogcHJlZmVyIHR5cGVkIGVuZC1wb2ludHMgYXMgdXNlZCBieSwgZm9yIGV4YW1wbGUsIHtAbGluayBzaWduRXZtfSkuIEZvciBTZWNwMjU2azEga2V5cyxcbiAgICogZm9yIGV4YW1wbGUsIHlvdSAqKm11c3QqKiBjYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBhIG1lc3NhZ2UgdGhhdCBpcyAzMiBieXRlcyBsb25nIGFuZFxuICAgKiB0aGUgb3V0cHV0IG9mIGEgc2VjdXJlIGhhc2ggZnVuY3Rpb24uXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBzaWduYXR1cmVzIHNlcmlhbGl6ZWQgYXM7XG4gICAqXG4gICAqIC0gRUNEU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBhcyBiaWctZW5kaWFuIHIgYW5kIHMgcGx1cyByZWNvdmVyeS1pZFxuICAgKiAgICBieXRlIHYsIHdoaWNoIGNhbiBpbiBnZW5lcmFsIHRha2UgYW55IG9mIHRoZSB2YWx1ZXMgMCwgMSwgMiwgb3IgMy5cbiAgICpcbiAgICogLSBFZERTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGluIHRoZSBzdGFuZGFyZCBmb3JtYXQuXG4gICAqXG4gICAqIC0gQkxTIHNpZ25hdHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQgb24gdGhlIGJsb2Itc2lnbiBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJsb2IoXG4gICAgcmVxOiBCbG9iU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCbG9iU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnbkJsb2IodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGEgRGlmZmllLUhlbGxtYW4gZXhjaGFuZ2Ugd2l0aCBvbmUgb3IgbW9yZSBwdWJsaWMga2V5cy5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0RpZmZpZUhlbGxtYW5FeGNoYW5nZVwiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICogVGhpcyBpcyBiZWNhdXNlIHBlcmZvcm1pbmcgYXJiaXRyYXJ5IERpZmZpZS1IZWxsbWFuIGV4Y2hhbmdlcyB1c2luZyBzaWduaW5nIGtleXNcbiAgICogaXMsIGluIGdlbmVyYWwsIGRhbmdlcm91cy4gWW91IHNob3VsZCBvbmx5IHVzZSB0aGlzIEFQSSBpZiB5b3UgYXJlIDEwMCUgc3VyZSB0aGF0XG4gICAqIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nIVxuICAgKlxuICAgKiBAcGFyYW0gcG9pbnRzIFVwIHRvIDMyIGVsbGlwdGljIGN1cnZlIHBvaW50cyB3aXRoIHdoaWNoIHRvIHBlcmZvcm0gRGlmZmllLUhlbGxtYW4gZXhjaGFuZ2VzLiBUaGVzZSBwb2ludHMgbXVzdCBiZSBzZXJpYWxpemVkIGluIGEga2V5LXR5cGUtLXNwZWNpZmljIGZvcm1hdDsgc2VlIHRoZSBDdWJlU2lnbmVyIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICogQHBhcmFtIHB1YmxpY0tleSBUaGUgTklTVCBQLTI1NiBwdWJsaWMga2V5IHdpdGggd2hpY2ggdGhlIHJlc3BvbnNlcyB3aWxsIGJlIGVuY3J5cHRlZC4gVGhpcyBzaG91bGQgYmUgdGhlIGBwdWJsaWNLZXlgIHByb3BlcnR5IG9mIGEgdmFsdWUgcmV0dXJuZWQgYnkgYHVzZXJFeHBvcnRLZXlnZW5gLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLiBPbiBzdWNjZXNzLCB0aGUgcmVzdWx0IGNhbiBiZSBkZWNyeXB0ZWQgd2l0aCBgZGlmZmllSGVsbG1hbkRlY3J5cHRgLlxuICAgKi9cbiAgYXN5bmMgZGlmZmllSGVsbG1hbkV4Y2hhbmdlKFxuICAgIHBvaW50czogVWludDhBcnJheVtdLFxuICAgIHB1YmxpY0tleTogQ3J5cHRvS2V5LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RGlmZmllSGVsbG1hblJlc3BvbnNlPj4ge1xuICAgIGlmIChwb2ludHMubGVuZ3RoID4gMzIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm1heGltdW0gMzIgREggZXhjaGFuZ2VzIHBlciByZXF1ZXN0XCIpO1xuICAgIH1cblxuICAgIC8vIGNvbnN0cnVjdCB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IHN1YnRsZSA9IGF3YWl0IGxvYWRTdWJ0bGVDcnlwdG8oKTtcbiAgICBjb25zdCByZXE6IERpZmZpZUhlbGxtYW5SZXF1ZXN0ID0ge1xuICAgICAgcG9pbnRzOiBwb2ludHMubWFwKChwdCkgPT4gZW5jb2RlVG9CYXNlNjQoQnVmZmVyLmZyb20ocHQpKSksXG4gICAgICBwdWJsaWNfa2V5OiBlbmNvZGVUb0Jhc2U2NChCdWZmZXIuZnJvbShhd2FpdCBzdWJ0bGUuZXhwb3J0S2V5KFwicmF3XCIsIHB1YmxpY0tleSkpKSxcbiAgICB9O1xuXG4gICAgLy8gc2VuZFxuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuZGlmZmllSGVsbG1hbkV4Y2hhbmdlKHRoaXMsIHJlcSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJpdGNvaW4gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGMoXG4gICAgcmVxOiBCdGNTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJ0Y1NpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25CdGModGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgUFNCVC5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBzaWduUHNidChcbiAgICByZXE6IFBzYnRTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFBzYnRTaWduUmVzcG9uc2U+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduUHNidCh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIG1lc3NhZ2UgdG8gc2lnblxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25zIGZvciB0aGlzIHJlcXVlc3RcbiAgICogQHBhcmFtIG9wdHMucDJzaCBJZiB0aGlzIGlzIGEgc2Vnd2l0IGtleSBhbmQgcDJzaCBpcyB0cnVlLCBzaWduIGFzIHAyc2gtcDJ3cGtoIGluc3RlYWQgb2YgcDJ3cGtoLiBEZWZhdWx0cyB0byBmYWxzZSBpZiBub3Qgc3BlY2lmaWVkLlxuICAgKiBAcGFyYW0gb3B0cy5tZXRhZGF0YSBPcHRpb25hbCBhcmJpdHJhcnkgSlNPTiBtZXRhZGF0YVxuICAgKiBAcGFyYW0gb3B0cy5tZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0Y01lc3NhZ2UoXG4gICAgcmVxOiBVaW50OEFycmF5IHwgc3RyaW5nLFxuICAgIG9wdHM6IHsgcDJzaD86IGJvb2xlYW47IG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0czsgbWV0YWRhdGE/OiB1bmtub3duIH0sXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJ0Y01lc3NhZ2VTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcmVxdWVzdDogQnRjTWVzc2FnZVNpZ25SZXF1ZXN0ID0ge1xuICAgICAgZGF0YTogZW5jb2RlVG9IZXgocmVxKSxcbiAgICAgIGlzX3Ayc2g6IG9wdHMucDJzaCA/PyBmYWxzZSxcbiAgICAgIG1ldGFkYXRhOiBvcHRzLm1ldGFkYXRhLFxuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zaWduQnRjTWVzc2FnZSh0aGlzLCByZXF1ZXN0LCBvcHRzLm1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBTb2xhbmEgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblNvbGFuYShcbiAgICByZXE6IFNvbGFuYVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U29sYW5hU2lnblJlc3BvbnNlPj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQuc2lnblNvbGFuYSh0aGlzLCByZXEsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBTVUkgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TdWkoXG4gICAgcmVxOiBTdWlTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFN1aVNpZ25SZXNwb25zZT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNpZ25TdWkodGhpcywgcmVxLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gTUZBIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZUtleVJlcXVlc3QsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQua2V5VXBkYXRlKHRoaXMuaWQsIHJlcXVlc3QsIG1mYVJlY2VpcHQpO1xuICAgIHRoaXMuY2FjaGVkID0gcmVzcC5kYXRhKCk7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICB0aGlzLmNhY2hlZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5rZXlHZXQodGhpcy5pZCk7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydCBhIHNjaGVtYSBrZXkgdHlwZSB0byBhIGtleSB0eXBlLlxuICpcbiAqIEBwYXJhbSB0eSBUaGUgc2NoZW1hIGtleSB0eXBlLlxuICogQHJldHVybnMgVGhlIGtleSB0eXBlLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tU2NoZW1hS2V5VHlwZSh0eTogU2NoZW1hS2V5VHlwZSk6IEtleVR5cGUge1xuICBzd2l0Y2ggKHR5KSB7XG4gICAgY2FzZSBcIlNlY3BFdGhBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkV2bTtcbiAgICBjYXNlIFwiU2VjcENvc21vc0FkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQ29zbW9zO1xuICAgIGNhc2UgXCJTZWNwQnRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0YztcbiAgICBjYXNlIFwiU2VjcEJ0Y1Rlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuQnRjVGVzdDtcbiAgICBjYXNlIFwiU2VjcEJ0Y0xlZ2FjeVwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5CdGNMZWdhY3k7XG4gICAgY2FzZSBcIlNlY3BCdGNMZWdhY3lUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJ0Y0xlZ2FjeVRlc3Q7XG4gICAgY2FzZSBcIlNlY3BBdmFBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YTtcbiAgICBjYXNlIFwiU2VjcEF2YVRlc3RBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkF2YVRlc3Q7XG4gICAgY2FzZSBcIkJhYnlsb25Fb3RzXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJhYnlsb25Fb3RzO1xuICAgIGNhc2UgXCJCYWJ5bG9uQ292XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkJhYnlsb25Fb3RzO1xuICAgIGNhc2UgXCJUYXByb290QnRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlRhcHJvb3Q7XG4gICAgY2FzZSBcIlRhcHJvb3RCdGNUZXN0XCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLlRhcHJvb3RUZXN0O1xuICAgIGNhc2UgXCJTZWNwVHJvbkFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuVHJvbjtcbiAgICBjYXNlIFwiU2VjcERvZ2VBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkRvZ2U7XG4gICAgY2FzZSBcIlNlY3BEb2dlVGVzdEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuRG9nZVRlc3Q7XG4gICAgY2FzZSBcIlNlY3BLYXNwYUFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuS2FzcGE7XG4gICAgY2FzZSBcIlNlY3BLYXNwYVRlc3RBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkthc3BhVGVzdDtcbiAgICBjYXNlIFwiU2Nobm9yckthc3BhQWRkclwiOlxuICAgICAgcmV0dXJuIFNlY3AyNTZrMS5LYXNwYVNjaG5vcnI7XG4gICAgY2FzZSBcIlNjaG5vcnJLYXNwYVRlc3RBZGRyXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkthc3BhVGVzdFNjaG5vcnI7XG4gICAgY2FzZSBcIkJsc1B1YlwiOlxuICAgICAgcmV0dXJuIEJscy5FdGgyRGVwb3NpdGVkO1xuICAgIGNhc2UgXCJCbHNJbmFjdGl2ZVwiOlxuICAgICAgcmV0dXJuIEJscy5FdGgySW5hY3RpdmU7XG4gICAgY2FzZSBcIkJsc0F2YUljbVwiOlxuICAgICAgcmV0dXJuIEJscy5BdmFJY207XG4gICAgY2FzZSBcIkVkMjU1MTlTb2xhbmFBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5Tb2xhbmE7XG4gICAgY2FzZSBcIkVkMjU1MTlTdWlBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5TdWk7XG4gICAgY2FzZSBcIkVkMjU1MTlBcHRvc0FkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LkFwdG9zO1xuICAgIGNhc2UgXCJFZDI1NTE5Q2FudG9uQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQ2FudG9uO1xuICAgIGNhc2UgXCJFZDI1NTE5Q2FyZGFub0FkZHJWa1wiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuQ2FyZGFubztcbiAgICBjYXNlIFwiRWQyNTUxOVN0ZWxsYXJBZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5TdGVsbGFyO1xuICAgIGNhc2UgXCJFZDI1NTE5U3Vic3RyYXRlQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuU3Vic3RyYXRlO1xuICAgIGNhc2UgXCJFZDI1NTE5VGVuZGVybWludEFkZHJcIjpcbiAgICAgIHJldHVybiBFZDI1NTE5LlRlbmRlcm1pbnQ7XG4gICAgY2FzZSBcIkVkMjU1MTlUb25BZGRyXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5Ub247XG4gICAgY2FzZSBcIkVkMjU1MTlCaW5hbmNlQXBpXCI6XG4gICAgICByZXR1cm4gRWQyNTUxOS5CaW5hbmNlQXBpO1xuICAgIGNhc2UgXCJTdGFya1wiOlxuICAgICAgcmV0dXJuIFN0YXJrO1xuICAgIGNhc2UgXCJNbmVtb25pY1wiOlxuICAgICAgcmV0dXJuIE1uZW1vbmljO1xuICAgIGNhc2UgXCJQMjU2Q29zbW9zQWRkclwiOlxuICAgICAgcmV0dXJuIFAyNTYuQ29zbW9zO1xuICAgIGNhc2UgXCJQMjU2T250b2xvZ3lBZGRyXCI6XG4gICAgICByZXR1cm4gUDI1Ni5PbnRvbG9neTtcbiAgICBjYXNlIFwiUDI1Nk5lbzNBZGRyXCI6XG4gICAgICByZXR1cm4gUDI1Ni5OZW8zO1xuICAgIGNhc2UgXCJTZWNwTHRjXCI6XG4gICAgICByZXR1cm4gU2VjcDI1NmsxLkx0YztcbiAgICBjYXNlIFwiU2VjcEx0Y1Rlc3RcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuTHRjVGVzdDtcbiAgICBjYXNlIFwiU2VjcFhycEFkZHJcIjpcbiAgICAgIHJldHVybiBTZWNwMjU2azEuWHJwO1xuICAgIGNhc2UgXCJFZDI1NTE5WHJwQWRkclwiOlxuICAgICAgcmV0dXJuIEVkMjU1MTkuWHJwO1xuICAgIGNhc2UgXCJCYWJ5SnVianViXCI6XG4gICAgICByZXR1cm4gQmFieUp1Ymp1YjtcbiAgICAvLyBOT1RFOiBpZiB5b3UgYXJlIGFkZGluZyBhIG5ldyBrZXkgdHlwZSwgdXBkYXRlIHRoZSBgY3JlYXRlICR7a2V5VHlwZX0ga2V5YCB0ZXN0IGluIGtleS50ZXN0LnRzXG4gIH1cbn1cbiJdfQ==