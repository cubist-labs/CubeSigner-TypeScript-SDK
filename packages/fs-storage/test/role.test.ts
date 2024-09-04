/* eslint-disable @typescript-eslint/no-explicit-any */

import * as solana from "@solana/web3.js";
import { expect } from "chai";
import type {
  CsErrCode,
  EvmSignRequest,
  EvmTxCmp,
  Org,
  Role,
  RolePolicy,
  TxGasCostLimit,
  TxValueLimit,
  SolanaInstructionPolicy,
  BtcSegwitValueLimit,
} from "@cubist-labs/cubesigner-sdk";
import { Ed25519, Key, delay } from "@cubist-labs/cubesigner-sdk";
import { CubeSignerClient, Secp256k1 } from "@cubist-labs/cubesigner-sdk";
import { newCubeSigner } from "./setup";
import {
  assertErrorCode,
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

  it("MFA policy with EvmTx comparer", async () => {
    const sessionData = await role.createSession("test MFA EvmTxCmp");
    const roleClient = await CubeSignerClient.create(sessionData);
    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);
    await role.addKey(secp);
    const signingKey = new Key(roleClient, secp.cached);

    const mkReq = (value: string, nonce: string, gas: string): EvmSignRequest => {
      return {
        chain_id: 1,
        tx: {
          type: "0x00",
          to: "0x0000000000000000000000000000000000000000",
          value,
          nonce,
          gas,
        },
      };
    };

    // test "Eq" policy
    {
      await role.setPolicy([{ RequireMfa: { lifetime: 60, request_comparer: "Eq" } }]);
      const req = mkReq("0x1", "0x1", "0x1");
      const resp = await signingKey.signEvm(req);
      expect(resp.requiresMfa()).to.be.true;
      const rec = await org
        .getMfaRequest(resp.mfaId())
        .approve()
        .then((x) => x.receipt());
      expect(rec).to.exist;
      for (const differentReq of [
        mkReq("0x2", "0x1", "0x1"),
        mkReq("0x1", "0x2", "0x1"),
        mkReq("0x1", "0x1", "0x2"),
      ]) {
        console.log("Signing", differentReq, "SHOULD FAIL with MfaHttpRequestMismatch");
        await assertErrorCode("MfaHttpRequestMismatch", signingKey.signEvm(differentReq, rec));
      }
      console.log("Signing", req, "SHOULD succeed");
      const signed = await signingKey.signEvm(req, rec);
      expect(signed.requiresMfa()).to.be.false;
      expect(signed.data().rlp_signed_tx).to.not.be.empty;
    }

    // test "EvmTx" comparer with ignore_nonce set to true
    {
      await role.setPolicy([
        {
          RequireMfa: {
            lifetime: 60,
            request_comparer: { EvmTx: { ignore_gas: false, ignore_nonce: true } },
          },
        },
      ]);
      const req = mkReq("0x1", "0x1", "0x1");
      const resp = await signingKey.signEvm(req);
      expect(resp.requiresMfa()).to.be.true;
      const rec = await org
        .getMfaRequest(resp.mfaId())
        .approve()
        .then((x) => x.receipt());
      expect(rec).to.exist;
      for (const differentReq of [mkReq("0x2", "0x1", "0x1"), mkReq("0x1", "0x1", "0x2")]) {
        console.log("Signing", differentReq, "SHOULD FAIL with MfaHttpRequestMismatch");
        await assertErrorCode("MfaHttpRequestMismatch", signingKey.signEvm(differentReq, rec));
      }
      const req2 = mkReq("0x1", "0x2", "0x1");
      console.log("Signing", req2, "SHOULD succeed even though it has different nonce");
      const signed = await signingKey.signEvm(req2, rec);
      expect(signed.requiresMfa()).to.be.false;
      expect(signed.data().rlp_signed_tx).to.not.be.empty;

      console.log("Signing original", req, "SHOULD FAIL because MFA was already used");
      await assertErrorCode("MfaRequestNotFound", signingKey.signEvm(req, rec));
    }

    // test "EvmTx" comparer with ignore nonce and gas and has grace period
    {
      await role.setPolicy([
        {
          RequireMfa: {
            lifetime: 60,
            request_comparer: { EvmTx: { ignore_gas: true, ignore_nonce: true, grace: 30 } },
          },
        },
      ]);
      const req = mkReq("0x1", "0x1", "0x1");
      const resp = await signingKey.signEvm(req);
      expect(resp.requiresMfa()).to.be.true;
      const rec = await org
        .getMfaRequest(resp.mfaId())
        .approve()
        .then((x) => x.receipt());
      expect(rec).to.exist;
      for (const differentReq of [mkReq("0x2", "0x1", "0x1"), mkReq("0x2", "0x1", "0x2")]) {
        console.log("Signing", differentReq, "SHOULD FAIL with MfaHttpRequestMismatch");
        await assertErrorCode("MfaHttpRequestMismatch", signingKey.signEvm(differentReq, rec));
      }
      const req2 = mkReq("0x1", "0x2", "0x2");
      console.log("Signing", req2, "SHOULD succeed even though it has different nonce");
      let signed = await signingKey.signEvm(req2, rec);
      expect(signed.requiresMfa()).to.be.false;
      expect(signed.data().rlp_signed_tx).to.not.be.empty;

      console.log("Signing original", req, "SHOULD FAIL because already signed different nonce");
      await assertErrorCode("MfaHttpRequestMismatch", signingKey.signEvm(req, rec));

      const req3 = mkReq("0x1", "0x2", "0x3");
      console.log("Signing", req3, "SHOULD succeed even though it has different gas");
      signed = await signingKey.signEvm(req2, rec);
      expect(signed.requiresMfa()).to.be.false;
      expect(signed.data().rlp_signed_tx).to.not.be.empty;

      console.log(
        "Retrieving",
        resp.mfaId(),
        "SHOULD work because the grace period has not expired",
      );
      const mfaReq = await org.getMfaRequest(resp.mfaId()).fetch();
      console.log("MFA request", JSON.stringify(mfaReq, undefined, 2));
      expect(mfaReq).to.exist;

      console.log("The comparing must not be ignoring nonce any longer");
      expect((mfaReq.status.request_comparer as { EvmTx: EvmTxCmp })?.EvmTx.ignore_nonce).to.be
        .false;
    }
  });

  it("role evm policy", async () => {
    const sessionData = await role.createSession("test");
    const roleClient = await CubeSignerClient.create(sessionData);

    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);
    await role.addKey(secp);
    const signingKey = new Key(roleClient, secp.cached);

    // signing without policy should succeed
    const badTx = <EvmSignRequest>{
      chain_id: 1,
      tx: {
        to: "0x0000000000000000000000000000000000000000",
        value: "0x12A05F201",
        type: "0x0",
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

  it("role erc-20 policy", async () => {
    const sessionData = await role.createSession("test");
    const roleClient = await CubeSignerClient.create(sessionData);

    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);
    await role.addKey(secp);
    const signingKey = new Key(roleClient, secp.cached);

    // signing without policy should succeed
    let tx = {
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
      const sig = await signingKey.signEvm(tx);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    // Only allow ERC-20 transactions
    let policy: RolePolicy = ["AssertErc20Tx"];
    await role.setPolicy(policy);
    expect(await role.policy()).to.deep.equal(policy);
    {
      const errResp = await assertPreconditionFailed(signingKey.signEvm(tx));
      expect(errResp.errorCode).to.eq(<CsErrCode>"Erc20DataInvalid");
    }

    // Only allow ERC-20 method calls to one contract
    // First update the tx with a valid transfer call
    // value: 1000 (0x3e8)
    // to: 0xaaaabbbbccccddddeeeeffff0000111122223333
    tx = {
      chain_id: tx.chain_id,
      tx: <any>{
        ...tx.tx,
        data: "0xa9059cbb000000000000000000000000aaaabbbbccccddddeeeeffff000011112222333300000000000000000000000000000000000000000000000000000000000003e8",
      },
    };

    // Set the new policy
    const contract = {
      chain_id: "1",
      address: "0x0000000000000000000000000000000000000000",
    };
    policy = [
      {
        IfErc20Tx: {
          allowed_contracts: [contract],
        },
      },
    ];
    await role.setPolicy(policy);
    expect(await role.policy()).to.deep.equal(policy);

    // A non-ERC-20 tx should succeed
    {
      const sig = await signingKey.signEvm({
        ...tx,
        tx: {
          ...tx.tx,
          data: undefined,
        },
      });
      console.log(`Signed tx: ${JSON.stringify(sig.data())}`);
    }

    // A valid ERC-20 tx to the contract should succeed
    {
      const sig = await signingKey.signEvm(tx);
      console.log(`Signed ERC-20 tx: ${JSON.stringify(sig.data())}`);
    }

    // A valid ERC-20 tx to a different contract should fail
    {
      const errResp = await assertPreconditionFailed(
        signingKey.signEvm({ chain_id: 5, tx: tx.tx }),
      );
      expect(errResp.errorCode).to.eq(<CsErrCode>"Erc20NotInContractAllowlist");
    }

    // Only allow ERC-20 transfers below 1000 to "0xaaaabbbbccccddddeeeeffff0000111122223333"
    policy = [
      {
        IfErc20Tx: {
          transfer_limits: [
            {
              limit: "0x3e8",
              receivers: ["0xaaaabbbbccccddddeeeeffff0000111122223333"],
              applies_to_contracts: [contract],
            },
          ],
        },
      },
    ];
    await role.setPolicy(policy);
    expect(await role.policy()).to.deep.equal(policy);

    // The transfer should still succeed
    {
      const sig = await signingKey.signEvm(tx);
      console.log(`Signed ERC-20 tx: ${JSON.stringify(sig.data())}`);
    }

    // But the same transfer for a higher amount should fail
    {
      const errResp = await assertPreconditionFailed(
        signingKey.signEvm({ ...tx, tx: { ...tx.tx, data: tx.tx.data.replace("3e8", "3e9") } }),
      );
      expect(errResp.errorCode).to.eq(<CsErrCode>"Erc20ExceededTransferLimit");
    }

    // So should a transfer to a different receiver
    {
      const errResp = await assertPreconditionFailed(
        signingKey.signEvm({
          ...tx,
          tx: {
            ...tx.tx,
            data: tx.tx.data.replace(
              "aaaabbbbccccddddeeeeffff0000111122223333",
              "1111111111111111111111111111111111111111",
            ),
          },
        }),
      );
      expect(errResp.errorCode).to.eq(<CsErrCode>"Erc20ReceiverMismatch");
    }

    // A non-ERC-20 tx should also succeed
    {
      const sig = await signingKey.signEvm({
        ...tx,
        tx: {
          ...tx.tx,
          data: undefined,
        },
      });
      console.log(`Signed tx: ${JSON.stringify(sig.data())}`);
    }

    // Only allow ERC-20 approvals below 1000 to "0xaaaabbbbccccddddeeeeffff0000111122223333"
    policy = [
      {
        IfErc20Tx: {
          approve_limits: [
            {
              limit: "0x3e8",
              spenders: ["0xaaaabbbbccccddddeeeeffff0000111122223333"],
              applies_to_contracts: [contract],
            },
          ],
        },
      },
    ];
    await role.setPolicy(policy);
    expect(await role.policy()).to.deep.equal(policy);

    // Update the tx to be an approval of 1000
    tx = {
      ...tx,
      tx: {
        ...tx.tx,
        data: "0x095ea7b3000000000000000000000000aaaabbbbccccddddeeeeffff000011112222333300000000000000000000000000000000000000000000000000000000000003e8",
      },
    };

    // The approval should succeed
    {
      const sig = await signingKey.signEvm(tx);
      console.log(`Signed ERC-20 tx: ${JSON.stringify(sig.data())}`);
    }

    // But the same approval for a higher amount should fail
    {
      const errResp = await assertPreconditionFailed(
        signingKey.signEvm({ ...tx, tx: { ...tx.tx, data: tx.tx.data.replace("3e8", "3e9") } }),
      );
      expect(errResp.errorCode).to.eq(<CsErrCode>"Erc20ExceededApproveLimit");
    }

    // So should an approval to a different spender
    {
      const errResp = await assertPreconditionFailed(
        signingKey.signEvm({
          ...tx,
          tx: {
            ...tx.tx,
            data: tx.tx.data.replace(
              "aaaabbbbccccddddeeeeffff0000111122223333",
              "1111111111111111111111111111111111111111",
            ),
          },
        }),
      );
      expect(errResp.errorCode).to.eq(<CsErrCode>"Erc20SpenderMismatch");
    }

    // A non-ERC-20 tx should also succeed
    {
      const sig = await signingKey.signEvm({
        ...tx,
        tx: {
          ...tx.tx,
          data: undefined,
        },
      });
      console.log(`Signed tx: ${JSON.stringify(sig.data())}`);
    }
  });

  it("role solana policy", async () => {
    const sessionData = await role.createSession("test");
    const roleClient = await CubeSignerClient.create(sessionData);

    // First, create a solana key that we can use
    const key = await org.createKey(Ed25519.Solana);
    createdKeys.push(key);
    await role.addKey(key);

    const signingKey = new Key(roleClient, key.cached);

    console.log("Adding a Solana 'count' policy should succeed...");
    let policy: SolanaInstructionPolicy = {
      SolanaInstructionPolicy: {
        count: {
          min: 3,
        },
      },
    };
    await role.setPolicy([policy]);
    expect(await role.policy()).to.deep.equal([policy]);

    const pubkey = new solana.PublicKey(key.materialId);
    const instruction = solana.SystemProgram.transfer({
      fromPubkey: pubkey,
      toPubkey: pubkey,
      lamports: 1000,
    });

    {
      console.log("Signing a transaction with 3 instructions should succeed...");
      const tx = new solana.Transaction().add(instruction, instruction, instruction);
      tx.recentBlockhash = "C2x8yfmoG48cKkeqSbXLiiBBkaFvExh4waapCue9LHzB"; // Need *some* value
      tx.feePayer = pubkey;
      await signingKey.signSolana({
        message_base64: tx.serializeMessage().toString("base64"),
      });
    }

    {
      console.log("But signing a transaction with 2 instructions should fail...");
      const tx = new solana.Transaction().add(instruction);
      tx.recentBlockhash = "C2x8yfmoG48cKkeqSbXLiiBBkaFvExh4waapCue9LHzB";
      tx.feePayer = pubkey;
      const resp = await assertPreconditionFailed(
        signingKey.signSolana({
          message_base64: tx.serializeMessage().toString("base64"),
        }),
      );
      expect(resp.errorCode).to.eq(<CsErrCode>"SolanaInstructionCountLow");
    }

    console.log("Adding a Solana 'allowlist' policy should succeed...");
    policy = {
      SolanaInstructionPolicy: {
        allowlist: [
          {
            program_id: solana.SystemProgram.programId.toBase58(),
          },
        ],
      },
    };
    await role.setPolicy([policy]);
    expect(await role.policy()).to.deep.equal([policy]);

    {
      console.log("Signing a transaction with an allowlist instruction should succeed...");
      const tx = new solana.Transaction().add(instruction);
      tx.recentBlockhash = "C2x8yfmoG48cKkeqSbXLiiBBkaFvExh4waapCue9LHzB";
      tx.feePayer = pubkey;
      await signingKey.signSolana({
        message_base64: tx.serializeMessage().toString("base64"),
      });
    }

    {
      console.log("But signing a transaction with a different instruction should fail...");
      const tx = new solana.Transaction().add(
        solana.ComputeBudgetProgram.setComputeUnitLimit({
          units: 100,
        }),
      );
      tx.recentBlockhash = "C2x8yfmoG48cKkeqSbXLiiBBkaFvExh4waapCue9LHzB";
      tx.feePayer = pubkey;
      const resp = await assertPreconditionFailed(
        signingKey.signSolana({
          message_base64: tx.serializeMessage().toString("base64"),
        }),
      );
      expect(resp.errorCode).to.eq(<CsErrCode>"SolanaNotInInstructionAllowlist");
    }

    console.log("Adding a Solana 'required' policy should succeed...");
    policy = {
      SolanaInstructionPolicy: {
        required: [
          {
            program_id: solana.SystemProgram.programId.toBase58(),
            index: 0,
          },
        ],
      },
    };
    await role.setPolicy([policy]);
    expect(await role.policy()).to.deep.equal([policy]);

    {
      console.log("Signing a transaction with the required instruction should succeed...");
      const tx = new solana.Transaction().add(instruction);
      tx.recentBlockhash = "C2x8yfmoG48cKkeqSbXLiiBBkaFvExh4waapCue9LHzB";
      tx.feePayer = pubkey;
      await signingKey.signSolana({
        message_base64: tx.serializeMessage().toString("base64"),
      });
    }

    {
      console.log("But signing a transaction without the required instruction should fail...");
      const tx = new solana.Transaction().add(
        solana.ComputeBudgetProgram.setComputeUnitLimit({
          units: 100,
        }),
      );
      tx.recentBlockhash = "C2x8yfmoG48cKkeqSbXLiiBBkaFvExh4waapCue9LHzB";
      tx.feePayer = pubkey;
      const resp = await assertPreconditionFailed(
        signingKey.signSolana({
          message_base64: tx.serializeMessage().toString("base64"),
        }),
      );
      expect(resp.errorCode).to.eq(<CsErrCode>"SolanaInstructionMismatch");
    }

    console.log("Adding a Solana policy with everything should succeed...");
    policy = {
      SolanaInstructionPolicy: {
        count: {
          min: 1,
          max: 2,
        },
        allowlist: [
          {
            program_id: key.materialId,
            index: 0,
            accounts: [
              {
                pubkey: key.materialId,
                index: 0,
              },
              {
                pubkey: key.materialId,
                index: 1,
              },
            ],
            data: "0x0200000000f2052a01000000",
          },
        ],
        required: [
          {
            program_id: key.materialId,
            index: 0,
            accounts: [
              {
                pubkey: key.materialId,
                index: 3,
              },
            ],
            data: [
              {
                data: "0x02",
                start_index: 0,
              },
            ],
          },
        ],
      },
    };
    await role.setPolicy([policy]);
    expect(await role.policy()).to.deep.equal([policy]);
  });

  it("role bitcoin policy", async () => {
    const sessionData = await role.createSession("test");
    const roleClient = await CubeSignerClient.create(sessionData);

    // First, create a bitcoin key that we can use
    const key = await org.createKey(Secp256k1.Btc);
    createdKeys.push(key);
    await role.addKey(key);

    const signingKey = new Key(roleClient, key.cached);

    console.log("Adding a Segwit value limit policy that's just the limit...");
    let policy: BtcSegwitValueLimit = {
      BtcSegwitValueLimit: 1000000,
    };
    await role.setPolicy([policy]);
    expect(await role.policy()).to.deep.equal([policy]);

    const sign = async (value: number) =>
      signingKey.signBtc({
        tx: {
          version: 1,
          lock_time: 1170,
          input: [
            {
              previous_output: "77541aeb3c4dac9260b68f74f44c973081a9d4cb2ebe8038b2d70faa201b6bdb:1",
              script_sig: "",
              sequence: 4294967294,
              witness: [],
            },
          ],
          output: [
            {
              value: 199996600,
              script_pubkey: "76a914a457b684d7f0d539a46a45bbc043f35b59d0d96388ac",
            },
            {
              value: 800000000,
              script_pubkey: "76a914fd270b1ee6abcaea97fea7ad0402e8bd8ad6d77c88ac",
            },
          ],
        } as unknown as Record<string, never>,
        sig_kind: {
          Segwit: {
            input_index: 0,
            script_code: "0x76a91479091972186c449eb1ded22b78e40d009bdf008988ac",
            sighash_type: "All",
            value,
          },
        },
      });

    console.log("Signing a tx under the limit should succeed...");
    await sign(1000);
    let resp = await assertPreconditionFailed(sign(2000000));
    console.log("But signing over the limit should fail...");
    expect(resp.errorCode).to.equal(<CsErrCode>"BtcSignatureExceededValue");

    console.log("Adding a Segwit value limit policy using the 'limit' field...");
    policy = {
      BtcSegwitValueLimit: { limit: 1000000 },
    };
    await role.setPolicy([policy]);
    expect(await role.policy()).to.deep.equal([policy]);

    console.log("Signing a tx under the limit should succeed...");
    await sign(1000);
    resp = await assertPreconditionFailed(sign(2000000));
    console.log("But signing over the limit should fail...");
    expect(resp.errorCode).to.equal(<CsErrCode>"BtcSignatureExceededValue");

    console.log("Adding a Segwit value limit policy with a window...");
    policy = {
      BtcSegwitValueLimit: { limit: 1000, window: 60 },
    };
    await role.setPolicy([policy]);
    expect(await role.policy()).to.deep.equal([policy]);

    console.log("Signing a tx under the limit should succeed...");
    await sign(600);

    console.log("But signing two in the window should fail...");
    resp = await assertPreconditionFailed(sign(600));
    expect(resp.errorCode).to.equal(<CsErrCode>"BtcSignatureExceededValue");
  });
});
