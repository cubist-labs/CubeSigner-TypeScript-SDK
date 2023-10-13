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
exports.CubeSignerDefaults = void 0;
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
/**
 * Defaults.
 */
class CubeSignerDefaults {
    /** Default signer-session.json file path
     * @return {string} Default signer-session.json file path
     */
    static signerSessionFile() {
        return path.join(configDir(), "signer-session.json");
    }
    /** Default management-session.json file path
     * @return {string} Default management-session.json file path
     */
    static managementSessionFile() {
        return path.join(configDir(), "management-session.json");
    }
}
exports.CubeSignerDefaults = CubeSignerDefaults;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L3Nlc3Npb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBRzdCOzs7R0FHRztBQUNILFNBQVMsU0FBUztJQUNoQixNQUFNLFNBQVMsR0FDYixPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVE7UUFDM0IsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDhCQUE4QjtRQUNuRCxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDO0lBQ3BDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxrQkFBa0I7SUFDN0I7O09BRUc7SUFDSCxNQUFNLENBQUMsaUJBQWlCO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxxQkFBcUI7UUFDMUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLHlCQUF5QixDQUFDLENBQUM7SUFDM0QsQ0FBQztDQUNGO0FBZEQsZ0RBY0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vc3JjL2VudlwiO1xuXG4vKipcbiAqIERpcmVjdG9yeSB3aGVyZSBDdWJlU2lnbmVyIHN0b3JlcyBjb25maWcgZmlsZXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IENvbmZpZyBkaXJcbiAqL1xuZnVuY3Rpb24gY29uZmlnRGlyKCk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbmZpZ0RpciA9XG4gICAgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIlxuICAgICAgPyBgJHtwcm9jZXNzLmVudi5IT01FfS9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnRgXG4gICAgICA6IGAke3Byb2Nlc3MuZW52LkhPTUV9Ly5jb25maWdgO1xuICByZXR1cm4gcGF0aC5qb2luKGNvbmZpZ0RpciwgXCJjdWJlc2lnbmVyXCIpO1xufVxuXG4vKipcbiAqIERlZmF1bHRzLlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lckRlZmF1bHRzIHtcbiAgLyoqIERlZmF1bHQgc2lnbmVyLXNlc3Npb24uanNvbiBmaWxlIHBhdGhcbiAgICogQHJldHVybiB7c3RyaW5nfSBEZWZhdWx0IHNpZ25lci1zZXNzaW9uLmpzb24gZmlsZSBwYXRoXG4gICAqL1xuICBzdGF0aWMgc2lnbmVyU2Vzc2lvbkZpbGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKGNvbmZpZ0RpcigpLCBcInNpZ25lci1zZXNzaW9uLmpzb25cIik7XG4gIH1cblxuICAvKiogRGVmYXVsdCBtYW5hZ2VtZW50LXNlc3Npb24uanNvbiBmaWxlIHBhdGhcbiAgICogQHJldHVybiB7c3RyaW5nfSBEZWZhdWx0IG1hbmFnZW1lbnQtc2Vzc2lvbi5qc29uIGZpbGUgcGF0aFxuICAgKi9cbiAgc3RhdGljIG1hbmFnZW1lbnRTZXNzaW9uRmlsZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXRoLmpvaW4oY29uZmlnRGlyKCksIFwibWFuYWdlbWVudC1zZXNzaW9uLmpzb25cIik7XG4gIH1cbn1cblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2Ygb3VyIFwibWFuYWdlbWVudCBzZXNzaW9uXCIgZmlsZSBmb3JtYXQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWFuYWdlbWVudFNlc3Npb24ge1xuICBlbWFpbDogc3RyaW5nO1xuICBpZF90b2tlbjogc3RyaW5nO1xuICBhY2Nlc3NfdG9rZW46IHN0cmluZztcbiAgcmVmcmVzaF90b2tlbjogc3RyaW5nO1xuICBleHBpcmF0aW9uOiBzdHJpbmc7XG4gIGVudjoge1xuICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IEVudkludGVyZmFjZTtcbiAgfTtcbn1cblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2Ygb3VyIFwic2lnbmVyIHNlc3Npb25cIiBmaWxlIGZvcm1hdCAqL1xuZXhwb3J0IGludGVyZmFjZSBTaWduZXJTZXNzaW9uIHtcbiAgb3JnX2lkOiBzdHJpbmc7XG4gIHJvbGVfaWQ6IHN0cmluZztcbiAgcHVycG9zZTogc3RyaW5nO1xuICB0b2tlbjogc3RyaW5nO1xuICBlbnY6IHtcbiAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBFbnZJbnRlcmZhY2U7XG4gIH07XG59XG4iXX0=