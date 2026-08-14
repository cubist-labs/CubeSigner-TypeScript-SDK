# CubeSigner TypeScript SDK: @solana/kit Example

This example shows how to use
[@solana/kit](https://www.npmjs.com/package/@solana/kit) and the
CubeSigner TypeScript SDK to sign Solana transactions in secure hardware.
Specifically, the example shows how to sign and send a simple 0.001 SOL transaction
from one account to another. It is inspired by Solana's [SOL Transfer][sol transfer] Example.

## Running the Example

To run the example, you need to first create a Solana key to use as your `FROM_ADDRESS`. After you
do this, generate a user session with at least the `manage:key:get` and `sign:solana` scopes:

```bash
export CUBE_SIGNER_TOKEN=$(cs session create --scope "manage:key:get" --scope "sign:solana" --user --output base64)
```

Then, set the source and destination addresses:

```bash
export FROM_ADDRESS=... # this is your Solana base58 key material id
export TO_ADDRESS=... # the recipient
```

By default, the example runs on the Solana devnet. You can, of course, change
this to the Solana testnet, mainnet or your own local validator such as
[`solana-test-validator`][test-validator]. You can change the network by setting
`RPC_PROVIDER` and `RPC_SUBSCRIPTIONS_PROVIDER` to your desired Solana network.

> [!TIP]
> Running on a local test validator means that there are no rate-limits or airdrop
> limits, which is useful for testing.

This example will attempt to airdrop funds to `FROM_ADDRESS` so that it has funds to pay the
transaction. Airdrops only work on test networks, such as Solana devnet or testnet. To run this
example on Solana mainnet, please ensure your `FROM_ADDRESS` has preexisting funds.

## Optional Configuration

There are additional environment variables you can set:

- `FEE_PAYER_ADDRESS` is the Solana address that pays the transaction fee. By default, the
  `FROM_ADDRESS` will pay this transaction fee, but this can be set to any address.
    - This feature allows for gasless transactions (also known as gas sponsorship). When a customer
      initiates a transaction, a third party can be designated as the `FEE_PAYER_ADDRESS`. This
      third-party pays the transaction fees, effectively making the transaction "gasless" for the
      customer.

- `AMOUNT` is the amount in SOL that the `FROM_ADDRESS` pays to the `TO_ADDRESS`. It defaults to 100
  lamports (or 1e-7 SOL).

- As mentioned above, you can set `RPC_PROVIDER` (to an http URI) and `RPC_SUBSCRIPTIONS_PROVIDER`
  (to a websocket URI). This allows you to change which network this example runs on. By default, it
  runs on Solana devnet.

[test-validator]: https://docs.solanalabs.com/cli/examples/test-validator
[sol transfer]: https://solana.com/docs/core/instructions#sol-transfer-example
