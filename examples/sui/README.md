# CubeSigner TypeScript SDK: Sui token transfer example

This example shows how to use `@mysten/sui` and the CubeSigner TypeScript SDK to
sign Sui transactions in secure hardware.

## Running the Example

To run the example, you need to first create a key and add it to a role like we
did in the [top-level README](../../README.md). After you do this, generate a
session token for the role; you can either save the token (`cs token create ...
--save`) or export as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

If you're not using roles, you could instead use a user session token: `cs token
create --user ...`.

Once you have a session, set the source and destination addresses:

```bash
export FROM_ADDRESS=... # this is your Sui key material id
export TO_ADDRESS=... # the recipient
```
### Sending SUI

By default the example send 2000 mists, so you need to have some SUI in your
account to run:


```bash
npm -C examples/sui start
```

### Sending other tokens

To send other token, like
[NAVX](https://suiscan.xyz/mainnet/coin/0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX),
you just need to additionally set the coin type (and network):

```
...
export SUI_NETWORK=mainnet
export COIN_TYPE="0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX"
export AMOUNT=99999
npm -C examples/sui start
```