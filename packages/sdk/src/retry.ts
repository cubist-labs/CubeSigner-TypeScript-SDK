/** Options to configure the behavior of the retry function */
export type RetryOptions<T> = {
  /** Accepts the result of the fallible operation and returns whether or not to retry (true = retry) */
  pred?: (val: T) => Promise<boolean>;
  /** A sequence of millisecond delays to perform */
  delays?: number[];
};

// By default we will always retry
const always = async () => true;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry an async function
 *
 * @param f The function that may or may not fail
 * @param opts specifying when, how long, and how many times to retry
 * @param opts.pred Takes result of fallible operation and returns whether or not to retry, defaults to always retrying
 * @param opts.delays Sequence of millisecond delays to perform, defaulting to 100, 200, 400
 * @returns A resolved async function
 */
export async function retry<T>(
  f: () => Promise<T>,
  { pred = always, delays = [100, 200, 400] }: RetryOptions<T>,
): Promise<T> {
  let resp = await f();
  let i = 0;
  while ((await pred(resp)) && i < delays.length) {
    await delay(delays[i]);
    resp = await f();
    i++;
  }

  return resp;
}

/**
 * A specialization of retry that retries on 5XX errors
 *
 * @param f The function that may return a failing response
 * @param delays The sequence of delays (in milliseconds) between retries
 * @returns The result of the function
 */
export async function retryOn5XX<T extends { response: { status: number } }>(
  f: () => Promise<T>,
  delays?: number[],
): Promise<T> {
  return retry(f, { pred: onErrorCodes(), delays });
}

/**
 * Generates a predicate that matches response status codes
 *
 * @param codes The response codes on which we want to retry
 * @returns To be used as a predicate on retry
 */
export const onErrorCodes =
  (codes: number[] = [...Array(100).keys()].map((i) => 500 + i)) =>
  async (r: { response: { status: number } }) =>
    codes.includes(r.response.status);
