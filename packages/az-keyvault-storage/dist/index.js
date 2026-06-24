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
var _AzureKeyVaultSessionManager_opts, _AzureKeyVaultSessionManager_client, _AzureKeyVaultSessionManager_secretName, _AzureKeyVaultSessionManager_cache, _AzureExclusiveKeyVaultSessionManager_sessionManager, _AzureKeyVaultManager_client, _AzureKeyVaultManager_secretName;
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import { metadata, refresh, parseBase64SessionData, serializeBase64SessionData, ExclusiveSessionManager, } from "@cubist-labs/cubesigner-sdk";
/**
 * A session manager that reads a token from a secret stored in Azure Key Vault.
 */
export class AzureKeyVaultSessionManager {
    /**
     * Constructor.
     *
     * @param vaultUrl The URL of the Azure Key Vault (e.g., "https://my-vault.vault.azure.net")
     * @param secretName The name of the secret holding the token
     * @param opts Options for the session manager
     */
    constructor(vaultUrl, secretName, opts) {
        _AzureKeyVaultSessionManager_opts.set(this, void 0);
        /** Client for Azure Key Vault */
        _AzureKeyVaultSessionManager_client.set(this, void 0);
        /** Name of the secret */
        _AzureKeyVaultSessionManager_secretName.set(this, void 0);
        /** Cache for the session data */
        _AzureKeyVaultSessionManager_cache.set(this, void 0);
        const credential = opts?.credential ?? new DefaultAzureCredential();
        __classPrivateFieldSet(this, _AzureKeyVaultSessionManager_client, new SecretClient(vaultUrl, credential, opts?.clientOptions), "f");
        __classPrivateFieldSet(this, _AzureKeyVaultSessionManager_secretName, secretName, "f");
        __classPrivateFieldSet(this, _AzureKeyVaultSessionManager_cache, undefined, "f");
        __classPrivateFieldSet(this, _AzureKeyVaultSessionManager_opts, opts, "f");
    }
    /** @inheritdoc */
    async onInvalidToken() {
        __classPrivateFieldSet(this, _AzureKeyVaultSessionManager_cache, undefined, "f");
    }
    /** @inheritdoc */
    async metadata() {
        const data = await this.getSessionData();
        return metadata(data);
    }
    /** @inheritdoc */
    async token() {
        const data = await this.getSessionData();
        return data.token;
    }
    /**
     * Get the session data either from cache or from Azure Key Vault if no unexpired cached
     * information is available.
     *
     * @returns The session data
     */
    async getSessionData() {
        if (__classPrivateFieldGet(this, _AzureKeyVaultSessionManager_cache, "f") !== undefined && __classPrivateFieldGet(this, _AzureKeyVaultSessionManager_cache, "f").exp > Date.now() / 1000) {
            return __classPrivateFieldGet(this, _AzureKeyVaultSessionManager_cache, "f").sessionData;
        }
        const secret = await __classPrivateFieldGet(this, _AzureKeyVaultSessionManager_client, "f").getSecret(__classPrivateFieldGet(this, _AzureKeyVaultSessionManager_secretName, "f"));
        if (!secret.value) {
            throw new Error(`Secret ${__classPrivateFieldGet(this, _AzureKeyVaultSessionManager_secretName, "f")} has no value`);
        }
        const sessionData = parseBase64SessionData(secret.value);
        const maxCacheLifetime = __classPrivateFieldGet(this, _AzureKeyVaultSessionManager_opts, "f")?.maxCacheLifetime;
        const exp = maxCacheLifetime !== undefined
            ? Math.min(Date.now() / 1000 + maxCacheLifetime, sessionData.session_info.auth_token_exp)
            : sessionData.session_info.auth_token_exp;
        __classPrivateFieldSet(this, _AzureKeyVaultSessionManager_cache, {
            sessionData,
            exp,
        }, "f");
        return __classPrivateFieldGet(this, _AzureKeyVaultSessionManager_cache, "f").sessionData;
    }
    /**
     * Writes session data to the secret.
     *
     * @param session The session data to write
     */
    async update(session) {
        await __classPrivateFieldGet(this, _AzureKeyVaultSessionManager_client, "f").setSecret(__classPrivateFieldGet(this, _AzureKeyVaultSessionManager_secretName, "f"), serializeBase64SessionData(session));
    }
}
_AzureKeyVaultSessionManager_opts = new WeakMap(), _AzureKeyVaultSessionManager_client = new WeakMap(), _AzureKeyVaultSessionManager_secretName = new WeakMap(), _AzureKeyVaultSessionManager_cache = new WeakMap();
/**
 * A session manager that provides exclusive access to an Azure Key Vault-backed session.
 * Automatically handles token expiration updates on Azure Key Vault.
 * Not suitable for concurrent access from multiple processes.
 */
export class AzureExclusiveKeyVaultSessionManager extends ExclusiveSessionManager {
    /**
     * Constructor
     *
     * @param vaultUrl Vault url
     * @param secretName Secret name
     * @param opts Optional parameters
     */
    constructor(vaultUrl, secretName, opts) {
        super();
        _AzureExclusiveKeyVaultSessionManager_sessionManager.set(this, void 0);
        __classPrivateFieldSet(this, _AzureExclusiveKeyVaultSessionManager_sessionManager, new AzureKeyVaultSessionManager(vaultUrl, secretName, opts), "f");
    }
    /**
     * Notifies the manager that the token is invalid (so that it can clear it from its cache).
     *
     * @returns Void promise
     */
    async onInvalidToken() {
        return __classPrivateFieldGet(this, _AzureExclusiveKeyVaultSessionManager_sessionManager, "f").onInvalidToken();
    }
    /**
     * @returns Retrieves the session data from the underlying manager.
     */
    retrieve() {
        return __classPrivateFieldGet(this, _AzureExclusiveKeyVaultSessionManager_sessionManager, "f").getSessionData();
    }
    /**
     * Stores session data.
     *
     * @param data The session data to store.
     * @returns Void promise
     */
    store(data) {
        return __classPrivateFieldGet(this, _AzureExclusiveKeyVaultSessionManager_sessionManager, "f").update(data);
    }
}
_AzureExclusiveKeyVaultSessionManager_sessionManager = new WeakMap();
/** Manages session data stored in a secret in Azure Key Vault */
export class AzureKeyVaultManager {
    /**
     * Writes session data to the secret.
     *
     * @param session The session data to write
     */
    async update(session) {
        await __classPrivateFieldGet(this, _AzureKeyVaultManager_client, "f").setSecret(__classPrivateFieldGet(this, _AzureKeyVaultManager_secretName, "f"), serializeBase64SessionData(session));
    }
    /**
     * Refreshes the session and writes the new session to Azure Key Vault.
     */
    async refresh() {
        const secret = await __classPrivateFieldGet(this, _AzureKeyVaultManager_client, "f").getSecret(__classPrivateFieldGet(this, _AzureKeyVaultManager_secretName, "f"));
        if (!secret.value) {
            throw new Error(`Secret ${__classPrivateFieldGet(this, _AzureKeyVaultManager_secretName, "f")} has no value`);
        }
        const newSessionData = await refresh(parseBase64SessionData(secret.value));
        await this.update(newSessionData);
    }
    /**
     * Constructor.
     *
     * @param vaultUrl The URL of the Azure Key Vault (e.g., "https://my-vault.vault.azure.net")
     * @param secretName The name of the secret holding the token
     * @param credential Azure credential to use for authentication (default: DefaultAzureCredential)
     * @param clientOptions Options to pass to the SecretClient constructor
     */
    constructor(vaultUrl, secretName, credential, clientOptions) {
        /** Client for Azure Key Vault */
        _AzureKeyVaultManager_client.set(this, void 0);
        /** Name of the secret */
        _AzureKeyVaultManager_secretName.set(this, void 0);
        const cred = credential ?? new DefaultAzureCredential();
        __classPrivateFieldSet(this, _AzureKeyVaultManager_client, new SecretClient(vaultUrl, cred, clientOptions), "f");
        __classPrivateFieldSet(this, _AzureKeyVaultManager_secretName, secretName, "f");
    }
}
_AzureKeyVaultManager_client = new WeakMap(), _AzureKeyVaultManager_secretName = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxFQUFFLFlBQVksRUFBNEIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUUsc0JBQXNCLEVBQXdCLE1BQU0saUJBQWlCLENBQUM7QUFDL0UsT0FBTyxFQUdMLFFBQVEsRUFFUixPQUFPLEVBQ1Asc0JBQXNCLEVBQ3RCLDBCQUEwQixFQUMxQix1QkFBdUIsR0FDeEIsTUFBTSw0QkFBNEIsQ0FBQztBQW9CcEM7O0dBRUc7QUFDSCxNQUFNLE9BQU8sMkJBQTJCO0lBa0J0Qzs7Ozs7O09BTUc7SUFDSCxZQUFZLFFBQWdCLEVBQUUsVUFBa0IsRUFBRSxJQUFzQztRQXhCeEYsb0RBQW1EO1FBQ25ELGlDQUFpQztRQUNqQyxzREFBc0I7UUFDdEIseUJBQXlCO1FBQ3pCLDBEQUFvQjtRQUNwQixpQ0FBaUM7UUFDakMscURBU2M7UUFVWixNQUFNLFVBQVUsR0FBRyxJQUFJLEVBQUUsVUFBVSxJQUFJLElBQUksc0JBQXNCLEVBQUUsQ0FBQztRQUNwRSx1QkFBQSxJQUFJLHVDQUFXLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBQyxNQUFBLENBQUM7UUFDM0UsdUJBQUEsSUFBSSwyQ0FBZSxVQUFVLE1BQUEsQ0FBQztRQUM5Qix1QkFBQSxJQUFJLHNDQUFVLFNBQVMsTUFBQSxDQUFDO1FBQ3hCLHVCQUFBLElBQUkscUNBQVMsSUFBSSxNQUFBLENBQUM7SUFDcEIsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixLQUFLLENBQUMsY0FBYztRQUNsQix1QkFBQSxJQUFJLHNDQUFVLFNBQVMsTUFBQSxDQUFDO0lBQzFCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN6QyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDekMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxjQUFjO1FBQ2xCLElBQUksdUJBQUEsSUFBSSwwQ0FBTyxLQUFLLFNBQVMsSUFBSSx1QkFBQSxJQUFJLDBDQUFPLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQztZQUNyRSxPQUFPLHVCQUFBLElBQUksMENBQU8sQ0FBQyxXQUFXLENBQUM7UUFDakMsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sdUJBQUEsSUFBSSwyQ0FBUSxDQUFDLFNBQVMsQ0FBQyx1QkFBQSxJQUFJLCtDQUFZLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsVUFBVSx1QkFBQSxJQUFJLCtDQUFZLGVBQWUsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekQsTUFBTSxnQkFBZ0IsR0FBRyx1QkFBQSxJQUFJLHlDQUFNLEVBQUUsZ0JBQWdCLENBQUM7UUFDdEQsTUFBTSxHQUFHLEdBQ1AsZ0JBQWdCLEtBQUssU0FBUztZQUM1QixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxHQUFHLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDO1lBQ3pGLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQztRQUU5Qyx1QkFBQSxJQUFJLHNDQUFVO1lBQ1osV0FBVztZQUNYLEdBQUc7U0FDSixNQUFBLENBQUM7UUFDRixPQUFPLHVCQUFBLElBQUksMENBQU8sQ0FBQyxXQUFXLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQW9CO1FBQy9CLE1BQU0sdUJBQUEsSUFBSSwyQ0FBUSxDQUFDLFNBQVMsQ0FBQyx1QkFBQSxJQUFJLCtDQUFZLEVBQUUsMEJBQTBCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN0RixDQUFDO0NBQ0Y7O0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxvQ0FBcUMsU0FBUSx1QkFBdUI7SUFHL0U7Ozs7OztPQU1HO0lBQ0gsWUFBWSxRQUFnQixFQUFFLFVBQWtCLEVBQUUsSUFBc0M7UUFDdEYsS0FBSyxFQUFFLENBQUM7UUFWVix1RUFBNkM7UUFXM0MsdUJBQUEsSUFBSSx3REFBbUIsSUFBSSwyQkFBMkIsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFBLENBQUM7SUFDckYsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsY0FBYztRQUNsQixPQUFPLHVCQUFBLElBQUksNERBQWdCLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDL0MsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE9BQU8sdUJBQUEsSUFBSSw0REFBZ0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUMvQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsSUFBaUI7UUFDckIsT0FBTyx1QkFBQSxJQUFJLDREQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQyxDQUFDO0NBQ0Y7O0FBRUQsaUVBQWlFO0FBQ2pFLE1BQU0sT0FBTyxvQkFBb0I7SUFNL0I7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBb0I7UUFDL0IsTUFBTSx1QkFBQSxJQUFJLG9DQUFRLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVksRUFBRSwwQkFBMEIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxNQUFNLEdBQUcsTUFBTSx1QkFBQSxJQUFJLG9DQUFRLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksd0NBQVksQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxVQUFVLHVCQUFBLElBQUksd0NBQVksZUFBZSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELE1BQU0sY0FBYyxHQUFHLE1BQU0sT0FBTyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILFlBQ0UsUUFBZ0IsRUFDaEIsVUFBa0IsRUFDbEIsVUFBNEIsRUFDNUIsYUFBbUM7UUF2Q3JDLGlDQUFpQztRQUNqQywrQ0FBc0I7UUFDdEIseUJBQXlCO1FBQ3pCLG1EQUFvQjtRQXNDbEIsTUFBTSxJQUFJLEdBQUcsVUFBVSxJQUFJLElBQUksc0JBQXNCLEVBQUUsQ0FBQztRQUN4RCx1QkFBQSxJQUFJLGdDQUFXLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsYUFBYSxDQUFDLE1BQUEsQ0FBQztRQUMvRCx1QkFBQSxJQUFJLG9DQUFlLFVBQVUsTUFBQSxDQUFDO0lBQ2hDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlY3JldENsaWVudCwgdHlwZSBTZWNyZXRDbGllbnRPcHRpb25zIH0gZnJvbSBcIkBhenVyZS9rZXl2YXVsdC1zZWNyZXRzXCI7XG5pbXBvcnQgeyBEZWZhdWx0QXp1cmVDcmVkZW50aWFsLCB0eXBlIFRva2VuQ3JlZGVudGlhbCB9IGZyb20gXCJAYXp1cmUvaWRlbnRpdHlcIjtcbmltcG9ydCB7XG4gIHR5cGUgU2Vzc2lvbkRhdGEsXG4gIHR5cGUgU2Vzc2lvbk1hbmFnZXIsXG4gIG1ldGFkYXRhLFxuICB0eXBlIFNlc3Npb25NZXRhZGF0YSxcbiAgcmVmcmVzaCxcbiAgcGFyc2VCYXNlNjRTZXNzaW9uRGF0YSxcbiAgc2VyaWFsaXplQmFzZTY0U2Vzc2lvbkRhdGEsXG4gIEV4Y2x1c2l2ZVNlc3Npb25NYW5hZ2VyLFxufSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcblxuLyoqIE9wdGlvbnMgZm9yIEF6dXJlIEtleSBWYXVsdC1iYWNrZWQgc2Vzc2lvbiBtYW5hZ2VyICovXG5leHBvcnQgaW50ZXJmYWNlIEF6dXJlS2V5VmF1bHRTZXNzaW9uTWFuYWdlck9wdHMge1xuICAvKipcbiAgICogQXp1cmUgY3JlZGVudGlhbCB0byB1c2UgZm9yIGF1dGhlbnRpY2F0aW9uIChkZWZhdWx0OiBEZWZhdWx0QXp1cmVDcmVkZW50aWFsKVxuICAgKi9cbiAgY3JlZGVudGlhbD86IFRva2VuQ3JlZGVudGlhbDtcbiAgLyoqXG4gICAqIE1heGltdW0gYW1vdW50IG9mIHRpbWUgdGhhdCBzZXNzaW9uIGRhdGEgd2lsbCBiZSBjYWNoZWQgKGRlZmF1bHQ6IHVzZSBhdXRoIHRva2VuIGxpZmV0aW1lIHRvXG4gICAqIGRldGVybWluZSBjYWNoZSBsaWZldGltZSkuIFRoaXMgb3B0aW9uIGlzIHVzZWZ1bCBpZiB0aGUgc2Vzc2lvbiBpcyByZWZyZXNoZWQgYXQgc29tZSBrbm93blxuICAgKiBpbnRlcnZhbC5cbiAgICovXG4gIG1heENhY2hlTGlmZXRpbWU/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIFNlY3JldENsaWVudCBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY2xpZW50T3B0aW9ucz86IFNlY3JldENsaWVudE9wdGlvbnM7XG59XG5cbi8qKlxuICogQSBzZXNzaW9uIG1hbmFnZXIgdGhhdCByZWFkcyBhIHRva2VuIGZyb20gYSBzZWNyZXQgc3RvcmVkIGluIEF6dXJlIEtleSBWYXVsdC5cbiAqL1xuZXhwb3J0IGNsYXNzIEF6dXJlS2V5VmF1bHRTZXNzaW9uTWFuYWdlciBpbXBsZW1lbnRzIFNlc3Npb25NYW5hZ2VyIHtcbiAgI29wdHM6IEF6dXJlS2V5VmF1bHRTZXNzaW9uTWFuYWdlck9wdHMgfCB1bmRlZmluZWQ7XG4gIC8qKiBDbGllbnQgZm9yIEF6dXJlIEtleSBWYXVsdCAqL1xuICAjY2xpZW50OiBTZWNyZXRDbGllbnQ7XG4gIC8qKiBOYW1lIG9mIHRoZSBzZWNyZXQgKi9cbiAgI3NlY3JldE5hbWU6IHN0cmluZztcbiAgLyoqIENhY2hlIGZvciB0aGUgc2Vzc2lvbiBkYXRhICovXG4gICNjYWNoZTpcbiAgICB8IHtcbiAgICAgICAgLyoqIFRoZSBzZXNzaW9uIGRhdGEgKi9cbiAgICAgICAgc2Vzc2lvbkRhdGE6IFNlc3Npb25EYXRhO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGV4cGlyYXRpb24gb2YgdGhlIGNhY2hlIChtYXkgYmUgZGlmZmVyZW50IGZyb20gdGhlIGV4cGlyYXRpb24gdGltZSBvZiB0aGUgdG9rZW4gaXRzZWxmKVxuICAgICAgICAgKi9cbiAgICAgICAgZXhwOiBudW1iZXI7XG4gICAgICB9XG4gICAgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmF1bHRVcmwgVGhlIFVSTCBvZiB0aGUgQXp1cmUgS2V5IFZhdWx0IChlLmcuLCBcImh0dHBzOi8vbXktdmF1bHQudmF1bHQuYXp1cmUubmV0XCIpXG4gICAqIEBwYXJhbSBzZWNyZXROYW1lIFRoZSBuYW1lIG9mIHRoZSBzZWNyZXQgaG9sZGluZyB0aGUgdG9rZW5cbiAgICogQHBhcmFtIG9wdHMgT3B0aW9ucyBmb3IgdGhlIHNlc3Npb24gbWFuYWdlclxuICAgKi9cbiAgY29uc3RydWN0b3IodmF1bHRVcmw6IHN0cmluZywgc2VjcmV0TmFtZTogc3RyaW5nLCBvcHRzPzogQXp1cmVLZXlWYXVsdFNlc3Npb25NYW5hZ2VyT3B0cykge1xuICAgIGNvbnN0IGNyZWRlbnRpYWwgPSBvcHRzPy5jcmVkZW50aWFsID8/IG5ldyBEZWZhdWx0QXp1cmVDcmVkZW50aWFsKCk7XG4gICAgdGhpcy4jY2xpZW50ID0gbmV3IFNlY3JldENsaWVudCh2YXVsdFVybCwgY3JlZGVudGlhbCwgb3B0cz8uY2xpZW50T3B0aW9ucyk7XG4gICAgdGhpcy4jc2VjcmV0TmFtZSA9IHNlY3JldE5hbWU7XG4gICAgdGhpcy4jY2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy4jb3B0cyA9IG9wdHM7XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgYXN5bmMgb25JbnZhbGlkVG9rZW4oKSB7XG4gICAgdGhpcy4jY2FjaGUgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5nZXRTZXNzaW9uRGF0YSgpO1xuICAgIHJldHVybiBtZXRhZGF0YShkYXRhKTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmdldFNlc3Npb25EYXRhKCk7XG4gICAgcmV0dXJuIGRhdGEudG9rZW47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzZXNzaW9uIGRhdGEgZWl0aGVyIGZyb20gY2FjaGUgb3IgZnJvbSBBenVyZSBLZXkgVmF1bHQgaWYgbm8gdW5leHBpcmVkIGNhY2hlZFxuICAgKiBpbmZvcm1hdGlvbiBpcyBhdmFpbGFibGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIGRhdGFcbiAgICovXG4gIGFzeW5jIGdldFNlc3Npb25EYXRhKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBpZiAodGhpcy4jY2FjaGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLiNjYWNoZS5leHAgPiBEYXRlLm5vdygpIC8gMTAwMCkge1xuICAgICAgcmV0dXJuIHRoaXMuI2NhY2hlLnNlc3Npb25EYXRhO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3JldCA9IGF3YWl0IHRoaXMuI2NsaWVudC5nZXRTZWNyZXQodGhpcy4jc2VjcmV0TmFtZSk7XG4gICAgaWYgKCFzZWNyZXQudmFsdWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2VjcmV0ICR7dGhpcy4jc2VjcmV0TmFtZX0gaGFzIG5vIHZhbHVlYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2Vzc2lvbkRhdGEgPSBwYXJzZUJhc2U2NFNlc3Npb25EYXRhKHNlY3JldC52YWx1ZSk7XG4gICAgY29uc3QgbWF4Q2FjaGVMaWZldGltZSA9IHRoaXMuI29wdHM/Lm1heENhY2hlTGlmZXRpbWU7XG4gICAgY29uc3QgZXhwID1cbiAgICAgIG1heENhY2hlTGlmZXRpbWUgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IE1hdGgubWluKERhdGUubm93KCkgLyAxMDAwICsgbWF4Q2FjaGVMaWZldGltZSwgc2Vzc2lvbkRhdGEuc2Vzc2lvbl9pbmZvLmF1dGhfdG9rZW5fZXhwKVxuICAgICAgICA6IHNlc3Npb25EYXRhLnNlc3Npb25faW5mby5hdXRoX3Rva2VuX2V4cDtcblxuICAgIHRoaXMuI2NhY2hlID0ge1xuICAgICAgc2Vzc2lvbkRhdGEsXG4gICAgICBleHAsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy4jY2FjaGUuc2Vzc2lvbkRhdGE7XG4gIH1cblxuICAvKipcbiAgICogV3JpdGVzIHNlc3Npb24gZGF0YSB0byB0aGUgc2VjcmV0LlxuICAgKlxuICAgKiBAcGFyYW0gc2Vzc2lvbiBUaGUgc2Vzc2lvbiBkYXRhIHRvIHdyaXRlXG4gICAqL1xuICBhc3luYyB1cGRhdGUoc2Vzc2lvbjogU2Vzc2lvbkRhdGEpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLiNjbGllbnQuc2V0U2VjcmV0KHRoaXMuI3NlY3JldE5hbWUsIHNlcmlhbGl6ZUJhc2U2NFNlc3Npb25EYXRhKHNlc3Npb24pKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgc2Vzc2lvbiBtYW5hZ2VyIHRoYXQgcHJvdmlkZXMgZXhjbHVzaXZlIGFjY2VzcyB0byBhbiBBenVyZSBLZXkgVmF1bHQtYmFja2VkIHNlc3Npb24uXG4gKiBBdXRvbWF0aWNhbGx5IGhhbmRsZXMgdG9rZW4gZXhwaXJhdGlvbiB1cGRhdGVzIG9uIEF6dXJlIEtleSBWYXVsdC5cbiAqIE5vdCBzdWl0YWJsZSBmb3IgY29uY3VycmVudCBhY2Nlc3MgZnJvbSBtdWx0aXBsZSBwcm9jZXNzZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBBenVyZUV4Y2x1c2l2ZUtleVZhdWx0U2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBFeGNsdXNpdmVTZXNzaW9uTWFuYWdlciB7XG4gICNzZXNzaW9uTWFuYWdlcjogQXp1cmVLZXlWYXVsdFNlc3Npb25NYW5hZ2VyO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcGFyYW0gdmF1bHRVcmwgVmF1bHQgdXJsXG4gICAqIEBwYXJhbSBzZWNyZXROYW1lIFNlY3JldCBuYW1lXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHZhdWx0VXJsOiBzdHJpbmcsIHNlY3JldE5hbWU6IHN0cmluZywgb3B0cz86IEF6dXJlS2V5VmF1bHRTZXNzaW9uTWFuYWdlck9wdHMpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI3Nlc3Npb25NYW5hZ2VyID0gbmV3IEF6dXJlS2V5VmF1bHRTZXNzaW9uTWFuYWdlcih2YXVsdFVybCwgc2VjcmV0TmFtZSwgb3B0cyk7XG4gIH1cblxuICAvKipcbiAgICogTm90aWZpZXMgdGhlIG1hbmFnZXIgdGhhdCB0aGUgdG9rZW4gaXMgaW52YWxpZCAoc28gdGhhdCBpdCBjYW4gY2xlYXIgaXQgZnJvbSBpdHMgY2FjaGUpLlxuICAgKlxuICAgKiBAcmV0dXJucyBWb2lkIHByb21pc2VcbiAgICovXG4gIGFzeW5jIG9uSW52YWxpZFRva2VuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLiNzZXNzaW9uTWFuYWdlci5vbkludmFsaWRUb2tlbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFJldHJpZXZlcyB0aGUgc2Vzc2lvbiBkYXRhIGZyb20gdGhlIHVuZGVybHlpbmcgbWFuYWdlci5cbiAgICovXG4gIHJldHJpZXZlKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICByZXR1cm4gdGhpcy4jc2Vzc2lvbk1hbmFnZXIuZ2V0U2Vzc2lvbkRhdGEoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZXMgc2Vzc2lvbiBkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgc2Vzc2lvbiBkYXRhIHRvIHN0b3JlLlxuICAgKiBAcmV0dXJucyBWb2lkIHByb21pc2VcbiAgICovXG4gIHN0b3JlKGRhdGE6IFNlc3Npb25EYXRhKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuI3Nlc3Npb25NYW5hZ2VyLnVwZGF0ZShkYXRhKTtcbiAgfVxufVxuXG4vKiogTWFuYWdlcyBzZXNzaW9uIGRhdGEgc3RvcmVkIGluIGEgc2VjcmV0IGluIEF6dXJlIEtleSBWYXVsdCAqL1xuZXhwb3J0IGNsYXNzIEF6dXJlS2V5VmF1bHRNYW5hZ2VyIHtcbiAgLyoqIENsaWVudCBmb3IgQXp1cmUgS2V5IFZhdWx0ICovXG4gICNjbGllbnQ6IFNlY3JldENsaWVudDtcbiAgLyoqIE5hbWUgb2YgdGhlIHNlY3JldCAqL1xuICAjc2VjcmV0TmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXcml0ZXMgc2Vzc2lvbiBkYXRhIHRvIHRoZSBzZWNyZXQuXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBzZXNzaW9uIGRhdGEgdG8gd3JpdGVcbiAgICovXG4gIGFzeW5jIHVwZGF0ZShzZXNzaW9uOiBTZXNzaW9uRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuI2NsaWVudC5zZXRTZWNyZXQodGhpcy4jc2VjcmV0TmFtZSwgc2VyaWFsaXplQmFzZTY0U2Vzc2lvbkRhdGEoc2Vzc2lvbikpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBhbmQgd3JpdGVzIHRoZSBuZXcgc2Vzc2lvbiB0byBBenVyZSBLZXkgVmF1bHQuXG4gICAqL1xuICBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlY3JldCA9IGF3YWl0IHRoaXMuI2NsaWVudC5nZXRTZWNyZXQodGhpcy4jc2VjcmV0TmFtZSk7XG4gICAgaWYgKCFzZWNyZXQudmFsdWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2VjcmV0ICR7dGhpcy4jc2VjcmV0TmFtZX0gaGFzIG5vIHZhbHVlYCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3U2Vzc2lvbkRhdGEgPSBhd2FpdCByZWZyZXNoKHBhcnNlQmFzZTY0U2Vzc2lvbkRhdGEoc2VjcmV0LnZhbHVlKSk7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUobmV3U2Vzc2lvbkRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmF1bHRVcmwgVGhlIFVSTCBvZiB0aGUgQXp1cmUgS2V5IFZhdWx0IChlLmcuLCBcImh0dHBzOi8vbXktdmF1bHQudmF1bHQuYXp1cmUubmV0XCIpXG4gICAqIEBwYXJhbSBzZWNyZXROYW1lIFRoZSBuYW1lIG9mIHRoZSBzZWNyZXQgaG9sZGluZyB0aGUgdG9rZW5cbiAgICogQHBhcmFtIGNyZWRlbnRpYWwgQXp1cmUgY3JlZGVudGlhbCB0byB1c2UgZm9yIGF1dGhlbnRpY2F0aW9uIChkZWZhdWx0OiBEZWZhdWx0QXp1cmVDcmVkZW50aWFsKVxuICAgKiBAcGFyYW0gY2xpZW50T3B0aW9ucyBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIFNlY3JldENsaWVudCBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgdmF1bHRVcmw6IHN0cmluZyxcbiAgICBzZWNyZXROYW1lOiBzdHJpbmcsXG4gICAgY3JlZGVudGlhbD86IFRva2VuQ3JlZGVudGlhbCxcbiAgICBjbGllbnRPcHRpb25zPzogU2VjcmV0Q2xpZW50T3B0aW9ucyxcbiAgKSB7XG4gICAgY29uc3QgY3JlZCA9IGNyZWRlbnRpYWwgPz8gbmV3IERlZmF1bHRBenVyZUNyZWRlbnRpYWwoKTtcbiAgICB0aGlzLiNjbGllbnQgPSBuZXcgU2VjcmV0Q2xpZW50KHZhdWx0VXJsLCBjcmVkLCBjbGllbnRPcHRpb25zKTtcbiAgICB0aGlzLiNzZWNyZXROYW1lID0gc2VjcmV0TmFtZTtcbiAgfVxufVxuIl19