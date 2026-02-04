# CubeSigner TypeScript SDK: Ripple-SDK Example

This example shows how the CubeSigner TypeScript SDK can be used to sign XRPL
transactions using xrpl.js. Specifically, the example shows how to sign and send
a payments transaction from one account to another.

## Running the Example

To run the example, you need to first create a key and add it to a role like we
did in the [top-level README](../../README.md). Be sure to attach allow raw
blob signing when you add the key to the role: `cs role add-keys ... --policy
'"AllowRawBlobSigning"'`. After you do this, generate a session token for the
role; you can either save the token (`cs token create ... --save`) or export as
base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs session create --user --scope 'sign:blob' --scope 'manage:key:get' --output base64)
```

Then, set the source and destination addresses:

```bash
export FROM_ADDRESS=... # this is your ripple key material id
export TO_ADDRESS=... # the recipient
```

For this example to work you need to have some funds in both accounts.

By default, the example runs on the Ripple testnet.
