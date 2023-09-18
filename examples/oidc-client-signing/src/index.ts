/* eslint-disable @typescript-eslint/no-explicit-any */

import * as cs from "@cubist-labs/cubesigner-sdk";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import express from "express";
import { engine } from "express-handlebars";

dotenv.config();

const PORT = process.env["PORT"] ?? 3000;
const CLIENT_ID = process.env["CLIENT_ID"];
const ORG_ID = process.env["ORG_ID"]!;

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
    clientId: CLIENT_ID,
    orgId: ORG_ID,
  });
});

app.post("/createUser", async (req, res) => {
  try {
    // In practice we would require the OIDC token and validate it.
    // For this demo we just trust the client.
    const email = req.body.email;
    const iss = req.body.iss;
    const sub = req.body.sub;
    console.log(`Creating user ${email} with iss=${iss} and sub=${sub}`);
    await createUser(iss, sub);
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
 * @param {string} iss The OIDC issuer
 * @param {string} sub The OIDC subject
 */
async function createUser(iss: string, sub: string) {
  // Create a management session
  console.log("Loading CubeSigner management session");
  console.log(`Using org ${ORG_ID}`);
  const cubesigner = await cs.CubeSigner.loadManagementSession();

  const org = await cubesigner.getOrg(ORG_ID);

  try {
    // Create OIDC user
    console.log("Creating OIDC user...");
    const userId = await org.createOidcUser({ iss, sub }, "Alien");
    console.log(`Creating key for user ${userId}...`);
    // Create a key for the OIDC user
    await org.createKey(cs.Secp256k1.Evm, userId);
  } catch (e) {
    // if error has "User already exists"
    if (!/User already exists/.test(`${e}`)) {
      console.log(`Failed to create OIDC user: ${e}`);
      throw e;
    }
  }
}
