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
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7O0dBRUc7QUFDSCxNQUFNLE9BQU8sV0FBWSxTQUFRLEtBQUs7SUFVcEM7O09BRUc7SUFDSCxZQUFZLElBQTBCO1FBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztTQUNWLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG9wZXJhdGlvbnMgfSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuLyoqXG4gKiBFcnJvciByZXNwb25zZSB0eXBlLCB0aHJvd24gb24gbm9uLXN1Y2Nlc3NmdWwgcmVzcG9uc2VzLlxuICovXG5leHBvcnQgY2xhc3MgRXJyUmVzcG9uc2UgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBPcGVyYXRpb24gdGhhdCBwcm9kdWNlZCB0aGlzIGVycm9yICovXG4gIHJlYWRvbmx5IG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnM7XG4gIC8qKiBIVFRQIHN0YXR1cyBjb2RlIHRleHQgKGRlcml2ZWQgZnJvbSBgdGhpcy5zdGF0dXNgKSAqL1xuICByZWFkb25seSBzdGF0dXNUZXh0Pzogc3RyaW5nO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSAqL1xuICByZWFkb25seSBzdGF0dXM/OiBudW1iZXI7XG4gIC8qKiBIVFRQIHJlc3BvbnNlIHVybCAqL1xuICByZWFkb25seSB1cmw/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UGFydGlhbDxFcnJSZXNwb25zZT59IGluaXQgSW5pdGlhbGl6ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKGluaXQ6IFBhcnRpYWw8RXJyUmVzcG9uc2U+KSB7XG4gICAgc3VwZXIoaW5pdC5tZXNzYWdlKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGluaXQpO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXJyb3IgdGhhdCBpcyB0aHJvd24gd2hlbiBhIHNlc3Npb24gaGFzIGV4cGlyZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFNlc3Npb25FeHBpcmVkRXJyb3IgZXh0ZW5kcyBFcnJSZXNwb25zZSB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtvcGVyYXRpb25zfSBvcGVyYXRpb24gVGhlIG9wZXJhdGlvbiB0aGF0IHdhcyBhdHRlbXB0ZWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wZXJhdGlvbj86IGtleW9mIG9wZXJhdGlvbnMpIHtcbiAgICBzdXBlcih7XG4gICAgICBtZXNzYWdlOiBcIlNlc3Npb24gaGFzIGV4cGlyZWRcIixcbiAgICAgIHN0YXR1czogNDAzLFxuICAgICAgc3RhdHVzVGV4dDogXCJGb3JiaWRkZW5cIixcbiAgICAgIG9wZXJhdGlvbixcbiAgICB9KTtcbiAgfVxufVxuIl19