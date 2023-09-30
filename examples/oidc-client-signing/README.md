# CubeSigner TypeScript SDK: OIDC Example (client-side signing)

This example shows how the CubeSigner TypeScript SDK can be used to
authenticate users using a third party service and sign transactions in the
browser. CubeSigner uses the
[OIDC](https://openid.net/developers/how-connect-works/) authentication
standard and currently supports Google as an authentication service.

The example implements a single page for logging in with Google or Facebook OIDC and
signing an EVM transaction as this user. The webserver further implements a
simple route for creating third-party (or alien) users that authenticate with
OIDC to access CubeSigner's signing service.

## Running the Example

1. This example requires an OAuth 2.0 Client ID from Google and Facebook:

   - Google: A client id can be generated [here](https://console.cloud.google.com/apis/credentials).
     When creating the client id, set the type to "Web Application" and add both `http://localhost` and
     `http://localhost:3000` to the list of authorized JavaScript origins.

   - Facebook: You can create a Facebook login app [here](https://developers.secure.facebook.com/apps/)
     Make sure to add `localhost` to the app domains (`App settings > Basic`). The client id is what
     Facebook calls the app id.

   Before running the example, create a `.env` file with the client id for Google and Facebook
   (see `.env.template` for the expected format). You can omit one of them if you only want to try
   one provider.

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
         "https://www.facebook.com": ["<FACEBOOK_CLIENT_ID>"]
       }
     },
     {
       "OriginAllowlist": ["http://localhost:3000"]
     }
   ]
   ```

4. Start the webserver: `npm run start`.

## Implementation

The webserver defines two routes:

- `/` renders the [landing page](./views/layouts/main.handlebars) that
  implements the login-with-Google and signing.

  This page uses the OIDC token to create a new signer session
  `SignerSession(... oidcToken ...)` Then it lists the keys available to the
  signer session (`SignerSession.keys()`) and uses the first key in the list to
  sign a dummy EVM transaction using `SignerSession.signEvm()`.

  We bundle the CubeSigner TypeScript SDK to run it client side; we could load
  it from npm instead.

- `/createUser` is called by our landing page to create a new OIDC user (and a
  new key for the user) after the user logs in client side. We call this
  endpoint with the user's identity, extracted from the OIDC token: `iss`, the
  issuing authority; and `sub`, the subject. In practice you would validate the
  OIDC token server side before creating a new user.

  Creating a new OIDC user requires a management session. This example uses
  `CubeSigner.loadManagementSession()` to load a management session from the
  default config directory on the server. If the user does not exist, the
  route first creates the user using `Org.createOidcUser()`, which returns
  the user's CubeSigner id. It then creates a key for the user using
  `Org.createKey()` and sets the user to the user's CubeSigner id of the
  newly created user.
