import type { MfaVote, EnvInterface, MfaReceipts, MfaRequired } from ".";
import { CubeSignerClient, isManyMfaReceipts } from ".";
import { encodeToBase64Url } from "./util";
import type { AcceptedResponse } from "./schema_types";

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
 * @param resp Original response
 * @param mapFn Map to apply to the response value when its status code is 200.
 * @returns Response whose value for status code 200 is mapped from U to V
 */
export function mapResponse<U, V>(resp: Response<U>, mapFn: MapFn<U, V>): Response<V> {
  if ((resp as AcceptedResponse).accepted?.MfaRequired) {
    return resp as AcceptedResponse;
  } else {
    return mapFn(resp as U);
  }
}

/**
 * A response of a CubeSigner request.
 */
export class CubeSignerResponse<U> {
  readonly #env: EnvInterface;
  readonly #requestFn: RequestFn<U>;
  readonly #resp: U | AcceptedResponse;
  /**
   * Optional MFA id. Only set if there is an MFA request associated with the request
   */
  readonly #mfaRequired?: MfaRequired;

  /** @returns The first MFA id associated with this request (if any) */
  mfaId(): string | undefined {
    return this.#mfaRequired?.id;
  }

  /** @returns The MFA ids associated with this request (if any) */
  mfaIds(): string[] {
    return this.#mfaRequired?.ids ?? [];
  }

  /** @returns True if this request requires an MFA approval */
  requiresMfa(): boolean {
    return this.#mfaRequired !== undefined;
  }

  /**
   * @returns Session information to use for any MFA approval requests (if any was included in the response).
   */
  async mfaClient(): Promise<CubeSignerClient | undefined> {
    if (this.#mfaRequired === undefined) return;
    const session = (this.#resp as AcceptedResponse).accepted?.MfaRequired?.session ?? undefined;
    if (session === undefined) return;

    const env = this.#env;
    return await CubeSignerClient.create({
      env: {
        "Dev-CubeSignerStack": env,
      },
      org_id: this.#mfaRequired.org_id,
      session_exp: session.expiration,
      session_info: session.session_info,
      token: session.token,
      refresh_token: session.refresh_token,
    });
  }

  /** @returns The response data, if no MFA is required */
  data(): U {
    if (this.requiresMfa()) {
      throw new Error("Cannot call `data()` while MFA is required");
    }
    return this.#resp as U;
  }

  /**
   * Approve the MFA request using a given session and a TOTP code.
   *
   * @param client CubeSigner whose session to use
   * @param code 6-digit TOTP code
   * @returns The result of resubmitting the request with the approval
   */
  async totpApprove(client: CubeSignerClient, code: string): Promise<CubeSignerResponse<U>> {
    return await this.#mfaTotpVote(client, code, "approve");
  }

  /**
   * Reject the MFA request using a given session and a TOTP code.
   *
   * @param client CubeSigner whose session to use
   * @param code 6-digit TOTP code
   */
  async totpReject(client: CubeSignerClient, code: string) {
    await this.#mfaTotpVote(client, code, "reject");
  }

  /**
   * Approve or reject an MFA request using a given session and a TOTP code.
   *
   * @param client CubeSigner whose session to use
   * @param code 6-digit TOTP code
   * @param vote Approve or reject
   * @returns The result of resubmitting the request with the approval
   */
  async #mfaTotpVote(
    client: CubeSignerClient,
    code: string,
    vote: MfaVote,
  ): Promise<CubeSignerResponse<U>> {
    const mfaId = this.mfaId();
    if (mfaId === undefined) {
      return this;
    }

    const mfaOrgId = this.#mfaRequired!.org_id;
    const mfaApproval = await client.apiClient.mfaVoteTotp(mfaId, code, vote);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      return this;
    }

    return await this.execWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
  }

  /**
   * Approve the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
   *
   * @param client CubeSigner whose session to use
   * @returns The result of resubmitting the request with the approval
   */
  async approve(client: CubeSignerClient): Promise<CubeSignerResponse<U>> {
    return await this.#mfaVote(client, "approve");
  }

  /**
   * Reject the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
   *
   * @param client CubeSigner whose session to use
   */
  async reject(client: CubeSignerClient) {
    await this.#mfaVote(client, "reject");
  }

  /**
   * Approve or reject an MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
   *
   * @param client CubeSigner whose session to use
   * @param mfaVote Approve or reject
   * @returns The result of resubmitting the request with the approval
   */
  async #mfaVote(client: CubeSignerClient, mfaVote: MfaVote): Promise<CubeSignerResponse<U>> {
    const mfaId = this.mfaId();
    if (mfaId === undefined) {
      return this;
    }

    const mfaOrgId = this.#mfaRequired!.org_id;

    const mfaApproval = await client.apiClient.mfaVoteCs(mfaId, mfaVote);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      return this;
    }

    return await this.execWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
  }

  /**
   * Resubmits the request with a given MFA receipt(s) attached.
   *
   * @param mfaReceipt The MFA receipt(s)
   * @returns The result of signing after MFA approval
   */
  async execWithMfaApproval(mfaReceipt: MfaReceipts): Promise<CubeSignerResponse<U>> {
    const headers = CubeSignerResponse.getMfaHeaders(mfaReceipt);
    return new CubeSignerResponse(this.#env, this.#requestFn, await this.#requestFn(headers));
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * @param env The environment where the response comes from
   * @param requestFn
   *    The function that this response is from.
   *    This argument is used to resend requests with different headers if needed.
   * @param resp The response as returned by the OpenAPI client.
   * @internal
   */
  protected constructor(env: EnvInterface, requestFn: RequestFn<U>, resp: U | AcceptedResponse) {
    this.#env = env;
    this.#requestFn = requestFn;
    this.#resp = resp;
    this.#mfaRequired = (this.#resp as AcceptedResponse).accepted?.MfaRequired;
  }

  /**
   * Static constructor.
   *
   * @param env The environment where the response comes from
   * @param requestFn
   *    The request function that this response is from.
   *    This argument is used to resend requests with different headers if needed.
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns New instance of this class.
   * @internal
   */
  static async create<U>(
    env: EnvInterface,
    requestFn: RequestFn<U>,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<U>> {
    const seed = await requestFn(this.getMfaHeaders(mfaReceipt));
    return new CubeSignerResponse(env, requestFn, seed);
  }

  /**
   * Return HTTP headers containing a given MFA receipt.
   *
   * @param mfaReceipt MFA receipt(s)
   * @returns Headers including {@link mfaReceipt}
   * @internal
   */
  static getMfaHeaders(mfaReceipt?: MfaReceipts): HeadersInit | undefined {
    if (mfaReceipt === undefined) {
      return undefined;
    }

    const rec = isManyMfaReceipts(mfaReceipt)
      ? mfaReceipt
      : {
          orgId: mfaReceipt.mfaOrgId,
          receipts: [
            {
              id: mfaReceipt.mfaId,
              confirmation: mfaReceipt.mfaConf,
            },
          ],
        };

    if (rec.receipts.length === 0) {
      return undefined;
    }

    const textEncoder = new TextEncoder();
    return {
      "x-cubist-mfa-org-id": rec.orgId,
      "x-cubist-mfa-receipts": encodeToBase64Url(textEncoder.encode(JSON.stringify(rec.receipts))),
    };
  }
}
