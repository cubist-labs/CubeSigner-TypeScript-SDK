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
import { JsonFileSessionStorage, loadManagementSession } from "@cubist-labs/cubesigner-sdk-fs-storage";
import assert from "assert";
```

### Instantiate `CubeSignerClient`

The first order of business is to create an instance of `CubeSignerClient`.
We can do that by simply loading the management session token from the
default location on disk (which is where the `cs login` command saves
it):

```typescript
const cubesigner = await loadManagementSession();
```

Alternatively, a `CubeSignerClient` instance can be created by explicitly
providing a session manager:

```typescript
// Load session from a JSON file
const fileStorage = new JsonFileSessionStorage<cs.SignerSessionData>(
  `${process.env.HOME}/.config/cubesigner/management-session.json`,
);
// Create a session manager for a management token
const sessionMgr = await cs.SignerSessionManager.loadFromStorage(fileStorage);
new cs.CubeSignerClient(sessionMgr);
```

### Get `User` and `Org` info

We can now obtain some information about the logged-in user and the
organization the user belongs to:

```typescript
const me = await cubesigner.aboutMe();
console.log(me);
assert(me.user_id); // each user has a globally unique ID
assert(me.org_ids); // IDs of all organizations this user is a member of
assert(me.org_ids.length === 1); // assume that the user is a member of exactly one org

const org = new cs.Org(cubesigner);
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

### Create a `Role` and a `SignerSession`

CubeSigner differentiates between _management_ and _signer_ sessions
since managing keys (and an org) is often separate from using keys.

Everything we've done so far has been using a management session. To
sign a message with a key, we now need to create a signer
session. Signer sessions are associated with roles (which we discuss
in this section) or users (which we discuss [later](#create-a-session-for-an-oidc-user)).

You can think of roles as groups
that give certain users access to certain keys. To get started, let's
create a `Role` and then simply call `createSession` on it:

```typescript
const role = await org.createRole();
const sessionStorage = new cs.MemorySessionStorage<cs.SignerSessionData>();
const session = await role.createSession(sessionStorage, "readme");
console.log(`Created signer session for role '${role.id}'`);
```

Sessions have lifetimes, so they need to periodically refresh
themselves to stay valid. When that happens, the refreshed session
needs to be saved somewhere, which is why the `createSession` method
requires an instance of `SessionStorage`. In this example, we don't
plan to persist the session across multiple runs, so a simple
in-memory storage suffices; otherwise, opting for
`JsonFileSessionStorage` would be a better idea, i.e.,

```typescript
// this storage persists the signer session token to a file
// named 'session.json' in the current working directory
new JsonFileSessionStorage("session.json");
```

### Sign an Ethereum transaction

Let's create a dummy `EvmSignRequest`.

```typescript
const eth1Request = <cs.EvmSignRequest>{
  chain_id: 1,
  tx: <any>{
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
Forbidden` saying something like `Role 'Role#... is not authorized to
access key 'Key#...'`:

```typescript
try {
  console.log("Trying to sign before adding key to role");
  await session.signEvm(secpKey, eth1Request);
  assert(false, "Must not be allowed to sign with key not in role");
} catch (e) {
  assert(`${e}`.includes("not authorized to access key"));
}
```

By default, a newly created role does not get to access any
keys. Instead, keys have to be added to a role explicitly.
After we do that, the `signEvm` call should succeed:

```typescript
console.log("Adding key to role, then signing an Ethereum transaction");
await role.addKey(secpKey);
let sig = await session.signEvm(secpKey, eth1Request);
console.log(sig.data());
assert(sig.data().rlp_signed_tx);
```

### Using ethers.js instead of the SDK directly

```typescript
import { Signer } from "@cubist-labs/cubesigner-sdk-ethers-v6";
import { ethers } from "ethers";

// Create new Signer
const ethersSigner = new Signer(secpKey.materialId, session);
assert((await ethersSigner.getAddress()) === secpKey.materialId);
// sign transaction as usual:
console.log(
  "ethers.js signature:",
  await ethersSigner.signTransaction({
    to: "0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b",
    value: ethers.parseEther("0.0000001"),
  }),
);
```

### Set security policies

When we add a `Secp256k1.Evm` key to a role (as we did above), a signer session
associated with that role allows us to sign **any** Ethereum
transaction with that key. If that seems too permissive, we can attach a security
policy to restrict the allowed usages of this key in this role.

For example, to restrict signing to transactions with a pre-approved
recipient, we can attach a `TxReceiver` policy to our key:

```typescript
console.log("Setting transaction receiver policy");
await secpKey.setPolicy([{ TxReceiver: "0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b" }]);
console.log("Signing transaction");
sig = await session.signEvm(secpKey, eth1Request);
assert(sig.data().rlp_signed_tx);
```

Try changing the transaction receiver and verify that the transaction
indeed gets rejected:

```typescript
console.log("Signing a transaction to a different receiver must be rejected");
try {
  await session.signEvm(secpKey, {
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

The `SignerSession` class exposes the `signBlob` method, which signs
an arbitrary (raw, uninterpreted) bag of bytes with a given key. This
operation, however, is not permitted by default; it is permanently
disabled for `BLS` keys, and for other key types it can be enabled by
attaching an `"AllowRawBlobSigning"` policy:

```typescript
// Create a new Ed25519 key (e.g., for Cardano) and add it to our session role
const edKey = await org.createKey(cs.Ed25519.Cardano);
await role.addKey(edKey);
console.log(`Created '${await edKey.type()}' key ${edKey.id} and added it to role ${role.id}`);

// Sign raw blobs with our new ed key and the secp we created before
for (const key of [edKey, secpKey]) {
  console.log(`Confirming that raw blob with ${await key.type()} is rejected by default`);
  const blobReq = <cs.BlobSignRequest>{
    message_base64: "L1kE9g59xD3fzYQQSR7340BwU9fGrP6EMfIFcyX/YBc=",
  };
  try {
    await session.signBlob(key, blobReq);
    assert(false, "Must be rejected by policy");
  } catch (e) {
    assert(`${e}`.includes("Raw blob signing not allowed"));
  }

  console.log("Signing raw blob after adding 'AllowRawBlobSigning' policy");
  await key.appendPolicy(["AllowRawBlobSigning"]);
  const blobSig = await session.signBlob(key, blobReq);
  console.log(blobSig.data());
  assert(blobSig.data().signature);
}
```

> **Warning**
> When signing a raw blob with a `Secp256k1` key, the blob **MUST** be the output of a secure hash function like SHA-256, and must be exactly 32 bytes long. This is a strict requirement of the ECDSA signature algorithm used by Bitcoin, Ethereum, and other blockchains. Signing any byte string that is not the output of a secure hash function can lead to catastrophic security failure, including completely leaking your secret key.

Trying to sign an invalid message with a secp key will fail with
`400 Bad Request` saying `Signature scheme: InvalidMessage`.

### Load a signer session

If signing is all that your application needs to do, you can instantiate a
`SignerSession` directly from a signer session token, without ever needing a
management session.

First, get an existing token for a signer session:

```typescript
const token = await sessionStorage.retrieve();
// alternatively, save this object to a file
```

or generate a new one from the command line:

```bash
cs token create --role-id $ROLE_ID --purpose MyPurpose --output json
```

Next, create a `MemorySessionStorage` containing the previously
exported signer token, and just load the session from it.

```typescript
const signerSession = await cs.SignerSession.loadSignerSession(
  // alternatively, load 'token' from file or environment variable
  new cs.MemorySessionStorage(token),
);
```

Finally, use the new signer session to sign a transaction. To specify
the signing key, you can pass its "material id" as a plain string:

```typescript
console.log("Signing transaction using imported signer session");
const secpKeyStr: string = secpKey.materialId;
sig = await signerSession.signEvm(secpKeyStr, eth1Request);
console.log(sig.data());
assert(sig.data().rlp_signed_tx);
```

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

```typescript
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

Finally, exchange the OIDC token for either a _signer_ session (i.e., an instance
of `SignerSession`, required by all signing endpoints, e.g., `signEvm`)

```typescript
const oidcSession = new cs.SignerSession(
  // we'll use this session for both signing and approving MFA request, hence the following scopes
  await cubesigner.oidcAuth(oidcToken, ["manage:mfa", "sign:*"]),
);
```

or a _management_ session (i.e., and instance of `CubeSigner`,
required by all management endpoints, e.g., retrieving user
information, configuring user MFA methods, etc.).

```typescript
const oidcCubeSigner = new cs.CubeSignerClient(await cubesigner.oidcAuth(oidcToken, ["manage:*"]));
```

> **Info**
> For full details on how to use this SDK to create a CubeSigner
> account for a third-party user and then exchange a valid OIDC token
> CubeSigner session, check out the [OIDC
> Example](./examples/oidc/README.md).

### Set up TOTP for a user

To manage a user we need a management session bound to that user. It
doesn't matter if that user is native to CubeSigner or a third-party
OIDC user. For that purpose, in this section we are going to use the
previously created `oidcCubeSigner` instance.

To set up TOTP, we first call the `resetTotpStart` method to initiate a
TOTP reset procedure.

```typescript
console.log(`Setting up TOTP for user ${me.email}`);
let totpResetResp = await oidcCubeSigner.resetTotpStart();
```

If the user has already configured TOTP (or any other form of MFA),
this response will require multi factor authentication. In that case,
for example, call `approveTotp` and provide the code for the existing
TOTP to proceed:

```typescript
import { authenticator } from "otplib"; // npm install otplib@12.0.1

let totpSecret = process.env["CS_USER_TOTP_SECRET"]!;
if (totpResetResp.requiresMfa()) {
  console.log("Resetting TOTP requires MFA");
  const code = authenticator.generate(totpSecret);
  totpResetResp = await totpResetResp.approveTotp(oidcSession, code);
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
assert(totpChallenge.totpUrl);
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
await oidcCubeSigner.verifyTotp(code);
```

We can also check that the user's profile now indeed includes `Totp`
as one of the configured MFA factors.

```typescript
const mfa = (await oidcCubeSigner.aboutMe()).mfa;
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
can just call `approveTotp` on the response and pass the current TOTP
code to it; if the code is correct, the call will succeed
and return the signature.

```typescript
console.log(`Signing a transaction now requires TOTP`);
let resp = await oidcSession.signEvm(secpKeyStr, eth1Request);
assert(resp.requiresMfa());

console.log(`Approving with TOTP code`);
code = authenticator.generate(totpSecret);
resp = await resp.approveTotp(oidcSession, code);
assert(!resp.requiresMfa());
console.log(resp.data());
assert(resp.data().rlp_signed_tx);
```

### Clean up

Once we are done, we can revoke the signer session and delete the role
we created.

```typescript
console.log("Cleaning up");
await session.sessionMgr.revoke();
await role.delete();

// restore the old policy for the sake of repeatability of this example
// (normally you'd set your org policies once and leave them be)
console.log("Restoring org policy", oldOrgPolicy);
await org.setPolicy(oldOrgPolicy);
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

See the [NOTICE](NOTICE) file for licensing information.
