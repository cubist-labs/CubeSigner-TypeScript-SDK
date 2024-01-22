import { expect } from "chai";
import { Org, OrgPolicy } from "@cubist-labs/cubesigner-sdk";
import { newCubeSigner } from "./setup";

describe("About me", () => {
  it("should return about me", async () => {
    const cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    expect(aboutMe).to.have.property("email");
    expect(aboutMe).to.have.property("user_id");
    expect(aboutMe).to.have.property("org_ids");
  });
});

describe("Org", () => {
  let org: Org;

  beforeAll(async () => {
    const cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();

    expect(aboutMe.org_ids.length).to.equal(1);
    const orgId = aboutMe.org_ids[0];
    console.log(`Org ${orgId}`);

    // get by id
    org = new Org(cs);
    expect(org.id).to.equal(orgId);

    const aboutMe2 = await org.user();
    expect(aboutMe2.user_id).to.eq(aboutMe.user_id);

    const orgName = await org.name();
    if (orgName) {
      // get by name
      const orgInfo = await cs.withOrg(orgName).org();
      expect(orgInfo.org_id).to.equal(orgId);
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
    policy.push({ SourceIpAllowlist: ["1.0.0.0/8"] });
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
