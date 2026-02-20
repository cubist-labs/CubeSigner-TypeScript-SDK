/**
 * This module implements the OIDC token acquisition flow which represents
 * Step 1 and Step 2 of both the login and registration flows.
 *
 * Nothing in this module is specific to CubeSigner. It could be replaced
 * by your preferred library or custom code so long as it returns an OIDC token.
 */

import * as client from "openid-client";
import { ISSUER_URL, CLIENT_ID } from "./env.js";

/** A simple type alias to make it clearer when we're passing around OIDC token */
export type OidcToken = string;

/**
 * The name of the broadcast channel that login popups use to communicate OAuth responses
 * back to the main page.
 */
export const OAUTH_CHANNEL_NAME = "oauth";

/** The redirect_uri that is used in OAuth requests */
const REDIRECT_URI = "http://localhost:3000/";

/**
 * This function runs on pageload, looking for OAuth parameters in the URL.  If
 * they're found, we post a message to the main window with the token or code
 * (depending on the flow), and then close the window.
 */
export async function handleOauthRedirect() {
  const params = new URLSearchParams(
    window.location.hash ? window.location.hash.substring(1) : window.location.search,
  );
  const state = params.get("state");
  if (!state || !params) return;
  const bc = new BroadcastChannel(OAUTH_CHANNEL_NAME);

  bc.postMessage({
    state,
    code: params.get("code"), // for PKCE
    id_token: params.get("id_token"), // for implicit flow
  });

  bc.close();
  window.close();
}

/**
 * Run the oauth flow in a popup.
 *
 * @returns An OIDC token for the user
 */
export async function getOidcToken(): Promise<OidcToken> {
  // Load the OpenID Connect configuration by querying the issuer's discovery URL.
  const config = await client.discovery(new URL(ISSUER_URL), CLIENT_ID);

  // Use authorization code if we can (it's more secure).
  // Google doesn't comply with the spec (but claims to) so we handle it explicitly
  if (
    config.serverMetadata().response_types_supported?.includes("code") &&
    ISSUER_URL.replace(/\/$/, "") !== "https://accounts.google.com"
  ) {
    return await codeFlow(config);
  } else {
    return await implicitFlow(config);
  }
}

/**
 * Implements the OAuth2.0 Authorization Code Flow (w/ PKCE)
 *
 * @param config The OIDC configuration
 * @returns A token for the user
 */
async function codeFlow(config: client.Configuration): Promise<OidcToken> {
  const code_verifier: string = client.randomPKCECodeVerifier();
  const code_challenge: string = await client.calculatePKCECodeChallenge(code_verifier);

  const nonce = client.randomNonce();
  const state = client.randomState();

  const url = client.buildAuthorizationUrl(config, {
    response_type: "id_token",
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    code_challenge,
    code_challenge_method: "S256",
    nonce,
    state,
  });

  openLoginWindow(url);
  const { url: response_url } = (await waitForResponse(state)) as CodeResponse;
  const tokens: client.TokenEndpointResponse = await client.authorizationCodeGrant(
    config,
    new URL(response_url),
    {
      pkceCodeVerifier: code_verifier,
      expectedState: state,
    },
  );

  return tokens.id_token!;
}

/**
 * Implements the OAuth2.0 Implicit Flow (w/ PKCE)
 *
 * @param config The OIDC configuration
 * @returns A token for the user
 */
async function implicitFlow(config: client.Configuration): Promise<OidcToken> {
  const nonce = client.randomNonce();

  const url = client.buildAuthorizationUrl(config, {
    response_type: "id_token",
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    nonce,
    state: nonce,
  });

  openLoginWindow(url);
  const resp = (await waitForResponse(nonce)) as ImplicitResponse;
  return resp.id_token;
}

/** The value emitted from the login popup, when using Code Flow*/
type CodeResponse = { url: string };

/** The value emitted from the login popup, when using the Implicit Flow */
type ImplicitResponse = { id_token: string };

/**
 * A utility function that waits for a message from the popup
 *
 * @param state The state value of the expected response
 * @returns The message from the popup
 */
async function waitForResponse(state: string): Promise<CodeResponse | ImplicitResponse> {
  return new Promise((resolve) => {
    const abort = new AbortController();
    const bc = new BroadcastChannel("oauth");
    bc.addEventListener(
      "message",
      (event) => {
        if (event.data.state === state) {
          abort.abort();
          bc.close();
          resolve(event.data);
        }
      },
      abort,
    );
  });
}

/**
 * Opens a window to be used for oauth login
 *
 * @param url The URL to open in the window
 * @returns A window at that url
 */
function openLoginWindow(url: URL): Window {
  const w = window && window.open("about:blank", "Login", "popup,width=400,height=600,menubar=no");
  if (!w) {
    throw new Error("Failed to open popup");
  }
  w.location = url.toString();
  return w;
}
