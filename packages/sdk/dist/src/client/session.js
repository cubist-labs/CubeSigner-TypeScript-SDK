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
        org_id: session.org_id,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvc2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUF1REEsNENBRUM7QUF3TUQsMEJBc0JDO0FBUUQsNEJBV0M7QUE0QkQsd0RBd0NDO0FBUUQsc0RBVUM7QUFRRCxnRUFFQztBQXpZRCxvQ0FBOEM7QUFDOUMsb0NBQXNDO0FBR3RDLDhDQUE4QztBQUM5QyxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQztBQTBDdkM7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBb0I7SUFDbkQsT0FBTyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDakYsQ0FBQztBQXFDRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFhLHVCQUF1QjtJQUlsQzs7OztPQUlHO0lBQ0gsWUFBWSxPQUFvQjtRQVJoQyxvREFBMkI7UUFDM0IsaURBQWU7UUFRYixPQUFPLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEMsdUJBQUEsSUFBSSxxQ0FBYSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQUEsQ0FBQztRQUNuQyx1QkFBQSxJQUFJLGtDQUFVLE9BQU8sQ0FBQyxLQUFLLE1BQUEsQ0FBQztJQUM5QixDQUFDO0lBRUQscURBQXFEO0lBQ3JELEtBQUssQ0FBQyxRQUFRO1FBQ1osT0FBTyx1QkFBQSxJQUFJLHlDQUFVLENBQUM7SUFDeEIsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxLQUFLLENBQUMsS0FBSztRQUNULE9BQU8sdUJBQUEsSUFBSSxzQ0FBTyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQXhCRCwwREF3QkM7O0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBc0IsdUJBQXVCO0lBQTdDO1FBQ0UsNkZBQTZGO1FBQzdGLHNE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R0FLRztBQUNILFNBQWdCLHFCQUFxQixDQUFDLElBQXVCO0lBQzNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2IsU0FBUyxFQUFFLElBQUksQ0FBQyxLQUFLO1FBQ3JCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztRQUM3QixXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVU7S0FDN0IsQ0FBQyxDQUNILENBQUM7SUFDRixPQUFPLEdBQUcsaUJBQWlCLEdBQUcsWUFBWSxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7QUFDakYsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsMEJBQTBCLENBQUMsT0FBb0I7SUFDN0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcbmltcG9ydCB7IGFwaUZldGNoLCBhc3NlcnRPayB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgcmV0cnlPbjVYWCB9IGZyb20gXCIuLi9yZXRyeVwiO1xuaW1wb3J0IHR5cGUgeyBDbGllbnRTZXNzaW9uSW5mbyB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcblxuLyoqIFByZWZpeCB1c2VkIGZvciBDdWJlU2lnbmVyIE9BdXRoIHRva2VucyAqL1xuY29uc3QgQ1VCRVNJR05FUl9QUkVGSVggPSBcIjNkNmZkNzM5NzpcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uTGlmZXRpbWUge1xuICAvKiogU2Vzc2lvbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIG9uZSB3ZWVrICg2MDQ4MDApLiAqL1xuICBzZXNzaW9uPzogbnVtYmVyO1xuICAvKiogQXV0aCB0b2tlbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIGZpdmUgbWludXRlcyAoMzAwKS4gKi9cbiAgYXV0aD86IG51bWJlcjtcbiAgLyoqIFJlZnJlc2ggdG9rZW4gbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byBvbmUgZGF5ICg4NjQwMCkuICovXG4gIHJlZnJlc2g/OiBudW1iZXI7XG4gIC8qKiBHcmFjZSBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIDMwIHNlY29uZHMgKDMwKS4gKi9cbiAgZ3JhY2U/OiBudW1iZXI7XG59XG5cbi8qKiBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDdWJlU2lnbmVyIHNlc3Npb24gZmlsZSBmb3JtYXQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbkRhdGEge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIElEICovXG4gIHJvbGVfaWQ/OiBzdHJpbmcgfCBudWxsO1xuICAvKiogVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb24gdG9rZW4gKi9cbiAgcHVycG9zZT86IHN0cmluZyB8IG51bGw7XG4gIC8qKiBUaGUgdG9rZW4gdG8gaW5jbHVkZSBpbiBBdXRob3JpemF0aW9uIGhlYWRlciAqL1xuICB0b2tlbjogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIHVzZSB0byByZWZyZXNoIHRoZSBzZXNzaW9uICovXG4gIHJlZnJlc2hfdG9rZW46IHN0cmluZztcbiAgLyoqIFNlc3Npb24gaW5mbyAqL1xuICBzZXNzaW9uX2luZm86IENsaWVudFNlc3Npb25JbmZvO1xuICAvKiogU2Vzc2lvbiBleHBpcmF0aW9uIChpbiBzZWNvbmRzIHNpbmNlIFVOSVggZXBvY2gpIGJleW9uZCB3aGljaCBpdCBjYW5ub3QgYmUgcmVmcmVzaGVkICovXG4gIHNlc3Npb25fZXhwOiBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkOyAvLyBtYXkgYmUgbWlzc2luZyBpbiBsZWdhY3kgc2Vzc2lvbiBmaWxlc1xuICAvKiogVGhlIGVudmlyb25tZW50ICovXG4gIGVudjoge1xuICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IEVudkludGVyZmFjZTtcbiAgfTtcbn1cblxuLy8gUmF0aGVyIHRoYW4ganVzdCBkb2luZyBhIHNpbXBsZSBQaWNrLCB3ZSBnbyB0aGUgZXh0cmEgbWlsZSB0byBlbnN1cmUgdGhhdFxuLy8gYW55IG1ldGFkYXRhIG9iamVjdCBNVVNUIE5FVkVSIGluY2x1ZGUgc2Vuc2l0aXZlIGluZm9ybWF0aW9uXG50eXBlIFNhZmVTZXNzaW9uRGF0YUZpZWxkcyA9IFwiZW52XCIgfCBcIm9yZ19pZFwiIHwgXCJyb2xlX2lkXCIgfCBcInB1cnBvc2VcIiB8IFwic2Vzc2lvbl9leHBcIjtcblxuLyoqIFJlcHJlc2VudHMgZWl0aGVyIHRoZSBTZXNzaW9uRGF0YSBvciBhIGJhc2U2NCBKU09OIGVuY29kaW5nIG9mIGl0ICovXG5leHBvcnQgdHlwZSBTZXNzaW9uTGlrZSA9IHN0cmluZyB8IFNlc3Npb25EYXRhO1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb24gdGhhdCBwYXJzZXMgYmFzZTY0IGVuY29kZWQgU2Vzc2lvbkRhdGEsIGlmIG5lY2Vzc2FyeS5cbiAqIFRoaXMgYWxsb3dzIFNlc3Npb25NYW5hZ2VycyB0byBlYXNpbHkgaW5nZXN0IHRoZSBtdWx0aXBsZSBzdXBwb3J0ZWQgZm9ybWF0cyBmb3Igc2Vzc2lvbnMuXG4gKlxuICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gb2JqZWN0IG9yIGVuY29kaW5nXG4gKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2Vzc2lvbkxpa2Uoc2Vzc2lvbjogU2Vzc2lvbkxpa2UpIHtcbiAgcmV0dXJuIHR5cGVvZiBzZXNzaW9uID09PSBcInN0cmluZ1wiID8gcGFyc2VCYXNlNjRTZXNzaW9uRGF0YShzZXNzaW9uKSA6IHNlc3Npb247XG59XG5cbi8qKiBOb24tc2Vuc2l0aXZlIGluZm8gYWJvdXQgYSBzZXNzaW9uICovXG5leHBvcnQgdHlwZSBTZXNzaW9uTWV0YWRhdGEgPSBQaWNrPFNlc3Npb25EYXRhLCBTYWZlU2Vzc2lvbkRhdGFGaWVsZHM+ICYge1xuICBbSyBpbiBFeGNsdWRlPGtleW9mIFNlc3Npb25EYXRhLCBTYWZlU2Vzc2lvbkRhdGFGaWVsZHM+XT86IG5ldmVyO1xufSAmIHsgc2Vzc2lvbl9pZDogc3RyaW5nOyBlcG9jaDogbnVtYmVyIH07XG5cbi8qKlxuICogQSBTZXNzaW9uTWFuYWdlcidzIGpvYiBpcyB0byBoYW5kbGUgc2Vzc2lvbiBwZXJzaXN0ZW5jZSBhbmQgcmVmcmVzaGVzXG4gKlxuICogVGhlIGludGVyZmFjZSBkb2VzIG5vdCBpbXBvc2UgKndoZW4qIGEgcmVmcmVzaCBtdXN0IG9jY3VyLCB0aG91Z2ggdHlwaWNhbGx5XG4gKiB0aGlzIHdpbGwgYmUgb24gcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uTWFuYWdlciB7XG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgaWYgYSByZXF1ZXN0IGZhaWxlZCBkdWUgdG8gYW4gaW52YWxpZCB0b2tlbi5cbiAgICovXG4gIG9uSW52YWxpZFRva2VuPzogKCkgPT4gdm9pZDtcblxuICAvKipcbiAgICogTG9hZCB0aGUgbWV0YWRhdGEgZm9yIHRoZSBzZXNzaW9uLiBTaG91bGQgdGhyb3cgaWYgbm90IGF2YWlsYWJsZVxuICAgKlxuICAgKiBAcmV0dXJucyBJbmZvIGFib3V0IHRoZSBzZXNzaW9uXG4gICAqXG4gICAqIEB0aHJvd3Mge05vU2Vzc2lvbkZvdW5kRXJyb3J9IElmIHRoZSBzZXNzaW9uIGlzIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIG1ldGFkYXRhKCk6IFByb21pc2U8U2Vzc2lvbk1ldGFkYXRhPjtcblxuICAvKipcbiAgICogTG9hZCB0aGUgdG9rZW4gdG8gYmUgdXNlZCBmb3IgYSByZXF1ZXN0LiBUaGlzIHdpbGwgYmUgaW52b2tlZCBieSB0aGUgY2xpZW50XG4gICAqIHRvIHByb3ZpZGUgdGhlIEF1dGhvcml6YXRpb24gaGVhZGVyXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0b2tlblxuICAgKi9cbiAgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+O1xufVxuXG4vKipcbiAqIEFsbG93cyB0aGUgY29uc3RydWN0aW9uIG9mIGNsaWVudHMgd2hpY2ggZG8gbm90IGF1dG9tYXRpY2FsbHkgcmVmcmVzaFxuICogc2Vzc2lvbnMuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBtYW5hZ2VyID0gbmV3IE5vUmVmcmVzaFNlc3Npb25NYW5hZ2VyKHNlc3Npb25EYXRhKTtcbiAqIGNvbnN0IGNsaWVudCA9IGF3YWl0IEN1YmVTaWduZXJDbGllbnQuY3JlYXRlKG1hbmFnZXIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBOb1JlZnJlc2hTZXNzaW9uTWFuYWdlciBpbXBsZW1lbnRzIFNlc3Npb25NYW5hZ2VyIHtcbiAgI21ldGFkYXRhOiBTZXNzaW9uTWV0YWRhdGE7XG4gICN0b2tlbjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIHRoZSBtYW5hZ2VyIHdpdGggdGhlIHNlc3Npb24gZGF0YVxuICAgKlxuICAgKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBmb3IgdGhpcyBtYW5hZ2VyIHRvIHVzZVxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbjogU2Vzc2lvbkxpa2UpIHtcbiAgICBzZXNzaW9uID0gcGFyc2VTZXNzaW9uTGlrZShzZXNzaW9uKTtcbiAgICB0aGlzLiNtZXRhZGF0YSA9IG1ldGFkYXRhKHNlc3Npb24pO1xuICAgIHRoaXMuI3Rva2VuID0gc2Vzc2lvbi50b2tlbjtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBOb24tc2Vuc2l0aXZlIG1ldGFkYXRhIG9uIHRoZSBzZXNzaW9uICovXG4gIGFzeW5jIG1ldGFkYXRhKCkge1xuICAgIHJldHVybiB0aGlzLiNtZXRhZGF0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgdG9rZW4gdG8gdXNlIGZvciByZXF1ZXN0cyAqL1xuICBhc3luYyB0b2tlbigpIHtcbiAgICByZXR1cm4gdGhpcy4jdG9rZW47XG4gIH1cbn1cblxuLyoqXG4gKiBBIHRlbXBsYXRlIGZvciBzZXNzaW9uIG1hbmFnZXJzIHdoaWNoIGhhdmUgZXhjbHVzaXZlIGFjY2VzcyB0byBhIHNlc3Npb25cbiAqIGFuZCBjYW4gc3RvcmUvbG9hZCB0aGVtIGZyZWVseS5cbiAqXG4gKiBJdCBpcyBOT1Qgc3VpdGFibGUgZm9yIGFwcGxpY2F0aW9ucyB3aGVyZSBtdWx0aXBsZSBjbGllbnRzIGFyZSB1c2luZyB0aGUgc2FtZVxuICogc2Vzc2lvbiBhcyB0aGV5IHdpbGwgYm90aCBhdHRlbXB0IHRvIHJlZnJlc2ggaW5kZXBlbmRlbnRseS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEV4Y2x1c2l2ZVNlc3Npb25NYW5hZ2VyIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXIge1xuICAvKiogSWYgcHJlc2VudCwgdGhlIHNlc3Npb24gaXMgY3VycmVudGx5IHJlZnJlc2hpbmcuIEF3YWl0IHRvIGdldCB0aGUgZnJlc2hlc3QgU2Vzc2lvbkRhdGEgKi9cbiAgI3JlZnJlc2hpbmc/OiBQcm9taXNlPFNlc3Npb25EYXRhPjtcblxuICAvKipcbiAgICogUmV0cmlldmUgdGhlIFNlc3Npb25EYXRhIGZyb20gc3RvcmFnZVxuICAgKi9cbiAgYWJzdHJhY3QgcmV0cmlldmUoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT47XG5cbiAgLyoqXG4gICAqIFN0b3JlIHRoZSBTZXNzaW9uRGF0YSBpbnRvIHN0b3JhZ2VcbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIGRhdGEgdG8gc3RvcmVcbiAgICovXG4gIGFic3RyYWN0IHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHNlc3Npb24gbWV0YWRhdGEsIGxvYWRlZCBmcm9tIHN0b3JhZ2VcbiAgICovXG4gIG1ldGFkYXRhKCk6IFByb21pc2U8U2Vzc2lvbk1ldGFkYXRhPiB7XG4gICAgcmV0dXJuIHRoaXMucmV0cmlldmUoKS50aGVuKG1ldGFkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgdG9rZW4gbG9hZGVkIGZyb20gc3RvcmFnZSwgcmVmcmVzaGluZyBpZiBuZWNlc3NhcnlcbiAgICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMucmV0cmlldmUoKTtcblxuICAgIHRoaXMuI3JlZnJlc2hpbmcgPz89IHJlZnJlc2hJZk5lY2Vzc2FyeShkYXRhKVxuICAgICAgPy50aGVuKGFzeW5jIChkYXRhKSA9PiAoYXdhaXQgdGhpcy5zdG9yZShkYXRhKSwgZGF0YSkpXG4gICAgICA/LmZpbmFsbHkoKCkgPT4gKHRoaXMuI3JlZnJlc2hpbmcgPSB1bmRlZmluZWQpKTtcblxuICAgIC8vIFRlY2huaWNhbGx5LCBpbiBtYW55IGNhc2VzIHdlIHNob3VsZG4ndCBoYXZlIHRvIHdhaXQgZm9yIHRoZSByZWZyZXNoLFxuICAgIC8vIHRoZSBzZXNzaW9uIHdpbGwgc3RpbGwgYmUgdmFsaWQgZm9yIGEgd2hpbGUgYWZ0ZXIgdGhlIHJlZnJlc2ggc3RhcnRzLlxuICAgIC8vXG4gICAgLy8gSG93ZXZlciwgc29tZXRpbWVzIHRoZSBhdXRoIHRva2VuIHdpbGwgYmUgZW50aXJlbHkgZXhwaXJlZCwgc28gd2UgY29uc2VydmF0aXZlbHlcbiAgICAvLyB3YWl0IGZvciBhIHN1Y2Nlc3NmdWwgcmVmcmVzaFxuICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLiNyZWZyZXNoaW5nID8gYXdhaXQgdGhpcy4jcmVmcmVzaGluZyA6IGRhdGE7XG4gICAgcmV0dXJuIHNlc3Npb24udG9rZW47XG4gIH1cblxuICAvKipcbiAgICogTWFudWFsbHkgZm9yY2UgYSB0b2tlbiByZWZyZXNoXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSByZWZyZXNoZWQgc2Vzc2lvbiBkYXRhXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgZm9yY2VSZWZyZXNoKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICAvLyBJZiBub3QgY3VycmVudGx5IHJlZnJlc2hpbmcsIHN0YXJ0IHJlZnJlc2hpbmdcbiAgICB0aGlzLiNyZWZyZXNoaW5nID8/PSB0aGlzLnJldHJpZXZlKClcbiAgICAgIC50aGVuKHJlZnJlc2gpXG4gICAgICAudGhlbihhc3luYyAoZGF0YSkgPT4gKGF3YWl0IHRoaXMuc3RvcmUoZGF0YSksIGRhdGEpKVxuICAgICAgLmZpbmFsbHkoKCkgPT4gKHRoaXMuI3JlZnJlc2hpbmcgPSB1bmRlZmluZWQpKTtcblxuICAgIC8vIEJlY2F1c2Ugd2UgPz89IGFzc2lnbmVkIHRvIHJlZnJlc2hpbmcgYWJvdmUsIHdlJ3JlIGd1YXJhbnRlZWQgdG8gYmVcbiAgICAvLyBhY3RpdmVseSByZWZyZXNoaW5nLCBzbyBqdXN0IGF3YWl0IGl0LlxuICAgIHJldHVybiBhd2FpdCB0aGlzLiNyZWZyZXNoaW5nO1xuICB9XG59XG5cbi8qKiBJbXBsZW1lbnRzIGEgU2Vzc2lvbk1hbmFnZXIgd2l0aG91dCBwZXJzaXN0ZW5jZSAqL1xuZXhwb3J0IGNsYXNzIE1lbW9yeVNlc3Npb25NYW5hZ2VyIGV4dGVuZHMgRXhjbHVzaXZlU2Vzc2lvbk1hbmFnZXIge1xuICAvKiogVGhlIHNlc3Npb24gZGF0YSBjb250YWluaW5nIGJvdGggbWV0YWRhdGEgYW5kIHRva2VucyAqL1xuICAjZGF0YTogU2Vzc2lvbkRhdGE7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCB3aXRoIGRhdGEgaW4gbWVtb3J5XG4gICAqXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBpbml0aWFsIHNlc3Npb24gZGF0YVxuICAgKi9cbiAgY29uc3RydWN0b3IoZGF0YTogU2Vzc2lvbkRhdGEpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIHRoZSBpbi1tZW1vcnkgZGF0YSAqL1xuICBhc3luYyByZXRyaWV2ZSgpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogU3RvcmUgdGhlIGluLW1lbW9yeSBkYXRhXG4gICAqXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBzZXNzaW9uIGRhdGEgdG8gc3RvcmVcbiAgICovXG4gIGFzeW5jIHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKSB7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqIEFuIGVycm9yIHR5cGUgdG8gYmUgdGhyb3duIGJ5IFNlc3Npb25NYW5hZ2VyJ3Mgd2hlbiB0aGUgc2Vzc2lvbiBpcyB1bmF2YWlsYWJsZSAqL1xuZXhwb3J0IGNsYXNzIE5vU2Vzc2lvbkZvdW5kRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBDb25zdHJ1Y3RzIHRoZSBlcnJvciB3aXRoIHRoZSBhcHByb3ByaWF0ZSBtZXNzYWdlICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiTm8gc2Vzc2lvbiBhdmFpbGFibGUgZm9yIHRoZSBjbGllbnRcIik7XG4gIH1cbn1cblxuLyoqIFRoZSBudW1iZXIgb2Ygc2Vjb25kcyBiZWZvcmUgZXhwaXJhdGlvbiB0aW1lLCB0byBhdHRlbXB0IGEgcmVmcmVzaCAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDUyA9IDMwO1xuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IHJlZnJlc2hlcyBhIHNlc3Npb24gdXNpbmcgdGhlIEN1YmVTaWduZXIgQVBJIGlmIGl0IGlzIGNsb3NlXG4gKiB0byBleHBpcmluZy5cbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBkYXRhIHdoaWNoIG1heSByZXF1aXJlIGEgcmVmcmVzaFxuICogQHJldHVybnMgSW1tZWRpYXRlbHkgcmV0dXJucyB1bmRlZmluZWQgaWYgdGhlIHNlc3Npb24gZG9lcyBub3QgcmVxdWlyZSBhIHJlZnJlc2gsIGVsc2UgcmV0dXJuIGEgcmVmcmVzaGVkIHNlc3Npb25cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaElmTmVjZXNzYXJ5KHNlc3Npb246IFNlc3Npb25EYXRhKTogdW5kZWZpbmVkIHwgUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICBpZiAoIWlzU3RhbGUoc2Vzc2lvbikpIHJldHVybjtcbiAgcmV0dXJuIHJlZnJlc2goc2Vzc2lvbik7XG59XG5cbi8qKlxuICogSW52b2tlcyB0aGUgQ3ViZVNpZ25lciBBUEkgdG8gcmVmcmVzaCBhIHNlc3Npb25cbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbiBUaGUgQ3ViZVNpZ25lciBzZXNzaW9uIHRvIHJlZnJlc2hcbiAqIEByZXR1cm5zIEEgcmVmcmVzaGVkIHNlc3Npb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2goc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gIGNvbnN0IHsgZXBvY2g6IGVwb2NoX251bSwgZXBvY2hfdG9rZW4sIHJlZnJlc2hfdG9rZW46IG90aGVyX3Rva2VuIH0gPSBzZXNzaW9uLnNlc3Npb25faW5mbztcbiAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICBhcGlGZXRjaChcIi92MS9vcmcve29yZ19pZH0vdG9rZW4vcmVmcmVzaFwiLCBcInBhdGNoXCIsIHtcbiAgICAgIGJhc2VVcmw6IHNlc3Npb24uZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXS5TaWduZXJBcGlSb290LnJlcGxhY2UoL1xcLyQvLCBcIlwiKSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgb3JnX2lkOiBzZXNzaW9uLm9yZ19pZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246IHNlc3Npb24udG9rZW4sXG4gICAgICB9LFxuICAgICAgYm9keTogeyBlcG9jaF9udW0sIGVwb2NoX3Rva2VuLCBvdGhlcl90b2tlbiB9LFxuICAgIH0pLFxuICApXG4gICAgLnRoZW4oYXNzZXJ0T2spXG4gICAgLnRoZW4oKHJlcykgPT4gKHtcbiAgICAgIC4uLnNlc3Npb24sXG4gICAgICAuLi5yZXMsXG4gICAgICBvcmdfaWQ6IHNlc3Npb24ub3JnX2lkLFxuICAgIH0pKTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHNhZmUgbWV0YWRhdGEgZnJvbSBhIFNlc3Npb25EYXRhXG4gKlxuICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb25cbiAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIG1ldGFkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXRhZGF0YShzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IFNlc3Npb25NZXRhZGF0YSB7XG4gIGNvbnN0IHsgZW52LCBvcmdfaWQsIHJvbGVfaWQsIHB1cnBvc2UsIHNlc3Npb25fZXhwIH0gPSBzZXNzaW9uO1xuICByZXR1cm4ge1xuICAgIGVudixcbiAgICBvcmdfaWQsXG4gICAgcm9sZV9pZCxcbiAgICBwdXJwb3NlLFxuICAgIHNlc3Npb25faWQ6IHNlc3Npb24uc2Vzc2lvbl9pbmZvLnNlc3Npb25faWQsXG4gICAgc2Vzc2lvbl9leHAsXG4gICAgZXBvY2g6IHNlc3Npb24uc2Vzc2lvbl9pbmZvLmVwb2NoLFxuICB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB0aW1lSW5TZWNvbmRzIGFuIGVwb2NoIHRpbWVzdGFtcFxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHRpbWVzdGFtcCBpcyBiZWZvcmUgbm93ICsgREVGQVVMVF9FWFBJUkFUSU9OX0JVRkZFUl9TRUNTXG4gKi9cbmNvbnN0IGlzV2l0aGluQnVmZmVyID0gKHRpbWVJblNlY29uZHM6IG51bWJlcikgPT5cbiAgdGltZUluU2Vjb25kcyA8IERhdGUubm93KCkgLyAxMDAwICsgREVGQVVMVF9FWFBJUkFUSU9OX0JVRkZFUl9TRUNTO1xuXG5leHBvcnQgY29uc3QgaXNTdGFsZSA9IChzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IGJvb2xlYW4gPT5cbiAgaXNXaXRoaW5CdWZmZXIoc2Vzc2lvbi5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHApO1xuXG5leHBvcnQgY29uc3QgaXNSZWZyZXNoYWJsZSA9IChzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IGJvb2xlYW4gPT5cbiAgIWlzV2l0aGluQnVmZmVyKHNlc3Npb24uc2Vzc2lvbl9leHAgPz8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZKSAmJlxuICAhaXNXaXRoaW5CdWZmZXIoc2Vzc2lvbi5zZXNzaW9uX2luZm8ucmVmcmVzaF90b2tlbl9leHApO1xuXG4vKipcbiAqIFBhcnNlcyB0aGUgYmFzZTY0IEFQSSBzZXNzaW9uIHRva2VuLlxuICogQ29uc3VtZXMgdGhlIG91dHB1dCBvZiB0aGUgY2xpIGNvbW1hbmQ6XG4gKlxuICogYGBgXG4gKiBjcyB0b2tlbiBjcmVhdGUgLS1vdXRwdXQgYmFzZTY0XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbkRhdGFTdHJpbmcgQmFzZTY0IGVuY29kZWQgQVBJIHNlc3Npb24gdG9rZW4uXG4gKlxuICogQHJldHVybnMgc2Vzc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbkRhdGFTdHJpbmc6IHN0cmluZyk6IFNlc3Npb25EYXRhIHtcbiAgLy8gcGFyc2UgdG9rZW4sIHN0cmlwcGluZyB3aGl0ZXNwYWNlLlxuICBjb25zdCBzZWNyZXRCNjRUb2tlbiA9IHNlc3Npb25EYXRhU3RyaW5nLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoYXRvYihzZWNyZXRCNjRUb2tlbikpO1xuXG4gIC8vIEJhc2ljIHZhbGlkYXRpb24gb2YgdGhlIHNlc3Npb24gZGF0YSAoaS5lLiwgbW9zdCB0eXBlcyBvZiB0b3AgbGV2ZWwgZmllbGRzKVxuICBpZiAoIWRhdGEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZXNzaW9uIGlzIHVuZGVmaW5lZFwiKTtcbiAgfVxuICBpZiAodHlwZW9mIGRhdGEgIT09IFwib2JqZWN0XCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBzZXNzaW9uIHRvIGJlIGFuIG9iamVjdFwiKTtcbiAgfVxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIFtcIm9yZ19pZFwiLCBcInRva2VuXCJdKSB7XG4gICAgY29uc3QgZmllbGRUeXBlID0gdHlwZW9mIGRhdGFbZmllbGRdO1xuICAgIGlmIChmaWVsZFR5cGUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJHtmaWVsZH0gdG8gYmUgYSBzdHJpbmcsIGdvdCAke2ZpZWxkVHlwZX1gKTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBbXCJyb2xlX2lkXCIsIFwicHVycG9zZVwiXSkge1xuICAgIGNvbnN0IGZpZWxkVHlwZSA9IHR5cGVvZiBkYXRhW2ZpZWxkXTtcbiAgICBpZiAoZmllbGRUeXBlICE9PSBcInN0cmluZ1wiICYmIGRhdGFbZmllbGRdICE9PSB1bmRlZmluZWQgJiYgZGF0YVtmaWVsZF0gIT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJHtmaWVsZH0gdG8gYmUgYSBzdHJpbmcgb3IgdW5kZWZpbmVkLCBnb3QgJHtmaWVsZFR5cGV9YCk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgZmllbGQgb2YgW1wic2Vzc2lvbl9pbmZvXCIsIFwiZW52XCJdKSB7XG4gICAgY29uc3QgZmllbGRUeXBlID0gdHlwZW9mIGRhdGFbZmllbGRdO1xuICAgIGlmIChmaWVsZFR5cGUgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJHtmaWVsZH0gdG8gYmUgYW4gb2JqZWN0LCBnb3QgJHtmaWVsZFR5cGV9YCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29tcHV0ZSBgcmVmcmVzaF90b2tlbmAgZm9yIG9sZCBzZXNzaW9ucyB0aGF0IG1heSBub3QgaGF2ZSBpdCBzZXRcbiAgY29uc3QgaW5mbyA9IGRhdGFbXCJzZXNzaW9uX2luZm9cIl0gYXMgQ2xpZW50U2Vzc2lvbkluZm87XG4gIGNvbnN0IHJlZnJlc2hUb2tlbiA9IGRhdGFbXCJyZWZyZXNoX3Rva2VuXCJdO1xuICBjb25zdCByZWZyZXNoVG9rZW5Gcm9tSW5mbyA9IHNlcmlhbGl6ZVJlZnJlc2hUb2tlbihpbmZvKTtcbiAgaWYgKHJlZnJlc2hUb2tlbiA9PT0gbnVsbCB8fCByZWZyZXNoVG9rZW4gPT09IHVuZGVmaW5lZCkge1xuICAgIGRhdGFbXCJyZWZyZXNoX3Rva2VuXCJdID0gcmVmcmVzaFRva2VuRnJvbUluZm87XG4gIH1cblxuICByZXR1cm4gZGF0YSBhcyBTZXNzaW9uRGF0YTtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIGEgcmVmcmVzaCB0b2tlbiBmcm9tIHNlc3Npb24gaW5mb3JtYXRpb24uIFRoZSByZXN1bHQgaXMgYSB2YWxpZCBPQXV0aCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0gaW5mbyBTZXNzaW9uIGluZm9ybWF0aW9uXG4gKiBAcmV0dXJucyBBIHJlZnJlc2ggdG9rZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVJlZnJlc2hUb2tlbihpbmZvOiBDbGllbnRTZXNzaW9uSW5mbyk6IHN0cmluZyB7XG4gIGNvbnN0IHNlc3Npb25JZFNlciA9IGJ0b2EoaW5mby5zZXNzaW9uX2lkKTtcbiAgY29uc3QgYXV0aERhdGEgPSBidG9hKFxuICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIGVwb2NoX251bTogaW5mby5lcG9jaCxcbiAgICAgIGVwb2NoX3Rva2VuOiBpbmZvLmVwb2NoX3Rva2VuLFxuICAgICAgb3RoZXJfdG9rZW46IGluZm8uYXV0aF90b2tlbixcbiAgICB9KSxcbiAgKTtcbiAgcmV0dXJuIGAke0NVQkVTSUdORVJfUFJFRklYfSR7c2Vzc2lvbklkU2VyfS4ke2F1dGhEYXRhfS4ke2luZm8ucmVmcmVzaF90b2tlbn1gO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgc2Vzc2lvbiBkYXRhIHRvIGJhc2U2NC5cbiAqXG4gKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBkYXRhIHRvIHNlcmlhbGl6ZVxuICogQHJldHVybnMgVGhlIHNlcmlhbGl6ZWQgZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBzdHJpbmcge1xuICByZXR1cm4gYnRvYShKU09OLnN0cmluZ2lmeShzZXNzaW9uKSk7XG59XG4iXX0=