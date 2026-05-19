import { JsonFileSessionManager } from ".";
/** Session storage */
export { JsonFileSessionManager as JsonFileSessionManager } from "./file_storage";
/** Directory where CubeSigner stores config files. */
export declare const CONFIG_DIR: string;
/** Default file path where the management session token is stored. */
export declare const USER_SESSION_PATH: string;
/** Default file path where the role session token is stored. */
export declare const ROLE_SESSION_PATH: string;
/** Default file path where the management session token is stored. */
export declare const MANAGEMENT_SESSION_PATH: string;
/** Default file path where the signer session token is stored. */
export declare const SIGNER_SESSION_PATH: string;
/**
 * @returns Session manager using the default user session on disk.
 */
export declare function defaultUserSessionManager(): JsonFileSessionManager;
/**
 * @returns Session manager using the default role session on disk.
 */
export declare function defaultRoleSessionManager(): JsonFileSessionManager;
/**
 * @deprecated Use `defaultUserSessionManager` instead.
 *
 * @returns Manager pointing to the default management session file on disk.
 */
export declare function defaultManagementSessionManager(): JsonFileSessionManager;
/**
 * @deprecated Use `defaultRoleSessionManager` instead.
 *
 * @returns Manager pointing to the default signer session file on disk.
 */
export declare function defaultSignerSessionManager(): JsonFileSessionManager;
//# sourceMappingURL=index.d.ts.map