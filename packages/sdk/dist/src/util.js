"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathJoin = pathJoin;
exports.decodeBase64 = decodeBase64;
exports.decodeBase64Url = decodeBase64Url;
exports.encodeToBase64 = encodeToBase64;
exports.encodeToBase64Url = encodeToBase64Url;
exports.delay = delay;
exports.encodeToHex = encodeToHex;
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
/**
 * Sleeps for `ms` milliseconds.
 *
 * @param {number} ms Milliseconds to sleep
 * @return {Promise<void>} A promise that is resolved after `ms` milliseconds.
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Converts a string or a uint8 array into a hex string. Strings are encoded in UTF-8 before
 * being converted to hex.
 * @param {string | Uint8Array} message The input
 * @return {string} Hex string prefixed with "0x"
 */
function encodeToHex(message) {
    const buff = typeof message === "string" ? Buffer.from(message, "utf8") : Buffer.from(message);
    return "0x" + buff.toString("hex");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBdUJBLDRCQUdDO0FBUUQsb0NBSUM7QUFRRCwwQ0FJQztBQVNELHdDQU9DO0FBUUQsOENBSUM7QUFRRCxzQkFFQztBQVFELGtDQUdDO0FBbEZEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLEdBQVcsRUFBRSxJQUFZO0lBQ2hELE1BQU0sR0FBRyxHQUFHLFVBQVUsRUFBRSxPQUFPLEVBQUUsUUFBUSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDbkUsT0FBTyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUM7QUFDL0IsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLEdBQVc7SUFDdEMsT0FBTyxPQUFPLE1BQU0sS0FBSyxVQUFVO1FBQ2pDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUM7UUFDNUIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLE1BQWM7SUFDNUMsb0dBQW9HO0lBQ3BHLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM3RSxPQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLE1BQXdCO0lBQ3JELE1BQU0sS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sR0FBRyxHQUNQLE9BQU8sTUFBTSxLQUFLLFVBQVU7UUFDMUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsTUFBd0I7SUFDeEQsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25DLG9HQUFvRztJQUNwRyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixLQUFLLENBQUMsRUFBVTtJQUM5QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsV0FBVyxDQUFDLE9BQTRCO0lBQ3RELE1BQU0sSUFBSSxHQUFHLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0YsT0FBTyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEpTT04gbWFwIHR5cGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgSnNvbk1hcCB7XG4gIFttZW1iZXI6IHN0cmluZ106IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgSnNvbkFycmF5IHwgSnNvbk1hcDtcbn1cblxuLyoqIEpTT04gYXJyYXkgdHlwZSAqL1xuZXhwb3J0IHR5cGUgSnNvbkFycmF5ID0gQXJyYXk8c3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCBKc29uQXJyYXkgfCBKc29uTWFwPjtcblxuLyoqIEFueSBKU09OIHZhbHVlICovXG5leHBvcnQgdHlwZSBKc29uVmFsdWUgPSBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IEpzb25BcnJheSB8IEpzb25NYXA7XG5cbi8qKiBUaGUgYWRkcmVzcyBvZiBhIGNvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgQ29udHJhY3RBZGRyZXNzID0ge1xuICBjaGFpbl9pZDogc3RyaW5nO1xuICBhZGRyZXNzOiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIFBhdGggam9pblxuICogQHBhcmFtIHtzdHJpbmd9IGRpciBQYXJlbnQgZGlyZWN0b3J5XG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZSBQYXRobmFtZVxuICogQHJldHVybiB7c3RyaW5nfSBOZXcgcGF0aG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGhKb2luKGRpcjogc3RyaW5nLCBmaWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzZXAgPSBnbG9iYWxUaGlzPy5wcm9jZXNzPy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCJcXFxcXCIgOiBcIi9cIjtcbiAgcmV0dXJuIGAke2Rpcn0ke3NlcH0ke2ZpbGV9YDtcbn1cblxuLyoqXG4gKiBCcm93c2VyLWZyaWVuZGx5IGhlbHBlciBmb3IgZGVjb2RpbmcgYSAnYmFzZTY0Jy1lbmNvZGVkIHN0cmluZyBpbnRvIGEgYnl0ZSBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYjY0IFRoZSAnYmFzZTY0Jy1lbmNvZGVkIHN0cmluZyB0byBkZWNvZGVcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IERlY29kZWQgYnl0ZSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlQmFzZTY0KGI2NDogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIHJldHVybiB0eXBlb2YgQnVmZmVyID09PSBcImZ1bmN0aW9uXCJcbiAgICA/IEJ1ZmZlci5mcm9tKGI2NCwgXCJiYXNlNjRcIilcbiAgICA6IFVpbnQ4QXJyYXkuZnJvbShhdG9iKGI2NCksIChjKSA9PiBjLmNoYXJDb2RlQXQoMCkpO1xufVxuXG4vKipcbiAqIEJyb3dzZXItZnJpZW5kbHkgaGVscGVyIGZvciBkZWNvZGluZyBhICdiYXNlNjR1cmwnLWVuY29kZWQgc3RyaW5nIGludG8gYSBieXRlIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBiNjR1cmwgVGhlICdiYXNlNjR1cmwnLWVuY29kZWQgc3RyaW5nIHRvIGRlY29kZVxuICogQHJldHVybiB7VWludDhBcnJheX0gRGVjb2RlZCBieXRlIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVCYXNlNjRVcmwoYjY0dXJsOiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgLy8gTk9URTogdGhlcmUgaXMgbm8gXCJiYXNlNjR1cmxcIiBlbmNvZGluZyBpbiB0aGUgXCJidWZmZXJcIiBtb2R1bGUgZm9yIHRoZSBicm93c2VyICh1bmxpa2UgaW4gbm9kZS5qcylcbiAgY29uc3QgYjY0ID0gYjY0dXJsLnJlcGxhY2UoLy0vZywgXCIrXCIpLnJlcGxhY2UoL18vZywgXCIvXCIpLnJlcGxhY2UoLz0qJC9nLCBcIlwiKTtcbiAgcmV0dXJuIGRlY29kZUJhc2U2NChiNjQpO1xufVxuXG4vKipcbiAqXG4gKiBCcm93c2VyLWZyaWVuZGx5IGhlbHBlciBmb3IgZW5jb2RpbmcgYSBieXRlIGFycmF5IGludG8gYSBwYWRkZWQgYGJhc2U2NGAtZW5jb2RlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtJdGVyYWJsZTxudW1iZXI+fSBidWZmZXIgVGhlIGJ5dGUgYXJyYXkgdG8gZW5jb2RlXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSAnYmFzZTY0JyBlbmNvZGluZyBvZiB0aGUgYnl0ZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVRvQmFzZTY0KGJ1ZmZlcjogSXRlcmFibGU8bnVtYmVyPik6IHN0cmluZyB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgY29uc3QgYjY0ID1cbiAgICB0eXBlb2YgQnVmZmVyID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gQnVmZmVyLmZyb20oYnl0ZXMpLnRvU3RyaW5nKFwiYmFzZTY0XCIpXG4gICAgICA6IGJ0b2EoYnl0ZXMucmVkdWNlKChzLCBiKSA9PiBzICsgU3RyaW5nLmZyb21DaGFyQ29kZShiKSwgXCJcIikpO1xuICByZXR1cm4gYjY0O1xufVxuXG4vKipcbiAqIEJyb3dzZXItZnJpZW5kbHkgaGVscGVyIGZvciBlbmNvZGluZyBhIGJ5dGUgYXJyYXkgaW50byBhICdiYXNlNjR1cmxgLWVuY29kZWQgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7SXRlcmFibGU8bnVtYmVyPn0gYnVmZmVyIFRoZSBieXRlIGFycmF5IHRvIGVuY29kZVxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgJ2Jhc2U2NHVybCcgZW5jb2Rpbmcgb2YgdGhlIGJ5dGUgYXJyYXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVUb0Jhc2U2NFVybChidWZmZXI6IEl0ZXJhYmxlPG51bWJlcj4pOiBzdHJpbmcge1xuICBjb25zdCBiNjQgPSBlbmNvZGVUb0Jhc2U2NChidWZmZXIpO1xuICAvLyBOT1RFOiB0aGVyZSBpcyBubyBcImJhc2U2NHVybFwiIGVuY29kaW5nIGluIHRoZSBcImJ1ZmZlclwiIG1vZHVsZSBmb3IgdGhlIGJyb3dzZXIgKHVubGlrZSBpbiBub2RlLmpzKVxuICByZXR1cm4gYjY0LnJlcGxhY2UoL1xcKy9nLCBcIi1cIikucmVwbGFjZSgvXFwvL2csIFwiX1wiKS5yZXBsYWNlKC89KiQvZywgXCJcIik7XG59XG5cbi8qKlxuICogU2xlZXBzIGZvciBgbXNgIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gbXMgTWlsbGlzZWNvbmRzIHRvIHNsZWVwXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fSBBIHByb21pc2UgdGhhdCBpcyByZXNvbHZlZCBhZnRlciBgbXNgIG1pbGxpc2Vjb25kcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGF5KG1zOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG59XG5cbi8qKlxuICogQ29udmVydHMgYSBzdHJpbmcgb3IgYSB1aW50OCBhcnJheSBpbnRvIGEgaGV4IHN0cmluZy4gU3RyaW5ncyBhcmUgZW5jb2RlZCBpbiBVVEYtOCBiZWZvcmVcbiAqIGJlaW5nIGNvbnZlcnRlZCB0byBoZXguXG4gKiBAcGFyYW0ge3N0cmluZyB8IFVpbnQ4QXJyYXl9IG1lc3NhZ2UgVGhlIGlucHV0XG4gKiBAcmV0dXJuIHtzdHJpbmd9IEhleCBzdHJpbmcgcHJlZml4ZWQgd2l0aCBcIjB4XCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVRvSGV4KG1lc3NhZ2U6IHN0cmluZyB8IFVpbnQ4QXJyYXkpOiBzdHJpbmcge1xuICBjb25zdCBidWZmID0gdHlwZW9mIG1lc3NhZ2UgPT09IFwic3RyaW5nXCIgPyBCdWZmZXIuZnJvbShtZXNzYWdlLCBcInV0ZjhcIikgOiBCdWZmZXIuZnJvbShtZXNzYWdlKTtcbiAgcmV0dXJuIFwiMHhcIiArIGJ1ZmYudG9TdHJpbmcoXCJoZXhcIik7XG59XG4iXX0=