import type { ApiClient } from ".";
/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export declare class SignerSessionInfo {
    #private;
    readonly purpose: string;
    /** Revoke this session */
    revoke(): Promise<void>;
    /**
     * Internal constructor.
     *
     * @param apiClient The API client to use.
     * @param sessionId The ID of the session; can be used for revocation but not for auth
     * @param purpose Session purpose
     * @internal
     */
    constructor(apiClient: ApiClient, sessionId: string, purpose: string);
}
//# sourceMappingURL=signer_session.d.ts.map