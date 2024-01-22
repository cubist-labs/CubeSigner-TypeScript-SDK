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
            errorCode: "SessionExpired",
        });
    }
}
exports.SessionExpiredError = SessionExpiredError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0E7O0dBRUc7QUFDSCxNQUFhLFdBQVksU0FBUSxLQUFLO0lBWXBDOztPQUVHO0lBQ0gsWUFBWSxJQUEwQjtRQUNwQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7Q0FDRjtBQW5CRCxrQ0FtQkM7QUFFRDs7R0FFRztBQUNILE1BQWEsbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztZQUNULFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBZkQsa0RBZUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDc0VyckNvZGUgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IG9wZXJhdGlvbnMgfSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuLyoqXG4gKiBFcnJvciByZXNwb25zZSB0eXBlLCB0aHJvd24gb24gbm9uLXN1Y2Nlc3NmdWwgcmVzcG9uc2VzLlxuICovXG5leHBvcnQgY2xhc3MgRXJyUmVzcG9uc2UgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBPcGVyYXRpb24gdGhhdCBwcm9kdWNlZCB0aGlzIGVycm9yICovXG4gIHJlYWRvbmx5IG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnM7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlIHRleHQgKGRlcml2ZWQgZnJvbSBgdGhpcy5zdGF0dXNgKSAqL1xuICByZWFkb25seSBzdGF0dXNUZXh0Pzogc3RyaW5nO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSAqL1xuICByZWFkb25seSBzdGF0dXM/OiBudW1iZXI7XG4gIC8qKiBIVFRQIHJlc3BvbnNlIHVybCAqL1xuICByZWFkb25seSB1cmw/OiBzdHJpbmc7XG4gIC8qKiBDdWJlU2lnbmVyIGVycm9yIGNvZGUgKi9cbiAgcmVhZG9ubHkgZXJyb3JDb2RlPzogQ3NFcnJDb2RlO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1BhcnRpYWw8RXJyUmVzcG9uc2U+fSBpbml0IEluaXRpYWxpemVyXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihpbml0OiBQYXJ0aWFsPEVyclJlc3BvbnNlPikge1xuICAgIHN1cGVyKGluaXQubWVzc2FnZSk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBpbml0KTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGVycm9yIHRoYXQgaXMgdGhyb3duIHdoZW4gYSBzZXNzaW9uIGhhcyBleHBpcmVkXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXNzaW9uRXhwaXJlZEVycm9yIGV4dGVuZHMgRXJyUmVzcG9uc2Uge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7b3BlcmF0aW9uc30gb3BlcmF0aW9uIFRoZSBvcGVyYXRpb24gdGhhdCB3YXMgYXR0ZW1wdGVkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcGVyYXRpb24/OiBrZXlvZiBvcGVyYXRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgbWVzc2FnZTogXCJTZXNzaW9uIGhhcyBleHBpcmVkXCIsXG4gICAgICBzdGF0dXM6IDQwMyxcbiAgICAgIHN0YXR1c1RleHQ6IFwiRm9yYmlkZGVuXCIsXG4gICAgICBvcGVyYXRpb24sXG4gICAgICBlcnJvckNvZGU6IFwiU2Vzc2lvbkV4cGlyZWRcIixcbiAgICB9KTtcbiAgfVxufVxuIl19