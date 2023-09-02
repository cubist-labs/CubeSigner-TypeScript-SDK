import { Client } from "../client";
import { EnvInterface } from "..";
import { OrgSessionManager } from "./session_manager";
import { SessionStorage } from "./session_storage";
/** JSON representation of the OIDC token */
export interface OidcSessionData {
    /** The environment that this token is for */
    env: EnvInterface;
    /** The organization ID */
    org_id: string;
    /** The OIDC token that this session was created from */
    oidc_token: string;
    /** The token to include in Authorization header */
    token: string;
    /** Token expiration timestamp */
    token_exp: number;
    /** The scopes of the token */
    scopes: Array<string>;
}
/** Type of storage required for OIDC sessions */
export type OidcSessionStorage = SessionStorage<OidcSessionData>;
/** Manager for OIDC sessions. */
export declare class OidcSessionManager extends OrgSessionManager<OidcSessionData> {
    #private;
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
     * Refreshes the session if it is about to expire.
     * @return {boolean} Whether the session token was refreshed.
     * @internal
     */
    refreshIfNeeded(): Promise<boolean>;
    /**
     * Authenticate an OIDC user and create a new session for them.
     * @param {EnvInterface} env The environment of the session
     * @param {SessionStorage<SignerSessionObject>} storage The signer session storage
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @return {Promise<OidcSessionManager>} The signer session
     */
    static create(env: EnvInterface, storage: SessionStorage<OidcSessionData>, oidcToken: string, orgId: string, scopes: Array<string>): Promise<OidcSessionManager>;
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} orgId The id of the org associated with this session
     * @param {string} token The authorization token to use
     * @param {SessionStorage<U>} storage The storage back end to use for storing
     *                                    session information
     */
    private constructor();
}
