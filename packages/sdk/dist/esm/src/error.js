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
            errorCode: "SessionExpired",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7O0dBRUc7QUFDSCxNQUFNLE9BQU8sV0FBWSxTQUFRLEtBQUs7SUFZcEM7O09BRUc7SUFDSCxZQUFZLElBQTBCO1FBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sbUJBQW9CLFNBQVEsV0FBVztJQUNsRDs7OztPQUlHO0lBQ0gsWUFBWSxTQUE0QjtRQUN0QyxLQUFLLENBQUM7WUFDSixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLE1BQU0sRUFBRSxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVc7WUFDdkIsU0FBUztZQUNULFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3NFcnJDb2RlIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBvcGVyYXRpb25zIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbi8qKlxuICogRXJyb3IgcmVzcG9uc2UgdHlwZSwgdGhyb3duIG9uIG5vbi1zdWNjZXNzZnVsIHJlc3BvbnNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEVyclJlc3BvbnNlIGV4dGVuZHMgRXJyb3Ige1xuICAvKiogT3BlcmF0aW9uIHRoYXQgcHJvZHVjZWQgdGhpcyBlcnJvciAqL1xuICByZWFkb25seSBvcGVyYXRpb24/OiBrZXlvZiBvcGVyYXRpb25zO1xuICAvKiogSFRUUCBzdGF0dXMgY29kZSB0ZXh0IChkZXJpdmVkIGZyb20gYHRoaXMuc3RhdHVzYCkgKi9cbiAgcmVhZG9ubHkgc3RhdHVzVGV4dD86IHN0cmluZztcbiAgLyoqIEhUVFAgc3RhdHVzIGNvZGUgKi9cbiAgcmVhZG9ubHkgc3RhdHVzPzogbnVtYmVyO1xuICAvKiogSFRUUCByZXNwb25zZSB1cmwgKi9cbiAgcmVhZG9ubHkgdXJsPzogc3RyaW5nO1xuICAvKiogQ3ViZVNpZ25lciBlcnJvciBjb2RlICovXG4gIHJlYWRvbmx5IGVycm9yQ29kZT86IENzRXJyQ29kZTtcblxuICAvKipcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEVyclJlc3BvbnNlPn0gaW5pdCBJbml0aWFsaXplclxuICAgKi9cbiAgY29uc3RydWN0b3IoaW5pdDogUGFydGlhbDxFcnJSZXNwb25zZT4pIHtcbiAgICBzdXBlcihpbml0Lm1lc3NhZ2UpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgaW5pdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBlcnJvciB0aGF0IGlzIHRocm93biB3aGVuIGEgc2Vzc2lvbiBoYXMgZXhwaXJlZFxuICovXG5leHBvcnQgY2xhc3MgU2Vzc2lvbkV4cGlyZWRFcnJvciBleHRlbmRzIEVyclJlc3BvbnNlIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge29wZXJhdGlvbnN9IG9wZXJhdGlvbiBUaGUgb3BlcmF0aW9uIHRoYXQgd2FzIGF0dGVtcHRlZFxuICAgKi9cbiAgY29uc3RydWN0b3Iob3BlcmF0aW9uPzoga2V5b2Ygb3BlcmF0aW9ucykge1xuICAgIHN1cGVyKHtcbiAgICAgIG1lc3NhZ2U6IFwiU2Vzc2lvbiBoYXMgZXhwaXJlZFwiLFxuICAgICAgc3RhdHVzOiA0MDMsXG4gICAgICBzdGF0dXNUZXh0OiBcIkZvcmJpZGRlblwiLFxuICAgICAgb3BlcmF0aW9uLFxuICAgICAgZXJyb3JDb2RlOiBcIlNlc3Npb25FeHBpcmVkXCIsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==