import { expect } from "chai";
import { newCubeSigner } from "./setup";
import { assertErrorCode, assertForbidden, delay, deleteKeys } from "./helpers";

import type {
  Key,
  Org,
  Role,
  Scope,
  SessionData,
  SessionLifetime,
  SessionManager,
} from "@cubist-labs/cubesigner-sdk";
import {
  CubeSignerClient,
  MemorySessionManager,
  isStale,
  metadata,
  refresh,
  serializeRefreshToken,
} from "@cubist-labs/cubesigner-sdk";
import { authenticator } from "otplib";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Creates a manager that refuses to refresh
 *
 * @param data The session data to use
 * @returns A session manager
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
  let me: string;

  beforeAll(async () => {
    createdKeys = [];
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

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  it("extend session", async () => {
    let newSession = await org.createSession("new user session", ["manage:session:create"]);
    let newClient = await CubeSignerClient.create(newSession);
    // cannot extend without 'manage:session:extend' scope
    await assertErrorCode(
      "ImproperSessionScope",
      newClient.apiClient.sessionCreateExtended("p", ["manage:session:create"], {
        auth: 60,
      }),
    );

    const scopes: Scope[] = ["manage:session:extend", "manage:mfa:vote:totp"];
    newSession = await org.createSession("new user session", scopes);
    newClient = await CubeSignerClient.create(newSession);

    // cannot obtain new scopes
    const lifetime: SessionLifetime = { auth: 60000 };
    await assertErrorCode(
      "ImproperSessionScope",
      newClient.apiClient.sessionCreateExtended("p", ["manage:*"], lifetime),
    );

    // can extend lifetimes but MFA is required
    let resp = await newClient.apiClient.sessionCreateExtended("p", scopes, lifetime);
    expect(resp.requiresMfa()).to.be.true;
    const totpSecret = process.env["CS_USER_TOTP_SECRET"] ?? "";
    const code = authenticator.generate(totpSecret);
    resp = await resp.totpApprove(newClient, code);
    expect(resp.requiresMfa()).to.be.false;

    const extendedSessionData = resp.data();
    expect(extendedSessionData).to.exist;

    // we don't test the lifetime of the extended session here (we do that in Rust);
    // instead, we sanity check that the session works
    const extendedClient = await CubeSignerClient.create(extendedSessionData);
    const userInfo = await extendedClient.apiClient.userGet();
    expect(userInfo.user_id).to.eq(me);
  });

  it("user session: create, refresh, revoke", async () => {
    const session = await org.createSession("user session", [
      "manage:org:user:list",
      "manage:session:get",
    ]);

    // Test that the output of `serializeRefreshToken()` matches the
    // `refresh_token` field
    expect(session.refresh_token).to.eq(serializeRefreshToken(session.session_info));

    const mgr = new MemorySessionManager(session);
    const client = await CubeSignerClient.create(mgr);
    // can list users
    const users = await client.org().users();
    expect(users.length).to.be.greaterThan(0);
    // cannot do anything else
    await assertForbidden(client.org().createUser({ email: "alice@example.com", name: "alice" }));

    console.log("Refreshing session");
    await mgr.forceRefresh();
    await client.org().users();

    const sessionInfo = await client.apiClient.sessionGet();
    expect(sessionInfo.created_by).to.eq(me);
    expect(sessionInfo.last_used).to.exist;
    expect(sessionInfo.last_used!.time).to.be.greaterThan(0);
    expect(sessionInfo.last_used!.source_ip).to.not.eq("");
    expect(sessionInfo.lifetimes).to.exist;
    expect(sessionInfo.lifetimes!.auth_lifetime).to.be.greaterThan(1);
    expect(sessionInfo.lifetimes!.session_lifetime).to.be.greaterThan(1);
    expect(sessionInfo.lifetimes!.refresh_lifetime).to.be.greaterThan(1);

    console.log("Revoking invalidates session");
    await client.revokeSession();
    await assertForbidden(client.org().users());
  });

  it("revoke all role sessions", async () => {
    expect(await role.enabled()).to.equal(true);

    console.log("Creating a new session");
    const rs1 = await role.createSession("s1", { auth: 60 });
    const rs2 = await role.createSession("s2", { auth: 60 });

    const cs1 = await CubeSignerClient.create(rs1);
    const cs2 = await CubeSignerClient.create(rs2);

    // test that the role sessions work
    await Promise.all([cs1, cs2].map((cs) => cs.apiClient.sessionKeysList()));

    // revoke all
    await client.apiClient.sessionRevokeAll(role.id);

    // test that the role sessions don't work
    for (const cs of [cs1, cs2]) {
      await assertForbidden(cs.apiClient.sessionKeysList());
    }
  });

  it("list all sessions", async () => {
    expect(await role.enabled()).to.equal(true);

    console.log("Creating a new session");
    const rs1 = await role.createSession("s1", { auth: 60 });
    const rs2 = await role.createSession("s2", { auth: 60 });

    console.log("Listing role sessions");
    const roleSessions = await client.apiClient.sessionsList({ role: role.id }).fetchAll();
    expect(roleSessions.find((s) => s.session_id === rs1.session_info.session_id)).to.exist;
    expect(roleSessions.find((s) => s.session_id === rs2.session_info.session_id)).to.exist;

    console.log("Revoking role sessions");
    await client.apiClient.sessionRevokeAll({ role: role.id });
    const afterRevokeAll = await client.apiClient.sessionsList({ role: role.id }).fetchAll();
    expect(afterRevokeAll).to.be.empty;

    console.log("Listing user sessions");
    const userSessions = await client.apiClient.sessionsList({ user: me }).fetchAll();
    expect(userSessions).to.not.be.empty;
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
    const handler = () => {
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
    const handler = () => {
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
