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
exports.loadSignerSession = exports.defaultSignerSessionStorage = exports.loadManagementSession = exports.defaultManagementSessionStorage = exports.SIGNER_SESSION_PATH = exports.MANAGEMENT_SESSION_PATH = exports.CONFIG_DIR = exports.JsonFileSessionStorage = void 0;
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const file_storage_1 = require("./file_storage");
const path_1 = __importDefault(require("path"));
/** Session storage */
var file_storage_2 = require("./file_storage");
Object.defineProperty(exports, "JsonFileSessionStorage", { enumerable: true, get: function () { return file_storage_2.JsonFileSessionStorage; } });
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
 * @return {SignerSessionStorage} Storage pointing to the default management session file on disk.
 */
function defaultManagementSessionStorage() {
    return new file_storage_1.JsonFileSessionStorage(exports.MANAGEMENT_SESSION_PATH);
}
exports.defaultManagementSessionStorage = defaultManagementSessionStorage;
/**
 * @return {Promise<CubeSignerClient>} Existing management session from the default file on disk.
 */
async function loadManagementSession() {
    return await cubesigner_sdk_1.CubeSignerClient.loadManagementSession(defaultManagementSessionStorage());
}
exports.loadManagementSession = loadManagementSession;
/**
 * @return {SignerSessionStorage} Storage pointing to the default signer session file on disk.
 */
function defaultSignerSessionStorage() {
    return new file_storage_1.JsonFileSessionStorage(exports.SIGNER_SESSION_PATH);
}
exports.defaultSignerSessionStorage = defaultSignerSessionStorage;
/**
 * @return {Promise<SignerSession>} Existing signer session from a default file on disk.
 */
async function loadSignerSession() {
    return await cubesigner_sdk_1.SignerSession.loadSignerSession(defaultSignerSessionStorage());
}
exports.loadSignerSession = loadSignerSession;
/** Utils for processing org events */
__exportStar(require("./org_event_processor"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnRUFBb0c7QUFDcEcsaURBQXdEO0FBQ3hELGdEQUF3QjtBQUV4QixzQkFBc0I7QUFDdEIsK0NBQXdEO0FBQS9DLHNIQUFBLHNCQUFzQixPQUFBO0FBRS9COzs7R0FHRztBQUNILFNBQVMsU0FBUztJQUNoQixNQUFNLFNBQVMsR0FDYixPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVE7UUFDM0IsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDhCQUE4QjtRQUNuRCxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDO0lBQ3BDLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVELHNEQUFzRDtBQUN6QyxRQUFBLFVBQVUsR0FBRyxTQUFTLEVBQUUsQ0FBQztBQUV0QyxzRUFBc0U7QUFDekQsUUFBQSx1QkFBdUIsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFVLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUV4RixrRUFBa0U7QUFDckQsUUFBQSxtQkFBbUIsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUVoRjs7R0FFRztBQUNILFNBQWdCLCtCQUErQjtJQUM3QyxPQUFPLElBQUkscUNBQXNCLENBQUMsK0JBQXVCLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsMEVBRUM7QUFFRDs7R0FFRztBQUNJLEtBQUssVUFBVSxxQkFBcUI7SUFDekMsT0FBTyxNQUFNLGlDQUFnQixDQUFDLHFCQUFxQixDQUFDLCtCQUErQixFQUFFLENBQUMsQ0FBQztBQUN6RixDQUFDO0FBRkQsc0RBRUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLDJCQUEyQjtJQUN6QyxPQUFPLElBQUkscUNBQXNCLENBQUMsMkJBQW1CLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRkQsa0VBRUM7QUFFRDs7R0FFRztBQUNJLEtBQUssVUFBVSxpQkFBaUI7SUFDckMsT0FBTyxNQUFNLDhCQUFhLENBQUMsaUJBQWlCLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDO0FBQzlFLENBQUM7QUFGRCw4Q0FFQztBQUVELHNDQUFzQztBQUN0Qyx3REFBc0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50LCBTaWduZXJTZXNzaW9uLCBTaWduZXJTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9maWxlX3N0b3JhZ2VcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8qKiBTZXNzaW9uIHN0b3JhZ2UgKi9cbmV4cG9ydCB7IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9maWxlX3N0b3JhZ2VcIjtcblxuLyoqXG4gKiBEaXJlY3Rvcnkgd2hlcmUgQ3ViZVNpZ25lciBzdG9yZXMgY29uZmlnIGZpbGVzLlxuICogQHJldHVybiB7c3RyaW5nfSBDb25maWcgZGlyXG4gKi9cbmZ1bmN0aW9uIGNvbmZpZ0RpcigpOiBzdHJpbmcge1xuICBjb25zdCBjb25maWdEaXIgPVxuICAgIHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCJcbiAgICAgID8gYCR7cHJvY2Vzcy5lbnYuSE9NRX0vTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0YFxuICAgICAgOiBgJHtwcm9jZXNzLmVudi5IT01FfS8uY29uZmlnYDtcbiAgcmV0dXJuIHBhdGguam9pbihjb25maWdEaXIsIFwiY3ViZXNpZ25lclwiKTtcbn1cblxuLyoqIERpcmVjdG9yeSB3aGVyZSBDdWJlU2lnbmVyIHN0b3JlcyBjb25maWcgZmlsZXMuICovXG5leHBvcnQgY29uc3QgQ09ORklHX0RJUiA9IGNvbmZpZ0RpcigpO1xuXG4vKiogRGVmYXVsdCBmaWxlIHBhdGggd2hlcmUgdGhlIG1hbmFnZW1lbnQgc2Vzc2lvbiB0b2tlbiBpcyBzdG9yZWQuICovXG5leHBvcnQgY29uc3QgTUFOQUdFTUVOVF9TRVNTSU9OX1BBVEggPSBwYXRoLmpvaW4oQ09ORklHX0RJUiwgXCJtYW5hZ2VtZW50LXNlc3Npb24uanNvblwiKTtcblxuLyoqIERlZmF1bHQgZmlsZSBwYXRoIHdoZXJlIHRoZSBzaWduZXIgc2Vzc2lvbiB0b2tlbiBpcyBzdG9yZWQuICovXG5leHBvcnQgY29uc3QgU0lHTkVSX1NFU1NJT05fUEFUSCA9IHBhdGguam9pbihDT05GSUdfRElSLCBcInNpZ25lci1zZXNzaW9uLmpzb25cIik7XG5cbi8qKlxuICogQHJldHVybiB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IFN0b3JhZ2UgcG9pbnRpbmcgdG8gdGhlIGRlZmF1bHQgbWFuYWdlbWVudCBzZXNzaW9uIGZpbGUgb24gZGlzay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRNYW5hZ2VtZW50U2Vzc2lvblN0b3JhZ2UoKTogU2lnbmVyU2Vzc2lvblN0b3JhZ2Uge1xuICByZXR1cm4gbmV3IEpzb25GaWxlU2Vzc2lvblN0b3JhZ2UoTUFOQUdFTUVOVF9TRVNTSU9OX1BBVEgpO1xufVxuXG4vKipcbiAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lckNsaWVudD59IEV4aXN0aW5nIG1hbmFnZW1lbnQgc2Vzc2lvbiBmcm9tIHRoZSBkZWZhdWx0IGZpbGUgb24gZGlzay5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRNYW5hZ2VtZW50U2Vzc2lvbigpOiBQcm9taXNlPEN1YmVTaWduZXJDbGllbnQ+IHtcbiAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJDbGllbnQubG9hZE1hbmFnZW1lbnRTZXNzaW9uKGRlZmF1bHRNYW5hZ2VtZW50U2Vzc2lvblN0b3JhZ2UoKSk7XG59XG5cbi8qKlxuICogQHJldHVybiB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IFN0b3JhZ2UgcG9pbnRpbmcgdG8gdGhlIGRlZmF1bHQgc2lnbmVyIHNlc3Npb24gZmlsZSBvbiBkaXNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdFNpZ25lclNlc3Npb25TdG9yYWdlKCk6IFNpZ25lclNlc3Npb25TdG9yYWdlIHtcbiAgcmV0dXJuIG5ldyBKc29uRmlsZVNlc3Npb25TdG9yYWdlKFNJR05FUl9TRVNTSU9OX1BBVEgpO1xufVxuXG4vKipcbiAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbj59IEV4aXN0aW5nIHNpZ25lciBzZXNzaW9uIGZyb20gYSBkZWZhdWx0IGZpbGUgb24gZGlzay5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRTaWduZXJTZXNzaW9uKCk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICByZXR1cm4gYXdhaXQgU2lnbmVyU2Vzc2lvbi5sb2FkU2lnbmVyU2Vzc2lvbihkZWZhdWx0U2lnbmVyU2Vzc2lvblN0b3JhZ2UoKSk7XG59XG5cbi8qKiBVdGlscyBmb3IgcHJvY2Vzc2luZyBvcmcgZXZlbnRzICovXG5leHBvcnQgKiBmcm9tIFwiLi9vcmdfZXZlbnRfcHJvY2Vzc29yXCI7XG4iXX0=