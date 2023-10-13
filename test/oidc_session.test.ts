import { default as chai } from "chai";
import { default as chai_as_promised } from "chai-as-promised";

chai.use(chai_as_promised);

import { expect } from "chai";

import { CubeSigner, Org, Secp256k1, SignerSession } from "../src";
import { newCubeSigner } from "./setup";
import { oidcAuth, oidcProve } from "./helpers";

describe("OidcSessionManager", () => {
  let cs: CubeSigner;
  let org: Org;

  beforeAll(async () => {
    cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    const orgId = aboutMe.org_ids[0];
    org = await cs.getOrg(orgId);
  });

  it("prove authentication using OIDC token", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    console.log("Obtaining proof");
    const proof = await oidcProve(cs, oidcToken, org);
    console.log("Verifying proof");
    await cs.oidcVerify(org.id, proof);

    console.log("Verifying bogus proof is rejected");
    await expect(
      cs.oidcVerify(org.id, {
        aud: "123",
        sub: "abcd",
        iss: "accounts.google.com",
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

    // Check that the expiration time is in the future
    expect(await sessionMgr.isStale()).to.equal(false);

    console.log("Trying session");
    const cs2 = new CubeSigner({ sessionMgr });
    expect((await cs2.getOrg(org.id)).id).to.equal(org.id);
  });

  it("exchange OIDC token for signer session with all scopes", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    const sessionMgr = await oidcAuth(cs, oidcToken, org, ["manage:*", "sign:*"]);

    // TODO(BUG): refreshing requires 'sign:*' scope
    console.log("Refreshing session");
    await sessionMgr.refresh();

    console.log("Trying session");
    const cs2 = new CubeSigner({ sessionMgr });
    const org2 = await cs2.getOrg(org.id);
    expect(org2.id).to.equal(org.id);

    const key = await org2.createKey(Secp256k1.Evm);
    const ss = new SignerSession(sessionMgr);
    const sig = await ss.signEvm(key, {
      chain_id: 1,
      tx: {
        type: "0x00",
        gas: "0x61a80",
        gasPrice: "0x77359400",
        nonce: "0",
      } as unknown as Record<string, never>,
    });
    console.log(sig.data());
    expect(sig.data().rlp_signed_tx).to.not.be.undefined;
  });
});
