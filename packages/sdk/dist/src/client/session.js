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
exports.serializeRefreshToken = serializeRefreshToken;
exports.serializeBase64SessionData = serializeBase64SessionData;
const fetch_1 = require("../fetch");
const retry_1 = require("../retry");
/** Prefix used for CubeSigner OAuth tokens */
const CUBESIGNER_PREFIX = "3d6fd7397:";
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
    /** @returns Non-sensitive metadata on the session */
    async metadata() {
        return __classPrivateFieldGet(this, _NoRefreshSessionManager_metadata, "f");
    }
    /** @returns The token to use for requests */
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
     * @returns The session metadata, loaded from storage
     */
    metadata() {
        return this.retrieve().then(metadata);
    }
    /**
     * @returns The token loaded from storage, refreshing if necessary
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
    /** @returns the in-memory data */
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
 * @param session The CubeSigner session to refresh
 * @returns A refreshed session
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
    for (const field of ["role_id", "purpose"]) {
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
    // Compute `refresh_token` for old sessions that may not have it set
    const info = data["session_info"];
    const refreshToken = data["refresh_token"];
    const refreshTokenFromInfo = serializeRefreshToken(info);
    if (refreshToken === null || refreshToken === undefined) {
        data["refresh_token"] = refreshTokenFromInfo;
    }
    return data;
}
/**
 * Serializes a refresh token from session information. The result is a valid OAuth token.
 *
 * @param info Session information
 * @returns A refresh token
 */
function serializeRefreshToken(info) {
    const sessionIdSer = btoa(info.session_id);
    const authData = btoa(JSON.stringify({
        epoch_num: info.epoch,
        epoch_token: info.epoch_token,
        other_token: info.auth_token,
    }));
    return `${CUBESIGNER_PREFIX}${sessionIdSer}.${authData}.${info.refresh_token}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvc2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUF1REEsNENBRUM7QUF3TUQsMEJBcUJDO0FBUUQsNEJBV0M7QUE0QkQsd0RBd0NDO0FBUUQsc0RBVUM7QUFRRCxnRUFFQztBQXhZRCxvQ0FBOEM7QUFDOUMsb0NBQXNDO0FBR3RDLDhDQUE4QztBQUM5QyxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQztBQTBDdkM7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBb0I7SUFDbkQsT0FBTyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDakYsQ0FBQztBQXFDRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFhLHVCQUF1QjtJQUlsQzs7OztPQUlHO0lBQ0gsWUFBWSxPQUFvQjtRQVJoQyxvREFBMkI7UUFDM0IsaURBQWU7UUFRYixPQUFPLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEMsdUJBQUEsSUFBSSxxQ0FBYSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQUEsQ0FBQztRQUNuQyx1QkFBQSxJQUFJLGtDQUFVLE9BQU8sQ0FBQyxLQUFLLE1BQUEsQ0FBQztJQUM5QixDQUFDO0lBRUQscURBQXFEO0lBQ3JELEtBQUssQ0FBQyxRQUFRO1FBQ1osT0FBTyx1QkFBQSxJQUFJLHlDQUFVLENBQUM7SUFDeEIsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxLQUFLLENBQUMsS0FBSztRQUNULE9BQU8sdUJBQUEsSUFBSSxzQ0FBTyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQXhCRCwwREF3QkM7O0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBc0IsdUJBQXVCO0lBQTdDO1FBQ0UsNkZBQTZGO1FBQzdGLHNE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dUI7SUFDM0QsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQ25CLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDYixTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUs7UUFDckIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1FBQzdCLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVTtLQUM3QixDQUFDLENBQ0gsQ0FBQztJQUNGLE9BQU8sR0FBRyxpQkFBaUIsR0FBRyxZQUFZLElBQUksUUFBUSxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUNqRixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQiwwQkFBMEIsQ0FBQyxPQUFvQjtJQUM3RCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uL2VudlwiO1xuaW1wb3J0IHsgYXBpRmV0Y2gsIGFzc2VydE9rIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyByZXRyeU9uNVhYIH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgdHlwZSB7IENsaWVudFNlc3Npb25JbmZvIH0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuXG4vKiogUHJlZml4IHVzZWQgZm9yIEN1YmVTaWduZXIgT0F1dGggdG9rZW5zICovXG5jb25zdCBDVUJFU0lHTkVSX1BSRUZJWCA9IFwiM2Q2ZmQ3Mzk3OlwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25MaWZldGltZSB7XG4gIC8qKiBTZXNzaW9uIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIHdlZWsgKDYwNDgwMCkuICovXG4gIHNlc3Npb24/OiBudW1iZXI7XG4gIC8qKiBBdXRoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gZml2ZSBtaW51dGVzICgzMDApLiAqL1xuICBhdXRoPzogbnVtYmVyO1xuICAvKiogUmVmcmVzaCB0b2tlbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIG9uZSBkYXkgKDg2NDAwKS4gKi9cbiAgcmVmcmVzaD86IG51bWJlcjtcbiAgLyoqIEdyYWNlIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gMzAgc2Vjb25kcyAoMzApLiAqL1xuICBncmFjZT86IG51bWJlcjtcbn1cblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIEN1YmVTaWduZXIgc2Vzc2lvbiBmaWxlIGZvcm1hdCAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uRGF0YSB7XG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIElEICovXG4gIG9yZ19pZDogc3RyaW5nO1xuICAvKiogVGhlIHJvbGUgSUQgKi9cbiAgcm9sZV9pZD86IHN0cmluZyB8IG51bGw7XG4gIC8qKiBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvbiB0b2tlbiAqL1xuICBwdXJwb3NlPzogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIFRoZSB0b2tlbiB0byBpbmNsdWRlIGluIEF1dGhvcml6YXRpb24gaGVhZGVyICovXG4gIHRva2VuOiBzdHJpbmc7XG4gIC8qKiBUaGUgdG9rZW4gdG8gdXNlIHRvIHJlZnJlc2ggdGhlIHNlc3Npb24gKi9cbiAgcmVmcmVzaF90b2tlbjogc3RyaW5nO1xuICAvKiogU2Vzc2lvbiBpbmZvICovXG4gIHNlc3Npb25faW5mbzogQ2xpZW50U2Vzc2lvbkluZm87XG4gIC8qKiBTZXNzaW9uIGV4cGlyYXRpb24gKGluIHNlY29uZHMgc2luY2UgVU5JWCBlcG9jaCkgYmV5b25kIHdoaWNoIGl0IGNhbm5vdCBiZSByZWZyZXNoZWQgKi9cbiAgc2Vzc2lvbl9leHA6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQ7IC8vIG1heSBiZSBtaXNzaW5nIGluIGxlZ2FjeSBzZXNzaW9uIGZpbGVzXG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgKi9cbiAgZW52OiB7XG4gICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogRW52SW50ZXJmYWNlO1xuICB9O1xufVxuXG4vLyBSYXRoZXIgdGhhbiBqdXN0IGRvaW5nIGEgc2ltcGxlIFBpY2ssIHdlIGdvIHRoZSBleHRyYSBtaWxlIHRvIGVuc3VyZSB0aGF0XG4vLyBhbnkgbWV0YWRhdGEgb2JqZWN0IE1VU1QgTkVWRVIgaW5jbHVkZSBzZW5zaXRpdmUgaW5mb3JtYXRpb25cbnR5cGUgU2FmZVNlc3Npb25EYXRhRmllbGRzID0gXCJlbnZcIiB8IFwib3JnX2lkXCIgfCBcInJvbGVfaWRcIiB8IFwicHVycG9zZVwiIHwgXCJzZXNzaW9uX2V4cFwiO1xuXG4vKiogUmVwcmVzZW50cyBlaXRoZXIgdGhlIFNlc3Npb25EYXRhIG9yIGEgYmFzZTY0IEpTT04gZW5jb2Rpbmcgb2YgaXQgKi9cbmV4cG9ydCB0eXBlIFNlc3Npb25MaWtlID0gc3RyaW5nIHwgU2Vzc2lvbkRhdGE7XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0aGF0IHBhcnNlcyBiYXNlNjQgZW5jb2RlZCBTZXNzaW9uRGF0YSwgaWYgbmVjZXNzYXJ5LlxuICogVGhpcyBhbGxvd3MgU2Vzc2lvbk1hbmFnZXJzIHRvIGVhc2lseSBpbmdlc3QgdGhlIG11bHRpcGxlIHN1cHBvcnRlZCBmb3JtYXRzIGZvciBzZXNzaW9ucy5cbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBvYmplY3Qgb3IgZW5jb2RpbmdcbiAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZXNzaW9uTGlrZShzZXNzaW9uOiBTZXNzaW9uTGlrZSkge1xuICByZXR1cm4gdHlwZW9mIHNlc3Npb24gPT09IFwic3RyaW5nXCIgPyBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb24pIDogc2Vzc2lvbjtcbn1cblxuLyoqIE5vbi1zZW5zaXRpdmUgaW5mbyBhYm91dCBhIHNlc3Npb24gKi9cbmV4cG9ydCB0eXBlIFNlc3Npb25NZXRhZGF0YSA9IFBpY2s8U2Vzc2lvbkRhdGEsIFNhZmVTZXNzaW9uRGF0YUZpZWxkcz4gJiB7XG4gIFtLIGluIEV4Y2x1ZGU8a2V5b2YgU2Vzc2lvbkRhdGEsIFNhZmVTZXNzaW9uRGF0YUZpZWxkcz5dPzogbmV2ZXI7XG59ICYgeyBzZXNzaW9uX2lkOiBzdHJpbmc7IGVwb2NoOiBudW1iZXIgfTtcblxuLyoqXG4gKiBBIFNlc3Npb25NYW5hZ2VyJ3Mgam9iIGlzIHRvIGhhbmRsZSBzZXNzaW9uIHBlcnNpc3RlbmNlIGFuZCByZWZyZXNoZXNcbiAqXG4gKiBUaGUgaW50ZXJmYWNlIGRvZXMgbm90IGltcG9zZSAqd2hlbiogYSByZWZyZXNoIG11c3Qgb2NjdXIsIHRob3VnaCB0eXBpY2FsbHlcbiAqIHRoaXMgd2lsbCBiZSBvbiByZXF1ZXN0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25NYW5hZ2VyIHtcbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBpZiBhIHJlcXVlc3QgZmFpbGVkIGR1ZSB0byBhbiBpbnZhbGlkIHRva2VuLlxuICAgKi9cbiAgb25JbnZhbGlkVG9rZW4/OiAoKSA9PiB2b2lkO1xuXG4gIC8qKlxuICAgKiBMb2FkIHRoZSBtZXRhZGF0YSBmb3IgdGhlIHNlc3Npb24uIFNob3VsZCB0aHJvdyBpZiBub3QgYXZhaWxhYmxlXG4gICAqXG4gICAqIEByZXR1cm5zIEluZm8gYWJvdXQgdGhlIHNlc3Npb25cbiAgICpcbiAgICogQHRocm93cyB7Tm9TZXNzaW9uRm91bmRFcnJvcn0gSWYgdGhlIHNlc3Npb24gaXMgbm90IGF2YWlsYWJsZVxuICAgKi9cbiAgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+O1xuXG4gIC8qKlxuICAgKiBMb2FkIHRoZSB0b2tlbiB0byBiZSB1c2VkIGZvciBhIHJlcXVlc3QuIFRoaXMgd2lsbCBiZSBpbnZva2VkIGJ5IHRoZSBjbGllbnRcbiAgICogdG8gcHJvdmlkZSB0aGUgQXV0aG9yaXphdGlvbiBoZWFkZXJcbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRva2VuXG4gICAqL1xuICB0b2tlbigpOiBQcm9taXNlPHN0cmluZz47XG59XG5cbi8qKlxuICogQWxsb3dzIHRoZSBjb25zdHJ1Y3Rpb24gb2YgY2xpZW50cyB3aGljaCBkbyBub3QgYXV0b21hdGljYWxseSByZWZyZXNoXG4gKiBzZXNzaW9ucy5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IG1hbmFnZXIgPSBuZXcgTm9SZWZyZXNoU2Vzc2lvbk1hbmFnZXIoc2Vzc2lvbkRhdGEpO1xuICogY29uc3QgY2xpZW50ID0gYXdhaXQgQ3ViZVNpZ25lckNsaWVudC5jcmVhdGUobWFuYWdlcik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIE5vUmVmcmVzaFNlc3Npb25NYW5hZ2VyIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXIge1xuICAjbWV0YWRhdGE6IFNlc3Npb25NZXRhZGF0YTtcbiAgI3Rva2VuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgdGhlIG1hbmFnZXIgd2l0aCB0aGUgc2Vzc2lvbiBkYXRhXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIGZvciB0aGlzIG1hbmFnZXIgdG8gdXNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uOiBTZXNzaW9uTGlrZSkge1xuICAgIHNlc3Npb24gPSBwYXJzZVNlc3Npb25MaWtlKHNlc3Npb24pO1xuICAgIHRoaXMuI21ldGFkYXRhID0gbWV0YWRhdGEoc2Vzc2lvbik7XG4gICAgdGhpcy4jdG9rZW4gPSBzZXNzaW9uLnRva2VuO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIE5vbi1zZW5zaXRpdmUgbWV0YWRhdGEgb24gdGhlIHNlc3Npb24gKi9cbiAgYXN5bmMgbWV0YWRhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuI21ldGFkYXRhO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSB0b2tlbiB0byB1c2UgZm9yIHJlcXVlc3RzICovXG4gIGFzeW5jIHRva2VuKCkge1xuICAgIHJldHVybiB0aGlzLiN0b2tlbjtcbiAgfVxufVxuXG4vKipcbiAqIEEgdGVtcGxhdGUgZm9yIHNlc3Npb24gbWFuYWdlcnMgd2hpY2ggaGF2ZSBleGNsdXNpdmUgYWNjZXNzIHRvIGEgc2Vzc2lvblxuICogYW5kIGNhbiBzdG9yZS9sb2FkIHRoZW0gZnJlZWx5LlxuICpcbiAqIEl0IGlzIE5PVCBzdWl0YWJsZSBmb3IgYXBwbGljYXRpb25zIHdoZXJlIG11bHRpcGxlIGNsaWVudHMgYXJlIHVzaW5nIHRoZSBzYW1lXG4gKiBzZXNzaW9uIGFzIHRoZXkgd2lsbCBib3RoIGF0dGVtcHQgdG8gcmVmcmVzaCBpbmRlcGVuZGVudGx5LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRXhjbHVzaXZlU2Vzc2lvbk1hbmFnZXIgaW1wbGVtZW50cyBTZXNzaW9uTWFuYWdlciB7XG4gIC8qKiBJZiBwcmVzZW50LCB0aGUgc2Vzc2lvbiBpcyBjdXJyZW50bHkgcmVmcmVzaGluZy4gQXdhaXQgdG8gZ2V0IHRoZSBmcmVzaGVzdCBTZXNzaW9uRGF0YSAqL1xuICAjcmVmcmVzaGluZz86IFByb21pc2U8U2Vzc2lvbkRhdGE+O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSB0aGUgU2Vzc2lvbkRhdGEgZnJvbSBzdG9yYWdlXG4gICAqL1xuICBhYnN0cmFjdCByZXRyaWV2ZSgpOiBQcm9taXNlPFNlc3Npb25EYXRhPjtcblxuICAvKipcbiAgICogU3RvcmUgdGhlIFNlc3Npb25EYXRhIGludG8gc3RvcmFnZVxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgZGF0YSB0byBzdG9yZVxuICAgKi9cbiAgYWJzdHJhY3Qgc3RvcmUoZGF0YTogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBtZXRhZGF0YSwgbG9hZGVkIGZyb20gc3RvcmFnZVxuICAgKi9cbiAgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+IHtcbiAgICByZXR1cm4gdGhpcy5yZXRyaWV2ZSgpLnRoZW4obWV0YWRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB0b2tlbiBsb2FkZWQgZnJvbSBzdG9yYWdlLCByZWZyZXNoaW5nIGlmIG5lY2Vzc2FyeVxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5yZXRyaWV2ZSgpO1xuXG4gICAgdGhpcy4jcmVmcmVzaGluZyA/Pz0gcmVmcmVzaElmTmVjZXNzYXJ5KGRhdGEpXG4gICAgICA/LnRoZW4oYXN5bmMgKGRhdGEpID0+IChhd2FpdCB0aGlzLnN0b3JlKGRhdGEpLCBkYXRhKSlcbiAgICAgID8uZmluYWxseSgoKSA9PiAodGhpcy4jcmVmcmVzaGluZyA9IHVuZGVmaW5lZCkpO1xuXG4gICAgLy8gVGVjaG5pY2FsbHksIGluIG1hbnkgY2FzZXMgd2Ugc2hvdWxkbid0IGhhdmUgdG8gd2FpdCBmb3IgdGhlIHJlZnJlc2gsXG4gICAgLy8gdGhlIHNlc3Npb24gd2lsbCBzdGlsbCBiZSB2YWxpZCBmb3IgYSB3aGlsZSBhZnRlciB0aGUgcmVmcmVzaCBzdGFydHMuXG4gICAgLy9cbiAgICAvLyBIb3dldmVyLCBzb21ldGltZXMgdGhlIGF1dGggdG9rZW4gd2lsbCBiZSBlbnRpcmVseSBleHBpcmVkLCBzbyB3ZSBjb25zZXJ2YXRpdmVseVxuICAgIC8vIHdhaXQgZm9yIGEgc3VjY2Vzc2Z1bCByZWZyZXNoXG4gICAgY29uc3Qgc2Vzc2lvbiA9IHRoaXMuI3JlZnJlc2hpbmcgPyBhd2FpdCB0aGlzLiNyZWZyZXNoaW5nIDogZGF0YTtcbiAgICByZXR1cm4gc2Vzc2lvbi50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYW51YWxseSBmb3JjZSBhIHRva2VuIHJlZnJlc2hcbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IHJlZnJlc2hlZCBzZXNzaW9uIGRhdGFcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBmb3JjZVJlZnJlc2goKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIC8vIElmIG5vdCBjdXJyZW50bHkgcmVmcmVzaGluZywgc3RhcnQgcmVmcmVzaGluZ1xuICAgIHRoaXMuI3JlZnJlc2hpbmcgPz89IHRoaXMucmV0cmlldmUoKVxuICAgICAgLnRoZW4ocmVmcmVzaClcbiAgICAgIC50aGVuKGFzeW5jIChkYXRhKSA9PiAoYXdhaXQgdGhpcy5zdG9yZShkYXRhKSwgZGF0YSkpXG4gICAgICAuZmluYWxseSgoKSA9PiAodGhpcy4jcmVmcmVzaGluZyA9IHVuZGVmaW5lZCkpO1xuXG4gICAgLy8gQmVjYXVzZSB3ZSA/Pz0gYXNzaWduZWQgdG8gcmVmcmVzaGluZyBhYm92ZSwgd2UncmUgZ3VhcmFudGVlZCB0byBiZVxuICAgIC8vIGFjdGl2ZWx5IHJlZnJlc2hpbmcsIHNvIGp1c3QgYXdhaXQgaXQuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3JlZnJlc2hpbmc7XG4gIH1cbn1cblxuLyoqIEltcGxlbWVudHMgYSBTZXNzaW9uTWFuYWdlciB3aXRob3V0IHBlcnNpc3RlbmNlICovXG5leHBvcnQgY2xhc3MgTWVtb3J5U2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciB7XG4gIC8qKiBUaGUgc2Vzc2lvbiBkYXRhIGNvbnRhaW5pbmcgYm90aCBtZXRhZGF0YSBhbmQgdG9rZW5zICovXG4gICNkYXRhOiBTZXNzaW9uRGF0YTtcblxuICAvKipcbiAgICogQ29uc3RydWN0IHdpdGggZGF0YSBpbiBtZW1vcnlcbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIGluaXRpYWwgc2Vzc2lvbiBkYXRhXG4gICAqL1xuICBjb25zdHJ1Y3RvcihkYXRhOiBTZXNzaW9uRGF0YSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKiogQHJldHVybnMgdGhlIGluLW1lbW9yeSBkYXRhICovXG4gIGFzeW5jIHJldHJpZXZlKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgaW4tbWVtb3J5IGRhdGFcbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIHNlc3Npb24gZGF0YSB0byBzdG9yZVxuICAgKi9cbiAgYXN5bmMgc3RvcmUoZGF0YTogU2Vzc2lvbkRhdGEpIHtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vKiogQW4gZXJyb3IgdHlwZSB0byBiZSB0aHJvd24gYnkgU2Vzc2lvbk1hbmFnZXIncyB3aGVuIHRoZSBzZXNzaW9uIGlzIHVuYXZhaWxhYmxlICovXG5leHBvcnQgY2xhc3MgTm9TZXNzaW9uRm91bmRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgLyoqIENvbnN0cnVjdHMgdGhlIGVycm9yIHdpdGggdGhlIGFwcHJvcHJpYXRlIG1lc3NhZ2UgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJObyBzZXNzaW9uIGF2YWlsYWJsZSBmb3IgdGhlIGNsaWVudFwiKTtcbiAgfVxufVxuXG4vKiogVGhlIG51bWJlciBvZiBzZWNvbmRzIGJlZm9yZSBleHBpcmF0aW9uIHRpbWUsIHRvIGF0dGVtcHQgYSByZWZyZXNoICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9FWFBJUkFUSU9OX0JVRkZFUl9TRUNTID0gMzA7XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgcmVmcmVzaGVzIGEgc2Vzc2lvbiB1c2luZyB0aGUgQ3ViZVNpZ25lciBBUEkgaWYgaXQgaXMgY2xvc2VcbiAqIHRvIGV4cGlyaW5nLlxuICpcbiAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIGRhdGEgd2hpY2ggbWF5IHJlcXVpcmUgYSByZWZyZXNoXG4gKiBAcmV0dXJucyBJbW1lZGlhdGVseSByZXR1cm5zIHVuZGVmaW5lZCBpZiB0aGUgc2Vzc2lvbiBkb2VzIG5vdCByZXF1aXJlIGEgcmVmcmVzaCwgZWxzZSByZXR1cm4gYSByZWZyZXNoZWQgc2Vzc2lvblxuICovXG5mdW5jdGlvbiByZWZyZXNoSWZOZWNlc3Nhcnkoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiB1bmRlZmluZWQgfCBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gIGlmICghaXNTdGFsZShzZXNzaW9uKSkgcmV0dXJuO1xuICByZXR1cm4gcmVmcmVzaChzZXNzaW9uKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIHRoZSBDdWJlU2lnbmVyIEFQSSB0byByZWZyZXNoIGEgc2Vzc2lvblxuICpcbiAqIEBwYXJhbSBzZXNzaW9uIFRoZSBDdWJlU2lnbmVyIHNlc3Npb24gdG8gcmVmcmVzaFxuICogQHJldHVybnMgQSByZWZyZXNoZWQgc2Vzc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaChzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgY29uc3QgeyBlcG9jaDogZXBvY2hfbnVtLCBlcG9jaF90b2tlbiwgcmVmcmVzaF90b2tlbjogb3RoZXJfdG9rZW4gfSA9IHNlc3Npb24uc2Vzc2lvbl9pbmZvO1xuICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgIGFwaUZldGNoKFwiL3YxL29yZy97b3JnX2lkfS90b2tlbi9yZWZyZXNoXCIsIFwicGF0Y2hcIiwge1xuICAgICAgYmFzZVVybDogc2Vzc2lvbi5lbnZbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdLlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpLFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHNlc3Npb24ub3JnX2lkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogc2Vzc2lvbi50b2tlbixcbiAgICAgIH0sXG4gICAgICBib2R5OiB7IGVwb2NoX251bSwgZXBvY2hfdG9rZW4sIG90aGVyX3Rva2VuIH0sXG4gICAgfSksXG4gIClcbiAgICAudGhlbihhc3NlcnRPaylcbiAgICAudGhlbigocmVzKSA9PiAoe1xuICAgICAgLi4uc2Vzc2lvbixcbiAgICAgIC4uLnJlcyxcbiAgICB9KSk7XG59XG5cbi8qKlxuICogR2V0IHRoZSBzYWZlIG1ldGFkYXRhIGZyb20gYSBTZXNzaW9uRGF0YVxuICpcbiAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uXG4gKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBtZXRhZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWV0YWRhdGEoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBTZXNzaW9uTWV0YWRhdGEge1xuICBjb25zdCB7IGVudiwgb3JnX2lkLCByb2xlX2lkLCBwdXJwb3NlLCBzZXNzaW9uX2V4cCB9ID0gc2Vzc2lvbjtcbiAgcmV0dXJuIHtcbiAgICBlbnYsXG4gICAgb3JnX2lkLFxuICAgIHJvbGVfaWQsXG4gICAgcHVycG9zZSxcbiAgICBzZXNzaW9uX2lkOiBzZXNzaW9uLnNlc3Npb25faW5mby5zZXNzaW9uX2lkLFxuICAgIHNlc3Npb25fZXhwLFxuICAgIGVwb2NoOiBzZXNzaW9uLnNlc3Npb25faW5mby5lcG9jaCxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gdGltZUluU2Vjb25kcyBhbiBlcG9jaCB0aW1lc3RhbXBcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB0aW1lc3RhbXAgaXMgYmVmb3JlIG5vdyArIERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDU1xuICovXG5jb25zdCBpc1dpdGhpbkJ1ZmZlciA9ICh0aW1lSW5TZWNvbmRzOiBudW1iZXIpID0+XG4gIHRpbWVJblNlY29uZHMgPCBEYXRlLm5vdygpIC8gMTAwMCArIERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDUztcblxuZXhwb3J0IGNvbnN0IGlzU3RhbGUgPSAoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBib29sZWFuID0+XG4gIGlzV2l0aGluQnVmZmVyKHNlc3Npb24uc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwKTtcblxuZXhwb3J0IGNvbnN0IGlzUmVmcmVzaGFibGUgPSAoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBib29sZWFuID0+XG4gICFpc1dpdGhpbkJ1ZmZlcihzZXNzaW9uLnNlc3Npb25fZXhwID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSkgJiZcbiAgIWlzV2l0aGluQnVmZmVyKHNlc3Npb24uc2Vzc2lvbl9pbmZvLnJlZnJlc2hfdG9rZW5fZXhwKTtcblxuLyoqXG4gKiBQYXJzZXMgdGhlIGJhc2U2NCBBUEkgc2Vzc2lvbiB0b2tlbi5cbiAqIENvbnN1bWVzIHRoZSBvdXRwdXQgb2YgdGhlIGNsaSBjb21tYW5kOlxuICpcbiAqIGBgYFxuICogY3MgdG9rZW4gY3JlYXRlIC0tb3V0cHV0IGJhc2U2NFxuICogYGBgXG4gKlxuICogQHBhcmFtIHNlc3Npb25EYXRhU3RyaW5nIEJhc2U2NCBlbmNvZGVkIEFQSSBzZXNzaW9uIHRva2VuLlxuICpcbiAqIEByZXR1cm5zIHNlc3Npb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb25EYXRhU3RyaW5nOiBzdHJpbmcpOiBTZXNzaW9uRGF0YSB7XG4gIC8vIHBhcnNlIHRva2VuLCBzdHJpcHBpbmcgd2hpdGVzcGFjZS5cbiAgY29uc3Qgc2VjcmV0QjY0VG9rZW4gPSBzZXNzaW9uRGF0YVN0cmluZy5yZXBsYWNlKC9cXHMvZywgXCJcIik7XG4gIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGF0b2Ioc2VjcmV0QjY0VG9rZW4pKTtcblxuICAvLyBCYXNpYyB2YWxpZGF0aW9uIG9mIHRoZSBzZXNzaW9uIGRhdGEgKGkuZS4sIG1vc3QgdHlwZXMgb2YgdG9wIGxldmVsIGZpZWxkcylcbiAgaWYgKCFkYXRhKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vzc2lvbiBpcyB1bmRlZmluZWRcIik7XG4gIH1cbiAgaWYgKHR5cGVvZiBkYXRhICE9PSBcIm9iamVjdFwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgc2Vzc2lvbiB0byBiZSBhbiBvYmplY3RcIik7XG4gIH1cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBbXCJvcmdfaWRcIiwgXCJ0b2tlblwiXSkge1xuICAgIGNvbnN0IGZpZWxkVHlwZSA9IHR5cGVvZiBkYXRhW2ZpZWxkXTtcbiAgICBpZiAoZmllbGRUeXBlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICR7ZmllbGR9IHRvIGJlIGEgc3RyaW5nLCBnb3QgJHtmaWVsZFR5cGV9YCk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgZmllbGQgb2YgW1wicm9sZV9pZFwiLCBcInB1cnBvc2VcIl0pIHtcbiAgICBjb25zdCBmaWVsZFR5cGUgPSB0eXBlb2YgZGF0YVtmaWVsZF07XG4gICAgaWYgKGZpZWxkVHlwZSAhPT0gXCJzdHJpbmdcIiAmJiBkYXRhW2ZpZWxkXSAhPT0gdW5kZWZpbmVkICYmIGRhdGFbZmllbGRdICE9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICR7ZmllbGR9IHRvIGJlIGEgc3RyaW5nIG9yIHVuZGVmaW5lZCwgZ290ICR7ZmllbGRUeXBlfWApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIFtcInNlc3Npb25faW5mb1wiLCBcImVudlwiXSkge1xuICAgIGNvbnN0IGZpZWxkVHlwZSA9IHR5cGVvZiBkYXRhW2ZpZWxkXTtcbiAgICBpZiAoZmllbGRUeXBlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICR7ZmllbGR9IHRvIGJlIGFuIG9iamVjdCwgZ290ICR7ZmllbGRUeXBlfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIENvbXB1dGUgYHJlZnJlc2hfdG9rZW5gIGZvciBvbGQgc2Vzc2lvbnMgdGhhdCBtYXkgbm90IGhhdmUgaXQgc2V0XG4gIGNvbnN0IGluZm8gPSBkYXRhW1wic2Vzc2lvbl9pbmZvXCJdIGFzIENsaWVudFNlc3Npb25JbmZvO1xuICBjb25zdCByZWZyZXNoVG9rZW4gPSBkYXRhW1wicmVmcmVzaF90b2tlblwiXTtcbiAgY29uc3QgcmVmcmVzaFRva2VuRnJvbUluZm8gPSBzZXJpYWxpemVSZWZyZXNoVG9rZW4oaW5mbyk7XG4gIGlmIChyZWZyZXNoVG9rZW4gPT09IG51bGwgfHwgcmVmcmVzaFRva2VuID09PSB1bmRlZmluZWQpIHtcbiAgICBkYXRhW1wicmVmcmVzaF90b2tlblwiXSA9IHJlZnJlc2hUb2tlbkZyb21JbmZvO1xuICB9XG5cbiAgcmV0dXJuIGRhdGEgYXMgU2Vzc2lvbkRhdGE7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyBhIHJlZnJlc2ggdG9rZW4gZnJvbSBzZXNzaW9uIGluZm9ybWF0aW9uLiBUaGUgcmVzdWx0IGlzIGEgdmFsaWQgT0F1dGggdG9rZW4uXG4gKlxuICogQHBhcmFtIGluZm8gU2Vzc2lvbiBpbmZvcm1hdGlvblxuICogQHJldHVybnMgQSByZWZyZXNoIHRva2VuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVSZWZyZXNoVG9rZW4oaW5mbzogQ2xpZW50U2Vzc2lvbkluZm8pOiBzdHJpbmcge1xuICBjb25zdCBzZXNzaW9uSWRTZXIgPSBidG9hKGluZm8uc2Vzc2lvbl9pZCk7XG4gIGNvbnN0IGF1dGhEYXRhID0gYnRvYShcbiAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBlcG9jaF9udW06IGluZm8uZXBvY2gsXG4gICAgICBlcG9jaF90b2tlbjogaW5mby5lcG9jaF90b2tlbixcbiAgICAgIG90aGVyX3Rva2VuOiBpbmZvLmF1dGhfdG9rZW4sXG4gICAgfSksXG4gICk7XG4gIHJldHVybiBgJHtDVUJFU0lHTkVSX1BSRUZJWH0ke3Nlc3Npb25JZFNlcn0uJHthdXRoRGF0YX0uJHtpbmZvLnJlZnJlc2hfdG9rZW59YDtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHNlc3Npb24gZGF0YSB0byBiYXNlNjQuXG4gKlxuICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gZGF0YSB0byBzZXJpYWxpemVcbiAqIEByZXR1cm5zIFRoZSBzZXJpYWxpemVkIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb246IFNlc3Npb25EYXRhKTogc3RyaW5nIHtcbiAgcmV0dXJuIGJ0b2EoSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbikpO1xufVxuIl19