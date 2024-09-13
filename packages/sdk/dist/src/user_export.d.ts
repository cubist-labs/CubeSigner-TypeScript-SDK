import type { UserExportCompleteResponse, UserExportKeyMaterial } from "./schema_types";
import type { CipherSuite } from "@hpke/core";
/** Get the HPKE ciphersuite for user-export decryption.
 *
 * @return {any} The HPKE ciphersuite for user export.
 */
export declare function userExportCipherSuite(): Promise<CipherSuite>;
/**
 * Generate a key pair for user export.
 *
 * @return {Promise<CryptoKeyPair>} The newly generated key pair.
 */
export declare function userExportKeygen(): Promise<CryptoKeyPair>;
/**
 * Decrypt a user export.
 *
 * @param {CryptoKey} recipientKey The NIST P-256 secret key corresponding to the `publicKey` argument to the `userExportComplete` invocation that returned `response`.
 * @param {UserExportCompleteResponse} response The response from a successful `userExportComplete` request.
 * @return {Promise<UserExportKeyMaterial>} The decrypted key material.
 */
export declare function userExportDecrypt(recipientKey: CryptoKey, response: UserExportCompleteResponse): Promise<UserExportKeyMaterial>;
/**
 * Figure out how to load SubtleCrypto in the current environment.
 *
 * @return { Promise<SubtleCrypto> } A SubtleCrypto instance
 */
export declare function loadSubtleCrypto(): Promise<SubtleCrypto>;
/**
 * Figure out how to load Crypto in the current environment.
 *
 * @return { Promise<Crypto> } A Crypto instance
 */
export declare function loadCrypto(): Promise<Crypto>;
//# sourceMappingURL=user_export.d.ts.map