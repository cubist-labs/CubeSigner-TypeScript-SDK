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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlRQSxvRUFnQkM7QUFqUkQsc0VBQXFDO0FBRXJDLG9DQUFvQztBQUNwQyxvQ0FBaUM7QUFDakMsc0NBQXlDO0FBQ3pDLG9DQUF1QztBQUV2Qyx1Q0FBbUY7QUFJbkYsa0NBQWtDO0FBQ3JCLFFBQUEsSUFBSSxHQUFXLHNCQUFHLENBQUMsSUFBSSxDQUFDO0FBRXJDLDZCQUE2QjtBQUNoQixRQUFBLE9BQU8sR0FBVyxzQkFBRyxDQUFDLE9BQU8sQ0FBQztBQUkzQywrRUFBK0U7QUFDL0UsTUFBYSxtQkFBbUI7Q0FBRztBQUFuQyxrREFBbUM7QUFFbkMsd0ZBQXdGO0FBQ3hGLE1BQWEsa0JBQW1CLFNBQVEsbUJBQVc7Q0FBRztBQUF0RCxnREFBc0Q7QUFZdEQ7Ozs7R0FJRztBQUNVLFFBQUEsVUFBVSxHQUErQixJQUFJLHFCQUFZLEVBQUUsQ0FBQztBQWF6RTs7R0FFRztBQUNILE1BQWEsVUFBVyxTQUFRLHFCQUEwQjtJQXNCeEQsdUJBQXVCO0lBQ3ZCLElBQUksR0FBRztRQUNMLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUVqQixPQUE4QyxFQUM5QyxXQUFvQjtRQUVwQixNQUFNLFVBQVUsR0FDZCxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsZ0NBQXNCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUUxRSxJQUFJLE9BQU8sVUFBVSxDQUFDLEtBQUssS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUMzQyxNQUFNLE9BQU8sR0FBRyxV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QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBrZyBmcm9tIFwiLi4vLi4vcGFja2FnZS5qc29uXCI7XG5pbXBvcnQgdHlwZSB7IEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YSwgT3AsIE9wZXJhdGlvbiwgU2ltcGxlT3B0aW9ucyB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IHJldHJ5IH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBFcnJSZXNwb25zZSB9IGZyb20gXCIuLi9lcnJvclwiO1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSwgU2Vzc2lvbk1hbmFnZXIsIFNlc3Npb25NZXRhZGF0YSB9IGZyb20gXCIuL3Nlc3Npb25cIjtcbmltcG9ydCB7IE1lbW9yeVNlc3Npb25NYW5hZ2VyLCBtZXRhZGF0YSwgcGFyc2VCYXNlNjRTZXNzaW9uRGF0YSB9IGZyb20gXCIuL3Nlc3Npb25cIjtcbmltcG9ydCB0eXBlIHsgTmV3U2Vzc2lvblJlc3BvbnNlLCBFcnJvclJlc3BvbnNlIH0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyBwYWNrYWdlIG5hbWUgKi9cbmV4cG9ydCBjb25zdCBOQU1FOiBzdHJpbmcgPSBwa2cubmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSBwa2cudmVyc2lvbjtcblxuZXhwb3J0IHR5cGUgRXJyb3JFdmVudCA9IEVyclJlc3BvbnNlO1xuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQvaW52YWxpZCBzZXNzaW9uICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFdmVudCB7fVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIHVzZXIgZmFpbGVkIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlICovXG5leHBvcnQgY2xhc3MgVXNlck1mYUZhaWxlZEV2ZW50IGV4dGVuZHMgRXJyUmVzcG9uc2Uge31cblxudHlwZSBDbGllbnRFdmVudHMgPSB7XG4gIFwidXNlci1tZmEtZmFpbGVkXCI6IChldjogVXNlck1mYUZhaWxlZEV2ZW50KSA9PiB2b2lkO1xuICBcInNlc3Npb24tZXhwaXJlZFwiOiAoZXY6IFNlc3Npb25FeHBpcmVkRXZlbnQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXY6IEVycm9yRXZlbnQpID0+IHZvaWQ7XG59O1xuXG50eXBlIFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+ID0ge1xuICBuZXcgKC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQmFzZUNsaWVudD4pOiBUO1xufSAmIHR5cGVvZiBCYXNlQ2xpZW50O1xuXG4vKipcbiAqIEFuIGV2ZW50IGVtaXR0ZXIgZm9yIGFsbCBjbGllbnRzXG4gKlxuICogQGRlcHJlY2F0ZWRcbiAqL1xuZXhwb3J0IGNvbnN0IEFMTF9FVkVOVFM6IEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4vKipcbiAqIENsaWVudCBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2xpZW50Q29uZmlnIHtcbiAgLyoqIFVwZGF0ZSByZXRyeSBkZWxheXMgKGluIG1pbGxpc2Vjb25kcykgKi9cbiAgdXBkYXRlUmV0cnlEZWxheXNNczogbnVtYmVyW107XG5cbiAgLyoqIEN1c3RvbSBvcmlnaW4gdG8gc2V0IChOT1RFIHRoYXQgaWYgcnVubmluZyBpbiBhIGJyb3dzZXIsIHRoZSBicm93c2VyIHdpbGwgb3ZlcndyaXRlIHRoaXMpICovXG4gIG9yaWdpbj86IHN0cmluZztcbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgcmV0cnkgc3RyYXRlZ3kgYW5kIHNlc3Npb24gcmVmcmVzaGVzXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlQ2xpZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyPENsaWVudEV2ZW50cz4ge1xuICAvKiogSW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlc3Npb24gY29udGFpbmVkIHdpdGhpbiB0aGUgY2xpZW50ICovXG4gIHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGE7XG5cbiAgLyoqIFNlc3Npb24gcGVyc2lzdGVuY2UgKi9cbiAgcHJvdGVjdGVkIHNlc3Npb25NYW5hZ2VyOiBTZXNzaW9uTWFuYWdlcjtcblxuICAvKipcbiAgICogVGFyZ2V0IG9yZyBpZCwgaS5lLiwgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi5cbiAgICpcbiAgICogVGhlIG9ubHkgc2NlbmFyaW8gaW4gd2hpY2ggaXQgbWFrZXMgc2Vuc2UgdG8gdXNlIGEgdGFyZ2V0IG9yZ2FuaXphdGlvblxuICAgKiBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmdhbml6YXRpb24gaXMgaWYgdGhlIHRhcmdldCBvcmdhbml6YXRpb24gaXNcbiAgICogYSBjaGlsZCBvZiB0aGUgc2Vzc2lvbiBvcmdhbml6YXRpb24uXG4gICAqL1xuICAjdGFyZ2V0T3JnSWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAvKiogTVVUQUJMRSBjb25maWd1cmF0aW9uLiAqL1xuICBjb25maWc6IENsaWVudENvbmZpZyA9IHtcbiAgICB1cGRhdGVSZXRyeURlbGF5c01zOiBbMTAwLCAyMDAsIDQwMF0sXG4gICAgb3JpZ2luOiB1bmRlZmluZWQsXG4gIH07XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBlbnYgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25NZXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl07XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgY2xpZW50IHdpdGggYSBzZXNzaW9uIG9yIHNlc3Npb24gbWFuYWdlclxuICAgKlxuICAgKiBAcGFyYW0gdGhpcyBBbGxvd3MgdGhpcyBzdGF0aWMgbWV0aG9kIHRvIHJldHVybiBzdWJ0eXBlcyB3aGVuIGludm9rZWQgdGhyb3VnaCB0aGVtXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIChvYmplY3Qgb3IgYmFzZTY0IHN0cmluZykgb3IgbWFuYWdlciB0aGF0IHdpbGwgYmFjayB0aGlzIGNsaWVudFxuICAgKiBAcGFyYW0gdGFyZ2V0T3JnSWQgVGhlIElEIG9mIHRoZSBvcmdhbml6YXRpb24gdGhpcyBjbGllbnQgc2hvdWxkIG9wZXJhdGUgb24uIERlZmF1bHRzIHRvXG4gICAqICAgdGhlIG9yZyBpZCBmcm9tIHRoZSBzdXBwbGllZCBzZXNzaW9uLiBUaGUgb25seSBzY2VuYXJpbyBpbiB3aGljaCBpdCBtYWtlcyBzZW5zZSB0byB1c2VcbiAgICogICBhIHtAbGluayB0YXJnZXRPcmdJZH0gZGlmZmVyZW50IGZyb20gdGhlIHNlc3Npb24gb3JnIGlkIGlzIGlmIHtAbGluayB0YXJnZXRPcmdJZH0gaXMgYVxuICAgKiAgIGNoaWxkIG9yZ2FuaXphdGlvbiBvZiB0aGUgc2Vzc2lvbiBvcmdhbml6YXRpb24uXG4gICAqIEByZXR1cm5zIEEgQ2xpZW50XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlPFQ+KFxuICAgIHRoaXM6IFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+LFxuICAgIHNlc3Npb246IHN0cmluZyB8IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEsXG4gICAgdGFyZ2V0T3JnSWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IHNlc3Npb25PYmo6IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEgPVxuICAgICAgdHlwZW9mIHNlc3Npb24gPT09IFwic3RyaW5nXCIgPyBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb24pIDogc2Vzc2lvbjtcblxuICAgIGlmICh0eXBlb2Ygc2Vzc2lvbk9iai50b2tlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zdCBtYW5hZ2VyID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uTWFuYWdlcjtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhhd2FpdCBtYW5hZ2VyLm1ldGFkYXRhKCksIG1hbmFnZXIsIHRhcmdldE9yZ0lkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2Vzc2lvbiA9IHNlc3Npb25PYmogYXMgU2Vzc2lvbkRhdGE7XG4gICAgICByZXR1cm4gbmV3IHRoaXMobWV0YWRhdGEoc2Vzc2lvbiksIG5ldyBNZW1vcnlTZXNzaW9uTWFuYWdlcihzZXNzaW9uKSwgdGFyZ2V0T3JnSWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gc2Vzc2lvbk1ldGEgVGhlIGluaXRpYWwgc2Vzc2lvbiBtZXRhZGF0YVxuICAgKiBAcGFyYW0gbWFuYWdlciBUaGUgbWFuYWdlciBmb3IgdGhlIGN1cnJlbnQgc2Vzc2lvblxuICAgKiBAcGFyYW0gdGFyZ2V0T3JnSWQgVGhlIElEIG9mIHRoZSBvcmdhbml6YXRpb24gdGhpcyBjbGllbnQgc2hvdWxkIG9wZXJhdGUgb24uIERlZmF1bHRzIHRvXG4gICAqICAgdGhlIG9yZyBpZCBmcm9tIHRoZSBzdXBwbGllZCBzZXNzaW9uLiBUaGUgb25seSBzY2VuYXJpbyBpbiB3aGljaCBpdCBtYWtlcyBzZW5zZSB0byB1c2VcbiAgICogICBhIHtAbGluayB0YXJnZXRPcmdJZH0gZGlmZmVyZW50IGZyb20gdGhlIHNlc3Npb24gb3JnIGlkIGlzIGlmIHtAbGluayB0YXJnZXRPcmdJZH0gaXMgYVxuICAgKiAgIGNoaWxkIG9yZ2FuaXphdGlvbiBvZiB0aGUgc2Vzc2lvbiBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YSwgbWFuYWdlcjogU2Vzc2lvbk1hbmFnZXIsIHRhcmdldE9yZ0lkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiN0YXJnZXRPcmdJZCA9IHRhcmdldE9yZ0lkO1xuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuc2Vzc2lvbk1ldGEgPSBzZXNzaW9uTWV0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgb3JnYW5pemF0aW9uIElELiBJZiB0aGUgb3JnIElEIHdhcyBzZXQgZXhwbGljaXRseSwgaXQgcmV0dXJucyB0aGF0IElEOyBvdGhlcndpc2UgaXQgcmV0dXJucyB0aGUgc2Vzc2lvbidzIG9yZ2FuaXphdGlvbiBJRC4gKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLiN0YXJnZXRPcmdJZCA/PyB0aGlzLnNlc3Npb25NZXRhLm9yZ19pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSB0aGUgc2Vzc2lvbidzIGltcGxpY2l0IGFyZ3VtZW50cyBvbiB0b3Agb2Ygd2hhdCB3YXMgcHJvdmlkZWRcbiAgICpcbiAgICogQHBhcmFtIHRva2VuIFRoZSBhdXRob3JpemF0aW9uIHRva2VuIHRvIHVzZSBmb3IgdGhlIHJlcXVlc3RcbiAgICogQHBhcmFtIG9wdHMgVGhlIHVzZXItc3VwcGxpZWQgb3B0c1xuICAgKiBAcmV0dXJucyBUaGUgdW5pb24gb2YgdGhlIHVzZXItc3VwcGxpZWQgb3B0cyBhbmQgdGhlIGRlZmF1bHQgb25lc1xuICAgKi9cbiAgI2FwcGx5T3B0aW9uczxUIGV4dGVuZHMgT3BlcmF0aW9uPihcbiAgICB0b2tlbjogc3RyaW5nLFxuICAgIG9wdHM6IE9taXRBdXRvUGFyYW1zPFNpbXBsZU9wdGlvbnM8VD4+LFxuICApOiBTaW1wbGVPcHRpb25zPFQ+IHtcbiAgICBjb25zdCBwYXRoUGFyYW1zID0gXCJwYXRoXCIgaW4gKG9wdHMucGFyYW1zID8/IHt9KSA/IG9wdHMucGFyYW1zPy5wYXRoIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGJhc2VVcmwgPSB0aGlzLmVudi5TaWduZXJBcGlSb290LnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgICBjb25zdCBicm93c2VyVXNlckFnZW50ID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IG5hdmlnYXRvcj8udXNlckFnZW50IDogdW5kZWZpbmVkO1xuICAgIHJldHVybiB7XG4gICAgICBjYWNoZTogXCJuby1zdG9yZVwiLFxuICAgICAgLy8gSWYgd2UgaGF2ZSBhbiBhY3RpdmVTZXNzaW9uLCBsZXQgaXQgZGljdGF0ZSB0aGUgYmFzZVVybC4gT3RoZXJ3aXNlIGZhbGwgYmFjayB0byB0aGUgb25lIHNldCBhdCBjb25zdHJ1Y3Rpb25cbiAgICAgIGJhc2VVcmwsXG4gICAgICAuLi5vcHRzLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIlVzZXItQWdlbnRcIjogYnJvd3NlclVzZXJBZ2VudCA/PyBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgXCJYLUN1YmlzdC1Ucy1TZGtcIjogYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICAgIE9yaWdpbjogdGhpcy5jb25maWcub3JpZ2luLFxuICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgLi4ub3B0cy5oZWFkZXJzLFxuICAgICAgfSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICAuLi5vcHRzLnBhcmFtcyxcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIG9yZ19pZDogdGhpcy5vcmdJZCxcbiAgICAgICAgICAuLi5wYXRoUGFyYW1zLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9IGFzIHVua25vd24gYXMgU2ltcGxlT3B0aW9uczxUPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBzcGVjaWZpYyBlcnJvciBldmVudHMgd2hlbiBhIHJlcXVlc3QgZmFpbGVkXG4gICAqXG4gICAqIEBwYXJhbSBlcnIgVGhlIGVycm9yIHRvIGNsYXNzaWZ5XG4gICAqL1xuICBhc3luYyAjY2xhc3NpZnlBbmRFbWl0RXJyb3IoZXJyOiBFcnJvckV2ZW50KSB7XG4gICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcbiAgICBBTExfRVZFTlRTLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXG4gICAgaWYgKGVyci5pc1VzZXJNZmFFcnJvcigpKSB7XG4gICAgICBjb25zdCBldiA9IFwidXNlci1tZmEtZmFpbGVkXCI7XG4gICAgICB0aGlzLmVtaXQoZXYsIGVycik7XG4gICAgICBBTExfRVZFTlRTLmVtaXQoZXYsIGVycik7XG4gICAgfVxuXG4gICAgLy8gaWYgc3RhdHVzIGlzIDQwMyBhbmQgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlIFwiaW52YWxpZCBzZXNzaW9uXCIgZXJyb3IgY29kZXMgdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkXG4gICAgLy9cbiAgICAvLyBUT0RPOiBiZWNhdXNlIGVycm9ycyByZXR1cm5lZCBieSB0aGUgYXV0aG9yaXplciBsYW1iZGEgYXJlIG5vdCBmb3J3YXJkZWQgdG8gdGhlIGNsaWVudFxuICAgIC8vICAgICAgIHdlIGFsc28gdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkIHdoZW4gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiIGZhaWxzXG4gICAgaWYgKFxuICAgICAgZXJyLnN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAoZXJyLmlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpIHx8IGVyci5vcGVyYXRpb24gPT0gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiKVxuICAgICkge1xuICAgICAgY29uc3QgZXYgPSBcInNlc3Npb24tZXhwaXJlZFwiO1xuICAgICAgdGhpcy5lbWl0KGV2LCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KGV2LCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBhbiBvcCB1c2luZyB0aGUgc3RhdGUgb2YgdGhlIGNsaWVudCAoYXV0aCBoZWFkZXJzICYgb3JnX2lkKSB3aXRoIHJldHJpZXNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBvcCBUaGUgQVBJIG9wZXJhdGlvbiB5b3Ugd2lzaCB0byBwZXJmb3JtXG4gICAqIEBwYXJhbSBvcHRzIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgb3BlcmF0aW9uXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgdGhlIHN1Y2Nlc3NmdWwgcmVzdWx0IChlcnJvcnMgd2lsbCBiZSB0aHJvd24pXG4gICAqL1xuICBhc3luYyBleGVjPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIG9wOiBPcDxUPixcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogUHJvbWlzZTxGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD4+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHRva2VuID0gYXdhaXQgdGhpcy5zZXNzaW9uTWFuYWdlci50b2tlbigpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHJldHJ5KCgpID0+IG9wKHRoaXMuI2FwcGx5T3B0aW9ucyh0b2tlbiwgb3B0cykpLCB7XG4gICAgICAgIHByZWQ6IGFzeW5jIChyZXNwKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gcmVzcC5yZXNwb25zZS5zdGF0dXM7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSByZXNwLmVycm9yIGFzIEVycm9yUmVzcG9uc2UgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgY29uc3QgcmVxdWVzdElkID0gZXJyb3I/LnJlcXVlc3RfaWQ7XG5cbiAgICAgICAgICAvLyBJZiB3ZSBnZXQgYSBcIkZvcmJpZGRlblwiIGVycm9yLCBlcmFzZSB0aGUgY2FjaGVkIHRva2VuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBUT0RPOiBDaGVjayBlcnJvciBjb2RlcyBvbmNlIG91ciBBUEkgcmV0dXJucyBlcnJvciBjb2RlcyBmb3JcbiAgICAgICAgICAvLyBhdXRob3JpemF0aW9uIGZhaWx1cmVzXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgc3RhdHVzID09PSA0MDMgJiZcbiAgICAgICAgICAgIHJlcXVlc3RJZCA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICB0aGlzLnNlc3Npb25NYW5hZ2VyLm9uSW52YWxpZFRva2VuICE9PSB1bmRlZmluZWRcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIub25JbnZhbGlkVG9rZW4oKTtcbiAgICAgICAgICAgIGNvbnN0IG9sZFRva2VuID0gdG9rZW47XG4gICAgICAgICAgICB0b2tlbiA9IGF3YWl0IHRoaXMuc2Vzc2lvbk1hbmFnZXIudG9rZW4oKTtcbiAgICAgICAgICAgIHJldHVybiB0b2tlbiAhPT0gb2xkVG9rZW47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWxzbyByZXRyeSBzZXJ2ZXItc2lkZSBlcnJvcnNcbiAgICAgICAgICByZXR1cm4gc3RhdHVzID49IDUwMCAmJiBzdGF0dXMgPCA2MDA7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIC8vIE9uY2Ugd2UgaGF2ZSBhIG5vbi01WFggcmVzcG9uc2UsIHdlIHdpbGwgYXNzZXJ0T2sgKGVpdGhlciB0aHJvd2luZyBvciB5aWVsZGluZyB0aGUgcmVwb25zZSlcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIEVyclJlc3BvbnNlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGUpOyAvLyBFbWl0IGFwcHJvcHJpYXRlIGV2ZW50c1xuICAgICAgfVxuICAgICAgdGhyb3cgZTsgLy8gUmV0aHJvdyB0aGUgZXJyb3JcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGdyYWRlIGEgc2Vzc2lvbiByZXNwb25zZSBpbnRvIGEgZnVsbCBTZXNzaW9uRGF0YSBieSBpbmNvcnBvcmF0aW5nXG4gKiBlbGVtZW50cyBvZiBhbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICpcbiAqIEBwYXJhbSBtZXRhIEFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKiBAcGFyYW0gaW5mbyBBIG5ldyBzZXNzaW9uIGNyZWF0ZWQgdmlhIHRoZSBBUElcbiAqIEBwYXJhbSBjdHggQWRkaXRpb25hbCBtYW51YWwgb3ZlcnJpZGVzXG4gKiBAcmV0dXJucyBTZXNzaW9uRGF0YSB3aXRoIG5ldyBpbmZvcm1hdGlvbiBmcm9tIGluZm8gYW5kIGN0eFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyhcbiAgbWV0YTogU2Vzc2lvbk1ldGFkYXRhLFxuICBpbmZvOiBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gIGN0eDogUGFydGlhbDx7IHB1cnBvc2U6IHN0cmluZzsgcm9sZV9pZDogc3RyaW5nIH0+LFxuKTogU2Vzc2lvbkRhdGEge1xuICByZXR1cm4ge1xuICAgIGVudjogbWV0YS5lbnYsXG4gICAgb3JnX2lkOiBtZXRhLm9yZ19pZCxcbiAgICBzZXNzaW9uX2V4cDogaW5mby5leHBpcmF0aW9uLFxuICAgIHNlc3Npb25faW5mbzogaW5mby5zZXNzaW9uX2luZm8sXG4gICAgdG9rZW46IGluZm8udG9rZW4sXG4gICAgcmVmcmVzaF90b2tlbjogaW5mby5yZWZyZXNoX3Rva2VuLFxuICAgIHB1cnBvc2U6IG1ldGEucHVycG9zZSxcbiAgICByb2xlX2lkOiBtZXRhLnJvbGVfaWQsXG4gICAgLi4uY3R4LFxuICB9O1xufVxuXG50eXBlIERlZXBPbWl0PEEsIEI+ID0gW0EsIEJdIGV4dGVuZHMgW29iamVjdCwgb2JqZWN0XVxuICA/IHtcbiAgICAgIFtLIGluIGtleW9mIEEgYXMgSyBleHRlbmRzIGtleW9mIEIgLy8gSWYgdGhlIGtleSBpcyBpbiBib3RoIEEgYW5kIEJcbiAgICAgICAgPyBBW0tdIGV4dGVuZHMgQltLXVxuICAgICAgICAgID8gSyAvL1xuICAgICAgICAgIDogbmV2ZXJcbiAgICAgICAgOiBuZXZlcl0/OiBLIGV4dGVuZHMga2V5b2YgQiA/IERlZXBPbWl0PEFbS10sIEJbS10+IDogbmV2ZXI7XG4gICAgfSAmIHtcbiAgICAgIFtLIGluIGtleW9mIEEgYXMgSyBleHRlbmRzIGtleW9mIEIgPyAoQltLXSBleHRlbmRzIEFbS10gPyBuZXZlciA6IEspIDogS106IEsgZXh0ZW5kcyBrZXlvZiBCXG4gICAgICAgID8gRGVlcE9taXQ8QVtLXSwgQltLXT5cbiAgICAgICAgOiBBW0tdO1xuICAgIH1cbiAgOiBBO1xuXG5leHBvcnQgdHlwZSBPbWl0QXV0b1BhcmFtczxPPiA9IERlZXBPbWl0PFxuICBPLFxuICB7XG4gICAgYmFzZVVybDogc3RyaW5nO1xuICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogc3RyaW5nIH0gfTtcbiAgfVxuPiAmIHsgcGFyYW1zPzogeyBwYXRoPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfSB9O1xuIl19