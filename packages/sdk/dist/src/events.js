var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _EventEmitter_instances, _EventEmitter_listeners, _EventEmitter_getOrInitListeners;
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
export class EventEmitter {
    constructor() {
        _EventEmitter_instances.add(this);
        /** The store of currently registered listeners */
        _EventEmitter_listeners.set(this, {});
    }
    /**
     * Add a listener for an event (the same listener cannot be registered twice)
     *
     * @param event The event to listen to
     * @param listener The function to be invoked on that event
     * @returns This EventEmitter with the new event listener
     */
    addEventListener(event, listener) {
        __classPrivateFieldGet(this, _EventEmitter_instances, "m", _EventEmitter_getOrInitListeners).call(this, event).add(listener);
        return this;
    }
    /**
     * Remove a listener for an event
     *
     * @param event The event to remove the listener from
     * @param listener The listener to be removed
     * @returns This EventEmitter with the event listener removed
     */
    removeEventListener(event, listener) {
        __classPrivateFieldGet(this, _EventEmitter_instances, "m", _EventEmitter_getOrInitListeners).call(this, event).delete(listener);
        return this;
    }
    /**
     * Emit an event, invoking all the listeners
     *
     * @param event The event to invoke
     * @param args The associated event data
     */
    emit(event, ...args) {
        for (const listener of __classPrivateFieldGet(this, _EventEmitter_instances, "m", _EventEmitter_getOrInitListeners).call(this, event)) {
            listener(...args);
        }
    }
}
_EventEmitter_listeners = new WeakMap(), _EventEmitter_instances = new WeakSet(), _EventEmitter_getOrInitListeners = function _EventEmitter_getOrInitListeners(event) {
    return __classPrivateFieldGet(this, _EventEmitter_listeners, "f")[event] ?? (__classPrivateFieldGet(this, _EventEmitter_listeners, "f")[event] = new Set());
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFVQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUF6Qjs7UUFDRSxrREFBa0Q7UUFDbEQsa0NBQWtDLEVBQUUsRUFBQztJQStDdkMsQ0FBQztJQW5DQzs7Ozs7O09BTUc7SUFDSCxnQkFBZ0IsQ0FBa0MsS0FBUSxFQUFFLFFBQW1CO1FBQzdFLHVCQUFBLElBQUksaUVBQW9CLE1BQXhCLElBQUksRUFBcUIsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILG1CQUFtQixDQUFrQyxLQUFRLEVBQUUsUUFBbUI7UUFDaEYsdUJBQUEsSUFBSSxpRUFBb0IsTUFBeEIsSUFBSSxFQUFxQixLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxJQUFJLENBQWtDLEtBQVEsRUFBRSxHQUFHLElBQTJCO1FBQzVFLEtBQUssTUFBTSxRQUFRLElBQUksdUJBQUEsSUFBSSxpRUFBb0IsTUFBeEIsSUFBSSxFQUFxQixLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3ZELFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3BCLENBQUM7SUFDSCxDQUFDO0NBQ0Y7K0pBdkNzRCxLQUFRO0lBQzNELE9BQU8sdUJBQUEsSUFBSSwrQkFBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsdUJBQUEsSUFBSSwrQkFBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztBQUN4RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIFVzZWQgdG8gZGVjbGFyZSB0aGUgdHlwZSBvZiBhbiBldmVudCBlbWl0dGVyLiBTZWUge0BsaW5rIEV2ZW50RW1pdHRlcn0gKi9cbmV4cG9ydCB0eXBlIEV2ZW50TWFwID0ge1xuICBba2V5OiBzdHJpbmddOiAoLi4uYXJnczogbmV2ZXJbXSkgPT4gdm9pZDtcbn07XG5cbi8qKiBUaGUgdHlwZSBvZiB0aGUgaW50ZXJuYWwgc3RvcmFnZSBvZiBsaXN0ZW5lcnMgKi9cbnR5cGUgTGlzdGVuZXJNYXA8VD4gPSB7XG4gIFtLIGluIGtleW9mIFRdPzogU2V0PFRbS10+O1xufTtcblxuLyoqXG4gKiBUeXBlLXNhZmUgZXZlbnQgZW1pdHRlci5cbiAqXG4gKiBVc2UgaXQgbGlrZSB0aGlzOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHR5cGUgTXlFdmVudHMgPSB7XG4gKiAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xuICogICBtZXNzYWdlOiAoZnJvbTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpID0+IHZvaWQ7XG4gKiB9XG4gKlxuICogY29uc3QgbXlFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcjxNeUV2ZW50cz4oKTtcbiAqXG4gKiBteUVtaXR0ZXIuZW1pdChcImVycm9yXCIsIFwieFwiKSAgLy8gPC0gV2lsbCBjYXRjaCB0aGlzIHR5cGUgZXJyb3I7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50RW1pdHRlcjxFdmVudHMgZXh0ZW5kcyBFdmVudE1hcD4ge1xuICAvKiogVGhlIHN0b3JlIG9mIGN1cnJlbnRseSByZWdpc3RlcmVkIGxpc3RlbmVycyAqL1xuICAjbGlzdGVuZXJzOiBMaXN0ZW5lck1hcDxFdmVudHM+ID0ge307XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgc2V0IG9mIGxpc3RlbmVycyBmb3IgYSBnaXZlbiBldmVudCAoY29uc3RydWN0aW5nIHRoZSBTZXQgaWYgbmVjZXNzYXJ5KVxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGV2ZW50IHRvIGdldCB0aGUgbGlzdGVuZXJzIGZvclxuICAgKiBAcmV0dXJucyBUaGUgbGlzdGVuZXJzIGZvciB0aGUgZ2l2ZW4gZXZlbnRcbiAgICovXG4gICNnZXRPckluaXRMaXN0ZW5lcnM8RSBleHRlbmRzIGtleW9mIEV2ZW50cyAmIHN0cmluZz4oZXZlbnQ6IEUpOiBTZXQ8RXZlbnRzW0VdPiB7XG4gICAgcmV0dXJuIHRoaXMuI2xpc3RlbmVyc1tldmVudF0gPz8gKHRoaXMuI2xpc3RlbmVyc1tldmVudF0gPSBuZXcgU2V0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIGZvciBhbiBldmVudCAodGhlIHNhbWUgbGlzdGVuZXIgY2Fubm90IGJlIHJlZ2lzdGVyZWQgdHdpY2UpXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBvbiB0aGF0IGV2ZW50XG4gICAqIEByZXR1cm5zIFRoaXMgRXZlbnRFbWl0dGVyIHdpdGggdGhlIG5ldyBldmVudCBsaXN0ZW5lclxuICAgKi9cbiAgYWRkRXZlbnRMaXN0ZW5lcjxFIGV4dGVuZHMga2V5b2YgRXZlbnRzICYgc3RyaW5nPihldmVudDogRSwgbGlzdGVuZXI6IEV2ZW50c1tFXSk6IHRoaXMge1xuICAgIHRoaXMuI2dldE9ySW5pdExpc3RlbmVycyhldmVudCkuYWRkKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsaXN0ZW5lciBmb3IgYW4gZXZlbnRcbiAgICpcbiAgICogQHBhcmFtIGV2ZW50IFRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb21cbiAgICogQHBhcmFtIGxpc3RlbmVyIFRoZSBsaXN0ZW5lciB0byBiZSByZW1vdmVkXG4gICAqIEByZXR1cm5zIFRoaXMgRXZlbnRFbWl0dGVyIHdpdGggdGhlIGV2ZW50IGxpc3RlbmVyIHJlbW92ZWRcbiAgICovXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXI8RSBleHRlbmRzIGtleW9mIEV2ZW50cyAmIHN0cmluZz4oZXZlbnQ6IEUsIGxpc3RlbmVyOiBFdmVudHNbRV0pOiB0aGlzIHtcbiAgICB0aGlzLiNnZXRPckluaXRMaXN0ZW5lcnMoZXZlbnQpLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRW1pdCBhbiBldmVudCwgaW52b2tpbmcgYWxsIHRoZSBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHBhcmFtIGV2ZW50IFRoZSBldmVudCB0byBpbnZva2VcbiAgICogQHBhcmFtIGFyZ3MgVGhlIGFzc29jaWF0ZWQgZXZlbnQgZGF0YVxuICAgKi9cbiAgZW1pdDxFIGV4dGVuZHMga2V5b2YgRXZlbnRzICYgc3RyaW5nPihldmVudDogRSwgLi4uYXJnczogUGFyYW1ldGVyczxFdmVudHNbRV0+KTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLiNnZXRPckluaXRMaXN0ZW5lcnMoZXZlbnQpKSB7XG4gICAgICBsaXN0ZW5lciguLi5hcmdzKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==