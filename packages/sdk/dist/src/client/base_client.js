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
        /** MUTABLE configuration */
        this.config = {
            /** Update retry delays */
            updateRetryDelaysMs: [100, 200, 400],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFQQSxvRUFnQkM7QUFyUUQsc0VBQXFDO0FBRXJDLG9DQUFvQztBQUNwQyxvQ0FBaUM7QUFDakMsc0NBQXlDO0FBQ3pDLG9DQUF1QztBQUV2Qyx1Q0FBbUY7QUFJbkYsa0NBQWtDO0FBQ3JCLFFBQUEsSUFBSSxHQUFXLHNCQUFHLENBQUMsSUFBSSxDQUFDO0FBRXJDLDZCQUE2QjtBQUNoQixRQUFBLE9BQU8sR0FBVyxzQkFBRyxDQUFDLE9BQU8sQ0FBQztBQUkzQywrRUFBK0U7QUFDL0UsTUFBYSxtQkFBbUI7Q0FBRztBQUFuQyxrREFBbUM7QUFFbkMsd0ZBQXdGO0FBQ3hGLE1BQWEsa0JBQW1CLFNBQVEsbUJBQVc7Q0FBRztBQUF0RCxnREFBc0Q7QUFZdEQ7Ozs7R0FJRztBQUNVLFFBQUEsVUFBVSxHQUErQixJQUFJLHFCQUFZLEVBQUUsQ0FBQztBQUV6RTs7R0FFRztBQUNILE1BQWEsVUFBVyxTQUFRLHFCQUEwQjtJQXNCeEQsdUJBQXVCO0lBQ3ZCLElBQUksR0FBRztRQUNMLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUVqQixPQUE4QyxFQUM5QyxXQUFvQjtRQUVwQixNQUFNLFVBQVUsR0FDZCxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsZ0NBQXNCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUUxRSxJQUFJLE9BQU8sVUFBVSxDQUFDLEtBQUssS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUMzQyxNQUFNLE9BQU8sR0FBRyxV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Li8uLi9wYWNrYWdlLmpzb25cIjtcbmltcG9ydCB0eXBlIHsgRmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhLCBPcCwgT3BlcmF0aW9uLCBTaW1wbGVPcHRpb25zIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyBhc3NlcnRPayB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgcmV0cnkgfSBmcm9tIFwiLi4vcmV0cnlcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IEVyclJlc3BvbnNlIH0gZnJvbSBcIi4uL2Vycm9yXCI7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb25EYXRhLCBTZXNzaW9uTWFuYWdlciwgU2Vzc2lvbk1ldGFkYXRhIH0gZnJvbSBcIi4vc2Vzc2lvblwiO1xuaW1wb3J0IHsgTWVtb3J5U2Vzc2lvbk1hbmFnZXIsIG1ldGFkYXRhLCBwYXJzZUJhc2U2NFNlc3Npb25EYXRhIH0gZnJvbSBcIi4vc2Vzc2lvblwiO1xuaW1wb3J0IHR5cGUgeyBOZXdTZXNzaW9uUmVzcG9uc2UsIEVycm9yUmVzcG9uc2UgfSBmcm9tIFwiLi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHBhY2thZ2UgbmFtZSAqL1xuZXhwb3J0IGNvbnN0IE5BTUU6IHN0cmluZyA9IHBrZy5uYW1lO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgdmVyc2lvbiAqL1xuZXhwb3J0IGNvbnN0IFZFUlNJT046IHN0cmluZyA9IHBrZy52ZXJzaW9uO1xuXG5leHBvcnQgdHlwZSBFcnJvckV2ZW50ID0gRXJyUmVzcG9uc2U7XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGJlY2F1c2Ugb2YgYW4gZXhwaXJlZC9pbnZhbGlkIHNlc3Npb24gKi9cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEV2ZW50IHt9XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGJlY2F1c2UgdXNlciBmYWlsZWQgdG8gYW5zd2VyIGFuIE1GQSBjaGFsbGVuZ2UgKi9cbmV4cG9ydCBjbGFzcyBVc2VyTWZhRmFpbGVkRXZlbnQgZXh0ZW5kcyBFcnJSZXNwb25zZSB7fVxuXG50eXBlIENsaWVudEV2ZW50cyA9IHtcbiAgXCJ1c2VyLW1mYS1mYWlsZWRcIjogKGV2OiBVc2VyTWZhRmFpbGVkRXZlbnQpID0+IHZvaWQ7XG4gIFwic2Vzc2lvbi1leHBpcmVkXCI6IChldjogU2Vzc2lvbkV4cGlyZWRFdmVudCkgPT4gdm9pZDtcbiAgZXJyb3I6IChldjogRXJyb3JFdmVudCkgPT4gdm9pZDtcbn07XG5cbnR5cGUgU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4gPSB7XG4gIG5ldyAoLi4uYXJnczogQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBCYXNlQ2xpZW50Pik6IFQ7XG59ICYgdHlwZW9mIEJhc2VDbGllbnQ7XG5cbi8qKlxuICogQW4gZXZlbnQgZW1pdHRlciBmb3IgYWxsIGNsaWVudHNcbiAqXG4gKiBAZGVwcmVjYXRlZFxuICovXG5leHBvcnQgY29uc3QgQUxMX0VWRU5UUzogRXZlbnRFbWl0dGVyPENsaWVudEV2ZW50cz4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIHJldHJ5IHN0cmF0ZWd5IGFuZCBzZXNzaW9uIHJlZnJlc2hlc1xuICovXG5leHBvcnQgY2xhc3MgQmFzZUNsaWVudCBleHRlbmRzIEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+IHtcbiAgLyoqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzZXNzaW9uIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNsaWVudCAqL1xuICBzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhO1xuXG4gIC8qKiBTZXNzaW9uIHBlcnNpc3RlbmNlICovXG4gIHByb3RlY3RlZCBzZXNzaW9uTWFuYWdlcjogU2Vzc2lvbk1hbmFnZXI7XG5cbiAgLyoqXG4gICAqIFRhcmdldCBvcmcgaWQsIGkuZS4sIHRoZSBvcmdhbml6YXRpb24gdGhpcyBjbGllbnQgc2hvdWxkIG9wZXJhdGUgb24uXG4gICAqXG4gICAqIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZSBhIHRhcmdldCBvcmdhbml6YXRpb25cbiAgICogZGlmZmVyZW50IGZyb20gdGhlIHNlc3Npb24gb3JnYW5pemF0aW9uIGlzIGlmIHRoZSB0YXJnZXQgb3JnYW5pemF0aW9uIGlzXG4gICAqIGEgY2hpbGQgb2YgdGhlIHNlc3Npb24gb3JnYW5pemF0aW9uLlxuICAgKi9cbiAgI3RhcmdldE9yZ0lkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgLyoqIE1VVEFCTEUgY29uZmlndXJhdGlvbiAqL1xuICBjb25maWc6IHsgdXBkYXRlUmV0cnlEZWxheXNNczogbnVtYmVyW10gfSA9IHtcbiAgICAvKiogVXBkYXRlIHJldHJ5IGRlbGF5cyAqL1xuICAgIHVwZGF0ZVJldHJ5RGVsYXlzTXM6IFsxMDAsIDIwMCwgNDAwXSxcbiAgfTtcblxuICAvKiogQHJldHVybnMgVGhlIGVudiAqL1xuICBnZXQgZW52KCk6IEVudkludGVyZmFjZSB7XG4gICAgcmV0dXJuIHRoaXMuc2Vzc2lvbk1ldGEuZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBjbGllbnQgd2l0aCBhIHNlc3Npb24gb3Igc2Vzc2lvbiBtYW5hZ2VyXG4gICAqXG4gICAqIEBwYXJhbSB0aGlzIEFsbG93cyB0aGlzIHN0YXRpYyBtZXRob2QgdG8gcmV0dXJuIHN1YnR5cGVzIHdoZW4gaW52b2tlZCB0aHJvdWdoIHRoZW1cbiAgICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gKG9iamVjdCBvciBiYXNlNjQgc3RyaW5nKSBvciBtYW5hZ2VyIHRoYXQgd2lsbCBiYWNrIHRoaXMgY2xpZW50XG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi4gRGVmYXVsdHMgdG9cbiAgICogICB0aGUgb3JnIGlkIGZyb20gdGhlIHN1cHBsaWVkIHNlc3Npb24uIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZVxuICAgKiAgIGEge0BsaW5rIHRhcmdldE9yZ0lkfSBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmcgaWQgaXMgaWYge0BsaW5rIHRhcmdldE9yZ0lkfSBpcyBhXG4gICAqICAgY2hpbGQgb3JnYW5pemF0aW9uIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybnMgQSBDbGllbnRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VD4oXG4gICAgdGhpczogU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4sXG4gICAgc2Vzc2lvbjogc3RyaW5nIHwgU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSxcbiAgICB0YXJnZXRPcmdJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3Qgc2Vzc2lvbk9iajogU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSA9XG4gICAgICB0eXBlb2Ygc2Vzc2lvbiA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbikgOiBzZXNzaW9uO1xuXG4gICAgaWYgKHR5cGVvZiBzZXNzaW9uT2JqLnRva2VuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IG1hbmFnZXIgPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25NYW5hZ2VyO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKGF3YWl0IG1hbmFnZXIubWV0YWRhdGEoKSwgbWFuYWdlciwgdGFyZ2V0T3JnSWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXNzaW9uID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uRGF0YTtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhtZXRhZGF0YShzZXNzaW9uKSwgbmV3IE1lbW9yeVNlc3Npb25NYW5hZ2VyKHNlc3Npb24pLCB0YXJnZXRPcmdJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBzZXNzaW9uTWV0YSBUaGUgaW5pdGlhbCBzZXNzaW9uIG1ldGFkYXRhXG4gICAqIEBwYXJhbSBtYW5hZ2VyIFRoZSBtYW5hZ2VyIGZvciB0aGUgY3VycmVudCBzZXNzaW9uXG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi4gRGVmYXVsdHMgdG9cbiAgICogICB0aGUgb3JnIGlkIGZyb20gdGhlIHN1cHBsaWVkIHNlc3Npb24uIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZVxuICAgKiAgIGEge0BsaW5rIHRhcmdldE9yZ0lkfSBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmcgaWQgaXMgaWYge0BsaW5rIHRhcmdldE9yZ0lkfSBpcyBhXG4gICAqICAgY2hpbGQgb3JnYW5pemF0aW9uIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhLCBtYW5hZ2VyOiBTZXNzaW9uTWFuYWdlciwgdGFyZ2V0T3JnSWQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI3RhcmdldE9yZ0lkID0gdGFyZ2V0T3JnSWQ7XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5zZXNzaW9uTWV0YSA9IHNlc3Npb25NZXRhO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBvcmdhbml6YXRpb24gSUQuIElmIHRoZSBvcmcgSUQgd2FzIHNldCBleHBsaWNpdGx5LCBpdCByZXR1cm5zIHRoYXQgSUQ7IG90aGVyd2lzZSBpdCByZXR1cm5zIHRoZSBzZXNzaW9uJ3Mgb3JnYW5pemF0aW9uIElELiAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3RhcmdldE9yZ0lkID8/IHRoaXMuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IHRoZSBzZXNzaW9uJ3MgaW1wbGljaXQgYXJndW1lbnRzIG9uIHRvcCBvZiB3aGF0IHdhcyBwcm92aWRlZFxuICAgKlxuICAgKiBAcGFyYW0gdG9rZW4gVGhlIGF1dGhvcml6YXRpb24gdG9rZW4gdG8gdXNlIGZvciB0aGUgcmVxdWVzdFxuICAgKiBAcGFyYW0gb3B0cyBUaGUgdXNlci1zdXBwbGllZCBvcHRzXG4gICAqIEByZXR1cm5zIFRoZSB1bmlvbiBvZiB0aGUgdXNlci1zdXBwbGllZCBvcHRzIGFuZCB0aGUgZGVmYXVsdCBvbmVzXG4gICAqL1xuICAjYXBwbHlPcHRpb25zPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFNpbXBsZU9wdGlvbnM8VD4ge1xuICAgIGNvbnN0IHBhdGhQYXJhbXMgPSBcInBhdGhcIiBpbiAob3B0cy5wYXJhbXMgPz8ge30pID8gb3B0cy5wYXJhbXM/LnBhdGggOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgYmFzZVVybCA9IHRoaXMuZW52LlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuICAgIGNvbnN0IGJyb3dzZXJVc2VyQWdlbnQgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gbmF2aWdhdG9yPy51c2VyQWdlbnQgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNhY2hlOiBcIm5vLXN0b3JlXCIsXG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIGFjdGl2ZVNlc3Npb24sIGxldCBpdCBkaWN0YXRlIHRoZSBiYXNlVXJsLiBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBvbmUgc2V0IGF0IGNvbnN0cnVjdGlvblxuICAgICAgYmFzZVVybCxcbiAgICAgIC4uLm9wdHMsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiVXNlci1BZ2VudFwiOiBicm93c2VyVXNlckFnZW50ID8/IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgICBcIlgtQ3ViaXN0LVRzLVNka1wiOiBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogdG9rZW4sXG4gICAgICAgIC4uLm9wdHMuaGVhZGVycyxcbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgLi4ub3B0cy5wYXJhbXMsXG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHRoaXMub3JnSWQsXG4gICAgICAgICAgLi4ucGF0aFBhcmFtcyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSBhcyB1bmtub3duIGFzIFNpbXBsZU9wdGlvbnM8VD47XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgc3BlY2lmaWMgZXJyb3IgZXZlbnRzIHdoZW4gYSByZXF1ZXN0IGZhaWxlZFxuICAgKlxuICAgKiBAcGFyYW0gZXJyIFRoZSBlcnJvciB0byBjbGFzc2lmeVxuICAgKi9cbiAgYXN5bmMgI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGVycjogRXJyb3JFdmVudCkge1xuICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGVycik7XG4gICAgQUxMX0VWRU5UUy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblxuICAgIGlmIChlcnIuaXNVc2VyTWZhRXJyb3IoKSkge1xuICAgICAgY29uc3QgZXYgPSBcInVzZXItbWZhLWZhaWxlZFwiO1xuICAgICAgdGhpcy5lbWl0KGV2LCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KGV2LCBlcnIpO1xuICAgIH1cblxuICAgIC8vIGlmIHN0YXR1cyBpcyA0MDMgYW5kIGVycm9yIG1hdGNoZXMgb25lIG9mIHRoZSBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIGNvZGVzIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZFxuICAgIC8vXG4gICAgLy8gVE9ETzogYmVjYXVzZSBlcnJvcnMgcmV0dXJuZWQgYnkgdGhlIGF1dGhvcml6ZXIgbGFtYmRhIGFyZSBub3QgZm9yd2FyZGVkIHRvIHRoZSBjbGllbnRcbiAgICAvLyAgICAgICB3ZSBhbHNvIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZCB3aGVuIFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiBmYWlsc1xuICAgIGlmIChcbiAgICAgIGVyci5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKGVyci5pc1Nlc3Npb25FeHBpcmVkRXJyb3IoKSB8fCBlcnIub3BlcmF0aW9uID09IFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIilcbiAgICApIHtcbiAgICAgIGNvbnN0IGV2ID0gXCJzZXNzaW9uLWV4cGlyZWRcIjtcbiAgICAgIHRoaXMuZW1pdChldiwgZXJyKTtcbiAgICAgIEFMTF9FVkVOVFMuZW1pdChldiwgZXJyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgYW4gb3AgdXNpbmcgdGhlIHN0YXRlIG9mIHRoZSBjbGllbnQgKGF1dGggaGVhZGVycyAmIG9yZ19pZCkgd2l0aCByZXRyaWVzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gb3AgVGhlIEFQSSBvcGVyYXRpb24geW91IHdpc2ggdG8gcGVyZm9ybVxuICAgKiBAcGFyYW0gb3B0cyBUaGUgcGFyYW1ldGVycyBmb3IgdGhlIG9wZXJhdGlvblxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIHRoZSBzdWNjZXNzZnVsIHJlc3VsdCAoZXJyb3JzIHdpbGwgYmUgdGhyb3duKVxuICAgKi9cbiAgYXN5bmMgZXhlYzxUIGV4dGVuZHMgT3BlcmF0aW9uPihcbiAgICBvcDogT3A8VD4sXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFByb21pc2U8RmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhPFQ+PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0b2tlbiA9IGF3YWl0IHRoaXMuc2Vzc2lvbk1hbmFnZXIudG9rZW4oKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXRyeSgoKSA9PiBvcCh0aGlzLiNhcHBseU9wdGlvbnModG9rZW4sIG9wdHMpKSwge1xuICAgICAgICBwcmVkOiBhc3luYyAocmVzcCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3AucmVzcG9uc2Uuc3RhdHVzO1xuICAgICAgICAgIGNvbnN0IGVycm9yID0gcmVzcC5lcnJvciBhcyBFcnJvclJlc3BvbnNlIHwgdW5kZWZpbmVkO1xuICAgICAgICAgIGNvbnN0IHJlcXVlc3RJZCA9IGVycm9yPy5yZXF1ZXN0X2lkO1xuXG4gICAgICAgICAgLy8gSWYgd2UgZ2V0IGEgXCJGb3JiaWRkZW5cIiBlcnJvciwgZXJhc2UgdGhlIGNhY2hlZCB0b2tlblxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gVE9ETzogQ2hlY2sgZXJyb3IgY29kZXMgb25jZSBvdXIgQVBJIHJldHVybnMgZXJyb3IgY29kZXMgZm9yXG4gICAgICAgICAgLy8gYXV0aG9yaXphdGlvbiBmYWlsdXJlc1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAgICAgICByZXF1ZXN0SWQgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgdGhpcy5zZXNzaW9uTWFuYWdlci5vbkludmFsaWRUb2tlbiAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnNlc3Npb25NYW5hZ2VyLm9uSW52YWxpZFRva2VuKCk7XG4gICAgICAgICAgICBjb25zdCBvbGRUb2tlbiA9IHRva2VuO1xuICAgICAgICAgICAgdG9rZW4gPSBhd2FpdCB0aGlzLnNlc3Npb25NYW5hZ2VyLnRva2VuKCk7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW4gIT09IG9sZFRva2VuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFsc28gcmV0cnkgc2VydmVyLXNpZGUgZXJyb3JzXG4gICAgICAgICAgcmV0dXJuIHN0YXR1cyA+PSA1MDAgJiYgc3RhdHVzIDwgNjAwO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICAvLyBPbmNlIHdlIGhhdmUgYSBub24tNVhYIHJlc3BvbnNlLCB3ZSB3aWxsIGFzc2VydE9rIChlaXRoZXIgdGhyb3dpbmcgb3IgeWllbGRpbmcgdGhlIHJlcG9uc2UpXG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJSZXNwb25zZSkge1xuICAgICAgICBhd2FpdCB0aGlzLiNjbGFzc2lmeUFuZEVtaXRFcnJvcihlKTsgLy8gRW1pdCBhcHByb3ByaWF0ZSBldmVudHNcbiAgICAgIH1cbiAgICAgIHRocm93IGU7IC8vIFJldGhyb3cgdGhlIGVycm9yXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBncmFkZSBhIHNlc3Npb24gcmVzcG9uc2UgaW50byBhIGZ1bGwgU2Vzc2lvbkRhdGEgYnkgaW5jb3Jwb3JhdGluZ1xuICogZWxlbWVudHMgb2YgYW4gZXhpc3RpbmcgU2Vzc2lvbkRhdGFcbiAqXG4gKiBAcGFyYW0gbWV0YSBBbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICogQHBhcmFtIGluZm8gQSBuZXcgc2Vzc2lvbiBjcmVhdGVkIHZpYSB0aGUgQVBJXG4gKiBAcGFyYW0gY3R4IEFkZGl0aW9uYWwgbWFudWFsIG92ZXJyaWRlc1xuICogQHJldHVybnMgU2Vzc2lvbkRhdGEgd2l0aCBuZXcgaW5mb3JtYXRpb24gZnJvbSBpbmZvIGFuZCBjdHhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8oXG4gIG1ldGE6IFNlc3Npb25NZXRhZGF0YSxcbiAgaW5mbzogTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBjdHg6IFBhcnRpYWw8eyBwdXJwb3NlOiBzdHJpbmc7IHJvbGVfaWQ6IHN0cmluZyB9Pixcbik6IFNlc3Npb25EYXRhIHtcbiAgcmV0dXJuIHtcbiAgICBlbnY6IG1ldGEuZW52LFxuICAgIG9yZ19pZDogbWV0YS5vcmdfaWQsXG4gICAgc2Vzc2lvbl9leHA6IGluZm8uZXhwaXJhdGlvbixcbiAgICBzZXNzaW9uX2luZm86IGluZm8uc2Vzc2lvbl9pbmZvLFxuICAgIHRva2VuOiBpbmZvLnRva2VuLFxuICAgIHJlZnJlc2hfdG9rZW46IGluZm8ucmVmcmVzaF90b2tlbixcbiAgICBwdXJwb3NlOiBtZXRhLnB1cnBvc2UsXG4gICAgcm9sZV9pZDogbWV0YS5yb2xlX2lkLFxuICAgIC4uLmN0eCxcbiAgfTtcbn1cblxudHlwZSBEZWVwT21pdDxBLCBCPiA9IFtBLCBCXSBleHRlbmRzIFtvYmplY3QsIG9iamVjdF1cbiAgPyB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCIC8vIElmIHRoZSBrZXkgaXMgaW4gYm90aCBBIGFuZCBCXG4gICAgICAgID8gQVtLXSBleHRlbmRzIEJbS11cbiAgICAgICAgICA/IEsgLy9cbiAgICAgICAgICA6IG5ldmVyXG4gICAgICAgIDogbmV2ZXJdPzogSyBleHRlbmRzIGtleW9mIEIgPyBEZWVwT21pdDxBW0tdLCBCW0tdPiA6IG5ldmVyO1xuICAgIH0gJiB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCID8gKEJbS10gZXh0ZW5kcyBBW0tdID8gbmV2ZXIgOiBLKSA6IEtdOiBLIGV4dGVuZHMga2V5b2YgQlxuICAgICAgICA/IERlZXBPbWl0PEFbS10sIEJbS10+XG4gICAgICAgIDogQVtLXTtcbiAgICB9XG4gIDogQTtcblxuZXhwb3J0IHR5cGUgT21pdEF1dG9QYXJhbXM8Tz4gPSBEZWVwT21pdDxcbiAgTyxcbiAge1xuICAgIGJhc2VVcmw6IHN0cmluZztcbiAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHN0cmluZyB9IH07XG4gIH1cbj4gJiB7IHBhcmFtcz86IHsgcGF0aD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0gfTtcbiJdfQ==