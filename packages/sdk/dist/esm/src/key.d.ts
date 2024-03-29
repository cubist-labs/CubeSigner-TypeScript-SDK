import { KeyPolicy } from "./role";
import { PageOpts } from "./paginator";
import { KeyInfoApi, KeyTypeApi, SchemaKeyType, KeyInRoleInfo } from "./schema_types";
import { CubeSignerClient } from "./client";
import { JsonValue } from ".";
/** Secp256k1 key type */
export declare enum Secp256k1 {
    Evm = "SecpEthAddr",// eslint-disable-line no-unused-vars
    Btc = "SecpBtc",// eslint-disable-line no-unused-vars
    BtcTest = "SecpBtcTest",// eslint-disable-line no-unused-vars
    Ava = "SecpAvaAddr",// eslint-disable-line no-unused-vars
    AvaTest = "SecpAvaTestAddr"
}
/** BLS key type */
export declare enum Bls {
    Eth2Deposited = "BlsPub",// eslint-disable-line no-unused-vars
    Eth2Inactive = "BlsInactive"
}
/** Ed25519 key type */
export declare enum Ed25519 {
    Solana = "Ed25519SolanaAddr",// eslint-disable-line no-unused-vars
    Sui = "Ed25519SuiAddr",// eslint-disable-line no-unused-vars
    Aptos = "Ed25519AptosAddr",// eslint-disable-line no-unused-vars
    Cardano = "Ed25519CardanoAddrVk",// eslint-disable-line no-unused-vars
    Stellar = "Ed25519StellarAddr"
}
/** Mnemonic key type */
export declare const Mnemonic: "Mnemonic";
export type Mnemonic = typeof Mnemonic;
/** Stark key type */
export declare const Stark: "Stark";
export type Stark = typeof Stark;
/** Key type */
export type KeyType = Secp256k1 | Bls | Ed25519 | Mnemonic | Stark;
/** Additional properties (for backward compatibility) */
export interface KeyInfo extends KeyInfoApi {
    /** Alias for key_id */
    id: string;
    /** Alias for key_type */
    type: KeyTypeApi;
    /** Alias for material_id */
    materialId: string;
    /** Alias for public_key */
    publicKey: string;
}
/**
 * Define some additional (backward compatibility) properties
 * on a `KeyInfoApi` object returned from the remote end.
 *
 * @param {KeyInfoApi} key Key information returned from the remote end
 * @return {KeyInfo} The same `key` object extended with some derived properties.
 */
export declare function toKeyInfo(key: KeyInfoApi): KeyInfo;
/**
 * A representation of a signing key.
 */
export declare class Key {
    #private;
    /** The CubeSigner instance that this key is associated with */
    protected readonly csc: CubeSignerClient;
    /** The organization that this key is in */
    get orgId(): string;
    /**
     * The id of the key: "Key#" followed by a unique identifier specific to
     * the type of key (such as a public key for BLS or an ethereum address for Secp)
     * @example Key#0x8e3484687e66cdd26cf04c3647633ab4f3570148
     */
    get id(): string;
    /**
     * A unique identifier specific to the type of key, such as a public key or an ethereum address
     * @example 0x8e3484687e66cdd26cf04c3647633ab4f3570148
     */
    get materialId(): string;
    /**
     * @description Hex-encoded, serialized public key. The format used depends on the key type:
     * - secp256k1 keys use 65-byte uncompressed SECG format
     * - BLS keys use 48-byte compressed BLS12-381 (ZCash) format
     * @example 0x04d2688b6bc2ce7f9879b9e745f3c4dc177908c5cef0c1b64cff19ae7ff27dee623c64fe9d9c325c7fbbc748bbd5f607ce14dd83e28ebbbb7d3e7f2ffb70a79431
     */
    get publicKey(): string;
    /**
     * Get the cached properties of this key. The cached properties reflect the
     * state of the last fetch or update (e.g., after awaiting `Key.enabled()`
     * or `Key.disable()`).
     */
    get cached(): KeyInfo;
    /** The type of key. */
    type(): Promise<KeyType>;
    /** Is the key enabled? */
    enabled(): Promise<boolean>;
    /** Enable the key. */
    enable(): Promise<void>;
    /** Disable the key. */
    disable(): Promise<void>;
    /**
     * The list roles this key is in.
     * @param {PageOpts} page Optional pagination options; by default, retrieves all roles this key is in.
     * @return {Promise<KeyInRoleInfo[]>} Roles this key is in.
     */
    roles(page?: PageOpts): Promise<KeyInRoleInfo[]>;
    /**
     * Set new policy (overwriting any policies previously set for this key)
     * @param {KeyPolicy} policy The new policy to set
     */
    setPolicy(policy: KeyPolicy): Promise<KeyInfo>;
    /**
     * Set key metadata. The metadata must be at most 1024 characters
     * and must match the following regex: ^[A-Za-z0-9_=+/ \-\.\,]{0,1024}$.
     *
     * @param {string} metadata The new metadata to set.
     */
    setMetadata(metadata: JsonValue): Promise<KeyInfo>;
    /**
     * Retrieves the existing metadata, asserts that it is in object (throws if it is not),
     * then sets the value of the {@link name} property in that object to {@link value},
     * and finally submits the request to update the metadata.
     *
     * This whole process is done atomically, meaning, that if the metadata changes between the
     * time this method first retrieves it and the time it submits a request to update it, the
     * request will be rejected. When that happens, this method will retry a couple of times.
     *
     * @param {string} name The name of the property to set
     * @param {JsonValue} value The new value of the property
     * @return {Promise<KeyInfo>} Updated key information
     */
    setMetadataProperty(name: string, value: JsonValue): Promise<KeyInfo>;
    /**
     * Retrieves the existing metadata, asserts that it is in object (throws if it is not),
     * then deletes the {@link name} property in that object, and finally submits the
     * request to update the metadata.
     *
     * This whole process is done atomically, meaning, that if the metadata changes between the
     * time this method first retrieves it and the time it submits a request to update it, the
     * request will be rejected. When that happens, this method will retry a couple of times.
     *
     * @param {string} name The name of the property to set
     * @return {Promise<KeyInfo>} Updated key information
     */
    deleteMetadataProperty(name: string): Promise<KeyInfo>;
    /**
     * Append to existing key policy. This append is not atomic -- it uses {@link policy}
     * to fetch the current policy and then {@link setPolicy} to set the policy -- and
     * should not be used in across concurrent sessions.
     *
     * @param {KeyPolicy} policy The policy to append to the existing one.
     */
    appendPolicy(policy: KeyPolicy): Promise<void>;
    /**
     * Get the policy for the key.
     * @return {Promise<KeyPolicy>} The policy for the key.
     */
    policy(): Promise<KeyPolicy>;
    /**
     * Fetch the metadata for the key.
     * @return {Promise<JsonValue>} The policy for the key.
     */
    metadata(): Promise<JsonValue>;
    /**
     * @description Owner of the key
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    owner(): Promise<string>;
    /**
     * Set the owner of the key. Only the key (or org) owner can change the owner of the key.
     * @param {string} owner The user-id of the new owner of the key.
     */
    setOwner(owner: string): Promise<void>;
    /**
     * Delete this key.
     */
    delete(): Promise<void>;
    /**
     * Create a new key.
     *
     * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
     * @param {KeyInfoApi} data The JSON response from the API server.
     * @internal
     */
    constructor(csc: CubeSignerClient, data: KeyInfoApi);
    /**
     * Update the key.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfo} The JSON response from the API server.
     * @internal
     */
    private update;
    /**
     * Fetch the key information.
     *
     * @return {KeyInfo} The key information.
     * @internal
     */
    private fetch;
}
/**
 * Convert a schema key type to a key type.
 *
 * @param {SchemaKeyType} ty The schema key type.
 * @return {KeyType} The key type.
 * @internal
 */
export declare function fromSchemaKeyType(ty: SchemaKeyType): KeyType;
