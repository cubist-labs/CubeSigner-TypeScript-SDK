import {
  CubeSignerClient,
  type IdentityProof,
  Secp256k1,
} from "@cubist-labs/cubesigner-sdk";
import { defaultManagementSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as dotenv from "dotenv";
import express from "express";
import { engine } from "express-handlebars";
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
    // Get CubeSigner org
    const org = req.client.org();

    // Get the proof from the request
    const proof: IdentityProof = req.body as IdentityProof;

    // Get the user info from the proof
    const { email, user_info } = proof;
    const name = proof.preferred_username;

    // If user does NOT exist, create it
    if (!user_info?.user_id) {
      // create user
      const userId = await org.createOidcUser(proof, email, { name });
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
