import { expect } from "chai";
import { CognitoSessionManager, CubeSigner } from "../src";
import { loadCognitoSession } from "./setup";

describe("ManagementSessionManager", () => {
  let manager: CognitoSessionManager;

  beforeAll(async () => {
    manager = await loadCognitoSession();
  });

  it("refresh management session", async () => {
    console.log("Getting user information");
    const cs = new CubeSigner({ sessionMgr: manager });
    const aboutMe = await cs.aboutMe();
    const token = await manager.token();

    console.log("Refreshing session");
    await manager.refresh();

    console.log("Refreshing session");
    expect(await manager.isStale()).to.equal(false);

    console.log("Session should be stale after 15min");
    jest.useFakeTimers().setSystemTime(new Date().getTime() + 15 * 60 * 1000);
    expect(await manager.isStale()).to.equal(true);

    console.log("Getting user information");
    const aboutMe2 = await cs.aboutMe();
    const token2 = await manager.token();
    expect(aboutMe2.user_id).to.equal(aboutMe.user_id);
    expect(token).to.not.equal(token2);

    console.log("Reload refreshed session from file");
    const newCs = await CubeSigner.loadManagementSession();
    const newManager = newCs.sessionMgr!;
    const newToken = await newManager.token();
    const newAboutMe = await newCs.aboutMe();
    expect(newAboutMe.user_id).to.equal(aboutMe.user_id);
    expect(newToken).to.equal(token2);
  });
});
