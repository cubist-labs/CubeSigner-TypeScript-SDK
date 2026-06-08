# SDK-free OIDC Client-side EVM Transaction Signing Example

This example is a simplified version of the [oidc-client-signing
example](https://github.com/cubist-labs/CubeSigner-TypeScript-SDK/tree/main/examples/oidc-client-signing)
that shows you how to call the CubeSigner API directly to authenticate using an
[OIDC](https://openid.net/developers/how-connect-works/)
provider---specifically, Google---and sign EVM transaction.

Unlike the [oidc-client-signing
example](https://github.com/cubist-labs/CubeSigner-TypeScript-SDK/tree/main/examples/oidc-client-signing),
which is more comprehensive, this example does _not_ use the SDK client-side to
show you how to make requests to the API directly. This is useful if you're
implementing this logic yourself and can't use the SDK. If you can use the SDK,
we recommend using it instead---it handles retries, session refreshing, MFA
approvals, etc. so you don't have to.

The example implements a single page for logging in with Google OIDC and signing
an EVM transaction as this user.

The Node.js server uses the CubeSigner TypeScript SDK to implement a simple
route for creating third-party (or alien) users that authenticate with OIDC to
access CubeSigner's signing service. Like the client-side code you could also
just use the API directly.

## Running the Example

1. This example requires an OAuth 2.0 Client ID from Google. A client id 
   can be generated [here](https://console.cloud.google.com/apis/credentials).
   When creating the client id, set the type to "Web Application" and add
   both `http://localhost` and `http://localhost:3000` to the list of
   authorized JavaScript origins.

  Before running the example, create a `.env` file with the Google client id
  (see `.env.template` for the expected format).

2. Set `ORG_ID` in the `.env` to your org id. Like the client id we use the org
   id when rendering the example landing page.

3. Log into your org as the org owner and edit your org policies (`cs org
set-policy --edit`) to (1) specify the allowed client id and (2) allow-list
   the origin of your website (in our example `http://localhost:3000`):

   ```json
   [
     {
       "OidcAuthSources": {
         "https://accounts.google.com": ["<GOOGLE_CLIENT_ID>"],
       }
     },
     {
       "OriginAllowlist": ["http://localhost:3000"]
     },
     {
       "WebAuthnRelyingParties": [
         {
           "id": "localhost",
           "name": "CubeSigner Local Testing"
         }
       ]
     }
   ]
   ```

   Note that the `WebAuthnRelyingParties` policy is needed only when
   running this example locally, on localhost.

3. Create a management session (to use for creating users and keys):

   ```bash
   cs login ... --scope manage-org-add-user --scope manage-key-create
   ```

4. Start the webserver: `npm run start`.

## Implementation

The webserver defines two routes:

- `/createUser`, which is called by the client to create a new OIDC user (and a
  new key for the user) after the user logs-in client-side. We call this endpoint
  with the proof of user's identity obtained from CubeSigner.

  Creating a new OIDC user requires a management session. This example uses
  `defaultManagementSessionManager()` to load a management session from the
  default config directory on the server, once for the app.  If the user does
  not exist, the route creates the user using `createOidcUser()`, and their
  EVM using `createKey()`.

- `/` renders the [landing page](./views/index.handlebars) that has the
  sign-in-with-Google button and loads the client [core logic](./public/main.ts).

The client-side code:

- Defines the API endpoints and request/response types (following the CubeSigner
  OpenAPI spec) we need for this example.
- Exposes a function `loginWithOidcTokenAndSignTx` which is called when the
  user signs-in with Google.  This function uses the Google-provided OIDC token
  (when the user logs in) to:
  1. Obtain an identity proof by calling `getOidcProof(...)`.
     The returned identity proof specifies whether a CubeSigner user exists
     for that OIDC identity; if it doesn't, the client calls the
     `/createUser` server endpoint, passing `identityProof` along as
     evidence. The server creates the user by calling CubeSigner in turn.
  2. Create a new signer session on behalf of the user, and then:
     - List the user's available EVM keys,
     - Three times:
       - Use the first EVM key in the list to sign a dummy EVM transaction,
       - Call the refresh session token endpoint to refresh the signer session token (if the token expired).

## Where to go from here?

This is a simplified example that only handles Google login and, moreover, does
not handle the case where users have an MFA policy for login or transaction
signing. The [oidc-client-signing
example](https://github.com/cubist-labs/CubeSigner-TypeScript-SDK/tree/main/examples/oidc-client-signing)
handles all these cases using the SDK.