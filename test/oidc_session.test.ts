import { expect } from "chai";
import { CubeSigner, MemorySessionStorage, OidcSessionData } from "../src";
import { newCubeSigner } from "./setup";

describe("OidcSessionManager", () => {
  let cs: CubeSigner;
  let orgId: string;

  beforeAll(async () => {
    cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    orgId = aboutMe.org_ids[0];
  });

  it("create OIDC session from managment session token", async () => {
    console.log("Exchanging token");
    const oidcToken = await cs.sessionMgr!.token();
    const storage = new MemorySessionStorage<OidcSessionData>();
    const sessionMgr = await cs.createOidcSession(oidcToken, orgId, ["manage:*"], storage);

    // Check that the expiration time is in the future
    expect(await sessionMgr.isStale()).to.equal(false);

    console.log("Refreshing session");
    await sessionMgr.refresh();

    // TODO: Make prettier once management sessions use session managers
    console.log("Trying session");
    const cs2 = new CubeSigner({ sessionMgr });
    expect((await cs2.getOrg(orgId)).id).to.equal(orgId);
  });
});
