import { Client } from "../client";
import { EnvInterface } from "../env";
import { HasEnv, SessionManager } from "./session_manager";
import { SessionStorage } from "./session_storage";

/** JSON representation of our "management session" file format */
export interface CognitoSessionObject {
  /** The email address of the user */
  email: string;
  /** The ID token */
  id_token: string;
  /** The access token */
  access_token: string;
  /** The refresh token */
  refresh_token: string;
  /** The expiration time of the access token */
  expiration: string;
}

export interface CognitoSessionInfo extends CognitoSessionObject, HasEnv {}

/** Type of storage required for cognito (management) sessions */
export type CognitoSessionStorage = SessionStorage<CognitoSessionInfo>;

/** The session manager for cognito (management) sessions */
export class CognitoSessionManager extends SessionManager<CognitoSessionInfo> {
  #client: Client;

  /**
   * @return {string} The current auth token.
   * @internal
   */
  async token(): Promise<string> {
    const session = await this.storage.retrieve();
    return session.id_token;
  }

  /**
   * Returns a client with the current session and refreshes the current
   * session.
   */
  async client(): Promise<Client> {
    this.refreshIfNeeded();
    return this.#client;
  }

  /** Revokes the session. */
  async revoke(): Promise<void> {
    const idp = require("@aws-sdk/client-cognito-identity-provider"); // eslint-disable-line @typescript-eslint/no-var-requires
    const session = await this.storage.retrieve();
    const client = new idp.CognitoIdentityProviderClient({
      region: this.env.Region,
      signer: { sign: async (request: any) => request }, // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    const input = {
      Token: session.refresh_token,
      ClientId: this.env.ClientId,
    };
    await client.send(new idp.RevokeTokenCommand(input));
  }

  /**
   * Returns whether it's time to refresh this token.
   * @return {boolean} Whether it's time to refresh this token.
   * @internal
   */
  async isStale(): Promise<boolean> {
    const session = await this.storage.retrieve();
    return this.hasExpired(new Date(session.expiration).getTime());
  }

  /**
   * Refreshes the session and **UPDATES/MUTATES** self.
   */
  async refresh(): Promise<void> {
    const idp = require("@aws-sdk/client-cognito-identity-provider"); // eslint-disable-line @typescript-eslint/no-var-requires
    const session = await this.storage.retrieve();
    const client = new idp.CognitoIdentityProviderClient({ region: this.env.Region });
    const resp = await client.send(
      new idp.InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: {
          REFRESH_TOKEN: session.refresh_token,
        },
        ClientId: this.env.ClientId,
      }),
    );

    if (
      !resp.AuthenticationResult ||
      !resp.AuthenticationResult.ExpiresIn ||
      !resp.AuthenticationResult.IdToken
    ) {
      throw new Error("Refresh failed");
    }

    const expiresInMs = resp.AuthenticationResult.ExpiresIn * 1000;
    const expiration = new Date(new Date().getTime() + expiresInMs).toISOString();
    const idToken = resp.AuthenticationResult.IdToken;

    await this.storage.save(<CognitoSessionInfo>{
      ...session,
      id_token: idToken,
      access_token: resp.AuthenticationResult.AccessToken,
      expiration,
    });
    this.#client = this.createClient(idToken);
  }

  /**
   * Loads an existing cognito (management) session from storage.
   * @param {CognitoSessionStorage} storage The storage back end to use
   * @return {Promise<SingerSession>} New token
   */
  static async loadFromStorage(storage: CognitoSessionStorage): Promise<CognitoSessionManager> {
    const sessionInfo = await storage.retrieve();
    return new CognitoSessionManager(
      sessionInfo.env["Dev-CubeSignerStack"],
      sessionInfo.id_token,
      storage,
    );
  }

  /**
   * Constructor.
   * @param {EnvInterface} env The environment of the session
   * @param {string} token The current token of the session
   * @param {CognitoSessionStorage} storage The storage back end to use
   */
  private constructor(env: EnvInterface, token: string, storage: CognitoSessionStorage) {
    super(env, storage);
    this.#client = this.createClient(token);
  }
}
