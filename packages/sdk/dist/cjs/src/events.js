"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _EventDispatcher_handlers, _Events_onError, _Events_onSessionExpired, _Events_onUserMfaFailed, _EventEmitter_events;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalEvents = exports.EventEmitter = exports.Events = exports.UserMfaFailedEvent = exports.SessionExpiredEvent = void 0;
const error_1 = require("./error");
/** Event emitted when a request fails because of an expired/invalid session */
class SessionExpiredEvent {
}
exports.SessionExpiredEvent = SessionExpiredEvent;
/** Event emitted when a request fails because user failed to answer an MFA challenge */
class UserMfaFailedEvent extends error_1.ErrResponse {
}
exports.UserMfaFailedEvent = UserMfaFailedEvent;
/**
 * Dispatcher for a single event type.
 *
 * Provides methods for registering and unregistering handlers,
 * as well as dispatching events to all registered handlers.
 */
class EventDispatcher {
    /**
     * Constructor.
     */
    constructor() {
        _EventDispatcher_handlers.set(this, void 0);
        __classPrivateFieldSet(this, _EventDispatcher_handlers, [], "f");
    }
    /**
     * Register a new handler.
     *
     * @param {EventHandler<T>} handler Event handler to register
     * @return {EventDispatcher<T>} This instance to allow for chaining.
     */
    register(handler) {
        __classPrivateFieldGet(this, _EventDispatcher_handlers, "f").push(handler);
        return this;
    }
    /**
     * Unregister a handler. If {@link handler} is not already registered, it's a no-op.
     *
     * @param {EventHandler<T>} handler Event handler to unregister
     * @return {boolean} Whether the handler was found (and unregistered).
     */
    unregister(handler) {
        const idx = __classPrivateFieldGet(this, _EventDispatcher_handlers, "f").indexOf(handler);
        if (idx >= 0) {
            __classPrivateFieldGet(this, _EventDispatcher_handlers, "f").splice(idx, 1);
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Dispatch an event to all registered handlers.
     * @param {T} event Event to dispatch.
     */
    async dispatch(event) {
        await Promise.all(__classPrivateFieldGet(this, _EventDispatcher_handlers, "f").map((h) => h(event)));
    }
}
_EventDispatcher_handlers = new WeakMap();
/**
 * Class for registering and unregistering event handlers.
 */
class Events {
    constructor() {
        _Events_onError.set(this, new EventDispatcher());
        _Events_onSessionExpired.set(this, new EventDispatcher());
        _Events_onUserMfaFailed.set(this, new EventDispatcher());
    }
    /**
     * Register a handler for {@link ErrorEvent}: triggered every time a request to
     * a CubeSigner API endpoint returns a non-success response.
     *
     * @param {EventHandler<ErrorEvent>} handler The handler to register.
     */
    onError(handler) {
        __classPrivateFieldGet(this, _Events_onError, "f").register(handler);
    }
    /**
     * Register a handler for {@link SessionExpiredEvent}: triggered every time a
     * request to a CubeSigner API endpoint fails because of an expired session.
     *
     * @param {EventHandler<SessionExpiredEvent>} handler The handler to register.
     */
    onSessionExpired(handler) {
        __classPrivateFieldGet(this, _Events_onSessionExpired, "f").register(handler);
    }
    /**
     * Register a handler for {@link UserMfaFailedEvent}: triggered every time a
     * request to a CubeSigner API endpoint fails because the user failed to
     * answer an MFA challenge.
     *
     * @param {EventHandler<UserMfaFailedEvent>} handler The handler to register.
     */
    onUserMfaFailed(handler) {
        __classPrivateFieldGet(this, _Events_onUserMfaFailed, "f").register(handler);
    }
    /**
     * Unregister a handler for {@link ErrorEvent}.
     *
     * @param {EventHandler<ErrorEvent>} handler The handler to unregister.
     * @return {boolean} Whether the handler was found (and unregistered).
     */
    unregisterOnError(handler) {
        return __classPrivateFieldGet(this, _Events_onError, "f").unregister(handler);
    }
    /**
     * Unregister a handler for {@link SessionExpiredEvent}.
     *
     * @param {EventHandler<SessionExpiredEvent>} handler The handler to unregister.
     * @return {boolean} Whether the handler was found (and unregistered).
     */
    unregisterOnSessionExpired(handler) {
        return __classPrivateFieldGet(this, _Events_onSessionExpired, "f").unregister(handler);
    }
    /**
     * Unregister a handler for {@link UserMfaFailedEvent}.
     *
     * @param {EventHandler<UserMfaFailedEvent>} handler The handler to unregister.
     * @return {boolean} Whether the handler was found (and unregistered).
     */
    unregisterOnUserMfaFailed(handler) {
        return __classPrivateFieldGet(this, _Events_onUserMfaFailed, "f").unregister(handler);
    }
    /** @internal */
    async triggerSessionExpired() {
        await __classPrivateFieldGet(this, _Events_onSessionExpired, "f").dispatch(new SessionExpiredEvent());
    }
    /**
     * @param {UserMfaFailedEvent} ev The event to emit
     * @internal
     */
    async triggerUserMfaFailed(ev) {
        await __classPrivateFieldGet(this, _Events_onUserMfaFailed, "f").dispatch(ev);
    }
    /**
     * @param {ErrorEvent} event Event to trigger
     * @internal
     */
    async triggerErrorEvent(event) {
        await __classPrivateFieldGet(this, _Events_onError, "f").dispatch(event);
    }
}
exports.Events = Events;
_Events_onError = new WeakMap(), _Events_onSessionExpired = new WeakMap(), _Events_onUserMfaFailed = new WeakMap();
/**
 * Used to classify and emit events to one or more {@link Events} instances.
 */
class EventEmitter {
    /**
     *
     * @param {Events[]} events Instances to which to emit events
     * @param {boolean} skipGlobal Whether to include the global events instance {@link GlobalEvents}
     */
    constructor(events, skipGlobal) {
        _EventEmitter_events.set(this, void 0);
        skipGlobal ??= false;
        __classPrivateFieldSet(this, _EventEmitter_events, events, "f");
        if (!skipGlobal) {
            __classPrivateFieldGet(this, _EventEmitter_events, "f").push(exports.GlobalEvents);
        }
    }
    /**
     * Called by {@link CubeSignerApi} when an API response indicates an error.
     *
     * @param {ErrorEvent} err The error to dispatch.
     * @internal
     */
    async classifyAndEmitError(err) {
        for (const ev of __classPrivateFieldGet(this, _EventEmitter_events, "f")) {
            await ev.triggerErrorEvent(err);
        }
        if (err.isUserMfaError()) {
            await this.emitUserMfaFailed(err);
        }
        // if status is 403 and error matches one of the "invalid session" error codes trigger onSessionExpired
        //
        // TODO: because errors returned by the authorizer lambda are not forwarded to the client
        //       we also trigger onSessionExpired when "signerSessionRefresh" fails
        if (err.status === 403 &&
            (err.isSessionExpiredError() || err.operation == "signerSessionRefresh")) {
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
        for (const e of __classPrivateFieldGet(this, _EventEmitter_events, "f")) {
            await e.triggerSessionExpired();
        }
    }
    /**
     * Emits {@link UserMfaFailedEvent} to all subscribers
     *
     * @param {UserMfaFailedEvent} ev The event to emit.
     */
    async emitUserMfaFailed(ev) {
        for (const e of __classPrivateFieldGet(this, _EventEmitter_events, "f")) {
            await e.triggerUserMfaFailed(ev);
        }
    }
}
exports.EventEmitter = EventEmitter;
_EventEmitter_events = new WeakMap();
/**
 * Global events.
 */
exports.GlobalEvents = new Events();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtQ0FBc0M7QUFLdEMsK0VBQStFO0FBQy9FLE1BQWEsbUJBQW1CO0NBQUc7QUFBbkMsa0RBQW1DO0FBRW5DLHdGQUF3RjtBQUN4RixNQUFhLGtCQUFtQixTQUFRLG1CQUFXO0NBQUc7QUFBdEQsZ0RBQXNEO0FBRXREOzs7OztHQUtHO0FBQ0gsTUFBTSxlQUFlO0lBR25COztPQUVHO0lBQ0g7UUFMUyw0Q0FBNkI7UUFNcEMsdUJBQUEsSUFBSSw2QkFBYSxFQUFFLE1BQUEsQ0FBQztJQUN0QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxRQUFRLENBQUMsT0FBd0I7UUFDL0IsdUJBQUEsSUFBSSxpQ0FBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFVBQVUsQ0FBQyxPQUF3QjtRQUNqQyxNQUFNLEdBQUcsR0FBRyx1QkFBQSxJQUFJLGlDQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2IsdUJBQUEsSUFBSSxpQ0FBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQVE7UUFDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUFBLElBQUksaUNBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENB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Q0FBQyxTQUFTLElBQUksc0JBQXNCLENBQUMsRUFDeEUsQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxrQkFBa0I7UUFDdEIsS0FBSyxNQUFNLENBQUMsSUFBSSx1QkFBQSxJQUFJLDRCQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxFQUFzQjtRQUNwRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLHVCQUFBLElBQUksNEJBQVEsRUFBRSxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFqRUQsb0NBaUVDOztBQUVEOztHQUVHO0FBQ1UsUUFBQSxZQUFZLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVyclJlc3BvbnNlIH0gZnJvbSBcIi4vZXJyb3JcIjtcblxuZXhwb3J0IHR5cGUgRXZlbnRIYW5kbGVyPFQ+ID0gKGV2ZW50OiBUKSA9PiBQcm9taXNlPHZvaWQ+O1xuZXhwb3J0IHR5cGUgRXJyb3JFdmVudCA9IEVyclJlc3BvbnNlO1xuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQvaW52YWxpZCBzZXNzaW9uICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFdmVudCB7fVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIHVzZXIgZmFpbGVkIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlICovXG5leHBvcnQgY2xhc3MgVXNlck1mYUZhaWxlZEV2ZW50IGV4dGVuZHMgRXJyUmVzcG9uc2Uge31cblxuLyoqXG4gKiBEaXNwYXRjaGVyIGZvciBhIHNpbmdsZSBldmVudCB0eXBlLlxuICpcbiAqIFByb3ZpZGVzIG1ldGhvZHMgZm9yIHJlZ2lzdGVyaW5nIGFuZCB1bnJlZ2lzdGVyaW5nIGhhbmRsZXJzLFxuICogYXMgd2VsbCBhcyBkaXNwYXRjaGluZyBldmVudHMgdG8gYWxsIHJlZ2lzdGVyZWQgaGFuZGxlcnMuXG4gKi9cbmNsYXNzIEV2ZW50RGlzcGF0Y2hlcjxUPiB7XG4gIHJlYWRvbmx5ICNoYW5kbGVyczogRXZlbnRIYW5kbGVyPFQ+W107XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy4jaGFuZGxlcnMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIG5ldyBoYW5kbGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxUPn0gaGFuZGxlciBFdmVudCBoYW5kbGVyIHRvIHJlZ2lzdGVyXG4gICAqIEByZXR1cm4ge0V2ZW50RGlzcGF0Y2hlcjxUPn0gVGhpcyBpbnN0YW5jZSB0byBhbGxvdyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICByZWdpc3RlcihoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD4pOiBFdmVudERpc3BhdGNoZXI8VD4ge1xuICAgIHRoaXMuI2hhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGhhbmRsZXIuIElmIHtAbGluayBoYW5kbGVyfSBpcyBub3QgYWxyZWFkeSByZWdpc3RlcmVkLCBpdCdzIGEgbm8tb3AuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPFQ+fSBoYW5kbGVyIEV2ZW50IGhhbmRsZXIgdG8gdW5yZWdpc3RlclxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBoYW5kbGVyIHdhcyBmb3VuZCAoYW5kIHVucmVnaXN0ZXJlZCkuXG4gICAqL1xuICB1bnJlZ2lzdGVyKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuI2hhbmRsZXJzLmluZGV4T2YoaGFuZGxlcik7XG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICB0aGlzLiNoYW5kbGVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoIGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGhhbmRsZXJzLlxuICAgKiBAcGFyYW0ge1R9IGV2ZW50IEV2ZW50IHRvIGRpc3BhdGNoLlxuICAgKi9cbiAgYXN5bmMgZGlzcGF0Y2goZXZlbnQ6IFQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLiNoYW5kbGVycy5tYXAoKGgpID0+IGgoZXZlbnQpKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVnaXN0ZXJpbmcgYW5kIHVucmVnaXN0ZXJpbmcgZXZlbnQgaGFuZGxlcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudHMge1xuICByZWFkb25seSAjb25FcnJvciA9IG5ldyBFdmVudERpc3BhdGNoZXI8RXJyb3JFdmVudD4oKTtcbiAgcmVhZG9ubHkgI29uU2Vzc2lvbkV4cGlyZWQgPSBuZXcgRXZlbnREaXNwYXRjaGVyPFNlc3Npb25FeHBpcmVkRXZlbnQ+KCk7XG4gIHJlYWRvbmx5ICNvblVzZXJNZmFGYWlsZWQgPSBuZXcgRXZlbnREaXNwYXRjaGVyPFVzZXJNZmFGYWlsZWRFdmVudD4oKTtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBoYW5kbGVyIGZvciB7QGxpbmsgRXJyb3JFdmVudH06IHRyaWdnZXJlZCBldmVyeSB0aW1lIGEgcmVxdWVzdCB0b1xuICAgKiBhIEN1YmVTaWduZXIgQVBJIGVuZHBvaW50IHJldHVybnMgYSBub24tc3VjY2VzcyByZXNwb25zZS5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8RXJyb3JFdmVudD59IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gcmVnaXN0ZXIuXG4gICAqL1xuICBvbkVycm9yKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxFcnJvckV2ZW50Pikge1xuICAgIHRoaXMuI29uRXJyb3IucmVnaXN0ZXIoaGFuZGxlcik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBoYW5kbGVyIGZvciB7QGxpbmsgU2Vzc2lvbkV4cGlyZWRFdmVudH06IHRyaWdnZXJlZCBldmVyeSB0aW1lIGFcbiAgICogcmVxdWVzdCB0byBhIEN1YmVTaWduZXIgQVBJIGVuZHBvaW50IGZhaWxzIGJlY2F1c2Ugb2YgYW4gZXhwaXJlZCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxTZXNzaW9uRXhwaXJlZEV2ZW50Pn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byByZWdpc3Rlci5cbiAgICovXG4gIG9uU2Vzc2lvbkV4cGlyZWQoaGFuZGxlcjogRXZlbnRIYW5kbGVyPFNlc3Npb25FeHBpcmVkRXZlbnQ+KSB7XG4gICAgdGhpcy4jb25TZXNzaW9uRXhwaXJlZC5yZWdpc3RlcihoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGhhbmRsZXIgZm9yIHtAbGluayBVc2VyTWZhRmFpbGVkRXZlbnR9OiB0cmlnZ2VyZWQgZXZlcnkgdGltZSBhXG4gICAqIHJlcXVlc3QgdG8gYSBDdWJlU2lnbmVyIEFQSSBlbmRwb2ludCBmYWlscyBiZWNhdXNlIHRoZSB1c2VyIGZhaWxlZCB0b1xuICAgKiBhbnN3ZXIgYW4gTUZBIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8VXNlck1mYUZhaWxlZEV2ZW50Pn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byByZWdpc3Rlci5cbiAgICovXG4gIG9uVXNlck1mYUZhaWxlZChoYW5kbGVyOiBFdmVudEhhbmRsZXI8VXNlck1mYUZhaWxlZEV2ZW50Pikge1xuICAgIHRoaXMuI29uVXNlck1mYUZhaWxlZC5yZWdpc3RlcihoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGEgaGFuZGxlciBmb3Ige0BsaW5rIEVycm9yRXZlbnR9LlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxFcnJvckV2ZW50Pn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byB1bnJlZ2lzdGVyLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBoYW5kbGVyIHdhcyBmb3VuZCAoYW5kIHVucmVnaXN0ZXJlZCkuXG4gICAqL1xuICB1bnJlZ2lzdGVyT25FcnJvcihoYW5kbGVyOiBFdmVudEhhbmRsZXI8RXJyb3JFdmVudD4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jb25FcnJvci51bnJlZ2lzdGVyKGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBoYW5kbGVyIGZvciB7QGxpbmsgU2Vzc2lvbkV4cGlyZWRFdmVudH0uXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPFNlc3Npb25FeHBpcmVkRXZlbnQ+fSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIHVucmVnaXN0ZXIuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGhhbmRsZXIgd2FzIGZvdW5kIChhbmQgdW5yZWdpc3RlcmVkKS5cbiAgICovXG4gIHVucmVnaXN0ZXJPblNlc3Npb25FeHBpcmVkKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxTZXNzaW9uRXhwaXJlZEV2ZW50Pik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNvblNlc3Npb25FeHBpcmVkLnVucmVnaXN0ZXIoaGFuZGxlcik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGhhbmRsZXIgZm9yIHtAbGluayBVc2VyTWZhRmFpbGVkRXZlbnR9LlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxVc2VyTWZhRmFpbGVkRXZlbnQ+fSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIHVucmVnaXN0ZXIuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGhhbmRsZXIgd2FzIGZvdW5kIChhbmQgdW5yZWdpc3RlcmVkKS5cbiAgICovXG4gIHVucmVnaXN0ZXJPblVzZXJNZmFGYWlsZWQoaGFuZGxlcjogRXZlbnRIYW5kbGVyPFVzZXJNZmFGYWlsZWRFdmVudD4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jb25Vc2VyTWZhRmFpbGVkLnVucmVnaXN0ZXIoaGFuZGxlcik7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIGFzeW5jIHRyaWdnZXJTZXNzaW9uRXhwaXJlZCgpIHtcbiAgICBhd2FpdCB0aGlzLiNvblNlc3Npb25FeHBpcmVkLmRpc3BhdGNoKG5ldyBTZXNzaW9uRXhwaXJlZEV2ZW50KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VXNlck1mYUZhaWxlZEV2ZW50fSBldiBUaGUgZXZlbnQgdG8gZW1pdFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIHRyaWdnZXJVc2VyTWZhRmFpbGVkKGV2OiBVc2VyTWZhRmFpbGVkRXZlbnQpIHtcbiAgICBhd2FpdCB0aGlzLiNvblVzZXJNZmFGYWlsZWQuZGlzcGF0Y2goZXYpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RXJyb3JFdmVudH0gZXZlbnQgRXZlbnQgdG8gdHJpZ2dlclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIHRyaWdnZXJFcnJvckV2ZW50KGV2ZW50OiBFcnJvckV2ZW50KSB7XG4gICAgYXdhaXQgdGhpcy4jb25FcnJvci5kaXNwYXRjaChldmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNsYXNzaWZ5IGFuZCBlbWl0IGV2ZW50cyB0byBvbmUgb3IgbW9yZSB7QGxpbmsgRXZlbnRzfSBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXIge1xuICByZWFkb25seSAjZXZlbnRzOiBFdmVudHNbXTtcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHtFdmVudHNbXX0gZXZlbnRzIEluc3RhbmNlcyB0byB3aGljaCB0byBlbWl0IGV2ZW50c1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNraXBHbG9iYWwgV2hldGhlciB0byBpbmNsdWRlIHRoZSBnbG9iYWwgZXZlbnRzIGluc3RhbmNlIHtAbGluayBHbG9iYWxFdmVudHN9XG4gICAqL1xuICBjb25zdHJ1Y3RvcihldmVudHM6IEV2ZW50c1tdLCBza2lwR2xvYmFsPzogYm9vbGVhbikge1xuICAgIHNraXBHbG9iYWwgPz89IGZhbHNlO1xuICAgIHRoaXMuI2V2ZW50cyA9IGV2ZW50cztcbiAgICBpZiAoIXNraXBHbG9iYWwpIHtcbiAgICAgIHRoaXMuI2V2ZW50cy5wdXNoKEdsb2JhbEV2ZW50cyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSB7QGxpbmsgQ3ViZVNpZ25lckFwaX0gd2hlbiBhbiBBUEkgcmVzcG9uc2UgaW5kaWNhdGVzIGFuIGVycm9yLlxuICAgKlxuICAgKiBAcGFyYW0ge0Vycm9yRXZlbnR9IGVyciBUaGUgZXJyb3IgdG8gZGlzcGF0Y2guXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgY2xhc3NpZnlBbmRFbWl0RXJyb3IoZXJyOiBFcnJvckV2ZW50KSB7XG4gICAgZm9yIChjb25zdCBldiBvZiB0aGlzLiNldmVudHMpIHtcbiAgICAgIGF3YWl0IGV2LnRyaWdnZXJFcnJvckV2ZW50KGVycik7XG4gICAgfVxuXG4gICAgaWYgKGVyci5pc1VzZXJNZmFFcnJvcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLmVtaXRVc2VyTWZhRmFpbGVkKGVycik7XG4gICAgfVxuXG4gICAgLy8gaWYgc3RhdHVzIGlzIDQwMyBhbmQgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlIFwiaW52YWxpZCBzZXNzaW9uXCIgZXJyb3IgY29kZXMgdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkXG4gICAgLy9cbiAgICAvLyBUT0RPOiBiZWNhdXNlIGVycm9ycyByZXR1cm5lZCBieSB0aGUgYXV0aG9yaXplciBsYW1iZGEgYXJlIG5vdCBmb3J3YXJkZWQgdG8gdGhlIGNsaWVudFxuICAgIC8vICAgICAgIHdlIGFsc28gdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkIHdoZW4gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiIGZhaWxzXG4gICAgaWYgKFxuICAgICAgZXJyLnN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAoZXJyLmlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpIHx8IGVyci5vcGVyYXRpb24gPT0gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiKVxuICAgICkge1xuICAgICAgYXdhaXQgdGhpcy5lbWl0U2Vzc2lvbkV4cGlyZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IHtAbGluayBTaWduZXJTZXNzaW9uTWFuYWdlcn0gdG8gbm90aWZ5IHRoYXQgdGhlIHNlc3Npb24gaXMgZXhwaXJlZFxuICAgKiBiZXlvbmQgdGhlIHBvc3NpYmlsaXR5IG9mIHJlZnJlc2hpbmcsIG1lYW5pbmcgdGhhdCBmdWxsIHJlLWxvZ2luIGlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGVtaXRTZXNzaW9uRXhwaXJlZCgpIHtcbiAgICBmb3IgKGNvbnN0IGUgb2YgdGhpcy4jZXZlbnRzKSB7XG4gICAgICBhd2FpdCBlLnRyaWdnZXJTZXNzaW9uRXhwaXJlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyB7QGxpbmsgVXNlck1mYUZhaWxlZEV2ZW50fSB0byBhbGwgc3Vic2NyaWJlcnNcbiAgICpcbiAgICogQHBhcmFtIHtVc2VyTWZhRmFpbGVkRXZlbnR9IGV2IFRoZSBldmVudCB0byBlbWl0LlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBlbWl0VXNlck1mYUZhaWxlZChldjogVXNlck1mYUZhaWxlZEV2ZW50KSB7XG4gICAgZm9yIChjb25zdCBlIG9mIHRoaXMuI2V2ZW50cykge1xuICAgICAgYXdhaXQgZS50cmlnZ2VyVXNlck1mYUZhaWxlZChldik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2xvYmFsIGV2ZW50cy5cbiAqL1xuZXhwb3J0IGNvbnN0IEdsb2JhbEV2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiJdfQ==