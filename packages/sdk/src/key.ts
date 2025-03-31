import type { KeyPolicy } from "./role";
import type { PageOpts } from "./paginator";
import type {
  KeyInfo,
  UpdateKeyRequest,
  SchemaKeyType,
  KeyInRoleInfo,
  EvmSignRequest,
  EvmSignResponse,
  Eip191SignRequest,
  Eip712SignRequest,
  Eth2SignRequest,
  Eth2UnstakeRequest,
  AvaTx,
  BlobSignRequest,
  BtcSignRequest,
  SolanaSignRequest,
  SolanaSignResponse,
  BtcMessageSignResponse,
  BtcSignResponse,
  BlobSignResponse,
  AvaSignResponse,
  Eth2UnstakeResponse,
  Eth2SignResponse,
  Eip191Or712SignResponse,
  PsbtSignRequest,
  PsbtSignResponse,
} from "./schema_types";
import type {
  ApiClient,
  AvaChain,
  BabylonStakingRequest,
  BabylonStakingResponse,
  CubeSignerResponse,
  ErrResponse,
  HistoricalTx,
  JsonValue,
  MfaReceipts,
  SuiSignRequest,
  SuiSignResponse,
} from ".";
import { CubeSignerClient, delay } from ".";
import { encodeToHex } from "./util";

/** Secp256k1 key type */
export enum Secp256k1 {
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
  KaspaTestSchnorr = "SchnorrKaspaTestAddr",
}

/** BLS key type */
export enum Bls {
  Eth2Deposited = "BlsPub",
  Eth2Inactive = "BlsInactive",
  AvaIcm = "BlsAvaIcm",
}

/** Ed25519 key type */
export enum Ed25519 {
  Solana = "Ed25519SolanaAddr",
  Sui = "Ed25519SuiAddr",
  Aptos = "Ed25519AptosAddr",
  Cardano = "Ed25519CardanoAddrVk",
  Stellar = "Ed25519StellarAddr",
  Substrate = "Ed25519SubstrateAddr",
  Tendermint = "Ed25519TendermintAddr",
  Ton = "Ed25519TonAddr",
}

/** P256 key type */
export enum P256 {
  Cosmos = "P256CosmosAddr",
  Ontology = "P256OntologyAddr",
  Neo3 = "P256Neo3Addr",
}

/** Mnemonic key type */
export const Mnemonic = "Mnemonic" as const;
export type Mnemonic = typeof Mnemonic;

/** Stark key type */
export const Stark = "Stark" as const;
export type Stark = typeof Stark;

/** Key type */
export type KeyType = Secp256k1 | Bls | Ed25519 | Mnemonic | Stark | P256;

/**
 * A representation of a signing key.
 */
export class Key {
  /** The CubeSigner instance that this key is associated with */
  readonly #apiClient: ApiClient;

  /** @returns The organization that this key is in */
  get orgId() {
    return this.#apiClient.sessionMeta.org_id;
  }

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
  readonly materialId!: string;

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
  async type(): Promise<KeyType> {
    const data = await this.fetch();
    return fromSchemaKeyType(data.key_type);
  }

  /** @returns Whether the key is enabled */
  async enabled(): Promise<boolean> {
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
   *
   * @param page Optional pagination options; by default, retrieves all roles this key is in.
   * @returns Roles this key is in.
   */
  async roles(page?: PageOpts): Promise<KeyInRoleInfo[]> {
    return await this.#apiClient.keyRolesList(this.id, page).fetch();
  }

  /**
   * List historical transactions for this key.
   *
   * @param page Optional pagination options; by default, retrieves all historical transactions for this key.
   * @returns Historical key transactions.
   */
  async history(page?: PageOpts): Promise<HistoricalTx[]> {
    return await this.#apiClient.keyHistory(this.id, page).fetch();
  }

  /**
   * Set new policy (overwriting any policies previously set for this key)
   *
   * @param policy The new policy to set
   */
  async setPolicy(policy: KeyPolicy) {
    await this.update({ policy: policy as unknown as Record<string, never>[] });
  }

  /**
   * Set key metadata. The metadata must be at most 1024 characters
   * and must match the following regex: ^[A-Za-z0-9_=+/ \-\.\,]{0,1024}$.
   *
   * @param metadata The new metadata to set.
   * @returns The updated key info
   */
  async setMetadata(metadata: JsonValue): Promise<KeyInfo> {
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
   * @param name The name of the property to set
   * @param value The new value of the property
   * @returns Updated key information
   */
  async setMetadataProperty(name: string, value: JsonValue): Promise<KeyInfo> {
    return await this.#setMetadataProperty(name, value, this.#apiClient.config.updateRetryDelaysMs);
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
   * @returns Updated key information
   */
  async deleteMetadataProperty(name: string): Promise<KeyInfo> {
    return await this.#setMetadataProperty(
      name,
      undefined,
      this.#apiClient.config.updateRetryDelaysMs,
    );
  }

  /**
   * @param name The name of the property to set
   * @param value The new value of the property
   * @param delaysMs Delays in milliseconds between retries
   * @returns Updated key information
   * @internal
   */
  async #setMetadataProperty(
    name: string,
    value: JsonValue | undefined,
    delaysMs: number[],
  ): Promise<KeyInfo> {
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
    } catch (e) {
      if ((e as ErrResponse).errorCode === "InvalidUpdate" && delaysMs.length > 0) {
        await delay(delaysMs[0]);
        return await this.#setMetadataProperty(name, value, delaysMs.slice(1));
      } else {
        throw e;
      }
    }
  }

  /**
   * Append to existing key policy. This append is not atomic -- it uses {@link policy}
   * to fetch the current policy and then {@link setPolicy} to set the policy -- and
   * should not be used in across concurrent sessions.
   *
   * @param policy The policy to append to the existing one.
   */
  async appendPolicy(policy: KeyPolicy) {
    const existing = await this.policy();
    await this.setPolicy([...existing, ...policy]);
  }

  /**
   * Get the policy for the key.
   *
   * @returns The policy for the key.
   */
  async policy(): Promise<KeyPolicy> {
    const data = await this.fetch();
    return (data.policy ?? []) as unknown as KeyPolicy;
  }

  /**
   * Fetch the metadata for the key.
   *
   * @returns The policy for the key.
   */
  async metadata(): Promise<JsonValue> {
    const data = await this.fetch();
    return data.metadata as JsonValue;
  }

  /**
   * @returns The user id for the owner of the key
   * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   */
  async owner(): Promise<string> {
    const data = await this.fetch();
    return data.owner;
  }

  /**
   * Set the owner of the key. Only the key (or org) owner can change the owner of the key.
   *
   * @param owner The user-id of the new owner of the key.
   */
  async setOwner(owner: string) {
    await this.update({ owner });
  }

  /**
   * Delete this key.
   */
  async delete() {
    await this.#apiClient.keyDelete(this.id);
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
  constructor(client: ApiClient | CubeSignerClient, data: KeyInfo) {
    this.#apiClient = client instanceof CubeSignerClient ? client.apiClient : client;
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
  async signEvm(
    req: EvmSignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<EvmSignResponse>> {
    return await this.#apiClient.signEvm(this, req, mfaReceipt);
  }

  /**
   * Sign a Babylon staking transaction.
   *
   * @param req The staking transaction to sign
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns Signature (or MFA approval request).
   */
  async signBabylonStakingTxn(
    req: BabylonStakingRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<BabylonStakingResponse>> {
    return this.#apiClient.signBabylonStakingTxn(this, req, mfaReceipt);
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
  async signEip191(
    req: Eip191SignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<Eip191Or712SignResponse>> {
    return await this.#apiClient.signEip191(this, req, mfaReceipt);
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
  async signEip712(
    req: Eip712SignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<Eip191Or712SignResponse>> {
    return await this.#apiClient.signEip712(this, req, mfaReceipt);
  }

  /**
   * Sign an Eth2/Beacon-chain validation message.
   *
   * @param req What to sign.
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns Signature
   */
  async signEth2(
    req: Eth2SignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<Eth2SignResponse>> {
    return await this.#apiClient.signEth2(this, req, mfaReceipt);
  }

  /**
   * Sign an Eth2/Beacon-chain unstake/exit request.
   *
   * @param req The request to sign.
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async unstake(
    req: Eth2UnstakeRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<Eth2UnstakeResponse>> {
    return await this.#apiClient.signUnstake(this, req, mfaReceipt);
  }

  /**
   * Sign an Avalanche P- or X-chain message.
   *
   * @param tx Avalanche message (transaction) to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signAva(tx: AvaTx, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<AvaSignResponse>> {
    return await this.#apiClient.signAva(this, tx, mfaReceipt);
  }

  /**
   * Sign a serialized Avalanche C-/X-/P-chain message.
   *
   * @param avaChain Avalanche chain
   * @param tx Hex encoded transaction
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signSerializedAva(
    avaChain: AvaChain,
    tx: string,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<AvaSignResponse>> {
    return await this.#apiClient.signSerializedAva(this, avaChain, tx, mfaReceipt);
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
  async signBlob(
    req: BlobSignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<BlobSignResponse>> {
    return await this.#apiClient.signBlob(this, req, mfaReceipt);
  }

  /**
   * Sign a Bitcoin transaction.
   *
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signBtc(
    req: BtcSignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<BtcSignResponse>> {
    return await this.#apiClient.signBtc(this, req, mfaReceipt);
  }

  /**
   * Sign a PSBT.
   *
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response
   */
  async signPsbt(
    req: PsbtSignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<PsbtSignResponse>> {
    return await this.#apiClient.signPsbt(this, req, mfaReceipt);
  }

  /**
   * Sign a Bitcoin message.
   *
   * @param req The message to sign
   * @param opts Options for this request
   * @param opts.p2sh If this is a segwit key and p2sh is true, sign as p2sh-p2wpkh instead of p2wpkh. Defaults to false if not specified.
   * @param opts.mfaReceipt Optional MFA receipt(s)
   * @returns The response
   */
  async signBtcMessage(
    req: Uint8Array | string,
    opts: { p2sh?: boolean; mfaReceipt?: MfaReceipts },
  ): Promise<CubeSignerResponse<BtcMessageSignResponse>> {
    const request = {
      data: encodeToHex(req),
      is_p2sh: opts.p2sh ?? false,
    };
    return await this.#apiClient.signBtcMessage(this, request, opts.mfaReceipt);
  }

  /**
   * Sign a Solana message.
   *
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signSolana(
    req: SolanaSignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<SolanaSignResponse>> {
    return await this.#apiClient.signSolana(this, req, mfaReceipt);
  }

  /**
   * Sign a SUI transaction.
   *
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signSui(
    req: SuiSignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<SuiSignResponse>> {
    return await this.#apiClient.signSui(this, req, mfaReceipt);
  }

  /**
   * Update the key.
   *
   * @param request The JSON request to send to the API server.
   * @returns The JSON response from the API server.
   * @internal
   */
  private async update(request: UpdateKeyRequest): Promise<KeyInfo> {
    this.cached = await this.#apiClient.keyUpdate(this.id, request);
    return this.cached;
  }

  /**
   * Fetch the key information.
   *
   * @returns The key information.
   * @internal
   */
  private async fetch(): Promise<KeyInfo> {
    this.cached = await this.#apiClient.keyGet(this.id);
    return this.cached;
  }
}

/**
 * Convert a schema key type to a key type.
 *
 * @param ty The schema key type.
 * @returns The key type.
 * @internal
 */
export function fromSchemaKeyType(ty: SchemaKeyType): KeyType {
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
      return Stark;
    case "Mnemonic":
      return Mnemonic;
    case "P256CosmosAddr":
      return P256.Cosmos;
    case "P256OntologyAddr":
      return P256.Ontology;
    case "P256Neo3Addr":
      return P256.Neo3;
  }
}
