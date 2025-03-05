import { ApiClient } from "./client/api_client";
import type { IdentityProof, RatchetConfig, EmailOtpResponse } from "./schema_types";

// used in doc comments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
   * @returns The underlying API client. This client provides direct API access without convenience wrappers.
   */
  get apiClient() {
    return this.#apiClient;
  }

  /**
   * @returns The environment.
   */
  get env() {
    return this.#apiClient.env;
  }

  /**
   * @returns The org ID of the client.
   */
  get orgId() {
    return this.#apiClient.sessionMeta.org_id;
  }

  /**
   * Constructor.
   *
   * @param apiClient The API client to use.
   */
  constructor(apiClient: ApiClient) {
    this.#apiClient = apiClient;
  }

  /**
   * Construct a client with a session or session manager
   *
   * @param session The session (object or base64 string) or manager that will back this client
   * @returns A Client
   */
  static async create(session: string | SessionManager | SessionData): Promise<CubeSignerClient> {
    return new CubeSignerClient(await ApiClient.create(session));
  }

  /**
   * Get the org associated with this session.
   *
   * @returns The org
   */
  org(): Org {
    return new Org(this.#apiClient, this.orgId);
  }

  /**
   * Get information about an org.
   *
   * @param orgId The ID or name of the org
   * @returns CubeSigner client for the requested org.
   */
  getOrg(orgId: string): Org {
    return new Org(this.#apiClient, orgId);
  }

  /**
   * Obtain information about the current user.
   *
   * Same as {@link ApiClient.userGet}, see its documentation for more details.
   *
   * @returns A function that resolves to the current user's information
   */
  get user() {
    return this.#apiClient.userGet.bind(this.#apiClient);
  }

  /**
   * Get all keys accessible to the current session
   *
   * NOTE: this may be a subset from the keys in the current org.
   *
   * @returns The keys that a client can access
   */
  async sessionKeys(): Promise<Key[]> {
    return await this.#apiClient
      .keysList()
      .fetchAll()
      .then((keyInfos) => keyInfos.map((keyInfo) => new Key(this.#apiClient, keyInfo)));
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   *
   * @param env The environment to log into
   * @param orgId The org to log into.
   * @param token The OIDC token to exchange
   * @param scopes The scopes for the new session
   * @param lifetimes Lifetimes of the new session.
   * @param mfaReceipt Optional MFA receipt(s)
   * @param purpose Optional session description.
   * @returns The session data.
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
   * @param env The environment to log into
   * @param orgId The org id in which to generate proof
   * @param token The oidc token
   * @returns Proof of authentication
   */
  static async proveOidcIdentity(
    env: EnvInterface,
    orgId: string,
    token: string,
  ): Promise<IdentityProof> {
    return await ApiClient.identityProveOidc(env, orgId, token);
  }

  /**
   * Initiates login via Email OTP.
   * Returns an unsigned OIDC token and sends an email to the user containing the signature of that token.
   * The OIDC token can be reconstructed by appending the signature to the partial token like so:
   *
   * token = partial_token + signature
   *
   * @param env The environment to use
   * @param orgId The org to login to
   * @param email The email to send the signature to
   * @returns The partial OIDC token that must be combined with the signature in the email
   */
  static async initEmailOtpAuth(
    env: EnvInterface,
    orgId: string,
    email: string,
  ): Promise<EmailOtpResponse> {
    return await ApiClient.initEmailOtpAuth(env, orgId, email);
  }

  /**
   * Creates a request to add a new FIDO device.
   *
   * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
   *
   * MFA may be required.
   *
   * Same as {@link ApiClient.userFidoRegisterInit}, see its documentation for more details.
   *
   * @returns A function that resolves to an AddFidoChallenge
   */
  get addFido() {
    return this.#apiClient.userFidoRegisterInit.bind(this.#apiClient);
  }

  /**
   * Delete a FIDO key from the user's account.
   * Allowed only if TOTP is also defined.
   * MFA via TOTP is always required.
   *
   * Same as {@link ApiClient.userFidoDelete}, see its documentation for more details.
   *
   * @returns A function that deletes a FIDO key
   */
  get deleteFido() {
    return this.#apiClient.userFidoDelete.bind(this.#apiClient);
  }

  /**
   * Create a reference to an existing TOTP challenge.
   *
   * @param totpId The ID of the challenge
   * @returns The TOTP challenge
   */
  getTotpChallenge(totpId: string): TotpChallenge {
    return new TotpChallenge(this.#apiClient, totpId);
  }

  /**
   * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
   * that must be answered by calling {@link TotpChallenge.answer}.
   *
   * Same as {@link ApiClient.userTotpResetInit}, see its documentation for more details.
   *
   * @returns A function that resolves to a TOTP challenge
   */
  get resetTotp() {
    return this.#apiClient.userTotpResetInit.bind(this.#apiClient);
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   *
   * Same as {@link ApiClient.userTotpVerify}, see its documentation for more details.
   *
   * @returns A function that verifies the TOTP code, throwing if not valid
   */
  get verifyTotp() {
    return this.#apiClient.userTotpVerify.bind(this.#apiClient);
  }

  /**
   * Delete TOTP from the user's account.
   * Allowed only if at least one FIDO key is registered with the user's account.
   * MFA via FIDO is always required.
   *
   * Same as {@link ApiClient.userTotpDelete}, see its documentation for more details.
   *
   * @returns A function that deletes TOTP from the user
   */
  get deleteTotp() {
    return this.#apiClient.userTotpDelete.bind(this.#apiClient);
  }

  /**
   * Add a listener for an event
   *
   * Same as {@link ApiClient.addEventListener}, see its documentation for more details.
   *
   * @returns A function that resolves to the ApiClient with the new listener
   */
  get addEventListener() {
    return this.#apiClient.addEventListener.bind(this.#apiClient);
  }

  /**
   * Remove a listener for an event
   *
   * Same as {@link ApiClient.removeEventListener}, see its documentation for more details.
   *
   * @returns A function that resolves to the ApiClient with a removed listener
   */
  get removeEventListener() {
    return this.#apiClient.removeEventListener.bind(this.#apiClient);
  }

  /**
   * Revoke this session.
   */
  async revokeSession(): Promise<void> {
    await this.#apiClient.sessionRevoke();
  }
}
