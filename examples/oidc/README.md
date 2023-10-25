# CubeSigner TypeScript SDK: OIDC Example

This example shows how the CubeSigner TypeScript SDK can be used to
authenticate users using a third party service. CubeSigner uses the
[OIDC](https://openid.net/developers/how-connect-works/) authentication
standard and currently supports Google as an authentication service.

The example implements a simple webserver, which asks the user to authenticate
using Google, creates a new CubeSigner user for the Google user if it does not
exist, and then signs a dummy transaction on behalf of the user to demonstrate
how a user logged in using OIDC can access CubeSigner's signing service.

## Running the Example

1.  This example requires an OAuth 2.0 Client ID from Google and/or Apple.
    Before running the example, create a `.env` file with your client ids (see `.env.template` for the expected format).
    You can omit one them if you are only interested in testing one provider.

        - Google: A client id can be generated [here](https://console.cloud.google.com/apis/credentials).
        When creating the client id, set the type to "Web Application" and add
        both `http://localhost` and `http://localhost:3000` to the list of authorized JavaScript
        origins.

        - Apple: Running the example with appleid is a bit more complicated.
        First, you need to register an [app id](https://developer.apple.com/help/account/manage-identifiers/register-an-app-id) enabling sign in with apple in the capabilities.
        Next, you need to set up a [service id](https://developer.apple.com/help/account/manage-identifiers/register-a-services-id) for the app.
        The client id will be the identifier for the service.
        Then, you need to configure sign in with apple for the service setting a domain and a
        redirect URL.
        Apple won't let you use localhost or http, so you need to run the example under a real domain.
        You can use [ngrok](https://ngrok.com/) or similar if you want to run the example locally.
        Once you have a URL where the webserver can be accessed, set it in the `BASE_URL` variable
        in the `.env` file.
        Finally, configure the redirect URL in apple as `https://<BASE_URL>/oauth2callback`.

2.  Log into your org as the org owner and edit your org policies (`cs org set-policy --edit`) to specify the allowed client ids

    ```json
    [
      {
        "OidcAuthSources": {
          "https://accounts.google.com": ["<GOOGLE_CLIENT_ID>"],
          "https://appleid.apple.com": ["<APPLE_CLIENT_ID>"]
        }
      }
    ]
    ```

3.  To start the webserver, run `npm run start`.

## Implementation

The webserver defines two routes:

- `/` shows a button that asks the user to sign in with Google
- `/oauth2callback` is called by Google with an OIDC token and signs a dummy
  EVM transaction using that token

`/oauth2callback` first creates an OIDC user if it does not exist, creates a
new key for the user, and then uses that key to sign a dummy transaction.

Creating a new OIDC user requires a management session. This example uses
`CubeSigner.loadManagementSession()` to load a management session from the
default config directory on the server. To create a new user the route extracts
the user's identity from the OIDC token: `iss`, the issuing authority; and
`sub`, the subject). If the user does not exist, the route first creates the
user using `Org.createOidcUser()`, which returns the user's CubeSigner id. It
then creates a key for the user using `Org.createKey()` and sets the user to
the user's CubeSigner id of the newly created user.

To sign a transaction, the route first uses the OIDC token to create an OIDC
session manager using `CubeSigner.createOidcManager()` and then initializes a
`SignerSession` with this session manager. This action does not require a
management session. The route then lists the keys available to the signer
session (`SignerSession.keys()`) and uses the first key in the list to sign a
dummy EVM transaction using `SignerSession.signEvm()`.
