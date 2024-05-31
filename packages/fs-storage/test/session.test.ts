import { expect } from "chai";
import { newCubeSigner } from "./setup";
import { assertForbidden, delay, deleteKeys } from "./helpers";

import type { Key, Org, Role, SessionData, SessionManager } from "@cubist-labs/cubesigner-sdk";
import {
  CubeSignerClient,
  MemorySessionManager,
  isStale,
  metadata,
  refresh,
} from "@cubist-labs/cubesigner-sdk";

/**
 * Creates a manager that refuses to refresh
 * @param {SessionData} data The session data to use
 * @return {SessionManager} A session manager
 */
function noRefreshManager(data: SessionData): SessionManager {
  return {
    async metadata() {
      return metadata(data);
    },
    async token() {
      return data.token;
    },
  };
}

describe("Session Management", () => {
  let createdKeys: Key[];
  let client: CubeSignerClient;
  let org: Org;
  let role: Role;
  let roleClient: CubeSignerClient;
  let me: string;

  beforeAll(async () => {
    createdKeys = [];
    client = await newCubeSigner();
    org = client.org();
    me = (await client.user()).user_id;
  });

  beforeEach(async () => {
    role = await org.createRole();
    const sessionData = await role.createSession("ts-session-test");
    roleClient = await CubeSignerClient.create(sessionData);
  });

  afterEach(async () => {
    // revoke session
    await roleClient.revokeSession();
    // delete role
    await role.delete();
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  it("user session: create, refresh, revoke", async () => {
    const session = await org.createSession("user session", ["manage:org:listUsers"]);
    const mgr = new MemorySessionManager(session);
    const client = await CubeSignerClient.create(mgr);
    // can list users
    const users = await client.org().users();
    expect(users.length).to.be.greaterThan(0);
    // cannot do anything else
    await assertForbidden(client.org().createUser("alice@example.com", "alice"));

    console.log("Refreshing session");
    await mgr.forceRefresh();
    await client.org().users();

    console.log("Revoking invalidates session");
    await client.revokeSession();
    await assertForbidden(client.org().users());
  });

  it("isStale", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([me]);

    console.log("Creating a new session");
    const sessionData = await role.createSession("s1", { auth: 60 });
    expect(isStale(sessionData)).to.be.false;
    jest.useFakeTimers().setSystemTime(new Date().getTime() + 65 * 1000);
    expect(isStale(sessionData)).to.be.true;
    jest.useRealTimers();
  });

  it("concurrent refreshing", async () => {
    console.log("Creating short-lived session");
    const sessionData = await role.createSession("s1", { auth: 1 });
    const originalEpoch = sessionData.session_info.epoch;

    // const oldSessionData = s
    const waitMs = Math.max(
      0,
      sessionData.session_info.auth_token_exp * 1000 - new Date().getTime(),
    );
    await delay(waitMs + 1);
    expect(isStale(sessionData)).to.equal(true);

    console.log(
      `Concurrently refreshing session ${sessionData.session_info.session_id} (epoch: ${sessionData.session_info.epoch})`,
    );

    const manager = new MemorySessionManager(sessionData);

    const results = await Promise.all(
      [...Array(5).keys()].map(() => {
        return manager.forceRefresh();
      }),
    );

    console.log(
      `After refreshing ${sessionData.session_info.session_id} (epoch: ${sessionData.session_info.epoch})`,
    );

    // All responses to forceRefresh should be the same.
    expect(new Set(results.map((r) => JSON.stringify(r))).size).to.equal(1);

    // the current epoch should be 1 + old epoch (if we refreshed multiple times that epoch could be larger)
    expect((await manager.metadata()).epoch).to.eq(originalEpoch + 1);
  });

  it("expired auth token triggers onSessionExpired", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([me]);

    console.log("Creating short-lived session");
    const sessionData = await role.createSession("s1", { auth: 1 });
    await delay(1200);
    expect(isStale(sessionData)).to.equal(true);

    const clientNoRefresh = await CubeSignerClient.create(noRefreshManager(sessionData));

    let sessionExpired = 0;
    const handler = async () => {
      sessionExpired++;
    };
    clientNoRefresh.addEventListener("session-expired", handler);

    console.log("Using expired token returns FORBIDDEN");
    const err = await assertForbidden(clientNoRefresh.sessionKeys());
    expect(err.isSessionExpiredError()).to.be.true;
    expect(sessionExpired).to.equal(1);

    console.log("Refreshing expired token works");
    await refresh(sessionData);
    clientNoRefresh.removeEventListener("session-expired", handler);
  });

  it("expired refresh token triggers onSessionExpired", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([me]);

    console.log("Creating short-lived session");
    const sessionData = await role.createSession("s1", { auth: 1, refresh: 1 });
    await delay(1200);
    expect(isStale(sessionData)).to.be.true;

    let sessionExpired = 0;
    const handler = async () => {
      sessionExpired++;
    };
    const client = await CubeSignerClient.create(sessionData);
    client.addEventListener("session-expired", handler);

    console.log("Using expired token returns FORBIDDEN");
    await assertForbidden(client.sessionKeys());
    expect(sessionExpired).to.equal(1);
    client.removeEventListener("session-expired", handler);
  });
});
