import { CubeSigner, KeyPolicy } from ".";
import { components } from "./client";
/** Secp256k1 key type */
export declare enum Secp256k1 {
    Evm = "SecpEthAddr",
    Btc = "SecpBtc",
    BtcTest = "SecpBtcTest",
    Ava = "SecpAvaAddr",
    AvaTest = "SecpAvaTestAddr"
}
/** BLS key type */
export declare enum Bls {
    Eth2Deposited = "BlsPub",
    Eth2Inactive = "BlsInactive"
}
/** Ed25519 key type */
export declare enum Ed25519 {
    Solana = "Ed25519SolanaAddr",
    Sui = "Ed25519SuiAddr",
    Aptos = "Ed25519AptosAddr",
    Cardano = "Ed25519CardanoAddrVk"
}
/** Mnemonic key type */
export declare const Mnemonic: "Mnemonic";
export type Mnemonic = typeof Mnemonic;
/** Stark key type */
export declare const Stark: "Stark";
export type Stark = typeof Stark;
/** Key type */
export type KeyType = Secp256k1 | Bls | Ed25519 | Mnemonic | Stark;
/** Schema key type (i.e., key type at the API level) */
type SchemaKeyType = components["schemas"]["KeyType"];
type KeyInfoApi = components["schemas"]["KeyInfo"];
type KeyTypeApi = components["schemas"]["KeyType"];
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
/** Signing keys. */
export declare class Key {
    #private;
    /** The organization that this key is in */
    readonly orgId: string;
    /**
     * The id of the key: "Key#" followed by a unique identifier specific to
     * the type of key (such as a public key for BLS or an ethereum address for Secp)
     * @example Key#0x8e3484687e66cdd26cf04c3647633ab4f3570148
     * */
    readonly id: string;
    /**
     * A unique identifier specific to the type of key, such as a public key or an ethereum address
     * @example 0x8e3484687e66cdd26cf04c3647633ab4f3570148
     * */
    readonly materialId: string;
    /**
     * @description Hex-encoded, serialized public key. The format used depends on the key type:
     * - secp256k1 keys use 65-byte uncompressed SECG format
     * - BLS keys use 48-byte compressed BLS12-381 (ZCash) format
     * @example 0x04d2688b6bc2ce7f9879b9e745f3c4dc177908c5cef0c1b64cff19ae7ff27dee623c64fe9d9c325c7fbbc748bbd5f607ce14dd83e28ebbbb7d3e7f2ffb70a79431
     * */
    readonly publicKey: string;
    /** The type of key. */
    type(): Promise<KeyType>;
    /** Is the key enabled? */
    enabled(): Promise<boolean>;
    /** Enable the key. */
    enable(): Promise<void>;
    /** Disable the key. */
    disable(): Promise<void>;
    /**
     * Set new policy (overwriting any policies previously set for this key)
     * @param {KeyPolicy} policy The new policy to set
     */
    setPolicy(policy: KeyPolicy): Promise<void>;
    /**
     * Append to existing key policy. This append is not atomic -- it uses {@link policy} to fetch the current policy and then {@link setPolicy} to set the policy -- and should not be used in across concurrent sessions.
     * @param {KeyPolicy} policy The policy to append to the existing one.
     */
    appendPolicy(policy: KeyPolicy): Promise<void>;
    /**
     * Get the policy for the org.
     * @return {Promise<KeyPolicy>} The policy for the org.
     */
    policy(): Promise<KeyPolicy>;
    /**
     * @description Owner of the key
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     * */
    owner(): Promise<string>;
    /** Set the owner of the key. Only the key (or org) owner can change the owner of the key.
     * @param {string} owner The user-id of the new owner of the key.
     * */
    setOwner(owner: string): Promise<void>;
    /**
     * Delete this key.
     */
    delete(): Promise<void>;
    /** Create a new key.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {KeyInfo} data The JSON response from the API server.
     * @internal
     * */
    constructor(cs: CubeSigner, orgId: string, data: KeyInfoApi);
    /** Update the key.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfo} The JSON response from the API server.
     * */
    private update;
    /** Create new signing keys.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {KeyType} keyType The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     * @internal
     * */
    static createKeys(cs: CubeSigner, orgId: string, keyType: KeyType, count: number, ownerId?: string): Promise<Key[]>;
    /**
     * Derives a key of a specified type using a supplied derivation path and an existing long-lived mnemonic.
     *
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {CubeSigner} cs The CubeSigner instance to use for key creation.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {KeyType} keyType The type of key to create.
     * @param {string[]} derivationPaths Derivation paths from which to derive new keys.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key[]} The newly derived keys.
     */
    static deriveKeys(cs: CubeSigner, orgId: string, keyType: KeyType, derivationPaths: string[], mnemonicId: string): Promise<Key[]>;
    /** Get a key by id.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the key belongs.
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     * @internal
     * */
    static getKey(cs: CubeSigner, orgId: string, keyId: string): Promise<Key>;
    /** Fetches the key information.
     * @return {KeyInfo} The key information.
     * @internal
     * */
    private fetch;
}
/** Convert a schema key type to a key type.
 * @param {SchemaKeyType} ty The schema key type.
 * @return {KeyType} The key type.
 * @internal
 * */
export declare function fromSchemaKeyType(ty: SchemaKeyType): KeyType;
export {};
