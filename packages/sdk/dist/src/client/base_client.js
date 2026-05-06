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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BaseClient_instances, _BaseClient_targetOrgId, _BaseClient_applyOptions, _BaseClient_classifyAndEmitError;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClient = exports.ALL_EVENTS = exports.UserMfaFailedEvent = exports.SessionExpiredEvent = exports.VERSION = exports.NAME = void 0;
exports.signerSessionFromSessionInfo = signerSessionFromSessionInfo;
exports.authHeader = authHeader;
// NOTE: add '// @ts-nocheck' at the top of this file to speed up type checking
const package_json_1 = __importDefault(require("../../package.json"));
const fetch_1 = require("../fetch");
const retry_1 = require("../retry");
const events_1 = require("../events");
const error_1 = require("../error");
const session_1 = require("./session");
const openapi_fetch_1 = require("openapi-fetch");
/** CubeSigner SDK package name */
exports.NAME = package_json_1.default.name;
/** CubeSigner SDK version */
exports.VERSION = package_json_1.default.version;
/** Event emitted when a request fails because of an expired/invalid session */
class SessionExpiredEvent {
}
exports.SessionExpiredEvent = SessionExpiredEvent;
/** Event emitted when a request fails because user failed to answer an MFA challenge */
class UserMfaFailedEvent extends error_1.ErrResponse {
}
exports.UserMfaFailedEvent = UserMfaFailedEvent;
/**
 * An event emitter for all clients
 *
 * @deprecated
 */
exports.ALL_EVENTS = new events_1.EventEmitter();
/**
 * Implements a retry strategy and session refreshes
 */
class BaseClient extends events_1.EventEmitter {
    /** @returns The env */
    get env() {
        return this.sessionMeta.env["Dev-CubeSignerStack"];
    }
    /**
     * Construct a client with a session or session manager
     *
     * @param this Allows this static method to return subtypes when invoked through them
     * @param session The session (object or base64 string) or manager that will back this client
     * @param targetOrgId The ID of the organization this client should operate on. Defaults to
     *   the org id from the supplied session. The only scenario in which it makes sense to use
     *   a {@link targetOrgId} different from the session org id is if {@link targetOrgId} is a
     *   child organization of the session organization.
     * @returns A Client
     */
    static async create(session, targetOrgId) {
        const sessionObj = typeof session === "string" ? (0, session_1.parseBase64SessionData)(session) : session;
        if (typeof sessionObj.token === "function") {
            const manager = sessionObj;
            return new this(await manager.metadata(), manager, targetOrgId);
        }
        else {
            session = sessionObj;
            return new this((0, session_1.metadata)(session), new session_1.MemorySessionManager(session), targetOrgId);
        }
    }
    /**
     * @param sessionMeta The initial session metadata
     * @param manager The manager for the current session
     * @param targetOrgId The ID of the organization this client should operate on. Defaults to
     *   the org id from the supplied session. The only scenario in which it makes sense to use
     *   a {@link targetOrgId} different from the session org id is if {@link targetOrgId} is a
     *   child organization of the session organization.
     * @param config Client configuration
     *
     * @internal
     */
    constructor(sessionMeta, manager, targetOrgId, config) {
        super();
        _BaseClient_instances.add(this);
        /**
         * Target org id, i.e., the organization this client should operate on.
         *
         * The only scenario in which it makes sense to use a target organization
         * different from the session organization is if the target organization is
         * a child of the session organization.
         */
        _BaseClient_targetOrgId.set(this, void 0);
        __classPrivateFieldSet(this, _BaseClient_targetOrgId, targetOrgId, "f");
        this.sessionManager = manager;
        this.sessionMeta = sessionMeta;
        this.config = {
            updateRetryDelaysMs: [100, 200, 400],
            headers: {},
            origin: undefined,
            ...(config ?? {}),
        };
    }
    /** @returns The organization ID. If the org ID was set explicitly, it returns that ID; otherwise it returns the session's organization ID. */
    get orgId() {
        return __classPrivateFieldGet(this, _BaseClient_targetOrgId, "f") ?? this.sessionMeta.org_id;
    }
    /**
     * Executes an op using the state of the client (auth headers & org_id) with retries
     *
     * @internal
     * @param op The API operation you wish to perform
     * @param opts The parameters for the operation
     * @returns A promise for the successful result (errors will be thrown)
     */
    async exec(op, opts) {
        try {
            let token = await this.sessionManager.token();
            const resp = await (0, retry_1.retry)(() => op(__classPrivateFieldGet(this, _BaseClient_instances, "m", _BaseClient_applyOptions).call(this, token, opts)), {
                pred: async (resp) => {
                    const status = resp.response.status;
                    const error = resp.error;
                    const requestId = error?.request_id;
                    // If we get a "Forbidden" error, erase the cached token
                    //
                    // TODO: Check error codes once our API returns error codes for
                    // authorization failures
                    if (status === 403 &&
                        requestId === undefined &&
                        this.sessionManager.onInvalidToken !== undefined) {
                        this.sessionManager.onInvalidToken();
                        const oldToken = token;
                        token = await this.sessionManager.token();
                        return token !== oldToken;
                    }
                    // Also retry server-side errors
                    return status >= 500 && status < 600;
                },
            });
            // Once we have a non-5XX response, we will assertOk (either throwing or yielding the response)
            return (0, fetch_1.assertOk)(resp);
        }
        catch (e) {
            if (e instanceof error_1.ErrResponse) {
                await __classPrivateFieldGet(this, _BaseClient_instances, "m", _BaseClient_classifyAndEmitError).call(this, e); // Emit appropriate events
            }
            throw e; // Rethrow the error
        }
    }
}
exports.BaseClient = BaseClient;
_BaseClient_targetOrgId = new WeakMap(), _BaseClient_instances = new WeakSet(), _BaseClient_applyOptions = function _BaseClient_applyOptions(token, opts) {
    const pathParams = "path" in (opts.params ?? {}) ? opts.params?.path : undefined;
    const baseUrl = this.env.SignerApiRoot.replace(/\/$/, "");
    const browserUserAgent = typeof window !== "undefined" ? navigator?.userAgent : undefined;
    return {
        cache: "no-store",
        // If we have an activeSession, let it dictate the baseUrl. Otherwise fall back to the one set at construction
        baseUrl,
        ...opts,
        headers: (0, openapi_fetch_1.mergeHeaders)({
            "User-Agent": browserUserAgent ?? `${exports.NAME}@${exports.VERSION}`,
            "X-Cubist-Ts-Sdk": `${exports.NAME}@${exports.VERSION}`,
            Origin: this.config.origin,
        }, authHeader(token), this.config.headers, opts.headers),
        params: {
            ...opts.params,
            path: {
                org_id: this.orgId,
                ...pathParams,
            },
        },
    };
}, _BaseClient_classifyAndEmitError = 
/**
 * Emits specific error events when a request failed
 *
 * @param err The error to classify
 */
async function _BaseClient_classifyAndEmitError(err) {
    this.emit("error", err);
    exports.ALL_EVENTS.emit("error", err);
    if (err.isUserMfaError()) {
        const ev = "user-mfa-failed";
        this.emit(ev, err);
        exports.ALL_EVENTS.emit(ev, err);
    }
    // if status is 403 and error matches one of the "invalid session" error codes trigger onSessionExpired
    //
    // TODO: because errors returned by the authorizer lambda are not forwarded to the client
    //       we also trigger onSessionExpired when "signerSessionRefresh" fails
    if (err.status === 403 &&
        (err.isSessionExpiredError() || err.operation == "signerSessionRefresh")) {
        const ev = "session-expired";
        this.emit(ev, err);
        exports.ALL_EVENTS.emit(ev, err);
    }
};
/**
 * Upgrade a session response into a full SessionData by incorporating
 * elements of an existing SessionData
 *
 * @param meta An existing SessionData
 * @param info A new session created via the API
 * @param ctx Additional manual overrides
 * @returns SessionData with new information from info and ctx
 */
function signerSessionFromSessionInfo(meta, info, ctx) {
    return {
        env: meta.env,
        org_id: meta.org_id,
        session_exp: info.expiration,
        session_info: info.session_info,
        token: info.token,
        refresh_token: info.refresh_token,
        purpose: meta.purpose,
        role_id: meta.role_id,
        ...ctx,
    };
}
/**
 * Creates {@link HeadersInit} containing a single "Authorization" header with a given value.
 *
 * @param token The "Authorization" header value
 * @returns A {@link HeadersInit} object containing a single "Authorization" header with a given value.
 */
function authHeader(token) {
    return { Authorization: token };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtSQSxvRUFnQkM7QUE4QkQsZ0NBRUM7QUFsVUQsK0VBQStFO0FBQy9FLHNFQUFxQztBQUVyQyxvQ0FBb0M7QUFDcEMsb0NBQWlDO0FBQ2pDLHNDQUF5QztBQUN6QyxvQ0FBdUM7QUFFdkMsdUNBQW1GO0FBR25GLGlEQUE2QztBQUU3QyxrQ0FBa0M7QUFDckIsUUFBQSxJQUFJLEdBQVcsc0JBQUcsQ0FBQyxJQUFJLENBQUM7QUFFckMsNkJBQTZCO0FBQ2hCLFFBQUEsT0FBTyxHQUFXLHNCQUFHLENBQUMsT0FBTyxDQUFDO0FBSTNDLCtFQUErRTtBQUMvRSxNQUFhLG1CQUFtQjtDQUFHO0FBQW5DLGtEQUFtQztBQUVuQyx3RkFBd0Y7QUFDeEYsTUFBYSxrQkFBbUIsU0FBUSxtQkFBVztDQUFHO0FBQXRELGdEQUFzRDtBQVl0RDs7OztHQUlHO0FBQ1UsUUFBQSxVQUFVLEdBQStCLElBQUkscUJBQVksRUFBRSxDQUFDO0FBZ0J6RTs7R0FFRztBQUNILE1BQWEsVUFBVyxTQUFRLHFCQUEwQjtJQW1CeEQsdUJBQXVCO0lBQ3ZCLElBQUksR0FBRztRQUNMLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUVqQixPQUE4QyxFQUM5QyxXQUFvQjtRQUVwQixNQUFNLFVBQVUsR0FDZCxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsZ0NBQXNCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUUxRSxJQUFJLE9BQU8sVUFBVSxDQUFDLEtBQUssS0FB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QyxZQUFZO1FBQy9CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztRQUNqQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7UUFDakMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1FBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixHQUFHLEdBQUc7S0FDUCxDQUFDO0FBQ0osQ0FBQztBQXdCRDs7Ozs7R0FLRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxLQUFhO0lBQ3RDLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUM7QUFDbEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIE5PVEU6IGFkZCAnLy8gQHRzLW5vY2hlY2snIGF0IHRoZSB0b3Agb2YgdGhpcyBmaWxlIHRvIHNwZWVkIHVwIHR5cGUgY2hlY2tpbmdcbmltcG9ydCBwa2cgZnJvbSBcIi4uLy4uL3BhY2thZ2UuanNvblwiO1xuaW1wb3J0IHR5cGUgeyBGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGEsIE9wLCBPcGVyYXRpb24sIFNpbXBsZU9wdGlvbnMgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyByZXRyeSB9IGZyb20gXCIuLi9yZXRyeVwiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4uL2V2ZW50c1wiO1xuaW1wb3J0IHsgRXJyUmVzcG9uc2UgfSBmcm9tIFwiLi4vZXJyb3JcIjtcbmltcG9ydCB0eXBlIHsgU2Vzc2lvbkRhdGEsIFNlc3Npb25NYW5hZ2VyLCBTZXNzaW9uTWV0YWRhdGEgfSBmcm9tIFwiLi9zZXNzaW9uXCI7XG5pbXBvcnQgeyBNZW1vcnlTZXNzaW9uTWFuYWdlciwgbWV0YWRhdGEsIHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEgfSBmcm9tIFwiLi9zZXNzaW9uXCI7XG5pbXBvcnQgdHlwZSB7IE5ld1Nlc3Npb25SZXNwb25zZSwgRXJyb3JSZXNwb25zZSB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uL2VudlwiO1xuaW1wb3J0IHsgbWVyZ2VIZWFkZXJzIH0gZnJvbSBcIm9wZW5hcGktZmV0Y2hcIjtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHBhY2thZ2UgbmFtZSAqL1xuZXhwb3J0IGNvbnN0IE5BTUU6IHN0cmluZyA9IHBrZy5uYW1lO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgdmVyc2lvbiAqL1xuZXhwb3J0IGNvbnN0IFZFUlNJT046IHN0cmluZyA9IHBrZy52ZXJzaW9uO1xuXG5leHBvcnQgdHlwZSBFcnJvckV2ZW50ID0gRXJyUmVzcG9uc2U7XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGJlY2F1c2Ugb2YgYW4gZXhwaXJlZC9pbnZhbGlkIHNlc3Npb24gKi9cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEV2ZW50IHt9XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGJlY2F1c2UgdXNlciBmYWlsZWQgdG8gYW5zd2VyIGFuIE1GQSBjaGFsbGVuZ2UgKi9cbmV4cG9ydCBjbGFzcyBVc2VyTWZhRmFpbGVkRXZlbnQgZXh0ZW5kcyBFcnJSZXNwb25zZSB7fVxuXG50eXBlIENsaWVudEV2ZW50cyA9IHtcbiAgXCJ1c2VyLW1mYS1mYWlsZWRcIjogKGV2OiBVc2VyTWZhRmFpbGVkRXZlbnQpID0+IHZvaWQ7XG4gIFwic2Vzc2lvbi1leHBpcmVkXCI6IChldjogU2Vzc2lvbkV4cGlyZWRFdmVudCkgPT4gdm9pZDtcbiAgZXJyb3I6IChldjogRXJyb3JFdmVudCkgPT4gdm9pZDtcbn07XG5cbnR5cGUgU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4gPSB7XG4gIG5ldyAoLi4uYXJnczogQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBCYXNlQ2xpZW50Pik6IFQ7XG59ICYgdHlwZW9mIEJhc2VDbGllbnQ7XG5cbi8qKlxuICogQW4gZXZlbnQgZW1pdHRlciBmb3IgYWxsIGNsaWVudHNcbiAqXG4gKiBAZGVwcmVjYXRlZFxuICovXG5leHBvcnQgY29uc3QgQUxMX0VWRU5UUzogRXZlbnRFbWl0dGVyPENsaWVudEV2ZW50cz4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbi8qKlxuICogQ2xpZW50IGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDbGllbnRDb25maWcge1xuICAvKiogVXBkYXRlIHJldHJ5IGRlbGF5cyAoaW4gbWlsbGlzZWNvbmRzKSAqL1xuICB1cGRhdGVSZXRyeURlbGF5c01zOiBudW1iZXJbXTtcblxuICAvKiogQ3VzdG9tIG9yaWdpbiB0byBzZXQgKE5PVEUgdGhhdCBpZiBydW5uaW5nIGluIGEgYnJvd3NlciwgdGhlIGJyb3dzZXIgd2lsbCBvdmVyd3JpdGUgdGhpcykgKi9cbiAgb3JpZ2luPzogc3RyaW5nO1xuXG4gIC8qKiBBZGRpdGlvbmFsIGhlYWRlcnMgdG8gc2V0IChkZWZhdWx0IHRvIGVtcHR5KSAqL1xuICBoZWFkZXJzOiBIZWFkZXJzSW5pdDtcbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgcmV0cnkgc3RyYXRlZ3kgYW5kIHNlc3Npb24gcmVmcmVzaGVzXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlQ2xpZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyPENsaWVudEV2ZW50cz4ge1xuICAvKiogSW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlc3Npb24gY29udGFpbmVkIHdpdGhpbiB0aGUgY2xpZW50ICovXG4gIHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGE7XG5cbiAgLyoqIFNlc3Npb24gcGVyc2lzdGVuY2UgKi9cbiAgcHJvdGVjdGVkIHNlc3Npb25NYW5hZ2VyOiBTZXNzaW9uTWFuYWdlcjtcblxuICAvKipcbiAgICogVGFyZ2V0IG9yZyBpZCwgaS5lLiwgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi5cbiAgICpcbiAgICogVGhlIG9ubHkgc2NlbmFyaW8gaW4gd2hpY2ggaXQgbWFrZXMgc2Vuc2UgdG8gdXNlIGEgdGFyZ2V0IG9yZ2FuaXphdGlvblxuICAgKiBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmdhbml6YXRpb24gaXMgaWYgdGhlIHRhcmdldCBvcmdhbml6YXRpb24gaXNcbiAgICogYSBjaGlsZCBvZiB0aGUgc2Vzc2lvbiBvcmdhbml6YXRpb24uXG4gICAqL1xuICAjdGFyZ2V0T3JnSWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAvKiogTVVUQUJMRSBjb25maWd1cmF0aW9uLiAqL1xuICByZWFkb25seSBjb25maWc6IENsaWVudENvbmZpZztcblxuICAvKiogQHJldHVybnMgVGhlIGVudiAqL1xuICBnZXQgZW52KCk6IEVudkludGVyZmFjZSB7XG4gICAgcmV0dXJuIHRoaXMuc2Vzc2lvbk1ldGEuZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBjbGllbnQgd2l0aCBhIHNlc3Npb24gb3Igc2Vzc2lvbiBtYW5hZ2VyXG4gICAqXG4gICAqIEBwYXJhbSB0aGlzIEFsbG93cyB0aGlzIHN0YXRpYyBtZXRob2QgdG8gcmV0dXJuIHN1YnR5cGVzIHdoZW4gaW52b2tlZCB0aHJvdWdoIHRoZW1cbiAgICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gKG9iamVjdCBvciBiYXNlNjQgc3RyaW5nKSBvciBtYW5hZ2VyIHRoYXQgd2lsbCBiYWNrIHRoaXMgY2xpZW50XG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi4gRGVmYXVsdHMgdG9cbiAgICogICB0aGUgb3JnIGlkIGZyb20gdGhlIHN1cHBsaWVkIHNlc3Npb24uIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZVxuICAgKiAgIGEge0BsaW5rIHRhcmdldE9yZ0lkfSBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmcgaWQgaXMgaWYge0BsaW5rIHRhcmdldE9yZ0lkfSBpcyBhXG4gICAqICAgY2hpbGQgb3JnYW5pemF0aW9uIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybnMgQSBDbGllbnRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VD4oXG4gICAgdGhpczogU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4sXG4gICAgc2Vzc2lvbjogc3RyaW5nIHwgU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSxcbiAgICB0YXJnZXRPcmdJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3Qgc2Vzc2lvbk9iajogU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSA9XG4gICAgICB0eXBlb2Ygc2Vzc2lvbiA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbikgOiBzZXNzaW9uO1xuXG4gICAgaWYgKHR5cGVvZiBzZXNzaW9uT2JqLnRva2VuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IG1hbmFnZXIgPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25NYW5hZ2VyO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKGF3YWl0IG1hbmFnZXIubWV0YWRhdGEoKSwgbWFuYWdlciwgdGFyZ2V0T3JnSWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXNzaW9uID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uRGF0YTtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhtZXRhZGF0YShzZXNzaW9uKSwgbmV3IE1lbW9yeVNlc3Npb25NYW5hZ2VyKHNlc3Npb24pLCB0YXJnZXRPcmdJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBzZXNzaW9uTWV0YSBUaGUgaW5pdGlhbCBzZXNzaW9uIG1ldGFkYXRhXG4gICAqIEBwYXJhbSBtYW5hZ2VyIFRoZSBtYW5hZ2VyIGZvciB0aGUgY3VycmVudCBzZXNzaW9uXG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi4gRGVmYXVsdHMgdG9cbiAgICogICB0aGUgb3JnIGlkIGZyb20gdGhlIHN1cHBsaWVkIHNlc3Npb24uIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZVxuICAgKiAgIGEge0BsaW5rIHRhcmdldE9yZ0lkfSBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmcgaWQgaXMgaWYge0BsaW5rIHRhcmdldE9yZ0lkfSBpcyBhXG4gICAqICAgY2hpbGQgb3JnYW5pemF0aW9uIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICogQHBhcmFtIGNvbmZpZyBDbGllbnQgY29uZmlndXJhdGlvblxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGEsXG4gICAgbWFuYWdlcjogU2Vzc2lvbk1hbmFnZXIsXG4gICAgdGFyZ2V0T3JnSWQ/OiBzdHJpbmcsXG4gICAgY29uZmlnPzogQ2xpZW50Q29uZmlnLFxuICApIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI3RhcmdldE9yZ0lkID0gdGFyZ2V0T3JnSWQ7XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5zZXNzaW9uTWV0YSA9IHNlc3Npb25NZXRhO1xuICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgdXBkYXRlUmV0cnlEZWxheXNNczogWzEwMCwgMjAwLCA0MDBdLFxuICAgICAgaGVhZGVyczoge30sXG4gICAgICBvcmlnaW46IHVuZGVmaW5lZCxcbiAgICAgIC4uLihjb25maWcgPz8ge30pLFxuICAgIH07XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIG9yZ2FuaXphdGlvbiBJRC4gSWYgdGhlIG9yZyBJRCB3YXMgc2V0IGV4cGxpY2l0bHksIGl0IHJldHVybnMgdGhhdCBJRDsgb3RoZXJ3aXNlIGl0IHJldHVybnMgdGhlIHNlc3Npb24ncyBvcmdhbml6YXRpb24gSUQuICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdGFyZ2V0T3JnSWQgPz8gdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgdGhlIHNlc3Npb24ncyBpbXBsaWNpdCBhcmd1bWVudHMgb24gdG9wIG9mIHdoYXQgd2FzIHByb3ZpZGVkXG4gICAqXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgYXV0aG9yaXphdGlvbiB0b2tlbiB0byB1c2UgZm9yIHRoZSByZXF1ZXN0XG4gICAqIEBwYXJhbSBvcHRzIFRoZSB1c2VyLXN1cHBsaWVkIG9wdHNcbiAgICogQHJldHVybnMgVGhlIHVuaW9uIG9mIHRoZSB1c2VyLXN1cHBsaWVkIG9wdHMgYW5kIHRoZSBkZWZhdWx0IG9uZXNcbiAgICovXG4gICNhcHBseU9wdGlvbnM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogU2ltcGxlT3B0aW9uczxUPiB7XG4gICAgY29uc3QgcGF0aFBhcmFtcyA9IFwicGF0aFwiIGluIChvcHRzLnBhcmFtcyA/PyB7fSkgPyBvcHRzLnBhcmFtcz8ucGF0aCA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBiYXNlVXJsID0gdGhpcy5lbnYuU2lnbmVyQXBpUm9vdC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gICAgY29uc3QgYnJvd3NlclVzZXJBZ2VudCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyBuYXZpZ2F0b3I/LnVzZXJBZ2VudCA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4ge1xuICAgICAgY2FjaGU6IFwibm8tc3RvcmVcIixcbiAgICAgIC8vIElmIHdlIGhhdmUgYW4gYWN0aXZlU2Vzc2lvbiwgbGV0IGl0IGRpY3RhdGUgdGhlIGJhc2VVcmwuIE90aGVyd2lzZSBmYWxsIGJhY2sgdG8gdGhlIG9uZSBzZXQgYXQgY29uc3RydWN0aW9uXG4gICAgICBiYXNlVXJsLFxuICAgICAgLi4ub3B0cyxcbiAgICAgIGhlYWRlcnM6IG1lcmdlSGVhZGVycyhcbiAgICAgICAge1xuICAgICAgICAgIFwiVXNlci1BZ2VudFwiOiBicm93c2VyVXNlckFnZW50ID8/IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgICAgIFwiWC1DdWJpc3QtVHMtU2RrXCI6IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgICAgIE9yaWdpbjogdGhpcy5jb25maWcub3JpZ2luLFxuICAgICAgICB9LFxuICAgICAgICBhdXRoSGVhZGVyKHRva2VuKSxcbiAgICAgICAgdGhpcy5jb25maWcuaGVhZGVycyxcbiAgICAgICAgb3B0cy5oZWFkZXJzLFxuICAgICAgKSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICAuLi5vcHRzLnBhcmFtcyxcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIG9yZ19pZDogdGhpcy5vcmdJZCxcbiAgICAgICAgICAuLi5wYXRoUGFyYW1zLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9IGFzIHVua25vd24gYXMgU2ltcGxlT3B0aW9uczxUPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBzcGVjaWZpYyBlcnJvciBldmVudHMgd2hlbiBhIHJlcXVlc3QgZmFpbGVkXG4gICAqXG4gICAqIEBwYXJhbSBlcnIgVGhlIGVycm9yIHRvIGNsYXNzaWZ5XG4gICAqL1xuICBhc3luYyAjY2xhc3NpZnlBbmRFbWl0RXJyb3IoZXJyOiBFcnJvckV2ZW50KSB7XG4gICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcbiAgICBBTExfRVZFTlRTLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXG4gICAgaWYgKGVyci5pc1VzZXJNZmFFcnJvcigpKSB7XG4gICAgICBjb25zdCBldiA9IFwidXNlci1tZmEtZmFpbGVkXCI7XG4gICAgICB0aGlzLmVtaXQoZXYsIGVycik7XG4gICAgICBBTExfRVZFTlRTLmVtaXQoZXYsIGVycik7XG4gICAgfVxuXG4gICAgLy8gaWYgc3RhdHVzIGlzIDQwMyBhbmQgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlIFwiaW52YWxpZCBzZXNzaW9uXCIgZXJyb3IgY29kZXMgdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkXG4gICAgLy9cbiAgICAvLyBUT0RPOiBiZWNhdXNlIGVycm9ycyByZXR1cm5lZCBieSB0aGUgYXV0aG9yaXplciBsYW1iZGEgYXJlIG5vdCBmb3J3YXJkZWQgdG8gdGhlIGNsaWVudFxuICAgIC8vICAgICAgIHdlIGFsc28gdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkIHdoZW4gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiIGZhaWxzXG4gICAgaWYgKFxuICAgICAgZXJyLnN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAoZXJyLmlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpIHx8IGVyci5vcGVyYXRpb24gPT0gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiKVxuICAgICkge1xuICAgICAgY29uc3QgZXYgPSBcInNlc3Npb24tZXhwaXJlZFwiO1xuICAgICAgdGhpcy5lbWl0KGV2LCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KGV2LCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBhbiBvcCB1c2luZyB0aGUgc3RhdGUgb2YgdGhlIGNsaWVudCAoYXV0aCBoZWFkZXJzICYgb3JnX2lkKSB3aXRoIHJldHJpZXNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBvcCBUaGUgQVBJIG9wZXJhdGlvbiB5b3Ugd2lzaCB0byBwZXJmb3JtXG4gICAqIEBwYXJhbSBvcHRzIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgb3BlcmF0aW9uXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgdGhlIHN1Y2Nlc3NmdWwgcmVzdWx0IChlcnJvcnMgd2lsbCBiZSB0aHJvd24pXG4gICAqL1xuICBhc3luYyBleGVjPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIG9wOiBPcDxUPixcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogUHJvbWlzZTxGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD4+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHRva2VuID0gYXdhaXQgdGhpcy5zZXNzaW9uTWFuYWdlci50b2tlbigpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHJldHJ5KCgpID0+IG9wKHRoaXMuI2FwcGx5T3B0aW9ucyh0b2tlbiwgb3B0cykpLCB7XG4gICAgICAgIHByZWQ6IGFzeW5jIChyZXNwKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gcmVzcC5yZXNwb25zZS5zdGF0dXM7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSByZXNwLmVycm9yIGFzIEVycm9yUmVzcG9uc2UgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgY29uc3QgcmVxdWVzdElkID0gZXJyb3I/LnJlcXVlc3RfaWQ7XG5cbiAgICAgICAgICAvLyBJZiB3ZSBnZXQgYSBcIkZvcmJpZGRlblwiIGVycm9yLCBlcmFzZSB0aGUgY2FjaGVkIHRva2VuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBUT0RPOiBDaGVjayBlcnJvciBjb2RlcyBvbmNlIG91ciBBUEkgcmV0dXJucyBlcnJvciBjb2RlcyBmb3JcbiAgICAgICAgICAvLyBhdXRob3JpemF0aW9uIGZhaWx1cmVzXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgc3RhdHVzID09PSA0MDMgJiZcbiAgICAgICAgICAgIHJlcXVlc3RJZCA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICB0aGlzLnNlc3Npb25NYW5hZ2VyLm9uSW52YWxpZFRva2VuICE9PSB1bmRlZmluZWRcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIub25JbnZhbGlkVG9rZW4oKTtcbiAgICAgICAgICAgIGNvbnN0IG9sZFRva2VuID0gdG9rZW47XG4gICAgICAgICAgICB0b2tlbiA9IGF3YWl0IHRoaXMuc2Vzc2lvbk1hbmFnZXIudG9rZW4oKTtcbiAgICAgICAgICAgIHJldHVybiB0b2tlbiAhPT0gb2xkVG9rZW47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWxzbyByZXRyeSBzZXJ2ZXItc2lkZSBlcnJvcnNcbiAgICAgICAgICByZXR1cm4gc3RhdHVzID49IDUwMCAmJiBzdGF0dXMgPCA2MDA7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIC8vIE9uY2Ugd2UgaGF2ZSBhIG5vbi01WFggcmVzcG9uc2UsIHdlIHdpbGwgYXNzZXJ0T2sgKGVpdGhlciB0aHJvd2luZyBvciB5aWVsZGluZyB0aGUgcmVzcG9uc2UpXG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJSZXNwb25zZSkge1xuICAgICAgICBhd2FpdCB0aGlzLiNjbGFzc2lmeUFuZEVtaXRFcnJvcihlKTsgLy8gRW1pdCBhcHByb3ByaWF0ZSBldmVudHNcbiAgICAgIH1cbiAgICAgIHRocm93IGU7IC8vIFJldGhyb3cgdGhlIGVycm9yXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBncmFkZSBhIHNlc3Npb24gcmVzcG9uc2UgaW50byBhIGZ1bGwgU2Vzc2lvbkRhdGEgYnkgaW5jb3Jwb3JhdGluZ1xuICogZWxlbWVudHMgb2YgYW4gZXhpc3RpbmcgU2Vzc2lvbkRhdGFcbiAqXG4gKiBAcGFyYW0gbWV0YSBBbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICogQHBhcmFtIGluZm8gQSBuZXcgc2Vzc2lvbiBjcmVhdGVkIHZpYSB0aGUgQVBJXG4gKiBAcGFyYW0gY3R4IEFkZGl0aW9uYWwgbWFudWFsIG92ZXJyaWRlc1xuICogQHJldHVybnMgU2Vzc2lvbkRhdGEgd2l0aCBuZXcgaW5mb3JtYXRpb24gZnJvbSBpbmZvIGFuZCBjdHhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8oXG4gIG1ldGE6IFNlc3Npb25NZXRhZGF0YSxcbiAgaW5mbzogTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBjdHg6IFBhcnRpYWw8eyBwdXJwb3NlOiBzdHJpbmc7IHJvbGVfaWQ6IHN0cmluZzsgb3JnX2lkOiBzdHJpbmcgfT4sXG4pOiBTZXNzaW9uRGF0YSB7XG4gIHJldHVybiB7XG4gICAgZW52OiBtZXRhLmVudixcbiAgICBvcmdfaWQ6IG1ldGEub3JnX2lkLFxuICAgIHNlc3Npb25fZXhwOiBpbmZvLmV4cGlyYXRpb24sXG4gICAgc2Vzc2lvbl9pbmZvOiBpbmZvLnNlc3Npb25faW5mbyxcbiAgICB0b2tlbjogaW5mby50b2tlbixcbiAgICByZWZyZXNoX3Rva2VuOiBpbmZvLnJlZnJlc2hfdG9rZW4sXG4gICAgcHVycG9zZTogbWV0YS5wdXJwb3NlLFxuICAgIHJvbGVfaWQ6IG1ldGEucm9sZV9pZCxcbiAgICAuLi5jdHgsXG4gIH07XG59XG5cbnR5cGUgRGVlcE9taXQ8QSwgQj4gPSBbQSwgQl0gZXh0ZW5kcyBbb2JqZWN0LCBvYmplY3RdXG4gID8ge1xuICAgICAgW0sgaW4ga2V5b2YgQSBhcyBLIGV4dGVuZHMga2V5b2YgQiAvLyBJZiB0aGUga2V5IGlzIGluIGJvdGggQSBhbmQgQlxuICAgICAgICA/IEFbS10gZXh0ZW5kcyBCW0tdXG4gICAgICAgICAgPyBLIC8vXG4gICAgICAgICAgOiBuZXZlclxuICAgICAgICA6IG5ldmVyXT86IEsgZXh0ZW5kcyBrZXlvZiBCID8gRGVlcE9taXQ8QVtLXSwgQltLXT4gOiBuZXZlcjtcbiAgICB9ICYge1xuICAgICAgW0sgaW4ga2V5b2YgQSBhcyBLIGV4dGVuZHMga2V5b2YgQiA/IChCW0tdIGV4dGVuZHMgQVtLXSA/IG5ldmVyIDogSykgOiBLXTogSyBleHRlbmRzIGtleW9mIEJcbiAgICAgICAgPyBEZWVwT21pdDxBW0tdLCBCW0tdPlxuICAgICAgICA6IEFbS107XG4gICAgfVxuICA6IEE7XG5cbmV4cG9ydCB0eXBlIE9taXRBdXRvUGFyYW1zPE8+ID0gRGVlcE9taXQ8XG4gIE8sXG4gIHtcbiAgICBiYXNlVXJsOiBzdHJpbmc7XG4gICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBzdHJpbmcgfSB9O1xuICB9XG4+ICYgeyBwYXJhbXM/OiB7IHBhdGg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB9IH07XG5cbi8qKlxuICogQ3JlYXRlcyB7QGxpbmsgSGVhZGVyc0luaXR9IGNvbnRhaW5pbmcgYSBzaW5nbGUgXCJBdXRob3JpemF0aW9uXCIgaGVhZGVyIHdpdGggYSBnaXZlbiB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gVGhlIFwiQXV0aG9yaXphdGlvblwiIGhlYWRlciB2YWx1ZVxuICogQHJldHVybnMgQSB7QGxpbmsgSGVhZGVyc0luaXR9IG9iamVjdCBjb250YWluaW5nIGEgc2luZ2xlIFwiQXV0aG9yaXphdGlvblwiIGhlYWRlciB3aXRoIGEgZ2l2ZW4gdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdXRoSGVhZGVyKHRva2VuOiBzdHJpbmcpOiBIZWFkZXJzSW5pdCB7XG4gIHJldHVybiB7IEF1dGhvcml6YXRpb246IHRva2VuIH07XG59XG4iXX0=