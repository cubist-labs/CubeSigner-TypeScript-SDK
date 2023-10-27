import { envs, EnvInterface } from "./env";
import { components, Client, paths } from "./client";
import { Org } from "./org";
import { JsonFileSessionStorage } from "./session/session_storage";

import { SignerSessionStorage, SignerSessionManager } from "./session/signer_session_manager";
import { AcceptedResponse, MfaRequestInfo, SignResponse, SignerSession } from "./signer_session";
import { CognitoSessionManager, CognitoSessionStorage } from "./session/cognito_manager";
import { assertOk, configDir } from "./util";
import * as path from "path";
import createClient from "openapi-fetch";

/** CubeSigner constructor options */
export interface CubeSignerOptions {
  /** The environment to use */
  env?: EnvInterface;
  /** The management authorization token */
  sessionMgr?: CognitoSessionManager | SignerSessionManager;
}

export type UserInfo = components["schemas"]["UserInfo"];
export type TotpInfo = components["responses"]["TotpInfo"]["content"]["application/json"];
export type ConfiguredMfa = components["schemas"]["ConfiguredMfa"];
export type RatchetConfig = components["schemas"]["RatchetConfig"];
export type IdentityProof = components["schemas"]["IdentityProof"];

type OidcAuthResponse =
  paths["/v0/org/{org_id}/oidc"]["post"]["responses"]["200"]["content"]["application/json"];

/** TOTP challenge that must be answered before user's TOTP is updated */
export class TotpChallenge {
  readonly #cs: CubeSigner;
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
   * @param {CubeSigner} cs Used when answering the challenge.
   * @param {TotpInfo} totpInfo TOTP challenge information.
   */
  constructor(cs: CubeSigner, totpInfo: TotpInfo) {
    this.#cs = cs;
    this.#totpInfo = totpInfo;
  }
  /**
   * Answer the challenge with the code that corresponds to this `this.totpUrl`.
   * @param {string} code 6-digit code that corresponds to this `this.totpUrl`.
   */
  async answer(code: string) {
    await this.#cs.resetTotpComplete(this.totpId, code);
  }
}

/** CubeSigner client */
export class CubeSigner {
  readonly #env: EnvInterface;
  readonly sessionMgr?: CognitoSessionManager | SignerSessionManager;

  /** @return {EnvInterface} The CubeSigner environment of this client */
  get env(): EnvInterface {
    return this.#env;
  }

  /**
   * Loads an existing management session and creates a CubeSigner instance.
   *
   * @param {CognitoSessionStorage} storage Optional session storage to load
   * the session from. If not specified, the management session from the config
   * directory will be loaded.
   * @return {Promise<CubeSigner>} New CubeSigner instance
   */
  static async loadManagementSession(storage?: CognitoSessionStorage): Promise<CubeSigner> {
    const defaultFilePath = path.join(configDir(), "management-session.json");
    const sessionMgr = await CognitoSessionManager.loadFromStorage(
      storage ?? new JsonFileSessionStorage(defaultFilePath),
    );
    return new CubeSigner(<CubeSignerOptions>{
      sessionMgr,
    });
  }

  /**
   * Loads a signer session from a session storage (e.g., session file).
   * @param {SignerSessionStorage} storage Optional session storage to load
   * the session from. If not specified, the signer session from the config
   * directory will be loaded.
   * @return {Promise<SignerSession>} New signer session
   */
  static async loadSignerSession(storage?: SignerSessionStorage): Promise<SignerSession> {
    const defaultFilePath = path.join(configDir(), "signer-session.json");
    const sss = storage ?? new JsonFileSessionStorage(defaultFilePath);
    return await SignerSession.loadSignerSession(sss);
  }

  /**
   * Create a new CubeSigner instance.
   * @param {CubeSignerOptions} options The optional configuraiton options for the CubeSigner instance.
   */
  constructor(options?: CubeSignerOptions) {
    let env = options?.env;
    if (options?.sessionMgr) {
      this.sessionMgr = options.sessionMgr;
      env = env ?? this.sessionMgr.env;
    }
    this.#env = env ?? envs["gamma"];
  }

  /**
   * Authenticate an OIDC user and create a new session manager for them.
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @param {List<string>} scopes The scopes of the resulting session
   * @param {RatchetConfig} lifetimes Lifetimes of the new session.
   * @param {SignerSessionStorage?} storage Optional signer session storage (defaults to in-memory storage)
   * @return {Promise<SignerSessionManager>} The signer session manager
   */
  async oidcAuth(
    oidcToken: string,
    orgId: string,
    scopes: Array<string>,
    lifetimes?: RatchetConfig,
    storage?: SignerSessionStorage,
  ): Promise<SignerSessionManager> {
    const resp = await this.oidcLogin(oidcToken, orgId, scopes, lifetimes);
    return await SignerSessionManager.createFromSessionInfo(this.env, orgId, resp.data(), storage);
  }

  /** Retrieves information about the current user. */
  async aboutMe(): Promise<UserInfo> {
    const resp = await (
      await this.management()
    ).get("/v0/about_me", {
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data;
  }

  /**
   * Retrieves existing MFA request.
   *
   * @param {string} orgId Organization ID
   * @param {string} mfaId MFA request ID
   * @return {Promise<MfaRequestInfo>} MFA request information
   */
  async mfaGet(orgId: string, mfaId: string): Promise<MfaRequestInfo> {
    const resp = await (
      await this.management()
    ).get("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: orgId, mfa_id: mfaId } },
    });
    return assertOk(resp);
  }

  /**
   * List pending MFA requests accessible to the current user.
   * @param {string} orgId Organization ID
   * @return {Promise<MfaRequestInfo[]>} The MFA requests.
   */
  async mfaList(orgId: string): Promise<MfaRequestInfo[]> {
    const resp = await (
      await this.management()
    ).get("/v0/org/{org_id}/mfa", {
      params: { path: { org_id: orgId } },
    });
    return assertOk(resp).mfa_requests;
  }

  /**
   * Approve a pending MFA request.
   *
   * @param {string} orgId The org id of the MFA request
   * @param {string} mfaId The id of the MFA request
   * @return {Promise<MfaRequestInfo>} The result of the MFA request
   */
  async mfaApprove(orgId: string, mfaId: string): Promise<MfaRequestInfo> {
    const resp = await (
      await this.management()
    ).patch("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: orgId, mfa_id: mfaId } },
    });
    return assertOk(resp);
  }

  /**
   * Creates a request to change user's TOTP. This request returns a new TOTP challenge
   * that must be answered by calling `resetTotpComplete`
   *
   * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
   */
  async resetTotpStart(mfaReceipt?: MfaReceipt): Promise<SignResponse<TotpChallenge>> {
    const resetTotpFn = async (headers?: HeadersInit) => {
      const resp = await (
        await this.management()
      ).post("/v0/user/me/totp", {
        headers,
        body: null,
        parseAs: "json",
      });
      const x = assertOk(resp);
      if ((x as AcceptedResponse).accepted?.MfaRequired) {
        return x as AcceptedResponse;
      } else {
        return new TotpChallenge(this, x as TotpInfo);
      }
    };
    const h1 = mfaReceipt ? SignResponse.getMfaHeaders(mfaReceipt) : undefined;
    return new SignResponse(resetTotpFn, await resetTotpFn(h1));
  }

  /**
   * Answer the TOTP challenge issued by `resetTotpStart`. If successful, user's
   * TOTP configuration will be updated to that of the TOTP challenge.
   *
   * @param {string} totpId - The ID of the TOTP challenge
   * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
   */
  async resetTotpComplete(totpId: string, code: string): Promise<void> {
    const resp = await (
      await this.management()
    ).patch("/v0/user/me/totp", {
      parseAs: "json",
      body: { totp_id: totpId, code },
    });
    assertOk(resp);
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   * @param {string} code Current TOTP code
   */
  async verifyTotp(code: string) {
    const resp = await (
      await this.management()
    ).get("/v0/user/me/totp/verify/{code}", {
      params: { path: { code } },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /** Retrieves information about an organization.
   * @param {string} orgId The ID or name of the organization.
   * @return {Org} The organization.
   * */
  async getOrg(orgId: string): Promise<Org> {
    const resp = await (
      await this.management()
    ).get("/v0/org/{org_id}", {
      params: { path: { org_id: orgId } },
      parseAs: "json",
    });

    const data = assertOk(resp);
    return new Org(this, data);
  }

  /**
   * Deletes a given key.
   * @param {string} orgId - Organization id
   * @param {string} keyId - Key id
   */
  async deleteKey(orgId: string, keyId: string) {
    const resp = await (
      await this.management()
    ).del("/v0/org/{org_id}/keys/{key_id}", {
      params: { path: { org_id: orgId, key_id: keyId } },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /** Get the management client.
   * @return {Client} The client.
   * @internal
   * */
  async management(): Promise<Client> {
    if (!this.sessionMgr) {
      throw new Error("No management session loaded");
    }
    return await this.sessionMgr.client();
  }

  /**
   * Obtain a proof of authentication.
   *
   * @param {string} orgId The id of the organization that the user is in
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async proveIdentity(orgId: string): Promise<IdentityProof> {
    const client = await this.management();
    const resp = await client.post("/v0/org/{org_id}/identity/prove", {
      params: { path: { org_id: orgId } },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   *
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async oidcProveIdentity(oidcToken: string, orgId: string): Promise<IdentityProof> {
    const client = createClient<paths>({
      baseUrl: this.env.SignerApiRoot,
      headers: {
        Authorization: oidcToken,
      },
    });
    const resp = await client.post("/v0/org/{org_id}/identity/prove/oidc", {
      params: { path: { org_id: orgId } },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Checks if a given identity proof is valid.
   *
   * @param {string} orgId The id of the organization that the user is in.
   * @param {IdentityProof} identityProof The proof of authentication.
   */
  async verifyIdentity(orgId: string, identityProof: IdentityProof) {
    const resp = await (
      await this.management()
    ).post("/v0/org/{org_id}/identity/verify", {
      params: { path: { org_id: orgId } },
      body: identityProof,
      parseAs: "json",
    });
    assertOk(resp);
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @param {List<string>} scopes The scopes of the resulting session
   * @param {RatchetConfig} lifetimes Lifetimes of the new session.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
   * @return {Promise<SignResponse<OidcAuthResponse>>} The session data.
   */
  async oidcLogin(
    oidcToken: string,
    orgId: string,
    scopes: Array<string>,
    lifetimes?: RatchetConfig,
    mfaReceipt?: MfaReceipt,
  ): Promise<SignResponse<OidcAuthResponse>> {
    const client = createClient<paths>({
      baseUrl: this.env.SignerApiRoot,
      headers: {
        Authorization: oidcToken,
      },
    });
    const loginFn = async (headers?: HeadersInit) => {
      const resp = await client.post("/v0/org/{org_id}/oidc", {
        params: { path: { org_id: orgId } },
        headers,
        body: {
          scopes,
          tokens: lifetimes,
        },
        parseAs: "json",
      });
      return assertOk(resp);
    };

    const h1 = mfaReceipt ? SignResponse.getMfaHeaders(mfaReceipt) : undefined;
    return new SignResponse(loginFn, await loginFn(h1));
  }
}

/** MFA receipt */
export interface MfaReceipt {
  /** MFA request ID */
  mfaId: string;
  /** Corresponding org ID */
  mfaOrgId: string;
  /** MFA confirmation code */
  mfaConf: string;
}

/** Organizations */
export * from "./org";
/** Keys */
export * from "./key";
/** Roles */
export * from "./role";
/** Env */
export * from "./env";
/** Sessions */
export * from "./signer_session";
/** Session storage */
export * from "./session/session_storage";
/** Session manager */
export * from "./session/session_manager";
/** Management session manager */
export * from "./session/cognito_manager";
/** Signer session manager */
export * from "./session/signer_session_manager";
/** Export ethers.js Signer */
export * as ethers from "./ethers";
