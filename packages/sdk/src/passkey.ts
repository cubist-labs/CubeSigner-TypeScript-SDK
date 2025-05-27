import {
  ApiClient,
  decodeBase64Url,
  encodeToBase64Url,
  type EnvInterface,
  type PasskeyAssertChallenge,
  type schemas,
  type SessionData,
} from ".";

/**
 * @param val The value to check
 * @returns If the value is `null`, returns undefined, otherwise returns the value
 */
function noNull<T>(val: T | null): T | undefined {
  return val === null ? undefined : val;
}

/**
 * @param cred Credential descriptor, as returned by the CubeSigner back end
 * @returns The credential converted to {@link PublicKeyCredentialDescriptor}
 */
function mapPublicKeyCredentialDescriptor(
  cred: schemas["PublicKeyCredentialDescriptor"],
): PublicKeyCredentialDescriptor {
  return {
    id: decodeBase64Url(cred.id),
    type: cred.type,
    transports: noNull(cred.transports),
  };
}

/**
 * Manual implementation of [PublicKeyCredential.parseRequestOptionsFromJSON](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseRequestOptionsFromJSON_static)
 * (implemented here because not all browsers support it)
 *
 * @param options The credential request options as returned by the CubeSigner back end
 * @returns Parsed credential request options
 */
export function parseRequestOptions(
  options: schemas["PublicKeyCredentialRequestOptions"],
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: decodeBase64Url(options.challenge),
    extensions: noNull(options.extensions),
    rpId: noNull(options.rpId),
    timeout: noNull(options.timeout),
    allowCredentials: options.allowCredentials?.map(mapPublicKeyCredentialDescriptor),
  };
}

/**
 * Manual implementation of [PublicKeyCredential.parseCreationOptionsFromJSON](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseCreationOptionsFromJSON_static)
 * (implemented here because not all browsers support it)
 *
 * @param options The credential creation options as returned by the CubeSigner back end
 * @returns Parsed credential creation options
 */
export function parseCreationOptions(
  options: schemas["PublicKeyCredentialCreationOptions"],
): PublicKeyCredentialCreationOptions {
  return {
    ...(options as unknown as PublicKeyCredentialCreationOptions),
    challenge: decodeBase64Url(options.challenge),
    excludeCredentials: options.excludeCredentials?.map(mapPublicKeyCredentialDescriptor),
    user: {
      id: decodeBase64Url(options.user.id),
      displayName: options.user.displayName,
      name: options.user.name,
    },
  };
}

/**
 * Type narrowing from {@link AuthenticatorResponse} to {@link AuthenticatorAttestationResponse}
 *
 * @param resp The value to check
 * @returns Whether the value is a {@link AuthenticatorAttestationResponse}
 */
function isAuthenticatorAttestationResponse(
  resp: AuthenticatorResponse,
): resp is AuthenticatorAttestationResponse {
  return !!(resp as AuthenticatorAttestationResponse).attestationObject;
}

/**
 * Type narrowing from {@link AuthenticatorResponse} to {@link AuthenticatorAssertionResponse}
 *
 * @param resp The value to check
 * @returns Whether the value is a {@link AuthenticatorAssertionResponse}
 */
function isAuthenticatorAssertionResponse(
  resp: AuthenticatorResponse,
): resp is AuthenticatorAssertionResponse {
  const asAssertion = resp as AuthenticatorAssertionResponse;
  return !!asAssertion.authenticatorData && !!asAssertion.signature;
}

/**
 * @param cred The credential response to convert
 * @returns Corresponding serializable JSON object that the CubeSigner back end expects
 */
export function credentialToJSON(cred: PublicKeyCredential): schemas["PublicKeyCredential"] {
  if (isAuthenticatorAttestationResponse(cred.response)) {
    return {
      id: cred.id,
      response: {
        clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
        attestationObject: encodeToBase64Url(cred.response.attestationObject),
      },
    };
  }

  if (isAuthenticatorAssertionResponse(cred.response)) {
    return {
      id: cred.id,
      response: {
        clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
        authenticatorData: encodeToBase64Url(cred.response.authenticatorData),
        signature: encodeToBase64Url(cred.response.signature),
      },
    };
  }

  throw new Error("Unrecognized public key credential response");
}

/**
 * Helper class for answering a passkey login challenge.
 */
export class PasskeyLoginChallenge {
  readonly #env: EnvInterface;
  readonly challenge: Omit<PasskeyAssertChallenge, "options">;
  readonly options: PublicKeyCredentialRequestOptions;

  /**
   * Internal, called by {@link ApiClient.passkeyLoginInit}.
   *
   * @param env Target CubeSigner environment
   * @param challenge The challenge to answer
   * @param purpose Optional descriptive purpose of the new session
   */
  constructor(
    env: EnvInterface,
    challenge: PasskeyAssertChallenge,
    readonly purpose: string | null | undefined,
  ) {
    this.#env = env;
    this.challenge = challenge;
    this.options = parseRequestOptions(challenge.options);
  }

  /**
   * Answers this challenge by using the `CredentialsContainer` API to get a credential
   * based on the the public key credential request options from this challenge.
   *
   * @returns New session.
   */
  async getCredentialAndAnswer(): Promise<SessionData> {
    const cred = await navigator.credentials.get({
      publicKey: this.options,
      mediation: (this.options.allowCredentials ?? []).length > 0 ? undefined : "conditional",
    });
    if (cred === null) throw new Error("Credential not found");
    return await this.answer(cred as PublicKeyCredential);
  }

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
  async answer(cred: PublicKeyCredential): Promise<SessionData> {
    return await ApiClient.passkeyLoginComplete(this.#env, {
      challenge_id: this.challenge.challenge_id,
      credential: credentialToJSON(cred),
    });
  }
}
