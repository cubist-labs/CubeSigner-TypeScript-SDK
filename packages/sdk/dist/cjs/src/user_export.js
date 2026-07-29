"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSubtleCrypto = exports.userExportDecrypt = exports.userExportKeygen = exports.userExportCipherSuite = void 0;
const util_1 = require("./util");
/** Get the HPKE ciphersuite for user-export decryption.
 *
 * @return {any} The HPKE ciphersuite for user export.
 */
async function userExportCipherSuite() {
    const hpke = await Promise.resolve().then(() => __importStar(require("@hpke/core"))); // eslint-disable-line @typescript-eslint/no-var-requires
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
        const { webcrypto } = await Promise.resolve().then(() => __importStar(require("crypto"))); // node:crypto
        return webcrypto.subtle;
    }
    catch (e) {
        throw new Error("subtle crypto not supported");
    }
}
exports.loadSubtleCrypto = loadSubtleCrypto;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcl9leHBvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXNlcl9leHBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxpQ0FBc0M7QUFHdEM7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLHFCQUFxQjtJQUN6QyxNQUFNLElBQUksR0FBRyx3REFBYSxZQUFZLEdBQUMsQ0FBQyxDQUFDLHlEQUF5RDtJQUNsRyxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDakMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO1FBQ25DLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDMUIsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtLQUMzQixDQUFDLENBQUM7SUFDSCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFSRCxzREFRQztBQUVEOzs7O0dBSUc7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCO0lBQ3BDLE9BQU8sQ0FBQyxNQUFNLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDL0QsQ0FBQztBQUZELDRDQUVDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLGFBQWEsQ0FBQyxDQUFhO0lBQ2xDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNuRSxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0ksS0FBSyxVQUFVLGlCQUFpQixDQUNyQyxZQUF1QixFQUN2QixRQUFvQztJQUVwQyx3Q0FBd0M7SUFDeEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxxQkFBcUIsRUFBRSxDQUFDO0lBRTVDLDREQUE0RDtJQUM1RCxNQUFNLElBQUksR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0lBQy9CLE1BQU0sSUFBSSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7SUFDL0IsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsbUNBQW1DLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0YsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUEsbUJBQVksRUFBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBQzlFLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFBLG1CQUFZLEVBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztJQUMxRSxNQUFNLFNBQVMsR0FBMEIsSUFBSSxDQUFDLEtBQUssQ0FDakQsSUFBSSxDQUFDLE1BQU0sQ0FDVCxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQ2Q7UUFDRSxZQUFZO1FBQ1osR0FBRyxFQUFFLFVBQVU7UUFDZixJQUFJLEVBQUUsSUFBSTtLQUNYLEVBQ0QsSUFBSSxDQUNMLENBQ0YsQ0FDRixDQUFDO0lBRUYsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQTNCRCw4Q0EyQkM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCO0lBQ3BDLElBQUksVUFBVSxLQUFLLFNBQVMsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ2hFLDBEQUEwRDtRQUMxRCxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xDLENBQUM7SUFDRCxpQkFBaUI7SUFDakIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLHdEQUFhLFFBQVEsR0FBQyxDQUFDLENBQUMsY0FBYztRQUM1RCxPQUFRLFNBQStCLENBQUMsTUFBTSxDQUFDO0lBQ2pELENBQUM7SUFBQyxPQUFPLENBQVUsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUNqRCxDQUFDO0FBQ0gsQ0FBQztBQVpELDRDQVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZSwgVXNlckV4cG9ydEtleU1hdGVyaWFsIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBkZWNvZGVCYXNlNjQgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgdHlwZSB7IENpcGhlclN1aXRlIH0gZnJvbSBcIkBocGtlL2NvcmVcIjtcblxuLyoqIEdldCB0aGUgSFBLRSBjaXBoZXJzdWl0ZSBmb3IgdXNlci1leHBvcnQgZGVjcnlwdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHthbnl9IFRoZSBIUEtFIGNpcGhlcnN1aXRlIGZvciB1c2VyIGV4cG9ydC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVzZXJFeHBvcnRDaXBoZXJTdWl0ZSgpOiBQcm9taXNlPENpcGhlclN1aXRlPiB7XG4gIGNvbnN0IGhwa2UgPSBhd2FpdCBpbXBvcnQoXCJAaHBrZS9jb3JlXCIpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbiAgY29uc3Qgc3VpdGUgPSBuZXcgaHBrZS5DaXBoZXJTdWl0ZSh7XG4gICAga2VtOiBuZXcgaHBrZS5EaGtlbVAyNTZIa2RmU2hhMjU2KCksXG4gICAga2RmOiBuZXcgaHBrZS5Ia2RmU2hhMjU2KCksXG4gICAgYWVhZDogbmV3IGhwa2UuQWVzMjU2R2NtKCksXG4gIH0pO1xuICByZXR1cm4gc3VpdGU7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBrZXkgcGFpciBmb3IgdXNlciBleHBvcnQuXG4gKlxuICogQHJldHVybiB7UHJvbWlzZTxDcnlwdG9LZXlQYWlyPn0gVGhlIG5ld2x5IGdlbmVyYXRlZCBrZXkgcGFpci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVzZXJFeHBvcnRLZXlnZW4oKTogUHJvbWlzZTxDcnlwdG9LZXlQYWlyPiB7XG4gIHJldHVybiAoYXdhaXQgdXNlckV4cG9ydENpcGhlclN1aXRlKCkpLmtlbS5nZW5lcmF0ZUtleVBhaXIoKTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIEFycmF5QnVmZmVyIHNsaWNlIHJlcHJlc2VudGVkIGJ5IGEgQnVmZmVyXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBiIFRoZSBidWZmZXIgdG8gY29udmVydFxuICogQHJldHVybiB7QXJyYXlCdWZmZXJ9IFRoZSByZXN1bHRpbmcgQXJyYXlCdWZmZXJcbiAqL1xuZnVuY3Rpb24gdG9BcnJheUJ1ZmZlcihiOiBVaW50OEFycmF5KTogQXJyYXlCdWZmZXIge1xuICByZXR1cm4gYi5idWZmZXIuc2xpY2UoYi5ieXRlT2Zmc2V0LCBiLmJ5dGVPZmZzZXQgKyBiLmJ5dGVMZW5ndGgpO1xufVxuXG4vKipcbiAqIERlY3J5cHQgYSB1c2VyIGV4cG9ydC5cbiAqXG4gKiBAcGFyYW0ge0NyeXB0b0tleX0gcmVjaXBpZW50S2V5IFRoZSBOSVNUIFAtMjU2IHNlY3JldCBrZXkgY29ycmVzcG9uZGluZyB0byB0aGUgYHB1YmxpY0tleWAgYXJndW1lbnQgdG8gdGhlIGB1c2VyRXhwb3J0Q29tcGxldGVgIGludm9jYXRpb24gdGhhdCByZXR1cm5lZCBgcmVzcG9uc2VgLlxuICogQHBhcmFtIHtVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZX0gcmVzcG9uc2UgVGhlIHJlc3BvbnNlIGZyb20gYSBzdWNjZXNzZnVsIGB1c2VyRXhwb3J0Q29tcGxldGVgIHJlcXVlc3QuXG4gKiBAcmV0dXJuIHtQcm9taXNlPFVzZXJFeHBvcnRLZXlNYXRlcmlhbD59IFRoZSBkZWNyeXB0ZWQga2V5IG1hdGVyaWFsLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXNlckV4cG9ydERlY3J5cHQoXG4gIHJlY2lwaWVudEtleTogQ3J5cHRvS2V5LFxuICByZXNwb25zZTogVXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2UsXG4pOiBQcm9taXNlPFVzZXJFeHBvcnRLZXlNYXRlcmlhbD4ge1xuICAvLyBUaGUgY2lwaGVyc3VpdGUgd2UgdXNlIGZvciBkZWNyeXB0aW9uXG4gIGNvbnN0IHN1aXRlID0gYXdhaXQgdXNlckV4cG9ydENpcGhlclN1aXRlKCk7XG5cbiAgLy8gZGVjcnlwdCB0aGUgZXhwb3J0IGNpcGhlcnRleHQgdXNpbmcgdGhlIEhQS0Ugb25lLXNob3QgQVBJXG4gIGNvbnN0IHRlbmMgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgY29uc3QgdGRlYyA9IG5ldyBUZXh0RGVjb2RlcigpO1xuICBjb25zdCBpbmZvID0gdG9BcnJheUJ1ZmZlcih0ZW5jLmVuY29kZShgY3ViaXN0LXNpZ25lcjo6VXNlckV4cG9ydE93bmVyOjoke3Jlc3BvbnNlLnVzZXJfaWR9YCkpO1xuICBjb25zdCBwdWJsaWNfa2V5ID0gdG9BcnJheUJ1ZmZlcihkZWNvZGVCYXNlNjQocmVzcG9uc2UuZXBoZW1lcmFsX3B1YmxpY19rZXkpKTtcbiAgY29uc3QgY3R4dCA9IHRvQXJyYXlCdWZmZXIoZGVjb2RlQmFzZTY0KHJlc3BvbnNlLmVuY3J5cHRlZF9rZXlfbWF0ZXJpYWwpKTtcbiAgY29uc3QgZGVjcnlwdGVkOiBVc2VyRXhwb3J0S2V5TWF0ZXJpYWwgPSBKU09OLnBhcnNlKFxuICAgIHRkZWMuZGVjb2RlKFxuICAgICAgYXdhaXQgc3VpdGUub3BlbihcbiAgICAgICAge1xuICAgICAgICAgIHJlY2lwaWVudEtleSxcbiAgICAgICAgICBlbmM6IHB1YmxpY19rZXksXG4gICAgICAgICAgaW5mbzogaW5mbyxcbiAgICAgICAgfSxcbiAgICAgICAgY3R4dCxcbiAgICAgICksXG4gICAgKSxcbiAgKTtcblxuICByZXR1cm4gZGVjcnlwdGVkO1xufVxuXG4vKipcbiAqIEZpZ3VyZSBvdXQgaG93IHRvIGxvYWQgU3VidGxlQ3J5cHRvIGluIHRoZSBjdXJyZW50IGVudmlyb25tZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyByZXByb2R1Y2VkIGZyb20gdGhlIGhwa2UtanMgcGFja2FnZSxcbiAqICAgaHR0cHM6Ly9naXRodWIuY29tL2RhamlhamkvaHBrZS1qcy9cbiAqIHdoaWNoIGlzIENvcHlyaWdodCAoQykgMjAyMiBBaml0b21pIERhaXN1a2UgYW5kIGxpY2Vuc2VkXG4gKiB1bmRlciB0aGUgTUlUIExpY2Vuc2UsIHdoaWNoIGZvbGxvd3M6XG4gKlxuICogTUlUIExpY2Vuc2VcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjIgQWppdG9taSBEYWlzdWtlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRTdWJ0bGVDcnlwdG8oKSB7XG4gIGlmIChnbG9iYWxUaGlzICE9PSB1bmRlZmluZWQgJiYgZ2xvYmFsVGhpcy5jcnlwdG8gIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIEJyb3dzZXJzLCBOb2RlLmpzID49IHYxOSwgQ2xvdWRmbGFyZSBXb3JrZXJzLCBCdW4sIGV0Yy5cbiAgICByZXR1cm4gZ2xvYmFsVGhpcy5jcnlwdG8uc3VidGxlO1xuICB9XG4gIC8vIE5vZGUuanMgPD0gdjE4XG4gIHRyeSB7XG4gICAgY29uc3QgeyB3ZWJjcnlwdG8gfSA9IGF3YWl0IGltcG9ydChcImNyeXB0b1wiKTsgLy8gbm9kZTpjcnlwdG9cbiAgICByZXR1cm4gKHdlYmNyeXB0byBhcyB1bmtub3duIGFzIENyeXB0bykuc3VidGxlO1xuICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwic3VidGxlIGNyeXB0byBub3Qgc3VwcG9ydGVkXCIpO1xuICB9XG59XG4iXX0=