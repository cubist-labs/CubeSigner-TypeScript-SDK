# CubeSigner TypeScript SDK: Sign-In with Solana Example

This example shows how to create a new third-party user identified
by a Solana address and then log in as that user by proving
ownership of that Solana address (following the
[Sign-In with Solana (SIWS)](https://github.com/phantom/sign-in-with-solana) standard).

## Running the Example

To run the example, you need to log in with a user session that has at least the
following scopes: `manage:readonly`, `manage:org:addUser`, and `manage:org:deleteUser`.

```bash
export CUBE_SIGNER_TOKEN=$(cs token create --scope 'manage:readonly' --scope 'manage:org:addUser' --scope 'manage:org:deleteUser' --output base64)
```

Note that the CubeSigner org must be configured to allow the `https://shim.oauth2.cubist.dev/siws`
OIDC issuer, i.e., the org policy must contain the following snippet:

```json
{
  "OidcAuthSources": {
    "https://shim.oauth2.cubist.dev/siws": ["YOUR_ORG_ID"]
  }
}
```

where `YOUR_ORG_ID` is replaced with your actual org id.

Finally, execute the example:

```bash
npm ci && npm run build && npm run start
```

This example will:

- locally generate a new Solana wallet (i.e., outside of CubeSigner)
- add to the current org a new third-party CubeSigner user with the SIWS identity of the newly generated wallet
- log in as the newly created user just by completing a SIWS challenge
  (i.e., rendering the returned `SignInInput` to its canonical message text and signing it with the local wallet)
- delete the newly created user
