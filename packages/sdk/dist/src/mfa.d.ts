import type { ApiAddFidoChallenge, ApiMfaFidoChallenge, EmailOtpResponse, MfaRequestInfo, MfaVote, TotpInfo } from "./schema_types";
import type { ApiClient } from "./client/api_client";
/** MFA receipt */
export interface MfaReceipt {
    /** MFA request ID */
    mfaId: string;
    /** Corresponding org ID */
    mfaOrgId: string;
    /** MFA confirmation code */
    mfaConf: string;
}
/** One or more MFA receipts */
export type MfaReceipts = MfaReceipt | ManyMfaReceipts;
/** The MFA id and confirmation corresponding to a single receipt in a {@link ManyMfaReceipts} **/
export interface MfaIdAndConf {
    /** MFA id */
    id: string;
    /** MFA confirmation code */
    confirmation: string;
}
/** Many MFA receipts **/
export interface ManyMfaReceipts {
    /** Corresponding org id */
    orgId: string;
    /** Receipt confirmation codes */
    receipts: MfaIdAndConf[];
}
/**
 * Type narrowing from {@link MfaReceipts} to {@link ManyMfaReceipts}
 * @param {MfaReceipts} rec The input
 * @return {boolean} Whether {@link rec} is of type {@link ManyMfaReceipts}
 */
export declare function isManyMfaReceipts(rec: MfaReceipts): rec is ManyMfaReceipts;
/**
 * Type narrowing from `unknown` to {@link MfaIdAndConf}
 * @param {MfaReceipts} x The input
 * @return {boolean} Whether {@link x} is of type {@link MfaIdAndConf}
 */
export declare function isMfaIdAndConf(x: unknown): x is MfaIdAndConf;
/** MFA request id */
export type MfaId = string;
/** Original request type */
export type MfaOriginalRequest = MfaRequestInfo["request"];
/** Representation of an MFA request */
export declare class MfaRequest {
    #private;
    /** Get MFA request id */
    get id(): string;
    /**
     * Get the cached properties of this MFA request. The cached properties reflect the
     * state of the last fetch or update.
     */
    get cached(): MfaRequestInfo | undefined;
    /**
     * Constructor.
     *
     * @param {ApiClient} apiClient The API client to use.
     * @param {MfaId | MfaRequestInfo} data The ID or the data of the MFA request
     */
    constructor(apiClient: ApiClient, data: MfaId | MfaRequestInfo);
    /**
     * Check whether this MFA request has a receipt.
     *
     * @return {boolean} True if the MFA request has a receipt
     */
    hasReceipt(): Promise<boolean>;
    /**
     * Get the original request that the MFA request is for.
     *
     * @return {MfaOriginalRequest} The original request
     */
    request(): Promise<MfaOriginalRequest>;
    /**
     * Get the MFA receipt.
     *
     * @return {MfaReceipts | undefined} The MFA receipt(s)
     */
    receipt(): Promise<MfaReceipt | undefined>;
    /**
     * Fetch the key information.
     *
     * @return {MfaRequestInfo} The MFA request information.
     */
    fetch(): Promise<MfaRequestInfo>;
    /**
     * Approve a pending MFA request using the current session.
     *
     * @return {Promise<MfaRequest>} The result of the MFA request
     */
    approve(): Promise<MfaRequest>;
    /**
     * Reject a pending MFA request using the current session.
     *
     * @return {Promise<MfaRequest>} The result of the MFA request
     */
    reject(): Promise<MfaRequest>;
    /**
     * Approve a pending MFA request using TOTP.
     *
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequest>} The current status of the MFA request
     */
    totpApprove(code: string): Promise<MfaRequest>;
    /**
     * Reject a pending MFA request using TOTP.
     *
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequest>} The current status of the MFA request
     */
    totpReject(code: string): Promise<MfaRequest>;
    /**
     * Initiate approval/rejection of an existing MFA request using FIDO.
     *
     * Returns a {@link MfaFidoChallenge} that must be answered by calling
     * {@link MfaFidoChallenge.answer}.
     *
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
     */
    fidoVote(): Promise<MfaFidoChallenge>;
    /**
     * Initiate approval/rejection of an existing MFA request using email OTP.
     *
     * Returns a {@link MfaEmailChallenge} that must be answered by calling {@link MfaEmailChallenge.answer}.
     *
     * @param {MfaVote} mfaVote The vote, i.e., "approve" or "reject".
     * @return {Promise<MfaEmailChallenge>} The challenge to answer by entering the OTP code received via email.
     */
    emailVote(mfaVote: MfaVote): Promise<MfaEmailChallenge>;
}
/** TOTP challenge that must be answered before user's TOTP is updated */
export declare class TotpChallenge {
    #private;
    /** The id of the challenge */
    get id(): string;
    /** The new TOTP configuration */
    get url(): string | undefined;
    /**
     * @param {ApiClient} api Used when answering the challenge.
     * @param {TotpInfo | string} data TOTP challenge information or ID.
     */
    constructor(api: ApiClient, data: TotpInfo | string);
    /**
     * Answer the challenge with the code that corresponds to `this.totpUrl`.
     * @param {string} code 6-digit code that corresponds to `this.totpUrl`.
     */
    answer(code: string): Promise<void>;
}
/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
export declare class AddFidoChallenge {
    #private;
    readonly challengeId: string;
    readonly options: any;
    /**
     * Constructor
     * @param {ApiClient} api The API client used to request to add a FIDO device
     * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
     */
    constructor(api: ApiClient, challenge: ApiAddFidoChallenge);
    /**
     * Answers this challenge by using the `CredentialsContainer` API to create a credential
     * based on the the public key credential creation options from this challenge.
     */
    createCredentialAndAnswer(): Promise<void>;
    /**
     * Answers this challenge using a given credential `cred`;
     * the credential should be obtained by calling
     *
     * ```
     * const cred = await navigator.credentials.create({ publicKey: this.options });
     * ```
     *
     * @param {any} cred Credential created by calling the `CredentialContainer`'s `create` method
     *                   based on the public key creation options from this challenge.
     */
    answer(cred: any): Promise<void>;
}
/**
 * Returned after initiating an MFA approval/rejection via email OTP.
 */
export declare class MfaEmailChallenge {
    #private;
    readonly mfaId: string;
    /**
     * Constructor.
     *
     * @param {ApiClient} apiClient CubeSigner api client
     * @param {string} mfaId The id of the MFA request.
     * @param {EmailOtpResponse} otpResponse The response returned by {@link ApiClient.mfaVoteEmailInit}.
     */
    constructor(apiClient: ApiClient, mfaId: string, otpResponse: EmailOtpResponse);
    /**
     * Complete a previously initiated MFA vote request using email OTP.
     *
     * @param {string} otpCode The MFA approval OTP code received via email.
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
     */
    answer(otpCode: string): Promise<MfaRequestInfo>;
}
/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
export declare class MfaFidoChallenge {
    #private;
    readonly mfaId: string;
    readonly challengeId: string;
    readonly options: any;
    /**
     * @param {ApiClient} api The API client used to initiate MFA approval using FIDO
     * @param {string} mfaId The MFA request id.
     * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
     */
    constructor(api: ApiClient, mfaId: string, challenge: ApiMfaFidoChallenge);
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     *
     * @param {MfaVote} vote Approve or reject the MFA request. Defaults to "approve".
     */
    createCredentialAndAnswer(vote?: MfaVote): Promise<MfaRequest>;
    /**
     * Answers this challenge using a given credential `cred`.
     * To obtain this credential, for example, call
     *
     * ```
     * const cred = await navigator.credentials.get({ publicKey: this.options });
     * ```
     *
     * @param {any} cred Credential created by calling the `CredentialContainer`'s `get` method
     *                   based on the public key credential request options from this challenge.
     * @param {MfaVote} vote Approve or reject. Defaults to "approve".
     */
    answer(cred: any, vote?: MfaVote): Promise<MfaRequest>;
}
//# sourceMappingURL=mfa.d.ts.map