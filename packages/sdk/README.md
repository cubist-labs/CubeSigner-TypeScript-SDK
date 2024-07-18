# CubeSigner TypeScript SDK

CubeSigner is a hardware-backed, non-custodial platform for securely
managing cryptographic keys. This repository is the TypeScript SDK for
programmatically interacting with CubeSigner services.

## CubeSigner background

[The Cubist team](https://cubist.dev/about) built CubeSigner to address the key
security vs key availability tradeoff: right now, many teams are forced to keep
keys available in memory and therefore exposed to attackers, or try to keep
keys safe—usually only at rest—at serious latency and engineering cost.
CubeSigner addresses this problem by giving developers low-latency access to
hardware-backed key generation and signing. During each of these operations,
CubeSigner safeguards their users' keys in HSM-sealed Nitro Enclaves—combining
cold wallet security with hot wallet speed and simplicity.

Right now, the CubeSigner SDK supports signing for EVM chains like Ethereum
and Avalanche, and non-EVM chains Bitcoin and Solana. Support for more chains
is in the works!

## Installing the SDK

You can install the SDK from npm:

```bash
npm install --save "@cubist-labs/cubesigner-sdk"
npm install --save "@cubist-labs/cubesigner-sdk-fs-storage" # support for filesystem-backed sessions
```

## Logging into CubeSigner

Before running the "getting started" examples below (or tests later), you must
log into your CubeSigner organization using the `cs` command-line tool, e.g.,

```bash
cs login owner@example.com --env '<gamma|prod|...>'
```

## Getting started

> [!TIP]
> For migration from `v0.3.*` to `v0.4.*`, please see [MIGRATION.md](/MIGRATION.md#v03-to-v04)

In this section we are going to walk through a simple CubeSigner
setup. We'll create a signing key, then sign some EVM
transactions, and then add a security policy to restrict the kinds of
transactions that CubeSigner is allowed to sign.

To start, we'll instantiate the top-level `CubeSignerClient` class from an
existing CubeSigner management session already stored on disk
(remember, you must already be logged in).

Let's also assume that the following imports are available to all the
examples below.

```typescript
import * as cs from "@cubist-labs/cubesigner-sdk";
import { JsonFileSessionManager, defaultManagementSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import assert from "assert";
```

### Instantiate `CubeSignerClient`

The first order of business is to create an instance of `CubeSignerClient`.
We can do that by simply loading a session token from the
default location on disk (which is where the `cs login` command saves
it):

```typescript
const cubesigner = await cs.CubeSignerClient.create(defaultManagementSessionManager());
```

Alternatively, a `CubeSignerClient` instance can be created by explicitly
providing a session manager:

```typescript
// Create a session manager backed by a JSON file
const fileStorage = new JsonFileSessionManager(
  `${process.env.HOME}/.config/cubesigner/management-session.json`,
);
await cs.CubeSignerClient.create(fileStorage);
```

### Get `User` and `Org` info

We can now obtain some information about the logged-in user and the
organization the user belongs to:

```typescript
const me = await cubesigner.user();
console.log(me);
assert(me.user_id); // each user has a globally unique ID
assert(me.org_ids); // IDs of all organizations this user is a member of
assert(me.org_ids.length === 1); // assume that the user is a member of exactly one org

const org = await cubesigner.org();
assert(await org.enabled()); // assume that the org is enabled
```

There is a lot more to do with an organization, like creating/listing
keys, creating/listing roles, setting up org-wide security policies,
etc.

For the rest of this tutorial, we assume the logged-in user is a
member of at least one organization.

### Create a `Key`

Next, let's create a key that we'll later use to sign an Ethereum
transaction. For that, we need a key of type `Secp256k1.Evm`.

```typescript
const secpKey = await org.createKey(cs.Secp256k1.Evm);
assert((await secpKey.owner()) == me.user_id);
assert(await secpKey.enabled());
assert(await secpKey.type(), cs.Secp256k1.Evm);
console.log(`Created '${cs.Secp256k1.Evm}' key ${secpKey.id}`);
```

### Sign an Ethereum transaction

Let's create a dummy `EvmSignRequest`.

```typescript
const eth1Request = <cs.EvmSignRequest>{
  chain_id: 1,
  tx: {
    to: "0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b",
    type: "0x00",
    gas: "0x61a80",
    gasPrice: "0x77359400",
    nonce: "0",
    value: "0x100",
  },
};
```

It seems we have everything in place to sign this request with the
previously created key. However, attempting to do so fails with `403
Forbidden` saying something like `Session does not have the required scopes...`

```typescript
try {
  console.log("Trying to sign with improper scopes");
  await secpKey.signEvm(eth1Request);
  assert(false, "Must not be allowed to sign without scopes");
} catch (e) {
  assert(`${e}`.includes("Session does not have required scopes"));
}
```

By default, the sessions created by the CLI cannot perform signing operations. All sessions have a series of *scopes* which
which determine what that session can be used for. We'll talk more about this later, but for now just know that we need a new session with the proper scopes:

```typescript
let signingClient = await cs.CubeSignerClient.create(
  // declare the "sign:*" scope which allows us to sign using any keys the
  // account has access to
  await cubesigner.org().createSession("readme signing demo", ["sign:*"]));
const signingKey = new cs.Key(signingClient, secpKey.cached);
let sig = await signingKey.signEvm(eth1Request);
console.log(sig.data());
assert(sig.data().rlp_signed_tx);
```

### Using ethers.js instead of the SDK directly

If your application uses ethers.js, you can configure it to use CubeSigner to
sign transactions.


```typescript
import { Signer } from "@cubist-labs/cubesigner-sdk-ethers-v6";
import { ethers } from "ethers";

// Create new Signer
const ethersSigner = new Signer(secpKey.materialId, signingClient);
assert((await ethersSigner.getAddress()) === ethers.getAddress(secpKey.materialId));
// sign transaction as usual:
console.log(
  "ethers.js signature:",
  await ethersSigner.signTransaction({
    chainId: 1,
    to: "0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b",
    value: ethers.parseEther("0.0000001"),
  }),
);
```


### Access control with `Role`

CubeSigner uses roles to control access to keys when more than one user wants to
use them. You can think of roles as groups
that give certain users access to certain keys. To get started, let's
create a `Role` and then simply call `createSession` on it:

```typescript
// Create a role, implicitly adding ourselves as a member
const role = await org.createRole();

console.log("Adding key to role, then signing an Ethereum transaction");
await role.addKey(secpKey);

// Members of the role can create sessions which can only access keys in the role
const roleClient = await cs.CubeSignerClient.create(
  // Role sessions implicitly have the "sign:*" scope
  await role.createSession("readme")
);
console.log(`Created client for role '${role.id}'`);
```

### Set security policies

When we add a `Secp256k1.Evm` key to a role (as we did above), a client
associated with that role allows us to sign **any** Ethereum
transaction with that key. If that seems too permissive, we can attach a security
policy to restrict the allowed usages of this key in this role.

For example, to restrict signing to transactions with a pre-approved
recipient, we can attach a `TxReceiver` policy to our key:

```typescript
console.log("Setting transaction receiver policy");
await secpKey.setPolicy([{ TxReceiver: "0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b" }]);
console.log("Signing transaction");
const roleKey = new cs.Key(roleClient, secpKey.cached);
sig = await roleKey.signEvm(eth1Request);
assert(sig.data().rlp_signed_tx);
```

Try changing the transaction receiver and verify that the transaction
indeed gets rejected:

```typescript
console.log("Signing a transaction to a different receiver must be rejected");
try {
  await roleKey.signEvm({
    chain_id: 1,
    tx: <any>{
      ...eth1Request.tx,
      to: "0x0000000000000000000000000000000000000000",
    },
  });
  assert(false, "Must be rejected by policy");
} catch (e) {
  assert(`${e}`.includes("Transaction receiver not allowed by policy"));
}
```

> **Warning**
> Setting new policies overwrites the previous ones. Call
> `Key::appendPolicy` instead of `Key::setPolicy` to append to
> existing policies.



### Sign a raw blob

The `CubeSignerClient` class exposes the `signBlob` method, which signs
an arbitrary (raw, uninterpreted) bag of bytes with a given key. This
operation, however, is not permitted by default; it is permanently
disabled for `BLS` keys, and for other key types it can be enabled by
attaching an `"AllowRawBlobSigning"` policy:

```typescript
// Create a new Ed25519 key (e.g., for Cardano) and add it to our roleClient's role
const edKey = await org.createKey(cs.Ed25519.Cardano);
await role.addKey(edKey);
console.log(`Created '${await edKey.type()}' key ${edKey.id} and added it to role ${role.id}`);

// Sign raw blobs with our new ed key and the secp we created before
for (const key of [edKey, secpKey]) {
  console.log(`Confirming that raw blob with ${await key.type()} is rejected by default`);
  const roleKey = new cs.Key(roleClient, key.cached);
  const blobReq = <cs.BlobSignRequest>{
    message_base64: "L1kE9g59xD3fzYQQSR7340BwU9fGrP6EMfIFcyX/YBc=",
  };
  try {
    await roleKey.signBlob(blobReq);
    assert(false, "Must be rejected by policy");
  } catch (e) {
    assert(`${e}`.includes("Raw blob signing not allowed"));
  }

  console.log("Signing raw blob after adding 'AllowRawBlobSigning' policy");
  await key.appendPolicy(["AllowRawBlobSigning"]);
  const blobSig = await roleKey.signBlob(blobReq);
  console.log(blobSig.data());
  assert(blobSig.data().signature);
}
```

> **Warning**
> When signing a raw blob with a `Secp256k1` key, the blob **MUST** be the output of a secure hash function like SHA-256, and must be exactly 32 bytes long. This is a strict requirement of the ECDSA signature algorithm used by Bitcoin, Ethereum, and other blockchains. Signing any byte string that is not the output of a secure hash function can lead to catastrophic security failure, including completely leaking your secret key.

Trying to sign an invalid message with a secp key will fail with
`400 Bad Request` saying `Signature scheme: InvalidMessage`.

## Session Management

In the above examples we've used 3 different sessions:

1. A management session that we created using the CLI
2. A signing session that we created using (1)
3. A role session that we created used (1)

All `CubeSignerClient`s require a valid session in order to operate. In this section
we'll dive into the specifics of sessions in the TypeScript SDK.

### Loading from disk
If you already have an active session in `cs` (the CubeSigner CLI), you can
load it into the TypeScript SDK with a simple helper (as we did earlier).

```typescript
await cs.CubeSignerClient.create(defaultManagementSessionManager())
```

Or we can use the CLI to create our own session explicitly for our JavaScript client:

```bash
cs session create --role-id $ROLE_ID --scope sign-all --output json > session.json
```

Then we can load it like so:
```typescript
try {
  await cs.CubeSignerClient.create(new JsonFileSessionManager("./session.json"));
} catch {
  console.error("Unable to find file")
}
```

### Loading from Memory
If you already have the session information (`SessionData` in Typescript) in memory, you can
load that directly into a client.

```typescript
// Get the session data we want to use with the client
const sessionData: cs.SessionData = await role.createSession("readme");
await cs.CubeSignerClient.create(new cs.MemorySessionManager(sessionData))
// or, for short
await cs.CubeSignerClient.create(sessionData)
```

> [!WARNING]  
> Clients created this way will automatically refresh the session. If you try to use this session with another client, they will both try to refresh, leading to failures.

### Managers, Storage and Refreshing

As we've seen in the examples above, all `CubeSignerClient`s are constructed using the `create` constructor. The `create`
constructor accepts either raw `SessionData` or a `SessionManager`. So far we've seen two different session managers:
 - `JsonFileSessionManager`
 - `MemorySessionManager`

These managers are responsible for keeping your session tokens refreshed
and (optionally) persisted. Whenever your session tokens are refreshed,
`JsonFileSessionManager` will write the new tokens to disk.

More complex managers can be written by implementing the `SessionManager` interface.

### Create a session for an OIDC user

CubeSigner supports the [OIDC](https://openid.net/developers/how-connect-works/)
standard for authenticating third-party users.

First, we need an OIDC token. We can get one from Google or any other
supported OIDC issuer! For the purpose of this example, we'll assume
the OIDC token is stored in the `OIDC_TOKEN` environment variable

```typescript
import * as dotenv from "dotenv"; // npm install dotenv@16.3.1
dotenv.config();

const oidcToken = process.env["OIDC_TOKEN"];
assert(oidcToken);
```

Before we can use the OIDC token for authentication, we must add an org policy
to allow the particular issuer/audience pair from the token.

```
const oldOrgPolicy = await org.policy();
const oidcPayload = JSON.parse(atob(oidcToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
const oidcAuthSourcesPolicy = {
  OidcAuthSources: {
    [oidcPayload.iss]: [oidcPayload.aud],
  },
};
console.log("Setting org policy", oidcAuthSourcesPolicy);
await org.setPolicy([oidcAuthSourcesPolicy]);
```

Finally, exchange the OIDC token for a session.

```typescript
const oidcSessionResp = await cs.CubeSignerClient.createOidcSession(
  cubesigner.env,
  org.id, // org id to log into
  oidcToken,
  ["manage:mfa:*", "sign:*"] // scopes for the session 
);
const oidcClient = await cs.CubeSignerClient.create(oidcSessionResp.data());
```

> **Info**
> For full details on how to use this SDK to create a CubeSigner
> account for a third-party user and then exchange a valid OIDC token
> CubeSigner session, check out the [OIDC Example](/examples/oidc/README.md).

### Set up TOTP for a user

To manage a user we need a session bound to that user. It
doesn't matter if that user is native to CubeSigner or a third-party
OIDC user. For that purpose, in this section we are going to use the
previously created `oidcCubeSigner` instance.

To set up TOTP, we first call the `resetTotpStart` method to initiate a
TOTP reset procedure.

```typescript
console.log(`Setting up TOTP for user ${me.email}`);
let totpResetResp = await oidcClient.resetTotp();
```

If the user has already configured TOTP (or any other form of MFA),
this response will require multi factor authentication. In that case,
for example, call `totpApprove` and provide the code for the existing
TOTP to proceed:

```typescript
import { authenticator } from "otplib"; // npm install otplib@12.0.1

let totpSecret = process.env["CS_USER_TOTP_SECRET"]!;
if (totpResetResp.requiresMfa()) {
  console.log("Resetting TOTP requires MFA");
  const code = authenticator.generate(totpSecret);
  totpResetResp = await totpResetResp.totpApprove(oidcClient, code);
  assert(!totpResetResp.requiresMfa());
  console.log("MFA approved using existing TOTP");
}
```

The response contains a TOTP challenge, i.e., a new TOTP
configuration in the form of the standard
[TOTP url](https://github.com/google/google-authenticator/wiki/Key-Uri-Format).
From that url, we can generate a QR code to present to the user, or
create an authenticator for automated testing.

```typescript
const totpChallenge = totpResetResp.data();
assert(totpChallenge.url);
```

To complete the challenge, we must call `resetTotpComplete` and
provide the TOTP code matching the TOTP configuration from the challenge:

```typescript norun
totpSecret = new URL(totpChallenge.totp_url).searchParams.get("secret");
assert(totpSecret);
await totpChallenge.answer(authenticator.generate(totpSecret));
```

After TOTP is configured, we can double check that our authenticator
is generating the correct code by calling `verifyTotp`

```typescript
console.log(`Verifying current TOTP code`);
let code = authenticator.generate(totpSecret);
await oidcClient.verifyTotp(code);
```

We can also check that the user's profile now indeed includes `Totp`
as one of the configured MFA factors.

```typescript
const mfa = (await oidcClient.user()).mfa;
console.log("Configured MFA types", mfa);
assert(mfa.map((m) => m.type).includes("totp"));
```

### Configure MFA policy for signing

We've already discussed assigning a [security
policy](#set-security-policies) to a key; requiring multi-factor
authentication is another such policy.

Let's update our `secpKey` key to require an additional approval via
TOTP before anything may be signed with that key:

```typescript
console.log(`Require TOTP for key ${secpKey.materialId}`);
await secpKey.appendPolicy([{ RequireMfa: { count: 1, allowed_mfa_types: ["Totp"] } }]);
```

Now, when we call any signing operation on `secpKey`, we'll
receive `202 Accepted` instead of `200 Ok`. The response body contains
an MFA ID, which we can use to fetch and inspect the associated MFA
request, see how many approvals it requires, what kind of MFA factors
it allows, etc. Instead, since we know that our key requires TOTP, we
can just call `totpApprove` on the response and pass the current TOTP
code to it; if the code is correct, the call will succeed
and return the signature.

```typescript
console.log(`Signing a transaction now requires TOTP`);
const oidcKey = new cs.Key(oidcClient, secpKey.cached);
let resp = await oidcKey.signEvm(eth1Request);
assert(resp.requiresMfa());

console.log(`Approving with TOTP code`);
code = authenticator.generate(totpSecret);
resp = await resp.totpApprove(oidcClient, code);
assert(!resp.requiresMfa());
console.log(resp.data());
assert(resp.data().rlp_signed_tx);
```

### Clean up

Once we are done, we can revoke the signer session and delete the role
we created.

```typescript
console.log("Cleaning up");
await signingClient.revokeSession();
await roleClient.revokeSession();
await role.delete();
```

As of now, deleting keys is not supported.

## Building the SDK

```bash
npm install
npm run build
```

## Running the SDK tests

After [logging in](#logging-into-cubesigner), you can just run:

```bash
npm test
```

The tests will create some temporary keys and roles (in the
organization of the signed-in user), then sign some messages, and
finally clean (most of it) up.

## License

Copyright (C) 2022-2023 Cubist, Inc.

See the [NOTICE](/NOTICE) file for licensing information.
