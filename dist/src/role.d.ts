import { Key, KeyWithPoliciesInfo, MfaType, PageOpts, RoleInfo, SignerSession, SignerSessionInfo, SignerSessionLifetime, SignerSessionStorage } from ".";
import { CubeSignerClient } from "./client";
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
export declare class KeyWithPolicies {
    #private;
    readonly keyId: string;
    readonly policy?: KeyPolicy;
    /** @return {Promise<Key>} The key */
    getKey(): Promise<Key>;
    /**
     * Constructor.
     * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
     * @param {KeyWithPoliciesInfo} keyWithPolicies The key and its policies
     * @internal
     */
    constructor(csc: CubeSignerClient, keyWithPolicies: KeyWithPoliciesInfo);
}
/** Roles. */
export declare class Role {
    #private;
    /** Human-readable name for the role */
    readonly name?: string;
    /**
     * The ID of the role.
     * @example Role#bfe3eccb-731e-430d-b1e5-ac1363e6b06b
     */
    readonly id: string;
    /** Delete the role. */
    delete(): Promise<void>;
    /** Is the role enabled? */
    enabled(): Promise<boolean>;
    /** Enable the role. */
    enable(): Promise<void>;
    /** Disable the role. */
    disable(): Promise<void>;
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
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {string} purpose Descriptive purpose.
     * @param {SignerSessionLifetime} lifetimes Optional session lifetimes.
     * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
     * @return {Promise<SignerSession>} New signer session.
     */
    createSession(storage: SignerSessionStorage, purpose: string, lifetimes?: SignerSessionLifetime, scopes?: string[]): Promise<SignerSession>;
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
     * @param {CubeSignerClient} csc The CubeSigner instance to use for signing.
     * @param {RoleInfo} data The JSON response from the API server.
     * @internal
     */
    constructor(csc: CubeSignerClient, data: RoleInfo);
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
