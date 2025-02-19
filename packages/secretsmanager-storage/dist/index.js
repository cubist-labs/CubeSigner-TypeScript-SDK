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
var _AwsSecretSessionManager_instances, _AwsSecretSessionManager_opts, _AwsSecretSessionManager_sm, _AwsSecretSessionManager_secretArn, _AwsSecretSessionManager_cache, _AwsSecretSessionManager_getSessionData, _AwsSecretManager_sm, _AwsSecretManager_secretArn;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSecretManager = exports.AwsSecretSessionManager = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
/**
 * A session manager that reads a token from a secret stored in AWS Secrets Manager.
 */
class AwsSecretSessionManager {
    /**
     * Constructor.
     *
     * @param secretId The name of the secret holding the token
     * @param opts Options for the session manager
     */
    constructor(secretId, opts) {
        _AwsSecretSessionManager_instances.add(this);
        _AwsSecretSessionManager_opts.set(this, void 0);
        /** Client for AWS Secrets Manager */
        _AwsSecretSessionManager_sm.set(this, void 0);
        /** ID of the secret */
        _AwsSecretSessionManager_secretArn.set(this, void 0);
        /** Cache for the session data */
        _AwsSecretSessionManager_cache.set(this, void 0);
        __classPrivateFieldSet(this, _AwsSecretSessionManager_sm, new client_secrets_manager_1.SecretsManager({ ...opts }), "f");
        __classPrivateFieldSet(this, _AwsSecretSessionManager_secretArn, secretId, "f");
        __classPrivateFieldSet(this, _AwsSecretSessionManager_cache, undefined, "f");
        __classPrivateFieldSet(this, _AwsSecretSessionManager_opts, opts, "f");
    }
    /** @inheritdoc */
    async onInvalidToken() {
        __classPrivateFieldSet(this, _AwsSecretSessionManager_cache, undefined, "f");
    }
    /** @inheritdoc */
    async metadata() {
        const data = await __classPrivateFieldGet(this, _AwsSecretSessionManager_instances, "m", _AwsSecretSessionManager_getSessionData).call(this);
        return (0, cubesigner_sdk_1.metadata)(data);
    }
    /** @inheritdoc */
    async token() {
        const data = await __classPrivateFieldGet(this, _AwsSecretSessionManager_instances, "m", _AwsSecretSessionManager_getSessionData).call(this);
        return data.token;
    }
}
exports.AwsSecretSessionManager = AwsSecretSessionManager;
_AwsSecretSessionManager_opts = new WeakMap(), _AwsSecretSessionManager_sm = new WeakMap(), _AwsSecretSessionManager_secretArn = new WeakMap(), _AwsSecretSessionManager_cache = new WeakMap(), _AwsSecretSessionManager_instances = new WeakSet(), _AwsSecretSessionManager_getSessionData = 
/**
 * Get the session data either from cache or from AWS Secrets Manager if no unexpired cached
 * information is available.
 *
 * @returns The session data
 */
async function _AwsSecretSessionManager_getSessionData() {
    if (__classPrivateFieldGet(this, _AwsSecretSessionManager_cache, "f") !== undefined && __classPrivateFieldGet(this, _AwsSecretSessionManager_cache, "f").exp > Date.now() / 1000) {
        return __classPrivateFieldGet(this, _AwsSecretSessionManager_cache, "f").sessionData;
    }
    const res = await __classPrivateFieldGet(this, _AwsSecretSessionManager_sm, "f").getSecretValue({ SecretId: __classPrivateFieldGet(this, _AwsSecretSessionManager_secretArn, "f") });
    const sessionData = (0, cubesigner_sdk_1.parseBase64SessionData)(res.SecretString);
    const maxCacheLifetime = __classPrivateFieldGet(this, _AwsSecretSessionManager_opts, "f")?.maxCacheLifetime;
    let exp = maxCacheLifetime !== undefined
        ? Math.min(Date.now() / 1000 + maxCacheLifetime, sessionData.session_info.auth_token_exp)
        : sessionData.session_info.auth_token_exp;
    // Limit cache lifetime by the next scheduled rotation if the user requested it
    if (__classPrivateFieldGet(this, _AwsSecretSessionManager_opts, "f")?.checkScheduledRotation ?? true) {
        const desc = await __classPrivateFieldGet(this, _AwsSecretSessionManager_sm, "f").describeSecret({ SecretId: __classPrivateFieldGet(this, _AwsSecretSessionManager_secretArn, "f") });
        if (desc.NextRotationDate !== undefined) {
            exp = Math.min(exp, desc.NextRotationDate.getTime() / 1000);
        }
    }
    __classPrivateFieldSet(this, _AwsSecretSessionManager_cache, {
        sessionData,
        exp,
    }, "f");
    return __classPrivateFieldGet(this, _AwsSecretSessionManager_cache, "f").sessionData;
};
/** Manages session data stored in a secret in AWS Secrets Maanger */
class AwsSecretManager {
    /**
     * Writes session data to the secret.
     *
     * @param session The session data to write
     */
    async update(session) {
        await __classPrivateFieldGet(this, _AwsSecretManager_sm, "f").updateSecret({
            SecretId: __classPrivateFieldGet(this, _AwsSecretManager_secretArn, "f"),
            SecretString: (0, cubesigner_sdk_1.serializeBase64SessionData)(session),
        });
    }
    /**
     * Refreshes the session and writes the new session to AWS Secrets Manager.
     */
    async refresh() {
        const res = await __classPrivateFieldGet(this, _AwsSecretManager_sm, "f").getSecretValue({ SecretId: __classPrivateFieldGet(this, _AwsSecretManager_secretArn, "f") });
        const newSessionData = await (0, cubesigner_sdk_1.refresh)((0, cubesigner_sdk_1.parseBase64SessionData)(res.SecretString));
        await this.update(newSessionData);
    }
    /**
     * Constructor.
     *
     * @param secretId The name of the secret holding the token
     */
    constructor(secretId) {
        /** Client for AWS Secrets Manager */
        _AwsSecretManager_sm.set(this, void 0);
        /** ID of the secret */
        _AwsSecretManager_secretArn.set(this, void 0);
        __classPrivateFieldSet(this, _AwsSecretManager_sm, new client_secrets_manager_1.SecretsManager(), "f");
        __classPrivateFieldSet(this, _AwsSecretManager_secretArn, secretId, "f");
    }
}
exports.AwsSecretManager = AwsSecretManager;
_AwsSecretManager_sm = new WeakMap(), _AwsSecretManager_secretArn = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNEVBQWtHO0FBQ2xHLGdFQVFxQztBQWdCckM7O0dBRUc7QUFDSCxNQUFhLHVCQUF1QjtJQWtCbEM7Ozs7O09BS0c7SUFDSCxZQUFZLFFBQWdCLEVBQUUsSUFBa0M7O1FBdkJoRSxnREFBK0M7UUFDL0MscUNBQXFDO1FBQ3JDLDhDQUFvQjtRQUNwQix1QkFBdUI7UUFDdkIscURBQW1CO1FBQ25CLGlDQUFpQztRQUNqQyxpREFTYztRQVNaLHVCQUFBLElBQUksK0JBQU8sSUFBSSx1Q0FBYyxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFBLENBQUM7UUFDM0MsdUJBQUEsSUFBSSxzQ0FBYyxRQUFRLE1BQUEsQ0FBQztRQUMzQix1QkFBQSxJQUFJLGtDQUFVLFNBQVMsTUFBQSxDQUFDO1FBQ3hCLHVCQUFBLElBQUksaUNBQVMsSUFBSSxNQUFBLENBQUM7SUFDcEIsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixLQUFLLENBQUMsY0FBYztRQUNsQix1QkFBQSxJQUFJLGtDQUFVLFNBQVMsTUFBQSxDQUFDO0lBQzFCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksbUZBQWdCLE1BQXBCLElBQUksQ0FBa0IsQ0FBQztRQUMxQyxPQUFPLElBQUEseUJBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLG1GQUFnQixNQUFwQixJQUFJLENBQWtCLENBQUM7UUFDMUMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Q0FtQ0Y7QUFqRkQsMERBaUZDOztBQWpD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c01hbmFnZXIsIHR5cGUgU2VjcmV0c01hbmFnZXJDbGllbnRDb25maWcgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LXNlY3JldHMtbWFuYWdlclwiO1xuaW1wb3J0IHtcbiAgdHlwZSBTZXNzaW9uRGF0YSxcbiAgdHlwZSBTZXNzaW9uTWFuYWdlcixcbiAgbWV0YWRhdGEsXG4gIHR5cGUgU2Vzc2lvbk1ldGFkYXRhLFxuICByZWZyZXNoLFxuICBwYXJzZUJhc2U2NFNlc3Npb25EYXRhLFxuICBzZXJpYWxpemVCYXNlNjRTZXNzaW9uRGF0YSxcbn0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuXG4vKiogT3B0aW9ucyBmb3IgQVdTIFNlY3JldHMgTWFuYWdlci1iYWNrZWQgc2Vzc2lvbiBtYW5hZ2VyICovXG5pbnRlcmZhY2UgQXdzU2VjcmV0U2Vzc2lvbk1hbmFnZXJPcHRzIGV4dGVuZHMgU2VjcmV0c01hbmFnZXJDbGllbnRDb25maWcge1xuICAvKipcbiAgICogTGltaXQgdGhlIGNhY2hlIGxpZmV0aW1lIGJ5IHRoZSBzY2hlZHVsZWQgcm90YXRpb24gb2YgdGhlIHNlY3JldCAoZGVmYXVsdDogdHJ1ZSlcbiAgICovXG4gIGNoZWNrU2NoZWR1bGVkUm90YXRpb24/OiBib29sZWFuO1xuICAvKipcbiAgICogTWF4aW11bSBhbW91bnQgb2YgdGltZSB0aGF0IHNlc3Npb24gZGF0YSB3aWxsIGJlIGNhY2hlZCAoZGVmYXVsdDogdXNlIGF1dGggdG9rZW4gbGlmZXRpbWUgdG9cbiAgICogZGV0ZXJtaW5lIGNhY2hlIGxpZmV0aW1lKS4gVGhpcyBvcHRpb24gaXMgdXNlZnVsIGlmIHRoZSBzZXNzaW9uIGlzIHJlZnJlc2hlZCBhdCBzb21lIGtub3duXG4gICAqIGludGVydmFsIChlLmcuLCBkdWUgdG8gYSBzZWNyZXQgcm90YXRpb24gc2NoZWR1bGUpLlxuICAgKi9cbiAgbWF4Q2FjaGVMaWZldGltZT86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIHNlc3Npb24gbWFuYWdlciB0aGF0IHJlYWRzIGEgdG9rZW4gZnJvbSBhIHNlY3JldCBzdG9yZWQgaW4gQVdTIFNlY3JldHMgTWFuYWdlci5cbiAqL1xuZXhwb3J0IGNsYXNzIEF3c1NlY3JldFNlc3Npb25NYW5hZ2VyIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXIge1xuICAjb3B0czogQXdzU2VjcmV0U2Vzc2lvbk1hbmFnZXJPcHRzIHwgdW5kZWZpbmVkO1xuICAvKiogQ2xpZW50IGZvciBBV1MgU2VjcmV0cyBNYW5hZ2VyICovXG4gICNzbTogU2VjcmV0c01hbmFnZXI7XG4gIC8qKiBJRCBvZiB0aGUgc2VjcmV0ICovXG4gICNzZWNyZXRBcm46IHN0cmluZztcbiAgLyoqIENhY2hlIGZvciB0aGUgc2Vzc2lvbiBkYXRhICovXG4gICNjYWNoZTpcbiAgICB8IHtcbiAgICAgICAgLyoqIFRoZSBzZXNzaW9uIGRhdGEgKi9cbiAgICAgICAgc2Vzc2lvbkRhdGE6IFNlc3Npb25EYXRhO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGV4cGlyYXRpb24gb2YgdGhlIGNhY2hlIChtYXkgYmUgZGlmZmVyZW50IGZyb20gdGhlIGV4cGlyYXRpb24gdGltZSBvZiB0aGUgdG9rZW4gaXRzZWxmKVxuICAgICAgICAgKi9cbiAgICAgICAgZXhwOiBudW1iZXI7XG4gICAgICB9XG4gICAgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gc2VjcmV0SWQgVGhlIG5hbWUgb2YgdGhlIHNlY3JldCBob2xkaW5nIHRoZSB0b2tlblxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25zIGZvciB0aGUgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZWNyZXRJZDogc3RyaW5nLCBvcHRzPzogQXdzU2VjcmV0U2Vzc2lvbk1hbmFnZXJPcHRzKSB7XG4gICAgdGhpcy4jc20gPSBuZXcgU2VjcmV0c01hbmFnZXIoeyAuLi5vcHRzIH0pO1xuICAgIHRoaXMuI3NlY3JldEFybiA9IHNlY3JldElkO1xuICAgIHRoaXMuI2NhY2hlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuI29wdHMgPSBvcHRzO1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGFzeW5jIG9uSW52YWxpZFRva2VuKCkge1xuICAgIHRoaXMuI2NhY2hlID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8U2Vzc2lvbk1ldGFkYXRhPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2dldFNlc3Npb25EYXRhKCk7XG4gICAgcmV0dXJuIG1ldGFkYXRhKGRhdGEpO1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2dldFNlc3Npb25EYXRhKCk7XG4gICAgcmV0dXJuIGRhdGEudG9rZW47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzZXNzaW9uIGRhdGEgZWl0aGVyIGZyb20gY2FjaGUgb3IgZnJvbSBBV1MgU2VjcmV0cyBNYW5hZ2VyIGlmIG5vIHVuZXhwaXJlZCBjYWNoZWRcbiAgICogaW5mb3JtYXRpb24gaXMgYXZhaWxhYmxlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBkYXRhXG4gICAqL1xuICBhc3luYyAjZ2V0U2Vzc2lvbkRhdGEoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIGlmICh0aGlzLiNjYWNoZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuI2NhY2hlLmV4cCA+IERhdGUubm93KCkgLyAxMDAwKSB7XG4gICAgICByZXR1cm4gdGhpcy4jY2FjaGUuc2Vzc2lvbkRhdGE7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc20uZ2V0U2VjcmV0VmFsdWUoeyBTZWNyZXRJZDogdGhpcy4jc2VjcmV0QXJuIH0pO1xuICAgIGNvbnN0IHNlc3Npb25EYXRhID0gcGFyc2VCYXNlNjRTZXNzaW9uRGF0YShyZXMuU2VjcmV0U3RyaW5nISk7XG4gICAgY29uc3QgbWF4Q2FjaGVMaWZldGltZSA9IHRoaXMuI29wdHM/Lm1heENhY2hlTGlmZXRpbWU7XG4gICAgbGV0IGV4cCA9XG4gICAgICBtYXhDYWNoZUxpZmV0aW1lICE9PSB1bmRlZmluZWRcbiAgICAgICAgPyBNYXRoLm1pbihEYXRlLm5vdygpIC8gMTAwMCArIG1heENhY2hlTGlmZXRpbWUsIHNlc3Npb25EYXRhLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cClcbiAgICAgICAgOiBzZXNzaW9uRGF0YS5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHA7XG5cbiAgICAvLyBMaW1pdCBjYWNoZSBsaWZldGltZSBieSB0aGUgbmV4dCBzY2hlZHVsZWQgcm90YXRpb24gaWYgdGhlIHVzZXIgcmVxdWVzdGVkIGl0XG4gICAgaWYgKHRoaXMuI29wdHM/LmNoZWNrU2NoZWR1bGVkUm90YXRpb24gPz8gdHJ1ZSkge1xuICAgICAgY29uc3QgZGVzYyA9IGF3YWl0IHRoaXMuI3NtLmRlc2NyaWJlU2VjcmV0KHsgU2VjcmV0SWQ6IHRoaXMuI3NlY3JldEFybiB9KTtcbiAgICAgIGlmIChkZXNjLk5leHRSb3RhdGlvbkRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBleHAgPSBNYXRoLm1pbihleHAsIGRlc2MuTmV4dFJvdGF0aW9uRGF0ZS5nZXRUaW1lKCkgLyAxMDAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLiNjYWNoZSA9IHtcbiAgICAgIHNlc3Npb25EYXRhLFxuICAgICAgZXhwLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuI2NhY2hlLnNlc3Npb25EYXRhO1xuICB9XG59XG5cbi8qKiBNYW5hZ2VzIHNlc3Npb24gZGF0YSBzdG9yZWQgaW4gYSBzZWNyZXQgaW4gQVdTIFNlY3JldHMgTWFhbmdlciAqL1xuZXhwb3J0IGNsYXNzIEF3c1NlY3JldE1hbmFnZXIge1xuICAvKiogQ2xpZW50IGZvciBBV1MgU2VjcmV0cyBNYW5hZ2VyICovXG4gICNzbTogU2VjcmV0c01hbmFnZXI7XG4gIC8qKiBJRCBvZiB0aGUgc2VjcmV0ICovXG4gICNzZWNyZXRBcm46IHN0cmluZztcblxuICAvKipcbiAgICogV3JpdGVzIHNlc3Npb24gZGF0YSB0byB0aGUgc2VjcmV0LlxuICAgKlxuICAgKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBkYXRhIHRvIHdyaXRlXG4gICAqL1xuICBhc3luYyB1cGRhdGUoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLiNzbS51cGRhdGVTZWNyZXQoe1xuICAgICAgU2VjcmV0SWQ6IHRoaXMuI3NlY3JldEFybixcbiAgICAgIFNlY3JldFN0cmluZzogc2VyaWFsaXplQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbiksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBzZXNzaW9uIGFuZCB3cml0ZXMgdGhlIG5ldyBzZXNzaW9uIHRvIEFXUyBTZWNyZXRzIE1hbmFnZXIuXG4gICAqL1xuICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NtLmdldFNlY3JldFZhbHVlKHsgU2VjcmV0SWQ6IHRoaXMuI3NlY3JldEFybiB9KTtcbiAgICBjb25zdCBuZXdTZXNzaW9uRGF0YSA9IGF3YWl0IHJlZnJlc2gocGFyc2VCYXNlNjRTZXNzaW9uRGF0YShyZXMuU2VjcmV0U3RyaW5nISkpO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKG5ld1Nlc3Npb25EYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHNlY3JldElkIFRoZSBuYW1lIG9mIHRoZSBzZWNyZXQgaG9sZGluZyB0aGUgdG9rZW5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlY3JldElkOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNzbSA9IG5ldyBTZWNyZXRzTWFuYWdlcigpO1xuICAgIHRoaXMuI3NlY3JldEFybiA9IHNlY3JldElkO1xuICB9XG59XG4iXX0=