import { OrgInfo } from "./schema_types";
import { CubeSignerClient } from "./client";
import { KeyType, Key } from "./key";
import { Role } from "./role";
import { PageOpts } from "./paginator";

/** Organization id */
export type OrgId = string;

/** Org-wide policy */
export type OrgPolicy =
  | SourceIpAllowlistPolicy
  | OidcAuthSourcesPolicy
  | OriginAllowlistPolicy
  | MaxDailyUnstakePolicy;

/**
 * Provides an allowlist of OIDC Issuers and audiences that are allowed to authenticate into this org.
 * @example {"OidcAuthSources": { "https://accounts.google.com": [ "1234.apps.googleusercontent.com" ]}}
 */
export interface OidcAuthSourcesPolicy {
  OidcAuthSources: Record<string, string[]>;
}

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

/** An organization. */
export class Org {
  readonly #csc: CubeSignerClient;

  /**
   * The ID of the organization.
   * @example Org#124dfe3e-3bbd-487d-80c0-53c55e8ab87a
   */
  readonly #id: string;

  /**
   * @description The org id
   * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   */
  get id(): OrgId {
    return this.#id;
  }

  /** Human-readable name for the org */
  async name(): Promise<string | undefined> {
    const data = await this.#csc.orgGet();
    return data.name ?? undefined;
  }

  /**
   * Set the human-readable name for the org.
   * @param {string} name The new human-readable name for the org (must be alphanumeric).
   * @example my_org_name
   */
  async setName(name: string) {
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) {
      throw new Error("Org name must be alphanumeric and between 3 and 30 characters");
    }
    await this.#csc.orgUpdate({ name });
  }

  /** Is the org enabled? */
  async enabled(): Promise<boolean> {
    const data = await this.#csc.orgGet();
    return data.enabled;
  }

  /** Enable the org. */
  async enable() {
    await this.#csc.orgUpdate({ enabled: true });
  }

  /** Disable the org. */
  async disable() {
    await this.#csc.orgUpdate({ enabled: false });
  }

  /** Get the policy for the org. */
  async policy(): Promise<OrgPolicy[]> {
    const data = await this.#csc.orgGet();
    return (data.policy ?? []) as unknown as OrgPolicy[];
  }

  /** Set the policy for the org.
   * @param {OrgPolicy[]} policy The new policy for the org.
   * */
  async setPolicy(policy: OrgPolicy[]) {
    const p = policy as unknown as Record<string, never>[];
    await this.#csc.orgUpdate({ policy: p });
  }

  /**
   * Create a new signing key.
   * @param {KeyType} type The type of key to create.
   * @param {string?} ownerId The owner of the key. Defaults to the session's user.
   * @return {Key[]} The new keys.
   */
  async createKey(type: KeyType, ownerId?: string): Promise<Key> {
    return (await this.createKeys(type, 1, ownerId))[0];
  }

  /**
   * Create new signing keys.
   * @param {KeyType} type The type of key to create.
   * @param {number} count The number of keys to create.
   * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
   * @return {Key[]} The new keys.
   */
  async createKeys(type: KeyType, count: number, ownerId?: string): Promise<Key[]> {
    const keys = await this.#csc.keysCreate(type, count, ownerId);
    return keys.map((k) => new Key(this.#csc, k));
  }

  /**
   * Derive a key of the given type using the given derivation path and mnemonic.
   * The owner of the derived key will be the owner of the mnemonic.
   *
   * @param {KeyType} type Type of key to derive from the mnemonic.
   * @param {string} derivationPath Mnemonic derivation path used to generate new key.
   * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
   *
   * @return {Key} newly derived key.
   */
  async deriveKey(type: KeyType, derivationPath: string, mnemonicId: string): Promise<Key> {
    return (await this.deriveKeys(type, [derivationPath], mnemonicId))[0];
  }

  /**
   * Derive a set of keys of the given type using the given derivation paths and mnemonic.
   *
   * The owner of the derived keys will be the owner of the mnemonic.
   *
   * @param {KeyType} type Type of key to derive from the mnemonic.
   * @param {string[]} derivationPaths Mnemonic derivation paths used to generate new key.
   * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
   *
   * @return {Key[]} newly derived keys.
   */
  async deriveKeys(type: KeyType, derivationPaths: string[], mnemonicId: string): Promise<Key[]> {
    const keys = await this.#csc.keysDerive(type, derivationPaths, mnemonicId);
    return keys.map((k) => new Key(this.#csc, k));
  }

  /** Create a new user in the organization and sends an invitation to that user. */
  get createUser() {
    return this.#csc.orgUserInvite.bind(this.#csc);
  }

  /** Create a new OIDC user */
  get createOidcUser() {
    return this.#csc.orgUserCreateOidc.bind(this.#csc);
  }

  /** Delete an existing OIDC user */
  get deleteOidcUser() {
    return this.#csc.orgUserDeleteOidc.bind(this.#csc);
  }

  /** Checks if a given proof of OIDC authentication is valid. */
  get verifyIdentity() {
    return this.#csc.identityVerify.bind(this.#csc);
  }

  /**  List users in the organization */
  get users() {
    return this.#csc.orgUsersList.bind(this.#csc);
  }

  /**
   * Get a key by id.
   * @param {string} keyId The id of the key to get.
   * @return {Key} The key.
   */
  async getKey(keyId: string): Promise<Key> {
    const keyInfo = await this.#csc.keyGet(keyId);
    return new Key(this.#csc, keyInfo);
  }

  /**
   * Get all keys in the org.
   * @param {KeyType?} type Optional key type to filter list for.
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Key} The key.
   */
  async keys(type?: KeyType, page?: PageOpts): Promise<Key[]> {
    const paginator = this.#csc.keysList(type, page);
    const keys = await paginator.fetch();
    return keys.map((k) => new Key(this.#csc, k));
  }

  /**
   * Create a new role.
   *
   * @param {string?} name The name of the role.
   * @return {Role} The new role.
   */
  async createRole(name?: string): Promise<Role> {
    const roleId = await this.#csc.roleCreate(name);
    const roleInfo = await this.#csc.roleGet(roleId);
    return new Role(this.#csc, roleInfo);
  }

  /**
   * Get a role by id or name.
   *
   * @param {string} roleId The id or name of the role to get.
   * @return {Role} The role.
   */
  async getRole(roleId: string): Promise<Role> {
    const roleInfo = await this.#csc.roleGet(roleId);
    return new Role(this.#csc, roleInfo);
  }

  /**
   * List all roles in the org.
   *
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Role[]} The roles.
   */
  async listRoles(page?: PageOpts): Promise<Role[]> {
    const roles = await this.#csc.rolesList(page).fetch();
    return roles.map((r) => new Role(this.#csc, r));
  }

  /** List all users in the org. */
  get listUsers() {
    return this.#csc.orgUsersList.bind(this.#csc);
  }

  /**
   * Get a pending MFA request by its id.
   *
   * @deprecated Use {@link getMfaInfo()} instead.
   */
  get mfaGet() {
    return this.#csc.mfaGet.bind(this.#csc);
  }

  /**
   * Approve a pending MFA request.
   *
   * @deprecated Use {@link approveMfaRequest()} instead.
   */
  get mfaApprove() {
    return this.#csc.mfaApprove.bind(this.#csc);
  }

  /** Get a pending MFA request by its id. */
  get getMfaInfo() {
    return this.#csc.mfaGet.bind(this.#csc);
  }

  /** List pending MFA requests accessible to the current user. */
  get listMfaInfos() {
    return this.#csc.mfaList.bind(this.#csc);
  }

  /** Approve a pending MFA request. */
  get approveMfaRequest() {
    return this.#csc.mfaApprove.bind(this.#csc);
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Create a new org.
   * @param {CubeSignerClient} csc The CubeSigner instance.
   * @param {OrgInfo} data The JSON response from the API server.
   * @internal
   */
  constructor(csc: CubeSignerClient, data: OrgInfo) {
    this.#csc = csc.withOrg(data.org_id);
    this.#id = data.org_id;
  }
}
