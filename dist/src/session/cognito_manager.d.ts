import { Client } from "../api";
import { HasEnv, OrgSessionManager } from "./session_manager";
import { SessionStorage } from "./session_storage";
/** JSON representation of our "management session" file format */
export interface CognitoSessionObject {
    /** The organization ID */
    org_id: string;
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
export interface CognitoSessionInfo extends CognitoSessionObject, HasEnv {
}
/** Type of storage required for cognito (management) sessions */
export type CognitoSessionStorage = SessionStorage<CognitoSessionInfo>;
/** The session manager for cognito (management) sessions */
export declare class CognitoSessionManager extends OrgSessionManager<CognitoSessionInfo> {
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
     * Loads an existing cognito (management) session from storage.
     * @param {CognitoSessionStorage} storage The storage back end to use
     * @return {Promise<SingerSession>} New token
     */
    static loadFromStorage(storage: CognitoSessionStorage): Promise<CognitoSessionManager>;
    /**
     * Loads an existing management session and creates a Cognito session manager for it.
     *
     * @param {CognitoSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the management session from the config
     * directory will be loaded.
     * @return {Promise<CognitoSessionManager>} Cognito session manager
     */
    static loadManagementSession(storage?: CognitoSessionStorage): Promise<CognitoSessionManager>;
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} orgId The id of the org associated with this session
     * @param {string} token The current token of the session
     * @param {CognitoSessionStorage} storage The storage back end to use
     */
    private constructor();
}
