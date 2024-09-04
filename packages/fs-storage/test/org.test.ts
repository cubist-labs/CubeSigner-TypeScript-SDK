import { expect } from "chai";
import type { UserInOrgInfo } from "@cubist-labs/cubesigner-sdk";
import {
  type Org,
  type OrgPolicy,
  type OrgEvents,
  type UserInfo,
  type MemberRole,
  type OidcIdentity,
  Secp256k1,
  type CubeSignerClient,
  ApiClient,
  type PublicOrgInfo,
} from "@cubist-labs/cubesigner-sdk";
import { newCubeSigner } from "./setup";
import { assert4xx, assertError, assertErrorCode } from "./helpers";
import { randomBytes } from "crypto";

describe("About me", () => {
  it("should return about me", async () => {
    const cs = await newCubeSigner();
    const aboutMe = await cs.user();
    expect(aboutMe).to.have.property("email");
    expect(aboutMe).to.have.property("user_id");
    expect(aboutMe).to.have.property("org_ids");
    expect(aboutMe).to.have.property("orgs");
    expect(aboutMe.orgs.length).to.eq(1);
    expect(aboutMe.org_ids.length).to.eq(1);
    expect(aboutMe.orgs[0].org_id).to.eq(aboutMe.org_ids[0]);
    expect(aboutMe.orgs[0].membership).to.eq(<MemberRole>"Owner");
  });
});

describe("Org/CubeSignerClient", () => {
  let client: CubeSignerClient;
  let org: Org;
  let originalOrgPolicy: OrgPolicy[];
  let me: UserInfo;

  beforeAll(async () => {
    client = await newCubeSigner();
    const aboutMe = await client.user();

    expect(aboutMe.org_ids.length).to.equal(1);
    const orgId = aboutMe.org_ids[0];
    console.log(`Org ${orgId}`);

    // get by id
    org = client.org();
    expect(org.id).to.equal(orgId);

    originalOrgPolicy = await org.policy();
    me = aboutMe;
  });

  afterAll(async () => {
    // Make sure that the policy is restored, even if tests fail
    await org.setPolicy(originalOrgPolicy);
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

  it("list users", async () => {
    const users = await org.users();
    const found = users.find((u) => u.id === me.user_id)!;
    expect(found).to.exist;
    expect(found.email).to.eq(me.email);
    expect(found.name).to.eq(me.name);
    expect(found.membership).to.eq("Owner"); // these tests expect the logged-in user to be org owner
  });

  describe("Delete Users", () => {
    const userEmails: string[] = []; // This is for cleanup after testing.
    let user1Id: string;
    let user2Id: string;
    let user3Id: string;

    beforeAll(async () => {
      // Add some new users to delete in our test.
      const userInfo: [string, "Alien" | "Member" | undefined][] = [
        [(Math.random() * 1000).toFixed(0), "Member"],
        [(Math.random() * 1000).toFixed(0), "Alien"],
        [(Math.random() * 1000).toFixed(0), undefined],
      ];

      for (const [num, role] of userInfo) {
        // Try to add it to the org. This might fail if there's a conflict.
        const email = `test${num}@email.com`;
        const name = `test${num}`;
        await org.createUser(email, name, role, true);

        // If we successfully added this user, add it to userEmails for cleanup.
        userEmails.push(email);
      }

      const users = await org.users();
      const userIds = userEmails.map((email) => {
        const user = users.find((u) => u.email == email)!;
        expect(user).to.exist;
        return user.id;
      });

      user1Id = userIds[0];
      user2Id = userIds[1];
      user3Id = userIds[2];
    });

    it("delete users", async () => {
      // Create a new key for user1.
      console.log("Creating a key");
      let key = await org.createKey(Secp256k1.Evm, user1Id);
      expect(await key.owner()).to.eq(user1Id);
      expect(org.getKey(key.id)).to.exist;

      console.log("Creating a role");
      const role = await org.createRole(`test_role_${(Math.random() * 1000).toFixed(0)}`);
      await role.addUser(user1Id);
      await role.addKey(key);

      // Delete user1
      console.log("Deleting user");
      await org.deleteUser(user1Id);

      // Check that it is deleted
      console.log("Listing users using paginator");
      const usersPaginator = org.usersPaginated({ size: 1, all: false });
      let usersAfterDelete: UserInOrgInfo[] = [];
      const page = [];
      do {
        const page = await usersPaginator.fetchPage();
        usersAfterDelete = usersAfterDelete.concat(page);
      } while (page.length != 0);

      // Check that different pagination settings produce the same result
      expect(usersAfterDelete).to.eql(await org.users());

      console.log(`Got ${usersAfterDelete.length} users`);
      expect(usersAfterDelete.find((u) => u.id == user1Id)).to.not.exist;

      // ...but that the others exist
      expect(usersAfterDelete.find((u) => u.id == user2Id)).to.exist;
      expect(usersAfterDelete.find((u) => u.id === user3Id)).to.exist;

      // Check that user1 is no longer in role
      console.log("Listing role users");
      const roleUsers = await role.users();
      expect(roleUsers).to.not.include(user1Id);

      // Check that the key still exists, and that the owner can transfer key ownership.
      console.log("Transferring key ownership");
      key = await org.getKey(key.id);
      expect(key).to.exist;
      await key.setOwner(user2Id);
      expect(await key.owner()).to.eq(user2Id);

      // Delete the role and the key
      console.log("Deleting role");
      await role.delete();
      console.log("Deleting key");
      await key.delete();
      await assertError(org.getRole(role.id));
      await assertError(org.getKey(key.id));

      // Delete everyone
      console.log("Deleting both users");
      await Promise.all([org.deleteUser(user2Id), org.deleteUser(user3Id)]);

      // Make sure everyone is gone
      console.log("Listing users");
      const users = await org.users();
      console.log("Done");
      expect(users.find((u) => u.id == user1Id)).to.not.exist;
      expect(users.find((u) => u.id == user2Id)).to.not.exist;
      expect(users.find((u) => u.id == user3Id)).to.not.exist;
      expect(users.find((u) => u.id == me.user_id)).to.exist;
    });

    it("self delete", async () => {
      // A user cannot delete themself
      await assertErrorCode("SelfDelete", org.deleteUser(me.user_id));
    });

    afterAll(async () => {
      // The `delete users` test is responsible for deleting all users added.
      // but in case the test fails, we use the list of users *we* added here
      // to clean up after ourselves.
      const users = await org.users();
      const existingUsers: string[] = [];

      for (const email of userEmails) {
        const user = users.find((u) => u.email == email);
        if (user) {
          // Add this so we can signal that something went wrong.
          existingUsers.push(user.id);

          // But try to clean up anyway.
          await org.deleteUser(user.id);
        }
      }

      expect(existingUsers).to.be.empty;
    });
  });

  it("can be constructed by name", async () => {
    const orgName = await org.name();
    if (orgName) {
      const orgByName = client.getOrg(orgName);
      expect(orgByName.name).to.equal(orgName);
    }
  });

  it("set notification endpoints", async () => {
    await assertErrorCode(
      "InvalidNotificationUrlProtocol",
      org.setNotificationEndpoints([{ url: "http://example.com/ep1" }]),
    );

    const url = "https://example.com:3000/ep1";

    await assertError(org.setNotificationEndpoints([{ url, filter: { OneOf: [] } }]));
    // TODO: assert that error code is 'EmptyOneOfOrgEventFilter'

    const invalidEvent = "asdf" as unknown as OrgEvents;
    await assert4xx(org.setNotificationEndpoints([{ url, filter: { OneOf: [invalidEvent] } }]));
    await assert4xx(
      org.setNotificationEndpoints([{ url, filter: { OneOf: ["OidcAuth", invalidEvent] } }]),
    );

    await org.setNotificationEndpoints([]);
  });

  it("set policy", async () => {
    // Allowing all origins by default because that's necessary for snaps test
    const originalPolicy: OrgPolicy[] = await org.policy();

    try {
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
      // add OidcAuthSources policy
      policy.push({
        OidcAuthSources: {
          "https://accounts.facebook.com": {
            auds: ["F1", "F2"],
            users: ["Owner"],
          },
          "https://accounts.google.com": {
            auds: ["G1", "G2"],
            users: ["Member"],
            nickname: "Goog",
            public: true,
          },
        },
      });
      await org.setPolicy(policy);
      expect(await org.policy()).to.deep.equal(policy);

      // check the public info endpoint
      const pubInfo = await ApiClient.publicOrgInfo(client.env, org.id);
      console.log("Public info", org.id, pubInfo);
      const expected: PublicOrgInfo["oidc_issuers"] = [
        { audiences: ["G1", "G2"], issuer: "https://accounts.google.com", nickname: "Goog" },
      ];
      expect(pubInfo.oidc_issuers).to.deep.equal(expected);
    } finally {
      // set to original policy
      await org.setPolicy(originalPolicy);
      expect(await org.policy()).to.deep.equal(originalPolicy);
    }
  });

  it("user info", async () => {
    // create user without email address
    const userId = await org.createOidcUser(
      <OidcIdentity>{
        iss: "https://accounts.google.com",
        sub: randomBytes(10).toString("hex"),
      },
      null,
    );

    // the user should have a `null` email address when listed
    const user = await org.getUser(userId);
    expect(user.email).to.equal(null);

    // delete it
    await org.deleteUser(user.id);
  });
});
