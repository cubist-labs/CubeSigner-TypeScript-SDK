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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBZ0I7SUFDakMscUJBQXFCO0lBQ3JCLHVCQUF1QjtJQUN2Qix1QkFBdUI7SUFDdkIsbUJBQW1CO0lBQ25CLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIseUJBQXlCO0lBQ3pCLG1CQUFtQjtJQUNuQix3QkFBd0I7SUFDeEIsc0JBQXNCO0NBQ3ZCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUF5QjtJQUN2QyxXQUFXO0lBQ1gsdUJBQXVCO0lBQ3ZCLGFBQWE7SUFDYixxQkFBcUI7Q0FDdEIsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBTSxPQUFPLFdBQVksU0FBUSxLQUFLO0lBY3BDOztPQUVHO0lBQ0gsWUFBWSxJQUEwQjtRQUNwQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxxQkFBcUI7UUFDbkIsT0FBTyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFBSSx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsY0FBYztRQUNaLE9BQU8sQ0FDTCxJQUFJLENBQUMsTUFBTSxLQUFLLEdBQUc7WUFDbkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyRSxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQ3pFLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFFRDs7R0FFRztBQUNILE1BQU0sT0FBTyxtQkFBb0IsU0FBUSxXQUFXO0lBQ2xEOzs7O09BSUc7SUFDSCxZQUFZLFNBQTRCO1FBQ3RDLEtBQUssQ0FBQztZQUNKLE9BQU8sRUFBRSxxQkFBcUI7WUFDOUIsTUFBTSxFQUFFLEdBQUc7WUFDWCxVQUFVLEVBQUUsV0FBVztZQUN2QixTQUFTO1lBQ1QsU0FBUyxFQUFFLGdCQUFnQjtTQUM1QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRDs7R0FFRztBQUNILE1BQU0sd0JBQXdCLEdBQWdCO0lBQzVDLGdCQUFnQjtJQUNoQixnQkFBZ0I7SUFDaEIsaUJBQWlCO0lBQ2pCLHlCQUF5QjtJQUN6QiwwQkFBMEI7SUFDMUIsNEJBQTRCO0lBQzVCLHlCQUF5QjtJQUN6Qiw0QkFBNEI7SUFDNUIsNEJBQTRCO0NBQzdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDc0VyckNvZGUgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IG9wZXJhdGlvbnMgfSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuLyoqXG4gKiBFcnJvciBjb2RlcyBjb3JyZXNwb25kaW5nIHRvIGFsbCBkaWZmZXJlbnQgXCJNRkEgZmFpbGVkXCIgZXJyb3IgcmVzcG9uc2VzXG4gKi9cbmNvbnN0IG1mYUVycm9yQ29kZXM6IENzRXJyQ29kZVtdID0gW1xuICBcIk1mYUNoYWxsZW5nZUV4cGlyZWRcIixcbiAgXCJNZmFEaXNhbGxvd2VkQXBwcm92ZXJcIixcbiAgXCJNZmFEaXNhbGxvd2VkSWRlbnRpdHlcIixcbiAgXCJNZmFUeXBlTm90QWxsb3dlZFwiLFxuICBcIk1mYVRvdHBCYWRDb2RlXCIsXG4gIFwiTWZhVG90cFJhdGVMaW1pdFwiLFxuICBcIk1mYVRvdHBCYWRDb25maWd1cmF0aW9uXCIsXG4gIFwiVG90cE5vdENvbmZpZ3VyZWRcIixcbiAgXCJGaWRvVmVyaWZpY2F0aW9uRmFpbGVkXCIsXG4gIFwiVXNlclJvbGVVbnByaXZpbGVnZWRcIixcbl07XG5cbi8qKlxuICogT3Bjb2RlcyBjb3JyZXNwb25kaW5nIHRvIGFsbCBkaWZmZXJlbnQgTUZBIGFwcHJvdmUvcmVqZWN0IHJlcXVlc3RzXG4gKi9cbmNvbnN0IG1mYU9wQ29kZXM6IChrZXlvZiBvcGVyYXRpb25zKVtdID0gW1xuICBcIm1mYVZvdGVDc1wiLFxuICBcInVzZXJSZXNldFRvdHBDb21wbGV0ZVwiLFxuICBcIm1mYVZvdGVUb3RwXCIsXG4gIFwibWZhVm90ZUZpZG9Db21wbGV0ZVwiLFxuXTtcblxuLyoqXG4gKiBFcnJvciByZXNwb25zZSB0eXBlLCB0aHJvd24gb24gbm9uLXN1Y2Nlc3NmdWwgcmVzcG9uc2VzLlxuICovXG5leHBvcnQgY2xhc3MgRXJyUmVzcG9uc2UgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBPcGVyYXRpb24gdGhhdCBwcm9kdWNlZCB0aGlzIGVycm9yICovXG4gIHJlYWRvbmx5IG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnM7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlIHRleHQgKGRlcml2ZWQgZnJvbSBgdGhpcy5zdGF0dXNgKSAqL1xuICByZWFkb25seSBzdGF0dXNUZXh0Pzogc3RyaW5nO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSAqL1xuICByZWFkb25seSBzdGF0dXM/OiBudW1iZXI7XG4gIC8qKiBIVFRQIHJlc3BvbnNlIHVybCAqL1xuICByZWFkb25seSB1cmw/OiBzdHJpbmc7XG4gIC8qKiBDdWJlU2lnbmVyIGVycm9yIGNvZGUgKi9cbiAgcmVhZG9ubHkgZXJyb3JDb2RlPzogQ3NFcnJDb2RlO1xuICAvKiogUmVxdWVzdCBJRCAqL1xuICByZWFkb25seSByZXF1ZXN0SWQ/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UGFydGlhbDxFcnJSZXNwb25zZT59IGluaXQgSW5pdGlhbGl6ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKGluaXQ6IFBhcnRpYWw8RXJyUmVzcG9uc2U+KSB7XG4gICAgc3VwZXIoaW5pdC5tZXNzYWdlKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSByb290IGNhdXNlIG9mIGFuIHtAbGluayBFcnJSZXNwb25zZX0gaXMgYW4gaW52YWxpZCBzZXNzaW9uLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAtIHRoZSBzZXNzaW9uIGhhcyBleHBpcmVkXG4gICAqIC0gdGhlIHNlc3Npb24gaGFzIGJlZW4gcmV2b2tlZFxuICAgKiAtIHByb3ZpZGVkIGF1dGggdG9rZW4gaXMgaW52YWxpZC9tYWxmb3JtZWQvZXhwaXJlZFxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSByZXNwb25zZSBtYXRjaGVzIG9uZSBvZiBzZXZlcmFsIGRpZmZlcmVudCBcImludmFsaWQgc2Vzc2lvblwiIHJlc3BvbnNlcy5cbiAgICovXG4gIGlzU2Vzc2lvbkV4cGlyZWRFcnJvcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5lcnJvckNvZGUgIT09IHVuZGVmaW5lZCAmJiBpbnZhbGlkU2Vzc2lvbkVycm9yQ29kZXMuaW5jbHVkZXModGhpcy5lcnJvckNvZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSByb290IGNhdXNlIG9mIGFuIHtAbGluayBFcnJSZXNwb25zZX0gaXMgdGhlIHVzZXIgZmFpbGluZyB0byBhbnN3ZXIgYW4gTUZBIGNoYWxsZW5nZS5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogLSB1c2VyIHByb3ZpZGVzIGEgYmFkIFRPVFAgY29kZVxuICAgKiAtIHVzZXIgaXMgVE9UUC1yYXRlLWxpbWl0ZWQgKGJlY2F1c2Ugb2YgdG9vIG1hbnkgZmFpbGVkIGF0dGVtcHRzKVxuICAgKiAtIE1GQSBjaGFsbGVuZ2UgZXhwaXJlZFxuICAgKiAtIEZJRE8gY2hhbGxlbmdlIHZlcmlmaWNhdGlvbiBmYWlsZWRcbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZXJyb3Igd2FzIGNhdXNlZCBieSB0aGUgdXNlciBmYWlsaW5nIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIE1GQVxuICAgKi9cbiAgaXNVc2VyTWZhRXJyb3IoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc3RhdHVzID09PSA0MDMgJiZcbiAgICAgICh0aGlzLm9wZXJhdGlvbiA9PT0gdW5kZWZpbmVkIHx8IG1mYU9wQ29kZXMuaW5jbHVkZXModGhpcy5vcGVyYXRpb24pKSAmJlxuICAgICAgKHRoaXMuZXJyb3JDb2RlID09PSB1bmRlZmluZWQgfHwgbWZhRXJyb3JDb2Rlcy5pbmNsdWRlcyh0aGlzLmVycm9yQ29kZSkpXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGVycm9yIHRoYXQgaXMgdGhyb3duIHdoZW4gYSBzZXNzaW9uIGhhcyBleHBpcmVkXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEVycm9yIGV4dGVuZHMgRXJyUmVzcG9uc2Uge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7b3BlcmF0aW9uc30gb3BlcmF0aW9uIFRoZSBvcGVyYXRpb24gdGhhdCB3YXMgYXR0ZW1wdGVkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcGVyYXRpb24/OiBrZXlvZiBvcGVyYXRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgbWVzc2FnZTogXCJTZXNzaW9uIGhhcyBleHBpcmVkXCIsXG4gICAgICBzdGF0dXM6IDQwMyxcbiAgICAgIHN0YXR1c1RleHQ6IFwiRm9yYmlkZGVuXCIsXG4gICAgICBvcGVyYXRpb24sXG4gICAgICBlcnJvckNvZGU6IFwiU2Vzc2lvbkV4cGlyZWRcIixcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEVycm9yIGNvZGVzIGNvcnJlc3BvbmRpbmcgdG8gYWxsIGRpZmZlcmVudCBcImludmFsaWQgc2Vzc2lvblwiIGVycm9yIHJlc3BvbnNlc1xuICovXG5jb25zdCBpbnZhbGlkU2Vzc2lvbkVycm9yQ29kZXM6IENzRXJyQ29kZVtdID0gW1xuICBcIlNlc3Npb25FeHBpcmVkXCIsXG4gIFwiU2Vzc2lvblJldm9rZWRcIixcbiAgXCJTZXNzaW9uTm90Rm91bmRcIixcbiAgXCJTZXNzaW9uSW52YWxpZEF1dGhUb2tlblwiLFxuICBcIlNlc3Npb25JbnZhbGlkRXBvY2hUb2tlblwiLFxuICBcIlNlc3Npb25JbnZhbGlkUmVmcmVzaFRva2VuXCIsXG4gIFwiU2Vzc2lvbkF1dGhUb2tlbkV4cGlyZWRcIixcbiAgXCJTZXNzaW9uUmVmcmVzaFRva2VuRXhwaXJlZFwiLFxuICBcIlNlc3Npb25Qb3NzaWJseVN0b2xlblRva2VuXCIsXG5dO1xuIl19