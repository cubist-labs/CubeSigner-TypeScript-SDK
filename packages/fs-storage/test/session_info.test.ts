import type { CubeSignerClient, Org, Role } from "@cubist-labs/cubesigner-sdk";
import { refresh } from "@cubist-labs/cubesigner-sdk";
import { newCubeSigner } from "./setup";
import { expect, should } from "chai";
import { assertForbidden } from "./helpers";

describe("SignerSessionInfo", () => {
  let client: CubeSignerClient;
  let org: Org;
  let role: Role;
  let me: string;

  beforeAll(async () => {
    client = await newCubeSigner();
    org = client.org();
    me = (await client.user()).user_id;
  });

  beforeEach(async () => {
    role = await org.createRole();
  });

  afterEach(async () => {
    // delete role
    await role.delete();
  });

  it("list, revoke", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([me]);

    console.log("Creating sessions");
    const s1 = await role.createSession("s1");
    const s2 = await role.createSession("s2");

    console.log("Listing role sessions");
    const sessions = await role.sessions();
    expect(sessions.length).to.equal(2);
    const si1 = sessions.find((t) => t.purpose === "s1");
    const si2 = sessions.find((t) => t.purpose === "s2");
    should().exist(si1, "Session 's1' not found");
    should().exist(si2, "Session 's2' not found");

    console.log("Revoking s1");
    await si1?.revoke();
    await assertForbidden(refresh(s1));

    // revoking should continue work after refreshing
    console.log("Revoking s2");
    await refresh(s2);
    await si2?.revoke();
    await assertForbidden(refresh(s2));

    // list should now return no sessions
    console.log("Listing role sessions again");
    const sessions2 = await role.sessions();
    expect(sessions2.length).to.equal(0);
  });
});
