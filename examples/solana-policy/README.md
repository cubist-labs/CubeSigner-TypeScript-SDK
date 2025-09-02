# CubeSigner TypeScript SDK: @solana/web3.js Policy Example

This example shows how to use
[@solana/web3.js](https://www.npmjs.com/package/@solana/web3.js) and the
CubeSigner TypeScript SDK to create a key/role policy for Solana transactions.

Specifically, the example shows how to define a policy requiring that all transactions:

1. Start by caling the `setComputeUnitLimit` instruction with the value 300, and
2. Transfer 50,000 lamports to our `TO_ADDRESS`.

To define this policy, we need

1. The `program_id` of each program,
2. the bytes of data that specify which instruction to call in that program,
   and the amounts (compute units and lamports) for each instruction, and
3. the `toPubkey` account field for the `transfer` program.

In this example, we create a mock transaction with these required instructions,
and convert their information into a `SolanaInstructionPolicy` that we can set
on a key or role.

By default, this example only creates and prints the policy. You can also
add the policy to an existing key and test that it behaves as expected by setting
the `TEST_POLICY` and `FROM_ADDRESS` environment variables.
Note that this won't submit any transactions, but only _signs_ them using CubeSigner.

## Running the Example

### Without the optional test

To run the example without testing the policy, you need the recipient address for
the required `transfer` instruction. To set the address:

```bash
export TO_ADDRESS=...
```

After this is set, you can run

```bash
npm run start
```

### With the test

To run the example with the test, you need to create a key, have a valid
management session file, and have a signer token or valid signer session file.

Log into your CubeSigner organization using the `cs` command-line tool, e.g.,

```bash
cs login user@example.com --env '<gamma|prod|...>'
```

This creates a management session (e.g., on Linux in `~/.config/cubesigner`).

Next, create a key and add it to a role like we did in the [top-level README](../../README.md).
After you do this, generate a session token for the role; you can either save the token
(`cs token create ... --save`) or export as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

Then, set the source and destination addresses:

```bash
export FROM_ADDRESS=... # this is your Solana base58 key material id
export TO_ADDRESS=... # the recipient address for the required 'transfer' instruction
```

Finally, set `TEST_POLICY` to enable testing the policy:
```bash
export TEST_POLICY=true
```

After this is set, you can run

```bash
npm run start
```
