"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgSessionManager = exports.SessionManager = void 0;
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
     * @param {number} exp The timestamp to check
     * @param {number} buffer Optional time buffer when checking the expiration
     * @return {boolean} True if the timestamp has expired
     */
    hasExpired(exp, buffer) {
        return exp < new Date().getTime() + (buffer || DEFAULT_EXPIRATION_BUFFER_SECS) * 1000;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbl9tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLGdDQUFrRDtBQUVsRCxNQUFNLDhCQUE4QixHQUFHLEVBQUUsQ0FBQztBQUUxQyx5Q0FBeUM7QUFDekMsTUFBc0IsY0FBYztJQTBCbEM7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxlQUFlO1FBQ25CLElBQUksTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUN6QixNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxXQUFXO1FBQ1QsT0FBTyxXQUFXLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDNUIsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDL0IsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsZ0JBQWdCLENBQUMsS0FBZ0I7UUFDL0IsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksR0FBaUIsRUFBRSxPQUEwQjtRQUN2RCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7OztPQUlHO0lBQ08sWUFBWSxDQUFDLEtBQWE7UUFDbEMsT0FBTyxJQUFBLHNCQUFnQixFQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNPLFVBQVUsQ0FBQyxHQUFXLEVBQUUsTUFBZTtRQUMvQyxPQUFPLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxJQUFJLDhCQUE4QixDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ3hGLENBQUM7SUFFRDs7O09BR0c7SUFDTyxXQUFXLENBQUMsSUFBWTtRQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxpQkFBaUIsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FDRjtBQWpHRCx3Q0FpR0M7QUFFRCx1RkFBdUY7QUFDdkYsTUFBc0IsaUJBQXFCLFNBQVEsY0FBaUI7SUFHbEU7Ozs7OztPQU1HO0lBQ0gsWUFBWSxHQUFpQixFQUFFLEtBQWEsRUFBRSxPQUEwQjtRQUN0RSxLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQWRELDhDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi5cIjtcbmltcG9ydCB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcbmltcG9ydCB7IENsaWVudCwgY3JlYXRlSHR0cENsaWVudCB9IGZyb20gXCIuLi9hcGlcIjtcblxuY29uc3QgREVGQVVMVF9FWFBJUkFUSU9OX0JVRkZFUl9TRUNTID0gMzA7XG5cbi8qKiBHZW5lcmljIHNlc3Npb24gbWFuYWdlciBpbnRlcmZhY2UuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU2Vzc2lvbk1hbmFnZXI8VT4ge1xuICByZWFkb25seSBlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgc3RvcmFnZTogU2Vzc2lvblN0b3JhZ2U8VT47XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGN1cnJlbnQgYXV0aCB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhYnN0cmFjdCB0b2tlbigpOiBQcm9taXNlPHN0cmluZz47XG5cbiAgLyoqIFJldHVybnMgYSBjbGllbnQgaW5zdGFuY2UgdGhhdCB1c2VzIHRoZSB0b2tlbi4gKi9cbiAgYWJzdHJhY3QgY2xpZW50KCk6IFByb21pc2U8Q2xpZW50PjtcblxuICAvKiogUmV2b2tlcyB0aGUgc2Vzc2lvbi4gKi9cbiAgYWJzdHJhY3QgcmV2b2tlKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbi4gKi9cbiAgYWJzdHJhY3QgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFic3RyYWN0IGlzU3RhbGUoKTogUHJvbWlzZTxib29sZWFuPjtcblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBzZXNzaW9uIGlmIGl0IGlzIGFib3V0IHRvIGV4cGlyZS5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgc2Vzc2lvbiB0b2tlbiB3YXMgcmVmcmVzaGVkLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIHJlZnJlc2hJZk5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5pc1N0YWxlKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaCgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRvbWF0aWNhbGx5IHJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBpbiB0aGUgYmFja2dyb3VuZC5cbiAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gcmVmcmVzaGVzIChpZiBuZWVkZWQpIGV2ZXJ5IG1pbnV0ZS5cbiAgICogQmFzZSBpbXBsZW1lbnRhdGlvbnMgY2FuLCBpbnN0ZWFkIHVzZSB0aGUgdG9rZW4gZXhwaXJhdGlvbnMgdGltZXN0YW1wc1xuICAgKiB0byByZWZyZXNoIGxlc3Mgb2Z0ZW4uIFRoaXMgaXMgYSBzaW1wbGUgd3JhcHBlciBhcm91bmQgYHNldEludGVydmFsYC5cbiAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgaW50ZXJ2YWwgSUQgb2YgdGhlIHJlZnJlc2ggdGltZXIuXG4gICAqL1xuICBhdXRvUmVmcmVzaCgpOiBSZWZyZXNoSWQge1xuICAgIHJldHVybiBzZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hJZk5lZWRlZCgpO1xuICAgIH0sIDYwICogMTAwMCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBhdXRvIHJlZnJlc2ggdGltZXIuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lciBUaGUgdGltZXIgSUQgdG8gY2xlYXIuXG4gICAqL1xuICBjbGVhckF1dG9SZWZyZXNoKHRpbWVyOiBSZWZyZXNoSWQpOiB2b2lkIHtcbiAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtTZXNzaW9uU3RvcmFnZTxVPn0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2UgZm9yIHN0b3JpbmdcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbnY6IEVudkludGVyZmFjZSwgc3RvcmFnZTogU2Vzc2lvblN0b3JhZ2U8VT4pIHtcbiAgICB0aGlzLmVudiA9IGVudjtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgUkVTVCBjbGllbnQgd2l0aCBhIGdpdmVuIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiBUaGUgYXV0aG9yaXphdGlvbiB0b2tlbiB0byB1c2UgZm9yIHRoZSBjbGllbnRcbiAgICogQHJldHVybiB7Q2xpZW50fSBUaGUgbmV3IFJFU1QgY2xpZW50XG4gICAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlQ2xpZW50KHRva2VuOiBzdHJpbmcpOiBDbGllbnQge1xuICAgIHJldHVybiBjcmVhdGVIdHRwQ2xpZW50KHRoaXMuZW52LlNpZ25lckFwaVJvb3QsIHRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHRpbWVzdGFtcCBoYXMgZXhwaXJlZC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGV4cCBUaGUgdGltZXN0YW1wIHRvIGNoZWNrXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBidWZmZXIgT3B0aW9uYWwgdGltZSBidWZmZXIgd2hlbiBjaGVja2luZyB0aGUgZXhwaXJhdGlvblxuICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSB0aW1lc3RhbXAgaGFzIGV4cGlyZWRcbiAgICovXG4gIHByb3RlY3RlZCBoYXNFeHBpcmVkKGV4cDogbnVtYmVyLCBidWZmZXI/OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZXhwIDwgbmV3IERhdGUoKS5nZXRUaW1lKCkgKyAoYnVmZmVyIHx8IERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDUykgKiAxMDAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFRocm93cyBhbiBlcnJvciB0aGF0IHNheXMgdGhhdCBzb21lIGZlYXR1cmUgaXMgdW5zdXBwb3J0ZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBmZWF0dXJlIHRoYXQgaXMgbm90IHN1cHBvcnRlZFxuICAgKi9cbiAgcHJvdGVjdGVkIHVuc3VwcG9ydGVkKG5hbWU6IHN0cmluZyk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCcke25hbWV9JyBub3Qgc3VwcG9ydGVkYCk7XG4gIH1cbn1cblxuLyoqIEludGVyZmFjZSBmb3IgYSBzZXNzaW9uIG1hbmFnZXIgdGhhdCBrbm93cyBhYm91dCB0aGUgb3JnIHRoYXQgdGhlIHNlc3Npb24gaXMgaW4uICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgT3JnU2Vzc2lvbk1hbmFnZXI8VT4gZXh0ZW5kcyBTZXNzaW9uTWFuYWdlcjxVPiB7XG4gIHJlYWRvbmx5IG9yZ0lkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmcgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1Nlc3Npb25TdG9yYWdlPFU+fSBzdG9yYWdlIFRoZSBzdG9yYWdlIGJhY2sgZW5kIHRvIHVzZSBmb3Igc3RvcmluZ1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb24gaW5mb3JtYXRpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVudjogRW52SW50ZXJmYWNlLCBvcmdJZDogc3RyaW5nLCBzdG9yYWdlOiBTZXNzaW9uU3RvcmFnZTxVPikge1xuICAgIHN1cGVyKGVudiwgc3RvcmFnZSk7XG4gICAgdGhpcy5vcmdJZCA9IG9yZ0lkO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSGFzRW52IHtcbiAgLyoqIFRoZSBlbnZpcm9ubWVudCAqL1xuICBlbnY6IHtcbiAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBFbnZJbnRlcmZhY2U7XG4gIH07XG59XG5cbi8qKiBUeXBlIG9mIHRoZSByZWZyZXNoIHRpbWVyIElELiAqL1xuZXhwb3J0IHR5cGUgUmVmcmVzaElkID0gUmV0dXJuVHlwZTx0eXBlb2Ygc2V0SW50ZXJ2YWw+O1xuIl19