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
// NOTE: add '// @ts-nocheck' at the top of this file to speed up type checking
const package_json_1 = __importDefault(require("../../package.json"));
const fetch_1 = require("../fetch");
const retry_1 = require("../retry");
const events_1 = require("../events");
const error_1 = require("../error");
const session_1 = require("./session");
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
            // Once we have a non-5XX response, we will assertOk (either throwing or yielding the reponse)
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
        headers: {
            "User-Agent": browserUserAgent ?? `${exports.NAME}@${exports.VERSION}`,
            "X-Cubist-Ts-Sdk": `${exports.NAME}@${exports.VERSION}`,
            Origin: this.config.origin,
            Authorization: token,
            ...(this.config.headers ?? {}),
            ...opts.headers,
        },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStRQSxvRUFnQkM7QUEvUkQsK0VBQStFO0FBQy9FLHNFQUFxQztBQUVyQyxvQ0FBb0M7QUFDcEMsb0NBQWlDO0FBQ2pDLHNDQUF5QztBQUN6QyxvQ0FBdUM7QUFFdkMsdUNBQW1GO0FBSW5GLGtDQUFrQztBQUNyQixRQUFBLElBQUksR0FBVyxzQkFBRyxDQUFDLElBQUksQ0FBQztBQUVyQyw2QkFBNkI7QUFDaEIsUUFBQSxPQUFPLEdBQVcsc0JBQUcsQ0FBQyxPQUFPLENBQUM7QUFJM0MsK0VBQStFO0FBQy9FLE1BQWEsbUJBQW1CO0NBQUc7QUFBbkMsa0RBQW1DO0FBRW5DLHdGQUF3RjtBQUN4RixNQUFhLGtCQUFtQixTQUFRLG1CQUFXO0NBQUc7QUFBdEQsZ0RBQXNEO0FBWXREOzs7O0dBSUc7QUFDVSxRQUFBLFVBQVUsR0FBK0IsSUFBSSxxQkFBWSxFQUFFLENBQUM7QUFnQnpFOztHQUVHO0FBQ0gsTUFBYSxVQUFXLFNBQVEscUJBQTBCO0lBbUJ4RCx1QkFBdUI7SUFDdkIsSUFBSSxHQUFHO1FBQ0wsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBRWpCLE9BQThDLEVBQzlDLFdBQW9CO1FBRXBCLE1BQU0sVUFBVSxHQUNkLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSxnQ0FBc0IsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBRTFFLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQzNDLE1B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RSxJQUFJLENBQUMsS0FBSztRQUNqQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7UUFDakMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1FBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixHQUFHLEdBQUc7S0FDUCxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIE5PVEU6IGFkZCAnLy8gQHRzLW5vY2hlY2snIGF0IHRoZSB0b3Agb2YgdGhpcyBmaWxlIHRvIHNwZWVkIHVwIHR5cGUgY2hlY2tpbmdcbmltcG9ydCBwa2cgZnJvbSBcIi4uLy4uL3BhY2thZ2UuanNvblwiO1xuaW1wb3J0IHR5cGUgeyBGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGEsIE9wLCBPcGVyYXRpb24sIFNpbXBsZU9wdGlvbnMgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyByZXRyeSB9IGZyb20gXCIuLi9yZXRyeVwiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4uL2V2ZW50c1wiO1xuaW1wb3J0IHsgRXJyUmVzcG9uc2UgfSBmcm9tIFwiLi4vZXJyb3JcIjtcbmltcG9ydCB0eXBlIHsgU2Vzc2lvbkRhdGEsIFNlc3Npb25NYW5hZ2VyLCBTZXNzaW9uTWV0YWRhdGEgfSBmcm9tIFwiLi9zZXNzaW9uXCI7XG5pbXBvcnQgeyBNZW1vcnlTZXNzaW9uTWFuYWdlciwgbWV0YWRhdGEsIHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEgfSBmcm9tIFwiLi9zZXNzaW9uXCI7XG5pbXBvcnQgdHlwZSB7IE5ld1Nlc3Npb25SZXNwb25zZSwgRXJyb3JSZXNwb25zZSB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uL2VudlwiO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgcGFja2FnZSBuYW1lICovXG5leHBvcnQgY29uc3QgTkFNRTogc3RyaW5nID0gcGtnLm5hbWU7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyB2ZXJzaW9uICovXG5leHBvcnQgY29uc3QgVkVSU0lPTjogc3RyaW5nID0gcGtnLnZlcnNpb247XG5cbmV4cG9ydCB0eXBlIEVycm9yRXZlbnQgPSBFcnJSZXNwb25zZTtcblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgYmVjYXVzZSBvZiBhbiBleHBpcmVkL2ludmFsaWQgc2Vzc2lvbiAqL1xuZXhwb3J0IGNsYXNzIFNlc3Npb25FeHBpcmVkRXZlbnQge31cblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgYmVjYXVzZSB1c2VyIGZhaWxlZCB0byBhbnN3ZXIgYW4gTUZBIGNoYWxsZW5nZSAqL1xuZXhwb3J0IGNsYXNzIFVzZXJNZmFGYWlsZWRFdmVudCBleHRlbmRzIEVyclJlc3BvbnNlIHt9XG5cbnR5cGUgQ2xpZW50RXZlbnRzID0ge1xuICBcInVzZXItbWZhLWZhaWxlZFwiOiAoZXY6IFVzZXJNZmFGYWlsZWRFdmVudCkgPT4gdm9pZDtcbiAgXCJzZXNzaW9uLWV4cGlyZWRcIjogKGV2OiBTZXNzaW9uRXhwaXJlZEV2ZW50KSA9PiB2b2lkO1xuICBlcnJvcjogKGV2OiBFcnJvckV2ZW50KSA9PiB2b2lkO1xufTtcblxudHlwZSBTdGF0aWNDbGllbnRTdWJjbGFzczxUPiA9IHtcbiAgbmV3ICguLi5hcmdzOiBDb25zdHJ1Y3RvclBhcmFtZXRlcnM8dHlwZW9mIEJhc2VDbGllbnQ+KTogVDtcbn0gJiB0eXBlb2YgQmFzZUNsaWVudDtcblxuLyoqXG4gKiBBbiBldmVudCBlbWl0dGVyIGZvciBhbGwgY2xpZW50c1xuICpcbiAqIEBkZXByZWNhdGVkXG4gKi9cbmV4cG9ydCBjb25zdCBBTExfRVZFTlRTOiBFdmVudEVtaXR0ZXI8Q2xpZW50RXZlbnRzPiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuLyoqXG4gKiBDbGllbnQgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENsaWVudENvbmZpZyB7XG4gIC8qKiBVcGRhdGUgcmV0cnkgZGVsYXlzIChpbiBtaWxsaXNlY29uZHMpICovXG4gIHVwZGF0ZVJldHJ5RGVsYXlzTXM6IG51bWJlcltdO1xuXG4gIC8qKiBDdXN0b20gb3JpZ2luIHRvIHNldCAoTk9URSB0aGF0IGlmIHJ1bm5pbmcgaW4gYSBicm93c2VyLCB0aGUgYnJvd3NlciB3aWxsIG92ZXJ3cml0ZSB0aGlzKSAqL1xuICBvcmlnaW4/OiBzdHJpbmc7XG5cbiAgLyoqIEFkZGl0aW9uYWwgaGVhZGVycyB0byBzZXQgKGRlZmF1bHQgdG8gZW1wdHkpICovXG4gIGhlYWRlcnM6IEhlYWRlcnNJbml0O1xufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSByZXRyeSBzdHJhdGVneSBhbmQgc2Vzc2lvbiByZWZyZXNoZXNcbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDbGllbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8Q2xpZW50RXZlbnRzPiB7XG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc2Vzc2lvbiBjb250YWluZWQgd2l0aGluIHRoZSBjbGllbnQgKi9cbiAgc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YTtcblxuICAvKiogU2Vzc2lvbiBwZXJzaXN0ZW5jZSAqL1xuICBwcm90ZWN0ZWQgc2Vzc2lvbk1hbmFnZXI6IFNlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKlxuICAgKiBUYXJnZXQgb3JnIGlkLCBpLmUuLCB0aGUgb3JnYW5pemF0aW9uIHRoaXMgY2xpZW50IHNob3VsZCBvcGVyYXRlIG9uLlxuICAgKlxuICAgKiBUaGUgb25seSBzY2VuYXJpbyBpbiB3aGljaCBpdCBtYWtlcyBzZW5zZSB0byB1c2UgYSB0YXJnZXQgb3JnYW5pemF0aW9uXG4gICAqIGRpZmZlcmVudCBmcm9tIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbiBpcyBpZiB0aGUgdGFyZ2V0IG9yZ2FuaXphdGlvbiBpc1xuICAgKiBhIGNoaWxkIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICovXG4gICN0YXJnZXRPcmdJZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBNVVRBQkxFIGNvbmZpZ3VyYXRpb24uICovXG4gIHJlYWRvbmx5IGNvbmZpZzogQ2xpZW50Q29uZmlnO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgZW52ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWV0YS5lbnZbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIGNsaWVudCB3aXRoIGEgc2Vzc2lvbiBvciBzZXNzaW9uIG1hbmFnZXJcbiAgICpcbiAgICogQHBhcmFtIHRoaXMgQWxsb3dzIHRoaXMgc3RhdGljIG1ldGhvZCB0byByZXR1cm4gc3VidHlwZXMgd2hlbiBpbnZva2VkIHRocm91Z2ggdGhlbVxuICAgKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiAob2JqZWN0IG9yIGJhc2U2NCBzdHJpbmcpIG9yIG1hbmFnZXIgdGhhdCB3aWxsIGJhY2sgdGhpcyBjbGllbnRcbiAgICogQHBhcmFtIHRhcmdldE9yZ0lkIFRoZSBJRCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoaXMgY2xpZW50IHNob3VsZCBvcGVyYXRlIG9uLiBEZWZhdWx0cyB0b1xuICAgKiAgIHRoZSBvcmcgaWQgZnJvbSB0aGUgc3VwcGxpZWQgc2Vzc2lvbi4gVGhlIG9ubHkgc2NlbmFyaW8gaW4gd2hpY2ggaXQgbWFrZXMgc2Vuc2UgdG8gdXNlXG4gICAqICAgYSB7QGxpbmsgdGFyZ2V0T3JnSWR9IGRpZmZlcmVudCBmcm9tIHRoZSBzZXNzaW9uIG9yZyBpZCBpcyBpZiB7QGxpbmsgdGFyZ2V0T3JnSWR9IGlzIGFcbiAgICogICBjaGlsZCBvcmdhbml6YXRpb24gb2YgdGhlIHNlc3Npb24gb3JnYW5pemF0aW9uLlxuICAgKiBAcmV0dXJucyBBIENsaWVudFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxUPihcbiAgICB0aGlzOiBTdGF0aWNDbGllbnRTdWJjbGFzczxUPixcbiAgICBzZXNzaW9uOiBzdHJpbmcgfCBTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhLFxuICAgIHRhcmdldE9yZ0lkPzogc3RyaW5nLFxuICApOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBzZXNzaW9uT2JqOiBTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhID1cbiAgICAgIHR5cGVvZiBzZXNzaW9uID09PSBcInN0cmluZ1wiID8gcGFyc2VCYXNlNjRTZXNzaW9uRGF0YShzZXNzaW9uKSA6IHNlc3Npb247XG5cbiAgICBpZiAodHlwZW9mIHNlc3Npb25PYmoudG9rZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY29uc3QgbWFuYWdlciA9IHNlc3Npb25PYmogYXMgU2Vzc2lvbk1hbmFnZXI7XG4gICAgICByZXR1cm4gbmV3IHRoaXMoYXdhaXQgbWFuYWdlci5tZXRhZGF0YSgpLCBtYW5hZ2VyLCB0YXJnZXRPcmdJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlc3Npb24gPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25EYXRhO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKG1ldGFkYXRhKHNlc3Npb24pLCBuZXcgTWVtb3J5U2Vzc2lvbk1hbmFnZXIoc2Vzc2lvbiksIHRhcmdldE9yZ0lkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHNlc3Npb25NZXRhIFRoZSBpbml0aWFsIHNlc3Npb24gbWV0YWRhdGFcbiAgICogQHBhcmFtIG1hbmFnZXIgVGhlIG1hbmFnZXIgZm9yIHRoZSBjdXJyZW50IHNlc3Npb25cbiAgICogQHBhcmFtIHRhcmdldE9yZ0lkIFRoZSBJRCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoaXMgY2xpZW50IHNob3VsZCBvcGVyYXRlIG9uLiBEZWZhdWx0cyB0b1xuICAgKiAgIHRoZSBvcmcgaWQgZnJvbSB0aGUgc3VwcGxpZWQgc2Vzc2lvbi4gVGhlIG9ubHkgc2NlbmFyaW8gaW4gd2hpY2ggaXQgbWFrZXMgc2Vuc2UgdG8gdXNlXG4gICAqICAgYSB7QGxpbmsgdGFyZ2V0T3JnSWR9IGRpZmZlcmVudCBmcm9tIHRoZSBzZXNzaW9uIG9yZyBpZCBpcyBpZiB7QGxpbmsgdGFyZ2V0T3JnSWR9IGlzIGFcbiAgICogICBjaGlsZCBvcmdhbml6YXRpb24gb2YgdGhlIHNlc3Npb24gb3JnYW5pemF0aW9uLlxuICAgKiBAcGFyYW0gY29uZmlnIENsaWVudCBjb25maWd1cmF0aW9uXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YSxcbiAgICBtYW5hZ2VyOiBTZXNzaW9uTWFuYWdlcixcbiAgICB0YXJnZXRPcmdJZD86IHN0cmluZyxcbiAgICBjb25maWc/OiBDbGllbnRDb25maWcsXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jdGFyZ2V0T3JnSWQgPSB0YXJnZXRPcmdJZDtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNlc3Npb25NZXRhID0gc2Vzc2lvbk1ldGE7XG4gICAgdGhpcy5jb25maWcgPSB7XG4gICAgICB1cGRhdGVSZXRyeURlbGF5c01zOiBbMTAwLCAyMDAsIDQwMF0sXG4gICAgICBoZWFkZXJzOiB7fSxcbiAgICAgIG9yaWdpbjogdW5kZWZpbmVkLFxuICAgICAgLi4uKGNvbmZpZyA/PyB7fSksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgb3JnYW5pemF0aW9uIElELiBJZiB0aGUgb3JnIElEIHdhcyBzZXQgZXhwbGljaXRseSwgaXQgcmV0dXJucyB0aGF0IElEOyBvdGhlcndpc2UgaXQgcmV0dXJucyB0aGUgc2Vzc2lvbidzIG9yZ2FuaXphdGlvbiBJRC4gKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLiN0YXJnZXRPcmdJZCA/PyB0aGlzLnNlc3Npb25NZXRhLm9yZ19pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSB0aGUgc2Vzc2lvbidzIGltcGxpY2l0IGFyZ3VtZW50cyBvbiB0b3Agb2Ygd2hhdCB3YXMgcHJvdmlkZWRcbiAgICpcbiAgICogQHBhcmFtIHRva2VuIFRoZSBhdXRob3JpemF0aW9uIHRva2VuIHRvIHVzZSBmb3IgdGhlIHJlcXVlc3RcbiAgICogQHBhcmFtIG9wdHMgVGhlIHVzZXItc3VwcGxpZWQgb3B0c1xuICAgKiBAcmV0dXJucyBUaGUgdW5pb24gb2YgdGhlIHVzZXItc3VwcGxpZWQgb3B0cyBhbmQgdGhlIGRlZmF1bHQgb25lc1xuICAgKi9cbiAgI2FwcGx5T3B0aW9uczxUIGV4dGVuZHMgT3BlcmF0aW9uPihcbiAgICB0b2tlbjogc3RyaW5nLFxuICAgIG9wdHM6IE9taXRBdXRvUGFyYW1zPFNpbXBsZU9wdGlvbnM8VD4+LFxuICApOiBTaW1wbGVPcHRpb25zPFQ+IHtcbiAgICBjb25zdCBwYXRoUGFyYW1zID0gXCJwYXRoXCIgaW4gKG9wdHMucGFyYW1zID8/IHt9KSA/IG9wdHMucGFyYW1zPy5wYXRoIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGJhc2VVcmwgPSB0aGlzLmVudi5TaWduZXJBcGlSb290LnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgICBjb25zdCBicm93c2VyVXNlckFnZW50ID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IG5hdmlnYXRvcj8udXNlckFnZW50IDogdW5kZWZpbmVkO1xuICAgIHJldHVybiB7XG4gICAgICBjYWNoZTogXCJuby1zdG9yZVwiLFxuICAgICAgLy8gSWYgd2UgaGF2ZSBhbiBhY3RpdmVTZXNzaW9uLCBsZXQgaXQgZGljdGF0ZSB0aGUgYmFzZVVybC4gT3RoZXJ3aXNlIGZhbGwgYmFjayB0byB0aGUgb25lIHNldCBhdCBjb25zdHJ1Y3Rpb25cbiAgICAgIGJhc2VVcmwsXG4gICAgICAuLi5vcHRzLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIlVzZXItQWdlbnRcIjogYnJvd3NlclVzZXJBZ2VudCA/PyBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgXCJYLUN1YmlzdC1Ucy1TZGtcIjogYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICAgIE9yaWdpbjogdGhpcy5jb25maWcub3JpZ2luLFxuICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgLi4uKHRoaXMuY29uZmlnLmhlYWRlcnMgPz8ge30pLFxuICAgICAgICAuLi5vcHRzLmhlYWRlcnMsXG4gICAgICB9LFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIC4uLm9wdHMucGFyYW1zLFxuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgb3JnX2lkOiB0aGlzLm9yZ0lkLFxuICAgICAgICAgIC4uLnBhdGhQYXJhbXMsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0gYXMgdW5rbm93biBhcyBTaW1wbGVPcHRpb25zPFQ+O1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIHNwZWNpZmljIGVycm9yIGV2ZW50cyB3aGVuIGEgcmVxdWVzdCBmYWlsZWRcbiAgICpcbiAgICogQHBhcmFtIGVyciBUaGUgZXJyb3IgdG8gY2xhc3NpZnlcbiAgICovXG4gIGFzeW5jICNjbGFzc2lmeUFuZEVtaXRFcnJvcihlcnI6IEVycm9yRXZlbnQpIHtcbiAgICB0aGlzLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuICAgIEFMTF9FVkVOVFMuZW1pdChcImVycm9yXCIsIGVycik7XG5cbiAgICBpZiAoZXJyLmlzVXNlck1mYUVycm9yKCkpIHtcbiAgICAgIGNvbnN0IGV2ID0gXCJ1c2VyLW1mYS1mYWlsZWRcIjtcbiAgICAgIHRoaXMuZW1pdChldiwgZXJyKTtcbiAgICAgIEFMTF9FVkVOVFMuZW1pdChldiwgZXJyKTtcbiAgICB9XG5cbiAgICAvLyBpZiBzdGF0dXMgaXMgNDAzIGFuZCBlcnJvciBtYXRjaGVzIG9uZSBvZiB0aGUgXCJpbnZhbGlkIHNlc3Npb25cIiBlcnJvciBjb2RlcyB0cmlnZ2VyIG9uU2Vzc2lvbkV4cGlyZWRcbiAgICAvL1xuICAgIC8vIFRPRE86IGJlY2F1c2UgZXJyb3JzIHJldHVybmVkIGJ5IHRoZSBhdXRob3JpemVyIGxhbWJkYSBhcmUgbm90IGZvcndhcmRlZCB0byB0aGUgY2xpZW50XG4gICAgLy8gICAgICAgd2UgYWxzbyB0cmlnZ2VyIG9uU2Vzc2lvbkV4cGlyZWQgd2hlbiBcInNpZ25lclNlc3Npb25SZWZyZXNoXCIgZmFpbHNcbiAgICBpZiAoXG4gICAgICBlcnIuc3RhdHVzID09PSA0MDMgJiZcbiAgICAgIChlcnIuaXNTZXNzaW9uRXhwaXJlZEVycm9yKCkgfHwgZXJyLm9wZXJhdGlvbiA9PSBcInNpZ25lclNlc3Npb25SZWZyZXNoXCIpXG4gICAgKSB7XG4gICAgICBjb25zdCBldiA9IFwic2Vzc2lvbi1leHBpcmVkXCI7XG4gICAgICB0aGlzLmVtaXQoZXYsIGVycik7XG4gICAgICBBTExfRVZFTlRTLmVtaXQoZXYsIGVycik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGFuIG9wIHVzaW5nIHRoZSBzdGF0ZSBvZiB0aGUgY2xpZW50IChhdXRoIGhlYWRlcnMgJiBvcmdfaWQpIHdpdGggcmV0cmllc1xuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIG9wIFRoZSBBUEkgb3BlcmF0aW9uIHlvdSB3aXNoIHRvIHBlcmZvcm1cbiAgICogQHBhcmFtIG9wdHMgVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBvcGVyYXRpb25cbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciB0aGUgc3VjY2Vzc2Z1bCByZXN1bHQgKGVycm9ycyB3aWxsIGJlIHRocm93bilcbiAgICovXG4gIGFzeW5jIGV4ZWM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgb3A6IE9wPFQ+LFxuICAgIG9wdHM6IE9taXRBdXRvUGFyYW1zPFNpbXBsZU9wdGlvbnM8VD4+LFxuICApOiBQcm9taXNlPEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPj4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgdG9rZW4gPSBhd2FpdCB0aGlzLnNlc3Npb25NYW5hZ2VyLnRva2VuKCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgcmV0cnkoKCkgPT4gb3AodGhpcy4jYXBwbHlPcHRpb25zKHRva2VuLCBvcHRzKSksIHtcbiAgICAgICAgcHJlZDogYXN5bmMgKHJlc3ApID0+IHtcbiAgICAgICAgICBjb25zdCBzdGF0dXMgPSByZXNwLnJlc3BvbnNlLnN0YXR1cztcbiAgICAgICAgICBjb25zdCBlcnJvciA9IHJlc3AuZXJyb3IgYXMgRXJyb3JSZXNwb25zZSB8IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCByZXF1ZXN0SWQgPSBlcnJvcj8ucmVxdWVzdF9pZDtcblxuICAgICAgICAgIC8vIElmIHdlIGdldCBhIFwiRm9yYmlkZGVuXCIgZXJyb3IsIGVyYXNlIHRoZSBjYWNoZWQgdG9rZW5cbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIFRPRE86IENoZWNrIGVycm9yIGNvZGVzIG9uY2Ugb3VyIEFQSSByZXR1cm5zIGVycm9yIGNvZGVzIGZvclxuICAgICAgICAgIC8vIGF1dGhvcml6YXRpb24gZmFpbHVyZXNcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBzdGF0dXMgPT09IDQwMyAmJlxuICAgICAgICAgICAgcmVxdWVzdElkID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIub25JbnZhbGlkVG9rZW4gIT09IHVuZGVmaW5lZFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5zZXNzaW9uTWFuYWdlci5vbkludmFsaWRUb2tlbigpO1xuICAgICAgICAgICAgY29uc3Qgb2xkVG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAgIHRva2VuID0gYXdhaXQgdGhpcy5zZXNzaW9uTWFuYWdlci50b2tlbigpO1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuICE9PSBvbGRUb2tlbjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBbHNvIHJldHJ5IHNlcnZlci1zaWRlIGVycm9yc1xuICAgICAgICAgIHJldHVybiBzdGF0dXMgPj0gNTAwICYmIHN0YXR1cyA8IDYwMDtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgLy8gT25jZSB3ZSBoYXZlIGEgbm9uLTVYWCByZXNwb25zZSwgd2Ugd2lsbCBhc3NlcnRPayAoZWl0aGVyIHRocm93aW5nIG9yIHlpZWxkaW5nIHRoZSByZXBvbnNlKVxuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyUmVzcG9uc2UpIHtcbiAgICAgICAgYXdhaXQgdGhpcy4jY2xhc3NpZnlBbmRFbWl0RXJyb3IoZSk7IC8vIEVtaXQgYXBwcm9wcmlhdGUgZXZlbnRzXG4gICAgICB9XG4gICAgICB0aHJvdyBlOyAvLyBSZXRocm93IHRoZSBlcnJvclxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZ3JhZGUgYSBzZXNzaW9uIHJlc3BvbnNlIGludG8gYSBmdWxsIFNlc3Npb25EYXRhIGJ5IGluY29ycG9yYXRpbmdcbiAqIGVsZW1lbnRzIG9mIGFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKlxuICogQHBhcmFtIG1ldGEgQW4gZXhpc3RpbmcgU2Vzc2lvbkRhdGFcbiAqIEBwYXJhbSBpbmZvIEEgbmV3IHNlc3Npb24gY3JlYXRlZCB2aWEgdGhlIEFQSVxuICogQHBhcmFtIGN0eCBBZGRpdGlvbmFsIG1hbnVhbCBvdmVycmlkZXNcbiAqIEByZXR1cm5zIFNlc3Npb25EYXRhIHdpdGggbmV3IGluZm9ybWF0aW9uIGZyb20gaW5mbyBhbmQgY3R4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKFxuICBtZXRhOiBTZXNzaW9uTWV0YWRhdGEsXG4gIGluZm86IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgY3R4OiBQYXJ0aWFsPHsgcHVycG9zZTogc3RyaW5nOyByb2xlX2lkOiBzdHJpbmc7IG9yZ19pZDogc3RyaW5nIH0+LFxuKTogU2Vzc2lvbkRhdGEge1xuICByZXR1cm4ge1xuICAgIGVudjogbWV0YS5lbnYsXG4gICAgb3JnX2lkOiBtZXRhLm9yZ19pZCxcbiAgICBzZXNzaW9uX2V4cDogaW5mby5leHBpcmF0aW9uLFxuICAgIHNlc3Npb25faW5mbzogaW5mby5zZXNzaW9uX2luZm8sXG4gICAgdG9rZW46IGluZm8udG9rZW4sXG4gICAgcmVmcmVzaF90b2tlbjogaW5mby5yZWZyZXNoX3Rva2VuLFxuICAgIHB1cnBvc2U6IG1ldGEucHVycG9zZSxcbiAgICByb2xlX2lkOiBtZXRhLnJvbGVfaWQsXG4gICAgLi4uY3R4LFxuICB9O1xufVxuXG50eXBlIERlZXBPbWl0PEEsIEI+ID0gW0EsIEJdIGV4dGVuZHMgW29iamVjdCwgb2JqZWN0XVxuICA/IHtcbiAgICAgIFtLIGluIGtleW9mIEEgYXMgSyBleHRlbmRzIGtleW9mIEIgLy8gSWYgdGhlIGtleSBpcyBpbiBib3RoIEEgYW5kIEJcbiAgICAgICAgPyBBW0tdIGV4dGVuZHMgQltLXVxuICAgICAgICAgID8gSyAvL1xuICAgICAgICAgIDogbmV2ZXJcbiAgICAgICAgOiBuZXZlcl0/OiBLIGV4dGVuZHMga2V5b2YgQiA/IERlZXBPbWl0PEFbS10sIEJbS10+IDogbmV2ZXI7XG4gICAgfSAmIHtcbiAgICAgIFtLIGluIGtleW9mIEEgYXMgSyBleHRlbmRzIGtleW9mIEIgPyAoQltLXSBleHRlbmRzIEFbS10gPyBuZXZlciA6IEspIDogS106IEsgZXh0ZW5kcyBrZXlvZiBCXG4gICAgICAgID8gRGVlcE9taXQ8QVtLXSwgQltLXT5cbiAgICAgICAgOiBBW0tdO1xuICAgIH1cbiAgOiBBO1xuXG5leHBvcnQgdHlwZSBPbWl0QXV0b1BhcmFtczxPPiA9IERlZXBPbWl0PFxuICBPLFxuICB7XG4gICAgYmFzZVVybDogc3RyaW5nO1xuICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogc3RyaW5nIH0gfTtcbiAgfVxuPiAmIHsgcGFyYW1zPzogeyBwYXRoPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfSB9O1xuIl19