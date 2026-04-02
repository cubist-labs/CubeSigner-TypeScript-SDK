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
var _ExclusiveSessionManager_refreshing, _MemorySessionManager_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBase64SessionData = exports.isRefreshable = exports.isStale = exports.metadata = exports.refresh = exports.DEFAULT_EXPIRATION_BUFFER_SECS = exports.NoSessionFoundError = exports.MemorySessionManager = exports.ExclusiveSessionManager = void 0;
const fetch_1 = require("../fetch");
const retry_1 = require("../retry");
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
exports.refresh = refresh;
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
exports.metadata = metadata;
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
exports.parseBase64SessionData = parseBase64SessionData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvc2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxvQ0FBOEM7QUFDOUMsb0NBQXNDO0FBc0V0Qzs7Ozs7O0dBTUc7QUFDSCxNQUFzQix1QkFBdUI7SUFBN0M7UUFDRSw2RkFBNkY7UUFDN0Ysc0RBQW1DO0lBMERyQyxDQUFDO0lBN0NDOzs7T0FHRztJQUNILFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFbkMsNElBQXFCLGtCQUFrQixDQUFDLElBQUksQ0FBQztZQUMzQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0RCxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLHVCQUFBLElBQUksdUNBQWUsU0FBUyxNQUFBLENBQUMsQ0FBQyxNQUFBLENBQUM7UUFFbEQsd0VBQXdFO1FBQ3hFLHdFQUF3RTtRQUN4RSxFQUFFO1FBQ0YsbUZBQW1GO1FBQ25GLGdDQUFnQztRQUNoQyxNQUFNLE9BQU8sR0FBRyx1QkFBQSxJQUFJLDJDQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sdUJBQUEsSUFBSSwyQ0FBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDakUsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxZQUFZO1FBQ2hCLGdEQUFnRDtR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QUNQLE9BQU87UUFDUCxVQUFVLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxVQUFVO1FBQzNDLFdBQVc7UUFDWCxLQUFLLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLO0tBQ2xDLENBQUM7QUFDSixDQUFDO0FBWEQsNEJBV0M7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLGNBQWMsR0FBRyxDQUFDLGFBQXFCLEVBQUUsRUFBRSxDQUMvQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxzQ0FBOEIsQ0FBQztBQUU5RCxNQUFNLE9BQU8sR0FBRyxDQUFDLE9BQW9CLEVBQVcsRUFBRSxDQUN2RCxjQUFjLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUR6QyxRQUFBLE9BQU8sV0FDa0M7QUFFL0MsTUFBTSxhQUFhLEdBQUcsQ0FBQyxPQUFvQixFQUFXLEVBQUUsQ0FDN0QsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUM7SUFDaEUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBRjdDLFFBQUEsYUFBYSxpQkFFZ0M7QUFFMUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxTQUFnQixzQkFBc0IsQ0FBQyxpQkFBeUI7SUFDOUQscUNBQXFDO0lBQ3JDLE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBZ0IsQ0FBQztBQUN6RCxDQUFDO0FBSkQsd0RBSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcbmltcG9ydCB7IGFwaUZldGNoLCBhc3NlcnRPayB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgcmV0cnlPbjVYWCB9IGZyb20gXCIuLi9yZXRyeVwiO1xuaW1wb3J0IHR5cGUgeyBDbGllbnRTZXNzaW9uSW5mbyB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uTGlmZXRpbWUge1xuICAvKiogU2Vzc2lvbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIG9uZSB3ZWVrICg2MDQ4MDApLiAqL1xuICBzZXNzaW9uPzogbnVtYmVyO1xuICAvKiogQXV0aCB0b2tlbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIGZpdmUgbWludXRlcyAoMzAwKS4gKi9cbiAgYXV0aDogbnVtYmVyO1xuICAvKiogUmVmcmVzaCB0b2tlbiBsaWZldGltZSAoaW4gc2Vjb25kcykuIERlZmF1bHRzIHRvIG9uZSBkYXkgKDg2NDAwKS4gKi9cbiAgcmVmcmVzaD86IG51bWJlcjtcbiAgLyoqIEdyYWNlIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gMzAgc2Vjb25kcyAoMzApLiAqL1xuICBncmFjZT86IG51bWJlcjtcbn1cblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIEN1YmVTaWduZXIgc2Vzc2lvbiBmaWxlIGZvcm1hdCAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uRGF0YSB7XG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIElEICovXG4gIG9yZ19pZDogc3RyaW5nO1xuICAvKiogVGhlIHJvbGUgSUQgKi9cbiAgcm9sZV9pZD86IHN0cmluZztcbiAgLyoqIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uIHRva2VuICovXG4gIHB1cnBvc2U/OiBzdHJpbmc7XG4gIC8qKiBUaGUgdG9rZW4gdG8gaW5jbHVkZSBpbiBBdXRob3JpemF0aW9uIGhlYWRlciAqL1xuICB0b2tlbjogc3RyaW5nO1xuICAvKiogU2Vzc2lvbiBpbmZvICovXG4gIHNlc3Npb25faW5mbzogQ2xpZW50U2Vzc2lvbkluZm87XG4gIC8qKiBTZXNzaW9uIGV4cGlyYXRpb24gKGluIHNlY29uZHMgc2luY2UgVU5JWCBlcG9jaCkgYmV5b25kIHdoaWNoIGl0IGNhbm5vdCBiZSByZWZyZXNoZWQgKi9cbiAgc2Vzc2lvbl9leHA6IG51bWJlciB8IHVuZGVmaW5lZDsgLy8gbWF5IGJlIG1pc3NpbmcgaW4gbGVnYWN5IHNlc3Npb24gZmlsZXNcbiAgLyoqIFRoZSBlbnZpcm9ubWVudCAqL1xuICBlbnY6IHtcbiAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBFbnZJbnRlcmZhY2U7XG4gIH07XG59XG5cbi8vIFJhdGhlciB0aGFuIGp1c3QgZG9pbmcgYSBzaW1wbGUgUGljaywgd2UgZ28gdGhlIGV4dHJhIG1pbGUgdG8gZW5zdXJlIHRoYXRcbi8vIGFueSBtZXRhZGF0YSBvYmplY3QgTVVTVCBORVZFUiBpbmNsdWRlIHNlbnNpdGl2ZSBpbmZvcm1hdGlvblxudHlwZSBTYWZlU2Vzc2lvbkRhdGFGaWVsZHMgPSBcImVudlwiIHwgXCJvcmdfaWRcIiB8IFwicm9sZV9pZFwiIHwgXCJwdXJwb3NlXCIgfCBcInNlc3Npb25fZXhwXCI7XG5cbi8qKiBOb24tc2Vuc2l0aXZlIGluZm8gYWJvdXQgYSBzZXNzaW9uICovXG5leHBvcnQgdHlwZSBTZXNzaW9uTWV0YWRhdGEgPSBQaWNrPFNlc3Npb25EYXRhLCBTYWZlU2Vzc2lvbkRhdGFGaWVsZHM+ICYge1xuICBbSyBpbiBFeGNsdWRlPGtleW9mIFNlc3Npb25EYXRhLCBTYWZlU2Vzc2lvbkRhdGFGaWVsZHM+XT86IG5ldmVyO1xufSAmIHsgc2Vzc2lvbl9pZDogc3RyaW5nOyBlcG9jaDogbnVtYmVyIH07XG5cbi8qKlxuICogQSBTZXNzaW9uTWFuYWdlcidzIGpvYiBpcyB0byBoYW5kbGUgc2Vzc2lvbiBwZXJzaXN0ZW5jZSBhbmQgcmVmcmVzaGVzXG4gKlxuICogVGhlIGludGVyZmFjZSBkb2VzIG5vdCBpbXBvc2UgKndoZW4qIGEgcmVmcmVzaCBtdXN0IG9jY3VyLCB0aG91Z2ggdHlwaWNhbGx5XG4gKiB0aGlzIHdpbGwgYmUgb24gcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uTWFuYWdlciB7XG4gIC8qKlxuICAgKiBMb2FkIHRoZSBtZXRhZGF0YSBmb3IgdGhlIHNlc3Npb24uIFNob3VsZCB0aHJvdyBpZiBub3QgYXZhaWxhYmxlXG4gICAqXG4gICAqIEByZXR1cm4ge1Nlc3Npb25NZXRhZGF0YX0gSW5mbyBhYm91dCB0aGUgc2Vzc2lvblxuICAgKlxuICAgKiBAdGhyb3dzIHtOb1Nlc3Npb25Gb3VuZEVycm9yfSBJZiB0aGUgc2Vzc2lvbiBpcyBub3QgYXZhaWxhYmxlXG4gICAqL1xuICBtZXRhZGF0YSgpOiBQcm9taXNlPFNlc3Npb25NZXRhZGF0YT47XG5cbiAgLyoqXG4gICAqIExvYWQgdGhlIHRva2VuIHRvIGJlIHVzZWQgZm9yIGEgcmVxdWVzdC4gVGhpcyB3aWxsIGJlIGludm9rZWQgYnkgdGhlIGNsaWVudFxuICAgKiB0byBwcm92aWRlIHRoZSBBdXRob3JpemF0aW9uIGhlYWRlclxuICAgKlxuICAgKiBAcmV0dXJuIHtTZXNzaW9uTWV0YWRhdGF9IEluZm8gYWJvdXQgdGhlIHNlc3Npb25cbiAgICpcbiAgICogQHRocm93cyB7Tm9TZXNzaW9uRm91bmRFcnJvcn0gSWYgdGhlIHNlc3Npb24gaXMgbm90IGF2YWlsYWJsZVxuICAgKi9cbiAgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+O1xufVxuXG4vKipcbiAqIEEgdGVtcGxhdGUgZm9yIHNlc3Npb24gbWFuYWdlcnMgd2hpY2ggaGF2ZSBleGNsdXNpdmUgYWNjZXNzIHRvIGEgc2Vzc2lvblxuICogYW5kIGNhbiBzdG9yZS9sb2FkIHRoZW0gZnJlZWx5LlxuICpcbiAqIEl0IGlzIE5PVCBzdWl0YWJsZSBmb3IgYXBwbGljYXRpb25zIHdoZXJlIG11bHRpcGxlIGNsaWVudHMgYXJlIHVzaW5nIHRoZSBzYW1lXG4gKiBzZXNzaW9uIGFzIHRoZXkgd2lsbCBib3RoIGF0dGVtcHQgdG8gcmVmcmVzaCBpbmRlcGVuZGVudGx5LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRXhjbHVzaXZlU2Vzc2lvbk1hbmFnZXIgaW1wbGVtZW50cyBTZXNzaW9uTWFuYWdlciB7XG4gIC8qKiBJZiBwcmVzZW50LCB0aGUgc2Vzc2lvbiBpcyBjdXJyZW50bHkgcmVmcmVzaGluZy4gQXdhaXQgdG8gZ2V0IHRoZSBmcmVzaGVzdCBTZXNzaW9uRGF0YSAqL1xuICAjcmVmcmVzaGluZz86IFByb21pc2U8U2Vzc2lvbkRhdGE+O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSB0aGUgU2Vzc2lvbkRhdGEgZnJvbSBzdG9yYWdlXG4gICAqL1xuICBhYnN0cmFjdCByZXRyaWV2ZSgpOiBQcm9taXNlPFNlc3Npb25EYXRhPjtcblxuICAvKipcbiAgICogU3RvcmUgdGhlIFNlc3Npb25EYXRhIGludG8gc3RvcmFnZVxuICAgKiBAcGFyYW0gZGF0YSBUaGUgZGF0YSB0byBzdG9yZVxuICAgKi9cbiAgYWJzdHJhY3Qgc3RvcmUoZGF0YTogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgc2Vzc2lvbiBtZXRhZGF0YSBmcm9tIHN0b3JhZ2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+fVxuICAgKi9cbiAgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+IHtcbiAgICByZXR1cm4gdGhpcy5yZXRyaWV2ZSgpLnRoZW4obWV0YWRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSB0b2tlbiBmcm9tIHN0b3JhZ2UsIHJlZnJlc2hpbmcgaWYgbmVjZXNzYXJ5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2Vzc2lvbk1ldGFkYXRhPn1cbiAgICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMucmV0cmlldmUoKTtcblxuICAgIHRoaXMuI3JlZnJlc2hpbmcgPz89IHJlZnJlc2hJZk5lY2Vzc2FyeShkYXRhKVxuICAgICAgPy50aGVuKGFzeW5jIChkYXRhKSA9PiAoYXdhaXQgdGhpcy5zdG9yZShkYXRhKSwgZGF0YSkpXG4gICAgICA/LmZpbmFsbHkoKCkgPT4gKHRoaXMuI3JlZnJlc2hpbmcgPSB1bmRlZmluZWQpKTtcblxuICAgIC8vIFRlY2huaWNhbGx5LCBpbiBtYW55IGNhc2VzIHdlIHNob3VsZG4ndCBoYXZlIHRvIHdhaXQgZm9yIHRoZSByZWZyZXNoLFxuICAgIC8vIHRoZSBzZXNzaW9uIHdpbGwgc3RpbGwgYmUgdmFsaWQgZm9yIGEgd2hpbGUgYWZ0ZXIgdGhlIHJlZnJlc2ggc3RhcnRzLlxuICAgIC8vXG4gICAgLy8gSG93ZXZlciwgc29tZXRpbWVzIHRoZSBhdXRoIHRva2VuIHdpbGwgYmUgZW50aXJlbHkgZXhwaXJlZCwgc28gd2UgY29uc2VydmF0aXZlbHlcbiAgICAvLyB3YWl0IGZvciBhIHN1Y2Nlc3NmdWwgcmVmcmVzaFxuICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLiNyZWZyZXNoaW5nID8gYXdhaXQgdGhpcy4jcmVmcmVzaGluZyA6IGRhdGE7XG4gICAgcmV0dXJuIHNlc3Npb24udG9rZW47XG4gIH1cblxuICAvKipcbiAgICogTWFudWFsbHkgZm9yY2UgYSB0b2tlbiByZWZyZXNoXG4gICAqXG4gICAqIEByZXR1cm4ge1Nlc3Npb25EYXRhfSBUaGUgbmV3bHkgcmVmcmVzaGVkIHNlc3Npb24gZGF0YVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGZvcmNlUmVmcmVzaCgpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgLy8gSWYgbm90IGN1cnJlbnRseSByZWZyZXNoaW5nLCBzdGFydCByZWZyZXNoaW5nXG4gICAgdGhpcy4jcmVmcmVzaGluZyA/Pz0gdGhpcy5yZXRyaWV2ZSgpXG4gICAgICAudGhlbihyZWZyZXNoKVxuICAgICAgLnRoZW4oYXN5bmMgKGRhdGEpID0+IChhd2FpdCB0aGlzLnN0b3JlKGRhdGEpLCBkYXRhKSlcbiAgICAgIC5maW5hbGx5KCgpID0+ICh0aGlzLiNyZWZyZXNoaW5nID0gdW5kZWZpbmVkKSk7XG5cbiAgICAvLyBCZWNhdXNlIHdlID8/PSBhc3NpZ25lZCB0byByZWZyZXNoaW5nIGFib3ZlLCB3ZSdyZSBndWFyYW50ZWVkIHRvIGJlXG4gICAgLy8gYWN0aXZlbHkgcmVmcmVzaGluZywgc28ganVzdCBhd2FpdCBpdC5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jcmVmcmVzaGluZztcbiAgfVxufVxuXG4vKiogSW1wbGVtZW50cyBhIFNlc3Npb25NYW5hZ2VyIHdpdGhvdXQgcGVyc2lzdGVuY2UgKi9cbmV4cG9ydCBjbGFzcyBNZW1vcnlTZXNzaW9uTWFuYWdlciBleHRlbmRzIEV4Y2x1c2l2ZVNlc3Npb25NYW5hZ2VyIHtcbiAgLyoqIFRoZSBzZXNzaW9uIGRhdGEgY29udGFpbmluZyBib3RoIG1ldGFkYXRhIGFuZCB0b2tlbnMgKi9cbiAgI2RhdGE6IFNlc3Npb25EYXRhO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Qgd2l0aCBkYXRhIGluIG1lbW9yeVxuICAgKiBAcGFyYW0ge1Nlc3Npb25EYXRhfSBkYXRhIFRoZSBpbml0aWFsIHNlc3Npb24gZGF0YVxuICAgKi9cbiAgY29uc3RydWN0b3IoZGF0YTogU2Vzc2lvbkRhdGEpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqIFJldHVybiB0aGUgaW4tbWVtb3J5IGRhdGEgKi9cbiAgYXN5bmMgcmV0cmlldmUoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3JlIHRoZSBpbi1tZW1vcnkgZGF0YVxuICAgKiBAcGFyYW0ge1Nlc3Npb25EYXRhfSBkYXRhIFRoZSBzZXNzaW9uIGRhdGEgdG8gc3RvcmVcbiAgICovXG4gIGFzeW5jIHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKSB7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqIEFuIGVycm9yIHR5cGUgdG8gYmUgdGhyb3duIGJ5IFNlc3Npb25NYW5hZ2VyJ3Mgd2hlbiB0aGUgc2Vzc2lvbiBpcyB1bmF2YWlsYWJsZSAqL1xuZXhwb3J0IGNsYXNzIE5vU2Vzc2lvbkZvdW5kRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBDb25zdHJ1Y3RzIHRoZSBlcnJvciB3aXRoIHRoZSBhcHByb3ByaWF0ZSBtZXNzYWdlICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiTm8gc2Vzc2lvbiBhdmFpbGFibGUgZm9yIHRoZSBjbGllbnRcIik7XG4gIH1cbn1cblxuLyoqIFRoZSBudW1iZXIgb2Ygc2Vjb25kcyBiZWZvcmUgZXhwaXJhdGlvbiB0aW1lLCB0byBhdHRlbXB0IGEgcmVmcmVzaCAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDUyA9IDMwO1xuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IHJlZnJlc2hlcyBhIHNlc3Npb24gdXNpbmcgdGhlIEN1YmVTaWduZXIgQVBJIGlmIGl0IGlzIGNsb3NlXG4gKiB0byBleHBpcmluZy5cbiAqXG4gKiBAcGFyYW0ge1Nlc3Npb25EYXRhfSBzZXNzaW9uIFRoZSBzZXNzaW9uIGRhdGEgd2hpY2ggbWF5IHJlcXVpcmUgYSByZWZyZXNoXG4gKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBQcm9taXNlPFNlc3Npb25EYXRhPn0gSW1tZWRpYXRlbHkgcmV0dXJucyB1bmRlZmluZWQgaWYgdGhlIHNlc3Npb24gZG9lcyBub3QgcmVxdWlyZSBhIHJlZnJlc2hcbiAqL1xuZnVuY3Rpb24gcmVmcmVzaElmTmVjZXNzYXJ5KHNlc3Npb246IFNlc3Npb25EYXRhKTogdW5kZWZpbmVkIHwgUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICBpZiAoIWlzU3RhbGUoc2Vzc2lvbikpIHJldHVybjtcbiAgcmV0dXJuIHJlZnJlc2goc2Vzc2lvbik7XG59XG5cbi8qKlxuICogSW52b2tlcyB0aGUgQ3ViZVNpZ25lciBBUEkgdG8gcmVmcmVzaCBhIHNlc3Npb25cbiAqIEBwYXJhbSB7U2Vzc2lvbkRhdGF9IHNlc3Npb25cbiAqIEByZXR1cm4ge1Nlc3Npb25EYXRhfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaChzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgY29uc3QgeyBlcG9jaDogZXBvY2hfbnVtLCBlcG9jaF90b2tlbiwgcmVmcmVzaF90b2tlbjogb3RoZXJfdG9rZW4gfSA9IHNlc3Npb24uc2Vzc2lvbl9pbmZvO1xuICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgIGFwaUZldGNoKFwiL3YxL29yZy97b3JnX2lkfS90b2tlbi9yZWZyZXNoXCIsIFwicGF0Y2hcIiwge1xuICAgICAgYmFzZVVybDogc2Vzc2lvbi5lbnZbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdLlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpLFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHNlc3Npb24ub3JnX2lkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogc2Vzc2lvbi50b2tlbixcbiAgICAgIH0sXG4gICAgICBib2R5OiB7IGVwb2NoX251bSwgZXBvY2hfdG9rZW4sIG90aGVyX3Rva2VuIH0sXG4gICAgfSksXG4gIClcbiAgICAudGhlbihhc3NlcnRPaylcbiAgICAudGhlbigocmVzKSA9PiAoe1xuICAgICAgLi4uc2Vzc2lvbixcbiAgICAgIC4uLnJlcyxcbiAgICB9KSk7XG59XG5cbi8qKlxuICogR2V0IHRoZSBzYWZlIG1ldGFkYXRhIGZyb20gYSBTZXNzaW9uRGF0YVxuICogQHBhcmFtIHtTZXNzaW9uRGF0YX0gc2Vzc2lvbiBUaGUgc2Vzc2lvblxuICogQHJldHVybiB7U2Vzc2lvbk1ldGFkYXRhfSBUaGUgc2Vzc2lvbiBtZXRhZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWV0YWRhdGEoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBTZXNzaW9uTWV0YWRhdGEge1xuICBjb25zdCB7IGVudiwgb3JnX2lkLCByb2xlX2lkLCBwdXJwb3NlLCBzZXNzaW9uX2V4cCB9ID0gc2Vzc2lvbjtcbiAgcmV0dXJuIHtcbiAgICBlbnYsXG4gICAgb3JnX2lkLFxuICAgIHJvbGVfaWQsXG4gICAgcHVycG9zZSxcbiAgICBzZXNzaW9uX2lkOiBzZXNzaW9uLnNlc3Npb25faW5mby5zZXNzaW9uX2lkLFxuICAgIHNlc3Npb25fZXhwLFxuICAgIGVwb2NoOiBzZXNzaW9uLnNlc3Npb25faW5mby5lcG9jaCxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZUluU2Vjb25kcyBhbiBlcG9jaCB0aW1lc3RhbXBcbiAqIEByZXR1cm4ge2Jvb2x9IHdoZXRoZXIgb3Igbm90IHRoZSB0aW1lc3RhbXAgaXMgYmVmb3JlIG5vdyArIERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDU1xuICovXG5jb25zdCBpc1dpdGhpbkJ1ZmZlciA9ICh0aW1lSW5TZWNvbmRzOiBudW1iZXIpID0+XG4gIHRpbWVJblNlY29uZHMgPCBEYXRlLm5vdygpIC8gMTAwMCArIERFRkFVTFRfRVhQSVJBVElPTl9CVUZGRVJfU0VDUztcblxuZXhwb3J0IGNvbnN0IGlzU3RhbGUgPSAoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBib29sZWFuID0+XG4gIGlzV2l0aGluQnVmZmVyKHNlc3Npb24uc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwKTtcblxuZXhwb3J0IGNvbnN0IGlzUmVmcmVzaGFibGUgPSAoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBib29sZWFuID0+XG4gICFpc1dpdGhpbkJ1ZmZlcihzZXNzaW9uLnNlc3Npb25fZXhwID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSkgJiZcbiAgIWlzV2l0aGluQnVmZmVyKHNlc3Npb24uc2Vzc2lvbl9pbmZvLnJlZnJlc2hfdG9rZW5fZXhwKTtcblxuLyoqXG4gKiBQYXJzZXMgdGhlIGJhc2U2NCBBUEkgc2Vzc2lvbiB0b2tlbi5cbiAqIENvbnN1bWVzIHRoZSBvdXRwdXQgb2YgdGhlIGNsaSBjb21tYW5kOlxuICpcbiAqIGBgYFxuICogY3MgdG9rZW4gY3JlYXRlIC0tb3V0cHV0IGJhc2U2NFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHNlc3Npb25EYXRhU3RyaW5nIEJhc2U2NCBlbmNvZGVkIEFQSSBzZXNzaW9uIHRva2VuLlxuICpcbiAqIEByZXR1cm4ge1NpZ25lclNlc3Npb25EYXRhfSBzZXNzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VCYXNlNjRTZXNzaW9uRGF0YShzZXNzaW9uRGF0YVN0cmluZzogc3RyaW5nKTogU2Vzc2lvbkRhdGEge1xuICAvLyBwYXJzZSB0b2tlbiwgc3RyaXBwaW5nIHdoaXRlc3BhY2UuXG4gIGNvbnN0IHNlY3JldEI2NFRva2VuID0gc2Vzc2lvbkRhdGFTdHJpbmcucmVwbGFjZSgvXFxzL2csIFwiXCIpO1xuICByZXR1cm4gSlNPTi5wYXJzZShhdG9iKHNlY3JldEI2NFRva2VuKSkgYXMgU2Vzc2lvbkRhdGE7XG59XG4iXX0=