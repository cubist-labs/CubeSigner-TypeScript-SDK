import pkg from "./../package.json";

/** Errors */
export * from "./error";
/** API */
export * from "./client/api_client";
/** Client */
export * from "./client";
/** Callbacks */
export { ErrorEvent, SessionExpiredEvent } from "./client/base_client";
/** Organizations */
export * from "./org";
/** Keys */
export * from "./key";
/** Events */
export * from "./events";
/** Roles */
export * from "./role";
/** Env */
export * from "./env";
/** Fido */
export * from "./mfa";
/** Pagination */
export * from "./paginator";
/** Response */
export * from "./response";
/** Types */
export * from "./schema_types";
/** Sessions */
export * from "./signer_session";
/** Session storage */
export * from "./client/session";
/** Utils */
export * from "./util";
/** User-export decryption helper */
export { userExportDecrypt, userExportKeygen } from "./user_export";
/** Ethers.js helpers */
export * from "./evm";

/** CubeSigner SDK package name */
export const NAME: string = pkg.name;

/** CubeSigner SDK version */
export const VERSION: string = pkg.version;
