# CubeSigner TypeScript SDK: Transfer TIP-20 coins on Tempo

This example shows how to transfer TIP-20 coins on the [Tempo](https://tempo.xyz) blockchain.

## Running the Example

To run the example, you need to log in with a user session that has at least the
following scopes: `manage:key:get`, and `sign:blob`.

```bash
export CUBE_SIGNER_TOKEN=$(cs token create --scope 'manage:key:get' --scope 'sign:blob' --output base64)
```

Then, set the source and destination addresses, e.g.,
```bash
export FROM_ADDRESS="0x..." # this is your secp key material id
export TO_ADDRESS="0x..." # the recipient
```

Note that the `FROM_ADDRESS` key must be accessible from your CubeSigner
session, and it also must have the `AllowRawBlobSigning` policy attached.

Other optional variables you may want to set
```bash
# the token to send; defaults to AlphaUSD
export TOKEN="0x20c0000000000000000000000000000000000001"

# the amount to send; defaults to 100
export AMOUNT="50"

# the RPC node to use; defaults to https://rpc.moderato.tempo.xyz
export RPC_PROVIDER="https://rpc-tempo-testnet.t.conduit.xyz"
```

Finally, execute the example:

```bash
npm ci && npm run build && npm run start
```
