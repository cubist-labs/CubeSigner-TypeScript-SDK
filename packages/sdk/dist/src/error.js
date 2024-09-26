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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0E7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBZ0I7SUFDakMscUJBQXFCO0lBQ3JCLHVCQUF1QjtJQUN2Qix1QkFBdUI7SUFDdkIsbUJBQW1CO0lBQ25CLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIseUJBQXlCO0lBQ3pCLG1CQUFtQjtJQUNuQix3QkFBd0I7SUFDeEIsc0JBQXNCO0NBQ3ZCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUF5QjtJQUN2QyxXQUFXO0lBQ1gsdUJBQXVCO0lBQ3ZCLGFBQWE7SUFDYixxQkFBcUI7Q0FDdEIsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsS0FBSztJQWNwQzs7T0FFRztJQUNILFlBQVksSUFBMEI7UUFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gscUJBQXFCO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTO1lBQ2pDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVM7WUFDckQsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSCxjQUFjO1FBQ1osT0FBTyxDQUNMLElBQUksQ0FBQyxNQUFNLEtBQUssR0FBRztZQUNuQixDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JFLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FDekUsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXhERCxrQ0F3REM7QUFFRDs7R0FFRztBQUNILE1BQWEsbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztZQUNULFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBZkQsa0RBZUM7QUFFRDs7R0FFRztBQUNILE1BQU0sd0JBQXdCLEdBQWdCO0lBQzVDLGdCQUFnQjtJQUNoQixnQkFBZ0I7SUFDaEIsaUJBQWlCO0lBQ2pCLHlCQUF5QjtJQUN6QiwwQkFBMEI7SUFDMUIsNEJBQTRCO0lBQzVCLHlCQUF5QjtJQUN6Qiw0QkFBNEI7SUFDNUIsNEJBQTRCO0NBQzdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENzRXJyQ29kZSB9IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBvcGVyYXRpb25zIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbi8qKlxuICogRXJyb3IgY29kZXMgY29ycmVzcG9uZGluZyB0byBhbGwgZGlmZmVyZW50IFwiTUZBIGZhaWxlZFwiIGVycm9yIHJlc3BvbnNlc1xuICovXG5jb25zdCBtZmFFcnJvckNvZGVzOiBDc0VyckNvZGVbXSA9IFtcbiAgXCJNZmFDaGFsbGVuZ2VFeHBpcmVkXCIsXG4gIFwiTWZhRGlzYWxsb3dlZEFwcHJvdmVyXCIsXG4gIFwiTWZhRGlzYWxsb3dlZElkZW50aXR5XCIsXG4gIFwiTWZhVHlwZU5vdEFsbG93ZWRcIixcbiAgXCJNZmFUb3RwQmFkQ29kZVwiLFxuICBcIk1mYVRvdHBSYXRlTGltaXRcIixcbiAgXCJNZmFUb3RwQmFkQ29uZmlndXJhdGlvblwiLFxuICBcIlRvdHBOb3RDb25maWd1cmVkXCIsXG4gIFwiRmlkb1ZlcmlmaWNhdGlvbkZhaWxlZFwiLFxuICBcIlVzZXJSb2xlVW5wcml2aWxlZ2VkXCIsXG5dO1xuXG4vKipcbiAqIE9wY29kZXMgY29ycmVzcG9uZGluZyB0byBhbGwgZGlmZmVyZW50IE1GQSBhcHByb3ZlL3JlamVjdCByZXF1ZXN0c1xuICovXG5jb25zdCBtZmFPcENvZGVzOiAoa2V5b2Ygb3BlcmF0aW9ucylbXSA9IFtcbiAgXCJtZmFWb3RlQ3NcIixcbiAgXCJ1c2VyUmVzZXRUb3RwQ29tcGxldGVcIixcbiAgXCJtZmFWb3RlVG90cFwiLFxuICBcIm1mYVZvdGVGaWRvQ29tcGxldGVcIixcbl07XG5cbi8qKlxuICogRXJyb3IgcmVzcG9uc2UgdHlwZSwgdGhyb3duIG9uIG5vbi1zdWNjZXNzZnVsIHJlc3BvbnNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEVyclJlc3BvbnNlIGV4dGVuZHMgRXJyb3Ige1xuICAvKiogT3BlcmF0aW9uIHRoYXQgcHJvZHVjZWQgdGhpcyBlcnJvciAqL1xuICByZWFkb25seSBvcGVyYXRpb24/OiBrZXlvZiBvcGVyYXRpb25zO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSB0ZXh0IChkZXJpdmVkIGZyb20gYHRoaXMuc3RhdHVzYCkgKi9cbiAgcmVhZG9ubHkgc3RhdHVzVGV4dD86IHN0cmluZztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgKi9cbiAgcmVhZG9ubHkgc3RhdHVzPzogbnVtYmVyO1xuICAvKiogSFRUUCByZXNwb25zZSB1cmwgKi9cbiAgcmVhZG9ubHkgdXJsPzogc3RyaW5nO1xuICAvKiogQ3ViZVNpZ25lciBlcnJvciBjb2RlICovXG4gIHJlYWRvbmx5IGVycm9yQ29kZT86IENzRXJyQ29kZTtcbiAgLyoqIFJlcXVlc3QgSUQgKi9cbiAgcmVhZG9ubHkgcmVxdWVzdElkPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1BhcnRpYWw8RXJyUmVzcG9uc2U+fSBpbml0IEluaXRpYWxpemVyXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihpbml0OiBQYXJ0aWFsPEVyclJlc3BvbnNlPikge1xuICAgIHN1cGVyKGluaXQubWVzc2FnZSk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBpbml0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgcm9vdCBjYXVzZSBvZiBhbiB7QGxpbmsgRXJyUmVzcG9uc2V9IGlzIGFuIGludmFsaWQgc2Vzc2lvbi5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogLSB0aGUgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICAgKiAtIHRoZSBzZXNzaW9uIGhhcyBiZWVuIHJldm9rZWRcbiAgICogLSBwcm92aWRlZCBhdXRoIHRva2VuIGlzIGludmFsaWQvbWFsZm9ybWVkL2V4cGlyZWRcbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgcmVzcG9uc2UgbWF0Y2hlcyBvbmUgb2Ygc2V2ZXJhbCBkaWZmZXJlbnQgXCJpbnZhbGlkIHNlc3Npb25cIiByZXNwb25zZXMuXG4gICAqL1xuICBpc1Nlc3Npb25FeHBpcmVkRXJyb3IoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZXJyb3JDb2RlID09PSB1bmRlZmluZWRcbiAgICAgID8gdGhpcy5zdGF0dXMgPT09IDQwMyAmJiB0aGlzLnJlcXVlc3RJZCA9PT0gdW5kZWZpbmVkXG4gICAgICA6IGludmFsaWRTZXNzaW9uRXJyb3JDb2Rlcy5pbmNsdWRlcyh0aGlzLmVycm9yQ29kZSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHJvb3QgY2F1c2Ugb2YgYW4ge0BsaW5rIEVyclJlc3BvbnNlfSBpcyB0aGUgdXNlciBmYWlsaW5nIHRvIGFuc3dlciBhbiBNRkEgY2hhbGxlbmdlLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAtIHVzZXIgcHJvdmlkZXMgYSBiYWQgVE9UUCBjb2RlXG4gICAqIC0gdXNlciBpcyBUT1RQLXJhdGUtbGltaXRlZCAoYmVjYXVzZSBvZiB0b28gbWFueSBmYWlsZWQgYXR0ZW1wdHMpXG4gICAqIC0gTUZBIGNoYWxsZW5nZSBleHBpcmVkXG4gICAqIC0gRklETyBjaGFsbGVuZ2UgdmVyaWZpY2F0aW9uIGZhaWxlZFxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBlcnJvciB3YXMgY2F1c2VkIGJ5IHRoZSB1c2VyIGZhaWxpbmcgdG8gYXV0aGVudGljYXRlIHdpdGggTUZBXG4gICAqL1xuICBpc1VzZXJNZmFFcnJvcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5zdGF0dXMgPT09IDQwMyAmJlxuICAgICAgKHRoaXMub3BlcmF0aW9uID09PSB1bmRlZmluZWQgfHwgbWZhT3BDb2Rlcy5pbmNsdWRlcyh0aGlzLm9wZXJhdGlvbikpICYmXG4gICAgICAodGhpcy5lcnJvckNvZGUgPT09IHVuZGVmaW5lZCB8fCBtZmFFcnJvckNvZGVzLmluY2x1ZGVzKHRoaXMuZXJyb3JDb2RlKSlcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXJyb3IgdGhhdCBpcyB0aHJvd24gd2hlbiBhIHNlc3Npb24gaGFzIGV4cGlyZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFNlc3Npb25FeHBpcmVkRXJyb3IgZXh0ZW5kcyBFcnJSZXNwb25zZSB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtvcGVyYXRpb25zfSBvcGVyYXRpb24gVGhlIG9wZXJhdGlvbiB0aGF0IHdhcyBhdHRlbXB0ZWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnMpIHtcbiAgICBzdXBlcih7XG4gICAgICBtZXNzYWdlOiBcIlNlc3Npb24gaGFzIGV4cGlyZWRcIixcbiAgICAgIHN0YXR1czogNDAzLFxuICAgICAgc3RhdHVzVGV4dDogXCJGb3JiaWRkZW5cIixcbiAgICAgIG9wZXJhdGlvbixcbiAgICAgIGVycm9yQ29kZTogXCJTZXNzaW9uRXhwaXJlZFwiLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogRXJyb3IgY29kZXMgY29ycmVzcG9uZGluZyB0byBhbGwgZGlmZmVyZW50IFwiaW52YWxpZCBzZXNzaW9uXCIgZXJyb3IgcmVzcG9uc2VzXG4gKi9cbmNvbnN0IGludmFsaWRTZXNzaW9uRXJyb3JDb2RlczogQ3NFcnJDb2RlW10gPSBbXG4gIFwiU2Vzc2lvbkV4cGlyZWRcIixcbiAgXCJTZXNzaW9uUmV2b2tlZFwiLFxuICBcIlNlc3Npb25Ob3RGb3VuZFwiLFxuICBcIlNlc3Npb25JbnZhbGlkQXV0aFRva2VuXCIsXG4gIFwiU2Vzc2lvbkludmFsaWRFcG9jaFRva2VuXCIsXG4gIFwiU2Vzc2lvbkludmFsaWRSZWZyZXNoVG9rZW5cIixcbiAgXCJTZXNzaW9uQXV0aFRva2VuRXhwaXJlZFwiLFxuICBcIlNlc3Npb25SZWZyZXNoVG9rZW5FeHBpcmVkXCIsXG4gIFwiU2Vzc2lvblBvc3NpYmx5U3RvbGVuVG9rZW5cIixcbl07XG4iXX0=