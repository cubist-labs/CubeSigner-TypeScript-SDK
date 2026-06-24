import { type SecretClientOptions } from "@azure/keyvault-secrets";
import { type TokenCredential } from "@azure/identity";
import { type SessionData, type SessionManager, type SessionMetadata, ExclusiveSessionManager } from "@cubist-labs/cubesigner-sdk";
/** Options for Azure Key Vault-backed session manager */
export interface AzureKeyVaultSessionManagerOpts {
    /**
     * Azure credential to use for authentication (default: DefaultAzureCredential)
     */
    credential?: TokenCredential;
    /**
     * Maximum amount of time that session data will be cached (default: use auth token lifetime to
     * determine cache lifetime). This option is useful if the session is refreshed at some known
     * interval.
     */
    maxCacheLifetime?: number;
    /**
     * Options to pass to the SecretClient constructor
     */
    clientOptions?: SecretClientOptions;
}
/**
 * A session manager that reads a token from a secret stored in Azure Key Vault.
 */
export declare class AzureKeyVaultSessionManager implements SessionManager {
    #private;
    /**
     * Constructor.
     *
     * @param vaultUrl The URL of the Azure Key Vault (e.g., "https://my-vault.vault.azure.net")
     * @param secretName The name of the secret holding the token
     * @param opts Options for the session manager
     */
    constructor(vaultUrl: string, secretName: string, opts?: AzureKeyVaultSessionManagerOpts);
    /** @inheritdoc */
    onInvalidToken(): Promise<void>;
    /** @inheritdoc */
    metadata(): Promise<SessionMetadata>;
    /** @inheritdoc */
    token(): Promise<string>;
    /**
     * Get the session data either from cache or from Azure Key Vault if no unexpired cached
     * information is available.
     *
     * @returns The session data
     */
    getSessionData(): Promise<SessionData>;
    /**
     * Writes session data to the secret.
     *
     * @param session The session data to write
     */
    update(session: SessionData): Promise<void>;
}
/**
 * A session manager that provides exclusive access to an Azure Key Vault-backed session.
 * Automatically handles token expiration updates on Azure Key Vault.
 * Not suitable for concurrent access from multiple processes.
 */
export declare class AzureExclusiveKeyVaultSessionManager extends ExclusiveSessionManager {
    #private;
    /**
     * Constructor
     *
     * @param vaultUrl Vault url
     * @param secretName Secret name
     * @param opts Optional parameters
     */
    constructor(vaultUrl: string, secretName: string, opts?: AzureKeyVaultSessionManagerOpts);
    /**
     * Notifies the manager that the token is invalid (so that it can clear it from its cache).
     *
     * @returns Void promise
     */
    onInvalidToken(): Promise<void>;
    /**
     * @returns Retrieves the session data from the underlying manager.
     */
    retrieve(): Promise<SessionData>;
    /**
     * Stores session data.
     *
     * @param data The session data to store.
     * @returns Void promise
     */
    store(data: SessionData): Promise<void>;
}
/** Manages session data stored in a secret in Azure Key Vault */
export declare class AzureKeyVaultManager {
    #private;
    /**
     * Writes session data to the secret.
     *
     * @param session The session data to write
     */
    update(session: SessionData): Promise<void>;
    /**
     * Refreshes the session and writes the new session to Azure Key Vault.
     */
    refresh(): Promise<void>;
    /**
     * Constructor.
     *
     * @param vaultUrl The URL of the Azure Key Vault (e.g., "https://my-vault.vault.azure.net")
     * @param secretName The name of the secret holding the token
     * @param credential Azure credential to use for authentication (default: DefaultAzureCredential)
     * @param clientOptions Options to pass to the SecretClient constructor
     */
    constructor(vaultUrl: string, secretName: string, credential?: TokenCredential, clientOptions?: SecretClientOptions);
}
//# sourceMappingURL=index.d.ts.map