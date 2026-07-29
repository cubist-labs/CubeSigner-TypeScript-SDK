# CubeSigner TypeScript SDK: Cosmos token transfer example

This example shows how to use `@cosmjs` and the CubeSigner TypeScript SDK to
sign Cosmos transactions in secure hardware.

## Running the Example

To run the example, you need to first create a key with a raw-blob signing
policy.

```bash
cs key create -t secp-cosmos --metadata='"cosmos-from"' --policy '"AllowRawBlobSigning"
```

Like we did in the [top-level README](../../README.md) you can use this key by
adding it to a role and generating a session token for the role; you can either
save the token (`cs token create ...  --save`) or export as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

If you're not using roles, you can instead use a user session token: `cs token
create --user ...`.

Once you have a session, set the source and destination addresses:

```bash
export FROM_ADDRESS=... # this is your Cosmos key material id
export TO_ADDRESS=... # the recipient
```
### Sending ATOM

By default the example sends 100000 uATOMS on the Theta testnet (following [the
official example](https://tutorials.cosmos.network/tutorials/7-cosmjs/)), so you
need to have some funds in your account to run:


```bash
npm -C examples/cosmos start
```
You can get testnet funds from the one of the [testnet faucets](https://github.com/cosmos/testnets/tree/master/release#faucet)