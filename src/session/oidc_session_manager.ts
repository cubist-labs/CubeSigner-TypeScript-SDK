import { paths, Client } from "../client";
import { EnvInterface } from "..";
import { assertOk } from "../util";
import { OrgSessionManager } from "./session_manager";
import { SessionStorage } from "./session_storage";
import createClient from "openapi-fetch";

// An token obtained from an OIDC token is valid for 5 minutes
const OIDC_TOKEN_EXP_SECS = 300;

type OidcAuthResponse =
  paths["/v0/org/{org_id}/oidc"]["post"]["responses"]["200"]["content"]["application/json"];

/** JSON representation of the OIDC token */
export interface OidcSessionData {
  /** The environment that this token is for */
  env: EnvInterface;
  /** The organization ID */
  org_id: string;
  /** The OIDC token that this session was created from */
  oidc_token: string;
  /** The token to include in Authorization header */
  token: string;
  /** Token expiration timestamp */
  token_exp: number;
  /** The scopes of the token */
  scopes: Array<string>;
}

/** Type of storage required for OIDC sessions */
export type OidcSessionStorage = SessionStorage<OidcSessionData>;

/** Manager for OIDC sessions. */
export class OidcSessionManager extends OrgSessionManager<OidcSessionData> {
  #client: Client;

  /**
   * @return {string} The current auth token.
   * @internal
   */
  async token(): Promise<string> {
    const session = await this.storage.retrieve();
    return session.token;
  }

  /**
   * Returns a client with the current session and refreshes the current
   * session. May **UPDATE/MUTATE** self.
   */
  async client(): Promise<Client> {
    await this.refreshIfNeeded();
    return this.#client;
  }

  /** Revokes the session. */
  async revoke(): Promise<void> {
    this.unsupported("revoke");
  }

  /**
   * Refreshes the session and **UPDATES/MUTATES** self.
   */
  async refresh(): Promise<void> {
    const session = await this.storage.retrieve();
    const [token, tokenExp] = await OidcSessionManager.#exchangeToken(
      session.env,
      session.oidc_token,
      session.org_id,
      session.scopes,
    );
    await this.storage.save(<OidcSessionData>{
      ...session,
      token: token,
      token_exp: tokenExp,
    });
    this.#client = this.createClient(token);
  }

  /**
   * Returns whether it's time to refresh this token.
   * @return {boolean} Whether it's time to refresh this token.
   * @internal
   */
  async isStale(): Promise<boolean> {
    const session = await this.storage.retrieve();
    return this.hasExpired(session.token_exp);
  }

  /**
   * Refreshes the session if it is about to expire.
   * @return {boolean} Whether the session token was refreshed.
   * @internal
   */
  async refreshIfNeeded(): Promise<boolean> {
    if (await this.isStale()) {
      await this.refresh();
      return true;
    }
    return false;
  }

  /**
   * Authenticate an OIDC user and create a new session for them.
   * @param {EnvInterface} env The environment of the session
   * @param {SessionStorage<SignerSessionObject>} storage The signer session storage
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @param {List<string>} scopes The scopes of the resulting session
   * @return {Promise<OidcSessionManager>} The signer session
   */
  static async create(
    env: EnvInterface,
    storage: SessionStorage<OidcSessionData>,
    oidcToken: string,
    orgId: string,
    scopes: Array<string>,
  ): Promise<OidcSessionManager> {
    const [token, tokenExp] = await OidcSessionManager.#exchangeToken(
      env,
      oidcToken,
      orgId,
      scopes,
    );
    await storage.save(<OidcSessionData>{
      env,
      org_id: orgId,
      oidc_token: oidcToken,
      token,
      token_exp: tokenExp,
      scopes,
    });
    return new OidcSessionManager(env, orgId, token, storage);
  }

  /**
   * Load from storage
   * @param {OidcSessionStorage} storage The storage to load from
   * @return {Promise<OidcSessionManager>} New OIDC session manager
   */
  static async loadFromStorage(storage: OidcSessionStorage): Promise<OidcSessionManager> {
    const info = await storage.retrieve();
    return new OidcSessionManager(info.env, info.org_id, info.token, storage);
  }

  /**
   * Constructor.
   * @param {EnvInterface} env The environment of the session
   * @param {string} orgId The id of the org associated with this session
   * @param {string} token The authorization token to use
   * @param {SessionStorage<U>} storage The storage back end to use for storing
   *                                    session information
   */
  private constructor(
    env: EnvInterface,
    orgId: string,
    token: string,
    storage: SessionStorage<OidcSessionData>,
  ) {
    super(env, orgId, storage);
    this.#client = this.createClient(token);
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   * @param {EnvInterface} env The CubeSigner environment
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @param {List<string>} scopes The scopes of the resulting session
   * @return {Promise<[string, number]>} The session token and its expiration time
   */
  static async #exchangeToken(
    env: EnvInterface,
    oidcToken: string,
    orgId: string,
    scopes: Array<string>,
  ): Promise<[string, number]> {
    const client = createClient<paths>({
      baseUrl: env.SignerApiRoot,
      headers: {
        Authorization: oidcToken,
      },
    });
    const resp = await client.post("/v0/org/{org_id}/oidc", {
      params: { path: { org_id: orgId } },
      body: {
        scopes,
      },
      parseAs: "json",
    });
    const data = assertOk(resp) as OidcAuthResponse;
    return [data.token, new Date().getTime() / 1000 + OIDC_TOKEN_EXP_SECS];
  }
}
