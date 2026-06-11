import { ApiClient } from "./client/api_client";
import type { IdentityProof, RatchetConfig } from "./schema_types";
import type { MfaReceipt } from "./mfa";
import { AddFidoChallenge, TotpChallenge } from "./mfa";
import { Org } from "./org";
import type { CubeSignerResponse, EnvInterface, SessionData, SessionManager } from ".";
import { Key } from ".";
/** Options for logging in with OIDC token */
export interface OidcAuthOptions {
    /** Optional token lifetimes */
    lifetimes?: RatchetConfig;
    /** Optional MFA receipt */
    mfaReceipt?: MfaReceipt;
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
     * @param {ApiClient} apiClient The API client to use.
     */
    constructor(apiClient: ApiClient);
    /**
     * Construct a client with a session or session manager
     * @param {SessionManager | SessionData | string} session The session (object or base64 string)
     *   or manager that will back this client
     * @return {CubeSignerClient} A Client
     */
    static create(session: string | SessionManager | SessionData): Promise<CubeSignerClient>;
    /**
     * Get the org associated with this session.
     *
     * @return {Org} The org
     */
    org(): Org;
    /**
     * Get information about an org.
     *
     * @param {string} orgId The ID or name of the org
     * @return {Promise<OrgInfo>} CubeSigner client for the requested org.
     */
    getOrg(orgId: string): Org;
    /**
     * Obtain information about the current user.
     *
     * Same as {@link ApiClient.userGet}
     */
    get user(): () => Promise<{
        email?: string | null | undefined;
        mfa: ({
            type: "totp";
        } | {
            id: string;
            name: string;
            type: "fido";
        })[];
        mfa_policy?: Record<string, unknown> | null | undefined;
        name?: string | null | undefined;
        org_ids: string[];
        orgs: {
            membership: "Alien" | "Member" | "Owner";
            org_id: string;
            status: "enabled" | "disabled";
        }[];
        user_id: string;
    }>;
    /**
     * Get all keys accessible to the current session
     *
     * NOTE: this may be a subset from the keys in the current org.
     *
     * @return {Promise<Key[]>} The keys that a client can access
     */
    sessionKeys(): Promise<Key[]>;
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org to log into.
     * @param {string} token The OIDC token to exchange
     * @param {List<string>} scopes The scopes for the new session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<SessionData>} The session data.
     */
    static createOidcSession(env: EnvInterface, orgId: string, token: string, scopes: Array<string>, lifetimes?: RatchetConfig, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<SessionData>>;
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org id in which to generate proof
     * @param {string} token The oidc token
     * @return {Promise<IdentityProof>} Proof of authentication
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
    get addFido(): (name: string, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<AddFidoChallenge>>;
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * Same as {@link ApiClient.userFidoDelete}
     */
    get deleteFido(): (fidoId: string, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        status: string;
    }>>;
    /**
     * Create a reference to an existing TOTP challenge.
     *
     * @param {string} totpId The ID of the challenge
     * @return {TotpChallenge} The TOTP challenge
     */
    getTotpChallenge(totpId: string): TotpChallenge;
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered by calling {@link TotpChallenge.answer}.
     *
     * Same as {@link ApiClient.userTotpResetInit}
     */
    get resetTotp(): (issuer?: string | undefined, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<TotpChallenge>>;
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
    get deleteTotp(): (mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        status: string;
    }>>;
    /**
     * Add a listener for an event
     *
     * Same as {@link ApiClient.addEventListener}.
     */
    get addEventListener(): <E extends "error" | "user-mfa-failed" | "session-expired">(event: E, listener: {
        "user-mfa-failed": (ev: import("./client/base_client").UserMfaFailedEvent) => void;
        "session-expired": (ev: import(".").SessionExpiredEvent) => void;
        error: (ev: import("./error").ErrResponse) => void;
    }[E]) => ApiClient;
    /**
     * Remove a listener for an event
     *
     * Same as {@link ApiClient.removeEventListener}.
     */
    get removeEventListener(): <E extends "error" | "user-mfa-failed" | "session-expired">(event: E, listener: {
        "user-mfa-failed": (ev: import("./client/base_client").UserMfaFailedEvent) => void;
        "session-expired": (ev: import(".").SessionExpiredEvent) => void;
        error: (ev: import("./error").ErrResponse) => void;
    }[E]) => ApiClient;
    /**
     * Revoke this session.
     */
    revokeSession(): Promise<void>;
}
