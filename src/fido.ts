/* eslint-disable @typescript-eslint/no-explicit-any */

import { CubeSigner, MfaRequestInfo, SignerSession } from ".";
import { components } from "./schema";
import { decodeBase64Url, encodeToBase64Url } from "./util";

export type ApiAddFidoChallenge =
  components["responses"]["FidoCreateChallengeResponse"]["content"]["application/json"];

export type ApiMfaFidoChallenge =
  components["responses"]["FidoAssertChallenge"]["content"]["application/json"];

export type PublicKeyCredentialCreationOptions =
  components["schemas"]["PublicKeyCredentialCreationOptions"];
export type PublicKeyCredentialRequestOptions =
  components["schemas"]["PublicKeyCredentialRequestOptions"];
export type PublicKeyCredentialParameters = components["schemas"]["PublicKeyCredentialParameters"];
export type PublicKeyCredentialDescriptor = components["schemas"]["PublicKeyCredentialDescriptor"];
export type AuthenticatorSelectionCriteria =
  components["schemas"]["AuthenticatorSelectionCriteria"];
export type PublicKeyCredentialUserEntity = components["schemas"]["PublicKeyCredentialUserEntity"];
export type PublicKeyCredential = components["schemas"]["PublicKeyCredential"];

/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
export class AddFidoChallenge {
  readonly #cs: CubeSigner;
  readonly challengeId: string;
  readonly options: any;

  /**
   * Constructor
   * @param {CubeSigner} cs CubeSigner instance used to request to add a FIDO device
   * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
   */
  constructor(cs: CubeSigner, challenge: ApiAddFidoChallenge) {
    this.#cs = cs;
    this.challengeId = challenge.challenge_id;

    // fix options returned from the server: rename fields and decode base64 fields to uint8[]
    this.options = {
      ...structuredClone(challenge.options),
      challenge: decodeBase64Url(challenge.options.challenge),
    };
    this.options.pubKeyCredParams ??= challenge.options.pub_key_cred_params;
    this.options.excludeCredentials ??= challenge.options.exclude_credentials;
    this.options.authenticatorSelection ??= challenge.options.authenticator_selection;
    delete this.options.pub_key_cred_params;
    delete this.options.exclude_credentials;
    delete this.options.authenticator_selection;

    if (challenge.options.user) {
      this.options.user.id = decodeBase64Url(challenge.options.user.id);
    }

    for (const credential of this.options.excludeCredentials ?? []) {
      credential.id = decodeBase64Url(credential.id);
    }
  }

  /**
   * Answers this challenge by using the `CredentialsContainer` API to create a credential
   * based on the the public key credential creation options from this challenge.
   */
  async createCredentialAndAnswer() {
    const cred = await navigator.credentials.create({ publicKey: this.options });
    await this.answer(cred);
  }

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
  async answer(cred: any) {
    const answer = <PublicKeyCredential>{
      id: cred.id,
      response: {
        clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
        attestationObject: encodeToBase64Url(cred.response.attestationObject),
      },
    };
    await this.#cs.addFidoComplete(this.challengeId, answer);
  }
}

/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
export class MfaFidoChallenge {
  readonly #ss: SignerSession;
  readonly mfaId: string;
  readonly challengeId: string;
  readonly options: any;

  /**
   * @param {SignerSession} ss The session used to initiate MFA approval using FIDO
   * @param {string} mfaId The MFA request id.
   * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
   */
  constructor(ss: SignerSession, mfaId: string, challenge: ApiMfaFidoChallenge) {
    this.#ss = ss;
    this.mfaId = mfaId;
    this.challengeId = challenge.challenge_id;

    // fix options returned from the server: rename fields and decode base64 fields into uint8[]
    this.options = {
      ...structuredClone(challenge.options),
      challenge: decodeBase64Url(challenge.options.challenge),
    };
    this.options.rpId ??= challenge.options.rp_id;
    this.options.allowCredentials ??= challenge.options.allow_credentials;
    this.options.userVerification ??= challenge.options.user_verification;
    delete this.options.rp_id;
    delete this.options.allow_credentials;
    delete this.options.user_verification;

    for (const credential of this.options.allowCredentials ?? []) {
      credential.id = decodeBase64Url(credential.id);
      if (credential.transports === null) {
        delete credential.transports;
      }
    }
  }

  /**
   * Answers this challenge by using the `CredentialsContainer` API to get a credential
   * based on the the public key credential request options from this challenge.
   */
  async createCredentialAndAnswer(): Promise<MfaRequestInfo> {
    const cred = await navigator.credentials.get({ publicKey: this.options });
    return await this.answer(cred);
  }

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
  async answer(cred: any): Promise<MfaRequestInfo> {
    const answer = <PublicKeyCredential>{
      id: cred.id,
      response: {
        clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
        authenticatorData: encodeToBase64Url(cred.response.authenticatorData),
        signature: encodeToBase64Url(cred.response.signature),
      },
    };
    return await this.#ss.fidoApproveComplete(this.mfaId, this.challengeId, answer);
  }
}
