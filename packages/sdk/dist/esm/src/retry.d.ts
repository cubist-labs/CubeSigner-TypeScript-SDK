/** Options to configure the behavior of the retry function */
export type RetryOptions<T> = {
    /** Accepts the result of the fallible operation and returns whether or not to retry (true = retry) */
    pred?: (val: T) => boolean;
    /** A sequence of millisecond delays to perform */
    delays?: number[];
};
/**
 * Retry an async function
 *
 * @param {Function} f The function that may or namy not fail
 * @param {RetryOptions<T>} opts specifying when, how long, and how many times to retry
 */
export declare function retry<T>(f: () => Promise<T>, { pred, delays }: RetryOptions<T>): Promise<T>;
/**
 * A specialization of retry that retries on 5XX errors
 *
 * @param {Function} f The function that may return a failing response
 * @param {number[]} delays The sequence of delays (in milliseconds) between retries
 * @return {T} The result of the function
 */
export declare function retryOn5XX<T extends {
    response: {
        status: number;
    };
}>(f: () => Promise<T>, delays?: number[]): Promise<T>;
/**
 * Generates a predicate that matches response status codes
 * @param {number[]} codes The response codes on which we want to retry
 * @return {Function} To be used as a predicate on retry
 **/
export declare const onErrorCodes: (codes?: number[]) => (r: {
    response: {
        status: number;
    };
}) => boolean;
