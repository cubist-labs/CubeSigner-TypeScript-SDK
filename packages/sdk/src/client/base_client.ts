import pkg from "../../package.json";
import type { FetchResponseSuccessData, Op, Operation, SimpleOptions } from "../fetch";
import { assertOk } from "../fetch";
import { retry } from "../retry";
import { EventEmitter } from "../events";
import { ErrResponse } from "../error";
import type { SessionData, SessionManager, SessionMetadata } from "./session";
import { MemorySessionManager, metadata, parseBase64SessionData } from "./session";
import type { NewSessionResponse, ErrorResponse } from "../schema_types";
import type { EnvInterface } from "../env";

/** CubeSigner SDK package name */
export const NAME: string = pkg.name;

/** CubeSigner SDK version */
export const VERSION: string = pkg.version;

export type ErrorEvent = ErrResponse;

/** Event emitted when a request fails because of an expired/invalid session */
export class SessionExpiredEvent {}

/** Event emitted when a request fails because user failed to answer an MFA challenge */
export class UserMfaFailedEvent extends ErrResponse {}

type ClientEvents = {
  "user-mfa-failed": (ev: UserMfaFailedEvent) => void;
  "session-expired": (ev: SessionExpiredEvent) => void;
  error: (ev: ErrorEvent) => void;
};

type StaticClientSubclass<T> = {
  new (...args: ConstructorParameters<typeof BaseClient>): T;
} & typeof BaseClient;

/**
 * An event emitter for all clients
 *
 * @deprecated
 */
export const ALL_EVENTS: EventEmitter<ClientEvents> = new EventEmitter();

/**
 * Implements a retry strategy and session refreshes
 */
export class BaseClient extends EventEmitter<ClientEvents> {
  /** Information about the session contained within the client */
  sessionMeta: SessionMetadata;

  /** Session persistence */
  #sessionManager: SessionManager;

  /** MUTABLE configuration */
  config: { updateRetryDelaysMs: number[] } = {
    /** Update retry delays */
    updateRetryDelaysMs: [100, 200, 400],
  };

  /** Get the env */
  get env(): EnvInterface {
    return this.sessionMeta.env["Dev-CubeSignerStack"];
  }

  /**
   * Construct a client with a session or session manager
   *
   * @param this Allows this static method to return subtypes when invoked through them
   * @param session  The session (object or base64 string) or manager that will back this client
   * @returns A Client
   */
  static async create<T>(
    this: StaticClientSubclass<T>,
    session: string | SessionManager | SessionData,
  ): Promise<T> {
    const sessionObj: SessionManager | SessionData =
      typeof session === "string" ? parseBase64SessionData(session) : session;

    if (typeof sessionObj.token === "function") {
      const manager = sessionObj as SessionManager;
      return new this(await manager.metadata(), manager);
    } else {
      session = sessionObj as SessionData;
      return new this(metadata(session), new MemorySessionManager(session));
    }
  }

  /**
   * @param sessionMeta The initial session metadata
   * @param manager The manager for the current session
   *
   * @internal
   */
  constructor(sessionMeta: SessionMetadata, manager: SessionManager) {
    super();
    this.#sessionManager = manager;
    this.sessionMeta = sessionMeta;
  }

  /** The organization ID */
  get orgId() {
    return this.sessionMeta.org_id;
  }

  /**
   * Apply the session's implicit arguments on top of what was provided
   *
   * @param token The authorization token to use for the request
   * @param opts The user-supplied opts
   * @returns The union of the user-supplied opts and the default ones
   */
  #applyOptions<T extends Operation>(
    token: string,
    opts: OmitAutoParams<SimpleOptions<T>>,
  ): SimpleOptions<T> {
    const pathParams = "path" in (opts.params ?? {}) ? opts.params?.path : undefined;
    const baseUrl = this.env.SignerApiRoot.replace(/\/$/, "");

    return {
      cache: "no-store",
      // If we have an activeSession, let it dictate the baseUrl. Otherwise fall back to the one set at construction
      baseUrl,
      ...opts,
      headers: {
        "User-Agent": `${NAME}@${VERSION}`,
        "X-Cubist-Ts-Sdk": `${NAME}@${VERSION}`,
        Authorization: token,
        ...opts.headers,
      },
      params: {
        ...opts.params,
        path: {
          org_id: this.sessionMeta.org_id,
          ...pathParams,
        },
      },
    } as unknown as SimpleOptions<T>;
  }

  /**
   * Emits specific error events when a request failed
   *
   * @param err The error to classify
   */
  async #classifyAndEmitError(err: ErrorEvent) {
    this.emit("error", err);
    ALL_EVENTS.emit("error", err);

    if (err.isUserMfaError()) {
      const ev = "user-mfa-failed";
      this.emit(ev, err);
      ALL_EVENTS.emit(ev, err);
    }

    // if status is 403 and error matches one of the "invalid session" error codes trigger onSessionExpired
    //
    // TODO: because errors returned by the authorizer lambda are not forwarded to the client
    //       we also trigger onSessionExpired when "signerSessionRefresh" fails
    if (
      err.status === 403 &&
      (err.isSessionExpiredError() || err.operation == "signerSessionRefresh")
    ) {
      const ev = "session-expired";
      this.emit(ev, err);
      ALL_EVENTS.emit(ev, err);
    }
  }

  /**
   * Executes an op using the state of the client (auth headers & org_id) with retries
   *
   * @internal
   * @param op The API operation you wish to perform
   * @param opts The parameters for the operation
   * @returns A promise for the successful result (errors will be thrown)
   */
  async exec<T extends Operation>(
    op: Op<T>,
    opts: OmitAutoParams<SimpleOptions<T>>,
  ): Promise<FetchResponseSuccessData<T>> {
    try {
      let token = await this.#sessionManager.token();
      const resp = await retry(() => op(this.#applyOptions(token, opts)), {
        pred: async (resp) => {
          const status = resp.response.status;
          const error = resp.error as ErrorResponse | undefined;
          const requestId = error?.request_id;

          // If we get a "Forbidden" error, erase the cached token
          //
          // TODO: Check error codes once our API returns error codes for
          // authorization failures
          if (
            status === 403 &&
            requestId === undefined &&
            this.#sessionManager.onInvalidToken !== undefined
          ) {
            this.#sessionManager.onInvalidToken();
            const oldToken = token;
            token = await this.#sessionManager.token();
            return token !== oldToken;
          }

          // Also retry server-side errors
          return status >= 500 && status < 600;
        },
      });
      // Once we have a non-5XX response, we will assertOk (either throwing or yielding the reponse)
      return assertOk(resp);
    } catch (e) {
      if (e instanceof ErrResponse) {
        await this.#classifyAndEmitError(e); // Emit appropriate events
      }
      throw e; // Rethrow the error
    }
  }
}

/**
 * Upgrade a session response into a full SessionData by incorporating
 * elements of an existing SessionData
 *
 * @param meta An existing SessionData
 * @param info A new session created via the API
 * @param ctx Additional manual overrides
 * @returns
 */
export function signerSessionFromSessionInfo(
  meta: SessionMetadata,
  info: NewSessionResponse,
  ctx: Partial<{ purpose: string; role_id: string }>,
): SessionData {
  return {
    env: meta.env,
    org_id: meta.org_id,
    session_exp: info.expiration,
    session_info: info.session_info,
    token: info.token,
    refresh_token: info.refresh_token,
    purpose: meta.purpose,
    role_id: meta.role_id,
    ...ctx,
  };
}

type DeepOmit<A, B> = [A, B] extends [object, object]
  ? {
      [K in keyof A as K extends keyof B // If the key is in both A and B
        ? A[K] extends B[K]
          ? K //
          : never
        : never]?: K extends keyof B ? DeepOmit<A[K], B[K]> : never;
    } & {
      [K in keyof A as K extends keyof B ? (B[K] extends A[K] ? never : K) : K]: K extends keyof B
        ? DeepOmit<A[K], B[K]>
        : A[K];
    }
  : A;

export type OmitAutoParams<O> = DeepOmit<
  O,
  {
    baseUrl: string;
    params: { path: { org_id: string } };
  }
> & { params?: { path?: Record<string, unknown> } };
