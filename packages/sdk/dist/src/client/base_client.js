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
     * @returns A Client
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
     * @param sessionMeta The initial session metadata
     * @param manager The manager for the current session
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
    /** @returns The organization ID */
    get orgId() {
        return this.sessionMeta.org_id;
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
            let token = await __classPrivateFieldGet(this, _BaseClient_sessionManager, "f").token();
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
                        __classPrivateFieldGet(this, _BaseClient_sessionManager, "f").onInvalidToken !== undefined) {
                        __classPrivateFieldGet(this, _BaseClient_sessionManager, "f").onInvalidToken();
                        const oldToken = token;
                        token = await __classPrivateFieldGet(this, _BaseClient_sessionManager, "f").token();
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
_BaseClient_sessionManager = new WeakMap(), _BaseClient_instances = new WeakSet(), _BaseClient_applyOptions = function _BaseClient_applyOptions(token, opts) {
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
                org_id: this.sessionMeta.org_id,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtPQSxvRUFnQkM7QUFsUEQsc0VBQXFDO0FBRXJDLG9DQUFvQztBQUNwQyxvQ0FBaUM7QUFDakMsc0NBQXlDO0FBQ3pDLG9DQUF1QztBQUV2Qyx1Q0FBbUY7QUFJbkYsa0NBQWtDO0FBQ3JCLFFBQUEsSUFBSSxHQUFXLHNCQUFHLENBQUMsSUFBSSxDQUFDO0FBRXJDLDZCQUE2QjtBQUNoQixRQUFBLE9BQU8sR0FBVyxzQkFBRyxDQUFDLE9BQU8sQ0FBQztBQUkzQywrRUFBK0U7QUFDL0UsTUFBYSxtQkFBbUI7Q0FBRztBQUFuQyxrREFBbUM7QUFFbkMsd0ZBQXdGO0FBQ3hGLE1BQWEsa0JBQW1CLFNBQVEsbUJBQVc7Q0FBRztBQUF0RCxnREFBc0Q7QUFZdEQ7Ozs7R0FJRztBQUNVLFFBQUEsVUFBVSxHQUErQixJQUFJLHFCQUFZLEVBQUUsQ0FBQztBQUV6RTs7R0FFRztBQUNILE1BQWEsVUFBVyxTQUFRLHFCQUEwQjtJQWF4RCx1QkFBdUI7SUFDdkIsSUFBSSxHQUFHO1FBQ0wsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FFakIsT0FBOEM7UUFFOUMsTUFBTSxVQUFVLEdBQ2QsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLGdDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFFMUUsSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDM0MsTUFBTSxPQUFPLEdBQUcsVUFBNEIsQ0FBQztZQUM3QyxP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RSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLGtCQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQsdUdBQXVHO0lBQ3ZHLEVBQUU7SUFDRix5RkFBeUY7SUFDekYsMkVBQTJFO0lBQzNFLElBQ0UsR0FBRyxDQUFDLE1BQU0sS0FBSyxHQUFHO1FBQ2xCLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLElBQUksR0FBRyxDQUFDLFNBQVMsSUFBSSxzQkFBc0IsQ0FBQyxFQUN4RSxDQUFDO1FBQ0QsTUFBTSxFQUFFLEdBQUcsaUJBQWlCLENBQUM7UUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbkIsa0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUM7QUFDSCxDQUFDO0FBb0RIOzs7Ozs7OztHQVFHO0FBQ0gsU0FBZ0IsNEJBQTRCLENBQzFDLElBQXFCLEVBQ3JCLElBQXdCLEVBQ3hCLEdBQWtEO0lBRWxELE9BQU87UUFDTCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7UUFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDbkIsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVO1FBQzVCLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtRQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7UUFDakIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1FBQ2pDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87UUFDckIsR0FBRyxHQUFHO0tBQ1AsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGtnIGZyb20gXCIuLi8uLi9wYWNrYWdlLmpzb25cIjtcbmltcG9ydCB0eXBlIHsgRmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhLCBPcCwgT3BlcmF0aW9uLCBTaW1wbGVPcHRpb25zIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyBhc3NlcnRPayB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgcmV0cnkgfSBmcm9tIFwiLi4vcmV0cnlcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IEVyclJlc3BvbnNlIH0gZnJvbSBcIi4uL2Vycm9yXCI7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb25EYXRhLCBTZXNzaW9uTWFuYWdlciwgU2Vzc2lvbk1ldGFkYXRhIH0gZnJvbSBcIi4vc2Vzc2lvblwiO1xuaW1wb3J0IHsgTWVtb3J5U2Vzc2lvbk1hbmFnZXIsIG1ldGFkYXRhLCBwYXJzZUJhc2U2NFNlc3Npb25EYXRhIH0gZnJvbSBcIi4vc2Vzc2lvblwiO1xuaW1wb3J0IHR5cGUgeyBOZXdTZXNzaW9uUmVzcG9uc2UsIEVycm9yUmVzcG9uc2UgfSBmcm9tIFwiLi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHBhY2thZ2UgbmFtZSAqL1xuZXhwb3J0IGNvbnN0IE5BTUU6IHN0cmluZyA9IHBrZy5uYW1lO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgdmVyc2lvbiAqL1xuZXhwb3J0IGNvbnN0IFZFUlNJT046IHN0cmluZyA9IHBrZy52ZXJzaW9uO1xuXG5leHBvcnQgdHlwZSBFcnJvckV2ZW50ID0gRXJyUmVzcG9uc2U7XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGJlY2F1c2Ugb2YgYW4gZXhwaXJlZC9pbnZhbGlkIHNlc3Npb24gKi9cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEV2ZW50IHt9XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGJlY2F1c2UgdXNlciBmYWlsZWQgdG8gYW5zd2VyIGFuIE1GQSBjaGFsbGVuZ2UgKi9cbmV4cG9ydCBjbGFzcyBVc2VyTWZhRmFpbGVkRXZlbnQgZXh0ZW5kcyBFcnJSZXNwb25zZSB7fVxuXG50eXBlIENsaWVudEV2ZW50cyA9IHtcbiAgXCJ1c2VyLW1mYS1mYWlsZWRcIjogKGV2OiBVc2VyTWZhRmFpbGVkRXZlbnQpID0+IHZvaWQ7XG4gIFwic2Vzc2lvbi1leHBpcmVkXCI6IChldjogU2Vzc2lvbkV4cGlyZWRFdmVudCkgPT4gdm9pZDtcbiAgZXJyb3I6IChldjogRXJyb3JFdmVudCkgPT4gdm9pZDtcbn07XG5cbnR5cGUgU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4gPSB7XG4gIG5ldyAoLi4uYXJnczogQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBCYXNlQ2xpZW50Pik6IFQ7XG59ICYgdHlwZW9mIEJhc2VDbGllbnQ7XG5cbi8qKlxuICogQW4gZXZlbnQgZW1pdHRlciBmb3IgYWxsIGNsaWVudHNcbiAqXG4gKiBAZGVwcmVjYXRlZFxuICovXG5leHBvcnQgY29uc3QgQUxMX0VWRU5UUzogRXZlbnRFbWl0dGVyPENsaWVudEV2ZW50cz4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIHJldHJ5IHN0cmF0ZWd5IGFuZCBzZXNzaW9uIHJlZnJlc2hlc1xuICovXG5leHBvcnQgY2xhc3MgQmFzZUNsaWVudCBleHRlbmRzIEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+IHtcbiAgLyoqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBzZXNzaW9uIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNsaWVudCAqL1xuICBzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhO1xuXG4gIC8qKiBTZXNzaW9uIHBlcnNpc3RlbmNlICovXG4gICNzZXNzaW9uTWFuYWdlcjogU2Vzc2lvbk1hbmFnZXI7XG5cbiAgLyoqIE1VVEFCTEUgY29uZmlndXJhdGlvbiAqL1xuICBjb25maWc6IHsgdXBkYXRlUmV0cnlEZWxheXNNczogbnVtYmVyW10gfSA9IHtcbiAgICAvKiogVXBkYXRlIHJldHJ5IGRlbGF5cyAqL1xuICAgIHVwZGF0ZVJldHJ5RGVsYXlzTXM6IFsxMDAsIDIwMCwgNDAwXSxcbiAgfTtcblxuICAvKiogQHJldHVybnMgVGhlIGVudiAqL1xuICBnZXQgZW52KCk6IEVudkludGVyZmFjZSB7XG4gICAgcmV0dXJuIHRoaXMuc2Vzc2lvbk1ldGEuZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBjbGllbnQgd2l0aCBhIHNlc3Npb24gb3Igc2Vzc2lvbiBtYW5hZ2VyXG4gICAqXG4gICAqIEBwYXJhbSB0aGlzIEFsbG93cyB0aGlzIHN0YXRpYyBtZXRob2QgdG8gcmV0dXJuIHN1YnR5cGVzIHdoZW4gaW52b2tlZCB0aHJvdWdoIHRoZW1cbiAgICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gKG9iamVjdCBvciBiYXNlNjQgc3RyaW5nKSBvciBtYW5hZ2VyIHRoYXQgd2lsbCBiYWNrIHRoaXMgY2xpZW50XG4gICAqIEByZXR1cm5zIEEgQ2xpZW50XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlPFQ+KFxuICAgIHRoaXM6IFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+LFxuICAgIHNlc3Npb246IHN0cmluZyB8IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEsXG4gICk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IHNlc3Npb25PYmo6IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEgPVxuICAgICAgdHlwZW9mIHNlc3Npb24gPT09IFwic3RyaW5nXCIgPyBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb24pIDogc2Vzc2lvbjtcblxuICAgIGlmICh0eXBlb2Ygc2Vzc2lvbk9iai50b2tlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zdCBtYW5hZ2VyID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uTWFuYWdlcjtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhhd2FpdCBtYW5hZ2VyLm1ldGFkYXRhKCksIG1hbmFnZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXNzaW9uID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uRGF0YTtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhtZXRhZGF0YShzZXNzaW9uKSwgbmV3IE1lbW9yeVNlc3Npb25NYW5hZ2VyKHNlc3Npb24pKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHNlc3Npb25NZXRhIFRoZSBpbml0aWFsIHNlc3Npb24gbWV0YWRhdGFcbiAgICogQHBhcmFtIG1hbmFnZXIgVGhlIG1hbmFnZXIgZm9yIHRoZSBjdXJyZW50IHNlc3Npb25cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhLCBtYW5hZ2VyOiBTZXNzaW9uTWFuYWdlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jc2Vzc2lvbk1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuc2Vzc2lvbk1ldGEgPSBzZXNzaW9uTWV0YTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgb3JnYW5pemF0aW9uIElEICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgdGhlIHNlc3Npb24ncyBpbXBsaWNpdCBhcmd1bWVudHMgb24gdG9wIG9mIHdoYXQgd2FzIHByb3ZpZGVkXG4gICAqXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgYXV0aG9yaXphdGlvbiB0b2tlbiB0byB1c2UgZm9yIHRoZSByZXF1ZXN0XG4gICAqIEBwYXJhbSBvcHRzIFRoZSB1c2VyLXN1cHBsaWVkIG9wdHNcbiAgICogQHJldHVybnMgVGhlIHVuaW9uIG9mIHRoZSB1c2VyLXN1cHBsaWVkIG9wdHMgYW5kIHRoZSBkZWZhdWx0IG9uZXNcbiAgICovXG4gICNhcHBseU9wdGlvbnM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogU2ltcGxlT3B0aW9uczxUPiB7XG4gICAgY29uc3QgcGF0aFBhcmFtcyA9IFwicGF0aFwiIGluIChvcHRzLnBhcmFtcyA/PyB7fSkgPyBvcHRzLnBhcmFtcz8ucGF0aCA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBiYXNlVXJsID0gdGhpcy5lbnYuU2lnbmVyQXBpUm9vdC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gICAgY29uc3QgYnJvd3NlclVzZXJBZ2VudCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyBuYXZpZ2F0b3I/LnVzZXJBZ2VudCA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4ge1xuICAgICAgY2FjaGU6IFwibm8tc3RvcmVcIixcbiAgICAgIC8vIElmIHdlIGhhdmUgYW4gYWN0aXZlU2Vzc2lvbiwgbGV0IGl0IGRpY3RhdGUgdGhlIGJhc2VVcmwuIE90aGVyd2lzZSBmYWxsIGJhY2sgdG8gdGhlIG9uZSBzZXQgYXQgY29uc3RydWN0aW9uXG4gICAgICBiYXNlVXJsLFxuICAgICAgLi4ub3B0cyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6IGJyb3dzZXJVc2VyQWdlbnQgPz8gYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICAgIFwiWC1DdWJpc3QtVHMtU2RrXCI6IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgLi4ub3B0cy5oZWFkZXJzLFxuICAgICAgfSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICAuLi5vcHRzLnBhcmFtcyxcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIG9yZ19pZDogdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQsXG4gICAgICAgICAgLi4ucGF0aFBhcmFtcyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSBhcyB1bmtub3duIGFzIFNpbXBsZU9wdGlvbnM8VD47XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgc3BlY2lmaWMgZXJyb3IgZXZlbnRzIHdoZW4gYSByZXF1ZXN0IGZhaWxlZFxuICAgKlxuICAgKiBAcGFyYW0gZXJyIFRoZSBlcnJvciB0byBjbGFzc2lmeVxuICAgKi9cbiAgYXN5bmMgI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGVycjogRXJyb3JFdmVudCkge1xuICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGVycik7XG4gICAgQUxMX0VWRU5UUy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblxuICAgIGlmIChlcnIuaXNVc2VyTWZhRXJyb3IoKSkge1xuICAgICAgY29uc3QgZXYgPSBcInVzZXItbWZhLWZhaWxlZFwiO1xuICAgICAgdGhpcy5lbWl0KGV2LCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KGV2LCBlcnIpO1xuICAgIH1cblxuICAgIC8vIGlmIHN0YXR1cyBpcyA0MDMgYW5kIGVycm9yIG1hdGNoZXMgb25lIG9mIHRoZSBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIGNvZGVzIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZFxuICAgIC8vXG4gICAgLy8gVE9ETzogYmVjYXVzZSBlcnJvcnMgcmV0dXJuZWQgYnkgdGhlIGF1dGhvcml6ZXIgbGFtYmRhIGFyZSBub3QgZm9yd2FyZGVkIHRvIHRoZSBjbGllbnRcbiAgICAvLyAgICAgICB3ZSBhbHNvIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZCB3aGVuIFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiBmYWlsc1xuICAgIGlmIChcbiAgICAgIGVyci5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKGVyci5pc1Nlc3Npb25FeHBpcmVkRXJyb3IoKSB8fCBlcnIub3BlcmF0aW9uID09IFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIilcbiAgICApIHtcbiAgICAgIGNvbnN0IGV2ID0gXCJzZXNzaW9uLWV4cGlyZWRcIjtcbiAgICAgIHRoaXMuZW1pdChldiwgZXJyKTtcbiAgICAgIEFMTF9FVkVOVFMuZW1pdChldiwgZXJyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgYW4gb3AgdXNpbmcgdGhlIHN0YXRlIG9mIHRoZSBjbGllbnQgKGF1dGggaGVhZGVycyAmIG9yZ19pZCkgd2l0aCByZXRyaWVzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gb3AgVGhlIEFQSSBvcGVyYXRpb24geW91IHdpc2ggdG8gcGVyZm9ybVxuICAgKiBAcGFyYW0gb3B0cyBUaGUgcGFyYW1ldGVycyBmb3IgdGhlIG9wZXJhdGlvblxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIHRoZSBzdWNjZXNzZnVsIHJlc3VsdCAoZXJyb3JzIHdpbGwgYmUgdGhyb3duKVxuICAgKi9cbiAgYXN5bmMgZXhlYzxUIGV4dGVuZHMgT3BlcmF0aW9uPihcbiAgICBvcDogT3A8VD4sXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFByb21pc2U8RmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhPFQ+PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0b2tlbiA9IGF3YWl0IHRoaXMuI3Nlc3Npb25NYW5hZ2VyLnRva2VuKCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgcmV0cnkoKCkgPT4gb3AodGhpcy4jYXBwbHlPcHRpb25zKHRva2VuLCBvcHRzKSksIHtcbiAgICAgICAgcHJlZDogYXN5bmMgKHJlc3ApID0+IHtcbiAgICAgICAgICBjb25zdCBzdGF0dXMgPSByZXNwLnJlc3BvbnNlLnN0YXR1cztcbiAgICAgICAgICBjb25zdCBlcnJvciA9IHJlc3AuZXJyb3IgYXMgRXJyb3JSZXNwb25zZSB8IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCByZXF1ZXN0SWQgPSBlcnJvcj8ucmVxdWVzdF9pZDtcblxuICAgICAgICAgIC8vIElmIHdlIGdldCBhIFwiRm9yYmlkZGVuXCIgZXJyb3IsIGVyYXNlIHRoZSBjYWNoZWQgdG9rZW5cbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIFRPRE86IENoZWNrIGVycm9yIGNvZGVzIG9uY2Ugb3VyIEFQSSByZXR1cm5zIGVycm9yIGNvZGVzIGZvclxuICAgICAgICAgIC8vIGF1dGhvcml6YXRpb24gZmFpbHVyZXNcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBzdGF0dXMgPT09IDQwMyAmJlxuICAgICAgICAgICAgcmVxdWVzdElkID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHRoaXMuI3Nlc3Npb25NYW5hZ2VyLm9uSW52YWxpZFRva2VuICE9PSB1bmRlZmluZWRcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuI3Nlc3Npb25NYW5hZ2VyLm9uSW52YWxpZFRva2VuKCk7XG4gICAgICAgICAgICBjb25zdCBvbGRUb2tlbiA9IHRva2VuO1xuICAgICAgICAgICAgdG9rZW4gPSBhd2FpdCB0aGlzLiNzZXNzaW9uTWFuYWdlci50b2tlbigpO1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuICE9PSBvbGRUb2tlbjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBbHNvIHJldHJ5IHNlcnZlci1zaWRlIGVycm9yc1xuICAgICAgICAgIHJldHVybiBzdGF0dXMgPj0gNTAwICYmIHN0YXR1cyA8IDYwMDtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgLy8gT25jZSB3ZSBoYXZlIGEgbm9uLTVYWCByZXNwb25zZSwgd2Ugd2lsbCBhc3NlcnRPayAoZWl0aGVyIHRocm93aW5nIG9yIHlpZWxkaW5nIHRoZSByZXBvbnNlKVxuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyUmVzcG9uc2UpIHtcbiAgICAgICAgYXdhaXQgdGhpcy4jY2xhc3NpZnlBbmRFbWl0RXJyb3IoZSk7IC8vIEVtaXQgYXBwcm9wcmlhdGUgZXZlbnRzXG4gICAgICB9XG4gICAgICB0aHJvdyBlOyAvLyBSZXRocm93IHRoZSBlcnJvclxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZ3JhZGUgYSBzZXNzaW9uIHJlc3BvbnNlIGludG8gYSBmdWxsIFNlc3Npb25EYXRhIGJ5IGluY29ycG9yYXRpbmdcbiAqIGVsZW1lbnRzIG9mIGFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKlxuICogQHBhcmFtIG1ldGEgQW4gZXhpc3RpbmcgU2Vzc2lvbkRhdGFcbiAqIEBwYXJhbSBpbmZvIEEgbmV3IHNlc3Npb24gY3JlYXRlZCB2aWEgdGhlIEFQSVxuICogQHBhcmFtIGN0eCBBZGRpdGlvbmFsIG1hbnVhbCBvdmVycmlkZXNcbiAqIEByZXR1cm5zIFNlc3Npb25EYXRhIHdpdGggbmV3IGluZm9ybWF0aW9uIGZyb20gaW5mbyBhbmQgY3R4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKFxuICBtZXRhOiBTZXNzaW9uTWV0YWRhdGEsXG4gIGluZm86IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgY3R4OiBQYXJ0aWFsPHsgcHVycG9zZTogc3RyaW5nOyByb2xlX2lkOiBzdHJpbmcgfT4sXG4pOiBTZXNzaW9uRGF0YSB7XG4gIHJldHVybiB7XG4gICAgZW52OiBtZXRhLmVudixcbiAgICBvcmdfaWQ6IG1ldGEub3JnX2lkLFxuICAgIHNlc3Npb25fZXhwOiBpbmZvLmV4cGlyYXRpb24sXG4gICAgc2Vzc2lvbl9pbmZvOiBpbmZvLnNlc3Npb25faW5mbyxcbiAgICB0b2tlbjogaW5mby50b2tlbixcbiAgICByZWZyZXNoX3Rva2VuOiBpbmZvLnJlZnJlc2hfdG9rZW4sXG4gICAgcHVycG9zZTogbWV0YS5wdXJwb3NlLFxuICAgIHJvbGVfaWQ6IG1ldGEucm9sZV9pZCxcbiAgICAuLi5jdHgsXG4gIH07XG59XG5cbnR5cGUgRGVlcE9taXQ8QSwgQj4gPSBbQSwgQl0gZXh0ZW5kcyBbb2JqZWN0LCBvYmplY3RdXG4gID8ge1xuICAgICAgW0sgaW4ga2V5b2YgQSBhcyBLIGV4dGVuZHMga2V5b2YgQiAvLyBJZiB0aGUga2V5IGlzIGluIGJvdGggQSBhbmQgQlxuICAgICAgICA/IEFbS10gZXh0ZW5kcyBCW0tdXG4gICAgICAgICAgPyBLIC8vXG4gICAgICAgICAgOiBuZXZlclxuICAgICAgICA6IG5ldmVyXT86IEsgZXh0ZW5kcyBrZXlvZiBCID8gRGVlcE9taXQ8QVtLXSwgQltLXT4gOiBuZXZlcjtcbiAgICB9ICYge1xuICAgICAgW0sgaW4ga2V5b2YgQSBhcyBLIGV4dGVuZHMga2V5b2YgQiA/IChCW0tdIGV4dGVuZHMgQVtLXSA/IG5ldmVyIDogSykgOiBLXTogSyBleHRlbmRzIGtleW9mIEJcbiAgICAgICAgPyBEZWVwT21pdDxBW0tdLCBCW0tdPlxuICAgICAgICA6IEFbS107XG4gICAgfVxuICA6IEE7XG5cbmV4cG9ydCB0eXBlIE9taXRBdXRvUGFyYW1zPE8+ID0gRGVlcE9taXQ8XG4gIE8sXG4gIHtcbiAgICBiYXNlVXJsOiBzdHJpbmc7XG4gICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBzdHJpbmcgfSB9O1xuICB9XG4+ICYgeyBwYXJhbXM/OiB7IHBhdGg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB9IH07XG4iXX0=