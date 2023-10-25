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
export type IdentityProof = components["schemas"]["IdentityProof"];
type OidcAuthResponse = paths["/v0/org/{org_id}/oidc"]["post"]["responses"]["200"]["content"]["application/json"];
/** TOTP challenge that must be answered before user's TOTP is updated */
export declare class TotpChallenge {
    #private;
    /** The id of the challenge */
    get totpId(): string;
    /** The new TOTP configuration */
    get totpUrl(): string;
    /**
     * @param {CubeSigner} cs Used when answering the challenge.
     * @param {TotpInfo} totpInfo TOTP challenge information.
     */
    constructor(cs: CubeSigner, totpInfo: TotpInfo);
    /**
     * Answer the challenge with the code that corresponds to this `this.totpUrl`.
     * @param {string} code 6-digit code that corresponds to this `this.totpUrl`.
     */
    answer(code: string): Promise<void>;
}
/** CubeSigner client */
export declare class CubeSigner {
    #private;
    readonly sessionMgr?: CognitoSessionManager | SignerSessionManager;
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env(): EnvInterface;
    /**
     * Loads an existing management session and creates a CubeSigner instance.
     *
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
     * Retrieves existing MFA request.
     *
     * @param {string} orgId Organization ID
     * @param {string} mfaId MFA request ID
     * @return {Promise<MfaRequestInfo>} MFA request information
     */
    mfaGet(orgId: string, mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Creates a request to change user's TOTP. This request returns a new TOTP challenge
     * that must be answered by calling `resetTotpComplete`
     *
     * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
     */
    resetTotpStart(mfaReceipt?: MfaReceipt): Promise<SignResponse<TotpChallenge>>;
    /**
     * Answer the TOTP challenge issued by `resetTotpStart`. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.
     *
     * @param {string} totpId - The ID of the TOTP challenge
     * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
     */
    resetTotpComplete(totpId: string, code: string): Promise<void>;
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
    /**
     * Deletes a given key.
     * @param {string} orgId - Organization id
     * @param {string} keyId - Key id
     */
    deleteKey(orgId: string, keyId: string): Promise<void>;
    /** Get the management client.
     * @return {Client} The client.
     * @internal
     * */
    management(): Promise<Client>;
    /**
     * Obtain a proof of authentication.
     *
     * @param {string} orgId The id of the organization that the user is in
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    proveIdentity(orgId: string): Promise<IdentityProof>;
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    oidcProveIdentity(oidcToken: string, orgId: string): Promise<IdentityProof>;
    /**
     * Checks if a given identity proof is valid.
     *
     * @param {string} orgId The id of the organization that the user is in.
     * @param {IdentityProof} identityProof The proof of authentication.
     */
    verifyIdentity(orgId: string, identityProof: IdentityProof): Promise<void>;
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
    /** Corresponding org ID */
    mfaOrgId: string;
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
