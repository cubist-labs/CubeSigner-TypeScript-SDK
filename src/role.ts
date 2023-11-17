import {
  Key,
  KeyWithPoliciesInfo,
  MfaType,
  PageOpts,
  RoleInfo,
  SignerSession,
  SignerSessionInfo,
  SignerSessionLifetime,
  SignerSessionManager,
  SignerSessionStorage,
  UpdateRoleRequest,
} from ".";
import { CubeSignerClient } from "./client";

/**
 * Restrict transaction receiver.
 *
 * @example { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
 */
export type TxReceiver = { TxReceiver: string };

/** The kind of deposit contracts. */
export enum DepositContract {
  /** Canonical deposit contract */
  Canonical, // eslint-disable-line no-unused-vars
  /** Wrapper deposit contract */
  Wrapper, // eslint-disable-line no-unused-vars
}

/** Restrict transactions to calls to deposit contract. */
export type TxDeposit = TxDepositBase | TxDepositPubkey | TxDepositRole;

/** Restrict transactions to calls to deposit contract*/
export type TxDepositBase = { TxDeposit: { kind: DepositContract } };

/**
 * Restrict transactions to calls to deposit contract with fixed validator (pubkey):
 *
 * @example { TxDeposit: { kind: DespositContract.Canonical, validator: { pubkey: "8879...8"} }}
 */
export type TxDepositPubkey = { TxDeposit: { kind: DepositContract; pubkey: string } };

/**
 * Restrict transactions to calls to deposit contract with any validator key in a role:
 *
 * @example { TxDeposit: { kind: DespositContract.Canonical, validator: { role_id: "Role#c63...af"} }}
 */
export type TxDepositRole = { TxDeposit: { kind: DepositContract; role_id: string } };

/** All different kinds of sensitive operations. */
export enum OperationKind {
  BlobSign = "BlobSign", // eslint-disable-line no-unused-vars
  EvmSign = "Eth1Sign", // eslint-disable-line no-unused-vars
  Eth2Sign = "Eth2Sign", // eslint-disable-line no-unused-vars
  Eth2Stake = "Eth2Stake", // eslint-disable-line no-unused-vars
  Eth2Unstake = "Eth2Unstake", // eslint-disable-line no-unused-vars
  SolanaSign = "SolanaSign", // eslint-disable-line no-unused-vars
}

/**
 * MFA policy
 *
 * @example {
 * {
 *   count: 1,
 *   num_auth_factors: 1,
 *   allowed_mfa_types: [ "Totp" ],
 *   allowed_approvers: [ "User#123" ],
 * }
 */
export type MfaPolicy = {
  count?: number;
  num_auth_factors?: number;
  allowed_approvers?: string[];
  allowed_mfa_types?: MfaType[];
  restricted_operations?: OperationKind[];
};

/** Require MFA for transactions.
 * @example {
 *     RequireMfa: {
 *       count: 1,
 *       allowed_mfa_types: [ "Totp" ],
 *       allowed_approvers: [ "User#123" ],
 *       restricted_operations: [
 *         "Eth1Sign",
 *         "BlobSign"
 *       ]
 *     }
 *   }
 * */
export type RequireMfa = {
  RequireMfa: MfaPolicy;
};

/** Allow raw blob signing */
export const AllowRawBlobSigning = "AllowRawBlobSigning" as const;
export type AllowRawBlobSigning = typeof AllowRawBlobSigning;

/**
 * Key policy
 *
 * @example [
 *   {
 *     "TxReceiver": "0x8c594691c0e592ffa21f153a16ae41db5befcaaa"
 *   },
 *   {
 *     "TxDeposit": {
 *       "kind": "Canonical"
 *     }
 *   },
 *   {
 *     "RequireMfa": {
 *       "count": 1,
 *       "allowed_mfa_types": ["CubeSigner"],
 *       "restricted_operations": [
 *         "Eth1Sign",
 *         "BlobSign"
 *       ]
 *     }
 *   }
 * ]
 */
export type KeyPolicy = (TxReceiver | TxDeposit | RequireMfa | AllowRawBlobSigning)[];

/** A key guarded by a policy. */
export class KeyWithPolicies {
  readonly #csc: CubeSignerClient;
  readonly keyId: string;
  readonly policy?: KeyPolicy;

  /** @return {Promise<Key>} The key */
  async getKey(): Promise<Key> {
    const keyInfo = await this.#csc.keyGet(this.keyId);
    return new Key(this.#csc, keyInfo);
  }

  /**
   * Constructor.
   * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
   * @param {KeyWithPoliciesInfo} keyWithPolicies The key and its policies
   * @internal
   */
  constructor(csc: CubeSignerClient, keyWithPolicies: KeyWithPoliciesInfo) {
    this.#csc = csc;
    this.keyId = keyWithPolicies.key_id;
    this.policy = keyWithPolicies.policy as unknown as KeyPolicy;
  }
}

/** Roles. */
export class Role {
  readonly #csc: CubeSignerClient;

  /** Human-readable name for the role */
  public readonly name?: string;

  /**
   * The ID of the role.
   * @example Role#bfe3eccb-731e-430d-b1e5-ac1363e6b06b
   * */
  readonly id: string;

  /** Delete the role. */
  async delete(): Promise<void> {
    await this.#csc.roleDelete(this.id);
  }

  /** Is the role enabled? */
  async enabled(): Promise<boolean> {
    const data = await this.fetch();
    return data.enabled;
  }

  /** Enable the role. */
  async enable() {
    await this.update({ enabled: true });
  }

  /** Disable the role. */
  async disable() {
    await this.update({ enabled: false });
  }

  /**
   * The list of all users with access to the role.
   * @example [
   *   "User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f",
   *   "User#5593c25b-52e2-4fb5-b39b-96d41d681d82"
   * ]
   *
   * @param {PageOpts} page Optional pagination options; by default, retrieves all users.
   */
  async users(page?: PageOpts): Promise<string[]> {
    const users = await this.#csc.roleUsersList(this.id, page).fetch();
    return (users || []).map((u) => u.user_id);
  }

  /**
   * Add an existing user to an existing role.
   *
   * @param {string} userId The user-id of the user to add to the role.
   */
  async addUser(userId: string) {
    await this.#csc.roleUserAdd(this.id, userId);
  }

  /**
   * The list of keys in the role.
   * @example [
   *    {
   *     id: "Key#bfe3eccb-731e-430d-b1e5-ac1363e6b06b",
   *     policy: { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
   *    },
   *  ]
   *
   * @param {PageOpts} page Optional pagination options; by default, retrieves all keys in this role.
   */
  async keys(page?: PageOpts): Promise<KeyWithPolicies[]> {
    const keysInRole = await this.#csc.roleKeysList(this.id, page).fetch();
    return keysInRole.map((k) => new KeyWithPolicies(this.#csc, k));
  }

  /**
   * Add a list of existing keys to an existing role.
   *
   * @param {Key[]} keys The list of keys to add to the role.
   * @param {KeyPolicy?} policy The optional policy to apply to each key.
   */
  async addKeys(keys: Key[], policy?: KeyPolicy) {
    await this.#csc.roleKeysAdd(
      this.id,
      keys.map((k) => k.id),
      policy,
    );
  }

  /**
   * Add an existing key to an existing role.
   *
   * @param {Key} key The key to add to the role.
   * @param {KeyPolicy?} policy The optional policy to apply to the key.
   */
  async addKey(key: Key, policy?: KeyPolicy) {
    await this.addKeys([key], policy);
  }

  /**
   * Remove an existing key from an existing role.
   *
   * @param {Key} key The key to remove from the role.
   */
  async removeKey(key: Key) {
    await this.#csc.roleKeysRemove(this.id, key.id);
  }

  /**
   * Create a new session for this role.
   * @param {SignerSessionStorage} storage The session storage to use
   * @param {string} purpose Descriptive purpose.
   * @param {SignerSessionLifetime} lifetimes Optional session lifetimes.
   * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
   * @return {Promise<SignerSession>} New signer session.
   */
  async createSession(
    storage: SignerSessionStorage,
    purpose: string,
    lifetimes?: SignerSessionLifetime,
    scopes?: string[],
  ): Promise<SignerSession> {
    const sessionData = await this.#csc.sessionCreateForRole(this.id, purpose, scopes, lifetimes);
    await storage.save(sessionData);
    const manager = await SignerSessionManager.loadFromStorage(storage);
    return new SignerSession(manager);
  }

  /**
   * List all signer sessions for this role. Returned objects can be used to
   * revoke individual sessions, but they cannot be used for authentication.
   *
   * @param {PageOpts} page Optional pagination options; by default, retrieves all sessions.
   * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
   */
  async sessions(page?: PageOpts): Promise<SignerSessionInfo[]> {
    const sessions = await this.#csc.sessionsList(this.id, page).fetch();
    return sessions.map((t) => new SignerSessionInfo(this.#csc, t.session_id, t.purpose));
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Constructor.
   * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
   * @param {RoleInfo} data The JSON response from the API server.
   * @internal
   */
  constructor(csc: CubeSignerClient, data: RoleInfo) {
    this.#csc = csc;
    this.id = data.role_id;
    this.name = data.name ?? undefined;
  }

  /**
   * Update the role.
   *
   * @param {UpdateRoleRequest} request The JSON request to send to the API server.
   * @return {Promise<RoleInfo>} The updated role information.
   */
  private async update(request: UpdateRoleRequest): Promise<RoleInfo> {
    return await this.#csc.roleUpdate(this.id, request);
  }

  /**
   * Fetches the role information.
   *
   * @return {RoleInfo} The role information.
   * @internal
   */
  private async fetch(): Promise<RoleInfo> {
    return await this.#csc.roleGet(this.id);
  }
}
