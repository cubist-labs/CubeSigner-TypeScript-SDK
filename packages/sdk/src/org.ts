import { CubeSignerClient } from "./client";
import {
  NotificationEndpointConfiguration,
  OrgInfo,
  SignerSessionManager,
  SignerSessionStorage,
} from ".";

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

/**
 * An organization.
 *
 * Extends {@link CubeSignerClient} and provides a few org-specific methods on top.
 */
export class Org extends CubeSignerClient {
  /**
   * @description The org id
   * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   */
  get id(): OrgId {
    return this.orgId;
  }

  /**
   * Obtain information about the current organization.
   *
   * Same as {@link orgGet}.
   */
  get info() {
    return this.orgGet.bind(this);
  }

  /** Human-readable name for the org */
  async name(): Promise<string | undefined> {
    const org = await this.orgGet();
    return org.name ?? undefined;
  }

  /** Get all keys in the org. */
  get keys() {
    return this.orgKeys.bind(this);
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
    await this.orgUpdate({ name });
  }

  /** Is the org enabled? */
  async enabled(): Promise<boolean> {
    const org = await this.orgGet();
    return org.enabled;
  }

  /** Enable the org. */
  async enable() {
    await this.orgUpdate({ enabled: true });
  }

  /** Disable the org. */
  async disable() {
    await this.orgUpdate({ enabled: false });
  }

  /** Get the policy for the org. */
  async policy(): Promise<OrgPolicy[]> {
    const org = await this.orgGet();
    return (org.policy ?? []) as unknown as OrgPolicy[];
  }

  /**
   * Set the policy for the org.
   * @param {OrgPolicy[]} policy The new policy for the org.
   */
  async setPolicy(policy: OrgPolicy[]) {
    const p = policy as unknown as Record<string, never>[];
    await this.orgUpdate({ policy: p });
  }

  /**
   * Set the notification endpoints for the org.
   *
   * @param {NotificationEndpointConfiguration[]} notification_endpoints Endpoints.
   */
  async setNotificationEndpoints(notification_endpoints: NotificationEndpointConfiguration[]) {
    await this.orgUpdate({
      notification_endpoints: notification_endpoints as unknown as Record<string, never>[],
    });
  }

  /**
   * Retrieve the org associated with a session.
   * @param {SessionStorage} storage The session
   * @return {Org} An {@link Org} instance for the org associated with this session.
   */
  static async retrieveFromStorage(storage: SignerSessionStorage): Promise<Org> {
    const sessionMgr = await SignerSessionManager.loadFromStorage(storage);
    return new Org(new CubeSignerClient(sessionMgr), sessionMgr.orgId);
  }

  /**
   * Constructor.
   * @param {CubeSignerClient | SignerSessionManager} csc The CubeSigner instance.
   * @param {OrgInfo| string} data Either org id or name or {@link OrgInfo}.
   */
  constructor(csc: CubeSignerClient | SignerSessionManager, data?: OrgInfo | string) {
    const mgr = csc instanceof CubeSignerClient ? csc.sessionMgr : (csc as SignerSessionManager);

    // NOTE: data can be OrgInfo for backward compatibility reasons
    const orgId = typeof data === "string" ? data : data?.org_id;
    super(mgr, orgId);
  }
}
