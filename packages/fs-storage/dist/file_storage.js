"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _JsonFileSessionStorage_filePath;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonFileSessionStorage = void 0;
const fs_1 = require("fs");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ZpbGVfc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQkFBb0M7QUFFcEMsZ0RBQWdEO0FBQ2hELE1BQWEsc0JBQXNCO0lBR2pDOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQU87UUFDaEIsTUFBTSxhQUFFLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLGFBQUUsQ0FBQyxRQUFRLENBQUMsdUJBQUEsSUFBSSx3Q0FBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVEOzs7T0FHRztJQUNILFlBQVksUUFBZ0I7UUF2Qm5CLG1EQUFrQjtRQXdCekIsdUJBQUEsSUFBSSxvQ0FBYSxRQUFRLE1BQUEsQ0FBQztJQUM1QixDQUFDO0NBQ0Y7QUEzQkQsd0RBMkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gXCJmc1wiO1xuXG4vKiogU3RvcmVzIHNlc3Npb24gaW5mb3JtYXRpb24gaW4gYSBKU09OIGZpbGUgKi9cbmV4cG9ydCBjbGFzcyBKc29uRmlsZVNlc3Npb25TdG9yYWdlPFU+IGltcGxlbWVudHMgU2Vzc2lvblN0b3JhZ2U8VT4ge1xuICByZWFkb25seSAjZmlsZVBhdGg6IHN0cmluZztcblxuICAvKipcbiAgICogU3RvcmUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHtVfSBkYXRhIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uIHRvIHN0b3JlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzYXZlKGRhdGE6IFUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUodGhpcy4jZmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KGRhdGEpLCBcInV0Zi04XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyByZXRyaWV2ZSgpOiBQcm9taXNlPFU+IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShhd2FpdCBmcy5yZWFkRmlsZSh0aGlzLiNmaWxlUGF0aCwgXCJ1dGYtOFwiKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlUGF0aCBUaGUgZmlsZSBwYXRoIHRvIHVzZSBmb3Igc3RvcmFnZVxuICAgKi9cbiAgY29uc3RydWN0b3IoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIHRoaXMuI2ZpbGVQYXRoID0gZmlsZVBhdGg7XG4gIH1cbn1cbiJdfQ==