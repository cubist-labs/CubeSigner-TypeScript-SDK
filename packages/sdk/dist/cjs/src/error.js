"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionExpiredError = exports.ErrResponse = void 0;
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
class ErrResponse extends Error {
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
exports.ErrResponse = ErrResponse;
/**
 * An error that is thrown when a session has expired
 */
class SessionExpiredError extends ErrResponse {
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
exports.SessionExpiredError = SessionExpiredError;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0E7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBZ0I7SUFDakMscUJBQXFCO0lBQ3JCLHVCQUF1QjtJQUN2Qix1QkFBdUI7SUFDdkIsbUJBQW1CO0lBQ25CLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIseUJBQXlCO0lBQ3pCLG1CQUFtQjtJQUNuQix3QkFBd0I7SUFDeEIsc0JBQXNCO0NBQ3ZCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUF5QjtJQUN2QyxXQUFXO0lBQ1gsdUJBQXVCO0lBQ3ZCLGFBQWE7SUFDYixxQkFBcUI7Q0FDdEIsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsS0FBSztJQWNwQzs7T0FFRztJQUNILFlBQVksSUFBMEI7UUFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gscUJBQXFCO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzRixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILGNBQWM7UUFDWixPQUFPLENBQ0wsSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHO1lBQ25CLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckUsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUN6RSxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBdERELGtDQXNEQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxtQkFBb0IsU0FBUSxXQUFXO0lBQ2xEOzs7O09BSUc7SUFDSCxZQUFZLFNBQTRCO1FBQ3RDLEtBQUssQ0FBQztZQUNKLE9BQU8sRUFBRSxxQkFBcUI7WUFDOUIsTUFBTSxFQUFFLEdBQUc7WUFDWCxVQUFVLEVBQUUsV0FBVztZQUN2QixTQUFTO1lBQ1QsU0FBUyxFQUFFLGdCQUFnQjtTQUM1QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFmRCxrREFlQztBQUVEOztHQUVHO0FBQ0gsTUFBTSx3QkFBd0IsR0FBZ0I7SUFDNUMsZ0JBQWdCO0lBQ2hCLGdCQUFnQjtJQUNoQixpQkFBaUI7SUFDakIseUJBQXlCO0lBQ3pCLDBCQUEwQjtJQUMxQiw0QkFBNEI7SUFDNUIseUJBQXlCO0lBQ3pCLDRCQUE0QjtJQUM1Qiw0QkFBNEI7Q0FDN0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENzRXJyQ29kZSB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgb3BlcmF0aW9ucyB9IGZyb20gXCIuL3NjaGVtYVwiO1xuXG4vKipcbiAqIEVycm9yIGNvZGVzIGNvcnJlc3BvbmRpbmcgdG8gYWxsIGRpZmZlcmVudCBcIk1GQSBmYWlsZWRcIiBlcnJvciByZXNwb25zZXNcbiAqL1xuY29uc3QgbWZhRXJyb3JDb2RlczogQ3NFcnJDb2RlW10gPSBbXG4gIFwiTWZhQ2hhbGxlbmdlRXhwaXJlZFwiLFxuICBcIk1mYURpc2FsbG93ZWRBcHByb3ZlclwiLFxuICBcIk1mYURpc2FsbG93ZWRJZGVudGl0eVwiLFxuICBcIk1mYVR5cGVOb3RBbGxvd2VkXCIsXG4gIFwiTWZhVG90cEJhZENvZGVcIixcbiAgXCJNZmFUb3RwUmF0ZUxpbWl0XCIsXG4gIFwiTWZhVG90cEJhZENvbmZpZ3VyYXRpb25cIixcbiAgXCJUb3RwTm90Q29uZmlndXJlZFwiLFxuICBcIkZpZG9WZXJpZmljYXRpb25GYWlsZWRcIixcbiAgXCJVc2VyUm9sZVVucHJpdmlsZWdlZFwiLFxuXTtcblxuLyoqXG4gKiBPcGNvZGVzIGNvcnJlc3BvbmRpbmcgdG8gYWxsIGRpZmZlcmVudCBNRkEgYXBwcm92ZS9yZWplY3QgcmVxdWVzdHNcbiAqL1xuY29uc3QgbWZhT3BDb2RlczogKGtleW9mIG9wZXJhdGlvbnMpW10gPSBbXG4gIFwibWZhVm90ZUNzXCIsXG4gIFwidXNlclJlc2V0VG90cENvbXBsZXRlXCIsXG4gIFwibWZhVm90ZVRvdHBcIixcbiAgXCJtZmFWb3RlRmlkb0NvbXBsZXRlXCIsXG5dO1xuXG4vKipcbiAqIEVycm9yIHJlc3BvbnNlIHR5cGUsIHRocm93biBvbiBub24tc3VjY2Vzc2Z1bCByZXNwb25zZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJSZXNwb25zZSBleHRlbmRzIEVycm9yIHtcbiAgLyoqIE9wZXJhdGlvbiB0aGF0IHByb2R1Y2VkIHRoaXMgZXJyb3IgKi9cbiAgcmVhZG9ubHkgb3BlcmF0aW9uPzoga2V5b2Ygb3BlcmF0aW9ucztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgdGV4dCAoZGVyaXZlZCBmcm9tIGB0aGlzLnN0YXR1c2ApICovXG4gIHJlYWRvbmx5IHN0YXR1c1RleHQ/OiBzdHJpbmc7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlICovXG4gIHJlYWRvbmx5IHN0YXR1cz86IG51bWJlcjtcbiAgLyoqIEhUVFAgcmVzcG9uc2UgdXJsICovXG4gIHJlYWRvbmx5IHVybD86IHN0cmluZztcbiAgLyoqIEN1YmVTaWduZXIgZXJyb3IgY29kZSAqL1xuICByZWFkb25seSBlcnJvckNvZGU/OiBDc0VyckNvZGU7XG4gIC8qKiBSZXF1ZXN0IElEICovXG4gIHJlYWRvbmx5IHJlcXVlc3RJZD86IHN0cmluZztcblxuICAvKipcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEVyclJlc3BvbnNlPn0gaW5pdCBJbml0aWFsaXplclxuICAgKi9cbiAgY29uc3RydWN0b3IoaW5pdDogUGFydGlhbDxFcnJSZXNwb25zZT4pIHtcbiAgICBzdXBlcihpbml0Lm1lc3NhZ2UpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgaW5pdCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHJvb3QgY2F1c2Ugb2YgYW4ge0BsaW5rIEVyclJlc3BvbnNlfSBpcyBhbiBpbnZhbGlkIHNlc3Npb24uXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIC0gdGhlIHNlc3Npb24gaGFzIGV4cGlyZWRcbiAgICogLSB0aGUgc2Vzc2lvbiBoYXMgYmVlbiByZXZva2VkXG4gICAqIC0gcHJvdmlkZWQgYXV0aCB0b2tlbiBpcyBpbnZhbGlkL21hbGZvcm1lZC9leHBpcmVkXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHJlc3BvbnNlIG1hdGNoZXMgb25lIG9mIHNldmVyYWwgZGlmZmVyZW50IFwiaW52YWxpZCBzZXNzaW9uXCIgcmVzcG9uc2VzLlxuICAgKi9cbiAgaXNTZXNzaW9uRXhwaXJlZEVycm9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmVycm9yQ29kZSAhPT0gdW5kZWZpbmVkICYmIGludmFsaWRTZXNzaW9uRXJyb3JDb2Rlcy5pbmNsdWRlcyh0aGlzLmVycm9yQ29kZSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHJvb3QgY2F1c2Ugb2YgYW4ge0BsaW5rIEVyclJlc3BvbnNlfSBpcyB0aGUgdXNlciBmYWlsaW5nIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAtIHVzZXIgcHJvdmlkZXMgYSBiYWQgVE9UUCBjb2RlXG4gICAqIC0gdXNlciBpcyBUT1RQLXJhdGUtbGltaXRlZCAoYmVjYXVzZSBvZiB0b28gbWFueSBmYWlsZWQgYXR0ZW1wdHMpXG4gICAqIC0gTUZBIGNoYWxsZW5nZSBleHBpcmVkXG4gICAqIC0gRklETyBjaGFsbGVuZ2UgdmVyaWZpY2F0aW9uIGZhaWxlZFxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBlcnJvciB3YXMgY2F1c2VkIGJ5IHRoZSB1c2VyIGZhaWxpbmcgdG8gYXV0aGVudGljYXRlIHdpdGggTUZBXG4gICAqL1xuICBpc1VzZXJNZmFFcnJvcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKHRoaXMub3BlcmF0aW9uID09PSB1bmRlZmluZWQgfHwgbWZhT3BDb2Rlcy5pbmNsdWRlcyh0aGlzLm9wZXJhdGlvbikpICYmXG4gICAgICAodGhpcy5lcnJvckNvZGUgPT09IHVuZGVmaW5lZCB8fCBtZmFFcnJvckNvZGVzLmluY2x1ZGVzKHRoaXMuZXJyb3JDb2RlKSlcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXJyb3IgdGhhdCBpcyB0aHJvd24gd2hlbiBhIHNlc3Npb24gaGFzIGV4cGlyZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFNlc3Npb25FeHBpcmVkRXJyb3IgZXh0ZW5kcyBFcnJSZXNwb25zZSB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtvcGVyYXRpb25zfSBvcGVyYXRpb24gVGhlIG9wZXJhdGlvbiB0aGF0IHdhcyBhdHRlbXB0ZWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnMpIHtcbiAgICBzdXBlcih7XG4gICAgICBtZXNzYWdlOiBcIlNlc3Npb24gaGFzIGV4cGlyZWRcIixcbiAgICAgIHN0YXR1czogNDAzLFxuICAgICAgc3RhdHVzVGV4dDogXCJGb3JiaWRkZW5cIixcbiAgICAgIG9wZXJhdGlvbixcbiAgICAgIGVycm9yQ29kZTogXCJTZXNzaW9uRXhwaXJlZFwiLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogRXJyb3IgY29kZXMgY29ycmVzcG9uZGluZyB0byBhbGwgZGlmZmVyZW50IFwiaW52YWxpZCBzZXNzaW9uXCIgZXJyb3IgcmVzcG9uc2VzXG4gKi9cbmNvbnN0IGludmFsaWRTZXNzaW9uRXJyb3JDb2RlczogQ3NFcnJDb2RlW10gPSBbXG4gIFwiU2Vzc2lvbkV4cGlyZWRcIixcbiAgXCJTZXNzaW9uUmV2b2tlZFwiLFxuICBcIlNlc3Npb25Ob3RGb3VuZFwiLFxuICBcIlNlc3Npb25JbnZhbGlkQXV0aFRva2VuXCIsXG4gIFwiU2Vzc2lvbkludmFsaWRFcG9jaFRva2VuXCIsXG4gIFwiU2Vzc2lvbkludmFsaWRSZWZyZXNoVG9rZW5cIixcbiAgXCJTZXNzaW9uQXV0aFRva2VuRXhwaXJlZFwiLFxuICBcIlNlc3Npb25SZWZyZXNoVG9rZW5FeHBpcmVkXCIsXG4gIFwiU2Vzc2lvblBvc3NpYmx5U3RvbGVuVG9rZW5cIixcbl07XG4iXX0=