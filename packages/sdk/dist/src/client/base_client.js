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
var _BaseClient_instances, _BaseClient_sessionManager, _BaseClient_applyOptions, _BaseClient_classifyAndEmitError;
Object.defineProperty(exports, "__esModule", { value: true });
exports.signerSessionFromSessionInfo = exports.BaseClient = exports.ALL_EVENTS = exports.UserMfaFailedEvent = exports.SessionExpiredEvent = void 0;
const __1 = require("..");
const fetch_1 = require("../fetch");
const retry_1 = require("../retry");
const index_1 = require("../index");
const events_1 = require("../events");
/** Event emitted when a request fails because of an expired/invalid session */
class SessionExpiredEvent {
}
exports.SessionExpiredEvent = SessionExpiredEvent;
/** Event emitted when a request fails because user failed to answer an MFA challenge */
class UserMfaFailedEvent extends __1.ErrResponse {
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
        const sessionObj = typeof session === "string" ? (0, __1.parseBase64SessionData)(session) : session;
        if (typeof sessionObj.token === "function") {
            const manager = sessionObj;
            return new this(await manager.metadata(), manager);
        }
        else {
            session = sessionObj;
            return new this((0, __1.metadata)(session), new __1.MemorySessionManager(session));
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
            if (e instanceof __1.ErrResponse) {
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
            "User-Agent": `${index_1.NAME}@${index_1.VERSION}`,
            "X-Cubist-Ts-Sdk": `${index_1.NAME}@${index_1.VERSION}`,
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
        this.emit("user-mfa-failed", err);
        exports.ALL_EVENTS.emit("user-mfa-failed", err);
    }
    // if status is 403 and error matches one of the "invalid session" error codes trigger onSessionExpired
    //
    // TODO: because errors returned by the authorizer lambda are not forwarded to the client
    //       we also trigger onSessionExpired when "signerSessionRefresh" fails
    if (err.status === 403 &&
        (err.isSessionExpiredError() || err.operation == "signerSessionRefresh")) {
        this.emit("session-expired", err);
        exports.ALL_EVENTS.emit("user-mfa-failed", err);
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
exports.signerSessionFromSessionInfo = signerSessionFromSessionInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQU9BLDBCQUF5RjtBQUV6RixvQ0FBb0M7QUFDcEMsb0NBQXNDO0FBQ3RDLG9DQUF5QztBQUN6QyxzQ0FBeUM7QUFJekMsK0VBQStFO0FBQy9FLE1BQWEsbUJBQW1CO0NBQUc7QUFBbkMsa0RBQW1DO0FBRW5DLHdGQUF3RjtBQUN4RixNQUFhLGtCQUFtQixTQUFRLGVBQVc7Q0FBRztBQUF0RCxnREFBc0Q7QUFZdEQ7OztHQUdHO0FBQ1UsUUFBQSxVQUFVLEdBQStCLElBQUkscUJBQVksRUFBRSxDQUFDO0FBRXpFOztHQUVHO0FBQ0gsTUFBYSxVQUFXLFNBQVEscUJBQTBCO0lBYXhELGtCQUFrQjtJQUNsQixJQUFJLEdBQUc7UUFDTCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBRWpCLE9BQThDO1FBRTlDLE1BQU0sVUFBVSxHQUNkLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSwwQkFBc0IsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBRTFFLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFBRTtZQUMxQyxNQUFNLE9BQU8sR0FBRyxVQUE0QixDQUFDO1lBQzdDLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDcEQ7YUFBTTtZQUNMLE9BQU8sR0FBRyxVQUF5QixDQUFDO1lBQ3BDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBQSxZQUFRLEVBQUMsT0FBTyxD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QUVELHVHQUF1RztJQUN2RyxFQUFFO0lBQ0YseUZBQXlGO0lBQ3pGLDJFQUEyRTtJQUMzRSxJQUNFLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRztRQUNsQixDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLEdBQUcsQ0FBQyxTQUFTLElBQUksc0JBQXNCLENBQUMsRUFDeEU7UUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLGtCQUFVLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ3pDO0FBQ0gsQ0FBQztBQXlCSDs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsNEJBQTRCLENBQzFDLElBQXFCLEVBQ3JCLElBQXdCLEVBQ3hCLEdBQWtEO0lBRWxELE9BQU87UUFDTCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7UUFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDbkIsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVO1FBQzVCLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtRQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7UUFDakIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1FBQ2pDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87UUFDckIsR0FBRyxHQUFHO0tBQ1AsQ0FBQztBQUNKLENBQUM7QUFoQkQsb0VBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBFbnZJbnRlcmZhY2UsXG4gIE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgU2Vzc2lvbk1hbmFnZXIsXG4gIFNlc3Npb25NZXRhZGF0YSxcbiAgU2Vzc2lvbkRhdGEsXG59IGZyb20gXCIuLlwiO1xuaW1wb3J0IHsgRXJyUmVzcG9uc2UsIG1ldGFkYXRhLCBNZW1vcnlTZXNzaW9uTWFuYWdlciwgcGFyc2VCYXNlNjRTZXNzaW9uRGF0YSB9IGZyb20gXCIuLlwiO1xuaW1wb3J0IHR5cGUgeyBGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGEsIE9wLCBPcGVyYXRpb24sIFNpbXBsZU9wdGlvbnMgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyByZXRyeU9uNVhYIH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgeyBOQU1FLCBWRVJTSU9OIH0gZnJvbSBcIi4uL2luZGV4XCI7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5cbmV4cG9ydCB0eXBlIEVycm9yRXZlbnQgPSBFcnJSZXNwb25zZTtcblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgYmVjYXVzZSBvZiBhbiBleHBpcmVkL2ludmFsaWQgc2Vzc2lvbiAqL1xuZXhwb3J0IGNsYXNzIFNlc3Npb25FeHBpcmVkRXZlbnQge31cblxuLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBhIHJlcXVlc3QgZmFpbHMgYmVjYXVzZSB1c2VyIGZhaWxlZCB0byBhbnN3ZXIgYW4gTUZBIGNoYWxsZW5nZSAqL1xuZXhwb3J0IGNsYXNzIFVzZXJNZmFGYWlsZWRFdmVudCBleHRlbmRzIEVyclJlc3BvbnNlIHt9XG5cbnR5cGUgQ2xpZW50RXZlbnRzID0ge1xuICBcInVzZXItbWZhLWZhaWxlZFwiOiAoZXY6IFVzZXJNZmFGYWlsZWRFdmVudCkgPT4gdm9pZDtcbiAgXCJzZXNzaW9uLWV4cGlyZWRcIjogKGV2OiBTZXNzaW9uRXhwaXJlZEV2ZW50KSA9PiB2b2lkO1xuICBlcnJvcjogKGV2OiBFcnJvckV2ZW50KSA9PiB2b2lkO1xufTtcblxudHlwZSBTdGF0aWNDbGllbnRTdWJjbGFzczxUPiA9IHtcbiAgbmV3ICguLi5hcmdzOiBDb25zdHJ1Y3RvclBhcmFtZXRlcnM8dHlwZW9mIEJhc2VDbGllbnQ+KTogVDtcbn0gJiB0eXBlb2YgQmFzZUNsaWVudDtcblxuLyoqXG4gKiBBbiBldmVudCBlbWl0dGVyIGZvciBhbGwgY2xpZW50c1xuICogQGRlcHJlY2F0ZWRcbiAqL1xuZXhwb3J0IGNvbnN0IEFMTF9FVkVOVFM6IEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSByZXRyeSBzdHJhdGVneSBhbmQgc2Vzc2lvbiByZWZyZXNoZXNcbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDbGllbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8Q2xpZW50RXZlbnRzPiB7XG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc2Vzc2lvbiBjb250YWluZWQgd2l0aGluIHRoZSBjbGllbnQgKi9cbiAgc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YTtcblxuICAvKiogU2Vzc2lvbiBwZXJzaXN0ZW5jZSAqL1xuICAjc2Vzc2lvbk1hbmFnZXI6IFNlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKiBNVVRBQkxFIGNvbmZpZ3VyYXRpb24gKi9cbiAgY29uZmlnOiB7IHVwZGF0ZVJldHJ5RGVsYXlzTXM6IG51bWJlcltdIH0gPSB7XG4gICAgLyoqIFVwZGF0ZSByZXRyeSBkZWxheXMgKi9cbiAgICB1cGRhdGVSZXRyeURlbGF5c01zOiBbMTAwLCAyMDAsIDQwMF0sXG4gIH07XG5cbiAgLyoqIEdldCB0aGUgZW52ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWV0YS5lbnZbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIGNsaWVudCB3aXRoIGEgc2Vzc2lvbiBvciBzZXNzaW9uIG1hbmFnZXJcbiAgICogQHBhcmFtIHtTdGF0aWNDbGllbnRTdWJjbGFzczxUPn0gdGhpcyBBbGxvd3MgdGhpcyBzdGF0aWMgbWV0aG9kIHRvIHJldHVybiBzdWJ0eXBlcyB3aGVuIGludm9rZWQgdGhyb3VnaCB0aGVtXG4gICAqIEBwYXJhbSB7U2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSB8IHN0cmluZ30gc2Vzc2lvbiAgVGhlIHNlc3Npb24gKG9iamVjdCBvciBiYXNlNjQgc3RyaW5nKSBvciBtYW5hZ2VyIHRoYXQgd2lsbCBiYWNrIHRoaXMgY2xpZW50XG4gICAqIEByZXR1cm4ge1R9IEEgQ2xpZW50XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlPFQ+KFxuICAgIHRoaXM6IFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+LFxuICAgIHNlc3Npb246IHN0cmluZyB8IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEsXG4gICk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IHNlc3Npb25PYmo6IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEgPVxuICAgICAgdHlwZW9mIHNlc3Npb24gPT09IFwic3RyaW5nXCIgPyBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb24pIDogc2Vzc2lvbjtcblxuICAgIGlmICh0eXBlb2Ygc2Vzc2lvbk9iai50b2tlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zdCBtYW5hZ2VyID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uTWFuYWdlcjtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhhd2FpdCBtYW5hZ2VyLm1ldGFkYXRhKCksIG1hbmFnZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXNzaW9uID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uRGF0YTtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhtZXRhZGF0YShzZXNzaW9uKSwgbmV3IE1lbW9yeVNlc3Npb25NYW5hZ2VyKHNlc3Npb24pKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTZXNzaW9uTWV0YWRhdGF9IFtzZXNzaW9uTWV0YV0gVGhlIGluaXRpYWwgc2Vzc2lvbiBtZXRhZGF0YVxuICAgKiBAcGFyYW0ge1Nlc3Npb25NYW5hZ2VyfSBbbWFuYWdlcl0gVGhlIG1hbmFnZXIgZm9yIHRoZSBjdXJyZW50IHNlc3Npb25cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhLCBtYW5hZ2VyOiBTZXNzaW9uTWFuYWdlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jc2Vzc2lvbk1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuc2Vzc2lvbk1ldGEgPSBzZXNzaW9uTWV0YTtcbiAgfVxuXG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIElEICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgdGhlIHNlc3Npb24ncyBpbXBsaWNpdCBhcmd1bWVudHMgb24gdG9wIG9mIHdoYXQgd2FzIHByb3ZpZGVkXG4gICAqXG4gICAqIEBwYXJhbSB7U2ltcGxlT3B0aW9uc30gb3B0cyBUaGUgdXNlci1zdXBwbGllZCBvcHRzXG4gICAqIEByZXR1cm4ge1NpbXBsZU9wdGlvbnN9IFRoZSB1bmlvbiBvZiB0aGUgdXNlci1zdXBwbGllZCBvcHRzIGFuZCB0aGUgZGVmYXVsdCBvbmVzXG4gICAqL1xuICBhc3luYyAjYXBwbHlPcHRpb25zPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIG9wdHM6IE9taXRBdXRvUGFyYW1zPFNpbXBsZU9wdGlvbnM8VD4+LFxuICApOiBQcm9taXNlPFNpbXBsZU9wdGlvbnM8VD4+IHtcbiAgICBjb25zdCBwYXRoUGFyYW1zID0gXCJwYXRoXCIgaW4gKG9wdHMucGFyYW1zID8/IHt9KSA/IG9wdHMucGFyYW1zPy5wYXRoIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGJhc2VVcmwgPSB0aGlzLmVudi5TaWduZXJBcGlSb290LnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjYWNoZTogXCJuby1zdG9yZVwiLFxuICAgICAgLy8gSWYgd2UgaGF2ZSBhbiBhY3RpdmVTZXNzaW9uLCBsZXQgaXQgZGljdGF0ZSB0aGUgYmFzZVVybC4gT3RoZXJ3aXNlIGZhbGwgYmFjayB0byB0aGUgb25lIHNldCBhdCBjb25zdHJ1Y3Rpb25cbiAgICAgIGJhc2VVcmwsXG4gICAgICAuLi5vcHRzLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIlVzZXItQWdlbnRcIjogYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICAgIFwiWC1DdWJpc3QtVHMtU2RrXCI6IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBhd2FpdCB0aGlzLiNzZXNzaW9uTWFuYWdlci50b2tlbigpLFxuICAgICAgICAuLi5vcHRzLmhlYWRlcnMsXG4gICAgICB9LFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIC4uLm9wdHMucGFyYW1zLFxuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgb3JnX2lkOiB0aGlzLnNlc3Npb25NZXRhLm9yZ19pZCxcbiAgICAgICAgICAuLi5wYXRoUGFyYW1zLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9IGFzIHVua25vd24gYXMgU2ltcGxlT3B0aW9uczxUPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBzcGVjaWZpYyBlcnJvciBldmVudHMgd2hlbiBhIHJlcXVlc3QgZmFpbGVkXG4gICAqXG4gICAqIEBwYXJhbSB7RXJyb3JFdmVudH0gZXJyIFRoZSBlcnJvciB0byBjbGFzc2lmeVxuICAgKi9cbiAgYXN5bmMgI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGVycjogRXJyb3JFdmVudCkge1xuICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGVycik7XG4gICAgQUxMX0VWRU5UUy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblxuICAgIGlmIChlcnIuaXNVc2VyTWZhRXJyb3IoKSkge1xuICAgICAgdGhpcy5lbWl0KFwidXNlci1tZmEtZmFpbGVkXCIsIGVycik7XG4gICAgICBBTExfRVZFTlRTLmVtaXQoXCJ1c2VyLW1mYS1mYWlsZWRcIiwgZXJyKTtcbiAgICB9XG5cbiAgICAvLyBpZiBzdGF0dXMgaXMgNDAzIGFuZCBlcnJvciBtYXRjaGVzIG9uZSBvZiB0aGUgXCJpbnZhbGlkIHNlc3Npb25cIiBlcnJvciBjb2RlcyB0cmlnZ2VyIG9uU2Vzc2lvbkV4cGlyZWRcbiAgICAvL1xuICAgIC8vIFRPRE86IGJlY2F1c2UgZXJyb3JzIHJldHVybmVkIGJ5IHRoZSBhdXRob3JpemVyIGxhbWJkYSBhcmUgbm90IGZvcndhcmRlZCB0byB0aGUgY2xpZW50XG4gICAgLy8gICAgICAgd2UgYWxzbyB0cmlnZ2VyIG9uU2Vzc2lvbkV4cGlyZWQgd2hlbiBcInNpZ25lclNlc3Npb25SZWZyZXNoXCIgZmFpbHNcbiAgICBpZiAoXG4gICAgICBlcnIuc3RhdHVzID09PSA0MDMgJiZcbiAgICAgIChlcnIuaXNTZXNzaW9uRXhwaXJlZEVycm9yKCkgfHwgZXJyLm9wZXJhdGlvbiA9PSBcInNpZ25lclNlc3Npb25SZWZyZXNoXCIpXG4gICAgKSB7XG4gICAgICB0aGlzLmVtaXQoXCJzZXNzaW9uLWV4cGlyZWRcIiwgZXJyKTtcbiAgICAgIEFMTF9FVkVOVFMuZW1pdChcInVzZXItbWZhLWZhaWxlZFwiLCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBhbiBvcCB1c2luZyB0aGUgc3RhdGUgb2YgdGhlIGNsaWVudCAoYXV0aCBoZWFkZXJzICYgb3JnX2lkKSB3aXRoIHJldHJpZXNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSB7T3A8VD59IG9wIFRoZSBBUEkgb3BlcmF0aW9uIHlvdSB3aXNoIHRvIHBlcmZvcm1cbiAgICogQHBhcmFtIHtTaW1wbGVPcHRpb25zPFQ+fSBvcHRzIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgb3BlcmF0aW9uXG4gICAqIEByZXR1cm4ge0ZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPn0gQSBwcm9taXNlIGZvciB0aGUgc3VjY2Vzc2Z1bCByZXN1bHQgKGVycm9ycyB3aWxsIGJlIHRocm93bilcbiAgICovXG4gIGV4ZWM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgb3A6IE9wPFQ+LFxuICAgIG9wdHM6IE9taXRBdXRvUGFyYW1zPFNpbXBsZU9wdGlvbnM8VD4+LFxuICApOiBQcm9taXNlPEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPj4ge1xuICAgIHJldHVybiByZXRyeU9uNVhYKCgpID0+IHRoaXMuI2FwcGx5T3B0aW9ucyhvcHRzKS50aGVuKG9wKSlcbiAgICAgIC50aGVuKGFzc2VydE9rKSAvLyBPbmNlIHdlIGhhdmUgYSBub24tNVhYIHJlc3BvbnNlLCB3ZSB3aWxsIGFzc2VydE9rIChlaXRoZXIgdGhyb3dpbmcgb3IgeWllbGRpbmcgdGhlIHJlcG9uc2UpXG4gICAgICAuY2F0Y2goYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJSZXNwb25zZSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGUpOyAvLyBFbWl0IGFwcHJvcHJpYXRlIGV2ZW50c1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGU7IC8vIFJldGhyb3cgdGhlIGVycm9yXG4gICAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZ3JhZGUgYSBzZXNzaW9uIHJlc3BvbnNlIGludG8gYSBmdWxsIFNlc3Npb25EYXRhIGJ5IGluY29ycG9yYXRpbmdcbiAqIGVsZW1lbnRzIG9mIGFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKiBAcGFyYW0ge1Nlc3Npb25EYXRhfSBtZXRhIEFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKiBAcGFyYW0ge05ld1Nlc3Npb25SZXNwb25zZX0gaW5mbyBBIG5ldyBzZXNzaW9uIGNyZWF0ZWQgdmlhIHRoZSBBUElcbiAqIEBwYXJhbSB7b2JqZWN0fSBjdHggQWRkaXRpb25hbCBtYW51YWwgb3ZlcnJpZGVzXG4gKiBAcmV0dXJuIHtTZXNzaW9uRGF0YX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8oXG4gIG1ldGE6IFNlc3Npb25NZXRhZGF0YSxcbiAgaW5mbzogTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBjdHg6IFBhcnRpYWw8eyBwdXJwb3NlOiBzdHJpbmc7IHJvbGVfaWQ6IHN0cmluZyB9Pixcbik6IFNlc3Npb25EYXRhIHtcbiAgcmV0dXJuIHtcbiAgICBlbnY6IG1ldGEuZW52LFxuICAgIG9yZ19pZDogbWV0YS5vcmdfaWQsXG4gICAgc2Vzc2lvbl9leHA6IGluZm8uZXhwaXJhdGlvbixcbiAgICBzZXNzaW9uX2luZm86IGluZm8uc2Vzc2lvbl9pbmZvLFxuICAgIHRva2VuOiBpbmZvLnRva2VuLFxuICAgIHJlZnJlc2hfdG9rZW46IGluZm8ucmVmcmVzaF90b2tlbixcbiAgICBwdXJwb3NlOiBtZXRhLnB1cnBvc2UsXG4gICAgcm9sZV9pZDogbWV0YS5yb2xlX2lkLFxuICAgIC4uLmN0eCxcbiAgfTtcbn1cblxudHlwZSBEZWVwT21pdDxBLCBCPiA9IFtBLCBCXSBleHRlbmRzIFtvYmplY3QsIG9iamVjdF1cbiAgPyB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCIC8vIElmIHRoZSBrZXkgaXMgaW4gYm90aCBBIGFuZCBCXG4gICAgICAgID8gQVtLXSBleHRlbmRzIEJbS11cbiAgICAgICAgICA/IEsgLy9cbiAgICAgICAgICA6IG5ldmVyXG4gICAgICAgIDogbmV2ZXJdPzogSyBleHRlbmRzIGtleW9mIEIgPyBEZWVwT21pdDxBW0tdLCBCW0tdPiA6IG5ldmVyO1xuICAgIH0gJiB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCID8gKEJbS10gZXh0ZW5kcyBBW0tdID8gbmV2ZXIgOiBLKSA6IEtdOiBLIGV4dGVuZHMga2V5b2YgQlxuICAgICAgICA/IERlZXBPbWl0PEFbS10sIEJbS10+XG4gICAgICAgIDogQVtLXTtcbiAgICB9XG4gIDogQTtcblxuZXhwb3J0IHR5cGUgT21pdEF1dG9QYXJhbXM8Tz4gPSBEZWVwT21pdDxcbiAgTyxcbiAge1xuICAgIGJhc2VVcmw6IHN0cmluZztcbiAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHN0cmluZyB9IH07XG4gIH1cbj4gJiB7IHBhcmFtcz86IHsgcGF0aD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0gfTtcbiJdfQ==