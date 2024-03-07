import { Events } from "../events";
import { EnvInterface } from "../env";
import { Client, createHttpClient, OpClient } from "../api";
import { MemorySessionStorage, SessionStorage } from "./session_storage";
import { delay } from "../util";
import {
  ClientSessionInfo,
  NewSessionResponse,
  RefreshSignerSessionRequest,
} from "../schema_types";
import { EventEmitter } from "../events";
import { SessionExpiredError } from "../error";
import { operations } from "../schema";

const DEFAULT_EXPIRATION_BUFFER_SECS = 30;

/** JSON representation of our "signer session" file format */
export interface SignerSessionData {
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
  /** The environment */
  env: {
    ["Dev-CubeSignerStack"]: EnvInterface;
  };
}

/**
 * Constructs {@link Date} from a number representing seconds since unix epoch.
 * @param {number} secs Seconds since unix epoch.
 * @return {Date} The equivalent date.
 */
function secondsSinceEpochToDate(secs: number): Date {
  return new Date(secs * 1000);
}

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

/** Generic session manager interface. */
export class SignerSessionManager {
  readonly env: EnvInterface;
  readonly orgId: string;
  readonly storage: SignerSessionStorage;
  readonly events = new Events();
  readonly #eventEmitter: EventEmitter;
  #refreshing: boolean = false;
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
    if (SignerSessionManager.#hasTimestampExpired(this.#client.token_exp) || this.hasExpired()) {
      await this.#eventEmitter.emitSessionExpired();
      throw new SessionExpiredError(operation);
    }

    return this.#client.client;
  }

  /** Revokes the session. */
  async revoke(): Promise<void> {
    const client = new OpClient("revokeCurrentSession", await this.client(), this.#eventEmitter);
    await client.del("/v0/org/{org_id}/session/self", {
      params: { path: { org_id: this.orgId } },
    });
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
      client: this.#createClient(newSession.token),
      token_exp: secondsSinceEpochToDate(newSession.session_info.auth_token_exp),
      session_exp: newSession.session_exp
        ? secondsSinceEpochToDate(newSession.session_exp)
        : undefined,
    };
  }

  /**
   * Returns whether it's time to refresh this token.
   * @return {boolean} Whether it's time to refresh this token.
   * @internal
   */
  async isStale(): Promise<boolean> {
    return SignerSessionManager.#hasTimestampExpired(
      this.#client.token_exp,
      DEFAULT_EXPIRATION_BUFFER_SECS,
    );
  }

  /**
   * Return whether this session has expired and cannot be refreshed anymore.
   * @return {boolean} Whether this session has expired.
   * @internal
   */
  hasExpired(): boolean {
    return (
      (this.#client.session_exp || false) &&
      SignerSessionManager.#hasTimestampExpired(this.#client.session_exp)
    );
  }

  /**
   * Refreshes the session if it is about to expire.
   * @return {boolean} Whether the session token was refreshed.
   * @internal
   */
  async refreshIfNeeded(): Promise<boolean> {
    if (await this.isStale()) {
      if (this.#refreshing) {
        // wait until done refreshing
        while (this.#refreshing) {
          await delay(100);
        }
        return false;
      } else {
        // refresh
        this.#refreshing = true;
        try {
          await this.refresh();
          return true;
        } finally {
          this.#refreshing = false;
        }
      }
    }

    return false;
  }

  /**
   * Automatically refreshes the session in the background (if needed) every
   * minute. This is a simple wrapper around `setInterval`.
   * @return {number} The interval ID of the refresh timer.
   */
  autoRefresh(): RefreshId {
    return setInterval(async () => {
      await this.refreshIfNeeded();
    }, 60 * 1000);
  }

  /**
   * Clears the auto refresh timer.
   * @param {number} timer The timer ID to clear.
   */
  clearAutoRefresh(timer: RefreshId): void {
    clearInterval(timer);
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
    return new SignerSessionManager(sessionData, storage);
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
    return new SignerSessionManager(sessionData, storage);
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
   * @param {SignerSessionData} sessionData Session data
   * @param {SignerSessionStorage} storage The session storage to use.
   */
  constructor(sessionData: SignerSessionData, storage: SignerSessionStorage) {
    this.env = sessionData.env["Dev-CubeSignerStack"];
    this.orgId = sessionData.org_id;
    this.storage = storage;
    this.#eventEmitter = new EventEmitter([this.events]);
    this.#client = {
      client: this.#createClient(sessionData.token),
      token_exp: secondsSinceEpochToDate(sessionData.session_info.auth_token_exp),
      session_exp: sessionData.session_exp
        ? secondsSinceEpochToDate(sessionData.session_exp)
        : undefined,
    };
  }

  /**
   * Creates a new REST client with a given token
   * @param {string} token The authorization token to use for the client
   * @return {Client} The new REST client
   */
  #createClient(token: string): Client {
    return createHttpClient(this.env.SignerApiRoot, token);
  }

  /**
   * Check if a timestamp is within {@link bufferSeconds} seconds from expiration.
   * @param {Date} exp The timestamp to check
   * @param {number} bufferSeconds Time buffer in seconds (defaults to 0s)
   * @return {boolean} True if the timestamp has expired
   */
  static #hasTimestampExpired(exp: Date, bufferSeconds?: number): boolean {
    bufferSeconds ??= 0;
    const expMsSinceEpoch = exp.getTime();
    const nowMsSinceEpoch = new Date().getTime();
    const bufferMs = bufferSeconds * 1000;
    return expMsSinceEpoch < nowMsSinceEpoch + bufferMs;
  }
}

/** Type of the refresh timer ID. */
export type RefreshId = ReturnType<typeof setInterval>;
