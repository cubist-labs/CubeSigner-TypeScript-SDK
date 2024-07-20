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
exports.signerSessionFromSessionInfo = exports.BaseClient = exports.ALL_EVENTS = exports.UserMfaFailedEvent = exports.SessionExpiredEvent = exports.VERSION = exports.NAME = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNFQUFxQztBQUVyQyxvQ0FBb0M7QUFDcEMsb0NBQXNDO0FBQ3RDLHNDQUF5QztBQUN6QyxvQ0FBdUM7QUFFdkMsdUNBQW1GO0FBSW5GLGtDQUFrQztBQUNyQixRQUFBLElBQUksR0FBVyxzQkFBRyxDQUFDLElBQUksQ0FBQztBQUVyQyw2QkFBNkI7QUFDaEIsUUFBQSxPQUFPLEdBQVcsc0JBQUcsQ0FBQyxPQUFPLENBQUM7QUFJM0MsK0VBQStFO0FBQy9FLE1BQWEsbUJBQW1CO0NBQUc7QUFBbkMsa0RBQW1DO0FBRW5DLHdGQUF3RjtBQUN4RixNQUFhLGtCQUFtQixTQUFRLG1CQUFXO0NBQUc7QUFBdEQsZ0RBQXNEO0FBWXREOzs7R0FHRztBQUNVLFFBQUEsVUFBVSxHQUErQixJQUFJLHFCQUFZLEVBQUUsQ0FBQztBQUV6RTs7R0FFRztBQUNILE1BQWEsVUFBVyxTQUFRLHFCQUEwQjtJQWF4RCxrQkFBa0I7SUFDbEIsSUFBSSxHQUFHO1FBQ0wsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUVqQixPQUE4QztRQUU5QyxNQUFNLFVBQVUsR0FDZCxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsZ0NBQXNCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUUxRSxJQUFJLE9BQU8sVUFBVSxDQUFDLEtBQUssS0FBSyxVQUFVLEVBQUU7WUFDMUMsTUFBTSxPQUFPLEdBQUcsVUFBNEIsQ0FBQztZQUM3QyxPQUFPLElBQUksSUFBSSxDQUFDLE1B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Y0FBYyxFQUFFLEVBQUU7UUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUN6QztJQUVELHVHQUF1RztJQUN2RyxFQUFFO0lBQ0YseUZBQXlGO0lBQ3pGLDJFQUEyRTtJQUMzRSxJQUNFLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRztRQUNsQixDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLEdBQUcsQ0FBQyxTQUFTLElBQUksc0JBQXNCLENBQUMsRUFDeEU7UUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLGtCQUFVLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ3pDO0FBQ0gsQ0FBQztBQXlCSDs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsNEJBQTRCLENBQzFDLElBQXFCLEVBQ3JCLElBQXdCLEVBQ3hCLEdBQWtEO0lBRWxELE9BQU87UUFDTCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7UUFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDbkIsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVO1FBQzVCLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtRQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7UUFDakIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1FBQ2pDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87UUFDckIsR0FBRyxHQUFHO0tBQ1AsQ0FBQztBQUNKLENBQUM7QUFoQkQsb0VBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBrZyBmcm9tIFwiLi4vLi4vcGFja2FnZS5qc29uXCI7XG5pbXBvcnQgdHlwZSB7IEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YSwgT3AsIE9wZXJhdGlvbiwgU2ltcGxlT3B0aW9ucyB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IHJldHJ5T241WFggfSBmcm9tIFwiLi4vcmV0cnlcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IEVyclJlc3BvbnNlIH0gZnJvbSBcIi4uL2Vycm9yXCI7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb25EYXRhLCBTZXNzaW9uTWFuYWdlciwgU2Vzc2lvbk1ldGFkYXRhIH0gZnJvbSBcIi4vc2Vzc2lvblwiO1xuaW1wb3J0IHsgTWVtb3J5U2Vzc2lvbk1hbmFnZXIsIG1ldGFkYXRhLCBwYXJzZUJhc2U2NFNlc3Npb25EYXRhIH0gZnJvbSBcIi4vc2Vzc2lvblwiO1xuaW1wb3J0IHR5cGUgeyBOZXdTZXNzaW9uUmVzcG9uc2UgfSBmcm9tIFwiLi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHBhY2thZ2UgbmFtZSAqL1xuZXhwb3J0IGNvbnN0IE5BTUU6IHN0cmluZyA9IHBrZy5uYW1lO1xuXG4vKiogQ3ViZVNpZ25lciBTREsgdmVyc2lvbiAqL1xuZXhwb3J0IGNvbnN0IFZFUlNJT046IHN0cmluZyA9IHBrZy52ZXJzaW9uO1xuXG5leHBvcnQgdHlwZSBFcnJvckV2ZW50ID0gRXJyUmVzcG9uc2U7XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGJlY2F1c2Ugb2YgYW4gZXhwaXJlZC9pbnZhbGlkIHNlc3Npb24gKi9cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEV2ZW50IHt9XG5cbi8qKiBFdmVudCBlbWl0dGVkIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGJlY2F1c2UgdXNlciBmYWlsZWQgdG8gYW5zd2VyIGFuIE1GQSBjaGFsbGVuZ2UgKi9cbmV4cG9ydCBjbGFzcyBVc2VyTWZhRmFpbGVkRXZlbnQgZXh0ZW5kcyBFcnJSZXNwb25zZSB7fVxuXG50eXBlIENsaWVudEV2ZW50cyA9IHtcbiAgXCJ1c2VyLW1mYS1mYWlsZWRcIjogKGV2OiBVc2VyTWZhRmFpbGVkRXZlbnQpID0+IHZvaWQ7XG4gIFwic2Vzc2lvbi1leHBpcmVkXCI6IChldjogU2Vzc2lvbkV4cGlyZWRFdmVudCkgPT4gdm9pZDtcbiAgZXJyb3I6IChldjogRXJyb3JFdmVudCkgPT4gdm9pZDtcbn07XG5cbnR5cGUgU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4gPSB7XG4gIG5ldyAoLi4uYXJnczogQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBCYXNlQ2xpZW50Pik6IFQ7XG59ICYgdHlwZW9mIEJhc2VDbGllbnQ7XG5cbi8qKlxuICogQW4gZXZlbnQgZW1pdHRlciBmb3IgYWxsIGNsaWVudHNcbiAqIEBkZXByZWNhdGVkXG4gKi9cbmV4cG9ydCBjb25zdCBBTExfRVZFTlRTOiBFdmVudEVtaXR0ZXI8Q2xpZW50RXZlbnRzPiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgcmV0cnkgc3RyYXRlZ3kgYW5kIHNlc3Npb24gcmVmcmVzaGVzXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlQ2xpZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyPENsaWVudEV2ZW50cz4ge1xuICAvKiogSW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlc3Npb24gY29udGFpbmVkIHdpdGhpbiB0aGUgY2xpZW50ICovXG4gIHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGE7XG5cbiAgLyoqIFNlc3Npb24gcGVyc2lzdGVuY2UgKi9cbiAgI3Nlc3Npb25NYW5hZ2VyOiBTZXNzaW9uTWFuYWdlcjtcblxuICAvKiogTVVUQUJMRSBjb25maWd1cmF0aW9uICovXG4gIGNvbmZpZzogeyB1cGRhdGVSZXRyeURlbGF5c01zOiBudW1iZXJbXSB9ID0ge1xuICAgIC8qKiBVcGRhdGUgcmV0cnkgZGVsYXlzICovXG4gICAgdXBkYXRlUmV0cnlEZWxheXNNczogWzEwMCwgMjAwLCA0MDBdLFxuICB9O1xuXG4gIC8qKiBHZXQgdGhlIGVudiAqL1xuICBnZXQgZW52KCk6IEVudkludGVyZmFjZSB7XG4gICAgcmV0dXJuIHRoaXMuc2Vzc2lvbk1ldGEuZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBjbGllbnQgd2l0aCBhIHNlc3Npb24gb3Igc2Vzc2lvbiBtYW5hZ2VyXG4gICAqIEBwYXJhbSB7U3RhdGljQ2xpZW50U3ViY2xhc3M8VD59IHRoaXMgQWxsb3dzIHRoaXMgc3RhdGljIG1ldGhvZCB0byByZXR1cm4gc3VidHlwZXMgd2hlbiBpbnZva2VkIHRocm91Z2ggdGhlbVxuICAgKiBAcGFyYW0ge1Nlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEgfCBzdHJpbmd9IHNlc3Npb24gIFRoZSBzZXNzaW9uIChvYmplY3Qgb3IgYmFzZTY0IHN0cmluZykgb3IgbWFuYWdlciB0aGF0IHdpbGwgYmFjayB0aGlzIGNsaWVudFxuICAgKiBAcmV0dXJuIHtUfSBBIENsaWVudFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZTxUPihcbiAgICB0aGlzOiBTdGF0aWNDbGllbnRTdWJjbGFzczxUPixcbiAgICBzZXNzaW9uOiBzdHJpbmcgfCBTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhLFxuICApOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBzZXNzaW9uT2JqOiBTZXNzaW9uTWFuYWdlciB8IFNlc3Npb25EYXRhID1cbiAgICAgIHR5cGVvZiBzZXNzaW9uID09PSBcInN0cmluZ1wiID8gcGFyc2VCYXNlNjRTZXNzaW9uRGF0YShzZXNzaW9uKSA6IHNlc3Npb247XG5cbiAgICBpZiAodHlwZW9mIHNlc3Npb25PYmoudG9rZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY29uc3QgbWFuYWdlciA9IHNlc3Npb25PYmogYXMgU2Vzc2lvbk1hbmFnZXI7XG4gICAgICByZXR1cm4gbmV3IHRoaXMoYXdhaXQgbWFuYWdlci5tZXRhZGF0YSgpLCBtYW5hZ2VyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2Vzc2lvbiA9IHNlc3Npb25PYmogYXMgU2Vzc2lvbkRhdGE7XG4gICAgICByZXR1cm4gbmV3IHRoaXMobWV0YWRhdGEoc2Vzc2lvbiksIG5ldyBNZW1vcnlTZXNzaW9uTWFuYWdlcihzZXNzaW9uKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U2Vzc2lvbk1ldGFkYXRhfSBbc2Vzc2lvbk1ldGFdIFRoZSBpbml0aWFsIHNlc3Npb24gbWV0YWRhdGFcbiAgICogQHBhcmFtIHtTZXNzaW9uTWFuYWdlcn0gW21hbmFnZXJdIFRoZSBtYW5hZ2VyIGZvciB0aGUgY3VycmVudCBzZXNzaW9uXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YSwgbWFuYWdlcjogU2Vzc2lvbk1hbmFnZXIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI3Nlc3Npb25NYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNlc3Npb25NZXRhID0gc2Vzc2lvbk1ldGE7XG4gIH1cblxuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IHRoZSBzZXNzaW9uJ3MgaW1wbGljaXQgYXJndW1lbnRzIG9uIHRvcCBvZiB3aGF0IHdhcyBwcm92aWRlZFxuICAgKlxuICAgKiBAcGFyYW0ge1NpbXBsZU9wdGlvbnN9IG9wdHMgVGhlIHVzZXItc3VwcGxpZWQgb3B0c1xuICAgKiBAcmV0dXJuIHtTaW1wbGVPcHRpb25zfSBUaGUgdW5pb24gb2YgdGhlIHVzZXItc3VwcGxpZWQgb3B0cyBhbmQgdGhlIGRlZmF1bHQgb25lc1xuICAgKi9cbiAgYXN5bmMgI2FwcGx5T3B0aW9uczxUIGV4dGVuZHMgT3BlcmF0aW9uPihcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogUHJvbWlzZTxTaW1wbGVPcHRpb25zPFQ+PiB7XG4gICAgY29uc3QgcGF0aFBhcmFtcyA9IFwicGF0aFwiIGluIChvcHRzLnBhcmFtcyA/PyB7fSkgPyBvcHRzLnBhcmFtcz8ucGF0aCA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBiYXNlVXJsID0gdGhpcy5lbnYuU2lnbmVyQXBpUm9vdC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY2FjaGU6IFwibm8tc3RvcmVcIixcbiAgICAgIC8vIElmIHdlIGhhdmUgYW4gYWN0aXZlU2Vzc2lvbiwgbGV0IGl0IGRpY3RhdGUgdGhlIGJhc2VVcmwuIE90aGVyd2lzZSBmYWxsIGJhY2sgdG8gdGhlIG9uZSBzZXQgYXQgY29uc3RydWN0aW9uXG4gICAgICBiYXNlVXJsLFxuICAgICAgLi4ub3B0cyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgICBcIlgtQ3ViaXN0LVRzLVNka1wiOiBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYXdhaXQgdGhpcy4jc2Vzc2lvbk1hbmFnZXIudG9rZW4oKSxcbiAgICAgICAgLi4ub3B0cy5oZWFkZXJzLFxuICAgICAgfSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICAuLi5vcHRzLnBhcmFtcyxcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIG9yZ19pZDogdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQsXG4gICAgICAgICAgLi4ucGF0aFBhcmFtcyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSBhcyB1bmtub3duIGFzIFNpbXBsZU9wdGlvbnM8VD47XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgc3BlY2lmaWMgZXJyb3IgZXZlbnRzIHdoZW4gYSByZXF1ZXN0IGZhaWxlZFxuICAgKlxuICAgKiBAcGFyYW0ge0Vycm9yRXZlbnR9IGVyciBUaGUgZXJyb3IgdG8gY2xhc3NpZnlcbiAgICovXG4gIGFzeW5jICNjbGFzc2lmeUFuZEVtaXRFcnJvcihlcnI6IEVycm9yRXZlbnQpIHtcbiAgICB0aGlzLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuICAgIEFMTF9FVkVOVFMuZW1pdChcImVycm9yXCIsIGVycik7XG5cbiAgICBpZiAoZXJyLmlzVXNlck1mYUVycm9yKCkpIHtcbiAgICAgIHRoaXMuZW1pdChcInVzZXItbWZhLWZhaWxlZFwiLCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KFwidXNlci1tZmEtZmFpbGVkXCIsIGVycik7XG4gICAgfVxuXG4gICAgLy8gaWYgc3RhdHVzIGlzIDQwMyBhbmQgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlIFwiaW52YWxpZCBzZXNzaW9uXCIgZXJyb3IgY29kZXMgdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkXG4gICAgLy9cbiAgICAvLyBUT0RPOiBiZWNhdXNlIGVycm9ycyByZXR1cm5lZCBieSB0aGUgYXV0aG9yaXplciBsYW1iZGEgYXJlIG5vdCBmb3J3YXJkZWQgdG8gdGhlIGNsaWVudFxuICAgIC8vICAgICAgIHdlIGFsc28gdHJpZ2dlciBvblNlc3Npb25FeHBpcmVkIHdoZW4gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiIGZhaWxzXG4gICAgaWYgKFxuICAgICAgZXJyLnN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAoZXJyLmlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpIHx8IGVyci5vcGVyYXRpb24gPT0gXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiKVxuICAgICkge1xuICAgICAgdGhpcy5lbWl0KFwic2Vzc2lvbi1leHBpcmVkXCIsIGVycik7XG4gICAgICBBTExfRVZFTlRTLmVtaXQoXCJ1c2VyLW1mYS1mYWlsZWRcIiwgZXJyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgYW4gb3AgdXNpbmcgdGhlIHN0YXRlIG9mIHRoZSBjbGllbnQgKGF1dGggaGVhZGVycyAmIG9yZ19pZCkgd2l0aCByZXRyaWVzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0ge09wPFQ+fSBvcCBUaGUgQVBJIG9wZXJhdGlvbiB5b3Ugd2lzaCB0byBwZXJmb3JtXG4gICAqIEBwYXJhbSB7U2ltcGxlT3B0aW9uczxUPn0gb3B0cyBUaGUgcGFyYW1ldGVycyBmb3IgdGhlIG9wZXJhdGlvblxuICAgKiBAcmV0dXJuIHtGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD59IEEgcHJvbWlzZSBmb3IgdGhlIHN1Y2Nlc3NmdWwgcmVzdWx0IChlcnJvcnMgd2lsbCBiZSB0aHJvd24pXG4gICAqL1xuICBleGVjPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIG9wOiBPcDxUPixcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogUHJvbWlzZTxGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD4+IHtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PiB0aGlzLiNhcHBseU9wdGlvbnMob3B0cykudGhlbihvcCkpXG4gICAgICAudGhlbihhc3NlcnRPaykgLy8gT25jZSB3ZSBoYXZlIGEgbm9uLTVYWCByZXNwb25zZSwgd2Ugd2lsbCBhc3NlcnRPayAoZWl0aGVyIHRocm93aW5nIG9yIHlpZWxkaW5nIHRoZSByZXBvbnNlKVxuICAgICAgLmNhdGNoKGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyUmVzcG9uc2UpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLiNjbGFzc2lmeUFuZEVtaXRFcnJvcihlKTsgLy8gRW1pdCBhcHByb3ByaWF0ZSBldmVudHNcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlOyAvLyBSZXRocm93IHRoZSBlcnJvclxuICAgICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGdyYWRlIGEgc2Vzc2lvbiByZXNwb25zZSBpbnRvIGEgZnVsbCBTZXNzaW9uRGF0YSBieSBpbmNvcnBvcmF0aW5nXG4gKiBlbGVtZW50cyBvZiBhbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICogQHBhcmFtIHtTZXNzaW9uRGF0YX0gbWV0YSBBbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICogQHBhcmFtIHtOZXdTZXNzaW9uUmVzcG9uc2V9IGluZm8gQSBuZXcgc2Vzc2lvbiBjcmVhdGVkIHZpYSB0aGUgQVBJXG4gKiBAcGFyYW0ge29iamVjdH0gY3R4IEFkZGl0aW9uYWwgbWFudWFsIG92ZXJyaWRlc1xuICogQHJldHVybiB7U2Vzc2lvbkRhdGF9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKFxuICBtZXRhOiBTZXNzaW9uTWV0YWRhdGEsXG4gIGluZm86IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgY3R4OiBQYXJ0aWFsPHsgcHVycG9zZTogc3RyaW5nOyByb2xlX2lkOiBzdHJpbmcgfT4sXG4pOiBTZXNzaW9uRGF0YSB7XG4gIHJldHVybiB7XG4gICAgZW52OiBtZXRhLmVudixcbiAgICBvcmdfaWQ6IG1ldGEub3JnX2lkLFxuICAgIHNlc3Npb25fZXhwOiBpbmZvLmV4cGlyYXRpb24sXG4gICAgc2Vzc2lvbl9pbmZvOiBpbmZvLnNlc3Npb25faW5mbyxcbiAgICB0b2tlbjogaW5mby50b2tlbixcbiAgICByZWZyZXNoX3Rva2VuOiBpbmZvLnJlZnJlc2hfdG9rZW4sXG4gICAgcHVycG9zZTogbWV0YS5wdXJwb3NlLFxuICAgIHJvbGVfaWQ6IG1ldGEucm9sZV9pZCxcbiAgICAuLi5jdHgsXG4gIH07XG59XG5cbnR5cGUgRGVlcE9taXQ8QSwgQj4gPSBbQSwgQl0gZXh0ZW5kcyBbb2JqZWN0LCBvYmplY3RdXG4gID8ge1xuICAgICAgW0sgaW4ga2V5b2YgQSBhcyBLIGV4dGVuZHMga2V5b2YgQiAvLyBJZiB0aGUga2V5IGlzIGluIGJvdGggQSBhbmQgQlxuICAgICAgICA/IEFbS10gZXh0ZW5kcyBCW0tdXG4gICAgICAgICAgPyBLIC8vXG4gICAgICAgICAgOiBuZXZlclxuICAgICAgICA6IG5ldmVyXT86IEsgZXh0ZW5kcyBrZXlvZiBCID8gRGVlcE9taXQ8QVtLXSwgQltLXT4gOiBuZXZlcjtcbiAgICB9ICYge1xuICAgICAgW0sgaW4ga2V5b2YgQSBhcyBLIGV4dGVuZHMga2V5b2YgQiA/IChCW0tdIGV4dGVuZHMgQVtLXSA/IG5ldmVyIDogSykgOiBLXTogSyBleHRlbmRzIGtleW9mIEJcbiAgICAgICAgPyBEZWVwT21pdDxBW0tdLCBCW0tdPlxuICAgICAgICA6IEFbS107XG4gICAgfVxuICA6IEE7XG5cbmV4cG9ydCB0eXBlIE9taXRBdXRvUGFyYW1zPE8+ID0gRGVlcE9taXQ8XG4gIE8sXG4gIHtcbiAgICBiYXNlVXJsOiBzdHJpbmc7XG4gICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBzdHJpbmcgfSB9O1xuICB9XG4+ICYgeyBwYXJhbXM/OiB7IHBhdGg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB9IH07XG4iXX0=