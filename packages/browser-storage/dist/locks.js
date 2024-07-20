"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTestAndSet = void 0;
/**
 * A locking primitive for contentious reads and writes.
 *
 * Guarantees:
 *  1. Set is only called when test(read()) returns true
 *  2. Only 1 set() call is active at a time
 *  3. read() never occurs while set() is running
 *
 * @param {string} lock The name of the lock to use
 * @param {ReadTestAndSet} spec The set of read, test, and set functions to use
 * @return {Promise<T>} The current value
 */
async function readTestAndSet(lock, { read, test, set }) {
    const value = await navigator.locks.request(lock, { mode: "shared" }, async () => read());
    if (test(value)) {
        return navigator.locks.request(lock, { mode: "exclusive" }, async () => {
            const prev = read();
            if (test(prev)) {
                await set(prev);
                return read();
            }
            return prev;
        });
    }
    return value;
}
exports.readTestAndSet = readTestAndSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ja3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbG9ja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBYUE7Ozs7Ozs7Ozs7O0dBV0c7QUFDSSxLQUFLLFVBQVUsY0FBYyxDQUNsQyxJQUFZLEVBQ1osRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBcUI7SUFFdEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzFGLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDaEIsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckUsTUFBTSxJQUFJLEdBQUcsSUFBSSxFQUFFLENBQUM7WUFDcEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDZixNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNoQixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFoQkQsd0NBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVc2VkIGFzIGFuIGFyZ3VtZW50IHRvIHtAbGluayByZWFkVGVzdEFuZFNldH0uXG4gKiBEZWZpbmVzIHRoZSBiZWhhdmlvciB0byBwZXJmb3JtIGR1cmluZyB0aGUgbG9ja2luZyBzdHJhdGVneVxuICovXG5leHBvcnQgdHlwZSBSZWFkVGVzdEFuZFNldDxUPiA9IHtcbiAgLyoqIEhvdyB0byByZWFkIHRoZSBkYXRhICovXG4gIHJlYWQoKTogVDtcbiAgLyoqIElmIHRydWUsIHBlcmZvcm0gc2V0LCBpZiBmYWxzZSwgcmV0dXJuIHYgKi9cbiAgdGVzdCh2OiBUKTogYm9vbGVhbjtcbiAgLyoqIFBlcnNpc3QgdGhlIHZhbHVlICovXG4gIHNldChwcmV2OiBUKTogUHJvbWlzZTx2b2lkPjtcbn07XG5cbi8qKlxuICogQSBsb2NraW5nIHByaW1pdGl2ZSBmb3IgY29udGVudGlvdXMgcmVhZHMgYW5kIHdyaXRlcy5cbiAqXG4gKiBHdWFyYW50ZWVzOlxuICogIDEuIFNldCBpcyBvbmx5IGNhbGxlZCB3aGVuIHRlc3QocmVhZCgpKSByZXR1cm5zIHRydWVcbiAqICAyLiBPbmx5IDEgc2V0KCkgY2FsbCBpcyBhY3RpdmUgYXQgYSB0aW1lXG4gKiAgMy4gcmVhZCgpIG5ldmVyIG9jY3VycyB3aGlsZSBzZXQoKSBpcyBydW5uaW5nXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGxvY2sgVGhlIG5hbWUgb2YgdGhlIGxvY2sgdG8gdXNlXG4gKiBAcGFyYW0ge1JlYWRUZXN0QW5kU2V0fSBzcGVjIFRoZSBzZXQgb2YgcmVhZCwgdGVzdCwgYW5kIHNldCBmdW5jdGlvbnMgdG8gdXNlXG4gKiBAcmV0dXJuIHtQcm9taXNlPFQ+fSBUaGUgY3VycmVudCB2YWx1ZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFRlc3RBbmRTZXQ8VD4oXG4gIGxvY2s6IHN0cmluZyxcbiAgeyByZWFkLCB0ZXN0LCBzZXQgfTogUmVhZFRlc3RBbmRTZXQ8VD4sXG4pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgdmFsdWUgPSBhd2FpdCBuYXZpZ2F0b3IubG9ja3MucmVxdWVzdChsb2NrLCB7IG1vZGU6IFwic2hhcmVkXCIgfSwgYXN5bmMgKCkgPT4gcmVhZCgpKTtcbiAgaWYgKHRlc3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIG5hdmlnYXRvci5sb2Nrcy5yZXF1ZXN0KGxvY2ssIHsgbW9kZTogXCJleGNsdXNpdmVcIiB9LCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwcmV2ID0gcmVhZCgpO1xuICAgICAgaWYgKHRlc3QocHJldikpIHtcbiAgICAgICAgYXdhaXQgc2V0KHByZXYpO1xuICAgICAgICByZXR1cm4gcmVhZCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuIl19