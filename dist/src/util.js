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
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
exports.decodeBase64Url = decodeBase64Url;
/**
 * Browser-friendly helper for encoding a byte array into a 'base64url`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64url' encoding of the byte array.
 */
function encodeToBase64Url(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = window.btoa(binary);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");
}
exports.encodeToBase64Url = encodeToBase64Url;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBVTdCOzs7R0FHRztBQUNILFNBQWdCLFNBQVM7SUFDdkIsTUFBTSxTQUFTLEdBQ2IsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRO1FBQzNCLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSw4QkFBOEI7UUFDbkQsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFVBQVUsQ0FBQztJQUNwQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFORCw4QkFNQztBQUlEOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsS0FBSztJQVFwQzs7O09BR0c7SUFDSCxZQUFZLElBQTBCO1FBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBaEJELGtDQWdCQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLFFBQVEsQ0FBTyxJQUF3QixFQUFFLFdBQW9CO0lBQzNFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNkLE1BQU0sSUFBSSxXQUFXLENBQUM7WUFDcEIsV0FBVztZQUNYLE9BQU8sRUFBRyxJQUFJLENBQUMsS0FBYSxDQUFDLE9BQU87WUFDcEMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVTtZQUNyQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNO1NBQzlCLENBQUMsQ0FBQztLQUNKO0lBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtRQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDbkIsQ0FBQztBQWJELDRCQWFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixlQUFlLENBQUMsTUFBYztJQUM1QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDN0UsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFIRCwwQ0FHQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsTUFBd0I7SUFDeEQsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLE1BQU0sS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3pDLE1BQU0sSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3pDO0lBQ0QsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBUkQsOENBUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8qKiBKU09OIG1hcCB0eXBlICovXG5leHBvcnQgaW50ZXJmYWNlIEpzb25NYXAge1xuICBbbWVtYmVyOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IEpzb25BcnJheSB8IEpzb25NYXA7XG59XG5cbi8qKiBKU09OIGFycmF5IHR5cGUgKi9cbmV4cG9ydCB0eXBlIEpzb25BcnJheSA9IEFycmF5PHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgSnNvbkFycmF5IHwgSnNvbk1hcD47XG5cbi8qKlxuICogRGlyZWN0b3J5IHdoZXJlIEN1YmVTaWduZXIgc3RvcmVzIGNvbmZpZyBmaWxlcy5cbiAqIEByZXR1cm4ge3N0cmluZ30gQ29uZmlnIGRpclxuICovXG5leHBvcnQgZnVuY3Rpb24gY29uZmlnRGlyKCk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbmZpZ0RpciA9XG4gICAgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIlxuICAgICAgPyBgJHtwcm9jZXNzLmVudi5IT01FfS9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnRgXG4gICAgICA6IGAke3Byb2Nlc3MuZW52LkhPTUV9Ly5jb25maWdgO1xuICByZXR1cm4gcGF0aC5qb2luKGNvbmZpZ0RpciwgXCJjdWJlc2lnbmVyXCIpO1xufVxuXG50eXBlIFJlc3BvbnNlVHlwZTxELCBUPiA9IHsgZGF0YT86IEQ7IGVycm9yPzogVDsgcmVzcG9uc2U/OiBSZXNwb25zZSB9O1xuXG4vKipcbiAqIEVycm9yIHJlc3BvbnNlIHR5cGUsIHRocm93biBvbiBub24tc3VjY2Vzc2Z1bCByZXNwb25zZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJSZXNwb25zZSBleHRlbmRzIEVycm9yIHtcbiAgLyoqIERlc2NyaXB0aW9uICovXG4gIHJlYWRvbmx5IGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSB0ZXh0IChkZXJpdmVkIGZyb20gYHRoaXMuc3RhdHVzYCkgKi9cbiAgcmVhZG9ubHkgc3RhdHVzVGV4dD86IHN0cmluZztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgKi9cbiAgcmVhZG9ubHkgc3RhdHVzPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge1BhcnRpYWw8RXJyUmVzcG9uc2U+fSBpbml0IEluaXRpYWxpemVyXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihpbml0OiBQYXJ0aWFsPEVyclJlc3BvbnNlPikge1xuICAgIHN1cGVyKGluaXQubWVzc2FnZSk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBpbml0KTtcbiAgfVxufVxuXG4vKipcbiAqIFRocm93IGlmIG9uIGVycm9yIHJlc3BvbnNlLiBPdGhlcndpc2UsIHJldHVybiB0aGUgcmVzcG9uc2UgZGF0YS5cbiAqIEBwYXJhbSB7UmVzcG9uc2VUeXBlfSByZXNwIFRoZSByZXNwb25zZSB0byBjaGVja1xuICogQHBhcmFtIHtzdHJpbmd9IGRlc2NyaXB0aW9uIERlc2NyaXB0aW9uIHRvIGluY2x1ZGUgaW4gdGhlIHRocm93biBlcnJvclxuICogQHJldHVybiB7RH0gVGhlIHJlc3BvbnNlIGRhdGEuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE9rPEQsIFQ+KHJlc3A6IFJlc3BvbnNlVHlwZTxELCBUPiwgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBEIHtcbiAgaWYgKHJlc3AuZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyUmVzcG9uc2Uoe1xuICAgICAgZGVzY3JpcHRpb24sXG4gICAgICBtZXNzYWdlOiAocmVzcC5lcnJvciBhcyBhbnkpLm1lc3NhZ2UsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgc3RhdHVzVGV4dDogcmVzcC5yZXNwb25zZT8uc3RhdHVzVGV4dCxcbiAgICAgIHN0YXR1czogcmVzcC5yZXNwb25zZT8uc3RhdHVzLFxuICAgIH0pO1xuICB9XG4gIGlmIChyZXNwLmRhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlJlc3BvbnNlIGRhdGEgaXMgdW5kZWZpbmVkXCIpO1xuICB9XG4gIHJldHVybiByZXNwLmRhdGE7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGRlY29kaW5nIGEgJ2Jhc2U2NHVybCctZW5jb2RlZCBzdHJpbmcgaW50byBhIGJ5dGUgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGI2NHVybCBUaGUgJ2Jhc2U2NHVybCctZW5jb2RlZCBzdHJpbmcgdG8gZGVjb2RlXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fSBEZWNvZGVkIGJ5dGUgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUJhc2U2NFVybChiNjR1cmw6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBiNjQgPSBiNjR1cmwucmVwbGFjZSgvLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIikucmVwbGFjZSgvPSokL2csIFwiXCIpO1xuICByZXR1cm4gVWludDhBcnJheS5mcm9tKGF0b2IoYjY0KSwgKGMpID0+IGMuY2hhckNvZGVBdCgwKSk7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGVuY29kaW5nIGEgYnl0ZSBhcnJheSBpbnRvIGEgJ2Jhc2U2NHVybGAtZW5jb2RlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtJdGVyYWJsZTxudW1iZXI+fSBidWZmZXIgVGhlIGJ5dGUgYXJyYXkgdG8gZW5jb2RlXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSAnYmFzZTY0dXJsJyBlbmNvZGluZyBvZiB0aGUgYnl0ZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVRvQmFzZTY0VXJsKGJ1ZmZlcjogSXRlcmFibGU8bnVtYmVyPik6IHN0cmluZyB7XG4gIGxldCBiaW5hcnkgPSBcIlwiO1xuICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMuYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgYmluYXJ5ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pO1xuICB9XG4gIGNvbnN0IGI2NCA9IHdpbmRvdy5idG9hKGJpbmFyeSk7XG4gIHJldHVybiBiNjQucmVwbGFjZSgvXFwrL2csIFwiLVwiKS5yZXBsYWNlKC9cXC8vZywgXCJfXCIpLnJlcGxhY2UoLz0qJC9nLCBcIlwiKTtcbn1cbiJdfQ==