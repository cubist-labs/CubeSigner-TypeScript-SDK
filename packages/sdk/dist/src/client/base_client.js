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
        purpose: meta.purpose,
        role_id: meta.role_id,
        ...ctx,
    };
}
exports.signerSessionFromSessionInfo = signerSessionFromSessionInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQU9BLDBCQUF5RjtBQUV6RixvQ0FBb0M7QUFDcEMsb0NBQXNDO0FBQ3RDLG9DQUF5QztBQUN6QyxzQ0FBeUM7QUFJekMsK0VBQStFO0FBQy9FLE1BQWEsbUJBQW1CO0NBQUc7QUFBbkMsa0RBQW1DO0FBRW5DLHdGQUF3RjtBQUN4RixNQUFhLGtCQUFtQixTQUFRLGVBQVc7Q0FBRztBQUF0RCxnREFBc0Q7QUFZdEQ7OztHQUdHO0FBQ1UsUUFBQSxVQUFVLEdBQStCLElBQUkscUJBQVksRUFBRSxDQUFDO0FBRXpFOztHQUVHO0FBQ0gsTUFBYSxVQUFXLFNBQVEscUJBQTBCO0lBYXhELGtCQUFrQjtJQUNsQixJQUFJLEdBQUc7UUFDTCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBRWpCLE9BQThDO1FBRTlDLE1BQU0sVUFBVSxHQUNkLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSwwQkFBc0IsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBRTFFLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFBRTtZQUMxQyxNQUFNLE9BQU8sR0FBRyxVQUE0QixDQUFDO1lBQzdDLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDcEQ7YUFBTTtZQUNMLE9BQU8sR0FBRyxVQUF5QixDQUFDO1lBQ3BDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBQSxZQUFRLEVBQUMsT0FBTyxD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RUQsdUdBQXVHO0lBQ3ZHLEVBQUU7SUFDRix5RkFBeUY7SUFDekYsMkVBQTJFO0lBQzNFLElBQ0UsR0FBRyxDQUFDLE1BQU0sS0FBSyxHQUFHO1FBQ2xCLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLElBQUksR0FBRyxDQUFDLFNBQVMsSUFBSSxzQkFBc0IsQ0FBQyxFQUN4RTtRQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbEMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDekM7QUFDSCxDQUFDO0FBd0JIOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQiw0QkFBNEIsQ0FDMUMsSUFBcUIsRUFDckIsSUFBd0IsRUFDeEIsR0FBa0Q7SUFFbEQsT0FBTztRQUNMLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztRQUNiLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtRQUNuQixXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVU7UUFDNUIsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO1FBQy9CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztRQUNqQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87UUFDckIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1FBQ3JCLEdBQUcsR0FBRztLQUNQLENBQUM7QUFDSixDQUFDO0FBZkQsb0VBZUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEVudkludGVyZmFjZSxcbiAgTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBTZXNzaW9uTWFuYWdlcixcbiAgU2Vzc2lvbk1ldGFkYXRhLFxuICBTZXNzaW9uRGF0YSxcbn0gZnJvbSBcIi4uXCI7XG5pbXBvcnQgeyBFcnJSZXNwb25zZSwgbWV0YWRhdGEsIE1lbW9yeVNlc3Npb25NYW5hZ2VyLCBwYXJzZUJhc2U2NFNlc3Npb25EYXRhIH0gZnJvbSBcIi4uXCI7XG5pbXBvcnQgdHlwZSB7IEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YSwgT3AsIE9wZXJhdGlvbiwgU2ltcGxlT3B0aW9ucyB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IHJldHJ5T241WFggfSBmcm9tIFwiLi4vcmV0cnlcIjtcbmltcG9ydCB7IE5BTUUsIFZFUlNJT04gfSBmcm9tIFwiLi4vaW5kZXhcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCIuLi9ldmVudHNcIjtcblxuZXhwb3J0IHR5cGUgRXJyb3JFdmVudCA9IEVyclJlc3BvbnNlO1xuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQvaW52YWxpZCBzZXNzaW9uICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFdmVudCB7fVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIHVzZXIgZmFpbGVkIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlICovXG5leHBvcnQgY2xhc3MgVXNlck1mYUZhaWxlZEV2ZW50IGV4dGVuZHMgRXJyUmVzcG9uc2Uge31cblxudHlwZSBDbGllbnRFdmVudHMgPSB7XG4gIFwidXNlci1tZmEtZmFpbGVkXCI6IChldjogVXNlck1mYUZhaWxlZEV2ZW50KSA9PiB2b2lkO1xuICBcInNlc3Npb24tZXhwaXJlZFwiOiAoZXY6IFNlc3Npb25FeHBpcmVkRXZlbnQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXY6IEVycm9yRXZlbnQpID0+IHZvaWQ7XG59O1xuXG50eXBlIFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+ID0ge1xuICBuZXcgKC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQmFzZUNsaWVudD4pOiBUO1xufSAmIHR5cGVvZiBCYXNlQ2xpZW50O1xuXG4vKipcbiAqIEFuIGV2ZW50IGVtaXR0ZXIgZm9yIGFsbCBjbGllbnRzXG4gKiBAZGVwcmVjYXRlZFxuICovXG5leHBvcnQgY29uc3QgQUxMX0VWRU5UUzogRXZlbnRFbWl0dGVyPENsaWVudEV2ZW50cz4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIHJldHJ5IHN0cmF0ZWd5IGFuZCBzZXNzaW9uIHJlZnJlc2hlc1xuICovXG5leHBvcnQgY2xhc3MgQmFzZUNsaWVudCBleHRlbmRzIEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+IHtcbiAgLyoqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzZXNzaW9uIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNsaWVudCAqL1xuICBzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhO1xuXG4gIC8qKiBTZXNzaW9uIHBlcnNpc3RlbmNlICovXG4gICNzZXNzaW9uTWFuYWdlcjogU2Vzc2lvbk1hbmFnZXI7XG5cbiAgLyoqIE1VVEFCTEUgY29uZmlndXJhdGlvbiAqL1xuICBjb25maWc6IHsgdXBkYXRlUmV0cnlEZWxheXNNczogbnVtYmVyW10gfSA9IHtcbiAgICAvKiogVXBkYXRlIHJldHJ5IGRlbGF5cyAqL1xuICAgIHVwZGF0ZVJldHJ5RGVsYXlzTXM6IFsxMDAsIDIwMCwgNDAwXSxcbiAgfTtcblxuICAvKiogR2V0IHRoZSBlbnYgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25NZXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl07XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgY2xpZW50IHdpdGggYSBzZXNzaW9uIG9yIHNlc3Npb24gbWFuYWdlclxuICAgKiBAcGFyYW0ge1N0YXRpY0NsaWVudFN1YmNsYXNzPFQ+fSB0aGlzIEFsbG93cyB0aGlzIHN0YXRpYyBtZXRob2QgdG8gcmV0dXJuIHN1YnR5cGVzIHdoZW4gaW52b2tlZCB0aHJvdWdoIHRoZW1cbiAgICogQHBhcmFtIHtTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhIHwgc3RyaW5nfSBzZXNzaW9uICBUaGUgc2Vzc2lvbiAob2JqZWN0IG9yIGJhc2U2NCBzdHJpbmcpIG9yIG1hbmFnZXIgdGhhdCB3aWxsIGJhY2sgdGhpcyBjbGllbnRcbiAgICogQHJldHVybiB7VH0gQSBDbGllbnRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VD4oXG4gICAgdGhpczogU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4sXG4gICAgc2Vzc2lvbjogc3RyaW5nIHwgU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSxcbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3Qgc2Vzc2lvbk9iajogU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSA9XG4gICAgICB0eXBlb2Ygc2Vzc2lvbiA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbikgOiBzZXNzaW9uO1xuXG4gICAgaWYgKHR5cGVvZiBzZXNzaW9uT2JqLnRva2VuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IG1hbmFnZXIgPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25NYW5hZ2VyO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKGF3YWl0IG1hbmFnZXIubWV0YWRhdGEoKSwgbWFuYWdlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlc3Npb24gPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25EYXRhO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKG1ldGFkYXRhKHNlc3Npb24pLCBuZXcgTWVtb3J5U2Vzc2lvbk1hbmFnZXIoc2Vzc2lvbikpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1Nlc3Npb25NZXRhZGF0YX0gW3Nlc3Npb25NZXRhXSBUaGUgaW5pdGlhbCBzZXNzaW9uIG1ldGFkYXRhXG4gICAqIEBwYXJhbSB7U2Vzc2lvbk1hbmFnZXJ9IFttYW5hZ2VyXSBUaGUgbWFuYWdlciBmb3IgdGhlIGN1cnJlbnQgc2Vzc2lvblxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGEsIG1hbmFnZXI6IFNlc3Npb25NYW5hZ2VyKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNzZXNzaW9uTWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5zZXNzaW9uTWV0YSA9IHNlc3Npb25NZXRhO1xuICB9XG5cbiAgLyoqIFRoZSBvcmdhbml6YXRpb24gSUQgKi9cbiAgZ2V0IG9yZ0lkKCkge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25NZXRhLm9yZ19pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSB0aGUgc2Vzc2lvbidzIGltcGxpY2l0IGFyZ3VtZW50cyBvbiB0b3Agb2Ygd2hhdCB3YXMgcHJvdmlkZWRcbiAgICpcbiAgICogQHBhcmFtIHtTaW1wbGVPcHRpb25zfSBvcHRzIFRoZSB1c2VyLXN1cHBsaWVkIG9wdHNcbiAgICogQHJldHVybiB7U2ltcGxlT3B0aW9uc30gVGhlIHVuaW9uIG9mIHRoZSB1c2VyLXN1cHBsaWVkIG9wdHMgYW5kIHRoZSBkZWZhdWx0IG9uZXNcbiAgICovXG4gIGFzeW5jICNhcHBseU9wdGlvbnM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFByb21pc2U8U2ltcGxlT3B0aW9uczxUPj4ge1xuICAgIGNvbnN0IHBhdGhQYXJhbXMgPSBcInBhdGhcIiBpbiAob3B0cy5wYXJhbXMgPz8ge30pID8gb3B0cy5wYXJhbXM/LnBhdGggOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgYmFzZVVybCA9IHRoaXMuZW52LlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNhY2hlOiBcIm5vLXN0b3JlXCIsXG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIGFjdGl2ZVNlc3Npb24sIGxldCBpdCBkaWN0YXRlIHRoZSBiYXNlVXJsLiBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBvbmUgc2V0IGF0IGNvbnN0cnVjdGlvblxuICAgICAgYmFzZVVybCxcbiAgICAgIC4uLm9wdHMsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiVXNlci1BZ2VudFwiOiBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgXCJYLUN1YmlzdC1Ucy1TZGtcIjogYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGF3YWl0IHRoaXMuI3Nlc3Npb25NYW5hZ2VyLnRva2VuKCksXG4gICAgICAgIC4uLm9wdHMuaGVhZGVycyxcbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgLi4ub3B0cy5wYXJhbXMsXG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHRoaXMuc2Vzc2lvbk1ldGEub3JnX2lkLFxuICAgICAgICAgIC4uLnBhdGhQYXJhbXMsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0gYXMgdW5rbm93biBhcyBTaW1wbGVPcHRpb25zPFQ+O1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIHNwZWNpZmljIGVycm9yIGV2ZW50cyB3aGVuIGEgcmVxdWVzdCBmYWlsZWRcbiAgICpcbiAgICogQHBhcmFtIHtFcnJvckV2ZW50fSBlcnIgVGhlIGVycm9yIHRvIGNsYXNzaWZ5XG4gICAqL1xuICBhc3luYyAjY2xhc3NpZnlBbmRFbWl0RXJyb3IoZXJyOiBFcnJvckV2ZW50KSB7XG4gICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcbiAgICBBTExfRVZFTlRTLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXG4gICAgaWYgKGVyci5pc1VzZXJNZmFFcnJvcigpKSB7XG4gICAgICB0aGlzLmVtaXQoXCJ1c2VyLW1mYS1mYWlsZWRcIiwgZXJyKTtcbiAgICAgIEFMTF9FVkVOVFMuZW1pdChcInVzZXItbWZhLWZhaWxlZFwiLCBlcnIpO1xuICAgIH1cblxuICAgIC8vIGlmIHN0YXR1cyBpcyA0MDMgYW5kIGVycm9yIG1hdGNoZXMgb25lIG9mIHRoZSBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIGNvZGVzIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZFxuICAgIC8vXG4gICAgLy8gVE9ETzogYmVjYXVzZSBlcnJvcnMgcmV0dXJuZWQgYnkgdGhlIGF1dGhvcml6ZXIgbGFtYmRhIGFyZSBub3QgZm9yd2FyZGVkIHRvIHRoZSBjbGllbnRcbiAgICAvLyAgICAgICB3ZSBhbHNvIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZCB3aGVuIFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiBmYWlsc1xuICAgIGlmIChcbiAgICAgIGVyci5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKGVyci5pc1Nlc3Npb25FeHBpcmVkRXJyb3IoKSB8fCBlcnIub3BlcmF0aW9uID09IFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIilcbiAgICApIHtcbiAgICAgIHRoaXMuZW1pdChcInNlc3Npb24tZXhwaXJlZFwiLCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KFwidXNlci1tZmEtZmFpbGVkXCIsIGVycik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGFuIG9wIHVzaW5nIHRoZSBzdGF0ZSBvZiB0aGUgY2xpZW50IChhdXRoIGhlYWRlcnMgJiBvcmdfaWQpIHdpdGggcmV0cmllc1xuICAgKlxuICAgKiBAcGFyYW0ge09wPFQ+fSBvcCBUaGUgQVBJIG9wZXJhdGlvbiB5b3Ugd2lzaCB0byBwZXJmb3JtXG4gICAqIEBwYXJhbSB7U2ltcGxlT3B0aW9uczxUPn0gb3B0cyBUaGUgcGFyYW1ldGVycyBmb3IgdGhlIG9wZXJhdGlvblxuICAgKiBAcmV0dXJuIHtGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD59IEEgcHJvbWlzZSBmb3IgdGhlIHN1Y2Nlc3NmdWwgcmVzdWx0IChlcnJvcnMgd2lsbCBiZSB0aHJvd24pXG4gICAqL1xuICBleGVjPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIG9wOiBPcDxUPixcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogUHJvbWlzZTxGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD4+IHtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PiB0aGlzLiNhcHBseU9wdGlvbnMob3B0cykudGhlbihvcCkpXG4gICAgICAudGhlbihhc3NlcnRPaykgLy8gT25jZSB3ZSBoYXZlIGEgbm9uLTVYWCByZXNwb25zZSwgd2Ugd2lsbCBhc3NlcnRPayAoZWl0aGVyIHRocm93aW5nIG9yIHlpZWxkaW5nIHRoZSByZXBvbnNlKVxuICAgICAgLmNhdGNoKGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyUmVzcG9uc2UpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLiNjbGFzc2lmeUFuZEVtaXRFcnJvcihlKTsgLy8gRW1pdCBhcHByb3ByaWF0ZSBldmVudHNcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlOyAvLyBSZXRocm93IHRoZSBlcnJvclxuICAgICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGdyYWRlIGEgc2Vzc2lvbiByZXNwb25zZSBpbnRvIGEgZnVsbCBTZXNzaW9uRGF0YSBieSBpbmNvcnBvcmF0aW5nXG4gKiBlbGVtZW50cyBvZiBhbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICogQHBhcmFtIHtTZXNzaW9uRGF0YX0gbWV0YSBBbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICogQHBhcmFtIHtOZXdTZXNzaW9uUmVzcG9uc2V9IGluZm8gQSBuZXcgc2Vzc2lvbiBjcmVhdGVkIHZpYSB0aGUgQVBJXG4gKiBAcGFyYW0ge29iamVjdH0gY3R4IEFkZGl0aW9uYWwgbWFudWFsIG92ZXJyaWRlc1xuICogQHJldHVybiB7U2Vzc2lvbkRhdGF9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKFxuICBtZXRhOiBTZXNzaW9uTWV0YWRhdGEsXG4gIGluZm86IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgY3R4OiBQYXJ0aWFsPHsgcHVycG9zZTogc3RyaW5nOyByb2xlX2lkOiBzdHJpbmcgfT4sXG4pOiBTZXNzaW9uRGF0YSB7XG4gIHJldHVybiB7XG4gICAgZW52OiBtZXRhLmVudixcbiAgICBvcmdfaWQ6IG1ldGEub3JnX2lkLFxuICAgIHNlc3Npb25fZXhwOiBpbmZvLmV4cGlyYXRpb24sXG4gICAgc2Vzc2lvbl9pbmZvOiBpbmZvLnNlc3Npb25faW5mbyxcbiAgICB0b2tlbjogaW5mby50b2tlbixcbiAgICBwdXJwb3NlOiBtZXRhLnB1cnBvc2UsXG4gICAgcm9sZV9pZDogbWV0YS5yb2xlX2lkLFxuICAgIC4uLmN0eCxcbiAgfTtcbn1cblxudHlwZSBEZWVwT21pdDxBLCBCPiA9IFtBLCBCXSBleHRlbmRzIFtvYmplY3QsIG9iamVjdF1cbiAgPyB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCIC8vIElmIHRoZSBrZXkgaXMgaW4gYm90aCBBIGFuZCBCXG4gICAgICAgID8gQVtLXSBleHRlbmRzIEJbS11cbiAgICAgICAgICA/IEsgLy9cbiAgICAgICAgICA6IG5ldmVyXG4gICAgICAgIDogbmV2ZXJdPzogSyBleHRlbmRzIGtleW9mIEIgPyBEZWVwT21pdDxBW0tdLCBCW0tdPiA6IG5ldmVyO1xuICAgIH0gJiB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCID8gKEJbS10gZXh0ZW5kcyBBW0tdID8gbmV2ZXIgOiBLKSA6IEtdOiBLIGV4dGVuZHMga2V5b2YgQlxuICAgICAgICA/IERlZXBPbWl0PEFbS10sIEJbS10+XG4gICAgICAgIDogQVtLXTtcbiAgICB9XG4gIDogQTtcblxuZXhwb3J0IHR5cGUgT21pdEF1dG9QYXJhbXM8Tz4gPSBEZWVwT21pdDxcbiAgTyxcbiAge1xuICAgIGJhc2VVcmw6IHN0cmluZztcbiAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHN0cmluZyB9IH07XG4gIH1cbj4gJiB7IHBhcmFtcz86IHsgcGF0aD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0gfTtcbiJdfQ==