"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTestAndSet = readTestAndSet;
/**
 * A locking primitive for contentious reads and writes.
 *
 * Guarantees:
 *  1. Set is only called when test(read()) returns true
 *  2. Only 1 set() call is active at a time
 *  3. read() never occurs while set() is running
 *
 * @param lock The name of the lock to use
 * @param spec The set of read, test, and set functions to use
 * @returns The current value
 */
async function readTestAndSet(lock, spec) {
    const { read, test, set } = spec;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ja3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbG9ja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUF5QkEsd0NBY0M7QUExQkQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSSxLQUFLLFVBQVUsY0FBYyxDQUFJLElBQVksRUFBRSxJQUF1QjtJQUMzRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzFGLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDaEIsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckUsTUFBTSxJQUFJLEdBQUcsSUFBSSxFQUFFLENBQUM7WUFDcEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDZixNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNoQixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFVzZWQgYXMgYW4gYXJndW1lbnQgdG8ge0BsaW5rIHJlYWRUZXN0QW5kU2V0fS5cbiAqIERlZmluZXMgdGhlIGJlaGF2aW9yIHRvIHBlcmZvcm0gZHVyaW5nIHRoZSBsb2NraW5nIHN0cmF0ZWd5XG4gKi9cbmV4cG9ydCB0eXBlIFJlYWRUZXN0QW5kU2V0PFQ+ID0ge1xuICAvKiogSG93IHRvIHJlYWQgdGhlIGRhdGEgKi9cbiAgcmVhZCgpOiBUO1xuICAvKiogSWYgdHJ1ZSwgcGVyZm9ybSBzZXQsIGlmIGZhbHNlLCByZXR1cm4gdiAqL1xuICB0ZXN0KHY6IFQpOiBib29sZWFuO1xuICAvKiogUGVyc2lzdCB0aGUgdmFsdWUgKi9cbiAgc2V0KHByZXY6IFQpOiBQcm9taXNlPHZvaWQ+O1xufTtcblxuLyoqXG4gKiBBIGxvY2tpbmcgcHJpbWl0aXZlIGZvciBjb250ZW50aW91cyByZWFkcyBhbmQgd3JpdGVzLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKiAgMS4gU2V0IGlzIG9ubHkgY2FsbGVkIHdoZW4gdGVzdChyZWFkKCkpIHJldHVybnMgdHJ1ZVxuICogIDIuIE9ubHkgMSBzZXQoKSBjYWxsIGlzIGFjdGl2ZSBhdCBhIHRpbWVcbiAqICAzLiByZWFkKCkgbmV2ZXIgb2NjdXJzIHdoaWxlIHNldCgpIGlzIHJ1bm5pbmdcbiAqXG4gKiBAcGFyYW0gbG9jayBUaGUgbmFtZSBvZiB0aGUgbG9jayB0byB1c2VcbiAqIEBwYXJhbSBzcGVjIFRoZSBzZXQgb2YgcmVhZCwgdGVzdCwgYW5kIHNldCBmdW5jdGlvbnMgdG8gdXNlXG4gKiBAcmV0dXJucyBUaGUgY3VycmVudCB2YWx1ZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFRlc3RBbmRTZXQ8VD4obG9jazogc3RyaW5nLCBzcGVjOiBSZWFkVGVzdEFuZFNldDxUPik6IFByb21pc2U8VD4ge1xuICBjb25zdCB7IHJlYWQsIHRlc3QsIHNldCB9ID0gc3BlYztcbiAgY29uc3QgdmFsdWUgPSBhd2FpdCBuYXZpZ2F0b3IubG9ja3MucmVxdWVzdChsb2NrLCB7IG1vZGU6IFwic2hhcmVkXCIgfSwgYXN5bmMgKCkgPT4gcmVhZCgpKTtcbiAgaWYgKHRlc3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIG5hdmlnYXRvci5sb2Nrcy5yZXF1ZXN0KGxvY2ssIHsgbW9kZTogXCJleGNsdXNpdmVcIiB9LCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwcmV2ID0gcmVhZCgpO1xuICAgICAgaWYgKHRlc3QocHJldikpIHtcbiAgICAgICAgYXdhaXQgc2V0KHByZXYpO1xuICAgICAgICByZXR1cm4gcmVhZCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuIl19