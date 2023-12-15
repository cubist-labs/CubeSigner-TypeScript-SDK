import {
  ClientSessionInfo,
  NewSessionResponse,
  RefreshSignerSessionRequest,
} from "../schema_types";
import { Client, OpClient } from "../api";
import { HasEnv, OrgSessionManager, SessionManager } from "./session_manager";
import { MemorySessionStorage, SessionStorage } from "./session_storage";
import { EventEmitter } from "../events";
import { EnvInterface } from "../env";
import { SessionExpiredError } from "../error";
import { operations } from "../schema";

/** JSON representation of our "signer session" file format */
export interface SignerSessionObject {
  /** The organization ID */
  org_id: string;
  /** The role ID */
  role_id?: string;
  /** The purpose of the session token */
  purpose?: string;
  /** The token to include in Authorization header */
  token: string;
  /** Session info */
  session_info: ClientSessionInfo;
  /** Session expiration (in seconds since UNIX epoch) beyond which it cannot be refreshed */
  session_exp: number | undefined; // may be missing in legacy session files
}

/**
 * Constructs {@link Date} from a number representing seconds since unix epoch.
 * @param {number} secs Seconds since unix epoch.
 * @return {Date} The equivalent date.
 */
function secondsSinceEpochToDate(secs: number): Date {
  return new Date(secs * 1000);
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
  /** Grace lifetime (in seconds). Defaults to 30 seconds (30). */
  grace?: number;
}

/** Manager for signer sessions. */
export class SignerSessionManager extends OrgSessionManager<SignerSessionData> {
  readonly #eventEmitter: EventEmitter;
  #client: { client: Client; token_exp: Date; session_exp?: Date };

  /**
   * @return {string} The current auth token.
   * @internal
   */
  async token(): Promise<string> {
    const session = await this.storage.retrieve();
    return session.token;
  }

  /**
   * Refreshes the current session if needed, then returns a client using the current session.
   *
   * May **UPDATE/MUTATE** self.
   *
   * @param {operations} operation The operation that this client will be
   *   used for. This parameter is used exclusively for more accurate error
   *   reporting and does not affect functionality.
   * @return {Client} The client with the current session
   */
  async client(operation?: keyof operations): Promise<Client> {
    await this.refreshIfNeeded();

    // trigger "session expired" if the session as a whole has expired
    // or if (for whatever reason) the token is still stale
    if (SessionManager.hasExpired(this.#client.token_exp) || this.hasExpired()) {
      await this.#eventEmitter.emitSessionExpired();
      throw new SessionExpiredError(operation);
    }

    return this.#client.client;
  }

  /** Revoke the session. */
  async revoke(): Promise<void> {
    const client = new OpClient("revokeCurrentSession", await this.client(), this.#eventEmitter);
    await client.del("/v0/org/{org_id}/session/self", {
      params: { path: { org_id: this.orgId } },
    });
  }

  /**
   * Return whether it's time to refresh this token.
   * @return {boolean} Whether it's time to refresh this token.
   * @internal
   */
  async isStale(): Promise<boolean> {
    return SessionManager.isStale(this.#client.token_exp);
  }

  /**
   * Return whether this session has expired and cannot be refreshed anymore.
   * @return {boolean} Whether this session has expired.
   * @internal
   */
  hasExpired(): boolean {
    return (
      (this.#client.session_exp || false) && SessionManager.hasExpired(this.#client.session_exp)
    );
  }

  /**
   * Refreshes the session and **UPDATES/MUTATES** self.
   */
  async refresh(): Promise<void> {
    if (this.hasExpired()) {
      await this.#eventEmitter.emitSessionExpired();
      throw new SessionExpiredError("signerSessionRefresh");
    }

    const currSession = await this.storage.retrieve();

    const client = new OpClient("signerSessionRefresh", this.#client.client, this.#eventEmitter);
    const csi = currSession.session_info;
    const data = await client.patch("/v1/org/{org_id}/token/refresh", {
      params: { path: { org_id: this.orgId } },
      body: <RefreshSignerSessionRequest>{
        epoch_num: csi.epoch,
        epoch_token: csi.epoch_token,
        other_token: csi.refresh_token,
      },
    });
    const newSession = <SignerSessionData>{
      ...currSession,
      session_info: data.session_info,
      token: data.token,
    };

    await this.storage.save(newSession);
    this.#client = {
      client: this.createClient(newSession.token),
      token_exp: secondsSinceEpochToDate(newSession.session_info.auth_token_exp),
      session_exp: newSession.session_exp
        ? secondsSinceEpochToDate(newSession.session_exp)
        : undefined,
    };
  }

  /**
   * @param {EnvInterface} env The CubeSigner environment
   * @param {string} orgId The organization ID
   * @param {NewSessionResponse} session The session information.
   * @param {SignerSessionStorage} storage The storage to use for saving the session.
   * @return {Promise<SignerSessionManager>} New signer session manager.
   */
  static async createFromSessionInfo(
    env: EnvInterface,
    orgId: string,
    session: NewSessionResponse,
    storage?: SignerSessionStorage,
  ): Promise<SignerSessionManager> {
    const sessionData = {
      env: {
        ["Dev-CubeSignerStack"]: env,
      },
      org_id: orgId,
      token: session.token,
      purpose: "sign via oidc",
      session_info: session.session_info,
      session_exp: session.expiration!,
    };
    storage ??= new MemorySessionStorage();
    await storage.save(sessionData);
    return await SignerSessionManager.loadFromStorage(storage);
  }

  /**
   * @param {SignerSessionData} sessionData The session information.
   * @param {SignerSessionStorage} storage The storage to use for saving the session.
   * @return {Promise<SignerSessionManager>} New signer session manager.
   */
  static async createFromSessionData(
    sessionData: SignerSessionData,
    storage?: SignerSessionStorage,
  ): Promise<SignerSessionManager> {
    storage ??= new MemorySessionStorage();
    await storage.save(sessionData);
    return await SignerSessionManager.loadFromStorage(storage);
  }

  /**
   * Uses an existing session to create a new signer session manager.
   *
   * @param {SignerSessionStorage} storage The session storage to use
   * @return {Promise<SingerSession>} New signer session manager
   */
  static async loadFromStorage(storage: SignerSessionStorage): Promise<SignerSessionManager> {
    const session = await storage.retrieve();
    return new SignerSessionManager(session, storage);
  }

  /**
   * Constructor.
   *
   * @param {SignerSessionData} sessionData Session data
   * @param {SignerSessionStorage} storage The session storage to use.
   */
  protected constructor(sessionData: SignerSessionData, storage: SignerSessionStorage) {
    super(sessionData.env["Dev-CubeSignerStack"], sessionData.org_id, storage);
    this.#eventEmitter = new EventEmitter([this.events]);
    this.#client = {
      client: this.createClient(sessionData.token),
      token_exp: secondsSinceEpochToDate(sessionData.session_info.auth_token_exp),
      session_exp: sessionData.session_exp
        ? secondsSinceEpochToDate(sessionData.session_exp)
        : undefined,
    };
  }
}
