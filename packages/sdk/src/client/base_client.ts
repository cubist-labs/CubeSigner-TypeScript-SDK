import type {
  EnvInterface,
  NewSessionResponse,
  SessionManager,
  SessionMetadata,
  SessionData,
} from "..";
import { ErrResponse, metadata, MemorySessionManager, parseBase64SessionData } from "..";
import type { FetchResponseSuccessData, Op, Operation, SimpleOptions } from "../fetch";
import { assertOk } from "../fetch";
import { retryOn5XX } from "../retry";
import { NAME, VERSION } from "../index";
import { EventEmitter } from "../events";

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
   * @param {StaticClientSubclass<T>} this Allows this static method to return subtypes when invoked through them
   * @param {SessionManager | SessionData | string} session  The session (object or base64 string) or manager that will back this client
   * @return {T} A Client
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
   * @param {SessionMetadata} [sessionMeta] The initial session metadata
   * @param {SessionManager} [manager] The manager for the current session
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
   * @param {SimpleOptions} opts The user-supplied opts
   * @return {SimpleOptions} The union of the user-supplied opts and the default ones
   */
  async #applyOptions<T extends Operation>(
    opts: OmitAutoParams<SimpleOptions<T>>,
  ): Promise<SimpleOptions<T>> {
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
        Authorization: await this.#sessionManager.token(),
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
   * @param {ErrorEvent} err The error to classify
   */
  async #classifyAndEmitError(err: ErrorEvent) {
    this.emit("error", err);
    ALL_EVENTS.emit("error", err);

    if (err.isUserMfaError()) {
      this.emit("user-mfa-failed", err);
      ALL_EVENTS.emit("user-mfa-failed", err);
    }

    // if status is 403 and error matches one of the "invalid session" error codes trigger onSessionExpired
    //
    // TODO: because errors returned by the authorizer lambda are not forwarded to the client
    //       we also trigger onSessionExpired when "signerSessionRefresh" fails
    if (
      err.status === 403 &&
      (err.isSessionExpiredError() || err.operation == "signerSessionRefresh")
    ) {
      this.emit("session-expired", err);
      ALL_EVENTS.emit("user-mfa-failed", err);
    }
  }

  /**
   * Executes an op using the state of the client (auth headers & org_id) with retries
   *
   * @param {Op<T>} op The API operation you wish to perform
   * @param {SimpleOptions<T>} opts The parameters for the operation
   * @return {FetchResponseSuccessData<T>} A promise for the successful result (errors will be thrown)
   */
  exec<T extends Operation>(
    op: Op<T>,
    opts: OmitAutoParams<SimpleOptions<T>>,
  ): Promise<FetchResponseSuccessData<T>> {
    return retryOn5XX(() => this.#applyOptions(opts).then(op))
      .then(assertOk) // Once we have a non-5XX response, we will assertOk (either throwing or yielding the reponse)
      .catch(async (e) => {
        if (e instanceof ErrResponse) {
          await this.#classifyAndEmitError(e); // Emit appropriate events
        }
        throw e; // Rethrow the error
      });
  }
}

/**
 * Upgrade a session response into a full SessionData by incorporating
 * elements of an existing SessionData
 * @param {SessionData} meta An existing SessionData
 * @param {NewSessionResponse} info A new session created via the API
 * @param {object} ctx Additional manual overrides
 * @return {SessionData}
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
