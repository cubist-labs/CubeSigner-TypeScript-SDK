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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.NAME = exports.userExportKeygen = exports.userExportDecrypt = exports.SessionExpiredEvent = void 0;
const package_json_1 = __importDefault(require("./../package.json"));
/** Errors */
__exportStar(require("./error"), exports);
/** API */
__exportStar(require("./client/api_client"), exports);
/** Client */
__exportStar(require("./client"), exports);
/** Callbacks */
var base_client_1 = require("./client/base_client");
Object.defineProperty(exports, "SessionExpiredEvent", { enumerable: true, get: function () { return base_client_1.SessionExpiredEvent; } });
/** Organizations */
__exportStar(require("./org"), exports);
/** Keys */
__exportStar(require("./key"), exports);
/** Events */
__exportStar(require("./events"), exports);
/** Roles */
__exportStar(require("./role"), exports);
/** Env */
__exportStar(require("./env"), exports);
/** Fido */
__exportStar(require("./mfa"), exports);
/** Pagination */
__exportStar(require("./paginator"), exports);
/** Response */
__exportStar(require("./response"), exports);
/** Types */
__exportStar(require("./schema_types"), exports);
/** Sessions */
__exportStar(require("./signer_session"), exports);
/** Session storage */
__exportStar(require("./client/session"), exports);
/** Utils */
__exportStar(require("./util"), exports);
/** User-export decryption helper */
var user_export_1 = require("./user_export");
Object.defineProperty(exports, "userExportDecrypt", { enumerable: true, get: function () { return user_export_1.userExportDecrypt; } });
Object.defineProperty(exports, "userExportKeygen", { enumerable: true, get: function () { return user_export_1.userExportKeygen; } });
/** Ethers.js helpers */
__exportStar(require("./evm"), exports);
/** CubeSigner SDK package name */
exports.NAME = package_json_1.default.name;
/** CubeSigner SDK version */
exports.VERSION = package_json_1.default.version;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxxRUFBb0M7QUFFcEMsYUFBYTtBQUNiLDBDQUF3QjtBQUN4QixVQUFVO0FBQ1Ysc0RBQW9DO0FBQ3BDLGFBQWE7QUFDYiwyQ0FBeUI7QUFDekIsZ0JBQWdCO0FBQ2hCLG9EQUF1RTtBQUFsRCxrSEFBQSxtQkFBbUIsT0FBQTtBQUN4QyxvQkFBb0I7QUFDcEIsd0NBQXNCO0FBQ3RCLFdBQVc7QUFDWCx3Q0FBc0I7QUFDdEIsYUFBYTtBQUNiLDJDQUF5QjtBQUN6QixZQUFZO0FBQ1oseUNBQXVCO0FBQ3ZCLFVBQVU7QUFDVix3Q0FBc0I7QUFDdEIsV0FBVztBQUNYLHdDQUFzQjtBQUN0QixpQkFBaUI7QUFDakIsOENBQTRCO0FBQzVCLGVBQWU7QUFDZiw2Q0FBMkI7QUFDM0IsWUFBWTtBQUNaLGlEQUErQjtBQUMvQixlQUFlO0FBQ2YsbURBQWlDO0FBQ2pDLHNCQUFzQjtBQUN0QixtREFBaUM7QUFDakMsWUFBWTtBQUNaLHlDQUF1QjtBQUN2QixvQ0FBb0M7QUFDcEMsNkNBQW9FO0FBQTNELGdIQUFBLGlCQUFpQixPQUFBO0FBQUUsK0dBQUEsZ0JBQWdCLE9BQUE7QUFDNUMsd0JBQXdCO0FBQ3hCLHdDQUFzQjtBQUV0QixrQ0FBa0M7QUFDckIsUUFBQSxJQUFJLEdBQVcsc0JBQUcsQ0FBQyxJQUFJLENBQUM7QUFFckMsNkJBQTZCO0FBQ2hCLFFBQUEsT0FBTyxHQUFXLHNCQUFHLENBQUMsT0FBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBrZyBmcm9tIFwiLi8uLi9wYWNrYWdlLmpzb25cIjtcblxuLyoqIEVycm9ycyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vZXJyb3JcIjtcbi8qKiBBUEkgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2NsaWVudC9hcGlfY2xpZW50XCI7XG4vKiogQ2xpZW50ICovXG5leHBvcnQgKiBmcm9tIFwiLi9jbGllbnRcIjtcbi8qKiBDYWxsYmFja3MgKi9cbmV4cG9ydCB7IEVycm9yRXZlbnQsIFNlc3Npb25FeHBpcmVkRXZlbnQgfSBmcm9tIFwiLi9jbGllbnQvYmFzZV9jbGllbnRcIjtcbi8qKiBPcmdhbml6YXRpb25zICovXG5leHBvcnQgKiBmcm9tIFwiLi9vcmdcIjtcbi8qKiBLZXlzICovXG5leHBvcnQgKiBmcm9tIFwiLi9rZXlcIjtcbi8qKiBFdmVudHMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2V2ZW50c1wiO1xuLyoqIFJvbGVzICovXG5leHBvcnQgKiBmcm9tIFwiLi9yb2xlXCI7XG4vKiogRW52ICovXG5leHBvcnQgKiBmcm9tIFwiLi9lbnZcIjtcbi8qKiBGaWRvICovXG5leHBvcnQgKiBmcm9tIFwiLi9tZmFcIjtcbi8qKiBQYWdpbmF0aW9uICovXG5leHBvcnQgKiBmcm9tIFwiLi9wYWdpbmF0b3JcIjtcbi8qKiBSZXNwb25zZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcmVzcG9uc2VcIjtcbi8qKiBUeXBlcyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG4vKiogU2Vzc2lvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG4vKiogU2Vzc2lvbiBzdG9yYWdlICovXG5leHBvcnQgKiBmcm9tIFwiLi9jbGllbnQvc2Vzc2lvblwiO1xuLyoqIFV0aWxzICovXG5leHBvcnQgKiBmcm9tIFwiLi91dGlsXCI7XG4vKiogVXNlci1leHBvcnQgZGVjcnlwdGlvbiBoZWxwZXIgKi9cbmV4cG9ydCB7IHVzZXJFeHBvcnREZWNyeXB0LCB1c2VyRXhwb3J0S2V5Z2VuIH0gZnJvbSBcIi4vdXNlcl9leHBvcnRcIjtcbi8qKiBFdGhlcnMuanMgaGVscGVycyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vZXZtXCI7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyBwYWNrYWdlIG5hbWUgKi9cbmV4cG9ydCBjb25zdCBOQU1FOiBzdHJpbmcgPSBwa2cubmFtZTtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHZlcnNpb24gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OOiBzdHJpbmcgPSBwa2cudmVyc2lvbjtcbiJdfQ==