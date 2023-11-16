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
exports.encodeToBase64Url = exports.decodeBase64Url = exports.assertOk = exports.ErrResponse = exports.configDir = void 0;
const path = __importStar(require("path"));
/**
 * Directory where CubeSigner stores config files.
 * @return {string} Config dir
 */
function configDir() {
    const configDir = process.platform === "darwin"
        ? `${process.env.HOME}/Library/Application Support`
        : `${process.env.HOME}/.config`;
    return path.join(configDir, "cubesigner");
}
exports.configDir = configDir;
/**
 * Error response type, thrown on non-successful responses.
 */
class ErrResponse extends Error {
    /**
     * Constructor
     * @param {Partial<ErrResponse>} init Initializer
     */
    constructor(init) {
        super(init.message);
        Object.assign(this, init);
    }
}
exports.ErrResponse = ErrResponse;
/**
 * Throw if on error response. Otherwise, return the response data.
 * @param {ResponseType} resp The response to check
 * @param {string} description Description to include in the thrown error
 * @return {D} The response data.
 * @internal
 */
function assertOk(resp, description) {
    if (resp.error) {
        throw new ErrResponse({
            description,
            message: resp.error.message,
            statusText: resp.response?.statusText,
            status: resp.response?.status,
        });
    }
    if (resp.data === undefined) {
        throw new Error("Response data is undefined");
    }
    return resp.data;
}
exports.assertOk = assertOk;
/**
 * Browser-friendly helper for decoding a 'base64url'-encoded string into a byte array.
 *
 * @param {string} b64url The 'base64url'-encoded string to decode
 * @return {Uint8Array} Decoded byte array
 */
function decodeBase64Url(b64url) {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").replace(/=*$/g, "");
    // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
    return typeof Buffer === "function"
        ? Buffer.from(b64, "base64")
        : Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
exports.decodeBase64Url = decodeBase64Url;
/**
 * Browser-friendly helper for encoding a byte array into a 'base64url`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64url' encoding of the byte array.
 */
function encodeToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
    const b64 = typeof Buffer === "function"
        ? Buffer.from(bytes).toString("base64")
        : btoa(bytes.reduce((s, b) => s + String.fromCharCode(b), ""));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");
}
exports.encodeToBase64Url = encodeToBase64Url;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBVTdCOzs7R0FHRztBQUNILFNBQWdCLFNBQVM7SUFDdkIsTUFBTSxTQUFTLEdBQ2IsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRO1FBQzNCLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSw4QkFBOEI7UUFDbkQsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFVBQVUsQ0FBQztJQUNwQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFORCw4QkFNQztBQUlEOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsS0FBSztJQVFwQzs7O09BR0c7SUFDSCxZQUFZLElBQTBCO1FBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBaEJELGtDQWdCQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLFFBQVEsQ0FBTyxJQUF3QixFQUFFLFdBQW9CO0lBQzNFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNkLE1BQU0sSUFBSSxXQUFXLENBQUM7WUFDcEIsV0FBVztZQUNYLE9BQU8sRUFBRyxJQUFJLENBQUMsS0FBYSxDQUFDLE9BQU87WUFDcEMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVTtZQUNyQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNO1NBQzlCLENBQUMsQ0FBQztLQUNKO0lBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtRQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDbkIsQ0FBQztBQWJELDRCQWFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixlQUFlLENBQUMsTUFBYztJQUM1QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFN0Usb0dBQW9HO0lBQ3BHLE9BQU8sT0FBTyxNQUFNLEtBQUssVUFBVTtRQUNqQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFQRCwwQ0FPQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsTUFBd0I7SUFDeEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFckMsb0dBQW9HO0lBQ3BHLE1BQU0sR0FBRyxHQUNQLE9BQU8sTUFBTSxLQUFLLFVBQVU7UUFDMUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRW5FLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3pFLENBQUM7QUFWRCw4Q0FVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuLyoqIEpTT04gbWFwIHR5cGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgSnNvbk1hcCB7XG4gIFttZW1iZXI6IHN0cmluZ106IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgSnNvbkFycmF5IHwgSnNvbk1hcDtcbn1cblxuLyoqIEpTT04gYXJyYXkgdHlwZSAqL1xuZXhwb3J0IHR5cGUgSnNvbkFycmF5ID0gQXJyYXk8c3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCBKc29uQXJyYXkgfCBKc29uTWFwPjtcblxuLyoqXG4gKiBEaXJlY3Rvcnkgd2hlcmUgQ3ViZVNpZ25lciBzdG9yZXMgY29uZmlnIGZpbGVzLlxuICogQHJldHVybiB7c3RyaW5nfSBDb25maWcgZGlyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25maWdEaXIoKTogc3RyaW5nIHtcbiAgY29uc3QgY29uZmlnRGlyID1cbiAgICBwcm9jZXNzLnBsYXRmb3JtID09PSBcImRhcndpblwiXG4gICAgICA/IGAke3Byb2Nlc3MuZW52LkhPTUV9L0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydGBcbiAgICAgIDogYCR7cHJvY2Vzcy5lbnYuSE9NRX0vLmNvbmZpZ2A7XG4gIHJldHVybiBwYXRoLmpvaW4oY29uZmlnRGlyLCBcImN1YmVzaWduZXJcIik7XG59XG5cbnR5cGUgUmVzcG9uc2VUeXBlPEQsIFQ+ID0geyBkYXRhPzogRDsgZXJyb3I/OiBUOyByZXNwb25zZT86IFJlc3BvbnNlIH07XG5cbi8qKlxuICogRXJyb3IgcmVzcG9uc2UgdHlwZSwgdGhyb3duIG9uIG5vbi1zdWNjZXNzZnVsIHJlc3BvbnNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEVyclJlc3BvbnNlIGV4dGVuZHMgRXJyb3Ige1xuICAvKiogRGVzY3JpcHRpb24gKi9cbiAgcmVhZG9ubHkgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlIHRleHQgKGRlcml2ZWQgZnJvbSBgdGhpcy5zdGF0dXNgKSAqL1xuICByZWFkb25seSBzdGF0dXNUZXh0Pzogc3RyaW5nO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSAqL1xuICByZWFkb25seSBzdGF0dXM/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7UGFydGlhbDxFcnJSZXNwb25zZT59IGluaXQgSW5pdGlhbGl6ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKGluaXQ6IFBhcnRpYWw8RXJyUmVzcG9uc2U+KSB7XG4gICAgc3VwZXIoaW5pdC5tZXNzYWdlKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluaXQpO1xuICB9XG59XG5cbi8qKlxuICogVGhyb3cgaWYgb24gZXJyb3IgcmVzcG9uc2UuIE90aGVyd2lzZSwgcmV0dXJuIHRoZSByZXNwb25zZSBkYXRhLlxuICogQHBhcmFtIHtSZXNwb25zZVR5cGV9IHJlc3AgVGhlIHJlc3BvbnNlIHRvIGNoZWNrXG4gKiBAcGFyYW0ge3N0cmluZ30gZGVzY3JpcHRpb24gRGVzY3JpcHRpb24gdG8gaW5jbHVkZSBpbiB0aGUgdGhyb3duIGVycm9yXG4gKiBAcmV0dXJuIHtEfSBUaGUgcmVzcG9uc2UgZGF0YS5cbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0T2s8RCwgVD4ocmVzcDogUmVzcG9uc2VUeXBlPEQsIFQ+LCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IEQge1xuICBpZiAocmVzcC5lcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJSZXNwb25zZSh7XG4gICAgICBkZXNjcmlwdGlvbixcbiAgICAgIG1lc3NhZ2U6IChyZXNwLmVycm9yIGFzIGFueSkubWVzc2FnZSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICBzdGF0dXNUZXh0OiByZXNwLnJlc3BvbnNlPy5zdGF0dXNUZXh0LFxuICAgICAgc3RhdHVzOiByZXNwLnJlc3BvbnNlPy5zdGF0dXMsXG4gICAgfSk7XG4gIH1cbiAgaWYgKHJlc3AuZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUmVzcG9uc2UgZGF0YSBpcyB1bmRlZmluZWRcIik7XG4gIH1cbiAgcmV0dXJuIHJlc3AuZGF0YTtcbn1cblxuLyoqXG4gKiBCcm93c2VyLWZyaWVuZGx5IGhlbHBlciBmb3IgZGVjb2RpbmcgYSAnYmFzZTY0dXJsJy1lbmNvZGVkIHN0cmluZyBpbnRvIGEgYnl0ZSBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYjY0dXJsIFRoZSAnYmFzZTY0dXJsJy1lbmNvZGVkIHN0cmluZyB0byBkZWNvZGVcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IERlY29kZWQgYnl0ZSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlQmFzZTY0VXJsKGI2NHVybDogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGI2NCA9IGI2NHVybC5yZXBsYWNlKC8tL2csIFwiK1wiKS5yZXBsYWNlKC9fL2csIFwiL1wiKS5yZXBsYWNlKC89KiQvZywgXCJcIik7XG5cbiAgLy8gTk9URTogdGhlcmUgaXMgbm8gXCJiYXNlNjR1cmxcIiBlbmNvZGluZyBpbiB0aGUgXCJidWZmZXJcIiBtb2R1bGUgZm9yIHRoZSBicm93c2VyICh1bmxpa2UgaW4gbm9kZS5qcylcbiAgcmV0dXJuIHR5cGVvZiBCdWZmZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gQnVmZmVyLmZyb20oYjY0LCBcImJhc2U2NFwiKVxuICAgIDogVWludDhBcnJheS5mcm9tKGF0b2IoYjY0KSwgKGMpID0+IGMuY2hhckNvZGVBdCgwKSk7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGVuY29kaW5nIGEgYnl0ZSBhcnJheSBpbnRvIGEgJ2Jhc2U2NHVybGAtZW5jb2RlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtJdGVyYWJsZTxudW1iZXI+fSBidWZmZXIgVGhlIGJ5dGUgYXJyYXkgdG8gZW5jb2RlXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSAnYmFzZTY0dXJsJyBlbmNvZGluZyBvZiB0aGUgYnl0ZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVRvQmFzZTY0VXJsKGJ1ZmZlcjogSXRlcmFibGU8bnVtYmVyPik6IHN0cmluZyB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcblxuICAvLyBOT1RFOiB0aGVyZSBpcyBubyBcImJhc2U2NHVybFwiIGVuY29kaW5nIGluIHRoZSBcImJ1ZmZlclwiIG1vZHVsZSBmb3IgdGhlIGJyb3dzZXIgKHVubGlrZSBpbiBub2RlLmpzKVxuICBjb25zdCBiNjQgPVxuICAgIHR5cGVvZiBCdWZmZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyBCdWZmZXIuZnJvbShieXRlcykudG9TdHJpbmcoXCJiYXNlNjRcIilcbiAgICAgIDogYnRvYShieXRlcy5yZWR1Y2UoKHMsIGIpID0+IHMgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGIpLCBcIlwiKSk7XG5cbiAgcmV0dXJuIGI2NC5yZXBsYWNlKC9cXCsvZywgXCItXCIpLnJlcGxhY2UoL1xcLy9nLCBcIl9cIikucmVwbGFjZSgvPSokL2csIFwiXCIpO1xufVxuIl19