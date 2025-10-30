import { SecretClient, type SecretClientOptions } from "@azure/keyvault-secrets";
import { DefaultAzureCredential, type TokenCredential } from "@azure/identity";
import {
  type SessionData,
  type SessionManager,
  metadata,
  type SessionMetadata,
  refresh,
  parseBase64SessionData,
  serializeBase64SessionData,
  ExclusiveSessionManager,
} from "@cubist-labs/cubesigner-sdk";

/** Options for Azure Key Vault-backed session manager */
interface AzureKeyVaultSessionManagerOpts {
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
export class AzureKeyVaultSessionManager implements SessionManager {
  #opts: AzureKeyVaultSessionManagerOpts | undefined;
  /** Client for Azure Key Vault */
  #client: SecretClient;
  /** Name of the secret */
  #secretName: string;
  /** Cache for the session data */
  #cache:
    | {
        /** The session data */
        sessionData: SessionData;
        /**
         * The expiration of the cache (may be different from the expiration time of the token itself)
         */
        exp: number;
      }
    | undefined;

  /**
   * Constructor.
   *
   * @param vaultUrl The URL of the Azure Key Vault (e.g., "https://my-vault.vault.azure.net")
   * @param secretName The name of the secret holding the token
   * @param opts Options for the session manager
   */
  constructor(vaultUrl: string, secretName: string, opts?: AzureKeyVaultSessionManagerOpts) {
    const credential = opts?.credential ?? new DefaultAzureCredential();
    this.#client = new SecretClient(vaultUrl, credential, opts?.clientOptions);
    this.#secretName = secretName;
    this.#cache = undefined;
    this.#opts = opts;
  }

  /** @inheritdoc */
  async onInvalidToken() {
    this.#cache = undefined;
  }

  /** @inheritdoc */
  async metadata(): Promise<SessionMetadata> {
    const data = await this.getSessionData();
    return metadata(data);
  }

  /** @inheritdoc */
  async token(): Promise<string> {
    const data = await this.getSessionData();
    return data.token;
  }

  /**
   * Get the session data either from cache or from Azure Key Vault if no unexpired cached
   * information is available.
   *
   * @returns The session data
   */
  async getSessionData(): Promise<SessionData> {
    if (this.#cache !== undefined && this.#cache.exp > Date.now() / 1000) {
      return this.#cache.sessionData;
    }

    const secret = await this.#client.getSecret(this.#secretName);
    if (!secret.value) {
      throw new Error(`Secret ${this.#secretName} has no value`);
    }

    const sessionData = parseBase64SessionData(secret.value);
    const maxCacheLifetime = this.#opts?.maxCacheLifetime;
    const exp =
      maxCacheLifetime !== undefined
        ? Math.min(Date.now() / 1000 + maxCacheLifetime, sessionData.session_info.auth_token_exp)
        : sessionData.session_info.auth_token_exp;

    this.#cache = {
      sessionData,
      exp,
    };
    return this.#cache.sessionData;
  }

  /**
   * Writes session data to the secret.
   *
   * @param session The session data to write
   */
  async update(session: SessionData): Promise<void> {
    await this.#client.setSecret(this.#secretName, serializeBase64SessionData(session));
  }
}

/**
 * A session manager that provides exclusive access to an Azure Key Vault-backed session.
 * Automatically handles token expiration updates on azure key vaults.
 * Not suitable for concurrent access from multiple processes
 */
export class AzureExclusiveKeyVaultSessionManager extends ExclusiveSessionManager {
  #sessionManager: AzureKeyVaultSessionManager;

  constructor(vaultUrl: string, secretName: string, opts?: AzureKeyVaultSessionManagerOpts) {
    super();
    this.#sessionManager = new AzureKeyVaultSessionManager(vaultUrl, secretName, opts);
  }

  onInvalidToken(): Promise<void> {
    return this.#sessionManager.onInvalidToken();
  }
  
  retrieve(): Promise<SessionData> {
    return this.#sessionManager.getSessionData();
  }

  store(data: SessionData): Promise<void> {
    return this.#sessionManager.update(data);
  }

}

/** Manages session data stored in a secret in Azure Key Vault */
export class AzureKeyVaultManager {
  /** Client for Azure Key Vault */
  #client: SecretClient;
  /** Name of the secret */
  #secretName: string;

  /**
   * Writes session data to the secret.
   *
   * @param session The session data to write
   */
  async update(session: SessionData): Promise<void> {
    await this.#client.setSecret(this.#secretName, serializeBase64SessionData(session));
  }

  /**
   * Refreshes the session and writes the new session to Azure Key Vault.
   */
  async refresh(): Promise<void> {
    const secret = await this.#client.getSecret(this.#secretName);
    if (!secret.value) {
      throw new Error(`Secret ${this.#secretName} has no value`);
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
  constructor(
    vaultUrl: string,
    secretName: string,
    credential?: TokenCredential,
    clientOptions?: SecretClientOptions,
  ) {
    const cred = credential ?? new DefaultAzureCredential();
    this.#client = new SecretClient(vaultUrl, cred, clientOptions);
    this.#secretName = secretName;
  }
}
