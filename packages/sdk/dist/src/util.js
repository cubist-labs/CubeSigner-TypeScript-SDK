"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeToHex = exports.delay = exports.encodeToBase64Url = exports.encodeToBase64 = exports.decodeBase64Url = exports.decodeBase64 = exports.configDir = exports.pathJoin = void 0;
/**
 * Path join
 * @param {string} dir Parent directory
 * @param {string} file Pathname
 * @return {string} New pathname
 */
function pathJoin(dir, file) {
    const sep = globalThis?.process?.platform === "win32" ? "\\" : "/";
    return `${dir}${sep}${file}`;
}
exports.pathJoin = pathJoin;
/**
 * Directory where CubeSigner stores config files.
 * @return {string} Config dir
 */
function configDir() {
    const configDir = process.platform === "darwin"
        ? `${process.env.HOME}/Library/Application Support`
        : `${process.env.HOME}/.config`;
    return pathJoin(configDir, "cubesigner");
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
/**
 * Converts a string or a uint8 array into a hex string. Strings are encoded in UTF-8 before
 * being converted to hex.
 * @param {string | Uint8Array} message The input
 * @return {string} Hex string prefixed with "0x"
 */
function encodeToHex(message) {
    return ("0x" + (typeof message === "string" ? Buffer.from(message, "utf8") : message).toString("hex"));
}
exports.encodeToHex = encodeToHex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVFBOzs7OztHQUtHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLEdBQVcsRUFBRSxJQUFZO0lBQ2hELE1BQU0sR0FBRyxHQUFHLFVBQVUsRUFBRSxPQUFPLEVBQUUsUUFBUSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDbkUsT0FBTyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUM7QUFDL0IsQ0FBQztBQUhELDRCQUdDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsU0FBUztJQUN2QixNQUFNLFNBQVMsR0FDYixPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVE7UUFDM0IsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDhCQUE4QjtRQUNuRCxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDO0lBQ3BDLE9BQU8sUUFBUSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBTkQsOEJBTUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLFlBQVksQ0FBQyxHQUFXO0lBQ3RDLE9BQU8sT0FBTyxNQUFNLEtBQUssVUFBVTtRQUNqQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFKRCxvQ0FJQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLE1BQWM7SUFDNUMsb0dBQW9HO0lBQ3BHLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM3RSxPQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBSkQsMENBSUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixjQUFjLENBQUMsTUFBd0I7SUFDckQsTUFBTSxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckMsTUFBTSxHQUFHLEdBQ1AsT0FBTyxNQUFNLEtBQUssVUFBVTtRQUMxQixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkUsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBUEQsd0NBT0M7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLE1BQXdCO0lBQ3hELE1BQU0sR0FBRyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxvR0FBb0c7SUFDcEcsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDekUsQ0FBQztBQUpELDhDQUlDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixLQUFLLENBQUMsRUFBVTtJQUM5QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUZELHNCQUVDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixXQUFXLENBQUMsT0FBNEI7SUFDdEQsT0FBTyxDQUNMLElBQUksR0FBRyxDQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FDOUYsQ0FBQztBQUNKLENBQUM7QUFKRCxrQ0FJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBKU09OIG1hcCB0eXBlICovXG5leHBvcnQgaW50ZXJmYWNlIEpzb25NYXAge1xuICBbbWVtYmVyOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IEpzb25BcnJheSB8IEpzb25NYXA7XG59XG5cbi8qKiBKU09OIGFycmF5IHR5cGUgKi9cbmV4cG9ydCB0eXBlIEpzb25BcnJheSA9IEFycmF5PHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgSnNvbkFycmF5IHwgSnNvbk1hcD47XG5cbi8qKlxuICogUGF0aCBqb2luXG4gKiBAcGFyYW0ge3N0cmluZ30gZGlyIFBhcmVudCBkaXJlY3RvcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlIFBhdGhuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd9IE5ldyBwYXRobmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0aEpvaW4oZGlyOiBzdHJpbmcsIGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHNlcCA9IGdsb2JhbFRoaXM/LnByb2Nlc3M/LnBsYXRmb3JtID09PSBcIndpbjMyXCIgPyBcIlxcXFxcIiA6IFwiL1wiO1xuICByZXR1cm4gYCR7ZGlyfSR7c2VwfSR7ZmlsZX1gO1xufVxuXG4vKipcbiAqIERpcmVjdG9yeSB3aGVyZSBDdWJlU2lnbmVyIHN0b3JlcyBjb25maWcgZmlsZXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IENvbmZpZyBkaXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ0RpcigpOiBzdHJpbmcge1xuICBjb25zdCBjb25maWdEaXIgPVxuICAgIHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCJcbiAgICAgID8gYCR7cHJvY2Vzcy5lbnYuSE9NRX0vTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0YFxuICAgICAgOiBgJHtwcm9jZXNzLmVudi5IT01FfS8uY29uZmlnYDtcbiAgcmV0dXJuIHBhdGhKb2luKGNvbmZpZ0RpciwgXCJjdWJlc2lnbmVyXCIpO1xufVxuXG4vKipcbiAqIEJyb3dzZXItZnJpZW5kbHkgaGVscGVyIGZvciBkZWNvZGluZyBhICdiYXNlNjQnLWVuY29kZWQgc3RyaW5nIGludG8gYSBieXRlIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBiNjQgVGhlICdiYXNlNjQnLWVuY29kZWQgc3RyaW5nIHRvIGRlY29kZVxuICogQHJldHVybiB7VWludDhBcnJheX0gRGVjb2RlZCBieXRlIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVCYXNlNjQoYjY0OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgcmV0dXJuIHR5cGVvZiBCdWZmZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gQnVmZmVyLmZyb20oYjY0LCBcImJhc2U2NFwiKVxuICAgIDogVWludDhBcnJheS5mcm9tKGF0b2IoYjY0KSwgKGMpID0+IGMuY2hhckNvZGVBdCgwKSk7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGRlY29kaW5nIGEgJ2Jhc2U2NHVybCctZW5jb2RlZCBzdHJpbmcgaW50byBhIGJ5dGUgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGI2NHVybCBUaGUgJ2Jhc2U2NHVybCctZW5jb2RlZCBzdHJpbmcgdG8gZGVjb2RlXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fSBEZWNvZGVkIGJ5dGUgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUJhc2U2NFVybChiNjR1cmw6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAvLyBOT1RFOiB0aGVyZSBpcyBubyBcImJhc2U2NHVybFwiIGVuY29kaW5nIGluIHRoZSBcImJ1ZmZlclwiIG1vZHVsZSBmb3IgdGhlIGJyb3dzZXIgKHVubGlrZSBpbiBub2RlLmpzKVxuICBjb25zdCBiNjQgPSBiNjR1cmwucmVwbGFjZSgvLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIikucmVwbGFjZSgvPSokL2csIFwiXCIpO1xuICByZXR1cm4gZGVjb2RlQmFzZTY0KGI2NCk7XG59XG5cbi8qKlxuICpcbiAqIEJyb3dzZXItZnJpZW5kbHkgaGVscGVyIGZvciBlbmNvZGluZyBhIGJ5dGUgYXJyYXkgaW50byBhIHBhZGRlZCBgYmFzZTY0YC1lbmNvZGVkIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge0l0ZXJhYmxlPG51bWJlcj59IGJ1ZmZlciBUaGUgYnl0ZSBhcnJheSB0byBlbmNvZGVcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlICdiYXNlNjQnIGVuY29kaW5nIG9mIHRoZSBieXRlIGFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlVG9CYXNlNjQoYnVmZmVyOiBJdGVyYWJsZTxudW1iZXI+KTogc3RyaW5nIHtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICBjb25zdCBiNjQgPVxuICAgIHR5cGVvZiBCdWZmZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyBCdWZmZXIuZnJvbShieXRlcykudG9TdHJpbmcoXCJiYXNlNjRcIilcbiAgICAgIDogYnRvYShieXRlcy5yZWR1Y2UoKHMsIGIpID0+IHMgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGIpLCBcIlwiKSk7XG4gIHJldHVybiBiNjQ7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGVuY29kaW5nIGEgYnl0ZSBhcnJheSBpbnRvIGEgJ2Jhc2U2NHVybGAtZW5jb2RlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtJdGVyYWJsZTxudW1iZXI+fSBidWZmZXIgVGhlIGJ5dGUgYXJyYXkgdG8gZW5jb2RlXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSAnYmFzZTY0dXJsJyBlbmNvZGluZyBvZiB0aGUgYnl0ZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVRvQmFzZTY0VXJsKGJ1ZmZlcjogSXRlcmFibGU8bnVtYmVyPik6IHN0cmluZyB7XG4gIGNvbnN0IGI2NCA9IGVuY29kZVRvQmFzZTY0KGJ1ZmZlcik7XG4gIC8vIE5PVEU6IHRoZXJlIGlzIG5vIFwiYmFzZTY0dXJsXCIgZW5jb2RpbmcgaW4gdGhlIFwiYnVmZmVyXCIgbW9kdWxlIGZvciB0aGUgYnJvd3NlciAodW5saWtlIGluIG5vZGUuanMpXG4gIHJldHVybiBiNjQucmVwbGFjZSgvXFwrL2csIFwiLVwiKS5yZXBsYWNlKC9cXC8vZywgXCJfXCIpLnJlcGxhY2UoLz0qJC9nLCBcIlwiKTtcbn1cblxuLyoqXG4gKiBTbGVlcHMgZm9yIGBtc2AgbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBtcyBNaWxsaXNlY29uZHMgdG8gc2xlZXBcbiAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59IEEgcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIGFmdGVyIGBtc2AgbWlsbGlzZWNvbmRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsYXkobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIHN0cmluZyBvciBhIHVpbnQ4IGFycmF5IGludG8gYSBoZXggc3RyaW5nLiBTdHJpbmdzIGFyZSBlbmNvZGVkIGluIFVURi04IGJlZm9yZVxuICogYmVpbmcgY29udmVydGVkIHRvIGhleC5cbiAqIEBwYXJhbSB7c3RyaW5nIHwgVWludDhBcnJheX0gbWVzc2FnZSBUaGUgaW5wdXRcbiAqIEByZXR1cm4ge3N0cmluZ30gSGV4IHN0cmluZyBwcmVmaXhlZCB3aXRoIFwiMHhcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlVG9IZXgobWVzc2FnZTogc3RyaW5nIHwgVWludDhBcnJheSk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgXCIweFwiICsgKHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiID8gQnVmZmVyLmZyb20obWVzc2FnZSwgXCJ1dGY4XCIpIDogbWVzc2FnZSkudG9TdHJpbmcoXCJoZXhcIilcbiAgKTtcbn1cbiJdfQ==