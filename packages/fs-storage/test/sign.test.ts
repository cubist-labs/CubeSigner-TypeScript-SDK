/* eslint-disable @typescript-eslint/no-explicit-any */

import { assert, expect, should } from "chai";
import { authenticator } from "otplib";
import type {
  BtcSignatureKind,
  CsErrCode,
  Eip191SignRequest,
  Eip712SignRequest,
  Eth2SignRequest,
  Eth2UnstakeRequest,
  KeyType,
  Org,
  Role,
} from "@cubist-labs/cubesigner-sdk";
import { Key } from "@cubist-labs/cubesigner-sdk";
import {
  AllowEip191Signing,
  AllowEip712Signing,
  Bls,
  CubeSignerClient,
  Ed25519,
  Secp256k1,
  Stark,
  encodeToHex,
} from "@cubist-labs/cubesigner-sdk";
import { loadCognitoOidcToken, newCubeSigner } from "./setup";
import { assert4xx, assertForbidden, assertPreconditionFailed, delay, deleteKeys } from "./helpers";
import * as avaTx from "./fixtures/ava_tx";
import * as dotenv from "dotenv";
import TYPED_DATA_JSON from "../../../assets/typed_data_example.json";

dotenv.config();

describe("Sign", () => {
  let createdKeys: Key[];
  let client: CubeSignerClient;
  let org: Org;
  let role: Role;
  let roleClient: CubeSignerClient;
  let totpSecret: string;
  let userMfaSession: CubeSignerClient;

  beforeAll(async () => {
    createdKeys = [];
    client = await newCubeSigner();
    org = client.org();
    const aboutMe = await client.user();
    expect(aboutMe.org_ids.length).to.eq(1);

    // ensure historical data is kept for 5 minutes
    await org.update({ historical_data_configuration: { tx: { lifetime: 300 } } });

    console.log("Creating a role");
    role = await org.createRole();
    console.log("Creating a token");
    const roleSessionData = await role.createSession("ts-sign-test");
    roleClient = await CubeSignerClient.create(roleSessionData);

    console.log("Creating a user signer session");
    const oidcToken = await loadCognitoOidcToken();
    const oidcResp = await CubeSignerClient.createOidcSession(client.env, client.orgId, oidcToken, [
      "manage:mfa:*",
    ]);
    userMfaSession = await CubeSignerClient.create(oidcResp.data());

    const resp = await client.resetTotp();
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
      await resp.totpApprove(userMfaSession, authenticator.generate(totpSecret));
    } else {
      // TOTP is not set -> set it now
      console.log("Resetting TOTP does not require MFA -> setting new TOTP now");
      const totpChallenge = resp.data();
      totpSecret = new URL(totpChallenge.url!).searchParams.get("secret")!;
      await totpChallenge.answer(authenticator.generate(totpSecret));
      await client.verifyTotp(authenticator.generate(totpSecret));
    }
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
    console.log(`Deleting ${role.id}`);
    await role.delete();

    // Disable saving historical transactions to prevent breaking other tests
    await org.update({ historical_data_configuration: { tx: { lifetime: null } } });
  });

  it("addFido", async () => {
    const cs = await newCubeSigner();
    let resp = await cs.addFido("Test Fido Key");
    assert(resp.requiresMfa(), "Expected MFA to be required before adding FIDO key");
    const code = authenticator.generate(totpSecret);
    resp = await resp.totpApprove(userMfaSession, code);
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
    const resp = await client.resetTotp();
    assert(resp.requiresMfa(), "Expected MFA to be required before resetting TOTP");
    const code = authenticator.generate(totpSecret);
    const resp2 = await resp.totpApprove(userMfaSession, code);
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
    const signingKey = new Key(roleClient, secp.cached);

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
      metadata: {},
    };

    {
      const sig = await signingKey.signEvm(req);
      const resp = sig.data();
      console.log(`Signed EVM: ${JSON.stringify(resp)}`);
      let hist = await secp.history({ size: 1, all: false });
      if (hist.length === 0) {
        await delay(1000);
        hist = await secp.history({ size: 1, all: false });
      }
      expect(hist.length).to.eq(1);
      expect(hist[0].result).to.deep.eq(resp);
      expect(hist[0].request.body).to.deep.eq(req);
      expect(hist[0].operation).to.eq("Eth1Sign");
      expect(hist[0].role_id).to.eq(role.id);
      expect(hist[0].user_id).to.not.exist;
      expect(hist[0].mfa_status).to.not.exist;
    }

    console.log("Requiring MFA");
    await role.addKey(secp, [{ RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await signingKey.signEvm(req);
      const sig = await resp.approve(client);
      console.log(`Signed EVM after MFA approved using CubeSigner: ${JSON.stringify(sig.data())}`);
    }

    // request then reject using CubeSigner management session
    {
      const resp = await signingKey.signEvm(req);
      const mfaId = resp.mfaId();
      expect(mfaId).to.exist;
      await resp.reject(client);
      const err = await assert4xx(roleClient.org().getMfaRequest(mfaId).fetch());
      expect(err.errorCode).to.eq(<CsErrCode>"MfaRequestNotFound");
      console.log(`Rejected ${mfaId} using CubeSigner`);
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await signingKey.signEvm(req);
      assert(resp.requiresMfa());
      const mfa = await org.getMfaRequest(resp.mfaId()).approve();
      const receipt = await mfa.receipt();
      const sig = await signingKey.signEvm(req, receipt);
      assert(!sig.requiresMfa());
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await signingKey.signEvm(req);
      const code = authenticator.generate(totpSecret);

      let mfaFailed = 0;
      const handler = () => {
        mfaFailed++;
      };
      userMfaSession.addEventListener("user-mfa-failed", handler);
      const err = await assertForbidden(resp.totpApprove(userMfaSession, "AAAAAA"));
      expect(err.errorCode).to.eq(<CsErrCode>"MfaTotpBadCode");
      expect(mfaFailed).to.eq(1);
      userMfaSession.removeEventListener("user-mfa-failed", handler);

      const sig = await resp.totpApprove(userMfaSession, code);
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then reject using TOTP code
    {
      const resp = await signingKey.signEvm(req);
      const code = authenticator.generate(totpSecret);
      const mfaId = resp.mfaId();
      expect(mfaId).to.exist;
      await resp.totpReject(userMfaSession, code);
      const err = await assert4xx(roleClient.org().getMfaRequest(mfaId).fetch());
      expect(err.errorCode).to.eq(<CsErrCode>"MfaRequestNotFound");
      console.log(`Rejected ${mfaId} using CubeSigner`);
    }
  });

  it("eip191", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a secp key");
    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);
    const signingKey = new Key(roleClient, secp.cached);

    const message = "Hello, world!";

    console.log("Adding key to role");
    await role.addKey(secp);

    console.log("Signing an EIP-191 message");
    const req = <Eip191SignRequest>{
      data: encodeToHex(message),
      metadata: `EIP-191 message: ${message}`,
    };
    const err = await assertPreconditionFailed(signingKey.signEip191(req));
    expect(err.errorCode).to.eq(<CsErrCode>"Eip191SigningNotAllowed");

    {
      await role.addKey(secp, [AllowEip191Signing]);
      const sig = await signingKey.signEip191(req);
      console.log(`Signed EIP-191 message: ${JSON.stringify(sig.data())}`);
    }

    console.log("Requiring MFA");
    await role.addKey(secp, [AllowEip191Signing, { RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await signingKey.signEip191(req);
      const sig = await resp.approve(client);
      console.log(
        `Signed EIP-191 message after MFA approved using CubeSigner: ${JSON.stringify(sig.data())}`,
      );
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await signingKey.signEip191(req);
      assert(resp.requiresMfa());
      const mfa = await org.getMfaRequest(resp.mfaId()).approve();
      const receipt = await mfa.receipt();
      const sig = await signingKey.signEip191(req, receipt);
      assert(!sig.requiresMfa());
      console.log(
        `Signed EIP-191 message after MFA approved using TOTP: ${JSON.stringify(sig.data())}`,
      );
    }

    // request then approve using TOTP code
    {
      const resp = await signingKey.signEip191(req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.totpApprove(userMfaSession, code);
      console.log(
        `Signed EIP-191 message after MFA approved using TOTP: ${JSON.stringify(sig.data())}`,
      );
    }

    // request then reject using TOTP code
    {
      const resp = await signingKey.signEip191(req);
      const code = authenticator.generate(totpSecret);
      const mfaId = resp.mfaId();
      await resp.totpReject(userMfaSession, code);
      const err = await assert4xx(roleClient.org().getMfaRequest(mfaId).fetch());
      expect(err.errorCode).to.eq(<CsErrCode>"MfaRequestNotFound");
      console.log(`Rejected ${mfaId} using CubeSigner`);
    }
  });

  it("eip712", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a secp key");
    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);
    const signingKey = new Key(roleClient, secp.cached);

    console.log("Adding key to role");
    await role.addKey(secp);

    console.log("Signing EIP-712 data");
    const req = <Eip712SignRequest>{
      chain_id: 1,
      typed_data: <any>{
        message: TYPED_DATA_JSON.data,
        ...TYPED_DATA_JSON,
      },
      metadata: TYPED_DATA_JSON.data,
    };
    const err = await assertPreconditionFailed(signingKey.signEip712(req));
    expect(err.errorCode).to.eq(<CsErrCode>"Eip712SigningNotAllowed");

    {
      await role.addKey(secp, [AllowEip712Signing]);
      const sig = await signingKey.signEip712(req);
      console.log(`Signed EIP-712 data: ${JSON.stringify(sig.data())}`);
    }

    console.log("Requiring MFA");
    await role.addKey(secp, [AllowEip712Signing, { RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await signingKey.signEip712(req);
      const sig = await resp.approve(client);
      console.log(
        `Signed EIP-712 data after MFA approved using CubeSigner: ${JSON.stringify(sig.data())}`,
      );
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await signingKey.signEip712(req);
      assert(resp.requiresMfa());
      const mfa = await org.getMfaRequest(resp.mfaId()).approve();
      const receipt = await mfa.receipt();
      const sig = await signingKey.signEip712(req, receipt);
      assert(!sig.requiresMfa());
      console.log(
        `Signed EIP-712 data after MFA approved using TOTP: ${JSON.stringify(sig.data())}`,
      );
    }

    // request then approve using TOTP code
    {
      const resp = await signingKey.signEip712(req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.totpApprove(userMfaSession, code);
      console.log(
        `Signed EIP-712 data after MFA approved using TOTP: ${JSON.stringify(sig.data())}`,
      );
    }

    // request then reject using TOTP code
    {
      const resp = await signingKey.signEip712(req);
      const code = authenticator.generate(totpSecret);
      const mfaId = resp.mfaId();
      await resp.totpReject(userMfaSession, code);
      const err = await assert4xx(roleClient.org().getMfaRequest(mfaId).fetch());
      expect(err.errorCode).to.eq(<CsErrCode>"MfaRequestNotFound");
      console.log(`Rejected ${mfaId} using CubeSigner`);
    }
  });

  it("ava", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating an Ava secp key");

    // require MFA for the mainnet key
    const avaKey = await org.createKey(Secp256k1.Ava);
    createdKeys.push(avaKey);
    await role.addKey(avaKey, [{ RequireMfa: {} }]);
    const signingKey = new Key(roleClient, avaKey.cached);

    // don't require MFA for the test key
    const avaTestKey = await org.createKey(Secp256k1.AvaTest);
    createdKeys.push(avaTestKey);
    await role.addKey(avaTestKey, /* empty policy */ []);
    const signingTestKey = new Key(roleClient, avaTestKey.cached);

    let idx = 0;
    for (const tx of avaTx.all) {
      const sig = await signingTestKey.signAva(tx);
      console.log("Signed ava with test key", tx, sig.data());

      // no need to test MFA for each of the ava transactions (if it works for one it most likely works for all)
      if (idx++ === 0) {
        // add key with RequireMfa policy
        const resp = await signingKey.signAva(tx);
        const code = authenticator.generate(totpSecret);
        const sig = await resp.totpApprove(userMfaSession, code);
        console.log("Signed Ava with main key after MFA", tx, sig.data());
      }
    }
  }, /* timeoutMs */ 120000);

  it("btc", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a Btc secp key");
    const secp = await org.createKey(Secp256k1.Btc);
    createdKeys.push(secp);
    const signingKey = new Key(roleClient, secp.cached);

    console.log("Adding key to role");
    await role.addKey(secp);

    console.log("Signing a BTC tx");
    const req = {
      metadata: "btc tx",
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
      const sig = await signingKey.signBtc(req);
      console.log(`Signed btc: ${JSON.stringify(sig.data())}`);
    }

    console.log("Requiring MFA");
    await role.addKey(secp, [{ RequireMfa: {} }]);

    // request then approve using CubeSigner management sessions
    {
      const resp = await signingKey.signBtc(req);
      const sig = await resp.approve(client);
      console.log(`Signed btc after MFA: ${JSON.stringify(sig.data())}`);
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await signingKey.signBtc(req);
      assert(resp.requiresMfa());
      const mfa = await org.getMfaRequest(resp.mfaId()).approve();
      const receipt = await mfa.receipt();
      const sig = await signingKey.signBtc(req, receipt);
      assert(!sig.requiresMfa());
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await signingKey.signBtc(req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.totpApprove(userMfaSession, code);
      console.log(`Signed btc after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then reject using TOTP code
    {
      const resp = await signingKey.signBtc(req);
      const code = authenticator.generate(totpSecret);
      const mfaId = resp.mfaId();
      await resp.totpReject(userMfaSession, code);
      const err = await assert4xx(org.getMfaRequest(mfaId).fetch());
      expect(err.errorCode).to.eq(<CsErrCode>"MfaRequestNotFound");
      console.log(`Rejected ${mfaId} using CubeSigner`);
    }
  });

  it("eth2", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a BLS key");
    const bls = await org.createKey(Bls.Eth2Inactive);
    createdKeys.push(bls);
    const signingKey = new Key(roleClient, bls.cached);

    console.log("Adding key to role");
    await role.addKey(bls);

    // Turn the key from inactive into a regular BLS key
    await roleClient.org().stake({
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
      const sig = await signingKey.signEth2(req);
      console.log(`Signed eth2: ${sig.data().signature}`);
    }

    console.log("Requiring MFA");
    await role.addKey(bls, [{ RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await signingKey.signEth2(req);
      const sig = await resp.approve(client);
      console.log(`Signed eth2 after MFA: ${sig.data().signature}`);
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await signingKey.signEth2(req);
      assert(resp.requiresMfa());
      const mfa = await org.getMfaRequest(resp.mfaId()).approve();
      const receipt = await mfa.receipt();
      const sig = await signingKey.signEth2(req, receipt);
      assert(!sig.requiresMfa());
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await signingKey.signEth2(req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.totpApprove(userMfaSession, code);
      console.log(`Signed eth2 after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }
  });

  it("stake/unstake", async () => {
    expect(await role.enabled()).to.equal(true);
    console.log("Creating a BLS key");
    const bls = await org.createKey(Bls.Eth2Inactive);
    createdKeys.push(bls);
    const signingKey = new Key(roleClient, bls.cached);

    console.log("Adding key to role");
    await role.addKey(bls);

    console.log("Staking");
    const sig = await roleClient.org().stake({
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
      network: "mainnet",
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
      const sig = await signingKey.unstake(req);
      console.log("Unstake: " + JSON.stringify(sig.data()));
    }

    console.log("Requiring MFA");
    await role.addKey(bls, [{ RequireMfa: {} }]);

    // request then approve using CubeSigner management session
    {
      const resp = await signingKey.unstake(req);
      const sig = await resp.approve(client);
      console.log("Unstake after MFA: " + JSON.stringify(sig.data()));
    }

    // do the same but disconnected from the original CubeSignerResponse object
    {
      const resp = await signingKey.unstake(req);
      assert(resp.requiresMfa());
      const mfa = await org.getMfaRequest(resp.mfaId()).approve();
      const receipt = await mfa.receipt();
      const sig = await signingKey.unstake(req, receipt);
      assert(!sig.requiresMfa());
      console.log(`Signed EVM after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then approve using TOTP code
    {
      const resp = await signingKey.unstake(req);
      const code = authenticator.generate(totpSecret);
      const sig = await resp.totpApprove(userMfaSession, code);
      console.log(`Unstake after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
    }

    // request then reject using TOTP code
    {
      const resp = await signingKey.unstake(req);
      const code = authenticator.generate(totpSecret);
      const mfaId = resp.mfaId();
      await resp.totpReject(userMfaSession, code);
      const err = await assert4xx(roleClient.org().getMfaRequest(mfaId).fetch());
      expect(err.errorCode).to.eq(<CsErrCode>"MfaRequestNotFound");
      console.log(`Rejected ${mfaId} using CubeSigner`);
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
        const signingKey = new Key(roleClient, key.cached);

        console.log("Adding key to role");
        await role.addKey(key);

        console.log("Signing a blob");
        const req = {
          message_base64: "L1kE9g59xD3fzYQQSR7340BwU9fGrP6EMfIFcyX/YBc=",
          metadata: {},
        };
        const err = await assertPreconditionFailed(signingKey.signBlob(req));
        expect(err.errorCode).to.eq(<CsErrCode>"RawSigningNotAllowed");

        {
          await role.addKey(key, ["AllowRawBlobSigning"]);
          const sig = await signingKey.signBlob(req);
          console.log(`Signed blob: ${JSON.stringify(sig.data())}`);
        }

        console.log("Requiring MFA");
        await role.addKey(key, ["AllowRawBlobSigning", { RequireMfa: {} }]);

        // request then approve using CubeSigner management session
        {
          const resp = await signingKey.signBlob(req);
          const sig = await resp.approve(client);
          console.log(`Signed blob after MFA: ${JSON.stringify(sig.data())}`);
        }

        // request then approve using TOTP code
        {
          const resp = await signingKey.signBlob(req);
          const code = authenticator.generate(totpSecret);
          const sig = await resp.totpApprove(userMfaSession, code);
          console.log(`Signed blob after MFA approved using TOTP: ${JSON.stringify(sig.data())}`);
        }

        // request then reject using TOTP code
        {
          const resp = await signingKey.signBlob(req);
          const code = authenticator.generate(totpSecret);
          const mfaId = resp.mfaId();
          await resp.totpReject(userMfaSession, code);
          const err = await assert4xx(roleClient.org().getMfaRequest(mfaId).fetch());
          expect(err.errorCode).to.eq(<CsErrCode>"MfaRequestNotFound");
          console.log(`Rejected ${mfaId} using CubeSigner`);
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
      const signingKey = new Key(roleClient, edKey.cached);

      console.log("Adding key to role");
      await role.addKey(edKey, [
        "AllowRawBlobSigning",
        {
          RequireMfa: {
            restricted_operations: ["BlobSign"],
          },
        },
      ]);

      console.log("Signing a blob");
      const req = { message_base64: "L1kE9g59xD3fzYQQSR7340BwU9fGrP6EMfIFcyX/YBc=" };
      let resp = await signingKey.signBlob(req);

      // assert the response is 202
      expect(resp.requiresMfa()).to.equal(true);

      // sign again with approval
      console.log("Signing again with approval");
      const mfa = await org.getMfaRequest(resp.mfaId()).approve();
      const receipt = await mfa.receipt();
      resp = await signingKey.signBlob(req, receipt);

      assert(!resp.requiresMfa());
      const sig = resp.data().signature;
      should().exist(sig);
      console.log(`Signed blob: ${sig}`);
    }
  });
});
