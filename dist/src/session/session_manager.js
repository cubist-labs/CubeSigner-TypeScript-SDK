"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgSessionManager = exports.SessionManager = void 0;
const events_1 = require("../events");
const api_1 = require("../api");
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
            await this.refresh();
            return true;
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
     * Check if a timestamp has expired.
     * @param {Date} exp The timestamp to check
     * @param {number} bufferSeconds Time buffer in seconds (defaults to 30s)
     * @return {boolean} True if the timestamp has expired
     */
    static hasExpired(exp, bufferSeconds) {
        bufferSeconds ??= DEFAULT_EXPIRATION_BUFFER_SECS;
        const expMsSinceEpoch = exp.getTime();
        const nowMsSinceEpoch = new Date().getTime();
        const bufferMs = bufferSeconds * 1000;
        return expMsSinceEpoch < nowMsSinceEpoch + bufferMs;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbl9tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHNDQUFtQztBQUVuQyxnQ0FBa0Q7QUFHbEQsTUFBTSw4QkFBOEIsR0FBRyxFQUFFLENBQUM7QUFFMUMseUNBQXlDO0FBQ3pDLE1BQXNCLGNBQWM7SUEyQmxDOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsZUFBZTtRQUNuQixJQUFJLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7WUFDekIsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsV0FBVztRQUNULE9BQU8sV0FBVyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQzVCLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQy9CLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILGdCQUFnQixDQUFDLEtBQWdCO1FBQy9CLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLEdBQWlCLEVBQUUsT0FBMEI7UUFoRWhELFdBQU0sR0FBRyxJQUFJLGVBQU0sRUFBRSxDQUFDO1FBaUU3QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7OztPQUlHO0lBQ08sWUFBWSxDQUFDLEtBQWE7UUFDbEMsT0FBTyxJQUFBLHNCQUFnQixFQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNPLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBUyxFQUFFLGFBQXNCO1FBQzNELGFBQWEsS0FBSyw4QkFBOEIsQ0FBQztRQUNqRCxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3QyxNQUFNLFFBQVEsR0FBRyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ3RDLE9BQU8sZUFBZSxHQUFHLGVBQWUsR0FBRyxRQUFRLENBQUM7SUFDdEQsQ0FBQztJQUVEOzs7T0FHRztJQUNPLFdBQVcsQ0FBQyxJQUFZO1FBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLGlCQUFpQixDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBdEdELHdDQXNHQztBQUVELHVGQUF1RjtBQUN2RixNQUFzQixpQkFBcUIsU0FBUSxjQUFpQjtJQUdsRTs7Ozs7O09BTUc7SUFDSCxZQUFZLEdBQWlCLEVBQUUsS0FBYSxFQUFFLE9BQTBCO1FBQ3RFLEtBQUssQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDckIsQ0FBQztDQUNGO0FBZEQsOENBY0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudHMgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5pbXBvcnQgeyBDbGllbnQsIGNyZWF0ZUh0dHBDbGllbnQgfSBmcm9tIFwiLi4vYXBpXCI7XG5pbXBvcnQgeyBTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb25fc3RvcmFnZVwiO1xuXG5jb25zdCBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1MgPSAzMDtcblxuLyoqIEdlbmVyaWMgc2Vzc2lvbiBtYW5hZ2VyIGludGVyZmFjZS4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTZXNzaW9uTWFuYWdlcjxVPiB7XG4gIHJlYWRvbmx5IGVudjogRW52SW50ZXJmYWNlO1xuICByZWFkb25seSBzdG9yYWdlOiBTZXNzaW9uU3RvcmFnZTxVPjtcbiAgcmVhZG9ubHkgZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IGF1dGggdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYWJzdHJhY3QgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+O1xuXG4gIC8qKiBSZXR1cm5zIGEgY2xpZW50IGluc3RhbmNlIHRoYXQgdXNlcyB0aGUgdG9rZW4uICovXG4gIGFic3RyYWN0IGNsaWVudCgpOiBQcm9taXNlPENsaWVudD47XG5cbiAgLyoqIFJldm9rZXMgdGhlIHNlc3Npb24uICovXG4gIGFic3RyYWN0IHJldm9rZSgpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24uICovXG4gIGFic3RyYWN0IHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhYnN0cmFjdCBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj47XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBpZiBpdCBpcyBhYm91dCB0byBleHBpcmUuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHNlc3Npb24gdG9rZW4gd2FzIHJlZnJlc2hlZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyByZWZyZXNoSWZOZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMuaXNTdGFsZSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2goKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQXV0b21hdGljYWxseSByZWZyZXNoZXMgdGhlIHNlc3Npb24gaW4gdGhlIGJhY2tncm91bmQuXG4gICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIHJlZnJlc2hlcyAoaWYgbmVlZGVkKSBldmVyeSBtaW51dGUuXG4gICAqIEJhc2UgaW1wbGVtZW50YXRpb25zIGNhbiwgaW5zdGVhZCB1c2UgdGhlIHRva2VuIGV4cGlyYXRpb25zIHRpbWVzdGFtcHNcbiAgICogdG8gcmVmcmVzaCBsZXNzIG9mdGVuLiBUaGlzIGlzIGEgc2ltcGxlIHdyYXBwZXIgYXJvdW5kIGBzZXRJbnRlcnZhbGAuXG4gICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGludGVydmFsIElEIG9mIHRoZSByZWZyZXNoIHRpbWVyLlxuICAgKi9cbiAgYXV0b1JlZnJlc2goKTogUmVmcmVzaElkIHtcbiAgICByZXR1cm4gc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoSWZOZWVkZWQoKTtcbiAgICB9LCA2MCAqIDEwMDApO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgYXV0byByZWZyZXNoIHRpbWVyLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZXIgVGhlIHRpbWVyIElEIHRvIGNsZWFyLlxuICAgKi9cbiAgY2xlYXJBdXRvUmVmcmVzaCh0aW1lcjogUmVmcmVzaElkKTogdm9pZCB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7U2Vzc2lvblN0b3JhZ2U8VT59IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgYmFjayBlbmQgdG8gdXNlIGZvciBzdG9yaW5nXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vzc2lvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgY29uc3RydWN0b3IoZW52OiBFbnZJbnRlcmZhY2UsIHN0b3JhZ2U6IFNlc3Npb25TdG9yYWdlPFU+KSB7XG4gICAgdGhpcy5lbnYgPSBlbnY7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFJFU1QgY2xpZW50IHdpdGggYSBnaXZlbiB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gVGhlIGF1dGhvcml6YXRpb24gdG9rZW4gdG8gdXNlIGZvciB0aGUgY2xpZW50XG4gICAqIEByZXR1cm4ge0NsaWVudH0gVGhlIG5ldyBSRVNUIGNsaWVudFxuICAgKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUNsaWVudCh0b2tlbjogc3RyaW5nKTogQ2xpZW50IHtcbiAgICByZXR1cm4gY3JlYXRlSHR0cENsaWVudCh0aGlzLmVudi5TaWduZXJBcGlSb290LCB0b2tlbik7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB0aW1lc3RhbXAgaGFzIGV4cGlyZWQuXG4gICAqIEBwYXJhbSB7RGF0ZX0gZXhwIFRoZSB0aW1lc3RhbXAgdG8gY2hlY2tcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJ1ZmZlclNlY29uZHMgVGltZSBidWZmZXIgaW4gc2Vjb25kcyAoZGVmYXVsdHMgdG8gMzBzKVxuICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSB0aW1lc3RhbXAgaGFzIGV4cGlyZWRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgaGFzRXhwaXJlZChleHA6IERhdGUsIGJ1ZmZlclNlY29uZHM/OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBidWZmZXJTZWNvbmRzID8/PSBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1M7XG4gICAgY29uc3QgZXhwTXNTaW5jZUVwb2NoID0gZXhwLmdldFRpbWUoKTtcbiAgICBjb25zdCBub3dNc1NpbmNlRXBvY2ggPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBjb25zdCBidWZmZXJNcyA9IGJ1ZmZlclNlY29uZHMgKiAxMDAwO1xuICAgIHJldHVybiBleHBNc1NpbmNlRXBvY2ggPCBub3dNc1NpbmNlRXBvY2ggKyBidWZmZXJNcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgdGhhdCBzYXlzIHRoYXQgc29tZSBmZWF0dXJlIGlzIHVuc3VwcG9ydGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgZmVhdHVyZSB0aGF0IGlzIG5vdCBzdXBwb3J0ZWRcbiAgICovXG4gIHByb3RlY3RlZCB1bnN1cHBvcnRlZChuYW1lOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgbm90IHN1cHBvcnRlZGApO1xuICB9XG59XG5cbi8qKiBJbnRlcmZhY2UgZm9yIGEgc2Vzc2lvbiBtYW5hZ2VyIHRoYXQga25vd3MgYWJvdXQgdGhlIG9yZyB0aGF0IHRoZSBzZXNzaW9uIGlzIGluLiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE9yZ1Nlc3Npb25NYW5hZ2VyPFU+IGV4dGVuZHMgU2Vzc2lvbk1hbmFnZXI8VT4ge1xuICByZWFkb25seSBvcmdJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb25cbiAgICogQHBhcmFtIHtTZXNzaW9uU3RvcmFnZTxVPn0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2UgZm9yIHN0b3JpbmdcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbnY6IEVudkludGVyZmFjZSwgb3JnSWQ6IHN0cmluZywgc3RvcmFnZTogU2Vzc2lvblN0b3JhZ2U8VT4pIHtcbiAgICBzdXBlcihlbnYsIHN0b3JhZ2UpO1xuICAgIHRoaXMub3JnSWQgPSBvcmdJZDtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhhc0VudiB7XG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgKi9cbiAgZW52OiB7XG4gICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogRW52SW50ZXJmYWNlO1xuICB9O1xufVxuXG4vKiogVHlwZSBvZiB0aGUgcmVmcmVzaCB0aW1lciBJRC4gKi9cbmV4cG9ydCB0eXBlIFJlZnJlc2hJZCA9IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPjtcbiJdfQ==