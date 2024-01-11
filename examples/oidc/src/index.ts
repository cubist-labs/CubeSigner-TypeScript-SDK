/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  CubeSignerClient,
  EnvInterface,
  IdentityProof,
  OidcClient,
  Org,
  Secp256k1,
  SignerSession,
  SignerSessionManager,
} from "@cubist-labs/cubesigner-sdk";
import { loadManagementSession } from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import express from "express";
import assert from "assert";

dotenv.config();

const app = express();
const port = 3000;

let orgOwnerCubeSigner: CubeSignerClient | undefined = undefined;
let thirdPartyUserCubeSigner: CubeSignerClient | undefined = undefined;
let thirdPartyUserSignerSession: SignerSession | undefined = undefined;
let env: EnvInterface | undefined = undefined;
let oidcToken: string | undefined = undefined;
let mfaSessionMgr: SignerSessionManager | undefined = undefined;

/**
 * Factory method for `URLSearchParams`
 * @param {Record<string, string>} query Query parameters
 * @return {URLSearchParams}
 */
function p(query: Record<string, string>): URLSearchParams {
  return new URLSearchParams(query);
}

/**
 * @param {unknown} f Function to call and assert that it throws.
 */
async function assertThrowsRequiredScope<T>(f: () => Promise<T>) {
  let caught = undefined;
  let result: T | undefined = undefined;
  try {
    result = await f();
  } catch (e) {
    caught = e;
    console.log(`Caught EXPECTED error: ${e}`);
  }
  if (!caught) {
    assert(false, `Didn't throw, returned instead: ${JSON.stringify(result)}`);
  } else {
    assert(
      `${caught}`.includes("Session does not have required scope") ||
        `${caught}`.includes("Session must have at least one scope under 'sign:*'"),
    );
  }
}

const PAGE_CREATE_OIDC_USER = "/createOidcUser";
const PAGE_DELETE_OIDC_USER = "/deleteOidcUser";
const PAGE_MFA_INIT = "/mfa/init";
const PAGE_MFA_INIT_VERIFY_TOTP = "/mfa/init/verifyTotp";
const PAGE_MFA_APPROVE = "/mfa/approve";
const PAGE_MFA_APPROVE_TOTP = "/mfa/approve/totp";
const PAGE_CUBE_SIGNER_LOGIN = "/login";
const PAGE_HOME = "/home";

/**
 * `CubeSigner` instance lazily initialized from the CubeSigner management session from disk
 * (which should correspond to an org owner)
 *
 * @return {Promise<CubeSignerClient>} CubeSigner for an org owner.
 */
async function getCubeSigner(): Promise<CubeSignerClient> {
  if (!orgOwnerCubeSigner) {
    orgOwnerCubeSigner = await loadManagementSession();
    env = orgOwnerCubeSigner.env;
  }
  return orgOwnerCubeSigner;
}

/**
 * Parses an OIDC token into `iss`, `sub`, and `email`.
 * @param {string} token OIDC token
 * @return {unknown} Deconstructed token.
 */
function parseOidcToken(token: string): { iss: string; sub: string; email: string } {
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  const iss = payload.iss;
  const sub = payload.sub;
  const email = payload.email;
  return { iss, sub, email };
}

app.use(bodyParser.urlencoded({ extended: true }));

/**
 * ===================== Select OIDC Account Page =====================
 *
 * Allows the user to select a Google account.
 *
 */
app.get("/", (_, res) => {
  res.send(`
  <html>
    <body>
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      <div
        id="g_id_onload"
        data-client_id="${process.env["GOOGLE_CLIENT_ID"]}"
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

      <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
      <div id="appleid-signin" data-color="black" data-border="true" data-type="sign in"></div>
      <script type="text/javascript">
          AppleID.auth.init({
              clientId : "${process.env["APPLE_CLIENT_ID"]}",
              scope : "email",
              redirectURI : "https://${process.env["BASE_URL"]}/oauth2callback",
              responseMode: "form_post",
          });
      </script>
    </body>
  </html>
  `);
});

/**
 * ===================== OIDC Callback Page =====================
 *
 * Called back from the OIDC client.
 *
 * Receives OIDC token; saves it in a global variable.
 *
 * Queries CubeSigner org to see if that OIDC user already exist
 * - if the users exists -> redirect to "CubeSigner Login" page
 * - else                -> redirect to "Create OIDC User" page
 *
 */

app.post("/oauth2callback", async (req, res) => {
  // `credential` for google and `id_token` for apple
  oidcToken = req.body.credential ?? req.body.id_token;

  // Extract user identity from token
  const payload = JSON.parse(atob(oidcToken!.split(".")[1]));
  const email = payload.email;

  // Create a management session
  const cubesigner = await getCubeSigner();
  const org = new Org(cubesigner);
  const orgId = org.id;
  const users = await org.listUsers();
  const oidcUser = users.find((u) => u.email == email);
  if (oidcUser) {
    res.redirect(`${PAGE_CUBE_SIGNER_LOGIN}?${p({ orgId })}`);
    return;
  } else {
    res.redirect(`${PAGE_CREATE_OIDC_USER}?${p({ orgId })}`);
    return;
  }
});

/**
 * ===================== Create OIDC User Page =====================
 *
 * Called from the "OIDC Callback page", after an OIDC token has been saved.
 *
 * Creates a new OIDC user from the previously obtained OIDC token.
 * Also creates a secp key.
 *
 * Upon success, redirects to "CubeSigner Login" page.
 */
// NOTE: in practice this should be POST instead of GET
app.get(PAGE_CREATE_OIDC_USER, async (req, res) => {
  console.log(req.path, req.query);
  const orgId = req.query["orgId"] as unknown as string;
  const requireMfa = req.query["requireMfa"] as unknown as string;
  const submit = req.query["submit"] as unknown as string;

  if (!orgId) {
    res.status(400).send("malformed URL: query parameters missing");
    return;
  }

  if (!oidcToken) {
    res.redirect("/");
    return;
  }

  const { iss, sub, email } = parseOidcToken(oidcToken);

  if (!submit) {
    res.status(200).send(`
    <html>
    <head>
      <title>Create new OIDC user</title>
    </head>
    <body>
      <h2>Create New User</h2>
      <form action="${PAGE_CREATE_OIDC_USER}">
        <input type="hidden" id="orgId" name="orgId" value="${orgId}"/>
        <input type="hidden" id="submit" name="submit" value="1"/>
        <b>Email:</b> ${email}
        <br/>
        <label for="requireMfa"><b>Require MFA</b></label>
        <input type="checkbox" id="requireMfa" name="requireMfa" value="true">
        <br/>
        <input type="submit" value="Create New User"/>
      </form>
    </body>
    </html>
    `);
    return;
  }

  const cubesigner = await getCubeSigner();
  const org = new Org(cubesigner);

  const userId = await org.createOidcUser({ iss, sub }, email, {
    mfaPolicy: requireMfa === "true" ? { count: 1, num_auth_factors: 1 } : undefined,
  });
  console.log(`Created new OIDC user in ${orgId}: ${userId}`);

  // Create a key for the OIDC user
  const key = await org.createKey(Secp256k1.Evm, userId);
  console.log(`Created secp key ${key.id} for ${userId}`);

  // Redirect to CubeSigner Login
  console.log(userId, orgId);
  res.redirect(`${PAGE_CUBE_SIGNER_LOGIN}?&${p({ orgId, newlyCreatedUserId: userId })}`);
});

/**
 * ===================== Delete OIDC User Page =====================
 *
 * Deletes an existing OIDC user from the previously obtained OIDC token.
 *
 * Upon success, redirects to "CubeSigner Login" page.
 */
// NOTE: in practice this should be DELETE instead of GET
app.get(PAGE_DELETE_OIDC_USER, async (req, res) => {
  console.log(req.path, req.query);
  const orgId = req.query["orgId"] as unknown as string;
  const identityStr = req.query["identity"] as unknown as string;

  if (!orgId || !identityStr) {
    res.status(400).send("malformed URL: query parameters missing");
    return;
  }

  const org = new Org(await getCubeSigner());

  const proof: IdentityProof = JSON.parse(identityStr);
  console.log("Verifying", proof);
  await org.verifyIdentity(proof);

  console.log("Deleting", proof.identity);
  await org.deleteOidcUser(proof.identity!);

  // Redirect to CubeSigner Login
  console.log("User deleted");
  res.redirect("/");
});

/**
 * ===================== Init MFA Page =====================
 *
 * Called after a new OIDC user attempts to log in but MFA is required.
 *
 * Allows the user to configure their MFA factors.
 *
 * Provides a link for the user to proceed to the "CubeSigner Login" page once ready.
 */
app.get(PAGE_MFA_INIT, async (req, res) => {
  console.log(req.path, req.query);
  const orgId = req.query["orgId"] as unknown as string;
  const userId = req.query["userId"] as unknown as string;

  if (!orgId || !userId) {
    res.status(400).send("query parameters missing");
    return;
  }

  if (!mfaSessionMgr) {
    console.warn(`Called ${PAGE_MFA_INIT} without mfaSessionMgr`);
    res.redirect("/");
    return;
  }

  const oidcCs = new CubeSignerClient(mfaSessionMgr);
  const totpResp = await oidcCs.resetTotpStart();
  assert(!totpResp.requiresMfa());
  const totp = totpResp.data();

  res.status(200).send(`
  <html>
    <head>
      <title>Init MFA</title>
    </head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
    <body>
      <p>Import this into your Authenticator app</p>

      <canvas id="qrcode"></canvas>
      <script type="text/javascript">
        new QRious({element: document.getElementById("qrcode"), value: "${totp.totpUrl}"});
      </script>

      <form action="${PAGE_MFA_INIT_VERIFY_TOTP}">
        <input type="hidden" id="orgId" name="orgId" value="${orgId}"/>
        <input type="hidden" id="totpId" name="totpId" value="${totp.totpId}"/>
        <label for="totpCode"><b>Code:</b></label>
        <input type="text" id="totpCode" name="totpCode"/><br/>
        <input type="submit" value="Verify TOTP Code"/>
      </form>
    </body>
  </html>
  `);
});

/**
 * ===================== Verify TOTP Page =====================
 *
 * The user verifies their TOTP code during MFA initialization phase.
 */
// NOTE: in practice this should be POST instead of GET
app.get(PAGE_MFA_INIT_VERIFY_TOTP, async (req, res) => {
  console.log(req.path, req.query);
  const orgId = req.query["orgId"] as unknown as string | undefined;
  const totpId = req.query["totpId"] as unknown as string | undefined;
  const totpCode = req.query["totpCode"] as unknown as string | undefined;

  if (!orgId || !totpId || !totpCode) {
    res.status(400).send("malformed URL: query parameters missing");
    return;
  }

  if (!mfaSessionMgr) {
    console.warn(`Called ${PAGE_MFA_INIT_VERIFY_TOTP} without mfaSessionMgr`);
    res.redirect("/");
    return;
  }

  const oidcCs = new CubeSignerClient(mfaSessionMgr);
  await oidcCs.resetTotpComplete(totpId, totpCode);
  res.redirect(`${PAGE_CUBE_SIGNER_LOGIN}?${p({ orgId })}`);
});

/**
 * ===================== CubeSigner Login Page =====================
 *
 * The user logs into CubeSigner using their OIDC token.
 *
 * If the login request returns 202 -> redirects either to "Init MFA" or "Approve MFA".
 *
 * If the login succeeds, creates CubeSigner sessions for the OIDC user
 * and redirects the user to the "Home" (/home) page.
 */
app.get(PAGE_CUBE_SIGNER_LOGIN, async (req, res) => {
  console.log(req.path, req.query);
  const orgId = req.query["orgId"] as unknown as string;
  const newlyCreatedUserId = req.query["newlyCreatedUserId"] as unknown as string | undefined;
  const mfaId = req.query["mfaId"] as unknown as string | undefined;
  const mfaConf = req.query["mfaConf"] as unknown as string | undefined;

  if (!orgId) {
    res.status(400).send("malformed URL: query parameters missing");
    return;
  }

  if (!oidcToken || !env) {
    console.warn(`Called ${PAGE_CUBE_SIGNER_LOGIN} without OIDC token`);
    res.redirect("/");
    return;
  }

  const mfa = mfaId && mfaConf ? { mfaOrgId: orgId, mfaId, mfaConf } : undefined;
  const oidcClient = new OidcClient(env, orgId, oidcToken);
  const hour = 3600; // 1h in seconds
  const lifetimes = {
    auth_lifetime: hour, // 1 hour
    refresh_lifetime: hour * 24 * 7, // 1 week
    session_lifetime: hour * 24 * 365, // 1 year
  };
  const resp = await oidcClient.sessionCreate(["sign:*", "manage:*"], lifetimes, mfa);

  // MFA required -> go to "Approve MFA"
  if (resp.requiresMfa()) {
    const mfaSession = resp.mfaSessionInfo();
    assert(mfaSession);
    mfaSessionMgr = await SignerSessionManager.createFromSessionInfo(env, orgId, mfaSession);

    // sanity check that this session does not give access to normal management endpoints
    const tmpCs = new CubeSignerClient(mfaSessionMgr);
    assertThrowsRequiredScope(() => tmpCs.orgGet());
    const tmpSs = new SignerSession(mfaSessionMgr);
    assertThrowsRequiredScope(() => tmpSs.keys());

    if (newlyCreatedUserId) {
      res.redirect(`${PAGE_MFA_INIT}?${p({ orgId, userId: newlyCreatedUserId })}`);
    } else {
      res.redirect(`${PAGE_MFA_APPROVE}?${p({ orgId, mfaId: resp.mfaId() })}`);
    }
    return;
  }

  // logged in -> create CubeSigner sessions and redirect to /home
  const sessionInfo = resp.data();
  const sessionMgr = await SignerSessionManager.createFromSessionInfo(env, orgId, sessionInfo);
  thirdPartyUserCubeSigner = new CubeSignerClient(sessionMgr);
  thirdPartyUserSignerSession = new SignerSession(sessionMgr);

  // obtain authentication/identity proof
  const identityProof = await oidcClient.identityProve();
  const identity = JSON.stringify(identityProof);
  oidcToken = undefined; // don't need oidc token any longer
  res.redirect(`${PAGE_HOME}?${p({ identity })}`);
});

/**
 * ===================== Approve MFA Page =====================
 *
 * Redirected from the "CubeSigner Login" page when the login request requires MFA.
 *
 * Displays the MFA request and allows the user to approve it using any of the available methods.
 */
// NOTE: in practice this should be POST instead of GET
app.get(PAGE_MFA_APPROVE, async (req, res) => {
  console.log(req.path, req.query);
  const orgId = req.query["orgId"] as unknown as string;
  const mfaId = req.query["mfaId"] as unknown as string;

  if (!orgId || !mfaId) {
    res.status(400).send("malformed URL: query parameters missing");
    return;
  }

  if (!mfaSessionMgr || !env) {
    res.redirect("/");
    return;
  }

  const oidcCs = new CubeSignerClient(mfaSessionMgr);
  const mfaInfo = await oidcCs.mfaGet(mfaId);

  res.status(200).send(`
  <html>
    <head>
      <title>CubeSigner MFA</title>
    </head>
    <body>
      <h2>MFA Request</h2>
      <pre>${JSON.stringify(mfaInfo, undefined, 2)}</pre>
      <h2>Enter Authenticator code</h2>
      <form action="${PAGE_MFA_APPROVE_TOTP}">
        <input type="hidden" id="orgId" name="orgId" value="${orgId}"/>
        <input type="hidden" id="mfaId" name="mfaId" value="${mfaId}"/>
        <label for="totpCode"><b>Code:</b></label>
        <input type="text" id="totpCode" name="totpCode"/><br/>
        <input type="submit" value="Log In"/>
      </form>
    </body>
  </html>
  `);
});

/**
 * ===================== Approve TOTP Page =====================
 *
 * Redirected from the "Approve MFA" page after the user has provided their TOTP code.
 *
 * Approves the MFA requests using the provided code.
 *
 * Upon success, redirects to either "Approve MFA" if the MFA request is still
 * not approved or the "CubeSigner Login" page otherwise.
 */
// NOTE: in practice this should be POST instead of GET
app.get(PAGE_MFA_APPROVE_TOTP, async (req, res) => {
  console.log(req.path, req.query);
  const orgId = req.query["orgId"] as unknown as string;
  const mfaId = req.query["mfaId"] as unknown as string;
  const totpCode = req.query["totpCode"] as unknown as string;

  if (!orgId || !mfaId || !totpCode) {
    res.status(400).send("malformed URL: query parameters missing");
    return;
  }

  if (!mfaSessionMgr) {
    res.redirect("/");
    return;
  }

  const ss = new SignerSession(mfaSessionMgr);
  try {
    const status = await ss.totpApprove(mfaId, totpCode);
    if (status.receipt?.confirmation) {
      // redirect to login if approved
      const mfaId = status.id;
      const mfaConf = status.receipt.confirmation;
      res.redirect(`${PAGE_CUBE_SIGNER_LOGIN}?${p({ orgId, mfaId, mfaConf })}`);
      return;
    } else {
      // redirect to mfa approve if still not approved
      res.redirect(`${PAGE_MFA_APPROVE}?${p({ orgId, mfaId })}`);
    }
  } catch (e) {
    res.status(400).send(e);
    return;
  }
});

/**
 * ===================== Home Page =====================
 *
 * Redirected after successful login.
 *
 * Displays user info as well as a signature for a canned transaction.
 */
app.get(PAGE_HOME, async (req, res) => {
  console.log(req.path, req.query);

  const identity = req.query["identity"] as unknown as string;

  if (!thirdPartyUserSignerSession || !thirdPartyUserCubeSigner) {
    res.redirect("/");
    return;
  }

  const userInfo = await thirdPartyUserCubeSigner.aboutMe();
  const key = (await thirdPartyUserSignerSession.keys())[0];

  const signReq = {
    chain_id: 1,
    tx: <any>{
      type: "0x00",
      gas: "0x61a80",
      gasPrice: "0x77359400",
      nonce: "0",
    },
  };

  const sig = await thirdPartyUserSignerSession.signEvm(key.material_id, signReq);

  res.status(200).send(`
  <html>
    <head>
      <title>CubeSigner Home</title>
    </head>
    <body>
      <h2><a href="${PAGE_DELETE_OIDC_USER}?${p({
        orgId: userInfo.org_ids[0],
        identity,
      })}">Delete User</a></h2>
      <h2>User Info</h2>
      <pre>${JSON.stringify(userInfo, undefined, 2)}</pre>
      <h2>Sign EVM Transaction Request</h2>
      <pre>${JSON.stringify(signReq, undefined, 2)}</pre>
      <h2>Key</h2>
      <pre>${JSON.stringify(key, undefined, 2)}</pre>
      <h2>Signature</h2>
      <pre>${JSON.stringify(sig.data(), undefined, 2)}</pre>
    </body>
  </html>
  `);
});

app.listen(port);
