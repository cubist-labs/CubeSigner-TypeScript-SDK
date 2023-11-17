import { OrgInfo } from "./schema_types";
import { CubeSignerClient } from "./client";
import { KeyType, Key } from "./key";
import { Role } from "./role";
import { PageOpts } from "./paginator";
/** Organization id */
export type OrgId = string;
/** Org-wide policy */
export type OrgPolicy = SourceIpAllowlistPolicy | OidcAuthSourcesPolicy | OriginAllowlistPolicy | MaxDailyUnstakePolicy;
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
export declare class Org {
    #private;
    /**
     * @description The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    get id(): OrgId;
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
    /** Set the policy for the org.
     * @param {OrgPolicy[]} policy The new policy for the org.
     * */
    setPolicy(policy: OrgPolicy[]): Promise<void>;
    /**
     * Create a new signing key.
     * @param {KeyType} type The type of key to create.
     * @param {string?} ownerId The owner of the key. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    createKey(type: KeyType, ownerId?: string): Promise<Key>;
    /**
     * Create new signing keys.
     * @param {KeyType} type The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    createKeys(type: KeyType, count: number, ownerId?: string): Promise<Key[]>;
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
    deriveKey(type: KeyType, derivationPath: string, mnemonicId: string): Promise<Key>;
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
    deriveKeys(type: KeyType, derivationPaths: string[], mnemonicId: string): Promise<Key[]>;
    /** Create a new user in the organization and sends an invitation to that user. */
    get createUser(): (email: string, name: string, role?: "Alien" | "Member" | "Owner" | undefined) => Promise<void>;
    /** Create a new OIDC user */
    get createOidcUser(): (identity: {
        iss: string;
        sub: string;
    }, email: string, opts?: import("./schema_types").CreateOidcUserOptions) => Promise<string>;
    /** Delete an existing OIDC user */
    get deleteOidcUser(): (identity: {
        iss: string;
        sub: string;
    }) => Promise<{
        status: string;
    }>;
    /** Checks if a given proof of OIDC authentication is valid. */
    get verifyIdentity(): (proof: {
        aud?: string | null | undefined;
        email: string;
        exp_epoch: number;
        identity?: {
            iss: string;
            sub: string;
        } | null | undefined;
        user_info?: {
            configured_mfa: ({
                type: "totp";
            } | {
                id: string;
                name: string;
                type: "fido";
            })[];
            initialized: boolean;
            user_id: string;
        } | null | undefined;
    } & {
        id: string;
    }) => Promise<void>;
    /**  List users in the organization */
    get users(): () => Promise<{
        email: string;
        id: string;
    }[]>;
    /**
     * Get a key by id.
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     */
    getKey(keyId: string): Promise<Key>;
    /**
     * Get all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Key} The key.
     */
    keys(type?: KeyType, page?: PageOpts): Promise<Key[]>;
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
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Role[]} The roles.
     */
    listRoles(page?: PageOpts): Promise<Role[]>;
    /** List all users in the org. */
    get listUsers(): () => Promise<{
        email: string;
        id: string;
    }[]>;
    /**
     * Get a pending MFA request by its id.
     *
     * @deprecated Use {@link getMfaInfo()} instead.
     */
    get mfaGet(): (mfaId: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: Record<string, unknown> | null | undefined;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ("CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /**
     * Approve a pending MFA request.
     *
     * @deprecated Use {@link approveMfaRequest()} instead.
     */
    get mfaApprove(): (mfaId: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: Record<string, unknown> | null | undefined;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ("CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /** Get a pending MFA request by its id. */
    get getMfaInfo(): (mfaId: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: Record<string, unknown> | null | undefined;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ("CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /** List pending MFA requests accessible to the current user. */
    get listMfaInfos(): () => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: Record<string, unknown> | null | undefined;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ("CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }[]>;
    /** Approve a pending MFA request. */
    get approveMfaRequest(): (mfaId: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: Record<string, unknown> | null | undefined;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ("CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /**
     * Create a new org.
     * @param {CubeSignerClient} csc The CubeSigner instance.
     * @param {OrgInfo} data The JSON response from the API server.
     * @internal
     */
    constructor(csc: CubeSignerClient, data: OrgInfo);
}
