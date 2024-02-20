import { UserExportCompleteResponse, UserExportKeyMaterial } from "./schema_types";
import { decodeBase64 } from "./util";
import type { CipherSuite } from "@hpke/core";

/** Get the HPKE ciphersuite for user-export decryption.
 *
 * @return {any} The HPKE ciphersuite for user export.
 */
export async function userExportCipherSuite(): Promise<CipherSuite> {
  const hpke = await import("@hpke/core"); // eslint-disable-line @typescript-eslint/no-var-requires
  const suite = new hpke.CipherSuite({
    kem: new hpke.DhkemP256HkdfSha256(),
    kdf: new hpke.HkdfSha256(),
    aead: new hpke.Aes256Gcm(),
  });
  return suite;
}

/**
 * Generate a key pair for user export.
 *
 * @return {Promise<CryptoKeyPair>} The newly generated key pair.
 */
export async function userExportKeygen(): Promise<CryptoKeyPair> {
  return (await userExportCipherSuite()).kem.generateKeyPair();
}

/**
 * Get the ArrayBuffer slice represented by a Buffer
 *
 * @param {Uint8Array} b The buffer to convert
 * @return {ArrayBuffer} The resulting ArrayBuffer
 */
function toArrayBuffer(b: Uint8Array): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

/**
 * Decrypt a user export.
 *
 * @param {CryptoKey} recipientKey The NIST P-256 secret key corresponding to the `publicKey` argument to the `userExportComplete` invocation that returned `response`.
 * @param {UserExportCompleteResponse} response The response from a successful `userExportComplete` request.
 * @return {Promise<UserExportKeyMaterial>} The decrypted key material.
 */
export async function userExportDecrypt(
  recipientKey: CryptoKey,
  response: UserExportCompleteResponse,
): Promise<UserExportKeyMaterial> {
  // The ciphersuite we use for decryption
  const suite = await userExportCipherSuite();

  // decrypt the export ciphertext using the HPKE one-shot API
  const tenc = new TextEncoder();
  const tdec = new TextDecoder();
  const info = toArrayBuffer(tenc.encode(`cubist-signer::UserExportOwner::${response.user_id}`));
  const public_key = toArrayBuffer(decodeBase64(response.ephemeral_public_key));
  const ctxt = toArrayBuffer(decodeBase64(response.encrypted_key_material));
  const decrypted: UserExportKeyMaterial = JSON.parse(
    tdec.decode(
      await suite.open(
        {
          recipientKey,
          enc: public_key,
          info: info,
        },
        ctxt,
      ),
    ),
  );

  return decrypted;
}

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
export async function loadSubtleCrypto() {
  if (globalThis !== undefined && globalThis.crypto !== undefined) {
    // Browsers, Node.js >= v19, Cloudflare Workers, Bun, etc.
    return globalThis.crypto.subtle;
  }
  // Node.js <= v18
  try {
    const { webcrypto } = await import("crypto"); // node:crypto
    return (webcrypto as unknown as Crypto).subtle;
  } catch (e: unknown) {
    throw new Error("subtle crypto not supported");
  }
}
