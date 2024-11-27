import { ApiClient } from "./client/api_client";
import type { IdentityProof, RatchetConfig } from "./schema_types";

// used in doc comments
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { AddFidoChallenge, TotpChallenge } from "./mfa";
import { Org } from "./org";
import type {
  CubeSignerResponse,
  EnvInterface,
  MfaReceipts,
  Scope,
  SessionData,
  SessionManager,
} from ".";
import { Key } from ".";

/** Options for logging in with OIDC token */
export interface OidcAuthOptions {
  /** Optional token lifetimes */
  lifetimes?: RatchetConfig;
  /** Optional MFA receipt(s) */
  mfaReceipt?: MfaReceipts;
}

/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export class CubeSignerClient {
  readonly #apiClient: ApiClient;

  /**
   * Get the underlying API client. This client provides direct API access without convenience wrappers.
   */
  get apiClient() {
    return this.#apiClient;
  }

  /**
   * Get the environment.
   */
  get env() {
    return this.#apiClient.env;
  }

  /**
   * Get the org ID of the client.
   */
  get orgId() {
    return this.#apiClient.sessionMeta.org_id;
  }

  /**
   * Constructor.
   *
   * @param {ApiClient} apiClient The API client to use.
   */
  constructor(apiClient: ApiClient) {
    this.#apiClient = apiClient;
  }

  /**
   * Construct a client with a session or session manager
   * @param {SessionManager | SessionData | string} session The session (object or base64 string)
   *   or manager that will back this client
   * @return {CubeSignerClient} A Client
   */
  static async create(session: string | SessionManager | SessionData): Promise<CubeSignerClient> {
    return new CubeSignerClient(await ApiClient.create(session));
  }

  /**
   * Get the org associated with this session.
   *
   * @return {Org} The org
   */
  org(): Org {
    return new Org(this.#apiClient, this.orgId);
  }

  /**
   * Get information about an org.
   *
   * @param {string} orgId The ID or name of the org
   * @return {Promise<OrgInfo>} CubeSigner client for the requested org.
   */
  getOrg(orgId: string): Org {
    return new Org(this.#apiClient, orgId);
  }

  /**
   * Obtain information about the current user.
   *
   * Same as {@link ApiClient.userGet}
   */
  get user() {
    return this.#apiClient.userGet.bind(this.#apiClient);
  }

  /**
   * Get all keys accessible to the current session
   *
   * NOTE: this may be a subset from the keys in the current org.
   *
   * @return {Promise<Key[]>} The keys that a client can access
   */
  async sessionKeys(): Promise<Key[]> {
    return await this.#apiClient
      .sessionKeysList()
      .then((keyInfos) => keyInfos.map((keyInfo) => new Key(this.#apiClient, keyInfo)));
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   *
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The org to log into.
   * @param {string} token The OIDC token to exchange
   * @param {List<Scope>} scopes The scopes for the new session
   * @param {RatchetConfig} lifetimes Lifetimes of the new session.
   * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
   * @param {string} purpose Optional session description.
   * @return {Promise<SessionData>} The session data.
   */
  static async createOidcSession(
    env: EnvInterface,
    orgId: string,
    token: string,
    scopes: Array<Scope>,
    lifetimes?: RatchetConfig,
    mfaReceipt?: MfaReceipts,
    purpose?: string,
  ): Promise<CubeSignerResponse<SessionData>> {
    return await ApiClient.oidcSessionCreate(
      env,
      orgId,
      token,
      scopes,
      lifetimes,
      mfaReceipt,
      purpose,
    );
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   *
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The org id in which to generate proof
   * @param {string} token The oidc token
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  static async proveOidcIdentity(
    env: EnvInterface,
    orgId: string,
    token: string,
  ): Promise<IdentityProof> {
    return await ApiClient.identityProveOidc(env, orgId, token);
  }

  /**
   * Creates a request to add a new FIDO device.
   *
   * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
   *
   * MFA may be required.
   *
   * Same as {@link ApiClient.userFidoRegisterInit}
   */
  get addFido() {
    return this.#apiClient.userFidoRegisterInit.bind(this.#apiClient);
  }

  /**
   * Delete a FIDO key from the user's account.
   * Allowed only if TOTP is also defined.
   * MFA via TOTP is always required.
   *
   * Same as {@link ApiClient.userFidoDelete}
   */
  get deleteFido() {
    return this.#apiClient.userFidoDelete.bind(this.#apiClient);
  }

  /**
   * Create a reference to an existing TOTP challenge.
   *
   * @param {string} totpId The ID of the challenge
   * @return {TotpChallenge} The TOTP challenge
   */
  getTotpChallenge(totpId: string): TotpChallenge {
    return new TotpChallenge(this.#apiClient, totpId);
  }

  /**
   * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
   * that must be answered by calling {@link TotpChallenge.answer}.
   *
   * Same as {@link ApiClient.userTotpResetInit}
   */
  get resetTotp() {
    return this.#apiClient.userTotpResetInit.bind(this.#apiClient);
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   *
   * Same as {@link ApiClient.userTotpVerify}
   */
  get verifyTotp() {
    return this.#apiClient.userTotpVerify.bind(this.#apiClient);
  }

  /**
   * Delete TOTP from the user's account.
   * Allowed only if at least one FIDO key is registered with the user's account.
   * MFA via FIDO is always required.
   *
   * Same as {@link ApiClient.userTotpDelete}.
   */
  get deleteTotp() {
    return this.#apiClient.userTotpDelete.bind(this.#apiClient);
  }

  /**
   * Add a listener for an event
   *
   * Same as {@link ApiClient.addEventListener}.
   */
  get addEventListener() {
    return this.#apiClient.addEventListener.bind(this.#apiClient);
  }

  /**
   * Remove a listener for an event
   *
   * Same as {@link ApiClient.removeEventListener}.
   */
  get removeEventListener() {
    return this.#apiClient.removeEventListener.bind(this.#apiClient);
  }

  /**
   * Revoke this session.
   */
  async revokeSession(): Promise<void> {
    return await this.#apiClient.sessionRevoke();
  }
}
