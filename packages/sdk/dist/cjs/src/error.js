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
const mfaOpCodes = ["mfaVoteCs", "mfaVoteTotp", "mfaVoteFidoComplete"];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0E7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBZ0I7SUFDakMscUJBQXFCO0lBQ3JCLHVCQUF1QjtJQUN2Qix1QkFBdUI7SUFDdkIsbUJBQW1CO0lBQ25CLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIseUJBQXlCO0lBQ3pCLG1CQUFtQjtJQUNuQix3QkFBd0I7SUFDeEIsc0JBQXNCO0NBQ3ZCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUF5QixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUU3Rjs7R0FFRztBQUNILE1BQWEsV0FBWSxTQUFRLEtBQUs7SUFZcEM7O09BRUc7SUFDSCxZQUFZLElBQTBCO1FBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILHFCQUFxQjtRQUNuQixPQUFPLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxJQUFJLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSCxjQUFjO1FBQ1osT0FBTyxDQUNMLElBQUksQ0FBQyxNQUFNLEtBQUssR0FBRztZQUNuQixDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JFLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FDekUsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXBERCxrQ0FvREM7QUFFRDs7R0FFRztBQUNILE1BQWEsbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztZQUNULFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBZkQsa0RBZUM7QUFFRDs7R0FFRztBQUNILE1BQU0sd0JBQXdCLEdBQWdCO0lBQzVDLGdCQUFnQjtJQUNoQixnQkFBZ0I7SUFDaEIsaUJBQWlCO0lBQ2pCLHlCQUF5QjtJQUN6QiwwQkFBMEI7SUFDMUIsNEJBQTRCO0lBQzVCLHlCQUF5QjtJQUN6Qiw0QkFBNEI7SUFDNUIsNEJBQTRCO0NBQzdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDc0VyckNvZGUgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IG9wZXJhdGlvbnMgfSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuLyoqXG4gKiBFcnJvciBjb2RlcyBjb3JyZXNwb25kaW5nIHRvIGFsbCBkaWZmZXJlbnQgXCJNRkEgZmFpbGVkXCIgZXJyb3IgcmVzcG9uc2VzXG4gKi9cbmNvbnN0IG1mYUVycm9yQ29kZXM6IENzRXJyQ29kZVtdID0gW1xuICBcIk1mYUNoYWxsZW5nZUV4cGlyZWRcIixcbiAgXCJNZmFEaXNhbGxvd2VkQXBwcm92ZXJcIixcbiAgXCJNZmFEaXNhbGxvd2VkSWRlbnRpdHlcIixcbiAgXCJNZmFUeXBlTm90QWxsb3dlZFwiLFxuICBcIk1mYVRvdHBCYWRDb2RlXCIsXG4gIFwiTWZhVG90cFJhdGVMaW1pdFwiLFxuICBcIk1mYVRvdHBCYWRDb25maWd1cmF0aW9uXCIsXG4gIFwiVG90cE5vdENvbmZpZ3VyZWRcIixcbiAgXCJGaWRvVmVyaWZpY2F0aW9uRmFpbGVkXCIsXG4gIFwiVXNlclJvbGVVbnByaXZpbGVnZWRcIixcbl07XG5cbi8qKlxuICogT3Bjb2RlcyBjb3JyZXNwb25kaW5nIHRvIGFsbCBkaWZmZXJlbnQgTUZBIGFwcHJvdmUvcmVqZWN0IHJlcXVlc3RzXG4gKi9cbmNvbnN0IG1mYU9wQ29kZXM6IChrZXlvZiBvcGVyYXRpb25zKVtdID0gW1wibWZhVm90ZUNzXCIsIFwibWZhVm90ZVRvdHBcIiwgXCJtZmFWb3RlRmlkb0NvbXBsZXRlXCJdO1xuXG4vKipcbiAqIEVycm9yIHJlc3BvbnNlIHR5cGUsIHRocm93biBvbiBub24tc3VjY2Vzc2Z1bCByZXNwb25zZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJSZXNwb25zZSBleHRlbmRzIEVycm9yIHtcbiAgLyoqIE9wZXJhdGlvbiB0aGF0IHByb2R1Y2VkIHRoaXMgZXJyb3IgKi9cbiAgcmVhZG9ubHkgb3BlcmF0aW9uPzoga2V5b2Ygb3BlcmF0aW9ucztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgdGV4dCAoZGVyaXZlZCBmcm9tIGB0aGlzLnN0YXR1c2ApICovXG4gIHJlYWRvbmx5IHN0YXR1c1RleHQ/OiBzdHJpbmc7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlICovXG4gIHJlYWRvbmx5IHN0YXR1cz86IG51bWJlcjtcbiAgLyoqIEhUVFAgcmVzcG9uc2UgdXJsICovXG4gIHJlYWRvbmx5IHVybD86IHN0cmluZztcbiAgLyoqIEN1YmVTaWduZXIgZXJyb3IgY29kZSAqL1xuICByZWFkb25seSBlcnJvckNvZGU/OiBDc0VyckNvZGU7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UGFydGlhbDxFcnJSZXNwb25zZT59IGluaXQgSW5pdGlhbGl6ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKGluaXQ6IFBhcnRpYWw8RXJyUmVzcG9uc2U+KSB7XG4gICAgc3VwZXIoaW5pdC5tZXNzYWdlKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSByb290IGNhdXNlIG9mIGFuIHtAbGluayBFcnJSZXNwb25zZX0gaXMgYW4gaW52YWxpZCBzZXNzaW9uLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAtIHRoZSBzZXNzaW9uIGhhcyBleHBpcmVkXG4gICAqIC0gdGhlIHNlc3Npb24gaGFzIGJlZW4gcmV2b2tlZFxuICAgKiAtIHByb3ZpZGVkIGF1dGggdG9rZW4gaXMgaW52YWxpZC9tYWxmb3JtZWQvZXhwaXJlZFxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSByZXNwb25zZSBtYXRjaGVzIG9uZSBvZiBzZXZlcmFsIGRpZmZlcmVudCBcImludmFsaWQgc2Vzc2lvblwiIHJlc3BvbnNlcy5cbiAgICovXG4gIGlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5lcnJvckNvZGUgIT09IHVuZGVmaW5lZCAmJiBpbnZhbGlkU2Vzc2lvbkVycm9yQ29kZXMuaW5jbHVkZXModGhpcy5lcnJvckNvZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSByb290IGNhdXNlIG9mIGFuIHtAbGluayBFcnJSZXNwb25zZX0gaXMgdGhlIHVzZXIgZmFpbGluZyB0byBhbnN3ZXIgYW4gTUZBIGNoYWxsZW5nZS5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogLSB1c2VyIHByb3ZpZGVzIGEgYmFkIFRPVFAgY29kZVxuICAgKiAtIHVzZXIgaXMgVE9UUC1yYXRlLWxpbWl0ZWQgKGJlY2F1c2Ugb2YgdG9vIG1hbnkgZmFpbGVkIGF0dGVtcHRzKVxuICAgKiAtIE1GQSBjaGFsbGVuZ2UgZXhwaXJlZFxuICAgKiAtIEZJRE8gY2hhbGxlbmdlIHZlcmlmaWNhdGlvbiBmYWlsZWRcbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZXJyb3Igd2FzIGNhdXNlZCBieSB0aGUgdXNlciBmYWlsaW5nIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIE1GQVxuICAgKi9cbiAgaXNVc2VyTWZhRXJyb3IoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc3RhdHVzID09PSA0MDMgJiZcbiAgICAgICh0aGlzLm9wZXJhdGlvbiA9PT0gdW5kZWZpbmVkIHx8IG1mYU9wQ29kZXMuaW5jbHVkZXModGhpcy5vcGVyYXRpb24pKSAmJlxuICAgICAgKHRoaXMuZXJyb3JDb2RlID09PSB1bmRlZmluZWQgfHwgbWZhRXJyb3JDb2Rlcy5pbmNsdWRlcyh0aGlzLmVycm9yQ29kZSkpXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGVycm9yIHRoYXQgaXMgdGhyb3duIHdoZW4gYSBzZXNzaW9uIGhhcyBleHBpcmVkXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEVycm9yIGV4dGVuZHMgRXJyUmVzcG9uc2Uge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7b3BlcmF0aW9uc30gb3BlcmF0aW9uIFRoZSBvcGVyYXRpb24gdGhhdCB3YXMgYXR0ZW1wdGVkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcGVyYXRpb24/OiBrZXlvZiBvcGVyYXRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgbWVzc2FnZTogXCJTZXNzaW9uIGhhcyBleHBpcmVkXCIsXG4gICAgICBzdGF0dXM6IDQwMyxcbiAgICAgIHN0YXR1c1RleHQ6IFwiRm9yYmlkZGVuXCIsXG4gICAgICBvcGVyYXRpb24sXG4gICAgICBlcnJvckNvZGU6IFwiU2Vzc2lvbkV4cGlyZWRcIixcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEVycm9yIGNvZGVzIGNvcnJlc3BvbmRpbmcgdG8gYWxsIGRpZmZlcmVudCBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIHJlc3BvbnNlc1xuICovXG5jb25zdCBpbnZhbGlkU2Vzc2lvbkVycm9yQ29kZXM6IENzRXJyQ29kZVtdID0gW1xuICBcIlNlc3Npb25FeHBpcmVkXCIsXG4gIFwiU2Vzc2lvblJldm9rZWRcIixcbiAgXCJTZXNzaW9uTm90Rm91bmRcIixcbiAgXCJTZXNzaW9uSW52YWxpZEF1dGhUb2tlblwiLFxuICBcIlNlc3Npb25JbnZhbGlkRXBvY2hUb2tlblwiLFxuICBcIlNlc3Npb25JbnZhbGlkUmVmcmVzaFRva2VuXCIsXG4gIFwiU2Vzc2lvbkF1dGhUb2tlbkV4cGlyZWRcIixcbiAgXCJTZXNzaW9uUmVmcmVzaFRva2VuRXhwaXJlZFwiLFxuICBcIlNlc3Npb25Qb3NzaWJseVN0b2xlblRva2VuXCIsXG5dO1xuIl19