import { ErrResponse } from "./error";

export type EventHandler<T> = (event: T) => Promise<void>;
export type ErrorEvent = ErrResponse;
export interface SessionExpiredEvent {}

/**
 * Dispatcher for a single event type.
 *
 * Provides methods for registering and unregistering handlers,
 * as well as dispatching events to all registered handlers.
 */
class EventDispatcher<T> {
  readonly #handlers: EventHandler<T>[];

  /**
   * Constructor.
   */
  constructor() {
    this.#handlers = [];
  }

  /**
   * Register a new handler.
   *
   * @param {EventHandler<T>} handler Event handler to register
   * @return {EventDispatcher<T>} This instance to allow for chaining.
   */
  register(handler: EventHandler<T>): EventDispatcher<T> {
    this.#handlers.push(handler);
    return this;
  }

  /**
   * Unregister a handler. If {@link handler} is not already registered, it's a no-op.
   *
   * @param {EventHandler<T>} handler Event handler to unregister
   * @return {boolean} Whether the handler was found (and unregistered).
   */
  unregister(handler: EventHandler<T>): boolean {
    const idx = this.#handlers.indexOf(handler);
    if (idx >= 0) {
      this.#handlers.splice(idx, 1);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Dispatch an event to all registered handlers.
   * @param {T} event Event to dispatch.
   */
  async dispatch(event: T): Promise<void> {
    await Promise.all(this.#handlers.map((h) => h(event)));
  }
}

const SessionExpiredRegexes = [
  /^Session '(?<purpose>[^']*)' for '(?<identity>[^']*)' has expired$/,
  /^Session '(?<purpose>[^']*)' for '(?<identity>[^']*)' has been revoked$/,
  /^Auth token for epoch (?<epoch>\d+) has expired$/,
  /^Refresh token for epoch (?<epoch_num>\d+) has expired$/,
  /^Outdated session$/,
];

/**
 * Whether an error message matches one of several different "session expired" responses.
 *
 * @param {string} msg The string to test.
 * @return {boolean} Whether the string matches.
 * @internal Exported only so that it can be called from a unit test
 */
export function messageMatchesSessionExpired(msg: string): boolean {
  return SessionExpiredRegexes.some((re) => re.test(msg));
}

/**
 * Class for registering and unregistering event handlers.
 */
export class Events {
  readonly #onError = new EventDispatcher<ErrorEvent>();
  readonly #onSessionExpired = new EventDispatcher<SessionExpiredEvent>();

  /**
   * Register a handler for {@link ErrorEvent}: triggered every time a request to
   * a CubeSigner API endpoint returns a non-success response.
   *
   * @param {EventHandler<ErrorEvent>} handler The handler to register.
   */
  onError(handler: EventHandler<ErrorEvent>) {
    this.#onError.register(handler);
  }

  /**
   * Register a handler for {@link SessionExpiredEvent}: triggered every time a
   * request to a CubeSigner API endpoint fails because of an expired session.
   *
   * @param {EventHandler<SessionExpiredEvent>} handler The handler to register.
   */
  onSessionExpired(handler: EventHandler<SessionExpiredEvent>) {
    this.#onSessionExpired.register(handler);
  }

  /**
   * Unregister a handler for {@link ErrorEvent}.
   *
   * @param {EventHandler<ErrorEvent>} handler The handler to unregister.
   * @return {boolean} Whether the handler was found (and unregistered).
   */
  unregisterOnError(handler: EventHandler<ErrorEvent>): boolean {
    return this.#onError.unregister(handler);
  }

  /**
   * Unregister a handler for {@link SessionExpiredEvent}.
   *
   * @param {EventHandler<SessionExpiredEvent>} handler The handler to unregister.
   * @return {boolean} Whether the handler was found (and unregistered).
   */
  unregisterOnSessionExpired(handler: EventHandler<SessionExpiredEvent>): boolean {
    return this.#onSessionExpired.unregister(handler);
  }

  /** @internal */
  async triggerSessionExpired() {
    await this.#onSessionExpired.dispatch(<SessionExpiredEvent>{});
  }

  /**
   * @param {ErrorEvent} event Event to trigger
   * @internal
   */
  async triggerErrorEvent(event: ErrorEvent) {
    await this.#onError.dispatch(event);
  }
}

/**
 * Used to classify and emit events to one or more {@link Events} instances.
 */
export class EventEmitter {
  readonly #events: Events[];

  /**
   *
   * @param {Events[]} events Instances to which to emit events
   * @param {boolean} skipGlobal Whether to include the global events instance {@link GlobalEvents}
   */
  constructor(events: Events[], skipGlobal?: boolean) {
    skipGlobal ??= false;
    this.#events = events;
    if (!skipGlobal) {
      this.#events.push(GlobalEvents);
    }
  }

  /**
   * Called by {@link CubeSignerApi} when an API response indicates an error.
   *
   * @param {ErrorEvent} err The error to dispatch.
   * @internal
   */
  async classifyAndEmitError(err: ErrorEvent) {
    for (const ev of this.#events) {
      await ev.triggerErrorEvent(err);
    }

    // if status is 403 and error matches one of the SessionExpiredRegexes trigger onSessionExpired
    //
    // TODO: because errors returned by the authorizer lambda are not forwarded to the client
    //       we also trigger onSessionExpired when "signerSessionRefresh" fails
    if (
      err.status === 403 &&
      (messageMatchesSessionExpired(err.message) || err.operation == "signerSessionRefresh")
    ) {
      await this.emitSessionExpired();
    }
  }

  /**
   * Called by {@link SignerSessionManager} to notify that the session is expired
   * beyond the possibility of refreshing, meaning that full re-login is required.
   *
   * @internal
   */
  async emitSessionExpired() {
    for (const e of this.#events) {
      await e.triggerSessionExpired();
    }
  }
}

/**
 * Global events.
 */
export const GlobalEvents = new Events();
