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
        __classPrivateFieldSet(this, _AwsSecretSessionManager_sm, new client_secrets_manager_1.SecretsManager(), "f");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNEVBQWlFO0FBQ2pFLGdFQVFxQztBQWdCckM7O0dBRUc7QUFDSCxNQUFhLHVCQUF1QjtJQWtCbEM7Ozs7O09BS0c7SUFDSCxZQUFZLFFBQWdCLEVBQUUsSUFBa0M7O1FBdkJoRSxnREFBK0M7UUFDL0MscUNBQXFDO1FBQ3JDLDhDQUFvQjtRQUNwQix1QkFBdUI7UUFDdkIscURBQW1CO1FBQ25CLGlDQUFpQztRQUNqQyxpREFTYztRQVNaLHVCQUFBLElBQUksK0JBQU8sSUFBSSx1Q0FBYyxFQUFFLE1BQUEsQ0FBQztRQUNoQyx1QkFBQSxJQUFJLHNDQUFjLFFBQVEsTUFBQSxDQUFDO1FBQzNCLHVCQUFBLElBQUksa0NBQVUsU0FBUyxNQUFBLENBQUM7UUFDeEIsdUJBQUEsSUFBSSxpQ0FBUyxJQUFJLE1BQUEsQ0FBQztJQUNwQixDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLEtBQUssQ0FBQyxjQUFjO1FBQ2xCLHVCQUFBLElBQUksa0NBQVUsU0FBUyxNQUFBLENBQUM7SUFDMUIsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixLQUFLLENBQUMsUUFBUTtRQUNaLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxtRkFBZ0IsTUFBcEIsSUFBSSxDQUFrQixDQUFDO1FBQzFDLE9BQU8sSUFBQSx5QkFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksbUZBQWdCLE1BQXBCLElBQUksQ0FBa0IsQ0FBQztRQUMxQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztDQW1DRjtBQWpGRCwwREFpRkM7O0FBakNDOzs7OztHQUtHO0FBQ0gsS0FBSztJQUNILElBQUksdUJBQUEsSUFBSSxzQ0FBTyxLQUFLLFNBQVMsSUFBSSx1QkFBQSxJQUFJLHNDQUFPLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQztRQUNyRSxPQUFPLHVCQUFBLElBQUksc0NBQU8sQ0FBQyxXQUFXLENBQUM7SUFDakMsQ0FBQztJQUVELE1BQU0sR0FBRyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxtQ0FBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBQSxJQUFJLDBDQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3pFLE1BQU0sV0FBVyxHQUFHLElBQUEsdUNBQXNCLEVBQUMsR0FBRyxDQUFDLFlBQWEsQ0FBQyxDQUFDO0lBQzlELE1BQU0sZ0JBQWdCLEdBQUcsdUJBQUEsSUFBSSxxQ0FBTSxFQUFFLGdCQUFnQixDQUFDO0lBQ3RELElBQUksR0FBRyxHQUNMLGdCQUFnQixLQUFLLFNBQVM7UUFDNUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQztRQUN6RixDQUFDLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUM7SUFFOUMsK0VBQStFO0lBQy9FLElBQUksdUJBQUEsSUFBSSxxQ0FBTSxFQUFFLHNCQUFzQixJQUFJLElBQUksRUFBRSxDQUFDO1FBQy9DLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxtQ0FBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBQSxJQUFJLDBDQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLElBQUksSUFBSSxDQUFDLGdCQUFnQixLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3hDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDOUQsQ0FBQztJQUNILENBQUM7SUFFRCx1QkFBQSxJQUFJLGtDQUFVO1FBQ1osV0FBVztRQUNYLEdBQUc7S0FDSixNQUFBLENBQUM7SUFDRixPQUFPLHVCQUFBLElBQUksc0NBQU8sQ0FBQyxXQUFXLENBQUM7QUFDakMsQ0FBQztBQUdILHFFQUFxRTtBQUNyRSxNQUFhLGdCQUFnQjtJQU0zQjs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFvQjtRQUMvQixNQUFNLHVCQUFBLElBQUksNEJBQUksQ0FBQyxZQUFZLENBQUM7WUFDMUIsUUFBUSxFQUFFLHVCQUFBLElBQUksbUNBQVc7WUFDekIsWUFBWSxFQUFFLElBQUEsMkNBQTBCLEVBQUMsT0FBTyxDQUFDO1NBQ2xELENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDRCQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsUUFBUSxFQUFFLHVCQUFBLElBQUksbUNBQVcsRUFBRSxDQUFDLENBQUM7UUFDekUsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFBLHdCQUFPLEVBQUMsSUFBQSx1Q0FBc0IsRUFBQyxHQUFHLENBQUMsWUFBYSxDQUFDLENBQUMsQ0FBQztRQUNoRixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxZQUFZLFFBQWdCO1FBL0I1QixxQ0FBcUM7UUFDckMsdUNBQW9CO1FBQ3BCLHVCQUF1QjtRQUN2Qiw4Q0FBbUI7UUE2QmpCLHVCQUFBLElBQUksd0JBQU8sSUFBSSx1Q0FBYyxFQUFFLE1BQUEsQ0FBQztRQUNoQyx1QkFBQSxJQUFJLCtCQUFjLFFBQVEsTUFBQSxDQUFDO0lBQzdCLENBQUM7Q0FDRjtBQXBDRCw0Q0FvQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZWNyZXRzTWFuYWdlciB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtc2VjcmV0cy1tYW5hZ2VyXCI7XG5pbXBvcnQge1xuICB0eXBlIFNlc3Npb25EYXRhLFxuICB0eXBlIFNlc3Npb25NYW5hZ2VyLFxuICBtZXRhZGF0YSxcbiAgdHlwZSBTZXNzaW9uTWV0YWRhdGEsXG4gIHJlZnJlc2gsXG4gIHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEsXG4gIHNlcmlhbGl6ZUJhc2U2NFNlc3Npb25EYXRhLFxufSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5cbi8qKiBPcHRpb25zIGZvciBBV1MgU2VjcmV0cyBNYW5hZ2VyLWJhY2tlZCBzZXNzaW9uIG1hbmFnZXIgKi9cbmludGVyZmFjZSBBd3NTZWNyZXRTZXNzaW9uTWFuYWdlck9wdHMge1xuICAvKipcbiAgICogTGltaXQgdGhlIGNhY2hlIGxpZmV0aW1lIGJ5IHRoZSBzY2hlZHVsZWQgcm90YXRpb24gb2YgdGhlIHNlY3JldCAoZGVmYXVsdDogdHJ1ZSlcbiAgICovXG4gIGNoZWNrU2NoZWR1bGVkUm90YXRpb24/OiBib29sZWFuO1xuICAvKipcbiAgICogTWF4aW11bSBhbW91bnQgb2YgdGltZSB0aGF0IHNlc3Npb24gZGF0YSB3aWxsIGJlIGNhY2hlZCAoZGVmYXVsdDogdXNlIGF1dGggdG9rZW4gbGlmZXRpbWUgdG9cbiAgICogZGV0ZXJtaW5lIGNhY2hlIGxpZmV0aW1lKS4gVGhpcyBvcHRpb24gaXMgdXNlZnVsIGlmIHRoZSBzZXNzaW9uIGlzIHJlZnJlc2hlZCBhdCBzb21lIGtub3duXG4gICAqIGludGVydmFsIChlLmcuLCBkdWUgdG8gYSBzZWNyZXQgcm90YXRpb24gc2NoZWR1bGUpLlxuICAgKi9cbiAgbWF4Q2FjaGVMaWZldGltZT86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIHNlc3Npb24gbWFuYWdlciB0aGF0IHJlYWRzIGEgdG9rZW4gZnJvbSBhIHNlY3JldCBzdG9yZWQgaW4gQVdTIFNlY3JldHMgTWFuYWdlci5cbiAqL1xuZXhwb3J0IGNsYXNzIEF3c1NlY3JldFNlc3Npb25NYW5hZ2VyIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXIge1xuICAjb3B0czogQXdzU2VjcmV0U2Vzc2lvbk1hbmFnZXJPcHRzIHwgdW5kZWZpbmVkO1xuICAvKiogQ2xpZW50IGZvciBBV1MgU2VjcmV0cyBNYW5hZ2VyICovXG4gICNzbTogU2VjcmV0c01hbmFnZXI7XG4gIC8qKiBJRCBvZiB0aGUgc2VjcmV0ICovXG4gICNzZWNyZXRBcm46IHN0cmluZztcbiAgLyoqIENhY2hlIGZvciB0aGUgc2Vzc2lvbiBkYXRhICovXG4gICNjYWNoZTpcbiAgICB8IHtcbiAgICAgICAgLyoqIFRoZSBzZXNzaW9uIGRhdGEgKi9cbiAgICAgICAgc2Vzc2lvbkRhdGE6IFNlc3Npb25EYXRhO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGV4cGlyYXRpb24gb2YgdGhlIGNhY2hlIChtYXkgYmUgZGlmZmVyZW50IGZyb20gdGhlIGV4cGlyYXRpb24gdGltZSBvZiB0aGUgdG9rZW4gaXRzZWxmKVxuICAgICAgICAgKi9cbiAgICAgICAgZXhwOiBudW1iZXI7XG4gICAgICB9XG4gICAgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gc2VjcmV0SWQgVGhlIG5hbWUgb2YgdGhlIHNlY3JldCBob2xkaW5nIHRoZSB0b2tlblxuICAgKiBAcGFyYW0gb3B0cyBPcHRpb25zIGZvciB0aGUgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZWNyZXRJZDogc3RyaW5nLCBvcHRzPzogQXdzU2VjcmV0U2Vzc2lvbk1hbmFnZXJPcHRzKSB7XG4gICAgdGhpcy4jc20gPSBuZXcgU2VjcmV0c01hbmFnZXIoKTtcbiAgICB0aGlzLiNzZWNyZXRBcm4gPSBzZWNyZXRJZDtcbiAgICB0aGlzLiNjYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLiNvcHRzID0gb3B0cztcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBhc3luYyBvbkludmFsaWRUb2tlbigpIHtcbiAgICB0aGlzLiNjYWNoZSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBhc3luYyBtZXRhZGF0YSgpOiBQcm9taXNlPFNlc3Npb25NZXRhZGF0YT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNnZXRTZXNzaW9uRGF0YSgpO1xuICAgIHJldHVybiBtZXRhZGF0YShkYXRhKTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNnZXRTZXNzaW9uRGF0YSgpO1xuICAgIHJldHVybiBkYXRhLnRva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgc2Vzc2lvbiBkYXRhIGVpdGhlciBmcm9tIGNhY2hlIG9yIGZyb20gQVdTIFNlY3JldHMgTWFuYWdlciBpZiBubyB1bmV4cGlyZWQgY2FjaGVkXG4gICAqIGluZm9ybWF0aW9uIGlzIGF2YWlsYWJsZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNlc3Npb24gZGF0YVxuICAgKi9cbiAgYXN5bmMgI2dldFNlc3Npb25EYXRhKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBpZiAodGhpcy4jY2FjaGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLiNjYWNoZS5leHAgPiBEYXRlLm5vdygpIC8gMTAwMCkge1xuICAgICAgcmV0dXJuIHRoaXMuI2NhY2hlLnNlc3Npb25EYXRhO1xuICAgIH1cblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NtLmdldFNlY3JldFZhbHVlKHsgU2VjcmV0SWQ6IHRoaXMuI3NlY3JldEFybiB9KTtcbiAgICBjb25zdCBzZXNzaW9uRGF0YSA9IHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEocmVzLlNlY3JldFN0cmluZyEpO1xuICAgIGNvbnN0IG1heENhY2hlTGlmZXRpbWUgPSB0aGlzLiNvcHRzPy5tYXhDYWNoZUxpZmV0aW1lO1xuICAgIGxldCBleHAgPVxuICAgICAgbWF4Q2FjaGVMaWZldGltZSAhPT0gdW5kZWZpbmVkXG4gICAgICAgID8gTWF0aC5taW4oRGF0ZS5ub3coKSAvIDEwMDAgKyBtYXhDYWNoZUxpZmV0aW1lLCBzZXNzaW9uRGF0YS5zZXNzaW9uX2luZm8uYXV0aF90b2tlbl9leHApXG4gICAgICAgIDogc2Vzc2lvbkRhdGEuc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwO1xuXG4gICAgLy8gTGltaXQgY2FjaGUgbGlmZXRpbWUgYnkgdGhlIG5leHQgc2NoZWR1bGVkIHJvdGF0aW9uIGlmIHRoZSB1c2VyIHJlcXVlc3RlZCBpdFxuICAgIGlmICh0aGlzLiNvcHRzPy5jaGVja1NjaGVkdWxlZFJvdGF0aW9uID8/IHRydWUpIHtcbiAgICAgIGNvbnN0IGRlc2MgPSBhd2FpdCB0aGlzLiNzbS5kZXNjcmliZVNlY3JldCh7IFNlY3JldElkOiB0aGlzLiNzZWNyZXRBcm4gfSk7XG4gICAgICBpZiAoZGVzYy5OZXh0Um90YXRpb25EYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZXhwID0gTWF0aC5taW4oZXhwLCBkZXNjLk5leHRSb3RhdGlvbkRhdGUuZ2V0VGltZSgpIC8gMTAwMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy4jY2FjaGUgPSB7XG4gICAgICBzZXNzaW9uRGF0YSxcbiAgICAgIGV4cCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLiNjYWNoZS5zZXNzaW9uRGF0YTtcbiAgfVxufVxuXG4vKiogTWFuYWdlcyBzZXNzaW9uIGRhdGEgc3RvcmVkIGluIGEgc2VjcmV0IGluIEFXUyBTZWNyZXRzIE1hYW5nZXIgKi9cbmV4cG9ydCBjbGFzcyBBd3NTZWNyZXRNYW5hZ2VyIHtcbiAgLyoqIENsaWVudCBmb3IgQVdTIFNlY3JldHMgTWFuYWdlciAqL1xuICAjc206IFNlY3JldHNNYW5hZ2VyO1xuICAvKiogSUQgb2YgdGhlIHNlY3JldCAqL1xuICAjc2VjcmV0QXJuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFdyaXRlcyBzZXNzaW9uIGRhdGEgdG8gdGhlIHNlY3JldC5cbiAgICpcbiAgICogQHBhcmFtIHNlc3Npb24gVGhlIHNlc3Npb24gZGF0YSB0byB3cml0ZVxuICAgKi9cbiAgYXN5bmMgdXBkYXRlKHNlc3Npb246IFNlc3Npb25EYXRhKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy4jc20udXBkYXRlU2VjcmV0KHtcbiAgICAgIFNlY3JldElkOiB0aGlzLiNzZWNyZXRBcm4sXG4gICAgICBTZWNyZXRTdHJpbmc6IHNlcmlhbGl6ZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb24pLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBhbmQgd3JpdGVzIHRoZSBuZXcgc2Vzc2lvbiB0byBBV1MgU2VjcmV0cyBNYW5hZ2VyLlxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzbS5nZXRTZWNyZXRWYWx1ZSh7IFNlY3JldElkOiB0aGlzLiNzZWNyZXRBcm4gfSk7XG4gICAgY29uc3QgbmV3U2Vzc2lvbkRhdGEgPSBhd2FpdCByZWZyZXNoKHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEocmVzLlNlY3JldFN0cmluZyEpKTtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZShuZXdTZXNzaW9uRGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBzZWNyZXRJZCBUaGUgbmFtZSBvZiB0aGUgc2VjcmV0IGhvbGRpbmcgdGhlIHRva2VuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZWNyZXRJZDogc3RyaW5nKSB7XG4gICAgdGhpcy4jc20gPSBuZXcgU2VjcmV0c01hbmFnZXIoKTtcbiAgICB0aGlzLiNzZWNyZXRBcm4gPSBzZWNyZXRJZDtcbiAgfVxufVxuIl19