"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _NoRefreshSessionManager_metadata, _NoRefreshSessionManager_token, _ExclusiveSessionManager_refreshing, _MemorySessionManager_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRefreshable = exports.isStale = exports.DEFAULT_EXPIRATION_BUFFER_SECS = exports.NoSessionFoundError = exports.MemorySessionManager = exports.ExclusiveSessionManager = exports.NoRefreshSessionManager = void 0;
exports.parseSessionLike = parseSessionLike;
exports.refresh = refresh;
exports.metadata = metadata;
exports.parseBase64SessionData = parseBase64SessionData;
const fetch_1 = require("../fetch");
const retry_1 = require("../retry");
/**
 * Utility function that parses base64 encoded SessionData, if necessary.
 * This allows SessionManagers to easily ingest the multiple supported formats for sessions.
 *
 * @param {SessionLike} session The session object or encoding
 * @return {SessionData} The session object
 */
function parseSessionLike(session) {
    return typeof session === "string" ? parseBase64SessionData(session) : session;
}
/**
 * Allows the construction of clients which do not automatically refresh
 * sessions.
 *
 * For example:
 * ```typescript
 * const manager = new NoRefreshSessionManager(sessionData);
 * const client = await CubeSignerClient.create(manager);
 * ```
 */
class NoRefreshSessionManager {
    /**
     * Constructs the manager with the session data
     *
     * @param {SessionLike} session The session for this manager to use
     */
    constructor(session) {
        _NoRefreshSessionManager_metadata.set(this, void 0);
        _NoRefreshSessionManager_token.set(this, void 0);
        session = parseSessionLike(session);
        __classPrivateFieldSet(this, _NoRefreshSessionManager_metadata, metadata(session), "f");
        __classPrivateFieldSet(this, _NoRefreshSessionManager_token, session.token, "f");
    }
    /** Provides non-sensitive metadata on the session */
    async metadata() {
        return __classPrivateFieldGet(this, _NoRefreshSessionManager_metadata, "f");
    }
    /** Provides the token to use for requests */
    async token() {
        return __classPrivateFieldGet(this, _NoRefreshSessionManager_token, "f");
    }
}
exports.NoRefreshSessionManager = NoRefreshSessionManager;
_NoRefreshSessionManager_metadata = new WeakMap(), _NoRefreshSessionManager_token = new WeakMap();
/**
 * A template for session managers which have exclusive access to a session
 * and can store/load them freely.
 *
 * It is NOT suitable for applications where multiple clients are using the same
 * session as they will both attempt to refresh independently.
 */
class ExclusiveSessionManager {
    constructor() {
        /** If present, the session is currently refreshing. Await to get the freshest SessionData */
        _ExclusiveSessionManager_refreshing.set(this, void 0);
    }
    /**
     * Loads the session metadata from storage
     * @return {Promise<SessionMetadata>}
     */
    metadata() {
        return this.retrieve().then(metadata);
    }
    /**
     * Loads the token from storage, refreshing if necessary
     * @return {Promise<SessionMetadata>}
     */
    async token() {
        const data = await this.retrieve();
        __classPrivateFieldSet(this, _ExclusiveSessionManager_refreshing, __classPrivateFieldGet(this, _ExclusiveSessionManager_refreshing, "f") ?? refreshIfNecessary(data)
            ?.then(async (data) => (await this.store(data), data))
            ?.finally(() => (__classPrivateFieldSet(this, _ExclusiveSessionManager_refreshing, undefined, "f"))), "f");
        // Technically, in many cases we shouldn't have to wait for the refresh,
        // the session will still be valid for a while after the refresh starts.
        //
        // However, sometimes the auth token will be entirely expired, so we conservatively
        // wait for a successful refresh
        const session = __classPrivateFieldGet(this, _ExclusiveSessionManager_refreshing, "f") ? await __classPrivateFieldGet(this, _ExclusiveSessionManager_refreshing, "f") : data;
        return session.token;
    }
    /**
     * Manually force a token refresh
     *
     * @return {SessionData} The newly refreshed session data
     * @internal
     */
    async forceRefresh() {
        // If not currently refreshing, start refreshing
        __classPrivateFieldSet(this, _ExclusiveSessionManager_refreshing, __classPrivateFieldGet(this, _ExclusiveSessionManager_refreshing, "f") ?? this.retrieve()
            .then(refresh)
            .then(async (data) => (await this.store(data), data))
            .finally(() => (__classPrivateFieldSet(this, _ExclusiveSessionManager_refreshing, undefined, "f"))), "f");
        // Because we ??= assigned to refreshing above, we're guaranteed to be
        // actively refreshing, so just await it.
        return await __classPrivateFieldGet(this, _ExclusiveSessionManager_refreshing, "f");
    }
}
exports.ExclusiveSessionManager = ExclusiveSessionManager;
_ExclusiveSessionManager_refreshing = new WeakMap();
/** Implements a SessionManager without persistence */
class MemorySessionManager extends ExclusiveSessionManager {
    /**
     * Construct with data in memory
     * @param {SessionData} data The initial session data
     */
    constructor(data) {
        super();
        /** The session data containing both metadata and tokens */
        _MemorySessionManager_data.set(this, void 0);
        __classPrivateFieldSet(this, _MemorySessionManager_data, data, "f");
    }
    /** Return the in-memory data */
    async retrieve() {
        return __classPrivateFieldGet(this, _MemorySessionManager_data, "f");
    }
    /**
     * Store the in-memory data
     * @param {SessionData} data The session data to store
     */
    async store(data) {
        __classPrivateFieldSet(this, _MemorySessionManager_data, data, "f");
    }
}
exports.MemorySessionManager = MemorySessionManager;
_MemorySessionManager_data = new WeakMap();
/** An error type to be thrown by SessionManager's when the session is unavailable */
class NoSessionFoundError extends Error {
    /** Constructs the error with the appropriate message */
    constructor() {
        super("No session available for the client");
    }
}
exports.NoSessionFoundError = NoSessionFoundError;
/** The number of seconds before expiration time, to attempt a refresh */
exports.DEFAULT_EXPIRATION_BUFFER_SECS = 30;
/**
 * A utility function that refreshes a session using the CubeSigner API if it is close
 * to expiring.
 *
 * @param {SessionData} session The session data which may require a refresh
 * @return {undefined | Promise<SessionData>} Immediately returns undefined if the session does not require a refresh
 */
function refreshIfNecessary(session) {
    if (!(0, exports.isStale)(session))
        return;
    return refresh(session);
}
/**
 * Invokes the CubeSigner API to refresh a session
 * @param {SessionData} session
 * @return {SessionData}
 */
function refresh(session) {
    const { epoch: epoch_num, epoch_token, refresh_token: other_token } = session.session_info;
    return (0, retry_1.retryOn5XX)(() => (0, fetch_1.apiFetch)("/v1/org/{org_id}/token/refresh", "patch", {
        baseUrl: session.env["Dev-CubeSignerStack"].SignerApiRoot.replace(/\/$/, ""),
        params: {
            path: {
                org_id: session.org_id,
            },
        },
        headers: {
            Authorization: session.token,
        },
        body: { epoch_num, epoch_token, other_token },
    }))
        .then(fetch_1.assertOk)
        .then((res) => ({
        ...session,
        ...res,
    }));
}
/**
 * Get the safe metadata from a SessionData
 * @param {SessionData} session The session
 * @return {SessionMetadata} The session metadata
 */
function metadata(session) {
    const { env, org_id, role_id, purpose, session_exp } = session;
    return {
        env,
        org_id,
        role_id,
        purpose,
        session_id: session.session_info.session_id,
        session_exp,
        epoch: session.session_info.epoch,
    };
}
/**
 * @param {number} timeInSeconds an epoch timestamp
 * @return {bool} whether or not the timestamp is before now + DEFAULT_EXPIRATION_BUFFER_SECS
 */
const isWithinBuffer = (timeInSeconds) => timeInSeconds < Date.now() / 1000 + exports.DEFAULT_EXPIRATION_BUFFER_SECS;
const isStale = (session) => isWithinBuffer(session.session_info.auth_token_exp);
exports.isStale = isStale;
const isRefreshable = (session) => !isWithinBuffer(session.session_exp ?? Number.POSITIVE_INFINITY) &&
    !isWithinBuffer(session.session_info.refresh_token_exp);
exports.isRefreshable = isRefreshable;
/**
 * Parses the base64 API session token.
 * Consumes the output of the cli command:
 *
 * ```
 * cs token create --output base64
 * ```
 *
 * @param {string} sessionDataString Base64 encoded API session token.
 *
 * @return {SignerSessionData} session.
 */
function parseBase64SessionData(sessionDataString) {
    // parse token, stripping whitespace.
    const secretB64Token = sessionDataString.replace(/\s/g, "");
    return JSON.parse(atob(secretB64Token));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvc2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFvREEsNENBRUM7QUFtTUQsMEJBcUJDO0FBT0QsNEJBV0M7QUE0QkQsd0RBSUM7QUEvVEQsb0NBQThDO0FBQzlDLG9DQUFzQztBQTJDdEM7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBb0I7SUFDbkQsT0FBTyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDakYsQ0FBQztBQWtDRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFhLHVCQUF1QjtJQUlsQzs7OztPQUlHO0lBQ0gsWUFBWSxPQUFvQjtRQVJoQyxvREFBMkI7UUFDM0IsaURBQWU7UUFRYixPQUFPLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEMsdUJBQUEsSUFBSSxxQ0FBYSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQUEsQ0FBQztRQUNuQyx1QkFBQSxJQUFJLGtDQUFVLE9BQU8sQ0FBQyxLQUFLLE1BQUEsQ0FBQztJQUM5QixDQUFDO0lBRUQscURBQXFEO0lBQ3JELEtBQUssQ0FBQyxRQUFRO1FBQ1osT0FBTyx1QkFBQSxJQUFJLHlDQUFVLENBQUM7SUFDeEIsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxLQUFLLENBQUMsS0FBSztRQUNULE9BQU8sdUJBQUEsSUFBSSxzQ0FBTyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQXhCRCwwREF3QkM7O0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBc0IsdUJBQXVCO0lBQTdDO1FBQ0UsNkZBQTZGO1FBQzdGLHNEQUFtQztJQTBEckMsQ0FBQztJQTdDQzs7O09BR0c7SUFDSCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFF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QyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7QUFEekMsUUFBQSxPQUFPLFdBQ2tDO0FBRS9DLE1BQU0sYUFBYSxHQUFHLENBQUMsT0FBb0IsRUFBVyxFQUFFLENBQzdELENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDO0lBQ2hFLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUY3QyxRQUFBLGFBQWEsaUJBRWdDO0FBRTFEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsU0FBZ0Isc0JBQXNCLENBQUMsaUJBQXlCO0lBQzlELHFDQUFxQztJQUNyQyxNQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQWdCLENBQUM7QUFDekQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uL2VudlwiO1xuaW1wb3J0IHsgYXBpRmV0Y2gsIGFzc2VydE9rIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyByZXRyeU9uNVhYIH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgdHlwZSB7IENsaWVudFNlc3Npb25JbmZvIH0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25MaWZldGltZSB7XG4gIC8qKiBTZXNzaW9uIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIHdlZWsgKDYwNDgwMCkuICovXG4gIHNlc3Npb24/OiBudW1iZXI7XG4gIC8qKiBBdXRoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gZml2ZSBtaW51dGVzICgzMDApLiAqL1xuICBhdXRoOiBudW1iZXI7XG4gIC8qKiBSZWZyZXNoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIGRheSAoODY0MDApLiAqL1xuICByZWZyZXNoPzogbnVtYmVyO1xuICAvKiogR3JhY2UgbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byAzMCBzZWNvbmRzICgzMCkuICovXG4gIGdyYWNlPzogbnVtYmVyO1xufVxuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ3ViZVNpZ25lciBzZXNzaW9uIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25EYXRhIHtcbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gSUQgKi9cbiAgb3JnX2lkOiBzdHJpbmc7XG4gIC8qKiBUaGUgcm9sZSBJRCAqL1xuICByb2xlX2lkPzogc3RyaW5nO1xuICAvKiogVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb24gdG9rZW4gKi9cbiAgcHVycG9zZT86IHN0cmluZztcbiAgLyoqIFRoZSB0b2tlbiB0byBpbmNsdWRlIGluIEF1dGhvcml6YXRpb24gaGVhZGVyICovXG4gIHRva2VuOiBzdHJpbmc7XG4gIC8qKiBUaGUgdG9rZW4gdG8gdXNlIHRvIHJlZnJlc2ggdGhlIHNlc3Npb24gKi9cbiAgcmVmcmVzaF90b2tlbjogc3RyaW5nO1xuICAvKiogU2Vzc2lvbiBpbmZvICovXG4gIHNlc3Npb25faW5mbzogQ2xpZW50U2Vzc2lvbkluZm87XG4gIC8qKiBTZXNzaW9uIGV4cGlyYXRpb24gKGluIHNlY29uZHMgc2luY2UgVU5JWCBlcG9jaCkgYmV5b25kIHdoaWNoIGl0IGNhbm5vdCBiZSByZWZyZXNoZWQgKi9cbiAgc2Vzc2lvbl9leHA6IG51bWJlciB8IHVuZGVmaW5lZDsgLy8gbWF5IGJlIG1pc3NpbmcgaW4gbGVnYWN5IHNlc3Npb24gZmlsZXNcbiAgLyoqIFRoZSBlbnZpcm9ubWVudCAqL1xuICBlbnY6IHtcbiAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBFbnZJbnRlcmZhY2U7XG4gIH07XG59XG5cbi8vIFJhdGhlciB0aGFuIGp1c3QgZG9pbmcgYSBzaW1wbGUgUGljaywgd2UgZ28gdGhlIGV4dHJhIG1pbGUgdG8gZW5zdXJlIHRoYXRcbi8vIGFueSBtZXRhZGF0YSBvYmplY3QgTVVTVCBORVZFUiBpbmNsdWRlIHNlbnNpdGl2ZSBpbmZvcm1hdGlvblxudHlwZSBTYWZlU2Vzc2lvbkRhdGFGaWVsZHMgPSBcImVudlwiIHwgXCJvcmdfaWRcIiB8IFwicm9sZV9pZFwiIHwgXCJwdXJwb3NlXCIgfCBcInNlc3Npb25fZXhwXCI7XG5cbi8qKiBSZXByZXNlbnRzIGVpdGhlciB0aGUgU2Vzc2lvbkRhdGEgb3IgYSBiYXNlNjQgSlNPTiBlbmNvZGluZyBvZiBpdCAqL1xuZXhwb3J0IHR5cGUgU2Vzc2lvbkxpa2UgPSBzdHJpbmcgfCBTZXNzaW9uRGF0YTtcblxuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgcGFyc2VzIGJhc2U2NCBlbmNvZGVkIFNlc3Npb25EYXRhLCBpZiBuZWNlc3NhcnkuXG4gKiBUaGlzIGFsbG93cyBTZXNzaW9uTWFuYWdlcnMgdG8gZWFzaWx5IGluZ2VzdCB0aGUgbXVsdGlwbGUgc3VwcG9ydGVkIGZvcm1hdHMgZm9yIHNlc3Npb25zLlxuICpcbiAqIEBwYXJhbSB7U2Vzc2lvbkxpa2V9IHNlc3Npb24gVGhlIHNlc3Npb24gb2JqZWN0IG9yIGVuY29kaW5nXG4gKiBAcmV0dXJuIHtTZXNzaW9uRGF0YX0gVGhlIHNlc3Npb24gb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlc3Npb25MaWtlKHNlc3Npb246IFNlc3Npb25MaWtlKSB7XG4gIHJldHVybiB0eXBlb2Ygc2Vzc2lvbiA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbikgOiBzZXNzaW9uO1xufVxuXG4vKiogTm9uLXNlbnNpdGl2ZSBpbmZvIGFib3V0IGEgc2Vzc2lvbiAqL1xuZXhwb3J0IHR5cGUgU2Vzc2lvbk1ldGFkYXRhID0gUGljazxTZXNzaW9uRGF0YSwgU2FmZVNlc3Npb25EYXRhRmllbGRzPiAmIHtcbiAgW0sgaW4gRXhjbHVkZTxrZXlvZiBTZXNzaW9uRGF0YSwgU2FmZVNlc3Npb25EYXRhRmllbGRzPl0/OiBuZXZlcjtcbn0gJiB7IHNlc3Npb25faWQ6IHN0cmluZzsgZXBvY2g6IG51bWJlciB9O1xuXG4vKipcbiAqIEEgU2Vzc2lvbk1hbmFnZXIncyBqb2IgaXMgdG8gaGFuZGxlIHNlc3Npb24gcGVyc2lzdGVuY2UgYW5kIHJlZnJlc2hlc1xuICpcbiAqIFRoZSBpbnRlcmZhY2UgZG9lcyBub3QgaW1wb3NlICp3aGVuKiBhIHJlZnJlc2ggbXVzdCBvY2N1ciwgdGhvdWdoIHR5cGljYWxseVxuICogdGhpcyB3aWxsIGJlIG9uIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbk1hbmFnZXIge1xuICAvKipcbiAgICogTG9hZCB0aGUgbWV0YWRhdGEgZm9yIHRoZSBzZXNzaW9uLiBTaG91bGQgdGhyb3cgaWYgbm90IGF2YWlsYWJsZVxuICAgKlxuICAgKiBAcmV0dXJuIHtTZXNzaW9uTWV0YWRhdGF9IEluZm8gYWJvdXQgdGhlIHNlc3Npb25cbiAgICpcbiAgICogQHRocm93cyB7Tm9TZXNzaW9uRm91bmRFcnJvcn0gSWYgdGhlIHNlc3Npb24gaXMgbm90IGF2YWlsYWJsZVxuICAgKi9cbiAgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+O1xuXG4gIC8qKlxuICAgKiBMb2FkIHRoZSB0b2tlbiB0byBiZSB1c2VkIGZvciBhIHJlcXVlc3QuIFRoaXMgd2lsbCBiZSBpbnZva2VkIGJ5IHRoZSBjbGllbnRcbiAgICogdG8gcHJvdmlkZSB0aGUgQXV0aG9yaXphdGlvbiBoZWFkZXJcbiAgICpcbiAgICogQHJldHVybiB7U2Vzc2lvbk1ldGFkYXRhfSBJbmZvIGFib3V0IHRoZSBzZXNzaW9uXG4gICAqXG4gICAqIEB0aHJvd3Mge05vU2Vzc2lvbkZvdW5kRXJyb3J9IElmIHRoZSBzZXNzaW9uIGlzIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPjtcbn1cblxuLyoqXG4gKiBBbGxvd3MgdGhlIGNvbnN0cnVjdGlvbiBvZiBjbGllbnRzIHdoaWNoIGRvIG5vdCBhdXRvbWF0aWNhbGx5IHJlZnJlc2hcbiAqIHNlc3Npb25zLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgbWFuYWdlciA9IG5ldyBOb1JlZnJlc2hTZXNzaW9uTWFuYWdlcihzZXNzaW9uRGF0YSk7XG4gKiBjb25zdCBjbGllbnQgPSBhd2FpdCBDdWJlU2lnbmVyQ2xpZW50LmNyZWF0ZShtYW5hZ2VyKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgTm9SZWZyZXNoU2Vzc2lvbk1hbmFnZXIgaW1wbGVtZW50cyBTZXNzaW9uTWFuYWdlciB7XG4gICNtZXRhZGF0YTogU2Vzc2lvbk1ldGFkYXRhO1xuICAjdG9rZW46IHN0cmluZztcblxuICAvKipcbiAgICogQ29uc3RydWN0cyB0aGUgbWFuYWdlciB3aXRoIHRoZSBzZXNzaW9uIGRhdGFcbiAgICpcbiAgICogQHBhcmFtIHtTZXNzaW9uTGlrZX0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBmb3IgdGhpcyBtYW5hZ2VyIHRvIHVzZVxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbjogU2Vzc2lvbkxpa2UpIHtcbiAgICBzZXNzaW9uID0gcGFyc2VTZXNzaW9uTGlrZShzZXNzaW9uKTtcbiAgICB0aGlzLiNtZXRhZGF0YSA9IG1ldGFkYXRhKHNlc3Npb24pO1xuICAgIHRoaXMuI3Rva2VuID0gc2Vzc2lvbi50b2tlbjtcbiAgfVxuXG4gIC8qKiBQcm92aWRlcyBub24tc2Vuc2l0aXZlIG1ldGFkYXRhIG9uIHRoZSBzZXNzaW9uICovXG4gIGFzeW5jIG1ldGFkYXRhKCkge1xuICAgIHJldHVybiB0aGlzLiNtZXRhZGF0YTtcbiAgfVxuXG4gIC8qKiBQcm92aWRlcyB0aGUgdG9rZW4gdG8gdXNlIGZvciByZXF1ZXN0cyAqL1xuICBhc3luYyB0b2tlbigpIHtcbiAgICByZXR1cm4gdGhpcy4jdG9rZW47XG4gIH1cbn1cblxuLyoqXG4gKiBBIHRlbXBsYXRlIGZvciBzZXNzaW9uIG1hbmFnZXJzIHdoaWNoIGhhdmUgZXhjbHVzaXZlIGFjY2VzcyB0byBhIHNlc3Npb25cbiAqIGFuZCBjYW4gc3RvcmUvbG9hZCB0aGVtIGZyZWVseS5cbiAqXG4gKiBJdCBpcyBOT1Qgc3VpdGFibGUgZm9yIGFwcGxpY2F0aW9ucyB3aGVyZSBtdWx0aXBsZSBjbGllbnRzIGFyZSB1c2luZyB0aGUgc2FtZVxuICogc2Vzc2lvbiBhcyB0aGV5IHdpbGwgYm90aCBhdHRlbXB0IHRvIHJlZnJlc2ggaW5kZXBlbmRlbnRseS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEV4Y2x1c2l2ZVNlc3Npb25NYW5hZ2VyIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXIge1xuICAvKiogSWYgcHJlc2VudCwgdGhlIHNlc3Npb24gaXMgY3VycmVudGx5IHJlZnJlc2hpbmcuIEF3YWl0IHRvIGdldCB0aGUgZnJlc2hlc3QgU2Vzc2lvbkRhdGEgKi9cbiAgI3JlZnJlc2hpbmc/OiBQcm9taXNlPFNlc3Npb25EYXRhPjtcblxuICAvKipcbiAgICogUmV0cmlldmUgdGhlIFNlc3Npb25EYXRhIGZyb20gc3RvcmFnZVxuICAgKi9cbiAgYWJzdHJhY3QgcmV0cmlldmUoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT47XG5cbiAgLyoqXG4gICAqIFN0b3JlIHRoZSBTZXNzaW9uRGF0YSBpbnRvIHN0b3JhZ2VcbiAgICogQHBhcmFtIGRhdGEgVGhlIGRhdGEgdG8gc3RvcmVcbiAgICovXG4gIGFic3RyYWN0IHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogTG9hZHMgdGhlIHNlc3Npb24gbWV0YWRhdGEgZnJvbSBzdG9yYWdlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2Vzc2lvbk1ldGFkYXRhPn1cbiAgICovXG4gIG1ldGFkYXRhKCk6IFByb21pc2U8U2Vzc2lvbk1ldGFkYXRhPiB7XG4gICAgcmV0dXJuIHRoaXMucmV0cmlldmUoKS50aGVuKG1ldGFkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgdG9rZW4gZnJvbSBzdG9yYWdlLCByZWZyZXNoaW5nIGlmIG5lY2Vzc2FyeVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNlc3Npb25NZXRhZGF0YT59XG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLnJldHJpZXZlKCk7XG5cbiAgICB0aGlzLiNyZWZyZXNoaW5nID8/PSByZWZyZXNoSWZOZWNlc3NhcnkoZGF0YSlcbiAgICAgID8udGhlbihhc3luYyAoZGF0YSkgPT4gKGF3YWl0IHRoaXMuc3RvcmUoZGF0YSksIGRhdGEpKVxuICAgICAgPy5maW5hbGx5KCgpID0+ICh0aGlzLiNyZWZyZXNoaW5nID0gdW5kZWZpbmVkKSk7XG5cbiAgICAvLyBUZWNobmljYWxseSwgaW4gbWFueSBjYXNlcyB3ZSBzaG91bGRuJ3QgaGF2ZSB0byB3YWl0IGZvciB0aGUgcmVmcmVzaCxcbiAgICAvLyB0aGUgc2Vzc2lvbiB3aWxsIHN0aWxsIGJlIHZhbGlkIGZvciBhIHdoaWxlIGFmdGVyIHRoZSByZWZyZXNoIHN0YXJ0cy5cbiAgICAvL1xuICAgIC8vIEhvd2V2ZXIsIHNvbWV0aW1lcyB0aGUgYXV0aCB0b2tlbiB3aWxsIGJlIGVudGlyZWx5IGV4cGlyZWQsIHNvIHdlIGNvbnNlcnZhdGl2ZWx5XG4gICAgLy8gd2FpdCBmb3IgYSBzdWNjZXNzZnVsIHJlZnJlc2hcbiAgICBjb25zdCBzZXNzaW9uID0gdGhpcy4jcmVmcmVzaGluZyA/IGF3YWl0IHRoaXMuI3JlZnJlc2hpbmcgOiBkYXRhO1xuICAgIHJldHVybiBzZXNzaW9uLnRva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hbnVhbGx5IGZvcmNlIGEgdG9rZW4gcmVmcmVzaFxuICAgKlxuICAgKiBAcmV0dXJuIHtTZXNzaW9uRGF0YX0gVGhlIG5ld2x5IHJlZnJlc2hlZCBzZXNzaW9uIGRhdGFcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBmb3JjZVJlZnJlc2goKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIC8vIElmIG5vdCBjdXJyZW50bHkgcmVmcmVzaGluZywgc3RhcnQgcmVmcmVzaGluZ1xuICAgIHRoaXMuI3JlZnJlc2hpbmcgPz89IHRoaXMucmV0cmlldmUoKVxuICAgICAgLnRoZW4ocmVmcmVzaClcbiAgICAgIC50aGVuKGFzeW5jIChkYXRhKSA9PiAoYXdhaXQgdGhpcy5zdG9yZShkYXRhKSwgZGF0YSkpXG4gICAgICAuZmluYWxseSgoKSA9PiAodGhpcy4jcmVmcmVzaGluZyA9IHVuZGVmaW5lZCkpO1xuXG4gICAgLy8gQmVjYXVzZSB3ZSA/Pz0gYXNzaWduZWQgdG8gcmVmcmVzaGluZyBhYm92ZSwgd2UncmUgZ3VhcmFudGVlZCB0byBiZVxuICAgIC8vIGFjdGl2ZWx5IHJlZnJlc2hpbmcsIHNvIGp1c3QgYXdhaXQgaXQuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3JlZnJlc2hpbmc7XG4gIH1cbn1cblxuLyoqIEltcGxlbWVudHMgYSBTZXNzaW9uTWFuYWdlciB3aXRob3V0IHBlcnNpc3RlbmNlICovXG5leHBvcnQgY2xhc3MgTWVtb3J5U2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciB7XG4gIC8qKiBUaGUgc2Vzc2lvbiBkYXRhIGNvbnRhaW5pbmcgYm90aCBtZXRhZGF0YSBhbmQgdG9rZW5zICovXG4gICNkYXRhOiBTZXNzaW9uRGF0YTtcblxuICAvKipcbiAgICogQ29uc3RydWN0IHdpdGggZGF0YSBpbiBtZW1vcnlcbiAgICogQHBhcmFtIHtTZXNzaW9uRGF0YX0gZGF0YSBUaGUgaW5pdGlhbCBzZXNzaW9uIGRhdGFcbiAgICovXG4gIGNvbnN0cnVjdG9yKGRhdGE6IFNlc3Npb25EYXRhKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gdGhlIGluLW1lbW9yeSBkYXRhICovXG4gIGFzeW5jIHJldHJpZXZlKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgaW4tbWVtb3J5IGRhdGFcbiAgICogQHBhcmFtIHtTZXNzaW9uRGF0YX0gZGF0YSBUaGUgc2Vzc2lvbiBkYXRhIHRvIHN0b3JlXG4gICAqL1xuICBhc3luYyBzdG9yZShkYXRhOiBTZXNzaW9uRGF0YSkge1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKiBBbiBlcnJvciB0eXBlIHRvIGJlIHRocm93biBieSBTZXNzaW9uTWFuYWdlcidzIHdoZW4gdGhlIHNlc3Npb24gaXMgdW5hdmFpbGFibGUgKi9cbmV4cG9ydCBjbGFzcyBOb1Nlc3Npb25Gb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKiogQ29uc3RydWN0cyB0aGUgZXJyb3Igd2l0aCB0aGUgYXBwcm9wcmlhdGUgbWVzc2FnZSAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIk5vIHNlc3Npb24gYXZhaWxhYmxlIGZvciB0aGUgY2xpZW50XCIpO1xuICB9XG59XG5cbi8qKiBUaGUgbnVtYmVyIG9mIHNlY29uZHMgYmVmb3JlIGV4cGlyYXRpb24gdGltZSwgdG8gYXR0ZW1wdCBhIHJlZnJlc2ggKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1MgPSAzMDtcblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCByZWZyZXNoZXMgYSBzZXNzaW9uIHVzaW5nIHRoZSBDdWJlU2lnbmVyIEFQSSBpZiBpdCBpcyBjbG9zZVxuICogdG8gZXhwaXJpbmcuXG4gKlxuICogQHBhcmFtIHtTZXNzaW9uRGF0YX0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBkYXRhIHdoaWNoIG1heSByZXF1aXJlIGEgcmVmcmVzaFxuICogQHJldHVybiB7dW5kZWZpbmVkIHwgUHJvbWlzZTxTZXNzaW9uRGF0YT59IEltbWVkaWF0ZWx5IHJldHVybnMgdW5kZWZpbmVkIGlmIHRoZSBzZXNzaW9uIGRvZXMgbm90IHJlcXVpcmUgYSByZWZyZXNoXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hJZk5lY2Vzc2FyeShzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IHVuZGVmaW5lZCB8IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgaWYgKCFpc1N0YWxlKHNlc3Npb24pKSByZXR1cm47XG4gIHJldHVybiByZWZyZXNoKHNlc3Npb24pO1xufVxuXG4vKipcbiAqIEludm9rZXMgdGhlIEN1YmVTaWduZXIgQVBJIHRvIHJlZnJlc2ggYSBzZXNzaW9uXG4gKiBAcGFyYW0ge1Nlc3Npb25EYXRhfSBzZXNzaW9uXG4gKiBAcmV0dXJuIHtTZXNzaW9uRGF0YX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2goc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gIGNvbnN0IHsgZXBvY2g6IGVwb2NoX251bSwgZXBvY2hfdG9rZW4sIHJlZnJlc2hfdG9rZW46IG90aGVyX3Rva2VuIH0gPSBzZXNzaW9uLnNlc3Npb25faW5mbztcbiAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICBhcGlGZXRjaChcIi92MS9vcmcve29yZ19pZH0vdG9rZW4vcmVmcmVzaFwiLCBcInBhdGNoXCIsIHtcbiAgICAgIGJhc2VVcmw6IHNlc3Npb24uZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXS5TaWduZXJBcGlSb290LnJlcGxhY2UoL1xcLyQvLCBcIlwiKSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgb3JnX2lkOiBzZXNzaW9uLm9yZ19pZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IHNlc3Npb24udG9rZW4sXG4gICAgICB9LFxuICAgICAgYm9keTogeyBlcG9jaF9udW0sIGVwb2NoX3Rva2VuLCBvdGhlcl90b2tlbiB9LFxuICAgIH0pLFxuICApXG4gICAgLnRoZW4oYXNzZXJ0T2spXG4gICAgLnRoZW4oKHJlcykgPT4gKHtcbiAgICAgIC4uLnNlc3Npb24sXG4gICAgICAuLi5yZXMsXG4gICAgfSkpO1xufVxuXG4vKipcbiAqIEdldCB0aGUgc2FmZSBtZXRhZGF0YSBmcm9tIGEgU2Vzc2lvbkRhdGFcbiAqIEBwYXJhbSB7U2Vzc2lvbkRhdGF9IHNlc3Npb24gVGhlIHNlc3Npb25cbiAqIEByZXR1cm4ge1Nlc3Npb25NZXRhZGF0YX0gVGhlIHNlc3Npb24gbWV0YWRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ldGFkYXRhKHNlc3Npb246IFNlc3Npb25EYXRhKTogU2Vzc2lvbk1ldGFkYXRhIHtcbiAgY29uc3QgeyBlbnYsIG9yZ19pZCwgcm9sZV9pZCwgcHVycG9zZSwgc2Vzc2lvbl9leHAgfSA9IHNlc3Npb247XG4gIHJldHVybiB7XG4gICAgZW52LFxuICAgIG9yZ19pZCxcbiAgICByb2xlX2lkLFxuICAgIHB1cnBvc2UsXG4gICAgc2Vzc2lvbl9pZDogc2Vzc2lvbi5zZXNzaW9uX2luZm8uc2Vzc2lvbl9pZCxcbiAgICBzZXNzaW9uX2V4cCxcbiAgICBlcG9jaDogc2Vzc2lvbi5zZXNzaW9uX2luZm8uZXBvY2gsXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVJblNlY29uZHMgYW4gZXBvY2ggdGltZXN0YW1wXG4gKiBAcmV0dXJuIHtib29sfSB3aGV0aGVyIG9yIG5vdCB0aGUgdGltZXN0YW1wIGlzIGJlZm9yZSBub3cgKyBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1NcbiAqL1xuY29uc3QgaXNXaXRoaW5CdWZmZXIgPSAodGltZUluU2Vjb25kczogbnVtYmVyKSA9PlxuICB0aW1lSW5TZWNvbmRzIDwgRGF0ZS5ub3coKSAvIDEwMDAgKyBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1M7XG5cbmV4cG9ydCBjb25zdCBpc1N0YWxlID0gKHNlc3Npb246IFNlc3Npb25EYXRhKTogYm9vbGVhbiA9PlxuICBpc1dpdGhpbkJ1ZmZlcihzZXNzaW9uLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cCk7XG5cbmV4cG9ydCBjb25zdCBpc1JlZnJlc2hhYmxlID0gKHNlc3Npb246IFNlc3Npb25EYXRhKTogYm9vbGVhbiA9PlxuICAhaXNXaXRoaW5CdWZmZXIoc2Vzc2lvbi5zZXNzaW9uX2V4cCA/PyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpICYmXG4gICFpc1dpdGhpbkJ1ZmZlcihzZXNzaW9uLnNlc3Npb25faW5mby5yZWZyZXNoX3Rva2VuX2V4cCk7XG5cbi8qKlxuICogUGFyc2VzIHRoZSBiYXNlNjQgQVBJIHNlc3Npb24gdG9rZW4uXG4gKiBDb25zdW1lcyB0aGUgb3V0cHV0IG9mIHRoZSBjbGkgY29tbWFuZDpcbiAqXG4gKiBgYGBcbiAqIGNzIHRva2VuIGNyZWF0ZSAtLW91dHB1dCBiYXNlNjRcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZXNzaW9uRGF0YVN0cmluZyBCYXNlNjQgZW5jb2RlZCBBUEkgc2Vzc2lvbiB0b2tlbi5cbiAqXG4gKiBAcmV0dXJuIHtTaWduZXJTZXNzaW9uRGF0YX0gc2Vzc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbkRhdGFTdHJpbmc6IHN0cmluZyk6IFNlc3Npb25EYXRhIHtcbiAgLy8gcGFyc2UgdG9rZW4sIHN0cmlwcGluZyB3aGl0ZXNwYWNlLlxuICBjb25zdCBzZWNyZXRCNjRUb2tlbiA9IHNlc3Npb25EYXRhU3RyaW5nLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgcmV0dXJuIEpTT04ucGFyc2UoYXRvYihzZWNyZXRCNjRUb2tlbikpIGFzIFNlc3Npb25EYXRhO1xufVxuIl19