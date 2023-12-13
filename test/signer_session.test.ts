import { expect, should } from "chai";
import {
  JsonFileSessionStorage,
  MemorySessionStorage,
  Org,
  Role,
  Secp256k1,
  SignerSessionData,
  SignerSessionLifetime,
  Key,
  SignerSession,
  SignerSessionManager,
  SignerSessionStorage,
  CubeSignerClient,
} from "../src";
import { newCubeSigner } from "./setup";
import { assertForbidden, delay, deleteKeys } from "./helpers";
import * as tmp from "tmp";
import { promises as fs } from "fs";
import { GlobalEvents, messageMatchesSessionExpired } from "../src/events";

/** Manager that refuses to refresh. */
class NoRefreshManager extends SignerSessionManager {
  /**
   * Constructor.
   * @param {SignerSessionData} sessionData Session data
   * @param {SignerSessionStorage} storage Storage
   */
  constructor(sessionData: SignerSessionData, storage: SignerSessionStorage) {
    super(sessionData, storage);
  }

  /**
   * Load from storage.
   * @param {SignerSessionStorage} storage The storage to load from.
   * @return {Promise<NoRefreshManager>} New instance of self.
   */
  static async loadFromStorage(storage: SignerSessionStorage): Promise<NoRefreshManager> {
    const session = await storage.retrieve();
    return new NoRefreshManager(session, storage);
  }

  /**
   * Refuses to refresh.
   * @return {boolean} False.
   */
  override async refreshIfNeeded(): Promise<boolean> {
    return false;
  }
}

describe("SignerSessionManager", () => {
  let createdKeys: Key[];
  let org: Org;
  let role: Role;
  let session: SignerSession;

  beforeAll(async () => {
    createdKeys = [];
    org = new Org(await newCubeSigner());
  });

  beforeEach(async () => {
    role = await org.createRole();
    session = await role.createSession(new MemorySessionStorage(), "ts-session-test");
  });

  afterEach(async () => {
    // revoke session
    await session.sessionMgr.revoke();
    // delete role
    await role.delete();
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  /**
   * Create an in-memory session.
   * @param {string} purpose Descriptive purpose.
   * @param {SignerSessionLifetime} ttl Optional session lifetimes.
   * @return {Promise<SignerSession>} New signer session.
   */
  function createInMemorySession(
    purpose: string,
    ttl?: SignerSessionLifetime,
  ): Promise<SignerSession> {
    return role.createSession(new MemorySessionStorage(), purpose, ttl);
  }

  it("user session: create, refresh, revoke", async () => {
    const session = await org.sessionCreate("user session", ["manage:org:listUsers"]);
    const manager = await SignerSessionManager.createFromSessionData(session);
    const csc = new CubeSignerClient(manager);
    // can list users
    const users = await csc.orgUsersList();
    expect(users.length).to.be.greaterThan(0);
    // cannot do anything else
    await assertForbidden(csc.orgUserInvite("alice@example.com", "alice"));

    console.log("Refreshing session");
    await manager.refresh();
    await csc.orgUsersList();

    console.log("Revoking invalidates session");
    await manager.revoke();
    await assertForbidden(csc.orgUsersList());
  });

  it("create, refresh, revoke", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([]);

    const session = await createInMemorySession("ts-session-test-revoke");

    console.log("Refreshing session");
    await session.sessionMgr.refresh();

    console.log("Revoking invalidates session");
    await session.sessionMgr.revoke();
    await assertForbidden(session.sessionMgr.refresh());
  });

  it("isStale, refreshIfNeeded", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([]);

    console.log("Creating a new session");
    const s1 = await createInMemorySession("s1", { auth: 60 });
    expect(await s1.sessionMgr.isStale()).to.equal(false);
    jest.useFakeTimers().setSystemTime(new Date().getTime() + 65 * 1000);
    expect(await s1.sessionMgr.isStale()).to.equal(true);
    expect(await s1.sessionMgr.refreshIfNeeded()).to.equal(true);
    jest.useRealTimers();
  });

  it("session expired regexes", async () => {
    [
      "Auth token for epoch 1 has expired",
      "Refresh token for epoch 123 has expired",
      "Outdated session",
      "Session 'some purpose' for 'User#123' has been revoked",
      "Session 'some other purpose' for 'Role#234' has expired",
    ].forEach((m) => {
      expect(messageMatchesSessionExpired(m)).to.be.true;
    });
  });

  it("concurrent refreshing", async () => {
    console.log("Creating short-lived session");
    const ss = await createInMemorySession("s1", { auth: 1 });

    const oldSessionData = (await ss.sessionMgr.storage.retrieve()).session_info;

    const waitMs = Math.max(0, oldSessionData.auth_token_exp * 1000 - new Date().getTime());
    await delay(waitMs + 1);
    expect(await ss.sessionMgr.isStale()).to.equal(true);

    console.log(
      `Concurrently refreshing session ${oldSessionData.session_id} (epoch: ${oldSessionData.epoch})`,
    );
    const results = await Promise.all(
      [...Array(5).keys()].map(() => {
        return ss.sessionMgr.refreshIfNeeded();
      }),
    );

    console.log("Refresh results", results);

    const newSessionData = (await ss.sessionMgr.storage.retrieve()).session_info;
    console.log(`After refreshing ${newSessionData.session_id} (epoch: ${newSessionData.epoch})`);

    // exactly one should have refreshed
    expect(results.filter((b) => b)).to.eql([true]);

    // the current epoch should be 1 + old epoch (if we refreshed multiple times that epoch could be larger)
    expect(newSessionData.epoch).to.eq(oldSessionData.epoch + 1);
  });

  it("expired auth token triggers onSessionExpired", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([]);

    console.log("Creating short-lived session");
    const ss = await createInMemorySession("s1", { auth: 1 });
    await delay(1200);
    expect(await ss.sessionMgr.isStale()).to.equal(true);

    const ssNoRefresh = new SignerSession(
      await NoRefreshManager.loadFromStorage(ss.sessionMgr.storage),
    );

    let sessionExpired = 0;
    const handler = async () => {
      sessionExpired++;
    };
    GlobalEvents.onSessionExpired(handler);

    console.log("Using expired token returns FORBIDDEN");
    await assertForbidden(ssNoRefresh.keys());
    expect(sessionExpired).to.equal(1);

    console.log("Refreshing expired token works");
    await ss.sessionMgr.refresh();
    expect(GlobalEvents.unregisterOnSessionExpired(handler)).to.be.true;
  });

  it("expired refresh token triggers onSessionExpired", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([]);

    console.log("Creating short-lived session");
    const ss = await createInMemorySession("s1", { auth: 1, refresh: 1 });
    await delay(1200);
    expect(await ss.sessionMgr.isStale()).to.equal(true);

    let sessionExpired = 0;
    const handler = async () => {
      sessionExpired++;
    };
    ss.sessionMgr.events.onSessionExpired(handler);

    console.log("Using expired token returns FORBIDDEN");
    await assertForbidden(ss.keys());
    expect(sessionExpired).to.equal(1);
    expect(ss.sessionMgr.events.unregisterOnSessionExpired(handler)).to.be.true;
  });

  it("expired session triggers onSessionExpired", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([]);

    console.log("Creating short-lived session");
    const ss = await createInMemorySession("s1", { auth: 100, refresh: 100, session: 1 });
    await delay(1200);

    let sessionExpired = 0;
    const handler = async () => {
      sessionExpired++;
    };
    ss.sessionMgr.events.onSessionExpired(handler);

    console.log("Using expired token returns FORBIDDEN");
    await assertForbidden(ss.keys());
    expect(sessionExpired).to.equal(1);
    expect(ss.sessionMgr.events.unregisterOnSessionExpired(handler)).to.be.true;
  });

  it("list, revoke", async () => {
    expect(await role.enabled()).to.equal(true);
    expect(role.name).to.equal(undefined);
    expect(await role.users()).to.deep.equal([]);

    console.log("Creating sessions");
    const s1 = await createInMemorySession("s1");
    const s2 = await createInMemorySession("s2");

    console.log("Listing role sessions");
    const sessions = await role.sessions();
    expect(sessions.length).to.equal(3);
    const si1 = sessions.find((t) => t.purpose === "s1");
    const si2 = sessions.find((t) => t.purpose === "s2");
    should().exist(si1, "Session 's1' not found");
    should().exist(si2, "Session 's2' not found");

    console.log("Revoking s1");
    await si1?.revoke();
    await assertForbidden(s1.sessionMgr.refresh());

    // revoking should continue work after refreshing
    console.log("Revoking s2");
    await s2.sessionMgr.refresh();
    await si2?.revoke();
    await assertForbidden(s2.sessionMgr.refresh());

    // list should now return 1
    console.log("Listing role sessions again");
    const sessions2 = await role.sessions();
    expect(sessions2.length).to.equal(1);
  });

  it("list keys in role using session", async () => {
    const session = await createInMemorySession("session");

    // Retrieve the number of keys
    const nKeysBefore = (await session.keys()).length;

    // Add new key to role
    const key = await org.createKey(Secp256k1.Evm);
    createdKeys.push(key);
    await role.addKey(key);

    // Retrieve keys after
    const keys = await session.keys();
    const nKeysAfter = keys.length;

    // The number of keys in the role should have increased by one
    expect(nKeysAfter).to.equal(nKeysBefore + 1);

    keys.forEach((k) => {
      expect(k.id).to.eq(k.key_id);
      expect(k.type).to.eq(k.key_type);
      expect(k.publicKey).to.eq(k.public_key);
      expect(k.materialId).to.eq(k.material_id);
    });
  });

  it("load session from storage", async () => {
    const tmpFile = tmp.fileSync().name;

    console.log(`Create session in file ${tmpFile}`);
    const fileStorage = new JsonFileSessionStorage<SignerSessionData>(tmpFile);
    const session = await role.createSession(fileStorage, "session");
    const token = await session.sessionMgr.token();
    const nKeys = (await session.keys()).length;

    console.log(`Load session from file ${tmpFile}`);
    const fileStorage2 = new JsonFileSessionStorage<SignerSessionData>(tmpFile);
    const session2 = await SignerSession.loadSignerSession(fileStorage2);
    expect(await session2.sessionMgr.token()).to.equal(token);
    expect((await session2.keys()).length).to.equal(nKeys);

    console.log(`Load session from memory`);
    const sessionInfo: SignerSessionData = JSON.parse(await fs.readFile(tmpFile, "utf-8"));
    const memStorage = new MemorySessionStorage<SignerSessionData>(sessionInfo);
    const session3 = await SignerSession.loadSignerSession(memStorage);
    expect(await session3.sessionMgr.token()).to.equal(token);
    expect((await session3.keys()).length).to.equal(nKeys);
  });
});
