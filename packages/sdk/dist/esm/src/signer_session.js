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
import { CubeSignerClient } from "./client";
import { toKeyInfo } from "./key";
import { SignerSessionManager } from "./session/signer_session_manager";
/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export class SignerSessionInfo {
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
_SignerSessionInfo_csc = new WeakMap(), _SignerSessionInfo_sessionId = new WeakMap();
/**
 * Signer session.
 * Extends {@link CubeSignerClient} and provides a few convenience methods on top.
 */
export class SignerSession extends CubeSignerClient {
    /**
     * Loads an existing signer session from storage.
     * @param {SignerSessionStorage} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session
     */
    static async loadSignerSession(storage) {
        const manager = await SignerSessionManager.loadFromStorage(storage);
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
        return keys.map((k) => toKeyInfo(k));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyX3Nlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2lnbmVyX3Nlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQzVDLE9BQU8sRUFBVyxTQUFTLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFDM0MsT0FBTyxFQUFFLG9CQUFvQixFQUF3QixNQUFNLGtDQUFrQyxDQUFDO0FBRTlGLDJGQUEyRjtBQUMzRixNQUFNLE9BQU8saUJBQWlCO0lBSzVCLDBCQUEwQjtJQUMxQixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sdUJBQUEsSUFBSSw4QkFBSyxDQUFDLGFBQWEsQ0FBQyx1QkFBQSxJQUFJLG9DQUFXLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFFN0U7Ozs7OztPQU1HO0lBQ0gsWUFBWSxFQUFvQixFQUFFLFNBQWlCLEVBQUUsT0FBZTtRQXBCM0QseUNBQXVCO1FBQ3ZCLCtDQUFtQjtRQW9CMUIsdUJBQUEsSUFBSSwwQkFBUSxFQUFFLE1BQUEsQ0FBQztRQUNmLHVCQUFBLElBQUksZ0NBQWMsU0FBUyxNQUFBLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztDQUNGOztBQUVEOzs7R0FHRztBQUNILE1BQU0sT0FBTyxhQUFjLFNBQVEsZ0JBQWdCO0lBQ2pEOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE9BQTZCO1FBQzFELE1BQU0sT0FBTyxHQUFHLE1BQU0sb0JBQW9CLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxZQUFZLFVBQWdDO1FBQzFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLElBQUk7UUFDUixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMxQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IEtleUluZm8sIHRvS2V5SW5mbyB9IGZyb20gXCIuL2tleVwiO1xuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsIFNpZ25lclNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5cbi8qKiBTaWduZXIgc2Vzc2lvbiBpbmZvLiBDYW4gb25seSBiZSB1c2VkIHRvIHJldm9rZSBhIHRva2VuLCBidXQgbm90IGZvciBhdXRoZW50aWNhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXJTZXNzaW9uSW5mbyB7XG4gIHJlYWRvbmx5ICNjc2M6IEN1YmVTaWduZXJDbGllbnQ7XG4gIHJlYWRvbmx5ICNzZXNzaW9uSWQ6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHB1cnBvc2U6IHN0cmluZztcblxuICAvKiogUmV2b2tlIHRoaXMgc2Vzc2lvbiAqL1xuICBhc3luYyByZXZva2UoKSB7XG4gICAgYXdhaXQgdGhpcy4jY3NjLnNlc3Npb25SZXZva2UodGhpcy4jc2Vzc2lvbklkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNzIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIHdoZW4gY2FsbGluZyBgcmV2b2tlYFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2Vzc2lvbklkIFRoZSBJRCBvZiB0aGUgc2Vzc2lvbjsgY2FuIGJlIHVzZWQgZm9yIHJldm9jYXRpb24gYnV0IG5vdCBmb3IgYXV0aFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVycG9zZSBTZXNzaW9uIHB1cnBvc2VcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lckNsaWVudCwgc2Vzc2lvbklkOiBzdHJpbmcsIHB1cnBvc2U6IHN0cmluZykge1xuICAgIHRoaXMuI2NzYyA9IGNzO1xuICAgIHRoaXMuI3Nlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgICB0aGlzLnB1cnBvc2UgPSBwdXJwb3NlO1xuICB9XG59XG5cbi8qKlxuICogU2lnbmVyIHNlc3Npb24uXG4gKiBFeHRlbmRzIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBhbmQgcHJvdmlkZXMgYSBmZXcgY29udmVuaWVuY2UgbWV0aG9kcyBvbiB0b3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXJTZXNzaW9uIGV4dGVuZHMgQ3ViZVNpZ25lckNsaWVudCB7XG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBzaWduZXIgc2Vzc2lvbiBmcm9tIHN0b3JhZ2UuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb24gc3RvcmFnZSB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHNpZ25lciBzZXNzaW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPFNpZ25lclNlc3Npb24+IHtcbiAgICBjb25zdCBtYW5hZ2VyID0gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICAgIHJldHVybiBuZXcgU2lnbmVyU2Vzc2lvbihtYW5hZ2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTWFuYWdlcn0gc2Vzc2lvbk1nciBUaGUgc2Vzc2lvbiBtYW5hZ2VyIHRvIHVzZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlc3Npb25NZ3I6IFNpZ25lclNlc3Npb25NYW5hZ2VyKSB7XG4gICAgc3VwZXIoc2Vzc2lvbk1ncik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGlzdCBvZiBrZXlzIHRoYXQgdGhpcyB0b2tlbiBncmFudHMgYWNjZXNzIHRvLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvW119IFRoZSBsaXN0IG9mIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzKCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IHRoaXMuc2Vzc2lvbktleXNMaXN0KCk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiB0b0tleUluZm8oaykpO1xuICB9XG59XG4iXX0=