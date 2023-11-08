import { CubeSigner, EnvInterface } from "..";
import { components, paths, Client } from "../client";
import { HasEnv, OrgSessionManager } from "./session_manager";
import { SessionStorage } from "./session_storage";
export type ClientSessionInfo = components["schemas"]["ClientSessionInfo"];
export type NewSessionResponse = components["schemas"]["NewSessionResponse"];
export type CreateSignerSessionRequest = paths["/v0/org/{org_id}/roles/{role_id}/tokens"]["post"]["requestBody"]["content"]["application/json"];
export type RefreshSignerSessionRequest = paths["/v1/org/{org_id}/token/refresh"]["patch"]["requestBody"]["content"]["application/json"];
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
    readonly cs?: CubeSigner;
    /**
     * @return {string} The current auth token.
     * @internal
     */
    token(): Promise<string>;
    /**
     * Returns a client with the current session and refreshes the current
     * session. May **UPDATE/MUTATE** self.
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
     * Create a new signer session.
     * @param {CubeSigner} cs The CubeSigner instance
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {string} orgId Org ID
     * @param {string} roleId Role ID
     * @param {string} purpose The purpose of the session
     * @param {SignerSessionLifetime} ttl Lifetime settings
     * @return {Promise<SignerSessionManager>} New signer session
     */
    static create(cs: CubeSigner, storage: SignerSessionStorage, orgId: string, roleId: string, purpose: string, ttl?: SignerSessionLifetime): Promise<SignerSessionManager>;
    /**
     * @param {EnvInterface} env The CubeSigner environment
     * @param {string} orgId The organization ID
     * @param {NewSessionResponse} session The session information.
     * @param {SignerSessionStorage} storage The storage to use for saving the session.
     * @return {Promise<SignerSessionManager>} New signer session manager.
     */
    static createFromSessionInfo(env: EnvInterface, orgId: string, session: NewSessionResponse, storage?: SignerSessionStorage): Promise<SignerSessionManager>;
    /**
     * Uses an existing session to create a new signer session manager.
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {CubeSigner} cs Optional CubeSigner instance.
     *    Currently used for token revocation; will be completely removed
     *    since token revocation should not require management session.
     * @return {Promise<SingerSession>} New signer session manager
     */
    static loadFromStorage(storage: SignerSessionStorage, cs?: CubeSigner): Promise<SignerSessionManager>;
    /**
     * Constructor.
     * @param {SignerSessionData} sessionData Session data
     * @param {SignerSessionStorage} storage The session storage to use
     * @param {CubeSigner} cs Optional CubeSigner instance.
     *    Currently used for token revocation; will be completely removed
     *    since token revocation should not require management session.
     * @internal
     */
    private constructor();
}
