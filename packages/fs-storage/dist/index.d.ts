import { CubeSignerClient, SignerSession, SignerSessionStorage } from "@cubist-labs/cubesigner-sdk";
/** Session storage */
export { JsonFileSessionStorage } from "./file_storage";
/** Directory where CubeSigner stores config files. */
export declare const CONFIG_DIR: string;
/** Default file path where the management session token is stored. */
export declare const MANAGEMENT_SESSION_PATH: string;
/** Default file path where the signer session token is stored. */
export declare const SIGNER_SESSION_PATH: string;
/**
 * @return {SignerSessionStorage} Storage pointing to the default management session file on disk.
 */
export declare function defaultManagementSessionStorage(): SignerSessionStorage;
/**
 * @return {Promise<CubeSignerClient>} Existing management session from the default file on disk.
 */
export declare function loadManagementSession(): Promise<CubeSignerClient>;
/**
 * @return {SignerSessionStorage} Storage pointing to the default signer session file on disk.
 */
export declare function defaultSignerSessionStorage(): SignerSessionStorage;
/**
 * @return {Promise<SignerSession>} Existing signer session from a default file on disk.
 */
export declare function loadSignerSession(): Promise<SignerSession>;
