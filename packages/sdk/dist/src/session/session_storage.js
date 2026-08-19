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
var _MemorySessionStorage_data, _JsonFileSessionStorage_filePath;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonFileSessionStorage = exports.MemorySessionStorage = void 0;
const fs_1 = require("fs");
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
/** Stores session information in a JSON file */
class JsonFileSessionStorage {
    /**
     * Store session information.
     * @param {U} data The session information to store
     * @return {Promise<void>}
     */
    async save(data) {
        await fs_1.promises.writeFile(__classPrivateFieldGet(this, _JsonFileSessionStorage_filePath, "f"), JSON.stringify(data), "utf-8");
    }
    /**
     * Retrieve session information.
     * @return {Promise<U>} The session information
     */
    async retrieve() {
        return JSON.parse(await fs_1.promises.readFile(__classPrivateFieldGet(this, _JsonFileSessionStorage_filePath, "f"), "utf-8"));
    }
    /**
     * Constructor.
     * @param {string} filePath The file path to use for storage
     */
    constructor(filePath) {
        _JsonFileSessionStorage_filePath.set(this, void 0);
        __classPrivateFieldSet(this, _JsonFileSessionStorage_filePath, filePath, "f");
    }
}
exports.JsonFileSessionStorage = JsonFileSessionStorage;
_JsonFileSessionStorage_filePath = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbl9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUFvQztBQVdwQywyQ0FBMkM7QUFDM0MsTUFBYSxvQkFBb0I7SUFHL0I7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBTztRQUNoQix1QkFBQSxJQUFJLDhCQUFTLElBQUksTUFBQSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLElBQUksQ0FBQyx1QkFBQSxJQUFJLGtDQUFNLEVBQUUsQ0FBQztZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDakQsQ0FBQztRQUNELE9BQU8sdUJBQUEsSUFBSSxrQ0FBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxZQUFZLElBQVE7UUExQnBCLDZDQUFVO1FBMkJSLHVCQUFBLElBQUksOEJBQVMsSUFBSSxNQUFBLENBQUM7SUFDcEIsQ0FBQztDQUNGO0FBOUJELG9EQThCQzs7QUFFRCxnREFBZ0Q7QUFDaEQsTUFBYSxzQkFBc0I7SUFHakM7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBTztRQUNoQixNQUFNLGFBQUUsQ0FBQyxTQUFTLENBQUMsdUJBQUEsSUFBSSx3Q0FBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sYUFBRSxDQUFDLFFBQVEsQ0FBQyx1QkFBQSxJQUFJLHdDQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxRQUFnQjtRQXZCbkIsbURBQWtCO1FBd0J6Qix1QkFBQSxJQUFJLG9DQUFhLFFBQVEsTUFBQSxDQUFDO0lBQzVCLENBQUM7Q0FDRjtBQTNCRCx3REEyQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gXCJmc1wiO1xuXG4vKiogSW50ZXJmYWNlIGZvciBzdG9yaW5nIHNlc3Npb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uU3RvcmFnZTxVPiB7XG4gIC8qKiBTdG9yZSBzZXNzaW9uIGluZm9ybWF0aW9uICovXG4gIHNhdmUoZGF0YTogVSk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqIFJldHJpZXZlIHNlc3Npb24gaW5mb3JtYXRpb24gKi9cbiAgcmV0cmlldmUoKTogUHJvbWlzZTxVPjtcbn1cblxuLyoqIFN0b3JlcyBzZXNzaW9uIGluZm9ybWF0aW9uIGluIG1lbW9yeSAqL1xuZXhwb3J0IGNsYXNzIE1lbW9yeVNlc3Npb25TdG9yYWdlPFU+IGltcGxlbWVudHMgU2Vzc2lvblN0b3JhZ2U8VT4ge1xuICAjZGF0YT86IFU7XG5cbiAgLyoqXG4gICAqIFN0b3JlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7VX0gZGF0YSBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbiB0byBzdG9yZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2F2ZShkYXRhOiBVKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxVPn0gVGhlIHNlc3Npb24gaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIHJldHJpZXZlKCk6IFByb21pc2U8VT4ge1xuICAgIGlmICghdGhpcy4jZGF0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBzZXNzaW9uIGluZm9ybWF0aW9uXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtVP30gZGF0YSBUaGUgaW5pdGlhbCBkYXRhXG4gICAqL1xuICBjb25zdHJ1Y3RvcihkYXRhPzogVSkge1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKiBTdG9yZXMgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpbiBhIEpTT04gZmlsZSAqL1xuZXhwb3J0IGNsYXNzIEpzb25GaWxlU2Vzc2lvblN0b3JhZ2U8VT4gaW1wbGVtZW50cyBTZXNzaW9uU3RvcmFnZTxVPiB7XG4gIHJlYWRvbmx5ICNmaWxlUGF0aDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBTdG9yZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1V9IGRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24gdG8gc3RvcmVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNhdmUoZGF0YTogVSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZSh0aGlzLiNmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoZGF0YSksIFwidXRmLThcIik7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxVPn0gVGhlIHNlc3Npb24gaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIHJldHJpZXZlKCk6IFByb21pc2U8VT4ge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGF3YWl0IGZzLnJlYWRGaWxlKHRoaXMuI2ZpbGVQYXRoLCBcInV0Zi04XCIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVQYXRoIFRoZSBmaWxlIHBhdGggdG8gdXNlIGZvciBzdG9yYWdlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy4jZmlsZVBhdGggPSBmaWxlUGF0aDtcbiAgfVxufVxuIl19