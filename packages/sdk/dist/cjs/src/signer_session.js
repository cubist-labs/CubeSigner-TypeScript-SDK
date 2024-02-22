"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _SignerSessionInfo_csc, _SignerSessionInfo_sessionId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerSession = exports.SignerSessionInfo = void 0;
const client_1 = require("./client");
const key_1 = require("./key");
const signer_session_manager_1 = require("./session/signer_session_manager");
/** Signer session info. Can only be used to revoke a token, but not for authentication. */
class SignerSessionInfo {
    /** Revoke this session */
    async revoke() {
        await __classPrivateFieldGet(this, _SignerSessionInfo_csc, "f").sessionRevoke(__classPrivateFieldGet(this, _SignerSessionInfo_sessionId, "f"));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Internal constructor.
     * @param {CubeSignerClient} cs CubeSigner instance to use when calling `revoke`
     * @param {string} sessionId The ID of the session; can be used for revocation but not for auth
     * @param {string} purpose Session purpose
     * @internal
     */
    constructor(cs, sessionId, purpose) {
        _SignerSessionInfo_csc.set(this, void 0);
        _SignerSessionInfo_sessionId.set(this, void 0);
        __classPrivateFieldSet(this, _SignerSessionInfo_csc, cs, "f");
        __classPrivateFieldSet(this, _SignerSessionInfo_sessionId, sessionId, "f");
        this.purpose = purpose;
    }
}
exports.SignerSessionInfo = SignerSessionInfo;
_SignerSessionInfo_csc = new WeakMap(), _SignerSessionInfo_sessionId = new WeakMap();
/**
 * Signer session.
 * Extends {@link CubeSignerClient} and provides a few convenience methods on top.
 */
class SignerSession extends client_1.CubeSignerClient {
    /**
     * Loads an existing signer session from storage.
     * @param {SignerSessionStorage} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session
     */
    static async loadSignerSession(storage) {
        const manager = await signer_session_manager_1.SignerSessionManager.loadFromStorage(storage);
        return new SignerSession(manager);
    }
    /**
     * Constructor.
     * @param {SignerSessionManager} sessionMgr The session manager to use
     * @internal
     */
    constructor(sessionMgr) {
        super(sessionMgr);
    }
    /**
     * Returns the list of keys that this token grants access to.
     * @return {KeyInfo[]} The list of keys.
     */
    async keys() {
        const keys = await this.sessionKeysList();
        return keys.map((k) => (0, key_1.toKeyInfo)(k));
    }
}
exports.SignerSession = SignerSession;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQTRDO0FBQzVDLCtCQUEyQztBQUMzQyw2RUFBOEY7QUFFOUYsMkZBQTJGO0FBQzNGLE1BQWEsaUJBQWlCO0lBSzVCLDBCQUEwQjtJQUMxQixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sdUJBQUEsSUFBSSw4QkFBSyxDQUFDLGFBQWEsQ0FBQyx1QkFBQSxJQUFJLG9DQUFXLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFFN0U7Ozs7OztPQU1HO0lBQ0gsWUFBWSxFQUFvQixFQUFFLFNBQWlCLEVBQUUsT0FBZTtRQXBCM0QseUNBQXVCO1FBQ3ZCLCtDQUFtQjtRQW9CMUIsdUJBQUEsSUFBSSwwQkFBUSxFQUFFLE1BQUEsQ0FBQztRQUNmLHVCQUFBLElBQUksZ0NBQWMsU0FBUyxNQUFBLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztDQUNGO0FBMUJELDhDQTBCQzs7QUFFRDs7O0dBR0c7QUFDSCxNQUFhLGFBQWMsU0FBUSx5QkFBZ0I7SUFDakQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBNkI7UUFDMUQsTUFBTSxPQUFPLEdBQUcsTUFBTSw2Q0FBb0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEUsT0FBTyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksVUFBZ0M7UUFDMUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsSUFBSTtRQUNSLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBQSxlQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0Y7QUE1QkQsc0NBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgS2V5SW5mbywgdG9LZXlJbmZvIH0gZnJvbSBcIi4va2V5XCI7XG5pbXBvcnQgeyBTaWduZXJTZXNzaW9uTWFuYWdlciwgU2lnbmVyU2Vzc2lvblN0b3JhZ2UgfSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcblxuLyoqIFNpZ25lciBzZXNzaW9uIGluZm8uIENhbiBvbmx5IGJlIHVzZWQgdG8gcmV2b2tlIGEgdG9rZW4sIGJ1dCBub3QgZm9yIGF1dGhlbnRpY2F0aW9uLiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lclNlc3Npb25JbmZvIHtcbiAgcmVhZG9ubHkgI2NzYzogQ3ViZVNpZ25lckNsaWVudDtcbiAgcmVhZG9ubHkgI3Nlc3Npb25JZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgcHVycG9zZTogc3RyaW5nO1xuXG4gIC8qKiBSZXZva2UgdGhpcyBzZXNzaW9uICovXG4gIGFzeW5jIHJldm9rZSgpIHtcbiAgICBhd2FpdCB0aGlzLiNjc2Muc2Vzc2lvblJldm9rZSh0aGlzLiNzZXNzaW9uSWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudH0gY3MgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2Ugd2hlbiBjYWxsaW5nIGByZXZva2VgXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZXNzaW9uSWQgVGhlIElEIG9mIHRoZSBzZXNzaW9uOyBjYW4gYmUgdXNlZCBmb3IgcmV2b2NhdGlvbiBidXQgbm90IGZvciBhdXRoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFNlc3Npb24gcHVycG9zZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyQ2xpZW50LCBzZXNzaW9uSWQ6IHN0cmluZywgcHVycG9zZTogc3RyaW5nKSB7XG4gICAgdGhpcy4jY3NjID0gY3M7XG4gICAgdGhpcy4jc2Vzc2lvbklkID0gc2Vzc2lvbklkO1xuICAgIHRoaXMucHVycG9zZSA9IHB1cnBvc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBTaWduZXIgc2Vzc2lvbi5cbiAqIEV4dGVuZHMge0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGFuZCBwcm92aWRlcyBhIGZldyBjb252ZW5pZW5jZSBtZXRob2RzIG9uIHRvcC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lclNlc3Npb24gZXh0ZW5kcyBDdWJlU2lnbmVyQ2xpZW50IHtcbiAgLyoqXG4gICAqIExvYWRzIGFuIGV4aXN0aW5nIHNpZ25lciBzZXNzaW9uIGZyb20gc3RvcmFnZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvbiBzdG9yYWdlIHRvIHVzZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpbmdlclNlc3Npb24+fSBOZXcgc2lnbmVyIHNlc3Npb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBsb2FkU2lnbmVyU2Vzc2lvbihzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8U2lnbmVyU2Vzc2lvbj4ge1xuICAgIGNvbnN0IG1hbmFnZXIgPSBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZSk7XG4gICAgcmV0dXJuIG5ldyBTaWduZXJTZXNzaW9uKG1hbmFnZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25NYW5hZ2VyfSBzZXNzaW9uTWdyIFRoZSBzZXNzaW9uIG1hbmFnZXIgdG8gdXNlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbk1ncjogU2lnbmVyU2Vzc2lvbk1hbmFnZXIpIHtcbiAgICBzdXBlcihzZXNzaW9uTWdyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBsaXN0IG9mIGtleXMgdGhhdCB0aGlzIHRva2VuIGdyYW50cyBhY2Nlc3MgdG8uXG4gICAqIEByZXR1cm4ge0tleUluZm9bXX0gVGhlIGxpc3Qgb2Yga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXMoKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgdGhpcy5zZXNzaW9uS2V5c0xpc3QoKTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGspID0+IHRvS2V5SW5mbyhrKSk7XG4gIH1cbn1cbiJdfQ==