# CubeSigner EIP-3009 Example

[EIP-3009] extends the [ERC-20] token standard to enable meta-transactions, allowing users to transfer tokens without directly paying gas fees.
Instead of sending a normal on-chain transaction, the token holder signs an [EIP-712] compliant typed message (an “authorization”), which can then be submitted to the blockchain by another party---for example, a relayer or gas sponsor.

This example demonstrates how to use CubeSigner as the signing wallet to create and sign an [EIP-3009] authorization, and how a separate account (the “executor”) can submit that signed authorization on-chain, paying the gas fees on behalf of the token holder.

## Usage

You must be signed into CubeSigner or define `CUBE_SIGNER_TOKEN` in your terminal environment. Your session **must** have the following scopes:

- `sign:evm:eip712`: This is required to sign EIP-712 messages
- `manage:key:get`: This is used for retrieving key information.

You can use an existing `EVM` address in your org by defining `FROM_ADDRESS` in your terminal environment.
The key must have the `AllowEip712Signing` policy, and your session must have the `manage:key:get` scope.

Using `cs`, you can create such a token as follows:

```bash
export CUBE_SIGNER_TOKEN=$(cs login ... --scope 'sign:evm:eip712' --export --format base64)
```

filling in `...` with arguments needed for logging in.

### Environment variables:

#### Required

```bash
export FROM_ADDRESS=... # The sender's key material id (i.e., EVM address)
export TO_ADDRESS=... # The recipient key material id (i.e., EVM address)
export FEE_PAYER_ADDRESS=... # The relayer key material id (i.e., EVM address) who pays the gas
export RPC_PROVIDER=... # RPC provider for network
export TOKEN_ADDRESS=... # Address of the ERC-20 token contract that supports EIP-3009
export AMOUNT=... # The token amount to transfer without decimal adjustment (e.g., 1.5)
```

Finally, run the example with `npm start`. By default, the example runs on the Sepolia testnet. You can, of course, change
this to mainnet.

[EIP-3009]: https://eips.ethereum.org/EIPS/eip-3009
[ERC-20]: https://eips.ethereum.org/EIPS/eip-20
[EIP-712]: https://eips.ethereum.org/EIPS/eip-3009#eip-712
