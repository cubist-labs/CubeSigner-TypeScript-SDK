import { ApiAddFidoChallenge, ApiMfaFidoChallenge, MfaRequestInfo, MfaVote, TotpInfo } from "./schema_types";
import { CubeSignerApi } from "./api";
/** MFA receipt */
export interface MfaReceipt {
    /** MFA request ID */
    mfaId: string;
    /** Corresponding org ID */
    mfaOrgId: string;
    /** MFA confirmation code */
    mfaConf: string;
}
/** TOTP challenge that must be answered before user's TOTP is updated */
export declare class TotpChallenge {
    #private;
    /** The id of the challenge */
    get totpId(): string;
    /** The new TOTP configuration */
    get totpUrl(): string;
    /**
     * @param {CubeSignerApi} api Used when answering the challenge.
     * @param {TotpInfo} totpInfo TOTP challenge information.
     */
    constructor(api: CubeSignerApi, totpInfo: TotpInfo);
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
     * @param {CubeSignerApi} api The API client used to request to add a FIDO device
     * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
     */
    constructor(api: CubeSignerApi, challenge: ApiAddFidoChallenge);
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
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
export declare class MfaFidoChallenge {
    #private;
    readonly mfaId: string;
    readonly challengeId: string;
    readonly options: any;
    /**
     * @param {CubeSignerApi} api The API client used to initiate MFA approval using FIDO
     * @param {string} mfaId The MFA request id.
     * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
     */
    constructor(api: CubeSignerApi, mfaId: string, challenge: ApiMfaFidoChallenge);
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     *
     * @param {MfaVote} vote Approve or reject the MFA request. Defaults to "approve".
     */
    createCredentialAndAnswer(vote?: MfaVote): Promise<MfaRequestInfo>;
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
    answer(cred: any, vote?: MfaVote): Promise<MfaRequestInfo>;
}
