import type {
  ApiClient,
  KeyWithPoliciesInfo,
  MfaType,
  PageOpts,
  RoleInfo,
  SessionData,
  SessionLifetime,
  UpdateRoleRequest,
} from ".";
import { Key, SignerSessionInfo } from ".";

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

/**
 * Only allow connections from clients whose IP addresses match any of these IPv4 CIDR blocks.
 *
 * @example { SourceIpAllowlist: [ "123.456.78.9/16" ] }
 */
export type SourceIpAllowlist = { SourceIpAllowlist: string[] };

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

/**
 * Require MFA for transactions.
 *
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
 */
export type RequireMfa = {
  RequireMfa: MfaPolicy;
};

/** Allow raw blob signing */
export const AllowRawBlobSigning = "AllowRawBlobSigning" as const;
export type AllowRawBlobSigning = typeof AllowRawBlobSigning;

/** Allow EIP-191 signing */
export const AllowEip191Signing = "AllowEip191Signing" as const;
export type AllowEip191Signing = typeof AllowEip191Signing;

/** Allow EIP-712 signing */
export const AllowEip712Signing = "AllowEip712Signing" as const;
export type AllowEip712Signing = typeof AllowEip712Signing;

/** Key policies that restrict the requests that the signing endpoints accept */
type KeyDenyPolicy = TxReceiver | TxDeposit | SourceIpAllowlist | RequireMfa;

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
export type KeyPolicy = KeyPolicyRule[];

export type KeyPolicyRule =
  | KeyDenyPolicy
  | AllowRawBlobSigning
  | AllowEip191Signing
  | AllowEip712Signing;

/** Role policy */
export type RolePolicy = KeyDenyPolicy[];

/** A key guarded by a policy. */
export class KeyWithPolicies {
  readonly #apiClient: ApiClient;
  readonly keyId: string;
  readonly policy?: KeyPolicy;

  /** @return {Promise<Key>} The key */
  async getKey(): Promise<Key> {
    const keyInfo = await this.#apiClient.keyGet(this.keyId);
    return new Key(this.#apiClient, keyInfo);
  }

  /**
   * Constructor.
   * @param {ApiClient} apiClient The API client to use.
   * @param {KeyWithPoliciesInfo} keyWithPolicies The key and its policies
   * @internal
   */
  constructor(apiClient: ApiClient, keyWithPolicies: KeyWithPoliciesInfo) {
    this.#apiClient = apiClient;
    this.keyId = keyWithPolicies.key_id;
    this.policy = keyWithPolicies.policy as unknown as KeyPolicy;
  }
}

/** Roles. */
export class Role {
  readonly #apiClient: ApiClient;
  /** The role information */
  #data: RoleInfo;

  /** Human-readable name for the role */
  get name(): string | undefined {
    return this.#data.name ?? undefined;
  }

  /**
   * The ID of the role.
   * @example Role#bfe3eccb-731e-430d-b1e5-ac1363e6b06b
   */
  get id(): string {
    return this.#data.role_id;
  }

  /**
   * @return {RoleInfo} the cached properties of this role. The cached properties
   * reflect the state of the last fetch or update (e.g., after awaiting
   * `Role.enabled()` or `Role.disable()`).
   */
  get cached(): RoleInfo {
    return this.#data;
  }

  /** Delete the role. */
  async delete(): Promise<void> {
    await this.#apiClient.roleDelete(this.id);
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
   * Set new policy (overwriting any policies previously set for this role)
   * @param {RolePolicy} policy The new policy to set
   */
  async setPolicy(policy: RolePolicy) {
    await this.update({ policy: policy as unknown as Record<string, never>[] });
  }

  /**
   * Append to existing role policy. This append is not atomic---it uses
   * {@link policy} to fetch the current policy and then {@link setPolicy}
   * to set the policy---and should not be used in across concurrent sessions.
   *
   * @param {RolePolicy} policy The policy to append to the existing one.
   */
  async appendPolicy(policy: RolePolicy) {
    const existing = await this.policy();
    await this.setPolicy([...existing, ...policy]);
  }

  /**
   * Get the policy for the role.
   * @return {Promise<RolePolicy>} The policy for the role.
   */
  async policy(): Promise<RolePolicy> {
    const data = await this.fetch();
    return (data.policy ?? []) as unknown as RolePolicy;
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
    const users = await this.#apiClient.roleUsersList(this.id, page).fetch();
    return (users || []).map((u) => u.user_id);
  }

  /**
   * Add an existing user to an existing role.
   *
   * @param {string} userId The user-id of the user to add to the role.
   */
  async addUser(userId: string) {
    await this.#apiClient.roleUserAdd(this.id, userId);
  }

  /**
   * Remove an existing user from an existing role.
   *
   * @param {string} userId The user-id of the user to remove from the role.
   */
  async removeUser(userId: string) {
    await this.#apiClient.roleUserRemove(this.id, userId);
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
    const keysInRole = await this.#apiClient.roleKeysList(this.id, page).fetch();
    return keysInRole.map((k) => new KeyWithPolicies(this.#apiClient, k));
  }

  /**
   * Add a list of existing keys to an existing role.
   *
   * @param {Key[]} keys The list of keys to add to the role.
   * @param {KeyPolicy?} policy The optional policy to apply to each key.
   */
  async addKeys(keys: Key[], policy?: KeyPolicy) {
    await this.#apiClient.roleKeysAdd(
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
    await this.#apiClient.roleKeysRemove(this.id, key.id);
  }

  /**
   * Create a new session for this role.
   * @param {string} purpose Descriptive purpose.
   * @param {SessionLifetime} lifetimes Optional session lifetimes.
   * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
   * @return {Promise<SessionData>} New session.
   */
  async createSession(
    purpose: string,
    lifetimes?: SessionLifetime,
    scopes?: string[],
  ): Promise<SessionData> {
    return await this.#apiClient.sessionCreateForRole(this.id, purpose, scopes, lifetimes);
  }

  /**
   * List all signer sessions for this role. Returned objects can be used to
   * revoke individual sessions, but they cannot be used for authentication.
   *
   * @param {PageOpts} page Optional pagination options; by default, retrieves all sessions.
   * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
   */
  async sessions(page?: PageOpts): Promise<SignerSessionInfo[]> {
    const sessions = await this.#apiClient.sessionsList(this.id, page).fetch();
    return sessions.map((t) => new SignerSessionInfo(this.#apiClient, t.session_id, t.purpose));
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Constructor.
   * @param {ApiClient} apiClient The API client to use.
   * @param {RoleInfo} data The JSON response from the API server.
   * @internal
   */
  constructor(apiClient: ApiClient, data: RoleInfo) {
    this.#apiClient = apiClient;
    this.#data = data;
  }

  /**
   * Update the role.
   *
   * @param {UpdateRoleRequest} request The JSON request to send to the API server.
   * @return {Promise<RoleInfo>} The updated role information.
   */
  private async update(request: UpdateRoleRequest): Promise<RoleInfo> {
    this.#data = await this.#apiClient.roleUpdate(this.id, request);
    return this.#data;
  }

  /**
   * Fetches the role information.
   *
   * @return {RoleInfo} The role information.
   * @internal
   */
  private async fetch(): Promise<RoleInfo> {
    this.#data = await this.#apiClient.roleGet(this.id);
    return this.#data;
  }
}
