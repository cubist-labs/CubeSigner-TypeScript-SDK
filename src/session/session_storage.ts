import { promises as fs } from "fs";

/** Interface for storing sessions. */
export interface SessionStorage<U> {
  /** Store session information */
  save(data: U): Promise<void>;

  /** Retrieve session information */
  retrieve(): Promise<U>;
}

/** Stores session information in memory */
export class MemorySessionStorage<U> implements SessionStorage<U> {
  #data?: U;

  /**
   * Store session information.
   * @param {U} data The session information to store
   * @return {Promise<void>}
   */
  async save(data: U): Promise<void> {
    this.#data = data;
  }

  /**
   * Retrieve session information.
   * @return {Promise<U>} The session information
   */
  async retrieve(): Promise<U> {
    if (!this.#data) {
      throw new Error("Missing session information");
    }
    return this.#data;
  }

  /**
   * Constructor.
   * @param {U?} data The initial data
   */
  constructor(data?: U) {
    this.#data = data;
  }
}

/** Stores session information in a JSON file */
export class JsonFileSessionStorage<U> implements SessionStorage<U> {
  #filePath: string;

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
