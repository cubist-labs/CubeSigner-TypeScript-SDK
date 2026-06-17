var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _BaseClient_instances, _BaseClient_targetOrgId, _BaseClient_preferredEnv, _BaseClient_applyOptions, _BaseClient_classifyAndEmitError;
// NOTE: add '// @ts-nocheck' at the top of this file to speed up type checking
import pkg from "../../package.json" with { type: "json" };
import { assertOk } from "../fetch.js";
import { retry } from "../retry.js";
import { EventEmitter } from "../events.js";
import { ErrResponse } from "../error.js";
import { MemorySessionManager, metadata, parseBase64SessionData } from "./session.js";
import { mergeHeaders } from "openapi-fetch";
/** CubeSigner SDK package name */
export const NAME = pkg.name;
/** CubeSigner SDK version */
export const VERSION = pkg.version;
/** Event emitted when a request fails because of an expired/invalid session */
export class SessionExpiredEvent {
}
/** Event emitted when a request fails because user failed to answer an MFA challenge */
export class UserMfaFailedEvent extends ErrResponse {
}
/**
 * An event emitter for all clients
 *
 * @deprecated
 */
export const ALL_EVENTS = new EventEmitter();
/**
 * Check whether two environment descriptions refer to the same CubeSigner environment.
 *
 * @param left First environment to compare
 * @param right Second environment to compare
 * @returns Whether the environments are equivalent
 */
function envEquals(left, right) {
    return (left.SignerApiRoot === right.SignerApiRoot &&
        left.OrgEventsTopicArn === right.OrgEventsTopicArn &&
        left.Region === right.Region);
}
/**
 * Ensure a preferred environment belongs to the session's advertised environment set.
 *
 * @param preferredEnv The caller-requested preferred environment
 * @param sessionMeta The session metadata that lists allowed environments
 * @returns The validated preferred environment, if any
 */
function validatePreferredEnv(preferredEnv, sessionMeta) {
    if (preferredEnv === undefined) {
        return undefined;
    }
    if (!Object.values(sessionMeta.env).some((env) => envEquals(env, preferredEnv))) {
        throw new Error(`The current session does not allow the '${preferredEnv.SignerApiRoot}' environment`);
    }
    return preferredEnv;
}
/**
 * Implements a retry strategy and session refreshes
 */
export class BaseClient extends EventEmitter {
    /** @returns The env */
    get env() {
        return __classPrivateFieldGet(this, _BaseClient_preferredEnv, "f") ?? this.sessionMeta.env["Dev-CubeSignerStack"];
    }
    /** @returns All available regional environments */
    get envs() {
        return Object.values(this.sessionMeta.env);
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
        const sessionObj = typeof session === "string" ? parseBase64SessionData(session) : session;
        if (typeof sessionObj.token === "function") {
            const manager = sessionObj;
            return new this(await manager.metadata(), manager, targetOrgId);
        }
        else {
            session = sessionObj;
            return new this(metadata(session), new MemorySessionManager(session), targetOrgId);
        }
    }
    /**
     * @param sessionMeta The initial session metadata
     * @param manager The manager for the current session
     * @param targetOrgId The ID of the organization this client should operate on. Defaults to
     *   the org id from the supplied session. The only scenario in which it makes sense to use
     *   a {@link targetOrgId} different from the session org id is if {@link targetOrgId} is a
     *   child organization of the session organization.
     * @param config Client configuration
     *
     * @internal
     */
    constructor(sessionMeta, manager, targetOrgId, config) {
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
        _BaseClient_preferredEnv.set(this, void 0);
        __classPrivateFieldSet(this, _BaseClient_targetOrgId, targetOrgId, "f");
        __classPrivateFieldSet(this, _BaseClient_preferredEnv, validatePreferredEnv(config?.preferredEnv, sessionMeta), "f");
        this.sessionManager = manager;
        this.sessionMeta = sessionMeta;
        this.config = {
            updateRetryDelaysMs: [100, 200, 400],
            headers: {},
            origin: undefined,
            ...(config ?? {}),
        };
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
            const resp = await retry(() => op(__classPrivateFieldGet(this, _BaseClient_instances, "m", _BaseClient_applyOptions).call(this, token, opts)), {
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
            // Once we have a non-5XX response, we will assertOk (either throwing or yielding the response)
            return assertOk(resp);
        }
        catch (e) {
            if (e instanceof ErrResponse) {
                await __classPrivateFieldGet(this, _BaseClient_instances, "m", _BaseClient_classifyAndEmitError).call(this, e); // Emit appropriate events
            }
            throw e; // Rethrow the error
        }
    }
}
_BaseClient_targetOrgId = new WeakMap(), _BaseClient_preferredEnv = new WeakMap(), _BaseClient_instances = new WeakSet(), _BaseClient_applyOptions = function _BaseClient_applyOptions(token, opts) {
    const pathParams = "path" in (opts.params ?? {}) ? opts.params?.path : undefined;
    const baseUrl = this.env.SignerApiRoot.replace(/\/$/, "");
    const browserUserAgent = typeof window !== "undefined" ? navigator?.userAgent : undefined;
    return {
        cache: "no-store",
        // If we have an activeSession, let it dictate the baseUrl. Otherwise fall back to the one set at construction
        baseUrl,
        ...opts,
        headers: mergeHeaders({
            "User-Agent": browserUserAgent ?? `${NAME}@${VERSION}`,
            "X-Cubist-Ts-Sdk": `${NAME}@${VERSION}`,
            Origin: this.config.origin,
        }, authHeader(token), this.config.headers, opts.headers),
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
    ALL_EVENTS.emit("error", err);
    if (err.isUserMfaError()) {
        const ev = "user-mfa-failed";
        this.emit(ev, err);
        ALL_EVENTS.emit(ev, err);
    }
    // if status is 403 and error matches one of the "invalid session" error codes trigger onSessionExpired
    //
    // TODO: because errors returned by the authorizer lambda are not forwarded to the client
    //       we also trigger onSessionExpired when "signerSessionRefresh" fails
    if (err.status === 403 &&
        (err.isSessionExpiredError() || err.operation == "signerSessionRefresh")) {
        const ev = "session-expired";
        this.emit(ev, err);
        ALL_EVENTS.emit(ev, err);
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
export function signerSessionFromSessionInfo(meta, info, ctx) {
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
/**
 * Creates {@link HeadersInit} containing a single "Authorization" header with a given value.
 *
 * @param token The "Authorization" header value
 * @returns A {@link HeadersInit} object containing a single "Authorization" header with a given value.
 */
export function authHeader(token) {
    return { Authorization: token };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2Jhc2VfY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLCtFQUErRTtBQUMvRSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxPQUFPLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUUzRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDcEMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUM1QyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRTFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxRQUFRLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFHdEYsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUU3QyxrQ0FBa0M7QUFDbEMsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFXLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFFckMsNkJBQTZCO0FBQzdCLE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBVyxHQUFHLENBQUMsT0FBTyxDQUFDO0FBSTNDLCtFQUErRTtBQUMvRSxNQUFNLE9BQU8sbUJBQW1CO0NBQUc7QUFFbkMsd0ZBQXdGO0FBQ3hGLE1BQU0sT0FBTyxrQkFBbUIsU0FBUSxXQUFXO0NBQUc7QUFZdEQ7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLFVBQVUsR0FBK0IsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUV6RTs7Ozs7O0dBTUc7QUFDSCxTQUFTLFNBQVMsQ0FBQyxJQUFrQixFQUFFLEtBQW1CO0lBQ3hELE9BQU8sQ0FDTCxJQUFJLENBQUMsYUFBYSxLQUFLLEtBQUssQ0FBQyxhQUFhO1FBQzFDLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxL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RUFBRSxJQUFJLENBQUMsTUFBTTtRQUNuQixXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVU7UUFDNUIsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO1FBQy9CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztRQUNqQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7UUFDakMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1FBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixHQUFHLEdBQUc7S0FDUCxDQUFDO0FBQ0osQ0FBQztBQXdCRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxVQUFVLENBQUMsS0FBYTtJQUN0QyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDO0FBQ2xDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBOT1RFOiBhZGQgJy8vIEB0cy1ub2NoZWNrJyBhdCB0aGUgdG9wIG9mIHRoaXMgZmlsZSB0byBzcGVlZCB1cCB0eXBlIGNoZWNraW5nXG5pbXBvcnQgcGtnIGZyb20gXCIuLi8uLi9wYWNrYWdlLmpzb25cIiB3aXRoIHsgdHlwZTogXCJqc29uXCIgfTtcbmltcG9ydCB0eXBlIHsgRmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhLCBPcCwgT3BlcmF0aW9uLCBTaW1wbGVPcHRpb25zIH0gZnJvbSBcIi4uL2ZldGNoLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnRPayB9IGZyb20gXCIuLi9mZXRjaC50c1wiO1xuaW1wb3J0IHsgcmV0cnkgfSBmcm9tIFwiLi4vcmV0cnkudHNcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCIuLi9ldmVudHMudHNcIjtcbmltcG9ydCB7IEVyclJlc3BvbnNlIH0gZnJvbSBcIi4uL2Vycm9yLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb25EYXRhLCBTZXNzaW9uTWFuYWdlciwgU2Vzc2lvbk1ldGFkYXRhIH0gZnJvbSBcIi4vc2Vzc2lvbi50c1wiO1xuaW1wb3J0IHsgTWVtb3J5U2Vzc2lvbk1hbmFnZXIsIG1ldGFkYXRhLCBwYXJzZUJhc2U2NFNlc3Npb25EYXRhIH0gZnJvbSBcIi4vc2Vzc2lvbi50c1wiO1xuaW1wb3J0IHR5cGUgeyBOZXdTZXNzaW9uUmVzcG9uc2UsIEVycm9yUmVzcG9uc2UgfSBmcm9tIFwiLi4vc2NoZW1hX3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnYudHNcIjtcbmltcG9ydCB7IG1lcmdlSGVhZGVycyB9IGZyb20gXCJvcGVuYXBpLWZldGNoXCI7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyBwYWNrYWdlIG5hbWUgKi9cbmV4cG9ydCBjb25zdCBOQU1FOiBzdHJpbmcgPSBwa2cubmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSBwa2cudmVyc2lvbjtcblxuZXhwb3J0IHR5cGUgRXJyb3JFdmVudCA9IEVyclJlc3BvbnNlO1xuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIG9mIGFuIGV4cGlyZWQvaW52YWxpZCBzZXNzaW9uICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFdmVudCB7fVxuXG4vKiogRXZlbnQgZW1pdHRlZCB3aGVuIGEgcmVxdWVzdCBmYWlscyBiZWNhdXNlIHVzZXIgZmFpbGVkIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlICovXG5leHBvcnQgY2xhc3MgVXNlck1mYUZhaWxlZEV2ZW50IGV4dGVuZHMgRXJyUmVzcG9uc2Uge31cblxudHlwZSBDbGllbnRFdmVudHMgPSB7XG4gIFwidXNlci1tZmEtZmFpbGVkXCI6IChldjogVXNlck1mYUZhaWxlZEV2ZW50KSA9PiB2b2lkO1xuICBcInNlc3Npb24tZXhwaXJlZFwiOiAoZXY6IFNlc3Npb25FeHBpcmVkRXZlbnQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXY6IEVycm9yRXZlbnQpID0+IHZvaWQ7XG59O1xuXG50eXBlIFN0YXRpY0NsaWVudFN1YmNsYXNzPFQ+ID0ge1xuICBuZXcgKC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQmFzZUNsaWVudD4pOiBUO1xufSAmIHR5cGVvZiBCYXNlQ2xpZW50O1xuXG4vKipcbiAqIEFuIGV2ZW50IGVtaXR0ZXIgZm9yIGFsbCBjbGllbnRzXG4gKlxuICogQGRlcHJlY2F0ZWRcbiAqL1xuZXhwb3J0IGNvbnN0IEFMTF9FVkVOVFM6IEV2ZW50RW1pdHRlcjxDbGllbnRFdmVudHM+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdHdvIGVudmlyb25tZW50IGRlc2NyaXB0aW9ucyByZWZlciB0byB0aGUgc2FtZSBDdWJlU2lnbmVyIGVudmlyb25tZW50LlxuICpcbiAqIEBwYXJhbSBsZWZ0IEZpcnN0IGVudmlyb25tZW50IHRvIGNvbXBhcmVcbiAqIEBwYXJhbSByaWdodCBTZWNvbmQgZW52aXJvbm1lbnQgdG8gY29tcGFyZVxuICogQHJldHVybnMgV2hldGhlciB0aGUgZW52aXJvbm1lbnRzIGFyZSBlcXVpdmFsZW50XG4gKi9cbmZ1bmN0aW9uIGVudkVxdWFscyhsZWZ0OiBFbnZJbnRlcmZhY2UsIHJpZ2h0OiBFbnZJbnRlcmZhY2UpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBsZWZ0LlNpZ25lckFwaVJvb3QgPT09IHJpZ2h0LlNpZ25lckFwaVJvb3QgJiZcbiAgICBsZWZ0Lk9yZ0V2ZW50c1RvcGljQXJuID09PSByaWdodC5PcmdFdmVudHNUb3BpY0FybiAmJlxuICAgIGxlZnQuUmVnaW9uID09PSByaWdodC5SZWdpb25cbiAgKTtcbn1cblxuLyoqXG4gKiBFbnN1cmUgYSBwcmVmZXJyZWQgZW52aXJvbm1lbnQgYmVsb25ncyB0byB0aGUgc2Vzc2lvbidzIGFkdmVydGlzZWQgZW52aXJvbm1lbnQgc2V0LlxuICpcbiAqIEBwYXJhbSBwcmVmZXJyZWRFbnYgVGhlIGNhbGxlci1yZXF1ZXN0ZWQgcHJlZmVycmVkIGVudmlyb25tZW50XG4gKiBAcGFyYW0gc2Vzc2lvbk1ldGEgVGhlIHNlc3Npb24gbWV0YWRhdGEgdGhhdCBsaXN0cyBhbGxvd2VkIGVudmlyb25tZW50c1xuICogQHJldHVybnMgVGhlIHZhbGlkYXRlZCBwcmVmZXJyZWQgZW52aXJvbm1lbnQsIGlmIGFueVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVByZWZlcnJlZEVudihcbiAgcHJlZmVycmVkRW52OiBFbnZJbnRlcmZhY2UgfCB1bmRlZmluZWQsXG4gIHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGEsXG4pOiBFbnZJbnRlcmZhY2UgfCB1bmRlZmluZWQge1xuICBpZiAocHJlZmVycmVkRW52ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKCFPYmplY3QudmFsdWVzKHNlc3Npb25NZXRhLmVudikuc29tZSgoZW52KSA9PiBlbnZFcXVhbHMoZW52LCBwcmVmZXJyZWRFbnYpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBUaGUgY3VycmVudCBzZXNzaW9uIGRvZXMgbm90IGFsbG93IHRoZSAnJHtwcmVmZXJyZWRFbnYuU2lnbmVyQXBpUm9vdH0nIGVudmlyb25tZW50YCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHByZWZlcnJlZEVudjtcbn1cblxuLyoqXG4gKiBDbGllbnQgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENsaWVudENvbmZpZyB7XG4gIC8qKiBVcGRhdGUgcmV0cnkgZGVsYXlzIChpbiBtaWxsaXNlY29uZHMpICovXG4gIHVwZGF0ZVJldHJ5RGVsYXlzTXM6IG51bWJlcltdO1xuXG4gIC8qKiBDdXN0b20gb3JpZ2luIHRvIHNldCAoTk9URSB0aGF0IGlmIHJ1bm5pbmcgaW4gYSBicm93c2VyLCB0aGUgYnJvd3NlciB3aWxsIG92ZXJ3cml0ZSB0aGlzKSAqL1xuICBvcmlnaW4/OiBzdHJpbmc7XG5cbiAgLyoqIEFkZGl0aW9uYWwgaGVhZGVycyB0byBzZXQgKGRlZmF1bHQgdG8gZW1wdHkpICovXG4gIGhlYWRlcnM6IEhlYWRlcnNJbml0O1xufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSByZXRyeSBzdHJhdGVneSBhbmQgc2Vzc2lvbiByZWZyZXNoZXNcbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDbGllbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8Q2xpZW50RXZlbnRzPiB7XG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgc2Vzc2lvbiBjb250YWluZWQgd2l0aGluIHRoZSBjbGllbnQgKi9cbiAgc2Vzc2lvbk1ldGE6IFNlc3Npb25NZXRhZGF0YTtcblxuICAvKiogU2Vzc2lvbiBwZXJzaXN0ZW5jZSAqL1xuICBwcm90ZWN0ZWQgc2Vzc2lvbk1hbmFnZXI6IFNlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKlxuICAgKiBUYXJnZXQgb3JnIGlkLCBpLmUuLCB0aGUgb3JnYW5pemF0aW9uIHRoaXMgY2xpZW50IHNob3VsZCBvcGVyYXRlIG9uLlxuICAgKlxuICAgKiBUaGUgb25seSBzY2VuYXJpbyBpbiB3aGljaCBpdCBtYWtlcyBzZW5zZSB0byB1c2UgYSB0YXJnZXQgb3JnYW5pemF0aW9uXG4gICAqIGRpZmZlcmVudCBmcm9tIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbiBpcyBpZiB0aGUgdGFyZ2V0IG9yZ2FuaXphdGlvbiBpc1xuICAgKiBhIGNoaWxkIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICovXG4gICN0YXJnZXRPcmdJZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBNVVRBQkxFIGNvbmZpZ3VyYXRpb24uICovXG4gIHJlYWRvbmx5IGNvbmZpZzogQ2xpZW50Q29uZmlnO1xuXG4gIHJlYWRvbmx5ICNwcmVmZXJyZWRFbnY6IEVudkludGVyZmFjZSB8IHVuZGVmaW5lZDtcblxuICAvKiogQHJldHVybnMgVGhlIGVudiAqL1xuICBnZXQgZW52KCk6IEVudkludGVyZmFjZSB7XG4gICAgcmV0dXJuIHRoaXMuI3ByZWZlcnJlZEVudiA/PyB0aGlzLnNlc3Npb25NZXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl07XG4gIH1cblxuICAvKiogQHJldHVybnMgQWxsIGF2YWlsYWJsZSByZWdpb25hbCBlbnZpcm9ubWVudHMgKi9cbiAgZ2V0IGVudnMoKTogRW52SW50ZXJmYWNlW10ge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKHRoaXMuc2Vzc2lvbk1ldGEuZW52KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBjbGllbnQgd2l0aCBhIHNlc3Npb24gb3Igc2Vzc2lvbiBtYW5hZ2VyXG4gICAqXG4gICAqIEBwYXJhbSB0aGlzIEFsbG93cyB0aGlzIHN0YXRpYyBtZXRob2QgdG8gcmV0dXJuIHN1YnR5cGVzIHdoZW4gaW52b2tlZCB0aHJvdWdoIHRoZW1cbiAgICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gKG9iamVjdCBvciBiYXNlNjQgc3RyaW5nKSBvciBtYW5hZ2VyIHRoYXQgd2lsbCBiYWNrIHRoaXMgY2xpZW50XG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi4gRGVmYXVsdHMgdG9cbiAgICogICB0aGUgb3JnIGlkIGZyb20gdGhlIHN1cHBsaWVkIHNlc3Npb24uIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZVxuICAgKiAgIGEge0BsaW5rIHRhcmdldE9yZ0lkfSBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmcgaWQgaXMgaWYge0BsaW5rIHRhcmdldE9yZ0lkfSBpcyBhXG4gICAqICAgY2hpbGQgb3JnYW5pemF0aW9uIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybnMgQSBDbGllbnRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGU8VD4oXG4gICAgdGhpczogU3RhdGljQ2xpZW50U3ViY2xhc3M8VD4sXG4gICAgc2Vzc2lvbjogc3RyaW5nIHwgU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSxcbiAgICB0YXJnZXRPcmdJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3Qgc2Vzc2lvbk9iajogU2Vzc2lvbk1hbmFnZXIgfCBTZXNzaW9uRGF0YSA9XG4gICAgICB0eXBlb2Ygc2Vzc2lvbiA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbikgOiBzZXNzaW9uO1xuXG4gICAgaWYgKHR5cGVvZiBzZXNzaW9uT2JqLnRva2VuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IG1hbmFnZXIgPSBzZXNzaW9uT2JqIGFzIFNlc3Npb25NYW5hZ2VyO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKGF3YWl0IG1hbmFnZXIubWV0YWRhdGEoKSwgbWFuYWdlciwgdGFyZ2V0T3JnSWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXNzaW9uID0gc2Vzc2lvbk9iaiBhcyBTZXNzaW9uRGF0YTtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhtZXRhZGF0YShzZXNzaW9uKSwgbmV3IE1lbW9yeVNlc3Npb25NYW5hZ2VyKHNlc3Npb24pLCB0YXJnZXRPcmdJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBzZXNzaW9uTWV0YSBUaGUgaW5pdGlhbCBzZXNzaW9uIG1ldGFkYXRhXG4gICAqIEBwYXJhbSBtYW5hZ2VyIFRoZSBtYW5hZ2VyIGZvciB0aGUgY3VycmVudCBzZXNzaW9uXG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGlzIGNsaWVudCBzaG91bGQgb3BlcmF0ZSBvbi4gRGVmYXVsdHMgdG9cbiAgICogICB0aGUgb3JnIGlkIGZyb20gdGhlIHN1cHBsaWVkIHNlc3Npb24uIFRoZSBvbmx5IHNjZW5hcmlvIGluIHdoaWNoIGl0IG1ha2VzIHNlbnNlIHRvIHVzZVxuICAgKiAgIGEge0BsaW5rIHRhcmdldE9yZ0lkfSBkaWZmZXJlbnQgZnJvbSB0aGUgc2Vzc2lvbiBvcmcgaWQgaXMgaWYge0BsaW5rIHRhcmdldE9yZ0lkfSBpcyBhXG4gICAqICAgY2hpbGQgb3JnYW5pemF0aW9uIG9mIHRoZSBzZXNzaW9uIG9yZ2FuaXphdGlvbi5cbiAgICogQHBhcmFtIGNvbmZpZyBDbGllbnQgY29uZmlndXJhdGlvblxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHNlc3Npb25NZXRhOiBTZXNzaW9uTWV0YWRhdGEsXG4gICAgbWFuYWdlcjogU2Vzc2lvbk1hbmFnZXIsXG4gICAgdGFyZ2V0T3JnSWQ/OiBzdHJpbmcsXG4gICAgY29uZmlnPzogQ2xpZW50Q29uZmlnICYge1xuICAgICAgcHJlZmVycmVkRW52PzogRW52SW50ZXJmYWNlO1xuICAgIH0sXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jdGFyZ2V0T3JnSWQgPSB0YXJnZXRPcmdJZDtcbiAgICB0aGlzLiNwcmVmZXJyZWRFbnYgPSB2YWxpZGF0ZVByZWZlcnJlZEVudihjb25maWc/LnByZWZlcnJlZEVudiwgc2Vzc2lvbk1ldGEpO1xuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuc2Vzc2lvbk1ldGEgPSBzZXNzaW9uTWV0YTtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIHVwZGF0ZVJldHJ5RGVsYXlzTXM6IFsxMDAsIDIwMCwgNDAwXSxcbiAgICAgIGhlYWRlcnM6IHt9LFxuICAgICAgb3JpZ2luOiB1bmRlZmluZWQsXG4gICAgICAuLi4oY29uZmlnID8/IHt9KSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBvcmdhbml6YXRpb24gSUQuIElmIHRoZSBvcmcgSUQgd2FzIHNldCBleHBsaWNpdGx5LCBpdCByZXR1cm5zIHRoYXQgSUQ7IG90aGVyd2lzZSBpdCByZXR1cm5zIHRoZSBzZXNzaW9uJ3Mgb3JnYW5pemF0aW9uIElELiAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3RhcmdldE9yZ0lkID8/IHRoaXMuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IHRoZSBzZXNzaW9uJ3MgaW1wbGljaXQgYXJndW1lbnRzIG9uIHRvcCBvZiB3aGF0IHdhcyBwcm92aWRlZFxuICAgKlxuICAgKiBAcGFyYW0gdG9rZW4gVGhlIGF1dGhvcml6YXRpb24gdG9rZW4gdG8gdXNlIGZvciB0aGUgcmVxdWVzdFxuICAgKiBAcGFyYW0gb3B0cyBUaGUgdXNlci1zdXBwbGllZCBvcHRzXG4gICAqIEByZXR1cm5zIFRoZSB1bmlvbiBvZiB0aGUgdXNlci1zdXBwbGllZCBvcHRzIGFuZCB0aGUgZGVmYXVsdCBvbmVzXG4gICAqL1xuICAjYXBwbHlPcHRpb25zPFQgZXh0ZW5kcyBPcGVyYXRpb24+KFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFNpbXBsZU9wdGlvbnM8VD4ge1xuICAgIGNvbnN0IHBhdGhQYXJhbXMgPSBcInBhdGhcIiBpbiAob3B0cy5wYXJhbXMgPz8ge30pID8gb3B0cy5wYXJhbXM/LnBhdGggOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgYmFzZVVybCA9IHRoaXMuZW52LlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuICAgIGNvbnN0IGJyb3dzZXJVc2VyQWdlbnQgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gbmF2aWdhdG9yPy51c2VyQWdlbnQgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNhY2hlOiBcIm5vLXN0b3JlXCIsXG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIGFjdGl2ZVNlc3Npb24sIGxldCBpdCBkaWN0YXRlIHRoZSBiYXNlVXJsLiBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBvbmUgc2V0IGF0IGNvbnN0cnVjdGlvblxuICAgICAgYmFzZVVybCxcbiAgICAgIC4uLm9wdHMsXG4gICAgICBoZWFkZXJzOiBtZXJnZUhlYWRlcnMoXG4gICAgICAgIHtcbiAgICAgICAgICBcIlVzZXItQWdlbnRcIjogYnJvd3NlclVzZXJBZ2VudCA/PyBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgICBcIlgtQ3ViaXN0LVRzLVNka1wiOiBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICAgICAgICBPcmlnaW46IHRoaXMuY29uZmlnLm9yaWdpbixcbiAgICAgICAgfSxcbiAgICAgICAgYXV0aEhlYWRlcih0b2tlbiksXG4gICAgICAgIHRoaXMuY29uZmlnLmhlYWRlcnMsXG4gICAgICAgIG9wdHMuaGVhZGVycyxcbiAgICAgICksXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgLi4ub3B0cy5wYXJhbXMsXG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICBvcmdfaWQ6IHRoaXMub3JnSWQsXG4gICAgICAgICAgLi4ucGF0aFBhcmFtcyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSBhcyB1bmtub3duIGFzIFNpbXBsZU9wdGlvbnM8VD47XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgc3BlY2lmaWMgZXJyb3IgZXZlbnRzIHdoZW4gYSByZXF1ZXN0IGZhaWxlZFxuICAgKlxuICAgKiBAcGFyYW0gZXJyIFRoZSBlcnJvciB0byBjbGFzc2lmeVxuICAgKi9cbiAgYXN5bmMgI2NsYXNzaWZ5QW5kRW1pdEVycm9yKGVycjogRXJyb3JFdmVudCkge1xuICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGVycik7XG4gICAgQUxMX0VWRU5UUy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblxuICAgIGlmIChlcnIuaXNVc2VyTWZhRXJyb3IoKSkge1xuICAgICAgY29uc3QgZXYgPSBcInVzZXItbWZhLWZhaWxlZFwiO1xuICAgICAgdGhpcy5lbWl0KGV2LCBlcnIpO1xuICAgICAgQUxMX0VWRU5UUy5lbWl0KGV2LCBlcnIpO1xuICAgIH1cblxuICAgIC8vIGlmIHN0YXR1cyBpcyA0MDMgYW5kIGVycm9yIG1hdGNoZXMgb25lIG9mIHRoZSBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIGNvZGVzIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZFxuICAgIC8vXG4gICAgLy8gVE9ETzogYmVjYXVzZSBlcnJvcnMgcmV0dXJuZWQgYnkgdGhlIGF1dGhvcml6ZXIgbGFtYmRhIGFyZSBub3QgZm9yd2FyZGVkIHRvIHRoZSBjbGllbnRcbiAgICAvLyAgICAgICB3ZSBhbHNvIHRyaWdnZXIgb25TZXNzaW9uRXhwaXJlZCB3aGVuIFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiBmYWlsc1xuICAgIGlmIChcbiAgICAgIGVyci5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKGVyci5pc1Nlc3Npb25FeHBpcmVkRXJyb3IoKSB8fCBlcnIub3BlcmF0aW9uID09IFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIilcbiAgICApIHtcbiAgICAgIGNvbnN0IGV2ID0gXCJzZXNzaW9uLWV4cGlyZWRcIjtcbiAgICAgIHRoaXMuZW1pdChldiwgZXJyKTtcbiAgICAgIEFMTF9FVkVOVFMuZW1pdChldiwgZXJyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgYW4gb3AgdXNpbmcgdGhlIHN0YXRlIG9mIHRoZSBjbGllbnQgKGF1dGggaGVhZGVycyAmIG9yZ19pZCkgd2l0aCByZXRyaWVzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gb3AgVGhlIEFQSSBvcGVyYXRpb24geW91IHdpc2ggdG8gcGVyZm9ybVxuICAgKiBAcGFyYW0gb3B0cyBUaGUgcGFyYW1ldGVycyBmb3IgdGhlIG9wZXJhdGlvblxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIHRoZSBzdWNjZXNzZnVsIHJlc3VsdCAoZXJyb3JzIHdpbGwgYmUgdGhyb3duKVxuICAgKi9cbiAgYXN5bmMgZXhlYzxUIGV4dGVuZHMgT3BlcmF0aW9uPihcbiAgICBvcDogT3A8VD4sXG4gICAgb3B0czogT21pdEF1dG9QYXJhbXM8U2ltcGxlT3B0aW9uczxUPj4sXG4gICk6IFByb21pc2U8RmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhPFQ+PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0b2tlbiA9IGF3YWl0IHRoaXMuc2Vzc2lvbk1hbmFnZXIudG9rZW4oKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXRyeSgoKSA9PiBvcCh0aGlzLiNhcHBseU9wdGlvbnModG9rZW4sIG9wdHMpKSwge1xuICAgICAgICBwcmVkOiBhc3luYyAocmVzcCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3AucmVzcG9uc2Uuc3RhdHVzO1xuICAgICAgICAgIGNvbnN0IGVycm9yID0gcmVzcC5lcnJvciBhcyBFcnJvclJlc3BvbnNlIHwgdW5kZWZpbmVkO1xuICAgICAgICAgIGNvbnN0IHJlcXVlc3RJZCA9IGVycm9yPy5yZXF1ZXN0X2lkO1xuXG4gICAgICAgICAgLy8gSWYgd2UgZ2V0IGEgXCJGb3JiaWRkZW5cIiBlcnJvciwgZXJhc2UgdGhlIGNhY2hlZCB0b2tlblxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gVE9ETzogQ2hlY2sgZXJyb3IgY29kZXMgb25jZSBvdXIgQVBJIHJldHVybnMgZXJyb3IgY29kZXMgZm9yXG4gICAgICAgICAgLy8gYXV0aG9yaXphdGlvbiBmYWlsdXJlc1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAgICAgICByZXF1ZXN0SWQgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgdGhpcy5zZXNzaW9uTWFuYWdlci5vbkludmFsaWRUb2tlbiAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnNlc3Npb25NYW5hZ2VyLm9uSW52YWxpZFRva2VuKCk7XG4gICAgICAgICAgICBjb25zdCBvbGRUb2tlbiA9IHRva2VuO1xuICAgICAgICAgICAgdG9rZW4gPSBhd2FpdCB0aGlzLnNlc3Npb25NYW5hZ2VyLnRva2VuKCk7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW4gIT09IG9sZFRva2VuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFsc28gcmV0cnkgc2VydmVyLXNpZGUgZXJyb3JzXG4gICAgICAgICAgcmV0dXJuIHN0YXR1cyA+PSA1MDAgJiYgc3RhdHVzIDwgNjAwO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICAvLyBPbmNlIHdlIGhhdmUgYSBub24tNVhYIHJlc3BvbnNlLCB3ZSB3aWxsIGFzc2VydE9rIChlaXRoZXIgdGhyb3dpbmcgb3IgeWllbGRpbmcgdGhlIHJlc3BvbnNlKVxuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyUmVzcG9uc2UpIHtcbiAgICAgICAgYXdhaXQgdGhpcy4jY2xhc3NpZnlBbmRFbWl0RXJyb3IoZSk7IC8vIEVtaXQgYXBwcm9wcmlhdGUgZXZlbnRzXG4gICAgICB9XG4gICAgICB0aHJvdyBlOyAvLyBSZXRocm93IHRoZSBlcnJvclxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZ3JhZGUgYSBzZXNzaW9uIHJlc3BvbnNlIGludG8gYSBmdWxsIFNlc3Npb25EYXRhIGJ5IGluY29ycG9yYXRpbmdcbiAqIGVsZW1lbnRzIG9mIGFuIGV4aXN0aW5nIFNlc3Npb25EYXRhXG4gKlxuICogQHBhcmFtIG1ldGEgQW4gZXhpc3RpbmcgU2Vzc2lvbkRhdGFcbiAqIEBwYXJhbSBpbmZvIEEgbmV3IHNlc3Npb24gY3JlYXRlZCB2aWEgdGhlIEFQSVxuICogQHBhcmFtIGN0eCBBZGRpdGlvbmFsIG1hbnVhbCBvdmVycmlkZXNcbiAqIEByZXR1cm5zIFNlc3Npb25EYXRhIHdpdGggbmV3IGluZm9ybWF0aW9uIGZyb20gaW5mbyBhbmQgY3R4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKFxuICBtZXRhOiBTZXNzaW9uTWV0YWRhdGEsXG4gIGluZm86IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgY3R4OiBQYXJ0aWFsPHsgcHVycG9zZTogc3RyaW5nOyByb2xlX2lkOiBzdHJpbmc7IG9yZ19pZDogc3RyaW5nIH0+LFxuKTogU2Vzc2lvbkRhdGEge1xuICByZXR1cm4ge1xuICAgIGVudjogbWV0YS5lbnYsXG4gICAgb3JnX2lkOiBtZXRhLm9yZ19pZCxcbiAgICBzZXNzaW9uX2V4cDogaW5mby5leHBpcmF0aW9uLFxuICAgIHNlc3Npb25faW5mbzogaW5mby5zZXNzaW9uX2luZm8sXG4gICAgdG9rZW46IGluZm8udG9rZW4sXG4gICAgcmVmcmVzaF90b2tlbjogaW5mby5yZWZyZXNoX3Rva2VuLFxuICAgIHB1cnBvc2U6IG1ldGEucHVycG9zZSxcbiAgICByb2xlX2lkOiBtZXRhLnJvbGVfaWQsXG4gICAgLi4uY3R4LFxuICB9O1xufVxuXG50eXBlIERlZXBPbWl0PEEsIEI+ID0gW0EsIEJdIGV4dGVuZHMgW29iamVjdCwgb2JqZWN0XVxuICA/IHtcbiAgICAgIFtLIGluIGtleW9mIEEgYXMgSyBleHRlbmRzIGtleW9mIEIgLy8gSWYgdGhlIGtleSBpcyBpbiBib3RoIEEgYW5kIEJcbiAgICAgICAgPyBBW0tdIGV4dGVuZHMgQltLXVxuICAgICAgICAgID8gSyAvL1xuICAgICAgICAgIDogbmV2ZXJcbiAgICAgICAgOiBuZXZlcl0/OiBLIGV4dGVuZHMga2V5b2YgQiA/IERlZXBPbWl0PEFbS10sIEJbS10+IDogbmV2ZXI7XG4gICAgfSAmIHtcbiAgICAgIFtLIGluIGtleW9mIEEgYXMgSyBleHRlbmRzIGtleW9mIEIgPyAoQltLXSBleHRlbmRzIEFbS10gPyBuZXZlciA6IEspIDogS106IEsgZXh0ZW5kcyBrZXlvZiBCXG4gICAgICAgID8gRGVlcE9taXQ8QVtLXSwgQltLXT5cbiAgICAgICAgOiBBW0tdO1xuICAgIH1cbiAgOiBBO1xuXG5leHBvcnQgdHlwZSBPbWl0QXV0b1BhcmFtczxPPiA9IERlZXBPbWl0PFxuICBPLFxuICB7XG4gICAgYmFzZVVybDogc3RyaW5nO1xuICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogc3RyaW5nIH0gfTtcbiAgfVxuPiAmIHsgcGFyYW1zPzogeyBwYXRoPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfSB9O1xuXG4vKipcbiAqIENyZWF0ZXMge0BsaW5rIEhlYWRlcnNJbml0fSBjb250YWluaW5nIGEgc2luZ2xlIFwiQXV0aG9yaXphdGlvblwiIGhlYWRlciB3aXRoIGEgZ2l2ZW4gdmFsdWUuXG4gKlxuICogQHBhcmFtIHRva2VuIFRoZSBcIkF1dGhvcml6YXRpb25cIiBoZWFkZXIgdmFsdWVcbiAqIEByZXR1cm5zIEEge0BsaW5rIEhlYWRlcnNJbml0fSBvYmplY3QgY29udGFpbmluZyBhIHNpbmdsZSBcIkF1dGhvcml6YXRpb25cIiBoZWFkZXIgd2l0aCBhIGdpdmVuIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXV0aEhlYWRlcih0b2tlbjogc3RyaW5nKTogSGVhZGVyc0luaXQge1xuICByZXR1cm4geyBBdXRob3JpemF0aW9uOiB0b2tlbiB9O1xufVxuIl19