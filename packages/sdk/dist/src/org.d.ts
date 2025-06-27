import type { KeyType, KeyProperties, NotificationEndpointConfiguration, PageOpts, UserInOrgInfo, ApiClient, OrgInfo, MfaId, ImportKeyRequest, KeyPolicy, QueryMetricsResponse, OrgMetricName, QueryMetricsRequest, KeyTypeAndDerivationPath, JsonValue, EditPolicy, AddressMap, CreateOrgRequest, RolePolicy, PolicyEngineConfiguration, MfaProtectedAction, MfaType } from ".";
import { Contact } from "./contact";
import { Key, MfaRequest, Role } from ".";
import { type NamedKeyPolicy, NamedPolicy, type NamedRolePolicy, NamedWasmPolicy } from "./policy";
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
export type OrgPolicy = SourceIpAllowlistPolicy | OidcAuthSourcesPolicy | OriginAllowlistPolicy | MaxDailyUnstakePolicy | WebAuthnRelyingPartiesPolicy | ExclusiveKeyAccessPolicy;
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
    WebAuthnRelyingParties: {
        id?: string;
        name: string;
    }[];
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
export declare class Org {
    #private;
    /**
     * @returns The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    get id(): OrgId;
    /**
     * @returns The cached properties of this org. The cached properties reflect the
     * state of the last fetch or update.
     */
    get cached(): OrgInfo | undefined;
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param orgId The id of the org
     */
    constructor(apiClient: ApiClient, orgId: string);
    /**
     * Create a new organization. The new org is a child of the
     * current org and inherits its key-export policy. The new org
     * is created with one owner, the caller of this API.
     *
     * @param nameOrRequest The name of the new org or the properties of the new org.
     * @returns Information about the newly created org.
     */
    createOrg(nameOrRequest: string | CreateOrgRequest): Promise<OrgInfo>;
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
    queryMetrics(metricName: OrgMetricName, startTime: EpochTimeStamp, opt?: Omit<QueryMetricsRequest, "metric_name" | "start_time">, pageOpts?: PageOpts): Promise<QueryMetricsResponse>;
    /**
     * Fetch the org information.
     *
     * @returns The org information.
     */
    fetch(): Promise<OrgInfo>;
    /** @returns The human-readable name for the org */
    name(): Promise<string | undefined>;
    /** @returns Whether the org is enabled */
    enabled(): Promise<boolean>;
    /** Enable the org. */
    enable(): Promise<void>;
    /** Disable the org. */
    disable(): Promise<void>;
    /** @returns the policy for the org. */
    policy(): Promise<OrgPolicy[]>;
    /**
     * Set the policy for the org.
     *
     * @param policy The new policy for the org.
     */
    setPolicy(policy: OrgPolicy[]): Promise<void>;
    /**
     * Set the notification endpoints for the org.
     *
     * @param notification_endpoints Endpoints.
     */
    setNotificationEndpoints(notification_endpoints: NotificationEndpointConfiguration[]): Promise<void>;
    /**
     * Set required MFA types for actions implicitly requiring MFA (see {@link MfaProtectedAction}).
     *
     * @param allowed_mfa_types Assignment of MFA types to actions that implicitly require MFA.
     */
    setAllowedMfaTypes(allowed_mfa_types: Partial<Record<MfaProtectedAction, MfaType[]>>): Promise<void>;
    /**
     * Create a new signing key.
     *
     * @param type The type of key to create.
     * @param ownerId The owner of the key. Defaults to the session's user.
     * @param props Additional properties to set on the new key.
     * @returns The new keys.
     */
    createKey(type: KeyType, ownerId?: string, props?: CreateKeyProperties): Promise<Key>;
    /**
     * Create new signing keys.
     *
     * @param type The type of key to create.
     * @param count The number of keys to create.
     * @param ownerId The owner of the keys. Defaults to the session's user.
     * @param props Additional properties to set on the new keys.
     * @returns The new keys.
     */
    createKeys(type: KeyType, count: number, ownerId?: string, props?: CreateKeyProperties): Promise<Key[]>;
    /**
     * Create a new (first-party) user in the organization and sends an invitation to that user.
     *
     * Same as {@link ApiClient.orgUserInvite}, see its documentation for more information.
     *
     * @returns A function that invites a user
     */
    get createUser(): (email: string, name: string, role?: import("./schema_types").MemberRole, skipEmail?: boolean) => Promise<void>;
    /**
     * Delete an existing user.
     *
     * Same as {@link ApiClient.orgUserDelete}, see its documentation for more information.
     *
     * @returns A function that deletes a user
     */
    get deleteUser(): (userId: string) => Promise<import("./schema_types").Empty>;
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     *
     * Same as {@link ApiClient.orgUserCreateOidc}, see its documentation for more information.
     *
     * @returns A function that creates an OIDC user, resolving to the new user's ID
     */
    get createOidcUser(): (identityOrProof: import("./schema_types").OidcIdentity | import("./schema_types").IdentityProof, email?: string | null, opts?: import("./schema_types").CreateOidcUserOptions) => Promise<string>;
    /**
     * Delete an existing OIDC user.
     *
     * Same as {@link ApiClient.orgUserDeleteOidc}, see its documentation for more information.
     *
     * @returns A function that deletes an OIDC user
     */
    get deleteOidcUser(): (identity: import("./schema_types").OidcIdentity) => Promise<import("./schema_types").Empty>;
    /**
     * List all users in the organization.
     *
     * @param searchQuery Optional query string. If defined, all returned users will contain this string in their name or email.
     * @returns The list of users
     */
    users(searchQuery?: string): Promise<UserInOrgInfo[]>;
    /**
     * List users in the organization (paginated).
     *
     * Same as {@link ApiClient.orgUsersList}, see its documentation for more information.
     *
     * @returns A function that returns a paginated list of users
     */
    get usersPaginated(): (page?: PageOpts, searchQuery?: string) => import("./paginator").Paginator<import("./schema_types").GetUsersInOrgResponse, UserInOrgInfo[]>;
    /**
     * Get user by id.
     *
     * Same as {@link ApiClient.orgUserGet}, see its documentation for more information.
     *
     * @returns A function that resolves to a user's info
     */
    get getUser(): (userId: string) => Promise<UserInOrgInfo>;
    /**
     * Get user by email.
     *
     * Same as {@link ApiClient.orgUserGetByEmail}, see its documentation for more information.
     *
     * @returns A function that resolves to a user's info
     */
    get getUserByEmail(): (email: string) => Promise<UserInOrgInfo>;
    /**
     * Enable a user in this org
     *
     * @param userId The user whose membership to enable
     * @returns The updated user's membership
     */
    enableUser(userId: string): Promise<UserInOrgInfo>;
    /**
     * Disable a user in this org
     *
     * @param userId The user whose membership to disable
     * @returns The updated user's membership
     */
    disableUser(userId: string): Promise<UserInOrgInfo>;
    /**
     * Get the accessible keys in the organization
     *
     * @param props Optional filtering properties.
     * @returns The keys.
     */
    keys(props?: KeyFilter): Promise<Key[]>;
    /**
     * Create a new role.
     *
     * @param name The name of the role.
     * @returns The new role.
     */
    createRole(name?: string): Promise<Role>;
    /**
     * Get a role by id or name.
     *
     * @param roleId The id or name of the role to get.
     * @returns The role.
     */
    getRole(roleId: string): Promise<Role>;
    /**
     * Gets all the roles in the org
     *
     * @param page The paginator options
     * @returns The roles
     */
    roles(page: PageOpts): Promise<Role[]>;
    /**
     * Create a new named policy.
     *
     * @param name The name of the policy.
     * @param type The type of the policy.
     * @param rules The policy rules.
     * @returns The new policy.
     */
    createPolicy<Type extends "Key" | "Role">(name: string, type: Type, rules: Type extends "Key" ? KeyPolicy : RolePolicy): Promise<Type extends "Key" ? NamedKeyPolicy : NamedRolePolicy>;
    /**
     * Get a named policy by id or name.
     *
     * @param policyId The id or name of the policy to get.
     * @returns The policy.
     */
    getPolicy(policyId: string): Promise<NamedPolicy>;
    /**
     * Gets all the named policies in the org.
     *
     * @param page The paginator options.
     * @returns The policies.
     */
    policies(page: PageOpts): Promise<NamedPolicy[]>;
    /**
     * Create a new Wasm policy.
     *
     * @param name The name of the policy.
     * @param policy The Wasm policy object.
     * @returns The new policy.
     */
    createWasmPolicy(name: string, policy: Uint8Array): Promise<NamedWasmPolicy>;
    /** @returns the Policy Engine configuration for the org. */
    policyEngineConfiguration(): Promise<PolicyEngineConfiguration | undefined>;
    /**
     * Set the Policy Engine configuration for the org.
     * Note that this overwrites any existing configuration.
     *
     * @param configs The Policy Engine configuration.
     */
    setPolicyEngineConfiguration(configs: PolicyEngineConfiguration): Promise<void>;
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
    deriveKey(type: KeyType, derivationPath: string, mnemonicId: string, props?: ImportDeriveKeyProperties): Promise<Key | undefined>;
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
    deriveKeys(type: KeyType, derivationPaths: string[], mnemonicId: string, props?: ImportDeriveKeyProperties): Promise<Key[]>;
    /**
     * Use either a new or existing mnemonic to derive keys of one or more
     * specified types via specified derivation paths.
     *
     * @param keyTypesAndDerivationPaths A list of `KeyTypeAndDerivationPath` objects specifying the keys to be derived
     * @param props Additional options for derivation.
     *
     * @returns The newly derived keys.
     */
    deriveMultipleKeyTypes(keyTypesAndDerivationPaths: KeyTypeAndDerivationPath[], props?: DeriveMultipleKeyTypesProperties): Promise<Key[]>;
    /**
     * Get a key by id.
     *
     * @param keyId The id of the key to get.
     * @returns The key.
     */
    getKey(keyId: string): Promise<Key>;
    /**
     * Get a key by its material id (e.g., address).
     *
     * @param keyType The key type.
     * @param materialId The material id of the key to get.
     * @returns The key.
     */
    getKeyByMaterialId(keyType: KeyType, materialId: string): Promise<Key>;
    /**
     * Create a contact.
     *
     * @param name The name for the new contact.
     * @param addresses The addresses associated with the contact.
     * @param metadata Metadata associated with the contact. Intended for use as a description.
     * @param editPolicy The edit policy for the contact, determining when and who can edit this contact.
     * @returns The newly-created contact.
     */
    createContact(name: string, addresses?: AddressMap, metadata?: JsonValue, editPolicy?: EditPolicy): Promise<Contact>;
    /**
     * Get a contact by its id.
     *
     * @param contactId The id of the contact to get.
     * @returns The contact.
     */
    getContact(contactId: string): Promise<Contact>;
    /**
     * Get all contacts in the organization.
     *
     * @returns All contacts.
     */
    contacts(): Promise<Contact[]>;
    /**
     * Obtain a proof of authentication.
     *
     * Same as {@link ApiClient.identityProve}, see its documentation for more information.
     *
     * @returns A function that resolves to an identity proof
     */
    get proveIdentity(): () => Promise<import("./schema_types").IdentityProof>;
    /**
     * Check if a given proof of OIDC authentication is valid.
     *
     * Same as {@link ApiClient.identityVerify}, see its documentation for more information.
     *
     * @returns A function that verifies a proof of identity, throwing if invalid
     */
    get verifyIdentity(): (proof: import("./schema_types").IdentityProof) => Promise<void>;
    /**
     * Get a pending MFA request by its id.
     *
     * @param mfaId MFA request ID
     * @returns The MFA request
     */
    getMfaRequest(mfaId: MfaId): MfaRequest;
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @returns The MFA requests.
     */
    mfaRequests(): Promise<MfaRequest[]>;
    /**
     * Sign an Eth2/Beacon-chain deposit (or staking) message.
     *
     * Same as {@link ApiClient.signStake}, see its documentation for more information.
     *
     * @returns A function that resolves to a stake response.
     */
    get stake(): (req: import("./schema_types").Eth2StakeRequest, mfaReceipt?: import("./mfa").MfaReceipts) => Promise<import("./response").CubeSignerResponse<import("./schema_types").Eth2StakeResponse>>;
    /**
     * Create new user session (management and/or signing). The lifetime of
     * the new session is silently truncated to that of the current session.
     *
     * Same as {@link ApiClient.sessionCreate}, see its documentation for more information.
     *
     * @returns A function that resolves to new signer session info.
     */
    get createSession(): (purpose: string, scopes: import("./schema_types").Scope[], lifetimes?: import(".").SessionLifetime) => Promise<import(".").SessionData>;
    /**
     * Create new user session (management and/or signing) whose lifetime potentially
     * extends the lifetime of the current session.  MFA is always required.
     *
     * Same as {@link ApiClient.sessionCreateExtended}, see its documentation for more information.
     *
     * @returns A function that resolves to new signer session info.
     */
    get createExtendedSession(): (purpose: string, scopes: import("./schema_types").Scope[], lifetime: import(".").SessionLifetime, mfaReceipt?: import("./mfa").MfaReceipts) => Promise<import("./response").CubeSignerResponse<import(".").SessionData>>;
    /**
     * Revoke a session.
     *
     * Same as {@link ApiClient.sessionRevoke}, see its documentation for more info.
     *
     * @returns A function that revokes a session
     */
    get revokeSession(): (sessionId?: string) => Promise<void>;
    /**
     * Send a heartbeat / upcheck request.
     *
     * Same as {@link ApiClient.heartbeat}, see its documentation for more info.
     *
     * @returns A function that sends a heartbeat
     */
    get heartbeat(): () => Promise<void>;
    /**
     * List outstanding user-export requests.
     *
     * Same as {@link ApiClient.userExportList}, see its documentation for more info.
     *
     * @returns A function that resolves to a paginator of user-export requests
     */
    get exports(): (keyId?: string, userId?: string, page?: PageOpts) => import("./paginator").Paginator<import("./schema_types").UserExportListResponse, import("./schema_types").UserExportInitResponse[]>;
    /**
     * Delete an outstanding user-export request.
     *
     * Same as {@link ApiClient.userExportDelete}, see its documentation for more info.
     *
     * @returns A function that deletes a user-export request
     */
    get deleteExport(): (keyId: string, userId?: string) => Promise<void>;
    /**
     * Initiate a user-export request.
     *
     * Same as {@link ApiClient.userExportInit}, see its documentation for more info.
     *
     * @returns A function that resolves to the request response.
     */
    get initExport(): (keyId: string, mfaReceipt?: import("./mfa").MfaReceipts) => Promise<import("./response").CubeSignerResponse<import("./schema_types").UserExportInitResponse>>;
    /**
     * Complete a user-export request.
     *
     * Same as {@link ApiClient.userExportComplete}, see its documentation for more info.
     *
     * @returns A function that resolves to the request response.
     */
    get completeExport(): (keyId: string, publicKey: CryptoKey, mfaReceipt?: import("./mfa").MfaReceipts) => Promise<import("./response").CubeSignerResponse<import("./schema_types").UserExportCompleteResponse>>;
    /**
     * Update the org.
     *
     * Same as {@link ApiClient.orgUpdate}, see its documentation for more info.
     *
     * @returns A function that updates an org and returns updated org information
     */
    get update(): (request: import("./schema_types").UpdateOrgRequest) => Promise<import("./schema_types").UpdateOrgResponse>;
    /**
     * Request a fresh key-import key.
     *
     * Same as {@link ApiClient.createKeyImportKey}, see its documentation for more info.
     *
     * @returns A function that resolves to a fresh key-import key
     */
    get createKeyImportKey(): () => Promise<import("./schema_types").CreateKeyImportKeyResponse>;
    /**
     * Import one or more keys. To use this functionality, you must first create an
     * encrypted key-import request using the `@cubist-labs/cubesigner-sdk-key-import`
     * library. See that library's documentation for more info.
     *
     * @param body An encrypted key-import request.
     * @returns The newly imported keys.
     */
    importKeys(body: ImportKeyRequest): Promise<Key[]>;
}
//# sourceMappingURL=org.d.ts.map