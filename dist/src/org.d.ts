import { CubeSigner, MfaRequestInfo } from ".";
import { components } from "./client";
import { KeyType, Key } from "./key";
import { Role } from "./role";
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
     * Create a new user in the organization and sends an invitation to that user
     * @param {string} email Email of the user
     * @param {string} name The full name of the user
     */
    createUser(email: string, name: string): Promise<void>;
    /**
     * Create a new OIDC user
     * @param {OidcIdentity} identity The identity of the OIDC user
     * @param {MemberRole} memberRole The type of membership of the new user
     * @return {string} User id of the new user
     */
    createOicdUser(identity: OidcIdentity, memberRole: MemberRole): Promise<string>;
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
    /** List all roles in the org..
     * @return {Role[]} The roles.
     * */
    list(): Promise<Role[]>;
    /**
     * Get a pending MFA request by its id.
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    mfaGet(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Approve a pending MFA request.
     *
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    mfaApprove(mfaId: string): Promise<MfaRequestInfo>;
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
     * @return {Role} The role.
     * @internal
     * */
    private static roles;
}
export {};
