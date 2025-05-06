import type {
  KeyType,
  KeyProperties,
  NotificationEndpointConfiguration,
  PageOpts,
  UserInOrgInfo,
  ApiClient,
  OrgInfo,
  MfaId,
  ImportKeyRequest,
  KeyPolicy,
  QueryMetricsResponse,
  OrgMetricName,
  QueryMetricsRequest,
  KeyTypeAndDerivationPath,
  JsonValue,
  EditPolicy,
  AddressMap,
  CreateOrgRequest,
} from ".";
import { Key, MfaRequest, Role } from ".";
import { Contact } from "./contact";

/** Options pased to createKey and deriveKey */
export type CreateKeyProperties = Omit<KeyProperties, "policy"> & {
  /**
   * Policies to apply to the new key.
   *
   * This type makes it possible to assign values like
   * `[AllowEip191SigningPolicy]`, but remains backwards
   * compatible with prior versions of the SDK, in which
   * this property had type `Record<string, never>[] | null`.
   */
  policy?: KeyPolicy | unknown[] | null;
};

/** Options passed to importKey and deriveKey */
export type ImportDeriveKeyProperties = CreateKeyProperties & {
  /**
   * When true, returns a 'Key' object for both new and existing keys.
   */
  idempotent?: boolean;
};

/** Options passed to deriveMultipleKeyTypes */
export type DeriveMultipleKeyTypesProperties = ImportDeriveKeyProperties & {
  /**
   * The material_id of the mnemonic used to derive new keys.
   *
   * If this argument is undefined or null, a new mnemonic is first created
   * and any other specified properties are applied to it (in addition to
   * being applied to the specified keys).
   *
   * The newly created mnemonic-id can be retrieved from the `derivation_info`
   * property of the `KeyInfo` value for a resulting key.
   */
  mnemonic_id?: string;
};

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
 *
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
 *
 * @example {"OriginAllowlist": "*"}
 */
export interface OriginAllowlistPolicy {
  OriginAllowlist: string[] | "*";
}

/**
 * Restrict signing to specific source IP addresses.
 *
 * @example {"SourceIpAllowlist": ["10.1.2.3/8", "169.254.17.1/16"]}
 */
export interface SourceIpAllowlistPolicy {
  SourceIpAllowlist: string[];
}

/**
 * Restrict the number of unstakes per day.
 *
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
   * @returns The org id
   * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   */
  get id(): OrgId {
    return this.#orgId;
  }

  /**
   * @returns The cached properties of this org. The cached properties reflect the
   * state of the last fetch or update.
   */
  get cached(): OrgInfo | undefined {
    return this.#data;
  }

  /**
   * Constructor.
   *
   * @param apiClient The API client to use.
   * @param orgId The id of the org
   */
  constructor(apiClient: ApiClient, orgId: string) {
    this.#orgId = orgId;
    this.#apiClient = orgId === apiClient.orgId ? apiClient : apiClient.withTargetOrg(orgId);
  }

  /**
   * Create a new organization. The new org is a child of the
   * current org and inherits its key-export policy. The new org
   * is created with one owner, the caller of this API.
   *
   * @param nameOrRequest The name of the new org or the properties of the new org.
   * @returns Information about the newly created org.
   */
  async createOrg(nameOrRequest: string | CreateOrgRequest): Promise<OrgInfo> {
    const req = typeof nameOrRequest === "string" ? { name: nameOrRequest } : nameOrRequest;
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(req.name)) {
      throw new Error("Org name must be alphanumeric and between 3 and 30 characters");
    }
    return await this.#apiClient.orgCreateOrg(req);
  }

  /**
   * Query org metrics.
   *
   * @param metricName The metric name.
   * @param startTime The start date in seconds since unix epoch.
   * @param opt Other optional arguments
   * @param opt.end_time The end date in seconds since unix epoch. If omitted, defaults to 'now'.
   * @param opt.period The granularity, in seconds, of the returned data points.
   *   This value is automatically rounded up to a multiple of 3600 (i.e., 1 hour).
   *   If omitted, defaults to the duration between the start and the end date.
   *   Must be no less than 1 hour, i.e., 3600 seconds. Additionally, this period must not
   *   divide the `endTime - startTime` period into more than 100 data points.
   * @param pageOpts Pagination options.
   * @returns Metric values (data points) for the requested periods.
   */
  async queryMetrics(
    metricName: OrgMetricName,
    startTime: EpochTimeStamp,
    opt?: Omit<QueryMetricsRequest, "metric_name" | "start_time">,
    pageOpts?: PageOpts,
  ): Promise<QueryMetricsResponse> {
    const req: QueryMetricsRequest = {
      metric_name: metricName,
      start_time: startTime,
      ...opt,
    };
    return await this.#apiClient.orgQueryMetrics(req, pageOpts).fetchAll();
  }

  /**
   * Fetch the org information.
   *
   * @returns The org information.
   */
  async fetch(): Promise<OrgInfo> {
    this.#data = await this.#apiClient.orgGet();
    return this.#data;
  }

  /** @returns The human-readable name for the org */
  async name(): Promise<string | undefined> {
    const data = await this.fetch();
    return data.name ?? undefined;
  }

  /** @returns Whether the org is enabled */
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

  /** @returns the policy for the org. */
  async policy(): Promise<OrgPolicy[]> {
    const data = await this.fetch();
    return (data.policy ?? []) as unknown as OrgPolicy[];
  }

  /**
   * Set the policy for the org.
   *
   * @param policy The new policy for the org.
   */
  async setPolicy(policy: OrgPolicy[]) {
    const p = policy as unknown as Record<string, never>[];
    await this.update({ policy: p });
  }

  /**
   * Set the notification endpoints for the org.
   *
   * @param notification_endpoints Endpoints.
   */
  async setNotificationEndpoints(notification_endpoints: NotificationEndpointConfiguration[]) {
    await this.update({
      notification_endpoints,
    });
  }

  /**
   * Create a new signing key.
   *
   * @param type The type of key to create.
   * @param ownerId The owner of the key. Defaults to the session's user.
   * @param props Additional properties to set on the new key.
   * @returns The new keys.
   */
  async createKey(type: KeyType, ownerId?: string, props?: CreateKeyProperties): Promise<Key> {
    const keys = await this.#apiClient.keysCreate(type, 1, ownerId, props);
    return new Key(this.#apiClient, keys[0]);
  }

  /**
   * Create new signing keys.
   *
   * @param type The type of key to create.
   * @param count The number of keys to create.
   * @param ownerId The owner of the keys. Defaults to the session's user.
   * @param props Additional properties to set on the new keys.
   * @returns The new keys.
   */
  async createKeys(
    type: KeyType,
    count: number,
    ownerId?: string,
    props?: CreateKeyProperties,
  ): Promise<Key[]> {
    const keys = await this.#apiClient.keysCreate(type, count, ownerId, props);
    return keys.map((k) => new Key(this.#apiClient, k));
  }

  /**
   * Create a new (first-party) user in the organization and sends an invitation to that user.
   *
   * Same as {@link ApiClient.orgUserInvite}, see its documentation for more information.
   *
   * @returns A function that invites a user
   */
  get createUser() {
    return this.#apiClient.orgUserInvite.bind(this.#apiClient);
  }

  /**
   * Delete an existing user.
   *
   * Same as {@link ApiClient.orgUserDelete}, see its documentation for more information.
   *
   * @returns A function that deletes a user
   */
  get deleteUser() {
    return this.#apiClient.orgUserDelete.bind(this.#apiClient);
  }

  /**
   * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
   *
   * Same as {@link ApiClient.orgUserCreateOidc}, see its documentation for more information.
   *
   * @returns A function that creates an OIDC user, resolving to the new user's ID
   */
  get createOidcUser() {
    return this.#apiClient.orgUserCreateOidc.bind(this.#apiClient);
  }

  /**
   * Delete an existing OIDC user.
   *
   * Same as {@link ApiClient.orgUserDeleteOidc}, see its documentation for more information.
   *
   * @returns A function that deletes an OIDC user
   */
  get deleteOidcUser() {
    return this.#apiClient.orgUserDeleteOidc.bind(this.#apiClient);
  }

  /**
   * List all users in the organization.
   *
   * @returns The list of users
   */
  async users(): Promise<UserInOrgInfo[]> {
    return await this.#apiClient.orgUsersList().fetchAll();
  }

  /**
   * List users in the organization (paginated).
   *
   * Same as {@link ApiClient.orgUsersList}, see its documentation for more information.
   *
   * @returns A function that returns a paginated list of users
   */
  get usersPaginated() {
    return this.#apiClient.orgUsersList.bind(this.#apiClient);
  }

  /**
   * Get user by id.
   *
   * Same as {@link ApiClient.orgUserGet}, see its documentation for more information.
   *
   * @returns A function that resolves to a user's info
   */
  get getUser() {
    return this.#apiClient.orgUserGet.bind(this.#apiClient);
  }

  /**
   * Enable a user in this org
   *
   * @param userId The user whose membership to enable
   * @returns The updated user's membership
   */
  async enableUser(userId: string): Promise<UserInOrgInfo> {
    return await this.#apiClient.orgUpdateUserMembership(userId, { disabled: false });
  }

  /**
   * Disable a user in this org
   *
   * @param userId The user whose membership to disable
   * @returns The updated user's membership
   */
  async disableUser(userId: string): Promise<UserInOrgInfo> {
    return await this.#apiClient.orgUpdateUserMembership(userId, { disabled: true });
  }

  /**
   * Get the accessible keys in the organization
   *
   * @param props Optional filtering properties.
   * @returns The keys.
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
   * @param name The name of the role.
   * @returns The new role.
   */
  async createRole(name?: string): Promise<Role> {
    const roleId = await this.#apiClient.roleCreate(name);
    const roleInfo = await this.#apiClient.roleGet(roleId);
    return new Role(this.#apiClient, roleInfo);
  }

  /**
   * Get a role by id or name.
   *
   * @param roleId The id or name of the role to get.
   * @returns The role.
   */
  async getRole(roleId: string): Promise<Role> {
    const roleInfo = await this.#apiClient.roleGet(roleId);
    return new Role(this.#apiClient, roleInfo);
  }

  /**
   * Gets all the roles in the org
   *
   * @param page The paginator options
   * @returns The roles
   */
  async roles(page: PageOpts): Promise<Role[]> {
    const roles = await this.#apiClient.rolesList(page).fetch();
    return roles.map((r) => new Role(this.#apiClient, r));
  }

  /**
   * Derive a key of the given type using the given derivation path and mnemonic.
   * The owner of the derived key will be the owner of the mnemonic.
   *
   * @param type Type of key to derive from the mnemonic.
   * @param derivationPath Mnemonic derivation path used to generate new key.
   * @param mnemonicId material_id of mnemonic key used to derive the new key.
   * @param props Additional properties for derivation.
   *
   * @returns newly derived key or undefined if it already exists.
   */
  async deriveKey(
    type: KeyType,
    derivationPath: string,
    mnemonicId: string,
    props?: ImportDeriveKeyProperties,
  ): Promise<Key | undefined> {
    return (await this.deriveKeys(type, [derivationPath], mnemonicId, props))[0];
  }

  /**
   * Derive a set of keys of the given type using the given derivation paths and mnemonic.
   *
   * The owner of the derived keys will be the owner of the mnemonic.
   *
   * @param type Type of key to derive from the mnemonic.
   * @param derivationPaths Mnemonic derivation paths used to generate new key.
   * @param mnemonicId material_id of mnemonic key used to derive the new key.
   * @param props Additional properties for derivation.
   *
   * @returns newly derived keys.
   */
  async deriveKeys(
    type: KeyType,
    derivationPaths: string[],
    mnemonicId: string,
    props?: ImportDeriveKeyProperties,
  ): Promise<Key[]> {
    const keys = await this.#apiClient.keysDerive(type, derivationPaths, mnemonicId, props);
    return keys.map((k) => new Key(this.#apiClient, k));
  }

  /**
   * Use either a new or existing mnemonic to derive keys of one or more
   * specified types via specified derivation paths.
   *
   * @param keyTypesAndDerivationPaths A list of `KeyTypeAndDerivationPath` objects specifying the keys to be derived
   * @param props Additional options for derivation.
   *
   * @returns The newly derived keys.
   */
  async deriveMultipleKeyTypes(
    keyTypesAndDerivationPaths: KeyTypeAndDerivationPath[],
    props?: DeriveMultipleKeyTypesProperties,
  ): Promise<Key[]> {
    const keys = await this.#apiClient.keysDeriveMulti(keyTypesAndDerivationPaths, props);
    return keys.map((k) => new Key(this.#apiClient, k));
  }

  /**
   * Get a key by id.
   *
   * @param keyId The id of the key to get.
   * @returns The key.
   */
  async getKey(keyId: string): Promise<Key> {
    const keyInfo = await this.#apiClient.keyGet(keyId);
    return new Key(this.#apiClient, keyInfo);
  }

  /**
   * Get a key by its material id (e.g., address).
   *
   * @param keyType The key type.
   * @param materialId The material id of the key to get.
   * @returns The key.
   */
  async getKeyByMaterialId(keyType: KeyType, materialId: string): Promise<Key> {
    const keyInfo = await this.#apiClient.keyGetByMaterialId(keyType, materialId);
    return new Key(this.#apiClient, keyInfo);
  }

  /**
   * Create a contact.
   *
   * @param name The name for the new contact.
   * @param addresses The addresses associated with the contact.
   * @param metadata Metadata associated with the contact. Intended for use as a description.
   * @param editPolicy The edit policy for the contact, determining when and who can edit this contact.
   * @returns The newly-created contact.
   */
  async createContact(
    name: string,
    addresses?: AddressMap,
    metadata?: JsonValue,
    editPolicy?: EditPolicy,
  ): Promise<Contact> {
    const contactInfo = await this.#apiClient.contactCreate(name, addresses, metadata, editPolicy);

    return new Contact(this.#apiClient, contactInfo);
  }

  /**
   * Get a contact by its id.
   *
   * @param contactId The id of the contact to get.
   * @returns The contact.
   */
  async getContact(contactId: string): Promise<Contact> {
    const contactInfo = await this.#apiClient.contactGet(contactId);

    return new Contact(this.#apiClient, contactInfo);
  }

  /**
   * Get all contacts in the organization.
   *
   * @returns All contacts.
   */
  async contacts(): Promise<Contact[]> {
    const paginator = this.#apiClient.contactsList();
    const contacts = await paginator.fetch();

    return contacts.map((c) => new Contact(this.#apiClient, c));
  }

  /**
   * Obtain a proof of authentication.
   *
   * Same as {@link ApiClient.identityProve}, see its documentation for more information.
   *
   * @returns A function that resolves to an identity proof
   */
  get proveIdentity() {
    return this.#apiClient.identityProve.bind(this.#apiClient);
  }

  /**
   * Check if a given proof of OIDC authentication is valid.
   *
   * Same as {@link ApiClient.identityVerify}, see its documentation for more information.
   *
   * @returns A function that verifies a proof of identity, throwing if invalid
   */
  get verifyIdentity() {
    return this.#apiClient.identityVerify.bind(this.#apiClient);
  }

  /**
   * Get a pending MFA request by its id.
   *
   * @param mfaId MFA request ID
   * @returns The MFA request
   */
  getMfaRequest(mfaId: MfaId): MfaRequest {
    return new MfaRequest(this.#apiClient, mfaId);
  }

  /**
   * List pending MFA requests accessible to the current user.
   *
   * @returns The MFA requests.
   */
  async mfaRequests(): Promise<MfaRequest[]> {
    return await this.#apiClient
      .mfaList()
      .then((mfaInfos) => mfaInfos.map((mfaInfo) => new MfaRequest(this.#apiClient, mfaInfo)));
  }

  /**
   * Sign an Eth2/Beacon-chain deposit (or staking) message.
   *
   * Same as {@link ApiClient.signStake}, see its documentation for more information.
   *
   * @returns A function that resolves to a stake response.
   */
  get stake() {
    return this.#apiClient.signStake.bind(this.#apiClient);
  }

  /**
   * Create new user session (management and/or signing). The lifetime of
   * the new session is silently truncated to that of the current session.
   *
   * Same as {@link ApiClient.sessionCreate}, see its documentation for more information.
   *
   * @returns A function that resolves to new signer session info.
   */
  get createSession() {
    return this.#apiClient.sessionCreate.bind(this.#apiClient);
  }

  /**
   * Create new user session (management and/or signing) whose lifetime potentially
   * extends the lifetime of the current session.  MFA is always required.
   *
   * Same as {@link ApiClient.sessionCreateExtended}, see its documentation for more information.
   *
   * @returns A function that resolves to new signer session info.
   */
  get createExtendedSession() {
    return this.#apiClient.sessionCreateExtended.bind(this.#apiClient);
  }

  /**
   * Revoke a session.
   *
   * Same as {@link ApiClient.sessionRevoke}, see its documentation for more info.
   *
   * @returns A function that revokes a session
   */
  get revokeSession() {
    return this.#apiClient.sessionRevoke.bind(this.#apiClient);
  }

  /**
   * Send a heartbeat / upcheck request.
   *
   * Same as {@link ApiClient.heartbeat}, see its documentation for more info.
   *
   * @returns A function that sends a heartbeat
   */
  get heartbeat() {
    return this.#apiClient.heartbeat.bind(this.#apiClient);
  }

  /**
   * List outstanding user-export requests.
   *
   * Same as {@link ApiClient.userExportList}, see its documentation for more info.
   *
   * @returns A function that resolves to a paginator of user-export requests
   */
  get exports() {
    return this.#apiClient.userExportList.bind(this.#apiClient);
  }

  /**
   * Delete an outstanding user-export request.
   *
   * Same as {@link ApiClient.userExportDelete}, see its documentation for more info.
   *
   * @returns A function that deletes a user-export request
   */
  get deleteExport() {
    return this.#apiClient.userExportDelete.bind(this.#apiClient);
  }

  /**
   * Initiate a user-export request.
   *
   * Same as {@link ApiClient.userExportInit}, see its documentation for more info.
   *
   * @returns A function that resolves to the request response.
   */
  get initExport() {
    return this.#apiClient.userExportInit.bind(this.#apiClient);
  }

  /**
   * Complete a user-export request.
   *
   * Same as {@link ApiClient.userExportComplete}, see its documentation for more info.
   *
   * @returns A function that resolves to the request response.
   */
  get completeExport() {
    return this.#apiClient.userExportComplete.bind(this.#apiClient);
  }

  /**
   * Update the org.
   *
   * Same as {@link ApiClient.orgUpdate}, see its documentation for more info.
   *
   * @returns A function that updates an org and returns updated org information
   */
  get update() {
    return this.#apiClient.orgUpdate.bind(this.#apiClient);
  }

  /**
   * Request a fresh key-import key.
   *
   * Same as {@link ApiClient.createKeyImportKey}, see its documentation for more info.
   *
   * @returns A function that resolves to a fresh key-import key
   */
  get createKeyImportKey() {
    return this.#apiClient.createKeyImportKey.bind(this.#apiClient);
  }

  /**
   * Import one or more keys. To use this functionality, you must first create an
   * encrypted key-import request using the `@cubist-labs/cubesigner-sdk-key-import`
   * library. See that library's documentation for more info.
   *
   * @param body An encrypted key-import request.
   * @returns The newly imported keys.
   */
  async importKeys(body: ImportKeyRequest): Promise<Key[]> {
    const keys = await this.#apiClient.importKeys(body);
    return keys.map((k) => new Key(this.#apiClient, k));
  }
}
