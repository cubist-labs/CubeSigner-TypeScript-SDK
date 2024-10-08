import { expect } from "chai";
import type { Key, Org } from "@cubist-labs/cubesigner-sdk";
import {
  Ed25519,
  Secp256k1,
  Mnemonic,
  AllowRawBlobSigning,
  Bls,
  Stark,
  P256,
} from "@cubist-labs/cubesigner-sdk";
import { newCubeSigner } from "./setup";
import { deleteKeys, randomInt } from "./helpers";
import { fail } from "assert";
import { inspect } from "node:util";

describe("Key", () => {
  let createdKeys: Key[];
  let org: Org;
  let me: string;

  beforeAll(async () => {
    createdKeys = [];
    const client = await newCubeSigner();
    // Retry updates 10 times with a delay of 10ms
    // (IMPORTANT for the 'concurrent metadata update' test)
    client.apiClient.config.updateRetryDelaysMs = Array(10).fill(10);
    org = client.org();
    const aboutMe = await client.user();
    expect(aboutMe.org_ids.length).to.eq(1);
    me = aboutMe.user_id;
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  it("has an informative print value", async () => {
    const key = await org.createKey(Secp256k1.Evm);
    const inspected = inspect(key); // equivalent to console.log(key)
    expect(inspected).to.contain(key.id);
    expect(inspected).to.contain(key.materialId);
    expect(inspected).to.contain(key.publicKey);
  });

  it("search key by material id", async () => {
    const keyType = Secp256k1.Tron;
    const key = await org.createKey(keyType, me);
    createdKeys.push(key);
    console.log(`searching by '${key.materialId}'`);
    const res = await org.keys({ search: key.materialId, type: keyType });
    console.log("res", res);
    expect(res).to.deep.eq([key]);
  }, 60000);

  const rand = randomInt(Number.MAX_SAFE_INTEGER);
  for (const i of [1, 2, 3]) {
    const tag = `key tag ${rand}-${i}`;
    const metadata = i === 1 ? tag : i === 2 ? [tag] : { name: tag };
    it(`search key by metadata '${JSON.stringify(metadata)}'`, async () => {
      const keyType = Secp256k1.Tron;
      const key = await org.createKey(keyType, me, { metadata });
      createdKeys.push(key);
      createdKeys.push(await org.createKey(keyType, me, { metadata: "blah" }));

      console.log(`searching by '${tag}'`);
      const res = await org.keys({ search: tag, type: keyType });
      console.log("result", res);
      expect(res.map((k) => k.id)).to.have.members([key.id]);
    }, 60000);
  }

  it("list keys", async () => {
    const users = await org.users();
    const notMe = users.find((u) => u.id !== me)!;
    expect(notMe).to.exist;

    const existingKeyIds = (await org.keys()).reduce((acc, k) => acc.add(k.id), new Set<string>());

    const keyType = Secp256k1.Taproot;
    const myKey = await org.createKey(keyType, me);
    createdKeys.push(myKey);
    const theirKey = await org.createKey(keyType, notMe.id);
    createdKeys.push(theirKey);

    const listNewKeys = (ownerId?: string) =>
      org
        .keys({ type: keyType, owner: ownerId })
        .then((keys) => keys.filter((k) => !existingKeyIds.has(k.id)).map((k) => k.id));

    const assertNewKeys = async (owner: string | undefined, expected: string[]) => {
      const newKeys = await listNewKeys(owner);
      expect(newKeys).to.have.members(expected); // this is set equality
    };

    await assertNewKeys(me, [myKey.id]);
    await assertNewKeys(notMe.id, [theirKey.id]);
    await assertNewKeys(undefined, [myKey.id, theirKey.id]);
  }, /* timeoutMs */ 60000);

  it("create key with properties", async () => {
    const key = await org.createKey(Secp256k1.Evm, undefined, {
      metadata: "My Key 123",
      policy: [AllowRawBlobSigning as unknown as Record<string, never>],
    });
    createdKeys.push(key);
    expect(key.cached.metadata).to.equal("My Key 123");
    expect(key.cached.policy).to.deep.eq([AllowRawBlobSigning]);
  });

  it("partially update metadata", async () => {
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);
    // metadata is undefined to start with
    expect(key.cached.metadata).to.be.undefined;

    // can set plain string
    const s = "hello there <> #$%^&*() dfs";
    await key.setMetadata(s);
    expect(await key.metadata()).to.eq(s);
    expect(key.cached.version).to.eq(1);

    // can set object
    const o = { a: 1, b: 2 };
    await key.setMetadata(o);
    expect(await key.metadata()).to.deep.equal(o);
    expect(key.cached.version).to.eq(2);

    // can set number
    const n = 123.12354093;
    await key.setMetadata(n);
    expect(await key.metadata()).to.eq(n);

    // cannot set a single field if the value is not an object
    await key
      .setMetadataProperty("x", 123)
      .then(() => fail("expected to throw"))
      .catch((e: Error) => expect(e.message).to.contain("Current metadata is not a JSON object"));

    // null resets it back to empty
    await key.setMetadata(null);
    expect(await key.metadata()).to.be.undefined;

    // can set a single field when metadata is not set
    await key.setMetadataProperty("x", 123);
    expect(await key.metadata()).to.deep.eq({ x: 123 });

    // can add a new field
    await key.setMetadataProperty("y", [1, 2, 3]);
    expect(await key.metadata()).to.deep.eq({ x: 123, y: [1, 2, 3] });

    // can overwrite existing field
    await key.setMetadataProperty("y", true);
    expect(await key.metadata()).to.deep.eq({ x: 123, y: true });

    // null sets the field value to null
    await key.setMetadataProperty("y", null);
    expect(await key.metadata()).to.deep.eq({ x: 123, y: null });

    // field can be deleted too
    await key.deleteMetadataProperty("y");
    expect(await key.metadata()).to.deep.eq({ x: 123 });
  });

  it("concurrent metadata update", async () => {
    const key = await org.createKey(Secp256k1.Evm, undefined, { metadata: {} });
    createdKeys.push(key);
    expect(key.cached.metadata).to.deep.eq({});

    const N = 10;
    const ind = [...Array(N).keys()];
    // IMPORTANT that the client is configured (in beforeAll) to use at least N retries
    await Promise.all(ind.map((i) => key.setMetadataProperty(`x${i}`, i)));

    const metadata = await key.metadata();
    console.log("Final metadata", metadata);
    expect(metadata).to.deep.eq(
      ind.reduce((acc, i) => {
        return { ...acc, [`x${i}`]: i };
      }, {}),
    );
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
    let keys = await org.keys({ type: Ed25519.Sui });
    expect(keys.map((k) => k.id)).to.include(key.id);
    // list keys without filtering
    console.log("listing all keys");
    keys = await org.keys();
    expect(keys.map((k) => k.id)).to.include(key.id);
    // list keys with filtering for different type
    console.log("listing Aptos keys");
    keys = await org.keys({ type: Ed25519.Aptos });
    expect(keys.map((k) => k.id)).to.not.include(key.id);
  }, /* timeoutMs */ 60000); // long timeout because it lists keys a lot

  it("create mnemonic key, derive other key types", async () => {
    console.log("creating Mnemonic key");
    const key = await org.createKey(Mnemonic);
    createdKeys.push(key);
    let keys = await org.keys({ type: Mnemonic });
    expect(keys.map((k) => k.id)).to.include(key.id);

    // using the same derivation path for different key types is allowed
    const derivationPath = "m/44'/60'/0'/0/0";

    // test deriving eth key
    console.log("deriving Evm key");
    const ethKey: Key = (await org.deriveKey(Secp256k1.Evm, derivationPath, key.materialId))!;
    keys = await org.keys({ type: Secp256k1.Evm });
    expect(keys.map((k) => k.id)).to.include(ethKey.id);
    createdKeys.push(ethKey);

    // deriving same key again should return undefined
    console.log("deriving Evm key again");
    const ethKey2 = await org.deriveKey(Secp256k1.Evm, derivationPath, key.materialId);
    expect(ethKey2).to.be.undefined;

    // test deriving solana key
    console.log("deriving Solana key");
    const solanaKey: Key = (await org.deriveKey(Ed25519.Solana, derivationPath, key.materialId))!;
    keys = await org.keys({ type: Ed25519.Solana });
    expect(keys.map((k) => k.id)).to.include(solanaKey.id);
    createdKeys.push(solanaKey);

    // test deriving btc key
    console.log("deriving Btc key");
    const btcKey: Key = (await org.deriveKey(Secp256k1.BtcTest, derivationPath, key.materialId))!;
    keys = await org.keys({ type: Secp256k1.BtcTest });
    expect(keys.map((k) => k.id)).to.include(btcKey.id);
    createdKeys.push(btcKey);

    // test deriving Stellar key
    console.log("deriving Stellar key");
    const stellarKey: Key = (await org.deriveKey(Ed25519.Stellar, derivationPath, key.materialId))!;
    keys = await org.keys({ type: Ed25519.Stellar });
    expect(keys.map((k) => k.id)).to.include(stellarKey.id);
    createdKeys.push(stellarKey);
  }, /* timeoutMs */ 60000); // long timeout because it lists keys 6 different times

  it("create Cardano key", async () => {
    const key = await org.createKey(Ed25519.Cardano);
    createdKeys.push(key);
    const keys = await org.keys({ type: Ed25519.Cardano });
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
    expect(cachedInfo.key_type).to.equal(Secp256k1.Evm);
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

  it("create all possible keys", async () => {
    const enumTypes = [Bls, Ed25519, P256, Secp256k1];
    const stringTypes = [Mnemonic, Stark];

    for (const type of enumTypes) {
      const keys = Object.values(type);
      for (const keyType of keys) {
        if (keyType === Bls.Eth2Deposited) {
          continue;
        }
        const key = await org.createKey(keyType);
        createdKeys.push(key);
        expect(key.cached.key_type).to.equal(keyType);
      }
    }
    for (const keyType of stringTypes) {
      const key = await org.createKey(keyType);
      createdKeys.push(key);
      expect(key.cached.key_type).to.equal(keyType);
    }
  });
});
