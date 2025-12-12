import type { UserExportCompleteResponse, UserExportKeyMaterial } from "./schema_types";
import type { CipherSuite } from "@hpke/core";
/**
 * Get the HPKE ciphersuite for user-export decryption.
 *
 * @returns The HPKE ciphersuite for user export.
 */
export declare function userExportCipherSuite(): Promise<CipherSuite>;
/**
 * Generate a key pair for user export.
 *
 * @returns The newly generated key pair.
 */
export declare function userExportKeygen(): Promise<CryptoKeyPair>;
/**
 * Get the ArrayBuffer slice represented by a Buffer
 *
 * @param b The buffer to convert
 * @returns The resulting ArrayBuffer
 */
export declare function toArrayBuffer(b: Uint8Array): ArrayBuffer;
/**
 * Decrypt a user export.
 *
 * @param recipientKey The NIST P-256 secret key corresponding to the `publicKey` argument to the `userExportComplete` invocation that returned `response`.
 * @param response The response from a successful `userExportComplete` request.
 * @returns The decrypted key material.
 */
export declare function userExportDecrypt(recipientKey: CryptoKey, response: UserExportCompleteResponse): Promise<UserExportKeyMaterial>;
/**
 * Figure out how to load SubtleCrypto in the current environment.
 *
 * @returns A SubtleCrypto instance
 */
export declare function loadSubtleCrypto(): Promise<SubtleCrypto>;
/**
 * Figure out how to load Crypto in the current environment.
 *
 * @returns A Crypto instance
 */
export declare function loadCrypto(): Promise<Crypto>;
//# sourceMappingURL=user_export.d.ts.map