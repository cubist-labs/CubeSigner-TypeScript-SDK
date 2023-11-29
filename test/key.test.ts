import { expect } from "chai";
import { Ed25519, Org, Secp256k1, Mnemonic, Key } from "../src";
import { newCubeSigner } from "./setup";
import { deleteKeys } from "./helpers";

describe("Key", () => {
  let createdKeys: Key[];
  let org: Org;
  let me: string;

  beforeAll(async () => {
    createdKeys = [];
    org = new Org(await newCubeSigner());
    const aboutMe = await org.aboutMe();
    expect(aboutMe.org_ids.length).to.eq(1);
    me = aboutMe.user_id;
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  it("create key, enable, disable", async () => {
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);
    expect(await key.enabled()).to.equal(true);
    expect(await key.type()).to.equal(Secp256k1.Evm);
    expect(await key.owner()).to.equal(me);

    // retrieve key by id from org
    const key2 = await org.getKey(key.id);
    expect(await key2.enabled()).to.equal(true);
    expect(await key2.type()).to.equal(Secp256k1.Evm);
    expect(await key2.owner()).to.equal(me);

    // disable:
    await key.disable();
    expect(await key.enabled()).to.equal(false);
    // re-enable:
    await key.enable();
    expect(await key.enabled()).to.equal(true);
  });

  it("create key is in list", async () => {
    const key = await org.createKey(Ed25519.Sui);
    createdKeys.push(key);
    // list keys with filtering
    let keys = await org.keys(Ed25519.Sui);
    expect(keys.map((k) => k.id)).to.include(key.id);
    // list keys without filtering
    keys = await org.keys();
    expect(keys.map((k) => k.id)).to.include(key.id);
    // list keys with filtering for different type
    keys = await org.keys(Ed25519.Aptos);
    expect(keys.map((k) => k.id)).to.not.include(key.id);
  }, /* timeoutMs */ 60000); // long timeout because it lists keys a lot

  it("create mnemonic key, derive other key types", async () => {
    const key = await org.createKey(Mnemonic);
    createdKeys.push(key);
    let keys = await org.keys(Mnemonic);
    expect(keys.map((k) => k.id)).to.include(key.id);

    // using the same derivation path for different key types is allowed
    const derivationPath = "m/44'/60'/0'/0/0";

    // test deriving eth key
    const ethKey: Key = (await org.deriveKey(Secp256k1.Evm, derivationPath, key.materialId))!;
    keys = await org.keys(Secp256k1.Evm);
    expect(keys.map((k) => k.id)).to.include(ethKey.id);
    createdKeys.push(ethKey);

    // deriving same key again should return undefined
    const ethKey2 = await org.deriveKey(Secp256k1.Evm, derivationPath, key.materialId);
    expect(ethKey2).to.be.undefined;

    // test deriving solana key
    const solanaKey: Key = (await org.deriveKey(Ed25519.Solana, derivationPath, key.materialId))!;
    keys = await org.keys(Ed25519.Solana);
    expect(keys.map((k) => k.id)).to.include(solanaKey.id);
    createdKeys.push(solanaKey);

    // test deriving btc key
    const btcKey: Key = (await org.deriveKey(Secp256k1.BtcTest, derivationPath, key.materialId))!;
    keys = await org.keys(Secp256k1.BtcTest);
    expect(keys.map((k) => k.id)).to.include(btcKey.id);
    createdKeys.push(btcKey);

    // test deriving Stellar key
    const stellarKey: Key = (await org.deriveKey(Ed25519.Stellar, derivationPath, key.materialId))!;
    keys = await org.keys(Ed25519.Stellar);
    expect(keys.map((k) => k.id)).to.include(stellarKey.id);
    createdKeys.push(stellarKey);
  }, /* timeoutMs */ 60000); // long timeout because it lists keys 6 different times

  it("create Cardano key", async () => {
    const key = await org.createKey(Ed25519.Cardano);
    createdKeys.push(key);
    const keys = await org.keys(Ed25519.Cardano);
    expect(keys.map((k) => k.id)).to.include(key.id);
  });
});
