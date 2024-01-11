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

- The landing page calls CubeSigner to obtain an identity proof

  ```typescript
  const identity = await getOidcProof(oidcToken);
  ```

  The returned identity specifies whether a CubeSigner user exists for that OIDC identity;
  if it doesn't, the page calls `/createUser`, passing `identity` along as evidence.

- `/createUser` is called by our landing page to create a new OIDC user (and a
  new key for the user) after the user logs in client side. We call this
  endpoint with the proof of user's identity obtained from CubeSigner.

  Creating a new OIDC user requires a management session. This example uses
  `CubeSigner.loadManagementSession()` to load a management session from the
  default config directory on the server. If the user does not exist, the
  route first creates the user using `Org.createOidcUser()`, setting up an MFA
  policy requiring the user to provide one additional auth factor before being
  able to log in with their OIDC token.

  It finally creates a key for the user using `Org.createKey()`.

- The landing page, now that it ensured that a corresponding CubeSigner user exists,
  checks the `identity` object again to see if MFA has been configured.
  If it hasn't, it proceeds to register a new FIDO key.

  ```typescript
  if ((identity.user_info?.configured_mfa ?? []).length === 0) {
    console.log("No MFA set up; adding FIDO now");
    await setUpFido(oidcToken);
  }
  ```

- Finally, the landing page signs a dummy EVM transaction. To be able to call
  CubeSigner's signing endpoints, the user needs to log in and obtain a signer
  session (in this case scoped to just `sign:*`):
  ```typescript
  const sessionMgr = await oidcLogin(oidcToken, ["sign:*"]);
  ```
  The `oidcLogin` process will now require MFA, so the user will be prompted
  to tap the FIDO key they registered in the previous step. After that is done,
  the returned session is used to call `signEvm`
  ```typescript
  const oidcSession = new cs.SignerSession(sessionMgr);
  const key = (await oidcSession.keys())[0];
  const resp = await oidcSession.signEvm(key.material_id, { ... });
  const sig = resp.data();
  ```

## Registering a FIDO key

Registering a new FIDO key is a two-step process:

- initiate key registration
  ```typescript
  const addFidoResp = await cubesigner.addFidoStart("My Fido Key");
  const challenge = addFidoResp.data();
  ```
- answer the challenge returned by the previous step
  ```typescript
  await challenge.createCredentialAndAnswer();
  ```

Answering the challenge involves calling the browsers [`CredentialContainer.create`](https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/create)
method to create a new credential for the given challenge. The `createCredentialAndAnswer`
method above does that automatically and sends the answer back to CubeSigner; if you'd
like to customize the process, you can obtain the credential yourself and then pass it back:

```typescript
const cred = await navigator.credentials.create({ publicKey: challenge.options });
await challenge.answer(cred);
```

## Approving MFA with FIDO

Approving an MFA request with an existing FIDO key is also a two-step process:

- initiate approval

  ```typescript
  // assert response requires MFA
  assert(resp.requiresMfa());

  // for OIDC log in requests the response includes an "mfa session" you can use to approve MFA;
  // in other cases, you need to have a session that has a `manage:mfa` scope
  const mfaSession = resp.mfaSessionInfo();
  const mfaSessionMgr = await cs.SignerSessionManager.createFromSessionInfo(env, orgId, mfaSession);
  const signerSession = new cs.SignerSession(mfaSessionMgr);

  // start the approval process with FIDO
  const mfaId = resp.mfaId();
  const challenge = await signerSession.fidoApproveStart(mfaId);
  ```

- answer the challenge returned by the previous step

  ```typescript
  // answer the challenge
  const mfaInfo = await challenge.createCredentialAndAnswer();
  console.log("MFA info", mfaInfo);
  assert(mfaInfo.receipt);

  // proceed with the obtained MFA approval
  resp = await resp.signWithMfaApproval({
    mfaId,
    mfaOrgId: orgId,
    mfaConf: mfaInfo.receipt.confirmation,
  });
  ```

Answering the MFA FIDO challenge involves calling the browser's [`CredentialContainer.get`](https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/get)
method and returning the result back to CubeSigner. the `createCredentialAndAnswer`
method above does that automatically, but you could break it up into separate steps:

```typescript
const cred = await navigator.credentials.get({ publicKey: challenge.options });
await challenge.answer(cred);
```

## NOTE about setting "Relying Party" when testing locally

When running this example on localhost, you must update the "RP ID" field
of the challenge returned by CubeSigner and set it to `localhost` before
giving it to `CredentialContainer`.

Also note that the name of the field is different for the two different
challenges:

1. when registering a new FIDO key:

```typescript
const addFidoResp = await cubesigner.addFidoStart("My Fido Key");
const challenge = addFidoResp.data();

challenge.options.rp.id = "localhost"; // only needed when testing locally
```

2. when approving MFA with FIDO:

```typescript
const challenge = await signerSession.fidoApproveStart(mfaId);

challenge.options.rpId = "localhost"; // only needed when testing locally
```
