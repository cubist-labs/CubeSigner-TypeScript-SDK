"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSubtleCrypto = exports.userExportDecrypt = exports.userExportKeygen = exports.userExportCipherSuite = void 0;
const util_1 = require("./util");
/** Get the HPKE ciphersuite for user-export decryption.
 *
 * @return {any} The HPKE ciphersuite for user export.
 */
async function userExportCipherSuite() {
    const hpke = await import("@hpke/core"); // eslint-disable-line @typescript-eslint/no-var-requires
    const suite = new hpke.CipherSuite({
        kem: new hpke.DhkemP256HkdfSha256(),
        kdf: new hpke.HkdfSha256(),
        aead: new hpke.Aes256Gcm(),
    });
    return suite;
}
exports.userExportCipherSuite = userExportCipherSuite;
/**
 * Generate a key pair for user export.
 *
 * @return {Promise<CryptoKeyPair>} The newly generated key pair.
 */
async function userExportKeygen() {
    return (await userExportCipherSuite()).kem.generateKeyPair();
}
exports.userExportKeygen = userExportKeygen;
/**
 * Get the ArrayBuffer slice represented by a Buffer
 *
 * @param {Uint8Array} b The buffer to convert
 * @return {ArrayBuffer} The resulting ArrayBuffer
 */
function toArrayBuffer(b) {
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}
/**
 * Decrypt a user export.
 *
 * @param {CryptoKey} recipientKey The NIST P-256 secret key corresponding to the `publicKey` argument to the `userExportComplete` invocation that returned `response`.
 * @param {UserExportCompleteResponse} response The response from a successful `userExportComplete` request.
 * @return {Promise<UserExportKeyMaterial>} The decrypted key material.
 */
async function userExportDecrypt(recipientKey, response) {
    // The ciphersuite we use for decryption
    const suite = await userExportCipherSuite();
    // decrypt the export ciphertext using the HPKE one-shot API
    const tenc = new TextEncoder();
    const tdec = new TextDecoder();
    const info = toArrayBuffer(tenc.encode(`cubist-signer::UserExportOwner::${response.user_id}`));
    const public_key = toArrayBuffer((0, util_1.decodeBase64)(response.ephemeral_public_key));
    const ctxt = toArrayBuffer((0, util_1.decodeBase64)(response.encrypted_key_material));
    const decrypted = JSON.parse(tdec.decode(await suite.open({
        recipientKey,
        enc: public_key,
        info: info,
    }, ctxt)));
    return decrypted;
}
exports.userExportDecrypt = userExportDecrypt;
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
async function loadSubtleCrypto() {
    if (globalThis !== undefined && globalThis.crypto !== undefined) {
        // Browsers, Node.js >= v19, Cloudflare Workers, Bun, etc.
        return globalThis.crypto.subtle;
    }
    // Node.js <= v18
    try {
        const { webcrypto } = await import("crypto"); // node:crypto
        return webcrypto.subtle;
    }
    catch (e) {
        throw new Error("subtle crypto not supported");
    }
}
exports.loadSubtleCrypto = loadSubtleCrypto;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcl9leHBvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXNlcl9leHBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsaUNBQXNDO0FBR3RDOzs7R0FHRztBQUNJLEtBQUssVUFBVSxxQkFBcUI7SUFDekMsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyx5REFBeUQ7SUFDbEcsTUFBTSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ2pDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtRQUNuQyxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1FBQzFCLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7S0FDM0IsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxLQUErQixDQUFDO0FBQ3pDLENBQUM7QUFSRCxzREFRQztBQUVEOzs7O0dBSUc7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCO0lBQ3BDLE9BQU8sQ0FBQyxNQUFNLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDL0QsQ0FBQztBQUZELDRDQUVDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLGFBQWEsQ0FBQyxDQUFhO0lBQ2xDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNuRSxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0ksS0FBSyxVQUFVLGlCQUFpQixDQUNyQyxZQUF1QixFQUN2QixRQUFvQztJQUVwQyx3Q0FBd0M7SUFDeEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxxQkFBcUIsRUFBRSxDQUFDO0lBRTVDLDREQUE0RDtJQUM1RCxNQUFNLElBQUksR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0lBQy9CLE1BQU0sSUFBSSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7SUFDL0IsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsbUNBQW1DLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0YsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUEsbUJBQVksRUFBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBQzlFLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFBLG1CQUFZLEVBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztJQUMxRSxNQUFNLFNBQVMsR0FBMEIsSUFBSSxDQUFDLEtBQUssQ0FDakQsSUFBSSxDQUFDLE1BQU0sQ0FDVCxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQ2Q7UUFDRSxZQUFZO1FBQ1osR0FBRyxFQUFFLFVBQVU7UUFDZixJQUFJLEVBQUUsSUFBSTtLQUNYLEVBQ0QsSUFBSSxDQUNMLENBQ0YsQ0FDRixDQUFDO0lBRUYsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQTNCRCw4Q0EyQkM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCO0lBQ3BDLElBQUksVUFBVSxLQUFLLFNBQVMsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUMvRCwwREFBMEQ7UUFDMUQsT0FBTyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztLQUNqQztJQUNELGlCQUFpQjtJQUNqQixJQUFJO1FBQ0YsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsY0FBYztRQUM1RCxPQUFRLFNBQStCLENBQUMsTUFBTSxDQUFDO0tBQ2hEO0lBQUMsT0FBTyxDQUFVLEVBQUU7UUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0tBQ2hEO0FBQ0gsQ0FBQztBQVpELDRDQVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZSwgVXNlckV4cG9ydEtleU1hdGVyaWFsIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBkZWNvZGVCYXNlNjQgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgdHlwZSB7IENpcGhlclN1aXRlIH0gZnJvbSBcIkBocGtlL2NvcmVcIjtcblxuLyoqIEdldCB0aGUgSFBLRSBjaXBoZXJzdWl0ZSBmb3IgdXNlci1leHBvcnQgZGVjcnlwdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHthbnl9IFRoZSBIUEtFIGNpcGhlcnN1aXRlIGZvciB1c2VyIGV4cG9ydC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVzZXJFeHBvcnRDaXBoZXJTdWl0ZSgpOiBQcm9taXNlPENpcGhlclN1aXRlPiB7XG4gIGNvbnN0IGhwa2UgPSBhd2FpdCBpbXBvcnQoXCJAaHBrZS9jb3JlXCIpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbiAgY29uc3Qgc3VpdGUgPSBuZXcgaHBrZS5DaXBoZXJTdWl0ZSh7XG4gICAga2VtOiBuZXcgaHBrZS5EaGtlbVAyNTZIa2RmU2hhMjU2KCksXG4gICAga2RmOiBuZXcgaHBrZS5Ia2RmU2hhMjU2KCksXG4gICAgYWVhZDogbmV3IGhwa2UuQWVzMjU2R2NtKCksXG4gIH0pO1xuICByZXR1cm4gc3VpdGUgYXMgdW5rbm93biBhcyBDaXBoZXJTdWl0ZTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIGtleSBwYWlyIGZvciB1c2VyIGV4cG9ydC5cbiAqXG4gKiBAcmV0dXJuIHtQcm9taXNlPENyeXB0b0tleVBhaXI+fSBUaGUgbmV3bHkgZ2VuZXJhdGVkIGtleSBwYWlyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXNlckV4cG9ydEtleWdlbigpOiBQcm9taXNlPENyeXB0b0tleVBhaXI+IHtcbiAgcmV0dXJuIChhd2FpdCB1c2VyRXhwb3J0Q2lwaGVyU3VpdGUoKSkua2VtLmdlbmVyYXRlS2V5UGFpcigpO1xufVxuXG4vKipcbiAqIEdldCB0aGUgQXJyYXlCdWZmZXIgc2xpY2UgcmVwcmVzZW50ZWQgYnkgYSBCdWZmZXJcbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGIgVGhlIGJ1ZmZlciB0byBjb252ZXJ0XG4gKiBAcmV0dXJuIHtBcnJheUJ1ZmZlcn0gVGhlIHJlc3VsdGluZyBBcnJheUJ1ZmZlclxuICovXG5mdW5jdGlvbiB0b0FycmF5QnVmZmVyKGI6IFVpbnQ4QXJyYXkpOiBBcnJheUJ1ZmZlciB7XG4gIHJldHVybiBiLmJ1ZmZlci5zbGljZShiLmJ5dGVPZmZzZXQsIGIuYnl0ZU9mZnNldCArIGIuYnl0ZUxlbmd0aCk7XG59XG5cbi8qKlxuICogRGVjcnlwdCBhIHVzZXIgZXhwb3J0LlxuICpcbiAqIEBwYXJhbSB7Q3J5cHRvS2V5fSByZWNpcGllbnRLZXkgVGhlIE5JU1QgUC0yNTYgc2VjcmV0IGtleSBjb3JyZXNwb25kaW5nIHRvIHRoZSBgcHVibGljS2V5YCBhcmd1bWVudCB0byB0aGUgYHVzZXJFeHBvcnRDb21wbGV0ZWAgaW52b2NhdGlvbiB0aGF0IHJldHVybmVkIGByZXNwb25zZWAuXG4gKiBAcGFyYW0ge1VzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlfSByZXNwb25zZSBUaGUgcmVzcG9uc2UgZnJvbSBhIHN1Y2Nlc3NmdWwgYHVzZXJFeHBvcnRDb21wbGV0ZWAgcmVxdWVzdC5cbiAqIEByZXR1cm4ge1Byb21pc2U8VXNlckV4cG9ydEtleU1hdGVyaWFsPn0gVGhlIGRlY3J5cHRlZCBrZXkgbWF0ZXJpYWwuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1c2VyRXhwb3J0RGVjcnlwdChcbiAgcmVjaXBpZW50S2V5OiBDcnlwdG9LZXksXG4gIHJlc3BvbnNlOiBVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZSxcbik6IFByb21pc2U8VXNlckV4cG9ydEtleU1hdGVyaWFsPiB7XG4gIC8vIFRoZSBjaXBoZXJzdWl0ZSB3ZSB1c2UgZm9yIGRlY3J5cHRpb25cbiAgY29uc3Qgc3VpdGUgPSBhd2FpdCB1c2VyRXhwb3J0Q2lwaGVyU3VpdGUoKTtcblxuICAvLyBkZWNyeXB0IHRoZSBleHBvcnQgY2lwaGVydGV4dCB1c2luZyB0aGUgSFBLRSBvbmUtc2hvdCBBUElcbiAgY29uc3QgdGVuYyA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICBjb25zdCB0ZGVjID0gbmV3IFRleHREZWNvZGVyKCk7XG4gIGNvbnN0IGluZm8gPSB0b0FycmF5QnVmZmVyKHRlbmMuZW5jb2RlKGBjdWJpc3Qtc2lnbmVyOjpVc2VyRXhwb3J0T3duZXI6OiR7cmVzcG9uc2UudXNlcl9pZH1gKSk7XG4gIGNvbnN0IHB1YmxpY19rZXkgPSB0b0FycmF5QnVmZmVyKGRlY29kZUJhc2U2NChyZXNwb25zZS5lcGhlbWVyYWxfcHVibGljX2tleSkpO1xuICBjb25zdCBjdHh0ID0gdG9BcnJheUJ1ZmZlcihkZWNvZGVCYXNlNjQocmVzcG9uc2UuZW5jcnlwdGVkX2tleV9tYXRlcmlhbCkpO1xuICBjb25zdCBkZWNyeXB0ZWQ6IFVzZXJFeHBvcnRLZXlNYXRlcmlhbCA9IEpTT04ucGFyc2UoXG4gICAgdGRlYy5kZWNvZGUoXG4gICAgICBhd2FpdCBzdWl0ZS5vcGVuKFxuICAgICAgICB7XG4gICAgICAgICAgcmVjaXBpZW50S2V5LFxuICAgICAgICAgIGVuYzogcHVibGljX2tleSxcbiAgICAgICAgICBpbmZvOiBpbmZvLFxuICAgICAgICB9LFxuICAgICAgICBjdHh0LFxuICAgICAgKSxcbiAgICApLFxuICApO1xuXG4gIHJldHVybiBkZWNyeXB0ZWQ7XG59XG5cbi8qKlxuICogRmlndXJlIG91dCBob3cgdG8gbG9hZCBTdWJ0bGVDcnlwdG8gaW4gdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbmFsaXR5IGlzIHJlcHJvZHVjZWQgZnJvbSB0aGUgaHBrZS1qcyBwYWNrYWdlLFxuICogICBodHRwczovL2dpdGh1Yi5jb20vZGFqaWFqaS9ocGtlLWpzL1xuICogd2hpY2ggaXMgQ29weXJpZ2h0IChDKSAyMDIyIEFqaXRvbWkgRGFpc3VrZSBhbmQgbGljZW5zZWRcbiAqIHVuZGVyIHRoZSBNSVQgTGljZW5zZSwgd2hpY2ggZm9sbG93czpcbiAqXG4gKiBNSVQgTGljZW5zZVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAyMiBBaml0b21pIERhaXN1a2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFN1YnRsZUNyeXB0bygpIHtcbiAgaWYgKGdsb2JhbFRoaXMgIT09IHVuZGVmaW5lZCAmJiBnbG9iYWxUaGlzLmNyeXB0byAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gQnJvd3NlcnMsIE5vZGUuanMgPj0gdjE5LCBDbG91ZGZsYXJlIFdvcmtlcnMsIEJ1biwgZXRjLlxuICAgIHJldHVybiBnbG9iYWxUaGlzLmNyeXB0by5zdWJ0bGU7XG4gIH1cbiAgLy8gTm9kZS5qcyA8PSB2MThcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHdlYmNyeXB0byB9ID0gYXdhaXQgaW1wb3J0KFwiY3J5cHRvXCIpOyAvLyBub2RlOmNyeXB0b1xuICAgIHJldHVybiAod2ViY3J5cHRvIGFzIHVua25vd24gYXMgQ3J5cHRvKS5zdWJ0bGU7XG4gIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJzdWJ0bGUgY3J5cHRvIG5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbn1cbiJdfQ==