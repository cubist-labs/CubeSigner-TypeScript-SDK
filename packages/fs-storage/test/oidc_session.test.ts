import { expect } from "@jest/globals";

import {
  ApiClient,
  type EnvInterface,
  type EvmSignRequest,
  type Key,
  type OidcIdentity,
  type Org,
  type UserInOrgInfo,
  type UserInfo,
} from "@cubist-labs/cubesigner-sdk";
import {
  CubeSignerClient,
  ErrResponse,
  MemorySessionManager,
  Secp256k1,
} from "@cubist-labs/cubesigner-sdk";
import { loadCognitoOidcToken, newCubeSigner } from "./setup";
import { deleteKeys, parseOidcToken } from "./helpers";

describe("OidcSessionManager", () => {
  let createdKeys: Key[];
  let env: EnvInterface;
  let apiClient: ApiClient;
  let org: Org;
  let me: UserInfo;
  let orgId: string;

  beforeAll(async () => {
    createdKeys = [];
    const client = await newCubeSigner();
    apiClient = client.apiClient;
    env = client.env;
    org = client.org();
    me = await client.user();
    orgId = client.orgId;
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  it("prove authentication using CubeSigner management session", async () => {
    console.log("Obtaining proof");
    const proof = await org.proveIdentity();
    expect(proof.user_info?.user_id).toEqual(me.user_id);
    expect(JSON.stringify(proof.user_info?.configured_mfa)).toEqual(JSON.stringify(me.mfa));
    expect(proof.user_info?.initialized).toEqual(true);
    console.log("Verifying proof");
    await org.verifyIdentity(proof);
  });

  it("prove authentication using CubeSigner signer session", async () => {
    console.log("Exchanging token");
    const oidcToken = await loadCognitoOidcToken();
    const sessionData = await CubeSignerClient.createOidcSession(env, orgId, oidcToken, ["sign:*"]);
    const client = await CubeSignerClient.create(sessionData.data());

    console.log("Obtaining proof using SignerSession");
    const proof = await client.org().proveIdentity();
    expect(proof.user_info?.user_id).toEqual(me.user_id);
    expect(JSON.stringify(proof.user_info?.configured_mfa)).toEqual(JSON.stringify(me.mfa));
    expect(proof.user_info?.initialized).toEqual(true);
    console.log("Verifying proof");
    await org.verifyIdentity(proof);
  });

  it("prove authentication using OIDC token", async () => {
    console.log("Exchanging token");
    const oidcToken = await loadCognitoOidcToken();
    const oidcPayload = parseOidcToken(oidcToken);
    console.log("Obtaining proof");
    const proof = await CubeSignerClient.proveOidcIdentity(env, orgId, oidcToken);
    console.log("Verifying proof");
    await org.verifyIdentity(proof);
    expect(proof.email).toEqual(oidcPayload.email);
    expect(proof.aud).toEqual(oidcPayload.aud);
    expect(proof.identity?.iss).toEqual(oidcPayload.iss);
    expect(proof.identity?.sub).toEqual(oidcPayload.sub);

    console.log("Verifying bogus proof is rejected");
    try {
      await org.verifyIdentity({
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

  it("add/list/remove OIDC identity", async () => {
    const oidcToken = await loadCognitoOidcToken();
    const oidcPayload = parseOidcToken(oidcToken);
    const oidcIdentity = <OidcIdentity>{
      iss: oidcPayload.iss,
      sub: oidcPayload.sub,
    };
    await apiClient.identityAdd({ oidc_token: oidcToken });
    try {
      let resp = await apiClient.identityList();
      console.log(resp.identities);
      console.log(oidcIdentity);
      expect(resp.identities).toHaveLength(1);
      expect(resp.identities[0]).toMatchObject(oidcIdentity);
      await apiClient.identityRemove(oidcIdentity);
      resp = await apiClient.identityList();
      console.log(resp);
      expect(resp.identities).toHaveLength(0);
    } catch (e) {
      // clean up persistent state and remove the 'oidcIdentity' if at all possible
      await apiClient.identityRemove(oidcIdentity).catch((removeErr) => {
        console.log("Caught error while cleaning up", removeErr);
      });
      throw e;
    }
  });

  it("list orgs", async () => {
    const oidcToken = await loadCognitoOidcToken();
    const orgs = (await ApiClient.userOrgs(env, oidcToken)).orgs;
    expect(orgs.length).toBeGreaterThan(0);
    expect(orgs.map((o) => o.org_id)).toContain(orgId);
  });

  it("create and delete third party user", async () => {
    const oidcToken = await loadCognitoOidcToken();

    // prove identity first
    const proof = await CubeSignerClient.proveOidcIdentity(env, orgId, oidcToken);
    expect(proof.identity).toEqual(expect.anything());

    // create new third-party user for that identity
    const email = "email-is-not-verified@example.com";
    const newUserId = await org.createOidcUser(proof.identity!, email);
    console.log(`Created new third-party user: ${newUserId} <${email}>`);

    const isNewUser = (u: UserInOrgInfo) => u.email === email && u.id === newUserId;

    try {
      // ensure the new user is listed
      const orgUsers = await org.users();
      expect(orgUsers.find(isNewUser)).toEqual(expect.anything());

      // log in as the new user via OIDC
      const sessionData = await CubeSignerClient.createOidcSession(env, orgId, oidcToken, [
        "manage:*",
      ]);
      const client = await CubeSignerClient.create(sessionData.data());
      const aboutMe = await client.user();
      expect(aboutMe.user_id).toEqual(newUserId);
      expect(aboutMe.email).toEqual(email);
    } finally {
      // delete OIDC user
      console.log("Deleting OIDC user");
      await org.deleteOidcUser(proof.identity!);

      // ensure the new user is not listed
      const orgUsers = await org.users();
      expect(orgUsers.find(isNewUser)).toEqual(undefined);
    }
  });

  it("exchange OIDC token for signer session with scope 'manage:*'", async () => {
    console.log("Exchanging token");
    const oidcToken = await loadCognitoOidcToken();
    const sessionData = (
      await CubeSignerClient.createOidcSession(env, orgId, oidcToken, ["manage:*"])
    ).data();
    const epoch1 = sessionData.session_info.epoch;

    // Check that the expiration time is in the future
    expect(sessionData.session_exp).toBeGreaterThan(Date.now() / 1000);

    console.log("Trying session");
    const mgr = new MemorySessionManager(sessionData);
    const cs2 = await CubeSignerClient.create(mgr);
    expect(cs2.org().id).toEqual(orgId);

    console.log(`Current epoch ${epoch1}; forcing refresh`);
    const newSession = await mgr.forceRefresh();
    const epoch2 = newSession.session_info.epoch;
    console.log(`New epoch ${epoch2}`);
    expect(epoch2).toEqual(epoch1 + 1);

    console.log("Trying session after refresh");
    expect(cs2.org().id).toEqual(orgId);
  });

  it("exchange OIDC token for signer session with all scopes", async () => {
    console.log("Exchanging token");
    const oidcToken = await loadCognitoOidcToken();
    const sessionData = (
      await CubeSignerClient.createOidcSession(env, orgId, oidcToken, ["manage:*", "sign:*"])
    ).data();
    const epoch1 = sessionData?.session_info.epoch;

    console.log("Trying session for management");
    const oidcMgr = new MemorySessionManager(sessionData);
    const client = await CubeSignerClient.create(oidcMgr);
    expect(client.orgId).toEqual(orgId);

    const key = await client.org().createKey(Secp256k1.Evm);
    createdKeys.push(key);
    const signReq: EvmSignRequest = {
      chain_id: 1,
      tx: {
        type: "0x0",
        gas: "0x61a80",
        gasPrice: "0x77359400",
        nonce: "0",
      },
    };

    console.log("Trying session for signing");
    let sig = await key.signEvm(signReq);
    console.log(sig.data());
    expect(sig.data().rlp_signed_tx).not.toEqual(undefined);

    console.log(`Current epoch ${epoch1}; forcing refresh`);
    const newSession = await oidcMgr.forceRefresh();
    const epoch2 = newSession?.session_info.epoch;
    console.log(`Current epoch ${epoch2}`);
    expect(epoch2).toEqual(epoch1 + 1);

    console.log("Trying session for management after refresh");
    await client.user();

    console.log("Trying heartbeat request");
    await client.org().heartbeat();

    console.log("Trying session for signing after refresh");
    sig = await key.signEvm(signReq);
    console.log(sig.data());
    expect(sig.data().rlp_signed_tx).not.toEqual(undefined);
  });
});
