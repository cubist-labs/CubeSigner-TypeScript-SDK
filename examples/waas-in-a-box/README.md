# WaaS in a box

This example implements a Wallet-as-a-Service provider (server and client web app) using CubeSigner.

This includes:
 - OIDC logins
 - User registration
 - End-user signing

Comments throughout the code correspond to the [End-User Wallets] section
of the [CubeSigner docs].

## Setup

1. Edit the `.env` file to include:

   - Your Org ID,
   - Your OAuth Client information (optional)

   By default, this example uses a testing-only Google OAuth client provided by
   Cubist. It will only ever work on `localhost`. If you wish use your own client,
   you can put the relevant information in the `.env` file. You will need to register
   `http://localhost:3000` as a redirect URI.

2. Configure your org
   Follow the [setup instructions], to enable the OAuth Client (`issuer` and `client_id`)
   defined in the `.env` file. You must also add `http://localhost:3000` to your
   `OriginAllowlist`.

## Running the example

Simply invoke:

```bash
npm start
```

and navigate to `http://localhost:3000`

[setup instructions]: https://signer-docs.cubist.dev/end-user-wallets/setup
[End-User Wallets]: https://signer-docs.cubist.dev/end-user-wallets
[CubeSigner docs]: https://signer-docs.cubist.dev/
