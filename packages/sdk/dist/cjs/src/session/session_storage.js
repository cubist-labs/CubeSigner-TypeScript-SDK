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
var _MemorySessionStorage_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySessionStorage = void 0;
/** Stores session information in memory */
class MemorySessionStorage {
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
exports.MemorySessionStorage = MemorySessionStorage;
_MemorySessionStorage_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbl9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVNBLDJDQUEyQztBQUMzQyxNQUFhLG9CQUFvQjtJQUcvQjs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFPO1FBQ2hCLHVCQUFBLElBQUksOEJBQVMsSUFBSSxNQUFBLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1osSUFBSSxDQUFDLHVCQUFBLElBQUksa0NBQU0sRUFBRSxDQUFDO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBQ0QsT0FBTyx1QkFBQSxJQUFJLGtDQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILFlBQVksSUFBUTtRQTFCcEIsNkNBQVU7UUEyQlIsdUJBQUEsSUFBSSw4QkFBUyxJQUFJLE1BQUEsQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUE5QkQsb0RBOEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEludGVyZmFjZSBmb3Igc3RvcmluZyBzZXNzaW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvblN0b3JhZ2U8VT4ge1xuICAvKiogU3RvcmUgc2Vzc2lvbiBpbmZvcm1hdGlvbiAqL1xuICBzYXZlKGRhdGE6IFUpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBSZXRyaWV2ZSBzZXNzaW9uIGluZm9ybWF0aW9uICovXG4gIHJldHJpZXZlKCk6IFByb21pc2U8VT47XG59XG5cbi8qKiBTdG9yZXMgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpbiBtZW1vcnkgKi9cbmV4cG9ydCBjbGFzcyBNZW1vcnlTZXNzaW9uU3RvcmFnZTxVPiBpbXBsZW1lbnRzIFNlc3Npb25TdG9yYWdlPFU+IHtcbiAgI2RhdGE/OiBVO1xuXG4gIC8qKlxuICAgKiBTdG9yZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1V9IGRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24gdG8gc3RvcmVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNhdmUoZGF0YTogVSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyByZXRyaWV2ZSgpOiBQcm9taXNlPFU+IHtcbiAgICBpZiAoIXRoaXMuI2RhdGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3Npbmcgc2Vzc2lvbiBpbmZvcm1hdGlvblwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7VT99IGRhdGEgVGhlIGluaXRpYWwgZGF0YVxuICAgKi9cbiAgY29uc3RydWN0b3IoZGF0YT86IFUpIHtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxufVxuIl19