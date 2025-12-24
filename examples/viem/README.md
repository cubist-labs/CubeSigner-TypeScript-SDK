# CubeSigner TypeScript SDK: viem Example

This example shows how the CubeSigner TypeScript SDK can be used to sign
transactions on EVM-based chains with viem. Specifically, the example shows how
to sign and send a simple value transaction from one account to another on
the Sepolia testnet.

## Running the Example

To run the example, you need to first create an EVM key (e.g., as done in the
[top-level README](../../README.md) or using `cs`). Then, create a user session
with at least `sign:evm:tx` and `manage:key:get` scopes by logging in using
`cs`:

```bash
cs login --scope 'sign:evm:tx' --scope 'manage:key:get' ...
```

Then, set the source and destination addresses, and a [JSON-RPC provider for
Sepolia](https://ethereum-json-rpc.com/providers):

```bash
export FROM_ADDRESS=0x... # this is your secp key material id
export TO_ADDRESS=0x... # the recipient
export RPC_PROVIDER=https://... # A JSON-RPC provider for Sepolia
```

For this example to work you need to have some funds in your account.
