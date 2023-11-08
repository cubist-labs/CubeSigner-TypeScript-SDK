import assert from "assert";
import {
  CubeSigner,
  Key,
  toKeyInfo,
  Org,
  KeyInfo,
  MfaReceipt,
  IdentityProof,
  MfaFidoChallenge,
} from ".";
import { components, paths } from "./client";
import { JsonMap, assertOk } from "./util";
import { PublicKeyCredential } from "./fido";
import {
  NewSessionResponse,
  SignerSessionManager,
  SignerSessionStorage,
} from "./session/signer_session_manager";

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
  paths["/v0/org/{org_id}/solana/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type AvaSignRequest =
  paths["/v0/org/{org_id}/ava/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];

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
export type AvaSignResponse =
  components["responses"]["AvaSignResponse"]["content"]["application/json"];

export type AcceptedResponse = components["schemas"]["AcceptedResponse"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];
export type BtcSignatureKind = components["schemas"]["BtcSignatureKind"];
/* eslint-enable */

/** MFA request kind */
export type MfaType = components["schemas"]["MfaType"];

/** Ava P- or X-chain transaction */
export type AvaTx = { P: AvaPChainTx } | { X: AvaXChainTx };

/** Ava P-chain transaction */
export type AvaPChainTx =
  | { AddPermissionlessValidator: JsonMap }
  | { AddSubnetValidator: JsonMap }
  | { AddValidator: JsonMap }
  | { CreateChain: JsonMap }
  | { CreateSubnet: JsonMap }
  | { Export: JsonMap }
  | { Import: JsonMap };

/** Ava X-chain transaction */
export type AvaXChainTx = { Base: JsonMap } | { Export: JsonMap } | { Import: JsonMap };

type SignFn<U> = (headers?: HeadersInit) => Promise<U | AcceptedResponse>;

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
export class SignResponse<U> {
  readonly #signFn: SignFn<U>;
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

  /** @return {U} The signed data */
  data(): U {
    return this.#resp as U;
  }

  /**
   * Approves the MFA request using a given session and a TOTP code.
   *
   * @param {SignerSession} session Signer session to use
   * @param {string} code 6-digit TOTP code
   * @return {SignResponse<U>} The result of signing with the approval
   */
  async approveTotp(session: SignerSession, code: string): Promise<SignResponse<U>> {
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
   * Approves the MFA request using a given `CubeSigner` instance (i.e., its management session).
   *
   * @param {CubeSigner} cs CubeSigner whose session to use
   * @return {SignResponse<U>} The result of signing with the approval
   */
  async approve(cs: CubeSigner): Promise<SignResponse<U>> {
    assert(this.requiresMfa());
    const mfaId = this.#mfaRequired!.id;
    const mfaOrgId = this.#mfaRequired!.org_id;

    const mfaApproval = await Org.mfaApprove(cs, mfaOrgId, mfaId);
    assert(mfaApproval.id === mfaId);
    const mfaConf = mfaApproval.receipt?.confirmation;

    if (!mfaConf) {
      return this;
    }

    return await this.signWithMfaApproval({ mfaId, mfaOrgId, mfaConf });
  }

  /**
   * @param {MfaReceipt} mfaReceipt The MFA receipt
   * @return {Promise<SignResponse<U>>} The result of signing after MFA approval
   */
  async signWithMfaApproval(mfaReceipt: MfaReceipt): Promise<SignResponse<U>> {
    const headers = SignResponse.getMfaHeaders(mfaReceipt);
    return new SignResponse(this.#signFn, await this.#signFn(headers));
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * @param {SignFn} signFn The signing function that this response is from.
   *                        This argument is used to resend requests with
   *                        different headers if needed.
   * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI
   *                                    client.
   */
  constructor(signFn: SignFn<U>, resp: U | AcceptedResponse) {
    this.#signFn = signFn;
    this.#resp = resp;
    this.#mfaRequired = (this.#resp as AcceptedResponse).accepted?.MfaRequired;
  }

  /**
   * Static constructor.
   * @param {SignFn} signFn The signing function that this response is from.
   *                        This argument is used to resend requests with
   *                        different headers if needed.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<SignResponse<U>>} New instance of this class.
   */
  static async create<U>(signFn: SignFn<U>, mfaReceipt?: MfaReceipt): Promise<SignResponse<U>> {
    const seed = await signFn(this.getMfaHeaders(mfaReceipt));
    return new SignResponse(signFn, seed);
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

  /** Org id */
  get orgId() {
    return this.#orgId;
  }

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
   * Initiate approval of an existing MFA request using FIDO.
   * @param {string} mfaId The MFA request ID.
   * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
   */
  async fidoApproveStart(mfaId: string): Promise<MfaFidoChallenge> {
    const client = await this.sessionMgr.client();
    const resp = await client.post("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
      params: { path: { org_id: this.#orgId, mfa_id: mfaId } },
      parseAs: "json",
    });
    const challenge = assertOk(resp);
    return new MfaFidoChallenge(this, mfaId, challenge);
  }

  /**
   * Complete a previously initiated MFA request approval using FIDO.
   * @param {string} mfaId The MFA request ID
   * @param {string} challengeId The challenge ID
   * @param {PublicKeyCredential} credential The answer to the challenge
   * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
   */
  async fidoApproveComplete(
    mfaId: string,
    challengeId: string,
    credential: PublicKeyCredential,
  ): Promise<MfaRequestInfo> {
    const client = await this.sessionMgr.client();
    const resp = await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
      params: { path: { org_id: this.#orgId, mfa_id: mfaId } },
      body: {
        challenge_id: challengeId,
        credential,
      },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Get a pending MFA request by its id.
   * @param {CubeSigner} cs Management session to use (this argument will be removed in future versions)
   * @param {string} mfaId The id of the MFA request.
   * @return {Promise<MfaRequestInfo>} The MFA request.
   */
  async getMfaInfo(cs: CubeSigner, mfaId: string): Promise<MfaRequestInfo> {
    const resp = await (
      await cs.management()
    ).get("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: this.#orgId, mfa_id: mfaId } },
    });
    return assertOk(resp);
  }

  /**
   * Submit an EVM sign request.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {EvmSignRequest} req What to sign.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
   * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature
   */
  async signEvm(
    key: Key | string,
    req: EvmSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<SignResponse<EvmSignResponse>> {
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
    return await SignResponse.create(sign, mfaReceipt);
  }

  /**
   * Submit an 'eth2' sign request.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {Eth2SignRequest} req What to sign.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
   */
  async signEth2(
    key: Key | string,
    req: Eth2SignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<SignResponse<Eth2SignResponse>> {
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
    return await SignResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign a stake request.
   * @param {Eth2StakeRequest} req The request to sign.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
   */
  async stake(
    req: Eth2StakeRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<SignResponse<Eth2StakeResponse>> {
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
    return await SignResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign an unstake request.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {Eth2UnstakeRequest} req The request to sign.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
   */
  async unstake(
    key: Key | string,
    req: Eth2UnstakeRequest,
    mfaReceipt?: MfaReceipt,
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
    return await SignResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign a raw blob.
   * @param {Key | string} key The key to sign with (either {@link Key} or its ID).
   * @param {BlobSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
   */
  async signBlob(
    key: Key | string,
    req: BlobSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<SignResponse<BlobSignResponse>> {
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
    return await SignResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign a bitcoin message.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {BtcSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
   */
  async signBtc(
    key: Key | string,
    req: BtcSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<SignResponse<BtcSignResponse>> {
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
    return await SignResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign a solana message.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {SolanaSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
   */
  async signSolana(
    key: Key | string,
    req: SolanaSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<SignResponse<SolanaSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v0/org/{org_id}/solana/sign/{pubkey}", {
        params: { path: { org_id: this.#orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await SignResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign an Avalanche P- or X-chain message.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {AvaTx} tx Avalanche message (transaction) to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
   */
  async signAva(
    key: Key | string,
    tx: AvaTx,
    mfaReceipt?: MfaReceipt,
  ): Promise<SignResponse<AvaSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const req = <AvaSignRequest>{
        tx: tx as unknown,
      };
      const resp = await (
        await this.sessionMgr.client()
      ).post("/v0/org/{org_id}/ava/sign/{pubkey}", {
        params: { path: { org_id: this.#orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await SignResponse.create(sign, mfaReceipt);
  }

  /**
   * Obtain a proof of authentication.
   *
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async proveIdentity(): Promise<IdentityProof> {
    const client = await this.sessionMgr.client();
    const resp = await client.post("/v0/org/{org_id}/identity/prove", {
      params: { path: { org_id: this.#orgId } },
      parseAs: "json",
    });
    return assertOk(resp);
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
