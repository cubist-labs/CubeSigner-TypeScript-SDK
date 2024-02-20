import { expect } from "chai";
import {
  Ed25519,
  Org,
  Secp256k1,
  Mnemonic,
  Key,
  AllowRawBlobSigning,
} from "@cubist-labs/cubesigner-sdk";
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

  it("create key with properties", async () => {
    const key = await org.createKey(Secp256k1.Evm, undefined, {
      metadata: "My Key 123",
      policy: [AllowRawBlobSigning as unknown as Record<string, never>],
    });
    createdKeys.push(key);
    expect(key.cached.metadata).to.equal("My Key 123");
    expect(key.cached.policy).to.deep.eq([AllowRawBlobSigning]);
  });

  it("create key, enable, disable, set metadata", async () => {
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);
    expect(await key.enabled()).to.equal(true);
    expect(await key.type()).to.equal(Secp256k1.Evm);
    expect(await key.owner()).to.equal(me);
    expect(key.cached.metadata ?? "").to.equal("");

    // retrieve key by id from org
    const key2 = await org.getKey(key.id);
    expect(await key2.enabled()).to.equal(true);
    expect(await key2.type()).to.equal(Secp256k1.Evm);
    expect(await key2.owner()).to.equal(me);
    expect(key2.cached.metadata ?? "").to.equal("");

    // disable:
    await key.disable();
    expect(await key.enabled()).to.equal(false);
    // re-enable:
    await key.enable();
    expect(await key.enabled()).to.equal(true);

    // set metadata
    const md = "Super, duper metadata.";
    await key.setMetadata(md);
    const key3 = await org.getKey(key.id);
    expect(key3.cached.metadata).to.equal(md);
  });

  it("create key is in list", async () => {
    const key = await org.createKey(Ed25519.Sui);
    createdKeys.push(key);
    // list keys with filtering
    console.log("listing Sui keys");
    let keys = await org.keys(Ed25519.Sui);
    expect(keys.map((k) => k.id)).to.include(key.id);
    // list keys without filtering
    console.log("listing all keys");
    keys = await org.keys();
    expect(keys.map((k) => k.id)).to.include(key.id);
    // list keys with filtering for different type
    console.log("listing Aptos keys");
    keys = await org.keys(Ed25519.Aptos);
    expect(keys.map((k) => k.id)).to.not.include(key.id);
  }, /* timeoutMs */ 60000); // long timeout because it lists keys a lot

  it("create mnemonic key, derive other key types", async () => {
    console.log("creating Mnemonic key");
    const key = await org.createKey(Mnemonic);
    createdKeys.push(key);
    let keys = await org.keys(Mnemonic);
    expect(keys.map((k) => k.id)).to.include(key.id);

    // using the same derivation path for different key types is allowed
    const derivationPath = "m/44'/60'/0'/0/0";

    // test deriving eth key
    console.log("deriving Evm key");
    const ethKey: Key = (await org.deriveKey(Secp256k1.Evm, derivationPath, key.materialId))!;
    keys = await org.keys(Secp256k1.Evm);
    expect(keys.map((k) => k.id)).to.include(ethKey.id);
    createdKeys.push(ethKey);

    // deriving same key again should return undefined
    console.log("deriving Evm key again");
    const ethKey2 = await org.deriveKey(Secp256k1.Evm, derivationPath, key.materialId);
    expect(ethKey2).to.be.undefined;

    // test deriving solana key
    console.log("deriving Solana key");
    const solanaKey: Key = (await org.deriveKey(Ed25519.Solana, derivationPath, key.materialId))!;
    keys = await org.keys(Ed25519.Solana);
    expect(keys.map((k) => k.id)).to.include(solanaKey.id);
    createdKeys.push(solanaKey);

    // test deriving btc key
    console.log("deriving Btc key");
    const btcKey: Key = (await org.deriveKey(Secp256k1.BtcTest, derivationPath, key.materialId))!;
    keys = await org.keys(Secp256k1.BtcTest);
    expect(keys.map((k) => k.id)).to.include(btcKey.id);
    createdKeys.push(btcKey);

    // test deriving Stellar key
    console.log("deriving Stellar key");
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

  it("cached key", async () => {
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);
    expect(await key.enabled()).to.equal(true);
    expect(await key.type()).to.equal(Secp256k1.Evm);
    expect(await key.owner()).to.equal(me);

    const cachedInfo = key.cached;
    expect(cachedInfo.enabled).to.equal(true);
    expect(cachedInfo.type).to.equal(Secp256k1.Evm);
    expect(cachedInfo.owner).to.equal(me);

    await key.disable();
    expect(cachedInfo.enabled).to.equal(true);
    expect(await key.enabled()).to.equal(false);
    expect(key.cached.enabled).to.equal(false);
  });

  it("list roles", async () => {
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);

    const role1 = await org.createRole();
    const role2 = await org.createRole();
    const role3 = await org.createRole();

    try {
      await role1.addKey(key);
      await role2.addKey(key);
      await role3.addKey(key);

      const keyInRoles = await key.roles({ size: 2, all: true });
      expect(keyInRoles.length).to.eq(3);

      let roleIds = [role1.id, role2.id, role3.id];
      for (const keyInRole of keyInRoles) {
        expect(keyInRole.key_id).to.eq(key.id);
        expect(keyInRole.policy).to.be.undefined;
        expect(roleIds).to.contain(keyInRole.role_id);
        roleIds = roleIds.filter((rid) => rid !== keyInRole.role_id);
      }

      expect(roleIds.length).to.eq(0);
    } finally {
      await role1.delete();
      await role2.delete();
      await role3.delete();
    }
  });
});
