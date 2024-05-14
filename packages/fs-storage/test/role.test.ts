/* eslint-disable @typescript-eslint/no-explicit-any */

import { expect } from "chai";
import type {
  CsErrCode,
  EvmSignRequest,
  Org,
  Role,
  TxGasCostLimit,
  TxValueLimit,
} from "@cubist-labs/cubesigner-sdk";
import { Key, delay } from "@cubist-labs/cubesigner-sdk";
import { CubeSignerClient, Secp256k1 } from "@cubist-labs/cubesigner-sdk";
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
    const client = await newCubeSigner();
    const aboutMe = await client.user();
    org = client.org();
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
    expect(await role.users()).to.deep.equal([me]);
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
    const errResp = await assertForbidden(role.removeKey(key));
    expect(errResp.errorCode).to.eq(<CsErrCode>"KeyNotInRole");
  });

  it("add, remove user to role", async () => {
    await role.addUser(me);
    expect(await role.users()).to.deep.equal([me]);
    expect(await (await org.getRole(role.id)).users()).to.deep.equal([me]);

    await role.removeUser(me);
    expect(await role.users()).to.deep.equal([]);
    expect(await (await org.getRole(role.id)).users()).to.deep.equal([]);
  });

  it("add bad user throws", async () => {
    await assertNotFound(role.addUser("bad"));
  });

  it("role policy", async () => {
    const sessionData = await role.createSession("test");
    const roleClient = await CubeSignerClient.create(sessionData);

    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);
    await role.addKey(secp);
    const signingKey = new Key(roleClient, secp.cached);

    // signing without policy should succeed
    const badTx = <EvmSignRequest>{
      chain_id: 1,
      tx: <any>{
        to: "0x0000000000000000000000000000000000000000",
        value: "0x12A05F201",
        type: "0x00",
        gas: "0x61a80",
        gasPrice: "0x77359400",
        nonce: "0xb",
      },
    };
    {
      const sig = await signingKey.signEvm(badTx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // set TxReceiver role policy
    const receiver = "0x8c594691c0e592ffa21f153a16ae41db5befcaaa";
    const txRecevierPolicy = [{ TxReceiver: receiver }];
    await role.setPolicy(txRecevierPolicy);
    expect(await role.policy()).to.deep.equal(txRecevierPolicy);

    // signing bad transaction with TxReceiver policy should fail
    let errResp = await assertPreconditionFailed(signingKey.signEvm(badTx));
    expect(errResp.errorCode).to.eq(<CsErrCode>"EvmTxReceiverMismatch");

    // signing good transaction with TxReceiver policy should succeed
    let goodTx = {
      chain_id: 1,
      tx: <any>{
        ...badTx.tx,
        to: receiver,
      },
    };
    console.log(goodTx);
    {
      const sig = await signingKey.signEvm(goodTx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // set TxValueLimit policy
    const maxValue = 5 * 10 ** 9;
    const txValueLimitPolicy: TxValueLimit[] = [{ TxValueLimit: `0x${maxValue.toString(16)}` }];
    console.log(txValueLimitPolicy[0]);
    await role.setPolicy(txValueLimitPolicy);
    expect(await role.policy()).to.deep.equal(txValueLimitPolicy);

    // signing a bad tx with TxValueLimit policy should fail
    errResp = await assertPreconditionFailed(signingKey.signEvm(badTx));
    expect(errResp.errorCode).to.eq(<CsErrCode>"EvmTxExceededValue");

    // signing a good tx with TxValueLimit policy should succeed
    goodTx = {
      chain_id: 1,
      tx: {
        ...badTx.tx,
        value: `0x${(maxValue - 100).toString(16)}`,
      },
    };
    {
      const sig = await signingKey.signEvm(goodTx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // set TxValueLimit policy with a window of 2s
    const txValueLimitWindowPolicy: TxValueLimit[] = [
      { TxValueLimit: { limit: `0x${maxValue.toString(16)}`, window: 2, chain_ids: ["1"] } },
    ];
    console.log(txValueLimitWindowPolicy[0]);
    await role.setPolicy(txValueLimitWindowPolicy);
    expect(await role.policy()).to.deep.equal(txValueLimitWindowPolicy);

    // signing a bad tx with TxValueLimit policy should fail
    errResp = await assertPreconditionFailed(signingKey.signEvm(badTx));
    expect(errResp.errorCode).to.eq(<CsErrCode>"EvmTxExceededValue");

    // signing a good tx with TxValueLimit policy should succeed *once*
    goodTx = {
      chain_id: 1,
      tx: {
        ...badTx.tx,
        value: `0x${(maxValue - 100).toString(16)}`,
      },
    };
    {
      const sig = await signingKey.signEvm(goodTx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // but fail a second time, since we exceed value within the window
    errResp = await assertPreconditionFailed(signingKey.signEvm(goodTx));
    expect(errResp.errorCode).to.eq(<CsErrCode>"EvmTxExceededValue");

    // however, a bad tx for a different chain should succeed
    {
      const sig = await signingKey.signEvm({ chain_id: 2, tx: badTx.tx });
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // and succeed again after 2 seconds.
    await delay(2000);
    {
      const sig = await signingKey.signEvm(goodTx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // set TxGasCostLimit policy
    const maxGasCost = 5 * 10 ** 7;
    const txGasCostLimitPolicy: TxGasCostLimit[] = [
      { TxGasCostLimit: `0x${maxGasCost.toString(16)}` },
    ];
    await role.setPolicy(txGasCostLimitPolicy);
    expect(await role.policy()).to.deep.equal(txGasCostLimitPolicy);

    // signing a bad tx with TxGasCostLimit policy should fail
    errResp = await assertPreconditionFailed(signingKey.signEvm(badTx));
    expect(errResp.errorCode).to.eq(<CsErrCode>"EvmTxExceededGasCost");

    // signing a tx with no gasPrice with TxGasCostLimit should fail
    errResp = await assertPreconditionFailed(
      signingKey.signEvm({
        chain_id: 1,
        tx: <any>{
          ...badTx.tx,
          gasPrice: undefined,
        },
      }),
    );
    expect(errResp.errorCode).to.eq(<CsErrCode>"EvmTxGasCostUndefined");

    // signing a good tx with TxGasCostLimit policy should succeed
    goodTx = {
      chain_id: 1,
      tx: {
        ...badTx.tx,
        gasPrice: `0x${((maxGasCost - 5000) / 100).toString(16)}`,
        gas: `0x${(100).toString(16)}`,
      },
    };
    {
      const sig = await signingKey.signEvm(goodTx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // set SourceIpAllowlist role policy
    const sourceIpAllowlistPolicy = [{ SourceIpAllowlist: ["10.0.0.0/8", "169.254.0.0/16"] }];
    await role.setPolicy(sourceIpAllowlistPolicy);
    expect(await role.policy()).to.deep.equal(sourceIpAllowlistPolicy);

    // signing with SourceIpAllowlist policy should fail
    errResp = await assertPreconditionFailed(signingKey.signEvm(goodTx));
    expect(errResp.errorCode).to.eq(<CsErrCode>"NotInIpv4Allowlist");
  });
});
