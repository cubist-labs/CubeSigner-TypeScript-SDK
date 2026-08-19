# CubeSigner TypeScript SDK: Stellar-SDK Example

This example shows how the CubeSigner TypeScript SDK can be used to sign
Stellar transactions using the js-stellar-sdk. Specifically, the example shows
how to sign and send a simple value transaction from one account to another,
extending the [js-stellar-sdk
example](https://github.com/stellar/js-stellar-sdk/blob/62eab36822cd7a3e16d201bcbae7e9ed28589310/docs/reference/examples.md).

## Running the Example

To run the example, you need to first create a key and add it to a role like we
did in the [top-level README](../../README.md). Be sure to attach allow raw
blob signing when you add the key to the role: `cs role add-keys ... --policy
'"AllowRawBlobSigning"'`. After you do this, generate a session token for the
role; you can either save the token (`cs token create ... --save`) or export as
base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

Then, set the source and destination addresses:

```bash
export FROM_ADDRESS=G... # this is your stellar key material id
export TO_ADDRESS=G... # the recipient
```

For this example to work you need to have some funds in your account.

By default, the example runs on the Horizon testnet.
