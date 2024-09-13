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
exports.SIGNER_SESSION_PATH = exports.MANAGEMENT_SESSION_PATH = exports.CONFIG_DIR = exports.JsonFileSessionManager = void 0;
exports.defaultManagementSessionManager = defaultManagementSessionManager;
exports.defaultSignerSessionManager = defaultSignerSessionManager;
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
/**
 * @return {JsonFileSessionManager} Manager pointing to the default signer session file on disk.
 */
function defaultSignerSessionManager() {
    return new _1.JsonFileSessionManager(exports.SIGNER_SESSION_PATH);
}
/** Utils for processing org events */
__exportStar(require("./org_event_processor"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE4QkEsMEVBRUM7QUFLRCxrRUFFQztBQXZDRCxnREFBd0I7QUFDeEIsd0JBQTJDO0FBRTNDLHNCQUFzQjtBQUN0QiwrQ0FBa0Y7QUFBekUsc0hBQUEsc0JBQXNCLE9BQTBCO0FBRXpEOzs7R0FHRztBQUNILFNBQVMsU0FBUztJQUNoQixNQUFNLFNBQVMsR0FDYixPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVE7UUFDM0IsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDhCQUE4QjtRQUNuRCxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDO0lBQ3BDLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVELHNEQUFzRDtBQUN6QyxRQUFBLFVBQVUsR0FBRyxTQUFTLEVBQUUsQ0FBQztBQUV0QyxzRUFBc0U7QUFDekQsUUFBQSx1QkFBdUIsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFVLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUV4RixrRUFBa0U7QUFDckQsUUFBQSxtQkFBbUIsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUVoRjs7R0FFRztBQUNILFNBQWdCLCtCQUErQjtJQUM3QyxPQUFPLElBQUkseUJBQXNCLENBQUMsK0JBQXVCLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQiwyQkFBMkI7SUFDekMsT0FBTyxJQUFJLHlCQUFzQixDQUFDLDJCQUFtQixDQUFDLENBQUM7QUFDekQsQ0FBQztBQUVELHNDQUFzQztBQUN0Qyx3REFBc0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgSnNvbkZpbGVTZXNzaW9uTWFuYWdlciB9IGZyb20gXCIuXCI7XG5cbi8qKiBTZXNzaW9uIHN0b3JhZ2UgKi9cbmV4cG9ydCB7IEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIgYXMgSnNvbkZpbGVTZXNzaW9uTWFuYWdlciB9IGZyb20gXCIuL2ZpbGVfc3RvcmFnZVwiO1xuXG4vKipcbiAqIERpcmVjdG9yeSB3aGVyZSBDdWJlU2lnbmVyIHN0b3JlcyBjb25maWcgZmlsZXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IENvbmZpZyBkaXJcbiAqL1xuZnVuY3Rpb24gY29uZmlnRGlyKCk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbmZpZ0RpciA9XG4gICAgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIlxuICAgICAgPyBgJHtwcm9jZXNzLmVudi5IT01FfS9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnRgXG4gICAgICA6IGAke3Byb2Nlc3MuZW52LkhPTUV9Ly5jb25maWdgO1xuICByZXR1cm4gcGF0aC5qb2luKGNvbmZpZ0RpciwgXCJjdWJlc2lnbmVyXCIpO1xufVxuXG4vKiogRGlyZWN0b3J5IHdoZXJlIEN1YmVTaWduZXIgc3RvcmVzIGNvbmZpZyBmaWxlcy4gKi9cbmV4cG9ydCBjb25zdCBDT05GSUdfRElSID0gY29uZmlnRGlyKCk7XG5cbi8qKiBEZWZhdWx0IGZpbGUgcGF0aCB3aGVyZSB0aGUgbWFuYWdlbWVudCBzZXNzaW9uIHRva2VuIGlzIHN0b3JlZC4gKi9cbmV4cG9ydCBjb25zdCBNQU5BR0VNRU5UX1NFU1NJT05fUEFUSCA9IHBhdGguam9pbihDT05GSUdfRElSLCBcIm1hbmFnZW1lbnQtc2Vzc2lvbi5qc29uXCIpO1xuXG4vKiogRGVmYXVsdCBmaWxlIHBhdGggd2hlcmUgdGhlIHNpZ25lciBzZXNzaW9uIHRva2VuIGlzIHN0b3JlZC4gKi9cbmV4cG9ydCBjb25zdCBTSUdORVJfU0VTU0lPTl9QQVRIID0gcGF0aC5qb2luKENPTkZJR19ESVIsIFwic2lnbmVyLXNlc3Npb24uanNvblwiKTtcblxuLyoqXG4gKiBAcmV0dXJuIHtKc29uRmlsZVNlc3Npb25NYW5hZ2VyfSBNYW5hZ2VyIHBvaW50aW5nIHRvIHRoZSBkZWZhdWx0IG1hbmFnZW1lbnQgc2Vzc2lvbiBmaWxlIG9uIGRpc2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0TWFuYWdlbWVudFNlc3Npb25NYW5hZ2VyKCk6IEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIge1xuICByZXR1cm4gbmV3IEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIoTUFOQUdFTUVOVF9TRVNTSU9OX1BBVEgpO1xufVxuXG4vKipcbiAqIEByZXR1cm4ge0pzb25GaWxlU2Vzc2lvbk1hbmFnZXJ9IE1hbmFnZXIgcG9pbnRpbmcgdG8gdGhlIGRlZmF1bHQgc2lnbmVyIHNlc3Npb24gZmlsZSBvbiBkaXNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdFNpZ25lclNlc3Npb25NYW5hZ2VyKCk6IEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIge1xuICByZXR1cm4gbmV3IEpzb25GaWxlU2Vzc2lvbk1hbmFnZXIoU0lHTkVSX1NFU1NJT05fUEFUSCk7XG59XG5cbi8qKiBVdGlscyBmb3IgcHJvY2Vzc2luZyBvcmcgZXZlbnRzICovXG5leHBvcnQgKiBmcm9tIFwiLi9vcmdfZXZlbnRfcHJvY2Vzc29yXCI7XG4iXX0=