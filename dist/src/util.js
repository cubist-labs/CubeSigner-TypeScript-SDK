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
exports.delay = exports.encodeToBase64Url = exports.encodeToBase64 = exports.decodeBase64Url = exports.decodeBase64 = exports.configDir = void 0;
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
 * Browser-friendly helper for decoding a 'base64'-encoded string into a byte array.
 *
 * @param {string} b64 The 'base64'-encoded string to decode
 * @return {Uint8Array} Decoded byte array
 */
function decodeBase64(b64) {
    return typeof Buffer === "function"
        ? Buffer.from(b64, "base64")
        : Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
exports.decodeBase64 = decodeBase64;
/**
 * Browser-friendly helper for decoding a 'base64url'-encoded string into a byte array.
 *
 * @param {string} b64url The 'base64url'-encoded string to decode
 * @return {Uint8Array} Decoded byte array
 */
function decodeBase64Url(b64url) {
    // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").replace(/=*$/g, "");
    return decodeBase64(b64);
}
exports.decodeBase64Url = decodeBase64Url;
/**
 *
 * Browser-friendly helper for encoding a byte array into a padded `base64`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64' encoding of the byte array.
 */
function encodeToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const b64 = typeof Buffer === "function"
        ? Buffer.from(bytes).toString("base64")
        : btoa(bytes.reduce((s, b) => s + String.fromCharCode(b), ""));
    return b64;
}
exports.encodeToBase64 = encodeToBase64;
/**
 * Browser-friendly helper for encoding a byte array into a 'base64url`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64url' encoding of the byte array.
 */
function encodeToBase64Url(buffer) {
    const b64 = encodeToBase64(buffer);
    // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");
}
exports.encodeToBase64Url = encodeToBase64Url;
/**
 * Sleeps for `ms` milliseconds.
 *
 * @param {number} ms Milliseconds to sleep
 * @return {Promise<void>} A promise that is resolved after `ms` milliseconds.
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.delay = delay;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBVTdCOzs7R0FHRztBQUNILFNBQWdCLFNBQVM7SUFDdkIsTUFBTSxTQUFTLEdBQ2IsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRO1FBQzNCLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSw4QkFBOEI7UUFDbkQsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFVBQVUsQ0FBQztJQUNwQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFORCw4QkFNQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLEdBQVc7SUFDdEMsT0FBTyxPQUFPLE1BQU0sS0FBSyxVQUFVO1FBQ2pDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUM7UUFDNUIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUpELG9DQUlDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixlQUFlLENBQUMsTUFBYztJQUM1QyxvR0FBb0c7SUFDcEcsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdFLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLENBQUM7QUFKRCwwQ0FJQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLGNBQWMsQ0FBQyxNQUF3QjtJQUNyRCxNQUFNLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyQyxNQUFNLEdBQUcsR0FDUCxPQUFPLE1BQU0sS0FBSyxVQUFVO1FBQzFCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDdkMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNuRSxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFQRCx3Q0FPQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsTUFBd0I7SUFDeEQsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25DLG9HQUFvRztJQUNwRyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBSkQsOENBSUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLEtBQUssQ0FBQyxFQUFVO0lBQzlCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRkQsc0JBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8qKiBKU09OIG1hcCB0eXBlICovXG5leHBvcnQgaW50ZXJmYWNlIEpzb25NYXAge1xuICBbbWVtYmVyOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IEpzb25BcnJheSB8IEpzb25NYXA7XG59XG5cbi8qKiBKU09OIGFycmF5IHR5cGUgKi9cbmV4cG9ydCB0eXBlIEpzb25BcnJheSA9IEFycmF5PHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgSnNvbkFycmF5IHwgSnNvbk1hcD47XG5cbi8qKlxuICogRGlyZWN0b3J5IHdoZXJlIEN1YmVTaWduZXIgc3RvcmVzIGNvbmZpZyBmaWxlcy5cbiAqIEByZXR1cm4ge3N0cmluZ30gQ29uZmlnIGRpclxuICovXG5leHBvcnQgZnVuY3Rpb24gY29uZmlnRGlyKCk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbmZpZ0RpciA9XG4gICAgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIlxuICAgICAgPyBgJHtwcm9jZXNzLmVudi5IT01FfS9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnRgXG4gICAgICA6IGAke3Byb2Nlc3MuZW52LkhPTUV9Ly5jb25maWdgO1xuICByZXR1cm4gcGF0aC5qb2luKGNvbmZpZ0RpciwgXCJjdWJlc2lnbmVyXCIpO1xufVxuXG4vKipcbiAqIEJyb3dzZXItZnJpZW5kbHkgaGVscGVyIGZvciBkZWNvZGluZyBhICdiYXNlNjQnLWVuY29kZWQgc3RyaW5nIGludG8gYSBieXRlIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBiNjQgVGhlICdiYXNlNjQnLWVuY29kZWQgc3RyaW5nIHRvIGRlY29kZVxuICogQHJldHVybiB7VWludDhBcnJheX0gRGVjb2RlZCBieXRlIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVCYXNlNjQoYjY0OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgcmV0dXJuIHR5cGVvZiBCdWZmZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gQnVmZmVyLmZyb20oYjY0LCBcImJhc2U2NFwiKVxuICAgIDogVWludDhBcnJheS5mcm9tKGF0b2IoYjY0KSwgKGMpID0+IGMuY2hhckNvZGVBdCgwKSk7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGRlY29kaW5nIGEgJ2Jhc2U2NHVybCctZW5jb2RlZCBzdHJpbmcgaW50byBhIGJ5dGUgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGI2NHVybCBUaGUgJ2Jhc2U2NHVybCctZW5jb2RlZCBzdHJpbmcgdG8gZGVjb2RlXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fSBEZWNvZGVkIGJ5dGUgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUJhc2U2NFVybChiNjR1cmw6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAvLyBOT1RFOiB0aGVyZSBpcyBubyBcImJhc2U2NHVybFwiIGVuY29kaW5nIGluIHRoZSBcImJ1ZmZlclwiIG1vZHVsZSBmb3IgdGhlIGJyb3dzZXIgKHVubGlrZSBpbiBub2RlLmpzKVxuICBjb25zdCBiNjQgPSBiNjR1cmwucmVwbGFjZSgvLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIikucmVwbGFjZSgvPSokL2csIFwiXCIpO1xuICByZXR1cm4gZGVjb2RlQmFzZTY0KGI2NCk7XG59XG5cbi8qKlxuICpcbiAqIEJyb3dzZXItZnJpZW5kbHkgaGVscGVyIGZvciBlbmNvZGluZyBhIGJ5dGUgYXJyYXkgaW50byBhIHBhZGRlZCBgYmFzZTY0YC1lbmNvZGVkIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge0l0ZXJhYmxlPG51bWJlcj59IGJ1ZmZlciBUaGUgYnl0ZSBhcnJheSB0byBlbmNvZGVcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlICdiYXNlNjQnIGVuY29kaW5nIG9mIHRoZSBieXRlIGFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlVG9CYXNlNjQoYnVmZmVyOiBJdGVyYWJsZTxudW1iZXI+KTogc3RyaW5nIHtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICBjb25zdCBiNjQgPVxuICAgIHR5cGVvZiBCdWZmZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyBCdWZmZXIuZnJvbShieXRlcykudG9TdHJpbmcoXCJiYXNlNjRcIilcbiAgICAgIDogYnRvYShieXRlcy5yZWR1Y2UoKHMsIGIpID0+IHMgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGIpLCBcIlwiKSk7XG4gIHJldHVybiBiNjQ7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGVuY29kaW5nIGEgYnl0ZSBhcnJheSBpbnRvIGEgJ2Jhc2U2NHVybGAtZW5jb2RlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtJdGVyYWJsZTxudW1iZXI+fSBidWZmZXIgVGhlIGJ5dGUgYXJyYXkgdG8gZW5jb2RlXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSAnYmFzZTY0dXJsJyBlbmNvZGluZyBvZiB0aGUgYnl0ZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVRvQmFzZTY0VXJsKGJ1ZmZlcjogSXRlcmFibGU8bnVtYmVyPik6IHN0cmluZyB7XG4gIGNvbnN0IGI2NCA9IGVuY29kZVRvQmFzZTY0KGJ1ZmZlcik7XG4gIC8vIE5PVEU6IHRoZXJlIGlzIG5vIFwiYmFzZTY0dXJsXCIgZW5jb2RpbmcgaW4gdGhlIFwiYnVmZmVyXCIgbW9kdWxlIGZvciB0aGUgYnJvd3NlciAodW5saWtlIGluIG5vZGUuanMpXG4gIHJldHVybiBiNjQucmVwbGFjZSgvXFwrL2csIFwiLVwiKS5yZXBsYWNlKC9cXC8vZywgXCJfXCIpLnJlcGxhY2UoLz0qJC9nLCBcIlwiKTtcbn1cblxuLyoqXG4gKiBTbGVlcHMgZm9yIGBtc2AgbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBtcyBNaWxsaXNlY29uZHMgdG8gc2xlZXBcbiAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59IEEgcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIGFmdGVyIGBtc2AgbWlsbGlzZWNvbmRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsYXkobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cbiJdfQ==