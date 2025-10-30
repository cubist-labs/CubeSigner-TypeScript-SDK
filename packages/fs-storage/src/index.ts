import path from "path";
import { JsonFileSessionManager } from ".";
import fs from "fs";

/** Session storage */
export { JsonFileSessionManager as JsonFileSessionManager } from "./file_storage";

/**
 * Directory where CubeSigner stores config files.
 *
 * @returns Config dir
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
export const USER_SESSION_PATH = path.join(CONFIG_DIR, "user-session.json");

/** Default file path where the role session token is stored. */
export const ROLE_SESSION_PATH = path.join(CONFIG_DIR, "role-session.json");

/** Default file path where the management session token is stored. */
export const MANAGEMENT_SESSION_PATH = path.join(CONFIG_DIR, "management-session.json");

/** Default file path where the signer session token is stored. */
export const SIGNER_SESSION_PATH = path.join(CONFIG_DIR, "signer-session.json");

/**
 * @returns Session manager using the default user session on disk.
 */
export function defaultUserSessionManager(): JsonFileSessionManager {
  if (fs.existsSync(USER_SESSION_PATH)) {
    return new JsonFileSessionManager(USER_SESSION_PATH);
  }
  // If no user session, fall back to management session for backwards compatibility
  return new JsonFileSessionManager(MANAGEMENT_SESSION_PATH);
}

/**
 * @returns Session manager using the default role session on disk.
 */
export function defaultRoleSessionManager(): JsonFileSessionManager {
  if (fs.existsSync(ROLE_SESSION_PATH)) {
    return new JsonFileSessionManager(ROLE_SESSION_PATH);
  }
  // If no role session, fall back to signer session for backwards compatibility
  return new JsonFileSessionManager(SIGNER_SESSION_PATH);
}

/**
 * @deprecated Use `defaultUserSessionManager` instead.
 *
 * @returns Manager pointing to the default management session file on disk.
 */
export function defaultManagementSessionManager(): JsonFileSessionManager {
  return new JsonFileSessionManager(MANAGEMENT_SESSION_PATH);
}

/**
 * @deprecated Use `defaultRoleSessionManager` instead.
 *
 * @returns Manager pointing to the default signer session file on disk.
 */
export function defaultSignerSessionManager(): JsonFileSessionManager {
  return new JsonFileSessionManager(SIGNER_SESSION_PATH);
}
