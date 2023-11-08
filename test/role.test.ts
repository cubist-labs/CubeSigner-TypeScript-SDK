import { assert, expect } from "chai";
import { CubeSigner, Key, Org, Role, Secp256k1 } from "../src";
import { newCubeSigner } from "./setup";
import { assertForbidden, assertNotFound, deleteKeys } from "./helpers";

describe("Role", () => {
  let createdKeys: Key[];
  let cs: CubeSigner;
  let org: Org;
  let role: Role;
  let me: string;

  beforeAll(async () => {
    createdKeys = [];
    cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    org = await cs.getOrg(aboutMe.org_ids[0]);
    me = aboutMe.user_id;
  });

  beforeEach(async () => {
    const roleName = "TsSdkRole";
    try {
      const existingRole = await org.getRole(roleName);
      console.log(`Deleting existing role '${roleName}'`);
      await existingRole.delete();
    } catch (error) {
      assert(error instanceof Object);
      assert(error.toString().includes("not found in"));
      console.log(`Role '${roleName}' does not exist`);
    }
    console.log(`Creating role '${roleName}'`);
    role = await org.createRole(roleName);
    expect(role.name).to.equal(roleName);
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

  it("create role, enable, disable", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.not.equal(undefined);
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
});
