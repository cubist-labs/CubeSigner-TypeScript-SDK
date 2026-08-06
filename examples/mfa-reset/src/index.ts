import {
  CubeSignerClient,
  type EnvInterface,
  type OidcIdentity,
  type Org,
} from "@cubist-labs/cubesigner-sdk";
import { defaultUserSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import { generate } from "otplib";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import assert from "node:assert";

const rl = createInterface({ input, output });
const ask = async (q: string): Promise<string> => (await rl.question(q)).trim();

/**
 * Demonstrates the two-step MFA reset: an owner initiates the reset, then the
 * user completes it with a reset code emailed to them.
 */
async function main() {
  // Load owner session from disk (created by `cs login`); must be an org owner.
  const ownerSession = await CubeSignerClient.create(defaultUserSessionManager());
  const { env, orgId } = ownerSession;
  const org = ownerSession.org();
  const owner = await ownerSession.user();
  const membership = owner.orgs.find((o) => o.org_id === orgId);
  assert(
    membership?.membership === "Owner",
    "Default user session on disk must be an org owner for this example",
  );
  console.log(`Logged in as owner of ${orgId}`);

  // Setup: create a throwaway MFA-protected user to reset.
  const { userId, oidcToken, identity, email } = await createMfaEnrolledUser(org, env, orgId);

  try {
    // Step 1: the owner initiates the reset. CubeSigner emails a short-lived
    // reset code to the user's email.
    await org.resetUserMfaInit(userId);
    console.log(`Reset code emailed to ${email}.`);

    // Step 2: the user completes the reset with their OIDC token and the emailed
    // code. This is authenticated by the OIDC token (not a session), so a user
    // locked out by broken MFA can still do it; it clears all their MFA factors.
    const resetCode = await ask("Paste the reset code from the email: ");
    await CubeSignerClient.resetUserMfaComplete(env, orgId, oidcToken, resetCode);
    console.log("MFA reset complete.");

    // Verify user's MFA was reset by logging in without being prompted for MFA and checking there
    // are no MFA factors attached
    {
      const sessionData = await CubeSignerClient.createOidcSession(env, orgId, oidcToken, [
        "manage:*",
      ]);
      assert(!sessionData.requiresMfa(), "user still requires MFA after reset");
      const session = await CubeSignerClient.create(sessionData.data());
      const { mfa } = await session.user();
      assert(mfa.length === 0, `expected no MFA factors after reset, found ${mfa.length}`);
      console.log("Verified: user's MFA is cleared and login no longer requires MFA.");
    }
  } finally {
    rl.close();
    try {
      await org.deleteOidcUser(identity);
      console.log(`Deleted user ${userId}.`);
    } catch (e) {
      console.error(`Failed to delete test user ${userId}`, e);
    }
  }
}

/**
 * Setup boilerplate: create a throwaway user with an OIDC identity and enroll a
 * TOTP factor, so the reset flow in {@link main} has an MFA-protected user to act on.
 *
 * In a real deployment this user already exists — you would skip straight to the
 * two-step reset.
 *
 * @param org The org as accessed by an org owner.
 * @param env The environment the org lives in.
 * @param orgId The org id.
 * @returns The new user's id, its OIDC token and identity, and its email.
 */
async function createMfaEnrolledUser(
  org: Org,
  env: EnvInterface,
  orgId: string,
): Promise<{ userId: string; oidcToken: string; identity: OidcIdentity; email: string }> {
  // Bring an OIDC identity for the test user. Obtain the token however you like:
  // - your own IdP (e.g. Google/Apple)
  // - CubeSigner email+password (CubeSignerClient.idpAuthenticate)
  // - email-OTP (CubeSignerClient.initEmailOtpAuth)
  // The same token is reused to enroll MFA *and* to complete the reset, so it
  // must remain valid for the whole run (a few minutes).
  const oidcToken = await ask("Paste an OIDC token to be the identity for the test user: ");
  const { iss, sub, email } = parseOidcToken(oidcToken);
  const identity = { iss, sub };

  const userId = await org.createOidcUser(identity, email, { memberRole: "Alien" });
  console.log(`Created user ${userId} <${email}>`);

  // Log in as the user and enroll a TOTP factor.
  const userSessionData = await CubeSignerClient.createOidcSession(env, orgId, oidcToken, [
    "manage:*",
  ]);
  assert(!userSessionData.requiresMfa(), "fresh user unexpectedly requires MFA");
  const userSession = await CubeSignerClient.create(userSessionData.data());

  const totp = (await userSession.resetTotp()).data();
  assert(totp.url, "TOTP challenge did not include a provisioning URL");
  const secret = new URL(totp.url).searchParams.get("secret");
  assert(secret, "TOTP provisioning URL did not include a secret");
  await totp.answer(await generate({ secret }));
  console.log("Enrolled a TOTP factor — user is now MFA-protected.");

  return { userId, oidcToken, identity, email };
}

/**
 * Pull the identity claims out of an OIDC token's (unverified) payload.
 *
 * @param token The OIDC token to parse.
 * @returns The issuer, subject, and email from the token payload.
 */
function parseOidcToken(token: string): { iss: string; sub: string; email: string } {
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  assert(payload.email, "OIDC token must include an `email` claim for this example");
  return { iss: payload.iss, sub: payload.sub, email: payload.email };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
