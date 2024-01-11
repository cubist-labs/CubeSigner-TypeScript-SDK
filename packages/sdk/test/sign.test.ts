/* eslint-disable @typescript-eslint/no-explicit-any */

import { assert, expect, should } from "chai";
import { authenticator } from "otplib";
import {
  AllowEip191Signing,
  AllowEip712Signing,
  Bls,
  BtcSignatureKind,
  Ed25519,
  Eip191SignRequest,
  Eip712SignRequest,
  Eth2SignRequest,
  Eth2UnstakeRequest,
  Key,
  KeyType,
  MemorySessionStorage,
  OperationKind,
  Org,
  Role,
  Secp256k1,
  SignerSession,
  Stark,
  encodeToHex,
} from "../src";
import { loadCognitoOidcToken, newCubeSigner } from "./setup";
import { assertPreconditionFailed, deleteKeys } from "./helpers";
import * as avaTx from "./fixtures/ava_tx";
import * as dotenv from "dotenv";
import TYPED_DATA_JSON from "../../../assets/typed_data_example.json";

dotenv.config();

describe("Sign", () => {
  let createdKeys: Key[];
  let org: Org;
  let role: Role;
  let session: SignerSession;
  let totpSecret: string;
  let userMfaSession: SignerSession;

  beforeAll(async () => {
    createdKeys = [];
    org = new Org(await newCubeSigner());
    const aboutMe = await org.aboutMe();
    expect(aboutMe.org_ids.length).to.eq(1);

    console.log("Creating a role");
    role = await org.createRole();
    console.log("Creating a token");
    session = await role.createSession(new MemorySessionStorage(), "ts-sign-test");

    console.log("Creating a user signer session");
    const oidcToken = await loadCognitoOidcToken();
    const sessionMgr = await org.oidcAuth(oidcToken, ["manage:mfa"]);
    userMfaSession = new SignerSession(sessionMgr);

    const resp = await org.userTotpResetInit();
    if (resp.requiresMfa()) {
      // TOTP is already set -> require CS_USER_TOTP_SECRET to be in the environment
      console.log("Resetting TOTP requires MFA -> using existing TOTP secret from env");
      const totpSecretFromEnv = process.env["CS_USER_TOTP_SECRET"];
      assert(
        totpSecretFromEnv,
        "The CubeSigner user must have TOTP configured and 'CS_USER_TOTP_SECRET' env var must be set to that TOTP secret",
      );
      totpSecret = totpSecretFromEnv!;
      console.log("Approving MFA with TOTP to test the TOTP secret from the environment");
      await resp.approveTotp(userMfaSession, authenticator.generate(totpSecret));
    } else {
      // TOTP is not set -> set it now
      console.log("Resetting TOTP does not require MFA -> setting new TOTP now");
      const totpChallenge = resp.data();
      totpSecret = new URL(totpChallenge.totpUrl).searchParams.get("secret")!;
      await totpChallenge.answer(authenticator.generate(totpSecret));
      await org.verifyTotp(authenticator.generate(totpSecret));
    }
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
    console.log(`Deleting ${role.id}`);
    await role.delete();
  });

  it("addFido", async () => {
    const cs = await newCubeSigner();
    let resp = await cs.addFidoStart("Test Fido Key");
    assert(resp.requiresMfa(), "Expected MFA to be required before adding FIDO key");
    const code = authenticator.generate(totpSecret);
    resp = await resp.approveTotp(userMfaSession, code);
    assert(!resp.requiresMfa(), "Didn't expect more MFA after approving with TOTP");
    const challenge = resp.data();
    console.log(JSON.stringify(challenge.options, undefined, 2));
    expect(challenge.options.user).to.exist;
    expect(challenge.options.user.id).to.exist;
    expect(challenge.options.user.id.length).to.be.greaterThan(0);
    expect(challenge.options.user.id.length).to.be.lessThanOrEqual(64);
    expect(challenge.options.challenge).to.exist;
    expect(challenge.options.challenge.length).to.eq(32);
    expect(challenge.options.pubKeyCredParams).to.exist;
    expect(challenge.options.pubKeyCredParams.length).to.be.greaterThan(0);

    // *** works only in a browser ***
    // await challenge.createCredentialAndAnswer();
  });

  it("resetTotp", async () => {
    const resp = await org.resetTotpStart();
    assert(resp.requiresMfa(), "Expected MFA to be required before resetting TOTP");
    const code = authenticator.generate(totpSecret);
    const resp2 = await resp.approveTotp(userMfaSession, code);
    assert(!resp2.requiresMfa(), "Didn't expect more MFA after approving with TOTP");

    // *** don't want to actually reset TOTP because the tests in CI use a persistent user ***
    //
    // const totpChallenge = resp2.data();
    // const newSecret = new URL(totpChallenge.totp_url).searchParams.get("secret")!;
    // await cs.resetTotpComplete(totpChallenge.totp_id, authenticator.generate(newSecret));
  });

  it("evm", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a secp key");
    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);

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
      const sig = await resp.approve(org);
      console.log(`Signed EVM after MFA approved using CubeSigner: ${JSON.stringify(sig.data())}`);
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await session.signEvm(secp, req);
      assert(resp.requiresMfa());
      const mfa = await org.mfaApprove(resp.mfaId());
      assert(mfa.receipt);
      const sig = await session.signEvm(secp, req, {
        mfaId: mfa.id,
        mfaOrgId: org.id,
        mfaConf: mfa.receipt.confirmation,
      });
      assert(!sig.requiresMfa());
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await session.signEvm(secp, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userMfaSession, code);
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("eip191", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a secp key");
    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);

    const message = "Hello, world!";

    console.log("Adding key to role");
    await role.addKey(secp);

    console.log("Signing an EIP-191 message");
    const req = <Eip191SignRequest>{
      data: encodeToHex(message),
    };
    await assertPreconditionFailed(session.signEip191(secp, req));

    {
      await role.addKey(secp, [AllowEip191Signing]);
      const sig = await session.signEip191(secp, req);
      console.log(`Signed EIP-191 message: ${JSON.stringify(sig.data())}`);
    }

    console.log("Requiring MFA");
    await role.addKey(secp, [AllowEip191Signing, { RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await session.signEip191(secp, req);
      const sig = await resp.approve(org);
      console.log(
        `Signed EIP-191 message after MFA approved using CubeSigner: ${JSON.stringify(sig.data())}`,
      );
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await session.signEip191(secp, req);
      assert(resp.requiresMfa());
      const mfa = await org.mfaApprove(resp.mfaId());
      assert(mfa.receipt);
      const sig = await session.signEip191(secp, req, {
        mfaId: mfa.id,
        mfaOrgId: org.id,
        mfaConf: mfa.receipt.confirmation,
      });
      assert(!sig.requiresMfa());
      console.log(
        `Signed EIP-191 message after MFA approved using TOTP: ${JSON.stringify(sig.data())}`,
      );
    }

    // request then approve using TOTP code
    {
      const resp = await session.signEip191(secp, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userMfaSession, code);
      console.log(
        `Signed EIP-191 message after MFA approved using TOTP: ${JSON.stringify(sig.data())}`,
      );
    }
  });

  it("eip712", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a secp key");
    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);

    console.log("Adding key to role");
    await role.addKey(secp);

    console.log("Signing EIP-712 data");
    const req = <Eip712SignRequest>{
      chain_id: 1,
      typed_data: <any>{
        message: TYPED_DATA_JSON.data,
        ...TYPED_DATA_JSON,
      },
    };
    await assertPreconditionFailed(session.signEip712(secp, req));

    {
      await role.addKey(secp, [AllowEip712Signing]);
      const sig = await session.signEip712(secp, req);
      console.log(`Signed EIP-712 data: ${JSON.stringify(sig.data())}`);
    }

    console.log("Requiring MFA");
    await role.addKey(secp, [AllowEip712Signing, { RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await session.signEip712(secp, req);
      const sig = await resp.approve(org);
      console.log(
        `Signed EIP-712 data after MFA approved using CubeSigner: ${JSON.stringify(sig.data())}`,
      );
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await session.signEip712(secp, req);
      assert(resp.requiresMfa());
      const mfa = await org.mfaApprove(resp.mfaId());
      assert(mfa.receipt);
      const sig = await session.signEip712(secp, req, {
        mfaId: mfa.id,
        mfaOrgId: org.id,
        mfaConf: mfa.receipt.confirmation,
      });
      assert(!sig.requiresMfa());
      console.log(
        `Signed EIP-712 data after MFA approved using TOTP: ${JSON.stringify(sig.data())}`,
      );
    }

    // request then approve using TOTP code
    {
      const resp = await session.signEip712(secp, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userMfaSession, code);
      console.log(
        `Signed EIP-712 data after MFA approved using TOTP: ${JSON.stringify(sig.data())}`,
      );
    }
  });

  it("ava", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating an Ava secp key");

    // require MFA for the mainnet key
    const avaKey = await org.createKey(Secp256k1.Ava);
    createdKeys.push(avaKey);
    await role.addKey(avaKey, [{ RequireMfa: {} }]);

    // don't require MFA for the test key
    const avaTestKey = await org.createKey(Secp256k1.AvaTest);
    createdKeys.push(avaTestKey);
    await role.addKey(avaTestKey, /* empty policy */ []);

    let idx = 0;
    for (const tx of avaTx.all) {
      const sig = await session.signAva(avaTestKey, tx);
      console.log("Signed ava with test key", tx, sig.data());

      // no need to test MFA for each of the ava transactions (if it works for one it most likely works for all)
      if (idx++ === 0) {
        // add key with RequireMfa policy
        const resp = await session.signAva(avaKey, tx);
        const code = authenticator.generate(totpSecret);
        const sig = await resp.approveTotp(userMfaSession, code);
        console.log("Signed Ava with main key after MFA", tx, sig.data());
      }
    }
  }, /* timeoutMs */ 120000);

  it("btc", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a Btc secp key");
    const secp = await org.createKey(Secp256k1.Btc);
    createdKeys.push(secp);

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
      const sig = await resp.approve(org);
      console.log(`Signed btc after MFA: ${JSON.stringify(sig.data())}`);
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await session.signBtc(secp, req);
      assert(resp.requiresMfa());
      const mfa = await org.mfaApprove(resp.mfaId());
      assert(mfa.receipt);
      const sig = await session.signBtc(secp, req, {
        mfaId: mfa.id,
        mfaOrgId: org.id,
        mfaConf: mfa.receipt.confirmation,
      });
      assert(!sig.requiresMfa());
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await session.signBtc(secp, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userMfaSession, code);
      console.log(`Signed btc after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("eth2", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a BLS key");
    const bls = await org.createKey(Bls.Eth2Inactive);
    createdKeys.push(bls);

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
      const sig = await resp.approve(org);
      console.log(`Signed eth2 after MFA: ${sig.data().signature}`);
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await session.signEth2(bls, req);
      assert(resp.requiresMfa());
      const mfa = await org.mfaApprove(resp.mfaId());
      assert(mfa.receipt);
      const sig = await session.signEth2(bls, req, {
        mfaId: mfa.id,
        mfaOrgId: org.id,
        mfaConf: mfa.receipt.confirmation,
      });
      assert(!sig.requiresMfa());
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await session.signEth2(bls, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userMfaSession, code);
      console.log(`Signed eth2 after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("stake/unstake", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a BLS key");
    const bls = await org.createKey(Bls.Eth2Inactive);
    createdKeys.push(bls);

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
      const sig = await resp.approve(org);
      console.log("Unstake after MFA: " + JSON.stringify(sig.data()));
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await session.unstake(bls, req);
      assert(resp.requiresMfa());
      const mfa = await org.mfaApprove(resp.mfaId());
      assert(mfa.receipt);
      const sig = await session.unstake(bls, req, {
        mfaId: mfa.id,
        mfaOrgId: org.id,
        mfaConf: mfa.receipt.confirmation,
      });
      assert(!sig.requiresMfa());
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await session.unstake(bls, req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.approveTotp(userMfaSession, code);
      console.log(`Unstake after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("blob", async () => {
    expect(await role.enabled()).to.equal(true);
    await Promise.all(
      [
        Ed25519.Aptos,
        Ed25519.Cardano,
        Ed25519.Stellar,
        Secp256k1.Ava,
        Secp256k1.AvaTest,
        Stark,
      ].map(async (keyType) => {
        console.log(`Creating a ${keyType} key`);
        const key = await org.createKey(keyType as KeyType);
        createdKeys.push(key);
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
          const sig = await resp.approve(org);
          console.log(`Signed blob after MFA: ${JSON.stringify(sig.data())}`);
        }

        // request then approve using TOTP code
        {
          const resp = await session.signBlob(key, req);
          const code = authenticator.generate(totpSecret);
          const sig = await resp.approveTotp(userMfaSession, code);
          console.log(`Signed blob after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
        }
      }),
    );
  }, /* timeoutMs */ 120000);

  it("mfa", async () => {
    expect(await role.enabled()).to.equal(true);
    for (const keyType of [Ed25519.Aptos, Ed25519.Cardano]) {
      console.log(`Creating a ${keyType} key`);
      const edKey = await org.createKey(keyType as KeyType);
      createdKeys.push(edKey);

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
      const mfa = await org.mfaApprove(resp.mfaId());
      assert(mfa.receipt);
      resp = await session.signBlob(edKey, req, {
        mfaId: mfa.id,
        mfaOrgId: org.id,
        mfaConf: mfa.receipt?.confirmation,
      });

      assert(!resp.requiresMfa());
      const sig = resp.data().signature;
      should().exist(sig);
      console.log(`Signed blob: ${sig}`);
    }
  });
});
