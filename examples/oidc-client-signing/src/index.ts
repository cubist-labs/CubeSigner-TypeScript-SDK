/* eslint-disable @typescript-eslint/no-explicit-any */

import * as cs from "@cubist-labs/cubesigner-sdk";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import express from "express";
import { engine } from "express-handlebars";

dotenv.config();

const PORT = process.env["PORT"] ?? 3000;
const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];
const FACEBOOK_CLIENT_ID = process.env["FACEBOOK_CLIENT_ID"];
const ORG_ID = process.env["ORG_ID"]!;
const API_ROOT = process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev";
const app = express();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Render landing page
app.get("/", (_, res) => {
  res.render("index", {
    googleClientId: GOOGLE_CLIENT_ID,
    facebookClientId: FACEBOOK_CLIENT_ID,
    orgId: ORG_ID,
    apiRoot: API_ROOT,
  });
});

app.post("/createUser", async (req, res) => {
  try {
    // In practice we would require the OIDC token and validate it.
    // For this demo we just trust the client.
    const id = req.body;
    console.log(`Creating user ${id.email} with iss=${id.iss} and sub=${id.sub}`);
    await createUser(id);
    res.contentType("application/json").status(200).send();
  } catch (e) {
    console.error(`Failed to create user: ${e}`);
    res.contentType("application/json").status(500).send();
  }
});

app.listen(PORT);
console.log(`Listening on http://localhost:${PORT}`);

/**
 * Create a user with the given OIDC claims.
 * @param {cs.IdentityProof} proof The proof of identity
 */
async function createUser(proof: cs.IdentityProof) {
  // Create a management session
  console.log("Loading CubeSigner management session");
  console.log(`Using org ${ORG_ID}`);
  const cubesigner = await cs.CubeSigner.loadManagementSession();

  const org = await cubesigner.getOrg(ORG_ID);

  console.log("Verifying identity", proof);
  try {
    await org.verifyIdentity(proof);
    console.log("Verified");
  } catch (e) {
    console.log(`Not verified: ${e}`);
    throw e;
  }

  assert(proof.identity, "Identity should be set when proof is obtained using OIDC token");
  const iss = proof.identity!.iss;
  const sub = proof.identity!.sub;
  const email = proof.email;
  try {
    // Create OIDC user
    console.log(`Creating OIDC user ${email}`);
    const userId = await org.createOidcUser({ iss, sub }, email);
    console.log(`Creating key for user ${userId}...`);
    // Create a key for the OIDC user
    const key = await org.createKey(cs.Secp256k1.Evm, userId);
    console.log(`${await key.type()} key created ${key.materialId}`);
  } catch (e) {
    // if error has "User already exists"
    if (!/User already exists/.test(`${e}`)) {
      console.log(`Failed to create OIDC user: ${e}`);
      throw e;
    } else {
      console.log(`User ${email} already exists`);
    }
  }
}
