"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgSessionManager = exports.SessionManager = void 0;
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
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
        return (0, openapi_fetch_1.default)({
            baseUrl: this.env.SignerApiRoot,
            headers: {
                Authorization: token,
            },
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbl9tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vc2Vzc2lvbl9tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUdBLGtFQUF5QztBQUV6QyxNQUFNLDhCQUE4QixHQUFHLEVBQUUsQ0FBQztBQUUxQyx5Q0FBeUM7QUFDekMsTUFBc0IsY0FBYztJQTBCbEM7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxlQUFlO1FBQ25CLElBQUksTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDeEIsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFdBQVc7UUFDVCxPQUFPLFdBQVcsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUM1QixNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMvQixDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxnQkFBZ0IsQ0FBQyxLQUFnQjtRQUMvQixhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxHQUFpQixFQUFFLE9BQTBCO1FBQ3ZELElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7O09BSUc7SUFDTyxZQUFZLENBQUMsS0FBYTtRQUNsQyxPQUFPLElBQUEsdUJBQVksRUFBUTtZQUN6QixPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhO1lBQy9CLE9BQU8sRUFBRTtnQkFDUCxhQUFhLEVBQUUsS0FBSzthQUNyQjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNPLFVBQVUsQ0FBQyxHQUFXLEVBQUUsTUFBZTtRQUMvQyxPQUFPLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxJQUFJLDhCQUE4QixDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ3hGLENBQUM7SUFFRDs7O09BR0c7SUFDTyxXQUFXLENBQUMsSUFBWTtRQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxpQkFBaUIsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FDRjtBQXRHRCx3Q0FzR0M7QUFFRCx1RkFBdUY7QUFDdkYsTUFBc0IsaUJBQXFCLFNBQVEsY0FBaUI7SUFHbEU7Ozs7OztPQU1HO0lBQ0gsWUFBWSxHQUFpQixFQUFFLEtBQWEsRUFBRSxPQUEwQjtRQUN0RSxLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQWRELDhDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi5cIjtcbmltcG9ydCB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcbmltcG9ydCB7IENsaWVudCwgcGF0aHMgfSBmcm9tIFwiLi4vY2xpZW50XCI7XG5pbXBvcnQgY3JlYXRlQ2xpZW50IGZyb20gXCJvcGVuYXBpLWZldGNoXCI7XG5cbmNvbnN0IERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDUyA9IDMwO1xuXG4vKiogR2VuZXJpYyBzZXNzaW9uIG1hbmFnZXIgaW50ZXJmYWNlLiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNlc3Npb25NYW5hZ2VyPFU+IHtcbiAgcmVhZG9ubHkgZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5IHN0b3JhZ2U6IFNlc3Npb25TdG9yYWdlPFU+O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IGF1dGggdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYWJzdHJhY3QgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+O1xuXG4gIC8qKiBSZXR1cm5zIGEgY2xpZW50IGluc3RhbmNlIHRoYXQgdXNlcyB0aGUgdG9rZW4uICovXG4gIGFic3RyYWN0IGNsaWVudCgpOiBQcm9taXNlPENsaWVudD47XG5cbiAgLyoqIFJldm9rZXMgdGhlIHNlc3Npb24uICovXG4gIGFic3RyYWN0IHJldm9rZSgpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24uICovXG4gIGFic3RyYWN0IHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhYnN0cmFjdCBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj47XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBpZiBpdCBpcyBhYm91dCB0byBleHBpcmUuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHNlc3Npb24gdG9rZW4gd2FzIHJlZnJlc2hlZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyByZWZyZXNoSWZOZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMuaXNTdGFsZSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2goKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQXV0b21hdGljYWxseSByZWZyZXNoZXMgdGhlIHNlc3Npb24gaW4gdGhlIGJhY2tncm91bmQuXG4gICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIHJlZnJlc2hlcyAoaWYgbmVlZGVkKSBldmVyeSBtaW51dGUuXG4gICAqIEJhc2UgaW1wbGVtZW50YXRpb25zIGNhbiwgaW5zdGVhZCB1c2UgdGhlIHRva2VuIGV4cGlyYXRpb25zIHRpbWVzdGFtcHNcbiAgICogdG8gcmVmcmVzaCBsZXNzIG9mdGVuLiBUaGlzIGlzIGEgc2ltcGxlIHdyYXBwZXIgYXJvdW5kIGBzZXRJbnRlcnZhbGAuXG4gICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGludGVydmFsIElEIG9mIHRoZSByZWZyZXNoIHRpbWVyLlxuICAgKi9cbiAgYXV0b1JlZnJlc2goKTogUmVmcmVzaElkIHtcbiAgICByZXR1cm4gc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoSWZOZWVkZWQoKTtcbiAgICB9LCA2MCAqIDEwMDApO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgYXV0byByZWZyZXNoIHRpbWVyLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZXIgVGhlIHRpbWVyIElEIHRvIGNsZWFyLlxuICAgKi9cbiAgY2xlYXJBdXRvUmVmcmVzaCh0aW1lcjogUmVmcmVzaElkKTogdm9pZCB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7U2Vzc2lvblN0b3JhZ2U8VT59IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgYmFjayBlbmQgdG8gdXNlIGZvciBzdG9yaW5nXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vzc2lvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgY29uc3RydWN0b3IoZW52OiBFbnZJbnRlcmZhY2UsIHN0b3JhZ2U6IFNlc3Npb25TdG9yYWdlPFU+KSB7XG4gICAgdGhpcy5lbnYgPSBlbnY7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFJFU1QgY2xpZW50IHdpdGggYSBnaXZlbiB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gVGhlIGF1dGhvcml6YXRpb24gdG9rZW4gdG8gdXNlIGZvciB0aGUgY2xpZW50XG4gICAqIEByZXR1cm4ge0NsaWVudH0gVGhlIG5ldyBSRVNUIGNsaWVudFxuICAgKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUNsaWVudCh0b2tlbjogc3RyaW5nKTogQ2xpZW50IHtcbiAgICByZXR1cm4gY3JlYXRlQ2xpZW50PHBhdGhzPih7XG4gICAgICBiYXNlVXJsOiB0aGlzLmVudi5TaWduZXJBcGlSb290LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB0aW1lc3RhbXAgaGFzIGV4cGlyZWQuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBleHAgVGhlIHRpbWVzdGFtcCB0byBjaGVja1xuICAgKiBAcGFyYW0ge251bWJlcn0gYnVmZmVyIE9wdGlvbmFsIHRpbWUgYnVmZmVyIHdoZW4gY2hlY2tpbmcgdGhlIGV4cGlyYXRpb25cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgdGltZXN0YW1wIGhhcyBleHBpcmVkXG4gICAqL1xuICBwcm90ZWN0ZWQgaGFzRXhwaXJlZChleHA6IG51bWJlciwgYnVmZmVyPzogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGV4cCA8IG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgKGJ1ZmZlciB8fCBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1MpICogMTAwMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgdGhhdCBzYXlzIHRoYXQgc29tZSBmZWF0dXJlIGlzIHVuc3VwcG9ydGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgZmVhdHVyZSB0aGF0IGlzIG5vdCBzdXBwb3J0ZWRcbiAgICovXG4gIHByb3RlY3RlZCB1bnN1cHBvcnRlZChuYW1lOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgbm90IHN1cHBvcnRlZGApO1xuICB9XG59XG5cbi8qKiBJbnRlcmZhY2UgZm9yIGEgc2Vzc2lvbiBtYW5hZ2VyIHRoYXQga25vd3MgYWJvdXQgdGhlIG9yZyB0aGF0IHRoZSBzZXNzaW9uIGlzIGluLiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE9yZ1Nlc3Npb25NYW5hZ2VyPFU+IGV4dGVuZHMgU2Vzc2lvbk1hbmFnZXI8VT4ge1xuICByZWFkb25seSBvcmdJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb25cbiAgICogQHBhcmFtIHtTZXNzaW9uU3RvcmFnZTxVPn0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2UgZm9yIHN0b3JpbmdcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbnY6IEVudkludGVyZmFjZSwgb3JnSWQ6IHN0cmluZywgc3RvcmFnZTogU2Vzc2lvblN0b3JhZ2U8VT4pIHtcbiAgICBzdXBlcihlbnYsIHN0b3JhZ2UpO1xuICAgIHRoaXMub3JnSWQgPSBvcmdJZDtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhhc0VudiB7XG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgKi9cbiAgZW52OiB7XG4gICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogRW52SW50ZXJmYWNlO1xuICB9O1xufVxuXG4vKiogVHlwZSBvZiB0aGUgcmVmcmVzaCB0aW1lciBJRC4gKi9cbmV4cG9ydCB0eXBlIFJlZnJlc2hJZCA9IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPjtcbiJdfQ==