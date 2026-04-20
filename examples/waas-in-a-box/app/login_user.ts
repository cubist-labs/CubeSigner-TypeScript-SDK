import { CUBESIGNER_ENV, ORG_ID } from "./env.js";
import { CubeSignerClient, type SessionData } from "@cubist-labs/cubesigner-sdk";
import type { OidcToken } from "./oauth.js";

/**
 * Implements the LoginFlow steps 3-4
 *
 * @param idToken The ID token from the OIDC provider
 * @returns A session for the logged-in user
 */
export async function loginUser(idToken: OidcToken): Promise<SessionData> {
  // Create a session, requesting only the scopes we need for this application
  const response = await CubeSignerClient.createOidcSession(CUBESIGNER_ENV, ORG_ID, idToken, [
    "manage:readonly", // for listing keys
    "sign:evm:tx", // for signing the test transaction
  ]);

  if (response.requiresMfa()) {
    throw new Error("This example does not include MFA");
  }

  return response.data();
}
