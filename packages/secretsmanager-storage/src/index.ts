import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import {
  type SessionData,
  type SessionManager,
  metadata,
  type SessionMetadata,
  refresh,
  parseBase64SessionData,
  serializeBase64SessionData,
} from "@cubist-labs/cubesigner-sdk";

/** Options for AWS Secrets Manager-backed session manager */
interface AwsSecretSessionManagerOpts {
  /**
   * Limit the cache lifetime by the scheduled rotation of the secret (default: true)
   */
  checkScheduledRotation?: boolean;
  /**
   * Maximum amount of time that session data will be cached (default: use auth token lifetime to
   * determine cache lifetime). This option is useful if the session is refreshed at some known
   * interval (e.g., due to a secret rotation schedule).
   */
  maxCacheLifetime?: number;
}

/**
 * A session manager that reads a token from a secret stored in AWS Secrets Manager.
 */
export class AwsSecretSessionManager implements SessionManager {
  #opts: AwsSecretSessionManagerOpts | undefined;
  /** Client for AWS Secrets Manager */
  #sm: SecretsManager;
  /** ID of the secret */
  #secretArn: string;
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
   * @param secretId The name of the secret holding the token
   * @param opts Options for the session manager
   */
  constructor(secretId: string, opts?: AwsSecretSessionManagerOpts) {
    this.#sm = new SecretsManager();
    this.#secretArn = secretId;
    this.#cache = undefined;
    this.#opts = opts;
  }

  /** @inheritdoc */
  async onInvalidToken() {
    this.#cache = undefined;
  }

  /** @inheritdoc */
  async metadata(): Promise<SessionMetadata> {
    const data = await this.#getSessionData();
    return metadata(data);
  }

  /** @inheritdoc */
  async token(): Promise<string> {
    const data = await this.#getSessionData();
    return data.token;
  }

  /**
   * Get the session data either from cache or from AWS Secrets Manager if no unexpired cached
   * information is available.
   *
   * @returns The session data
   */
  async #getSessionData(): Promise<SessionData> {
    if (this.#cache !== undefined && this.#cache.exp > Date.now() / 1000) {
      return this.#cache.sessionData;
    }

    const res = await this.#sm.getSecretValue({ SecretId: this.#secretArn });
    const sessionData = parseBase64SessionData(res.SecretString!);
    const maxCacheLifetime = this.#opts?.maxCacheLifetime;
    let exp =
      maxCacheLifetime !== undefined
        ? Math.min(Date.now() / 1000 + maxCacheLifetime, sessionData.session_info.auth_token_exp)
        : sessionData.session_info.auth_token_exp;

    // Limit cache lifetime by the next scheduled rotation if the user requested it
    if (this.#opts?.checkScheduledRotation ?? true) {
      const desc = await this.#sm.describeSecret({ SecretId: this.#secretArn });
      if (desc.NextRotationDate !== undefined) {
        exp = Math.min(exp, desc.NextRotationDate.getTime() / 1000);
      }
    }

    this.#cache = {
      sessionData,
      exp,
    };
    return this.#cache.sessionData;
  }
}

/** Manages session data stored in a secret in AWS Secrets Maanger */
export class AwsSecretManager {
  /** Client for AWS Secrets Manager */
  #sm: SecretsManager;
  /** ID of the secret */
  #secretArn: string;

  /**
   * Writes session data to the secret.
   *
   * @param session The session data to write
   */
  async update(session: SessionData): Promise<void> {
    await this.#sm.updateSecret({
      SecretId: this.#secretArn,
      SecretString: serializeBase64SessionData(session),
    });
  }

  /**
   * Refreshes the session and writes the new session to AWS Secrets Manager.
   */
  async refresh(): Promise<void> {
    const res = await this.#sm.getSecretValue({ SecretId: this.#secretArn });
    const newSessionData = await refresh(parseBase64SessionData(res.SecretString!));
    await this.update(newSessionData);
  }

  /**
   * Constructor.
   *
   * @param secretId The name of the secret holding the token
   */
  constructor(secretId: string) {
    this.#sm = new SecretsManager();
    this.#secretArn = secretId;
  }
}
