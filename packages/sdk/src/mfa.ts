/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ApiAddFidoChallenge,
  ApiMfaFidoChallenge,
  EmailOtpResponse,
  MfaRequestInfo,
  MfaVote,
  TotpInfo,
} from "./schema_types";
import type { ApiClient } from "./client/api_client";
import { credentialToJSON, parseCreationOptions, parseRequestOptions } from "./passkey";

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

/** The MFA id and confirmation corresponding to a single receipt in a {@link ManyMfaReceipts} */
// NOTE: must correspond to the Rust definition
export interface MfaIdAndConf {
  /** MFA id */
  id: string;
  /** MFA confirmation code */
  confirmation: string;
}

/** Many MFA receipts */
export interface ManyMfaReceipts {
  /** Corresponding org id */
  orgId: string;
  /** Receipt confirmation codes */
  receipts: MfaIdAndConf[];
}

/**
 * Type narrowing from {@link MfaReceipts} to {@link ManyMfaReceipts}
 *
 * @param rec The input
 * @returns Whether {@link rec} is of type {@link ManyMfaReceipts}
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
 *
 * @param x The input
 * @returns Whether {@link x} is of type {@link MfaIdAndConf}
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

  /** @returns MFA request id */
  get id() {
    return this.#id;
  }

  /**
   * @returns The cached properties of this MFA request. The cached properties reflect the
   * state of the last fetch or update.
   */
  get cached(): MfaRequestInfo | undefined {
    return this.#data;
  }

  /**
   * Constructor.
   *
   * @param apiClient The API client to use.
   * @param data The ID or the data of the MFA request
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
   * @returns True if the MFA request has a receipt
   */
  async hasReceipt(): Promise<boolean> {
    const receipt = this.#data?.receipt ?? (await this.fetch()).receipt;
    return !!receipt;
  }

  /**
   * Get the original request that the MFA request is for.
   *
   * @returns The original request
   */
  async request(): Promise<MfaOriginalRequest> {
    const data = this.cached ?? (await this.fetch());
    return data.request;
  }

  /**
   * Get the MFA receipt.
   *
   * @returns The MFA receipt(s)
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
   * @returns The MFA request information.
   */
  async fetch(): Promise<MfaRequestInfo> {
    this.#data = await this.#apiClient.mfaGet(this.#id);
    return this.#data;
  }

  /**
   * Approve a pending MFA request using the current session.
   *
   * @returns The result of the MFA request
   */
  async approve(): Promise<MfaRequest> {
    const data = await this.#apiClient.mfaVoteCs(this.#id, "approve");
    return new MfaRequest(this.#apiClient, data);
  }

  /**
   * Reject a pending MFA request using the current session.
   *
   * @returns The result of the MFA request
   */
  async reject(): Promise<MfaRequest> {
    const data = await this.#apiClient.mfaVoteCs(this.#id, "reject");
    return new MfaRequest(this.#apiClient, data);
  }

  /**
   * Approve a pending MFA request using TOTP.
   *
   * @param code The TOTP code
   * @returns The current status of the MFA request
   */
  async totpApprove(code: string): Promise<MfaRequest> {
    const data = await this.#apiClient.mfaVoteTotp(this.#id, code, "approve");
    return new MfaRequest(this.#apiClient, data);
  }

  /**
   * Reject a pending MFA request using TOTP.
   *
   * @param code The TOTP code
   * @returns The current status of the MFA request
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
   * @returns A challenge that needs to be answered to complete the approval.
   */
  async fidoVote(): Promise<MfaFidoChallenge> {
    return await this.#apiClient.mfaFidoInit(this.#id);
  }

  /**
   * Initiate approval/rejection of an existing MFA request using email OTP.
   *
   * Returns a {@link MfaEmailChallenge} that must be answered by calling {@link MfaEmailChallenge.answer}.
   *
   * @param mfaVote The vote, i.e., "approve" or "reject".
   * @returns The challenge to answer by entering the OTP code received via email.
   */
  async emailVote(mfaVote: MfaVote): Promise<MfaEmailChallenge> {
    return await this.#apiClient.mfaVoteEmailInit(this.id, mfaVote);
  }
}

/** TOTP challenge that must be answered before user's TOTP is updated */
export class TotpChallenge {
  readonly #api: ApiClient;
  readonly #id: string;
  readonly #url?: string;

  /** @returns The id of the challenge */
  get id() {
    return this.#id;
  }

  /** @returns The new TOTP configuration */
  get url() {
    return this.#url;
  }

  /**
   * @param api Used when answering the challenge.
   * @param data TOTP challenge information or ID.
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
   *
   * @param code 6-digit code that corresponds to `this.totpUrl`.
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
   *
   * @param api The API client used to request to add a FIDO device
   * @param challenge The challenge returned by the remote end.
   */
  constructor(api: ApiClient, challenge: ApiAddFidoChallenge) {
    this.#api = api;
    this.challengeId = challenge.challenge_id;
    this.options = parseCreationOptions(challenge.options);
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
   * @param cred Credential created by calling the `CredentialContainer`'s `create` method
   *                   based on the public key creation options from this challenge.
   */
  async answer(cred: any) {
    const answer = credentialToJSON(cred);
    await this.#api.userFidoRegisterComplete(this.challengeId, answer);
  }
}

/**
 * Returned after initiating an MFA approval/rejection via email OTP.
 */
export class MfaEmailChallenge {
  readonly #apiClient: ApiClient;
  readonly #otpResponse: EmailOtpResponse;
  readonly mfaId: string;

  /**
   * Constructor.
   *
   * @param apiClient CubeSigner api client
   * @param mfaId The id of the MFA request.
   * @param otpResponse The response returned by {@link ApiClient.mfaVoteEmailInit}.
   */
  constructor(apiClient: ApiClient, mfaId: string, otpResponse: EmailOtpResponse) {
    this.#apiClient = apiClient;
    this.#otpResponse = otpResponse;
    this.mfaId = mfaId;
  }

  /**
   * Complete a previously initiated MFA vote request using email OTP.
   *
   * @param otpCode The MFA approval OTP code received via email.
   * @returns The current status of the MFA request.
   */
  async answer(otpCode: string): Promise<MfaRequestInfo> {
    return await this.#apiClient.mfaVoteEmailComplete(
      this.mfaId,
      this.#otpResponse.partial_token,
      otpCode,
    );
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
   * @param api The API client used to initiate MFA approval using FIDO
   * @param mfaId The MFA request id.
   * @param challenge The challenge returned by the remote end
   */
  constructor(api: ApiClient, mfaId: string, challenge: ApiMfaFidoChallenge) {
    this.#apiClient = api;
    this.mfaId = mfaId;
    this.challengeId = challenge.challenge_id;
    this.options = parseRequestOptions(challenge.options);
  }

  /**
   * Answers this challenge by using the `CredentialsContainer` API to get a credential
   * based on the the public key credential request options from this challenge.
   *
   * @param vote Approve or reject the MFA request. Defaults to "approve".
   * @returns The updated MfaRequest after answering
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
   * @param cred Credential created by calling the `CredentialContainer`'s `get` method
   *             based on the public key credential request options from this challenge.
   * @param vote Approve or reject. Defaults to "approve".
   * @returns The updated MfaRequest after answering
   */
  async answer(cred: any, vote: MfaVote = "approve"): Promise<MfaRequest> {
    const answer = credentialToJSON(cred);
    const data = await this.#apiClient.mfaVoteFidoComplete(
      this.mfaId,
      vote,
      this.challengeId,
      answer,
    );
    return new MfaRequest(this.#apiClient, data);
  }
}
