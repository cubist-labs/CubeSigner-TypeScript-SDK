import { promises as fs } from "fs";
import { CubeSignerClient } from "../src";
import { configDir, pathJoin } from "../src/util";
import { expect } from "chai";

/**
 * Create a new CubeSignerClient instance.
 * @return {CubeSignerClient} A new CubeSignerClient instance.
 */
export async function newCubeSigner(): Promise<CubeSignerClient> {
  return await CubeSignerClient.loadManagementSession();
}

/**
 * Load the Cognito session's OIDC token from the default file on disk.
 * @return {Promise<string>} Cognito OIDC token.
 */
export async function loadCognitoOidcToken(): Promise<string> {
  const defaultFilePath = pathJoin(configDir(), "cognito-session.json");
  const json = JSON.parse(await fs.readFile(defaultFilePath, "utf-8"));
  expect(json.id_token).to.exist;
  return json.id_token;
}
