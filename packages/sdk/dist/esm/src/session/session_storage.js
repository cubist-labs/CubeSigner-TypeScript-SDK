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
var _MemorySessionStorage_data;
/** Stores session information in memory */
export class MemorySessionStorage {
    /**
     * Store session information.
     * @param {U} data The session information to store
     * @return {Promise<void>}
     */
    async save(data) {
        __classPrivateFieldSet(this, _MemorySessionStorage_data, data, "f");
    }
    /**
     * Retrieve session information.
     * @return {Promise<U>} The session information
     */
    async retrieve() {
        if (!__classPrivateFieldGet(this, _MemorySessionStorage_data, "f")) {
            throw new Error("Missing session information");
        }
        return __classPrivateFieldGet(this, _MemorySessionStorage_data, "f");
    }
    /**
     * Constructor.
     * @param {U?} data The initial data
     */
    constructor(data) {
        _MemorySessionStorage_data.set(this, void 0);
        __classPrivateFieldSet(this, _MemorySessionStorage_data, data, "f");
    }
}
_MemorySessionStorage_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbl9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVNBLDJDQUEyQztBQUMzQyxNQUFNLE9BQU8sb0JBQW9CO0lBRy9COzs7O09BSUc7SUFDSCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQU87UUFDaEIsdUJBQUEsSUFBSSw4QkFBUyxJQUFJLE1BQUEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixJQUFJLENBQUMsdUJBQUEsSUFBSSxrQ0FBTSxFQUFFLENBQUM7WUFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFDRCxPQUFPLHVCQUFBLElBQUksa0NBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxJQUFRO1FBMUJwQiw2Q0FBVTtRQTJCUix1QkFBQSxJQUFJLDhCQUFTLElBQUksTUFBQSxDQUFDO0lBQ3BCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBJbnRlcmZhY2UgZm9yIHN0b3Jpbmcgc2Vzc2lvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25TdG9yYWdlPFU+IHtcbiAgLyoqIFN0b3JlIHNlc3Npb24gaW5mb3JtYXRpb24gKi9cbiAgc2F2ZShkYXRhOiBVKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogUmV0cmlldmUgc2Vzc2lvbiBpbmZvcm1hdGlvbiAqL1xuICByZXRyaWV2ZSgpOiBQcm9taXNlPFU+O1xufVxuXG4vKiogU3RvcmVzIHNlc3Npb24gaW5mb3JtYXRpb24gaW4gbWVtb3J5ICovXG5leHBvcnQgY2xhc3MgTWVtb3J5U2Vzc2lvblN0b3JhZ2U8VT4gaW1wbGVtZW50cyBTZXNzaW9uU3RvcmFnZTxVPiB7XG4gICNkYXRhPzogVTtcblxuICAvKipcbiAgICogU3RvcmUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHtVfSBkYXRhIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uIHRvIHN0b3JlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzYXZlKGRhdGE6IFUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFU+fSBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgcmV0cmlldmUoKTogUHJvbWlzZTxVPiB7XG4gICAgaWYgKCF0aGlzLiNkYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIHNlc3Npb24gaW5mb3JtYXRpb25cIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge1U/fSBkYXRhIFRoZSBpbml0aWFsIGRhdGFcbiAgICovXG4gIGNvbnN0cnVjdG9yKGRhdGE/OiBVKSB7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cbn1cbiJdfQ==