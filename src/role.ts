import {
  CubeSigner,
  Key,
  MfaType,
  SignerSession,
  SignerSessionInfo,
  SignerSessionLifetime,
  SignerSessionManager,
  SignerSessionStorage,
} from ".";
import { components, paths } from "./client";
import { assertOk } from "./util";

type UpdateRoleRequest =
  paths["/v0/org/{org_id}/keys/{key_id}"]["patch"]["requestBody"]["content"]["application/json"];
type KeyWithPoliciesInfo = components["schemas"]["KeyWithPolicies"];
export type RoleInfo = components["schemas"]["RoleInfo"];

/** Restrict transaction receiver.
 * @example { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
 * */
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

/** Restrict transactions to calls to deposit contract with fixed validator (pubkey):
 *  @example { TxDeposit: { kind: DespositContract.Canonical, validator: { pubkey: "8879...8"} }}
 * */
export type TxDepositPubkey = { TxDeposit: { kind: DepositContract; pubkey: string } };

/** Restrict transactions to calls to deposit contract with any validator key in a role:
 * @example { TxDeposit: { kind: DespositContract.Canonical, validator: { role_id: "Role#c63...af"} }}
 * */
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

/** MFA policy
 * @example {
 * {
 *   count: 1,
 *   num_auth_factors: 1,
 *   allowed_mfa_types: [ "Totp" ],
 *   allowed_approvers: [ "User#123" ],
 * }
 * */
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

/** Key policy
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
 * */
export type KeyPolicy = (TxReceiver | TxDeposit | RequireMfa | AllowRawBlobSigning)[];

/** A key guarded by a policy. */
export class KeyWithPolicies {
  readonly #cs: CubeSigner;
  readonly #orgId: string;
  readonly keyId: string;
  readonly policy?: KeyPolicy;

  /** @return {Promise<Key>} The key */
  async getKey(): Promise<Key> {
    return await Key.getKey(this.#cs, this.#orgId, this.keyId);
  }

  /** Constructor.
   * @param {CubeSigner} cs The CubeSigner instance to use for signing.
   * @param {string} orgId The id of the organization to which the key belongs.
   * @param {KeyWithPoliciesInfo} keyWithPolicies The key and its policies
   * @internal
   * */
  constructor(cs: CubeSigner, orgId: string, keyWithPolicies: KeyWithPoliciesInfo) {
    this.#cs = cs;
    this.#orgId = orgId;
    this.keyId = keyWithPolicies.key_id;
    this.policy = keyWithPolicies.policy as unknown as KeyPolicy;
  }
}

/** Roles. */
export class Role {
  readonly #cs: CubeSigner;
  readonly #orgId: string;
  /** Human-readable name for the role */
  public readonly name?: string;

  /**
   * The ID of the role.
   * @example Role#bfe3eccb-731e-430d-b1e5-ac1363e6b06b
   * */
  readonly id: string;

  /** Delete the role. */
  async delete(): Promise<void> {
    await Role.deleteRole(this.#cs, this.#orgId, this.id);
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

  /** The list of users with access to the role.
   * @example [
   *   "User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f",
   *   "User#5593c25b-52e2-4fb5-b39b-96d41d681d82"
   * ]
   * */
  async users(): Promise<string[]> {
    const data = await this.fetch();
    return data.users;
  }

  /** Add a user to the role.
   * Adds an existing user to an existing role.
   * @param {string} userId The user-id of the user to add to the role.
   * */
  async addUser(userId: string) {
    const resp = await (
      await this.#cs.management()
    ).put("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", {
      params: { path: { org_id: this.#orgId, role_id: this.id, user_id: userId } },
      parseAs: "json",
    });
    assertOk(resp, "Failed to add user to role");
  }

  /** The list of keys in the role.
   * @example [
   *    {
   *     id: "Key#bfe3eccb-731e-430d-b1e5-ac1363e6b06b",
   *     policy: { TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }
   *    },
   *  ]
   * */
  async keys(): Promise<KeyWithPolicies[]> {
    const data = await this.fetch();
    return data.keys.map((k) => new KeyWithPolicies(this.#cs, this.#orgId, k));
  }

  /** Add keys to the role.
   * Adds a list of existing keys to an existing role.
   * @param {Key[]} keys The list of keys to add to the role.
   * @param {KeyPolicy?} policy The optional policy to apply to each key.
   * */
  async addKeys(keys: Key[], policy?: KeyPolicy) {
    const resp = await (
      await this.#cs.management()
    ).put("/v0/org/{org_id}/roles/{role_id}/add_keys", {
      params: { path: { org_id: this.#orgId, role_id: this.id } },
      body: {
        key_ids: keys.map((k) => k.id),
        policy: (policy ?? null) as Record<string, never>[] | null,
      },
      parseAs: "json",
    });
    assertOk(resp, "Failed to add keys to role");
  }

  /** Add a key to the role.
   * Adds an existing key to an existing role.
   * @param {Key} key The key to add to the role.
   * @param {KeyPolicy?} policy The optional policy to apply to the key.
   * */
  async addKey(key: Key, policy?: KeyPolicy) {
    return await this.addKeys([key], policy);
  }

  /** Remove key from the role.
   * Removes an existing key from an existing role.
   * @param {Key} key The key to remove from the role.
   * */
  async removeKey(key: Key) {
    const resp = await (
      await this.#cs.management()
    ).del("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", {
      params: { path: { org_id: this.#orgId, role_id: this.id, key_id: key.id } },
      parseAs: "json",
    });
    assertOk(resp, "Failed to remove key from role");
  }

  /**
   * Create a new session for this role.
   * @param {SignerSessionStorage} storage The session storage to use
   * @param {string} purpose Descriptive purpose.
   * @param {SignerSessionLifetime} ttl Optional session lifetimes.
   * @return {Promise<SignerSession>} New signer session.
   */
  async createSession(
    storage: SignerSessionStorage,
    purpose: string,
    ttl?: SignerSessionLifetime,
  ): Promise<SignerSession> {
    const manager = await SignerSessionManager.create(
      this.#cs,
      storage,
      this.#orgId,
      this.id,
      purpose,
      ttl,
    );
    return new SignerSession(manager);
  }

  /**
   * List all signer sessions for this role. Returned objects can be used to
   * revoke individual sessions, but they cannot be used for authentication.
   * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
   */
  async sessions(): Promise<SignerSessionInfo[]> {
    const resp = await (
      await this.#cs.management()
    ).get("/v0/org/{org_id}/roles/{role_id}/tokens", {
      params: { path: { org_id: this.#orgId, role_id: this.id } },
    });
    const data = assertOk(resp);
    return data.tokens.map(
      (t) => new SignerSessionInfo(this.#cs, this.#orgId, this.id, t.hash, t.purpose),
    );
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /** Create a new role.
   * @param {CubeSigner} cs The CubeSigner instance to use for signing.
   * @param {string} orgId The id of the organization to which the role belongs.
   * @param {RoleInfo} data The JSON response from the API server.
   * @internal
   * */
  constructor(cs: CubeSigner, orgId: string, data: RoleInfo) {
    this.#cs = cs;
    this.#orgId = orgId;
    this.id = data.role_id;
    this.name = data.name ?? undefined;
  }

  /** Update the role.
   * @param {UpdateRoleRequest} request The JSON request to send to the API server.
   * */
  private async update(request: UpdateRoleRequest): Promise<void> {
    const resp = await (
      await this.#cs.management()
    ).patch("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: this.#orgId, role_id: this.id } },
      body: request,
      parseAs: "json",
    });
    assertOk(resp);
  }

  /** Create new role.
   * @param {CubeSigner} cs The CubeSigner instance to use for signing.
   * @param {string} orgId The id of the organization to which the role belongs.
   * @param {string?} name The optional name of the role.
   * @return {Role} The new role.
   * @internal
   * */
  static async createRole(cs: CubeSigner, orgId: string, name?: string): Promise<Role> {
    const resp = await (
      await cs.management()
    ).post("/v0/org/{org_id}/roles", {
      params: { path: { org_id: orgId } },
      body: name ? { name } : undefined,
      parseAs: "json",
    });
    const data = assertOk(resp);
    return await Role.getRole(cs, orgId, data.role_id);
  }

  /** Get a role by id.
   * @param {CubeSigner} cs The CubeSigner instance to use for signing.
   * @param {string} orgId The id of the organization to which the role belongs.
   * @param {string} roleId The id of the role to get.
   * @return {Role} The role.
   * @internal
   * */
  static async getRole(cs: CubeSigner, orgId: string, roleId: string): Promise<Role> {
    const resp = await (
      await cs.management()
    ).get("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: orgId, role_id: roleId } },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return new Role(cs, orgId, data);
  }

  /** Fetches the role information.
   * @return {RoleInfo} The role information.
   * @internal
   * */
  private async fetch(): Promise<RoleInfo> {
    const resp = await (
      await this.#cs.management()
    ).get("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: this.#orgId, role_id: this.id } },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data;
  }

  /** Delete role.
   * @param {CubeSigner} cs The CubeSigner instance to use for signing.
   * @param {string} orgId The id of the organization to which the role belongs.
   * @param {string} roleId The id of the role to delete.
   * @internal
   * */
  private static async deleteRole(cs: CubeSigner, orgId: string, roleId: string): Promise<void> {
    const resp = await (
      await cs.management()
    ).del("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: orgId, role_id: roleId } },
      parseAs: "json",
    });
    assertOk(resp);
  }
}
