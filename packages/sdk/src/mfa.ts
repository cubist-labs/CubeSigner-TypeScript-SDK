/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ApiAddFidoChallenge,
  ApiMfaFidoChallenge,
  MfaRequestInfo,
  MfaVote,
  PublicKeyCredential,
  TotpInfo,
} from "./schema_types";
import { decodeBase64Url, encodeToBase64Url } from "./util";
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
// NOTE: must correspond to the Rust definition
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
export function isManyMfaReceipts(rec: MfaReceipts): rec is ManyMfaReceipts {
  if (rec === undefined) return false;
  const x = rec as ManyMfaReceipts;
  return (
    typeof x.orgId === "string" &&
    typeof x.receipts === "object" &&
    x.receipts instanceof Array &&
    x.receipts.every(isMfaIdAndConf)
  );
}

/**
 * Type narrowing from `unknown` to {@link MfaIdAndConf}
 * @param {MfaReceipts} x The input
 * @return {boolean} Whether {@link x} is of type {@link MfaIdAndConf}
 */
export function isMfaIdAndConf(x: unknown): x is MfaIdAndConf {
  if (x === undefined) return false;
  const y = x as MfaIdAndConf;
  return typeof y.id === "string" && typeof y.confirmation === "string";
}

/** MFA request id */
export type MfaId = string;

/** Original request type */
export type MfaOriginalRequest = MfaRequestInfo["request"];

/** Representation of an MFA request */
export class MfaRequest {
  readonly #apiClient: ApiClient;
  #id: MfaId;
  #data?: MfaRequestInfo;

  /** Get MFA request id */
  get id() {
    return this.#id;
  }

  /**
   * Get the cached properties of this MFA request. The cached properties reflect the
   * state of the last fetch or update.
   */
  get cached(): MfaRequestInfo | undefined {
    return this.#data;
  }

  /**
   * Constructor.
   *
   * @param {ApiClient} apiClient The API client to use.
   * @param {MfaId | MfaRequestInfo} data The ID or the data of the MFA request
   */
  constructor(apiClient: ApiClient, data: MfaId | MfaRequestInfo) {
    this.#apiClient = apiClient;
    if (typeof data === "string") {
      this.#id = data;
    } else {
      this.#id = data.id;
      this.#data = data;
    }
  }

  /**
   * Check whether this MFA request has a receipt.
   *
   * @return {boolean} True if the MFA request has a receipt
   */
  async hasReceipt(): Promise<boolean> {
    const receipt = this.#data?.receipt ?? (await this.fetch()).receipt;
    return !!receipt;
  }

  /**
   * Get the original request that the MFA request is for.
   *
   * @return {MfaOriginalRequest} The original request
   */
  async request(): Promise<MfaOriginalRequest> {
    const data = this.cached ?? (await this.fetch());
    return data.request;
  }

  /**
   * Get the MFA receipt.
   *
   * @return {MfaReceipts | undefined} The MFA receipt(s)
   */
  async receipt(): Promise<MfaReceipt | undefined> {
    // Check if receipt is already available. If not, fetch newest information about MFA request
    const receipt = this.#data?.receipt ?? (await this.fetch()).receipt;
    if (!receipt) {
      return undefined;
    }
    return {
      mfaId: this.#id,
      mfaOrgId: this.#apiClient.orgId,
      mfaConf: receipt.confirmation,
    };
  }

  /**
   * Fetch the key information.
   *
   * @return {MfaRequestInfo} The MFA request information.
   */
  async fetch(): Promise<MfaRequestInfo> {
    this.#data = await this.#apiClient.mfaGet(this.#id);
    return this.#data;
  }

  /**
   * Approve a pending MFA request using the current session.
   *
   * @return {Promise<MfaRequest>} The result of the MFA request
   */
  async approve(): Promise<MfaRequest> {
    const data = await this.#apiClient.mfaVoteCs(this.#id, "approve");
    return new MfaRequest(this.#apiClient, data);
  }

  /**
   * Reject a pending MFA request using the current session.
   *
   * @return {Promise<MfaRequest>} The result of the MFA request
   */
  async reject(): Promise<MfaRequest> {
    const data = await this.#apiClient.mfaVoteCs(this.#id, "reject");
    return new MfaRequest(this.#apiClient, data);
  }

  /**
   * Approve a pending MFA request using TOTP.
   *
   * @param {string} code The TOTP code
   * @return {Promise<MfaRequest>} The current status of the MFA request
   */
  async totpApprove(code: string): Promise<MfaRequest> {
    const data = await this.#apiClient.mfaVoteTotp(this.#id, code, "approve");
    return new MfaRequest(this.#apiClient, data);
  }

  /**
   * Reject a pending MFA request using TOTP.
   *
   * @param {string} code The TOTP code
   * @return {Promise<MfaRequest>} The current status of the MFA request
   */
  async totpReject(code: string): Promise<MfaRequest> {
    const data = await this.#apiClient.mfaVoteTotp(this.#id, code, "reject");
    return new MfaRequest(this.#apiClient, data);
  }

  /**
   * Initiate approval/rejection of an existing MFA request using FIDO.
   *
   * Returns a {@link MfaFidoChallenge} that must be answered by calling
   * {@link MfaFidoChallenge.answer}.
   *
   * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
   */
  async fidoVote(): Promise<MfaFidoChallenge> {
    return await this.#apiClient.mfaFidoInit(this.#id);
  }
}

/** TOTP challenge that must be answered before user's TOTP is updated */
export class TotpChallenge {
  readonly #api: ApiClient;
  readonly #id: string;
  readonly #url?: string;

  /** The id of the challenge */
  get id() {
    return this.#id;
  }

  /** The new TOTP configuration */
  get url() {
    return this.#url;
  }

  /**
   * @param {ApiClient} api Used when answering the challenge.
   * @param {TotpInfo | string} data TOTP challenge information or ID.
   */
  constructor(api: ApiClient, data: TotpInfo | string) {
    this.#api = api;
    if (typeof data === "string") {
      this.#id = data;
    } else {
      this.#id = data.totp_id;
      this.#url = data.totp_url;
    }
  }

  /**
   * Answer the challenge with the code that corresponds to `this.totpUrl`.
   * @param {string} code 6-digit code that corresponds to `this.totpUrl`.
   */
  async answer(code: string) {
    if (!/^\d{1,6}$/.test(code)) {
      throw new Error(`Invalid TOTP code: ${code}; it must be a 6-digit string`);
    }

    await this.#api.userTotpResetComplete(this.id, code);
  }
}

/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
export class AddFidoChallenge {
  readonly #api: ApiClient;
  readonly challengeId: string;
  readonly options: any;

  /**
   * Constructor
   * @param {ApiClient} api The API client used to request to add a FIDO device
   * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
   */
  constructor(api: ApiClient, challenge: ApiAddFidoChallenge) {
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
  readonly #apiClient: ApiClient;
  readonly mfaId: string;
  readonly challengeId: string;
  readonly options: any;

  /**
   * @param {ApiClient} api The API client used to initiate MFA approval using FIDO
   * @param {string} mfaId The MFA request id.
   * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
   */
  constructor(api: ApiClient, mfaId: string, challenge: ApiMfaFidoChallenge) {
    this.#apiClient = api;
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
   *
   * @param {MfaVote} vote Approve or reject the MFA request. Defaults to "approve".
   */
  async createCredentialAndAnswer(vote?: MfaVote): Promise<MfaRequest> {
    const cred = await navigator.credentials.get({ publicKey: this.options });
    return await this.answer(cred, vote);
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
   * @param {MfaVote} vote Approve or reject. Defaults to "approve".
   */
  async answer(cred: any, vote: MfaVote = "approve"): Promise<MfaRequest> {
    const answer = <PublicKeyCredential>{
      id: cred.id,
      response: {
        clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
        authenticatorData: encodeToBase64Url(cred.response.authenticatorData),
        signature: encodeToBase64Url(cred.response.signature),
      },
    };
    const data = await this.#apiClient.mfaVoteFidoComplete(
      this.mfaId,
      vote,
      this.challengeId,
      answer,
    );
    return new MfaRequest(this.#apiClient, data);
  }
}
