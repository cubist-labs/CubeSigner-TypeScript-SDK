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
import { ExclusiveSessionManager } from "@cubist-labs/cubesigner-sdk";
import { promises as fs } from "fs";
/**
 * A session manager that refreshes and stores data in a JSON file
 */
export class JsonFileSessionManager extends ExclusiveSessionManager {
    /**
     * Store session information.
     *
     * @param data The session information to store
     */
    async store(data) {
        await fs.writeFile(__classPrivateFieldGet(this, _JsonFileSessionManager_filePath, "f"), JSON.stringify(data ?? null), {
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
        return JSON.parse(await fs.readFile(__classPrivateFieldGet(this, _JsonFileSessionManager_filePath, "f"), "utf-8")) ?? undefined;
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
_JsonFileSessionManager_filePath = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9zdG9yYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ZpbGVfc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRSxPQUFPLEVBQUUsUUFBUSxJQUFJLEVBQUUsRUFBRSxNQUFNLElBQUksQ0FBQztBQUVwQzs7R0FFRztBQUNILE1BQU0sT0FBTyxzQkFBdUIsU0FBUSx1QkFBdUI7SUFFakU7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBaUI7UUFDM0IsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRTtZQUMvRCxRQUFRLEVBQUUsT0FBTztZQUNqQixJQUFJLEVBQUUsS0FBSztTQUNaLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLHVCQUFBLElBQUksd0NBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUM3RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksUUFBZ0I7UUFDMUIsS0FBSyxFQUFFLENBQUM7UUE1QkQsbURBQWtCO1FBNkJ6Qix1QkFBQSxJQUFJLG9DQUFhLFFBQVEsTUFBQSxDQUFDO0lBQzVCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU2Vzc2lvbkRhdGEgfSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IEV4Y2x1c2l2ZVNlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIEEgc2Vzc2lvbiBtYW5hZ2VyIHRoYXQgcmVmcmVzaGVzIGFuZCBzdG9yZXMgZGF0YSBpbiBhIEpTT04gZmlsZVxuICovXG5leHBvcnQgY2xhc3MgSnNvbkZpbGVTZXNzaW9uTWFuYWdlciBleHRlbmRzIEV4Y2x1c2l2ZVNlc3Npb25NYW5hZ2VyIHtcbiAgcmVhZG9ubHkgI2ZpbGVQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBTdG9yZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbiB0byBzdG9yZVxuICAgKi9cbiAgYXN5bmMgc3RvcmUoZGF0YTogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUodGhpcy4jZmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KGRhdGEgPz8gbnVsbCksIHtcbiAgICAgIGVuY29kaW5nOiBcInV0Zi04XCIsXG4gICAgICBtb2RlOiAwbzYwMCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSBzZXNzaW9uIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgcmV0cmlldmUoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGF3YWl0IGZzLnJlYWRGaWxlKHRoaXMuI2ZpbGVQYXRoLCBcInV0Zi04XCIpKSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlUGF0aCBUaGUgZmlsZSBwYXRoIHRvIHVzZSBmb3Igc3RvcmFnZVxuICAgKi9cbiAgY29uc3RydWN0b3IoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jZmlsZVBhdGggPSBmaWxlUGF0aDtcbiAgfVxufVxuIl19