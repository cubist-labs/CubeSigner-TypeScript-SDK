import type { SessionData } from "@cubist-labs/cubesigner-sdk";
import { ExclusiveSessionManager } from "@cubist-labs/cubesigner-sdk";
import { promises as fs } from "fs";

/**
 * A session manager that refreshes and stores data in a JSON file
 */
export class JsonFileSessionManager extends ExclusiveSessionManager {
  readonly #filePath: string;
  /**
   * Store session information.
   * @param {SessionData} data The session information to store
   * @return {Promise<void>}
   */
  async store(data: SessionData): Promise<void> {
    await fs.writeFile(this.#filePath, JSON.stringify(data ?? null), "utf-8");
  }

  /**
   * Retrieve session information.
   * @return {Promise<SessionData>} The session information
   */
  async retrieve(): Promise<SessionData> {
    return JSON.parse(await fs.readFile(this.#filePath, "utf-8")) ?? undefined;
  }

  /**
   * Constructor.
   * @param {string} filePath The file path to use for storage
   */
  constructor(filePath: string) {
    super();
    this.#filePath = filePath;
  }
}
