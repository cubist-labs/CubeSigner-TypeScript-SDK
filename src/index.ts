import { envs, EnvInterface } from "./env";
import { Client, CubeSignerClient, OidcClient } from "./client";
import { Org } from "./org";
import { JsonFileSessionStorage } from "./session/session_storage";

import { SignerSessionStorage, SignerSessionManager } from "./session/signer_session_manager";
import { CubeSignerResponse, SignerSession } from "./signer_session";
import { CognitoSessionManager, CognitoSessionStorage } from "./session/cognito_manager";
import { configDir } from "./util";
import * as path from "path";
import { MfaReceipt } from "./mfa";
import {
  IdentityProof,
  MfaRequestInfo,
  OidcAuthResponse,
  RatchetConfig,
  UserInfo,
} from "./schema_types";

/** CubeSigner constructor options */
export interface CubeSignerOptions {
  /** The environment to use */
  env?: EnvInterface;
  /** The management authorization token */
  sessionMgr?: CognitoSessionManager | SignerSessionManager;
  /** Optional organization id */
  orgId?: string;
}

/**
 * CubeSigner client
 *
 * @deprecated Use {@link CubeSignerClient} instead.
 */
export class CubeSigner {
  readonly #env: EnvInterface;
  readonly sessionMgr?: CognitoSessionManager | SignerSessionManager;
  #csc: CubeSignerClient;

  /** @return {EnvInterface} The CubeSigner environment of this client */
  get env(): EnvInterface {
    return this.#env;
  }

  /** Organization ID */
  get orgId() {
    return this.#csc.orgId;
  }

  /**
   * Set the organization ID
   * @param {string} orgId The new organization id.
   */
  setOrgId(orgId: string) {
    this.#csc = this.#csc.withOrg(orgId);
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
   * @param {CubeSignerOptions} options The optional configuration options for the CubeSigner instance.
   */
  constructor(options?: CubeSignerOptions) {
    let env = options?.env;
    if (options?.sessionMgr) {
      this.sessionMgr = options.sessionMgr;
      env = env ?? this.sessionMgr.env;
    }
    this.#env = env ?? envs["gamma"];
    this.#csc = new CubeSignerClient(
      // HACK: ignore that sessionMgr may be a CognitoSessionManager and pretend that it
      //       is a SignerSessionManager; that's fine because the CubeSignerClient will
      //       almost always just call `await token()` on it, which works in both cases.
      //
      // This is done here for backward compatibility reasons only; in the future,
      // we should deprecate this class and people should start using `CubeSingerClient` directly.
      options?.sessionMgr as unknown as SignerSessionManager,
      options?.orgId,
    );
  }

  /**
   * Authenticate an OIDC user and create a new session manager for them.
   *
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

  /**
   * Retrieves information about the current user.
   *
   * @return {Promise<UserInfo>} User information.
   */
  async aboutMe(): Promise<UserInfo> {
    return await this.#csc.userGet();
  }

  /**
   * Retrieves existing MFA request.
   *
   * @param {string} orgId Organization ID
   * @param {string} mfaId MFA request ID
   * @return {Promise<MfaRequestInfo>} MFA request information
   */
  async mfaGet(orgId: string, mfaId: string): Promise<MfaRequestInfo> {
    return await this.#csc.withOrg(orgId).mfaGet(mfaId);
  }

  /**
   * List pending MFA requests accessible to the current user.
   * @param {string} orgId Organization ID
   * @return {Promise<MfaRequestInfo[]>} The MFA requests.
   */
  async mfaList(orgId: string): Promise<MfaRequestInfo[]> {
    return await this.#csc.withOrg(orgId).mfaList();
  }

  /**
   * Approve a pending MFA request.
   *
   * @param {string} orgId The org id of the MFA request
   * @param {string} mfaId The id of the MFA request
   * @return {Promise<MfaRequestInfo>} The result of the MFA request
   */
  async mfaApprove(orgId: string, mfaId: string): Promise<MfaRequestInfo> {
    return await this.#csc.withOrg(orgId).mfaApprove(mfaId);
  }

  /** Initiate adding a new FIDO device. MFA may be required. */
  get addFidoStart() {
    return this.#csc.userRegisterFidoInit.bind(this.#csc);
  }

  /** Complete a previously initiated request to add a new FIDO device. */
  get addFidoComplete() {
    return this.#csc.userRegisterFidoComplete.bind(this.#csc);
  }

  /**
   * Creates a request to change user's TOTP. This request returns a new TOTP challenge
   * that must be answered by calling `resetTotpComplete`
   */
  get resetTotpStart() {
    return this.#csc.userResetTotpInit.bind(this.#csc);
  }

  /**
   * Answer the TOTP challenge issued by `resetTotpStart`. If successful, user's
   * TOTP configuration will be updated to that of the TOTP challenge.he TOTP configuration from the challenge.
   */
  get resetTotpComplete() {
    return this.#csc.userResetTotpComplete.bind(this.#csc);
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   */
  get verifyTotp() {
    return this.#csc.userVerifyTotp.bind(this.#csc);
  }

  /** Retrieves information about an organization.
   * @param {string} orgId The ID or name of the organization.
   * @return {Org} The organization.
   * */
  async getOrg(orgId?: string): Promise<Org> {
    const orgInfo = await this.#csc.withOrg(orgId).orgGet();
    return new Org(this.#csc, orgInfo);
  }

  /**
   * Deletes a given key.
   * @param {string} orgId - Organization id
   * @param {string} keyId - Key id
   */
  async deleteKey(orgId: string, keyId: string) {
    await this.#csc.withOrg(orgId).keyDelete(keyId);
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
    return await this.#csc.withOrg(orgId).identityProve();
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   *
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async oidcProveIdentity(oidcToken: string, orgId: string): Promise<IdentityProof> {
    const oidcClient = new OidcClient(this.#env, orgId, oidcToken);
    return await oidcClient.identityProve();
  }

  /**
   * Checks if a given identity proof is valid.
   *
   * @param {string} orgId The id of the organization that the user is in.
   * @param {IdentityProof} identityProof The proof of authentication.
   */
  async verifyIdentity(orgId: string, identityProof: IdentityProof) {
    await this.#csc.withOrg(orgId).identityVerify(identityProof);
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @param {List<string>} scopes The scopes of the resulting session
   * @param {RatchetConfig} lifetimes Lifetimes of the new session.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
   * @return {Promise<CubeSignerResponse<OidcAuthResponse>>} The session data.
   */
  async oidcLogin(
    oidcToken: string,
    orgId: string,
    scopes: Array<string>,
    lifetimes?: RatchetConfig,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<OidcAuthResponse>> {
    const oidcClient = new OidcClient(this.#env, orgId, oidcToken);
    return await oidcClient.sessionCreate(scopes, lifetimes, mfaReceipt);
  }
}

/** Client */
export * from "./client";
/** Organizations */
export * from "./org";
/** Keys */
export * from "./key";
/** Roles */
export * from "./role";
/** Env */
export * from "./env";
/** Fido */
export * from "./mfa";
/** Pagination */
export * from "./paginator";
/** Types */
export * from "./schema_types";
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
