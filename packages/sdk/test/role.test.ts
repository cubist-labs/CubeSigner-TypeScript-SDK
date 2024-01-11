/* eslint-disable @typescript-eslint/no-explicit-any */

import { expect } from "chai";
import { EvmSignRequest, Key, MemorySessionStorage, Org, Role, Secp256k1 } from "../src";
import { newCubeSigner } from "./setup";
import {
  assertForbidden,
  assertNotFound,
  assertPreconditionFailed,
  deleteKeys,
  randomInt,
} from "./helpers";

describe("Role", () => {
  let createdKeys: Key[];
  let org: Org;
  let role: Role;
  let me: string;

  beforeAll(async () => {
    createdKeys = [];
    const cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    org = new Org(cs);
    me = aboutMe.user_id;
  });

  beforeEach(async () => {
    role = await org.createRole();
    expect(role.name).to.be.undefined;
  });

  afterEach(async () => {
    // delete role
    await role.delete();
    // can't get role by id
    await assertForbidden(org.getRole(role.id));
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  it("create role with name", async () => {
    const roleName = `TsSdkRole_${randomInt(10000000)}`;
    console.log(`Creating role '${roleName}'`);
    const role = await org.createRole(roleName);
    expect(role.name).to.eq(roleName);

    // can get by name
    console.log(`Getting role '${roleName}'`);
    const role2 = await org.getRole(roleName);
    expect(role2.id).to.eq(role.id);
    expect(role2.name).to.eq(role.name);

    // delete deletes the name too
    console.log(`Deleting role '${roleName}'`);
    await role.delete();
    await assertForbidden(org.getRole(role.id));
    await assertForbidden(org.getRole(roleName));

    // can create another role with the same name
    console.log(`Re-creating role '${roleName}'`);
    const role3 = await org.createRole(roleName);
    expect(role3.name).to.eq(roleName);
    expect(role3.id).to.not.eq(role.id);

    // clean up
    console.log(`Deleting role '${roleName}'`);
    await role3.delete();
  });

  it("create role, enable, disable", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(await role.users()).to.deep.equal([]);
    // disable:
    await role.disable();
    expect(await role.enabled()).to.equal(false);
    // re-enable:
    await role.enable();
    expect(await role.enabled()).to.equal(true);
  });

  it("add key to role", async () => {
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);
    await role.addKey(key);
    {
      const keys = await role.keys();
      expect(keys.length).to.equal(1);
      expect(keys[0].keyId).to.equal(key.id);
      expect(keys[0].policy).to.equal(undefined);
    }

    // remove key
    await role.removeKey(key);

    // add key with policy
    const policy = [{ TxReceiver: "0x8c594691c0e592ffa21f153a16ae41db5befcaaa" }];

    await role.addKey(key, policy);
    {
      const keys = await org.getRole(role.id).then((r) => r.keys());
      expect(keys.length).to.equal(1);
      expect(keys[0].policy).to.deep.equal(policy);
      // retrieve the Key object from the role and check its fields
      const roleKey = await keys[0].getKey();
      expect(roleKey.id).to.equal(key.id);
      expect(roleKey.materialId).to.equal(key.materialId);
      expect(roleKey.publicKey).to.equal(key.publicKey);
      expect(await roleKey.type()).to.equal(Secp256k1.Evm);
    }

    // remove key
    await role.removeKey(key);

    // can't remove the same key twice
    await assertForbidden(role.removeKey(key));
  });

  it("add user to role", async () => {
    await role.addUser(me);
    expect(await role.users()).to.deep.equal([me]);
    expect(await (await org.getRole(role.id)).users()).to.deep.equal([me]);
  });

  it("add bad user throws", async () => {
    await assertNotFound(role.addUser("bad"));
  });

  it("role policy", async () => {
    const session = await role.createSession(new MemorySessionStorage(), "test");

    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);
    await role.addKey(key);

    // signing without policy should succeed
    const badTx = <EvmSignRequest>{
      chain_id: 1,
      tx: <any>{
        to: "0x0000000000000000000000000000000000000000",
        value: "0x1000",
        type: "0x00",
        gas: "0x61a80",
        gasPrice: "0x77359400",
        nonce: "0xb",
      },
    };
    {
      const sig = await session.signEvm(key, badTx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // set TxReceiver role policy
    const receiver = "0x8c594691c0e592ffa21f153a16ae41db5befcaaa";
    const txRecevierPolicy = [{ TxReceiver: receiver }];
    await role.setPolicy(txRecevierPolicy);
    expect(await role.policy()).to.deep.equal(txRecevierPolicy);

    // signing bad transaction with TxReceiver policy should fail
    await assertPreconditionFailed(session.signEvm(key, badTx));

    // signing good transaction with TxReceiver policy should succeed
    const goodTx = {
      chain_id: 1,
      tx: <any>{
        ...badTx.tx,
        to: receiver,
      },
    };
    console.log(goodTx);
    {
      const sig = await session.signEvm(key, goodTx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // set SourceIpAllowlist role policy
    const sourceIpAllowlistPolicy = [{ SourceIpAllowlist: ["10.0.0.0/8", "169.254.0.0/16"] }];
    await role.setPolicy(sourceIpAllowlistPolicy);
    expect(await role.policy()).to.deep.equal(sourceIpAllowlistPolicy);

    // signing with SourceIpAllowlist policy should fail
    await assertPreconditionFailed(session.signEvm(key, goodTx));
  });
});
