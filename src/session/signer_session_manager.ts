import { CubeSigner } from "..";
import { assertOk } from "../util";
import { components, paths, Client } from "../client";
import { HasEnv, OrgSessionManager } from "./session_manager";
import { SessionStorage } from "./session_storage";

export type ClientSessionInfo = components["schemas"]["ClientSessionInfo"];

export type CreateSignerSessionRequest =
  paths["/v0/org/{org_id}/roles/{role_id}/tokens"]["post"]["requestBody"]["content"]["application/json"];
export type RefreshSignerSessionRequest =
  paths["/v1/org/{org_id}/token/refresh"]["patch"]["requestBody"]["content"]["application/json"];

/** JSON representation of our "signer session" file format */
export interface SignerSessionObject {
  /** The organization ID */
  org_id: string;
  /** The role ID */
  role_id: string;
  /** The purpose of the session token */
  purpose: string;
  /** The token to include in Authorization header */
  token: string;
  /** Session info */
  session_info: ClientSessionInfo;
}

export interface SignerSessionData extends SignerSessionObject, HasEnv {}

/** Type of storage required for signer sessions */
export type SignerSessionStorage = SessionStorage<SignerSessionData>;

export interface SignerSessionLifetime {
  /** Session lifetime (in seconds). Defaults to one week (604800). */
  session?: number;
  /** Auth token lifetime (in seconds). Defaults to five minutes (300). */
  auth: number;
  /** Refresh token lifetime (in seconds). Defaults to one day (86400). */
  refresh?: number;
}

const defaultSignerSessionLifetime: SignerSessionLifetime = {
  session: 604800,
  auth: 300,
  refresh: 86400,
};

/** Manager for signer sessions. */
export class SignerSessionManager extends OrgSessionManager<SignerSessionData> {
  readonly cs?: CubeSigner;
  readonly roleId: string;
  #client: Client;

  /**
   * @return {string} The current auth token.
   * @internal
   */
  async token(): Promise<string> {
    const session = await this.storage.retrieve();
    return session.token;
  }

  /**
   * Returns a client with the current session and refreshes the current
   * session. May **UPDATE/MUTATE** self.
   */
  async client(): Promise<Client> {
    await this.refreshIfNeeded();
    return this.#client;
  }

  /** Revokes the session. */
  async revoke(): Promise<void> {
    if (!this.cs) {
      throw new Error("No management session available");
    }
    const session = await this.storage.retrieve();
    const resp = await (
      await this.cs.management()
    ).del("/v0/org/{org_id}/roles/{role_id}/tokens/{session_id}", {
      params: {
        path: {
          org_id: session.org_id,
          role_id: session.role_id,
          session_id: session.session_info.session_id,
        },
      },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /**
   * Returns whether it's time to refresh this token.
   * @return {boolean} Whether it's time to refresh this token.
   * @internal
   */
  async isStale(): Promise<boolean> {
    const session = await this.storage.retrieve();
    return this.hasExpired(session.session_info.auth_token_exp);
  }

  /**
   * Refreshes the session and **UPDATES/MUTATES** self.
   */
  async refresh(): Promise<void> {
    const session = await this.storage.retrieve();
    const csi = session.session_info;
    const resp = await this.#client.patch("/v1/org/{org_id}/token/refresh", {
      params: { path: { org_id: session.org_id } },
      body: <RefreshSignerSessionRequest>{
        epoch_num: csi.epoch,
        epoch_token: csi.epoch_token,
        other_token: csi.refresh_token,
      },
      parseAs: "json",
    });
    const data = assertOk(resp);
    await this.storage.save(<SignerSessionData>{
      ...session,
      session_info: data.session_info,
      token: data.token,
    });
    this.#client = this.createClient(data.token);
  }

  /**
   * Create a new signer session.
   * @param {CubeSigner} cs The CubeSigner instance
   * @param {SessionStorage<SignerSessionObject>} storage The session storage to use
   * @param {string} orgId Org ID
   * @param {string} roleId Role ID
   * @param {string} purpose The purpose of the session
   * @param {SignerSessionLifetime} ttl Lifetime settings
   * @return {Promise<SignerSessionManager>} New signer session
   */
  static async create(
    cs: CubeSigner,
    storage: SignerSessionStorage,
    orgId: string,
    roleId: string,
    purpose: string,
    ttl?: SignerSessionLifetime,
  ): Promise<SignerSessionManager> {
    const resp = await (
      await cs.management()
    ).post("/v0/org/{org_id}/roles/{role_id}/tokens", {
      params: { path: { org_id: orgId, role_id: roleId } },
      body: {
        purpose,
        auth_lifetime: ttl?.auth || defaultSignerSessionLifetime.auth,
        refresh_lifetime: ttl?.refresh || defaultSignerSessionLifetime.refresh,
        session_lifetime: ttl?.session || defaultSignerSessionLifetime.session,
      },
      parseAs: "json",
    });
    const data = assertOk(resp);
    const session_info = data.session_info;
    if (!session_info) {
      throw new Error("Signer session info missing");
    }
    await storage.save({
      org_id: orgId,
      role_id: roleId,
      purpose,
      token: data.token,
      session_info,
      // Keep compatibility with tokens produced by CLI
      env: {
        ["Dev-CubeSignerStack"]: cs.env,
      },
    });
    return new SignerSessionManager(cs, orgId, roleId, data.token, storage);
  }

  /**
   * Uses an existing session to create a new signer session manager.
   * @param {CubeSigner} cs The CubeSigner instance
   * @param {SessionStorage<SignerSessionObject>} storage The session storage to use
   * @return {Promise<SingerSession>} New signer session manager
   */
  static async loadFromStorage(
    cs: CubeSigner,
    storage: SignerSessionStorage,
  ): Promise<SignerSessionManager> {
    const session = await storage.retrieve();
    return new SignerSessionManager(cs, session.org_id, session.role_id, session.token, storage);
  }

  /**
   * Constructor.
   * @param {CubeSigner} cs CubeSigner
   * @param {string} orgId The id of the org associated with this session
   * @param {string} roleId The id of the role that this session assumes
   * @param {string} token The authorization token to use
   * @param {SignerSessionStorage} storage The session storage to use
   * @internal
   */
  private constructor(
    cs: CubeSigner,
    orgId: string,
    roleId: string,
    token: string,
    storage: SignerSessionStorage,
  ) {
    super(cs.env, orgId, storage);
    this.cs = cs;
    this.roleId = roleId;
    this.#client = this.createClient(token);
  }
}
