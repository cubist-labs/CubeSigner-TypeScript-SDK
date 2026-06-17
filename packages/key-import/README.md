# CubeSigner key import

This library implements the client-side encryption used to import keys
into CubeSigner.

## WARNING

Importing keys using code running in an untrusted environment is **dangerous**
because that code must process secret key material. For example, importing
keys from a user's web browser is **very risky**: exposing secret keys
in browsers means that malicious web pages, advertisements, and extensions
may be able to steal your key. JS execution environments are also great
targets for side-channel attackers.

Whenever possible, Cubist strongly recommends generating keys using the
`createKey` API. We strongly recommend against using local keygen plus
import as a replacement for real disaster-recovery backup. Please contact
us if you have questions about or need help with disaster-recovery planning.

## Example

```ts
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { KeyImporter, type MnemonicToImport } from "@cubist-labs/cubesigner-sdk-key-import";

// create a CubeSigner client from credentials on-disk, which
// you can create by running `cs login` from the CLI.
const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());

// create the key-importer instance
const keyImporter = new KeyImporter(client.org());

// mnemonics to import directly as EVM keys
const evmMnemonics: MnemonicToImport[] = [
  {
    mnemonic: "car split like parrot uphold faint amount alert inch bean priority custom auction denial reason oyster food duck horn top battle video seed company",
    derivationPath: "m/44'/60'/0'/0/0",
  },
  {
    mnemonic: "force focus walnut scale barrel faint hotel fabric source because heavy provide bridge intact they receive stairs matter fetch family color happy slender accident",
    derivationPath: "m/44'/60'/1'/0/0",
    password: "bip39 passwords are silly",
  },
];
// mnemonic to import directly as Bitcoin Segwit keys
const btcMnemonics: MnemonicToImport[] = [
  {
    mnemonic: "style goddess hair mountain open when train mail fly engage fork walnut end toe mail price priority ocean uncover immune spray person slogan avoid",
    derivationPath: "m/84'/0'/0'/0/0",
  },
  {
    mnemonic: "marine airport maze doll note assume deliver second bus include deal escape detail friend letter captain glide actual resemble nation shell search elephant busy",
    derivationPath: "m/84'/0'/9'/0/1",
  },
];

// import the keys
const evmKeys = await keyImporter.importMnemonics(cs.Secp256k1.Evm, evmMnemonics);
const btcKeys = await keyImporter.importMnemonics(cs.Secp256k1.Btc, btcMnemonics);

// If you want to derive many keys from the same mnemonic, you should import
// the bare mnemonic and use the `deriveKey` and/or `deriveKeys` methods to
// create keys.
const bareMnemonic: MnemonicToImport = {
  mnemonic: "divide impact town typical inhale uncover rifle pet multiply idea long before debate apart pulse type need produce among pony attend cat injury ring",
};

// First, import the bare mnemonic
const mnemonic = (await keyImporter.importMnemonics(cs.Mnemonic, [bareMnemonic]))[0];

// Then derive keys from it.
const deriveResponse = await org.deriveKey(cs.Secp256k1.Taproot, "m/86'/0'/3'/1/0", mnemonic.materialId);
const otherDeriveResponses = await org.deriveKeys(
  cs.Secp256k1.Ava,
  [
    "m/1'/2'/3",
    "m/4'/5/6",
    "m/7/8'/9",
  ],
  mnemonic.materialId,
);
```

# License

Copyright (C) 2024 Cubist, Inc. All rights reserved.

This library is licensed under the MIT and Apache-2.0 licenses.
See the [../../NOTICE] file for further information.
