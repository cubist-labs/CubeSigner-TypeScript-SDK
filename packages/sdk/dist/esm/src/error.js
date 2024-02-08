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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBZ0I7SUFDakMscUJBQXFCO0lBQ3JCLHVCQUF1QjtJQUN2Qix1QkFBdUI7SUFDdkIsbUJBQW1CO0lBQ25CLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIseUJBQXlCO0lBQ3pCLG1CQUFtQjtJQUNuQix3QkFBd0I7SUFDeEIsc0JBQXNCO0NBQ3ZCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUF5QixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUU3Rjs7R0FFRztBQUNILE1BQU0sT0FBTyxXQUFZLFNBQVEsS0FBSztJQWNwQzs7T0FFRztJQUNILFlBQVksSUFBMEI7UUFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gscUJBQXFCO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzRixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILGNBQWM7UUFDWixPQUFPLENBQ0wsSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHO1lBQ25CLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckUsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUN6RSxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztZQUNULFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLHdCQUF3QixHQUFnQjtJQUM1QyxnQkFBZ0I7SUFDaEIsZ0JBQWdCO0lBQ2hCLGlCQUFpQjtJQUNqQix5QkFBeUI7SUFDekIsMEJBQTBCO0lBQzFCLDRCQUE0QjtJQUM1Qix5QkFBeUI7SUFDekIsNEJBQTRCO0lBQzVCLDRCQUE0QjtDQUM3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3NFcnJDb2RlIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBvcGVyYXRpb25zIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbi8qKlxuICogRXJyb3IgY29kZXMgY29ycmVzcG9uZGluZyB0byBhbGwgZGlmZmVyZW50IFwiTUZBIGZhaWxlZFwiIGVycm9yIHJlc3BvbnNlc1xuICovXG5jb25zdCBtZmFFcnJvckNvZGVzOiBDc0VyckNvZGVbXSA9IFtcbiAgXCJNZmFDaGFsbGVuZ2VFeHBpcmVkXCIsXG4gIFwiTWZhRGlzYWxsb3dlZEFwcHJvdmVyXCIsXG4gIFwiTWZhRGlzYWxsb3dlZElkZW50aXR5XCIsXG4gIFwiTWZhVHlwZU5vdEFsbG93ZWRcIixcbiAgXCJNZmFUb3RwQmFkQ29kZVwiLFxuICBcIk1mYVRvdHBSYXRlTGltaXRcIixcbiAgXCJNZmFUb3RwQmFkQ29uZmlndXJhdGlvblwiLFxuICBcIlRvdHBOb3RDb25maWd1cmVkXCIsXG4gIFwiRmlkb1ZlcmlmaWNhdGlvbkZhaWxlZFwiLFxuICBcIlVzZXJSb2xlVW5wcml2aWxlZ2VkXCIsXG5dO1xuXG4vKipcbiAqIE9wY29kZXMgY29ycmVzcG9uZGluZyB0byBhbGwgZGlmZmVyZW50IE1GQSBhcHByb3ZlL3JlamVjdCByZXF1ZXN0c1xuICovXG5jb25zdCBtZmFPcENvZGVzOiAoa2V5b2Ygb3BlcmF0aW9ucylbXSA9IFtcIm1mYVZvdGVDc1wiLCBcIm1mYVZvdGVUb3RwXCIsIFwibWZhVm90ZUZpZG9Db21wbGV0ZVwiXTtcblxuLyoqXG4gKiBFcnJvciByZXNwb25zZSB0eXBlLCB0aHJvd24gb24gbm9uLXN1Y2Nlc3NmdWwgcmVzcG9uc2VzLlxuICovXG5leHBvcnQgY2xhc3MgRXJyUmVzcG9uc2UgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBPcGVyYXRpb24gdGhhdCBwcm9kdWNlZCB0aGlzIGVycm9yICovXG4gIHJlYWRvbmx5IG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnM7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlIHRleHQgKGRlcml2ZWQgZnJvbSBgdGhpcy5zdGF0dXNgKSAqL1xuICByZWFkb25seSBzdGF0dXNUZXh0Pzogc3RyaW5nO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSAqL1xuICByZWFkb25seSBzdGF0dXM/OiBudW1iZXI7XG4gIC8qKiBIVFRQIHJlc3BvbnNlIHVybCAqL1xuICByZWFkb25seSB1cmw/OiBzdHJpbmc7XG4gIC8qKiBDdWJlU2lnbmVyIGVycm9yIGNvZGUgKi9cbiAgcmVhZG9ubHkgZXJyb3JDb2RlPzogQ3NFcnJDb2RlO1xuICAvKiogUmVxdWVzdCBJRCAqL1xuICByZWFkb25seSByZXF1ZXN0SWQ/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UGFydGlhbDxFcnJSZXNwb25zZT59IGluaXQgSW5pdGlhbGl6ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKGluaXQ6IFBhcnRpYWw8RXJyUmVzcG9uc2U+KSB7XG4gICAgc3VwZXIoaW5pdC5tZXNzYWdlKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSByb290IGNhdXNlIG9mIGFuIHtAbGluayBFcnJSZXNwb25zZX0gaXMgYW4gaW52YWxpZCBzZXNzaW9uLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAtIHRoZSBzZXNzaW9uIGhhcyBleHBpcmVkXG4gICAqIC0gdGhlIHNlc3Npb24gaGFzIGJlZW4gcmV2b2tlZFxuICAgKiAtIHByb3ZpZGVkIGF1dGggdG9rZW4gaXMgaW52YWxpZC9tYWxmb3JtZWQvZXhwaXJlZFxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSByZXNwb25zZSBtYXRjaGVzIG9uZSBvZiBzZXZlcmFsIGRpZmZlcmVudCBcImludmFsaWQgc2Vzc2lvblwiIHJlc3BvbnNlcy5cbiAgICovXG4gIGlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5lcnJvckNvZGUgIT09IHVuZGVmaW5lZCAmJiBpbnZhbGlkU2Vzc2lvbkVycm9yQ29kZXMuaW5jbHVkZXModGhpcy5lcnJvckNvZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSByb290IGNhdXNlIG9mIGFuIHtAbGluayBFcnJSZXNwb25zZX0gaXMgdGhlIHVzZXIgZmFpbGluZyB0byBhbnN3ZXIgYW4gTUZBIGNoYWxsZW5nZS5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogLSB1c2VyIHByb3ZpZGVzIGEgYmFkIFRPVFAgY29kZVxuICAgKiAtIHVzZXIgaXMgVE9UUC1yYXRlLWxpbWl0ZWQgKGJlY2F1c2Ugb2YgdG9vIG1hbnkgZmFpbGVkIGF0dGVtcHRzKVxuICAgKiAtIE1GQSBjaGFsbGVuZ2UgZXhwaXJlZFxuICAgKiAtIEZJRE8gY2hhbGxlbmdlIHZlcmlmaWNhdGlvbiBmYWlsZWRcbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZXJyb3Igd2FzIGNhdXNlZCBieSB0aGUgdXNlciBmYWlsaW5nIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIE1GQVxuICAgKi9cbiAgaXNVc2VyTWZhRXJyb3IoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc3RhdHVzID09PSA0MDMgJiZcbiAgICAgICh0aGlzLm9wZXJhdGlvbiA9PT0gdW5kZWZpbmVkIHx8IG1mYU9wQ29kZXMuaW5jbHVkZXModGhpcy5vcGVyYXRpb24pKSAmJlxuICAgICAgKHRoaXMuZXJyb3JDb2RlID09PSB1bmRlZmluZWQgfHwgbWZhRXJyb3JDb2Rlcy5pbmNsdWRlcyh0aGlzLmVycm9yQ29kZSkpXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGVycm9yIHRoYXQgaXMgdGhyb3duIHdoZW4gYSBzZXNzaW9uIGhhcyBleHBpcmVkXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEVycm9yIGV4dGVuZHMgRXJyUmVzcG9uc2Uge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7b3BlcmF0aW9uc30gb3BlcmF0aW9uIFRoZSBvcGVyYXRpb24gdGhhdCB3YXMgYXR0ZW1wdGVkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcGVyYXRpb24/OiBrZXlvZiBvcGVyYXRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgbWVzc2FnZTogXCJTZXNzaW9uIGhhcyBleHBpcmVkXCIsXG4gICAgICBzdGF0dXM6IDQwMyxcbiAgICAgIHN0YXR1c1RleHQ6IFwiRm9yYmlkZGVuXCIsXG4gICAgICBvcGVyYXRpb24sXG4gICAgICBlcnJvckNvZGU6IFwiU2Vzc2lvbkV4cGlyZWRcIixcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEVycm9yIGNvZGVzIGNvcnJlc3BvbmRpbmcgdG8gYWxsIGRpZmZlcmVudCBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIHJlc3BvbnNlc1xuICovXG5jb25zdCBpbnZhbGlkU2Vzc2lvbkVycm9yQ29kZXM6IENzRXJyQ29kZVtdID0gW1xuICBcIlNlc3Npb25FeHBpcmVkXCIsXG4gIFwiU2Vzc2lvblJldm9rZWRcIixcbiAgXCJTZXNzaW9uTm90Rm91bmRcIixcbiAgXCJTZXNzaW9uSW52YWxpZEF1dGhUb2tlblwiLFxuICBcIlNlc3Npb25JbnZhbGlkRXBvY2hUb2tlblwiLFxuICBcIlNlc3Npb25JbnZhbGlkUmVmcmVzaFRva2VuXCIsXG4gIFwiU2Vzc2lvbkF1dGhUb2tlbkV4cGlyZWRcIixcbiAgXCJTZXNzaW9uUmVmcmVzaFRva2VuRXhwaXJlZFwiLFxuICBcIlNlc3Npb25Qb3NzaWJseVN0b2xlblRva2VuXCIsXG5dO1xuIl19