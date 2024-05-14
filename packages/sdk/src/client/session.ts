import type { EnvInterface } from "../env";
import { apiFetch, assertOk } from "../fetch";
import { retryOn5XX } from "../retry";
import type { ClientSessionInfo } from "../schema_types";

export interface SessionLifetime {
  /** Session lifetime (in seconds). Defaults to one week (604800). */
  session?: number;
  /** Auth token lifetime (in seconds). Defaults to five minutes (300). */
  auth: number;
  /** Refresh token lifetime (in seconds). Defaults to one day (86400). */
  refresh?: number;
  /** Grace lifetime (in seconds). Defaults to 30 seconds (30). */
  grace?: number;
}

/** JSON representation of the CubeSigner session file format */
export interface SessionData {
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

// Rather than just doing a simple Pick, we go the extra mile to ensure that
// any metadata object MUST NEVER include sensitive information
type SafeSessionDataFields = "env" | "org_id" | "role_id" | "purpose" | "session_exp";

/** Non-sensitive info about a session */
export type SessionMetadata = Pick<SessionData, SafeSessionDataFields> & {
  [K in Exclude<keyof SessionData, SafeSessionDataFields>]?: never;
} & { session_id: string; epoch: number };

/**
 * A SessionManager's job is to handle session persistence and refreshes
 *
 * The interface does not impose *when* a refresh must occur, though typically
 * this will be on request.
 */
export interface SessionManager {
  /**
   * Load the metadata for the session. Should throw if not available
   *
   * @return {SessionMetadata} Info about the session
   *
   * @throws {NoSessionFoundError} If the session is not available
   */
  metadata(): Promise<SessionMetadata>;

  /**
   * Load the token to be used for a request. This will be invoked by the client
   * to provide the Authorization header
   *
   * @return {SessionMetadata} Info about the session
   *
   * @throws {NoSessionFoundError} If the session is not available
   */
  token(): Promise<string>;
}

/**
 * A template for session managers which have exclusive access to a session
 * and can store/load them freely.
 *
 * It is NOT suitable for applications where multiple clients are using the same
 * session as they will both attempt to refresh independently.
 */
export abstract class ExclusiveSessionManager implements SessionManager {
  /** If present, the session is currently refreshing. Await to get the freshest SessionData */
  #refreshing?: Promise<SessionData>;

  /**
   * Retrieve the SessionData from storage
   */
  abstract retrieve(): Promise<SessionData>;

  /**
   * Store the SessionData into storage
   * @param data The data to store
   */
  abstract store(data: SessionData): Promise<void>;

  /**
   * Loads the session metadata from storage
   * @return {Promise<SessionMetadata>}
   */
  metadata(): Promise<SessionMetadata> {
    return this.retrieve().then(metadata);
  }

  /**
   * Loads the token from storage, refreshing if necessary
   * @return {Promise<SessionMetadata>}
   */
  async token(): Promise<string> {
    const data = await this.retrieve();

    this.#refreshing ??= refreshIfNecessary(data)
      ?.then(async (data) => (await this.store(data), data))
      ?.finally(() => (this.#refreshing = undefined));

    // Technically, in many cases we shouldn't have to wait for the refresh,
    // the session will still be valid for a while after the refresh starts.
    //
    // However, sometimes the auth token will be entirely expired, so we conservatively
    // wait for a successful refresh
    const session = this.#refreshing ? await this.#refreshing : data;
    return session.token;
  }

  /**
   * Manually force a token refresh
   *
   * @return {SessionData} The newly refreshed session data
   * @internal
   */
  async forceRefresh(): Promise<SessionData> {
    // If not currently refreshing, start refreshing
    this.#refreshing ??= this.retrieve()
      .then(refresh)
      .then(async (data) => (await this.store(data), data))
      .finally(() => (this.#refreshing = undefined));

    // Because we ??= assigned to refreshing above, we're guaranteed to be
    // actively refreshing, so just await it.
    return await this.#refreshing;
  }
}

/** Implements a SessionManager without persistence */
export class MemorySessionManager extends ExclusiveSessionManager {
  /** The session data containing both metadata and tokens */
  #data: SessionData;

  /**
   * Construct with data in memory
   * @param {SessionData} data The initial session data
   */
  constructor(data: SessionData) {
    super();
    this.#data = data;
  }

  /** Return the in-memory data */
  async retrieve(): Promise<SessionData> {
    return this.#data;
  }

  /**
   * Store the in-memory data
   * @param {SessionData} data The session data to store
   */
  async store(data: SessionData) {
    this.#data = data;
  }
}

/** An error type to be thrown by SessionManager's when the session is unavailable */
export class NoSessionFoundError extends Error {
  /** Constructs the error with the appropriate message */
  constructor() {
    super("No session available for the client");
  }
}

/** The number of seconds before expiration time, to attempt a refresh */
export const DEFAULT_EXPIRATION_BUFFER_SECS = 30;

/**
 * A utility function that refreshes a session using the CubeSigner API if it is close
 * to expiring.
 *
 * @param {SessionData} session The session data which may require a refresh
 * @return {undefined | Promise<SessionData>} Immediately returns undefined if the session does not require a refresh
 */
function refreshIfNecessary(session: SessionData): undefined | Promise<SessionData> {
  if (!isStale(session)) return;
  return refresh(session);
}

/**
 * Invokes the CubeSigner API to refresh a session
 * @param {SessionData} session
 * @return {SessionData}
 */
export function refresh(session: SessionData): Promise<SessionData> {
  const { epoch: epoch_num, epoch_token, refresh_token: other_token } = session.session_info;
  return retryOn5XX(() =>
    apiFetch("/v1/org/{org_id}/token/refresh", "patch", {
      baseUrl: session.env["Dev-CubeSignerStack"].SignerApiRoot.replace(/\/$/, ""),
      params: {
        path: {
          org_id: session.org_id,
        },
      },
      headers: {
        Authorization: session.token,
      },
      body: { epoch_num, epoch_token, other_token },
    }),
  )
    .then(assertOk)
    .then((res) => ({
      ...session,
      ...res,
    }));
}

/**
 * Get the safe metadata from a SessionData
 * @param {SessionData} session The session
 * @return {SessionMetadata} The session metadata
 */
export function metadata(session: SessionData): SessionMetadata {
  const { env, org_id, role_id, purpose, session_exp } = session;
  return {
    env,
    org_id,
    role_id,
    purpose,
    session_id: session.session_info.session_id,
    session_exp,
    epoch: session.session_info.epoch,
  };
}

/**
 * @param {number} timeInSeconds an epoch timestamp
 * @return {bool} whether or not the timestamp is before now + DEFAULT_EXPIRATION_BUFFER_SECS
 */
const isWithinBuffer = (timeInSeconds: number) =>
  timeInSeconds < Date.now() / 1000 + DEFAULT_EXPIRATION_BUFFER_SECS;

export const isStale = (session: SessionData): boolean =>
  isWithinBuffer(session.session_info.auth_token_exp);

export const isRefreshable = (session: SessionData): boolean =>
  !isWithinBuffer(session.session_exp ?? Number.POSITIVE_INFINITY) &&
  !isWithinBuffer(session.session_info.refresh_token_exp);

/**
 * Parses the base64 API session token.
 * Consumes the output of the cli command:
 *
 * ```
 * cs token create --output base64
 * ```
 *
 * @param {string} sessionDataString Base64 encoded API session token.
 *
 * @return {SignerSessionData} session.
 */
export function parseBase64SessionData(sessionDataString: string): SessionData {
  // parse token, stripping whitespace.
  const secretB64Token = sessionDataString.replace(/\s/g, "");
  return JSON.parse(atob(secretB64Token)) as SessionData;
}
