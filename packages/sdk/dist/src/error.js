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
const mfaOpCodes = [
    "mfaVoteCs",
    "userResetTotpComplete",
    "mfaVoteTotp",
    "mfaVoteFidoComplete",
];
/**
 * Error response type, thrown on non-successful responses.
 */
export class ErrResponse extends Error {
    /**
     * @param init Initializer
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
     * @returns Whether the response matches one of several different "invalid session" responses.
     */
    isSessionExpiredError() {
        return this.errorCode === undefined
            ? this.status === 403 && this.requestId === undefined
            : invalidSessionErrorCodes.includes(this.errorCode);
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
     * @returns Whether the error was caused by the user failing to authenticate with MFA
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
     * @param operation The operation that was attempted
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBZ0I7SUFDakMscUJBQXFCO0lBQ3JCLHVCQUF1QjtJQUN2Qix1QkFBdUI7SUFDdkIsbUJBQW1CO0lBQ25CLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIseUJBQXlCO0lBQ3pCLG1CQUFtQjtJQUNuQix3QkFBd0I7SUFDeEIsc0JBQXNCO0NBQ3ZCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUF5QjtJQUN2QyxXQUFXO0lBQ1gsdUJBQXVCO0lBQ3ZCLGFBQWE7SUFDYixxQkFBcUI7Q0FDdEIsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBTSxPQUFPLFdBQVksU0FBUSxLQUFLO0lBY3BDOztPQUVHO0lBQ0gsWUFBWSxJQUEwQjtRQUNwQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxxQkFBcUI7UUFDbkIsT0FBTyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVM7WUFDakMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUztZQUNyRCxDQUFDLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILGNBQWM7UUFDWixPQUFPLENBQ0wsSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHO1lBQ25CLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckUsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUN6RSxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztZQUNULFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLHdCQUF3QixHQUFnQjtJQUM1QyxnQkFBZ0I7SUFDaEIsZ0JBQWdCO0lBQ2hCLGlCQUFpQjtJQUNqQix5QkFBeUI7SUFDekIsMEJBQTBCO0lBQzFCLDRCQUE0QjtJQUM1Qix5QkFBeUI7SUFDekIsNEJBQTRCO0lBQzVCLDRCQUE0QjtDQUM3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDc0VyckNvZGUgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXMudHNcIjtcbmltcG9ydCB0eXBlIHsgb3BlcmF0aW9ucyB9IGZyb20gXCIuL3NjaGVtYS50c1wiO1xuXG4vKipcbiAqIEVycm9yIGNvZGVzIGNvcnJlc3BvbmRpbmcgdG8gYWxsIGRpZmZlcmVudCBcIk1GQSBmYWlsZWRcIiBlcnJvciByZXNwb25zZXNcbiAqL1xuY29uc3QgbWZhRXJyb3JDb2RlczogQ3NFcnJDb2RlW10gPSBbXG4gIFwiTWZhQ2hhbGxlbmdlRXhwaXJlZFwiLFxuICBcIk1mYURpc2FsbG93ZWRBcHByb3ZlclwiLFxuICBcIk1mYURpc2FsbG93ZWRJZGVudGl0eVwiLFxuICBcIk1mYVR5cGVOb3RBbGxvd2VkXCIsXG4gIFwiTWZhVG90cEJhZENvZGVcIixcbiAgXCJNZmFUb3RwUmF0ZUxpbWl0XCIsXG4gIFwiTWZhVG90cEJhZENvbmZpZ3VyYXRpb25cIixcbiAgXCJUb3RwTm90Q29uZmlndXJlZFwiLFxuICBcIkZpZG9WZXJpZmljYXRpb25GYWlsZWRcIixcbiAgXCJVc2VyUm9sZVVucHJpdmlsZWdlZFwiLFxuXTtcblxuLyoqXG4gKiBPcGNvZGVzIGNvcnJlc3BvbmRpbmcgdG8gYWxsIGRpZmZlcmVudCBNRkEgYXBwcm92ZS9yZWplY3QgcmVxdWVzdHNcbiAqL1xuY29uc3QgbWZhT3BDb2RlczogKGtleW9mIG9wZXJhdGlvbnMpW10gPSBbXG4gIFwibWZhVm90ZUNzXCIsXG4gIFwidXNlclJlc2V0VG90cENvbXBsZXRlXCIsXG4gIFwibWZhVm90ZVRvdHBcIixcbiAgXCJtZmFWb3RlRmlkb0NvbXBsZXRlXCIsXG5dO1xuXG4vKipcbiAqIEVycm9yIHJlc3BvbnNlIHR5cGUsIHRocm93biBvbiBub24tc3VjY2Vzc2Z1bCByZXNwb25zZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJSZXNwb25zZSBleHRlbmRzIEVycm9yIHtcbiAgLyoqIE9wZXJhdGlvbiB0aGF0IHByb2R1Y2VkIHRoaXMgZXJyb3IgKi9cbiAgcmVhZG9ubHkgb3BlcmF0aW9uPzoga2V5b2Ygb3BlcmF0aW9ucztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgdGV4dCAoZGVyaXZlZCBmcm9tIGB0aGlzLnN0YXR1c2ApICovXG4gIHJlYWRvbmx5IHN0YXR1c1RleHQ/OiBzdHJpbmc7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlICovXG4gIHJlYWRvbmx5IHN0YXR1cz86IG51bWJlcjtcbiAgLyoqIEhUVFAgcmVzcG9uc2UgdXJsICovXG4gIHJlYWRvbmx5IHVybD86IHN0cmluZztcbiAgLyoqIEN1YmVTaWduZXIgZXJyb3IgY29kZSAqL1xuICByZWFkb25seSBlcnJvckNvZGU/OiBDc0VyckNvZGU7XG4gIC8qKiBSZXF1ZXN0IElEICovXG4gIHJlYWRvbmx5IHJlcXVlc3RJZD86IHN0cmluZztcblxuICAvKipcbiAgICogQHBhcmFtIGluaXQgSW5pdGlhbGl6ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKGluaXQ6IFBhcnRpYWw8RXJyUmVzcG9uc2U+KSB7XG4gICAgc3VwZXIoaW5pdC5tZXNzYWdlKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSByb290IGNhdXNlIG9mIGFuIHtAbGluayBFcnJSZXNwb25zZX0gaXMgYW4gaW52YWxpZCBzZXNzaW9uLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAtIHRoZSBzZXNzaW9uIGhhcyBleHBpcmVkXG4gICAqIC0gdGhlIHNlc3Npb24gaGFzIGJlZW4gcmV2b2tlZFxuICAgKiAtIHByb3ZpZGVkIGF1dGggdG9rZW4gaXMgaW52YWxpZC9tYWxmb3JtZWQvZXhwaXJlZFxuICAgKlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSByZXNwb25zZSBtYXRjaGVzIG9uZSBvZiBzZXZlcmFsIGRpZmZlcmVudCBcImludmFsaWQgc2Vzc2lvblwiIHJlc3BvbnNlcy5cbiAgICovXG4gIGlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5lcnJvckNvZGUgPT09IHVuZGVmaW5lZFxuICAgICAgPyB0aGlzLnN0YXR1cyA9PT0gNDAzICYmIHRoaXMucmVxdWVzdElkID09PSB1bmRlZmluZWRcbiAgICAgIDogaW52YWxpZFNlc3Npb25FcnJvckNvZGVzLmluY2x1ZGVzKHRoaXMuZXJyb3JDb2RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgcm9vdCBjYXVzZSBvZiBhbiB7QGxpbmsgRXJyUmVzcG9uc2V9IGlzIHRoZSB1c2VyIGZhaWxpbmcgdG8gYW5zd2VyIGFuIE1GQSBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIC0gdXNlciBwcm92aWRlcyBhIGJhZCBUT1RQIGNvZGVcbiAgICogLSB1c2VyIGlzIFRPVFAtcmF0ZS1saW1pdGVkIChiZWNhdXNlIG9mIHRvbyBtYW55IGZhaWxlZCBhdHRlbXB0cylcbiAgICogLSBNRkEgY2hhbGxlbmdlIGV4cGlyZWRcbiAgICogLSBGSURPIGNoYWxsZW5nZSB2ZXJpZmljYXRpb24gZmFpbGVkXG4gICAqXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIGVycm9yIHdhcyBjYXVzZWQgYnkgdGhlIHVzZXIgZmFpbGluZyB0byBhdXRoZW50aWNhdGUgd2l0aCBNRkFcbiAgICovXG4gIGlzVXNlck1mYUVycm9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLnN0YXR1cyA9PT0gNDAzICYmXG4gICAgICAodGhpcy5vcGVyYXRpb24gPT09IHVuZGVmaW5lZCB8fCBtZmFPcENvZGVzLmluY2x1ZGVzKHRoaXMub3BlcmF0aW9uKSkgJiZcbiAgICAgICh0aGlzLmVycm9yQ29kZSA9PT0gdW5kZWZpbmVkIHx8IG1mYUVycm9yQ29kZXMuaW5jbHVkZXModGhpcy5lcnJvckNvZGUpKVxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBlcnJvciB0aGF0IGlzIHRocm93biB3aGVuIGEgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFcnJvciBleHRlbmRzIEVyclJlc3BvbnNlIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gb3BlcmF0aW9uIFRoZSBvcGVyYXRpb24gdGhhdCB3YXMgYXR0ZW1wdGVkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcGVyYXRpb24/OiBrZXlvZiBvcGVyYXRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgbWVzc2FnZTogXCJTZXNzaW9uIGhhcyBleHBpcmVkXCIsXG4gICAgICBzdGF0dXM6IDQwMyxcbiAgICAgIHN0YXR1c1RleHQ6IFwiRm9yYmlkZGVuXCIsXG4gICAgICBvcGVyYXRpb24sXG4gICAgICBlcnJvckNvZGU6IFwiU2Vzc2lvbkV4cGlyZWRcIixcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEVycm9yIGNvZGVzIGNvcnJlc3BvbmRpbmcgdG8gYWxsIGRpZmZlcmVudCBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIHJlc3BvbnNlc1xuICovXG5jb25zdCBpbnZhbGlkU2Vzc2lvbkVycm9yQ29kZXM6IENzRXJyQ29kZVtdID0gW1xuICBcIlNlc3Npb25FeHBpcmVkXCIsXG4gIFwiU2Vzc2lvblJldm9rZWRcIixcbiAgXCJTZXNzaW9uTm90Rm91bmRcIixcbiAgXCJTZXNzaW9uSW52YWxpZEF1dGhUb2tlblwiLFxuICBcIlNlc3Npb25JbnZhbGlkRXBvY2hUb2tlblwiLFxuICBcIlNlc3Npb25JbnZhbGlkUmVmcmVzaFRva2VuXCIsXG4gIFwiU2Vzc2lvbkF1dGhUb2tlbkV4cGlyZWRcIixcbiAgXCJTZXNzaW9uUmVmcmVzaFRva2VuRXhwaXJlZFwiLFxuICBcIlNlc3Npb25Qb3NzaWJseVN0b2xlblRva2VuXCIsXG5dO1xuIl19