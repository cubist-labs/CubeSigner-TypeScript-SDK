/* eslint-disable @typescript-eslint/no-explicit-any */

import * as cs from "@cubist-labs/cubesigner-sdk";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import express from "express";

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const LOGIN = `
<html>
  <body>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <div
      id="g_id_onload"
      data-client_id="${process.env["CLIENT_ID"]}"
      data-login_uri="http://localhost:3000/oauth2callback"
      data-ux_mode="redirect"
    ></div>
    <div
      class="g_id_signin"
      data-type="standard"
      data-size="large"
      data-theme="outline"
      data-text="sign_in_with"
      data-shape="rectangular"
      data-logo_alignment="left"
    ></div>
  </body>
</html>
`;

// Show login page
app.get("/", (_, res) => {
  res.send(LOGIN);
});

// Use OIDC token to sign a transaction
app.post("/oauth2callback", async (req, res) => {
  const oidcToken = req.body.credential;

  // Extract user identity from token
  const payload = JSON.parse(atob(oidcToken.split(".")[1]));
  const iss = payload.iss;
  const sub = payload.sub;

  // Create a management session
  let cubesigner: cs.CubeSigner;
  let orgIds: string[];
  try {
    cubesigner = await cs.CubeSigner.loadManagementSession();
    orgIds = (await cubesigner.aboutMe()).org_ids;
  } catch (e) {
    res.send(e);
    res.sendStatus(500);
    return;
  }
  if (orgIds.length != 1) {
    res.send(`User is a member of ${orgIds.length} orgs`);
    res.sendStatus(500);
    return;
  }

  const org = await cubesigner.getOrg(orgIds[0]);

  try {
    // Create OIDC user
    const userId = await org.createOicdUser(
      {
        iss,
        sub,
      },
      "Alien",
    );
    // Create a key for the OIDC user
    await org.createKey(cs.Secp256k1.Evm, userId);
  } catch (e) {
    // If the user failed to create, it already exists
    // TODO: Update this once there is a better way to check if an OIDC user exists
    console.log(e);
  }

  // Create a session for the OIDC user
  const signerSession = new cs.SignerSession(
    cubesigner,
    await new cs.CubeSigner({ env: cubesigner.env }).createOidcManager(
      oidcToken,
      org.id,
      ["sign:*"],
      new cs.MemorySessionStorage(),
    ),
    "",
  );
  // Just grab the first key for the OIDC user
  const key = (await signerSession.keys())[0];
  // Sign a simple transaction with the key
  const signReq = {
    chain_id: 1,
    tx: <any>{
      type: "0x00",
      gas: "0x61a80",
      gasPrice: "0x77359400",
      nonce: "0",
    },
  };
  const sig = await signerSession.signEvm(key.materialId, signReq);

  res.contentType("application/json");
  res.send(JSON.stringify(sig.data()));
});

app.listen(port);
