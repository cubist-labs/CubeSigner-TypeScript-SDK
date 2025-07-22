import type { ApiClient, EvmTxCmp, KeyWithPoliciesInfo, MfaType, PageOpts, RoleInfo, SessionData, SessionLifetime } from ".";
import { Key, SignerSessionInfo } from ".";
/**
 * Restrict transaction receiver.
 *
 * @example { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
 */
export type TxReceiver = {
    TxReceiver: string;
};
/** The kind of deposit contracts. */
export declare enum DepositContract {
    /** Canonical deposit contract */
    Canonical = 0,// eslint-disable-line no-unused-vars
    /** Wrapper deposit contract */
    Wrapper = 1
}
/** Restrict transactions to calls to deposit contract. */
export type TxDeposit = TxDepositBase | TxDepositPubkey | TxDepositRole;
/** Restrict transactions to calls to deposit contract*/
export type TxDepositBase = {
    TxDeposit: {
        kind: DepositContract;
    };
};
/**
 * Restrict transactions to calls to deposit contract with fixed validator (pubkey):
 *
 * @example { TxDeposit: { kind: DespositContract.Canonical, validator: { pubkey: "8879...8"} }}
 */
export type TxDepositPubkey = {
    TxDeposit: {
        kind: DepositContract;
        pubkey: string;
    };
};
/**
 * Restrict transactions to calls to deposit contract with any validator key in a role:
 *
 * @example { TxDeposit: { kind: DespositContract.Canonical, validator: { role_id: "Role#c63...af"} }}
 */
export type TxDepositRole = {
    TxDeposit: {
        kind: DepositContract;
        role_id: string;
    };
};
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
export type TxValueLimitPerTx = {
    TxValueLimit: string;
};
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
export type TxGasCostLimit = {
    TxGasCostLimit: string;
};
/**
 * Only allow connections from clients whose IP addresses match any of these IPv4 CIDR blocks.
 *
 * @example { SourceIpAllowlist: [ "123.456.78.9/16" ] }
 */
export type SourceIpAllowlist = {
    SourceIpAllowlist: string[];
};
/** All different kinds of sensitive operations. */
export declare enum OperationKind {
    BlobSign = "BlobSign",// eslint-disable-line no-unused-vars
    EvmSign = "Eth1Sign",// eslint-disable-line no-unused-vars
    Eth2Sign = "Eth2Sign",// eslint-disable-line no-unused-vars
    Eth2Stake = "Eth2Stake",// eslint-disable-line no-unused-vars
    Eth2Unstake = "Eth2Unstake",// eslint-disable-line no-unused-vars
    SolanaSign = "SolanaSign"
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
export type HttpRequestComparer = "Eq" | {
    EvmTx: EvmTxCmp;
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
export declare const AllowRawBlobSigning: "AllowRawBlobSigning";
export type AllowRawBlobSigning = typeof AllowRawBlobSigning;
/** Allow EIP-191 signing */
export declare const AllowEip191Signing: "AllowEip191Signing";
export type AllowEip191Signing = typeof AllowEip191Signing;
/** Allow EIP-712 signing */
export declare const AllowEip712Signing: "AllowEip712Signing";
export type AllowEip712Signing = typeof AllowEip712Signing;
/** Key policies that restrict the requests that the signing endpoints accept */
type KeyDenyPolicy = TxReceiver | TxDeposit | TxValueLimit | TxGasCostLimit | SourceIpAllowlist | RequireMfa;
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
export type KeyPolicyRule = KeyDenyPolicy | AllowRawBlobSigning | AllowEip191Signing | AllowEip712Signing;
/** Role policy */
export type RolePolicy = KeyDenyPolicy[];
/** A key guarded by a policy. */
export declare class KeyWithPolicies {
    #private;
    readonly keyId: string;
    readonly policy?: KeyPolicy;
    /** @return {Promise<Key>} The key */
    getKey(): Promise<Key>;
    /**
     * Constructor.
     * @param {ApiClient} apiClient The API client to use.
     * @param {KeyWithPoliciesInfo} keyWithPolicies The key and its policies
     * @internal
     */
    constructor(apiClient: ApiClient, keyWithPolicies: KeyWithPoliciesInfo);
}
/** Roles. */
export declare class Role {
    #private;
    /** Human-readable name for the role */
    get name(): string | undefined;
    /**
     * The ID of the role.
     * @example Role#bfe3eccb-731e-430d-b1e5-ac1363e6b06b
     */
    get id(): string;
    /**
     * @return {RoleInfo} the cached properties of this role. The cached properties
     * reflect the state of the last fetch or update (e.g., after awaiting
     * `Role.enabled()` or `Role.disable()`).
     */
    get cached(): RoleInfo;
    /** Delete the role. */
    delete(): Promise<void>;
    /** Is the role enabled? */
    enabled(): Promise<boolean>;
    /** Enable the role. */
    enable(): Promise<void>;
    /** Disable the role. */
    disable(): Promise<void>;
    /**
     * Set new policy (overwriting any policies previously set for this role)
     * @param {RolePolicy} policy The new policy to set
     */
    setPolicy(policy: RolePolicy): Promise<void>;
    /**
     * Append to existing role policy. This append is not atomic---it uses
     * {@link policy} to fetch the current policy and then {@link setPolicy}
     * to set the policy---and should not be used in across concurrent sessions.
     *
     * @param {RolePolicy} policy The policy to append to the existing one.
     */
    appendPolicy(policy: RolePolicy): Promise<void>;
    /**
     * Get the policy for the role.
     * @return {Promise<RolePolicy>} The policy for the role.
     */
    policy(): Promise<RolePolicy>;
    /**
     * The list of all users with access to the role.
     * @example [
     *   "User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f",
     *   "User#5593c25b-52e2-4fb5-b39b-96d41d681d82"
     * ]
     *
     * @param {PageOpts} page Optional pagination options; by default, retrieves all users.
     */
    users(page?: PageOpts): Promise<string[]>;
    /**
     * Add an existing user to an existing role.
     *
     * @param {string} userId The user-id of the user to add to the role.
     */
    addUser(userId: string): Promise<void>;
    /**
     * Remove an existing user from an existing role.
     *
     * @param {string} userId The user-id of the user to remove from the role.
     */
    removeUser(userId: string): Promise<void>;
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
    keys(page?: PageOpts): Promise<KeyWithPolicies[]>;
    /**
     * Add a list of existing keys to an existing role.
     *
     * @param {Key[]} keys The list of keys to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to each key.
     */
    addKeys(keys: Key[], policy?: KeyPolicy): Promise<void>;
    /**
     * Add an existing key to an existing role.
     *
     * @param {Key} key The key to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to the key.
     */
    addKey(key: Key, policy?: KeyPolicy): Promise<void>;
    /**
     * Remove an existing key from an existing role.
     *
     * @param {Key} key The key to remove from the role.
     */
    removeKey(key: Key): Promise<void>;
    /**
     * Create a new session for this role.
     * @param {string} purpose Descriptive purpose.
     * @param {SessionLifetime} lifetimes Optional session lifetimes.
     * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
     * @return {Promise<SessionData>} New session.
     */
    createSession(purpose: string, lifetimes?: SessionLifetime, scopes?: string[]): Promise<SessionData>;
    /**
     * List all signer sessions for this role. Returned objects can be used to
     * revoke individual sessions, but they cannot be used for authentication.
     *
     * @param {PageOpts} page Optional pagination options; by default, retrieves all sessions.
     * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
     */
    sessions(page?: PageOpts): Promise<SignerSessionInfo[]>;
    /**
     * Constructor.
     * @param {ApiClient} apiClient The API client to use.
     * @param {RoleInfo} data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient: ApiClient, data: RoleInfo);
    /**
     * Update the role.
     *
     * @param {UpdateRoleRequest} request The JSON request to send to the API server.
     * @return {Promise<RoleInfo>} The updated role information.
     */
    private update;
    /**
     * Fetches the role information.
     *
     * @return {RoleInfo} The role information.
     * @internal
     */
    private fetch;
}
export {};
