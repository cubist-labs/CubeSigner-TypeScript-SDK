import { default as chai } from "chai";
import { default as chai_as_promised } from "chai-as-promised";

chai.use(chai_as_promised);

import { expect } from "chai";

import { CubeSigner, EvmSignRequest, Key, Org, Secp256k1, SignerSession, UserInfo } from "../src";
import { newCubeSigner } from "./setup";
import { deleteKeys, oidcAuth, oidcProveIdentity, parseOidcToken } from "./helpers";

describe("OidcSessionManager", () => {
  let createdKeys: Key[];
  let cs: CubeSigner;
  let me: UserInfo;
  let org: Org;

  beforeAll(async () => {
    createdKeys = [];
    cs = await newCubeSigner();
    me = await cs.aboutMe();
    const orgId = me.org_ids[0];
    org = await cs.getOrg(orgId);
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  it("prove authentication using CubeSigner management session", async () => {
    console.log("Obtaining proof");
    const proof = await cs.proveIdentity(org.id);
    expect(proof.user_info?.user_id).to.eq(me.user_id);
    expect(JSON.stringify(proof.user_info?.configured_mfa)).to.eq(JSON.stringify(me.mfa));
    expect(proof.user_info?.initialized).to.eq(true);
    console.log("Verifying proof");
    await cs.verifyIdentity(org.id, proof);
  });

  it("prove authentication using CubeSigner signer session", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    const sessionMgr = await oidcAuth(cs, oidcToken, org, ["sign:*"]);
    const ss = new SignerSession(sessionMgr);

    console.log("Obtaining proof using SignerSession");
    const proof = await ss.proveIdentity();
    expect(proof.user_info?.user_id).to.eq(me.user_id);
    expect(JSON.stringify(proof.user_info?.configured_mfa)).to.eq(JSON.stringify(me.mfa));
    expect(proof.user_info?.initialized).to.eq(true);
    console.log("Verifying proof");
    await cs.verifyIdentity(org.id, proof);
  });

  it("prove authentication using OIDC token", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    const oidcPayload = parseOidcToken(oidcToken);
    console.log("Obtaining proof");
    const proof = await oidcProveIdentity(cs, oidcToken, org);
    console.log("Verifying proof");
    await cs.verifyIdentity(org.id, proof);
    expect(proof.email).to.eq(oidcPayload.email);
    expect(proof.aud).to.eq(oidcPayload.aud);
    expect(proof.identity?.iss).to.eq(oidcPayload.iss);
    expect(proof.identity?.sub).to.eq(oidcPayload.sub);

    console.log("Verifying bogus proof is rejected");
    await expect(
      cs.verifyIdentity(org.id, {
        aud: "123",
        identity: {
          sub: "abcd",
          iss: "accounts.google.com",
        },
        user_info: null,
        email: "abcd@gmail.com",
        exp_epoch: 1706359588,
        id: "Proof#b4e804b8-2061-7033-c85a-2422b3af6acc",
      }),
    ).to.be.rejectedWith("Provided evidence is either expired or invalid");
  });

  it("exchange OIDC token for signer session with scope 'manage:*'", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    const sessionMgr = await oidcAuth(cs, oidcToken, org, ["manage:*"]);
    const epoch1 = (await sessionMgr.storage.retrieve()).session_info.epoch;

    // Check that the expiration time is in the future
    expect(await sessionMgr.isStale()).to.equal(false);

    console.log("Trying session");
    const cs2 = new CubeSigner({ sessionMgr });
    expect((await cs2.getOrg(org.id)).id).to.equal(org.id);

    console.log(`Current epoch ${epoch1}; forcing refresh`);
    await sessionMgr.refresh();
    const epoch2 = (await sessionMgr.storage.retrieve()).session_info.epoch;
    console.log(`New epoch ${epoch2}`);
    expect(epoch2).to.eq(epoch1 + 1);

    console.log("Trying session after refresh");
    expect((await cs2.getOrg(org.id)).id).to.equal(org.id);
  });

  it("exchange OIDC token for signer session with all scopes", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    const sessionMgr = await oidcAuth(cs, oidcToken, org, ["manage:*", "sign:*"]);
    const epoch1 = (await sessionMgr.storage.retrieve()).session_info.epoch;

    console.log("Trying session for management");
    const cs2 = new CubeSigner({ sessionMgr });
    let org2 = await cs2.getOrg(org.id);
    expect(org2.id).to.equal(org.id);

    const key = await org2.createKey(Secp256k1.Evm);
    createdKeys.push(key);
    const ss = new SignerSession(sessionMgr);
    const signReq = {
      chain_id: 1,
      tx: {
        type: "0x00",
        gas: "0x61a80",
        gasPrice: "0x77359400",
        nonce: "0",
      } as unknown as Record<string, never>,
    } as unknown as EvmSignRequest;

    console.log("Trying session for signing");
    let sig = await ss.signEvm(key, signReq);
    console.log(sig.data());
    expect(sig.data().rlp_signed_tx).to.not.be.undefined;

    console.log(`Current epoch ${epoch1}; forcing refresh`);
    await sessionMgr.refresh();
    const epoch2 = (await sessionMgr.storage.retrieve()).session_info.epoch;
    console.log(`Current epoch ${epoch2}`);
    expect(epoch2).to.eq(epoch1 + 1);

    console.log("Trying session for management after refresh");
    org2 = await cs2.getOrg(org.id);
    expect(org2.id).to.equal(org.id);

    console.log("Trying session for signing after refresh");
    sig = await ss.signEvm(key, signReq);
    console.log(sig.data());
    expect(sig.data().rlp_signed_tx).to.not.be.undefined;
  });
});
