import assert from "assert";
import { CubeSigner, Key, toKeyInfo, Org, KeyInfo } from ".";
import { components, paths } from "./client";
import { assertOk } from "./util";
import { SignerSessionManager, SignerSessionStorage } from "./session/signer_session_manager";

/* eslint-disable */
export type EvmSignRequest =
  paths["/v1/org/{org_id}/eth1/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2SignRequest =
  paths["/v1/org/{org_id}/eth2/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2StakeRequest =
  paths["/v1/org/{org_id}/eth2/stake"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2UnstakeRequest =
  paths["/v1/org/{org_id}/eth2/unstake/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type BlobSignRequest =
  paths["/v1/org/{org_id}/blob/sign/{key_id}"]["post"]["requestBody"]["content"]["application/json"];
export type BtcSignRequest =
  paths["/v0/org/{org_id}/btc/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type SolanaSignRequest =
  paths["/v1/org/{org_id}/solana/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];

export type EvmSignResponse =
  components["responses"]["Eth1SignResponse"]["content"]["application/json"];
export type Eth2SignResponse =
  components["responses"]["Eth2SignResponse"]["content"]["application/json"];
export type Eth2StakeResponse =
  components["responses"]["StakeResponse"]["content"]["application/json"];
export type Eth2UnstakeResponse =
  components["responses"]["UnstakeResponse"]["content"]["application/json"];
export type BlobSignResponse =
  components["responses"]["BlobSignResponse"]["content"]["application/json"];
export type BtcSignResponse =
  components["responses"]["BtcSignResponse"]["content"]["application/json"];
export type SolanaSignResponse =
  components["responses"]["SolanaSignResponse"]["content"]["application/json"];
export type MfaRequestInfo =
  components["responses"]["MfaRequestInfo"]["content"]["application/json"];

export type AcceptedResponse = components["schemas"]["AcceptedResponse"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];
export type BtcSignatureKind = components["schemas"]["BtcSignatureKind"];
/* eslint-enable */

/** MFA request kind */
export type MfaType = components["schemas"]["MfaType"];

type SignFn<U> = (headers?: HeadersInit) => Promise<U | AcceptedResponse>;

/**
 * A response of a signing request.
 */
export class SignResponse<U> {
  readonly #orgId: string;
  readonly #signFn: SignFn<U>;
  readonly #resp: U | AcceptedResponse;

  /** @return {boolean} True if this signing request requires an MFA approval */
  requiresMfa(): boolean {
    return (this.#resp as AcceptedResponse).accepted?.MfaRequired !== undefined;
  }

  /** @return {U} The signed data */
  data(): U {
    return this.#resp as U;
  }

  /**
   * Approves the MFA request using a given signer session and a TOTP code.
   *
   * Note: This only works for MFA requests that require a single approval.
   *
   * @param {SignerSession} session Signer session to use
   * @param {string} code 6-digit TOTP code
   * @return {SignResponse<U>} The result of signing with the approval
   */
  async approveTotp(session: SignerSession, code: string): Promise<SignResponse<U>> {
    const mfaId = this.#mfaId();

    const mfaApproval = await session.totpApprove(mfaId, code);
    assert(mfaApproval.id === mfaId);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      throw new Error("MfaRequest has not been approved yet");
    }

    return await this.#signWithMfaApproval(mfaConf!);
  }

  /**
   * Approves the MFA request using CubeSigner's management session.
   *
   * Note: This only works for MFA requests that require a single approval.
   *
   * @param {CubeSigner} cs CubeSigner whose session to use
   * @return {SignResponse<U>} The result of signing with the approval
   */
  async approve(cs: CubeSigner): Promise<SignResponse<U>> {
    const mfaId = this.#mfaId();

    const mfaApproval = await Org.mfaApprove(cs, this.#orgId, mfaId);
    assert(mfaApproval.id === mfaId);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      throw new Error("MfaRequest has not been approved yet");
    }

    return await this.#signWithMfaApproval(mfaConf);
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * @param {string} orgId The org id of the corresponding signing request
   * @param {SignFn} signFn The signing function that this response is from.
   *                        This argument is used to resend requests with
   *                        different headers if needed.
   * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI
   *                                    client.
   */
  constructor(orgId: string, signFn: SignFn<U>, resp: U | AcceptedResponse) {
    this.#orgId = orgId;
    this.#signFn = signFn;
    this.#resp = resp;
  }

  /**
   * @param {string} mfaConf MFA request approval confirmation code
   * @return {Promise<SignResponse<U>>} The result of signing after MFA approval
   */
  async #signWithMfaApproval(mfaConf: string): Promise<SignResponse<U>> {
    const mfaId = this.#mfaId();

    const headers = {
      "x-cubist-mfa-id": mfaId,
      "x-cubist-mfa-confirmation": mfaConf,
    };
    return new SignResponse(this.#orgId, this.#signFn, await this.#signFn(headers));
  }

  /**
   * @return {string} MFA id if MFA is required for this response; throws otherwise.
   */
  #mfaId(): string {
    const mfaRequired = (this.#resp as AcceptedResponse).accepted?.MfaRequired;
    if (!mfaRequired) {
      throw new Error("Request does not require MFA approval");
    }
    return mfaRequired.id;
  }
}

/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export class SignerSessionInfo {
  readonly #cs: CubeSigner;
  readonly #orgId: string;
  readonly #roleId: string;
  readonly #sessionId: string;
  public readonly purpose: string;

  /** Revoke this token */
  async revoke() {
    await SignerSession.revoke(this.#cs, this.#orgId, this.#roleId, this.#sessionId);
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Internal constructor.
   * @param {CubeSigner} cs CubeSigner instance to use when calling `revoke`
   * @param {string} orgId Organization ID
   * @param {string} roleId Role ID
   * @param {string} hash The hash of the token; can be used for revocation but not for auth
   * @param {string} purpose Session purpose
   * @internal
   */
  constructor(cs: CubeSigner, orgId: string, roleId: string, hash: string, purpose: string) {
    this.#cs = cs;
    this.#orgId = orgId;
    this.#roleId = roleId;
    this.#sessionId = hash;
    this.purpose = purpose;
  }
}

/** Signer session. */
export class SignerSession {
  sessionMgr: SignerSessionManager;
  readonly #orgId: string;

  /**
   * Returns the list of keys that this token grants access to.
   * @return {Key[]} The list of keys.
   */
  async keys(): Promise<KeyInfo[]> {
    const resp = await (
      await this.sessionMgr.client()
    ).get("/v0/org/{org_id}/token/keys", {
      params: { path: { org_id: this.#orgId } },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data.keys.map((k) => toKeyInfo(k));
  }

  /**
   * Approve a pending MFA request using TOTP.
   *
   * @param {string} mfaId The MFA request to approve
   * @param {string} code The TOTP code
   * @return {Promise<MfaRequestInfo>} The current status of the MFA request
   */
  async totpApprove(mfaId: string, code: string): Promise<MfaRequestInfo> {
    const resp = await (
      await this.sessionMgr.client()
    ).patch("/v0/org/{org_id}/mfa/{mfa_id}/totp", {
      params: { path: { org_id: this.#orgId, mfa_id: mfaId } },
      body: { code },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Submit an EVM sign request.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {EvmSignRequest} req What to sign.
   * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature
   */
  async signEvm(key: Key | string, req: EvmSignRequest): Promise<SignResponse<EvmSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v1/org/{org_id}/eth1/sign/{pubkey}", {
        params: { path: { org_id: this.#orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new SignResponse(this.#orgId, sign, await sign());
  }

  /**
   * Submit an 'eth2' sign request.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {Eth2SignRequest} req What to sign.
   * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
   */
  async signEth2(key: Key | string, req: Eth2SignRequest): Promise<SignResponse<Eth2SignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v1/org/{org_id}/eth2/sign/{pubkey}", {
        params: { path: { org_id: this.#orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new SignResponse(this.#orgId, sign, await sign());
  }

  /**
   * Sign a stake request.
   * @param {Eth2StakeRequest} req The request to sign.
   * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
   */
  async stake(req: Eth2StakeRequest): Promise<SignResponse<Eth2StakeResponse>> {
    const sign = async (headers?: HeadersInit) => {
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v1/org/{org_id}/eth2/stake", {
        params: { path: { org_id: this.#orgId } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new SignResponse(this.#orgId, sign, await sign());
  }

  /**
   * Sign an unstake request.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {Eth2UnstakeRequest} req The request to sign.
   * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
   */
  async unstake(
    key: Key | string,
    req: Eth2UnstakeRequest,
  ): Promise<SignResponse<Eth2UnstakeResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v1/org/{org_id}/eth2/unstake/{pubkey}", {
        params: { path: { org_id: this.#orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new SignResponse(this.#orgId, sign, await sign());
  }

  /**
   * Sign a raw blob.
   * @param {Key | string} key The key to sign with (either {@link Key} or its ID).
   * @param {BlobSignRequest} req What to sign
   * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
   */
  async signBlob(key: Key | string, req: BlobSignRequest): Promise<SignResponse<BlobSignResponse>> {
    const key_id = typeof key === "string" ? (key as string) : key.id;
    const sign = async (headers?: HeadersInit) => {
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v1/org/{org_id}/blob/sign/{key_id}", {
        params: {
          path: { org_id: this.#orgId, key_id },
        },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new SignResponse(this.#orgId, sign, await sign());
  }

  /**
   * Sign a bitcoin message.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {BtcSignRequest} req What to sign
   * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
   */
  async signBtc(key: Key | string, req: BtcSignRequest): Promise<SignResponse<BtcSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v0/org/{org_id}/btc/sign/{pubkey}", {
        params: {
          path: { org_id: this.#orgId, pubkey },
        },
        body: req,
        headers: headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new SignResponse(this.#orgId, sign, await sign());
  }

  /**
   * Sign a solana message.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {SolanaSignRequest} req What to sign
   * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
   */
  async signSolana(
    key: Key | string,
    req: SolanaSignRequest,
  ): Promise<SignResponse<SolanaSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v1/org/{org_id}/solana/sign/{pubkey}", {
        params: { path: { org_id: this.#orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new SignResponse(this.#orgId, sign, await sign());
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
    this.sessionMgr = sessionMgr;
    this.#orgId = sessionMgr.orgId;
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /* eslint-disable require-jsdoc */

  /**
   * Static method for revoking a token (used both from {SignerSession} and {SignerSessionInfo}).
   * @param {CubeSigner} cs CubeSigner instance
   * @param {string} orgId Organization ID
   * @param {string} roleId Role ID
   * @param {string} sessionId Signer session ID
   * @internal
   */
  static async revoke(cs: CubeSigner, orgId: string, roleId: string, sessionId: string) {
    const resp = await (
      await cs.management()
    ).del("/v0/org/{org_id}/roles/{role_id}/tokens/{session_id}", {
      params: {
        path: { org_id: orgId, role_id: roleId, session_id: sessionId },
      },
      parseAs: "json",
    });
    assertOk(resp);
  }
}
