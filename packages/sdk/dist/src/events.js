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
var _EventDispatcher_handlers, _Events_onError, _Events_onSessionExpired, _EventEmitter_events;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalEvents = exports.EventEmitter = exports.Events = exports.messageMatchesSessionExpired = void 0;
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
function messageMatchesSessionExpired(msg) {
    return SessionExpiredRegexes.some((re) => re.test(msg));
}
exports.messageMatchesSessionExpired = messageMatchesSessionExpired;
/**
 * Class for registering and unregistering event handlers.
 */
class Events {
    constructor() {
        _Events_onError.set(this, new EventDispatcher());
        _Events_onSessionExpired.set(this, new EventDispatcher());
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
    /** @internal */
    async triggerSessionExpired() {
        await __classPrivateFieldGet(this, _Events_onSessionExpired, "f").dispatch({});
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
_Events_onError = new WeakMap(), _Events_onSessionExpired = new WeakMap();
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
        // if status is 403 and error matches one of the SessionExpiredRegexes trigger onSessionExpired
        //
        // TODO: because errors returned by the authorizer lambda are not forwarded to the client
        //       we also trigger onSessionExpired when "signerSessionRefresh" fails
        if (err.status === 403 &&
            (messageMatchesSessionExpired(err.message) || err.operation == "signerSessionRefresh")) {
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
}
exports.EventEmitter = EventEmitter;
_EventEmitter_events = new WeakMap();
/**
 * Global events.
 */
exports.GlobalEvents = new Events();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFRQTs7Ozs7R0FLRztBQUNILE1BQU0sZUFBZTtJQUduQjs7T0FFRztJQUNIO1FBTFMsNENBQTZCO1FBTXBDLHVCQUFBLElBQUksNkJBQWEsRUFBRSxNQUFBLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsUUFBUSxDQUFDLE9BQXdCO1FBQy9CLHVCQUFBLElBQUksaUNBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxVQUFVLENBQUMsT0FBd0I7UUFDakMsTUFBTSxHQUFHLEdBQUcsdUJBQUEsSUFBSSxpQ0FBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNiLHVCQUFBLElBQUksaUNBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFRO1FBQ3JCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBQSxJQUFJLGlDQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FDRjs7QUFFRCxNQUFNLHFCQUFxQixHQUFHO0lBQzVCLG9FQUFvRTtJQUNwRSx5RUFBeUU7SUFDekUsa0RBQWtEO0lBQ2xELHlEQUF5RDtJQUN6RCxvQkFBb0I7Q0FD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ZXNDb250ZW50IjpbImltcG9ydCB7IEVyclJlc3BvbnNlIH0gZnJvbSBcIi4vZXJyb3JcIjtcblxuZXhwb3J0IHR5cGUgRXZlbnRIYW5kbGVyPFQ+ID0gKGV2ZW50OiBUKSA9PiBQcm9taXNlPHZvaWQ+O1xuZXhwb3J0IHR5cGUgRXJyb3JFdmVudCA9IEVyclJlc3BvbnNlO1xuXG4vKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWludGVyZmFjZSAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uRXhwaXJlZEV2ZW50IHt9XG5cbi8qKlxuICogRGlzcGF0Y2hlciBmb3IgYSBzaW5nbGUgZXZlbnQgdHlwZS5cbiAqXG4gKiBQcm92aWRlcyBtZXRob2RzIGZvciByZWdpc3RlcmluZyBhbmQgdW5yZWdpc3RlcmluZyBoYW5kbGVycyxcbiAqIGFzIHdlbGwgYXMgZGlzcGF0Y2hpbmcgZXZlbnRzIHRvIGFsbCByZWdpc3RlcmVkIGhhbmRsZXJzLlxuICovXG5jbGFzcyBFdmVudERpc3BhdGNoZXI8VD4ge1xuICByZWFkb25seSAjaGFuZGxlcnM6IEV2ZW50SGFuZGxlcjxUPltdO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuI2hhbmRsZXJzID0gW107XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBuZXcgaGFuZGxlci5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8VD59IGhhbmRsZXIgRXZlbnQgaGFuZGxlciB0byByZWdpc3RlclxuICAgKiBAcmV0dXJuIHtFdmVudERpc3BhdGNoZXI8VD59IFRoaXMgaW5zdGFuY2UgdG8gYWxsb3cgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgcmVnaXN0ZXIoaGFuZGxlcjogRXZlbnRIYW5kbGVyPFQ+KTogRXZlbnREaXNwYXRjaGVyPFQ+IHtcbiAgICB0aGlzLiNoYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBoYW5kbGVyLiBJZiB7QGxpbmsgaGFuZGxlcn0gaXMgbm90IGFscmVhZHkgcmVnaXN0ZXJlZCwgaXQncyBhIG5vLW9wLlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxUPn0gaGFuZGxlciBFdmVudCBoYW5kbGVyIHRvIHVucmVnaXN0ZXJcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgaGFuZGxlciB3YXMgZm91bmQgKGFuZCB1bnJlZ2lzdGVyZWQpLlxuICAgKi9cbiAgdW5yZWdpc3RlcihoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD4pOiBib29sZWFuIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLiNoYW5kbGVycy5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgdGhpcy4jaGFuZGxlcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBoYW5kbGVycy5cbiAgICogQHBhcmFtIHtUfSBldmVudCBFdmVudCB0byBkaXNwYXRjaC5cbiAgICovXG4gIGFzeW5jIGRpc3BhdGNoKGV2ZW50OiBUKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy4jaGFuZGxlcnMubWFwKChoKSA9PiBoKGV2ZW50KSkpO1xuICB9XG59XG5cbmNvbnN0IFNlc3Npb25FeHBpcmVkUmVnZXhlcyA9IFtcbiAgL15TZXNzaW9uICcoPzxwdXJwb3NlPlteJ10qKScgZm9yICcoPzxpZGVudGl0eT5bXiddKiknIGhhcyBleHBpcmVkJC8sXG4gIC9eU2Vzc2lvbiAnKD88cHVycG9zZT5bXiddKiknIGZvciAnKD88aWRlbnRpdHk+W14nXSopJyBoYXMgYmVlbiByZXZva2VkJC8sXG4gIC9eQXV0aCB0b2tlbiBmb3IgZXBvY2ggKD88ZXBvY2g+XFxkKykgaGFzIGV4cGlyZWQkLyxcbiAgL15SZWZyZXNoIHRva2VuIGZvciBlcG9jaCAoPzxlcG9jaF9udW0+XFxkKykgaGFzIGV4cGlyZWQkLyxcbiAgL15PdXRkYXRlZCBzZXNzaW9uJC8sXG5dO1xuXG4vKipcbiAqIFdoZXRoZXIgYW4gZXJyb3IgbWVzc2FnZSBtYXRjaGVzIG9uZSBvZiBzZXZlcmFsIGRpZmZlcmVudCBcInNlc3Npb24gZXhwaXJlZFwiIHJlc3BvbnNlcy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbXNnIFRoZSBzdHJpbmcgdG8gdGVzdC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHN0cmluZyBtYXRjaGVzLlxuICogQGludGVybmFsIEV4cG9ydGVkIG9ubHkgc28gdGhhdCBpdCBjYW4gYmUgY2FsbGVkIGZyb20gYSB1bml0IHRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lc3NhZ2VNYXRjaGVzU2Vzc2lvbkV4cGlyZWQobXNnOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIFNlc3Npb25FeHBpcmVkUmVnZXhlcy5zb21lKChyZSkgPT4gcmUudGVzdChtc2cpKTtcbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVnaXN0ZXJpbmcgYW5kIHVucmVnaXN0ZXJpbmcgZXZlbnQgaGFuZGxlcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudHMge1xuICByZWFkb25seSAjb25FcnJvciA9IG5ldyBFdmVudERpc3BhdGNoZXI8RXJyb3JFdmVudD4oKTtcbiAgcmVhZG9ubHkgI29uU2Vzc2lvbkV4cGlyZWQgPSBuZXcgRXZlbnREaXNwYXRjaGVyPFNlc3Npb25FeHBpcmVkRXZlbnQ+KCk7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgaGFuZGxlciBmb3Ige0BsaW5rIEVycm9yRXZlbnR9OiB0cmlnZ2VyZWQgZXZlcnkgdGltZSBhIHJlcXVlc3QgdG9cbiAgICogYSBDdWJlU2lnbmVyIEFQSSBlbmRwb2ludCByZXR1cm5zIGEgbm9uLXN1Y2Nlc3MgcmVzcG9uc2UuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPEVycm9yRXZlbnQ+fSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIHJlZ2lzdGVyLlxuICAgKi9cbiAgb25FcnJvcihoYW5kbGVyOiBFdmVudEhhbmRsZXI8RXJyb3JFdmVudD4pIHtcbiAgICB0aGlzLiNvbkVycm9yLnJlZ2lzdGVyKGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgaGFuZGxlciBmb3Ige0BsaW5rIFNlc3Npb25FeHBpcmVkRXZlbnR9OiB0cmlnZ2VyZWQgZXZlcnkgdGltZSBhXG4gICAqIHJlcXVlc3QgdG8gYSBDdWJlU2lnbmVyIEFQSSBlbmRwb2ludCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8U2Vzc2lvbkV4cGlyZWRFdmVudD59IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gcmVnaXN0ZXIuXG4gICAqL1xuICBvblNlc3Npb25FeHBpcmVkKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxTZXNzaW9uRXhwaXJlZEV2ZW50Pikge1xuICAgIHRoaXMuI29uU2Vzc2lvbkV4cGlyZWQucmVnaXN0ZXIoaGFuZGxlcik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGhhbmRsZXIgZm9yIHtAbGluayBFcnJvckV2ZW50fS5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8RXJyb3JFdmVudD59IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gdW5yZWdpc3Rlci5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgaGFuZGxlciB3YXMgZm91bmQgKGFuZCB1bnJlZ2lzdGVyZWQpLlxuICAgKi9cbiAgdW5yZWdpc3Rlck9uRXJyb3IoaGFuZGxlcjogRXZlbnRIYW5kbGVyPEVycm9yRXZlbnQ+KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI29uRXJyb3IudW5yZWdpc3RlcihoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGEgaGFuZGxlciBmb3Ige0BsaW5rIFNlc3Npb25FeHBpcmVkRXZlbnR9LlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxTZXNzaW9uRXhwaXJlZEV2ZW50Pn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byB1bnJlZ2lzdGVyLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBoYW5kbGVyIHdhcyBmb3VuZCAoYW5kIHVucmVnaXN0ZXJlZCkuXG4gICAqL1xuICB1bnJlZ2lzdGVyT25TZXNzaW9uRXhwaXJlZChoYW5kbGVyOiBFdmVudEhhbmRsZXI8U2Vzc2lvbkV4cGlyZWRFdmVudD4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jb25TZXNzaW9uRXhwaXJlZC51bnJlZ2lzdGVyKGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBhc3luYyB0cmlnZ2VyU2Vzc2lvbkV4cGlyZWQoKSB7XG4gICAgYXdhaXQgdGhpcy4jb25TZXNzaW9uRXhwaXJlZC5kaXNwYXRjaCg8U2Vzc2lvbkV4cGlyZWRFdmVudD57fSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtFcnJvckV2ZW50fSBldmVudCBFdmVudCB0byB0cmlnZ2VyXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgdHJpZ2dlckVycm9yRXZlbnQoZXZlbnQ6IEVycm9yRXZlbnQpIHtcbiAgICBhd2FpdCB0aGlzLiNvbkVycm9yLmRpc3BhdGNoKGV2ZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gY2xhc3NpZnkgYW5kIGVtaXQgZXZlbnRzIHRvIG9uZSBvciBtb3JlIHtAbGluayBFdmVudHN9IGluc3RhbmNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIHJlYWRvbmx5ICNldmVudHM6IEV2ZW50c1tdO1xuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50c1tdfSBldmVudHMgSW5zdGFuY2VzIHRvIHdoaWNoIHRvIGVtaXQgZXZlbnRzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcEdsb2JhbCBXaGV0aGVyIHRvIGluY2x1ZGUgdGhlIGdsb2JhbCBldmVudHMgaW5zdGFuY2Uge0BsaW5rIEdsb2JhbEV2ZW50c31cbiAgICovXG4gIGNvbnN0cnVjdG9yKGV2ZW50czogRXZlbnRzW10sIHNraXBHbG9iYWw/OiBib29sZWFuKSB7XG4gICAgc2tpcEdsb2JhbCA/Pz0gZmFsc2U7XG4gICAgdGhpcy4jZXZlbnRzID0gZXZlbnRzO1xuICAgIGlmICghc2tpcEdsb2JhbCkge1xuICAgICAgdGhpcy4jZXZlbnRzLnB1c2goR2xvYmFsRXZlbnRzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IHtAbGluayBDdWJlU2lnbmVyQXBpfSB3aGVuIGFuIEFQSSByZXNwb25zZSBpbmRpY2F0ZXMgYW4gZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSB7RXJyb3JFdmVudH0gZXJyIFRoZSBlcnJvciB0byBkaXNwYXRjaC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBjbGFzc2lmeUFuZEVtaXRFcnJvcihlcnI6IEVycm9yRXZlbnQpIHtcbiAgICBmb3IgKGNvbnN0IGV2IG9mIHRoaXMuI2V2ZW50cykge1xuICAgICAgYXdhaXQgZXYudHJpZ2dlckVycm9yRXZlbnQoZXJyKTtcbiAgICB9XG5cbiAgICAvLyBpZiBzdGF0dXMgaXMgNDAzIGFuZCBlcnJvciBtYXRjaGVzIG9uZSBvZiB0aGUgU2Vzc2lvbkV4cGlyZWRSZWdleGVzIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZFxuICAgIC8vXG4gICAgLy8gVE9ETzogYmVjYXVzZSBlcnJvcnMgcmV0dXJuZWQgYnkgdGhlIGF1dGhvcml6ZXIgbGFtYmRhIGFyZSBub3QgZm9yd2FyZGVkIHRvIHRoZSBjbGllbnRcbiAgICAvLyAgICAgICB3ZSBhbHNvIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZCB3aGVuIFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiBmYWlsc1xuICAgIGlmIChcbiAgICAgIGVyci5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKG1lc3NhZ2VNYXRjaGVzU2Vzc2lvbkV4cGlyZWQoZXJyLm1lc3NhZ2UpIHx8IGVyci5vcGVyYXRpb24gPT0gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiKVxuICAgICkge1xuICAgICAgYXdhaXQgdGhpcy5lbWl0U2Vzc2lvbkV4cGlyZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIGJ5IHtAbGluayBTaWduZXJTZXNzaW9uTWFuYWdlcn0gdG8gbm90aWZ5IHRoYXQgdGhlIHNlc3Npb24gaXMgZXhwaXJlZFxuICAgKiBiZXlvbmQgdGhlIHBvc3NpYmlsaXR5IG9mIHJlZnJlc2hpbmcsIG1lYW5pbmcgdGhhdCBmdWxsIHJlLWxvZ2luIGlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGVtaXRTZXNzaW9uRXhwaXJlZCgpIHtcbiAgICBmb3IgKGNvbnN0IGUgb2YgdGhpcy4jZXZlbnRzKSB7XG4gICAgICBhd2FpdCBlLnRyaWdnZXJTZXNzaW9uRXhwaXJlZCgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdsb2JhbCBldmVudHMuXG4gKi9cbmV4cG9ydCBjb25zdCBHbG9iYWxFdmVudHMgPSBuZXcgRXZlbnRzKCk7XG4iXX0=