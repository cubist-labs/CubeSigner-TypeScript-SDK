import { assert, expect } from "chai";
import { newCubeSigner } from "./setup";
import {
  assertBadRequest,
  assertErrorCode,
  deleteKeys,
  deletePolicies,
  deleteRoles,
  randomInt,
} from "./helpers";
import type { PolicyAcl, PolicyReference, UserInfo } from "@cubist-labs/cubesigner-sdk";
import {
  type NamedKeyPolicy,
  Secp256k1,
  type Key,
  type KeyPolicy,
  type Org,
  type NamedPolicy,
  type RolePolicy,
  type Role,
  type PolicyEngineConfiguration,
  type KeyPolicyRule,
  type PolicyType,
} from "@cubist-labs/cubesigner-sdk";
import { readFile } from "fs/promises";

describe("Named Policy", () => {
  let createdKeys: Key[];
  let createdRoles: Role[];
  let createdPolicies: NamedPolicy[];
  let org: Org;
  let originalEngineConfigs: PolicyEngineConfiguration | undefined;
  let me: UserInfo;

  beforeAll(async () => {
    createdPolicies = [];
    createdKeys = [];
    createdRoles = [];

    const client = await newCubeSigner();
    const aboutMe = await client.user();
    org = client.org();
    me = aboutMe;

    originalEngineConfigs = await org.policyEngineConfiguration();
  });

  afterAll(async () => {
    if (originalEngineConfigs !== undefined) {
      await org.setPolicyEngineConfiguration(originalEngineConfigs);
    }

    await deleteKeys(createdKeys);
    await deleteRoles(createdRoles);
    await deletePolicies(createdPolicies);
  });

  it("create policy", async () => {
    const policy = await createPolicy("Key", ["AssertErc20Tx"]);
    const policyName = await policy.name();

    // Can get the policy by name
    console.log(`Get policy by name ${policyName}`);
    const policy2 = await org.getPolicy(policyName);
    expect(policy2.id).to.eq(policy.id);
    expect(await policy2.name()).to.eq(await policy.name());

    // Can get the policy by id
    console.log(`Get policy by name ${policy.id}`);
    const policy3 = await org.getPolicy(policy.id);
    expect(policy3.id).to.eq(policy.id);
    expect(await policy3.name()).to.eq(await policy.name());

    // Can't make another policy with the same id
    console.log(`Try to create another policy named ${policyName}`);
    await assertBadRequest(org.createPolicy(policyName, "Role", ["AssertErc20Tx"]));
  });

  it("policy type", async () => {
    const policy = await createPolicy("Role", ["AssertErc20Tx"]);

    console.log("Update the policy with more role rules");
    const newRules: RolePolicy = ["AssertErc20Tx", { TxValueLimit: "0x100" }];
    await policy.setRules(newRules);
    expect((await policy.latest()).rules).to.eql(newRules);

    console.log("Try to update policy with key rules");
    await assertBadRequest(policy.setRules(["AllowRawBlobSigning"] as unknown as RolePolicy));
    const latest = await policy.latest();
    expect(latest.rules).to.eql(newRules);
    expect(latest.version).to.eql("v1");
  });

  it("delete policy", async () => {
    const policy = await createPolicy("Key", ["AssertErc20Tx"]);
    const policyName = await policy.name();

    console.log("Create a key for testing");
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);

    console.log(`Attach policy ${policyName} to key`);
    await key.appendPolicy([`${policyName}/latest`]);
    expect(await policy.allAttached()).to.eql([{ key_id: key.id }]);

    console.log("Check that policy can't be deleted while attached");
    await assertBadRequest(policy.delete());
    const latest = await policy.latest();
    const policy2 = await org.getPolicy(policyName);
    expect(latest.id).to.eq(policy2.id);

    console.log(`detach policy ${policyName} from ${key.id}`);
    await key.setPolicy([]);
    expect(await policy.allAttached()).to.eql([]);

    console.log(`Delete policy ${policyName}`);
    await policy.delete();
    await assertBadRequest(org.getPolicy(policy.id));

    // Remove this policy from createdPolicies as well, since we deleted it here.
    const policyIndex = createdPolicies.findIndex((p) => p == policy);
    if (policyIndex > -1) {
      createdPolicies.splice(policyIndex, 1);
    }
  });

  it("update policy rules", async () => {
    const v0Rules: KeyPolicy = ["AssertErc20Tx"];
    const policy: NamedKeyPolicy = await createPolicy("Key", v0Rules);

    const v0 = await policy.version("latest");
    expect(v0.version).to.eq("v0");
    expect(v0.rules).to.eql(v0Rules);

    console.log(`Update policy ${policy.id} with new rules`);
    const v1Rules: KeyPolicy = [
      {
        IfErc20Tx: {
          approve_limits: [
            {
              limit: "0x100",
            },
          ],
        },
      },
    ];
    await policy.setRules(v1Rules);
    const v1 = await policy.version("latest");
    expect(v1.version).to.eq("v1");
    expect(v1.rules).to.eql(v1Rules);
    expect(v1.id).to.eq(policy.id);

    const v1Again = await policy.version("v1");
    expect(v1Again.version).to.eq(v1.version);
    expect(v1Again.rules).to.eql(v1.rules);
    expect(v1Again.id).to.eq(v1.id);

    const v0Again = await policy.version("v0");
    expect(v0Again.version).to.eq(v0.version);
    expect(v0Again.rules).to.eql(v0.rules);
    expect(v0Again.id).to.eq(v0.id);
  });

  it("update policy name", async () => {
    const policy = await createPolicy("Key", ["AssertErc20Tx"]);
    const policyName = await policy.name();

    const newName = `new_policy_${randomInt(10000000)}`;
    await policy.setName(newName);
    expect(await policy.name()).to.eq(newName);

    console.log(`Looking up policy by new name ${newName}`);
    const policy1 = await org.getPolicy(newName);
    expect(policy1.id).to.eq(policy.id);
    expect(await policy1.name()).to.eq(newName);

    console.log(`Looking up policy by old name ${policyName}`);
    const policy2 = await org.getPolicy(policyName);
    expect(policy2.id).to.eq(policy.id);
    expect(await policy2.name()).to.eq(newName);
  });

  it("update policy metadata", async () => {
    const policy = await createPolicy("Key", ["AssertErc20Tx"]);
    expect(await policy.metadata()).to.be.undefined;

    const meta = "test value";
    await policy.setMetadata(meta);
    expect(await policy.metadata()).to.eql(meta);

    const metaAgain = ["1", 2, { three: "3" }];
    await policy.setMetadata(metaAgain);
    expect(await policy.metadata()).to.eql(metaAgain);

    const policyAgain = await org.getPolicy(policy.id);
    expect(await policyAgain.metadata()).to.eql(metaAgain);
  });

  it("list policies", async () => {
    console.log("Create 5 policies");
    const policies = await Promise.all([
      createPolicy("Key", ["AllowRawBlobSigning"]),
      createPolicy("Role", ["AssertErc20Tx"]),
      createPolicy("Key", ["AssertErc20Tx"]),
      createPolicy("Role", ["AssertErc20Tx"]),
      createWasmPolicy(await readFile("./test/fixtures/always_allow.wasm")),
    ]);

    console.log("Check that listing policies includes all 5 created policies");
    const listedPolicies = await org.policies({ all: true });
    for (const policy of policies) {
      console.log(`Looking for ${policy.id}`);
      const listedPolicy = listedPolicies.find((p) => p.id == policy.id);
      expect(listedPolicy).to.exist;
    }
  });

  it("attach policy", async () => {
    const keyPolicy = await createPolicy("Key", ["AllowRawBlobSigning"]);
    const rolePolicy = await createPolicy("Role", ["AssertErc20Tx"]);

    console.log("Clear key policy rules");
    await keyPolicy.setRules([]);

    console.log("Create a key for testing");
    const key = await org.createKey(Secp256k1.Evm, undefined, {
      policy: [`${keyPolicy.id}/v1`],
    });
    createdKeys.push(key);

    console.log("Create a role for testing");
    const role = await org.createRole();
    createdRoles.push(role);

    console.log("Add named policy to role");
    await role.appendPolicy([`${rolePolicy.id}/latest`]);

    console.log("Add key to role");
    await role.addKey(key, [`${keyPolicy.id}/v0`]);

    console.log("Key policy should be attached to two entities");
    let attached = await keyPolicy.allAttached();
    expect(attached).to.have.length(2);

    console.log("Key policy v0 should only be attached to the key in role");
    attached = await (await keyPolicy.version("v0")).allAttached();
    expect(attached).to.have.length(1);
    expect(attached[0]).to.eql({ key_id: key.id, role_id: role.id });

    console.log("Key policy v1 should only be attached to the key");
    attached = await (await keyPolicy.version("v1")).allAttached();
    expect(attached).to.have.length(1);
    expect(attached[0]).to.eql({ key_id: key.id });

    console.log("Role policy should be attached to the role");
    attached = await rolePolicy.allAttached();
    expect(attached).to.have.length(1);
    expect(attached[0]).to.eql({ role_id: role.id });
  });

  it("lists policies by type", async () => {
    // add a policy of each type, to make sure the test is interesting
    await Promise.all([
      createPolicy("Key", ["AllowRawBlobSigning"]),
      createPolicy("Role", ["AssertErc20Tx"]),
      createWasmPolicy(await readFile("./test/fixtures/always_allow.wasm")),
    ]);

    for (const policyType of ["Key", "Role", "Wasm"] satisfies PolicyType[]) {
      const policies = await org.policies(undefined, policyType);
      assert(policies.every((policy) => policy.policyType === policyType));
    }
  });

  it("policy acl", async () => {
    console.log("Create two keys and a role for testing");
    const [key1, key2, role] = await Promise.all([
      org.createKey(Secp256k1.Evm),
      org.createKey(Secp256k1.Evm),
      org.createRole(),
    ]);
    createdKeys.push(key1, key2);
    createdRoles.push(role);

    console.log("Add the keys to the role");
    await role.addKeys([key1, key2]);

    console.log("Create a policy that can only be attached to key1");
    const key1Ace = { subjects: "*", actions: ["attach"] as "attach"[], resources: [key1.id] };
    const policy = await createWasmPolicy(await readFile("./test/fixtures/always_allow.wasm"), [
      key1Ace,
    ]);
    expect(await policy.acl()).to.eql([key1Ace]);
    const policyRef = `${policy.id}/latest` as PolicyReference;

    console.log("Policy should be attachable to key1");
    await key1.setPolicy([policyRef]);

    console.log("Policy should not be attachable to key2");
    await assertErrorCode("Acl", key2.setPolicy([policyRef]));

    console.log("Policy should not be attachable to role");
    await assertErrorCode("Acl", role.setPolicy([policyRef]));

    console.log("Policy should not be attachable to key1 in role");
    await assertErrorCode("Acl", role.addKey(key1, [policyRef]));

    console.log("Policy should not be attachable to key2 in role");
    await assertErrorCode("Acl", role.addKey(key2, [policyRef]));

    console.log("Update the policy to allow attaching to key2 in role");
    const key2Ace = {
      subjects: [me.user_id],
      actions: ["attach"] as "attach"[],
      resources: [{ key_ids: [key2.id], role_ids: [role.id] }],
    };
    await policy.setAcl([key1Ace, key2Ace]);
    expect(await policy.acl()).to.eql([key1Ace, key2Ace]);

    console.log("We can still attach it to key1");
    await key1.setPolicy([policyRef]);

    console.log("We can attach it to key2 in role");
    await role.addKey(key2, [policyRef]);

    console.log("We still can't attach it to key2");
    await assertErrorCode("Acl", key2.setPolicy([policyRef]));

    console.log("We still can't attach it to key1 in role");
    await assertErrorCode("Acl", role.addKey(key1, [policyRef]));
  });

  /**
   * Helper function for creating a named policy.
   *
   * @param type The policy type, defaults to "Key".
   * @param rules The policy rules, defaults to "AssertErc20Tx".
   * @returns the created policy.
   */
  const createPolicy = async <Type extends "Key" | "Role">(
    type: Type,
    rules: Type extends "Key" ? KeyPolicy : RolePolicy,
  ) => {
    const policyName = `${type.toLowerCase()}_policy_${randomInt(10000000)}`;
    console.log(`Create policy ${policyName}`);
    const policy = await org.createPolicy(policyName, type, rules);

    console.log(`Created ${policy.id}`);
    createdPolicies.push(policy);

    expect(await policy.name()).to.eq(policyName);
    expect(policy.policyType).to.eq(type);

    return policy;
  };

  /**
   * Helper function for creating a wasm policy.
   *
   * @param wasmPolicy The wasm policy object to create the policy from.
   * @param acl Optional access control entries.
   * @returns the created policy.
   */
  const createWasmPolicy = async (wasmPolicy: Uint8Array, acl?: PolicyAcl) => {
    const policyName = `wasm_policy_${randomInt(10000000)}`;
    console.log(`Create policy ${policyName}`);
    const policy = await org.createWasmPolicy(policyName, wasmPolicy, acl);

    console.log(`Created ${policy.id}`);
    createdPolicies.push(policy);

    expect(await policy.name()).to.eq(policyName);
    expect(policy.policyType).to.eq("Wasm");

    return policy;
  };
});

describe("Key Policy", () => {
  let createdKeys: Key[];
  let createdPolicies: NamedPolicy[];
  let org: Org;

  beforeAll(async () => {
    createdPolicies = [];
    createdKeys = [];

    const client = await newCubeSigner();
    org = client.org();
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
    await deletePolicies(createdPolicies);
  });

  it("top-level named policy saves", async () => {
    const rawBlobNamedPolicy = await org.createPolicy(`key_policy_${randomInt(10000000)}`, "Key", [
      "AllowRawBlobSigning",
    ]);
    createdPolicies.push(rawBlobNamedPolicy);
    const rawBlobPolicyName = await rawBlobNamedPolicy.name();

    const allowPolicies: KeyPolicy = ["AllowEip712Signing", "AllowRawBlobSigning"];
    const keyDenyPolicy: KeyPolicyRule = {
      And: [{ RequireRoleSession: "*" }, "AssertTransferOnlyTx"],
    };

    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);

    await key.setPolicy([...allowPolicies, keyDenyPolicy, `${rawBlobPolicyName}/latest`]);
    expect((await key.policy()).length).to.eq(4);
  });

  it("conjunction named policy saves", async () => {
    const assertErc20NamedPolicy = await org.createPolicy(
      `key_policy_${randomInt(10000000)}`,
      "Key",
      ["AssertErc20Tx"],
    );
    createdPolicies.push(assertErc20NamedPolicy);
    const erc20PolicyId = assertErc20NamedPolicy.id;

    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);

    await key.setPolicy([
      "AllowDiffieHellmanExchange",
      { And: [{ Reference: `${erc20PolicyId}/latest` }, { RequireRoleSession: "*" }] },
    ]);

    expect((await key.policy()).length).to.eq(2);
  });
});
