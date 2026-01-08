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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvc2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFxREEsNENBRUM7QUF3TUQsMEJBc0JDO0FBUUQsNEJBV0M7QUE0QkQsd0RBd0NDO0FBUUQsc0RBVUM7QUFRRCxnRUFFQztBQXZZRCxvQ0FBOEM7QUFDOUMsb0NBQXNDO0FBR3RDLDhDQUE4QztBQUM5QyxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQztBQXdDdkM7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBb0I7SUFDbkQsT0FBTyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDakYsQ0FBQztBQXFDRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFhLHVCQUF1QjtJQUlsQzs7OztPQUlHO0lBQ0gsWUFBWSxPQUFvQjtRQVJoQyxvREFBMkI7UUFDM0IsaURBQWU7UUFRYixPQUFPLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEMsdUJBQUEsSUFBSSxxQ0FBYSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQUEsQ0FBQztRQUNuQyx1QkFBQSxJQUFJLGtDQUFVLE9BQU8sQ0FBQyxLQUFLLE1BQUEsQ0FBQztJQUM5QixDQUFDO0lBRUQscURBQXFEO0lBQ3JELEtBQUssQ0FBQyxRQUFRO1FBQ1osT0FBTyx1QkFBQSxJQUFJLHlDQUFVLENBQUM7SUFDeEIsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxLQUFLLENBQUMsS0FBSztRQUNULE9BQU8sdUJBQUEsSUFBSSxzQ0FBTyxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQXhCRCwwREF3QkM7O0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBc0IsdUJBQXVCO0lBQTdDO1FBQ0UsNkZBQTZGO1FBQzdGLHNEQUFtQztJQXlEckMsQ0FBQztJQTNDQzs7T0FFRztJQUNILFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVuQyw0SUFBcUIsa0JBQWtCLENBQUMsSUFBSSxDQUFDO1lBQzNDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsdUJBQUEsSUFBSSx1Q0FBZSxTQUFTLE1BQUEsQ0FBQyxDQUFDLE1BQUEsQ0FBQztRQUVsRCx3RUFBd0U7UUFDeEUsd0VBQXdFO1FBQ3hFLEVBQUU7UUFDRixtRkFBbUY7UUFDbkYsZ0NBQWdDO1FBQ2hDLE1BQU0sT0FBTyxHQUFHLHVCQUFBLElBQUksMkNBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSx1QkFBQSxJQUFJLDJDQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNqRSxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFlBQVk7UUFDaEIsZ0RBQWdEO1FBQ2hELDRJQUFxQixJQUFJLENBQUMsUUFBUSxFQUFFO2FBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUM7YUFDYixJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDcEQsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsdUJBQUEsSUFBSSx1Q0FBZSxTQUFTLE1BQUEsQ0FBQyxDQUFDLE1BQUEsQ0FBQztRQUVqRCxzRUFBc0U7UUFDdEUseUNBQXlDO1FBQ3pDLE9BQU8sTUFBTSx1QkFBQSxJQUFJLDJDQUFZLENBQUM7SUFDaEMsQ0FBQztDQUNGO0FBM0RELDBEQTJEQzs7QUFFRCxzREFBc0Q7QUFDdEQsTUFBYSxvQkFBcUIsU0FBUSx1QkFBdUI7SUFJL0Q7Ozs7T0FJRztJQUNILFlBQVksSUFBaUI7UUFDM0IsS0FBSyxFQUFFLENBQUM7UUFUViwyREFBMkQ7UUFDM0QsNkNBQW1CO1FBU2pCLHVCQUFBLElBQUksOEJBQVMsSUFBSSxNQUFBLENBQUM7SUFDcEIsQ0FBQztJQUVELGtDQUFrQztJQUNsQyxLQUFLLENBQUMsUUFBUTtRQUNaLE9BQU8sdUJBQUEsSUFBSSxrQ0FBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFpQjtRQUMzQix1QkFBQSxJQUFJLDhCQUFTLElBQUksTUFBQSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQTNCRCxvREEyQkM7O0FBRUQscUZBQXFGO0FBQ3JGLE1BQWEsbUJBQW9CLFNBQVEsS0FBSztJQUM1Qyx3REFBd0Q7SUFDeEQ7UUFDRSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBQ0Y7QUFMRCxrREFLQztBQUVELHlFQUF5RTtBQUM1RCxRQUFBLDhCQUE4QixHQUFHLEVBQUUsQ0FBQztBQUVqRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLGtCQUFrQixDQUFDLE9BQW9CO0lBQzlDLElBQUksQ0FBQyxJQUFBLGVBQU8sRUFBQyxPQUFPLENBQUM7UUFBRSxPQUFPO0lBQzlCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLE9BQU8sQ0FBQyxPQUFvQjtJQUMxQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUM7SUFDM0YsT0FBTyxJQUFBLGtCQUFVLEVBQUMsR0FBRyxFQUFFLENBQ3JCLElBQUEsZ0JBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxPQUFPLEVBQUU7UUFDbEQsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7UUFDNUUsTUFBTSxFQUFFO1lBQ04sSUFBSSxFQUFFO2dCQUNKLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTthQUN2QjtTQUNGO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsYUFBYSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1NBQzdCO1FBQ0QsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7S0FDOUMsQ0FBQyxDQUNIO1NBQ0UsSUFBSSxDQUFDLGdCQUFRLENBQUM7U0FDZCxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDZCxHQUFHLE9BQU87UUFDVixHQUFHLEdBQUc7UUFDTixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07S0FDdkIsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixRQUFRLENBQUMsT0FBb0I7SUFDM0MsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBRyxPQUFPLENBQUM7SUFDL0QsT0FBTztRQUNMLEdBQUc7UUFDSCxNQUFNO1FBQ04sT0FBTztRQUNQLE9BQU87UUFDUCxVQUFVLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxVQUFVO1FBQzNDLFdBQVc7UUFDWCxLQUFLLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLO0tBQ2xDLENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxjQUFjLEdBQUcsQ0FBQyxhQUFxQixFQUFFLEVBQUUsQ0FDL0MsYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsc0NBQThCLENBQUM7QUFFOUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFvQixFQUFXLEVBQUUsQ0FDdkQsY0FBYyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7QUFEekMsUUFBQSxPQUFPLFdBQ2tDO0FBRS9DLE1BQU0sYUFBYSxHQUFHLENBQUMsT0FBb0IsRUFBVyxFQUFFLENBQzdELENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDO0lBQ2hFLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUY3QyxRQUFBLGFBQWEsaUJBRWdDO0FBRTFEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsU0FBZ0Isc0JBQXNCLENBQUMsaUJBQXlCO0lBQzlELHFDQUFxQztJQUNyQyxNQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFFOUMsOEVBQThFO0lBQzlFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBQ0QsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUNELEtBQUssTUFBTSxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUN4QyxNQUFNLFNBQVMsR0FBRyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxJQUFJLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksS0FBSyx3QkFBd0IsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUN4RSxDQUFDO0lBQ0gsQ0FBQztJQUNELEtBQUssTUFBTSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFNBQVMsR0FBRyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxJQUFJLFNBQVMsS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDaEYsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLEtBQUsscUNBQXFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDckYsQ0FBQztJQUNILENBQUM7SUFDRCxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDNUMsTUFBTSxTQUFTLEdBQUcsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsSUFBSSxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLEtBQUsseUJBQXlCLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDekUsQ0FBQztJQUNILENBQUM7SUFFRCxvRUFBb0U7SUFDcEUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBc0IsQ0FBQztJQUN2RCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDM0MsTUFBTSxvQkFBb0IsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6RCxJQUFJLFlBQVksS0FBSyxJQUFJLElBQUksWUFBWSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3hELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxvQkFBb0IsQ0FBQztJQUMvQyxDQUFDO0lBRUQsT0FBTyxJQUFtQixDQUFDO0FBQzdCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLHFCQUFxQixDQUFDLElBQXVCO0lBQzNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2IsU0FBUyxFQUFFLElBQUksQ0FBQyxLQUFLO1FBQ3JCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztRQUM3QixXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVU7S0FDN0IsQ0FBQyxDQUNILENBQUM7SUFDRixPQUFPLEdBQUcsaUJBQWlCLEdBQUcsWUFBWSxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7QUFDakYsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsMEJBQTBCLENBQUMsT0FBb0I7SUFDN0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSwgU3RhY2tOYW1lIH0gZnJvbSBcIi4uL2VudlwiO1xuaW1wb3J0IHsgYXBpRmV0Y2gsIGFzc2VydE9rIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyByZXRyeU9uNVhYIH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgdHlwZSB7IENsaWVudFNlc3Npb25JbmZvIH0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuXG4vKiogUHJlZml4IHVzZWQgZm9yIEN1YmVTaWduZXIgT0F1dGggdG9rZW5zICovXG5jb25zdCBDVUJFU0lHTkVSX1BSRUZJWCA9IFwiM2Q2ZmQ3Mzk3OlwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25MaWZldGltZSB7XG4gIC8qKiBTZXNzaW9uIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIHdlZWsgKDYwNDgwMCkuICovXG4gIHNlc3Npb24/OiBudW1iZXI7XG4gIC8qKiBBdXRoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gZml2ZSBtaW51dGVzICgzMDApLiAqL1xuICBhdXRoPzogbnVtYmVyO1xuICAvKiogUmVmcmVzaCB0b2tlbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIG9uZSBkYXkgKDg2NDAwKS4gKi9cbiAgcmVmcmVzaD86IG51bWJlcjtcbiAgLyoqIEdyYWNlIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gMzAgc2Vjb25kcyAoMzApLiAqL1xuICBncmFjZT86IG51bWJlcjtcbn1cblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIEN1YmVTaWduZXIgc2Vzc2lvbiBmaWxlIGZvcm1hdCAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uRGF0YSB7XG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIElEICovXG4gIG9yZ19pZDogc3RyaW5nO1xuICAvKiogVGhlIHJvbGUgSUQgKi9cbiAgcm9sZV9pZD86IHN0cmluZyB8IG51bGw7XG4gIC8qKiBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvbiB0b2tlbiAqL1xuICBwdXJwb3NlPzogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIFRoZSB0b2tlbiB0byBpbmNsdWRlIGluIEF1dGhvcml6YXRpb24gaGVhZGVyICovXG4gIHRva2VuOiBzdHJpbmc7XG4gIC8qKiBUaGUgdG9rZW4gdG8gdXNlIHRvIHJlZnJlc2ggdGhlIHNlc3Npb24gKi9cbiAgcmVmcmVzaF90b2tlbjogc3RyaW5nO1xuICAvKiogU2Vzc2lvbiBpbmZvICovXG4gIHNlc3Npb25faW5mbzogQ2xpZW50U2Vzc2lvbkluZm87XG4gIC8qKiBTZXNzaW9uIGV4cGlyYXRpb24gKGluIHNlY29uZHMgc2luY2UgVU5JWCBlcG9jaCkgYmV5b25kIHdoaWNoIGl0IGNhbm5vdCBiZSByZWZyZXNoZWQgKi9cbiAgc2Vzc2lvbl9leHA6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQ7IC8vIG1heSBiZSBtaXNzaW5nIGluIGxlZ2FjeSBzZXNzaW9uIGZpbGVzXG4gIC8qKiBBdmFpbGFibGUgcmVnaW9uYWwgZW52aXJvbm1lbnQgcGFyYW1ldGVycyAqL1xuICBlbnY6IFJlY29yZDxTdGFja05hbWUsIEVudkludGVyZmFjZT47XG59XG5cbi8vIFJhdGhlciB0aGFuIGp1c3QgZG9pbmcgYSBzaW1wbGUgUGljaywgd2UgZ28gdGhlIGV4dHJhIG1pbGUgdG8gZW5zdXJlIHRoYXRcbi8vIGFueSBtZXRhZGF0YSBvYmplY3QgTVVTVCBORVZFUiBpbmNsdWRlIHNlbnNpdGl2ZSBpbmZvcm1hdGlvblxudHlwZSBTYWZlU2Vzc2lvbkRhdGFGaWVsZHMgPSBcImVudlwiIHwgXCJvcmdfaWRcIiB8IFwicm9sZV9pZFwiIHwgXCJwdXJwb3NlXCIgfCBcInNlc3Npb25fZXhwXCI7XG5cbi8qKiBSZXByZXNlbnRzIGVpdGhlciB0aGUgU2Vzc2lvbkRhdGEgb3IgYSBiYXNlNjQgSlNPTiBlbmNvZGluZyBvZiBpdCAqL1xuZXhwb3J0IHR5cGUgU2Vzc2lvbkxpa2UgPSBzdHJpbmcgfCBTZXNzaW9uRGF0YTtcblxuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgcGFyc2VzIGJhc2U2NCBlbmNvZGVkIFNlc3Npb25EYXRhLCBpZiBuZWNlc3NhcnkuXG4gKiBUaGlzIGFsbG93cyBTZXNzaW9uTWFuYWdlcnMgdG8gZWFzaWx5IGluZ2VzdCB0aGUgbXVsdGlwbGUgc3VwcG9ydGVkIGZvcm1hdHMgZm9yIHNlc3Npb25zLlxuICpcbiAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIG9iamVjdCBvciBlbmNvZGluZ1xuICogQHJldHVybnMgVGhlIHNlc3Npb24gb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlc3Npb25MaWtlKHNlc3Npb246IFNlc3Npb25MaWtlKSB7XG4gIHJldHVybiB0eXBlb2Ygc2Vzc2lvbiA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbikgOiBzZXNzaW9uO1xufVxuXG4vKiogTm9uLXNlbnNpdGl2ZSBpbmZvIGFib3V0IGEgc2Vzc2lvbiAqL1xuZXhwb3J0IHR5cGUgU2Vzc2lvbk1ldGFkYXRhID0gUGljazxTZXNzaW9uRGF0YSwgU2FmZVNlc3Npb25EYXRhRmllbGRzPiAmIHtcbiAgW0sgaW4gRXhjbHVkZTxrZXlvZiBTZXNzaW9uRGF0YSwgU2FmZVNlc3Npb25EYXRhRmllbGRzPl0/OiBuZXZlcjtcbn0gJiB7IHNlc3Npb25faWQ6IHN0cmluZzsgZXBvY2g6IG51bWJlciB9O1xuXG4vKipcbiAqIEEgU2Vzc2lvbk1hbmFnZXIncyBqb2IgaXMgdG8gaGFuZGxlIHNlc3Npb24gcGVyc2lzdGVuY2UgYW5kIHJlZnJlc2hlc1xuICpcbiAqIFRoZSBpbnRlcmZhY2UgZG9lcyBub3QgaW1wb3NlICp3aGVuKiBhIHJlZnJlc2ggbXVzdCBvY2N1ciwgdGhvdWdoIHR5cGljYWxseVxuICogdGhpcyB3aWxsIGJlIG9uIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbk1hbmFnZXIge1xuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGlmIGEgcmVxdWVzdCBmYWlsZWQgZHVlIHRvIGFuIGludmFsaWQgdG9rZW4uXG4gICAqL1xuICBvbkludmFsaWRUb2tlbj86ICgpID0+IHZvaWQ7XG5cbiAgLyoqXG4gICAqIExvYWQgdGhlIG1ldGFkYXRhIGZvciB0aGUgc2Vzc2lvbi4gU2hvdWxkIHRocm93IGlmIG5vdCBhdmFpbGFibGVcbiAgICpcbiAgICogQHJldHVybnMgSW5mbyBhYm91dCB0aGUgc2Vzc2lvblxuICAgKlxuICAgKiBAdGhyb3dzIHtOb1Nlc3Npb25Gb3VuZEVycm9yfSBJZiB0aGUgc2Vzc2lvbiBpcyBub3QgYXZhaWxhYmxlXG4gICAqL1xuICBtZXRhZGF0YSgpOiBQcm9taXNlPFNlc3Npb25NZXRhZGF0YT47XG5cbiAgLyoqXG4gICAqIExvYWQgdGhlIHRva2VuIHRvIGJlIHVzZWQgZm9yIGEgcmVxdWVzdC4gVGhpcyB3aWxsIGJlIGludm9rZWQgYnkgdGhlIGNsaWVudFxuICAgKiB0byBwcm92aWRlIHRoZSBBdXRob3JpemF0aW9uIGhlYWRlclxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdG9rZW5cbiAgICovXG4gIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPjtcbn1cblxuLyoqXG4gKiBBbGxvd3MgdGhlIGNvbnN0cnVjdGlvbiBvZiBjbGllbnRzIHdoaWNoIGRvIG5vdCBhdXRvbWF0aWNhbGx5IHJlZnJlc2hcbiAqIHNlc3Npb25zLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgbWFuYWdlciA9IG5ldyBOb1JlZnJlc2hTZXNzaW9uTWFuYWdlcihzZXNzaW9uRGF0YSk7XG4gKiBjb25zdCBjbGllbnQgPSBhd2FpdCBDdWJlU2lnbmVyQ2xpZW50LmNyZWF0ZShtYW5hZ2VyKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgTm9SZWZyZXNoU2Vzc2lvbk1hbmFnZXIgaW1wbGVtZW50cyBTZXNzaW9uTWFuYWdlciB7XG4gICNtZXRhZGF0YTogU2Vzc2lvbk1ldGFkYXRhO1xuICAjdG9rZW46IHN0cmluZztcblxuICAvKipcbiAgICogQ29uc3RydWN0cyB0aGUgbWFuYWdlciB3aXRoIHRoZSBzZXNzaW9uIGRhdGFcbiAgICpcbiAgICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gZm9yIHRoaXMgbWFuYWdlciB0byB1c2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb246IFNlc3Npb25MaWtlKSB7XG4gICAgc2Vzc2lvbiA9IHBhcnNlU2Vzc2lvbkxpa2Uoc2Vzc2lvbik7XG4gICAgdGhpcy4jbWV0YWRhdGEgPSBtZXRhZGF0YShzZXNzaW9uKTtcbiAgICB0aGlzLiN0b2tlbiA9IHNlc3Npb24udG9rZW47XG4gIH1cblxuICAvKiogQHJldHVybnMgTm9uLXNlbnNpdGl2ZSBtZXRhZGF0YSBvbiB0aGUgc2Vzc2lvbiAqL1xuICBhc3luYyBtZXRhZGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy4jbWV0YWRhdGE7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHRva2VuIHRvIHVzZSBmb3IgcmVxdWVzdHMgKi9cbiAgYXN5bmMgdG9rZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuI3Rva2VuO1xuICB9XG59XG5cbi8qKlxuICogQSB0ZW1wbGF0ZSBmb3Igc2Vzc2lvbiBtYW5hZ2VycyB3aGljaCBoYXZlIGV4Y2x1c2l2ZSBhY2Nlc3MgdG8gYSBzZXNzaW9uXG4gKiBhbmQgY2FuIHN0b3JlL2xvYWQgdGhlbSBmcmVlbHkuXG4gKlxuICogSXQgaXMgTk9UIHN1aXRhYmxlIGZvciBhcHBsaWNhdGlvbnMgd2hlcmUgbXVsdGlwbGUgY2xpZW50cyBhcmUgdXNpbmcgdGhlIHNhbWVcbiAqIHNlc3Npb24gYXMgdGhleSB3aWxsIGJvdGggYXR0ZW1wdCB0byByZWZyZXNoIGluZGVwZW5kZW50bHkuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciBpbXBsZW1lbnRzIFNlc3Npb25NYW5hZ2VyIHtcbiAgLyoqIElmIHByZXNlbnQsIHRoZSBzZXNzaW9uIGlzIGN1cnJlbnRseSByZWZyZXNoaW5nLiBBd2FpdCB0byBnZXQgdGhlIGZyZXNoZXN0IFNlc3Npb25EYXRhICovXG4gICNyZWZyZXNoaW5nPzogUHJvbWlzZTxTZXNzaW9uRGF0YT47XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBTZXNzaW9uRGF0YSBmcm9tIHN0b3JhZ2VcbiAgICovXG4gIGFic3RyYWN0IHJldHJpZXZlKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+O1xuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgU2Vzc2lvbkRhdGEgaW50byBzdG9yYWdlXG4gICAqXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBkYXRhIHRvIHN0b3JlXG4gICAqL1xuICBhYnN0cmFjdCBzdG9yZShkYXRhOiBTZXNzaW9uRGF0YSk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIG1ldGFkYXRhLCBsb2FkZWQgZnJvbSBzdG9yYWdlXG4gICAqL1xuICBtZXRhZGF0YSgpOiBQcm9taXNlPFNlc3Npb25NZXRhZGF0YT4ge1xuICAgIHJldHVybiB0aGlzLnJldHJpZXZlKCkudGhlbihtZXRhZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHRva2VuIGxvYWRlZCBmcm9tIHN0b3JhZ2UsIHJlZnJlc2hpbmcgaWYgbmVjZXNzYXJ5XG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLnJldHJpZXZlKCk7XG5cbiAgICB0aGlzLiNyZWZyZXNoaW5nID8/PSByZWZyZXNoSWZOZWNlc3NhcnkoZGF0YSlcbiAgICAgID8udGhlbihhc3luYyAoZGF0YSkgPT4gKGF3YWl0IHRoaXMuc3RvcmUoZGF0YSksIGRhdGEpKVxuICAgICAgPy5maW5hbGx5KCgpID0+ICh0aGlzLiNyZWZyZXNoaW5nID0gdW5kZWZpbmVkKSk7XG5cbiAgICAvLyBUZWNobmljYWxseSwgaW4gbWFueSBjYXNlcyB3ZSBzaG91bGRuJ3QgaGF2ZSB0byB3YWl0IGZvciB0aGUgcmVmcmVzaCxcbiAgICAvLyB0aGUgc2Vzc2lvbiB3aWxsIHN0aWxsIGJlIHZhbGlkIGZvciBhIHdoaWxlIGFmdGVyIHRoZSByZWZyZXNoIHN0YXJ0cy5cbiAgICAvL1xuICAgIC8vIEhvd2V2ZXIsIHNvbWV0aW1lcyB0aGUgYXV0aCB0b2tlbiB3aWxsIGJlIGVudGlyZWx5IGV4cGlyZWQsIHNvIHdlIGNvbnNlcnZhdGl2ZWx5XG4gICAgLy8gd2FpdCBmb3IgYSBzdWNjZXNzZnVsIHJlZnJlc2hcbiAgICBjb25zdCBzZXNzaW9uID0gdGhpcy4jcmVmcmVzaGluZyA/IGF3YWl0IHRoaXMuI3JlZnJlc2hpbmcgOiBkYXRhO1xuICAgIHJldHVybiBzZXNzaW9uLnRva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hbnVhbGx5IGZvcmNlIGEgdG9rZW4gcmVmcmVzaFxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgcmVmcmVzaGVkIHNlc3Npb24gZGF0YVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGZvcmNlUmVmcmVzaCgpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgLy8gSWYgbm90IGN1cnJlbnRseSByZWZyZXNoaW5nLCBzdGFydCByZWZyZXNoaW5nXG4gICAgdGhpcy4jcmVmcmVzaGluZyA/Pz0gdGhpcy5yZXRyaWV2ZSgpXG4gICAgICAudGhlbihyZWZyZXNoKVxuICAgICAgLnRoZW4oYXN5bmMgKGRhdGEpID0+IChhd2FpdCB0aGlzLnN0b3JlKGRhdGEpLCBkYXRhKSlcbiAgICAgIC5maW5hbGx5KCgpID0+ICh0aGlzLiNyZWZyZXNoaW5nID0gdW5kZWZpbmVkKSk7XG5cbiAgICAvLyBCZWNhdXNlIHdlID8/PSBhc3NpZ25lZCB0byByZWZyZXNoaW5nIGFib3ZlLCB3ZSdyZSBndWFyYW50ZWVkIHRvIGJlXG4gICAgLy8gYWN0aXZlbHkgcmVmcmVzaGluZywgc28ganVzdCBhd2FpdCBpdC5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jcmVmcmVzaGluZztcbiAgfVxufVxuXG4vKiogSW1wbGVtZW50cyBhIFNlc3Npb25NYW5hZ2VyIHdpdGhvdXQgcGVyc2lzdGVuY2UgKi9cbmV4cG9ydCBjbGFzcyBNZW1vcnlTZXNzaW9uTWFuYWdlciBleHRlbmRzIEV4Y2x1c2l2ZVNlc3Npb25NYW5hZ2VyIHtcbiAgLyoqIFRoZSBzZXNzaW9uIGRhdGEgY29udGFpbmluZyBib3RoIG1ldGFkYXRhIGFuZCB0b2tlbnMgKi9cbiAgI2RhdGE6IFNlc3Npb25EYXRhO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Qgd2l0aCBkYXRhIGluIG1lbW9yeVxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgaW5pdGlhbCBzZXNzaW9uIGRhdGFcbiAgICovXG4gIGNvbnN0cnVjdG9yKGRhdGE6IFNlc3Npb25EYXRhKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyB0aGUgaW4tbWVtb3J5IGRhdGEgKi9cbiAgYXN5bmMgcmV0cmlldmUoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3JlIHRoZSBpbi1tZW1vcnkgZGF0YVxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgc2Vzc2lvbiBkYXRhIHRvIHN0b3JlXG4gICAqL1xuICBhc3luYyBzdG9yZShkYXRhOiBTZXNzaW9uRGF0YSkge1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKiBBbiBlcnJvciB0eXBlIHRvIGJlIHRocm93biBieSBTZXNzaW9uTWFuYWdlcidzIHdoZW4gdGhlIHNlc3Npb24gaXMgdW5hdmFpbGFibGUgKi9cbmV4cG9ydCBjbGFzcyBOb1Nlc3Npb25Gb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKiogQ29uc3RydWN0cyB0aGUgZXJyb3Igd2l0aCB0aGUgYXBwcm9wcmlhdGUgbWVzc2FnZSAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIk5vIHNlc3Npb24gYXZhaWxhYmxlIGZvciB0aGUgY2xpZW50XCIpO1xuICB9XG59XG5cbi8qKiBUaGUgbnVtYmVyIG9mIHNlY29uZHMgYmVmb3JlIGV4cGlyYXRpb24gdGltZSwgdG8gYXR0ZW1wdCBhIHJlZnJlc2ggKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1MgPSAzMDtcblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCByZWZyZXNoZXMgYSBzZXNzaW9uIHVzaW5nIHRoZSBDdWJlU2lnbmVyIEFQSSBpZiBpdCBpcyBjbG9zZVxuICogdG8gZXhwaXJpbmcuXG4gKlxuICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gZGF0YSB3aGljaCBtYXkgcmVxdWlyZSBhIHJlZnJlc2hcbiAqIEByZXR1cm5zIEltbWVkaWF0ZWx5IHJldHVybnMgdW5kZWZpbmVkIGlmIHRoZSBzZXNzaW9uIGRvZXMgbm90IHJlcXVpcmUgYSByZWZyZXNoLCBlbHNlIHJldHVybiBhIHJlZnJlc2hlZCBzZXNzaW9uXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hJZk5lY2Vzc2FyeShzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IHVuZGVmaW5lZCB8IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgaWYgKCFpc1N0YWxlKHNlc3Npb24pKSByZXR1cm47XG4gIHJldHVybiByZWZyZXNoKHNlc3Npb24pO1xufVxuXG4vKipcbiAqIEludm9rZXMgdGhlIEN1YmVTaWduZXIgQVBJIHRvIHJlZnJlc2ggYSBzZXNzaW9uXG4gKlxuICogQHBhcmFtIHNlc3Npb24gVGhlIEN1YmVTaWduZXIgc2Vzc2lvbiB0byByZWZyZXNoXG4gKiBAcmV0dXJucyBBIHJlZnJlc2hlZCBzZXNzaW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoKHNlc3Npb246IFNlc3Npb25EYXRhKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICBjb25zdCB7IGVwb2NoOiBlcG9jaF9udW0sIGVwb2NoX3Rva2VuLCByZWZyZXNoX3Rva2VuOiBvdGhlcl90b2tlbiB9ID0gc2Vzc2lvbi5zZXNzaW9uX2luZm87XG4gIHJldHVybiByZXRyeU9uNVhYKCgpID0+XG4gICAgYXBpRmV0Y2goXCIvdjEvb3JnL3tvcmdfaWR9L3Rva2VuL3JlZnJlc2hcIiwgXCJwYXRjaFwiLCB7XG4gICAgICBiYXNlVXJsOiBzZXNzaW9uLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0uU2lnbmVyQXBpUm9vdC5yZXBsYWNlKC9cXC8kLywgXCJcIiksXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIG9yZ19pZDogc2Vzc2lvbi5vcmdfaWQsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiBzZXNzaW9uLnRva2VuLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IHsgZXBvY2hfbnVtLCBlcG9jaF90b2tlbiwgb3RoZXJfdG9rZW4gfSxcbiAgICB9KSxcbiAgKVxuICAgIC50aGVuKGFzc2VydE9rKVxuICAgIC50aGVuKChyZXMpID0+ICh7XG4gICAgICAuLi5zZXNzaW9uLFxuICAgICAgLi4ucmVzLFxuICAgICAgb3JnX2lkOiBzZXNzaW9uLm9yZ19pZCxcbiAgICB9KSk7XG59XG5cbi8qKlxuICogR2V0IHRoZSBzYWZlIG1ldGFkYXRhIGZyb20gYSBTZXNzaW9uRGF0YVxuICpcbiAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uXG4gKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBtZXRhZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWV0YWRhdGEoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBTZXNzaW9uTWV0YWRhdGEge1xuICBjb25zdCB7IGVudiwgb3JnX2lkLCByb2xlX2lkLCBwdXJwb3NlLCBzZXNzaW9uX2V4cCB9ID0gc2Vzc2lvbjtcbiAgcmV0dXJuIHtcbiAgICBlbnYsXG4gICAgb3JnX2lkLFxuICAgIHJvbGVfaWQsXG4gICAgcHVycG9zZSxcbiAgICBzZXNzaW9uX2lkOiBzZXNzaW9uLnNlc3Npb25faW5mby5zZXNzaW9uX2lkLFxuICAgIHNlc3Npb25fZXhwLFxuICAgIGVwb2NoOiBzZXNzaW9uLnNlc3Npb25faW5mby5lcG9jaCxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gdGltZUluU2Vjb25kcyBhbiBlcG9jaCB0aW1lc3RhbXBcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB0aW1lc3RhbXAgaXMgYmVmb3JlIG5vdyArIERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDU1xuICovXG5jb25zdCBpc1dpdGhpbkJ1ZmZlciA9ICh0aW1lSW5TZWNvbmRzOiBudW1iZXIpID0+XG4gIHRpbWVJblNlY29uZHMgPCBEYXRlLm5vdygpIC8gMTAwMCArIERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDUztcblxuZXhwb3J0IGNvbnN0IGlzU3RhbGUgPSAoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBib29sZWFuID0+XG4gIGlzV2l0aGluQnVmZmVyKHNlc3Npb24uc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwKTtcblxuZXhwb3J0IGNvbnN0IGlzUmVmcmVzaGFibGUgPSAoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBib29sZWFuID0+XG4gICFpc1dpdGhpbkJ1ZmZlcihzZXNzaW9uLnNlc3Npb25fZXhwID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSkgJiZcbiAgIWlzV2l0aGluQnVmZmVyKHNlc3Npb24uc2Vzc2lvbl9pbmZvLnJlZnJlc2hfdG9rZW5fZXhwKTtcblxuLyoqXG4gKiBQYXJzZXMgdGhlIGJhc2U2NCBBUEkgc2Vzc2lvbiB0b2tlbi5cbiAqIENvbnN1bWVzIHRoZSBvdXRwdXQgb2YgdGhlIGNsaSBjb21tYW5kOlxuICpcbiAqIGBgYFxuICogY3MgdG9rZW4gY3JlYXRlIC0tb3V0cHV0IGJhc2U2NFxuICogYGBgXG4gKlxuICogQHBhcmFtIHNlc3Npb25EYXRhU3RyaW5nIEJhc2U2NCBlbmNvZGVkIEFQSSBzZXNzaW9uIHRva2VuLlxuICpcbiAqIEByZXR1cm5zIHNlc3Npb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb25EYXRhU3RyaW5nOiBzdHJpbmcpOiBTZXNzaW9uRGF0YSB7XG4gIC8vIHBhcnNlIHRva2VuLCBzdHJpcHBpbmcgd2hpdGVzcGFjZS5cbiAgY29uc3Qgc2VjcmV0QjY0VG9rZW4gPSBzZXNzaW9uRGF0YVN0cmluZy5yZXBsYWNlKC9cXHMvZywgXCJcIik7XG4gIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGF0b2Ioc2VjcmV0QjY0VG9rZW4pKTtcblxuICAvLyBCYXNpYyB2YWxpZGF0aW9uIG9mIHRoZSBzZXNzaW9uIGRhdGEgKGkuZS4sIG1vc3QgdHlwZXMgb2YgdG9wIGxldmVsIGZpZWxkcylcbiAgaWYgKCFkYXRhKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vzc2lvbiBpcyB1bmRlZmluZWRcIik7XG4gIH1cbiAgaWYgKHR5cGVvZiBkYXRhICE9PSBcIm9iamVjdFwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgc2Vzc2lvbiB0byBiZSBhbiBvYmplY3RcIik7XG4gIH1cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBbXCJvcmdfaWRcIiwgXCJ0b2tlblwiXSkge1xuICAgIGNvbnN0IGZpZWxkVHlwZSA9IHR5cGVvZiBkYXRhW2ZpZWxkXTtcbiAgICBpZiAoZmllbGRUeXBlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICR7ZmllbGR9IHRvIGJlIGEgc3RyaW5nLCBnb3QgJHtmaWVsZFR5cGV9YCk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgZmllbGQgb2YgW1wicm9sZV9pZFwiLCBcInB1cnBvc2VcIl0pIHtcbiAgICBjb25zdCBmaWVsZFR5cGUgPSB0eXBlb2YgZGF0YVtmaWVsZF07XG4gICAgaWYgKGZpZWxkVHlwZSAhPT0gXCJzdHJpbmdcIiAmJiBkYXRhW2ZpZWxkXSAhPT0gdW5kZWZpbmVkICYmIGRhdGFbZmllbGRdICE9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICR7ZmllbGR9IHRvIGJlIGEgc3RyaW5nIG9yIHVuZGVmaW5lZCwgZ290ICR7ZmllbGRUeXBlfWApO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIFtcInNlc3Npb25faW5mb1wiLCBcImVudlwiXSkge1xuICAgIGNvbnN0IGZpZWxkVHlwZSA9IHR5cGVvZiBkYXRhW2ZpZWxkXTtcbiAgICBpZiAoZmllbGRUeXBlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICR7ZmllbGR9IHRvIGJlIGFuIG9iamVjdCwgZ290ICR7ZmllbGRUeXBlfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIENvbXB1dGUgYHJlZnJlc2hfdG9rZW5gIGZvciBvbGQgc2Vzc2lvbnMgdGhhdCBtYXkgbm90IGhhdmUgaXQgc2V0XG4gIGNvbnN0IGluZm8gPSBkYXRhW1wic2Vzc2lvbl9pbmZvXCJdIGFzIENsaWVudFNlc3Npb25JbmZvO1xuICBjb25zdCByZWZyZXNoVG9rZW4gPSBkYXRhW1wicmVmcmVzaF90b2tlblwiXTtcbiAgY29uc3QgcmVmcmVzaFRva2VuRnJvbUluZm8gPSBzZXJpYWxpemVSZWZyZXNoVG9rZW4oaW5mbyk7XG4gIGlmIChyZWZyZXNoVG9rZW4gPT09IG51bGwgfHwgcmVmcmVzaFRva2VuID09PSB1bmRlZmluZWQpIHtcbiAgICBkYXRhW1wicmVmcmVzaF90b2tlblwiXSA9IHJlZnJlc2hUb2tlbkZyb21JbmZvO1xuICB9XG5cbiAgcmV0dXJuIGRhdGEgYXMgU2Vzc2lvbkRhdGE7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyBhIHJlZnJlc2ggdG9rZW4gZnJvbSBzZXNzaW9uIGluZm9ybWF0aW9uLiBUaGUgcmVzdWx0IGlzIGEgdmFsaWQgT0F1dGggdG9rZW4uXG4gKlxuICogQHBhcmFtIGluZm8gU2Vzc2lvbiBpbmZvcm1hdGlvblxuICogQHJldHVybnMgQSByZWZyZXNoIHRva2VuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVSZWZyZXNoVG9rZW4oaW5mbzogQ2xpZW50U2Vzc2lvbkluZm8pOiBzdHJpbmcge1xuICBjb25zdCBzZXNzaW9uSWRTZXIgPSBidG9hKGluZm8uc2Vzc2lvbl9pZCk7XG4gIGNvbnN0IGF1dGhEYXRhID0gYnRvYShcbiAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBlcG9jaF9udW06IGluZm8uZXBvY2gsXG4gICAgICBlcG9jaF90b2tlbjogaW5mby5lcG9jaF90b2tlbixcbiAgICAgIG90aGVyX3Rva2VuOiBpbmZvLmF1dGhfdG9rZW4sXG4gICAgfSksXG4gICk7XG4gIHJldHVybiBgJHtDVUJFU0lHTkVSX1BSRUZJWH0ke3Nlc3Npb25JZFNlcn0uJHthdXRoRGF0YX0uJHtpbmZvLnJlZnJlc2hfdG9rZW59YDtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHNlc3Npb24gZGF0YSB0byBiYXNlNjQuXG4gKlxuICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gZGF0YSB0byBzZXJpYWxpemVcbiAqIEByZXR1cm5zIFRoZSBzZXJpYWxpemVkIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb246IFNlc3Npb25EYXRhKTogc3RyaW5nIHtcbiAgcmV0dXJuIGJ0b2EoSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbikpO1xufVxuIl19