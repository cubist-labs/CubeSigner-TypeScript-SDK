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
var _CubeSigner_env, _CubeSigner_csc;
import { envs } from "./env";
import { OidcClient } from "./api";
import { CubeSignerClient } from "./client";
import { Org } from "./org";
import { SignerSessionManager, } from "./session/signer_session_manager";
import { SignerSession } from "./signer_session";
import { name, version } from "./../package.json";
/**
 * CubeSigner client
 *
 * @deprecated Use {@link Org} or {@link CubeSignerClient} instead.
 */
export class CubeSigner {
    /**
     * Underlying {@link CubeSignerClient} instance, if set; otherwise throws.
     * @internal
     */
    get csc() {
        if (!__classPrivateFieldGet(this, _CubeSigner_csc, "f")) {
            throw new Error("CubeSignerClient is not set");
        }
        return __classPrivateFieldGet(this, _CubeSigner_csc, "f");
    }
    /** @return {EnvInterface} The CubeSigner environment of this client */
    get env() {
        return __classPrivateFieldGet(this, _CubeSigner_env, "f");
    }
    /** Organization ID */
    get orgId() {
        return this.csc.orgId;
    }
    /**
     * Set the organization ID
     * @param {string} orgId The new organization id.
     */
    setOrgId(orgId) {
        __classPrivateFieldSet(this, _CubeSigner_csc, this.csc.withOrg(orgId), "f");
    }
    /**
     * Loads an existing management session and creates a CubeSigner instance.
     *
     * @param {SignerSessionStorage} storage Session storage to load the session from.
     * @return {Promise<CubeSigner>} New CubeSigner instance
     */
    static async loadManagementSession(storage) {
        return new CubeSigner({
            sessionMgr: await SignerSessionManager.loadFromStorage(storage),
        });
    }
    /**
     * Loads a signer session from a session storage (e.g., session file).
     * @param {SignerSessionStorage} storage Session storage to load the session from.
     * @return {Promise<SignerSession>} New signer session
     */
    static async loadSignerSession(storage) {
        return await SignerSession.loadSignerSession(storage);
    }
    /**
     * Create a new CubeSigner instance.
     * @param {CubeSignerOptions} options The optional configuration options for the CubeSigner instance.
     */
    constructor(options) {
        _CubeSigner_env.set(this, void 0);
        _CubeSigner_csc.set(this, void 0);
        let env = options?.env;
        if (options?.sessionMgr) {
            this.sessionMgr = options.sessionMgr;
            env = env ?? this.sessionMgr.env;
        }
        __classPrivateFieldSet(this, _CubeSigner_env, env ?? envs["gamma"], "f");
        __classPrivateFieldSet(this, _CubeSigner_csc, new CubeSignerClient(
        // HACK: ignore that sessionMgr may be a CognitoSessionManager and pretend that it
        //       is a SignerSessionManager; that's fine because the CubeSignerClient will
        //       almost always just call `await token()` on it, which works in both cases.
        //
        // This is done here for backward compatibility reasons only; in the future,
        // we should deprecate this class and people should start using `CubeSingerClient` directly.
        options?.sessionMgr, options?.orgId), "f");
    }
    /**
     * Authenticate an OIDC user and create a new session manager for them.
     *
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {SignerSessionStorage?} storage Optional signer session storage (defaults to in-memory storage)
     * @return {Promise<SignerSessionManager>} The signer session manager
     */
    async oidcAuth(oidcToken, orgId, scopes, lifetimes, storage) {
        const resp = await this.oidcLogin(oidcToken, orgId, scopes, lifetimes);
        return await SignerSessionManager.createFromSessionInfo(this.env, orgId, resp.data(), storage);
    }
    /**
     * Retrieves information about the current user.
     *
     * @return {Promise<UserInfo>} User information.
     */
    async aboutMe() {
        return await this.csc.userGet();
    }
    /**
     * Retrieves existing MFA request.
     *
     * @param {string} orgId Organization ID
     * @param {string} mfaId MFA request ID
     * @return {Promise<MfaRequestInfo>} MFA request information
     */
    async mfaGet(orgId, mfaId) {
        return await this.csc.withOrg(orgId).mfaGet(mfaId);
    }
    /**
     * List pending MFA requests accessible to the current user.
     * @param {string} orgId Organization ID
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    async mfaList(orgId) {
        return await this.csc.withOrg(orgId).mfaList();
    }
    /**
     * Approve a pending MFA request.
     *
     * @param {string} orgId The org id of the MFA request
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    async mfaApprove(orgId, mfaId) {
        return await this.csc.withOrg(orgId).mfaApprove(mfaId);
    }
    /** Initiate adding a new FIDO device. MFA may be required. */
    get addFidoStart() {
        return this.csc.userFidoRegisterInit.bind(this.csc);
    }
    /**
     * Creates a request to change user's TOTP. This request returns a new TOTP challenge
     * that must be answered by calling `resetTotpComplete`
     */
    get resetTotpStart() {
        return this.csc.userTotpResetInit.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
    }
    /**
     * Answer the TOTP challenge issued by `resetTotpStart`. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.he TOTP configuration from the challenge.
     */
    get resetTotpComplete() {
        return this.csc.userTotpResetComplete.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     */
    get verifyTotp() {
        return this.csc.userTotpVerify.bind(__classPrivateFieldGet(this, _CubeSigner_csc, "f"));
    }
    /**
     * Retrieve information about an organization.
     * @param {string} orgId The ID or name of the organization.
     * @return {Org} The organization.
     */
    async getOrg(orgId) {
        return new Org(this.csc.sessionMgr, orgId ?? this.csc.orgId);
    }
    /**
     * Deletes a given key.
     * @param {string} orgId - Organization id
     * @param {string} keyId - Key id
     */
    async deleteKey(orgId, keyId) {
        await this.csc.withOrg(orgId).keyDelete(keyId);
    }
    /**
     * Get the management client.
     * @return {Client} The client.
     * @internal
     */
    async management() {
        if (!this.sessionMgr) {
            throw new Error("No management session loaded");
        }
        return await this.sessionMgr.client();
    }
    /**
     * Obtain a proof of authentication.
     *
     * @param {string} orgId The id of the organization that the user is in
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async proveIdentity(orgId) {
        return await this.csc.withOrg(orgId).identityProve();
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async oidcProveIdentity(oidcToken, orgId) {
        const oidcClient = new OidcClient(__classPrivateFieldGet(this, _CubeSigner_env, "f"), orgId, oidcToken);
        return await oidcClient.identityProve();
    }
    /**
     * Checks if a given identity proof is valid.
     *
     * @param {string} orgId The id of the organization that the user is in.
     * @param {IdentityProof} identityProof The proof of authentication.
     */
    async verifyIdentity(orgId, identityProof) {
        await this.csc.withOrg(orgId).identityVerify(identityProof);
    }
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     * @param {string} oidcToken The OIDC token
     * @param {string} orgId The id of the organization that the user is in
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<CubeSignerResponse<SignerSessionData>>} The session data.
     */
    async oidcLogin(oidcToken, orgId, scopes, lifetimes, mfaReceipt) {
        const oidcClient = new OidcClient(__classPrivateFieldGet(this, _CubeSigner_env, "f"), orgId, oidcToken);
        return await oidcClient.sessionCreate(scopes, lifetimes, mfaReceipt);
    }
}
_CubeSigner_env = new WeakMap(), _CubeSigner_csc = new WeakMap();
/** Errors */
export * from "./error";
/** API */
export * from "./api";
/** Client */
export * from "./client";
/** Callbacks */
export { Events, GlobalEvents } from "./events";
/** Organizations */
export * from "./org";
/** Keys */
export * from "./key";
/** Roles */
export * from "./role";
/** Env */
export * from "./env";
/** Fido */
export * from "./mfa";
/** Pagination */
export * from "./paginator";
/** Response */
export * from "./response";
/** Types */
export * from "./schema_types";
/** Sessions */
export * from "./signer_session";
/** Session storage */
export * from "./session/session_storage";
/** Signer session manager */
export * from "./session/signer_session_manager";
/** Utils */
export * from "./util";
/** User-export decryption helper */
export { userExportDecrypt, userExportKeygen } from "./user_export";
/** CubeSigner SDK package name */
export const NAME = name;
/** CubeSigner SDK version */
export const VERSION = version;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxFQUFFLElBQUksRUFBZ0IsTUFBTSxPQUFPLENBQUM7QUFDM0MsT0FBTyxFQUFVLFVBQVUsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUMzQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDNUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUU1QixPQUFPLEVBRUwsb0JBQW9CLEdBRXJCLE1BQU0sa0NBQWtDLENBQUM7QUFFMUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRWpELE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFhbEQ7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxVQUFVO0lBS3JCOzs7T0FHRztJQUNILElBQUksR0FBRztRQUNMLElBQUksQ0FBQyx1QkFBQSxJQUFJLHVCQUFLLEVBQUUsQ0FBQztZQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBQ0QsT0FBTyx1QkFBQSxJQUFJLHVCQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVELHVFQUF1RTtJQUN2RSxJQUFJLEdBQUc7UUFDTCxPQUFPLHVCQUFBLElBQUksdUJBQUssQ0FBQztJQUNuQixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7SUFDeEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILFFBQVEsQ0FBQyxLQUFhO1FBQ3BCLHVCQUFBLElBQUksbUJBQVEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQUEsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7Ozs7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Q0FBQztBQUN0QixpQkFBaUI7QUFDakIsY0FBYyxhQUFhLENBQUM7QUFDNUIsZUFBZTtBQUNmLGNBQWMsWUFBWSxDQUFDO0FBQzNCLFlBQVk7QUFDWixjQUFjLGdCQUFnQixDQUFDO0FBQy9CLGVBQWU7QUFDZixjQUFjLGtCQUFrQixDQUFDO0FBQ2pDLHNCQUFzQjtBQUN0QixjQUFjLDJCQUEyQixDQUFDO0FBQzFDLDZCQUE2QjtBQUM3QixjQUFjLGtDQUFrQyxDQUFDO0FBQ2pELFlBQVk7QUFDWixjQUFjLFFBQVEsQ0FBQztBQUN2QixvQ0FBb0M7QUFDcEMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXBFLGtDQUFrQztBQUNsQyxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQVcsSUFBSSxDQUFDO0FBRWpDLDZCQUE2QjtBQUM3QixNQUFNLENBQUMsTUFBTSxPQUFPLEdBQVcsT0FBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZW52cywgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4vZW52XCI7XG5pbXBvcnQgeyBDbGllbnQsIE9pZGNDbGllbnQgfSBmcm9tIFwiLi9hcGlcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IE9yZyB9IGZyb20gXCIuL29yZ1wiO1xuXG5pbXBvcnQge1xuICBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG4gIFNpZ25lclNlc3Npb25EYXRhLFxufSBmcm9tIFwiLi9zZXNzaW9uL3NpZ25lcl9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJSZXNwb25zZSB9IGZyb20gXCIuL3Jlc3BvbnNlXCI7XG5pbXBvcnQgeyBTaWduZXJTZXNzaW9uIH0gZnJvbSBcIi4vc2lnbmVyX3Nlc3Npb25cIjtcbmltcG9ydCB7IE1mYVJlY2VpcHQgfSBmcm9tIFwiLi9tZmFcIjtcbmltcG9ydCB7IG5hbWUsIHZlcnNpb24gfSBmcm9tIFwiLi8uLi9wYWNrYWdlLmpzb25cIjtcbmltcG9ydCB7IElkZW50aXR5UHJvb2YsIE1mYVJlcXVlc3RJbmZvLCBSYXRjaGV0Q29uZmlnLCBVc2VySW5mbyB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuXG4vKiogQ3ViZVNpZ25lciBjb25zdHJ1Y3RvciBvcHRpb25zICovXG5leHBvcnQgaW50ZXJmYWNlIEN1YmVTaWduZXJPcHRpb25zIHtcbiAgLyoqIFRoZSBlbnZpcm9ubWVudCB0byB1c2UgKi9cbiAgZW52PzogRW52SW50ZXJmYWNlO1xuICAvKiogVGhlIG1hbmFnZW1lbnQgYXV0aG9yaXphdGlvbiB0b2tlbiAqL1xuICBzZXNzaW9uTWdyPzogU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG4gIC8qKiBPcHRpb25hbCBvcmdhbml6YXRpb24gaWQgKi9cbiAgb3JnSWQ/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ3ViZVNpZ25lciBjbGllbnRcbiAqXG4gKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIE9yZ30gb3Ige0BsaW5rIEN1YmVTaWduZXJDbGllbnR9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdWJlU2lnbmVyIHtcbiAgcmVhZG9ubHkgI2VudjogRW52SW50ZXJmYWNlO1xuICByZWFkb25seSBzZXNzaW9uTWdyPzogU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG4gICNjc2M/OiBDdWJlU2lnbmVyQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBVbmRlcmx5aW5nIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBpbnN0YW5jZSwgaWYgc2V0OyBvdGhlcndpc2UgdGhyb3dzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBjc2MoKTogQ3ViZVNpZ25lckNsaWVudCB7XG4gICAgaWYgKCF0aGlzLiNjc2MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1YmVTaWduZXJDbGllbnQgaXMgbm90IHNldFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2NzYztcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtFbnZJbnRlcmZhY2V9IFRoZSBDdWJlU2lnbmVyIGVudmlyb25tZW50IG9mIHRoaXMgY2xpZW50ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy4jZW52O1xuICB9XG5cbiAgLyoqIE9yZ2FuaXphdGlvbiBJRCAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3NjLm9yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgb3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgbmV3IG9yZ2FuaXphdGlvbiBpZC5cbiAgICovXG4gIHNldE9yZ0lkKG9yZ0lkOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNjc2MgPSB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBtYW5hZ2VtZW50IHNlc3Npb24gYW5kIGNyZWF0ZXMgYSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFNlc3Npb24gc3RvcmFnZSB0byBsb2FkIHRoZSBzZXNzaW9uIGZyb20uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lcj59IE5ldyBDdWJlU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZE1hbmFnZW1lbnRTZXNzaW9uKHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxDdWJlU2lnbmVyPiB7XG4gICAgcmV0dXJuIG5ldyBDdWJlU2lnbmVyKDxDdWJlU2lnbmVyT3B0aW9ucz57XG4gICAgICBzZXNzaW9uTWdyOiBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSBzaWduZXIgc2Vzc2lvbiBmcm9tIGEgc2Vzc2lvbiBzdG9yYWdlIChlLmcuLCBzZXNzaW9uIGZpbGUpLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFNlc3Npb24gc3RvcmFnZSB0byBsb2FkIHRoZSBzZXNzaW9uIGZyb20uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbj59IE5ldyBzaWduZXIgc2Vzc2lvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRTaWduZXJTZXNzaW9uKHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uPiB7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb24ubG9hZFNpZ25lclNlc3Npb24oc3RvcmFnZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogQ3ViZVNpZ25lck9wdGlvbnMpIHtcbiAgICBsZXQgZW52ID0gb3B0aW9ucz8uZW52O1xuICAgIGlmIChvcHRpb25zPy5zZXNzaW9uTWdyKSB7XG4gICAgICB0aGlzLnNlc3Npb25NZ3IgPSBvcHRpb25zLnNlc3Npb25NZ3I7XG4gICAgICBlbnYgPSBlbnYgPz8gdGhpcy5zZXNzaW9uTWdyLmVudjtcbiAgICB9XG4gICAgdGhpcy4jZW52ID0gZW52ID8/IGVudnNbXCJnYW1tYVwiXTtcbiAgICB0aGlzLiNjc2MgPSBuZXcgQ3ViZVNpZ25lckNsaWVudChcbiAgICAgIC8vIEhBQ0s6IGlnbm9yZSB0aGF0IHNlc3Npb25NZ3IgbWF5IGJlIGEgQ29nbml0b1Nlc3Npb25NYW5hZ2VyIGFuZCBwcmV0ZW5kIHRoYXQgaXRcbiAgICAgIC8vICAgICAgIGlzIGEgU2lnbmVyU2Vzc2lvbk1hbmFnZXI7IHRoYXQncyBmaW5lIGJlY2F1c2UgdGhlIEN1YmVTaWduZXJDbGllbnQgd2lsbFxuICAgICAgLy8gICAgICAgYWxtb3N0IGFsd2F5cyBqdXN0IGNhbGwgYGF3YWl0IHRva2VuKClgIG9uIGl0LCB3aGljaCB3b3JrcyBpbiBib3RoIGNhc2VzLlxuICAgICAgLy9cbiAgICAgIC8vIFRoaXMgaXMgZG9uZSBoZXJlIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHJlYXNvbnMgb25seTsgaW4gdGhlIGZ1dHVyZSxcbiAgICAgIC8vIHdlIHNob3VsZCBkZXByZWNhdGUgdGhpcyBjbGFzcyBhbmQgcGVvcGxlIHNob3VsZCBzdGFydCB1c2luZyBgQ3ViZVNpbmdlckNsaWVudGAgZGlyZWN0bHkuXG4gICAgICBvcHRpb25zPy5zZXNzaW9uTWdyIGFzIHVua25vd24gYXMgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG4gICAgICBvcHRpb25zPy5vcmdJZCxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEF1dGhlbnRpY2F0ZSBhbiBPSURDIHVzZXIgYW5kIGNyZWF0ZSBhIG5ldyBzZXNzaW9uIG1hbmFnZXIgZm9yIHRoZW0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVGhlIE9JREMgdG9rZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIG9mIHRoZSByZXN1bHRpbmcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1JhdGNoZXRDb25maWd9IGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25TdG9yYWdlP30gc3RvcmFnZSBPcHRpb25hbCBzaWduZXIgc2Vzc2lvbiBzdG9yYWdlIChkZWZhdWx0cyB0byBpbi1tZW1vcnkgc3RvcmFnZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj59IFRoZSBzaWduZXIgc2Vzc2lvbiBtYW5hZ2VyXG4gICAqL1xuICBhc3luYyBvaWRjQXV0aChcbiAgICBvaWRjVG9rZW46IHN0cmluZyxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIHN0b3JhZ2U/OiBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLm9pZGNMb2dpbihvaWRjVG9rZW4sIG9yZ0lkLCBzY29wZXMsIGxpZmV0aW1lcyk7XG4gICAgcmV0dXJuIGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmNyZWF0ZUZyb21TZXNzaW9uSW5mbyh0aGlzLmVudiwgb3JnSWQsIHJlc3AuZGF0YSgpLCBzdG9yYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxVc2VySW5mbz59IFVzZXIgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBhYm91dE1lKCk6IFByb21pc2U8VXNlckluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5jc2MudXNlckdldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBleGlzdGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIE9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgTUZBIHJlcXVlc3QgSURcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IE1GQSByZXF1ZXN0IGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBtZmFHZXQob3JnSWQ6IHN0cmluZywgbWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5jc2Mud2l0aE9yZyhvcmdJZCkubWZhR2V0KG1mYUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgTUZBIHJlcXVlc3RzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgdXNlci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIE9yZ2FuaXphdGlvbiBJRFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+fSBUaGUgTUZBIHJlcXVlc3RzLlxuICAgKi9cbiAgYXN5bmMgbWZhTGlzdChvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mb1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLm1mYUxpc3QoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmcgaWQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgaWQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgbWZhQXBwcm92ZShvcmdJZDogc3RyaW5nLCBtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5tZmFBcHByb3ZlKG1mYUlkKTtcbiAgfVxuXG4gIC8qKiBJbml0aWF0ZSBhZGRpbmcgYSBuZXcgRklETyBkZXZpY2UuIE1GQSBtYXkgYmUgcmVxdWlyZWQuICovXG4gIGdldCBhZGRGaWRvU3RhcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3NjLnVzZXJGaWRvUmVnaXN0ZXJJbml0LmJpbmQodGhpcy5jc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gVGhpcyByZXF1ZXN0IHJldHVybnMgYSBuZXcgVE9UUCBjaGFsbGVuZ2VcbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmcgYHJlc2V0VG90cENvbXBsZXRlYFxuICAgKi9cbiAgZ2V0IHJlc2V0VG90cFN0YXJ0KCkge1xuICAgIHJldHVybiB0aGlzLmNzYy51c2VyVG90cFJlc2V0SW5pdC5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkgYHJlc2V0VG90cFN0YXJ0YC4gSWYgc3VjY2Vzc2Z1bCwgdXNlcidzXG4gICAqIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuaGUgVE9UUCBjb25maWd1cmF0aW9uIGZyb20gdGhlIGNoYWxsZW5nZS5cbiAgICovXG4gIGdldCByZXNldFRvdHBDb21wbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jc2MudXNlclRvdHBSZXNldENvbXBsZXRlLmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyBhIGdpdmVuIFRPVFAgY29kZSBhZ2FpbnN0IHRoZSBjdXJyZW50IHVzZXIncyBUT1RQIGNvbmZpZ3VyYXRpb24uXG4gICAqIFRocm93cyBhbiBlcnJvciBpZiB0aGUgdmVyaWZpY2F0aW9uIGZhaWxzLlxuICAgKi9cbiAgZ2V0IHZlcmlmeVRvdHAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3NjLnVzZXJUb3RwVmVyaWZ5LmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmdhbml6YXRpb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgSUQgb3IgbmFtZSBvZiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKiBAcmV0dXJuIHtPcmd9IFRoZSBvcmdhbml6YXRpb24uXG4gICAqL1xuICBhc3luYyBnZXRPcmcob3JnSWQ/OiBzdHJpbmcpOiBQcm9taXNlPE9yZz4ge1xuICAgIHJldHVybiBuZXcgT3JnKHRoaXMuY3NjLnNlc3Npb25NZ3IsIG9yZ0lkID8/IHRoaXMuY3NjLm9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGEgZ2l2ZW4ga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgLSBPcmdhbml6YXRpb24gaWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIC0gS2V5IGlkXG4gICAqL1xuICBhc3luYyBkZWxldGVLZXkob3JnSWQ6IHN0cmluZywga2V5SWQ6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLmtleURlbGV0ZShrZXlJZCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBtYW5hZ2VtZW50IGNsaWVudC5cbiAgICogQHJldHVybiB7Q2xpZW50fSBUaGUgY2xpZW50LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIG1hbmFnZW1lbnQoKTogUHJvbWlzZTxDbGllbnQ+IHtcbiAgICBpZiAoIXRoaXMuc2Vzc2lvbk1ncikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbWFuYWdlbWVudCBzZXNzaW9uIGxvYWRlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2Vzc2lvbk1nci5jbGllbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRoYXQgdGhlIHVzZXIgaXMgaW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxJZGVudGl0eVByb29mPn0gUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIGFzeW5jIHByb3ZlSWRlbnRpdHkob3JnSWQ6IHN0cmluZyk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNzYy53aXRoT3JnKG9yZ0lkKS5pZGVudGl0eVByb3ZlKCk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBUaGUgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdGhhdCB0aGUgdXNlciBpcyBpblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgb2lkY1Byb3ZlSWRlbnRpdHkob2lkY1Rva2VuOiBzdHJpbmcsIG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBvaWRjQ2xpZW50ID0gbmV3IE9pZGNDbGllbnQodGhpcy4jZW52LCBvcmdJZCwgb2lkY1Rva2VuKTtcbiAgICByZXR1cm4gYXdhaXQgb2lkY0NsaWVudC5pZGVudGl0eVByb3ZlKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgZ2l2ZW4gaWRlbnRpdHkgcHJvb2YgaXMgdmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluLlxuICAgKiBAcGFyYW0ge0lkZW50aXR5UHJvb2Z9IGlkZW50aXR5UHJvb2YgVGhlIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKi9cbiAgYXN5bmMgdmVyaWZ5SWRlbnRpdHkob3JnSWQ6IHN0cmluZywgaWRlbnRpdHlQcm9vZjogSWRlbnRpdHlQcm9vZikge1xuICAgIGF3YWl0IHRoaXMuY3NjLndpdGhPcmcob3JnSWQpLmlkZW50aXR5VmVyaWZ5KGlkZW50aXR5UHJvb2YpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2lkY1Rva2VuIFRoZSBPSURDIHRva2VuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0aGF0IHRoZSB1c2VyIGlzIGluXG4gICAqIEBwYXJhbSB7TGlzdDxzdHJpbmc+fSBzY29wZXMgVGhlIHNjb3BlcyBvZiB0aGUgcmVzdWx0aW5nIHNlc3Npb25cbiAgICogQHBhcmFtIHtSYXRjaGV0Q29uZmlnfSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0IChpZCArIGNvbmZpcm1hdGlvbiBjb2RlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTaWduZXJTZXNzaW9uRGF0YT4+fSBUaGUgc2Vzc2lvbiBkYXRhLlxuICAgKi9cbiAgYXN5bmMgb2lkY0xvZ2luKFxuICAgIG9pZGNUb2tlbjogc3RyaW5nLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNpZ25lclNlc3Npb25EYXRhPj4ge1xuICAgIGNvbnN0IG9pZGNDbGllbnQgPSBuZXcgT2lkY0NsaWVudCh0aGlzLiNlbnYsIG9yZ0lkLCBvaWRjVG9rZW4pO1xuICAgIHJldHVybiBhd2FpdCBvaWRjQ2xpZW50LnNlc3Npb25DcmVhdGUoc2NvcGVzLCBsaWZldGltZXMsIG1mYVJlY2VpcHQpO1xuICB9XG59XG5cbi8qKiBFcnJvcnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2Vycm9yXCI7XG4vKiogQVBJICovXG5leHBvcnQgKiBmcm9tIFwiLi9hcGlcIjtcbi8qKiBDbGllbnQgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2NsaWVudFwiO1xuLyoqIENhbGxiYWNrcyAqL1xuZXhwb3J0IHsgRXZlbnRzLCBFdmVudEhhbmRsZXIsIEVycm9yRXZlbnQsIEdsb2JhbEV2ZW50cywgU2Vzc2lvbkV4cGlyZWRFdmVudCB9IGZyb20gXCIuL2V2ZW50c1wiO1xuLyoqIE9yZ2FuaXphdGlvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL29yZ1wiO1xuLyoqIEtleXMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL2tleVwiO1xuLyoqIFJvbGVzICovXG5leHBvcnQgKiBmcm9tIFwiLi9yb2xlXCI7XG4vKiogRW52ICovXG5leHBvcnQgKiBmcm9tIFwiLi9lbnZcIjtcbi8qKiBGaWRvICovXG5leHBvcnQgKiBmcm9tIFwiLi9tZmFcIjtcbi8qKiBQYWdpbmF0aW9uICovXG5leHBvcnQgKiBmcm9tIFwiLi9wYWdpbmF0b3JcIjtcbi8qKiBSZXNwb25zZSAqL1xuZXhwb3J0ICogZnJvbSBcIi4vcmVzcG9uc2VcIjtcbi8qKiBUeXBlcyAqL1xuZXhwb3J0ICogZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG4vKiogU2Vzc2lvbnMgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3NpZ25lcl9zZXNzaW9uXCI7XG4vKiogU2Vzc2lvbiBzdG9yYWdlICovXG5leHBvcnQgKiBmcm9tIFwiLi9zZXNzaW9uL3Nlc3Npb25fc3RvcmFnZVwiO1xuLyoqIFNpZ25lciBzZXNzaW9uIG1hbmFnZXIgKi9cbmV4cG9ydCAqIGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuLyoqIFV0aWxzICovXG5leHBvcnQgKiBmcm9tIFwiLi91dGlsXCI7XG4vKiogVXNlci1leHBvcnQgZGVjcnlwdGlvbiBoZWxwZXIgKi9cbmV4cG9ydCB7IHVzZXJFeHBvcnREZWNyeXB0LCB1c2VyRXhwb3J0S2V5Z2VuIH0gZnJvbSBcIi4vdXNlcl9leHBvcnRcIjtcblxuLyoqIEN1YmVTaWduZXIgU0RLIHBhY2thZ2UgbmFtZSAqL1xuZXhwb3J0IGNvbnN0IE5BTUU6IHN0cmluZyA9IG5hbWU7XG5cbi8qKiBDdWJlU2lnbmVyIFNESyB2ZXJzaW9uICovXG5leHBvcnQgY29uc3QgVkVSU0lPTjogc3RyaW5nID0gdmVyc2lvbjtcbiJdfQ==