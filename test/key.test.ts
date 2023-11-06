import { expect } from "chai";
import { CubeSigner, Ed25519, Org, Secp256k1, Mnemonic, Key } from "../src";
import { newCubeSigner } from "./setup";
import { deleteKeys } from "./helpers";

describe("Key", () => {
  let createdKeys: Key[];
  let cs: CubeSigner;
  let org: Org;
  let me: string;

  beforeAll(async () => {
    createdKeys = [];
    cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    org = await cs.getOrg(aboutMe.org_ids[0]);
    cs.setOrgId(org.id);
    expect(aboutMe).to.eql(await cs.aboutMe());
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
  }, /* timeoutMs */ 30000); // TODO: why is this test taking long in CI?

  it("create mnemonic key, derive other key types", async () => {
    const key = await org.createKey(Mnemonic);
    createdKeys.push(key);
    let keys = await org.keys(Mnemonic);
    expect(keys.map((k) => k.id)).to.include(key.id);

    // using the same derivation path for different key types is allowed
    const derivationPath = "m/44'/60'/0'/0/0";

    // test deriving eth key
    const ethKey = await org.deriveKey(Secp256k1.Evm, derivationPath, key.materialId);
    keys = await org.keys(Secp256k1.Evm);
    expect(keys.map((k) => k.id)).to.include(ethKey.id);

    // test deriving solana key
    const solanaKey = await org.deriveKey(Ed25519.Solana, derivationPath, key.materialId);
    keys = await org.keys(Ed25519.Solana);
    expect(keys.map((k) => k.id)).to.include(solanaKey.id);

    // test deriving btc key
    const btcKey = await org.deriveKey(Secp256k1.BtcTest, derivationPath, key.materialId);
    keys = await org.keys(Secp256k1.BtcTest);
    expect(keys.map((k) => k.id)).to.include(btcKey.id);

    // test deriving Stellar key
    const stellarKey = await org.deriveKey(Ed25519.Stellar, derivationPath, key.materialId);
    keys = await org.keys(Ed25519.Stellar);
    expect(keys.map((k) => k.id)).to.include(stellarKey.id);
  });

  it("create Cardano key", async () => {
    const key = await org.createKey(Ed25519.Cardano);
    createdKeys.push(key);
    const keys = await org.keys(Ed25519.Cardano);
    expect(keys.map((k) => k.id)).to.include(key.id);
  });
});
