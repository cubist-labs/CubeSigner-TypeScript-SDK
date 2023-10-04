# CubeSigner TypeScript SDK: @solana/web3.js Example

This example shows how the CubeSigner TypeScript SDK can be used to sign _raw_
Solana transactions on chains with @solana/web3.js. Specifically, the example
shows how to sign and send a simple value transaction from one account to
another. We will extend this example to demonstrate typed transaction signing
very soon.

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
Moreover, since we're using raw signing you need to make sure the source key has `AllowRawBlobSigning` enabled:

```bash
cs key set-policy --key-id="Key#Solana_..." --policy='"AllowRawBlobSigning"'
```

By default, the example runs on the Solana devnet. You can, of course, change
this on the Solana testnet or mainnet.
