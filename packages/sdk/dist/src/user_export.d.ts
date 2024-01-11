import { UserExportCompleteResponse, UserExportKeyMaterial } from "./schema_types";
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
 * This functionality is reproduced from the hpke-js package,
 *   https://github.com/dajiaji/hpke-js/
 * which is Copyright (C) 2022 Ajitomi Daisuke and licensed
 * under the MIT License, which follows:
 *
 * MIT License
 *
 * Copyright (c) 2022 Ajitomi Daisuke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export declare function loadSubtleCrypto(): Promise<SubtleCrypto>;
