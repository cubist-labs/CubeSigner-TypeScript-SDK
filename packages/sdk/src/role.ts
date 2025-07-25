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
  BabylonStakingRequest,
  OperationKind,
  MfaReceipts,
  CubeSignerResponse,
  Empty,
  RestrictedActionsMap,
  GetRoleKeyOptions,
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
 * Restrict transaction values to amounts at or below the given limit in wei.
 * Currently, this only applies to EVM transactions.
 */
export type TxValueLimit = TxValueLimitPerTx | TxValueLimitWindow;

/**
 * Restrict individual transaction values to amounts at or below the given limit in wei.
 * Currently, this only applies to EVM transactions.
 *
 * @example { TxValueLimit: "0x12A05F200" }
 */
export type TxValueLimitPerTx = { TxValueLimit: string };

/**
 * Restrict transaction values, in wei, over a time window.
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
 * Restrict transaction max gas costs to amounts at or below the given limit in wei.
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
 * @example { IfErc20Tx: { allowed_contracts: [ { address: "0x0000000000000000000000034a20b809008afeb0", "chain_id": "1" } ] } }
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
 * The limit is in the token's unit.
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
 * The limit is in the token's unit.
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
 * Restrict transactions to only allow calling the given methods in the given contracts.
 *
 * @example { AssertContractTx: {
 *   allowlist: [{
 *     address: { address: "0x0000000000000000000000034a20b809008afeb0", "chain_id": "1" },
 *     methods: [
 *       "function name() public view returns (string)",
 *       "function transfer(address to, uint256 value) public returns (bool success)"
 *     ]
 *   }]
 * }
 */
export type AssertContractTx = {
  AssertContractTx: {
    allowlist: {
      address: ContractAddress;
      methods: string[];
    }[];
  };
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
  /**
   * The amount of time in seconds before an MFA receipt can be redeemed.
   * Defaults to 0, i.e., no delay. Approvers can vote to approve or veto
   * before the delay expires. After approving, it is still possible for
   * anyone to veto the request until the delay expires and the receipt
   * is redeemed.
   */
  time_delay?: number;
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

/**
 * Forwards the request parameters to this webhook which determines
 * whether the request is allowed to be executed.
 */
export type WebhookPolicy = {
  Webhook: {
    /** The url of the webhook */
    url: string;

    /** Optional HTTP method to use. Defaults to POST. */
    method?: string;

    /** Optional HTTP headers to set */
    headers?: Record<string, string>;

    /**
     * Request execution timeout in seconds; must be at least 1 not exceed 5 seconds.
     * Defaults to 5.
     */
    timeout?: number;

    /**
     * CubeSigner operations to which this policy should apply.
     * When omitted, applies to all operations.
     */
    restricted_operations?: OperationKind[];
  };
};

/** Babylon staking policy */
export type BabylonStaking = {
  BabylonStaking: {
    /**
     * Public keys that can be used for staking. Must be defined if the policy is being applied
     * to a SegWit key; otherwise, if `undefined`, only the key to which the policy is being
     * applied can be used as the staking public key when creating Babylon-related transactions.
     *
     * Hex-encoded public keys, WITHOUT the leading '0x'.
     */
    allowed_staker_pks?: string[];

    /**
     * Finality providers that can be used for staking. If `undefined`, any finality
     * provider can be used.
     *
     * Hex-encoded public keys, WITHOUT the leading '0x'.
     */
    allowed_finality_provider_pks?: string[];

    /**
     * Change addresses that can be used in staking transactions. If `undefined`, only
     * the key to which the policy is being applied can be used as the change address.
     */
    allowed_change_addrs?: string[];

    /**
     * Withdrawal addresses that can be used in withdrawal txns. If `undefined`, only
     * the key to which the policy is being applied can be used as the withdrawal address.
     */
    allowed_withdrawal_addrs?: string[];

    /** Babylon networks that this key can be used with. If `undefined`, any network. */
    allowed_network_ids?: BabylonStakingRequest["network"][];

    /**
     * Max fee allowed in a staking or withdrawal txn. If `undefined`, there is no fee limit.
     * Note that the fee for voluntary unbonding and slashing are fixed by the Babylon
     * params, and this limit is not enforced in those cases.
     */
    max_fee?: number;

    /** Min staking time in seconds. If `undefined`, uses the limit defined by the Babylon staking params. */
    min_lock_time?: number;

    /** Max staking time in seconds. If `undefined`, uses the limit defined by the Babylon staking params. */
    max_lock_time?: number;

    /** Min staking amount in SAT. If `undefined`, uses the limit defined by the Babylon staking params. */
    min_staking_value?: number;

    /** Max staking amount in SAT. If `undefined`, uses the limit defined by the Babylon staking params. */
    max_staking_value?: number;

    /** Minimum network parameters version allowed. */
    min_params_version?: number;

    /** Maximum network parameters version allowed. */
    max_params_version?: number;
  };
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

/** A reference to an org-level named policy and its version */
export type PolicyReference = `${string}/v${number}` | `${string}/latest`;

/** Key policies that restrict the requests that the signing endpoints accept */
export type KeyDenyPolicy =
  | TxReceiver
  | TxDeposit
  | TxValueLimit
  | TxGasCostLimit
  | IfErc20Tx
  | AssertErc20Tx
  | AssertContractTx
  | SuiTxReceivers
  | BtcTxReceivers
  | SourceIpAllowlist
  | SolanaInstructionPolicy
  | BtcSegwitValueLimit
  | RequireMfa
  | RequireRoleSession
  | BabylonStaking
  | WebhookPolicy;

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
  | AllowBtcMessageSigning
  | PolicyReference;

/** Role policy */
export type RolePolicy = RolePolicyRule[];

export type RolePolicyRule = KeyDenyPolicy | PolicyReference;

/** A key guarded by a policy. */
export class KeyWithPolicies {
  readonly #apiClient: ApiClient;
  readonly roleId: string;
  readonly keyId: string;
  /** The cached properties of this key/policies */
  #cached: KeyWithPoliciesInfo;

  /** @returns The cached information */
  get cached(): KeyWithPoliciesInfo {
    return this.#cached;
  }

  /** @returns The cached policy */
  get policy(): KeyPolicy | undefined {
    return this.cached.policy as KeyPolicy | undefined;
  }

  /** @returns The key */
  async getKey(): Promise<Key> {
    if (this.#cached.key_info === undefined || this.#cached.key_info === null) {
      this.#cached = await this.#apiClient.roleKeyGet(this.roleId, this.keyId, { details: true });
    }
    return new Key(this.#apiClient, this.#cached.key_info!);
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
    this.roleId = keyWithPolicies.role_id;
    this.keyId = keyWithPolicies.key_id;
    this.#cached = keyWithPolicies;
  }
}

/** Roles. */
export class Role {
  readonly #apiClient: ApiClient;
  /** The role information */
  #data: RoleInfo;

  /** @returns Human-readable name for the role */
  get name(): string | undefined {
    return this.#data.name ?? undefined;
  }

  /**
   * @returns The ID of the role.
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

  /**
   * Delete the role.
   *
   * @param mfaReceipt Optional MFA receipt(s)
   * @throws If MFA is required and no MFA receipts are provided
   * @returns A response which can be used to approve MFA if needed
   */
  async delete(mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>> {
    return await this.#apiClient.roleDelete(this.id, mfaReceipt);
  }

  /** @returns Whether the role is enabled */
  async enabled(): Promise<boolean> {
    const data = await this.fetch();
    return data.enabled;
  }

  /**
   * Enable the role.
   *
   * @param mfaReceipt Optional MFA receipt(s)
   * @throws If MFA is required and no MFA receipts are provided
   */
  async enable(mfaReceipt?: MfaReceipts) {
    await this.update({ enabled: true }, mfaReceipt);
  }

  /**
   * Disable the role.
   *
   * @param mfaReceipt Optional MFA receipt(s)
   * @throws If MFA is required and no MFA receipts are provided
   */
  async disable(mfaReceipt?: MfaReceipts) {
    await this.update({ enabled: false }, mfaReceipt);
  }

  /**
   * Set new policy (overwriting any policies previously set for this role)
   *
   * @param policy The new policy to set
   * @param mfaReceipt Optional MFA receipt(s)
   * @throws If MFA is required and no MFA receipts are provided
   */
  async setPolicy(policy: RolePolicy, mfaReceipt?: MfaReceipts) {
    await this.update({ policy }, mfaReceipt);
  }

  /**
   * Append to existing role policy. This append is not atomic---it uses
   * {@link policy} to fetch the current policy and then {@link setPolicy}
   * to set the policy---and should not be used in across concurrent sessions.
   *
   * @param policy The policy to append to the existing one.
   * @param mfaReceipt Optional MFA receipt(s)
   * @throws If MFA is required and no MFA receipts are provided
   */
  async appendPolicy(policy: RolePolicy, mfaReceipt?: MfaReceipts) {
    const existing = await this.policy();
    await this.setPolicy([...existing, ...policy], mfaReceipt);
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
   * Sets the restricted actions on the role.
   *
   * @param restrictedActions The map of restricted actions
   * @param mfaReceipt Optional MFA receipt(s)
   * @throws If MFA is required and no MFA receipts are provided
   */
  async setRestrictedActions(restrictedActions: RestrictedActionsMap, mfaReceipt?: MfaReceipts) {
    const restricted_actions = Object.fromEntries(
      Object.entries(restrictedActions).map(([key, value]) => [key.toString(), value]),
    );

    await this.update({ restricted_actions }, mfaReceipt);
  }

  /**
   * @returns The list of all users with access to the role.
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
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns an empty response, or a response that can be used to approve MFA if needed.
   */
  async addUser(userId: string, mfaReceipt?: MfaReceipts) {
    return await this.#apiClient.roleUserAdd(this.id, userId, mfaReceipt);
  }

  /**
   * Remove an existing user from an existing role.
   *
   * @param userId The user-id of the user to remove from the role.
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns an empty response, or a response that can be used to approve MFA if needed.
   */
  async removeUser(userId: string, mfaReceipt?: MfaReceipts) {
    return await this.#apiClient.roleUserRemove(this.id, userId, mfaReceipt);
  }

  /**
   * @returns The list of keys in the role.
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
   * Get a key in the role by its ID.
   *
   * @param keyId The ID of the key to get.
   * @param opts Optional options for getting the key.
   * @returns The key with its policies.
   */
  async getKey(keyId: string, opts?: GetRoleKeyOptions): Promise<KeyWithPolicies> {
    const kwp = await this.#apiClient.roleKeyGet(this.id, keyId, opts);
    return new KeyWithPolicies(this.#apiClient, kwp);
  }

  /**
   * Add a list of existing keys to an existing role.
   *
   * @param keys The list of keys to add to the role.
   * @param policy The optional policy to apply to each key.
   *
   * @returns A CubeSigner response indicating success or failure.
   */
  async addKeys(keys: Key[], policy?: KeyPolicy): Promise<CubeSignerResponse<Empty>> {
    return await this.#apiClient.roleKeysAdd(
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
   *
   * @returns A CubeSigner response indicating success or failure.
   */
  async addKey(key: Key, policy?: KeyPolicy): Promise<CubeSignerResponse<Empty>> {
    return await this.addKeys([key], policy);
  }

  /**
   * Remove an existing key from an existing role.
   *
   * @param key The key to remove from the role.
   *
   * @returns A CubeSigner response indicating success or failure.
   */
  async removeKey(key: Key): Promise<CubeSignerResponse<Empty>> {
    return await this.#apiClient.roleKeysRemove(this.id, key.id);
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
   * @param mfaReceipt Optional MFA receipt(s)
   * @throws If MFA is required and no MFA receipts are provided
   * @returns The updated role information.
   */
  private async update(request: UpdateRoleRequest, mfaReceipt?: MfaReceipts): Promise<RoleInfo> {
    const resp = await this.#apiClient.roleUpdate(this.id, request, mfaReceipt);
    this.#data = resp.data();
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
