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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcl9leHBvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXNlcl9leHBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxpQ0FBc0M7QUFHdEM7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLHFCQUFxQjtJQUN6QyxNQUFNLElBQUksR0FBRyx3REFBYSxZQUFZLEdBQUMsQ0FBQyxDQUFDLHlEQUF5RDtJQUNsRyxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDakMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO1FBQ25DLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDMUIsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtLQUMzQixDQUFDLENBQUM7SUFDSCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFSRCxzREFRQztBQUVEOzs7O0dBSUc7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCO0lBQ3BDLE9BQU8sQ0FBQyxNQUFNLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDL0QsQ0FBQztBQUZELDRDQUVDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLGFBQWEsQ0FBQyxDQUFhO0lBQ2xDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNuRSxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0ksS0FBSyxVQUFVLGlCQUFpQixDQUNyQyxZQUF1QixFQUN2QixRQUFvQztJQUVwQyx3Q0FBd0M7SUFDeEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxxQkFBcUIsRUFBRSxDQUFDO0lBRTVDLDREQUE0RDtJQUM1RCxNQUFNLElBQUksR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0lBQy9CLE1BQU0sSUFBSSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7SUFDL0IsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsbUNBQW1DLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0YsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUEsbUJBQVksRUFBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBQzlFLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFBLG1CQUFZLEVBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztJQUMxRSxNQUFNLFNBQVMsR0FBMEIsSUFBSSxDQUFDLEtBQUssQ0FDakQsSUFBSSxDQUFDLE1BQU0sQ0FDVCxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQ2Q7UUFDRSxZQUFZO1FBQ1osR0FBRyxFQUFFLFVBQVU7UUFDZixJQUFJLEVBQUUsSUFBSTtLQUNYLEVBQ0QsSUFBSSxDQUNMLENBQ0YsQ0FDRixDQUFDO0lBRUYsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQTNCRCw4Q0EyQkM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCO0lBQ3BDLElBQUksVUFBVSxLQUFLLFNBQVMsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ2hFLDBEQUEwRDtRQUMxRCxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xDLENBQUM7SUFDRCxpQkFBaUI7SUFDakIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLHdEQUFhLFFBQVEsR0FBQyxDQUFDLENBQUMsY0FBYztRQUM1RCxPQUFRLFNBQStCLENBQUMsTUFBTSxDQUFDO0lBQ2pELENBQUM7SUFBQyxPQUFPLENBQVUsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUNqRCxDQUFDO0FBQ0gsQ0FBQztBQVpELDRDQVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2UsIFVzZXJFeHBvcnRLZXlNYXRlcmlhbCB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgZGVjb2RlQmFzZTY0IH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHR5cGUgeyBDaXBoZXJTdWl0ZSB9IGZyb20gXCJAaHBrZS9jb3JlXCI7XG5cbi8qKiBHZXQgdGhlIEhQS0UgY2lwaGVyc3VpdGUgZm9yIHVzZXItZXhwb3J0IGRlY3J5cHRpb24uXG4gKlxuICogQHJldHVybiB7YW55fSBUaGUgSFBLRSBjaXBoZXJzdWl0ZSBmb3IgdXNlciBleHBvcnQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1c2VyRXhwb3J0Q2lwaGVyU3VpdGUoKTogUHJvbWlzZTxDaXBoZXJTdWl0ZT4ge1xuICBjb25zdCBocGtlID0gYXdhaXQgaW1wb3J0KFwiQGhwa2UvY29yZVwiKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdmFyLXJlcXVpcmVzXG4gIGNvbnN0IHN1aXRlID0gbmV3IGhwa2UuQ2lwaGVyU3VpdGUoe1xuICAgIGtlbTogbmV3IGhwa2UuRGhrZW1QMjU2SGtkZlNoYTI1NigpLFxuICAgIGtkZjogbmV3IGhwa2UuSGtkZlNoYTI1NigpLFxuICAgIGFlYWQ6IG5ldyBocGtlLkFlczI1NkdjbSgpLFxuICB9KTtcbiAgcmV0dXJuIHN1aXRlO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEga2V5IHBhaXIgZm9yIHVzZXIgZXhwb3J0LlxuICpcbiAqIEByZXR1cm4ge1Byb21pc2U8Q3J5cHRvS2V5UGFpcj59IFRoZSBuZXdseSBnZW5lcmF0ZWQga2V5IHBhaXIuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1c2VyRXhwb3J0S2V5Z2VuKCk6IFByb21pc2U8Q3J5cHRvS2V5UGFpcj4ge1xuICByZXR1cm4gKGF3YWl0IHVzZXJFeHBvcnRDaXBoZXJTdWl0ZSgpKS5rZW0uZ2VuZXJhdGVLZXlQYWlyKCk7XG59XG5cbi8qKlxuICogR2V0IHRoZSBBcnJheUJ1ZmZlciBzbGljZSByZXByZXNlbnRlZCBieSBhIEJ1ZmZlclxuICpcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYiBUaGUgYnVmZmVyIHRvIGNvbnZlcnRcbiAqIEByZXR1cm4ge0FycmF5QnVmZmVyfSBUaGUgcmVzdWx0aW5nIEFycmF5QnVmZmVyXG4gKi9cbmZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIoYjogVWludDhBcnJheSk6IEFycmF5QnVmZmVyIHtcbiAgcmV0dXJuIGIuYnVmZmVyLnNsaWNlKGIuYnl0ZU9mZnNldCwgYi5ieXRlT2Zmc2V0ICsgYi5ieXRlTGVuZ3RoKTtcbn1cblxuLyoqXG4gKiBEZWNyeXB0IGEgdXNlciBleHBvcnQuXG4gKlxuICogQHBhcmFtIHtDcnlwdG9LZXl9IHJlY2lwaWVudEtleSBUaGUgTklTVCBQLTI1NiBzZWNyZXQga2V5IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGBwdWJsaWNLZXlgIGFyZ3VtZW50IHRvIHRoZSBgdXNlckV4cG9ydENvbXBsZXRlYCBpbnZvY2F0aW9uIHRoYXQgcmV0dXJuZWQgYHJlc3BvbnNlYC5cbiAqIEBwYXJhbSB7VXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2V9IHJlc3BvbnNlIFRoZSByZXNwb25zZSBmcm9tIGEgc3VjY2Vzc2Z1bCBgdXNlckV4cG9ydENvbXBsZXRlYCByZXF1ZXN0LlxuICogQHJldHVybiB7UHJvbWlzZTxVc2VyRXhwb3J0S2V5TWF0ZXJpYWw+fSBUaGUgZGVjcnlwdGVkIGtleSBtYXRlcmlhbC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVzZXJFeHBvcnREZWNyeXB0KFxuICByZWNpcGllbnRLZXk6IENyeXB0b0tleSxcbiAgcmVzcG9uc2U6IFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlLFxuKTogUHJvbWlzZTxVc2VyRXhwb3J0S2V5TWF0ZXJpYWw+IHtcbiAgLy8gVGhlIGNpcGhlcnN1aXRlIHdlIHVzZSBmb3IgZGVjcnlwdGlvblxuICBjb25zdCBzdWl0ZSA9IGF3YWl0IHVzZXJFeHBvcnRDaXBoZXJTdWl0ZSgpO1xuXG4gIC8vIGRlY3J5cHQgdGhlIGV4cG9ydCBjaXBoZXJ0ZXh0IHVzaW5nIHRoZSBIUEtFIG9uZS1zaG90IEFQSVxuICBjb25zdCB0ZW5jID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gIGNvbnN0IHRkZWMgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgY29uc3QgaW5mbyA9IHRvQXJyYXlCdWZmZXIodGVuYy5lbmNvZGUoYGN1YmlzdC1zaWduZXI6OlVzZXJFeHBvcnRPd25lcjo6JHtyZXNwb25zZS51c2VyX2lkfWApKTtcbiAgY29uc3QgcHVibGljX2tleSA9IHRvQXJyYXlCdWZmZXIoZGVjb2RlQmFzZTY0KHJlc3BvbnNlLmVwaGVtZXJhbF9wdWJsaWNfa2V5KSk7XG4gIGNvbnN0IGN0eHQgPSB0b0FycmF5QnVmZmVyKGRlY29kZUJhc2U2NChyZXNwb25zZS5lbmNyeXB0ZWRfa2V5X21hdGVyaWFsKSk7XG4gIGNvbnN0IGRlY3J5cHRlZDogVXNlckV4cG9ydEtleU1hdGVyaWFsID0gSlNPTi5wYXJzZShcbiAgICB0ZGVjLmRlY29kZShcbiAgICAgIGF3YWl0IHN1aXRlLm9wZW4oXG4gICAgICAgIHtcbiAgICAgICAgICByZWNpcGllbnRLZXksXG4gICAgICAgICAgZW5jOiBwdWJsaWNfa2V5LFxuICAgICAgICAgIGluZm86IGluZm8sXG4gICAgICAgIH0sXG4gICAgICAgIGN0eHQsXG4gICAgICApLFxuICAgICksXG4gICk7XG5cbiAgcmV0dXJuIGRlY3J5cHRlZDtcbn1cblxuLyoqXG4gKiBGaWd1cmUgb3V0IGhvdyB0byBsb2FkIFN1YnRsZUNyeXB0byBpbiB0aGUgY3VycmVudCBlbnZpcm9ubWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uYWxpdHkgaXMgcmVwcm9kdWNlZCBmcm9tIHRoZSBocGtlLWpzIHBhY2thZ2UsXG4gKiAgIGh0dHBzOi8vZ2l0aHViLmNvbS9kYWppYWppL2hwa2UtanMvXG4gKiB3aGljaCBpcyBDb3B5cmlnaHQgKEMpIDIwMjIgQWppdG9taSBEYWlzdWtlIGFuZCBsaWNlbnNlZFxuICogdW5kZXIgdGhlIE1JVCBMaWNlbnNlLCB3aGljaCBmb2xsb3dzOlxuICpcbiAqIE1JVCBMaWNlbnNlXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDIyIEFqaXRvbWkgRGFpc3VrZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkU3VidGxlQ3J5cHRvKCkge1xuICBpZiAoZ2xvYmFsVGhpcyAhPT0gdW5kZWZpbmVkICYmIGdsb2JhbFRoaXMuY3J5cHRvICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBCcm93c2VycywgTm9kZS5qcyA+PSB2MTksIENsb3VkZmxhcmUgV29ya2VycywgQnVuLCBldGMuXG4gICAgcmV0dXJuIGdsb2JhbFRoaXMuY3J5cHRvLnN1YnRsZTtcbiAgfVxuICAvLyBOb2RlLmpzIDw9IHYxOFxuICB0cnkge1xuICAgIGNvbnN0IHsgd2ViY3J5cHRvIH0gPSBhd2FpdCBpbXBvcnQoXCJjcnlwdG9cIik7IC8vIG5vZGU6Y3J5cHRvXG4gICAgcmV0dXJuICh3ZWJjcnlwdG8gYXMgdW5rbm93biBhcyBDcnlwdG8pLnN1YnRsZTtcbiAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgIHRocm93IG5ldyBFcnJvcihcInN1YnRsZSBjcnlwdG8gbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxufVxuIl19