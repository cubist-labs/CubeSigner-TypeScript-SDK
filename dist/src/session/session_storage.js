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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbl9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vc2Vzc2lvbl9zdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUFvQztBQVdwQywyQ0FBMkM7QUFDM0MsTUFBYSxvQkFBb0I7SUFHL0I7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBTztRQUNoQix1QkFBQSxJQUFJLDhCQUFTLElBQUksTUFBQSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLElBQUksQ0FBQyx1QkFBQSxJQUFJLGtDQUFNLEVBQUU7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDaEQ7UUFDRCxPQUFPLHVCQUFBLElBQUksa0NBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxJQUFRO1FBMUJwQiw2Q0FBVTtRQTJCUix1QkFBQSxJQUFJLDhCQUFTLElBQUksTUFBQSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQTlCRCxvREE4QkM7O0FBRUQsZ0RBQWdEO0FBQ2hELE1BQWEsc0JBQXNCO0lBR2pDOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQU87UUFDaEIsTUFBTSxhQUFFLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLGFBQUUsQ0FBQyxRQUFRLENBQUMsdUJBQUEsSUFBSSx3Q0FBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVEOzs7T0FHRztJQUNILFlBQVksUUFBZ0I7UUF2QjVCLG1EQUFrQjtRQXdCaEIsdUJBQUEsSUFBSSxvQ0FBYSxRQUFRLE1BQUEsQ0FBQztJQUM1QixDQUFDO0NBQ0Y7QUEzQkQsd0RBMkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tIFwiZnNcIjtcblxuLyoqIEludGVyZmFjZSBmb3Igc3RvcmluZyBzZXNzaW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvblN0b3JhZ2U8VT4ge1xuICAvKiogU3RvcmUgc2Vzc2lvbiBpbmZvcm1hdGlvbiAqL1xuICBzYXZlKGRhdGE6IFUpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBSZXRyaWV2ZSBzZXNzaW9uIGluZm9ybWF0aW9uICovXG4gIHJldHJpZXZlKCk6IFByb21pc2U8VT47XG59XG5cbi8qKiBTdG9yZXMgc2Vzc2lvbiBpbmZvcm1hdGlvbiBpbiBtZW1vcnkgKi9cbmV4cG9ydCBjbGFzcyBNZW1vcnlTZXNzaW9uU3RvcmFnZTxVPiBpbXBsZW1lbnRzIFNlc3Npb25TdG9yYWdlPFU+IHtcbiAgI2RhdGE/OiBVO1xuXG4gIC8qKlxuICAgKiBTdG9yZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1V9IGRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24gdG8gc3RvcmVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNhdmUoZGF0YTogVSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyByZXRyaWV2ZSgpOiBQcm9taXNlPFU+IHtcbiAgICBpZiAoIXRoaXMuI2RhdGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3Npbmcgc2Vzc2lvbiBpbmZvcm1hdGlvblwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7VT99IGRhdGEgVGhlIGluaXRpYWwgZGF0YVxuICAgKi9cbiAgY29uc3RydWN0b3IoZGF0YT86IFUpIHtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vKiogU3RvcmVzIHNlc3Npb24gaW5mb3JtYXRpb24gaW4gYSBKU09OIGZpbGUgKi9cbmV4cG9ydCBjbGFzcyBKc29uRmlsZVNlc3Npb25TdG9yYWdlPFU+IGltcGxlbWVudHMgU2Vzc2lvblN0b3JhZ2U8VT4ge1xuICAjZmlsZVBhdGg6IHN0cmluZztcblxuICAvKipcbiAgICogU3RvcmUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHtVfSBkYXRhIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uIHRvIHN0b3JlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzYXZlKGRhdGE6IFUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUodGhpcy4jZmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KGRhdGEpLCBcInV0Zi04XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyByZXRyaWV2ZSgpOiBQcm9taXNlPFU+IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShhd2FpdCBmcy5yZWFkRmlsZSh0aGlzLiNmaWxlUGF0aCwgXCJ1dGYtOFwiKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlUGF0aCBUaGUgZmlsZSBwYXRoIHRvIHVzZSBmb3Igc3RvcmFnZVxuICAgKi9cbiAgY29uc3RydWN0b3IoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIHRoaXMuI2ZpbGVQYXRoID0gZmlsZVBhdGg7XG4gIH1cbn1cbiJdfQ==