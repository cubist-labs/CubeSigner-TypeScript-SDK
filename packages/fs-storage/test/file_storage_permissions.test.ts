import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { SessionData } from "@cubist-labs/cubesigner-sdk";
import { JsonFileSessionManager } from "../src/file_storage";

describe("JsonFileSessionManager", () => {
  it("stores session files with restrictive permissions", async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), "cubesigner-fs-storage-"));
    const path = join(dir, "session.json");

    const manager = new JsonFileSessionManager(path);
    const sessionData = { token: "test-token" } as unknown as SessionData;
    await manager.store(sessionData);

    const stat = await fs.stat(path);
    expect(stat.mode & 0o777).toBe(0o600);

    await fs.rm(dir, { recursive: true, force: true });
  });
});
