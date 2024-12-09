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
    /** Get the env */
    get env() {
        return this.sessionMeta.env["Dev-CubeSignerStack"];
    }
    /**
     * Construct a client with a session or session manager
     *
     * @param this Allows this static method to return subtypes when invoked through them
     * @param session  The session (object or base64 string) or manager that will back this client
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
    /** The organization ID */
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
 * @returns
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtPQSxvRUFnQkM7QUFsUEQsc0VBQXFDO0FBRXJDLG9DQUFvQztBQUNwQyxvQ0FBaUM7QUFDakMsc0NBQXlDO0FBQ3pDLG9DQUF1QztBQUV2Qyx1Q0FBbUY7QUFJbkYsa0NBQWtDO0FBQ3JCLFFBQUEsSUFBSSxHQUFXLHNCQUFHLENBQUMsSUFBSSxDQUFDO0FBRXJDLDZCQUE2QjtBQUNoQixRQUFBLE9BQU8sR0FBVyxzQkFBRyxDQUFDLE9BQU8sQ0FBQztBQUkzQywrRUFBK0U7QUFDL0UsTUFBYSxtQkFBbUI7Q0FBRztBQUFuQyxrREFBbUM7QUFFbkMsd0ZBQXdGO0FBQ3hGLE1BQWEsa0JBQW1CLFNBQVEsbUJBQVc7Q0FBRztBQUF0RCxnREFBc0Q7QUFZdEQ7Ozs7R0FJRztBQUNVLFFBQUEsVUFBVSxHQUErQixJQUFJLHFCQUFZLEVBQUUsQ0FBQztBQUV6RTs7R0FFRztBQUNILE1BQWEsVUFBVyxTQUFRLHFCQUEwQjtJQWF4RCxrQkFBa0I7SUFDbEIsSUFBSSxHQUFHO1FBQ0wsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FFakIsT0FBOEM7UUFFOUMsTUFBTSxVQUFVLEdBQ2QsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLGdDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFFMUUsSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDM0MsTUFBTSxPQUFPLEdBQUcsVUFBNEIsQ0FBQztZQUM3QyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxHQUFHLFVBQXlCLENBQUM7WUFDcEMsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFBLGtCQUFRLEVBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSw4QkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLFdBQTRCLEVBQUUsT0FBdUI7UUFDL0QsS0FBSyxFQUFFLENBQUM7O1FBNUNWLDBCQUEwQjtRQUMxQiw2Q0FBZ0M7UUFFaEMsNEJBQTRCO1FBQzVCLFdBQU0sR0FBc0M7WUFDMUMsMEJBQTBCO1lBQzFCLG1CQUFtQixFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7U0FDckMsQ0FBQztRQXNDQSx1QkFBQSxJQUFJLDhCQUFtQixPQUFPLE1BQUEsQ0FBQztRQUMvQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUNqQyxDQUFDO0lBRUQsMEJBQTBCO0lBQzFCLElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFDakMsQ0FBQztJQWtFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLElBQUksQ0FDUixFQUFTLEVBQ1QsSUFBc0M7UUFFdEMsSUFBSSxDQUFDO1lBQ0gsSUFBSSxLQUFLLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGtDQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQy9DLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSxhQUFLLEVBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLHVCQUFBLElBQUksdURBQWMsTUFBbEIsSUFBSSxFQUFlLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFO2dCQUNsRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO29CQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztvQkFDcEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQWtDLENBQUM7b0JBQ3RELE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxVQUFVLENBQUM7b0JBRXBDLHdEQUF3RDtvQkFDeEQsRUFBRTtvQkFDRiwrREFBK0Q7b0JBQy9ELHlCQUF5QjtvQkFDekIsSUFDRSxNQUFNLEtBQUssR0FBRzt3QkFDZCxTQUFTLEtBQUssU0FBUzt3QkFDdkIsdUJBQUEsSUFBSSxrQ0FBZ0IsQ0FBQyxjQUFjLEtBQUssU0FBUyxFQUNqRCxDQUFDO3dCQUNELHVCQUFBLElBQUksa0NBQWdCLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQ3RDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQzt3QkFDdkIsS0FBSyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxrQ0FBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDM0MsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDO29CQUM1QixDQUFDO29CQUVELGdDQUFnQztvQkFDaEMsT0FBTyxNQUFNLElBQUksR0FBRyxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUM7Z0JBQ3ZDLENBQUM7YUFDRixDQUFDLENBQUM7WUFDSCw4RkFBOEY7WUFDOUYsT0FBTyxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWCxJQUFJLENBQUMsWUFBWSxtQkFBVyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sdUJBQUEsSUFBSSwrREFBc0IsTUFBMUIsSUFBSSxFQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtZQUNqRSxDQUFDO1lBQ0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxvQkFBb0I7UUFDL0IsQ0FBQztJQUNILENBQUM7Q0FDRjtBQTFLRCxnQ0EwS0M7Z0pBeEdHLEtBQWEsRUFDYixJQUFzQztJQUV0QyxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ2pGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFMUQsT0FBTztRQUNMLEtBQUssRUFBRSxVQUFVO1FBQ2pCLDhHQUE4RztRQUM5RyxPQUFPO1FBQ1AsR0FBRyxJQUFJO1FBQ1AsT0FBTyxFQUFFO1lBQ1AsWUFBWSxFQUFFLEdBQUcsWUFBSSxJQUFJLGVBQU8sRUFBRTtZQUNsQyxpQkFBaUIsRUFBRSxHQUFHLFlBQUksSUFBSSxlQUFPLEVBQUU7WUFDdkMsYUFBYSxFQUFFLEtBQUs7WUFDcEIsR0FBRyxJQUFJLENBQUMsT0FBTztTQUNoQjtRQUNELE1BQU0sRUFBRTtZQUNOLEdBQUcsSUFBSSxDQUFDLE1BQU07WUFDZCxJQUFJLEVBQUU7Z0JBQ0osTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTTtnQkFDL0IsR0FBRyxVQUFVO2FBQ2Q7U0FDRjtLQUM2QixDQUFDO0FBQ25DLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsS0FBSywyQ0FBdUIsR0FBZTtJQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN4QixrQkFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFOUIsSUFBSSxHQUFHLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQztRQUN6QixNQUFNLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNuQixrQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELHVHQUF1RztJQUN2RyxFQUFFO0lBQ0YseUZBQXlGO0lBQ3pGLDJFQUEyRTtJQUMzRSxJQUNFLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRztRQUNsQixDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLEdBQUcsQ0FBQyxTQUFTLElBQUksc0JBQXNCLENBQUMsRUFDeEUsQ0FBQztRQUNELE1BQU0sRUFBRSxHQUFHLGlCQUFpQixDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLGtCQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDO0FBQ0gsQ0FBQztBQW9ESDs7Ozs7Ozs7R0FRRztBQUNILFNBQWdCLDRCQUE0QixDQUMxQyxJQUFxQixFQUNyQixJQUF3QixFQUN4QixHQUFrRDtJQUVsRCxPQUFPO1FBQ0wsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO1FBQ2IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1FBQ25CLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVTtRQUM1QixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7UUFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1FBQ2pCLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtRQUNqQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87UUFDckIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1FBQ3JCLEdBQUcsR0FBRztLQUNQLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBrZyBmcm9tIFwiLi4vLi4vcGFja2FnZS5qc29uXCI7XG5pbXBvcnQgdHlwZSB7IEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YSwgT3AsIE9wZXJhdGlvbiwgU2ltcGxlT3B0aW9ucyB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IHJldHJ5IH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBFcnJSZXNwb25zZSB9IGZyb20gXCIuLi9lcnJvclwiO1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSwgU2Vzc2lvbk1hbmFnZXIsIFNlc3Npb25NZXRhZGF0YSB9IGZyb20gXCIuL3Nlc3Npb25cIjtcbmltcG9ydCB7IE1lbW9yeVNlc3Npb25NYW5hZ2VyLCBtZXRhZGF0YSwgcGFyc2VCYXNlNjRTZXNzaW9uRGF0YSB9IGZyb20gXCIuL3Nlc3Npb25cIjtcbmltcG9ydCB0eXBlIHsgTmV3U2Vzc2lvblJlc3BvbnNlLCBFcnJvclJlc3BvbnNlIH0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyBwYWNrYWdlIG5hbWUgKi9cbmV4cG9ydCBjb25zdCBOQU1FOiBzdHJpbmcgPSBwa2cubmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSBwa2cudmVyc2lvbjtcblxuZXhwb3J0IHR5cGUgRXJyb3JFdmVudCA9IEVyclJlc3BvbnNlO1xuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQvaW52YWxpZCBzZXNzaW9uICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFdmVudCB7fVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIHVzZXIgZmFpbGVkIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlICovXG5leHBvcnQgY2xhc3MgVXNlck1mYUZhaWxlZEV2ZW50IGV4dGVuZHMgRXJyUmVzcG9uc2Uge31cblxudHlwZSBDbGllbnRFdmVudHMgPSB7XG4gIFwidXNlci1tZmEtZmFpbGVkXCI6IChldjogVXNlck1mYUZhaWxlZEV2ZW50KSA9PiB2b2lkO1xuICBcInNlc3Npb24tZXhwaXJlZFwiOiAoZXY6IFNlc3Npb25FeHBpcmVkRXZlbnQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXY6IEVycm9yRXZlbnQpID0+IHZvaWQ7XG59O1xuXG50eXBlIFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+ID0ge1xuICBuZXcgKC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQmFzZUNsaWVudD4pOiBUO1xufSAmIHR5cGVvZiBCYXNlQ2xpZW50O1xuXG4vKipcbiAqIEFuIGV2ZW50IGVtaXR0ZXIgZm9yIGFsbCBjbGllbnRzXG4gKlxuICogQGRlcHJlY2F0ZWRcbiAqL1xuZXhwb3J0IGNvbnN0IEFMTF9FVkVOVFM6IEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSByZXRyeSBzdHJhdGVneSBhbmQgc2Vzc2lvbiByZWZyZXNoZXNcbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDbGllbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8Q2xpZW50RXZlbnRzPiB7XG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc2Vzc2lvbiBjb250YWluZWQgd2l0aGluIHRoZSBjbGllbnQgKi9cbiAgc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YTtcblxuICAvKiogU2Vzc2lvbiBwZXJzaXN0ZW5jZSAqL1xuICAjc2Vzc2lvbk1hbmFnZXI6IFNlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKiBNVVRBQkxFIGNvbmZpZ3VyYXRpb24gKi9cbiAgY29uZmlnOiB7IHVwZGF0ZVJldHJ5RGVsYXlzTXM6IG51bWJlcltdIH0gPSB7XG4gICAgLyoqIFVwZGF0ZSByZXRyeSBkZWxheXMgKi9cbiAgICB1cGRhdGVSZXRyeURlbGF5c01zOiBbMTAwLCAyMDAsIDQwMF0sXG4gIH07XG5cbiAgLyoqIEdldCB0aGUgZW52ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWV0YS5lbnZbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIGNsaWVudCB3aXRoIGEgc2Vzc2lvbiBvciBzZXNzaW9uIG1hbmFnZXJcbiAgICpcbiAgICogQHBhcmFtIHRoaXMgQWxsb3dzIHRoaXMgc3RhdGljIG1ldGhvZCB0byByZXR1cm4gc3VidHlwZXMgd2hlbiBpbnZva2VkIHRocm91Z2ggdGhlbVxuICAgKiBAcGFyYW0gc2Vzc2lvbiAgVGhlIHNlc3Npb24gKG9iamVjdCBvciBiYXNlNjQgc3RyaW5nKSBvciBtYW5hZ2VyIHRoYXQgd2lsbCBiYWNrIHRoaXMgY2xpZW50XG4gICAqIEByZXR1cm5zIEEgQ2xpZW50XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlPFQ+KFxuICAgIHRoaXM6IFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+LFxuICAgIHNlc3Npb246IHN0cmluZyB8IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEsXG4gICk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IHNlc3Npb25PYmo6IFNlc3Npb25NYW5hZ2VyIHwgU2Vzc2lvbkRhdGEgPVxuICAgICAgdHlwZW9mIHNlc3Npb24gPT09IFwic3RyaW5nXCIgPyBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb24pIDogc2Vzc2lvbjtcblxuICAgIGlmICh0eXBlb2Ygc2Vzc2lvbk9iai50b2tlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zdCBtYW5hZ2VyID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uTWFuYWdlcjtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhhd2FpdCBtYW5hZ2VyLm1ldGFkYXRhKCksIG1hbmFnZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXNzaW9uID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uRGF0YTtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhtZXRhZGF0YShzZXNzaW9uKSwgbmV3IE1lbW9yeVNlc3Npb25NYW5hZ2VyKHNlc3Npb24pKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHNlc3Npb25NZXRhIFRoZSBpbml0aWFsIHNlc3Npb24gbWV0YWRhdGFcbiAgICogQHBhcmFtIG1hbmFnZXIgVGhlIG1hbmFnZXIgZm9yIHRoZSBjdXJyZW50IHNlc3Npb25cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uTWV0YTogU2Vzc2lvbk1ldGFkYXRhLCBtYW5hZ2VyOiBTZXNzaW9uTWFuYWdlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jc2Vzc2lvbk1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuc2Vzc2lvbk1ldGEgPSBzZXNzaW9uTWV0YTtcbiAgfVxuXG4gIC8qKiBUaGUgb3JnYW5pemF0aW9uIElEICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgdGhlIHNlc3Npb24ncyBpbXBsaWNpdCBhcmd1bWVudHMgb24gdG9wIG9mIHdoYXQgd2FzIHByb3ZpZGVkXG4gICAqXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgYXV0aG9yaXphdGlvbiB0b2tlbiB0byB1c2UgZm9yIHRoZSByZXF1ZXN0XG4gICAqIEBwYXJhbSBvcHRzIFRoZSB1c2VyLXN1cHBsaWVkIG9wdHNcbiAgICogQHJldHVybnMgVGhlIHVuaW9uIG9mIHRoZSB1c2VyLXN1cHBsaWVkIG9wdHMgYW5kIHRoZSBkZWZhdWx0IG9uZXNcbiAgICovXG4gICNhcHBseU9wdGlvbnM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBvcHRzOiBPbWl0QXV0b1BhcmFtczxTaW1wbGVPcHRpb25zPFQ+PixcbiAgKTogU2ltcGxlT3B0aW9uczxUPiB7XG4gICAgY29uc3QgcGF0aFBhcmFtcyA9IFwicGF0aFwiIGluIChvcHRzLnBhcmFtcyA/PyB7fSkgPyBvcHRzLnBhcmFtcz8ucGF0aCA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBiYXNlVXJsID0gdGhpcy5lbnYuU2lnbmVyQXBpUm9vdC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY2FjaGU6IFwibm8tc3RvcmVcIixcbiAgICAgIC8vIElmIHdlIGhhdmUgYW4gYWN0aXZlU2Vzc2lvbiwgbGV0IGl0IGRpY3RhdGUgdGhlIGJhc2VVcmwuIE90aGVyd2lzZSBmYWxsIGJhY2sgdG8gdGhlIG9uZSBzZXQgYXQgY29uc3RydWN0aW9uXG4gICAgICBiYXNlVXJsLFxuICAgICAgLi4ub3B0cyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgICBcIlgtQ3ViaXN0LVRzLVNka1wiOiBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogdG9rZW4sXG4gICAgICAgIC4uLm9wdHMuaGVhZGVycyxcbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgLi4ub3B0cy5wYXJhbXMsXG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHRoaXMuc2Vzc2lvbk1ldGEub3JnX2lkLFxuICAgICAgICAgIC4uLnBhdGhQYXJhbXMsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0gYXMgdW5rbm93biBhcyBTaW1wbGVPcHRpb25zPFQ+O1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIHNwZWNpZmljIGVycm9yIGV2ZW50cyB3aGVuIGEgcmVxdWVzdCBmYWlsZWRcbiAgICpcbiAgICogQHBhcmFtIGVyciBUaGUgZXJyb3IgdG8gY2xhc3NpZnlcbiAgICovXG4gIGFzeW5jICNjbGFzc2lmeUFuZEVtaXRFcnJvcihlcnI6IEVycm9yRXZlbnQpIHtcbiAgICB0aGlzLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuICAgIEFMTF9FVkVOVFMuZW1pdChcImVycm9yXCIsIGVycik7XG5cbiAgICBpZiAoZXJyLmlzVXNlck1mYUVycm9yKCkpIHtcbiAgICAgIGNvbnN0IGV2ID0gXCJ1c2VyLW1mYS1mYWlsZWRcIjtcbiAgICAgIHRoaXMuZW1pdChldiwgZXJyKTtcbiAgICAgIEFMTF9FVkVOVFMuZW1pdChldiwgZXJyKTtcbiAgICB9XG5cbiAgICAvLyBpZiBzdGF0dXMgaXMgNDAzIGFuZCBlcnJvciBtYXRjaGVzIG9uZSBvZiB0aGUgXCJpbnZhbGlkIHNlc3Npb25cIiBlcnJvciBjb2RlcyB0cmlnZ2VyIG9uU2Vzc2lvbkV4cGlyZWRcbiAgICAvL1xuICAgIC8vIFRPRE86IGJlY2F1c2UgZXJyb3JzIHJldHVybmVkIGJ5IHRoZSBhdXRob3JpemVyIGxhbWJkYSBhcmUgbm90IGZvcndhcmRlZCB0byB0aGUgY2xpZW50XG4gICAgLy8gICAgICAgd2UgYWxzbyB0cmlnZ2VyIG9uU2Vzc2lvbkV4cGlyZWQgd2hlbiBcInNpZ25lclNlc3Npb25SZWZyZXNoXCIgZmFpbHNcbiAgICBpZiAoXG4gICAgICBlcnIuc3RhdHVzID09PSA0MDMgJiZcbiAgICAgIChlcnIuaXNTZXNzaW9uRXhwaXJlZEVycm9yKCkgfHwgZXJyLm9wZXJhdGlvbiA9PSBcInNpZ25lclNlc3Npb25SZWZyZXNoXCIpXG4gICAgKSB7XG4gICAgICBjb25zdCBldiA9IFwic2Vzc2lvbi1leHBpcmVkXCI7XG4gICAgICB0aGlzLmVtaXQoZXYsIGVycik7XG4gICAgICBBTExfRVZFTlRTLmVtaXQoZXYsIGVycik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGFuIG9wIHVzaW5nIHRoZSBzdGF0ZSBvZiB0aGUgY2xpZW50IChhdXRoIGhlYWRlcnMgJiBvcmdfaWQpIHdpdGggcmV0cmllc1xuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIG9wIFRoZSBBUEkgb3BlcmF0aW9uIHlvdSB3aXNoIHRvIHBlcmZvcm1cbiAgICogQHBhcmFtIG9wdHMgVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBvcGVyYXRpb25cbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciB0aGUgc3VjY2Vzc2Z1bCByZXN1bHQgKGVycm9ycyB3aWxsIGJlIHRocm93bilcbiAgICovXG4gIGFzeW5jIGV4ZWM8VCBleHRlbmRzIE9wZXJhdGlvbj4oXG4gICAgb3A6IE9wPFQ+LFxuICAgIG9wdHM6IE9taXRBdXRvUGFyYW1zPFNpbXBsZU9wdGlvbnM8VD4+LFxuICApOiBQcm9taXNlPEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPj4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgdG9rZW4gPSBhd2FpdCB0aGlzLiNzZXNzaW9uTWFuYWdlci50b2tlbigpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHJldHJ5KCgpID0+IG9wKHRoaXMuI2FwcGx5T3B0aW9ucyh0b2tlbiwgb3B0cykpLCB7XG4gICAgICAgIHByZWQ6IGFzeW5jIChyZXNwKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gcmVzcC5yZXNwb25zZS5zdGF0dXM7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSByZXNwLmVycm9yIGFzIEVycm9yUmVzcG9uc2UgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgY29uc3QgcmVxdWVzdElkID0gZXJyb3I/LnJlcXVlc3RfaWQ7XG5cbiAgICAgICAgICAvLyBJZiB3ZSBnZXQgYSBcIkZvcmJpZGRlblwiIGVycm9yLCBlcmFzZSB0aGUgY2FjaGVkIHRva2VuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBUT0RPOiBDaGVjayBlcnJvciBjb2RlcyBvbmNlIG91ciBBUEkgcmV0dXJucyBlcnJvciBjb2RlcyBmb3JcbiAgICAgICAgICAvLyBhdXRob3JpemF0aW9uIGZhaWx1cmVzXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgc3RhdHVzID09PSA0MDMgJiZcbiAgICAgICAgICAgIHJlcXVlc3RJZCA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICB0aGlzLiNzZXNzaW9uTWFuYWdlci5vbkludmFsaWRUb2tlbiAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLiNzZXNzaW9uTWFuYWdlci5vbkludmFsaWRUb2tlbigpO1xuICAgICAgICAgICAgY29uc3Qgb2xkVG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAgIHRva2VuID0gYXdhaXQgdGhpcy4jc2Vzc2lvbk1hbmFnZXIudG9rZW4oKTtcbiAgICAgICAgICAgIHJldHVybiB0b2tlbiAhPT0gb2xkVG9rZW47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWxzbyByZXRyeSBzZXJ2ZXItc2lkZSBlcnJvcnNcbiAgICAgICAgICByZXR1cm4gc3RhdHVzID49IDUwMCAmJiBzdGF0dXMgPCA2MDA7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIC8vIE9uY2Ugd2UgaGF2ZSBhIG5vbi01WFggcmVzcG9uc2UsIHdlIHdpbGwgYXNzZXJ0T2sgKGVpdGhlciB0aHJvd2luZyBvciB5aWVsZGluZyB0aGUgcmVwb25zZSlcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIEVyclJlc3BvbnNlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGUpOyAvLyBFbWl0IGFwcHJvcHJpYXRlIGV2ZW50c1xuICAgICAgfVxuICAgICAgdGhyb3cgZTsgLy8gUmV0aHJvdyB0aGUgZXJyb3JcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGdyYWRlIGEgc2Vzc2lvbiByZXNwb25zZSBpbnRvIGEgZnVsbCBTZXNzaW9uRGF0YSBieSBpbmNvcnBvcmF0aW5nXG4gKiBlbGVtZW50cyBvZiBhbiBleGlzdGluZyBTZXNzaW9uRGF0YVxuICpcbiAqIEBwYXJhbSBtZXRhIEFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKiBAcGFyYW0gaW5mbyBBIG5ldyBzZXNzaW9uIGNyZWF0ZWQgdmlhIHRoZSBBUElcbiAqIEBwYXJhbSBjdHggQWRkaXRpb25hbCBtYW51YWwgb3ZlcnJpZGVzXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyhcbiAgbWV0YTogU2Vzc2lvbk1ldGFkYXRhLFxuICBpbmZvOiBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gIGN0eDogUGFydGlhbDx7IHB1cnBvc2U6IHN0cmluZzsgcm9sZV9pZDogc3RyaW5nIH0+LFxuKTogU2Vzc2lvbkRhdGEge1xuICByZXR1cm4ge1xuICAgIGVudjogbWV0YS5lbnYsXG4gICAgb3JnX2lkOiBtZXRhLm9yZ19pZCxcbiAgICBzZXNzaW9uX2V4cDogaW5mby5leHBpcmF0aW9uLFxuICAgIHNlc3Npb25faW5mbzogaW5mby5zZXNzaW9uX2luZm8sXG4gICAgdG9rZW46IGluZm8udG9rZW4sXG4gICAgcmVmcmVzaF90b2tlbjogaW5mby5yZWZyZXNoX3Rva2VuLFxuICAgIHB1cnBvc2U6IG1ldGEucHVycG9zZSxcbiAgICByb2xlX2lkOiBtZXRhLnJvbGVfaWQsXG4gICAgLi4uY3R4LFxuICB9O1xufVxuXG50eXBlIERlZXBPbWl0PEEsIEI+ID0gW0EsIEJdIGV4dGVuZHMgW29iamVjdCwgb2JqZWN0XVxuICA/IHtcbiAgICAgIFtLIGluIGtleW9mIEEgYXMgSyBleHRlbmRzIGtleW9mIEIgLy8gSWYgdGhlIGtleSBpcyBpbiBib3RoIEEgYW5kIEJcbiAgICAgICAgPyBBW0tdIGV4dGVuZHMgQltLXVxuICAgICAgICAgID8gSyAvL1xuICAgICAgICAgIDogbmV2ZXJcbiAgICAgICAgOiBuZXZlcl0/OiBLIGV4dGVuZHMga2V5b2YgQiA/IERlZXBPbWl0PEFbS10sIEJbS10+IDogbmV2ZXI7XG4gICAgfSAmIHtcbiAgICAgIFtLIGluIGtleW9mIEEgYXMgSyBleHRlbmRzIGtleW9mIEIgPyAoQltLXSBleHRlbmRzIEFbS10gPyBuZXZlciA6IEspIDogS106IEsgZXh0ZW5kcyBrZXlvZiBCXG4gICAgICAgID8gRGVlcE9taXQ8QVtLXSwgQltLXT5cbiAgICAgICAgOiBBW0tdO1xuICAgIH1cbiAgOiBBO1xuXG5leHBvcnQgdHlwZSBPbWl0QXV0b1BhcmFtczxPPiA9IERlZXBPbWl0PFxuICBPLFxuICB7XG4gICAgYmFzZVVybDogc3RyaW5nO1xuICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogc3RyaW5nIH0gfTtcbiAgfVxuPiAmIHsgcGFyYW1zPzogeyBwYXRoPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfSB9O1xuIl19