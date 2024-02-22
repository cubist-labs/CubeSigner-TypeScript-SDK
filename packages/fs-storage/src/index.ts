import { CubeSignerClient, SignerSession, SignerSessionStorage } from "@cubist-labs/cubesigner-sdk";
import { JsonFileSessionStorage } from "./file_storage";
import path from "path";

/** Session storage */
export { JsonFileSessionStorage } from "./file_storage";

/**
 * Directory where CubeSigner stores config files.
 * @return {string} Config dir
 */
function configDir(): string {
  const configDir =
    process.platform === "darwin"
      ? `${process.env.HOME}/Library/Application Support`
      : `${process.env.HOME}/.config`;
  return path.join(configDir, "cubesigner");
}

/** Directory where CubeSigner stores config files. */
export const CONFIG_DIR = configDir();

/** Default file path where the management session token is stored. */
export const MANAGEMENT_SESSION_PATH = path.join(CONFIG_DIR, "management-session.json");

/** Default file path where the signer session token is stored. */
export const SIGNER_SESSION_PATH = path.join(CONFIG_DIR, "signer-session.json");

/**
 * @return {SignerSessionStorage} Storage pointing to the default management session file on disk.
 */
export function defaultManagementSessionStorage(): SignerSessionStorage {
  return new JsonFileSessionStorage(MANAGEMENT_SESSION_PATH);
}

/**
 * @return {Promise<CubeSignerClient>} Existing management session from the default file on disk.
 */
export async function loadManagementSession(): Promise<CubeSignerClient> {
  return await CubeSignerClient.loadManagementSession(defaultManagementSessionStorage());
}

/**
 * @return {SignerSessionStorage} Storage pointing to the default signer session file on disk.
 */
export function defaultSignerSessionStorage(): SignerSessionStorage {
  return new JsonFileSessionStorage(SIGNER_SESSION_PATH);
}

/**
 * @return {Promise<SignerSession>} Existing signer session from a default file on disk.
 */
export async function loadSignerSession(): Promise<SignerSession> {
  return await SignerSession.loadSignerSession(defaultSignerSessionStorage());
}

/** Utils for processing org events */
export * from "./org_event_processor";
