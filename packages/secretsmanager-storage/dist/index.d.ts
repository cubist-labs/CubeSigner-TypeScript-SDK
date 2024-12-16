import { type SessionData, type SessionManager, type SessionMetadata } from "@cubist-labs/cubesigner-sdk";
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
export declare class AwsSecretSessionManager implements SessionManager {
    #private;
    /**
     * Constructor.
     *
     * @param secretId The name of the secret holding the token
     * @param opts Options for the session manager
     */
    constructor(secretId: string, opts?: AwsSecretSessionManagerOpts);
    /** @inheritdoc */
    onInvalidToken(): Promise<void>;
    /** @inheritdoc */
    metadata(): Promise<SessionMetadata>;
    /** @inheritdoc */
    token(): Promise<string>;
}
/** Manages session data stored in a secret in AWS Secrets Maanger */
export declare class AwsSecretManager {
    #private;
    /**
     * Writes session data to the secret.
     *
     * @param session The session data to write
     */
    update(session: SessionData): Promise<void>;
    /**
     * Refreshes the session and writes the new session to AWS Secrets Manager.
     */
    refresh(): Promise<void>;
    /**
     * Constructor.
     *
     * @param secretId The name of the secret holding the token
     */
    constructor(secretId: string);
}
export {};
//# sourceMappingURL=index.d.ts.map