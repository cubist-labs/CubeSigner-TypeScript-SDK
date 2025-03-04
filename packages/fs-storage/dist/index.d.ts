import { JsonFileSessionManager } from ".";
/** Session storage */
export { JsonFileSessionManager as JsonFileSessionManager } from "./file_storage";
/** Directory where CubeSigner stores config files. */
export declare const CONFIG_DIR: string;
/** Default file path where the management session token is stored. */
export declare const MANAGEMENT_SESSION_PATH: string;
/** Default file path where the signer session token is stored. */
export declare const SIGNER_SESSION_PATH: string;
/**
 * @returns Manager pointing to the default management session file on disk.
 */
export declare function defaultManagementSessionManager(): JsonFileSessionManager;
/**
 * @returns Manager pointing to the default signer session file on disk.
 */
export declare function defaultSignerSessionManager(): JsonFileSessionManager;
//# sourceMappingURL=index.d.ts.map