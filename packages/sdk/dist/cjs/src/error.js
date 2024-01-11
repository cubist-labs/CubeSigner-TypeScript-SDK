"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionExpiredError = exports.ErrResponse = void 0;
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
        });
    }
}
exports.SessionExpiredError = SessionExpiredError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUE7O0dBRUc7QUFDSCxNQUFhLFdBQVksU0FBUSxLQUFLO0lBVXBDOztPQUVHO0lBQ0gsWUFBWSxJQUEwQjtRQUNwQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7Q0FDRjtBQWpCRCxrQ0FpQkM7QUFFRDs7R0FFRztBQUNILE1BQWEsbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztTQUNWLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWRELGtEQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgb3BlcmF0aW9ucyB9IGZyb20gXCIuL3NjaGVtYVwiO1xuXG4vKipcbiAqIEVycm9yIHJlc3BvbnNlIHR5cGUsIHRocm93biBvbiBub24tc3VjY2Vzc2Z1bCByZXNwb25zZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJSZXNwb25zZSBleHRlbmRzIEVycm9yIHtcbiAgLyoqIE9wZXJhdGlvbiB0aGF0IHByb2R1Y2VkIHRoaXMgZXJyb3IgKi9cbiAgcmVhZG9ubHkgb3BlcmF0aW9uPzoga2V5b2Ygb3BlcmF0aW9ucztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgdGV4dCAoZGVyaXZlZCBmcm9tIGB0aGlzLnN0YXR1c2ApICovXG4gIHJlYWRvbmx5IHN0YXR1c1RleHQ/OiBzdHJpbmc7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlICovXG4gIHJlYWRvbmx5IHN0YXR1cz86IG51bWJlcjtcbiAgLyoqIEhUVFAgcmVzcG9uc2UgdXJsICovXG4gIHJlYWRvbmx5IHVybD86IHN0cmluZztcblxuICAvKipcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEVyclJlc3BvbnNlPn0gaW5pdCBJbml0aWFsaXplclxuICAgKi9cbiAgY29uc3RydWN0b3IoaW5pdDogUGFydGlhbDxFcnJSZXNwb25zZT4pIHtcbiAgICBzdXBlcihpbml0Lm1lc3NhZ2UpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgaW5pdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBlcnJvciB0aGF0IGlzIHRocm93biB3aGVuIGEgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFcnJvciBleHRlbmRzIEVyclJlc3BvbnNlIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge29wZXJhdGlvbnN9IG9wZXJhdGlvbiBUaGUgb3BlcmF0aW9uIHRoYXQgd2FzIGF0dGVtcHRlZFxuICAgKi9cbiAgY29uc3RydWN0b3Iob3BlcmF0aW9uPzoga2V5b2Ygb3BlcmF0aW9ucykge1xuICAgIHN1cGVyKHtcbiAgICAgIG1lc3NhZ2U6IFwiU2Vzc2lvbiBoYXMgZXhwaXJlZFwiLFxuICAgICAgc3RhdHVzOiA0MDMsXG4gICAgICBzdGF0dXNUZXh0OiBcIkZvcmJpZGRlblwiLFxuICAgICAgb3BlcmF0aW9uLFxuICAgIH0pO1xuICB9XG59XG4iXX0=