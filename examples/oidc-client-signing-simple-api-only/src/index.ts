import {
  CubeSignerClient,
  type IdentityProof,
  Secp256k1,
} from "@cubist-labs/cubesigner-sdk";
import { defaultManagementSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as dotenv from "dotenv";
import express from "express";
import { engine } from "express-handlebars";
import assert from "assert";
import path from "path";

dotenv.config();
const PORT: number = parseInt(process.env.PORT ?? "3000");

const app = express();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

// Create CubeSigner client to use in the app. The scopes for this client should be:
// - manage:org:add:user
// - manage:key:create
app.use(async (req, _res, next) => {
  try {
    req.client = await CubeSignerClient.create(
      defaultManagementSessionManager()
    );
    next();
  } catch (error) {
    next(error);
  }
});

declare module "express-serve-static-core" {
  interface Request {
    client: CubeSignerClient;
  }
}

// Render landing page
app.get("/", (_, res) => {
  res.render("index", {
    layout: false,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    orgName: process.env.ORG_ID,
    rootUrl: process.env.CS_API_ROOT,
  });
});


// Create user and EVM key (for the user)
app.post("/createUser", async (req, res) => {
  try {
    // get CubeSigner org
    const org = req.client.org();

    // Verify proof (i.e., verify the integrity of the OIDC token)
    const proof: IdentityProof = req.body as IdentityProof;
    try {
      await org.verifyIdentity(proof);
    } catch (e) {
      res.contentType("application/json").status(400).send();
      return;
    }

    assert(
      proof.identity,
      "Identity should be set when proof is obtained using OIDC token"
    );

    // Get the identity and user info from the proof
    const { iss, sub } = proof.identity;
    const { email, preferred_username, user_info } = proof;

    // If user does NOT exist, create it
    if (!user_info?.user_id) {
      // create user
      const userId = await org.createOidcUser({ iss, sub }, email, {
        name: preferred_username,
      });
      // create key
      const key = await org.createKey(Secp256k1.Evm, userId);
      console.log(`${await key.type()} key created ${key.materialId}`);
    } else {
      console.log(`User ${user_info.user_id} already exists for ${email}`);
    }

    res.contentType("application/json").status(200).send();
  } catch (e) {
    console.error(`Failed to create user: ${e}`);
    res.contentType("application/json").status(500).send();
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Listening on http://localhost:${PORT}`);
});