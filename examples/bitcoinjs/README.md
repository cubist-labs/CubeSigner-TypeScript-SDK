# CubeSigner TypeScript SDK: bitcoinjs-lib Example

This example shows how the CubeSigner TypeScript SDK can be used to sign
transactions on Bitcoin chains with [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib). Specifically, the example
shows how to sign and send a simple value transaction from one account to
another.

## Running the Example

To run the example, you need to first create a Btc or BtcTest key and add it to a role like we
did in the [top-level README](../../README.md). You must create/import your sending address
in CubeSigner. You might want to do the same for the receiving address, so you can
transfer your funds back if desired. After you do this, generate a session token for the role;
you can either save the token (`cs token create ... --save`) or export as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

Then, set the source and destination addresses:

```bash
export FROM_ADDRESS=tb1... # this is your btc key material id
export TO_ADDRESS=tb1... # the recipient
```

For this example to work you need to have some funds in your account.
The network is established by the sending account.
