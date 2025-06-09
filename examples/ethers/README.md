# CubeSigner TypeScript SDK: ethers.js Example

This example shows how the CubeSigner TypeScript SDK can be used to sign
transactions on EVM-based chains with ethers.js. Specifically, the example
shows how to sign and send a simple value transaction from one account to
another.

## Running the Example

To run the example, you need to first create a key and add it to a role like we
did in the [top-level README](../../README.md). After you do this, generate a
session token for the role; you can either save the token (`cs token create ... --save`)
or export as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

Then, set the source and destination addresses, and [a JSON-RPC provider for your desired chain](https://ethereum-json-rpc.com/providers):

```bash
export FROM_ADDRESS=0x... # this is your secp key material id
export TO_ADDRESS=0x... # the recipient
export RPC_PROVIDER=https://... # A JSON-RPC provider for the desired chain
```

For this example to work you need to have some funds in your account.
