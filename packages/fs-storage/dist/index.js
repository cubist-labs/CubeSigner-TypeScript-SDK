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
exports.defaultSignerSessionManager = exports.defaultManagementSessionManager = exports.SIGNER_SESSION_PATH = exports.MANAGEMENT_SESSION_PATH = exports.CONFIG_DIR = exports.JsonFileSessionManager = void 0;
const path_1 = __importDefault(require("path"));
const _1 = require(".");
/** Session storage */
var file_storage_1 = require("./file_storage");
Object.defineProperty(exports, "JsonFileSessionManager", { enumerable: true, get: function () { return file_storage_1.JsonFileSessionManager; } });
/**
 * Directory where CubeSigner stores config files.
 * @return {string} Config dir
 */
function configDir() {
    const configDir = process.platform === "darwin"
        ? `${process.env.HOME}/Library/Application Support`
        : `${process.env.HOME}/.config`;
    return path_1.default.join(configDir, "cubesigner");
}
/** Directory where CubeSigner stores config files. */
exports.CONFIG_DIR = configDir();
/** Default file path where the management session token is stored. */
exports.MANAGEMENT_SESSION_PATH = path_1.default.join(exports.CONFIG_DIR, "management-session.json");
/** Default file path where the signer session token is stored. */
exports.SIGNER_SESSION_PATH = path_1.default.join(exports.CONFIG_DIR, "signer-session.json");
/**
 * @return {JsonFileSessionManager} Manager pointing to the default management session file on disk.
 */
function defaultManagementSessionManager() {
    return new _1.JsonFileSessionManager(exports.MANAGEMENT_SESSION_PATH);
}
exports.defaultManagementSessionManager = defaultManagementSessionManager;
/**
 * @return {JsonFileSessionManager} Manager pointing to the default signer session file on disk.
 */
function defaultSignerSessionManager() {
    return new _1.JsonFileSessionManager(exports.SIGNER_SESSION_PATH);
}
exports.defaultSignerSessionManager = defaultSignerSessionManager;
/** Utils for processing org events */
__exportStar(require("./org_event_processor"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsd0JBQTJDO0FBRTNDLHNCQUFzQjtBQUN0QiwrQ0FBa0Y7QUFBekUsc0hBQUEsc0JBQXNCLE9BQTBCO0FBRXpEOzs7R0FHRztBQUNILFNBQVMsU0FBUztJQUNoQixNQUFNLFNBQVMsR0FDYixPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVE7UUFDM0IsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDhCQUE4QjtRQUNuRCxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDO0lBQ3BDLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVELHNEQUFzRDtBQUN6QyxRQUFBLFVBQVUsR0FBRyxTQUFTLEVBQUUsQ0FBQztBQUV0QyxzRUFBc0U7QUFDekQsUUFBQSx1QkFBdUIsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFVLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUV4RixrRUFBa0U7QUFDckQsUUFBQSxtQkFBbUIsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUVoRjs7R0FFRztBQUNILFNBQWdCLCtCQUErQjtJQUM3QyxPQUFPLElBQUkseUJBQXNCLENBQUMsK0JBQXVCLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsMEVBRUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLDJCQUEyQjtJQUN6QyxPQUFPLElBQUkseUJBQXNCLENBQUMsMkJBQW1CLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRkQsa0VBRUM7QUFFRCxzQ0FBc0M7QUFDdEMsd0RBQXNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLlwiO1xuXG4vKiogU2Vzc2lvbiBzdG9yYWdlICovXG5leHBvcnQgeyBKc29uRmlsZVNlc3Npb25NYW5hZ2VyIGFzIEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9maWxlX3N0b3JhZ2VcIjtcblxuLyoqXG4gKiBEaXJlY3Rvcnkgd2hlcmUgQ3ViZVNpZ25lciBzdG9yZXMgY29uZmlnIGZpbGVzLlxuICogQHJldHVybiB7c3RyaW5nfSBDb25maWcgZGlyXG4gKi9cbmZ1bmN0aW9uIGNvbmZpZ0RpcigpOiBzdHJpbmcge1xuICBjb25zdCBjb25maWdEaXIgPVxuICAgIHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCJcbiAgICAgID8gYCR7cHJvY2Vzcy5lbnYuSE9NRX0vTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0YFxuICAgICAgOiBgJHtwcm9jZXNzLmVudi5IT01FfS8uY29uZmlnYDtcbiAgcmV0dXJuIHBhdGguam9pbihjb25maWdEaXIsIFwiY3ViZXNpZ25lclwiKTtcbn1cblxuLyoqIERpcmVjdG9yeSB3aGVyZSBDdWJlU2lnbmVyIHN0b3JlcyBjb25maWcgZmlsZXMuICovXG5leHBvcnQgY29uc3QgQ09ORklHX0RJUiA9IGNvbmZpZ0RpcigpO1xuXG4vKiogRGVmYXVsdCBmaWxlIHBhdGggd2hlcmUgdGhlIG1hbmFnZW1lbnQgc2Vzc2lvbiB0b2tlbiBpcyBzdG9yZWQuICovXG5leHBvcnQgY29uc3QgTUFOQUdFTUVOVF9TRVNTSU9OX1BBVEggPSBwYXRoLmpvaW4oQ09ORklHX0RJUiwgXCJtYW5hZ2VtZW50LXNlc3Npb24uanNvblwiKTtcblxuLyoqIERlZmF1bHQgZmlsZSBwYXRoIHdoZXJlIHRoZSBzaWduZXIgc2Vzc2lvbiB0b2tlbiBpcyBzdG9yZWQuICovXG5leHBvcnQgY29uc3QgU0lHTkVSX1NFU1NJT05fUEFUSCA9IHBhdGguam9pbihDT05GSUdfRElSLCBcInNpZ25lci1zZXNzaW9uLmpzb25cIik7XG5cbi8qKlxuICogQHJldHVybiB7SnNvbkZpbGVTZXNzaW9uTWFuYWdlcn0gTWFuYWdlciBwb2ludGluZyB0byB0aGUgZGVmYXVsdCBtYW5hZ2VtZW50IHNlc3Npb24gZmlsZSBvbiBkaXNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdE1hbmFnZW1lbnRTZXNzaW9uTWFuYWdlcigpOiBKc29uRmlsZVNlc3Npb25NYW5hZ2VyIHtcbiAgcmV0dXJuIG5ldyBKc29uRmlsZVNlc3Npb25NYW5hZ2VyKE1BTkFHRU1FTlRfU0VTU0lPTl9QQVRIKTtcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtKc29uRmlsZVNlc3Npb25NYW5hZ2VyfSBNYW5hZ2VyIHBvaW50aW5nIHRvIHRoZSBkZWZhdWx0IHNpZ25lciBzZXNzaW9uIGZpbGUgb24gZGlzay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRTaWduZXJTZXNzaW9uTWFuYWdlcigpOiBKc29uRmlsZVNlc3Npb25NYW5hZ2VyIHtcbiAgcmV0dXJuIG5ldyBKc29uRmlsZVNlc3Npb25NYW5hZ2VyKFNJR05FUl9TRVNTSU9OX1BBVEgpO1xufVxuXG4vKiogVXRpbHMgZm9yIHByb2Nlc3Npbmcgb3JnIGV2ZW50cyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vb3JnX2V2ZW50X3Byb2Nlc3NvclwiO1xuIl19