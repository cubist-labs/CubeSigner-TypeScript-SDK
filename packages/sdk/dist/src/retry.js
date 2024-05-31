"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onErrorCodes = exports.retryOn5XX = exports.retry = void 0;
// By default we will always retry
const always = () => true;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Retry an async function
 *
 * @param {Function} f The function that may or namy not fail
 * @param {RetryOptions<T>} opts specifying when, how long, and how many times to retry
 */
async function retry(f, { pred = always, delays = [100, 200, 400] }) {
    let resp = await f();
    let i = 0;
    while (pred(resp) && i < delays.length) {
        await delay(delays[i]);
        resp = await f();
        i++;
    }
    return resp;
}
exports.retry = retry;
/**
 * A specialization of retry that retries on 5XX errors
 *
 * @param {Function} f The function that may return a failing response
 * @param {number[]} delays The sequence of delays (in milliseconds) between retries
 * @return {T} The result of the function
 */
async function retryOn5XX(f, delays) {
    return retry(f, { pred: (0, exports.onErrorCodes)(), delays });
}
exports.retryOn5XX = retryOn5XX;
/**
 * Generates a predicate that matches response status codes
 * @param {number[]} codes The response codes on which we want to retry
 * @return {Function} To be used as a predicate on retry
 **/
const onErrorCodes = (codes = [...Array(100).keys()].map((i) => 500 + i)) => (r) => codes.includes(r.response.status);
exports.onErrorCodes = onErrorCodes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmV0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBUUEsa0NBQWtDO0FBQ2xDLE1BQU0sTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztBQUUxQixNQUFNLEtBQUssR0FBRyxDQUFDLEVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUVoRjs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxLQUFLLENBQ3pCLENBQW1CLEVBQ25CLEVBQUUsSUFBSSxHQUFHLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFtQjtJQUU1RCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ3RDLE1BQU0sS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ2pCLENBQUMsRUFBRSxDQUFDO0tBQ0w7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFiRCxzQkFhQztBQUVEOzs7Ozs7R0FNRztBQUNJLEtBQUssVUFBVSxVQUFVLENBQzlCLENBQW1CLEVBQ25CLE1BQWlCO0lBRWpCLE9BQU8sS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFBLG9CQUFZLEdBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFMRCxnQ0FLQztBQUVEOzs7O0lBSUk7QUFDRyxNQUFNLFlBQVksR0FDdkIsQ0FBQyxRQUFrQixDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUNqRSxDQUFDLENBQW1DLEVBQUUsRUFBRSxDQUN0QyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFIekIsUUFBQSxZQUFZLGdCQUdhIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIE9wdGlvbnMgdG8gY29uZmlndXJlIHRoZSBiZWhhdmlvciBvZiB0aGUgcmV0cnkgZnVuY3Rpb24gKi9cbmV4cG9ydCB0eXBlIFJldHJ5T3B0aW9uczxUPiA9IHtcbiAgLyoqIEFjY2VwdHMgdGhlIHJlc3VsdCBvZiB0aGUgZmFsbGlibGUgb3BlcmF0aW9uIGFuZCByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRvIHJldHJ5ICh0cnVlID0gcmV0cnkpICovXG4gIHByZWQ/OiAodmFsOiBUKSA9PiBib29sZWFuO1xuICAvKiogQSBzZXF1ZW5jZSBvZiBtaWxsaXNlY29uZCBkZWxheXMgdG8gcGVyZm9ybSAqL1xuICBkZWxheXM/OiBudW1iZXJbXTtcbn07XG5cbi8vIEJ5IGRlZmF1bHQgd2Ugd2lsbCBhbHdheXMgcmV0cnlcbmNvbnN0IGFsd2F5cyA9ICgpID0+IHRydWU7XG5cbmNvbnN0IGRlbGF5ID0gKG1zOiBudW1iZXIpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG5cbi8qKlxuICogUmV0cnkgYW4gYXN5bmMgZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmIFRoZSBmdW5jdGlvbiB0aGF0IG1heSBvciBuYW15IG5vdCBmYWlsXG4gKiBAcGFyYW0ge1JldHJ5T3B0aW9uczxUPn0gb3B0cyBzcGVjaWZ5aW5nIHdoZW4sIGhvdyBsb25nLCBhbmQgaG93IG1hbnkgdGltZXMgdG8gcmV0cnlcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJldHJ5PFQ+KFxuICBmOiAoKSA9PiBQcm9taXNlPFQ+LFxuICB7IHByZWQgPSBhbHdheXMsIGRlbGF5cyA9IFsxMDAsIDIwMCwgNDAwXSB9OiBSZXRyeU9wdGlvbnM8VD4sXG4pOiBQcm9taXNlPFQ+IHtcbiAgbGV0IHJlc3AgPSBhd2FpdCBmKCk7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKHByZWQocmVzcCkgJiYgaSA8IGRlbGF5cy5sZW5ndGgpIHtcbiAgICBhd2FpdCBkZWxheShkZWxheXNbaV0pO1xuICAgIHJlc3AgPSBhd2FpdCBmKCk7XG4gICAgaSsrO1xuICB9XG5cbiAgcmV0dXJuIHJlc3A7XG59XG5cbi8qKlxuICogQSBzcGVjaWFsaXphdGlvbiBvZiByZXRyeSB0aGF0IHJldHJpZXMgb24gNVhYIGVycm9yc1xuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGYgVGhlIGZ1bmN0aW9uIHRoYXQgbWF5IHJldHVybiBhIGZhaWxpbmcgcmVzcG9uc2VcbiAqIEBwYXJhbSB7bnVtYmVyW119IGRlbGF5cyBUaGUgc2VxdWVuY2Ugb2YgZGVsYXlzIChpbiBtaWxsaXNlY29uZHMpIGJldHdlZW4gcmV0cmllc1xuICogQHJldHVybiB7VH0gVGhlIHJlc3VsdCBvZiB0aGUgZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJldHJ5T241WFg8VCBleHRlbmRzIHsgcmVzcG9uc2U6IHsgc3RhdHVzOiBudW1iZXIgfSB9PihcbiAgZjogKCkgPT4gUHJvbWlzZTxUPixcbiAgZGVsYXlzPzogbnVtYmVyW10sXG4pOiBQcm9taXNlPFQ+IHtcbiAgcmV0dXJuIHJldHJ5KGYsIHsgcHJlZDogb25FcnJvckNvZGVzKCksIGRlbGF5cyB9KTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgdGhhdCBtYXRjaGVzIHJlc3BvbnNlIHN0YXR1cyBjb2Rlc1xuICogQHBhcmFtIHtudW1iZXJbXX0gY29kZXMgVGhlIHJlc3BvbnNlIGNvZGVzIG9uIHdoaWNoIHdlIHdhbnQgdG8gcmV0cnlcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUbyBiZSB1c2VkIGFzIGEgcHJlZGljYXRlIG9uIHJldHJ5XG4gKiovXG5leHBvcnQgY29uc3Qgb25FcnJvckNvZGVzID1cbiAgKGNvZGVzOiBudW1iZXJbXSA9IFsuLi5BcnJheSgxMDApLmtleXMoKV0ubWFwKChpKSA9PiA1MDAgKyBpKSkgPT5cbiAgKHI6IHsgcmVzcG9uc2U6IHsgc3RhdHVzOiBudW1iZXIgfSB9KSA9PlxuICAgIGNvZGVzLmluY2x1ZGVzKHIucmVzcG9uc2Uuc3RhdHVzKTtcbiJdfQ==