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
     * @param {ApiClient} apiClient The API client to use.
     * @param {string} sessionId The ID of the session; can be used for revocation but not for auth
     * @param {string} purpose Session purpose
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBRUEsMkZBQTJGO0FBQzNGLE1BQU0sT0FBTyxpQkFBaUI7SUFLNUIsMEJBQTBCO0lBQzFCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSx1QkFBQSxJQUFJLG9DQUFXLENBQUMsYUFBYSxDQUFDLHVCQUFBLElBQUksb0NBQVcsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUU3RTs7Ozs7O09BTUc7SUFDSCxZQUFZLFNBQW9CLEVBQUUsU0FBaUIsRUFBRSxPQUFlO1FBcEIzRCwrQ0FBc0I7UUFDdEIsK0NBQW1CO1FBb0IxQix1QkFBQSxJQUFJLGdDQUFjLFNBQVMsTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUksZ0NBQWMsU0FBUyxNQUFBLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBcGlDbGllbnQgfSBmcm9tIFwiLlwiO1xuXG4vKiogU2lnbmVyIHNlc3Npb24gaW5mby4gQ2FuIG9ubHkgYmUgdXNlZCB0byByZXZva2UgYSB0b2tlbiwgYnV0IG5vdCBmb3IgYXV0aGVudGljYXRpb24uICovXG5leHBvcnQgY2xhc3MgU2lnbmVyU2Vzc2lvbkluZm8ge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5ICNzZXNzaW9uSWQ6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHB1cnBvc2U6IHN0cmluZztcblxuICAvKiogUmV2b2tlIHRoaXMgc2Vzc2lvbiAqL1xuICBhc3luYyByZXZva2UoKSB7XG4gICAgYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnNlc3Npb25SZXZva2UodGhpcy4jc2Vzc2lvbklkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlc3Npb25JZCBUaGUgSUQgb2YgdGhlIHNlc3Npb247IGNhbiBiZSB1c2VkIGZvciByZXZvY2F0aW9uIGJ1dCBub3QgZm9yIGF1dGhcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1cnBvc2UgU2Vzc2lvbiBwdXJwb3NlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIHNlc3Npb25JZDogc3RyaW5nLCBwdXJwb3NlOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy4jc2Vzc2lvbklkID0gc2Vzc2lvbklkO1xuICAgIHRoaXMucHVycG9zZSA9IHB1cnBvc2U7XG4gIH1cbn1cbiJdfQ==