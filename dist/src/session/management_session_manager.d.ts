import { Client } from "../client";
import { HasEnv, SessionManager } from "./session_manager";
import { SessionStorage } from "./session_storage";
/** JSON representation of our "management session" file format */
export interface ManagementSessionObject {
    /** The email address of the user */
    email: string;
    /** The ID token */
    id_token: string;
    /** The access token */
    access_token: string;
    /** The refresh token */
    refresh_token: string;
    /** The expiration time of the access token */
    expiration: string;
}
export interface ManagementSessionInfo extends ManagementSessionObject, HasEnv {
}
/** Type of storage required for management sessions */
export type ManagementSessionStorage = SessionStorage<ManagementSessionInfo>;
/** The session manager for management sessions */
export declare class ManagementSessionManager extends SessionManager<ManagementSessionInfo> {
    #private;
    /**
     * @return {string} The current auth token.
     * @internal
     */
    token(): Promise<string>;
    /**
     * Returns a client with the current session and refreshes the current
     * session.
     */
    client(): Promise<Client>;
    /** Revokes the session. */
    revoke(): Promise<void>;
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    isStale(): Promise<boolean>;
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    refresh(): Promise<void>;
    /**
     * Loads an existing management session from storage.
     * @param {ManagementSessionStorage} storage The storage back end to use
     * @return {Promise<SingerSession>} New token
     */
    static loadFromStorage(storage: ManagementSessionStorage): Promise<ManagementSessionManager>;
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} token The current token of the session
     * @param {ManagementSessionStorage} storage The storage back end to use
     */
    private constructor();
}
