/* eslint-disable @typescript-eslint/no-explicit-any */

import { assert, expect, should } from "chai";
import { authenticator } from "otplib";
import {
  Bls,
  BtcSignatureKind,
  CubeSigner,
  Ed25519,
  Eth2SignRequest,
  Eth2UnstakeRequest,
  KeyType,
  MemorySessionStorage,
  OperationKind,
  Org,
  Role,
  Secp256k1,
  SignerSession,
  Stark,
} from "../src";
import { newCubeSigner } from "./setup";
import { assertPreconditionFailed } from "./helpers";

describe("Sign", () => {
  let cs: CubeSigner;
  let org: Org;
  let role: Role;
  let session: SignerSession;
  let totpSecret: string;
  let userSignerSession: SignerSession;

  beforeAll(async () => {
    cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    const orgId = aboutMe.org_ids[0];
    org = await cs.getOrg(orgId);
    console.log("Creating a role");
    role = await org.createRole();
    console.log("Creating a token");
    session = await role.createSession(new MemorySessionStorage(), "ts-sign-test");
    console.log("Configuring TOTP");
    const secret = new URL((await cs.resetTotp()).totp_url).searchParams.get("secret");
    assert(secret);
    totpSecret = secret!;

    console.log("Creating a user signer session");
    const oidcToken = await cs.sessionMgr!.token();
    const sessionMgr = await cs.oidcAuth(oidcToken, org.id, ["sign:*"]);
    userSignerSession = new SignerSession(sessionMgr);
  });

  afterAll(async () => {
    await role.delete();
  });

  it("evm", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a secp key");
    const secp = await org.createKey(Secp256k1.Evm);

    console.log("Adding key to role");
    await role.addKey(secp);

    console.log("Signing an EVM tx");
    const req = {
      chain_id: 1,
      tx: <any>{
        type: "0x00",
        gas: "0x61a80",
        gasPrice: "0x77359400",
        nonce: "0",
      },
    };

    {
      const sig = await session.signEvm(secp, req);
      console.log(`Signed EVM: ${JSON.stringify(sig.data())}`);
    }

    console.log("Requiring MFA");
    await role.addKey(secp, [{ RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await session.signEvm(secp, req);
      const sig = await resp.approve(cs);
      console.log(`Signed EVM after MFA approved using CubeSigner: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await session.signEvm(secp, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userSignerSession, code);
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("btc", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a secp key");
    const secp = await org.createKey(Secp256k1.Btc);

    console.log("Adding key to role");
    await role.addKey(secp);

    console.log("Signing a BTC tx");
    const req = {
      sig_kind: <BtcSignatureKind>{
        Segwit: {
          input_index: 0,
          script_code: "0x76a91479091972186c449eb1ded22b78e40d009bdf008988ac",
          value: 1_000_000,
          sighash_type: "All",
        },
      },
      tx: <any>{
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
      },
    };

    {
      const sig = await session.signBtc(secp, req);
      console.log(`Signed btc: ${JSON.stringify(sig.data())}`);
    }

    console.log("Requiring MFA");
    await role.addKey(secp, [{ RequireMfa: {} }]);

    // request then approve using CubeSigner management sessions
    {
      const resp = await session.signBtc(secp, req);
      const sig = await resp.approve(cs);
      console.log(`Signed btc after MFA: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await session.signBtc(secp, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userSignerSession, code);
      console.log(`Signed btc after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("eth2", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a BLS key");
    const bls = await org.createKey(Bls.Eth2Inactive);

    console.log("Adding key to role");
    await role.addKey(bls);

    // Turn the key from inactive into a regular BLS key
    await session.stake({
      chain_id: 1,
      deposit_type: "Canonical",
      validator_key: bls.materialId,
      withdrawal_addr: "0x8e3484687e66cdd26cf04c3647633ab4f3570148",
      unsafe_conf: null,
    });
    expect(await bls.type()).to.equal(Bls.Eth2Deposited);

    console.log("Signing an eth2 tx");
    const req = <Eth2SignRequest>{
      network: "mainnet",
      eth2_sign_request: <any>{
        aggregation_slot: {
          slot: "36",
        },
        fork_info: {
          fork: {
            current_version: "0x42424242",
            epoch: "0",
            previous_version: "0x42424242",
          },
          genesis_validators_root:
            "0x9d13d61212c067e02ce8e608a7007e2c3b02571e9e6f27ff45dfa91bf27c870b",
        },
        signingRoot: "0x9c57e77c4965727542b9337df6756f948464bca3859bea6ed3c0ec6600d8982a",
        type: "AGGREGATION_SLOT",
      },
    };

    {
      const sig = await session.signEth2(bls, req);
      console.log(`Signed eth2: ${sig.data().signature}`);
    }

    console.log("Requiring MFA");
    await role.addKey(bls, [{ RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await session.signEth2(bls, req);
      const sig = await resp.approve(cs);
      console.log(`Signed eth2 after MFA: ${sig.data().signature}`);
    }

    // request then approve using TOTP code
    {
      const resp = await session.signEth2(bls, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userSignerSession, code);
      console.log(`Signed eth2 after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("stake/unstake", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a BLS key");
    const bls = await org.createKey(Bls.Eth2Inactive);

    console.log("Adding key to role");
    await role.addKey(bls);

    console.log("Staking");
    const sig = await session.stake({
      chain_id: 1,
      deposit_type: "Canonical",
      validator_key: bls.materialId,
      withdrawal_addr: "0x8e3484687e66cdd26cf04c3647633ab4f3570148",
      unsafe_conf: null,
    });

    console.log("Stake: " + JSON.stringify(sig.data()));
    expect(await bls.type()).to.equal(Bls.Eth2Deposited);

    console.log("Unstaking");
    const req = <Eth2UnstakeRequest>{
      network: "goerli",
      fork: {
        previous_version: "0x00001020",
        current_version: "0x00001020",
        epoch: "0",
      },
      genesis_data: {
        genesis_time: "1679541642",
        genesis_validators_root:
          "0x270d43e74ce340de4bca2b1936beca0f4f5408d9e78aec4850920baf659d5b69",
        genesis_fork_version: "0x00001020",
      },
      validator_index: "0",
      epoch: "256",
    };

    {
      const sig = await session.unstake(bls, req);
      console.log("Unstake: " + JSON.stringify(sig.data()));
    }

    console.log("Requiring MFA");
    await role.addKey(bls, [{ RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await session.unstake(bls, req);
      const sig = await resp.approve(cs);
      console.log("Unstake after MFA: " + JSON.stringify(sig.data()));
    }

    // request then approve using TOTP code
    {
      const resp = await session.unstake(bls, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userSignerSession, code);
      console.log(`Unstake after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("blob", async () => {
    expect(await role.enabled()).to.equal(true);
    for (const keyType of [
      Ed25519.Aptos,
      Ed25519.Cardano,
      Secp256k1.Ava,
      Secp256k1.AvaTest,
      Stark,
    ]) {
      console.log(`Creating a ${keyType} key`);
      const key = await org.createKey(keyType as KeyType);
      expect(await key.type()).eq(keyType);

      console.log("Adding key to role");
      await role.addKey(key);

      console.log("Signing a blob");
      const req = { message_base64: "L1kE9g59xD3fzYQQSR7340BwU9fGrP6EMfIFcyX/YBc=" };
      await assertPreconditionFailed(session.signBlob(key, req));

      {
        await role.addKey(key, ["AllowRawBlobSigning"]);
        const sig = await session.signBlob(key, req);
        console.log(`Signed blob: ${JSON.stringify(sig.data())}`);
      }

      console.log("Requiring MFA");
      await role.addKey(key, ["AllowRawBlobSigning", { RequireMfa: {} }]);

      // request then approve using CubeSigner management session
      {
        const resp = await session.signBlob(key, req);
        const sig = await resp.approve(cs);
        console.log(`Signed blob after MFA: ${JSON.stringify(sig.data())}`);
      }

      // request then approve using TOTP code
      {
        const resp = await session.signBlob(key, req);
        const code = authenticator.generate(totpSecret);
        const sig = await resp.approveTotp(userSignerSession, code);
        console.log(`Signed blob after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
      }
    }
  }, /* timeoutMs */ 120000);

  it("mfa", async () => {
    expect(await role.enabled()).to.equal(true);
    for (const keyType of [Ed25519.Aptos, Ed25519.Cardano]) {
      console.log(`Creating a ${keyType} key`);
      const edKey = await org.createKey(keyType as KeyType);

      console.log("Adding key to role");
      await role.addKey(edKey, [
        "AllowRawBlobSigning",
        {
          RequireMfa: {
            restricted_operations: [OperationKind.BlobSign],
          },
        },
      ]);

      console.log("Signing a blob");
      const req = { message_base64: "L1kE9g59xD3fzYQQSR7340BwU9fGrP6EMfIFcyX/YBc=" };
      let resp = await session.signBlob(edKey, req);

      // assert the response is 202
      expect(resp.requiresMfa()).to.equal(true);

      // sign again with approval
      console.log("Signing again with approval");
      resp = await resp.approve(cs);
      const sig = resp.data().signature;
      should().exist(sig);

      console.log(`Signed blob: ${sig}`);
    }
  });
});
