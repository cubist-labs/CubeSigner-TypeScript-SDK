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
     * @param {Function} listener The associated event data
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFVQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFhLFlBQVk7SUFBekI7O1FBQ0Usa0RBQWtEO1FBQ2xELGtDQUFrQyxFQUFFLEVBQUM7SUErQ3ZDLENBQUM7SUFuQ0M7Ozs7OztPQU1HO0lBQ0gsZ0JBQWdCLENBQWtDLEtBQVEsRUFBRSxRQUFtQjtRQUM3RSx1QkFBQSxJQUFJLGlFQUFvQixNQUF4QixJQUFJLEVBQXFCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxtQkFBbUIsQ0FBa0MsS0FBUSxFQUFFLFFBQW1CO1FBQ2hGLHVCQUFBLElBQUksaUVBQW9CLE1BQXhCLElBQUksRUFBcUIsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsSUFBSSxDQUFrQyxLQUFRLEVBQUUsR0FBRyxJQUEyQjtRQUM1RSxLQUFLLE1BQU0sUUFBUSxJQUFJLHVCQUFBLElBQUksaUVBQW9CLE1BQXhCLElBQUksRUFBcUIsS0FBSyxDQUFDLEVBQUU7WUFDdEQsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDbkI7SUFDSCxDQUFDO0NBQ0Y7QUFqREQsb0NBaURDOytKQXZDc0QsS0FBUTtJQUMzRCxPQUFPLHVCQUFBLElBQUksK0JBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksK0JBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDeEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBVc2VkIHRvIGRlY2xhcmUgdGhlIHR5cGUgb2YgYW4gZXZlbnQgZW1pdHRlci4gU2VlIHtAbGluayBFdmVudEVtaXR0ZXJ9ICovXG50eXBlIEV2ZW50TWFwID0ge1xuICBba2V5OiBzdHJpbmddOiAoLi4uYXJnczogbmV2ZXJbXSkgPT4gdm9pZDtcbn07XG5cbi8qKiBUaGUgdHlwZSBvZiB0aGUgaW50ZXJuYWwgc3RvcmFnZSBvZiBsaXN0ZW5lcnMgKi9cbnR5cGUgTGlzdGVuZXJNYXA8VD4gPSB7XG4gIFtLIGluIGtleW9mIFRdPzogU2V0PFRbS10+O1xufTtcblxuLyoqXG4gKiBUeXBlLXNhZmUgZXZlbnQgZW1pdHRlci5cbiAqXG4gKiBVc2UgaXQgbGlrZSB0aGlzOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHR5cGUgTXlFdmVudHMgPSB7XG4gKiAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xuICogICBtZXNzYWdlOiAoZnJvbTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpID0+IHZvaWQ7XG4gKiB9XG4gKlxuICogY29uc3QgbXlFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcjxNeUV2ZW50cz4oKTtcbiAqXG4gKiBteUVtaXR0ZXIuZW1pdChcImVycm9yXCIsIFwieFwiKSAgLy8gPC0gV2lsbCBjYXRjaCB0aGlzIHR5cGUgZXJyb3I7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50RW1pdHRlcjxFdmVudHMgZXh0ZW5kcyBFdmVudE1hcD4ge1xuICAvKiogVGhlIHN0b3JlIG9mIGN1cnJlbnRseSByZWdpc3RlcmVkIGxpc3RlbmVycyAqL1xuICAjbGlzdGVuZXJzOiBMaXN0ZW5lck1hcDxFdmVudHM+ID0ge307XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgc2V0IG9mIGxpc3RlbmVycyBmb3IgYSBnaXZlbiBldmVudCAoY29uc3RydWN0aW5nIHRoZSBTZXQgaWYgbmVjZXNzYXJ5KVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHRvIGdldCB0aGUgbGlzdGVuZXJzIGZvclxuICAgKiBAcmV0dXJuIHtTZXQ8RnVuY3Rpb24+fSBUaGUgbGlzdGVuZXJzIGZvciB0aGUgZ2l2ZW4gZXZlbnRcbiAgICovXG4gICNnZXRPckluaXRMaXN0ZW5lcnM8RSBleHRlbmRzIGtleW9mIEV2ZW50cyAmIHN0cmluZz4oZXZlbnQ6IEUpOiBTZXQ8RXZlbnRzW0VdPiB7XG4gICAgcmV0dXJuIHRoaXMuI2xpc3RlbmVyc1tldmVudF0gPz8gKHRoaXMuI2xpc3RlbmVyc1tldmVudF0gPSBuZXcgU2V0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIGZvciBhbiBldmVudCAodGhlIHNhbWUgbGlzdGVuZXIgY2Fubm90IGJlIHJlZ2lzdGVyZWQgdHdpY2UpXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIFRoZSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIG9uIHRoYXQgZXZlbnRcbiAgICogQHJldHVybiB7RXZlbnRFbWl0dGVyfVxuICAgKi9cbiAgYWRkRXZlbnRMaXN0ZW5lcjxFIGV4dGVuZHMga2V5b2YgRXZlbnRzICYgc3RyaW5nPihldmVudDogRSwgbGlzdGVuZXI6IEV2ZW50c1tFXSk6IHRoaXMge1xuICAgIHRoaXMuI2dldE9ySW5pdExpc3RlbmVycyhldmVudCkuYWRkKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsaXN0ZW5lciBmb3IgYW4gZXZlbnRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb21cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgVGhlIGxpc3RlbmVyIHRvIGJlIHJlbW92ZWRcbiAgICogQHJldHVybiB7RXZlbnRFbWl0dGVyfVxuICAgKi9cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjxFIGV4dGVuZHMga2V5b2YgRXZlbnRzICYgc3RyaW5nPihldmVudDogRSwgbGlzdGVuZXI6IEV2ZW50c1tFXSk6IHRoaXMge1xuICAgIHRoaXMuI2dldE9ySW5pdExpc3RlbmVycyhldmVudCkuZGVsZXRlKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0IGFuIGV2ZW50LCBpbnZva2luZyBhbGwgdGhlIGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHRvIGludm9rZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBUaGUgYXNzb2NpYXRlZCBldmVudCBkYXRhXG4gICAqL1xuICBlbWl0PEUgZXh0ZW5kcyBrZXlvZiBFdmVudHMgJiBzdHJpbmc+KGV2ZW50OiBFLCAuLi5hcmdzOiBQYXJhbWV0ZXJzPEV2ZW50c1tFXT4pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMuI2dldE9ySW5pdExpc3RlbmVycyhldmVudCkpIHtcbiAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xuICAgIH1cbiAgfVxufVxuIl19