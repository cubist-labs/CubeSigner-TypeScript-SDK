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
exports.assertOk = exports.ErrResponse = exports.configDir = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBVTdCOzs7R0FHRztBQUNILFNBQWdCLFNBQVM7SUFDdkIsTUFBTSxTQUFTLEdBQ2IsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRO1FBQzNCLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSw4QkFBOEI7UUFDbkQsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFVBQVUsQ0FBQztJQUNwQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFORCw4QkFNQztBQUlEOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsS0FBSztJQVFwQzs7O09BR0c7SUFDSCxZQUFZLElBQTBCO1FBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBaEJELGtDQWdCQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLFFBQVEsQ0FBTyxJQUF3QixFQUFFLFdBQW9CO0lBQzNFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNkLE1BQU0sSUFBSSxXQUFXLENBQUM7WUFDcEIsV0FBVztZQUNYLE9BQU8sRUFBRyxJQUFJLENBQUMsS0FBYSxDQUFDLE9BQU87WUFDcEMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVTtZQUNyQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNO1NBQzlCLENBQUMsQ0FBQztLQUNKO0lBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtRQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDbkIsQ0FBQztBQWJELDRCQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG4vKiogSlNPTiBtYXAgdHlwZSAqL1xuZXhwb3J0IGludGVyZmFjZSBKc29uTWFwIHtcbiAgW21lbWJlcjogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCBKc29uQXJyYXkgfCBKc29uTWFwO1xufVxuXG4vKiogSlNPTiBhcnJheSB0eXBlICovXG5leHBvcnQgdHlwZSBKc29uQXJyYXkgPSBBcnJheTxzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IEpzb25BcnJheSB8IEpzb25NYXA+O1xuXG4vKipcbiAqIERpcmVjdG9yeSB3aGVyZSBDdWJlU2lnbmVyIHN0b3JlcyBjb25maWcgZmlsZXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IENvbmZpZyBkaXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ0RpcigpOiBzdHJpbmcge1xuICBjb25zdCBjb25maWdEaXIgPVxuICAgIHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCJcbiAgICAgID8gYCR7cHJvY2Vzcy5lbnYuSE9NRX0vTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0YFxuICAgICAgOiBgJHtwcm9jZXNzLmVudi5IT01FfS8uY29uZmlnYDtcbiAgcmV0dXJuIHBhdGguam9pbihjb25maWdEaXIsIFwiY3ViZXNpZ25lclwiKTtcbn1cblxudHlwZSBSZXNwb25zZVR5cGU8RCwgVD4gPSB7IGRhdGE/OiBEOyBlcnJvcj86IFQ7IHJlc3BvbnNlPzogUmVzcG9uc2UgfTtcblxuLyoqXG4gKiBFcnJvciByZXNwb25zZSB0eXBlLCB0aHJvd24gb24gbm9uLXN1Y2Nlc3NmdWwgcmVzcG9uc2VzLlxuICovXG5leHBvcnQgY2xhc3MgRXJyUmVzcG9uc2UgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBEZXNjcmlwdGlvbiAqL1xuICByZWFkb25seSBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgdGV4dCAoZGVyaXZlZCBmcm9tIGB0aGlzLnN0YXR1c2ApICovXG4gIHJlYWRvbmx5IHN0YXR1c1RleHQ/OiBzdHJpbmc7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlICovXG4gIHJlYWRvbmx5IHN0YXR1cz86IG51bWJlcjtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEVyclJlc3BvbnNlPn0gaW5pdCBJbml0aWFsaXplclxuICAgKi9cbiAgY29uc3RydWN0b3IoaW5pdDogUGFydGlhbDxFcnJSZXNwb25zZT4pIHtcbiAgICBzdXBlcihpbml0Lm1lc3NhZ2UpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgaW5pdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaHJvdyBpZiBvbiBlcnJvciByZXNwb25zZS4gT3RoZXJ3aXNlLCByZXR1cm4gdGhlIHJlc3BvbnNlIGRhdGEuXG4gKiBAcGFyYW0ge1Jlc3BvbnNlVHlwZX0gcmVzcCBUaGUgcmVzcG9uc2UgdG8gY2hlY2tcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZXNjcmlwdGlvbiBEZXNjcmlwdGlvbiB0byBpbmNsdWRlIGluIHRoZSB0aHJvd24gZXJyb3JcbiAqIEByZXR1cm4ge0R9IFRoZSByZXNwb25zZSBkYXRhLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRPazxELCBUPihyZXNwOiBSZXNwb25zZVR5cGU8RCwgVD4sIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogRCB7XG4gIGlmIChyZXNwLmVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVyclJlc3BvbnNlKHtcbiAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgbWVzc2FnZTogKHJlc3AuZXJyb3IgYXMgYW55KS5tZXNzYWdlLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHN0YXR1c1RleHQ6IHJlc3AucmVzcG9uc2U/LnN0YXR1c1RleHQsXG4gICAgICBzdGF0dXM6IHJlc3AucmVzcG9uc2U/LnN0YXR1cyxcbiAgICB9KTtcbiAgfVxuICBpZiAocmVzcC5kYXRhID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXNwb25zZSBkYXRhIGlzIHVuZGVmaW5lZFwiKTtcbiAgfVxuICByZXR1cm4gcmVzcC5kYXRhO1xufVxuIl19