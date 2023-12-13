import { KeyPolicy } from "./role";
import { KeyInfoApi, KeyTypeApi, UpdateKeyRequest, SchemaKeyType } from "./schema_types";
import { CubeSignerClient } from "./client";

/** Secp256k1 key type */
export enum Secp256k1 {
  Evm = "SecpEthAddr", // eslint-disable-line no-unused-vars
  Btc = "SecpBtc", // eslint-disable-line no-unused-vars
  BtcTest = "SecpBtcTest", // eslint-disable-line no-unused-vars
  Ava = "SecpAvaAddr", // eslint-disable-line no-unused-vars
  AvaTest = "SecpAvaTestAddr", // eslint-disable-line no-unused-vars
}

/** BLS key type */
export enum Bls {
  Eth2Deposited = "BlsPub", // eslint-disable-line no-unused-vars
  Eth2Inactive = "BlsInactive", // eslint-disable-line no-unused-vars
}

/** Ed25519 key type */
export enum Ed25519 {
  Solana = "Ed25519SolanaAddr", // eslint-disable-line no-unused-vars
  Sui = "Ed25519SuiAddr", // eslint-disable-line no-unused-vars
  Aptos = "Ed25519AptosAddr", // eslint-disable-line no-unused-vars
  Cardano = "Ed25519CardanoAddrVk", // eslint-disable-line no-unused-vars
  Stellar = "Ed25519StellarAddr", // eslint-disable-line no-unused-vars
}

/** Mnemonic key type */
export const Mnemonic = "Mnemonic" as const;
export type Mnemonic = typeof Mnemonic;

/** Stark key type */
export const Stark = "Stark" as const;
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
export function toKeyInfo(key: KeyInfoApi): KeyInfo {
  return {
    ...key,
    id: key.key_id,
    type: key.key_type,
    publicKey: key.public_key,
    materialId: key.material_id,
  };
}

/** Signing keys. */
export class Key {
  /** The CubeSigner instance that this key is associated with */
  readonly #csc: CubeSignerClient;

  /** The organization that this key is in */
  get orgId() {
    return this.#csc.orgId;
  }

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

  /** The type of key. */
  async type(): Promise<KeyType> {
    const data = await this.fetch();
    return fromSchemaKeyType(data.key_type);
  }

  /** Is the key enabled? */
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
   * Set new policy (overwriting any policies previously set for this key)
   * @param {KeyPolicy} policy The new policy to set
   */
  async setPolicy(policy: KeyPolicy) {
    await this.update({ policy: policy as unknown as Record<string, never>[] });
  }

  /**
   * Append to existing key policy. This append is not atomic -- it uses {@link policy} to fetch the current policy and then {@link setPolicy} to set the policy -- and should not be used in across concurrent sessions.
   * @param {KeyPolicy} policy The policy to append to the existing one.
   */
  async appendPolicy(policy: KeyPolicy) {
    const existing = await this.policy();
    await this.setPolicy([...existing, ...policy]);
  }

  /**
   * Get the policy for the org.
   * @return {Promise<KeyPolicy>} The policy for the org.
   */
  async policy(): Promise<KeyPolicy> {
    const data = await this.fetch();
    return (data.policy ?? []) as unknown as KeyPolicy;
  }

  /**
   * @description Owner of the key
   * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   */
  async owner(): Promise<string> {
    const data = await this.fetch();
    return data.owner;
  }

  /**
   * Set the owner of the key. Only the key (or org) owner can change the owner of the key.
   * @param {string} owner The user-id of the new owner of the key.
   */
  async setOwner(owner: string) {
    await this.update({ owner });
  }

  /**
   * Delete this key.
   */
  async delete() {
    await this.#csc.keyDelete(this.id);
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Create a new key.
   *
   * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
   * @param {KeyInfo} data The JSON response from the API server.
   * @internal
   */
  constructor(csc: CubeSignerClient, data: KeyInfoApi) {
    this.#csc = csc;
    this.id = data.key_id;
    this.materialId = data.material_id;
    this.publicKey = data.public_key;
  }

  /**
   * Update the key.
   * @param {UpdateKeyRequest} request The JSON request to send to the API server.
   * @return {KeyInfo} The JSON response from the API server.
   */
  private async update(request: UpdateKeyRequest): Promise<KeyInfo> {
    const data = await this.#csc.keyUpdate(this.id, request);
    return toKeyInfo(data);
  }

  /**
   * Fetch the key information.
   *
   * @return {KeyInfo} The key information.
   * @internal
   */
  private async fetch(): Promise<KeyInfo> {
    const data = await this.#csc.keyGet(this.id);
    return toKeyInfo(data);
  }
}

/**
 * Convert a schema key type to a key type.
 *
 * @param {SchemaKeyType} ty The schema key type.
 * @return {KeyType} The key type.
 * @internal
 */
export function fromSchemaKeyType(ty: SchemaKeyType): KeyType {
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
      return Stark;
    case "Mnemonic":
      return Mnemonic;
  }
}
