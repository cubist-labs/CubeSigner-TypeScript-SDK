import { promises as fs } from "fs";
import { CubeSignerClient } from "@cubist-labs/cubesigner-sdk";
import { expect } from "chai";
import * as path from "path";
import { CONFIG_DIR, defaultManagementSessionManager } from "../src";

/**
 * Create a new CubeSignerClient instance.
 *
 * @returns A new CubeSignerClient instance.
 */
export async function newCubeSigner(): Promise<CubeSignerClient> {
  return await CubeSignerClient.create(defaultManagementSessionManager());
}

/**
 * Load the Cognito session's OIDC token from the default file on disk.
 *
 * @returns Cognito OIDC token.
 */
export async function loadCognitoOidcToken(): Promise<string> {
  const defaultFilePath = path.join(CONFIG_DIR, "cognito-session.json");
  const json = JSON.parse(await fs.readFile(defaultFilePath, "utf-8"));
  expect(json.id_token).to.exist;
  return json.id_token;
}
