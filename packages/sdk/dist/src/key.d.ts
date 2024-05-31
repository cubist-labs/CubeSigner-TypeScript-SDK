import type { KeyPolicy } from "./role";
import type { PageOpts } from "./paginator";
import type { KeyInfo, SchemaKeyType, KeyInRoleInfo, EvmSignRequest, EvmSignResponse, Eip191SignRequest, Eip712SignRequest, Eth2SignRequest, Eth2UnstakeRequest, AvaTx, BlobSignRequest, BtcSignRequest, SolanaSignRequest, SolanaSignResponse, BtcSignResponse, BlobSignResponse, AvaSignResponse, Eth2UnstakeResponse, Eth2SignResponse, Eip191Or712SignResponse } from "./schema_types";
import type { ApiClient, AvaChain, CubeSignerResponse, JsonValue, MfaReceipt } from ".";
import { CubeSignerClient } from ".";
/** Secp256k1 key type */
export declare enum Secp256k1 {
    Evm = "SecpEthAddr",
    Btc = "SecpBtc",
    BtcTest = "SecpBtcTest",
    Taproot = "TaprootBtc",
    TaprootTest = "TaprootBtcTest",
    BabylonEots = "BabylonEots",
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
    Cardano = "Ed25519CardanoAddrVk",
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
/**
 * A representation of a signing key.
 */
export declare class Key {
    #private;
    /** The organization that this key is in */
    get orgId(): string;
    /**
     * The id of the key: "Key#" followed by a unique identifier specific to
     * the type of key (such as a public key for BLS or an ethereum address for Secp)
     * @example Key#0x8e3484687e66cdd26cf04c3647633ab4f3570148
     */
    readonly id: string;
    /**
     * A unique identifier specific to the type of key, such as a public key or an ethereum address
     * @example 0x8e3484687e66cdd26cf04c3647633ab4f3570148
     */
    readonly materialId: string;
    /**
     * @description Hex-encoded, serialized public key. The format used depends on the key type:
     * - secp256k1 keys use 65-byte uncompressed SECG format
     * - BLS keys use 48-byte compressed BLS12-381 (ZCash) format
     * @example 0x04d2688b6bc2ce7f9879b9e745f3c4dc177908c5cef0c1b64cff19ae7ff27dee623c64fe9d9c325c7fbbc748bbd5f607ce14dd83e28ebbbb7d3e7f2ffb70a79431
     */
    readonly publicKey: string;
    /**
     * Get the cached properties of this key. The cached properties reflect the
     * state of the last fetch or update (e.g., after awaiting `Key.enabled()`
     * or `Key.disable()`).
     */
    cached: KeyInfo;
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
    setPolicy(policy: KeyPolicy): Promise<void>;
    /**
     * Set key metadata. The metadata must be at most 1024 characters
     * and must match the following regex: ^[A-Za-z0-9_=+/ \-\.\,]{0,1024}$.
     *
     * @param {string} metadata The new metadata to set.
     */
    setMetadata(metadata: JsonValue): Promise<KeyInfo>;
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
    setMetadataProperty(name: string, value: JsonValue): Promise<KeyInfo>;
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
     * @param {ApiClient | CubeSignerClient} client The API client to use.
     * @param {KeyInfo} data The JSON response from the API server.
     * @internal
     */
    constructor(client: ApiClient | CubeSignerClient, data: KeyInfo);
    /**
     * Sign an EVM transaction.
     *
     * @param {EvmSignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    signEvm(req: EvmSignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<EvmSignResponse>>;
    /**
     * Sign EIP-191 typed data.
     *
     * This requires the key to have a '"AllowEip191Signing"' {@link KeyPolicy}.
     *
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    signEip191(req: Eip191SignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
    /**
     * Sign EIP-712 typed data.
     *
     * This requires the key to have a '"AllowEip712Signing"' {@link KeyPolicy}.
     *
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    signEip712(req: Eip712SignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param {Eth2SignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    signEth2(req: Eth2SignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eth2SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    unstake(req: Eth2UnstakeRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eth2UnstakeResponse>>;
    /**
     * Sign an Avalanche P- or X-chain message.
     *
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    signAva(tx: AvaTx, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<AvaSignResponse>>;
    /**
     * Sign a serialized Avalanche C-/X-/P-chain message.
     *
     * @param {AvaChain} avaChain Avalanche chain
     * @param {string} tx Hex encoded transaction
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    signSerializedAva(avaChain: AvaChain, tx: string, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<AvaSignResponse>>;
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
    signBlob(req: BlobSignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<BlobSignResponse>>;
    /**
     * Sign a Bitcoin message.
     *
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    signBtc(req: BtcSignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<BtcSignResponse>>;
    /**
     * Sign a Solana message.
     *
     * @param {SolanaSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    signSolana(req: SolanaSignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<SolanaSignResponse>>;
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
