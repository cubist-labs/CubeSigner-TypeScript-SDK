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
export async function readTestAndSet(lock, spec) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ja3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbG9ja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBYUE7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLGNBQWMsQ0FBSSxJQUFZLEVBQUUsSUFBdUI7SUFDM0UsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLE1BQU0sU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUMxRixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ2hCLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JFLE1BQU0sSUFBSSxHQUFHLElBQUksRUFBRSxDQUFDO1lBQ3BCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hCLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDaEIsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVc2VkIGFzIGFuIGFyZ3VtZW50IHRvIHtAbGluayByZWFkVGVzdEFuZFNldH0uXG4gKiBEZWZpbmVzIHRoZSBiZWhhdmlvciB0byBwZXJmb3JtIGR1cmluZyB0aGUgbG9ja2luZyBzdHJhdGVneVxuICovXG5leHBvcnQgdHlwZSBSZWFkVGVzdEFuZFNldDxUPiA9IHtcbiAgLyoqIEhvdyB0byByZWFkIHRoZSBkYXRhICovXG4gIHJlYWQoKTogVDtcbiAgLyoqIElmIHRydWUsIHBlcmZvcm0gc2V0LCBpZiBmYWxzZSwgcmV0dXJuIHYgKi9cbiAgdGVzdCh2OiBUKTogYm9vbGVhbjtcbiAgLyoqIFBlcnNpc3QgdGhlIHZhbHVlICovXG4gIHNldChwcmV2OiBUKTogUHJvbWlzZTx2b2lkPjtcbn07XG5cbi8qKlxuICogQSBsb2NraW5nIHByaW1pdGl2ZSBmb3IgY29udGVudGlvdXMgcmVhZHMgYW5kIHdyaXRlcy5cbiAqXG4gKiBHdWFyYW50ZWVzOlxuICogIDEuIFNldCBpcyBvbmx5IGNhbGxlZCB3aGVuIHRlc3QocmVhZCgpKSByZXR1cm5zIHRydWVcbiAqICAyLiBPbmx5IDEgc2V0KCkgY2FsbCBpcyBhY3RpdmUgYXQgYSB0aW1lXG4gKiAgMy4gcmVhZCgpIG5ldmVyIG9jY3VycyB3aGlsZSBzZXQoKSBpcyBydW5uaW5nXG4gKlxuICogQHBhcmFtIGxvY2sgVGhlIG5hbWUgb2YgdGhlIGxvY2sgdG8gdXNlXG4gKiBAcGFyYW0gc3BlYyBUaGUgc2V0IG9mIHJlYWQsIHRlc3QsIGFuZCBzZXQgZnVuY3Rpb25zIHRvIHVzZVxuICogQHJldHVybnMgVGhlIGN1cnJlbnQgdmFsdWVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRUZXN0QW5kU2V0PFQ+KGxvY2s6IHN0cmluZywgc3BlYzogUmVhZFRlc3RBbmRTZXQ8VD4pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgeyByZWFkLCB0ZXN0LCBzZXQgfSA9IHNwZWM7XG4gIGNvbnN0IHZhbHVlID0gYXdhaXQgbmF2aWdhdG9yLmxvY2tzLnJlcXVlc3QobG9jaywgeyBtb2RlOiBcInNoYXJlZFwiIH0sIGFzeW5jICgpID0+IHJlYWQoKSk7XG4gIGlmICh0ZXN0KHZhbHVlKSkge1xuICAgIHJldHVybiBuYXZpZ2F0b3IubG9ja3MucmVxdWVzdChsb2NrLCB7IG1vZGU6IFwiZXhjbHVzaXZlXCIgfSwgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcHJldiA9IHJlYWQoKTtcbiAgICAgIGlmICh0ZXN0KHByZXYpKSB7XG4gICAgICAgIGF3YWl0IHNldChwcmV2KTtcbiAgICAgICAgcmV0dXJuIHJlYWQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH0pO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cbiJdfQ==