/* eslint-disable @typescript-eslint/no-explicit-any */

import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import express from "express";
import { engine } from "express-handlebars";

dotenv.config();

const PORT = process.env["PORT"] ?? 3000;
const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];
const TWITTER_CLIENT_ID = process.env["TWITTER_CLIENT_ID"];
const FACEBOOK_CLIENT_ID = process.env["FACEBOOK_CLIENT_ID"];
const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"];
const ORG_ID = process.env["ORG_ID"]!;
const API_ROOT = process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev";
const TWITTER_COOKIE_NAME = "twitterCookie";

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
    twitterClientId: TWITTER_CLIENT_ID,
    twitterCookieName: TWITTER_COOKIE_NAME,
    facebookClientId: FACEBOOK_CLIENT_ID,
    discordClientId: DISCORD_CLIENT_ID,
    orgId: ORG_ID,
    apiRoot: API_ROOT,
    port: PORT,
  });
});

app.get("/oauthCallback", (_, res) => {
  res.render("oauthCallback")
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

  const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager())

  const email = proof.email;
  const name = proof.preferred_username;

  if (email === undefined || email === null) {
    throw new Error("Email is required");
  }

  // If user does not exist, create it
  if (!proof.user_info?.user_id) {
    console.log(`Creating OIDC user ${email}`);
    const org = client.org();
    const userId = await org.createOidcUser(proof, email, {
      name,
      mfaPolicy: {
        num_auth_factors: 1,
        allowed_mfa_types: ["Fido"],
        lifetime: 600,
      },
    });
    console.log(`Creating key for user ${userId}...`);
    // Create a key for the OIDC user
    const key = await org.createKey(cs.Secp256k1.Evm, userId);
    console.log(`${await key.type()} key created ${key.materialId}`);
  } else {
    console.log(`User ${proof.user_info.user_id} already exists for ${email}`);
  }
}
