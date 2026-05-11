/**
 * Converts a bigint to a big-endian Uint8Array of a specified length
 *
 * @param n The value to convert
 * @param l The length in bytes
 * @returns The big-endian bytes
 */
export declare function toBigEndian(n: bigint, l: number): Uint8Array;
/**
 * Concatenates an array of Uint8Arrays into a single array
 *
 * @param parts The parts to be concatenated
 * @returns The concatenated array
 */
export declare function concatArrays(parts: Uint8Array[]): Uint8Array;
/**
 * Get the current time in seconds since UNIX epoch
 *
 * @returns Seconds since UNIX epoch
 */
export declare function nowEpochMillis(): bigint;
//# sourceMappingURL=util.d.ts.map