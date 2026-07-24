# CubeSigner TypeScript SDK: AvalancheJS Example

This example shows how the CubeSigner TypeScript SDK can be used to sign
transactions using AvalancheJS. Specifically, the example shows how to sign and
send a transfer from the C-chain to the P-chain and back. It is similar to the
C-chain to/from P-chain transfers using API calls outlined in the [Avalanche
documentation](https://support.avax.network/en/articles/6719662-transferring-from-the-p-chain-to-c-chain-with-api-calls).

## Running the Example

To run the example, you need to create a `secp` and an
`secp-ava`/`secp-ava-test` key and add it to a role like we did in the
[top-level README](../../README.md). After you do this, generate a session
token for the role; you can either save the token (`cs token create ...
--save`) or export as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

Then, set the C-chain and P-chain addresses:

```bash
export C_CHAIN_ADDRESS=0x... # this is your secp key material id
export P_CHAIN_ADDRESS=P-... # this is your secp-ava(-test) key material id prefixed with `P-`
```

For this example to work you need to have some funds in your C-chain account.
