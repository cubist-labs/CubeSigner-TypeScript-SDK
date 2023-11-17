import assert from "assert";
import { CubeSigner, toKeyInfo, MfaReceipt, KeyInfo } from ".";
import { CubeSignerClient } from "./client";
import { AcceptedResponse, NewSessionResponse } from "./schema_types";
import { SignerSessionManager, SignerSessionStorage } from "./session/signer_session_manager";

type Response<U> = U | AcceptedResponse;
type RequestFn<U> = (headers?: HeadersInit) => Promise<Response<U>>;
type MapFn<U, V> = (u: U) => V;

/**
 * Takes a {@link Response<U>} and a {@link MapFn<U, V>} function and returns
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

  /** @return {string} The MFA id associated with this request */
  mfaId(): string {
    return this.#mfaRequired!.id;
  }

  /** @return {boolean} True if this request requires an MFA approval */
  requiresMfa(): boolean {
    return this.#mfaRequired !== undefined;
  }

  /**
   * Returns session information to use for any MFA approval requests (if any was included in the response).
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
   * Approves the MFA request using a given session and a TOTP code.
   *
   * @param {SignerSession} session Signer session to use
   * @param {string} code 6-digit TOTP code
   * @return {CubeSignerResponse<U>} The result of signing with the approval
   */
  async approveTotp(session: SignerSession, code: string): Promise<CubeSignerResponse<U>> {
    assert(this.requiresMfa());
    const mfaId = this.mfaId();
    const mfaOrgId = this.#mfaRequired!.org_id;
    const mfaApproval = await session.totpApprove(mfaId, code);
    assert(mfaApproval.id === mfaId);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      return this;
    }

    return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
  }

  /**
   * Approves the MFA request using a given `CubeSignerClient` instance (i.e., its session).
   *
   * @param {CubeSigner} cs CubeSigner whose session to use
   * @return {CubeSignerResponse<U>} The result of signing with the approval
   */
  async approve(cs: CubeSigner): Promise<CubeSignerResponse<U>> {
    assert(this.requiresMfa());
    const mfaId = this.#mfaRequired!.id;
    const mfaOrgId = this.#mfaRequired!.org_id;

    const mfaApproval = await cs.mfaApprove(mfaOrgId, mfaId);
    assert(mfaApproval.id === mfaId);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      return this;
    }

    return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
  }

  /**
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
   */
  static async create<U>(
    requestFn: RequestFn<U>,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<U>> {
    const seed = await requestFn(this.getMfaHeaders(mfaReceipt));
    return new CubeSignerResponse(requestFn, seed);
  }

  /**
   * Returns HTTP headers containing a given MFA receipt.
   *
   * @param {MfaReceipt} mfaReceipt MFA receipt
   * @return {HeadersInit} Headers including that receipt
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

/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export class SignerSessionInfo {
  readonly #csc: CubeSignerClient;
  readonly #sessionId: string;
  public readonly purpose: string;

  /** Revoke this session */
  async revoke() {
    await this.#csc.sessionRevoke(this.#sessionId);
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Internal constructor.
   * @param {CubeSignerClient} cs CubeSigner instance to use when calling `revoke`
   * @param {string} sessionId The ID of the session; can be used for revocation but not for auth
   * @param {string} purpose Session purpose
   * @internal
   */
  constructor(cs: CubeSignerClient, sessionId: string, purpose: string) {
    this.#csc = cs;
    this.#sessionId = sessionId;
    this.purpose = purpose;
  }
}

/**
 * Signer session.
 *
 * @deprecated Use {@link CubeSignerClient} instead.
 */
export class SignerSession {
  readonly #csc: CubeSignerClient;

  /** Deprecated */
  get sessionMgr() {
    return this.#csc.sessionMgr;
  }

  /** Org id */
  get orgId() {
    return this.#csc.orgId;
  }

  /**
   * Returns the list of keys that this token grants access to.
   * @return {KeyInfo[]} The list of keys.
   */
  async keys(): Promise<KeyInfo[]> {
    const keys = await this.#csc.sessionKeysList();
    return keys.map((k) => toKeyInfo(k));
  }

  /** Approve a pending MFA request using TOTP. */
  get totpApprove() {
    return this.#csc.mfaApproveTotp.bind(this.#csc);
  }

  /** Initiate approval of an existing MFA request using FIDO. */
  get fidoApproveStart() {
    return this.#csc.mfaApproveFidoInit.bind(this.#csc);
  }

  /** Get a pending MFA request by its id. */
  get getMfaInfo() {
    return this.#csc.mfaGet.bind(this.#csc);
  }

  /** Submit an EVM sign request. */
  get signEvm() {
    return this.#csc.signEvm.bind(this.#csc);
  }

  /** Submit an 'eth2' sign request. */
  get signEth2() {
    return this.#csc.signEth2.bind(this.#csc);
  }

  /** Sign a stake request. */
  get stake() {
    return this.#csc.signStake.bind(this.#csc);
  }

  /** Sign an unstake request. */
  get unstake() {
    return this.#csc.signUnstake.bind(this.#csc);
  }

  /** Sign a raw blob.*/
  get signBlob() {
    return this.#csc.signBlob.bind(this.#csc);
  }

  /** Sign a bitcoin message. */
  get signBtc() {
    return this.#csc.signBtc.bind(this.#csc);
  }

  /** Sign a solana message. */
  get signSolana() {
    return this.#csc.signSolana.bind(this.#csc);
  }

  /** Sign an Avalanche P- or X-chain message. */
  get signAva() {
    return this.#csc.signAva.bind(this.#csc);
  }

  /**
   * Obtain a proof of authentication.
   */
  get proveIdentity() {
    return this.#csc.identityProve.bind(this.#csc);
  }

  /**
   * Loads an existing signer session from storage.
   * @param {SignerSessionStorage} storage The session storage to use
   * @return {Promise<SingerSession>} New signer session
   */
  static async loadSignerSession(storage: SignerSessionStorage): Promise<SignerSession> {
    const manager = await SignerSessionManager.loadFromStorage(storage);
    return new SignerSession(manager);
  }

  /**
   * Constructor.
   * @param {SignerSessionManager} sessionMgr The session manager to use
   * @internal
   */
  constructor(sessionMgr: SignerSessionManager) {
    this.#csc = new CubeSignerClient(sessionMgr);
  }
}
