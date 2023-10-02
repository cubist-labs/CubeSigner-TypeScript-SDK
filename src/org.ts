import { CubeSigner, MfaRequestInfo } from ".";
import { components, paths } from "./client";
import { assertOk } from "./util";
import { KeyType, Key } from "./key";
import { MfaPolicy, Role, RoleInfo } from "./role";

/** Organization id */
export type OrgId = string;

/** Org-wide policy */
export type OrgPolicy = SourceIpAllowlistPolicy | OriginAllowlistPolicy | MaxDailyUnstakePolicy;

/**
 * Only allow requests from the specified origins.
 * @example {"OriginAllowlist": "*"}
 */
export interface OriginAllowlistPolicy {
  OriginAllowlist: string[] | "*";
}

/**
 * Restrict signing to specific source IP addresses.
 * @example {"SourceIpAllowlist": ["10.1.2.3/8", "169.254.17.1/16"]}
 */
export interface SourceIpAllowlistPolicy {
  SourceIpAllowlist: string[];
}

/**
 * Restrict the number of unstakes per day.
 * @example {"MaxDailyUnstake": 5 }
 */
export interface MaxDailyUnstakePolicy {
  MaxDailyUnstake: number;
}

type OrgInfo = components["schemas"]["OrgInfo"];
type UserIdInfo = components["schemas"]["UserIdInfo"];
type UpdateOrgRequest =
  paths["/v0/org/{org_id}"]["patch"]["requestBody"]["content"]["application/json"];
type UpdateOrgResponse =
  paths["/v0/org/{org_id}"]["patch"]["responses"]["200"]["content"]["application/json"];

export type OidcIdentity = components["schemas"]["OIDCIdentity"];
export type MemberRole = components["schemas"]["MemberRole"];

/** Options for a new OIDC user */
export interface CreateOidcUserOptions {
  /** The role of an OIDC user, default is "Alien" */
  memberRole?: MemberRole;
  /** Optional MFA policy to associate with the user account */
  mfaPolicy?: MfaPolicy;
}

/** An organization. */
export class Org {
  readonly #cs: CubeSigner;
  /**
   * The ID of the organization.
   * @example Org#124dfe3e-3bbd-487d-80c0-53c55e8ab87a
   */
  readonly #id: string;

  /**
   * @description The org id
   * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   * */
  get id(): OrgId {
    return this.#id;
  }

  /** Human-readable name for the org */
  async name(): Promise<string | undefined> {
    const data = await this.fetch();
    return data.name ?? undefined;
  }

  /** Set the human-readable name for the org.
   * @param {string} name The new human-readable name for the org (must be alphanumeric).
   * @example my_org_name
   * */
  async setName(name: string) {
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) {
      throw new Error("Org name must be alphanumeric and between 3 and 30 characters");
    }
    await this.update({ name });
  }

  /** Is the org enabled? */
  async enabled(): Promise<boolean> {
    const data = await this.fetch();
    return data.enabled;
  }

  /** Enable the org. */
  async enable() {
    await this.update({ enabled: true });
  }

  /** Disable the org. */
  async disable() {
    await this.update({ enabled: false });
  }

  /** Get the policy for the org. */
  async policy(): Promise<OrgPolicy[]> {
    const data = await this.fetch();
    return (data.policy ?? []) as unknown as OrgPolicy[];
  }

  /** Set the policy for the org.
   * @param {OrgPolicy[]} policy The new policy for the org.
   * */
  async setPolicy(policy: OrgPolicy[]) {
    const p = policy as unknown as Record<string, never>[];
    await this.update({ policy: p });
  }

  /** Create a new signing key.
   * @param {KeyType} type The type of key to create.
   * @param {string?} ownerId The owner of the key. Defaults to the session's user.
   * @return {Key[]} The new keys.
   * */
  async createKey(type: KeyType, ownerId?: string): Promise<Key> {
    return (await Key.createKeys(this.#cs, this.id, type, 1, ownerId))[0];
  }

  /** Create new signing keys.
   * @param {KeyType} type The type of key to create.
   * @param {nummber} count The number of keys to create.
   * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
   * @return {Key[]} The new keys.
   * */
  async createKeys(type: KeyType, count: number, ownerId?: string): Promise<Key[]> {
    return Key.createKeys(this.#cs, this.id, type, count, ownerId);
  }

  /**
   * Derives a key of the given type using the given derivation path and mnemonic.
   *
   * @param {KeyType} type Type of key to derive from the mnemonic.
   * @param {string} derivationPath Mnemonic derivation path used to generate new key.
   * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
   * @param {string} ownerId optional owner of the derived key.
   *
   * @return {Key} newly derived key.
   */
  async deriveKey(
    type: KeyType,
    derivationPath: string,
    mnemonicId: string,
    ownerId?: string,
  ): Promise<Key> {
    return (
      await Key.deriveKeys(this.#cs, this.id, type, [derivationPath], mnemonicId, ownerId)
    )[0];
  }

  /**
   * Derives a set of keys of the given type using the given derivation paths and mnemonic.
   *
   * @param {KeyType} type Type of key to derive from the mnemonic.
   * @param {string[]} derivationPaths Mnemonic derivation paths used to generate new key.
   * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
   * @param {string} ownerId optional owner of the derived key.
   *
   * @return {Key[]} newly derived keys.
   */
  async deriveKeys(
    type: KeyType,
    derivationPaths: string[],
    mnemonicId: string,
    ownerId?: string,
  ): Promise<Key[]> {
    return await Key.deriveKeys(this.#cs, this.#id, type, derivationPaths, mnemonicId, ownerId);
  }
  /**
   * Create a new user in the organization and sends an invitation to that user
   * @param {string} email Email of the user
   * @param {string} name The full name of the user
   */
  async createUser(email: string, name: string): Promise<void> {
    const resp = await (
      await this.#cs.management()
    ).post("/v0/org/{org_id}/invite", {
      params: { path: { org_id: this.id } },
      body: {
        email,
        name,
        skip_email: false,
      },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /**
   * Create a new OIDC user
   * @param {OidcIdentity} identity The identity of the OIDC user
   * @param {string} email Email of the OIDC user
   * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
   * @return {string} User id of the new user
   */
  async createOidcUser(
    identity: OidcIdentity,
    email: string,
    opts: CreateOidcUserOptions = {},
  ): Promise<string> {
    const resp = await (
      await this.#cs.management()
    ).post("/v0/org/{org_id}/users", {
      params: { path: { org_id: this.id } },
      body: {
        identity,
        role: opts.memberRole ?? "Alien",
        email: email,
        mfa_policy: opts.mfaPolicy ?? null,
      },
      parseAs: "json",
    });
    return assertOk(resp).user_id;
  }

  /**
   * Delete an existing OIDC user
   * @param {OidcIdentity} identity The identity of the OIDC user
   */
  async deleteOidcUser(identity: OidcIdentity) {
    const resp = await (
      await this.#cs.management()
    ).del("/v0/org/{org_id}/users/oidc", {
      params: { path: { org_id: this.id } },
      body: identity,
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * List users in the organization
   * @return {UserIdInfo[]} List of users
   */
  async users(): Promise<UserIdInfo[]> {
    const resp = await (
      await this.#cs.management()
    ).get("/v0/org/{org_id}/users", {
      params: { path: { org_id: this.id } },
      parseAs: "json",
    });
    return assertOk(resp).users;
  }

  /** Get a key by id.
   * @param {string} keyId The id of the key to get.
   * @return {Key} The key.
   * */
  async getKey(keyId: string): Promise<Key> {
    return await Key.getKey(this.#cs, this.id, keyId);
  }

  /** Get all keys in the org.
   * @param {KeyType?} type Optional key type to filter list for.
   * @return {Key} The key.
   * */
  async keys(type?: KeyType): Promise<Key[]> {
    const resp = await (
      await this.#cs.management()
    ).get("/v0/org/{org_id}/keys", {
      params: {
        path: { org_id: this.id },
        query: type ? { key_type: type } : undefined,
      },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data.keys.map((k) => new Key(this.#cs, this.id, k));
  }

  /** Create a new role.
   * @param {string?} name The name of the role.
   * @return {Role} The new role.
   * */
  async createRole(name?: string): Promise<Role> {
    return Role.createRole(this.#cs, this.id, name);
  }

  /** Get a role by id or name.
   * @param {string} roleId The id or name of the role to get.
   * @return {Role} The role.
   * */
  async getRole(roleId: string): Promise<Role> {
    return Role.getRole(this.#cs, this.id, roleId);
  }

  /** List all roles in the org.
   * @return {Role[]} The roles.
   * */
  async listRoles(): Promise<Role[]> {
    return Org.roles(this.#cs, this.id);
  }

  /** List all users in the org.
   * @return {User[]} The users.
   * */
  async listUsers(): Promise<UserIdInfo[]> {
    return Org.users(this.#cs, this.id);
  }

  /**
   * Get a pending MFA request by its id.
   * @param {string} mfaId The id of the MFA request.
   * @return {Promise<MfaRequestInfo>} The MFA request.
   *
   * @deprecated Use {@link getMfaInfo()} instead.
   */
  async mfaGet(mfaId: string): Promise<MfaRequestInfo> {
    return await this.getMfaInfo(mfaId);
  }

  /**
   * Approve a pending MFA request.
   *
   * @param {string} mfaId The id of the MFA request.
   * @return {Promise<MfaRequestInfo>} The MFA request.
   *
   * @deprecated Use {@link approveMfaRequest()} instead.
   */
  async mfaApprove(mfaId: string): Promise<MfaRequestInfo> {
    return await this.approveMfaRequest(mfaId);
  }

  /**
   * Get a pending MFA request by its id.
   * @param {string} mfaId The id of the MFA request.
   * @return {Promise<MfaRequestInfo>} The MFA request.
   */
  async getMfaInfo(mfaId: string): Promise<MfaRequestInfo> {
    const resp = await (
      await this.#cs.management()
    ).get("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: this.#id, mfa_id: mfaId } },
    });
    return assertOk(resp);
  }

  /**
   * Approve a pending MFA request.
   *
   * @param {string} mfaId The id of the MFA request.
   * @return {Promise<MfaRequestInfo>} The MFA request.
   */
  async approveMfaRequest(mfaId: string): Promise<MfaRequestInfo> {
    return Org.mfaApprove(this.#cs, this.#id, mfaId);
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /** Create a new org.
   * @param {CubeSigner} cs The CubeSigner instance.
   * @param {OrgInfo} data The JSON response from the API server.
   * @internal
   * */
  constructor(cs: CubeSigner, data: OrgInfo) {
    this.#cs = cs;
    this.#id = data.org_id;
  }

  /**
   * Approve a pending MFA request.
   *
   * @param {CubeSigner} cs The CubeSigner instance to use for requests
   * @param {string} orgId The org id of the MFA request
   * @param {string} mfaId The id of the MFA request
   * @return {Promise<MfaRequestInfo>} The result of the MFA request
   */
  static async mfaApprove(cs: CubeSigner, orgId: string, mfaId: string): Promise<MfaRequestInfo> {
    const resp = await (
      await cs.management()
    ).patch("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: orgId, mfa_id: mfaId } },
    });
    return assertOk(resp);
  }

  /** Fetch org info.
   * @return {OrgInfo} The org info.
   * */
  private async fetch(): Promise<OrgInfo> {
    const resp = await (
      await this.#cs.management()
    ).get("/v0/org/{org_id}", {
      params: { path: { org_id: this.id } },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data;
  }

  /** Update the org.
   * @param {UpdateOrgRequest} request The JSON request to send to the API server.
   * @return {UpdateOrgResponse} The JSON response from the API server.
   * */
  private async update(request: UpdateOrgRequest): Promise<UpdateOrgResponse> {
    const resp = await (
      await this.#cs.management()
    ).patch("/v0/org/{org_id}", {
      params: { path: { org_id: this.id } },
      body: request,
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /** List roles.
   * @param {CubeSigner} cs The CubeSigner instance to use for signing.
   * @param {string} orgId The id of the organization to which the role belongs.
   * @return {Role[]} Org roles.
   * @internal
   * */
  private static async roles(cs: CubeSigner, orgId: string): Promise<Role[]> {
    const resp = await (
      await cs.management()
    ).get("/v0/org/{org_id}/roles", {
      params: { path: { org_id: orgId } },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data.roles.map((r: RoleInfo) => new Role(cs, orgId, r));
  }

  /** List users.
   * @param {CubeSigner} cs The CubeSigner instance to use for signing.
   * @param {string} orgId The id of the organization to which the role belongs.
   * @return {User[]} Org users.
   * @internal
   * */
  private static async users(cs: CubeSigner, orgId: string): Promise<UserIdInfo[]> {
    const resp = await (
      await cs.management()
    ).get("/v0/org/{org_id}/users", {
      params: { path: { org_id: orgId } },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data.users;
  }
}
