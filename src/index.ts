import { envs, EnvInterface } from "./env";
import { components, Client } from "./client";
import { Org } from "./org";
import { JsonFileSessionStorage, MemorySessionStorage } from "./session/session_storage";
import { SignerSessionStorage } from "./session/signer_session_manager";
import { SignerSession } from "./signer_session";
import {
  ManagementSessionManager,
  ManagementSessionStorage,
} from "./session/management_session_manager";
import { OidcSessionManager, OidcSessionStorage } from "./session/oidc_session_manager";
import { assertOk, configDir } from "./util";
import * as path from "path";

/** CubeSigner constructor options */
export interface CubeSignerOptions {
  /** The environment to use */
  env?: EnvInterface;
  /** The management authorization token */
  sessionMgr?: ManagementSessionManager | OidcSessionManager;
}

export type UserInfo = components["schemas"]["UserInfo"];
export type TotpInfo = components["responses"]["TotpInfo"]["content"]["application/json"];
export type ConfiguredMfa = components["schemas"]["ConfiguredMfa"];

/** CubeSigner client */
export class CubeSigner {
  readonly #env: EnvInterface;
  readonly sessionMgr?: ManagementSessionManager | OidcSessionManager;

  /** @return {EnvInterface} The CubeSigner environment of this client */
  get env(): EnvInterface {
    return this.#env;
  }

  /**
   * Loads an existing management session and creates a CubeSigner instance.
   * @param {ManagementSessionStorage} storage Optional session storage to load
   * the session from. If not specified, the management session from the config
   * directory will be loaded.
   * @return {Promise<CubeSigner>} New CubeSigner instance
   */
  static async loadManagementSession(storage?: ManagementSessionStorage): Promise<CubeSigner> {
    const defaultFilePath = path.join(configDir(), "management-session.json");
    const sessionMgr = await ManagementSessionManager.loadFromStorage(
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
    const env = (await sss.retrieve()).env["Dev-CubeSignerStack"];
    return await SignerSession.loadSignerSession(new CubeSigner({ env }), sss);
  }

  /**
   * Loads a signer session from OIDC storage
   * @param {OidcSessionStorage} storage The storage to load from
   * @return {Promise<SignerSession>} New signer session
   */
  static async loadOidcSession(storage: OidcSessionStorage): Promise<SignerSession> {
    const env = (await storage.retrieve()).env;
    return await SignerSession.loadOidcSession(new CubeSigner({ env }), storage);
  }

  /**
   * Create a new CubeSigner instance.
   * @param {CubeSignerOptions} options The options for the CubeSigner instance.
   */
  constructor(options: CubeSignerOptions) {
    let env = options.env;
    if (options.sessionMgr) {
      this.sessionMgr = options.sessionMgr;
      env = env ?? this.sessionMgr.env;
    }
    this.#env = env ?? envs["gamma"];
  }

  /**
   * Authenticate an OIDC user and create a new OIDC session manager for them.
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @param {List<string>} scopes The scopes of the resulting session
   * @param {OidcSessionStorage} storage The signer session storage
   * @return {Promise<OidcSessionManager>} The OIDC session manager
   */
  async createOidcManager(
    oidcToken: string,
    orgId: string,
    scopes: Array<string>,
    storage?: OidcSessionStorage,
  ): Promise<OidcSessionManager> {
    return await OidcSessionManager.create(
      this.env,
      storage || new MemorySessionStorage(),
      oidcToken,
      orgId,
      scopes,
    );
  }

  /**
   * Authenticate an OIDC user and create a new session for them.
   * @param {string} oidcToken The OIDC token
   * @param {string} orgId The id of the organization that the user is in
   * @param {List<string>} scopes The scopes of the resulting session
   * @param {OidcSessionStorage} storage The signer session storage
   * @return {Promise<SignerSession>} The signer session
   */
  async createOidcSession(
    oidcToken: string,
    orgId: string,
    scopes: Array<string>,
    storage?: OidcSessionStorage,
  ): Promise<SignerSession> {
    const mgr = await this.createOidcManager(oidcToken, orgId, scopes, storage);
    return await CubeSigner.loadOidcSession(mgr.storage);
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
   * Creates and sets a new TOTP configuration for the logged-in user,
   * overriding the existing one (if any).
   */
  async resetTotp(): Promise<TotpInfo> {
    const resp = await (
      await this.management()
    ).patch("/v0/totp", {
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   * @param {string} code Current TOTP code
   */
  async verifyTotp(code: string) {
    const resp = await (
      await this.management()
    ).get("/v0/totp/verify/{code}", {
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
export * from "./session/management_session_manager";
/** OIDC session manager */
export * from "./session/oidc_session_manager";
/** Signer session manager */
export * from "./session/signer_session_manager";
/** Export ethers.js Signer */
export * as ethers from "./ethers";
