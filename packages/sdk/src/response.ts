import { CubeSignerClient, MfaVote, SignerSession } from ".";
import { MfaReceipt } from "./mfa";
import { AcceptedResponse, NewSessionResponse } from "./schema_types";

/**
 * Response type, which can be either a value of type {@link U}
 * or {@link AcceptedResponse} (status code 202) which requires MFA.
 */
export type Response<U> = U | AcceptedResponse;

/**
 * Request function which optionally takes additional headers
 * (which, for example, can be used to attach an MFA receipt).
 */
export type RequestFn<U> = (headers?: HeadersInit) => Promise<Response<U>>;

/**
 * Map function occasionally used to map a response from the API into a higher-level type.
 */
export type MapFn<U, V> = (u: U) => V;

/**
 * Take a {@link Response<U>} and a {@link MapFn<U, V>} function and return
 * a {@link Response<V>} that maps the value of the original response when its status code is 200.
 *
 * @param {Response<U>} resp Original response
 * @param {Map<U, V>} mapFn Map to apply to the response value when its status code is 200.
 * @return {Response<V>} Response whose value for status code 200 is mapped from U to V
 */
export function mapResponse<U, V>(resp: Response<U>, mapFn: MapFn<U, V>): Response<V> {
  if ((resp as AcceptedResponse).accepted?.MfaRequired) {
    return resp as AcceptedResponse;
  } else {
    return mapFn(resp as U);
  }
}

export interface MfaRequired {
  /** Org id */
  org_id: string;
  /** MFA request id */
  id: string;
  /** Optional MFA session */
  session?: NewSessionResponse | null;
}

/**
 * A response of a CubeSigner request.
 */
export class CubeSignerResponse<U> {
  readonly #requestFn: RequestFn<U>;
  readonly #resp: U | AcceptedResponse;
  /**
   * Optional MFA id. Only set if there is an MFA request associated with the
   * signing request
   */
  readonly #mfaRequired?: MfaRequired;

  /** @return {string} The MFA id associated with this request (if any) */
  mfaId(): string {
    return this.#mfaRequired!.id;
  }

  /** @return {boolean} True if this request requires an MFA approval */
  requiresMfa(): boolean {
    return this.#mfaRequired !== undefined;
  }

  /**
   * Return session information to use for any MFA approval requests (if any was included in the response).
   * @return {ClientSessionInfo | undefined}
   */
  mfaSessionInfo(): NewSessionResponse | undefined {
    return (this.#resp as AcceptedResponse).accepted?.MfaRequired?.session ?? undefined;
  }

  /** @return {U} The response data, if no MFA is required */
  data(): U {
    if (this.requiresMfa()) {
      throw new Error("Cannot call `data()` while MFA is required");
    }
    return this.#resp as U;
  }

  /**
   * Approve the MFA request using a given session and a TOTP code.
   *
   * @param {SignerSession} session Signer session to use
   * @param {string} code 6-digit TOTP code
   * @return {CubeSignerResponse<U>} The result of signing with the approval
   */
  async approveTotp(session: SignerSession, code: string): Promise<CubeSignerResponse<U>> {
    return await this.#mfaVoteTotp(session, code, "approve");
  }

  /**
   * Reject the MFA request using a given session and a TOTP code.
   *
   * @param {SignerSession} session Signer session to use
   * @param {string} code 6-digit TOTP code
   */
  async rejectTotp(session: SignerSession, code: string) {
    await this.#mfaVoteTotp(session, code, "reject");
  }

  /**
   * Approve or reject an MFA request using a given session and a TOTP code.
   *
   * @param {SignerSession} session Signer session to use
   * @param {string} code 6-digit TOTP code
   * @param {MfaVote} vote Approve or reject
   * @return {CubeSignerResponse<U>} The result of signing with the approval
   */
  async #mfaVoteTotp(
    session: SignerSession,
    code: string,
    vote: MfaVote,
  ): Promise<CubeSignerResponse<U>> {
    if (!this.requiresMfa()) {
      return this;
    }

    const mfaId = this.mfaId();
    const mfaOrgId = this.#mfaRequired!.org_id;
    const mfaApproval = await session.mfaVoteTotp(mfaId, code, vote);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      return this;
    }

    return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
  }

  /**
   * Approve the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
   *
   * @param {CubeSignerClient} cs CubeSigner whose session to use
   * @return {CubeSignerResponse<U>} The result of signing with the approval
   */
  async approve(cs: CubeSignerClient): Promise<CubeSignerResponse<U>> {
    return await this.#mfaVoteCs(cs, "approve");
  }

  /**
   * Reject the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
   *
   * @param {CubeSignerClient} cs CubeSigner client whose session to use
   */
  async reject(cs: CubeSignerClient) {
    await this.#mfaVoteCs(cs, "reject");
  }

  /**
   * Approve or reject an MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
   *
   * @param {CubeSignerClient} cs CubeSigner whose session to use
   * @param {MfaVote} mfaVote Approve or reject
   * @return {CubeSignerResponse<U>} The result of signing with the approval
   */
  async #mfaVoteCs(cs: CubeSignerClient, mfaVote: MfaVote): Promise<CubeSignerResponse<U>> {
    if (!this.requiresMfa()) {
      return this;
    }

    const mfaId = this.#mfaRequired!.id;
    const mfaOrgId = this.#mfaRequired!.org_id;

    const mfaApproval = await cs.mfaVoteCs(mfaId, mfaVote);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      return this;
    }

    return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
  }

  /**
   * Resubmits the request with a given MFA receipt attached.
   *
   * @param {MfaReceipt} mfaReceipt The MFA receipt
   * @return {Promise<CubeSignerResponse<U>>} The result of signing after MFA approval
   */
  async signWithMfaApproval(mfaReceipt: MfaReceipt): Promise<CubeSignerResponse<U>> {
    const headers = CubeSignerResponse.getMfaHeaders(mfaReceipt);
    return new CubeSignerResponse(this.#requestFn, await this.#requestFn(headers));
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * @param {RequestFn} requestFn
   *    The signing function that this response is from.
   *    This argument is used to resend requests with different headers if needed.
   * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI client.
   * @internal
   */
  constructor(requestFn: RequestFn<U>, resp: U | AcceptedResponse) {
    this.#requestFn = requestFn;
    this.#resp = resp;
    this.#mfaRequired = (this.#resp as AcceptedResponse).accepted?.MfaRequired;
  }

  /**
   * Static constructor.
   * @param {RequestFn} requestFn
   *    The request function that this response is from.
   *    This argument is used to resend requests with different headers if needed.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<CubeSignerResponse<U>>} New instance of this class.
   * @internal
   */
  static async create<U>(
    requestFn: RequestFn<U>,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<U>> {
    const seed = await requestFn(this.getMfaHeaders(mfaReceipt));
    return new CubeSignerResponse(requestFn, seed);
  }

  /**
   * Return HTTP headers containing a given MFA receipt.
   *
   * @param {MfaReceipt} mfaReceipt MFA receipt
   * @return {HeadersInit} Headers including that receipt
   * @internal
   */
  static getMfaHeaders(mfaReceipt?: MfaReceipt): HeadersInit | undefined {
    return mfaReceipt
      ? {
          "x-cubist-mfa-id": mfaReceipt.mfaId,
          "x-cubist-mfa-org-id": mfaReceipt.mfaOrgId,
          "x-cubist-mfa-confirmation": mfaReceipt.mfaConf,
        }
      : undefined;
  }
}
