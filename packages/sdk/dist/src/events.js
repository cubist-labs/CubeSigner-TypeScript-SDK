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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFVQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFhLFlBQVk7SUFBekI7O1FBQ0Usa0RBQWtEO1FBQ2xELGtDQUFrQyxFQUFFLEVBQUM7SUErQ3ZDLENBQUM7SUFuQ0M7Ozs7OztPQU1HO0lBQ0gsZ0JBQWdCLENBQWtDLEtBQVEsRUFBRSxRQUFtQjtRQUM3RSx1QkFBQSxJQUFJLGlFQUFvQixNQUF4QixJQUFJLEVBQXFCLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxtQkFBbUIsQ0FBa0MsS0FBUSxFQUFFLFFBQW1CO1FBQ2hGLHVCQUFBLElBQUksaUVBQW9CLE1BQXhCLElBQUksRUFBcUIsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsSUFBSSxDQUFrQyxLQUFRLEVBQUUsR0FBRyxJQUEyQjtRQUM1RSxLQUFLLE1BQU0sUUFBUSxJQUFJLHVCQUFBLElBQUksaUVBQW9CLE1BQXhCLElBQUksRUFBcUIsS0FBSyxDQUFDLEVBQUU7WUFDdEQsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDbkI7SUFDSCxDQUFDO0NBQ0Y7QUFqREQsb0NBaURDOytKQXZDc0QsS0FBUTtJQUMzRCxPQUFPLHVCQUFBLElBQUksK0JBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksK0JBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDeEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBVc2VkIHRvIGRlY2xhcmUgdGhlIHR5cGUgb2YgYW4gZXZlbnQgZW1pdHRlci4gU2VlIHtAbGluayBFdmVudEVtaXR0ZXJ9ICovXG5leHBvcnQgdHlwZSBFdmVudE1hcCA9IHtcbiAgW2tleTogc3RyaW5nXTogKC4uLmFyZ3M6IG5ldmVyW10pID0+IHZvaWQ7XG59O1xuXG4vKiogVGhlIHR5cGUgb2YgdGhlIGludGVybmFsIHN0b3JhZ2Ugb2YgbGlzdGVuZXJzICovXG50eXBlIExpc3RlbmVyTWFwPFQ+ID0ge1xuICBbSyBpbiBrZXlvZiBUXT86IFNldDxUW0tdPjtcbn07XG5cbi8qKlxuICogVHlwZS1zYWZlIGV2ZW50IGVtaXR0ZXIuXG4gKlxuICogVXNlIGl0IGxpa2UgdGhpczpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0eXBlIE15RXZlbnRzID0ge1xuICogICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4gdm9pZDtcbiAqICAgbWVzc2FnZTogKGZyb206IHN0cmluZywgY29udGVudDogc3RyaW5nKSA9PiB2b2lkO1xuICogfVxuICpcbiAqIGNvbnN0IG15RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXI8TXlFdmVudHM+KCk7XG4gKlxuICogbXlFbWl0dGVyLmVtaXQoXCJlcnJvclwiLCBcInhcIikgIC8vIDwtIFdpbGwgY2F0Y2ggdGhpcyB0eXBlIGVycm9yO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXI8RXZlbnRzIGV4dGVuZHMgRXZlbnRNYXA+IHtcbiAgLyoqIFRoZSBzdG9yZSBvZiBjdXJyZW50bHkgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMgKi9cbiAgI2xpc3RlbmVyczogTGlzdGVuZXJNYXA8RXZlbnRzPiA9IHt9O1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHNldCBvZiBsaXN0ZW5lcnMgZm9yIGEgZ2l2ZW4gZXZlbnQgKGNvbnN0cnVjdGluZyB0aGUgU2V0IGlmIG5lY2Vzc2FyeSlcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0byBnZXQgdGhlIGxpc3RlbmVycyBmb3JcbiAgICogQHJldHVybiB7U2V0PEZ1bmN0aW9uPn0gVGhlIGxpc3RlbmVycyBmb3IgdGhlIGdpdmVuIGV2ZW50XG4gICAqL1xuICAjZ2V0T3JJbml0TGlzdGVuZXJzPEUgZXh0ZW5kcyBrZXlvZiBFdmVudHMgJiBzdHJpbmc+KGV2ZW50OiBFKTogU2V0PEV2ZW50c1tFXT4ge1xuICAgIHJldHVybiB0aGlzLiNsaXN0ZW5lcnNbZXZlbnRdID8/ICh0aGlzLiNsaXN0ZW5lcnNbZXZlbnRdID0gbmV3IFNldCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciBmb3IgYW4gZXZlbnQgKHRoZSBzYW1lIGxpc3RlbmVyIGNhbm5vdCBiZSByZWdpc3RlcmVkIHR3aWNlKVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHRvIGxpc3RlbiB0b1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBvbiB0aGF0IGV2ZW50XG4gICAqIEByZXR1cm4ge0V2ZW50RW1pdHRlcn1cbiAgICovXG4gIGFkZEV2ZW50TGlzdGVuZXI8RSBleHRlbmRzIGtleW9mIEV2ZW50cyAmIHN0cmluZz4oZXZlbnQ6IEUsIGxpc3RlbmVyOiBFdmVudHNbRV0pOiB0aGlzIHtcbiAgICB0aGlzLiNnZXRPckluaXRMaXN0ZW5lcnMoZXZlbnQpLmFkZChsaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGEgbGlzdGVuZXIgZm9yIGFuIGV2ZW50XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIFRoZSBsaXN0ZW5lciB0byBiZSByZW1vdmVkXG4gICAqIEByZXR1cm4ge0V2ZW50RW1pdHRlcn1cbiAgICovXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXI8RSBleHRlbmRzIGtleW9mIEV2ZW50cyAmIHN0cmluZz4oZXZlbnQ6IEUsIGxpc3RlbmVyOiBFdmVudHNbRV0pOiB0aGlzIHtcbiAgICB0aGlzLiNnZXRPckluaXRMaXN0ZW5lcnMoZXZlbnQpLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRW1pdCBhbiBldmVudCwgaW52b2tpbmcgYWxsIHRoZSBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0byBpbnZva2VcbiAgICogQHBhcmFtIHsuLi5QYXJhbWV0ZXJzPEZ1bmN0aW9uPn0gYXJncyBUaGUgYXNzb2NpYXRlZCBldmVudCBkYXRhXG4gICAqL1xuICBlbWl0PEUgZXh0ZW5kcyBrZXlvZiBFdmVudHMgJiBzdHJpbmc+KGV2ZW50OiBFLCAuLi5hcmdzOiBQYXJhbWV0ZXJzPEV2ZW50c1tFXT4pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMuI2dldE9ySW5pdExpc3RlbmVycyhldmVudCkpIHtcbiAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xuICAgIH1cbiAgfVxufVxuIl19