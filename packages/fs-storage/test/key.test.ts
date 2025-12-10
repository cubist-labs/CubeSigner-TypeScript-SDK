import { expect } from "chai";
import { expect as jestExpect } from "@jest/globals";
import type {
  BlobSignRequest,
  CsErrCode,
  EvmSignRequest,
  Key,
  KeyPolicy,
  KeyPolicyRule,
  Org,
} from "@cubist-labs/cubesigner-sdk";
import {
  Ed25519,
  Secp256k1,
  Mnemonic,
  AllowDiffieHellmanExchange,
  AllowRawBlobSigning,
  Bls,
  Stark,
  BabyJubjub,
  P256,
  CubeSignerClient,
  encodeToBase64,
  userExportKeygen,
  diffieHellmanDecrypt,
} from "@cubist-labs/cubesigner-sdk";
import { Transaction as SuiTransaction } from "@mysten/sui/transactions";
import { newCubeSigner } from "./setup";
import { assertErrorCode, assertPreconditionFailed, deleteKeys, randomInt } from "./helpers";
import { fail } from "assert";
import { inspect } from "node:util";

describe("Key", () => {
  let createdKeys: Key[];
  let client: CubeSignerClient;
  let org: Org;
  let me: string;

  beforeAll(async () => {
    createdKeys = [];
    client = await newCubeSigner();
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
    createdKeys.push(key);
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
      policy: [AllowRawBlobSigning],
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

  it("require role session", async () => {
    // create a key
    console.log("creating a key");
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);

    // create 2 roles
    console.log("creating 2 roles");
    const roleSessions = await Promise.all(
      [1, 2].map(async () => {
        const role = await org.createRole();
        await role.addKey(key);
        const session = await role.createSession("require role session test");
        const client = await CubeSignerClient.create(session);
        return { session, client };
      }),
    );

    const sign = (client: CubeSignerClient) =>
      client.apiClient
        .signEvm(key, {
          chain_id: 1,
          tx: {
            type: "0x00",
            value: "0x1000",
            to: key.materialId,
          },
        })
        .then((resp) => resp.data().rlp_signed_tx);

    // 1. without any RequireRoleSession policies: signing works in all 3 ways
    console.log("testing signing without any key policy");
    await sign(client);
    await Promise.all(roleSessions.map((r) => sign(r.client)));

    // 2. with '{"RequireRoleSession": "*"}' policy: signing works with any of the roles
    {
      const kpr: KeyPolicyRule = { RequireRoleSession: "*" };
      await key.setPolicy([kpr]);
      console.log("testing signing with policy", kpr);
      await assertPreconditionFailed(sign(client));
      await Promise.all(roleSessions.map((r) => sign(r.client)));
    }

    // 3. with '{"RequireRoleSession": [...roles]}' policy: signing works with any of the listed roles
    {
      const kpr = {
        RequireRoleSession: roleSessions.map((r) => r.session.role_id!),
      };
      await key.setPolicy([kpr]);
      console.log("testing signing with policy", kpr);
      await assertPreconditionFailed(sign(client));
      await Promise.all(roleSessions.map((r) => sign(r.client)));
    }

    // 4. with '{"RequireRoleSession": [role1]}' policy: signing works only with that role
    {
      const kpr = { RequireRoleSession: [roleSessions[0].session.role_id!] };
      await key.setPolicy([kpr]);
      console.log("testing signing with policy", kpr);
      await assertPreconditionFailed(sign(client));
      await sign(roleSessions[0].client);
      await assertPreconditionFailed(sign(roleSessions[1].client));
    }

    // 5. remove the policy and assert that signing works in all 3 ways
    {
      await key.setPolicy([]);
      console.log("testing signing without policy");
      await sign(client);
      await Promise.all(roleSessions.map((r) => sign(r.client)));
    }
  });

  it("webhook policy", async () => {
    // create a key
    console.log("creating a key");
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);

    // 'TestWebhookPolicy' lambda deployed in 'goerli-staking-v0' AWS account
    const whUrl = "https://72tjfygnohkizhaifdp2l5h36u0nlgdg.lambda-url.us-east-1.on.aws";

    // set policy that allows everything
    const p: KeyPolicy = [
      "AllowRawBlobSigning",
      {
        Webhook: { url: `${whUrl}/allow` },
      },
    ];
    console.log("Setting policy", p);
    await key.setPolicy(p);

    const evmSignReq: EvmSignRequest = {
      chain_id: 1,
      tx: { type: "0x00", value: "0x1" },
    };

    const signBlobReq: BlobSignRequest = {
      message_base64: "41X4bQ2fzp0I703VNTSA47sMmICcZXmHas6RuQDvAqk=",
    };

    // blob signing is allowed
    {
      console.log("Signing blob is expected to be allowed");
      const resp = await key.signBlob(signBlobReq);
      expect(resp.data().signature).to.exist;
    }

    // evm signing is allowed
    {
      console.log("Signing evm tx is expected to be allowed");
      const resp = await key.signBlob(signBlobReq);
      expect(resp.data().signature).to.exist;
    }

    // add a policy that denies evm signing
    const denyEvmSign: KeyPolicyRule = {
      Webhook: { url: `${whUrl}/deny`, restricted_operations: ["Eth1Sign"] },
    };
    console.log("Appending deny policy", denyEvmSign);
    await key.appendPolicy([denyEvmSign]);

    // blob signing is allowed
    console.log("Signing blob is expected to be allowed");
    await key.signBlob(signBlobReq);

    // evm signing is disallowed
    console.log("Signing evm tx is expected to be denied");
    await assertErrorCode("DeniedByWebhook", key.signEvm(evmSignReq));
  });

  it("sui tx receivers", async () => {
    // create a few keys
    const key1 = await org.createKey(Ed25519.Sui);
    const key2 = await org.createKey(Ed25519.Sui);
    createdKeys.push(key1, key2);
    console.log("Created", key1.materialId, key2.materialId);
    console.log("Policy", { SuiTxReceivers: [key2.materialId] });

    // require that key1 can only send to key2
    await key1.setPolicy([{ SuiTxReceivers: [key2.materialId] }]);

    // ok to transfer from key1 to key2, key2 to key1, and key2 to key2
    for (const [from, to] of [
      [key1, key2],
      [key2, key1],
      [key2, key2],
    ]) {
      const resp = await from.signSui({ tx: await suiTransferTx({ from, to }) });
      expect(resp.requiresMfa()).to.be.false;
      console.log(resp.data().signature);
    }

    // transfer from key1 to key1 rejected by policy
    {
      const resp = await assertPreconditionFailed(
        key1.signSui({
          tx: await suiTransferTx({ from: key1, to: key1 }),
        }),
      );
      console.log("key1 -> key1", resp.errorCode);
      expect(resp.errorCode).to.eq(<CsErrCode>"SuiTxReceiversDisallowedTransferAddress");
    }
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

    // deriving same key again specifying `idempotent` should return the key
    console.log("deriving Evm key again");
    const ethKey3 = (await org.deriveKey(Secp256k1.Evm, derivationPath, key.materialId, {
      idempotent: true,
    }))!;
    expect(ethKey3.id).to.equal(ethKey.id);

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

  it("create mnemonic and keys using the deriveMultipleKeyTypes interface", async () => {
    console.log("creating mnemonic and deriving keys in one action");
    const neoDerivation = {
      key_type: P256.Neo3,
      derivation_path: "m/4/5/6/7",
    };
    const derivedKeys: Key[] = await org.deriveMultipleKeyTypes(
      [
        {
          key_type: Secp256k1.Tron,
          derivation_path: "m/1/2/3/4",
        },
        neoDerivation,
      ],
      {
        /* null or undefined mnemonic-id means create a fresh mnemonic */
        policy: [AllowRawBlobSigning],
      },
    );
    createdKeys.push(...derivedKeys);
    console.log(`Created ${derivedKeys.length} keys`);
    expect(derivedKeys.length).to.equal(2);
    const mnemonicId = derivedKeys[0].cached.derivation_info!.mnemonic_id;
    console.log(`Created mnemonic-id Key#Mnemonic_${mnemonicId}`);
    expect(derivedKeys[1].cached.derivation_info!.mnemonic_id).to.equal(mnemonicId);
    const derivedKeyTypes = derivedKeys.map((k) => k.cached.key_type);
    expect(derivedKeyTypes).to.include(Secp256k1.Tron);
    expect(derivedKeyTypes).to.include(P256.Neo3);
    for (let i = 0; i < 2; ++i) {
      expect(derivedKeys[i].cached.policy).to.include(AllowRawBlobSigning);
    }

    console.log("Getting the mnemonic");
    // retrieve the mnemonic
    const mnemonic = await org.getKey("Key#Mnemonic_" + mnemonicId);
    createdKeys.push(mnemonic);
    // because we set this policy when creating a new mnemonic, the
    // mnemonic now has this policy attached to it. Keys derived from
    // this mnemonic will automatically inherit its policies.
    expect(mnemonic.cached.policy).to.include(AllowRawBlobSigning);

    console.log("deriving more keys from the same mnemonic");
    const derivedKeys2: Key[] = await org.deriveMultipleKeyTypes(
      [
        {
          key_type: Secp256k1.Taproot,
          derivation_path: "m/7/8/9/0",
        },
        {
          key_type: Secp256k1.Doge,
          derivation_path: "m/0/1/2/3",
        },
        {
          key_type: Bls.AvaIcm,
          derivation_path: "m/3/4/5/6",
        },
        neoDerivation,
      ],
      {
        mnemonic_id: mnemonicId,
        idempotent: true,
      },
    );
    createdKeys.push(...derivedKeys2);
    console.log(`Derived ${derivedKeys2.length} keys`);
    expect(derivedKeys2.length).to.equal(4);
    for (let i = 0; i < 4; ++i) {
      expect(derivedKeys2[i].cached.derivation_info!.mnemonic_id).to.equal(mnemonicId);
      expect(derivedKeys2[i].cached.policy).to.include(AllowRawBlobSigning);
    }
    const derivedKeyTypes2 = derivedKeys2.map((k) => k.cached.key_type);
    expect(derivedKeyTypes2).to.include(Secp256k1.Taproot);
    expect(derivedKeyTypes2).to.include(Secp256k1.Doge);
    expect(derivedKeyTypes2).to.include(Bls.AvaIcm);
    expect(derivedKeyTypes2).to.include(P256.Neo3);
  }, /* timeoutMs */ 10000);

  for (const keyType of [
    Secp256k1.Evm,
    Secp256k1.Btc,
    Secp256k1.BtcTest,
    Secp256k1.Ltc,
    Secp256k1.LtcTest,
    Secp256k1.Xrp,
    Secp256k1.Cosmos,
    Secp256k1.Taproot,
    Secp256k1.TaprootTest,
    Secp256k1.BabylonEots,
    Secp256k1.BabylonCov,
    Secp256k1.Ava,
    Secp256k1.AvaTest,
    Secp256k1.Tron,
    Secp256k1.BtcLegacy,
    Secp256k1.BtcLegacyTest,
    Secp256k1.Doge,
    Secp256k1.DogeTest,
    Secp256k1.Kaspa,
    Secp256k1.KaspaTest,
    Secp256k1.KaspaSchnorr,
    Secp256k1.KaspaTestSchnorr,
    Bls.AvaIcm,
    Bls.Eth2Inactive,
    Ed25519.Solana,
    Ed25519.Sui,
    Ed25519.Aptos,
    Ed25519.Cardano,
    Ed25519.Stellar,
    Ed25519.Substrate,
    Ed25519.Tendermint,
    Ed25519.Ton,
    Ed25519.Xrp,
    Mnemonic,
    Stark,
    BabyJubjub,
    P256.Cosmos,
    P256.Ontology,
    P256.Neo3,
  ]) {
    it(`create ${keyType} key`, async () => {
      const key = await org.createKey(keyType);
      createdKeys.push(key);
      const keys = await org.keys({ type: keyType });
      expect(keys.map((k) => k.id)).to.include(key.id);
    });
  }

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
    const stringTypes = [Mnemonic, Stark, BabyJubjub];

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

  it("Diffie-Hellman exchanges", async () => {
    const [key1, key2] = await org.createKeys(BabyJubjub, 2, undefined, {
      policy: [AllowDiffieHellmanExchange],
    });
    createdKeys.push(key1);
    createdKeys.push(key2);

    const pk1 = Buffer.from(key1.publicKey.slice(2), "hex");
    const pk2 = Buffer.from(key2.publicKey.slice(2), "hex");
    console.log("keys", pk1, pk2);
    const ek = await userExportKeygen();

    // dh with key1 secret and key2 public
    const res1 = await key1.diffieHellmanExchange([pk2], ek.publicKey);
    const dec1 = await diffieHellmanDecrypt(ek.privateKey, res1.data());
    expect(dec1.length).to.eq(1);

    // dh with key2 secret and key1 public
    const res2 = await key2.diffieHellmanExchange([pk1], ek.publicKey);
    const dec2 = await diffieHellmanDecrypt(ek.privateKey, res2.data());
    expect(dec2.length).to.eq(1);

    // results should be equal
    expect(Buffer.from(dec1[0]).toString("hex")).to.eq(Buffer.from(dec2[0]).toString("hex"));
  });

  it("sets edit policy", async () => {
    const key1 = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key1);

    // Fresh key: Empty edit policy, we can change the metadata of the key
    await key1.setMetadata("test");
    let currentEditPolicy = await key1.editPolicy();
    expect(currentEditPolicy).to.equal(undefined);

    // Edit policy: for the next 10 minutes, we can't change the metadata
    const currentUnixEpochInSeconds = Math.floor(Date.now() / 1000);
    const epochInTenMinutes = currentUnixEpochInSeconds + 60 * 10;
    const newEditPolicy = {
      applies_to_scopes: { AllOf: ["manage:key:update:metadata"] },
      time_lock_until: epochInTenMinutes,
    };
    await key1.setEditPolicy(newEditPolicy);

    currentEditPolicy = await key1.editPolicy();
    expect(currentEditPolicy).to.deep.equal(newEditPolicy);

    // Due to edit policy, this should throw
    await jestExpect(key1.setMetadata("should be edit locked")).rejects.toThrow();
  });
});

interface SuiTransferTxProps {
  from: Key;
  to: Key;
  amount?: number;
}

/**
 * Creates a SUI transfer transaction serialized appropriately for signing with CubeSigner.
 *
 * @param param0 Transaction parameters
 * @param param0.from The key sending the transaction
 * @param param0.to The key receiving the transaction
 * @param param0.amount The amount being sent from the "from" key
 * @returns Base64 encoded BCS-serialized transaction.
 */
async function suiTransferTx({ from, to, amount = 100 }: SuiTransferTxProps): Promise<string> {
  const tx = new SuiTransaction();
  const coin = tx.splitCoins(tx.gas, [amount])[0];
  tx.transferObjects([coin], to.materialId);
  tx.setSender(from.materialId);
  tx.setGasOwner(from.materialId);
  tx.setGasBudget(3976000);
  tx.setGasPrice(1000);
  tx.setGasPayment([
    {
      objectId: "0xecb259c7aee89650c89b6f09093fb71861aa7e00ec7f5b01425fdcb50df6b758",
      version: "23",
      digest: "2ktM73A97ByRyWpTuMG59UDuCK1FCSPnzWRGhBNd2C5B",
    },
  ]);
  console.log(`Transferring: ${from.materialId} -> ${to.materialId}`, await tx.toJSON());
  const txBytes = await tx.build();
  return encodeToBase64(txBytes);
}
