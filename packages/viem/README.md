# CubeSigner Plugin for Viem

This package exposes a single `CubeSignerSource` class which implements
a custom source in Viem, backed by CubeSigner.

## Simple example usage

```typescript
import { type CustomSource, createWalletClient, http, publicActions } from "viem";
import { CubeSignerClient } from "@cubist-labs/cubesigner-sdk";
import { CubeSignerSource } from "@cubist-labs/cubesigner-sdk-viem";
import { sepolia } from "viem/chains";
import { toAccount } from "viem/accounts";

const client = await CubeSignerClient.create(...); // must have permissions to sign with `key`
const key = ...; // A CubeSigner key object or a string of an address in your org
const chain = sepolia; // use an object from "viem/chains"

const account = toAccount(new CubeSignerSource(key, client) as CustomSource);

// Create a WalletClient to perform actions
const walletClient = createWalletClient({
  account,
  chain,
  transport: http(), // uses Viem's default RPC provider
}).extend(publicActions);

// Sign transaction as usual:
const tx = await walletClient.prepareTransactionRequest({
  to: "0x96be1e4c198ecb1a55e769f653b1934950294f19",
  value: 0n,
});

const signature = await walletClient.signTransaction(tx);
...
```

Check out our [Viem example](../../examples/viem/src/index.ts) or the unit tests
in the `test` folder for more examples.

The [@cubist-labs/cubesigner-sdk](https://www.npmjs.com/package/@cubist-labs/cubesigner-sdk) contains more details on how to create signer sessions.

## Supported Transactions

Please note that CubeSigner only supports legacy or EIP-1559 EVM
transactions with an explicitly defined `type` field. It's recommended to use
`prepareTransactionRequest` before signing to fill this field.

Transactions must take place on a specific chain---either use a client which
holds a specific chain, or ensure your transaction has the `chainId` field
defined.
