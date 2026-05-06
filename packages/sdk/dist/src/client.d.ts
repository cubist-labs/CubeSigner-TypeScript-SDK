import { ApiClient } from "./client/api_client";
import type { EmailOtpResponse, IdentityProof, RatchetConfig } from "./schema_types";
import { AddFidoChallenge, TotpChallenge } from "./mfa";
import { Org } from "./org";
import type { MfaReceipts, SessionData, SessionInfo, SessionManager } from ".";
import { Key } from ".";
/** Options for logging in with OIDC token */
export interface OidcAuthOptions {
    /** Optional token lifetimes */
    lifetimes?: RatchetConfig;
    /** Optional MFA receipt(s) */
    mfaReceipt?: MfaReceipts;
}
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export declare class CubeSignerClient {
    #private;
    /**
     * @returns The underlying API client. This client provides direct API access without convenience wrappers.
     */
    get apiClient(): ApiClient;
    /**
     * @returns The environment.
     */
    get env(): import("./env").EnvInterface;
    /**
     * @returns The org ID of the client.
     */
    get orgId(): string;
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     */
    constructor(apiClient: ApiClient);
    /**
     * Construct a client with a session or session manager
     *
     * @param session The session (object or base64 string) or manager that will back this client
     * @param targetOrgId The ID of the organization this client should operate on. Defaults to
     *   the org id from the supplied session. The only scenario in which it makes sense to use
     *   a {@link targetOrgId} different from the session org id is if {@link targetOrgId} is a
     *   child organization of the session organization.
     * @returns A client
     */
    static create(session: string | SessionManager | SessionData, targetOrgId?: string): Promise<CubeSignerClient>;
    /**
     * Get the org associated with this session.
     *
     * @returns The org
     */
    org(): Org;
    /**
     * Get information about an org.
     *
     * @param orgId The ID or name of the org
     * @returns CubeSigner client for the requested org.
     */
    getOrg(orgId: string): Org;
    /**
     * Obtain information about the current user.
     *
     * Same as {@link ApiClient.userGet}, see its documentation for more details.
     *
     * @returns A function that resolves to the current user's information
     */
    get user(): () => Promise<import("./schema_types").UserInfo>;
    /**
     * Get all keys accessible to the current session
     *
     * NOTE: this may be a subset from the keys in the current org.
     *
     * @returns The keys that a client can access
     */
    sessionKeys(): Promise<Key[]>;
    /**
     * Create a new OIDC-backed session.
     *
     * Same as {@link ApiClient.oidcSessionCreate}, see its documentation for more details.
     *
     * @param args Request arguments
     * @returns The new session data
     */
    static createOidcSession(...args: Parameters<typeof ApiClient.oidcSessionCreate>): Promise<Awaited<ReturnType<typeof ApiClient.oidcSessionCreate>>>;
    /**
     * Prove an OIDC identity.
     *
     * Same as {@link ApiClient.identityProveOidc}, see its documentation for more details.
     *
     * @param args Request arguments
     * @returns Proof of authentication
     */
    static proveOidcIdentity(...args: Parameters<typeof ApiClient.identityProveOidc>): Promise<IdentityProof>;
    /**
     * Initialize email OTP authentication.
     *
     * Same as {@link ApiClient.initEmailOtpAuth}, see its documentation for more details.
     *
     * @param args Request arguments
     * @returns — The partial OIDC token that must be combined with the signature in the email
     */
    static initEmailOtpAuth(...args: Parameters<typeof ApiClient.initEmailOtpAuth>): Promise<EmailOtpResponse>;
    /**
     * Creates a request to add a new FIDO device.
     *
     * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
     *
     * MFA may be required.
     *
     * Same as {@link ApiClient.userFidoRegisterInit}, see its documentation for more details.
     *
     * @returns A function that resolves to an AddFidoChallenge
     */
    get addFido(): (name: string | import("./schema_types").schemas["FidoCreateRequest"], mfaReceipt?: MfaReceipts) => Promise<import("./response").CubeSignerResponse<AddFidoChallenge>>;
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * Same as {@link ApiClient.userFidoDelete}, see its documentation for more details.
     *
     * @returns A function that deletes a FIDO key
     */
    get deleteFido(): (fidoId: string, mfaReceipt?: MfaReceipts) => Promise<import("./response").CubeSignerResponse<import("./schema_types").Empty>>;
    /**
     * Create a reference to an existing TOTP challenge.
     *
     * @param totpId The ID of the challenge
     * @returns The TOTP challenge
     */
    getTotpChallenge(totpId: string): TotpChallenge;
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered by calling {@link TotpChallenge.answer}.
     *
     * Same as {@link ApiClient.userTotpResetInit}, see its documentation for more details.
     *
     * @returns A promise that resolves to a TOTP challenge
     */
    get resetTotp(): (issuer?: string, mfaReceipt?: MfaReceipts) => Promise<import("./response").CubeSignerResponse<TotpChallenge>>;
    /**
     * Creates a request to change this user's verified email.
     *
     * Same as {@link ApiClient.userEmailResetInit}, see its documentation for more details.
     *
     * @returns A promise that resolves to an email challenge
     */
    get resetEmail(): (req: string | import("./schema_types").schemas["EmailResetRequest"], mfaReceipt?: MfaReceipts) => Promise<import("./response").CubeSignerResponse<import("./mfa").ResetEmailChallenge>>;
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * Same as {@link ApiClient.userTotpVerify}, see its documentation for more details.
     *
     * @returns A function that verifies the TOTP code, throwing if not valid
     */
    get verifyTotp(): (code: string) => Promise<void>;
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * Same as {@link ApiClient.userTotpDelete}, see its documentation for more details.
     *
     * @returns A function that deletes TOTP from the user
     */
    get deleteTotp(): (mfaReceipt?: MfaReceipts) => Promise<import("./response").CubeSignerResponse<import("./schema_types").Empty>>;
    /**
     * Add a listener for an event
     *
     * Same as {@link ApiClient.addEventListener}, see its documentation for more details.
     *
     * @returns A function that resolves to the ApiClient with the new listener
     */
    get addEventListener(): <E extends "error" | "user-mfa-failed" | "session-expired">(event: E, listener: {
        "user-mfa-failed": (ev: import("./client/base_client").UserMfaFailedEvent) => void;
        "session-expired": (ev: import(".").SessionExpiredEvent) => void;
        error: (ev: import(".").ErrorEvent) => void;
    }[E]) => ApiClient;
    /**
     * Remove a listener for an event
     *
     * Same as {@link ApiClient.removeEventListener}, see its documentation for more details.
     *
     * @returns A function that resolves to the ApiClient with a removed listener
     */
    get removeEventListener(): <E extends "error" | "user-mfa-failed" | "session-expired">(event: E, listener: {
        "user-mfa-failed": (ev: import("./client/base_client").UserMfaFailedEvent) => void;
        "session-expired": (ev: import(".").SessionExpiredEvent) => void;
        error: (ev: import(".").ErrorEvent) => void;
    }[E]) => ApiClient;
    /**
     * Get this session metadata.
     *
     * @returns Current session metadata.
     */
    getSession(): Promise<SessionInfo>;
    /**
     * Revoke this session.
     */
    revokeSession(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map