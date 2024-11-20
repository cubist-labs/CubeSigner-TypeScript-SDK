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
var _BaseClient_instances, _BaseClient_sessionManager, _BaseClient_applyOptions, _BaseClient_classifyAndEmitError;
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
 * @deprecated
 */
exports.ALL_EVENTS = new events_1.EventEmitter();
/**
 * Implements a retry strategy and session refreshes
 */
class BaseClient extends events_1.EventEmitter {
    /** Get the env */
    get env() {
        return this.sessionMeta.env["Dev-CubeSignerStack"];
    }
    /**
     * Construct a client with a session or session manager
     * @param {StaticClientSubclass<T>} this Allows this static method to return subtypes when invoked through them
     * @param {SessionManager | SessionData | string} session  The session (object or base64 string) or manager that will back this client
     * @return {T} A Client
     */
    static async create(session) {
        const sessionObj = typeof session === "string" ? (0, session_1.parseBase64SessionData)(session) : session;
        if (typeof sessionObj.token === "function") {
            const manager = sessionObj;
            return new this(await manager.metadata(), manager);
        }
        else {
            session = sessionObj;
            return new this((0, session_1.metadata)(session), new session_1.MemorySessionManager(session));
        }
    }
    /**
     * @param {SessionMetadata} [sessionMeta] The initial session metadata
     * @param {SessionManager} [manager] The manager for the current session
     *
     * @internal
     */
    constructor(sessionMeta, manager) {
        super();
        _BaseClient_instances.add(this);
        /** Session persistence */
        _BaseClient_sessionManager.set(this, void 0);
        /** MUTABLE configuration */
        this.config = {
            /** Update retry delays */
            updateRetryDelaysMs: [100, 200, 400],
        };
        __classPrivateFieldSet(this, _BaseClient_sessionManager, manager, "f");
        this.sessionMeta = sessionMeta;
    }
    /** The organization ID */
    get orgId() {
        return this.sessionMeta.org_id;
    }
    /**
     * Executes an op using the state of the client (auth headers & org_id) with retries
     *
     * @internal
     * @param {Op<T>} op The API operation you wish to perform
     * @param {SimpleOptions<T>} opts The parameters for the operation
     * @return {FetchResponseSuccessData<T>} A promise for the successful result (errors will be thrown)
     */
    exec(op, opts) {
        return (0, retry_1.retryOn5XX)(() => __classPrivateFieldGet(this, _BaseClient_instances, "m", _BaseClient_applyOptions).call(this, opts).then(op))
            .then(fetch_1.assertOk) // Once we have a non-5XX response, we will assertOk (either throwing or yielding the reponse)
            .catch(async (e) => {
            if (e instanceof error_1.ErrResponse) {
                await __classPrivateFieldGet(this, _BaseClient_instances, "m", _BaseClient_classifyAndEmitError).call(this, e); // Emit appropriate events
            }
            throw e; // Rethrow the error
        });
    }
}
exports.BaseClient = BaseClient;
_BaseClient_sessionManager = new WeakMap(), _BaseClient_instances = new WeakSet(), _BaseClient_applyOptions = 
/**
 * Apply the session's implicit arguments on top of what was provided
 *
 * @param {SimpleOptions} opts The user-supplied opts
 * @return {SimpleOptions} The union of the user-supplied opts and the default ones
 */
async function _BaseClient_applyOptions(opts) {
    const pathParams = "path" in (opts.params ?? {}) ? opts.params?.path : undefined;
    const baseUrl = this.env.SignerApiRoot.replace(/\/$/, "");
    return {
        cache: "no-store",
        // If we have an activeSession, let it dictate the baseUrl. Otherwise fall back to the one set at construction
        baseUrl,
        ...opts,
        headers: {
            "User-Agent": `${exports.NAME}@${exports.VERSION}`,
            "X-Cubist-Ts-Sdk": `${exports.NAME}@${exports.VERSION}`,
            Authorization: await __classPrivateFieldGet(this, _BaseClient_sessionManager, "f").token(),
            ...opts.headers,
        },
        params: {
            ...opts.params,
            path: {
                org_id: this.sessionMeta.org_id,
                ...pathParams,
            },
        },
    };
}, _BaseClient_classifyAndEmitError = 
/**
 * Emits specific error events when a request failed
 *
 * @param {ErrorEvent} err The error to classify
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
 * @param {SessionData} meta An existing SessionData
 * @param {NewSessionResponse} info A new session created via the API
 * @param {object} ctx Additional manual overrides
 * @return {SessionData}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtNQSxvRUFnQkM7QUFsTkQsc0VBQXFDO0FBRXJDLG9DQUFvQztBQUNwQyxvQ0FBc0M7QUFDdEMsc0NBQXlDO0FBQ3pDLG9DQUF1QztBQUV2Qyx1Q0FBbUY7QUFJbkYsa0NBQWtDO0FBQ3JCLFFBQUEsSUFBSSxHQUFXLHNCQUFHLENBQUMsSUFBSSxDQUFDO0FBRXJDLDZCQUE2QjtBQUNoQixRQUFBLE9BQU8sR0FBVyxzQkFBRyxDQUFDLE9BQU8sQ0FBQztBQUkzQywrRUFBK0U7QUFDL0UsTUFBYSxtQkFBbUI7Q0FBRztBQUFuQyxrREFBbUM7QUFFbkMsd0ZBQXdGO0FBQ3hGLE1BQWEsa0JBQW1CLFNBQVEsbUJBQVc7Q0FBRztBQUF0RCxnREFBc0Q7QUFZdEQ7OztHQUdHO0FBQ1UsUUFBQSxVQUFVLEdBQStCLElBQUkscUJBQVksRUFBRSxDQUFDO0FBRXpFOztHQUVHO0FBQ0gsTUFBYSxVQUFXLFNBQVEscUJBQTBCO0lBYXhELGtCQUFrQjtJQUNsQixJQUFJLEdBQUc7UUFDTCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBRWpCLE9BQThDO1FBRTlDLE1BQU0sVUFBVSxHQUNkLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSxnQ0FBc0IsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBRTFFLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQzNDLE1BQU0sT0FBTyxHQUFHLFVBQTRCLENBQUM7WUFDN0MsT0FB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dXJjZXNDb250ZW50IjpbImltcG9ydCBwa2cgZnJvbSBcIi4uLy4uL3BhY2thZ2UuanNvblwiO1xuaW1wb3J0IHR5cGUgeyBGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGEsIE9wLCBPcGVyYXRpb24sIFNpbXBsZU9wdGlvbnMgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyByZXRyeU9uNVhYIH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBFcnJSZXNwb25zZSB9IGZyb20gXCIuLi9lcnJvclwiO1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSwgU2Vzc2lvbk1hbmFnZXIsIFNlc3Npb25NZXRhZGF0YSB9IGZyb20gXCIuL3Nlc3Npb25cIjtcbmltcG9ydCB7IE1lbW9yeVNlc3Npb25NYW5hZ2VyLCBtZXRhZGF0YSwgcGFyc2VCYXNlNjRTZXNzaW9uRGF0YSB9IGZyb20gXCIuL3Nlc3Npb25cIjtcbmltcG9ydCB0eXBlIHsgTmV3U2Vzc2lvblJlc3BvbnNlIH0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyBwYWNrYWdlIG5hbWUgKi9cbmV4cG9ydCBjb25zdCBOQU1FOiBzdHJpbmcgPSBwa2cubmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSBwa2cudmVyc2lvbjtcblxuZXhwb3J0IHR5cGUgRXJyb3JFdmVudCA9IEVyclJlc3BvbnNlO1xuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQvaW52YWxpZCBzZXNzaW9uICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFdmVudCB7fVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIHVzZXIgZmFpbGVkIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlICovXG5leHBvcnQgY2xhc3MgVXNlck1mYUZhaWxlZEV2ZW50IGV4dGVuZHMgRXJyUmVzcG9uc2Uge31cblxudHlwZSBDbGllbnRFdmVudHMgPSB7XG4gIFwidXNlci1tZmEtZmFpbGVkXCI6IChldjogVXNlck1mYUZhaWxlZEV2ZW50KSA9PiB2b2lkO1xuICBcInNlc3Npb24tZXhwaXJlZFwiOiAoZXY6IFNlc3Npb25FeHBpcmVkRXZlbnQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXY6IEVycm9yRXZlbnQpID0+IHZvaWQ7XG59O1xuXG50eXBlIFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+ID0ge1xuICBuZXcgKC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQmFzZUNsaWVudD4pOiBUO1xufSAmIHR5cGVvZiBCYXNlQ2xpZW50O1xuXG4vKipcbiAqIEFuIGV2ZW50IGVtaXR0ZXIgZm9yIGFsbCBjbGllbnRzXG4gKiBAZGVwcmVjYXRlZFxuICovXG5leHBvcnQgY29uc3QgQUxMX0VWRU5UUzogRXZlbnRFbWl0dGVyPENsaWVudEV2ZW50cz4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIHJldHJ5IHN0cmF0ZWd5IGFuZCBzZXNzaW9uIHJlZnJlc2hlc1xuICovXG5leHBvcnQgY2xhc3MgQmFzZUNsaWVudCBleHRlbmRzIEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+IHtcbiAgLyoqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzZXNzaW9uIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNsaWVudCAqL1xuICBzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhO1xuXG4gIC8qKiBTZXNzaW9uIHBlcnNpc3RlbmNlICovXG4gICNzZXNzaW9uTWFuYWdlcjogU2Vzc2lvbk1hbmFnZXI7XG5cbiAgLyoqIE1VVEFCTEUgY29uZmlndXJhdGlvbiAqL1xuICBjb25maWc6IHsgdXBkYXRlUmV0cnlEZWxheXNNczogbnVtYmVyW10gfSA9IHtcbiAgICAvKiogVXBkYXRlIHJldHJ5IGRlbGF5cyAqL1xuICAgIHVwZGF0ZVJldHJ5RGVsYXlzTXM6IFsxMDAsIDIwMCwgNDAwXSxcbiAgfTtcblxuICAvKiogR2V0IHRoZSBlbnYgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25NZXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl07XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgY2xpZW50IHdpdGggYSBzZXNzaW9uIG9yIHNlc3Npb24gbWFuYWdlclxuICAgKiBAcGFyYW0ge1N0YXRpY0NsaWVudFN1YmNsYXNzPFQ+fSB0aGlzIEFsbG93cyB0aGlzIHN0YXRpYyBtZXRob2QgdG8gcmV0dXJuIHN1YnR5cGVzIHdoZW4gaW52b2tlZCB0aHJvdWdoIHRoZW1cbiAgICogQHBhcmFtIHtTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhIHwgc3RyaW5nfSBzZXNzaW9uICBUaGUgc2Vzc2lvbiAob2JqZWN0IG9yIGJhc2U2NCBzdHJpbmcpIG9yIG1hbmFnZXIgdGhhdCB3aWxsIGJhY2sgdGhpcyBjbGllbnRcbiAgICogQHJldHVybiB7VH0gQSBDbGllbnRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VD4oXG4gICAgdGhpczogU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4sXG4gICAgc2Vzc2lvbjogc3RyaW5nIHwgU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSxcbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3Qgc2Vzc2lvbk9iajogU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSA9XG4gICAgICB0eXBlb2Ygc2Vzc2lvbiA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbikgOiBzZXNzaW9uO1xuXG4gICAgaWYgKHR5cGVvZiBzZXNzaW9uT2JqLnRva2VuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IG1hbmFnZXIgPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25NYW5hZ2VyO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKGF3YWl0IG1hbmFnZXIubWV0YWRhdGEoKSwgbWFuYWdlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlc3Npb24gPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25EYXRhO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKG1ldGFkYXRhKHNlc3Npb24pLCBuZXcgTWVtb3J5U2Vzc2lvbk1hbmFnZXIoc2Vzc2lvbikpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1Nlc3Npb25NZXRhZGF0YX0gW3Nlc3Npb25NZXRhXSBUaGUgaW5pdGlhbCBzZXNzaW9uIG1ldGFkYXRhXG4gICAqIEBwYXJhbSB7U2Vzc2lvbk1hbmFnZXJ9IFttYW5hZ2VyXSBUaGUgbWFuYWdlciBmb3IgdGhlIGN1cnJlbnQgc2Vzc2lvblxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGEsIG1hbmFnZXI6IFNlc3Npb25NYW5hZ2VyKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNzZXNzaW9uTWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5zZXNzaW9uTWV0YSA9IHNlc3Npb25NZXRhO1xuICB9XG5cbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gSUQgKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25NZXRhLm9yZ19pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSB0aGUgc2Vzc2lvbidzIGltcGxpY2l0IGFyZ3VtZW50cyBvbiB0b3Agb2Ygd2hhdCB3YXMgcHJvdmlkZWRcbiAgICpcbiAgICogQHBhcmFtIHtTaW1wbGVPcHRpb25zfSBvcHRzIFRoZSB1c2VyLXN1cHBsaWVkIG9wdHNcbiAgICogQHJldHVybiB7U2ltcGxlT3B0aW9uc30gVGhlIHVuaW9uIG9mIHRoZSB1c2VyLXN1cHBsaWVkIG9wdHMgYW5kIHRoZSBkZWZhdWx0IG9uZXNcbiAgICovXG4gIGFzeW5jICNhcHBseU9wdGlvbnM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFByb21pc2U8U2ltcGxlT3B0aW9uczxUPj4ge1xuICAgIGNvbnN0IHBhdGhQYXJhbXMgPSBcInBhdGhcIiBpbiAob3B0cy5wYXJhbXMgPz8ge30pID8gb3B0cy5wYXJhbXM/LnBhdGggOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgYmFzZVVybCA9IHRoaXMuZW52LlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNhY2hlOiBcIm5vLXN0b3JlXCIsXG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIGFjdGl2ZVNlc3Npb24sIGxldCBpdCBkaWN0YXRlIHRoZSBiYXNlVXJsLiBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBvbmUgc2V0IGF0IGNvbnN0cnVjdGlvblxuICAgICAgYmFzZVVybCxcbiAgICAgIC4uLm9wdHMsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiVXNlci1BZ2VudFwiOiBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgXCJYLUN1YmlzdC1Ucy1TZGtcIjogYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGF3YWl0IHRoaXMuI3Nlc3Npb25NYW5hZ2VyLnRva2VuKCksXG4gICAgICAgIC4uLm9wdHMuaGVhZGVycyxcbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgLi4ub3B0cy5wYXJhbXMsXG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHRoaXMuc2Vzc2lvbk1ldGEub3JnX2lkLFxuICAgICAgICAgIC4uLnBhdGhQYXJhbXMsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0gYXMgdW5rbm93biBhcyBTaW1wbGVPcHRpb25zPFQ+O1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIHNwZWNpZmljIGVycm9yIGV2ZW50cyB3aGVuIGEgcmVxdWVzdCBmYWlsZWRcbiAgICpcbiAgICogQHBhcmFtIHtFcnJvckV2ZW50fSBlcnIgVGhlIGVycm9yIHRvIGNsYXNzaWZ5XG4gICAqL1xuICBhc3luYyAjY2xhc3NpZnlBbmRFbWl0RXJyb3IoZXJyOiBFcnJvckV2ZW50KSB7XG4gICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcbiAgICBBTExfRVZFTlRTLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXG4gICAgaWYgKGVyci5pc1VzZXJNZmFFcnJvcigpKSB7XG4gICAgICBjb25zdCBldiA9IFwidXNlci1tZmEtZmFpbGVkXCI7XG4gICAgICB0aGlzLmVtaXQoZXYsIGVycik7XG4gICAgICBBTExfRVZFTlRTLmVtaXQoZXYsIGVycik7XG4gICAgfVxuXG4gICAgLy8gaWYgc3RhdHVzIGlzIDQwMyBhbmQgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlIFwiaW52YWxpZCBzZXNzaW9uXCIgZXJyb3IgY29kZXMgdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkXG4gICAgLy9cbiAgICAvLyBUT0RPOiBiZWNhdXNlIGVycm9ycyByZXR1cm5lZCBieSB0aGUgYXV0aG9yaXplciBsYW1iZGEgYXJlIG5vdCBmb3J3YXJkZWQgdG8gdGhlIGNsaWVudFxuICAgIC8vICAgICAgIHdlIGFsc28gdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkIHdoZW4gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiIGZhaWxzXG4gICAgaWYgKFxuICAgICAgZXJyLnN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAoZXJyLmlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpIHx8IGVyci5vcGVyYXRpb24gPT0gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiKVxuICAgICkge1xuICAgICAgY29uc3QgZXYgPSBcInNlc3Npb24tZXhwaXJlZFwiO1xuICAgICAgdGhpcy5lbWl0KGV2LCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KGV2LCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBhbiBvcCB1c2luZyB0aGUgc3RhdGUgb2YgdGhlIGNsaWVudCAoYXV0aCBoZWFkZXJzICYgb3JnX2lkKSB3aXRoIHJldHJpZXNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSB7T3A8VD59IG9wIFRoZSBBUEkgb3BlcmF0aW9uIHlvdSB3aXNoIHRvIHBlcmZvcm1cbiAgICogQHBhcmFtIHtTaW1wbGVPcHRpb25zPFQ+fSBvcHRzIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgb3BlcmF0aW9uXG4gICAqIEByZXR1cm4ge0ZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPn0gQSBwcm9taXNlIGZvciB0aGUgc3VjY2Vzc2Z1bCByZXN1bHQgKGVycm9ycyB3aWxsIGJlIHRocm93bilcbiAgICovXG4gIGV4ZWM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgb3A6IE9wPFQ+LFxuICAgIG9wdHM6IE9taXRBdXRvUGFyYW1zPFNpbXBsZU9wdGlvbnM8VD4+LFxuICApOiBQcm9taXNlPEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPj4ge1xuICAgIHJldHVybiByZXRyeU9uNVhYKCgpID0+IHRoaXMuI2FwcGx5T3B0aW9ucyhvcHRzKS50aGVuKG9wKSlcbiAgICAgIC50aGVuKGFzc2VydE9rKSAvLyBPbmNlIHdlIGhhdmUgYSBub24tNVhYIHJlc3BvbnNlLCB3ZSB3aWxsIGFzc2VydE9rIChlaXRoZXIgdGhyb3dpbmcgb3IgeWllbGRpbmcgdGhlIHJlcG9uc2UpXG4gICAgICAuY2F0Y2goYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJSZXNwb25zZSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGUpOyAvLyBFbWl0IGFwcHJvcHJpYXRlIGV2ZW50c1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGU7IC8vIFJldGhyb3cgdGhlIGVycm9yXG4gICAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZ3JhZGUgYSBzZXNzaW9uIHJlc3BvbnNlIGludG8gYSBmdWxsIFNlc3Npb25EYXRhIGJ5IGluY29ycG9yYXRpbmdcbiAqIGVsZW1lbnRzIG9mIGFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKiBAcGFyYW0ge1Nlc3Npb25EYXRhfSBtZXRhIEFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKiBAcGFyYW0ge05ld1Nlc3Npb25SZXNwb25zZX0gaW5mbyBBIG5ldyBzZXNzaW9uIGNyZWF0ZWQgdmlhIHRoZSBBUElcbiAqIEBwYXJhbSB7b2JqZWN0fSBjdHggQWRkaXRpb25hbCBtYW51YWwgb3ZlcnJpZGVzXG4gKiBAcmV0dXJuIHtTZXNzaW9uRGF0YX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8oXG4gIG1ldGE6IFNlc3Npb25NZXRhZGF0YSxcbiAgaW5mbzogTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBjdHg6IFBhcnRpYWw8eyBwdXJwb3NlOiBzdHJpbmc7IHJvbGVfaWQ6IHN0cmluZyB9Pixcbik6IFNlc3Npb25EYXRhIHtcbiAgcmV0dXJuIHtcbiAgICBlbnY6IG1ldGEuZW52LFxuICAgIG9yZ19pZDogbWV0YS5vcmdfaWQsXG4gICAgc2Vzc2lvbl9leHA6IGluZm8uZXhwaXJhdGlvbixcbiAgICBzZXNzaW9uX2luZm86IGluZm8uc2Vzc2lvbl9pbmZvLFxuICAgIHRva2VuOiBpbmZvLnRva2VuLFxuICAgIHJlZnJlc2hfdG9rZW46IGluZm8ucmVmcmVzaF90b2tlbixcbiAgICBwdXJwb3NlOiBtZXRhLnB1cnBvc2UsXG4gICAgcm9sZV9pZDogbWV0YS5yb2xlX2lkLFxuICAgIC4uLmN0eCxcbiAgfTtcbn1cblxudHlwZSBEZWVwT21pdDxBLCBCPiA9IFtBLCBCXSBleHRlbmRzIFtvYmplY3QsIG9iamVjdF1cbiAgPyB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCIC8vIElmIHRoZSBrZXkgaXMgaW4gYm90aCBBIGFuZCBCXG4gICAgICAgID8gQVtLXSBleHRlbmRzIEJbS11cbiAgICAgICAgICA/IEsgLy9cbiAgICAgICAgICA6IG5ldmVyXG4gICAgICAgIDogbmV2ZXJdPzogSyBleHRlbmRzIGtleW9mIEIgPyBEZWVwT21pdDxBW0tdLCBCW0tdPiA6IG5ldmVyO1xuICAgIH0gJiB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCID8gKEJbS10gZXh0ZW5kcyBBW0tdID8gbmV2ZXIgOiBLKSA6IEtdOiBLIGV4dGVuZHMga2V5b2YgQlxuICAgICAgICA/IERlZXBPbWl0PEFbS10sIEJbS10+XG4gICAgICAgIDogQVtLXTtcbiAgICB9XG4gIDogQTtcblxuZXhwb3J0IHR5cGUgT21pdEF1dG9QYXJhbXM8Tz4gPSBEZWVwT21pdDxcbiAgTyxcbiAge1xuICAgIGJhc2VVcmw6IHN0cmluZztcbiAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHN0cmluZyB9IH07XG4gIH1cbj4gJiB7IHBhcmFtcz86IHsgcGF0aD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0gfTtcbiJdfQ==