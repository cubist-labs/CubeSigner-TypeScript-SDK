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
    return {
        cache: "no-store",
        // If we have an activeSession, let it dictate the baseUrl. Otherwise fall back to the one set at construction
        baseUrl,
        ...opts,
        headers: {
            "User-Agent": `${exports.NAME}@${exports.VERSION}`,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtPQSxvRUFnQkM7QUFsUEQsc0VBQXFDO0FBRXJDLG9DQUFvQztBQUNwQyxvQ0FBaUM7QUFDakMsc0NBQXlDO0FBQ3pDLG9DQUF1QztBQUV2Qyx1Q0FBbUY7QUFJbkYsa0NBQWtDO0FBQ3JCLFFBQUEsSUFBSSxHQUFXLHNCQUFHLENBQUMsSUFBSSxDQUFDO0FBRXJDLDZCQUE2QjtBQUNoQixRQUFBLE9BQU8sR0FBVyxzQkFBRyxDQUFDLE9BQU8sQ0FBQztBQUkzQywrRUFBK0U7QUFDL0UsTUFBYSxtQkFBbUI7Q0FBRztBQUFuQyxrREFBbUM7QUFFbkMsd0ZBQXdGO0FBQ3hGLE1BQWEsa0JBQW1CLFNBQVEsbUJBQVc7Q0FBRztBQUF0RCxnREFBc0Q7QUFZdEQ7Ozs7R0FJRztBQUNVLFFBQUEsVUFBVSxHQUErQixJQUFJLHFCQUFZLEVBQUUsQ0FBQztBQUV6RTs7R0FFRztBQUNILE1BQWEsVUFBVyxTQUFRLHFCQUEwQjtJQWF4RCx1QkFBdUI7SUFDdkIsSUFBSSxHQUFHO1FBQ0wsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FFakIsT0FBOEM7UUFFOUMsTUFBTSxVQUFVLEdBQ2QsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLGdDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFFMUUsSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDM0MsTUFBTSxPQUFPLEdBQUcsVUFBNEIsQ0FBQztZQUM3QyxP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Q0YseUZBQXlGO0lBQ3pGLDJFQUEyRTtJQUMzRSxJQUNFLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRztRQUNsQixDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLEdBQUcsQ0FBQyxTQUFTLElBQUksc0JBQXNCLENBQUMsRUFDeEUsQ0FBQztRQUNELE1BQU0sRUFBRSxHQUFHLGlCQUFpQixDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLGtCQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDO0FBQ0gsQ0FBQztBQW9ESDs7Ozs7Ozs7R0FRRztBQUNILFNBQWdCLDRCQUE0QixDQUMxQyxJQUFxQixFQUNyQixJQUF3QixFQUN4QixHQUFrRDtJQUVsRCxPQUFPO1FBQ0wsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO1FBQ2IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1FBQ25CLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVTtRQUM1QixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7UUFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1FBQ2pCLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtRQUNqQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87UUFDckIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1FBQ3JCLEdBQUcsR0FBRztLQUNQLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBrZyBmcm9tIFwiLi4vLi4vcGFja2FnZS5qc29uXCI7XG5pbXBvcnQgdHlwZSB7IEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YSwgT3AsIE9wZXJhdGlvbiwgU2ltcGxlT3B0aW9ucyB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IHJldHJ5IH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBFcnJSZXNwb25zZSB9IGZyb20gXCIuLi9lcnJvclwiO1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSwgU2Vzc2lvbk1hbmFnZXIsIFNlc3Npb25NZXRhZGF0YSB9IGZyb20gXCIuL3Nlc3Npb25cIjtcbmltcG9ydCB7IE1lbW9yeVNlc3Npb25NYW5hZ2VyLCBtZXRhZGF0YSwgcGFyc2VCYXNlNjRTZXNzaW9uRGF0YSB9IGZyb20gXCIuL3Nlc3Npb25cIjtcbmltcG9ydCB0eXBlIHsgTmV3U2Vzc2lvblJlc3BvbnNlLCBFcnJvclJlc3BvbnNlIH0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyBwYWNrYWdlIG5hbWUgKi9cbmV4cG9ydCBjb25zdCBOQU1FOiBzdHJpbmcgPSBwa2cubmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSBwa2cudmVyc2lvbjtcblxuZXhwb3J0IHR5cGUgRXJyb3JFdmVudCA9IEVyclJlc3BvbnNlO1xuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQvaW52YWxpZCBzZXNzaW9uICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFdmVudCB7fVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIHVzZXIgZmFpbGVkIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlICovXG5leHBvcnQgY2xhc3MgVXNlck1mYUZhaWxlZEV2ZW50IGV4dGVuZHMgRXJyUmVzcG9uc2Uge31cblxudHlwZSBDbGllbnRFdmVudHMgPSB7XG4gIFwidXNlci1tZmEtZmFpbGVkXCI6IChldjogVXNlck1mYUZhaWxlZEV2ZW50KSA9PiB2b2lkO1xuICBcInNlc3Npb24tZXhwaXJlZFwiOiAoZXY6IFNlc3Npb25FeHBpcmVkRXZlbnQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXY6IEVycm9yRXZlbnQpID0+IHZvaWQ7XG59O1xuXG50eXBlIFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+ID0ge1xuICBuZXcgKC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQmFzZUNsaWVudD4pOiBUO1xufSAmIHR5cGVvZiBCYXNlQ2xpZW50O1xuXG4vKipcbiAqIEFuIGV2ZW50IGVtaXR0ZXIgZm9yIGFsbCBjbGllbnRzXG4gKlxuICogQGRlcHJlY2F0ZWRcbiAqL1xuZXhwb3J0IGNvbnN0IEFMTF9FVkVOVFM6IEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSByZXRyeSBzdHJhdGVneSBhbmQgc2Vzc2lvbiByZWZyZXNoZXNcbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDbGllbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8Q2xpZW50RXZlbnRzPiB7XG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc2Vzc2lvbiBjb250YWluZWQgd2l0aGluIHRoZSBjbGllbnQgKi9cbiAgc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YTtcblxuICAvKiogU2Vzc2lvbiBwZXJzaXN0ZW5jZSAqL1xuICAjc2Vzc2lvbk1hbmFnZXI6IFNlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKiBNVVRBQkxFIGNvbmZpZ3VyYXRpb24gKi9cbiAgY29uZmlnOiB7IHVwZGF0ZVJldHJ5RGVsYXlzTXM6IG51bWJlcltdIH0gPSB7XG4gICAgLyoqIFVwZGF0ZSByZXRyeSBkZWxheXMgKi9cbiAgICB1cGRhdGVSZXRyeURlbGF5c01zOiBbMTAwLCAyMDAsIDQwMF0sXG4gIH07XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBlbnYgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25NZXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl07XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgY2xpZW50IHdpdGggYSBzZXNzaW9uIG9yIHNlc3Npb24gbWFuYWdlclxuICAgKlxuICAgKiBAcGFyYW0gdGhpcyBBbGxvd3MgdGhpcyBzdGF0aWMgbWV0aG9kIHRvIHJldHVybiBzdWJ0eXBlcyB3aGVuIGludm9rZWQgdGhyb3VnaCB0aGVtXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIChvYmplY3Qgb3IgYmFzZTY0IHN0cmluZykgb3IgbWFuYWdlciB0aGF0IHdpbGwgYmFjayB0aGlzIGNsaWVudFxuICAgKiBAcmV0dXJucyBBIENsaWVudFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxUPihcbiAgICB0aGlzOiBTdGF0aWNDbGllbnRTdWJjbGFzczxUPixcbiAgICBzZXNzaW9uOiBzdHJpbmcgfCBTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhLFxuICApOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBzZXNzaW9uT2JqOiBTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhID1cbiAgICAgIHR5cGVvZiBzZXNzaW9uID09PSBcInN0cmluZ1wiID8gcGFyc2VCYXNlNjRTZXNzaW9uRGF0YShzZXNzaW9uKSA6IHNlc3Npb247XG5cbiAgICBpZiAodHlwZW9mIHNlc3Npb25PYmoudG9rZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY29uc3QgbWFuYWdlciA9IHNlc3Npb25PYmogYXMgU2Vzc2lvbk1hbmFnZXI7XG4gICAgICByZXR1cm4gbmV3IHRoaXMoYXdhaXQgbWFuYWdlci5tZXRhZGF0YSgpLCBtYW5hZ2VyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2Vzc2lvbiA9IHNlc3Npb25PYmogYXMgU2Vzc2lvbkRhdGE7XG4gICAgICByZXR1cm4gbmV3IHRoaXMobWV0YWRhdGEoc2Vzc2lvbiksIG5ldyBNZW1vcnlTZXNzaW9uTWFuYWdlcihzZXNzaW9uKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBzZXNzaW9uTWV0YSBUaGUgaW5pdGlhbCBzZXNzaW9uIG1ldGFkYXRhXG4gICAqIEBwYXJhbSBtYW5hZ2VyIFRoZSBtYW5hZ2VyIGZvciB0aGUgY3VycmVudCBzZXNzaW9uXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YSwgbWFuYWdlcjogU2Vzc2lvbk1hbmFnZXIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI3Nlc3Npb25NYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNlc3Npb25NZXRhID0gc2Vzc2lvbk1ldGE7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IHRoZSBzZXNzaW9uJ3MgaW1wbGljaXQgYXJndW1lbnRzIG9uIHRvcCBvZiB3aGF0IHdhcyBwcm92aWRlZFxuICAgKlxuICAgKiBAcGFyYW0gdG9rZW4gVGhlIGF1dGhvcml6YXRpb24gdG9rZW4gdG8gdXNlIGZvciB0aGUgcmVxdWVzdFxuICAgKiBAcGFyYW0gb3B0cyBUaGUgdXNlci1zdXBwbGllZCBvcHRzXG4gICAqIEByZXR1cm5zIFRoZSB1bmlvbiBvZiB0aGUgdXNlci1zdXBwbGllZCBvcHRzIGFuZCB0aGUgZGVmYXVsdCBvbmVzXG4gICAqL1xuICAjYXBwbHlPcHRpb25zPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFNpbXBsZU9wdGlvbnM8VD4ge1xuICAgIGNvbnN0IHBhdGhQYXJhbXMgPSBcInBhdGhcIiBpbiAob3B0cy5wYXJhbXMgPz8ge30pID8gb3B0cy5wYXJhbXM/LnBhdGggOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgYmFzZVVybCA9IHRoaXMuZW52LlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNhY2hlOiBcIm5vLXN0b3JlXCIsXG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIGFjdGl2ZVNlc3Npb24sIGxldCBpdCBkaWN0YXRlIHRoZSBiYXNlVXJsLiBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBvbmUgc2V0IGF0IGNvbnN0cnVjdGlvblxuICAgICAgYmFzZVVybCxcbiAgICAgIC4uLm9wdHMsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiVXNlci1BZ2VudFwiOiBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgXCJYLUN1YmlzdC1Ucy1TZGtcIjogYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICAgIEF1dGhvcml6YXRpb246IHRva2VuLFxuICAgICAgICAuLi5vcHRzLmhlYWRlcnMsXG4gICAgICB9LFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIC4uLm9wdHMucGFyYW1zLFxuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgb3JnX2lkOiB0aGlzLnNlc3Npb25NZXRhLm9yZ19pZCxcbiAgICAgICAgICAuLi5wYXRoUGFyYW1zLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9IGFzIHVua25vd24gYXMgU2ltcGxlT3B0aW9uczxUPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBzcGVjaWZpYyBlcnJvciBldmVudHMgd2hlbiBhIHJlcXVlc3QgZmFpbGVkXG4gICAqXG4gICAqIEBwYXJhbSBlcnIgVGhlIGVycm9yIHRvIGNsYXNzaWZ5XG4gICAqL1xuICBhc3luYyAjY2xhc3NpZnlBbmRFbWl0RXJyb3IoZXJyOiBFcnJvckV2ZW50KSB7XG4gICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcbiAgICBBTExfRVZFTlRTLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXG4gICAgaWYgKGVyci5pc1VzZXJNZmFFcnJvcigpKSB7XG4gICAgICBjb25zdCBldiA9IFwidXNlci1tZmEtZmFpbGVkXCI7XG4gICAgICB0aGlzLmVtaXQoZXYsIGVycik7XG4gICAgICBBTExfRVZFTlRTLmVtaXQoZXYsIGVycik7XG4gICAgfVxuXG4gICAgLy8gaWYgc3RhdHVzIGlzIDQwMyBhbmQgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlIFwiaW52YWxpZCBzZXNzaW9uXCIgZXJyb3IgY29kZXMgdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkXG4gICAgLy9cbiAgICAvLyBUT0RPOiBiZWNhdXNlIGVycm9ycyByZXR1cm5lZCBieSB0aGUgYXV0aG9yaXplciBsYW1iZGEgYXJlIG5vdCBmb3J3YXJkZWQgdG8gdGhlIGNsaWVudFxuICAgIC8vICAgICAgIHdlIGFsc28gdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkIHdoZW4gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiIGZhaWxzXG4gICAgaWYgKFxuICAgICAgZXJyLnN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAoZXJyLmlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpIHx8IGVyci5vcGVyYXRpb24gPT0gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiKVxuICAgICkge1xuICAgICAgY29uc3QgZXYgPSBcInNlc3Npb24tZXhwaXJlZFwiO1xuICAgICAgdGhpcy5lbWl0KGV2LCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KGV2LCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBhbiBvcCB1c2luZyB0aGUgc3RhdGUgb2YgdGhlIGNsaWVudCAoYXV0aCBoZWFkZXJzICYgb3JnX2lkKSB3aXRoIHJldHJpZXNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBvcCBUaGUgQVBJIG9wZXJhdGlvbiB5b3Ugd2lzaCB0byBwZXJmb3JtXG4gICAqIEBwYXJhbSBvcHRzIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgb3BlcmF0aW9uXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgdGhlIHN1Y2Nlc3NmdWwgcmVzdWx0IChlcnJvcnMgd2lsbCBiZSB0aHJvd24pXG4gICAqL1xuICBhc3luYyBleGVjPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIG9wOiBPcDxUPixcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogUHJvbWlzZTxGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD4+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHRva2VuID0gYXdhaXQgdGhpcy4jc2Vzc2lvbk1hbmFnZXIudG9rZW4oKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXRyeSgoKSA9PiBvcCh0aGlzLiNhcHBseU9wdGlvbnModG9rZW4sIG9wdHMpKSwge1xuICAgICAgICBwcmVkOiBhc3luYyAocmVzcCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3AucmVzcG9uc2Uuc3RhdHVzO1xuICAgICAgICAgIGNvbnN0IGVycm9yID0gcmVzcC5lcnJvciBhcyBFcnJvclJlc3BvbnNlIHwgdW5kZWZpbmVkO1xuICAgICAgICAgIGNvbnN0IHJlcXVlc3RJZCA9IGVycm9yPy5yZXF1ZXN0X2lkO1xuXG4gICAgICAgICAgLy8gSWYgd2UgZ2V0IGEgXCJGb3JiaWRkZW5cIiBlcnJvciwgZXJhc2UgdGhlIGNhY2hlZCB0b2tlblxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gVE9ETzogQ2hlY2sgZXJyb3IgY29kZXMgb25jZSBvdXIgQVBJIHJldHVybnMgZXJyb3IgY29kZXMgZm9yXG4gICAgICAgICAgLy8gYXV0aG9yaXphdGlvbiBmYWlsdXJlc1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAgICAgICByZXF1ZXN0SWQgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgdGhpcy4jc2Vzc2lvbk1hbmFnZXIub25JbnZhbGlkVG9rZW4gIT09IHVuZGVmaW5lZFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy4jc2Vzc2lvbk1hbmFnZXIub25JbnZhbGlkVG9rZW4oKTtcbiAgICAgICAgICAgIGNvbnN0IG9sZFRva2VuID0gdG9rZW47XG4gICAgICAgICAgICB0b2tlbiA9IGF3YWl0IHRoaXMuI3Nlc3Npb25NYW5hZ2VyLnRva2VuKCk7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW4gIT09IG9sZFRva2VuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFsc28gcmV0cnkgc2VydmVyLXNpZGUgZXJyb3JzXG4gICAgICAgICAgcmV0dXJuIHN0YXR1cyA+PSA1MDAgJiYgc3RhdHVzIDwgNjAwO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICAvLyBPbmNlIHdlIGhhdmUgYSBub24tNVhYIHJlc3BvbnNlLCB3ZSB3aWxsIGFzc2VydE9rIChlaXRoZXIgdGhyb3dpbmcgb3IgeWllbGRpbmcgdGhlIHJlcG9uc2UpXG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJSZXNwb25zZSkge1xuICAgICAgICBhd2FpdCB0aGlzLiNjbGFzc2lmeUFuZEVtaXRFcnJvcihlKTsgLy8gRW1pdCBhcHByb3ByaWF0ZSBldmVudHNcbiAgICAgIH1cbiAgICAgIHRocm93IGU7IC8vIFJldGhyb3cgdGhlIGVycm9yXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBncmFkZSBhIHNlc3Npb24gcmVzcG9uc2UgaW50byBhIGZ1bGwgU2Vzc2lvbkRhdGEgYnkgaW5jb3Jwb3JhdGluZ1xuICogZWxlbWVudHMgb2YgYW4gZXhpc3RpbmcgU2Vzc2lvbkRhdGFcbiAqXG4gKiBAcGFyYW0gbWV0YSBBbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICogQHBhcmFtIGluZm8gQSBuZXcgc2Vzc2lvbiBjcmVhdGVkIHZpYSB0aGUgQVBJXG4gKiBAcGFyYW0gY3R4IEFkZGl0aW9uYWwgbWFudWFsIG92ZXJyaWRlc1xuICogQHJldHVybnMgU2Vzc2lvbkRhdGEgd2l0aCBuZXcgaW5mb3JtYXRpb24gZnJvbSBpbmZvIGFuZCBjdHhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8oXG4gIG1ldGE6IFNlc3Npb25NZXRhZGF0YSxcbiAgaW5mbzogTmV3U2Vzc2lvblJlc3BvbnNlLFxuICBjdHg6IFBhcnRpYWw8eyBwdXJwb3NlOiBzdHJpbmc7IHJvbGVfaWQ6IHN0cmluZyB9Pixcbik6IFNlc3Npb25EYXRhIHtcbiAgcmV0dXJuIHtcbiAgICBlbnY6IG1ldGEuZW52LFxuICAgIG9yZ19pZDogbWV0YS5vcmdfaWQsXG4gICAgc2Vzc2lvbl9leHA6IGluZm8uZXhwaXJhdGlvbixcbiAgICBzZXNzaW9uX2luZm86IGluZm8uc2Vzc2lvbl9pbmZvLFxuICAgIHRva2VuOiBpbmZvLnRva2VuLFxuICAgIHJlZnJlc2hfdG9rZW46IGluZm8ucmVmcmVzaF90b2tlbixcbiAgICBwdXJwb3NlOiBtZXRhLnB1cnBvc2UsXG4gICAgcm9sZV9pZDogbWV0YS5yb2xlX2lkLFxuICAgIC4uLmN0eCxcbiAgfTtcbn1cblxudHlwZSBEZWVwT21pdDxBLCBCPiA9IFtBLCBCXSBleHRlbmRzIFtvYmplY3QsIG9iamVjdF1cbiAgPyB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCIC8vIElmIHRoZSBrZXkgaXMgaW4gYm90aCBBIGFuZCBCXG4gICAgICAgID8gQVtLXSBleHRlbmRzIEJbS11cbiAgICAgICAgICA/IEsgLy9cbiAgICAgICAgICA6IG5ldmVyXG4gICAgICAgIDogbmV2ZXJdPzogSyBleHRlbmRzIGtleW9mIEIgPyBEZWVwT21pdDxBW0tdLCBCW0tdPiA6IG5ldmVyO1xuICAgIH0gJiB7XG4gICAgICBbSyBpbiBrZXlvZiBBIGFzIEsgZXh0ZW5kcyBrZXlvZiBCID8gKEJbS10gZXh0ZW5kcyBBW0tdID8gbmV2ZXIgOiBLKSA6IEtdOiBLIGV4dGVuZHMga2V5b2YgQlxuICAgICAgICA/IERlZXBPbWl0PEFbS10sIEJbS10+XG4gICAgICAgIDogQVtLXTtcbiAgICB9XG4gIDogQTtcblxuZXhwb3J0IHR5cGUgT21pdEF1dG9QYXJhbXM8Tz4gPSBEZWVwT21pdDxcbiAgTyxcbiAge1xuICAgIGJhc2VVcmw6IHN0cmluZztcbiAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHN0cmluZyB9IH07XG4gIH1cbj4gJiB7IHBhcmFtcz86IHsgcGF0aD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0gfTtcbiJdfQ==