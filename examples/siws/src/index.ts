import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { assert } from "console";
import { createSignInMessageText } from "@solana/wallet-standard-util";
import bs58 from "bs58";
import nacl from "tweetnacl";

/**
 * Required session scopes:
 * - manage:readonly
 * - manage:org:addUser
 * - manage:org:deleteUser
 */
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create one like: cs token create ... --output base64)

/**
 * CubeSigner SIWS OIDC issuer url.
 */
const SIWS_ISSUER = "https://shim.oauth2.cubist.dev/siws";

/** A locally-generated Solana (ed25519) keypair, standing in for a real Solana wallet. */
interface SolanaWallet {
  /** The base58-encoded ed25519 public key (i.e., the Solana address). */
  address: string;
  /** The 64-byte ed25519 secret key. */
  secretKey: Uint8Array;
}

/**
 * Generates a new Solana (ed25519) keypair.
 *
 * @returns A freshly generated Solana wallet
 */
function newSolanaWallet(): SolanaWallet {
  const keypair = nacl.sign.keyPair();
  return {
    address: bs58.encode(keypair.publicKey),
    secretKey: keypair.secretKey,
  };
}

/**
 * Asserts that the current org configuration allows the SIWS issuer.
 *
 * @param client The CubeSigner client
 */
async function assertSiwsEnabled(client: cs.CubeSignerClient) {
  const orgPolicies = await client.org().policy();
  const found = orgPolicies.find(
    (p) => (p as cs.OidcAuthSourcesPolicy).OidcAuthSources?.[SIWS_ISSUER] !== undefined,
  );
  if (found === undefined) {
    throw new Error(`No 'OidcAuthSources' policy allows ${SIWS_ISSUER} issuer`);
  }
}

/**
 * Renders a structured SIWS `SignInInput` into the canonical, human-readable
 * message text that the wallet must sign. The bytes of this message (along with
 * the signature) are what get submitted back to {@link cs.ApiClient.siwsLoginComplete}.
 *
 * @param input The structured sign-in input returned by {@link cs.ApiClient.siwsLoginInit}
 * @returns The canonical message text to sign
 */
function renderSiwsMessage(input: cs.schemas["SignInInput"]): string {
  // `createSignInMessageText` only renders fields that are present, so translate
  // the SDK's `null`s into `undefined`s. `domain` and `address` are always set.
  const signInInput: Parameters<typeof createSignInMessageText>[0] = {
    domain: input.domain,
    address: input.address,
    statement: input.statement ?? undefined,
    uri: input.uri ?? undefined,
    version: input.version ?? undefined,
    chainId: input.chainId ?? undefined,
    nonce: input.nonce ?? undefined,
    issuedAt: input.issuedAt ?? undefined,
    expirationTime: input.expirationTime ?? undefined,
    notBefore: input.notBefore ?? undefined,
    requestId: input.requestId ?? undefined,
    resources: input.resources ?? undefined,
  };
  return createSignInMessageText(signInInput);
}

/**
 * Completes a SIWS auth flow with a given Solana wallet and returns the resulting OIDC token.
 * Concretely:
 * - requests a SIWS challenge
 * - answers the challenge by rendering the returned `SignInInput` to text and signing it
 *   (ed25519) with {@link wallet}.
 *
 * @param env CubeSigner environment
 * @param orgId Target CubeSigner organization
 * @param wallet The Solana wallet to sign the SIWS challenge message with
 * @returns The OIDC token
 */
async function siwsAuth(
  env: cs.EnvInterface,
  orgId: string,
  wallet: SolanaWallet,
): Promise<string> {
  // 1. request a SIWS challenge
  const siwsChallenge = await cs.ApiClient.siwsLoginInit(env, orgId, {
    address: wallet.address,
    domain: "cubist.dev", // or the domain of your app
    uri: env.SignerApiRoot, // or the login page of your app
    chain_id: "solana:devnet",
    statement: "CubeSigner SIWS example",
    request_id: crypto.randomUUID(),
    not_before: new Date(Date.now() - 10_000).toISOString(),
    expiration_time: new Date(Date.now() + 20_000).toISOString(),
  });

  // 2. render the returned SignInInput to its canonical message text and sign it
  const message = renderSiwsMessage(siwsChallenge.sign_in_input);
  console.log("======================= Signing SIWS Message =======================");
  console.log(message);
  console.log("====================================================================");

  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, wallet.secretKey);

  // 3. answer the challenge (signature and signed message are base58-encoded)
  const { id_token } = await cs.ApiClient.siwsLoginComplete(env, orgId, {
    challenge_id: siwsChallenge.challenge_id,
    signature: bs58.encode(signature),
  });

  return id_token;
}

/**
 * Logs into CubeSigner via SIWS and returns the id of the logged-in user.
 *
 * @param env CubeSigner environment
 * @param orgId The organization to log into
 * @param wallet The Solana wallet to sign the SIWS challenge message with
 * @returns The id of the user upon logging in
 */
async function newUserLogIn(
  env: cs.EnvInterface,
  orgId: string,
  wallet: SolanaWallet,
): Promise<string> {
  // obtain SIWS id token
  console.log("Authenticating with SIWS");
  const id_token = await siwsAuth(env, orgId, wallet);

  // exchange the SIWS OIDC token for a CubeSigner session
  console.log("Logging in");
  const resp = await cs.CubeSignerClient.createOidcSession(env, orgId, id_token, [
    "manage:readonly",
  ]);

  // register MFA if required by the org; in this example, we skip this step and
  // return the temporary MFA session, which is enough to retrieve the user info
  const mfaClient = await resp.mfaClient();
  const newUserClient = mfaClient ? mfaClient : await cs.CubeSignerClient.create(resp.data());

  const newUserInfo = await newUserClient.user();
  console.log("Logged in as", newUserInfo)

  // return the user id
  return newUserInfo.user_id;
}

/**
 * Create a new third-party user identified by a Solana address.
 *
 * @param client CubeSigner client
 * @param walletAddress A base58-encoded Solana (ed25519) address.
 * @returns The id of the newly created user
 */
async function createSiwsUser(client: cs.CubeSignerClient, walletAddress: string): Promise<string> {
  return await client.org().createOidcUser(getSiwsIdentity(walletAddress));
}

/**
 * Constructs the CubeSigner OIDC identity for a given Solana wallet address.
 *
 * @param walletAddress The Solana wallet address for which to construct OIDC identity.
 * @returns CubeSigner OIDC identity for a given Solana wallet address.
 */
function getSiwsIdentity(walletAddress: string): cs.OidcIdentity {
  return {
      iss: SIWS_ISSUER,
      sub: walletAddress,
  };
}

/** Main entry point */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultUserSessionManager();
  const client = await cs.CubeSignerClient.create(storage);

  await assertSiwsEnabled(client);

  // generate a Solana key
  const wallet = newSolanaWallet();
  const walletAddress = wallet.address; // base58-encoded Solana address
  console.log("Generated new wallet", walletAddress);

  // create a new third-party user with that wallet
  const newUserId = await createSiwsUser(client, walletAddress);
  console.log("Created SIWS user", newUserId);

  try {
    // current CubeSigner environment
    const env = client.env;
    const orgId = client.orgId;
    const userId = await newUserLogIn(env, orgId, wallet);
    assert(userId === newUserId);
  } finally {
    const siwsIdentity = getSiwsIdentity(walletAddress);
    console.log("Deleting OIDC user", newUserId, siwsIdentity);
    await client.org().deleteOidcUser(siwsIdentity);
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
