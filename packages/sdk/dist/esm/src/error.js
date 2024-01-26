/**
 * Error codes corresponding to all different "MFA failed" error responses
 */
const mfaErrorCodes = [
    "MfaChallengeExpired",
    "MfaDisallowedApprover",
    "MfaDisallowedIdentity",
    "MfaTypeNotAllowed",
    "MfaTotpBadCode",
    "MfaTotpRateLimit",
    "MfaTotpBadConfiguration",
    "TotpNotConfigured",
    "FidoVerificationFailed",
    "UserRoleUnprivileged",
];
/**
 * Opcodes corresponding to all different MFA approve/reject requests
 */
const mfaOpCodes = ["mfaVoteCs", "mfaVoteTotp", "mfaVoteFidoComplete"];
/**
 * Error response type, thrown on non-successful responses.
 */
export class ErrResponse extends Error {
    /**
     * @param {Partial<ErrResponse>} init Initializer
     */
    constructor(init) {
        super(init.message);
        Object.assign(this, init);
    }
    /**
     * Checks whether the root cause of an {@link ErrResponse} is an invalid session.
     *
     * Examples include:
     * - the session has expired
     * - the session has been revoked
     * - provided auth token is invalid/malformed/expired
     *
     * @return {boolean} Whether the response matches one of several different "invalid session" responses.
     */
    isSessionExpiredError() {
        return this.errorCode !== undefined && invalidSessionErrorCodes.includes(this.errorCode);
    }
    /**
     * Checks whether the root cause of an {@link ErrResponse} is the user failing to answer an MFA challenge.
     *
     * Examples include:
     * - user provides a bad TOTP code
     * - user is TOTP-rate-limited (because of too many failed attempts)
     * - MFA challenge expired
     * - FIDO challenge verification failed
     *
     * @return {boolean} Whether the error was caused by the user failing to authenticate with MFA
     */
    isUserMfaError() {
        return (this.status === 403 &&
            (this.operation === undefined || mfaOpCodes.includes(this.operation)) &&
            (this.errorCode === undefined || mfaErrorCodes.includes(this.errorCode)));
    }
}
/**
 * An error that is thrown when a session has expired
 */
export class SessionExpiredError extends ErrResponse {
    /**
     * Constructor.
     *
     * @param {operations} operation The operation that was attempted
     */
    constructor(operation) {
        super({
            message: "Session has expired",
            status: 403,
            statusText: "Forbidden",
            operation,
            errorCode: "SessionExpired",
        });
    }
}
/**
 * Error codes corresponding to all different "invalid session" error responses
 */
const invalidSessionErrorCodes = [
    "SessionExpired",
    "SessionRevoked",
    "SessionNotFound",
    "SessionInvalidAuthToken",
    "SessionInvalidEpochToken",
    "SessionInvalidRefreshToken",
    "SessionAuthTokenExpired",
    "SessionRefreshTokenExpired",
    "SessionPossiblyStolenToken",
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBZ0I7SUFDakMscUJBQXFCO0lBQ3JCLHVCQUF1QjtJQUN2Qix1QkFBdUI7SUFDdkIsbUJBQW1CO0lBQ25CLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIseUJBQXlCO0lBQ3pCLG1CQUFtQjtJQUNuQix3QkFBd0I7SUFDeEIsc0JBQXNCO0NBQ3ZCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUF5QixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUU3Rjs7R0FFRztBQUNILE1BQU0sT0FBTyxXQUFZLFNBQVEsS0FBSztJQVlwQzs7T0FFRztJQUNILFlBQVksSUFBMEI7UUFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gscUJBQXFCO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzRixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILGNBQWM7UUFDWixPQUFPLENBQ0wsSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHO1lBQ25CLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckUsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUN6RSxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztZQUNULFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLHdCQUF3QixHQUFnQjtJQUM1QyxnQkFBZ0I7SUFDaEIsZ0JBQWdCO0lBQ2hCLGlCQUFpQjtJQUNqQix5QkFBeUI7SUFDekIsMEJBQTBCO0lBQzFCLDRCQUE0QjtJQUM1Qix5QkFBeUI7SUFDekIsNEJBQTRCO0lBQzVCLDRCQUE0QjtDQUM3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3NFcnJDb2RlIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBvcGVyYXRpb25zIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbi8qKlxuICogRXJyb3IgY29kZXMgY29ycmVzcG9uZGluZyB0byBhbGwgZGlmZmVyZW50IFwiTUZBIGZhaWxlZFwiIGVycm9yIHJlc3BvbnNlc1xuICovXG5jb25zdCBtZmFFcnJvckNvZGVzOiBDc0VyckNvZGVbXSA9IFtcbiAgXCJNZmFDaGFsbGVuZ2VFeHBpcmVkXCIsXG4gIFwiTWZhRGlzYWxsb3dlZEFwcHJvdmVyXCIsXG4gIFwiTWZhRGlzYWxsb3dlZElkZW50aXR5XCIsXG4gIFwiTWZhVHlwZU5vdEFsbG93ZWRcIixcbiAgXCJNZmFUb3RwQmFkQ29kZVwiLFxuICBcIk1mYVRvdHBSYXRlTGltaXRcIixcbiAgXCJNZmFUb3RwQmFkQ29uZmlndXJhdGlvblwiLFxuICBcIlRvdHBOb3RDb25maWd1cmVkXCIsXG4gIFwiRmlkb1ZlcmlmaWNhdGlvbkZhaWxlZFwiLFxuICBcIlVzZXJSb2xlVW5wcml2aWxlZ2VkXCIsXG5dO1xuXG4vKipcbiAqIE9wY29kZXMgY29ycmVzcG9uZGluZyB0byBhbGwgZGlmZmVyZW50IE1GQSBhcHByb3ZlL3JlamVjdCByZXF1ZXN0c1xuICovXG5jb25zdCBtZmFPcENvZGVzOiAoa2V5b2Ygb3BlcmF0aW9ucylbXSA9IFtcIm1mYVZvdGVDc1wiLCBcIm1mYVZvdGVUb3RwXCIsIFwibWZhVm90ZUZpZG9Db21wbGV0ZVwiXTtcblxuLyoqXG4gKiBFcnJvciByZXNwb25zZSB0eXBlLCB0aHJvd24gb24gbm9uLXN1Y2Nlc3NmdWwgcmVzcG9uc2VzLlxuICovXG5leHBvcnQgY2xhc3MgRXJyUmVzcG9uc2UgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBPcGVyYXRpb24gdGhhdCBwcm9kdWNlZCB0aGlzIGVycm9yICovXG4gIHJlYWRvbmx5IG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnM7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlIHRleHQgKGRlcml2ZWQgZnJvbSBgdGhpcy5zdGF0dXNgKSAqL1xuICByZWFkb25seSBzdGF0dXNUZXh0Pzogc3RyaW5nO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSAqL1xuICByZWFkb25seSBzdGF0dXM/OiBudW1iZXI7XG4gIC8qKiBIVFRQIHJlc3BvbnNlIHVybCAqL1xuICByZWFkb25seSB1cmw/OiBzdHJpbmc7XG4gIC8qKiBDdWJlU2lnbmVyIGVycm9yIGNvZGUgKi9cbiAgcmVhZG9ubHkgZXJyb3JDb2RlPzogQ3NFcnJDb2RlO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1BhcnRpYWw8RXJyUmVzcG9uc2U+fSBpbml0IEluaXRpYWxpemVyXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihpbml0OiBQYXJ0aWFsPEVyclJlc3BvbnNlPikge1xuICAgIHN1cGVyKGluaXQubWVzc2FnZSk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBpbml0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgcm9vdCBjYXVzZSBvZiBhbiB7QGxpbmsgRXJyUmVzcG9uc2V9IGlzIGFuIGludmFsaWQgc2Vzc2lvbi5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogLSB0aGUgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICAgKiAtIHRoZSBzZXNzaW9uIGhhcyBiZWVuIHJldm9rZWRcbiAgICogLSBwcm92aWRlZCBhdXRoIHRva2VuIGlzIGludmFsaWQvbWFsZm9ybWVkL2V4cGlyZWRcbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgcmVzcG9uc2UgbWF0Y2hlcyBvbmUgb2Ygc2V2ZXJhbCBkaWZmZXJlbnQgXCJpbnZhbGlkIHNlc3Npb25cIiByZXNwb25zZXMuXG4gICAqL1xuICBpc1Nlc3Npb25FeHBpcmVkRXJyb3IoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZXJyb3JDb2RlICE9PSB1bmRlZmluZWQgJiYgaW52YWxpZFNlc3Npb25FcnJvckNvZGVzLmluY2x1ZGVzKHRoaXMuZXJyb3JDb2RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgcm9vdCBjYXVzZSBvZiBhbiB7QGxpbmsgRXJyUmVzcG9uc2V9IGlzIHRoZSB1c2VyIGZhaWxpbmcgdG8gYW5zd2VyIGFuIE1GQSBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIC0gdXNlciBwcm92aWRlcyBhIGJhZCBUT1RQIGNvZGVcbiAgICogLSB1c2VyIGlzIFRPVFAtcmF0ZS1saW1pdGVkIChiZWNhdXNlIG9mIHRvbyBtYW55IGZhaWxlZCBhdHRlbXB0cylcbiAgICogLSBNRkEgY2hhbGxlbmdlIGV4cGlyZWRcbiAgICogLSBGSURPIGNoYWxsZW5nZSB2ZXJpZmljYXRpb24gZmFpbGVkXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVycm9yIHdhcyBjYXVzZWQgYnkgdGhlIHVzZXIgZmFpbGluZyB0byBhdXRoZW50aWNhdGUgd2l0aCBNRkFcbiAgICovXG4gIGlzVXNlck1mYUVycm9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLnN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAodGhpcy5vcGVyYXRpb24gPT09IHVuZGVmaW5lZCB8fCBtZmFPcENvZGVzLmluY2x1ZGVzKHRoaXMub3BlcmF0aW9uKSkgJiZcbiAgICAgICh0aGlzLmVycm9yQ29kZSA9PT0gdW5kZWZpbmVkIHx8IG1mYUVycm9yQ29kZXMuaW5jbHVkZXModGhpcy5lcnJvckNvZGUpKVxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBlcnJvciB0aGF0IGlzIHRocm93biB3aGVuIGEgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFcnJvciBleHRlbmRzIEVyclJlc3BvbnNlIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge29wZXJhdGlvbnN9IG9wZXJhdGlvbiBUaGUgb3BlcmF0aW9uIHRoYXQgd2FzIGF0dGVtcHRlZFxuICAgKi9cbiAgY29uc3RydWN0b3Iob3BlcmF0aW9uPzoga2V5b2Ygb3BlcmF0aW9ucykge1xuICAgIHN1cGVyKHtcbiAgICAgIG1lc3NhZ2U6IFwiU2Vzc2lvbiBoYXMgZXhwaXJlZFwiLFxuICAgICAgc3RhdHVzOiA0MDMsXG4gICAgICBzdGF0dXNUZXh0OiBcIkZvcmJpZGRlblwiLFxuICAgICAgb3BlcmF0aW9uLFxuICAgICAgZXJyb3JDb2RlOiBcIlNlc3Npb25FeHBpcmVkXCIsXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBFcnJvciBjb2RlcyBjb3JyZXNwb25kaW5nIHRvIGFsbCBkaWZmZXJlbnQgXCJpbnZhbGlkIHNlc3Npb25cIiBlcnJvciByZXNwb25zZXNcbiAqL1xuY29uc3QgaW52YWxpZFNlc3Npb25FcnJvckNvZGVzOiBDc0VyckNvZGVbXSA9IFtcbiAgXCJTZXNzaW9uRXhwaXJlZFwiLFxuICBcIlNlc3Npb25SZXZva2VkXCIsXG4gIFwiU2Vzc2lvbk5vdEZvdW5kXCIsXG4gIFwiU2Vzc2lvbkludmFsaWRBdXRoVG9rZW5cIixcbiAgXCJTZXNzaW9uSW52YWxpZEVwb2NoVG9rZW5cIixcbiAgXCJTZXNzaW9uSW52YWxpZFJlZnJlc2hUb2tlblwiLFxuICBcIlNlc3Npb25BdXRoVG9rZW5FeHBpcmVkXCIsXG4gIFwiU2Vzc2lvblJlZnJlc2hUb2tlbkV4cGlyZWRcIixcbiAgXCJTZXNzaW9uUG9zc2libHlTdG9sZW5Ub2tlblwiLFxuXTtcbiJdfQ==