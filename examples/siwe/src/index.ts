import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { assert } from "console";
import { ethers } from "ethers";
import * as siwe from "siwe";

/**
 * Required session scopes:
 * - manage:readonly
 * - manage:org:addUser
 * - manage:org:deleteUser
 */
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create one like:cs token create ... --output base64)

/**
 * CubeSigner SIWE OIDC issuer url.
 */
const SIWE_ISSUER = "https://shim.oauth2.cubist.dev/siwe";

/**
 * Asserts that the current org configuration allows the SIWE issuer.
 *
 * @param client The CubeSigner client
 */
async function assertSiweEnabled(client: cs.CubeSignerClient) {
  const orgPolicies = await client.org().policy();
  const found = orgPolicies.find(
    (p) => (p as cs.OidcAuthSourcesPolicy).OidcAuthSources?.[SIWE_ISSUER] !== undefined,
  );
  if (found === undefined) {
    throw new Error(`No 'OidcAuthSources' policy allows ${SIWE_ISSUER} issuer`);
  }
}

/**
 * Completes a SIWE auth flow with a given Ethereum wallet and returns the resulting OIDC token.
 * Concretely:
 * - requests SIWE challenge message
 * - answers the challenge by signing the returned message with {@link wallet}.
 *
 * @param env CubeSigner environment
 * @param orgId Target CubeSigner organization
 * @param wallet The Ethereum wallet to sign the SIWE challenge message with
 * @returns The OIDC token
 */
async function siweAuth(
  env: cs.EnvInterface,
  orgId: string,
  wallet: ethers.HDNodeWallet,
): Promise<string> {
  // 1. request a SIWE challenge
  const siweChallenge = await cs.ApiClient.siweLoginInit(env, orgId, {
    address: wallet.address,
    domain: "cubist.dev", // or the domain of your app
    uri: env.SignerApiRoot, // or the login page of your app
  });

  // 2. parse the returned SIWE message and sign it
  console.log("======================= Signing SIWE Message =======================");
  console.log(siweChallenge.message);
  console.log("====================================================================");

  const siweMsg = new siwe.SiweMessage(siweChallenge.message).prepareMessage();
  const signature = await wallet.signMessage(siweMsg);

  // 3. answer the challenge
  const { id_token } = await cs.ApiClient.siweLoginComplete(env, orgId, {
    signature,
    challenge_id: siweChallenge.challenge_id,
  });

  return id_token;
}

/**
 * Logs into CubeSigner via SIWE and returns the id of the logged-in user.
 *
 * @param env CubeSigner environment
 * @param orgId The organization to log into
 * @param wallet The Ethereum wallet to sign the SIWE challenge message with
 * @returns The id of the user upon logging in
 */
async function newUserLogIn(
  env: cs.EnvInterface,
  orgId: string,
  wallet: ethers.HDNodeWallet,
): Promise<string> {
  const id_token = await siweAuth(env, orgId, wallet);

  // exchange the SIWE OIDC token for a CubeSigner session
  console.log("Logging in");
  const resp = await cs.CubeSignerClient.createOidcSession(env, orgId, id_token, [
    "manage:readonly",
  ]);

  // register MFA if required by the org; in this example, we skip this step and
  // return the temporary MFA session, which is enough to retrieve the user info
  const mfaClient = await resp.mfaClient();
  const newUserClient = mfaClient ? mfaClient : await cs.CubeSignerClient.create(resp.data());
  const newUserInfo = await newUserClient.user();

  // return the user id
  return newUserInfo.user_id;
}

/**
 * Create a new third-party user identified by an Ethereum address.
 *
 * @param client CubeSigner client
 * @param walletAddress An EIP-55 (mixed-case) Ethereum address.
 * @returns The id of the newly created user
 */
async function createSiweUser(client: cs.CubeSignerClient, walletAddress: string): Promise<string> {
  const siweIdentity: cs.OidcIdentity = {
    iss: SIWE_ISSUER,
    sub: walletAddress,
  };
  return await client.org().createOidcUser(siweIdentity);
}

/** Main entry point */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultUserSessionManager();
  const client = await cs.CubeSignerClient.create(storage);

  await assertSiweEnabled(client);

  // generate an Ethereum key
  const wallet = ethers.Wallet.createRandom();
  const walletAddress = wallet.address; // must be EIP-55 (mixed-case) address
  console.log("Generated new wallet", walletAddress);

  // create a new third-party user with that wallet
  const newUserId = await createSiweUser(client, walletAddress);
  console.log("Created SIWE user", newUserId);

  try {
    // current CubeSigner environment
    const env = client.env;
    const orgId = client.orgId;
    const userId = await newUserLogIn(env, orgId, wallet);
    assert(userId === newUserId);
  } finally {
    const siweIdentity: cs.OidcIdentity = {
      iss: SIWE_ISSUER,
      sub: walletAddress,
    };
    console.log("Deleting OIDC user", newUserId, siweIdentity);
    await client.org().deleteOidcUser(siweIdentity);
  }

  console.log("DONE");
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Returns the value of the environment variable.
 *
 * @param name The name of the environment variable.
 * @param fallback The optional fallback value.
 * @returns The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
export function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
