import {
  CubeSignerClient,
  parseSessionLike,
  Secp256k1,
  type IdentityProof,
} from "@cubist-labs/cubesigner-sdk";
import type { RequestHandler } from "express";
import { config } from "dotenv";

// Load the environment variables
config();

/**
 * A route handler implementing steps 5-7 of the registration flow.
 * Accepts a POST request with an identity proof, and creates a user in the organization.
 *
 * @param req The request object
 * @param res The response object
 */
export default (async (req, res) => {
  const session = parseSessionLike(process.env.BACKEND_SESSION!);
  const client = await CubeSignerClient.create(session);

  // Step 5: Receive the identity proof from the frontend
  const proof: IdentityProof = req.body.identity_proof;

  // Inspect the proof and decide whether to accept it
  // TODO: Implement your own validation logic here
  if (proof.email?.startsWith("spam")) {
    res.status(403).send("No spam allowed");
    return;
  }

  // Step 6 & Step 7
  // Create a user in the organization
  // If the proof is invalid, this will throw an error
  const userId = await client.org().createOidcUser(proof, proof.email);

  console.debug("Created user", userId);

  // Give the user a key
  const key = await client.org().createKey(Secp256k1.Evm, userId);

  console.debug(`Created key ${key.materialId} for user ${userId}`);

  res.status(200).send();
}) satisfies RequestHandler;
