"use strict";
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
var _SignerSessionManager_instances, _a, _SignerSessionManager_eventEmitter, _SignerSessionManager_refreshing, _SignerSessionManager_client, _SignerSessionManager_createClient, _SignerSessionManager_hasTimestampExpired;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerSessionManager = void 0;
const events_1 = require("../events");
const api_1 = require("../api");
const session_storage_1 = require("./session_storage");
const util_1 = require("../util");
const events_2 = require("../events");
const error_1 = require("../error");
const DEFAULT_EXPIRATION_BUFFER_SECS = 30;
/**
 * Constructs {@link Date} from a number representing seconds since unix epoch.
 * @param {number} secs Seconds since unix epoch.
 * @return {Date} The equivalent date.
 */
function secondsSinceEpochToDate(secs) {
    return new Date(secs * 1000);
}
/** Generic session manager interface. */
class SignerSessionManager {
    /**
     * @return {string} The current auth token.
     * @internal
     */
    async token() {
        const session = await this.storage.retrieve();
        return session.token;
    }
    /**
     * Refreshes the current session if needed, then returns a client using the current session.
     *
     * May **UPDATE/MUTATE** self.
     *
     * @param {operations} operation The operation that this client will be
     *   used for. This parameter is used exclusively for more accurate error
     *   reporting and does not affect functionality.
     * @return {Client} The client with the current session
     */
    async client(operation) {
        await this.refreshIfNeeded();
        // trigger "session expired" if the session as a whole has expired
        // or if (for whatever reason) the token is still stale
        if (__classPrivateFieldGet(_a, _a, "m", _SignerSessionManager_hasTimestampExpired).call(_a, __classPrivateFieldGet(this, _SignerSessionManager_client, "f").token_exp) || this.hasExpired()) {
            await __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f").emitSessionExpired();
            throw new error_1.SessionExpiredError(operation);
        }
        return __classPrivateFieldGet(this, _SignerSessionManager_client, "f").client;
    }
    /** Revokes the session. */
    async revoke() {
        const client = new api_1.OpClient("revokeCurrentSession", await this.client(), __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f"));
        await client.del("/v0/org/{org_id}/session/self", {
            params: { path: { org_id: this.orgId } },
        });
    }
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    async refresh() {
        if (this.hasExpired()) {
            await __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f").emitSessionExpired();
            throw new error_1.SessionExpiredError("signerSessionRefresh");
        }
        const currSession = await this.storage.retrieve();
        const client = new api_1.OpClient("signerSessionRefresh", __classPrivateFieldGet(this, _SignerSessionManager_client, "f").client, __classPrivateFieldGet(this, _SignerSessionManager_eventEmitter, "f"));
        const csi = currSession.session_info;
        const data = await client.patch("/v1/org/{org_id}/token/refresh", {
            params: { path: { org_id: this.orgId } },
            body: {
                epoch_num: csi.epoch,
                epoch_token: csi.epoch_token,
                other_token: csi.refresh_token,
            },
        });
        const newSession = {
            ...currSession,
            session_info: data.session_info,
            token: data.token,
        };
        await this.storage.save(newSession);
        __classPrivateFieldSet(this, _SignerSessionManager_client, {
            client: __classPrivateFieldGet(this, _SignerSessionManager_instances, "m", _SignerSessionManager_createClient).call(this, newSession.token),
            token_exp: secondsSinceEpochToDate(newSession.session_info.auth_token_exp),
            session_exp: newSession.session_exp
                ? secondsSinceEpochToDate(newSession.session_exp)
                : undefined,
        }, "f");
    }
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    async isStale() {
        return __classPrivateFieldGet(_a, _a, "m", _SignerSessionManager_hasTimestampExpired).call(_a, __classPrivateFieldGet(this, _SignerSessionManager_client, "f").token_exp, DEFAULT_EXPIRATION_BUFFER_SECS);
    }
    /**
     * Return whether this session has expired and cannot be refreshed anymore.
     * @return {boolean} Whether this session has expired.
     * @internal
     */
    hasExpired() {
        return ((__classPrivateFieldGet(this, _SignerSessionManager_client, "f").session_exp || false) &&
            __classPrivateFieldGet(_a, _a, "m", _SignerSessionManager_hasTimestampExpired).call(_a, __classPrivateFieldGet(this, _SignerSessionManager_client, "f").session_exp));
    }
    /**
     * Refreshes the session if it is about to expire.
     * @return {boolean} Whether the session token was refreshed.
     * @internal
     */
    async refreshIfNeeded() {
        if (await this.isStale()) {
            if (__classPrivateFieldGet(this, _SignerSessionManager_refreshing, "f")) {
                // wait until done refreshing
                while (__classPrivateFieldGet(this, _SignerSessionManager_refreshing, "f")) {
                    await (0, util_1.delay)(100);
                }
                return false;
            }
            else {
                // refresh
                __classPrivateFieldSet(this, _SignerSessionManager_refreshing, true, "f");
                try {
                    await this.refresh();
                    return true;
                }
                finally {
                    __classPrivateFieldSet(this, _SignerSessionManager_refreshing, false, "f");
                }
            }
        }
        return false;
    }
    /**
     * Automatically refreshes the session in the background (if needed) every
     * minute. This is a simple wrapper around `setInterval`.
     * @return {number} The interval ID of the refresh timer.
     */
    autoRefresh() {
        return setInterval(async () => {
            await this.refreshIfNeeded();
        }, 60 * 1000);
    }
    /**
     * Clears the auto refresh timer.
     * @param {number} timer The timer ID to clear.
     */
    clearAutoRefresh(timer) {
        clearInterval(timer);
    }
    /**
     * @param {EnvInterface} env The CubeSigner environment
     * @param {string} orgId The organization ID
     * @param {NewSessionResponse} session The session information.
     * @param {SignerSessionStorage} storage The storage to use for saving the session.
     * @return {Promise<SignerSessionManager>} New signer session manager.
     */
    static async createFromSessionInfo(env, orgId, session, storage) {
        const sessionData = {
            env: {
                ["Dev-CubeSignerStack"]: env,
            },
            org_id: orgId,
            token: session.token,
            purpose: "sign via oidc",
            session_info: session.session_info,
            session_exp: session.expiration,
        };
        storage ??= new session_storage_1.MemorySessionStorage();
        await storage.save(sessionData);
        return await _a.loadFromStorage(storage);
    }
    /**
     * @param {SignerSessionData} sessionData The session information.
     * @param {SignerSessionStorage} storage The storage to use for saving the session.
     * @return {Promise<SignerSessionManager>} New signer session manager.
     */
    static async createFromSessionData(sessionData, storage) {
        storage ??= new session_storage_1.MemorySessionStorage();
        await storage.save(sessionData);
        return await _a.loadFromStorage(storage);
    }
    /**
     * Uses an existing session to create a new signer session manager.
     *
     * @param {SignerSessionStorage} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session manager
     */
    static async loadFromStorage(storage) {
        const session = await storage.retrieve();
        return new _a(session, storage);
    }
    /**
     * Constructor.
     * @param {SignerSessionData} sessionData Session data
     * @param {SignerSessionStorage} storage The session storage to use.
     */
    constructor(sessionData, storage) {
        _SignerSessionManager_instances.add(this);
        this.events = new events_1.Events();
        _SignerSessionManager_eventEmitter.set(this, void 0);
        _SignerSessionManager_refreshing.set(this, false);
        _SignerSessionManager_client.set(this, void 0);
        this.env = sessionData.env["Dev-CubeSignerStack"];
        this.orgId = sessionData.org_id;
        this.storage = storage;
        __classPrivateFieldSet(this, _SignerSessionManager_eventEmitter, new events_2.EventEmitter([this.events]), "f");
        __classPrivateFieldSet(this, _SignerSessionManager_client, {
            client: __classPrivateFieldGet(this, _SignerSessionManager_instances, "m", _SignerSessionManager_createClient).call(this, sessionData.token),
            token_exp: secondsSinceEpochToDate(sessionData.session_info.auth_token_exp),
            session_exp: sessionData.session_exp
                ? secondsSinceEpochToDate(sessionData.session_exp)
                : undefined,
        }, "f");
    }
}
exports.SignerSessionManager = SignerSessionManager;
_a = SignerSessionManager, _SignerSessionManager_eventEmitter = new WeakMap(), _SignerSessionManager_refreshing = new WeakMap(), _SignerSessionManager_client = new WeakMap(), _SignerSessionManager_instances = new WeakSet(), _SignerSessionManager_createClient = function _SignerSessionManager_createClient(token) {
    return (0, api_1.createHttpClient)(this.env.SignerApiRoot, token);
}, _SignerSessionManager_hasTimestampExpired = function _SignerSessionManager_hasTimestampExpired(exp, bufferSeconds) {
    bufferSeconds ??= 0;
    const expMsSinceEpoch = exp.getTime();
    const nowMsSinceEpoch = new Date().getTime();
    const bufferMs = bufferSeconds * 1000;
    return expMsSinceEpoch < nowMsSinceEpoch + bufferMs;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb25fbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0NBQW1DO0FBRW5DLGdDQUE0RDtBQUM1RCx1REFBeUU7QUFDekUsa0NBQWdDO0FBTWhDLHNDQUF5QztBQUN6QyxvQ0FBK0M7QUFHL0MsTUFBTSw4QkFBOEIsR0FBRyxFQUFFLENBQUM7QUFzQjFDOzs7O0dBSUc7QUFDSCxTQUFTLHVCQUF1QixDQUFDLElBQVk7SUFDM0MsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQWdCRCx5Q0FBeUM7QUFDekMsTUFBYSxvQkFBb0I7SUFTL0I7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQTRCO1FBQ3ZDLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRTdCLGtFQUFrRTtRQUNsRSx1REFBdUQ7UUFDdkQsSUFBSSx1QkFBQSxFQUFvQixxREFBcUIsTUFBekMsRUFBb0IsRUFBc0IsdUJBQUEsSUFBSSxvQ0FBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO1lBQzNGLE1BQU0sdUJBQUEsSUFBSSwwQ0FBYyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDOUMsTUFBTSxJQUFJLDJCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxPQUFPLHVCQUFBLElBQUksb0NB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QVksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFBLENBQUM7UUFDckQsdUJBQUEsSUFBSSxnQ0FBVztZQUNiLE1BQU0sRUFBRSx1QkFBQSxJQUFJLDJFQUFjLE1BQWxCLElBQUksRUFBZSxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQzdDLFNBQVMsRUFBRSx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQztZQUMzRSxXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7Z0JBQ2xDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO2dCQUNsRCxDQUFDLENBQUMsU0FBUztTQUNkLE1BQUEsQ0FBQztJQUNKLENBQUM7Q0F3QkY7QUEzUEQsb0RBMlBDO2lUQWpCZSxLQUFhO0lBQ3pCLE9BQU8sSUFBQSxzQkFBZ0IsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN6RCxDQUFDLGlHQVEyQixHQUFTLEVBQUUsYUFBc0I7SUFDM0QsYUFBYSxLQUFLLENBQUMsQ0FBQztJQUNwQixNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QyxNQUFNLFFBQVEsR0FBRyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQ3RDLE9BQU8sZUFBZSxHQUFHLGVBQWUsR0FBRyxRQUFRLENBQUM7QUFDdEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50cyB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcbmltcG9ydCB7IENsaWVudCwgY3JlYXRlSHR0cENsaWVudCwgT3BDbGllbnQgfSBmcm9tIFwiLi4vYXBpXCI7XG5pbXBvcnQgeyBNZW1vcnlTZXNzaW9uU3RvcmFnZSwgU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uX3N0b3JhZ2VcIjtcbmltcG9ydCB7IGRlbGF5IH0gZnJvbSBcIi4uL3V0aWxcIjtcbmltcG9ydCB7XG4gIENsaWVudFNlc3Npb25JbmZvLFxuICBOZXdTZXNzaW9uUmVzcG9uc2UsXG4gIFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdCxcbn0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4uL2V2ZW50c1wiO1xuaW1wb3J0IHsgU2Vzc2lvbkV4cGlyZWRFcnJvciB9IGZyb20gXCIuLi9lcnJvclwiO1xuaW1wb3J0IHsgb3BlcmF0aW9ucyB9IGZyb20gXCIuLi9zY2hlbWFcIjtcblxuY29uc3QgREVGQVVMVF9FWFBJUkFUSU9OX0JVRkZFUl9TRUNTID0gMzA7XG5cbi8qKiBKU09OIHJlcHJlc2VudGF0aW9uIG9mIG91ciBcInNpZ25lciBzZXNzaW9uXCIgZmlsZSBmb3JtYXQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyU2Vzc2lvbkRhdGEge1xuICAvKiogVGhlIG9yZ2FuaXphdGlvbiBJRCAqL1xuICBvcmdfaWQ6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIElEICovXG4gIHJvbGVfaWQ/OiBzdHJpbmc7XG4gIC8qKiBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvbiB0b2tlbiAqL1xuICBwdXJwb3NlPzogc3RyaW5nO1xuICAvKiogVGhlIHRva2VuIHRvIGluY2x1ZGUgaW4gQXV0aG9yaXphdGlvbiBoZWFkZXIgKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFNlc3Npb24gaW5mbyAqL1xuICBzZXNzaW9uX2luZm86IENsaWVudFNlc3Npb25JbmZvO1xuICAvKiogU2Vzc2lvbiBleHBpcmF0aW9uIChpbiBzZWNvbmRzIHNpbmNlIFVOSVggZXBvY2gpIGJleW9uZCB3aGljaCBpdCBjYW5ub3QgYmUgcmVmcmVzaGVkICovXG4gIHNlc3Npb25fZXhwOiBudW1iZXIgfCB1bmRlZmluZWQ7IC8vIG1heSBiZSBtaXNzaW5nIGluIGxlZ2FjeSBzZXNzaW9uIGZpbGVzXG4gIC8qKiBUaGUgZW52aXJvbm1lbnQgKi9cbiAgZW52OiB7XG4gICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogRW52SW50ZXJmYWNlO1xuICB9O1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMge0BsaW5rIERhdGV9IGZyb20gYSBudW1iZXIgcmVwcmVzZW50aW5nIHNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzZWNzIFNlY29uZHMgc2luY2UgdW5peCBlcG9jaC5cbiAqIEByZXR1cm4ge0RhdGV9IFRoZSBlcXVpdmFsZW50IGRhdGUuXG4gKi9cbmZ1bmN0aW9uIHNlY29uZHNTaW5jZUVwb2NoVG9EYXRlKHNlY3M6IG51bWJlcik6IERhdGUge1xuICByZXR1cm4gbmV3IERhdGUoc2VjcyAqIDEwMDApO1xufVxuXG4vKiogVHlwZSBvZiBzdG9yYWdlIHJlcXVpcmVkIGZvciBzaWduZXIgc2Vzc2lvbnMgKi9cbmV4cG9ydCB0eXBlIFNpZ25lclNlc3Npb25TdG9yYWdlID0gU2Vzc2lvblN0b3JhZ2U8U2lnbmVyU2Vzc2lvbkRhdGE+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lclNlc3Npb25MaWZldGltZSB7XG4gIC8qKiBTZXNzaW9uIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIHdlZWsgKDYwNDgwMCkuICovXG4gIHNlc3Npb24/OiBudW1iZXI7XG4gIC8qKiBBdXRoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gZml2ZSBtaW51dGVzICgzMDApLiAqL1xuICBhdXRoOiBudW1iZXI7XG4gIC8qKiBSZWZyZXNoIHRva2VuIGxpZmV0aW1lIChpbiBzZWNvbmRzKS4gRGVmYXVsdHMgdG8gb25lIGRheSAoODY0MDApLiAqL1xuICByZWZyZXNoPzogbnVtYmVyO1xuICAvKiogR3JhY2UgbGlmZXRpbWUgKGluIHNlY29uZHMpLiBEZWZhdWx0cyB0byAzMCBzZWNvbmRzICgzMCkuICovXG4gIGdyYWNlPzogbnVtYmVyO1xufVxuXG4vKiogR2VuZXJpYyBzZXNzaW9uIG1hbmFnZXIgaW50ZXJmYWNlLiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lclNlc3Npb25NYW5hZ2VyIHtcbiAgcmVhZG9ubHkgZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5IG9yZ0lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlO1xuICByZWFkb25seSBldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIHJlYWRvbmx5ICNldmVudEVtaXR0ZXI6IEV2ZW50RW1pdHRlcjtcbiAgI3JlZnJlc2hpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgI2NsaWVudDogeyBjbGllbnQ6IENsaWVudDsgdG9rZW5fZXhwOiBEYXRlOyBzZXNzaW9uX2V4cD86IERhdGUgfTtcblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3VycmVudCBhdXRoIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBzZXNzaW9uLnRva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgY3VycmVudCBzZXNzaW9uIGlmIG5lZWRlZCwgdGhlbiByZXR1cm5zIGEgY2xpZW50IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIE1heSAqKlVQREFURS9NVVRBVEUqKiBzZWxmLlxuICAgKlxuICAgKiBAcGFyYW0ge29wZXJhdGlvbnN9IG9wZXJhdGlvbiBUaGUgb3BlcmF0aW9uIHRoYXQgdGhpcyBjbGllbnQgd2lsbCBiZVxuICAgKiAgIHVzZWQgZm9yLiBUaGlzIHBhcmFtZXRlciBpcyB1c2VkIGV4Y2x1c2l2ZWx5IGZvciBtb3JlIGFjY3VyYXRlIGVycm9yXG4gICAqICAgcmVwb3J0aW5nIGFuZCBkb2VzIG5vdCBhZmZlY3QgZnVuY3Rpb25hbGl0eS5cbiAgICogQHJldHVybiB7Q2xpZW50fSBUaGUgY2xpZW50IHdpdGggdGhlIGN1cnJlbnQgc2Vzc2lvblxuICAgKi9cbiAgYXN5bmMgY2xpZW50KG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnMpOiBQcm9taXNlPENsaWVudD4ge1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaElmTmVlZGVkKCk7XG5cbiAgICAvLyB0cmlnZ2VyIFwic2Vzc2lvbiBleHBpcmVkXCIgaWYgdGhlIHNlc3Npb24gYXMgYSB3aG9sZSBoYXMgZXhwaXJlZFxuICAgIC8vIG9yIGlmIChmb3Igd2hhdGV2ZXIgcmVhc29uKSB0aGUgdG9rZW4gaXMgc3RpbGwgc3RhbGVcbiAgICBpZiAoU2lnbmVyU2Vzc2lvbk1hbmFnZXIuI2hhc1RpbWVzdGFtcEV4cGlyZWQodGhpcy4jY2xpZW50LnRva2VuX2V4cCkgfHwgdGhpcy5oYXNFeHBpcmVkKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuI2V2ZW50RW1pdHRlci5lbWl0U2Vzc2lvbkV4cGlyZWQoKTtcbiAgICAgIHRocm93IG5ldyBTZXNzaW9uRXhwaXJlZEVycm9yKG9wZXJhdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudC5jbGllbnQ7XG4gIH1cblxuICAvKiogUmV2b2tlcyB0aGUgc2Vzc2lvbi4gKi9cbiAgYXN5bmMgcmV2b2tlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBPcENsaWVudChcInJldm9rZUN1cnJlbnRTZXNzaW9uXCIsIGF3YWl0IHRoaXMuY2xpZW50KCksIHRoaXMuI2V2ZW50RW1pdHRlcik7XG4gICAgYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvbi9zZWxmXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBzZXNzaW9uIGFuZCAqKlVQREFURVMvTVVUQVRFUyoqIHNlbGYuXG4gICAqL1xuICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmhhc0V4cGlyZWQoKSkge1xuICAgICAgYXdhaXQgdGhpcy4jZXZlbnRFbWl0dGVyLmVtaXRTZXNzaW9uRXhwaXJlZCgpO1xuICAgICAgdGhyb3cgbmV3IFNlc3Npb25FeHBpcmVkRXJyb3IoXCJzaWduZXJTZXNzaW9uUmVmcmVzaFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyU2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuXG4gICAgY29uc3QgY2xpZW50ID0gbmV3IE9wQ2xpZW50KFwic2lnbmVyU2Vzc2lvblJlZnJlc2hcIiwgdGhpcy4jY2xpZW50LmNsaWVudCwgdGhpcy4jZXZlbnRFbWl0dGVyKTtcbiAgICBjb25zdCBjc2kgPSBjdXJyU2Vzc2lvbi5zZXNzaW9uX2luZm87XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wYXRjaChcIi92MS9vcmcve29yZ19pZH0vdG9rZW4vcmVmcmVzaFwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogPFJlZnJlc2hTaWduZXJTZXNzaW9uUmVxdWVzdD57XG4gICAgICAgIGVwb2NoX251bTogY3NpLmVwb2NoLFxuICAgICAgICBlcG9jaF90b2tlbjogY3NpLmVwb2NoX3Rva2VuLFxuICAgICAgICBvdGhlcl90b2tlbjogY3NpLnJlZnJlc2hfdG9rZW4sXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnN0IG5ld1Nlc3Npb24gPSA8U2lnbmVyU2Vzc2lvbkRhdGE+e1xuICAgICAgLi4uY3VyclNlc3Npb24sXG4gICAgICBzZXNzaW9uX2luZm86IGRhdGEuc2Vzc2lvbl9pbmZvLFxuICAgICAgdG9rZW46IGRhdGEudG9rZW4sXG4gICAgfTtcblxuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlKG5ld1Nlc3Npb24pO1xuICAgIHRoaXMuI2NsaWVudCA9IHtcbiAgICAgIGNsaWVudDogdGhpcy4jY3JlYXRlQ2xpZW50KG5ld1Nlc3Npb24udG9rZW4pLFxuICAgICAgdG9rZW5fZXhwOiBzZWNvbmRzU2luY2VFcG9jaFRvRGF0ZShuZXdTZXNzaW9uLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cCksXG4gICAgICBzZXNzaW9uX2V4cDogbmV3U2Vzc2lvbi5zZXNzaW9uX2V4cFxuICAgICAgICA/IHNlY29uZHNTaW5jZUVwb2NoVG9EYXRlKG5ld1Nlc3Npb24uc2Vzc2lvbl9leHApXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBTaWduZXJTZXNzaW9uTWFuYWdlci4jaGFzVGltZXN0YW1wRXhwaXJlZChcbiAgICAgIHRoaXMuI2NsaWVudC50b2tlbl9leHAsXG4gICAgICBERUZBVUxUX0VYUElSQVRJT05fQlVGRkVSX1NFQ1MsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIHNlc3Npb24gaGFzIGV4cGlyZWQgYW5kIGNhbm5vdCBiZSByZWZyZXNoZWQgYW55bW9yZS5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGlzIHNlc3Npb24gaGFzIGV4cGlyZWQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgaGFzRXhwaXJlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgKHRoaXMuI2NsaWVudC5zZXNzaW9uX2V4cCB8fCBmYWxzZSkgJiZcbiAgICAgIFNpZ25lclNlc3Npb25NYW5hZ2VyLiNoYXNUaW1lc3RhbXBFeHBpcmVkKHRoaXMuI2NsaWVudC5zZXNzaW9uX2V4cClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBpZiBpdCBpcyBhYm91dCB0byBleHBpcmUuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHNlc3Npb24gdG9rZW4gd2FzIHJlZnJlc2hlZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyByZWZyZXNoSWZOZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMuaXNTdGFsZSgpKSB7XG4gICAgICBpZiAodGhpcy4jcmVmcmVzaGluZykge1xuICAgICAgICAvLyB3YWl0IHVudGlsIGRvbmUgcmVmcmVzaGluZ1xuICAgICAgICB3aGlsZSAodGhpcy4jcmVmcmVzaGluZykge1xuICAgICAgICAgIGF3YWl0IGRlbGF5KDEwMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcmVmcmVzaFxuICAgICAgICB0aGlzLiNyZWZyZXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICB0aGlzLiNyZWZyZXNoaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQXV0b21hdGljYWxseSByZWZyZXNoZXMgdGhlIHNlc3Npb24gaW4gdGhlIGJhY2tncm91bmQgKGlmIG5lZWRlZCkgZXZlcnlcbiAgICogbWludXRlLiBUaGlzIGlzIGEgc2ltcGxlIHdyYXBwZXIgYXJvdW5kIGBzZXRJbnRlcnZhbGAuXG4gICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGludGVydmFsIElEIG9mIHRoZSByZWZyZXNoIHRpbWVyLlxuICAgKi9cbiAgYXV0b1JlZnJlc2goKTogUmVmcmVzaElkIHtcbiAgICByZXR1cm4gc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoSWZOZWVkZWQoKTtcbiAgICB9LCA2MCAqIDEwMDApO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgYXV0byByZWZyZXNoIHRpbWVyLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZXIgVGhlIHRpbWVyIElEIHRvIGNsZWFyLlxuICAgKi9cbiAgY2xlYXJBdXRvUmVmcmVzaCh0aW1lcjogUmVmcmVzaElkKTogdm9pZCB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgQ3ViZVNpZ25lciBlbnZpcm9ubWVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge05ld1Nlc3Npb25SZXNwb25zZX0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSB0byB1c2UgZm9yIHNhdmluZyB0aGUgc2Vzc2lvbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IE5ldyBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZUZyb21TZXNzaW9uSW5mbyhcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNlc3Npb246IE5ld1Nlc3Npb25SZXNwb25zZSxcbiAgICBzdG9yYWdlPzogU2lnbmVyU2Vzc2lvblN0b3JhZ2UsXG4gICk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uRGF0YSA9IHtcbiAgICAgIGVudjoge1xuICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBlbnYsXG4gICAgICB9LFxuICAgICAgb3JnX2lkOiBvcmdJZCxcbiAgICAgIHRva2VuOiBzZXNzaW9uLnRva2VuLFxuICAgICAgcHVycG9zZTogXCJzaWduIHZpYSBvaWRjXCIsXG4gICAgICBzZXNzaW9uX2luZm86IHNlc3Npb24uc2Vzc2lvbl9pbmZvLFxuICAgICAgc2Vzc2lvbl9leHA6IHNlc3Npb24uZXhwaXJhdGlvbiEsXG4gICAgfTtcbiAgICBzdG9yYWdlID8/PSBuZXcgTWVtb3J5U2Vzc2lvblN0b3JhZ2UoKTtcbiAgICBhd2FpdCBzdG9yYWdlLnNhdmUoc2Vzc2lvbkRhdGEpO1xuICAgIHJldHVybiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uRGF0YX0gc2Vzc2lvbkRhdGEgVGhlIHNlc3Npb24gaW5mb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgdG8gdXNlIGZvciBzYXZpbmcgdGhlIHNlc3Npb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbk1hbmFnZXI+fSBOZXcgc2lnbmVyIHNlc3Npb24gbWFuYWdlci5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVGcm9tU2Vzc2lvbkRhdGEoXG4gICAgc2Vzc2lvbkRhdGE6IFNpZ25lclNlc3Npb25EYXRhLFxuICAgIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIHN0b3JhZ2UgPz89IG5ldyBNZW1vcnlTZXNzaW9uU3RvcmFnZSgpO1xuICAgIGF3YWl0IHN0b3JhZ2Uuc2F2ZShzZXNzaW9uRGF0YSk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VzIGFuIGV4aXN0aW5nIHNlc3Npb24gdG8gY3JlYXRlIGEgbmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb25NYW5hZ2VyPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gbmV3IFNpZ25lclNlc3Npb25NYW5hZ2VyKHNlc3Npb24sIHN0b3JhZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25EYXRhfSBzZXNzaW9uRGF0YSBTZXNzaW9uIGRhdGFcbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25EYXRhOiBTaWduZXJTZXNzaW9uRGF0YSwgc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpIHtcbiAgICB0aGlzLmVudiA9IHNlc3Npb25EYXRhLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl07XG4gICAgdGhpcy5vcmdJZCA9IHNlc3Npb25EYXRhLm9yZ19pZDtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICAgIHRoaXMuI2V2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoW3RoaXMuZXZlbnRzXSk7XG4gICAgdGhpcy4jY2xpZW50ID0ge1xuICAgICAgY2xpZW50OiB0aGlzLiNjcmVhdGVDbGllbnQoc2Vzc2lvbkRhdGEudG9rZW4pLFxuICAgICAgdG9rZW5fZXhwOiBzZWNvbmRzU2luY2VFcG9jaFRvRGF0ZShzZXNzaW9uRGF0YS5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHApLFxuICAgICAgc2Vzc2lvbl9leHA6IHNlc3Npb25EYXRhLnNlc3Npb25fZXhwXG4gICAgICAgID8gc2Vjb25kc1NpbmNlRXBvY2hUb0RhdGUoc2Vzc2lvbkRhdGEuc2Vzc2lvbl9leHApXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBSRVNUIGNsaWVudCB3aXRoIGEgZ2l2ZW4gdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIFRoZSBhdXRob3JpemF0aW9uIHRva2VuIHRvIHVzZSBmb3IgdGhlIGNsaWVudFxuICAgKiBAcmV0dXJuIHtDbGllbnR9IFRoZSBuZXcgUkVTVCBjbGllbnRcbiAgICovXG4gICNjcmVhdGVDbGllbnQodG9rZW46IHN0cmluZyk6IENsaWVudCB7XG4gICAgcmV0dXJuIGNyZWF0ZUh0dHBDbGllbnQodGhpcy5lbnYuU2lnbmVyQXBpUm9vdCwgdG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgdGltZXN0YW1wIGlzIHdpdGhpbiB7QGxpbmsgYnVmZmVyU2Vjb25kc30gc2Vjb25kcyBmcm9tIGV4cGlyYXRpb24uXG4gICAqIEBwYXJhbSB7RGF0ZX0gZXhwIFRoZSB0aW1lc3RhbXAgdG8gY2hlY2tcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJ1ZmZlclNlY29uZHMgVGltZSBidWZmZXIgaW4gc2Vjb25kcyAoZGVmYXVsdHMgdG8gMHMpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHRpbWVzdGFtcCBoYXMgZXhwaXJlZFxuICAgKi9cbiAgc3RhdGljICNoYXNUaW1lc3RhbXBFeHBpcmVkKGV4cDogRGF0ZSwgYnVmZmVyU2Vjb25kcz86IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGJ1ZmZlclNlY29uZHMgPz89IDA7XG4gICAgY29uc3QgZXhwTXNTaW5jZUVwb2NoID0gZXhwLmdldFRpbWUoKTtcbiAgICBjb25zdCBub3dNc1NpbmNlRXBvY2ggPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBjb25zdCBidWZmZXJNcyA9IGJ1ZmZlclNlY29uZHMgKiAxMDAwO1xuICAgIHJldHVybiBleHBNc1NpbmNlRXBvY2ggPCBub3dNc1NpbmNlRXBvY2ggKyBidWZmZXJNcztcbiAgfVxufVxuXG4vKiogVHlwZSBvZiB0aGUgcmVmcmVzaCB0aW1lciBJRC4gKi9cbmV4cG9ydCB0eXBlIFJlZnJlc2hJZCA9IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPjtcbiJdfQ==