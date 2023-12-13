import { ClientSessionInfo, NewSessionResponse } from "../schema_types";
import { Client } from "../api";
import { HasEnv, OrgSessionManager } from "./session_manager";
import { SessionStorage } from "./session_storage";
import { EnvInterface } from "../env";
/** JSON representation of our "signer session" file format */
export interface SignerSessionObject {
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
}
export interface SignerSessionData extends SignerSessionObject, HasEnv {
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
/** Manager for signer sessions. */
export declare class SignerSessionManager extends OrgSessionManager<SignerSessionData> {
    #private;
    /**
     * @return {string} The current auth token.
     * @internal
     */
    token(): Promise<string>;
    /**
     * Refreshes the current session if needed, then returns a client using the current session.
     *
     * May **UPDATE/MUTATE** self.
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
     *
     * @param {SignerSessionData} sessionData Session data
     * @param {SignerSessionStorage} storage The session storage to use.
     */
    protected constructor(sessionData: SignerSessionData, storage: SignerSessionStorage);
}
