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
var _SignerSessionInfo_apiClient, _SignerSessionInfo_sessionId;
/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export class SignerSessionInfo {
    /** Revoke this session */
    async revoke() {
        await __classPrivateFieldGet(this, _SignerSessionInfo_apiClient, "f").sessionRevoke(__classPrivateFieldGet(this, _SignerSessionInfo_sessionId, "f"));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Internal constructor.
     *
     * @param apiClient The API client to use.
     * @param sessionId The ID of the session; can be used for revocation but not for auth
     * @param purpose Session purpose
     * @internal
     */
    constructor(apiClient, sessionId, purpose) {
        _SignerSessionInfo_apiClient.set(this, void 0);
        _SignerSessionInfo_sessionId.set(this, void 0);
        __classPrivateFieldSet(this, _SignerSessionInfo_apiClient, apiClient, "f");
        __classPrivateFieldSet(this, _SignerSessionInfo_sessionId, sessionId, "f");
        this.purpose = purpose;
    }
}
_SignerSessionInfo_apiClient = new WeakMap(), _SignerSessionInfo_sessionId = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBRUEsMkZBQTJGO0FBQzNGLE1BQU0sT0FBTyxpQkFBaUI7SUFLNUIsMEJBQTBCO0lBQzFCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSx1QkFBQSxJQUFJLG9DQUFXLENBQUMsYUFBYSxDQUFDLHVCQUFBLElBQUksb0NBQVcsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUU3RTs7Ozs7OztPQU9HO0lBQ0gsWUFBWSxTQUFvQixFQUFFLFNBQWlCLEVBQUUsT0FBZTtRQXJCM0QsK0NBQXNCO1FBQ3RCLCtDQUFtQjtRQXFCMUIsdUJBQUEsSUFBSSxnQ0FBYyxTQUFTLE1BQUEsQ0FBQztRQUM1Qix1QkFBQSxJQUFJLGdDQUFjLFNBQVMsTUFBQSxDQUFDO1FBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQXBpQ2xpZW50IH0gZnJvbSBcIi4vaW5kZXgudHNcIjtcblxuLyoqIFNpZ25lciBzZXNzaW9uIGluZm8uIENhbiBvbmx5IGJlIHVzZWQgdG8gcmV2b2tlIGEgdG9rZW4sIGJ1dCBub3QgZm9yIGF1dGhlbnRpY2F0aW9uLiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lclNlc3Npb25JbmZvIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSAjc2Vzc2lvbklkOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBwdXJwb3NlOiBzdHJpbmc7XG5cbiAgLyoqIFJldm9rZSB0aGlzIHNlc3Npb24gKi9cbiAgYXN5bmMgcmV2b2tlKCkge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uUmV2b2tlKHRoaXMuI3Nlc3Npb25JZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBzZXNzaW9uSWQgVGhlIElEIG9mIHRoZSBzZXNzaW9uOyBjYW4gYmUgdXNlZCBmb3IgcmV2b2NhdGlvbiBidXQgbm90IGZvciBhdXRoXG4gICAqIEBwYXJhbSBwdXJwb3NlIFNlc3Npb24gcHVycG9zZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBzZXNzaW9uSWQ6IHN0cmluZywgcHVycG9zZTogc3RyaW5nKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI3Nlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgICB0aGlzLnB1cnBvc2UgPSBwdXJwb3NlO1xuICB9XG59XG4iXX0=