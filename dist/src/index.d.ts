import { EnvInterface } from "./env";
import { components, Client, paths } from "./client";
import { Org } from "./org";
import { SignerSessionStorage, SignerSessionManager } from "./session/signer_session_manager";
import { MfaRequestInfo, SignResponse, SignerSession } from "./signer_session";
import { CognitoSessionManager, CognitoSessionStorage } from "./session/cognito_manager";
/** CubeSigner constructor options */
export interface CubeSignerOptions {
    /** The environment to use */
    env?: EnvInterface;
    /** The management authorization token */
    sessionMgr?: CognitoSessionManager | SignerSessionManager;
}
export type UserInfo = components["schemas"]["UserInfo"];
export type TotpInfo = components["responses"]["TotpInfo"]["content"]["application/json"];
export type ConfiguredMfa = components["schemas"]["ConfiguredMfa"];
export type RatchetConfig = components["schemas"]["RatchetConfig"];
type OidcAuthResponse = paths["/v0/org/{org_id}/oidc"]["post"]["responses"]["200"]["content"]["application/json"];
/** CubeSigner client */
export declare class CubeSigner {
    #private;
    readonly sessionMgr?: CognitoSessionManager | SignerSessionManager;
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env(): EnvInterface;
    /**
     * Loads an existing management session and creates a CubeSigner instance.
     * @param {CognitoSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the management session from the config
     * directory will be loaded.
     * @return {Promise<CubeSigner>} New CubeSigner instance
     */
    static loadManagementSession(storage?: CognitoSessionStorage): Promise<CubeSigner>;
    /**
     * Loads a signer session from a session storage (e.g., session file).
     * @param {SignerSessionStorage} storage Optional session storage to load
     * the session from. If not specified, the signer session from the config
     * directory will be loaded.
     * @return {Promise<SignerSession>} New signer session
     */
    static loadSignerSession(storage?: SignerSessionStorage): Promise<SignerSession>;
    /**
     * Create a new CubeSigner instance.
     * @param {CubeSignerOptions} options The optional configuraiton options for the CubeSigner instance.
     */
    constructor(options?: CubeSignerOptions);
    /**
     * Authenticate an OIDC user and create a new session manager for them.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {SignerSessionStorage?} storage Optional signer session storage (defaults to in-memory storage)
     * @return {Promise<SignerSessionManager>} The signer session manager
     */
    oidcAuth(oidcToken: string, orgId: string, scopes: Array<string>, lifetimes?: RatchetConfig, storage?: SignerSessionStorage): Promise<SignerSessionManager>;
    /** Retrieves information about the current user. */
    aboutMe(): Promise<UserInfo>;
    /**
     * Creates and sets a new TOTP configuration for the logged in user,
     * if and only if no TOTP configuration is already set.
     *
     * @return {Promise<TotpInfo>} Newly created TOTP configuration.
     */
    initTotp(): Promise<TotpInfo>;
    /**
     * Retrieves existing MFA request.
     *
     * @param {string} orgId Organization ID
     * @param {string} mfaId MFA request ID
     * @return {Promise<MfaRequestInfo>} MFA request information
     */
    mfaGet(orgId: string, mfaId: string): Promise<MfaRequestInfo>;
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
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<SignResponse<OidcAuthResponse>>} The session data.
     */
    oidcLogin(oidcToken: string, orgId: string, scopes: Array<string>, lifetimes?: RatchetConfig, mfaReceipt?: MfaReceipt): Promise<SignResponse<OidcAuthResponse>>;
}
/** MFA receipt */
export interface MfaReceipt {
    /** MFA request ID */
    mfaId: string;
    /** MFA confirmation code */
    mfaConf: string;
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
export * from "./session/cognito_manager";
/** Signer session manager */
export * from "./session/signer_session_manager";
/** Export ethers.js Signer */
export * as ethers from "./ethers";
