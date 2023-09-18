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
  try {
    const oidcToken = req.body.credential;

    // Extract user identity from token
    const payload = JSON.parse(atob(oidcToken.split(".")[1]));

    const iss = payload.iss;
    const sub = payload.sub;

    // Create a management session
    console.log("Loading CubeSigner management session");
    const cubesigner = await cs.CubeSigner.loadManagementSession();
    let user = await cubesigner.aboutMe();
    const orgIds = user.org_ids;

    if (orgIds.length != 1) {
      throw new Error(`User is a member of ${orgIds.length} orgs`);
    }

    const org = await cubesigner.getOrg(orgIds[0]);

    try {
      // Create OIDC user
      console.log("Creating OIDC user");
      const userId = await org.createOidcUser(
        {
          iss,
          sub,
          // TODO: setting 'disambiguator' (e.g., to payload["email"] will create an OIDC user that will never be able to log in)
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
    console.log("Logging in as OIDC user");
    const oidcCubeSigner = new cs.CubeSigner({
      sessionMgr: await cubesigner.createOidcManager(oidcToken, org.id, ["manage:*"]),
    });
    user = await oidcCubeSigner.aboutMe();
    const oidcSignerSession = new cs.SignerSession(
      cubesigner,
      await new cs.CubeSigner({ env: cubesigner.env }).createOidcManager(
        oidcToken,
        org.id,
        ["sign:*"],
        new cs.MemorySessionStorage(),
      ),
    );
    // Just grab the first key for the OIDC user
    const key = (await oidcSignerSession.keys())[0];
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
    const sig = await oidcSignerSession.signEvm(key.materialId, signReq);
    console.log("Done");
    res
      .contentType("application/json")
      .status(200)
      .send(
        JSON.stringify({
          user,
          key,
          evmSignRequest: signReq,
          evmSignResponse: sig.data(),
        }),
      );
  } catch (e) {
    const msg = JSON.stringify(e);
    console.error("Error handling /oauth2callback", msg);
    res.contentType("application/json").status(500).send(msg);
  }
});

app.listen(port);
