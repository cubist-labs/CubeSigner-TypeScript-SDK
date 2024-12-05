import path from "path";
import { JsonFileSessionManager } from ".";

/** Session storage */
export { JsonFileSessionManager as JsonFileSessionManager } from "./file_storage";

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
 * @return {JsonFileSessionManager} Manager pointing to the default management session file on disk.
 */
export function defaultManagementSessionManager(): JsonFileSessionManager {
  return new JsonFileSessionManager(MANAGEMENT_SESSION_PATH);
}

/**
 * @return {JsonFileSessionManager} Manager pointing to the default signer session file on disk.
 */
export function defaultSignerSessionManager(): JsonFileSessionManager {
  return new JsonFileSessionManager(SIGNER_SESSION_PATH);
}
