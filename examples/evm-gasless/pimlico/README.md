# CubeSigner Pimlico.io Example

[Pimlico] is a provider for EVM Smart Accounts, which are defined by [EIP-4337]. This
example focuses on how to use Pimlico to [sponsor gas] with a key controlled by CubeSigner.

This example is based on the [Pimlico quickstart], with additional code to
integrate CubeSigner as the signer. It initializes the necessary CubeSigner
and Pimlico clients, then signs a zero-value Sepolia [UserOperation] with a new CubeSigner
key and submits it to the chain. Pimlico sponsors the gas fee.

## Usage

You must be signed into CubeSigner or define `CUBE_SIGNER_TOKEN` in your terminal environment. Your session **must** have the following scopes:

- `sign:evm:eip191`: This is used to sign a [UserOperation], which allows for gasless transactions

You can use an existing `EVM` address in your org by defining `FROM_ADDRESS` in your terminal environment.
The key must have the `AllowEip191Signing` policy, and your session must have the `manage:key:get` scope.

Add `AllowEip191Signing` policy to your CubeSigner key with:

```bash
cs key set-policy --key-id="Key#0x..." --policy='"AllowEip191Signing"'
```

If you do not define `FROM_ADDRESS`, your session must have these scopes:

- `manage:key:create`: This example creates a temporary key with no funds within the CubeSigner org.
- `manage:key:delete`: This example will delete that key at the end of the script.

Using `cs`, you can create such a token as follows:

```bash
export CUBE_SIGNER_TOKEN=$(cs login ... --scope 'sign:evm:eip191' --scope 'manage:key:create' --scope 'manage:key:delete' --export --format base64)
```

filling in `...` with arguments needed for logging in.

### Environment variables:

#### Optional:
```bash
# Optional: the sender's key material id (i.e., EVM address). Creates a new key with CubeSigner if missing.
export FROM_ADDRESS=...
# Optional: the recipient key material id (i.e., EVM address). Defaults to zero address (0x000...)
export TO_ADDRESS=... 
```

#### Required:
```bash
export PIMLICO_API_KEY=... # Required: your pimlico.io API key
export RPC_PROVIDER=... # Required: RPC provider for network
```

Finally, run the example with `npm start`. By default, the example runs on the Sepolia testnet. You can, of course, change
this to mainnet.

[sponsor gas]: https://docs.pimlico.io/references/paymaster
[Pimlico]: https://pimlico.io
[Pimlico quickstart]: https://docs.pimlico.io/guides/eip7702/demo
[EIP-4337]: https://eips.ethereum.org/EIPS/eip-4337
[UserOperation]: https://eips.ethereum.org/EIPS/eip-4337#the-useroperation-structure
