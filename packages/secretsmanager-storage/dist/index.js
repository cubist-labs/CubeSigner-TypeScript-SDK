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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNEVBQWtHO0FBQ2xHLCtEQVFvQztBQWdCcEM7O0dBRUc7QUFDSCxNQUFhLHVCQUF1QjtJQWtCbEM7Ozs7O09BS0c7SUFDSCxZQUFZLFFBQWdCLEVBQUUsSUFBa0M7O1FBdkJoRSxnREFBK0M7UUFDL0MscUNBQXFDO1FBQ3JDLDhDQUFvQjtRQUNwQix1QkFBdUI7UUFDdkIscURBQW1CO1FBQ25CLGlDQUFpQztRQUNqQyxpREFTYztRQVNaLHVCQUFBLElBQUksK0JBQU8sSUFBSSx1Q0FBYyxDQUFDLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFBLENBQUM7UUFDM0MsdUJBQUEsSUFBSSxzQ0FBYyxRQUFRLE1BQUEsQ0FBQztRQUMzQix1QkFBQSxJQUFJLGtDQUFVLFNBQVMsTUFBQSxDQUFDO1FBQ3hCLHVCQUFBLElBQUksaUNBQVMsSUFBSSxNQUFBLENBQUM7SUFDcEIsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixLQUFLLENBQUMsY0FBYztRQUNsQix1QkFBQSxJQUFJLGtDQUFVLFNBQVMsTUFBQSxDQUFDO0lBQzFCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksbUZBQWdCLE1BQXBCLElBQUksQ0FBa0IsQ0FBQztRQUMxQyxPQUFPLElBQUEseUJBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLG1GQUFnQixNQUFwQixJQUFJLENBQWtCLENBQUM7UUFDMUMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Q0FtQ0Y7QUFqRkQsMERBaUZDOztBQWpD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c01hbmFnZXIsIHR5cGUgU2VjcmV0c01hbmFnZXJDbGllbnRDb25maWcgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LXNlY3JldHMtbWFuYWdlclwiO1xuaW1wb3J0IHtcbiAgdHlwZSBTZXNzaW9uRGF0YSxcbiAgdHlwZSBTZXNzaW9uTWFuYWdlcixcbiAgbWV0YWRhdGEsXG4gIHR5cGUgU2Vzc2lvbk1ldGFkYXRhLFxuICByZWZyZXNoLFxuICBwYXJzZUJhc2U2NFNlc3Npb25EYXRhLFxuICBzZXJpYWxpemVCYXNlNjRTZXNzaW9uRGF0YSxcbn0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5cbi8qKiBPcHRpb25zIGZvciBBV1MgU2VjcmV0cyBNYW5hZ2VyLWJhY2tlZCBzZXNzaW9uIG1hbmFnZXIgKi9cbmludGVyZmFjZSBBd3NTZWNyZXRTZXNzaW9uTWFuYWdlck9wdHMgZXh0ZW5kcyBTZWNyZXRzTWFuYWdlckNsaWVudENvbmZpZyB7XG4gIC8qKlxuICAgKiBMaW1pdCB0aGUgY2FjaGUgbGlmZXRpbWUgYnkgdGhlIHNjaGVkdWxlZCByb3RhdGlvbiBvZiB0aGUgc2VjcmV0IChkZWZhdWx0OiB0cnVlKVxuICAgKi9cbiAgY2hlY2tTY2hlZHVsZWRSb3RhdGlvbj86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBNYXhpbXVtIGFtb3VudCBvZiB0aW1lIHRoYXQgc2Vzc2lvbiBkYXRhIHdpbGwgYmUgY2FjaGVkIChkZWZhdWx0OiB1c2UgYXV0aCB0b2tlbiBsaWZldGltZSB0b1xuICAgKiBkZXRlcm1pbmUgY2FjaGUgbGlmZXRpbWUpLiBUaGlzIG9wdGlvbiBpcyB1c2VmdWwgaWYgdGhlIHNlc3Npb24gaXMgcmVmcmVzaGVkIGF0IHNvbWUga25vd25cbiAgICogaW50ZXJ2YWwgKGUuZy4sIGR1ZSB0byBhIHNlY3JldCByb3RhdGlvbiBzY2hlZHVsZSkuXG4gICAqL1xuICBtYXhDYWNoZUxpZmV0aW1lPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIEEgc2Vzc2lvbiBtYW5hZ2VyIHRoYXQgcmVhZHMgYSB0b2tlbiBmcm9tIGEgc2VjcmV0IHN0b3JlZCBpbiBBV1MgU2VjcmV0cyBNYW5hZ2VyLlxuICovXG5leHBvcnQgY2xhc3MgQXdzU2VjcmV0U2Vzc2lvbk1hbmFnZXIgaW1wbGVtZW50cyBTZXNzaW9uTWFuYWdlciB7XG4gICNvcHRzOiBBd3NTZWNyZXRTZXNzaW9uTWFuYWdlck9wdHMgfCB1bmRlZmluZWQ7XG4gIC8qKiBDbGllbnQgZm9yIEFXUyBTZWNyZXRzIE1hbmFnZXIgKi9cbiAgI3NtOiBTZWNyZXRzTWFuYWdlcjtcbiAgLyoqIElEIG9mIHRoZSBzZWNyZXQgKi9cbiAgI3NlY3JldEFybjogc3RyaW5nO1xuICAvKiogQ2FjaGUgZm9yIHRoZSBzZXNzaW9uIGRhdGEgKi9cbiAgI2NhY2hlOlxuICAgIHwge1xuICAgICAgICAvKiogVGhlIHNlc3Npb24gZGF0YSAqL1xuICAgICAgICBzZXNzaW9uRGF0YTogU2Vzc2lvbkRhdGE7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZXhwaXJhdGlvbiBvZiB0aGUgY2FjaGUgKG1heSBiZSBkaWZmZXJlbnQgZnJvbSB0aGUgZXhwaXJhdGlvbiB0aW1lIG9mIHRoZSB0b2tlbiBpdHNlbGYpXG4gICAgICAgICAqL1xuICAgICAgICBleHA6IG51bWJlcjtcbiAgICAgIH1cbiAgICB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBzZWNyZXRJZCBUaGUgbmFtZSBvZiB0aGUgc2VjcmV0IGhvbGRpbmcgdGhlIHRva2VuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbnMgZm9yIHRoZSBzZXNzaW9uIG1hbmFnZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlY3JldElkOiBzdHJpbmcsIG9wdHM/OiBBd3NTZWNyZXRTZXNzaW9uTWFuYWdlck9wdHMpIHtcbiAgICB0aGlzLiNzbSA9IG5ldyBTZWNyZXRzTWFuYWdlcih7IC4uLm9wdHMgfSk7XG4gICAgdGhpcy4jc2VjcmV0QXJuID0gc2VjcmV0SWQ7XG4gICAgdGhpcy4jY2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy4jb3B0cyA9IG9wdHM7XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgYXN5bmMgb25JbnZhbGlkVG9rZW4oKSB7XG4gICAgdGhpcy4jY2FjaGUgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jZ2V0U2Vzc2lvbkRhdGEoKTtcbiAgICByZXR1cm4gbWV0YWRhdGEoZGF0YSk7XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jZ2V0U2Vzc2lvbkRhdGEoKTtcbiAgICByZXR1cm4gZGF0YS50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHNlc3Npb24gZGF0YSBlaXRoZXIgZnJvbSBjYWNoZSBvciBmcm9tIEFXUyBTZWNyZXRzIE1hbmFnZXIgaWYgbm8gdW5leHBpcmVkIGNhY2hlZFxuICAgKiBpbmZvcm1hdGlvbiBpcyBhdmFpbGFibGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIGRhdGFcbiAgICovXG4gIGFzeW5jICNnZXRTZXNzaW9uRGF0YSgpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgaWYgKHRoaXMuI2NhY2hlICE9PSB1bmRlZmluZWQgJiYgdGhpcy4jY2FjaGUuZXhwID4gRGF0ZS5ub3coKSAvIDEwMDApIHtcbiAgICAgIHJldHVybiB0aGlzLiNjYWNoZS5zZXNzaW9uRGF0YTtcbiAgICB9XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzbS5nZXRTZWNyZXRWYWx1ZSh7IFNlY3JldElkOiB0aGlzLiNzZWNyZXRBcm4gfSk7XG4gICAgY29uc3Qgc2Vzc2lvbkRhdGEgPSBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHJlcy5TZWNyZXRTdHJpbmchKTtcbiAgICBjb25zdCBtYXhDYWNoZUxpZmV0aW1lID0gdGhpcy4jb3B0cz8ubWF4Q2FjaGVMaWZldGltZTtcbiAgICBsZXQgZXhwID1cbiAgICAgIG1heENhY2hlTGlmZXRpbWUgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IE1hdGgubWluKERhdGUubm93KCkgLyAxMDAwICsgbWF4Q2FjaGVMaWZldGltZSwgc2Vzc2lvbkRhdGEuc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwKVxuICAgICAgICA6IHNlc3Npb25EYXRhLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cDtcblxuICAgIC8vIExpbWl0IGNhY2hlIGxpZmV0aW1lIGJ5IHRoZSBuZXh0IHNjaGVkdWxlZCByb3RhdGlvbiBpZiB0aGUgdXNlciByZXF1ZXN0ZWQgaXRcbiAgICBpZiAodGhpcy4jb3B0cz8uY2hlY2tTY2hlZHVsZWRSb3RhdGlvbiA/PyB0cnVlKSB7XG4gICAgICBjb25zdCBkZXNjID0gYXdhaXQgdGhpcy4jc20uZGVzY3JpYmVTZWNyZXQoeyBTZWNyZXRJZDogdGhpcy4jc2VjcmV0QXJuIH0pO1xuICAgICAgaWYgKGRlc2MuTmV4dFJvdGF0aW9uRGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGV4cCA9IE1hdGgubWluKGV4cCwgZGVzYy5OZXh0Um90YXRpb25EYXRlLmdldFRpbWUoKSAvIDEwMDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuI2NhY2hlID0ge1xuICAgICAgc2Vzc2lvbkRhdGEsXG4gICAgICBleHAsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy4jY2FjaGUuc2Vzc2lvbkRhdGE7XG4gIH1cbn1cblxuLyoqIE1hbmFnZXMgc2Vzc2lvbiBkYXRhIHN0b3JlZCBpbiBhIHNlY3JldCBpbiBBV1MgU2VjcmV0cyBNYWFuZ2VyICovXG5leHBvcnQgY2xhc3MgQXdzU2VjcmV0TWFuYWdlciB7XG4gIC8qKiBDbGllbnQgZm9yIEFXUyBTZWNyZXRzIE1hbmFnZXIgKi9cbiAgI3NtOiBTZWNyZXRzTWFuYWdlcjtcbiAgLyoqIElEIG9mIHRoZSBzZWNyZXQgKi9cbiAgI3NlY3JldEFybjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXcml0ZXMgc2Vzc2lvbiBkYXRhIHRvIHRoZSBzZWNyZXQuXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIGRhdGEgdG8gd3JpdGVcbiAgICovXG4gIGFzeW5jIHVwZGF0ZShzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuI3NtLnVwZGF0ZVNlY3JldCh7XG4gICAgICBTZWNyZXRJZDogdGhpcy4jc2VjcmV0QXJuLFxuICAgICAgU2VjcmV0U3RyaW5nOiBzZXJpYWxpemVCYXNlNjRTZXNzaW9uRGF0YShzZXNzaW9uKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24gYW5kIHdyaXRlcyB0aGUgbmV3IHNlc3Npb24gdG8gQVdTIFNlY3JldHMgTWFuYWdlci5cbiAgICovXG4gIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc20uZ2V0U2VjcmV0VmFsdWUoeyBTZWNyZXRJZDogdGhpcy4jc2VjcmV0QXJuIH0pO1xuICAgIGNvbnN0IG5ld1Nlc3Npb25EYXRhID0gYXdhaXQgcmVmcmVzaChwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHJlcy5TZWNyZXRTdHJpbmchKSk7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUobmV3U2Vzc2lvbkRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gc2VjcmV0SWQgVGhlIG5hbWUgb2YgdGhlIHNlY3JldCBob2xkaW5nIHRoZSB0b2tlblxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2VjcmV0SWQ6IHN0cmluZykge1xuICAgIHRoaXMuI3NtID0gbmV3IFNlY3JldHNNYW5hZ2VyKCk7XG4gICAgdGhpcy4jc2VjcmV0QXJuID0gc2VjcmV0SWQ7XG4gIH1cbn1cbiJdfQ==