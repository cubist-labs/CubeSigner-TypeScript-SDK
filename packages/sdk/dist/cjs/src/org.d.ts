import { CubeSignerClient } from "./client";
import { NotificationEndpointConfiguration, OrgInfo, SignerSessionManager, SignerSessionStorage } from ".";
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
/**
 * An organization.
 *
 * Extends {@link CubeSignerClient} and provides a few org-specific methods on top.
 */
export declare class Org extends CubeSignerClient {
    /**
     * @description The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    get id(): OrgId;
    /**
     * Obtain information about the current organization.
     *
     * Same as {@link orgGet}.
     */
    get info(): () => Promise<{
        enabled: boolean;
        key_import_key?: string | null | undefined;
        kwk_id: string;
        last_unstake: string;
        last_unstake_day_count: number;
        name?: string | null | undefined;
        notification_endpoints?: ({
            arn: string;
            config: {
                filter?: "All" | {
                    AllExcept: ("Eth2ConcurrentBlockSigning" | "Eth2ConcurrentAttestationSigning" | "Eth2ExceededMaxUnstake" | "Eth2Unstake" | "Billing" | "OidcAuth" | "Eth2InvalidBlockProposerSlotTooLow" | "Eth2InvalidAttestationSourceEpochTooLow" | "Eth2InvalidAttestationTargetEpochTooLow" | "MfaRejected")[];
                } | {
                    OneOf: ("Eth2ConcurrentBlockSigning" | "Eth2ConcurrentAttestationSigning" | "Eth2ExceededMaxUnstake" | "Eth2Unstake" | "Billing" | "OidcAuth" | "Eth2InvalidBlockProposerSlotTooLow" | "Eth2InvalidAttestationSourceEpochTooLow" | "Eth2InvalidAttestationTargetEpochTooLow" | "MfaRejected")[];
                } | undefined;
                url: string;
            };
        } & {
            status: "Confirmed" | "Pending";
        })[] | undefined;
        org_id: string;
        policy?: Record<string, never>[] | undefined;
        totp_failure_limit: number;
        user_export_delay: number;
        user_export_window: number;
    }>;
    /** Human-readable name for the org */
    name(): Promise<string | undefined>;
    /** Get all keys in the org. */
    get keys(): (type?: import("./key").KeyType | undefined, page?: import("./paginator").PageOpts | undefined, owner?: string | undefined) => Promise<import("./key").Key[]>;
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
     * Retrieve the org associated with a session.
     * @param {SessionStorage} storage The session
     * @return {Org} An {@link Org} instance for the org associated with this session.
     */
    static retrieveFromStorage(storage: SignerSessionStorage): Promise<Org>;
    /**
     * Constructor.
     * @param {CubeSignerClient | SignerSessionManager} csc The CubeSigner instance.
     * @param {OrgInfo| string} data Either org id or name or {@link OrgInfo}.
     */
    constructor(csc: CubeSignerClient | SignerSessionManager, data?: OrgInfo | string);
}
