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
var _SessionManager_refreshing;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgSessionManager = exports.SessionManager = void 0;
const events_1 = require("../events");
const api_1 = require("../api");
const util_1 = require("../util");
const DEFAULT_EXPIRATION_BUFFER_SECS = 30;
/** Generic session manager interface. */
class SessionManager {
    /**
     * Refreshes the session if it is about to expire.
     * @return {boolean} Whether the session token was refreshed.
     * @internal
     */
    async refreshIfNeeded() {
        if (await this.isStale()) {
            if (__classPrivateFieldGet(this, _SessionManager_refreshing, "f")) {
                // wait until done refreshing
                while (__classPrivateFieldGet(this, _SessionManager_refreshing, "f")) {
                    await (0, util_1.delay)(100);
                }
                return false;
            }
            else {
                // refresh
                __classPrivateFieldSet(this, _SessionManager_refreshing, true, "f");
                try {
                    await this.refresh();
                    return true;
                }
                finally {
                    __classPrivateFieldSet(this, _SessionManager_refreshing, false, "f");
                }
            }
        }
        return false;
    }
    /**
     * Automatically refreshes the session in the background.
     * The default implementation refreshes (if needed) every minute.
     * Base implementations can, instead use the token expirations timestamps
     * to refresh less often. This is a simple wrapper around `setInterval`.
     * @return {number} The interval ID of the refresh timer.
     */
    autoRefresh() {
        return setInterval(async () => {
            await this.refreshIfNeeded();
        }, 60 * 1000);
    }
    /**
     * Clears the auto refresh timer.
     * @param {number} timer The timer ID to clear.
     */
    clearAutoRefresh(timer) {
        clearInterval(timer);
    }
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {SessionStorage<U>} storage The storage back end to use for storing
     *                                    session information
     */
    constructor(env, storage) {
        this.events = new events_1.Events();
        _SessionManager_refreshing.set(this, false);
        this.env = env;
        this.storage = storage;
    }
    /**
     * Creates a new REST client with a given token
     * @param {string} token The authorization token to use for the client
     * @return {Client} The new REST client
     */
    createClient(token) {
        return (0, api_1.createHttpClient)(this.env.SignerApiRoot, token);
    }
    /**
     * Check if a timestamp is within {@link bufferSeconds} seconds from expiration.
     * @param {Date} exp The timestamp to check
     * @param {number} bufferSeconds Time buffer in seconds (defaults to 0s)
     * @return {boolean} True if the timestamp has expired
     */
    static hasExpired(exp, bufferSeconds) {
        bufferSeconds ??= 0;
        const expMsSinceEpoch = exp.getTime();
        const nowMsSinceEpoch = new Date().getTime();
        const bufferMs = bufferSeconds * 1000;
        return expMsSinceEpoch < nowMsSinceEpoch + bufferMs;
    }
    /**
     * Check if a timestamp is stale, i.e., it's within {@link bufferSeconds} seconds from expiration.
     * @param {Date} exp The timestamp to check
     * @param {number} bufferSeconds Time buffer in seconds (defaults to 30s)
     * @return {boolean} True if the timestamp is stale
     */
    static isStale(exp, bufferSeconds) {
        return this.hasExpired(exp, bufferSeconds ?? DEFAULT_EXPIRATION_BUFFER_SECS);
    }
    /**
     * Throws an error that says that some feature is unsupported.
     * @param {string} name The name of the feature that is not supported
     */
    unsupported(name) {
        throw new Error(`'${name}' not supported`);
    }
}
exports.SessionManager = SessionManager;
_SessionManager_refreshing = new WeakMap();
/** Interface for a session manager that knows about the org that the session is in. */
class OrgSessionManager extends SessionManager {
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} orgId The id of the org associated with this session
     * @param {SessionStorage<U>} storage The storage back end to use for storing
     *                                    session information
     */
    constructor(env, orgId, storage) {
        super(env, storage);
        this.orgId = orgId;
    }
}
exports.OrgSessionManager = OrgSessionManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbl9tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNDQUFtQztBQUVuQyxnQ0FBa0Q7QUFFbEQsa0NBQWdDO0FBRWhDLE1BQU0sOEJBQThCLEdBQUcsRUFBRSxDQUFDO0FBRTFDLHlDQUF5QztBQUN6QyxNQUFzQixjQUFjO0lBNEJsQzs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLGVBQWU7UUFDbkIsSUFBSSxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQ3pCLElBQUksdUJBQUEsSUFBSSxrQ0FBWSxFQUFFLENBQUM7Z0JBQ3JCLDZCQUE2QjtnQkFDN0IsT0FBTyx1QkFBQSxJQUFJLGtDQUFZLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxJQUFBLFlBQUssRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkIsQ0FBQztnQkFDRCxPQUFPLEtBQUssQ0FBQztZQUNmLENBQUM7aUJBQU0sQ0FBQztnQkFDTixVQUFVO2dCQUNWLHVCQUFBLElBQUksOEJBQWUsSUFBSSxNQUFBLENBQUM7Z0JBQ3hCLElBQUksQ0FBQztvQkFDSCxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDckIsT0FBTyxJQUFJLENBQUM7Z0JBQ2QsQ0FBQzt3QkFBUyxDQUFDO29CQUNULHVCQUFBLElBQUksOEJBQWUsS0FBSyxNQUFBLENBQUM7Z0JBQzNCLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFdBQVc7UUFDVCxPQUFPLFdBQVcsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUM1QixNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMvQixDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxnQkFBZ0IsQ0FBQyxLQUFnQjtRQUMvQixhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxHQUFpQixFQUFFLE9BQTBCO1FBaEZoRCxXQUFNLEdBQUcsSUFBSSxlQUFNLEVBQUUsQ0FBQztRQUMvQixxQ0FBdUIsS0FBSyxFQUFDO1FBZ0YzQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7OztPQUlHO0lBQ08sWUFBWSxDQUFDLEtBQWE7UUFDbEMsT0FBTyxJQUFBLHNCQUFnQixFQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNPLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBUyxFQUFFLGFBQXNCO1FBQzNELGFBQWEsS0FBSyxDQUFDLENBQUM7UUFDcEIsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RDLE1BQU0sZUFBZSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0MsTUFBTSxRQUFRLEdBQUcsYUFBYSxHQUFHLElBQUksQ0FBQztRQUN0QyxPQUFPLGVBQWUsR0FBRyxlQUFlLEdBQUcsUUFBUSxDQUFDO0lBQ3RELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNPLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBUyxFQUFFLGFBQXNCO1FBQ3hELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsYUFBYSxJQUFJLDhCQUE4QixDQUFDLENBQUM7SUFDL0UsQ0FBQztJQUVEOzs7T0FHRztJQUNPLFdBQVcsQ0FBQyxJQUFZO1FBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLGlCQUFpQixDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBaElELHdDQWdJQzs7QUFFRCx1RkFBdUY7QUFDdkYsTUFBc0IsaUJBQXFCLFNBQVEsY0FBaUI7SUFHbEU7Ozs7OztPQU1HO0lBQ0gsWUFBWSxHQUFpQixFQUFFLEtBQWEsRUFBRSxPQUEwQjtRQUN0RSxLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQWRELDhDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRzIH0gZnJvbSBcIi4uL2V2ZW50c1wiO1xuaW1wb3J0IHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uL2VudlwiO1xuaW1wb3J0IHsgQ2xpZW50LCBjcmVhdGVIdHRwQ2xpZW50IH0gZnJvbSBcIi4uL2FwaVwiO1xuaW1wb3J0IHsgU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uX3N0b3JhZ2VcIjtcbmltcG9ydCB7IGRlbGF5IH0gZnJvbSBcIi4uL3V0aWxcIjtcblxuY29uc3QgREVGQVVMVF9FWFBJUkFUSU9OX0JVRkZFUl9TRUNTID0gMzA7XG5cbi8qKiBHZW5lcmljIHNlc3Npb24gbWFuYWdlciBpbnRlcmZhY2UuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU2Vzc2lvbk1hbmFnZXI8VT4ge1xuICByZWFkb25seSBlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgc3RvcmFnZTogU2Vzc2lvblN0b3JhZ2U8VT47XG4gIHJlYWRvbmx5IGV2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgI3JlZnJlc2hpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3VycmVudCBhdXRoIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFic3RyYWN0IHRva2VuKCk6IFByb21pc2U8c3RyaW5nPjtcblxuICAvKiogUmV0dXJucyBhIGNsaWVudCBpbnN0YW5jZSB0aGF0IHVzZXMgdGhlIHRva2VuLiAqL1xuICBhYnN0cmFjdCBjbGllbnQoKTogUHJvbWlzZTxDbGllbnQ+O1xuXG4gIC8qKiBSZXZva2VzIHRoZSBzZXNzaW9uLiAqL1xuICBhYnN0cmFjdCByZXZva2UoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogUmVmcmVzaGVzIHRoZSBzZXNzaW9uLiAqL1xuICBhYnN0cmFjdCByZWZyZXNoKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYWJzdHJhY3QgaXNTdGFsZSgpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24gaWYgaXQgaXMgYWJvdXQgdG8gZXhwaXJlLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBzZXNzaW9uIHRva2VuIHdhcyByZWZyZXNoZWQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaElmTmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChhd2FpdCB0aGlzLmlzU3RhbGUoKSkge1xuICAgICAgaWYgKHRoaXMuI3JlZnJlc2hpbmcpIHtcbiAgICAgICAgLy8gd2FpdCB1bnRpbCBkb25lIHJlZnJlc2hpbmdcbiAgICAgICAgd2hpbGUgKHRoaXMuI3JlZnJlc2hpbmcpIHtcbiAgICAgICAgICBhd2FpdCBkZWxheSgxMDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHJlZnJlc2hcbiAgICAgICAgdGhpcy4jcmVmcmVzaGluZyA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgdGhpcy4jcmVmcmVzaGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEF1dG9tYXRpY2FsbHkgcmVmcmVzaGVzIHRoZSBzZXNzaW9uIGluIHRoZSBiYWNrZ3JvdW5kLlxuICAgKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiByZWZyZXNoZXMgKGlmIG5lZWRlZCkgZXZlcnkgbWludXRlLlxuICAgKiBCYXNlIGltcGxlbWVudGF0aW9ucyBjYW4sIGluc3RlYWQgdXNlIHRoZSB0b2tlbiBleHBpcmF0aW9ucyB0aW1lc3RhbXBzXG4gICAqIHRvIHJlZnJlc2ggbGVzcyBvZnRlbi4gVGhpcyBpcyBhIHNpbXBsZSB3cmFwcGVyIGFyb3VuZCBgc2V0SW50ZXJ2YWxgLlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBpbnRlcnZhbCBJRCBvZiB0aGUgcmVmcmVzaCB0aW1lci5cbiAgICovXG4gIGF1dG9SZWZyZXNoKCk6IFJlZnJlc2hJZCB7XG4gICAgcmV0dXJuIHNldEludGVydmFsKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG4gICAgfSwgNjAgKiAxMDAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGF1dG8gcmVmcmVzaCB0aW1lci5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVyIFRoZSB0aW1lciBJRCB0byBjbGVhci5cbiAgICovXG4gIGNsZWFyQXV0b1JlZnJlc2godGltZXI6IFJlZnJlc2hJZCk6IHZvaWQge1xuICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1Nlc3Npb25TdG9yYWdlPFU+fSBzdG9yYWdlIFRoZSBzdG9yYWdlIGJhY2sgZW5kIHRvIHVzZSBmb3Igc3RvcmluZ1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb24gaW5mb3JtYXRpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVudjogRW52SW50ZXJmYWNlLCBzdG9yYWdlOiBTZXNzaW9uU3RvcmFnZTxVPikge1xuICAgIHRoaXMuZW52ID0gZW52O1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBSRVNUIGNsaWVudCB3aXRoIGEgZ2l2ZW4gdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIFRoZSBhdXRob3JpemF0aW9uIHRva2VuIHRvIHVzZSBmb3IgdGhlIGNsaWVudFxuICAgKiBAcmV0dXJuIHtDbGllbnR9IFRoZSBuZXcgUkVTVCBjbGllbnRcbiAgICovXG4gIHByb3RlY3RlZCBjcmVhdGVDbGllbnQodG9rZW46IHN0cmluZyk6IENsaWVudCB7XG4gICAgcmV0dXJuIGNyZWF0ZUh0dHBDbGllbnQodGhpcy5lbnYuU2lnbmVyQXBpUm9vdCwgdG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgdGltZXN0YW1wIGlzIHdpdGhpbiB7QGxpbmsgYnVmZmVyU2Vjb25kc30gc2Vjb25kcyBmcm9tIGV4cGlyYXRpb24uXG4gICAqIEBwYXJhbSB7RGF0ZX0gZXhwIFRoZSB0aW1lc3RhbXAgdG8gY2hlY2tcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJ1ZmZlclNlY29uZHMgVGltZSBidWZmZXIgaW4gc2Vjb25kcyAoZGVmYXVsdHMgdG8gMHMpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHRpbWVzdGFtcCBoYXMgZXhwaXJlZFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBoYXNFeHBpcmVkKGV4cDogRGF0ZSwgYnVmZmVyU2Vjb25kcz86IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGJ1ZmZlclNlY29uZHMgPz89IDA7XG4gICAgY29uc3QgZXhwTXNTaW5jZUVwb2NoID0gZXhwLmdldFRpbWUoKTtcbiAgICBjb25zdCBub3dNc1NpbmNlRXBvY2ggPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBjb25zdCBidWZmZXJNcyA9IGJ1ZmZlclNlY29uZHMgKiAxMDAwO1xuICAgIHJldHVybiBleHBNc1NpbmNlRXBvY2ggPCBub3dNc1NpbmNlRXBvY2ggKyBidWZmZXJNcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHRpbWVzdGFtcCBpcyBzdGFsZSwgaS5lLiwgaXQncyB3aXRoaW4ge0BsaW5rIGJ1ZmZlclNlY29uZHN9IHNlY29uZHMgZnJvbSBleHBpcmF0aW9uLlxuICAgKiBAcGFyYW0ge0RhdGV9IGV4cCBUaGUgdGltZXN0YW1wIHRvIGNoZWNrXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBidWZmZXJTZWNvbmRzIFRpbWUgYnVmZmVyIGluIHNlY29uZHMgKGRlZmF1bHRzIHRvIDMwcylcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgdGltZXN0YW1wIGlzIHN0YWxlXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGlzU3RhbGUoZXhwOiBEYXRlLCBidWZmZXJTZWNvbmRzPzogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzRXhwaXJlZChleHAsIGJ1ZmZlclNlY29uZHMgPz8gREVGQVVMVF9FWFBJUkFUSU9OX0JVRkZFUl9TRUNTKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgdGhhdCBzYXlzIHRoYXQgc29tZSBmZWF0dXJlIGlzIHVuc3VwcG9ydGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgZmVhdHVyZSB0aGF0IGlzIG5vdCBzdXBwb3J0ZWRcbiAgICovXG4gIHByb3RlY3RlZCB1bnN1cHBvcnRlZChuYW1lOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgbm90IHN1cHBvcnRlZGApO1xuICB9XG59XG5cbi8qKiBJbnRlcmZhY2UgZm9yIGEgc2Vzc2lvbiBtYW5hZ2VyIHRoYXQga25vd3MgYWJvdXQgdGhlIG9yZyB0aGF0IHRoZSBzZXNzaW9uIGlzIGluLiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE9yZ1Nlc3Npb25NYW5hZ2VyPFU+IGV4dGVuZHMgU2Vzc2lvbk1hbmFnZXI8VT4ge1xuICByZWFkb25seSBvcmdJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb25cbiAgICogQHBhcmFtIHtTZXNzaW9uU3RvcmFnZTxVPn0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2UgZm9yIHN0b3JpbmdcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbnY6IEVudkludGVyZmFjZSwgb3JnSWQ6IHN0cmluZywgc3RvcmFnZTogU2Vzc2lvblN0b3JhZ2U8VT4pIHtcbiAgICBzdXBlcihlbnYsIHN0b3JhZ2UpO1xuICAgIHRoaXMub3JnSWQgPSBvcmdJZDtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhhc0VudiB7XG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgKi9cbiAgZW52OiB7XG4gICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogRW52SW50ZXJmYWNlO1xuICB9O1xufVxuXG4vKiogVHlwZSBvZiB0aGUgcmVmcmVzaCB0aW1lciBJRC4gKi9cbmV4cG9ydCB0eXBlIFJlZnJlc2hJZCA9IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPjtcbiJdfQ==