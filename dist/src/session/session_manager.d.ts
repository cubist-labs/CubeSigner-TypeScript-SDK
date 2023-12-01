import { SessionStorage } from "..";
import { EnvInterface } from "../env";
import { Client } from "../api";
/** Generic session manager interface. */
export declare abstract class SessionManager<U> {
    readonly env: EnvInterface;
    readonly storage: SessionStorage<U>;
    /**
     * @return {string} The current auth token.
     * @internal
     */
    abstract token(): Promise<string>;
    /** Returns a client instance that uses the token. */
    abstract client(): Promise<Client>;
    /** Revokes the session. */
    abstract revoke(): Promise<void>;
    /** Refreshes the session. */
    abstract refresh(): Promise<void>;
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    abstract isStale(): Promise<boolean>;
    /**
     * Refreshes the session if it is about to expire.
     * @return {boolean} Whether the session token was refreshed.
     * @internal
     */
    refreshIfNeeded(): Promise<boolean>;
    /**
     * Automatically refreshes the session in the background.
     * The default implementation refreshes (if needed) every minute.
     * Base implementations can, instead use the token expirations timestamps
     * to refresh less often. This is a simple wrapper around `setInterval`.
     * @return {number} The interval ID of the refresh timer.
     */
    autoRefresh(): RefreshId;
    /**
     * Clears the auto refresh timer.
     * @param {number} timer The timer ID to clear.
     */
    clearAutoRefresh(timer: RefreshId): void;
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {SessionStorage<U>} storage The storage back end to use for storing
     *                                    session information
     */
    constructor(env: EnvInterface, storage: SessionStorage<U>);
    /**
     * Creates a new REST client with a given token
     * @param {string} token The authorization token to use for the client
     * @return {Client} The new REST client
     */
    protected createClient(token: string): Client;
    /**
     * Check if a timestamp has expired.
     * @param {number} exp The timestamp to check
     * @param {number} buffer Optional time buffer when checking the expiration
     * @return {boolean} True if the timestamp has expired
     */
    protected hasExpired(exp: number, buffer?: number): boolean;
    /**
     * Throws an error that says that some feature is unsupported.
     * @param {string} name The name of the feature that is not supported
     */
    protected unsupported(name: string): never;
}
/** Interface for a session manager that knows about the org that the session is in. */
export declare abstract class OrgSessionManager<U> extends SessionManager<U> {
    readonly orgId: string;
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} orgId The id of the org associated with this session
     * @param {SessionStorage<U>} storage The storage back end to use for storing
     *                                    session information
     */
    constructor(env: EnvInterface, orgId: string, storage: SessionStorage<U>);
}
export interface HasEnv {
    /** The environment */
    env: {
        ["Dev-CubeSignerStack"]: EnvInterface;
    };
}
/** Type of the refresh timer ID. */
export type RefreshId = ReturnType<typeof setInterval>;
