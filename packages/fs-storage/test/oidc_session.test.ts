import { expect } from "chai";

import {
  CubeSignerClient,
  ErrResponse,
  EvmSignRequest,
  Key,
  Org,
  Secp256k1,
  SignerSession,
  UserInOrgInfo,
  UserInfo,
} from "@cubist-labs/cubesigner-sdk";
import { loadCognitoOidcToken, newCubeSigner } from "./setup";
import { deleteKeys, parseOidcToken } from "./helpers";

describe("OidcSessionManager", () => {
  let createdKeys: Key[];
  let org: Org;
  let me: UserInfo;

  beforeAll(async () => {
    createdKeys = [];
    org = new Org(await newCubeSigner());
    me = await org.aboutMe();
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  it("prove authentication using CubeSigner management session", async () => {
    console.log("Obtaining proof");
    const proof = await org.identityProve();
    expect(proof.user_info?.user_id).to.eq(me.user_id);
    expect(JSON.stringify(proof.user_info?.configured_mfa)).to.eq(JSON.stringify(me.mfa));
    expect(proof.user_info?.initialized).to.eq(true);
    console.log("Verifying proof");
    await org.identityVerify(proof);
  });

  it("prove authentication using CubeSigner signer session", async () => {
    console.log("Exchanging token");
    const oidcToken = await loadCognitoOidcToken();
    const sessionMgr = await org.oidcAuth(oidcToken, ["sign:*"]);
    const ss = new SignerSession(sessionMgr);

    console.log("Obtaining proof using SignerSession");
    const proof = await ss.identityProve();
    expect(proof.user_info?.user_id).to.eq(me.user_id);
    expect(JSON.stringify(proof.user_info?.configured_mfa)).to.eq(JSON.stringify(me.mfa));
    expect(proof.user_info?.initialized).to.eq(true);
    console.log("Verifying proof");
    await org.identityVerify(proof);
  });

  it("prove authentication using OIDC token", async () => {
    console.log("Exchanging token");
    const oidcToken = await loadCognitoOidcToken();
    const oidcPayload = parseOidcToken(oidcToken);
    console.log("Obtaining proof");
    const proof = await org.newOidcClient(oidcToken).identityProve();
    console.log("Verifying proof");
    await org.identityVerify(proof);
    expect(proof.email).to.eq(oidcPayload.email);
    expect(proof.aud).to.eq(oidcPayload.aud);
    expect(proof.identity?.iss).to.eq(oidcPayload.iss);
    expect(proof.identity?.sub).to.eq(oidcPayload.sub);

    console.log("Verifying bogus proof is rejected");
    try {
      await org.identityVerify({
        aud: "123",
        identity: {
          sub: "abcd",
          iss: "accounts.google.com",
        },
        user_info: null,
        email: "abcd@gmail.com",
        exp_epoch: 1706359588,
        id: "Proof#b4e804b8-2061-7033-c85a-2422b3af6acc",
      });
      throw new Error("Expected to throw before this");
    } catch (err) {
      expect(
        err instanceof ErrResponse &&
          err.message === "Provided evidence is either expired or invalid",
      );
    }
  });

  it("create and delete third party user", async () => {
    const oidcToken = await loadCognitoOidcToken();

    // prove identity first
    const proof = await org.newOidcClient(oidcToken).identityProve();
    expect(proof.identity).to.exist;

    // create new third-party user for that identity
    const email = "email-is-not-verified@example.com";
    const newUserId = await org.createOidcUser(proof.identity!, email);
    console.log(`Created new third-party user: ${newUserId} <${email}>`);

    const isNewUser = (u: UserInOrgInfo) => u.email === email && u.id === newUserId;

    try {
      // ensure the new user is listed
      const orgUsers = await org.listUsers();
      expect(orgUsers.find(isNewUser)).to.exist;

      // log in as the new user via OIDC
      const oidcSessionMgr = await org.oidcAuth(oidcToken, ["manage:*"]);
      const cs = new CubeSignerClient(oidcSessionMgr);
      const aboutMe = await cs.aboutMe();
      expect(aboutMe.user_id).to.eq(newUserId);
      expect(aboutMe.email).to.eq(email);
    } finally {
      // delete OIDC user
      console.log("Deleting OIDC user");
      await org.deleteOidcUser(proof.identity!);

      // ensure the new user is not listed
      const orgUsers = await org.listUsers();
      expect(orgUsers.find(isNewUser)).to.be.undefined;
    }
  });

  it("exchange OIDC token for signer session with scope 'manage:*'", async () => {
    console.log("Exchanging token");
    const oidcToken = await loadCognitoOidcToken();
    const sessionMgr = await org.oidcAuth(oidcToken, ["manage:*"]);
    const epoch1 = (await sessionMgr.storage.retrieve()).session_info.epoch;

    // Check that the expiration time is in the future
    expect(await sessionMgr.isStale()).to.equal(false);

    console.log("Trying session");
    const cs2 = new CubeSignerClient(sessionMgr);
    expect((await cs2.org()).org_id).to.equal(org.id);

    console.log(`Current epoch ${epoch1}; forcing refresh`);
    await sessionMgr.refresh();
    const epoch2 = (await sessionMgr.storage.retrieve()).session_info.epoch;
    console.log(`New epoch ${epoch2}`);
    expect(epoch2).to.eq(epoch1 + 1);

    console.log("Trying session after refresh");
    expect((await cs2.org()).org_id).to.equal(org.id);
  });

  it("exchange OIDC token for signer session with all scopes", async () => {
    console.log("Exchanging token");
    const oidcToken = await loadCognitoOidcToken();
    const sessionMgr = await org.oidcAuth(oidcToken, ["manage:*", "sign:*"]);
    const epoch1 = (await sessionMgr.storage.retrieve()).session_info.epoch;

    console.log("Trying session for management");
    const org2 = new Org(sessionMgr);
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
    await org2.aboutMe();

    console.log("Trying heartbeat request");
    await org2.heartbeat();

    console.log("Trying session for signing after refresh");
    sig = await ss.signEvm(key, signReq);
    console.log(sig.data());
    expect(sig.data().rlp_signed_tx).to.not.be.undefined;
  });
});
