import type { KeyType, KeyProperties, NotificationEndpointConfiguration, PageOpts, UserInOrgInfo, ApiClient, OrgInfo, MfaId } from ".";
import { Key, MfaRequest, Role } from ".";
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
     * @description The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    get id(): OrgId;
    /**
     * Get the cached properties of this org. The cached properties reflect the
     * state of the last fetch or update.
     */
    get cached(): OrgInfo | undefined;
    /**
     * Constructor.
     *
     * @param {ApiClient} apiClient The API client to use.
     * @param {string} orgId The id of the org
     */
    constructor(apiClient: ApiClient, orgId: string);
    /**
     * Fetch the org information.
     *
     * @return {OrgInfo} The org information.
     */
    fetch(): Promise<OrgInfo>;
    /** Human-readable name for the org */
    name(): Promise<string | undefined>;
    /**
     * Set the human-readable name for the org.
     * @param {string} name The new human-readable name for the org (must be alphanumeric).
     * @example my_org_name
     */
    setName(name: string): Promise<void>;
    /** Is the org enabled? */
    enabled(): Promise<boolean>;
    /** Enable the org. */
    enable(): Promise<void>;
    /** Disable the org. */
    disable(): Promise<void>;
    /** Get the policy for the org. */
    policy(): Promise<OrgPolicy[]>;
    /**
     * Set the policy for the org.
     * @param {OrgPolicy[]} policy The new policy for the org.
     */
    setPolicy(policy: OrgPolicy[]): Promise<void>;
    /**
     * Set the notification endpoints for the org.
     *
     * @param {NotificationEndpointConfiguration[]} notification_endpoints Endpoints.
     */
    setNotificationEndpoints(notification_endpoints: NotificationEndpointConfiguration[]): Promise<void>;
    /**
     * Create a new signing key.
     * @param {KeyType} type The type of key to create.
     * @param {string?} ownerId The owner of the key. Defaults to the session's user.
     * @param {KeyProperties?} props Additional key properties
     * @return {Key[]} The new keys.
     */
    createKey(type: KeyType, ownerId?: string, props?: KeyProperties): Promise<Key>;
    /**
     * Create new signing keys.
     * @param {KeyType} type The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    createKeys(type: KeyType, count: number, ownerId?: string): Promise<Key[]>;
    /**
     * Create a new user in the organization and sends an invitation to that user.
     *
     * Same as {@link ApiClient.orgUserInvite}.
     */
    get createUser(): (email: string, name: string, role?: "Alien" | "Member" | "Owner" | undefined, skipEmail?: boolean | undefined) => Promise<void>;
    /**
     * Delete an existing user.
     *
     * Same as {@link ApiClient.orgUserDelete}.
     */
    get deleteUser(): (userId: string) => Promise<{
        status: string;
    }>;
    /**
     * Create a new OIDC user.
     *
     * Same as {@link ApiClient.orgUserCreateOidc}.
     */
    get createOidcUser(): (identity: {
        iss: string;
        sub: string;
    }, email?: string | null | undefined, opts?: import("./schema_types").CreateOidcUserOptions) => Promise<string>;
    /**
     * Delete an existing OIDC user.
     *
     * Same as {@link ApiClient.orgUserDeleteOidc}.
     */
    get deleteOidcUser(): (identity: {
        iss: string;
        sub: string;
    }) => Promise<{
        status: string;
    }>;
    /**
     * List users in the organization.
     *
     * Same as {@link ApiClient.orgUsersList}
     */
    get users(): () => Promise<{
        email?: string | null | undefined;
        id: string;
        initialized?: boolean | undefined;
        membership: "Alien" | "Member" | "Owner";
        name?: string | null | undefined;
        status: "enabled" | "disabled";
    }[]>;
    /**
     * Get users by id.
     *
     * Same as {@link ApiClient.orgUserGet}
     */
    get getUser(): (userId: string) => Promise<{
        email?: string | null | undefined;
        id: string;
        initialized?: boolean | undefined;
        membership: "Alien" | "Member" | "Owner";
        name?: string | null | undefined;
        status: "enabled" | "disabled";
    }>;
    /**
     * Enable a user in this org
     * @param {string} userId The user whose membership to enable
     * @return {Promise<UserInOrgInfo>} The updated user's membership
     */
    enableUser(userId: string): Promise<UserInOrgInfo>;
    /**
     * Disable a user in this org
     * @param {string} userId The user whose membership to disable
     * @return {Promise<UserInOrgInfo>} The updated user's membership
     */
    disableUser(userId: string): Promise<UserInOrgInfo>;
    /**
     * Get the keys in the organization
     * @param {KeyFilter} props Optional filtering properties.
     * @return {Promise<Key[]>} The keys.
     */
    keys(props?: KeyFilter): Promise<Key[]>;
    /**
     * Create a new role.
     *
     * @param {string?} name The name of the role.
     * @return {Role} The new role.
     */
    createRole(name?: string): Promise<Role>;
    /**
     * Get a role by id or name.
     *
     * @param {string} roleId The id or name of the role to get.
     * @return {Role} The role.
     */
    getRole(roleId: string): Promise<Role>;
    /**
     * Gets all the roles in the org
     * @param {PageOpts} page The paginator options
     * @return {Role[]} The roles
     */
    roles(page: PageOpts): Promise<Role[]>;
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
    deriveKey(type: KeyType, derivationPath: string, mnemonicId: string): Promise<Key | undefined>;
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
    deriveKeys(type: KeyType, derivationPaths: string[], mnemonicId: string): Promise<Key[]>;
    /**
     * Get a key by id.
     *
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     */
    getKey(keyId: string): Promise<Key>;
    /**
     * Get a key by its material id (e.g., address).
     *
     * @param {KeyType} keyType The key type.
     * @param {string} materialId The material id of the key to get.
     * @return {Key} The key.
     */
    getKeyByMaterialId(keyType: KeyType, materialId: string): Promise<Key>;
    /**
     * Obtain a proof of authentication.
     *
     * Same as {@link ApiClient.identityProve}
     */
    get proveIdentity(): () => Promise<{
        aud?: string | null | undefined;
        email?: string | null | undefined;
        exp_epoch: number;
        identity?: {
            iss: string;
            sub: string;
        } | null | undefined;
        preferred_username?: string | null | undefined;
        user_info?: {
            configured_mfa: ({
                type: "totp";
            } | {
                id: string;
                name: string;
                type: "fido";
            })[];
            initialized: boolean;
            name?: string | null | undefined;
            user_id: string;
        } | null | undefined;
    } & {
        id: string;
    }>;
    /**
     * Check if a given proof of OIDC authentication is valid.
     *
     * Same as {@link ApiClient.identityVerify}
     */
    get verifyIdentity(): (proof: {
        aud?: string | null | undefined;
        email?: string | null | undefined;
        exp_epoch: number;
        identity?: {
            iss: string;
            sub: string;
        } | null | undefined;
        preferred_username?: string | null | undefined;
        user_info?: {
            configured_mfa: ({
                type: "totp";
            } | {
                id: string;
                name: string;
                type: "fido";
            })[];
            initialized: boolean;
            name?: string | null | undefined;
            user_id: string;
        } | null | undefined;
    } & {
        id: string;
    }) => Promise<void>;
    /**
     * Get a pending MFA request by its id.
     *
     * @param {string} mfaId MFA request ID
     * @return {MfaRequest} The MFA request
     */
    getMfaRequest(mfaId: MfaId): MfaRequest;
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @return {Promise<MfaRequest[]>} The MFA requests.
     */
    mfaRequests(): Promise<MfaRequest[]>;
    /**
     * Sign a stake request.
     *
     * Same as {@link ApiClient.signStake}
     */
    get stake(): (req: {
        chain_id: number;
        deposit_type: "Canonical" | "Wrapper";
        staking_amount_gwei?: number | undefined;
        unsafe_conf?: {
            deposit_contract_addr?: string | null | undefined;
            genesis_fork_version?: string | null | undefined;
        } | null | undefined;
        validator_key?: string | null | undefined;
        withdrawal_addr: string;
    }, mfaReceipt?: import("./mfa").MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<{
        created_validator_key_id: string;
        deposit_tx: {
            chain_id: number;
            deposit_txn: Record<string, never>;
            new_validator_pk: string;
        };
    }>>;
    /**
     * Create new user session (management and/or signing)
     *
     * Same as {@link ApiClient.sessionCreate}.
     */
    get createSession(): (purpose: string, scopes: ("sign:*" | "sign:ava" | "sign:blob" | "sign:btc:*" | "sign:btc:segwit" | "sign:btc:taproot" | "sign:babylon:*" | "sign:babylon:eots:*" | "sign:babylon:eots:nonces" | "sign:babylon:eots:sign" | "sign:babylon:staking:*" | "sign:babylon:staking:deposit" | "sign:babylon:staking:unbond" | "sign:babylon:staking:withdraw" | "sign:evm:*" | "sign:evm:tx" | "sign:evm:eip191" | "sign:evm:eip712" | "sign:eth2:*" | "sign:eth2:validate" | "sign:eth2:stake" | "sign:eth2:unstake" | "sign:solana" | "sign:mmi" | "manage:*" | "manage:email" | "manage:mfa:*" | "manage:mfa:list" | "manage:mfa:vote:*" | "manage:mfa:vote:cs" | "manage:mfa:vote:fido" | "manage:mfa:vote:totp" | "manage:mfa:register:*" | "manage:mfa:register:fido" | "manage:mfa:register:totp" | "manage:mfa:unregister:*" | "manage:mfa:unregister:fido" | "manage:mfa:unregister:totp" | "manage:mfa:verify:*" | "manage:mfa:verify:totp" | "manage:key:*" | "manage:key:get" | "manage:key:listRoles" | "manage:key:list" | "manage:key:history:tx:list" | "manage:key:create" | "manage:key:import" | "manage:key:update:*" | "manage:key:update:owner" | "manage:key:update:policy" | "manage:key:update:enabled" | "manage:key:update:metadata" | "manage:key:update:policyOnUpdates" | "manage:key:delete" | "manage:role:*" | "manage:role:create" | "manage:role:delete" | "manage:role:get:*" | "manage:role:get:keys" | "manage:role:get:users" | "manage:role:list" | "manage:role:update:*" | "manage:role:update:enabled" | "manage:role:update:policy" | "manage:role:update:editPolicy" | "manage:role:update:key:add" | "manage:role:update:key:remove" | "manage:role:update:user:add" | "manage:role:update:user:remove" | "manage:role:history:tx:list" | "manage:identity:*" | "manage:identity:verify" | "manage:identity:add" | "manage:identity:remove" | "manage:identity:list" | "manage:org:*" | "manage:org:addUser" | "manage:org:inviteUser" | "manage:org:updateMembership" | "manage:org:listUsers" | "manage:org:user:get" | "manage:org:deleteUser" | "manage:org:get" | "manage:session:*" | "manage:session:get" | "manage:session:list" | "manage:session:create" | "manage:session:revoke" | "manage:export:*" | "manage:export:user:*" | "manage:export:user:delete" | "manage:export:user:list" | "manage:mmi:*" | "manage:mmi:get" | "manage:mmi:list" | "manage:mmi:reject" | "manage:mmi:delete" | "export:*" | "export:user:*" | "export:user:init" | "export:user:complete" | "mmi:*")[], lifetimes?: import(".").SessionLifetime | undefined) => Promise<import(".").SessionData>;
    /**
     * Revoke a session.
     *
     * Same as {@link ApiClient.sessionRevoke}.
     */
    get revokeSession(): (sessionId?: string | undefined) => Promise<void>;
    /**
     * Send a heartbeat / upcheck request.
     *
     * Same as {@link ApiClient.heartbeat}
     */
    get heartbeat(): () => Promise<void>;
    /**
     * List outstanding user-export requests.
     *
     * Same as {@link ApiClient.userExportList}
     */
    get exports(): (keyId?: string | undefined, userId?: string | undefined, page?: PageOpts | undefined) => import("./paginator").Paginator<{
        export_requests: ({
            exp_epoch: number;
            org_id: string;
            public_key_hash?: string | null | undefined;
            valid_epoch: number;
        } & {
            key_id: string;
        })[];
    } & {
        last_evaluated_key?: string | null | undefined;
    }, {
        exp_epoch: number;
        org_id: string;
        public_key_hash?: string | null | undefined;
        valid_epoch: number;
    } & {
        key_id: string;
    }>;
    /**
     * Delete an outstanding user-export request.
     *
     * Same as {@link ApiClient.userExportDelete}
     */
    get deleteExport(): (keyId: string, userId?: string | undefined) => Promise<void>;
    /**
     * Initiate a user-export request.
     *
     * Same as {@link ApiClient.userExportInit}
     */
    get initExport(): (keyId: string, mfaReceipt?: import("./mfa").MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<{
        exp_epoch: number;
        org_id: string;
        public_key_hash?: string | null | undefined;
        valid_epoch: number;
    } & {
        key_id: string;
    }>>;
    /**
     * Complete a user-export request.
     *
     * Same as {@link ApiClient.userExportComplete}
     */
    get completeExport(): (keyId: string, publicKey: CryptoKey, mfaReceipt?: import("./mfa").MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<{
        encrypted_key_material: string;
        ephemeral_public_key: string;
        user_id: string;
    }>>;
    /**
     * Update the org.
     *
     * Same as {@link ApiClient.orgUpdate}.
     */
    get update(): (request: {
        default_invite_kind?: "Cognito" | "Sso" | null | undefined;
        email_preferences?: {
            pending_approvals?: boolean | undefined;
        } | null | undefined;
        enabled?: boolean | null | undefined;
        historical_data_configuration?: {
            tx: {
                lifetime?: number | null | undefined;
            };
        } | null | undefined;
        name?: string | null | undefined;
        notification_endpoints?: {
            filter?: "All" | {
                AllExcept: ("Eth2ConcurrentBlockSigning" | "Eth2ConcurrentAttestationSigning" | "BabylonEotsConcurrentSigning" | "Eth2ExceededMaxUnstake" | "Eth2Unstake" | "Billing" | "OidcAuth" | "Eth2InvalidBlockProposerSlotTooLow" | "Eth2InvalidAttestationSourceEpochTooLow" | "Eth2InvalidAttestationTargetEpochTooLow" | "KeyCreated" | "MfaRejected" | "UserExportInit" | "UserExportComplete")[];
            } | {
                OneOf: ("Eth2ConcurrentBlockSigning" | "Eth2ConcurrentAttestationSigning" | "BabylonEotsConcurrentSigning" | "Eth2ExceededMaxUnstake" | "Eth2Unstake" | "Billing" | "OidcAuth" | "Eth2InvalidBlockProposerSlotTooLow" | "Eth2InvalidAttestationSourceEpochTooLow" | "Eth2InvalidAttestationTargetEpochTooLow" | "KeyCreated" | "MfaRejected" | "UserExportInit" | "UserExportComplete")[];
            } | undefined;
            url: string;
        }[] | null | undefined;
        policy?: Record<string, never>[] | null | undefined;
        require_scope_ceiling?: boolean | null | undefined;
        totp_failure_limit?: number | null | undefined;
        user_export_delay?: number | null | undefined;
        user_export_window?: number | null | undefined;
    }) => Promise<{
        default_invite_kind?: "Cognito" | "Sso" | null | undefined;
        email_preferences?: {
            pending_approvals?: boolean | undefined;
        } | null | undefined;
        enabled?: boolean | null | undefined;
        historical_data_configuration?: {
            tx: {
                lifetime?: number | null | undefined;
            };
        } | null | undefined;
        name?: string | null | undefined;
        notification_endpoints?: {
            filter?: "All" | {
                AllExcept: ("Eth2ConcurrentBlockSigning" | "Eth2ConcurrentAttestationSigning" | "BabylonEotsConcurrentSigning" | "Eth2ExceededMaxUnstake" | "Eth2Unstake" | "Billing" | "OidcAuth" | "Eth2InvalidBlockProposerSlotTooLow" | "Eth2InvalidAttestationSourceEpochTooLow" | "Eth2InvalidAttestationTargetEpochTooLow" | "KeyCreated" | "MfaRejected" | "UserExportInit" | "UserExportComplete")[];
            } | {
                OneOf: ("Eth2ConcurrentBlockSigning" | "Eth2ConcurrentAttestationSigning" | "BabylonEotsConcurrentSigning" | "Eth2ExceededMaxUnstake" | "Eth2Unstake" | "Billing" | "OidcAuth" | "Eth2InvalidBlockProposerSlotTooLow" | "Eth2InvalidAttestationSourceEpochTooLow" | "Eth2InvalidAttestationTargetEpochTooLow" | "KeyCreated" | "MfaRejected" | "UserExportInit" | "UserExportComplete")[];
            } | undefined;
            url: string;
        }[] | null | undefined;
        org_id: string;
        policy?: Record<string, never>[] | null | undefined;
        require_scope_ceiling?: boolean | null | undefined;
        totp_failure_limit?: number | null | undefined;
        user_export_delay?: number | null | undefined;
        user_export_window?: number | null | undefined;
    }>;
}
//# sourceMappingURL=org.d.ts.map