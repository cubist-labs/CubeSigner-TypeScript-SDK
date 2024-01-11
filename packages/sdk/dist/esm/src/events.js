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
export function messageMatchesSessionExpired(msg) {
    return SessionExpiredRegexes.some((re) => re.test(msg));
}
/**
 * Class for registering and unregistering event handlers.
 */
export class Events {
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
_Events_onError = new WeakMap(), _Events_onSessionExpired = new WeakMap();
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
_EventEmitter_events = new WeakMap();
/**
 * Global events.
 */
export const GlobalEvents = new Events();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQTs7Ozs7R0FLRztBQUNILE1BQU0sZUFBZTtJQUduQjs7T0FFRztJQUNIO1FBTFMsNENBQTZCO1FBTXBDLHVCQUFBLElBQUksNkJBQWEsRUFBRSxNQUFBLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsUUFBUSxDQUFDLE9BQXdCO1FBQy9CLHVCQUFBLElBQUksaUNBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxVQUFVLENBQUMsT0FBd0I7UUFDakMsTUFBTSxHQUFHLEdBQUcsdUJBQUEsSUFBSSxpQ0FBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNiLHVCQUFBLElBQUksaUNBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFRO1FBQ3JCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBQSxJQUFJLGlDQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FDRjs7QUFFRCxNQUFNLHFCQUFxQixHQUFHO0lBQzVCLG9FQUFvRTtJQUNwRSx5RUFBeUU7SUFDekUsa0RBQWtEO0lBQ2xELHlEQUF5RDtJQUN6RCxvQkFBb0I7Q0FDckIsQ0FBQztBQUVGOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxHQUFXO0lBQ3RELE9BQU8scUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxPQUFPLE1BQU07SUFBbkI7UUFDVywwQkFBVyxJQUFJLGVBQWUsRUFBYyxFQUFDO1FBQzdDLG1DQUFvQixJQUFJLGVBQWUsRUFBdUIsRUFBQztJQXNEMUUsQ0FBQztJQXBEQzs7Ozs7T0FLRztJQUNILE9BQU8sQ0FBQyxPQUFpQztRQUN2Qyx1QkFBQSxJQUFJLHVCQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGdCQUFnQixDQUFDLE9BQTBDO1FBQ3pELHVCQUFBLElBQUksZ0NBQWtCLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGlCQUFpQixDQUFDLE9BQWlDO1FBQ2pELE9BQU8sdUJBQUEsSUFBSSx1QkFBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCwwQkFBMEIsQ0FBQyxPQUEwQztRQUNuRSxPQUFPLHVCQUFBLElBQUksZ0NBQWtCLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsS0FBSyxDQUFDLHFCQUFxQjtRQUN6QixNQUFNLHVCQUFBLElBQUksZ0NBQWtCLENBQUMsUUFBUSxDQUFzQixFQUFFLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQWlCO1FBQ3ZDLE1BQU0sdUJBQUEsSUFBSSx1QkFBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7O0FBRUQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUd2Qjs7OztPQUlHO0lBQ0gsWUFBWSxNQUFnQixFQUFFLFVBQW9CO1FBUHpDLHVDQUFrQjtRQVF6QixVQUFVLEtBQUssS0FBSyxDQUFDO1FBQ3JCLHVCQUFBLElBQUksd0JBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLHVCQUFBLElBQUksNEJBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxHQUFlO1FBQ3hDLEtBQUssTUFBTSxFQUFFLElBQUksdUJBQUEsSUFBSSw0QkFBUSxFQUFFLENBQUM7WUFDOUIsTUFBTSxFQUFFLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELCtGQUErRjtRQUMvRixFQUFFO1FBQ0YseUZBQXlGO1FBQ3pGLDJFQUEyRTtRQUMzRSxJQUNFLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRztZQUNsQixDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsU0FBUyxJQUFJLHNCQUFzQixDQUFDLEVBQ3RGLENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsa0JBQWtCO1FBQ3RCLEtBQUssTUFBTSxDQUFDLElBQUksdUJBQUEsSUFBSSw0QkFBUSxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQztDQUNGOztBQUVEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFcnJSZXNwb25zZSB9IGZyb20gXCIuL2Vycm9yXCI7XG5cbmV4cG9ydCB0eXBlIEV2ZW50SGFuZGxlcjxUPiA9IChldmVudDogVCkgPT4gUHJvbWlzZTx2b2lkPjtcbmV4cG9ydCB0eXBlIEVycm9yRXZlbnQgPSBFcnJSZXNwb25zZTtcblxuLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1pbnRlcmZhY2UgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbkV4cGlyZWRFdmVudCB7fVxuXG4vKipcbiAqIERpc3BhdGNoZXIgZm9yIGEgc2luZ2xlIGV2ZW50IHR5cGUuXG4gKlxuICogUHJvdmlkZXMgbWV0aG9kcyBmb3IgcmVnaXN0ZXJpbmcgYW5kIHVucmVnaXN0ZXJpbmcgaGFuZGxlcnMsXG4gKiBhcyB3ZWxsIGFzIGRpc3BhdGNoaW5nIGV2ZW50cyB0byBhbGwgcmVnaXN0ZXJlZCBoYW5kbGVycy5cbiAqL1xuY2xhc3MgRXZlbnREaXNwYXRjaGVyPFQ+IHtcbiAgcmVhZG9ubHkgI2hhbmRsZXJzOiBFdmVudEhhbmRsZXI8VD5bXTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLiNoYW5kbGVycyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbmV3IGhhbmRsZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPFQ+fSBoYW5kbGVyIEV2ZW50IGhhbmRsZXIgdG8gcmVnaXN0ZXJcbiAgICogQHJldHVybiB7RXZlbnREaXNwYXRjaGVyPFQ+fSBUaGlzIGluc3RhbmNlIHRvIGFsbG93IGZvciBjaGFpbmluZy5cbiAgICovXG4gIHJlZ2lzdGVyKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPik6IEV2ZW50RGlzcGF0Y2hlcjxUPiB7XG4gICAgdGhpcy4jaGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGEgaGFuZGxlci4gSWYge0BsaW5rIGhhbmRsZXJ9IGlzIG5vdCBhbHJlYWR5IHJlZ2lzdGVyZWQsIGl0J3MgYSBuby1vcC5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8VD59IGhhbmRsZXIgRXZlbnQgaGFuZGxlciB0byB1bnJlZ2lzdGVyXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGhhbmRsZXIgd2FzIGZvdW5kIChhbmQgdW5yZWdpc3RlcmVkKS5cbiAgICovXG4gIHVucmVnaXN0ZXIoaGFuZGxlcjogRXZlbnRIYW5kbGVyPFQ+KTogYm9vbGVhbiB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy4jaGFuZGxlcnMuaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIHRoaXMuI2hhbmRsZXJzLnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGlzcGF0Y2ggYW4gZXZlbnQgdG8gYWxsIHJlZ2lzdGVyZWQgaGFuZGxlcnMuXG4gICAqIEBwYXJhbSB7VH0gZXZlbnQgRXZlbnQgdG8gZGlzcGF0Y2guXG4gICAqL1xuICBhc3luYyBkaXNwYXRjaChldmVudDogVCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuI2hhbmRsZXJzLm1hcCgoaCkgPT4gaChldmVudCkpKTtcbiAgfVxufVxuXG5jb25zdCBTZXNzaW9uRXhwaXJlZFJlZ2V4ZXMgPSBbXG4gIC9eU2Vzc2lvbiAnKD88cHVycG9zZT5bXiddKiknIGZvciAnKD88aWRlbnRpdHk+W14nXSopJyBoYXMgZXhwaXJlZCQvLFxuICAvXlNlc3Npb24gJyg/PHB1cnBvc2U+W14nXSopJyBmb3IgJyg/PGlkZW50aXR5PlteJ10qKScgaGFzIGJlZW4gcmV2b2tlZCQvLFxuICAvXkF1dGggdG9rZW4gZm9yIGVwb2NoICg/PGVwb2NoPlxcZCspIGhhcyBleHBpcmVkJC8sXG4gIC9eUmVmcmVzaCB0b2tlbiBmb3IgZXBvY2ggKD88ZXBvY2hfbnVtPlxcZCspIGhhcyBleHBpcmVkJC8sXG4gIC9eT3V0ZGF0ZWQgc2Vzc2lvbiQvLFxuXTtcblxuLyoqXG4gKiBXaGV0aGVyIGFuIGVycm9yIG1lc3NhZ2UgbWF0Y2hlcyBvbmUgb2Ygc2V2ZXJhbCBkaWZmZXJlbnQgXCJzZXNzaW9uIGV4cGlyZWRcIiByZXNwb25zZXMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG1zZyBUaGUgc3RyaW5nIHRvIHRlc3QuXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBzdHJpbmcgbWF0Y2hlcy5cbiAqIEBpbnRlcm5hbCBFeHBvcnRlZCBvbmx5IHNvIHRoYXQgaXQgY2FuIGJlIGNhbGxlZCBmcm9tIGEgdW5pdCB0ZXN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXNzYWdlTWF0Y2hlc1Nlc3Npb25FeHBpcmVkKG1zZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBTZXNzaW9uRXhwaXJlZFJlZ2V4ZXMuc29tZSgocmUpID0+IHJlLnRlc3QobXNnKSk7XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlZ2lzdGVyaW5nIGFuZCB1bnJlZ2lzdGVyaW5nIGV2ZW50IGhhbmRsZXJzLlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRzIHtcbiAgcmVhZG9ubHkgI29uRXJyb3IgPSBuZXcgRXZlbnREaXNwYXRjaGVyPEVycm9yRXZlbnQ+KCk7XG4gIHJlYWRvbmx5ICNvblNlc3Npb25FeHBpcmVkID0gbmV3IEV2ZW50RGlzcGF0Y2hlcjxTZXNzaW9uRXhwaXJlZEV2ZW50PigpO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGhhbmRsZXIgZm9yIHtAbGluayBFcnJvckV2ZW50fTogdHJpZ2dlcmVkIGV2ZXJ5IHRpbWUgYSByZXF1ZXN0IHRvXG4gICAqIGEgQ3ViZVNpZ25lciBBUEkgZW5kcG9pbnQgcmV0dXJucyBhIG5vbi1zdWNjZXNzIHJlc3BvbnNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50SGFuZGxlcjxFcnJvckV2ZW50Pn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byByZWdpc3Rlci5cbiAgICovXG4gIG9uRXJyb3IoaGFuZGxlcjogRXZlbnRIYW5kbGVyPEVycm9yRXZlbnQ+KSB7XG4gICAgdGhpcy4jb25FcnJvci5yZWdpc3RlcihoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGhhbmRsZXIgZm9yIHtAbGluayBTZXNzaW9uRXhwaXJlZEV2ZW50fTogdHJpZ2dlcmVkIGV2ZXJ5IHRpbWUgYVxuICAgKiByZXF1ZXN0IHRvIGEgQ3ViZVNpZ25lciBBUEkgZW5kcG9pbnQgZmFpbHMgYmVjYXVzZSBvZiBhbiBleHBpcmVkIHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPFNlc3Npb25FeHBpcmVkRXZlbnQ+fSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIHJlZ2lzdGVyLlxuICAgKi9cbiAgb25TZXNzaW9uRXhwaXJlZChoYW5kbGVyOiBFdmVudEhhbmRsZXI8U2Vzc2lvbkV4cGlyZWRFdmVudD4pIHtcbiAgICB0aGlzLiNvblNlc3Npb25FeHBpcmVkLnJlZ2lzdGVyKGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBoYW5kbGVyIGZvciB7QGxpbmsgRXJyb3JFdmVudH0uXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyPEVycm9yRXZlbnQ+fSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIHVucmVnaXN0ZXIuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGhhbmRsZXIgd2FzIGZvdW5kIChhbmQgdW5yZWdpc3RlcmVkKS5cbiAgICovXG4gIHVucmVnaXN0ZXJPbkVycm9yKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxFcnJvckV2ZW50Pik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNvbkVycm9yLnVucmVnaXN0ZXIoaGFuZGxlcik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGhhbmRsZXIgZm9yIHtAbGluayBTZXNzaW9uRXhwaXJlZEV2ZW50fS5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudEhhbmRsZXI8U2Vzc2lvbkV4cGlyZWRFdmVudD59IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gdW5yZWdpc3Rlci5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgaGFuZGxlciB3YXMgZm91bmQgKGFuZCB1bnJlZ2lzdGVyZWQpLlxuICAgKi9cbiAgdW5yZWdpc3Rlck9uU2Vzc2lvbkV4cGlyZWQoaGFuZGxlcjogRXZlbnRIYW5kbGVyPFNlc3Npb25FeHBpcmVkRXZlbnQ+KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI29uU2Vzc2lvbkV4cGlyZWQudW5yZWdpc3RlcihoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgYXN5bmMgdHJpZ2dlclNlc3Npb25FeHBpcmVkKCkge1xuICAgIGF3YWl0IHRoaXMuI29uU2Vzc2lvbkV4cGlyZWQuZGlzcGF0Y2goPFNlc3Npb25FeHBpcmVkRXZlbnQ+e30pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RXJyb3JFdmVudH0gZXZlbnQgRXZlbnQgdG8gdHJpZ2dlclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIHRyaWdnZXJFcnJvckV2ZW50KGV2ZW50OiBFcnJvckV2ZW50KSB7XG4gICAgYXdhaXQgdGhpcy4jb25FcnJvci5kaXNwYXRjaChldmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNsYXNzaWZ5IGFuZCBlbWl0IGV2ZW50cyB0byBvbmUgb3IgbW9yZSB7QGxpbmsgRXZlbnRzfSBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXIge1xuICByZWFkb25seSAjZXZlbnRzOiBFdmVudHNbXTtcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHtFdmVudHNbXX0gZXZlbnRzIEluc3RhbmNlcyB0byB3aGljaCB0byBlbWl0IGV2ZW50c1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNraXBHbG9iYWwgV2hldGhlciB0byBpbmNsdWRlIHRoZSBnbG9iYWwgZXZlbnRzIGluc3RhbmNlIHtAbGluayBHbG9iYWxFdmVudHN9XG4gICAqL1xuICBjb25zdHJ1Y3RvcihldmVudHM6IEV2ZW50c1tdLCBza2lwR2xvYmFsPzogYm9vbGVhbikge1xuICAgIHNraXBHbG9iYWwgPz89IGZhbHNlO1xuICAgIHRoaXMuI2V2ZW50cyA9IGV2ZW50cztcbiAgICBpZiAoIXNraXBHbG9iYWwpIHtcbiAgICAgIHRoaXMuI2V2ZW50cy5wdXNoKEdsb2JhbEV2ZW50cyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSB7QGxpbmsgQ3ViZVNpZ25lckFwaX0gd2hlbiBhbiBBUEkgcmVzcG9uc2UgaW5kaWNhdGVzIGFuIGVycm9yLlxuICAgKlxuICAgKiBAcGFyYW0ge0Vycm9yRXZlbnR9IGVyciBUaGUgZXJyb3IgdG8gZGlzcGF0Y2guXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgY2xhc3NpZnlBbmRFbWl0RXJyb3IoZXJyOiBFcnJvckV2ZW50KSB7XG4gICAgZm9yIChjb25zdCBldiBvZiB0aGlzLiNldmVudHMpIHtcbiAgICAgIGF3YWl0IGV2LnRyaWdnZXJFcnJvckV2ZW50KGVycik7XG4gICAgfVxuXG4gICAgLy8gaWYgc3RhdHVzIGlzIDQwMyBhbmQgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlIFNlc3Npb25FeHBpcmVkUmVnZXhlcyB0cmlnZ2VyIG9uU2Vzc2lvbkV4cGlyZWRcbiAgICAvL1xuICAgIC8vIFRPRE86IGJlY2F1c2UgZXJyb3JzIHJldHVybmVkIGJ5IHRoZSBhdXRob3JpemVyIGxhbWJkYSBhcmUgbm90IGZvcndhcmRlZCB0byB0aGUgY2xpZW50XG4gICAgLy8gICAgICAgd2UgYWxzbyB0cmlnZ2VyIG9uU2Vzc2lvbkV4cGlyZWQgd2hlbiBcInNpZ25lclNlc3Npb25SZWZyZXNoXCIgZmFpbHNcbiAgICBpZiAoXG4gICAgICBlcnIuc3RhdHVzID09PSA0MDMgJiZcbiAgICAgIChtZXNzYWdlTWF0Y2hlc1Nlc3Npb25FeHBpcmVkKGVyci5tZXNzYWdlKSB8fCBlcnIub3BlcmF0aW9uID09IFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIilcbiAgICApIHtcbiAgICAgIGF3YWl0IHRoaXMuZW1pdFNlc3Npb25FeHBpcmVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSB7QGxpbmsgU2lnbmVyU2Vzc2lvbk1hbmFnZXJ9IHRvIG5vdGlmeSB0aGF0IHRoZSBzZXNzaW9uIGlzIGV4cGlyZWRcbiAgICogYmV5b25kIHRoZSBwb3NzaWJpbGl0eSBvZiByZWZyZXNoaW5nLCBtZWFuaW5nIHRoYXQgZnVsbCByZS1sb2dpbiBpcyByZXF1aXJlZC5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBlbWl0U2Vzc2lvbkV4cGlyZWQoKSB7XG4gICAgZm9yIChjb25zdCBlIG9mIHRoaXMuI2V2ZW50cykge1xuICAgICAgYXdhaXQgZS50cmlnZ2VyU2Vzc2lvbkV4cGlyZWQoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHbG9iYWwgZXZlbnRzLlxuICovXG5leHBvcnQgY29uc3QgR2xvYmFsRXZlbnRzID0gbmV3IEV2ZW50cygpO1xuIl19