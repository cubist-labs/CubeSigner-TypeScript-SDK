import { SessionStorage } from "@cubist-labs/cubesigner-sdk";
import { promises as fs } from "fs";

/** Stores session information in a JSON file */
export class JsonFileSessionStorage<U> implements SessionStorage<U> {
  readonly #filePath: string;

  /**
   * Store session information.
   * @param {U} data The session information to store
   * @return {Promise<void>}
   */
  async save(data: U): Promise<void> {
    await fs.writeFile(this.#filePath, JSON.stringify(data), "utf-8");
  }

  /**
   * Retrieve session information.
   * @return {Promise<U>} The session information
   */
  async retrieve(): Promise<U> {
    return JSON.parse(await fs.readFile(this.#filePath, "utf-8"));
  }

  /**
   * Constructor.
   * @param {string} filePath The file path to use for storage
   */
  constructor(filePath: string) {
    this.#filePath = filePath;
  }
}
