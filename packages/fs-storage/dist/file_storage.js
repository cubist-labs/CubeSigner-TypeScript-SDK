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
var _JsonFileSessionManager_filePath;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonFileSessionManager = void 0;
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const fs_1 = require("fs");
/**
 * A session manager that refreshes and stores data in a JSON file
 */
class JsonFileSessionManager extends cubesigner_sdk_1.ExclusiveSessionManager {
    /**
     * Store session information.
     * @param {SessionData} data The session information to store
     * @return {Promise<void>}
     */
    async store(data) {
        await fs_1.promises.writeFile(__classPrivateFieldGet(this, _JsonFileSessionManager_filePath, "f"), JSON.stringify(data ?? null), "utf-8");
    }
    /**
     * Retrieve session information.
     * @return {Promise<SessionData>} The session information
     */
    async retrieve() {
        return JSON.parse(await fs_1.promises.readFile(__classPrivateFieldGet(this, _JsonFileSessionManager_filePath, "f"), "utf-8")) ?? undefined;
    }
    /**
     * Constructor.
     * @param {string} filePath The file path to use for storage
     */
    constructor(filePath) {
        super();
        _JsonFileSessionManager_filePath.set(this, void 0);
        __classPrivateFieldSet(this, _JsonFileSessionManager_filePath, filePath, "f");
    }
}
exports.JsonFileSessionManager = JsonFileSessionManager;
_JsonFileSessionManager_filePath = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ZpbGVfc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnRUFBc0U7QUFDdEUsMkJBQW9DO0FBRXBDOztHQUVHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSx3Q0FBdUI7SUFFakU7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBaUI7UUFDM0IsTUFBTSxhQUFFLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxhQUFFLENBQUMsUUFBUSxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUM3RSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxRQUFnQjtRQUMxQixLQUFLLEVBQUUsQ0FBQztRQXZCRCxtREFBa0I7UUF3QnpCLHVCQUFBLElBQUksb0NBQWEsUUFBUSxNQUFBLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBM0JELHdEQTJCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU2Vzc2lvbkRhdGEgfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciB9IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzIH0gZnJvbSBcImZzXCI7XG5cbi8qKlxuICogQSBzZXNzaW9uIG1hbmFnZXIgdGhhdCByZWZyZXNoZXMgYW5kIHN0b3JlcyBkYXRhIGluIGEgSlNPTiBmaWxlXG4gKi9cbmV4cG9ydCBjbGFzcyBKc29uRmlsZVNlc3Npb25NYW5hZ2VyIGV4dGVuZHMgRXhjbHVzaXZlU2Vzc2lvbk1hbmFnZXIge1xuICByZWFkb25seSAjZmlsZVBhdGg6IHN0cmluZztcbiAgLyoqXG4gICAqIFN0b3JlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7U2Vzc2lvbkRhdGF9IGRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24gdG8gc3RvcmVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlKHRoaXMuI2ZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShkYXRhID8/IG51bGwpLCBcInV0Zi04XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2Vzc2lvbkRhdGE+fSBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgcmV0cmlldmUoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGF3YWl0IGZzLnJlYWRGaWxlKHRoaXMuI2ZpbGVQYXRoLCBcInV0Zi04XCIpKSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlUGF0aCBUaGUgZmlsZSBwYXRoIHRvIHVzZSBmb3Igc3RvcmFnZVxuICAgKi9cbiAgY29uc3RydWN0b3IoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jZmlsZVBhdGggPSBmaWxlUGF0aDtcbiAgfVxufVxuIl19