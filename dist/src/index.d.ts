import { EnvInterface } from "./env";
import { components, Client } from "./client";
import { Org } from "./org";
import { SignerSessionStorage } from "./session/signer_session_manager";
import { SignerSession } from "./signer_session";
import { ManagementSessionManager, ManagementSessionStorage } from "./session/management_session_manager";
import { OidcSessionManager, OidcSessionStorage } from "./session/oidc_session_manager";
/** CubeSigner constructor options */
export interface CubeSignerOptions {
    /** The environment to use */
    env?: EnvInterface;
    /** The management authorization token */
    sessionMgr?: ManagementSessionManager | OidcSessionManager;
}
export type UserInfo = components["schemas"]["UserInfo"];
export type TotpInfo = components["responses"]["TotpInfo"]["content"]["application/json"];
export type ConfiguredMfa = components["schemas"]["ConfiguredMfa"];
/** CubeSigner client */
export declare class CubeSigner {
    #private;
    readonly sessionMgr?: ManagementSessionManager | OidcSessionManager;
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env(): EnvInterface;
    /**
     * Loads an existing management session and creates a CubeSigner instance.
     * @param {ManagementSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the management session from the config
     * directory will be loaded.
     * @return {Promise<CubeSigner>} New CubeSigner instance
     */
    static loadManagementSession(storage?: ManagementSessionStorage): Promise<CubeSigner>;
    /**
     * Loads a signer session from a session storage (e.g., session file).
     * @param {SignerSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the signer session from the config
     * directory will be loaded.
     * @return {Promise<SignerSession>} New signer session
     */
    static loadSignerSession(storage?: SignerSessionStorage): Promise<SignerSession>;
    /**
     * Loads a signer session from OIDC storage
     * @param {OidcSessionStorage} storage The storage to load from
     * @return {Promise<SignerSession>} New signer session
     */
    static loadOidcSession(storage: OidcSessionStorage): Promise<SignerSession>;
    /**
     * Create a new CubeSigner instance.
     * @param {CubeSignerOptions} options The options for the CubeSigner instance.
     */
    constructor(options: CubeSignerOptions);
    /**
     * Authenticate an OIDC user and create a new OIDC session manager for them.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {OidcSessionStorage} storage The signer session storage
     * @return {Promise<OidcSessionManager>} The OIDC session manager
     */
    createOidcManager(oidcToken: string, orgId: string, scopes: Array<string>, storage?: OidcSessionStorage): Promise<OidcSessionManager>;
    /**
     * Authenticate an OIDC user and create a new session for them.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {OidcSessionStorage} storage The signer session storage
     * @return {Promise<SignerSession>} The signer session
     */
    createOidcSession(oidcToken: string, orgId: string, scopes: Array<string>, storage?: OidcSessionStorage): Promise<SignerSession>;
    /** Retrieves information about the current user. */
    aboutMe(): Promise<UserInfo>;
    /**
     * Creates and sets a new TOTP configuration for the logged-in user,
     * overriding the existing one (if any).
     */
    resetTotp(): Promise<TotpInfo>;
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     * @param {string} code Current TOTP code
     */
    verifyTotp(code: string): Promise<void>;
    /** Retrieves information about an organization.
     * @param {string} orgId The ID or name of the organization.
     * @return {Org} The organization.
     * */
    getOrg(orgId: string): Promise<Org>;
    /** Get the management client.
     * @return {Client} The client.
     * @internal
     * */
    management(): Promise<Client>;
}
/** Organizations */
export * from "./org";
/** Keys */
export * from "./key";
/** Roles */
export * from "./role";
/** Env */
export * from "./env";
/** Sessions */
export * from "./signer_session";
/** Session storage */
export * from "./session/session_storage";
/** Session manager */
export * from "./session/session_manager";
/** Management session manager */
export * from "./session/management_session_manager";
/** OIDC session manager */
export * from "./session/oidc_session_manager";
/** Signer session manager */
export * from "./session/signer_session_manager";
/** Export ethers.js Signer */
export * as ethers from "./ethers";
