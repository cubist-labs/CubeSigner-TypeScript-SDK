/** Options to configure the behavior of the retry function */
export type RetryOptions<T> = {
    /** Accepts the result of the fallible operation and returns whether or not to retry (true = retry) */
    pred?: (val: T) => Promise<boolean>;
    /** A sequence of millisecond delays to perform */
    delays?: number[];
};
/**
 * Retry an async function
 *
 * @param f The function that may or may not fail
 * @param opts specifying when, how long, and how many times to retry
 * @param opts.pred Takes result of fallible operation and returns whether or not to retry, defaults to always retrying
 * @param opts.delays Sequence of millisecond delays to perform, defaulting to 100, 200, 400
 * @returns A resolved async function
 */
export declare function retry<T>(f: () => Promise<T>, { pred, delays }: RetryOptions<T>): Promise<T>;
/**
 * A specialization of retry that retries on 5XX errors
 *
 * @param f The function that may return a failing response
 * @param delays The sequence of delays (in milliseconds) between retries
 * @returns The result of the function
 */
export declare function retryOn5XX<T extends {
    response: {
        status: number;
    };
}>(f: () => Promise<T>, delays?: number[]): Promise<T>;
/**
 * Generates a predicate that matches response status codes
 *
 * @param codes The response codes on which we want to retry
 * @returns To be used as a predicate on retry
 */
export declare const onErrorCodes: (codes?: number[]) => (r: {
    response: {
        status: number;
    };
}) => Promise<boolean>;
//# sourceMappingURL=retry.d.ts.map