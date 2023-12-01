import { CubeSigner, MfaRequestInfo, SignerSession } from ".";
import { components } from "./schema";
export type ApiAddFidoChallenge = components["responses"]["FidoCreateChallengeResponse"]["content"]["application/json"];
export type ApiMfaFidoChallenge = components["responses"]["FidoAssertChallenge"]["content"]["application/json"];
export type PublicKeyCredentialCreationOptions = components["schemas"]["PublicKeyCredentialCreationOptions"];
export type PublicKeyCredentialRequestOptions = components["schemas"]["PublicKeyCredentialRequestOptions"];
export type PublicKeyCredentialParameters = components["schemas"]["PublicKeyCredentialParameters"];
export type PublicKeyCredentialDescriptor = components["schemas"]["PublicKeyCredentialDescriptor"];
export type AuthenticatorSelectionCriteria = components["schemas"]["AuthenticatorSelectionCriteria"];
export type PublicKeyCredentialUserEntity = components["schemas"]["PublicKeyCredentialUserEntity"];
export type PublicKeyCredential = components["schemas"]["PublicKeyCredential"];
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
     * @param {CubeSigner} cs CubeSigner instance used to request to add a FIDO device
     * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
     */
    constructor(cs: CubeSigner, challenge: ApiAddFidoChallenge);
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
     * @param {SignerSession} ss The session used to initiate MFA approval using FIDO
     * @param {string} mfaId The MFA request id.
     * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
     */
    constructor(ss: SignerSession, mfaId: string, challenge: ApiMfaFidoChallenge);
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     */
    createCredentialAndAnswer(): Promise<MfaRequestInfo>;
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
     */
    answer(cred: any): Promise<MfaRequestInfo>;
}
