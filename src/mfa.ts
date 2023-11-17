/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ApiAddFidoChallenge,
  ApiMfaFidoChallenge,
  MfaRequestInfo,
  PublicKeyCredential,
  TotpInfo,
} from "./schema_types";
import { CubeSignerClient } from "./client";
import { decodeBase64Url, encodeToBase64Url } from "./util";

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
export class TotpChallenge {
  readonly #csc: CubeSignerClient;
  readonly #totpInfo: TotpInfo;

  /** The id of the challenge */
  get totpId() {
    return this.#totpInfo.totp_id;
  }

  /** The new TOTP configuration */
  get totpUrl() {
    return this.#totpInfo.totp_url;
  }

  /**
   * @param {CubeSignerClient} csc Used when answering the challenge.
   * @param {TotpInfo} totpInfo TOTP challenge information.
   */
  constructor(csc: CubeSignerClient, totpInfo: TotpInfo) {
    this.#csc = csc;
    this.#totpInfo = totpInfo;
  }

  /**
   * Answer the challenge with the code that corresponds to `this.totpUrl`.
   * @param {string} code 6-digit code that corresponds to `this.totpUrl`.
   */
  async answer(code: string) {
    if (!/^\d{1,6}$/.test(code)) {
      throw new Error(`Invalid TOTP code: ${code}; it must be a 6-digit string`);
    }

    await this.#csc.userResetTotpComplete(this.totpId, code);
  }
}

/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
export class AddFidoChallenge {
  readonly #csc: CubeSignerClient;
  readonly challengeId: string;
  readonly options: any;

  /**
   * Constructor
   * @param {CubeSignerClient} csc CubeSigner instance used to request to add a FIDO device
   * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
   */
  constructor(csc: CubeSignerClient, challenge: ApiAddFidoChallenge) {
    this.#csc = csc;
    this.challengeId = challenge.challenge_id;

    // fix options returned from the server: rename fields and decode base64 fields to uint8[]
    this.options = {
      ...challenge.options,
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
    await this.#csc.userRegisterFidoComplete(this.challengeId, answer);
  }
}

/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
export class MfaFidoChallenge {
  readonly #csc: CubeSignerClient;
  readonly mfaId: string;
  readonly challengeId: string;
  readonly options: any;

  /**
   * @param {CubeSignerClient} csc The session used to initiate MFA approval using FIDO
   * @param {string} mfaId The MFA request id.
   * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
   */
  constructor(csc: CubeSignerClient, mfaId: string, challenge: ApiMfaFidoChallenge) {
    this.#csc = csc;
    this.mfaId = mfaId;
    this.challengeId = challenge.challenge_id;

    // fix options returned from the server: rename fields and decode base64 fields into uint8[]
    this.options = {
      ...challenge.options,
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
    return await this.#csc.mfaApproveFidoComplete(this.mfaId, this.challengeId, answer);
  }
}
