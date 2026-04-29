import * as bip39 from "@scure/bip39";
import { wordlist as englishWords } from "@scure/bip39/wordlists/english";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";

import { KeyImporter, type MnemonicToImport } from "../src/index";

describe("import", () => {
  let org: cs.Org;
  let keyImporter: KeyImporter;
  const toDelete: cs.Key[] = [];

  beforeAll(async () => {
    // create a client
    const session = csFs.defaultManagementSessionManager();
    const client = await cs.CubeSignerClient.create(session);
    org = client.org();
    keyImporter = new KeyImporter(org);
  });

  it("imports evm and btc properly", async () => {
    const evmMnes: MnemonicToImport[] = [
      {
        mnemonic:
          "car split like parrot uphold faint amount alert inch bean priority custom auction denial reason oyster food duck horn top battle video seed company",
        derivationPath: "m/44'/60'/0'/0/0",
      },
      {
        mnemonic:
          "force focus walnut scale barrel faint hotel fabric source because heavy provide bridge intact they receive stairs matter fetch family color happy slender accident",
        derivationPath: "m/44'/60'/1'/0/0",
        password: "bip39 passwords are silly",
      },
    ];
    const btcMnes: MnemonicToImport[] = [
      {
        mnemonic:
          "style goddess hair mountain open when train mail fly engage fork walnut end toe mail price priority ocean uncover immune spray person slogan avoid",
        derivationPath: "m/84'/0'/0'/0/0",
      },
      {
        mnemonic:
          "marine airport maze doll note assume deliver second bus include deal escape detail friend letter captain glide actual resemble nation shell search elephant busy",
        derivationPath: "m/84'/0'/9'/0/1",
      },
    ];

    // import the keys and check that it worked as expected
    const evmKeys = await keyImporter.importMnemonics(cs.Secp256k1.Evm, evmMnes);
    toDelete.push(...evmKeys);

    expect(evmKeys.length).toEqual(2);
    expect(evmKeys[0].materialId).toEqual("0x3293e052d95efef95ea3e7f391719b5e360bab6f");
    expect(evmKeys[1].materialId).toEqual("0x5f43f12240f955020273076d75238929b67cce2b");

    const btcKeys = await keyImporter.importMnemonics(cs.Secp256k1.Btc, btcMnes);
    toDelete.push(...btcKeys);

    expect(btcKeys.length).toEqual(2);
    expect(btcKeys[0].materialId).toEqual("bc1qud99enz7mwwmxevpsdcna00exy36m32pnp0vea");
    expect(btcKeys[1].materialId).toEqual("bc1q0832r3pylf8n29kpsvq0t2fcd9pp0kt5kqqlkj");
  });

  it("imports many keys at once", async () => {
    // Import a bunch of keys at once.
    //
    // NOTE: you shouldn't do it this way if you've got one mnemonic---just
    // import the mnemonic as in the prior test, then derive keys from it.
    // We do this here for convenience in creating the test.
    const randomMnes: MnemonicToImport[] = [];
    for (let i = 0; i < 42; ++i) {
      randomMnes.push({
        mnemonic: bip39.generateMnemonic(englishWords),
        derivationPath: `m/44'/60'/${i}'/0/0`,
      });
    }

    // import them
    const randomKeys = await keyImporter.importMnemonics(cs.Secp256k1.Cosmos, randomMnes);
    toDelete.push(...randomKeys);

    expect(randomKeys.length).toEqual(randomMnes.length);
  });

  it("imports mnemonic and derives keys properly", async () => {
    const bareMnemonic = {
      mnemonic:
        "divide impact town typical inhale uncover rifle pet multiply idea long before debate apart pulse type need produce among pony attend cat injury ring",
    };

    // import the mnemonic
    const mnemonic = (
      await keyImporter.importMnemonics(cs.Mnemonic, [bareMnemonic], {
        policy: [cs.AllowRawBlobSigning],
        idempotent: true,
      })
    )[0];
    toDelete.push(mnemonic);

    // now derive a key from it
    const deriveResponse = await org.deriveKey(
      cs.Secp256k1.Taproot,
      "m/86'/0'/4'/0/0",
      mnemonic.materialId,
    );
    expect(deriveResponse).toBeDefined();
    toDelete.push(deriveResponse!);
    expect(deriveResponse!.materialId).toEqual(
      "bc1p438wagdrgvmccdf7a5tr6l5w82ae5az7dz3ve49qc2fauvzxg2wscr2lhd",
    );
    expect(await deriveResponse!.policy()).toEqual([cs.AllowRawBlobSigning]);
  });

  it("imports raw secret keys", async () => {
    // create a bunch of random secret values
    const crypto = await cs.loadCrypto();
    const randSecrets: Uint8Array[] = [];
    for (let i = 0; i < 8; ++i) {
      // essentially all 32-byte values are valid secp256k1 secrets
      const sec = new Uint8Array(32);
      crypto.getRandomValues(sec);
      randSecrets.push(sec);
    }

    // import the secrets
    const randomKeys = await keyImporter.importRawSecretKeys(cs.Secp256k1.BtcLegacy, randSecrets, {
      idempotent: true,
      policy: [cs.AllowBtcMessageSigning],
    });
    toDelete.push(...randomKeys);

    expect(randomKeys.length).toEqual(randSecrets.length);
    expect(await randomKeys[0].policy()).toEqual([cs.AllowBtcMessageSigning]);
  });

  // clean up all created keys
  afterAll(async () => {
    for (const key of toDelete) {
      await key.delete();
    }
  });
});
