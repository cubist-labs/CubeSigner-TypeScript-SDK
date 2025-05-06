import type { KeyPolicy } from "./role";
import type { PageOpts } from "./paginator";
import type { KeyInfo, SchemaKeyType, KeyInRoleInfo, EvmSignRequest, EvmSignResponse, Eip191SignRequest, Eip712SignRequest, Eth2SignRequest, Eth2UnstakeRequest, AvaTx, BlobSignRequest, BtcSignRequest, SolanaSignRequest, SolanaSignResponse, BtcMessageSignResponse, BtcSignResponse, BlobSignResponse, AvaSignResponse, Eth2UnstakeResponse, Eth2SignResponse, Eip191Or712SignResponse, PsbtSignRequest, PsbtSignResponse } from "./schema_types";
import type { ApiClient, AvaChain, BabylonRegistrationRequest, BabylonRegistrationResponse, BabylonStakingRequest, BabylonStakingResponse, CubeSignerResponse, Empty, HistoricalTx, JsonValue, MfaReceipts, SuiSignRequest, SuiSignResponse } from ".";
import { CubeSignerClient } from ".";
/** Secp256k1 key type */
export declare enum Secp256k1 {
    Evm = "SecpEthAddr",
    Btc = "SecpBtc",
    BtcTest = "SecpBtcTest",
    Cosmos = "SecpCosmosAddr",
    Taproot = "TaprootBtc",
    TaprootTest = "TaprootBtcTest",
    BabylonEots = "BabylonEots",
    BabylonCov = "BabylonCov",
    Ava = "SecpAvaAddr",
    AvaTest = "SecpAvaTestAddr",
    Tron = "SecpTronAddr",
    BtcLegacy = "SecpBtcLegacy",
    BtcLegacyTest = "SecpBtcLegacyTest",
    Doge = "SecpDogeAddr",
    DogeTest = "SecpDogeTestAddr",
    Kaspa = "SecpKaspaAddr",
    KaspaTest = "SecpKaspaTestAddr",
    KaspaSchnorr = "SchnorrKaspaAddr",
    KaspaTestSchnorr = "SchnorrKaspaTestAddr"
}
/** BLS key type */
export declare enum Bls {
    Eth2Deposited = "BlsPub",
    Eth2Inactive = "BlsInactive",
    AvaIcm = "BlsAvaIcm"
}
/** Ed25519 key type */
export declare enum Ed25519 {
    Solana = "Ed25519SolanaAddr",
    Sui = "Ed25519SuiAddr",
    Aptos = "Ed25519AptosAddr",
    Cardano = "Ed25519CardanoAddrVk",
    Stellar = "Ed25519StellarAddr",
    Substrate = "Ed25519SubstrateAddr",
    Tendermint = "Ed25519TendermintAddr",
    Ton = "Ed25519TonAddr"
}
/** P256 key type */
export declare enum P256 {
    Cosmos = "P256CosmosAddr",
    Ontology = "P256OntologyAddr",
    Neo3 = "P256Neo3Addr"
}
/** Mnemonic key type */
export declare const Mnemonic: "Mnemonic";
export type Mnemonic = typeof Mnemonic;
/** Stark key type */
export declare const Stark: "Stark";
export type Stark = typeof Stark;
/** Key type */
export type KeyType = Secp256k1 | Bls | Ed25519 | Mnemonic | Stark | P256;
/**
 * A representation of a signing key.
 */
export declare class Key {
    #private;
    /** @returns The organization that this key is in */
    get orgId(): string;
    /**
     * The id of the key: "Key#" followed by a unique identifier specific to
     * the type of key (such as a public key for BLS or an ethereum address for Secp)
     *
     * @example Key#0x8e3484687e66cdd26cf04c3647633ab4f3570148
     */
    readonly id: string;
    /**
     * A unique identifier specific to the type of key, such as a public key or an ethereum address
     *
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
    /** @returns The type of key. */
    type(): Promise<KeyType>;
    /** @returns Whether the key is enabled */
    enabled(): Promise<boolean>;
    /**
     * Enable the key.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    enable(mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * Disable the key.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    disable(mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * List roles this key is in.
     *
     * @param page Optional pagination options; by default, retrieves all roles this key is in.
     * @returns Roles this key is in.
     */
    roles(page?: PageOpts): Promise<KeyInRoleInfo[]>;
    /**
     * List historical transactions for this key.
     *
     * @param page Optional pagination options; by default, retrieves all historical transactions for this key.
     * @returns Historical key transactions.
     */
    history(page?: PageOpts): Promise<HistoricalTx[]>;
    /**
     * Set new policy (overwriting any policies previously set for this key)
     *
     * @param policy The new policy to set
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    setPolicy(policy: KeyPolicy, mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * Set key metadata. The metadata must be at most 1024 characters
     * and must match the following regex: ^[A-Za-z0-9_=+/ \-\.\,]{0,1024}$.
     *
     * @param metadata The new metadata to set.
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     * @returns The updated key info
     */
    setMetadata(metadata: JsonValue, mfaReceipt?: MfaReceipts): Promise<KeyInfo>;
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
    setMetadataProperty(name: string, value: JsonValue, mfaReceipt?: MfaReceipts): Promise<KeyInfo>;
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
    deleteMetadataProperty(name: string, mfaReceipt?: MfaReceipts): Promise<KeyInfo>;
    /**
     * Append to existing key policy. This append is not atomic -- it uses {@link policy}
     * to fetch the current policy and then {@link setPolicy} to set the policy -- and
     * should not be used in across concurrent sessions.
     *
     * @param policy The policy to append to the existing one.
     */
    appendPolicy(policy: KeyPolicy): Promise<void>;
    /**
     * Get the policy for the key.
     *
     * @returns The policy for the key.
     */
    policy(): Promise<KeyPolicy>;
    /**
     * Fetch the metadata for the key.
     *
     * @returns The policy for the key.
     */
    metadata(): Promise<JsonValue>;
    /**
     * @returns The user id for the owner of the key
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    owner(): Promise<string>;
    /**
     * Set the owner of the key. Only the key (or org) owner can change the owner of the key.
     *
     * @param owner The user-id of the new owner of the key.
     * @param mfaReceipt Optional MFA receipt(s)
     * @throws if MFA is required and no receipts are provided
     */
    setOwner(owner: string, mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * Delete this key.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    delete(mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Create a new key.
     *
     * @param client The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(client: ApiClient | CubeSignerClient, data: KeyInfo);
    /**
     * Sign an EVM transaction.
     *
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature (or MFA approval request).
     */
    signEvm(req: EvmSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<EvmSignResponse>>;
    /**
     * Sign a Babylon staking transaction.
     *
     * @param req The staking transaction to sign
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature (or MFA approval request).
     */
    signBabylonStakingTxn(req: BabylonStakingRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BabylonStakingResponse>>;
    /**
     * Sign a Babylon registration.
     *
     * @param req The registration request to sign
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Babylon staking registration data (or MFA approval request).
     */
    signBabylonRegistration(req: BabylonRegistrationRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BabylonRegistrationResponse>>;
    /**
     * Sign EIP-191 typed data.
     *
     * This requires the key to have a '"AllowEip191Signing"' {@link KeyPolicy}.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Signature (or MFA approval request).
     */
    signEip191(req: Eip191SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
    /**
     * Sign EIP-712 typed data.
     *
     * This requires the key to have a '"AllowEip712Signing"' {@link KeyPolicy}.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Signature (or MFA approval request).
     */
    signEip712(req: Eip712SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Signature
     */
    signEth2(req: Eth2SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eth2SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param req The request to sign.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    unstake(req: Eth2UnstakeRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eth2UnstakeResponse>>;
    /**
     * Sign an Avalanche P- or X-chain message.
     *
     * @param tx Avalanche message (transaction) to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signAva(tx: AvaTx, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<AvaSignResponse>>;
    /**
     * Sign a serialized Avalanche C-/X-/P-chain message.
     *
     * @param avaChain Avalanche chain
     * @param tx Hex encoded transaction
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signSerializedAva(avaChain: AvaChain, tx: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<AvaSignResponse>>;
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
    signBlob(req: BlobSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BlobSignResponse>>;
    /**
     * Sign a Bitcoin transaction.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signBtc(req: BtcSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BtcSignResponse>>;
    /**
     * Sign a PSBT.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response
     */
    signPsbt(req: PsbtSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<PsbtSignResponse>>;
    /**
     * Sign a Bitcoin message.
     *
     * @param req The message to sign
     * @param opts Options for this request
     * @param opts.p2sh If this is a segwit key and p2sh is true, sign as p2sh-p2wpkh instead of p2wpkh. Defaults to false if not specified.
     * @param opts.mfaReceipt Optional MFA receipt(s)
     * @returns The response
     */
    signBtcMessage(req: Uint8Array | string, opts: {
        p2sh?: boolean;
        mfaReceipt?: MfaReceipts;
    }): Promise<CubeSignerResponse<BtcMessageSignResponse>>;
    /**
     * Sign a Solana message.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signSolana(req: SolanaSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<SolanaSignResponse>>;
    /**
     * Sign a SUI transaction.
     *
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signSui(req: SuiSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<SuiSignResponse>>;
    /**
     * Update the key.
     *
     * @param request The JSON request to send to the API server.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The JSON response from the API server.
     * @throws if MFA is required and no MFA receipts are provided
     * @internal
     */
    private update;
    /**
     * Fetch the key information.
     *
     * @returns The key information.
     * @internal
     */
    private fetch;
}
/**
 * Convert a schema key type to a key type.
 *
 * @param ty The schema key type.
 * @returns The key type.
 * @internal
 */
export declare function fromSchemaKeyType(ty: SchemaKeyType): KeyType;
//# sourceMappingURL=key.d.ts.map