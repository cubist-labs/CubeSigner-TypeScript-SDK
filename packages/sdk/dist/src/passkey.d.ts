import { type EnvInterface, type PasskeyAssertChallenge, type schemas, type SessionData } from ".";
/**
 * Manual implementation of [PublicKeyCredential.parseRequestOptionsFromJSON](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseRequestOptionsFromJSON_static)
 * (implemented here because not all browsers support it)
 *
 * @param options The credential request options as returned by the CubeSigner back end
 * @returns Parsed credential request options
 */
export declare function parseRequestOptions(options: schemas["PublicKeyCredentialRequestOptions"]): PublicKeyCredentialRequestOptions;
/**
 * Manual implementation of [PublicKeyCredential.parseCreationOptionsFromJSON](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseCreationOptionsFromJSON_static)
 * (implemented here because not all browsers support it)
 *
 * @param options The credential creation options as returned by the CubeSigner back end
 * @returns Parsed credential creation options
 */
export declare function parseCreationOptions(options: schemas["PublicKeyCredentialCreationOptions"]): PublicKeyCredentialCreationOptions;
/**
 * @param cred The credential response to convert
 * @returns Corresponding serializable JSON object that the CubeSigner back end expects
 */
export declare function credentialToJSON(cred: PublicKeyCredential): schemas["PublicKeyCredential"];
/**
 * Helper class for answering a passkey login challenge.
 */
export declare class PasskeyLoginChallenge {
    #private;
    readonly purpose: string | null | undefined;
    readonly challenge: Omit<PasskeyAssertChallenge, "options">;
    readonly options: PublicKeyCredentialRequestOptions;
    /**
     * Internal, called by {@link ApiClient.passkeyLoginInit}.
     *
     * @param env Target CubeSigner environment
     * @param challenge The challenge to answer
     * @param purpose Optional descriptive purpose of the new session
     */
    constructor(env: EnvInterface, challenge: PasskeyAssertChallenge, purpose: string | null | undefined);
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     *
     * @returns New session.
     */
    getCredentialAndAnswer(): Promise<SessionData>;
    /**
     * Answers this challenge using a given credential `cred`.
     * To obtain this credential, for example, call
     *
     * ```
     * const cred = await navigator.credentials.get({ publicKey: this.options });
     * ```
     *
     * @param cred Credential created by calling the `CredentialContainer`'s `get` method
     *             based on the public key credential request options from this challenge.
     * @returns New session
     */
    answer(cred: PublicKeyCredential): Promise<SessionData>;
}
//# sourceMappingURL=passkey.d.ts.map