import { ErrResponse } from "./error";
export type EventHandler<T> = (event: T) => Promise<void>;
export type ErrorEvent = ErrResponse;
export interface SessionExpiredEvent {
}
/**
 * Whether an error message matches one of several different "session expired" responses.
 *
 * @param {string} msg The string to test.
 * @return {boolean} Whether the string matches.
 * @internal Exported only so that it can be called from a unit test
 */
export declare function messageMatchesSessionExpired(msg: string): boolean;
/**
 * Class for registering and unregistering event handlers.
 */
export declare class Events {
    #private;
    /**
     * Register a handler for {@link ErrorEvent}: triggered every time a request to
     * a CubeSigner API endpoint returns a non-success response.
     *
     * @param {EventHandler<ErrorEvent>} handler The handler to register.
     */
    onError(handler: EventHandler<ErrorEvent>): void;
    /**
     * Register a handler for {@link SessionExpiredEvent}: triggered every time a
     * request to a CubeSigner API endpoint fails because of an expired session.
     *
     * @param {EventHandler<SessionExpiredEvent>} handler The handler to register.
     */
    onSessionExpired(handler: EventHandler<SessionExpiredEvent>): void;
    /**
     * Unregister a handler for {@link ErrorEvent}.
     *
     * @param {EventHandler<ErrorEvent>} handler The handler to unregister.
     * @return {boolean} Whether the handler was found (and unregistered).
     */
    unregisterOnError(handler: EventHandler<ErrorEvent>): boolean;
    /**
     * Unregister a handler for {@link SessionExpiredEvent}.
     *
     * @param {EventHandler<SessionExpiredEvent>} handler The handler to unregister.
     * @return {boolean} Whether the handler was found (and unregistered).
     */
    unregisterOnSessionExpired(handler: EventHandler<SessionExpiredEvent>): boolean;
    /** @internal */
    triggerSessionExpired(): Promise<void>;
    /**
     * @param {ErrorEvent} event Event to trigger
     * @internal
     */
    triggerErrorEvent(event: ErrorEvent): Promise<void>;
}
/**
 * Used to classify and emit events to one or more {@link Events} instances.
 */
export declare class EventEmitter {
    #private;
    /**
     *
     * @param {Events[]} events Instances to which to emit events
     * @param {boolean} skipGlobal Whether to include the global events instance {@link GlobalEvents}
     */
    constructor(events: Events[], skipGlobal?: boolean);
    /**
     * Called by {@link CubeSignerApi} when an API response indicates an error.
     *
     * @param {ErrorEvent} err The error to dispatch.
     * @internal
     */
    classifyAndEmitError(err: ErrorEvent): Promise<void>;
    /**
     * Called by {@link SignerSessionManager} to notify that the session is expired
     * beyond the possibility of refreshing, meaning that full re-login is required.
     *
     * @internal
     */
    emitSessionExpired(): Promise<void>;
}
/**
 * Global events.
 */
export declare const GlobalEvents: Events;
