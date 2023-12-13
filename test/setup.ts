import path from "path";
import {
  CognitoSessionInfo,
  CognitoSessionManager,
  CubeSignerClient,
  JsonFileSessionStorage,
  MemorySessionStorage,
  OidcClient,
  SignerSessionManager,
} from "../src";
import { configDir } from "../src/util";
import { expect } from "chai";

/**
 * Create a new CubeSignerClient instance.
 * @param {string[]} scopes The scopes to acquire for the new CubeSigner session.
 * @return {CubeSignerClient} A new CubeSignerClient instance.
 */
export async function newCubeSigner(scopes?: string[]): Promise<CubeSignerClient> {
  scopes ??= ["manage:*"];
  const cognitoManager = await loadCognitoSession();
  const cognitoSessionInfo = await cognitoManager.storage.retrieve();
  const env = cognitoSessionInfo.env["Dev-CubeSignerStack"];
  expect(env).to.exist;

  console.log(`Converting Cognito to signer ${JSON.stringify(scopes)} session`);
  const oidcClient = new OidcClient(env, cognitoSessionInfo.org_id, cognitoSessionInfo.id_token);
  const resp = await oidcClient.sessionCreate(scopes);
  expect(resp.requiresMfa()).to.eq(false);

  const sessionData = resp.data();
  const mgr = await SignerSessionManager.loadFromStorage(new MemorySessionStorage(sessionData));
  return new CubeSignerClient(mgr);
}

/**
 * Load the Cognito session from the default file and return a session manager for it.
 * @return {Promise<CognitoSessionManager>} Cognito session manager
 */
export async function loadCognitoSession(): Promise<CognitoSessionManager> {
  const defaultFilePath = path.join(configDir(), "management-session.json");
  const fileStorage = new JsonFileSessionStorage<CognitoSessionInfo>(defaultFilePath);
  const json = await fileStorage.retrieve();
  expect(json.env).to.exist;
  expect(json.org_id).to.exist;
  expect(json.id_token).to.exist;
  const env = json.env["Dev-CubeSignerStack"];
  expect(env).to.exist;
  return await CognitoSessionManager.loadFromStorage(fileStorage);
}

/**
 * Load the Cognito session's OIDC token from the default file on disk.
 * @return {Promise<string>} Cognito OIDC token.
 */
export async function loadCognitoOidcToken(): Promise<string> {
  const cognitoMgr = await loadCognitoSession();
  return await cognitoMgr.token();
}
