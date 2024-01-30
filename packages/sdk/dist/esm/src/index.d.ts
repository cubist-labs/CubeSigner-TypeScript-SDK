import { EnvInterface } from "./env";
import { Client } from "./api";
import { CubeSignerClient } from "./client";
import { Org } from "./org";
import { SignerSessionStorage, SignerSessionManager, SignerSessionData } from "./session/signer_session_manager";
import { CubeSignerResponse } from "./response";
import { SignerSession } from "./signer_session";
import { MfaReceipt } from "./mfa";
import { IdentityProof, MfaRequestInfo, RatchetConfig, UserInfo } from "./schema_types";
/** CubeSigner constructor options */
export interface CubeSignerOptions {
    /** The environment to use */
    env?: EnvInterface;
    /** The management authorization token */
    sessionMgr?: SignerSessionManager;
    /** Optional organization id */
    orgId?: string;
}
/**
 * CubeSigner client
 *
 * @deprecated Use {@link Org} or {@link CubeSignerClient} instead.
 */
export declare class CubeSigner {
    #private;
    readonly sessionMgr?: SignerSessionManager;
    /**
     * Underlying {@link CubeSignerClient} instance, if set; otherwise throws.
     * @internal
     */
    get csc(): CubeSignerClient;
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env(): EnvInterface;
    /** Organization ID */
    get orgId(): string;
    /**
     * Set the organization ID
     * @param {string} orgId The new organization id.
     */
    setOrgId(orgId: string): void;
    /**
     * Loads an existing management session and creates a CubeSigner instance.
     *
     * @param {SignerSessionStorage} storage Session storage to load the session from.
     * @return {Promise<CubeSigner>} New CubeSigner instance
     */
    static loadManagementSession(storage: SignerSessionStorage): Promise<CubeSigner>;
    /**
     * Loads a signer session from a session storage (e.g., session file).
     * @param {SignerSessionStorage} storage Session storage to load the session from.
     * @return {Promise<SignerSession>} New signer session
     */
    static loadSignerSession(storage: SignerSessionStorage): Promise<SignerSession>;
    /**
     * Create a new CubeSigner instance.
     * @param {CubeSignerOptions} options The optional configuration options for the CubeSigner instance.
     */
    constructor(options?: CubeSignerOptions);
    /**
     * Authenticate an OIDC user and create a new session manager for them.
     *
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {SignerSessionStorage?} storage Optional signer session storage (defaults to in-memory storage)
     * @return {Promise<SignerSessionManager>} The signer session manager
     */
    oidcAuth(oidcToken: string, orgId: string, scopes: Array<string>, lifetimes?: RatchetConfig, storage?: SignerSessionStorage): Promise<SignerSessionManager>;
    /**
     * Retrieves information about the current user.
     *
     * @return {Promise<UserInfo>} User information.
     */
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
     * List pending MFA requests accessible to the current user.
     * @param {string} orgId Organization ID
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    mfaList(orgId: string): Promise<MfaRequestInfo[]>;
    /**
     * Approve a pending MFA request.
     *
     * @param {string} orgId The org id of the MFA request
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    mfaApprove(orgId: string, mfaId: string): Promise<MfaRequestInfo>;
    /** Initiate adding a new FIDO device. MFA may be required. */
    get addFidoStart(): (name: string, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<import("./mfa").AddFidoChallenge>>;
    /**
     * Creates a request to change user's TOTP. This request returns a new TOTP challenge
     * that must be answered by calling `resetTotpComplete`
     */
    get resetTotpStart(): (issuer?: string | undefined, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<import("./mfa").TotpChallenge>>;
    /**
     * Answer the TOTP challenge issued by `resetTotpStart`. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.he TOTP configuration from the challenge.
     */
    get resetTotpComplete(): (totpId: string, code: string) => Promise<void>;
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     */
    get verifyTotp(): (code: string) => Promise<void>;
    /**
     * Retrieve information about an organization.
     * @param {string} orgId The ID or name of the organization.
     * @return {Org} The organization.
     */
    getOrg(orgId?: string): Promise<Org>;
    /**
     * Deletes a given key.
     * @param {string} orgId - Organization id
     * @param {string} keyId - Key id
     */
    deleteKey(orgId: string, keyId: string): Promise<void>;
    /**
     * Get the management client.
     * @return {Client} The client.
     * @internal
     */
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
     * @return {Promise<CubeSignerResponse<SignerSessionData>>} The session data.
     */
    oidcLogin(oidcToken: string, orgId: string, scopes: Array<string>, lifetimes?: RatchetConfig, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<SignerSessionData>>;
}
/** Errors */
export * from "./error";
/** API */
export * from "./api";
/** Client */
export * from "./client";
/** Callbacks */
export { Events, EventHandler, ErrorEvent, GlobalEvents, SessionExpiredEvent } from "./events";
/** Organizations */
export * from "./org";
/** Keys */
export * from "./key";
/** Roles */
export * from "./role";
/** Env */
export * from "./env";
/** Fido */
export * from "./mfa";
/** Pagination */
export * from "./paginator";
/** Response */
export * from "./response";
/** Types */
export * from "./schema_types";
/** Sessions */
export * from "./signer_session";
/** Session storage */
export * from "./session/session_storage";
/** Signer session manager */
export * from "./session/signer_session_manager";
/** Utils */
export * from "./util";
/** User-export decryption helper */
export { userExportDecrypt, userExportKeygen } from "./user_export";
/** CubeSigner SDK package name */
export declare const NAME: string;
/** CubeSigner SDK version */
export declare const VERSION: string;
