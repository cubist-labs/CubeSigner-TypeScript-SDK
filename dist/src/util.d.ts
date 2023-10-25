/** JSON map type */
export interface JsonMap {
    [member: string]: string | number | boolean | null | JsonArray | JsonMap;
}
/** JSON array type */
export type JsonArray = Array<string | number | boolean | null | JsonArray | JsonMap>;
/**
 * Directory where CubeSigner stores config files.
 * @return {string} Config dir
 */
export declare function configDir(): string;
type ResponseType<D, T> = {
    data?: D;
    error?: T;
    response?: Response;
};
/**
 * Error response type, thrown on non-successful responses.
 */
export declare class ErrResponse extends Error {
    /** Description */
    readonly description?: string;
    /** HTTP status code text (derived from `this.status`) */
    readonly statusText?: string;
    /** HTTP status code */
    readonly status?: number;
    /**
     * Constructor
     * @param {Partial<ErrResponse>} init Initializer
     */
    constructor(init: Partial<ErrResponse>);
}
/**
 * Throw if on error response. Otherwise, return the response data.
 * @param {ResponseType} resp The response to check
 * @param {string} description Description to include in the thrown error
 * @return {D} The response data.
 * @internal
 */
export declare function assertOk<D, T>(resp: ResponseType<D, T>, description?: string): D;
export {};
