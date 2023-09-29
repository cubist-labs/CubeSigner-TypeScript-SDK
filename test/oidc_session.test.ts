import { expect } from "chai";
import { CubeSigner, Secp256k1, SignerSession } from "../src";
import { newCubeSigner } from "./setup";

describe("OidcSessionManager", () => {
  let cs: CubeSigner;
  let orgId: string;

  beforeAll(async () => {
    cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    orgId = aboutMe.org_ids[0];
  });

  it("exchange OIDC token for signer session with scope 'manage:*'", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    const sessionMgr = await cs.oidcAuth(oidcToken, orgId, ["manage:*"]);

    // Check that the expiration time is in the future
    expect(await sessionMgr.isStale()).to.equal(false);

    console.log("Trying session");
    const cs2 = new CubeSigner({ sessionMgr });
    expect((await cs2.getOrg(orgId)).id).to.equal(orgId);
  });

  it("exchange OIDC token for signer session with all scopes", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    const sessionMgr = await cs.oidcAuth(oidcToken, orgId, ["manage:*", "sign:*"]);

    // TODO(BUG): refreshing requires 'sign:*' scope
    console.log("Refreshing session");
    await sessionMgr.refresh();

    console.log("Trying session");
    const cs2 = new CubeSigner({ sessionMgr });
    const org = await cs2.getOrg(orgId);
    expect(org.id).to.equal(orgId);

    const key = await org.createKey(Secp256k1.Evm);
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
