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
     *
     * @internal
     */
    constructor(sessionMeta, manager, targetOrgId) {
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
        /** MUTABLE configuration. */
        this.config = {
            updateRetryDelaysMs: [100, 200, 400],
            origin: undefined,
        };
        __classPrivateFieldSet(this, _BaseClient_targetOrgId, targetOrgId, "f");
        this.sessionManager = manager;
        this.sessionMeta = sessionMeta;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtRQSxvRUFnQkM7QUFsUkQsK0VBQStFO0FBQy9FLHNFQUFxQztBQUVyQyxvQ0FBb0M7QUFDcEMsb0NBQWlDO0FBQ2pDLHNDQUF5QztBQUN6QyxvQ0FBdUM7QUFFdkMsdUNBQW1GO0FBSW5GLGtDQUFrQztBQUNyQixRQUFBLElBQUksR0FBVyxzQkFBRyxDQUFDLElBQUksQ0FBQztBQUVyQyw2QkFBNkI7QUFDaEIsUUFBQSxPQUFPLEdBQVcsc0JBQUcsQ0FBQyxPQUFPLENBQUM7QUFJM0MsK0VBQStFO0FBQy9FLE1BQWEsbUJBQW1CO0NBQUc7QUFBbkMsa0RBQW1DO0FBRW5DLHdGQUF3RjtBQUN4RixNQUFhLGtCQUFtQixTQUFRLG1CQUFXO0NBQUc7QUFBdEQsZ0RBQXNEO0FBWXREOzs7O0dBSUc7QUFDVSxRQUFBLFVBQVUsR0FBK0IsSUFBSSxxQkFBWSxFQUFFLENBQUM7QUFhekU7O0dBRUc7QUFDSCxNQUFhLFVBQVcsU0FBUSxxQkFBMEI7SUFzQnhELHVCQUF1QjtJQUN2QixJQUFJLEdBQUc7UUFDTCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FFakIsT0FBOEMsRUFDOUMsV0FBb0I7UUFFcEIsTUFBTSxVQUFVLEdBQ2QsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLGdDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFFMUUsSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDM0MsTUFB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QUc7S0FDUCxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIE5PVEU6IGFkZCAnLy8gQHRzLW5vY2hlY2snIGF0IHRoZSB0b3Agb2YgdGhpcyBmaWxlIHRvIHNwZWVkIHVwIHR5cGUgY2hlY2tpbmdcbmltcG9ydCBwa2cgZnJvbSBcIi4uLy4uL3BhY2thZ2UuanNvblwiO1xuaW1wb3J0IHR5cGUgeyBGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGEsIE9wLCBPcGVyYXRpb24sIFNpbXBsZU9wdGlvbnMgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyByZXRyeSB9IGZyb20gXCIuLi9yZXRyeVwiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4uL2V2ZW50c1wiO1xuaW1wb3J0IHsgRXJyUmVzcG9uc2UgfSBmcm9tIFwiLi4vZXJyb3JcIjtcbmltcG9ydCB0eXBlIHsgU2Vzc2lvbkRhdGEsIFNlc3Npb25NYW5hZ2VyLCBTZXNzaW9uTWV0YWRhdGEgfSBmcm9tIFwiLi9zZXNzaW9uXCI7XG5pbXBvcnQgeyBNZW1vcnlTZXNzaW9uTWFuYWdlciwgbWV0YWRhdGEsIHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEgfSBmcm9tIFwiLi9zZXNzaW9uXCI7XG5pbXBvcnQgdHlwZSB7IE5ld1Nlc3Npb25SZXNwb25zZSwgRXJyb3JSZXNwb25zZSB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4uL2VudlwiO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgcGFja2FnZSBuYW1lICovXG5leHBvcnQgY29uc3QgTkFNRTogc3RyaW5nID0gcGtnLm5hbWU7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyB2ZXJzaW9uICovXG5leHBvcnQgY29uc3QgVkVSU0lPTjogc3RyaW5nID0gcGtnLnZlcnNpb247XG5cbmV4cG9ydCB0eXBlIEVycm9yRXZlbnQgPSBFcnJSZXNwb25zZTtcblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgYmVjYXVzZSBvZiBhbiBleHBpcmVkL2ludmFsaWQgc2Vzc2lvbiAqL1xuZXhwb3J0IGNsYXNzIFNlc3Npb25FeHBpcmVkRXZlbnQge31cblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgYmVjYXVzZSB1c2VyIGZhaWxlZCB0byBhbnN3ZXIgYW4gTUZBIGNoYWxsZW5nZSAqL1xuZXhwb3J0IGNsYXNzIFVzZXJNZmFGYWlsZWRFdmVudCBleHRlbmRzIEVyclJlc3BvbnNlIHt9XG5cbnR5cGUgQ2xpZW50RXZlbnRzID0ge1xuICBcInVzZXItbWZhLWZhaWxlZFwiOiAoZXY6IFVzZXJNZmFGYWlsZWRFdmVudCkgPT4gdm9pZDtcbiAgXCJzZXNzaW9uLWV4cGlyZWRcIjogKGV2OiBTZXNzaW9uRXhwaXJlZEV2ZW50KSA9PiB2b2lkO1xuICBlcnJvcjogKGV2OiBFcnJvckV2ZW50KSA9PiB2b2lkO1xufTtcblxudHlwZSBTdGF0aWNDbGllbnRTdWJjbGFzczxUPiA9IHtcbiAgbmV3ICguLi5hcmdzOiBDb25zdHJ1Y3RvclBhcmFtZXRlcnM8dHlwZW9mIEJhc2VDbGllbnQ+KTogVDtcbn0gJiB0eXBlb2YgQmFzZUNsaWVudDtcblxuLyoqXG4gKiBBbiBldmVudCBlbWl0dGVyIGZvciBhbGwgY2xpZW50c1xuICpcbiAqIEBkZXByZWNhdGVkXG4gKi9cbmV4cG9ydCBjb25zdCBBTExfRVZFTlRTOiBFdmVudEVtaXR0ZXI8Q2xpZW50RXZlbnRzPiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuLyoqXG4gKiBDbGllbnQgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENsaWVudENvbmZpZyB7XG4gIC8qKiBVcGRhdGUgcmV0cnkgZGVsYXlzIChpbiBtaWxsaXNlY29uZHMpICovXG4gIHVwZGF0ZVJldHJ5RGVsYXlzTXM6IG51bWJlcltdO1xuXG4gIC8qKiBDdXN0b20gb3JpZ2luIHRvIHNldCAoTk9URSB0aGF0IGlmIHJ1bm5pbmcgaW4gYSBicm93c2VyLCB0aGUgYnJvd3NlciB3aWxsIG92ZXJ3cml0ZSB0aGlzKSAqL1xuICBvcmlnaW4/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIHJldHJ5IHN0cmF0ZWd5IGFuZCBzZXNzaW9uIHJlZnJlc2hlc1xuICovXG5leHBvcnQgY2xhc3MgQmFzZUNsaWVudCBleHRlbmRzIEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+IHtcbiAgLyoqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzZXNzaW9uIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNsaWVudCAqL1xuICBzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhO1xuXG4gIC8qKiBTZXNzaW9uIHBlcnNpc3RlbmNlICovXG4gIHByb3RlY3RlZCBzZXNzaW9uTWFuYWdlcjogU2Vzc2lvbk1hbmFnZXI7XG5cbiAgLyoqXG4gICAqIFRhcmdldCBvcmcgaWQsIGkuZS4sIHRoZSBvcmdhbml6YXRpb24gdGhpcyBjbGllbnQgc2hvdWxkIG9wZXJhdGUgb24uXG4gICAqXG4gICAqIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZSBhIHRhcmdldCBvcmdhbml6YXRpb25cbiAgICogZGlmZmVyZW50IGZyb20gdGhlIHNlc3Npb24gb3JnYW5pemF0aW9uIGlzIGlmIHRoZSB0YXJnZXQgb3JnYW5pemF0aW9uIGlzXG4gICAqIGEgY2hpbGQgb2YgdGhlIHNlc3Npb24gb3JnYW5pemF0aW9uLlxuICAgKi9cbiAgI3RhcmdldE9yZ0lkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgLyoqIE1VVEFCTEUgY29uZmlndXJhdGlvbi4gKi9cbiAgY29uZmlnOiBDbGllbnRDb25maWcgPSB7XG4gICAgdXBkYXRlUmV0cnlEZWxheXNNczogWzEwMCwgMjAwLCA0MDBdLFxuICAgIG9yaWdpbjogdW5kZWZpbmVkLFxuICB9O1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgZW52ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWV0YS5lbnZbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIGNsaWVudCB3aXRoIGEgc2Vzc2lvbiBvciBzZXNzaW9uIG1hbmFnZXJcbiAgICpcbiAgICogQHBhcmFtIHRoaXMgQWxsb3dzIHRoaXMgc3RhdGljIG1ldGhvZCB0byByZXR1cm4gc3VidHlwZXMgd2hlbiBpbnZva2VkIHRocm91Z2ggdGhlbVxuICAgKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiAob2JqZWN0IG9yIGJhc2U2NCBzdHJpbmcpIG9yIG1hbmFnZXIgdGhhdCB3aWxsIGJhY2sgdGhpcyBjbGllbnRcbiAgICogQHBhcmFtIHRhcmdldE9yZ0lkIFRoZSBJRCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoaXMgY2xpZW50IHNob3VsZCBvcGVyYXRlIG9uLiBEZWZhdWx0cyB0b1xuICAgKiAgIHRoZSBvcmcgaWQgZnJvbSB0aGUgc3VwcGxpZWQgc2Vzc2lvbi4gVGhlIG9ubHkgc2NlbmFyaW8gaW4gd2hpY2ggaXQgbWFrZXMgc2Vuc2UgdG8gdXNlXG4gICAqICAgYSB7QGxpbmsgdGFyZ2V0T3JnSWR9IGRpZmZlcmVudCBmcm9tIHRoZSBzZXNzaW9uIG9yZyBpZCBpcyBpZiB7QGxpbmsgdGFyZ2V0T3JnSWR9IGlzIGFcbiAgICogICBjaGlsZCBvcmdhbml6YXRpb24gb2YgdGhlIHNlc3Npb24gb3JnYW5pemF0aW9uLlxuICAgKiBAcmV0dXJucyBBIENsaWVudFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxUPihcbiAgICB0aGlzOiBTdGF0aWNDbGllbnRTdWJjbGFzczxUPixcbiAgICBzZXNzaW9uOiBzdHJpbmcgfCBTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhLFxuICAgIHRhcmdldE9yZ0lkPzogc3RyaW5nLFxuICApOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBzZXNzaW9uT2JqOiBTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhID1cbiAgICAgIHR5cGVvZiBzZXNzaW9uID09PSBcInN0cmluZ1wiID8gcGFyc2VCYXNlNjRTZXNzaW9uRGF0YShzZXNzaW9uKSA6IHNlc3Npb247XG5cbiAgICBpZiAodHlwZW9mIHNlc3Npb25PYmoudG9rZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY29uc3QgbWFuYWdlciA9IHNlc3Npb25PYmogYXMgU2Vzc2lvbk1hbmFnZXI7XG4gICAgICByZXR1cm4gbmV3IHRoaXMoYXdhaXQgbWFuYWdlci5tZXRhZGF0YSgpLCBtYW5hZ2VyLCB0YXJnZXRPcmdJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlc3Npb24gPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25EYXRhO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKG1ldGFkYXRhKHNlc3Npb24pLCBuZXcgTWVtb3J5U2Vzc2lvbk1hbmFnZXIoc2Vzc2lvbiksIHRhcmdldE9yZ0lkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHNlc3Npb25NZXRhIFRoZSBpbml0aWFsIHNlc3Npb24gbWV0YWRhdGFcbiAgICogQHBhcmFtIG1hbmFnZXIgVGhlIG1hbmFnZXIgZm9yIHRoZSBjdXJyZW50IHNlc3Npb25cbiAgICogQHBhcmFtIHRhcmdldE9yZ0lkIFRoZSBJRCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoaXMgY2xpZW50IHNob3VsZCBvcGVyYXRlIG9uLiBEZWZhdWx0cyB0b1xuICAgKiAgIHRoZSBvcmcgaWQgZnJvbSB0aGUgc3VwcGxpZWQgc2Vzc2lvbi4gVGhlIG9ubHkgc2NlbmFyaW8gaW4gd2hpY2ggaXQgbWFrZXMgc2Vuc2UgdG8gdXNlXG4gICAqICAgYSB7QGxpbmsgdGFyZ2V0T3JnSWR9IGRpZmZlcmVudCBmcm9tIHRoZSBzZXNzaW9uIG9yZyBpZCBpcyBpZiB7QGxpbmsgdGFyZ2V0T3JnSWR9IGlzIGFcbiAgICogICBjaGlsZCBvcmdhbml6YXRpb24gb2YgdGhlIHNlc3Npb24gb3JnYW5pemF0aW9uLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGEsIG1hbmFnZXI6IFNlc3Npb25NYW5hZ2VyLCB0YXJnZXRPcmdJZD86IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jdGFyZ2V0T3JnSWQgPSB0YXJnZXRPcmdJZDtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNlc3Npb25NZXRhID0gc2Vzc2lvbk1ldGE7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIG9yZ2FuaXphdGlvbiBJRC4gSWYgdGhlIG9yZyBJRCB3YXMgc2V0IGV4cGxpY2l0bHksIGl0IHJldHVybnMgdGhhdCBJRDsgb3RoZXJ3aXNlIGl0IHJldHVybnMgdGhlIHNlc3Npb24ncyBvcmdhbml6YXRpb24gSUQuICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdGFyZ2V0T3JnSWQgPz8gdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgdGhlIHNlc3Npb24ncyBpbXBsaWNpdCBhcmd1bWVudHMgb24gdG9wIG9mIHdoYXQgd2FzIHByb3ZpZGVkXG4gICAqXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgYXV0aG9yaXphdGlvbiB0b2tlbiB0byB1c2UgZm9yIHRoZSByZXF1ZXN0XG4gICAqIEBwYXJhbSBvcHRzIFRoZSB1c2VyLXN1cHBsaWVkIG9wdHNcbiAgICogQHJldHVybnMgVGhlIHVuaW9uIG9mIHRoZSB1c2VyLXN1cHBsaWVkIG9wdHMgYW5kIHRoZSBkZWZhdWx0IG9uZXNcbiAgICovXG4gICNhcHBseU9wdGlvbnM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogU2ltcGxlT3B0aW9uczxUPiB7XG4gICAgY29uc3QgcGF0aFBhcmFtcyA9IFwicGF0aFwiIGluIChvcHRzLnBhcmFtcyA/PyB7fSkgPyBvcHRzLnBhcmFtcz8ucGF0aCA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBiYXNlVXJsID0gdGhpcy5lbnYuU2lnbmVyQXBpUm9vdC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gICAgY29uc3QgYnJvd3NlclVzZXJBZ2VudCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyBuYXZpZ2F0b3I/LnVzZXJBZ2VudCA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4ge1xuICAgICAgY2FjaGU6IFwibm8tc3RvcmVcIixcbiAgICAgIC8vIElmIHdlIGhhdmUgYW4gYWN0aXZlU2Vzc2lvbiwgbGV0IGl0IGRpY3RhdGUgdGhlIGJhc2VVcmwuIE90aGVyd2lzZSBmYWxsIGJhY2sgdG8gdGhlIG9uZSBzZXQgYXQgY29uc3RydWN0aW9uXG4gICAgICBiYXNlVXJsLFxuICAgICAgLi4ub3B0cyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6IGJyb3dzZXJVc2VyQWdlbnQgPz8gYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICAgIFwiWC1DdWJpc3QtVHMtU2RrXCI6IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgICBPcmlnaW46IHRoaXMuY29uZmlnLm9yaWdpbixcbiAgICAgICAgQXV0aG9yaXphdGlvbjogdG9rZW4sXG4gICAgICAgIC4uLm9wdHMuaGVhZGVycyxcbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgLi4ub3B0cy5wYXJhbXMsXG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHRoaXMub3JnSWQsXG4gICAgICAgICAgLi4ucGF0aFBhcmFtcyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSBhcyB1bmtub3duIGFzIFNpbXBsZU9wdGlvbnM8VD47XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgc3BlY2lmaWMgZXJyb3IgZXZlbnRzIHdoZW4gYSByZXF1ZXN0IGZhaWxlZFxuICAgKlxuICAgKiBAcGFyYW0gZXJyIFRoZSBlcnJvciB0byBjbGFzc2lmeVxuICAgKi9cbiAgYXN5bmMgI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGVycjogRXJyb3JFdmVudCkge1xuICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGVycik7XG4gICAgQUxMX0VWRU5UUy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblxuICAgIGlmIChlcnIuaXNVc2VyTWZhRXJyb3IoKSkge1xuICAgICAgY29uc3QgZXYgPSBcInVzZXItbWZhLWZhaWxlZFwiO1xuICAgICAgdGhpcy5lbWl0KGV2LCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KGV2LCBlcnIpO1xuICAgIH1cblxuICAgIC8vIGlmIHN0YXR1cyBpcyA0MDMgYW5kIGVycm9yIG1hdGNoZXMgb25lIG9mIHRoZSBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIGNvZGVzIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZFxuICAgIC8vXG4gICAgLy8gVE9ETzogYmVjYXVzZSBlcnJvcnMgcmV0dXJuZWQgYnkgdGhlIGF1dGhvcml6ZXIgbGFtYmRhIGFyZSBub3QgZm9yd2FyZGVkIHRvIHRoZSBjbGllbnRcbiAgICAvLyAgICAgICB3ZSBhbHNvIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZCB3aGVuIFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiBmYWlsc1xuICAgIGlmIChcbiAgICAgIGVyci5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKGVyci5pc1Nlc3Npb25FeHBpcmVkRXJyb3IoKSB8fCBlcnIub3BlcmF0aW9uID09IFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIilcbiAgICApIHtcbiAgICAgIGNvbnN0IGV2ID0gXCJzZXNzaW9uLWV4cGlyZWRcIjtcbiAgICAgIHRoaXMuZW1pdChldiwgZXJyKTtcbiAgICAgIEFMTF9FVkVOVFMuZW1pdChldiwgZXJyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgYW4gb3AgdXNpbmcgdGhlIHN0YXRlIG9mIHRoZSBjbGllbnQgKGF1dGggaGVhZGVycyAmIG9yZ19pZCkgd2l0aCByZXRyaWVzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gb3AgVGhlIEFQSSBvcGVyYXRpb24geW91IHdpc2ggdG8gcGVyZm9ybVxuICAgKiBAcGFyYW0gb3B0cyBUaGUgcGFyYW1ldGVycyBmb3IgdGhlIG9wZXJhdGlvblxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIHRoZSBzdWNjZXNzZnVsIHJlc3VsdCAoZXJyb3JzIHdpbGwgYmUgdGhyb3duKVxuICAgKi9cbiAgYXN5bmMgZXhlYzxUIGV4dGVuZHMgT3BlcmF0aW9uPihcbiAgICBvcDogT3A8VD4sXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFByb21pc2U8RmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhPFQ+PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0b2tlbiA9IGF3YWl0IHRoaXMuc2Vzc2lvbk1hbmFnZXIudG9rZW4oKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXRyeSgoKSA9PiBvcCh0aGlzLiNhcHBseU9wdGlvbnModG9rZW4sIG9wdHMpKSwge1xuICAgICAgICBwcmVkOiBhc3luYyAocmVzcCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3AucmVzcG9uc2Uuc3RhdHVzO1xuICAgICAgICAgIGNvbnN0IGVycm9yID0gcmVzcC5lcnJvciBhcyBFcnJvclJlc3BvbnNlIHwgdW5kZWZpbmVkO1xuICAgICAgICAgIGNvbnN0IHJlcXVlc3RJZCA9IGVycm9yPy5yZXF1ZXN0X2lkO1xuXG4gICAgICAgICAgLy8gSWYgd2UgZ2V0IGEgXCJGb3JiaWRkZW5cIiBlcnJvciwgZXJhc2UgdGhlIGNhY2hlZCB0b2tlblxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gVE9ETzogQ2hlY2sgZXJyb3IgY29kZXMgb25jZSBvdXIgQVBJIHJldHVybnMgZXJyb3IgY29kZXMgZm9yXG4gICAgICAgICAgLy8gYXV0aG9yaXphdGlvbiBmYWlsdXJlc1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAgICAgICByZXF1ZXN0SWQgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgdGhpcy5zZXNzaW9uTWFuYWdlci5vbkludmFsaWRUb2tlbiAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnNlc3Npb25NYW5hZ2VyLm9uSW52YWxpZFRva2VuKCk7XG4gICAgICAgICAgICBjb25zdCBvbGRUb2tlbiA9IHRva2VuO1xuICAgICAgICAgICAgdG9rZW4gPSBhd2FpdCB0aGlzLnNlc3Npb25NYW5hZ2VyLnRva2VuKCk7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW4gIT09IG9sZFRva2VuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFsc28gcmV0cnkgc2VydmVyLXNpZGUgZXJyb3JzXG4gICAgICAgICAgcmV0dXJuIHN0YXR1cyA+PSA1MDAgJiYgc3RhdHVzIDwgNjAwO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICAvLyBPbmNlIHdlIGhhdmUgYSBub24tNVhYIHJlc3BvbnNlLCB3ZSB3aWxsIGFzc2VydE9rIChlaXRoZXIgdGhyb3dpbmcgb3IgeWllbGRpbmcgdGhlIHJlcG9uc2UpXG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJSZXNwb25zZSkge1xuICAgICAgICBhd2FpdCB0aGlzLiNjbGFzc2lmeUFuZEVtaXRFcnJvcihlKTsgLy8gRW1pdCBhcHByb3ByaWF0ZSBldmVudHNcbiAgICAgIH1cbiAgICAgIHRocm93IGU7IC8vIFJldGhyb3cgdGhlIGVycm9yXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBncmFkZSBhIHNlc3Npb24gcmVzcG9uc2UgaW50byBhIGZ1bGwgU2Vzc2lvbkRhdGEgYnkgaW5jb3Jwb3JhdGluZ1xuICogZWxlbWVudHMgb2YgYW4gZXhpc3RpbmcgU2Vzc2lvbkRhdGFcbiAqXG4gKiBAcGFyYW0gbWV0YSBBbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICogQHBhcmFtIGluZm8gQSBuZXcgc2Vzc2lvbiBjcmVhdGVkIHZpYSB0aGUgQVBJXG4gKiBAcGFyYW0gY3R4IEFkZGl0aW9uYWwgbWFudWFsIG92ZXJyaWRlc1xuICogQHJldHVybnMgU2Vzc2lvbkRhdGEgd2l0aCBuZXcgaW5mb3JtYXRpb24gZnJvbSBpbmZvIGFuZCBjdHhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8oXG4gIG1ldGE6IFNlc3Npb25NZXRhZGF0YSxcbiAgaW5mbzogTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBjdHg6IFBhcnRpYWw8eyBwdXJwb3NlOiBzdHJpbmc7IHJvbGVfaWQ6IHN0cmluZzsgb3JnX2lkOiBzdHJpbmcgfT4sXG4pOiBTZXNzaW9uRGF0YSB7XG4gIHJldHVybiB7XG4gICAgZW52OiBtZXRhLmVudixcbiAgICBvcmdfaWQ6IG1ldGEub3JnX2lkLFxuICAgIHNlc3Npb25fZXhwOiBpbmZvLmV4cGlyYXRpb24sXG4gICAgc2Vzc2lvbl9pbmZvOiBpbmZvLnNlc3Npb25faW5mbyxcbiAgICB0b2tlbjogaW5mby50b2tlbixcbiAgICByZWZyZXNoX3Rva2VuOiBpbmZvLnJlZnJlc2hfdG9rZW4sXG4gICAgcHVycG9zZTogbWV0YS5wdXJwb3NlLFxuICAgIHJvbGVfaWQ6IG1ldGEucm9sZV9pZCxcbiAgICAuLi5jdHgsXG4gIH07XG59XG5cbnR5cGUgRGVlcE9taXQ8QSwgQj4gPSBbQSwgQl0gZXh0ZW5kcyBbb2JqZWN0LCBvYmplY3RdXG4gID8ge1xuICAgICAgW0sgaW4ga2V5b2YgQSBhcyBLIGV4dGVuZHMga2V5b2YgQiAvLyBJZiB0aGUga2V5IGlzIGluIGJvdGggQSBhbmQgQlxuICAgICAgICA/IEFbS10gZXh0ZW5kcyBCW0tdXG4gICAgICAgICAgPyBLIC8vXG4gICAgICAgICAgOiBuZXZlclxuICAgICAgICA6IG5ldmVyXT86IEsgZXh0ZW5kcyBrZXlvZiBCID8gRGVlcE9taXQ8QVtLXSwgQltLXT4gOiBuZXZlcjtcbiAgICB9ICYge1xuICAgICAgW0sgaW4ga2V5b2YgQSBhcyBLIGV4dGVuZHMga2V5b2YgQiA/IChCW0tdIGV4dGVuZHMgQVtLXSA/IG5ldmVyIDogSykgOiBLXTogSyBleHRlbmRzIGtleW9mIEJcbiAgICAgICAgPyBEZWVwT21pdDxBW0tdLCBCW0tdPlxuICAgICAgICA6IEFbS107XG4gICAgfVxuICA6IEE7XG5cbmV4cG9ydCB0eXBlIE9taXRBdXRvUGFyYW1zPE8+ID0gRGVlcE9taXQ8XG4gIE8sXG4gIHtcbiAgICBiYXNlVXJsOiBzdHJpbmc7XG4gICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBzdHJpbmcgfSB9O1xuICB9XG4+ICYgeyBwYXJhbXM/OiB7IHBhdGg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB9IH07XG4iXX0=