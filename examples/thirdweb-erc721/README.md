# Example NFT minting using the ThirdWeb SDK

This example shows how to implement an NFT minting library using the ThirdWeb
and CubeSigner. The integration is simple:

1. Use the CubeSigner ethers.js `Signer` instance.
2. Use the `Signer` when instantiating the ThirdWeb instance.

This lets you manage your keys securely and ensure that all the signing is done
in secure hardware without changing any of your app code. If you're familiar
with the SDKs, the integration can be as simple as this:

```typescript
import * as cs from "@cubist-labs/cubesigner-sdk";
import { Signer } from "./utils"; // temporary
import * as tw from "@thirdweb-dev/sdk";
import { AvalancheFuji } from "@thirdweb-dev/chains";
...

// 1. Load your CubeSigner signing session
const signerSession = await cs.CubeSigner.loadSignerSession();

// 2. Create ethers.js signer instance backed by CubeSigner
const signer = new Signer(SIGNER_ADDRESS, signerSession);

// 3. Create ThirdWeb intance
const twSdk = tw.ThirdwebSDK.fromSigner(signer, AvalancheFuji, {
    clientId: THIRDWEB_CLIENT_ID,
    secretKey: THIRDWEB_SECRET_KEY,
});

// 4. Create NFT collection, etc.
const addr = await twSdk.deployer.deployNFTCollection(/* ... */);
...
```

Our [example code](./src/index.ts) shows how you can implement a library that
can serve as a base layer for your app.

# Running the example

## Logging into CubeSigner

Log into your CubeSigner organization using the `cs` command-line tool, e.g.,

```bash
cs login user@example.com --env '<gamma|prod|...>'
```

This creates a management session (e.g., on Linux in `~/.config/cubesigner/management-session.json`).

## Install dependencies and build the TypeScript project

```
npm install && npm run build
```

## Creating NFT collection, minting NFTs, getting NFTs, and burning NFTs

To run the example, you need to create an EVM key to serve as your NFT
collection owner like we did in the [top-level README](../../README.md) (e.g.,
`cs key create --key-type evm`). Then, set the signer address to the address
associated with the EVM key:

```bash
export SIGNER_ADDRESS=0x... # this is your EVM key material id
```

Since the example shows you how to transfer ownernship of NFTs, you'll want to
also set the recipient addresss:

```bash
export RECIPIENT_ADDRESS=0x...
```

After you do this, generate a session token; you can either save the token (`cs
token create ... --save`) or export it as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

Finally, get your ThirdWeb API client ID and secret and set them as environment
variables:

```
export THIRDWEB_CLIENT_ID=..
export THIRDWEB_SECRET_KEY=...
```

Let's now run this example locally or on a testnet (e.g., Fuji or Holesky).

### Running the example locally (default)

To run it locally, you'll want to start a local network:

```
npm run start-hardhat
```

Then, in a separate terminal, run the example:

```
npm run start
```

### Running the example on Fuji

For this example to work you need to have some funds in your account. You can
get funds from a Fuji faucet. Once you have some funds:

```
export NETWORK=fuji
npm run start
```

# Note on ethers.js integration

Since the ThirdWeb SDK still uses ethers.js v5 instead of the latest, you can't
use the CubeSigner SDK built-in ethers.js Signer (i.e., `cs.ethers`). We're
working on factoring out this ethers integration to make it easy to pull in
different versions of ethers.js (and similar libraries). But since implementing
the v5 support with CubeSigner is simple so we just do in the [utils
script](./src/utils.ts) for now.
