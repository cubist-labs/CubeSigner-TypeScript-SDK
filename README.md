# CubeSigner TypeScript SDK

CubeSigner is a hardware-backed, non-custodial key management platform
built by Cubist for programmatically managing cryptographic keys.

This repository is our SDK written in TypeScript for programmatically
interacting with CubeSigner services.

## Building

```bash
npm install
npm run build
```

## Logging into CubeSigner

Before running tests or the "getting started" examples below, you must
log into your CubeSigner organization using the `cs` command-line
tool, e.g.,

```bash
cs login owner@example.com --env '<gamma|prod|...>'
```

## Running tests

```bash
npm test
```

The tests will create some temporary keys and roles (in the
organization of the signed-in user), then sign some messages, and
finally clean (most of it) up.

## Getting started

In this section we are going to walk through a simple CubeSigner
setup. We'll create a signing key, then sign some EVM
transactions, and then add a security policy to restrict the kinds of
transactions that CubeSigner is allowed to sign.

To start, we'll instantiate the top-level `CubeSigner` class from an
existing CubeSigner management session already stored on disk
(remember, you must already be logged in).

Let's also assume that the following imports are available to all the
examples below.

```typescript
import * as cs from "@cubist-labs/cubesigner-sdk";
import assert from "assert";
```

### Instantiate `CubeSigner`

The first order of business is to create an instance of `CubeSigner`.
We can do that by simply loading the management session token from the
default location on disk (which is where the `cs login` command saves
it):

```typescript
const cubesigner = await cs.CubeSigner.loadManagementSession();
```

Alternatively, a `CubeSigner` instance can be created by explicitly providing a
session manager:

```typescript
// Load session from a JSON file
const fileStorage = new cs.JsonFileSessionStorage<cs.ManagementSessionInfo>(
  `${process.env.HOME}/.config/cubesigner/management-session.json`,
);
// Create a session manager for a management token
const sessionMgr = await cs.ManagementSessionManager.loadFromStorage(fileStorage);
new cs.CubeSigner({
  sessionMgr,
});
```

### Get `User` and `Org` info

We can now obtain some information about the logged-in user and the
organization the user belongs to:

```typescript
const me = await cubesigner.aboutMe();
console.log(me);
assert(me.user_id); // each user has a globally unique ID
assert(me.org_ids); // IDs of all organizations this user is a member of
assert(me.org_ids.length > 0); // assume that the user is a member of at least one org

const org = await cubesigner.getOrg(me.org_ids[0]);
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
console.log(`Created '${secpKey.type}' key ${secpKey.id}`);
```

### Create a `Role` and a `SignerSession`

CubeSigner differentiates between "management" and "signer" sessions
since managing keys (and an org) is often separate from using keys.

Everything we've done so far has been using a management session. To
sign a message with a key, we now need to create a signer
session. Signer sessions are associated with roles (or third-party
users, which we discuss elsewhere), which you can think of as groups
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
new cs.JsonFileSessionStorage("session.json");
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

### Set security policies

Now that we've added a `Secp256k1.Evm` key to a role, a signer session
associated with that role allows us to sign **any** Ethereum
transaction with that key. If that seems too permissive, we can attach a security
policy to restrict the allowed usages of this key in this role.

For example, to restrict signing to transactions with a
pre-approved recipient, we can attach a `TxReceiver` policy when
adding our key to our role:

```typescript
console.log("Setting transaction receiver policy");
await role.addKey(secpKey, [{ TxReceiver: "0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b" }]);
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

:::caution Setting new policies overwrites the previous ones

Calling `role.addKey(secpKey, [...policies])` overwrites any previous
policies attached to that key in that role. To preserve the old
policies, you have to manually fetch them first, e.g.,

```typescript
const existing = (await role.keys()).find((k) => k.keyId == secpKey.id)?.policy || [];
const additional: cs.KeyPolicy = [];
await role.addKey(secpKey, [...existing, ...additional]);
```

:::

### Sign a raw blob

The `SignerSession` class exposes the `signBlob` method, which signs
an arbitrary (raw, uninterpreted) bag of bytes with a given key. This
operation, however, is not permitted by default; it is permanently
disabled for `BLS` keys, and for other key types it can be enabled by
attaching an `"AllowRawBlobSigning"` policy:

```typescript
console.log("Confirming that raw blob is rejected by default");
const blobReq = <cs.BlobSignRequest>{
  message_base64: "L1kE9g59xD3fzYQQSR7340BwU9fGrP6EMfIFcyX/YBc=",
};
try {
  await session.signBlob(secpKey, blobReq);
  assert(false, "Must be rejected by policy");
} catch (e) {
  assert(`${e}`.includes("Raw blob signing not allowed"));
}

console.log("Signing raw blob after adding 'AllowRawBlobSigning' policy");
await role.addKey(secpKey, [...existing, "AllowRawBlobSigning"]);
const blobSig = await session.signBlob(secpKey, blobReq);
console.log(blobSig.data());
assert(blobSig.data().signature);
```

:::note Secp keys can only sign 32 byte long messages

Trying to sign an invalid message with a secp key will fail with `400
Bad Request` saying `Signature scheme: InvalidMessage`.

:::

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

Next, create a `MemorySessionStorage` containing the previously exported signer
token, and just load the session from it.

```typescript
const signerSession = await cs.CubeSigner.loadSignerSession(
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

### Clean up

Once we are done, we can revoke the signer session and delete the role
we created.

```typescript
console.log("Cleaning up");
await session.sessionMgr.revoke();
await role.delete();
```

As of now, deleting keys is not supported.

## License

Copyright (C) 2022-2023 Cubist, Inc.

See the [NOTICE](NOTICE) file for licensing information.
