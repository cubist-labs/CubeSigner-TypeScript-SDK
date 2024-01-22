import { CsErrCode } from "./schema_types";
import { operations } from "./schema";
/**
 * Error response type, thrown on non-successful responses.
 */
export declare class ErrResponse extends Error {
    /** Operation that produced this error */
    readonly operation?: keyof operations;
    /** HTTP status code text (derived from `this.status`) */
    readonly statusText?: string;
    /** HTTP status code */
    readonly status?: number;
    /** HTTP response url */
    readonly url?: string;
    /** CubeSigner error code */
    readonly errorCode?: CsErrCode;
    /**
     * @param {Partial<ErrResponse>} init Initializer
     */
    constructor(init: Partial<ErrResponse>);
}
/**
 * An error that is thrown when a session has expired
 */
export declare class SessionExpiredError extends ErrResponse {
    /**
     * Constructor.
     *
     * @param {operations} operation The operation that was attempted
     */
    constructor(operation?: keyof operations);
}
