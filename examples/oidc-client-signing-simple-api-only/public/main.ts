/* eslint-disable no-var */

/* Defined in index.html: */
var orgName: string;
var rootUrl: string;

/**
 * Given an oidc token:
 * 1. Exchange the OIDC token for a CubeSigner identity proof
 * 2. If there is no actual user associated with the identity, call our backend
 *    to create a new user. The backed verifies the identity proof and calls
 *    CubeSigner to create the user.
 * 3. Get all EVM keys the session can access.
 * 4. Repeat 3 times:
 *    a. Sign an EVM transaction with the first key.
 *    b. Refresh the session.
 *
 * @param oidcToken The OIDC token to use for authentication. 
 */
export async function loginWithOidcTokenAndSignTx(oidcToken: string) {
  console.log("Get identity proof");
  const identityProof = await getOidcProof(oidcToken);

  // create a new OIDC user if there is no user associated with this OIDC identity
  if (!identityProof.user_info) {
    await createUser(identityProof);
  }

  // Create OIDC-based signer session that can be used to sign EVM transactions
  let session = await loginWithOidcToken(oidcToken, ["sign:evm:tx"]);

  // Just grab the address of any EVM key we can access in this session
  const walletAddress = (await getEvmKeys(session))[0];

  // Example EIP-1559 transaction to sign
  const exampleEVMReq = {
    chain_id: 43113,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: <any>{
      type: "0x02", // eip1559
      chain_id: 43113,
      from: walletAddress,
      to: "0xf00ba12f00000000b4121200000f00c0ffeef00d",
      gas: "0x61a80",
      maxPriorityFeePerGas: "0x50",
      maxFeePerGas: "0x9502F900",
      nonce: "0x0",
      value: "0x10000000000",
    },
  } as Eth1SignRequest;

  // Sign the transaction and refresh the session 3 times
  for (let i = 0; i < 3; i++) {
    // Sign the transaction
    const resp = await signEvm(session, walletAddress, exampleEVMReq);
    console.log(`Signature: ${resp.rlp_signed_tx}`);

    // Refresh session
    console.log("Refreshing session...");
    session = await refreshSession(session);
  }
}

/**
 * Call server to create user (and EVM key).
 *
 * @param proof The identity proof used to create the user.
 */
async function createUser(proof: IdentityProof) {
  const response = await fetch("/createUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(proof),
  });
  if (response.status !== 200) {
    throw new Error("Failed to create new user");
  }
}

/**
 * Get all EVM key addresses from the current session.
 *
 * @param session The current session.
 * @returns A promise that resolves to an array of EVM key addresses.
 */
async function getEvmKeys(session: NewSessionResponse): Promise<string[]> {
  const resp = await fetch(
    `${rootUrl}/v0/org/${encodeURIComponent(orgName)}/token/keys`,
    {
      method: "GET",
      headers: {
        Authorization: session.token,
      },
    }
  );

  if (!resp.ok) {
    throw await resp.json();
  }

  const keys: { key_type: string; material_id: string }[] = (await resp.json())
    .keys;
  const evmKeys = keys.filter((k) => k.key_type === "SecpEthAddr")
                      .map(k => k.material_id);
  if (!evmKeys) {
    throw new Error("No EVM key found");
  }
  return evmKeys;
}

/**
 **************************************************************************************
 * NOTE:
 * The functions below are wrappers around fetch()ing the CubeSigner API.
 * They make some simplifying assumptions:
 * - They don't retry requests
 * - They assume no MFA policies (e.g., on OIDC-based login or signing).
 * Take a look at the official CubeSigner SDK if either of these are important to you.
 **************************************************************************************
 */

/**
 * Get proof of authentication from CubeSigner using a given OIDC token.
 *
 * @param oidcToken The OIDC token to use for authentication.
 * @returns A promise that resolves to the identity proof.
 */
async function getOidcProof(oidcToken: string): Promise<IdentityProof> {
  const resp = await fetch(
    `${rootUrl}/v0/org/${encodeURIComponent(orgName)}/identity/prove/oidc`,
    {
      method: "post",
      headers: { Authorization: oidcToken },
    }
  );

  if (!resp.ok) {
    throw await resp.json();
  }

  return (await resp.json()) as IdentityProof;
}

/**
 * Login with OIDC token and create signer session with given scopes.
 *
 * @param oidcToken The OIDC token to use for authentication.
 * @param scopes The scopes to be used for the session.
 * @returns A promise that resolves to the new session response.
 */
async function loginWithOidcToken(
  oidcToken: string,
  scopes: string[]
): Promise<NewSessionResponse> {
  const resp = await fetch(
    `${rootUrl}/v0/org/${encodeURIComponent(orgName)}/oidc`,
    {
      method: "post",
      headers: { Authorization: oidcToken },
      body: JSON.stringify({ scopes }),
    }
  );

  if (!resp.ok) {
    throw await resp.json();
  }

  return (await resp.json()) as NewSessionResponse;
}

/**
 * Refresh session if expired. Once the new session token is used the old one will no
 * longer be valid -- and must not be used again.
 *
 * @param session The current session.
 * @returns A promise that resolves to a new session if expired and old one otherwise.
 */
async function refreshSession(
  session: NewSessionResponse
): Promise<NewSessionResponse> {
  if (session.session_info.auth_token_exp >= Date.now() / 1000) {
    console.log("Don't need to refresh... auth token is still valid.");
    return session;
  }
  const resp = await fetch(
    `${rootUrl}/v1/org/${encodeURIComponent(orgName)}/token/refresh`,
    {
      method: "PATCH",
      headers: {
        Authorization: session.token,
      },
      body: JSON.stringify({
        epoch_num: session.session_info.epoch,
        epoch_token: session.session_info.epoch_token,
        other_token: session.session_info.refresh_token,
      }),
    }
  );

  if (!resp.ok) {
    throw await resp.json();
  }

  return (await resp.json()) as NewSessionResponse;
}

/**
 * Sign EVM given session, from-address, and signing request.
 *
 * @param session The current session.
 * @param from The address from which to sign the transaction.
 * @param req The signing request.
 * @returns A promise that resolves to the signed transaction.
 */
async function signEvm(
  session: NewSessionResponse,
  from: string,
  req: Eth1SignRequest
): Promise<Eth1SignResponse> {
  const resp = await fetch(
    `${rootUrl}/v1/org/${encodeURIComponent(orgName)}/eth1/sign/${from}`,
    {
      method: "POST",
      headers: {
        Authorization: session.token,
      },
      body: JSON.stringify(req),
    }
  );

  if (!resp.ok) {
    throw await resp.json();
  }

  return (await resp.json()) as Eth1SignResponse;
}

/**
 * Types from the CubeSigner openapi.json
 *
 * See:
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK/blob/main/packages/sdk/src/schema.ts
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK/blob/main/packages/sdk/spec/openapi.json
 */

type Eth1SignRequest = {
  /**
   * Format: int64
   *
   * @description The chain id to set in the given transaction.
   */
  chain_id: number;
  /**
   * @description EIP-2718 typed transaction (see the [ethers-rs
   * interface](https://docs.rs/ethers/latest/ethers/core/types/struct.Eip1559TransactionRequest.html))
   * types, including EIP-1559 transactions (`{ "type": "0x02" ... }`), and
   * legacy transactions (`{ "type": "0x00" ... }`). All values in the
   * transaction are expected to be (0x-prefixed or not) hex strings or byte
   * arrays.
   */
  tx: Record<string, never>;
};

type Eth1SignResponse = {
  /**
   * @description Hex-encoded RLP encoding of the transaction and its signature
   * @example 0x22895118000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001201d58656b0e22aaa68fdc692db41979098c3886ed33015d7467de9211609cdac000000000000000000000000000000000000000000000000000000000000000308b0c2900324d3ff9adfba7fdfe5af3f9b2cdbeef7b280437bbf1b1c59a093d615afe3e5dfed9622b540cdd9b49b3c5ad00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002001000000000000000000000049011adbcc3bc9c0307bb07f37dda1a1a9c69d2e0000000000000000000000000000000000000000000000000000000000000060903db8525674b8e7904f9b7d7d9ec55a0a42d33cf58be25469b0c21bbb6d06172bc5bb5fd1aed8e4f35936968958116b0619553c2cb1c52e7323074c6f8eb3d5a7074fc6580148df907837fa3b164ad7fbc2288dad1e8a5b021095b57c8a36d4
   */
  rlp_signed_tx: string;
};

/** The type returned whenever a new session is minted */
type NewSessionResponse = {
  /** The auth token, to be used as the `Authorization` header in subsequent requests */
  token: string;

  /** The time (in seconds since UNIX epoch) when the whole session will expire */
  expiration: number;

  /** Information necessary to refresh the token */
  session_info: {
    /** A stable identifier for this session. Does not change across refreshes */
    session_id: string;

    /** Used as an input into the refresh endpoint */
    refresh_token: string;

    /** A monotonic counter for how many times the session has been refreshed (useful for debugging) */
    epoch: number;

    /** A token unique to this epoch. Used as an input to the refresh endpoint */
    epoch_token: string;

    /** Expiration time for the auth token, after which a refresh is required (in seconds since UNIX epoch) */
    auth_token_exp: number;

    /** Expiration time for the refresh token, after which refreshing is impossible */
    refresh_token_exp: number;
  };
};

/** Proof that an end-user provided CubeSigner with a valid auth token */
type IdentityProof = {
  /** OIDC audience (set only if the proof was obtained by using OIDC token) */
  aud?: string | null;
  /** email associated with the user */
  email?: string | null;
  /** Expiration epoch. */
  exp_epoch: number;
  /** OIDC idenity (set if user exists, null otherwise) */
  identity?: OIDCIdentity | null;
  /** The username (if any) associated with the user */
  preferred_username?: string | null;
  /** */
  user_info?: CubeSignerUserInfo | null;
};

/* Represents a globally unique OIDC-authorized user by expressing the full "path" to a user. */
type OIDCIdentity = {
  /**
   * From the OIDC spec:
   * Issuer Identifier for the Issuer of the response. The iss
   * value is a case sensitive URL using the https scheme that contains
   * scheme, host, and optionally, port number and path components and
   * no query or fragment components.
   *
   * @example https://accounts.google.com
   */
  iss: string;
  /**
   * From the OIDC spec:
   * A locally unique and never reassigned identifier within the Issuer for
   * the End-User, which is intended to be consumed by the Client, e.g.,
   * 24400320 or AItOawmwtWwcT0k51BayewNvutrJUqsvl6qs7A4. It MUST NOT exceed
   * 255 ASCII characters in length. The sub value is a case sensitive
   * string.
   *
   * @example 10769150350006150715113082367
   */
  sub: string;
};

/** Existing user information. */
type CubeSignerUserInfo = {
  /** All multi-factor authentication methods configured for this user */
  configured_mfa: ConfiguredMfa[];
  /** Set once the user successfully logs into CubeSigner */
  initialized: boolean;
  /** Optional human name for the user */
  name?: string | null;
  /** CubeSigner's user identifier */
  user_id: string;
};

/** MFA configuration (TOTP or FIDO) */
type ConfiguredMfa =
  | { type: "totp" }
  | {
      type: "fido";
      /** A unique credential id */
      id: string;
      /** A human-readable name given to the key */
      name: string;
    };
