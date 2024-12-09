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
exports.serializeBase64SessionData = serializeBase64SessionData;
const fetch_1 = require("../fetch");
const retry_1 = require("../retry");
/**
 * Utility function that parses base64 encoded SessionData, if necessary.
 * This allows SessionManagers to easily ingest the multiple supported formats for sessions.
 *
 * @param session The session object or encoding
 * @returns The session object
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
     * @param session The session for this manager to use
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
     *
     * @returns
     */
    metadata() {
        return this.retrieve().then(metadata);
    }
    /**
     * Loads the token from storage, refreshing if necessary
     *
     * @returns
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
     * @returns The newly refreshed session data
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
     *
     * @param data The initial session data
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
     *
     * @param data The session data to store
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
 * @param session The session data which may require a refresh
 * @returns Immediately returns undefined if the session does not require a refresh, else return a refreshed session
 */
function refreshIfNecessary(session) {
    if (!(0, exports.isStale)(session))
        return;
    return refresh(session);
}
/**
 * Invokes the CubeSigner API to refresh a session
 *
 * @param session
 * @returns
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
 *
 * @param session The session
 * @returns The session metadata
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
 * @param timeInSeconds an epoch timestamp
 * @returns whether or not the timestamp is before now + DEFAULT_EXPIRATION_BUFFER_SECS
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
 * @param sessionDataString Base64 encoded API session token.
 *
 * @returns session.
 */
function parseBase64SessionData(sessionDataString) {
    // parse token, stripping whitespace.
    const secretB64Token = sessionDataString.replace(/\s/g, "");
    const data = JSON.parse(atob(secretB64Token));
    // Basic validation of the session data (i.e., most types of top level fields)
    if (!data) {
        throw new Error("Session is undefined");
    }
    if (typeof data !== "object") {
        throw new Error("Expected session to be an object");
    }
    for (const field of ["org_id", "token"]) {
        const fieldType = typeof data[field];
        if (fieldType !== "string") {
            throw new Error(`Expected ${field} to be a string, got ${fieldType}`);
        }
    }
    for (const field of ["role_id", "purpose", "refresh_token"]) {
        const fieldType = typeof data[field];
        if (fieldType !== "string" && data[field] !== undefined && data[field] !== null) {
            throw new Error(`Expected ${field} to be a string or undefined, got ${fieldType}`);
        }
    }
    for (const field of ["session_info", "env"]) {
        const fieldType = typeof data[field];
        if (fieldType !== "object") {
            throw new Error(`Expected ${field} to be an object, got ${fieldType}`);
        }
    }
    return data;
}
/**
 * Serializes session data to base64.
 *
 * @param session The session data to serialize
 * @returns The serialized data
 */
function serializeBase64SessionData(session) {
    return btoa(JSON.stringify(session));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvc2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFvREEsNENBRUM7QUE0TUQsMEJBcUJDO0FBUUQsNEJBV0M7QUE0QkQsd0RBK0JDO0FBUUQsZ0VBRUM7QUE5V0Qsb0NBQThDO0FBQzlDLG9DQUFzQztBQTJDdEM7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBb0I7SUFDbkQsT0FBTyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDakYsQ0FBQztBQXFDRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFhLHVCQUF1QjtJQUlsQzs7OztPQUlHO0lBQ0gsWUFBWSxPQUFvQjtRQVJoQyxvREFBMkI7UUFDM0IsaURBQWU7UUFRYixPQUFPLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEMsdUJBQUEsSUFBSSxxQ0FBYSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQUEsQ0FBQztRQUNuQyx1QkFBQSxJQUFJLGtDQUFVLE9BQU8sQ0FBQyxLQUFLLE1BQUEsQ0FBQztJQUM5QixDQUFDO0lBRUQscURBQXFEO0lBQ3JELEtBQUssQ0FBQyxRQUFRO1FBQ1osT0FBTyx1QkFBQSxJQUFJLHlDQUFVLENBQUM7SUFDeEIsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxLQUFLLENBQUMsS0FBSztRQUNULE9BQU8sdUJBQUEsSUFBSSxzQ0FBTyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQXhCRCwwREF3QkM7O0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBc0IsdUJBQXVCO0lBQTdDO1FBQ0UsNkZBQTZGO1FBQzdGLHNEQUFtQztJQTZEckMsQ0FBQztJQS9DQzs7OztPQUlHO0lBQ0gsUUFBUTtRQUNOLE9BQU8sSUFBSSxD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QUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBQyxFQUFFLENBQUM7UUFDNUQsTUFBTSxTQUFTLEdBQUcsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsSUFBSSxTQUFTLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ2hGLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxLQUFLLHFDQUFxQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7SUFDSCxDQUFDO0lBQ0QsS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzVDLE1BQU0sU0FBUyxHQUFHLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLElBQUksU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxLQUFLLHlCQUF5QixTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxJQUFtQixDQUFDO0FBQzdCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLDBCQUEwQixDQUFDLE9BQW9CO0lBQzdELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5pbXBvcnQgeyBhcGlGZXRjaCwgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IHJldHJ5T241WFggfSBmcm9tIFwiLi4vcmV0cnlcIjtcbmltcG9ydCB0eXBlIHsgQ2xpZW50U2Vzc2lvbkluZm8gfSBmcm9tIFwiLi4vc2NoZW1hX3R5cGVzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbkxpZmV0aW1lIHtcbiAgLyoqIFNlc3Npb24gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgd2VlayAoNjA0ODAwKS4gKi9cbiAgc2Vzc2lvbj86IG51bWJlcjtcbiAgLyoqIEF1dGggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBmaXZlIG1pbnV0ZXMgKDMwMCkuICovXG4gIGF1dGg/OiBudW1iZXI7XG4gIC8qKiBSZWZyZXNoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIGRheSAoODY0MDApLiAqL1xuICByZWZyZXNoPzogbnVtYmVyO1xuICAvKiogR3JhY2UgbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byAzMCBzZWNvbmRzICgzMCkuICovXG4gIGdyYWNlPzogbnVtYmVyO1xufVxuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ3ViZVNpZ25lciBzZXNzaW9uIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25EYXRhIHtcbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gSUQgKi9cbiAgb3JnX2lkOiBzdHJpbmc7XG4gIC8qKiBUaGUgcm9sZSBJRCAqL1xuICByb2xlX2lkPzogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uIHRva2VuICovXG4gIHB1cnBvc2U/OiBzdHJpbmcgfCBudWxsO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFRoZSB0b2tlbiB0byB1c2UgdG8gcmVmcmVzaCB0aGUgc2Vzc2lvbiAqL1xuICByZWZyZXNoX3Rva2VuOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICAvKiogU2Vzc2lvbiBpbmZvICovXG4gIHNlc3Npb25faW5mbzogQ2xpZW50U2Vzc2lvbkluZm87XG4gIC8qKiBTZXNzaW9uIGV4cGlyYXRpb24gKGluIHNlY29uZHMgc2luY2UgVU5JWCBlcG9jaCkgYmV5b25kIHdoaWNoIGl0IGNhbm5vdCBiZSByZWZyZXNoZWQgKi9cbiAgc2Vzc2lvbl9leHA6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQ7IC8vIG1heSBiZSBtaXNzaW5nIGluIGxlZ2FjeSBzZXNzaW9uIGZpbGVzXG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgKi9cbiAgZW52OiB7XG4gICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogRW52SW50ZXJmYWNlO1xuICB9O1xufVxuXG4vLyBSYXRoZXIgdGhhbiBqdXN0IGRvaW5nIGEgc2ltcGxlIFBpY2ssIHdlIGdvIHRoZSBleHRyYSBtaWxlIHRvIGVuc3VyZSB0aGF0XG4vLyBhbnkgbWV0YWRhdGEgb2JqZWN0IE1VU1QgTkVWRVIgaW5jbHVkZSBzZW5zaXRpdmUgaW5mb3JtYXRpb25cbnR5cGUgU2FmZVNlc3Npb25EYXRhRmllbGRzID0gXCJlbnZcIiB8IFwib3JnX2lkXCIgfCBcInJvbGVfaWRcIiB8IFwicHVycG9zZVwiIHwgXCJzZXNzaW9uX2V4cFwiO1xuXG4vKiogUmVwcmVzZW50cyBlaXRoZXIgdGhlIFNlc3Npb25EYXRhIG9yIGEgYmFzZTY0IEpTT04gZW5jb2Rpbmcgb2YgaXQgKi9cbmV4cG9ydCB0eXBlIFNlc3Npb25MaWtlID0gc3RyaW5nIHwgU2Vzc2lvbkRhdGE7XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0aGF0IHBhcnNlcyBiYXNlNjQgZW5jb2RlZCBTZXNzaW9uRGF0YSwgaWYgbmVjZXNzYXJ5LlxuICogVGhpcyBhbGxvd3MgU2Vzc2lvbk1hbmFnZXJzIHRvIGVhc2lseSBpbmdlc3QgdGhlIG11bHRpcGxlIHN1cHBvcnRlZCBmb3JtYXRzIGZvciBzZXNzaW9ucy5cbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBvYmplY3Qgb3IgZW5jb2RpbmdcbiAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZXNzaW9uTGlrZShzZXNzaW9uOiBTZXNzaW9uTGlrZSkge1xuICByZXR1cm4gdHlwZW9mIHNlc3Npb24gPT09IFwic3RyaW5nXCIgPyBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb24pIDogc2Vzc2lvbjtcbn1cblxuLyoqIE5vbi1zZW5zaXRpdmUgaW5mbyBhYm91dCBhIHNlc3Npb24gKi9cbmV4cG9ydCB0eXBlIFNlc3Npb25NZXRhZGF0YSA9IFBpY2s8U2Vzc2lvbkRhdGEsIFNhZmVTZXNzaW9uRGF0YUZpZWxkcz4gJiB7XG4gIFtLIGluIEV4Y2x1ZGU8a2V5b2YgU2Vzc2lvbkRhdGEsIFNhZmVTZXNzaW9uRGF0YUZpZWxkcz5dPzogbmV2ZXI7XG59ICYgeyBzZXNzaW9uX2lkOiBzdHJpbmc7IGVwb2NoOiBudW1iZXIgfTtcblxuLyoqXG4gKiBBIFNlc3Npb25NYW5hZ2VyJ3Mgam9iIGlzIHRvIGhhbmRsZSBzZXNzaW9uIHBlcnNpc3RlbmNlIGFuZCByZWZyZXNoZXNcbiAqXG4gKiBUaGUgaW50ZXJmYWNlIGRvZXMgbm90IGltcG9zZSAqd2hlbiogYSByZWZyZXNoIG11c3Qgb2NjdXIsIHRob3VnaCB0eXBpY2FsbHlcbiAqIHRoaXMgd2lsbCBiZSBvbiByZXF1ZXN0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25NYW5hZ2VyIHtcbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBpZiBhIHJlcXVlc3QgZmFpbGVkIGR1ZSB0byBhbiBpbnZhbGlkIHRva2VuLlxuICAgKi9cbiAgb25JbnZhbGlkVG9rZW4/OiAoKSA9PiB2b2lkO1xuXG4gIC8qKlxuICAgKiBMb2FkIHRoZSBtZXRhZGF0YSBmb3IgdGhlIHNlc3Npb24uIFNob3VsZCB0aHJvdyBpZiBub3QgYXZhaWxhYmxlXG4gICAqXG4gICAqIEByZXR1cm5zIEluZm8gYWJvdXQgdGhlIHNlc3Npb25cbiAgICpcbiAgICogQHRocm93cyB7Tm9TZXNzaW9uRm91bmRFcnJvcn0gSWYgdGhlIHNlc3Npb24gaXMgbm90IGF2YWlsYWJsZVxuICAgKi9cbiAgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+O1xuXG4gIC8qKlxuICAgKiBMb2FkIHRoZSB0b2tlbiB0byBiZSB1c2VkIGZvciBhIHJlcXVlc3QuIFRoaXMgd2lsbCBiZSBpbnZva2VkIGJ5IHRoZSBjbGllbnRcbiAgICogdG8gcHJvdmlkZSB0aGUgQXV0aG9yaXphdGlvbiBoZWFkZXJcbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRva2VuXG4gICAqL1xuICB0b2tlbigpOiBQcm9taXNlPHN0cmluZz47XG59XG5cbi8qKlxuICogQWxsb3dzIHRoZSBjb25zdHJ1Y3Rpb24gb2YgY2xpZW50cyB3aGljaCBkbyBub3QgYXV0b21hdGljYWxseSByZWZyZXNoXG4gKiBzZXNzaW9ucy5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IG1hbmFnZXIgPSBuZXcgTm9SZWZyZXNoU2Vzc2lvbk1hbmFnZXIoc2Vzc2lvbkRhdGEpO1xuICogY29uc3QgY2xpZW50ID0gYXdhaXQgQ3ViZVNpZ25lckNsaWVudC5jcmVhdGUobWFuYWdlcik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIE5vUmVmcmVzaFNlc3Npb25NYW5hZ2VyIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXIge1xuICAjbWV0YWRhdGE6IFNlc3Npb25NZXRhZGF0YTtcbiAgI3Rva2VuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgdGhlIG1hbmFnZXIgd2l0aCB0aGUgc2Vzc2lvbiBkYXRhXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIGZvciB0aGlzIG1hbmFnZXIgdG8gdXNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uOiBTZXNzaW9uTGlrZSkge1xuICAgIHNlc3Npb24gPSBwYXJzZVNlc3Npb25MaWtlKHNlc3Npb24pO1xuICAgIHRoaXMuI21ldGFkYXRhID0gbWV0YWRhdGEoc2Vzc2lvbik7XG4gICAgdGhpcy4jdG9rZW4gPSBzZXNzaW9uLnRva2VuO1xuICB9XG5cbiAgLyoqIFByb3ZpZGVzIG5vbi1zZW5zaXRpdmUgbWV0YWRhdGEgb24gdGhlIHNlc3Npb24gKi9cbiAgYXN5bmMgbWV0YWRhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuI21ldGFkYXRhO1xuICB9XG5cbiAgLyoqIFByb3ZpZGVzIHRoZSB0b2tlbiB0byB1c2UgZm9yIHJlcXVlc3RzICovXG4gIGFzeW5jIHRva2VuKCkge1xuICAgIHJldHVybiB0aGlzLiN0b2tlbjtcbiAgfVxufVxuXG4vKipcbiAqIEEgdGVtcGxhdGUgZm9yIHNlc3Npb24gbWFuYWdlcnMgd2hpY2ggaGF2ZSBleGNsdXNpdmUgYWNjZXNzIHRvIGEgc2Vzc2lvblxuICogYW5kIGNhbiBzdG9yZS9sb2FkIHRoZW0gZnJlZWx5LlxuICpcbiAqIEl0IGlzIE5PVCBzdWl0YWJsZSBmb3IgYXBwbGljYXRpb25zIHdoZXJlIG11bHRpcGxlIGNsaWVudHMgYXJlIHVzaW5nIHRoZSBzYW1lXG4gKiBzZXNzaW9uIGFzIHRoZXkgd2lsbCBib3RoIGF0dGVtcHQgdG8gcmVmcmVzaCBpbmRlcGVuZGVudGx5LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRXhjbHVzaXZlU2Vzc2lvbk1hbmFnZXIgaW1wbGVtZW50cyBTZXNzaW9uTWFuYWdlciB7XG4gIC8qKiBJZiBwcmVzZW50LCB0aGUgc2Vzc2lvbiBpcyBjdXJyZW50bHkgcmVmcmVzaGluZy4gQXdhaXQgdG8gZ2V0IHRoZSBmcmVzaGVzdCBTZXNzaW9uRGF0YSAqL1xuICAjcmVmcmVzaGluZz86IFByb21pc2U8U2Vzc2lvbkRhdGE+O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSB0aGUgU2Vzc2lvbkRhdGEgZnJvbSBzdG9yYWdlXG4gICAqL1xuICBhYnN0cmFjdCByZXRyaWV2ZSgpOiBQcm9taXNlPFNlc3Npb25EYXRhPjtcblxuICAvKipcbiAgICogU3RvcmUgdGhlIFNlc3Npb25EYXRhIGludG8gc3RvcmFnZVxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgZGF0YSB0byBzdG9yZVxuICAgKi9cbiAgYWJzdHJhY3Qgc3RvcmUoZGF0YTogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgc2Vzc2lvbiBtZXRhZGF0YSBmcm9tIHN0b3JhZ2VcbiAgICpcbiAgICogQHJldHVybnNcbiAgICovXG4gIG1ldGFkYXRhKCk6IFByb21pc2U8U2Vzc2lvbk1ldGFkYXRhPiB7XG4gICAgcmV0dXJuIHRoaXMucmV0cmlldmUoKS50aGVuKG1ldGFkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgdG9rZW4gZnJvbSBzdG9yYWdlLCByZWZyZXNoaW5nIGlmIG5lY2Vzc2FyeVxuICAgKlxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5yZXRyaWV2ZSgpO1xuXG4gICAgdGhpcy4jcmVmcmVzaGluZyA/Pz0gcmVmcmVzaElmTmVjZXNzYXJ5KGRhdGEpXG4gICAgICA/LnRoZW4oYXN5bmMgKGRhdGEpID0+IChhd2FpdCB0aGlzLnN0b3JlKGRhdGEpLCBkYXRhKSlcbiAgICAgID8uZmluYWxseSgoKSA9PiAodGhpcy4jcmVmcmVzaGluZyA9IHVuZGVmaW5lZCkpO1xuXG4gICAgLy8gVGVjaG5pY2FsbHksIGluIG1hbnkgY2FzZXMgd2Ugc2hvdWxkbid0IGhhdmUgdG8gd2FpdCBmb3IgdGhlIHJlZnJlc2gsXG4gICAgLy8gdGhlIHNlc3Npb24gd2lsbCBzdGlsbCBiZSB2YWxpZCBmb3IgYSB3aGlsZSBhZnRlciB0aGUgcmVmcmVzaCBzdGFydHMuXG4gICAgLy9cbiAgICAvLyBIb3dldmVyLCBzb21ldGltZXMgdGhlIGF1dGggdG9rZW4gd2lsbCBiZSBlbnRpcmVseSBleHBpcmVkLCBzbyB3ZSBjb25zZXJ2YXRpdmVseVxuICAgIC8vIHdhaXQgZm9yIGEgc3VjY2Vzc2Z1bCByZWZyZXNoXG4gICAgY29uc3Qgc2Vzc2lvbiA9IHRoaXMuI3JlZnJlc2hpbmcgPyBhd2FpdCB0aGlzLiNyZWZyZXNoaW5nIDogZGF0YTtcbiAgICByZXR1cm4gc2Vzc2lvbi50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYW51YWxseSBmb3JjZSBhIHRva2VuIHJlZnJlc2hcbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IHJlZnJlc2hlZCBzZXNzaW9uIGRhdGFcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBmb3JjZVJlZnJlc2goKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIC8vIElmIG5vdCBjdXJyZW50bHkgcmVmcmVzaGluZywgc3RhcnQgcmVmcmVzaGluZ1xuICAgIHRoaXMuI3JlZnJlc2hpbmcgPz89IHRoaXMucmV0cmlldmUoKVxuICAgICAgLnRoZW4ocmVmcmVzaClcbiAgICAgIC50aGVuKGFzeW5jIChkYXRhKSA9PiAoYXdhaXQgdGhpcy5zdG9yZShkYXRhKSwgZGF0YSkpXG4gICAgICAuZmluYWxseSgoKSA9PiAodGhpcy4jcmVmcmVzaGluZyA9IHVuZGVmaW5lZCkpO1xuXG4gICAgLy8gQmVjYXVzZSB3ZSA/Pz0gYXNzaWduZWQgdG8gcmVmcmVzaGluZyBhYm92ZSwgd2UncmUgZ3VhcmFudGVlZCB0byBiZVxuICAgIC8vIGFjdGl2ZWx5IHJlZnJlc2hpbmcsIHNvIGp1c3QgYXdhaXQgaXQuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3JlZnJlc2hpbmc7XG4gIH1cbn1cblxuLyoqIEltcGxlbWVudHMgYSBTZXNzaW9uTWFuYWdlciB3aXRob3V0IHBlcnNpc3RlbmNlICovXG5leHBvcnQgY2xhc3MgTWVtb3J5U2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciB7XG4gIC8qKiBUaGUgc2Vzc2lvbiBkYXRhIGNvbnRhaW5pbmcgYm90aCBtZXRhZGF0YSBhbmQgdG9rZW5zICovXG4gICNkYXRhOiBTZXNzaW9uRGF0YTtcblxuICAvKipcbiAgICogQ29uc3RydWN0IHdpdGggZGF0YSBpbiBtZW1vcnlcbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIGluaXRpYWwgc2Vzc2lvbiBkYXRhXG4gICAqL1xuICBjb25zdHJ1Y3RvcihkYXRhOiBTZXNzaW9uRGF0YSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKiogUmV0dXJuIHRoZSBpbi1tZW1vcnkgZGF0YSAqL1xuICBhc3luYyByZXRyaWV2ZSgpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogU3RvcmUgdGhlIGluLW1lbW9yeSBkYXRhXG4gICAqXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBzZXNzaW9uIGRhdGEgdG8gc3RvcmVcbiAgICovXG4gIGFzeW5jIHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKSB7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqIEFuIGVycm9yIHR5cGUgdG8gYmUgdGhyb3duIGJ5IFNlc3Npb25NYW5hZ2VyJ3Mgd2hlbiB0aGUgc2Vzc2lvbiBpcyB1bmF2YWlsYWJsZSAqL1xuZXhwb3J0IGNsYXNzIE5vU2Vzc2lvbkZvdW5kRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBDb25zdHJ1Y3RzIHRoZSBlcnJvciB3aXRoIHRoZSBhcHByb3ByaWF0ZSBtZXNzYWdlICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiTm8gc2Vzc2lvbiBhdmFpbGFibGUgZm9yIHRoZSBjbGllbnRcIik7XG4gIH1cbn1cblxuLyoqIFRoZSBudW1iZXIgb2Ygc2Vjb25kcyBiZWZvcmUgZXhwaXJhdGlvbiB0aW1lLCB0byBhdHRlbXB0IGEgcmVmcmVzaCAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDUyA9IDMwO1xuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IHJlZnJlc2hlcyBhIHNlc3Npb24gdXNpbmcgdGhlIEN1YmVTaWduZXIgQVBJIGlmIGl0IGlzIGNsb3NlXG4gKiB0byBleHBpcmluZy5cbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBkYXRhIHdoaWNoIG1heSByZXF1aXJlIGEgcmVmcmVzaFxuICogQHJldHVybnMgSW1tZWRpYXRlbHkgcmV0dXJucyB1bmRlZmluZWQgaWYgdGhlIHNlc3Npb24gZG9lcyBub3QgcmVxdWlyZSBhIHJlZnJlc2gsIGVsc2UgcmV0dXJuIGEgcmVmcmVzaGVkIHNlc3Npb25cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaElmTmVjZXNzYXJ5KHNlc3Npb246IFNlc3Npb25EYXRhKTogdW5kZWZpbmVkIHwgUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICBpZiAoIWlzU3RhbGUoc2Vzc2lvbikpIHJldHVybjtcbiAgcmV0dXJuIHJlZnJlc2goc2Vzc2lvbik7XG59XG5cbi8qKlxuICogSW52b2tlcyB0aGUgQ3ViZVNpZ25lciBBUEkgdG8gcmVmcmVzaCBhIHNlc3Npb25cbiAqXG4gKiBAcGFyYW0gc2Vzc2lvblxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2goc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gIGNvbnN0IHsgZXBvY2g6IGVwb2NoX251bSwgZXBvY2hfdG9rZW4sIHJlZnJlc2hfdG9rZW46IG90aGVyX3Rva2VuIH0gPSBzZXNzaW9uLnNlc3Npb25faW5mbztcbiAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICBhcGlGZXRjaChcIi92MS9vcmcve29yZ19pZH0vdG9rZW4vcmVmcmVzaFwiLCBcInBhdGNoXCIsIHtcbiAgICAgIGJhc2VVcmw6IHNlc3Npb24uZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXS5TaWduZXJBcGlSb290LnJlcGxhY2UoL1xcLyQvLCBcIlwiKSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgb3JnX2lkOiBzZXNzaW9uLm9yZ19pZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IHNlc3Npb24udG9rZW4sXG4gICAgICB9LFxuICAgICAgYm9keTogeyBlcG9jaF9udW0sIGVwb2NoX3Rva2VuLCBvdGhlcl90b2tlbiB9LFxuICAgIH0pLFxuICApXG4gICAgLnRoZW4oYXNzZXJ0T2spXG4gICAgLnRoZW4oKHJlcykgPT4gKHtcbiAgICAgIC4uLnNlc3Npb24sXG4gICAgICAuLi5yZXMsXG4gICAgfSkpO1xufVxuXG4vKipcbiAqIEdldCB0aGUgc2FmZSBtZXRhZGF0YSBmcm9tIGEgU2Vzc2lvbkRhdGFcbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvblxuICogQHJldHVybnMgVGhlIHNlc3Npb24gbWV0YWRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ldGFkYXRhKHNlc3Npb246IFNlc3Npb25EYXRhKTogU2Vzc2lvbk1ldGFkYXRhIHtcbiAgY29uc3QgeyBlbnYsIG9yZ19pZCwgcm9sZV9pZCwgcHVycG9zZSwgc2Vzc2lvbl9leHAgfSA9IHNlc3Npb247XG4gIHJldHVybiB7XG4gICAgZW52LFxuICAgIG9yZ19pZCxcbiAgICByb2xlX2lkLFxuICAgIHB1cnBvc2UsXG4gICAgc2Vzc2lvbl9pZDogc2Vzc2lvbi5zZXNzaW9uX2luZm8uc2Vzc2lvbl9pZCxcbiAgICBzZXNzaW9uX2V4cCxcbiAgICBlcG9jaDogc2Vzc2lvbi5zZXNzaW9uX2luZm8uZXBvY2gsXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHRpbWVJblNlY29uZHMgYW4gZXBvY2ggdGltZXN0YW1wXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdGltZXN0YW1wIGlzIGJlZm9yZSBub3cgKyBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1NcbiAqL1xuY29uc3QgaXNXaXRoaW5CdWZmZXIgPSAodGltZUluU2Vjb25kczogbnVtYmVyKSA9PlxuICB0aW1lSW5TZWNvbmRzIDwgRGF0ZS5ub3coKSAvIDEwMDAgKyBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1M7XG5cbmV4cG9ydCBjb25zdCBpc1N0YWxlID0gKHNlc3Npb246IFNlc3Npb25EYXRhKTogYm9vbGVhbiA9PlxuICBpc1dpdGhpbkJ1ZmZlcihzZXNzaW9uLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cCk7XG5cbmV4cG9ydCBjb25zdCBpc1JlZnJlc2hhYmxlID0gKHNlc3Npb246IFNlc3Npb25EYXRhKTogYm9vbGVhbiA9PlxuICAhaXNXaXRoaW5CdWZmZXIoc2Vzc2lvbi5zZXNzaW9uX2V4cCA/PyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpICYmXG4gICFpc1dpdGhpbkJ1ZmZlcihzZXNzaW9uLnNlc3Npb25faW5mby5yZWZyZXNoX3Rva2VuX2V4cCk7XG5cbi8qKlxuICogUGFyc2VzIHRoZSBiYXNlNjQgQVBJIHNlc3Npb24gdG9rZW4uXG4gKiBDb25zdW1lcyB0aGUgb3V0cHV0IG9mIHRoZSBjbGkgY29tbWFuZDpcbiAqXG4gKiBgYGBcbiAqIGNzIHRva2VuIGNyZWF0ZSAtLW91dHB1dCBiYXNlNjRcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBzZXNzaW9uRGF0YVN0cmluZyBCYXNlNjQgZW5jb2RlZCBBUEkgc2Vzc2lvbiB0b2tlbi5cbiAqXG4gKiBAcmV0dXJucyBzZXNzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VCYXNlNjRTZXNzaW9uRGF0YShzZXNzaW9uRGF0YVN0cmluZzogc3RyaW5nKTogU2Vzc2lvbkRhdGEge1xuICAvLyBwYXJzZSB0b2tlbiwgc3RyaXBwaW5nIHdoaXRlc3BhY2UuXG4gIGNvbnN0IHNlY3JldEI2NFRva2VuID0gc2Vzc2lvbkRhdGFTdHJpbmcucmVwbGFjZSgvXFxzL2csIFwiXCIpO1xuICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShhdG9iKHNlY3JldEI2NFRva2VuKSk7XG5cbiAgLy8gQmFzaWMgdmFsaWRhdGlvbiBvZiB0aGUgc2Vzc2lvbiBkYXRhIChpLmUuLCBtb3N0IHR5cGVzIG9mIHRvcCBsZXZlbCBmaWVsZHMpXG4gIGlmICghZGF0YSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlNlc3Npb24gaXMgdW5kZWZpbmVkXCIpO1xuICB9XG4gIGlmICh0eXBlb2YgZGF0YSAhPT0gXCJvYmplY3RcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHNlc3Npb24gdG8gYmUgYW4gb2JqZWN0XCIpO1xuICB9XG4gIGZvciAoY29uc3QgZmllbGQgb2YgW1wib3JnX2lkXCIsIFwidG9rZW5cIl0pIHtcbiAgICBjb25zdCBmaWVsZFR5cGUgPSB0eXBlb2YgZGF0YVtmaWVsZF07XG4gICAgaWYgKGZpZWxkVHlwZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCAke2ZpZWxkfSB0byBiZSBhIHN0cmluZywgZ290ICR7ZmllbGRUeXBlfWApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIFtcInJvbGVfaWRcIiwgXCJwdXJwb3NlXCIsIFwicmVmcmVzaF90b2tlblwiXSkge1xuICAgIGNvbnN0IGZpZWxkVHlwZSA9IHR5cGVvZiBkYXRhW2ZpZWxkXTtcbiAgICBpZiAoZmllbGRUeXBlICE9PSBcInN0cmluZ1wiICYmIGRhdGFbZmllbGRdICE9PSB1bmRlZmluZWQgJiYgZGF0YVtmaWVsZF0gIT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJHtmaWVsZH0gdG8gYmUgYSBzdHJpbmcgb3IgdW5kZWZpbmVkLCBnb3QgJHtmaWVsZFR5cGV9YCk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgZmllbGQgb2YgW1wic2Vzc2lvbl9pbmZvXCIsIFwiZW52XCJdKSB7XG4gICAgY29uc3QgZmllbGRUeXBlID0gdHlwZW9mIGRhdGFbZmllbGRdO1xuICAgIGlmIChmaWVsZFR5cGUgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJHtmaWVsZH0gdG8gYmUgYW4gb2JqZWN0LCBnb3QgJHtmaWVsZFR5cGV9YCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBkYXRhIGFzIFNlc3Npb25EYXRhO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgc2Vzc2lvbiBkYXRhIHRvIGJhc2U2NC5cbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBkYXRhIHRvIHNlcmlhbGl6ZVxuICogQHJldHVybnMgVGhlIHNlcmlhbGl6ZWQgZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBzdHJpbmcge1xuICByZXR1cm4gYnRvYShKU09OLnN0cmluZ2lmeShzZXNzaW9uKSk7XG59XG4iXX0=