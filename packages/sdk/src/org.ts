import type {
  KeyType,
  KeyProperties,
  NotificationEndpointConfiguration,
  PageOpts,
  UserInOrgInfo,
  ApiClient,
  OrgInfo,
  MfaId,
} from ".";
import { Key, MfaRequest, Role } from ".";

/** Organization id */
export type OrgId = string;

/** Org-wide policy */
export type OrgPolicy =
  | SourceIpAllowlistPolicy
  | OidcAuthSourcesPolicy
  | OriginAllowlistPolicy
  | MaxDailyUnstakePolicy
  | WebAuthnRelyingPartiesPolicy
  | ExclusiveKeyAccessPolicy;

/**
 * Whether to enforce exclusive access to keys.  Concretely,
 * - if "LimitToKeyOwner" is set, only key owners are permitted to access
 *   their keys for signing: a user session (not a role session) is required
 *   for signing, and adding a key to a role is not permitted.
 * - if "LimitToSingleRole" is set, each key is permitted to be in at most
 *   one role, and signing is only allowed when authenticating using a role session token.
 */
export interface ExclusiveKeyAccessPolicy {
  ExclusiveKeyAccess: "LimitToKeyOwner" | "LimitToSingleRole";
}

/**
 * The set of relying parties to allow for webauthn registration
 * These correspond to domains from which browsers can successfully create credentials.
 */
export interface WebAuthnRelyingPartiesPolicy {
  WebAuthnRelyingParties: { id?: string; name: string }[];
}

/**
 * Provides an allowlist of OIDC Issuers and audiences that are allowed to authenticate into this org.
 * @example {"OidcAuthSources": { "https://accounts.google.com": [ "1234.apps.googleusercontent.com" ]}}
 */
export interface OidcAuthSourcesPolicy {
  OidcAuthSources: Record<string, string[] | IssuerConfig>;
}

/** OIDC issuer configuration */
export interface IssuerConfig {
  /** The set of audiences supported for this issuer */
  auds: string[];

  /** The kinds of user allowed to authenticate with this issuer */
  users: string[];

  /** Optional nickname for this provider */
  nickname?: string;

  /** Whether to make this issuer public */
  public?: boolean;
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

/**
 * Filter to use when listing keys
 */
export interface KeyFilter {
  /** Filter by key type */
  type?: KeyType;
  /** Filter by key owner */
  owner?: string;
  /** Search by key's material id and metadata */
  search?: string;
  /** Pagination options */
  page?: PageOpts;
}

/**
 * An organization.
 *
 * Extends {@link CubeSignerClient} and provides a few org-specific methods on top.
 */
export class Org {
  readonly #apiClient: ApiClient;
  #orgId: OrgId;
  /** The org information */
  #data?: OrgInfo;

  /**
   * @description The org id
   * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   */
  get id(): OrgId {
    return this.#orgId;
  }

  /**
   * Get the cached properties of this org. The cached properties reflect the
   * state of the last fetch or update.
   */
  get cached(): OrgInfo | undefined {
    return this.#data;
  }

  /**
   * Constructor.
   *
   * @param {ApiClient} apiClient The API client to use.
   * @param {string} orgId The id of the org
   */
  constructor(apiClient: ApiClient, orgId: string) {
    this.#apiClient = apiClient;
    this.#orgId = orgId;
  }

  /**
   * Fetch the org information.
   *
   * @return {OrgInfo} The org information.
   */
  async fetch(): Promise<OrgInfo> {
    this.#data = await this.#apiClient.orgGet();
    return this.#data;
  }

  /** Human-readable name for the org */
  async name(): Promise<string | undefined> {
    const data = await this.fetch();
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
    await this.#apiClient.orgUpdate({ name });
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

  /**
   * Set the policy for the org.
   * @param {OrgPolicy[]} policy The new policy for the org.
   */
  async setPolicy(policy: OrgPolicy[]) {
    const p = policy as unknown as Record<string, never>[];
    await this.update({ policy: p });
  }

  /**
   * Set the notification endpoints for the org.
   *
   * @param {NotificationEndpointConfiguration[]} notification_endpoints Endpoints.
   */
  async setNotificationEndpoints(notification_endpoints: NotificationEndpointConfiguration[]) {
    await this.update({
      notification_endpoints,
    });
  }

  /**
   * Create a new signing key.
   * @param {KeyType} type The type of key to create.
   * @param {string?} ownerId The owner of the key. Defaults to the session's user.
   * @param {KeyProperties?} props Additional key properties
   * @return {Key[]} The new keys.
   */
  async createKey(type: KeyType, ownerId?: string, props?: KeyProperties): Promise<Key> {
    const keys = await this.#apiClient.keysCreate(type, 1, ownerId, props);
    return new Key(this.#apiClient, keys[0]);
  }

  /**
   * Create new signing keys.
   * @param {KeyType} type The type of key to create.
   * @param {number} count The number of keys to create.
   * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
   * @return {Key[]} The new keys.
   */
  async createKeys(type: KeyType, count: number, ownerId?: string): Promise<Key[]> {
    const keys = await this.#apiClient.keysCreate(type, count, ownerId);
    return keys.map((k) => new Key(this.#apiClient, k));
  }

  /**
   * Create a new user in the organization and sends an invitation to that user.
   *
   * Same as {@link ApiClient.orgUserInvite}.
   */
  get createUser() {
    return this.#apiClient.orgUserInvite.bind(this.#apiClient);
  }

  /**
   * Delete an existing user.
   *
   * Same as {@link ApiClient.orgUserDelete}.
   */
  get deleteUser() {
    return this.#apiClient.orgUserDelete.bind(this.#apiClient);
  }

  /**
   * Create a new OIDC user.
   *
   * Same as {@link ApiClient.orgUserCreateOidc}.
   */
  get createOidcUser() {
    return this.#apiClient.orgUserCreateOidc.bind(this.#apiClient);
  }

  /**
   * Delete an existing OIDC user.
   *
   * Same as {@link ApiClient.orgUserDeleteOidc}.
   */
  get deleteOidcUser() {
    return this.#apiClient.orgUserDeleteOidc.bind(this.#apiClient);
  }

  /**
   * List all users in the organization.
   *
   * @return {UserInOrgInfo[]} The list of users
   */
  async users(): Promise<UserInOrgInfo[]> {
    return await this.#apiClient.orgUsersList().fetchAll();
  }

  /**
   * List users in the organization (paginated).
   *
   * Same as {@link ApiClient.orgUsersList}
   */
  get usersPaginated() {
    return this.#apiClient.orgUsersList.bind(this.#apiClient);
  }

  /**
   * Get users by id.
   *
   * Same as {@link ApiClient.orgUserGet}
   */
  get getUser() {
    return this.#apiClient.orgUserGet.bind(this.#apiClient);
  }

  /**
   * Enable a user in this org
   * @param {string} userId The user whose membership to enable
   * @return {Promise<UserInOrgInfo>} The updated user's membership
   */
  async enableUser(userId: string): Promise<UserInOrgInfo> {
    return await this.#apiClient.orgUpdateUserMembership(userId, { disabled: false });
  }

  /**
   * Disable a user in this org
   * @param {string} userId The user whose membership to disable
   * @return {Promise<UserInOrgInfo>} The updated user's membership
   */
  async disableUser(userId: string): Promise<UserInOrgInfo> {
    return await this.#apiClient.orgUpdateUserMembership(userId, { disabled: true });
  }

  /**
   * Get the keys in the organization
   * @param {KeyFilter} props Optional filtering properties.
   * @return {Promise<Key[]>} The keys.
   */
  async keys(props?: KeyFilter): Promise<Key[]> {
    const paginator = this.#apiClient.keysList(
      props?.type,
      props?.page,
      props?.owner,
      props?.search,
    );
    const keys = await paginator.fetch();
    return keys.map((k) => new Key(this.#apiClient, k));
  }

  /**
   * Create a new role.
   *
   * @param {string?} name The name of the role.
   * @return {Role} The new role.
   */
  async createRole(name?: string): Promise<Role> {
    const roleId = await this.#apiClient.roleCreate(name);
    const roleInfo = await this.#apiClient.roleGet(roleId);
    return new Role(this.#apiClient, roleInfo);
  }

  /**
   * Get a role by id or name.
   *
   * @param {string} roleId The id or name of the role to get.
   * @return {Role} The role.
   */
  async getRole(roleId: string): Promise<Role> {
    const roleInfo = await this.#apiClient.roleGet(roleId);
    return new Role(this.#apiClient, roleInfo);
  }

  /**
   * Gets all the roles in the org
   * @param {PageOpts} page The paginator options
   * @return {Role[]} The roles
   */
  async roles(page: PageOpts): Promise<Role[]> {
    const roles = await this.#apiClient.rolesList(page).fetch();
    return roles.map((r) => new Role(this.#apiClient, r));
  }

  /**
   * Derive a key of the given type using the given derivation path and mnemonic.
   * The owner of the derived key will be the owner of the mnemonic.
   *
   * @param {KeyType} type Type of key to derive from the mnemonic.
   * @param {string} derivationPath Mnemonic derivation path used to generate new key.
   * @param {string} mnemonicId material_id of mnemonic key used to derive the new key.
   *
   * @return {Key} newly derived key or undefined if it already exists.
   */
  async deriveKey(
    type: KeyType,
    derivationPath: string,
    mnemonicId: string,
  ): Promise<Key | undefined> {
    return (await this.deriveKeys(type, [derivationPath], mnemonicId))[0];
  }

  /**
   * Derive a set of keys of the given type using the given derivation paths and mnemonic.
   *
   * The owner of the derived keys will be the owner of the mnemonic.
   *
   * @param {KeyType} type Type of key to derive from the mnemonic.
   * @param {string[]} derivationPaths Mnemonic derivation paths used to generate new key.
   * @param {string} mnemonicId material_id of mnemonic key used to derive the new key.
   *
   * @return {Key[]} newly derived keys.
   */
  async deriveKeys(type: KeyType, derivationPaths: string[], mnemonicId: string): Promise<Key[]> {
    const keys = await this.#apiClient.keysDerive(type, derivationPaths, mnemonicId);
    return keys.map((k) => new Key(this.#apiClient, k));
  }

  /**
   * Get a key by id.
   *
   * @param {string} keyId The id of the key to get.
   * @return {Key} The key.
   */
  async getKey(keyId: string): Promise<Key> {
    const keyInfo = await this.#apiClient.keyGet(keyId);
    return new Key(this.#apiClient, keyInfo);
  }

  /**
   * Get a key by its material id (e.g., address).
   *
   * @param {KeyType} keyType The key type.
   * @param {string} materialId The material id of the key to get.
   * @return {Key} The key.
   */
  async getKeyByMaterialId(keyType: KeyType, materialId: string): Promise<Key> {
    const keyInfo = await this.#apiClient.keyGetByMaterialId(keyType, materialId);
    return new Key(this.#apiClient, keyInfo);
  }

  /**
   * Obtain a proof of authentication.
   *
   * Same as {@link ApiClient.identityProve}
   */
  get proveIdentity() {
    return this.#apiClient.identityProve.bind(this.#apiClient);
  }

  /**
   * Check if a given proof of OIDC authentication is valid.
   *
   * Same as {@link ApiClient.identityVerify}
   */
  get verifyIdentity() {
    return this.#apiClient.identityVerify.bind(this.#apiClient);
  }

  /**
   * Get a pending MFA request by its id.
   *
   * @param {string} mfaId MFA request ID
   * @return {MfaRequest} The MFA request
   */
  getMfaRequest(mfaId: MfaId): MfaRequest {
    return new MfaRequest(this.#apiClient, mfaId);
  }

  /**
   * List pending MFA requests accessible to the current user.
   *
   * @return {Promise<MfaRequest[]>} The MFA requests.
   */
  async mfaRequests(): Promise<MfaRequest[]> {
    return await this.#apiClient
      .mfaList()
      .then((mfaInfos) => mfaInfos.map((mfaInfo) => new MfaRequest(this.#apiClient, mfaInfo)));
  }

  /**
   * Sign a stake request.
   *
   * Same as {@link ApiClient.signStake}
   */
  get stake() {
    return this.#apiClient.signStake.bind(this.#apiClient);
  }

  /**
   * Create new user session (management and/or signing). The lifetime of
   * the new session is silently truncated to that of the current session.
   *
   * Same as {@link ApiClient.sessionCreate}.
   */
  get createSession() {
    return this.#apiClient.sessionCreate.bind(this.#apiClient);
  }

  /**
   * Create new user session (management and/or signing) whose lifetime potentially
   * extends the lifetime of the current session.  MFA is always required.
   *
   * Same as {@link ApiClient.sessionCreateExtended}.
   */
  get createExtendedSession() {
    return this.#apiClient.sessionCreateExtended.bind(this.#apiClient);
  }

  /**
   * Revoke a session.
   *
   * Same as {@link ApiClient.sessionRevoke}.
   */
  get revokeSession() {
    return this.#apiClient.sessionRevoke.bind(this.#apiClient);
  }

  /**
   * Send a heartbeat / upcheck request.
   *
   * Same as {@link ApiClient.heartbeat}
   */
  get heartbeat() {
    return this.#apiClient.heartbeat.bind(this.#apiClient);
  }

  /**
   * List outstanding user-export requests.
   *
   * Same as {@link ApiClient.userExportList}
   */
  get exports() {
    return this.#apiClient.userExportList.bind(this.#apiClient);
  }

  /**
   * Delete an outstanding user-export request.
   *
   * Same as {@link ApiClient.userExportDelete}
   */
  get deleteExport() {
    return this.#apiClient.userExportDelete.bind(this.#apiClient);
  }

  /**
   * Initiate a user-export request.
   *
   * Same as {@link ApiClient.userExportInit}
   */
  get initExport() {
    return this.#apiClient.userExportInit.bind(this.#apiClient);
  }

  /**
   * Complete a user-export request.
   *
   * Same as {@link ApiClient.userExportComplete}
   */
  get completeExport() {
    return this.#apiClient.userExportComplete.bind(this.#apiClient);
  }

  /**
   * Update the org.
   *
   * Same as {@link ApiClient.orgUpdate}.
   */
  get update() {
    return this.#apiClient.orgUpdate.bind(this.#apiClient);
  }
}
