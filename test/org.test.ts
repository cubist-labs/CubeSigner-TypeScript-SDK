import { expect } from "chai";
import { CubeSigner, Org, OrgPolicy } from "../src";
import { newCubeSigner } from "./setup";

describe("About me", () => {
  it("should return about me", async () => {
    const cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    expect(aboutMe).to.have.property("email");
    expect(aboutMe).to.have.property("user_id");
    expect(aboutMe).to.have.property("org_ids");
    for (const orgId of aboutMe.org_ids) {
      cs.setOrgId(orgId);
      expect(aboutMe).to.eql(await cs.aboutMe());
    }
  });
});

describe("Org", () => {
  let cs: CubeSigner;
  let org: Org;

  beforeAll(async () => {
    cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();

    expect(aboutMe.org_ids.length).to.equal(1);
    const orgId = aboutMe.org_ids[0];

    // get by id
    org = await cs.getOrg(orgId);
    expect(org.id).to.equal(orgId);

    const orgName = await org.name();
    if (orgName) {
      // get by name
      org = await cs.getOrg(orgName);
      expect(org.id).to.equal(orgId);
    }
  });

  afterAll(async () => {
    // Make sure that the policy is cleared, even if tests fail
    await org.setPolicy([]);
  });

  // skipping because re-enabling org may take some time
  it.skip("enable/disable", async () => {
    expect(await org.enabled()).to.equal(true);
    // disable:
    await org.disable();
    expect(await org.enabled()).to.equal(false);
    // re-enable:
    await org.enable();
    expect(await org.enabled()).to.equal(true);
  });

  it("set policy", async () => {
    // Allowing all origins by default because that's necessary for snaps test
    const defaultPolicy: OrgPolicy[] = [{ OriginAllowlist: "*" }];

    const policy: OrgPolicy[] = [];
    // start with an empty policy:
    await org.setPolicy(policy);
    expect(await org.policy()).to.deep.equal(policy);
    // set policy:
    policy.push({ SourceIpAllowlist: ["127.0.0.1/32", "192.0.0.0/8"] });
    await org.setPolicy(policy);
    expect(await org.policy()).to.deep.equal(policy);
    // add to policy:
    policy.push({ MaxDailyUnstake: 5 });
    await org.setPolicy(policy);
    expect(await org.policy()).to.deep.equal(policy);

    // set to default policy:
    await org.setPolicy(defaultPolicy);
    expect(await org.policy()).to.deep.equal(defaultPolicy);
  });
});
