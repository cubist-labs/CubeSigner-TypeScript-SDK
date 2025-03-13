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
     *
     * @param data The session information to store
     */
    async store(data) {
        await fs_1.promises.writeFile(__classPrivateFieldGet(this, _JsonFileSessionManager_filePath, "f"), JSON.stringify(data ?? null), "utf-8");
    }
    /**
     * Retrieve session information.
     *
     * @returns The session information
     */
    async retrieve() {
        return JSON.parse(await fs_1.promises.readFile(__classPrivateFieldGet(this, _JsonFileSessionManager_filePath, "f"), "utf-8")) ?? undefined;
    }
    /**
     * Constructor.
     *
     * @param filePath The file path to use for storage
     */
    constructor(filePath) {
        super();
        _JsonFileSessionManager_filePath.set(this, void 0);
        __classPrivateFieldSet(this, _JsonFileSessionManager_filePath, filePath, "f");
    }
}
exports.JsonFileSessionManager = JsonFileSessionManager;
_JsonFileSessionManager_filePath = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ZpbGVfc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSwrREFBcUU7QUFDckUsMkJBQW9DO0FBRXBDOztHQUVHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSx3Q0FBdUI7SUFFakU7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBaUI7UUFDM0IsTUFBTSxhQUFFLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sYUFBRSxDQUFDLFFBQVEsQ0FBQyx1QkFBQSxJQUFJLHdDQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUM7SUFDN0UsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxZQUFZLFFBQWdCO1FBQzFCLEtBQUssRUFBRSxDQUFDO1FBekJELG1EQUFrQjtRQTBCekIsdUJBQUEsSUFBSSxvQ0FBYSxRQUFRLE1BQUEsQ0FBQztJQUM1QixDQUFDO0NBQ0Y7QUE3QkQsd0RBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSB9IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgRXhjbHVzaXZlU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzIH0gZnJvbSBcImZzXCI7XG5cbi8qKlxuICogQSBzZXNzaW9uIG1hbmFnZXIgdGhhdCByZWZyZXNoZXMgYW5kIHN0b3JlcyBkYXRhIGluIGEgSlNPTiBmaWxlXG4gKi9cbmV4cG9ydCBjbGFzcyBKc29uRmlsZVNlc3Npb25NYW5hZ2VyIGV4dGVuZHMgRXhjbHVzaXZlU2Vzc2lvbk1hbmFnZXIge1xuICByZWFkb25seSAjZmlsZVBhdGg6IHN0cmluZztcbiAgLyoqXG4gICAqIFN0b3JlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uIHRvIHN0b3JlXG4gICAqL1xuICBhc3luYyBzdG9yZShkYXRhOiBTZXNzaW9uRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZSh0aGlzLiNmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoZGF0YSA/PyBudWxsKSwgXCJ1dGYtOFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgcmV0cmlldmUoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGF3YWl0IGZzLnJlYWRGaWxlKHRoaXMuI2ZpbGVQYXRoLCBcInV0Zi04XCIpKSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlUGF0aCBUaGUgZmlsZSBwYXRoIHRvIHVzZSBmb3Igc3RvcmFnZVxuICAgKi9cbiAgY29uc3RydWN0b3IoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jZmlsZVBhdGggPSBmaWxlUGF0aDtcbiAgfVxufVxuIl19