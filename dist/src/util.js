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
exports.encodeToBase64Url = exports.encodeToBase64 = exports.decodeBase64Url = exports.decodeBase64 = exports.assertOk = exports.ErrResponse = exports.configDir = void 0;
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
            message: resp.error.message, // eslint-disable-line @typescript-eslint/no-explicit-any
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBVTdCOzs7R0FHRztBQUNILFNBQWdCLFNBQVM7SUFDdkIsTUFBTSxTQUFTLEdBQ2IsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRO1FBQzNCLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSw4QkFBOEI7UUFDbkQsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFVBQVUsQ0FBQztJQUNwQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFORCw4QkFNQztBQUlEOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsS0FBSztJQVFwQzs7O09BR0c7SUFDSCxZQUFZLElBQTBCO1FBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBaEJELGtDQWdCQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLFFBQVEsQ0FBTyxJQUF3QixFQUFFLFdBQW9CO0lBQzNFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2YsTUFBTSxJQUFJLFdBQVcsQ0FBQztZQUNwQixXQUFXO1lBQ1gsT0FBTyxFQUFHLElBQUksQ0FBQyxLQUFhLENBQUMsT0FBTyxFQUFFLHlEQUF5RDtZQUMvRixVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVO1lBQ3JDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU07U0FDOUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztBQUNuQixDQUFDO0FBYkQsNEJBYUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLFlBQVksQ0FBQyxHQUFXO0lBQ3RDLE9BQU8sT0FBTyxNQUFNLEtBQUssVUFBVTtRQUNqQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFKRCxvQ0FJQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLE1BQWM7SUFDNUMsb0dBQW9HO0lBQ3BHLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM3RSxPQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBSkQsMENBSUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixjQUFjLENBQUMsTUFBd0I7SUFDckQsTUFBTSxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckMsTUFBTSxHQUFHLEdBQ1AsT0FBTyxNQUFNLEtBQUssVUFBVTtRQUMxQixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkUsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBUEQsd0NBT0M7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLE1BQXdCO0lBQ3hELE1BQU0sR0FBRyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxvR0FBb0c7SUFDcEcsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDekUsQ0FBQztBQUpELDhDQUlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG4vKiogSlNPTiBtYXAgdHlwZSAqL1xuZXhwb3J0IGludGVyZmFjZSBKc29uTWFwIHtcbiAgW21lbWJlcjogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCBKc29uQXJyYXkgfCBKc29uTWFwO1xufVxuXG4vKiogSlNPTiBhcnJheSB0eXBlICovXG5leHBvcnQgdHlwZSBKc29uQXJyYXkgPSBBcnJheTxzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IEpzb25BcnJheSB8IEpzb25NYXA+O1xuXG4vKipcbiAqIERpcmVjdG9yeSB3aGVyZSBDdWJlU2lnbmVyIHN0b3JlcyBjb25maWcgZmlsZXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IENvbmZpZyBkaXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ0RpcigpOiBzdHJpbmcge1xuICBjb25zdCBjb25maWdEaXIgPVxuICAgIHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCJcbiAgICAgID8gYCR7cHJvY2Vzcy5lbnYuSE9NRX0vTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0YFxuICAgICAgOiBgJHtwcm9jZXNzLmVudi5IT01FfS8uY29uZmlnYDtcbiAgcmV0dXJuIHBhdGguam9pbihjb25maWdEaXIsIFwiY3ViZXNpZ25lclwiKTtcbn1cblxudHlwZSBSZXNwb25zZVR5cGU8RCwgVD4gPSB7IGRhdGE/OiBEOyBlcnJvcj86IFQ7IHJlc3BvbnNlPzogUmVzcG9uc2UgfTtcblxuLyoqXG4gKiBFcnJvciByZXNwb25zZSB0eXBlLCB0aHJvd24gb24gbm9uLXN1Y2Nlc3NmdWwgcmVzcG9uc2VzLlxuICovXG5leHBvcnQgY2xhc3MgRXJyUmVzcG9uc2UgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBEZXNjcmlwdGlvbiAqL1xuICByZWFkb25seSBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgdGV4dCAoZGVyaXZlZCBmcm9tIGB0aGlzLnN0YXR1c2ApICovXG4gIHJlYWRvbmx5IHN0YXR1c1RleHQ/OiBzdHJpbmc7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlICovXG4gIHJlYWRvbmx5IHN0YXR1cz86IG51bWJlcjtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEVyclJlc3BvbnNlPn0gaW5pdCBJbml0aWFsaXplclxuICAgKi9cbiAgY29uc3RydWN0b3IoaW5pdDogUGFydGlhbDxFcnJSZXNwb25zZT4pIHtcbiAgICBzdXBlcihpbml0Lm1lc3NhZ2UpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgaW5pdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaHJvdyBpZiBvbiBlcnJvciByZXNwb25zZS4gT3RoZXJ3aXNlLCByZXR1cm4gdGhlIHJlc3BvbnNlIGRhdGEuXG4gKiBAcGFyYW0ge1Jlc3BvbnNlVHlwZX0gcmVzcCBUaGUgcmVzcG9uc2UgdG8gY2hlY2tcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZXNjcmlwdGlvbiBEZXNjcmlwdGlvbiB0byBpbmNsdWRlIGluIHRoZSB0aHJvd24gZXJyb3JcbiAqIEByZXR1cm4ge0R9IFRoZSByZXNwb25zZSBkYXRhLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRPazxELCBUPihyZXNwOiBSZXNwb25zZVR5cGU8RCwgVD4sIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogRCB7XG4gIGlmIChyZXNwLmVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVyclJlc3BvbnNlKHtcbiAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgbWVzc2FnZTogKHJlc3AuZXJyb3IgYXMgYW55KS5tZXNzYWdlLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHN0YXR1c1RleHQ6IHJlc3AucmVzcG9uc2U/LnN0YXR1c1RleHQsXG4gICAgICBzdGF0dXM6IHJlc3AucmVzcG9uc2U/LnN0YXR1cyxcbiAgICB9KTtcbiAgfVxuICBpZiAocmVzcC5kYXRhID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXNwb25zZSBkYXRhIGlzIHVuZGVmaW5lZFwiKTtcbiAgfVxuICByZXR1cm4gcmVzcC5kYXRhO1xufVxuXG4vKipcbiAqIEJyb3dzZXItZnJpZW5kbHkgaGVscGVyIGZvciBkZWNvZGluZyBhICdiYXNlNjQnLWVuY29kZWQgc3RyaW5nIGludG8gYSBieXRlIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBiNjQgVGhlICdiYXNlNjQnLWVuY29kZWQgc3RyaW5nIHRvIGRlY29kZVxuICogQHJldHVybiB7VWludDhBcnJheX0gRGVjb2RlZCBieXRlIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVCYXNlNjQoYjY0OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgcmV0dXJuIHR5cGVvZiBCdWZmZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gQnVmZmVyLmZyb20oYjY0LCBcImJhc2U2NFwiKVxuICAgIDogVWludDhBcnJheS5mcm9tKGF0b2IoYjY0KSwgKGMpID0+IGMuY2hhckNvZGVBdCgwKSk7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGRlY29kaW5nIGEgJ2Jhc2U2NHVybCctZW5jb2RlZCBzdHJpbmcgaW50byBhIGJ5dGUgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGI2NHVybCBUaGUgJ2Jhc2U2NHVybCctZW5jb2RlZCBzdHJpbmcgdG8gZGVjb2RlXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fSBEZWNvZGVkIGJ5dGUgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUJhc2U2NFVybChiNjR1cmw6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAvLyBOT1RFOiB0aGVyZSBpcyBubyBcImJhc2U2NHVybFwiIGVuY29kaW5nIGluIHRoZSBcImJ1ZmZlclwiIG1vZHVsZSBmb3IgdGhlIGJyb3dzZXIgKHVubGlrZSBpbiBub2RlLmpzKVxuICBjb25zdCBiNjQgPSBiNjR1cmwucmVwbGFjZSgvLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIikucmVwbGFjZSgvPSokL2csIFwiXCIpO1xuICByZXR1cm4gZGVjb2RlQmFzZTY0KGI2NCk7XG59XG5cbi8qKlxuICpcbiAqIEJyb3dzZXItZnJpZW5kbHkgaGVscGVyIGZvciBlbmNvZGluZyBhIGJ5dGUgYXJyYXkgaW50byBhIHBhZGRlZCBgYmFzZTY0YC1lbmNvZGVkIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge0l0ZXJhYmxlPG51bWJlcj59IGJ1ZmZlciBUaGUgYnl0ZSBhcnJheSB0byBlbmNvZGVcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlICdiYXNlNjQnIGVuY29kaW5nIG9mIHRoZSBieXRlIGFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlVG9CYXNlNjQoYnVmZmVyOiBJdGVyYWJsZTxudW1iZXI+KTogc3RyaW5nIHtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICBjb25zdCBiNjQgPVxuICAgIHR5cGVvZiBCdWZmZXIgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyBCdWZmZXIuZnJvbShieXRlcykudG9TdHJpbmcoXCJiYXNlNjRcIilcbiAgICAgIDogYnRvYShieXRlcy5yZWR1Y2UoKHMsIGIpID0+IHMgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGIpLCBcIlwiKSk7XG4gIHJldHVybiBiNjQ7XG59XG5cbi8qKlxuICogQnJvd3Nlci1mcmllbmRseSBoZWxwZXIgZm9yIGVuY29kaW5nIGEgYnl0ZSBhcnJheSBpbnRvIGEgJ2Jhc2U2NHVybGAtZW5jb2RlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtJdGVyYWJsZTxudW1iZXI+fSBidWZmZXIgVGhlIGJ5dGUgYXJyYXkgdG8gZW5jb2RlXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSAnYmFzZTY0dXJsJyBlbmNvZGluZyBvZiB0aGUgYnl0ZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVRvQmFzZTY0VXJsKGJ1ZmZlcjogSXRlcmFibGU8bnVtYmVyPik6IHN0cmluZyB7XG4gIGNvbnN0IGI2NCA9IGVuY29kZVRvQmFzZTY0KGJ1ZmZlcik7XG4gIC8vIE5PVEU6IHRoZXJlIGlzIG5vIFwiYmFzZTY0dXJsXCIgZW5jb2RpbmcgaW4gdGhlIFwiYnVmZmVyXCIgbW9kdWxlIGZvciB0aGUgYnJvd3NlciAodW5saWtlIGluIG5vZGUuanMpXG4gIHJldHVybiBiNjQucmVwbGFjZSgvXFwrL2csIFwiLVwiKS5yZXBsYWNlKC9cXC8vZywgXCJfXCIpLnJlcGxhY2UoLz0qJC9nLCBcIlwiKTtcbn1cbiJdfQ==