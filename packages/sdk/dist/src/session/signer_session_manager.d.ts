import { Events } from "../events";
import { EnvInterface } from "../env";
import { Client } from "../api";
import { SessionStorage } from "./session_storage";
import { ClientSessionInfo, NewSessionResponse } from "../schema_types";
import { operations } from "../schema";
/** JSON representation of our "signer session" file format */
export interface SignerSessionData {
    /** The organization ID */
    org_id: string;
    /** The role ID */
    role_id?: string;
    /** The purpose of the session token */
    purpose?: string;
    /** The token to include in Authorization header */
    token: string;
    /** Session info */
    session_info: ClientSessionInfo;
    /** Session expiration (in seconds since UNIX epoch) beyond which it cannot be refreshed */
    session_exp: number | undefined;
    /** The environment */
    env: {
        ["Dev-CubeSignerStack"]: EnvInterface;
    };
}
/** Type of storage required for signer sessions */
export type SignerSessionStorage = SessionStorage<SignerSessionData>;
export interface SignerSessionLifetime {
    /** Session lifetime (in seconds). Defaults to one week (604800). */
    session?: number;
    /** Auth token lifetime (in seconds). Defaults to five minutes (300). */
    auth: number;
    /** Refresh token lifetime (in seconds). Defaults to one day (86400). */
    refresh?: number;
    /** Grace lifetime (in seconds). Defaults to 30 seconds (30). */
    grace?: number;
}
/** Generic session manager interface. */
export declare class SignerSessionManager {
    #private;
    readonly env: EnvInterface;
    readonly orgId: string;
    readonly storage: SignerSessionStorage;
    readonly events: Events;
    /**
     * @return {string} The current auth token.
     * @internal
     */
    token(): Promise<string>;
    /**
     * Refreshes the current session if needed, then returns a client using the current session.
     *
     * May **UPDATE/MUTATE** self.
     *
     * @param {operations} operation The operation that this client will be
     *   used for. This parameter is used exclusively for more accurate error
     *   reporting and does not affect functionality.
     * @return {Client} The client with the current session
     */
    client(operation?: keyof operations): Promise<Client>;
    /** Revokes the session. */
    revoke(): Promise<void>;
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    refresh(): Promise<void>;
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    isStale(): Promise<boolean>;
    /**
     * Return whether this session has expired and cannot be refreshed anymore.
     * @return {boolean} Whether this session has expired.
     * @internal
     */
    hasExpired(): boolean;
    /**
     * Refreshes the session if it is about to expire.
     * @return {boolean} Whether the session token was refreshed.
     * @internal
     */
    refreshIfNeeded(): Promise<boolean>;
    /**
     * Automatically refreshes the session in the background (if needed) every
     * minute. This is a simple wrapper around `setInterval`.
     * @return {number} The interval ID of the refresh timer.
     */
    autoRefresh(): RefreshId;
    /**
     * Clears the auto refresh timer.
     * @param {number} timer The timer ID to clear.
     */
    clearAutoRefresh(timer: RefreshId): void;
    /**
     * @param {EnvInterface} env The CubeSigner environment
     * @param {string} orgId The organization ID
     * @param {NewSessionResponse} session The session information.
     * @param {SignerSessionStorage} storage The storage to use for saving the session.
     * @return {Promise<SignerSessionManager>} New signer session manager.
     */
    static createFromSessionInfo(env: EnvInterface, orgId: string, session: NewSessionResponse, storage?: SignerSessionStorage): Promise<SignerSessionManager>;
    /**
     * @param {SignerSessionData} sessionData The session information.
     * @param {SignerSessionStorage} storage The storage to use for saving the session.
     * @return {Promise<SignerSessionManager>} New signer session manager.
     */
    static createFromSessionData(sessionData: SignerSessionData, storage?: SignerSessionStorage): Promise<SignerSessionManager>;
    /**
     * Uses an existing session to create a new signer session manager.
     *
     * @param {SignerSessionStorage} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session manager
     */
    static loadFromStorage(storage: SignerSessionStorage): Promise<SignerSessionManager>;
    /**
     * Constructor.
     * @param {SignerSessionData} sessionData Session data
     * @param {SignerSessionStorage} storage The session storage to use.
     */
    constructor(sessionData: SignerSessionData, storage: SignerSessionStorage);
}
/** Type of the refresh timer ID. */
export type RefreshId = ReturnType<typeof setInterval>;
