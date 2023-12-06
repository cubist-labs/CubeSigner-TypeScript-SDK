import { Events } from "../events";
import { EnvInterface } from "../env";
import { Client, createHttpClient } from "../api";
import { SessionStorage } from "./session_storage";

const DEFAULT_EXPIRATION_BUFFER_SECS = 30;

/** Generic session manager interface. */
export abstract class SessionManager<U> {
  readonly env: EnvInterface;
  readonly storage: SessionStorage<U>;
  readonly events = new Events();

  /**
   * @return {string} The current auth token.
   * @internal
   */
  abstract token(): Promise<string>;

  /** Returns a client instance that uses the token. */
  abstract client(): Promise<Client>;

  /** Revokes the session. */
  abstract revoke(): Promise<void>;

  /** Refreshes the session. */
  abstract refresh(): Promise<void>;

  /**
   * Returns whether it's time to refresh this token.
   * @return {boolean} Whether it's time to refresh this token.
   * @internal
   */
  abstract isStale(): Promise<boolean>;

  /**
   * Refreshes the session if it is about to expire.
   * @return {boolean} Whether the session token was refreshed.
   * @internal
   */
  async refreshIfNeeded(): Promise<boolean> {
    if (await this.isStale()) {
      await this.refresh();
      return true;
    }
    return false;
  }

  /**
   * Automatically refreshes the session in the background.
   * The default implementation refreshes (if needed) every minute.
   * Base implementations can, instead use the token expirations timestamps
   * to refresh less often. This is a simple wrapper around `setInterval`.
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
   * Constructor.
   * @param {EnvInterface} env The environment of the session
   * @param {SessionStorage<U>} storage The storage back end to use for storing
   *                                    session information
   */
  constructor(env: EnvInterface, storage: SessionStorage<U>) {
    this.env = env;
    this.storage = storage;
  }

  /**
   * Creates a new REST client with a given token
   * @param {string} token The authorization token to use for the client
   * @return {Client} The new REST client
   */
  protected createClient(token: string): Client {
    return createHttpClient(this.env.SignerApiRoot, token);
  }

  /**
   * Check if a timestamp has expired.
   * @param {Date} exp The timestamp to check
   * @param {number} bufferSeconds Time buffer in seconds (defaults to 30s)
   * @return {boolean} True if the timestamp has expired
   */
  protected static hasExpired(exp: Date, bufferSeconds?: number): boolean {
    bufferSeconds ??= DEFAULT_EXPIRATION_BUFFER_SECS;
    const expMsSinceEpoch = exp.getTime();
    const nowMsSinceEpoch = new Date().getTime();
    const bufferMs = bufferSeconds * 1000;
    return expMsSinceEpoch < nowMsSinceEpoch + bufferMs;
  }

  /**
   * Throws an error that says that some feature is unsupported.
   * @param {string} name The name of the feature that is not supported
   */
  protected unsupported(name: string): never {
    throw new Error(`'${name}' not supported`);
  }
}

/** Interface for a session manager that knows about the org that the session is in. */
export abstract class OrgSessionManager<U> extends SessionManager<U> {
  readonly orgId: string;

  /**
   * Constructor.
   * @param {EnvInterface} env The environment of the session
   * @param {string} orgId The id of the org associated with this session
   * @param {SessionStorage<U>} storage The storage back end to use for storing
   *                                    session information
   */
  constructor(env: EnvInterface, orgId: string, storage: SessionStorage<U>) {
    super(env, storage);
    this.orgId = orgId;
  }
}

export interface HasEnv {
  /** The environment */
  env: {
    ["Dev-CubeSignerStack"]: EnvInterface;
  };
}

/** Type of the refresh timer ID. */
export type RefreshId = ReturnType<typeof setInterval>;
