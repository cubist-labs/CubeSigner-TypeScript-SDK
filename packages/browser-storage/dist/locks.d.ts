/**
 * Used as an argument to {@link readTestAndSet}.
 * Defines the behavior to perform during the locking strategy
 */
export type ReadTestAndSet<T> = {
    /** How to read the data */
    read(): T;
    /** If true, perform set, if false, return v */
    test(v: T): boolean;
    /** Persist the value */
    set(prev: T): Promise<void>;
};
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
export declare function readTestAndSet<T>(lock: string, { read, test, set }: ReadTestAndSet<T>): Promise<T>;
