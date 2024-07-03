# CubeSigner TypeScript SDK: @solana/web3.js Example

This example shows how to use
[@solana/web3.js](https://www.npmjs.com/package/@solana/web3.js) and the
CubeSigner TypeScript SDK to sign Solana transactions in secure hardware.
Specifically, the example shows how to sign and send a simple value transaction
from one account to another.

## Running the Example

To run the example, you need to first create a key and add it to a role like we
did in the [top-level README](../../README.md). After you do this, generate a
session token for the role; you can either save the token (`cs token create ... --save`)
or export as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

Then, set the source and destination addresses:

```bash
export FROM_ADDRESS=... # this is your Solana base58 key material id
export TO_ADDRESS=... # the recipient
```

For this example to work you need to have some funds in your account.

By default, the example runs on the Solana devnet. You can, of course, change
this on the Solana testnet or mainnet.

## Raw Ed25519 signing

Though we strongly suggest using the well-typed Solana end point (which expects
a base64-encoded serialized message), this example also shows how to use raw
Ed25519 signing to sign messages. To exercise this path, you need to make sure
the source key has `AllowRawBlobSigning` enabled:

```bash
cs key set-policy --key-id="Key#Solana_..." --policy='"AllowRawBlobSigning"'
```
