# CubeSigner ZeroDev Gasless Transaction Example

An example of how to use `@cubist-labs/cubesigner-sdk-viem` and [ZeroDev] to accomplish
Gas Sponsorship.

[ZeroDev] is a provider for EVM Smart Accounts, which are defined by [EIP-4337]. This
example focuses on how to use ZeroDev to [sponsor gas] with a key controlled by CubeSigner.

This example is based on the [ZeroDev Quickstart], with additional code to
integrate CubeSigner as the signer. It initializes the necessary CubeSigner
and ZeroDev clients, then signs a zero-value Sepolia [UserOperation] with a new CubeSigner
key and submits it to the chain. ZeroDev sponsors the gas fee.

## Usage

You must be signed into CubeSigner or define `CUBE_SIGNER_TOKEN` in your terminal environment. Your session **must** have the following scopes:

- `sign:evm:eip191`: This is used to sign a [UserOperation], which allows for gasless transactions

You can use an existing `EVM` address in your org by defining `FROM_ADDRESS` in your terminal environment.
The key must have the `AllowEip191Signing` policy, and your session must have the `manage:key:get` scope.

If you do not define `FROM_ADDRESS`, your session must have these scopes:

- `manage:key:create`: This example creates a temporary key with no funds within the CubeSigner org.
- `manage:key:delete`: This example will delete that key at the end of the script.

Using `cs`, you can create such a token as follows:

```bash
export CUBE_SIGNER_TOKEN=$(cs login ... --scope 'sign:evm:eip191' --scope 'manage:key:create' --scope 'manage:key:delete' --export --format base64)
```

filling in `...` with arguments needed for logging in.

Once your environment variables are configured, you can run the script with `npm start`.

[sponsor gas]: https://docs.zerodev.app/sdk/core-api/sponsor-gas
[ZeroDev]: https://docs.zerodev.app/
[ZeroDev Quickstart]: https://docs.zerodev.app/sdk/getting-started/quickstart
[EIP-4337]: https://eips.ethereum.org/EIPS/eip-4337
[UserOperation]: https://eips.ethereum.org/EIPS/eip-4337#the-useroperation-structure
