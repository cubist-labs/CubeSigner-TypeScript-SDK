import { ApiClient } from "./client/api_client";
import type { IdentityProof, RatchetConfig } from "./schema_types";
import { AddFidoChallenge, TotpChallenge } from "./mfa";
import { Org } from "./org";
import type { CubeSignerResponse, EnvInterface, MfaReceipts, Scope, SessionData, SessionManager } from ".";
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
     * Get the underlying API client. This client provides direct API access without convenience wrappers.
     */
    get apiClient(): ApiClient;
    /**
     * Get the environment.
     */
    get env(): EnvInterface;
    /**
     * Get the org ID of the client.
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
     * @returns A Client
     */
    static create(session: string | SessionManager | SessionData): Promise<CubeSignerClient>;
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
     * Same as {@link ApiClient.userGet}
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
     * Exchange an OIDC token for a CubeSigner session token.
     *
     * @param env The environment to log into
     * @param orgId The org to log into.
     * @param token The OIDC token to exchange
     * @param scopes The scopes for the new session
     * @param lifetimes Lifetimes of the new session.
     * @param mfaReceipt Optional MFA receipt(s)
     * @param purpose Optional session description.
     * @returns The session data.
     */
    static createOidcSession(env: EnvInterface, orgId: string, token: string, scopes: Array<Scope>, lifetimes?: RatchetConfig, mfaReceipt?: MfaReceipts, purpose?: string): Promise<CubeSignerResponse<SessionData>>;
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param env The environment to log into
     * @param orgId The org id in which to generate proof
     * @param token The oidc token
     * @returns Proof of authentication
     */
    static proveOidcIdentity(env: EnvInterface, orgId: string, token: string): Promise<IdentityProof>;
    /**
     * Creates a request to add a new FIDO device.
     *
     * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
     *
     * MFA may be required.
     *
     * Same as {@link ApiClient.userFidoRegisterInit}
     */
    get addFido(): (name: string, mfaReceipt?: MfaReceipts) => Promise<CubeSignerResponse<AddFidoChallenge>>;
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * Same as {@link ApiClient.userFidoDelete}
     */
    get deleteFido(): (fidoId: string, mfaReceipt?: MfaReceipts) => Promise<CubeSignerResponse<import("./schema_types").Empty>>;
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
     * Same as {@link ApiClient.userTotpResetInit}
     */
    get resetTotp(): (issuer?: string, mfaReceipt?: MfaReceipts) => Promise<CubeSignerResponse<TotpChallenge>>;
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * Same as {@link ApiClient.userTotpVerify}
     */
    get verifyTotp(): (code: string) => Promise<void>;
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * Same as {@link ApiClient.userTotpDelete}.
     */
    get deleteTotp(): (mfaReceipt?: MfaReceipts) => Promise<CubeSignerResponse<import("./schema_types").Empty>>;
    /**
     * Add a listener for an event
     *
     * Same as {@link ApiClient.addEventListener}.
     */
    get addEventListener(): <E extends "error" | "user-mfa-failed" | "session-expired">(event: E, listener: {
        "user-mfa-failed": (ev: import("./client/base_client").UserMfaFailedEvent) => void;
        "session-expired": (ev: import(".").SessionExpiredEvent) => void;
        error: (ev: import(".").ErrorEvent) => void;
    }[E]) => ApiClient;
    /**
     * Remove a listener for an event
     *
     * Same as {@link ApiClient.removeEventListener}.
     */
    get removeEventListener(): <E extends "error" | "user-mfa-failed" | "session-expired">(event: E, listener: {
        "user-mfa-failed": (ev: import("./client/base_client").UserMfaFailedEvent) => void;
        "session-expired": (ev: import(".").SessionExpiredEvent) => void;
        error: (ev: import(".").ErrorEvent) => void;
    }[E]) => ApiClient;
    /**
     * Revoke this session.
     */
    revokeSession(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map