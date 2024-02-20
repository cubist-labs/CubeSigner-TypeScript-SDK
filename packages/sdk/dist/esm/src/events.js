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
import { ErrResponse } from "./error";
/** Event emitted when a request fails because of an expired/invalid session */
export class SessionExpiredEvent {
}
/** Event emitted when a request fails because user failed to answer an MFA challenge */
export class UserMfaFailedEvent extends ErrResponse {
}
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
export class Events {
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
_Events_onError = new WeakMap(), _Events_onSessionExpired = new WeakMap(), _Events_onUserMfaFailed = new WeakMap();
/**
 * Used to classify and emit events to one or more {@link Events} instances.
 */
export class EventEmitter {
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
            __classPrivateFieldGet(this, _EventEmitter_events, "f").push(GlobalEvents);
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
_EventEmitter_events = new WeakMap();
/**
 * Global events.
 */
export const GlobalEvents = new Events();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBS3RDLCtFQUErRTtBQUMvRSxNQUFNLE9BQU8sbUJBQW1CO0NBQUc7QUFFbkMsd0ZBQXdGO0FBQ3hGLE1BQU0sT0FBTyxrQkFBbUIsU0FBUSxXQUFXO0NBQUc7QUFFdEQ7Ozs7O0dBS0c7QUFDSCxNQUFNLGVBQWU7SUFHbkI7O09BRUc7SUFDSDtRQUxTLDRDQUE2QjtRQU1wQyx1QkFBQSxJQUFJLDZCQUFhLEVBQUUsTUFBQSxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFFBQVEsQ0FBQyxPQUF3QjtRQUMvQix1QkFBQSxJQUFJLGlDQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsVUFBVSxDQUFDLE9BQXdCO1FBQ2pDLE1BQU0sR0FBRyxHQUFHLHVCQUFBLElBQUksaUNBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDYix1QkFBQSxJQUFJLGlDQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBUTtRQUNyQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQUEsSUFBSSxpQ0FBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFD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QUFHLENBQUMsU0FBUyxJQUFJLHNCQUFzQixDQUFDLEVBQ3hFLENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsa0JBQWtCO1FBQ3RCLEtBQUssTUFBTSxDQUFDLElBQUksdUJBQUEsSUFBSSw0QkFBUSxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyxLQUFLLENBQUMsaUJBQWlCLENBQUMsRUFBc0I7UUFDcEQsS0FBSyxNQUFNLENBQUMsSUFBSSx1QkFBQSxJQUFJLDRCQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuQyxDQUFDO0lBQ0gsQ0FBQztDQUNGOztBQUVEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFcnJSZXNwb25zZSB9IGZyb20gXCIuL2Vycm9yXCI7XG5cbmV4cG9ydCB0eXBlIEV2ZW50SGFuZGxlcjxUPiA9IChldmVudDogVCkgPT4gUHJvbWlzZTx2b2lkPjtcbmV4cG9ydCB0eXBlIEVycm9yRXZlbnQgPSBFcnJSZXNwb25zZTtcblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgYmVjYXVzZSBvZiBhbiBleHBpcmVkL2ludmFsaWQgc2Vzc2lvbiAqL1xuZXhwb3J0IGNsYXNzIFNlc3Npb25FeHBpcmVkRXZlbnQge31cblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgYmVjYXVzZSB1c2VyIGZhaWxlZCB0byBhbnN3ZXIgYW4gTUZBIGNoYWxsZW5nZSAqL1xuZXhwb3J0IGNsYXNzIFVzZXJNZmFGYWlsZWRFdmVudCBleHRlbmRzIEVyclJlc3BvbnNlIHt9XG5cbi8qKlxuICogRGlzcGF0Y2hlciBmb3IgYSBzaW5nbGUgZXZlbnQgdHlwZS5cbiAqXG4gKiBQcm92aWRlcyBtZXRob2RzIGZvciByZWdpc3RlcmluZyBhbmQgdW5yZWdpc3RlcmluZyBoYW5kbGVycyxcbiAqIGFzIHdlbGwgYXMgZGlzcGF0Y2hpbmcgZXZlbnRzIHRvIGFsbCByZWdpc3RlcmVkIGhhbmRsZXJzLlxuICovXG5jbGFzcyBFdmVudERpc3BhdGNoZXI8VD4ge1xuICByZWFkb25seSAjaGFuZGxlcnM6IEV2ZW50SGFuZGxlcjxUPltdO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuI2hhbmRsZXJzID0gW107XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBuZXcgaGFuZGxlci5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8VD59IGhhbmRsZXIgRXZlbnQgaGFuZGxlciB0byByZWdpc3RlclxuICAgKiBAcmV0dXJuIHtFdmVudERpc3BhdGNoZXI8VD59IFRoaXMgaW5zdGFuY2UgdG8gYWxsb3cgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgcmVnaXN0ZXIoaGFuZGxlcjogRXZlbnRIYW5kbGVyPFQ+KTogRXZlbnREaXNwYXRjaGVyPFQ+IHtcbiAgICB0aGlzLiNoYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBoYW5kbGVyLiBJZiB7QGxpbmsgaGFuZGxlcn0gaXMgbm90IGFscmVhZHkgcmVnaXN0ZXJlZCwgaXQncyBhIG5vLW9wLlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxUPn0gaGFuZGxlciBFdmVudCBoYW5kbGVyIHRvIHVucmVnaXN0ZXJcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgaGFuZGxlciB3YXMgZm91bmQgKGFuZCB1bnJlZ2lzdGVyZWQpLlxuICAgKi9cbiAgdW5yZWdpc3RlcihoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD4pOiBib29sZWFuIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLiNoYW5kbGVycy5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgdGhpcy4jaGFuZGxlcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBoYW5kbGVycy5cbiAgICogQHBhcmFtIHtUfSBldmVudCBFdmVudCB0byBkaXNwYXRjaC5cbiAgICovXG4gIGFzeW5jIGRpc3BhdGNoKGV2ZW50OiBUKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy4jaGFuZGxlcnMubWFwKChoKSA9PiBoKGV2ZW50KSkpO1xuICB9XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlZ2lzdGVyaW5nIGFuZCB1bnJlZ2lzdGVyaW5nIGV2ZW50IGhhbmRsZXJzLlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRzIHtcbiAgcmVhZG9ubHkgI29uRXJyb3IgPSBuZXcgRXZlbnREaXNwYXRjaGVyPEVycm9yRXZlbnQ+KCk7XG4gIHJlYWRvbmx5ICNvblNlc3Npb25FeHBpcmVkID0gbmV3IEV2ZW50RGlzcGF0Y2hlcjxTZXNzaW9uRXhwaXJlZEV2ZW50PigpO1xuICByZWFkb25seSAjb25Vc2VyTWZhRmFpbGVkID0gbmV3IEV2ZW50RGlzcGF0Y2hlcjxVc2VyTWZhRmFpbGVkRXZlbnQ+KCk7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgaGFuZGxlciBmb3Ige0BsaW5rIEVycm9yRXZlbnR9OiB0cmlnZ2VyZWQgZXZlcnkgdGltZSBhIHJlcXVlc3QgdG9cbiAgICogYSBDdWJlU2lnbmVyIEFQSSBlbmRwb2ludCByZXR1cm5zIGEgbm9uLXN1Y2Nlc3MgcmVzcG9uc2UuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPEVycm9yRXZlbnQ+fSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIHJlZ2lzdGVyLlxuICAgKi9cbiAgb25FcnJvcihoYW5kbGVyOiBFdmVudEhhbmRsZXI8RXJyb3JFdmVudD4pIHtcbiAgICB0aGlzLiNvbkVycm9yLnJlZ2lzdGVyKGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgaGFuZGxlciBmb3Ige0BsaW5rIFNlc3Npb25FeHBpcmVkRXZlbnR9OiB0cmlnZ2VyZWQgZXZlcnkgdGltZSBhXG4gICAqIHJlcXVlc3QgdG8gYSBDdWJlU2lnbmVyIEFQSSBlbmRwb2ludCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8U2Vzc2lvbkV4cGlyZWRFdmVudD59IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gcmVnaXN0ZXIuXG4gICAqL1xuICBvblNlc3Npb25FeHBpcmVkKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxTZXNzaW9uRXhwaXJlZEV2ZW50Pikge1xuICAgIHRoaXMuI29uU2Vzc2lvbkV4cGlyZWQucmVnaXN0ZXIoaGFuZGxlcik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBoYW5kbGVyIGZvciB7QGxpbmsgVXNlck1mYUZhaWxlZEV2ZW50fTogdHJpZ2dlcmVkIGV2ZXJ5IHRpbWUgYVxuICAgKiByZXF1ZXN0IHRvIGEgQ3ViZVNpZ25lciBBUEkgZW5kcG9pbnQgZmFpbHMgYmVjYXVzZSB0aGUgdXNlciBmYWlsZWQgdG9cbiAgICogYW5zd2VyIGFuIE1GQSBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPFVzZXJNZmFGYWlsZWRFdmVudD59IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gcmVnaXN0ZXIuXG4gICAqL1xuICBvblVzZXJNZmFGYWlsZWQoaGFuZGxlcjogRXZlbnRIYW5kbGVyPFVzZXJNZmFGYWlsZWRFdmVudD4pIHtcbiAgICB0aGlzLiNvblVzZXJNZmFGYWlsZWQucmVnaXN0ZXIoaGFuZGxlcik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGhhbmRsZXIgZm9yIHtAbGluayBFcnJvckV2ZW50fS5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8RXJyb3JFdmVudD59IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gdW5yZWdpc3Rlci5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgaGFuZGxlciB3YXMgZm91bmQgKGFuZCB1bnJlZ2lzdGVyZWQpLlxuICAgKi9cbiAgdW5yZWdpc3Rlck9uRXJyb3IoaGFuZGxlcjogRXZlbnRIYW5kbGVyPEVycm9yRXZlbnQ+KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI29uRXJyb3IudW5yZWdpc3RlcihoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGEgaGFuZGxlciBmb3Ige0BsaW5rIFNlc3Npb25FeHBpcmVkRXZlbnR9LlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxTZXNzaW9uRXhwaXJlZEV2ZW50Pn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byB1bnJlZ2lzdGVyLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBoYW5kbGVyIHdhcyBmb3VuZCAoYW5kIHVucmVnaXN0ZXJlZCkuXG4gICAqL1xuICB1bnJlZ2lzdGVyT25TZXNzaW9uRXhwaXJlZChoYW5kbGVyOiBFdmVudEhhbmRsZXI8U2Vzc2lvbkV4cGlyZWRFdmVudD4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jb25TZXNzaW9uRXhwaXJlZC51bnJlZ2lzdGVyKGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBoYW5kbGVyIGZvciB7QGxpbmsgVXNlck1mYUZhaWxlZEV2ZW50fS5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8VXNlck1mYUZhaWxlZEV2ZW50Pn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byB1bnJlZ2lzdGVyLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBoYW5kbGVyIHdhcyBmb3VuZCAoYW5kIHVucmVnaXN0ZXJlZCkuXG4gICAqL1xuICB1bnJlZ2lzdGVyT25Vc2VyTWZhRmFpbGVkKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxVc2VyTWZhRmFpbGVkRXZlbnQ+KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI29uVXNlck1mYUZhaWxlZC51bnJlZ2lzdGVyKGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBhc3luYyB0cmlnZ2VyU2Vzc2lvbkV4cGlyZWQoKSB7XG4gICAgYXdhaXQgdGhpcy4jb25TZXNzaW9uRXhwaXJlZC5kaXNwYXRjaChuZXcgU2Vzc2lvbkV4cGlyZWRFdmVudCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1VzZXJNZmFGYWlsZWRFdmVudH0gZXYgVGhlIGV2ZW50IHRvIGVtaXRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyB0cmlnZ2VyVXNlck1mYUZhaWxlZChldjogVXNlck1mYUZhaWxlZEV2ZW50KSB7XG4gICAgYXdhaXQgdGhpcy4jb25Vc2VyTWZhRmFpbGVkLmRpc3BhdGNoKGV2KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0Vycm9yRXZlbnR9IGV2ZW50IEV2ZW50IHRvIHRyaWdnZXJcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyB0cmlnZ2VyRXJyb3JFdmVudChldmVudDogRXJyb3JFdmVudCkge1xuICAgIGF3YWl0IHRoaXMuI29uRXJyb3IuZGlzcGF0Y2goZXZlbnQpO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBjbGFzc2lmeSBhbmQgZW1pdCBldmVudHMgdG8gb25lIG9yIG1vcmUge0BsaW5rIEV2ZW50c30gaW5zdGFuY2VzLlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyIHtcbiAgcmVhZG9ubHkgI2V2ZW50czogRXZlbnRzW107XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRzW119IGV2ZW50cyBJbnN0YW5jZXMgdG8gd2hpY2ggdG8gZW1pdCBldmVudHNcbiAgICogQHBhcmFtIHtib29sZWFufSBza2lwR2xvYmFsIFdoZXRoZXIgdG8gaW5jbHVkZSB0aGUgZ2xvYmFsIGV2ZW50cyBpbnN0YW5jZSB7QGxpbmsgR2xvYmFsRXZlbnRzfVxuICAgKi9cbiAgY29uc3RydWN0b3IoZXZlbnRzOiBFdmVudHNbXSwgc2tpcEdsb2JhbD86IGJvb2xlYW4pIHtcbiAgICBza2lwR2xvYmFsID8/PSBmYWxzZTtcbiAgICB0aGlzLiNldmVudHMgPSBldmVudHM7XG4gICAgaWYgKCFza2lwR2xvYmFsKSB7XG4gICAgICB0aGlzLiNldmVudHMucHVzaChHbG9iYWxFdmVudHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYnkge0BsaW5rIEN1YmVTaWduZXJBcGl9IHdoZW4gYW4gQVBJIHJlc3BvbnNlIGluZGljYXRlcyBhbiBlcnJvci5cbiAgICpcbiAgICogQHBhcmFtIHtFcnJvckV2ZW50fSBlcnIgVGhlIGVycm9yIHRvIGRpc3BhdGNoLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGNsYXNzaWZ5QW5kRW1pdEVycm9yKGVycjogRXJyb3JFdmVudCkge1xuICAgIGZvciAoY29uc3QgZXYgb2YgdGhpcy4jZXZlbnRzKSB7XG4gICAgICBhd2FpdCBldi50cmlnZ2VyRXJyb3JFdmVudChlcnIpO1xuICAgIH1cblxuICAgIGlmIChlcnIuaXNVc2VyTWZhRXJyb3IoKSkge1xuICAgICAgYXdhaXQgdGhpcy5lbWl0VXNlck1mYUZhaWxlZChlcnIpO1xuICAgIH1cblxuICAgIC8vIGlmIHN0YXR1cyBpcyA0MDMgYW5kIGVycm9yIG1hdGNoZXMgb25lIG9mIHRoZSBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIGNvZGVzIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZFxuICAgIC8vXG4gICAgLy8gVE9ETzogYmVjYXVzZSBlcnJvcnMgcmV0dXJuZWQgYnkgdGhlIGF1dGhvcml6ZXIgbGFtYmRhIGFyZSBub3QgZm9yd2FyZGVkIHRvIHRoZSBjbGllbnRcbiAgICAvLyAgICAgICB3ZSBhbHNvIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZCB3aGVuIFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiBmYWlsc1xuICAgIGlmIChcbiAgICAgIGVyci5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKGVyci5pc1Nlc3Npb25FeHBpcmVkRXJyb3IoKSB8fCBlcnIub3BlcmF0aW9uID09IFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIilcbiAgICApIHtcbiAgICAgIGF3YWl0IHRoaXMuZW1pdFNlc3Npb25FeHBpcmVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSB7QGxpbmsgU2lnbmVyU2Vzc2lvbk1hbmFnZXJ9IHRvIG5vdGlmeSB0aGF0IHRoZSBzZXNzaW9uIGlzIGV4cGlyZWRcbiAgICogYmV5b25kIHRoZSBwb3NzaWJpbGl0eSBvZiByZWZyZXNoaW5nLCBtZWFuaW5nIHRoYXQgZnVsbCByZS1sb2dpbiBpcyByZXF1aXJlZC5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBlbWl0U2Vzc2lvbkV4cGlyZWQoKSB7XG4gICAgZm9yIChjb25zdCBlIG9mIHRoaXMuI2V2ZW50cykge1xuICAgICAgYXdhaXQgZS50cmlnZ2VyU2Vzc2lvbkV4cGlyZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMge0BsaW5rIFVzZXJNZmFGYWlsZWRFdmVudH0gdG8gYWxsIHN1YnNjcmliZXJzXG4gICAqXG4gICAqIEBwYXJhbSB7VXNlck1mYUZhaWxlZEV2ZW50fSBldiBUaGUgZXZlbnQgdG8gZW1pdC5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZW1pdFVzZXJNZmFGYWlsZWQoZXY6IFVzZXJNZmFGYWlsZWRFdmVudCkge1xuICAgIGZvciAoY29uc3QgZSBvZiB0aGlzLiNldmVudHMpIHtcbiAgICAgIGF3YWl0IGUudHJpZ2dlclVzZXJNZmFGYWlsZWQoZXYpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdsb2JhbCBldmVudHMuXG4gKi9cbmV4cG9ydCBjb25zdCBHbG9iYWxFdmVudHMgPSBuZXcgRXZlbnRzKCk7XG4iXX0=