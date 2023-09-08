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

This example requires an OAuth 2.0 Client ID from Google. A client id can be
generated [here](https://console.cloud.google.com/apis/credentials). When
creating the client id, the type must be set to "Web Application" and
`http://localhost:3000` has to be added to the list of authorized JavaScript
origins. Before running the example, create an `.env` file with your client id
(see `.env.template` for the expected format).

To start the webserver, run `npm run start`.

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
