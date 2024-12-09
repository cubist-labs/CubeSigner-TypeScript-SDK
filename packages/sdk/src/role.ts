import type {
  ApiClient,
  ContractAddress,
  EvmTxCmp,
  SolanaTxCmp,
  KeyWithPoliciesInfo,
  MfaType,
  PageOpts,
  RoleInfo,
  Scope,
  SessionData,
  SessionLifetime,
  UpdateRoleRequest,
} from ".";
import { Key, SignerSessionInfo } from ".";

/**
 * Restrict the receiver for EVM transactions.
 *
 * @example { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
 */
export type TxReceiver = { TxReceiver: string };

/**
 * Restrict the receiver for SUI transactions.
 *
 * @example { SuiTxReceiver: [ "0xc9837a0ad2d11468bbf847e3af4e3ede837bcc02a1be6faee621df1a8a403cbf" ] }
 */
export type SuiTxReceivers = { SuiTxReceivers: string[] };

/**
 * Restrict the receiver for BTC transactions.
 *
 * @example { BtcTxReceivers: [ "bc1q3qdavl37dnj6hjuazdzdxk0aanwjsg44mguq66", "bc1qfrjtxm8g20g97qzgadg7v9s3ftjkq02qfssk87" ] }
 */
export type BtcTxReceivers = { BtcTxReceivers: string[] };

/** The kind of deposit contracts. */
export enum DepositContract {
  /** Canonical deposit contract */
  Canonical,
  /** Wrapper deposit contract */
  Wrapper,
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
 * Restrict transaction values to amounts at or below the given limit.
 * Currently, this only applies to EVM transactions.
 */
export type TxValueLimit = TxValueLimitPerTx | TxValueLimitWindow;

/**
 * Restrict individual transaction values to amounts at or below the given limit.
 * Currently, this only applies to EVM transactions.
 *
 * @example { TxValueLimit: "0x12A05F200" }
 */
export type TxValueLimitPerTx = { TxValueLimit: string };

/**
 * Restrict transaction values over a time window.
 * Currently, this only applies to EVM transactions.
 *
 * @example { TxValueLimit: { limit: "0x12A05F200", window: 86400 }}
 * @example { TxValueLimit: { limit: "0x12A05F200", window: 604800, chain_ids: [ "012345" ] }}
 */
export type TxValueLimitWindow = {
  TxValueLimit: {
    limit: string;
    window?: number;
    chain_ids?: string[];
  };
};

/**
 * Restrict transaction max gas costs to amounts at or below the given limit.
 *
 * @example { TxGasCostLimit: "0x27CA57357C000" }
 */
export type TxGasCostLimit = { TxGasCostLimit: string };

/**
 * Restrict ERC-20 method calls according to the {@link Erc20Policy}.
 * Only applies to EVM transactions that call a valid ERC-20 method.
 * Non-ERC-20 transactions are ignored by this policy.
 *
 * @example { IfErc20Tx: { transfer_limits: [{ limit: "0xE8D4A51000" }] } }
 * @example { IfErc20Tx: { allowed_contracts: [ "0x0000000000000000000000034a20b809008afeb0" ] } }
 */
export type IfErc20Tx = { IfErc20Tx: Erc20Policy };

/**
 * Restrict transactions to only allow valid ERC-20 method calls.
 */
export type AssertErc20Tx = "AssertErc20Tx";

/**
 * Restrict ERC-20 `transfer` and `transferFrom` transaction values and receivers.
 * Only applies to contracts defined in `applies_to_contracts`,
 * or to all contracts if not defined.
 */
export type Erc20TransferLimit = {
  limit?: string;
  receivers?: string[];
  applies_to_contracts?: ContractAddress[];
};

/**
 * Restrict ERC-20 `approve` transaction values and spenders.
 * Only applies to contracts defined in `applies_to_contracts`,
 * or to all contracts if not defined.
 */
export type Erc20ApproveLimit = {
  limit?: string;
  spenders?: string[];
  applies_to_contracts?: ContractAddress[];
};

/**
 * Restricts ERC-20 policies to a set of known contracts,
 * and can define limits on `transfer`, `transferFrom` and `approve` method calls.
 */
export type Erc20Policy = {
  allowed_contracts?: ContractAddress[];
  transfer_limits?: Erc20TransferLimit[];
  approve_limits?: Erc20ApproveLimit[];
};

/**
 * Solana address matcher.
 * Can be either the pubkey of the account using base58 encoding,
 * or the index of the pubkey of an address lookup table and the
 * index of the account in that table.
 */
export type SolanaAddressMatcher =
  | string
  | {
      alt_address: string;
      index: number;
    };

/**
 * Solana instruction matcher.
 */
export type SolanaInstructionMatcher = {
  program_id: string;
  index?: number;
  accounts?: (
    | {
        address: SolanaAddressMatcher | SolanaAddressMatcher[];
      }
    | ({
        /** @deprecated use `address` instead. */
        pubkey: string;
      } & {
        index: number;
      })
  )[];
  data?:
    | string
    | {
        data: string;
        start_index: number;
      }[];
};

/**
 * Restricts Solana transaction instructions. Can limit the number of instructions,
 * the list of allowed instructions, and a set of required instructions in all transactions.
 */
export type SolanaInstructionPolicy = {
  SolanaInstructionPolicy: {
    count?: {
      min?: number;
      max?: number;
    };
    allowlist?: SolanaInstructionMatcher[];
    required?: SolanaInstructionMatcher[];
  };
};

/**
 * Restrict the total value transferred out of the inputs in a Bitcoin Segwit transaction
 * to amounts at or below the given limit.
 */
export type BtcSegwitValueLimit = BtcSegwitValueLimitPerTx | BtcSegwitValueLimitWindow;

/**
 * Restrict individual Bitcoin Segwit transaction values to amounts at or below
 * the given limit.
 *
 * @example { BtcSegwitValueLimit: "1000000" }
 */
export type BtcSegwitValueLimitPerTx = {
  BtcSegwitValueLimit: number;
};

/**
 * Restrict the total value transferred out of the inputs in Bitcoin Segwit transactions
 * over a time window.
 *
 * @example { BtcSegwitValueLimit: { limit: "1000000", window: 86400 }}
 */
export type BtcSegwitValueLimitWindow = {
  BtcSegwitValueLimit: {
    limit: number;
    window?: number;
  };
};

/**
 * Only allow connections from clients whose IP addresses match any of these IPv4 CIDR blocks.
 *
 * @example { SourceIpAllowlist: [ "123.456.78.9/16" ] }
 */
export type SourceIpAllowlist = { SourceIpAllowlist: string[] };

/** All different kinds of sensitive operations. */
export enum OperationKind {
  BlobSign = "BlobSign",
  EvmSign = "Eth1Sign",
  Eth2Sign = "Eth2Sign",
  Eth2Stake = "Eth2Stake",
  Eth2Unstake = "Eth2Unstake",
  SolanaSign = "SolanaSign",
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
  /** Lifetime in seconds, defaults to 900 (15 minutes) */
  lifetime?: number;
  /**
   * How to compare HTTP requests when verifying the MFA receipt.
   * This specifies how we check equality between (1) the HTTP request when the 202 (MFA required)
   * response is returned and (2) the HTTP request when the correspond MFA receipt is used.
   */
  request_comparer?: HttpRequestComparer;
};

export type HttpRequestComparer = "Eq" | { EvmTx: EvmTxCmp } | { SolanaTx: SolanaTxCmp };

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

/**
 * Require that the key is accessed via a role session.
 *
 * @example { "RequireRoleSession": "*" }
 * @example { "RequireRoleSession": [
 *   "Role#34dfb654-f36d-48ea-bdf6-833c0d94b759",
 *   "Role#98d87633-d1a7-4612-b6b4-b2fa2b43cd3d"
 * ]}
 */
export type RequireRoleSession = {
  /** Require either any role session or any one of the approved roles */
  RequireRoleSession: "*" | string[];
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

/** Allow BTC message signing */
export const AllowBtcMessageSigning = "AllowBtcMessageSigning" as const;
export type AllowBtcMessageSigning = typeof AllowBtcMessageSigning;

/** Key policies that restrict the requests that the signing endpoints accept */
export type KeyDenyPolicy =
  | TxReceiver
  | TxDeposit
  | TxValueLimit
  | TxGasCostLimit
  | IfErc20Tx
  | AssertErc20Tx
  | SuiTxReceivers
  | BtcTxReceivers
  | SourceIpAllowlist
  | SolanaInstructionPolicy
  | BtcSegwitValueLimit
  | RequireMfa
  | RequireRoleSession;

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
 *
 * @example ["AssertErc20Tx", { "IfErc20Tx": "transfer_limits": [ { "limit": "0x3B9ACA00" } ] }]
 */
export type KeyPolicy = KeyPolicyRule[];

export type KeyPolicyRule =
  | KeyDenyPolicy
  | AllowRawBlobSigning
  | AllowEip191Signing
  | AllowEip712Signing
  | AllowBtcMessageSigning;

/** Role policy */
export type RolePolicy = KeyDenyPolicy[];

/** A key guarded by a policy. */
export class KeyWithPolicies {
  readonly #apiClient: ApiClient;
  readonly keyId: string;
  readonly policy?: KeyPolicy;

  /** @returns The key */
  async getKey(): Promise<Key> {
    const keyInfo = await this.#apiClient.keyGet(this.keyId);
    return new Key(this.#apiClient, keyInfo);
  }

  /**
   * Constructor.
   *
   * @param apiClient The API client to use.
   * @param keyWithPolicies The key and its policies
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
   *
   * @example Role#bfe3eccb-731e-430d-b1e5-ac1363e6b06b
   */
  get id(): string {
    return this.#data.role_id;
  }

  /**
   * @returns the cached properties of this role. The cached properties
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
   *
   * @param policy The new policy to set
   */
  async setPolicy(policy: RolePolicy) {
    await this.update({ policy: policy as unknown as Record<string, never>[] });
  }

  /**
   * Append to existing role policy. This append is not atomic---it uses
   * {@link policy} to fetch the current policy and then {@link setPolicy}
   * to set the policy---and should not be used in across concurrent sessions.
   *
   * @param policy The policy to append to the existing one.
   */
  async appendPolicy(policy: RolePolicy) {
    const existing = await this.policy();
    await this.setPolicy([...existing, ...policy]);
  }

  /**
   * Get the policy for the role.
   *
   * @returns The policy for the role.
   */
  async policy(): Promise<RolePolicy> {
    const data = await this.fetch();
    return (data.policy ?? []) as unknown as RolePolicy;
  }

  /**
   * The list of all users with access to the role.
   *
   * @example [
   *   "User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f",
   *   "User#5593c25b-52e2-4fb5-b39b-96d41d681d82"
   * ]
   *
   * @param page Optional pagination options; by default, retrieves all users.
   */
  async users(page?: PageOpts): Promise<string[]> {
    const users = await this.#apiClient.roleUsersList(this.id, page).fetch();
    return (users || []).map((u) => u.user_id);
  }

  /**
   * Add an existing user to an existing role.
   *
   * @param userId The user-id of the user to add to the role.
   */
  async addUser(userId: string) {
    await this.#apiClient.roleUserAdd(this.id, userId);
  }

  /**
   * Remove an existing user from an existing role.
   *
   * @param userId The user-id of the user to remove from the role.
   */
  async removeUser(userId: string) {
    await this.#apiClient.roleUserRemove(this.id, userId);
  }

  /**
   * The list of keys in the role.
   *
   * @example [
   *    {
   *     id: "Key#bfe3eccb-731e-430d-b1e5-ac1363e6b06b",
   *     policy: { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
   *    },
   *  ]
   *
   * @param page Optional pagination options; by default, retrieves all keys in this role.
   */
  async keys(page?: PageOpts): Promise<KeyWithPolicies[]> {
    const keysInRole = await this.#apiClient.roleKeysList(this.id, page).fetch();
    return keysInRole.map((k) => new KeyWithPolicies(this.#apiClient, k));
  }

  /**
   * Add a list of existing keys to an existing role.
   *
   * @param keys The list of keys to add to the role.
   * @param policy The optional policy to apply to each key.
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
   * @param key The key to add to the role.
   * @param policy The optional policy to apply to the key.
   */
  async addKey(key: Key, policy?: KeyPolicy) {
    await this.addKeys([key], policy);
  }

  /**
   * Remove an existing key from an existing role.
   *
   * @param key The key to remove from the role.
   */
  async removeKey(key: Key) {
    await this.#apiClient.roleKeysRemove(this.id, key.id);
  }

  /**
   * Create a new session for this role.
   *
   * @param purpose Descriptive purpose.
   * @param lifetimes Optional session lifetimes.
   * @param scopes Session scopes. Only `sign:*` scopes are allowed.
   * @returns New session.
   */
  async createSession(
    purpose: string,
    lifetimes?: SessionLifetime,
    scopes?: Scope[],
  ): Promise<SessionData> {
    return await this.#apiClient.sessionCreateForRole(this.id, purpose, scopes, lifetimes);
  }

  /**
   * List all signer sessions for this role. Returned objects can be used to
   * revoke individual sessions, but they cannot be used for authentication.
   *
   * @param page Optional pagination options; by default, retrieves all sessions.
   * @returns Signer sessions for this role.
   */
  async sessions(page?: PageOpts): Promise<SignerSessionInfo[]> {
    const sessions = await this.#apiClient.sessionsList({ role: this.id }, page).fetch();
    return sessions.map((t) => new SignerSessionInfo(this.#apiClient, t.session_id, t.purpose));
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * @param apiClient The API client to use.
   * @param data The JSON response from the API server.
   * @internal
   */
  constructor(apiClient: ApiClient, data: RoleInfo) {
    this.#apiClient = apiClient;
    this.#data = data;
  }

  /**
   * Update the role.
   *
   * @param request The JSON request to send to the API server.
   * @returns The updated role information.
   */
  private async update(request: UpdateRoleRequest): Promise<RoleInfo> {
    this.#data = await this.#apiClient.roleUpdate(this.id, request);
    return this.#data;
  }

  /**
   * Fetches the role information.
   *
   * @returns The role information.
   * @internal
   */
  private async fetch(): Promise<RoleInfo> {
    this.#data = await this.#apiClient.roleGet(this.id);
    return this.#data;
  }
}
