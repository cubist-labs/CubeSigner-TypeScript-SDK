# ethers.js v6 Signer implementation for CubeSigner TypeScript SDK

This package exposes a single `Signer` class which implements the ethers.js v6
`AbstractSigner` interface, offloading all signing tasks to a remote CubeSigner
service.

## Simple example usage

```typescript
import * as cs from "@cubist-labs/cubesigner-sdk";
import { Signer } from "@cubist-labs/cubesigner-sdk-ethers-v6";
import { ethers } from "ethers";

...
// Create new Signer given a key/account address and CubeSigner session object
// (with permissions to sign with this key):
const signer = new Signer(keyAddress, cubeSignerSession);

// Sign transaction as usual:
await signer.signTransaction({
    to: "0xff50ed3d0ec03ac01d4c79aad74928bff48a7b2b",
    value: ethers.parseEther("0.0000001"),
});
...
```

Check out the [@cubist-labs/cubesigner-sdk](https://www.npmjs.com/package/@cubist-labs/cubesigner-sdk) NPM package for more details on how to create signer sessions.