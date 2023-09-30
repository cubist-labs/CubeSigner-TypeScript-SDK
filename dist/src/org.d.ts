import { CubeSigner, MfaRequestInfo } from ".";
import { components } from "./client";
import { KeyType, Key } from "./key";
import { MfaPolicy, Role } from "./role";
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
export declare class Org {
    #private;
    /**
     * @description The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     * */
    get id(): OrgId;
    /** Human-readable name for the org */
    name(): Promise<string | undefined>;
    /** Set the human-readable name for the org.
     * @param {string} name The new human-readable name for the org (must be alphanumeric).
     * @example my_org_name
     * */
    setName(name: string): Promise<void>;
    /** Is the org enabled? */
    enabled(): Promise<boolean>;
    /** Enable the org. */
    enable(): Promise<void>;
    /** Disable the org. */
    disable(): Promise<void>;
    /** Get the policy for the org. */
    policy(): Promise<OrgPolicy[]>;
    /** Set the policy for the org.
     * @param {OrgPolicy[]} policy The new policy for the org.
     * */
    setPolicy(policy: OrgPolicy[]): Promise<void>;
    /** Create a new signing key.
     * @param {KeyType} type The type of key to create.
     * @param {string?} ownerId The owner of the key. Defaults to the session's user.
     * @return {Key[]} The new keys.
     * */
    createKey(type: KeyType, ownerId?: string): Promise<Key>;
    /** Create new signing keys.
     * @param {KeyType} type The type of key to create.
     * @param {nummber} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     * */
    createKeys(type: KeyType, count: number, ownerId?: string): Promise<Key[]>;
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
    deriveKey(type: KeyType, derivationPath: string, mnemonicId: string, ownerId?: string): Promise<Key>;
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
    deriveKeys(type: KeyType, derivationPaths: string[], mnemonicId: string, ownerId?: string): Promise<Key[]>;
    /**
     * Create a new user in the organization and sends an invitation to that user
     * @param {string} email Email of the user
     * @param {string} name The full name of the user
     */
    createUser(email: string, name: string): Promise<void>;
    /**
     * Create a new OIDC user
     * @param {OidcIdentity} identity The identity of the OIDC user
     * @param {string} email Email of the OIDC user
     * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
     * @return {string} User id of the new user
     */
    createOidcUser(identity: OidcIdentity, email: string, opts?: CreateOidcUserOptions): Promise<string>;
    /**
     * List users in the organization
     * @return {UserIdInfo[]} List of users
     */
    users(): Promise<UserIdInfo[]>;
    /** Get a key by id.
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     * */
    getKey(keyId: string): Promise<Key>;
    /** Get all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @return {Key} The key.
     * */
    keys(type?: KeyType): Promise<Key[]>;
    /** Create a new role.
     * @param {string?} name The name of the role.
     * @return {Role} The new role.
     * */
    createRole(name?: string): Promise<Role>;
    /** Get a role by id or name.
     * @param {string} roleId The id or name of the role to get.
     * @return {Role} The role.
     * */
    getRole(roleId: string): Promise<Role>;
    /** List all roles in the org.
     * @return {Role[]} The roles.
     * */
    listRoles(): Promise<Role[]>;
    /** List all users in the org.
     * @return {User[]} The users.
     * */
    listUsers(): Promise<UserIdInfo[]>;
    /**
     * Get a pending MFA request by its id.
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     *
     * @deprecated Use {@link getMfaInfo()} instead.
     */
    mfaGet(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Approve a pending MFA request.
     *
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     *
     * @deprecated Use {@link approveMfaRequest()} instead.
     */
    mfaApprove(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Get a pending MFA request by its id.
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    getMfaInfo(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Approve a pending MFA request.
     *
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    approveMfaRequest(mfaId: string): Promise<MfaRequestInfo>;
    /** Create a new org.
     * @param {CubeSigner} cs The CubeSigner instance.
     * @param {OrgInfo} data The JSON response from the API server.
     * @internal
     * */
    constructor(cs: CubeSigner, data: OrgInfo);
    /**
     * Approve a pending MFA request.
     *
     * @param {CubeSigner} cs The CubeSigner instance to use for requests
     * @param {string} orgId The org id of the MFA request
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    static mfaApprove(cs: CubeSigner, orgId: string, mfaId: string): Promise<MfaRequestInfo>;
    /** Fetch org info.
     * @return {OrgInfo} The org info.
     * */
    private fetch;
    /** Update the org.
     * @param {UpdateOrgRequest} request The JSON request to send to the API server.
     * @return {UpdateOrgResponse} The JSON response from the API server.
     * */
    private update;
    /** List roles.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the role belongs.
     * @return {Role[]} Org roles.
     * @internal
     * */
    private static roles;
    /** List users.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the role belongs.
     * @return {User[]} Org users.
     * @internal
     * */
    private static users;
}
export {};
