/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ApiAddFidoChallenge,
  ApiMfaFidoChallenge,
  MfaRequestInfo,
  PublicKeyCredential,
  TotpInfo,
} from "./schema_types";
import { decodeBase64Url, encodeToBase64Url } from "./util";
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
export class TotpChallenge {
  readonly #api: CubeSignerApi;
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
   * @param {CubeSignerApi} api Used when answering the challenge.
   * @param {TotpInfo} totpInfo TOTP challenge information.
   */
  constructor(api: CubeSignerApi, totpInfo: TotpInfo) {
    this.#api = api;
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

    await this.#api.userTotpResetComplete(this.totpId, code);
  }
}

/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
export class AddFidoChallenge {
  readonly #api: CubeSignerApi;
  readonly challengeId: string;
  readonly options: any;

  /**
   * Constructor
   * @param {CubeSignerApi} api The API client used to request to add a FIDO device
   * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
   */
  constructor(api: CubeSignerApi, challenge: ApiAddFidoChallenge) {
    this.#api = api;
    this.challengeId = challenge.challenge_id;

    // fix options returned from the server: rename fields and decode base64 fields to uint8[]
    this.options = {
      ...challenge.options,
      challenge: decodeBase64Url(challenge.options.challenge),
    };

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
    await this.#api.userFidoRegisterComplete(this.challengeId, answer);
  }
}

/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
export class MfaFidoChallenge {
  readonly #api: CubeSignerApi;
  readonly mfaId: string;
  readonly challengeId: string;
  readonly options: any;

  /**
   * @param {CubeSignerApi} api The API client used to initiate MFA approval using FIDO
   * @param {string} mfaId The MFA request id.
   * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
   */
  constructor(api: CubeSignerApi, mfaId: string, challenge: ApiMfaFidoChallenge) {
    this.#api = api;
    this.mfaId = mfaId;
    this.challengeId = challenge.challenge_id;

    // fix options returned from the server: rename fields and decode base64 fields into uint8[]
    this.options = {
      ...challenge.options,
      challenge: decodeBase64Url(challenge.options.challenge),
    };

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
    return await this.#api.mfaApproveFidoComplete(this.mfaId, this.challengeId, answer);
  }
}
