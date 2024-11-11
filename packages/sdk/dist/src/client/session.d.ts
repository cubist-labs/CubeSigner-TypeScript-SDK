import type { EnvInterface } from "../env";
import type { ClientSessionInfo } from "../schema_types";
export interface SessionLifetime {
    /** Session lifetime (in seconds). Defaults to one week (604800). */
    session?: number;
    /** Auth token lifetime (in seconds). Defaults to five minutes (300). */
    auth: number;
    /** Refresh token lifetime (in seconds). Defaults to one day (86400). */
    refresh?: number;
    /** Grace lifetime (in seconds). Defaults to 30 seconds (30). */
    grace?: number;
}
/** JSON representation of the CubeSigner session file format */
export interface SessionData {
    /** The organization ID */
    org_id: string;
    /** The role ID */
    role_id?: string;
    /** The purpose of the session token */
    purpose?: string;
    /** The token to include in Authorization header */
    token: string;
    /** The token to use to refresh the session */
    refresh_token: string;
    /** Session info */
    session_info: ClientSessionInfo;
    /** Session expiration (in seconds since UNIX epoch) beyond which it cannot be refreshed */
    session_exp: number | undefined;
    /** The environment */
    env: {
        ["Dev-CubeSignerStack"]: EnvInterface;
    };
}
type SafeSessionDataFields = "env" | "org_id" | "role_id" | "purpose" | "session_exp";
/** Represents either the SessionData or a base64 JSON encoding of it */
export type SessionLike = string | SessionData;
/**
 * Utility function that parses base64 encoded SessionData, if necessary.
 * This allows SessionManagers to easily ingest the multiple supported formats for sessions.
 *
 * @param {SessionLike} session The session object or encoding
 * @return {SessionData} The session object
 */
export declare function parseSessionLike(session: SessionLike): SessionData;
/** Non-sensitive info about a session */
export type SessionMetadata = Pick<SessionData, SafeSessionDataFields> & {
    [K in Exclude<keyof SessionData, SafeSessionDataFields>]?: never;
} & {
    session_id: string;
    epoch: number;
};
/**
 * A SessionManager's job is to handle session persistence and refreshes
 *
 * The interface does not impose *when* a refresh must occur, though typically
 * this will be on request.
 */
export interface SessionManager {
    /**
     * Load the metadata for the session. Should throw if not available
     *
     * @return {SessionMetadata} Info about the session
     *
     * @throws {NoSessionFoundError} If the session is not available
     */
    metadata(): Promise<SessionMetadata>;
    /**
     * Load the token to be used for a request. This will be invoked by the client
     * to provide the Authorization header
     *
     * @return {SessionMetadata} Info about the session
     *
     * @throws {NoSessionFoundError} If the session is not available
     */
    token(): Promise<string>;
}
/**
 * Allows the construction of clients which do not automatically refresh
 * sessions.
 *
 * For example:
 * ```typescript
 * const manager = new NoRefreshSessionManager(sessionData);
 * const client = await CubeSignerClient.create(manager);
 * ```
 */
export declare class NoRefreshSessionManager implements SessionManager {
    #private;
    /**
     * Constructs the manager with the session data
     *
     * @param {SessionLike} session The session for this manager to use
     */
    constructor(session: SessionLike);
    /** Provides non-sensitive metadata on the session */
    metadata(): Promise<SessionMetadata>;
    /** Provides the token to use for requests */
    token(): Promise<string>;
}
/**
 * A template for session managers which have exclusive access to a session
 * and can store/load them freely.
 *
 * It is NOT suitable for applications where multiple clients are using the same
 * session as they will both attempt to refresh independently.
 */
export declare abstract class ExclusiveSessionManager implements SessionManager {
    #private;
    /**
     * Retrieve the SessionData from storage
     */
    abstract retrieve(): Promise<SessionData>;
    /**
     * Store the SessionData into storage
     * @param data The data to store
     */
    abstract store(data: SessionData): Promise<void>;
    /**
     * Loads the session metadata from storage
     * @return {Promise<SessionMetadata>}
     */
    metadata(): Promise<SessionMetadata>;
    /**
     * Loads the token from storage, refreshing if necessary
     * @return {Promise<SessionMetadata>}
     */
    token(): Promise<string>;
    /**
     * Manually force a token refresh
     *
     * @return {SessionData} The newly refreshed session data
     * @internal
     */
    forceRefresh(): Promise<SessionData>;
}
/** Implements a SessionManager without persistence */
export declare class MemorySessionManager extends ExclusiveSessionManager {
    #private;
    /**
     * Construct with data in memory
     * @param {SessionData} data The initial session data
     */
    constructor(data: SessionData);
    /** Return the in-memory data */
    retrieve(): Promise<SessionData>;
    /**
     * Store the in-memory data
     * @param {SessionData} data The session data to store
     */
    store(data: SessionData): Promise<void>;
}
/** An error type to be thrown by SessionManager's when the session is unavailable */
export declare class NoSessionFoundError extends Error {
    /** Constructs the error with the appropriate message */
    constructor();
}
/** The number of seconds before expiration time, to attempt a refresh */
export declare const DEFAULT_EXPIRATION_BUFFER_SECS = 30;
/**
 * Invokes the CubeSigner API to refresh a session
 * @param {SessionData} session
 * @return {SessionData}
 */
export declare function refresh(session: SessionData): Promise<SessionData>;
/**
 * Get the safe metadata from a SessionData
 * @param {SessionData} session The session
 * @return {SessionMetadata} The session metadata
 */
export declare function metadata(session: SessionData): SessionMetadata;
export declare const isStale: (session: SessionData) => boolean;
export declare const isRefreshable: (session: SessionData) => boolean;
/**
 * Parses the base64 API session token.
 * Consumes the output of the cli command:
 *
 * ```
 * cs token create --output base64
 * ```
 *
 * @param {string} sessionDataString Base64 encoded API session token.
 *
 * @return {SignerSessionData} session.
 */
export declare function parseBase64SessionData(sessionDataString: string): SessionData;
export {};
//# sourceMappingURL=session.d.ts.map