"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _EventEmitter_instances, _EventEmitter_listeners, _EventEmitter_getOrInitListeners;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = void 0;
/**
 * Type-safe event emitter.
 *
 * Use it like this:
 *
 * ```typescript
 * type MyEvents = {
 *   error: (error: Error) => void;
 *   message: (from: string, content: string) => void;
 * }
 *
 * const myEmitter = new EventEmitter<MyEvents>();
 *
 * myEmitter.emit("error", "x")  // <- Will catch this type error;
 * ```
 */
class EventEmitter {
    constructor() {
        _EventEmitter_instances.add(this);
        /** The store of currently registered listeners */
        _EventEmitter_listeners.set(this, {});
    }
    /**
     * Add a listener for an event (the same listener cannot be registered twice)
     *
     * @param {string} event The event to listen to
     * @param {Function} listener The function to be invoked on that event
     * @return {EventEmitter}
     */
    addEventListener(event, listener) {
        __classPrivateFieldGet(this, _EventEmitter_instances, "m", _EventEmitter_getOrInitListeners).call(this, event).add(listener);
        return this;
    }
    /**
     * Remove a listener for an event
     *
     * @param {string} event The event to remove the listener from
     * @param {Function} listener The listener to be removed
     * @return {EventEmitter}
     */
    removeEventListener(event, listener) {
        __classPrivateFieldGet(this, _EventEmitter_instances, "m", _EventEmitter_getOrInitListeners).call(this, event).delete(listener);
        return this;
    }
    /**
     * Emit an event, invoking all the listeners
     *
     * @param {string} event The event to invoke
     * @param {...Parameters<Function>} args The associated event data
     */
    emit(event, ...args) {
        for (const listener of __classPrivateFieldGet(this, _EventEmitter_instances, "m", _EventEmitter_getOrInitListeners).call(this, event)) {
            listener(...args);
        }
    }
}
exports.EventEmitter = EventEmitter;
_EventEmitter_listeners = new WeakMap(), _EventEmitter_instances = new WeakSet(), _EventEmitter_getOrInitListeners = function _EventEmitter_getOrInitListeners(event) {
    return __classPrivateFieldGet(this, _EventEmitter_listeners, "f")[event] ?? (__classPrivateFieldGet(this, _EventEmitter_listeners, "f")[event] = new Set());
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFVQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFhLFlBQVk7SUFBekI7O1FBQ0Usa0RBQWtEO1FBQ2xELGtDQUFrQyxFQUFFLEVBQUM7SUErQ3ZDLENBQUM7SUFuQ0M7Ozs7OztPQU1HO0lBQ0gsZ0JBQWdCLENBQWtDLEtBQVEsRUFBRSxRQUFtQjtRQUM3RSx1QkFBQSxJQUFJLGlFQUFvQixNQUF4QixJQUFJLEVBQXFCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxtQkFBbUIsQ0FBa0MsS0FBUSxFQUFFLFFBQW1CO1FBQ2hGLHVCQUFBLElBQUksaUVBQW9CLE1BQXhCLElBQUksRUFBcUIsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsSUFBSSxDQUFrQyxLQUFRLEVBQUUsR0FBRyxJQUEyQjtRQUM1RSxLQUFLLE1BQU0sUUFBUSxJQUFJLHVCQUFBLElBQUksaUVBQW9CLE1BQXhCLElBQUksRUFBcUIsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2RCxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNwQixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBakRELG9DQWlEQzsrSkF2Q3NELEtBQVE7SUFDM0QsT0FBTyx1QkFBQSxJQUFJLCtCQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLCtCQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3hFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogVXNlZCB0byBkZWNsYXJlIHRoZSB0eXBlIG9mIGFuIGV2ZW50IGVtaXR0ZXIuIFNlZSB7QGxpbmsgRXZlbnRFbWl0dGVyfSAqL1xuZXhwb3J0IHR5cGUgRXZlbnRNYXAgPSB7XG4gIFtrZXk6IHN0cmluZ106ICguLi5hcmdzOiBuZXZlcltdKSA9PiB2b2lkO1xufTtcblxuLyoqIFRoZSB0eXBlIG9mIHRoZSBpbnRlcm5hbCBzdG9yYWdlIG9mIGxpc3RlbmVycyAqL1xudHlwZSBMaXN0ZW5lck1hcDxUPiA9IHtcbiAgW0sgaW4ga2V5b2YgVF0/OiBTZXQ8VFtLXT47XG59O1xuXG4vKipcbiAqIFR5cGUtc2FmZSBldmVudCBlbWl0dGVyLlxuICpcbiAqIFVzZSBpdCBsaWtlIHRoaXM6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdHlwZSBNeUV2ZW50cyA9IHtcbiAqICAgZXJyb3I6IChlcnJvcjogRXJyb3IpID0+IHZvaWQ7XG4gKiAgIG1lc3NhZ2U6IChmcm9tOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZykgPT4gdm9pZDtcbiAqIH1cbiAqXG4gKiBjb25zdCBteUVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyPE15RXZlbnRzPigpO1xuICpcbiAqIG15RW1pdHRlci5lbWl0KFwiZXJyb3JcIiwgXCJ4XCIpICAvLyA8LSBXaWxsIGNhdGNoIHRoaXMgdHlwZSBlcnJvcjtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyPEV2ZW50cyBleHRlbmRzIEV2ZW50TWFwPiB7XG4gIC8qKiBUaGUgc3RvcmUgb2YgY3VycmVudGx5IHJlZ2lzdGVyZWQgbGlzdGVuZXJzICovXG4gICNsaXN0ZW5lcnM6IExpc3RlbmVyTWFwPEV2ZW50cz4gPSB7fTtcblxuICAvKipcbiAgICogR2V0IHRoZSBzZXQgb2YgbGlzdGVuZXJzIGZvciBhIGdpdmVuIGV2ZW50IChjb25zdHJ1Y3RpbmcgdGhlIFNldCBpZiBuZWNlc3NhcnkpXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdG8gZ2V0IHRoZSBsaXN0ZW5lcnMgZm9yXG4gICAqIEByZXR1cm4ge1NldDxGdW5jdGlvbj59IFRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBnaXZlbiBldmVudFxuICAgKi9cbiAgI2dldE9ySW5pdExpc3RlbmVyczxFIGV4dGVuZHMga2V5b2YgRXZlbnRzICYgc3RyaW5nPihldmVudDogRSk6IFNldDxFdmVudHNbRV0+IHtcbiAgICByZXR1cm4gdGhpcy4jbGlzdGVuZXJzW2V2ZW50XSA/PyAodGhpcy4jbGlzdGVuZXJzW2V2ZW50XSA9IG5ldyBTZXQoKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbGlzdGVuZXIgZm9yIGFuIGV2ZW50ICh0aGUgc2FtZSBsaXN0ZW5lciBjYW5ub3QgYmUgcmVnaXN0ZXJlZCB0d2ljZSlcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0byBsaXN0ZW4gdG9cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgVGhlIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgb24gdGhhdCBldmVudFxuICAgKiBAcmV0dXJuIHtFdmVudEVtaXR0ZXJ9XG4gICAqL1xuICBhZGRFdmVudExpc3RlbmVyPEUgZXh0ZW5kcyBrZXlvZiBFdmVudHMgJiBzdHJpbmc+KGV2ZW50OiBFLCBsaXN0ZW5lcjogRXZlbnRzW0VdKTogdGhpcyB7XG4gICAgdGhpcy4jZ2V0T3JJbml0TGlzdGVuZXJzKGV2ZW50KS5hZGQobGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIGxpc3RlbmVyIGZvciBhbiBldmVudFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBUaGUgbGlzdGVuZXIgdG8gYmUgcmVtb3ZlZFxuICAgKiBAcmV0dXJuIHtFdmVudEVtaXR0ZXJ9XG4gICAqL1xuICByZW1vdmVFdmVudExpc3RlbmVyPEUgZXh0ZW5kcyBrZXlvZiBFdmVudHMgJiBzdHJpbmc+KGV2ZW50OiBFLCBsaXN0ZW5lcjogRXZlbnRzW0VdKTogdGhpcyB7XG4gICAgdGhpcy4jZ2V0T3JJbml0TGlzdGVuZXJzKGV2ZW50KS5kZWxldGUobGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXQgYW4gZXZlbnQsIGludm9raW5nIGFsbCB0aGUgbGlzdGVuZXJzXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7Li4uUGFyYW1ldGVyczxGdW5jdGlvbj59IGFyZ3MgVGhlIGFzc29jaWF0ZWQgZXZlbnQgZGF0YVxuICAgKi9cbiAgZW1pdDxFIGV4dGVuZHMga2V5b2YgRXZlbnRzICYgc3RyaW5nPihldmVudDogRSwgLi4uYXJnczogUGFyYW1ldGVyczxFdmVudHNbRV0+KTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLiNnZXRPckluaXRMaXN0ZW5lcnMoZXZlbnQpKSB7XG4gICAgICBsaXN0ZW5lciguLi5hcmdzKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==