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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ZpbGVfc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnRUFBc0U7QUFDdEUsMkJBQW9DO0FBRXBDOztHQUVHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSx3Q0FBdUI7SUFFakU7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBaUI7UUFDM0IsTUFBTSxhQUFFLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sYUFBRSxDQUFDLFFBQVEsQ0FBQyx1QkFBQSxJQUFJLHdDQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUM7SUFDN0UsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxZQUFZLFFBQWdCO1FBQzFCLEtBQUssRUFBRSxDQUFDO1FBekJELG1EQUFrQjtRQTBCekIsdUJBQUEsSUFBSSxvQ0FBYSxRQUFRLE1BQUEsQ0FBQztJQUM1QixDQUFDO0NBQ0Y7QUE3QkQsd0RBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSB9IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IEV4Y2x1c2l2ZVNlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBBIHNlc3Npb24gbWFuYWdlciB0aGF0IHJlZnJlc2hlcyBhbmQgc3RvcmVzIGRhdGEgaW4gYSBKU09OIGZpbGVcbiAqL1xuZXhwb3J0IGNsYXNzIEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciB7XG4gIHJlYWRvbmx5ICNmaWxlUGF0aDogc3RyaW5nO1xuICAvKipcbiAgICogU3RvcmUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24gdG8gc3RvcmVcbiAgICovXG4gIGFzeW5jIHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlKHRoaXMuI2ZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShkYXRhID8/IG51bGwpLCBcInV0Zi04XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyByZXRyaWV2ZSgpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUodGhpcy4jZmlsZVBhdGgsIFwidXRmLThcIikpID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGZpbGVQYXRoIFRoZSBmaWxlIHBhdGggdG8gdXNlIGZvciBzdG9yYWdlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNmaWxlUGF0aCA9IGZpbGVQYXRoO1xuICB9XG59XG4iXX0=