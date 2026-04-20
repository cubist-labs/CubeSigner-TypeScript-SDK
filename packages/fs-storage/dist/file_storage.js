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
        await fs_1.promises.writeFile(__classPrivateFieldGet(this, _JsonFileSessionManager_filePath, "f"), JSON.stringify(data ?? null), {
            encoding: "utf-8",
            mode: 0o600,
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ZpbGVfc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSwrREFBcUU7QUFDckUsMkJBQW9DO0FBRXBDOztHQUVHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSx3Q0FBdUI7SUFFakU7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBaUI7UUFDM0IsTUFBTSxhQUFFLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRTtZQUMvRCxRQUFRLEVBQUUsT0FBTztZQUNqQixJQUFJLEVBQUUsS0FBSztTQUNaLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxhQUFFLENBQUMsUUFBUSxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUM3RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksUUFBZ0I7UUFDMUIsS0FBSyxFQUFFLENBQUM7UUE1QkQsbURBQWtCO1FBNkJ6Qix1QkFBQSxJQUFJLG9DQUFhLFFBQVEsTUFBQSxDQUFDO0lBQzVCLENBQUM7Q0FDRjtBQWhDRCx3REFnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFNlc3Npb25EYXRhIH0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciB9IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBBIHNlc3Npb24gbWFuYWdlciB0aGF0IHJlZnJlc2hlcyBhbmQgc3RvcmVzIGRhdGEgaW4gYSBKU09OIGZpbGVcbiAqL1xuZXhwb3J0IGNsYXNzIEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciB7XG4gIHJlYWRvbmx5ICNmaWxlUGF0aDogc3RyaW5nO1xuICAvKipcbiAgICogU3RvcmUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24gdG8gc3RvcmVcbiAgICovXG4gIGFzeW5jIHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlKHRoaXMuI2ZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShkYXRhID8/IG51bGwpLCB7XG4gICAgICBlbmNvZGluZzogXCJ1dGYtOFwiLFxuICAgICAgbW9kZTogMG82MDAsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNlc3Npb24gaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIHJldHJpZXZlKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShhd2FpdCBmcy5yZWFkRmlsZSh0aGlzLiNmaWxlUGF0aCwgXCJ1dGYtOFwiKSkgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZmlsZVBhdGggVGhlIGZpbGUgcGF0aCB0byB1c2UgZm9yIHN0b3JhZ2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2ZpbGVQYXRoID0gZmlsZVBhdGg7XG4gIH1cbn1cbiJdfQ==