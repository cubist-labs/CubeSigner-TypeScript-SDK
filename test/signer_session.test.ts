import { expect, should } from "chai";
import {
  JsonFileSessionStorage,
  MemorySessionStorage,
  Org,
  Role,
  Secp256k1,
  SignerSession,
  SignerSessionData,
  SignerSessionLifetime,
  CubeSigner,
} from "../src";
import { newCubeSigner } from "./setup";
import { assertForbidden, delay } from "./helpers";
import * as tmp from "tmp";
import { promises as fs } from "fs";

describe("SignerSessionManager", () => {
  let cs: CubeSigner;
  let org: Org;
  let role: Role;
  let session: SignerSession;

  beforeAll(async () => {
    cs = await newCubeSigner();
    const aboutMe = await cs.aboutMe();
    org = await cs.getOrg(aboutMe.org_ids[0]);
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
    const s1 = await createInMemorySession("s1", { auth: 1 });
    await delay(1100);
    expect(await s1.sessionMgr.isStale()).to.equal(true);
    expect(await s1.sessionMgr.refreshIfNeeded()).to.equal(true);
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
    const session2 = await CubeSigner.loadSignerSession(fileStorage2);
    expect(await session2.sessionMgr.token()).to.equal(token);
    expect((await session2.keys()).length).to.equal(nKeys);

    console.log(`Load session from memory`);
    const sessionInfo: SignerSessionData = JSON.parse(await fs.readFile(tmpFile, "utf-8"));
    const memStorage = new MemorySessionStorage<SignerSessionData>(sessionInfo);
    const session3 = await CubeSigner.loadSignerSession(memStorage);
    expect(await session3.sessionMgr.token()).to.equal(token);
    expect((await session3.keys()).length).to.equal(nKeys);
  });
});
