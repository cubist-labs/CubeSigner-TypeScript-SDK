/** Options to configure the behavior of the retry function */
export type RetryOptions<T> = {
  /** Accepts the result of the fallible operation and returns whether or not to retry (true = retry) */
  pred?: (val: T) => boolean;
  /** A sequence of millisecond delays to perform */
  delays?: number[];
};

// By default we will always retry
const always = () => true;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry an async function
 *
 * @param {Function} f The function that may or namy not fail
 * @param {RetryOptions<T>} opts specifying when, how long, and how many times to retry
 */
export async function retry<T>(
  f: () => Promise<T>,
  { pred = always, delays = [100, 200, 400] }: RetryOptions<T>,
): Promise<T> {
  let resp = await f();
  let i = 0;
  while (pred(resp) && i < delays.length) {
    await delay(delays[i]);
    resp = await f();
    i++;
  }

  return resp;
}

/**
 * A specialization of retry that retries on 5XX errors
 *
 * @param {Function} f The function that may return a failing response
 * @param {number[]} delays The sequence of delays (in milliseconds) between retries
 * @return {T} The result of the function
 */
export async function retryOn5XX<T extends { response: { status: number } }>(
  f: () => Promise<T>,
  delays?: number[],
): Promise<T> {
  return retry(f, { pred: onErrorCodes(), delays });
}

/**
 * Generates a predicate that matches response status codes
 * @param {number[]} codes The response codes on which we want to retry
 * @return {Function} To be used as a predicate on retry
 **/
export const onErrorCodes =
  (codes: number[] = [...Array(100).keys()].map((i) => 500 + i)) =>
  (r: { response: { status: number } }) =>
    codes.includes(r.response.status);
