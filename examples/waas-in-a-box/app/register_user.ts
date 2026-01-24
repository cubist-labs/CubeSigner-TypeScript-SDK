import { CubeSignerClient } from "@cubist-labs/cubesigner-sdk";
import type { OidcToken } from "./oauth.js";
import { CUBESIGNER_ENV, ORG_ID } from "./env.js";

/**
 * Registers a user in the organization by making a request to the backend.
 *
 * @param id_token The ID token from the OIDC provider
 */
export async function registerUser(id_token: OidcToken): Promise<void> {
  // Step 3
  // Step 4
  // Generate an identity proof
  const identity_proof = await CubeSignerClient.proveOidcIdentity(CUBESIGNER_ENV, ORG_ID, id_token);

  // Step 5
  // Pass the proof to the backend
  await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identity_proof }),
  });
}
